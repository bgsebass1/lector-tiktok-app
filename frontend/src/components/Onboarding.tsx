import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const KEY = "pliego_onboarded";
const RITUAL_KEY = "pliego_ritual";

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface Slide {
  icon: string;
  title: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    icon: "🪶",
    title: "Bienvenido a Pliego",
    body: "Tu sistema personal para leer con intención y crear sin fricción. Todo lo que lees y piensas, en un solo lugar.",
  },
  {
    icon: "📖",
    title: "Lee con intención",
    body: "Cronometra tus sesiones, guarda subrayados, arma tu lista “Quiero leer” y mira crecer tu racha en el heatmap anual.",
  },
  {
    icon: "✍️",
    title: "Crea sin fricción",
    body: "Escribe en un lienzo limpio, conversa con autores, repasa con flashcards y enciende ideas con el Shuffle creativo.",
  },
  {
    icon: "🕸️",
    title: "Todo conectado",
    body: "Busca cualquier cosa con la lupa, explora tu Constelación de libros y temas, y elige el tema visual que más te inspire.",
  },
];

/**
 * ONBOARDING — recorrido de bienvenida, solo la primera vez.
 */
export default function Onboarding() {
  const [open, setOpen] = useState(() => localStorage.getItem(KEY) !== "1");
  const [i, setI] = useState(0);

  function finish() {
    localStorage.setItem(KEY, "1");
    // Evitamos que el ritual diario salte justo después del onboarding.
    localStorage.setItem(RITUAL_KEY, todayStr());
    setOpen(false);
  }

  const last = i === SLIDES.length - 1;
  const s = SLIDES[i];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-carbon px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="w-full max-w-md text-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-6xl">{s.icon}</div>
                <h1 className="mt-5 text-4xl text-cream">{s.title}</h1>
                <p className="mt-3 font-serif text-lg leading-relaxed text-muted">{s.body}</p>
              </motion.div>
            </AnimatePresence>

            {/* Puntos de progreso */}
            <div className="mt-8 flex justify-center gap-2">
              {SLIDES.map((_, j) => (
                <span
                  key={j}
                  className={`h-2 rounded-full transition-all ${j === i ? "w-6 bg-gold" : "w-2 bg-border"}`}
                />
              ))}
            </div>

            <div className="mt-8 flex items-center justify-center gap-3">
              {!last ? (
                <>
                  <button onClick={finish} className="btn-ghost">Saltar</button>
                  <button onClick={() => setI((v) => v + 1)} className="btn-gold">Siguiente</button>
                </>
              ) : (
                <button onClick={finish} className="btn-gold w-full">Comenzar a usar Pliego</button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
