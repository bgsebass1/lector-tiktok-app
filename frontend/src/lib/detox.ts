/** DETOX MODE (G20): bloqueo voluntario de la creación de contenido por X días. */
const KEY = "pliego_detox";

export function detoxUntil(): number {
  const v = localStorage.getItem(KEY);
  return v ? Number(v) : 0;
}
export function isDetox(): boolean {
  return detoxUntil() > Date.now();
}
export function startDetox(days: number): void {
  localStorage.setItem(KEY, String(Date.now() + days * 86400000));
}
export function endDetox(): void {
  localStorage.removeItem(KEY);
}

/** Rutas bloqueadas durante el detox (creación de contenido). */
const BLOCKED = [
  "/crear", "/studio", "/recetario", "/shuffle", "/cadaver-exquisito",
  "/dialogos/cruce", "/tiktok", "/ideas", "/banco", "/recursos",
  "/nicho-map", "/debate", "/oraculo", "/mood",
];
export function isBlocked(path: string): boolean {
  return BLOCKED.some((p) => path === p || path.startsWith(p + "/"));
}
