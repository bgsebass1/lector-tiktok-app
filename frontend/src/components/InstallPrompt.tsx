import { useEffect, useState } from "react";
import { isIOS, isStandalone } from "../lib/pwa";

/**
 * Banner para instalar la PWA.
 *  - iOS: no hay prompt automático → muestra instrucciones manuales.
 *  - Android/Chrome: captura `beforeinstallprompt` y ofrece "Instalar app".
 * Se oculta si ya está instalada (standalone) o si el usuario la descartó.
 */
const DISMISS_KEY = "pliego_install_dismissed";

export default function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [howOpen, setHowOpen] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | null>(null);
  const [deferred, setDeferred] = useState<(Event & { prompt: () => void; userChoice: Promise<unknown> }) | null>(null);

  useEffect(() => {
    if (isStandalone() || localStorage.getItem(DISMISS_KEY) === "true") return;

    if (isIOS()) {
      setPlatform("ios");
      setShow(true);
      return;
    }

    function onBIP(e: Event) {
      e.preventDefault();
      setDeferred(e as Event & { prompt: () => void; userChoice: Promise<unknown> });
      setPlatform("android");
      setShow(true);
    }
    window.addEventListener("beforeinstallprompt", onBIP as EventListener);
    return () => window.removeEventListener("beforeinstallprompt", onBIP as EventListener);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "true");
    setShow(false);
  }

  async function androidInstall() {
    if (!deferred) return;
    deferred.prompt();
    try {
      await deferred.userChoice;
    } catch {
      /* el usuario canceló */
    }
    setDeferred(null);
    setShow(false);
  }

  if (!show) return null;

  return (
    <>
      <div className="fixed inset-x-3 bottom-20 z-40 mx-auto max-w-md rounded-xl border border-border bg-surface p-4 shadow-xl shadow-black/50 md:bottom-6">
        <div className="flex items-start gap-3">
          <img src="/logo.svg" alt="" className="h-10 w-10 shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-cream">Instala Pliego en tu pantalla de inicio para abrirla como app.</p>
            <div className="mt-3 flex gap-2">
              {platform === "ios" ? (
                <button onClick={() => setHowOpen(true)} className="btn-gold !px-4 !py-2 text-sm">Cómo</button>
              ) : (
                <button onClick={androidInstall} className="btn-gold !px-4 !py-2 text-sm">Instalar app</button>
              )}
              <button onClick={dismiss} className="btn-ghost !px-4 !py-2 text-sm">Descartar</button>
            </div>
          </div>
        </div>
      </div>

      {howOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
          onClick={() => setHowOpen(false)}
        >
          <div className="card w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-xl text-cream">Instalar en iPhone</h2>
            <ol className="mt-4 space-y-3 text-sm text-cream/90">
              <li>1. En Safari, toca el botón <span className="text-gold">Compartir</span> (el cuadro con la flecha hacia arriba).</li>
              <li>2. Desliza y elige <span className="text-gold">"Añadir a pantalla de inicio"</span>.</li>
              <li>3. Toca <span className="text-gold">Añadir</span> y abre Pliego desde el ícono nuevo.</li>
            </ol>
            <button onClick={() => { setHowOpen(false); dismiss(); }} className="btn-gold mt-6 w-full">Entendido</button>
          </div>
        </div>
      )}
    </>
  );
}
