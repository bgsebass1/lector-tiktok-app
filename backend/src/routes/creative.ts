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
