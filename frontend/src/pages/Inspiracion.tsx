import { useEffect, useMemo, useState } from "react";
import { api, type InspirationItem } from "../lib/api";
import { notifyOk, notifyGrokError } from "../lib/notify";
import GrokLoading from "../components/GrokLoading";

/**
 * BANCO DE INSPIRACIÓN (Módulo 7). Tipo Pinterest personal.
 * Guardas URLs, textos o capturas; "Inspírame con esto" pide a Grok 5 ideas.
 */
const TYPE_ICON: Record<string, string> = { url: "🔗", texto: "📝", imagen: "🖼️" };

export default function Inspiracion() {
  const [items, setItems] = useState<InspirationItem[]>([]);
  const [filterType, setFilterType] = useState<string>("");
  const [showAdd, setShowAdd] = useState(false);
  const [ideas, setIdeas] = useState<{ item: InspirationItem; list: Array<{ titulo: string; conexion: string }> } | null>(null);
  const [loadingIdeas, setLoadingIdeas] = useState(false);

  function load() {
    api.listInspiration().then(setItems).catch(() => {});
  }
  useEffect(load, []);

  const filtered = useMemo(
    () => (filterType ? items.filter((i) => i.type === filterType) : items),
    [items, filterType]
  );

  async function inspire(item: InspirationItem) {
    setIdeas(null);
    setLoadingIdeas(true);
    try {
      const { ideas: list } = await api.inspireFrom(item.id);
      setIdeas({ item, list });
    } catch (err) {
      notifyGrokError(err, () => inspire(item));
    } finally {
      setLoadingIdeas(false);
    }
  }

  async function remove(id: number) {
    await api.deleteInspiration(id);
    load();
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-4xl text-cream">Inspiración</h1>
          <p className="mt-1 text-muted">Tu muro de referencias.</p>
        </div>
        <div className="flex gap-2">
          <select className="input w-40" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="">Todos</option>
            <option value="url">🔗 URLs</option>
            <option value="texto">📝 Textos</option>
            <option value="imagen">🖼️ Imágenes</option>
          </select>
          <button onClick={() => setShowAdd(true)} className="btn-gold">+ Guardar</button>
        </div>
      </div>

      {/* Masonry con CSS columns */}
      {filtered.length === 0 ? (
        <p className="text-muted">Nada guardado todavía.</p>
      ) : (
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
          {filtered.map((item) => (
            <div key={item.id} className="card mb-4 break-inside-avoid p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide text-muted">{TYPE_ICON[item.type]} {item.type}</span>
                <button onClick={() => remove(item.id)} className="text-muted hover:text-red-400">✕</button>
              </div>

              {item.type === "imagen" ? (
                <img src={item.content} alt="" className="w-full rounded-lg" />
              ) : item.type === "url" ? (
                <a href={item.content} target="_blank" rel="noreferrer" className="break-all text-sm text-gold hover:underline">
                  {item.content}
                </a>
              ) : (
                <p className="text-sm text-cream/90">{item.content}</p>
              )}

              {item.description && <p className="mt-2 text-sm text-muted">{item.description}</p>}
              {item.tags && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {item.tags.split(",").map((t) => t.trim()).filter(Boolean).map((t) => (
                    <span key={t} className="rounded-full border border-border px-2 py-0.5 text-xs text-muted">{t}</span>
                  ))}
                </div>
              )}
              <button onClick={() => inspire(item)} className="btn-ghost mt-3 w-full text-xs">✨ Inspírame con esto</button>
            </div>
          ))}
        </div>
      )}

      {showAdd && <AddInspModal onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load(); }} />}

      {(loadingIdeas || ideas) && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm" onClick={() => setIdeas(null)}>
          <div className="card my-8 w-full max-w-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl text-cream">Ideas inspiradas</h2>
            {loadingIdeas ? <GrokLoading /> : (
              <div className="mt-4 space-y-3">
                {ideas?.list.map((idea, i) => (
                  <div key={i} className="card p-4">
                    <p className="font-serif text-lg text-gold">{idea.titulo}</p>
                    <p className="mt-1 text-sm text-cream/90">{idea.conexion}</p>
                  </div>
                ))}
                <button onClick={() => setIdeas(null)} className="btn-ghost">Cerrar</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Modal: guardar inspiración ---------- */

function AddInspModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ type: "url", content: "", description: "", tags: "" });

  async function save() {
    if (!form.content.trim()) return notifyGrokError(new Error("Falta el contenido."));
    try {
      await api.createInspiration(form);
      notifyOk("Guardado.");
      onSaved();
    } catch (err) {
      notifyGrokError(err);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 pt-[10vh] backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-2xl text-cream">Guardar inspiración</h2>
        <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          <option value="url">🔗 URL (TikTok, tweet, artículo)</option>
          <option value="texto">📝 Texto suelto</option>
          <option value="imagen">🖼️ Imagen (URL de la imagen)</option>
        </select>
        <textarea className="input mt-3 min-h-[90px] resize-y" placeholder={form.type === "texto" ? "Escribe el texto…" : "Pega la URL…"} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
        <input className="input mt-3" placeholder="Descripción (opcional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input className="input mt-3" placeholder="Tags" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onClose} className="btn-ghost">Cancelar</button>
          <button onClick={save} className="btn-gold">Guardar</button>
        </div>
      </div>
    </div>
  );
}
