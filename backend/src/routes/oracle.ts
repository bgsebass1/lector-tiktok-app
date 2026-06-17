/**
 * EL ORÁCULO LITERARIO (G1).
 *  POST   /api/oracle/consult  -> elige una cita al azar e interpreta la pregunta
 *  GET    /api/oracle           -> historial de consultas
 *  DELETE /api/oracle/:id
 */
import { Router, type Request, type Response } from "express";
import { db } from "../db.js";
import { grokText } from "../services/grok.service.js";
import { sendGrokError } from "./grok.js";
import { QUOTES_CORPUS } from "../data/quotes-corpus.js";

export const oracleRouter = Router();

oracleRouter.get("/", (_req: Request, res: Response) => {
  res.json(db.prepare("SELECT * FROM oracle_consultations ORDER BY created_at DESC").all());
});

oracleRouter.post("/consult", async (req: Request, res: Response) => {
  const question = String(req.body?.question ?? "").trim();
  if (!question) return res.status(400).json({ error: "Escribe una pregunta para el oráculo." });

  // Mezclamos el corpus con las citas del usuario.
  const userQuotes = db
    .prepare("SELECT q.text, b.author FROM quotes q LEFT JOIN books b ON b.id = q.book_id")
    .all() as Array<{ text: string; author: string | null }>;
  const pool = [
    ...QUOTES_CORPUS,
    ...userQuotes.filter((q) => q.text).map((q) => ({ text: q.text, author: q.author ?? "De tu biblioteca" })),
  ];
  const pick = pool[Math.floor(Math.random() * pool.length)];

  const systemPrompt =
    "Eres un oráculo literario, sabio y enigmático pero cálido. Recibes una pregunta vital y una cita " +
    "elegida por el azar. Interpretas la cita COMO respuesta a la pregunta, como una lectura del I Ching: " +
    "breve (3-5 frases), poética, concreta y honesta. No repitas la cita textualmente; ilumínala. Hablas de tú.";
  const userPrompt = `Pregunta del consultante: "${question}"

La cita que el azar ha revelado:
"${pick.text}" — ${pick.author}

Interpreta esta cita como respuesta a su pregunta.`;

  try {
    const interpretation = await grokText(systemPrompt, userPrompt);
    const result = db
      .prepare(
        "INSERT INTO oracle_consultations (question, quote_text, quote_author, interpretation) VALUES (?, ?, ?, ?)"
      )
      .run(question, pick.text, pick.author, interpretation);
    const saved = db.prepare("SELECT * FROM oracle_consultations WHERE id = ?").get(result.lastInsertRowid);
    return res.json(saved);
  } catch (err) {
    return sendGrokError(res, err);
  }
});

oracleRouter.delete("/:id", (req: Request, res: Response) => {
  const r = db.prepare("DELETE FROM oracle_consultations WHERE id = ?").run(req.params.id);
  if (r.changes === 0) return res.status(404).json({ error: "No encontrada." });
  return res.json({ ok: true });
});
