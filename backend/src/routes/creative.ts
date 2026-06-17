/**
 * Endpoints creativos ligeros de la Fase G1:
 *  POST /api/creative/mood        -> recomendaciones según el estado de ánimo (G13)
 *  POST /api/creative/hook        -> adapta una fórmula de hook a un tema (G15)
 *  POST /api/creative/word-quote  -> cita literaria donde aparece una palabra (G7)
 */
import { Router, type Request, type Response } from "express";
import { db } from "../db.js";
import { grokText, grokJson, CHANNEL_CONTEXT } from "../services/grok.service.js";
import { sendGrokError } from "./grok.js";

export const creativeRouter = Router();

/* ---------- G13 · Mood reading ---------- */
interface MoodResult {
  retomar: { title: string; author: string; reason: string };
  descubrir: { title: string; author: string; reason: string };
  cita: { text: string; author: string };
  video: string;
  radio: string;
}

creativeRouter.post("/mood", async (req: Request, res: Response) => {
  const mood = String(req.body?.mood ?? "").trim();
  if (!mood) return res.status(400).json({ error: "Falta el estado de ánimo." });

  const books = db.prepare("SELECT title, author FROM books ORDER BY RANDOM() LIMIT 30").all() as Array<{
    title: string;
    author: string;
  }>;
  const lista = books.map((b) => `"${b.title}" de ${b.author}`).join("; ") || "(biblioteca vacía)";

  const systemPrompt =
    CHANNEL_CONTEXT +
    " Recomiendas lecturas según el estado de ánimo, con criterio y calidez. Devuelves solo JSON válido.";
  const userPrompt = `El usuario se siente: ${mood}.
Su biblioteca: ${lista}.

Devuelve SOLO este JSON:
{
  "retomar": { "title": "(un libro de SU biblioteca para retomar)", "author": "", "reason": "por qué encaja con su ánimo (1 frase)" },
  "descubrir": { "title": "(un libro NUEVO, que no esté en su biblioteca)", "author": "", "reason": "1 frase" },
  "cita": { "text": "una cita célebre y bien atribuida acorde al ánimo", "author": "" },
  "video": "una idea de video corto que conecte con esa emoción (1 frase)",
  "radio": "una de estas estaciones: Café de París, Biblioteca de Alejandría, Tormenta rusa, Mañana en Roma, Bosque de Heidegger, Mar de Lampedusa"
}`;
  try {
    const r = await grokJson<MoodResult>(systemPrompt, userPrompt);
    return res.json(r);
  } catch (err) {
    return sendGrokError(res, err);
  }
});

/* ---------- G15 · Adaptar hook ---------- */
creativeRouter.post("/hook", async (req: Request, res: Response) => {
  const formula = String(req.body?.formula ?? "").trim();
  const topic = String(req.body?.topic ?? "").trim();
  if (!formula || !topic) return res.status(400).json({ error: "Falta la fórmula o el tema." });

  const systemPrompt =
    CHANNEL_CONTEXT + " Escribes hooks de TikTok potentes en español, en máximo 1-2 frases, listos para grabar.";
  const userPrompt = `Fórmula de hook: "${formula}"
Tema: "${topic}"

Genera 3 variantes del hook aplicando la fórmula a ese tema. Devuelve solo las 3 líneas, numeradas.`;
  try {
    const text = await grokText(systemPrompt, userPrompt);
    return res.json({ text });
  } catch (err) {
    return sendGrokError(res, err);
  }
});

/* ---------- G2 · Cadáver exquisito ---------- */
creativeRouter.post("/cadaver", async (req: Request, res: Response) => {
  const fragment = String(req.body?.fragment ?? "").trim();
  const systemPrompt =
    "Juegas al 'cadáver exquisito' surrealista. Recibes solo un fragmento (las últimas palabras de una " +
    "frase) y continúas con UNA sola frase evocadora, bella y un poco absurda. No expliques nada, no uses " +
    "comillas, escribe solo la frase nueva en español.";
  const userPrompt = `Fragmento: "${fragment || "..."}". Continúa con una sola frase:`;
  try {
    const text = await grokText(systemPrompt, userPrompt);
    return res.json({ text: text.trim().replace(/^["'“]|["'”]$/g, "") });
  } catch (err) {
    return sendGrokError(res, err);
  }
});

/* ---------- G2/G9 · Convertir texto en guion ---------- */
creativeRouter.post("/to-script", async (req: Request, res: Response) => {
  const text = String(req.body?.text ?? "").trim();
  if (!text) return res.status(400).json({ error: "Falta el texto." });
  const systemPrompt =
    CHANNEL_CONTEXT + " Conviertes textos en guiones narrativos para un video corto (TikTok), en primera persona, con gancho inicial.";
  const userPrompt = `Convierte este texto en un guion narrativo breve para un video corto (30-60s), con un gancho potente al inicio:\n\n${text}`;
  try {
    const script = await grokText(systemPrompt, userPrompt);
    return res.json({ script });
  } catch (err) {
    return sendGrokError(res, err);
  }
});

/* ---------- G11 · Subrayador inteligente ---------- */
interface HighlightAnalysis {
  subrayados: string[];
  conceptos: string[];
  idea_video: string;
  conexiones: string[];
}
creativeRouter.post("/highlight-analyze", async (req: Request, res: Response) => {
  const text = String(req.body?.text ?? "").trim();
  if (!text) return res.status(400).json({ error: "Pega un pasaje del libro." });
  const books = db.prepare("SELECT title, author FROM books ORDER BY RANDOM() LIMIT 25").all() as Array<{
    title: string;
    author: string;
  }>;
  const lista = books.map((b) => `"${b.title}"`).join(", ") || "(biblioteca vacía)";
  const systemPrompt =
    "Analizas pasajes de libros con ojo de lector profundo y creador de contenido. Devuelves solo JSON válido.";
  const userPrompt = `Pasaje:
"""${text}"""

Mi biblioteca: ${lista}.

Devuelve SOLO este JSON:
{
  "subrayados": ["3 frases textuales o casi textuales del pasaje que vale la pena subrayar"],
  "conceptos": ["2-4 conceptos clave"],
  "idea_video": "una idea de video corto inspirada en el pasaje",
  "conexiones": ["1-3 conexiones con libros de mi biblioteca o autores conocidos"]
}`;
  try {
    const r = await grokJson<HighlightAnalysis>(systemPrompt, userPrompt);
    return res.json(r);
  } catch (err) {
    return sendGrokError(res, err);
  }
});

/* ---------- G12 · Métricas poéticas ---------- */
interface Poetics {
  sabor: string;
  ritmo: string;
  densidad: string;
  sugerencias: string[];
}
creativeRouter.post("/poetics", async (req: Request, res: Response) => {
  const text = String(req.body?.text ?? "").trim();
  if (!text) return res.status(400).json({ error: "Escribe algo antes de analizar." });
  const systemPrompt =
    "Eres un crítico de estilo literario, fino y honesto. Analizas la prosa. Devuelves solo JSON válido.";
  const userPrompt = `Analiza el estilo de este texto:
"""${text}"""

Devuelve SOLO:
{
  "sabor": "a qué autor/estilo sabe (ej: borgesiano, pessoano, hemingwayano…) y por qué, en 1 frase",
  "ritmo": "1 frase sobre el ritmo (frases largas/cortas, musicalidad)",
  "densidad": "1 frase sobre densidad lírica (metáforas, adjetivación)",
  "sugerencias": ["2-3 sugerencias concretas para mejorar"]
}`;
  try {
    const r = await grokJson<Poetics>(systemPrompt, userPrompt);
    return res.json(r);
  } catch (err) {
    return sendGrokError(res, err);
  }
});

/* ---------- G17 · Modo debate ---------- */
interface DebateStart {
  debatientes: Array<{ name: string; postura: string; apertura: string }>;
}
creativeRouter.post("/debate-start", async (req: Request, res: Response) => {
  const thesis = String(req.body?.thesis ?? "").trim();
  if (!thesis) return res.status(400).json({ error: "Escribe una tesis." });
  const systemPrompt = "Generas debatientes con visiones distintas y argumentos sólidos. Devuelves solo JSON válido.";
  const userPrompt = `Tesis del usuario: "${thesis}".
Crea 3 debatientes con posturas distintas (opuestas o matizadas). Cada uno con un nombre evocador, su postura en pocas palabras y un argumento de apertura (2-3 frases) que rete al usuario.
Devuelve SOLO:
{ "debatientes": [ { "name": "", "postura": "", "apertura": "" } ] }`;
  try {
    const r = await grokJson<DebateStart>(systemPrompt, userPrompt);
    return res.json(r);
  } catch (err) {
    return sendGrokError(res, err);
  }
});

creativeRouter.post("/debate-feedback", async (req: Request, res: Response) => {
  const thesis = String(req.body?.thesis ?? "").trim();
  const transcript = String(req.body?.transcript ?? "").trim();
  if (!transcript) return res.status(400).json({ error: "Falta el debate." });
  const systemPrompt = "Evalúas la defensa argumentativa de alguien con honestidad y rigor, sin adular.";
  const userPrompt = `Tesis: "${thesis}".
Debate (debatientes y respuestas del usuario):
${transcript}

Evalúa SOLO la defensa del USUARIO en texto plano y breve:
• Argumentos fuertes
• Argumentos débiles
• Falacias detectadas (si las hay)
• Un consejo para mejorar`;
  try {
    const text = await grokText(systemPrompt, userPrompt);
    return res.json({ text });
  } catch (err) {
    return sendGrokError(res, err);
  }
});

/* ---------- G18 · Próximo paso de nicho ---------- */
creativeRouter.post("/nicho-next", async (req: Request, res: Response) => {
  const nicho = String(req.body?.nicho ?? "").trim();
  const systemPrompt =
    CHANNEL_CONTEXT +
    " Aconsejas cómo expandir un canal de contenido sin perder identidad. Respondes breve y concreto.";
  const userPrompt = `Mi canal es de filosofía/literatura/historia del lenguaje. Estoy mirando el nicho "${nicho}". ` +
    `Dame en 2-3 frases mi próximo paso concreto para explorar ese nicho sin perder mi identidad.`;
  try {
    const text = await grokText(systemPrompt, userPrompt);
    return res.json({ text });
  } catch (err) {
    return sendGrokError(res, err);
  }
});

/* ---------- G7 · Cita literaria de una palabra ---------- */
creativeRouter.post("/word-quote", async (req: Request, res: Response) => {
  const word = String(req.body?.word ?? "").trim();
  if (!word) return res.status(400).json({ error: "Falta la palabra." });
  const systemPrompt =
    "Das una cita literaria breve y célebre (o muy verosímil) donde aparezca o resuene una palabra dada. " +
    "Responde en 1-2 frases con la cita y su autor. No inventes autores falsos; si dudas, usa una frase anónima evocadora.";
  const userPrompt = `Palabra: "${word}". Dame una cita literaria donde brille esta palabra o su idea, con autor.`;
  try {
    const text = await grokText(systemPrompt, userPrompt);
    return res.json({ text });
  } catch (err) {
    return sendGrokError(res, err);
  }
});
