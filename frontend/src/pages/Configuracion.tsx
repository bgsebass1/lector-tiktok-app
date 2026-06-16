import { useNavigate } from "react-router-dom";
import { notifyOk } from "../lib/notify";

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

      {/* Acciones */}
      <div className="mt-8">
        <h2 className="mb-3 text-sm uppercase tracking-wide text-muted">General</h2>
        <button onClick={repeatOnboarding} className="btn-ghost w-full">
          🪶 Ver el recorrido de bienvenida otra vez
        </button>
      </div>

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
