import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, type Author } from "../lib/api";
import { notifyGrokError } from "../lib/notify";

interface Msg {
  speaker: "a" | "b" | "yo";
  name: string;
  text: string;
}

/** CONVERSACIONES CRUZADAS (G9) — dos autores debaten un tema. */
export default function DialogosCruce() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [aId, setAId] = useState("");
  const [bId, setBId] = useState("");
  const [topic, setTopic] = useState("");
  const [started, setStarted] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [running, setRunning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [intervene, setIntervene] = useState("");
  const [script, setScript] = useState<string | null>(null);
  const runRef = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.listAuthors().then((a) => {
      setAuthors(a);
      if (a[0]) setAId(a[0].id);
      if (a[1]) setBId(a[1].id);
    }).catch(() => {});
  }, []);

  const A = authors.find((x) => x.id === aId);
  const B = authors.find((x) => x.id === bId);

  function transcript(list: Msg[]): string {
    return list.map((m) => `${m.name}: ${m.text}`).join("\n");
  }

  async function step(list: Msg[], speaker: "a" | "b"): Promise<Msg[]> {
    const who = speaker === "a" ? A : B;
    if (!who) return list;
    const { reply } = await api.dialogueCross(aId, bId, topic, transcript(list), speaker);
    return [...list, { speaker, name: who.name, text: reply }];
  }

  async function start() {
    if (!A || !B || aId === bId) return;
    setStarted(true);
    setMsgs([]);
    setScript(null);
    runRef.current = true;
    setRunning(true);
    loop([], "a");
  }

  // Bucle: alterna A/B mientras running.
  async function loop(list: Msg[], speaker: "a" | "b") {
    if (!runRef.current) return;
    setBusy(true);
    try {
      const next = await step(list, speaker);
      setMsgs(next);
      setBusy(false);
      if (!runRef.current) return;
      await new Promise((r) => setTimeout(r, 1400));
      loop(next, speaker === "a" ? "b" : "a");
    } catch (e) {
      notifyGrokError(e);
      setBusy(false);
      pause();
    }
  }

  function pause() {
    runRef.current = false;
    setRunning(false);
  }

  function resume() {
    runRef.current = true;
    setRunning(true);
    const last = msgs[msgs.length - 1];
    const nextSpeaker = last?.speaker === "a" ? "b" : "a";
    loop(msgs, nextSpeaker);
  }

  function sendIntervention() {
    const text = intervene.trim();
    if (!text) return;
    const next = [...msgs, { speaker: "yo" as const, name: "Tú", text }];
    setMsgs(next);
    setIntervene("");
    if (!runRef.current) {
      runRef.current = true;
      setRunning(true);
      loop(next, "a");
    }
  }

  async function toScript() {
    pause();
    setBusy(true);
    try {
      const { script } = await api.toScript(transcript(msgs));
      setScript(script);
    } catch (e) {
      notifyGrokError(e);
    } finally {
      setBusy(false);
    }
  }

  if (!started) {
    return (
      <div className="mx-auto max-w-lg">
        <div className="mb-6">
          <h1 className="text-4xl text-cream">Cruce de autores</h1>
          <p className="mt-1 text-muted">Pon a dos mentes a debatir un tema. Puedes intervenir cuando quieras.</p>
        </div>
        <label className="text-sm text-muted">Primer autor</label>
        <select value={aId} onChange={(e) => setAId(e.target.value)} className="input mt-1">
          {authors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <label className="mt-4 block text-sm text-muted">Segundo autor</label>
        <select value={bId} onChange={(e) => setBId(e.target.value)} className="input mt-1">
          {authors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <label className="mt-4 block text-sm text-muted">Tema</label>
        <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="la libertad, Dios, el arte…" className="input mt-1" />
        <button onClick={start} disabled={!topic.trim() || aId === bId} className="btn-gold mt-5 w-full disabled:opacity-40">
          {aId === bId ? "Elige dos autores distintos" : "Comenzar el cruce"}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="font-display text-2xl text-cream">{A?.name} <span className="text-muted">vs</span> {B?.name}</h1>
        <button onClick={() => { pause(); setStarted(false); }} className="text-sm text-muted hover:text-cream">← Cambiar</button>
      </div>
      <p className="mb-4 text-sm text-muted">Sobre: {topic}</p>

      <div className="space-y-3">
        {msgs.map((m, i) => (
          <div key={i} className={`max-w-[85%] rounded-xl border p-3 ${m.speaker === "yo" ? "ml-auto border-gold/40 bg-gold/5" : m.speaker === "a" ? "border-border bg-surface" : "border-border bg-carbon"}`}>
            <div className="text-xs" style={{ color: m.speaker === "a" ? A?.accent : m.speaker === "b" ? B?.accent : "rgb(var(--gold))" }}>{m.name}</div>
            <p className="mt-1 font-serif text-cream/90">{m.text}</p>
          </div>
        ))}
        {busy && <p className="font-serif italic text-muted">pensando…</p>}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {running ? (
          <button onClick={pause} className="btn-ghost">⏸ Pausar</button>
        ) : (
          <button onClick={resume} className="btn-gold">▶ Continuar</button>
        )}
        <button onClick={toScript} disabled={busy || msgs.length < 2} className="btn-ghost">🎬 Convertir en guion</button>
      </div>

      <div className="mt-3 flex gap-2">
        <input value={intervene} onChange={(e) => setIntervene(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendIntervention()} placeholder="Intervén en la conversación…" className="input" />
        <button onClick={sendIntervention} disabled={!intervene.trim()} className="btn-ghost shrink-0">Enviar</button>
      </div>

      {script && (
        <div className="mt-5 rounded-xl border border-gold/40 bg-gold/5 p-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-gold">🎬 Guion</span>
            <button onClick={() => navigate("/crear")} className="text-xs text-muted hover:text-gold">Ir a Crear →</button>
          </div>
          <p className="whitespace-pre-wrap font-serif leading-relaxed text-cream">{script}</p>
        </div>
      )}
    </div>
  );
}
