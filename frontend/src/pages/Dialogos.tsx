import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, type Author, type SavedDialogue } from "../lib/api";
import { notifyOk, notifyGrokError } from "../lib/notify";

/** Iniciales de un nombre para el avatar (máx. 2 letras). */
function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * DIÁLOGOS CON AUTORES.
 * Grid de autores para iniciar una conversación + lista de chats guardados.
 */
export default function Dialogos() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [saved, setSaved] = useState<SavedDialogue[]>([]);
  const navigate = useNavigate();

  function loadSaved() {
    api.listDialogues().then(setSaved).catch(() => {});
  }
  useEffect(() => {
    api.listAuthors().then(setAuthors).catch(() => {});
    loadSaved();
  }, []);

  async function remove(id: number) {
    if (!confirm("¿Borrar esta conversación?")) return;
    try {
      await api.deleteDialogue(id);
      notifyOk("Conversación borrada.");
      loadSaved();
    } catch (err) {
      notifyGrokError(err);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-4xl text-cream">Diálogos con autores</h1>
        <p className="mt-1 text-muted">Conversa con una mente que ya leíste. Elige con quién.</p>
      </div>

      {/* Grid de autores */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {authors.map((a) => (
          <button
            key={a.id}
            onClick={() => navigate(`/dialogos/nuevo?author=${a.id}`)}
            className="card flex items-center gap-4 p-5 text-left transition hover:border-gold"
          >
            <span
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full font-serif text-xl text-cream"
              style={{ backgroundColor: a.accent }}
            >
              {initials(a.name)}
            </span>
            <span className="min-w-0">
              <span className="block font-serif text-xl text-cream">{a.name}</span>
              <span className="block text-xs uppercase tracking-wide text-muted">{a.era}</span>
              <span className="mt-1 block text-sm text-cream/80">{a.blurb}</span>
            </span>
          </button>
        ))}
      </div>

      {/* Conversaciones guardadas */}
      {saved.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-3 text-2xl text-cream">Conversaciones anteriores</h2>
          <div className="space-y-2">
            {saved.map((d) => (
              <div key={d.id} className="card flex items-center justify-between gap-3 p-4">
                <button onClick={() => navigate(`/dialogos/${d.id}`)} className="min-w-0 flex-1 text-left">
                  <span className="block text-cream">{d.author_name}</span>
                  <span className="block truncate text-sm text-muted">
                    {d.preview || "(sin mensajes)"} · {d.count} mensajes
                  </span>
                </button>
                <button onClick={() => remove(d.id)} className="text-sm text-muted hover:text-red-400">
                  Borrar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
