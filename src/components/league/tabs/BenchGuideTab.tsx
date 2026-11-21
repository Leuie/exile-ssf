import React from 'react';
import { CRAFTING_BENCH_UNLOCKS, STASH_TAB_BUYER_TIERS } from '../../../data/privateLeagueData';

export const BenchGuideTab: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-3">
        <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
          Essential Bench Recipe Locations
        </div>
        <div className="rounded-lg border border-slate-800 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-500 font-mono text-[10px] uppercase border-b border-slate-800">
              <tr>
                <th className="p-2.5">Craft Recipe</th>
                <th className="p-2.5">Location</th>
                <th className="p-2.5">Tip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {CRAFTING_BENCH_UNLOCKS.map((bench, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30">
                  <td className="p-2.5 font-medium text-slate-200">{bench.craft}</td>
                  <td className="p-2.5 font-mono text-slate-400">{bench.location}</td>
                  <td className="p-2.5 text-slate-400">{bench.tip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-3">
        <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
          Stash Tab Sale Priority
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {STASH_TAB_BUYER_TIERS.map((tier, idx) => (
            <div key={idx} className="p-3.5 rounded-lg border border-slate-800 bg-slate-950/60 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-slate-400 uppercase text-[10px]">Tier {idx + 1}</span>
                <span className="font-mono text-slate-300">{tier.cost}</span>
              </div>
              <div className="font-semibold text-slate-200">{tier.tier}</div>
              <ul className="space-y-1 text-slate-400 text-[11px]">
                {tier.tabs.map((tab: string, tIdx: number) => (
                  <li key={tIdx} className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-slate-400" />
                    <span>{tab}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
