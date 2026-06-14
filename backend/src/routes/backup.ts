/**
 * Rutas de BACKUP / RESTORE / EXPORT / IMPORT.
 *
 *  GET  /api/backup      -> descarga toda la BD como JSON
 *  POST /api/restore     -> restaura desde un JSON (reemplaza el contenido)
 *  GET  /api/export-all  -> alias de /backup (export completo descargable)
 *  POST /api/import-all  -> alias de /restore
 *
 * Las tablas se descubren dinámicamente desde sqlite_master, así que cualquier
 * tabla nueva (sesiones, highlights, flashcards, etc.) entra automáticamente.
 */
import { Router, type Request, type Response } from "express";
import { db } from "../db.js";

export const backupRouter = Router();

/** Lista todas las tablas de usuario (excluye internas de SQLite). */
function allTables(): string[] {
  return db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    .all()
    .map((r) => (r as { name: string }).name);
}

/** Vuelca toda la BD a un objeto serializable. */
function dumpAll() {
  const data: Record<string, unknown[]> = {};
  for (const table of allTables()) {
    data[table] = db.prepare(`SELECT * FROM ${table}`).all();
  }
  return { exported_at: new Date().toISOString(), app: "pliego", version: 2, data };
}

/** Restaura la BD desde un volcado (transaccional). */
function restoreAll(data: Record<string, Array<Record<string, unknown>>>) {
  const tables = new Set(allTables());
  const run = db.transaction(() => {
    db.pragma("foreign_keys = OFF");
    for (const [table, rows] of Object.entries(data)) {
      if (!tables.has(table) || !Array.isArray(rows)) continue;
      db.prepare(`DELETE FROM ${table}`).run();
      for (const row of rows) {
        const cols = Object.keys(row);
        if (cols.length === 0) continue;
        const placeholders = cols.map(() => "?").join(", ");
        db.prepare(
          `INSERT INTO ${table} (${cols.join(", ")}) VALUES (${placeholders})`
        ).run(...cols.map((c) => row[c]));
      }
    }
    db.pragma("foreign_keys = ON");
  });
  run();
}

/** Handler compartido para descargar el export. */
function sendExport(res: Response) {
  const filename = `pliego-backup-${new Date().toISOString().slice(0, 10)}.json`;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(JSON.stringify(dumpAll(), null, 2));
}

/** Handler compartido para importar/restaurar. */
function handleImport(req: Request, res: Response) {
  const data = req.body?.data as Record<string, Array<Record<string, unknown>>> | undefined;
  if (!data || typeof data !== "object") {
    return res.status(400).json({ error: "JSON inválido (falta 'data')." });
  }
  try {
    restoreAll(data);
    return res.json({ ok: true });
  } catch (err) {
    console.error("Error restaurando:", err);
    return res.status(500).json({ error: "No se pudo restaurar." });
  }
}

backupRouter.get("/backup", (_req, res) => sendExport(res));
backupRouter.get("/export-all", (_req, res) => sendExport(res));
backupRouter.post("/restore", handleImport);
backupRouter.post("/import-all", handleImport);
