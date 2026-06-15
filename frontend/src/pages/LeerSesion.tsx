import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, type Book, type ReadingSession, type Highlight } from "../lib/api";
import { notifyOk, notifyGrokError } from "../lib/notify";
import { fmtMin } from "./Leer";

/** Formatea segundos como mm:ss. */
function clock(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

/**
 * SESIÓN DE LECTURA de un libro: cronómetro + guardar sesión + highlights.
 */
export default function LeerSesion() {
  const { bookId } = useParams();
  const id = Number(bookId);
  const navigate = useNavigate();

  const [book, setBook] = useState<Book | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState<ReadingSession[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [showSave, setShowSave] = useState(false);
  const intervalRef = useRef<number | null>(null);

  function loadData() {
    api.listSessions(id).then(setSessions).catch(() => {});
    api.listHighlights(id).then(setHighlights).catch(() => {});
  }

  useEffect(() => {
    api.getBook(id).then(setBook).catch(() => {});
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Cronómetro.
  useEffect(() => {
    if (running) {
      intervalRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  function finish() {
    setRunning(false);
    if (seconds < 5) return notifyGrokError(new Error("La sesión es demasiado corta."));
    setShowSave(true);
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-4 flex items-center gap-3">
        <button onClick={() => navigate("/leer")} className="btn-ghost !px-3 !py-2 text-sm">← Volver</button>
        {book && (
          <div className="flex items-center gap-3">
            {book.cover_url && <img src={book.cover_url} alt="" className="h-12 w-8 rounded object-cover" />}
            <div>
              <div className="font-serif text-xl text-cream">{book.title}</div>
              <div className="text-xs text-muted">{book.author}</div>
            </div>
          </div>
        )}
      </div>

      {/* Cronómetro */}
      <div className="card p-8 text-center">
        <div className="font-mono text-6xl text-cream">{clock(seconds)}</div>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={() => setRunning((r) => !r)} className="btn-gold">
            {running ? "Pausar" : seconds > 0 ? "Reanudar" : "Iniciar"}
          </button>
          <button onClick={finish} disabled={seconds === 0} className="btn-ghost disabled:opacity-40">
            Terminar
          </button>
          {seconds > 0 && !running && (
            <button onClick={() => setSeconds(0)} className="btn-ghost">Reiniciar</button>
          )}
        </div>
      </div>

      {/* Highlights */}
      <div className="mt-8">
        <h2 className="mb-3 text-2xl text-cream">Subrayados y notas</h2>
        <HighlightForm bookId={id} onSaved={loadData} />
        <div className="mt-4 space-y-3">
          {highlights.map((h) => (
            <div key={h.id} className="card p-4">
              <p className="font-serif text-lg italic text-cream">“{h.text}”</p>
              {h.note && <p className="mt-2 text-sm text-cream/80">{h.note}</p>}
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-muted">{h.page != null ? `p. ${h.page}` : ""}</span>
                <button onClick={async () => { await api.deleteHighlight(h.id); loadData(); }} className="text-xs text-muted hover:text-red-400">
                  Borrar
                </button>
              </div>
            </div>
          ))}
          {highlights.length === 0 && <p className="text-sm text-muted">Aún no hay subrayados de este libro.</p>}
        </div>
      </div>

      {/* Sesiones del libro */}
      {sessions.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-2xl text-cream">Sesiones de este libro</h2>
          <div className="space-y-2">
            {sessions.map((s) => (
              <div key={s.id} className="card flex items-center justify-between gap-3 p-3 text-sm">
                <span className="text-cream">{fmtMin(s.minutes)}{s.pages ? ` · ${s.pages} pp` : ""}</span>
                <span className="text-muted">
                  {s.created_at.slice(0, 10)}
                  {s.note && <span className="italic"> · {s.note}</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showSave && (
        <SaveSessionModal
          minutes={Math.max(1, Math.round(seconds / 60))}
          bookId={id}
          onClose={() => setShowSave(false)}
          onSaved={() => { setShowSave(false); setSeconds(0); loadData(); api.readingStats().catch(() => {}); }}
        />
      )}
    </div>
  );
}

/* ---------- Form de highlight ---------- */

function HighlightForm({ bookId, onSaved }: { bookId: number; onSaved: () => void }) {
  const [text, setText] = useState("");
  const [note, setNote] = useState("");
  const [page, setPage] = useState("");

  async function save() {
    if (!text.trim()) return notifyGrokError(new Error("Escribe el subrayado."));
    try {
      await api.createHighlight({ book_id: bookId, text: text.trim(), note: note.trim() || null, page: page ? Number(page) : null });
      setText(""); setNote(""); setPage("");
      notifyOk("Subrayado guardado.");
      onSaved();
    } catch (err) {
      notifyGrokError(err);
    }
  }

  return (
    <div className="card p-4">
      <textarea className="input min-h-[70px] resize-y font-serif" placeholder="Pega o escribe el pasaje…" value={text} onChange={(e) => setText(e.target.value)} />
      <div className="mt-2 grid grid-cols-3 gap-2">
        <input className="input col-span-2" placeholder="Tu nota (opcional)" value={note} onChange={(e) => setNote(e.target.value)} />
        <input className="input" type="number" placeholder="Pág." value={page} onChange={(e) => setPage(e.target.value)} />
      </div>
      <button onClick={save} className="btn-gold mt-2 w-full">Guardar subrayado</button>
    </div>
  );
}

/* ---------- Modal: guardar sesión ---------- */

function SaveSessionModal({ minutes, bookId, onClose, onSaved }: { minutes: number; bookId: number; onClose: () => void; onSaved: () => void }) {
  const [pages, setPages] = useState("");
  const [note, setNote] = useState("");

  async function save() {
    try {
      await api.createSession({ book_id: bookId, minutes, pages: pages ? Number(pages) : null, note: note.trim() || null });
      notifyOk(`Sesión de ${minutes} min guardada.`);
      onSaved();
    } catch (err) {
      notifyGrokError(err);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 pt-[12vh] backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl text-cream">Sesión de {minutes} min</h2>
        <p className="mt-1 text-sm text-muted">Registra cuánto avanzaste.</p>
        <input className="input mt-4" type="number" placeholder="Páginas leídas (opcional)" value={pages} onChange={(e) => setPages(e.target.value)} />
        <textarea className="input mt-3 min-h-[70px] resize-y" placeholder="¿Qué pensaste? (opcional)" value={note} onChange={(e) => setNote(e.target.value)} />
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onClose} className="btn-ghost">Descartar</button>
          <button onClick={save} className="btn-gold">Guardar sesión</button>
        </div>
      </div>
    </div>
  );
}
