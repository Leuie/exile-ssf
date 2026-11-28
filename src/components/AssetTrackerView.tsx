import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AssetPoe2Notice } from './assets/AssetPoe2Notice';
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
  BarChart3,
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
  Cloud,
  Trophy
} from 'lucide-react';
import { parsePoeClipboardTooltip } from '../utils/poeItemParser';
import { buildXlsxBlob, triggerFileDownload, type SheetDefinition } from '../utils/spreadsheetEngine';
import type { UserAccount, LookingForItem } from '../types';
import {
  BULK_NOISE_REGEX,
  CATEGORY_ORDER,
  CURRENCY_SUBFILTERS,
  DEFAULT_LEAGUES,
  DEFAULT_SSF_WEIGHTS,
  DEMO_SAMPLE_DROPS,
  DIV_SUBFILTERS,
  EQUIPMENT_BRACKETS,
  ESSENCE_SUBFILTERS,
  GEM_SUBFILTERS,
  MAP_SUBFILTERS,
  POESESSID_OPTIN_STORAGE_KEY,
  PREFS_STORAGE_KEY,
  STRATEGY_PRESETS,
  TIER_RANK,
  TIER_STYLES,
  UNIQUE_SUBFILTERS,
  WEIGHTS_STORAGE_KEY,
  WORKSPACE_STORAGE_KEY,
  autoMatchCanonicalTabs,
  computeSnapshotDiff,
  computeSsfUtilityPoints,
  formatCountdown,
  buildPoeWikiUrl,
  formatSsfPoints,
  formatValue,
  lookupNinjaPrice,
  mergeDropLists,
  parseClientGggStashJson,
  playSubtleChime,
  resolveTier,
  type CanonicalTabMapping,
  type EnrichedDropItem,
  type ItemTier,
  type LeagueOption,
  type SavedFarmingSession,
  type SortField,
  type SsfWeightsConfig,
  type StashTabMeta,
  type SyncCheckpoint,
  type TrackedDropItem
} from './assets/assetEngine';
import { WeightsEditorDrawer } from './assets/WeightsEditorDrawer';
import { LootSparkline } from './assets/LootSparkline';
import { CanonicalTabMapper } from './assets/CanonicalTabMapper';
import { AssetAnalyticsDeck } from './assets/AssetAnalyticsDeck';
import { MapCostCalculatorWidget } from './assets/MapCostCalculatorWidget';
import { ToolWidgetGrid, type ToolWidgetDefinition } from './ui/ToolWidgetGrid';
import {
  readUnifiedPoeSession,
  saveUnifiedPoeSession,
  isPoeDisclaimerAcknowledged,
  markPoeDisclaimerAcknowledged
} from '../utils/poeSession';
import { readActiveStrategy, saveActiveStrategy } from '../utils/activeCharacter';

interface AssetTrackerViewProps {
  selectedGame?: 'poe1' | 'poe2';
  userAccount?: UserAccount | null;
  onOpenAuthModal?: () => void;
  onOpenAnalytics?: () => void;
}

export const AssetTrackerView: React.FC<AssetTrackerViewProps> = ({
  selectedGame = 'poe1',
  userAccount,
  onOpenAnalytics
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
  useEffect(() => {
    setGame(selectedGame);
  }, [selectedGame]);
  const [leagueOptions, setLeagueOptions] = useState<LeagueOption[]>(DEFAULT_LEAGUES);
  const [linkedLeagueId, setLinkedLeagueId] = useState<string>(savedPrefs.linkedLeagueId || 'poe1-330-umbra');
  const [wishlistItems, setWishlistItems] = useState<LookingForItem[]>([]);
  const [claimedWishIds, setClaimedWishIds] = useState<Record<string, boolean>>({});
  const [sharedStashKeys, setSharedStashKeys] = useState<Record<string, boolean>>({});

  // Dashboard Visual Modes
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
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
  const [includeEquippedGear, setIncludeEquippedGear] = useState<boolean>(
    savedPrefs.includeEquippedGear !== undefined ? Boolean(savedPrefs.includeEquippedGear) : true
  );
  const [showWeightsEditor, setShowWeightsEditor] = useState<boolean>(false);
  const [showAboutTracker, setShowAboutTracker] = useState<boolean>(false);
  const [ssfWeights, setSsfWeights] = useState<SsfWeightsConfig>(() => {
    try {
      const raw = localStorage.getItem(WEIGHTS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...DEFAULT_SSF_WEIGHTS,
          ...parsed,
          categoryMultipliers: { ...DEFAULT_SSF_WEIGHTS.categoryMultipliers, ...(parsed?.categoryMultipliers || {}) },
          customOverrides: { ...DEFAULT_SSF_WEIGHTS.customOverrides, ...(parsed?.customOverrides || {}) }
        };
      }
    } catch {}
    return DEFAULT_SSF_WEIGHTS;
  });

  // poe.ninja Pricing State
  const [ninjaLeagueParam, setNinjaLeagueParam] = useState<string>('auto');
  const [ninjaResolvedLeague, setNinjaResolvedLeague] = useState<string>('');
  const [divineChaos, setDivineChaos] = useState<number>(150);
  const [ninjaPrices, setNinjaPrices] = useState<Record<string, number>>({ 'chaos orb': 1 });
  const [loadingNinja, setLoadingNinja] = useState<boolean>(false);

  // Stash API Connection State (POESESSID stays strictly in browser memory)
  const [accountName, setAccountName] = useState<string>(
    (savedPrefs.accountName && savedPrefs.accountName !== 'Leuie#0001' ? savedPrefs.accountName : '') ||
      (userAccount?.poeAccountName && userAccount.poeAccountName !== 'Leuie#0001' ? userAccount.poeAccountName : '') ||
      ''
  );
  const [leagueName, setLeagueName] = useState<string>(
    savedPrefs.leagueName || 'Ravenwatch Covens of Umbra GSF (PL87651)'
  );
  // Unified local POESESSID persistence (30 day expiry, shared across all tools, never sent to any database)
  const savedPoesessidOptIn = useMemo(() => readUnifiedPoeSession(), []);

  // Permanent one-time POESESSID disclaimer acknowledgment check
  const savedDisclaimerValid = useMemo(() => isPoeDisclaimerAcknowledged(), []);

  const [detectedLeagues, setDetectedLeagues] = useState<string[]>([]);
  const [detectingLeagues, setDetectingLeagues] = useState<boolean>(false);
  const [rememberPoesessid, setRememberPoesessid] = useState<boolean>(Boolean(savedPoesessidOptIn));

  // Sync changes from Unified Tool Setup modal in real time
  useEffect(() => {
    const handleToolSetupUpdated = () => {
      try {
        const rawPrefs = localStorage.getItem(PREFS_STORAGE_KEY);
        if (rawPrefs) {
          const parsed = JSON.parse(rawPrefs);
          if (parsed?.accountName) setAccountName(parsed.accountName);
          if (parsed?.leagueName) setLeagueName(parsed.leagueName);
        }
        const sess = readUnifiedPoeSession();
        if (sess?.poesessid) {
          setPoesessid(sess.poesessid);
          setRememberPoesessid(true);
          setAcceptedRiskDisclaimer(true);
          setShowDisclaimerBanner(false);
        } else {
          setPoesessid('');
          setRememberPoesessid(false);
        }
      } catch {}
    };
    window.addEventListener('exile-tool-setup-updated', handleToolSetupUpdated);
    const handleStrategyUpdated = () => {
      const st = readActiveStrategy();
      if (st?.strategy) setStrategyTag(st.strategy);
    };
    window.addEventListener('exile-active-strategy-updated', handleStrategyUpdated);
    return () => {
      window.removeEventListener('exile-tool-setup-updated', handleToolSetupUpdated);
      window.removeEventListener('exile-active-strategy-updated', handleStrategyUpdated);
    };
  }, []);
  const [poesessid, setPoesessid] = useState<string>(savedPoesessidOptIn?.poesessid || '');
  const [acceptedRiskDisclaimer, setAcceptedRiskDisclaimer] = useState<boolean>(
    Boolean(savedDisclaimerValid || savedPoesessidOptIn?.accepted)
  );
  const [showDisclaimerBanner, setShowDisclaimerBanner] = useState<boolean>(!savedDisclaimerValid);

  const handleToggleDisclaimer = (checked: boolean) => {
    setAcceptedRiskDisclaimer(checked);
    if (checked) {
      markPoeDisclaimerAcknowledged();
      setShowDisclaimerBanner(false);
    }
  };
  const [stashTabs, setStashTabs] = useState<StashTabMeta[]>(
    Array.isArray(savedWorkspace.stashTabs) ? savedWorkspace.stashTabs : []
  );
  const [canonicalMapping, setCanonicalMapping] = useState<CanonicalTabMapping>(
    savedPrefs.canonicalMapping && typeof savedPrefs.canonicalMapping === 'object' ? savedPrefs.canonicalMapping : {}
  );
  const [selectedTabIndices, setSelectedTabIndices] = useState<number[]>(
    Array.isArray(savedPrefs.selectedTabIndices) ? savedPrefs.selectedTabIndices : []
  );

  const applyCanonicalMapping = (nextMap: CanonicalTabMapping) => {
    setCanonicalMapping(nextMap);
    const indices = Array.from(
      new Set(
        Object.values(nextMap).filter((v): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0)
      )
    ).slice(0, 18);
    if (indices.length > 0) setSelectedTabIndices(indices);
  };
  const [activeTabFilter, setActiveTabFilter] = useState<string>('ALL');
  const [loadingTabs, setLoadingTabs] = useState<boolean>(false);
  const [snapshotting, setSnapshotting] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<{ current: number; total: number; tabName: string } | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>(savedWorkspace.lastSyncedAt || '');
  const [statusNotice, setStatusNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Direct Browser JSON Fallback State
  const [browserJsonInput, setBrowserJsonInput] = useState<string>('');
  const [browserJsonTabIndex, setBrowserJsonTabIndex] = useState<number>(0);

  // Auto Pull Timer & Live Client.txt Watcher (Wall clock based so background tabs never stall)
  const [autoSyncMinutes, setAutoSyncMinutes] = useState<number>(Number(savedPrefs.autoSyncMinutes || 0));
  const [secondsUntilSync, setSecondsUntilSync] = useState<number>(0);
  const nextSyncAtMsRef = useRef<number>(0);
  const [checkpoints, setCheckpoints] = useState<SyncCheckpoint[]>(
    Array.isArray(savedWorkspace.checkpoints) ? savedWorkspace.checkpoints : []
  );
  const clientFileHandleRef = useRef<any>(null);
  const [watchingClientTxt, setWatchingClientTxt] = useState<boolean>(false);
  const [lastZoneName, setLastZoneName] = useState<string>('');
  const [copiedPathId, setCopiedPathId] = useState<string | null>(null);

  // Active Session State
  const [sessionTitle, setSessionTitle] = useState<string>(savedWorkspace.sessionTitle || 'T16 Mapping & Dump Session');
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
  const [optInWealthLadder, setOptInWealthLadder] = useState<boolean>(Boolean(savedPrefs.optInWealthLadder));

  const normalizedHandle = (userAccount?.displayName || '').trim().replace(/^@/, '').toLowerCase();

  useEffect(() => {
    document.title = 'Asset Tracker | Exile SSF';
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(WEIGHTS_STORAGE_KEY, JSON.stringify(ssfWeights));
    } catch {}
  }, [ssfWeights]);

  useEffect(() => {
    try {
      localStorage.setItem(
        PREFS_STORAGE_KEY,
        JSON.stringify({ accountName, leagueName, linkedLeagueId, selectedTabIndices, canonicalMapping, strategyTag, valueSystem, autoSyncMinutes, optInWealthLadder })
      );
    } catch {}
  }, [accountName, leagueName, linkedLeagueId, selectedTabIndices, canonicalMapping, strategyTag, valueSystem, autoSyncMinutes, optInWealthLadder]);

  useEffect(() => {
    if (rememberPoesessid && poesessid.trim()) {
      saveUnifiedPoeSession({ poesessid: poesessid.trim(), accountName, leagueName });
    }
  }, [rememberPoesessid, poesessid, accountName, leagueName]);

  // Persist real synced loot locally (never persist DEMO data or POESESSID)
  useEffect(() => {
    if (isDemoMode) return;
    try {
      localStorage.setItem(
        WORKSPACE_STORAGE_KEY,
        JSON.stringify({
          activeDrops: activeDrops.slice(0, 1500),
          beforeSnapshot: beforeSnapshot ? { at: beforeSnapshot.at, items: beforeSnapshot.items.slice(0, 1500) } : null,
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
  }, [isDemoMode, activeDrops, beforeSnapshot, stashTabs, checkpoints, lastSyncedAt, sessionTitle, mapsRun, durationMinutes, deaths]);

  const saveStashToCloud = useCallback(
    async (silent = true) => {
      if (!normalizedHandle || isDemoMode) return;
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
              beforeSnapshot: beforeSnapshot ? { at: beforeSnapshot.at, items: beforeSnapshot.items.slice(0, 1500) } : null,
              stashTabs,
              selectedTabIndices,
              checkpoints,
              lastSyncedAt,
              sessionTitle,
              strategyTag,
              leagueName,
              linkedLeagueId,
              mapsRun,
              durationMinutes,
              deaths,
              optInWealthLadder,
              ladderSummary: optInWealthLadder
                ? (() => {
                    let sumChaos = 0;
                    let sCount = 0;
                    let aCount = 0;
                    let topItem: { name: string; icon: string; chaos: number } | null = null;
                    const tabMap = new Map<string, number>();
                    for (const it of activeDrops) {
                      const unitC = lookupNinjaPrice(it, ninjaPrices);
                      const totC = Math.round(unitC * it.quantity * 100) / 100;
                      sumChaos += totC;
                      const t = resolveTier(unitC, totC, divineChaos);
                      if (t === 'S') sCount += 1;
                      else if (t === 'A') aCount += 1;
                      if (!topItem || totC > topItem.chaos) {
                        topItem = { name: it.shortName || it.name, icon: it.icon || '', chaos: totC };
                      }
                      const tn = it.tabName || 'Stash';
                      tabMap.set(tn, (tabMap.get(tn) || 0) + totC);
                    }
                    let topTabName = '';
                    let topTabChaos = 0;
                    for (const [tn, val] of tabMap.entries()) {
                      if (val > topTabChaos) {
                        topTabName = tn;
                        topTabChaos = Math.round(val);
                      }
                    }
                    const hrs = Math.max(1 / 60, (durationMinutes || 60) / 60);
                    return {
                      totalChaos: Math.round(sumChaos),
                      divineChaos,
                      totalDivines: Math.round((sumChaos / Math.max(1, divineChaos)) * 100) / 100,
                      chaosPerHour: Math.round(sumChaos / hrs),
                      divPerHour: Math.round((sumChaos / hrs / Math.max(1, divineChaos)) * 100) / 100,
                      sTierCount: sCount,
                      aTierCount: aCount,
                      totalStacks: activeDrops.length,
                      topTabName,
                      topTabChaos,
                      topItemName: topItem?.name || '',
                      topItemIcon: topItem?.icon || '',
                      topItemChaos: topItem ? Math.round(topItem.chaos) : 0,
                      checkpoints: checkpoints.slice(-12)
                    };
                  })()
                : null
            }
          })
        });
        if (res.ok) {
          setCloudSaveState('saved');
          if (!silent) {
            setStatusNotice({ type: 'ok', text: `Saved ${activeDrops.length} stash stacks to your Exile SSF cloud account!` });
          }
        } else {
          setCloudSaveState('idle');
        }
      } catch {
        setCloudSaveState('idle');
      }
    },
    [
      normalizedHandle,
      isDemoMode,
      activeDrops,
      beforeSnapshot,
      stashTabs,
      selectedTabIndices,
      checkpoints,
      lastSyncedAt,
      sessionTitle,
      strategyTag,
      leagueName,
      linkedLeagueId,
      mapsRun,
      durationMinutes,
      deaths,
      optInWealthLadder,
      ninjaPrices,
      divineChaos
    ]
  );

  useEffect(() => {
    if (!cloudHydrated || !normalizedHandle || isDemoMode) return;
    if (activeDrops.length === 0 && stashTabs.length === 0 && !beforeSnapshot) return;
    const t = setTimeout(() => {
      saveStashToCloud(true);
    }, 1200);
    return () => clearTimeout(t);
  }, [cloudHydrated, normalizedHandle, isDemoMode, activeDrops, beforeSnapshot, stashTabs, checkpoints, mapsRun, durationMinutes, deaths, optInWealthLadder, saveStashToCloud]);

  const handleLoadDemoData = () => {
    setIsDemoMode(true);
    setActiveDrops(DEMO_SAMPLE_DROPS);
    setMapsRun(18);
    setDurationMinutes(45);
    setDeaths(0);
    setCheckpoints([
      { at: '0:00', totalItems: 0, totalChaos: 0 },
      { at: '0:15', totalItems: 22, totalChaos: 145 },
      { at: '0:30', totalItems: 54, totalChaos: 310 },
      { at: '0:45', totalItems: 84, totalChaos: 520 }
    ]);
    setSetupOpen(false);
    setStatusNotice({ type: 'ok', text: 'Loaded DEMO sample data so you can explore tiering, weights, and filters.' });
  };

  const handleResetSession = () => {
    setIsDemoMode(false);
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
    setStatusNotice({ type: 'ok', text: 'Cleared current farming session.' });
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
        const dataRes = await fetch(`/api/data?league=${encodeURIComponent(linkedLeagueId)}`, { credentials: 'include' });
        if (dataRes.ok && !cancelled) {
          const data: any = await dataRes.json();
          const wList = Array.isArray(data?.wishlist) ? data.wishlist : data?.lookingForItems;
          if (Array.isArray(wList)) setWishlistItems(wList);
          if (Array.isArray(data?.customLeagues) && data.customLeagues.length > 0) {
            const customOpts: LeagueOption[] = data.customLeagues
              .filter((c: any) => c?.id && c?.name)
              .map((c: any) => ({ id: String(c.id), name: String(c.name), game: c.game === 'poe2' ? 'poe2' : 'poe1' }));
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
                setIsDemoMode(false);
                setActiveDrops(cs.activeDrops);
                setSetupOpen(false);
              }
              if (Array.isArray(cs.stashTabs) && cs.stashTabs.length > 0) setStashTabs(cs.stashTabs);
              if (Array.isArray(cs.selectedTabIndices) && cs.selectedTabIndices.length > 0) setSelectedTabIndices(cs.selectedTabIndices);
              if (cs.beforeSnapshot) setBeforeSnapshot(cs.beforeSnapshot);
              if (Array.isArray(cs.checkpoints)) setCheckpoints(cs.checkpoints);
              if (cs.lastSyncedAt) setLastSyncedAt(cs.lastSyncedAt);
              if (cs.sessionTitle) setSessionTitle(cs.sessionTitle);
              if (cs.strategyTag) setStrategyTag(cs.strategyTag);
              if (typeof cs.mapsRun === 'number') setMapsRun(cs.mapsRun);
              if (typeof cs.durationMinutes === 'number' && cs.durationMinutes > 0) setDurationMinutes(cs.durationMinutes);
              if (typeof cs.deaths === 'number') setDeaths(cs.deaths);
              if (typeof cs.optInWealthLadder === 'boolean') setOptInWealthLadder(cs.optInWealthLadder);
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
      const ssfPointsEach = computeSsfUtilityPoints(it, chaosEach, isWish, ssfWeights);
      const totalSsfPoints = Math.round(ssfPointsEach * it.quantity * 10) / 10;
      const tier = resolveTier(chaosEach, totalChaos, divineChaos);
      return { ...it, chaosEach, totalChaos, ssfPointsEach, totalSsfPoints, tier };
    });
  }, [activeDrops, ninjaPrices, divineChaos, openWishlistNames, ssfWeights]);

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
    if (isDemoMode) return [];
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
  }, [isDemoMode, wishlistItems, enrichedDrops]);

  const prevAlertCountRef = useRef<number>(0);
  useEffect(() => {
    if (isDemoMode) return;
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
  }, [isDemoMode, tierCounts.S, wishlistMatches, chimeEnabled, desktopAlertsEnabled]);

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
    const updated: LookingForItem = { ...wish, status: 'HAVE', fulfilledBy: finder, fulfilledAtIso: new Date().toISOString() };
    setClaimedWishIds((prev) => ({ ...prev, [wish.id]: true }));
    try {
      const wishRes = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ leagueId: linkedLeagueId, item: updated })
      });
      if (!wishRes.ok) {
        setClaimedWishIds((prev) => ({ ...prev, [wish.id]: false }));
        setStatusNotice({ type: 'err', text: 'Sign in required to mark wishlist items as found.' });
        return;
      }
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
            detail: `Detected automatically during ${strategyTag} farming session (+5 Honor).`,
            createdAtIso: new Date().toISOString()
          }
        })
      });
      setStatusNotice({
        type: 'ok',
        text: `Marked "${wish.itemName}" found for @${wish.displayName || wish.characterName} (+5 Honor awarded)!`
      });
    } catch {
      setClaimedWishIds((prev) => ({ ...prev, [wish.id]: false }));
      setStatusNotice({ type: 'err', text: 'Sign in required to update league wishlist.' });
    }
  };

  const handleShareToFreeStash = async (item: EnrichedDropItem) => {
    if (isDemoMode) return;
    const donor = userAccount?.displayName || userAccount?.characterName || 'Squad Exile';
    setSharedStashKeys((prev) => ({ ...prev, [item.key]: true }));
    try {
      await fetch('/api/stash-drops', {
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
      setStatusNotice({ type: 'err', text: 'Sign in required to share items to Free Stash.' });
    }
  };

  const handleShareRecapToFeed = async () => {
    if (enrichedDrops.length === 0 || isDemoMode) return;
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
            detail: `${mapsRun} maps in ${durationMinutes}m • ${valStr} poe.ninja benchmark • ${tierCounts.S} S Tier • ${uniqueCount} Uniques`,
            createdAtIso: new Date().toISOString()
          }
        })
      });
      setStatusNotice({ type: 'ok', text: 'Posted your farming session recap to the Private League Live Feed!' });
    } catch {
      setStatusNotice({ type: 'err', text: 'Sign in required to post recap to league feed.' });
    }
    setSharingRecap(false);
  };

  const handleExportXlsx = () => {
    const sheets: SheetDefinition[] = [
      {
        name: 'Current Session Drops',
        headers: ['Item Name', 'Tier', 'Category', 'Bracket', 'Tab', 'Quantity', 'Unit Chaos', 'Total Chaos', 'SSF Points', 'iLvl', 'Gem Lvl', 'Gem Quality'],
        rows: enrichedDrops.map((it) => [
          it.shortName, it.tier, it.category, it.subCategory || '', it.tabName,
          it.quantity, it.chaosEach, it.totalChaos, it.totalSsfPoints, it.ilvl || 0, it.gemLevel || 0, it.gemQuality || 0
        ])
      },
      {
        name: 'Saved Session History',
        headers: ['Date', 'Session Title', 'Strategy', 'League', 'Maps Run', 'Minutes', 'Deaths', 'Total Chaos', 'Stacks'],
        rows: savedSessions.map((s) => [
          new Date(s.createdAtIso).toLocaleDateString(), s.title, s.strategy || 'General', s.league,
          s.mapsRun, s.durationMinutes, s.deaths, Math.round(s.totalChaos || 0), s.items?.length || 0
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
        setStatusNotice({ type: 'ok', text: `Detected ${list.length} active league(s). Pick one and click Load Tabs.` });
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
        body: JSON.stringify({ accountName: accountName.trim(), league: leagueName.trim(), realm: 'pc', poesessid: poesessid.trim() })
      });
      const data: any = await res.json();
      if (!res.ok || data.error) {
        setStatusNotice({ type: 'err', text: data.error || 'Could not load stash tabs from GGG.' });
      } else {
        const tabs: StashTabMeta[] = data.tabs || [];
        setStashTabs(tabs);
        const hasMapped = Object.values(canonicalMapping).some((v) => typeof v === 'number');
        if (!hasMapped && tabs.length > 0) {
          applyCanonicalMapping(autoMatchCanonicalTabs(tabs));
        } else if (tabs.length > 0 && selectedTabIndices.length === 0) {
          setSelectedTabIndices([tabs[0].index]);
        }
        setStatusNotice({ type: 'ok', text: `Loaded ${tabs.length} stash tabs from ${data.resolvedLeague || leagueName.trim()}.` });
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
      setIsDemoMode(false);
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
        setStatusNotice({ type: 'ok', text: `Direct Browser JSON parsed cleanly: ${finalDrops.length} stacks (~${estChaos.toLocaleString()}c).` });
      }
      setBrowserJsonInput('');
      setSetupOpen(false);
    } catch {
      setStatusNotice({ type: 'err', text: 'Invalid JSON. Copy the entire JSON response from pathofexile.com.' });
    }
  };

  // Live Multi Tab Progress Snapshot (scans 1 tab at a time so user sees live progress)
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
      const tabNames: Record<number, string> = {};
      for (const t of stashTabs) tabNames[t.index] = t.name;

      const perTabResults: TrackedDropItem[][] = [];
      let totalScanned = 0;

      try {
        for (let i = 0; i < selectedTabIndices.length; i++) {
          const tabIdx = selectedTabIndices[i];
          const label = tabNames[tabIdx] || `Tab ${tabIdx + 1}`;
          setScanProgress({ current: i + 1, total: selectedTabIndices.length, tabName: label });

          if (i > 0) {
            await new Promise((r) => setTimeout(r, 300));
          }

          const res = await fetch('/api/farming/stash-snapshot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              accountName: accountName.trim(),
              league: leagueName.trim(),
              realm: 'pc',
              poesessid: poesessid.trim(),
              tabIndices: [tabIdx],
              tabNames
            })
          });
          const data: any = await res.json();
          if (!res.ok || data.error) {
            setStatusNotice({ type: 'err', text: data.error || `Failed scanning tab "${label}".` });
            setScanProgress(null);
            setSnapshotting(false);
            return;
          }
          if (Array.isArray(data.items)) {
            perTabResults.push(data.items);
            totalScanned += Number(data.totalItemCount || 0);
          }
        }

        let equippedCharsScanned: string[] = [];
        if (includeEquippedGear && game === 'poe1') {
          setScanProgress({
            current: selectedTabIndices.length,
            total: selectedTabIndices.length + 1,
            tabName: 'Equipped Character Gear'
          });
          try {
            const eqRes = await fetch('/api/farming/equipped-assets', {
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
            if (eqRes.ok) {
              const eqData: any = await eqRes.json();
              if (Array.isArray(eqData?.items) && eqData.items.length > 0) {
                perTabResults.push(eqData.items);
                totalScanned += eqData.items.length;
                if (Array.isArray(eqData?.charactersScanned)) {
                  equippedCharsScanned = eqData.charactersScanned;
                }
              }
            }
          } catch {}
        }

        const mergedItems = mergeDropLists(perTabResults);
        const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setIsDemoMode(false);
        setLastSyncedAt(nowTime);

        const eqSuffix =
          equippedCharsScanned.length > 0
            ? ` + worn gear on ${equippedCharsScanned.join(', ')}`
            : '';

        if (mode === 'before') {
          setBeforeSnapshot({ at: nowTime, items: mergedItems });
          setCheckpoints([{ at: nowTime, totalItems: 0, totalChaos: 0 }]);
          setStatusNotice({ type: 'ok', text: `Before Snapshot locked at ${nowTime} (${totalScanned} items across ${selectedTabIndices.length} tabs${eqSuffix}).` });
          setSetupOpen(false);
        } else {
          const resultingDrops = mode === 'after' && beforeSnapshot ? computeSnapshotDiff(beforeSnapshot.items, mergedItems) : mergedItems;
          setActiveDrops(resultingDrops);
          const estChaos = Math.round(resultingDrops.reduce((sum, it) => sum + lookupNinjaPrice(it, ninjaPrices) * it.quantity, 0));
          const totalCount = resultingDrops.reduce((sum, x) => sum + x.quantity, 0);
          setCheckpoints((prev) => [...prev.slice(-11), { at: nowTime, totalItems: totalCount, totalChaos: estChaos }]);
          setStatusNotice({
            type: 'ok',
            text: `Synced ${selectedTabIndices.length} tabs${eqSuffix} at ${nowTime}: ${totalCount} items (~${estChaos.toLocaleString()}c on poe.ninja).`
          });
          setSetupOpen(false);
        }
      } catch (err: any) {
        setStatusNotice({ type: 'err', text: err.message || 'Snapshot request failed.' });
      }
      setScanProgress(null);
      setSnapshotting(false);
    },
    [selectedTabIndices, accountName, leagueName, poesessid, acceptedRiskDisclaimer, stashTabs, beforeSnapshot, ninjaPrices, includeEquippedGear, game]
  );

  const runSnapshotRef = useRef(runSnapshot);
  runSnapshotRef.current = runSnapshot;
  const hasBeforeRef = useRef(Boolean(beforeSnapshot));
  hasBeforeRef.current = Boolean(beforeSnapshot);

  useEffect(() => {
    if (autoSyncMinutes <= 0) {
      nextSyncAtMsRef.current = 0;
      setSecondsUntilSync(0);
      return;
    }
    const intervalMs = autoSyncMinutes * 60 * 1000;
    nextSyncAtMsRef.current = Date.now() + intervalMs;
    setSecondsUntilSync(autoSyncMinutes * 60);

    const checkTick = () => {
      const remainingMs = nextSyncAtMsRef.current - Date.now();
      if (remainingMs <= 0) {
        nextSyncAtMsRef.current = Date.now() + intervalMs;
        setSecondsUntilSync(autoSyncMinutes * 60);
        runSnapshotRef.current(hasBeforeRef.current ? 'after' : 'inspect');
      } else {
        setSecondsUntilSync(Math.ceil(remainingMs / 1000));
      }
    };

    const interval = window.setInterval(checkTick, 1000);
    const onVisChange = () => {
      if (document.visibilityState === 'visible') checkTick();
    };
    document.addEventListener('visibilitychange', onVisChange);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisChange);
    };
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
      setStatusNotice({ type: 'err', text: 'Your browser does not support live file handles. Use One Time Read instead.' });
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
      if (err?.name !== 'AbortError') setStatusNotice({ type: 'err', text: 'Could not attach live Client.txt watcher.' });
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
      parsed?.rarity === 'Unique' ? 'Uniques' : parsed?.rarity === 'Currency' ? 'Currency' : parsed?.rarity === 'Divination Card' ? 'Div Cards' : parsed?.rarity === 'Gem' ? 'Gems' : 'Gear & Jewels';

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

    if (isDemoMode) {
      setIsDemoMode(false);
      setActiveDrops([]);
      setCheckpoints([]);
    }
    addDropToSession({
      shortName: name, baseType: base, category: cat, subCategory, gemLevel, gemQuality,
      isVaal, isTransfigured, isAwakened, corrupted, quantity: 1, ilvl: parsed?.itemLevel || 0,
      frameType: parsed?.rarity === 'Unique' ? 3 : parsed?.rarity === 'Gem' ? 4 : 2
    });
    setClipboardText('');
  };

  const handleAddManualDrop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) return;
    if (isDemoMode) {
      setIsDemoMode(false);
      setActiveDrops([]);
      setCheckpoints([]);
    }
    addDropToSession({
      shortName: manualName.trim(), baseType: '', category: manualCategory, subCategory: manualCategory,
      quantity: Math.max(1, manualQty), ilvl: 0, frameType: manualCategory === 'Uniques' ? 3 : manualCategory === 'Gems' ? 4 : 5
    });
    setManualName('');
    setManualQty(1);
  };

  const addDropToSession = (input: {
    shortName: string; baseType: string; category: string; subCategory: string;
    gemLevel?: number; gemQuality?: number; isVaal?: boolean; isTransfigured?: boolean;
    isAwakened?: boolean; corrupted?: boolean; quantity: number; ilvl: number; frameType: number;
  }) => {
    const displayName = input.baseType && input.baseType !== input.shortName ? `${input.shortName} (${input.baseType})` : input.shortName;
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
          key, name: displayName, shortName: input.shortName, baseType: input.baseType,
          category: input.category, subCategory: input.subCategory, gemLevel: input.gemLevel || 0,
          gemQuality: input.gemQuality || 0, isVaal: Boolean(input.isVaal), isTransfigured: Boolean(input.isTransfigured),
          isAwakened: Boolean(input.isAwakened), corrupted: Boolean(input.corrupted), quantity: input.quantity,
          icon: '', frameType: input.frameType, ilvl: input.ilvl, tabName: 'Manual Log'
        },
        ...prev
      ];
    });
  };

  const handleSaveSessionToCloud = async () => {
    if (!normalizedHandle || activeDrops.length === 0 || isDemoMode) return;
    setSavingSession(true);
    const session: SavedFarmingSession = {
      id: `farm-${Date.now()}`, handle: normalizedHandle, game, title: sessionTitle.trim() || 'Farming Session',
      strategy: strategyTag, league: leagueName.trim() || (game === 'poe2' ? 'PoE 2' : 'PoE 1'),
      mapsRun, durationMinutes, deaths, totalChaos: totalSessionChaos, createdAtIso: new Date().toISOString(), items: activeDrops
    };
    try {
      const res = await fetch('/api/farming/sessions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ handle: normalizedHandle, session })
      });
      if (res.ok) {
        setSavedSessions((prev) => [session, ...prev]);
        setStatusNotice({ type: 'ok', text: `Saved "${session.title}" (${strategyTag}) to your cloud history!` });
      } else {
        setStatusNotice({ type: 'err', text: 'Sign in required to save farming sessions to cloud.' });
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
          ? totalSessionSsfPoints > 0 ? Math.round((row.ssfPts / totalSessionSsfPoints) * 100) : 0
          : totalSessionChaos > 0 ? Math.round((row.chaos / totalSessionChaos) * 100) : 0;
      return { category: cat, chaos: Math.round(row.chaos), ssfPts: Math.round(row.ssfPts), count: row.count, pct };
    }).sort((a, b) => (valueSystem === 'ssf' ? b.ssfPts - a.ssfPts : b.chaos - a.chaos) || b.count - a.count);
  }, [enrichedDrops, totalSessionChaos, totalSessionSsfPoints, valueSystem]);

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
        strategy, sessions: st.sessions,
        chaosPerHr: Math.round((st.totalChaos / st.totalMin) * 60),
        mapsPerHr: ((st.totalMaps / st.totalMin) * 60).toFixed(1),
        uniquesPerHr: ((st.totalUniques / st.totalMin) * 60).toFixed(1)
      }))
      .sort((a, b) => b.chaosPerHr - a.chaosPerHr);
  }, [savedSessions]);

  const railTabsList = useMemo(() => {
    if (!isDemoMode && stashTabs.length > 0 && selectedTabIndices.length > 0) {
      return stashTabs.filter((t) => selectedTabIndices.includes(t.index));
    }
    const names = Array.from(new Set(enrichedDrops.map((d) => d.tabName).filter(Boolean)));
    return names.map((name, idx) => ({
      index: idx, id: `local-${name}`, name, type: 'NormalStash', colour: { r: 168, g: 132, b: 64 }
    }));
  }, [isDemoMode, stashTabs, selectedTabIndices, enrichedDrops]);

  const activeSubFilterOptions = useMemo(() => {
    if (categoryFilter === 'Gems') return GEM_SUBFILTERS;
    if (categoryFilter === 'Div Cards') return DIV_SUBFILTERS;
    if (categoryFilter === 'Uniques') return UNIQUE_SUBFILTERS;
    if (categoryFilter === 'Essences & Crafting') return ESSENCE_SUBFILTERS;
    if (categoryFilter === 'Maps & League Keys') return MAP_SUBFILTERS;
    if (categoryFilter === 'Currency') return CURRENCY_SUBFILTERS;
    if (categoryFilter === 'Gear & Jewels') return [...EQUIPMENT_BRACKETS, '6 Link', 'Influenced / Fractured', 'iLvl 84+'];
    if (categoryFilter === 'All' || categoryFilter === 'Flasks') return [];
    const presentSubs = Array.from(
      new Set(enrichedDrops.filter((d) => d.category === categoryFilter && d.subCategory).map((d) => d.subCategory!))
    ).sort();
    return presentSubs.length > 1 ? ['All', ...presentSubs] : [];
  }, [categoryFilter, enrichedDrops]);

  const filteredAndSortedDrops = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = enrichedDrops.filter((d) => {
      if (activeTabFilter !== 'ALL' && d.tabName !== activeTabFilter) return false;
      if (categoryFilter === 'Flasks') {
        const isFlask =
          d.subCategory === 'Flasks & Tinctures' ||
          /flask|tincture/i.test(`${d.baseType || ''} ${d.shortName || ''}`);
        if (!isFlask) return false;
      } else if (categoryFilter !== 'All' && d.category !== categoryFilter) {
        return false;
      }
      if (tierFilter !== 'All' && d.tier !== tierFilter) return false;
      if (hideBulkNoise) {
        if (BULK_NOISE_REGEX.test(d.shortName.trim())) return false;
        if (d.tier === 'C' && d.totalChaos < 2 && d.category !== 'Uniques' && d.category !== 'Gems') return false;
      }
      if (categoryFilter === 'Gems' && subFilter !== 'All Gems') {
        const isExceptionalGem = Boolean(d.isExceptional) || /\b(empower|enlighten|enhance)\b/i.test(d.shortName);
        if (subFilter === 'Vaal' && !d.isVaal) return false;
        if (subFilter === 'Transfigured' && !d.isTransfigured) return false;
        if (subFilter === 'Exceptional' && !isExceptionalGem) return false;
        if (subFilter === 'Awakened' && !d.isAwakened) return false;
        if (subFilter === 'Level 20+' && (d.gemLevel || 0) < 20) return false;
        if (subFilter === 'Quality 15%+' && (d.gemQuality || d.quality || 0) < 15) return false;
        if (subFilter === 'Corrupted' && !d.corrupted) return false;
      } else if (categoryFilter === 'Div Cards' && subFilter !== 'All Cards') {
        const isFull = (d.maxStackSize || 0) > 0 && d.quantity >= (d.maxStackSize || 1);
        if (subFilter === 'Full Stacks Ready' && !isFull) return false;
        if (subFilter === 'Partial Stacks' && isFull) return false;
      } else if (categoryFilter === 'Uniques' && subFilter !== 'All Uniques') {
        if (subFilter === '6 Link' && (d.links || 0) < 6) return false;
        if (subFilter === 'Corrupted' && !d.corrupted) return false;
        if (subFilter !== '6 Link' && subFilter !== 'Corrupted' && (d.subCategory || '') !== subFilter) return false;
      } else if (categoryFilter === 'Essences & Crafting' && subFilter !== 'All Crafting') {
        if (subFilter === 'Deafening / Shrieking' && !/(deafening|shrieking)/i.test(d.shortName)) return false;
        if (subFilter === 'Corrupted Essences' && !/(horror|delirium|insanity|hysteria)/i.test(d.shortName)) return false;
        if (!['Deafening / Shrieking', 'Corrupted Essences'].includes(subFilter) && (d.subCategory || '') !== subFilter) return false;
      } else if (categoryFilter === 'Maps & League Keys' && subFilter !== 'All Maps & Keys') {
        if (subFilter === 'T16 / T17' && (d.mapTier || 0) < 16) return false;
        if (subFilter !== 'T16 / T17' && (d.subCategory || '') !== subFilter) return false;
      } else if (categoryFilter === 'Currency' && subFilter !== 'All Currency') {
        if (subFilter === 'Eldritch Currency' && !/(eldritch|ichor|ember|conflict)/i.test(d.shortName)) return false;
        if (subFilter !== 'Eldritch Currency' && (d.subCategory || '') !== subFilter) return false;
      } else if (categoryFilter === 'Gear & Jewels' && subFilter !== 'All Equipment') {
        if (subFilter === '6 Link' && (d.links || 0) < 6) return false;
        else if (subFilter === 'Influenced / Fractured' && !d.influenced) return false;
        else if (subFilter === 'iLvl 84+' && (d.ilvl || 0) < 84) return false;
        else if (!['6 Link', 'Influenced / Fractured', 'iLvl 84+'].includes(subFilter) && (d.subCategory || '') !== subFilter) return false;
      } else if (subFilter !== 'All' && !subFilter.startsWith('All ')) {
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
      if (sortField === 'gem_level') return ((a.gemLevel || 0) - (b.gemLevel || 0)) * mult || ((a.gemQuality || a.quality || 0) - (b.gemQuality || b.quality || 0)) * mult;
      if (sortField === 'gem_quality') return ((a.gemQuality || a.quality || 0) - (b.gemQuality || b.quality || 0)) * mult || ((a.gemLevel || a.ilvl || 0) - (b.gemLevel || b.ilvl || 0)) * mult;
      if (sortField === 'ilvl') return ((a.ilvl || 0) - (b.ilvl || 0)) * mult || ((a.quality || a.gemQuality || 0) - (b.quality || b.gemQuality || 0)) * mult;
      if (sortField === 'links') return ((a.links || 0) - (b.links || 0)) * mult;
      if (sortField === 'map_tier') return ((a.mapTier || 0) - (b.mapTier || 0)) * mult;
      if (sortField === 'tab') return a.tabName.localeCompare(b.tabName) * mult;
      return a.shortName.localeCompare(b.shortName) * mult;
    });
  }, [enrichedDrops, activeTabFilter, categoryFilter, tierFilter, hideBulkNoise, subFilter, searchQuery, sortField, sortDir, valueSystem]);

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
    if (sortField === field) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const directBrowserStashUrl = useMemo(() => {
    const acct = accountName.trim() || 'YourAccount#1234';
    const lg = leagueName.trim() || 'Ravenwatch Covens of Umbra GSF (PL87651)';
    return `https://www.pathofexile.com/character-window/get-stash-items?accountName=${encodeURIComponent(acct)}&realm=pc&league=${encodeURIComponent(lg)}&tabs=1&tabIndex=${browserJsonTabIndex}`;
  }, [accountName, leagueName, browserJsonTabIndex]);

  const heroChaos = wealthMode === 'hourly' ? chaosPerHour : totalSessionChaos;

  if (game === 'poe2') {
    return <AssetPoe2Notice onSwitchToPoe1={() => setGame('poe1')} />;
  }

  return (
    <div className="w-full space-y-4 pb-16 font-sans text-slate-200">
      {/* Compact Command Header */}
      <header className="rounded-2xl border border-slate-800 bg-gradient-to-r from-[#0d111a] via-indigo-950/25 to-[#0d111a] px-4 py-3.5 space-y-3 shadow-lg">
        {/* Top Row: Title & Context (Left) | Audio Chime & Notifications (Top Right) */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black font-cinzel text-white tracking-tight flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-400" />
              <span>Asset Tracker</span>
            </h1>
            <button
              type="button"
              onClick={() => setShowAboutTracker((v) => !v)}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                showAboutTracker
                  ? 'bg-indigo-600/25 border-indigo-400/60 text-white'
                  : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:text-white hover:border-slate-600'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>{showAboutTracker ? 'Hide Guide' : 'What Is This?'}</span>
            </button>

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
                className="px-2.5 py-1 rounded-md flex items-center gap-1 cursor-pointer text-slate-400 hover:text-white"
              >
                <Hammer className="w-3 h-3 text-cyan-400" /> PoE 2
              </button>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-xs">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <select
                value={linkedLeagueId}
                onChange={(e) => handleSelectLinkedLeague(e.target.value)}
                className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer max-w-[200px] sm:max-w-xs truncate"
              >
                {leagueOptions.map((lg) => (
                  <option key={lg.id} value={lg.id} className="bg-slate-950">{lg.name}</option>
                ))}
              </select>
            </div>

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

          {/* Top Right: Audio Chime & Notifications */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setChimeEnabled((v) => !v)}
              title={chimeEnabled ? 'Audio chime enabled' : 'Audio chime muted'}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                chimeEnabled ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
            >
              {chimeEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">Chime</span>
            </button>

            <button
              type="button"
              onClick={handleToggleDesktopAlerts}
              title={desktopAlertsEnabled ? 'Desktop notifications active' : 'Enable browser desktop notifications'}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                desktopAlertsEnabled ? 'bg-amber-500/20 border-amber-400/50 text-amber-300' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
            >
              {desktopAlertsEnabled ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">Alerts</span>
            </button>
          </div>
        </div>

        {/* Second Row: Setup, Pricing Toggle, Weights, Analytics (Left) | Save Cloud, Export, Focus Mode (Right) */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-800/70">
          {/* Aligned Left: Setup, SSF Utility / poe.ninja toggle, Weights, Wealth & Pace Analytics, Wealth Ladder Opt In */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setFocusMode(false);
                setSetupOpen((v) => !v);
              }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                setupOpen
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow'
                  : 'bg-indigo-600/20 hover:bg-indigo-600/30 border-indigo-400/50 text-indigo-200'
              }`}
              title="Configure your PoE Account, POESESSID, and 18 Canonical Stash Tabs"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-300" />
              <span>{setupOpen ? 'Close Setup' : 'Setup'}</span>
              {!poesessid && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
            </button>

            <div className="flex bg-slate-950 p-0.5 rounded-xl border border-amber-500/30 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setValueSystem('ssf')}
                className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                  valueSystem === 'ssf' ? 'bg-amber-500/25 text-amber-200 border border-amber-400/50' : 'text-slate-400 hover:text-white'
                }`}
              >
                SSF Utility
              </button>
              <button
                type="button"
                onClick={() => setValueSystem('ninja')}
                className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                  valueSystem === 'ninja' ? 'bg-indigo-600/30 text-white border border-indigo-400/50' : 'text-slate-400 hover:text-white'
                }`}
              >
                poe.ninja
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowWeightsEditor((v) => !v)}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 cursor-pointer ${
                showWeightsEditor ? 'bg-amber-500/20 border-amber-400/60 text-amber-200' : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
              <span>Weights</span>
            </button>

            {onOpenAnalytics && (
              <button
                type="button"
                onClick={onOpenAnalytics}
                className="px-3 py-1.5 rounded-xl border border-amber-500/50 bg-gradient-to-r from-amber-500/20 to-indigo-600/20 hover:from-amber-500/30 hover:to-indigo-600/30 text-amber-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                title="Open full page Wealth Timeline, Pace, Top Yielding Tabs, and Category Breakdown"
              >
                <BarChart3 className="w-3.5 h-3.5 text-amber-300" />
                <span>Wealth &amp; Pace Analytics</span>
              </button>
            )}

            {game === 'poe1' && (
              <button
                type="button"
                onClick={() => setIncludeEquippedGear((v) => !v)}
                title="Automatically include gear and socketed gems worn by your characters in this league when syncing"
                className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                  includeEquippedGear
                    ? 'bg-indigo-500/20 border-indigo-400/50 text-indigo-200'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldCheck className={`w-3.5 h-3.5 ${includeEquippedGear ? 'text-emerald-300' : 'text-slate-500'}`} />
                <span>{includeEquippedGear ? 'Equipped Gear: ON' : 'Equipped Gear: OFF'}</span>
              </button>
            )}

            {normalizedHandle && (
              <button
                type="button"
                onClick={() => setOptInWealthLadder((v) => !v)}
                title="Opt in to share your league wealth summary on the Hall of Fame Wealth Ladder"
                className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                  optInWealthLadder
                    ? 'bg-emerald-500/15 border-emerald-400/50 text-emerald-200'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Trophy className={`w-3.5 h-3.5 ${optInWealthLadder ? 'text-amber-300' : 'text-slate-500'}`} />
                <span>{optInWealthLadder ? 'Wealth Ladder: Opted In' : 'Join Wealth Ladder'}</span>
              </button>
            )}
          </div>

          {/* Aligned Right (Below Chime & Alerts): Save Cloud, Export, Focus Mode */}
          <div className="flex flex-wrap items-center gap-2">
            {normalizedHandle && !isDemoMode && (
              <button
                type="button"
                onClick={() => saveStashToCloud(false)}
                className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                  cloudSaveState === 'saved' ? 'bg-sky-500/15 border-sky-400/50 text-sky-200' : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                <Cloud className={`w-3.5 h-3.5 ${cloudSaveState === 'saving' ? 'animate-pulse text-amber-300' : 'text-sky-400'}`} />
                <span>
                  {cloudSaveState === 'saving' ? 'Saving...' : cloudSaveState === 'saved' ? 'Cloud Saved' : 'Save Cloud'}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportXlsx}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export .xlsx</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const next = !focusMode;
                setFocusMode(next);
                if (next) setSetupOpen(false);
              }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                focusMode ? 'bg-amber-500/20 border-amber-400/60 text-amber-200' : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200'
              }`}
            >
              {focusMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span>{focusMode ? 'Exit Focus' : 'Focus Mode'}</span>
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Visualize your stash net worth across 18 canonical tabs, diff <strong className="text-slate-200">Before vs After</strong> farming sessions, click any item name to inspect it on <strong className="text-sky-300">PoE Wiki</strong>, and open full page <strong className="text-amber-300">Wealth &amp; Pace Analytics</strong> backed by per league cloud storage.
        </p>

        {showAboutTracker && (
          <div className="pt-2.5 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <div className="font-mono text-[10px] uppercase font-bold text-amber-400">1. 18 Slot Stash Scanner &amp; Diffing</div>
              <p className="text-slate-300 leading-relaxed">
                Click <strong className="text-white">Setup</strong> to connect your Path of Exile account via stateless <code className="text-amber-200">POESESSID</code> (opt in local memory + 30 day disclaimer) or Direct Browser JSON. Auto match up to 18 specialty &amp; dump tabs, capture a <strong className="text-white">Before</strong> snapshot, and <strong className="text-white">Sync</strong> manually or on a background safe 15m/30m/60m timer.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <div className="font-mono text-[10px] uppercase font-bold text-sky-400">2. Dual Pricing, Deep Filters &amp; Wiki Links</div>
              <p className="text-slate-300 leading-relaxed">
                Toggle between live <strong className="text-white">poe.ninja</strong> challenge league prices and editable <strong className="text-white">SSF Utility Weights</strong>. Sort and filter by Tier (S/A/B/C), Gems (Level, Quality, Transfigured, Exceptional, Vaal, Awakened), Flasks (Quality, iLvl), Full Div Stacks, and 6 Links. Click any item name to open its <strong className="text-white">PoE Wiki</strong> page in a new tab.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <div className="font-mono text-[10px] uppercase font-bold text-emerald-400">3. Full Page Wealth &amp; Pace Analytics</div>
              <p className="text-slate-300 leading-relaxed">
                Click <strong className="text-white">Wealth &amp; Pace Analytics</strong> to open the dedicated full page view (<code className="text-emerald-300">/assets/analytics</code>) featuring interactive Wealth Timelines, Category Share Donuts, Top Yielding Tabs leaderboards, Top 12 Assets, and per league cloud session history tied to your Exile Profile.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <div className="font-mono text-[10px] uppercase font-bold text-purple-400">4. Cloud Sync, Squad Stash &amp; Wealth Ladder</div>
              <p className="text-slate-300 leading-relaxed">
                Auto saves per league to Cloud, exports styled <strong className="text-white">.xlsx</strong> spreadsheets, shares duplicate Uniques straight to your Private League <strong className="text-white">Free Stash</strong>, alerts on Squad Wishlist hits, and lets you opt in to the <strong className="text-white">Hall of Fame Wealth Ladder</strong>.
              </p>
            </div>
          </div>
        )}
      </header>

      {/* Clear Unmistakable DEMO Banner when viewing Sample Data */}
      {isDemoMode && (
        <div className="px-4 py-3 rounded-2xl border border-amber-400/60 bg-amber-500/15 flex flex-wrap items-center justify-between gap-3 text-xs shadow-lg">
          <div className="flex items-center gap-2.5">
            <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 font-mono font-black uppercase text-[10px]">
              DEMO DATA
            </span>
            <span className="text-amber-100 font-semibold">
              You are viewing sample dump tab items for preview only. None of this is saved to your account until you import your own stash or drops.
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              handleResetSession();
              setSetupOpen(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
          >
            Clear Demo & Connect My Stash
          </button>
        </div>
      )}

      {/* Live Multi Tab Progress Bar */}
      {scanProgress && (
        <div className="px-4 py-3 rounded-2xl border border-indigo-400/50 bg-indigo-950/35 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-indigo-200 font-bold flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
              <span>
                Scanning tab {scanProgress.current} of {scanProgress.total}: {scanProgress.tabName}...
              </span>
            </span>
            <span className="text-amber-300 font-bold">
              {Math.round((scanProgress.current / scanProgress.total) * 100)}%
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-indigo-500/30">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-amber-400 to-emerald-400 transition-all duration-300"
              style={{ width: `${Math.round((scanProgress.current / scanProgress.total) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Editable SSF Weights Drawer */}
      {showWeightsEditor && (
        <WeightsEditorDrawer
          ssfWeights={ssfWeights}
          setSsfWeights={setSsfWeights}
          onClose={() => setShowWeightsEditor(false)}
        />
      )}

      {/* Focus Status Bar */}
      {focusMode && (
        <div className="px-4 py-2 rounded-xl bg-slate-900/90 border border-indigo-500/30 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-3 text-slate-300">
            <span>Auto Pull: <strong className={autoSyncMinutes > 0 ? 'text-emerald-400' : 'text-slate-400'}>{autoSyncMinutes > 0 ? formatCountdown(secondsUntilSync) : 'Off'}</strong></span>
            <span>•</span>
            <span>Tabs: <strong className="text-white">{selectedTabIndices.length || railTabsList.length}</strong></span>
            <span>•</span>
            <span>Strategy: <strong className="text-amber-300">{strategyTag}</strong></span>
            <span>•</span>
            <span>Pace: <strong className="text-emerald-300">{mapsPerHour} maps/hr</strong></span>
          </div>
          <button type="button" onClick={() => { setFocusMode(false); setSetupOpen(true); }} className="text-indigo-300 hover:text-white underline cursor-pointer">
            Expand Setup
          </button>
        </div>
      )}

      {/* Status Notice */}
      {statusNotice && (
        <div className={`px-4 py-2.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${statusNotice.type === 'ok' ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-200' : 'bg-rose-500/10 border-rose-500/40 text-rose-200'}`}>
          <div className="flex items-center gap-2">
            {statusNotice.type === 'ok' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
            <span>{statusNotice.text}</span>
          </div>
          <button type="button" onClick={() => setStatusNotice(null)} className="text-[11px] font-mono opacity-75 hover:opacity-100 cursor-pointer">Dismiss</button>
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
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer ${isClaimed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
                >
                  {isClaimed ? 'Fulfilled (+5 Honor)' : 'Mark Found (+5 Honor)'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Collapsible Setup Drawer */}
      {setupOpen && !focusMode && (
        <section className="rounded-2xl border border-indigo-500/30 bg-[#0d111a] p-4 sm:p-5 space-y-4 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <button type="button" onClick={() => setSetupTab('api')} className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${setupTab === 'api' ? 'bg-indigo-600/30 border border-indigo-400/60 text-white' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'}`}>
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>1. Live Stash API (POESESSID)</span>
              </button>
              <button type="button" onClick={() => setSetupTab('json')} className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${setupTab === 'json' ? 'bg-indigo-600/30 border border-indigo-400/60 text-white' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'}`}>
                <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                <span>2. Direct Browser JSON (No POESESSID)</span>
              </button>
              <button type="button" onClick={() => setSetupTab('manual')} className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${setupTab === 'manual' ? 'bg-indigo-600/30 border border-indigo-400/60 text-white' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'}`}>
                <Upload className="w-3.5 h-3.5 text-sky-400" />
                <span>3. Client.txt, Clipboard & Save Session</span>
              </button>
            </div>
            <button type="button" onClick={() => setSetupOpen(false)} className="text-xs font-mono text-slate-400 hover:text-white cursor-pointer">Hide Setup ▲</button>
          </div>

          {setupTab === 'api' && (
            <div className="space-y-3.5">
              {showDisclaimerBanner ? (
                <div className="p-3 rounded-xl bg-rose-950/35 border border-rose-500/45 space-y-2 text-xs">
                  <div className="flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <p className="text-slate-200 leading-relaxed">
                      <strong className="text-rose-300">POESESSID Security Disclaimer:</strong> Your POESESSID grants live session access to <code>pathofexile.com</code>. Never share it with anyone. Using it here is strictly optional at your own discretion while GGG OAuth registrations are paused. Exile SSF never stores it in any database, KV cache, or log. <strong>Once confirmed, this disclaimer will not appear again in this browser for 30 days.</strong>
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-rose-200 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptedRiskDisclaimer}
                      onChange={(e) => handleToggleDisclaimer(e.target.checked)}
                      className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                    />
                    <span>I understand the risks of POESESSID and choose to proceed at my own discretion (hide for 30 days).</span>
                  </label>
                </div>
              ) : (
                <div className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <span className="text-emerald-300 font-medium flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>POESESSID disclaimer acknowledged (hidden for 30 days in this browser).</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowDisclaimerBanner(true)}
                    className="text-slate-400 hover:text-amber-300 font-mono underline cursor-pointer"
                  >
                    Review Disclaimer
                  </button>
                </div>
              )}

              <div className="px-3 py-2 rounded-xl bg-slate-950/75 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                <label className="flex items-center gap-2 text-amber-200 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberPoesessid}
                    onChange={(e) => setRememberPoesessid(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                  <span>Opt in: Remember POESESSID in this browser's localStorage for 15m/30m/60m Auto Sync (never sent to Exile SSF servers)</span>
                </label>
                {rememberPoesessid && poesessid && (
                  <button
                    type="button"
                    onClick={() => {
                      setRememberPoesessid(false);
                      setPoesessid('');
                      try { localStorage.removeItem(POESESSID_OPTIN_STORAGE_KEY); } catch {}
                    }}
                    className="px-2 py-0.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/40 text-rose-200 text-[10px] font-mono font-bold cursor-pointer"
                  >
                    Forget Saved POESESSID
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 text-xs">
                <input type="text" value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="PoE Account (e.g. Leuie#0626)" className="sm:col-span-3 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white" />
                <input type="text" value={leagueName} onChange={(e) => setLeagueName(e.target.value)} placeholder="League Name" className="sm:col-span-4 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white" />
                <input type="text" name="poe_session_token" autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} data-lpignore="true" data-1p-ignore="true" style={{ WebkitTextSecurity: 'disc' } as React.CSSProperties} value={poesessid} onChange={(e) => setPoesessid(e.target.value)} placeholder={rememberPoesessid ? 'POESESSID (Saved Locally)' : 'POESESSID (Memory Only)'} className="sm:col-span-3 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-amber-300 font-mono" />
                <div className="sm:col-span-2 flex gap-1.5">
                  <button type="button" disabled={detectingLeagues || !acceptedRiskDisclaimer} onClick={handleDetectLeagues} title="Auto detect active GGG leagues" className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold cursor-pointer disabled:opacity-40">
                    <Search className="w-4 h-4" />
                  </button>
                  <button type="button" disabled={loadingTabs || !acceptedRiskDisclaimer} onClick={handleLoadStashTabs} className="flex-1 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer disabled:opacity-40">
                    {loadingTabs ? '...' : 'Load Tabs'}
                  </button>
                </div>
              </div>

              {detectedLeagues.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Detected:</span>
                  {detectedLeagues.map((lg) => (
                    <button key={lg} type="button" onClick={() => setLeagueName(lg)} className={`px-2 py-1 rounded-lg text-xs border cursor-pointer ${leagueName === lg ? 'bg-amber-500/20 border-amber-400/60 text-amber-200' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>{lg}</button>
                  ))}
                </div>
              )}

              {stashTabs.length > 0 && (
                <CanonicalTabMapper
                  stashTabs={stashTabs}
                  mapping={canonicalMapping}
                  onChangeMapping={applyCanonicalMapping}
                  onAutoMatch={() => applyCanonicalMapping(autoMatchCanonicalTabs(stashTabs))}
                />
              )}
            </div>
          )}

          {setupTab === 'json' && (
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p><strong>Zero Credential Fallback:</strong> Open your own <code>pathofexile.com</code> stash JSON URL in Brave, press <strong>Ctrl+A</strong> then <strong>Ctrl+C</strong>, and paste it below.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input type="text" value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="Account (e.g. Leuie#0626)" className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white w-48" />
                <input type="number" min={0} value={browserJsonTabIndex} onChange={(e) => setBrowserJsonTabIndex(Math.max(0, Number(e.target.value) || 0))} className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono w-20" />
                <a href={directBrowserStashUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5">
                  <span>Open Stash JSON in Brave</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <textarea rows={3} value={browserJsonInput} onChange={(e) => setBrowserJsonInput(e.target.value)} placeholder='Paste raw JSON from pathofexile.com here...' className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-amber-200 placeholder-slate-500" />
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => handleParseDirectBrowserJson('before')} className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer">1. Lock as Before Snapshot</button>
                <button type="button" disabled={!beforeSnapshot} onClick={() => handleParseDirectBrowserJson('after')} className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer disabled:opacity-40">2. Diff vs Before</button>
                <button type="button" onClick={() => handleParseDirectBrowserJson('inspect')} className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-200 font-bold cursor-pointer">Parse & View Now</button>
              </div>
            </div>
          )}

          {setupTab === 'manual' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono uppercase text-[10px] text-emerald-400 font-bold">Client.txt Speed & Session Info</span>
                  <div className="flex items-center gap-1.5">
                    {watchingClientTxt ? (
                      <button type="button" onClick={() => { setWatchingClientTxt(false); clientFileHandleRef.current = null; }} className="px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-200 font-bold cursor-pointer">Stop Live Watch</button>
                    ) : (
                      <button type="button" onClick={handleWatchLiveClientTxt} className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1 cursor-pointer">
                        <Timer className="w-3 h-3" /> Watch Live Client.txt
                      </button>
                    )}
                    <label className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold flex items-center gap-1 cursor-pointer">
                      <Upload className="w-3 h-3" /> One Time Read
                      <input type="file" accept=".txt,.log" onChange={handleClientTxtUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-slate-400">
                    <FolderOpen className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>Copy your logs folder path, paste in File Picker address bar, press Enter:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {[
                      { id: 'p1-steam', label: 'Steam (PoE 1)', path: '%ProgramFiles(x86)%\\Steam\\steamapps\\common\\Path of Exile\\logs\\' },
                      { id: 'p1-ggg', label: 'Standalone (PoE 1)', path: '%ProgramFiles(x86)%\\Grinding Gear Games\\Path of Exile\\logs\\' }
                    ].map((entry) => {
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
                          className={`px-2.5 py-1.5 rounded-lg border text-left flex items-center justify-between gap-2 cursor-pointer ${isCopied ? 'bg-emerald-500/15 border-emerald-400/50 text-emerald-200' : 'bg-slate-900/90 border-slate-800 hover:border-amber-400/50 text-slate-300'}`}
                        >
                          <div className="min-w-0">
                            <div className="text-[10px] font-bold text-amber-300">{entry.label}</div>
                            <code className="block text-[10px] font-mono text-slate-400 truncate">{entry.path}</code>
                          </div>
                          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <Copy className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <input type="text" value={sessionTitle} onChange={(e) => setSessionTitle(e.target.value)} placeholder="Session Title" className="col-span-2 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white" />
                  <input type="number" min={0} value={mapsRun} onChange={(e) => setMapsRun(Math.max(0, Number(e.target.value) || 0))} placeholder="Maps" className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono" />
                  <input type="number" min={1} value={durationMinutes} onChange={(e) => setDurationMinutes(Math.max(1, Number(e.target.value) || 1))} placeholder="Mins" className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" disabled={savingSession || activeDrops.length === 0 || !normalizedHandle || isDemoMode} onClick={handleSaveSessionToCloud} className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-40">
                    <Save className="w-3.5 h-3.5" />
                    <span>{savingSession ? 'Saving...' : 'Save Session'}</span>
                  </button>
                  <button type="button" disabled={sharingRecap || activeDrops.length === 0 || isDemoMode} onClick={handleShareRecapToFeed} className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-40">
                    <Send className="w-3.5 h-3.5" />
                    <span>{sharingRecap ? 'Posting...' : 'Share Recap to Feed'}</span>
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
                  <button type="button" onClick={handleAddClipboardDrop} className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold cursor-pointer">Parse</button>
                </div>
                <form onSubmit={handleAddManualDrop} className="grid grid-cols-12 gap-2">
                  <input type="text" value={manualName} onChange={(e) => setManualName(e.target.value)} placeholder="Manual drop (e.g. Divine Orb)..." className="col-span-6 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white" />
                  <select value={manualCategory} onChange={(e) => setManualCategory(e.target.value)} className="col-span-3 px-2 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200">
                    {CATEGORY_ORDER.map((c) => (<option key={c} value={c}>{c}</option>))}
                  </select>
                  <input type="number" min={1} value={manualQty} onChange={(e) => setManualQty(Math.max(1, Number(e.target.value) || 1))} className="col-span-1 px-1 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-center font-mono text-white" />
                  <button type="submit" className="col-span-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center cursor-pointer">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Draggable, Resizable, Collapsible Asset Tracker Workspace Grid */}
      <ToolWidgetGrid
        storageKey="asset_tracker"
        widgets={[
          {
            id: 'wealth_pace',
            title: 'Wealth & Pace',
            icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" />,
            defaultSpan: 6,
            render: () => (
              <div className="flex flex-col justify-between space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px] font-semibold">
                      <button type="button" onClick={() => setWealthMode('total')} className={`px-2.5 py-0.5 rounded-md cursor-pointer ${wealthMode === 'total' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}>Total</button>
                      <button type="button" onClick={() => setWealthMode('hourly')} className={`px-2.5 py-0.5 rounded-md cursor-pointer ${wealthMode === 'hourly' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}>Hourly</button>
                    </div>
                    <select value={strategyTag} onChange={(e) => { setStrategyTag(e.target.value); saveActiveStrategy({ strategy: e.target.value }); }} className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-amber-300 font-semibold focus:outline-none cursor-pointer">
                      {STRATEGY_PRESETS.map((st) => (<option key={st} value={st} className="bg-slate-950">{st}</option>))}
                    </select>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl sm:text-3xl font-mono font-bold text-amber-300 leading-none">
                      {valueSystem === 'ssf' ? formatSsfPoints(wealthMode === 'hourly' ? ssfPointsPerHour : totalSessionSsfPoints) : formatValue(heroChaos, divineChaos)}
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
                <div className="h-24 w-full rounded-xl bg-slate-950/75 border border-slate-800/80 px-3 py-2 flex flex-col justify-between">
                  <LootSparkline checkpoints={checkpoints} fallbackChaos={totalSessionChaos} divineChaos={divineChaos} />
                </div>
              </div>
            )
          },
          {
            id: 'breakdown',
            title: 'Category Breakdown',
            icon: <Package className="w-3.5 h-3.5 text-indigo-400" />,
            defaultSpan: 6,
            render: () => (
              <div className="space-y-3">
                <div className="flex items-center justify-end">
                  <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px] font-semibold">
                    <button type="button" onClick={() => setBreakdownMode('divines')} className={`px-2.5 py-0.5 rounded-md cursor-pointer ${breakdownMode === 'divines' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}>
                      {valueSystem === 'ssf' ? 'Points' : 'Divines'}
                    </button>
                    <button type="button" onClick={() => setBreakdownMode('percent')} className={`px-2.5 py-0.5 rounded-md cursor-pointer ${breakdownMode === 'percent' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}>Percentage</button>
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
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${isSelected ? 'bg-indigo-600/25 border-indigo-400/60 text-white' : 'bg-slate-950/75 border-slate-800/80 hover:border-slate-600 text-slate-200'}`}
                      >
                        <div className="text-[10px] font-mono text-slate-400 truncate">{row.category}</div>
                        <div className="text-sm font-mono font-bold text-amber-300 mt-0.5">
                          {breakdownMode === 'percent' ? `${row.pct}%` : valueSystem === 'ssf' ? formatSsfPoints(row.ssfPts) : row.chaos > 0 ? formatValue(row.chaos, divineChaos) : `${row.count}x`}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )
          },
          ...(!focusMode
            ? [
                {
                  id: 'analytics_deck',
                  title: 'Visual Analytics Charts',
                  icon: <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />,
                  defaultSpan: 12 as const,
                  render: () => (
                    <AssetAnalyticsDeck
                      checkpoints={checkpoints}
                      enrichedDrops={enrichedDrops}
                      categoryBreakdown={categoryBreakdown}
                      valueSystem={valueSystem}
                      divineChaos={divineChaos}
                      ownedTabNames={railTabsList.map((t) => t.name)}
                      onOpenFullAnalytics={onOpenAnalytics}
                    />
                  )
                },
                {
                  id: 'net_profit_calc',
                  title: 'Map Cost vs Profit Net Calculator',
                  icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" />,
                  defaultSpan: 12 as const,
                  defaultCollapsed: true,
                  render: () => (
                    <MapCostCalculatorWidget
                      totalSessionChaos={totalSessionChaos}
                      mapsRun={mapsRun}
                      durationMinutes={durationMinutes}
                      divineChaos={divineChaos}
                    />
                  )
                }
              ]
            : []),
          {
            id: 'stash_workspace',
            title: `Synced Stash Tabs & Live Loot (${enrichedDrops.length} Items)`,
            icon: <TableIcon className="w-3.5 h-3.5 text-sky-400" />,
            defaultSpan: 12,
            render: () => (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <aside className="lg:col-span-3 xl:col-span-2 rounded-2xl border border-slate-800 bg-[#0d111a] p-3 space-y-3 shadow-lg">
          <div className="grid grid-cols-3 bg-slate-950 p-0.5 rounded-xl border border-slate-800 text-[11px] font-bold">
            <button type="button" onClick={() => setRailTab('tabs')} className={`py-1.5 rounded-lg cursor-pointer ${railTab === 'tabs' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}>Tabs</button>
            <button type="button" onClick={() => setRailTab('snapshots')} className={`py-1.5 rounded-lg cursor-pointer ${railTab === 'snapshots' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}>History</button>
            <button type="button" onClick={() => setRailTab('strategies')} className={`py-1.5 rounded-lg cursor-pointer ${railTab === 'strategies' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}>Stats</button>
          </div>

          {railTab === 'tabs' && (
            <div className="space-y-1.5">
              <button type="button" onClick={() => setActiveTabFilter('ALL')} className={`w-full px-3 py-2 rounded-xl text-left text-xs font-bold flex items-center justify-between border transition-all cursor-pointer ${activeTabFilter === 'ALL' ? 'bg-amber-500/20 border-amber-400/60 text-amber-200' : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-600'}`}>
                <span>All Synced Tabs</span>
                <span className="font-mono text-[10px]">{enrichedDrops.length}</span>
              </button>

              <div className="space-y-1 max-h-[420px] overflow-y-auto pr-0.5">
                {railTabsList.map((tab) => {
                  const isActive = activeTabFilter === tab.name;
                  const tabBg = `rgba(${tab.colour.r}, ${tab.colour.g}, ${tab.colour.b}, ${isActive ? 0.35 : 0.14})`;
                  const tabBorder = `rgba(${tab.colour.r}, ${tab.colour.g}, ${tab.colour.b}, ${isActive ? 0.85 : 0.35})`;
                  const tabItemsCount = enrichedDrops.filter((d) => d.tabName === tab.name).length;
                  const isApiEmptySpecialty = tab.type === 'UniqueStash' || tab.type === 'MapStash';
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTabFilter(isActive ? 'ALL' : tab.name)}
                      style={{ backgroundColor: tabBg, borderColor: tabBorder }}
                      title={
                        isApiEmptySpecialty && tabItemsCount === 0
                          ? "GGG's web API returns 0 items for Unique Collection and Map Stash tabs."
                          : tab.name
                      }
                      className="w-full px-3 py-2 rounded-xl text-left text-xs font-bold text-white border flex items-center justify-between gap-2 transition-all hover:brightness-125 cursor-pointer"
                    >
                      <span className="truncate">{tab.name}</span>
                      <span className="flex items-center gap-1 shrink-0">
                        {isApiEmptySpecialty && tabItemsCount === 0 && (
                          <span className="px-1 rounded bg-amber-500/25 border border-amber-400/40 text-[9px] font-mono text-amber-200">
                            API
                          </span>
                        )}
                        <span className="text-[10px] font-mono opacity-80">{tabItemsCount}</span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <button type="button" onClick={() => { setFocusMode(false); setSetupOpen((v) => !v); }} className="w-full pt-2 text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center justify-center gap-1.5 cursor-pointer">
                <Pencil className="w-3 h-3" />
                <span>{setupOpen ? 'Hide Setup' : 'Edit synced tabs'}</span>
              </button>
            </div>
          )}

          {railTab === 'snapshots' && (
            <div className="space-y-1.5 max-h-[440px] overflow-y-auto">
              {savedSessions.length === 0 ? (
                <div className="py-6 text-center text-[11px] text-slate-400">No saved sessions yet.</div>
              ) : (
                savedSessions.map((s) => (
                  <div key={s.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-400/50 flex items-center justify-between gap-2">
                    <button type="button" onClick={() => { setIsDemoMode(false); setSessionTitle(s.title); if (s.strategy) setStrategyTag(s.strategy); setMapsRun(s.mapsRun); setDurationMinutes(s.durationMinutes); setDeaths(s.deaths); setActiveDrops(s.items || []); }} className="text-left min-w-0 flex-1 cursor-pointer">
                      <div className="text-xs font-bold text-white truncate">{s.title}</div>
                      <div className="text-[10px] font-mono text-amber-300">{formatValue(s.totalChaos || 0, divineChaos)} • {s.mapsRun}m</div>
                    </button>
                    <button type="button" onClick={() => handleDeleteSession(s.id)} className="text-slate-500 hover:text-rose-400 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))
              )}
            </div>
          )}

          {railTab === 'strategies' && (
            <div className="space-y-2 max-h-[440px] overflow-y-auto">
              <div className="text-[10px] font-mono uppercase text-amber-400 font-bold">My Best Strategies</div>
              {strategyLeaderboard.length === 0 ? (
                <div className="py-6 text-center text-[11px] text-slate-400">Save sessions with Strategy tags to compare Div/hr & Maps/hr here.</div>
              ) : (
                strategyLeaderboard.map((st) => (
                  <div key={st.strategy} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="text-xs font-bold text-white truncate">{st.strategy}</div>
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-amber-300">{formatValue(st.chaosPerHr, divineChaos)}/hr</span>
                      <span className="text-emerald-300">{st.mapsPerHr} maps/hr</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">{st.uniquesPerHr} Uniques/hr • {st.sessions} run(s)</div>
                  </div>
                ))
              )}
            </div>
          )}
        </aside>

        {/* Right Main Loot Panel */}
        <section className="lg:col-span-9 xl:col-span-10 rounded-2xl border border-slate-800 bg-[#0d111a] overflow-hidden shadow-xl">
          <div className="p-3.5 border-b border-slate-800 bg-slate-900/70 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-48 sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search items, brackets..." className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-400" />
              </div>

              <button type="button" onClick={() => setShowFiltersBar((v) => !v)} className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer ${showFiltersBar || tierFilter !== 'All' || categoryFilter !== 'All' ? 'bg-indigo-600/25 border-indigo-400/60 text-white' : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-600'}`}>
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                <span>Filters</span>
              </button>

              <button type="button" onClick={() => setHideBulkNoise((v) => !v)} className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer ${hideBulkNoise ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-200' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'}`}>
                <EyeOff className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Hide Noise</span>
              </button>

              <div className="flex bg-slate-950 p-0.5 rounded-xl border border-slate-800">
                <button type="button" onClick={() => setViewMode('table')} className={`p-1.5 rounded-lg cursor-pointer ${viewMode === 'table' ? 'bg-slate-800 text-amber-300' : 'text-slate-400 hover:text-white'}`}><TableIcon className="w-3.5 h-3.5" /></button>
                <button type="button" onClick={() => setViewMode('cards')} className={`p-1.5 rounded-lg cursor-pointer ${viewMode === 'cards' ? 'bg-slate-800 text-amber-300' : 'text-slate-400 hover:text-white'}`}><LayoutGrid className="w-3.5 h-3.5" /></button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {lastSyncedAt && !isDemoMode && <span className="text-[11px] font-mono text-slate-400 hidden xl:inline">Synced {lastSyncedAt}</span>}
              <button type="button" disabled={snapshotting} onClick={() => runSnapshot('before')} className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold flex items-center gap-1 cursor-pointer disabled:opacity-40">
                <Camera className="w-3.5 h-3.5 text-sky-400" />
                <span>Before</span>
              </button>
              <button type="button" disabled={snapshotting} onClick={() => runSnapshot(beforeSnapshot ? 'after' : 'inspect')} className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1 cursor-pointer disabled:opacity-40">
                {beforeSnapshot ? <GitCompare className="w-3.5 h-3.5" /> : <RefreshCw className={`w-3.5 h-3.5 ${snapshotting ? 'animate-spin' : ''}`} />}
                <span>{beforeSnapshot ? 'Diff Now' : 'Sync'}</span>
              </button>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950 border border-indigo-500/35">
                <Timer className={`w-3.5 h-3.5 ${autoSyncMinutes > 0 ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
                <select value={autoSyncMinutes} onChange={(e) => setAutoSyncMinutes(Number(e.target.value))} className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer">
                  <option value={0} className="bg-slate-950">Auto: Off</option>
                  <option value={15} className="bg-slate-950">Auto: 15m</option>
                  <option value={30} className="bg-slate-950">Auto: 30m</option>
                  <option value={60} className="bg-slate-950">Auto: 60m</option>
                </select>
                {autoSyncMinutes > 0 && <span className="font-mono text-[10px] font-bold text-emerald-300">{formatCountdown(secondsUntilSync)}</span>}
              </div>
              {activeDrops.length > 0 && (
                <button type="button" onClick={handleResetSession} title="Clear current session drops" className="p-1.5 rounded-xl bg-slate-900 hover:bg-rose-500/20 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 cursor-pointer">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {showFiltersBar && (
            <div className="p-3.5 border-b border-slate-800 bg-slate-950/75 space-y-2.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-mono uppercase text-slate-400 mr-1">Tier:</span>
                {(['All', 'S', 'A', 'B', 'C'] as const).map((tier) => (
                  <button key={tier} type="button" onClick={() => setTierFilter(tier)} className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border cursor-pointer ${tierFilter === tier ? (tier === 'All' ? 'bg-indigo-600/30 border-indigo-400/60 text-white' : TIER_STYLES[tier]) : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}`}>
                    {tier === 'All' ? 'All Tiers' : `Tier ${tier} (${tierCounts[tier]})`}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-mono uppercase text-slate-400 mr-1">Category:</span>
                {['All', ...CATEGORY_ORDER, 'Flasks'].map((cat) => (
                  <button key={cat} type="button" onClick={() => { setCategoryFilter(cat); setSubFilter(cat === 'Gems' ? 'All Gems' : cat === 'Gear & Jewels' ? 'All Equipment' : 'All'); }} className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border cursor-pointer ${categoryFilter === cat ? 'bg-indigo-600/30 border-indigo-400/60 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}`}>{cat}</button>
                ))}
              </div>
              {activeSubFilterOptions.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-mono uppercase text-slate-400 mr-1">{categoryFilter === 'Gems' ? 'Gem Filter:' : 'Bracket:'}</span>
                  {activeSubFilterOptions.map((opt) => (
                    <button key={opt} type="button" onClick={() => setSubFilter(opt)} className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border cursor-pointer ${subFilter === opt ? 'bg-amber-500/20 border-amber-400/60 text-amber-200' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}`}>{opt}</button>
                  ))}
                </div>
              )}
              {(categoryFilter === 'Gems' || categoryFilter === 'Flasks' || (categoryFilter === 'Gear & Jewels' && subFilter === 'Flasks & Tinctures')) && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800/70">
                  <span className="text-[10px] font-mono uppercase text-sky-400 mr-1">Quick Sort:</span>
                  {categoryFilter === 'Gems' && (
                    <button type="button" onClick={() => toggleSort('gem_level')} className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border cursor-pointer ${sortField === 'gem_level' ? 'bg-sky-500/20 border-sky-400/60 text-sky-200' : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'}`}>
                      Gem Level {sortField === 'gem_level' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                    </button>
                  )}
                  <button type="button" onClick={() => toggleSort('gem_quality')} className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border cursor-pointer ${sortField === 'gem_quality' ? 'bg-sky-500/20 border-sky-400/60 text-sky-200' : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'}`}>
                    Quality % {sortField === 'gem_quality' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                  </button>
                  {categoryFilter !== 'Gems' && (
                    <button type="button" onClick={() => toggleSort('ilvl')} className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border cursor-pointer ${sortField === 'ilvl' ? 'bg-sky-500/20 border-sky-400/60 text-sky-200' : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'}`}>
                      Item Level {sortField === 'ilvl' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                    </button>
                  )}
                  <button type="button" onClick={() => toggleSort('total')} className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border cursor-pointer ${sortField === 'total' ? 'bg-amber-500/20 border-amber-400/60 text-amber-200' : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'}`}>
                    Total Value {sortField === 'total' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                  </button>
                </div>
              )}
            </div>
          )}

          {filteredAndSortedDrops.length === 0 ? (
            enrichedDrops.length === 0 ? (
              <div className="py-14 px-6 text-center space-y-3">
                <Layers className="w-8 h-8 text-slate-600 mx-auto" />
                <div className="text-sm font-bold text-slate-200">No Stash Data Loaded Yet</div>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Connect your Dump Tabs in Setup above, paste a Direct Browser JSON snapshot, or preview the dashboard with clearly labeled sample DEMO data.
                </p>
                <button
                  type="button"
                  onClick={handleLoadDemoData}
                  className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 text-xs font-bold cursor-pointer"
                >
                  Load Sample DEMO Data (Preview Only)
                </button>
              </div>
            ) : (() => {
              const activeRailTab = railTabsList.find((t) => t.name === activeTabFilter);
              const isApiEmptySpecialty =
                activeRailTab && (activeRailTab.type === 'UniqueStash' || activeRailTab.type === 'MapStash');
              return (
                <div className="py-14 px-6 text-center space-y-3">
                  <Layers className={`w-8 h-8 mx-auto ${isApiEmptySpecialty ? 'text-amber-400' : 'text-slate-600'}`} />
                  <div className="text-sm font-bold text-slate-200">
                    {isApiEmptySpecialty
                      ? `"${activeTabFilter}" Is a GGG Nested Collection Tab`
                      : activeTabFilter !== 'ALL'
                      ? `No Items Found in "${activeTabFilter}"`
                      : 'No Items Match Your Current Filters'}
                  </div>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    {isApiEmptySpecialty
                      ? "Grinding Gear Games' web stash API returns 0 items for Unique Collection and Map Stash tabs. Uncheck this tab in Edit synced tabs to free a slot, and keep tracked uniques or maps in a normal or quad tab."
                      : 'Try switching back to All Synced Tabs or clearing your search, tier, or Hide Noise filters.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTabFilter('ALL');
                      setSearchQuery('');
                      setTierFilter('All');
                      setCategoryFilter('All');
                      setSubFilter('All');
                      setHideBulkNoise(false);
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-600/25 hover:bg-indigo-600/35 border border-indigo-400/50 text-indigo-200 text-xs font-bold cursor-pointer"
                  >
                    Show All Synced Tabs ({enrichedDrops.length})
                  </button>
                </div>
              );
            })()
          ) : viewMode === 'table' ? (
            <div className="overflow-x-auto max-h-[640px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 z-10 bg-slate-900/95 border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                  <tr>
                    <th className="py-2.5 px-3.5 cursor-pointer hover:text-white" onClick={() => toggleSort('name')}>Name {sortField === 'name' ? (sortDir === 'desc' ? '↓' : '↑') : ''}</th>
                    <th className="py-2.5 px-2.5 cursor-pointer hover:text-white" onClick={() => toggleSort('tier')}>Tier {sortField === 'tier' ? (sortDir === 'desc' ? '↓' : '↑') : ''}</th>
                    <th className="py-2.5 px-3 cursor-pointer hover:text-white" onClick={() => toggleSort('tab')}>Tab / Bracket {sortField === 'tab' ? (sortDir === 'desc' ? '↓' : '↑') : ''}</th>
                    <th className="py-2.5 px-2 text-right cursor-pointer hover:text-white" onClick={() => toggleSort('gem_level')}>Lv {sortField === 'gem_level' ? (sortDir === 'desc' ? '↓' : '↑') : ''}</th>
                    <th className="py-2.5 px-2 text-right cursor-pointer hover:text-white" onClick={() => toggleSort('gem_quality')}>Qual {sortField === 'gem_quality' ? (sortDir === 'desc' ? '↓' : '↑') : ''}</th>
                    <th className="py-2.5 px-2 text-right cursor-pointer hover:text-white" onClick={() => toggleSort('ilvl')}>iLvl {sortField === 'ilvl' ? (sortDir === 'desc' ? '↓' : '↑') : ''}</th>
                    <th className="py-2.5 px-3 text-right cursor-pointer hover:text-white" onClick={() => toggleSort('qty')}>Qty {sortField === 'qty' ? (sortDir === 'desc' ? '↓' : '↑') : ''}</th>
                    <th className="py-2.5 px-3 text-right cursor-pointer hover:text-white" onClick={() => toggleSort('price')}>Price {sortField === 'price' ? (sortDir === 'desc' ? '↓' : '↑') : ''}</th>
                    <th className="py-2.5 px-3.5 text-right cursor-pointer hover:text-white" onClick={() => toggleSort('total')}>Total {sortField === 'total' ? (sortDir === 'desc' ? '↓' : '↑') : ''}</th>
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
                              <div className="w-6 h-6 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-[9px] font-mono text-amber-300 shrink-0">{it.category.slice(0, 2).toUpperCase()}</div>
                            )}
                            <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                              <a
                                href={buildPoeWikiUrl(it.shortName, game)}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={`Open ${it.shortName} on PoE Wiki`}
                                className={`font-semibold truncate max-w-[260px] hover:underline decoration-amber-400/70 underline-offset-2 transition-colors ${it.category === 'Uniques' ? 'text-orange-300 hover:text-orange-200' : it.category === 'Gems' ? 'text-teal-300 hover:text-teal-200' : 'text-slate-100 hover:text-amber-200'}`}
                              >
                                {it.shortName}
                                {it.category === 'Gems' && (it.gemLevel || 0) > 0 ? ` (${it.gemLevel}/${it.gemQuality || 0})` : ''}
                              </a>
                              {it.isVaal && <span className="px-1 py-0.2 rounded text-[9px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40">Vaal</span>}
                              {it.isTransfigured && <span className="px-1 py-0.2 rounded text-[9px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/40">Transfig</span>}
                              {(it.isExceptional || /\b(empower|enlighten|enhance)\b/i.test(it.shortName)) && <span className="px-1 py-0.2 rounded text-[9px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">Exceptional</span>}
                              {it.isAwakened && <span className="px-1 py-0.2 rounded text-[9px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">Awakened</span>}
                              {it.corrupted && <span className="px-1 py-0.2 rounded text-[9px] font-mono bg-rose-950/60 text-rose-400">Corr</span>}
                            </div>
                          </div>
                        </td>
                        <td className="py-2 px-2.5"><span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${TIER_STYLES[it.tier]}`}>{it.tier}</span></td>
                        <td className="py-2 px-3 text-slate-400">
                          <span className="text-slate-200 font-medium">{it.tabName}</span>
                          {it.subCategory && <span className="ml-1.5 text-[10px] font-mono text-slate-500">({it.subCategory})</span>}
                        </td>
                        <td className="py-2 px-2 text-right font-mono text-teal-300">
                          {(it.gemLevel || 0) > 0 ? it.gemLevel : <span className="text-slate-700">.</span>}
                        </td>
                        <td className="py-2 px-2 text-right font-mono text-sky-300">
                          {(it.gemQuality || it.quality || 0) > 0 ? `${it.gemQuality || it.quality}%` : <span className="text-slate-700">.</span>}
                        </td>
                        <td className="py-2 px-2 text-right font-mono text-slate-400">
                          {(it.ilvl || 0) > 0 ? it.ilvl : <span className="text-slate-700">.</span>}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-200">{it.quantity.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right font-mono text-slate-400">
                          {valueSystem === 'ssf' ? formatSsfPoints(it.ssfPointsEach) : it.chaosEach > 0 ? formatValue(it.chaosEach, divineChaos) : '0c'}
                        </td>
                        <td className="py-2 px-3.5 text-right font-mono font-bold text-amber-300">
                          {valueSystem === 'ssf' ? formatSsfPoints(it.totalSsfPoints) : it.totalChaos > 0 ? formatValue(it.totalChaos, divineChaos) : '0c'}
                        </td>
                        <td className="py-2 px-3 text-right">
                          {it.category === 'Uniques' && !isDemoMode && (
                            <button type="button" disabled={isShared} onClick={() => handleShareToFreeStash(it)} className={`px-2 py-0.5 rounded-md text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer ${isShared ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 hover:bg-indigo-600 text-slate-200'}`}>
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
                const bracketVal = items.reduce((s, x) => s + (valueSystem === 'ssf' ? x.totalSsfPoints : x.totalChaos), 0);
                return (
                  <div key={bracketName} className="space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                      <span className="text-xs font-mono font-bold uppercase text-amber-300">{bracketName}</span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {valueSystem === 'ssf' ? formatSsfPoints(bracketVal) : formatValue(bracketVal, divineChaos)} • {items.length} stacks
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                      {items.map((it) => (
                        <div key={it.key} className="p-2.5 rounded-xl bg-slate-950/85 border border-slate-800 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${TIER_STYLES[it.tier]}`}>{it.tier}</span>
                            <a
                              href={buildPoeWikiUrl(it.shortName, game)}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={`Open ${it.shortName} on PoE Wiki`}
                              className="text-xs font-bold text-white hover:text-amber-200 hover:underline decoration-amber-400/70 underline-offset-2 truncate"
                            >
                              {it.shortName}
                            </a>
                          </div>
                          <div className="flex items-center gap-1.5 font-mono text-xs shrink-0">
                            <span className="text-amber-300 font-bold">
                              {valueSystem === 'ssf' ? formatSsfPoints(it.totalSsfPoints) : formatValue(it.totalChaos, divineChaos)}
                            </span>
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
            )
          }
        ] as ToolWidgetDefinition[]}
      />
    </div>
  );
};
