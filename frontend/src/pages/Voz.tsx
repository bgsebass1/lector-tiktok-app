import { useEffect, useRef, useState } from "react";
import { api, type Script } from "../lib/api";
import { notifyOk, notifyError } from "../lib/notify";

/* ---------- IndexedDB mínimo para las grabaciones ---------- */
interface Take {
  id: number;
  title: string;
  blob: Blob;
  durationSec: number;
  words: number;
  wpm: number;
  pauses: number;
  createdAt: number;
}
function idb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("pliego-voz", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("takes", { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function saveTake(t: Take) {
  const db = await idb();
  await new Promise((res, rej) => {
    const tx = db.transaction("takes", "readwrite");
    tx.objectStore("takes").put(t);
    tx.oncomplete = () => res(null);
    tx.onerror = () => rej(tx.error);
  });
}
async function allTakes(): Promise<Take[]> {
  const db = await idb();
  return new Promise((res, rej) => {
    const tx = db.transaction("takes", "readonly");
    const r = tx.objectStore("takes").getAll();
    r.onsuccess = () => res((r.result as Take[]).sort((a, b) => b.createdAt - a.createdAt));
    r.onerror = () => rej(r.error);
  });
}

/* ---------- Análisis de pausas (silencios) ---------- */
async function analyze(blob: Blob): Promise<{ durationSec: number; pauses: number }> {
  try {
    const buf = await blob.arrayBuffer();
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const audio = await ctx.decodeAudioData(buf);
    const data = audio.getChannelData(0);
    const sr = audio.sampleRate;
    const win = Math.floor(sr * 0.05); // ventanas de 50ms
    let pauses = 0;
    let silentRun = 0;
    for (let i = 0; i < data.length; i += win) {
      let sum = 0;
      for (let j = i; j < i + win && j < data.length; j++) sum += data[j] * data[j];
      const rms = Math.sqrt(sum / win);
      if (rms < 0.01) {
        silentRun++;
        if (silentRun === 10) pauses++; // ~0.5s de silencio = una pausa
      } else {
        silentRun = 0;
      }
    }
    ctx.close();
    return { durationSec: audio.duration, pauses };
  } catch {
    return { durationSec: 0, pauses: 0 };
  }
}

/** ESTUDIO DE VOZ (G4) — teleprompter + grabación + métricas. */
export default function Voz() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [text, setText] = useState("");
  const [wpm, setWpm] = useState(130);
  const [scrolling, setScrolling] = useState(false);
  const [recording, setRecording] = useState(false);
  const [take, setTake] = useState<Take | null>(null);
  const [prev, setPrev] = useState<Take | null>(null);

  const promptRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | undefined>(undefined);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startRef = useRef(0);

  useEffect(() => {
    api.listScripts().then(setScripts).catch(() => {});
    allTakes().then((t) => setPrev(t[0] ?? null)).catch(() => {});
  }, []);

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  function pickScript(id: string) {
    const s = scripts.find((x) => String(x.id) === id);
    if (s) setText(s.blocks.map((b) => b.content).join("\n\n"));
  }

  /* Teleprompter */
  function toggleScroll() {
    if (scrolling) { stopScroll(); return; }
    const el = promptRef.current;
    if (!el) return;
    setScrolling(true);
    const totalSec = Math.max(5, (words / wpm) * 60);
    const distance = el.scrollHeight - el.clientHeight;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      el.scrollTop += (distance / totalSec) * dt;
      if (el.scrollTop < distance - 1) rafRef.current = requestAnimationFrame(tick);
      else setScrolling(false);
    };
    rafRef.current = requestAnimationFrame(tick);
  }
  function stopScroll() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setScrolling(false);
  }

  /* Grabación */
  async function toggleRecord() {
    if (recording) {
      recRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      recRef.current = rec;
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const { durationSec, pauses } = await analyze(blob);
        const dur = durationSec || (Date.now() - startRef.current) / 1000;
        const realWpm = dur > 0 ? Math.round((words / dur) * 60) : 0;
        const t: Take = { id: Date.now(), title: `Take ${new Date().toLocaleString("es-CO")}`, blob, durationSec: dur, words, wpm: realWpm, pauses, createdAt: Date.now() };
        setTake(t);
      };
      startRef.current = Date.now();
      rec.start();
      setRecording(true);
      rec.addEventListener("stop", () => setRecording(false));
    } catch {
      notifyError(new Error("No se pudo acceder al micrófono. Da permiso e intenta de nuevo."));
    }
  }

  async function save() {
    if (!take) return;
    try {
      await saveTake(take);
      setPrev(take);
      notifyOk("Grabación guardada.");
    } catch {
      notifyError(new Error("No se pudo guardar la grabación."));
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4">
        <h1 className="text-4xl text-cream">Estudio de voz</h1>
        <p className="mt-1 text-muted">Practica la entrega de tus guiones: teleprompter + grabación + ritmo.</p>
      </div>

      {/* Origen del texto */}
      {scripts.length > 0 && (
        <select onChange={(e) => pickScript(e.target.value)} defaultValue="" className="input mb-3">
          <option value="" disabled>Elige un guion…</option>
          {scripts.map((s) => <option key={s.id} value={s.id}>{s.title || `Guion ${s.id}`}</option>)}
        </select>
      )}
      <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Pega aquí tu guion o elige uno arriba…" className="input mb-3 min-h-[80px] resize-y" />

      {/* Controles teleprompter */}
      <div className="mb-2 flex items-center gap-3 text-sm">
        <span className="text-muted">Velocidad</span>
        <input type="range" min={70} max={220} step={5} value={wpm} onChange={(e) => setWpm(Number(e.target.value))} className="flex-1 accent-gold" />
        <span className="w-20 font-mono text-cream">{wpm} ppm</span>
      </div>

      {/* Teleprompter */}
      <div ref={promptRef} className="card max-h-[40vh] overflow-y-auto p-6 font-serif text-2xl leading-relaxed text-cream">
        {text || <span className="text-muted">Tu guion aparecerá aquí grande para leerlo.</span>}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={toggleScroll} disabled={!text} className="btn-ghost">{scrolling ? "⏸ Pausar scroll" : "▶ Teleprompter"}</button>
        <button onClick={toggleRecord} disabled={!text} className={`btn-gold ${recording ? "animate-pulse" : ""}`}>
          {recording ? "⏹ Detener grabación" : "🎙️ Grabar mi voz"}
        </button>
        <span className="self-center text-sm text-muted">{words} palabras</span>
      </div>

      {/* Resultado del take */}
      {take && (
        <div className="mt-5 rounded-xl border border-border bg-surface/60 p-5">
          <audio src={URL.createObjectURL(take.blob)} controls className="w-full" />
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <Stat label="Duración" value={`${Math.round(take.durationSec)}s`} />
            <Stat label="Ritmo real" value={`${take.wpm} ppm`} color={take.wpm > wpm + 25 ? "text-rose-400" : take.wpm < wpm - 25 ? "text-amber-400" : "text-emerald-400"} />
            <Stat label="Pausas" value={String(take.pauses)} />
          </div>
          <p className="mt-3 text-sm text-muted">
            Objetivo {wpm} ppm · {take.wpm > wpm ? "vas más rápido" : take.wpm < wpm ? "vas más lento" : "ritmo perfecto"} de lo planeado.
            {prev && prev.id !== take.id && ` Antes: ${prev.wpm} ppm (${take.wpm - prev.wpm >= 0 ? "+" : ""}${take.wpm - prev.wpm}).`}
          </p>
          <button onClick={save} className="btn-gold mt-3">💾 Guardar grabación</button>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color = "text-cream" }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg border border-border bg-carbon p-3">
      <div className={`font-mono text-xl ${color}`}>{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wide text-muted">{label}</div>
    </div>
  );
}
