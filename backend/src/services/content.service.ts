/**
 * Servicio de generación de CONTENIDO con Grok.
 *
 * Centraliza todos los prompts del estudio (guiones, hooks, captions,
 * repurposing, etimologías, series, inspiración, analytics) para mantener
 * una voz coherente y no repetir lógica de llamada.
 */
import { grokJson, grokText, CHANNEL_CONTEXT } from "./grok.service.js";

/* ---------- Tipos compartidos ---------- */

/** Un bloque de guion con su marca de tiempo. */
export interface ScriptBlock {
  label: string; // ej: "HOOK", "PLANTEAMIENTO"
  timestamp: string; // ej: "[0-3s]"
  content: string;
}

export interface HookItem {
  style: string; // ej: "Pregunta provocadora"
  text: string;
}

export interface QuoteVideoIdea {
  titulo: string;
  angulo: string;
  estructura: string;
}

export interface WordAnalysis {
  etymology: string;
  story: string;
  video_ideas: string[];
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

/* ---------- Módulo 1: Guiones ---------- */

/** Duraciones soportadas y su reparto de bloques sugerido. */
const DURATION_HINTS: Record<string, string> = {
  "15s": "[0-2s] HOOK, [2-5s] PLANTEAMIENTO, [5-12s] DESARROLLO, [12-15s] CIERRE + CTA",
  "30s": "[0-3s] HOOK, [3-8s] PLANTEAMIENTO, [8-22s] DESARROLLO, [22-27s] GIRO, [27-30s] CIERRE + CTA",
  "60s": "[0-3s] HOOK, [3-10s] PLANTEAMIENTO, [10-45s] DESARROLLO con ejemplos, [45-55s] GIRO / INSIGHT, [55-60s] CIERRE + CTA",
  "90s": "[0-3s] HOOK, [3-12s] PLANTEAMIENTO, [12-65s] DESARROLLO con ejemplos, [65-80s] GIRO / INSIGHT, [80-90s] CIERRE + CTA",
};

/** Genera un guion estructurado en bloques con timestamps. */
export async function generateScript(input: {
  topic: string;
  bookRef?: string;
  duration: string;
  tone: string;
}): Promise<ScriptBlock[]> {
  const hint = DURATION_HINTS[input.duration] ?? DURATION_HINTS["60s"];
  const system = `${CHANNEL_CONTEXT} Eres guionista de videos cortos virales.`;
  const user = `Escribe un guion para un video de TikTok.
Tema: ${input.topic}
${input.bookRef ? `Libro/autor de referencia: ${input.bookRef}` : ""}
Duración objetivo: ${input.duration}
Tono: ${input.tone}

Estructura por bloques con esta distribución de tiempos: ${hint}
El DESARROLLO debe incluir ejemplos concretos. Escribe en primera persona, listo para leer en voz alta.

Responde ÚNICAMENTE en JSON válido con esta estructura exacta:
{
  "blocks": [
    { "label": "HOOK", "timestamp": "[0-3s]", "content": "..." }
  ]
}`;
  const parsed = await grokJson<{ blocks: ScriptBlock[] }>(system, user);
  return parsed.blocks ?? [];
}

/** Reescribe un solo bloque manteniendo coherencia con el resto del guion. */
export async function rewriteBlock(input: {
  fullScript: ScriptBlock[];
  blockIndex: number;
  instruction?: string;
}): Promise<string> {
  const target = input.fullScript[input.blockIndex];
  const contexto = input.fullScript
    .map((b, i) => `${i === input.blockIndex ? "👉 " : ""}${b.timestamp} ${b.label}: ${b.content}`)
    .join("\n");

  const system = `${CHANNEL_CONTEXT} Eres guionista de videos cortos.`;
  const user = `Este es un guion completo:
${contexto}

Reescribe ÚNICAMENTE el bloque marcado con 👉 (${target.label} ${target.timestamp}).
${input.instruction ? `Indicación extra: ${input.instruction}` : "Hazlo más fuerte y natural."}
Mantén la coherencia con el resto. Responde solo con el texto nuevo del bloque, sin etiquetas ni comillas.`;

  const text = await grokText(system, user);
  return text.trim();
}

/** Transforma un guion completo (más viral / más profundo / más corto). */
export async function transformScript(input: {
  blocks: ScriptBlock[];
  mode: "viral" | "deep" | "shorter";
}): Promise<ScriptBlock[]> {
  const modeText: Record<string, string> = {
    viral: "Hazlo más viral: hooks más potentes, ritmo más rápido, frases más pegajosas.",
    deep: "Hazlo más profundo: más matiz intelectual, mejores ejemplos, más rigor.",
    shorter: "Hazlo más corto y directo: elimina relleno, condensa las ideas.",
  };
  const actual = input.blocks
    .map((b) => `${b.timestamp} ${b.label}: ${b.content}`)
    .join("\n");

  const system = `${CHANNEL_CONTEXT} Eres guionista de videos cortos.`;
  const user = `Guion actual:
${actual}

${modeText[input.mode]}
Mantén la estructura de bloques con sus timestamps y labels.

Responde ÚNICAMENTE en JSON válido:
{
  "blocks": [
    { "label": "...", "timestamp": "...", "content": "..." }
  ]
}`;

  const parsed = await grokJson<{ blocks: ScriptBlock[] }>(system, user);
  return parsed.blocks ?? [];
}

/* ---------- Módulo 2: Hooks ---------- */

const HOOK_STYLES = [
  "Pregunta provocadora",
  "Estadística impactante",
  "Confesión personal",
  "Contradicción",
  "Nadie te dijo que...",
  "Cita literaria",
  "Definición invertida",
  "Escena cotidiana",
  "Pregunta retórica filosófica",
  "Cliffhanger",
];

/** Genera 10 hooks de 3 segundos en estilos distintos. */
export async function generateHooks(topic: string): Promise<HookItem[]> {
  const system = `${CHANNEL_CONTEXT} Eres experto en hooks virales de 3 segundos.`;
  const user = `Genera 10 hooks de 3 segundos sobre: ${topic}.
Usa exactamente estos 10 estilos, uno por hook y en este orden:
${HOOK_STYLES.map((s, i) => `${i + 1}. ${s}`).join("\n")}

Responde ÚNICAMENTE en JSON válido:
{
  "hooks": [
    { "style": "Pregunta provocadora", "text": "..." }
  ]
}`;
  const parsed = await grokJson<{ hooks: HookItem[] }>(system, user);
  return parsed.hooks ?? [];
}

/** Genera variaciones de un hook concreto. */
export async function moreLikeHook(hook: string, topic: string): Promise<HookItem[]> {
  const system = `${CHANNEL_CONTEXT} Eres experto en hooks virales.`;
  const user = `Tema: ${topic}
Hook base: "${hook}"

Genera 6 variaciones del mismo estilo y energía, igual de potentes.
Responde ÚNICAMENTE en JSON válido:
{ "hooks": [ { "style": "variación", "text": "..." } ] }`;
  const parsed = await grokJson<{ hooks: HookItem[] }>(system, user);
  return parsed.hooks ?? [];
}

/* ---------- Módulo 3: Cita -> video ---------- */

export async function quoteToVideo(
  quote: string,
  author?: string
): Promise<QuoteVideoIdea[]> {
  const system = `${CHANNEL_CONTEXT} Conviertes citas en ideas de video.`;
  const user = `Cita: "${quote}"${author ? ` — ${author}` : ""}

Genera 3 ideas de video que usen esta cita como punto de partida.
Responde ÚNICAMENTE en JSON válido:
{
  "ideas": [
    { "titulo": "...", "angulo": "...", "estructura": "..." }
  ]
}`;
  const parsed = await grokJson<{ ideas: QuoteVideoIdea[] }>(system, user);
  return parsed.ideas ?? [];
}

/* ---------- Módulo 4: Etimologías ---------- */

export async function analyzeWord(word: string): Promise<WordAnalysis> {
  const system = `${CHANNEL_CONTEXT} Eres etimólogo e historiador del lenguaje, riguroso pero ameno.`;
  const user = `Analiza la palabra: "${word}".

Devuelve:
- etymology: origen etimológico completo, mencionando cada lengua intermedia y el año aproximado de primer uso documentado en español, y conexiones con otras palabras del mismo origen. Texto narrativo.
- story: una mini-historia narrativa de la palabra, estilo storytelling, lista para un video.
- video_ideas: array con 3 ángulos distintos para hacer un video sobre esta palabra.

Responde ÚNICAMENTE en JSON válido:
{ "etymology": "...", "story": "...", "video_ideas": ["...", "...", "..."] }`;
  return grokJson<WordAnalysis>(system, user);
}

/* ---------- Módulo 8: Captions y hashtags ---------- */

export async function generateCaptions(script: string): Promise<CaptionPack> {
  const system = `${CHANNEL_CONTEXT} Eres community manager experto en TikTok.`;
  const user = `Este es el guion de un video:
${script}

Genera:
- captions: 3 captions (corta, media con storytelling, larga con storytelling)
- hashtags: 3 grupos -> mainstream (5), nicho (5), longtail (5)
- onScreenTexts: 3 sugerencias de texto en pantalla para los primeros 3 segundos
- thumbnails: 3 ideas de portada/thumbnail (descripción visual)

Responde ÚNICAMENTE en JSON válido:
{
  "captions": { "corta": "...", "media": "...", "larga": "..." },
  "hashtags": { "mainstream": ["#..."], "nicho": ["#..."], "longtail": ["#..."] },
  "onScreenTexts": ["...", "...", "..."],
  "thumbnails": ["...", "...", "..."]
}`;
  return grokJson<CaptionPack>(system, user);
}

/* ---------- Módulo 9: Repurposing ---------- */

export async function repurpose(script: string): Promise<RepurposePack> {
  const system = `${CHANNEL_CONTEXT} Adaptas contenido a varias plataformas conservando la voz.`;
  const user = `Guion original del video:
${script}

Conviértelo en:
- twitterThread: array de 5-8 tweets (hilo de X)
- instagramCarousel: array de 5-8 slides, cada uno { titulo, cuerpo (2-3 líneas) }
- linkedin: un post profesional
- newsletter: una newsletter corta (~200 palabras)
- reelsCaption: caption para Reels/Shorts

Responde ÚNICAMENTE en JSON válido:
{
  "twitterThread": ["...", "..."],
  "instagramCarousel": [ { "titulo": "...", "cuerpo": "..." } ],
  "linkedin": "...",
  "newsletter": "...",
  "reelsCaption": "..."
}`;
  return grokJson<RepurposePack>(system, user);
}

/* ---------- Módulo 6: Series ---------- */

export async function generateEpisode(input: {
  seriesName: string;
  description?: string;
  template?: string;
  topic: string;
}): Promise<{ title: string; script: string }> {
  const system = `${CHANNEL_CONTEXT} Generas episodios de una serie respetando su formato fijo.`;
  const user = `Serie: "${input.seriesName}"
${input.description ? `Descripción: ${input.description}` : ""}
${input.template ? `Plantilla de guion que DEBES respetar:\n${input.template}` : ""}

Genera el próximo episodio sobre el tema: ${input.topic}.
Respeta el formato de la serie pero con contenido nuevo.

Responde ÚNICAMENTE en JSON válido:
{ "title": "...", "script": "..." }`;
  return grokJson<{ title: string; script: string }>(system, user);
}

/* ---------- Módulo 7: Inspiración ---------- */

export async function inspireFrom(content: string): Promise<
  Array<{ titulo: string; conexion: string }>
> {
  const system = `${CHANNEL_CONTEXT} Conviertes referencias externas en ideas para el canal.`;
  const user = `Tengo esta referencia (puede ser un texto, una URL o una descripción):
${content}

Propón 5 ideas de video conectadas con mis nichos (filosofía, literatura, lenguaje).
Responde ÚNICAMENTE en JSON válido:
{ "ideas": [ { "titulo": "...", "conexion": "..." } ] }`;
  const parsed = await grokJson<{ ideas: Array<{ titulo: string; conexion: string }> }>(
    system,
    user
  );
  return parsed.ideas ?? [];
}

/* ---------- Módulo: Diálogos con autores ---------- */

/** Un mensaje del chat: del lector o del autor. */
export interface DialogueMessage {
  role: "user" | "author";
  content: string;
}

/**
 * Genera la respuesta de un autor a partir de su system prompt, el historial
 * de la conversación y el mensaje nuevo del lector. El historial se incluye en
 * el prompt para que el autor mantenga el hilo.
 */
export async function dialogueWithAuthor(input: {
  systemPrompt: string;
  history: DialogueMessage[];
  message: string;
}): Promise<string> {
  const transcript = input.history
    .map((m) => `${m.role === "user" ? "Lector" : "Tú"}: ${m.content}`)
    .join("\n");

  const user = `${transcript ? `Conversación hasta ahora:\n${transcript}\n\n` : ""}El lector te dice: ${input.message}

Responde en personaje, en primera persona.`;

  const text = await grokText(input.systemPrompt, user);
  return text.trim();
}

/* ---------- Módulo: Flashcards ---------- */

/** Una flashcard generada (anverso/reverso). */
export interface FlashcardSeed {
  front: string;
  back: string;
}

/** Genera N flashcards de repaso sobre un libro. */
export async function generateFlashcards(input: {
  title: string;
  author: string;
  count?: number;
}): Promise<FlashcardSeed[]> {
  const n = input.count ?? 10;
  const system = `${CHANNEL_CONTEXT} Eres un tutor que crea tarjetas de repaso (flashcards) claras y memorables.`;
  const user = `Crea ${n} flashcards sobre el libro "${input.title}" de ${input.author}.
Cada flashcard tiene:
- front: una pregunta o concepto clave (corto)
- back: la respuesta o explicación concisa (1-3 frases)
Cubre ideas centrales, personajes, citas y conceptos importantes del libro.

Responde ÚNICAMENTE en JSON válido:
{ "cards": [ { "front": "...", "back": "..." } ] }`;
  const parsed = await grokJson<{ cards: FlashcardSeed[] }>(system, user);
  return parsed.cards ?? [];
}

/* ---------- Módulo 10: Insights de analytics ---------- */

export async function analyzePerformance(data: unknown): Promise<string[]> {
  const system = `${CHANNEL_CONTEXT} Eres analista de crecimiento en TikTok.`;
  const user = `Estos son mis datos de rendimiento (JSON):
${JSON.stringify(data)}

Dame insights accionables y concretos para crecer (no genéricos).
Responde ÚNICAMENTE en JSON válido:
{ "insights": ["...", "...", "..."] }`;
  const parsed = await grokJson<{ insights: string[] }>(system, user);
  return parsed.insights ?? [];
}
