/**
 * Rutas de IDEAS (recomendador de contenido con Grok).
 *
 *  POST /api/grok/ideas   -> genera 5 ideas de video sobre un tema y las guarda
 *  GET  /api/grok/ideas   -> lista las generaciones guardadas
 */
import { Router, type Request, type Response } from "express";
import { db } from "../db.js";
import { generateVideoIdeas, GrokError } from "../services/grok.service.js";

export const grokRouter = Router();

/** Fila de la tabla ideas. */
interface IdeaRow {
  id: number;
  topic: string;
  content: string; // JSON serializado con el array de ideas
  created_at: string;
}

/**
 * POST /api/grok/ideas { topic }
 * Llama a Grok, guarda el resultado y lo devuelve.
 */
grokRouter.post("/ideas", async (req: Request, res: Response) => {
  const topic = String(req.body?.topic ?? "").trim();
  if (!topic) {
    return res.status(400).json({ error: "Escribe un tema." });
  }

  try {
    const ideas = await generateVideoIdeas(topic);

    // Guardamos el array de ideas como JSON en la columna content.
    const result = db
      .prepare("INSERT INTO ideas (topic, content) VALUES (?, ?)")
      .run(topic, JSON.stringify(ideas));

    return res.status(201).json({
      id: result.lastInsertRowid,
      topic,
      ideas,
    });
  } catch (err) {
    return sendGrokError(res, err);
  }
});

/**
 * Responde un error de Grok al frontend conservando status, código y mensaje
 * exactos de la API de xAI. Así la UI puede mostrar una alerta clara para debug.
 */
export function sendGrokError(res: Response, err: unknown) {
  if (err instanceof GrokError) {
    return res.status(err.status).json({
      error: err.message,
      code: err.code,
      status: err.status,
    });
  }
  const message = err instanceof Error ? err.message : "Error desconocido";
  console.error("Error inesperado con Grok:", err);
  return res.status(502).json({ error: message });
}

/**
 * GET /api/grok/ideas
 * Devuelve las generaciones guardadas (parseando el JSON de content).
 */
grokRouter.get("/ideas", (_req: Request, res: Response) => {
  const rows = db
    .prepare("SELECT * FROM ideas ORDER BY created_at DESC")
    .all() as IdeaRow[];

  const parsed = rows.map((row) => ({
    id: row.id,
    topic: row.topic,
    created_at: row.created_at,
    ideas: safeParse(row.content),
  }));

  res.json(parsed);
});

/** Parseo defensivo: si el JSON guardado estuviera corrupto, devolvemos []. */
function safeParse(content: string): unknown[] {
  try {
    const value = JSON.parse(content);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}
