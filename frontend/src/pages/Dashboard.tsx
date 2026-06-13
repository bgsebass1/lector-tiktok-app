import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  api,
  type Book,
  type PipelineCard,
  type SavedIdeas,
  type Quote,
  type Word,
} from "../lib/api";

/**
 * DASHBOARD PRINCIPAL (Módulo 11).
 * Resumen tipo "home" con widgets: saludo, próximos videos, ideas frescas,
 * última lectura, cita y palabra del día, y stats rápidas.
 * El botón flotante "+" es global (RadialMenu en App.tsx).
 */

/** Saludo según la hora del día. */
function greeting(): string {
  const h = new Date().getHours();
  if (h < 6) return "Aún despierto";
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

/** Elige un elemento "del día" de forma estable (cambia cada día). */
function pickOfDay<T>(arr: T[]): T | null {
  if (arr.length === 0) return null;
  const seed = new Date().getDate() + new Date().getMonth() * 31;
  return arr[seed % arr.length];
}

export default function Dashboard() {
  const [books, setBooks] = useState<Book[]>([]);
  const [pipeline, setPipeline] = useState<PipelineCard[]>([]);
  const [ideas, setIdeas] = useState<SavedIdeas[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [words, setWords] = useState<Word[]>([]);

  useEffect(() => {
    api.listBooks().then(setBooks).catch(() => {});
    api.listPipeline().then(setPipeline).catch(() => {});
    api.listIdeas().then(setIdeas).catch(() => {});
    api.listQuotes().then(setQuotes).catch(() => {});
    api.listWords().then(setWords).catch(() => {});
  }, []);

  const upcoming = pipeline.filter((c) => c.status === "guion" || c.status === "grabar").slice(0, 3);
  const lastBook = books[0];
  const quoteOfDay = pickOfDay(quotes);
  const wordOfDay = pickOfDay(words);
  const thisYear = new Date().getFullYear();
  const booksThisYear = books.filter((b) => (b.read_date ?? b.created_at).startsWith(String(thisYear))).length;
  const published = pipeline.filter((c) => c.status === "publicado").length;

  return (
    <div>
      {/* Saludo */}
      <section className="mb-8">
        <h1 className="font-display text-5xl text-cream">
          {greeting()}, Sebastian <span className="text-gold">😁</span>
        </h1>
        <p className="mt-2 font-serif text-xl text-muted">¿Qué vamos a crear hoy?</p>
      </section>

      {/* Stats rápidas */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatBox label={`Libros en ${thisYear}`} value={booksThisYear} />
        <StatBox label="Videos publicados" value={published} />
        <StatBox label="Ideas guardadas" value={ideas.length} />
        <StatBox label="Citas" value={quotes.length} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Próximos videos */}
        <Widget title="Próximos videos" to="/calendario" cta="Ver calendario">
          {upcoming.length === 0 ? (
            <Empty text="Sin videos en guion o grabación." />
          ) : (
            <div className="space-y-2">
              {upcoming.map((c) => (
                <div key={c.id} className="rounded-lg bg-carbon p-3">
                  <p className="text-sm text-cream">{c.title}</p>
                  <p className="font-mono text-xs text-gold">{c.status}{c.scheduled_date ? ` · ${c.scheduled_date}` : ""}</p>
                </div>
              ))}
            </div>
          )}
        </Widget>

        {/* Ideas frescas */}
        <Widget title="Ideas frescas" to="/ideas" cta="Generar más">
          {ideas.length === 0 ? (
            <Empty text="Aún no has generado ideas." />
          ) : (
            <ul className="space-y-2">
              {ideas.slice(0, 5).map((g) => (
                <li key={g.id} className="text-sm text-cream/90">
                  <span className="text-gold">✦</span> {g.topic}
                </li>
              ))}
            </ul>
          )}
        </Widget>

        {/* Última lectura */}
        <Widget title="Última lectura" to="/libros" cta="Mi biblioteca">
          {!lastBook ? (
            <Empty text="Agrega tu primer libro." />
          ) : (
            <div className="flex gap-3">
              {lastBook.cover_url && (
                <img src={lastBook.cover_url} alt={lastBook.title} className="h-28 rounded-md border border-border object-cover shadow-lg shadow-black/50" />
              )}
              <div>
                <p className="font-serif text-lg text-cream">{lastBook.title}</p>
                <p className="text-sm text-muted">{lastBook.author}</p>
                {lastBook.rating != null && <p className="mt-1 text-gold">★ {lastBook.rating}/10</p>}
              </div>
            </div>
          )}
        </Widget>

        {/* Cita del día */}
        <Widget title="Cita del día" to="/citas" cta="Banco de citas">
          {!quoteOfDay ? (
            <Empty text="Guarda citas para verlas aquí." />
          ) : (
            <>
              <p className="font-serif text-lg italic text-cream">“{quoteOfDay.text}”</p>
              {quoteOfDay.book_author && <p className="mt-2 text-sm text-muted">— {quoteOfDay.book_author}</p>}
            </>
          )}
        </Widget>

        {/* Palabra del día */}
        <Widget title="Palabra del día" to="/palabras" cta="Etimologías">
          {!wordOfDay ? (
            <Empty text="Estudia palabras para verlas aquí." />
          ) : (
            <>
              <p className="font-serif text-3xl text-gold">{wordOfDay.word}</p>
              <p className="mt-2 line-clamp-3 text-sm text-cream/90">{wordOfDay.etymology}</p>
            </>
          )}
        </Widget>

        {/* Atajo a Studio */}
        <Widget title="Crear un guion" to="/studio" cta="Abrir Studio">
          <p className="text-sm text-muted">
            Genera guiones con timestamps, hooks, captions y adapta a otras plataformas.
          </p>
          <p className="mt-3 font-mono text-xs text-muted">Tip: ⌘K para buscar · ⌘N para crear</p>
        </Widget>
      </div>
    </div>
  );
}

/* ---------- Sub-componentes ---------- */

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="stat mt-1 text-3xl text-gold">{value}</p>
    </div>
  );
}

function Widget({ title, to, cta, children }: { title: string; to: string; cta: string; children: React.ReactNode }) {
  return (
    <section className="card flex flex-col p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl text-cream">{title}</h2>
        <Link to={to} className="text-xs text-gold hover:underline">{cta} →</Link>
      </div>
      <div className="flex-1">{children}</div>
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-muted">{text}</p>;
}
