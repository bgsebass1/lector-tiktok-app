/**
 * Rutas de ESCRIBIR (escritura libre).
 *
 *  GET    /api/writings        -> lista (con snippet, sin todo el contenido)
 *  GET    /api/writings/:id     -> un texto completo
 *  POST   /api/writings         -> crea un texto (vacío o con título)
 *  PUT    /api/writings/:id      -> actualiza título/contenido
 *  DELETE /api/writings/:id      -> borra un texto
 */
import { Router, type Request, type Response } from "express";
import { db } from "../db.js";

export const writingsRouter = Router();

interface WritingRow {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string | null;
}

/** GET /api/writings — resumen (con snippet). */
writingsRouter.get("/", (_req: Request, res: Response) => {
  const rows = db
    .prepare(
      `SELECT id, title, substr(content, 1, 160) AS snippet, created_at, updated_at
       FROM writings ORDER BY COALESCE(updated_at, created_at) DESC`
    )
    .all();
  res.json(rows);
});

/** GET /api/writings/:id */
writingsRouter.get("/:id", (req: Request, res: Response) => {
  const row = db.prepare("SELECT * FROM writings WHERE id = ?").get(req.params.id) as
    | WritingRow
    | undefined;
  if (!row) return res.status(404).json({ error: "Texto no encontrado." });
  return res.json(row);
});

/** POST /api/writings */
writingsRouter.post("/", (req: Request, res: Response) => {
  const title = String(req.body?.title ?? "").trim() || "Sin título";
  const content = String(req.body?.content ?? "");
  const result = db
    .prepare("INSERT INTO writings (title, content, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)")
    .run(title, content);
  const created = db.prepare("SELECT * FROM writings WHERE id = ?").get(result.lastInsertRowid);
  return res.status(201).json(created);
});

/** PUT /api/writings/:id */
writingsRouter.put("/:id", (req: Request, res: Response) => {
  const existing = db.prepare("SELECT * FROM writings WHERE id = ?").get(req.params.id) as
    | WritingRow
    | undefined;
  if (!existing) return res.status(404).json({ error: "Texto no encontrado." });
  const { title, content } = req.body ?? {};
  db.prepare("UPDATE writings SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(
    title != null ? String(title).trim() || "Sin título" : existing.title,
    content != null ? String(content) : existing.content,
    req.params.id
  );
  const updated = db.prepare("SELECT * FROM writings WHERE id = ?").get(req.params.id);
  return res.json(updated);
});

/** DELETE /api/writings/:id */
writingsRouter.delete("/:id", (req: Request, res: Response) => {
  const result = db.prepare("DELETE FROM writings WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Texto no encontrado." });
  return res.json({ ok: true });
});
