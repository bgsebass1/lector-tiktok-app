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
  type: "libro" | "cita" | "palabra" | "idea" | "guion" | "escrito" | "highlight" | "flashcard" | "dialogo" | "recurso" | "evento";
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
    results.push({ type: "guion", id: s.id, title: s.title, subtitle: s.topic ?? undefined, to: "/crear" });
  }

  // Escritos
  for (const w of db
    .prepare("SELECT id, title FROM writings WHERE title LIKE ? OR content LIKE ? LIMIT 5")
    .all(like, like) as Array<{ id: number; title: string }>) {
    results.push({ type: "escrito", id: w.id, title: w.title, to: `/escribir/${w.id}` });
  }

  // Highlights / subrayados
  for (const h of db
    .prepare("SELECT id, text, book_id FROM highlights WHERE text LIKE ? OR note LIKE ? LIMIT 5")
    .all(like, like) as Array<{ id: number; text: string; book_id: number | null }>) {
    results.push({
      type: "highlight",
      id: h.id,
      title: h.text.slice(0, 80) + (h.text.length > 80 ? "…" : ""),
      to: h.book_id ? `/leer/${h.book_id}` : "/leer",
    });
  }

  // Flashcards
  for (const f of db
    .prepare("SELECT id, front, deck FROM flashcards WHERE front LIKE ? OR back LIKE ? LIMIT 5")
    .all(like, like) as Array<{ id: number; front: string; deck: string }>) {
    results.push({ type: "flashcard", id: f.id, title: f.front, subtitle: f.deck, to: "/flashcards" });
  }

  // Diálogos guardados
  for (const d of db
    .prepare("SELECT id, author_name FROM dialogues WHERE author_name LIKE ? LIMIT 5")
    .all(like) as Array<{ id: number; author_name: string }>) {
    results.push({ type: "dialogo", id: d.id, title: d.author_name, to: `/dialogos/${d.id}` });
  }

  // Recursos B-roll
  for (const r of db
    .prepare("SELECT id, title, type FROM resources WHERE title LIKE ? OR tags LIKE ? OR mood LIKE ? LIMIT 5")
    .all(like, like, like) as Array<{ id: number; title: string; type: string }>) {
    results.push({ type: "recurso", id: r.id, title: r.title, subtitle: r.type, to: "/recursos" });
  }

  // Eventos del timeline
  for (const e of db
    .prepare("SELECT id, title, year FROM timeline_events WHERE title LIKE ? OR description LIKE ? LIMIT 5")
    .all(like, like) as Array<{ id: number; title: string; year: number }>) {
    results.push({ type: "evento", id: e.id, title: e.title, subtitle: String(e.year), to: "/timeline" });
  }

  return res.json(results);
});
