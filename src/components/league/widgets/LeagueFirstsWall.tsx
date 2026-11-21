import React, { useState } from 'react';
import { Trophy, Crown, Sparkles, CheckCircle2 } from 'lucide-react';
import type { LeagueFirstMilestone, UserAccount } from '../../../types';

interface LeagueFirstsWallProps {
  leagueId?: string;
  firsts: LeagueFirstMilestone[];
  currentUser: UserAccount | null;
  isAdmin: boolean;
  onClaimFirst: (milestone: LeagueFirstMilestone) => void;
}

const DEFAULT_MILESTONES: { id: string; title: string; subtitle: string }[] = [
  { id: 'first_lvl_95', title: 'First Level 95', subtitle: 'Speedrunning the endgame XP race' },
  { id: 'first_lvl_100', title: 'First Level 100', subtitle: 'Peak GSF endurance milestone' },
  { id: 'first_4_voidstones', title: 'First 4 Voidstones', subtitle: 'Eater, Exarch, Maven, and Uber Elder' },
  { id: 'first_uber_kill', title: 'First Uber Pinnacle Kill', subtitle: 'Conquered a Level 85 Uber Boss' },
  { id: 'first_t17_clear', title: 'First T17 Map Clear', subtitle: 'Survived Tier 17 modifiers and boss' },
  { id: 'first_chase_belt', title: 'First Mageblood / Headhunter', subtitle: 'Natural drop, Gwennen, or div cards' },
  { id: 'first_mirror_lock', title: 'First Mirror / Hinekora Lock', subtitle: 'Ultimate GSF trophy drop' },
  { id: 'first_36_challenges', title: 'First 36/40 Challenges', subtitle: 'League challenge completion master' }
];

export const LeagueFirstsWall: React.FC<LeagueFirstsWallProps> = ({
  leagueId = 'poe1-330-umbra',
  firsts,
  currentUser,
  isAdmin,
  onClaimFirst
}) => {
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [characterName, setCharacterName] = useState('');
  const [note, setNote] = useState('');

  const byId = new Map(firsts.map((f) => [f.id, f]));

  const handleSubmitClaim = (def: (typeof DEFAULT_MILESTONES)[number]) => {
    const winner = currentUser?.displayName || 'Exile';
    const record: LeagueFirstMilestone = {
      id: def.id,
      leagueId,
      milestoneKey: def.id,
      title: def.title,
      winnerDisplayName: winner,
      winnerCharacterName: characterName.trim() || currentUser?.characterName || winner,
      achievedAtIso: new Date().toISOString(),
      proofNote: note.trim() || undefined
    };
    onClaimFirst(record);
    setClaimingId(null);
    setCharacterName('');
    setNote('');
  };

  return (
    <div className="bg-[#0d1016] border border-amber-500/25 rounded-2xl p-5 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            League Firsts & Hall of Fame Wall
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Immortalize the squad's biggest seasonal milestones. Claim a League First as soon as you achieve it!
          </p>
        </div>
        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300">
          {firsts.length} / {DEFAULT_MILESTONES.length} Claimed
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {DEFAULT_MILESTONES.map((def) => {
          const claimed = byId.get(def.id);
          const isEditing = claimingId === def.id;

          return (
            <div
              key={def.id}
              className={`rounded-xl p-3.5 border flex flex-col justify-between gap-2.5 transition-colors ${
                claimed
                  ? 'bg-gradient-to-b from-amber-950/25 to-[#090c11] border-amber-500/40'
                  : 'bg-[#090c11] border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-black text-white flex items-center gap-1.5">
                    {claimed ? (
                      <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    )}
                    {def.title}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">{def.subtitle}</p>
              </div>

              {claimed ? (
                <div className="bg-black/35 border border-amber-500/20 rounded-lg p-2.5 space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <a
                      href={`/exile/${encodeURIComponent(claimed.winnerDisplayName)}`}
                      className="text-xs font-black text-amber-300 hover:underline truncate"
                    >
                      @{claimed.winnerDisplayName}
                    </a>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  </div>
                  {claimed.winnerCharacterName && (
                    <div className="text-[10px] text-slate-400 truncate">Char: {claimed.winnerCharacterName}</div>
                  )}
                  {claimed.proofNote && (
                    <div className="text-[10px] text-slate-300 italic">"{claimed.proofNote}"</div>
                  )}
                  <div className="text-[9px] text-slate-500">
                    {new Date(claimed.achievedAtIso).toLocaleDateString()}
                  </div>
                </div>
              ) : isEditing ? (
                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={characterName}
                    onChange={(e) => setCharacterName(e.target.value)}
                    placeholder="Character IGN"
                    className="w-full bg-[#0d1016] border border-slate-700 rounded px-2 py-1 text-[11px] text-white"
                  />
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Short note (optional)"
                    className="w-full bg-[#0d1016] border border-slate-700 rounded px-2 py-1 text-[11px] text-white"
                  />
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSubmitClaim(def)}
                      className="flex-1 py-1 rounded text-[11px] font-black bg-amber-600 hover:bg-amber-500 text-white"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setClaimingId(null)}
                      className="px-2 py-1 rounded text-[11px] font-bold text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={!currentUser && !isAdmin}
                  onClick={() => {
                    setCharacterName(currentUser?.characterName || '');
                    setClaimingId(def.id);
                  }}
                  className="w-full py-1.5 rounded-lg text-[11px] font-bold bg-slate-900 hover:bg-amber-500/15 border border-slate-800 hover:border-amber-500/40 text-slate-400 hover:text-amber-300 disabled:opacity-40 transition-colors"
                >
                  {currentUser ? 'Claim League First' : 'Sign in to Claim'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
