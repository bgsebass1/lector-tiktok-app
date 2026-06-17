import { useState } from "react";
import { api } from "../lib/api";
import { notifyGrokError } from "../lib/notify";

interface Formula {
  formula: string;
  tag: "curiosidad" | "controversia" | "autoridad" | "intimidad";
  example: string;
}

const FORMULAS: Formula[] = [
  { formula: "El error que cometen todos cuando…", tag: "controversia", example: "El error que cometen todos cuando leen a Nietzsche." },
  { formula: "Lo que [autor] entendió antes que nadie sobre…", tag: "autoridad", example: "Lo que Dostoyevski entendió antes que nadie sobre la culpa." },
  { formula: "Si pudiera leer un solo libro este año, sería…", tag: "intimidad", example: "Si pudiera leer un solo libro este año, sería este." },
  { formula: "[Concepto] tiene una historia que nadie te contó.", tag: "curiosidad", example: "La palabra 'salario' tiene una historia que nadie te contó." },
  { formula: "Nadie habla de esto, pero…", tag: "controversia", example: "Nadie habla de esto, pero leer te cambia el cerebro." },
  { formula: "Esto va a sonar exagerado, pero…", tag: "intimidad", example: "Esto va a sonar exagerado, pero este libro me salvó." },
  { formula: "Hay un libro que predijo [tema] hace 100 años.", tag: "curiosidad", example: "Hay un libro que predijo las redes sociales hace 100 años." },
  { formula: "Deja de [acción común]. Haz esto en su lugar.", tag: "autoridad", example: "Deja de subrayar todo. Haz esto en su lugar." },
  { formula: "Lo que tu profesor nunca te dijo sobre…", tag: "controversia", example: "Lo que tu profesor nunca te dijo sobre el Quijote." },
  { formula: "3 libros que te harán [resultado].", tag: "autoridad", example: "3 libros que te harán pensar distinto." },
  { formula: "¿Y si [creencia común] estuviera al revés?", tag: "curiosidad", example: "¿Y si la felicidad estuviera sobrevalorada?" },
  { formula: "La frase que me hizo cerrar el libro y quedarme pensando.", tag: "intimidad", example: "La frase de Camus que me hizo cerrar el libro." },
  { formula: "Esto es lo que [grupo] no quiere que sepas sobre…", tag: "controversia", example: "Esto es lo que la escuela no te enseña sobre leer." },
  { formula: "Leí [N] libros de [tema] para que tú no tengas que.", tag: "autoridad", example: "Leí 20 libros de filosofía para resumirte esto." },
  { formula: "El día que entendí [idea] cambió mi forma de leer.", tag: "intimidad", example: "El día que entendí el 'eterno retorno'." },
  { formula: "Una palabra que deberías conocer: …", tag: "curiosidad", example: "Una palabra que deberías conocer: 'saudade'." },
  { formula: "Por qué [obra famosa] sigue doliendo hoy.", tag: "autoridad", example: "Por qué '1984' sigue doliendo hoy." },
  { formula: "Te explico [tema complejo] en 30 segundos.", tag: "autoridad", example: "Te explico el existencialismo en 30 segundos." },
  { formula: "Esto cambió cómo veo [tema] para siempre.", tag: "intimidad", example: "Este pasaje cambió cómo veo la muerte." },
  { formula: "El libro más [adjetivo] que vas a leer.", tag: "curiosidad", example: "El libro más perturbador que vas a leer." },
  { formula: "No leas [libro] hasta que sepas esto.", tag: "controversia", example: "No leas a Kafka hasta que sepas esto." },
  { formula: "[Autor] vs [autor]: ¿quién tenía razón?", tag: "controversia", example: "Nietzsche vs Dostoyevski: ¿quién tenía razón sobre Dios?" },
  { formula: "La pregunta que [autor] nunca pudo responder.", tag: "curiosidad", example: "La pregunta que Sartre nunca pudo responder." },
  { formula: "Si te sientes [emoción], lee esto.", tag: "intimidad", example: "Si te sientes perdido, lee esto." },
  { formula: "Lo entendí tarde, pero…", tag: "intimidad", example: "Lo entendí tarde, pero leer no es acumular libros." },
  { formula: "Cómo [autor] escribiría un TikTok.", tag: "curiosidad", example: "Cómo Borges escribiría un TikTok." },
  { formula: "Este es el párrafo más [adjetivo] de la literatura.", tag: "autoridad", example: "Este es el párrafo más triste de la literatura." },
  { formula: "Pensé que [creencia], hasta que leí…", tag: "intimidad", example: "Pensé que entendía el amor, hasta que leí a Tolstói." },
  { formula: "La verdad incómoda sobre [tema].", tag: "controversia", example: "La verdad incómoda sobre 'leer mucho'." },
  { formula: "En [año/época], alguien ya había escrito tu vida.", tag: "curiosidad", example: "En 1880, alguien ya había escrito tu ansiedad." },
];

const TAGS: Record<Formula["tag"], string> = {
  curiosidad: "text-sky-300 border-sky-400/40",
  controversia: "text-rose-300 border-rose-400/40",
  autoridad: "text-amber-300 border-amber-400/40",
  intimidad: "text-violet-300 border-violet-400/40",
};
const FAV_KEY = "pliego_hook_favs";

/** RECETARIO DE HOOKS (G15). */
export default function Recetario() {
  const [tag, setTag] = useState<string | null>(null);
  const [favs, setFavs] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(FAV_KEY) || "[]"); } catch { return []; }
  });
  const [adapting, setAdapting] = useState<Formula | null>(null);

  function toggleFav(f: string) {
    const next = favs.includes(f) ? favs.filter((x) => x !== f) : [...favs, f];
    setFavs(next);
    localStorage.setItem(FAV_KEY, JSON.stringify(next));
  }

  const shown = tag === "favs" ? FORMULAS.filter((f) => favs.includes(f.formula)) : tag ? FORMULAS.filter((f) => f.tag === tag) : FORMULAS;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5">
        <h1 className="text-4xl text-cream">Recetario de hooks</h1>
        <p className="mt-1 text-muted">Fórmulas que enganchan. Adáptalas a tu tema con un clic.</p>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {[["Todas", null], ["★ Favoritas", "favs"], ["Curiosidad", "curiosidad"], ["Controversia", "controversia"], ["Autoridad", "autoridad"], ["Intimidad", "intimidad"]].map(([label, key]) => (
          <button key={String(label)} onClick={() => setTag(key as string | null)} className={`rounded-full border px-3 py-1 text-sm ${tag === key ? "border-gold text-gold" : "border-border text-muted"}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {shown.map((f) => (
          <div key={f.formula} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-serif text-lg text-cream">{f.formula}</p>
                <p className="mt-1 text-sm text-muted">Ej: {f.example}</p>
                <span className={`mt-2 inline-block rounded-full border px-2 py-0.5 text-xs ${TAGS[f.tag]}`}>{f.tag}</span>
              </div>
              <button onClick={() => toggleFav(f.formula)} className={`shrink-0 text-xl ${favs.includes(f.formula) ? "text-gold" : "text-muted"}`} title="Favorita">★</button>
            </div>
            <button onClick={() => setAdapting(f)} className="btn-ghost mt-3 !px-3 !py-1.5 text-sm">Adaptar a mi tema</button>
          </div>
        ))}
        {shown.length === 0 && <p className="text-muted">No hay fórmulas aquí todavía.</p>}
      </div>

      {adapting && <AdaptModal formula={adapting} onClose={() => setAdapting(null)} />}
    </div>
  );
}

function AdaptModal({ formula, onClose }: { formula: Formula; onClose: () => void }) {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [out, setOut] = useState("");

  async function run() {
    if (!topic.trim()) return;
    setLoading(true);
    setOut("");
    try {
      const { text } = await api.adaptHook(formula.formula, topic.trim());
      setOut(text);
    } catch (e) {
      notifyGrokError(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 pt-[10vh] backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl text-cream">{formula.formula}</h2>
        <input className="input mt-4" placeholder="¿Sobre qué tema?" value={topic} onChange={(e) => setTopic(e.target.value)} onKeyDown={(e) => e.key === "Enter" && run()} autoFocus />
        <div className="mt-3 flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost">Cerrar</button>
          <button onClick={run} disabled={loading || !topic.trim()} className="btn-gold">{loading ? "Generando…" : "Generar"}</button>
        </div>
        {out && <p className="mt-4 whitespace-pre-wrap rounded-lg border border-gold/40 bg-gold/5 p-4 font-serif text-cream">{out}</p>}
      </div>
    </div>
  );
}
