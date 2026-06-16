/**
 * Rutas de QUIERO LEER (lista de deseos / TBR).
 *
 *  GET    /api/wishlist            -> lista ordenada por prioridad
 *  POST   /api/wishlist            -> añade un libro (autocompleta portada)
 *  PATCH  /api/wishlist/:id        -> edita (prioridad, razón…)
 *  POST   /api/wishlist/:id/move   -> sube/baja la prioridad (?dir=up|down)
 *  POST   /api/wishlist/:id/promote-> mueve el libro a la biblioteca (books)
 *  DELETE /api/wishlist/:id        -> quita un libro de la lista
 */
import { Router, type Request, type Response } from "express";
import { db } from "../db.js";
import { searchCovers } from "../services/openlibrary.service.js";

export const wishlistRouter = Router();

interface WishRow {
  id: number;
  title: string;
  author: string;
  reason: string | null;
  cover_url: string | null;
  priority: number;
  source: string;
  created_at: string;
}

/** GET /api/wishlist — prioridad alta primero, luego más recientes. */
wishlistRouter.get("/", (_req: Request, res: Response) => {
  const rows = db
    .prepare("SELECT * FROM wishlist ORDER BY priority DESC, created_at DESC")
    .all() as WishRow[];
  res.json(rows);
});

/** POST /api/wishlist — añade un libro. Si no trae portada, la busca en Open Library. */
wishlistRouter.post("/", async (req: Request, res: Response) => {
  const title = String(req.body?.title ?? "").trim();
  const author = String(req.body?.author ?? "").trim();
  if (!title || !author) {
    return res.status(400).json({ error: "El título y el autor son obligatorios." });
  }
  const reason = req.body?.reason ? String(req.body.reason) : null;
  const source = req.body?.source ? String(req.body.source) : "manual";

  let coverUrl: string | null = req.body?.cover_url ?? null;
  if (!coverUrl) {
    try {
      const opts = await searchCovers(title, author, 1);
      coverUrl = opts[0]?.coverL ?? null;
    } catch {
      coverUrl = null; // sin portada no es un error
    }
  }

  const result = db
    .prepare("INSERT INTO wishlist (title, author, reason, cover_url, source) VALUES (?, ?, ?, ?, ?)")
    .run(title, author, reason, coverUrl, source);
  const created = db.prepare("SELECT * FROM wishlist WHERE id = ?").get(result.lastInsertRowid);
  return res.status(201).json(created);
});

/** PATCH /api/wishlist/:id — edita prioridad/razón. */
wishlistRouter.patch("/:id", (req: Request, res: Response) => {
  const existing = db.prepare("SELECT * FROM wishlist WHERE id = ?").get(req.params.id) as WishRow | undefined;
  if (!existing) return res.status(404).json({ error: "No encontrado." });

  const { reason, priority } = req.body ?? {};
  db.prepare("UPDATE wishlist SET reason = ?, priority = ? WHERE id = ?").run(
    reason !== undefined ? reason : existing.reason,
    priority !== undefined ? Number(priority) : existing.priority,
    req.params.id
  );
  return res.json(db.prepare("SELECT * FROM wishlist WHERE id = ?").get(req.params.id));
});

/** POST /api/wishlist/:id/move?dir=up|down — intercambia prioridad con el vecino. */
wishlistRouter.post("/:id/move", (req: Request, res: Response) => {
  const dir = req.query.dir === "down" ? "down" : "up";
  const all = db.prepare("SELECT * FROM wishlist ORDER BY priority DESC, created_at DESC").all() as WishRow[];
  const idx = all.findIndex((w) => w.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: "No encontrado." });

  const swapWith = dir === "up" ? idx - 1 : idx + 1;
  if (swapWith < 0 || swapWith >= all.length) return res.json({ ok: true }); // ya está en el extremo

  const a = all[idx];
  const b = all[swapWith];
  // Intercambiamos prioridades. Si son iguales, damos un pequeño empujón.
  const pa = a.priority;
  const pb = b.priority === pa ? pa + (dir === "up" ? 1 : -1) : b.priority;
  const upd = db.prepare("UPDATE wishlist SET priority = ? WHERE id = ?");
  upd.run(pb, a.id);
  upd.run(pa, b.id);
  return res.json({ ok: true });
});

/** POST /api/wishlist/:id/promote — mueve el libro a la biblioteca (books) y lo quita de la lista. */
wishlistRouter.post("/:id/promote", (req: Request, res: Response) => {
  const w = db.prepare("SELECT * FROM wishlist WHERE id = ?").get(req.params.id) as WishRow | undefined;
  if (!w) return res.status(404).json({ error: "No encontrado." });

  const result = db
    .prepare("INSERT INTO books (title, author, cover_url, notes) VALUES (?, ?, ?, ?)")
    .run(w.title, w.author, w.cover_url, w.reason);
  db.prepare("DELETE FROM wishlist WHERE id = ?").run(w.id);

  const book = db.prepare("SELECT * FROM books WHERE id = ?").get(result.lastInsertRowid);
  return res.status(201).json(book);
});

/** DELETE /api/wishlist/:id */
wishlistRouter.delete("/:id", (req: Request, res: Response) => {
  const result = db.prepare("DELETE FROM wishlist WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "No encontrado." });
  return res.json({ ok: true });
});
