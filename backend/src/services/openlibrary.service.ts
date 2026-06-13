/**
 * Servicio para hablar con la Open Library API (gratis, sin API key).
 *
 * Sirve para buscar un libro por título + autor y obtener las posibles
 * carátulas (covers) de sus distintas ediciones.
 *
 * Node 24 ya trae "fetch" global, así que no hace falta instalar axios.
 */

/** Cómo se ve cada opción de libro que devolvemos al frontend. */
export interface CoverOption {
  /** Identificador de portada de Open Library (campo cover_i). */
  coverId: number;
  title: string;
  author: string;
  year: number | null;
  /** URL de carátula tamaño mediano. */
  coverM: string;
  /** URL de carátula tamaño grande (la que guardamos). */
  coverL: string;
}

/** Estructura parcial de la respuesta de Open Library que nos interesa. */
interface OpenLibraryDoc {
  title?: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
}

interface OpenLibraryResponse {
  docs?: OpenLibraryDoc[];
}

/** Construye la URL de una carátula a partir del cover_i y el tamaño. */
function coverUrl(coverId: number, size: "M" | "L"): string {
  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
}

/**
 * Busca un libro en Open Library y devuelve hasta `limit` opciones de carátula.
 * Solo incluimos resultados que tengan cover_i (si no, no hay imagen que mostrar).
 */
export async function searchCovers(
  title: string,
  author: string,
  limit = 8
): Promise<CoverOption[]> {
  const query = encodeURIComponent(`${title} ${author}`.trim());
  const url = `https://openlibrary.org/search.json?q=${query}&limit=20`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Open Library respondió con estado ${res.status}`);
  }

  const data = (await res.json()) as OpenLibraryResponse;
  const docs = data.docs ?? [];

  const options: CoverOption[] = [];
  const seenCovers = new Set<number>();

  for (const doc of docs) {
    // Saltamos resultados sin portada o portadas repetidas.
    if (typeof doc.cover_i !== "number") continue;
    if (seenCovers.has(doc.cover_i)) continue;
    seenCovers.add(doc.cover_i);

    options.push({
      coverId: doc.cover_i,
      title: doc.title ?? title,
      author: doc.author_name?.[0] ?? author,
      year: doc.first_publish_year ?? null,
      coverM: coverUrl(doc.cover_i, "M"),
      coverL: coverUrl(doc.cover_i, "L"),
    });

    if (options.length >= limit) break;
  }

  return options;
}
