import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, type CourseDayFull } from "../lib/api";
import { notifyOk, notifyGrokError } from "../lib/notify";

const SKILL_LABELS: Record<string, string> = {
  claridad: "Claridad", observacion: "Observación", originalidad: "Originalidad", profundidad: "Profundidad", estilo: "Estilo",
};
function scoreColor(s: number): string {
  if (s >= 8) return "text-emerald-400";
  if (s >= 6) return "text-amber-400";
  if (s >= 4) return "text-orange-400";
  return "text-rose-400";
}

/** TALLER · DÍA — teoría + ejercicio + escritura + calificación. */
export default function TallerDia() {
  const { day } = useParams();
  const d = Number(day);
  const navigate = useNavigate();

  const [data, setData] = useState<CourseDayFull | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState(false);

  function load() {
    setErr(false);
    api.courseDay(d).then((r) => { setData(r); setText(r.user_text || ""); }).catch(() => setErr(true));
  }
  useEffect(load, [d]);

  async function generate(feedback?: string) {
    setBusy("gen");
    try {
      await api.courseGenerate(d, feedback);
      load();
    } catch (e) { notifyGrokError(e); } finally { setBusy(null); }
  }

  async function save() {
    setBusy("save");
    try { await api.courseSaveText(d, text); notifyOk("Guardado."); load(); }
    catch (e) { notifyGrokError(e); } finally { setBusy(null); }
  }

  async function evaluate() {
    setBusy("eval");
    try {
      await api.courseSaveText(d, text); // aseguramos el texto guardado
      const r = await api.courseEvaluate(d);
      setData((prev) => prev ? { ...prev, score: r.score, score_detail: r.score_detail, score_reason: r.score_reason } : prev);
      load();
    } catch (e) { notifyGrokError(e); } finally { setBusy(null); }
  }

  function improve() {
    const fb = prompt("¿Qué quieres cambiar del tema o enfoque de hoy?");
    if (fb && fb.trim()) generate(fb.trim());
  }

  if (err) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-muted">No se pudo cargar este día. Revisa tu conexión.</p>
        <button onClick={load} className="btn-gold mt-4">Reintentar</button>
        <button onClick={() => navigate("/taller")} className="btn-ghost mt-3 block w-full">← Volver al taller</button>
      </div>
    );
  }
  if (!data) return <p className="py-16 text-center text-muted">Cargando…</p>;
  const m = data.meta;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between gap-2">
        <button onClick={() => navigate("/taller")} className="btn-ghost !px-3 !py-1.5 text-sm">← Taller</button>
        <div className="flex gap-2">
          <button onClick={() => navigate(`/taller/${Math.max(1, d - 1)}`)} disabled={d <= 1} className="btn-ghost !px-3 !py-1.5 text-sm disabled:opacity-30">‹</button>
          <button onClick={() => navigate(`/taller/${Math.min(60, d + 1)}`)} disabled={d >= 60} className="btn-ghost !px-3 !py-1.5 text-sm disabled:opacity-30">›</button>
        </div>
      </div>

      <p className="text-sm text-muted">Día {m.day} · Semana {m.week} — {m.weekTitle}</p>
      <h1 className="mt-1 text-3xl text-cream">{m.title}{m.project && <span className="ml-2 text-base text-gold">★ proyecto</span>}</h1>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {m.skills.map((s) => <span key={s} className="rounded-full border border-border px-2 py-0.5 text-xs text-muted">{s}</span>)}
      </div>

      {!data.theory ? (
        <div className="card mt-6 p-6 text-center">
          <p className="text-muted">{m.brief}</p>
          <button onClick={() => generate()} disabled={busy === "gen"} className="btn-gold mt-4">{busy === "gen" ? "Preparando la lección…" : "Generar lección del día"}</button>
        </div>
      ) : (
        <>
          {/* Teoría */}
          <section className="card mt-5 p-5">
            <div className="mb-1 text-xs uppercase tracking-wide text-muted">Teoría · 10-15 min</div>
            <p className="whitespace-pre-wrap font-serif text-lg leading-relaxed text-cream/90">{data.theory}</p>
          </section>

          {/* Ejercicio */}
          <section className="card mt-4 border-l-4 border-l-gold p-5">
            <div className="mb-1 text-xs uppercase tracking-wide text-gold">Ejercicio · 35-40 min</div>
            <p className="whitespace-pre-wrap text-cream">{data.exercise}</p>
            {data.criteria && data.criteria.length > 0 && (
              <div className="mt-3">
                <div className="text-xs uppercase tracking-wide text-muted">Autoevaluación</div>
                <ul className="mt-1 list-inside list-disc text-sm text-cream/80">{data.criteria.map((c, i) => <li key={i}>{c}</li>)}</ul>
              </div>
            )}
            <button onClick={improve} disabled={busy === "gen"} className="mt-3 text-xs text-muted hover:text-gold">🔁 No me gusta el tema — mejorarlo</button>
          </section>

          {/* Escritura */}
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Escribe aquí tu ejercicio…" className="input mt-4 min-h-[240px] resize-y font-serif text-lg" />
          <div className="mt-2 flex flex-wrap gap-2">
            <button onClick={save} disabled={!!busy} className="btn-ghost">{busy === "save" ? "Guardando…" : "Guardar"}</button>
            <button onClick={evaluate} disabled={!!busy || !text.trim()} className="btn-gold">{busy === "eval" ? "Evaluando…" : "✨ Calificar mi ejercicio"}</button>
          </div>

          {/* Calificación */}
          {data.score != null && data.score_detail && (
            <div className="mt-5 rounded-xl border border-border bg-surface/60 p-5">
              <div className="flex items-baseline gap-2">
                <span className={`font-mono text-3xl ${scoreColor(data.score)}`}>{data.score}</span>
                <span className="text-muted">/ 10</span>
              </div>
              {data.score_reason?.veredicto && <p className="mt-1 text-sm text-cream/90">{data.score_reason.veredicto}</p>}
              <div className="mt-3 space-y-1.5">
                {Object.entries(data.score_detail).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-2 text-xs">
                    <span className="w-24 text-muted">{SKILL_LABELS[k] ?? k}</span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface"><span className="block h-full rounded-full bg-gold" style={{ width: `${v * 10}%` }} /></span>
                    <span className="w-5 text-right font-mono text-cream">{v}</span>
                  </div>
                ))}
              </div>
              {data.score_reason?.fuerte && <p className="mt-3 text-sm text-emerald-300">✓ {data.score_reason.fuerte}</p>}
              {data.score_reason?.mejora && <p className="mt-1 text-sm text-amber-300">→ {data.score_reason.mejora}</p>}
              {d < 60 && <button onClick={() => navigate(`/taller/${d + 1}`)} className="btn-gold mt-4">Siguiente día →</button>}
            </div>
          )}
        </>
      )}
    </div>
  );
}
