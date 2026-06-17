import { useState } from "react";
import { motion } from "framer-motion";
import { api, type MoodResult } from "../lib/api";
import { notifyGrokError } from "../lib/notify";

const MOODS = [
  { emoji: "😔", label: "Triste / Melancólico" },
  { emoji: "🔥", label: "Iracundo / Encendido" },
  { emoji: "🌫️", label: "Confundido / Perdido" },
  { emoji: "💫", label: "Inspirado / Curioso" },
  { emoji: "🌙", label: "Calmado / Nostálgico" },
  { emoji: "⚡", label: "Productivo / Lúcido" },
  { emoji: "🪐", label: "Existencial" },
];

/** MOOD READING (G13) — recomendaciones según cómo te sientes hoy. */
export default function Mood() {
  const [active, setActive] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<MoodResult | null>(null);

  async function choose(label: string) {
    setActive(label);
    setRes(null);
    setLoading(true);
    try {
      setRes(await api.mood(label));
    } catch (e) {
      notifyGrokError(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 text-center">
        <h1 className="text-4xl text-cream">Hoy me siento…</h1>
        <p className="mt-1 text-muted">Elige tu ánimo y deja que Pliego te acompañe.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {MOODS.map((m) => (
          <button
            key={m.label}
            onClick={() => choose(m.label)}
            className={`card flex flex-col items-center gap-2 p-4 transition hover:border-gold ${active === m.label ? "border-gold" : ""}`}
          >
            <span className="text-3xl">{m.emoji}</span>
            <span className="text-center text-xs text-muted">{m.label}</span>
          </button>
        ))}
      </div>

      {loading && <p className="mt-8 text-center font-serif italic text-muted">Sintiendo contigo…</p>}

      {res && !loading && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-8 space-y-3">
          <Rec label="📖 Retoma de tu biblioteca" title={res.retomar.title} author={res.retomar.author} reason={res.retomar.reason} />
          <Rec label="✨ Descubre algo nuevo" title={res.descubrir.title} author={res.descubrir.author} reason={res.descubrir.reason} />
          <div className="card p-4">
            <div className="text-xs uppercase tracking-wide text-muted">❝ Cita para el momento</div>
            <p className="mt-1 font-serif text-lg italic text-cream">“{res.cita.text}”</p>
            <p className="text-sm text-gold">— {res.cita.author}</p>
          </div>
          <div className="card p-4">
            <div className="text-xs uppercase tracking-wide text-muted">🎬 Idea de video</div>
            <p className="mt-1 text-cream">{res.video}</p>
          </div>
          <div className="card p-4">
            <div className="text-xs uppercase tracking-wide text-muted">📻 Estación sugerida</div>
            <p className="mt-1 text-cream">{res.radio}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function Rec({ label, title, author, reason }: { label: string; title: string; author: string; reason: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-1 font-serif text-lg text-cream">{title}</div>
      <div className="text-sm text-muted">{author}</div>
      <p className="mt-1 text-sm text-cream/80">{reason}</p>
    </div>
  );
}
