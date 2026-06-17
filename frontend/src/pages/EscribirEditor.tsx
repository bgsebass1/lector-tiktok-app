import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { notifyGrokError } from "../lib/notify";

type Status = "idle" | "saving" | "saved";

/**
 * Editor de escritura libre con autoguardado (debounce 800ms).
 */
export default function EscribirEditor() {
  const { id } = useParams();
  const wid = Number(id);
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [showAnalysis, setShowAnalysis] = useState(false);

  const baseRef = useRef<{ title: string; content: string } | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    api
      .getWriting(wid)
      .then((w) => {
        setTitle(w.title);
        setContent(w.content);
        baseRef.current = { title: w.title, content: w.content };
      })
      .catch(() => notifyGrokError(new Error("No se pudo abrir el texto.")));
  }, [wid]);

  // Autoguardado.
  useEffect(() => {
    const base = baseRef.current;
    if (!base) return; // aún no carga
    if (title === base.title && content === base.content) return; // sin cambios reales

    setStatus("saving");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(async () => {
      try {
        await api.updateWriting(wid, { title, content });
        baseRef.current = { title, content };
        setStatus("saved");
      } catch {
        setStatus("idle");
      }
    }, 800);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [title, content, wid]);

  const words = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <div className="mx-auto max-w-2xl">
      {/* Barra superior */}
      <div className="mb-4 flex items-center gap-3 text-sm">
        <button onClick={() => navigate("/escribir")} className="btn-ghost !px-3 !py-2">← Volver</button>
        <span className="text-muted">
          {status === "saving" ? "Guardando…" : status === "saved" ? "Guardado ✓" : ""}
        </span>
        <button onClick={() => setShowAnalysis(true)} disabled={!content.trim()} className="text-muted hover:text-gold disabled:opacity-40">✨ Analizar</button>
        <span className="ml-auto font-mono text-muted">{words} palabras</span>
        <button
          onClick={async () => {
            if (!confirm("¿Borrar este texto?")) return;
            try {
              await api.deleteWriting(wid);
              navigate("/escribir");
            } catch (err) {
              notifyGrokError(err);
            }
          }}
          className="text-muted hover:text-red-400"
        >
          Borrar
        </button>
      </div>

      {/* Título */}
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Título"
        className="w-full bg-transparent font-display text-3xl text-cream placeholder:text-muted focus:outline-none"
      />

      {/* Cuerpo */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Escribe…"
        className="mt-4 min-h-[60vh] w-full resize-none bg-transparent font-serif text-xl leading-relaxed text-cream/95 placeholder:text-muted focus:outline-none"
      />

      {showAnalysis && <AnalysisModal text={content} onClose={() => setShowAnalysis(false)} />}
    </div>
  );
}

/* ---------- Métricas poéticas (G12) ---------- */
function topWords(text: string): Array<{ w: string; n: number }> {
  const stop = new Set(["que", "de", "la", "el", "en", "y", "a", "los", "se", "del", "las", "un", "por", "con", "no", "una", "su", "para", "es", "lo", "como", "más", "o", "pero", "le", "ya", "me", "si", "al", "mi", "te", "sus"]);
  const counts: Record<string, number> = {};
  for (const raw of text.toLowerCase().match(/[a-záéíóúñü]+/g) ?? []) {
    if (raw.length < 4 || stop.has(raw)) continue;
    counts[raw] = (counts[raw] ?? 0) + 1;
  }
  return Object.entries(counts).map(([w, n]) => ({ w, n })).filter((x) => x.n > 1).sort((a, b) => b.n - a.n).slice(0, 6);
}

function AnalysisModal({ text, onClose }: { text: string; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<{ sabor: string; ritmo: string; densidad: string; sugerencias: string[] } | null>(null);
  const repetidas = topWords(text);

  async function run() {
    setLoading(true);
    try {
      setRes(await api.poetics(text));
    } catch (e) {
      notifyGrokError(e);
    } finally {
      setLoading(false);
    }
  }
  // Lanzamos el análisis al abrir.
  useEffect(() => { run(); /* eslint-disable-next-line */ }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 pt-[8vh] backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-2xl text-cream">Métricas poéticas</h2>
          <button onClick={onClose} className="text-muted hover:text-cream">✕</button>
        </div>

        {repetidas.length > 0 && (
          <div className="mb-4">
            <div className="text-xs uppercase tracking-wide text-muted">Palabras más repetidas</div>
            <div className="mt-1 flex flex-wrap gap-2">
              {repetidas.map((r) => <span key={r.w} className="rounded-full border border-border px-2 py-0.5 text-sm text-cream/90">{r.w} ·{r.n}</span>)}
            </div>
          </div>
        )}

        {loading && <p className="font-serif italic text-muted">Analizando el estilo…</p>}
        {res && (
          <div className="space-y-3">
            <Row label="Sabor" value={res.sabor} />
            <Row label="Ritmo" value={res.ritmo} />
            <Row label="Densidad lírica" value={res.densidad} />
            {res.sugerencias?.length > 0 && (
              <div>
                <div className="text-xs uppercase tracking-wide text-muted">Sugerencias</div>
                <ul className="mt-1 list-inside list-disc text-sm text-cream/90">{res.sugerencias.map((s, i) => <li key={i}>{s}</li>)}</ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-carbon p-3">
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
      <p className="mt-0.5 text-cream/90">{value}</p>
    </div>
  );
}
