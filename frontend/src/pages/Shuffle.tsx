import { useState } from "react";
import { motion } from "framer-motion";
import { api, type ShuffleDraw } from "../lib/api";
import { notifyGrokError } from "../lib/notify";

/**
 * SHUFFLE CREATIVO — máquina de serendipia.
 * Baraja libro + cita + palabra + idea al azar y, si quieres, los combina con IA.
 */
export default function Shuffle() {
  const [draw, setDraw] = useState<ShuffleDraw | null>(null);
  const [shuffling, setShuffling] = useState(false);
  const [spark, setSpark] = useState<string | null>(null);
  const [sparking, setSparking] = useState(false);
  const [seed, setSeed] = useState(0); // fuerza re-animación

  async function shuffle() {
    setShuffling(true);
    setSpark(null);
    try {
      const d = await api.shuffle();
      setDraw(d);
      setSeed((s) => s + 1);
    } catch (err) {
      notifyGrokError(err);
    } finally {
      setShuffling(false);
    }
  }

  async function makeSpark() {
    if (!draw) return;
    setSparking(true);
    setSpark(null);
    try {
      const { spark } = await api.shuffleSpark(draw);
      setSpark(spark);
    } catch (err) {
      notifyGrokError(err);
    } finally {
      setSparking(false);
    }
  }

  const cards = draw
    ? [
        draw.book && { tag: "📚 Libro", title: draw.book.title, sub: draw.book.author },
        draw.quote && { tag: "❝ Cita", title: `“${draw.quote.text}”`, sub: draw.quote.source ?? "" },
        draw.word && { tag: "🔤 Palabra", title: draw.word.word, sub: draw.word.etymology ?? "" },
        draw.idea && { tag: "💡 Idea", title: draw.idea.topic, sub: "" },
      ].filter(Boolean) as Array<{ tag: string; title: string; sub: string }>
    : [];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 text-center">
        <h1 className="text-4xl text-cream">Shuffle creativo</h1>
        <p className="mt-1 text-muted">Baraja tu mente. A veces la chispa salta entre cosas que no parecían tener nada que ver.</p>
      </div>

      <div className="mb-6 flex justify-center">
        <button onClick={shuffle} disabled={shuffling} className="btn-gold text-lg">
          {shuffling ? "Barajando…" : "🎲 Barajar"}
        </button>
      </div>

      {/* Cartas */}
      {cards.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {cards.map((c, i) => (
            <motion.div
              key={`${seed}-${i}`}
              initial={{ rotateY: 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              transition={{ delay: i * 0.12, duration: 0.4 }}
              className="card p-4"
            >
              <div className="text-xs uppercase tracking-wide text-muted">{c.tag}</div>
              <div className="mt-1 font-serif text-lg text-cream">{c.title}</div>
              {c.sub && <div className="mt-0.5 text-sm text-muted">{c.sub}</div>}
            </motion.div>
          ))}
        </div>
      )}

      {draw && cards.length === 0 && (
        <p className="text-center text-muted">No hay suficiente material todavía. Agrega libros, citas, palabras o ideas y vuelve a barajar.</p>
      )}

      {/* Chispa con IA */}
      {cards.length > 0 && (
        <div className="mt-6 text-center">
          <button onClick={makeSpark} disabled={sparking} className="btn-ghost">
            {sparking ? "Conectando…" : "✨ Generar chispa con IA"}
          </button>
        </div>
      )}

      {spark && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 rounded-xl border border-gold/40 bg-gold/5 p-5"
        >
          <div className="mb-2 text-sm text-gold">✨ Tu chispa</div>
          <p className="whitespace-pre-wrap font-serif text-lg leading-relaxed text-cream">{spark}</p>
        </motion.div>
      )}
    </div>
  );
}
