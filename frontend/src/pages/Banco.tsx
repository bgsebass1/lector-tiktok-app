import { useEffect, useState } from "react";
import { api, type Note } from "../lib/api";
import { notifyOk, notifyError, notifyGrokError } from "../lib/notify";

/** Categorías con su color (fijos, para distinguir de un vistazo). */
export const CATS: Record<string, { label: string; dot: string; text: string; border: string; chip: string }> = {
  escrito: { label: "Escrito", dot: "bg-violet-400", text: "text-violet-300", border: "border-l-violet-400", chip: "border-violet-400/50 text-violet-300" },
  video: { label: "Idea de video", dot: "bg-rose-400", text: "text-rose-300", border: "border-l-rose-400", chip: "border-rose-400/50 text-rose-300" },
  reflexion: { label: "Reflexión", dot: "bg-amber-400", text: "text-amber-300", border: "border-l-amber-400", chip: "border-amber-400/50 text-amber-300" },
  investigacion: { label: "Investigación", dot: "bg-sky-400", text: "text-sky-300", border: "border-l-sky-400", chip: "border-sky-400/50 text-sky-300" },
  proyecto: { label: "Proyecto", dot: "bg-emerald-400", text: "text-emerald-300", border: "border-l-emerald-400", chip: "border-emerald-400/50 text-emerald-300" },
  otro: { label: "Otro", dot: "bg-zinc-400", text: "text-zinc-300", border: "border-l-zinc-400", chip: "border-zinc-400/50 text-zinc-300" },
};
const CAT_KEYS = Object.keys(CATS);

function scoreColor(s: number): string {
  if (s >= 8) return "text-emerald-400";
  if (s >= 6) return "text-amber-400";
  if (s >= 4) return "text-orange-400";
  return "text-rose-400";
}

/**
 * BANCO DE IDEAS — captura ideas, las categoriza por color y usa la IA para
 * calificarlas (calibrado, sin sesgo), estructurarlas o sugerir qué investigar.
 */
export default function Banco() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [filter, setFilter] = useState<string | null>(null);
  const [editing, setEditing] = useState<Note | "new" | null>(null);

  function load() {
    api.listNotes().then(setNotes).catch(() => {});
  }
  useEffect(load, []);

  const shown = filter ? notes.filter((n) => n.category === filter) : notes;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-4xl text-cream">Banco de ideas</h1>
          <p className="mt-1 text-muted">Suelta cualquier idea. Categorízala y deja que la IA te ayude a pulirla.</p>
        </div>
        <button onClick={() => setEditing("new")} className="btn-gold">+ Nueva idea</button>
      </div>

      {/* Filtros por categoría */}
      <div className="mb-5 flex flex-wrap gap-2">
        <button onClick={() => setFilter(null)} className={`rounded-full border px-3 py-1 text-sm ${filter === null ? "border-gold text-gold" : "border-border text-muted"}`}>
          Todas
        </button>
        {CAT_KEYS.map((k) => (
          <button key={k} onClick={() => setFilter(k)} className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm ${filter === k ? CATS[k].chip : "border-border text-muted"}`}>
            <span className={`h-2 w-2 rounded-full ${CATS[k].dot}`} /> {CATS[k].label}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="card p-8 text-center text-muted">
          {notes.length === 0 ? "Aún no hay ideas. Crea la primera." : "No hay ideas en esta categoría."}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((n) => {
            const c = CATS[n.category] ?? CATS.otro;
            return (
              <button
                key={n.id}
                onClick={() => setEditing(n)}
                className={`card border-l-4 p-4 text-left transition hover:border-gold ${c.border}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`flex items-center gap-1.5 text-xs ${c.text}`}>
                    <span className={`h-2 w-2 rounded-full ${c.dot}`} /> {c.label}
                  </span>
                  {n.score != null && <span className={`font-mono text-sm ${scoreColor(n.score)}`}>★ {n.score}</span>}
                </div>
                <div className="mt-2 truncate font-serif text-lg text-cream">{n.title}</div>
                <div className="mt-1 line-clamp-2 text-sm text-muted">{n.content || "(sin contenido)"}</div>
              </button>
            );
          })}
        </div>
      )}

      {editing && (
        <NoteModal
          note={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onChange={load}
        />
      )}
    </div>
  );
}

/* ---------------- Modal: editor + asistente IA ---------------- */

function NoteModal({ note, onClose, onChange }: { note: Note | null; onClose: () => void; onChange: () => void }) {
  const [id, setId] = useState<number | null>(note?.id ?? null);
  const [title, setTitle] = useState(note?.title ?? "");
  const [content, setContent] = useState(note?.content ?? "");
  const [category, setCategory] = useState(note?.category ?? "escrito");
  const [data, setData] = useState<Note | null>(note);
  const [busy, setBusy] = useState<string | null>(null);

  const c = CATS[category] ?? CATS.otro;

  async function create(): Promise<number> {
    const created = await api.createNote({ title: title || "Sin título", content, category });
    setId(created.id);
    setData(created);
    onChange();
    return created.id;
  }

  async function ensureSaved(): Promise<number | null> {
    if (!title.trim() && !content.trim()) {
      notifyError(new Error("Escribe algo antes de guardar."));
      return null;
    }
    if (!id) return create();
    try {
      const u = await api.updateNote(id, { title, content, category });
      setData(u);
      onChange();
      return id;
    } catch (e) {
      // Si la nota fue borrada en otro lado, la recreamos para no perder el texto.
      if (e instanceof Error && /no encontrada|404/i.test(e.message)) return create();
      throw e;
    }
  }

  async function save() {
    setBusy("save");
    try {
      const nid = await ensureSaved();
      if (nid) notifyOk("Guardado.");
    } catch (e) {
      notifyError(e);
    } finally {
      setBusy(null);
    }
  }

  async function runAI(kind: "rate" | "structure" | "research") {
    setBusy(kind);
    try {
      const nid = await ensureSaved();
      if (!nid) return;
      const fn = kind === "rate" ? api.rateNote : kind === "structure" ? api.structureNote : api.researchNote;
      const updated = await fn(nid);
      setData(updated);
      onChange();
    } catch (e) {
      notifyGrokError(e);
    } finally {
      setBusy(null);
    }
  }

  const rating = data?.score != null ? parseRating(data) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 pt-[6vh] backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl text-cream">{id ? "Idea" : "Nueva idea"}</h2>
          <button onClick={onClose} className="text-muted hover:text-cream">✕</button>
        </div>

        {/* Categoría */}
        <div className="mb-3 flex flex-wrap gap-2">
          {CAT_KEYS.map((k) => (
            <button key={k} onClick={() => setCategory(k)} className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm ${category === k ? CATS[k].chip : "border-border text-muted"}`}>
              <span className={`h-2 w-2 rounded-full ${CATS[k].dot}`} /> {CATS[k].label}
            </button>
          ))}
        </div>

        <input
          className={`w-full border-l-4 bg-transparent px-3 py-2 font-display text-2xl text-cream placeholder:text-muted focus:outline-none ${c.border}`}
          placeholder="Título"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        {/* Hoja de cuaderno: renglones + serif para leer/escribir bonito. */}
        <textarea
          className="mt-2 block w-full min-h-[300px] resize-y rounded-lg border border-border px-4 font-serif text-lg text-cream placeholder:text-muted focus:border-gold focus:outline-none"
          style={{
            lineHeight: "32px",
            paddingTop: "6px",
            paddingBottom: "8px",
            backgroundColor: "rgb(var(--surface))",
            backgroundImage:
              "repeating-linear-gradient(transparent, transparent 31px, rgb(var(--border) / 0.6) 31px, rgb(var(--border) / 0.6) 32px)",
            backgroundAttachment: "local",
          }}
          placeholder="Escribe tu idea con todo el detalle que quieras…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={save} disabled={!!busy} className="btn-gold">{busy === "save" ? "Guardando…" : "Guardar"}</button>
          {id && (
            <button onClick={async () => { try { await api.deleteNote(id); } catch { /* ya no existe */ } onChange(); onClose(); }} className="btn-ghost text-rose-300">Borrar</button>
          )}
        </div>

        {/* Asistente IA */}
        <div className="mt-6 border-t border-border pt-4">
          <h3 className="mb-2 text-sm uppercase tracking-wide text-muted">Asistente IA</h3>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => runAI("rate")} disabled={!!busy} className="btn-ghost">
              {busy === "rate" ? "Calificando…" : "⭐ Calificar"}
            </button>
            <button onClick={() => runAI("structure")} disabled={!!busy} className="btn-ghost">
              {busy === "structure" ? "Estructurando…" : "🧱 Estructurar"}
            </button>
            <button onClick={() => runAI("research")} disabled={!!busy} className="btn-ghost">
              {busy === "research" ? "Buscando…" : "🔎 Qué investigar"}
            </button>
          </div>

          {/* Calificación */}
          {rating && (
            <div className="mt-4 rounded-lg border border-border bg-carbon p-4">
              <div className="flex items-baseline gap-2">
                <span className={`font-mono text-3xl ${scoreColor(rating.score)}`}>{rating.score}</span>
                <span className="text-muted">/ 10</span>
              </div>
              {rating.veredicto && <p className="mt-1 text-sm text-cream/90">{rating.veredicto}</p>}
              <div className="mt-3 space-y-1.5">
                {rating.criteria.map((cr) => (
                  <div key={cr.label} className="flex items-center gap-2 text-xs">
                    <span className="w-24 text-muted">{cr.label}</span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface">
                      <span className="block h-full rounded-full bg-gold" style={{ width: `${cr.value * 10}%` }} />
                    </span>
                    <span className="w-5 text-right font-mono text-cream">{cr.value}</span>
                  </div>
                ))}
              </div>
              {rating.fuerte && <p className="mt-3 text-sm text-emerald-300">✓ {rating.fuerte}</p>}
              {rating.mejora && <p className="mt-1 text-sm text-amber-300">→ {rating.mejora}</p>}
            </div>
          )}

          {data?.structured && (
            <Result title="🧱 Estructurada" text={data.structured} />
          )}
          {data?.research && (
            <Result title="🔎 Qué investigar" text={data.research} />
          )}
        </div>
      </div>
    </div>
  );
}

function Result({ title, text }: { title: string; text: string }) {
  return (
    <div className="mt-4 rounded-lg border border-border bg-carbon p-4">
      <div className="mb-1 text-sm text-gold">{title}</div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-cream/90">{text}</p>
    </div>
  );
}

/** Parsea los JSON guardados de la calificación. */
function parseRating(n: Note) {
  const reason = safeParse(n.score_reason) as { veredicto?: string; fuerte?: string; mejora?: string } | null;
  const detail = safeParse(n.score_detail) as Record<string, number> | null;
  const labels: Record<string, string> = {
    originalidad: "Originalidad",
    claridad: "Claridad",
    factibilidad: "Factibilidad",
    potencial: "Potencial",
    profundidad: "Profundidad",
  };
  const criteria = detail
    ? Object.entries(detail).map(([k, v]) => ({ label: labels[k] ?? k, value: v }))
    : [];
  return {
    score: n.score as number,
    veredicto: reason?.veredicto ?? "",
    fuerte: reason?.fuerte ?? "",
    mejora: reason?.mejora ?? "",
    criteria,
  };
}

function safeParse(s: string | null): unknown {
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
