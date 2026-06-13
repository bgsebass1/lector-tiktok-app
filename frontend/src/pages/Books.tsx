import { useEffect, useState } from "react";
import {
  api,
  type Book,
  type BookRecommendation,
} from "../lib/api";
import BookCard from "../components/BookCard";
import AddBookModal from "../components/AddBookModal";

/**
 * Página de LIBROS:
 *  - Grid visual de carátulas.
 *  - Botón "Agregar libro" (abre el modal).
 *  - Click en un libro = panel de detalle con editar / borrar.
 *  - Tras guardar, pide a Grok 3 recomendaciones basadas en toda la biblioteca.
 */
export default function Books() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal de agregar/editar.
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Book | null>(null);

  // Libro seleccionado para ver detalle.
  const [selected, setSelected] = useState<Book | null>(null);

  // Recomendaciones de Grok.
  const [recs, setRecs] = useState<BookRecommendation[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [recsError, setRecsError] = useState<string | null>(null);

  /** Carga (o recarga) la lista de libros. */
  async function loadBooks() {
    setLoading(true);
    try {
      setBooks(await api.listBooks());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBooks();
  }, []);

  /** Pide recomendaciones a Grok según toda la biblioteca. */
  async function fetchRecommendations() {
    setLoadingRecs(true);
    setRecsError(null);
    try {
      setRecs(await api.recommendBooks());
    } catch (err) {
      setRecsError(err instanceof Error ? err.message : "Error al recomendar.");
    } finally {
      setLoadingRecs(false);
    }
  }

  /** Tras guardar un libro: cerramos modal, recargamos y pedimos recos. */
  async function handleSaved() {
    setShowAdd(false);
    setEditing(null);
    await loadBooks();
    fetchRecommendations();
  }

  /** Borra el libro seleccionado tras confirmar. */
  async function handleDelete(book: Book) {
    if (!confirm(`¿Borrar "${book.title}"?`)) return;
    await api.deleteBook(book.id);
    setSelected(null);
    loadBooks();
  }

  return (
    <div>
      {/* Encabezado */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-4xl text-cream">Mi biblioteca</h1>
          <p className="mt-1 text-muted">
            {books.length} {books.length === 1 ? "libro leído" : "libros leídos"}
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-gold">
          + Agregar libro
        </button>
      </div>

      {/* Grid de libros */}
      {loading ? (
        <p className="text-muted">Cargando…</p>
      ) : books.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="font-serif text-xl text-muted">
            Tu biblioteca está vacía.
          </p>
          <p className="mt-2 text-sm text-muted">
            Agrega tu primer libro para empezar.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onClick={() => setSelected(book)}
            />
          ))}
        </div>
      )}

      {/* Sección de recomendaciones de Grok */}
      <section className="mt-14">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl text-cream">Qué leer después ✨</h2>
          <button
            onClick={fetchRecommendations}
            disabled={loadingRecs || books.length === 0}
            className="btn-ghost text-sm"
          >
            {loadingRecs ? "Pensando…" : "Pedir recomendaciones"}
          </button>
        </div>

        {recsError && <p className="text-sm text-red-400">{recsError}</p>}

        {recs.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {recs.map((r, i) => (
              <div key={i} className="card p-5">
                <p className="font-serif text-lg text-gold">{r.title}</p>
                <p className="text-sm text-muted">{r.author}</p>
                <p className="mt-3 text-sm leading-relaxed text-cream/90">
                  {r.reason}
                </p>
              </div>
            ))}
          </div>
        ) : (
          !loadingRecs && (
            <p className="text-sm text-muted">
              Agrega libros y pide recomendaciones basadas en lo que has leído.
            </p>
          )
        )}
      </section>

      {/* Modal de agregar / editar */}
      {(showAdd || editing) && (
        <AddBookModal
          book={editing ?? undefined}
          onClose={() => {
            setShowAdd(false);
            setEditing(null);
          }}
          onSaved={handleSaved}
        />
      )}

      {/* Panel de detalle del libro seleccionado */}
      {selected && (
        <BookDetail
          book={selected}
          onClose={() => setSelected(null)}
          onEdit={() => {
            setEditing(selected);
            setSelected(null);
          }}
          onDelete={() => handleDelete(selected)}
        />
      )}
    </div>
  );
}

/* ---------- Sub-componente: detalle del libro ---------- */

interface DetailProps {
  book: Book;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function BookDetail({ book, onClose, onEdit, onDelete }: DetailProps) {
  // Convertimos los temas (texto con comas) en chips.
  const themeChips =
    book.themes
      ?.split(",")
      .map((t) => t.trim())
      .filter(Boolean) ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="card my-8 w-full max-w-3xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-6 sm:flex-row">
          {/* Carátula grande */}
          <div className="shrink-0">
            {book.cover_url ? (
              <img
                src={book.cover_url}
                alt={book.title}
                className="w-40 rounded-lg border border-border shadow-lg shadow-black/50"
              />
            ) : (
              <div className="flex h-60 w-40 items-center justify-center rounded-lg border border-border bg-surface p-4 text-center font-serif text-muted">
                {book.title}
              </div>
            )}
          </div>

          {/* Información */}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-3xl text-cream">{book.title}</h2>
                <p className="mt-1 text-lg text-muted">
                  {book.author}
                  {book.year ? ` · ${book.year}` : ""}
                </p>
              </div>
              <button onClick={onClose} className="text-muted hover:text-cream">
                ✕
              </button>
            </div>

            {book.rating != null && (
              <p className="mt-3 text-gold">★ {book.rating}/10</p>
            )}

            {book.read_date && (
              <p className="mt-1 text-sm text-muted">Leído: {book.read_date}</p>
            )}

            {themeChips.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {themeChips.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-border px-3 py-1 text-xs text-muted"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}

            {book.notes && (
              <div className="mt-4">
                <p className="mb-1 text-xs uppercase tracking-wide text-muted">
                  Mis notas
                </p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-cream/90">
                  {book.notes}
                </p>
              </div>
            )}

            {/* Acciones */}
            <div className="mt-6 flex gap-3">
              <button onClick={onEdit} className="btn-ghost text-sm">
                Editar
              </button>
              <button
                onClick={onDelete}
                className="rounded-lg border border-red-900 px-5 py-2.5 text-sm text-red-400 transition hover:bg-red-950"
              >
                Borrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
