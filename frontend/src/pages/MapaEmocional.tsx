import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, type EmotionBook } from "../lib/api";

/**
 * MAPA EMOCIONAL DE LECTURAS (G3).
 * Plano 2D: X melancolía↔euforia, Y contemplación↔acción. Arrastra cada libro.
 */
export default function MapaEmocional() {
  const [books, setBooks] = useState<EmotionBook[]>([]);
  const planeRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: number; moved: boolean } | null>(null);
  const navigate = useNavigate();

  useEffect(() => { api.emotionMap().then(setBooks).catch(() => {}); }, []);

  function onDown(id: number, e: React.PointerEvent) {
    e.preventDefault();
    dragRef.current = { id, moved: false };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }
  function onMove(e: PointerEvent) {
    const d = dragRef.current;
    const plane = planeRef.current;
    if (!d || !plane) return;
    d.moved = true;
    const r = plane.getBoundingClientRect();
    const x = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
    const y = Math.max(-1, Math.min(1, 1 - ((e.clientY - r.top) / r.height) * 2));
    setBooks((bs) => bs.map((b) => (b.id === d.id ? { ...b, x, y, placed: 1 } : b)));
  }
  function onUp() {
    const d = dragRef.current;
    dragRef.current = null;
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    if (!d) return;
    if (d.moved) {
      const b = books.find((x) => x.id === d.id);
      if (b) api.setBookMood(b.id, b.x, b.y).catch(() => {});
    } else {
      navigate(`/leer/${d.id}`);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4">
        <h1 className="text-4xl text-cream">Mapa emocional</h1>
        <p className="mt-1 text-muted">Arrastra cada libro según cómo te hizo sentir. Tócalo para abrirlo.</p>
      </div>

      <div className="relative mx-auto aspect-square w-full select-none touch-none" ref={planeRef}>
        {/* Ejes */}
        <div className="absolute left-1/2 top-0 h-full w-px bg-border" />
        <div className="absolute top-1/2 left-0 h-px w-full bg-border" />
        <span className="absolute left-1/2 top-1 -translate-x-1/2 text-xs text-muted">acción</span>
        <span className="absolute left-1/2 bottom-1 -translate-x-1/2 text-xs text-muted">contemplación</span>
        <span className="absolute left-1 top-1/2 -translate-y-1/2 text-xs text-muted">melancolía</span>
        <span className="absolute right-1 top-1/2 -translate-y-1/2 text-xs text-muted">euforia</span>
        <div className="absolute inset-0 rounded-xl border border-border" />

        {/* Libros */}
        {books.map((b) => (
          <button
            key={b.id}
            onPointerDown={(e) => onDown(b.id, e)}
            style={{ left: `${((b.x + 1) / 2) * 100}%`, top: `${((1 - b.y) / 2) * 100}%` }}
            className={`group absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing ${b.placed ? "" : "animate-pulse"}`}
          >
            <span className={`block h-3 w-3 rounded-full ${b.placed ? "bg-gold" : "bg-muted ring-2 ring-gold/40"}`} />
            <span className="pointer-events-none absolute left-1/2 top-4 max-w-[90px] -translate-x-1/2 truncate text-center text-[10px] text-cream/80 group-hover:text-cream">
              {b.title}
            </span>
          </button>
        ))}
      </div>

      <p className="mt-4 text-center text-xs text-muted">
        {books.filter((b) => !b.placed).length > 0
          ? `${books.filter((b) => !b.placed).length} libro(s) sin ubicar (parpadean en el centro).`
          : "Todos tus libros están ubicados."}
      </p>
    </div>
  );
}
