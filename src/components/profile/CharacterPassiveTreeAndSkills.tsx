import React, { useMemo, useState } from 'react';
import {
  Sparkles,
  Maximize2,
  X,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Layers,
  GitBranch,
  Flame
} from 'lucide-react';
import { buildPoeWikiUrl } from '../assets/assetEngine';
import type { PaperdollItem, PaperdollGem } from './CharacterPaperdollView';

export interface ResolvedPassiveNode {
  id: number;
  name: string;
  icon: string;
  stats: string[];
  ascendancyName?: string;
}

export interface ResolvedMastery {
  id: number;
  name: string;
  effectStats: string[];
}

export interface CharacterPassiveTreeAndSkillsProps {
  characterName: string;
  accountName?: string;
  allocatedCount: number;
  ascendancyNodes?: ResolvedPassiveNode[];
  keystones?: ResolvedPassiveNode[];
  masteries?: ResolvedMastery[];
  treePoints?: Array<[number, number, number]>;
  treeEdges?: Array<[number, number, number, number]>;
  equipped: PaperdollItem[];
  onInspectItem?: (item: PaperdollItem, el: HTMLElement, pin?: boolean) => void;
  onClearHover?: () => void;
}

const SLOT_SKILL_ORDER = [
  'BodyArmour',
  'Weapon',
  'Offhand',
  'Helm',
  'Gloves',
  'Boots',
  'Ring',
  'Ring2',
  'Amulet',
  'Weapon2',
  'Offhand2'
];

const getGemDotColor = (colour: string): string => {
  switch (String(colour || '').toUpperCase()) {
    case 'R':
    case 'S':
      return 'bg-rose-500 border-rose-300';
    case 'G':
    case 'D':
      return 'bg-emerald-500 border-emerald-300';
    case 'B':
    case 'I':
      return 'bg-sky-500 border-sky-300';
    default:
      return 'bg-slate-200 border-white';
  }
};

const PassiveTreeSvg: React.FC<{
  points: Array<[number, number, number]>;
  edges: Array<[number, number, number, number]>;
  className?: string;
}> = ({ points, edges, className = 'w-full h-[360px]' }) => {
  const viewBox = useMemo(() => {
    if (points.length === 0) return '-1000 -1000 2000 2000';
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const [x, y] of points) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    const pad = 80;
    return `${minX - pad} ${minY - pad} ${Math.max(200, maxX - minX + pad * 2)} ${Math.max(200, maxY - minY + pad * 2)}`;
  }, [points]);

  return (
    <svg
      viewBox={viewBox}
      className={`${className} bg-[#060912] rounded-xl border border-slate-800/90`}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Unallocated background constellation */}
      {points.map((pt, idx) =>
        pt[2] === 0 ? (
          <circle
            key={`bg-${idx}`}
            cx={pt[0]}
            cy={pt[1]}
            r={4.2}
            fill="#334155"
            opacity={0.55}
          />
        ) : null
      )}

      {/* Allocated golden path edges */}
      {edges.map((e, idx) => (
        <line
          key={`ed-${idx}`}
          x1={e[0]}
          y1={e[1]}
          x2={e[2]}
          y2={e[3]}
          stroke="#f59e0b"
          strokeWidth={6}
          strokeLinecap="round"
          opacity={0.85}
        />
      ))}

      {/* Allocated passive nodes */}
      {points.map((pt, idx) =>
        pt[2] > 0 ? (
          <circle
            key={`al-${idx}`}
            cx={pt[0]}
            cy={pt[1]}
            r={pt[2] === 2 ? 12 : 7}
            fill={pt[2] === 2 ? '#fde047' : '#f59e0b'}
            stroke={pt[2] === 2 ? '#ffffff' : '#fef3c7'}
            strokeWidth={pt[2] === 2 ? 2.5 : 1.2}
          />
        ) : null
      )}
    </svg>
  );
};

export const CharacterPassiveTreeAndSkills: React.FC<CharacterPassiveTreeAndSkillsProps> = ({
  characterName,
  accountName,
  allocatedCount,
  ascendancyNodes = [],
  keystones = [],
  masteries = [],
  treePoints = [],
  treeEdges = [],
  equipped,
  onInspectItem,
  onClearHover
}) => {
  const [showTree, setShowTree] = useState<boolean>(true);
  const [enlargeTree, setEnlargeTree] = useState<boolean>(false);
  const [showSkills, setShowSkills] = useState<boolean>(true);

  const skillRows = useMemo(() => {
    const itemsWithGems = equipped
      .filter((it) => Array.isArray(it.socketedGems) && it.socketedGems.length > 0)
      .sort((a, b) => {
        const ia = SLOT_SKILL_ORDER.indexOf(a.inventoryId);
        const ib = SLOT_SKILL_ORDER.indexOf(b.inventoryId);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      });

    return itemsWithGems.map((item) => {
      const groupsMap = new Map<number, PaperdollGem[]>();
      for (const gem of item.socketedGems) {
        const gIdx =
          typeof (gem as any).group === 'number'
            ? (gem as any).group
            : item.sockets?.[gem.socket]?.group ?? 0;
        const list = groupsMap.get(gIdx) || [];
        list.push(gem);
        groupsMap.set(gIdx, list);
      }

      const groups = Array.from(groupsMap.values())
        .map((gems) =>
          [...gems].sort((a, b) => {
            if (a.support !== b.support) return a.support ? 1 : -1;
            return b.level - a.level;
          })
        )
        .sort((a, b) => b.length - a.length);

      return { item, groups };
    });
  }, [equipped]);

  const totalGemCount = useMemo(
    () => skillRows.reduce((s, r) => s + r.item.socketedGems.length, 0),
    [skillRows]
  );

  const poeOfficialUrl = accountName
    ? `https://www.pathofexile.com/account/view-profile/${encodeURIComponent(accountName.replace('#', '-'))}/characters?characterName=${encodeURIComponent(characterName)}`
    : '';

  return (
    <div className="space-y-4">
      {/* PASSIVE TREE + ASCENDANCY & KEYSTONES + MASTERIES */}
      <div className="rounded-2xl border border-slate-800 bg-[#0b101b] overflow-hidden shadow-lg">
        <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/70 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-amber-400" />
            <span className="text-xs sm:text-sm font-bold text-slate-100">
              Passive Tree, Ascendancy, Keystones &amp; Masteries
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-slate-700">
              {allocatedCount} Passives
            </span>
          </div>

          <div className="flex items-center gap-2">
            {poeOfficialUrl && (
              <a
                href={poeOfficialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] font-mono text-sky-300 flex items-center gap-1"
              >
                <span>Open on PoE</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {treePoints.length > 0 && showTree && (
              <button
                type="button"
                onClick={() => setEnlargeTree(true)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] font-mono text-amber-300 flex items-center gap-1 cursor-pointer"
              >
                <Maximize2 className="w-3 h-3" />
                <span>Enlarge</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowTree((v) => !v)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-mono text-slate-200 flex items-center gap-1 cursor-pointer"
            >
              {showTree ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              <span>{showTree ? 'Hide Tree' : 'Show Tree'}</span>
            </button>
          </div>
        </div>

        {showTree && (
          <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Left: Interactive Passive Tree SVG Constellation */}
            <div className="lg:col-span-7 relative">
              {treePoints.length > 0 ? (
                <div className="relative">
                  <PassiveTreeSvg points={treePoints} edges={treeEdges} className="w-full h-[380px]" />
                  <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-slate-950/85 border border-slate-800 text-[10px] font-mono text-slate-400">
                    Gold = Allocated Path ({allocatedCount} nodes)
                  </div>
                </div>
              ) : (
                <div className="h-[260px] rounded-xl border border-dashed border-slate-800 bg-slate-950/70 flex flex-col items-center justify-center text-center p-6 space-y-1.5">
                  <GitBranch className="w-6 h-6 text-slate-600" />
                  <div className="text-xs font-mono text-slate-300">
                    Passive Tree Constellation Ready
                  </div>
                  <div className="text-[11px] text-slate-500 max-w-sm">
                    Click <strong className="text-emerald-300">Refresh Gear</strong> above to pull this character&apos;s live passive tree layout, Ascendancy nodes, Keystones, and Masteries.
                  </div>
                </div>
              )}
            </div>

            {/* Right: Ascendancy & Keystones + Masteries */}
            <div className="lg:col-span-5 space-y-3">
              {/* Ascendancy & Keystones */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-2.5">
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Ascendancy &amp; Keystones</span>
                  </span>
                  <span className="text-slate-500">
                    {ascendancyNodes.length + keystones.length}
                  </span>
                </div>

                {ascendancyNodes.length === 0 && keystones.length === 0 ? (
                  <div className="text-[11px] font-mono text-slate-500 py-2">
                    No Ascendancy notables or Keystones allocated yet (or refresh gear to load).
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[210px] overflow-y-auto pr-1">
                    {ascendancyNodes.map((nd) => (
                      <div
                        key={`asc-${nd.id}`}
                        className="p-2.5 rounded-lg bg-slate-900/90 border border-amber-500/25 flex items-start gap-2.5"
                      >
                        {nd.icon ? (
                          <img
                            src={nd.icon}
                            alt=""
                            className="w-8 h-8 rounded-lg object-contain bg-slate-950 border border-amber-500/30 shrink-0 p-0.5"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300 shrink-0">
                            <Flame className="w-4 h-4" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center justify-between gap-2">
                            <a
                              href={buildPoeWikiUrl(nd.name, 'poe1')}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-bold text-amber-200 hover:text-amber-100 truncate"
                            >
                              {nd.name}
                            </a>
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/15 border border-amber-500/35 text-amber-300 shrink-0">
                              Ascendancy
                            </span>
                          </div>
                          {nd.stats.map((s, i) => (
                            <div key={i} className="text-[10px] text-sky-200/90 leading-snug">
                              {s}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    {keystones.map((nd) => (
                      <div
                        key={`key-${nd.id}`}
                        className="p-2.5 rounded-lg bg-slate-900/90 border border-purple-500/30 flex items-start gap-2.5"
                      >
                        {nd.icon ? (
                          <img
                            src={nd.icon}
                            alt=""
                            className="w-8 h-8 rounded-lg object-contain bg-slate-950 border border-purple-500/30 shrink-0 p-0.5"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                            <Sparkles className="w-4 h-4" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center justify-between gap-2">
                            <a
                              href={buildPoeWikiUrl(nd.name, 'poe1')}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-bold text-purple-200 hover:text-white truncate"
                            >
                              {nd.name}
                            </a>
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-500/15 border border-purple-500/35 text-purple-300 shrink-0">
                              Keystone
                            </span>
                          </div>
                          {nd.stats.map((s, i) => (
                            <div key={i} className="text-[10px] text-slate-300 leading-snug">
                              {s}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Masteries */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-2">
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-300 flex items-center justify-between">
                  <span>Masteries</span>
                  <span className="text-slate-500">{masteries.length}</span>
                </div>
                {masteries.length === 0 ? (
                  <div className="text-[11px] font-mono text-slate-500 py-1">
                    No Masteries allocated yet.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[155px] overflow-y-auto pr-1">
                    {masteries.map((m) => (
                      <div
                        key={m.id}
                        className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 space-y-0.5"
                      >
                        <div className="text-[11px] font-bold text-emerald-200">{m.name}</div>
                        {m.effectStats.length > 0 ? (
                          m.effectStats.map((st, idx) => (
                            <div key={idx} className="text-[10px] text-slate-300 leading-snug">
                              {st}
                            </div>
                          ))
                        ) : (
                          <div className="text-[10px] text-slate-500 font-mono">Allocated Mastery</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SKILLS SECTION (poe.ninja style grouped by Equipped Item & Link Group) */}
      <div className="rounded-2xl border border-slate-800 bg-[#0b101b] overflow-hidden shadow-lg">
        <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/70 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-400" />
            <span className="text-xs sm:text-sm font-bold text-slate-100">Skills</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-sky-300 border border-slate-700">
              {totalGemCount} Gems across {skillRows.length} Slots
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowSkills((v) => !v)}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
          >
            {showSkills ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showSkills && (
          <div className="divide-y divide-slate-800/80">
            {skillRows.length === 0 ? (
              <div className="p-6 text-center text-xs font-mono text-slate-500">
                No socketed skill gems found on this character yet.
              </div>
            ) : (
              skillRows.map(({ item, groups }) => (
                <div
                  key={item.id}
                  className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-4"
                >
                  {/* Item Icon Thumbnail */}
                  <button
                    type="button"
                    onMouseEnter={(e) => onInspectItem?.(item, e.currentTarget, false)}
                    onMouseLeave={() => onClearHover?.()}
                    onClick={(e) => onInspectItem?.(item, e.currentTarget, true)}
                    className="w-16 h-16 rounded-xl border border-slate-700/80 bg-slate-950/90 flex flex-col items-center justify-center p-1.5 shrink-0 hover:border-amber-400/70 transition-colors cursor-pointer"
                    title={`${item.name || item.baseType} (${item.inventoryId})`}
                  >
                    {item.icon ? (
                      <img
                        src={item.icon}
                        alt={item.name || item.baseType}
                        className="max-h-12 max-w-12 object-contain"
                      />
                    ) : (
                      <span className="text-[9px] font-mono text-slate-400">{item.inventoryId}</span>
                    )}
                  </button>

                  {/* Linked Gem Groups */}
                  <div className="flex-1 flex flex-wrap gap-3 items-start">
                    {groups.map((gems, gIdx) => (
                      <div
                        key={gIdx}
                        className="min-w-[230px] flex-1 max-w-sm rounded-xl border border-slate-800 bg-slate-950/85 p-2.5 space-y-1.5"
                      >
                        {gems.map((gem, idx) => (
                          <div
                            key={`${gem.name}-${idx}`}
                            className="flex items-center justify-between gap-2 text-xs"
                          >
                            <a
                              href={buildPoeWikiUrl(gem.name, 'poe1')}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 min-w-0 group"
                            >
                              <span
                                className={`w-2 h-2 rounded-full border shrink-0 ${getGemDotColor(gem.colour)}`}
                              />
                              {gem.icon && (
                                <img
                                  src={gem.icon}
                                  alt=""
                                  className="w-4 h-4 object-contain shrink-0"
                                />
                              )}
                              <span
                                className={`truncate group-hover:underline ${
                                  gem.support ? 'text-slate-300' : 'text-white font-semibold'
                                }`}
                              >
                                {gem.name}
                              </span>
                            </a>
                            <span className="text-[11px] font-mono text-slate-400 shrink-0">
                              {gem.level > 0 ? gem.level : 1}
                              {gem.quality > 0 ? ` / ${gem.quality}` : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Fullscreen Enlarged Passive Tree Modal */}
      {enlargeTree && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setEnlargeTree(false)}
        >
          <div
            className="w-full max-w-5xl rounded-2xl border border-amber-500/40 bg-[#070b14] p-4 space-y-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="text-sm font-bold text-amber-200 flex items-center gap-2">
                <GitBranch className="w-4 h-4" />
                <span>{characterName} Passive Skill Tree ({allocatedCount} Passives)</span>
              </div>
              <button
                type="button"
                onClick={() => setEnlargeTree(false)}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <PassiveTreeSvg points={treePoints} edges={treeEdges} className="w-full h-[72vh]" />
          </div>
        </div>
      )}
    </div>
  );
};
