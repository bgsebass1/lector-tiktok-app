/**
 * Rutas de FLASHCARDS (repaso espaciado con algoritmo SM-2).
 *
 *  GET    /api/flashcards                  -> todas las tarjetas
 *  GET    /api/flashcards/due              -> las que vencen hoy (o nuevas)
 *  GET    /api/flashcards/stats            -> { total, due, mastered, decks }
 *  POST   /api/flashcards                  -> crea una tarjeta manual
 *  POST   /api/flashcards/generate-from-book { bookId } -> Grok genera 10 y las guarda
 *  PATCH  /api/flashcards/:id/review { quality } -> actualiza con SM-2
 *  DELETE /api/flashcards/:id
 */
import { Router, type Request, type Response } from "express";
import { db } from "../db.js";
import { generateFlashcards } from "../services/content.service.js";
import { sendGrokError } from "./grok.js";

export const flashcardsRouter = Router();

interface CardRow {
  id: number;
  book_id: number | null;
  deck: string;
  front: string;
  back: string;
  interval_days: number;
  ease_factor: number;
  reps: number;
  due_date: string | null;
  created_at: string;
}

const TODAY = () => new Date().toISOString().slice(0, 10);

/** GET /api/flashcards */
flashcardsRouter.get("/", (_req: Request, res: Response) => {
  const rows = db.prepare("SELECT * FROM flashcards ORDER BY created_at DESC").all() as CardRow[];
  res.json(rows);
});

/** GET /api/flashcards/due — vencidas o nuevas (due_date NULL). */
flashcardsRouter.get("/due", (_req: Request, res: Response) => {
  const rows = db
    .prepare("SELECT * FROM flashcards WHERE due_date IS NULL OR due_date <= ? ORDER BY due_date IS NOT NULL, RANDOM()")
    .all(TODAY()) as CardRow[];
  res.json(rows);
});

/** GET /api/flashcards/stats */
flashcardsRouter.get("/stats", (_req: Request, res: Response) => {
  const total = (db.prepare("SELECT COUNT(*) n FROM flashcards").get() as { n: number }).n;
  const due = (
    db.prepare("SELECT COUNT(*) n FROM flashcards WHERE due_date IS NULL OR due_date <= ?").get(TODAY()) as { n: number }
  ).n;
  // "Dominadas": intervalo de al menos 21 días (criterio típico de madurez).
  const mastered = (db.prepare("SELECT COUNT(*) n FROM flashcards WHERE interval_days >= 21").get() as { n: number }).n;
  const decks = db
    .prepare(
      `SELECT deck,
              COUNT(*) total,
              SUM(CASE WHEN due_date IS NULL OR due_date <= ? THEN 1 ELSE 0 END) due
       FROM flashcards GROUP BY deck ORDER BY deck`
    )
    .all(TODAY()) as Array<{ deck: string; total: number; due: number }>;
  res.json({ total, due, mastered, decks });
});

/** POST /api/flashcards — crea una tarjeta manual. */
flashcardsRouter.post("/", (req: Request, res: Response) => {
  const { book_id, deck, front, back } = req.body ?? {};
  if (!String(front ?? "").trim() || !String(back ?? "").trim()) {
    return res.status(400).json({ error: "Faltan anverso (front) o reverso (back)." });
  }
  const result = db
    .prepare("INSERT INTO flashcards (book_id, deck, front, back) VALUES (?, ?, ?, ?)")
    .run(book_id ?? null, deck?.trim() || "General", String(front).trim(), String(back).trim());
  const created = db.prepare("SELECT * FROM flashcards WHERE id = ?").get(result.lastInsertRowid);
  return res.status(201).json(created);
});

/** POST /api/flashcards/generate-from-book { bookId } — Grok genera 10 y las guarda. */
flashcardsRouter.post("/generate-from-book", async (req: Request, res: Response) => {
  const bookId = Number(req.body?.bookId);
  const book = db.prepare("SELECT * FROM books WHERE id = ?").get(bookId) as
    | { id: number; title: string; author: string }
    | undefined;
  if (!book) return res.status(404).json({ error: "Libro no encontrado." });

  try {
    const cards = await generateFlashcards({ title: book.title, author: book.author, count: 10 });
    const insert = db.prepare("INSERT INTO flashcards (book_id, deck, front, back) VALUES (?, ?, ?, ?)");
    const tx = db.transaction((items: typeof cards) => {
      for (const c of items) {
        if (c.front && c.back) insert.run(book.id, book.title, c.front, c.back);
      }
    });
    tx(cards);
    return res.status(201).json({ created: cards.length, deck: book.title });
  } catch (err) {
    return sendGrokError(res, err);
  }
});

/**
 * PATCH /api/flashcards/:id/review { quality }
 * quality: "dificil" | "bien" | "facil" → SM-2.
 */
flashcardsRouter.patch("/:id/review", (req: Request, res: Response) => {
  const card = db.prepare("SELECT * FROM flashcards WHERE id = ?").get(req.params.id) as CardRow | undefined;
  if (!card) return res.status(404).json({ error: "Tarjeta no encontrada." });

  const qMap: Record<string, number> = { dificil: 2, bien: 4, facil: 5 };
  const quality = qMap[String(req.body?.quality)] ?? 4;

  let { ease_factor: ef, reps, interval_days: interval } = card;
  if (quality < 3) {
    reps = 0;
    interval = 1;
  } else {
    if (reps === 0) interval = 1;
    else if (reps === 1) interval = 6;
    else interval = Math.round(interval * ef);
    reps += 1;
  }
  // Ajuste del factor de facilidad (SM-2), mínimo 1.3.
  ef = Math.max(1.3, ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

  const due = new Date();
  due.setDate(due.getDate() + interval);
  const dueStr = due.toISOString().slice(0, 10);

  db.prepare(
    "UPDATE flashcards SET interval_days = ?, ease_factor = ?, reps = ?, due_date = ? WHERE id = ?"
  ).run(interval, ef, reps, dueStr, card.id);

  return res.json({ id: card.id, interval_days: interval, ease_factor: ef, reps, due_date: dueStr });
});

/** DELETE /api/flashcards/:id */
flashcardsRouter.delete("/:id", (req: Request, res: Response) => {
  const result = db.prepare("DELETE FROM flashcards WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Tarjeta no encontrada." });
  return res.json({ ok: true });
});
