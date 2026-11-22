import React, { useState, useEffect, useMemo } from 'react';
import { Hammer, Search, CheckCircle2, Circle, Cloud, RotateCcw, Sparkles } from 'lucide-react';
import { CRAFTING_BENCH_UNLOCKS, STASH_TAB_BUYER_TIERS } from '../../../data/privateLeagueData';
import type { UserAccount } from '../../../types';
import { fetchUserToolState, saveUserToolState } from '../../../services/cloudSync';

interface BenchGuideTabProps {
  selectedGame?: 'poe1' | 'poe2';
  userAccount?: UserAccount | null;
}

const POE2_RUNE_AND_SALVAGE_GUIDE = [
  {
    craft: 'Iron Rune (+20% Physical Damage / Armour)',
    location: 'Campaign Drops & Salvage Bench',
    tip: 'Socket 2 Iron Runes into early martial weapons for massive flat + % local physical scaling.'
  },
  {
    craft: 'Glacial / Storm / Desert Runes (Resistances)',
    location: 'Act 1 to 3 & Waystone Drops',
    tip: 'Use elemental runes to cap 75% Fire, Cold, and Lightning resistance immediately after Act 3 Cruel penalties.'
  },
  {
    craft: 'Soul Core of Azcapa (+10% Spirit / Rarity)',
    location: 'Trial of Chaos (Ultimatum)',
    tip: 'Farm Trial of Chaos rooms for Soul Cores that grant Spirit, Maximum Life %, and Chaos Resistance.'
  },
  {
    craft: 'Artificer Orb (Add Socket)',
    location: 'Salvage Bench (Salvage Socketed Gear)',
    tip: 'Always pick up socketed white and blue items to salvage into Artificer Shards for free 2 socket bases.'
  },
  {
    craft: 'Armourer Scrap & Blacksmith Whetstone',
    location: 'Salvage Bench (Salvage Quality Gear)',
    tip: 'Salvage any superior (+Quality%) weapon or armour to stockpile quality currency for endgame bases.'
  }
];

const LOCAL_STORAGE_KEY = 'exile_ssf_bench_unlocks_v1';

export const BenchGuideTab: React.FC<BenchGuideTabProps> = ({
  selectedGame = 'poe1',
  userAccount
}) => {
  const [game, setGame] = useState<'poe1' | 'poe2'>(selectedGame);
  const [search, setSearch] = useState<string>('');
  const [unlockedMap, setUnlockedMap] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [cloudSynced, setCloudSynced] = useState<boolean>(false);

  useEffect(() => {
    setGame(selectedGame);
  }, [selectedGame]);

  useEffect(() => {
    if (!userAccount?.displayName) return;
    let cancelled = false;
    fetchUserToolState<Record<string, boolean>>(userAccount.displayName, 'bench_unlocks').then((data) => {
      if (!cancelled && data && typeof data === 'object') {
        setUnlockedMap(data);
        setCloudSynced(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [userAccount?.displayName]);

  const persistUnlocks = (next: Record<string, boolean>) => {
    setUnlockedMap(next);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next));
    } catch {}
    if (userAccount?.displayName) {
      saveUserToolState(userAccount.displayName, 'bench_unlocks', next).then((ok) => {
        if (ok) setCloudSynced(true);
      });
    }
  };

  const toggleRecipe = (craftName: string) => {
    const key = `${game}::${craftName}`;
    persistUnlocks({ ...unlockedMap, [key]: !unlockedMap[key] });
  };

  const activeList = game === 'poe2' ? POE2_RUNE_AND_SALVAGE_GUIDE : CRAFTING_BENCH_UNLOCKS;

  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return activeList;
    return activeList.filter(
      (b) =>
        b.craft.toLowerCase().includes(q) ||
        b.location.toLowerCase().includes(q) ||
        b.tip.toLowerCase().includes(q)
    );
  }, [activeList, search]);

  const unlockedCount = activeList.filter((b) => unlockedMap[`${game}::${b.craft}`]).length;
  const pct = activeList.length > 0 ? Math.round((unlockedCount / activeList.length) * 100) : 0;

  return (
    <div className="space-y-5 w-full pb-12 font-sans text-slate-200">
      {/* Header */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black font-cinzel text-white flex items-center gap-2">
              <Hammer className="w-5 h-5 text-amber-400" />
              <span>{game === 'poe2' ? 'Salvage Bench, Runes & Stash Priority' : 'Crafting Bench Unlocks & Stash Priority'}</span>
            </h1>
            {cloudSynced && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-[10px] font-mono text-emerald-300">
                <Cloud className="w-3 h-3" />
                <span>Cloud Synced</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Track mandatory SSF crafting bench recipes, Runes, Salvage tips, and stash tab purchase tiers synced to your Exile SSF account.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => setGame('poe1')}
              className={`px-3 py-1.5 rounded-lg cursor-pointer ${game === 'poe1' ? 'bg-amber-600/30 text-amber-200 border border-amber-500/50' : 'text-slate-400 hover:text-white'}`}
            >
              PoE 1
            </button>
            <button
              type="button"
              onClick={() => setGame('poe2')}
              className={`px-3 py-1.5 rounded-lg cursor-pointer ${game === 'poe2' ? 'bg-cyan-600/30 text-cyan-200 border border-cyan-500/50' : 'text-slate-400 hover:text-white'}`}
            >
              PoE 2
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Bench Checklist */}
      <div className="p-4 sm:p-5 rounded-2xl border border-slate-800 bg-slate-900/65 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{game === 'poe2' ? 'Key Runes, Soul Cores & Salvage Targets' : 'Essential Bench Recipe Checklist'}</span>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-300 font-bold">
              {unlockedCount}/{activeList.length} ({pct}%)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search recipes or zones..."
                className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-400 w-52"
              />
            </div>
            {unlockedCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  const next = { ...unlockedMap };
                  activeList.forEach((b) => delete next[`${game}::${b.craft}`]);
                  persistUnlocks(next);
                }}
                className="p-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-rose-300 cursor-pointer"
                title="Reset unlocked checkboxes for this game"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>

        <div className="rounded-xl border border-slate-800 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-500 font-mono text-[10px] uppercase border-b border-slate-800">
              <tr>
                <th className="p-2.5 w-10 text-center">Done</th>
                <th className="p-2.5">{game === 'poe2' ? 'Rune / Bench Target' : 'Craft Recipe'}</th>
                <th className="p-2.5">Location</th>
                <th className="p-2.5">SSF Tip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredList.map((bench, idx) => {
                const done = Boolean(unlockedMap[`${game}::${bench.craft}`]);
                return (
                  <tr
                    key={idx}
                    onClick={() => toggleRecipe(bench.craft)}
                    className={`cursor-pointer transition-colors ${done ? 'bg-emerald-500/5 hover:bg-emerald-500/10' : 'hover:bg-slate-800/40'}`}
                  >
                    <td className="p-2.5 text-center">
                      {done ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-600 mx-auto" />
                      )}
                    </td>
                    <td className={`p-2.5 font-semibold ${done ? 'text-emerald-200 line-through opacity-80' : 'text-slate-100'}`}>
                      {bench.craft}
                    </td>
                    <td className="p-2.5 font-mono text-sky-300/90">{bench.location}</td>
                    <td className="p-2.5 text-slate-400">{bench.tip}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stash Tab Sale Priority */}
      <div className="p-4 sm:p-5 rounded-2xl border border-slate-800 bg-slate-900/65 space-y-3">
        <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
          Stash Tab Sale Priority (Shared Across PoE 1 & PoE 2)
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {STASH_TAB_BUYER_TIERS.map((tier, idx) => (
            <div key={idx} className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-amber-400 uppercase text-[10px] font-bold">Tier {idx + 1}</span>
                <span className="font-mono text-slate-300">{tier.cost}</span>
              </div>
              <div className="font-bold text-slate-100">{tier.tier}</div>
              <ul className="space-y-1 text-slate-400 text-[11px]">
                {tier.tabs.map((tab: string, tIdx: number) => (
                  <li key={tIdx} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
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
