import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, type Book, type ReadingStats, type ReadingSession } from "../lib/api";
import ReadingHeatmap from "../components/ReadingHeatmap";

/** Formatea minutos como "Xh Ym". */
export function fmtMin(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

/**
 * LEER — hub de sesiones de lectura.
 * Stats globales + elegir libro para leer + sesiones recientes.
 */
export default function Leer() {
  const [books, setBooks] = useState<Book[]>([]);
  const [stats, setStats] = useState<ReadingStats | null>(null);
  const [sessions, setSessions] = useState<ReadingSession[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.listBooks().then(setBooks).catch(() => {});
    api.readingStats().then(setStats).catch(() => {});
    api.listSessions().then((s) => setSessions(s.slice(0, 8))).catch(() => {});
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-4xl text-cream">Leer</h1>
        <p className="mt-1 text-muted">Cronometra tu lectura y guarda lo que descubres.</p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <Stat label="Tiempo total" value={stats ? fmtMin(stats.totalMinutes) : "—"} />
        <Stat label="Sesiones" value={stats?.totalSessions ?? 0} />
        <Stat label="Libros" value={stats?.booksTouched ?? 0} />
      </div>

      {/* Heatmap anual */}
      <div className="mb-8">
        <h2 className="mb-3 text-2xl text-cream">Tu año de lectura</h2>
        <div className="card p-4">
          <ReadingHeatmap />
        </div>
      </div>

      {/* Elegir libro */}
      <h2 className="mb-3 text-2xl text-cream">¿Qué vas a leer?</h2>
      {books.length === 0 ? (
        <p className="text-muted">Agrega libros en la sección Libros para empezar a leer.</p>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {books.map((b) => (
            <button key={b.id} onClick={() => navigate(`/leer/${b.id}`)} className="card overflow-hidden text-left transition hover:border-gold">
              <div className="flex aspect-[2/3] items-center justify-center bg-surface">
                {b.cover_url ? (
                  <img src={b.cover_url} alt={b.title} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-3xl">📖</span>
                )}
              </div>
              <div className="truncate p-2 text-xs text-cream">{b.title}</div>
            </button>
          ))}
        </div>
      )}

      {/* Sesiones recientes */}
      {sessions.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-3 text-2xl text-cream">Sesiones recientes</h2>
          <div className="space-y-2">
            {sessions.map((s) => (
              <div key={s.id} className="card flex items-center justify-between gap-3 p-3 text-sm">
                <span className="text-cream">{s.book_title ?? "Lectura"}</span>
                <span className="text-muted">
                  {fmtMin(s.minutes)}{s.pages ? ` · ${s.pages} pp` : ""} · {s.created_at.slice(0, 10)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card p-4 text-center">
      <div className="font-serif text-2xl text-cream">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wide text-muted">{label}</div>
    </div>
  );
}
