import { useState } from "react";
import { api, type RepurposePack } from "../../lib/api";
import { notifyOk, notifyGrokError } from "../../lib/notify";
import GrokLoading from "../GrokLoading";

/**
 * Repurposing multiplataforma (Módulo 9).
 * Convierte un guion en hilo de X, carrusel de IG, post de LinkedIn,
 * newsletter y caption de Reels. Cada formato se puede copiar.
 */
export default function RepurposeTab() {
  const [script, setScript] = useState("");
  const [pack, setPack] = useState<RepurposePack | null>(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    if (!script.trim()) return notifyGrokError(new Error("Pega el guion."));
    setLoading(true);
    try {
      setPack(await api.repurpose(script));
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
        {loading ? "Adaptando…" : "Adaptar a otras plataformas"}
      </button>

      {loading && <GrokLoading />}

      {pack && (
        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Hilo de X */}
          <section className="card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg text-cream">𝕏 Hilo de Twitter/X</h3>
              <button onClick={() => copy(pack.twitterThread.join("\n\n"))} className="btn-ghost text-xs">Copiar</button>
            </div>
            <ol className="space-y-2">
              {pack.twitterThread.map((t, i) => (
                <li key={i} className="rounded-lg bg-carbon p-3 text-sm text-cream/90">
                  <span className="mr-2 font-mono text-xs text-muted">{i + 1}/{pack.twitterThread.length}</span>
                  {t}
                </li>
              ))}
            </ol>
          </section>

          {/* Carrusel de IG */}
          <section className="card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg text-cream">📸 Carrusel de Instagram</h3>
              <button
                onClick={() => copy(pack.instagramCarousel.map((s) => `${s.titulo}\n${s.cuerpo}`).join("\n\n"))}
                className="btn-ghost text-xs"
              >
                Copiar
              </button>
            </div>
            <div className="space-y-2">
              {pack.instagramCarousel.map((s, i) => (
                <div key={i} className="rounded-lg bg-carbon p-3">
                  <p className="font-serif text-base text-gold">{i + 1}. {s.titulo}</p>
                  <p className="mt-1 text-sm text-cream/90">{s.cuerpo}</p>
                </div>
              ))}
            </div>
          </section>

          {/* LinkedIn */}
          <section className="card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg text-cream">💼 LinkedIn</h3>
              <button onClick={() => copy(pack.linkedin)} className="btn-ghost text-xs">Copiar</button>
            </div>
            <p className="whitespace-pre-wrap text-sm text-cream/90">{pack.linkedin}</p>
          </section>

          {/* Newsletter + Reels */}
          <section className="card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg text-cream">📧 Newsletter</h3>
              <button onClick={() => copy(pack.newsletter)} className="btn-ghost text-xs">Copiar</button>
            </div>
            <p className="whitespace-pre-wrap text-sm text-cream/90">{pack.newsletter}</p>
            <hr className="my-4 border-border" />
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-lg text-cream">🎞️ Caption Reels/Shorts</h3>
              <button onClick={() => copy(pack.reelsCaption)} className="btn-ghost text-xs">Copiar</button>
            </div>
            <p className="whitespace-pre-wrap text-sm text-cream/90">{pack.reelsCaption}</p>
          </section>
        </div>
      )}
    </div>
  );
}
