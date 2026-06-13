/**
 * Rutas del BANCO DE INSPIRACIÓN (Módulo 7).
 *
 *  GET    /api/inspiration            -> todos los items
 *  POST   /api/inspiration            -> crea item (url/texto/imagen)
 *  DELETE /api/inspiration/:id        -> borra item
 *  POST   /api/inspiration/:id/ideas  -> Grok: 5 ideas conectadas con el nicho
 */
import { Router, type Request, type Response } from "express";
import { db } from "../db.js";
import { sendGrokError } from "./grok.js";
import { inspireFrom } from "../services/content.service.js";

export const inspirationRouter = Router();

interface InspRow {
  id: number;
  type: string;
  content: string;
  description: string | null;
  tags: string | null;
  created_at: string;
}

/** GET /api/inspiration */
inspirationRouter.get("/", (_req, res) => {
  const rows = db
    .prepare("SELECT * FROM inspiration ORDER BY created_at DESC")
    .all() as InspRow[];
  res.json(rows);
});

/** POST /api/inspiration */
inspirationRouter.post("/", (req, res) => {
  const { type, content, description, tags } = req.body ?? {};
  const validTypes = ["url", "texto", "imagen"];
  if (!content?.trim()) return res.status(400).json({ error: "Falta el contenido." });

  const result = db
    .prepare("INSERT INTO inspiration (type, content, description, tags) VALUES (?, ?, ?, ?)")
    .run(validTypes.includes(type) ? type : "texto", content.trim(), description ?? null, tags ?? null);

  const created = db.prepare("SELECT * FROM inspiration WHERE id = ?").get(result.lastInsertRowid);
  return res.status(201).json(created);
});

/** DELETE /api/inspiration/:id */
inspirationRouter.delete("/:id", (req, res) => {
  const r = db.prepare("DELETE FROM inspiration WHERE id = ?").run(req.params.id);
  if (r.changes === 0) return res.status(404).json({ error: "No encontrada." });
  return res.json({ ok: true });
});

/** POST /api/inspiration/:id/ideas — "Inspírame con esto". */
inspirationRouter.post("/:id/ideas", async (req: Request, res: Response) => {
  const item = db
    .prepare("SELECT * FROM inspiration WHERE id = ?")
    .get(req.params.id) as InspRow | undefined;
  if (!item) return res.status(404).json({ error: "Item no encontrado." });

  const material = [item.content, item.description].filter(Boolean).join("\n");
  try {
    return res.json({ ideas: await inspireFrom(material) });
  } catch (err) {
    return sendGrokError(res, err);
  }
});
