import { useEffect, useState } from "react";
import { api, type InflNode } from "../lib/api";
import { notifyGrokError } from "../lib/notify";

/** ÁRBOL DE INFLUENCIAS (G5) — tu genealogía intelectual. */
export default function Influencias() {
  const [nodes, setNodes] = useState<InflNode[]>([]);
  const [adding, setAdding] = useState<number | "root" | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  function load() { api.listInfluences().then(setNodes).catch(() => {}); }
  useEffect(load, []);

  const childrenOf = (pid: number | null) => nodes.filter((n) => n.parent_id === pid);

  async function add(name: string, parent_id: number | null) {
    if (!name.trim()) return;
    await api.addInfluence({ name: name.trim(), parent_id }).catch(notifyGrokError);
    setAdding(null);
    load();
  }
  async function expand(id: number) {
    setBusy(id);
    try { setNodes(await api.expandInfluence(id)); } catch (e) { notifyGrokError(e); } finally { setBusy(null); }
  }
  async function remove(id: number) {
    if (!confirm("¿Borrar esta influencia y las suyas?")) return;
    await api.deleteInfluence(id).catch(() => {});
    load();
  }

  function Node({ node }: { node: InflNode }) {
    const kids = childrenOf(node.id);
    return (
      <div className="ml-4 border-l border-border pl-4">
        <div className="card my-2 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="font-serif text-lg text-cream">{node.name}</span>
            <div className="flex shrink-0 gap-2 text-xs">
              <button onClick={() => expand(node.id)} disabled={busy === node.id} className="text-gold hover:underline">{busy === node.id ? "…" : "✨ influencias"}</button>
              <button onClick={() => setAdding(node.id)} className="text-muted hover:text-cream">+</button>
              <button onClick={() => remove(node.id)} className="text-muted hover:text-rose-400">✕</button>
            </div>
          </div>
          {node.note && <p className="mt-1 text-sm text-muted">{node.note}</p>}
          {node.key_works && <p className="mt-1 text-xs text-gold">Clave: {node.key_works}</p>}
          {adding === node.id && <AddInline onAdd={(n) => add(n, node.id)} onCancel={() => setAdding(null)} />}
        </div>
        {kids.map((k) => <Node key={k.id} node={k} />)}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4">
        <h1 className="text-4xl text-cream">Árbol de influencias</h1>
        <p className="mt-1 text-muted">Tu genealogía intelectual. Agrega autores que te marcaron y deja que la IA suba por sus raíces.</p>
      </div>

      <div className="card p-3">
        <div className="flex items-center justify-between">
          <span className="font-display text-xl text-gold">Tú</span>
          <button onClick={() => setAdding("root")} className="btn-ghost !px-3 !py-1.5 text-sm">+ Agregar influencia</button>
        </div>
        {adding === "root" && <AddInline onAdd={(n) => add(n, null)} onCancel={() => setAdding(null)} />}
      </div>

      <div className="mt-2">
        {childrenOf(null).map((n) => <Node key={n.id} node={n} />)}
        {childrenOf(null).length === 0 && <p className="mt-4 text-muted">Empieza agregando un autor que te haya marcado.</p>}
      </div>
    </div>
  );
}

function AddInline({ onAdd, onCancel }: { onAdd: (name: string) => void; onCancel: () => void }) {
  const [v, setV] = useState("");
  return (
    <div className="mt-2 flex gap-2">
      <input autoFocus value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") onAdd(v); if (e.key === "Escape") onCancel(); }} placeholder="Nombre del autor…" className="input !py-1.5" />
      <button onClick={() => onAdd(v)} className="btn-gold shrink-0 !px-3 !py-1.5 text-sm">Añadir</button>
    </div>
  );
}
