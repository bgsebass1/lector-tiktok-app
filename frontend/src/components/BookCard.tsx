import type { Book } from "../lib/api";

interface Props {
  book: Book;
  onClick: () => void;
}

/**
 * Tarjeta visual de un libro en el grid (estilo Goodreads / Letterboxd):
 * carátula grande con sombra, y al pasar el mouse se ve el rating.
 */
export default function BookCard({ book, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="group text-left transition hover:-translate-y-1"
    >
      {/* Carátula */}
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg border border-border bg-surface shadow-lg shadow-black/50">
        {book.cover_url ? (
          <img
            src={book.cover_url}
            alt={`Carátula de ${book.title}`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          // Marcador de posición si no hay carátula.
          <div className="flex h-full w-full items-center justify-center p-4 text-center font-serif text-muted">
            {book.title}
          </div>
        )}

        {/* Rating en una esquina (si existe). */}
        {book.rating != null && (
          <span className="absolute right-2 top-2 rounded-md bg-carbon/80 px-2 py-1 text-xs font-medium text-gold backdrop-blur">
            ★ {book.rating}/10
          </span>
        )}
      </div>

      {/* Título y autor */}
      <div className="mt-2">
        <p className="line-clamp-2 font-serif text-base leading-tight text-cream group-hover:text-gold">
          {book.title}
        </p>
        <p className="text-sm text-muted">{book.author}</p>
      </div>
    </button>
  );
}
