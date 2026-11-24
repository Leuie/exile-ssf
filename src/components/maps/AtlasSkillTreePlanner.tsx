import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Search,
  Save,
  Plus,
  Trash2,
  Loader2,
  Sparkles,
  X,
  Compass
} from 'lucide-react';
import { fetchUserToolState, saveUserToolState } from '../../services/cloudSync';

// [id, x, y, kind (0=small,1=notable,2=keystone,3=wormhole/gateway,4=mastery,5=rootStart), name, stats, icon, groupId, orbit, angleRad]
type GraphNodeTuple = [number, number, number, number, string, string[], string, number, number, number];

interface SpriteCoord {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface SpriteSheet {
  url: string;
  coords: Record<string, SpriteCoord>;
}

interface AtlasGraphData {
  nodes: GraphNodeTuple[];
  edges: Array<[number, number]>;
  groupBgs?: Array<[number, number, number, string, number]>;
  groupCenters?: Record<string, [number, number]>;
  orbitRadii?: number[];
  sprites?: Record<string, SpriteSheet | null>;
}

interface ParsedAtlasNode {
  id: number;
  x: number;
  y: number;
  kind: number;
  name: string;
  stats: string[];
  icon: string;
  groupId: number;
  orbit: number;
  angle: number;
  searchBlob: string;
}

export interface SavedAtlasTree {
  id: string;
  name: string;
  strategy: string;
  nodeIds: number[];
  updatedAtIso: string;
}

const LOCAL_ATLAS_TREES_KEY = 'exile_ssf_atlas_skill_trees_v1';
const MAX_ATLAS_POINTS = 150;
const SPRITE_WORLD_SCALE = 0.26075;

let cachedAtlasGraph: AtlasGraphData | null = null;
let inflightAtlasFetch: Promise<AtlasGraphData | null> | null = null;
const atlasSpriteCache = new Map<string, HTMLImageElement>();

async function loadOfficialAtlasGraph(): Promise<AtlasGraphData | null> {
  if (cachedAtlasGraph) return cachedAtlasGraph;
  if (inflightAtlasFetch) return inflightAtlasFetch;
  inflightAtlasFetch = fetch('/api/farming/atlastree-graph')
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (data && Array.isArray(data.nodes) && Array.isArray(data.edges)) {
        cachedAtlasGraph = data as AtlasGraphData;
        return cachedAtlasGraph;
      }
      return null;
    })
    .catch(() => null)
    .finally(() => {
      inflightAtlasFetch = null;
    });
  return inflightAtlasFetch;
}

function getOrLoadAtlasSprite(url: string, onLoaded: () => void): HTMLImageElement | null {
  if (!url) return null;
  const existing = atlasSpriteCache.get(url);
  if (existing) {
    return existing.complete && existing.naturalWidth > 0 ? existing : null;
  }
  const img = new Image();
  img.decoding = 'async';
  img.onload = () => onLoaded();
  img.src = url;
  atlasSpriteCache.set(url, img);
  return null;
}

function readLocalAtlasTrees(): SavedAtlasTree[] {
  try {
    const raw = localStorage.getItem(LOCAL_ATLAS_TREES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const KIND_LABELS: Record<number, string> = {
  0: 'Atlas Passive',
  1: 'Atlas Notable',
  2: 'Atlas Keystone',
  3: 'Atlas Gateway',
  4: 'Atlas Hub',
  5: 'Atlas Start'
};

interface AtlasSkillTreePlannerProps {
  userHandle?: string;
  activeStrategy?: string;
}

export const AtlasSkillTreePlanner: React.FC<AtlasSkillTreePlannerProps> = ({
  userHandle,
  activeStrategy = 'Alch & Go'
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [graph, setGraph] = useState<AtlasGraphData | null>(cachedAtlasGraph);
  const [loadingGraph, setLoadingGraph] = useState<boolean>(!cachedAtlasGraph);
  const [spriteTick, setSpriteTick] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMaximized, setIsMaximized] = useState<boolean>(false);

  const [savedTrees, setSavedTrees] = useState<SavedAtlasTree[]>(() => readLocalAtlasTrees());
  const [activeTreeId, setActiveTreeId] = useState<string>('');
  const [treeName, setTreeName] = useState<string>('My Atlas Strategy');
  const [allocatedIds, setAllocatedIds] = useState<number[]>([]);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  const [hoveredNode, setHoveredNode] = useState<{
    node: ParsedAtlasNode;
    allocated: boolean;
    screenX: number;
    screenY: number;
  } | null>(null);

  const [zoom, setZoom] = useState<number>(0.24);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragRef = useRef<{
    active: boolean;
    moved: boolean;
    startX: number;
    startY: number;
    origPanX: number;
    origPanY: number;
  }>({
    active: false,
    moved: false,
    startX: 0,
    startY: 0,
    origPanX: 0,
    origPanY: 0
  });
  const initializedRef = useRef<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    if (!cachedAtlasGraph) {
      setLoadingGraph(true);
      loadOfficialAtlasGraph().then((data) => {
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

  // Preload official GGG Atlas sprite sheets
  useEffect(() => {
    if (!graph?.sprites) return;
    let alive = true;
    const bump = () => {
      if (alive) setSpriteTick((t) => t + 1);
    };
    const urls = new Set<string>();
    for (const sheet of Object.values(graph.sprites)) {
      if (sheet?.url) urls.add(sheet.url);
    }
    urls.forEach((u) => getOrLoadAtlasSprite(u, bump));
    return () => {
      alive = false;
    };
  }, [graph]);

  // Load saved Atlas trees from Cloud if signed in
  useEffect(() => {
    if (!userHandle) return;
    let cancelled = false;
    fetchUserToolState<{ trees?: SavedAtlasTree[] }>(userHandle, 'atlas_skill_trees').then((cloud) => {
      if (!cancelled && cloud && Array.isArray(cloud.trees) && cloud.trees.length > 0) {
        setSavedTrees(cloud.trees);
        try {
          localStorage.setItem(LOCAL_ATLAS_TREES_KEY, JSON.stringify(cloud.trees));
        } catch {}
      }
    });
    return () => {
      cancelled = true;
    };
  }, [userHandle]);

  const allocatedSet = useMemo(() => new Set<number>(allocatedIds), [allocatedIds]);

  // Static graph geometry & adjacency (depends ONLY on graph so allocating nodes NEVER resets zoom/pan!)
  const parsedGraph = useMemo(() => {
    if (!graph) return null;
    const nodes: ParsedAtlasNode[] = [];
    const byId = new Map<number, ParsedAtlasNode>();
    const startNodeIds = new Set<number>();
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const tuple of graph.nodes) {
      const [id, x, y, kind, name, stats, icon = '', groupId = 0, orbit = 0, angle = 0] = tuple;
      const nd: ParsedAtlasNode = {
        id,
        x,
        y,
        kind,
        name: name || '',
        stats: Array.isArray(stats) ? stats : [],
        icon: icon || '',
        groupId,
        orbit,
        angle,
        searchBlob: `${name || ''} ${(Array.isArray(stats) ? stats.join(' ') : '')}`.toLowerCase()
      };
      nodes.push(nd);
      byId.set(id, nd);
      if (kind === 5) startNodeIds.add(id);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }

    const edges: Array<{ a: ParsedAtlasNode; b: ParsedAtlasNode }> = [];
    const adj = new Map<number, number[]>();
    const addAdj = (u: number, v: number) => {
      const arr = adj.get(u) || [];
      arr.push(v);
      adj.set(u, arr);
    };

    for (const [fromId, toId] of graph.edges) {
      const a = byId.get(fromId);
      const b = byId.get(toId);
      if (!a || !b) continue;
      if (a.kind === 4 || b.kind === 4) continue;
      edges.push({ a, b });
      addAdj(a.id, b.id);
      addAdj(b.id, a.id);
    }

    return {
      nodes,
      byId,
      edges,
      adj,
      startNodeIds,
      groupBgs: graph.groupBgs || [],
      groupCenters: graph.groupCenters || {},
      orbitRadii: graph.orbitRadii || [0, 8, 16, 34, 49, 66, 85],
      sprites: graph.sprites || {},
      bounds: { minX, maxX, minY, maxY }
    };
  }, [graph]);

  // Nodes currently eligible to allocate (directly connected to Start or an already-allocated node)
  const allocatableSet = useMemo(() => {
    const set = new Set<number>();
    if (!parsedGraph) return set;
    const roots = new Set<number>([...parsedGraph.startNodeIds, ...allocatedIds]);
    for (const rId of roots) {
      const neighbors = parsedGraph.adj.get(rId) || [];
      for (const nId of neighbors) {
        if (!allocatedSet.has(nId) && !parsedGraph.startNodeIds.has(nId)) {
          set.add(nId);
        }
      }
    }
    return set;
  }, [parsedGraph, allocatedIds, allocatedSet]);

  const resetView = useCallback(() => {
    const el = containerRef.current;
    if (!el || !parsedGraph) return;
    const w = el.clientWidth || 680;
    const h = el.clientHeight || 460;
    const { minX, maxX, minY, maxY } = parsedGraph.bounds;
    const bw = Math.max(120, maxX - minX);
    const bh = Math.max(120, maxY - minY);
    const nextZoom = Math.min(2.2, Math.max(0.1, Math.min((w - 36) / bw, (h - 36) / bh)));
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    setZoom(nextZoom);
    setPan({ x: w / 2 - cx * nextZoom, y: h / 2 - cy * nextZoom });
  }, [parsedGraph]);

  useEffect(() => {
    if (!parsedGraph) return;
    if (!initializedRef.current) {
      initializedRef.current = true;
      resetView();
    }
  }, [parsedGraph, resetView]);

  useEffect(() => {
    if (!parsedGraph) return;
    const t = window.setTimeout(() => resetView(), 60);
    return () => window.clearTimeout(t);
  }, [isMaximized, parsedGraph, resetView]);

  const matchingIds = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || !parsedGraph) return new Set<number>();
    const set = new Set<number>();
    for (const nd of parsedGraph.nodes) {
      if (nd.searchBlob.includes(q)) set.add(nd.id);
    }
    return set;
  }, [searchQuery, parsedGraph]);

  const allocatedHighlights = useMemo(() => {
    if (!parsedGraph) return { keystones: [] as ParsedAtlasNode[], notables: [] as ParsedAtlasNode[] };
    const keystones: ParsedAtlasNode[] = [];
    const notables: ParsedAtlasNode[] = [];
    for (const id of allocatedIds) {
      const nd = parsedGraph.byId.get(id);
      if (!nd) continue;
      if (nd.kind === 2) keystones.push(nd);
      else if (nd.kind === 1) notables.push(nd);
    }
    return { keystones, notables };
  }, [parsedGraph, allocatedIds]);

  // Render Official Atlas Skill Tree Canvas with GGG Sprite Artwork & Curved Orbits
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = container.clientWidth || 680;
    const height = container.clientHeight || 460;
    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bump = () => setSpriteTick((t) => t + 1);

    const drawSpriteCentered = (
      sheet: SpriteSheet | null | undefined,
      key: string,
      wx: number,
      wy: number,
      scaleMult = 1
    ): boolean => {
      if (!sheet?.url || !sheet.coords) return false;
      const c = sheet.coords[key];
      if (!c) return false;
      const img = getOrLoadAtlasSprite(sheet.url, bump);
      if (!img) return false;
      const dw = c.w * SPRITE_WORLD_SCALE * scaleMult;
      const dh = c.h * SPRITE_WORLD_SCALE * scaleMult;
      ctx.drawImage(img, c.x, c.y, c.w, c.h, wx - dw / 2, wy - dh / 2, dw, dh);
      return true;
    };

    const drawCircularIcon = (
      sheet: SpriteSheet | null | undefined,
      key: string,
      wx: number,
      wy: number,
      radius: number
    ): boolean => {
      if (!sheet?.url || !sheet.coords) return false;
      const c = sheet.coords[key];
      if (!c) return false;
      const img = getOrLoadAtlasSprite(sheet.url, bump);
      if (!img) return false;
      ctx.save();
      ctx.beginPath();
      ctx.arc(wx, wy, radius, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, c.x, c.y, c.w, c.h, wx - radius, wy - radius, radius * 2, radius * 2);
      ctx.restore();
      return true;
    };

    ctx.save();
    ctx.scale(dpr, dpr);

    const bgGrad = ctx.createRadialGradient(width / 2, height * 0.65, 30, width / 2, height / 2, Math.max(width, height) * 0.8);
    bgGrad.addColorStop(0, '#0d1424');
    bgGrad.addColorStop(1, '#04070e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    if (parsedGraph) {
      const { sprites, groupBgs, groupCenters, orbitRadii } = parsedGraph;

      // 1. Official Atlas Group Wheel Backgrounds (including Searing Exarch & Eater of Worlds!)
      const gbSheet = sprites.groupBackground;
      if (gbSheet?.url && gbSheet.coords) {
        const gbImg = getOrLoadAtlasSprite(gbSheet.url, bump);
        if (gbImg) {
          ctx.save();
          ctx.globalAlpha = 0.65;
          for (const [, gx, gy, bgName, isHalf] of groupBgs) {
            const c = gbSheet.coords[bgName];
            if (!c) continue;
            const dw = c.w * SPRITE_WORLD_SCALE;
            const dh = c.h * SPRITE_WORLD_SCALE;
            if (isHalf) {
              ctx.drawImage(gbImg, c.x, c.y, c.w, c.h, gx - dw / 2, gy - dh, dw, dh);
              ctx.save();
              ctx.translate(gx, gy);
              ctx.scale(1, -1);
              ctx.drawImage(gbImg, c.x, c.y, c.w, c.h, -dw / 2, -dh, dw, dh);
              ctx.restore();
            } else {
              ctx.drawImage(gbImg, c.x, c.y, c.w, c.h, gx - dw / 2, gy - dh / 2, dw, dh);
            }
          }
          ctx.restore();
        }
      }

      const traceEdge = (a: ParsedAtlasNode, b: ParsedAtlasNode) => {
        if (a.groupId === b.groupId && a.orbit === b.orbit && a.orbit > 0) {
          const gc = groupCenters[String(a.groupId)];
          const r = orbitRadii[a.orbit] || 0;
          if (gc && r > 0) {
            const sa = a.angle - Math.PI / 2;
            const ea = b.angle - Math.PI / 2;
            let diff = ea - sa;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            ctx.moveTo(a.x, a.y);
            ctx.arc(gc[0], gc[1], r, sa, sa + diff, diff < 0);
            return;
          }
        }
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
      };

      const isEdgeAllocated = (a: ParsedAtlasNode, b: ParsedAtlasNode) => {
        const aActive = allocatedSet.has(a.id) || parsedGraph.startNodeIds.has(a.id);
        const bActive = allocatedSet.has(b.id) || parsedGraph.startNodeIds.has(b.id);
        return aActive && bActive && (allocatedSet.has(a.id) || allocatedSet.has(b.id));
      };

      // 2. Unallocated Atlas Paths
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.5)';
      ctx.lineWidth = Math.max(1.8, 2.8 / Math.sqrt(zoom));
      for (const e of parsedGraph.edges) {
        if (isEdgeAllocated(e.a, e.b)) continue;
        traceEdge(e.a, e.b);
      }
      ctx.stroke();

      // 3. Allocated Atlas Paths (Golden Glow + Bright Core)
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.lineWidth = Math.max(6.5, 9 / Math.sqrt(zoom));
      ctx.lineCap = 'round';
      for (const e of parsedGraph.edges) {
        if (!isEdgeAllocated(e.a, e.b)) continue;
        traceEdge(e.a, e.b);
      }
      ctx.stroke();

      ctx.beginPath();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = Math.max(3.2, 4.6 / Math.sqrt(zoom));
      ctx.lineCap = 'round';
      for (const e of parsedGraph.edges) {
        if (!isEdgeAllocated(e.a, e.b)) continue;
        traceEdge(e.a, e.b);
      }
      ctx.stroke();
      ctx.restore();

      // 4. Draw Official Atlas Nodes & Ornate Frames
      const frameSheet = sprites.frame;
      const startSheet = sprites.startNode;

      const drawNode = (nd: ParsedAtlasNode, isAlloc: boolean, isMatch: boolean) => {
        if (nd.kind === 5) {
          const drew = drawSpriteCentered(startSheet, 'AtlasPassiveSkillScreenStart', nd.x, nd.y, 1.0);
          if (!drew) {
            ctx.beginPath();
            ctx.arc(nd.x, nd.y, 18, 0, Math.PI * 2);
            ctx.fillStyle = '#1e293b';
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 2.4;
            ctx.fill();
            ctx.stroke();
          }
          return;
        }

        const radius =
          nd.kind === 2 ? 10.5 : nd.kind === 1 ? 7.6 : nd.kind === 3 ? 9.5 : nd.kind === 4 ? 8.5 : 5.0;

        if (isMatch) {
          ctx.beginPath();
          ctx.arc(nd.x, nd.y, radius + 8, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(250, 204, 21, 0.30)';
          ctx.fill();
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 2.6;
          ctx.stroke();
        }

        let drewIcon = false;
        if (nd.kind === 3) {
          drewIcon = drawCircularIcon(isAlloc ? sprites.wormholeActive : sprites.wormholeInactive, 'Wormhole', nd.x, nd.y, radius);
        } else if (nd.icon) {
          if (nd.kind === 2) {
            drewIcon = drawCircularIcon(isAlloc ? sprites.keystoneActive : sprites.keystoneInactive, nd.icon, nd.x, nd.y, radius);
          } else if (nd.kind === 1) {
            drewIcon = drawCircularIcon(isAlloc ? sprites.notableActive : sprites.notableInactive, nd.icon, nd.x, nd.y, radius);
          } else if (nd.kind === 4) {
            drewIcon = drawCircularIcon(sprites.mastery, nd.icon, nd.x, nd.y, radius);
          } else {
            drewIcon = drawCircularIcon(isAlloc ? sprites.normalActive : sprites.normalInactive, nd.icon, nd.x, nd.y, radius);
          }
        }

        if (!drewIcon) {
          ctx.beginPath();
          ctx.arc(nd.x, nd.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = isAlloc
            ? nd.kind === 2
              ? '#fde047'
              : nd.kind === 3
              ? '#c084fc'
              : '#38bdf8'
            : '#1e293b';
          ctx.fill();
        }

        const canAlloc = !isAlloc && allocatableSet.has(nd.id);
        let frameKey = '';
        if (nd.kind === 2) {
          frameKey = isAlloc
            ? 'KeystoneFrameAllocated'
            : canAlloc
            ? 'KeystoneFrameCanAllocate'
            : 'KeystoneFrameUnallocated';
        } else if (nd.kind === 1) {
          frameKey = isAlloc
            ? 'NotableFrameAllocated'
            : canAlloc
            ? 'NotableFrameCanAllocate'
            : 'NotableFrameUnallocated';
        } else if (nd.kind === 3) {
          frameKey = isAlloc
            ? 'WormholeFrameAllocated'
            : canAlloc
            ? 'WormholeFrameCanAllocate'
            : 'WormholeFrameUnallocated';
        } else if (nd.kind === 0) {
          frameKey = isAlloc ? 'PSSkillFrameActive' : canAlloc ? 'PSSkillFrameHighlighted' : 'PSSkillFrame';
        }

        const drewFrame = frameKey ? drawSpriteCentered(frameSheet, frameKey, nd.x, nd.y, 1.0) : false;
        if (!drewFrame && nd.kind !== 4) {
          ctx.beginPath();
          ctx.arc(nd.x, nd.y, radius, 0, Math.PI * 2);
          ctx.strokeStyle = isAlloc ? '#38bdf8' : '#475569';
          ctx.lineWidth = isAlloc ? 2.0 : 1.1;
          ctx.stroke();
        }
      };

      for (const nd of parsedGraph.nodes) {
        if (!allocatedSet.has(nd.id)) drawNode(nd, false, matchingIds.has(nd.id));
      }
      for (const nd of parsedGraph.nodes) {
        if (allocatedSet.has(nd.id)) drawNode(nd, true, matchingIds.has(nd.id));
      }
    }

    ctx.restore();
  }, [parsedGraph, allocatedSet, allocatableSet, zoom, pan, matchingIds, isMaximized, spriteTick]);

  const findHitNode = (clientX: number, clientY: number) => {
    if (!parsedGraph || !canvasRef.current) return null;
    const rect = canvasRef.current.getBoundingClientRect();
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;
    const wx = (sx - pan.x) / zoom;
    const wy = (sy - pan.y) / zoom;

    const hitRadius = Math.max(13, 18 / zoom);
    const hitSq = hitRadius * hitRadius;
    let best: ParsedAtlasNode | null = null;
    let bestDist = hitSq;

    for (const nd of parsedGraph.nodes) {
      if (nd.kind === 4 || nd.kind === 5) continue;
      const dx = nd.x - wx;
      const dy = nd.y - wy;
      const d = dx * dx + dy * dy;
      if (d < bestDist) {
        bestDist = d;
        best = nd;
      }
    }
    return best ? { node: best, sx, sy } : null;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.18 : 0.85;
    const nextZoom = Math.min(3.2, Math.max(0.08, zoom * factor));
    const ratio = nextZoom / zoom;
    setPan({ x: mx - (mx - pan.x) * ratio, y: my - (my - pan.y) * ratio });
    setZoom(nextZoom);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    dragRef.current = {
      active: true,
      moved: false,
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
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) dragRef.current.moved = true;
      setPan({ x: dragRef.current.origPanX + dx, y: dragRef.current.origPanY + dy });
      setHoveredNode(null);
      return;
    }
    const hit = findHitNode(e.clientX, e.clientY);
    if (hit) {
      setHoveredNode({
        node: hit.node,
        allocated: allocatedSet.has(hit.node.id),
        screenX: hit.sx,
        screenY: hit.sy
      });
    } else {
      setHoveredNode(null);
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const wasClick = dragRef.current.active && !dragRef.current.moved;
    dragRef.current.active = false;
    if (!wasClick || !parsedGraph) return;
    const hit = findHitNode(e.clientX, e.clientY);
    if (!hit) return;

    const targetId = hit.node.id;
    setAllocatedIds((prev) => {
      // Refunding an allocated node: only allow if all remaining nodes stay connected to Start
      if (prev.includes(targetId)) {
        const remaining = new Set(prev.filter((id) => id !== targetId));
        if (remaining.size === 0) return [];
        const visited = new Set<number>();
        const queue: number[] = [...parsedGraph.startNodeIds];
        for (const s of queue) visited.add(s);
        while (queue.length > 0) {
          const cur = queue.shift()!;
          for (const nb of parsedGraph.adj.get(cur) || []) {
            if (!visited.has(nb) && remaining.has(nb)) {
              visited.add(nb);
              queue.push(nb);
            }
          }
        }
        // Check every remaining allocated node is still reachable from Start
        for (const id of remaining) {
          if (!visited.has(id)) {
            return prev; // Cannot break path continuity
          }
        }
        return Array.from(remaining);
      }

      // Allocating a new node: must be directly connected to Start or an already-allocated node
      if (prev.length >= MAX_ATLAS_POINTS) return prev;
      const neighbors = parsedGraph.adj.get(targetId) || [];
      const isConnected = neighbors.some(
        (nb) => parsedGraph.startNodeIds.has(nb) || prev.includes(nb)
      );
      if (!isConnected) return prev;
      return [...prev, targetId];
    });
  };

  const zoomBy = (factor: number) => {
    const el = containerRef.current;
    const cx = (el?.clientWidth || 680) / 2;
    const cy = (el?.clientHeight || 460) / 2;
    const nextZoom = Math.min(3.2, Math.max(0.08, zoom * factor));
    const ratio = nextZoom / zoom;
    setPan({ x: cx - (cx - pan.x) * ratio, y: cy - (cy - pan.y) * ratio });
    setZoom(nextZoom);
  };

  const persistTrees = (next: SavedAtlasTree[]) => {
    setSavedTrees(next);
    try {
      localStorage.setItem(LOCAL_ATLAS_TREES_KEY, JSON.stringify(next));
    } catch {}
    if (userHandle) {
      void saveUserToolState(userHandle, 'atlas_skill_trees', { trees: next });
    }
  };

  const handleSaveTree = () => {
    const cleanName = treeName.trim() || 'Untitled Atlas Tree';
    const id = activeTreeId || `atlas-${Date.now()}`;
    const entry: SavedAtlasTree = {
      id,
      name: cleanName,
      strategy: activeStrategy,
      nodeIds: allocatedIds,
      updatedAtIso: new Date().toISOString()
    };
    const exists = savedTrees.some((t) => t.id === id);
    const next = exists ? savedTrees.map((t) => (t.id === id ? entry : t)) : [entry, ...savedTrees];
    persistTrees(next);
    setActiveTreeId(id);
    setSaveNotice(`Saved "${cleanName}" (${allocatedIds.length} pts)`);
    setTimeout(() => setSaveNotice(null), 2600);
  };

  const handleNewTree = () => {
    setActiveTreeId('');
    setTreeName('New Atlas Strategy');
    setAllocatedIds([]);
  };

  const handleLoadTree = (t: SavedAtlasTree) => {
    setActiveTreeId(t.id);
    setTreeName(t.name);
    setAllocatedIds(Array.isArray(t.nodeIds) ? t.nodeIds : []);
  };

  const handleDeleteTree = (id: string) => {
    const next = savedTrees.filter((t) => t.id !== id);
    persistTrees(next);
    if (activeTreeId === id) {
      setActiveTreeId('');
    }
  };

  const renderPlannerCanvas = (maximized: boolean) => (
    <div
      ref={containerRef}
      className={`relative rounded-xl border border-slate-800 bg-[#04070e] overflow-hidden select-none ${
        maximized ? 'w-full h-[80vh]' : 'w-full h-[460px]'
      }`}
    >
      {/* Top Floating Bar */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="relative pointer-events-auto">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Highlight Atlas nodes (Essence, Harvest, Scarab)..."
            className="pl-8 pr-8 py-1 w-56 sm:w-64 rounded-lg bg-slate-950/90 border border-slate-700/80 text-[11px] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400/70 backdrop-blur-sm"
          />
          {searchQuery.trim() && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono text-amber-300">
              {matchingIds.size}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 pointer-events-auto bg-slate-950/90 border border-slate-800 rounded-lg p-1 backdrop-blur-sm">
          <span className="px-2 py-0.5 rounded bg-sky-500/15 border border-sky-500/35 text-[10px] font-mono font-bold text-sky-300">
            {allocatedIds.length} / {MAX_ATLAS_POINTS} pts
          </span>
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
            onClick={resetView}
            className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
            title="Reset View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIsMaximized((v) => !v)}
            className="p-1 rounded hover:bg-slate-800 text-amber-300 hover:text-amber-200 cursor-pointer border-l border-slate-800 pl-1.5 ml-0.5"
            title={maximized ? 'Exit Fullscreen' : 'Maximize Atlas Tree'}
          >
            {maximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {loadingGraph && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/85 gap-2 text-xs font-mono text-sky-300">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading Official PoE Atlas Skill Tree...</span>
        </div>
      )}

      <canvas
        ref={canvasRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          dragRef.current.active = false;
          setHoveredNode(null);
        }}
        className="w-full h-full block cursor-crosshair"
      />

      {hoveredNode && (
        <div
          className="absolute z-30 pointer-events-none max-w-xs rounded-xl border border-sky-500/45 bg-slate-950/95 p-3 shadow-2xl space-y-1.5 backdrop-blur-md"
          style={{
            left: Math.min(hoveredNode.screenX + 14, (containerRef.current?.clientWidth || 680) - 270),
            top: Math.max(48, Math.min(hoveredNode.screenY + 14, (containerRef.current?.clientHeight || 460) - 160))
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-sky-200">{hoveredNode.node.name || 'Atlas Node'}</span>
            <span
              className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                hoveredNode.allocated
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : allocatableSet.has(hoveredNode.node.id)
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              {hoveredNode.allocated
                ? 'Allocated'
                : allocatableSet.has(hoveredNode.node.id)
                ? 'Click to Allocate'
                : 'Path Required'}
            </span>
          </div>
          <div className="text-[10px] font-mono text-slate-400">
            {KIND_LABELS[hoveredNode.node.kind] || 'Atlas Passive'}
          </div>
          {hoveredNode.node.stats.length > 0 && (
            <div className="pt-1 border-t border-slate-800 space-y-0.5">
              {hoveredNode.node.stats.map((st, idx) => (
                <div key={idx} className="text-[11px] text-amber-200 leading-snug">
                  {st}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="absolute bottom-2.5 left-2.5 z-10 px-2.5 py-1 rounded-lg bg-slate-950/85 border border-slate-800 text-[10px] font-mono text-slate-400 pointer-events-none">
        Click nodes to allocate • Scroll to zoom • Drag to pan
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Top Preset Save / Load Bar */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <input
          type="text"
          value={treeName}
          onChange={(e) => setTreeName(e.target.value)}
          placeholder="Atlas tree name (e.g. Essence + Destructive Play)"
          className="flex-1 min-w-[200px] px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold focus:outline-none focus:border-sky-400"
        />
        <button
          type="button"
          onClick={handleSaveTree}
          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold inline-flex items-center gap-1.5 cursor-pointer"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save Tree</span>
        </button>
        <button
          type="button"
          onClick={handleNewTree}
          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold inline-flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New</span>
        </button>
        {allocatedIds.length > 0 && (
          <button
            type="button"
            onClick={() => setAllocatedIds([])}
            className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/35 text-rose-300 font-semibold cursor-pointer"
          >
            Clear ({allocatedIds.length})
          </button>
        )}
        {saveNotice && (
          <span className="text-[11px] font-mono text-emerald-300 px-2 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/35">
            {saveNotice}
          </span>
        )}
      </div>

      {/* Main Split: Interactive Atlas Canvas + Saved Trees & Active Notables */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <div className="lg:col-span-8">{!isMaximized && renderPlannerCanvas(false)}</div>

        <div className="lg:col-span-4 space-y-3">
          {/* Saved Atlas Trees */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 space-y-2">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5" />
                <span>Saved Atlas Trees</span>
              </span>
              <span className="text-slate-500">{savedTrees.length}</span>
            </div>
            {savedTrees.length === 0 ? (
              <div className="text-[11px] text-slate-500 py-2">
                Click nodes on the Atlas tree and hit <strong className="text-slate-300">Save Tree</strong> to build your own strategy presets.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[175px] overflow-y-auto pr-0.5">
                {savedTrees.map((t) => {
                  const active = t.id === activeTreeId;
                  return (
                    <div
                      key={t.id}
                      onClick={() => handleLoadTree(t)}
                      className={`p-2 rounded-lg border flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                        active
                          ? 'bg-sky-500/15 border-sky-400/60 text-white'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-600 text-slate-300'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">{t.name}</div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {t.nodeIds.length} pts • {t.strategy}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTree(t.id);
                        }}
                        className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                        title="Delete saved Atlas tree"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Keystones & Notables Summary */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 space-y-2">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Allocated Keystones &amp; Notables</span>
              </span>
              <span className="text-slate-500">
                {allocatedHighlights.keystones.length + allocatedHighlights.notables.length}
              </span>
            </div>
            {allocatedHighlights.keystones.length === 0 && allocatedHighlights.notables.length === 0 ? (
              <div className="text-[11px] text-slate-500 py-2">
                No Atlas Keystones or Notables allocated yet.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[210px] overflow-y-auto pr-0.5 text-[11px]">
                {allocatedHighlights.keystones.map((k) => (
                  <div key={k.id} className="px-2 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <div className="font-bold text-amber-200">{k.name}</div>
                    {k.stats[0] && <div className="text-[10px] text-slate-300 truncate">{k.stats[0]}</div>}
                  </div>
                ))}
                {allocatedHighlights.notables.map((n) => (
                  <div key={n.id} className="px-2 py-1 rounded-lg bg-sky-500/10 border border-sky-500/25">
                    <div className="font-semibold text-sky-200">{n.name}</div>
                    {n.stats[0] && <div className="text-[10px] text-slate-400 truncate">{n.stats[0]}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Maximize Modal */}
      {isMaximized && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/92 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
          onClick={() => setIsMaximized(false)}
        >
          <div
            className="w-full max-w-[95vw] rounded-2xl border border-sky-500/40 bg-[#070b14] p-4 space-y-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="text-sm font-bold text-sky-200 flex items-center gap-2">
                <Compass className="w-4 h-4" />
                <span>{treeName} ({allocatedIds.length} / {MAX_ATLAS_POINTS} Atlas Points)</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMaximized(false)}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {renderPlannerCanvas(true)}
          </div>
        </div>
      )}
    </div>
  );
};
