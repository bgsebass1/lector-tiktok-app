/**
 * Rutas de DIÁLOGOS CON AUTORES.
 *
 *  GET    /api/dialogues/authors  -> lista de autores disponibles (campos públicos)
 *  POST   /api/dialogues/reply    -> Grok responde como el autor (no guarda)
 *  GET    /api/dialogues          -> conversaciones guardadas (resumen)
 *  POST   /api/dialogues          -> guarda una conversación nueva
 *  GET    /api/dialogues/:id      -> una conversación completa
 *  PUT    /api/dialogues/:id      -> actualiza los mensajes de una conversación
 *  DELETE /api/dialogues/:id      -> borra una conversación
 */
import { Router, type Request, type Response } from "express";
import { db } from "../db.js";
import { publicAuthors, getAuthor } from "../data/authors.js";
import { dialogueWithAuthor, type DialogueMessage } from "../services/content.service.js";
import { grokText } from "../services/grok.service.js";
import { sendGrokError } from "./grok.js";

export const dialoguesRouter = Router();

interface DialogueRow {
  id: number;
  author_id: string;
  author_name: string;
  messages: string; // JSON
  created_at: string;
  updated_at: string | null;
}

function safeMsgs(raw: string | null): DialogueMessage[] {
  try {
    const v = JSON.parse(raw ?? "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

/** GET /api/dialogues/authors */
dialoguesRouter.get("/authors", (_req: Request, res: Response) => {
  res.json(publicAuthors());
});

/** POST /api/dialogues/reply { authorId, history, message } */
dialoguesRouter.post("/reply", async (req: Request, res: Response) => {
  const { authorId, history, message } = req.body ?? {};
  const author = getAuthor(String(authorId ?? ""));
  if (!author) return res.status(400).json({ error: "Autor desconocido." });
  if (!String(message ?? "").trim()) return res.status(400).json({ error: "Escribe un mensaje." });
  try {
    const reply = await dialogueWithAuthor({
      systemPrompt: author.systemPrompt,
      history: Array.isArray(history) ? history : [],
      message: String(message),
    });
    return res.json({ reply });
  } catch (err) {
    return sendGrokError(res, err);
  }
});

/** POST /api/dialogues/cross — conversación cruzada entre dos autores (G9). */
dialoguesRouter.post("/cross", async (req: Request, res: Response) => {
  const { aId, bId, topic, transcript, speaker } = req.body ?? {};
  const a = getAuthor(String(aId ?? ""));
  const b = getAuthor(String(bId ?? ""));
  if (!a || !b) return res.status(400).json({ error: "Autores desconocidos." });

  const who = speaker === "b" ? b : a;
  const other = speaker === "b" ? a : b;
  const systemPrompt =
    who.systemPrompt +
    ` Estás en una conversación con ${other.name} sobre el tema: "${String(topic ?? "")}". ` +
    `Respondes SOLO como ${who.name}, reaccionando a lo último que se dijo, en 2-4 frases, sin narrar acotaciones.`;
  const userPrompt = `Conversación hasta ahora:\n${String(transcript ?? "").trim() || "(eres el primero en hablar)"}\n\nResponde como ${who.name}:`;
  try {
    const reply = await grokText(systemPrompt, userPrompt);
    return res.json({ reply });
  } catch (err) {
    return sendGrokError(res, err);
  }
});

/** GET /api/dialogues — resumen de conversaciones guardadas. */
dialoguesRouter.get("/", (_req: Request, res: Response) => {
  const rows = db
    .prepare("SELECT * FROM dialogues ORDER BY COALESCE(updated_at, created_at) DESC")
    .all() as DialogueRow[];
  res.json(
    rows.map((r) => {
      const msgs = safeMsgs(r.messages);
      return {
        id: r.id,
        author_id: r.author_id,
        author_name: r.author_name,
        created_at: r.created_at,
        count: msgs.length,
        preview: msgs.find((m) => m.role === "user")?.content ?? "",
      };
    })
  );
});

/** POST /api/dialogues — guarda una conversación. */
dialoguesRouter.post("/", (req: Request, res: Response) => {
  const { authorId, authorName, messages } = req.body ?? {};
  if (!authorId || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Faltan authorId o messages." });
  }
  const result = db
    .prepare(
      "INSERT INTO dialogues (author_id, author_name, messages, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)"
    )
    .run(authorId, authorName ?? "", JSON.stringify(messages));
  return res.status(201).json({ id: result.lastInsertRowid });
});

/** GET /api/dialogues/:id — conversación completa. */
dialoguesRouter.get("/:id", (req: Request, res: Response) => {
  const row = db.prepare("SELECT * FROM dialogues WHERE id = ?").get(req.params.id) as
    | DialogueRow
    | undefined;
  if (!row) return res.status(404).json({ error: "Conversación no encontrada." });
  return res.json({ ...row, messages: safeMsgs(row.messages) });
});

/** PUT /api/dialogues/:id — actualiza los mensajes. */
dialoguesRouter.put("/:id", (req: Request, res: Response) => {
  const { messages } = req.body ?? {};
  const result = db
    .prepare("UPDATE dialogues SET messages = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .run(JSON.stringify(messages ?? []), req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Conversación no encontrada." });
  return res.json({ ok: true });
});

/** DELETE /api/dialogues/:id */
dialoguesRouter.delete("/:id", (req: Request, res: Response) => {
  const result = db.prepare("DELETE FROM dialogues WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Conversación no encontrada." });
  return res.json({ ok: true });
});
