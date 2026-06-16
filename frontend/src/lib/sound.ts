/**
 * Sonidos de interfaz sutiles, generados con Web Audio (sin archivos).
 * Se pueden activar/desactivar; la preferencia vive en localStorage.
 */
const KEY = "pliego_sound";

export function soundEnabled(): boolean {
  return localStorage.getItem(KEY) !== "0"; // por defecto activados
}
export function setSound(on: boolean): void {
  localStorage.setItem(KEY, on ? "1" : "0");
}

let ctx: AudioContext | null = null;
function getCtx(): AudioContext | null {
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, dur: number, gain = 0.05, type: OscillatorType = "sine") {
  const c = getCtx();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  o.connect(g);
  g.connect(c.destination);
  const t = c.currentTime;
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.start(t);
  o.stop(t + dur);
}

/** Clic suave (acciones pequeñas). */
export function playTick(): void {
  if (!soundEnabled()) return;
  tone(440, 0.07, 0.035);
}

/** Acorde ascendente C-E-G (al completar algo). */
export function playChime(): void {
  if (!soundEnabled()) return;
  tone(523.25, 0.18);
  setTimeout(() => tone(659.25, 0.18), 110);
  setTimeout(() => tone(783.99, 0.32), 220);
}
