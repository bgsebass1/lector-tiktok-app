/**
 * Configuración centralizada de Grok.
 *
 * Aquí vive el modelo por defecto y los parámetros de la API en un solo sitio,
 * para no repetir strings sueltos por el código.
 *
 * Por defecto apuntamos a OpenRouter (https://openrouter.ai/api/v1), que es
 * compatible con el formato OpenAI y da acceso a los modelos de Grok con créditos.
 * Todo es configurable por variables de entorno en backend/.env:
 *   - GROK_BASE_URL  (ej: https://openrouter.ai/api/v1  o  https://api.x.ai/v1)
 *   - GROK_MODEL     (ej: x-ai/grok-4.3 en OpenRouter, o grok-4.3 en xAI directo)
 *   - GROK_API_KEY   (la clave del proveedor que uses)
 *
 * NOTA: el slug "grok-beta" fue retirado por xAI el 15 de mayo de 2026.
 */
export const GROK_CONFIG = {
  BASE_URL: process.env.GROK_BASE_URL || "https://openrouter.ai/api/v1",
  MODEL: process.env.GROK_MODEL || "x-ai/grok-4.3",
  TIMEOUT_MS: 60000,
  MAX_TOKENS: 4000,
};
