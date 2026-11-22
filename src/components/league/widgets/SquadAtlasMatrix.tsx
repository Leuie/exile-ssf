import React, { useState } from 'react';
import { Compass, AlertTriangle, Check, Copy, Sparkles } from 'lucide-react';
import type { LeagueRosterMember } from '../../../types';

interface SquadAtlasMatrixProps {
  roster: LeagueRosterMember[];
}

const CORE_MECHANICS: { name: string; swapHint: string; color: string }[] = [
  { name: 'Betrayal', swapHint: 'Veiled Orbs, Aisling benches, or Safehouse crafts', color: 'text-emerald-400' },
  { name: 'Essences', swapHint: 'Deafening Essences (Loathing, Greed, Woe, Envy)', color: 'text-sky-400' },
  { name: 'Harvest', swapHint: 'Vivid, Wild, or Primal Lifeforce and resist swaps', color: 'text-cyan-400' },
  { name: 'Expedition', swapHint: 'Rog crafts, Tujen currency, or Gwennen bases', color: 'text-amber-400' },
  { name: 'Delve', swapHint: 'Fossils, Resonators, or Curse on Hit rings', color: 'text-orange-400' },
  { name: 'Blight', swapHint: 'Golden, Silver, or Opalescent Oils for anoints', color: 'text-yellow-400' },
  { name: 'Heist', swapHint: 'Replica Uniques, Simplex Amulets, or Tempering Orbs', color: 'text-rose-400' },
  { name: 'Legion', swapHint: 'Timeless Jewels, 5 Way Emblems, or Incubators', color: 'text-purple-400' },
  { name: 'Destructive Play', swapHint: 'Shaper, Elder, Conquerors, and Maven Invitations', color: 'text-indigo-400' },
  { name: 'Ritual', swapHint: 'Omens, Nameless Altars, and Fractured Bases', color: 'text-red-400' }
];

export const SquadAtlasMatrix: React.FC<SquadAtlasMatrixProps> = ({ roster }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopyWhisper = (member: LeagueRosterMember, mechanic: string) => {
    const ign = member.characterName || member.displayName;
    const msg = `@${ign} Hey! Saw on Exile SSF you are farming ${mechanic} in our GSF league. Got any extra mats to swap?`;
    navigator.clipboard.writeText(msg);
    const key = `${member.id}_${mechanic}`;
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2200);
  };

  const matrix = CORE_MECHANICS.map((mech) => {
    const farmers = roster.filter((m) =>
      (m.atlasContent || []).some(
        (tag) => tag.toLowerCase().includes(mech.name.toLowerCase()) || mech.name.toLowerCase().includes(tag.toLowerCase())
      )
    );
    return { ...mech, farmers };
  });

  const unfilledCount = matrix.filter((m) => m.farmers.length === 0).length;

  return (
    <div className="bg-[#0d1016] border border-slate-800/80 rounded-2xl p-5 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Compass className="w-4 h-4 text-emerald-400" />
            Squad Atlas Tree & Niche Division Matrix
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Who is farming what across our GSF squad. Spot missing niches and whisper squadmates directly to swap crafting mats.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unfilledCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300">
              <AlertTriangle className="w-3.5 h-3.5" />
              {unfilledCount} Unfilled {unfilledCount === 1 ? 'Niche' : 'Niches'}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
              <Sparkles className="w-3.5 h-3.5" />
              All 10 Core Mechanics Covered
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {matrix.map((mech) => {
          const isEmpty = mech.farmers.length === 0;
          return (
            <div
              key={mech.name}
              className={`rounded-xl p-3 border transition-colors ${
                isEmpty
                  ? 'bg-amber-950/15 border-amber-500/30'
                  : 'bg-[#090c11] border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className={`text-xs font-black uppercase tracking-wide ${mech.color}`}>
                  {mech.name}
                </span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    isEmpty
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {mech.farmers.length}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 leading-snug mb-2.5">{mech.swapHint}</p>

              {isEmpty ? (
                <div className="text-[10px] font-semibold text-amber-400/90 bg-amber-500/5 border border-amber-500/20 rounded-lg px-2 py-1.5">
                  Needs a volunteer! Edit your Roster slot to claim this niche.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {mech.farmers.map((farmer) => {
                    const key = `${farmer.id}_${mech.name}`;
                    const isCopied = copiedKey === key;
                    return (
                      <div
                        key={farmer.id}
                        className="flex items-center justify-between gap-1.5 bg-slate-900/70 border border-slate-800/70 rounded-lg px-2 py-1"
                      >
                        <a
                          href={`/exile/${encodeURIComponent(farmer.displayName)}`}
                          className="text-[11px] font-bold text-slate-200 hover:text-amber-300 truncate"
                          title={`Open @${farmer.displayName}'s Exile Profile`}
                        >
                          @{farmer.displayName}
                        </a>
                        <button
                          type="button"
                          onClick={() => handleCopyWhisper(farmer, mech.name)}
                          className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors ${
                            isCopied
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-slate-800 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-300'
                          }`}
                          title={`Copy PoE swap whisper for @${farmer.displayName}`}
                        >
                          {isCopied ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                          {isCopied ? 'Copied' : 'Swap'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
