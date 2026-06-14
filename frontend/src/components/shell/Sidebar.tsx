import { NavLink } from "react-router-dom";
import { sidebarSections } from "../../lib/nav";

/** Sidebar fija para desktop (≥768px). Oculta en móvil. */
export default function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-carbon/80 md:flex">
      <NavLink to="/" className="flex items-center gap-2 px-5 py-5">
        <img src="/logo.svg" alt="" className="h-8 w-8" />
        <span className="font-serif text-2xl font-semibold text-cream">Pliego</span>
      </NavLink>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {sidebarSections.map((section, i) => (
          <div key={i} className="mb-4">
            {section.title && (
              <p className="px-3 pb-1 pt-2 text-xs uppercase tracking-wider text-muted">{section.title}</p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                        isActive ? "bg-surface text-gold" : "text-muted hover:bg-surface/60 hover:text-cream"
                      }`
                    }
                  >
                    <span className="w-5 text-center">{item.icon}</span>
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-border px-4 py-3">
        <NavLink to="/settings" className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm text-muted transition hover:text-cream">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface font-serif text-gold">S</span>
          <span className="flex-1">Sebastian</span>
          <span aria-hidden>⚙️</span>
        </NavLink>
      </div>
    </aside>
  );
}
