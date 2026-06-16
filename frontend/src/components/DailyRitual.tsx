import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../lib/api";

/** Saludo según la hora. */
function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

/** Frases para el ritual; una por día (estable durante el día). */
const PHRASES = [
  "Un libro es un sueño que tienes en tus manos.",
  "Leer es viajar sin moverse del sitio.",
  "Quien lee, vive mil vidas antes de morir.",
  "Las palabras son la moneda de la imaginación.",
  "Cada página leída es un día que no se repite.",
  "El que no lee, solo vive una vez.",
  "Los libros son espejos: solo ves en ellos lo que ya llevas dentro.",
  "Leer poco a poco, pero todos los días.",
  "Una hora de lectura es una hora robada al olvido.",
  "Las grandes ideas llegan en silencio.",
];

const KEY_DATE = "pliego_ritual";
const KEY_INTENTION = "pliego_intention";

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * RITUAL DIARIO — bienvenida una vez al día: saludo, racha, frase e intención.
 * Se monta globalmente (en App) y aparece si no se ha visto hoy.
 */
export default function DailyRitual() {
  const [open, setOpen] = useState(false);
  const [streak, setStreak] = useState<number | null>(null);
  const [intention, setIntention] = useState("");

  useEffect(() => {
    if (localStorage.getItem(KEY_DATE) === todayStr()) return; // ya se vio hoy
    api.readingStats().then((s) => setStreak(s.streak)).catch(() => setStreak(0));
    setOpen(true);
  }, []);

  function close() {
    localStorage.setItem(KEY_DATE, todayStr());
    if (intention.trim()) {
      localStorage.setItem(KEY_INTENTION, JSON.stringify({ date: todayStr(), text: intention.trim() }));
    }
    setOpen(false);
  }

  // Frase del día: índice estable por día del año.
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const phrase = PHRASES[dayOfYear % PHRASES.length];

  const fecha = new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" });

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-carbon/95 px-6 backdrop-blur"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-md text-center"
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <p className="text-sm capitalize text-muted">{fecha}</p>
            <h1 className="mt-2 text-4xl text-cream">
              {greeting()}, Sebastian
            </h1>

            {streak !== null && streak > 0 && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/5 px-4 py-1.5 text-gold">
                🔥 <span className="font-mono">{streak}</span> {streak === 1 ? "día" : "días"} de racha
              </div>
            )}

            <p className="mt-6 font-serif text-xl italic leading-relaxed text-cream/90">“{phrase}”</p>

            <div className="mt-8 text-left">
              <label className="text-sm text-muted">¿Cuál es tu intención de hoy?</label>
              <input
                value={intention}
                onChange={(e) => setIntention(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && close()}
                placeholder="Hoy quiero…"
                autoFocus
                className="input mt-2"
              />
            </div>

            <button onClick={close} className="btn-gold mt-6 w-full">Comenzar el día</button>
            <button onClick={close} className="mt-3 text-sm text-muted hover:text-cream">Saltar</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
