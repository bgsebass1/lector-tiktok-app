import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Toaster } from "react-hot-toast";

import AppShell from "./components/shell/AppShell";
import CommandPalette from "./components/CommandPalette";
import RadialMenu from "./components/RadialMenu";
import InstallPrompt from "./components/InstallPrompt";
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
import EstudioHub from "./pages/EstudioHub";
import Branding from "./pages/Branding";
import Dialogos from "./pages/Dialogos";
import DialogoNuevo from "./pages/DialogoNuevo";
import Flashcards from "./pages/Flashcards";
import FlashcardsStudy from "./pages/FlashcardsStudy";
import Recursos from "./pages/Recursos";
import Timeline from "./pages/Timeline";
import Leer from "./pages/Leer";
import LeerSesion from "./pages/LeerSesion";
import Apariencia from "./pages/Apariencia";
import Stub from "./pages/Stub";

/** Rutas para los atajos Cmd+1..6. */
const SHORTCUT_ROUTES = ["/", "/libros", "/crear", "/citas", "/calendario", "/tiktok"];

/**
 * Componente raíz: shell responsive + rutas con transiciones + capas globales
 * (Toaster, paleta de comandos Cmd+K, menú radial Cmd+N).
 */
export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [radialOpen, setRadialOpen] = useState(false);

  // Atajos de teclado globales.
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
    <>
      <AppShell onOpenSearch={() => setSearchOpen(true)}>
        {/* AnimatePresence + key por ruta = transición al cambiar de página. */}
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname}>
            <Routes location={location}>
              {/* Inicio + lectura */}
              <Route path="/" element={<Dashboard />} />
              <Route path="/libros" element={<Books />} />
              <Route path="/libros/:id" element={<Stub title="Detalle del libro" note="Highlights y sesiones del libro — llega en la Parte B." />} />
              <Route path="/leer" element={<Leer />} />
              <Route path="/leer/:bookId" element={<LeerSesion />} />

              {/* Estudio */}
              <Route path="/estudio" element={<EstudioHub />} />
              <Route path="/flashcards" element={<Flashcards />} />
              <Route path="/flashcards/estudiar" element={<FlashcardsStudy />} />
              <Route path="/flashcards/nueva" element={<Flashcards />} />
              <Route path="/dialogos" element={<Dialogos />} />
              <Route path="/dialogos/nuevo" element={<DialogoNuevo />} />
              <Route path="/dialogos/:id" element={<DialogoNuevo />} />
              <Route path="/timeline" element={<Timeline />} />

              {/* Creación */}
              <Route path="/crear" element={<Studio />} />
              <Route path="/crear/*" element={<Studio />} />

              {/* Personal / contenido */}
              <Route path="/citas" element={<Citas />} />
              <Route path="/citas/:id" element={<Citas />} />
              <Route path="/palabras" element={<Palabras />} />
              <Route path="/palabras/:id" element={<Palabras />} />
              <Route path="/calendario" element={<Calendario />} />
              <Route path="/calendario/mes" element={<Calendario />} />
              <Route path="/inspiracion" element={<Inspiracion />} />
              <Route path="/constelacion" element={<Stub title="Constelación" note="Grafo de conexiones — Parte C." />} />
              <Route path="/escribir" element={<Stub title="Escribir" note="Editor de escritura libre — Parte C." />} />
              <Route path="/escribir/:id" element={<Stub title="Escribir" note="Parte C." />} />
              <Route path="/recursos" element={<Recursos />} />
              <Route path="/tiktok" element={<TikTok />} />
              <Route path="/ideas" element={<Ideas />} />
              <Route path="/coleccion" element={<Stub title="Colección" note="Cartas coleccionables de libros leídos — Parte F." />} />

              {/* Identidad / configuración */}
              <Route path="/branding" element={<Branding />} />
              <Route path="/settings" element={<Stub title="Configuración" note="Ajustes generales — Parte E." />} />
              <Route path="/settings/apariencia" element={<Apariencia />} />
              <Route path="/settings/sonidos" element={<Stub title="Sonidos" note="Sonidos de interfaz — Parte D." />} />
              <Route path="/settings/backup" element={<Stub title="Backup" note="Exportar / importar tus datos — Parte E." />} />
              <Route path="/settings/atajos" element={<Stub title="Atajos de teclado" note="Parte E." />} />
              <Route path="/onboarding" element={<Stub title="Bienvenido a Pliego" note="Flujo de primera vez — Parte E." />} />

              {/* Cualquier otra ruta vuelve al inicio. */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </PageTransition>
        </AnimatePresence>
      </AppShell>

      {/* Capas globales */}
      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
      {/* Menú radial "+" solo en desktop (en móvil está el bottom-nav "Crear"). */}
      <div className="hidden md:block">
        <RadialMenu open={radialOpen} setOpen={setRadialOpen} />
      </div>

      {/* Banner para instalar la PWA (iOS/Android). */}
      <InstallPrompt />

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
    </>
  );
}
