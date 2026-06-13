import { useEffect, useState } from "react";
import { api, type Word } from "../lib/api";
import { notifyOk, notifyGrokError } from "../lib/notify";
import GrokLoading from "../components/GrokLoading";

/**
 * ETIMOLOGÍAS Y PALABRAS (Módulo 4).
 * Buscas una palabra, Grok devuelve su etimología, una mini-historia y ángulos
 * de video. Se guarda en un "diccionario personal" con estados.
 */
const STATUS_META: Record<string, { label: string; color: string }> = {
  pendiente: { label: "Pendiente", color: "text-gold" },
  hecho: { label: "Ya hice video", color: "text-green-400" },
  descartada: { label: "Descartada", color: "text-muted line-through" },
};

export default function Palabras() {
  const [words, setWords] = useState<Word[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState<Word | null>(null);

  function load() {
    api.listWords().then(setWords).catch(() => {});
  }
  useEffect(load, []);

  async function analyze() {
    if (!input.trim()) return notifyGrokError(new Error("Escribe una palabra."));
    setLoading(true);
    try {
      const w = await api.analyzeWord(input.trim());
      setInput("");
      setOpen(w);
      notifyOk(`"${w.word}" analizada.`);
      load();
    } catch (err) {
      notifyGrokError(err, analyze);
    } finally {
      setLoading(false);
    }
  }

  async function setStatus(w: Word, status: string) {
    await api.setWordStatus(w.id, status);
    load();
    if (open?.id === w.id) setOpen({ ...w, status });
  }

  async function remove(id: number) {
    if (!confirm("¿Borrar esta palabra?")) return;
    await api.deleteWord(id);
    if (open?.id === id) setOpen(null);
    load();
  }

  return (
    <div>
      <h1 className="text-4xl text-cream">Etimologías</h1>
      <p className="mt-1 text-muted">Tu diccionario personal para el nicho de lenguaje.</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          className="input flex-1"
          placeholder="Una palabra (ej: trabajo, amor, saudade)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && analyze()}
        />
        <button onClick={analyze} disabled={loading} className="btn-gold">
          {loading ? "Analizando…" : "Analizar palabra"}
        </button>
      </div>

      {loading && <GrokLoading />}

      {/* Lista cronológica */}
      <div className="mt-8 space-y-2">
        {words.map((w) => (
          <div key={w.id} className="card flex items-center justify-between p-4">
            <button onClick={() => setOpen(w)} className="flex-1 text-left">
              <span className="font-serif text-2xl text-cream">{w.word}</span>
              <span className={`ml-3 text-xs ${STATUS_META[w.status]?.color ?? "text-muted"}`}>
                {STATUS_META[w.status]?.label ?? w.status}
              </span>
            </button>
            <div className="flex items-center gap-1">
              <button onClick={() => setStatus(w, "hecho")} title="Ya hice video" className="rounded p-1.5 hover:bg-carbon">✅</button>
              <button onClick={() => setStatus(w, "pendiente")} title="Pendiente" className="rounded p-1.5 hover:bg-carbon">🕓</button>
              <button onClick={() => setStatus(w, "descartada")} title="Descartar" className="rounded p-1.5 hover:bg-carbon">🗑️</button>
              <button onClick={() => remove(w.id)} className="ml-1 text-muted hover:text-red-400">✕</button>
            </div>
          </div>
        ))}
        {words.length === 0 && !loading && <p className="text-muted">Aún no has estudiado palabras.</p>}
      </div>

      {/* Detalle de palabra */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm" onClick={() => setOpen(null)}>
          <div className="card my-8 w-full max-w-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <h2 className="font-serif text-4xl text-gold">{open.word}</h2>
              <button onClick={() => setOpen(null)} className="text-muted hover:text-cream">✕</button>
            </div>

            <section className="mt-4">
              <p className="text-xs uppercase tracking-wide text-muted">Etimología</p>
              <p className="mt-1 whitespace-pre-wrap leading-relaxed text-cream/90">{open.etymology}</p>
            </section>

            <section className="mt-4">
              <p className="text-xs uppercase tracking-wide text-muted">Mini-historia</p>
              <p className="mt-1 whitespace-pre-wrap font-serif text-lg leading-relaxed text-cream/90">{open.story}</p>
            </section>

            {open.video_ideas.length > 0 && (
              <section className="mt-4">
                <p className="text-xs uppercase tracking-wide text-muted">Ángulos para video</p>
                <ul className="mt-2 space-y-2">
                  {open.video_ideas.map((idea, i) => (
                    <li key={i} className="rounded-lg bg-carbon p-3 text-sm text-cream/90">{idea}</li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
