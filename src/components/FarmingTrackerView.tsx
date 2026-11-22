import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Sparkles,
  Trophy,
  Flame,
  Hammer,
  RefreshCw,
  Camera,
  GitCompare,
  Package,
  Clock,
  Upload,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  AlertTriangle,
  Save,
  History,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Layers,
  ArrowUpDown,
  TrendingUp,
  Timer,
  Share2,
  Users
} from 'lucide-react';
import { parsePoeClipboardTooltip } from '../utils/poeItemParser';
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
  tier: ItemTier;
}

interface SavedFarmingSession {
  id: string;
  handle: string;
  game: 'poe1' | 'poe2';
  title: string;
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

type SortMode = 'value_desc' | 'bracket' | 'qty_desc' | 'gem_level' | 'gem_quality' | 'ilvl_desc' | 'alpha';

const PREFS_STORAGE_KEY = 'exile_ssf_farming_prefs_v1';

const DEFAULT_LEAGUES: LeagueOption[] = [
  { id: 'poe1-330-umbra', name: 'Ravenwatch Covens of Umbra GSF (PL87651)', game: 'poe1' },
  { id: 'poe2-ea-ancients', name: 'PoE 2 Early Access Private League', game: 'poe2' }
];

const CATEGORY_ORDER = [
  'Uniques',
  'Currency',
  'Scarabs & Fragments',
  'Div Cards',
  'Essences & Crafting',
  'Maps & League Keys',
  'Gems',
  'Gear & Jewels'
];

const GEM_SUBFILTERS = [
  'All Gems',
  'Vaal',
  'Transfigured',
  'Awakened',
  'Level 20+',
  'Quality 15%+',
  'Corrupted'
];

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

const CATEGORY_COLORS: Record<string, string> = {
  Uniques: 'from-orange-500 to-amber-400',
  Currency: 'from-amber-400 to-yellow-300',
  'Scarabs & Fragments': 'from-indigo-500 to-sky-400',
  'Div Cards': 'from-cyan-400 to-teal-300',
  'Essences & Crafting': 'from-purple-500 to-fuchsia-400',
  'Maps & League Keys': 'from-emerald-500 to-lime-400',
  Gems: 'from-teal-500 to-emerald-400',
  'Gear & Jewels': 'from-slate-400 to-slate-300'
};

const TIER_STYLES: Record<ItemTier, string> = {
  S: 'bg-amber-500/25 border-amber-400/70 text-amber-200 shadow-sm shadow-amber-500/20',
  A: 'bg-purple-500/20 border-purple-400/60 text-purple-200',
  B: 'bg-sky-500/20 border-sky-400/50 text-sky-200',
  C: 'bg-slate-800/80 border-slate-700 text-slate-400'
};

function computeSnapshotDiff(before: TrackedDropItem[], after: TrackedDropItem[]): TrackedDropItem[] {
  const beforeMap = new Map<string, number>();
  for (const it of before) {
    beforeMap.set(it.key, (beforeMap.get(it.key) || 0) + it.quantity);
  }
  const diff: TrackedDropItem[] = [];
  for (const it of after) {
    const prevQty = beforeMap.get(it.key) || 0;
    const gained = it.quantity - prevQty;
    if (gained > 0) {
      diff.push({ ...it, quantity: gained });
    }
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
    // Also check nearest quality bucket (20% or 0%)
    const q20 = qual >= 18 ? prices[`gem::${shortLow}::l${lvl}::q20::c${corr}`] : 0;
    if (q20) return q20;
    if (prices[shortLow]) return prices[shortLow];
    return 0;
  }

  if (prices[shortLow]) return prices[shortLow];
  if (baseLow && prices[baseLow]) return prices[baseLow];
  return 0;
}

function resolveTier(chaosEach: number, totalChaos: number, divineChaos: number): ItemTier {
  const sThreshold = Math.max(100, divineChaos * 0.9);
  if (chaosEach >= sThreshold || totalChaos >= sThreshold) return 'S';
  if (chaosEach >= 30 || totalChaos >= 50) return 'A';
  if (chaosEach >= 5 || totalChaos >= 12) return 'B';
  return 'C';
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
  // Load safe saved preferences (never stores POESESSID)
  const savedPrefs = useMemo(() => {
    try {
      const raw = localStorage.getItem(PREFS_STORAGE_KEY);
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

  // poe.ninja Pricing State
  const [ninjaLeagueParam, setNinjaLeagueParam] = useState<string>('auto');
  const [ninjaResolvedLeague, setNinjaResolvedLeague] = useState<string>('');
  const [divineChaos, setDivineChaos] = useState<number>(150);
  const [ninjaPrices, setNinjaPrices] = useState<Record<string, number>>({ 'chaos orb': 1 });
  const [loadingNinja, setLoadingNinja] = useState<boolean>(false);

  // Stash API Connection State (POESESSID stays in browser memory only)
  const [accountName, setAccountName] = useState<string>(savedPrefs.accountName || userAccount?.poeAccountName || '');
  const [leagueName, setLeagueName] = useState<string>(
    savedPrefs.leagueName || 'Ravenwatch Covens of Umbra GSF (PL87651)'
  );
  const [detectedLeagues, setDetectedLeagues] = useState<string[]>([]);
  const [detectingLeagues, setDetectingLeagues] = useState<boolean>(false);
  const [poesessid, setPoesessid] = useState<string>('');
  const [acceptedRiskDisclaimer, setAcceptedRiskDisclaimer] = useState<boolean>(false);
  const [stashTabs, setStashTabs] = useState<StashTabMeta[]>([]);
  const [selectedTabIndices, setSelectedTabIndices] = useState<number[]>(
    Array.isArray(savedPrefs.selectedTabIndices) ? savedPrefs.selectedTabIndices : []
  );
  const [loadingTabs, setLoadingTabs] = useState<boolean>(false);
  const [snapshotting, setSnapshotting] = useState<boolean>(false);
  const [statusNotice, setStatusNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Auto Sync Timer (0 = Off, 15, 30, 60 minutes)
  const [autoSyncMinutes, setAutoSyncMinutes] = useState<number>(0);
  const [secondsUntilSync, setSecondsUntilSync] = useState<number>(0);
  const [checkpoints, setCheckpoints] = useState<SyncCheckpoint[]>([]);

  // Active Session State
  const [sessionTitle, setSessionTitle] = useState<string>('T16 Mapping & Dump Session');
  const [mapsRun, setMapsRun] = useState<number>(0);
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [deaths, setDeaths] = useState<number>(0);
  const [beforeSnapshot, setBeforeSnapshot] = useState<{ at: string; items: TrackedDropItem[] } | null>(null);
  const [activeDrops, setActiveDrops] = useState<TrackedDropItem[]>([]);

  // Manual / Clipboard Drop Input
  const [clipboardText, setClipboardText] = useState<string>('');
  const [manualName, setManualName] = useState<string>('');
  const [manualCategory, setManualCategory] = useState<string>('Uniques');
  const [manualQty, setManualQty] = useState<number>(1);

  // Advanced Loot Filtering, Tiers, Sub-Brackets & Sorting
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [subFilter, setSubFilter] = useState<string>('All');
  const [tierFilter, setTierFilter] = useState<'All' | ItemTier>('All');
  const [sortMode, setSortMode] = useState<SortMode>('value_desc');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Saved Sessions History
  const [savedSessions, setSavedSessions] = useState<SavedFarmingSession[]>([]);
  const [savingSession, setSavingSession] = useState<boolean>(false);

  const normalizedHandle = (userAccount?.displayName || '').trim().replace(/^@/, '').toLowerCase();

  useEffect(() => {
    document.title = 'Farming & Drop Tracker | Exile SSF';
  }, []);

  // Persist non-sensitive preferences locally
  useEffect(() => {
    try {
      localStorage.setItem(
        PREFS_STORAGE_KEY,
        JSON.stringify({
          accountName,
          leagueName,
          linkedLeagueId,
          selectedTabIndices
        })
      );
    } catch {}
  }, [accountName, leagueName, linkedLeagueId, selectedTabIndices]);

  // Load live poe.ninja prices
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

  // Load linked Private League wishlists, custom leagues, and user's saved sessions
  useEffect(() => {
    let cancelled = false;
    const loadContext = async () => {
      try {
        const dataRes = await fetch(`/api/data?leagueId=${encodeURIComponent(linkedLeagueId)}`, {
          credentials: 'include'
        });
        if (dataRes.ok && !cancelled) {
          const data: any = await dataRes.json();
          if (Array.isArray(data?.lookingForItems)) {
            setWishlistItems(data.lookingForItems);
          }
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
          const sessRes = await fetch(`/api/farming/sessions?handle=${encodeURIComponent(normalizedHandle)}`, {
            credentials: 'include'
          });
          if (sessRes.ok && !cancelled) {
            const sessData: any = await sessRes.json();
            if (Array.isArray(sessData?.sessions)) {
              setSavedSessions(sessData.sessions);
            }
          }
        } catch {}
      }
    };
    loadContext();
    return () => {
      cancelled = true;
    };
  }, [linkedLeagueId, normalizedHandle]);

  // Enrich drops with live poe.ninja Chaos value & S/A/B/C tier
  const enrichedDrops = useMemo<EnrichedDropItem[]>(() => {
    return activeDrops.map((it) => {
      const chaosEach = lookupNinjaPrice(it, ninjaPrices);
      const totalChaos = Math.round(chaosEach * it.quantity * 10) / 10;
      const tier = resolveTier(chaosEach, totalChaos, divineChaos);
      return { ...it, chaosEach, totalChaos, tier };
    });
  }, [activeDrops, ninjaPrices, divineChaos]);

  const totalSessionChaos = useMemo(
    () => Math.round(enrichedDrops.reduce((sum, it) => sum + it.totalChaos, 0) * 10) / 10,
    [enrichedDrops]
  );
  const totalSessionDivines = divineChaos > 0 ? totalSessionChaos / divineChaos : 0;
  const chaosPerHour = durationMinutes > 0 ? Math.round((totalSessionChaos / durationMinutes) * 60) : 0;
  const divPerHour = divineChaos > 0 ? (chaosPerHour / divineChaos).toFixed(2) : '0.00';

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
            detail: 'Detected automatically via Farming & Drop Tracker dump tab scan.',
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
            notes: `Dropped during ${sessionTitle}${item.chaosEach > 0 ? ` (poe.ninja ~${item.chaosEach}c, Tier ${item.tier})` : ''}`,
            status: 'AVAILABLE',
            createdAtIso: new Date().toISOString()
          }
        })
      });
      setStatusNotice({
        type: 'ok',
        text: `Shared "${item.shortName}" to your Private League Free Stash Feed!`
      });
    } catch {
      setStatusNotice({ type: 'err', text: 'Could not share item to Free Stash right now.' });
    }
  };

  const handleSelectCategory = (cat: string) => {
    setCategoryFilter(cat);
    if (cat === 'Gems') {
      setSubFilter('All Gems');
    } else if (cat === 'Gear & Jewels') {
      setSubFilter('All Equipment');
    } else {
      setSubFilter('All');
    }
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
        body: JSON.stringify({
          accountName: accountName.trim(),
          realm: 'pc',
          poesessid: poesessid.trim()
        })
      });
      const data: any = await res.json();
      if (!res.ok || data.error) {
        setStatusNotice({ type: 'err', text: data.error || 'Could not detect leagues from GGG.' });
      } else {
        const list: string[] = Array.isArray(data.leagues) ? data.leagues : [];
        setDetectedLeagues(list);
        if (list.length > 0) setLeagueName(list[0]);
        setStatusNotice({
          type: 'ok',
          text: `Detected ${list.length} active league(s) across ${data.characterCount} characters! Pick one and click Load Stash Tabs.`
        });
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
        if (tabs.length > 0 && selectedTabIndices.length === 0) {
          setSelectedTabIndices([tabs[0].index]);
        }
        setStatusNotice({
          type: 'ok',
          text: `Loaded ${tabs.length} stash tabs from ${data.resolvedLeague || leagueName.trim()}. Pick your Dump Tabs below.`
        });
      }
    } catch (err: any) {
      setStatusNotice({ type: 'err', text: err.message || 'Network error reaching stash endpoint.' });
    }
    setLoadingTabs(false);
  };

  const toggleTabIndex = (idx: number) => {
    setSelectedTabIndices((prev) => {
      if (prev.includes(idx)) return prev.filter((x) => x !== idx);
      if (prev.length >= 8) return prev;
      return [...prev, idx];
    });
  };

  const runSnapshot = useCallback(
    async (mode: 'before' | 'after' | 'inspect') => {
      if (selectedTabIndices.length === 0) {
        setStatusNotice({ type: 'err', text: 'Select at least one Dump Tab first.' });
        return;
      }
      if (!accountName.trim() || !poesessid.trim() || !acceptedRiskDisclaimer) {
        setStatusNotice({ type: 'err', text: 'Confirm disclaimer, Account Name, and POESESSID first.' });
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

          if (mode === 'before') {
            setBeforeSnapshot({ at: nowTime, items: snapItems });
            setCheckpoints([{ at: nowTime, totalItems: 0, totalChaos: 0 }]);
            setStatusNotice({
              type: 'ok',
              text: `Before Snapshot captured (${data.totalItemCount} total items across ${selectedTabIndices.length} tabs). Go blast maps and dump loot!`
            });
          } else {
            const resultingDrops = mode === 'after' && beforeSnapshot ? computeSnapshotDiff(beforeSnapshot.items, snapItems) : snapItems;
            setActiveDrops(resultingDrops);
            const estChaos = Math.round(
              resultingDrops.reduce((sum, it) => sum + lookupNinjaPrice(it, ninjaPrices) * it.quantity, 0)
            );
            const totalCount = resultingDrops.reduce((sum, x) => sum + x.quantity, 0);
            setCheckpoints((prev) => [...prev.slice(-11), { at: nowTime, totalItems: totalCount, totalChaos: estChaos }]);
            setStatusNotice({
              type: 'ok',
              text:
                mode === 'after' && beforeSnapshot
                  ? `Session Diff updated at ${nowTime}: +${totalCount} drops (~${estChaos.toLocaleString()}c on poe.ninja)!`
                  : `Dump Tab Scan complete at ${nowTime}: ${totalCount} items (~${estChaos.toLocaleString()}c on poe.ninja).`
            });
          }
        }
      } catch (err: any) {
        setStatusNotice({ type: 'err', text: err.message || 'Snapshot request failed.' });
      }
      setSnapshotting(false);
    },
    [selectedTabIndices, accountName, leagueName, poesessid, acceptedRiskDisclaimer, stashTabs, beforeSnapshot, ninjaPrices]
  );

  // Keep latest runSnapshot ref for the interval timer
  const runSnapshotRef = useRef(runSnapshot);
  runSnapshotRef.current = runSnapshot;
  const hasBeforeRef = useRef(Boolean(beforeSnapshot));
  hasBeforeRef.current = Boolean(beforeSnapshot);

  // Auto Sync Countdown Timer (15m / 30m / 60m)
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

  const handleClientTxtUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const sliceStart = Math.max(0, file.size - 2 * 1024 * 1024);
      const text = await file.slice(sliceStart).text();
      const lines = text.split(/\r?\n/);

      const cutoff = Date.now() - 1000 * 60 * 60 * 6;
      const townKeywords = /(hideout|encampment|watch|bridge|highgate|oriath|karui shores|epilogue|kingsmarch|ziggurat|clearfell encampment)/i;
      let mapCount = 0;
      let deathCount = 0;
      let firstTs = 0;
      let lastTs = 0;

      for (const line of lines) {
        const tsMatch = line.match(/^(\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2})/);
        if (!tsMatch) continue;
        const ts = Date.parse(tsMatch[1].replace(/\//g, '-'));
        if (!Number.isFinite(ts) || ts < cutoff) continue;

        if (/You have entered (.+)\./i.test(line)) {
          const areaMatch = line.match(/You have entered (.+)\./i);
          const area = areaMatch ? areaMatch[1] : '';
          if (area && !townKeywords.test(area)) {
            mapCount += 1;
            if (!firstTs) firstTs = ts;
            lastTs = ts;
          }
        } else if (/has been slain\./i.test(line)) {
          deathCount += 1;
        }
      }

      const elapsedMin = firstTs && lastTs && lastTs > firstTs ? Math.max(1, Math.round((lastTs - firstTs) / 60000)) : durationMinutes;
      setMapsRun(mapCount);
      setDurationMinutes(elapsedMin);
      setDeaths(deathCount);
      setStatusNotice({
        type: 'ok',
        text: `Parsed Client.txt locally: ${mapCount} maps/zones entered over ${elapsedMin} minutes (${deathCount} deaths).`
      });
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
      const lvlMatch = raw.match(/Level:\s*(\d+)/i);
      const qualMatch = raw.match(/Quality:\s*\+?(\d+)%/i);
      gemLevel = lvlMatch ? parseInt(lvlMatch[1], 10) : 1;
      gemQuality = qualMatch ? parseInt(qualMatch[1], 10) : 0;
      isVaal = name.toLowerCase().startsWith('vaal ');
      isAwakened = name.toLowerCase().startsWith('awakened ');
      isTransfigured = /\bof\s+[a-z]/i.test(name) && !/(herald of|purity of|aura of|aspect of)/i.test(name);
      subCategory = isAwakened
        ? 'Awakened Gems'
        : isVaal
        ? 'Vaal Gems'
        : isTransfigured
        ? 'Transfigured Gems'
        : gemLevel >= 20 || gemQuality >= 15
        ? 'High Level / Quality Gems'
        : 'Standard Gems';
    } else if (cat === 'Gear & Jewels' || cat === 'Uniques') {
      const hasAr = /Armour:\s*\d+/i.test(raw);
      const hasEv = /Evasion Rating:\s*\d+/i.test(raw);
      const hasEs = /Energy Shield:\s*\d+/i.test(raw);
      const hasWard = /Ward:\s*\d+/i.test(raw);
      if (hasWard) subCategory = 'Ward';
      else if (hasAr && hasEv && hasEs) subCategory = 'Hybrid (AR/EV/ES)';
      else if (hasAr && hasEs) subCategory = 'Hybrid (AR/ES)';
      else if (hasAr && hasEv) subCategory = 'Hybrid (AR/EV)';
      else if (hasEv && hasEs) subCategory = 'Hybrid (EV/ES)';
      else if (hasAr) subCategory = 'Armour';
      else if (hasEv) subCategory = 'Evasion';
      else if (hasEs) subCategory = 'Energy Shield';
      else if (/(ring|amulet|belt)/i.test(rawLow)) subCategory = 'Jewellery';
      else if (/jewel/i.test(rawLow)) subCategory = 'Jewels & Clusters';
      else if (/flask|tincture/i.test(rawLow)) subCategory = 'Flasks & Tinctures';
      else if (/(physical damage:|elemental damage:|attacks per second:)/i.test(rawLow)) subCategory = 'Weapons';
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
      input.baseType && input.baseType !== input.shortName
        ? `${input.shortName} (${input.baseType})`
        : input.shortName;
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
        setStatusNotice({ type: 'ok', text: `Saved "${session.title}" to your cloud farming history!` });
      }
    } catch {}
    setSavingSession(false);
  };

  const handleDeleteSession = async (id: string) => {
    setSavedSessions((prev) => prev.filter((s) => s.id !== id));
    try {
      await fetch(`/api/farming/sessions?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include'
      });
    } catch {}
  };

  const categoryBreakdown = useMemo(() => {
    const counts = new Map<string, { count: number; chaos: number }>();
    let totalChaosAll = 0;
    let totalCountAll = 0;
    for (const it of enrichedDrops) {
      const prev = counts.get(it.category) || { count: 0, chaos: 0 };
      prev.count += it.quantity;
      prev.chaos += it.totalChaos;
      counts.set(it.category, prev);
      totalChaosAll += it.totalChaos;
      totalCountAll += it.quantity;
    }
    return CATEGORY_ORDER.map((cat) => {
      const row = counts.get(cat) || { count: 0, chaos: 0 };
      const pct =
        totalChaosAll > 0
          ? Math.round((row.chaos / totalChaosAll) * 100)
          : totalCountAll > 0
          ? Math.round((row.count / totalCountAll) * 100)
          : 0;
      return {
        category: cat,
        count: row.count,
        chaos: Math.round(row.chaos),
        pct
      };
    }).filter((c) => c.count > 0);
  }, [enrichedDrops]);

  const topDropsShowcase = useMemo(
    () =>
      [...enrichedDrops]
        .filter((d) => d.tier === 'S' || d.tier === 'A' || d.category === 'Uniques')
        .sort((a, b) => b.totalChaos - a.totalChaos || b.chaosEach - a.chaosEach)
        .slice(0, 16),
    [enrichedDrops]
  );

  const activeSubFilterOptions = useMemo(() => {
    if (categoryFilter === 'Gems') return GEM_SUBFILTERS;
    if (categoryFilter === 'Gear & Jewels') return EQUIPMENT_BRACKETS;
    if (categoryFilter === 'All') return [];
    const presentSubs = Array.from(
      new Set(
        enrichedDrops
          .filter((d) => d.category === categoryFilter && d.subCategory)
          .map((d) => d.subCategory!)
      )
    ).sort();
    return presentSubs.length > 1 ? ['All', ...presentSubs] : [];
  }, [categoryFilter, enrichedDrops]);

  const filteredAndSortedDrops = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = enrichedDrops.filter((d) => {
      if (categoryFilter !== 'All' && d.category !== categoryFilter) return false;
      if (tierFilter !== 'All' && d.tier !== tierFilter) return false;

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

    return [...filtered].sort((a, b) => {
      if (sortMode === 'value_desc') return b.totalChaos - a.totalChaos || b.chaosEach - a.chaosEach || b.quantity - a.quantity;
      if (sortMode === 'qty_desc') return b.quantity - a.quantity || b.totalChaos - a.totalChaos;
      if (sortMode === 'alpha') return a.shortName.localeCompare(b.shortName);
      if (sortMode === 'ilvl_desc') return (b.ilvl || 0) - (a.ilvl || 0) || b.totalChaos - a.totalChaos;
      if (sortMode === 'gem_level') {
        return (b.gemLevel || 0) - (a.gemLevel || 0) || (b.gemQuality || 0) - (a.gemQuality || 0) || b.totalChaos - a.totalChaos;
      }
      if (sortMode === 'gem_quality') {
        return (b.gemQuality || 0) - (a.gemQuality || 0) || (b.gemLevel || 0) - (a.gemLevel || 0) || b.totalChaos - a.totalChaos;
      }
      const catA = CATEGORY_ORDER.indexOf(a.category);
      const catB = CATEGORY_ORDER.indexOf(b.category);
      if (catA !== catB) return catA - catB;
      const subCmp = (a.subCategory || '').localeCompare(b.subCategory || '');
      if (subCmp !== 0) return subCmp;
      return b.totalChaos - a.totalChaos || b.quantity - a.quantity;
    });
  }, [enrichedDrops, categoryFilter, tierFilter, subFilter, sortMode, searchQuery]);

  const groupedByBracket = useMemo(() => {
    const map = new Map<string, EnrichedDropItem[]>();
    for (const it of filteredAndSortedDrops) {
      const bracketTitle =
        categoryFilter === 'All'
          ? `${it.category} • ${it.subCategory || 'General'}`
          : it.subCategory || it.category;
      const list = map.get(bracketTitle) || [];
      list.push(it);
      map.set(bracketTitle, list);
    }
    return Array.from(map.entries());
  }, [filteredAndSortedDrops, categoryFilter]);

  const totalItemsDropped = enrichedDrops.reduce((s, x) => s + x.quantity, 0);
  const mapsPerHour = durationMinutes > 0 && mapsRun > 0 ? ((mapsRun / durationMinutes) * 60).toFixed(1) : '0.0';

  return (
    <div className="w-full space-y-6 pb-20 font-sans text-slate-200">
      {/* Header Bar */}
      <header className="rounded-2xl border border-slate-800 bg-gradient-to-r from-[#0e1320] via-indigo-950/35 to-[#0e1320] p-5 space-y-4 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-poe font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-400" />
                <span>Farming & Drop Tracker</span>
              </h1>
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-200 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                poe.ninja S/A/B/C Tiering
              </span>
              {ninjaResolvedLeague && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300">
                  {ninjaResolvedLeague}: 1 Div = {divineChaos}c
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 max-w-2xl">
              Auto pull your dump tabs every 30 minutes, tier every drop by live poe.ninja value (S, A, B, C), sort Gems and Equipment into defense brackets, and match drops directly to your Private League wishlists.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
            {/* Game Switcher */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-indigo-500/25 text-xs font-bold">
              <button
                type="button"
                onClick={() => setGame('poe1')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  game === 'poe1'
                    ? 'bg-indigo-600/30 text-white border border-indigo-400/60 shadow-sm'
                    : 'text-slate-400 border border-transparent hover:text-white'
                }`}
              >
                <Flame className={`w-3.5 h-3.5 ${game === 'poe1' ? 'text-amber-300' : 'text-slate-500'}`} />
                <span>PoE 1</span>
              </button>
              <button
                type="button"
                onClick={() => setGame('poe2')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  game === 'poe2'
                    ? 'bg-indigo-600/30 text-white border border-indigo-400/60 shadow-sm'
                    : 'text-slate-400 border border-transparent hover:text-white'
                }`}
              >
                <Hammer className={`w-3.5 h-3.5 ${game === 'poe2' ? 'text-amber-300' : 'text-slate-500'}`} />
                <span>PoE 2</span>
              </button>
            </div>
          </div>
        </div>

        {/* Linked Private League + poe.ninja Economy Reference Strip */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              Linked Private League:
            </span>
            <select
              value={linkedLeagueId}
              onChange={(e) => handleSelectLinkedLeague(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-semibold focus:outline-none focus:border-indigo-400 cursor-pointer"
            >
              {leagueOptions.map((lg) => (
                <option key={lg.id} value={lg.id}>
                  {lg.name}
                </option>
              ))}
            </select>
            <span className="text-[11px] text-emerald-400 font-mono">
              ({wishlistItems.filter((w) => w.status !== 'HAVE').length} open squad wishlists synced)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono uppercase text-slate-400">poe.ninja Reference:</span>
            <select
              value={ninjaLeagueParam}
              onChange={(e) => setNinjaLeagueParam(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-amber-200 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="auto">Current Challenge League</option>
              <option value="Standard">Standard</option>
              <option value="Hardcore">Hardcore</option>
            </select>
            <button
              type="button"
              disabled={loadingNinja}
              onClick={() => loadNinjaPrices(ninjaLeagueParam, true)}
              title="Refresh poe.ninja pricing dictionary"
              className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-mono text-[11px] flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 text-amber-400 ${loadingNinja ? 'animate-spin' : ''}`} />
              <span>Sync Prices</span>
            </button>
          </div>
        </div>
      </header>

      {/* Status Notice Banner */}
      {statusNotice && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
            statusNotice.type === 'ok'
              ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-200'
              : 'bg-rose-500/10 border-rose-500/40 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusNotice.type === 'ok' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{statusNotice.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusNotice(null)}
            className="text-[11px] font-mono opacity-75 hover:opacity-100 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Squad Wishlist Match Alert with Direct Claim & Notify Action */}
      {wishlistMatches.length > 0 && (
        <div className="p-4 rounded-2xl border border-amber-400/50 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-indigo-500/10 space-y-2.5 shadow-lg">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-amber-300">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Squad Wishlist Drop Match Detected ({wishlistMatches.length})</span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {wishlistMatches.map((m, idx) => {
              const isClaimed = !!claimedWishIds[m.wish.id];
              return (
                <div
                  key={idx}
                  className="px-3.5 py-2 rounded-xl bg-slate-950/90 border border-amber-400/40 text-xs text-white flex flex-wrap items-center gap-2.5"
                >
                  <span className="font-bold text-orange-300">{m.drop.shortName}</span>
                  <span className="text-slate-400">needed by</span>
                  <span className="font-mono font-bold text-emerald-300">
                    @{m.wish.displayName || m.wish.characterName}
                  </span>
                  {m.wish.bountyOffer && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-amber-200 font-mono text-[10px]">
                      Bounty: {m.wish.bountyOffer}
                    </span>
                  )}
                  <button
                    type="button"
                    disabled={isClaimed}
                    onClick={() => handleClaimWishlistMatch(m.wish)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                      isClaimed
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    {isClaimed ? 'Claimed & Notified' : 'Mark Found & Notify'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top Row: Stash Dump Tab Scanner (PoE 1) + Client.txt & Clipboard Logger */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <section className="xl:col-span-7 rounded-2xl border border-indigo-500/30 bg-slate-900/85 p-5 space-y-4 shadow-lg">
          <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 text-[11px] font-mono font-bold uppercase text-indigo-300">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>{game === 'poe1' ? 'PoE 1 Dump Tab Snapshot & Auto Pull Engine' : 'PoE 2 Stash API Status'}</span>
              </div>
              <h2 className="text-base font-poe font-bold text-white">
                {game === 'poe1' ? 'Live Stash Tab Scanner & 30m Auto Sync' : 'PoE 2 Automated Stash Sync (Awaiting GGG OAuth)'}
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              Stateless Proxy
            </span>
          </div>

          {game === 'poe2' ? (
            <div className="p-4 rounded-xl bg-slate-950/75 border border-slate-800 text-xs text-slate-300 leading-relaxed space-y-2">
              <p>
                Grinding Gear Games has not opened the public Stash Tab API for Path of Exile 2 yet. Once GGG enables OAuth Stash access for PoE 2, this Dump Tab Diff & Auto Pull engine will unlock automatically.
              </p>
              <p className="text-amber-300 font-semibold">
                In the meantime, use the Client.txt Map Speed Parser and Clipboard Drop Logger on the right to track your PoE 2 Waystone sessions with zero credentials!
              </p>
            </div>
          ) : (
            <>
              {/* Explicit POESESSID Risk Warning & Disclaimer */}
              <div className="p-3.5 rounded-xl bg-rose-950/35 border border-rose-500/45 space-y-2.5 text-xs">
                <div className="flex items-start gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-mono font-bold uppercase text-[11px] text-rose-300">
                      Important Security Warning & Disclaimer (POESESSID)
                    </div>
                    <p className="text-slate-200 leading-relaxed">
                      <strong>What is POESESSID?</strong> It is your live authenticated session cookie for <code>pathofexile.com</code>. Anyone who possesses an active POESESSID can access your website account (forum posts, messages, and private stash tabs). <strong>Never share it in Discord, streams, or screenshots.</strong>
                    </p>
                    <p className="text-slate-300 leading-relaxed">
                      <strong>Disclaimer:</strong> Grinding Gear Games currently has new OAuth application registrations paused. Providing your POESESSID here is <strong>100% optional and strictly at your own discretion</strong>. Exile SSF never stores your POESESSID in any database, KV cache, or server log: it stays in your browser memory only and is discarded immediately after each read. Sign out and back into <code>pathofexile.com</code> anytime to rotate your session cookie.
                    </p>
                  </div>
                </div>
                <label className="flex items-center gap-2 pt-1.5 border-t border-rose-500/25 text-rose-200 font-semibold cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={acceptedRiskDisclaimer}
                    onChange={(e) => setAcceptedRiskDisclaimer(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                  <span>I understand the risks of using POESESSID and choose to proceed at my own discretion.</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <label className="space-y-1 block">
                  <span className="text-[10px] font-mono uppercase text-slate-400">PoE Account Name</span>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="AccountName#1234"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
                  />
                </label>

                <label className="space-y-1 block">
                  <span className="text-[10px] font-mono uppercase text-slate-400">League Name</span>
                  <input
                    type="text"
                    value={leagueName}
                    onChange={(e) => setLeagueName(e.target.value)}
                    placeholder="Ravenwatch Covens of Umbra GSF (PL87651)"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
                  />
                </label>

                <label className="space-y-1 block">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Personal POESESSID (Memory Only)</span>
                  <input
                    type="password"
                    value={poesessid}
                    onChange={(e) => setPoesessid(e.target.value)}
                    placeholder="32 char session id..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-amber-300 font-mono placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </label>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={detectingLeagues || !acceptedRiskDisclaimer}
                  onClick={handleDetectLeagues}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  <Search className="w-3.5 h-3.5 text-amber-400" />
                  <span>{detectingLeagues ? 'Detecting...' : 'Detect My Leagues'}</span>
                </button>
                <button
                  type="button"
                  disabled={loadingTabs || !acceptedRiskDisclaimer}
                  onClick={handleLoadStashTabs}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingTabs ? 'animate-spin' : ''}`} />
                  <span>{loadingTabs ? 'Loading Tabs...' : 'Load Stash Tabs'}</span>
                </button>
              </div>

              {detectedLeagues.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Detected Leagues:</span>
                  {detectedLeagues.map((lg) => (
                    <button
                      key={lg}
                      type="button"
                      onClick={() => setLeagueName(lg)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border cursor-pointer ${
                        leagueName === lg
                          ? 'bg-amber-500/20 border-amber-400/60 text-amber-200'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      {lg}
                    </button>
                  ))}
                </div>
              )}

              {/* Stash Tab Picker + Auto Sync Timer */}
              {stashTabs.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-slate-800">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-mono text-[11px] uppercase text-slate-400">
                      Select Dump Tabs ({selectedTabIndices.length}/8):
                    </span>
                    {beforeSnapshot && (
                      <span className="text-[11px] font-mono text-emerald-400">
                        Before Snapshot locked at {beforeSnapshot.at}
                      </span>
                    )}
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
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                            active
                              ? 'bg-indigo-600/30 border-indigo-400/70 text-white shadow-sm'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-600'
                          }`}
                        >
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />
                          <span>{tab.name}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={snapshotting}
                        onClick={() => runSnapshot('before')}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Camera className="w-3.5 h-3.5 text-sky-400" />
                        <span>1. Before</span>
                      </button>

                      <button
                        type="button"
                        disabled={snapshotting || !beforeSnapshot}
                        onClick={() => runSnapshot('after')}
                        className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                      >
                        <GitCompare className="w-3.5 h-3.5" />
                        <span>2. Diff Now</span>
                      </button>

                      <button
                        type="button"
                        disabled={snapshotting}
                        onClick={() => runSnapshot('inspect')}
                        className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Scan Now</span>
                      </button>
                    </div>

                    {/* Auto Pull Interval Selector */}
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-950 border border-indigo-500/35 text-xs">
                      <Timer className={`w-3.5 h-3.5 ${autoSyncMinutes > 0 ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
                      <span className="text-[10px] font-mono uppercase text-slate-400">Auto Pull:</span>
                      <select
                        value={autoSyncMinutes}
                        onChange={(e) => setAutoSyncMinutes(Number(e.target.value))}
                        className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
                      >
                        <option value={0} className="bg-slate-950">Off</option>
                        <option value={15} className="bg-slate-950">Every 15m</option>
                        <option value={30} className="bg-slate-950">Every 30m</option>
                        <option value={60} className="bg-slate-950">Every 60m</option>
                      </select>
                      {autoSyncMinutes > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                          {formatCountdown(secondsUntilSync)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        {/* Right 5 Cols: Client.txt Speed Parser + Clipboard Quick Logger */}
        <section className="xl:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/85 p-5 space-y-4 shadow-lg">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between gap-2">
            <div>
              <div className="text-[10px] font-mono font-bold uppercase text-emerald-400">
                Zero Credential Tools
              </div>
              <h2 className="text-base font-poe font-bold text-white">
                Client.txt Pace & Clipboard Logger
              </h2>
            </div>

            <label className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Parse Client.txt</span>
              <input type="file" accept=".txt,.log" onChange={handleClientTxtUpload} className="hidden" />
            </label>
          </div>

          <div className="grid grid-cols-3 gap-2.5 text-xs">
            <label className="space-y-1 block">
              <span className="text-[10px] font-mono uppercase text-slate-400">Maps Run</span>
              <input
                type="number"
                min={0}
                value={mapsRun}
                onChange={(e) => setMapsRun(Math.max(0, Number(e.target.value) || 0))}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono font-bold"
              />
            </label>
            <label className="space-y-1 block">
              <span className="text-[10px] font-mono uppercase text-slate-400">Minutes</span>
              <input
                type="number"
                min={1}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Math.max(1, Number(e.target.value) || 1))}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono font-bold"
              />
            </label>
            <label className="space-y-1 block">
              <span className="text-[10px] font-mono uppercase text-slate-400">Deaths</span>
              <input
                type="number"
                min={0}
                value={deaths}
                onChange={(e) => setDeaths(Math.max(0, Number(e.target.value) || 0))}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-rose-300 font-mono font-bold"
              />
            </label>
          </div>

          <div className="space-y-2">
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
                placeholder="Paste Ctrl+C item tooltip (auto tiers via poe.ninja)..."
                className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
              <button
                type="button"
                onClick={handleAddClipboardDrop}
                className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer shrink-0"
              >
                Parse Drop
              </button>
            </div>

            <form onSubmit={handleAddManualDrop} className="grid grid-cols-12 gap-2">
              <input
                type="text"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                placeholder="Or type drop (e.g. Divine Orb, Mageblood)..."
                className="col-span-6 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500"
              />
              <select
                value={manualCategory}
                onChange={(e) => setManualCategory(e.target.value)}
                className="col-span-3 px-2 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200"
              >
                {CATEGORY_ORDER.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                value={manualQty}
                onChange={(e) => setManualQty(Math.max(1, Number(e.target.value) || 1))}
                className="col-span-1 px-1.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-center font-mono text-white"
              />
              <button
                type="submit"
                className="col-span-2 px-2 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold flex items-center justify-center cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* 30m Auto Pull Checkpoints Strip */}
          {checkpoints.length > 1 && (
            <div className="pt-2 border-t border-slate-800 space-y-1.5">
              <div className="text-[10px] font-mono uppercase text-indigo-300">Auto Pull Interval Checkpoints</div>
              <div className="flex flex-wrap gap-1.5">
                {checkpoints.map((cp, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-300"
                  >
                    {cp.at}: <strong className="text-amber-300">{cp.totalChaos.toLocaleString()}c</strong>
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* KPI Metrics Strip + Save Session Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-slate-900/85 border border-amber-500/30">
          <div className="text-[10px] font-mono uppercase text-amber-400">poe.ninja Benchmark Value</div>
          <div className="text-2xl font-mono font-bold text-amber-300 mt-0.5">
            {totalSessionDivines >= 1
              ? `${totalSessionDivines.toFixed(2)} Div`
              : `${totalSessionChaos.toLocaleString()}c`}
          </div>
          <div className="text-[11px] text-slate-400">
            {totalSessionChaos.toLocaleString()}c total • {divPerHour} Div/hr ({chaosPerHour}c/hr)
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/85 border border-slate-800">
          <div className="text-[10px] font-mono uppercase text-purple-400">S & A Tier Highlights</div>
          <div className="text-2xl font-mono font-bold text-white mt-0.5">
            <span className="text-amber-300">{tierCounts.S} S</span>{' '}
            <span className="text-slate-600 text-base">/</span>{' '}
            <span className="text-purple-300">{tierCounts.A} A</span>
          </div>
          <div className="text-[11px] text-slate-400">
            {totalItemsDropped.toLocaleString()} total drops ({enrichedDrops.length} stacks)
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/85 border border-slate-800">
          <div className="text-[10px] font-mono uppercase text-emerald-400">Mapping Pace</div>
          <div className="text-2xl font-mono font-bold text-emerald-300 mt-0.5">{mapsPerHour} / hr</div>
          <div className="text-[11px] text-slate-400">
            {mapsRun} maps in {durationMinutes}m ({deaths} deaths)
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/85 border border-slate-800 flex flex-col justify-between gap-2">
          <input
            type="text"
            value={sessionTitle}
            onChange={(e) => setSessionTitle(e.target.value)}
            className="w-full px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white font-semibold"
          />
          <button
            type="button"
            disabled={savingSession || activeDrops.length === 0 || !normalizedHandle}
            onClick={handleSaveSessionToCloud}
            className="w-full py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{savingSession ? 'Saving...' : 'Save Session to Profile'}</span>
          </button>
        </div>
      </div>

      {/* Visual Loot Breakdown + S/A Tier & Unique Highlights Showcase */}
      {enrichedDrops.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/85 p-5 space-y-3.5">
            <h3 className="text-sm font-poe font-bold text-white">Value & Drop Distribution</h3>
            <div className="space-y-3">
              {categoryBreakdown.map((row) => (
                <div key={row.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">{row.category}</span>
                    <span className="font-mono text-slate-400">
                      {row.chaos > 0 ? `${row.chaos.toLocaleString()}c • ` : ''}
                      {row.count.toLocaleString()} drops ({row.pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${CATEGORY_COLORS[row.category] || 'from-indigo-500 to-sky-400'}`}
                      style={{ width: `${Math.max(4, row.pct)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7 rounded-2xl border border-amber-500/30 bg-slate-900/85 p-5 space-y-3.5">
            <h3 className="text-sm font-poe font-bold text-amber-300 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>S & A Tier Jackpots & Unique Showcase ({topDropsShowcase.length})</span>
            </h3>
            {topDropsShowcase.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No S/A Tier hits or Uniques in this session yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
                {topDropsShowcase.map((u) => {
                  const isShared = !!sharedStashKeys[u.key];
                  return (
                    <div
                      key={u.key}
                      className="p-3 rounded-xl bg-slate-950/80 border border-amber-500/30 flex items-center justify-between gap-2.5"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {u.icon ? (
                          <img src={u.icon} alt={u.shortName} className="w-9 h-9 object-contain shrink-0" />
                        ) : (
                          <span
                            className={`w-8 h-8 rounded-lg border flex items-center justify-center font-mono font-bold text-xs shrink-0 ${TIER_STYLES[u.tier]}`}
                          >
                            {u.tier}
                          </span>
                        )}
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-amber-200 truncate">{u.shortName}</div>
                          <div className="text-[11px] font-mono text-slate-400 truncate">
                            Tier {u.tier} • {u.totalChaos > 0 ? `${u.totalChaos.toLocaleString()}c` : u.subCategory}
                            {u.quantity > 1 ? ` (×${u.quantity})` : ''}
                          </div>
                        </div>
                      </div>

                      {u.category === 'Uniques' && (
                        <button
                          type="button"
                          disabled={isShared}
                          onClick={() => handleShareToFreeStash(u)}
                          title="Offer this spare Unique to your Private League Free Stash"
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 shrink-0 cursor-pointer ${
                            isShared
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-slate-800 hover:bg-indigo-600 text-slate-200 border border-slate-700'
                          }`}
                        >
                          <Share2 className="w-3 h-3" />
                          <span>{isShared ? 'Shared' : 'Stash'}</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Advanced Tiered, Bracketed & Sortable Loot Inventory */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/85 p-5 space-y-4">
        {/* Primary Category Filter Ribbon + Sort Selector + Search */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {['All', ...CATEGORY_ORDER].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => handleSelectCategory(cat)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-indigo-600/30 border-indigo-400/60 text-white shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="value_desc" className="bg-slate-950">poe.ninja Value (High to Low)</option>
                <option value="bracket" className="bg-slate-950">Group by Bracket / Subtype</option>
                <option value="qty_desc" className="bg-slate-950">Quantity (High to Low)</option>
                <option value="gem_level" className="bg-slate-950">Gem Level (High to Low)</option>
                <option value="gem_quality" className="bg-slate-950">Gem Quality (High to Low)</option>
                <option value="ilvl_desc" className="bg-slate-950">Item Level (High to Low)</option>
                <option value="alpha" className="bg-slate-950">Alphabetical (A to Z)</option>
              </select>
            </div>

            <div className="relative w-full sm:w-52">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter dropped items..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500"
              />
            </div>
          </div>
        </div>

        {/* poe.ninja Tier Filter Bar + Dynamic Sub-Bracket Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-mono uppercase text-slate-400 mr-1">poe.ninja Tier:</span>
            {(['All', 'S', 'A', 'B', 'C'] as const).map((tier) => (
              <button
                key={tier}
                type="button"
                onClick={() => setTierFilter(tier)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border transition-colors cursor-pointer ${
                  tierFilter === tier
                    ? tier === 'All'
                      ? 'bg-indigo-600/30 border-indigo-400/60 text-white'
                      : TIER_STYLES[tier]
                    : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {tier === 'All' ? 'All Tiers' : `Tier ${tier} (${tierCounts[tier]})`}
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
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                    subFilter === opt
                      ? 'bg-amber-500/20 border-amber-400/60 text-amber-200'
                      : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>

        {filteredAndSortedDrops.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400">
            Scan your Dump Tabs above, paste a Ctrl+C item, or adjust your Tier and Bracket filters to view drops.
          </div>
        ) : sortMode === 'bracket' ? (
          <div className="space-y-5 max-h-[620px] overflow-y-auto pr-1">
            {groupedByBracket.map(([bracketName, items]) => {
              const bracketChaos = Math.round(items.reduce((s, x) => s + x.totalChaos, 0));
              return (
                <div key={bracketName} className="space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300">
                      {bracketName}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                      {bracketChaos > 0 ? `${bracketChaos.toLocaleString()}c • ` : ''}
                      {items.reduce((s, x) => s + x.quantity, 0)} drops ({items.length} stacks)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
                    {items.map((it) => (
                      <DropItemCard
                        key={it.key}
                        item={it}
                        divineChaos={divineChaos}
                        isShared={!!sharedStashKeys[it.key]}
                        onShareFreeStash={it.category === 'Uniques' ? () => handleShareToFreeStash(it) : undefined}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5 max-h-[620px] overflow-y-auto pr-1">
            {filteredAndSortedDrops.map((it) => (
              <DropItemCard
                key={it.key}
                item={it}
                divineChaos={divineChaos}
                isShared={!!sharedStashKeys[it.key]}
                onShareFreeStash={it.category === 'Uniques' ? () => handleShareToFreeStash(it) : undefined}
              />
            ))}
          </div>
        )}
      </section>

      {/* Cloud Saved Farming Sessions History */}
      {savedSessions.length > 0 && (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/85 p-5 space-y-3">
          <h3 className="text-sm font-poe font-bold text-white flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-400" />
            <span>Saved Farming Sessions ({savedSessions.length})</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {savedSessions.map((s) => (
              <div
                key={s.id}
                className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-indigo-400/50 transition-all flex items-center justify-between gap-3"
              >
                <button
                  type="button"
                  onClick={() => {
                    setSessionTitle(s.title);
                    setMapsRun(s.mapsRun);
                    setDurationMinutes(s.durationMinutes);
                    setDeaths(s.deaths);
                    setActiveDrops(s.items || []);
                  }}
                  className="text-left min-w-0 flex-1 cursor-pointer space-y-1"
                >
                  <div className="text-xs font-bold text-white truncate">{s.title}</div>
                  <div className="text-[10px] font-mono text-slate-400 flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    <span>
                      {s.mapsRun} maps • {s.totalChaos ? `${Math.round(s.totalChaos).toLocaleString()}c • ` : ''}
                      {s.items?.length || 0} stacks • {new Date(s.createdAtIso).toLocaleDateString()}
                    </span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteSession(s.id)}
                  title="Delete saved session"
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

const DropItemCard: React.FC<{
  item: EnrichedDropItem;
  divineChaos: number;
  isShared?: boolean;
  onShareFreeStash?: () => void;
}> = ({ item, divineChaos, isShared, onShareFreeStash }) => {
  const valueLabel =
    item.totalChaos >= divineChaos && divineChaos > 0
      ? `${(item.totalChaos / divineChaos).toFixed(2)} Div`
      : item.totalChaos > 0
      ? `${item.totalChaos.toLocaleString()}c`
      : '';

  return (
    <div
      className={`p-3 rounded-xl bg-slate-950/85 border transition-colors flex items-center justify-between gap-2.5 ${
        item.tier === 'S'
          ? 'border-amber-400/60 shadow-sm shadow-amber-500/10'
          : item.tier === 'A'
          ? 'border-purple-500/45'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {item.icon ? (
          <img src={item.icon} alt={item.shortName} className="w-8 h-8 object-contain shrink-0" />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px] font-mono text-amber-300 shrink-0">
            {item.category.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold border shrink-0 ${TIER_STYLES[item.tier]}`}
            >
              {item.tier}
            </span>
            <span
              className={`text-xs font-bold truncate ${
                item.category === 'Uniques'
                  ? 'text-orange-300'
                  : item.category === 'Gems'
                  ? 'text-teal-300'
                  : 'text-white'
              }`}
            >
              {item.shortName}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1">
            {item.subCategory && (
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                {item.subCategory}
              </span>
            )}
            {item.category === 'Gems' && (item.gemLevel || 0) > 0 && (
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-teal-500/15 border border-teal-500/35 text-teal-300">
                Lvl {item.gemLevel}
              </span>
            )}
            {item.category === 'Gems' && (item.gemQuality || 0) > 0 && (
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-sky-500/15 border border-sky-500/35 text-sky-300">
                +{item.gemQuality}% Q
              </span>
            )}
            {item.isVaal && (
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300">
                Vaal
              </span>
            )}
            {item.isTransfigured && (
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-500/20 border border-purple-500/40 text-purple-300">
                Transfigured
              </span>
            )}
            {item.isAwakened && (
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300">
                Awakened
              </span>
            )}
            {item.ilvl > 0 && item.category !== 'Gems' && item.category !== 'Currency' && (
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                iLvl {item.ilvl}
              </span>
            )}
            {item.corrupted && (
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-950/60 border border-rose-500/40 text-rose-400">
                Corrupted
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1 shrink-0">
        <div className="flex items-center gap-1">
          {valueLabel && (
            <span className="px-1.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/35 font-mono text-[10px] font-bold text-amber-300">
              {valueLabel}
            </span>
          )}
          <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 font-mono text-xs font-bold text-white">
            ×{item.quantity}
          </span>
        </div>

        {onShareFreeStash && (
          <button
            type="button"
            disabled={isShared}
            onClick={onShareFreeStash}
            className={`px-1.5 py-0.5 rounded text-[9px] font-bold cursor-pointer ${
              isShared
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'bg-slate-800 hover:bg-indigo-600 text-slate-300'
            }`}
          >
            {isShared ? 'Shared' : '+ Free Stash'}
          </button>
        )}
      </div>
    </div>
  );
};
