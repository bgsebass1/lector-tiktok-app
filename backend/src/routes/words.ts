/**
 * Rutas de ETIMOLOGÍAS Y PALABRAS (Módulo 4).
 *
 *  GET    /api/words           -> diccionario personal (cronológico)
 *  POST   /api/words/analyze   -> Grok analiza una palabra y la guarda
 *  PATCH  /api/words/:id/status -> cambia estado (pendiente/hecho/descartada)
 *  DELETE /api/words/:id       -> borra palabra
 */
import { Router, type Request, type Response } from "express";
import { db } from "../db.js";
import { sendGrokError } from "./grok.js";
import { analyzeWord } from "../services/content.service.js";

export const wordsRouter = Router();

interface WordRow {
  id: number;
  word: string;
  etymology: string | null;
  story: string | null;
  video_ideas: string | null; // JSON
  status: string;
  created_at: string;
}

function hydrate(row: WordRow) {
  return { ...row, video_ideas: safeArr(row.video_ideas) };
}
function safeArr(raw: string | null): string[] {
  try {
    const v = JSON.parse(raw ?? "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

/** GET /api/words */
wordsRouter.get("/", (_req, res) => {
  const rows = db
    .prepare("SELECT * FROM words ORDER BY created_at DESC")
    .all() as WordRow[];
  res.json(rows.map(hydrate));
});

/** POST /api/words/analyze { word } — analiza con Grok y guarda (o actualiza). */
wordsRouter.post("/analyze", async (req: Request, res: Response) => {
  const word = String(req.body?.word ?? "").trim().toLowerCase();
  if (!word) return res.status(400).json({ error: "Escribe una palabra." });

  try {
    const analysis = await analyzeWord(word);

    // UPSERT: si la palabra ya existe, la actualizamos (word es UNIQUE).
    db.prepare(
      `INSERT INTO words (word, etymology, story, video_ideas)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(word) DO UPDATE SET
         etymology = excluded.etymology,
         story = excluded.story,
         video_ideas = excluded.video_ideas`
    ).run(
      word,
      analysis.etymology,
      analysis.story,
      JSON.stringify(analysis.video_ideas ?? [])
    );

    const saved = db
      .prepare("SELECT * FROM words WHERE word = ?")
      .get(word) as WordRow;
    return res.status(201).json(hydrate(saved));
  } catch (err) {
    return sendGrokError(res, err);
  }
});

/** PATCH /api/words/:id/status { status } */
wordsRouter.patch("/:id/status", (req, res) => {
  const status = String(req.body?.status ?? "");
  const valid = ["pendiente", "hecho", "descartada"];
  if (!valid.includes(status)) {
    return res.status(400).json({ error: `Estado inválido. Usa: ${valid.join(", ")}` });
  }
  const r = db
    .prepare("UPDATE words SET status = ? WHERE id = ?")
    .run(status, req.params.id);
  if (r.changes === 0) return res.status(404).json({ error: "No encontrada." });
  return res.json({ ok: true, status });
});

/** DELETE /api/words/:id */
wordsRouter.delete("/:id", (req, res) => {
  const r = db.prepare("DELETE FROM words WHERE id = ?").run(req.params.id);
  if (r.changes === 0) return res.status(404).json({ error: "No encontrada." });
  return res.json({ ok: true });
});
