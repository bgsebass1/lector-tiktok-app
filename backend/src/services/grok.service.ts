/**
 * Servicio para hablar con la API de Grok (xAI).
 *
 * El formato es idéntico al de OpenAI Chat Completions, así que mandamos
 * un array de "messages" y leemos la respuesta en choices[0].message.content.
 *
 * Usamos dos funciones:
 *  - generateVideoIdeas: ideas de videos de TikTok sobre un tema.
 *  - recommendBooks: 3 libros recomendados según TODO lo que el usuario ha leído.
 *
 * El modelo y demás parámetros viven en config/grok.config.ts.
 */
import { GROK_CONFIG } from "../config/grok.config.js";

/** Endpoint de chat completions (formato OpenAI). */
const GROK_URL = `${GROK_CONFIG.BASE_URL}/chat/completions`;

/**
 * Error específico de Grok que conserva el código HTTP y el código/mensaje
 * exactos que devuelve la API de xAI, para poder mostrarlos tal cual en la UI.
 */
export class GrokError extends Error {
  status: number;
  /** Código de error de la API (ej: "model_not_found", "invalid_request"). */
  code: string | null;

  constructor(message: string, status: number, code: string | null = null) {
    super(message);
    this.name = "GrokError";
    this.status = status;
    this.code = code;
  }
}

/** Una idea de video tal como la queremos del modelo. */
export interface VideoIdea {
  titulo: string;
  hook: string;
  estructura: string;
  hashtags: string[];
}

/** Una recomendación de libro generada por Grok. */
export interface BookRecommendation {
  title: string;
  author: string;
  reason: string;
}

/** Forma mínima de la respuesta de la API estilo OpenAI. */
interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

/**
 * Intenta extraer { code, message } de un cuerpo de error de la API de xAI.
 * El formato típico es: { "error": { "message": "...", "code": "..." } }
 * o a veces { "error": "texto", "code": "..." }. Si no es JSON, devuelve el texto.
 */
function parseGrokError(raw: string): { code: string | null; message: string } {
  try {
    const body = JSON.parse(raw);
    const errObj = body?.error ?? body;
    const message =
      typeof errObj === "string" ? errObj : errObj?.message ?? raw;
    const code = errObj?.code ?? body?.code ?? null;
    return { code, message };
  } catch {
    // No era JSON: devolvemos el texto crudo.
    return { code: null, message: raw || "Sin detalle" };
  }
}

/**
 * Llama a Grok con un par de mensajes (system + user) y devuelve el texto crudo.
 *
 * - Aplica un timeout (GROK_CONFIG.TIMEOUT_MS) con AbortController.
 * - Si la API responde con error, NO lo esconde: parsea el JSON y lanza un
 *   GrokError con el status HTTP + código + mensaje exactos.
 */
async function callGrok(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey || apiKey === "tu_api_key_aqui") {
    throw new GrokError(
      "Falta GROK_API_KEY. Crea el archivo backend/.env con tu clave de xAI.",
      500,
      "missing_api_key"
    );
  }

  // Timeout: abortamos la petición si tarda demasiado.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GROK_CONFIG.TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(GROK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        // Cabeceras opcionales que OpenRouter recomienda (se ignoran en xAI directo).
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "Libros nada más · Estudio",
      },
      body: JSON.stringify({
        model: GROK_CONFIG.MODEL,
        max_tokens: GROK_CONFIG.MAX_TOKENS,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8,
      }),
      signal: controller.signal,
    });
  } catch (err) {
    // Errores de red o timeout (abort).
    if (err instanceof Error && err.name === "AbortError") {
      throw new GrokError(
        `La petición a Grok superó el límite de ${GROK_CONFIG.TIMEOUT_MS / 1000}s.`,
        504,
        "timeout"
      );
    }
    throw new GrokError(
      `No se pudo conectar con la API de Grok: ${
        err instanceof Error ? err.message : String(err)
      }`,
      502,
      "network_error"
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    const raw = await res.text();
    const { code, message } = parseGrokError(raw);
    // Log en el servidor para depurar, y error estructurado hacia la UI.
    console.error(
      `❌ Grok ${res.status} (modelo "${GROK_CONFIG.MODEL}") code=${code ?? "?"}: ${message}`
    );
    throw new GrokError(message, res.status, code);
  }

  const data = (await res.json()) as ChatCompletionResponse;
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new GrokError("Grok no devolvió contenido.", 502, "empty_response");
  }
  return content;
}

/**
 * Extrae un objeto JSON del texto del modelo.
 * A veces los modelos envuelven el JSON en ```json ... ```; lo limpiamos.
 */
function extractJson<T>(raw: string): T {
  let text = raw.trim();

  // Quitar fences de markdown si vienen.
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  }

  // Por si hay texto antes/después, recortamos al primer { y último }.
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first !== -1 && last !== -1) {
    text = text.slice(first, last + 1);
  }

  return JSON.parse(text) as T;
}

/**
 * Contexto del canal reutilizable en los prompts de todos los módulos.
 * Así mantenemos una "voz" coherente en toda la app.
 */
export const CHANNEL_CONTEXT =
  "Trabajas para el canal de TikTok 'Libros nada más 😁', sobre filosofía, " +
  "literatura e historia del lenguaje (Wittgenstein, Orwell, Dante, Nebrija, " +
  "Borges, etc.). Estética intelectual pero accesible, en español neutro de " +
  "Colombia. Tono cercano, ideas profundas explicadas con claridad.";

/* ===========================================================================
 *  Helpers genéricos reutilizables por todos los módulos del estudio.
 * ========================================================================= */

/**
 * Llama a Grok y devuelve texto plano (para guiones, historias, captions…).
 */
export async function grokText(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  return callGrok(systemPrompt, userPrompt);
}

/**
 * Llama a Grok y devuelve un objeto JSON tipado.
 * Reintenta una vez si el primer parseo falla (a veces el modelo añade texto).
 */
export async function grokJson<T>(
  systemPrompt: string,
  userPrompt: string
): Promise<T> {
  const raw = await callGrok(systemPrompt, userPrompt);
  try {
    return extractJson<T>(raw);
  } catch {
    throw new GrokError(
      "Grok devolvió una respuesta que no se pudo leer como JSON.",
      502,
      "invalid_json"
    );
  }
}

/**
 * Genera 5 ideas de videos de TikTok sobre un tema, para el canal
 * "Libros nada más" (filosofía, literatura e historia del lenguaje).
 */
export async function generateVideoIdeas(topic: string): Promise<VideoIdea[]> {
  const systemPrompt =
    "Eres un experto en contenido viral de TikTok especializado en filosofía, " +
    "literatura e historia del lenguaje. El canal se llama 'Libros nada más' y " +
    "tiene una estética intelectual pero accesible.";

  const userPrompt = `Genera 5 ideas de videos sobre el tema: ${topic}.

Cada idea debe tener:
- titulo: título atractivo del video
- hook: las primeras frases que enganchan en 3 segundos
- estructura: estructura completa del video (30-60 segundos), en formato narrativo en primera persona
- hashtags: array de 5 hashtags relevantes

Responde ÚNICAMENTE en JSON válido con esta estructura exacta:
{
  "ideas": [
    { "titulo": "...", "hook": "...", "estructura": "...", "hashtags": ["#..."] }
  ]
}`;

  const raw = await callGrok(systemPrompt, userPrompt);
  const parsed = extractJson<{ ideas: VideoIdea[] }>(raw);
  return parsed.ideas ?? [];
}

/**
 * Recomienda 3 libros nuevos basándose en TODA la biblioteca leída.
 * Recibe la lista de libros (título + autor) para dar contexto a Grok.
 */
export async function recommendBooks(
  readBooks: Array<{ title: string; author: string; themes?: string | null }>
): Promise<BookRecommendation[]> {
  const systemPrompt =
    "Eres un crítico literario experto en filosofía, literatura e historia del " +
    "lenguaje. Recomiendas libros con criterio, conectando temas y autores.";

  const lista = readBooks
    .map((b) => `- "${b.title}" de ${b.author}${b.themes ? ` (temas: ${b.themes})` : ""}`)
    .join("\n");

  const userPrompt = `Esta es la biblioteca de libros que ya he leído:
${lista || "(todavía no hay libros)"}

Recomiéndame 3 libros nuevos que debería leer a continuación, conectando con mis
intereses y lo que ya he leído. Evita repetir libros de la lista.

Cada recomendación debe tener:
- title: título del libro
- author: autor
- reason: por qué me lo recomiendas, conectándolo con mi biblioteca (1-2 frases)

Responde ÚNICAMENTE en JSON válido con esta estructura exacta:
{
  "recommendations": [
    { "title": "...", "author": "...", "reason": "..." }
  ]
}`;

  const raw = await callGrok(systemPrompt, userPrompt);
  const parsed = extractJson<{ recommendations: BookRecommendation[] }>(raw);
  return parsed.recommendations ?? [];
}
