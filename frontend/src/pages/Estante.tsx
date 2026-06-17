import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, type Book } from "../lib/api";

/** Color procedural a partir del texto (tonos editoriales). */
function spineColor(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return `hsl(${h}, 35%, 28%)`;
}

/** ESTANTE FÍSICO 3D (G10) — tu biblioteca como lomos en una estantería. */
export default function Estante() {
  const [books, setBooks] = useState<Book[]>([]);
  const navigate = useNavigate();

  useEffect(() => { api.listBooks().then(setBooks).catch(() => {}); }, []);

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-4xl text-cream">Estante</h1>
        <p className="mt-1 text-muted">Tu biblioteca en lomos. Desliza horizontalmente; toca un libro para abrirlo.</p>
      </div>

      {books.length === 0 ? (
        <div className="card p-8 text-center text-muted">Aún no hay libros en tu biblioteca.</div>
      ) : (
        <div className="overflow-x-auto pb-4" style={{ perspective: "900px" }}>
          {/* Tabla del estante */}
          <div className="relative inline-flex min-w-full items-end gap-1 rounded-t-lg px-4 pt-6" style={{ minHeight: 280 }}>
            {books.map((b) => {
              const h = 200 + ((b.title.length * 7) % 56); // alturas variadas
              return (
                <button
                  key={b.id}
                  onClick={() => navigate(`/leer/${b.id}`)}
                  className="group relative shrink-0 origin-bottom rounded-t-sm shadow-md transition-transform duration-200 hover:-translate-y-3"
                  style={{ width: 38, height: h, background: `linear-gradient(90deg, rgba(255,255,255,.12), transparent 18%, transparent 82%, rgba(0,0,0,.25)), ${spineColor(b.title + b.author)}` }}
                  title={`${b.title} — ${b.author}`}
                >
                  <span
                    className="absolute inset-0 flex items-center justify-center px-1 text-center font-serif text-[11px] leading-tight text-cream/90"
                    style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
                  >
                    {b.title.length > 30 ? b.title.slice(0, 28) + "…" : b.title}
                  </span>
                  {/* Brillo dorado al pasar */}
                  <span className="absolute inset-x-0 top-0 h-1 bg-gold opacity-0 transition-opacity group-hover:opacity-80" />
                </button>
              );
            })}
            {/* Madera */}
            <div className="pointer-events-none absolute -bottom-3 left-0 h-4 w-full rounded-sm" style={{ background: "linear-gradient(180deg, #6b4a2b, #3d2a17)" }} />
          </div>
        </div>
      )}
    </div>
  );
}
