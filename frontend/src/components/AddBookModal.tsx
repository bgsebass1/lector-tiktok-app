import { useState } from "react";
import { api, type Book, type BookInput, type CoverOption } from "../lib/api";

interface Props {
  /** Si se pasa, el modal edita ese libro en vez de crear uno nuevo. */
  book?: Book;
  onClose: () => void;
  /** Se llama tras guardar con éxito (para refrescar la lista). */
  onSaved: () => void;
}

/**
 * Modal para agregar o editar un libro.
 *
 * Flujo de "agregar":
 *  1. Escribes título + autor y pulsas "Buscar carátulas".
 *  2. Open Library devuelve opciones; eliges una con click.
 *  3. Completas año, rating, temas, fecha y notas.
 *  4. Guardas.
 */
export default function AddBookModal({ book, onClose, onSaved }: Props) {
  const isEditing = Boolean(book);

  // Campos del formulario (precargados si estamos editando).
  const [title, setTitle] = useState(book?.title ?? "");
  const [author, setAuthor] = useState(book?.author ?? "");
  const [year, setYear] = useState<string>(book?.year ? String(book.year) : "");
  const [coverUrl, setCoverUrl] = useState<string | null>(book?.cover_url ?? null);
  const [rating, setRating] = useState<string>(
    book?.rating != null ? String(book.rating) : ""
  );
  const [themes, setThemes] = useState(book?.themes ?? "");
  const [readDate, setReadDate] = useState(book?.read_date ?? "");
  const [notes, setNotes] = useState(book?.notes ?? "");

  // Estado de la búsqueda de carátulas.
  const [covers, setCovers] = useState<CoverOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Busca carátulas en Open Library. */
  async function handleSearch() {
    if (!title.trim()) {
      setError("Escribe al menos el título para buscar.");
      return;
    }
    setError(null);
    setSearching(true);
    try {
      const results = await api.searchCovers(title.trim(), author.trim());
      setCovers(results);
      if (results.length === 0) {
        setError("No se encontraron carátulas. Puedes guardar el libro igual.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al buscar.");
    } finally {
      setSearching(false);
    }
  }

  /** Al elegir una carátula, también autocompletamos año si está vacío. */
  function selectCover(option: CoverOption) {
    setCoverUrl(option.coverL);
    if (!year && option.year) setYear(String(option.year));
  }

  /** Guarda (crea o actualiza) el libro. */
  async function handleSave() {
    if (!title.trim() || !author.trim()) {
      setError("El título y el autor son obligatorios.");
      return;
    }
    setError(null);
    setSaving(true);

    const payload: BookInput = {
      title: title.trim(),
      author: author.trim(),
      year: year ? Number(year) : null,
      cover_url: coverUrl,
      rating: rating ? Number(rating) : null,
      themes: themes.trim() || null,
      read_date: readDate || null,
      notes: notes.trim() || null,
    };

    try {
      if (isEditing && book) {
        await api.updateBook(book.id, payload);
      } else {
        await api.createBook(payload);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
      setSaving(false);
    }
  }

  return (
    // Fondo oscuro semitransparente que cierra al hacer click fuera.
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="card my-8 w-full max-w-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl text-cream">
            {isEditing ? "Editar libro" : "Agregar libro"}
          </h2>
          <button onClick={onClose} className="text-muted hover:text-cream">
            ✕
          </button>
        </div>

        {/* Título + autor + buscar */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            className="input"
            placeholder="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            className="input"
            placeholder="Autor"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={searching}
          className="btn-ghost mt-3"
        >
          {searching ? "Buscando…" : "🔍 Buscar carátulas"}
        </button>

        {/* Galería de carátulas encontradas */}
        {covers.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-sm text-muted">
              Elige una carátula (click):
            </p>
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
              {covers.map((c) => (
                <button
                  key={c.coverId}
                  onClick={() => selectCover(c)}
                  className={`overflow-hidden rounded-md border-2 transition ${
                    coverUrl === c.coverL
                      ? "border-gold"
                      : "border-transparent hover:border-muted"
                  }`}
                >
                  <img
                    src={c.coverM}
                    alt={c.title}
                    className="aspect-[2/3] w-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Vista previa de la carátula elegida */}
        {coverUrl && (
          <div className="mt-4 flex items-center gap-3">
            <img
              src={coverUrl}
              alt="Carátula elegida"
              className="h-24 rounded-md border border-border object-cover"
            />
            <button
              onClick={() => setCoverUrl(null)}
              className="text-sm text-muted hover:text-cream"
            >
              Quitar carátula
            </button>
          </div>
        )}

        {/* Detalles: año, rating, fecha, temas, notas */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs text-muted">Año</label>
            <input
              className="input"
              type="number"
              placeholder="1949"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Rating (1-10)</label>
            <input
              className="input"
              type="number"
              min={1}
              max={10}
              placeholder="8"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">
              Fecha de lectura
            </label>
            <input
              className="input"
              type="date"
              value={readDate}
              onChange={(e) => setReadDate(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-3">
          <label className="mb-1 block text-xs text-muted">
            Temas / etiquetas (separados por comas)
          </label>
          <input
            className="input"
            placeholder="filosofía, lenguaje, lógica"
            value={themes}
            onChange={(e) => setThemes(e.target.value)}
          />
        </div>

        <div className="mt-3">
          <label className="mb-1 block text-xs text-muted">Notas</label>
          <textarea
            className="input min-h-[90px] resize-y"
            placeholder="Qué me pareció, ideas para un video, citas…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        {/* Acciones */}
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onClose} className="btn-ghost">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-gold">
            {saving ? "Guardando…" : isEditing ? "Guardar cambios" : "Guardar libro"}
          </button>
        </div>
      </div>
    </div>
  );
}
