import { STATIONS, useRadio } from "../lib/radio";

/** RADIO PLIEGO (G6) — estación personal para leer/escribir. */
export default function Radio() {
  const { current, playing, play, toggle } = useRadio();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4">
        <h1 className="text-4xl text-cream">Radio Pliego</h1>
        <p className="mt-1 text-muted">Pon una atmósfera y sigue leyendo o escribiendo. Sigue sonando aunque cambies de página.</p>
      </div>

      {/* Radio vintage */}
      <div className="card mb-6 p-6 text-center">
        <div className="mx-auto mb-4 flex h-20 w-full max-w-sm items-center justify-center rounded-lg border border-border bg-carbon">
          <div className="font-mono text-lg text-gold">
            {current ? `${current.emoji} ${current.name}` : "— — —"}
          </div>
        </div>
        <button
          onClick={toggle}
          disabled={!current}
          className="btn-gold disabled:opacity-40"
        >
          {playing ? "⏸ Pausar" : current ? "▶ Reproducir" : "Elige una estación"}
        </button>
        {current && <p className="mt-2 text-xs text-muted">vía SomaFM · barra espaciadora para pausar</p>}
      </div>

      {/* Estaciones */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {STATIONS.map((s) => {
          const on = current?.id === s.id;
          return (
            <button
              key={s.id}
              onClick={() => play(s)}
              className={`card flex items-center gap-3 p-4 text-left transition hover:border-gold ${on ? "border-gold" : ""}`}
            >
              <span className="text-3xl">{s.emoji}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-cream">{s.name}</span>
                <span className="block text-sm text-muted">{s.desc}</span>
              </span>
              {on && playing && <span className="text-gold">♪</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
