import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  ArrowLeft,
  BarChart3,
  Cloud,
  Coins,
  Flame,
  Layers,
  PieChart,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Trophy,
  User,
  Clock
} from 'lucide-react';
import type { UserAccount } from '../types';
import {
  CATEGORY_ORDER,
  DEFAULT_SSF_WEIGHTS,
  PREFS_STORAGE_KEY,
  TIER_STYLES,
  WEIGHTS_STORAGE_KEY,
  WORKSPACE_STORAGE_KEY,
  computeSsfUtilityPoints,
  buildPoeWikiUrl,
  formatSsfPoints,
  formatValue,
  lookupNinjaPrice,
  resolveTier,
  type EnrichedDropItem,
  type SavedFarmingSession,
  type SsfWeightsConfig,
  type SyncCheckpoint,
  type TrackedDropItem
} from './assets/assetEngine';

interface WealthAnalyticsViewProps {
  selectedGame?: 'poe1' | 'poe2';
  userAccount?: UserAccount | null;
  onBackToAssetTracker: () => void;
  onOpenProfile?: (handle: string) => void;
  onOpenAuthModal?: () => void;
}

const SLICE_COLORS = [
  '#f59e0b',
  '#6366f1',
  '#10b981',
  '#38bdf8',
  '#ec4899',
  '#a855f7',
  '#f97316',
  '#14b8a6'
];

export const WealthAnalyticsView: React.FC<WealthAnalyticsViewProps> = ({
  selectedGame = 'poe1',
  userAccount,
  onBackToAssetTracker,
  onOpenProfile,
  onOpenAuthModal
}) => {
  const normalizedHandle = (userAccount?.displayName || '').trim().replace(/^@/, '').toLowerCase();

  const localWorkspace = useMemo(() => {
    try {
      const raw = localStorage.getItem(WORKSPACE_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }, []);

  const localPrefs = useMemo(() => {
    try {
      const raw = localStorage.getItem(PREFS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }, []);

  const ssfWeights: SsfWeightsConfig = useMemo(() => {
    try {
      const raw = localStorage.getItem(WEIGHTS_STORAGE_KEY);
      return raw ? { ...DEFAULT_SSF_WEIGHTS, ...JSON.parse(raw) } : DEFAULT_SSF_WEIGHTS;
    } catch {
      return DEFAULT_SSF_WEIGHTS;
    }
  }, []);

  const [valueSystem, setValueSystem] = useState<'ninja' | 'ssf'>(
    localPrefs.valueSystem === 'ssf' ? 'ssf' : 'ninja'
  );
  const [timelineMode, setTimelineMode] = useState<'checkpoints' | 'sessions'>('checkpoints');
  const [availableLeagues, setAvailableLeagues] = useState<string[]>(() => {
    const initial = String(localWorkspace.leagueName || localPrefs.leagueName || '').trim();
    return initial ? [initial] : [];
  });
  const [selectedLeague, setSelectedLeague] = useState<string>(
    String(localWorkspace.leagueName || localPrefs.leagueName || 'Ravenwatch Covens of Umbra GSF (PL87651)')
  );

  const [activeDrops, setActiveDrops] = useState<TrackedDropItem[]>(
    Array.isArray(localWorkspace.activeDrops) ? localWorkspace.activeDrops : []
  );
  const [checkpoints, setCheckpoints] = useState<SyncCheckpoint[]>(
    Array.isArray(localWorkspace.checkpoints) ? localWorkspace.checkpoints : []
  );
  const [mapsRun, setMapsRun] = useState<number>(Number(localWorkspace.mapsRun || 0));
  const [durationMinutes, setDurationMinutes] = useState<number>(Number(localWorkspace.durationMinutes || 60));
  const [deaths, setDeaths] = useState<number>(Number(localWorkspace.deaths || 0));
  const [lastSyncedAt, setLastSyncedAt] = useState<string>(String(localWorkspace.lastSyncedAt || ''));
  const [cloudUpdatedAt, setCloudUpdatedAt] = useState<string>('');
  const [cloudSynced, setCloudSynced] = useState<boolean>(false);
  const [loadingCloud, setLoadingCloud] = useState<boolean>(false);

  const [savedSessions, setSavedSessions] = useState<SavedFarmingSession[]>([]);
  const [ninjaPrices, setNinjaPrices] = useState<Record<string, number>>({ 'chaos orb': 1 });
  const [divineChaos, setDivineChaos] = useState<number>(200);
  const [ninjaLeagueLabel, setNinjaLeagueLabel] = useState<string>('Covens');

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [hoveredCat, setHoveredCat] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Wealth Analytics | Exile SSF';
  }, []);

  // Load live poe.ninja prices
  useEffect(() => {
    let cancelled = false;
    fetch('/api/farming/ninja-prices?league=auto')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: any) => {
        if (!cancelled && d?.prices) {
          setNinjaPrices(d.prices);
          if (Number(d.divineChaos) > 10) setDivineChaos(Number(d.divineChaos));
          if (d.league) setNinjaLeagueLabel(String(d.league));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Load per league cloud stash state + saved farming sessions from Cloudflare D1
  const loadCloudData = useCallback(
    async (leagueToLoad?: string) => {
      if (!normalizedHandle) return;
      setLoadingCloud(true);
      try {
        const leagueQuery = leagueToLoad ? `&league=${encodeURIComponent(leagueToLoad)}` : '';
        const [stashRes, sessionsRes] = await Promise.all([
          fetch(`/api/farming/stash-state?handle=${encodeURIComponent(normalizedHandle)}${leagueQuery}`, {
            credentials: 'include'
          }),
          fetch(`/api/farming/sessions?handle=${encodeURIComponent(normalizedHandle)}`, {
            credentials: 'include'
          })
        ]);

        if (stashRes.ok) {
          const data: any = await stashRes.json();
          if (Array.isArray(data?.leagues) && data.leagues.length > 0) {
            setAvailableLeagues((prev) => Array.from(new Set([...data.leagues, ...prev])));
          }
          if (data?.state) {
            setCloudSynced(true);
            if (data.updatedAtIso) setCloudUpdatedAt(String(data.updatedAtIso));
            if (Array.isArray(data.state.activeDrops)) setActiveDrops(data.state.activeDrops);
            if (Array.isArray(data.state.checkpoints)) setCheckpoints(data.state.checkpoints);
            if (typeof data.state.mapsRun === 'number') setMapsRun(data.state.mapsRun);
            if (typeof data.state.durationMinutes === 'number') setDurationMinutes(data.state.durationMinutes);
            if (typeof data.state.deaths === 'number') setDeaths(data.state.deaths);
            if (data.state.lastSyncedAt) setLastSyncedAt(String(data.state.lastSyncedAt));
            if (!leagueToLoad && data.activeLeague) setSelectedLeague(String(data.activeLeague));
          }
        }

        if (sessionsRes.ok) {
          const sData: any = await sessionsRes.json();
          if (Array.isArray(sData?.sessions)) {
            setSavedSessions(sData.sessions);
          }
        }
      } catch {
        // Keep local state gracefully if offline
      } finally {
        setLoadingCloud(false);
      }
    },
    [normalizedHandle]
  );

  useEffect(() => {
    if (selectedGame === 'poe1') {
      loadCloudData();
    }
  }, [loadCloudData, selectedGame]);

  // Enrich drops with live pricing & SSF utility points
  const enrichedDrops: EnrichedDropItem[] = useMemo(() => {
    return activeDrops.map((it) => {
      const chaosEach = lookupNinjaPrice(it, ninjaPrices);
      const totalChaos = Math.round(chaosEach * it.quantity * 100) / 100;
      const tier = resolveTier(chaosEach, totalChaos, divineChaos);
      const ssfPointsEach = computeSsfUtilityPoints(it, chaosEach, false, ssfWeights);
      const totalSsfPoints = Math.round(ssfPointsEach * it.quantity * 100) / 100;
      return {
        ...it,
        chaosEach,
        totalChaos,
        tier,
        ssfPointsEach,
        totalSsfPoints
      };
    });
  }, [activeDrops, ninjaPrices, divineChaos, ssfWeights]);

  const totalChaos = useMemo(
    () => Math.round(enrichedDrops.reduce((s, i) => s + i.totalChaos, 0) * 100) / 100,
    [enrichedDrops]
  );
  const totalSsfPts = useMemo(
    () => Math.round(enrichedDrops.reduce((s, i) => s + i.totalSsfPoints, 0) * 10) / 10,
    [enrichedDrops]
  );

  const safeHours = Math.max(1 / 60, (durationMinutes || 60) / 60);
  const chaosPerHour = Math.round(totalChaos / safeHours);
  const divPerHour = Math.round((chaosPerHour / Math.max(1, divineChaos)) * 100) / 100;
  const ssfPerHour = Math.round(totalSsfPts / safeHours);
  const chaosPerMap = mapsRun > 0 ? Math.round(totalChaos / mapsRun) : 0;

  const sTierCount = useMemo(() => enrichedDrops.filter((i) => i.tier === 'S').length, [enrichedDrops]);
  const aTierCount = useMemo(() => enrichedDrops.filter((i) => i.tier === 'A').length, [enrichedDrops]);

  // Category Breakdown
  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, { chaos: number; ssfPts: number; count: number; topItem: EnrichedDropItem | null }>();
    for (const cat of CATEGORY_ORDER) {
      map.set(cat, { chaos: 0, ssfPts: 0, count: 0, topItem: null });
    }
    for (const it of enrichedDrops) {
      const entry = map.get(it.category) || { chaos: 0, ssfPts: 0, count: 0, topItem: null };
      entry.chaos += it.totalChaos;
      entry.ssfPts += it.totalSsfPoints;
      entry.count += 1;
      const itVal = valueSystem === 'ssf' ? it.totalSsfPoints : it.totalChaos;
      const curTopVal = entry.topItem ? (valueSystem === 'ssf' ? entry.topItem.totalSsfPoints : entry.topItem.totalChaos) : -1;
      if (itVal > curTopVal) entry.topItem = it;
      map.set(it.category, entry);
    }
    const denom = Math.max(1, valueSystem === 'ssf' ? totalSsfPts : totalChaos);
    return Array.from(map.entries())
      .map(([category, v]) => {
        const metric = valueSystem === 'ssf' ? v.ssfPts : v.chaos;
        return {
          category,
          chaos: Math.round(v.chaos * 100) / 100,
          ssfPts: Math.round(v.ssfPts * 10) / 10,
          val: Math.round(metric * 10) / 10,
          count: v.count,
          pct: Math.round((metric / denom) * 1000) / 10,
          topItem: v.topItem
        };
      })
      .filter((c) => c.count > 0 || c.val > 0)
      .sort((a, b) => b.val - a.val);
  }, [enrichedDrops, valueSystem, totalChaos, totalSsfPts]);

  // Top Yielding Tabs
  const tabYields = useMemo(() => {
    const map = new Map<string, { val: number; chaos: number; ssfPts: number; stacks: number; topItemName: string; topItemVal: number }>();
    for (const it of enrichedDrops) {
      const tName = it.tabName || 'Stash';
      const v = valueSystem === 'ssf' ? it.totalSsfPoints : it.totalChaos;
      const cur = map.get(tName) || { val: 0, chaos: 0, ssfPts: 0, stacks: 0, topItemName: '', topItemVal: -1 };
      cur.val += v;
      cur.chaos += it.totalChaos;
      cur.ssfPts += it.totalSsfPoints;
      cur.stacks += 1;
      if (v > cur.topItemVal) {
        cur.topItemVal = v;
        cur.topItemName = it.shortName || it.name;
      }
      map.set(tName, cur);
    }
    const totalVal = Math.max(1, valueSystem === 'ssf' ? totalSsfPts : totalChaos);
    return Array.from(map.entries())
      .map(([tabName, d]) => ({
        tabName,
        val: Math.round(d.val),
        chaos: Math.round(d.chaos),
        ssfPts: Math.round(d.ssfPts),
        stacks: d.stacks,
        pct: Math.round((d.val / totalVal) * 1000) / 10,
        topItemName: d.topItemName
      }))
      .filter((t) => t.val > 0)
      .sort((a, b) => b.val - a.val);
  }, [enrichedDrops, valueSystem, totalChaos, totalSsfPts]);

  const maxTabYield = Math.max(1, ...tabYields.map((t) => t.val));
  const topTab = tabYields[0] || null;

  // League filtered saved sessions
  const leagueSessions = useMemo(() => {
    const cleanSel = selectedLeague.trim().toLowerCase();
    return savedSessions.filter((s) => {
      if (!cleanSel) return true;
      const sl = String(s.league || '').trim().toLowerCase();
      return !sl || sl === cleanSel || sl.includes(cleanSel) || cleanSel.includes(sl);
    });
  }, [savedSessions, selectedLeague]);

  // Hero Wealth Timeline points
  const timelinePoints = useMemo(() => {
    if (timelineMode === 'sessions' && leagueSessions.length > 0) {
      const ordered = [...leagueSessions].reverse();
      return ordered.map((s) => ({
        at: s.createdAtIso ? new Date(s.createdAtIso).toLocaleDateString([], { month: 'short', day: 'numeric' }) : s.title,
        label: s.title,
        totalItems: Array.isArray(s.items) ? s.items.length : 0,
        totalChaos: Number(s.totalChaos || 0)
      }));
    }
    if (checkpoints.length >= 2) {
      return checkpoints.map((c) => ({ ...c, label: `Sync @ ${c.at}` }));
    }
    if (checkpoints.length === 1) {
      return [
        { at: 'Start', label: 'Session Baseline', totalItems: 0, totalChaos: 0 },
        { ...checkpoints[0], label: `Sync @ ${checkpoints[0].at}` }
      ];
    }
    return [
      { at: 'Start', label: 'Baseline', totalItems: 0, totalChaos: 0 },
      { at: lastSyncedAt || 'Now', label: 'Current Stash', totalItems: enrichedDrops.length, totalChaos }
    ];
  }, [timelineMode, leagueSessions, checkpoints, lastSyncedAt, enrichedDrops.length, totalChaos]);

  const firstPtVal = timelinePoints[0]?.totalChaos || 0;
  const lastPtVal = timelinePoints[timelinePoints.length - 1]?.totalChaos || 0;
  const growthDelta = Math.round((lastPtVal - firstPtVal) * 100) / 100;
  const growthPct = firstPtVal > 0 ? Math.round(((lastPtVal - firstPtVal) / firstPtVal) * 100) : null;

  // Hero SVG dimensions
  const W = 880;
  const H = 230;
  const padL = 62;
  const padR = 24;
  const padT = 18;
  const padB = 28;
  const maxChartVal = Math.max(10, ...timelinePoints.map((p) => p.totalChaos));
  const chartCoords = timelinePoints.map((p, idx) => {
    const x =
      timelinePoints.length === 1
        ? padL + (W - padL - padR) / 2
        : padL + (idx / (timelinePoints.length - 1)) * (W - padL - padR);
    const y = padT + (H - padT - padB) * (1 - p.totalChaos / maxChartVal);
    return { x, y, ...p };
  });
  const linePath = chartCoords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ');
  const areaPath =
    chartCoords.length > 0
      ? `${linePath} L ${chartCoords[chartCoords.length - 1].x.toFixed(1)} ${(H - padB).toFixed(1)} L ${chartCoords[0].x.toFixed(1)} ${(H - padB).toFixed(1)} Z`
      : '';
  const activePoint =
    hoveredIdx !== null && chartCoords[hoveredIdx]
      ? chartCoords[hoveredIdx]
      : chartCoords[chartCoords.length - 1];

  // Top 12 Most Valuable Assets
  const topAssets = useMemo(() => {
    return [...enrichedDrops]
      .sort((a, b) =>
        valueSystem === 'ssf'
          ? b.totalSsfPoints - a.totalSsfPoints
          : b.totalChaos - a.totalChaos
      )
      .slice(0, 12);
  }, [enrichedDrops, valueSystem]);

  // Donut Geometry
  const donutRadius = 64;
  const donutCircumference = 2 * Math.PI * donutRadius;
  const totalDonutVal = categoryBreakdown.reduce((s, c) => s + c.val, 0);
  let donutOffset = 0;

  if (selectedGame === 'poe2') {
    return (
      <div className="w-full max-w-5xl mx-auto space-y-5 pb-16 font-sans text-slate-200">
        <div className="p-6 sm:p-8 rounded-2xl border border-cyan-500/35 bg-gradient-to-br from-cyan-950/30 via-slate-950 to-slate-900/90 space-y-4 shadow-xl">
          <button
            type="button"
            onClick={onBackToAssetTracker}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Asset Tracker</span>
          </button>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/35 text-cyan-300 text-[11px] font-mono font-bold uppercase block w-fit">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Path of Exile 2 Wealth Analytics • In Development</span>
          </div>
          <h1 className="text-2xl font-cinzel font-bold text-white">
            PoE 2 Wealth &amp; Pace Analytics — Coming Soon
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Automated PoE 2 wealth timelines and category breakdowns are currently in development while Grinding Gear Games prepares the public Path of Exile 2 Stash Tab API.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-5 pb-16 font-sans text-slate-200">
      {/* Top Executive Header Bar with Backlinks */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-[#0e1320] via-indigo-950/35 to-[#0e1320] p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onBackToAssetTracker}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
              <span>Back to Asset Tracker</span>
            </button>
            {userAccount?.displayName && onOpenProfile && (
              <button
                type="button"
                onClick={() => onOpenProfile(userAccount.displayName)}
                className="px-3 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/40 text-xs font-bold text-indigo-200 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <User className="w-3.5 h-3.5 text-indigo-300" />
                <span>@{userAccount.displayName} Profile</span>
              </button>
            )}
            <span
              className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
                cloudSynced
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-900 border-slate-700 text-slate-400'
              }`}
            >
              <Cloud className="w-3 h-3" />
              <span>{cloudSynced ? 'Cloud Synced' : normalizedHandle ? 'Local + Cloud Ready' : 'Local Preview'}</span>
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black font-cinzel text-white flex items-center gap-2 pt-1">
            <TrendingUp className="w-6 h-6 text-amber-400" />
            <span>Wealth &amp; Pace Analytics</span>
          </h1>
          <p className="text-xs text-slate-400">
            Full page stash wealth trajectory, farming pace, top yielding tabs, and category breakdown synced to your profile and league.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* League Switcher (Per League D1 Snapshots) */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <select
              value={selectedLeague}
              onChange={(e) => {
                const next = e.target.value;
                setSelectedLeague(next);
                loadCloudData(next);
              }}
              className="bg-transparent text-xs font-bold text-slate-100 focus:outline-none cursor-pointer max-w-[230px]"
            >
              {Array.from(new Set([selectedLeague, ...availableLeagues].filter(Boolean))).map((lg) => (
                <option key={lg} value={lg} className="bg-slate-950 text-slate-100">
                  {lg}
                </option>
              ))}
            </select>
          </div>

          {/* Pricing System Toggle */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-indigo-500/25 text-xs font-bold">
            <button
              type="button"
              onClick={() => setValueSystem('ninja')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                valueSystem === 'ninja'
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-400/50'
                  : 'text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              poe.ninja ({ninjaLeagueLabel})
            </button>
            <button
              type="button"
              onClick={() => setValueSystem('ssf')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                valueSystem === 'ssf'
                  ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-400/50'
                  : 'text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              SSF Utility
            </button>
          </div>

          {normalizedHandle ? (
            <button
              type="button"
              onClick={() => loadCloudData(selectedLeague)}
              disabled={loadingCloud}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${loadingCloud ? 'animate-spin' : ''}`} />
              <span>Refresh Cloud</span>
            </button>
          ) : (
            onOpenAuthModal && (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white cursor-pointer shadow"
              >
                Sign In to Sync Cloud
              </button>
            )
          )}
        </div>
      </div>

      {/* 5 Executive KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3.5">
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/20 via-[#0d111a] to-[#0d111a] p-4 space-y-1 shadow-lg">
          <div className="text-[10px] font-mono uppercase tracking-wider text-amber-300/90 flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5" />
            <span>Total Stash Net Worth</span>
          </div>
          <div className="text-2xl font-black font-mono text-white">
            {valueSystem === 'ssf' ? formatSsfPoints(totalSsfPts) : formatValue(totalChaos, divineChaos)}
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            {valueSystem === 'ssf'
              ? `${formatValue(totalChaos, divineChaos)} market value`
              : `${Math.round(totalChaos).toLocaleString()}c • 1 Div = ${divineChaos}c`}
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 via-[#0d111a] to-[#0d111a] p-4 space-y-1 shadow-lg">
          <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-300/90 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5" />
            <span>Wealth Pace</span>
          </div>
          <div className="text-2xl font-black font-mono text-emerald-300">
            {valueSystem === 'ssf' ? `${formatSsfPoints(ssfPerHour)}/hr` : `${divPerHour} Div/hr`}
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            {chaosPerHour.toLocaleString()}c/hr {mapsRun > 0 ? `• ${chaosPerMap}c/map (${mapsRun} maps)` : `• ${durationMinutes}m logged`}
          </div>
        </div>

        <div className="rounded-2xl border border-sky-500/30 bg-gradient-to-br from-sky-950/20 via-[#0d111a] to-[#0d111a] p-4 space-y-1 shadow-lg">
          <div className="text-[10px] font-mono uppercase tracking-wider text-sky-300/90 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Timeline Growth</span>
          </div>
          <div className="text-2xl font-black font-mono text-sky-200">
            {growthDelta >= 0 ? '+' : ''}
            {formatValue(Math.abs(growthDelta), divineChaos)}
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            {growthPct !== null ? `${growthPct >= 0 ? '+' : ''}${growthPct}% across ${timelinePoints.length} points` : `${timelinePoints.length} checkpoints logged`}
          </div>
        </div>

        <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-950/20 via-[#0d111a] to-[#0d111a] p-4 space-y-1 shadow-lg">
          <div className="text-[10px] font-mono uppercase tracking-wider text-purple-300/90 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>High Value Drops</span>
          </div>
          <div className="text-2xl font-black font-mono text-white">
            {sTierCount} S <span className="text-base text-slate-500">/</span> {aTierCount} A
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            {enrichedDrops.length.toLocaleString()} total stacks • {deaths} deaths
          </div>
        </div>

        <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/25 via-[#0d111a] to-[#0d111a] p-4 space-y-1 shadow-lg">
          <div className="text-[10px] font-mono uppercase tracking-wider text-indigo-300/90 flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5" />
            <span>Top Yielding Tab</span>
          </div>
          <div className="text-xl font-black text-white truncate" title={topTab?.tabName || 'None'}>
            {topTab ? topTab.tabName : 'No Tabs Yet'}
          </div>
          <div className="text-[11px] font-mono text-indigo-300">
            {topTab
              ? `${valueSystem === 'ssf' ? formatSsfPoints(topTab.ssfPts) : formatValue(topTab.chaos, divineChaos)} (${topTab.pct}% share)`
              : 'Sync stash in Asset Tracker'}
          </div>
        </div>
      </section>

      {/* Hero Full Width Wealth Timeline */}
      <section className="rounded-2xl border border-slate-800 bg-[#0d111a] p-5 space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black font-cinzel text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <span>Interactive Wealth Timeline</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Hover any checkpoint to inspect exact stash value, item stack volume, and league progression.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activePoint && (
              <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-mono text-amber-200 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-bold">{activePoint.label}:</span>
                <span className="text-white font-black">{formatValue(activePoint.totalChaos, divineChaos)}</span>
                <span className="text-slate-400">({activePoint.totalItems} stacks)</span>
              </div>
            )}

            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => {
                  setTimelineMode('checkpoints');
                  setHoveredIdx(null);
                }}
                className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                  timelineMode === 'checkpoints'
                    ? 'bg-indigo-600/30 text-white border border-indigo-400/50'
                    : 'text-slate-400 hover:text-white border border-transparent'
                }`}
              >
                Live Checkpoints ({checkpoints.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setTimelineMode('sessions');
                  setHoveredIdx(null);
                }}
                className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                  timelineMode === 'sessions'
                    ? 'bg-indigo-600/30 text-white border border-indigo-400/50'
                    : 'text-slate-400 hover:text-white border border-transparent'
                }`}
              >
                Saved Sessions ({leagueSessions.length})
              </button>
            </div>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[540px] h-60 overflow-visible">
            <defs>
              <linearGradient id="fullWealthAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.38" />
                <stop offset="65%" stopColor="#6366f1" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#0d111a" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid Lines & Y Axis Labels */}
            {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
              const y = padT + (H - padT - padB) * (1 - frac);
              const val = maxChartVal * frac;
              return (
                <g key={frac}>
                  <line
                    x1={padL}
                    y1={y}
                    x2={W - padR}
                    y2={y}
                    stroke="#1e293b"
                    strokeDasharray={frac === 0 ? undefined : '4 4'}
                    strokeWidth="1"
                  />
                  <text
                    x={padL - 8}
                    y={y + 3.5}
                    textAnchor="end"
                    fill="#94a3b8"
                    fontSize="10"
                    fontFamily="Fira Code, monospace"
                  >
                    {formatValue(Math.round(val), divineChaos)}
                  </text>
                </g>
              );
            })}

            {/* Area & Line */}
            {areaPath && <path d={areaPath} fill="url(#fullWealthAreaGrad)" />}
            {linePath && (
              <path
                d={linePath}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Interactive Nodes & X Axis Labels */}
            {chartCoords.map((c, idx) => {
              const isHovered = hoveredIdx === idx;
              const showLabel =
                chartCoords.length <= 8 ||
                idx === 0 ||
                idx === chartCoords.length - 1 ||
                idx % Math.ceil(chartCoords.length / 6) === 0;
              return (
                <g key={idx}>
                  {isHovered && (
                    <line
                      x1={c.x}
                      y1={padT}
                      x2={c.x}
                      y2={H - padB}
                      stroke="#fbbf24"
                      strokeOpacity="0.35"
                      strokeDasharray="3 3"
                    />
                  )}
                  <circle
                    cx={c.x}
                    cy={c.y}
                    r={isHovered ? 6.5 : 4}
                    fill={isHovered ? '#ffffff' : '#fbbf24'}
                    stroke="#0d111a"
                    strokeWidth="2"
                    className="cursor-pointer transition-all"
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  />
                  {showLabel && (
                    <text
                      x={c.x}
                      y={H - 8}
                      textAnchor="middle"
                      fill="#94a3b8"
                      fontSize="10"
                      fontFamily="Fira Code, monospace"
                    >
                      {c.at}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-800/80">
          <span>League: {selectedLeague}</span>
          <span>
            {cloudUpdatedAt
              ? `Last Cloud Save: ${new Date(cloudUpdatedAt).toLocaleString()}`
              : lastSyncedAt
              ? `Last Local Sync: ${lastSyncedAt}`
              : 'Sync stash in Asset Tracker to record checkpoints'}
          </span>
        </div>
      </section>

      {/* Two Column Deep Analytics: Category Breakdown + Top Yielding Tabs */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Category Breakdown Donut & Table */}
        <div className="rounded-2xl border border-slate-800 bg-[#0d111a] p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black font-cinzel text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-indigo-400" />
              <span>Category Breakdown</span>
            </h2>
            <span className="text-[11px] font-mono text-slate-400">{categoryBreakdown.length} active categories</span>
          </div>

          {totalDonutVal === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No valued items synced for this league yet.{' '}
              <button
                type="button"
                onClick={onBackToAssetTracker}
                className="text-amber-300 underline font-bold cursor-pointer"
              >
                Open Asset Tracker
              </button>{' '}
              to scan your tabs.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <svg viewBox="0 0 160 160" className="w-40 h-40 shrink-0">
                  <circle cx="80" cy="80" r={donutRadius} fill="none" stroke="#1e293b" strokeWidth="18" />
                  {categoryBreakdown.map((cat, idx) => {
                    const fraction = cat.val / totalDonutVal;
                    const dash = fraction * donutCircumference;
                    const offset = -donutOffset;
                    donutOffset += dash;
                    const color = SLICE_COLORS[idx % SLICE_COLORS.length];
                    const isActive = hoveredCat === cat.category;
                    return (
                      <circle
                        key={cat.category}
                        cx="80"
                        cy="80"
                        r={donutRadius}
                        fill="none"
                        stroke={color}
                        strokeWidth={isActive ? 22 : 18}
                        strokeDasharray={`${dash} ${donutCircumference - dash}`}
                        strokeDashoffset={offset}
                        transform="rotate(-90 80 80)"
                        className="cursor-pointer transition-all"
                        onMouseEnter={() => setHoveredCat(cat.category)}
                        onMouseLeave={() => setHoveredCat(null)}
                      />
                    );
                  })}
                  <text x="80" y="75" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="900" fontFamily="Fira Code, monospace">
                    {valueSystem === 'ssf' ? formatSsfPoints(totalSsfPts) : formatValue(totalChaos, divineChaos)}
                  </text>
                  <text x="80" y="92" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="Fira Code, monospace">
                    {hoveredCat || 'TOTAL STASH'}
                  </text>
                </svg>

                <div className="flex-1 w-full space-y-2">
                  {categoryBreakdown.map((cat, idx) => {
                    const color = SLICE_COLORS[idx % SLICE_COLORS.length];
                    return (
                      <div
                        key={cat.category}
                        onMouseEnter={() => setHoveredCat(cat.category)}
                        onMouseLeave={() => setHoveredCat(null)}
                        className={`p-2 rounded-xl border transition-colors ${
                          hoveredCat === cat.category
                            ? 'bg-slate-900 border-indigo-500/50'
                            : 'bg-slate-950/60 border-slate-800/80'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                            <span className="font-bold text-slate-200 truncate">{cat.category}</span>
                            <span className="text-[10px] font-mono text-slate-500">({cat.count})</span>
                          </div>
                          <div className="font-mono text-right shrink-0">
                            <span className="text-amber-300 font-bold">
                              {valueSystem === 'ssf' ? formatSsfPoints(cat.ssfPts) : formatValue(cat.chaos, divineChaos)}
                            </span>
                            <span className="text-slate-500 ml-1.5 text-[11px]">{cat.pct}%</span>
                          </div>
                        </div>
                        {cat.topItem && (
                          <div className="text-[10px] text-slate-400 mt-1 pl-4 truncate">
                            Top: <span className="text-slate-200">{cat.topItem.shortName || cat.topItem.name}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Top Yielding Tabs Leaderboard */}
        <div className="rounded-2xl border border-slate-800 bg-[#0d111a] p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black font-cinzel text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span>Top Yielding Tabs</span>
            </h2>
            <span className="text-[11px] font-mono text-slate-400">{tabYields.length} valued tabs</span>
          </div>

          {tabYields.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              Sync your stash tabs in{' '}
              <button
                type="button"
                onClick={onBackToAssetTracker}
                className="text-amber-300 underline font-bold cursor-pointer"
              >
                Asset Tracker
              </button>{' '}
              to rank tab yields.
            </div>
          ) : (
            <div className="space-y-3">
              {tabYields.slice(0, 10).map((tab, idx) => {
                const widthPct = Math.max(4, Math.round((tab.val / maxTabYield) * 100));
                return (
                  <div key={tab.tabName} className="space-y-1">
                    <div className="flex items-center justify-between text-xs gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 text-[11px] font-mono font-bold text-slate-500">#{idx + 1}</span>
                        <span className="font-bold text-slate-100 truncate">{tab.tabName}</span>
                        <span className="text-[10px] font-mono text-slate-500">({tab.stacks} stacks)</span>
                      </div>
                      <div className="font-mono shrink-0">
                        <span className="text-emerald-300 font-bold">
                          {valueSystem === 'ssf' ? formatSsfPoints(tab.ssfPts) : formatValue(tab.chaos, divineChaos)}
                        </span>
                        <span className="text-slate-500 ml-1.5 text-[11px]">{tab.pct}%</span>
                      </div>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 transition-all"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                    {tab.topItemName && (
                      <div className="text-[10px] text-slate-500 pl-7 truncate">
                        Headline item: <span className="text-slate-300">{tab.topItemName}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Top 12 Most Valuable Assets Showcase */}
      {topAssets.length > 0 && (
        <section className="rounded-2xl border border-slate-800 bg-[#0d111a] p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black font-cinzel text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Top 12 Most Valuable Assets</span>
            </h2>
            <button
              type="button"
              onClick={onBackToAssetTracker}
              className="text-xs font-bold text-indigo-300 hover:text-indigo-200 cursor-pointer"
            >
              Inspect All {enrichedDrops.length} Stacks in Asset Tracker &rarr;
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {topAssets.map((item) => (
              <div
                key={item.key}
                className="p-3 rounded-xl border border-slate-800 bg-slate-950/70 hover:border-amber-500/40 transition-colors flex items-center gap-3"
              >
                <div className="w-11 h-11 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                  {item.icon ? (
                    <img src={item.icon} alt="" className="w-9 h-9 object-contain" />
                  ) : (
                    <Coins className="w-5 h-5 text-amber-400/70" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[9px] font-mono font-black px-1.5 py-0.5 rounded border ${TIER_STYLES[item.tier]}`}>
                      {item.tier}
                    </span>
                    <a
                      href={buildPoeWikiUrl(item.shortName || item.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Open ${item.shortName || item.name} on PoE Wiki`}
                      className="text-xs font-bold text-white hover:text-amber-200 hover:underline decoration-amber-400/70 underline-offset-2 truncate"
                    >
                      {item.shortName || item.name}
                    </a>
                  </div>
                  <div className="text-[11px] font-mono text-amber-300 font-bold mt-0.5">
                    {valueSystem === 'ssf' ? formatSsfPoints(item.totalSsfPoints) : formatValue(item.totalChaos, divineChaos)}
                    <span className="text-slate-500 font-normal ml-1.5">x{item.quantity}</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 truncate">
                    {item.tabName || 'Stash'} • {item.category}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Saved Cloud Sessions History for This League */}
      {leagueSessions.length > 0 && (
        <section className="rounded-2xl border border-slate-800 bg-[#0d111a] p-5 space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black font-cinzel text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-emerald-400" />
              <span>Saved Cloud Sessions ({selectedLeague})</span>
            </h2>
            <span className="text-[11px] font-mono text-slate-400">{leagueSessions.length} sessions stored in Cloud</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-mono uppercase text-slate-400">
                  <th className="py-2 pr-3">Session</th>
                  <th className="py-2 px-3">Strategy</th>
                  <th className="py-2 px-3 text-right">Maps</th>
                  <th className="py-2 px-3 text-right">Duration</th>
                  <th className="py-2 px-3 text-right">Total Value</th>
                  <th className="py-2 px-3 text-right">Pace</th>
                  <th className="py-2 pl-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {leagueSessions.map((s) => {
                  const sessionChaos = Number(s.totalChaos || 0);
                  const sessionHours = Math.max(1 / 60, Number(s.durationMinutes || 60) / 60);
                  const sessionCph = Math.round(sessionChaos / sessionHours);
                  return (
                    <tr key={s.id} className="hover:bg-slate-900/50">
                      <td className="py-2.5 pr-3 font-bold text-slate-100">{s.title}</td>
                      <td className="py-2.5 px-3 text-indigo-300 font-mono text-[11px]">{s.strategy || 'General'}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-300">{s.mapsRun || 0}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-300">{s.durationMinutes || 0}m</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-300">
                        {formatValue(sessionChaos, divineChaos)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-300">
                        {sessionCph > 0 ? `${sessionCph.toLocaleString()}c/hr` : 'N/A'}
                      </td>
                      <td className="py-2.5 pl-3 text-right font-mono text-slate-400">
                        {s.createdAtIso ? new Date(s.createdAtIso).toLocaleDateString() : ''}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};
