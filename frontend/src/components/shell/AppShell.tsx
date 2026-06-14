import { useState, type ReactNode } from "react";
import Sidebar from "./Sidebar";
import MobileHeader from "./MobileHeader";
import BottomNav from "./BottomNav";
import MoreDrawer from "./MoreDrawer";

/**
 * Shell responsive de la app (A1).
 *  - Desktop (≥768px): sidebar fija a la izquierda.
 *  - Móvil: header compacto arriba + bottom-nav + drawer "Más".
 */
export default function AppShell({
  children,
  onOpenSearch,
}: {
  children: ReactNode;
  onOpenSearch: () => void;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen md:flex">
      <Sidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <MobileHeader onOpenSearch={onOpenSearch} />
        <main className="flex-1 px-4 py-6 pb-24 md:px-8 md:py-8 md:pb-8">{children}</main>
      </div>
      <BottomNav onMore={() => setDrawerOpen(true)} />
      <MoreDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
