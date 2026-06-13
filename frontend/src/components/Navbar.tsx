import { NavLink } from "react-router-dom";

/** Enlaces de la barra de navegación superior. */
const links = [
  { to: "/", label: "Inicio", end: true },
  { to: "/libros", label: "Libros 📚" },
  { to: "/studio", label: "Studio 🎬" },
  { to: "/citas", label: "Citas ❝" },
  { to: "/palabras", label: "Palabras 🔤" },
  { to: "/calendario", label: "Calendario 🗓️" },
  { to: "/inspiracion", label: "Inspiración 💡" },
  { to: "/ideas", label: "Ideas ✨" },
  { to: "/tiktok", label: "TikTok 📊" },
];

export default function Navbar({ onOpenSearch }: { onOpenSearch: () => void }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-carbon/85 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
        {/* Marca / logo del canal */}
        <span className="shrink-0 font-display text-lg text-cream">
          Libros nada más <span className="text-gold">·</span>
        </span>

        {/* Enlaces (scrollables en pantallas pequeñas) */}
        <ul className="flex flex-1 items-center gap-0.5 overflow-x-auto text-sm">
          {links.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-lg px-3 py-2 transition ${
                    isActive ? "bg-surface text-gold" : "text-muted hover:text-cream"
                  }`
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Botón de búsqueda global */}
        <button
          onClick={onOpenSearch}
          className="flex shrink-0 items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted transition hover:border-gold hover:text-gold"
        >
          🔍 Buscar
          <kbd className="rounded bg-carbon px-1.5 py-0.5 font-mono text-xs">⌘K</kbd>
        </button>
      </nav>
    </header>
  );
}
