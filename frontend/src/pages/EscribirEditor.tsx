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
    </div>
  );
}
