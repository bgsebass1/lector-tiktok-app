import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";
import { initTheme } from "./lib/theme";

// Aplicamos el tema guardado antes de renderizar (evita parpadeo).
initTheme();

// Montamos la app dentro de <BrowserRouter> para tener navegación por rutas.
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// Registro del service worker (PWA). Solo en producción: en desarrollo
// interferiría con el HMR de Vite. La instalación real ("Añadir a pantalla de
// inicio") requiere HTTPS o localhost — se verifica en el build/deploy.
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .catch((err) => console.warn("No se pudo registrar el service worker:", err));
  });
}
