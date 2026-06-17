/**
 * ÁRBOL DE INFLUENCIAS (G5).
 *  GET    /api/influences          -> todos los nodos (parent_id null = hijos de "Tú")
 *  POST   /api/influences          -> añade { name, parent_id?, note?, key_works? }
 *  PUT    /api/influences/:id        -> edita note / key_works
 *  DELETE /api/influences/:id        -> borra el nodo y sus descendientes
 *  POST   /api/influences/:id/expand -> la IA propone las influencias del autor
 */
import { Router, type Request, type Response } from "express";
import { db } from "../db.js";
import { grokJson } from "../services/grok.service.js";
import { sendGrokError } from "./grok.js";

export const influencesRouter = Router();

interface InflRow {
  id: number;
  name: string;
  parent_id: number | null;
  note: string | null;
  key_works: string | null;
  created_at: string;
}

influencesRouter.get("/", (_req: Request, res: Response) => {
  res.json(db.prepare("SELECT * FROM influences ORDER BY created_at").all());
});

influencesRouter.post("/", (req: Request, res: Response) => {
  const name = String(req.body?.name ?? "").trim();
  if (!name) return res.status(400).json({ error: "Falta el nombre." });
  const parent_id = req.body?.parent_id != null ? Number(req.body.parent_id) : null;
  const result = db
    .prepare("INSERT INTO influences (name, parent_id, note, key_works) VALUES (?, ?, ?, ?)")
    .run(name, parent_id, req.body?.note ?? null, req.body?.key_works ?? null);
  return res.status(201).json(db.prepare("SELECT * FROM influences WHERE id = ?").get(result.lastInsertRowid));
});

influencesRouter.put("/:id", (req: Request, res: Response) => {
  const ex = db.prepare("SELECT * FROM influences WHERE id = ?").get(req.params.id) as InflRow | undefined;
  if (!ex) return res.status(404).json({ error: "No encontrado." });
  db.prepare("UPDATE influences SET note = ?, key_works = ? WHERE id = ?").run(
    req.body?.note ?? ex.note,
    req.body?.key_works ?? ex.key_works,
    req.params.id
  );
  return res.json(db.prepare("SELECT * FROM influences WHERE id = ?").get(req.params.id));
});

influencesRouter.delete("/:id", (req: Request, res: Response) => {
  // Borrado recursivo de descendientes.
  const all = db.prepare("SELECT id, parent_id FROM influences").all() as Array<{ id: number; parent_id: number | null }>;
  const toDelete = new Set<number>([Number(req.params.id)]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const n of all) {
      if (n.parent_id != null && toDelete.has(n.parent_id) && !toDelete.has(n.id)) {
        toDelete.add(n.id);
        grew = true;
      }
    }
  }
  const del = db.prepare("DELETE FROM influences WHERE id = ?");
  for (const id of toDelete) del.run(id);
  return res.json({ ok: true });
});

interface ExpandResult {
  influencias: Array<{ name: string; note: string }>;
}
influencesRouter.post("/:id/expand", async (req: Request, res: Response) => {
  const node = db.prepare("SELECT * FROM influences WHERE id = ?").get(req.params.id) as InflRow | undefined;
  if (!node) return res.status(404).json({ error: "No encontrado." });

  const systemPrompt =
    "Conoces la genealogía intelectual de pensadores y autores. Devuelves solo JSON válido.";
  const userPrompt = `¿Quiénes fueron las 3 o 4 influencias intelectuales más importantes de ${node.name}?
Devuelve SOLO:
{ "influencias": [ { "name": "Autor", "note": "en una frase, qué tomó de él/ella" } ] }`;
  try {
    const r = await grokJson<ExpandResult>(systemPrompt, userPrompt);
    const insert = db.prepare("INSERT INTO influences (name, parent_id, note) VALUES (?, ?, ?)");
    for (const inf of (r.influencias ?? []).slice(0, 4)) {
      if (inf?.name) insert.run(String(inf.name).trim(), node.id, inf.note ?? null);
    }
    return res.json(db.prepare("SELECT * FROM influences ORDER BY created_at").all());
  } catch (err) {
    return sendGrokError(res, err);
  }
});
