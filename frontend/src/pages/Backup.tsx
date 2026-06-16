import { useRef, useState } from "react";
import { api } from "../lib/api";
import { notifyOk, notifyGrokError } from "../lib/notify";

/**
 * COPIA DE SEGURIDAD — exporta toda tu base de datos a un archivo JSON
 * e importa (restaura) desde uno.
 */
export default function Backup() {
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function exportData() {
    setBusy(true);
    try {
      const backup = await api.getBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pliego-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      notifyOk("Copia descargada.");
    } catch (err) {
      notifyGrokError(err);
    } finally {
      setBusy(false);
    }
  }

  async function importData(file: File) {
    if (!confirm("Importar REEMPLAZA todos tus datos actuales con los del archivo. ¿Continuar?")) return;
    setBusy(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const data = parsed.data ?? parsed; // tolera archivo con o sin envoltura
      await api.restore(data);
      notifyOk("Datos restaurados. Recargando…");
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      notifyGrokError(err instanceof SyntaxError ? new Error("El archivo no es un JSON válido.") : err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6">
        <h1 className="text-4xl text-cream">Copia de seguridad</h1>
        <p className="mt-1 text-muted">Tus datos viven en el servidor, pero puedes guardar una copia tú mismo.</p>
      </div>

      <div className="card p-5">
        <h2 className="text-lg text-cream">Exportar</h2>
        <p className="mt-1 text-sm text-muted">Descarga todo (libros, sesiones, citas, escritos…) en un archivo JSON.</p>
        <button onClick={exportData} disabled={busy} className="btn-gold mt-3">
          {busy ? "Trabajando…" : "⬇️ Descargar copia"}
        </button>
      </div>

      <div className="card mt-4 p-5">
        <h2 className="text-lg text-cream">Importar</h2>
        <p className="mt-1 text-sm text-muted">
          Restaura desde un archivo exportado. <span className="text-gold">Reemplaza</span> los datos actuales.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importData(f);
            e.target.value = ""; // permite re-seleccionar el mismo archivo
          }}
        />
        <button onClick={() => fileRef.current?.click()} disabled={busy} className="btn-ghost mt-3">
          ⬆️ Elegir archivo…
        </button>
      </div>
    </div>
  );
}
