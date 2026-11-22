import React, { useEffect, useMemo, useState } from 'react';
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
  ArrowUpDown
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

interface SavedFarmingSession {
  id: string;
  handle: string;
  game: 'poe1' | 'poe2';
  title: string;
  league: string;
  mapsRun: number;
  durationMinutes: number;
  deaths: number;
  createdAtIso: string;
  items: TrackedDropItem[];
}

type SortMode = 'bracket' | 'qty_desc' | 'gem_level' | 'gem_quality' | 'ilvl_desc' | 'alpha';

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
  return diff.sort((a, b) => {
    if (a.category === 'Uniques' && b.category !== 'Uniques') return -1;
    if (b.category === 'Uniques' && a.category !== 'Uniques') return 1;
    return b.quantity - a.quantity;
  });
}

export const FarmingTrackerView: React.FC<FarmingTrackerViewProps> = ({
  selectedGame = 'poe1',
  userAccount
}) => {
  const [game, setGame] = useState<'poe1' | 'poe2'>(selectedGame);
  const [wishlistItems, setWishlistItems] = useState<LookingForItem[]>([]);

  // Stash API Connection State (POESESSID stays in browser memory only, never stored on server)
  const [accountName, setAccountName] = useState<string>(userAccount?.poeAccountName || '');
  const [leagueName, setLeagueName] = useState<string>('Ravenwatch Covens of Umbra GSF (PL87651)');
  const [detectedLeagues, setDetectedLeagues] = useState<string[]>([]);
  const [detectingLeagues, setDetectingLeagues] = useState<boolean>(false);
  const [poesessid, setPoesessid] = useState<string>('');
  const [acceptedRiskDisclaimer, setAcceptedRiskDisclaimer] = useState<boolean>(false);
  const [stashTabs, setStashTabs] = useState<StashTabMeta[]>([]);
  const [selectedTabIndices, setSelectedTabIndices] = useState<number[]>([]);
  const [loadingTabs, setLoadingTabs] = useState<boolean>(false);
  const [snapshotting, setSnapshotting] = useState<boolean>(false);
  const [statusNotice, setStatusNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

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

  // Advanced Loot Filtering, Sub-Brackets & Sorting
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [subFilter, setSubFilter] = useState<string>('All');
  const [sortMode, setSortMode] = useState<SortMode>('bracket');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Saved Sessions History
  const [savedSessions, setSavedSessions] = useState<SavedFarmingSession[]>([]);
  const [savingSession, setSavingSession] = useState<boolean>(false);

  const normalizedHandle = (userAccount?.displayName || '').trim().replace(/^@/, '').toLowerCase();

  useEffect(() => {
    document.title = 'Farming & Drop Tracker | Exile SSF';
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadContext = async () => {
      try {
        const dataRes = await fetch('/api/data?leagueId=poe1-330-umbra', { credentials: 'include' });
        if (dataRes.ok && !cancelled) {
          const data: any = await dataRes.json();
          if (Array.isArray(data?.lookingForItems)) {
            setWishlistItems(data.lookingForItems);
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
  }, [normalizedHandle]);

  const wishlistMatches = useMemo(() => {
    const openWishes = wishlistItems.filter((w) => w.status !== 'HAVE');
    if (openWishes.length === 0 || activeDrops.length === 0) return [];
    const matches: { drop: TrackedDropItem; wish: LookingForItem }[] = [];
    for (const drop of activeDrops) {
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
  }, [wishlistItems, activeDrops]);

  const handleSelectCategory = (cat: string) => {
    setCategoryFilter(cat);
    if (cat === 'Gems') {
      setSubFilter('All Gems');
      setSortMode('gem_level');
    } else if (cat === 'Gear & Jewels') {
      setSubFilter('All Equipment');
      setSortMode('bracket');
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

  const runSnapshot = async (mode: 'before' | 'after' | 'inspect') => {
    if (selectedTabIndices.length === 0) {
      setStatusNotice({ type: 'err', text: 'Select at least one Dump Tab first.' });
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
        if (mode === 'before') {
          setBeforeSnapshot({ at: new Date().toLocaleTimeString(), items: snapItems });
          setStatusNotice({
            type: 'ok',
            text: `Before Snapshot captured (${data.totalItemCount} total items across ${selectedTabIndices.length} tabs). Go blast maps and dump loot!`
          });
        } else if (mode === 'after') {
          if (!beforeSnapshot) {
            setActiveDrops(snapItems);
            setStatusNotice({ type: 'ok', text: `Captured ${snapItems.length} unique item stacks from selected tabs.` });
          } else {
            const diffed = computeSnapshotDiff(beforeSnapshot.items, snapItems);
            setActiveDrops(diffed);
            const totalNew = diffed.reduce((sum, x) => sum + x.quantity, 0);
            setStatusNotice({
              type: 'ok',
              text: `Session Diff complete: +${totalNew} new items dropped across ${diffed.length} distinct stacks!`
            });
          }
        } else {
          setActiveDrops(snapItems);
          setStatusNotice({
            type: 'ok',
            text: `Dump Tab Scan complete: ${data.totalItemCount} items parsed across ${snapItems.length} distinct stacks.`
          });
        }
      }
    } catch (err: any) {
      setStatusNotice({ type: 'err', text: err.message || 'Snapshot request failed.' });
    }
    setSnapshotting(false);
  };

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
    const counts = new Map<string, number>();
    let total = 0;
    for (const it of activeDrops) {
      counts.set(it.category, (counts.get(it.category) || 0) + it.quantity);
      total += it.quantity;
    }
    return CATEGORY_ORDER.map((cat) => ({
      category: cat,
      count: counts.get(cat) || 0,
      pct: total > 0 ? Math.round(((counts.get(cat) || 0) / total) * 100) : 0
    })).filter((c) => c.count > 0);
  }, [activeDrops]);

  const uniqueDrops = useMemo(
    () => activeDrops.filter((d) => d.category === 'Uniques'),
    [activeDrops]
  );

  // Dynamic Sub-Filter Pills based on selected main category
  const activeSubFilterOptions = useMemo(() => {
    if (categoryFilter === 'Gems') return GEM_SUBFILTERS;
    if (categoryFilter === 'Gear & Jewels') return EQUIPMENT_BRACKETS;
    if (categoryFilter === 'All') return [];
    const presentSubs = Array.from(
      new Set(
        activeDrops
          .filter((d) => d.category === categoryFilter && d.subCategory)
          .map((d) => d.subCategory!)
      )
    ).sort();
    return presentSubs.length > 1 ? ['All', ...presentSubs] : [];
  }, [categoryFilter, activeDrops]);

  const filteredAndSortedDrops = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = activeDrops.filter((d) => {
      if (categoryFilter !== 'All' && d.category !== categoryFilter) return false;

      // Gem sub-filters
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
      if (sortMode === 'qty_desc') return b.quantity - a.quantity || a.shortName.localeCompare(b.shortName);
      if (sortMode === 'alpha') return a.shortName.localeCompare(b.shortName);
      if (sortMode === 'ilvl_desc') return (b.ilvl || 0) - (a.ilvl || 0) || b.quantity - a.quantity;
      if (sortMode === 'gem_level') {
        return (b.gemLevel || 0) - (a.gemLevel || 0) || (b.gemQuality || 0) - (a.gemQuality || 0) || a.shortName.localeCompare(b.shortName);
      }
      if (sortMode === 'gem_quality') {
        return (b.gemQuality || 0) - (a.gemQuality || 0) || (b.gemLevel || 0) - (a.gemLevel || 0) || a.shortName.localeCompare(b.shortName);
      }
      // Default: 'bracket' — sort cleanly by Category -> SubCategory Bracket -> Quantity
      const catA = CATEGORY_ORDER.indexOf(a.category);
      const catB = CATEGORY_ORDER.indexOf(b.category);
      if (catA !== catB) return catA - catB;
      const subCmp = (a.subCategory || '').localeCompare(b.subCategory || '');
      if (subCmp !== 0) return subCmp;
      return b.quantity - a.quantity;
    });
  }, [activeDrops, categoryFilter, subFilter, sortMode, searchQuery]);

  // Group items by SubCategory Bracket when sorted by bracket
  const groupedByBracket = useMemo(() => {
    const map = new Map<string, TrackedDropItem[]>();
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

  const totalItemsDropped = activeDrops.reduce((s, x) => s + x.quantity, 0);
  const mapsPerHour = durationMinutes > 0 && mapsRun > 0 ? ((mapsRun / durationMinutes) * 60).toFixed(1) : '0.0';

  return (
    <div className="w-full space-y-6 pb-20 font-sans text-slate-200">
      {/* Header Bar */}
      <header className="rounded-2xl border border-slate-800 bg-gradient-to-r from-[#0e1320] via-indigo-950/35 to-[#0e1320] p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-poe font-bold text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-400" />
              <span>Farming & Drop Tracker</span>
            </h1>
            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300">
              Open Community Tool
            </span>
            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300">
              Bracket & Gem Sorting
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Roll a batch of maps, dump your loot into stash tabs, and inspect every drop sorted cleanly into defense brackets (Armour, Evasion, Energy Shield, Hybrid), Gem tiers (Vaal, Transfigured, Level, Quality), and squad wishlist matches.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-indigo-500/25 text-xs font-bold self-start lg:self-center">
          <button
            type="button"
            onClick={() => setGame('poe1')}
            className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              game === 'poe1'
                ? 'bg-indigo-600/30 text-white border border-indigo-400/60 shadow-sm'
                : 'text-slate-400 border border-transparent hover:text-white'
            }`}
          >
            <Flame className={`w-3.5 h-3.5 ${game === 'poe1' ? 'text-amber-300' : 'text-slate-500'}`} />
            <span>Path of Exile 1</span>
          </button>
          <button
            type="button"
            onClick={() => setGame('poe2')}
            className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              game === 'poe2'
                ? 'bg-indigo-600/30 text-white border border-indigo-400/60 shadow-sm'
                : 'text-slate-400 border border-transparent hover:text-white'
            }`}
          >
            <Hammer className={`w-3.5 h-3.5 ${game === 'poe2' ? 'text-amber-300' : 'text-slate-500'}`} />
            <span>Path of Exile 2</span>
          </button>
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

      {/* Squad Wishlist Match Alert */}
      {wishlistMatches.length > 0 && (
        <div className="p-4 rounded-2xl border border-amber-400/50 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-indigo-500/10 space-y-2 shadow-lg">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-amber-300">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Squad Wishlist Drop Match Detected ({wishlistMatches.length})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {wishlistMatches.map((m, idx) => (
              <div
                key={idx}
                className="px-3 py-1.5 rounded-xl bg-slate-950/90 border border-amber-400/40 text-xs text-white flex items-center gap-2"
              >
                <span className="font-bold text-orange-300">{m.drop.shortName}</span>
                <span className="text-slate-400">needed by</span>
                <span className="font-mono font-bold text-emerald-300">
                  @{m.wish.displayName || m.wish.characterName}
                </span>
              </div>
            ))}
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
                <span>{game === 'poe1' ? 'PoE 1 Dump Tab Snapshot Engine' : 'PoE 2 Stash API Status'}</span>
              </div>
              <h2 className="text-base font-poe font-bold text-white">
                {game === 'poe1' ? 'Live Stash Tab Scanner & Session Diff' : 'PoE 2 Automated Stash Sync (Awaiting GGG OAuth)'}
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
                Grinding Gear Games has not opened the public Stash Tab API for Path of Exile 2 yet. Once GGG enables OAuth Stash access for PoE 2, this Dump Tab Diff engine will unlock automatically.
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
                      <strong>Disclaimer:</strong> Grinding Gear Games currently has new OAuth application registrations paused. Providing your POESESSID here is <strong>100% optional and strictly at your own discretion</strong>. Exile SSF never stores your POESESSID in any database, KV cache, or server log: it stays in your browser memory only and is discarded immediately after each read. Sign out and back into <code>pathofexile.com</code> anytime to rotate your session cookie, or use the zero credential Client.txt and Clipboard tools on the right instead.
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

              {/* Stash Tab Picker Pills */}
              {stashTabs.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-[11px] uppercase text-slate-400">
                      Select Dump Tabs to Track ({selectedTabIndices.length}/8 selected):
                    </span>
                    {beforeSnapshot && (
                      <span className="text-[11px] font-mono text-emerald-400">
                        Before Snapshot locked at {beforeSnapshot.at}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 rounded-xl bg-slate-950/70 border border-slate-800">
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

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={snapshotting}
                      onClick={() => runSnapshot('before')}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Camera className="w-3.5 h-3.5 text-sky-400" />
                      <span>1. Before Snapshot</span>
                    </button>

                    <button
                      type="button"
                      disabled={snapshotting || !beforeSnapshot}
                      onClick={() => runSnapshot('after')}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                    >
                      <GitCompare className="w-3.5 h-3.5" />
                      <span>2. After Snapshot & Diff</span>
                    </button>

                    <button
                      type="button"
                      disabled={snapshotting}
                      onClick={() => runSnapshot('inspect')}
                      className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Scan Selected Dump Tabs Now</span>
                    </button>
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
                placeholder="Paste Ctrl+C item tooltip (auto detects Vaal/Quality/Armour/ES)..."
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
        </section>
      </div>

      {/* KPI Metrics Strip + Save Session Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-slate-900/85 border border-slate-800">
          <div className="text-[10px] font-mono uppercase text-amber-400">Total Loot Parsed</div>
          <div className="text-2xl font-mono font-bold text-white mt-0.5">{totalItemsDropped.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400">{activeDrops.length} distinct entries</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/85 border border-slate-800">
          <div className="text-[10px] font-mono uppercase text-orange-400">Unique Drops</div>
          <div className="text-2xl font-mono font-bold text-orange-300 mt-0.5">{uniqueDrops.length}</div>
          <div className="text-[11px] text-slate-400">Auto matched vs squad wishlists</div>
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

      {/* Visual Loot Breakdown + Unique Showcase */}
      {activeDrops.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/85 p-5 space-y-3.5">
            <h3 className="text-sm font-poe font-bold text-white">Loot Category Distribution</h3>
            <div className="space-y-3">
              {categoryBreakdown.map((row) => (
                <div key={row.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">{row.category}</span>
                    <span className="font-mono text-slate-400">
                      {row.count.toLocaleString()} ({row.pct}%)
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

          <div className="lg:col-span-7 rounded-2xl border border-orange-500/30 bg-slate-900/85 p-5 space-y-3.5">
            <h3 className="text-sm font-poe font-bold text-orange-300 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-orange-400" />
              <span>Unique Drops Showcase ({uniqueDrops.length})</span>
            </h3>
            {uniqueDrops.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No Uniques in this session yet.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
                {uniqueDrops.map((u) => (
                  <div
                    key={u.key}
                    className="p-3 rounded-xl bg-orange-950/20 border border-orange-500/30 flex items-center gap-3"
                  >
                    {u.icon ? (
                      <img src={u.icon} alt={u.shortName} className="w-9 h-9 object-contain shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-300 font-bold text-xs shrink-0">
                        U
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-orange-200 truncate">{u.shortName}</div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {u.subCategory || u.baseType} {u.quantity > 1 ? `×${u.quantity}` : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Advanced Bracketed & Sortable Loot Inventory */}
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

        {/* Dynamic Sub-Bracket Filter Pills (Gems: Vaal/Transfigured/Level/Quality; Gear: Armour/Evasion/ES/Hybrid/Weapons/Jewellery) */}
        {activeSubFilterOptions.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pb-1">
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

        {filteredAndSortedDrops.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400">
            Scan your Dump Tabs above, paste a Ctrl+C item, or adjust your bracket filters to view drops.
          </div>
        ) : sortMode === 'bracket' ? (
          <div className="space-y-5 max-h-[600px] overflow-y-auto pr-1">
            {groupedByBracket.map(([bracketName, items]) => (
              <div key={bracketName} className="space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300">
                    {bracketName}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400">
                    {items.reduce((s, x) => s + x.quantity, 0)} total ({items.length} entries)
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
                  {items.map((it) => (
                    <DropItemCard key={it.key} item={it} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5 max-h-[600px] overflow-y-auto pr-1">
            {filteredAndSortedDrops.map((it) => (
              <DropItemCard key={it.key} item={it} />
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
                      {s.mapsRun} maps • {s.items?.length || 0} drops • {new Date(s.createdAtIso).toLocaleDateString()}
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

const DropItemCard: React.FC<{ item: TrackedDropItem }> = ({ item }) => {
  return (
    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-colors flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
        {item.icon ? (
          <img src={item.icon} alt={item.shortName} className="w-8 h-8 object-contain shrink-0" />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px] font-mono text-amber-300 shrink-0">
            {item.category.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 space-y-1">
          <div
            className={`text-xs font-bold truncate ${
              item.category === 'Uniques'
                ? 'text-orange-300'
                : item.category === 'Gems'
                ? 'text-teal-300'
                : 'text-white'
            }`}
          >
            {item.shortName}
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

      <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 font-mono text-xs font-bold text-amber-300 shrink-0">
        ×{item.quantity}
      </span>
    </div>
  );
};
