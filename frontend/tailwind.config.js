/** @type {import('tailwindcss').Config} */
export default {
  // Archivos donde Tailwind busca clases para generar el CSS final.
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // Paleta editorial. Los valores vienen de variables CSS (canales R G B)
      // para poder cambiar de tema en caliente y conservar las opacidades (/15).
      colors: {
        carbon: "rgb(var(--carbon) / <alpha-value>)", // fondo
        surface: "rgb(var(--surface) / <alpha-value>)", // tarjetas / paneles
        border: "rgb(var(--border) / <alpha-value>)",
        gold: "rgb(var(--gold) / <alpha-value>)", // acento
        cream: "rgb(var(--cream) / <alpha-value>)", // texto principal
        muted: "rgb(var(--muted) / <alpha-value>)", // texto secundario
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
