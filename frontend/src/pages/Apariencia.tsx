import { useState } from "react";
import { THEMES, getTheme, applyTheme } from "../lib/theme";
import { notifyOk } from "../lib/notify";

/**
 * APARIENCIA — selector de tema visual.
 * Aplica el tema en caliente y lo guarda en localStorage.
 */
export default function Apariencia() {
  const [active, setActive] = useState(getTheme());

  function choose(id: string) {
    applyTheme(id);
    setActive(id);
    notifyOk("Tema aplicado.");
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-4xl text-cream">Apariencia</h1>
        <p className="mt-1 text-muted">Elige cómo se ve Pliego. Se guarda en este dispositivo.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {THEMES.map((t) => (
          <button
            key={t.id}
            onClick={() => choose(t.id)}
            className={`card overflow-hidden text-left transition ${active === t.id ? "border-gold ring-1 ring-gold" : "hover:border-gold"}`}
          >
            {/* Vista previa */}
            <div className="flex h-24 items-center gap-3 p-4" style={{ backgroundColor: t.preview.bg }}>
              <div className="flex h-14 flex-1 flex-col justify-center rounded-lg px-3" style={{ backgroundColor: t.preview.surface }}>
                <span className="text-sm font-medium" style={{ color: t.preview.text }}>Aa Bb Cc</span>
                <span className="mt-1 h-2 w-16 rounded-full" style={{ backgroundColor: t.preview.accent }} />
              </div>
              <span className="h-10 w-10 rounded-full" style={{ backgroundColor: t.preview.accent }} />
            </div>
            {/* Etiqueta */}
            <div className="flex items-center justify-between p-4">
              <div>
                <div className="text-cream">{t.name}</div>
                <div className="text-sm text-muted">{t.desc}</div>
              </div>
              {active === t.id && <span className="text-sm text-gold">✓ Activo</span>}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
