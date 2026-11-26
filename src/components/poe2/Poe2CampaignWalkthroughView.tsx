import React, { useState, useEffect } from 'react';
import { Compass, CheckCircle2, Circle, Sparkles, Cloud, RotateCcw } from 'lucide-react';
import { POE2_CAMPAIGN_ACTS } from '../../data/poe2CampaignData';
import { fireConfetti } from '../../utils/confetti';
import type { UserAccount } from '../../types';
import { fetchUserToolState, saveUserToolState } from '../../services/cloudSync';

export const Poe2CampaignWalkthroughView: React.FC<{ userAccount?: UserAccount | null }> = ({
  userAccount
}) => {
  const [selectedAct, setSelectedAct] = useState<number>(1);
  const [cloudSynced, setCloudSynced] = useState<boolean>(false);
  const [completed, setCompleted] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('exile_ssf_poe2_campaign_v1');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    if (!userAccount?.displayName) return;
    let cancelled = false;
    fetchUserToolState<Record<string, boolean>>(
      userAccount.displayName,
      'campaign_progress_poe2'
    ).then((data) => {
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
      localStorage.setItem('exile_ssf_poe2_campaign_v1', JSON.stringify(next));
    } catch {}
    if (userAccount?.displayName) {
      saveUserToolState(userAccount.displayName, 'campaign_progress_poe2', next).then((ok) => {
        if (ok) setCloudSynced(true);
      });
    }
  };

  const currentAct = POE2_CAMPAIGN_ACTS.find((a) => a.actNumber === selectedAct) || POE2_CAMPAIGN_ACTS[0];
  const totalSteps = POE2_CAMPAIGN_ACTS.reduce((acc, a) => acc + a.steps.length, 0);
  const doneSteps = POE2_CAMPAIGN_ACTS.reduce(
    (acc, a) => acc + a.steps.filter((s) => completed[s.id]).length,
    0
  );
  const overallPct = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;

  const toggleStep = (stepId: string) => {
    const nextVal = !completed[stepId];
    const next = { ...completed, [stepId]: nextVal };
    persist(next);
    if (nextVal && currentAct.steps.every((s) => next[s.id])) {
      fireConfetti();
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-16 font-sans text-slate-200">
      {/* Header */}
      <div className="p-5 sm:p-6 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-[#0e1320] via-cyan-950/30 to-[#0e1320] shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-widest text-cyan-400">
            <Compass className="w-4 h-4" />
            <span>Path of Exile 2 Campaign &amp; Permanent Bonuses</span>
            {cloudSynced && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-[10px] font-mono text-emerald-300 normal-case">
                <Cloud className="w-3 h-3" />
                <span>Cloud Synced</span>
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-cinzel font-bold text-slate-100">
            Acts 1–3 Walkthrough (Normal &amp; Cruel)
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            Never miss a permanent <strong>+Spirit boss</strong>, <strong>+10% Resistance boss</strong>, <strong>+2 Weapon Set Skill Book</strong>, Venom Draught, or Salvage/Reforging Bench unlock.
          </p>
        </div>

        <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400">Campaign Progress:</span>
            <span className="font-bold text-emerald-300">
              {doneSteps}/{totalSteps} ({overallPct}%)
            </span>
          </div>
          <div className="w-48 h-2 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${overallPct}%` }}
            />
          </div>
          {doneSteps > 0 && (
            <button
              type="button"
              onClick={() => persist({})}
              className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Progress</span>
            </button>
          )}
        </div>
      </div>

      {/* Act Selector Pills */}
      <div className="flex flex-wrap gap-2">
        {POE2_CAMPAIGN_ACTS.map((act) => {
          const actDone = act.steps.filter((s) => completed[s.id]).length;
          const allDone = actDone === act.steps.length;
          const active = act.actNumber === selectedAct;
          return (
            <button
              key={act.actNumber}
              type="button"
              onClick={() => setSelectedAct(act.actNumber)}
              className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
                active
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                  : allDone
                  ? 'bg-emerald-950/35 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>{act.label}</span>
              <span className="text-[10px] font-mono opacity-80">
                {actDone}/{act.steps.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Act Checklist */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
        <div className="space-y-1 border-b border-slate-800 pb-3">
          <h2 className="text-lg font-bold text-white">{currentAct.label}</h2>
          <p className="text-xs sm:text-sm text-slate-400">{currentAct.summary}</p>
        </div>

        <div className="space-y-2.5">
          {currentAct.steps.map((step) => {
            const isDone = Boolean(completed[step.id]);
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => toggleStep(step.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                  isDone
                    ? 'bg-emerald-950/25 border-emerald-500/40'
                    : 'bg-slate-950/75 border-slate-800 hover:border-cyan-500/45'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-cyan-300">{step.zone}</span>
                    <span className="text-slate-600">•</span>
                    <span className={`text-sm font-bold ${isDone ? 'line-through text-slate-400' : 'text-white'}`}>
                      {step.bossOrObjective}
                    </span>
                  </div>
                  {step.permanentBonus && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/35 text-[11px] font-mono font-bold text-amber-300">
                      <Sparkles className="w-3 h-3 shrink-0" />
                      <span>{step.permanentBonus}</span>
                    </div>
                  )}
                  <p className="text-xs text-slate-400 leading-relaxed">{step.tip}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
