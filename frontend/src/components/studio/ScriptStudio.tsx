import { useEffect, useState } from "react";
import {
  api,
  type Book,
  type Script,
  type ScriptBlock,
} from "../../lib/api";
import { notifyOk, notifyGrokError } from "../../lib/notify";
import GrokLoading from "../GrokLoading";

const DURATIONS = ["15s", "30s", "60s", "90s"];
const TONES = ["académico", "irreverente", "melancólico", "provocador", "didáctico"];

interface Props {
  /** Hook enviado desde el Laboratorio de hooks (se mete como bloque HOOK). */
  injectedHook: string | null;
  onHookConsumed: () => void;
}

/**
 * Editor de guiones (Módulo 1).
 * Genera bloques con timestamps, permite editarlos inline, reescribir uno solo,
 * transformar todo el guion, guardarlo con versionado y exportarlo como texto.
 */
export default function ScriptStudio({ injectedHook, onHookConsumed }: Props) {
  // Parámetros de generación.
  const [topic, setTopic] = useState("");
  const [bookRef, setBookRef] = useState("");
  const [duration, setDuration] = useState("60s");
  const [tone, setTone] = useState("didáctico");
  const [title, setTitle] = useState("");

  // Estado del guion en edición.
  const [blocks, setBlocks] = useState<ScriptBlock[]>([]);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [busyBlock, setBusyBlock] = useState<number | null>(null);

  // Datos auxiliares.
  const [books, setBooks] = useState<Book[]>([]);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [versions, setVersions] = useState<Script["versions"]>([]);

  function loadScripts() {
    api.listScripts().then(setScripts).catch(() => {});
  }

  useEffect(() => {
    api.listBooks().then(setBooks).catch(() => {});
    loadScripts();
  }, []);

  // Si llega un hook desde el laboratorio, lo insertamos como primer bloque.
  useEffect(() => {
    if (injectedHook) {
      setBlocks((prev) => {
        const rest = prev.filter((b) => b.label !== "HOOK");
        return [{ label: "HOOK", timestamp: "[0-3s]", content: injectedHook }, ...rest];
      });
      onHookConsumed();
    }
  }, [injectedHook, onHookConsumed]);

  /** Genera un guion nuevo con Grok. */
  async function generate() {
    if (!topic.trim()) {
      notifyGrokError(new Error("Escribe un tema."));
      return;
    }
    setLoading(true);
    try {
      const { blocks: b } = await api.generateScript({ topic, bookRef, duration, tone });
      setBlocks(b);
      setCurrentId(null);
      setVersions([]);
      if (!title) setTitle(topic);
    } catch (err) {
      notifyGrokError(err, generate);
    } finally {
      setLoading(false);
    }
  }

  /** Edita el contenido de un bloque inline. */
  function editBlock(index: number, content: string) {
    setBlocks((prev) => prev.map((b, i) => (i === index ? { ...b, content } : b)));
  }

  /** Reescribe un solo bloque manteniendo el resto. */
  async function rewrite(index: number) {
    setBusyBlock(index);
    try {
      const { content } = await api.rewriteBlock(blocks, index);
      editBlock(index, content);
    } catch (err) {
      notifyGrokError(err, () => rewrite(index));
    } finally {
      setBusyBlock(null);
    }
  }

  /** Transforma todo el guion (viral / deep / shorter). */
  async function transform(mode: "viral" | "deep" | "shorter") {
    setLoading(true);
    try {
      const { blocks: b } = await api.transformScript(blocks, mode);
      setBlocks(b);
    } catch (err) {
      notifyGrokError(err, () => transform(mode));
    } finally {
      setLoading(false);
    }
  }

  /** Guarda (crea o actualiza con versionado). */
  async function save() {
    if (blocks.length === 0) return;
    try {
      if (currentId) {
        const updated = await api.updateScript(currentId, { title: title || topic, blocks });
        setVersions(updated.versions ?? []);
        notifyOk("Guion actualizado (versión guardada).");
      } else {
        const created = await api.createScript({
          title: title || topic,
          topic,
          book_ref: bookRef || null,
          duration,
          tone,
          blocks,
        });
        setCurrentId(created.id);
        notifyOk("Guion guardado.");
      }
      loadScripts();
    } catch (err) {
      notifyGrokError(err);
    }
  }

  /** Abre un guion guardado. */
  async function open(id: number) {
    try {
      const s = await api.getScript(id);
      setBlocks(s.blocks);
      setTitle(s.title);
      setTopic(s.topic ?? "");
      setBookRef(s.book_ref ?? "");
      setDuration(s.duration ?? "60s");
      setTone(s.tone ?? "didáctico");
      setCurrentId(s.id);
      setVersions(s.versions ?? []);
    } catch (err) {
      notifyGrokError(err);
    }
  }

  async function remove(id: number) {
    if (!confirm("¿Borrar este guion?")) return;
    await api.deleteScript(id);
    if (currentId === id) {
      setBlocks([]);
      setCurrentId(null);
    }
    loadScripts();
  }

  /** Exporta el guion como texto plano (descarga .txt). */
  function exportTxt() {
    const text = blocks.map((b) => `${b.timestamp} ${b.label}\n${b.content}`).join("\n\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(title || topic || "guion").replace(/\s+/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_280px]">
      {/* Columna principal: generador + editor */}
      <div>
        {/* Parámetros */}
        <div className="card p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              className="input"
              placeholder="Tema del video"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
            <select
              className="input"
              value={bookRef}
              onChange={(e) => setBookRef(e.target.value)}
            >
              <option value="">Libro de referencia (opcional)</option>
              {books.map((b) => (
                <option key={b.id} value={`${b.title} — ${b.author}`}>
                  {b.title} — {b.author}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            <select className="input flex-1" value={duration} onChange={(e) => setDuration(e.target.value)}>
              {DURATIONS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <select className="input flex-1" value={tone} onChange={(e) => setTone(e.target.value)}>
              {TONES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <button onClick={generate} disabled={loading} className="btn-gold">
              {loading ? "Generando…" : "Generar guion"}
            </button>
          </div>
        </div>

        {loading && <GrokLoading />}

        {/* Editor de bloques */}
        {blocks.length > 0 && (
          <div className="mt-6">
            <input
              className="input mb-4 font-serif text-xl"
              placeholder="Título del guion"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <div className="space-y-3">
              {blocks.map((block, i) => (
                <div key={i} className="card p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-mono text-xs text-gold">
                      {block.timestamp} · {block.label}
                    </span>
                    <button
                      onClick={() => rewrite(i)}
                      disabled={busyBlock === i}
                      className="text-xs text-muted transition hover:text-gold"
                    >
                      {busyBlock === i ? "Reescribiendo…" : "↻ Reescribir este bloque"}
                    </button>
                  </div>
                  <textarea
                    className="input min-h-[80px] resize-y"
                    value={block.content}
                    onChange={(e) => editBlock(i, e.target.value)}
                  />
                </div>
              ))}
            </div>

            {/* Acciones de guion */}
            <div className="mt-5 flex flex-wrap gap-2">
              <button onClick={save} className="btn-gold">💾 Guardar</button>
              <button onClick={() => transform("viral")} className="btn-ghost text-sm">🔥 Más viral</button>
              <button onClick={() => transform("deep")} className="btn-ghost text-sm">🧠 Más profundo</button>
              <button onClick={() => transform("shorter")} className="btn-ghost text-sm">✂️ Más corto</button>
              <button onClick={exportTxt} className="btn-ghost text-sm">📄 Exportar texto</button>
            </div>

            {/* Versiones anteriores */}
            {versions && versions.length > 0 && (
              <div className="mt-6">
                <p className="mb-2 text-sm text-muted">Versiones anteriores ({versions.length}):</p>
                <div className="space-y-2">
                  {versions.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setBlocks(v.blocks)}
                      className="block w-full rounded-lg border border-border px-3 py-2 text-left text-xs text-muted transition hover:border-gold hover:text-gold"
                    >
                      <time>{new Date(v.created_at).toLocaleString("es-CO")}</time> — restaurar
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Columna lateral: guiones guardados */}
      <aside>
        <h3 className="mb-3 text-lg text-cream">Guiones guardados</h3>
        {scripts.length === 0 ? (
          <p className="text-sm text-muted">Aún no tienes guiones.</p>
        ) : (
          <div className="space-y-2">
            {scripts.map((s) => (
              <div
                key={s.id}
                className={`card flex items-center justify-between p-3 ${
                  currentId === s.id ? "border-gold" : ""
                }`}
              >
                <button onClick={() => open(s.id)} className="flex-1 text-left">
                  <p className="text-sm text-cream">{s.title}</p>
                  <p className="font-mono text-xs text-muted">{s.duration} · {s.tone}</p>
                </button>
                <button onClick={() => remove(s.id)} className="ml-2 text-muted hover:text-red-400">✕</button>
              </div>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}
