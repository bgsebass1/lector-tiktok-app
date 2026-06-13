/**
 * Rutas de BACKUP / RESTORE (mejora transversal 6).
 *
 *  GET  /api/backup   -> descarga toda la BD como un JSON
 *  POST /api/restore  -> restaura desde un JSON (reemplaza el contenido)
 */
import { Router, type Request, type Response } from "express";
import { db } from "../db.js";

export const backupRouter = Router();

// Tablas que entran en el backup.
const TABLES = [
  "books",
  "ideas",
  "book_recommendations",
  "scripts",
  "script_versions",
  "quotes",
  "words",
  "content_pipeline",
  "series",
  "series_episodes",
  "inspiration",
];

/** GET /api/backup — exporta todo como JSON descargable. */
backupRouter.get("/backup", (_req, res) => {
  const dump: Record<string, unknown[]> = {};
  for (const table of TABLES) {
    dump[table] = db.prepare(`SELECT * FROM ${table}`).all();
  }

  const payload = {
    exported_at: new Date().toISOString(),
    version: 1,
    data: dump,
  };

  const filename = `backup-libros-${new Date().toISOString().slice(0, 10)}.json`;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(JSON.stringify(payload, null, 2));
});

/** POST /api/restore — restaura desde un JSON exportado. */
backupRouter.post("/restore", (req: Request, res: Response) => {
  const data = req.body?.data as Record<string, Array<Record<string, unknown>>> | undefined;
  if (!data || typeof data !== "object") {
    return res.status(400).json({ error: "JSON de backup inválido (falta 'data')." });
  }

  // Todo dentro de una transacción: si algo falla, no queda a medias.
  const restore = db.transaction(() => {
    db.pragma("foreign_keys = OFF");
    for (const table of TABLES) {
      const rows = data[table];
      if (!Array.isArray(rows)) continue;

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

  try {
    restore();
    return res.json({ ok: true });
  } catch (err) {
    console.error("Error restaurando backup:", err);
    return res.status(500).json({ error: "No se pudo restaurar el backup." });
  }
});
