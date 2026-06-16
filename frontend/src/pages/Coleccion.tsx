import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api, type Book } from "../lib/api";

/** Rareza de una carta según la calificación del libro. */
interface Rarity {
  key: string;
  label: string;
  ring: string; // borde
  glow: string; // sombra/halo
  text: string;
}
function rarityOf(rating: number | null): Rarity {
  if (rating != null && rating >= 10) return { key: "leg", label: "Legendaria", ring: "border-amber-400", glow: "shadow-[0_0_18px_rgba(251,191,36,0.5)]", text: "text-amber-400" };
  if (rating != null && rating >= 8) return { key: "epi", label: "Épica", ring: "border-violet-400", glow: "shadow-[0_0_16px_rgba(167,139,250,0.45)]", text: "text-violet-400" };
  if (rating != null && rating >= 6) return { key: "rar", label: "Rara", ring: "border-sky-400", glow: "shadow-[0_0_14px_rgba(56,189,248,0.4)]", text: "text-sky-400" };
  return { key: "com", label: "Común", ring: "border-zinc-500", glow: "", text: "text-zinc-400" };
}

const ORDER = ["leg", "epi", "rar", "com"];
const LABELS: Record<string, string> = { leg: "Legendaria", epi: "Épica", rar: "Rara", com: "Común" };

/**
 * COLECCIÓN — tus libros leídos como cartas coleccionables.
 * La rareza depende de la calificación; toca una carta para voltearla.
 */
export default function Coleccion() {
  const [books, setBooks] = useState<Book[]>([]);
  const [flipped, setFlipped] = useState<Set<number>>(new Set());

  useEffect(() => {
    api.listBooks().then(setBooks).catch(() => {});
  }, []);

  function toggle(id: number) {
    setFlipped((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  // Conteo por rareza para la leyenda.
  const counts: Record<string, number> = {};
  for (const b of books) counts[rarityOf(b.rating).key] = (counts[rarityOf(b.rating).key] ?? 0) + 1;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-4xl text-cream">Colección</h1>
        <p className="mt-1 text-muted">Cada libro leído es una carta. Mientras mejor lo califiques, más rara.</p>
      </div>

      {/* Resumen por rareza */}
      <div className="mb-6 flex flex-wrap gap-3">
        <span className="rounded-full border border-border px-3 py-1 text-sm text-cream">
          {books.length} {books.length === 1 ? "carta" : "cartas"}
        </span>
        {ORDER.filter((k) => counts[k]).map((k) => (
          <span key={k} className={`rounded-full border px-3 py-1 text-sm ${rarityOf(k === "leg" ? 10 : k === "epi" ? 8 : k === "rar" ? 6 : 0).text} ${rarityOf(k === "leg" ? 10 : k === "epi" ? 8 : k === "rar" ? 6 : 0).ring}`}>
            {LABELS[k]}: {counts[k]}
          </span>
        ))}
      </div>

      {books.length === 0 ? (
        <div className="card p-8 text-center text-muted">
          Aún no hay cartas. Agrega libros a tu biblioteca y aparecerán aquí.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {books.map((b, i) => {
            const r = rarityOf(b.rating);
            const isFlipped = flipped.has(b.id);
            return (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.4) }}
                className="[perspective:1200px]"
              >
                <div
                  onClick={() => toggle(b.id)}
                  className={`relative aspect-[2/3] cursor-pointer rounded-xl border-2 transition-transform duration-500 [transform-style:preserve-3d] ${r.ring} ${r.glow}`}
                  style={{ transform: isFlipped ? "rotateY(180deg)" : "" }}
                >
                  {/* Frente */}
                  <div className="absolute inset-0 flex flex-col overflow-hidden rounded-[10px] bg-surface [backface-visibility:hidden]">
                    <div className="flex flex-1 items-center justify-center overflow-hidden bg-carbon">
                      {b.cover_url ? (
                        <img src={b.cover_url} alt={b.title} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-4xl">📖</span>
                      )}
                    </div>
                    <div className="p-2">
                      <div className={`text-[10px] uppercase tracking-wide ${r.text}`}>{r.label}</div>
                      <div className="truncate font-serif text-sm text-cream">{b.title}</div>
                      <div className="flex items-center justify-between">
                        <span className="truncate text-xs text-muted">{b.author}</span>
                        {b.rating != null && <span className={`text-xs ${r.text}`}>★{b.rating}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Reverso */}
                  <div className="absolute inset-0 flex flex-col rounded-[10px] bg-surface p-3 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                    <div className={`font-serif text-sm ${r.text}`}>{b.title}</div>
                    <div className="text-xs text-muted">{b.author}{b.year ? ` · ${b.year}` : ""}</div>
                    {b.themes && <div className="mt-2 text-xs text-cream/80 line-clamp-3">🏷️ {b.themes}</div>}
                    {b.notes && <div className="mt-2 flex-1 overflow-hidden text-xs italic text-cream/70 line-clamp-4">“{b.notes}”</div>}
                    <div className="mt-auto text-[10px] uppercase tracking-wide text-muted">{r.label}</div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
