import React from 'react';
import { BarChart3, TrendingUp, Skull } from 'lucide-react';

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

interface MapAnalyticsChartsProps {
  xpCheckpoints: XpCheckpoint[];
  deathTimestamps: number[];
  strategyRows: StrategyCompareRow[];
}

export const MapAnalyticsCharts: React.FC<MapAnalyticsChartsProps> = ({
  xpCheckpoints,
  deathTimestamps,
  strategyRows
}) => {
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
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Chart 4: Real XP/hr Timeline with Death Markers */}
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
            <span>Poll your live character XP twice (or enable Auto XP Poll) to plot your real XP/hr curve.</span>
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
              <span>Peak: {formatMillions(maxXpHr)}</span>
            </div>
          </>
        )}
      </div>

      {/* Chart 5: Atlas Strategy Comparison Bar Chart */}
      <div className="rounded-2xl border border-slate-800 bg-[#0d111a] p-4 space-y-2.5 shadow-lg">
        <div className="flex items-center justify-between text-xs">
          <div className="font-bold text-slate-200 flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-sky-400" />
            <span>Atlas Strategy Speed &amp; Pace Comparison</span>
          </div>
          <span className="font-mono text-[10px] text-slate-400">Saved Map Sessions</span>
        </div>

        {strategyRows.length === 0 ? (
          <div className="h-28 flex items-center justify-center text-center text-xs text-slate-500 px-4">
            Save a mapping session with an Atlas strategy tag to compare Maps/hr, Avg Map Time, and XP/hr side by side.
          </div>
        ) : (
          <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
            {strategyRows.map((row) => {
              const pct = Math.max(6, Math.round((row.mapsPerHr / maxMapsHr) * 100));
              const avgMin = Math.floor(row.avgMapSec / 60);
              const avgRem = Math.round(row.avgMapSec % 60);
              return (
                <div key={row.strategy} className="space-y-0.5 text-[11px]">
                  <div className="flex items-center justify-between gap-2 font-mono">
                    <span className="text-slate-200 font-semibold truncate">{row.strategy}</span>
                    <span className="text-sky-300 font-bold shrink-0">
                      {row.mapsPerHr.toFixed(1)} maps/hr • {avgMin}m {avgRem}s avg
                      {row.xpPerHrM > 0 ? ` • ${row.xpPerHrM.toFixed(1)}M XP/hr` : ''}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
