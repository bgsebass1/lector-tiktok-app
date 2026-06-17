import { useNavigate } from "react-router-dom";
import { detoxUntil } from "../lib/detox";

/** Pantalla que reemplaza las secciones de creación durante el detox. */
export default function DetoxBlock() {
  const navigate = useNavigate();
  const ms = detoxUntil() - Date.now();
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center text-center">
      <div className="text-5xl">🧘</div>
      <h1 className="mt-4 text-3xl text-cream">Estás en detox</h1>
      <p className="mt-2 text-muted">La creación de contenido está en pausa. Dedica este tiempo a leer, escribir y guardar citas.</p>
      <div className="mt-6 rounded-full border border-gold/40 bg-gold/5 px-5 py-2 font-mono text-gold">
        Quedan {days}d {hours}h
      </div>
      <div className="mt-8 flex gap-3">
        <button onClick={() => navigate("/leer")} className="btn-gold">Ir a Leer</button>
        <button onClick={() => navigate("/escribir")} className="btn-ghost">Escribir</button>
      </div>
    </div>
  );
}
