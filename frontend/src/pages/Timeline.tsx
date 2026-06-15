import { useEffect, useState } from "react";
import { api, type TimelineData, type TimelineEventInput } from "../lib/api";
import { notifyOk, notifyGrokError } from "../lib/notify";

/** Ícono por tipo de entrada. */
const KIND_ICON: Record<string, string> = {
  libro: "📖",
  evento: "⏳",
  autor: "✍️",
  idea: "💡",
  hito: "⭐",
};

/**
 * TIMELINE INTELECTUAL.
 * Tus libros ubicados por año de publicación + eventos históricos propios,
 * en una línea de tiempo vertical navegable.
 */
export default function Timeline() {
  const [data, setData] = useState<TimelineData | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  function load() {
    api.getTimeline().then(setData).catch(() => {});
  }
  useEffect(load, []);

  async function removeEvent(id: number) {
    if (!confirm("¿Borrar este evento?")) return;
    try {
      await api.deleteTimelineEvent(id);
      load();
    } catch (err) {
      notifyGrokError(err);
    }
  }

  const entries = data?.entries ?? [];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-4xl text-cream">Timeline intelectual</h1>
          <p className="mt-1 text-muted">La historia de las ideas que has recorrido, en orden.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-gold">+ Evento</button>
      </div>

      {entries.length === 0 ? (
        <p className="text-muted">
          Aún no hay nada con fecha. Agrega libros con su año de publicación, o crea un evento histórico.
        </p>
      ) : (
        <div className="relative border-l border-border pl-6">
          {entries.map((e) => (
            <div key={`${e.isEvent ? "e" : "b"}-${e.id}-${e.year}`} className="relative mb-6">
              <span className="absolute -left-[31px] top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-gold" />
              <div className="font-mono text-sm text-gold">{e.year}</div>
              <div className="card mt-1 flex items-start gap-3 p-3">
                {e.cover ? (
                  <img src={e.cover} alt="" className="h-16 w-11 shrink-0 rounded object-cover" />
                ) : (
                  <span className="text-2xl">{KIND_ICON[e.kind] ?? "•"}</span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-cream">{e.title}</div>
                  {e.subtitle && <div className="mt-0.5 text-sm text-muted">{e.subtitle}</div>}
                  {!e.isEvent && (
                    <span className="mt-1 inline-block text-xs uppercase tracking-wide text-muted">Libro</span>
                  )}
                </div>
                {e.isEvent && (
                  <button onClick={() => removeEvent(e.id)} className="shrink-0 text-xs text-muted hover:text-red-400">
                    Borrar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Libros sin año */}
      {data && data.undated.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-3 text-xl text-cream">Sin fecha</h2>
          <p className="mb-3 text-sm text-muted">
            Estos libros no tienen año de publicación; edítalos en Libros para ubicarlos en la línea.
          </p>
          <div className="flex flex-wrap gap-2">
            {data.undated.map((b) => (
              <span key={b.id} className="rounded-full border border-border px-3 py-1 text-sm text-muted">
                {b.title}
              </span>
            ))}
          </div>
        </div>
      )}

      {showAdd && <AddEventModal onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load(); }} />}
    </div>
  );
}

/* ---------- Modal: agregar evento ---------- */

function AddEventModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<TimelineEventInput>({ year: new Date().getFullYear(), title: "", kind: "evento" });

  async function save() {
    if (!form.title.trim() || !Number.isFinite(Number(form.year))) {
      return notifyGrokError(new Error("Completa año y título."));
    }
    try {
      await api.addTimelineEvent({ ...form, year: Number(form.year) });
      notifyOk("Evento agregado.");
      onSaved();
    } catch (err) {
      notifyGrokError(err);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 pt-[10vh] backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-2xl text-cream">Nuevo evento</h2>
        <div className="grid grid-cols-2 gap-3">
          <input
            className="input"
            type="number"
            placeholder="Año (ej. 1789, -380)"
            value={form.year}
            onChange={(e) => setForm((f) => ({ ...f, year: Number(e.target.value) }))}
          />
          <select className="input" value={form.kind} onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value }))}>
            <option value="evento">⏳ Evento</option>
            <option value="autor">✍️ Autor</option>
            <option value="idea">💡 Idea</option>
            <option value="hito">⭐ Hito</option>
          </select>
        </div>
        <input
          className="input mt-3"
          placeholder="Título (ej. Revolución Francesa)"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        />
        <textarea
          className="input mt-3 min-h-[70px] resize-y"
          placeholder="Descripción (opcional)"
          value={form.description ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onClose} className="btn-ghost">Cancelar</button>
          <button onClick={save} className="btn-gold">Guardar</button>
        </div>
      </div>
    </div>
  );
}
