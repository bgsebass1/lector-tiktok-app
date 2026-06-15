/**
 * Configuración centralizada de Grok.
 *
 * Aquí vive el modelo por defecto y los parámetros de la API en un solo sitio,
 * para no repetir strings sueltos por el código.
 *
 * Por defecto apuntamos a Groq (https://api.groq.com/openai/v1), que es GRATIS,
 * muy rápido y compatible con el formato OpenAI.
 * Todo es configurable por variables de entorno en backend/.env:
 *   - GROK_BASE_URL  (ej: https://api.groq.com/openai/v1  o  https://openrouter.ai/api/v1)
 *   - GROK_MODEL     (ej: llama-3.3-70b-versatile en Groq, o x-ai/grok-4.3 en OpenRouter)
 *   - GROK_API_KEY   (la clave del proveedor que uses)
 */
export const GROK_CONFIG = {
  BASE_URL: process.env.GROK_BASE_URL || "https://api.groq.com/openai/v1",
  MODEL: process.env.GROK_MODEL || "llama-3.3-70b-versatile",
  TIMEOUT_MS: 60000,
  MAX_TOKENS: 4000,
};
