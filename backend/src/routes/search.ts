/**
 * Ruta de BÚSQUEDA GLOBAL (mejora transversal 1, para el Cmd+K).
 *
 *  GET /api/search?q=...  -> resultados agrupados por tipo
 *  Busca en libros, citas, palabras, ideas y guiones.
 */
import { Router } from "express";
import { db } from "../db.js";

export const searchRouter = Router();

export interface SearchResult {
  type: "libro" | "cita" | "palabra" | "idea" | "guion";
  id: number;
  title: string;
  subtitle?: string;
  /** Ruta del frontend a la que navegar. */
  to: string;
}

searchRouter.get("/", (req, res) => {
  const q = String(req.query.q ?? "").trim();
  if (!q) return res.json([]);
  const like = `%${q}%`;
  const results: SearchResult[] = [];

  // Libros
  for (const b of db
    .prepare("SELECT id, title, author FROM books WHERE title LIKE ? OR author LIKE ? OR themes LIKE ? LIMIT 5")
    .all(like, like, like) as Array<{ id: number; title: string; author: string }>) {
    results.push({ type: "libro", id: b.id, title: b.title, subtitle: b.author, to: "/libros" });
  }

  // Citas
  for (const c of db
    .prepare("SELECT id, text FROM quotes WHERE text LIKE ? OR tags LIKE ? LIMIT 5")
    .all(like, like) as Array<{ id: number; text: string }>) {
    results.push({
      type: "cita",
      id: c.id,
      title: c.text.slice(0, 80) + (c.text.length > 80 ? "…" : ""),
      to: "/citas",
    });
  }

  // Palabras
  for (const w of db
    .prepare("SELECT id, word, status FROM words WHERE word LIKE ? LIMIT 5")
    .all(like) as Array<{ id: number; word: string; status: string }>) {
    results.push({ type: "palabra", id: w.id, title: w.word, subtitle: w.status, to: "/palabras" });
  }

  // Ideas
  for (const i of db
    .prepare("SELECT id, topic FROM ideas WHERE topic LIKE ? LIMIT 5")
    .all(like) as Array<{ id: number; topic: string }>) {
    results.push({ type: "idea", id: i.id, title: i.topic, to: "/ideas" });
  }

  // Guiones
  for (const s of db
    .prepare("SELECT id, title, topic FROM scripts WHERE title LIKE ? OR topic LIKE ? LIMIT 5")
    .all(like, like) as Array<{ id: number; title: string; topic: string | null }>) {
    results.push({ type: "guion", id: s.id, title: s.title, subtitle: s.topic ?? undefined, to: "/studio" });
  }

  return res.json(results);
});
