import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Compass,
  Clock,
  Play,
  Square,
  Upload,
  Cloud,
  CloudUpload,
  Skull,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  Trash2,
  Activity,
  Flame,
  Hammer
} from 'lucide-react';
import type { UserAccount } from '../types';
import { fetchUserToolState, saveUserToolState } from '../services/cloudSync';
import {
  POESESSID_OPTIN_STORAGE_KEY,
  PREFS_STORAGE_KEY,
  STRATEGY_PRESETS,
  POE2_STRATEGY_PRESETS
} from './assets/assetEngine';
import {
  MapAnalyticsCharts,
  type StrategyCompareRow,
  type XpCheckpoint
} from './maps/MapAnalyticsCharts';

interface MapTrackerViewProps {
  selectedGame?: 'poe1' | 'poe2';
  userAccount?: UserAccount | null;
}

interface ParsedAreaRun {
  id: string;
  areaName: string;
  kind: 'Map' | 'Hideout / Town' | 'Betrayal Safehouse' | 'Temple of Atzoatl' | 'Sanctum / Lab' | 'Boss / Special';
  enteredAtMs: number;
  enteredLabel: string;
  durationSec: number;
  deathsInRun: number;
}

interface SavedMapSession {
  id: string;
  title: string;
  strategy: string;
  startDate: string;
  mapsCompleted: number;
  avgMapSec: number;
  mapsPerHr: number;
  hideoutPct: number;
  deaths: number;
  xpPerHrM: number;
  savedAtIso: string;
}

interface PolledCharacter {
  name: string;
  league: string;
  className: string;
  level: number;
  experience: number;
}

const TOWN_REGEX = /(hideout|encampment|watch|bridge|highgate|oriath|karui shores|epilogue|kingsmarch|ziggurat|clearfell encampment|lioneye|forest encampment|sarn encampment|overseer)/i;

function classifyZone(area: string): ParsedAreaRun['kind'] {
  if (TOWN_REGEX.test(area)) return 'Hideout / Town';
  if (/safehouse|mastermind/i.test(area)) return 'Betrayal Safehouse';
  if (/atzoatl|apex of atzoatl/i.test(area)) return 'Temple of Atzoatl';
  if (/sanctum|labyrinth|aspirants|trial of/i.test(area)) return 'Sanctum / Lab';
  if (/shaper|elder|maven|sirus|searing exarch|eater of worlds|simulacrum|breachlord|chayula|delve/i.test(area)) {
    return 'Boss / Special';
  }
  return 'Map';
}

function formatDuration(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return m > 0 ? `${m}m ${rem}s` : `${rem}s`;
}

function todayDateInput(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const MapTrackerView: React.FC<MapTrackerViewProps> = ({
  selectedGame = 'poe1',
  userAccount
}) => {
  const [game, setGame] = useState<'poe1' | 'poe2'>(selectedGame);
  const [startDate, setStartDate] = useState<string>(todayDateInput);
  const [calendarOpen, setCalendarOpen] = useState<boolean>(false);
  const [calendarCursor, setCalendarCursor] = useState<Date>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [strategyTag, setStrategyTag] = useState<string>('Alch & Go Red Maps');
  const activeStrategyPresets = game === 'poe2' ? POE2_STRATEGY_PRESETS : STRATEGY_PRESETS;

  useEffect(() => {
    if (!activeStrategyPresets.includes(strategyTag)) {
      setStrategyTag(game === 'poe2' ? 'Waystones T11 to T15' : 'Alch & Go Red Maps');
    }
  }, [game]);
  const [sessionTitle, setSessionTitle] = useState<string>('Mapping Session');
  const [runs, setRuns] = useState<ParsedAreaRun[]>([]);
  const [deathTimestamps, setDeathTimestamps] = useState<number[]>([]);
  const [watchingLive, setWatchingLive] = useState<boolean>(false);
  const [lastFileReadAt, setLastFileReadAt] = useState<string>('');
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [charLeagueFilter, setCharLeagueFilter] = useState<string>('ALL');

  // Cloud Saved Map Sessions
  const [savedSessions, setSavedSessions] = useState<SavedMapSession[]>([]);
  const [cloudSynced, setCloudSynced] = useState<boolean>(false);
  const [savingCloud, setSavingCloud] = useState<boolean>(false);

  // Automatic GGG XP/hr Polling State
  const savedAssetPrefs = useMemo(() => {
    try {
      const raw = localStorage.getItem(PREFS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }, []);
  const savedOptInSess = useMemo(() => {
    try {
      const raw = localStorage.getItem(POESESSID_OPTIN_STORAGE_KEY);
      return raw ? JSON.parse(raw)?.poesessid || '' : '';
    } catch {
      return '';
    }
  }, []);

  const [accountName, setAccountName] = useState<string>(
    savedAssetPrefs.accountName || userAccount?.poeAccountName || ''
  );
  const [poesessid, setPoesessid] = useState<string>(savedOptInSess);
  const [characters, setCharacters] = useState<PolledCharacter[]>([]);
  const [selectedCharName, setSelectedCharName] = useState<string>('');
  const [xpCheckpoints, setXpCheckpoints] = useState<XpCheckpoint[]>([]);
  const [pollingXp, setPollingXp] = useState<boolean>(false);
  const [xpAutoMinutes, setXpAutoMinutes] = useState<number>(0);

  const fileHandleRef = useRef<any>(null);
  const nextXpPollMsRef = useRef<number>(0);

  useEffect(() => {
    document.title = 'Map Tracker & XP/hr Telemetry | Exile SSF';
  }, []);

  useEffect(() => {
    setGame(selectedGame);
  }, [selectedGame]);

  useEffect(() => {
    if (!userAccount?.displayName) return;
    let cancelled = false;
    fetchUserToolState<SavedMapSession[]>(userAccount.displayName, 'map_tracker_sessions').then((data) => {
      if (!cancelled && Array.isArray(data)) {
        setSavedSessions(data);
        setCloudSynced(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [userAccount?.displayName]);

  const parseClientTxtFromStartDate = useCallback(
    async (file: File, silent = false) => {
      try {
        // Read up to last 6 MB so multi day Client.txt histories parse quickly
        const sliceStart = Math.max(0, file.size - 6 * 1024 * 1024);
        const text = await file.slice(sliceStart).text();
        const lines = text.split(/\r?\n/);

        const startMs = Date.parse(`${startDate}T00:00:00`);
        const cutoffMs = Number.isFinite(startMs) ? startMs : Date.now() - 86_400_000;

        interface RawZoneEvt {
          ts: number;
          area: string;
          label: string;
        }
        const zoneEvents: RawZoneEvt[] = [];
        const deaths: number[] = [];

        for (const line of lines) {
          const tsMatch = line.match(/^(\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2})/);
          if (!tsMatch) continue;
          const ts = Date.parse(tsMatch[1].replace(/\//g, '-'));
          if (!Number.isFinite(ts) || ts < cutoffMs) continue;

          if (/You have entered (.+)\./i.test(line)) {
            const area = line.match(/You have entered (.+)\./i)?.[1]?.trim() || '';
            if (area) {
              zoneEvents.push({
                ts,
                area,
                label: new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
              });
            }
          } else if (/has been slain\./i.test(line)) {
            deaths.push(ts);
          }
        }

        const builtRuns: ParsedAreaRun[] = [];
        for (let i = 0; i < zoneEvents.length; i++) {
          const cur = zoneEvents[i];
          const next = zoneEvents[i + 1];
          const rawSec = next ? (next.ts - cur.ts) / 1000 : (Date.now() - cur.ts) / 1000;
          const durationSec = Math.max(1, Math.min(2700, Math.round(rawSec))); // Cap AFK breaks at 45m
          const runDeaths = deaths.filter((d) => d >= cur.ts && (!next || d < next.ts)).length;
          builtRuns.push({
            id: `${cur.ts}-${i}`,
            areaName: cur.area,
            kind: classifyZone(cur.area),
            enteredAtMs: cur.ts,
            enteredLabel: cur.label,
            durationSec,
            deathsInRun: runDeaths
          });
        }

        setRuns(builtRuns.reverse());
        setDeathTimestamps(deaths);
        setLastFileReadAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        if (!silent) {
          const mapCount = builtRuns.filter((r) => r.kind !== 'Hideout / Town').length;
          setNotice({
            type: 'ok',
            text: `Parsed ${mapCount} maps and ${builtRuns.length} total zone transitions since ${startDate}.`
          });
        }
      } catch (err: any) {
        if (!silent) setNotice({ type: 'err', text: err?.message || 'Could not read Client.txt.' });
      }
    },
    [startDate]
  );

  // Realtime 12 second poll when live file handle is active
  useEffect(() => {
    if (!watchingLive || !fileHandleRef.current) return;
    const poll = async () => {
      try {
        const file: File = await fileHandleRef.current.getFile();
        await parseClientTxtFromStartDate(file, true);
      } catch {}
    };
    poll();
    const timer = window.setInterval(poll, 12000);
    return () => window.clearInterval(timer);
  }, [watchingLive, parseClientTxtFromStartDate]);

  const handleStartLiveWatch = async () => {
    const picker = (window as any).showOpenFilePicker;
    if (typeof picker !== 'function') {
      setNotice({
        type: 'err',
        text: 'Your browser does not support live file handles. Use the One Time Client.txt Upload button instead.'
      });
      return;
    }
    try {
      const [handle] = await picker({
        multiple: false,
        types: [{ description: 'PoE Client Log', accept: { 'text/plain': ['.txt'] } }]
      });
      fileHandleRef.current = handle;
      setWatchingLive(true);
      const file: File = await handle.getFile();
      await parseClientTxtFromStartDate(file, false);
    } catch {}
  };

  const handlePollCharacterXp = useCallback(
    async (silent = false) => {
      if (!accountName.trim() || !poesessid.trim()) {
        if (!silent) {
          setNotice({
            type: 'err',
            text: 'Enter your PoE Account Name (with #tag) and POESESSID (or opt in on Asset Tracker) to poll live XP/hr.'
          });
        }
        return;
      }
      setPollingXp(true);
      try {
        const res = await fetch('/api/farming/character-xp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            accountName: accountName.trim(),
            poesessid: poesessid.trim(),
            realm: 'pc'
          })
        });
        const data: any = await res.json();
        if (!res.ok || data.error) {
          if (!silent) setNotice({ type: 'err', text: data.error || 'Could not read character XP from GGG.' });
          return;
        }
        const list: PolledCharacter[] = Array.isArray(data.characters) ? data.characters : [];
        setCharacters(list);
        if (list.length === 0) return;

        const activeChar =
          list.find((c) => c.name === selectedCharName) || list[0];
        if (!selectedCharName) setSelectedCharName(activeChar.name);

        const nowMs = Date.now();
        const label = new Date(nowMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setXpCheckpoints((prev) => {
          const baseline = prev[0];
          const elapsedHrs = baseline ? Math.max(1 / 3600, (nowMs - baseline.tsMs) / 3_600_000) : 0;
          const xpPerHour = baseline ? Math.max(0, Math.round((activeChar.experience - baseline.experience) / elapsedHrs)) : 0;
          return [
            ...prev.slice(-23),
            {
              at: label,
              tsMs: nowMs,
              level: activeChar.level,
              experience: activeChar.experience,
              xpPerHour
            }
          ];
        });

        if (!silent) {
          setNotice({
            type: 'ok',
            text: `Polled ${activeChar.name} (Lv ${activeChar.level} ${activeChar.className}): ${activeChar.experience.toLocaleString()} total XP.`
          });
        }
      } catch (err: any) {
        if (!silent) setNotice({ type: 'err', text: err?.message || 'Network error polling XP.' });
      } finally {
        setPollingXp(false);
      }
    },
    [accountName, poesessid, selectedCharName]
  );

  // Wall clock Auto XP Poll interval
  useEffect(() => {
    if (xpAutoMinutes <= 0) {
      nextXpPollMsRef.current = 0;
      return;
    }
    const intervalMs = xpAutoMinutes * 60_000;
    nextXpPollMsRef.current = Date.now() + intervalMs;
    const timer = window.setInterval(() => {
      if (Date.now() >= nextXpPollMsRef.current) {
        nextXpPollMsRef.current = Date.now() + intervalMs;
        handlePollCharacterXp(true);
      }
    }, 5000);
    return () => window.clearInterval(timer);
  }, [xpAutoMinutes, handlePollCharacterXp]);

  // Computed Mapping Telemetry
  const mapRuns = useMemo(() => runs.filter((r) => r.kind !== 'Hideout / Town'), [runs]);
  const hideoutRuns = useMemo(() => runs.filter((r) => r.kind === 'Hideout / Town'), [runs]);

  const totalMapSec = mapRuns.reduce((s, r) => s + r.durationSec, 0);
  const totalHideoutSec = hideoutRuns.reduce((s, r) => s + r.durationSec, 0);
  const totalActiveSec = totalMapSec + totalHideoutSec;
  const avgMapSec = mapRuns.length > 0 ? Math.round(totalMapSec / mapRuns.length) : 0;
  const mapsPerHr = totalActiveSec > 0 ? Number(((mapRuns.length / totalActiveSec) * 3600).toFixed(1)) : 0;
  const hideoutPct = totalActiveSec > 0 ? Math.round((totalHideoutSec / totalActiveSec) * 100) : 0;
  const specialZonesCount = mapRuns.filter((r) => r.kind !== 'Map').length;
  const latestXpHr = xpCheckpoints.length > 0 ? xpCheckpoints[xpCheckpoints.length - 1].xpPerHour : 0;
  const latestChar = characters.find((c) => c.name === selectedCharName) || characters[0] || null;

  const handleSaveSessionToCloud = async () => {
    if (!userAccount?.displayName) {
      setNotice({ type: 'err', text: 'Sign in to save Map Tracker sessions to Cloudflare D1.' });
      return;
    }
    setSavingCloud(true);
    const entry: SavedMapSession = {
      id: `map-${Date.now()}`,
      title: sessionTitle.trim() || `Mapping (${startDate})`,
      strategy: strategyTag,
      startDate,
      mapsCompleted: mapRuns.length,
      avgMapSec,
      mapsPerHr,
      hideoutPct,
      deaths: deathTimestamps.length,
      xpPerHrM: Number((latestXpHr / 1_000_000).toFixed(2)),
      savedAtIso: new Date().toISOString()
    };
    const next = [entry, ...savedSessions].slice(0, 40);
    setSavedSessions(next);
    const ok = await saveUserToolState(userAccount.displayName, 'map_tracker_sessions', next);
    setSavingCloud(false);
    if (ok) {
      setCloudSynced(true);
      setNotice({ type: 'ok', text: `Saved "${entry.title}" (${entry.mapsCompleted} maps, ${entry.mapsPerHr} maps/hr) to cloud!` });
    } else {
      setNotice({ type: 'err', text: 'Could not save to cloud. Verify your Exile SSF session.' });
    }
  };

  const handleDeleteSession = async (id: string) => {
    const next = savedSessions.filter((s) => s.id !== id);
    setSavedSessions(next);
    if (userAccount?.displayName) {
      await saveUserToolState(userAccount.displayName, 'map_tracker_sessions', next);
    }
  };

  const strategyRows = useMemo<StrategyCompareRow[]>(() => {
    const map = new Map<string, { runs: number; mapsPerHrSum: number; avgSecSum: number; xpSum: number }>();
    for (const s of savedSessions) {
      const cur = map.get(s.strategy) || { runs: 0, mapsPerHrSum: 0, avgSecSum: 0, xpSum: 0 };
      cur.runs += 1;
      cur.mapsPerHrSum += s.mapsPerHr;
      cur.avgSecSum += s.avgMapSec;
      cur.xpSum += s.xpPerHrM;
      map.set(s.strategy, cur);
    }
    return Array.from(map.entries())
      .map(([strategy, v]) => ({
        strategy,
        runs: v.runs,
        mapsPerHr: v.mapsPerHrSum / v.runs,
        avgMapSec: v.avgSecSum / v.runs,
        xpPerHrM: v.xpSum / v.runs
      }))
      .sort((a, b) => b.mapsPerHr - a.mapsPerHr);
  }, [savedSessions]);

  const copyClientPath = (id: string, path: string) => {
    navigator.clipboard?.writeText(path);
    setCopiedPath(id);
    setTimeout(() => setCopiedPath(null), 1800);
  };

  // Group polled GGG characters cleanly by league (prioritizing active/private leagues over Standard/Hardcore)
  const characterLeagues = useMemo(() => {
    const map = new Map<string, PolledCharacter[]>();
    for (const c of characters) {
      const lg = c.league || 'Other';
      const arr = map.get(lg) || [];
      arr.push(c);
      map.set(lg, arr);
    }
    const isPerm = (name: string) => /^(standard|hardcore|ssf standard|ssf hardcore|ruthless)/i.test(name);
    return Array.from(map.entries()).sort((a, b) => {
      const ap = isPerm(a[0]) ? 1 : 0;
      const bp = isPerm(b[0]) ? 1 : 0;
      if (ap !== bp) return ap - bp;
      return a[0].localeCompare(b[0]);
    });
  }, [characters]);

  const filteredCharacterLeagues = useMemo(() => {
    if (charLeagueFilter === 'ALL') return characterLeagues;
    return characterLeagues.filter(([lg]) => lg === charLeagueFilter);
  }, [characterLeagues, charLeagueFilter]);

  const selectDateObj = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setStartDate(`${y}-${m}-${day}`);
    setCalendarCursor(new Date(y, d.getMonth(), 1));
    setCalendarOpen(false);
  };

  const formattedStartDate = useMemo(() => {
    const dt = new Date(`${startDate}T12:00:00`);
    if (Number.isNaN(dt.getTime())) return startDate;
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, [startDate]);

  const calendarDays = useMemo(() => {
    const year = calendarCursor.getFullYear();
    const month = calendarCursor.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(year, month, day));
    return cells;
  }, [calendarCursor]);

  return (
    <div className="w-full space-y-5 pb-16 font-sans text-slate-200">
      {/* Unified Cinzel Indigo Gradient Header */}
      <header className="rounded-2xl border border-slate-800 bg-gradient-to-r from-[#0e1320] via-indigo-950/30 to-[#0e1320] p-5 space-y-3 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black font-cinzel text-white tracking-tight flex items-center gap-2">
                <Compass className="w-5 h-5 text-sky-400" />
                <span>Map Tracker</span>
              </h1>
              {watchingLive && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-[10px] font-mono font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>LIVE CLIENT.TXT</span>
                </span>
              )}
              {cloudSynced && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/15 border border-sky-400/40 text-sky-300 text-[10px] font-mono">
                  <Cloud className="w-3 h-3" />
                  <span>Cloud Synced</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
              Realtime Path of Exile mapping telemetry powered by your local <code className="text-emerald-300">Client.txt</code> and live GGG character experience polling. Pick a start date, leave this page open while mapping, and visualize your per map pace, hideout downtime, deaths, and XP/hr.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="flex bg-slate-950 p-0.5 rounded-xl border border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => setGame('poe1')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer ${
                  game === 'poe1' ? 'bg-indigo-600/30 text-white border border-indigo-400/50' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-400" /> PoE 1
              </button>
              <button
                type="button"
                onClick={() => setGame('poe2')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer ${
                  game === 'poe2' ? 'bg-indigo-600/30 text-white border border-indigo-400/50' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Hammer className="w-3.5 h-3.5 text-cyan-400" /> PoE 2
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Timekeeper's Map Device Speedrun Tip Banner */}
      <div className="rounded-2xl border border-amber-500/35 bg-gradient-to-r from-amber-950/25 via-slate-900/90 to-slate-900 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-400 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="space-y-0.5 text-xs">
            <div className="font-bold text-amber-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>In Game Speedrun Tip: Timekeeper's Map Device (Path of Exile 1 Store)</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Want a live area timer directly inside Path of Exile 1 while you map? The <strong>Timekeeper's Map Device</strong> displays exactly how long you have been in any area, including <strong>Betrayal Safehouses</strong> and <strong>The Temple of Atzoatl</strong>, making it a great companion to Map Tracker.
            </p>
          </div>
        </div>
        <a
          href="https://www.pathofexile.com/shop/item/TimekeepersMapDeviceVariations"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 text-xs font-bold inline-flex items-center gap-1.5 shrink-0 self-start md:self-center"
        >
          <span>View in PoE 1 Store</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {notice && (
        <div
          className={`px-4 py-2.5 rounded-xl border text-xs font-medium flex items-center justify-between gap-2 ${
            notice.type === 'ok'
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-500/15 border-rose-500/40 text-rose-200'
          }`}
        >
          <span>{notice.text}</span>
          <button type="button" onClick={() => setNotice(null)} className="text-[11px] font-mono opacity-75 hover:opacity-100 cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl border border-slate-800 bg-[#0d111a]">
          <div className="text-[10px] font-mono uppercase text-slate-400">Maps Run</div>
          <div className="text-2xl font-black font-mono text-white mt-1">{mapRuns.length}</div>
          <div className="text-[10px] font-mono text-sky-400 mt-0.5">{specialZonesCount} Special Zones</div>
        </div>
        <div className="p-4 rounded-2xl border border-slate-800 bg-[#0d111a]">
          <div className="text-[10px] font-mono uppercase text-slate-400">Mapping Pace</div>
          <div className="text-2xl font-black font-mono text-emerald-300 mt-1">{mapsPerHr}</div>
          <div className="text-[10px] font-mono text-slate-400 mt-0.5">maps / hour</div>
        </div>
        <div className="p-4 rounded-2xl border border-slate-800 bg-[#0d111a]">
          <div className="text-[10px] font-mono uppercase text-slate-400">Avg Map Time</div>
          <div className="text-2xl font-black font-mono text-amber-300 mt-1">{formatDuration(avgMapSec)}</div>
          <div className="text-[10px] font-mono text-slate-400 mt-0.5">active map avg</div>
        </div>
        <div className="p-4 rounded-2xl border border-slate-800 bg-[#0d111a]">
          <div className="text-[10px] font-mono uppercase text-slate-400">Hideout Downtime</div>
          <div className={`text-2xl font-black font-mono mt-1 ${hideoutPct > 35 ? 'text-rose-400' : 'text-sky-300'}`}>
            {hideoutPct}%
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-0.5">{formatDuration(totalHideoutSec)} in town</div>
        </div>
        <div className="p-4 rounded-2xl border border-slate-800 bg-[#0d111a]">
          <div className="text-[10px] font-mono uppercase text-slate-400">Live XP / Hour</div>
          <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
            {latestXpHr >= 1_000_000 ? `${(latestXpHr / 1_000_000).toFixed(1)}M` : latestXpHr > 0 ? `${Math.round(latestXpHr / 1000)}k` : '0'}
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
            {latestChar ? `Lv ${latestChar.level} ${latestChar.name}` : 'Poll GGG XP below'}
          </div>
        </div>
        <div className="p-4 rounded-2xl border border-slate-800 bg-[#0d111a]">
          <div className="text-[10px] font-mono uppercase text-slate-400">Deaths Logged</div>
          <div className={`text-2xl font-black font-mono mt-1 ${deathTimestamps.length > 0 ? 'text-rose-400' : 'text-emerald-300'}`}>
            {deathTimestamps.length}
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-0.5">since {startDate}</div>
        </div>
      </div>

      {/* Control Deck: Client.txt Live Watcher + GGG XP/hr Poller */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Client.txt Start Date & Live Watcher */}
        <section className="rounded-2xl border border-slate-800 bg-[#0d111a] p-4 space-y-3.5 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-mono uppercase font-bold text-sky-400 flex items-center gap-1.5">
              <Activity className="w-4 h-4" />
              <span>1. Realtime Client.txt Watcher (100% Local)</span>
            </div>
            {lastFileReadAt && (
              <span className="text-[10px] font-mono text-slate-400">Last read: {lastFileReadAt}</span>
            )}
          </div>

          {/* Clear 3 Step Setup Walkthrough */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/90 space-y-1.5 text-[11px] text-slate-300">
            <div className="font-mono text-[10px] uppercase font-bold text-amber-300">Quick 3 Step Setup:</div>
            <ol className="list-decimal pl-4 space-y-1 leading-relaxed">
              <li>
                <strong className="text-white">Copy your logs folder path</strong> below (Steam or Standalone).
              </li>
              <li>
                <strong className="text-white">Pick your Start Date</strong> using the calendar so only maps from that day onward are counted.
              </li>
              <li>
                Click <strong className="text-emerald-300">Start Live Watch</strong>, paste the folder path into the file picker address bar, select <code className="text-sky-300">Client.txt</code>, and keep this tab open as you play.
              </li>
            </ol>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-slate-400">
            <span>Step 1 (Copy folder):</span>
            <button
              type="button"
              onClick={() => copyClientPath('steam', 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Path of Exile\\logs')}
              className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 hover:border-sky-400 text-slate-200 inline-flex items-center gap-1 cursor-pointer"
            >
              {copiedPath === 'steam' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-sky-400" />}
              <span>{copiedPath === 'steam' ? 'Copied Steam Path!' : 'Copy Steam Logs Path'}</span>
            </button>
            <button
              type="button"
              onClick={() => copyClientPath('standalone', 'C:\\Program Files (x86)\\Grinding Gear Games\\Path of Exile\\logs')}
              className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 hover:border-sky-400 text-slate-200 inline-flex items-center gap-1 cursor-pointer"
            >
              {copiedPath === 'standalone' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-sky-400" />}
              <span>{copiedPath === 'standalone' ? 'Copied Standalone Path!' : 'Copy Standalone Logs Path'}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <button
              type="button"
              onClick={() => setCalendarOpen(true)}
              className="flex items-center gap-2 bg-slate-950 hover:bg-slate-900 px-3 py-2 rounded-xl border border-amber-500/40 text-left cursor-pointer transition-colors"
            >
              <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-slate-400 font-mono text-[11px]">Start Date:</span>
              <span className="text-white font-mono font-bold">{formattedStartDate}</span>
            </button>

            {!watchingLive ? (
              <button
                type="button"
                onClick={handleStartLiveWatch}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold inline-flex items-center gap-1.5 cursor-pointer shadow"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Start Live Watch (Client.txt)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setWatchingLive(false)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Square className="w-3.5 h-3.5" />
                <span>Stop Live Watch</span>
              </button>
            )}

            <label className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold inline-flex items-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-sky-400" />
              <span>One Time Read</span>
              <input
                type="file"
                accept=".txt"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) parseClientTxtFromStartDate(f, false);
                }}
              />
            </label>
          </div>
        </section>

        {/* Right: Automatic GGG XP/hr Poller + Save Session */}
        <section className="rounded-2xl border border-slate-800 bg-[#0d111a] p-4 space-y-3.5 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-mono uppercase font-bold text-emerald-400">
              2. Live GGG Character XP/hr &amp; Cloud Save
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-mono">
              <span className="text-slate-400">Auto XP:</span>
              <select
                value={xpAutoMinutes}
                onChange={(e) => setXpAutoMinutes(Number(e.target.value))}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-0.5 text-white cursor-pointer"
              >
                <option value={0}>Off</option>
                <option value={5}>5m</option>
                <option value={15}>15m</option>
                <option value={30}>30m</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="Account (e.g. Leuie#0626)"
              className="sm:col-span-4 px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
            />
            <input
              type="password"
              value={poesessid}
              onChange={(e) => setPoesessid(e.target.value)}
              placeholder="POESESSID (Auto filled if opted in)"
              className="sm:col-span-5 px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-amber-300 font-mono"
            />
            <button
              type="button"
              disabled={pollingXp}
              onClick={() => handlePollCharacterXp(false)}
              className="sm:col-span-3 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold inline-flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${pollingXp ? 'animate-spin' : ''}`} />
              <span>Poll XP</span>
            </button>
          </div>

          {characters.length > 0 && (
            <div className="space-y-2 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono uppercase text-slate-400">League:</span>
                <select
                  value={charLeagueFilter}
                  onChange={(e) => {
                    const nextLg = e.target.value;
                    setCharLeagueFilter(nextLg);
                    const matchGroup = nextLg === 'ALL' ? characterLeagues[0] : characterLeagues.find(([lg]) => lg === nextLg);
                    if (matchGroup && matchGroup[1][0]) {
                      setSelectedCharName(matchGroup[1][0].name);
                      setXpCheckpoints([]);
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-amber-200 font-semibold cursor-pointer max-w-[260px]"
                >
                  <option value="ALL" className="bg-slate-950">All Leagues ({characterLeagues.length})</option>
                  {characterLeagues.map(([lg, list]) => (
                    <option key={lg} value={lg} className="bg-slate-950">
                      {lg} ({list.length})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono uppercase text-slate-400">Character:</span>
                <select
                  value={selectedCharName}
                  onChange={(e) => {
                    setSelectedCharName(e.target.value);
                    setXpCheckpoints([]);
                  }}
                  className="flex-1 min-w-[200px] px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-emerald-300 font-semibold cursor-pointer"
                >
                  {filteredCharacterLeagues.map(([lg, list]) => (
                    <optgroup key={lg} label={lg} className="bg-slate-950 text-amber-300">
                      {list.map((c) => (
                        <option key={c.name} value={c.name} className="bg-slate-950 text-slate-100">
                          {c.name} (Lv {c.level} {c.className})
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
            <input
              type="text"
              value={sessionTitle}
              onChange={(e) => setSessionTitle(e.target.value)}
              placeholder="Session name"
              className="flex-1 min-w-[140px] px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
            />
            <select
              value={strategyTag}
              onChange={(e) => setStrategyTag(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-amber-200 font-semibold cursor-pointer"
            >
              {activeStrategyPresets.map((st) => (
                <option key={st} value={st} className="bg-slate-950">{st}</option>
              ))}
            </select>
            <button
              type="button"
              disabled={savingCloud || mapRuns.length === 0}
              onClick={handleSaveSessionToCloud}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <CloudUpload className="w-3.5 h-3.5" />
              <span>{savingCloud ? 'Saving...' : 'Save Session'}</span>
            </button>
          </div>
        </section>
      </div>

      {/* Charts 4 & 5: Live XP/hr Timeline + Atlas Strategy Speed Comparison */}
      <MapAnalyticsCharts
        xpCheckpoints={xpCheckpoints}
        deathTimestamps={deathTimestamps}
        strategyRows={strategyRows}
      />

      {/* Recent Area Runs Table & Cloud Saved Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <section className="lg:col-span-8 rounded-2xl border border-slate-800 bg-[#0d111a] overflow-hidden shadow-lg">
          <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/70 flex items-center justify-between">
            <span className="text-xs font-mono uppercase font-bold text-slate-200">
              Recent Areas Entered Since {startDate} ({mapRuns.length} Maps)
            </span>
            <span className="text-[11px] font-mono text-slate-400">Newest first</span>
          </div>

          {mapRuns.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-400">
              Click <strong>Start Live Watch (Client.txt)</strong> or <strong>One Time Read</strong> above to populate your recent maps, Betrayal Safehouses, and Temple runs.
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-950 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Entered</th>
                    <th className="p-2.5">Area / Map</th>
                    <th className="p-2.5">Category</th>
                    <th className="p-2.5 text-right">Duration</th>
                    <th className="p-2.5 text-right">Deaths</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {mapRuns.slice(0, 120).map((run) => (
                    <tr key={run.id} className="hover:bg-slate-800/35">
                      <td className="p-2.5 font-mono text-slate-400">{run.enteredLabel}</td>
                      <td className="p-2.5 font-semibold text-white">{run.areaName}</td>
                      <td className="p-2.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                            run.kind === 'Betrayal Safehouse' || run.kind === 'Temple of Atzoatl'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : run.kind === 'Boss / Special'
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                              : 'bg-slate-900 text-slate-300 border-slate-700'
                          }`}
                        >
                          {run.kind}
                        </span>
                      </td>
                      <td className="p-2.5 text-right font-mono text-sky-300 font-bold">{formatDuration(run.durationSec)}</td>
                      <td className="p-2.5 text-right font-mono">
                        {run.deathsInRun > 0 ? (
                          <span className="inline-flex items-center gap-1 text-rose-400 font-bold">
                            <Skull className="w-3 h-3" /> {run.deathsInRun}
                          </span>
                        ) : (
                          <span className="text-slate-600">0</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Cloud Saved Mapping History */}
        <aside className="lg:col-span-4 rounded-2xl border border-slate-800 bg-[#0d111a] p-4 space-y-3 shadow-lg">
          <div className="text-xs font-mono uppercase font-bold text-amber-400">
            Saved Cloud Map History ({savedSessions.length})
          </div>
          {savedSessions.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No saved map sessions yet. Parse your Client.txt and click Save Session above.
            </div>
          ) : (
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-0.5">
              {savedSessions.map((s) => (
                <div key={s.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-2">
                  <div className="min-w-0 space-y-0.5">
                    <div className="text-xs font-bold text-white truncate">{s.title}</div>
                    <div className="text-[10px] font-mono text-amber-300">{s.strategy}</div>
                    <div className="text-[10px] font-mono text-slate-400">
                      {s.mapsCompleted} maps • {s.mapsPerHr}/hr • {formatDuration(s.avgMapSec)} avg • {s.hideoutPct}% town
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteSession(s.id)}
                    className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                    title="Delete saved session"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
      {/* Custom Start Date Calendar Modal */}
      {calendarOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setCalendarOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-indigo-500/40 bg-[#0d111a] p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>Select Mapping Start Date</span>
              </div>
              <button
                type="button"
                onClick={() => setCalendarOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Presets */}
            <div className="grid grid-cols-3 gap-1.5 text-[11px] font-mono">
              <button
                type="button"
                onClick={() => selectDateObj(new Date())}
                className="py-1.5 rounded-lg bg-slate-900 hover:bg-indigo-600/30 border border-slate-800 text-slate-200 font-bold cursor-pointer"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() - 1);
                  selectDateObj(d);
                }}
                className="py-1.5 rounded-lg bg-slate-900 hover:bg-indigo-600/30 border border-slate-800 text-slate-200 font-bold cursor-pointer"
              >
                Yesterday
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() - 6);
                  selectDateObj(d);
                }}
                className="py-1.5 rounded-lg bg-slate-900 hover:bg-indigo-600/30 border border-slate-800 text-slate-200 font-bold cursor-pointer"
              >
                Last 7 Days
              </button>
            </div>

            {/* Month Switcher */}
            <div className="flex items-center justify-between px-1">
              <button
                type="button"
                onClick={() => setCalendarCursor(new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() - 1, 1))}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-bold text-white font-cinzel">
                {calendarCursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button
                type="button"
                onClick={() => setCalendarCursor(new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() + 1, 1))}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* 7 Day Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-mono uppercase text-slate-500">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((wd) => (
                <div key={wd} className="py-1">{wd}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 text-xs font-mono">
              {calendarDays.map((dayObj, idx) => {
                if (!dayObj) return <div key={`empty-${idx}`} />;
                const iso = `${dayObj.getFullYear()}-${String(dayObj.getMonth() + 1).padStart(2, '0')}-${String(dayObj.getDate()).padStart(2, '0')}`;
                const isSelected = iso === startDate;
                const isToday = iso === todayDateInput();
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => selectDateObj(dayObj)}
                    className={`py-2 rounded-lg font-bold transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow'
                        : isToday
                        ? 'bg-amber-500/20 border border-amber-400/50 text-amber-200'
                        : 'bg-slate-900/70 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    {dayObj.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
