import { useEffect, useState } from "react";

/**
 * Mensaje rotativo mientras Grok "piensa" (mejora transversal 8).
 * Cambia el texto cada 2 segundos para que la espera se sienta viva.
 */
const MESSAGES = [
  "Pensando…",
  "Conectando ideas…",
  "Refinando estructura…",
  "Buscando el ángulo perfecto…",
  "Puliendo las palabras…",
];

export default function GrokLoading({ compact = false }: { compact?: boolean }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setI((prev) => (prev + 1) % MESSAGES.length), 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={`flex items-center gap-3 text-gold ${compact ? "" : "py-6"}`}>
      {/* Puntos pulsantes */}
      <span className="flex gap-1">
        <span className="h-2 w-2 animate-pulse rounded-full bg-gold" />
        <span className="h-2 w-2 animate-pulse rounded-full bg-gold [animation-delay:200ms]" />
        <span className="h-2 w-2 animate-pulse rounded-full bg-gold [animation-delay:400ms]" />
      </span>
      <span className="font-serif italic">{MESSAGES[i]}</span>
    </div>
  );
}
