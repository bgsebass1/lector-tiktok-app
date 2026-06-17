import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { api, type Word } from "../lib/api";

/**
 * PALABRA DEL DÍA — INMERSIÓN (G7).
 * Revela la palabra letra a letra, luego su historia, etimología y una cita literaria.
 */
export default function PalabraInmersiva() {
  const [word, setWord] = useState<Word | null>(null);
  const [empty, setEmpty] = useState(false);
  const [step, setStep] = useState(0); // 0 palabra · 1 historia · 2 etimología · 3 cita
  const [quote, setQuote] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.listWords().then((ws) => {
      if (!ws.length) return setEmpty(true);
      const day = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
      setWord(ws[day % ws.length]);
    }).catch(() => setEmpty(true));
  }, []);

  // Avance automático suave entre pasos.
  useEffect(() => {
    if (!word || step >= 3) return;
    const t = setTimeout(() => setStep((s) => s + 1), step === 0 ? 2200 : 2600);
    return () => clearTimeout(t);
  }, [word, step]);

  // Al llegar a la cita, la pedimos a la IA una sola vez.
  useEffect(() => {
    if (step >= 3 && word && quote === null) {
      api.wordQuote(word.word).then((r) => setQuote(r.text)).catch(() => setQuote(""));
    }
  }, [step, word, quote]);

  if (empty) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <p className="text-muted">Aún no tienes palabras guardadas.</p>
        <button onClick={() => navigate("/palabras")} className="btn-gold mt-4">Ir a Palabras</button>
      </div>
    );
  }
  if (!word) return null;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center text-center" onClick={() => step < 3 && setStep(3)}>
      {/* Palabra letra por letra */}
      <div className="flex flex-wrap justify-center">
        {word.word.split("").map((ch, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="font-display text-5xl text-cream sm:text-6xl"
          >
            {ch}
          </motion.span>
        ))}
      </div>

      {step >= 1 && word.story && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 font-serif text-lg leading-relaxed text-cream/90">
          {word.story}
        </motion.p>
      )}

      {step >= 2 && word.etymology && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 rounded-lg border border-border bg-surface/60 p-4">
          <div className="text-xs uppercase tracking-wide text-muted">Etimología</div>
          <p className="mt-1 text-cream/90">{word.etymology}</p>
        </motion.div>
      )}

      {step >= 3 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5">
          {quote === null ? (
            <p className="font-serif italic text-muted">Buscando una cita…</p>
          ) : quote ? (
            <p className="font-serif text-lg italic text-gold">“{quote}”</p>
          ) : null}
        </motion.div>
      )}

      <div className="mt-8 flex gap-3">
        {step < 3 ? (
          <button onClick={() => setStep(3)} className="btn-ghost">Saltar</button>
        ) : (
          <>
            <button onClick={() => navigate("/palabras")} className="btn-ghost">Saber más</button>
            <button onClick={() => navigate("/")} className="btn-gold">Listo</button>
          </>
        )}
      </div>
    </div>
  );
}
