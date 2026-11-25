import React, { useMemo, useState } from 'react';
import { Skull, Trophy, Timer, Compass, Save } from 'lucide-react';
import { saveUserToolState } from '../../services/cloudSync';

export interface TelemetryAreaRun {
  id: string;
  areaName: string;
  kind: string;
  enteredAtMs: number;
  enteredLabel: string;
  durationSec: number;
  deathsInRun: number;
  areaLevel?: number;
}

function fmtSec(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return m > 0 ? `${m}m ${rem}s` : `${rem}s`;
}

function fmtSplitDelta(deltaSec: number): string {
  const sign = deltaSec <= 0 ? '-' : '+';
  const abs = Math.abs(Math.round(deltaSec));
  const m = Math.floor(abs / 60);
  const s = abs % 60;
  return `${sign}${m}m ${String(s).padStart(2, '0')}s`;
}

// ============================================================================
// 1. Live Boss Rush & Invitation Tracker
// ============================================================================
const BOSS_PATTERNS: Array<{ group: string; re: RegExp }> = [
  { group: 'Maven Crucible / Invitations', re: /maven's crucible|absence of mercy/i },
  { group: 'Shaper Guardians', re: /pit of the chimera|lair of the hydra|maze of the minotaur|forge of the phoenix/i },
  { group: 'Elder Guardians', re: /enslaver|eradicator|constrictor|purifier/i },
  { group: 'Conquerors & Sirus', re: /al-hezmin|baran|drox|veritania|eye of the storm/i },
  { group: 'Eater / Exarch', re: /absence of symmetry|absence of patience|searing exarch|eater of worlds/i },
  { group: 'T17 Pinnacle Maps', re: /\b(sanctuary|abomination|citadel|fortress|ziggurat)\b/i },
  { group: 'Shaper / Elder / Atziri', re: /shaper's realm|alluring abyss|apex of sacrifice/i }
];

export const BossRushTrackerWidget: React.FC<{ runs: TelemetryAreaRun[] }> = ({ runs }) => {
  const bossStats = useMemo(() => {
    const map = new Map<string, { count: number; totalSec: number; deaths: number; deathless: number }>();
    let totalBossRuns = 0;
    let totalBossSec = 0;

    for (const r of runs) {
      const matched = BOSS_PATTERNS.find((p) => p.re.test(r.areaName));
      if (!matched) continue;
      totalBossRuns++;
      totalBossSec += r.durationSec;
      const cur = map.get(matched.group) || { count: 0, totalSec: 0, deaths: 0, deathless: 0 };
      cur.count += 1;
      cur.totalSec += r.durationSec;
      cur.deaths += r.deathsInRun;
      if (r.deathsInRun === 0) cur.deathless += 1;
      map.set(matched.group, cur);
    }

    const rows = Array.from(map.entries())
      .map(([group, v]) => ({
        group,
        count: v.count,
        avgSec: Math.round(v.totalSec / v.count),
        deaths: v.deaths,
        deathlessPct: Math.round((v.deathless / v.count) * 100)
      }))
      .sort((a, b) => b.count - a.count);

    const bossesPerHr = totalBossSec > 0 ? Number(((totalBossRuns / totalBossSec) * 3600).toFixed(1)) : 0;
    return { rows, totalBossRuns, bossesPerHr };
  }, [runs]);

  if (bossStats.totalBossRuns === 0) {
    return (
      <div className="py-6 text-center text-xs text-slate-400">
        No Shaper/Elder Guardians, Conquerors, Maven Invitations, or T17 bosses detected in your loaded <code className="text-sky-300">Client.txt</code> range yet.
      </div>
    );
  }

  return (
    <div className="space-y-3 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800">
        <span className="text-slate-300 font-semibold flex items-center gap-1.5">
          <Skull className="w-3.5 h-3.5 text-rose-400" />
          <span>{bossStats.totalBossRuns} Boss / Invitation Encounters Logged</span>
        </span>
        <span className="font-mono font-bold text-amber-300">{bossStats.bossesPerHr} encounters / hr</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-[11px]">
          <thead className="text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
            <tr>
              <th className="py-1.5 pr-2">Boss / Cycle</th>
              <th className="py-1.5 px-2 text-right">Runs</th>
              <th className="py-1.5 px-2 text-right">Avg Time</th>
              <th className="py-1.5 pl-2 text-right">Deathless</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {bossStats.rows.map((row) => (
              <tr key={row.group}>
                <td className="py-1.5 pr-2 font-semibold text-white">{row.group}</td>
                <td className="py-1.5 px-2 text-right font-mono text-amber-300 font-bold">{row.count}</td>
                <td className="py-1.5 px-2 text-right font-mono text-sky-300">{fmtSec(row.avgSec)}</td>
                <td className="py-1.5 pl-2 text-right font-mono">
                  <span className={row.deathlessPct >= 80 ? 'text-emerald-300' : 'text-rose-300'}>
                    {row.deathlessPct}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============================================================================
// 2. Campaign Speedrun Split Comparator (LiveSplit Style)
// ============================================================================
const CAMPAIGN_SPLITS: Array<{ id: string; label: string; re: RegExp }> = [
  { id: 'a1_town', label: "Act 1 • Lioneye's Watch", re: /lioneye's watch/i },
  { id: 'a2_town', label: 'Act 2 • Forest Encampment', re: /forest encampment/i },
  { id: 'a3_town', label: 'Act 3 • Sarn Encampment', re: /sarn encampment/i },
  { id: 'a4_town', label: 'Act 4 • Highgate', re: /\bhighgate\b/i },
  { id: 'a5_town', label: "Act 5 • Overseer's Tower", re: /overseer's tower/i },
  { id: 'a6_town', label: 'Act 6 • Lioneye\'s Watch (A6)', re: /the twilight strand|karui fortress/i },
  { id: 'a7_town', label: 'Act 7 • Bridge Encampment', re: /bridge encampment/i },
  { id: 'a9_ba', label: 'Act 9 • Blood Aqueduct', re: /blood aqueduct/i },
  { id: 'a10_town', label: 'Act 10 • Oriath Docks', re: /oriath docks/i },
  { id: 'epilogue', label: 'Epilogue • Karui Shores / Maps', re: /karui shores/i }
];

const PB_STORAGE_KEY = 'exile_ssf_campaign_splits_pb_v1';

export const CampaignSplitsWidget: React.FC<{
  runs: TelemetryAreaRun[];
  userHandle?: string;
}> = ({ runs, userHandle }) => {
  const [pbSplits, setPbSplits] = useState<Record<string, number>>(() => {
    try {
      return JSON.parse(localStorage.getItem(PB_STORAGE_KEY) || '{}');
    } catch {
      return {};
    }
  });
  const [savedMsg, setSavedMsg] = useState<boolean>(false);

  const currentSplits = useMemo(() => {
    if (runs.length === 0) return [] as Array<{ id: string; label: string; elapsedSec: number; deltaSec: number | null }>;
    // Chronological order (oldest first)
    const chrono = [...runs].sort((a, b) => a.enteredAtMs - b.enteredAtMs);
    const startMs = chrono[0].enteredAtMs;
    const found: Array<{ id: string; label: string; elapsedSec: number; deltaSec: number | null }> = [];

    for (const sp of CAMPAIGN_SPLITS) {
      const hit = chrono.find((r) => sp.re.test(r.areaName));
      if (!hit) continue;
      const elapsedSec = Math.max(0, Math.round((hit.enteredAtMs - startMs) / 1000));
      const pb = typeof pbSplits[sp.id] === 'number' ? pbSplits[sp.id] : null;
      found.push({
        id: sp.id,
        label: sp.label,
        elapsedSec,
        deltaSec: pb !== null ? elapsedSec - pb : null
      });
    }
    return found;
  }, [runs, pbSplits]);

  const handleSavePb = () => {
    const next: Record<string, number> = { ...pbSplits };
    for (const sp of currentSplits) {
      next[sp.id] = sp.elapsedSec;
    }
    setPbSplits(next);
    try {
      localStorage.setItem(PB_STORAGE_KEY, JSON.stringify(next));
    } catch {}
    if (userHandle) {
      void saveUserToolState(userHandle, 'campaign_splits_pb', next);
    }
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2400);
  };

  if (currentSplits.length === 0) {
    return (
      <div className="py-6 text-center text-xs text-slate-400">
        No Act 1–10 campaign town transitions found in your current <code className="text-sky-300">Client.txt</code> date range. Pick your league-start date to compare campaign splits!
      </div>
    );
  }

  return (
    <div className="space-y-2.5 text-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
          <Timer className="w-3.5 h-3.5 text-amber-400" />
          <span>{currentSplits.length} Campaign Splits Detected</span>
        </span>
        <button
          type="button"
          onClick={handleSavePb}
          className="px-2.5 py-1 rounded-lg bg-emerald-600/25 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-200 text-[10px] font-mono font-bold inline-flex items-center gap-1 cursor-pointer"
        >
          <Save className="w-3 h-3" />
          <span>{savedMsg ? 'Saved Personal Best!' : 'Save as Personal Best'}</span>
        </button>
      </div>

      <div className="space-y-1 max-h-[260px] overflow-y-auto pr-0.5">
        {currentSplits.map((sp) => (
          <div
            key={sp.id}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between gap-2 font-mono text-[11px]"
          >
            <span className="text-slate-200 font-sans font-semibold">{sp.label}</span>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-sky-300">{fmtSec(sp.elapsedSec)}</span>
              {sp.deltaSec !== null && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    sp.deltaSec <= 0
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/35'
                      : 'bg-rose-500/15 text-rose-300 border border-rose-500/35'
                  }`}
                >
                  {fmtSplitDelta(sp.deltaSec)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// 3. Delve XP, Sanctum & Heist Deep Trackers
// ============================================================================
const SANCTUM_RE = /forbidden sanctum|sanctum|cathedral of|archives of|nave of|beyond of/i;
const HEIST_RE = /rogue harbour|smuggler's den|prohibited library|records office|repository|underbelly|bunker|tunnels|mansion|laboratory/i;
const DELVE_RE = /azurite mine|primeval chambers|abyssal city|vaal outpost|crystal king|kurgal|ahuatotli|delve/i;

export const SideContentTrackersWidget: React.FC<{
  runs: TelemetryAreaRun[];
  latestXpHr?: number;
  activeCharLabel?: string;
}> = ({ runs, latestXpHr = 0, activeCharLabel }) => {
  const [tab, setTab] = useState<'delve' | 'heist' | 'sanctum'>('delve');

  const stats = useMemo(() => {
    const summarize = (re: RegExp) => {
      const matched = runs.filter((r) => re.test(r.areaName));
      const totalSec = matched.reduce((s, r) => s + r.durationSec, 0);
      const deaths = matched.reduce((s, r) => s + r.deathsInRun, 0);
      const deathless = matched.filter((r) => r.deathsInRun === 0).length;
      const maxAreaLevel = matched.reduce((mx, r) => Math.max(mx, Number(r.areaLevel || 0)), 0);
      return {
        runs: matched,
        count: matched.length,
        totalSec,
        avgSec: matched.length > 0 ? Math.round(totalSec / matched.length) : 0,
        perHr: totalSec > 0 ? Number(((matched.length / totalSec) * 3600).toFixed(1)) : 0,
        deaths,
        maxAreaLevel,
        survivalPct: matched.length > 0 ? Math.round((deathless / matched.length) * 100) : 100
      };
    };
    return {
      delve: summarize(DELVE_RE),
      heist: summarize(HEIST_RE),
      sanctum: summarize(SANCTUM_RE)
    };
  }, [runs]);

  const active = stats[tab];
  const xpLabel =
    latestXpHr >= 1_000_000
      ? `${(latestXpHr / 1_000_000).toFixed(1)}M/hr`
      : latestXpHr > 0
      ? `${Math.round(latestXpHr / 1000)}k/hr`
      : 'Poll XP (5m)';

  return (
    <div className="space-y-3 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {(['delve', 'heist', 'sanctum'] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={`px-3 py-1 rounded-lg font-mono text-[11px] font-bold uppercase border cursor-pointer ${
                tab === k
                  ? k === 'delve'
                    ? 'bg-cyan-600/30 border-cyan-400 text-cyan-100'
                    : 'bg-indigo-600/30 border-indigo-400 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {k} ({stats[k].count})
            </button>
          ))}
        </div>

        {tab === 'delve' && (
          <div className="text-[10px] font-mono text-cyan-300/90 px-2 py-1 rounded-lg bg-cyan-950/30 border border-cyan-500/30">
            Tip: Set <strong className="text-white">Auto XP: 5m</strong> in XP Poller + <strong className="text-white">Start Live Watch</strong> to track live Delve XP/hr!
          </div>
        )}
      </div>

      {active.count === 0 ? (
        <div className="py-5 text-center text-xs text-slate-400">
          No <strong className="capitalize text-white">{tab}</strong> zones logged in your current <code className="text-sky-300">Client.txt</code> window yet.
          {tab === 'delve' && (
            <div className="text-[11px] text-slate-500 mt-1">
              Enter <strong className="text-cyan-300">The Azurite Mine</strong> with Live Watch active to track Delve nodes, monster level, time underground, deaths, and XP/hr automatically.
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono">
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase">{tab === 'delve' ? 'Mine Instances' : 'Zones / Wings'}</div>
              <div className="text-base font-bold text-white mt-0.5">{active.count}</div>
              <div className="text-[10px] text-slate-500">{fmtSec(active.totalSec)} total</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase">Avg Duration</div>
              <div className="text-base font-bold text-sky-300 mt-0.5">{fmtSec(active.avgSec)}</div>
              <div className="text-[10px] text-slate-500">{active.perHr} / hr</div>
            </div>
            {tab === 'delve' && (
              <div className="p-2.5 rounded-xl bg-slate-950 border border-cyan-500/30">
                <div className="text-[10px] text-cyan-400 uppercase">Peak Monster Lv</div>
                <div className="text-base font-bold text-cyan-200 mt-0.5">
                  {active.maxAreaLevel > 0 ? `Lv ${active.maxAreaLevel}` : '—'}
                </div>
                <div className="text-[10px] text-slate-500">
                  {active.maxAreaLevel >= 83 ? 'Max XP Tier (83)' : active.maxAreaLevel > 0 ? 'Scaling up' : 'From Client.txt'}
                </div>
              </div>
            )}
            <div className="p-2.5 rounded-xl bg-slate-950 border border-emerald-500/30">
              <div className="text-[10px] text-emerald-400 uppercase">Live XP / Hr</div>
              <div className="text-base font-bold text-emerald-300 mt-0.5">{xpLabel}</div>
              <div className="text-[10px] text-slate-500 truncate">{activeCharLabel || 'Active char'}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase">Survival</div>
              <div className="text-base font-bold text-emerald-300 mt-0.5">{active.survivalPct}%</div>
              <div className="text-[10px] text-slate-500">{active.deaths} deaths</div>
            </div>
          </div>

          <div className="max-h-[180px] overflow-y-auto space-y-1 pr-0.5">
            {active.runs.slice(0, 25).map((r) => (
              <div
                key={r.id}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between gap-2 text-[11px]"
              >
                <span className="text-slate-200 font-semibold flex items-center gap-1.5 truncate">
                  {tab === 'sanctum' ? (
                    <Trophy className="w-3 h-3 text-amber-400 shrink-0" />
                  ) : (
                    <Compass className={`w-3 h-3 shrink-0 ${tab === 'delve' ? 'text-cyan-400' : 'text-sky-400'}`} />
                  )}
                  <span className="truncate">{r.areaName}</span>
                  {r.areaLevel ? (
                    <span className="px-1.5 py-0.2 rounded bg-cyan-500/15 border border-cyan-500/35 text-[9px] font-mono text-cyan-300 shrink-0">
                      Lv {r.areaLevel}
                    </span>
                  ) : null}
                </span>
                <div className="flex items-center gap-2.5 font-mono shrink-0">
                  <span className="text-slate-500 text-[10px]">{r.enteredLabel}</span>
                  <span className="text-sky-300 font-bold">{fmtSec(r.durationSec)}</span>
                  {r.deathsInRun > 0 && <span className="text-rose-400">{r.deathsInRun}💀</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
