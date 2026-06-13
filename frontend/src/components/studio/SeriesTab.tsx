import { useEffect, useState } from "react";
import { api, type Series, type SeriesEpisode } from "../../lib/api";
import { notifyOk, notifyGrokError } from "../../lib/notify";
import GrokLoading from "../GrokLoading";

/**
 * Series y formatos recurrentes (Módulo 6).
 * Defines una serie con plantilla fija y luego generas "el próximo episodio".
 */
export default function SeriesTab() {
  const [series, setSeries] = useState<Series[]>([]);
  const [showForm, setShowForm] = useState(false);

  // Formulario de nueva serie.
  const [form, setForm] = useState({
    name: "",
    description: "",
    hashtag: "",
    template: "",
    frequency: "semanal",
  });

  // Serie seleccionada + sus episodios.
  const [selected, setSelected] = useState<Series | null>(null);
  const [episodes, setEpisodes] = useState<SeriesEpisode[]>([]);
  const [topic, setTopic] = useState("");
  const [generating, setGenerating] = useState(false);

  function load() {
    api.listSeries().then(setSeries).catch(() => {});
  }
  useEffect(load, []);

  async function createSeries() {
    if (!form.name.trim()) return notifyGrokError(new Error("Ponle nombre a la serie."));
    try {
      await api.createSeries(form);
      setForm({ name: "", description: "", hashtag: "", template: "", frequency: "semanal" });
      setShowForm(false);
      notifyOk("Serie creada.");
      load();
    } catch (err) {
      notifyGrokError(err);
    }
  }

  async function select(s: Series) {
    setSelected(s);
    setEpisodes(await api.listEpisodes(s.id));
  }

  async function generateNext() {
    if (!selected) return;
    if (!topic.trim()) return notifyGrokError(new Error("Tema del episodio."));
    setGenerating(true);
    try {
      const ep = await api.nextEpisode(selected.id, topic);
      setEpisodes((prev) => [ep, ...prev]);
      setTopic("");
      notifyOk(`Episodio #${ep.episode_number} generado.`);
      load();
    } catch (err) {
      notifyGrokError(err, generateNext);
    } finally {
      setGenerating(false);
    }
  }

  async function removeSeries(id: number) {
    if (!confirm("¿Borrar la serie y todos sus episodios?")) return;
    await api.deleteSeries(id);
    if (selected?.id === id) setSelected(null);
    load();
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[300px_1fr]">
      {/* Lista de series */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg text-cream">Mis series</h3>
          <button onClick={() => setShowForm(!showForm)} className="btn-ghost text-xs">
            {showForm ? "Cancelar" : "+ Nueva"}
          </button>
        </div>

        {showForm && (
          <div className="card mb-4 space-y-2 p-4">
            <input className="input" placeholder="Nombre" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="input" placeholder="Descripción" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <input className="input" placeholder="#hashtag oficial" value={form.hashtag}
              onChange={(e) => setForm({ ...form, hashtag: e.target.value })} />
            <textarea className="input min-h-[80px] resize-y" placeholder="Plantilla de guion (estructura fija que Grok respeta)"
              value={form.template} onChange={(e) => setForm({ ...form, template: e.target.value })} />
            <select className="input" value={form.frequency}
              onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
              <option value="semanal">Semanal</option>
              <option value="quincenal">Quincenal</option>
            </select>
            <button onClick={createSeries} className="btn-gold w-full">Crear serie</button>
          </div>
        )}

        <div className="space-y-2">
          {series.map((s) => (
            <div key={s.id} className={`card flex items-center justify-between p-3 ${selected?.id === s.id ? "border-gold" : ""}`}>
              <button onClick={() => select(s)} className="flex-1 text-left">
                <p className="text-sm text-cream">{s.name}</p>
                <p className="font-mono text-xs text-muted">{s.episode_count} episodios · {s.frequency}</p>
              </button>
              <button onClick={() => removeSeries(s.id)} className="ml-2 text-muted hover:text-red-400">✕</button>
            </div>
          ))}
          {series.length === 0 && <p className="text-sm text-muted">Crea tu primera serie.</p>}
        </div>
      </div>

      {/* Detalle de la serie */}
      <div>
        {selected ? (
          <>
            <h3 className="font-display text-2xl text-cream">{selected.name}</h3>
            {selected.hashtag && <p className="text-sm text-gold">{selected.hashtag}</p>}
            {selected.description && <p className="mt-1 text-muted">{selected.description}</p>}

            <div className="mt-4 flex flex-wrap gap-3">
              <input className="input flex-1" placeholder="Tema del próximo episodio"
                value={topic} onChange={(e) => setTopic(e.target.value)} />
              <button onClick={generateNext} disabled={generating} className="btn-gold">
                {generating ? "Generando…" : "Generar próximo episodio"}
              </button>
            </div>

            {generating && <GrokLoading />}

            <div className="mt-6 space-y-3">
              {episodes.map((ep) => (
                <details key={ep.id} className="card p-4">
                  <summary className="cursor-pointer font-serif text-lg text-gold">
                    Ep. {ep.episode_number}: {ep.title}
                  </summary>
                  <p className="mt-3 whitespace-pre-wrap text-sm text-cream/90">{ep.script}</p>
                </details>
              ))}
              {episodes.length === 0 && <p className="text-sm text-muted">Sin episodios todavía.</p>}
            </div>
          </>
        ) : (
          <p className="text-muted">Selecciona o crea una serie para empezar.</p>
        )}
      </div>
    </div>
  );
}
