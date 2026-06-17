/**
 * MAPA EMOCIONAL DE LECTURAS (G3).
 *  GET /api/emotionmap            -> libros con sus coordenadas (x, y)
 *  PUT /api/emotionmap/:bookId    -> guarda coordenadas { x, y } (-1..1)
 */
import { Router, type Request, type Response } from "express";
import { db } from "../db.js";

export const emotionMapRouter = Router();

emotionMapRouter.get("/", (_req: Request, res: Response) => {
  const rows = db
    .prepare(
      `SELECT b.id, b.title, b.author, b.year, b.rating, b.cover_url,
              COALESCE(m.x, 0) AS x, COALESCE(m.y, 0) AS y,
              (m.book_id IS NOT NULL) AS placed
       FROM books b LEFT JOIN book_moods m ON m.book_id = b.id
       ORDER BY b.created_at DESC`
    )
    .all();
  res.json(rows);
});

emotionMapRouter.put("/:bookId", (req: Request, res: Response) => {
  const x = Math.max(-1, Math.min(1, Number(req.body?.x ?? 0)));
  const y = Math.max(-1, Math.min(1, Number(req.body?.y ?? 0)));
  db.prepare(
    `INSERT INTO book_moods (book_id, x, y) VALUES (?, ?, ?)
     ON CONFLICT(book_id) DO UPDATE SET x = excluded.x, y = excluded.y`
  ).run(req.params.bookId, x, y);
  res.json({ ok: true });
});
