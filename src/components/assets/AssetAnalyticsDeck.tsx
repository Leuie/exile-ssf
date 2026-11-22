import React, { useState } from 'react';
import { BarChart3, PieChart, TrendingUp } from 'lucide-react';
import {
  formatSsfPoints,
  formatValue,
  type EnrichedDropItem,
  type SyncCheckpoint
} from './assetEngine';

interface AssetAnalyticsDeckProps {
  checkpoints: SyncCheckpoint[];
  enrichedDrops: EnrichedDropItem[];
  categoryBreakdown: { category: string; chaos: number; ssfPts: number; count: number; pct: number }[];
  valueSystem: 'ninja' | 'ssf';
  divineChaos: number;
  ownedTabNames: string[];
  onOpenFullAnalytics?: () => void;
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

export const AssetAnalyticsDeck: React.FC<AssetAnalyticsDeckProps> = ({
  checkpoints,
  enrichedDrops,
  categoryBreakdown,
  valueSystem,
  divineChaos,
  ownedTabNames,
  onOpenFullAnalytics
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // 1. Wealth Area Chart points
  const chartPoints = checkpoints.length >= 2
    ? checkpoints
    : checkpoints.length === 1
    ? [{ at: 'Start', totalItems: 0, totalChaos: 0 }, checkpoints[0]]
    : [
        { at: 'Start', totalItems: 0, totalChaos: 0 },
        { at: 'Now', totalItems: 0, totalChaos: 0 }
      ];
  const maxChaos = Math.max(10, ...chartPoints.map((p) => p.totalChaos));
  const w = 360;
  const h = 110;
  const coords = chartPoints.map((p, idx) => {
    const x = chartPoints.length === 1 ? w : (idx / (chartPoints.length - 1)) * (w - 16) + 8;
    const y = h - 14 - (p.totalChaos / maxChaos) * (h - 26);
    return { x, y, ...p };
  });
  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${h - 8} L ${coords[0].x.toFixed(1)} ${h - 8} Z`;
  const activeHover = hoveredIdx !== null && coords[hoveredIdx] ? coords[hoveredIdx] : coords[coords.length - 1];

  // 2. Category Share Donut (only categories with positive value)
  const nonZeroCats = categoryBreakdown
    .map((c) => ({ ...c, val: valueSystem === 'ssf' ? c.ssfPts : c.chaos }))
    .filter((c) => c.val > 0);
  const totalDonutVal = nonZeroCats.reduce((s, c) => s + c.val, 0);
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  let runningOffset = 0;

  // 3. Per Canonical Tab Yield Bar Chart (omitting unowned tabs)
  const tabTotalsMap = new Map<string, number>();
  for (const it of enrichedDrops) {
    const tName = it.tabName || 'Stash';
    if (ownedTabNames.length > 0 && !ownedTabNames.includes(tName)) continue;
    const v = valueSystem === 'ssf' ? it.totalSsfPoints : it.totalChaos;
    tabTotalsMap.set(tName, (tabTotalsMap.get(tName) || 0) + v);
  }
  const tabYields = Array.from(tabTotalsMap.entries())
    .map(([tabName, val]) => ({ tabName, val: Math.round(val) }))
    .filter((t) => t.val > 0)
    .sort((a, b) => b.val - a.val)
    .slice(0, 8);
  const maxTabYield = Math.max(1, ...tabYields.map((t) => t.val));

  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Chart 1: Interactive Wealth Timeline */}
      <div className="rounded-2xl border border-slate-800 bg-[#0d111a] p-4 space-y-2.5 shadow-lg">
        <div className="flex items-center justify-between text-xs gap-2">
          <div className="font-bold text-slate-200 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            <span>Wealth Timeline</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-amber-300 font-bold">
              {activeHover.at}: {formatValue(activeHover.totalChaos, divineChaos)}
            </span>
            {onOpenFullAnalytics && (
              <button
                type="button"
                onClick={onOpenFullAnalytics}
                className="px-2 py-0.5 rounded-md bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-[10px] font-bold text-amber-200 cursor-pointer transition-colors"
              >
                Full View &rarr;
              </button>
            )}
          </div>
        </div>

        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-28 overflow-visible">
          <defs>
            <linearGradient id="assetWealthGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#assetWealthGrad)" />
          <path d={linePath} fill="none" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          {coords.map((c, idx) => (
            <circle
              key={idx}
              cx={c.x}
              cy={c.y}
              r={hoveredIdx === idx ? 5 : 3.2}
              fill={hoveredIdx === idx ? '#ffffff' : '#fbbf24'}
              stroke="#0d111a"
              strokeWidth="1.5"
              className="cursor-pointer transition-all"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
          ))}
        </svg>

        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
          <span>{chartPoints[0]?.at}</span>
          <span>Peak: {formatValue(maxChaos, divineChaos)}</span>
          <span>{chartPoints[chartPoints.length - 1]?.at}</span>
        </div>
      </div>

      {/* Chart 2: Category Share Donut */}
      <div className="rounded-2xl border border-slate-800 bg-[#0d111a] p-4 space-y-2.5 shadow-lg">
        <div className="flex items-center justify-between text-xs">
          <div className="font-bold text-slate-200 flex items-center gap-1.5">
            <PieChart className="w-3.5 h-3.5 text-indigo-400" />
            <span>Category Share</span>
          </div>
          <span className="font-mono text-[10px] text-slate-400">
            {valueSystem === 'ssf' ? 'SSF Utility' : 'poe.ninja'}
          </span>
        </div>

        {nonZeroCats.length === 0 ? (
          <div className="h-28 flex items-center justify-center text-xs text-slate-500">
            Sync tabs to populate category share
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <svg viewBox="0 0 100 100" className="w-24 h-24 shrink-0 -rotate-90">
              {nonZeroCats.map((cat, idx) => {
                const frac = totalDonutVal > 0 ? cat.val / totalDonutVal : 0;
                const dash = frac * circumference;
                const el = (
                  <circle
                    key={cat.category}
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="transparent"
                    stroke={SLICE_COLORS[idx % SLICE_COLORS.length]}
                    strokeWidth="12"
                    strokeDasharray={`${dash} ${circumference - dash}`}
                    strokeDashoffset={-runningOffset}
                  />
                );
                runningOffset += dash;
                return el;
              })}
            </svg>

            <div className="flex-1 min-w-0 space-y-1 text-[11px]">
              {nonZeroCats.slice(0, 5).map((cat, idx) => (
                <div key={cat.category} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: SLICE_COLORS[idx % SLICE_COLORS.length] }}
                    />
                    <span className="text-slate-300 truncate">{cat.category}</span>
                  </div>
                  <span className="font-mono text-slate-200 font-bold shrink-0">{cat.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Chart 3: Per Canonical Tab Yield Bar Chart */}
      <div className="rounded-2xl border border-slate-800 bg-[#0d111a] p-4 space-y-2.5 shadow-lg">
        <div className="flex items-center justify-between text-xs">
          <div className="font-bold text-slate-200 flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Top Yielding Tabs</span>
          </div>
          <span className="font-mono text-[10px] text-slate-400">Owned Tabs Only</span>
        </div>

        {tabYields.length === 0 ? (
          <div className="h-28 flex items-center justify-center text-xs text-slate-500">
            No tab yields recorded yet
          </div>
        ) : (
          <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
            {tabYields.map((t) => {
              const pct = Math.max(4, Math.round((t.val / maxTabYield) * 100));
              return (
                <div key={t.tabName} className="space-y-0.5 text-[11px]">
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-slate-200 font-semibold truncate">{t.tabName}</span>
                    <span className="text-emerald-300 font-bold">
                      {valueSystem === 'ssf' ? formatSsfPoints(t.val) : formatValue(t.val, divineChaos)}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400"
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
