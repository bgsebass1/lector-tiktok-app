import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, type WritingSummary } from "../lib/api";
import { notifyGrokError } from "../lib/notify";

/**
 * ESCRIBIR — lista de textos.
 * "Nuevo texto" crea uno vacío y abre el editor.
 */
export default function Escribir() {
  const [items, setItems] = useState<WritingSummary[]>([]);
  const navigate = useNavigate();

  function load() {
    api.listWritings().then(setItems).catch(() => {});
  }
  useEffect(load, []);

  async function create() {
    try {
      const w = await api.createWriting();
      navigate(`/escribir/${w.id}`);
    } catch (err) {
      notifyGrokError(err);
    }
  }

  async function remove(id: number) {
    if (!confirm("¿Borrar este texto?")) return;
    try {
      await api.deleteWriting(id);
      load();
    } catch (err) {
      notifyGrokError(err);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-4xl text-cream">Escribir</h1>
          <p className="mt-1 text-muted">Un espacio en blanco para pensar con las manos.</p>
        </div>
        <button onClick={create} className="btn-gold">+ Nuevo texto</button>
      </div>

      {items.length === 0 ? (
        <p className="text-muted">Aún no has escrito nada. Empieza un texto nuevo.</p>
      ) : (
        <div className="space-y-2">
          {items.map((w) => (
            <div key={w.id} className="card flex items-center justify-between gap-3 p-4">
              <button onClick={() => navigate(`/escribir/${w.id}`)} className="min-w-0 flex-1 text-left">
                <div className="truncate font-serif text-lg text-cream">{w.title}</div>
                <div className="truncate text-sm text-muted">{w.snippet || "(vacío)"}</div>
                <div className="mt-0.5 text-xs text-muted">{(w.updated_at ?? w.created_at).slice(0, 10)}</div>
              </button>
              <button onClick={() => remove(w.id)} className="shrink-0 text-sm text-muted hover:text-red-400">
                Borrar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
