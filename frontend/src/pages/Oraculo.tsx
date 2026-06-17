import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api, type OracleConsultation } from "../lib/api";
import { notifyGrokError } from "../lib/notify";

type Phase = "ask" | "loading" | "result";

/**
 * EL ORÁCULO LITERARIO (G1).
 * Haces una pregunta vital; el azar revela una cita y la IA la interpreta.
 */
export default function Oraculo() {
  const [phase, setPhase] = useState<Phase>("ask");
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<OracleConsultation | null>(null);

  async function consult() {
    if (!question.trim()) return;
    setPhase("loading");
    try {
      const r = await api.oracleConsult(question.trim());
      setResult(r);
      setPhase("result");
    } catch (e) {
      notifyGrokError(e);
      setPhase("ask");
    }
  }

  function reset() {
    setQuestion("");
    setResult(null);
    setPhase("ask");
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center text-center">
      {/* Libro */}
      <motion.div
        animate={phase === "loading" ? { rotate: [0, -3, 3, -2, 0], scale: [1, 1.05, 1] } : {}}
        transition={phase === "loading" ? { duration: 1.2, repeat: Infinity } : {}}
        className="mb-8"
      >
        <BookSVG open={phase !== "ask"} />
      </motion.div>

      <AnimatePresence mode="wait">
        {phase === "ask" && (
          <motion.div key="ask" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
            <h1 className="text-3xl text-cream">Haz una pregunta al oráculo</h1>
            <p className="mt-2 text-muted">Piensa en algo que te inquieta. El azar y la literatura responderán.</p>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="¿Debo aceptar este camino?"
              className="input mt-6 min-h-[90px] resize-none text-center font-serif text-lg"
            />
            <button onClick={consult} disabled={!question.trim()} className="btn-gold mt-4 w-full disabled:opacity-40">
              Consultar al oráculo
            </button>
          </motion.div>
        )}

        {phase === "loading" && (
          <motion.p key="load" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="font-serif text-lg italic text-muted">
            El oráculo pasa sus páginas…
          </motion.p>
        )}

        {phase === "result" && result && (
          <motion.div key="res" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
            <p className="text-sm uppercase tracking-widest text-muted">{result.question}</p>
            <motion.blockquote
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="mt-6 font-display text-3xl leading-snug text-cream"
            >
              “{result.quote_text}”
            </motion.blockquote>
            <p className="mt-3 text-gold">— {result.quote_author}</p>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-8 rounded-xl border border-border bg-surface/60 p-5 text-left">
              <p className="mb-1 text-xs uppercase tracking-wide text-muted">La lectura del oráculo</p>
              <p className="whitespace-pre-wrap font-serif text-lg leading-relaxed text-cream/90">{result.interpretation}</p>
            </motion.div>

            <button onClick={reset} className="btn-ghost mt-6">Volver a preguntar</button>
            <p className="mt-3 text-xs text-muted">Consulta guardada.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Libro SVG que se abre. */
function BookSVG({ open }: { open: boolean }) {
  return (
    <svg width="120" height="96" viewBox="0 0 120 96" style={{ perspective: 600 }}>
      <rect x="56" y="10" width="8" height="76" rx="2" fill="rgb(var(--border))" />
      {/* Tapa derecha */}
      <motion.rect
        x="60" y="10" width="52" height="76" rx="3"
        fill="rgb(var(--surface))" stroke="rgb(var(--gold))" strokeWidth="1.5"
        style={{ transformOrigin: "60px 48px" }}
        animate={{ rotateY: open ? 18 : 0 }}
        transition={{ duration: 0.7 }}
      />
      {/* Tapa izquierda */}
      <motion.rect
        x="8" y="10" width="52" height="76" rx="3"
        fill="rgb(var(--surface))" stroke="rgb(var(--gold))" strokeWidth="1.5"
        style={{ transformOrigin: "60px 48px" }}
        animate={{ rotateY: open ? -18 : 0 }}
        transition={{ duration: 0.7 }}
      />
      <circle cx="60" cy="48" r="3" fill="rgb(var(--gold))" />
    </svg>
  );
}
