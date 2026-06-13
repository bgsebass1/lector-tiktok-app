/**
 * Rutas del BANCO DE CITAS (Módulo 3).
 *
 *  GET    /api/quotes              -> lista citas (con título del libro)
 *  POST   /api/quotes              -> crea cita
 *  PUT    /api/quotes/:id          -> edita cita
 *  DELETE /api/quotes/:id          -> borra cita
 *  POST   /api/quotes/:id/to-video -> Grok: 3 ideas de video desde la cita
 */
import { Router, type Request, type Response } from "express";
import { db } from "../db.js";
import { sendGrokError } from "./grok.js";
import { quoteToVideo } from "../services/content.service.js";

export const quotesRouter = Router();

interface QuoteRow {
  id: number;
  book_id: number | null;
  text: string;
  page: number | null;
  tags: string | null;
  created_at: string;
  book_title: string | null;
  book_author: string | null;
}

/** GET /api/quotes — con join al libro para mostrar título/autor. */
quotesRouter.get("/", (_req, res) => {
  const rows = db
    .prepare(
      `SELECT q.*, b.title AS book_title, b.author AS book_author
       FROM quotes q LEFT JOIN books b ON q.book_id = b.id
       ORDER BY q.created_at DESC`
    )
    .all() as QuoteRow[];
  res.json(rows);
});

/** POST /api/quotes */
quotesRouter.post("/", (req, res) => {
  const { book_id, text, page, tags } = req.body ?? {};
  if (!text?.trim()) return res.status(400).json({ error: "Falta el texto de la cita." });

  const result = db
    .prepare("INSERT INTO quotes (book_id, text, page, tags) VALUES (?, ?, ?, ?)")
    .run(book_id ?? null, text.trim(), page ?? null, tags ?? null);

  const created = db
    .prepare(
      `SELECT q.*, b.title AS book_title, b.author AS book_author
       FROM quotes q LEFT JOIN books b ON q.book_id = b.id WHERE q.id = ?`
    )
    .get(result.lastInsertRowid);
  return res.status(201).json(created);
});

/** PUT /api/quotes/:id */
quotesRouter.put("/:id", (req, res) => {
  const existing = db
    .prepare("SELECT * FROM quotes WHERE id = ?")
    .get(req.params.id) as QuoteRow | undefined;
  if (!existing) return res.status(404).json({ error: "Cita no encontrada." });

  const { book_id, text, page, tags } = req.body ?? {};
  db.prepare(
    "UPDATE quotes SET book_id = ?, text = ?, page = ?, tags = ? WHERE id = ?"
  ).run(
    book_id ?? existing.book_id,
    text ?? existing.text,
    page ?? existing.page,
    tags ?? existing.tags,
    req.params.id
  );

  const updated = db
    .prepare(
      `SELECT q.*, b.title AS book_title, b.author AS book_author
       FROM quotes q LEFT JOIN books b ON q.book_id = b.id WHERE q.id = ?`
    )
    .get(req.params.id);
  return res.json(updated);
});

/** DELETE /api/quotes/:id */
quotesRouter.delete("/:id", (req, res) => {
  const r = db.prepare("DELETE FROM quotes WHERE id = ?").run(req.params.id);
  if (r.changes === 0) return res.status(404).json({ error: "No encontrada." });
  return res.json({ ok: true });
});

/** POST /api/quotes/:id/to-video — convierte la cita en 3 ideas de video. */
quotesRouter.post("/:id/to-video", async (req: Request, res: Response) => {
  const quote = db
    .prepare(
      `SELECT q.*, b.author AS book_author FROM quotes q
       LEFT JOIN books b ON q.book_id = b.id WHERE q.id = ?`
    )
    .get(req.params.id) as QuoteRow | undefined;
  if (!quote) return res.status(404).json({ error: "Cita no encontrada." });

  try {
    const ideas = await quoteToVideo(quote.text, quote.book_author ?? undefined);
    return res.json({ ideas });
  } catch (err) {
    return sendGrokError(res, err);
  }
});
