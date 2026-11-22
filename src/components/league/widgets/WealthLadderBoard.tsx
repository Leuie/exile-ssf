import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Coins,
  Compass,
  Crown,
  Flame,
  Lock,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Trophy,
  Zap
} from 'lucide-react';
import type { LeagueRosterMember, UserAccount } from '../../../types';
import { formatValue } from '../../assets/assetEngine';

interface WealthLadderCheckpoint {
  at: string;
  totalItems: number;
  totalChaos: number;
}

interface WealthLadderEntry {
  handle: string;
  leagueName: string;
  totalChaos: number;
  divineChaos: number;
  totalDivines: number;
  chaosPerHour: number;
  divPerHour: number;
  sTierCount: number;
  aTierCount: number;
  totalStacks: number;
  topTabName: string;
  topTabChaos: number;
  topItemName: string;
  topItemIcon: string;
  topItemChaos: number;
  checkpoints: WealthLadderCheckpoint[];
  mapsLogged: number;
  avgMapSeconds: number;
  bestXpPerHour: number;
  updatedAtIso: string;
}

interface WealthLadderBoardProps {
  leagueId: string;
  leagueName: string;
  roster: LeagueRosterMember[];
  currentUser: UserAccount | null;
  onOpenProfile?: (handle: string) => void;
}

type LadderSortKey = 'wealth' | 'pace' | 'maps' | 'jackpots' | 'xp';

function formatAvgDuration(sec: number): string {
  if (!sec || sec <= 0) return 'N/A';
  const m = Math.floor(sec / 60);
  const rem = sec % 60;
  return m > 0 ? `${m}m ${rem}s` : `${rem}s`;
}

function formatXpHr(xp: number): string {
  if (!xp || xp <= 0) return 'N/A';
  if (xp >= 1_000_000_000) return `${(xp / 1_000_000_000).toFixed(2)}B/hr`;
  if (xp >= 1_000_000) return `${(xp / 1_000_000).toFixed(1)}M/hr`;
  return `${Math.round(xp / 1000)}k/hr`;
}

const MiniSparkline: React.FC<{ checkpoints: WealthLadderCheckpoint[]; color?: string }> = ({
  checkpoints,
  color = '#f59e0b'
}) => {
  const pts =
    checkpoints.length >= 2
      ? checkpoints
      : checkpoints.length === 1
      ? [{ at: 'Start', totalItems: 0, totalChaos: 0 }, checkpoints[0]]
      : [
          { at: 'Start', totalItems: 0, totalChaos: 0 },
          { at: 'Now', totalItems: 0, totalChaos: 0 }
        ];
  const maxVal = Math.max(10, ...pts.map((p) => p.totalChaos));
  const w = 96;
  const h = 28;
  const coords = pts.map((p, idx) => {
    const x = pts.length === 1 ? w : (idx / (pts.length - 1)) * (w - 6) + 3;
    const y = h - 4 - (p.totalChaos / maxVal) * (h - 8);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-24 h-7 overflow-visible">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={coords.join(' ')}
      />
    </svg>
  );
};

export const WealthLadderBoard: React.FC<WealthLadderBoardProps> = ({
  leagueId,
  leagueName,
  roster,
  currentUser,
  onOpenProfile
}) => {
  const [entries, setEntries] = useState<WealthLadderEntry[]>([]);
  const [squadTotals, setSquadTotals] = useState({ totalDivines: 0, totalMaps: 0, totalSTier: 0, count: 0 });
  const [loading, setLoading] = useState<boolean>(true);
  const [sortKey, setSortKey] = useState<LadderSortKey>('wealth');
  const [togglingOptIn, setTogglingOptIn] = useState<boolean>(false);
  const [notice, setNotice] = useState<string | null>(null);

  const myHandleLower = (currentUser?.displayName || '').trim().replace(/^@/, '').toLowerCase();

  const loadLadder = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/farming/wealth-ladder?leagueId=${encodeURIComponent(leagueId)}&league=${encodeURIComponent(leagueName)}`
      );
      if (res.ok) {
        const data: any = await res.json();
        setEntries(Array.isArray(data?.entries) ? data.entries : []);
        if (data?.squadTotals) setSquadTotals(data.squadTotals);
      }
    } catch {
      // Keep current list on transient error
    } finally {
      setLoading(false);
    }
  }, [leagueId, leagueName]);

  useEffect(() => {
    loadLadder();
  }, [loadLadder]);

  const isMeOptedIn = useMemo(
    () => Boolean(myHandleLower && entries.some((e) => e.handle.toLowerCase() === myHandleLower)),
    [entries, myHandleLower]
  );

  const handleToggleOptIn = async () => {
    if (!currentUser) return;
    setTogglingOptIn(true);
    setNotice(null);
    const nextVal = !isMeOptedIn;
    try {
      const res = await fetch('/api/farming/wealth-ladder/opt-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ optIn: nextVal })
      });
      if (res.ok) {
        setNotice(
          nextVal
            ? 'Opted in! Sync and Save Cloud in Asset Tracker to publish your latest league numbers.'
            : 'Opted out. Your stash telemetry has been removed from the public Wealth Ladder.'
        );
        await loadLadder();
      } else {
        setNotice('Sign in with your Exile SSF account to update your Wealth Ladder opt in status.');
      }
    } catch {
      setNotice('Could not reach cloud server. Please try again.');
    } finally {
      setTogglingOptIn(false);
    }
  };

  const resolveDisplayHandle = (handleLower: string): { display: string; ascendancy?: string; level?: number } => {
    const match = roster.find(
      (m) =>
        m.displayName.trim().toLowerCase() === handleLower ||
        (m.poeAccountName || '').trim().toLowerCase() === handleLower
    );
    return {
      display: match?.displayName || handleLower,
      ascendancy: match?.ascendancy,
      level: match?.level
    };
  };

  const sortedEntries = useMemo(() => {
    const copy = [...entries];
    copy.sort((a, b) => {
      if (sortKey === 'pace') return b.chaosPerHour - a.chaosPerHour;
      if (sortKey === 'maps') return b.mapsLogged - a.mapsLogged;
      if (sortKey === 'jackpots') return b.sTierCount - a.sTierCount || b.aTierCount - a.aTierCount;
      if (sortKey === 'xp') return b.bestXpPerHour - a.bestXpPerHour;
      return b.totalChaos - a.totalChaos;
    });
    return copy;
  }, [entries, sortKey]);

  const maxChaos = Math.max(1, ...sortedEntries.map((e) => e.totalChaos));
  const topThree = sortedEntries.slice(0, 3);

  const podiumStyles = [
    {
      border: 'border-amber-400/60',
      bg: 'from-amber-500/20 via-[#121623] to-[#0d1018]',
      badge: 'bg-amber-400 text-slate-950',
      label: '#1 Gold',
      sparkColor: '#fbbf24'
    },
    {
      border: 'border-slate-400/50',
      bg: 'from-slate-400/15 via-[#121623] to-[#0d1018]',
      badge: 'bg-slate-300 text-slate-950',
      label: '#2 Silver',
      sparkColor: '#cbd5e1'
    },
    {
      border: 'border-orange-500/50',
      bg: 'from-orange-500/15 via-[#121623] to-[#0d1018]',
      badge: 'bg-orange-400 text-slate-950',
      label: '#3 Bronze',
      sparkColor: '#fb923c'
    }
  ];

  return (
    <section className="rounded-2xl border border-amber-500/30 bg-[#0c1018] p-5 space-y-5 shadow-xl">
      {/* Header & Opt In Control */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg sm:text-xl font-black font-cinzel text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>Opt In Wealth &amp; Pace Ladder</span>
            </h2>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>100% Opt In • Asset + Map Tracker</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Live league leaderboard aggregating opted in stash valuation from <strong className="text-slate-200">Asset Tracker</strong> and mapping speed &amp; XP/hr telemetry from <strong className="text-slate-200">Map Tracker</strong>. Raw stash items and <code className="text-amber-300">POESESSID</code> are never shared.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {currentUser && (
            <button
              type="button"
              disabled={togglingOptIn}
              onClick={handleToggleOptIn}
              className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50 ${
                isMeOptedIn
                  ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-200 hover:bg-rose-500/15 hover:border-rose-400/50 hover:text-rose-200'
                  : 'bg-amber-500 hover:bg-amber-400 border-amber-300 text-slate-950 shadow'
              }`}
            >
              {isMeOptedIn ? <ShieldCheck className="w-3.5 h-3.5" /> : <Trophy className="w-3.5 h-3.5" />}
              <span>{togglingOptIn ? 'Updating...' : isMeOptedIn ? 'Opted In (Click to Leave)' : 'Opt In to Wealth Ladder'}</span>
            </button>
          )}
          <button
            type="button"
            disabled={loading}
            onClick={loadLadder}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className="px-3.5 py-2.5 rounded-xl bg-indigo-500/15 border border-indigo-400/40 text-xs text-indigo-200">
          {notice}
        </div>
      )}

      {/* Squad Aggregate Economy Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-0.5">
          <div className="text-[10px] font-mono uppercase text-amber-400 flex items-center gap-1">
            <Coins className="w-3 h-3" />
            <span>Combined Squad Wealth</span>
          </div>
          <div className="text-xl font-black font-mono text-white">{squadTotals.totalDivines.toLocaleString()}d</div>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-0.5">
          <div className="text-[10px] font-mono uppercase text-sky-400 flex items-center gap-1">
            <Compass className="w-3 h-3" />
            <span>Total Maps Logged</span>
          </div>
          <div className="text-xl font-black font-mono text-white">{squadTotals.totalMaps.toLocaleString()}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-0.5">
          <div className="text-[10px] font-mono uppercase text-purple-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>S Tier Jackpots</span>
          </div>
          <div className="text-xl font-black font-mono text-white">{squadTotals.totalSTier.toLocaleString()}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-0.5">
          <div className="text-[10px] font-mono uppercase text-emerald-400 flex items-center gap-1">
            <Crown className="w-3 h-3" />
            <span>Opted In Exiles</span>
          </div>
          <div className="text-xl font-black font-mono text-white">{squadTotals.count}</div>
        </div>
      </div>

      {loading && entries.length === 0 ? (
        <div className="py-12 text-center text-xs font-mono text-slate-400">
          Loading opted in league wealth telemetry...
        </div>
      ) : entries.length === 0 ? (
        <div className="py-10 px-6 rounded-2xl border border-dashed border-slate-800 bg-slate-950/50 text-center space-y-2.5">
          <Lock className="w-7 h-7 text-amber-400/70 mx-auto" />
          <div className="text-sm font-bold text-white">No Exiles Have Opted In Yet for This League</div>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Participation is strictly opt in. Click <strong className="text-amber-300">Join Wealth Ladder</strong> in Asset Tracker (or <strong className="text-amber-300">Opt In to Wealth Ladder</strong> above) and save your stash to Cloudflare D1 to claim the #1 Gold Podium spot!
          </p>
        </div>
      ) : (
        <>
          {/* Top 3 Gold / Silver / Bronze Podium */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topThree.map((entry, idx) => {
              const st = podiumStyles[idx] || podiumStyles[2];
              const info = resolveDisplayHandle(entry.handle);
              return (
                <div
                  key={entry.handle}
                  className={`rounded-2xl border ${st.border} bg-gradient-to-br ${st.bg} p-4 space-y-3 shadow-lg`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-black uppercase ${st.badge}`}>
                      {st.label}
                    </span>
                    <MiniSparkline checkpoints={entry.checkpoints} color={st.sparkColor} />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => onOpenProfile?.(info.display)}
                        className="text-base font-black text-white hover:text-amber-300 hover:underline truncate cursor-pointer"
                      >
                        @{info.display}
                      </button>
                      {info.ascendancy && (
                        <div className="text-[11px] font-mono text-slate-400">
                          {info.ascendancy} {info.level ? `• Lvl ${info.level}` : ''}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xl font-black font-mono text-amber-300">
                        {formatValue(entry.totalChaos, entry.divineChaos)}
                      </div>
                      <div className="text-[10px] font-mono text-emerald-300">
                        {entry.divPerHour}d/hr pace
                      </div>
                    </div>
                  </div>

                  {entry.topItemName && (
                    <div className="p-2 rounded-xl bg-slate-950/75 border border-slate-800/90 flex items-center gap-2.5">
                      {entry.topItemIcon ? (
                        <img src={entry.topItemIcon} alt="" className="w-7 h-7 object-contain shrink-0" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-mono uppercase text-slate-500">Headline Drop</div>
                        <div className="text-xs font-bold text-slate-100 truncate">{entry.topItemName}</div>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-amber-300 shrink-0">
                        {formatValue(entry.topItemChaos, entry.divineChaos)}
                      </span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800/70">
                    <span>Top Tab: <strong className="text-slate-200">{entry.topTabName || 'Stash'}</strong></span>
                    <span>{entry.mapsLogged} maps • {entry.sTierCount} S Tier</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sort Controls & Full Leaderboard Table */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                <span>Full Opted In Standings ({sortedEntries.length})</span>
              </div>
              <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-bold">
                {(
                  [
                    { id: 'wealth', label: 'Net Worth', icon: Coins },
                    { id: 'pace', label: 'Div/hr Pace', icon: Flame },
                    { id: 'maps', label: 'Maps Logged', icon: Compass },
                    { id: 'jackpots', label: 'S Tier Drops', icon: Sparkles },
                    { id: 'xp', label: 'Best XP/hr', icon: Zap }
                  ] as const
                ).map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSortKey(opt.id)}
                      className={`px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors ${
                        sortKey === opt.id
                          ? 'bg-amber-500/20 text-amber-200 border border-amber-400/50'
                          : 'text-slate-400 hover:text-white border border-transparent'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] font-mono uppercase text-slate-400 bg-slate-900/70">
                    <th className="py-2.5 px-3">Rank</th>
                    <th className="py-2.5 px-3">Exile</th>
                    <th className="py-2.5 px-3">Net Worth</th>
                    <th className="py-2.5 px-3">Trend</th>
                    <th className="py-2.5 px-3 text-right">Pace</th>
                    <th className="py-2.5 px-3 text-right">Maps / Avg</th>
                    <th className="py-2.5 px-3 text-right">Best XP/hr</th>
                    <th className="py-2.5 px-3 text-right">S / A Drops</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {sortedEntries.map((entry, idx) => {
                    const info = resolveDisplayHandle(entry.handle);
                    const pct = Math.max(4, Math.round((entry.totalChaos / maxChaos) * 100));
                    return (
                      <tr key={entry.handle} className="hover:bg-slate-900/50">
                        <td className="py-2.5 px-3 font-mono font-black text-amber-300">#{idx + 1}</td>
                        <td className="py-2.5 px-3">
                          <button
                            type="button"
                            onClick={() => onOpenProfile?.(info.display)}
                            className="font-bold text-white hover:text-amber-300 hover:underline cursor-pointer"
                          >
                            @{info.display}
                          </button>
                          {entry.topTabName && (
                            <div className="text-[10px] font-mono text-slate-500">Top Tab: {entry.topTabName}</div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 min-w-[160px]">
                          <div className="font-mono font-black text-amber-300">
                            {formatValue(entry.totalChaos, entry.divineChaos)}
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-900 mt-1 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-400"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <MiniSparkline checkpoints={entry.checkpoints} />
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-300 font-bold">
                          {entry.divPerHour}d/hr
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                          {entry.mapsLogged} <span className="text-slate-500">({formatAvgDuration(entry.avgMapSeconds)})</span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-sky-300">
                          {formatXpHr(entry.bestXpPerHour)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-purple-300">
                          {entry.sTierCount} S <span className="text-slate-600">/</span> {entry.aTierCount} A
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );
};
