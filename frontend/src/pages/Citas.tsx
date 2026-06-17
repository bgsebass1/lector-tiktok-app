import { useEffect, useMemo, useRef, useState } from "react";
import * as htmlToImage from "html-to-image";
import { api, type Quote, type Book, type QuoteVideoIdea } from "../lib/api";
import { notifyOk, notifyGrokError } from "../lib/notify";
import GrokLoading from "../components/GrokLoading";

/**
 * BANCO DE CITAS (Módulo 3).
 * Grid tipo Pinterest, búsqueda, conversión a video con Grok y exportación
 * de cada cita como imagen PNG (Stories 1080x1920 o Post 1080x1350).
 */
export default function Citas() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  // Cita seleccionada para exportar como imagen.
  const [exporting, setExporting] = useState<Quote | null>(null);
  // Cita seleccionada para imprimir (PDF A4).
  const [printing, setPrinting] = useState<Quote | null>(null);

  // Ideas de video generadas a partir de una cita.
  const [videoIdeas, setVideoIdeas] = useState<{ quote: Quote; ideas: QuoteVideoIdea[] } | null>(null);
  const [loadingIdeas, setLoadingIdeas] = useState(false);

  function load() {
    api.listQuotes().then(setQuotes).catch(() => {});
  }
  useEffect(() => {
    load();
    api.listBooks().then(setBooks).catch(() => {});
  }, []);

  // Filtro por texto/autor/tags.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return quotes;
    return quotes.filter(
      (c) =>
        c.text.toLowerCase().includes(q) ||
        (c.book_author ?? "").toLowerCase().includes(q) ||
        (c.tags ?? "").toLowerCase().includes(q)
    );
  }, [quotes, search]);

  async function toVideo(quote: Quote) {
    setVideoIdeas(null);
    setLoadingIdeas(true);
    try {
      const { ideas } = await api.quoteToVideo(quote.id);
      setVideoIdeas({ quote, ideas });
    } catch (err) {
      notifyGrokError(err, () => toVideo(quote));
    } finally {
      setLoadingIdeas(false);
    }
  }

  async function remove(id: number) {
    if (!confirm("¿Borrar esta cita?")) return;
    await api.deleteQuote(id);
    load();
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-4xl text-cream">Banco de citas</h1>
          <p className="mt-1 text-muted">{quotes.length} citas guardadas</p>
        </div>
        <div className="flex gap-2">
          <input
            className="input w-56"
            placeholder="Buscar…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button onClick={() => setShowAdd(true)} className="btn-gold">+ Cita</button>
        </div>
      </div>

      {/* Grid Pinterest (columnas con CSS columns) */}
      {filtered.length === 0 ? (
        <p className="text-muted">No hay citas todavía.</p>
      ) : (
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
          {filtered.map((q) => (
            <div key={q.id} className="card mb-4 break-inside-avoid p-5">
              <p className="font-serif text-xl italic leading-relaxed text-cream">“{q.text}”</p>
              <div className="mt-3 text-sm text-muted">
                {q.book_author && <span>— {q.book_author}</span>}
                {q.book_title && <span className="italic"> · {q.book_title}</span>}
                {q.page != null && <span className="font-mono"> · p. {q.page}</span>}
              </div>
              {q.tags && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {q.tags.split(",").map((t) => t.trim()).filter(Boolean).map((t) => (
                    <span key={t} className="rounded-full border border-border px-2 py-0.5 text-xs text-muted">{t}</span>
                  ))}
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => toVideo(q)} className="btn-ghost text-xs">🎬 A video</button>
                <button onClick={() => setExporting(q)} className="btn-ghost text-xs">🖼️ Exportar</button>
                <button onClick={() => setPrinting(q)} className="btn-ghost text-xs">🖨️ Imprimir</button>
                <button onClick={() => remove(q.id)} className="text-xs text-muted hover:text-red-400">Borrar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modales / paneles */}
      {showAdd && (
        <AddQuoteModal books={books} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load(); }} />
      )}
      {exporting && <ExportModal quote={exporting} onClose={() => setExporting(null)} />}
      {printing && <PrintModal quote={printing} onClose={() => setPrinting(null)} />}

      {/* Panel de ideas de video */}
      {(loadingIdeas || videoIdeas) && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm" onClick={() => setVideoIdeas(null)}>
          <div className="card my-8 w-full max-w-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl text-cream">Ideas de video desde la cita</h2>
            {loadingIdeas ? (
              <GrokLoading />
            ) : (
              <div className="mt-4 space-y-3">
                {videoIdeas?.ideas.map((idea, i) => (
                  <div key={i} className="card p-4">
                    <p className="font-serif text-lg text-gold">{idea.titulo}</p>
                    <p className="mt-1 text-sm text-muted">{idea.angulo}</p>
                    <p className="mt-2 text-sm text-cream/90">{idea.estructura}</p>
                  </div>
                ))}
                <button onClick={() => setVideoIdeas(null)} className="btn-ghost">Cerrar</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Modal: agregar cita ---------- */

function AddQuoteModal({ books, onClose, onSaved }: { books: Book[]; onClose: () => void; onSaved: () => void }) {
  const [text, setText] = useState("");
  const [bookId, setBookId] = useState("");
  const [page, setPage] = useState("");
  const [tags, setTags] = useState("");

  async function save() {
    if (!text.trim()) return notifyGrokError(new Error("Escribe la cita."));
    try {
      await api.createQuote({
        text: text.trim(),
        book_id: bookId ? Number(bookId) : null,
        page: page ? Number(page) : null,
        tags: tags.trim() || null,
      });
      notifyOk("Cita guardada.");
      onSaved();
    } catch (err) {
      notifyGrokError(err);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 pt-[10vh] backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-2xl text-cream">Nueva cita</h2>
        <textarea className="input min-h-[120px] resize-y font-serif text-lg" placeholder="El texto de la cita…" value={text} onChange={(e) => setText(e.target.value)} />
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <select className="input" value={bookId} onChange={(e) => setBookId(e.target.value)}>
            <option value="">Libro (opcional)</option>
            {books.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
          </select>
          <input className="input" type="number" placeholder="Página" value={page} onChange={(e) => setPage(e.target.value)} />
        </div>
        <input className="input mt-3" placeholder="Tags (tema, emoción, longitud)" value={tags} onChange={(e) => setTags(e.target.value)} />
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onClose} className="btn-ghost">Cancelar</button>
          <button onClick={save} className="btn-gold">Guardar</button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Modal: exportar como imagen ---------- */

const FORMATS = {
  story: { label: "Story 1080×1920", w: 1080, h: 1920 },
  post: { label: "Post 1080×1350", w: 1080, h: 1350 },
};

function ExportModal({ quote, onClose }: { quote: Quote; onClose: () => void }) {
  const [format, setFormat] = useState<keyof typeof FORMATS>("story");
  const cardRef = useRef<HTMLDivElement>(null);
  const dims = FORMATS[format];

  // Vista previa escalada (la imagen real se exporta a tamaño completo).
  const previewScale = 0.22;

  async function download() {
    if (!cardRef.current) return;
    try {
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        width: dims.w,
        height: dims.h,
        pixelRatio: 1,
        // Anulamos la escala de la vista previa para exportar a tamaño real.
        style: { transform: "scale(1)", transformOrigin: "top left" },
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `cita-${quote.id}-${format}.png`;
      a.click();
      notifyOk("Imagen descargada.");
    } catch (err) {
      notifyGrokError(err);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 p-4 pt-[6vh] backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl text-cream">Exportar cita</h2>
          <button onClick={onClose} className="text-muted hover:text-cream">✕</button>
        </div>

        <div className="mb-4 flex gap-2">
          {(Object.keys(FORMATS) as Array<keyof typeof FORMATS>).map((f) => (
            <button key={f} onClick={() => setFormat(f)}
              className={`rounded-lg border px-4 py-2 text-sm transition ${format === f ? "border-gold text-gold" : "border-border text-muted"}`}>
              {FORMATS[f].label}
            </button>
          ))}
        </div>

        {/* Vista previa centrada */}
        <div className="flex justify-center overflow-hidden" style={{ height: dims.h * previewScale }}>
          <div style={{ transform: `scale(${previewScale})`, transformOrigin: "top center" }}>
            <QuoteImage ref={cardRef} quote={quote} width={dims.w} height={dims.h} />
          </div>
        </div>

        <button onClick={download} className="btn-gold mt-4 w-full">Descargar PNG</button>
      </div>
    </div>
  );
}

/* ---------- Print-on-demand A4 (G19) ---------- */

const DESIGNS = ["minimalista", "manuscrito", "brutalista", "cartel"] as const;
type Design = (typeof DESIGNS)[number];

function PrintModal({ quote, onClose }: { quote: Quote; onClose: () => void }) {
  const [design, setDesign] = useState<Design>("minimalista");
  const author = quote.book_author ?? "";

  const styles: Record<Design, { page: React.CSSProperties; quote: React.CSSProperties; author: React.CSSProperties }> = {
    minimalista: {
      page: { background: "#fff", color: "#111", justifyContent: "center", textAlign: "center", padding: "10%" },
      quote: { fontFamily: "Cormorant Garamond, serif", fontStyle: "italic", fontSize: "3.4vw", lineHeight: 1.4 },
      author: { marginTop: "4%", fontFamily: "Inter, sans-serif", fontSize: "1.4vw", color: "#888" },
    },
    manuscrito: {
      page: { background: "#f4ecd8", color: "#3a2f1d", justifyContent: "center", textAlign: "center", padding: "12%", border: "2vw double #c9b68a", boxSizing: "border-box" },
      quote: { fontFamily: "Cormorant Garamond, serif", fontStyle: "italic", fontSize: "3.2vw", lineHeight: 1.5 },
      author: { marginTop: "5%", fontFamily: "Cormorant Garamond, serif", fontSize: "1.6vw", color: "#8a7a5c" },
    },
    brutalista: {
      page: { background: "#fff", color: "#000", justifyContent: "flex-start", textAlign: "left", padding: "8%" },
      quote: { fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "5vw", lineHeight: 1.05, textTransform: "uppercase" },
      author: { marginTop: "6%", fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "1.6vw" },
    },
    cartel: {
      page: { background: "radial-gradient(circle at 30% 20%, #1a1a1a, #0a0a0a)", color: "#f5f0e1", justifyContent: "flex-end", textAlign: "left", padding: "10%" },
      quote: { fontFamily: "Playfair Display, serif", fontSize: "4vw", lineHeight: 1.2, color: "#f5f0e1" },
      author: { marginTop: "5%", fontFamily: "Inter, sans-serif", fontSize: "1.6vw", color: "#d4af37", letterSpacing: "0.2em", textTransform: "uppercase" },
    },
  };
  const s = styles[design];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 p-4 pt-[5vh] backdrop-blur-sm no-print" onClick={onClose}>
      <div className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-2xl text-cream">Imprimir cita</h2>
          <button onClick={onClose} className="text-muted hover:text-cream">✕</button>
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          {DESIGNS.map((d) => (
            <button key={d} onClick={() => setDesign(d)} className={`rounded-full border px-3 py-1 text-sm capitalize ${design === d ? "border-gold text-gold" : "border-border text-muted"}`}>{d}</button>
          ))}
        </div>
        {/* Vista previa A4 (ratio 1:1.414) */}
        <div className="mx-auto w-full max-w-[280px]">
          <div className="aspect-[1/1.414] w-full overflow-hidden rounded shadow-lg">
            <div style={{ ...s.page, width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
              <div style={s.quote}>“{quote.text}”</div>
              {author && <div style={s.author}>— {author}</div>}
            </div>
          </div>
        </div>
        <button onClick={() => window.print()} className="btn-gold mt-4 w-full">🖨️ Imprimir / Guardar PDF</button>
      </div>

      {/* Página imprimible real (A4) */}
      <div className="print-area" style={{ ...s.page, width: "100%", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <div style={{ ...s.quote, fontSize: design === "brutalista" ? "9vw" : design === "minimalista" || design === "manuscrito" ? "6vw" : "7vw" }}>“{quote.text}”</div>
        {author && <div style={{ ...s.author, fontSize: "2.6vw" }}>— {author}</div>}
      </div>
    </div>
  );
}

/* ---------- Lienzo de la imagen de cita ---------- */

import { forwardRef } from "react";

const QuoteImage = forwardRef<HTMLDivElement, { quote: Quote; width: number; height: number }>(
  function QuoteImage({ quote, width, height }, ref) {
    return (
      <div
        ref={ref}
        style={{
          width,
          height,
          position: "relative",
          background: "radial-gradient(circle at 30% 20%, #1a1a1a 0%, #0a0a0a 70%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "120px 100px",
          boxSizing: "border-box",
        }}
      >
        <div style={{ fontSize: 90, color: "#d4af37", fontFamily: "Playfair Display, serif", lineHeight: 1 }}>“</div>
        <p style={{ fontSize: 64, color: "#f5f0e1", fontFamily: "Cormorant Garamond, serif", fontStyle: "italic", lineHeight: 1.35, margin: "20px 0" }}>
          {quote.text}
        </p>
        <div style={{ marginTop: 40, fontSize: 36, color: "#8a8a82", fontFamily: "Inter, sans-serif" }}>
          {quote.book_author && <div>— {quote.book_author}</div>}
          {quote.book_title && <div style={{ fontStyle: "italic" }}>{quote.book_title}</div>}
        </div>
        <div style={{ position: "absolute", bottom: 80, left: 100, fontSize: 30, color: "#d4af37", fontFamily: "Inter, sans-serif" }}>
          Libros nada más 😁
        </div>
      </div>
    );
  }
);
