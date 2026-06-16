import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, type WishItem, type BookRecommendation } from "../lib/api";
import { notifyOk, notifyGrokError } from "../lib/notify";

/**
 * QUIERO LEER — lista de deseos (TBR) dinámica.
 * - Sugerencias con IA basadas en tu biblioteca.
 * - Portada automática (Open Library).
 * - Prioridad reordenable.
 * - "Empezar a leer" mueve el libro a tu biblioteca.
 */
export default function QuieroLeer() {
  const [items, setItems] = useState<WishItem[]>([]);
  const [suggestions, setSuggestions] = useState<BookRecommendation[]>([]);
  const [loadingSugg, setLoadingSugg] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);
  const navigate = useNavigate();

  function load() {
    api.listWishlist().then(setItems).catch(() => {});
  }
  useEffect(load, []);

  async function suggest() {
    setLoadingSugg(true);
    setSuggestions([]);
    try {
      const recs = await api.recommendBooks();
      // Filtramos lo que ya está en la lista.
      const have = new Set(items.map((i) => i.title.toLowerCase()));
      setSuggestions(recs.filter((r) => !have.has(r.title.toLowerCase())));
    } catch (err) {
      notifyGrokError(err);
    } finally {
      setLoadingSugg(false);
    }
  }

  async function addFromSuggestion(r: BookRecommendation) {
    try {
      await api.addWish({ title: r.title, author: r.author, reason: r.reason, source: "ia" });
      setSuggestions((s) => s.filter((x) => x.title !== r.title));
      notifyOk(`“${r.title}” añadido a tu lista.`);
      load();
    } catch (err) {
      notifyGrokError(err);
    }
  }

  async function move(id: number, dir: "up" | "down") {
    setBusy(id);
    try {
      await api.moveWish(id, dir);
      load();
    } finally {
      setBusy(null);
    }
  }

  async function promote(item: WishItem) {
    if (!confirm(`¿Mover “${item.title}” a tu biblioteca y empezar a leerlo?`)) return;
    try {
      const book = await api.promoteWish(item.id);
      notifyOk(`“${item.title}” está ahora en tu biblioteca.`);
      load();
      navigate(`/leer/${book.id}`);
    } catch (err) {
      notifyGrokError(err);
    }
  }

  async function remove(id: number) {
    try {
      await api.deleteWish(id);
      load();
    } catch (err) {
      notifyGrokError(err);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-4xl text-cream">Quiero leer</h1>
          <p className="mt-1 text-muted">Tu próxima lectura, ordenada por lo que más te llama.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={suggest} disabled={loadingSugg} className="btn-ghost">
            {loadingSugg ? "Pensando…" : "✨ Sugerir con IA"}
          </button>
          <button onClick={() => setShowAdd(true)} className="btn-gold">+ Añadir</button>
        </div>
      </div>

      {/* Sugerencias de IA */}
      {suggestions.length > 0 && (
        <div className="mb-8 rounded-xl border border-gold/40 bg-gold/5 p-4">
          <h2 className="mb-3 text-lg text-gold">✨ Sugerencias para ti</h2>
          <div className="space-y-2">
            {suggestions.map((r) => (
              <div key={r.title} className="flex items-start justify-between gap-3 rounded-lg bg-surface/60 p-3">
                <div className="min-w-0">
                  <div className="font-serif text-cream">{r.title}</div>
                  <div className="text-sm text-muted">{r.author}</div>
                  <div className="mt-1 text-sm text-cream/80">{r.reason}</div>
                </div>
                <button onClick={() => addFromSuggestion(r)} className="btn-gold shrink-0 !px-3 !py-1.5 text-sm">
                  + Añadir
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista */}
      {items.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-muted">Tu lista está vacía.</p>
          <p className="mt-1 text-sm text-muted">Añade un libro a mano o pide sugerencias con IA ✨</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((w, i) => (
            <div key={w.id} className="card flex items-center gap-4 p-3">
              {/* Orden */}
              <div className="flex flex-col">
                <button onClick={() => move(w.id, "up")} disabled={i === 0 || busy === w.id} className="px-1 text-muted hover:text-gold disabled:opacity-20">▲</button>
                <button onClick={() => move(w.id, "down")} disabled={i === items.length - 1 || busy === w.id} className="px-1 text-muted hover:text-gold disabled:opacity-20">▼</button>
              </div>

              {/* Portada */}
              <div className="flex h-20 w-14 shrink-0 items-center justify-center overflow-hidden rounded bg-surface">
                {w.cover_url ? (
                  <img src={w.cover_url} alt={w.title} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl">📖</span>
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="truncate font-serif text-lg text-cream">{w.title}</div>
                <div className="truncate text-sm text-muted">{w.author}</div>
                {w.reason && <div className="mt-0.5 line-clamp-2 text-sm text-cream/70">{w.reason}</div>}
                {w.source === "ia" && <span className="mt-1 inline-block text-xs text-gold">✨ sugerido por IA</span>}
              </div>

              {/* Acciones */}
              <div className="flex shrink-0 flex-col items-end gap-2">
                <button onClick={() => promote(w)} className="btn-gold !px-3 !py-1.5 text-sm">📖 Empezar</button>
                <button onClick={() => remove(w.id)} className="text-xs text-muted hover:text-red-400">Quitar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && <AddModal onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load(); }} />}
    </div>
  );
}

/* ---------- Modal: añadir a mano ---------- */

function AddModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!title.trim() || !author.trim()) return notifyGrokError(new Error("Título y autor son obligatorios."));
    setSaving(true);
    try {
      await api.addWish({ title: title.trim(), author: author.trim(), reason: reason.trim() || undefined, source: "manual" });
      notifyOk("Añadido a tu lista.");
      onSaved();
    } catch (err) {
      notifyGrokError(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 pt-[12vh] backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl text-cream">Añadir a “Quiero leer”</h2>
        <p className="mt-1 text-sm text-muted">La portada se busca sola.</p>
        <input className="input mt-4" placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className="input mt-3" placeholder="Autor" value={author} onChange={(e) => setAuthor(e.target.value)} />
        <textarea className="input mt-3 min-h-[70px] resize-y" placeholder="¿Por qué lo quieres leer? (opcional)" value={reason} onChange={(e) => setReason(e.target.value)} />
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onClose} className="btn-ghost">Cancelar</button>
          <button onClick={save} disabled={saving} className="btn-gold">{saving ? "Guardando…" : "Añadir"}</button>
        </div>
      </div>
    </div>
  );
}
