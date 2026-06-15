import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, type Flashcard } from "../lib/api";
import { notifyGrokError } from "../lib/notify";

/**
 * MODO ESTUDIO de flashcards.
 * Muestra una tarjeta a la vez, se voltea (flip 3D) y se califica con SM-2.
 * Acepta ?deck= para estudiar solo un mazo.
 */
export default function FlashcardsStudy() {
  const [params] = useSearchParams();
  const deck = params.get("deck");
  const navigate = useNavigate();

  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(0);

  useEffect(() => {
    api
      .dueFlashcards()
      .then((all) => setCards(deck ? all.filter((c) => c.deck === deck) : all))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [deck]);

  const card = cards[index];
  const total = useMemo(() => cards.length, [cards]);

  async function rate(quality: "dificil" | "bien" | "facil") {
    if (!card) return;
    try {
      await api.reviewFlashcard(card.id, quality);
    } catch (err) {
      notifyGrokError(err);
      return;
    }
    setDone((d) => d + 1);
    setFlipped(false);
    setIndex((i) => i + 1);
  }

  if (loaded && total === 0) {
    return (
      <div className="text-center">
        <p className="text-muted">No hay tarjetas pendientes{deck ? ` en "${deck}"` : ""}.</p>
        <button onClick={() => navigate("/flashcards")} className="btn-gold mt-4">Volver</button>
      </div>
    );
  }

  // Terminado.
  if (loaded && index >= total) {
    return (
      <div className="mx-auto max-w-md text-center">
        <div className="card p-8">
          <div className="text-5xl">🎉</div>
          <h2 className="mt-3 font-serif text-2xl text-cream">Sesión completada</h2>
          <p className="mt-2 text-muted">Repasaste {done} tarjeta{done === 1 ? "" : "s"}.</p>
          <button onClick={() => navigate("/flashcards")} className="btn-gold mt-6 w-full">Volver a Flashcards</button>
        </div>
      </div>
    );
  }

  if (!card) return null;

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-4 flex items-center justify-between text-sm text-muted">
        <button onClick={() => navigate("/flashcards")} className="hover:text-cream">← Salir</button>
        <span className="font-mono">{index + 1} / {total}</span>
      </div>

      {/* Tarjeta con flip 3D */}
      <div style={{ perspective: 1200 }}>
        <div
          onClick={() => setFlipped((f) => !f)}
          style={{
            position: "relative",
            minHeight: 320,
            cursor: "pointer",
            transformStyle: "preserve-3d",
            transition: "transform 0.5s",
            transform: flipped ? "rotateY(180deg)" : "none",
          }}
        >
          {/* Anverso */}
          <div className="card absolute inset-0 flex flex-col items-center justify-center p-8 text-center" style={{ backfaceVisibility: "hidden" }}>
            <span className="mb-3 text-xs uppercase tracking-wide text-muted">{card.deck}</span>
            <p className="font-serif text-2xl text-cream">{card.front}</p>
            <span className="mt-6 text-xs text-muted">toca para ver la respuesta</span>
          </div>
          {/* Reverso */}
          <div
            className="card absolute inset-0 flex flex-col items-center justify-center p-8 text-center"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <p className="text-lg leading-relaxed text-cream/95">{card.back}</p>
          </div>
        </div>
      </div>

      {/* Calificación (solo cuando está volteada) */}
      {flipped ? (
        <div className="mt-5 grid grid-cols-3 gap-2">
          <button onClick={() => rate("dificil")} className="rounded-lg border border-red-500/40 py-3 text-red-300 transition hover:bg-red-500/10">
            Difícil
          </button>
          <button onClick={() => rate("bien")} className="rounded-lg border border-border py-3 text-cream transition hover:border-gold">
            Bien
          </button>
          <button onClick={() => rate("facil")} className="rounded-lg border border-green-500/40 py-3 text-green-300 transition hover:bg-green-500/10">
            Fácil
          </button>
        </div>
      ) : (
        <button onClick={() => setFlipped(true)} className="btn-ghost mt-5 w-full">Voltear</button>
      )}
    </div>
  );
}
