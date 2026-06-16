/**
 * Rutas de SHUFFLE CREATIVO (serendipia).
 *
 *  GET  /api/shuffle        -> 1 libro + 1 cita + 1 palabra + 1 idea, al azar
 *  POST /api/shuffle/spark  -> Groq conecta esos elementos en una idea de video
 */
import { Router, type Request, type Response } from "express";
import { db } from "../db.js";
import { grokText, CHANNEL_CONTEXT } from "../services/grok.service.js";
import { sendGrokError } from "./grok.js";

export const shuffleRouter = Router();

/** GET /api/shuffle — una pieza aleatoria de cada tipo (las que existan). */
shuffleRouter.get("/", (_req: Request, res: Response) => {
  const book = db.prepare("SELECT id, title, author FROM books ORDER BY RANDOM() LIMIT 1").get() ?? null;
  const quote = db
    .prepare(
      `SELECT q.id, q.text, b.title AS source
       FROM quotes q LEFT JOIN books b ON q.book_id = b.id
       ORDER BY RANDOM() LIMIT 1`
    )
    .get() ?? null;
  const word = db.prepare("SELECT id, word, etymology FROM words ORDER BY RANDOM() LIMIT 1").get() ?? null;
  const idea = db.prepare("SELECT id, topic FROM ideas ORDER BY RANDOM() LIMIT 1").get() ?? null;
  res.json({ book, quote, word, idea });
});

/** POST /api/shuffle/spark — combina los elementos recibidos en una idea original. */
shuffleRouter.post("/spark", async (req: Request, res: Response) => {
  const { book, quote, word, idea } = req.body ?? {};
  const parts: string[] = [];
  if (book) parts.push(`el libro «${book.title}» de ${book.author}`);
  if (quote) parts.push(`la cita: «${quote.text}»`);
  if (word) parts.push(`la palabra «${word.word}»`);
  if (idea) parts.push(`la idea: «${idea.topic}»`);

  if (parts.length === 0) {
    return res.status(400).json({ error: "No hay elementos para combinar. Baraja primero." });
  }

  const systemPrompt =
    CHANNEL_CONTEXT +
    " Tu don es conectar lo aparentemente inconexo en ideas sorprendentes y memorables.";
  const userPrompt = `Combina estos elementos al azar en UNA sola idea original para un video corto:
${parts.map((p) => `- ${p}`).join("\n")}

Devuelve, en texto plano y breve:
GANCHO: una frase potente para los primeros 3 segundos.
HILO: 2-3 líneas que conecten los elementos de forma inesperada pero coherente.
No expliques tu proceso; entrega solo la idea.`;

  try {
    const spark = await grokText(systemPrompt, userPrompt);
    return res.json({ spark });
  } catch (err) {
    return sendGrokError(res, err);
  }
});
