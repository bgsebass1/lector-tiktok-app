import { useState } from "react";
import { api, type HookItem } from "../../lib/api";
import { notifyOk, notifyGrokError } from "../../lib/notify";
import GrokLoading from "../GrokLoading";

/**
 * Laboratorio de hooks (Módulo 2).
 * Genera 10 hooks en estilos distintos; cada uno se puede enviar al editor de
 * guiones o pedir más variaciones del mismo.
 */
export default function HooksLab({ onUseHook }: { onUseHook: (hook: string) => void }) {
  const [topic, setTopic] = useState("");
  const [hooks, setHooks] = useState<HookItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);

  async function generate() {
    if (!topic.trim()) return notifyGrokError(new Error("Escribe un tema."));
    setLoading(true);
    try {
      const { hooks: h } = await api.generateHooks(topic);
      setHooks(h);
    } catch (err) {
      notifyGrokError(err, generate);
    } finally {
      setLoading(false);
    }
  }

  async function more(index: number) {
    setBusy(index);
    try {
      const { hooks: variations } = await api.moreHooks(hooks[index].text, topic);
      // Insertamos las variaciones justo después del hook base.
      setHooks((prev) => [
        ...prev.slice(0, index + 1),
        ...variations,
        ...prev.slice(index + 1),
      ]);
    } catch (err) {
      notifyGrokError(err, () => more(index));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <input
          className="input flex-1"
          placeholder="Tema o concepto (ej: el lenguaje privado)"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && generate()}
        />
        <button onClick={generate} disabled={loading} className="btn-gold">
          {loading ? "Generando…" : "Generar 10 hooks"}
        </button>
      </div>

      {loading && <GrokLoading />}

      {hooks.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
          {hooks.map((h, i) => (
            <div key={i} className="card p-4">
              <p className="mb-2 text-xs uppercase tracking-wide text-gold">{h.style}</p>
              <p className="font-serif text-lg italic text-cream">“{h.text}”</p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => onUseHook(h.text)} className="btn-gold text-xs">
                  Usar este
                </button>
                <button
                  onClick={() => more(i)}
                  disabled={busy === i}
                  className="btn-ghost text-xs"
                >
                  {busy === i ? "…" : "Más como este"}
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(h.text);
                    notifyOk("Hook copiado.");
                  }}
                  className="btn-ghost text-xs"
                >
                  Copiar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
