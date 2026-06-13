/**
 * Rutas del CALENDARIO EDITORIAL / KANBAN (Módulo 5).
 *
 *  GET    /api/pipeline        -> todas las tarjetas
 *  POST   /api/pipeline        -> crea tarjeta
 *  PUT    /api/pipeline/:id     -> edita tarjeta (incluye mover de columna)
 *  DELETE /api/pipeline/:id     -> borra tarjeta
 *
 * Estados (columnas): idea | guion | grabar | editar | publicar | publicado
 */
import { Router } from "express";
import { db } from "../db.js";

export const pipelineRouter = Router();

interface CardRow {
  id: number;
  title: string;
  category: string | null;
  status: string;
  script_id: number | null;
  scheduled_date: string | null;
  notes: string | null;
  tags: string | null;
  created_at: string;
  updated_at: string | null;
}

const STATUSES = ["idea", "guion", "grabar", "editar", "publicar", "publicado"];

/** GET /api/pipeline */
pipelineRouter.get("/", (_req, res) => {
  const rows = db
    .prepare("SELECT * FROM content_pipeline ORDER BY COALESCE(updated_at, created_at) DESC")
    .all() as CardRow[];
  res.json(rows);
});

/** POST /api/pipeline */
pipelineRouter.post("/", (req, res) => {
  const { title, category, status, script_id, scheduled_date, notes, tags } =
    req.body ?? {};
  if (!title?.trim()) return res.status(400).json({ error: "Falta el título." });

  const result = db
    .prepare(
      `INSERT INTO content_pipeline
         (title, category, status, script_id, scheduled_date, notes, tags, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
    )
    .run(
      title.trim(),
      category ?? null,
      STATUSES.includes(status) ? status : "idea",
      script_id ?? null,
      scheduled_date ?? null,
      notes ?? null,
      tags ?? null
    );

  const created = db
    .prepare("SELECT * FROM content_pipeline WHERE id = ?")
    .get(result.lastInsertRowid);
  return res.status(201).json(created);
});

/** PUT /api/pipeline/:id — sirve también para arrastrar entre columnas. */
pipelineRouter.put("/:id", (req, res) => {
  const existing = db
    .prepare("SELECT * FROM content_pipeline WHERE id = ?")
    .get(req.params.id) as CardRow | undefined;
  if (!existing) return res.status(404).json({ error: "Tarjeta no encontrada." });

  const { title, category, status, script_id, scheduled_date, notes, tags } =
    req.body ?? {};

  db.prepare(
    `UPDATE content_pipeline SET
       title = ?, category = ?, status = ?, script_id = ?,
       scheduled_date = ?, notes = ?, tags = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).run(
    title ?? existing.title,
    category ?? existing.category,
    status && STATUSES.includes(status) ? status : existing.status,
    script_id ?? existing.script_id,
    scheduled_date ?? existing.scheduled_date,
    notes ?? existing.notes,
    tags ?? existing.tags,
    req.params.id
  );

  const updated = db
    .prepare("SELECT * FROM content_pipeline WHERE id = ?")
    .get(req.params.id);
  return res.json(updated);
});

/** DELETE /api/pipeline/:id */
pipelineRouter.delete("/:id", (req, res) => {
  const r = db.prepare("DELETE FROM content_pipeline WHERE id = ?").run(req.params.id);
  if (r.changes === 0) return res.status(404).json({ error: "No encontrada." });
  return res.json({ ok: true });
});
