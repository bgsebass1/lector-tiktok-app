/** Utilidades para detectar el modo PWA (standalone) y la plataforma. */

/** ¿La app corre instalada (standalone), no dentro del navegador? */
export const isStandalone = (): boolean =>
  window.matchMedia("(display-mode: standalone)").matches ||
  // iOS expone navigator.standalone cuando se abre desde la pantalla de inicio.
  (window.navigator as unknown as { standalone?: boolean }).standalone === true;

/** ¿El dispositivo es iOS (iPhone/iPad/iPod)? */
export const isIOS = (): boolean => /iPad|iPhone|iPod/.test(navigator.userAgent);
