import { NavLink } from "react-router-dom";
import { bottomNav } from "../../lib/nav";

/** Bottom navigation fija para móvil. Oculta en desktop. */
export default function BottomNav({ onMore }: { onMore: () => void }) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-carbon/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {bottomNav.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `flex h-16 flex-col items-center justify-center gap-0.5 text-[11px] transition ${
              isActive ? "text-gold" : "text-muted"
            }`
          }
        >
          <span className="text-xl leading-none" aria-hidden>{item.icon}</span>
          {item.label}
        </NavLink>
      ))}
      <button onClick={onMore} className="flex h-16 flex-col items-center justify-center gap-0.5 text-[11px] text-muted">
        <span className="text-xl leading-none" aria-hidden>⋯</span>
        Más
      </button>
    </nav>
  );
}
