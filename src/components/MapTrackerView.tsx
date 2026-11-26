import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Compass,
  Play,
  Square,
  Upload,
  Cloud,
  CloudUpload,
  Skull,
  Sparkles,
  RefreshCw,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  Trash2,
  Activity,
  Flame,
  Hammer,
  Sliders,
  BarChart3,
  ListChecks,
  Filter,
  Radio
} from 'lucide-react';
import type { UserAccount, LeagueFirstMilestone, PersonalSessionGoal, ExileProfile } from '../types';
import {
  fetchUserToolState,
  saveUserToolState,
  saveCloudLeagueFirst,
  fetchCloudProfile,
  saveCloudProfile
} from '../services/cloudSync';
import { MapRegexBuilder } from './league/widgets/MapRegexBuilder';
import { SessionScratchpad } from './league/widgets/SessionScratchpad';
import { AtlasSkillTreePlanner } from './maps/AtlasSkillTreePlanner';
import {
  BossRushTrackerWidget,
  CampaignSplitsWidget,
  SideContentTrackersWidget
} from './maps/SpecializedTelemetrySuite';
import { ToolWidgetGrid, type ToolWidgetDefinition } from './ui/ToolWidgetGrid';
import { readUnifiedPoeSession } from '../utils/poeSession';
import {
  readActiveCharacter,
  readActiveStrategy,
  saveActiveStrategy,
  type ActiveCharacterContext
} from '../utils/activeCharacter';
import { publishLiveFarmingSession } from '../utils/activeSession';
import {
  PREFS_STORAGE_KEY,
  STRATEGY_PRESETS,
  POE2_STRATEGY_PRESETS
} from './assets/assetEngine';
import {
  MapAnalyticsCharts,
  type StrategyCompareRow,
  type XpCheckpoint
} from './maps/MapAnalyticsCharts';
import {
  ClientTxtDeepInsights,
  type LevelUpEvent,
  type GsfTradeTelemetry,
  type CapturedLeagueFirstProof
} from './maps/ClientTxtDeepInsights';

interface MapTrackerViewProps {
  selectedGame?: 'poe1' | 'poe2';
  userAccount?: UserAccount | null;
}

interface ParsedAreaRun {
  id: string;
  areaName: string;
  kind: 'Map' | 'Hideout / Town' | 'Delve' | 'Betrayal Safehouse' | 'Temple of Atzoatl' | 'Sanctum / Lab' | 'Boss / Special';
  enteredAtMs: number;
  enteredLabel: string;
  durationSec: number;
  deathsInRun: number;
  areaLevel?: number;
  areaCode?: string;
  seed?: string;
  mechanics?: string[];
}

interface SavedMapSession {
  id: string;
  title: string;
  strategy: string;
  atlasTreeName?: string;
  characterName?: string;
  characterLevel?: number;
  characterClass?: string;
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

const TOWN_REGEX = /(hideout|encampment|lioneye's watch|bridge encampment|highgate|oriath|karui shores|epilogue|kingsmarch|ziggurat encampment|rogue harbour|clearfell encampment|forest encampment|sarn encampment|overseer's tower)/i;

function classifyZone(area: string): ParsedAreaRun['kind'] {
  if (TOWN_REGEX.test(area)) return 'Hideout / Town';
  if (/azurite mine|primeval chambers|abyssal city|vaal outpost|crystal king|kurgal|ahuatotli|delve/i.test(area)) {
    return 'Delve';
  }
  if (/safehouse|mastermind/i.test(area)) return 'Betrayal Safehouse';
  if (/atzoatl|apex of atzoatl/i.test(area)) return 'Temple of Atzoatl';
  if (/sanctum|labyrinth|aspirants|trial of/i.test(area)) return 'Sanctum / Lab';
  if (/shaper|elder|maven|sirus|searing exarch|eater of worlds|simulacrum|breachlord|chayula/i.test(area)) {
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
  const [showAboutMapTracker, setShowAboutMapTracker] = useState<boolean>(false);
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
  const [levelUps, setLevelUps] = useState<LevelUpEvent[]>([]);
  const [deathTimestamps, setDeathTimestamps] = useState<number[]>([]);
  const [tradeTelemetry, setTradeTelemetry] = useState<GsfTradeTelemetry>({
    incomingWhispers: 0,
    outgoingWhispers: 0,
    tradesAccepted: 0,
    tradingTimeSec: 0,
    afkHideoutSec: 0
  });
  const [capturedProofs, setCapturedProofs] = useState<CapturedLeagueFirstProof[]>([]);
  const [watchingLive, setWatchingLive] = useState<boolean>(false);
  const [shareSquadPresence, setShareSquadPresence] = useState<boolean>(() => {
    try {
      return localStorage.getItem('exile_ssf_share_squad_presence') === '1';
    } catch {
      return false;
    }
  });
  const [lastFileReadAt, setLastFileReadAt] = useState<string>('');
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);
  const [notice, setNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const supportsLiveHandles = typeof window !== 'undefined' && typeof (window as any).showOpenFilePicker === 'function';
  const [charLeagueFilter, setCharLeagueFilter] = useState<string>('ALL');

  const sessionsLocalKey = game === 'poe2' ? 'exile_ssf_poe2_map_sessions_v1' : 'exile_ssf_map_sessions_v1';
  const sessionsCloudKey = game === 'poe2' ? 'map_tracker_sessions_poe2' : 'map_tracker_sessions';

  // Cloud Saved Map Sessions (strictly separated per game: PoE 1 vs PoE 2)
  const [savedSessions, setSavedSessions] = useState<SavedMapSession[]>(() => {
    try {
      const initKey = selectedGame === 'poe2' ? 'exile_ssf_poe2_map_sessions_v1' : 'exile_ssf_map_sessions_v1';
      const raw = localStorage.getItem(initKey);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [cloudSynced, setCloudSynced] = useState<boolean>(false);
  const [savingCloud, setSavingCloud] = useState<boolean>(false);

  // Automatic GGG XP/hr Polling State (powered by Unified Tool Setup)
  const savedAssetPrefs = useMemo(() => {
    try {
      const raw = localStorage.getItem(PREFS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }, []);
  const savedUnifiedSess = useMemo(() => readUnifiedPoeSession(), []);

  const [accountName, setAccountName] = useState<string>(
    savedUnifiedSess?.accountName || savedAssetPrefs.accountName || userAccount?.poeAccountName || ''
  );
  const [poesessid, setPoesessid] = useState<string>(savedUnifiedSess?.poesessid || '');
  const [activeCharCtx, setActiveCharCtx] = useState<ActiveCharacterContext | null>(() => readActiveCharacter());
  const [linkedAtlasName, setLinkedAtlasName] = useState<string>(() => readActiveStrategy()?.atlasTreeName || '');

  useEffect(() => {
    const onToolSetupUpdated = () => {
      const sess = readUnifiedPoeSession();
      if (sess?.poesessid) setPoesessid(sess.poesessid);
      else setPoesessid('');
      if (sess?.accountName) setAccountName(sess.accountName);
    };
    const onCharUpdated = () => setActiveCharCtx(readActiveCharacter());
    const onStratUpdated = () => {
      const st = readActiveStrategy();
      if (st?.strategy) setStrategyTag(st.strategy);
      if (st?.atlasTreeName) setLinkedAtlasName(st.atlasTreeName);
    };
    window.addEventListener('exile-tool-setup-updated', onToolSetupUpdated);
    window.addEventListener('exile-active-character-updated', onCharUpdated);
    window.addEventListener('exile-active-strategy-updated', onStratUpdated);
    return () => {
      window.removeEventListener('exile-tool-setup-updated', onToolSetupUpdated);
      window.removeEventListener('exile-active-character-updated', onCharUpdated);
      window.removeEventListener('exile-active-strategy-updated', onStratUpdated);
    };
  }, []);
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

  // Reload per-game local saved sessions when switching PoE 1 <-> PoE 2 so PoE 1 sessions never leak into PoE 2
  useEffect(() => {
    try {
      const raw = localStorage.getItem(sessionsLocalKey);
      const parsed = raw ? JSON.parse(raw) : [];
      setSavedSessions(Array.isArray(parsed) ? parsed : []);
    } catch {
      setSavedSessions([]);
    }
  }, [sessionsLocalKey]);

  useEffect(() => {
    try {
      localStorage.setItem(sessionsLocalKey, JSON.stringify(savedSessions.slice(0, 40)));
    } catch {}
  }, [savedSessions, sessionsLocalKey]);

  useEffect(() => {
    try {
      localStorage.setItem('exile_ssf_share_squad_presence', shareSquadPresence ? '1' : '0');
    } catch {}
  }, [shareSquadPresence]);

  // Opt in Squad Presence heartbeat when Live Watch is running
  useEffect(() => {
    if (!shareSquadPresence || !watchingLive || !userAccount?.displayName) return;
    const latestRun = runs[0];
    if (!latestRun) return;
    const targetLeague = game === 'poe2' ? 'poe2-05-ancients' : 'poe1-330-umbra';
    const sendBeat = () => {
      fetch('/api/league/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          leagueId: targetLeague,
          handle: userAccount.displayName,
          characterName: activeCharCtx?.name || userAccount.characterName || '',
          zone: latestRun.areaName,
          zoneKind: latestRun.kind,
          active: true
        })
      }).catch(() => {});
    };
    sendBeat();
    const timer = window.setInterval(sendBeat, 60_000);
    return () => window.clearInterval(timer);
  }, [shareSquadPresence, watchingLive, userAccount?.displayName, userAccount?.characterName, activeCharCtx?.name, runs[0]?.areaName, runs[0]?.kind, game]);

  useEffect(() => {
    if (!userAccount?.displayName) return;
    let cancelled = false;
    fetchUserToolState<SavedMapSession[]>(userAccount.displayName, sessionsCloudKey).then((data) => {
      if (!cancelled && Array.isArray(data)) {
        setSavedSessions((prev) => {
          const merged = new Map<string, SavedMapSession>();
          for (const s of data) if (s?.id) merged.set(s.id, s);
          for (const s of prev) if (s?.id && !merged.has(s.id)) merged.set(s.id, s);
          return Array.from(merged.values())
            .sort((a, b) => String(b.savedAtIso || '').localeCompare(String(a.savedAtIso || '')))
            .slice(0, 40);
        });
        setCloudSynced(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [userAccount?.displayName, sessionsCloudKey]);

  // Mapping Toolkit (Map Regex Builder & Session Scratchpad) synced to Exile Profile in D1
  const [toolkitProfile, setToolkitProfile] = useState<ExileProfile | null>(null);
  const [savedBricks, setSavedBricks] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('exile_ssf_map_regex_bricks_v1');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [savedGoals, setSavedGoals] = useState<PersonalSessionGoal[]>(() => {
    try {
      const raw = localStorage.getItem('exile_ssf_session_goals_v1');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const handle = userAccount?.displayName?.trim();
    if (!handle) {
      setToolkitProfile(null);
      return;
    }
    let cancelled = false;
    fetchCloudProfile(handle)
      .then((res) => {
        if (cancelled || !res?.profile) return;
        setToolkitProfile(res.profile);
        if (Array.isArray(res.profile.mapRegexBricks)) setSavedBricks(res.profile.mapRegexBricks);
        if (Array.isArray(res.profile.sessionGoals)) setSavedGoals(res.profile.sessionGoals);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [userAccount?.displayName]);

  const handleSaveMapBricks = async (bricks: string[]) => {
    setSavedBricks(bricks);
    try {
      localStorage.setItem('exile_ssf_map_regex_bricks_v1', JSON.stringify(bricks));
    } catch {}
    if (toolkitProfile) {
      const updated: ExileProfile = { ...toolkitProfile, mapRegexBricks: bricks };
      const ok = await saveCloudProfile(updated);
      if (ok) setToolkitProfile(updated);
    }
  };

  const handleSaveSessionGoals = async (goals: PersonalSessionGoal[]) => {
    setSavedGoals(goals);
    try {
      localStorage.setItem('exile_ssf_session_goals_v1', JSON.stringify(goals));
    } catch {}
    if (toolkitProfile) {
      const updated: ExileProfile = { ...toolkitProfile, sessionGoals: goals };
      const ok = await saveCloudProfile(updated);
      if (ok) setToolkitProfile(updated);
    }
  };

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
          areaLevel?: number;
          areaCode?: string;
          seed?: string;
          mechanics: Set<string>;
        }
        const zoneEvents: RawZoneEvt[] = [];
        const deaths: number[] = [];
        const parsedLevels: LevelUpEvent[] = [];
        let pendingGen: { level: number; code: string; seed: string; ts: number } | null = null;
        const lastLevelTsByChar = new Map<string, number>();
        let incomingWhispers = 0;
        let outgoingWhispers = 0;
        let tradesAccepted = 0;
        const tradeActivityTimestamps: number[] = [];
        const proofsMap = new Map<string, CapturedLeagueFirstProof>();

        const detectNpcMechanic = (ln: string): string | null => {
          if (/Einhar, Beastmaster:/i.test(ln)) return 'Bestiary';
          if (/Niko, Master of the Depths:/i.test(ln)) return 'Delve';
          if (/Alva, Master Explorer:/i.test(ln)) return 'Incursion';
          if (/Jun, Veiled Master:/i.test(ln)) return 'Betrayal';
          if (/Sister Cassia:/i.test(ln)) return 'Blight';
          if (/\b(Tujen|Rog|Gwennen|Dannig):/i.test(ln)) return 'Expedition';
          if (/Oshabi:/i.test(ln)) return 'Harvest';
          if (/The Nameless Seer:/i.test(ln)) return 'Nameless Seer';
          if (/The Maven:/i.test(ln)) return 'Maven';
          if (/The Searing Exarch:/i.test(ln)) return 'Searing Exarch';
          if (/The Eater of Worlds:/i.test(ln)) return 'Eater of Worlds';
          if (/The Envoy:/i.test(ln)) return 'Eldritch Envoy';
          if (/The Trialmaster:/i.test(ln)) return 'Ultimatum';
          if (/\b(The Shaper|The Elder|Sirus, Awakener|Venarius):/i.test(ln)) return 'Pinnacle Boss';
          return null;
        };

        for (const line of lines) {
          const tsMatch = line.match(/^(\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2})/);
          if (!tsMatch) continue;
          const ts = Date.parse(tsMatch[1].replace(/\//g, '-'));
          if (!Number.isFinite(ts) || ts < cutoffMs) continue;

          const genMatch = line.match(/Generating level (\d+) area "([^"]+)" with seed (\d+)/i);
          if (genMatch) {
            pendingGen = {
              level: Number(genMatch[1]),
              code: genMatch[2],
              seed: genMatch[3],
              ts
            };
            continue;
          }

          if (/You have entered (.+)\./i.test(line)) {
            const area = line.match(/You have entered (.+)\./i)?.[1]?.trim() || '';
            if (area) {
              const useGen = pendingGen && Math.abs(ts - pendingGen.ts) <= 30_000 ? pendingGen : null;
              zoneEvents.push({
                ts,
                area,
                label: new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                areaLevel: useGen?.level,
                areaCode: useGen?.code,
                seed: useGen?.seed,
                mechanics: new Set<string>()
              });
              pendingGen = null;
            }
          } else if (/has been slain\./i.test(line)) {
            deaths.push(ts);
          } else if (/\]\s*@From\s+/i.test(line)) {
            incomingWhispers += 1;
            tradeActivityTimestamps.push(ts);
          } else if (/\]\s*@To\s+/i.test(line)) {
            outgoingWhispers += 1;
            tradeActivityTimestamps.push(ts);
          } else if (/:\s*Trade accepted\./i.test(line)) {
            tradesAccepted += 1;
            tradeActivityTimestamps.push(ts);
          } else {
            const lvlMatch = line.match(/:\s*([^\s:]+)\s+\(([^)]+)\)\s+is now level (\d+)/i);
            if (lvlMatch) {
              const charName = lvlMatch[1].trim();
              const className = lvlMatch[2].trim();
              const level = Number(lvlMatch[3]);
              const prevTs = lastLevelTsByChar.get(charName.toLowerCase());
              const durationSec = prevTs ? Math.max(1, Math.round((ts - prevTs) / 1000)) : null;
              lastLevelTsByChar.set(charName.toLowerCase(), ts);
              parsedLevels.push({
                charName,
                className,
                level,
                tsMs: ts,
                label: new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                durationSec
              });
              if (level === 90 || level === 95 || level === 100) {
                const pKey = `lvl-${level}-${charName.toLowerCase()}`;
                if (!proofsMap.has(pKey)) {
                  proofsMap.set(pKey, {
                    id: `proof-${pKey}-${ts}`,
                    title: `First Level ${level} (${className})`,
                    category: 'Level',
                    charName,
                    timestampIso: new Date(ts).toISOString(),
                    label: new Date(ts).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                  });
                }
              }
            } else if (zoneEvents.length > 0) {
              const mech = detectNpcMechanic(line);
              if (mech) {
                zoneEvents[zoneEvents.length - 1].mechanics.add(mech);
                if (['Maven', 'Searing Exarch', 'Eater of Worlds', 'Pinnacle Boss'].includes(mech)) {
                  const bossTitle =
                    mech === 'Pinnacle Boss'
                      ? line.match(/\b(The Shaper|The Elder|Sirus, Awakener[^:]*|Venarius):/i)?.[1] || 'Pinnacle Boss'
                      : mech;
                  const bKey = `boss-${bossTitle.toLowerCase()}`;
                  if (!proofsMap.has(bKey)) {
                    proofsMap.set(bKey, {
                      id: `proof-${bKey}-${ts}`,
                      title: `${bossTitle} Encounter`,
                      category: 'Boss',
                      charName: selectedCharName || userAccount?.characterName || userAccount?.displayName || '',
                      timestampIso: new Date(ts).toISOString(),
                      label: new Date(ts).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                    });
                  }
                }
              }
            }
          }
        }

        const builtRuns: ParsedAreaRun[] = [];
        for (let i = 0; i < zoneEvents.length; i++) {
          const cur = zoneEvents[i];
          const next = zoneEvents[i + 1];
          // For uploaded historical logs (>30m stale), don't inflate the final zone with 45 fake minutes
          const staleLast = !next && Date.now() - cur.ts > 30 * 60 * 1000;
          const rawSec = next ? (next.ts - cur.ts) / 1000 : staleLast ? 60 : (Date.now() - cur.ts) / 1000;
          const durationSec = Math.max(1, Math.min(2700, Math.round(rawSec))); // Cap AFK breaks at 45m
          const runDeaths = deaths.filter((d) => d >= cur.ts && (!next || d < next.ts)).length;
          builtRuns.push({
            id: `${cur.ts}-${i}`,
            areaName: cur.area,
            kind: classifyZone(cur.area),
            enteredAtMs: cur.ts,
            enteredLabel: cur.label,
            durationSec,
            deathsInRun: runDeaths,
            areaLevel: cur.areaLevel,
            areaCode: cur.areaCode,
            seed: cur.seed,
            mechanics: Array.from(cur.mechanics)
          });
        }

        // Separate GSF Trading Time from AFK Hideout Time
        let tradingTimeSec = 0;
        let afkHideoutSec = 0;
        for (const r of builtRuns) {
          if (r.kind !== 'Hideout / Town') continue;
          const endMs = r.enteredAtMs + r.durationSec * 1000;
          const hadTradeEvt = tradeActivityTimestamps.some((t) => t >= r.enteredAtMs && t <= endMs);
          if (hadTradeEvt) tradingTimeSec += r.durationSec;
          else afkHideoutSec += r.durationSec;
        }

        setRuns(builtRuns.reverse());
        setLevelUps(parsedLevels);
        setDeathTimestamps(deaths);
        setTradeTelemetry({
          incomingWhispers,
          outgoingWhispers,
          tradesAccepted,
          tradingTimeSec,
          afkHideoutSec
        });
        setCapturedProofs(Array.from(proofsMap.values()).reverse());
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

  // Broadcast live session metrics to Asset Tracker Net Profit Calculator & global Live Mapping HUD
  useEffect(() => {
    publishLiveFarmingSession({
      watchingLive,
      mapsCompleted: mapRuns.length,
      elapsedMinutes: Math.round(totalActiveSec / 60),
      currentZone: runs[0]?.areaName || '',
      zoneKind: runs[0]?.kind || '',
      mapsPerHr,
      xpPerHrM: Number((latestXpHr / 1_000_000).toFixed(2)),
      strategyTag,
      updatedAtIso: new Date().toISOString()
    });
  }, [watchingLive, mapRuns.length, totalActiveSec, runs[0]?.areaName, runs[0]?.kind, mapsPerHr, latestXpHr, strategyTag]);

  const handleSaveSessionToCloud = async () => {
    if (!userAccount?.displayName) {
      setNotice({ type: 'err', text: 'Sign in to save Map Tracker sessions to Cloud.' });
      return;
    }
    setSavingCloud(true);
    const entry: SavedMapSession = {
      id: `map-${Date.now()}`,
      title: sessionTitle.trim() || `Mapping (${startDate})`,
      strategy: strategyTag,
      atlasTreeName: linkedAtlasName || undefined,
      characterName: latestChar?.name || activeCharCtx?.name || undefined,
      characterLevel: latestChar?.level || activeCharCtx?.level || undefined,
      characterClass: latestChar?.className || activeCharCtx?.className || undefined,
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
    const ok = await saveUserToolState(userAccount.displayName, sessionsCloudKey, next);
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
      await saveUserToolState(userAccount.displayName, sessionsCloudKey, next);
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
              <button
                type="button"
                onClick={() => setShowAboutMapTracker((v) => !v)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                  showAboutMapTracker
                    ? 'bg-indigo-600/25 border-indigo-400/60 text-white'
                    : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:text-white hover:border-slate-600'
                }`}
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>{showAboutMapTracker ? 'Hide Guide' : 'What Is This?'}</span>
              </button>
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

        {showAboutMapTracker && (
          <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <div className="font-mono text-[10px] uppercase font-bold text-sky-400">1. Local Client.txt Live Watcher</div>
              <p className="text-slate-300 leading-relaxed">
                Copy your Steam or Standalone folder path, select <code className="text-emerald-300">Client.txt</code> in your browser, and pick a <strong className="text-white">Start Date</strong> from the calendar modal. Your log is parsed 100% locally in your browser to time every map, hideout break, Betrayal Safehouse, Temple of Atzoatl, and death.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <div className="font-mono text-[10px] uppercase font-bold text-amber-400">2. Automatic GGG XP/hr &amp; League Filtering</div>
              <p className="text-slate-300 leading-relaxed">
                Load your characters grouped by league and poll GGG's official character experience counter automatically (every 5m, 10m, or 15m) to plot real <strong className="text-white">XP/hr timelines</strong> with death markers and see how fast you are leveling toward 100.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <div className="font-mono text-[10px] uppercase font-bold text-emerald-400">3. Strategy Presets &amp; Cloud Sessions</div>
              <p className="text-slate-300 leading-relaxed">
                Tag runs with PoE 1 (<strong className="text-white">Campaign, Alch &amp; Go White/Yellow/Red, T17, Essence</strong>) or PoE 2 (<strong className="text-white">Waystones T1 to T15, Towers, Breach</strong>) presets, compare maps per hour across strategies, and save sessions to Cloud to enrich your <strong className="text-white">Hall of Fame Wealth Ladder</strong>.
              </p>
            </div>
          </div>
        )}
      </header>

      {/* Compact Client.txt Live Action Bar (Setup lives in Unified Tool Setup) */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingFile(true);
        }}
        onDragLeave={() => setIsDraggingFile(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDraggingFile(false);
          const f = e.dataTransfer?.files?.[0];
          if (f) parseClientTxtFromStartDate(f, false);
        }}
        className={`rounded-2xl border p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-2.5 shadow-md transition-colors ${
          isDraggingFile ? 'border-emerald-400 bg-emerald-950/25' : 'border-slate-800 bg-[#0d111a]'
        }`}
      >
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setCalendarOpen(true)}
            className="flex items-center gap-2 bg-slate-950 hover:bg-slate-900 px-3 py-2 rounded-xl border border-amber-500/40 cursor-pointer transition-colors"
          >
            <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-slate-400 font-mono text-[11px]">Since:</span>
            <span className="text-white font-mono font-bold">{formattedStartDate}</span>
          </button>

          {supportsLiveHandles && (
            !watchingLive ? (
              <button
                type="button"
                onClick={handleStartLiveWatch}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black inline-flex items-center gap-1.5 cursor-pointer shadow"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Start Live Watch</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setWatchingLive(false)}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black inline-flex items-center gap-1.5 cursor-pointer shadow"
              >
                <Square className="w-3.5 h-3.5" />
                <span>Stop Live Watch</span>
              </button>
            )
          )}

          {userAccount?.displayName && (
            <button
              type="button"
              onClick={() => setShareSquadPresence((v) => !v)}
              title="Opt in to broadcast your current zone to the Private League Squad Presence Bar while Live Watch is active"
              className={`px-3 py-2 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                shareSquadPresence
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${shareSquadPresence && watchingLive ? 'text-emerald-400 animate-pulse' : ''}`} />
              <span>{shareSquadPresence ? 'Squad Presence: On' : 'Share Live Zone'}</span>
            </button>
          )}

          <label className="px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-400/50 text-white font-bold inline-flex items-center gap-1.5 cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-sky-300" />
            <span>Drop or Pick Client.txt</span>
            <input
              type="file"
              accept=".txt"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) parseClientTxtFromStartDate(f, false);
                e.target.value = '';
              }}
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {lastFileReadAt && (
            <span className="text-[10px] font-mono text-emerald-300 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              Updated {lastFileReadAt}
            </span>
          )}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('exile-open-tool-setup'))}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-indigo-400/60 text-slate-200 font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Configure PoE Account, POESESSID, and Client.txt in Unified Tool Setup"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            <span>Tool Setup</span>
          </button>
        </div>
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

      {/* Draggable, Resizable, Collapsible Map Tracker Workspace Grid */}
      <ToolWidgetGrid
        storageKey="map_tracker"
        widgets={[
          {
            id: 'kpis',
            title: 'Session Telemetry KPIs',
            icon: <Activity className="w-3.5 h-3.5 text-emerald-400" />,
            defaultSpan: 12,
            render: () => (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/75">
                  <div className="text-[10px] font-mono uppercase text-slate-400">Maps Run</div>
                  <div className="text-xl font-black font-mono text-white mt-0.5">{mapRuns.length}</div>
                  <div className="text-[10px] font-mono text-sky-400">{specialZonesCount} Special Zones</div>
                </div>
                <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/75">
                  <div className="text-[10px] font-mono uppercase text-slate-400">Mapping Pace</div>
                  <div className="text-xl font-black font-mono text-emerald-300 mt-0.5">{mapsPerHr}</div>
                  <div className="text-[10px] font-mono text-slate-400">maps / hour</div>
                </div>
                <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/75">
                  <div className="text-[10px] font-mono uppercase text-slate-400">Avg Map Time</div>
                  <div className="text-xl font-black font-mono text-amber-300 mt-0.5">{formatDuration(avgMapSec)}</div>
                  <div className="text-[10px] font-mono text-slate-400">active map avg</div>
                </div>
                <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/75">
                  <div className="text-[10px] font-mono uppercase text-slate-400">Hideout Downtime</div>
                  <div className={`text-xl font-black font-mono mt-0.5 ${hideoutPct > 35 ? 'text-rose-400' : 'text-sky-300'}`}>
                    {hideoutPct}%
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">{formatDuration(totalHideoutSec)} in town</div>
                </div>
                <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/75">
                  <div className="text-[10px] font-mono uppercase text-slate-400">Live XP / Hour</div>
                  <div className="text-xl font-black font-mono text-emerald-400 mt-0.5">
                    {latestXpHr >= 1_000_000 ? `${(latestXpHr / 1_000_000).toFixed(1)}M` : latestXpHr > 0 ? `${Math.round(latestXpHr / 1000)}k` : '0'}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 truncate">
                    {latestChar ? `Lv ${latestChar.level} ${latestChar.name}` : 'Poll XP to track'}
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/75">
                  <div className="text-[10px] font-mono uppercase text-slate-400">Deaths Logged</div>
                  <div className={`text-xl font-black font-mono mt-0.5 ${deathTimestamps.length > 0 ? 'text-rose-400' : 'text-emerald-300'}`}>
                    {deathTimestamps.length}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">since {startDate}</div>
                </div>
              </div>
            )
          },
          {
            id: 'xp_and_save',
            title: 'Live XP Poller & Cloud Save',
            icon: <CloudUpload className="w-3.5 h-3.5 text-emerald-400" />,
            defaultSpan: 6,
            render: () => (
              <div className="space-y-3 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] border ${
                      accountName && poesessid
                        ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
                        : 'bg-amber-500/15 border-amber-500/35 text-amber-300'
                    }`}>
                      {accountName && poesessid ? `Connected: ${accountName}` : 'Connect POESESSID in Tool Setup'}
                    </span>
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
                    <button
                      type="button"
                      disabled={pollingXp}
                      onClick={() => handlePollCharacterXp(false)}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${pollingXp ? 'animate-spin' : ''}`} />
                      <span>Poll XP</span>
                    </button>
                  </div>
                </div>

                {characters.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                      className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-amber-200 font-semibold cursor-pointer"
                    >
                      <option value="ALL" className="bg-slate-950">All Leagues ({characterLeagues.length})</option>
                      {characterLeagues.map(([lg, list]) => (
                        <option key={lg} value={lg} className="bg-slate-950">
                          {lg} ({list.length})
                        </option>
                      ))}
                    </select>

                    <select
                      value={selectedCharName}
                      onChange={(e) => {
                        setSelectedCharName(e.target.value);
                        setXpCheckpoints([]);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-emerald-300 font-semibold cursor-pointer"
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
                )}

                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={sessionTitle}
                    onChange={(e) => setSessionTitle(e.target.value)}
                    placeholder="Session name"
                    className="flex-1 min-w-[130px] px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                  <select
                    value={strategyTag}
                    onChange={(e) => {
                      setStrategyTag(e.target.value);
                      saveActiveStrategy({ strategy: e.target.value, atlasTreeName: linkedAtlasName || undefined });
                    }}
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
              </div>
            )
          },
          {
            id: 'saved_history',
            title: `Saved Cloud Map History (${savedSessions.length})`,
            icon: <Cloud className="w-3.5 h-3.5 text-amber-400" />,
            defaultSpan: 6,
            render: () =>
              savedSessions.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  No saved map sessions yet. Parse your Client.txt and click Save Session.
                </div>
              ) : (
                <div className="space-y-2 max-h-[260px] overflow-y-auto pr-0.5">
                  {savedSessions.map((s) => (
                    <div key={s.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-2">
                      <div className="min-w-0 space-y-0.5">
                        <div className="text-xs font-bold text-white truncate">{s.title}</div>
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                          <span className="text-amber-300">{s.strategy}</span>
                          {s.atlasTreeName && (
                            <span className="px-1.5 py-0.2 rounded bg-sky-500/15 border border-sky-500/35 text-sky-300">
                              Atlas: {s.atlasTreeName}
                            </span>
                          )}
                          {s.characterName && (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 border border-emerald-500/35 text-emerald-300">
                              {s.characterName}{s.characterLevel ? ` Lv${s.characterLevel}` : ''}
                            </span>
                          )}
                        </div>
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
              )
          },
          {
            id: 'analytics_charts',
            title: 'XP/hr Timeline & Strategy Pace Charts',
            icon: <BarChart3 className="w-3.5 h-3.5 text-sky-400" />,
            defaultSpan: 12,
            render: () => (
              <MapAnalyticsCharts
                runs={runs}
                hideoutPct={hideoutPct}
                xpCheckpoints={xpCheckpoints}
                deathTimestamps={deathTimestamps}
                strategyRows={strategyRows}
              />
            )
          },
          {
            id: 'recent_runs',
            title: `Recent Areas Entered Since ${startDate} (${mapRuns.length} Maps)`,
            icon: <Compass className="w-3.5 h-3.5 text-indigo-400" />,
            defaultSpan: 12,
            render: () =>
              mapRuns.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Click <strong>Start Live Watch</strong> or <strong>Drop or Pick Client.txt</strong> above to populate your recent maps, Betrayal Safehouses, and Temple runs.
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[380px] overflow-y-auto rounded-xl border border-slate-800/80">
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
                                run.kind === 'Delve'
                                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                                  : run.kind === 'Betrayal Safehouse' || run.kind === 'Temple of Atzoatl'
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                  : run.kind === 'Boss / Special'
                                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                  : 'bg-slate-900 text-slate-300 border-slate-700'
                              }`}
                            >
                              {run.kind}{run.kind === 'Delve' && run.areaLevel ? ` (Lv ${run.areaLevel})` : ''}
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
              )
          },
          {
            id: 'deep_insights',
            title: 'Deep Client.txt Insights & League First Proofs',
            icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" />,
            defaultSpan: 12,
            defaultCollapsed: true,
            render: () => (
              <ClientTxtDeepInsights
                runs={runs}
                levelUps={levelUps}
                tradeTelemetry={tradeTelemetry}
                capturedProofs={capturedProofs}
                onClaimLeagueFirst={async (proof) => {
                  const targetLeagueId = game === 'poe2' ? 'poe2-05-ancients' : 'poe1-330-umbra';
                  const handle = userAccount?.displayName || proof.charName || 'Exile';
                  const milestone: LeagueFirstMilestone = {
                    id: `lf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                    leagueId: targetLeagueId,
                    milestoneKey: proof.title.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
                    title: proof.title,
                    winnerDisplayName: handle,
                    winnerCharacterName: proof.charName || userAccount?.characterName || handle,
                    proofNote: `Auto captured from local Client.txt at ${proof.label}.`,
                    achievedAtIso: proof.timestampIso
                  };
                  const ok = await saveCloudLeagueFirst(targetLeagueId, milestone);
                  if (ok) {
                    setNotice({
                      type: 'ok',
                      text: `Claimed "${proof.title}" on the Private League Hall of Fame!`
                    });
                  } else {
                    setNotice({
                      type: 'err',
                      text: 'Sign in required to claim League Firsts on the Hall of Fame.'
                    });
                  }
                  return ok;
                }}
              />
            )
          },
          {
            id: 'atlas_planner',
            title: 'Atlas Skill Tree Planner (Save & Compare Trees)',
            icon: <Compass className="w-3.5 h-3.5 text-sky-400" />,
            badge: (
              <span className="px-1.5 py-0.5 rounded bg-sky-500/15 border border-sky-500/35 text-[9px] font-mono text-sky-300">
                OFFICIAL TREE
              </span>
            ),
            defaultSpan: 12,
            render: () => (
              <AtlasSkillTreePlanner
                userHandle={userAccount?.displayName}
                activeStrategy={strategyTag}
                onSelectStrategy={(st, name) => {
                  setStrategyTag(st);
                  setLinkedAtlasName(name);
                }}
              />
            )
          },
          {
            id: 'boss_rush_tracker',
            title: 'Live Boss Rush & Invitation Tracker',
            icon: <Skull className="w-3.5 h-3.5 text-rose-400" />,
            defaultSpan: 6,
            defaultCollapsed: true,
            render: () => <BossRushTrackerWidget runs={runs} />
          },
          {
            id: 'campaign_splits',
            title: 'Campaign Speedrun Split Comparator',
            icon: <Flame className="w-3.5 h-3.5 text-amber-400" />,
            defaultSpan: 6,
            defaultCollapsed: true,
            render: () => (
              <CampaignSplitsWidget
                runs={runs}
                userHandle={userAccount?.displayName}
              />
            )
          },
          {
            id: 'side_content_trackers',
            title: 'Delve XP, Sanctum & Heist Trackers',
            icon: <Compass className="w-3.5 h-3.5 text-cyan-400" />,
            defaultSpan: 12,
            defaultCollapsed: false,
            render: () => (
              <SideContentTrackersWidget
                runs={runs}
                latestXpHr={latestXpHr}
                activeCharLabel={latestChar ? `Lv ${latestChar.level} ${latestChar.name}` : undefined}
              />
            )
          },
          {
            id: 'map_regex',
            title: 'Map Regex Builder',
            icon: <Filter className="w-3.5 h-3.5 text-sky-400" />,
            defaultSpan: 6,
            render: () => (
              <MapRegexBuilder
                savedBricks={savedBricks}
                canEdit={true}
                onSaveBricks={handleSaveMapBricks}
              />
            )
          },
          {
            id: 'session_scratchpad',
            title: 'Session Scratchpad & Goals',
            icon: <ListChecks className="w-3.5 h-3.5 text-emerald-400" />,
            defaultSpan: 6,
            render: () => (
              <SessionScratchpad
                savedGoals={savedGoals}
                characters={[]}
                canEdit={true}
                onSaveGoals={handleSaveSessionGoals}
              />
            )
          }
        ] as ToolWidgetDefinition[]}
      />

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
