import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, type CourseOverview } from "../lib/api";

/** TALLER DE ESCRITURA — 60 días (overview). */
export default function Taller() {
  const [data, setData] = useState<CourseOverview | null>(null);
  const navigate = useNavigate();

  useEffect(() => { api.courseOverview().then(setData).catch(() => {}); }, []);

  if (!data) return null;

  // Agrupar por semana.
  const weeks: Record<number, typeof data.days> = {};
  data.days.forEach((d) => { (weeks[d.week] ??= []).push(d); });
  const pct = Math.round((data.done / data.total) * 100);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5">
        <h1 className="text-4xl text-cream">Taller de escritura</h1>
        <p className="mt-1 text-muted">60 días para encontrar tu voz. Una hora al día: teoría, escritura y reflexión.</p>
      </div>

      {/* Progreso */}
      <div className="card mb-6 p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-cream">{data.done} / {data.total} días</span>
          <button onClick={() => navigate(`/taller/${data.current}`)} className="text-gold hover:underline">Continuar en el día {data.current} →</button>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface">
          <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Semanas */}
      <div className="space-y-6">
        {Object.entries(weeks).map(([w, days]) => (
          <div key={w}>
            <h2 className="mb-2 font-display text-xl text-cream">Semana {w} · <span className="text-muted">{data.weekTitles[Number(w)]}</span></h2>
            <div className="space-y-1.5">
              {days.map((d) => (
                <button key={d.day} onClick={() => navigate(`/taller/${d.day}`)} className={`card flex w-full items-center gap-3 p-3 text-left transition hover:border-gold ${d.project ? "border-l-4 border-l-gold" : ""}`}>
                  <span className="w-8 shrink-0 text-center font-mono text-sm text-muted">{d.day}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-cream">{d.title}{d.project && <span className="ml-2 text-xs text-gold">★ proyecto</span>}</span>
                  </span>
                  {d.done ? <span className="shrink-0 text-sm text-emerald-400">✓ {d.score ?? ""}</span> : d.generated ? <span className="shrink-0 text-xs text-muted">empezado</span> : null}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
