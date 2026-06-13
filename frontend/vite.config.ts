import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Configuración de Vite.
// El proxy redirige todas las llamadas que empiezan con /api hacia el backend
// (puerto 3001), así el frontend puede usar rutas relativas tipo fetch("/api/books").
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
