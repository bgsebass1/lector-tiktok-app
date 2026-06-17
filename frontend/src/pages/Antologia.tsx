import { useState } from "react";
import { api } from "../lib/api";
import { notifyError } from "../lib/notify";

const FONTS: Record<string, string> = {
  cormorant: '"Cormorant Garamond", Georgia, serif',
  playfair: '"Playfair Display", Georgia, serif',
  georgia: "Georgia, serif",
};

interface Compiled {
  citas: { text: string; author: string | null }[];
  highlights: { text: string; book: string | null }[];
  escritos: { title: string; content: string }[];
  palabras: { word: string; etymology: string | null }[];
}

/** ANTOLOGÍA PERSONAL (G8) — compila tu mejor contenido en una página imprimible (→ PDF). */
export default function Antologia() {
  const [title, setTitle] = useState("Pliego · Mi antología");
  const [font, setFont] = useState("cormorant");
  const [sel, setSel] = useState({ citas: true, highlights: true, escritos: true, palabras: false });
  const [data, setData] = useState<Compiled | null>(null);
  const [busy, setBusy] = useState(false);

  function toggle(k: keyof typeof sel) {
    setSel((s) => ({ ...s, [k]: !s[k] }));
  }

  async function generate() {
    setBusy(true);
    try {
      const out: Compiled = { citas: [], highlights: [], escritos: [], palabras: [] };
      if (sel.citas) {
        const q = await api.listQuotes();
        out.citas = q.map((x) => ({ text: x.text, author: (x as { author?: string | null }).author ?? null }));
      }
      if (sel.highlights) {
        const h = await api.listHighlights();
        out.highlights = h.map((x) => ({ text: x.text, book: x.book_title }));
      }
      if (sel.escritos) {
        const ws = await api.listWritings();
        const full = await Promise.all(ws.slice(0, 20).map((w) => api.getWriting(w.id)));
        out.escritos = full.map((w) => ({ title: w.title, content: w.content }));
      }
      if (sel.palabras) {
        const w = await api.listWords();
        out.palabras = w.map((x) => ({ word: x.word, etymology: x.etymology }));
      }
      setData(out);
    } catch (e) {
      notifyError(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 no-print">
        <h1 className="text-4xl text-cream">Antología</h1>
        <p className="mt-1 text-muted">Reúne tu mejor contenido y guárdalo como PDF (tu imprenta personal).</p>
      </div>

      {/* Configuración */}
      <div className="card mb-5 space-y-4 p-5 no-print">
        <div>
          <label className="text-sm text-muted">Título</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="input mt-1" />
        </div>
        <div>
          <label className="text-sm text-muted">Incluir</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {([["citas", "Citas"], ["highlights", "Subrayados"], ["escritos", "Escritos"], ["palabras", "Palabras"]] as const).map(([k, label]) => (
              <button key={k} onClick={() => toggle(k)} className={`rounded-full border px-3 py-1 text-sm ${sel[k] ? "border-gold text-gold" : "border-border text-muted"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm text-muted">Tipografía</label>
          <select value={font} onChange={(e) => setFont(e.target.value)} className="input mt-1">
            <option value="cormorant">Cormorant Garamond</option>
            <option value="playfair">Playfair Display</option>
            <option value="georgia">Georgia</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={generate} disabled={busy} className="btn-gold">{busy ? "Compilando…" : "Generar vista previa"}</button>
          {data && <button onClick={() => window.print()} className="btn-ghost">🖨️ Imprimir / Guardar PDF</button>}
        </div>
        <p className="text-xs text-muted">En el diálogo de impresión elige “Guardar como PDF”.</p>
      </div>

      {/* Vista previa / página imprimible */}
      {data && (
        <div className="print-area mx-auto max-w-[800px] rounded-lg p-10" style={{ background: "#fbf8f1", color: "#1a1712", fontFamily: FONTS[font] }}>
          <h1 className="text-center text-4xl" style={{ fontFamily: FONTS[font] }}>{title}</h1>
          <p className="mt-2 text-center text-sm" style={{ color: "#8a7a5c" }}>{new Date().toLocaleDateString("es-CO", { year: "numeric", month: "long" })}</p>

          {data.citas.length > 0 && (
            <Section title="Citas">
              {data.citas.map((c, i) => (
                <blockquote key={i} className="mb-4 text-xl italic">“{c.text}”{c.author && <span className="mt-1 block text-base not-italic" style={{ color: "#8a7a5c" }}>— {c.author}</span>}</blockquote>
              ))}
            </Section>
          )}
          {data.highlights.length > 0 && (
            <Section title="Subrayados">
              {data.highlights.map((h, i) => (
                <p key={i} className="mb-3 text-lg">“{h.text}”{h.book && <span className="text-sm" style={{ color: "#8a7a5c" }}> · {h.book}</span>}</p>
              ))}
            </Section>
          )}
          {data.escritos.length > 0 && (
            <Section title="Escritos">
              {data.escritos.map((e, i) => (
                <div key={i} className="mb-6">
                  <h3 className="text-2xl">{e.title}</h3>
                  <p className="mt-1 whitespace-pre-wrap text-lg leading-relaxed">{e.content}</p>
                </div>
              ))}
            </Section>
          )}
          {data.palabras.length > 0 && (
            <Section title="Palabras">
              {data.palabras.map((w, i) => (
                <p key={i} className="mb-3 text-lg"><strong>{w.word}</strong>{w.etymology && <span className="text-base" style={{ color: "#5c5345" }}> — {w.etymology}</span>}</p>
              ))}
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8" style={{ breakInside: "avoid" }}>
      <h2 className="mb-4 border-b pb-1 text-2xl uppercase tracking-widest" style={{ borderColor: "#d8cbb0", color: "#6b5d45" }}>{title}</h2>
      {children}
    </section>
  );
}
