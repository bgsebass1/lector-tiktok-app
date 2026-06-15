/** Temas visuales de Pliego. Se aplican con data-theme en <html>. */

export interface Theme {
  id: string;
  name: string;
  desc: string;
  /** Colores para el swatch de vista previa (no afectan al tema real). */
  preview: { bg: string; surface: string; accent: string; text: string };
}

export const THEMES: Theme[] = [
  {
    id: "carbon",
    name: "Carbón",
    desc: "Oscuro editorial (por defecto)",
    preview: { bg: "#0a0a0a", surface: "#141414", accent: "#d4af37", text: "#f5f0e1" },
  },
  {
    id: "pergamino",
    name: "Pergamino",
    desc: "Papel cálido, claro",
    preview: { bg: "#f4ecd8", surface: "#fbf6e9", accent: "#9a6b2f", text: "#3a2f1d" },
  },
  {
    id: "nocturno",
    name: "Nocturno",
    desc: "Azul medianoche",
    preview: { bg: "#0b1220", surface: "#131c2e", accent: "#8ab4f8", text: "#dce3f0" },
  },
  {
    id: "bosque",
    name: "Bosque",
    desc: "Verde profundo",
    preview: { bg: "#0c1410", surface: "#14201a", accent: "#9bbf7a", text: "#e8efe2" },
  },
];

const KEY = "pliego_theme";

export function getTheme(): string {
  return localStorage.getItem(KEY) || "carbon";
}

export function applyTheme(id: string): void {
  document.documentElement.dataset.theme = id;
  localStorage.setItem(KEY, id);
}

/** Aplica el tema guardado al arrancar la app. */
export function initTheme(): void {
  applyTheme(getTheme());
}
