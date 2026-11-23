import React, { useMemo } from 'react';
import {
  Flame,
  Layers,
  MapPin,
  ShieldCheck,
  Skull,
  Sparkles,
  TrendingUp,
  Zap
} from 'lucide-react';

export interface LevelUpEvent {
  charName: string;
  className: string;
  level: number;
  tsMs: number;
  label: string;
  durationSec: number | null;
}

export interface DeepParsedRun {
  id: string;
  areaName: string;
  kind: string;
  enteredAtMs: number;
  enteredLabel: string;
  durationSec: number;
  deathsInRun: number;
  areaLevel?: number;
  areaCode?: string;
  seed?: string;
  mechanics?: string[];
}

interface ClientTxtDeepInsightsProps {
  runs: DeepParsedRun[];
  levelUps: LevelUpEvent[];
}

function fmtDur(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const rem = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  return m > 0 ? `${m}m ${rem}s` : `${rem}s`;
}

function resolveCampaignAct(areaCode?: string): number | null {
  if (!areaCode) return null;
  const m = areaCode.match(/^(\d)_(\d+)_/);
  if (!m) return null;
  const part = Number(m[1]);
  const act = Number(m[2]);
  if (part === 1 && act >= 1 && act <= 5) return act;
  if (part === 2 && act >= 6 && act <= 11) return act === 11 ? 10 : act;
  return null;
}

export const ClientTxtDeepInsights: React.FC<ClientTxtDeepInsightsProps> = ({
  runs,
  levelUps
}) => {
  // Chronological order (oldest -> newest)
  const chronoRuns = useMemo(() => [...runs].reverse(), [runs]);
  const activeRuns = useMemo(() => chronoRuns.filter((r) => r.kind !== 'Hideout / Town'), [chronoRuns]);

  // 1. Map Tier Distribution + Campaign Act Splits
  const tierStats = useMemo(() => {
    const buckets = [
      { label: 'White (T1 to T5)', count: 0, color: 'bg-slate-400' },
      { label: 'Yellow (T6 to T10)', count: 0, color: 'bg-amber-400' },
      { label: 'Red (T11 to T15)', count: 0, color: 'bg-rose-400' },
      { label: 'T16 Maps (Lvl 83)', count: 0, color: 'bg-red-500' },
      { label: 'T17 / Uber (Lvl 84+)', count: 0, color: 'bg-purple-500' }
    ];
    let mapTierTotal = 0;
    const actMap = new Map<number, { startMs: number; endMs: number; zones: number }>();

    for (const r of activeRuns) {
      const lvl = Number(r.areaLevel || 0);
      const isMapCode = Boolean(r.areaCode && /map/i.test(r.areaCode));
      if (lvl >= 68 && (isMapCode || r.kind === 'Map')) {
        const tier = lvl - 67;
        mapTierTotal += 1;
        if (tier <= 5) buckets[0].count += 1;
        else if (tier <= 10) buckets[1].count += 1;
        else if (tier <= 15) buckets[2].count += 1;
        else if (tier === 16) buckets[3].count += 1;
        else buckets[4].count += 1;
      }
      const act = resolveCampaignAct(r.areaCode);
      if (act !== null) {
        const cur = actMap.get(act) || { startMs: r.enteredAtMs, endMs: r.enteredAtMs + r.durationSec * 1000, zones: 0 };
        cur.startMs = Math.min(cur.startMs, r.enteredAtMs);
        cur.endMs = Math.max(cur.endMs, r.enteredAtMs + r.durationSec * 1000);
        cur.zones += 1;
        actMap.set(act, cur);
      }
    }

    const actSplits = Array.from(actMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([act, v]) => ({
        act,
        durationSec: Math.max(10, Math.round((v.endMs - v.startMs) / 1000)),
        zones: v.zones
      }));

    return { buckets, mapTierTotal, actSplits };
  }, [activeRuns]);

  // 3. Atlas Mechanic & Boss Spawn Radar
  const mechanicSpawns = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of activeRuns) {
      const uniqueInMap = new Set(r.mechanics || []);
      for (const m of uniqueInMap) {
        counts.set(m, (counts.get(m) || 0) + 1);
      }
    }
    const denom = Math.max(1, activeRuns.length);
    return Array.from(counts.entries())
      .map(([name, count]) => ({
        name,
        count,
        pct: Math.round((count / denom) * 100)
      }))
      .sort((a, b) => b.count - a.count);
  }, [activeRuns]);

  // 4 & 5. Portals Used Per Map, Best Rolling 60m Burst, Deathless Streak & Danger Zones
  const efficiency = useMemo(() => {
    // Count distinct map instances by seed (or areaName if no seed)
    let distinctInstances = 0;
    let totalPortals = 0;
    let lastInstanceKey = '';
    for (const r of activeRuns) {
      const key = r.seed ? `${r.areaName}::${r.seed}` : r.areaName;
      if (key !== lastInstanceKey) {
        distinctInstances += 1;
        totalPortals += 1;
        lastInstanceKey = key;
      } else {
        totalPortals += 1;
      }
    }
    const avgPortals = distinctInstances > 0 ? Number((totalPortals / distinctInstances).toFixed(2)) : 0;

    // Best rolling 60 minute burst
    let bestBurst60m = 0;
    let left = 0;
    for (let right = 0; right < activeRuns.length; right++) {
      while (activeRuns[right].enteredAtMs - activeRuns[left].enteredAtMs > 3_600_000) {
        left += 1;
      }
      bestBurst60m = Math.max(bestBurst60m, right - left + 1);
    }

    // Deathless Streak + Danger Zones
    let currentStreak = 0;
    let bestStreak = 0;
    const dangerMap = new Map<string, { area: string; deaths: number; maxLvl: number; mechanics: Set<string> }>();
    for (const r of activeRuns) {
      if (r.deathsInRun > 0) {
        currentStreak = 0;
        const cur = dangerMap.get(r.areaName) || {
          area: r.areaName,
          deaths: 0,
          maxLvl: r.areaLevel || 0,
          mechanics: new Set<string>()
        };
        cur.deaths += r.deathsInRun;
        if ((r.areaLevel || 0) > cur.maxLvl) cur.maxLvl = r.areaLevel || 0;
        (r.mechanics || []).forEach((m) => cur.mechanics.add(m));
        dangerMap.set(r.areaName, cur);
      } else {
        currentStreak += 1;
        if (currentStreak > bestStreak) bestStreak = currentStreak;
      }
    }

    const dangerZones = Array.from(dangerMap.values())
      .map((d) => ({ ...d, mechanicsList: Array.from(d.mechanics).slice(0, 3) }))
      .sort((a, b) => b.deaths - a.deaths)
      .slice(0, 5);

    return { avgPortals, bestBurst60m, currentStreak, bestStreak, dangerZones };
  }, [activeRuns]);

  if (activeRuns.length === 0 && levelUps.length === 0) return null;

  const maxLevelSec = Math.max(60, ...levelUps.map((l) => l.durationSec || 0));

  return (
    <div className="space-y-4">
      {/* 4 Telemetry Badges: Portals/Map, Best 60m Burst, Current & Best Deathless Streak */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl border border-slate-800 bg-[#0d111a] shadow-lg">
          <div className="text-[10px] font-mono uppercase text-sky-300 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            <span>Portals Per Map</span>
          </div>
          <div className="text-xl font-black font-mono text-white mt-1">
            {efficiency.avgPortals > 0 ? efficiency.avgPortals : '1.0'}
          </div>
          <div className="text-[10px] font-mono text-slate-400">
            {efficiency.avgPortals <= 1.25 ? 'Clean 1 portal clears' : 'Extra dump or rip trips'}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl border border-amber-500/25 bg-[#0d111a] shadow-lg">
          <div className="text-[10px] font-mono uppercase text-amber-300 flex items-center gap-1">
            <Zap className="w-3 h-3" />
            <span>Peak 60m Burst</span>
          </div>
          <div className="text-xl font-black font-mono text-amber-300 mt-1">{efficiency.bestBurst60m}</div>
          <div className="text-[10px] font-mono text-slate-400">fastest rolling hour</div>
        </div>

        <div className="p-3.5 rounded-2xl border border-emerald-500/25 bg-[#0d111a] shadow-lg">
          <div className="text-[10px] font-mono uppercase text-emerald-300 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            <span>Deathless Streak</span>
          </div>
          <div className="text-xl font-black font-mono text-emerald-300 mt-1">
            {efficiency.currentStreak} <span className="text-xs text-slate-500 font-normal">/ Best {efficiency.bestStreak}</span>
          </div>
          <div className="text-[10px] font-mono text-slate-400">consecutive safe runs</div>
        </div>

        <div className="p-3.5 rounded-2xl border border-purple-500/25 bg-[#0d111a] shadow-lg">
          <div className="text-[10px] font-mono uppercase text-purple-300 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>Level Ups Logged</span>
          </div>
          <div className="text-xl font-black font-mono text-purple-200 mt-1">{levelUps.length}</div>
          <div className="text-[10px] font-mono text-slate-400">
            {levelUps.length > 0 ? `Latest: Lv ${levelUps[levelUps.length - 1].level}` : 'Zero API polling needed'}
          </div>
        </div>
      </section>

      {/* Deep Visualizers Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 1. Map Tier Distribution OR Campaign Act Splits */}
        <div className="rounded-2xl border border-slate-800 bg-[#0d111a] p-4 space-y-3 shadow-lg">
          <div className="flex items-center justify-between text-xs">
            <div className="font-bold text-slate-200 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {tierStats.mapTierTotal > 0 ? 'Automatic Map Tier Distribution' : 'Campaign Act Split Timer (Acts 1 to 10)'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">From Area Level Seed</span>
          </div>

          {tierStats.mapTierTotal > 0 ? (
            <div className="space-y-2">
              {tierStats.buckets.map((b) => {
                const pct = Math.round((b.count / Math.max(1, tierStats.mapTierTotal)) * 100);
                return (
                  <div key={b.label} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-300 font-semibold">{b.label}</span>
                      <span className="font-mono text-slate-200 font-bold">
                        {b.count} <span className="text-slate-500">({pct}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                      <div className={`h-full rounded-full ${b.color}`} style={{ width: `${Math.max(b.count > 0 ? 4 : 0, pct)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : tierStats.actSplits.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {tierStats.actSplits.map((a) => (
                <div key={a.act} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-0.5">
                  <div className="text-[10px] font-mono uppercase text-amber-300 font-bold">Act {a.act}</div>
                  <div className="text-xs font-mono font-black text-white">{fmtDur(a.durationSec)}</div>
                  <div className="text-[9px] font-mono text-slate-500">{a.zones} zones</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-slate-500">
              Enter maps or campaign zones to populate automatic Tier &amp; Act splits.
            </div>
          )}
        </div>

        {/* 2. Automatic Level Up Splits (Client.txt Native) */}
        <div className="rounded-2xl border border-slate-800 bg-[#0d111a] p-4 space-y-3 shadow-lg">
          <div className="flex items-center justify-between text-xs">
            <div className="font-bold text-slate-200 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>Automatic Level Up Splits</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Parsed from Client.txt</span>
          </div>

          {levelUps.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500">
              No level ups recorded since your selected Start Date yet. Every ding is automatically timed here!
            </div>
          ) : (
            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {[...levelUps].reverse().slice(0, 12).map((lv, idx) => {
                const widthPct = lv.durationSec ? Math.max(8, Math.round((lv.durationSec / maxLevelSec) * 100)) : 20;
                return (
                  <div key={`${lv.tsMs}-${idx}`} className="space-y-0.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-200 font-semibold truncate">
                        Lv {lv.level} <span className="text-slate-500 font-mono text-[10px]">({lv.charName})</span>
                      </span>
                      <span className="font-mono text-emerald-300 font-bold shrink-0">
                        {lv.durationSec ? fmtDur(lv.durationSec) : lv.label}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-sky-400" style={{ width: `${widthPct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. Atlas Mechanic & Boss Spawn Radar */}
        <div className="rounded-2xl border border-slate-800 bg-[#0d111a] p-4 space-y-3 shadow-lg">
          <div className="flex items-center justify-between text-xs">
            <div className="font-bold text-slate-200 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-purple-400" />
              <span>Atlas Mechanic &amp; Boss Spawn Radar</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">NPC Dialogue Detection</span>
          </div>

          {mechanicSpawns.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500">
              No Master, Boss, or Nameless Seer dialogue lines detected yet since your Start Date.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {mechanicSpawns.map((m) => {
                const isJackpot = m.name === 'Nameless Seer';
                return (
                  <div
                    key={m.name}
                    className={`px-3 py-1.5 rounded-xl border text-xs flex items-center gap-2 ${
                      isJackpot
                        ? 'bg-amber-500/20 border-amber-400/60 text-amber-200 shadow'
                        : 'bg-slate-950 border-slate-800 text-slate-200'
                    }`}
                  >
                    <span className="font-bold">{m.name}</span>
                    <span className="font-mono text-[11px] text-amber-300 font-black">{m.count}x</span>
                    <span className="font-mono text-[10px] text-slate-500">({m.pct}%)</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. Danger Zone & Rip Breakdown */}
        <div className="rounded-2xl border border-slate-800 bg-[#0d111a] p-4 space-y-3 shadow-lg">
          <div className="flex items-center justify-between text-xs">
            <div className="font-bold text-slate-200 flex items-center gap-1.5">
              <Skull className="w-3.5 h-3.5 text-rose-400" />
              <span>Danger Zones &amp; Rip Analysis</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Deadliest Areas</span>
          </div>

          {efficiency.dangerZones.length === 0 ? (
            <div className="py-6 text-center text-xs text-emerald-300 font-semibold">
              Zero deaths logged since your Start Date! Clean survival run.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/70">
              {efficiency.dangerZones.map((dz) => (
                <div key={dz.area} className="py-2 flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0">
                    <div className="font-bold text-slate-100 truncate">
                      {dz.area} {dz.maxLvl > 0 && <span className="text-[10px] font-mono text-slate-400">(Lv {dz.maxLvl})</span>}
                    </div>
                    {dz.mechanicsList.length > 0 && (
                      <div className="text-[10px] font-mono text-purple-300">Active: {dz.mechanicsList.join(', ')}</div>
                    )}
                  </div>
                  <span className="px-2 py-0.5 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300 font-mono font-bold text-[11px] shrink-0">
                    {dz.deaths} {dz.deaths === 1 ? 'rip' : 'rips'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
