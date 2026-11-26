import React, { useState, useEffect } from 'react';
import {
  Crown,
  Cloud,
  CheckCircle2,
  Circle,
  ShieldAlert,
  Flame,
  Sparkles,
  RotateCcw,
  ExternalLink
} from 'lucide-react';
import type { UserAccount } from '../../types';
import { fetchUserToolState, saveUserToolState } from '../../services/cloudSync';

interface AscendancyTier {
  id: string;
  points: string;
  title: string;
  sekhemasReq: string;
  chaosReq: string;
  ssfTip: string;
}

const POE2_ASCENDANCY_TIERS: AscendancyTier[] = [
  {
    id: 'asc-1',
    points: 'Points 1–2',
    title: '1st Ascendancy (Act 2)',
    sekhemasReq: '1-Floor Trial of the Sekhemas (Balbala\'s Barya, Area Lv 22)',
    chaosReq: 'N/A (Sekhemas is earliest)',
    ssfTip: 'Easiest in Act 2 right after Traitor\'s Passage. Stack Honour Resistance relics as soon as they drop.'
  },
  {
    id: 'asc-2',
    points: 'Points 3–4',
    title: '2nd Ascendancy (Act 3)',
    sekhemasReq: '2-Floor Djinn Barya (iLvl 45+)',
    chaosReq: '4-Room Trial of Chaos (Chimeral Inscribed Ultimatum, Area Lv 38)',
    ssfTip: 'The Act 3 4-room Trial of Chaos is fast and does not use Honour—great for melee/close-range builds.'
  },
  {
    id: 'asc-3',
    points: 'Points 5–6',
    title: '3rd Ascendancy (Early Endgame)',
    sekhemasReq: '3-Floor Djinn Barya (iLvl 60+)',
    chaosReq: '7-Room Inscribed Ultimatum (iLvl 60+)',
    ssfTip: 'With 75% Honour Resistance + Maximum Honour relics, 3-Floor Sekhemas is very consistent in SSF.'
  },
  {
    id: 'asc-4',
    points: 'Points 7–8',
    title: '4th Ascendancy (Endgame Pinnacle)',
    sekhemasReq: '4-Floor Djinn Barya (iLvl 75+ — Zarokh, the Temporal)',
    chaosReq: '10-Room Inscribed Ultimatum (iLvl 75+) + Trialmaster (3 Fate Fragments)',
    ssfTip: 'Cap 75% Honour Resistance + Movement Speed relics for Zarokh\'s hourglass phase, or farm 3 Fate fragments for Trialmaster.'
  }
];

export const Poe2TrialsGuideView: React.FC<{ userAccount?: UserAccount | null }> = ({ userAccount }) => {
  const [activeTab, setActiveTab] = useState<'roadmap' | 'sekhemas' | 'chaos'>('roadmap');
  const [cloudSynced, setCloudSynced] = useState<boolean>(false);
  const [completed, setCompleted] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('exile_ssf_poe2_trials_v1');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    if (!userAccount?.displayName) return;
    let cancelled = false;
    fetchUserToolState<Record<string, boolean>>(userAccount.displayName, 'trials_progress_poe2').then((data) => {
      if (!cancelled && data && typeof data === 'object') {
        setCompleted(data);
        setCloudSynced(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [userAccount?.displayName]);

  const persist = (next: Record<string, boolean>) => {
    setCompleted(next);
    try {
      localStorage.setItem('exile_ssf_poe2_trials_v1', JSON.stringify(next));
    } catch {}
    if (userAccount?.displayName) {
      saveUserToolState(userAccount.displayName, 'trials_progress_poe2', next).then((ok) => {
        if (ok) setCloudSynced(true);
      });
    }
  };

  const earnedPoints = POE2_ASCENDANCY_TIERS.filter((t) => completed[t.id]).length * 2;

  return (
    <div className="space-y-6 pb-16 max-w-6xl mx-auto">
      {/* Header */}
      <div className="p-5 sm:p-6 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-[#13101d] via-amber-950/25 to-[#0e1320] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-widest text-amber-400">
            <Crown className="w-4 h-4" />
            <span>PoE 2 Ascendancy Progression</span>
            {cloudSynced && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-[10px] font-mono text-emerald-300 normal-case">
                <Cloud className="w-3 h-3" />
                <span>Cloud Synced</span>
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-cinzel font-bold text-slate-100">
            Trials of Ascendancy
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            Unlock all 8 Ascendancy Passive Points via <strong>Trial of the Sekhemas</strong> (Sanctum) or <strong>Trial of Chaos</strong> (Ultimatum).
          </p>
        </div>

        <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
          <div className="px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 font-mono text-sm font-black">
            Ascendancy Points: {earnedPoints} / 8
          </div>
          {earnedPoints > 0 && (
            <button
              type="button"
              onClick={() => persist({})}
              className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Tracker</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
        {[
          { id: 'roadmap' as const, label: '8-Point Tracker & Requirements' },
          { id: 'sekhemas' as const, label: 'Trial of the Sekhemas (Honour & Relics)' },
          { id: 'chaos' as const, label: 'Trial of Chaos (Ultimatum & Trialmaster)' }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'bg-amber-500/20 border border-amber-400/50 text-amber-200'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'roadmap' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {POE2_ASCENDANCY_TIERS.map((tier) => {
            const done = Boolean(completed[tier.id]);
            return (
              <button
                key={tier.id}
                type="button"
                onClick={() => persist({ ...completed, [tier.id]: !done })}
                className={`text-left p-5 rounded-2xl border transition-all space-y-3 cursor-pointer ${
                  done
                    ? 'bg-emerald-950/30 border-emerald-500/45'
                    : 'bg-slate-900/75 border-slate-800 hover:border-amber-500/45'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    {done ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-600 shrink-0" />
                    )}
                    <div>
                      <div className="text-sm font-bold text-white">{tier.title}</div>
                      <div className="text-[11px] font-mono text-amber-300">{tier.points}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="p-2 rounded-lg bg-slate-950/75 border border-slate-800">
                    <span className="text-cyan-300 font-bold">Sekhemas:</span>{' '}
                    <span className="text-slate-300">{tier.sekhemasReq}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950/75 border border-slate-800">
                    <span className="text-rose-300 font-bold">Chaos:</span>{' '}
                    <span className="text-slate-300">{tier.chaosReq}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">{tier.ssfTip}</p>
              </button>
            );
          })}
        </div>
      )}

      {activeTab === 'sekhemas' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl border border-cyan-500/30 bg-slate-900/75 space-y-3">
            <h2 className="text-base font-bold text-cyan-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>Honour Resistance &amp; Relic Priorities</span>
            </h2>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-300 list-disc pl-5">
              <li><strong>Cap 75% Honour Resistance first</strong> using Relics—this cuts all Honour damage taken by 4× and makes 3rd &amp; 4th Ascendancy dramatically safer.</li>
              <li><strong>Maximum Honour &amp; Merchant Choices</strong>: Stack +% Maximum Honour (scales off your Life + ES pool) and "+Merchant Choices" to fish for Hare Foot (+40% Movement Speed) and +50% Damage Boons.</li>
              <li><strong>Zarokh Hourglass Phase (Floor 4)</strong>: Movement Speed + Blink/Leap makes collecting the spinning hourglasses effortless—never take a "-Movement Speed" or "No Evasion/ES" Affliction.</li>
            </ul>
          </div>

          <div className="p-5 rounded-2xl border border-rose-500/30 bg-slate-900/75 space-y-3">
            <h2 className="text-base font-bold text-rose-300 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              <span>Run-Ending Afflictions to Avoid</span>
            </h2>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-300 list-disc pl-5">
              <li><strong>You have no Energy Shield / Armour / Evasion</strong> (bricking your primary defense layer).</li>
              <li><strong>Monsters deal 30%+ more damage / 25% reduced Movement Speed</strong> (deadly on Floor 4 traps and Zarokh).</li>
              <li><strong>Randomly routed to an adjacent room</strong> (can force you into an unavoidable Gauntlet or bricking Affliction).</li>
            </ul>
            <a
              href="https://www.poe2wiki.net/wiki/Trial_of_the_Sekhemas"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-300 hover:underline pt-1"
            >
              <span>Full Sekhemas Wiki Reference</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}

      {activeTab === 'chaos' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl border border-amber-500/30 bg-slate-900/75 space-y-3">
            <h2 className="text-base font-bold text-amber-300 flex items-center gap-2">
              <Flame className="w-4 h-4" />
              <span>Safest SSF Ultimatum Modifiers</span>
            </h2>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-300 list-disc pl-5">
              <li><strong>Stalking Shade</strong> (at Tier 1—just keep moving so it never stacks to 7).</li>
              <li><strong>Lightning Storm / Blood Globules / Pyramids</strong> (easy to outrun with Dodge Roll).</li>
              <li><strong>Monster Resistance / Life</strong> (slows clear slightly without one-shot risk).</li>
            </ul>
          </div>

          <div className="p-5 rounded-2xl border border-rose-500/30 bg-slate-900/75 space-y-3">
            <h2 className="text-base font-bold text-rose-300 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              <span>Deadliest Modifiers &amp; Trialmaster Unlock</span>
            </h2>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-300 list-disc pl-5">
              <li><strong>Avoid:</strong> Impending Doom rings, Petrifying Statues, Escalating Damage Taken, and Reduced Recovery Rate.</li>
              <li><strong>Trialmaster (4th Ascendancy):</strong> Completing 10-room Ultimatums drops Cowardly, Deadly, and Victorious Fate fragments—place all 3 in the Chaos altar to challenge the Trialmaster.</li>
            </ul>
            <a
              href="https://www.poe2wiki.net/wiki/Trial_of_Chaos"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-amber-300 hover:underline pt-1"
            >
              <span>Full Trial of Chaos Wiki Reference</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
