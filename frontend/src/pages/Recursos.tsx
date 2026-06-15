import { useEffect, useMemo, useState } from "react";
import { api, type Resource, type ResourceInput } from "../lib/api";
import { notifyOk, notifyGrokError } from "../lib/notify";

/** Tipos de recurso con su etiqueta e ícono. */
const TYPES: Record<string, { label: string; icon: string }> = {
  video: { label: "Video", icon: "🎬" },
  imagen: { label: "Imagen", icon: "🖼️" },
  url: { label: "URL stock", icon: "🔗" },
  captura: { label: "Captura", icon: "📸" },
};

/**
 * RECURSOS B-ROLL — banco de material visual.
 * Grid con filtros por tipo y mood, agregar/borrar y copiar URL/ruta.
 */
export default function Recursos() {
  const [items, setItems] = useState<Resource[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [fType, setFType] = useState<string>("");
  const [fMood, setFMood] = useState<string>("");

  function load() {
    api.listResources().then(setItems).catch(() => {});
  }
  useEffect(load, []);

  // Moods presentes (para los chips de filtro).
  const moods = useMemo(
    () => Array.from(new Set(items.map((i) => i.mood).filter(Boolean) as string[])).sort(),
    [items]
  );

  const filtered = useMemo(
    () =>
      items.filter((i) => (fType ? i.type === fType : true) && (fMood ? i.mood === fMood : true)),
    [items, fType, fMood]
  );

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      notifyOk("Copiado al portapapeles.");
    } catch {
      notifyGrokError(new Error("No se pudo copiar."));
    }
  }

  async function remove(id: number) {
    if (!confirm("¿Borrar este recurso?")) return;
    try {
      await api.deleteResource(id);
      load();
    } catch (err) {
      notifyGrokError(err);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-4xl text-cream">Recursos B-roll</h1>
          <p className="mt-1 text-muted">Tu banco de material visual: videos, imágenes y enlaces.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-gold">+ Agregar</button>
      </div>

      {/* Filtros */}
      <div className="mb-5 space-y-2">
        <div className="flex flex-wrap gap-2">
          <Chip active={!fType} onClick={() => setFType("")}>Todos</Chip>
          {Object.entries(TYPES).map(([key, t]) => (
            <Chip key={key} active={fType === key} onClick={() => setFType(key)}>
              {t.icon} {t.label}
            </Chip>
          ))}
        </div>
        {moods.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Chip active={!fMood} onClick={() => setFMood("")}>Cualquier mood</Chip>
            {moods.map((m) => (
              <Chip key={m} active={fMood === m} onClick={() => setFMood(m)}>{m}</Chip>
            ))}
          </div>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <p className="text-muted">No hay recursos {items.length > 0 ? "con esos filtros" : "todavía"}.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((r) => (
            <div key={r.id} className="card overflow-hidden">
              {/* Preview */}
              <div className="flex aspect-video items-center justify-center bg-surface">
                {r.type === "imagen" ? (
                  <img src={r.url_or_path} alt={r.title} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-4xl">{TYPES[r.type]?.icon ?? "📄"}</span>
                )}
              </div>
              <div className="p-3">
                <div className="truncate text-sm text-cream">{r.title}</div>
                <div className="mt-0.5 text-xs text-muted">
                  {TYPES[r.type]?.label ?? r.type}
                  {r.mood && <span> · {r.mood}</span>}
                </div>
                {r.tags && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {r.tags.split(",").map((t) => t.trim()).filter(Boolean).map((t) => (
                      <span key={t} className="rounded-full border border-border px-1.5 py-0.5 text-[10px] text-muted">{t}</span>
                    ))}
                  </div>
                )}
                <div className="mt-2 flex gap-2">
                  <button onClick={() => copy(r.url_or_path)} className="btn-ghost !px-2 !py-1 text-xs">Copiar</button>
                  <button onClick={() => remove(r.id)} className="text-xs text-muted hover:text-red-400">Borrar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && <AddResourceModal onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load(); }} />}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-sm transition ${active ? "border-gold text-gold" : "border-border text-muted hover:text-cream"}`}
    >
      {children}
    </button>
  );
}

/* ---------- Modal: agregar recurso ---------- */

function AddResourceModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<ResourceInput>({ type: "video", title: "", url_or_path: "" });

  function set<K extends keyof ResourceInput>(k: K, v: ResourceInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    if (!form.title.trim() || !form.url_or_path.trim()) {
      return notifyGrokError(new Error("Completa título y ubicación/URL."));
    }
    try {
      await api.createResource(form);
      notifyOk("Recurso agregado.");
      onSaved();
    } catch (err) {
      notifyGrokError(err);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 pt-[8vh] backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-2xl text-cream">Nuevo recurso</h2>
        <div className="grid grid-cols-2 gap-3">
          <select className="input" value={form.type} onChange={(e) => set("type", e.target.value)}>
            {Object.entries(TYPES).map(([key, t]) => (
              <option key={key} value={key}>{t.icon} {t.label}</option>
            ))}
          </select>
          <input className="input" placeholder="Mood (ej. melancólico)" value={form.mood ?? ""} onChange={(e) => set("mood", e.target.value)} />
        </div>
        <input className="input mt-3" placeholder="Título" value={form.title} onChange={(e) => set("title", e.target.value)} />
        <input className="input mt-3" placeholder="URL o ruta del archivo" value={form.url_or_path} onChange={(e) => set("url_or_path", e.target.value)} />
        <textarea className="input mt-3 min-h-[70px] resize-y" placeholder="Descripción (opcional)" value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} />
        <input className="input mt-3" placeholder="Tags separados por coma" value={form.tags ?? ""} onChange={(e) => set("tags", e.target.value)} />
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onClose} className="btn-ghost">Cancelar</button>
          <button onClick={save} className="btn-gold">Guardar</button>
        </div>
      </div>
    </div>
  );
}
