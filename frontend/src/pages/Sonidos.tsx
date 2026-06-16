import { useState } from "react";
import { soundEnabled, setSound, playChime, playTick } from "../lib/sound";

/**
 * SONIDOS — activar/desactivar los sonidos de interfaz y probarlos.
 */
export default function Sonidos() {
  const [on, setOn] = useState(soundEnabled());

  function toggle() {
    const next = !on;
    setSound(next);
    setOn(next);
    if (next) playTick(); // confirmación audible al activar
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6">
        <h1 className="text-4xl text-cream">Sonidos</h1>
        <p className="mt-1 text-muted">Sonidos sutiles para algunos momentos (como terminar una sesión).</p>
      </div>

      <div className="card flex items-center justify-between p-5">
        <div>
          <div className="text-cream">Sonidos de interfaz</div>
          <div className="text-sm text-muted">{on ? "Activados" : "Desactivados"}</div>
        </div>
        <button
          onClick={toggle}
          className={`relative h-7 w-12 rounded-full transition ${on ? "bg-gold" : "bg-border"}`}
          aria-pressed={on}
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-carbon transition-all ${on ? "left-6" : "left-1"}`}
          />
        </button>
      </div>

      <div className="mt-4 flex gap-3">
        <button onClick={playTick} className="btn-ghost">Probar clic</button>
        <button onClick={playChime} className="btn-gold">Probar acorde</button>
      </div>

      <p className="mt-4 text-xs text-muted">La preferencia se guarda en este dispositivo.</p>
    </div>
  );
}
