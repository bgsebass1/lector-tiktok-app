import { useEffect, useMemo, useState } from "react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { api, type PipelineCard } from "../lib/api";
import { notifyOk, notifyGrokError } from "../lib/notify";

/**
 * CALENDARIO EDITORIAL (Módulo 5).
 * Dos vistas: tablero kanban con drag & drop y calendario mensual.
 */
const COLUMNS = [
  { id: "idea", label: "💡 Idea" },
  { id: "guion", label: "✍️ Guion" },
  { id: "grabar", label: "🎬 Grabar" },
  { id: "editar", label: "✂️ Editar" },
  { id: "publicar", label: "📤 Publicar" },
  { id: "publicado", label: "✅ Publicado" },
];

const CATEGORIES = ["Filosofía", "Literatura", "Lenguaje", "Otro"];
const CAT_COLOR: Record<string, string> = {
  Filosofía: "border-l-purple-400",
  Literatura: "border-l-blue-400",
  Lenguaje: "border-l-green-400",
  Otro: "border-l-muted",
};

export default function Calendario() {
  const [cards, setCards] = useState<PipelineCard[]>([]);
  const [view, setView] = useState<"kanban" | "calendar">("kanban");
  const [showAdd, setShowAdd] = useState(false);

  function load() {
    api.listPipeline().then(setCards).catch(() => {});
  }
  useEffect(load, []);

  /** Al soltar una tarjeta en otra columna, actualizamos su estado. */
  async function onDragEnd(result: DropResult) {
    const { destination, draggableId } = result;
    if (!destination) return;
    const newStatus = destination.droppableId;
    const id = Number(draggableId);
    const card = cards.find((c) => c.id === id);
    if (!card || card.status === newStatus) return;

    // Optimista: actualizamos la UI antes de la respuesta.
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c)));
    try {
      await api.updateCard(id, { status: newStatus });
    } catch (err) {
      notifyGrokError(err);
      load(); // revertir si falla
    }
  }

  async function remove(id: number) {
    await api.deleteCard(id);
    load();
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-4xl text-cream">Calendario editorial</h1>
          <p className="mt-1 text-muted">{cards.length} videos en el pipeline</p>
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-lg border border-border p-1">
            <button onClick={() => setView("kanban")} className={`rounded px-3 py-1 text-sm ${view === "kanban" ? "bg-surface text-gold" : "text-muted"}`}>Kanban</button>
            <button onClick={() => setView("calendar")} className={`rounded px-3 py-1 text-sm ${view === "calendar" ? "bg-surface text-gold" : "text-muted"}`}>Calendario</button>
          </div>
          <button onClick={() => setShowAdd(true)} className="btn-gold">+ Tarjeta</button>
        </div>
      </div>

      {view === "kanban" ? (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {COLUMNS.map((col) => {
              const colCards = cards.filter((c) => c.status === col.id);
              return (
                <Droppable droppableId={col.id} key={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`rounded-xl border border-border p-2 transition ${snapshot.isDraggingOver ? "bg-surface" : "bg-carbon/40"}`}
                    >
                      <p className="mb-2 px-1 text-sm text-cream">
                        {col.label} <span className="font-mono text-xs text-muted">{colCards.length}</span>
                      </p>
                      <div className="space-y-2">
                        {colCards.map((card, i) => (
                          <Draggable draggableId={String(card.id)} index={i} key={card.id}>
                            {(prov, snap) => (
                              <div
                                ref={prov.innerRef}
                                {...prov.draggableProps}
                                {...prov.dragHandleProps}
                                className={`card border-l-4 p-3 ${CAT_COLOR[card.category ?? "Otro"]} ${snap.isDragging ? "opacity-80" : ""}`}
                              >
                                <p className="text-sm text-cream">{card.title}</p>
                                {card.category && <p className="mt-1 text-xs text-muted">{card.category}</p>}
                                {card.scheduled_date && <p className="font-mono text-xs text-gold">📅 {card.scheduled_date}</p>}
                                <button onClick={() => remove(card.id)} className="mt-1 text-xs text-muted hover:text-red-400">borrar</button>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              );
            })}
          </div>
        </DragDropContext>
      ) : (
        <MonthCalendar cards={cards} />
      )}

      {showAdd && <AddCardModal onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load(); }} />}
    </div>
  );
}

/* ---------- Vista de calendario mensual ---------- */

function MonthCalendar({ cards }: { cards: PipelineCard[] }) {
  const [month, setMonth] = useState(() => new Date());

  const { days, label } = useMemo(() => {
    const year = month.getFullYear();
    const m = month.getMonth();
    const first = new Date(year, m, 1);
    const startDay = (first.getDay() + 6) % 7; // lunes = 0
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    const cells: Array<{ date: string | null; day: number | null }> = [];
    for (let i = 0; i < startDay; i++) cells.push({ date: null, day: null });
    for (let d = 1; d <= daysInMonth; d++) {
      const date = `${year}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ date, day: d });
    }
    return { days: cells, label: month.toLocaleDateString("es-CO", { month: "long", year: "numeric" }) };
  }, [month]);

  function shift(delta: number) {
    setMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  }

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => shift(-1)} className="btn-ghost text-sm">←</button>
        <h2 className="font-display text-2xl capitalize text-cream">{label}</h2>
        <button onClick={() => shift(1)} className="btn-ghost text-sm">→</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center font-mono text-xs text-muted">
        {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => <div key={d} className="py-1">{d}</div>)}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {days.map((cell, i) => {
          const dayCards = cell.date ? cards.filter((c) => c.scheduled_date === cell.date) : [];
          return (
            <div key={i} className={`min-h-[90px] rounded-lg border p-1 ${cell.date ? "border-border" : "border-transparent"}`}>
              {cell.day && <p className="font-mono text-xs text-muted">{cell.day}</p>}
              <div className="mt-1 space-y-1">
                {dayCards.map((c) => (
                  <div key={c.id} className={`truncate rounded border-l-2 bg-carbon px-1 py-0.5 text-xs text-cream ${CAT_COLOR[c.category ?? "Otro"]}`} title={c.title}>
                    {c.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Modal: agregar tarjeta ---------- */

function AddCardModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ title: "", category: "Filosofía", status: "idea", scheduled_date: "", notes: "", tags: "" });

  async function save() {
    if (!form.title.trim()) return notifyGrokError(new Error("Falta el título."));
    try {
      await api.createCard(form);
      notifyOk("Tarjeta creada.");
      onSaved();
    } catch (err) {
      notifyGrokError(err);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 pt-[10vh] backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-2xl text-cream">Nueva tarjeta</h2>
        <input className="input" placeholder="Título del video" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {COLUMNS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
        <input className="input mt-3" type="date" value={form.scheduled_date} onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })} />
        <input className="input mt-3" placeholder="Tags" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
        <textarea className="input mt-3 min-h-[80px] resize-y" placeholder="Notas" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onClose} className="btn-ghost">Cancelar</button>
          <button onClick={save} className="btn-gold">Crear</button>
        </div>
      </div>
    </div>
  );
}
