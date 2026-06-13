/**
 * Rutas de GUIONES (Módulo 1: Studio de guiones, con versionado).
 *
 *  GET    /api/scripts            -> lista guiones
 *  GET    /api/scripts/:id        -> un guion + sus versiones
 *  POST   /api/scripts/generate   -> Grok genera bloques (no guarda)
 *  POST   /api/scripts            -> guarda un guion nuevo
 *  PUT    /api/scripts/:id        -> actualiza guion (y crea versión histórica)
 *  DELETE /api/scripts/:id        -> borra guion
 *  POST   /api/scripts/rewrite-block -> Grok reescribe un bloque
 *  POST   /api/scripts/transform  -> Grok transforma el guion (viral/deep/shorter)
 */
import { Router, type Request, type Response } from "express";
import { db } from "../db.js";
import { sendGrokError } from "./grok.js";
import {
  generateScript,
  rewriteBlock,
  transformScript,
  type ScriptBlock,
} from "../services/content.service.js";

export const scriptsRouter = Router();

interface ScriptRow {
  id: number;
  title: string;
  topic: string | null;
  book_ref: string | null;
  duration: string | null;
  tone: string | null;
  blocks: string; // JSON
  created_at: string;
  updated_at: string | null;
}

/** Convierte una fila en objeto con los bloques ya parseados. */
function hydrate(row: ScriptRow) {
  return {
    ...row,
    blocks: safeBlocks(row.blocks),
  };
}

function safeBlocks(raw: string | null): ScriptBlock[] {
  try {
    const v = JSON.parse(raw ?? "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

/** GET /api/scripts */
scriptsRouter.get("/", (_req, res) => {
  const rows = db
    .prepare("SELECT * FROM scripts ORDER BY COALESCE(updated_at, created_at) DESC")
    .all() as ScriptRow[];
  res.json(rows.map(hydrate));
});

/** POST /api/scripts/generate — genera bloques con Grok (sin guardar). */
scriptsRouter.post("/generate", async (req: Request, res: Response) => {
  const { topic, bookRef, duration, tone } = req.body ?? {};
  if (!topic) return res.status(400).json({ error: "Falta el tema." });
  try {
    const blocks = await generateScript({
      topic,
      bookRef,
      duration: duration ?? "60s",
      tone: tone ?? "didáctico",
    });
    return res.json({ blocks });
  } catch (err) {
    return sendGrokError(res, err);
  }
});

/** POST /api/scripts/rewrite-block — reescribe un bloque concreto. */
scriptsRouter.post("/rewrite-block", async (req: Request, res: Response) => {
  const { fullScript, blockIndex, instruction } = req.body ?? {};
  if (!Array.isArray(fullScript) || typeof blockIndex !== "number") {
    return res.status(400).json({ error: "Faltan fullScript o blockIndex." });
  }
  try {
    const content = await rewriteBlock({ fullScript, blockIndex, instruction });
    return res.json({ content });
  } catch (err) {
    return sendGrokError(res, err);
  }
});

/** POST /api/scripts/transform — más viral / más profundo / más corto. */
scriptsRouter.post("/transform", async (req: Request, res: Response) => {
  const { blocks, mode } = req.body ?? {};
  if (!Array.isArray(blocks) || !["viral", "deep", "shorter"].includes(mode)) {
    return res.status(400).json({ error: "Faltan blocks o mode válido." });
  }
  try {
    const result = await transformScript({ blocks, mode });
    return res.json({ blocks: result });
  } catch (err) {
    return sendGrokError(res, err);
  }
});

/** GET /api/scripts/:id — guion + historial de versiones. */
scriptsRouter.get("/:id", (req, res) => {
  const row = db
    .prepare("SELECT * FROM scripts WHERE id = ?")
    .get(req.params.id) as ScriptRow | undefined;
  if (!row) return res.status(404).json({ error: "Guion no encontrado." });

  const versions = db
    .prepare("SELECT id, blocks, created_at FROM script_versions WHERE script_id = ? ORDER BY created_at DESC")
    .all(req.params.id) as Array<{ id: number; blocks: string; created_at: string }>;

  return res.json({
    ...hydrate(row),
    versions: versions.map((v) => ({ ...v, blocks: safeBlocks(v.blocks) })),
  });
});

/** POST /api/scripts — crea un guion. */
scriptsRouter.post("/", (req, res) => {
  const { title, topic, book_ref, duration, tone, blocks } = req.body ?? {};
  if (!title) return res.status(400).json({ error: "Falta el título." });

  const result = db
    .prepare(
      `INSERT INTO scripts (title, topic, book_ref, duration, tone, blocks, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
    )
    .run(
      title,
      topic ?? null,
      book_ref ?? null,
      duration ?? null,
      tone ?? null,
      JSON.stringify(blocks ?? [])
    );

  const created = db
    .prepare("SELECT * FROM scripts WHERE id = ?")
    .get(result.lastInsertRowid) as ScriptRow;
  return res.status(201).json(hydrate(created));
});

/** PUT /api/scripts/:id — actualiza y guarda la versión anterior en el historial. */
scriptsRouter.put("/:id", (req, res) => {
  const existing = db
    .prepare("SELECT * FROM scripts WHERE id = ?")
    .get(req.params.id) as ScriptRow | undefined;
  if (!existing) return res.status(404).json({ error: "Guion no encontrado." });

  // Guardamos la versión anterior antes de sobrescribir (versionado).
  db.prepare(
    "INSERT INTO script_versions (script_id, blocks) VALUES (?, ?)"
  ).run(existing.id, existing.blocks);

  const { title, topic, book_ref, duration, tone, blocks } = req.body ?? {};
  db.prepare(
    `UPDATE scripts SET
       title = ?, topic = ?, book_ref = ?, duration = ?, tone = ?, blocks = ?,
       updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).run(
    title ?? existing.title,
    topic ?? existing.topic,
    book_ref ?? existing.book_ref,
    duration ?? existing.duration,
    tone ?? existing.tone,
    blocks ? JSON.stringify(blocks) : existing.blocks,
    req.params.id
  );

  const updated = db
    .prepare("SELECT * FROM scripts WHERE id = ?")
    .get(req.params.id) as ScriptRow;
  return res.json(hydrate(updated));
});

/** DELETE /api/scripts/:id */
scriptsRouter.delete("/:id", (req, res) => {
  const result = db.prepare("DELETE FROM scripts WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "No encontrado." });
  return res.json({ ok: true });
});
