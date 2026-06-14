import { NavLink } from "react-router-dom";

/** Header compacto para móvil (logo + búsqueda + perfil). Oculto en desktop. */
export default function MobileHeader({ onOpenSearch }: { onOpenSearch: () => void }) {
  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-carbon/90 px-4 py-2.5 backdrop-blur md:hidden"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.625rem)" }}
    >
      <NavLink to="/" className="flex items-center gap-2">
        <img src="/logo.svg" alt="" className="h-7 w-7" />
        <span className="font-serif text-xl font-semibold text-cream">Pliego</span>
      </NavLink>
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenSearch}
          aria-label="Buscar"
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-border text-muted transition hover:border-gold hover:text-gold"
        >
          🔍
        </button>
        <NavLink
          to="/settings"
          aria-label="Perfil y ajustes"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-surface font-serif text-gold"
        >
          S
        </NavLink>
      </div>
    </header>
  );
}
