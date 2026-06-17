import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRadio } from "../lib/radio";

/** Mini-controles flotantes de la radio (persisten en toda la app). */
export default function RadioMini() {
  const { current, playing, toggle, stop } = useRadio();
  const navigate = useNavigate();

  // Barra espaciadora = play/pausa (salvo escribiendo en un campo).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement;
      if (e.code !== "Space" || !current) return;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      e.preventDefault();
      toggle();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, toggle]);

  if (!current) return null;

  return (
    <div className="fixed bottom-20 right-3 z-40 flex items-center gap-2 rounded-full border border-border bg-surface/95 px-3 py-2 shadow-xl backdrop-blur md:bottom-4">
      <button onClick={toggle} className="text-lg" title={playing ? "Pausar (espacio)" : "Reproducir (espacio)"}>
        {playing ? "⏸" : "▶"}
      </button>
      <button onClick={() => navigate("/radio")} className="max-w-[120px] truncate text-sm text-cream">
        {current.emoji} {current.name}
      </button>
      <button onClick={stop} className="text-muted hover:text-rose-400" title="Apagar">✕</button>
    </div>
  );
}
