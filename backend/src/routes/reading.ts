/**
 * Rutas de LECTURA: sesiones (cronómetro) + highlights (anotaciones).
 *
 *  GET    /api/reading/stats                 -> { totalMinutes, totalSessions, booksTouched }
 *  GET    /api/reading/sessions[?bookId=]    -> sesiones (con título del libro)
 *  POST   /api/reading/sessions              -> guarda una sesión
 *  DELETE /api/reading/sessions/:id          -> borra una sesión
 *  GET    /api/reading/highlights[?bookId=]  -> highlights (con título del libro)
 *  POST   /api/reading/highlights            -> guarda un highlight
 *  DELETE /api/reading/highlights/:id        -> borra un highlight
 */
import { Router, type Request, type Response } from "express";
import { db } from "../db.js";

export const readingRouter = Router();

/* ---------- Stats ---------- */
readingRouter.get("/stats", (_req: Request, res: Response) => {
  const row = db
    .prepare(
      "SELECT COALESCE(SUM(minutes),0) totalMinutes, COUNT(*) totalSessions, COUNT(DISTINCT book_id) booksTouched FROM reading_sessions"
    )
    .get() as { totalMinutes: number; totalSessions: number; booksTouched: number };
  res.json(row);
});

/* ---------- Heatmap anual ---------- */
readingRouter.get("/heatmap", (_req: Request, res: Response) => {
  const rows = db
    .prepare("SELECT date(created_at) d, SUM(minutes) m FROM reading_sessions GROUP BY date(created_at)")
    .all() as Array<{ d: string; m: number }>;
  res.json(rows);
});

/* ---------- Sesiones ---------- */
readingRouter.get("/sessions", (req: Request, res: Response) => {
  const bookId = req.query.bookId ? Number(req.query.bookId) : null;
  const sql =
    "SELECT s.*, b.title AS book_title FROM reading_sessions s LEFT JOIN books b ON b.id = s.book_id" +
    (bookId ? " WHERE s.book_id = ?" : "") +
    " ORDER BY s.created_at DESC";
  const rows = bookId ? db.prepare(sql).all(bookId) : db.prepare(sql).all();
  res.json(rows);
});

readingRouter.post("/sessions", (req: Request, res: Response) => {
  const { book_id, minutes, pages, note } = req.body ?? {};
  const m = Number(minutes);
  if (!Number.isFinite(m) || m < 0) return res.status(400).json({ error: "Minutos inválidos." });
  const result = db
    .prepare("INSERT INTO reading_sessions (book_id, minutes, pages, note) VALUES (?, ?, ?, ?)")
    .run(book_id ?? null, Math.round(m), pages ? Number(pages) : null, note?.trim() || null);
  const created = db
    .prepare("SELECT s.*, b.title AS book_title FROM reading_sessions s LEFT JOIN books b ON b.id = s.book_id WHERE s.id = ?")
    .get(result.lastInsertRowid);
  return res.status(201).json(created);
});

readingRouter.delete("/sessions/:id", (req: Request, res: Response) => {
  const result = db.prepare("DELETE FROM reading_sessions WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Sesión no encontrada." });
  return res.json({ ok: true });
});

/* ---------- Highlights ---------- */
readingRouter.get("/highlights", (req: Request, res: Response) => {
  const bookId = req.query.bookId ? Number(req.query.bookId) : null;
  const sql =
    "SELECT h.*, b.title AS book_title FROM highlights h LEFT JOIN books b ON b.id = h.book_id" +
    (bookId ? " WHERE h.book_id = ?" : "") +
    " ORDER BY h.created_at DESC";
  const rows = bookId ? db.prepare(sql).all(bookId) : db.prepare(sql).all();
  res.json(rows);
});

readingRouter.post("/highlights", (req: Request, res: Response) => {
  const { book_id, text, note, page } = req.body ?? {};
  if (!String(text ?? "").trim()) return res.status(400).json({ error: "El subrayado no puede estar vacío." });
  const result = db
    .prepare("INSERT INTO highlights (book_id, text, note, page) VALUES (?, ?, ?, ?)")
    .run(book_id ?? null, String(text).trim(), note?.trim() || null, page ? Number(page) : null);
  const created = db
    .prepare("SELECT h.*, b.title AS book_title FROM highlights h LEFT JOIN books b ON b.id = h.book_id WHERE h.id = ?")
    .get(result.lastInsertRowid);
  return res.status(201).json(created);
});

readingRouter.delete("/highlights/:id", (req: Request, res: Response) => {
  const result = db.prepare("DELETE FROM highlights WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Highlight no encontrado." });
  return res.json({ ok: true });
});
