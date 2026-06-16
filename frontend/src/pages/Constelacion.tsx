import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, type GraphData } from "../lib/api";

interface SimNode {
  id: string;
  type: "libro" | "tema";
  label: string;
  bookId?: number;
  degree: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const W = 900;
const H = 620;
const CX = W / 2;
const CY = H / 2;

/**
 * CONSTELACIÓN — grafo vivo de libros y temas.
 * Simulación de fuerzas (repulsión + resortes) con nodos arrastrables.
 */
export default function Constelacion() {
  const [data, setData] = useState<GraphData | null>(null);
  const [, setTick] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const navigate = useNavigate();

  const nodesRef = useRef<SimNode[]>([]);
  const linksRef = useRef<Array<{ a: number; b: number; kind: string }>>([]);
  const idxRef = useRef<Map<string, number>>(new Map());
  const alphaRef = useRef(1);
  const rafRef = useRef<number | undefined>(undefined);
  const runningRef = useRef(false);
  const dragRef = useRef<number | null>(null);
  const movedRef = useRef(false);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    api
      .getConstelacion()
      .then((g) => {
        setData(g);
        initSim(g);
      })
      .catch(() => {});
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      runningRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function initSim(g: GraphData) {
    const n = Math.max(g.nodes.length, 1);
    const idx = new Map<string, number>();
    const nodes: SimNode[] = g.nodes.map((node, i) => {
      idx.set(node.id, i);
      const ang = (i / n) * Math.PI * 2;
      return {
        ...node,
        x: CX + Math.cos(ang) * 200 + (Math.random() * 20 - 10),
        y: CY + Math.sin(ang) * 160 + (Math.random() * 20 - 10),
        vx: 0,
        vy: 0,
      };
    });
    idxRef.current = idx;
    nodesRef.current = nodes;
    linksRef.current = g.links
      .map((l) => ({ a: idx.get(l.source)!, b: idx.get(l.target)!, kind: l.kind }))
      .filter((l) => l.a != null && l.b != null);
    alphaRef.current = 1;
    ensureLoop();
  }

  function ensureLoop() {
    if (!runningRef.current) {
      runningRef.current = true;
      rafRef.current = requestAnimationFrame(loop);
    }
  }

  function loop() {
    step();
    setTick((t) => t + 1);
    if (alphaRef.current > 0.02 || dragRef.current !== null) {
      rafRef.current = requestAnimationFrame(loop);
    } else {
      runningRef.current = false;
    }
  }

  function step() {
    const nodes = nodesRef.current;
    const links = linksRef.current;
    const a = alphaRef.current;
    const REP = 5000;
    const LINK = 72;
    const SPRING = 0.04;
    const CENTER = 0.012;
    const DAMP = 0.82;

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const A = nodes[i];
        const B = nodes[j];
        let dx = A.x - B.x;
        let dy = A.y - B.y;
        let d2 = dx * dx + dy * dy;
        if (d2 < 0.01) {
          d2 = 0.01;
          dx = Math.random();
          dy = Math.random();
        }
        const d = Math.sqrt(d2);
        const f = Math.min(REP / d2, 50) * a;
        const fx = (dx / d) * f;
        const fy = (dy / d) * f;
        A.vx += fx;
        A.vy += fy;
        B.vx -= fx;
        B.vy -= fy;
      }
    }

    for (const l of links) {
      const A = nodes[l.a];
      const B = nodes[l.b];
      const dx = B.x - A.x;
      const dy = B.y - A.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 0.01;
      const diff = ((d - LINK) / d) * SPRING * a;
      const fx = dx * diff;
      const fy = dy * diff;
      A.vx += fx;
      A.vy += fy;
      B.vx -= fx;
      B.vy -= fy;
    }

    for (let i = 0; i < nodes.length; i++) {
      const N = nodes[i];
      if (dragRef.current === i) continue; // el nodo arrastrado no se mueve solo
      N.vx += (CX - N.x) * CENTER * a;
      N.vy += (CY - N.y) * CENTER * a;
      N.x += N.vx;
      N.y += N.vy;
      N.vx *= DAMP;
      N.vy *= DAMP;
      N.x = Math.max(24, Math.min(W - 24, N.x));
      N.y = Math.max(24, Math.min(H - 24, N.y));
    }

    alphaRef.current *= 0.985;
  }

  /* ---------- Interacción (arrastrar / seleccionar) ---------- */

  function toSvg(clientX: number, clientY: number) {
    const svg = svgRef.current!;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const m = svg.getScreenCTM();
    if (!m) return { x: 0, y: 0 };
    return pt.matrixTransform(m.inverse());
  }

  function onPointerDown(i: number, e: React.PointerEvent) {
    e.preventDefault();
    dragRef.current = i;
    movedRef.current = false;
    alphaRef.current = Math.max(alphaRef.current, 0.3);
    ensureLoop();
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }
  function onMove(e: PointerEvent) {
    if (dragRef.current === null) return;
    movedRef.current = true;
    const p = toSvg(e.clientX, e.clientY);
    const N = nodesRef.current[dragRef.current];
    N.x = p.x;
    N.y = p.y;
    N.vx = 0;
    N.vy = 0;
    alphaRef.current = Math.max(alphaRef.current, 0.15);
    ensureLoop();
  }
  function onUp() {
    const i = dragRef.current;
    dragRef.current = null;
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    if (!movedRef.current && i !== null) {
      const node = nodesRef.current[i];
      setSelected((s) => (s === node.id ? null : node.id));
    }
  }

  /* ---------- Render ---------- */

  const nodes = nodesRef.current;
  const links = linksRef.current;

  // Vecinos del nodo seleccionado (para resaltar).
  const neighbors = new Set<string>();
  if (selected) {
    neighbors.add(selected);
    for (const l of data?.links ?? []) {
      if (l.source === selected) neighbors.add(l.target);
      if (l.target === selected) neighbors.add(l.source);
    }
  }
  const selNode = selected ? nodes[idxRef.current.get(selected) ?? -1] : null;

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-4xl text-cream">Constelación</h1>
        <p className="mt-1 text-muted">
          Tus libros y las ideas que los unen. Arrastra las estrellas; toca una para ver sus conexiones.
        </p>
      </div>

      {data && data.nodes.length === 0 ? (
        <div className="card p-8 text-center text-muted">
          Aún no hay libros. Agrega libros (con temas) para ver su constelación.
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-xl border border-border bg-carbon">
          {/* Panel del nodo seleccionado */}
          {selNode && (
            <div className="absolute left-3 top-3 z-10 max-w-[70%] rounded-lg border border-border bg-surface/95 px-3 py-2 backdrop-blur">
              <div className="text-xs uppercase tracking-wide text-muted">
                {selNode.type === "libro" ? "Libro" : "Tema"}
              </div>
              <div className="font-serif text-lg text-cream">{selNode.label}</div>
              {selNode.type === "libro" && selNode.bookId != null && (
                <button
                  onClick={() => navigate(`/leer/${selNode.bookId}`)}
                  className="btn-gold mt-1 !px-3 !py-1 text-sm"
                >
                  📖 Leer
                </button>
              )}
            </div>
          )}

          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className="h-[68vh] w-full touch-none select-none"
            onClick={(e) => {
              if (e.target === svgRef.current) setSelected(null);
            }}
          >
            {/* Enlaces */}
            {links.map((l, i) => {
              const A = nodes[l.a];
              const B = nodes[l.b];
              if (!A || !B) return null;
              const active = !selected || (neighbors.has(A.id) && neighbors.has(B.id));
              return (
                <line
                  key={i}
                  x1={A.x}
                  y1={A.y}
                  x2={B.x}
                  y2={B.y}
                  stroke={l.kind === "autor" ? "rgb(var(--gold))" : "rgb(var(--muted))"}
                  strokeWidth={l.kind === "autor" ? 1.4 : 0.8}
                  strokeOpacity={active ? 0.5 : 0.08}
                />
              );
            })}

            {/* Nodos */}
            {nodes.map((n, i) => {
              const isBook = n.type === "libro";
              const r = isBook ? 7 + Math.min(n.degree, 6) : 4 + Math.min(n.degree, 5);
              const dim = selected && !neighbors.has(n.id);
              return (
                <g
                  key={n.id}
                  transform={`translate(${n.x} ${n.y})`}
                  onPointerDown={(e) => onPointerDown(i, e)}
                  className="cursor-pointer"
                  opacity={dim ? 0.2 : 1}
                >
                  <circle
                    r={r}
                    fill={isBook ? "rgb(var(--gold))" : "rgb(var(--surface))"}
                    stroke={isBook ? "rgb(var(--gold))" : "rgb(var(--muted))"}
                    strokeWidth={1}
                    fillOpacity={isBook ? 0.9 : 0.6}
                  />
                  <text
                    x={r + 4}
                    y={4}
                    fontSize={isBook ? 13 : 11}
                    fill={isBook ? "rgb(var(--cream))" : "rgb(var(--muted))"}
                    className="font-serif pointer-events-none"
                  >
                    {n.label.length > 26 ? n.label.slice(0, 24) + "…" : n.label}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Leyenda */}
          <div className="absolute bottom-3 right-3 flex gap-4 rounded-lg bg-surface/80 px-3 py-1.5 text-xs text-muted backdrop-blur">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-gold" /> Libro
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full border border-muted" /> Tema
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
