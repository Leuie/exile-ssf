import React, { useMemo, useState } from 'react';
import {
  Sparkles,
  Maximize2,
  X,
  ChevronDown,
  ChevronUp,
  Layers,
  GitBranch,
  Flame
} from 'lucide-react';
import { buildPoeWikiUrl } from '../assets/assetEngine';
import type { PaperdollItem, PaperdollGem } from './CharacterPaperdollView';
import { OfficialPassiveTreeCanvas } from './OfficialPassiveTreeCanvas';

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
  allocatedCount: number;
  allocatedHashes?: number[];
  ascendancyNodes?: ResolvedPassiveNode[];
  keystones?: ResolvedPassiveNode[];
  masteries?: ResolvedMastery[];
  treePoints?: Array<[number, number, number]>;
  treeEdges?: Array<[number, number, number, number]>;
  equipped: PaperdollItem[];
  clusterJewels?: PaperdollItem[];
  onInspectItem?: (item: PaperdollItem, el: HTMLElement, pin?: boolean) => void;
  onClearHover?: () => void;
}

function buildPassiveWikiIconUrl(nodeName: string): string {
  const clean = (nodeName || '').trim().replace(/\s+/g, '_');
  if (!clean) return '';
  return `https://www.poewiki.net/wiki/Special:FilePath/${encodeURIComponent(clean)}_passive_skill_icon.png`;
}

const PassiveNodeIcon: React.FC<{
  name: string;
  kind: 'ascendancy' | 'keystone' | 'mastery';
}> = ({ name, kind }) => {
  const [failed, setFailed] = useState(false);
  const src = buildPassiveWikiIconUrl(name);

  const borderClass =
    kind === 'ascendancy'
      ? 'border-amber-500/35 bg-amber-500/15 text-amber-300'
      : kind === 'keystone'
      ? 'border-purple-500/35 bg-purple-500/15 text-purple-300'
      : 'border-emerald-500/35 bg-emerald-500/15 text-emerald-300';

  if (!src || failed) {
    return (
      <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${borderClass}`}>
        {kind === 'ascendancy' ? (
          <Flame className="w-4 h-4" />
        ) : kind === 'keystone' ? (
          <Sparkles className="w-4 h-4" />
        ) : (
          <Layers className="w-4 h-4" />
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`w-8 h-8 rounded-lg object-contain bg-slate-950 border shrink-0 p-0.5 ${
        kind === 'ascendancy'
          ? 'border-amber-500/35'
          : kind === 'keystone'
          ? 'border-purple-500/35'
          : 'border-emerald-500/35'
      }`}
    />
  );
};

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

export const CharacterPassiveTreeAndSkills: React.FC<CharacterPassiveTreeAndSkillsProps> = ({
  characterName,
  allocatedCount,
  allocatedHashes = [],
  ascendancyNodes = [],
  keystones = [],
  masteries = [],
  treePoints = [],
  treeEdges = [],
  equipped,
  clusterJewels = [],
  onInspectItem,
  onClearHover
}) => {
  const [showTree, setShowTree] = useState<boolean>(true);
  const [enlargeTree, setEnlargeTree] = useState<boolean>(false);
  const [showSkills, setShowSkills] = useState<boolean>(true);

  const clusterNotables = useMemo(() => {
    const out: Array<{ name: string; jewelName: string }> = [];
    const seen = new Set<string>();
    for (const cj of clusterJewels || []) {
      const mods = [...(cj.explicitMods || []), ...(cj.implicitMods || []), ...(cj.fracturedMods || [])];
      for (const m of mods) {
        const match = m.match(/1 Added Passive Skill is (.+)/i);
        if (match) {
          const notable = match[1].trim();
          const key = notable.toLowerCase();
          if (notable && !seen.has(key)) {
            seen.add(key);
            out.push({ name: notable, jewelName: cj.name || cj.baseType || 'Cluster Jewel' });
          }
        }
      }
    }
    return out;
  }, [clusterJewels]);

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
            {showTree && (
              <button
                type="button"
                onClick={() => setEnlargeTree(true)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] font-mono text-amber-300 flex items-center gap-1 cursor-pointer"
              >
                <Maximize2 className="w-3 h-3" />
                <span>Maximize</span>
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
            {/* Left: Interactive Official PoE Passive Tree Canvas */}
            <div className="lg:col-span-7 relative">
              <OfficialPassiveTreeCanvas
                allocatedHashes={allocatedHashes}
                fallbackPoints={treePoints}
                fallbackEdges={treeEdges}
                allocatedCount={allocatedCount}
                characterName={characterName}
                className="w-full h-[420px]"
                isMaximized={false}
                onToggleMaximize={() => setEnlargeTree(true)}
              />
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
                        <PassiveNodeIcon name={nd.name} kind="ascendancy" />
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
                        <PassiveNodeIcon name={nd.name} kind="keystone" />
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
                        className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 flex items-start gap-2.5"
                      >
                        <PassiveNodeIcon name={m.name} kind="mastery" />
                        <div className="min-w-0 flex-1 space-y-0.5">
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
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cluster Jewel Notables */}
              {clusterNotables.length > 0 && (
                <div className="rounded-xl border border-indigo-500/30 bg-slate-950/80 p-3.5 space-y-2">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-300 flex items-center justify-between">
                    <span>Cluster Jewel Notables</span>
                    <span className="text-slate-500">{clusterNotables.length}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {clusterNotables.map((cn) => (
                      <a
                        key={cn.name}
                        href={buildPoeWikiUrl(cn.name, 'poe1')}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`From ${cn.jewelName}`}
                        className="px-2 py-1 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/35 text-[11px] font-semibold text-indigo-200 transition-colors"
                      >
                        {cn.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}
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
          className="fixed inset-0 z-50 bg-slate-950/92 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
          onClick={() => setEnlargeTree(false)}
        >
          <div
            className="w-full max-w-[95vw] rounded-2xl border border-amber-500/40 bg-[#070b14] p-4 space-y-3 shadow-2xl"
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
            <OfficialPassiveTreeCanvas
              allocatedHashes={allocatedHashes}
              fallbackPoints={treePoints}
              fallbackEdges={treeEdges}
              allocatedCount={allocatedCount}
              characterName={characterName}
              className="w-full h-[80vh]"
              isMaximized={true}
              onToggleMaximize={() => setEnlargeTree(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
