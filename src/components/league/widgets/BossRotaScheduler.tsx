import React, { useState } from 'react';
import { Users, Clock, Plus, UserPlus, UserMinus, Trash2, Flame } from 'lucide-react';
import type { BossRotaListing, UserAccount } from '../../../types';

interface BossRotaSchedulerProps {
  leagueId?: string;
  rotas: BossRotaListing[];
  currentUser: UserAccount | null;
  isAdmin: boolean;
  onSaveRota: (rota: BossRotaListing) => void;
  onDeleteRota: (rotaId: string) => void;
}

const ROTA_PRESETS = [
  '4 Voidstone Completion Carry',
  'The Feared + Maven Invitation Rota',
  'Uber Elder & Shaper Frag Rota',
  'T17 Map Completion Party',
  '5 Way Legion XP Rotation',
  'Breachstone / Flawless Chayula Rota'
];

export const BossRotaScheduler: React.FC<BossRotaSchedulerProps> = ({
  leagueId = 'poe1-330-umbra',
  rotas,
  currentUser,
  isAdmin,
  onSaveRota,
  onDeleteRota
}) => {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState(ROTA_PRESETS[0]);
  const [scheduledTime, setScheduledTime] = useState('Starting in 15 mins');
  const [maxSpots, setMaxSpots] = useState(6);
  const [notes, setNotes] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const host = currentUser?.displayName || 'Squad Host';
    const newRota: BossRotaListing = {
      id: `rota_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      leagueId,
      title: title.trim(),
      bossType: title.trim(),
      hostDisplayName: host,
      hostCharacterName: currentUser?.characterName || host,
      scheduledTime: scheduledTime.trim() || 'Right Now',
      maxSpots: Math.max(2, Math.min(6, maxSpots)),
      participants: [host],
      notes: notes.trim() || undefined,
      status: 'OPEN',
      createdAtIso: new Date().toISOString()
    };
    onSaveRota(newRota);
    setNotes('');
    setShowForm(false);
  };

  const handleToggleSpot = (rota: BossRotaListing) => {
    const me = currentUser?.displayName;
    if (!me) return;
    const alreadyIn = rota.participants.some((p) => p.toLowerCase() === me.toLowerCase());
    let nextParticipants: string[];
    if (alreadyIn) {
      nextParticipants = rota.participants.filter((p) => p.toLowerCase() !== me.toLowerCase());
    } else {
      if (rota.participants.length >= rota.maxSpots) return;
      nextParticipants = [...rota.participants, me];
    }
    const nextStatus: BossRotaListing['status'] = nextParticipants.length >= rota.maxSpots ? 'FULL' : 'OPEN';
    onSaveRota({ ...rota, participants: nextParticipants, status: nextStatus });
  };

  return (
    <div className="bg-[#0d1016] border border-indigo-500/25 rounded-2xl p-5 shadow-lg space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400" />
            Squad Boss & 4 Voidstone Rotation Scheduler (Party Up Now)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Running Maven, The Feared, T17s, or 5 Ways? Post a portal call so 4 to 6 squadmates can reserve a spot.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          {showForm ? 'Close Form' : 'Host Boss Rota'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-[#090c11] border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {ROTA_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setTitle(preset)}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors ${
                  title === preset
                    ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-200'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Rotation Title"
              required
              className="sm:col-span-2 bg-[#0d1016] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
            />
            <input
              type="text"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              placeholder="When? (e.g. In 15 mins / 9pm EST)"
              className="bg-[#0d1016] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <select
              value={maxSpots}
              onChange={(e) => setMaxSpots(Number(e.target.value))}
              className="bg-[#0d1016] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200"
            >
              <option value={2}>2 Portals Max</option>
              <option value={3}>3 Portals Max</option>
              <option value={4}>4 Portals Max</option>
              <option value={5}>5 Portals Max</option>
              <option value={6}>6 Portals Max (Full Party)</option>
            </select>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Requirements or loot rules (optional)"
              className="sm:col-span-2 bg-[#0d1016] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              Publish Rotation Banner
            </button>
          </div>
        </form>
      )}

      {rotas.length === 0 ? (
        <div className="bg-[#090c11] border border-slate-800/70 rounded-xl p-6 text-center text-xs text-slate-400">
          No active boss rotations scheduled right now. Click <span className="text-indigo-300 font-bold">Host Boss Rota</span> when you are ready to share portals.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {rotas.map((rota) => {
            const spotsLeft = Math.max(0, rota.maxSpots - rota.participants.length);
            const me = currentUser?.displayName?.toLowerCase();
            const isJoined = !!me && rota.participants.some((p) => p.toLowerCase() === me);
            const canDelete = isAdmin || (!!me && rota.hostDisplayName.toLowerCase() === me);

            return (
              <div
                key={rota.id}
                className="bg-[#090c11] border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between gap-3"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-black text-white">{rota.title}</h4>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                        <span className="inline-flex items-center gap-1 text-amber-300 font-bold">
                          <Clock className="w-3 h-3" />
                          {rota.scheduledTime}
                        </span>
                        <span>
                          Host:{' '}
                          <a
                            href={`/exile/${encodeURIComponent(rota.hostDisplayName)}`}
                            className="text-indigo-300 font-bold hover:underline"
                          >
                            @{rota.hostDisplayName}
                          </a>
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                        spotsLeft === 0
                          ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                          : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                      }`}
                    >
                      {rota.participants.length}/{rota.maxSpots} Portals
                    </span>
                  </div>

                  {rota.notes && <p className="text-xs text-slate-400">{rota.notes}</p>}

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <Users className="w-3.5 h-3.5 text-slate-500 mr-0.5" />
                    {rota.participants.map((p) => (
                      <a
                        key={p}
                        href={`/exile/${encodeURIComponent(p)}`}
                        className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-200 hover:border-amber-500/40 hover:text-amber-300"
                      >
                        @{p}
                      </a>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/70">
                  {currentUser ? (
                    <button
                      type="button"
                      onClick={() => handleToggleSpot(rota)}
                      disabled={!isJoined && spotsLeft === 0}
                      className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-colors ${
                        isJoined
                          ? 'bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-700'
                          : 'bg-emerald-600/20 hover:bg-emerald-600/35 text-emerald-300 border border-emerald-500/40 disabled:opacity-40'
                      }`}
                    >
                      {isJoined ? <UserMinus className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                      {isJoined ? 'Leave Spot' : spotsLeft === 0 ? 'Party Full' : `Claim Spot (${spotsLeft} open)`}
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-500">Sign in to claim a portal spot</span>
                  )}

                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => onDeleteRota(rota.id)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-400"
                      title="Delete rotation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
