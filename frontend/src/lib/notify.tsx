import toast from "react-hot-toast";

/** Toast de éxito simple. */
export function notifyOk(message: string) {
  toast.success(message);
}

/** Toast de error genérico (operaciones que no son de IA). */
export function notifyError(error: unknown) {
  const message = error instanceof Error ? error.message : "Error desconocido";
  toast.error(message);
}

/**
 * Toast de error de Grok (mejora transversal 7): muestra el mensaje exacto
 * (que ya incluye el [código] gracias al cliente api) y un botón "Reintentar".
 */
export function notifyGrokError(error: unknown, onRetry?: () => void) {
  const message = error instanceof Error ? error.message : "Error desconocido";

  toast.custom(
    (t) => (
      <div className="card flex max-w-md items-start gap-3 p-4 shadow-xl">
        <span className="text-xl">⚠️</span>
        <div className="flex-1">
          <p className="font-medium text-cream">La IA falló</p>
          <p className="mt-1 text-sm text-muted">{message}</p>
          <div className="mt-3 flex gap-2">
            {onRetry && (
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  onRetry();
                }}
                className="rounded-md bg-gold px-3 py-1 text-sm font-medium text-carbon"
              >
                Reintentar
              </button>
            )}
            <button
              onClick={() => toast.dismiss(t.id)}
              className="rounded-md border border-border px-3 py-1 text-sm text-muted"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    ),
    { duration: 8000 }
  );
}
