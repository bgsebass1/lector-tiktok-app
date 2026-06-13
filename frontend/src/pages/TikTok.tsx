import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from "recharts";
import { api, type TikTokAnalytics } from "../lib/api";
import { notifyGrokError } from "../lib/notify";
import GrokLoading from "../components/GrokLoading";
import { CardListSkeleton } from "../components/Skeleton";

/**
 * DASHBOARD DE TIKTOK con analytics avanzado (Módulo 10).
 * Datos mock servidos por el backend (listos para Windsor.ai).
 *
 * TODO: conectar Windsor.ai API (el backend ya tiene la firma en
 * services/tiktok-analytics.service.ts).
 */
const GOLD = "#d4af37";
const PIE_COLORS = ["#d4af37", "#8a8a82", "#5a7d9a", "#9a7db0", "#7da06a", "#b08a6a"];

export default function TikTok() {
  const [data, setData] = useState<TikTokAnalytics | null>(null);
  const [insights, setInsights] = useState<string[] | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    api.getTikTokAnalytics().then(setData).catch(() => {});
  }, []);

  async function analyze() {
    setAnalyzing(true);
    setInsights(null);
    try {
      const { insights: list } = await api.analyzeTikTok();
      setInsights(list);
    } catch (err) {
      notifyGrokError(err, analyze);
    } finally {
      setAnalyzing(false);
    }
  }

  if (!data) return <CardListSkeleton count={4} />;

  const { overview, topVideos, demographics, postingTimes, engagementByTopic } = data;
  const delta = (cur: number, prev: number) => (((cur - prev) / prev) * 100).toFixed(1);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-4xl text-cream">Dashboard de TikTok</h1>
          <p className="mt-1 text-muted">Datos de ejemplo · listos para conectar Windsor.ai</p>
        </div>
        <button onClick={analyze} disabled={analyzing} className="btn-gold">
          {analyzing ? "Analizando…" : "🤖 Analizar mi rendimiento con IA"}
        </button>
      </div>

      {/* Insights de IA */}
      {(analyzing || insights) && (
        <section className="card mb-8 p-6">
          <h2 className="mb-3 text-xl text-cream">Insights de IA</h2>
          {analyzing ? <GrokLoading /> : (
            <ul className="space-y-2">
              {insights?.map((ins, i) => (
                <li key={i} className="flex gap-2 text-sm text-cream/90">
                  <span className="text-gold">→</span> {ins}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Métricas con comparativa 30 vs 30 días */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Metric label="Seguidores" value={overview.followers.toLocaleString("es-CO")} delta={delta(overview.comparison.followers.current, overview.comparison.followers.previous)} />
        <Metric label="Vistas (30d)" value={overview.comparison.views.current.toLocaleString("es-CO")} delta={delta(overview.comparison.views.current, overview.comparison.views.previous)} />
        <Metric label="Engagement" value={`${overview.engagementRate}%`} delta={delta(overview.comparison.engagement.current, overview.comparison.engagement.previous)} />
      </div>

      {/* Crecimiento de seguidores */}
      <section className="card mb-8 p-6">
        <h2 className="mb-4 text-xl text-cream">Crecimiento de seguidores (30 días)</h2>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={overview.followerSeries}>
            <CartesianGrid stroke="#262626" strokeDasharray="3 3" />
            <XAxis dataKey="date" stroke="#8a8a82" tick={{ fontSize: 11 }} tickFormatter={(d: string) => d.slice(5)} />
            <YAxis stroke="#8a8a82" tick={{ fontSize: 11 }} domain={["auto", "auto"]} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="followers" stroke={GOLD} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </section>

      {/* Heatmap de mejores horas */}
      <section className="card mb-8 p-6">
        <h2 className="mb-4 text-xl text-cream">Mejores horas para publicar</h2>
        <Heatmap cells={postingTimes} />
      </section>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Engagement por tema */}
        <section className="card p-6">
          <h2 className="mb-4 text-xl text-cream">Engagement por tema</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={engagementByTopic}>
              <CartesianGrid stroke="#262626" strokeDasharray="3 3" />
              <XAxis dataKey="topic" stroke="#8a8a82" tick={{ fontSize: 11 }} />
              <YAxis stroke="#8a8a82" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#ffffff08" }} />
              <Bar dataKey="avgEngagement" fill={GOLD} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>

        {/* Demografía: género (donut) */}
        <section className="card p-6">
          <h2 className="mb-4 text-xl text-cream">Audiencia por género</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={demographics.gender} dataKey="percent" nameKey="label" innerRadius={55} outerRadius={90} paddingAngle={2}>
                {demographics.gender.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12, color: "#8a8a82" }} />
            </PieChart>
          </ResponsiveContainer>
        </section>

        {/* Demografía: edad (bar) */}
        <section className="card p-6">
          <h2 className="mb-4 text-xl text-cream">Audiencia por edad</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={demographics.age}>
              <CartesianGrid stroke="#262626" strokeDasharray="3 3" />
              <XAxis dataKey="range" stroke="#8a8a82" tick={{ fontSize: 11 }} />
              <YAxis stroke="#8a8a82" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#ffffff08" }} />
              <Bar dataKey="percent" fill="#5a7d9a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>

        {/* Demografía: países (donut) */}
        <section className="card p-6">
          <h2 className="mb-4 text-xl text-cream">Audiencia por país</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={demographics.countries} dataKey="percent" nameKey="country" outerRadius={90}>
                {demographics.countries.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12, color: "#8a8a82" }} />
            </PieChart>
          </ResponsiveContainer>
        </section>
      </div>

      {/* Top videos con retención */}
      <section className="card overflow-hidden">
        <h2 className="border-b border-border p-6 text-xl text-cream">Top videos</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-muted">
              <tr className="border-b border-border">
                <th className="p-4 font-medium">Video</th>
                <th className="p-4 font-medium">Caption</th>
                <th className="p-4 text-right font-medium">Vistas</th>
                <th className="p-4 text-right font-medium">Likes</th>
                <th className="p-4 text-right font-medium">Retención</th>
              </tr>
            </thead>
            <tbody>
              {topVideos.map((v) => (
                <tr key={v.id} className="border-b border-border/50 transition hover:bg-carbon/40">
                  <td className="p-4"><img src={v.thumbnail} alt="" className="h-16 w-12 rounded border border-border object-cover" /></td>
                  <td className="max-w-xs p-4 text-cream/90">{v.caption}</td>
                  <td className="stat p-4 text-right">{v.views.toLocaleString("es-CO")}</td>
                  <td className="stat p-4 text-right">{v.likes.toLocaleString("es-CO")}</td>
                  <td className="p-4 text-right">
                    {/* Barra de retención */}
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-carbon">
                        <div className="h-full rounded-full bg-gold" style={{ width: `${v.retention}%` }} />
                      </div>
                      <span className="stat text-xs text-muted">{v.retention}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

/* ---------- Sub-componentes ---------- */

const tooltipStyle = { background: "#141414", border: "1px solid #262626", borderRadius: 8, color: "#f5f0e1" };

function Metric({ label, value, delta }: { label: string; value: string; delta: string }) {
  const positive = Number(delta) >= 0;
  return (
    <div className="card p-6">
      <p className="text-sm text-muted">{label}</p>
      <p className="stat mt-2 text-4xl text-gold">{value}</p>
      <p className={`stat mt-1 text-sm ${positive ? "text-green-400" : "text-red-400"}`}>
        {positive ? "▲" : "▼"} {Math.abs(Number(delta))}% vs 30d previos
      </p>
    </div>
  );
}

/** Heatmap día (filas) × hora (columnas) coloreado por score. */
function Heatmap({ cells }: { cells: Array<{ day: number; hour: number; score: number }> }) {
  const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const max = Math.max(...cells.map((c) => c.score), 1);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        {/* Horas (cabecera) */}
        <div className="mb-1 flex">
          <div className="w-10 shrink-0" />
          {Array.from({ length: 24 }).map((_, h) => (
            <div key={h} className="flex-1 text-center font-mono text-[9px] text-muted">{h}</div>
          ))}
        </div>
        {days.map((dayLabel, day) => (
          <div key={day} className="mb-0.5 flex items-center">
            <div className="w-10 shrink-0 font-mono text-xs text-muted">{dayLabel}</div>
            {Array.from({ length: 24 }).map((_, hour) => {
              const cell = cells.find((c) => c.day === day && c.hour === hour);
              const intensity = cell ? cell.score / max : 0;
              return (
                <div
                  key={hour}
                  className="mx-px h-5 flex-1 rounded-sm"
                  style={{ background: `rgba(212,175,55,${intensity.toFixed(2)})` }}
                  title={`${dayLabel} ${hour}:00 · score ${cell?.score ?? 0}`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
