import { Link } from "react-router-dom";

const tools = [
  { to: "/flashcards", icon: "🗂️", title: "Flashcards", desc: "Repaso espaciado de conceptos." },
  { to: "/dialogos", icon: "💭", title: "Diálogos con autores", desc: "Conversa con Dostoyevski, Borges, Wittgenstein…" },
  { to: "/timeline", icon: "🧭", title: "Timeline intelectual", desc: "Recorre la historia del pensamiento." },
];

/** Hub de estudio (/estudio): entrada a flashcards, diálogos y timeline. */
export default function EstudioHub() {
  return (
    <div>
      <h1 className="mb-1 font-display text-3xl text-cream">Estudio</h1>
      <p className="mb-6 text-muted">Tu espacio de aprendizaje.</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((t) => (
          <Link key={t.to} to={t.to} className="card p-6 transition hover:border-gold">
            <div className="text-3xl" aria-hidden>{t.icon}</div>
            <h2 className="mt-3 font-display text-xl text-cream">{t.title}</h2>
            <p className="mt-1 text-sm text-muted">{t.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
