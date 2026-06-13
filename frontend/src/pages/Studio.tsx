import { useState } from "react";
import ScriptStudio from "../components/studio/ScriptStudio";
import HooksLab from "../components/studio/HooksLab";
import CaptionsTab from "../components/studio/CaptionsTab";
import RepurposeTab from "../components/studio/RepurposeTab";
import SeriesTab from "../components/studio/SeriesTab";

type Tab = "guiones" | "hooks" | "captions" | "repurpose" | "series";

const TABS: { id: Tab; label: string }[] = [
  { id: "guiones", label: "🎬 Guiones" },
  { id: "hooks", label: "🪝 Hooks" },
  { id: "captions", label: "#️⃣ Caption & Hashtags" },
  { id: "repurpose", label: "♻️ Repurpose" },
  { id: "series", label: "📺 Series" },
];

/**
 * STUDIO: hub de creación con pestañas.
 * Reúne guiones (M1), hooks (M2), captions (M8), repurpose (M9) y series (M6).
 */
export default function Studio() {
  const [tab, setTab] = useState<Tab>("guiones");
  // Hook que el "Laboratorio de hooks" envía al editor de guiones.
  const [hookForScript, setHookForScript] = useState<string | null>(null);

  function useHookInScript(hook: string) {
    setHookForScript(hook);
    setTab("guiones");
  }

  return (
    <div>
      <h1 className="text-4xl text-cream">Studio</h1>
      <p className="mt-1 text-muted">Tu mesa de trabajo para crear videos.</p>

      {/* Pestañas */}
      <div className="mt-6 flex flex-wrap gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-4 py-3 text-sm transition ${
              tab === t.id
                ? "border-gold text-gold"
                : "border-transparent text-muted hover:text-cream"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {tab === "guiones" && (
          <ScriptStudio
            injectedHook={hookForScript}
            onHookConsumed={() => setHookForScript(null)}
          />
        )}
        {tab === "hooks" && <HooksLab onUseHook={useHookInScript} />}
        {tab === "captions" && <CaptionsTab />}
        {tab === "repurpose" && <RepurposeTab />}
        {tab === "series" && <SeriesTab />}
      </div>
    </div>
  );
}
