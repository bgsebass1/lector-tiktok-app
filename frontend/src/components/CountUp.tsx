import { useEffect, useRef, useState } from "react";

/**
 * Número que cuenta desde 0 hasta `value` al aparecer (easing suave).
 * Robusto: una garantía con setTimeout fija el valor final aunque el
 * requestAnimationFrame se pause (pestaña en segundo plano) y respeta
 * "prefers-reduced-motion".
 */
export default function CountUp({
  value,
  duration = 900,
  className,
}: {
  value: number;
  duration?: number;
  className?: string;
}) {
  const [n, setN] = useState(value);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced || value <= 0) {
      setN(value);
      return;
    }

    const start = performance.now();
    setN(0);
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(value * eased));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    // Garantía: pase lo que pase, al final mostramos el valor real.
    const guard = window.setTimeout(() => setN(value), duration + 250);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      clearTimeout(guard);
    };
  }, [value, duration]);

  return <span className={className}>{n}</span>;
}
