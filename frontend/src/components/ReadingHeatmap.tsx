import { useEffect, useState } from "react";
import { api } from "../lib/api";

/** Fecha local en formato YYYY-MM-DD (sin desfase de zona horaria). */
function dateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const COLORS = [
  "rgb(var(--surface))",
  "rgb(var(--gold) / 0.3)",
  "rgb(var(--gold) / 0.55)",
  "rgb(var(--gold) / 0.8)",
  "rgb(var(--gold))",
];

function level(min: number): number {
  if (!min) return 0;
  if (min < 15) return 1;
  if (min < 30) return 2;
  if (min < 60) return 3;
  return 4;
}

/** Heatmap estilo GitHub con los minutos de lectura del último año. */
export default function ReadingHeatmap() {
  const [map, setMap] = useState<Record<string, number>>({});

  useEffect(() => {
    api
      .readingHeatmap()
      .then((rows) => {
        const m: Record<string, number> = {};
        rows.forEach((r) => { m[r.d] = r.m; });
        setMap(m);
      })
      .catch(() => {});
  }, []);

  // 53 semanas hasta hoy, alineadas a domingo.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - 363);
  start.setDate(start.getDate() - start.getDay());

  const weeks: Date[][] = [];
  let cur = new Date(start);
  while (cur <= today) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
  }

  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex gap-1">
        {weeks.map((w, i) => (
          <div key={i} className="flex flex-col gap-1">
            {w.map((d, j) => {
              const k = dateStr(d);
              const min = map[k] || 0;
              const future = d > today;
              return (
                <span
                  key={j}
                  title={`${k}: ${min} min`}
                  className="h-3 w-3 rounded-sm"
                  style={{ backgroundColor: future ? "transparent" : COLORS[level(min)] }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
