import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Activity,
  Compass,
  ChevronDown,
  ChevronUp,
  Settings2,
  X,
  PanelRight,
  MousePointerClick
} from 'lucide-react';
import { fetchUserToolState, saveUserToolState } from '../../services/cloudSync';
import { buildPoeWikiUrl } from '../assets/assetEngine';

export interface PaperdollSocket {
  group: number;
  sColour: string;
}

export interface PaperdollGem {
  name: string;
  icon?: string;
  colour: string;
  socket: number;
  level: number;
  quality: number;
  support: boolean;
  description?: string;
  mods?: string[];
}

export interface PaperdollExtendedAffix {
  name: string;
  tier: string;
  kind: 'Prefix' | 'Suffix' | '';
}

export interface PaperdollItem {
  id: string;
  inventoryId: string;
  x: number;
  name: string;
  baseType: string;
  typeLine: string;
  icon: string;
  frameType: number;
  ilvl: number;
  corrupted: boolean;
  properties?: Array<{ name: string; value: string }>;
  extendedAffixes?: PaperdollExtendedAffix[];
  sockets: PaperdollSocket[];
  socketedGems: PaperdollGem[];
  implicitMods: string[];
  explicitMods: string[];
  craftedMods: string[];
  enchantMods: string[];
  fracturedMods: string[];
}

export interface CharacterGearSnapshot {
  syncedAtIso: string;
  character: {
    name: string;
    league: string;
    className: string;
    level: number;
    experience: number;
  };
  equipped: PaperdollItem[];
  passives: {
    allocatedCount: number;
    jewelCount: number;
    voidstoneCount: number;
  };
  estimatedVitals: {
    flatLife: number;
    flatEs: number;
    fireRes: number;
    coldRes: number;
    lightningRes: number;
    chaosRes: number;
    suppress: number;
  };
}

export interface CharacterPaperdollViewProps {
  handle: string;
  poeAccountName?: string;
  rosterCharacters: Array<{
    characterName: string;
    ascendancy: string;
    level: number;
    buildName: string;
    leagueId: string;
    gameTag?: string;
  }>;
  canEdit: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onNotify?: (msg: string) => void;
}

const POESESSID_STORAGE_KEY = 'exile_ssf_poesessid_optin_v1';
const SYNCED_VITALS_STORAGE_KEY = 'exile_ssf_synced_gear_vitals_v1';
const INSPECT_MODE_STORAGE_KEY = 'exile_ssf_paperdoll_inspect_mode_v1';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function readSavedSession30d(): { poesessid: string; accountName: string } {
  try {
    const raw = localStorage.getItem(POESESSID_STORAGE_KEY);
    if (!raw) return { poesessid: '', accountName: '' };
    if (raw.startsWith('{')) {
      const parsed = JSON.parse(raw);
      const exp = Number(parsed?.expiresAtMs || 0);
      if (exp > 0 && Date.now() > exp) {
        localStorage.removeItem(POESESSID_STORAGE_KEY);
        return { poesessid: '', accountName: '' };
      }
      return {
        poesessid: String(parsed?.poesessid || ''),
        accountName: String(parsed?.accountName || '')
      };
    }
    return { poesessid: raw, accountName: '' };
  } catch {
    return { poesessid: '', accountName: '' };
  }
}

function saveSession30d(poesessid: string, accountName: string) {
  try {
    const now = Date.now();
    localStorage.setItem(
      POESESSID_STORAGE_KEY,
      JSON.stringify({
        poesessid: poesessid.trim(),
        accountName: accountName.trim(),
        savedAtMs: now,
        expiresAtMs: now + THIRTY_DAYS_MS
      })
    );
  } catch {}
}

function leaguePriorityScore(league: string): number {
  const low = String(league || '').toLowerCase();
  if (!low || low === 'roster') return 50;
  if (/\(pl\d+\)/i.test(league) || low.includes('gsf') || low.includes('ravenwatch')) return 0;
  if (low.includes('umbra') || low.includes('ancients')) return 5;
  if (/^(standard|hardcore|ssf standard|ssf hardcore|ruthless)/i.test(low)) return 90;
  return 20;
}

// Accurate PoE Prefix vs Suffix classifier for Magic & Rare gear
function classifyPoEAffix(mod: string): 'Prefix' | 'Suffix' {
  const m = mod.toLowerCase();
  // Suffix patterns (Resistances, Attributes, Speed, Crit, Suppression, Accuracy, Regen, Stun/Ailment, Flask suffixes)
  if (
    /resistance|resistances/i.test(m) ||
    /\+\d+ to (strength|dexterity|intelligence|all attributes)/i.test(m) ||
    /(attack speed|cast speed|attack and cast speed)/i.test(m) ||
    /(critical strike chance|critical strike multiplier)/i.test(m) ||
    /suppress spell damage/i.test(m) ||
    /accuracy rating/i.test(m) ||
    /(regenerate|regeneration rate|life regenerated|mana regeneration)/i.test(m) ||
    /(stun and block recovery|stun threshold|chance to avoid|reduced effect of|cannot be frozen|cannot be chilled|cannot be shocked|immunity to|remove bleeding|remove poison|remove curses)/i.test(m) ||
    /(reduced attribute requirements|light radius|chance to ignite|chance to freeze|chance to shock|chance to poison|chance to cause bleeding|damage over time multiplier|chaos damage over time|fire damage over time|physical damage over time)/i.test(m) ||
    /(life gained for each enemy hit|life gained on kill|mana gained on kill|flask charges|reduced charges used|during effect)/i.test(m)
  ) {
    return 'Suffix';
  }
  // Prefix patterns (Life, ES, Armour, Evasion, Ward, Movement Speed, Flat/Increased Damage, Mana, +Gem Levels, Leech, Rarity)
  return 'Prefix';
}

const getRarityFrameClasses = (frameType: number): string => {
  switch (frameType) {
    case 3:
      return 'border-orange-500/75 bg-gradient-to-b from-orange-950/50 to-slate-950/90 shadow-[inset_0_0_16px_rgba(249,115,22,0.18)]';
    case 2:
      return 'border-amber-400/70 bg-gradient-to-b from-amber-950/40 to-slate-950/90 shadow-[inset_0_0_14px_rgba(251,191,36,0.14)]';
    case 1:
      return 'border-sky-400/70 bg-gradient-to-b from-sky-950/45 to-slate-950/90';
    case 9:
    case 10:
      return 'border-emerald-400/75 bg-gradient-to-b from-emerald-950/45 to-slate-950/90';
    default:
      return 'border-slate-700/90 bg-slate-950/90';
  }
};

const getRarityTitleColor = (frameType: number): string => {
  switch (frameType) {
    case 3:
      return 'text-orange-300';
    case 2:
      return 'text-amber-300';
    case 1:
      return 'text-sky-300';
    case 9:
    case 10:
      return 'text-emerald-300';
    default:
      return 'text-slate-100';
  }
};

const getRarityBorderAccent = (frameType: number): string => {
  switch (frameType) {
    case 3:
      return 'border-orange-500/70';
    case 2:
      return 'border-amber-400/70';
    case 1:
      return 'border-sky-400/70';
    case 9:
    case 10:
      return 'border-emerald-400/70';
    default:
      return 'border-slate-700';
  }
};

const getSocketColorClasses = (sColour: string): string => {
  switch (String(sColour || '').toUpperCase()) {
    case 'R':
    case 'S':
      return 'bg-rose-600 border-rose-300';
    case 'G':
    case 'D':
      return 'bg-emerald-600 border-emerald-300';
    case 'B':
    case 'I':
      return 'bg-sky-600 border-sky-300';
    case 'W':
      return 'bg-slate-100 border-white';
    case 'A':
      return 'bg-slate-900 border-emerald-400';
    default:
      return 'bg-slate-600 border-slate-300';
  }
};

const SocketOverlay: React.FC<{ sockets: PaperdollSocket[] }> = ({ sockets }) => {
  if (!sockets || sockets.length === 0) return null;
  const shown = sockets.slice(0, 6);
  const cols = shown.length <= 2 ? 1 : 2;
  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-center justify-center z-10"
      aria-hidden="true"
    >
      <div
        className="grid gap-1 p-1 rounded bg-slate-950/55 border border-amber-500/20"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {shown.map((s, idx) => {
          const prev = idx > 0 ? shown[idx - 1] : null;
          const linkedToPrev = prev && prev.group === s.group;
          return (
            <div key={idx} className="relative flex items-center justify-center">
              {linkedToPrev && (
                <span className="absolute -left-1.5 w-2 h-1 rounded-full bg-amber-300/90 shadow-[0_0_4px_rgba(251,191,36,0.9)]" />
              )}
              <span
                className={`w-3.5 h-3.5 rounded-full border-2 shadow-md ${getSocketColorClasses(s.sColour)}`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface ItemInspectorBodyProps {
  item: PaperdollItem;
  canEdit: boolean;
  selectedGemIdx: number | null;
  onSelectGemIdx: (idx: number | null) => void;
  isPinnedPopup?: boolean;
  onClosePinned?: () => void;
}

const cleanModList = (arr?: string[]) =>
  (Array.isArray(arr) ? arr : []).filter((m) => typeof m === 'string' && m.trim() && m !== '[object Object]');

const ItemInspectorBody: React.FC<ItemInspectorBodyProps> = ({
  item,
  canEdit,
  selectedGemIdx,
  onSelectGemIdx,
  isPinnedPopup = false,
  onClosePinned
}) => {
  const isRareOrMagic = item.frameType === 1 || item.frameType === 2;
  const enchants = cleanModList(item.enchantMods);
  const implicits = cleanModList(item.implicitMods);
  const fractured = cleanModList(item.fracturedMods);
  const explicits = cleanModList(item.explicitMods);
  const crafted = cleanModList(item.craftedMods);

  const hasStaleObjectMods = [...(item.explicitMods || []), ...(item.implicitMods || [])].some(
    (m) => m === '[object Object]'
  );

  // Classify explicit + fractured + crafted mods into Prefixes and Suffixes on Magic / Rare items
  const classifiedExplicits = explicits.map((text, idx) => {
    const ext = item.extendedAffixes?.[idx];
    const kind: 'Prefix' | 'Suffix' =
      ext?.kind === 'Prefix' || ext?.kind === 'Suffix' ? ext.kind : classifyPoEAffix(text);
    return { text, kind, tier: ext?.tier || '' };
  });

  const classifiedFractured = fractured.map((text) => ({
    text,
    kind: classifyPoEAffix(text)
  }));

  const classifiedCrafted = crafted.map((text) => ({
    text,
    kind: classifyPoEAffix(text)
  }));

  const prefixCount = isRareOrMagic
    ? classifiedExplicits.filter((m) => m.kind === 'Prefix').length +
      classifiedFractured.filter((m) => m.kind === 'Prefix').length +
      classifiedCrafted.filter((m) => m.kind === 'Prefix').length
    : 0;
  const suffixCount = isRareOrMagic
    ? classifiedExplicits.filter((m) => m.kind === 'Suffix').length +
      classifiedFractured.filter((m) => m.kind === 'Suffix').length +
      classifiedCrafted.filter((m) => m.kind === 'Suffix').length
    : 0;

  const sortedExplicits = isRareOrMagic
    ? [
        ...classifiedExplicits.filter((m) => m.kind === 'Prefix'),
        ...classifiedExplicits.filter((m) => m.kind === 'Suffix')
      ]
    : classifiedExplicits;

  return (
    <div className="space-y-2.5 text-left">
      {/* Header */}
      <div className="border-b border-slate-800 pb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className={`text-sm font-bold leading-tight ${getRarityTitleColor(item.frameType)}`}>
            {item.name || item.baseType}
          </div>
          {item.name && item.baseType && item.name !== item.baseType && (
            <div className="text-[11px] font-mono text-slate-400">{item.baseType}</div>
          )}
          <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px] font-mono text-slate-500">
            <span>iLvl {item.ilvl}</span>
            <span>• {item.inventoryId}</span>
            {isRareOrMagic && (prefixCount > 0 || suffixCount > 0) && (
              <span className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 text-slate-300 font-bold">
                <span className="text-emerald-300">{prefixCount}P</span>
                {' / '}
                <span className="text-purple-300">{suffixCount}S</span>
              </span>
            )}
            {item.corrupted && <span className="text-rose-400 font-bold">Corrupted</span>}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <a
            href={buildPoeWikiUrl(item.name || item.baseType, 'poe1')}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] font-mono text-indigo-300 flex items-center gap-1"
          >
            <span>Wiki</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
          {isPinnedPopup && onClosePinned && (
            <button
              type="button"
              onClick={onClosePinned}
              className="p-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white cursor-pointer"
              title="Close pinned item tooltip"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Base Properties */}
      {Array.isArray(item.properties) && item.properties.length > 0 && (
        <div className="space-y-0.5 text-[11px] font-mono border-b border-slate-800/70 pb-1.5">
          {item.properties.map((prop, i) => (
            <div key={i} className="text-slate-400">
              <span>{prop.name}</span>
              {prop.value && <span className="text-slate-100 font-semibold">: {prop.value}</span>}
            </div>
          ))}
        </div>
      )}

      {hasStaleObjectMods && canEdit && (
        <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-500/35 text-[11px] text-amber-200">
          Click Refresh Gear above to load full item stats and socket colors.
        </div>
      )}

      {/* Enchants */}
      {enchants.length > 0 && (
        <div className="space-y-1 border-b border-slate-800/70 pb-1.5">
          {enchants.map((m, i) => (
            <div key={i} className="flex items-start gap-1.5 text-[11px] text-cyan-300">
              <span className="mt-0.5 px-1 py-0.2 rounded bg-cyan-950/90 border border-cyan-500/40 text-[9px] font-mono font-bold text-cyan-300 shrink-0">
                ENCH
              </span>
              <span>{m}</span>
            </div>
          ))}
        </div>
      )}

      {/* Implicits */}
      {implicits.length > 0 && (
        <div className="space-y-1 border-b border-slate-800/70 pb-1.5">
          {implicits.map((m, i) => (
            <div key={i} className="flex items-start gap-1.5 text-[11px] text-sky-300">
              <span className="mt-0.5 px-1 py-0.2 rounded bg-sky-950/90 border border-sky-500/40 text-[9px] font-mono font-bold text-sky-300 shrink-0">
                IMP
              </span>
              <span>{m}</span>
            </div>
          ))}
        </div>
      )}

      {/* Fractured, Explicit (Prefix / Suffix), & Crafted Mods */}
      {(classifiedFractured.length > 0 || sortedExplicits.length > 0 || classifiedCrafted.length > 0) && (
        <div className="space-y-1 text-[11px]">
          {classifiedFractured.map((m, i) => (
            <div key={`f-${i}`} className="flex items-start gap-1.5 text-amber-200">
              <span className="mt-0.5 px-1 py-0.2 rounded bg-amber-950/90 border border-amber-400/50 text-[9px] font-mono font-bold text-amber-300 shrink-0">
                {isRareOrMagic ? (m.kind === 'Prefix' ? 'FRAC P' : 'FRAC S') : 'FRAC'}
              </span>
              <span>{m.text}</span>
            </div>
          ))}

          {sortedExplicits.map((m, i) => (
            <div key={`e-${i}`} className="flex items-start gap-1.5 text-indigo-200">
              {isRareOrMagic && (
                <span
                  className={`mt-0.5 px-1 py-0.2 rounded border text-[9px] font-mono font-bold shrink-0 ${
                    m.kind === 'Prefix'
                      ? 'bg-emerald-950/90 border-emerald-500/45 text-emerald-300'
                      : 'bg-purple-950/90 border-purple-500/45 text-purple-300'
                  }`}
                  title={m.tier ? `${m.kind} (${m.tier})` : m.kind}
                >
                  {m.tier ? m.tier : m.kind === 'Prefix' ? 'PRE' : 'SUF'}
                </span>
              )}
              <span>{m.text}</span>
            </div>
          ))}

          {classifiedCrafted.map((m, i) => (
            <div key={`c-${i}`} className="flex items-start gap-1.5 text-sky-200">
              <span className="mt-0.5 px-1 py-0.2 rounded bg-sky-950/90 border border-sky-400/45 text-[9px] font-mono font-bold text-sky-300 shrink-0">
                {isRareOrMagic ? (m.kind === 'Prefix' ? 'CRAFT P' : 'CRAFT S') : 'CRAFT'}
              </span>
              <span>{m.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Socketed Gems */}
      {item.socketedGems.length > 0 && (
        <div className="pt-2 border-t border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-400">
            <span className="flex items-center gap-1">
              <Layers className="w-3 h-3" />
              <span>Socketed Gems ({item.socketedGems.length})</span>
            </span>
            <span className="text-slate-500 normal-case">
              {isPinnedPopup ? 'Click gem for stats' : 'Click item to inspect gems'}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {item.socketedGems.map((g, i) => {
              const active = selectedGemIdx === i;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => onSelectGemIdx(active ? null : i)}
                  className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-mono cursor-pointer transition-colors ${
                    active
                      ? 'bg-indigo-600/30 border-indigo-400 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-200'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full border ${getSocketColorClasses(g.colour)}`} />
                  {g.icon && <img src={g.icon} alt="" className="w-3.5 h-3.5 object-contain" />}
                  <span>{g.name}</span>
                  <span className="text-slate-400">
                    {g.level > 0 ? `Lv${g.level}` : ''}
                    {g.quality > 0 ? `/${g.quality}%` : ''}
                  </span>
                </button>
              );
            })}
          </div>

          {selectedGemIdx !== null && item.socketedGems[selectedGemIdx] && (
            <div className="p-2.5 rounded-lg bg-slate-900/90 border border-indigo-500/35 space-y-1 text-[11px]">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-indigo-200">
                  {item.socketedGems[selectedGemIdx].name}
                </span>
                <a
                  href={buildPoeWikiUrl(item.socketedGems[selectedGemIdx].name, 'poe1')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-mono text-sky-400 hover:text-sky-300 flex items-center gap-1"
                >
                  <span>PoE Wiki</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
              {item.socketedGems[selectedGemIdx].description && (
                <div className="text-slate-300 text-[10px]">
                  {item.socketedGems[selectedGemIdx].description}
                </div>
              )}
              {cleanModList(item.socketedGems[selectedGemIdx].mods).map((m, idx) => (
                <div key={idx} className="text-sky-200 text-[10px]">
                  {m}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const CharacterPaperdollView: React.FC<CharacterPaperdollViewProps> = ({
  handle,
  poeAccountName,
  rosterCharacters,
  canEdit,
  collapsed = false,
  onToggleCollapse,
  onNotify
}) => {
  const initialSaved = useMemo(() => readSavedSession30d(), []);
  const [snapshots, setSnapshots] = useState<Record<string, CharacterGearSnapshot>>({});
  const [selectedChar, setSelectedChar] = useState<string>('');
  const [weaponSet, setWeaponSet] = useState<1 | 2>(1);
  const [hoveredItem, setHoveredItem] = useState<PaperdollItem | null>(null);
  const [lockedItem, setLockedItem] = useState<PaperdollItem | null>(null);
  const [selectedGemIdx, setSelectedGemIdx] = useState<number | null>(null);

  // User preference: 'popup' (default in game hover modal) or 'side' (side inspector panel)
  const [inspectMode, setInspectMode] = useState<'popup' | 'side'>(() => {
    try {
      const saved = localStorage.getItem(INSPECT_MODE_STORAGE_KEY);
      return saved === 'side' ? 'side' : 'popup';
    } catch {
      return 'popup';
    }
  });
  const [popupCoords, setPopupCoords] = useState<{ left: number; top: number } | null>(null);

  const handleSetInspectMode = (mode: 'popup' | 'side') => {
    setInspectMode(mode);
    setLockedItem(null);
    setHoveredItem(null);
    try {
      localStorage.setItem(INSPECT_MODE_STORAGE_KEY, mode);
    } catch {}
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLockedItem(null);
        setHoveredItem(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const [accountInput, setAccountInput] = useState<string>(
    poeAccountName || initialSaved.accountName || ''
  );
  const [poesessid, setPoesessid] = useState<string>(initialSaved.poesessid || '');
  const [liveCharList, setLiveCharList] = useState<
    Array<{ name: string; league: string; className: string; level: number }>
  >([]);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [loadingList, setLoadingList] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showSyncDrawer, setShowSyncDrawer] = useState<boolean>(false);
  const [vitalsPushed, setVitalsPushed] = useState<boolean>(false);

  useEffect(() => {
    if (poeAccountName && !accountInput) {
      setAccountInput(poeAccountName);
    }
  }, [poeAccountName, accountInput]);

  useEffect(() => {
    let cancelled = false;
    fetchUserToolState(handle, 'character_gear_snapshots')
      .then((saved) => {
        if (cancelled) return;
        if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
          setSnapshots(saved as Record<string, CharacterGearSnapshot>);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [handle]);

  // League grouped character selector prioritizing recent leagues & characters
  const groupedCharacters = useMemo(() => {
    interface CharOpt {
      name: string;
      league: string;
      level: number;
      subtitle: string;
      hasSnapshot: boolean;
      syncedAtMs: number;
    }
    const map = new Map<string, CharOpt>();

    for (const [key, snap] of Object.entries(snapshots)) {
      const n = snap?.character?.name || key;
      const lg = snap?.character?.league || 'Synced Characters';
      const lvl = Number(snap?.character?.level || 1);
      map.set(n.toLowerCase(), {
        name: n,
        league: lg,
        level: lvl,
        subtitle: `Lv ${lvl} ${snap?.character?.className || ''}`.trim(),
        hasSnapshot: true,
        syncedAtMs: Date.parse(snap?.syncedAtIso || '') || 0
      });
    }

    for (const ch of liveCharList) {
      const k = ch.name.toLowerCase();
      const existing = map.get(k);
      if (!existing) {
        map.set(k, {
          name: ch.name,
          league: ch.league || 'Path of Exile',
          level: Number(ch.level || 1),
          subtitle: `Lv ${ch.level} ${ch.className}`.trim(),
          hasSnapshot: false,
          syncedAtMs: 0
        });
      } else if (ch.league && existing.league === 'Synced Characters') {
        existing.league = ch.league;
      }
    }

    for (const r of rosterCharacters) {
      const n = r.characterName.trim();
      const k = n.toLowerCase();
      if (k && !map.has(k)) {
        map.set(k, {
          name: n,
          league: r.leagueId === 'poe1-330-umbra' ? 'Ravenwatch Covens of Umbra GSF (PL87651)' : r.gameTag || 'League Roster',
          level: Number(r.level || 1),
          subtitle: `Lv ${r.level} ${r.ascendancy}`.trim(),
          hasSnapshot: false,
          syncedAtMs: 0
        });
      }
    }

    const byLeague = new Map<string, CharOpt[]>();
    for (const opt of map.values()) {
      const list = byLeague.get(opt.league) || [];
      list.push(opt);
      byLeague.set(opt.league, list);
    }

    const groups = Array.from(byLeague.entries()).map(([league, chars]) => {
      chars.sort((a, b) => {
        if (b.syncedAtMs !== a.syncedAtMs) return b.syncedAtMs - a.syncedAtMs;
        if (b.level !== a.level) return b.level - a.level;
        return a.name.localeCompare(b.name);
      });
      const latestSync = Math.max(0, ...chars.map((c) => c.syncedAtMs));
      return {
        league,
        chars,
        priority: leaguePriorityScore(league),
        latestSync
      };
    });

    groups.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      if (b.latestSync !== a.latestSync) return b.latestSync - a.latestSync;
      return a.league.localeCompare(b.league);
    });

    return groups;
  }, [snapshots, liveCharList, rosterCharacters]);

  const flatCharacters = useMemo(
    () => groupedCharacters.flatMap((g) => g.chars),
    [groupedCharacters]
  );

  useEffect(() => {
    if (!selectedChar && flatCharacters.length > 0) {
      setSelectedChar(flatCharacters[0].name);
    }
  }, [flatCharacters, selectedChar]);

  const activeSnapshot: CharacterGearSnapshot | null = useMemo(() => {
    if (!selectedChar) return null;
    const direct = snapshots[selectedChar];
    if (direct) return direct;
    const matchKey = Object.keys(snapshots).find(
      (k) => k.toLowerCase() === selectedChar.toLowerCase()
    );
    return matchKey ? snapshots[matchKey] : null;
  }, [snapshots, selectedChar]);

  const slotItem = (invId: string): PaperdollItem | null => {
    if (!activeSnapshot) return null;
    return activeSnapshot.equipped.find((it) => it.inventoryId === invId) || null;
  };

  const flasks = useMemo(() => {
    const list: Array<PaperdollItem | null> = [null, null, null, null, null];
    if (!activeSnapshot) return list;
    const fItems = activeSnapshot.equipped
      .filter((it) => it.inventoryId === 'Flask')
      .sort((a, b) => a.x - b.x);
    fItems.forEach((f, idx) => {
      const slot = f.x >= 0 && f.x < 5 ? f.x : idx;
      if (slot >= 0 && slot < 5) list[slot] = f;
    });
    return list;
  }, [activeSnapshot]);

  const inspectedItem = lockedItem || hoveredItem;

  const computePopupPosition = (el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    const tooltipW = 360;
    const tooltipH = 380;
    const pad = 12;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = rect.right + pad;
    if (left + tooltipW > vw - pad) {
      left = Math.max(pad, rect.left - tooltipW - pad);
    }
    let top = rect.top;
    if (top + tooltipH > vh - pad) {
      top = Math.max(pad, vh - tooltipH - pad);
    }
    setPopupCoords({ left, top });
  };

  const handleLoadLiveCharacters = async () => {
    if (!accountInput.trim() || !poesessid.trim()) {
      setErrorMsg('Enter your PoE Account Tag (e.g. Leuie#0626) and POESESSID first.');
      return;
    }
    setLoadingList(true);
    setErrorMsg(null);
    try {
      saveSession30d(poesessid, accountInput);
      const res = await fetch('/api/farming/character-xp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountName: accountInput.trim(),
          poesessid: poesessid.trim(),
          realm: 'pc'
        })
      });
      const json: any = await res.json();
      if (!res.ok || !Array.isArray(json?.characters)) {
        throw new Error(json?.error || `HTTP ${res.status}`);
      }
      setLiveCharList(json.characters);
      if (json.characters.length > 0 && !selectedChar) {
        setSelectedChar(json.characters[0].name);
      }
      onNotify?.(`Loaded ${json.characters.length} live GGG characters (session remembered 30 days)!`);
    } catch (e: any) {
      setErrorMsg(e?.message || 'Could not load characters from GGG.');
    } finally {
      setLoadingList(false);
    }
  };

  const handleSyncCharacterGear = async (overrideCharName?: string) => {
    const targetName = (overrideCharName || selectedChar).trim();
    if (!accountInput.trim() || !poesessid.trim() || !targetName) {
      setShowSyncDrawer(true);
      setErrorMsg('Select a character and enter your PoE Account Tag and POESESSID.');
      return;
    }
    setSyncing(true);
    setErrorMsg(null);
    try {
      saveSession30d(poesessid, accountInput);
      const res = await fetch('/api/farming/character-gear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountName: accountInput.trim(),
          characterName: targetName,
          poesessid: poesessid.trim(),
          realm: 'pc'
        })
      });
      const json: any = await res.json();
      if (!res.ok || json?.status !== 'ok') {
        throw new Error(json?.error || `HTTP ${res.status}`);
      }
      const nextSnap: CharacterGearSnapshot = {
        syncedAtIso: json.syncedAtIso,
        character: json.character,
        equipped: json.equipped || [],
        passives: json.passives || { allocatedCount: 0, jewelCount: 0, voidstoneCount: 0 },
        estimatedVitals: json.estimatedVitals || {
          flatLife: 0,
          flatEs: 0,
          fireRes: 0,
          coldRes: 0,
          lightningRes: 0,
          chaosRes: 0,
          suppress: 0
        }
      };
      const charKey = nextSnap.character.name || targetName;
      const updatedMap = { ...snapshots, [charKey]: nextSnap };
      setSnapshots(updatedMap);
      setSelectedChar(charKey);
      setLockedItem(null);
      setSelectedGemIdx(null);
      setShowSyncDrawer(false);

      if (canEdit) {
        await saveUserToolState(handle, 'character_gear_snapshots', updatedMap);
      }
      onNotify?.(`Synced ${charKey} gear & saved to your Exile Profile!`);
    } catch (e: any) {
      setShowSyncDrawer(true);
      setErrorMsg(e?.message || 'Failed to sync character gear.');
    } finally {
      setSyncing(false);
    }
  };

  const handlePushVitalsToCalculators = () => {
    if (!activeSnapshot) return;
    try {
      localStorage.setItem(
        SYNCED_VITALS_STORAGE_KEY,
        JSON.stringify({
          characterName: activeSnapshot.character.name,
          className: activeSnapshot.character.className,
          level: activeSnapshot.character.level,
          league: activeSnapshot.character.league,
          syncedAtIso: activeSnapshot.syncedAtIso,
          passives: activeSnapshot.passives,
          vitals: activeSnapshot.estimatedVitals
        })
      );
      setVitalsPushed(true);
      setTimeout(() => setVitalsPushed(false), 3000);
      onNotify?.(
        `Sent ${activeSnapshot.character.name}'s gear vitals to Defense Mechanics EHP & Build Doctor!`
      );
    } catch {}
  };

  const renderSlot = (
    item: PaperdollItem | null,
    label: string,
    heightClass: string
  ) => {
    const isLocked = Boolean(item && lockedItem?.id === item.id);
    return (
      <button
        type="button"
        onMouseEnter={(e) => {
          if (item) {
            if (!lockedItem) {
              setHoveredItem(item);
              setSelectedGemIdx(null);
              if (inspectMode === 'popup') {
                computePopupPosition(e.currentTarget);
              }
            }
          }
        }}
        onMouseLeave={() => {
          if (!lockedItem) {
            setHoveredItem(null);
          }
        }}
        onClick={(e) => {
          if (item) {
            if (isLocked) {
              setLockedItem(null);
            } else {
              setLockedItem(item);
              setHoveredItem(null);
              setSelectedGemIdx(null);
              if (inspectMode === 'popup') {
                computePopupPosition(e.currentTarget);
              }
            }
          }
        }}
        className={`relative w-full ${heightClass} rounded-lg border-2 flex flex-col items-center justify-center p-1.5 transition-all overflow-hidden group cursor-pointer ${
          item
            ? getRarityFrameClasses(item.frameType)
            : 'border-slate-800/90 bg-slate-950/75 hover:border-slate-700'
        } ${isLocked ? 'ring-2 ring-amber-400/90' : ''}`}
      >
        {item ? (
          <>
            {item.icon ? (
              <img
                src={item.icon}
                alt={item.name || item.baseType}
                className="max-h-full max-w-full object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] group-hover:scale-105 transition-transform"
              />
            ) : (
              <span className="text-[10px] font-mono text-slate-300 text-center px-1 leading-tight">
                {item.name || item.baseType}
              </span>
            )}
            <SocketOverlay sockets={item.sockets} />
            {item.corrupted && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 shadow" title="Corrupted" />
            )}
          </>
        ) : (
          <span className="text-[9px] font-mono uppercase tracking-wider text-slate-600 select-none">
            {label}
          </span>
        )}
      </button>
    );
  };

  const activeWeapon = slotItem(weaponSet === 1 ? 'Weapon' : 'Weapon2');
  const activeOffhand = slotItem(weaponSet === 1 ? 'Offhand' : 'Offhand2');
  const hasSavedCreds = Boolean(accountInput.trim() && poesessid.trim());

  return (
    <div className="p-4 sm:p-5 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-950 via-slate-900/95 to-slate-950 shadow-2xl space-y-4">
      {/* Header, Tooltip Mode Toggle & League Sorted Character Selector */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 border-b border-slate-800/90 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-amber-200 tracking-wide uppercase">
              Character
            </h2>
            <p className="text-[11px] font-mono text-slate-400">
              Hover any equipped item for in game stats, Implicits, Prefixes, Suffixes &amp; Gems. Click to pin.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Hover Popup vs Side Panel User Toggle */}
          <div
            className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800 text-[11px] font-mono"
            title="Choose how equipped item tooltips appear"
          >
            <button
              type="button"
              onClick={() => handleSetInspectMode('popup')}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors ${
                inspectMode === 'popup'
                  ? 'bg-amber-500/25 text-amber-200 border border-amber-400/50 font-bold'
                  : 'text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              <MousePointerClick className="w-3 h-3" />
              <span>Hover Popup</span>
            </button>
            <button
              type="button"
              onClick={() => handleSetInspectMode('side')}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors ${
                inspectMode === 'side'
                  ? 'bg-indigo-500/25 text-indigo-200 border border-indigo-400/50 font-bold'
                  : 'text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              <PanelRight className="w-3 h-3" />
              <span>Side Panel</span>
            </button>
          </div>

          <select
            value={selectedChar}
            onChange={(e) => {
              setSelectedChar(e.target.value);
              setLockedItem(null);
              setHoveredItem(null);
              setSelectedGemIdx(null);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-400 min-w-[220px] max-w-xs"
          >
            {groupedCharacters.length === 0 ? (
              <option value="">No characters synced yet</option>
            ) : (
              groupedCharacters.map((grp) => (
                <optgroup key={grp.league} label={grp.league}>
                  {grp.chars.map((opt) => (
                    <option key={`${grp.league}-${opt.name}`} value={opt.name}>
                      {opt.hasSnapshot ? '★ ' : ''}
                      {opt.name} ({opt.subtitle})
                    </option>
                  ))}
                </optgroup>
              ))
            )}
          </select>

          {canEdit && hasSavedCreds && selectedChar && (
            <button
              type="button"
              onClick={() => handleSyncCharacterGear()}
              disabled={syncing}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow"
              title="Refresh this character's live gear from GGG using your saved 30 day session"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Syncing...' : 'Refresh Gear'}</span>
            </button>
          )}

          {canEdit && (
            <button
              type="button"
              onClick={() => setShowSyncDrawer((v) => !v)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>{showSyncDrawer ? 'Hide Sync' : hasSavedCreds ? 'GGG Sync' : 'Connect GGG Sync'}</span>
            </button>
          )}

          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
              title={collapsed ? 'Expand Character section' : 'Collapse Character section'}
            >
              {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {!collapsed && (
        <>
          {/* Collapsible Live GGG Sync Drawer */}
          {canEdit && showSyncDrawer && (
            <div className="p-3.5 rounded-xl border border-indigo-500/30 bg-indigo-950/20 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-indigo-200">
                  <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>
                    Saved locally in your browser for 30 days per our Privacy Policy (never stored on Exile SSF servers).
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <input
                  type="text"
                  value={accountInput}
                  onChange={(e) => setAccountInput(e.target.value)}
                  placeholder="PoE Account Tag (e.g. Leuie#0626)"
                  className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 font-mono focus:outline-none focus:border-indigo-400"
                />
                <input
                  type="password"
                  value={poesessid}
                  onChange={(e) => setPoesessid(e.target.value)}
                  placeholder="POESESSID (saved locally for 30 days)"
                  className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 font-mono focus:outline-none focus:border-indigo-400"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleLoadLiveCharacters}
                    disabled={loadingList}
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-mono font-bold text-[11px] cursor-pointer disabled:opacity-50"
                  >
                    {loadingList ? 'Loading...' : '1. Fetch Chars'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSyncCharacterGear()}
                    disabled={syncing || !selectedChar}
                    className="flex-1 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] cursor-pointer disabled:opacity-50"
                  >
                    {syncing ? 'Syncing...' : '2. Sync Gear'}
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 text-xs text-rose-300 bg-rose-950/40 border border-rose-500/40 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
          )}

          {/* Main Paperdoll + Telemetry / Optional Side Panel Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Authentic PoE Inventory Paperdoll Frame */}
            <div className="lg:col-span-7 p-4 rounded-2xl border-2 border-amber-700/40 bg-[radial-gradient(ellipse_at_top,_rgba(30,41,59,0.65),_rgba(2,6,23,0.95))] shadow-inner space-y-3">
              {/* Top Ornate Banner */}
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setWeaponSet(1)}
                    className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-bold border cursor-pointer ${
                      weaponSet === 1
                        ? 'bg-amber-500/25 border-amber-400 text-amber-200'
                        : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Set I
                  </button>
                  <button
                    type="button"
                    onClick={() => setWeaponSet(2)}
                    className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-bold border cursor-pointer ${
                      weaponSet === 2
                        ? 'bg-amber-500/25 border-amber-400 text-amber-200'
                        : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Set II
                  </button>
                </div>
                <div className="text-xs font-mono font-bold tracking-widest uppercase text-amber-300/90">
                  {activeSnapshot
                    ? `${activeSnapshot.character.name} • Lv ${activeSnapshot.character.level} ${activeSnapshot.character.className}`
                    : 'INVENTORY'}
                </div>
                <div className="text-[10px] font-mono text-slate-500">
                  {activeSnapshot ? `${activeSnapshot.equipped.length} items` : 'Empty'}
                </div>
              </div>

              {/* 3 Column Authentic PoE Equipment Grid */}
              <div className="grid grid-cols-12 gap-2.5 items-stretch">
                <div className="col-span-4 flex flex-col gap-2.5">
                  <div className="grid grid-cols-3 gap-2 items-end">
                    <div className="col-span-2">{renderSlot(activeWeapon, `Weapon ${weaponSet === 1 ? 'I' : 'II'}`, 'h-44')}</div>
                    <div className="col-span-1 flex flex-col justify-end">
                      {renderSlot(slotItem('Ring'), 'Ring 1', 'h-16')}
                    </div>
                  </div>
                  <div className="pl-6">{renderSlot(slotItem('Gloves'), 'Gloves', 'h-24')}</div>
                </div>

                <div className="col-span-4 flex flex-col gap-2.5">
                  {renderSlot(slotItem('Helm'), 'Helm', 'h-24')}
                  {renderSlot(slotItem('BodyArmour'), 'Body Armour', 'h-32')}
                  {renderSlot(slotItem('Belt'), 'Belt', 'h-12')}
                </div>

                <div className="col-span-4 flex flex-col gap-2.5">
                  <div className="grid grid-cols-3 gap-2 items-end">
                    <div className="col-span-1 flex flex-col gap-2 justify-end">
                      {renderSlot(slotItem('Amulet'), 'Amulet', 'h-16')}
                      {renderSlot(slotItem('Ring2'), 'Ring 2', 'h-16')}
                    </div>
                    <div className="col-span-2">{renderSlot(activeOffhand, `Offhand ${weaponSet === 1 ? 'I' : 'II'}`, 'h-44')}</div>
                  </div>
                  <div className="pr-6">{renderSlot(slotItem('Boots'), 'Boots', 'h-24')}</div>
                </div>
              </div>

              {/* Bottom 5 Flask Tray */}
              <div className="pt-2 border-t border-amber-500/20">
                <div className="grid grid-cols-5 gap-2 max-w-md mx-auto">
                  {flasks.map((fl, idx) => (
                    <div key={idx}>{renderSlot(fl, `Flask ${idx + 1}`, 'h-20')}</div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Character Telemetry + (Side Inspector when Side Panel mode is active) */}
            <div className="lg:col-span-5 space-y-3">
              {activeSnapshot ? (
                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase text-emerald-300">
                      <Activity className="w-3.5 h-3.5" />
                      <span>Gear &amp; Passive Tree Telemetry</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">
                      Synced {new Date(activeSnapshot.syncedAtIso).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                      <div className="text-sm font-bold text-white">{activeSnapshot.passives.allocatedCount}</div>
                      <div className="text-[10px] font-mono text-slate-400">Passives</div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                      <div className="text-sm font-bold text-indigo-300">{activeSnapshot.passives.jewelCount}</div>
                      <div className="text-[10px] font-mono text-slate-400">Tree Jewels</div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                      <div className="text-sm font-bold text-amber-300">{activeSnapshot.passives.voidstoneCount}/4</div>
                      <div className="text-[10px] font-mono text-slate-400">Voidstones</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
                    <span className="px-2 py-0.5 rounded bg-rose-950/60 border border-rose-500/30 text-rose-200">
                      +{activeSnapshot.estimatedVitals.flatLife} Gear Life
                    </span>
                    <span className="px-2 py-0.5 rounded bg-sky-950/60 border border-sky-500/30 text-sky-200">
                      +{activeSnapshot.estimatedVitals.flatEs} Gear ES
                    </span>
                    <span className="px-2 py-0.5 rounded bg-orange-950/60 border border-orange-500/30 text-orange-200">
                      Fire +{activeSnapshot.estimatedVitals.fireRes}%
                    </span>
                    <span className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-200">
                      Cold +{activeSnapshot.estimatedVitals.coldRes}%
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/30 text-amber-200">
                      Light +{activeSnapshot.estimatedVitals.lightningRes}%
                    </span>
                    <span className="px-2 py-0.5 rounded bg-purple-950/60 border border-purple-500/30 text-purple-200">
                      Chaos +{activeSnapshot.estimatedVitals.chaosRes}%
                    </span>
                    {activeSnapshot.estimatedVitals.suppress > 0 && (
                      <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-200">
                        Suppress +{activeSnapshot.estimatedVitals.suppress}%
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handlePushVitalsToCalculators}
                    className="w-full py-2 px-3 rounded-lg bg-indigo-600/25 hover:bg-indigo-600/35 border border-indigo-500/40 text-indigo-200 text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {vitalsPushed ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Saved for EHP Calculator &amp; PoB Build Doctor!</span>
                      </>
                    ) : (
                      <>
                        <Compass className="w-3.5 h-3.5" />
                        <span>Load Vitals into EHP Calc &amp; Build Doctor</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-slate-800 bg-slate-900/50 text-xs text-slate-400 space-y-1.5">
                  <div className="font-bold text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>No Gear Snapshot Synced Yet</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    {canEdit
                      ? 'Click Connect GGG Sync above to pull your equipped items, gem links, flasks, and passive tree straight from Path of Exile.'
                      : `When @${handle} syncs a character snapshot, their full Path of Exile equipment will appear here.`}
                  </p>
                </div>
              )}

              {/* Affix Legend Pill Card in Hover Popup Mode, OR Full Side Panel in Side Mode */}
              {inspectMode === 'popup' ? (
                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/75 space-y-2 text-[11px]">
                  <div className="font-mono font-bold uppercase text-amber-300 text-[10px] tracking-wider">
                    In Game Hover Tooltip Active
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Hover any equipped gear or flask slot to pop up its full tooltip right over the inventory. <strong className="text-slate-200">Click any slot</strong> to pin the popup open so you can click socketed gems or open PoE Wiki.
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[9px] font-mono">
                    <span className="px-1.5 py-0.5 rounded bg-sky-950 border border-sky-500/40 text-sky-300 font-bold">IMP = Implicit</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-500/45 text-emerald-300 font-bold">PRE = Prefix</span>
                    <span className="px-1.5 py-0.5 rounded bg-purple-950 border border-purple-500/45 text-purple-300 font-bold">SUF = Suffix</span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-950 border border-amber-400/50 text-amber-300 font-bold">FRAC = Fractured</span>
                    <span className="px-1.5 py-0.5 rounded bg-sky-950 border border-sky-400/45 text-sky-200 font-bold">CRAFT = Crafted</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/90 min-h-[260px]">
                  {inspectedItem ? (
                    <ItemInspectorBody
                      item={inspectedItem}
                      canEdit={canEdit}
                      selectedGemIdx={selectedGemIdx}
                      onSelectGemIdx={setSelectedGemIdx}
                    />
                  ) : (
                    <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center text-xs text-slate-500 space-y-1.5">
                      <Shield className="w-6 h-6 text-slate-700" />
                      <div className="font-mono">Hover or click any equipped item slot</div>
                      <div className="text-[11px] text-slate-600">
                        Inspect full item stats, Implicits, Prefixes, Suffixes, and socketed gems.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Floating In Game Hover / Pinned Popup Modal (Hover Popup Mode) */}
          {inspectMode === 'popup' && inspectedItem && popupCoords && (
            <>
              {lockedItem && (
                <div
                  className="fixed inset-0 z-40 bg-black/20"
                  onClick={() => setLockedItem(null)}
                />
              )}
              <div
                style={{
                  left: `${popupCoords.left}px`,
                  top: `${popupCoords.top}px`
                }}
                className={`fixed z-50 w-[350px] max-w-[92vw] max-h-[82vh] overflow-y-auto p-3.5 rounded-xl border-2 bg-slate-950/98 shadow-[0_20px_60px_rgba(0,0,0,0.9)] backdrop-blur-md ${getRarityBorderAccent(
                  inspectedItem.frameType
                )} ${lockedItem ? 'pointer-events-auto' : 'pointer-events-none'}`}
              >
                {lockedItem && (
                  <div className="mb-2 pb-1.5 border-b border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-amber-300">
                    <span>Pinned Tooltip • Click gems or press Esc</span>
                  </div>
                )}
                <ItemInspectorBody
                  item={inspectedItem}
                  canEdit={canEdit}
                  selectedGemIdx={selectedGemIdx}
                  onSelectGemIdx={setSelectedGemIdx}
                  isPinnedPopup={Boolean(lockedItem)}
                  onClosePinned={() => setLockedItem(null)}
                />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};
