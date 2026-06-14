/**
 * Página marcador de posición ("Próximamente") para rutas cuya funcionalidad
 * llega en una fase posterior del plan (Partes B/C/D). Mantiene la navegación
 * completa sin rutas rotas.
 */
export default function Stub({ title, note }: { title: string; note?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <img src="/logo.svg" alt="" className="mb-6 h-16 w-16 opacity-40" />
      <h1 className="font-display text-3xl text-cream">{title}</h1>
      <p className="mt-3 max-w-sm text-muted">
        {note ?? "Próximamente. Esta sección llega en una fase siguiente del plan."}
      </p>
    </div>
  );
}
