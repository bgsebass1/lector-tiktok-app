/**
 * Confeti de celebración, sin dependencias.
 * Crea partículas en el DOM y las anima con la Web Animations API; se autolimpian.
 * Respeta "prefers-reduced-motion".
 */
const COLORS = ["#d4af37", "#f5f0e1", "#8ab4f8", "#9bbf7a", "#a78bfa", "#f0a868"];

export function confetti(count = 90): void {
  if (typeof window === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  const layer = document.createElement("div");
  layer.style.cssText =
    "position:fixed;inset:0;pointer-events:none;z-index:200;overflow:hidden";
  document.body.appendChild(layer);

  for (let i = 0; i < count; i++) {
    const p = document.createElement("div");
    const size = 6 + Math.random() * 7;
    p.style.cssText =
      `position:absolute;top:-12px;left:${Math.random() * 100}%;` +
      `width:${size}px;height:${size * 0.6}px;` +
      `background:${COLORS[i % COLORS.length]};border-radius:2px;will-change:transform`;
    layer.appendChild(p);

    const xEnd = (Math.random() * 2 - 1) * 240;
    const rot = Math.random() * 900 - 450;
    const dur = 1300 + Math.random() * 1400;
    const delay = Math.random() * 250;

    p.animate(
      [
        { transform: "translate(0,0) rotate(0deg)", opacity: 1 },
        { transform: `translate(${xEnd}px, ${window.innerHeight + 60}px) rotate(${rot}deg)`, opacity: 1 },
      ],
      { duration: dur, delay, easing: "cubic-bezier(.2,.6,.35,1)", fill: "forwards" }
    ).onfinish = () => p.remove();
  }

  setTimeout(() => layer.remove(), 3200);
}
