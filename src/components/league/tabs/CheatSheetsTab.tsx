import React, { useState, useEffect } from 'react';
import { Sparkles, UserCheck } from 'lucide-react';
import {
  SYNDICATE_CHEAT_SHEET,
  HEIST_CHEAT_SHEET,
  DELVE_FOSSIL_CHEAT_SHEET,
  INCURSION_CHEAT_SHEET,
  ATLAS_MAP_RATINGS,
  COVENS_THREADS_CHEAT_SHEET
} from '../../../data/privateLeagueData';
import type { UserAccount } from '../../../types';
import { fetchActiveCharacterContext } from '../../../services/cloudSync';

export type CheatSubTab = 'syndicate' | 'heist' | 'delve' | 'incursion' | 'maps' | 'threads' | 'poe2_endgame';

export interface CheatSheetsTabProps {
  initialSubTab?: CheatSubTab;
  selectedGame?: 'poe1' | 'poe2';
  userAccount?: UserAccount | null;
}

const POE2_ENDGAME_CHEATS = [
  {
    mechanic: 'Trial of the Sekhemas (Sanctum)',
    keyReward: 'Ascendancy Points (1 to 4), Time Lost Jewels, Relics',
    ssfPriority: 'Cap Honour Resistance to 75% using Relics before attempting Floor 3 and Floor 4 Zarokh.'
  },
  {
    mechanic: 'Trial of Chaos (Ultimatum)',
    keyReward: 'Soul Cores (Spirit, Max Life %, Chaos Res), Vaal Uniques',
    ssfPriority: 'Avoid Impending Doom and Volatile Fiends early; target Soul Core of Azcapa and Zalatl.'
  },
  {
    mechanic: 'Breach (Xesht)',
    keyReward: 'Catalysts (Quality on Rings/Amulets), Breach Rings (50% Quality cap)',
    ssfPriority: 'Farm Breach Splinters in open layouts to craft 50% Catalyst quality Breach Rings for huge stats.'
  },
  {
    mechanic: 'Ritual (King in the Mists)',
    keyReward: 'Omens (Whittling, Sinistral/Dextral Erasure), Audience with the King',
    ssfPriority: 'Defer deterministic crafting Omens first; Omens act as metamod crafting in PoE 2 SSF.'
  },
  {
    mechanic: 'Expedition (Gwennen, Rog, Tujen, Dannig)',
    keyReward: 'Deterministic Rare Bases, Exotic Coinage, Logbooks',
    ssfPriority: 'Run Logbooks for ilvl 81+ crafting bases and use Recombinator + Expedition vendors for endgame weapons.'
  },
  {
    mechanic: 'Delirium (Simulacrum)',
    keyReward: 'Distilled Emotions (Amulet Anoints & Waystone Instilling)',
    ssfPriority: 'Instill Waystones with Distilled Ire/Guilt for pack size and save rare Emotions for key Notable anoints.'
  }
];

export const CheatSheetsTab: React.FC<CheatSheetsTabProps> = ({
  initialSubTab,
  selectedGame = 'poe1',
  userAccount
}) => {
  const [cheatSubTab, setCheatSubTab] = useState<CheatSubTab>(
    initialSubTab || (selectedGame === 'poe2' ? 'poe2_endgame' : 'threads')
  );
  const [cheatSearch, setCheatSearch] = useState<string>('');
  const [userAtlasLanes, setUserAtlasLanes] = useState<string[]>([]);

  useEffect(() => {
    if (!initialSubTab) {
      setCheatSubTab(selectedGame === 'poe2' ? 'poe2_endgame' : 'threads');
    }
  }, [selectedGame, initialSubTab]);

  useEffect(() => {
    if (!userAccount?.displayName) {
      setUserAtlasLanes([]);
      return;
    }
    let cancelled = false;
    fetchActiveCharacterContext(userAccount, selectedGame).then((ctx) => {
      if (!cancelled && ctx.member && Array.isArray(ctx.member.atlasContent)) {
        setUserAtlasLanes(ctx.member.atlasContent);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [userAccount?.displayName, selectedGame]);

  const isUserLane = (id: CheatSubTab) => {
    const joined = userAtlasLanes.join(' ').toLowerCase();
    if (!joined) return false;
    if (id === 'syndicate') return joined.includes('betrayal') || joined.includes('jun') || joined.includes('syndicate');
    if (id === 'heist') return joined.includes('heist');
    if (id === 'delve') return joined.includes('delve');
    if (id === 'incursion') return joined.includes('incursion') || joined.includes('alva');
    if (id === 'threads') return joined.includes('thread') || joined.includes('umbra');
    return false;
  };

  const tabs: { id: CheatSubTab; label: string }[] = [
    ...(selectedGame === 'poe2' ? [{ id: 'poe2_endgame' as const, label: 'PoE 2 Endgame (0.5)' }] : []),
    { id: 'threads', label: 'Threads Thresholds (3.30)' },
    { id: 'syndicate', label: 'Betrayal (Jun)' },
    { id: 'heist', label: 'Heist Rogues' },
    { id: 'delve', label: 'Delve Fossils' },
    { id: 'incursion', label: 'Incursion Rooms' },
    { id: 'maps', label: 'Atlas Map Ratings' },
    ...(selectedGame === 'poe1' ? [{ id: 'poe2_endgame' as const, label: 'PoE 2 Mechanics' }] : [])
  ];

  const q = cheatSearch.trim().toLowerCase();

  return (
    <div className="space-y-4 w-full pb-12 font-sans text-slate-200">
      <div className="p-3.5 rounded-2xl border border-slate-800 bg-slate-900/80 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {tabs.map((sub) => {
            const laneMatch = isUserLane(sub.id);
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => setCheatSubTab(sub.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer inline-flex items-center gap-1.5 border ${
                  cheatSubTab === sub.id
                    ? 'bg-indigo-600/30 text-white border-indigo-400/60'
                    : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <span>{sub.label}</span>
                {laneMatch && (
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 border border-emerald-500/40 text-[9px] font-mono text-emerald-300">
                    Your Lane
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <input
          type="text"
          placeholder="Search rewards, rooms, or names..."
          value={cheatSearch}
          onChange={(e) => setCheatSearch(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-400 w-56"
        />
      </div>

      {userAtlasLanes.length > 0 && (
        <div className="px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-200 flex flex-wrap items-center gap-2">
          <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Your League Roster Atlas Lanes: <strong>{userAtlasLanes.join(', ')}</strong></span>
        </div>
      )}

      {/* PoE 2 Endgame Cheat Sheet */}
      {cheatSubTab === 'poe2_endgame' && (
        <div className="rounded-2xl border border-cyan-500/25 bg-slate-900/65 overflow-x-auto">
          <div className="px-4 py-3 border-b border-slate-800 bg-cyan-950/20 flex items-center gap-2 text-xs font-mono font-bold uppercase text-cyan-300">
            <Sparkles className="w-4 h-4" />
            <span>Path of Exile 2 Endgame Mechanics & SSF Priorities</span>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-500 font-mono text-[10px] uppercase border-b border-slate-800">
              <tr>
                <th className="p-3">Mechanic</th>
                <th className="p-3">Core Drops & Unlocks</th>
                <th className="p-3">SSF Strategy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {POE2_ENDGAME_CHEATS.filter(
                (r) => !q || r.mechanic.toLowerCase().includes(q) || r.keyReward.toLowerCase().includes(q) || r.ssfPriority.toLowerCase().includes(q)
              ).map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30">
                  <td className="p-3 font-bold text-cyan-200">{row.mechanic}</td>
                  <td className="p-3 text-slate-200">{row.keyReward}</td>
                  <td className="p-3 text-slate-400">{row.ssfPriority}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Syndicate */}
      {cheatSubTab === 'syndicate' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-x-auto">
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
                !q ||
                row.member.toLowerCase().includes(q) ||
                row.research.toLowerCase().includes(q) ||
                row.intervention.toLowerCase().includes(q) ||
                row.transportation.toLowerCase().includes(q) ||
                row.fortification.toLowerCase().includes(q)
              ).map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30">
                  <td className="p-2.5 font-bold text-slate-200">{row.member}</td>
                  <td className="p-2.5 text-slate-400">{row.transportation}</td>
                  <td className="p-2.5 text-slate-400">{row.fortification}</td>
                  <td className="p-2.5 text-slate-200 font-medium">{row.research}</td>
                  <td className="p-2.5 text-slate-300">{row.intervention}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Heist */}
      {cheatSubTab === 'heist' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-500 font-mono text-[10px] uppercase border-b border-slate-800">
              <tr>
                <th className="p-2.5">Rogue</th>
                <th className="p-2.5">Jobs & Max Level</th>
                <th className="p-2.5">Passive Bonus</th>
                <th className="p-2.5">Best Gear Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {HEIST_CHEAT_SHEET.filter((row) =>
                !q ||
                row.rogue.toLowerCase().includes(q) ||
                row.passiveEffect.toLowerCase().includes(q) ||
                row.bestGearNote.toLowerCase().includes(q)
              ).map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30">
                  <td className="p-2.5 font-bold text-slate-200">{row.rogue}</td>
                  <td className="p-2.5 text-slate-300 font-mono">
                    {row.jobs.map((j) => `${j.job} (${j.maxLevel})`).join(', ')}
                  </td>
                  <td className="p-2.5 text-slate-300">{row.passiveEffect}</td>
                  <td className="p-2.5 text-slate-400">{row.bestGearNote}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delve */}
      {cheatSubTab === 'delve' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-500 font-mono text-[10px] uppercase border-b border-slate-800">
              <tr>
                <th className="p-2.5">Fossil</th>
                <th className="p-2.5">Tier</th>
                <th className="p-2.5">Crafting Effect</th>
                <th className="p-2.5">Biomes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {DELVE_FOSSIL_CHEAT_SHEET.filter((row) =>
                !q || row.fossil.toLowerCase().includes(q) || row.effect.toLowerCase().includes(q)
              ).map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30">
                  <td className="p-2.5 font-bold text-slate-200">{row.fossil}</td>
                  <td className="p-2.5 font-mono text-amber-300">{row.tier}</td>
                  <td className="p-2.5 text-slate-300">{row.effect}</td>
                  <td className="p-2.5 text-slate-400">{row.biomes.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Incursion */}
      {cheatSubTab === 'incursion' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-500 font-mono text-[10px] uppercase border-b border-slate-800">
              <tr>
                <th className="p-2.5">Tier 1</th>
                <th className="p-2.5">Tier 2</th>
                <th className="p-2.5">Tier 3 Room</th>
                <th className="p-2.5">Effect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {INCURSION_CHEAT_SHEET.filter((row) =>
                !q || row.tier3.toLowerCase().includes(q) || row.effect.toLowerCase().includes(q)
              ).map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30">
                  <td className="p-2.5 text-slate-400">{row.tier1}</td>
                  <td className="p-2.5 text-slate-300">{row.tier2}</td>
                  <td className="p-2.5 font-bold text-amber-200">{row.tier3}</td>
                  <td className="p-2.5 text-slate-300">{row.effect}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Atlas Maps */}
      {cheatSubTab === 'maps' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-500 font-mono text-[10px] uppercase border-b border-slate-800">
              <tr>
                <th className="p-2.5">Map Name</th>
                <th className="p-2.5">Layout</th>
                <th className="p-2.5">Boss</th>
                <th className="p-2.5">Notable Divination Cards</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {ATLAS_MAP_RATINGS.filter((row) =>
                !q || row.mapName.toLowerCase().includes(q) || (row.notableCards || '').toLowerCase().includes(q)
              ).map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30">
                  <td className="p-2.5 font-bold text-slate-200">{row.mapName}</td>
                  <td className="p-2.5 font-mono text-emerald-300">{row.layoutScore}</td>
                  <td className="p-2.5 font-mono text-slate-300">{row.bossScore}</td>
                  <td className="p-2.5 text-slate-400">{row.notableCards || 'Standard Map Pool'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Threads of Creation (3.30) */}
      {cheatSubTab === 'threads' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-500 font-mono text-[10px] uppercase border-b border-slate-800">
              <tr>
                <th className="p-2.5">Threshold</th>
                <th className="p-2.5">Mechanic</th>
                <th className="p-2.5">Bonus & Loot Scaling</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {COVENS_THREADS_CHEAT_SHEET.filter((row: any) =>
                !q || JSON.stringify(row).toLowerCase().includes(q)
              ).map((row: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-800/30">
                  <td className="p-2.5 font-mono font-bold text-amber-300">{row.threshold || row.name}</td>
                  <td className="p-2.5 font-semibold text-slate-200">{row.mechanic || row.category}</td>
                  <td className="p-2.5 text-slate-300">{row.effect || row.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
