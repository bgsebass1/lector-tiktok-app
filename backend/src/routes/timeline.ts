/**
 * Rutas del TIMELINE INTELECTUAL.
 * Combina los libros (por año de publicación) con eventos personalizados.
 *
 *  GET    /api/timeline             -> { entries (ordenadas por año), undated }
 *  POST   /api/timeline/events      -> crea un evento personalizado
 *  PUT    /api/timeline/events/:id  -> edita un evento
 *  DELETE /api/timeline/events/:id  -> borra un evento
 */
import { Router, type Request, type Response } from "express";
import { db } from "../db.js";

export const timelineRouter = Router();

interface BookRow {
  id: number;
  title: string;
  author: string;
  year: number | null;
  cover_url: string | null;
}
interface EventRow {
  id: number;
  year: number;
  title: string;
  description: string | null;
  kind: string;
}

/** GET /api/timeline */
timelineRouter.get("/", (_req: Request, res: Response) => {
  const books = db.prepare("SELECT id, title, author, year, cover_url FROM books").all() as BookRow[];
  const events = db.prepare("SELECT * FROM timeline_events").all() as EventRow[];

  const bookEntries = books
    .filter((b) => b.year != null)
    .map((b) => ({
      kind: "libro",
      id: b.id,
      year: b.year as number,
      title: b.title,
      subtitle: b.author,
      cover: b.cover_url,
      isEvent: false,
    }));

  const eventEntries = events.map((e) => ({
    kind: e.kind,
    id: e.id,
    year: e.year,
    title: e.title,
    subtitle: e.description,
    cover: null,
    isEvent: true,
  }));

  const entries = [...bookEntries, ...eventEntries].sort((a, b) => a.year - b.year);

  const undated = books
    .filter((b) => b.year == null)
    .map((b) => ({ kind: "libro", id: b.id, title: b.title, subtitle: b.author, cover: b.cover_url }));

  res.json({ entries, undated });
});

/** POST /api/timeline/events */
timelineRouter.post("/events", (req: Request, res: Response) => {
  const { year, title, description, kind } = req.body ?? {};
  const y = Number(year);
  if (!Number.isFinite(y) || !String(title ?? "").trim()) {
    return res.status(400).json({ error: "Faltan año o título." });
  }
  const result = db
    .prepare("INSERT INTO timeline_events (year, title, description, kind) VALUES (?, ?, ?, ?)")
    .run(y, String(title).trim(), description?.trim() || null, kind?.trim() || "evento");
  const created = db.prepare("SELECT * FROM timeline_events WHERE id = ?").get(result.lastInsertRowid);
  return res.status(201).json(created);
});

/** PUT /api/timeline/events/:id */
timelineRouter.put("/events/:id", (req: Request, res: Response) => {
  const existing = db.prepare("SELECT * FROM timeline_events WHERE id = ?").get(req.params.id) as
    | EventRow
    | undefined;
  if (!existing) return res.status(404).json({ error: "Evento no encontrado." });
  const { year, title, description, kind } = req.body ?? {};
  db.prepare("UPDATE timeline_events SET year = ?, title = ?, description = ?, kind = ? WHERE id = ?").run(
    year != null ? Number(year) : existing.year,
    title ?? existing.title,
    description ?? existing.description,
    kind ?? existing.kind,
    req.params.id
  );
  const updated = db.prepare("SELECT * FROM timeline_events WHERE id = ?").get(req.params.id);
  return res.json(updated);
});

/** DELETE /api/timeline/events/:id */
timelineRouter.delete("/events/:id", (req: Request, res: Response) => {
  const result = db.prepare("DELETE FROM timeline_events WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Evento no encontrado." });
  return res.json({ ok: true });
});
