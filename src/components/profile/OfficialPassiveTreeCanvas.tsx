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

// [id, x, y, kind (0=small,1=notable,2=keystone,3=jewel,4=mastery,5=classStart), name, stats, icon, groupId, orbit, angleRad, ascName, isAscStart]
type GraphNodeTuple = [number, number, number, number, string, string[], string, number, number, number, string, number];

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

interface SkillTreeGraphData {
  nodes: GraphNodeTuple[];
  edges: Array<[number, number]>;
  groupBgs?: Array<[number, number, number, string, number]>;
  groupCenters?: Record<string, [number, number]>;
  orbitRadii?: number[];
  sprites?: Record<string, SpriteSheet | null>;
}

interface ParsedNode {
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
  ascName: string;
  isAscStart: boolean;
  searchBlob: string;
}

// 1 pixel at GGG 0.3835 sprite scale = 1 / 0.3835 raw units = 0.26075 scaled (/10) world units
const SPRITE_WORLD_SCALE = 0.26075;

const CLASS_START_SPRITES: Record<string, string> = {
  marauder: 'centermarauder',
  witch: 'centerwitch',
  ranger: 'centerranger',
  duelist: 'centerduelist',
  shadow: 'centershadow',
  templar: 'centertemplar',
  scion: 'centerscion'
};

// Module-level cache for official graph & loaded sprite images
let cachedTreeGraph: SkillTreeGraphData | null = null;
let inflightTreeFetch: Promise<SkillTreeGraphData | null> | null = null;
const spriteImageCache = new Map<string, HTMLImageElement>();

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

function getOrLoadSpriteImage(url: string, onLoaded: () => void): HTMLImageElement | null {
  if (!url) return null;
  const existing = spriteImageCache.get(url);
  if (existing) {
    return existing.complete && existing.naturalWidth > 0 ? existing : null;
  }
  const img = new Image();
  img.decoding = 'async';
  img.onload = () => onLoaded();
  img.src = url;
  spriteImageCache.set(url, img);
  return null;
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
  const [spriteTick, setSpriteTick] = useState<number>(0);
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

  // Preload official GGG sprite sheets when graph arrives
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
    urls.forEach((u) => getOrLoadSpriteImage(u, bump));
    return () => {
      alive = false;
    };
  }, [graph]);

  const allocatedSet = useMemo(() => new Set<number>(allocatedHashes), [allocatedHashes]);

  const parsedGraph = useMemo(() => {
    if (!graph) return null;
    const allNodes: ParsedNode[] = [];
    const byId = new Map<number, ParsedNode>();
    let activeAscName = '';

    for (const tuple of graph.nodes) {
      const [id, x, y, kind, name, stats, icon = '', groupId = 0, orbit = 0, angle = 0, ascName = '', isAscStart = 0] = tuple;
      const nd: ParsedNode = {
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
        ascName: ascName || '',
        isAscStart: Boolean(isAscStart),
        searchBlob: `${name || ''} ${ascName || ''} ${(Array.isArray(stats) ? stats.join(' ') : '')}`.toLowerCase()
      };
      allNodes.push(nd);
      byId.set(id, nd);
      if (nd.ascName && allocatedSet.has(nd.id)) {
        activeAscName = nd.ascName;
      }
    }

    // Keep ALL main-tree nodes + ALL Ascendancy wheels (active Ascendancy highlighted!)
    const nodes: ParsedNode[] = [];
    const visibleIds = new Set<number>();
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    const ascCenters: Array<{ x: number; y: number; name: string; isActive: boolean }> = [];
    const seenAscCenters = new Set<string>();

    for (const nd of allNodes) {
      nodes.push(nd);
      visibleIds.add(nd.id);
      if (!nd.ascName) {
        if (nd.x < minX) minX = nd.x;
        if (nd.x > maxX) maxX = nd.x;
        if (nd.y < minY) minY = nd.y;
        if (nd.y > maxY) maxY = nd.y;
      } else if (nd.isAscStart && !seenAscCenters.has(nd.ascName)) {
        seenAscCenters.add(nd.ascName);
        const gc = graph.groupCenters?.[String(nd.groupId)];
        ascCenters.push({
          x: gc ? gc[0] : nd.x,
          y: gc ? gc[1] : nd.y,
          name: nd.ascName,
          isActive: nd.ascName === activeAscName
        });
      }
    }

    const shiftedGroupCenters: Record<string, [number, number]> = {};
    if (graph.groupCenters) {
      for (const [k, v] of Object.entries(graph.groupCenters)) {
        shiftedGroupCenters[k] = [v[0], v[1]];
      }
    }

    // Class Ascendancies grouped by home starting quadrant so each stays aligned with its class
    const CLASS_QUADRANTS: Array<{ names: string[]; angleDeg: number; radiusOffset: number; tangentStep: number }> = [
      // Witch (Top)
      { names: ['Occultist', 'Elementalist', 'Necromancer'], angleDeg: -90, radiusOffset: 245, tangentStep: 255 },
      // Shadow (Top-Right)
      { names: ['Assassin', 'Trickster', 'Saboteur'], angleDeg: -22, radiusOffset: 270, tangentStep: 255 },
      // Ranger (Bottom-Right)
      { names: ['Deadeye', 'Pathfinder', 'Warden', 'Raider'], angleDeg: 26, radiusOffset: 295, tangentStep: 255 },
      // Duelist (Bottom)
      { names: ['Slayer', 'Champion', 'Gladiator'], angleDeg: 90, radiusOffset: 245, tangentStep: 255 },
      // Marauder (Bottom-Left)
      { names: ['Juggernaut', 'Berserker', 'Chieftain'], angleDeg: 156, radiusOffset: 270, tangentStep: 255 },
      // Templar (Top-Left)
      { names: ['Inquisitor', 'Hierophant', 'Guardian'], angleDeg: -156, radiusOffset: 270, tangentStep: 255 },
      // Scion (Outer Top-Left / Lower-Left flank)
      { names: ['Ascendant', 'Reliquarian', 'Luminary'], angleDeg: 122, radiusOffset: 300, tangentStep: 255 }
    ];

    const classAscNameSet = new Set<string>(CLASS_QUADRANTS.flatMap((q) => q.names));

    // Position Class Ascendancies cleanly in their home quadrants (zero overlap)
    // and Bloodline Ascendancies in 2 evenly spaced horizontal rows at the bottom
    if (ascCenters.length > 0 && Number.isFinite(minX) && Number.isFinite(maxX)) {
      const treeCx = (minX + maxX) / 2;
      const treeCy = (minY + maxY) / 2;
      let maxMainR = 0;
      for (const nd of nodes) {
        if (nd.ascName) continue;
        const d = Math.hypot(nd.x - treeCx, nd.y - treeCy);
        if (d > maxMainR) maxMainR = d;
      }

      const ascByName = new Map(ascCenters.map((ac) => [ac.name, ac]));
      const ascDelta = new Map<string, { dx: number; dy: number }>();
      const repositionedCenters: Array<{ x: number; y: number; name: string; isActive: boolean }> = [];
      let lowestClassAscY = maxY + 260;

      // 1. Place Class Ascendancies in their home quadrants without overlap
      for (const quad of CLASS_QUADRANTS) {
        const present = quad.names
          .map((n) => ascByName.get(n))
          .filter((v): v is { x: number; y: number; name: string; isActive: boolean } => Boolean(v));
        if (present.length === 0) continue;

        const rad = (quad.angleDeg * Math.PI) / 180;
        const dist = maxMainR + quad.radiusOffset;
        const anchorX = treeCx + dist * Math.cos(rad);
        const anchorY = treeCy + dist * Math.sin(rad);
        // Unit tangent vector perpendicular to radial direction
        const tx = -Math.sin(rad);
        const ty = Math.cos(rad);
        const mid = (present.length - 1) / 2;

        present.forEach((ac, idx) => {
          const offset = (idx - mid) * quad.tangentStep;
          const targetX = Math.round(anchorX + tx * offset);
          const targetY = Math.round(anchorY + ty * offset);
          if (targetY > lowestClassAscY) lowestClassAscY = targetY;
          ascDelta.set(ac.name, { dx: targetX - ac.x, dy: targetY - ac.y });
          repositionedCenters.push({
            x: targetX,
            y: targetY,
            name: ac.name,
            isActive: ac.isActive
          });
        });
      }

      // 2. Place Bloodline / secondary Ascendancies in 2 evenly spaced horizontal rows at the bottom
      const bloodlines = ascCenters
        .filter((ac) => !classAscNameSet.has(ac.name))
        .sort((a, b) => a.name.localeCompare(b.name));

      if (bloodlines.length > 0) {
        const row1Count = Math.ceil(bloodlines.length / 2);
        const rows = [bloodlines.slice(0, row1Count), bloodlines.slice(row1Count)];
        const colSpacing = 275;
        const rowSpacing = 275;
        const startY = lowestClassAscY + 320;

        rows.forEach((row, rIdx) => {
          const mid = (row.length - 1) / 2;
          const rowY = Math.round(startY + rIdx * rowSpacing);
          row.forEach((ac, cIdx) => {
            const targetX = Math.round(treeCx + (cIdx - mid) * colSpacing);
            ascDelta.set(ac.name, { dx: targetX - ac.x, dy: rowY - ac.y });
            repositionedCenters.push({
              x: targetX,
              y: rowY,
              name: ac.name,
              isActive: ac.isActive
            });
          });
        });
      }

      // Shift every Ascendancy node and its group center by its wheel's delta
      const shiftedGroups = new Set<string>();
      for (const nd of nodes) {
        if (!nd.ascName) continue;
        const delta = ascDelta.get(nd.ascName);
        if (!delta) continue;
        nd.x += delta.dx;
        nd.y += delta.dy;
        const gKey = String(nd.groupId);
        if (!shiftedGroups.has(gKey) && shiftedGroupCenters[gKey]) {
          shiftedGroups.add(gKey);
          shiftedGroupCenters[gKey] = [
            shiftedGroupCenters[gKey][0] + delta.dx,
            shiftedGroupCenters[gKey][1] + delta.dy
          ];
        }
      }

      ascCenters.length = 0;
      ascCenters.push(...repositionedCenters);
    }

    const edges: Array<{ a: ParsedNode; b: ParsedNode; allocated: boolean; isInactiveAsc: boolean }> = [];
    for (const [fromId, toId] of graph.edges) {
      if (!visibleIds.has(fromId) || !visibleIds.has(toId)) continue;
      const a = byId.get(fromId);
      const b = byId.get(toId);
      if (!a || !b) continue;
      // Skip mastery center connection lines (mastery centers float inside clusters)
      if (a.kind === 4 || b.kind === 4) continue;
      const isInactiveAsc = Boolean(a.ascName && a.ascName !== activeAscName);
      edges.push({
        a,
        b,
        allocated: allocatedSet.has(a.id) && allocatedSet.has(b.id),
        isInactiveAsc
      });
    }

    return {
      nodes,
      byId,
      edges,
      activeAscName,
      ascCenters,
      groupBgs: graph.groupBgs || [],
      groupCenters: shiftedGroupCenters,
      orbitRadii: graph.orbitRadii || [0, 8, 16, 34, 49, 66, 85],
      sprites: graph.sprites || {},
      bounds: { minX, maxX, minY, maxY }
    };
  }, [graph, allocatedSet]);

  const fitBounds = useCallback(
    (bounds: { minX: number; maxX: number; minY: number; maxY: number }, padding = 60) => {
      const el = containerRef.current;
      if (!el) return;
      const w = el.clientWidth || 640;
      const h = el.clientHeight || 420;
      const bw = Math.max(120, bounds.maxX - bounds.minX);
      const bh = Math.max(120, bounds.maxY - bounds.minY);
      const nextZoom = Math.min(2.4, Math.max(0.12, Math.min((w - padding) / bw, (h - padding) / bh)));
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
      fitBounds({ minX: minX - 70, maxX: maxX + 70, minY: minY - 70, maxY: maxY + 70 }, 70);
    } else {
      fitBounds(parsedGraph.bounds, 40);
    }
  }, [parsedGraph, allocatedSet, fallbackPoints, fitBounds]);

  const resetFullTree = useCallback(() => {
    if (parsedGraph) {
      fitBounds(parsedGraph.bounds, 36);
    }
  }, [parsedGraph, fitBounds]);

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

  // Draw the authentic official PoE Passive Skill Tree canvas
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
      const img = getOrLoadSpriteImage(sheet.url, bump);
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
      const img = getOrLoadSpriteImage(sheet.url, bump);
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

    // Authentic dark PoE tree backdrop
    const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 40, width / 2, height / 2, Math.max(width, height) * 0.78);
    bgGrad.addColorStop(0, '#0c121e');
    bgGrad.addColorStop(1, '#04070d');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    if (parsedGraph) {
      const { sprites, groupBgs, groupCenters, orbitRadii, ascCenters, activeAscName } = parsedGraph;
      const hasHashes = allocatedSet.size > 0;

      // 1. Official Group Wheel Backgrounds (PSGroupBackground1 / 2 / 3)
      const gbSheet = sprites.groupBackground;
      if (gbSheet?.url && gbSheet.coords) {
        const gbImg = getOrLoadSpriteImage(gbSheet.url, bump);
        if (gbImg) {
          ctx.save();
          ctx.globalAlpha = 0.62;
          for (const [, gx, gy, bgName, isHalf] of groupBgs) {
            const c = gbSheet.coords[bgName];
            if (!c) continue;
            const dw = c.w * SPRITE_WORLD_SCALE;
            const dh = c.h * SPRITE_WORLD_SCALE;
            if (isHalf) {
              // Top half + mirrored bottom half (authentic PoE large cluster background)
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

      // 2. All Ascendancy Wheel Artworks (dimmed for unchosen, full brightness + golden halo for active Ascendancy)
      if (ascCenters.length > 0 && sprites.ascendancy) {
        for (const ac of ascCenters) {
          ctx.save();
          if (ac.isActive) {
            // Glowing golden halo denoting the character's active Ascendancy
            const coord = sprites.ascendancy.coords?.[`Classes${ac.name}`];
            const ringR = coord ? (Math.max(coord.w, coord.h) * SPRITE_WORLD_SCALE) / 2 + 8 : 115;
            ctx.beginPath();
            ctx.arc(ac.x, ac.y, ringR, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(245, 158, 11, 0.14)';
            ctx.fill();
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = Math.max(4, 5.5 / Math.sqrt(zoom));
            ctx.stroke();
            ctx.globalAlpha = 1.0;
          } else {
            ctx.globalAlpha = 0.42;
          }
          drawSpriteCentered(sprites.ascendancy, `Classes${ac.name}`, ac.x, ac.y, 1.0);
          ctx.restore();
        }
      }

      // Helper to trace an edge (true curved circular orbit arc when nodes share group & orbit!)
      const traceEdge = (a: ParsedNode, b: ParsedNode) => {
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

      // 3. Unallocated Connection Web (curved arcs + straight highways)
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.48)';
      ctx.lineWidth = Math.max(1.8, 2.8 / Math.sqrt(zoom));
      for (const e of parsedGraph.edges) {
        if (e.allocated || e.isInactiveAsc) continue;
        traceEdge(e.a, e.b);
      }
      ctx.stroke();

      // Subtle edges for unchosen Ascendancy wheels
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.24)';
      ctx.lineWidth = Math.max(1.4, 2.2 / Math.sqrt(zoom));
      for (const e of parsedGraph.edges) {
        if (e.allocated || !e.isInactiveAsc) continue;
        traceEdge(e.a, e.b);
      }
      ctx.stroke();

      // 4. Allocated Golden Path Glow + Crisp Core
      if (hasHashes || fallbackEdges.length > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
        ctx.lineWidth = Math.max(6.5, 9 / Math.sqrt(zoom));
        ctx.lineCap = 'round';
        if (hasHashes) {
          for (const e of parsedGraph.edges) {
            if (!e.allocated) continue;
            traceEdge(e.a, e.b);
          }
        } else {
          for (const [x1, y1, x2, y2] of fallbackEdges) {
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
          }
        }
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = Math.max(3.2, 4.6 / Math.sqrt(zoom));
        ctx.lineCap = 'round';
        if (hasHashes) {
          for (const e of parsedGraph.edges) {
            if (!e.allocated) continue;
            traceEdge(e.a, e.b);
          }
        } else {
          for (const [x1, y1, x2, y2] of fallbackEdges) {
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
          }
        }
        ctx.stroke();
        ctx.restore();
      }

      // 5. Draw Nodes with Official GGG Artwork & Frames
      const frameSheet = sprites.frame;
      const startSheet = sprites.startNode;

      const drawNode = (nd: ParsedNode, isAlloc: boolean, isMatch: boolean) => {
        // Class Start Medallion
        if (nd.kind === 5) {
          const classKey = CLASS_START_SPRITES[nd.name.toLowerCase()] || 'PSStartNodeBackgroundInactive';
          const drew = drawSpriteCentered(startSheet, classKey, nd.x, nd.y, 1.0);
          if (!drew) {
            ctx.beginPath();
            ctx.arc(nd.x, nd.y, 18, 0, Math.PI * 2);
            ctx.fillStyle = '#1e293b';
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 2.4;
            ctx.fill();
            ctx.stroke();
          }
          return;
        }

        const radius =
          nd.kind === 2 ? 10.5 : nd.kind === 1 ? 7.6 : nd.kind === 3 ? 8.2 : nd.kind === 4 ? 8.5 : 5.0;

        if (isMatch) {
          ctx.beginPath();
          ctx.arc(nd.x, nd.y, radius + 8, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(34, 211, 238, 0.30)';
          ctx.fill();
          ctx.strokeStyle = '#22d3ee';
          ctx.lineWidth = 2.6;
          ctx.stroke();
        }

        // Official GGG Sprite Icon
        let drewIcon = false;
        if (nd.icon) {
          if (nd.kind === 2) {
            drewIcon = drawCircularIcon(isAlloc ? sprites.keystoneActive : sprites.keystoneInactive, nd.icon, nd.x, nd.y, radius);
          } else if (nd.kind === 1) {
            drewIcon = drawCircularIcon(isAlloc ? sprites.notableActive : sprites.notableInactive, nd.icon, nd.x, nd.y, radius);
          } else if (nd.kind === 4) {
            drewIcon = drawCircularIcon(isAlloc ? sprites.masteryActive : sprites.mastery, nd.icon, nd.x, nd.y, radius);
          } else if (nd.kind === 0) {
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
              ? '#38bdf8'
              : nd.kind === 4
              ? '#34d399'
              : '#f59e0b'
            : '#1e293b';
          ctx.fill();
        }

        // Official GGG Ornate Frame Overlay
        let frameKey = '';
        if (nd.kind === 2) {
          frameKey = isAlloc ? 'KeystoneFrameAllocated' : 'KeystoneFrameUnallocated';
        } else if (nd.kind === 1) {
          frameKey = nd.ascName
            ? isAlloc
              ? 'AscendancyFrameLargeAllocated'
              : 'AscendancyFrameLargeNormal'
            : isAlloc
            ? 'NotableFrameAllocated'
            : 'NotableFrameUnallocated';
        } else if (nd.kind === 3) {
          frameKey = isAlloc ? 'JewelFrameAllocated' : 'JewelFrameUnallocated';
        } else if (nd.kind === 0) {
          frameKey = nd.ascName
            ? isAlloc
              ? 'AscendancyFrameSmallAllocated'
              : 'AscendancyFrameSmallNormal'
            : isAlloc
            ? 'PSSkillFrameActive'
            : 'PSSkillFrame';
        }

        const drewFrame = frameKey ? drawSpriteCentered(frameSheet, frameKey, nd.x, nd.y, 1.0) : false;
        if (!drewFrame && nd.kind !== 4) {
          ctx.beginPath();
          ctx.arc(nd.x, nd.y, radius, 0, Math.PI * 2);
          ctx.strokeStyle = isAlloc ? '#fde68a' : '#475569';
          ctx.lineWidth = isAlloc ? 2.0 : 1.1;
          ctx.stroke();
        }
      };

      for (const nd of parsedGraph.nodes) {
        const isAlloc = hasHashes && allocatedSet.has(nd.id);
        if (!isAlloc) {
          const isInactiveAsc = Boolean(nd.ascName && nd.ascName !== activeAscName);
          if (isInactiveAsc) {
            ctx.save();
            ctx.globalAlpha = 0.48;
            drawNode(nd, false, matchingIds.has(nd.id));
            ctx.restore();
          } else {
            drawNode(nd, false, matchingIds.has(nd.id));
          }
        }
      }
      if (hasHashes) {
        for (const nd of parsedGraph.nodes) {
          if (allocatedSet.has(nd.id)) drawNode(nd, true, matchingIds.has(nd.id));
        }
      } else {
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
  }, [parsedGraph, allocatedSet, fallbackPoints, fallbackEdges, zoom, pan, matchingIds, isMaximized, spriteTick]);

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.18 : 0.85;
    const nextZoom = Math.min(3.2, Math.max(0.1, zoom * factor));
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
    const nextZoom = Math.min(3.2, Math.max(0.1, zoom * factor));
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
      className={`relative rounded-xl border border-slate-800/90 bg-[#04070d] overflow-hidden select-none ${className}`}
    >
      {/* Top Interactive Controls Bar */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="relative pointer-events-auto">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Highlight nodes (e.g. Life, Suppress)..."
            className="pl-8 pr-8 py-1 w-48 sm:w-56 rounded-lg bg-slate-950/90 border border-slate-700/80 text-[11px] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400/70 backdrop-blur-sm"
          />
          {searchQuery.trim() && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono text-cyan-300">
              {matchingIds.size}
            </span>
          )}
        </div>

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

      {loadingGraph && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/85 gap-2 text-xs font-mono text-amber-300">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading Official PoE Passive Skill Tree...</span>
        </div>
      )}

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
            {hoveredNode.node.ascName
              ? `${hoveredNode.node.ascName} Ascendancy`
              : KIND_LABELS[hoveredNode.node.kind] || 'Passive Skill'}
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

      <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="px-2.5 py-1 rounded-lg bg-slate-950/85 border border-slate-800 text-[10px] font-mono text-slate-400 flex items-center gap-2.5">
          <span className="text-amber-300 font-bold">{characterName}</span>
          <span>•</span>
          <span>{allocatedCount} Passives</span>
          {parsedGraph?.activeAscName && (
            <>
              <span>•</span>
              <span className="text-amber-200">{parsedGraph.activeAscName}</span>
            </>
          )}
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">Scroll to Zoom • Drag to Pan</span>
        </div>
      </div>
    </div>
  );
};
