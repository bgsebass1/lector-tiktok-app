import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { api, type SearchResult } from "../lib/api";

interface Props {
  open: boolean;
  onClose: () => void;
}

/** Etiqueta + emoji por tipo de resultado. */
const TYPE_META: Record<SearchResult["type"], { label: string; icon: string }> = {
  libro: { label: "Libros", icon: "📚" },
  cita: { label: "Citas", icon: "❝" },
  palabra: { label: "Palabras", icon: "🔤" },
  idea: { label: "Ideas", icon: "✨" },
  guion: { label: "Guiones", icon: "🎬" },
  escrito: { label: "Escritos", icon: "✍️" },
  highlight: { label: "Subrayados", icon: "🖍️" },
  flashcard: { label: "Flashcards", icon: "🃏" },
  dialogo: { label: "Diálogos", icon: "🗣️" },
  recurso: { label: "Recursos", icon: "🎞️" },
  evento: { label: "Timeline", icon: "📜" },
  deseo: { label: "Quiero leer", icon: "🔖" },
  nota: { label: "Banco de ideas", icon: "🧠" },
};

/**
 * Paleta de comandos / búsqueda global (mejora transversal 1).
 * Se abre con Cmd+K. Busca en libros, citas, palabras, ideas y guiones.
 */
export default function CommandPalette({ open, onClose }: Props) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Al abrir, enfocamos el input y limpiamos.
  useEffect(() => {
    if (open) {
      setQ("");
      setResults([]);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Búsqueda con debounce de 250ms.
  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    const id = setTimeout(() => {
      api.search(q).then(setResults).catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(id);
  }, [q]);

  // Cerrar con Escape.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  function go(r: SearchResult) {
    navigate(r.to);
    onClose();
  }

  // Agrupamos por tipo.
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    (acc[r.type] ??= []).push(r);
    return acc;
  }, {});

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-start justify-center bg-black/70 p-4 pt-[12vh] backdrop-blur-sm"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="card w-full max-w-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.96, y: -10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: -10 }}
          >
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar libros, citas, palabras, ideas, guiones…"
              className="w-full bg-transparent px-5 py-4 text-lg text-cream placeholder:text-muted focus:outline-none"
            />

            <div className="max-h-[50vh] overflow-y-auto border-t border-border">
              {q && results.length === 0 && (
                <p className="px-5 py-6 text-sm text-muted">Sin resultados para “{q}”.</p>
              )}

              {Object.entries(grouped).map(([type, items]) => {
                const meta = TYPE_META[type as SearchResult["type"]];
                return (
                  <div key={type} className="py-2">
                    <p className="px-5 py-1 text-xs uppercase tracking-wide text-muted">
                      {meta.icon} {meta.label}
                    </p>
                    {items.map((r) => (
                      <button
                        key={`${r.type}-${r.id}`}
                        onClick={() => go(r)}
                        className="block w-full px-5 py-2 text-left transition hover:bg-carbon"
                      >
                        <span className="text-cream">{r.title}</span>
                        {r.subtitle && (
                          <span className="ml-2 text-sm text-muted">{r.subtitle}</span>
                        )}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>

            <div className="border-t border-border px-5 py-2 text-right font-mono text-xs text-muted">
              esc para cerrar
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
