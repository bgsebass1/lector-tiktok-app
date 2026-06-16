/**
 * Cliente de API: tipos compartidos + funciones para hablar con el backend.
 *
 * Gracias al proxy de Vite, podemos usar rutas relativas ("/api/...") tanto en
 * desarrollo como al hacer build.
 */

/* ---------- Tipos ---------- */

export interface Book {
  id: number;
  title: string;
  author: string;
  year: number | null;
  cover_url: string | null;
  rating: number | null;
  notes: string | null;
  themes: string | null;
  read_date: string | null;
  created_at: string;
}

/** Datos para crear/editar un libro (sin id ni created_at). */
export interface BookInput {
  title: string;
  author: string;
  year?: number | null;
  cover_url?: string | null;
  rating?: number | null;
  notes?: string | null;
  themes?: string | null;
  read_date?: string | null;
}

/** Opción de carátula devuelta por Open Library. */
export interface CoverOption {
  coverId: number;
  title: string;
  author: string;
  year: number | null;
  coverM: string;
  coverL: string;
}

/** Recomendación de libro generada por Grok. */
export interface BookRecommendation {
  title: string;
  author: string;
  reason: string;
}

/** Una idea de video. */
export interface VideoIdea {
  titulo: string;
  hook: string;
  estructura: string;
  hashtags: string[];
}

/** Una generación de ideas guardada. */
export interface SavedIdeas {
  id: number;
  topic: string;
  created_at: string;
  ideas: VideoIdea[];
}

/** Estadísticas del dashboard de TikTok. */
export interface TikTokStats {
  followers: number;
  totalViews: number;
  engagementRate: number;
  followerSeries: Array<{ date: string; followers: number }>;
  videos: Array<{
    id: number;
    thumbnail: string;
    caption: string;
    views: number;
    likes: number;
    comments: number;
  }>;
}

/* ---------- Tipos del estudio (Parte B) ---------- */

export interface ScriptBlock {
  label: string;
  timestamp: string;
  content: string;
}

export interface Script {
  id: number;
  title: string;
  topic: string | null;
  book_ref: string | null;
  duration: string | null;
  tone: string | null;
  blocks: ScriptBlock[];
  created_at: string;
  updated_at: string | null;
  versions?: Array<{ id: number; blocks: ScriptBlock[]; created_at: string }>;
}

export interface HookItem {
  style: string;
  text: string;
}

export interface Quote {
  id: number;
  book_id: number | null;
  text: string;
  page: number | null;
  tags: string | null;
  created_at: string;
  book_title: string | null;
  book_author: string | null;
}

export interface QuoteVideoIdea {
  titulo: string;
  angulo: string;
  estructura: string;
}

export interface Word {
  id: number;
  word: string;
  etymology: string | null;
  story: string | null;
  video_ideas: string[];
  status: string;
  created_at: string;
}

export interface PipelineCard {
  id: number;
  title: string;
  category: string | null;
  status: string;
  script_id: number | null;
  scheduled_date: string | null;
  notes: string | null;
  tags: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface Series {
  id: number;
  name: string;
  description: string | null;
  hashtag: string | null;
  template: string | null;
  frequency: string | null;
  created_at: string;
  episode_count: number;
}

export interface SeriesEpisode {
  id: number;
  series_id: number;
  episode_number: number;
  title: string;
  script: string;
  status: string;
  created_at: string;
}

export interface InspirationItem {
  id: number;
  type: string;
  content: string;
  description: string | null;
  tags: string | null;
  created_at: string;
}

export interface CaptionPack {
  captions: { corta: string; media: string; larga: string };
  hashtags: { mainstream: string[]; nicho: string[]; longtail: string[] };
  onScreenTexts: string[];
  thumbnails: string[];
}

export interface RepurposePack {
  twitterThread: string[];
  instagramCarousel: { titulo: string; cuerpo: string }[];
  linkedin: string;
  newsletter: string;
  reelsCaption: string;
}

export interface SearchResult {
  type:
    | "libro"
    | "cita"
    | "palabra"
    | "idea"
    | "guion"
    | "escrito"
    | "highlight"
    | "flashcard"
    | "dialogo"
    | "recurso"
    | "evento"
    | "deseo";
  id: number;
  title: string;
  subtitle?: string;
  to: string;
}

/** Analytics avanzado de TikTok. */
export interface TikTokAnalytics {
  overview: {
    followers: number;
    totalViews: number;
    engagementRate: number;
    followerSeries: Array<{ date: string; followers: number }>;
    comparison: {
      views: { current: number; previous: number };
      followers: { current: number; previous: number };
      engagement: { current: number; previous: number };
    };
  };
  topVideos: Array<{
    id: number;
    thumbnail: string;
    caption: string;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    retention: number;
    topic: string;
  }>;
  demographics: {
    age: Array<{ range: string; percent: number }>;
    gender: Array<{ label: string; percent: number }>;
    countries: Array<{ country: string; percent: number }>;
  };
  postingTimes: Array<{ day: number; hour: number; score: number }>;
  engagementByTopic: Array<{ topic: string; avgEngagement: number; videos: number }>;
}

/* ---------- Diálogos con autores ---------- */

/** Autor con el que se puede dialogar (campos públicos). */
export interface Author {
  id: string;
  name: string;
  era: string;
  blurb: string;
  accent: string;
}

/** Un mensaje del chat: del lector o del autor. */
export interface DialogueMessage {
  role: "user" | "author";
  content: string;
}

/** Resumen de una conversación guardada. */
export interface SavedDialogue {
  id: number;
  author_id: string;
  author_name: string;
  created_at: string;
  count: number;
  preview: string;
}

/** Conversación completa. */
export interface DialogueDetail {
  id: number;
  author_id: string;
  author_name: string;
  messages: DialogueMessage[];
  created_at: string;
  updated_at: string | null;
}

/* ---------- Flashcards ---------- */

export interface Flashcard {
  id: number;
  book_id: number | null;
  deck: string;
  front: string;
  back: string;
  interval_days: number;
  ease_factor: number;
  reps: number;
  due_date: string | null;
  created_at: string;
}

export interface DeckStat {
  deck: string;
  total: number;
  due: number;
}

export interface FlashcardStats {
  total: number;
  due: number;
  mastered: number;
  decks: DeckStat[];
}

/* ---------- Recursos B-roll ---------- */

export interface Resource {
  id: number;
  type: string;
  title: string;
  url_or_path: string;
  description: string | null;
  tags: string | null;
  mood: string | null;
  thumbnail: string | null;
  created_at: string;
}

export interface ResourceInput {
  type: string;
  title: string;
  url_or_path: string;
  description?: string | null;
  tags?: string | null;
  mood?: string | null;
  thumbnail?: string | null;
}

/* ---------- Timeline intelectual ---------- */

export interface TimelineEntry {
  kind: string; // "libro" | "evento" | "autor" | "idea" | "hito"
  id: number;
  year: number;
  title: string;
  subtitle: string | null;
  cover: string | null;
  isEvent: boolean;
}

export interface TimelineUndated {
  kind: string;
  id: number;
  title: string;
  subtitle: string | null;
  cover: string | null;
}

export interface TimelineData {
  entries: TimelineEntry[];
  undated: TimelineUndated[];
}

export interface TimelineEventInput {
  year: number;
  title: string;
  description?: string;
  kind?: string;
}

/* ---------- Lectura: sesiones + highlights ---------- */

export interface ReadingSession {
  id: number;
  book_id: number | null;
  book_title: string | null;
  minutes: number;
  pages: number | null;
  note: string | null;
  created_at: string;
}

export interface ReadingStats {
  totalMinutes: number;
  totalSessions: number;
  booksTouched: number;
}

export interface Highlight {
  id: number;
  book_id: number | null;
  book_title: string | null;
  text: string;
  note: string | null;
  page: number | null;
  created_at: string;
}

/* ---------- Quiero leer (lista de deseos) ---------- */

export interface WishItem {
  id: number;
  title: string;
  author: string;
  reason: string | null;
  cover_url: string | null;
  priority: number;
  source: string;
  created_at: string;
}

/* ---------- Escribir ---------- */

export interface Writing {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string | null;
}

export interface WritingSummary {
  id: number;
  title: string;
  snippet: string;
  created_at: string;
  updated_at: string | null;
}

/* ---------- Helper genérico ---------- */

/**
 * Base de la API.
 *  - En producción (Vercel) se define VITE_API_URL con el dominio del backend
 *    en Railway, p. ej. "https://pliego-backend.up.railway.app".
 *  - En local queda vacío: se usan rutas relativas (/api/...) y el proxy de Vite.
 */
const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

/** Hace una petición y lanza un error legible si la respuesta no es 2xx. */
async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(API_BASE + url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    let message = `Error ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
      // Si la API trae un código (ej: de Grok), lo mostramos para depurar.
      if (body?.code) message += ` [${body.code}]`;
    } catch {
      /* la respuesta no era JSON */
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

/* ---------- Libros ---------- */

export const api = {
  // --- Libros ---
  listBooks: () => request<Book[]>("/api/books"),

  getBook: (id: number) => request<Book>(`/api/books/${id}`),

  searchCovers: (title: string, author: string) =>
    request<CoverOption[]>(
      `/api/books/search?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}`
    ),

  createBook: (data: BookInput) =>
    request<Book>("/api/books", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateBook: (id: number, data: BookInput) =>
    request<Book>(`/api/books/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteBook: (id: number) =>
    request<{ ok: boolean }>(`/api/books/${id}`, { method: "DELETE" }),

  recommendBooks: () =>
    request<BookRecommendation[]>("/api/books/recommend", { method: "POST" }),

  // --- Ideas (Grok) ---
  generateIdeas: (topic: string) =>
    request<{ id: number; topic: string; ideas: VideoIdea[] }>(
      "/api/grok/ideas",
      { method: "POST", body: JSON.stringify({ topic }) }
    ),

  listIdeas: () => request<SavedIdeas[]>("/api/grok/ideas"),

  // --- Diálogos con autores ---
  listAuthors: () => request<Author[]>("/api/dialogues/authors"),

  dialogueReply: (authorId: string, history: DialogueMessage[], message: string) =>
    request<{ reply: string }>("/api/dialogues/reply", {
      method: "POST",
      body: JSON.stringify({ authorId, history, message }),
    }),

  listDialogues: () => request<SavedDialogue[]>("/api/dialogues"),

  getDialogue: (id: number) => request<DialogueDetail>(`/api/dialogues/${id}`),

  saveDialogue: (authorId: string, authorName: string, messages: DialogueMessage[]) =>
    request<{ id: number }>("/api/dialogues", {
      method: "POST",
      body: JSON.stringify({ authorId, authorName, messages }),
    }),

  updateDialogue: (id: number, messages: DialogueMessage[]) =>
    request<{ ok: boolean }>(`/api/dialogues/${id}`, {
      method: "PUT",
      body: JSON.stringify({ messages }),
    }),

  deleteDialogue: (id: number) =>
    request<{ ok: boolean }>(`/api/dialogues/${id}`, { method: "DELETE" }),

  // --- Flashcards ---
  listFlashcards: () => request<Flashcard[]>("/api/flashcards"),

  dueFlashcards: () => request<Flashcard[]>("/api/flashcards/due"),

  flashcardStats: () => request<FlashcardStats>("/api/flashcards/stats"),

  createFlashcard: (data: { front: string; back: string; deck?: string; book_id?: number | null }) =>
    request<Flashcard>("/api/flashcards", { method: "POST", body: JSON.stringify(data) }),

  generateFlashcards: (bookId: number) =>
    request<{ created: number; deck: string }>("/api/flashcards/generate-from-book", {
      method: "POST",
      body: JSON.stringify({ bookId }),
    }),

  reviewFlashcard: (id: number, quality: "dificil" | "bien" | "facil") =>
    request<{ id: number }>(`/api/flashcards/${id}/review`, {
      method: "PATCH",
      body: JSON.stringify({ quality }),
    }),

  deleteFlashcard: (id: number) =>
    request<{ ok: boolean }>(`/api/flashcards/${id}`, { method: "DELETE" }),

  // --- Recursos B-roll ---
  listResources: () => request<Resource[]>("/api/resources"),

  createResource: (data: ResourceInput) =>
    request<Resource>("/api/resources", { method: "POST", body: JSON.stringify(data) }),

  deleteResource: (id: number) =>
    request<{ ok: boolean }>(`/api/resources/${id}`, { method: "DELETE" }),

  // --- Timeline intelectual ---
  getTimeline: () => request<TimelineData>("/api/timeline"),

  addTimelineEvent: (data: TimelineEventInput) =>
    request<{ id: number }>("/api/timeline/events", { method: "POST", body: JSON.stringify(data) }),

  deleteTimelineEvent: (id: number) =>
    request<{ ok: boolean }>(`/api/timeline/events/${id}`, { method: "DELETE" }),

  // --- Lectura: sesiones + highlights ---
  readingStats: () => request<ReadingStats>("/api/reading/stats"),

  readingHeatmap: () => request<Array<{ d: string; m: number }>>("/api/reading/heatmap"),

  // --- Quiero leer ---
  listWishlist: () => request<WishItem[]>("/api/wishlist"),

  addWish: (data: { title: string; author: string; reason?: string; cover_url?: string; source?: string }) =>
    request<WishItem>("/api/wishlist", { method: "POST", body: JSON.stringify(data) }),

  moveWish: (id: number, dir: "up" | "down") =>
    request<{ ok: boolean }>(`/api/wishlist/${id}/move?dir=${dir}`, { method: "POST" }),

  promoteWish: (id: number) =>
    request<Book>(`/api/wishlist/${id}/promote`, { method: "POST" }),

  deleteWish: (id: number) =>
    request<{ ok: boolean }>(`/api/wishlist/${id}`, { method: "DELETE" }),

  // --- Escribir ---
  listWritings: () => request<WritingSummary[]>("/api/writings"),

  getWriting: (id: number) => request<Writing>(`/api/writings/${id}`),

  createWriting: (data?: { title?: string; content?: string }) =>
    request<Writing>("/api/writings", { method: "POST", body: JSON.stringify(data ?? {}) }),

  updateWriting: (id: number, data: { title?: string; content?: string }) =>
    request<Writing>(`/api/writings/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  deleteWriting: (id: number) =>
    request<{ ok: boolean }>(`/api/writings/${id}`, { method: "DELETE" }),

  listSessions: (bookId?: number) =>
    request<ReadingSession[]>(`/api/reading/sessions${bookId ? `?bookId=${bookId}` : ""}`),

  createSession: (data: { book_id: number | null; minutes: number; pages?: number | null; note?: string | null }) =>
    request<ReadingSession>("/api/reading/sessions", { method: "POST", body: JSON.stringify(data) }),

  deleteSession: (id: number) =>
    request<{ ok: boolean }>(`/api/reading/sessions/${id}`, { method: "DELETE" }),

  listHighlights: (bookId?: number) =>
    request<Highlight[]>(`/api/reading/highlights${bookId ? `?bookId=${bookId}` : ""}`),

  createHighlight: (data: { book_id: number | null; text: string; note?: string | null; page?: number | null }) =>
    request<Highlight>("/api/reading/highlights", { method: "POST", body: JSON.stringify(data) }),

  deleteHighlight: (id: number) =>
    request<{ ok: boolean }>(`/api/reading/highlights/${id}`, { method: "DELETE" }),

  // --- TikTok ---
  getTikTokStats: () => request<TikTokStats>("/api/tiktok/stats"),
  getTikTokAnalytics: () => request<TikTokAnalytics>("/api/tiktok/analytics"),
  analyzeTikTok: () =>
    request<{ insights: string[] }>("/api/tiktok/analyze", { method: "POST" }),

  // --- Módulo 1: Guiones ---
  listScripts: () => request<Script[]>("/api/scripts"),
  getScript: (id: number) => request<Script>(`/api/scripts/${id}`),
  generateScript: (data: {
    topic: string;
    bookRef?: string;
    duration: string;
    tone: string;
  }) =>
    request<{ blocks: ScriptBlock[] }>("/api/scripts/generate", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  createScript: (data: Partial<Script>) =>
    request<Script>("/api/scripts", { method: "POST", body: JSON.stringify(data) }),
  updateScript: (id: number, data: Partial<Script>) =>
    request<Script>(`/api/scripts/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteScript: (id: number) =>
    request<{ ok: boolean }>(`/api/scripts/${id}`, { method: "DELETE" }),
  rewriteBlock: (fullScript: ScriptBlock[], blockIndex: number, instruction?: string) =>
    request<{ content: string }>("/api/scripts/rewrite-block", {
      method: "POST",
      body: JSON.stringify({ fullScript, blockIndex, instruction }),
    }),
  transformScript: (blocks: ScriptBlock[], mode: "viral" | "deep" | "shorter") =>
    request<{ blocks: ScriptBlock[] }>("/api/scripts/transform", {
      method: "POST",
      body: JSON.stringify({ blocks, mode }),
    }),

  // --- Módulo 2: Hooks ---
  generateHooks: (topic: string) =>
    request<{ hooks: HookItem[] }>("/api/studio/hooks", {
      method: "POST",
      body: JSON.stringify({ topic }),
    }),
  moreHooks: (hook: string, topic: string) =>
    request<{ hooks: HookItem[] }>("/api/studio/hooks/more", {
      method: "POST",
      body: JSON.stringify({ hook, topic }),
    }),

  // --- Módulo 8: Captions ---
  generateCaptions: (script: string) =>
    request<CaptionPack>("/api/studio/captions", {
      method: "POST",
      body: JSON.stringify({ script }),
    }),

  // --- Módulo 9: Repurpose ---
  repurpose: (script: string) =>
    request<RepurposePack>("/api/studio/repurpose", {
      method: "POST",
      body: JSON.stringify({ script }),
    }),

  // --- Módulo 3: Citas ---
  listQuotes: () => request<Quote[]>("/api/quotes"),
  createQuote: (data: { book_id?: number | null; text: string; page?: number | null; tags?: string | null }) =>
    request<Quote>("/api/quotes", { method: "POST", body: JSON.stringify(data) }),
  updateQuote: (id: number, data: Partial<Quote>) =>
    request<Quote>(`/api/quotes/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteQuote: (id: number) =>
    request<{ ok: boolean }>(`/api/quotes/${id}`, { method: "DELETE" }),
  quoteToVideo: (id: number) =>
    request<{ ideas: QuoteVideoIdea[] }>(`/api/quotes/${id}/to-video`, { method: "POST" }),

  // --- Módulo 4: Palabras ---
  listWords: () => request<Word[]>("/api/words"),
  analyzeWord: (word: string) =>
    request<Word>("/api/words/analyze", { method: "POST", body: JSON.stringify({ word }) }),
  setWordStatus: (id: number, status: string) =>
    request<{ ok: boolean; status: string }>(`/api/words/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  deleteWord: (id: number) =>
    request<{ ok: boolean }>(`/api/words/${id}`, { method: "DELETE" }),

  // --- Módulo 5: Pipeline (kanban) ---
  listPipeline: () => request<PipelineCard[]>("/api/pipeline"),
  createCard: (data: Partial<PipelineCard>) =>
    request<PipelineCard>("/api/pipeline", { method: "POST", body: JSON.stringify(data) }),
  updateCard: (id: number, data: Partial<PipelineCard>) =>
    request<PipelineCard>(`/api/pipeline/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteCard: (id: number) =>
    request<{ ok: boolean }>(`/api/pipeline/${id}`, { method: "DELETE" }),

  // --- Módulo 6: Series ---
  listSeries: () => request<Series[]>("/api/series"),
  createSeries: (data: Partial<Series>) =>
    request<Series>("/api/series", { method: "POST", body: JSON.stringify(data) }),
  deleteSeries: (id: number) =>
    request<{ ok: boolean }>(`/api/series/${id}`, { method: "DELETE" }),
  listEpisodes: (seriesId: number) =>
    request<SeriesEpisode[]>(`/api/series/${seriesId}/episodes`),
  nextEpisode: (seriesId: number, topic: string) =>
    request<SeriesEpisode>(`/api/series/${seriesId}/next`, {
      method: "POST",
      body: JSON.stringify({ topic }),
    }),

  // --- Módulo 7: Inspiración ---
  listInspiration: () => request<InspirationItem[]>("/api/inspiration"),
  createInspiration: (data: Partial<InspirationItem>) =>
    request<InspirationItem>("/api/inspiration", { method: "POST", body: JSON.stringify(data) }),
  deleteInspiration: (id: number) =>
    request<{ ok: boolean }>(`/api/inspiration/${id}`, { method: "DELETE" }),
  inspireFrom: (id: number) =>
    request<{ ideas: Array<{ titulo: string; conexion: string }> }>(
      `/api/inspiration/${id}/ideas`,
      { method: "POST" }
    ),

  // --- Transversal: búsqueda global ---
  search: (q: string) => request<SearchResult[]>(`/api/search?q=${encodeURIComponent(q)}`),
};
