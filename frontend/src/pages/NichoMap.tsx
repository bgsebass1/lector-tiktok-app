import { useState } from "react";
import { api } from "../lib/api";
import { notifyGrokError } from "../lib/notify";

interface Nicho {
  name: string;
  size: number; // 1-3
  referentes: string[];
}
const NICHOS: Nicho[] = [
  { name: "Filosofía pop", size: 3, referentes: ["Filosofía en la calle", "The School of Life"] },
  { name: "Divulgación literaria", size: 3, referentes: ["BookTubers clásicos", "Reseñas de culto"] },
  { name: "Etimología", size: 2, referentes: ["Origen de las palabras", "Lingüistas divulgadores"] },
  { name: "Historia del arte", size: 2, referentes: ["Cuadros con historia", "Arte explicado"] },
  { name: "Mitología", size: 2, referentes: ["Mitos y leyendas", "Dioses y héroes"] },
  { name: "Psicología", size: 3, referentes: ["Psicología divulgativa", "Salud mental"] },
  { name: "Historia", size: 2, referentes: ["Historia en breve", "Curiosidades históricas"] },
  { name: "Escritura creativa", size: 1, referentes: ["Tips de escritura", "Talleres breves"] },
];

const W = 600, H = 560, CX = W / 2, CY = H / 2;

/** NICHO MAP (G18) — galaxia de nichos alrededor de tu canal. */
export default function NichoMap() {
  const [sel, setSel] = useState<Nicho | null>(null);
  const [tip, setTip] = useState("");
  const [busy, setBusy] = useState(false);

  async function nextStep(n: Nicho) {
    setSel(n);
    setTip("");
    setBusy(true);
    try { setTip((await api.nichoNext(n.name)).text); } catch (e) { notifyGrokError(e); } finally { setBusy(false); }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4">
        <h1 className="text-4xl text-cream">Nicho map</h1>
        <p className="mt-1 text-muted">Tu canal y los mundos cercanos. Toca un planeta para explorarlo.</p>
      </div>

      <div className="card p-2">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
          {NICHOS.map((n, i) => {
            const ang = (i / NICHOS.length) * Math.PI * 2 - Math.PI / 2;
            const dist = 150 + (i % 3) * 38;
            const x = CX + Math.cos(ang) * dist;
            const y = CY + Math.sin(ang) * dist;
            const r = 16 + n.size * 9;
            const active = sel?.name === n.name;
            return (
              <g key={n.name} onClick={() => nextStep(n)} className="cursor-pointer">
                <line x1={CX} y1={CY} x2={x} y2={y} stroke="rgb(var(--border))" strokeWidth={1} strokeDasharray="3 4" />
                <circle cx={x} cy={y} r={r} fill="rgb(var(--surface))" stroke={active ? "rgb(var(--gold))" : "rgb(var(--muted))"} strokeWidth={active ? 2 : 1} />
                <text x={x} y={y + r + 14} textAnchor="middle" fontSize="12" fill="rgb(var(--cream))" className="font-serif">{n.name}</text>
              </g>
            );
          })}
          {/* Centro: tu canal */}
          <circle cx={CX} cy={CY} r={40} fill="rgb(var(--gold) / 0.15)" stroke="rgb(var(--gold))" strokeWidth={2} />
          <text x={CX} y={CY - 2} textAnchor="middle" fontSize="13" fill="rgb(var(--gold))" className="font-display">Tu</text>
          <text x={CX} y={CY + 14} textAnchor="middle" fontSize="13" fill="rgb(var(--gold))" className="font-display">canal</text>
        </svg>
      </div>

      {sel && (
        <div className="mt-4 rounded-xl border border-border bg-surface/60 p-5">
          <h2 className="font-display text-2xl text-cream">{sel.name}</h2>
          <p className="mt-1 text-sm text-muted">Referentes: {sel.referentes.join(" · ")}</p>
          <div className="mt-3 rounded-lg border border-gold/40 bg-gold/5 p-3">
            <div className="text-xs uppercase tracking-wide text-muted">✨ Tu próximo paso</div>
            <p className="mt-1 text-cream">{busy ? "Pensando…" : tip || "—"}</p>
          </div>
        </div>
      )}
    </div>
  );
}
