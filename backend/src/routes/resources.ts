/**
 * Rutas de RECURSOS B-ROLL (banco de material visual).
 *
 *  GET    /api/resources       -> lista (más recientes primero)
 *  POST   /api/resources       -> crea un recurso
 *  PUT    /api/resources/:id    -> edita un recurso
 *  DELETE /api/resources/:id    -> borra un recurso
 */
import { Router, type Request, type Response } from "express";
import { db } from "../db.js";

export const resourcesRouter = Router();

interface ResourceRow {
  id: number;
  type: string;
  title: string;
  url_or_path: string;
  description: string | null;
  tags: string | null;
  mood: string | null;
  thumbnail: string | null;
  created_at: string;
}

/** GET /api/resources */
resourcesRouter.get("/", (_req: Request, res: Response) => {
  const rows = db.prepare("SELECT * FROM resources ORDER BY created_at DESC").all() as ResourceRow[];
  res.json(rows);
});

/** POST /api/resources */
resourcesRouter.post("/", (req: Request, res: Response) => {
  const { type, title, url_or_path, description, tags, mood, thumbnail } = req.body ?? {};
  if (!String(type ?? "").trim() || !String(title ?? "").trim() || !String(url_or_path ?? "").trim()) {
    return res.status(400).json({ error: "Faltan tipo, título o ubicación/URL." });
  }
  const result = db
    .prepare(
      `INSERT INTO resources (type, title, url_or_path, description, tags, mood, thumbnail)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      String(type).trim(),
      String(title).trim(),
      String(url_or_path).trim(),
      description?.trim() || null,
      tags?.trim() || null,
      mood?.trim() || null,
      thumbnail?.trim() || null
    );
  const created = db.prepare("SELECT * FROM resources WHERE id = ?").get(result.lastInsertRowid);
  return res.status(201).json(created);
});

/** PUT /api/resources/:id */
resourcesRouter.put("/:id", (req: Request, res: Response) => {
  const existing = db.prepare("SELECT * FROM resources WHERE id = ?").get(req.params.id) as
    | ResourceRow
    | undefined;
  if (!existing) return res.status(404).json({ error: "Recurso no encontrado." });

  const { type, title, url_or_path, description, tags, mood, thumbnail } = req.body ?? {};
  db.prepare(
    `UPDATE resources SET type = ?, title = ?, url_or_path = ?, description = ?, tags = ?, mood = ?, thumbnail = ?
     WHERE id = ?`
  ).run(
    type ?? existing.type,
    title ?? existing.title,
    url_or_path ?? existing.url_or_path,
    description ?? existing.description,
    tags ?? existing.tags,
    mood ?? existing.mood,
    thumbnail ?? existing.thumbnail,
    req.params.id
  );
  const updated = db.prepare("SELECT * FROM resources WHERE id = ?").get(req.params.id);
  return res.json(updated);
});

/** DELETE /api/resources/:id */
resourcesRouter.delete("/:id", (req: Request, res: Response) => {
  const result = db.prepare("DELETE FROM resources WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Recurso no encontrado." });
  return res.json({ ok: true });
});
