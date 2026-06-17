import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toPng } from "html-to-image";
import { api, type Book } from "../lib/api";
import { notifyError } from "../lib/notify";

/** EL DIARIO DE LECTURA — REVISIÓN ANUAL (G14), estilo Wrapped. */
export default function Wrapped() {
  const [books, setBooks] = useState<Book[]>([]);
  const [minutes, setMinutes] = useState(0);
  const [streak, setStreak] = useState(0);
  const [i, setI] = useState(0);
  const posterRef = useRef<HTMLDivElement>(null);

  const year = new Date().getFullYear();

  useEffect(() => {
    api.listBooks().then(setBooks).catch(() => {});
    api.readingStats().then((s) => { setMinutes(s.totalMinutes); setStreak(s.streak); }).catch(() => {});
  }, []);

  const yearBooks = books.filter((b) => (b.read_date ?? b.created_at).startsWith(String(year)));
  const authorCount: Record<string, number> = {};
  yearBooks.forEach((b) => { authorCount[b.author] = (authorCount[b.author] ?? 0) + 1; });
  const topAuthor = Object.entries(authorCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
  const top5 = [...yearBooks].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 5);

  const slides: Array<{ big: string; small: string }> = [
    { big: `Tu año de lectura`, small: `${year} en Pliego` },
    { big: `${yearBooks.length}`, small: yearBooks.length === 1 ? "libro este año" : "libros este año" },
    { big: topAuthor, small: "tu autor más leído" },
    { big: `${Math.floor(minutes / 60)}h ${minutes % 60}m`, small: `leyendo · ${streak} días de racha` },
    { big: "Tu estilo", small: `se parece al de ${topAuthor}` },
  ];

  async function share() {
    if (!posterRef.current) return;
    try {
      const url = await toPng(posterRef.current, { pixelRatio: 3, backgroundColor: "#0a0a0a" });
      const a = document.createElement("a");
      a.href = url;
      a.download = `pliego-wrapped-${year}.png`;
      a.click();
    } catch (e) {
      notifyError(e);
    }
  }

  const isPoster = i === slides.length;
  const total = slides.length + 1;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-carbon px-6">
      {/* Progreso */}
      <div className="absolute left-0 right-0 top-3 flex gap-1 px-4">
        {Array.from({ length: total }).map((_, j) => (
          <span key={j} className={`h-1 flex-1 rounded-full ${j <= i ? "bg-gold" : "bg-border"}`} />
        ))}
      </div>
      <button onClick={() => history.back()} className="absolute right-4 top-6 text-sm text-muted hover:text-cream">✕</button>

      <div className="w-full max-w-md flex-1 flex items-center justify-center" onClick={() => !isPoster && setI((v) => v + 1)}>
        <AnimatePresence mode="wait">
          {!isPoster ? (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="cursor-pointer text-center">
              <div className="font-display text-6xl leading-tight text-cream">{slides[i].big}</div>
              <div className="mt-4 font-serif text-xl text-muted">{slides[i].small}</div>
              <div className="mt-10 text-xs text-muted">toca para continuar</div>
            </motion.div>
          ) : (
            <motion.div key="poster" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
              {/* Póster 9:16 para compartir */}
              <div ref={posterRef} className="mx-auto flex aspect-[9/16] w-[260px] flex-col justify-between rounded-xl border border-gold/30 bg-carbon p-6">
                <div>
                  <div className="text-sm uppercase tracking-widest text-gold">Pliego · {year}</div>
                  <div className="mt-6 font-display text-4xl text-cream">{yearBooks.length} libros</div>
                  <div className="mt-1 font-serif text-muted">{Math.floor(minutes / 60)}h de lectura</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted">Top del año</div>
                  {top5.map((b, k) => (
                    <div key={b.id} className="mt-1 truncate font-serif text-cream">{k + 1}. {b.title}</div>
                  ))}
                </div>
                <div className="font-serif italic text-gold">“Leer poco a poco, pero todos los días.”</div>
              </div>
              <button onClick={share} className="btn-gold mx-auto mt-6 block">📷 Compartir como imagen</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
