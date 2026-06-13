import { useEffect, useState } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Toaster } from "react-hot-toast";

import Navbar from "./components/Navbar";
import CommandPalette from "./components/CommandPalette";
import RadialMenu from "./components/RadialMenu";
import PageTransition from "./components/PageTransition";

import Dashboard from "./pages/Dashboard";
import Books from "./pages/Books";
import Ideas from "./pages/Ideas";
import TikTok from "./pages/TikTok";
import Studio from "./pages/Studio";
import Citas from "./pages/Citas";
import Palabras from "./pages/Palabras";
import Calendario from "./pages/Calendario";
import Inspiracion from "./pages/Inspiracion";

/** Páginas para los atajos Cmd+1..6. */
const SHORTCUT_ROUTES = ["/", "/libros", "/studio", "/citas", "/calendario", "/tiktok"];

/**
 * Componente raíz: navbar + rutas con transiciones + capas globales
 * (Toaster, paleta de comandos Cmd+K, menú radial Cmd+N).
 */
export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [radialOpen, setRadialOpen] = useState(false);

  // Atajos de teclado globales (mejora transversal 5).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;

      if (e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      } else if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        setRadialOpen((v) => !v);
      } else if (/^[1-6]$/.test(e.key)) {
        e.preventDefault();
        navigate(SHORTCUT_ROUTES[Number(e.key) - 1]);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  return (
    <div className="min-h-screen">
      <Navbar onOpenSearch={() => setSearchOpen(true)} />

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* AnimatePresence + key por ruta = transición al cambiar de página. */}
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname}>
            <Routes location={location}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/libros" element={<Books />} />
              <Route path="/studio" element={<Studio />} />
              <Route path="/citas" element={<Citas />} />
              <Route path="/palabras" element={<Palabras />} />
              <Route path="/calendario" element={<Calendario />} />
              <Route path="/inspiracion" element={<Inspiracion />} />
              <Route path="/ideas" element={<Ideas />} />
              <Route path="/tiktok" element={<TikTok />} />
            </Routes>
          </PageTransition>
        </AnimatePresence>
      </main>

      {/* Capas globales */}
      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
      <RadialMenu open={radialOpen} setOpen={setRadialOpen} />

      {/* Notificaciones (toasts) con estilo dark editorial. */}
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: "#141414",
            color: "#f5f0e1",
            border: "1px solid #262626",
            fontSize: "14px",
          },
          success: { iconTheme: { primary: "#d4af37", secondary: "#0a0a0a" } },
          error: { duration: 6000 },
        }}
      />
    </div>
  );
}
