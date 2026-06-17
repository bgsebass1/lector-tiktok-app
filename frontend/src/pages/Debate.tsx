import { useState } from "react";
import { api } from "../lib/api";
import { notifyGrokError } from "../lib/notify";

interface Debater { name: string; postura: string; apertura: string }

/** MODO DEBATE (G17) — defiende tu tesis ante 3 contrincantes. */
export default function Debate() {
  const [thesis, setThesis] = useState("");
  const [debaters, setDebaters] = useState<Debater[]>([]);
  const [replies, setReplies] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);

  async function start() {
    if (!thesis.trim()) return;
    setBusy(true);
    setFeedback("");
    try {
      const { debatientes } = await api.debateStart(thesis.trim());
      setDebaters(debatientes);
      setReplies(debatientes.map(() => ""));
    } catch (e) {
      notifyGrokError(e);
    } finally {
      setBusy(false);
    }
  }

  async function getFeedback() {
    setBusy(true);
    try {
      const transcript = debaters
        .map((d, i) => `${d.name} (${d.postura}): ${d.apertura}\nTú: ${replies[i] || "(sin respuesta)"}`)
        .join("\n\n");
      const { text } = await api.debateFeedback(thesis, transcript);
      setFeedback(text);
    } catch (e) {
      notifyGrokError(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4">
        <h1 className="text-4xl text-cream">Modo debate</h1>
        <p className="mt-1 text-muted">Escribe una tesis y defiéndela ante tres mentes que te retarán.</p>
      </div>

      <div className="flex gap-2">
        <input value={thesis} onChange={(e) => setThesis(e.target.value)} placeholder="TikTok degrada la atención…" className="input" />
        <button onClick={start} disabled={busy || !thesis.trim()} className="btn-gold shrink-0">{busy && !debaters.length ? "…" : "Debatir"}</button>
      </div>

      {debaters.length > 0 && (
        <div className="mt-6 space-y-4">
          {debaters.map((d, i) => (
            <div key={i} className="card p-4">
              <div className="text-gold">{d.name}</div>
              <div className="text-xs uppercase tracking-wide text-muted">{d.postura}</div>
              <p className="mt-2 font-serif text-cream/90">{d.apertura}</p>
              <textarea
                value={replies[i]}
                onChange={(e) => setReplies((r) => r.map((x, j) => (j === i ? e.target.value : x)))}
                placeholder="Tu respuesta…"
                className="input mt-3 min-h-[70px] resize-y"
              />
            </div>
          ))}
          <button onClick={getFeedback} disabled={busy} className="btn-gold w-full">{busy ? "Evaluando…" : "Pedir feedback de mi defensa"}</button>
        </div>
      )}

      {feedback && (
        <div className="mt-5 rounded-xl border border-gold/40 bg-gold/5 p-5">
          <div className="mb-2 text-sm text-gold">⚖️ Feedback de tu defensa</div>
          <p className="whitespace-pre-wrap font-serif leading-relaxed text-cream">{feedback}</p>
        </div>
      )}
    </div>
  );
}
