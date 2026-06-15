import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, type FlashcardStats, type Book } from "../lib/api";
import { notifyOk, notifyGrokError } from "../lib/notify";
import GrokLoading from "../components/GrokLoading";

/**
 * FLASHCARDS — hub.
 * Stats + mazos + crear manual + generar desde un libro con Grok.
 * El estudio en sí vive en /flashcards/estudiar.
 */
export default function Flashcards() {
  const [stats, setStats] = useState<FlashcardStats | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showGen, setShowGen] = useState(false);
  const navigate = useNavigate();

  function load() {
    api.flashcardStats().then(setStats).catch(() => {});
  }
  useEffect(load, []);

  const due = stats?.due ?? 0;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-4xl text-cream">Flashcards</h1>
          <p className="mt-1 text-muted">Repaso espaciado para que no se te olvide lo que lees.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAdd(true)} className="btn-ghost">+ Nueva</button>
          <button onClick={() => setShowGen(true)} className="btn-ghost">✨ Desde libro</button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <Stat label="Total" value={stats?.total ?? 0} />
        <Stat label="Pendientes hoy" value={due} accent />
        <Stat label="Dominadas" value={stats?.mastered ?? 0} />
      </div>

      {/* Estudiar */}
      <button
        onClick={() => navigate("/flashcards/estudiar")}
        disabled={due === 0}
        className="btn-gold w-full py-4 text-lg disabled:opacity-40"
      >
        {due > 0 ? `Estudiar ${due} tarjeta${due === 1 ? "" : "s"}` : "Nada que repasar hoy 🎉"}
      </button>

      {/* Mazos */}
      {stats && stats.decks.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-2xl text-cream">Mazos</h2>
          <div className="space-y-2">
            {stats.decks.map((d) => (
              <div key={d.deck} className="card flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="truncate text-cream">{d.deck}</div>
                  <div className="text-sm text-muted">
                    {d.total} tarjetas · {d.due} pendientes
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/flashcards/estudiar?deck=${encodeURIComponent(d.deck)}`)}
                  disabled={d.due === 0}
                  className="btn-ghost shrink-0 text-sm disabled:opacity-40"
                >
                  Estudiar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats && stats.total === 0 && (
        <p className="mt-8 text-center text-muted">
          Aún no tienes tarjetas. Crea una o genéralas desde un libro.
        </p>
      )}

      {showAdd && <AddCardModal onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load(); }} />}
      {showGen && <GenerateModal onClose={() => setShowGen(false)} onDone={() => { setShowGen(false); load(); }} />}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="card p-4 text-center">
      <div className={`font-serif text-3xl ${accent ? "text-gold" : "text-cream"}`}>{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wide text-muted">{label}</div>
    </div>
  );
}

/* ---------- Modal: crear tarjeta manual ---------- */

function AddCardModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [deck, setDeck] = useState("");

  async function save() {
    if (!front.trim() || !back.trim()) return notifyGrokError(new Error("Completa anverso y reverso."));
    try {
      await api.createFlashcard({ front: front.trim(), back: back.trim(), deck: deck.trim() || undefined });
      notifyOk("Tarjeta creada.");
      onSaved();
    } catch (err) {
      notifyGrokError(err);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 pt-[10vh] backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-2xl text-cream">Nueva flashcard</h2>
        <label className="mb-1 block text-sm text-muted">Anverso (pregunta)</label>
        <textarea className="input min-h-[80px] resize-y" value={front} onChange={(e) => setFront(e.target.value)} />
        <label className="mb-1 mt-3 block text-sm text-muted">Reverso (respuesta)</label>
        <textarea className="input min-h-[80px] resize-y" value={back} onChange={(e) => setBack(e.target.value)} />
        <input className="input mt-3" placeholder="Mazo (opcional, ej. nombre del libro)" value={deck} onChange={(e) => setDeck(e.target.value)} />
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onClose} className="btn-ghost">Cancelar</button>
          <button onClick={save} className="btn-gold">Guardar</button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Modal: generar desde libro ---------- */

function GenerateModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [bookId, setBookId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.listBooks().then(setBooks).catch(() => {});
  }, []);

  async function generate() {
    if (!bookId) return notifyGrokError(new Error("Elige un libro."));
    setLoading(true);
    try {
      const { created, deck } = await api.generateFlashcards(Number(bookId));
      notifyOk(`${created} tarjetas creadas en "${deck}".`);
      onDone();
    } catch (err) {
      notifyGrokError(err, generate);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 pt-[10vh] backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-2xl text-cream">Generar flashcards desde un libro</h2>
        {loading ? (
          <GrokLoading />
        ) : (
          <>
            {books.length === 0 ? (
              <p className="text-muted">Primero agrega libros en la sección Libros.</p>
            ) : (
              <select className="input" value={bookId} onChange={(e) => setBookId(e.target.value)}>
                <option value="">Elige un libro…</option>
                {books.map((b) => (
                  <option key={b.id} value={b.id}>{b.title} — {b.author}</option>
                ))}
              </select>
            )}
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={onClose} className="btn-ghost">Cancelar</button>
              <button onClick={generate} disabled={!bookId} className="btn-gold disabled:opacity-40">
                Generar 10
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
