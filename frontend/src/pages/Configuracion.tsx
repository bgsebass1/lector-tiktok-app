import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { notifyOk } from "../lib/notify";
import { isDetox, detoxUntil, startDetox, endDetox } from "../lib/detox";

interface Item {
  icon: string;
  label: string;
  desc: string;
  to: string;
}

const ITEMS: Item[] = [
  { icon: "🎨", label: "Apariencia", desc: "Elige entre 4 temas visuales", to: "/settings/apariencia" },
  { icon: "🔊", label: "Sonidos", desc: "Sonidos de interfaz on/off", to: "/settings/sonidos" },
  { icon: "⌨️", label: "Atajos de teclado", desc: "Navega más rápido", to: "/settings/atajos" },
  { icon: "💾", label: "Copia de seguridad", desc: "Exporta o importa tus datos", to: "/settings/backup" },
];

/**
 * CONFIGURACIÓN — hub de ajustes + acciones generales.
 */
export default function Configuracion() {
  const navigate = useNavigate();

  function repeatOnboarding() {
    localStorage.removeItem("pliego_onboarded");
    notifyOk("Reiniciando el recorrido…");
    setTimeout(() => {
      window.location.href = "/";
    }, 500);
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6">
        <h1 className="text-4xl text-cream">Configuración</h1>
        <p className="mt-1 text-muted">Ajusta Pliego a tu gusto.</p>
      </div>

      <div className="space-y-2">
        {ITEMS.map((it) => (
          <button
            key={it.to}
            onClick={() => navigate(it.to)}
            className="card flex w-full items-center gap-4 p-4 text-left transition hover:border-gold"
          >
            <span className="text-2xl">{it.icon}</span>
            <span className="flex-1">
              <span className="block text-cream">{it.label}</span>
              <span className="block text-sm text-muted">{it.desc}</span>
            </span>
            <span className="text-muted">›</span>
          </button>
        ))}
      </div>

      {/* Detox */}
      <DetoxSection />

      {/* Acciones */}
      <div className="mt-8">
        <h2 className="mb-3 text-sm uppercase tracking-wide text-muted">General</h2>
        <button onClick={repeatOnboarding} className="btn-ghost w-full">
          🪶 Ver el recorrido de bienvenida otra vez
        </button>
      </div>

      {/* fin */}
      <div className="mt-10 text-center text-xs text-muted">
        <p>Pliego · tu sistema personal de lectura y creación</p>
        <a
          href="https://github.com/bgsebass1/lector-tiktok-app"
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-block hover:text-gold"
        >
          Código en GitHub ↗
        </a>
      </div>
    </div>
  );
}

/* ---------- Detox mode (G20) ---------- */
function DetoxSection() {
  const [, force] = useState(0);
  const active = isDetox();

  function start(days: number) {
    if (!confirm(`¿Bloquear la creación de contenido por ${days} día(s)? Solo podrás leer, escribir y guardar citas.`)) return;
    startDetox(days);
    force((n) => n + 1);
  }
  function stop() {
    if (!confirm("¿Terminar el detox antes de tiempo?")) return;
    endDetox();
    force((n) => n + 1);
  }

  const ms = detoxUntil() - Date.now();
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);

  return (
    <div className="mt-8">
      <h2 className="mb-3 text-sm uppercase tracking-wide text-muted">Detox</h2>
      <div className="card p-5">
        {active ? (
          <>
            <p className="text-cream">🧘 Estás en detox. Quedan <span className="font-mono text-gold">{days}d {hours}h</span>.</p>
            <p className="mt-1 text-sm text-muted">La creación de contenido está en pausa.</p>
            <button onClick={stop} className="btn-ghost mt-3 text-sm">Terminar antes</button>
          </>
        ) : (
          <>
            <p className="text-cream">Pausa la creación de contenido y enfócate en leer.</p>
            <p className="mt-1 text-sm text-muted">Solo Libros, Leer, Citas y Escribir quedan disponibles.</p>
            <div className="mt-3 flex gap-2">
              {[1, 3, 7].map((d) => (
                <button key={d} onClick={() => start(d)} className="btn-ghost text-sm">{d} día{d > 1 ? "s" : ""}</button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
