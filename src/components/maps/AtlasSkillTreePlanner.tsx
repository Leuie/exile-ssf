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
  Compass,
  ListChecks,
  Share2,
  Download,
  Copy
} from 'lucide-react';
import { fetchUserToolState, saveUserToolState } from '../../services/cloudSync';
import { saveActiveStrategy } from '../../utils/activeCharacter';

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

function encodeAtlasShareCode(name: string, strategy: string, nodeIds: number[]): string {
  try {
    const json = JSON.stringify({ n: name.slice(0, 60), s: strategy.slice(0, 40), ids: nodeIds });
    return btoa(unescape(encodeURIComponent(json)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  } catch {
    return '';
  }
}

function decodeAtlasShareCode(rawCode: string): { name: string; strategy: string; nodeIds: number[] } | null {
  try {
    let code = rawCode.trim();
    if (!code) return null;
    if (code.includes('atlas=')) {
      const idx = code.indexOf('atlas=');
      code = code.slice(idx + 6).split(/[&#]/)[0];
    }
    const b64 = code.replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
    const json = decodeURIComponent(escape(atob(b64 + pad)));
    const parsed = JSON.parse(json);
    if (!parsed || !Array.isArray(parsed.ids)) return null;
    return {
      name: String(parsed.n || 'Imported Atlas Tree'),
      strategy: String(parsed.s || 'Alch & Go'),
      nodeIds: parsed.ids.map(Number).filter(Number.isFinite).slice(0, MAX_ATLAS_POINTS)
    };
  } catch {
    return null;
  }
}

interface AtlasSkillTreePlannerProps {
  userHandle?: string;
  activeStrategy?: string;
  onSelectStrategy?: (strategy: string, atlasTreeName: string) => void;
}

export const AtlasSkillTreePlanner: React.FC<AtlasSkillTreePlannerProps> = ({
  userHandle,
  activeStrategy = 'Alch & Go',
  onSelectStrategy
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [graph, setGraph] = useState<AtlasGraphData | null>(cachedAtlasGraph);
  const [loadingGraph, setLoadingGraph] = useState<boolean>(!cachedAtlasGraph);
  const [spriteTick, setSpriteTick] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [showStatsDrawer, setShowStatsDrawer] = useState<boolean>(false);
  const [statsFilter, setStatsFilter] = useState<string>('');

  const [savedTrees, setSavedTrees] = useState<SavedAtlasTree[]>(() => readLocalAtlasTrees());
  const [activeTreeId, setActiveTreeId] = useState<string>('');
  const [treeName, setTreeName] = useState<string>('My Atlas Strategy');
  const [allocatedIds, setAllocatedIds] = useState<number[]>([]);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [showImportBox, setShowImportBox] = useState<boolean>(false);
  const [importInput, setImportInput] = useState<string>('');

  // Auto-load shared Atlas Tree from URL (?atlas=...) on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('atlas');
      if (code) {
        const decoded = decodeAtlasShareCode(code);
        if (decoded) {
          setTreeName(decoded.name);
          setAllocatedIds(decoded.nodeIds);
          onSelectStrategy?.(decoded.strategy, decoded.name);
          setSaveNotice(`Loaded shared Atlas tree "${decoded.name}" (${decoded.nodeIds.length} pts)`);
          setTimeout(() => setSaveNotice(null), 3500);
        }
      }
    } catch {}
  }, []);

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

  // Aggregate & total all stat lines from every allocated Atlas node (just like in-game PoE "SHOW STATS")
  const totalAtlasStats = useMemo(() => {
    if (!parsedGraph || allocatedIds.length === 0) return [] as string[];
    const numericMap = new Map<string, { template: string; values: number[]; hasPlus: boolean[] }>();
    const plainLines = new Set<string>();

    for (const id of allocatedIds) {
      const nd = parsedGraph.byId.get(id);
      if (!nd || !Array.isArray(nd.stats)) continue;
      for (const rawLine of nd.stats) {
        const line = String(rawLine || '').trim();
        if (!line) continue;
        // Split multiline stat descriptions
        for (const subLine of line.split(/\r?\n/)) {
          const clean = subLine.trim();
          if (!clean) continue;
          const nums: number[] = [];
          const plusFlags: boolean[] = [];
          let idx = 0;
          // Preserve fixed threshold qualifiers (e.g. "Tier 14+", "Level 80") so they are never summed
          const fixedTokens: string[] = [];
          const protectedLine = clean.replace(/\b(Tier|Level)\s+(\d+\+?)/gi, (match) => {
            const tok = `__FIXED_${fixedTokens.length}__`;
            fixedTokens.push(match);
            return tok;
          });
          const template = protectedLine.replace(/([+-]?)(\d+(?:\.\d+)?)/g, (_m, sign, numStr) => {
            const val = parseFloat((sign === '-' ? '-' : '') + numStr);
            nums.push(val);
            plusFlags.push(sign === '+');
            return `{${idx++}}`;
          }).replace(/__FIXED_(\d+)__/g, (_m, fIdx) => fixedTokens[Number(fIdx)] || '');
          if (nums.length === 0) {
            plainLines.add(clean);
          } else {
            const existing = numericMap.get(template);
            if (existing && existing.values.length === nums.length) {
              for (let i = 0; i < nums.length; i++) {
                existing.values[i] = Math.round((existing.values[i] + nums[i]) * 100) / 100;
              }
            } else {
              numericMap.set(template, { template, values: nums, hasPlus: plusFlags });
            }
          }
        }
      }
    }

    const formattedNumeric = Array.from(numericMap.values()).map(({ template, values, hasPlus }) =>
      template.replace(/\{(\d+)\}/g, (_m, iStr) => {
        const i = Number(iStr);
        const v = values[i] ?? 0;
        const prefix = hasPlus[i] && v >= 0 ? '+' : '';
        return `${prefix}${v}`;
      })
    );

    return [...formattedNumeric, ...Array.from(plainLines)];
  }, [parsedGraph, allocatedIds]);

  const filteredAtlasStats = useMemo(() => {
    const q = statsFilter.trim().toLowerCase();
    if (!q) return totalAtlasStats;
    return totalAtlasStats.filter((s) => s.toLowerCase().includes(q));
  }, [totalAtlasStats, statsFilter]);

  // Multi-source BFS: shortest path from (Start U allocatedIds) to an unallocated target node
  const computeShortestPath = useCallback(
    (targetId: number, currentAllocated: number[]): number[] => {
      if (!parsedGraph) return [];
      const allocSet = new Set<number>(currentAllocated);
      if (allocSet.has(targetId) || parsedGraph.startNodeIds.has(targetId)) return [];

      const parent = new Map<number, number | null>();
      const queue: number[] = [];
      for (const s of parsedGraph.startNodeIds) {
        parent.set(s, null);
        queue.push(s);
      }
      for (const a of currentAllocated) {
        if (!parent.has(a)) {
          parent.set(a, null);
          queue.push(a);
        }
      }

      let found = false;
      let head = 0;
      while (head < queue.length) {
        const cur = queue[head++];
        if (cur === targetId) {
          found = true;
          break;
        }
        for (const nb of parsedGraph.adj.get(cur) || []) {
          if (!parent.has(nb)) {
            parent.set(nb, cur);
            queue.push(nb);
          }
        }
      }

      if (!found) return [];
      const path: number[] = [];
      let step: number | null | undefined = targetId;
      while (step !== null && step !== undefined && !allocSet.has(step) && !parsedGraph.startNodeIds.has(step)) {
        path.push(step);
        step = parent.get(step);
      }
      return path.reverse();
    },
    [parsedGraph]
  );

  // Branch refund BFS: find all allocated nodes that would be disconnected from Start if targetId is removed
  const computeBranchRefund = useCallback(
    (targetId: number, currentAllocated: number[]): number[] => {
      if (!parsedGraph) return [];
      const remaining = new Set<number>(currentAllocated.filter((id) => id !== targetId));
      const reachable = new Set<number>();
      const queue: number[] = [...parsedGraph.startNodeIds];
      for (const s of queue) reachable.add(s);

      let head = 0;
      while (head < queue.length) {
        const cur = queue[head++];
        for (const nb of parsedGraph.adj.get(cur) || []) {
          if (!reachable.has(nb) && remaining.has(nb)) {
            reachable.add(nb);
            queue.push(nb);
          }
        }
      }

      const toRemove: number[] = [targetId];
      for (const id of remaining) {
        if (!reachable.has(id)) toRemove.push(id);
      }
      return toRemove;
    },
    [parsedGraph]
  );

  // Live hover preview: shortest path to allocate (amber) OR entire branch to refund (crimson)
  const hoverPreview = useMemo(() => {
    if (!hoveredNode || !parsedGraph) {
      return { mode: 'none' as const, ids: new Set<number>(), count: 0, overCap: false };
    }
    const tid = hoveredNode.node.id;
    if (allocatedSet.has(tid)) {
      const refundIds = computeBranchRefund(tid, allocatedIds);
      return { mode: 'refund' as const, ids: new Set(refundIds), count: refundIds.length, overCap: false };
    }
    const pathIds = computeShortestPath(tid, allocatedIds);
    const overCap = allocatedIds.length + pathIds.length > MAX_ATLAS_POINTS;
    return { mode: 'allocate' as const, ids: new Set(pathIds), count: pathIds.length, overCap };
  }, [hoveredNode, parsedGraph, allocatedSet, allocatedIds, computeBranchRefund, computeShortestPath]);

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

      // 3b. Hover Preview Paths: Shortest Path to Allocate (Amber) OR Branch to Refund (Crimson)
      if (hoverPreview.mode === 'allocate' && hoverPreview.ids.size > 0) {
        const previewActive = (id: number) =>
          hoverPreview.ids.has(id) || allocatedSet.has(id) || parsedGraph.startNodeIds.has(id);
        ctx.beginPath();
        ctx.strokeStyle = hoverPreview.overCap ? 'rgba(244, 63, 94, 0.75)' : 'rgba(250, 204, 21, 0.85)';
        ctx.lineWidth = Math.max(3.5, 5.2 / Math.sqrt(zoom));
        ctx.lineCap = 'round';
        for (const e of parsedGraph.edges) {
          if (previewActive(e.a.id) && previewActive(e.b.id) && (hoverPreview.ids.has(e.a.id) || hoverPreview.ids.has(e.b.id))) {
            traceEdge(e.a, e.b);
          }
        }
        ctx.stroke();
      } else if (hoverPreview.mode === 'refund' && hoverPreview.ids.size > 0) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.9)';
        ctx.lineWidth = Math.max(3.8, 5.4 / Math.sqrt(zoom));
        ctx.lineCap = 'round';
        for (const e of parsedGraph.edges) {
          if (isEdgeAllocated(e.a, e.b) && (hoverPreview.ids.has(e.a.id) || hoverPreview.ids.has(e.b.id))) {
            traceEdge(e.a, e.b);
          }
        }
        ctx.stroke();
      }
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
        } else if (hoverPreview.ids.has(nd.id)) {
          ctx.beginPath();
          ctx.arc(nd.x, nd.y, radius + 6, 0, Math.PI * 2);
          ctx.fillStyle =
            hoverPreview.mode === 'refund' || hoverPreview.overCap
              ? 'rgba(244, 63, 94, 0.32)'
              : 'rgba(250, 204, 21, 0.32)';
          ctx.fill();
          ctx.strokeStyle =
            hoverPreview.mode === 'refund' || hoverPreview.overCap ? '#fb7185' : '#fde047';
          ctx.lineWidth = 2.4;
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
  }, [parsedGraph, allocatedSet, allocatableSet, hoverPreview, zoom, pan, matchingIds, isMaximized, spriteTick]);

  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchRef = useRef<{ dist: number; zoom: number; panX: number; panY: number; midX: number; midY: number } | null>(null);

  const findHitNode = (clientX: number, clientY: number, isTouch: boolean = false) => {
    if (!parsedGraph || !canvasRef.current) return null;
    const rect = canvasRef.current.getBoundingClientRect();
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;
    const wx = (sx - pan.x) / zoom;
    const wy = (sy - pan.y) / zoom;

    const hitRadius = Math.max(isTouch ? 20 : 13, (isTouch ? 26 : 18) / zoom);
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

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointersRef.current.size === 2) {
      const pts = Array.from(pointersRef.current.values());
      const rect = e.currentTarget.getBoundingClientRect();
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y) || 1;
      const midX = (pts[0].x + pts[1].x) / 2 - rect.left;
      const midY = (pts[0].y + pts[1].y) / 2 - rect.top;
      pinchRef.current = { dist, zoom, panX: pan.x, panY: pan.y, midX, midY };
      dragRef.current.active = false;
      setHoveredNode(null);
      return;
    }

    dragRef.current = {
      active: true,
      moved: false,
      startX: e.clientX,
      startY: e.clientY,
      origPanX: pan.x,
      origPanY: pan.y
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (pointersRef.current.has(e.pointerId)) {
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    if (pointersRef.current.size === 2 && pinchRef.current) {
      const pts = Array.from(pointersRef.current.values());
      const rect = e.currentTarget.getBoundingClientRect();
      const newDist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y) || 1;
      const newMidX = (pts[0].x + pts[1].x) / 2 - rect.left;
      const newMidY = (pts[0].y + pts[1].y) / 2 - rect.top;
      const scale = newDist / pinchRef.current.dist;
      const nextZoom = Math.min(3.2, Math.max(0.08, pinchRef.current.zoom * scale));
      const ratio = nextZoom / pinchRef.current.zoom;
      setPan({
        x: newMidX - (pinchRef.current.midX - pinchRef.current.panX) * ratio,
        y: newMidY - (pinchRef.current.midY - pinchRef.current.panY) * ratio
      });
      setZoom(nextZoom);
      setHoveredNode(null);
      return;
    }

    if (dragRef.current.active) {
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      const moveThresh = e.pointerType === 'touch' ? 7 : 4;
      if (Math.abs(dx) > moveThresh || Math.abs(dy) > moveThresh) dragRef.current.moved = true;
      if (dragRef.current.moved) {
        setPan({ x: dragRef.current.origPanX + dx, y: dragRef.current.origPanY + dy });
        setHoveredNode(null);
      }
      return;
    }
    if (e.pointerType !== 'mouse') return;
    const hit = findHitNode(e.clientX, e.clientY, false);
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

  const handlePointerUpOrCancel = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const wasClick = dragRef.current.active && !dragRef.current.moved && pointersRef.current.size === 1;
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
    if (pointersRef.current.size === 0) dragRef.current.active = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    if (!wasClick || !parsedGraph) return;
    const hit = findHitNode(e.clientX, e.clientY, e.pointerType !== 'mouse');
    if (!hit) return;

    const targetId = hit.node.id;
    setAllocatedIds((prev) => {
      // Branch Unallocate: refund target node + any orphaned nodes behind it
      if (prev.includes(targetId)) {
        const toRemove = new Set(computeBranchRefund(targetId, prev));
        return prev.filter((id) => !toRemove.has(id));
      }

      // Shortest-Path Auto-Allocate from Start or nearest allocated node
      const pathIds = computeShortestPath(targetId, prev);
      if (pathIds.length === 0) return prev;
      if (prev.length + pathIds.length > MAX_ATLAS_POINTS) return prev;
      return [...prev, ...pathIds];
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
    saveActiveStrategy({ strategy: activeStrategy, atlasTreeId: id, atlasTreeName: cleanName });
    onSelectStrategy?.(activeStrategy, cleanName);
    setSaveNotice(`Saved "${cleanName}" (${allocatedIds.length} pts) & linked to ${activeStrategy}`);
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
    saveActiveStrategy({ strategy: t.strategy, atlasTreeId: t.id, atlasTreeName: t.name });
    onSelectStrategy?.(t.strategy, t.name);
  };

  const handleCopyShareLink = () => {
    const code = encodeAtlasShareCode(treeName.trim() || 'Atlas Strategy', activeStrategy, allocatedIds);
    if (!code) return;
    const url = `${window.location.origin}/maps?atlas=${code}`;
    navigator.clipboard?.writeText(url);
    setSaveNotice('Copied shareable Atlas Tree link!');
    setTimeout(() => setSaveNotice(null), 2600);
  };

  const handleCopySquadSummary = () => {
    const code = encodeAtlasShareCode(treeName.trim() || 'Atlas Strategy', activeStrategy, allocatedIds);
    const url = code ? `${window.location.origin}/maps?atlas=${code}` : `${window.location.origin}/maps`;
    const keyNames = allocatedHighlights.keystones.map((k) => k.name).join(', ');
    const topStats = totalAtlasStats.slice(0, 6).map((s) => `• ${s}`).join('\n');
    const summary = [
      `**Atlas Tree: ${treeName.trim() || 'Atlas Strategy'}** (${allocatedIds.length}/${MAX_ATLAS_POINTS} pts • ${activeStrategy})`,
      keyNames ? `Keystones: ${keyNames}` : '',
      topStats ? `Top Modifiers:\n${topStats}` : '',
      `Inspect / Clone: ${url}`
    ]
      .filter(Boolean)
      .join('\n');
    navigator.clipboard?.writeText(summary);
    setSaveNotice('Copied Discord / Root Atlas summary!');
    setTimeout(() => setSaveNotice(null), 2600);
  };

  const handleImportCode = () => {
    const decoded = decodeAtlasShareCode(importInput);
    if (!decoded) {
      setSaveNotice('Invalid Atlas share code or link.');
      setTimeout(() => setSaveNotice(null), 2600);
      return;
    }
    setActiveTreeId('');
    setTreeName(decoded.name);
    setAllocatedIds(decoded.nodeIds);
    saveActiveStrategy({ strategy: decoded.strategy, atlasTreeName: decoded.name });
    onSelectStrategy?.(decoded.strategy, decoded.name);
    setShowImportBox(false);
    setImportInput('');
    setSaveNotice(`Imported "${decoded.name}" (${decoded.nodeIds.length} pts)!`);
    setTimeout(() => setSaveNotice(null), 2800);
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
            onClick={() => setShowStatsDrawer((v) => !v)}
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold inline-flex items-center gap-1 cursor-pointer border transition-colors ${
              showStatsDrawer
                ? 'bg-amber-500/25 border-amber-400/60 text-amber-200'
                : 'bg-slate-900 border-slate-700 text-amber-300 hover:bg-slate-800'
            }`}
            title="Show Total Combined Atlas Stats"
          >
            <ListChecks className="w-3 h-3" />
            <span>{showStatsDrawer ? 'Hide Stats' : 'Show Stats'}</span>
          </button>
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
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUpOrCancel}
        onPointerCancel={handlePointerUpOrCancel}
        onPointerLeave={(e) => {
          if (e.pointerType === 'mouse' && pointersRef.current.size === 0) {
            dragRef.current.active = false;
            setHoveredNode(null);
          }
        }}
        className="w-full h-full block cursor-crosshair touch-none"
      />

      {/* Authentic PoE-Style Floating "SHOW STATS" Drawer on Right Edge of Canvas */}
      {showStatsDrawer && (
        <div
          className="absolute top-12 right-2.5 bottom-10 z-20 w-72 sm:w-80 rounded-xl border border-amber-500/45 bg-slate-950/95 backdrop-blur-md shadow-2xl flex flex-col overflow-hidden"
          onWheel={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-2 border-b border-amber-500/25 bg-amber-950/25 flex items-center justify-between gap-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-300">
              Total Atlas Stats ({totalAtlasStats.length})
            </span>
            <button
              type="button"
              onClick={() => setShowStatsDrawer(false)}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="p-2 border-b border-slate-800/80">
            <input
              type="text"
              value={statsFilter}
              onChange={(e) => setStatsFilter(e.target.value)}
              placeholder="Filter stats (e.g. Ritual, Shrine, Scarab)..."
              className="w-full px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400/60"
            />
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5 text-[11px]">
            {filteredAtlasStats.length === 0 ? (
              <div className="text-slate-500 text-center py-6">
                {allocatedIds.length === 0
                  ? 'Allocate nodes on the Atlas tree to see your combined stats here.'
                  : 'No stats match your filter.'}
              </div>
            ) : (
              filteredAtlasStats.map((line, i) => (
                <div
                  key={i}
                  className="text-sky-200 leading-snug border-b border-slate-800/50 pb-1 last:border-b-0"
                >
                  {line}
                </div>
              ))
            )}
          </div>
        </div>
      )}

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
              className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded shrink-0 ${
                hoveredNode.allocated
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : hoverPreview.overCap
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : hoverPreview.count > 0
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-400/50'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              {hoveredNode.allocated
                ? `Refund (-${hoverPreview.count} ${hoverPreview.count === 1 ? 'pt' : 'pts'})`
                : hoverPreview.overCap
                ? `Needs ${hoverPreview.count} pts (Over ${MAX_ATLAS_POINTS})`
                : hoverPreview.count > 0
                ? `Allocate (+${hoverPreview.count} ${hoverPreview.count === 1 ? 'pt' : 'pts'})`
                : 'Unreachable'}
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
        Click any node for shortest path • Click branch root to refund branch • Scroll to zoom • Drag to pan
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
        <button
          type="button"
          disabled={allocatedIds.length === 0}
          onClick={handleCopyShareLink}
          className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/35 border border-indigo-400/50 text-indigo-200 font-semibold inline-flex items-center gap-1 cursor-pointer disabled:opacity-40"
          title="Copy shareable Atlas Tree URL for squadmates"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share Link</span>
        </button>
        <button
          type="button"
          disabled={allocatedIds.length === 0}
          onClick={handleCopySquadSummary}
          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-200 font-semibold inline-flex items-center gap-1 cursor-pointer disabled:opacity-40"
          title="Copy formatted Discord / Root summary with Keystones, top stats, and clone link"
        >
          <Copy className="w-3.5 h-3.5" />
          <span>Copy Summary</span>
        </button>
        <button
          type="button"
          onClick={() => setShowImportBox((v) => !v)}
          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-sky-200 font-semibold inline-flex items-center gap-1 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Import</span>
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

      {showImportBox && (
        <div className="p-2.5 rounded-xl border border-sky-500/35 bg-slate-950/90 flex flex-wrap items-center gap-2 text-xs">
          <input
            type="text"
            value={importInput}
            onChange={(e) => setImportInput(e.target.value)}
            placeholder="Paste a squadmate's Exile SSF Atlas Tree link or share code..."
            className="flex-1 min-w-[220px] px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 font-mono text-[11px] focus:outline-none focus:border-sky-400"
          />
          <button
            type="button"
            onClick={handleImportCode}
            className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold cursor-pointer"
          >
            Load Tree
          </button>
        </div>
      )}

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
          {/* Total Combined Atlas Stats Summary Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 space-y-2">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ListChecks className="w-3.5 h-3.5" />
                <span>Total Atlas Stats</span>
              </span>
              <span className="text-slate-500">{totalAtlasStats.length}</span>
            </div>
            {totalAtlasStats.length === 0 ? (
              <div className="text-[11px] text-slate-500 py-2">
                Allocate nodes to automatically total all Atlas modifiers here (or click <strong className="text-amber-300">Show Stats</strong> on the tree).
              </div>
            ) : (
              <div className="space-y-1 max-h-[210px] overflow-y-auto pr-0.5 text-[11px]">
                {totalAtlasStats.map((line, idx) => (
                  <div
                    key={idx}
                    className="text-sky-200 leading-snug border-b border-slate-800/50 pb-1 last:border-b-0"
                  >
                    {line}
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
