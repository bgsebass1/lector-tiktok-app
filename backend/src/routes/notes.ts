/**
 * Rutas del BANCO DE IDEAS (notas categorizadas + acciones de IA).
 *
 *  GET    /api/notes[?category=]   -> lista
 *  POST   /api/notes               -> crea {title, content, category}
 *  PUT    /api/notes/:id           -> edita
 *  DELETE /api/notes/:id           -> borra
 *  POST   /api/notes/:id/rate      -> IA califica (nota = promedio de criterios, sin sesgo)
 *  POST   /api/notes/:id/structure -> IA reestructura/desarrolla la idea
 *  POST   /api/notes/:id/research  -> IA sugiere qué investigar
 */
import { Router, type Request, type Response } from "express";
import { db } from "../db.js";
import { grokText, grokJson } from "../services/grok.service.js";
import { sendGrokError } from "./grok.js";

export const notesRouter = Router();

interface NoteRow {
  id: number;
  title: string;
  content: string;
  category: string;
  score: number | null;
  score_reason: string | null;
  score_detail: string | null;
  structured: string | null;
  research: string | null;
  created_at: string;
  updated_at: string | null;
}

const CATEGORY_HINT: Record<string, string> = {
  escrito: "un texto/escrito personal (valora estilo, voz, profundidad y originalidad)",
  video: "una idea para un video corto (valora gancho, claridad del mensaje y potencial de interés)",
  reflexion: "una reflexión o pensamiento (valora profundidad, originalidad y claridad)",
  investigacion: "un tema de investigación (valora relevancia, factibilidad y enfoque)",
  proyecto: "un proyecto o iniciativa (valora factibilidad, impacto y claridad)",
  otro: "una idea general",
};

function getNote(id: string): NoteRow | undefined {
  return db.prepare("SELECT * FROM notes WHERE id = ?").get(id) as NoteRow | undefined;
}

/* ---------- CRUD ---------- */

notesRouter.get("/", (req: Request, res: Response) => {
  const category = req.query.category ? String(req.query.category) : null;
  const sql =
    "SELECT * FROM notes" + (category ? " WHERE category = ?" : "") + " ORDER BY COALESCE(updated_at, created_at) DESC";
  const rows = category ? db.prepare(sql).all(category) : db.prepare(sql).all();
  res.json(rows);
});

notesRouter.post("/", (req: Request, res: Response) => {
  const title = String(req.body?.title ?? "").trim();
  const content = String(req.body?.content ?? "").trim();
  const category = String(req.body?.category ?? "otro").trim() || "otro";
  if (!content && !title) return res.status(400).json({ error: "Escribe al menos un título o contenido." });
  const result = db
    .prepare("INSERT INTO notes (title, content, category, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)")
    .run(title || "Sin título", content, category);
  return res.status(201).json(getNote(String(result.lastInsertRowid)));
});

notesRouter.put("/:id", (req: Request, res: Response) => {
  const n = getNote(req.params.id);
  if (!n) return res.status(404).json({ error: "No encontrada." });
  const { title, content, category } = req.body ?? {};
  db.prepare("UPDATE notes SET title = ?, content = ?, category = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(
    title != null ? String(title).trim() || "Sin título" : n.title,
    content != null ? String(content) : n.content,
    category != null ? String(category) : n.category,
    req.params.id
  );
  return res.json(getNote(req.params.id));
});

notesRouter.delete("/:id", (req: Request, res: Response) => {
  const r = db.prepare("DELETE FROM notes WHERE id = ?").run(req.params.id);
  if (r.changes === 0) return res.status(404).json({ error: "No encontrada." });
  return res.json({ ok: true });
});

/* ---------- IA: calificar (calibrado, sin sesgo) ---------- */

interface RateResult {
  criterios: { originalidad: number; claridad: number; factibilidad: number; potencial: number; profundidad: number };
  veredicto: string;
  fuerte: string;
  mejora: string;
}

notesRouter.post("/:id/rate", async (req: Request, res: Response) => {
  const n = getNote(req.params.id);
  if (!n) return res.status(404).json({ error: "No encontrada." });

  const hint = CATEGORY_HINT[n.category] ?? CATEGORY_HINT.otro;
  const systemPrompt =
    "Eres un evaluador honesto, exigente y CALIBRADO de ideas. No tienes sesgo a la alta. " +
    "La mayoría de las ideas son del montón y deben caer entre 4 y 7. Reserva 9-10 SOLO para ideas " +
    "verdaderamente excepcionales, y usa 1-3 para ideas flojas o vagas. Usa todo el rango, sé específico " +
    "y no regales puntos. Devuelves únicamente JSON válido.";
  const userPrompt = `Evalúa esta idea, que es ${hint}.

TÍTULO: ${n.title}
CONTENIDO: ${n.content || "(sin contenido)"}

Puntúa CADA criterio con un entero del 1 al 10, siendo estricto:
- originalidad (¿es nueva o trillada?)
- claridad (¿se entiende bien?)
- factibilidad (¿se puede llevar a cabo?)
- potencial (¿interesa o impacta?)
- profundidad (¿hay sustancia o es superficial?)

Responde SOLO con este JSON:
{
  "criterios": { "originalidad": n, "claridad": n, "factibilidad": n, "potencial": n, "profundidad": n },
  "veredicto": "una frase honesta y directa",
  "fuerte": "lo más fuerte de la idea",
  "mejora": "qué le falta o cómo mejorarla"
}`;

  try {
    const r = await grokJson<RateResult>(systemPrompt, userPrompt);
    const c = r.criterios;
    const clamp = (x: number) => Math.max(1, Math.min(10, Math.round(Number(x) || 0)));
    const crit = {
      originalidad: clamp(c.originalidad),
      claridad: clamp(c.claridad),
      factibilidad: clamp(c.factibilidad),
      potencial: clamp(c.potencial),
      profundidad: clamp(c.profundidad),
    };
    // La nota global se CALCULA (promedio), no la decide el modelo → sin sesgo a 8/10.
    const vals = Object.values(crit);
    const score = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;

    db.prepare("UPDATE notes SET score = ?, score_reason = ?, score_detail = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(
      score,
      JSON.stringify({ veredicto: r.veredicto, fuerte: r.fuerte, mejora: r.mejora }),
      JSON.stringify(crit),
      req.params.id
    );
    return res.json(getNote(req.params.id));
  } catch (err) {
    return sendGrokError(res, err);
  }
});

/* ---------- IA: estructurar ---------- */

notesRouter.post("/:id/structure", async (req: Request, res: Response) => {
  const n = getNote(req.params.id);
  if (!n) return res.status(404).json({ error: "No encontrada." });
  const systemPrompt =
    "Ayudas a desarrollar ideas en bruto y a darles forma clara y accionable, sin inventar datos.";
  const userPrompt = `Toma esta idea y reestructúrala para que quede más clara y desarrollada.
TÍTULO: ${n.title}
CONTENIDO: ${n.content}

Devuelve en texto plano y conciso:
• Título afinado
• Resumen en una frase
• 3 a 5 puntos clave o pasos
• Un siguiente paso concreto`;
  try {
    const structured = await grokText(systemPrompt, userPrompt);
    db.prepare("UPDATE notes SET structured = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(structured, req.params.id);
    return res.json(getNote(req.params.id));
  } catch (err) {
    return sendGrokError(res, err);
  }
});

/* ---------- IA: qué investigar ---------- */

notesRouter.post("/:id/research", async (req: Request, res: Response) => {
  const n = getNote(req.params.id);
  if (!n) return res.status(404).json({ error: "No encontrada." });
  const systemPrompt =
    "Orientas qué investigar para desarrollar una idea. No inventes datos ni cites fuentes falsas; " +
    "enfócate en QUÉ preguntas responder y POR DÓNDE empezar a buscar.";
  const userPrompt = `Para desarrollar esta idea, ¿qué debería investigar?
TÍTULO: ${n.title}
CONTENIDO: ${n.content}

Devuelve en texto plano:
• 4 a 6 preguntas o líneas de investigación concretas
• 2 a 3 términos de búsqueda o tipos de fuente por dónde empezar`;
  try {
    const research = await grokText(systemPrompt, userPrompt);
    db.prepare("UPDATE notes SET research = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(research, req.params.id);
    return res.json(getNote(req.params.id));
  } catch (err) {
    return sendGrokError(res, err);
  }
});
