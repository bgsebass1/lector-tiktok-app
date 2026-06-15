/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Dominio del backend en producción (Railway). Vacío en local. */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
