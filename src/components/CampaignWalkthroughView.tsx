import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  ShieldAlert, 
  Key, 
  Check
} from 'lucide-react';
import { CAMPAIGN_ACTS } from '../data/campaignWalkthrough';
import { fireConfetti } from '../utils/confetti';

export const CampaignWalkthroughView: React.FC = () => {
  const [selectedAct, setSelectedAct] = useState<number>(1);
  const [completedZones, setCompletedZones] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('poe_ssf_completed_zones');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('poe_ssf_completed_zones', JSON.stringify(completedZones));
    } catch {
      // storage error fallback
    }
  }, [completedZones]);

  const currentActData = CAMPAIGN_ACTS.find((a) => a.actNumber === selectedAct) || CAMPAIGN_ACTS[0];

  const toggleZone = (zoneKey: string) => {
    const nextState = !completedZones[zoneKey];
    setCompletedZones((prev) => ({
      ...prev,
      [zoneKey]: nextState
    }));

    if (nextState) {
      fireConfetti();
    }
  };

  const actZones = currentActData.zones;
  const completedInAct = actZones.filter((z) => completedZones[`act${selectedAct}_${z.zoneName}`]).length;
  const totalInAct = actZones.length;
  const actProgressPercent = Math.round((completedInAct / totalInAct) * 100);

  return (
    <div className="space-y-8 w-full space-y-6 pb-20 font-sans text-slate-200">
      
      {/* Header */}
      <div className="p-5 sm:p-6 rounded-2xl border border-slate-800 bg-slate-900/85 backdrop-blur-md space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-cyan-600 dark:text-cyan-400">
          <Compass className="w-4 h-4" />
          The Foolproof Campaign Guide
        </div>
        <h1 className="text-3xl font-poe font-bold text-slate-900 dark:text-slate-100">
          Act 1 to 10 Walkthrough
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
          Engineered so players have an easier time completing the campaign. Zone navigation tips, Book of Skill quest markers, Lab trial alerts, and Kitava resistance drop safeguards.
        </p>
      </div>

      {/* Act Selection Tabs with Vibrant Color Coding */}
      <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-2">
        {CAMPAIGN_ACTS.map((act) => {
          const isSelected = selectedAct === act.actNumber;
          const actDone = act.zones.every((z) => completedZones[`act${act.actNumber}_${z.zoneName}`]);

          return (
            <button
              key={act.actNumber}
              onClick={() => setSelectedAct(act.actNumber)}
              className={`p-3 rounded-2xl border flex flex-col items-center justify-center transition-all duration-200 ${
                isSelected
                  ? `border-amber-500 bg-amber-500/20 shadow-md scale-105 font-bold`
                  : actDone
                  ? 'border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300'
                  : 'border-slate-800 bg-slate-900/80/60 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/60 shadow-sm'
              }`}
            >
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-sans">Act</span>
              <span className="text-lg font-poe font-black text-slate-900 dark:text-slate-100">{act.actNumber}</span>
              {actDone && (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mt-1" />
              )}
            </button>
          );
        })}
      </div>

      {/* Current Act Spotlight Card */}
      <div className={`rounded-2xl border p-6 sm:p-8 bg-white dark:bg-gradient-to-br ${currentActData.bgGradient} border-slate-800 shadow-xl space-y-6`}>
        
        {/* Act Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest font-bold text-amber-600 dark:text-amber-400">
                Act {currentActData.actNumber} • {currentActData.levelRange}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">({completedInAct}/{totalInAct} Zones Checked)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-poe font-bold text-slate-900 dark:text-slate-100">
              {currentActData.title}
            </h2>
          </div>

          {/* Act Progress Bar */}
          <div className="sm:w-48 space-y-1">
            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300 font-semibold">
              <span>Act Progress</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">{actProgressPercent}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-[#0f172a]/80 rounded-full h-2 overflow-hidden border border-slate-300 dark:border-[#3f3f5f]">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-300"
                style={{ width: `${actProgressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Resistance Check & Key Unlocks Banner */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {currentActData.resistCheck && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-500/40 flex items-start gap-3 shadow-sm">
              <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider">Resistance & Danger Check:</div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {currentActData.resistCheck}
                </p>
              </div>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-300 dark:border-sky-500/40 flex items-start gap-3 shadow-sm">
            <Key className="w-5 h-5 text-sky-600 dark:text-sky-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-xs font-bold text-sky-800 dark:text-sky-400 uppercase tracking-wider">Crucial Unlocks & Milestones:</div>
              <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1 list-disc list-inside">
                {currentActData.keyUnlocks.map((unlock, idx) => (
                  <li key={idx}>{unlock}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Act Boss Strategy Card */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-poe-darkest/80 border border-slate-800 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> Act Finale Boss: {currentActData.bossName}
            </span>
            <a
              href={currentActData.bossWikiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-1"
            >
              Boss Wiki <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-black/40 p-3 rounded-xl border border-slate-200 dark:border-white/5">
            ⚔️ <strong className="text-slate-900 dark:text-slate-100">Boss Strategy: </strong> {currentActData.bossStrategy}
          </p>
        </div>

        {/* Zone by Zone Cheat Sheet & Checkpoints */}
        <div className="space-y-3">
          <h3 className="text-sm font-poe font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            Zone Navigation & Checkpoints Checklist
          </h3>

          <div className="space-y-2.5">
            {currentActData.zones.map((zone, idx) => {
              const zoneKey = `act${currentActData.actNumber}_${zone.zoneName}`;
              const isChecked = !!completedZones[zoneKey];

              return (
                <div
                  key={idx}
                  onClick={() => toggleZone(zoneKey)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm ${
                    isChecked
                      ? 'border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/15 text-slate-600 dark:text-slate-400'
                      : 'border-slate-800 bg-white dark:bg-poe-darker/80 hover:border-amber-500/40 hover:bg-slate-50 dark:hover:bg-[#0f172a]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-lg flex items-center justify-center mt-0.5 border transition-colors ${
                      isChecked
                        ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                        : 'border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-[#0f172a]'
                    }`}>
                      {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-sm font-bold ${isChecked ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-slate-100'}`}>
                          {zone.zoneName}
                        </span>
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-[#2d2d44] px-1.5 py-0.5 rounded font-mono">
                          Lvl {zone.level}
                        </span>
                        {zone.hasWaypoint && (
                          <span className="text-[10px] bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30 px-1.5 py-0.5 rounded font-medium">
                            Waypoint
                          </span>
                        )}
                        {zone.hasSkillPoint && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/50 px-2 py-0.5 rounded font-bold animate-pulse">
                            ⭐ +1 Skill Point ({zone.skillPointQuest})
                          </span>
                        )}
                        {zone.hasLabTrial && (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/50 px-2 py-0.5 rounded font-bold">
                            🏛️ Lab Trial: {zone.labTrialName}
                          </span>
                        )}
                      </div>

                      {/* Navigation Tip */}
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        🧭 <strong className="text-slate-900 dark:text-slate-200">Layout Cheat: </strong> {zone.navigationTip}
                      </p>

                      {/* Reminders / Alerts */}
                      {zone.vendorReminder && (
                        <p className="text-xs text-cyan-700 dark:text-cyan-300 font-medium">
                          🛒 {zone.vendorReminder}
                        </p>
                      )}
                      {zone.dangerAlert && (
                        <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                          ⚠️ {zone.dangerAlert}
                        </p>
                      )}
                    </div>
                  </div>

                  {zone.poeWikiUrl && (
                    <a
                      href={zone.poeWikiUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 flex items-center gap-1 self-end sm:self-center"
                    >
                      <span>Wiki</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};
