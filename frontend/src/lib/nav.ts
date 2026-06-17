/**
 * Configuración central de navegación (estructura de rutas E1).
 * Usada por el sidebar (desktop), el bottom-nav y el drawer "Más" (móvil).
 */
export type NavItem = { label: string; to: string; icon: string; end?: boolean };
export type NavSection = { title: string | null; items: NavItem[] };

/** Bottom-nav móvil: 4 destinos + el botón "Más" (que abre el drawer). */
export const bottomNav: NavItem[] = [
  { label: "Inicio", to: "/", icon: "🏠", end: true },
  { label: "Libros", to: "/libros", icon: "📚" },
  { label: "Crear", to: "/crear", icon: "✍️" },
  { label: "Estudio", to: "/estudio", icon: "📖" },
];

/** Grupos del drawer "Más" (móvil). */
export const drawerSections: NavSection[] = [
  {
    title: "Tu lectura",
    items: [
      { label: "Leer", to: "/leer", icon: "📖" },
      { label: "Quiero leer", to: "/quiero-leer", icon: "🔖" },
      { label: "Calendario", to: "/calendario", icon: "📅" },
      { label: "Diálogos", to: "/dialogos", icon: "💭" },
      { label: "Cruce de autores", to: "/dialogos/cruce", icon: "⚔️" },
      { label: "Flashcards", to: "/flashcards", icon: "🗂️" },
      { label: "Timeline", to: "/timeline", icon: "🧭" },
      { label: "Palabra del día", to: "/palabra", icon: "🔡" },
    ],
  },
  {
    title: "Tu contenido",
    items: [
      { label: "Banco de ideas", to: "/banco", icon: "🧠" },
      { label: "Oráculo", to: "/oraculo", icon: "🔮" },
      { label: "Mood reading", to: "/mood", icon: "🎭" },
      { label: "Recetario de hooks", to: "/recetario", icon: "🪝" },
      { label: "Cadáver exquisito", to: "/cadaver-exquisito", icon: "🩻" },
      { label: "Estudio de voz", to: "/voz", icon: "🎙️" },
      { label: "Mapa emocional", to: "/mapa-emocional", icon: "🗺️" },
      { label: "Árbol de influencias", to: "/influencias", icon: "🌳" },
      { label: "Estante 3D", to: "/estante", icon: "📚" },
      { label: "Nicho map", to: "/nicho-map", icon: "🪐" },
      { label: "Inspiración", to: "/inspiracion", icon: "💡" },
      { label: "Modo monje", to: "/monje", icon: "🧘" },
      { label: "Shuffle creativo", to: "/shuffle", icon: "🎲" },
      { label: "Constelación", to: "/constelacion", icon: "🕸️" },
      { label: "Escribir", to: "/escribir", icon: "✒️" },
      { label: "Recursos B-roll", to: "/recursos", icon: "🎬" },
      { label: "Analytics TikTok", to: "/tiktok", icon: "📊" },
    ],
  },
  {
    title: "Personal",
    items: [
      { label: "Citas", to: "/citas", icon: "❝" },
      { label: "Palabras", to: "/palabras", icon: "🔤" },
      { label: "Colección", to: "/coleccion", icon: "🃏" },
      { label: "Sonidos", to: "/settings/sonidos", icon: "🔊" },
      { label: "Configuración", to: "/settings", icon: "⚙️" },
      { label: "Backup", to: "/settings/backup", icon: "💾" },
    ],
  },
];

/** Sidebar (desktop) = grupo primario (bottom-nav) + los grupos del drawer. */
export const sidebarSections: NavSection[] = [
  { title: null, items: bottomNav },
  ...drawerSections,
];
