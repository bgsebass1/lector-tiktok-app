/**
 * ATAJOS DE TECLADO — referencia rápida.
 */
const SHORTCUTS: Array<{ keys: string; action: string }> = [
  { keys: "Cmd / Ctrl + K", action: "Búsqueda global" },
  { keys: "Cmd / Ctrl + N", action: "Menú radial «crear nuevo»" },
  { keys: "Cmd / Ctrl + 1", action: "Inicio" },
  { keys: "Cmd / Ctrl + 2", action: "Libros" },
  { keys: "Cmd / Ctrl + 3", action: "Crear" },
  { keys: "Cmd / Ctrl + 4", action: "Citas" },
  { keys: "Cmd / Ctrl + 5", action: "Calendario" },
  { keys: "Cmd / Ctrl + 6", action: "TikTok" },
];

export default function Atajos() {
  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6">
        <h1 className="text-4xl text-cream">Atajos de teclado</h1>
        <p className="mt-1 text-muted">Para moverte más rápido en computador.</p>
      </div>

      <div className="card divide-y divide-border">
        {SHORTCUTS.map((s) => (
          <div key={s.keys} className="flex items-center justify-between px-4 py-3">
            <span className="text-cream">{s.action}</span>
            <kbd className="rounded-md border border-border bg-carbon px-2 py-1 font-mono text-xs text-muted">
              {s.keys}
            </kbd>
          </div>
        ))}
      </div>

      <p className="mt-4 text-sm text-muted">
        En el celular usa el botón 🔍 para buscar y el botón flotante «+» para crear.
      </p>
    </div>
  );
}
