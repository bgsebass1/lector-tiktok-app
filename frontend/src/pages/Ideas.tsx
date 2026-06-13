import { useEffect, useState } from "react";
import { api, type VideoIdea, type SavedIdeas } from "../lib/api";

/**
 * Página de IDEAS (recomendador de contenido con Grok):
 *  - Textarea para escribir un tema.
 *  - Botón "Generar ideas" -> backend -> Grok.
 *  - Muestra 5 cards con título, hook, estructura y hashtags.
 *  - Sección "Ideas guardadas" con generaciones anteriores.
 */
export default function Ideas() {
  const [topic, setTopic] = useState("");
  const [ideas, setIdeas] = useState<VideoIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [saved, setSaved] = useState<SavedIdeas[]>([]);

  /** Carga el historial de generaciones. */
  async function loadSaved() {
    try {
      setSaved(await api.listIdeas());
    } catch {
      /* silencioso: el historial no es crítico */
    }
  }

  useEffect(() => {
    loadSaved();
  }, []);

  /** Llama a Grok para generar ideas sobre el tema escrito. */
  async function handleGenerate() {
    if (!topic.trim()) {
      setError("Escribe un tema primero.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await api.generateIdeas(topic.trim());
      setIdeas(result.ideas);
      loadSaved(); // refrescamos el historial
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al generar ideas.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-4xl text-cream">Generador de ideas</h1>
      <p className="mt-1 text-muted">
        Escribe un tema y Grok te propone 5 ideas de video.
      </p>

      {/* Entrada de tema */}
      <div className="mt-6">
        <textarea
          className="input min-h-[110px] resize-y text-lg"
          placeholder="Ej: Wittgenstein y el lenguaje cotidiano"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="btn-gold mt-3"
        >
          {loading ? "Generando…" : "✨ Generar ideas"}
        </button>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      </div>

      {/* Resultados actuales */}
      {ideas.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-2xl text-cream">Ideas para: “{topic}”</h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {ideas.map((idea, i) => (
              <IdeaCard key={i} idea={idea} index={i + 1} />
            ))}
          </div>
        </section>
      )}

      {/* Historial */}
      {saved.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-4 text-2xl text-cream">Ideas guardadas</h2>
          <div className="space-y-4">
            {saved.map((gen) => (
              <details key={gen.id} className="card p-5">
                <summary className="cursor-pointer select-none font-serif text-lg text-gold">
                  {gen.topic}
                  <span className="ml-2 text-xs font-sans text-muted">
                    · {new Date(gen.created_at).toLocaleString("es-CO")} ·{" "}
                    {gen.ideas.length} ideas
                  </span>
                </summary>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  {gen.ideas.map((idea, i) => (
                    <IdeaCard key={i} idea={idea} index={i + 1} />
                  ))}
                </div>
              </details>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/* ---------- Card de una idea ---------- */

function IdeaCard({ idea, index }: { idea: VideoIdea; index: number }) {
  return (
    <div className="card p-5">
      <div className="flex items-baseline gap-2">
        <span className="font-display text-2xl text-gold">{index}</span>
        <h3 className="font-serif text-xl text-cream">{idea.titulo}</h3>
      </div>

      <div className="mt-3">
        <p className="text-xs uppercase tracking-wide text-muted">Hook</p>
        <p className="text-sm italic text-cream/90">“{idea.hook}”</p>
      </div>

      <div className="mt-3">
        <p className="text-xs uppercase tracking-wide text-muted">Estructura</p>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-cream/90">
          {idea.estructura}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {idea.hashtags.map((h, i) => (
          <span
            key={i}
            className="rounded-full bg-carbon px-3 py-1 text-xs text-gold"
          >
            {h}
          </span>
        ))}
      </div>
    </div>
  );
}
