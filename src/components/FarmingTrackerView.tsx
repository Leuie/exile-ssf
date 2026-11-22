import React, { useEffect, useMemo, useState } from 'react';
import {
  Sparkles,
  Lock,
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
  KeyRound,
  Layers
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

const HONOR_UNLOCK_THRESHOLD = 500;

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

const CATEGORY_COLORS: Record<string, string> = {
  Uniques: 'from-orange-500 to-amber-400 text-orange-300 border-orange-500/40 bg-orange-500/15',
  Currency: 'from-amber-400 to-yellow-300 text-amber-300 border-amber-500/40 bg-amber-500/15',
  'Scarabs & Fragments': 'from-indigo-500 to-sky-400 text-indigo-300 border-indigo-500/40 bg-indigo-500/15',
  'Div Cards': 'from-cyan-400 to-teal-300 text-cyan-300 border-cyan-500/40 bg-cyan-500/15',
  'Essences & Crafting': 'from-purple-500 to-fuchsia-400 text-purple-300 border-purple-500/40 bg-purple-500/15',
  'Maps & League Keys': 'from-emerald-500 to-lime-400 text-emerald-300 border-emerald-500/40 bg-emerald-500/15',
  Gems: 'from-teal-500 to-emerald-400 text-teal-300 border-teal-500/40 bg-teal-500/15',
  'Gear & Jewels': 'from-slate-400 to-slate-300 text-slate-300 border-slate-600 bg-slate-800/70'
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
  userAccount,
  onOpenAuthModal
}) => {
  const [game, setGame] = useState<'poe1' | 'poe2'>(selectedGame);
  const [honorPoints, setHonorPoints] = useState<number>(0);
  const [checkingAccess, setCheckingAccess] = useState<boolean>(true);
  const [wishlistItems, setWishlistItems] = useState<LookingForItem[]>([]);

  // Stash API Dev Connection State (POESESSID stays in memory only, never persisted on server)
  const [accountName, setAccountName] = useState<string>(userAccount?.poeAccountName || '');
  const [leagueName, setLeagueName] = useState<string>('Ravenwatch Covens of Umbra GSF (PL87651)');
  const [detectedLeagues, setDetectedLeagues] = useState<string[]>([]);
  const [detectingLeagues, setDetectingLeagues] = useState<boolean>(false);
  const [poesessid, setPoesessid] = useState<string>('');
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

  // Loot Filter & Saved Sessions History
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [savedSessions, setSavedSessions] = useState<SavedFarmingSession[]>([]);
  const [savingSession, setSavingSession] = useState<boolean>(false);

  const normalizedHandle = (userAccount?.displayName || '').trim().replace(/^@/, '').toLowerCase();
  const isDefaultUnlocked = normalizedHandle === 'leuie' || Boolean((userAccount as any)?.isAdmin);
  const hasAccess = isDefaultUnlocked || honorPoints >= HONOR_UNLOCK_THRESHOLD;

  useEffect(() => {
    document.title = 'Farming & Drop Tracker | Exile SSF';
  }, []);

  // Sync user's Honor Points, active league wishlists (for Wishlist Drop Matcher), and saved sessions
  useEffect(() => {
    let cancelled = false;
    const loadContext = async () => {
      setCheckingAccess(true);
      try {
        const dataRes = await fetch('/api/data?leagueId=poe1-330-umbra', { credentials: 'include' });
        if (dataRes.ok && !cancelled) {
          const data: any = await dataRes.json();
          if (Array.isArray(data?.lookingForItems)) {
            setWishlistItems(data.lookingForItems);
          }
          if (normalizedHandle && data?.achievements && typeof data.achievements === 'object') {
            const prof =
              data.achievements[normalizedHandle] ||
              Object.values(data.achievements).find(
                (p: any) => String(p?.playerKey || '').toLowerCase() === normalizedHandle
              );
            if (prof) {
              const unlockedCount = Array.isArray((prof as any).unlockedIds) ? (prof as any).unlockedIds.length : 0;
              const logBonus = Array.isArray((prof as any).honorLog)
                ? (prof as any).honorLog.reduce((sum: number, e: any) => sum + Number(e?.points || 0), 0)
                : 0;
              const customPts = Number((prof as any).customHonorPoints || 0);
              setHonorPoints(unlockedCount * 35 + logBonus + customPts);
            }
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

      if (!cancelled) setCheckingAccess(false);
    };
    loadContext();
    return () => {
      cancelled = true;
    };
  }, [normalizedHandle]);

  // Match dropped items against active squad wishlists
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

  const handleDetectLeagues = async () => {
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
    if (!accountName.trim() || !leagueName.trim() || !poesessid.trim()) {
      setStatusNotice({ type: 'err', text: 'Enter your Account Name, League Name, and temporary POESESSID first.' });
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
          text: `Loaded ${tabs.length} stash tabs from ${leagueName.trim()}. Pick your Dump Tabs below.`
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

  // Parse local PoE Client.txt in browser memory (never uploaded)
  const handleClientTxtUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      // Read only the last 2 MB of Client.txt so huge log files parse instantly
      const sliceStart = Math.max(0, file.size - 2 * 1024 * 1024);
      const text = await file.slice(sliceStart).text();
      const lines = text.split(/\r?\n/);

      const cutoff = Date.now() - 1000 * 60 * 60 * 6; // Last 6 hours
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

    addDropToSession(name, base, cat, 1, parsed?.itemLevel || 0, parsed?.rarity === 'Unique' ? 3 : 2);
    setClipboardText('');
  };

  const handleAddManualDrop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) return;
    addDropToSession(manualName.trim(), '', manualCategory, Math.max(1, manualQty), 0, manualCategory === 'Uniques' ? 3 : 5);
    setManualName('');
    setManualQty(1);
  };

  const addDropToSession = (
    shortName: string,
    baseType: string,
    category: string,
    qty: number,
    ilvl: number,
    frameType: number
  ) => {
    const displayName = baseType && baseType !== shortName ? `${shortName} (${baseType})` : shortName;
    const key = `${category}::${displayName.toLowerCase()}`;
    setActiveDrops((prev) => {
      const idx = prev.findIndex((x) => x.key === key);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + qty };
        return copy;
      }
      return [
        {
          key,
          name: displayName,
          shortName,
          baseType,
          category,
          quantity: qty,
          icon: '',
          frameType,
          ilvl,
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

  const filteredDrops = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return activeDrops.filter((d) => {
      const catOk = categoryFilter === 'All' || d.category === categoryFilter;
      const qOk = !q || d.name.toLowerCase().includes(q) || d.category.toLowerCase().includes(q);
      return catOk && qOk;
    });
  }, [activeDrops, categoryFilter, searchQuery]);

  const totalItemsDropped = activeDrops.reduce((s, x) => s + x.quantity, 0);
  const mapsPerHour = durationMinutes > 0 && mapsRun > 0 ? ((mapsRun / durationMinutes) * 60).toFixed(1) : '0.0';

  // 500 HONOR POINTS UNLOCK GATE
  if (!checkingAccess && !hasAccess) {
    const pct = Math.min(100, Math.round((honorPoints / HONOR_UNLOCK_THRESHOLD) * 100));
    return (
      <div className="w-full max-w-4xl mx-auto py-8 space-y-6 font-sans text-slate-200">
        <div className="rounded-3xl border border-amber-500/35 bg-gradient-to-br from-[#0e1320] via-indigo-950/30 to-[#0b0f19] p-8 shadow-2xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-amber-400" />
          </div>

          <div className="space-y-2 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/35 text-[11px] font-mono font-bold uppercase tracking-wider text-amber-300">
              <Trophy className="w-3.5 h-3.5" />
              500 Honor Points Unlock
            </div>
            <h1 className="text-2xl sm:text-3xl font-poe font-bold text-white">
              SSF & GSF Farming & Drop Tracker
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Parse your dump tabs, visualize every unique and currency drop from your mapping sessions, measure maps per hour from Client.txt, and automatically highlight drops that match your squadmates' wishlists.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="max-w-md mx-auto p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Your Honor Progress</span>
              <span className="font-bold text-amber-300">
                {honorPoints} / {HONOR_UNLOCK_THRESHOLD} Honor Points ({pct}%)
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-amber-400 to-emerald-400 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 pt-1">
              Earn Honor Points by fulfilling squad wishlists, unlocking league achievements, and participating in Private Leagues.
            </p>
          </div>

          {!userAccount && onOpenAuthModal && (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer shadow-lg"
            >
              Sign In to Check Your Honor Points
            </button>
          )}
        </div>
      </div>
    );
  }

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
            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300">
              {isDefaultUnlocked ? 'Founder Access' : `${honorPoints} Honor Unlocked`}
            </span>
            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300">
              Productivity & Drop Telemetry
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Roll a batch of maps, dump your loot into stash tabs, and parse every unique, orb, scarab, and squad wishlist match in seconds so you can get right back to blasting.
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

      {/* Squad Wishlist Match Alert! */}
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
        {/* Left 7 Cols: Live Stash Dump Tab Snapshot Engine */}
        <section className="xl:col-span-7 rounded-2xl border border-indigo-500/30 bg-slate-900/85 p-5 space-y-4 shadow-lg">
          <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 text-[11px] font-mono font-bold uppercase text-indigo-300">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>{game === 'poe1' ? 'PoE 1 Dump Tab Snapshot Engine (Dev Preview)' : 'PoE 2 Stash API Status'}</span>
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
                Grinding Gear Games has not opened the public Stash Tab API for Path of Exile 2 yet. Once GGG enables OAuth Stash access for PoE 2, this exact Dump Tab Diff engine will unlock automatically.
              </p>
              <p className="text-amber-300 font-semibold">
                In the meantime, use the Client.txt Map Speed Parser and Clipboard Drop Logger on the right to track your PoE 2 Waystone sessions!
              </p>
            </div>
          ) : (
            <>
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
                  <span className="text-[10px] font-mono uppercase text-slate-400">League Name or PL Code</span>
                  <input
                    type="text"
                    value={leagueName}
                    onChange={(e) => setLeagueName(e.target.value)}
                    placeholder="PL87651 or Standard"
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

              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] text-slate-400">
                  Private testing bridge until Official GGG OAuth reopens. Your POESESSID is never saved to D1, KV, or logs.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={detectingLeagues}
                    onClick={handleDetectLeagues}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Search className="w-3.5 h-3.5 text-amber-400" />
                    <span>{detectingLeagues ? 'Detecting...' : 'Detect My Leagues'}</span>
                  </button>
                  <button
                    type="button"
                    disabled={loadingTabs}
                    onClick={handleLoadStashTabs}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingTabs ? 'animate-spin' : ''}`} />
                    <span>{loadingTabs ? 'Loading Tabs...' : 'Load Stash Tabs'}</span>
                  </button>
                </div>
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
                Session Speed & Manual Drops
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

          {/* Paste Ctrl+C Item Tooltip */}
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
                placeholder="Paste Ctrl+C item tooltip from in game..."
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

            {/* Quick Manual Drop Row */}
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
          <div className="text-[11px] text-slate-400">{activeDrops.length} distinct item types</div>
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
          {/* Category Visual Bars */}
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
                      className={`h-full rounded-full bg-gradient-to-r ${(CATEGORY_COLORS[row.category] || 'from-indigo-500 to-sky-400').split(' ').slice(0, 2).join(' ')}`}
                      style={{ width: `${Math.max(4, row.pct)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notable Uniques Gallery */}
          <div className="lg:col-span-7 rounded-2xl border border-orange-500/30 bg-slate-900/85 p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-poe font-bold text-orange-300 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-orange-400" />
                <span>Unique Drops Showcase ({uniqueDrops.length})</span>
              </h3>
            </div>
            {uniqueDrops.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No Uniques in this session yet.
              </div>
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
                        {u.baseType || u.tabName} {u.quantity > 1 ? `×${u.quantity}` : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full Parsed Drop Inventory Table */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/85 p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {['All', ...CATEGORY_ORDER].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-indigo-600/30 border-indigo-400/60 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-60">
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

        {filteredDrops.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400">
            Scan your Dump Tabs above, paste a Ctrl+C item, or log a drop to populate your session board.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5 max-h-[460px] overflow-y-auto pr-1">
            {filteredDrops.map((it) => (
              <div
                key={it.key}
                className="p-3 rounded-xl bg-slate-950/75 border border-slate-800 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {it.icon ? (
                    <img src={it.icon} alt={it.shortName} className="w-7 h-7 object-contain shrink-0" />
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px] font-mono text-amber-300 shrink-0">
                      {it.category.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{it.shortName}</div>
                    <div className="text-[10px] font-mono text-slate-400 truncate">
                      {it.category} • {it.tabName}
                    </div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 font-mono text-xs font-bold text-amber-300 shrink-0">
                  ×{it.quantity}
                </span>
              </div>
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
