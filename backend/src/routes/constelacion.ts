/**
 * Ruta de CONSTELACIÓN: grafo de conexiones entre libros.
 *
 *  GET /api/constelacion -> { nodes, links }
 *
 * Nodos: cada libro + cada tema (extraído de la columna `themes`).
 * Enlaces: libro ↔ tema (el libro trata ese tema) y libro ↔ libro (mismo autor).
 * Así los libros se agrupan visualmente alrededor de los temas que comparten.
 */
import { Router, type Request, type Response } from "express";
import { db } from "../db.js";

export const constelacionRouter = Router();

export interface GraphNode {
  id: string;
  type: "libro" | "tema";
  label: string;
  bookId?: number;
  /** Nº de conexiones (para dimensionar el nodo). */
  degree: number;
}
export interface GraphLink {
  source: string;
  target: string;
  kind: "tema" | "autor";
}

constelacionRouter.get("/", (_req: Request, res: Response) => {
  const books = db
    .prepare("SELECT id, title, author, themes FROM books")
    .all() as Array<{ id: number; title: string; author: string; themes: string | null }>;

  const nodes = new Map<string, GraphNode>();
  const links: GraphLink[] = [];
  const themeIds = new Map<string, string>(); // tema normalizado -> id de nodo
  const byAuthor = new Map<string, number[]>();

  for (const b of books) {
    const bid = `b${b.id}`;
    nodes.set(bid, { id: bid, type: "libro", label: b.title, bookId: b.id, degree: 0 });

    // Agrupamos por autor (para enlaces libro↔libro).
    const akey = b.author.trim().toLowerCase();
    if (akey) byAuthor.set(akey, [...(byAuthor.get(akey) ?? []), b.id]);

    // Temas: separados por coma.
    const themes = (b.themes ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    for (const t of themes) {
      const key = t.toLowerCase();
      let tid = themeIds.get(key);
      if (!tid) {
        tid = `t${themeIds.size}`;
        themeIds.set(key, tid);
        nodes.set(tid, { id: tid, type: "tema", label: t, degree: 0 });
      }
      links.push({ source: bid, target: tid, kind: "tema" });
      nodes.get(bid)!.degree++;
      nodes.get(tid)!.degree++;
    }
  }

  // Enlaces libro↔libro por mismo autor (encadenados para no saturar).
  for (const ids of byAuthor.values()) {
    if (ids.length < 2) continue;
    for (let i = 0; i < ids.length - 1; i++) {
      links.push({ source: `b${ids[i]}`, target: `b${ids[i + 1]}`, kind: "autor" });
      nodes.get(`b${ids[i]}`)!.degree++;
      nodes.get(`b${ids[i + 1]}`)!.degree++;
    }
  }

  res.json({ nodes: [...nodes.values()], links });
});
