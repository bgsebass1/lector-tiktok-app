import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Toaster } from "react-hot-toast";

import AppShell from "./components/shell/AppShell";
import CommandPalette from "./components/CommandPalette";
import RadialMenu from "./components/RadialMenu";
import InstallPrompt from "./components/InstallPrompt";
import DailyRitual from "./components/DailyRitual";
import RadioMini from "./components/RadioMini";
import { RadioProvider } from "./lib/radio";
import Radio from "./pages/Radio";
import Antologia from "./pages/Antologia";
import Wrapped from "./pages/Wrapped";
import Debate from "./pages/Debate";
import Taller from "./pages/Taller";
import TallerDia from "./pages/TallerDia";
import DetoxBlock from "./components/DetoxBlock";
import { isDetox, isBlocked, detoxUntil, endDetox } from "./lib/detox";
import { notifyOk } from "./lib/notify";
import Onboarding from "./components/Onboarding";
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
import Escribir from "./pages/Escribir";
import EscribirEditor from "./pages/EscribirEditor";
import QuieroLeer from "./pages/QuieroLeer";
import Constelacion from "./pages/Constelacion";
import Monje from "./pages/Monje";
import Shuffle from "./pages/Shuffle";
import Sonidos from "./pages/Sonidos";
import Configuracion from "./pages/Configuracion";
import Backup from "./pages/Backup";
import Atajos from "./pages/Atajos";
import Coleccion from "./pages/Coleccion";
import Banco from "./pages/Banco";
import Oraculo from "./pages/Oraculo";
import Mood from "./pages/Mood";
import Recetario from "./pages/Recetario";
import PalabraInmersiva from "./pages/PalabraInmersiva";
import CadaverExquisito from "./pages/CadaverExquisito";
import DialogosCruce from "./pages/DialogosCruce";
import Voz from "./pages/Voz";
import MapaEmocional from "./pages/MapaEmocional";
import Influencias from "./pages/Influencias";
import Estante from "./pages/Estante";
import NichoMap from "./pages/NichoMap";
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

  // Detox expirado: limpiar y dar la bienvenida de vuelta.
  useEffect(() => {
    const until = detoxUntil();
    if (until && until <= Date.now()) {
      endDetox();
      notifyOk("Volviste. Ahora con más adentro.");
    }
  }, []);

  return (
    <RadioProvider>
      <AppShell onOpenSearch={() => setSearchOpen(true)}>
        {/* AnimatePresence + key por ruta = transición al cambiar de página. */}
        {isDetox() && isBlocked(location.pathname) ? (
          <DetoxBlock />
        ) : (
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname}>
            <Routes location={location}>
              {/* Inicio + lectura */}
              <Route path="/" element={<Dashboard />} />
              <Route path="/libros" element={<Books />} />
              <Route path="/libros/:id" element={<Stub title="Detalle del libro" note="Highlights y sesiones del libro — llega en la Parte B." />} />
              <Route path="/leer" element={<Leer />} />
              <Route path="/leer/:bookId" element={<LeerSesion />} />
              <Route path="/quiero-leer" element={<QuieroLeer />} />

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
              <Route path="/constelacion" element={<Constelacion />} />
              <Route path="/monje" element={<Monje />} />
              <Route path="/shuffle" element={<Shuffle />} />
              <Route path="/banco" element={<Banco />} />
              <Route path="/oraculo" element={<Oraculo />} />
              <Route path="/mood" element={<Mood />} />
              <Route path="/recetario" element={<Recetario />} />
              <Route path="/palabra" element={<PalabraInmersiva />} />
              <Route path="/cadaver-exquisito" element={<CadaverExquisito />} />
              <Route path="/dialogos/cruce" element={<DialogosCruce />} />
              <Route path="/voz" element={<Voz />} />
              <Route path="/mapa-emocional" element={<MapaEmocional />} />
              <Route path="/influencias" element={<Influencias />} />
              <Route path="/estante" element={<Estante />} />
              <Route path="/nicho-map" element={<NichoMap />} />
              <Route path="/radio" element={<Radio />} />
              <Route path="/antologia" element={<Antologia />} />
              <Route path="/wrapped" element={<Wrapped />} />
              <Route path="/debate" element={<Debate />} />
              <Route path="/taller" element={<Taller />} />
              <Route path="/taller/:day" element={<TallerDia />} />
              <Route path="/escribir" element={<Escribir />} />
              <Route path="/escribir/:id" element={<EscribirEditor />} />
              <Route path="/recursos" element={<Recursos />} />
              <Route path="/tiktok" element={<TikTok />} />
              <Route path="/ideas" element={<Ideas />} />
              <Route path="/coleccion" element={<Coleccion />} />

              {/* Identidad / configuración */}
              <Route path="/branding" element={<Branding />} />
              <Route path="/settings" element={<Configuracion />} />
              <Route path="/settings/apariencia" element={<Apariencia />} />
              <Route path="/settings/sonidos" element={<Sonidos />} />
              <Route path="/settings/backup" element={<Backup />} />
              <Route path="/settings/atajos" element={<Atajos />} />
              <Route path="/onboarding" element={<Stub title="Bienvenido a Pliego" note="Flujo de primera vez — Parte E." />} />

              {/* Cualquier otra ruta vuelve al inicio. */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </PageTransition>
        </AnimatePresence>
        )}
      </AppShell>

      {/* Capas globales */}
      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
      {/* Menú radial "+" solo en desktop (en móvil está el bottom-nav "Crear"). */}
      <div className="hidden md:block">
        <RadialMenu open={radialOpen} setOpen={setRadialOpen} />
      </div>

      {/* Onboarding de primera vez (se muestra antes que el ritual). */}
      <Onboarding />

      {/* Ritual diario: bienvenida una vez al día. */}
      <DailyRitual />

      {/* Mini-controles de radio (persisten en toda la app). */}
      <RadioMini />

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
    </RadioProvider>
  );
}
