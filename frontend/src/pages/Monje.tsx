import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { api } from "../lib/api";
import { notifyOk } from "../lib/notify";
import { playChime } from "../lib/sound";

type Phase = "setup" | "focus" | "done";

/** Duraciones ofrecidas (minutos). 0 = abierto (cuenta hacia arriba). */
const DURATIONS = [15, 25, 45, 0];

function clock(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * MODO MONJE — concentración total a pantalla completa.
 * Respiración guiada + cronómetro. Al terminar, registra una sesión (alimenta el heatmap).
 */
export default function Monje() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [intention, setIntention] = useState("");
  const [durationMin, setDurationMin] = useState(25);
  const [elapsed, setElapsed] = useState(0); // segundos transcurridos
  const [running, setRunning] = useState(true);
  const intervalRef = useRef<number | null>(null);
  const navigate = useNavigate();

  const isCountdown = durationMin > 0;
  const target = durationMin * 60;
  const display = isCountdown ? Math.max(0, target - elapsed) : elapsed;

  // Cronómetro.
  useEffect(() => {
    if (phase !== "focus" || !running) return;
    intervalRef.current = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phase, running]);

  // Fin automático en cuenta regresiva.
  useEffect(() => {
    if (phase === "focus" && isCountdown && elapsed >= target) finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed, phase]);

  function start() {
    setElapsed(0);
    setRunning(true);
    setPhase("focus");
  }

  /** Termina y REGISTRA el tiempo real transcurrido. */
  async function finish() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const minutes = Math.max(1, Math.round(elapsed / 60));
    setPhase("done");
    playChime();
    try {
      await api.createSession({ book_id: null, minutes, note: intention.trim() || "Modo monje" });
      notifyOk(`${minutes} min de concentración registrados.`);
    } catch {
      /* si falla el registro, no arruinamos el momento */
    }
  }

  /** Sale sin registrar nada (volver atrás). */
  function cancel() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    navigate(-1);
  }

  /* ---------- Setup ---------- */
  if (phase === "setup") {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-carbon px-6">
        <button onClick={cancel} className="absolute right-5 top-5 text-sm text-muted hover:text-cream">
          ← Salir
        </button>
        <div className="w-full max-w-md text-center">
          <div className="text-5xl">🧘</div>
          <h1 className="mt-4 text-4xl text-cream">Modo monje</h1>
          <p className="mt-1 text-muted">Un rato de concentración total, sin distracciones.</p>

          <input
            value={intention}
            onChange={(e) => setIntention(e.target.value)}
            placeholder="¿En qué te vas a concentrar?"
            className="input mt-6 text-center"
          />

          <div className="mt-5 flex justify-center gap-2">
            {DURATIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDurationMin(d)}
                className={`rounded-lg border px-4 py-2 text-sm transition ${
                  durationMin === d ? "border-gold text-gold" : "border-border text-muted hover:border-gold"
                }`}
              >
                {d === 0 ? "Libre" : `${d} min`}
              </button>
            ))}
          </div>

          <button onClick={start} className="btn-gold mt-8 w-full">Comenzar</button>
        </div>
      </div>
    );
  }

  /* ---------- Done ---------- */
  if (phase === "done") {
    const mins = Math.max(1, Math.round(elapsed / 60));
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-carbon px-6 text-center">
        <div className="text-5xl">🌿</div>
        <h1 className="mt-4 text-4xl text-cream">Sesión completa</h1>
        <p className="mt-2 text-muted">
          {mins} min de concentración{intention.trim() ? ` · ${intention.trim()}` : ""}.
        </p>
        <div className="mt-8 flex gap-3">
          <button onClick={() => setPhase("setup")} className="btn-ghost">Otra sesión</button>
          <button onClick={() => navigate("/")} className="btn-gold">Salir</button>
        </div>
      </div>
    );
  }

  /* ---------- Focus ---------- */
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-carbon px-6">
      <button onClick={cancel} className="absolute right-5 top-5 text-sm text-muted hover:text-cream">
        ✕ Cancelar
      </button>

      {intention.trim() && (
        <p className="mb-10 max-w-md text-center font-serif text-xl italic text-muted">{intention.trim()}</p>
      )}

      {/* Respiración guiada + cronómetro */}
      <div className="relative flex h-72 w-72 items-center justify-center">
        <motion.div
          className="absolute inset-0 rounded-full border border-gold/30"
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute inset-8 rounded-full bg-gold/5"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="z-10 text-center">
          <div className="font-mono text-6xl text-cream">{clock(display)}</div>
          <div className="mt-2 text-sm text-muted">Inhala… exhala…</div>
        </div>
      </div>

      <div className="mt-10 flex items-center gap-3">
        <button onClick={() => setRunning((r) => !r)} className="btn-ghost">
          {running ? "Pausar" : "Reanudar"}
        </button>
        <button onClick={finish} className="btn-gold">Terminar y guardar</button>
      </div>
    </div>
  );
}
