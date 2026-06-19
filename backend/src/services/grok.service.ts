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

/** Un proveedor de IA al que intentar (formato OpenAI Chat Completions). */
interface Provider {
  baseUrl: string;
  apiKey: string;
  model: string;
  label: string;
}

/**
 * Lista de proveedores en orden de intento (failover).
 *  1. El principal (GROK_BASE_URL/KEY/MODEL).
 *  2. Un modelo de respaldo en la MISMA clave (otra cuota diaria en Groq, gratis).
 *  3. Un proveedor secundario completo, si se configura (GROK_*_2).
 */
function providers(): Provider[] {
  const list: Provider[] = [];
  const baseUrl = GROK_CONFIG.BASE_URL;
  const key = process.env.GROK_API_KEY;
  if (key && key !== "tu_api_key_aqui") {
    list.push({ baseUrl, apiKey: key, model: GROK_CONFIG.MODEL, label: `principal (${GROK_CONFIG.MODEL})` });
    // Modelo de respaldo en la misma clave: en Groq el límite es POR modelo,
    // así que esto da capacidad extra sin configurar nada.
    const fb = process.env.GROK_MODEL_FALLBACK || "llama-3.1-8b-instant";
    if (fb && fb !== GROK_CONFIG.MODEL) {
      list.push({ baseUrl, apiKey: key, model: fb, label: `respaldo (${fb})` });
    }
  }
  // Proveedor secundario completo (otra clave / otro proveedor), opcional.
  const key2 = process.env.GROK_API_KEY_2;
  if (key2) {
    list.push({
      baseUrl: process.env.GROK_BASE_URL_2 || baseUrl,
      apiKey: key2,
      model: process.env.GROK_MODEL_2 || GROK_CONFIG.MODEL,
      label: "secundario",
    });
  }
  return list;
}

/** ¿Conviene reintentar con el siguiente proveedor ante este error? */
function isRetryable(status: number): boolean {
  // 429 sin cupo · 401/403 auth · 404 modelo retirado/no encontrado · 5xx servidor.
  return status === 429 || status === 401 || status === 403 || status === 404 || status >= 500;
}

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
/** Un solo intento contra un proveedor concreto. Lanza GrokError si falla. */
async function attempt(p: Provider, systemPrompt: string, userPrompt: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GROK_CONFIG.TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${p.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${p.apiKey}`,
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "Pliego · Estudio",
      },
      body: JSON.stringify({
        model: p.model,
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
    if (err instanceof Error && err.name === "AbortError") {
      throw new GrokError(`La IA superó el límite de ${GROK_CONFIG.TIMEOUT_MS / 1000}s.`, 504, "timeout");
    }
    throw new GrokError(
      `No se pudo conectar con la IA: ${err instanceof Error ? err.message : String(err)}`,
      502,
      "network_error"
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    const raw = await res.text();
    const { code, message } = parseGrokError(raw);
    console.error(`❌ IA ${res.status} (${p.label}) code=${code ?? "?"}: ${message}`);
    throw new GrokError(message, res.status, code);
  }

  const data = (await res.json()) as ChatCompletionResponse;
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new GrokError("La IA no devolvió contenido.", 502, "empty_response");
  return content;
}

/**
 * Llama a la IA con failover: prueba cada proveedor en orden y, si uno falla
 * por un motivo reintentable (429 sin cupo, 401/403, 5xx, red, timeout),
 * pasa al siguiente. Si todos fallan, lanza el último GrokError.
 */
async function callGrok(systemPrompt: string, userPrompt: string): Promise<string> {
  const list = providers();
  if (list.length === 0) {
    throw new GrokError(
      "Falta GROK_API_KEY. Configura la clave de IA en backend/.env.",
      500,
      "missing_api_key"
    );
  }

  let lastError: GrokError | null = null;
  for (let i = 0; i < list.length; i++) {
    try {
      return await attempt(list[i], systemPrompt, userPrompt);
    } catch (err) {
      const e = err instanceof GrokError ? err : new GrokError(String(err), 500, "unknown");
      lastError = e;
      const hayMas = i < list.length - 1;
      if (hayMas && isRetryable(e.status)) {
        console.warn(`↪️ Failover: "${list[i].label}" falló (${e.status}); probando el siguiente…`);
        continue;
      }
      throw e;
    }
  }
  throw lastError ?? new GrokError("Sin proveedores de IA disponibles.", 500, "no_providers");
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
