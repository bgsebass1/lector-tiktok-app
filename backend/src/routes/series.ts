/**
 * Rutas de SERIES Y FORMATOS RECURRENTES (Módulo 6).
 *
 *  GET    /api/series                 -> lista series (con nº de episodios)
 *  POST   /api/series                 -> crea serie
 *  DELETE /api/series/:id             -> borra serie (y sus episodios)
 *  GET    /api/series/:id/episodes    -> episodios de una serie
 *  POST   /api/series/:id/next        -> Grok genera el próximo episodio
 */
import { Router, type Request, type Response } from "express";
import { db } from "../db.js";
import { sendGrokError } from "./grok.js";
import { generateEpisode } from "../services/content.service.js";

export const seriesRouter = Router();

interface SeriesRow {
  id: number;
  name: string;
  description: string | null;
  hashtag: string | null;
  template: string | null;
  frequency: string | null;
  created_at: string;
}

/** GET /api/series */
seriesRouter.get("/", (_req, res) => {
  const rows = db
    .prepare(
      `SELECT s.*, COUNT(e.id) AS episode_count
       FROM series s LEFT JOIN series_episodes e ON e.series_id = s.id
       GROUP BY s.id ORDER BY s.created_at DESC`
    )
    .all();
  res.json(rows);
});

/** POST /api/series */
seriesRouter.post("/", (req, res) => {
  const { name, description, hashtag, template, frequency } = req.body ?? {};
  if (!name?.trim()) return res.status(400).json({ error: "Falta el nombre." });

  const result = db
    .prepare(
      `INSERT INTO series (name, description, hashtag, template, frequency)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(name.trim(), description ?? null, hashtag ?? null, template ?? null, frequency ?? null);

  const created = db.prepare("SELECT * FROM series WHERE id = ?").get(result.lastInsertRowid);
  return res.status(201).json(created);
});

/** DELETE /api/series/:id */
seriesRouter.delete("/:id", (req, res) => {
  const r = db.prepare("DELETE FROM series WHERE id = ?").run(req.params.id);
  if (r.changes === 0) return res.status(404).json({ error: "No encontrada." });
  return res.json({ ok: true });
});

/** GET /api/series/:id/episodes */
seriesRouter.get("/:id/episodes", (req, res) => {
  const eps = db
    .prepare("SELECT * FROM series_episodes WHERE series_id = ? ORDER BY episode_number DESC")
    .all(req.params.id);
  res.json(eps);
});

/** POST /api/series/:id/next { topic } — genera y guarda el próximo episodio. */
seriesRouter.post("/:id/next", async (req: Request, res: Response) => {
  const series = db
    .prepare("SELECT * FROM series WHERE id = ?")
    .get(req.params.id) as SeriesRow | undefined;
  if (!series) return res.status(404).json({ error: "Serie no encontrada." });

  const topic = String(req.body?.topic ?? "").trim();
  if (!topic) return res.status(400).json({ error: "Falta el tema del episodio." });

  try {
    const ep = await generateEpisode({
      seriesName: series.name,
      description: series.description ?? undefined,
      template: series.template ?? undefined,
      topic,
    });

    // Número de episodio = siguiente correlativo.
    const row = db
      .prepare("SELECT COALESCE(MAX(episode_number), 0) + 1 AS n FROM series_episodes WHERE series_id = ?")
      .get(series.id) as { n: number };

    const result = db
      .prepare(
        `INSERT INTO series_episodes (series_id, episode_number, title, script)
         VALUES (?, ?, ?, ?)`
      )
      .run(series.id, row.n, ep.title, ep.script);

    const saved = db
      .prepare("SELECT * FROM series_episodes WHERE id = ?")
      .get(result.lastInsertRowid);
    return res.status(201).json(saved);
  } catch (err) {
    return sendGrokError(res, err);
  }
});
