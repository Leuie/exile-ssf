import React from 'react';
import { formatValue, type SyncCheckpoint } from './assetEngine';

interface LootSparklineProps {
  checkpoints: SyncCheckpoint[];
  fallbackChaos: number;
  divineChaos: number;
}

export const LootSparkline: React.FC<LootSparklineProps> = ({ checkpoints, fallbackChaos, divineChaos }) => {
  const points =
    checkpoints.length >= 2
      ? checkpoints
      : checkpoints.length === 1
      ? [{ at: 'Start', totalItems: 0, totalChaos: 0 }, checkpoints[0]]
      : [
          { at: 'Start', totalItems: 0, totalChaos: 0 },
          { at: 'Now', totalItems: 0, totalChaos: fallbackChaos }
        ];

  const maxVal = Math.max(10, ...points.map((p) => p.totalChaos));
  const width = 400;
  const height = 56;
  const coords = points.map((p, idx) => {
    const x = points.length === 1 ? width / 2 : (idx / (points.length - 1)) * (width - 16) + 8;
    const y = height - 8 - (p.totalChaos / maxVal) * (height - 16);
    return { x, y, ...p };
  });

  const linePath = coords.map((c, idx) => `${idx === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${height} L ${coords[0].x.toFixed(1)} ${height} Z`;

  return (
    <>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-14 overflow-visible" preserveAspectRatio="none">
        <defs>
          <linearGradient id="lootAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#lootAreaGrad)" />
        <path d={linePath} fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r="3" fill="#fef08a" stroke="#b45309" strokeWidth="1" />
        ))}
      </svg>
      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
        <span>{points[0]?.at}</span>
        <span>Peak: {formatValue(maxVal, divineChaos)}</span>
        <span>{points[points.length - 1]?.at}</span>
      </div>
    </>
  );
};
