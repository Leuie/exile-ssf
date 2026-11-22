import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Sparkles,
  Flame,
  Hammer,
  RefreshCw,
  Camera,
  GitCompare,
  Package,
  Upload,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  AlertTriangle,
  Save,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Layers,
  TrendingUp,
  Timer,
  Share2,
  Users,
  Volume2,
  VolumeX,
  FileSpreadsheet,
  SlidersHorizontal,
  Table as TableIcon,
  LayoutGrid,
  Maximize2,
  Minimize2,
  ExternalLink,
  EyeOff,
  Send,
  Pencil,
  Copy,
  Check,
  FolderOpen,
  Bell,
  BellOff,
  Cloud
} from 'lucide-react';
import { parsePoeClipboardTooltip } from '../utils/poeItemParser';
import { buildXlsxBlob, triggerFileDownload, type SheetDefinition } from '../utils/spreadsheetEngine';
import type { UserAccount, LookingForItem } from '../types';

interface FarmingTrackerViewProps {
  selectedGame?: 'poe1' | 'poe2';
  userAccount?: UserAccount | null;
  onOpenAuthModal?: () => void;
}

interface StashTabMeta {
  index: number;
  id: string;
  name: string;
  type: string;
  colour: { r: number; g: number; b: number };
}

interface TrackedDropItem {
  key: string;
  name: string;
  shortName: string;
  baseType: string;
  category: string;
  subCategory?: string;
  gemLevel?: number;
  gemQuality?: number;
  isVaal?: boolean;
  isTransfigured?: boolean;
  isAwakened?: boolean;
  corrupted?: boolean;
  quantity: number;
  icon: string;
  frameType: number;
  ilvl: number;
  tabName: string;
}

type ItemTier = 'S' | 'A' | 'B' | 'C';

interface EnrichedDropItem extends TrackedDropItem {
  chaosEach: number;
  totalChaos: number;
  ssfPointsEach: number;
  totalSsfPoints: number;
  tier: ItemTier;
}

interface SavedFarmingSession {
  id: string;
  handle: string;
  game: 'poe1' | 'poe2';
  title: string;
  strategy?: string;
  league: string;
  mapsRun: number;
  durationMinutes: number;
  deaths: number;
  totalChaos?: number;
  createdAtIso: string;
  items: TrackedDropItem[];
}

interface SyncCheckpoint {
  at: string;
  totalItems: number;
  totalChaos: number;
}

interface LeagueOption {
  id: string;
  name: string;
  game: 'poe1' | 'poe2';
}

type SortField = 'total' | 'price' | 'qty' | 'name' | 'tab' | 'tier' | 'gem_level' | 'gem_quality' | 'ilvl';

const PREFS_STORAGE_KEY = 'exile_ssf_farming_prefs_v2';
const WORKSPACE_STORAGE_KEY = 'exile_ssf_farming_workspace_v1';

const DEFAULT_LEAGUES: LeagueOption[] = [
  { id: 'poe1-330-umbra', name: 'Ravenwatch Covens of Umbra GSF (PL87651)', game: 'poe1' },
  { id: 'poe2-ea-ancients', name: 'PoE 2 Early Access Private League', game: 'poe2' }
];

const STRATEGY_PRESETS = [
  'Essence + Harbinger',
  'Destructive Play Boss Rush',
  'Breach + Scarabs',
  'Harvest + Expedition',
  'T17 Scarab Farm',
  'Alch & Go Red Maps',
  'Tier 15 Waystones',
  'Heist / Delve / Sanctum'
];

const CATEGORY_ORDER = [
  'Uniques',
  'Currency',
  'Div Cards',
  'Gems',
  'Scarabs & Fragments',
  'Essences & Crafting',
  'Maps & League Keys',
  'Gear & Jewels'
];

const GEM_SUBFILTERS = ['All Gems', 'Vaal', 'Transfigured', 'Awakened', 'Level 20+', 'Quality 15%+', 'Corrupted'];

const EQUIPMENT_BRACKETS = [
  'All Equipment',
  'Armour',
  'Evasion',
  'Energy Shield',
  'Hybrid (AR/EV)',
  'Hybrid (AR/ES)',
  'Hybrid (EV/ES)',
  'Hybrid (AR/EV/ES)',
  'Ward',
  'Weapons',
  'Jewellery',
  'Jewels & Clusters',
  'Flasks & Tinctures'
];

const TIER_STYLES: Record<ItemTier, string> = {
  S: 'bg-amber-500/25 border-amber-400/70 text-amber-200',
  A: 'bg-purple-500/20 border-purple-400/60 text-purple-200',
  B: 'bg-sky-500/20 border-sky-400/50 text-sky-200',
  C: 'bg-slate-800/80 border-slate-700 text-slate-400'
};

const TIER_RANK: Record<ItemTier, number> = { S: 4, A: 3, B: 2, C: 1 };

const BULK_NOISE_REGEX = /^(scroll of wisdom|portal scroll|orb of transmutation|orb of augmentation|armourer's scrap|blacksmith's whetstone|transmutation shard|alteration shard|alchemy shard|scroll fragment)$/i;

function playSubtleChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.16); // A5
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch {}
}

function parseClientGggStashJson(rawJson: string, fallbackTabName: string): { tabs: StashTabMeta[]; items: TrackedDropItem[] } {
  const parsed = JSON.parse(rawJson);
  const rawItems = Array.isArray(parsed?.items) ? parsed.items : [];
  const tabs: StashTabMeta[] = Array.isArray(parsed?.tabs)
    ? parsed.tabs.map((t: any) => ({
        index: Number(t.i),
        id: String(t.id || t.i),
        name: String(t.n || `Tab ${Number(t.i) + 1}`),
        type: String(t.type || 'NormalStash'),
        colour: t.colour || { r: 99, g: 102, b: 241 }
      }))
    : [];

  const parsePropNum = (it: any, propName: string): number => {
    if (!Array.isArray(it?.properties)) return 0;
    const found = it.properties.find((p: any) => String(p?.name || '').toLowerCase() === propName.toLowerCase());
    if (!found || !Array.isArray(found.values) || !found.values[0]) return 0;
    const m = String(found.values[0][0] || '').match(/\d+/);
    return m ? parseInt(m[0], 10) : 0;
  };

  const agg = new Map<string, TrackedDropItem>();
  for (const it of rawItems) {
    const cleanName = String(it.name || '').replace(/<<[^>]+>>/g, '').trim();
    const cleanBase = String(it.baseType || it.typeLine || '').replace(/<<[^>]+>>/g, '').trim();
    const displayName = cleanName && cleanName !== cleanBase ? `${cleanName} (${cleanBase})` : cleanName || cleanBase || 'Unknown Item';
    const shortName = cleanName || cleanBase || 'Unknown Item';
    const baseLow = cleanBase.toLowerCase();
    const full = `${cleanName} ${cleanBase}`.toLowerCase();
    const iconLow = String(it.icon || '').toLowerCase();
    const ft = Number(it.frameType ?? 0);
    const corrupted = Boolean(it.corrupted);

    let category = 'Gear & Jewels';
    let subCategory = 'Other Equipment';
    let gemLevel = 0;
    let gemQuality = 0;
    let isVaal = false;
    let isTransfigured = false;
    let isAwakened = false;

    if (ft === 4) {
      category = 'Gems';
      gemLevel = parsePropNum(it, 'Level');
      gemQuality = parsePropNum(it, 'Quality');
      isVaal = Boolean(it?.hybrid?.isVaalGem) || baseLow.startsWith('vaal ');
      isAwakened = baseLow.startsWith('awakened ');
      isTransfigured = /\bof\s+[a-z]/i.test(cleanBase) && !/(herald of|purity of|aura of|aspect of)/i.test(cleanBase);
      subCategory = isAwakened
        ? 'Awakened Gems'
        : isVaal
        ? 'Vaal Gems'
        : isTransfigured
        ? 'Transfigured Gems'
        : gemLevel >= 20 || gemQuality >= 15
        ? 'High Level / Quality Gems'
        : 'Standard Gems';
    } else if (ft === 3) {
      category = 'Uniques';
      subCategory = iconLow.includes('/weapons/') ? 'Unique Weapons' : iconLow.includes('/jewels/') || iconLow.includes('/flasks/') ? 'Unique Jewels & Flasks' : 'Unique Armour & Gear';
    } else if (ft === 6) {
      category = 'Div Cards';
      subCategory = 'Divination Cards';
    } else if (/(scarab|fragment|splinter|breachstone|emblem|invitation|mortal |sacrifice at|vessel|simulacrum)/i.test(full)) {
      category = 'Scarabs & Fragments';
      subCategory = full.includes('scarab') ? 'Scarabs' : 'Boss Fragments & Invitations';
    } else if (/(essence|fossil|resonator|catalyst|oil|tattoo|runegraft|omen|delirium orb)/i.test(full)) {
      category = 'Essences & Crafting';
      subCategory = full.includes('essence') ? 'Essences' : 'Crafting & Socketables';
    } else if (/(map|waystone|logbook|blueprint|contract|inscribed ultimatum)/i.test(baseLow)) {
      category = 'Maps & League Keys';
      subCategory = 'Maps & Waystones';
    } else if (ft === 5 || /(orb|shard|scroll|chisel|bauble|whetstone|scrap|prism|mirror)/i.test(full)) {
      category = 'Currency';
      subCategory = /(divine|mirror|exalted|fracturing|hinekora|annulment|chaos orb)/i.test(full) ? 'High Tier Currency' : 'Standard Currency';
    } else {
      const ar = parsePropNum(it, 'Armour') > 0;
      const ev = parsePropNum(it, 'Evasion Rating') > 0;
      const es = parsePropNum(it, 'Energy Shield') > 0;
      const wd = parsePropNum(it, 'Ward') > 0;
      if (iconLow.includes('/jewels/') || baseLow.includes('jewel')) subCategory = 'Jewels & Clusters';
      else if (iconLow.includes('/flasks/') || baseLow.includes('flask')) subCategory = 'Flasks & Tinctures';
      else if (/(ring|amulet|belt|sash)$/i.test(baseLow)) subCategory = 'Jewellery';
      else if (iconLow.includes('/weapons/')) subCategory = 'Weapons';
      else if (wd) subCategory = 'Ward';
      else if (ar && ev && es) subCategory = 'Hybrid (AR/EV/ES)';
      else if (ar && es) subCategory = 'Hybrid (AR/ES)';
      else if (ar && ev) subCategory = 'Hybrid (AR/EV)';
      else if (ev && es) subCategory = 'Hybrid (EV/ES)';
      else if (ar) subCategory = 'Armour';
      else if (ev) subCategory = 'Evasion';
      else if (es) subCategory = 'Energy Shield';
    }

    const qty = Math.max(1, Number(it.stackSize || 1));
    const key =
      category === 'Gems'
        ? `${category}::${displayName.toLowerCase()}::l${gemLevel}::q${gemQuality}::c${corrupted ? 1 : 0}`
        : `${category}::${subCategory}::${displayName.toLowerCase()}`;

    const existing = agg.get(key);
    if (existing) {
      existing.quantity += qty;
    } else {
      agg.set(key, {
        key,
        name: displayName,
        shortName,
        baseType: cleanBase,
        category,
        subCategory,
        gemLevel,
        gemQuality,
        isVaal,
        isTransfigured,
        isAwakened,
        corrupted,
        quantity: qty,
        icon: typeof it.icon === 'string' ? it.icon : '',
        frameType: ft,
        ilvl: Number(it.ilvl || 0),
        tabName: fallbackTabName
      });
    }
  }

  return { tabs, items: Array.from(agg.values()) };
}

function computeSnapshotDiff(before: TrackedDropItem[], after: TrackedDropItem[]): TrackedDropItem[] {
  const beforeMap = new Map<string, number>();
  for (const it of before) {
    beforeMap.set(it.key, (beforeMap.get(it.key) || 0) + it.quantity);
  }
  const diff: TrackedDropItem[] = [];
  for (const it of after) {
    const prevQty = beforeMap.get(it.key) || 0;
    const gained = it.quantity - prevQty;
    if (gained > 0) diff.push({ ...it, quantity: gained });
  }
  return diff;
}

function lookupNinjaPrice(item: TrackedDropItem, prices: Record<string, number>): number {
  const shortLow = item.shortName.trim().toLowerCase();
  const baseLow = item.baseType.trim().toLowerCase();
  if (item.category === 'Gems') {
    const lvl = item.gemLevel || 1;
    const qual = item.gemQuality || 0;
    const corr = item.corrupted ? 1 : 0;
    const exactGem = prices[`gem::${shortLow}::l${lvl}::q${qual}::c${corr}`];
    if (exactGem) return exactGem;
    const q20 = qual >= 18 ? prices[`gem::${shortLow}::l${lvl}::q20::c${corr}`] : 0;
    if (q20) return q20;
    return prices[shortLow] || 0;
  }
  return prices[shortLow] || (baseLow ? prices[baseLow] || 0 : 0);
}

function resolveTier(chaosEach: number, totalChaos: number, divineChaos: number): ItemTier {
  const sThreshold = Math.max(100, divineChaos * 0.9);
  if (chaosEach >= sThreshold || totalChaos >= sThreshold) return 'S';
  if (chaosEach >= 30 || totalChaos >= 50) return 'A';
  if (chaosEach >= 5 || totalChaos >= 12) return 'B';
  return 'C';
}

function computeSsfUtilityPoints(item: TrackedDropItem, chaosEach: number, isWishlistMatch: boolean): number {
  const low = `${item.shortName} ${item.baseType}`.toLowerCase();
  let pts = 0;

  // 1. Micro-stackables that drop in hundreds/thousands MUST stay fractional
  if (low.includes("rogue's marker")) {
    pts = 0.002;
  } else if (low.includes('crystallised lifeforce')) {
    pts = 0.025;
  } else if (low.includes('splinter') || low.includes('artifact')) {
    pts = chaosEach > 0 ? Math.min(chaosEach, 0.5) : 0.15;
  } else if (
    BULK_NOISE_REGEX.test(item.shortName.trim()) ||
    /\b(shard|fragment of|scroll)\b/i.test(low)
  ) {
    pts = 0.01;
  } else if (/\b(orb of alteration|jeweller's orb|chromatic orb)\b/i.test(low)) {
    pts = Math.max(chaosEach, 0.15);
  } else if (/\b(orb of fusing|orb of alchemy|orb of scouring|orb of chance|orb of binding|blessed orb)\b/i.test(low)) {
    pts = Math.max(chaosEach, 0.4);
  } else if (/\b(lesser eldritch)\b/i.test(low)) {
    pts = Math.max(chaosEach, 1.5);
  } else if (/\b(greater eldritch)\b/i.test(low)) {
    pts = Math.max(chaosEach, 4);
  } else if (/\b(grand eldritch)\b/i.test(low)) {
    pts = Math.max(chaosEach, 12);
  } else if (/\b(exceptional eldritch)\b/i.test(low)) {
    pts = Math.max(chaosEach, 40);
  } else if (/\b(regal orb|vaal orb|cartographer's chisel|orb of unmaking|orb of horizons|orb of regret|instilling orb|enkindling orb|glassblower's bauble)\b/i.test(low)) {
    pts = Math.max(chaosEach * 1.25, 1.5);
  } else if (chaosEach > 0) {
    // Anchor directly to poe.ninja Chaos value (1 Chaos = 1.0 SSF pt), with a modest SSF crafting/atlas boost
    const isSsfStaple =
      item.category === 'Essences & Crafting' ||
      item.category === 'Scarabs & Fragments' ||
      item.category === 'Maps & League Keys' ||
      item.isTransfigured ||
      item.isAwakened;
    pts = Math.round(chaosEach * (isSsfStaple ? 1.2 : 1.0) * 100) / 100;
  } else if (item.category === 'Uniques') {
    pts = 5;
  } else if (item.category === 'Gems') {
    pts = item.isAwakened ? 80 : item.isTransfigured ? 20 : (item.gemLevel || 0) >= 20 ? 10 : 1;
  } else if (item.category === 'Maps & League Keys') {
    pts = 2;
  } else if (item.category === 'Gear & Jewels' && item.ilvl >= 84) {
    pts = 3;
  } else {
    pts = 0.25;
  }

  // Squad Wishlist Match gets a real +100 pt priority boost (never inflated by stack size)
  return isWishlistMatch ? pts + 100 : pts;
}

function formatSsfPoints(pts: number): string {
  if (pts <= 0) return '0 pts';
  if (pts < 0.1) return `${pts.toFixed(3)} pts`;
  if (pts < 10) return `${pts.toFixed(1)} pts`;
  return `${Math.round(pts).toLocaleString()} pts`;
}

function formatValue(chaos: number, divineChaos: number): string {
  if (chaos <= 0) return '0c';
  if (divineChaos > 0 && chaos >= divineChaos) {
    return `${(chaos / divineChaos).toFixed(1)}d`;
  }
  if (chaos < 1) return `${chaos.toFixed(1)}c`;
  return `${Math.round(chaos).toLocaleString()}c`;
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const FarmingTrackerView: React.FC<FarmingTrackerViewProps> = ({
  selectedGame = 'poe1',
  userAccount
}) => {
  const savedPrefs = useMemo(() => {
    try {
      const raw = localStorage.getItem(PREFS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }, []);

  const savedWorkspace = useMemo(() => {
    try {
      const raw = localStorage.getItem(WORKSPACE_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }, []);

  const [game, setGame] = useState<'poe1' | 'poe2'>(selectedGame);
  const [leagueOptions, setLeagueOptions] = useState<LeagueOption[]>(DEFAULT_LEAGUES);
  const [linkedLeagueId, setLinkedLeagueId] = useState<string>(savedPrefs.linkedLeagueId || 'poe1-330-umbra');
  const [wishlistItems, setWishlistItems] = useState<LookingForItem[]>([]);
  const [claimedWishIds, setClaimedWishIds] = useState<Record<string, boolean>>({});
  const [sharedStashKeys, setSharedStashKeys] = useState<Record<string, boolean>>({});

  // Dashboard Visual Modes
  const [focusMode, setFocusMode] = useState<boolean>(false);
  const [setupOpen, setSetupOpen] = useState<boolean>(
    !(Array.isArray(savedWorkspace.activeDrops) && savedWorkspace.activeDrops.length > 0)
  );
  const [setupTab, setSetupTab] = useState<'api' | 'json' | 'manual'>('api');
  const [wealthMode, setWealthMode] = useState<'total' | 'hourly'>('total');
  const [valueSystem, setValueSystem] = useState<'ninja' | 'ssf'>(
    savedPrefs.valueSystem === 'ssf' ? 'ssf' : 'ninja'
  );
  const [breakdownMode, setBreakdownMode] = useState<'divines' | 'percent'>('divines');
  const [railTab, setRailTab] = useState<'tabs' | 'snapshots' | 'strategies'>('tabs');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [showFiltersBar, setShowFiltersBar] = useState<boolean>(false);
  const [hideBulkNoise, setHideBulkNoise] = useState<boolean>(false);
  const [chimeEnabled, setChimeEnabled] = useState<boolean>(true);
  const [desktopAlertsEnabled, setDesktopAlertsEnabled] = useState<boolean>(false);

  // poe.ninja Pricing State
  const [ninjaLeagueParam, setNinjaLeagueParam] = useState<string>('auto');
  const [ninjaResolvedLeague, setNinjaResolvedLeague] = useState<string>('');
  const [divineChaos, setDivineChaos] = useState<number>(150);
  const [ninjaPrices, setNinjaPrices] = useState<Record<string, number>>({ 'chaos orb': 1 });
  const [loadingNinja, setLoadingNinja] = useState<boolean>(false);

  // Stash API Connection State (POESESSID stays in memory only)
  const [accountName, setAccountName] = useState<string>(
    (savedPrefs.accountName && savedPrefs.accountName !== 'Leuie#0001' ? savedPrefs.accountName : '') ||
      (userAccount?.poeAccountName && userAccount.poeAccountName !== 'Leuie#0001' ? userAccount.poeAccountName : '') ||
      ''
  );
  const [leagueName, setLeagueName] = useState<string>(
    savedPrefs.leagueName || 'Ravenwatch Covens of Umbra GSF (PL87651)'
  );
  const [detectedLeagues, setDetectedLeagues] = useState<string[]>([]);
  const [detectingLeagues, setDetectingLeagues] = useState<boolean>(false);
  const [poesessid, setPoesessid] = useState<string>('');
  const [acceptedRiskDisclaimer, setAcceptedRiskDisclaimer] = useState<boolean>(false);
  const [stashTabs, setStashTabs] = useState<StashTabMeta[]>(
    Array.isArray(savedWorkspace.stashTabs) ? savedWorkspace.stashTabs : []
  );
  const [selectedTabIndices, setSelectedTabIndices] = useState<number[]>(
    Array.isArray(savedPrefs.selectedTabIndices) ? savedPrefs.selectedTabIndices : []
  );
  const [activeTabFilter, setActiveTabFilter] = useState<string>('ALL');
  const [loadingTabs, setLoadingTabs] = useState<boolean>(false);
  const [snapshotting, setSnapshotting] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>(savedWorkspace.lastSyncedAt || '');
  const [statusNotice, setStatusNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Direct Browser JSON Fallback State
  const [browserJsonInput, setBrowserJsonInput] = useState<string>('');
  const [browserJsonTabIndex, setBrowserJsonTabIndex] = useState<number>(0);

  // Auto Pull Timer & Live Client.txt Watcher
  const [autoSyncMinutes, setAutoSyncMinutes] = useState<number>(0);
  const [secondsUntilSync, setSecondsUntilSync] = useState<number>(0);
  const [checkpoints, setCheckpoints] = useState<SyncCheckpoint[]>(
    Array.isArray(savedWorkspace.checkpoints) ? savedWorkspace.checkpoints : []
  );
  const clientFileHandleRef = useRef<any>(null);
  const [watchingClientTxt, setWatchingClientTxt] = useState<boolean>(false);
  const [lastZoneName, setLastZoneName] = useState<string>('');
  const [copiedPathId, setCopiedPathId] = useState<string | null>(null);

  // Active Session State (Persisted locally across refreshes)
  const [sessionTitle, setSessionTitle] = useState<string>(
    savedWorkspace.sessionTitle || 'T16 Mapping & Dump Session'
  );
  const [strategyTag, setStrategyTag] = useState<string>(savedPrefs.strategyTag || STRATEGY_PRESETS[0]);
  const [mapsRun, setMapsRun] = useState<number>(Number(savedWorkspace.mapsRun || 0));
  const [durationMinutes, setDurationMinutes] = useState<number>(Number(savedWorkspace.durationMinutes || 60));
  const [deaths, setDeaths] = useState<number>(Number(savedWorkspace.deaths || 0));
  const [beforeSnapshot, setBeforeSnapshot] = useState<{ at: string; items: TrackedDropItem[] } | null>(
    savedWorkspace.beforeSnapshot || null
  );
  const [activeDrops, setActiveDrops] = useState<TrackedDropItem[]>(
    Array.isArray(savedWorkspace.activeDrops) ? savedWorkspace.activeDrops : []
  );

  // Manual / Clipboard Drop Input
  const [clipboardText, setClipboardText] = useState<string>('');
  const [manualName, setManualName] = useState<string>('');
  const [manualCategory, setManualCategory] = useState<string>('Uniques');
  const [manualQty, setManualQty] = useState<number>(1);

  // Filters & Table Sorting
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [subFilter, setSubFilter] = useState<string>('All');
  const [tierFilter, setTierFilter] = useState<'All' | ItemTier>('All');
  const [sortField, setSortField] = useState<SortField>('total');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Saved Sessions History & Cloud Stash Sync Status
  const [savedSessions, setSavedSessions] = useState<SavedFarmingSession[]>([]);
  const [savingSession, setSavingSession] = useState<boolean>(false);
  const [sharingRecap, setSharingRecap] = useState<boolean>(false);
  const [cloudHydrated, setCloudHydrated] = useState<boolean>(false);
  const [cloudSaveState, setCloudSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');

  const normalizedHandle = (userAccount?.displayName || '').trim().replace(/^@/, '').toLowerCase();

  useEffect(() => {
    document.title = 'Farming & Drop Tracker | Exile SSF';
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        PREFS_STORAGE_KEY,
        JSON.stringify({
          accountName,
          leagueName,
          linkedLeagueId,
          selectedTabIndices,
          strategyTag,
          valueSystem
        })
      );
    } catch {}
  }, [accountName, leagueName, linkedLeagueId, selectedTabIndices, strategyTag, valueSystem]);

  // Persist active synced loot, stash tabs, before snapshot, and checkpoints across page refreshes (never stores POESESSID)
  useEffect(() => {
    try {
      localStorage.setItem(
        WORKSPACE_STORAGE_KEY,
        JSON.stringify({
          activeDrops: activeDrops.slice(0, 1500),
          beforeSnapshot: beforeSnapshot
            ? { at: beforeSnapshot.at, items: beforeSnapshot.items.slice(0, 1500) }
            : null,
          stashTabs,
          checkpoints,
          lastSyncedAt,
          sessionTitle,
          mapsRun,
          durationMinutes,
          deaths
        })
      );
    } catch {}
  }, [activeDrops, beforeSnapshot, stashTabs, checkpoints, lastSyncedAt, sessionTitle, mapsRun, durationMinutes, deaths]);

  // Auto save active synced stash & tabs to Cloudflare D1 cloud (debounced, never stores POESESSID)
  const saveStashToCloud = useCallback(
    async (silent = true) => {
      if (!normalizedHandle) return;
      setCloudSaveState('saving');
      try {
        const res = await fetch('/api/farming/stash-state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            handle: normalizedHandle,
            state: {
              activeDrops: activeDrops.slice(0, 1500),
              beforeSnapshot: beforeSnapshot
                ? { at: beforeSnapshot.at, items: beforeSnapshot.items.slice(0, 1500) }
                : null,
              stashTabs,
              selectedTabIndices,
              checkpoints,
              lastSyncedAt,
              sessionTitle,
              strategyTag,
              leagueName,
              mapsRun,
              durationMinutes,
              deaths
            }
          })
        });
        if (res.ok) {
          setCloudSaveState('saved');
          if (!silent) {
            setStatusNotice({ type: 'ok', text: `Saved ${activeDrops.length} stash stacks to your Exile SSF cloud account!` });
          }
        }
      } catch {
        setCloudSaveState('idle');
      }
    },
    [
      normalizedHandle,
      activeDrops,
      beforeSnapshot,
      stashTabs,
      selectedTabIndices,
      checkpoints,
      lastSyncedAt,
      sessionTitle,
      strategyTag,
      leagueName,
      mapsRun,
      durationMinutes,
      deaths
    ]
  );

  useEffect(() => {
    if (!cloudHydrated || !normalizedHandle) return;
    if (activeDrops.length === 0 && stashTabs.length === 0 && !beforeSnapshot) return;
    const t = setTimeout(() => {
      saveStashToCloud(true);
    }, 1200);
    return () => clearTimeout(t);
  }, [cloudHydrated, normalizedHandle, activeDrops, beforeSnapshot, stashTabs, checkpoints, mapsRun, durationMinutes, deaths, saveStashToCloud]);

  const handleResetSession = () => {
    setActiveDrops([]);
    setBeforeSnapshot(null);
    setCheckpoints([]);
    setLastSyncedAt('');
    setMapsRun(0);
    setDurationMinutes(60);
    setDeaths(0);
    setActiveTabFilter('ALL');
    try {
      localStorage.removeItem(WORKSPACE_STORAGE_KEY);
    } catch {}
    if (normalizedHandle) {
      fetch('/api/farming/stash-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          handle: normalizedHandle,
          state: { activeDrops: [], beforeSnapshot: null, stashTabs, selectedTabIndices, checkpoints: [] }
        })
      }).catch(() => {});
    }
    setStatusNotice({ type: 'ok', text: 'Cleared current farming session (local and cloud).' });
  };

  const loadNinjaPrices = useCallback(async (targetLeague: string, forceRefresh = false) => {
    setLoadingNinja(true);
    try {
      const res = await fetch(
        `/api/farming/ninja-prices?league=${encodeURIComponent(targetLeague)}${forceRefresh ? '&refresh=1' : ''}`,
        { credentials: 'include' }
      );
      if (res.ok) {
        const data: any = await res.json();
        if (data?.prices && typeof data.prices === 'object') {
          setNinjaPrices(data.prices);
          setNinjaResolvedLeague(String(data.league || targetLeague));
          if (Number(data.divineChaos) > 0) setDivineChaos(Number(data.divineChaos));
        }
      }
    } catch {}
    setLoadingNinja(false);
  }, []);

  useEffect(() => {
    loadNinjaPrices(ninjaLeagueParam, false);
  }, [ninjaLeagueParam, loadNinjaPrices]);

  useEffect(() => {
    let cancelled = false;
    const loadContext = async () => {
      try {
        const dataRes = await fetch(`/api/data?leagueId=${encodeURIComponent(linkedLeagueId)}`, {
          credentials: 'include'
        });
        if (dataRes.ok && !cancelled) {
          const data: any = await dataRes.json();
          if (Array.isArray(data?.lookingForItems)) setWishlistItems(data.lookingForItems);
          if (Array.isArray(data?.customLeagues) && data.customLeagues.length > 0) {
            const customOpts: LeagueOption[] = data.customLeagues
              .filter((c: any) => c?.id && c?.name)
              .map((c: any) => ({
                id: String(c.id),
                name: String(c.name),
                game: c.game === 'poe2' ? 'poe2' : 'poe1'
              }));
            const merged = [...DEFAULT_LEAGUES];
            for (const opt of customOpts) {
              if (!merged.some((m) => m.id === opt.id)) merged.push(opt);
            }
            setLeagueOptions(merged);
          }
        }
      } catch {}

      if (normalizedHandle) {
        try {
          const [sessRes, cloudStateRes] = await Promise.all([
            fetch(`/api/farming/sessions?handle=${encodeURIComponent(normalizedHandle)}`, { credentials: 'include' }),
            fetch(`/api/farming/stash-state?handle=${encodeURIComponent(normalizedHandle)}`, { credentials: 'include' })
          ]);
          if (sessRes.ok && !cancelled) {
            const sessData: any = await sessRes.json();
            if (Array.isArray(sessData?.sessions)) setSavedSessions(sessData.sessions);
          }
          if (cloudStateRes.ok && !cancelled) {
            const stData: any = await cloudStateRes.json();
            const cs = stData?.state;
            if (cs && typeof cs === 'object') {
              if (Array.isArray(cs.activeDrops) && cs.activeDrops.length > 0) {
                setActiveDrops(cs.activeDrops);
                setSetupOpen(false);
              }
              if (Array.isArray(cs.stashTabs) && cs.stashTabs.length > 0) setStashTabs(cs.stashTabs);
              if (Array.isArray(cs.selectedTabIndices) && cs.selectedTabIndices.length > 0) {
                setSelectedTabIndices(cs.selectedTabIndices);
              }
              if (cs.beforeSnapshot) setBeforeSnapshot(cs.beforeSnapshot);
              if (Array.isArray(cs.checkpoints)) setCheckpoints(cs.checkpoints);
              if (cs.lastSyncedAt) setLastSyncedAt(cs.lastSyncedAt);
              if (cs.sessionTitle) setSessionTitle(cs.sessionTitle);
              if (cs.strategyTag) setStrategyTag(cs.strategyTag);
              if (typeof cs.mapsRun === 'number') setMapsRun(cs.mapsRun);
              if (typeof cs.durationMinutes === 'number' && cs.durationMinutes > 0) setDurationMinutes(cs.durationMinutes);
              if (typeof cs.deaths === 'number') setDeaths(cs.deaths);
              setCloudSaveState('saved');
            }
          }
        } catch {}
      }
      if (!cancelled) setCloudHydrated(true);
    };
    loadContext();
    return () => {
      cancelled = true;
    };
  }, [linkedLeagueId, normalizedHandle]);

  const openWishlistNames = useMemo(
    () => wishlistItems.filter((w) => w.status !== 'HAVE').map((w) => w.itemName.trim().toLowerCase()).filter((s) => s.length >= 4),
    [wishlistItems]
  );

  const enrichedDrops = useMemo<EnrichedDropItem[]>(() => {
    return activeDrops.map((it) => {
      const chaosEach = lookupNinjaPrice(it, ninjaPrices);
      const totalChaos = Math.round(chaosEach * it.quantity * 10) / 10;
      const dropLow = it.shortName.toLowerCase();
      const isWish = openWishlistNames.some((w) => dropLow === w || it.name.toLowerCase().includes(w));
      const ssfPointsEach = computeSsfUtilityPoints(it, chaosEach, isWish);
      const totalSsfPoints = Math.round(ssfPointsEach * it.quantity * 10) / 10;
      const tier = resolveTier(chaosEach, totalChaos, divineChaos);
      return { ...it, chaosEach, totalChaos, ssfPointsEach, totalSsfPoints, tier };
    });
  }, [activeDrops, ninjaPrices, divineChaos, openWishlistNames]);

  const totalSessionChaos = useMemo(
    () => Math.round(enrichedDrops.reduce((sum, it) => sum + it.totalChaos, 0) * 10) / 10,
    [enrichedDrops]
  );
  const totalSessionSsfPoints = useMemo(
    () => Math.round(enrichedDrops.reduce((sum, it) => sum + it.totalSsfPoints, 0) * 10) / 10,
    [enrichedDrops]
  );
  const chaosPerHour = durationMinutes > 0 ? Math.round((totalSessionChaos / durationMinutes) * 60) : 0;
  const ssfPointsPerHour = durationMinutes > 0 ? Math.round((totalSessionSsfPoints / durationMinutes) * 60) : 0;
  const mapsPerHour = durationMinutes > 0 && mapsRun > 0 ? ((mapsRun / durationMinutes) * 60).toFixed(1) : '0.0';

  const tierCounts = useMemo(() => {
    const counts: Record<ItemTier, number> = { S: 0, A: 0, B: 0, C: 0 };
    for (const it of enrichedDrops) counts[it.tier] += 1;
    return counts;
  }, [enrichedDrops]);

  const wishlistMatches = useMemo(() => {
    const openWishes = wishlistItems.filter((w) => w.status !== 'HAVE');
    if (openWishes.length === 0 || enrichedDrops.length === 0) return [];
    const matches: { drop: EnrichedDropItem; wish: LookingForItem }[] = [];
    for (const drop of enrichedDrops) {
      const dropLow = drop.shortName.toLowerCase();
      const dropFull = drop.name.toLowerCase();
      for (const wish of openWishes) {
        const wLow = wish.itemName.trim().toLowerCase();
        if (wLow.length >= 4 && (dropLow === wLow || dropFull.includes(wLow) || wLow.includes(dropLow))) {
          matches.push({ drop, wish });
        }
      }
    }
    return matches;
  }, [wishlistItems, enrichedDrops]);

  // Trigger optional chime & browser desktop notification when new S Tier or Wishlist Matches arrive
  const prevAlertCountRef = useRef<number>(0);
  useEffect(() => {
    const currentAlertCount = tierCounts.S + wishlistMatches.length;
    if (currentAlertCount > prevAlertCountRef.current) {
      if (chimeEnabled) playSubtleChime();
      if (desktopAlertsEnabled && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        const msg =
          wishlistMatches.length > 0
            ? `Squad Wishlist Match: ${wishlistMatches[0].drop.shortName} for @${wishlistMatches[0].wish.displayName || wishlistMatches[0].wish.characterName}!`
            : `${tierCounts.S} Tier S Jackpot drop(s) detected in your Dump Tabs!`;
        try {
          new Notification('Exile SSF Drop Alert', { body: msg, icon: '/logo.png' });
        } catch {}
      }
    }
    prevAlertCountRef.current = currentAlertCount;
  }, [tierCounts.S, wishlistMatches, chimeEnabled, desktopAlertsEnabled]);

  const handleToggleDesktopAlerts = async () => {
    if (desktopAlertsEnabled) {
      setDesktopAlertsEnabled(false);
      return;
    }
    if (typeof Notification === 'undefined') {
      setStatusNotice({ type: 'err', text: 'Desktop notifications are not supported in this browser.' });
      return;
    }
    if (Notification.permission === 'granted') {
      setDesktopAlertsEnabled(true);
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      setDesktopAlertsEnabled(true);
      setStatusNotice({ type: 'ok', text: 'Desktop drop notifications enabled for Tier S & Squad Wishlist hits!' });
    } else {
      setStatusNotice({ type: 'err', text: 'Browser blocked desktop notification permission.' });
    }
  };

  const handleSelectLinkedLeague = (newId: string) => {
    setLinkedLeagueId(newId);
    const opt = leagueOptions.find((l) => l.id === newId);
    if (opt) {
      setLeagueName(opt.name);
      setGame(opt.game);
    }
  };

  const handleClaimWishlistMatch = async (wish: LookingForItem) => {
    const finder = userAccount?.displayName || userAccount?.characterName || 'Squad Exile';
    const updated: LookingForItem = {
      ...wish,
      status: 'HAVE',
      fulfilledBy: finder,
      fulfilledAtIso: new Date().toISOString()
    };
    setClaimedWishIds((prev) => ({ ...prev, [wish.id]: true }));
    try {
      await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ leagueId: linkedLeagueId, item: updated })
      });
      await fetch('/api/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          leagueId: linkedLeagueId,
          event: {
            id: `feed-farm-${Date.now()}`,
            type: 'item_fulfilled',
            actorHandle: finder,
            title: `Found ${wish.itemName} for @${wish.displayName || wish.characterName}`,
            detail: `Detected automatically during ${strategyTag} farming session.`,
            createdAtIso: new Date().toISOString()
          }
        })
      });
      setStatusNotice({
        type: 'ok',
        text: `Marked "${wish.itemName}" found for @${wish.displayName || wish.characterName} and posted to the league feed!`
      });
    } catch {
      setStatusNotice({ type: 'err', text: 'Could not update league wishlist right now.' });
    }
  };

  const handleShareToFreeStash = async (item: EnrichedDropItem) => {
    const donor = userAccount?.displayName || userAccount?.characterName || 'Squad Exile';
    setSharedStashKeys((prev) => ({ ...prev, [item.key]: true }));
    try {
      await fetch('/api/stash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          leagueId: linkedLeagueId,
          drop: {
            id: `stash-${Date.now()}`,
            itemName: item.shortName,
            category: item.category === 'Uniques' ? 'Unique' : 'Other',
            donorHandle: donor,
            notes: `Dropped during ${sessionTitle} (${strategyTag})${item.chaosEach > 0 ? ` • poe.ninja ~${item.chaosEach}c (Tier ${item.tier})` : ''}`,
            status: 'AVAILABLE',
            createdAtIso: new Date().toISOString()
          }
        })
      });
      setStatusNotice({ type: 'ok', text: `Shared "${item.shortName}" to your Private League Free Stash Feed!` });
    } catch {
      setStatusNotice({ type: 'err', text: 'Could not share item to Free Stash right now.' });
    }
  };

  const handleShareRecapToFeed = async () => {
    if (enrichedDrops.length === 0) return;
    setSharingRecap(true);
    const actor = userAccount?.displayName || userAccount?.characterName || 'Exile';
    const uniqueCount = enrichedDrops.filter((d) => d.category === 'Uniques').length;
    const valStr = formatValue(totalSessionChaos, divineChaos);
    try {
      await fetch('/api/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          leagueId: linkedLeagueId,
          event: {
            id: `feed-recap-${Date.now()}`,
            type: 'loot_drop',
            actorHandle: actor,
            title: `Finished ${sessionTitle} (${strategyTag})`,
            detail: `${mapsRun} maps in ${durationMinutes}m • ${valStr} poe.ninja benchmark • ${tierCounts.S} S Tier • ${uniqueCount} Uniques • ${wishlistMatches.length} Wishlist Matches`,
            createdAtIso: new Date().toISOString()
          }
        })
      });
      setStatusNotice({ type: 'ok', text: 'Posted your farming session recap to the Private League Live Feed!' });
    } catch {
      setStatusNotice({ type: 'err', text: 'Could not post recap to league feed.' });
    }
    setSharingRecap(false);
  };

  const handleExportXlsx = () => {
    const sheets: SheetDefinition[] = [
      {
        name: 'Current Session Drops',
        headers: ['Item Name', 'Tier', 'Category', 'Bracket', 'Tab', 'Quantity', 'Unit Chaos', 'Total Chaos', 'iLvl', 'Gem Lvl', 'Gem Quality'],
        rows: enrichedDrops.map((it) => [
          it.shortName,
          it.tier,
          it.category,
          it.subCategory || '',
          it.tabName,
          it.quantity,
          it.chaosEach,
          it.totalChaos,
          it.ilvl || 0,
          it.gemLevel || 0,
          it.gemQuality || 0
        ])
      },
      {
        name: 'Saved Session History',
        headers: ['Date', 'Session Title', 'Strategy', 'League', 'Maps Run', 'Minutes', 'Deaths', 'Total Chaos', 'Stacks'],
        rows: savedSessions.map((s) => [
          new Date(s.createdAtIso).toLocaleDateString(),
          s.title,
          s.strategy || 'General',
          s.league,
          s.mapsRun,
          s.durationMinutes,
          s.deaths,
          Math.round(s.totalChaos || 0),
          s.items?.length || 0
        ])
      }
    ];
    const blob = buildXlsxBlob(sheets);
    triggerFileDownload(blob, `Exile_SSF_Farming_Log_${new Date().toISOString().slice(0, 10)}.xlsx`);
    setStatusNotice({ type: 'ok', text: 'Exported your session drops & history to Excel / Google Sheets (.xlsx)!' });
  };

  const handleDetectLeagues = async () => {
    if (!acceptedRiskDisclaimer) {
      setStatusNotice({ type: 'err', text: 'Please read and check the POESESSID security acknowledgment box first.' });
      return;
    }
    if (!accountName.trim() || !poesessid.trim()) {
      setStatusNotice({ type: 'err', text: 'Enter your PoE Account Name (including #tag) and POESESSID first.' });
      return;
    }
    setDetectingLeagues(true);
    setStatusNotice(null);
    try {
      const res = await fetch('/api/farming/detect-leagues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ accountName: accountName.trim(), realm: 'pc', poesessid: poesessid.trim() })
      });
      const data: any = await res.json();
      if (!res.ok || data.error) {
        setStatusNotice({ type: 'err', text: data.error || 'Could not detect leagues from GGG.' });
      } else {
        const list: string[] = Array.isArray(data.leagues) ? data.leagues : [];
        setDetectedLeagues(list);
        if (list.length > 0) setLeagueName(list[0]);
        setStatusNotice({ type: 'ok', text: `Detected ${list.length} active league(s). Pick one and click Load Stash Tabs.` });
      }
    } catch (err: any) {
      setStatusNotice({ type: 'err', text: err.message || 'Network error detecting leagues.' });
    }
    setDetectingLeagues(false);
  };

  const handleLoadStashTabs = async () => {
    if (!acceptedRiskDisclaimer) {
      setStatusNotice({ type: 'err', text: 'Please read and check the POESESSID security acknowledgment box first.' });
      return;
    }
    if (!accountName.trim() || !leagueName.trim() || !poesessid.trim()) {
      setStatusNotice({ type: 'err', text: 'Enter your Account Name, League Name, and POESESSID first.' });
      return;
    }
    setLoadingTabs(true);
    setStatusNotice(null);
    try {
      const res = await fetch('/api/farming/stash-tabs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          accountName: accountName.trim(),
          league: leagueName.trim(),
          realm: 'pc',
          poesessid: poesessid.trim()
        })
      });
      const data: any = await res.json();
      if (!res.ok || data.error) {
        setStatusNotice({ type: 'err', text: data.error || 'Could not load stash tabs from GGG.' });
      } else {
        const tabs: StashTabMeta[] = data.tabs || [];
        setStashTabs(tabs);
        if (tabs.length > 0 && selectedTabIndices.length === 0) setSelectedTabIndices([tabs[0].index]);
        setStatusNotice({
          type: 'ok',
          text: `Loaded ${tabs.length} stash tabs from ${data.resolvedLeague || leagueName.trim()}.`
        });
      }
    } catch (err: any) {
      setStatusNotice({ type: 'err', text: err.message || 'Network error reaching stash endpoint.' });
    }
    setLoadingTabs(false);
  };

  const handleParseDirectBrowserJson = (mode: 'before' | 'after' | 'inspect') => {
    const raw = browserJsonInput.trim();
    if (!raw) {
      setStatusNotice({ type: 'err', text: 'Paste the raw JSON copied from your Brave pathofexile.com stash tab first.' });
      return;
    }
    try {
      const { tabs, items } = parseClientGggStashJson(raw, `Browser Tab ${browserJsonTabIndex + 1}`);
      if (tabs.length > 0 && stashTabs.length === 0) setStashTabs(tabs);
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSyncedAt(nowTime);

      if (mode === 'before') {
        setBeforeSnapshot({ at: nowTime, items });
        setCheckpoints([{ at: nowTime, totalItems: 0, totalChaos: 0 }]);
        setStatusNotice({ type: 'ok', text: `Direct Browser Before Snapshot locked (${items.length} stacks).` });
      } else {
        const finalDrops = mode === 'after' && beforeSnapshot ? computeSnapshotDiff(beforeSnapshot.items, items) : items;
        setActiveDrops(finalDrops);
        const estChaos = Math.round(finalDrops.reduce((s, it) => s + lookupNinjaPrice(it, ninjaPrices) * it.quantity, 0));
        setCheckpoints((prev) => [...prev.slice(-11), { at: nowTime, totalItems: finalDrops.length, totalChaos: estChaos }]);
        setStatusNotice({
          type: 'ok',
          text: `Direct Browser JSON parsed cleanly: ${finalDrops.length} stacks (~${estChaos.toLocaleString()}c on poe.ninja)!`
        });
      }
      setBrowserJsonInput('');
      setSetupOpen(false);
    } catch {
      setStatusNotice({ type: 'err', text: 'Invalid JSON. Make sure you copied the entire JSON response from pathofexile.com.' });
    }
  };

  const toggleTabIndex = (idx: number) => {
    setSelectedTabIndices((prev) => {
      if (prev.includes(idx)) return prev.filter((x) => x !== idx);
      if (prev.length >= 15) return prev;
      return [...prev, idx];
    });
  };

  const runSnapshot = useCallback(
    async (mode: 'before' | 'after' | 'inspect') => {
      if (selectedTabIndices.length === 0) {
        setStatusNotice({ type: 'err', text: 'Select at least one Dump Tab in Setup first.' });
        return;
      }
      if (!accountName.trim() || !poesessid.trim() || !acceptedRiskDisclaimer) {
        setStatusNotice({ type: 'err', text: 'Open Setup to confirm disclaimer, Account Name, and POESESSID first.' });
        return;
      }
      setSnapshotting(true);
      setStatusNotice(null);
      try {
        const tabNames: Record<number, string> = {};
        for (const t of stashTabs) tabNames[t.index] = t.name;

        const res = await fetch('/api/farming/stash-snapshot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            accountName: accountName.trim(),
            league: leagueName.trim(),
            realm: 'pc',
            poesessid: poesessid.trim(),
            tabIndices: selectedTabIndices,
            tabNames
          })
        });
        const data: any = await res.json();
        if (!res.ok || data.error) {
          setStatusNotice({ type: 'err', text: data.error || 'Snapshot failed.' });
        } else {
          const snapItems: TrackedDropItem[] = data.items || [];
          const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          setLastSyncedAt(nowTime);

          if (mode === 'before') {
            setBeforeSnapshot({ at: nowTime, items: snapItems });
            setCheckpoints([{ at: nowTime, totalItems: 0, totalChaos: 0 }]);
            setStatusNotice({ type: 'ok', text: `Before Snapshot locked at ${nowTime} (${data.totalItemCount} items). Go blast maps!` });
            setSetupOpen(false);
          } else {
            const resultingDrops = mode === 'after' && beforeSnapshot ? computeSnapshotDiff(beforeSnapshot.items, snapItems) : snapItems;
            setActiveDrops(resultingDrops);
            const estChaos = Math.round(resultingDrops.reduce((sum, it) => sum + lookupNinjaPrice(it, ninjaPrices) * it.quantity, 0));
            const totalCount = resultingDrops.reduce((sum, x) => sum + x.quantity, 0);
            setCheckpoints((prev) => [...prev.slice(-11), { at: nowTime, totalItems: totalCount, totalChaos: estChaos }]);
            setStatusNotice({
              type: 'ok',
              text: `Synced at ${nowTime}: ${totalCount} items (~${estChaos.toLocaleString()}c on poe.ninja).`
            });
            setSetupOpen(false);
          }
        }
      } catch (err: any) {
        setStatusNotice({ type: 'err', text: err.message || 'Snapshot request failed.' });
      }
      setSnapshotting(false);
    },
    [selectedTabIndices, accountName, leagueName, poesessid, acceptedRiskDisclaimer, stashTabs, beforeSnapshot, ninjaPrices]
  );

  const runSnapshotRef = useRef(runSnapshot);
  runSnapshotRef.current = runSnapshot;
  const hasBeforeRef = useRef(Boolean(beforeSnapshot));
  hasBeforeRef.current = Boolean(beforeSnapshot);

  useEffect(() => {
    if (autoSyncMinutes <= 0) {
      setSecondsUntilSync(0);
      return;
    }
    setSecondsUntilSync(autoSyncMinutes * 60);
    const interval = setInterval(() => {
      setSecondsUntilSync((prev) => {
        if (prev <= 1) {
          runSnapshotRef.current(hasBeforeRef.current ? 'after' : 'inspect');
          return autoSyncMinutes * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [autoSyncMinutes]);

  const parseClientTxtFile = useCallback(async (file: File, silent = false) => {
    const sliceStart = Math.max(0, file.size - 2 * 1024 * 1024);
    const text = await file.slice(sliceStart).text();
    const lines = text.split(/\r?\n/);
    const cutoff = Date.now() - 1000 * 60 * 60 * 6;
    const townKeywords = /(hideout|encampment|watch|bridge|highgate|oriath|karui shores|epilogue|kingsmarch|ziggurat|clearfell encampment)/i;
    let mapCount = 0;
    let deathCount = 0;
    let firstTs = 0;
    let lastTs = 0;
    let latestZone = '';

    for (const line of lines) {
      const tsMatch = line.match(/^(\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2})/);
      if (!tsMatch) continue;
      const ts = Date.parse(tsMatch[1].replace(/\//g, '-'));
      if (!Number.isFinite(ts) || ts < cutoff) continue;
      if (/You have entered (.+)\./i.test(line)) {
        const area = line.match(/You have entered (.+)\./i)?.[1] || '';
        if (area) {
          latestZone = area;
          if (!townKeywords.test(area)) {
            mapCount += 1;
            if (!firstTs) firstTs = ts;
            lastTs = ts;
          }
        }
      } else if (/has been slain\./i.test(line)) {
        deathCount += 1;
      }
    }

    const elapsedMin = firstTs && lastTs && lastTs > firstTs ? Math.max(1, Math.round((lastTs - firstTs) / 60000)) : 60;
    setMapsRun(mapCount);
    setDurationMinutes(elapsedMin);
    setDeaths(deathCount);
    if (latestZone) setLastZoneName(latestZone);
    if (!silent) {
      setStatusNotice({
        type: 'ok',
        text: `Client.txt synced locally: ${mapCount} maps in ${elapsedMin}m (${deathCount} deaths)${latestZone ? ` • Last zone: ${latestZone}` : ''}.`
      });
      setSetupOpen(false);
    }
  }, []);

  // Poll live Client.txt handle every 15 seconds while watching
  useEffect(() => {
    if (!watchingClientTxt || !clientFileHandleRef.current) return;
    const timer = setInterval(async () => {
      try {
        const file: File = await clientFileHandleRef.current.getFile();
        await parseClientTxtFile(file, true);
      } catch {}
    }, 15000);
    return () => clearInterval(timer);
  }, [watchingClientTxt, parseClientTxtFile]);

  const handleWatchLiveClientTxt = async () => {
    const picker = (window as any).showOpenFilePicker;
    if (typeof picker !== 'function') {
      setStatusNotice({
        type: 'err',
        text: 'Your browser does not support live file handles. Use the Parse Client.txt upload button instead.'
      });
      return;
    }
    try {
      const [handle] = await picker({
        multiple: false,
        types: [{ description: 'Path of Exile Client Log', accept: { 'text/plain': ['.txt', '.log'] } }]
      });
      if (!handle) return;
      clientFileHandleRef.current = handle;
      const file: File = await handle.getFile();
      await parseClientTxtFile(file, false);
      setWatchingClientTxt(true);
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        setStatusNotice({ type: 'err', text: 'Could not attach live Client.txt watcher.' });
      }
    }
  };

  const handleClientTxtUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await parseClientTxtFile(file, false);
    } catch {
      setStatusNotice({ type: 'err', text: 'Could not read Client.txt file.' });
    }
    e.target.value = '';
  };

  const handleAddClipboardDrop = () => {
    const raw = clipboardText.trim();
    if (!raw) return;
    const parsed = parsePoeClipboardTooltip(raw);
    const name = parsed?.itemName || raw.split('\n')[0].trim();
    const base = parsed?.baseType || '';
    const rawLow = raw.toLowerCase();
    const cat =
      parsed?.rarity === 'Unique'
        ? 'Uniques'
        : parsed?.rarity === 'Currency'
        ? 'Currency'
        : parsed?.rarity === 'Divination Card'
        ? 'Div Cards'
        : parsed?.rarity === 'Gem'
        ? 'Gems'
        : 'Gear & Jewels';

    let subCategory = 'Other Equipment';
    let gemLevel = 0;
    let gemQuality = 0;
    let isVaal = false;
    let isTransfigured = false;
    let isAwakened = false;
    const corrupted = /\bcorrupted\b/i.test(raw);

    if (cat === 'Gems') {
      gemLevel = parseInt(raw.match(/Level:\s*(\d+)/i)?.[1] || '1', 10);
      gemQuality = parseInt(raw.match(/Quality:\s*\+?(\d+)%/i)?.[1] || '0', 10);
      isVaal = name.toLowerCase().startsWith('vaal ');
      isAwakened = name.toLowerCase().startsWith('awakened ');
      isTransfigured = /\bof\s+[a-z]/i.test(name) && !/(herald of|purity of|aura of|aspect of)/i.test(name);
      subCategory = isAwakened ? 'Awakened Gems' : isVaal ? 'Vaal Gems' : isTransfigured ? 'Transfigured Gems' : 'Standard Gems';
    } else if (cat === 'Gear & Jewels' || cat === 'Uniques') {
      const ar = /Armour:\s*\d+/i.test(raw);
      const ev = /Evasion Rating:\s*\d+/i.test(raw);
      const es = /Energy Shield:\s*\d+/i.test(raw);
      if (ar && ev && es) subCategory = 'Hybrid (AR/EV/ES)';
      else if (ar && es) subCategory = 'Hybrid (AR/ES)';
      else if (ar && ev) subCategory = 'Hybrid (AR/EV)';
      else if (ev && es) subCategory = 'Hybrid (EV/ES)';
      else if (ar) subCategory = 'Armour';
      else if (ev) subCategory = 'Evasion';
      else if (es) subCategory = 'Energy Shield';
      else if (/(ring|amulet|belt)/i.test(rawLow)) subCategory = 'Jewellery';
      else if (/jewel/i.test(rawLow)) subCategory = 'Jewels & Clusters';
      else if (/flask|tincture/i.test(rawLow)) subCategory = 'Flasks & Tinctures';
      if (cat === 'Uniques') subCategory = `Unique ${subCategory}`;
    } else {
      subCategory = cat;
    }

    addDropToSession({
      shortName: name,
      baseType: base,
      category: cat,
      subCategory,
      gemLevel,
      gemQuality,
      isVaal,
      isTransfigured,
      isAwakened,
      corrupted,
      quantity: 1,
      ilvl: parsed?.itemLevel || 0,
      frameType: parsed?.rarity === 'Unique' ? 3 : parsed?.rarity === 'Gem' ? 4 : 2
    });
    setClipboardText('');
  };

  const handleAddManualDrop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) return;
    addDropToSession({
      shortName: manualName.trim(),
      baseType: '',
      category: manualCategory,
      subCategory: manualCategory,
      quantity: Math.max(1, manualQty),
      ilvl: 0,
      frameType: manualCategory === 'Uniques' ? 3 : manualCategory === 'Gems' ? 4 : 5
    });
    setManualName('');
    setManualQty(1);
  };

  const addDropToSession = (input: {
    shortName: string;
    baseType: string;
    category: string;
    subCategory: string;
    gemLevel?: number;
    gemQuality?: number;
    isVaal?: boolean;
    isTransfigured?: boolean;
    isAwakened?: boolean;
    corrupted?: boolean;
    quantity: number;
    ilvl: number;
    frameType: number;
  }) => {
    const displayName =
      input.baseType && input.baseType !== input.shortName ? `${input.shortName} (${input.baseType})` : input.shortName;
    const key =
      input.category === 'Gems'
        ? `${input.category}::${displayName.toLowerCase()}::l${input.gemLevel || 0}::q${input.gemQuality || 0}`
        : `${input.category}::${input.subCategory}::${displayName.toLowerCase()}`;

    setActiveDrops((prev) => {
      const idx = prev.findIndex((x) => x.key === key);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + input.quantity };
        return copy;
      }
      return [
        {
          key,
          name: displayName,
          shortName: input.shortName,
          baseType: input.baseType,
          category: input.category,
          subCategory: input.subCategory,
          gemLevel: input.gemLevel || 0,
          gemQuality: input.gemQuality || 0,
          isVaal: Boolean(input.isVaal),
          isTransfigured: Boolean(input.isTransfigured),
          isAwakened: Boolean(input.isAwakened),
          corrupted: Boolean(input.corrupted),
          quantity: input.quantity,
          icon: '',
          frameType: input.frameType,
          ilvl: input.ilvl,
          tabName: 'Manual Log'
        },
        ...prev
      ];
    });
  };

  const handleSaveSessionToCloud = async () => {
    if (!normalizedHandle || activeDrops.length === 0) return;
    setSavingSession(true);
    const session: SavedFarmingSession = {
      id: `farm-${Date.now()}`,
      handle: normalizedHandle,
      game,
      title: sessionTitle.trim() || 'Farming Session',
      strategy: strategyTag,
      league: leagueName.trim() || (game === 'poe2' ? 'PoE 2' : 'PoE 1'),
      mapsRun,
      durationMinutes,
      deaths,
      totalChaos: totalSessionChaos,
      createdAtIso: new Date().toISOString(),
      items: activeDrops
    };
    try {
      const res = await fetch('/api/farming/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ handle: normalizedHandle, session })
      });
      if (res.ok) {
        setSavedSessions((prev) => [session, ...prev]);
        setStatusNotice({ type: 'ok', text: `Saved "${session.title}" (${strategyTag}) to your cloud history!` });
      }
    } catch {}
    setSavingSession(false);
  };

  const handleDeleteSession = async (id: string) => {
    setSavedSessions((prev) => prev.filter((s) => s.id !== id));
    try {
      await fetch(`/api/farming/sessions?id=${encodeURIComponent(id)}`, { method: 'DELETE', credentials: 'include' });
    } catch {}
  };

  // Category Breakdown for Top Right Card (3x3 compact grid)
  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, { chaos: number; ssfPts: number; count: number }>();
    for (const it of enrichedDrops) {
      const prev = map.get(it.category) || { chaos: 0, ssfPts: 0, count: 0 };
      prev.chaos += it.totalChaos;
      prev.ssfPts += it.totalSsfPoints;
      prev.count += it.quantity;
      map.set(it.category, prev);
    }
    return CATEGORY_ORDER.map((cat) => {
      const row = map.get(cat) || { chaos: 0, ssfPts: 0, count: 0 };
      const pct =
        valueSystem === 'ssf'
          ? totalSessionSsfPoints > 0
            ? Math.round((row.ssfPts / totalSessionSsfPoints) * 100)
            : 0
          : totalSessionChaos > 0
          ? Math.round((row.chaos / totalSessionChaos) * 100)
          : 0;
      return { category: cat, chaos: Math.round(row.chaos), ssfPts: Math.round(row.ssfPts), count: row.count, pct };
    }).sort((a, b) => (valueSystem === 'ssf' ? b.ssfPts - a.ssfPts : b.chaos - a.chaos) || b.count - a.count);
  }, [enrichedDrops, totalSessionChaos, totalSessionSsfPoints, valueSystem]);

  // Personal Strategy Leaderboard computed from saved sessions
  const strategyLeaderboard = useMemo(() => {
    const agg = new Map<string, { sessions: number; totalChaos: number; totalMaps: number; totalMin: number; totalUniques: number }>();
    for (const s of savedSessions) {
      const key = s.strategy || 'General Mapping';
      const cur = agg.get(key) || { sessions: 0, totalChaos: 0, totalMaps: 0, totalMin: 0, totalUniques: 0 };
      cur.sessions += 1;
      cur.totalChaos += Number(s.totalChaos || 0);
      cur.totalMaps += Number(s.mapsRun || 0);
      cur.totalMin += Math.max(1, Number(s.durationMinutes || 60));
      cur.totalUniques += (s.items || []).filter((i) => i.category === 'Uniques').length;
      agg.set(key, cur);
    }
    return Array.from(agg.entries())
      .map(([strategy, st]) => ({
        strategy,
        sessions: st.sessions,
        chaosPerHr: Math.round((st.totalChaos / st.totalMin) * 60),
        mapsPerHr: ((st.totalMaps / st.totalMin) * 60).toFixed(1),
        uniquesPerHr: ((st.totalUniques / st.totalMin) * 60).toFixed(1)
      }))
      .sort((a, b) => b.chaosPerHr - a.chaosPerHr);
  }, [savedSessions]);

  // Distinct Stash Tabs for Left Vertical Rail
  const railTabsList = useMemo(() => {
    if (stashTabs.length > 0 && selectedTabIndices.length > 0) {
      return stashTabs.filter((t) => selectedTabIndices.includes(t.index));
    }
    const names = Array.from(new Set(enrichedDrops.map((d) => d.tabName).filter(Boolean)));
    return names.map((name, idx) => ({
      index: idx,
      id: `local-${name}`,
      name,
      type: 'NormalStash',
      colour: { r: 168, g: 132, b: 64 }
    }));
  }, [stashTabs, selectedTabIndices, enrichedDrops]);

  const activeSubFilterOptions = useMemo(() => {
    if (categoryFilter === 'Gems') return GEM_SUBFILTERS;
    if (categoryFilter === 'Gear & Jewels') return EQUIPMENT_BRACKETS;
    if (categoryFilter === 'All') return [];
    const presentSubs = Array.from(
      new Set(enrichedDrops.filter((d) => d.category === categoryFilter && d.subCategory).map((d) => d.subCategory!))
    ).sort();
    return presentSubs.length > 1 ? ['All', ...presentSubs] : [];
  }, [categoryFilter, enrichedDrops]);

  const filteredAndSortedDrops = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = enrichedDrops.filter((d) => {
      if (activeTabFilter !== 'ALL' && d.tabName !== activeTabFilter) return false;
      if (categoryFilter !== 'All' && d.category !== categoryFilter) return false;
      if (tierFilter !== 'All' && d.tier !== tierFilter) return false;

      if (hideBulkNoise) {
        if (BULK_NOISE_REGEX.test(d.shortName.trim())) return false;
        if (d.tier === 'C' && d.totalChaos < 2 && d.category !== 'Uniques' && d.category !== 'Gems') return false;
      }

      if (categoryFilter === 'Gems' && subFilter !== 'All Gems') {
        if (subFilter === 'Vaal' && !d.isVaal) return false;
        if (subFilter === 'Transfigured' && !d.isTransfigured) return false;
        if (subFilter === 'Awakened' && !d.isAwakened) return false;
        if (subFilter === 'Level 20+' && (d.gemLevel || 0) < 20) return false;
        if (subFilter === 'Quality 15%+' && (d.gemQuality || 0) < 15) return false;
        if (subFilter === 'Corrupted' && !d.corrupted) return false;
      } else if (categoryFilter === 'Gear & Jewels' && subFilter !== 'All Equipment') {
        if ((d.subCategory || '') !== subFilter) return false;
      } else if (subFilter !== 'All' && subFilter !== 'All Gems' && subFilter !== 'All Equipment') {
        if ((d.subCategory || '') !== subFilter) return false;
      }

      if (q) {
        const hay = `${d.name} ${d.category} ${d.subCategory || ''} ${d.tabName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const mult = sortDir === 'desc' ? -1 : 1;
    return [...filtered].sort((a, b) => {
      if (sortField === 'total') {
        const va = valueSystem === 'ssf' ? a.totalSsfPoints : a.totalChaos;
        const vb = valueSystem === 'ssf' ? b.totalSsfPoints : b.totalChaos;
        return (va - vb) * mult || (a.quantity - b.quantity) * mult;
      }
      if (sortField === 'price') {
        const va = valueSystem === 'ssf' ? a.ssfPointsEach : a.chaosEach;
        const vb = valueSystem === 'ssf' ? b.ssfPointsEach : b.chaosEach;
        return (va - vb) * mult;
      }
      if (sortField === 'qty') return (a.quantity - b.quantity) * mult;
      if (sortField === 'tier') return (TIER_RANK[a.tier] - TIER_RANK[b.tier]) * mult || (a.totalChaos - b.totalChaos) * mult;
      if (sortField === 'gem_level') return ((a.gemLevel || 0) - (b.gemLevel || 0)) * mult;
      if (sortField === 'gem_quality') return ((a.gemQuality || 0) - (b.gemQuality || 0)) * mult;
      if (sortField === 'ilvl') return ((a.ilvl || 0) - (b.ilvl || 0)) * mult;
      if (sortField === 'tab') return a.tabName.localeCompare(b.tabName) * mult;
      return a.shortName.localeCompare(b.shortName) * mult;
    });
  }, [enrichedDrops, activeTabFilter, categoryFilter, tierFilter, hideBulkNoise, subFilter, searchQuery, sortField, sortDir]);

  const groupedByBracket = useMemo(() => {
    const map = new Map<string, EnrichedDropItem[]>();
    for (const it of filteredAndSortedDrops) {
      const bracketTitle = categoryFilter === 'All' ? `${it.category} • ${it.subCategory || 'General'}` : it.subCategory || it.category;
      const list = map.get(bracketTitle) || [];
      list.push(it);
      map.set(bracketTitle, list);
    }
    return Array.from(map.entries());
  }, [filteredAndSortedDrops, categoryFilter]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  // Direct Browser Stash JSON URL helper
  const directBrowserStashUrl = useMemo(() => {
    const acct = accountName.trim() || 'YourAccount#1234';
    const lg = leagueName.trim() || 'Ravenwatch Covens of Umbra GSF (PL87651)';
    return `https://www.pathofexile.com/character-window/get-stash-items?accountName=${encodeURIComponent(acct)}&realm=pc&league=${encodeURIComponent(lg)}&tabs=1&tabIndex=${browserJsonTabIndex}`;
  }, [accountName, leagueName, browserJsonTabIndex]);

  const heroChaos = wealthMode === 'hourly' ? chaosPerHour : totalSessionChaos;

  return (
    <div className="w-full space-y-4 pb-16 font-sans text-slate-200">
      {/* Compact Command Header */}
      <header className="rounded-2xl border border-slate-800 bg-[#0d111a] px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-lg sm:text-xl font-poe font-bold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-400" />
            <span>Farming & Drops</span>
          </h1>

          {/* Game Switcher */}
          <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setGame('poe1')}
              className={`px-2.5 py-1 rounded-md flex items-center gap-1 cursor-pointer ${
                game === 'poe1' ? 'bg-indigo-600/30 text-white border border-indigo-400/50' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Flame className="w-3 h-3 text-amber-400" /> PoE 1
            </button>
            <button
              type="button"
              onClick={() => setGame('poe2')}
              className={`px-2.5 py-1 rounded-md flex items-center gap-1 cursor-pointer ${
                game === 'poe2' ? 'bg-indigo-600/30 text-white border border-indigo-400/50' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Hammer className="w-3 h-3 text-cyan-400" /> PoE 2
            </button>
          </div>

          {/* Linked Private League */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-xs">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <select
              value={linkedLeagueId}
              onChange={(e) => handleSelectLinkedLeague(e.target.value)}
              className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer max-w-[200px] sm:max-w-xs truncate"
            >
              {leagueOptions.map((lg) => (
                <option key={lg.id} value={lg.id} className="bg-slate-950">
                  {lg.name}
                </option>
              ))}
            </select>
          </div>

          {/* poe.ninja Reference Pill */}
          <div className="hidden md:flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-[11px] font-mono text-amber-300">
            <TrendingUp className="w-3 h-3" />
            <select
              value={ninjaLeagueParam}
              onChange={(e) => setNinjaLeagueParam(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="auto" className="bg-slate-950">{ninjaResolvedLeague || 'Challenge League'}</option>
              <option value="Standard" className="bg-slate-950">Standard</option>
              <option value="Hardcore" className="bg-slate-950">Hardcore</option>
            </select>
            <span className="text-slate-500">•</span>
            <span>1d = {divineChaos}c</span>
            <button
              type="button"
              disabled={loadingNinja}
              onClick={() => loadNinjaPrices(ninjaLeagueParam, true)}
              title="Refresh poe.ninja prices"
              className="ml-1 text-slate-400 hover:text-white cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${loadingNinja ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Dual Value System Toggle (SSF Utility vs poe.ninja) */}
          <div className="flex bg-slate-950 p-0.5 rounded-xl border border-amber-500/30 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setValueSystem('ssf')}
              title="Score drops by SSF crafting, Atlas fuel, and Wishlist utility"
              className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                valueSystem === 'ssf' ? 'bg-amber-500/25 text-amber-200 border border-amber-400/50' : 'text-slate-400 hover:text-white'
              }`}
            >
              SSF Utility
            </button>
            <button
              type="button"
              onClick={() => setValueSystem('ninja')}
              title="Score drops by live poe.ninja Chaos & Divine prices"
              className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                valueSystem === 'ninja' ? 'bg-indigo-600/30 text-white border border-indigo-400/50' : 'text-slate-400 hover:text-white'
              }`}
            >
              poe.ninja
            </button>
          </div>

          <button
            type="button"
            onClick={handleToggleDesktopAlerts}
            title={desktopAlertsEnabled ? 'Desktop notifications active for Tier S & Wishlist hits' : 'Enable browser desktop notifications'}
            className={`p-2 rounded-xl border text-xs cursor-pointer ${
              desktopAlertsEnabled
                ? 'bg-amber-500/20 border-amber-400/50 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            {desktopAlertsEnabled ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => setChimeEnabled((v) => !v)}
            title={chimeEnabled ? 'Chime enabled for S Tier & Wishlist drops' : 'Chime muted'}
            className={`p-2 rounded-xl border text-xs cursor-pointer ${
              chimeEnabled
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            {chimeEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {normalizedHandle && (
            <button
              type="button"
              onClick={() => saveStashToCloud(false)}
              title="Your synced stash is automatically saved to Cloudflare D1 for your account"
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                cloudSaveState === 'saved'
                  ? 'bg-sky-500/15 border-sky-400/50 text-sky-200'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
              }`}
            >
              <Cloud className={`w-3.5 h-3.5 ${cloudSaveState === 'saving' ? 'animate-pulse text-amber-300' : 'text-sky-400'}`} />
              <span className="hidden sm:inline">
                {cloudSaveState === 'saving' ? 'Saving...' : cloudSaveState === 'saved' ? 'Cloud Saved' : 'Save Cloud'}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportXlsx}
            title="Export drops and session history to Excel / Google Sheets (.xlsx)"
            className="px-2.5 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export .xlsx</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const next = !focusMode;
              setFocusMode(next);
              if (next) setSetupOpen(false);
            }}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
              focusMode
                ? 'bg-amber-500/20 border-amber-400/60 text-amber-200'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200'
            }`}
          >
            {focusMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{focusMode ? 'Exit Focus Mode' : 'Focus Mode'}</span>
          </button>
        </div>
      </header>

      {/* Slim Focus Status Bar when Focus Mode is active */}
      {focusMode && (
        <div className="px-4 py-2 rounded-xl bg-slate-900/90 border border-indigo-500/30 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-3 text-slate-300">
            <span>
              Auto Pull:{' '}
              <strong className={autoSyncMinutes > 0 ? 'text-emerald-400' : 'text-slate-400'}>
                {autoSyncMinutes > 0 ? formatCountdown(secondsUntilSync) : 'Off'}
              </strong>
            </span>
            <span>•</span>
            <span>
              Tabs: <strong className="text-white">{selectedTabIndices.length || railTabsList.length}</strong>
            </span>
            <span>•</span>
            <span>
              Strategy: <strong className="text-amber-300">{strategyTag}</strong>
            </span>
            <span>•</span>
            <span>
              Pace: <strong className="text-emerald-300">{mapsPerHour} maps/hr</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setFocusMode(false);
              setSetupOpen(true);
            }}
            className="text-indigo-300 hover:text-white underline cursor-pointer"
          >
            Expand Setup
          </button>
        </div>
      )}

      {/* Status Notice */}
      {statusNotice && (
        <div
          className={`px-4 py-2.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
            statusNotice.type === 'ok'
              ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-200'
              : 'bg-rose-500/10 border-rose-500/40 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusNotice.type === 'ok' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
            <span>{statusNotice.text}</span>
          </div>
          <button type="button" onClick={() => setStatusNotice(null)} className="text-[11px] font-mono opacity-75 hover:opacity-100 cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Squad Wishlist Match Banner */}
      {wishlistMatches.length > 0 && (
        <div className="p-3.5 rounded-2xl border border-amber-400/50 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-indigo-500/10 flex flex-wrap items-center gap-2.5 shadow-lg">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-amber-300 mr-1">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Wishlist Match ({wishlistMatches.length}):</span>
          </div>
          {wishlistMatches.map((m, idx) => {
            const isClaimed = !!claimedWishIds[m.wish.id];
            return (
              <div key={idx} className="px-3 py-1.5 rounded-xl bg-slate-950/90 border border-amber-400/40 text-xs text-white flex items-center gap-2">
                <span className="font-bold text-orange-300">{m.drop.shortName}</span>
                <span className="text-slate-400">for</span>
                <span className="font-mono font-bold text-emerald-300">@{m.wish.displayName || m.wish.characterName}</span>
                <button
                  type="button"
                  disabled={isClaimed}
                  onClick={() => handleClaimWishlistMatch(m.wish)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer ${
                    isClaimed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {isClaimed ? 'Claimed' : 'Mark Found'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* TOP 2 CARD HERO ROW (WealthyExile Glanceable DNA) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Card: Wealth & Loot Over Time Sparkline */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-800 bg-[#0d111a] p-4 sm:p-5 flex flex-col justify-between space-y-3 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-bold text-white">Wealth & Pace</span>
              <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setWealthMode('total')}
                  className={`px-2.5 py-0.5 rounded-md cursor-pointer ${
                    wealthMode === 'total' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Total
                </button>
                <button
                  type="button"
                  onClick={() => setWealthMode('hourly')}
                  className={`px-2.5 py-0.5 rounded-md cursor-pointer ${
                    wealthMode === 'hourly' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Hourly
                </button>
              </div>

              <select
                value={strategyTag}
                onChange={(e) => setStrategyTag(e.target.value)}
                title="Atlas / Farming Strategy Tag"
                className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-amber-300 font-semibold focus:outline-none cursor-pointer"
              >
                {STRATEGY_PRESETS.map((st) => (
                  <option key={st} value={st} className="bg-slate-950">
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-right">
              <div className="text-2xl sm:text-3xl font-mono font-bold text-amber-300 leading-none">
                {valueSystem === 'ssf'
                  ? formatSsfPoints(wealthMode === 'hourly' ? ssfPointsPerHour : totalSessionSsfPoints)
                  : formatValue(heroChaos, divineChaos)}
                {wealthMode === 'hourly' && <span className="text-xs text-slate-400 font-normal">/hr</span>}
              </div>
              <div className="text-[10px] font-mono text-slate-400 mt-1">
                {mapsRun} maps ({mapsPerHour}/hr) • {tierCounts.S} S Tier • {tierCounts.A} A Tier
                {watchingClientTxt && (
                  <span className="ml-2 px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/40 text-emerald-300">
                    Live Log{lastZoneName ? `: ${lastZoneName}` : ''}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* SVG Area Sparkline Chart */}
          <div className="h-24 w-full rounded-xl bg-slate-950/75 border border-slate-800/80 px-3 py-2 flex flex-col justify-between">
            <LootSparkline checkpoints={checkpoints} fallbackChaos={totalSessionChaos} divineChaos={divineChaos} />
          </div>
        </div>

        {/* Right Card: Compact Category Breakdown (3x3 Grid) */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-800 bg-[#0d111a] p-4 sm:p-5 flex flex-col justify-between space-y-3 shadow-lg">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-bold text-white">Breakdown</span>
            <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setBreakdownMode('divines')}
                className={`px-2.5 py-0.5 rounded-md cursor-pointer ${
                  breakdownMode === 'divines' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Divines
              </button>
              <button
                type="button"
                onClick={() => setBreakdownMode('percent')}
                className={`px-2.5 py-0.5 rounded-md cursor-pointer ${
                  breakdownMode === 'percent' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Percentage
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {categoryBreakdown.map((row) => {
              const isSelected = categoryFilter === row.category;
              return (
                <button
                  key={row.category}
                  type="button"
                  onClick={() => {
                    const next = isSelected ? 'All' : row.category;
                    setCategoryFilter(next);
                    setSubFilter(next === 'Gems' ? 'All Gems' : next === 'Gear & Jewels' ? 'All Equipment' : 'All');
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600/25 border-indigo-400/60 text-white'
                      : 'bg-slate-950/75 border-slate-800/80 hover:border-slate-600 text-slate-200'
                  }`}
                >
                  <div className="text-[10px] font-mono text-slate-400 truncate">{row.category}</div>
                  <div className="text-sm font-mono font-bold text-amber-300 mt-0.5">
                    {breakdownMode === 'percent'
                      ? `${row.pct}%`
                      : valueSystem === 'ssf'
                      ? formatSsfPoints(row.ssfPts)
                      : row.chaos > 0
                      ? formatValue(row.chaos, divineChaos)
                      : `${row.count}x`}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Collapsible Setup & Data Ingestion Drawer */}
      {setupOpen && !focusMode && (
        <section className="rounded-2xl border border-indigo-500/30 bg-[#0d111a] p-4 sm:p-5 space-y-4 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSetupTab('api')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                  setupTab === 'api'
                    ? 'bg-indigo-600/30 border border-indigo-400/60 text-white'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>1. Live Stash API (POESESSID)</span>
              </button>
              <button
                type="button"
                onClick={() => setSetupTab('json')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                  setupTab === 'json'
                    ? 'bg-indigo-600/30 border border-indigo-400/60 text-white'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                <span>2. Direct Browser JSON (No POESESSID)</span>
              </button>
              <button
                type="button"
                onClick={() => setSetupTab('manual')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                  setupTab === 'manual'
                    ? 'bg-indigo-600/30 border border-indigo-400/60 text-white'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Upload className="w-3.5 h-3.5 text-sky-400" />
                <span>3. Client.txt, Clipboard & Save Session</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setSetupOpen(false)}
              className="text-xs font-mono text-slate-400 hover:text-white cursor-pointer"
            >
              Hide Setup ▲
            </button>
          </div>

          {/* Setup Tab 1: POESESSID Live API */}
          {setupTab === 'api' && (
            <div className="space-y-3.5">
              <div className="p-3 rounded-xl bg-rose-950/35 border border-rose-500/45 space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <p className="text-slate-200 leading-relaxed">
                    <strong className="text-rose-300">POESESSID Security Disclaimer:</strong> Your POESESSID grants live session access to <code>pathofexile.com</code>. Never share it with anyone. Using it here is strictly optional at your own discretion while GGG OAuth registrations are paused. Exile SSF never stores it in any database, KV cache, or log.
                  </p>
                </div>
                <label className="flex items-center gap-2 text-rose-200 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptedRiskDisclaimer}
                    onChange={(e) => setAcceptedRiskDisclaimer(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                  <span>I understand the risks of POESESSID and choose to proceed at my own discretion.</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 text-xs">
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="PoE Account (e.g. Leuie#0626)"
                  className="sm:col-span-3 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
                <input
                  type="text"
                  value={leagueName}
                  onChange={(e) => setLeagueName(e.target.value)}
                  placeholder="League Name"
                  className="sm:col-span-4 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
                <input
                  type="password"
                  value={poesessid}
                  onChange={(e) => setPoesessid(e.target.value)}
                  placeholder="POESESSID (Memory Only)"
                  className="sm:col-span-3 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-amber-300 font-mono"
                />
                <div className="sm:col-span-2 flex gap-1.5">
                  <button
                    type="button"
                    disabled={detectingLeagues || !acceptedRiskDisclaimer}
                    onClick={handleDetectLeagues}
                    title="Auto detect active GGG leagues"
                    className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold cursor-pointer disabled:opacity-40"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={loadingTabs || !acceptedRiskDisclaimer}
                    onClick={handleLoadStashTabs}
                    className="flex-1 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer disabled:opacity-40"
                  >
                    {loadingTabs ? '...' : 'Load Tabs'}
                  </button>
                </div>
              </div>

              {detectedLeagues.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Detected:</span>
                  {detectedLeagues.map((lg) => (
                    <button
                      key={lg}
                      type="button"
                      onClick={() => setLeagueName(lg)}
                      className={`px-2 py-1 rounded-lg text-xs border cursor-pointer ${
                        leagueName === lg ? 'bg-amber-500/20 border-amber-400/60 text-amber-200' : 'bg-slate-950 border-slate-800 text-slate-300'
                      }`}
                    >
                      {lg}
                    </button>
                  ))}
                </div>
              )}

              {stashTabs.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-mono uppercase text-slate-400">
                    Select Dump & Specialty Tabs ({selectedTabIndices.length}/15 selected):
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                    {stashTabs.map((tab) => {
                      const active = selectedTabIndices.includes(tab.index);
                      const dotColor = `rgb(${tab.colour.r}, ${tab.colour.g}, ${tab.colour.b})`;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => toggleTabIndex(tab.index)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 border cursor-pointer ${
                            active ? 'bg-indigo-600/30 border-indigo-400/70 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'
                          }`}
                        >
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />
                          <span>{tab.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Setup Tab 2: Direct Browser JSON Fallback (Zero POESESSID) */}
          {setupTab === 'json' && (
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  <strong>Zero Credential Fallback:</strong> Open your own <code>pathofexile.com</code> stash JSON URL in Brave (using your existing Brave login), press <strong>Ctrl+A</strong> then <strong>Ctrl+C</strong>, and paste it below. Works even if Cloudflare blocks edge requests!
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Account (e.g. Leuie#0626)"
                  className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white w-48"
                />
                <input
                  type="number"
                  min={0}
                  value={browserJsonTabIndex}
                  onChange={(e) => setBrowserJsonTabIndex(Math.max(0, Number(e.target.value) || 0))}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono w-20"
                  title="Stash Tab Index (0 = first tab)"
                />
                <a
                  href={directBrowserStashUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5"
                >
                  <span>Open Stash JSON in Brave</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <textarea
                rows={3}
                value={browserJsonInput}
                onChange={(e) => setBrowserJsonInput(e.target.value)}
                placeholder='Paste raw JSON from pathofexile.com here (starts with {"numTabs":...})...'
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-amber-200 placeholder-slate-500"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleParseDirectBrowserJson('before')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer"
                >
                  1. Lock as Before Snapshot
                </button>
                <button
                  type="button"
                  disabled={!beforeSnapshot}
                  onClick={() => handleParseDirectBrowserJson('after')}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer disabled:opacity-40"
                >
                  2. Diff vs Before
                </button>
                <button
                  type="button"
                  onClick={() => handleParseDirectBrowserJson('inspect')}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-200 font-bold cursor-pointer"
                >
                  Parse & View Now
                </button>
              </div>
            </div>
          )}

          {/* Setup Tab 3: Client.txt, Clipboard & Save Session */}
          {setupTab === 'manual' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono uppercase text-[10px] text-emerald-400 font-bold">Client.txt Speed & Session Info</span>
                  <div className="flex items-center gap-1.5">
                    {watchingClientTxt ? (
                      <button
                        type="button"
                        onClick={() => {
                          setWatchingClientTxt(false);
                          clientFileHandleRef.current = null;
                        }}
                        className="px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-200 font-bold cursor-pointer"
                      >
                        Stop Live Watch
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleWatchLiveClientTxt}
                        title="Pick Client.txt once in Brave to auto update Maps/hr and Zones every 15 seconds"
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Timer className="w-3 h-3" /> Watch Live Client.txt
                      </button>
                    )}
                    <label className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold flex items-center gap-1 cursor-pointer">
                      <Upload className="w-3 h-3" /> One Time Read
                      <input type="file" accept=".txt,.log" onChange={handleClientTxtUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                {/* Steam & Standalone Client.txt Folder Path Helper */}
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-slate-400">
                    <FolderOpen className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>Where is Client.txt? Copy a folder path, paste into the File Picker address bar, and press Enter:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {(game === 'poe2'
                      ? [
                          { id: 'p2-steam', label: 'Steam (PoE 2)', path: '%ProgramFiles(x86)%\\Steam\\steamapps\\common\\Path of Exile 2\\logs\\' },
                          { id: 'p2-ggg', label: 'Standalone (PoE 2)', path: '%ProgramFiles(x86)%\\Grinding Gear Games\\Path of Exile 2\\logs\\' }
                        ]
                      : [
                          { id: 'p1-steam', label: 'Steam (PoE 1)', path: '%ProgramFiles(x86)%\\Steam\\steamapps\\common\\Path of Exile\\logs\\' },
                          { id: 'p1-ggg', label: 'Standalone (PoE 1)', path: '%ProgramFiles(x86)%\\Grinding Gear Games\\Path of Exile\\logs\\' }
                        ]
                    ).map((entry) => {
                      const isCopied = copiedPathId === entry.id;
                      return (
                        <button
                          key={entry.id}
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(entry.path);
                            setCopiedPathId(entry.id);
                            setTimeout(() => setCopiedPathId(null), 2000);
                          }}
                          title={`Copy ${entry.label} folder path`}
                          className={`px-2.5 py-1.5 rounded-lg border text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                            isCopied
                              ? 'bg-emerald-500/15 border-emerald-400/50 text-emerald-200'
                              : 'bg-slate-900/90 border-slate-800 hover:border-amber-400/50 text-slate-300'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="text-[10px] font-bold text-amber-300">{entry.label}</div>
                            <code className="block text-[10px] font-mono text-slate-400 truncate">{entry.path}</code>
                          </div>
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <input
                    type="text"
                    value={sessionTitle}
                    onChange={(e) => setSessionTitle(e.target.value)}
                    placeholder="Session Title"
                    className="col-span-2 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  />
                  <input
                    type="number"
                    min={0}
                    value={mapsRun}
                    onChange={(e) => setMapsRun(Math.max(0, Number(e.target.value) || 0))}
                    placeholder="Maps"
                    className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono"
                    title="Maps Run"
                  />
                  <input
                    type="number"
                    min={1}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Math.max(1, Number(e.target.value) || 1))}
                    placeholder="Mins"
                    className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono"
                    title="Duration Minutes"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={savingSession || activeDrops.length === 0 || !normalizedHandle}
                    onClick={handleSaveSessionToCloud}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{savingSession ? 'Saving...' : 'Save Session'}</span>
                  </button>
                  <button
                    type="button"
                    disabled={sharingRecap || activeDrops.length === 0}
                    onClick={handleShareRecapToFeed}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{sharingRecap ? 'Posting...' : 'Share Recap to League Feed'}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={clipboardText}
                    onChange={(e) => setClipboardText(e.target.value)}
                    onPaste={(e) => {
                      const pasted = e.clipboardData.getData('text');
                      if (pasted.includes('Rarity:')) {
                        e.preventDefault();
                        setClipboardText(pasted);
                      }
                    }}
                    placeholder="Paste Ctrl+C item tooltip..."
                    className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                  />
                  <button type="button" onClick={handleAddClipboardDrop} className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold cursor-pointer">
                    Parse
                  </button>
                </div>
                <form onSubmit={handleAddManualDrop} className="grid grid-cols-12 gap-2">
                  <input
                    type="text"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="Manual drop (e.g. Divine Orb)..."
                    className="col-span-6 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                  <select
                    value={manualCategory}
                    onChange={(e) => setManualCategory(e.target.value)}
                    className="col-span-3 px-2 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                  >
                    {CATEGORY_ORDER.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={manualQty}
                    onChange={(e) => setManualQty(Math.max(1, Number(e.target.value) || 1))}
                    className="col-span-1 px-1 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-center font-mono text-white"
                  />
                  <button type="submit" className="col-span-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center cursor-pointer">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>
          )}
        </section>
      )}

      {/* MAIN WORKSPACE SPLIT: LEFT STASH RAIL + RIGHT DENSE SORTABLE TABLE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Vertical Stash Rail (Tabs | Snapshots | Strategies) */}
        <aside className="lg:col-span-3 xl:col-span-2 rounded-2xl border border-slate-800 bg-[#0d111a] p-3 space-y-3 shadow-lg">
          <div className="grid grid-cols-3 bg-slate-950 p-0.5 rounded-xl border border-slate-800 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setRailTab('tabs')}
              className={`py-1.5 rounded-lg cursor-pointer ${railTab === 'tabs' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Tabs
            </button>
            <button
              type="button"
              onClick={() => setRailTab('snapshots')}
              className={`py-1.5 rounded-lg cursor-pointer ${railTab === 'snapshots' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              History
            </button>
            <button
              type="button"
              onClick={() => setRailTab('strategies')}
              className={`py-1.5 rounded-lg cursor-pointer ${railTab === 'strategies' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Stats
            </button>
          </div>

          {railTab === 'tabs' && (
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => setActiveTabFilter('ALL')}
                className={`w-full px-3 py-2 rounded-xl text-left text-xs font-bold flex items-center justify-between border transition-all cursor-pointer ${
                  activeTabFilter === 'ALL'
                    ? 'bg-amber-500/20 border-amber-400/60 text-amber-200'
                    : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-600'
                }`}
              >
                <span>All Synced Tabs</span>
                <span className="font-mono text-[10px]">{enrichedDrops.length}</span>
              </button>

              <div className="space-y-1 max-h-[420px] overflow-y-auto pr-0.5">
                {railTabsList.map((tab) => {
                  const isActive = activeTabFilter === tab.name;
                  const tabBg = `rgba(${tab.colour.r}, ${tab.colour.g}, ${tab.colour.b}, ${isActive ? 0.35 : 0.14})`;
                  const tabBorder = `rgba(${tab.colour.r}, ${tab.colour.g}, ${tab.colour.b}, ${isActive ? 0.85 : 0.35})`;
                  const tabItemsCount = enrichedDrops.filter((d) => d.tabName === tab.name).length;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTabFilter(isActive ? 'ALL' : tab.name)}
                      style={{ backgroundColor: tabBg, borderColor: tabBorder }}
                      className="w-full px-3 py-2 rounded-xl text-left text-xs font-bold text-white border flex items-center justify-between gap-2 transition-all hover:brightness-125 cursor-pointer"
                    >
                      <span className="truncate">{tab.name}</span>
                      <span className="text-[10px] font-mono opacity-80">{tabItemsCount}</span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => {
                  setFocusMode(false);
                  setSetupOpen((v) => !v);
                }}
                className="w-full pt-2 text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Pencil className="w-3 h-3" />
                <span>{setupOpen ? 'Hide Setup' : 'Edit synced tabs'}</span>
              </button>
            </div>
          )}

          {railTab === 'snapshots' && (
            <div className="space-y-1.5 max-h-[440px] overflow-y-auto">
              {savedSessions.length === 0 ? (
                <div className="py-6 text-center text-[11px] text-slate-400">
                  No saved sessions yet. Save one from Setup!
                </div>
              ) : (
                savedSessions.map((s) => (
                  <div key={s.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-400/50 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSessionTitle(s.title);
                        if (s.strategy) setStrategyTag(s.strategy);
                        setMapsRun(s.mapsRun);
                        setDurationMinutes(s.durationMinutes);
                        setDeaths(s.deaths);
                        setActiveDrops(s.items || []);
                      }}
                      className="text-left min-w-0 flex-1 cursor-pointer"
                    >
                      <div className="text-xs font-bold text-white truncate">{s.title}</div>
                      <div className="text-[10px] font-mono text-amber-300">
                        {formatValue(s.totalChaos || 0, divineChaos)} • {s.mapsRun}m
                      </div>
                    </button>
                    <button type="button" onClick={() => handleDeleteSession(s.id)} className="text-slate-500 hover:text-rose-400 cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {railTab === 'strategies' && (
            <div className="space-y-2 max-h-[440px] overflow-y-auto">
              <div className="text-[10px] font-mono uppercase text-amber-400 font-bold">My Best Strategies</div>
              {strategyLeaderboard.length === 0 ? (
                <div className="py-6 text-center text-[11px] text-slate-400">
                  Save sessions with Strategy tags to compare Div/hr & Maps/hr here.
                </div>
              ) : (
                strategyLeaderboard.map((st) => (
                  <div key={st.strategy} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="text-xs font-bold text-white truncate">{st.strategy}</div>
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-amber-300">{formatValue(st.chaosPerHr, divineChaos)}/hr</span>
                      <span className="text-emerald-300">{st.mapsPerHr} maps/hr</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      {st.uniquesPerHr} Uniques/hr • {st.sessions} run(s)
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </aside>

        {/* Right Main Loot Panel */}
        <section className="lg:col-span-9 xl:col-span-10 rounded-2xl border border-slate-800 bg-[#0d111a] overflow-hidden shadow-xl">
          {/* Toolbar (WealthyExile style + SSF/GSF Controls) */}
          <div className="p-3.5 border-b border-slate-800 bg-slate-900/70 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-48 sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search items, brackets..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-400"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowFiltersBar((v) => !v)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                  showFiltersBar || tierFilter !== 'All' || categoryFilter !== 'All'
                    ? 'bg-indigo-600/25 border-indigo-400/60 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-600'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                <span>Filters</span>
              </button>

              <button
                type="button"
                onClick={() => setHideBulkNoise((v) => !v)}
                title="Hide Scrolls, Transmutes, and sub 2c common clutter"
                className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                  hideBulkNoise
                    ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Hide Noise</span>
              </button>

              {/* Table vs Bracket Cards Toggle */}
              <div className="flex bg-slate-950 p-0.5 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  title="Dense Sortable Table"
                  className={`p-1.5 rounded-lg cursor-pointer ${viewMode === 'table' ? 'bg-slate-800 text-amber-300' : 'text-slate-400 hover:text-white'}`}
                >
                  <TableIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  title="Bracketed Card View"
                  className={`p-1.5 rounded-lg cursor-pointer ${viewMode === 'cards' ? 'bg-slate-800 text-amber-300' : 'text-slate-400 hover:text-white'}`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Right Snapshot & 30m Auto Pull Controls */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {lastSyncedAt && (
                <span className="text-[11px] font-mono text-slate-400 hidden xl:inline">Synced {lastSyncedAt}</span>
              )}

              <button
                type="button"
                disabled={snapshotting}
                onClick={() => runSnapshot('before')}
                title="Lock starting Before Snapshot"
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                <Camera className="w-3.5 h-3.5 text-sky-400" />
                <span>Before</span>
              </button>

              <button
                type="button"
                disabled={snapshotting}
                onClick={() => runSnapshot(beforeSnapshot ? 'after' : 'inspect')}
                title={beforeSnapshot ? 'Diff new drops since Before Snapshot' : 'Scan selected dump tabs now'}
                className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                {beforeSnapshot ? <GitCompare className="w-3.5 h-3.5" /> : <RefreshCw className={`w-3.5 h-3.5 ${snapshotting ? 'animate-spin' : ''}`} />}
                <span>{beforeSnapshot ? 'Diff Now' : 'Sync'}</span>
              </button>

              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950 border border-indigo-500/35">
                <Timer className={`w-3.5 h-3.5 ${autoSyncMinutes > 0 ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
                <select
                  value={autoSyncMinutes}
                  onChange={(e) => setAutoSyncMinutes(Number(e.target.value))}
                  className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
                >
                  <option value={0} className="bg-slate-950">Auto: Off</option>
                  <option value={15} className="bg-slate-950">Auto: 15m</option>
                  <option value={30} className="bg-slate-950">Auto: 30m</option>
                  <option value={60} className="bg-slate-950">Auto: 60m</option>
                </select>
                {autoSyncMinutes > 0 && (
                  <span className="font-mono text-[10px] font-bold text-emerald-300">{formatCountdown(secondsUntilSync)}</span>
                )}
              </div>

              {activeDrops.length > 0 && (
                <button
                  type="button"
                  onClick={handleResetSession}
                  title="Clear current session drops and start fresh"
                  className="p-1.5 rounded-xl bg-slate-900 hover:bg-rose-500/20 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Expandable Advanced Filter Bar (Tiers + Categories + Gem/Equipment Brackets) */}
          {showFiltersBar && (
            <div className="p-3.5 border-b border-slate-800 bg-slate-950/75 space-y-2.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-mono uppercase text-slate-400 mr-1">Tier:</span>
                {(['All', 'S', 'A', 'B', 'C'] as const).map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setTierFilter(tier)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border cursor-pointer ${
                      tierFilter === tier
                        ? tier === 'All'
                          ? 'bg-indigo-600/30 border-indigo-400/60 text-white'
                          : TIER_STYLES[tier]
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {tier === 'All' ? 'All Tiers' : `Tier ${tier} (${tierCounts[tier]})`}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-mono uppercase text-slate-400 mr-1">Category:</span>
                {['All', ...CATEGORY_ORDER].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setCategoryFilter(cat);
                      setSubFilter(cat === 'Gems' ? 'All Gems' : cat === 'Gear & Jewels' ? 'All Equipment' : 'All');
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border cursor-pointer ${
                      categoryFilter === cat
                        ? 'bg-indigo-600/30 border-indigo-400/60 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {activeSubFilterOptions.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-mono uppercase text-slate-400 mr-1">
                    {categoryFilter === 'Gems' ? 'Gem Filter:' : 'Bracket:'}
                  </span>
                  {activeSubFilterOptions.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setSubFilter(opt)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border cursor-pointer ${
                        subFilter === opt
                          ? 'bg-amber-500/20 border-amber-400/60 text-amber-200'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* MAIN CONTENT: DENSE SORTABLE TABLE OR BRACKETED CARDS */}
          {filteredAndSortedDrops.length === 0 ? (
            <div className="py-16 px-6 text-center space-y-2">
              <Layers className="w-8 h-8 text-slate-600 mx-auto" />
              <div className="text-sm font-bold text-slate-300">No Drops Loaded Yet</div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Connect your Dump Tabs via Setup (Live API or Direct Browser JSON), parse a Ctrl+C item, or load a saved session from History on the left rail.
              </p>
            </div>
          ) : viewMode === 'table' ? (
            <div className="overflow-x-auto max-h-[640px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 z-10 bg-slate-900/95 border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                  <tr>
                    <th className="py-2.5 px-3.5 cursor-pointer hover:text-white" onClick={() => toggleSort('name')}>
                      Name {sortField === 'name' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                    </th>
                    <th className="py-2.5 px-2.5 cursor-pointer hover:text-white" onClick={() => toggleSort('tier')}>
                      Tier {sortField === 'tier' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                    </th>
                    <th className="py-2.5 px-3 cursor-pointer hover:text-white" onClick={() => toggleSort('tab')}>
                      Tab / Bracket {sortField === 'tab' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                    </th>
                    <th className="py-2.5 px-3 text-right cursor-pointer hover:text-white" onClick={() => toggleSort('qty')}>
                      Qty {sortField === 'qty' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                    </th>
                    <th className="py-2.5 px-3 text-right cursor-pointer hover:text-white" onClick={() => toggleSort('price')}>
                      Price {sortField === 'price' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                    </th>
                    <th className="py-2.5 px-3.5 text-right cursor-pointer hover:text-white" onClick={() => toggleSort('total')}>
                      Total {sortField === 'total' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                    </th>
                    <th className="py-2.5 px-3 text-right">Squad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {filteredAndSortedDrops.map((it) => {
                    const isShared = !!sharedStashKeys[it.key];
                    return (
                      <tr key={it.key} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2 px-3.5">
                          <div className="flex items-center gap-2.5">
                            {it.icon ? (
                              <img src={it.icon} alt={it.shortName} className="w-6 h-6 object-contain shrink-0" />
                            ) : (
                              <div className="w-6 h-6 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-[9px] font-mono text-amber-300 shrink-0">
                                {it.category.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                              <span
                                className={`font-semibold truncate max-w-[260px] ${
                                  it.category === 'Uniques' ? 'text-orange-300' : it.category === 'Gems' ? 'text-teal-300' : 'text-slate-100'
                                }`}
                              >
                                {it.shortName}
                                {it.category === 'Gems' && (it.gemLevel || 0) > 0 ? ` (${it.gemLevel}/${it.gemQuality || 0})` : ''}
                              </span>
                              {it.isVaal && <span className="px-1 py-0.2 rounded text-[9px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40">Vaal</span>}
                              {it.isTransfigured && <span className="px-1 py-0.2 rounded text-[9px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/40">Transfig</span>}
                              {it.isAwakened && <span className="px-1 py-0.2 rounded text-[9px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">Awakened</span>}
                              {it.corrupted && <span className="px-1 py-0.2 rounded text-[9px] font-mono bg-rose-950/60 text-rose-400">Corr</span>}
                            </div>
                          </div>
                        </td>
                        <td className="py-2 px-2.5">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${TIER_STYLES[it.tier]}`}>
                            {it.tier}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-400">
                          <span className="text-slate-200 font-medium">{it.tabName}</span>
                          {it.subCategory && (
                            <span className="ml-1.5 text-[10px] font-mono text-slate-500">({it.subCategory})</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-200">{it.quantity.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right font-mono text-slate-400">
                          {valueSystem === 'ssf'
                            ? formatSsfPoints(it.ssfPointsEach)
                            : it.chaosEach > 0
                            ? formatValue(it.chaosEach, divineChaos)
                            : '0c'}
                        </td>
                        <td className="py-2 px-3.5 text-right font-mono font-bold text-amber-300">
                          {valueSystem === 'ssf'
                            ? formatSsfPoints(it.totalSsfPoints)
                            : it.totalChaos > 0
                            ? formatValue(it.totalChaos, divineChaos)
                            : '0c'}
                        </td>
                        <td className="py-2 px-3 text-right">
                          {it.category === 'Uniques' && (
                            <button
                              type="button"
                              disabled={isShared}
                              onClick={() => handleShareToFreeStash(it)}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer ${
                                isShared ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 hover:bg-indigo-600 text-slate-200'
                              }`}
                            >
                              <Share2 className="w-2.5 h-2.5" />
                              <span>{isShared ? 'Shared' : 'Stash'}</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 space-y-5 max-h-[640px] overflow-y-auto">
              {groupedByBracket.map(([bracketName, items]) => {
                const bracketChaos = Math.round(items.reduce((s, x) => s + x.totalChaos, 0));
                return (
                  <div key={bracketName} className="space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                      <span className="text-xs font-mono font-bold uppercase text-amber-300">{bracketName}</span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {formatValue(bracketChaos, divineChaos)} • {items.length} stacks
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                      {items.map((it) => (
                        <div key={it.key} className="p-2.5 rounded-xl bg-slate-950/85 border border-slate-800 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${TIER_STYLES[it.tier]}`}>
                              {it.tier}
                            </span>
                            <span className="text-xs font-bold text-white truncate">{it.shortName}</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-mono text-xs shrink-0">
                            {it.totalChaos > 0 && <span className="text-amber-300 font-bold">{formatValue(it.totalChaos, divineChaos)}</span>}
                            <span className="text-slate-400">×{it.quantity}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

const LootSparkline: React.FC<{ checkpoints: SyncCheckpoint[]; fallbackChaos: number; divineChaos: number }> = ({
  checkpoints,
  fallbackChaos,
  divineChaos
}) => {
  const points =
    checkpoints.length >= 2
      ? checkpoints
      : checkpoints.length === 1
      ? [
          { at: 'Start', totalItems: 0, totalChaos: 0 },
          checkpoints[0]
        ]
      : [
          { at: 'Start', totalItems: 0, totalChaos: 0 },
          { at: 'Now', totalItems: 0, totalChaos: fallbackChaos }
        ];

  const maxVal = Math.max(10, ...points.map((p) => p.totalChaos));
  const width = 400;
  const height = 56;
  const coords = points.map((p, idx) => {
    const x = points.length === 1 ? width / 2 : (idx / (points.length - 1)) * (width - 16) + 8;
    const y = height - 8 - (p.totalChaos / maxVal) * (height - 16);
    return { x, y, ...p };
  });

  const linePath = coords.map((c, idx) => `${idx === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${height} L ${coords[0].x.toFixed(1)} ${height} Z`;

  return (
    <>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-14 overflow-visible" preserveAspectRatio="none">
        <defs>
          <linearGradient id="lootAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#lootAreaGrad)" />
        <path d={linePath} fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r="3" fill="#fef08a" stroke="#b45309" strokeWidth="1" />
        ))}
      </svg>
      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
        <span>{points[0]?.at}</span>
        <span>Peak: {formatValue(maxVal, divineChaos)}</span>
        <span>{points[points.length - 1]?.at}</span>
      </div>
    </>
  );
};
