import { useState } from "react";
import { api, type CaptionPack } from "../../lib/api";
import { notifyOk, notifyGrokError } from "../../lib/notify";
import GrokLoading from "../GrokLoading";

/**
 * Caption & Hashtags (Módulo 8).
 * Pegas el guion y Grok genera captions, sets de hashtags, textos en pantalla
 * e ideas de thumbnail.
 */
export default function CaptionsTab() {
  const [script, setScript] = useState("");
  const [pack, setPack] = useState<CaptionPack | null>(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    if (!script.trim()) return notifyGrokError(new Error("Pega el guion."));
    setLoading(true);
    try {
      setPack(await api.generateCaptions(script));
    } catch (err) {
      notifyGrokError(err, generate);
    } finally {
      setLoading(false);
    }
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    notifyOk("Copiado.");
  }

  return (
    <div>
      <textarea
        className="input min-h-[140px] resize-y"
        placeholder="Pega aquí el guion del video…"
        value={script}
        onChange={(e) => setScript(e.target.value)}
      />
      <button onClick={generate} disabled={loading} className="btn-gold mt-3">
        {loading ? "Generando…" : "Generar captions & hashtags"}
      </button>

      {loading && <GrokLoading />}

      {pack && (
        <div className="mt-6 space-y-6">
          {/* Captions */}
          <section>
            <h3 className="mb-3 text-lg text-cream">Captions</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {(["corta", "media", "larga"] as const).map((k) => (
                <div key={k} className="card p-4">
                  <p className="mb-2 text-xs uppercase tracking-wide text-gold">{k}</p>
                  <p className="whitespace-pre-wrap text-sm text-cream/90">{pack.captions[k]}</p>
                  <button onClick={() => copy(pack.captions[k])} className="btn-ghost mt-3 text-xs">
                    Copiar
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Hashtags */}
          <section>
            <h3 className="mb-3 text-lg text-cream">Hashtags</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {(["mainstream", "nicho", "longtail"] as const).map((k) => (
                <div key={k} className="card p-4">
                  <p className="mb-2 text-xs uppercase tracking-wide text-gold">{k}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {pack.hashtags[k].map((h, i) => (
                      <span key={i} className="rounded-full bg-carbon px-2.5 py-1 text-xs text-gold">
                        {h}
                      </span>
                    ))}
                  </div>
                  <button onClick={() => copy(pack.hashtags[k].join(" "))} className="btn-ghost mt-3 text-xs">
                    Copiar grupo
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Textos en pantalla + thumbnails */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <section className="card p-4">
              <h3 className="mb-3 text-lg text-cream">Texto en pantalla (primeros 3s)</h3>
              <ul className="space-y-2">
                {pack.onScreenTexts.map((t, i) => (
                  <li key={i} className="text-sm text-cream/90">• {t}</li>
                ))}
              </ul>
            </section>
            <section className="card p-4">
              <h3 className="mb-3 text-lg text-cream">Ideas de thumbnail</h3>
              <ul className="space-y-2">
                {pack.thumbnails.map((t, i) => (
                  <li key={i} className="text-sm text-cream/90">• {t}</li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
