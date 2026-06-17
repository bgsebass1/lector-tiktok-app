import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { notifyOk, notifyGrokError } from "../lib/notify";

interface Line {
  who: "yo" | "ia";
  text: string;
}

/** CADÁVER EXQUISITO (G2) — escritura colaborativa surrealista con la IA. */
export default function CadaverExquisito() {
  const [lines, setLines] = useState<Line[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [script, setScript] = useState<string | null>(null);
  const navigate = useNavigate();

  async function addMine() {
    const text = input.trim();
    if (!text || busy) return;
    const next = [...lines, { who: "yo" as const, text }];
    setLines(next);
    setInput("");
    setBusy(true);
    try {
      // La IA solo "conoce" las últimas 5 palabras (como el juego original).
      const last5 = text.split(/\s+/).slice(-5).join(" ");
      const { text: cont } = await api.cadaver(last5);
      setLines((l) => [...l, { who: "ia", text: cont }]);
    } catch (e) {
      notifyGrokError(e);
    } finally {
      setBusy(false);
    }
  }

  const fullText = lines.map((l) => l.text).join(" ");

  async function toVideo() {
    setBusy(true);
    try {
      const { script } = await api.toScript(fullText);
      setScript(script);
    } catch (e) {
      notifyGrokError(e);
    } finally {
      setBusy(false);
    }
  }

  async function saveFragment() {
    try {
      await api.createWriting({ title: "Cadáver exquisito", content: fullText });
      notifyOk("Fragmento guardado en Escribir.");
    } catch (e) {
      notifyGrokError(e);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5">
        <h1 className="text-4xl text-cream">Cadáver exquisito</h1>
        <p className="mt-1 text-muted">Escribe una frase. La IA continúa conociendo solo tus últimas palabras. Y así, hasta lo bello y absurdo.</p>
      </div>

      {/* El texto que se va tejiendo */}
      {lines.length > 0 && (
        <div className="card mb-4 p-5 font-serif text-lg leading-relaxed">
          {lines.map((l, i) => (
            <span key={i} className={l.who === "ia" ? "text-gold" : "text-cream"}>
              {l.text}{" "}
            </span>
          ))}
        </div>
      )}

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addMine(); } }}
        placeholder={lines.length ? "Continúa el hilo…" : "Empieza con una frase…"}
        className="input min-h-[70px] resize-none font-serif"
      />
      <button onClick={addMine} disabled={busy || !input.trim()} className="btn-gold mt-2 w-full">
        {busy ? "La IA escribe…" : "Añadir y dejar que continúe"}
      </button>

      {lines.length >= 2 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={toVideo} disabled={busy} className="btn-ghost">🎬 Convertir en video</button>
          <button onClick={saveFragment} className="btn-ghost">💾 Guardar fragmento</button>
          <button onClick={() => { setLines([]); setScript(null); }} className="btn-ghost text-muted">Empezar de nuevo</button>
        </div>
      )}

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
