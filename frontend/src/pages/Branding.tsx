/** Página de identidad (/branding): muestra el logo elegido de Pliego. */
export default function Branding() {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <h1 className="font-display text-3xl text-cream">Identidad</h1>
      <p className="mt-2 text-muted">Logo de Pliego · Opción 2 (pluma y libro).</p>
      <div className="card mx-auto mt-8 flex w-64 flex-col items-center gap-4 p-10">
        <img src="/logo.svg" alt="Logo de Pliego" className="h-24 w-24" />
        <span className="font-serif text-3xl font-semibold text-cream">Pliego</span>
      </div>
    </div>
  );
}
