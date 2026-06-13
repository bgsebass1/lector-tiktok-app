/**
 * Servicio de analytics de TikTok.
 *
 * Por ahora devuelve datos MOCK, pero con la FIRMA exacta que tendría al
 * conectar Windsor.ai. Cuando llegue ese momento, solo hay que reemplazar el
 * cuerpo de cada método por la llamada real; el resto de la app no cambia.
 *
 * TODO: conectar Windsor.ai API en cada método de abajo.
 */

export interface AccountOverview {
  followers: number;
  totalViews: number;
  engagementRate: number;
  followerSeries: Array<{ date: string; followers: number }>;
  // Comparativa últimos 30 días vs los 30 anteriores.
  comparison: {
    views: { current: number; previous: number };
    followers: { current: number; previous: number };
    engagement: { current: number; previous: number };
  };
}

export interface TopVideo {
  id: number;
  thumbnail: string;
  caption: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  retention: number; // % retención promedio
  topic: string;
}

export interface AudienceDemographics {
  age: Array<{ range: string; percent: number }>;
  gender: Array<{ label: string; percent: number }>;
  countries: Array<{ country: string; percent: number }>;
}

export interface EngagementByTopic {
  topic: string;
  avgEngagement: number;
  videos: number;
}

/** Celda del heatmap: día (0=Dom) × hora (0-23) con un score de engagement. */
export interface PostingTimeCell {
  day: number;
  hour: number;
  score: number;
}

/* ---------- Helpers de datos mock ---------- */

function buildFollowerSeries(): Array<{ date: string; followers: number }> {
  const series: Array<{ date: string; followers: number }> = [];
  let followers = 980;
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    followers += 5 + Math.round(Math.abs(Math.sin(i)) * 12);
    series.push({ date: d.toISOString().slice(0, 10), followers });
  }
  return series;
}

/* ---------- Métodos (placeholder con datos mock) ---------- */

export function getAccountOverview(): AccountOverview {
  // TODO: conectar Windsor.ai API
  return {
    followers: 1247,
    totalViews: 89500,
    engagementRate: 6.8,
    followerSeries: buildFollowerSeries(),
    comparison: {
      views: { current: 89500, previous: 71200 },
      followers: { current: 1247, previous: 980 },
      engagement: { current: 6.8, previous: 5.9 },
    },
  };
}

export function getTopVideos(limit = 10): TopVideo[] {
  // TODO: conectar Windsor.ai API
  const topics = ["Filosofía", "Literatura", "Lenguaje", "Otro"];
  const base: TopVideo[] = [
    { caption: "Wittgenstein y los límites del lenguaje 🧠", views: 24300, likes: 3120, comments: 184, shares: 540, retention: 68, topic: "Lenguaje" },
    { caption: "Orwell predijo esto en 1984", views: 18750, likes: 2540, comments: 220, shares: 410, retention: 72, topic: "Literatura" },
    { caption: "Dante y los círculos del infierno", views: 15200, likes: 1980, comments: 142, shares: 300, retention: 61, topic: "Literatura" },
    { caption: "Nebrija: el hombre que ordenó el español", views: 9800, likes: 1240, comments: 88, shares: 150, retention: 58, topic: "Lenguaje" },
    { caption: "¿El lenguaje crea la realidad?", views: 12450, likes: 1670, comments: 109, shares: 240, retention: 64, topic: "Filosofía" },
    { caption: "3 libros de filosofía para empezar", views: 21100, likes: 2890, comments: 156, shares: 600, retention: 70, topic: "Filosofía" },
    { caption: "La biblioteca de Babel de Borges", views: 8700, likes: 1120, comments: 64, shares: 120, retention: 55, topic: "Literatura" },
    { caption: "Por qué leer a los clásicos hoy", views: 6500, likes: 845, comments: 51, shares: 90, retention: 49, topic: "Otro" },
    { caption: "El mito de la caverna en 60 segundos", views: 17800, likes: 2310, comments: 133, shares: 380, retention: 66, topic: "Filosofía" },
    { caption: "Palabras que solo existen en un idioma", views: 13900, likes: 1890, comments: 97, shares: 260, retention: 63, topic: "Lenguaje" },
  ].map((v, i) => ({
    id: i + 1,
    thumbnail: `https://placehold.co/120x160/0a0a0a/d4af37?text=${encodeURIComponent(topics[i % topics.length])}`,
    ...v,
  }));
  return base.slice(0, limit);
}

export function getAudienceDemographics(): AudienceDemographics {
  // TODO: conectar Windsor.ai API
  return {
    age: [
      { range: "13-17", percent: 8 },
      { range: "18-24", percent: 41 },
      { range: "25-34", percent: 32 },
      { range: "35-44", percent: 13 },
      { range: "45+", percent: 6 },
    ],
    gender: [
      { label: "Femenino", percent: 54 },
      { label: "Masculino", percent: 44 },
      { label: "Otro", percent: 2 },
    ],
    countries: [
      { country: "Colombia", percent: 38 },
      { country: "México", percent: 22 },
      { country: "Argentina", percent: 12 },
      { country: "España", percent: 11 },
      { country: "Perú", percent: 7 },
      { country: "Otros", percent: 10 },
    ],
  };
}

export function getBestPostingTimes(): PostingTimeCell[] {
  // TODO: conectar Windsor.ai API
  const cells: PostingTimeCell[] = [];
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      // Picos sintéticos al mediodía y en la noche, más fuertes en fin de semana.
      const noon = Math.exp(-((hour - 13) ** 2) / 8);
      const night = Math.exp(-((hour - 21) ** 2) / 6);
      const weekend = day === 0 || day === 6 ? 1.3 : 1;
      const score = Math.round((noon + night) * weekend * 100);
      cells.push({ day, hour, score });
    }
  }
  return cells;
}

export function getEngagementByTopic(): EngagementByTopic[] {
  // TODO: conectar Windsor.ai API
  return [
    { topic: "Filosofía", avgEngagement: 7.4, videos: 12 },
    { topic: "Lenguaje", avgEngagement: 6.9, videos: 9 },
    { topic: "Literatura", avgEngagement: 6.1, videos: 14 },
    { topic: "Otro", avgEngagement: 4.3, videos: 5 },
  ];
}
