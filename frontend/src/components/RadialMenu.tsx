import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Botón flotante "+" con menú radial (Módulo 11 + atajo Cmd+N).
 * Da acceso rápido a crear: idea, libro, cita, guion.
 */
const ACTIONS = [
  { label: "Nueva idea", icon: "✨", to: "/ideas" },
  { label: "Nuevo libro", icon: "📚", to: "/libros" },
  { label: "Nueva cita", icon: "❝", to: "/citas" },
  { label: "Nuevo guion", icon: "🎬", to: "/studio" },
];

export default function RadialMenu({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-8 right-8 z-40 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            className="flex flex-col items-end gap-2"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={{
              visible: { transition: { staggerChildren: 0.05 } },
              hidden: {},
            }}
          >
            {ACTIONS.map((a) => (
              <motion.button
                key={a.to}
                onClick={() => {
                  navigate(a.to);
                  setOpen(false);
                }}
                variants={{
                  hidden: { opacity: 0, x: 20, scale: 0.8 },
                  visible: { opacity: 1, x: 0, scale: 1 },
                }}
                className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm text-cream shadow-lg shadow-black/50 transition hover:border-gold hover:text-gold"
              >
                <span>{a.icon}</span>
                {a.label}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botón principal */}
      <motion.button
        onClick={() => setOpen(!open)}
        animate={{ rotate: open ? 45 : 0 }}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-gold text-3xl text-carbon shadow-xl shadow-black/50 transition hover:brightness-110"
        aria-label="Crear nuevo"
      >
        +
      </motion.button>
    </div>
  );
}
