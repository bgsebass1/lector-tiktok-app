import { useEffect } from "react";
import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { drawerSections } from "../../lib/nav";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Drawer lateral "Más" (móvil): desliza desde la derecha con todas las secciones. */
export default function MoreDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <motion.div
            className="absolute inset-0 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />
          <motion.aside
            className="absolute right-0 top-0 flex h-full w-80 max-w-[85%] flex-col border-l border-border bg-carbon"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: EASE }}
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <span className="font-serif text-xl font-semibold text-cream">Más</span>
              <button
                onClick={onClose}
                aria-label="Cerrar"
                className="flex h-10 w-10 items-center justify-center rounded-lg text-muted transition hover:text-cream"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-3">
              {drawerSections.map((section) => (
                <div key={section.title} className="mb-4">
                  <p className="px-3 pb-1 pt-2 text-xs uppercase tracking-wider text-muted">{section.title}</p>
                  <ul className="space-y-0.5">
                    {section.items.map((item) => (
                      <li key={item.to}>
                        <NavLink
                          to={item.to}
                          onClick={onClose}
                          className={({ isActive }) =>
                            `flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition ${
                              isActive ? "bg-surface text-gold" : "text-cream hover:bg-surface/60"
                            }`
                          }
                        >
                          <span className="w-5 text-center" aria-hidden>{item.icon}</span>
                          {item.label}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
