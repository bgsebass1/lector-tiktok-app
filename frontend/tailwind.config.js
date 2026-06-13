/** @type {import('tailwindcss').Config} */
export default {
  // Archivos donde Tailwind busca clases para generar el CSS final.
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // Paleta editorial oscura.
      colors: {
        carbon: "#0a0a0a", // fondo negro carbón
        surface: "#141414", // tarjetas / paneles
        border: "#262626",
        gold: "#d4af37", // dorado suave (acento)
        cream: "#f5f0e1", // blanco crema (texto principal)
        muted: "#8a8a82", // texto secundario
      },
      fontFamily: {
        // Serif para títulos, sans para cuerpo, mono para fechas/stats.
        serif: ['"Cormorant Garamond"', "Georgia", "serif"],
        display: ['"Playfair Display"', "Georgia", "serif"],
        sans: ['Inter', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
