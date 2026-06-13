/**
 * Rutas de LIBROS.
 *
 *  GET    /api/books             -> lista todos los libros leídos
 *  GET    /api/books/search      -> busca carátulas en Open Library (?title=&author=)
 *  GET    /api/books/:id         -> detalle de un libro
 *  POST   /api/books             -> guarda un libro nuevo
 *  PUT    /api/books/:id         -> edita un libro
 *  DELETE /api/books/:id         -> borra un libro
 *  POST   /api/books/recommend   -> pide a Grok 3 libros según toda la biblioteca
 */
import { Router, type Request, type Response } from "express";
import { db } from "../db.js";
import { searchCovers } from "../services/openlibrary.service.js";
import { recommendBooks } from "../services/grok.service.js";
import { sendGrokError } from "./grok.js";

export const booksRouter = Router();

/** Tipo de una fila de la tabla books. */
interface BookRow {
  id: number;
  title: string;
  author: string;
  year: number | null;
  cover_url: string | null;
  rating: number | null;
  notes: string | null;
  themes: string | null;
  read_date: string | null;
  created_at: string;
}

/** GET /api/books — todos los libros, más recientes primero. */
booksRouter.get("/", (_req: Request, res: Response) => {
  const books = db
    .prepare("SELECT * FROM books ORDER BY created_at DESC")
    .all() as BookRow[];
  res.json(books);
});

/**
 * GET /api/books/search?title=...&author=...
 * Devuelve opciones de carátula desde Open Library.
 * (Se define ANTES de "/:id" para que "search" no se confunda con un id.)
 */
booksRouter.get("/search", async (req: Request, res: Response) => {
  const title = String(req.query.title ?? "").trim();
  const author = String(req.query.author ?? "").trim();

  if (!title) {
    return res.status(400).json({ error: "Falta el parámetro 'title'." });
  }

  try {
    const options = await searchCovers(title, author);
    return res.json(options);
  } catch (err) {
    console.error("Error buscando en Open Library:", err);
    return res.status(502).json({ error: "No se pudo consultar Open Library." });
  }
});

/**
 * POST /api/books/recommend
 * Pide a Grok 3 libros recomendados basándose en toda la biblioteca.
 * Guarda las recomendaciones en book_recommendations.
 */
booksRouter.post("/recommend", async (_req: Request, res: Response) => {
  try {
    const books = db
      .prepare("SELECT title, author, themes FROM books ORDER BY created_at DESC")
      .all() as Array<{ title: string; author: string; themes: string | null }>;

    const recommendations = await recommendBooks(books);

    // Guardamos cada recomendación para poder revisarlas después.
    const basedOn = books.map((b) => b.title).join(", ");
    const insert = db.prepare(
      `INSERT INTO book_recommendations (title, author, reason, based_on_books)
       VALUES (?, ?, ?, ?)`
    );
    for (const r of recommendations) {
      insert.run(r.title, r.author, r.reason, basedOn);
    }

    return res.json(recommendations);
  } catch (err) {
    return sendGrokError(res, err);
  }
});

/** GET /api/books/:id — detalle de un libro. */
booksRouter.get("/:id", (req: Request, res: Response) => {
  const book = db
    .prepare("SELECT * FROM books WHERE id = ?")
    .get(req.params.id) as BookRow | undefined;

  if (!book) {
    return res.status(404).json({ error: "Libro no encontrado." });
  }
  return res.json(book);
});

/** POST /api/books — crea un libro nuevo. */
booksRouter.post("/", (req: Request, res: Response) => {
  const { title, author, year, cover_url, rating, notes, themes, read_date } =
    req.body ?? {};

  if (!title || !author) {
    return res.status(400).json({ error: "El título y el autor son obligatorios." });
  }

  const result = db
    .prepare(
      `INSERT INTO books (title, author, year, cover_url, rating, notes, themes, read_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      title,
      author,
      year ?? null,
      cover_url ?? null,
      rating ?? null,
      notes ?? null,
      themes ?? null,
      read_date ?? null
    );

  const created = db
    .prepare("SELECT * FROM books WHERE id = ?")
    .get(result.lastInsertRowid) as BookRow;

  return res.status(201).json(created);
});

/** PUT /api/books/:id — edita un libro existente. */
booksRouter.put("/:id", (req: Request, res: Response) => {
  const existing = db
    .prepare("SELECT * FROM books WHERE id = ?")
    .get(req.params.id) as BookRow | undefined;

  if (!existing) {
    return res.status(404).json({ error: "Libro no encontrado." });
  }

  const { title, author, year, cover_url, rating, notes, themes, read_date } =
    req.body ?? {};

  // Mantenemos el valor anterior si no viene uno nuevo.
  db.prepare(
    `UPDATE books SET
       title = ?, author = ?, year = ?, cover_url = ?,
       rating = ?, notes = ?, themes = ?, read_date = ?
     WHERE id = ?`
  ).run(
    title ?? existing.title,
    author ?? existing.author,
    year ?? existing.year,
    cover_url ?? existing.cover_url,
    rating ?? existing.rating,
    notes ?? existing.notes,
    themes ?? existing.themes,
    read_date ?? existing.read_date,
    req.params.id
  );

  const updated = db
    .prepare("SELECT * FROM books WHERE id = ?")
    .get(req.params.id) as BookRow;

  return res.json(updated);
});

/** DELETE /api/books/:id — borra un libro. */
booksRouter.delete("/:id", (req: Request, res: Response) => {
  const result = db.prepare("DELETE FROM books WHERE id = ?").run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: "Libro no encontrado." });
  }
  return res.json({ ok: true });
});
