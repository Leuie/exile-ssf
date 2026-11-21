import React, { useState } from 'react';
import {
  SYNDICATE_CHEAT_SHEET,
  HEIST_CHEAT_SHEET,
  DELVE_FOSSIL_CHEAT_SHEET,
  INCURSION_CHEAT_SHEET,
  ATLAS_MAP_RATINGS,
  COVENS_THREADS_CHEAT_SHEET
} from '../../../data/privateLeagueData';

export type CheatSubTab = 'syndicate' | 'heist' | 'delve' | 'incursion' | 'maps' | 'threads';

export interface CheatSheetsTabProps {
  initialSubTab?: CheatSubTab;
}

export const CheatSheetsTab: React.FC<CheatSheetsTabProps> = ({
  initialSubTab = 'threads'
}) => {
  const [cheatSubTab, setCheatSubTab] = useState<CheatSubTab>(initialSubTab);
  const [cheatSearch, setCheatSearch] = useState<string>('');

  return (
    <div className="space-y-4">
      <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {[
            { id: 'threads', label: 'Threads Thresholds (3.30.0c/d)' },
            { id: 'syndicate', label: 'Betrayal (Jun)' },
            { id: 'heist', label: 'Heist Rogues' },
            { id: 'delve', label: 'Delve Fossils' },
            { id: 'incursion', label: 'Incursion Rooms' },
            { id: 'maps', label: 'Atlas Map Ratings' }
          ].map((sub) => (
            <button
              key={sub.id}
              onClick={() => setCheatSubTab(sub.id as CheatSubTab)}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                cheatSubTab === sub.id ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {sub.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search rewards or names..."
          value={cheatSearch}
          onChange={(e) => setCheatSearch(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none"
        />
      </div>

      {/* Syndicate */}
      {cheatSubTab === 'syndicate' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-500 font-mono text-[10px] uppercase border-b border-slate-800">
              <tr>
                <th className="p-2.5">Member</th>
                <th className="p-2.5">Transportation</th>
                <th className="p-2.5">Fortification</th>
                <th className="p-2.5">Research</th>
                <th className="p-2.5">Intervention</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {SYNDICATE_CHEAT_SHEET.filter((row) =>
                !cheatSearch ||
                row.member.toLowerCase().includes(cheatSearch.toLowerCase()) ||
                row.research.toLowerCase().includes(cheatSearch.toLowerCase()) ||
                row.intervention.toLowerCase().includes(cheatSearch.toLowerCase())
              ).map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30">
                  <td className="p-2.5 font-bold text-slate-200">{row.member}</td>
                  <td className="p-2.5 text-slate-400">{row.transportation}</td>
                  <td className="p-2.5 text-slate-400">{row.fortification}</td>
                  <td className="p-2.5 text-slate-200 font-medium">{row.research}</td>
                  <td className="p-2.5 text-amber-300 font-medium">{row.intervention}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Heist */}
      {cheatSubTab === 'heist' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-500 font-mono text-[10px] uppercase border-b border-slate-800">
              <tr>
                <th className="p-2.5">Rogue</th>
                <th className="p-2.5">Primary Jobs</th>
                <th className="p-2.5">Passive Perk</th>
                <th className="p-2.5">Recommended Gear</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {HEIST_CHEAT_SHEET.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30">
                  <td className="p-2.5 font-bold text-slate-200">{row.rogue}</td>
                  <td className="p-2.5 font-mono text-slate-400">{row.jobs.map((j) => `${j.job} (Lvl ${j.maxLevel})`).join(', ')}</td>
                  <td className="p-2.5 text-slate-300">{row.passiveEffect}</td>
                  <td className="p-2.5 text-slate-400 font-mono text-[11px]">{row.bestGearNote}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delve */}
      {cheatSubTab === 'delve' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-500 font-mono text-[10px] uppercase border-b border-slate-800">
              <tr>
                <th className="p-2.5">Fossil</th>
                <th className="p-2.5">Biomes</th>
                <th className="p-2.5">Crafting Effect</th>
                <th className="p-2.5">Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {DELVE_FOSSIL_CHEAT_SHEET.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30">
                  <td className="p-2.5 font-bold text-slate-200">{row.fossil}</td>
                  <td className="p-2.5 text-slate-400">{row.biomes.join(', ')}</td>
                  <td className="p-2.5 text-slate-300">{row.effect}</td>
                  <td className="p-2.5 font-mono text-slate-400">Tier {row.tier}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Incursion */}
      {cheatSubTab === 'incursion' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-500 font-mono text-[10px] uppercase border-b border-slate-800">
              <tr>
                <th className="p-2.5">Room Tier 1</th>
                <th className="p-2.5">Tier 2</th>
                <th className="p-2.5">Tier 3 (Final)</th>
                <th className="p-2.5">Effect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {INCURSION_CHEAT_SHEET.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30">
                  <td className="p-2.5 font-medium text-slate-400">{row.tier1}</td>
                  <td className="p-2.5 text-slate-400">{row.tier2}</td>
                  <td className="p-2.5 font-bold text-white">{row.tier3}</td>
                  <td className="p-2.5 text-slate-300">{row.effect}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Maps */}
      {cheatSubTab === 'maps' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-500 font-mono text-[10px] uppercase border-b border-slate-800">
              <tr>
                <th className="p-2.5">Map (Natural Tier)</th>
                <th className="p-2.5">Layout</th>
                <th className="p-2.5">Density</th>
                <th className="p-2.5">Boss</th>
                <th className="p-2.5">Notable Cards</th>
                <th className="p-2.5">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {ATLAS_MAP_RATINGS.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30">
                  <td className="p-2.5 font-bold text-slate-200">{row.mapName} (T{row.naturalTier})</td>
                  <td className="p-2.5 font-mono text-slate-400">{row.layoutScore}/5</td>
                  <td className="p-2.5 font-mono text-slate-400">{row.mobDensityScore}/5</td>
                  <td className="p-2.5 font-mono text-slate-400">{row.bossScore}/5</td>
                  <td className="p-2.5 text-slate-300">{row.notableCards || 'Standard'}</td>
                  <td className="p-2.5 font-mono text-indigo-400">{row.totalScore.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Threads of Creation Thresholds (3.30.0c and 3.30.0d) */}
      {cheatSubTab === 'threads' && (
        <div className="space-y-3">
          <div className="p-3.5 rounded-xl border border-indigo-500/30 bg-indigo-950/20 text-xs space-y-1">
            <div className="font-bold text-indigo-300 font-mono uppercase tracking-wider text-[11px]">
              Threads of Creation Guaranteed Modifiers and 3 to 1 Vendor Formula (3.30.0c)
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Applying 1 to 3 Threads guarantees at least 1 modifier. Applying 4 to 7 Threads guarantees at least 2 modifiers. Applying 8 or more Threads guarantees at least 3 modifiers. Sell any 3 unwanted Threads to any vendor for 1 fresh random Thread of Creation.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-500 font-mono text-[10px] uppercase border-b border-slate-800">
                <tr>
                  <th className="p-2.5">Mechanic</th>
                  <th className="p-2.5">3 Threads Applied</th>
                  <th className="p-2.5">6 Threads Applied</th>
                  <th className="p-2.5">8 Threads Applied</th>
                  <th className="p-2.5">Special Rules and Patch Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {COVENS_THREADS_CHEAT_SHEET.filter((row) =>
                  !cheatSearch ||
                  row.mechanic.toLowerCase().includes(cheatSearch.toLowerCase()) ||
                  row.specialRules.toLowerCase().includes(cheatSearch.toLowerCase())
                ).map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    <td className="p-2.5 font-bold text-white whitespace-nowrap">{row.mechanic}</td>
                    <td className="p-2.5 text-indigo-300 font-medium whitespace-nowrap">{row.threads3}</td>
                    <td className="p-2.5 text-purple-300 font-medium whitespace-nowrap">{row.threads6}</td>
                    <td className="p-2.5 text-emerald-300 font-bold whitespace-nowrap">{row.threads8}</td>
                    <td className="p-2.5 text-slate-300 text-[11px] leading-relaxed">{row.specialRules}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
