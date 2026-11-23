import React, { useMemo, useState } from 'react';
import { BarChart3, Clock, Flame, Skull, Sparkles, TrendingUp } from 'lucide-react';

export interface XpCheckpoint {
  at: string;
  tsMs: number;
  level: number;
  experience: number;
  xpPerHour: number;
}

export interface StrategyCompareRow {
  strategy: string;
  mapsPerHr: number;
  avgMapSec: number;
  xpPerHrM: number;
  runs: number;
}

export interface MapChartRun {
  id: string;
  areaName: string;
  kind: string;
  enteredLabel: string;
  durationSec: number;
  deathsInRun: number;
}

interface MapAnalyticsChartsProps {
  runs?: MapChartRun[];
  hideoutPct?: number;
  xpCheckpoints: XpCheckpoint[];
  deathTimestamps: number[];
  strategyRows: StrategyCompareRow[];
}

function fmtSec(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return m > 0 ? `${m}m ${rem}s` : `${rem}s`;
}

export const MapAnalyticsCharts: React.FC<MapAnalyticsChartsProps> = ({
  runs = [],
  hideoutPct = 0,
  xpCheckpoints,
  deathTimestamps,
  strategyRows
}) => {
  const [hoveredMapIdx, setHoveredMapIdx] = useState<number | null>(null);

  // Recent 30 active map runs in chronological order (oldest left -> newest right)
  const recentMaps = useMemo(() => {
    const active = runs.filter((r) => r.kind !== 'Hideout / Town');
    return active.slice(0, 30).reverse();
  }, [runs]);

  const mapStats = useMemo(() => {
    const active = runs.filter((r) => r.kind !== 'Hideout / Town');
    if (active.length === 0) return { avgSec: 0, fastest: null as MapChartRun | null, topArea: '', topAreaCount: 0 };
    const totalSec = active.reduce((s, r) => s + r.durationSec, 0);
    const avgSec = Math.round(totalSec / active.length);
    const fastest = active.reduce((best, r) => (r.durationSec < best.durationSec && r.durationSec >= 10 ? r : best), active[0]);
    const areaCounts = new Map<string, number>();
    for (const r of active) areaCounts.set(r.areaName, (areaCounts.get(r.areaName) || 0) + 1);
    let topArea = '';
    let topAreaCount = 0;
    for (const [a, cnt] of areaCounts.entries()) {
      if (cnt > topAreaCount) {
        topArea = a;
        topAreaCount = cnt;
      }
    }
    return { avgSec, fastest, topArea, topAreaCount };
  }, [runs]);

  const activePct = Math.max(0, Math.min(100, 100 - Math.round(hideoutPct)));
  const maxBarSec = Math.max(60, ...recentMaps.map((m) => m.durationSec));
  const hoveredRun = hoveredMapIdx !== null && recentMaps[hoveredMapIdx] ? recentMaps[hoveredMapIdx] : recentMaps[recentMaps.length - 1] || null;

  // XP/hr Timeline geometry
  const w = 380;
  const h = 115;

  const pts =
    xpCheckpoints.length >= 2
      ? xpCheckpoints
      : xpCheckpoints.length === 1
      ? [{ ...xpCheckpoints[0], at: 'Start', xpPerHour: 0 }, xpCheckpoints[0]]
      : [];

  const maxXpHr = Math.max(1_000_000, ...pts.map((p) => p.xpPerHour));
  const minTs = pts.length > 0 ? pts[0].tsMs : 0;
  const maxTs = pts.length > 1 ? Math.max(minTs + 1, pts[pts.length - 1].tsMs) : minTs + 1;

  const coords = pts.map((p, idx) => {
    const x = pts.length <= 1 ? w - 8 : (idx / (pts.length - 1)) * (w - 16) + 8;
    const y = h - 14 - (Math.max(0, p.xpPerHour) / maxXpHr) * (h - 26);
    return { x, y, ...p };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ');
  const areaPath =
    coords.length >= 2
      ? `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${h - 8} L ${coords[0].x.toFixed(1)} ${h - 8} Z`
      : '';

  const maxMapsHr = Math.max(1, ...strategyRows.map((s) => s.mapsPerHr));

  const formatMillions = (xp: number) => {
    if (xp >= 1_000_000_000) return `${(xp / 1_000_000_000).toFixed(2)}B/hr`;
    if (xp >= 1_000_000) return `${(xp / 1_000_000).toFixed(1)}M/hr`;
    if (xp >= 1_000) return `${Math.round(xp / 1_000)}k/hr`;
    return `${Math.round(xp)}/hr`;
  };

  return (
    <div className="space-y-4">
      {/* Live Mapping Progress & Clear Speed Visualizer (Lights up immediately when Client.txt is loaded!) */}
      {recentMaps.length > 0 && (
        <section className="rounded-2xl border border-sky-500/30 bg-[#0d111a] p-4 sm:p-5 space-y-4 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
            <div>
              <div className="text-xs font-mono uppercase font-bold text-sky-300 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>Live Mapping Progress &amp; Clear Speed (Last {recentMaps.length} Runs)</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Hover any bar to inspect area clear time. <span className="text-emerald-300">Green</span> = faster than avg, <span className="text-amber-300">Amber</span> = slower, <span className="text-purple-300">Purple</span> = Special Zone, <span className="text-rose-400">Red dot</span> = death.
              </p>
            </div>
            {hoveredRun && (
              <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono flex flex-wrap items-center gap-2 shrink-0">
                <span className="font-bold text-white">{hoveredRun.areaName}</span>
                <span className="text-amber-300 font-bold">{fmtSec(hoveredRun.durationSec)}</span>
                <span className="text-slate-500">@ {hoveredRun.enteredLabel}</span>
                {hoveredRun.deathsInRun > 0 && (
                  <span className="text-rose-400 inline-flex items-center gap-0.5">
                    <Skull className="w-3 h-3" /> {hoveredRun.deathsInRun}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Interactive Bar Chart */}
          <div className="relative h-36 pt-4 pb-1 px-2 rounded-xl bg-slate-950/70 border border-slate-800/90 flex items-end gap-1 overflow-x-auto">
            {/* Dashed Average Reference Line */}
            {mapStats.avgSec > 0 && (
              <div
                className="absolute left-0 right-0 border-t border-dashed border-sky-400/45 pointer-events-none z-10 flex justify-end pr-2"
                style={{ bottom: `${Math.min(92, Math.max(8, (mapStats.avgSec / maxBarSec) * 84 + 8))}%` }}
              >
                <span className="text-[9px] font-mono text-sky-300 bg-slate-950/90 px-1 rounded -mt-2">
                  Avg {fmtSec(mapStats.avgSec)}
                </span>
              </div>
            )}

            {recentMaps.map((m, idx) => {
              const heightPct = Math.max(10, Math.round((m.durationSec / maxBarSec) * 100));
              const isFast = m.durationSec <= mapStats.avgSec;
              const isSpecial = m.kind !== 'Map' && m.kind !== 'Hideout / Town';
              const isHovered = hoveredMapIdx === idx;
              const barColor = isSpecial
                ? 'from-purple-500 to-fuchsia-400'
                : isFast
                ? 'from-emerald-600 to-emerald-400'
                : 'from-amber-600 to-amber-400';

              return (
                <div
                  key={m.id}
                  onMouseEnter={() => setHoveredMapIdx(idx)}
                  onMouseLeave={() => setHoveredMapIdx(null)}
                  className="flex-1 min-w-[12px] h-full flex flex-col justify-end items-center gap-1 cursor-pointer group"
                >
                  {m.deathsInRun > 0 && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 shadow shadow-rose-500/80 shrink-0" title={`${m.deathsInRun} death(s)`} />
                  )}
                  <div
                    className={`w-full rounded-t-md bg-gradient-to-t ${barColor} transition-all ${
                      isHovered ? 'brightness-125 ring-1 ring-white' : 'opacity-85 group-hover:opacity-100'
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
              );
            })}
          </div>

          {/* Efficiency Bar + Fastest Clear & Most Farmed Area */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-emerald-300 font-bold">Active Mapping {activePct}%</span>
                <span className="text-amber-300">Hideout {Math.round(hideoutPct)}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-amber-500/30 overflow-hidden flex">
                <div className="h-full bg-emerald-500 transition-all" style={{ width: `${activePct}%` }} />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-emerald-400" />
                  <span>Fastest Clear</span>
                </div>
                <div className="text-xs font-bold text-white truncate mt-0.5">{mapStats.fastest?.areaName || 'N/A'}</div>
              </div>
              <span className="font-mono text-sm font-black text-emerald-300 shrink-0">
                {mapStats.fastest ? fmtSec(mapStats.fastest.durationSec) : 'N/A'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Most Run Area</span>
                </div>
                <div className="text-xs font-bold text-white truncate mt-0.5">{mapStats.topArea || 'N/A'}</div>
              </div>
              <span className="font-mono text-sm font-black text-amber-300 shrink-0">
                {mapStats.topAreaCount}x
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Existing XP/hr & Atlas Strategy Comparison Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart 1: Real XP/hr Timeline with Death Markers */}
        <div className="rounded-2xl border border-slate-800 bg-[#0d111a] p-4 space-y-2.5 shadow-lg">
          <div className="flex items-center justify-between text-xs">
            <div className="font-bold text-slate-200 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>Live XP/hr &amp; Level Pace Timeline</span>
            </div>
            <span className="font-mono text-[11px] text-emerald-300 font-bold">
              {pts.length > 0 ? formatMillions(pts[pts.length - 1].xpPerHour) : 'Awaiting XP Poll'}
            </span>
          </div>

          {coords.length < 2 ? (
            <div className="h-28 flex flex-col items-center justify-center text-center text-xs text-slate-500 px-4">
              <span>Poll your live character XP twice (or set Auto XP to 5m) to plot your real XP/hr curve.</span>
            </div>
          ) : (
            <>
              <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-28 overflow-visible">
                <defs>
                  <linearGradient id="xpPaceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                <path d={areaPath} fill="url(#xpPaceGrad)" />
                <path d={linePath} fill="none" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                {deathTimestamps
                  .filter((ts) => ts >= minTs && ts <= maxTs)
                  .map((ts, i) => {
                    const dx = ((ts - minTs) / (maxTs - minTs)) * (w - 16) + 8;
                    return (
                      <line
                        key={i}
                        x1={dx}
                        y1={10}
                        x2={dx}
                        y2={h - 8}
                        stroke="#f43f5e"
                        strokeWidth="1.5"
                        strokeDasharray="3 2"
                      />
                    );
                  })}
                {coords.map((c, i) => (
                  <circle key={i} cx={c.x} cy={c.y} r="3.2" fill="#34d399" stroke="#0d111a" strokeWidth="1.5" />
                ))}
              </svg>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span>{pts[0]?.at}</span>
                <span className="inline-flex items-center gap-1 text-rose-400">
                  <Skull className="w-3 h-3" /> {deathTimestamps.length} deaths logged
                </span>
                <span>{pts[pts.length - 1]?.at}</span>
              </div>
            </>
          )}
        </div>

        {/* Chart 2: Atlas Strategy Speed & Pace Comparison */}
        <div className="rounded-2xl border border-slate-800 bg-[#0d111a] p-4 space-y-2.5 shadow-lg">
          <div className="flex items-center justify-between text-xs">
            <div className="font-bold text-slate-200 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-sky-400" />
              <span>Atlas Strategy Speed &amp; Pace Comparison</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Saved Map Sessions</span>
          </div>

          {strategyRows.length === 0 ? (
            <div className="h-28 flex items-center justify-center text-center text-xs text-slate-500 px-4">
              Click Save Session with a strategy tag to compare Maps/hr, Avg Map Time, and XP/hr side by side.
            </div>
          ) : (
            <div className="space-y-2 pt-1">
              {strategyRows.slice(0, 6).map((row) => {
                const widthPct = Math.max(8, Math.round((row.mapsPerHr / maxMapsHr) * 100));
                return (
                  <div key={row.strategy} className="space-y-0.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-200 font-semibold truncate max-w-[180px]">{row.strategy}</span>
                      <span className="font-mono text-sky-300 font-bold">
                        {row.mapsPerHr.toFixed(1)} maps/hr • {fmtSec(row.avgMapSec)}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-400"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
