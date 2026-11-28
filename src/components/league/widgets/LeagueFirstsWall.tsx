import React, { useState, useMemo } from 'react';
import { Trophy, Crown, Sparkles, CheckCircle2, Edit3 } from 'lucide-react';
import type { LeagueFirstMilestone, LeagueRosterMember, UserAccount } from '../../../types';
import { getMemberCharacters } from '../tabs/RosterTab';
import { CharacterHoverCard } from '../../profile/CharacterHoverCard';

interface LeagueFirstsWallProps {
  leagueId?: string;
  firsts: LeagueFirstMilestone[];
  roster?: LeagueRosterMember[];
  currentUser: UserAccount | null;
  isAdmin: boolean;
  onClaimFirst: (milestone: LeagueFirstMilestone) => void;
  onOpenArmory?: (handle: string, charName?: string) => void;
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
  roster = [],
  currentUser,
  isAdmin,
  onClaimFirst,
  onOpenArmory
}) => {
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [editingWinnerHandle, setEditingWinnerHandle] = useState<string>('');
  const [characterName, setCharacterName] = useState('');
  const [useCustomChar, setUseCustomChar] = useState(false);
  const [note, setNote] = useState('');

  const byId = new Map(firsts.map((f) => [f.id, f]));

  // Pull live characters from the active league Roster for the winner being claimed/edited
  const rosterCharsForTarget = useMemo(() => {
    const targetHandle = (editingWinnerHandle || currentUser?.displayName || '').trim().toLowerCase();
    if (!targetHandle) return [];
    const member = roster.find(
      (m) =>
        m.displayName.trim().toLowerCase() === targetHandle ||
        (currentUser?.poeAccountName &&
          m.displayName.trim().toLowerCase() === currentUser.displayName.trim().toLowerCase() &&
          m.poeAccountName.trim().toLowerCase() === currentUser.poeAccountName.trim().toLowerCase())
    );
    if (!member) return [];
    return getMemberCharacters(member).sort((a, b) => (b.level || 0) - (a.level || 0));
  }, [roster, editingWinnerHandle, currentUser]);

  const openEditorForMilestone = (
    def: (typeof DEFAULT_MILESTONES)[number],
    existing?: LeagueFirstMilestone
  ) => {
    const winner = existing?.winnerDisplayName || currentUser?.displayName || 'Exile';
    setEditingWinnerHandle(winner);

    const member = roster.find((m) => m.displayName.trim().toLowerCase() === winner.trim().toLowerCase());
    const liveChars = member
      ? getMemberCharacters(member).sort((a, b) => (b.level || 0) - (a.level || 0))
      : [];

    const existingChar = existing?.winnerCharacterName || '';
    if (liveChars.length > 0) {
      const matched = liveChars.find((c) => c.characterName.toLowerCase() === existingChar.toLowerCase());
      const defaultChar = matched?.characterName || liveChars.find((c) => c.isMain)?.characterName || liveChars[0].characterName;
      setCharacterName(defaultChar);
      setUseCustomChar(false);
    } else {
      setCharacterName(existingChar || currentUser?.characterName || '');
      setUseCustomChar(true);
    }

    setNote(existing?.proofNote || '');
    setClaimingId(def.id);
  };

  const handleSubmitClaim = (def: (typeof DEFAULT_MILESTONES)[number], existing?: LeagueFirstMilestone) => {
    const winner = editingWinnerHandle || existing?.winnerDisplayName || currentUser?.displayName || 'Exile';
    const record: LeagueFirstMilestone = {
      id: def.id,
      leagueId,
      milestoneKey: def.id,
      title: def.title,
      winnerDisplayName: winner,
      winnerCharacterName: characterName.trim() || rosterCharsForTarget[0]?.characterName || winner,
      achievedAtIso: existing?.achievedAtIso || new Date().toISOString(),
      proofNote: note.trim() || undefined
    };
    onClaimFirst(record);
    setClaimingId(null);
    setEditingWinnerHandle('');
    setCharacterName('');
    setNote('');
  };

  return (
    <div className="bg-[#0d1016] border border-amber-500/25 rounded-2xl p-5 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            Hall of Fame
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Immortalize the squad's biggest seasonal milestones. Synced directly with your active Roster characters.
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
          const canEditClaimed = Boolean(
            claimed &&
              (isAdmin ||
                (currentUser &&
                  currentUser.displayName.trim().toLowerCase() === claimed.winnerDisplayName.trim().toLowerCase()))
          );

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
                  {canEditClaimed && !isEditing && (
                    <button
                      type="button"
                      onClick={() => openEditorForMilestone(def, claimed)}
                      className="p-1 rounded text-slate-400 hover:text-amber-300 hover:bg-slate-800/70 cursor-pointer"
                      title="Edit character or note"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-slate-500">{def.subtitle}</p>
              </div>

              {isEditing ? (
                <div className="space-y-1.5">
                  {rosterCharsForTarget.length > 0 && !useCustomChar ? (
                    <select
                      value={characterName}
                      onChange={(e) => {
                        if (e.target.value === '__custom__') {
                          setUseCustomChar(true);
                          setCharacterName('');
                        } else {
                          setCharacterName(e.target.value);
                        }
                      }}
                      className="w-full bg-[#0d1016] border border-amber-500/40 rounded px-2 py-1 text-[11px] text-amber-200 font-mono"
                    >
                      {rosterCharsForTarget.map((ch) => (
                        <option key={ch.id || ch.characterName} value={ch.characterName} className="bg-slate-900 text-slate-200">
                          {ch.characterName} ({ch.ascendancy} • Lvl {ch.level})
                        </option>
                      ))}
                      <option value="__custom__" className="bg-slate-900 text-amber-300">
                        + Type Custom Character...
                      </option>
                    </select>
                  ) : (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={characterName}
                        onChange={(e) => setCharacterName(e.target.value)}
                        placeholder="Character IGN"
                        className="w-full bg-[#0d1016] border border-slate-700 rounded px-2 py-1 text-[11px] text-white"
                      />
                      {rosterCharsForTarget.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setUseCustomChar(false);
                            setCharacterName(rosterCharsForTarget[0].characterName);
                          }}
                          className="px-1.5 py-1 rounded bg-slate-800 text-[10px] text-amber-300 shrink-0 cursor-pointer"
                        >
                          Roster
                        </button>
                      )}
                    </div>
                  )}
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
                      onClick={() => handleSubmitClaim(def, claimed)}
                      className="flex-1 py-1 rounded text-[11px] font-black bg-amber-600 hover:bg-amber-500 text-white cursor-pointer"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setClaimingId(null)}
                      className="px-2 py-1 rounded text-[11px] font-bold text-slate-400 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : claimed ? (
                <div className="bg-black/35 border border-amber-500/20 rounded-lg p-2.5 space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <CharacterHoverCard
                      handle={claimed.winnerDisplayName}
                      characterName={claimed.winnerCharacterName}
                      onOpenArmory={onOpenArmory}
                    >
                      <a
                        href={`/exile/${encodeURIComponent(claimed.winnerDisplayName)}`}
                        className="text-xs font-black text-amber-300 hover:underline truncate"
                      >
                        @{claimed.winnerDisplayName}
                      </a>
                    </CharacterHoverCard>
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
              ) : (
                <button
                  type="button"
                  disabled={!currentUser && !isAdmin}
                  onClick={() => openEditorForMilestone(def)}
                  className="w-full py-1.5 rounded-lg text-[11px] font-bold bg-slate-900 hover:bg-amber-500/15 border border-slate-800 hover:border-amber-500/40 text-slate-400 hover:text-amber-300 disabled:opacity-40 transition-colors cursor-pointer"
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
