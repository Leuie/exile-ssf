import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Search,
  Crosshair,
  Loader2
} from 'lucide-react';

// Official GGG skilltree-export compact node tuple:
// [id, x, y, kind (0=small, 1=notable, 2=keystone, 3=jewel, 4=mastery, 5=classStart), name, stats]
type GraphNodeTuple = [number, number, number, number, string, string[]];

interface SkillTreeGraphData {
  nodes: GraphNodeTuple[];
  edges: Array<[number, number]>;
}

interface ParsedNode {
  id: number;
  x: number;
  y: number;
  kind: number;
  name: string;
  stats: string[];
  searchBlob: string;
}

// Module-level cache so the official tree graph is only fetched once per browser session
let cachedTreeGraph: SkillTreeGraphData | null = null;
let inflightTreeFetch: Promise<SkillTreeGraphData | null> | null = null;

async function loadOfficialSkillTreeGraph(): Promise<SkillTreeGraphData | null> {
  if (cachedTreeGraph) return cachedTreeGraph;
  if (inflightTreeFetch) return inflightTreeFetch;
  inflightTreeFetch = fetch('/api/farming/skilltree-graph')
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (data && Array.isArray(data.nodes) && Array.isArray(data.edges)) {
        cachedTreeGraph = data as SkillTreeGraphData;
        return cachedTreeGraph;
      }
      return null;
    })
    .catch(() => null)
    .finally(() => {
      inflightTreeFetch = null;
    });
  return inflightTreeFetch;
}

export interface OfficialPassiveTreeCanvasProps {
  allocatedHashes?: number[];
  fallbackPoints?: Array<[number, number, number]>;
  fallbackEdges?: Array<[number, number, number, number]>;
  allocatedCount: number;
  characterName: string;
  className?: string;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
}

const KIND_LABELS: Record<number, string> = {
  0: 'Passive Skill',
  1: 'Notable Passive',
  2: 'Keystone',
  3: 'Jewel Socket',
  4: 'Mastery',
  5: 'Class Start'
};

export const OfficialPassiveTreeCanvas: React.FC<OfficialPassiveTreeCanvasProps> = ({
  allocatedHashes = [],
  fallbackPoints = [],
  fallbackEdges = [],
  allocatedCount,
  characterName,
  className = 'w-full h-[420px]',
  isMaximized = false,
  onToggleMaximize
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [graph, setGraph] = useState<SkillTreeGraphData | null>(cachedTreeGraph);
  const [loadingGraph, setLoadingGraph] = useState<boolean>(!cachedTreeGraph);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hoveredNode, setHoveredNode] = useState<{
    node: ParsedNode;
    allocated: boolean;
    screenX: number;
    screenY: number;
  } | null>(null);

  // Camera transform: world (x, y) -> screen (x * zoom + panX, y * zoom + panY)
  const [zoom, setZoom] = useState<number>(0.24);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragRef = useRef<{ active: boolean; startX: number; startY: number; origPanX: number; origPanY: number }>({
    active: false,
    startX: 0,
    startY: 0,
    origPanX: 0,
    origPanY: 0
  });
  const initializedCameraRef = useRef<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    if (!cachedTreeGraph) {
      setLoadingGraph(true);
      loadOfficialSkillTreeGraph().then((data) => {
        if (!cancelled) {
          setGraph(data);
          setLoadingGraph(false);
        }
      });
    }
    return () => {
      cancelled = true;
    };
  }, []);

  const allocatedSet = useMemo(() => new Set<number>(allocatedHashes), [allocatedHashes]);

  const parsedGraph = useMemo(() => {
    if (!graph) return null;
    const nodes: ParsedNode[] = [];
    const byId = new Map<number, ParsedNode>();
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const tuple of graph.nodes) {
      const [id, x, y, kind, name, stats] = tuple;
      const nd: ParsedNode = {
        id,
        x,
        y,
        kind,
        name: name || '',
        stats: Array.isArray(stats) ? stats : [],
        searchBlob: `${name || ''} ${(Array.isArray(stats) ? stats.join(' ') : '')}`.toLowerCase()
      };
      nodes.push(nd);
      byId.set(id, nd);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }

    const edges: Array<{ a: ParsedNode; b: ParsedNode; allocated: boolean }> = [];
    for (const [fromId, toId] of graph.edges) {
      const a = byId.get(fromId);
      const b = byId.get(toId);
      if (!a || !b) continue;
      // Avoid long cross-map teleport lines if any
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      if (dx * dx + dy * dy > 180 * 180) continue;
      edges.push({
        a,
        b,
        allocated: allocatedSet.has(a.id) && allocatedSet.has(b.id)
      });
    }

    return { nodes, byId, edges, bounds: { minX, maxX, minY, maxY } };
  }, [graph, allocatedSet]);

  const fitBounds = useCallback(
    (bounds: { minX: number; maxX: number; minY: number; maxY: number }, padding = 60) => {
      const el = containerRef.current;
      if (!el) return;
      const w = el.clientWidth || 640;
      const h = el.clientHeight || 420;
      const bw = Math.max(120, bounds.maxX - bounds.minX);
      const bh = Math.max(120, bounds.maxY - bounds.minY);
      const nextZoom = Math.min(2.2, Math.max(0.08, Math.min((w - padding) / bw, (h - padding) / bh)));
      const cx = (bounds.minX + bounds.maxX) / 2;
      const cy = (bounds.minY + bounds.maxY) / 2;
      setZoom(nextZoom);
      setPan({ x: w / 2 - cx * nextZoom, y: h / 2 - cy * nextZoom });
    },
    []
  );

  const focusAllocated = useCallback(() => {
    if (!parsedGraph) return;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    let count = 0;

    if (allocatedSet.size > 0) {
      for (const nd of parsedGraph.nodes) {
        if (!allocatedSet.has(nd.id)) continue;
        if (nd.x < minX) minX = nd.x;
        if (nd.x > maxX) maxX = nd.x;
        if (nd.y < minY) minY = nd.y;
        if (nd.y > maxY) maxY = nd.y;
        count++;
      }
    } else if (fallbackPoints.length > 0) {
      for (const [x, y, flag] of fallbackPoints) {
        if (flag === 0) continue;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        count++;
      }
    }

    if (count > 2) {
      fitBounds({ minX: minX - 80, maxX: maxX + 80, minY: minY - 80, maxY: maxY + 80 }, 70);
    } else {
      fitBounds(parsedGraph.bounds, 40);
    }
  }, [parsedGraph, allocatedSet, fallbackPoints, fitBounds]);

  const resetFullTree = useCallback(() => {
    if (parsedGraph) {
      fitBounds(parsedGraph.bounds, 36);
    }
  }, [parsedGraph, fitBounds]);

  // Auto-center once graph loads or maximize toggles
  useEffect(() => {
    if (!parsedGraph) return;
    if (!initializedCameraRef.current) {
      initializedCameraRef.current = true;
      focusAllocated();
    }
  }, [parsedGraph, focusAllocated]);

  useEffect(() => {
    if (!parsedGraph) return;
    const t = window.setTimeout(() => focusAllocated(), 60);
    return () => window.clearTimeout(t);
  }, [isMaximized, parsedGraph, focusAllocated]);

  const matchingIds = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || !parsedGraph) return new Set<number>();
    const set = new Set<number>();
    for (const nd of parsedGraph.nodes) {
      if (nd.searchBlob.includes(q)) set.add(nd.id);
    }
    return set;
  }, [searchQuery, parsedGraph]);

  // Draw the official tree canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = container.clientWidth || 640;
    const height = container.clientHeight || 420;
    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.scale(dpr, dpr);

    // Deep Wraeclast starry backdrop
    const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 40, width / 2, height / 2, Math.max(width, height) * 0.75);
    bgGrad.addColorStop(0, '#0d1424');
    bgGrad.addColorStop(1, '#050811');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    if (parsedGraph) {
      const hasHashes = allocatedSet.size > 0;

      // 1. Unallocated web edges
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.35)';
      ctx.lineWidth = Math.max(1.2, 2.2 / Math.sqrt(zoom));
      for (const e of parsedGraph.edges) {
        if (e.allocated) continue;
        ctx.moveTo(e.a.x, e.a.y);
        ctx.lineTo(e.b.x, e.b.y);
      }
      ctx.stroke();

      // 2. Allocated golden edges (or fallback edges if snapshot predates allocatedHashes)
      ctx.beginPath();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = Math.max(3.2, 5.2 / Math.sqrt(zoom));
      ctx.lineCap = 'round';
      if (hasHashes) {
        for (const e of parsedGraph.edges) {
          if (!e.allocated) continue;
          ctx.moveTo(e.a.x, e.a.y);
          ctx.lineTo(e.b.x, e.b.y);
        }
      } else {
        for (const [x1, y1, x2, y2] of fallbackEdges) {
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
        }
      }
      ctx.stroke();

      // 3. Draw nodes (unallocated first, then allocated on top)
      const drawNode = (nd: ParsedNode, isAlloc: boolean, isMatch: boolean) => {
        let radius = 4.2;
        if (nd.kind === 5) radius = 14; // Class start
        else if (nd.kind === 2) radius = 11.5; // Keystone
        else if (nd.kind === 1) radius = 7.6; // Notable
        else if (nd.kind === 3) radius = 8.2; // Jewel socket
        else if (nd.kind === 4) radius = 8.5; // Mastery center

        if (isMatch) {
          ctx.beginPath();
          ctx.arc(nd.x, nd.y, radius + 7, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(34, 211, 238, 0.28)';
          ctx.fill();
          ctx.strokeStyle = '#22d3ee';
          ctx.lineWidth = 2.4;
          ctx.stroke();
        }

        ctx.beginPath();
        if (nd.kind === 3) {
          // Diamond jewel socket
          ctx.moveTo(nd.x, nd.y - radius);
          ctx.lineTo(nd.x + radius, nd.y);
          ctx.lineTo(nd.x, nd.y + radius);
          ctx.lineTo(nd.x - radius, nd.y);
          ctx.closePath();
        } else {
          ctx.arc(nd.x, nd.y, radius, 0, Math.PI * 2);
        }

        if (isAlloc) {
          if (nd.kind === 2) {
            ctx.fillStyle = '#fde047';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2.6;
          } else if (nd.kind === 3) {
            ctx.fillStyle = '#38bdf8';
            ctx.strokeStyle = '#e0f2fe';
            ctx.lineWidth = 2.2;
          } else if (nd.kind === 4) {
            ctx.fillStyle = '#34d399';
            ctx.strokeStyle = '#d1fae5';
            ctx.lineWidth = 2;
          } else if (nd.kind === 1) {
            ctx.fillStyle = '#fbbf24';
            ctx.strokeStyle = '#fef3c7';
            ctx.lineWidth = 2;
          } else {
            ctx.fillStyle = '#f59e0b';
            ctx.strokeStyle = '#fde68a';
            ctx.lineWidth = 1.2;
          }
          ctx.fill();
          ctx.stroke();
        } else {
          if (nd.kind === 5) {
            ctx.fillStyle = '#1e293b';
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 2;
          } else if (nd.kind === 2) {
            ctx.fillStyle = '#1e1b4b';
            ctx.strokeStyle = '#6366f1';
            ctx.lineWidth = 1.6;
          } else if (nd.kind === 3) {
            ctx.fillStyle = '#0c4a6e';
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 1.3;
          } else if (nd.kind === 4) {
            ctx.fillStyle = '#064e3b';
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 1.2;
          } else if (nd.kind === 1) {
            ctx.fillStyle = '#1e293b';
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 1.2;
          } else {
            ctx.fillStyle = '#1e293b';
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 0.8;
          }
          ctx.fill();
          ctx.stroke();
        }
      };

      for (const nd of parsedGraph.nodes) {
        const isAlloc = hasHashes && allocatedSet.has(nd.id);
        if (!isAlloc) drawNode(nd, false, matchingIds.has(nd.id));
      }
      if (hasHashes) {
        for (const nd of parsedGraph.nodes) {
          if (allocatedSet.has(nd.id)) drawNode(nd, true, matchingIds.has(nd.id));
        }
      } else {
        // Legacy snapshot fallback (before allocatedHashes was saved)
        for (const [x, y, flag] of fallbackPoints) {
          if (flag === 0) continue;
          ctx.beginPath();
          ctx.arc(x, y, flag === 2 ? 9.5 : 5.5, 0, Math.PI * 2);
          ctx.fillStyle = flag === 2 ? '#fde047' : '#f59e0b';
          ctx.strokeStyle = '#fef3c7';
          ctx.lineWidth = 1.6;
          ctx.fill();
          ctx.stroke();
        }
      }
    }

    ctx.restore();
  }, [parsedGraph, allocatedSet, fallbackPoints, fallbackEdges, zoom, pan, matchingIds, isMaximized]);

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.18 : 0.85;
    const nextZoom = Math.min(2.6, Math.max(0.08, zoom * factor));
    const scaleRatio = nextZoom / zoom;
    setPan({
      x: mx - (mx - pan.x) * scaleRatio,
      y: my - (my - pan.y) * scaleRatio
    });
    setZoom(nextZoom);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      origPanX: pan.x,
      origPanY: pan.y
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (dragRef.current.active) {
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setPan({ x: dragRef.current.origPanX + dx, y: dragRef.current.origPanY + dy });
      setHoveredNode(null);
      return;
    }

    if (!parsedGraph) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const wx = (sx - pan.x) / zoom;
    const wy = (sy - pan.y) / zoom;

    const hitRadius = Math.max(12, 16 / zoom);
    const hitSq = hitRadius * hitRadius;
    let best: ParsedNode | null = null;
    let bestDist = hitSq;

    for (const nd of parsedGraph.nodes) {
      const dx = nd.x - wx;
      const dy = nd.y - wy;
      const d = dx * dx + dy * dy;
      if (d < bestDist) {
        bestDist = d;
        best = nd;
      }
    }

    if (best) {
      setHoveredNode({
        node: best,
        allocated: allocatedSet.has(best.id),
        screenX: sx,
        screenY: sy
      });
    } else {
      setHoveredNode(null);
    }
  };

  const handleMouseUpOrLeave = () => {
    dragRef.current.active = false;
  };

  const zoomBy = (factor: number) => {
    const el = containerRef.current;
    const cx = (el?.clientWidth || 640) / 2;
    const cy = (el?.clientHeight || 420) / 2;
    const nextZoom = Math.min(2.6, Math.max(0.08, zoom * factor));
    const scaleRatio = nextZoom / zoom;
    setPan({
      x: cx - (cx - pan.x) * scaleRatio,
      y: cy - (cy - pan.y) * scaleRatio
    });
    setZoom(nextZoom);
  };

  return (
    <div
      ref={containerRef}
      className={`relative rounded-xl border border-slate-800/90 bg-[#050811] overflow-hidden select-none ${className}`}
    >
      {/* Top Interactive Controls Bar */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Search Nodes */}
        <div className="relative pointer-events-auto">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Highlight nodes (e.g. Life, Suppress)..."
            className="pl-8 pr-3 py-1 w-48 sm:w-56 rounded-lg bg-slate-950/90 border border-slate-700/80 text-[11px] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400/70 backdrop-blur-sm"
          />
          {searchQuery.trim() && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono text-cyan-300">
              {matchingIds.size}
            </span>
          )}
        </div>

        {/* Zoom / Pan / Maximize Controls */}
        <div className="flex items-center gap-1 pointer-events-auto bg-slate-950/90 border border-slate-800 rounded-lg p-1 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => zoomBy(1.3)}
            className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => zoomBy(0.76)}
            className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={focusAllocated}
            className="p-1 rounded hover:bg-slate-800 text-amber-300 hover:text-amber-200 cursor-pointer"
            title="Focus Allocated Passives"
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={resetFullTree}
            className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
            title="Reset Full Tree View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          {onToggleMaximize && (
            <button
              type="button"
              onClick={onToggleMaximize}
              className="p-1 rounded hover:bg-slate-800 text-amber-300 hover:text-amber-200 cursor-pointer border-l border-slate-800 pl-1.5 ml-0.5"
              title={isMaximized ? 'Exit Fullscreen' : 'Maximize Passive Tree'}
            >
              {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Loading Indicator */}
      {loadingGraph && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/85 gap-2 text-xs font-mono text-amber-300">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading Official PoE Passive Skill Tree...</span>
        </div>
      )}

      {/* Interactive Canvas */}
      <canvas
        ref={canvasRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={() => {
          handleMouseUpOrLeave();
          setHoveredNode(null);
        }}
        className="w-full h-full block cursor-grab active:cursor-grabbing"
      />

      {/* Rich Node Hover Tooltip */}
      {hoveredNode && (
        <div
          className="absolute z-30 pointer-events-none max-w-xs rounded-xl border border-amber-500/45 bg-slate-950/95 p-3 shadow-2xl space-y-1.5 backdrop-blur-md"
          style={{
            left: Math.min(hoveredNode.screenX + 14, (containerRef.current?.clientWidth || 640) - 270),
            top: Math.max(48, Math.min(hoveredNode.screenY + 14, (containerRef.current?.clientHeight || 420) - 160))
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-amber-200">
              {hoveredNode.node.name || 'Passive Node'}
            </span>
            <span
              className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                hoveredNode.allocated
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {hoveredNode.allocated ? 'Allocated' : 'Unallocated'}
            </span>
          </div>
          <div className="text-[10px] font-mono text-slate-400">
            {KIND_LABELS[hoveredNode.node.kind] || 'Passive Skill'}
          </div>
          {hoveredNode.node.stats.length > 0 && (
            <div className="pt-1 border-t border-slate-800 space-y-0.5">
              {hoveredNode.node.stats.map((st, idx) => (
                <div key={idx} className="text-[11px] text-sky-200 leading-snug">
                  {st}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bottom Legend Bar */}
      <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="px-2.5 py-1 rounded-lg bg-slate-950/85 border border-slate-800 text-[10px] font-mono text-slate-400 flex items-center gap-2.5">
          <span className="text-amber-300 font-bold">{characterName}</span>
          <span>•</span>
          <span>{allocatedCount} Passives</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">Scroll to Zoom • Drag to Pan</span>
        </div>
        <div className="px-2 py-1 rounded-lg bg-slate-950/85 border border-slate-800 text-[10px] font-mono text-slate-400 hidden md:flex items-center gap-2.5">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-300" /> Keystone</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> Notable</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rotate-45 bg-sky-400" /> Jewel</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Mastery</span>
        </div>
      </div>
    </div>
  );
};
