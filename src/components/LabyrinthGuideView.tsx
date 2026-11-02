import React, { useState, useEffect } from 'react';
import { Crown, ExternalLink, Flame, Sparkles, ShieldAlert, Heart, Zap, Gem, RotateCcw, CheckCircle2, Circle, BookOpen } from 'lucide-react';

interface LabTrial { id: string; name: string; act: string; zone: string; tier: 'Normal' | 'Cruel' | 'Merciless'; }

const LAB_TRIALS: LabTrial[] = [
  { id: 'trial-act1-prison', name: 'Trial of Piercing Truth (Spikes)', act: 'Act 1', zone: 'The Lower Prison', tier: 'Normal' },
  { id: 'trial-act2-crypt', name: 'Trial of Swirling Fear (Spinning Blades)', act: 'Act 2', zone: 'The Crypt Level 1', tier: 'Normal' },
  { id: 'trial-act2-sins', name: 'Trial of Crippling Grief (Sawblades)', act: 'Act 2', zone: 'The Chamber of Sins Level 2', tier: 'Normal' },
  { id: 'trial-act3-crematorium', name: 'Trial of Burning Rage (Lava Floor)', act: 'Act 3', zone: 'The Crematorium', tier: 'Normal' },
  { id: 'trial-act3-catacombs', name: 'Trial of Lingering Pain (Blade Sentries)', act: 'Act 3', zone: 'The Catacombs', tier: 'Normal' },
  { id: 'trial-act3-gardens', name: 'Trial of Stinging Doubt (Dart Traps)', act: 'Act 3', zone: 'The Imperial Gardens', tier: 'Normal' },
  { id: 'trial-act6-prison', name: 'Trial of Piercing Truth', act: 'Act 6', zone: 'The Lower Prison', tier: 'Cruel' },
  { id: 'trial-act7-crypt', name: 'Trial of Swirling Fear', act: 'Act 7', zone: 'The Crypt', tier: 'Cruel' },
  { id: 'trial-act7-sins', name: 'Trial of Crippling Grief', act: 'Act 7', zone: 'The Chamber of Sins Level 2', tier: 'Cruel' },
  { id: 'trial-act8-bathhouse', name: 'Trial of Burning Rage', act: 'Act 8', zone: 'The Bath House', tier: 'Merciless' },
  { id: 'trial-act9-tunnel', name: 'Trial of Lingering Pain', act: 'Act 9', zone: 'The Tunnel', tier: 'Merciless' },
  { id: 'trial-act10-ossuary', name: 'Trial of Stinging Doubt', act: 'Act 10', zone: 'The Ossuary', tier: 'Merciless' }
];

export const LabyrinthGuideView: React.FC = () => {
  const [completedTrials, setCompletedTrials] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('poe_ssf_lab_trials');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  const [activeTab, setActiveTab] = useState<'variations' | 'traps' | 'trials' | 'izaro' | 'font'>('variations');

  useEffect(() => {
    try { localStorage.setItem('poe_ssf_lab_trials', JSON.stringify(completedTrials)); } catch {}
  }, [completedTrials]);

  const toggleTrial = (id: string) => {
    setCompletedTrials((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const resetTrials = () => {
    if (window.confirm('Reset all completed Labyrinth Trial checkboxes?')) setCompletedTrials({});
  };

  const labVariations = [
    {
      name: 'The Labyrinth',
      areaLevel: 33,
      minCharLevel: '—',
      trials: 'The Lower Prison (Act 1)\nThe Crypt Level 1 (Act 2)\nThe Chamber of Sins Level 2 (Act 2)\nThe Crematorium (Act 3)\nThe Catacombs (Act 3)\nThe Imperial Gardens (Act 3)',
      rewards: '1 Divine Font use, 2 options',
      extraNotes: 'Grants first 2 Ascendancy Passive Points'
    },
    {
      name: 'The Cruel Labyrinth',
      areaLevel: 55,
      minCharLevel: 40,
      trials: 'The Prison (Act 6)\nThe Crypt (Act 7)\nThe Chamber of Sins Level 2 (Act 7)',
      rewards: '1 Divine Font use, 3 options',
      extraNotes: 'Grants next 2 Ascendancy Passive Points (4 total)'
    },
    {
      name: 'The Merciless Labyrinth',
      areaLevel: 68,
      minCharLevel: 50,
      trials: 'The Bath House (Act 8)\nThe Tunnel (Act 9)\nThe Ossuary (Act 10)',
      rewards: '1 Divine Font use, 4 options',
      extraNotes: 'Grants next 2 Ascendancy Passive Points (6 total). Best place to farm early Transfigured Gems in SSF'
    },
    {
      name: 'The Eternal Labyrinth',
      areaLevel: 75,
      minCharLevel: 68,
      trials: 'End game maps',
      rewards: '2 Divine Font uses, 4 options',
      extraNotes: 'Grants final 2 Ascendancy Passive Points (8 total). Unlocks Level 20 Transfigured Gem crafting.'
    },
    {
      name: 'Eternal Labyrinth of Potential',
      tributeItem: 'Dedication to the Goddess',
      areaLevel: 83,
      minCharLevel: 68,
      trials: 'End game maps',
      rewards: '2 Divine Font uses, 4 options\nDivine Font offers corrupted gem crafting options',
      extraNotes: 'Divine Font offers corrupted gem crafting options and Belt crafts'
    },
    {
      name: 'Eternal Labyrinth of Fortune',
      tributeItem: 'Tribute to the Goddess',
      areaLevel: 83,
      minCharLevel: 68,
      trials: 'End game maps',
      rewards: '2 Divine Font uses, 4 options\nLabyrinth rewards are enriched',
      extraNotes: 'Labyrinth rewards are enriched with high tier currency, divination cards, and rare bases'
    },
    {
      name: 'Eternal Labyrinth of Opportunity',
      tributeItem: 'Gift to the Goddess',
      areaLevel: 83,
      minCharLevel: 68,
      trials: 'End game maps',
      rewards: '8 Divine Font uses, 4 options',
      extraNotes: 'The ultimate target for high speed Transfigured Gem and Exceptional Gem farming in SSF'
    }
  ];

  const totalTrialsCount = LAB_TRIALS.length;
  const completedTrialsCount = LAB_TRIALS.filter(t => completedTrials[t.id]).length;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      
      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-slate-100 to-white dark:from-amber-950/20 dark:via-[#131622] dark:to-poe-darkest p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-64 h-64 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold uppercase tracking-wider">
              <Crown className="w-3.5 h-3.5 text-amber-500" />
              Ascendancy and Divine Font Compendium
            </div>

            <h1 className="text-3xl sm:text-4xl font-poe font-bold text-slate-900 dark:text-slate-100">
              The Lord's Labyrinth
            </h1>

            <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 max-w-2xl leading-relaxed">
              Master the Emperor's trials, unlock your 8 Ascendancy passive points, survive trap gauntlets, and harvest Transfigured Gems at the Divine Font.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="https://www.poelab.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md shadow-amber-500/20 transition-all hover:scale-105"
              >
                <span>PoELab Daily Layouts</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <a
                href="https://www.poewiki.net/wiki/The_Lord%27s_Labyrinth"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-white dark:bg-poe-dark border border-slate-200 dark:border-slate-200 dark:border-[#2d2d44] text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 font-semibold text-xs flex items-center gap-2 shadow-sm transition-all"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>PoE Wiki Reference</span>
              </a>
            </div>
          </div>

          <div className="flex-shrink-0 bg-white/80 dark:bg-white dark:bg-[#1a1a2e]/80 backdrop-blur border border-amber-500/30 rounded-2xl p-4 text-center min-w-[200px] space-y-2 shadow-lg">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Campaign Trials
            </div>
            <div className="text-3xl font-poe font-bold text-amber-600 dark:text-amber-400">
              {completedTrialsCount} / {totalTrialsCount}
            </div>
            <div className="w-full bg-slate-200 dark:bg-[#0f172a] rounded-full h-1.5 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-300"
                style={{ width: `${(completedTrialsCount / totalTrialsCount) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 border-b border-slate-200 dark:border-slate-200 dark:border-[#2d2d44]">
        {[
          { id: 'variations', label: 'Lab Variations Table' },
          { id: 'traps', label: 'Trap Survival and Defense' },
          { id: 'trials', label: 'Trial Locations Checklist' },
          { id: 'izaro', label: 'Izaro Phases and Darkshrines' },
          { id: 'font', label: 'Divine Font Crafting' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white dark:bg-[#1a1a2e]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: LAB VARIATIONS TABLE */}
      {activeTab === 'variations' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-poe font-bold text-slate-900 dark:text-slate-100">
                Labyrinth Variations and Reward Matrix
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Area levels, minimum character level requirements, entry trial locations, and Divine Font reward scaling.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-amber-500/30 bg-white dark:bg-[#1a1a2e] shadow-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-amber-500/10 border-b border-amber-500/30 text-amber-700 dark:text-amber-300 font-poe uppercase tracking-wider font-bold">
                  <th className="p-4">Labyrinth</th>
                  <th className="p-4">Area level</th>
                  <th className="p-4">Minimum character level</th>
                  <th className="p-4">Trial locations</th>
                  <th className="p-4">Reward</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-poe-border/60">
                {labVariations.map((lab, idx) => (
                  <tr 
                    key={idx}
                    className="hover:bg-amber-500/5 transition-colors group"
                  >
                    <td className="p-4 font-bold text-slate-900 dark:text-slate-100">
                      <div className="flex items-center gap-2">
                        <span>{lab.name}</span>
                        {lab.tributeItem && (
                          <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                            (w/ {lab.tributeItem})
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal mt-1">
                        {lab.extraNotes}
                      </div>
                    </td>

                    <td className="p-4 font-mono font-bold text-amber-600 dark:text-amber-400">
                      {lab.areaLevel}
                    </td>

                    <td className="p-4 font-mono text-slate-700 dark:text-slate-300">
                      {lab.minCharLevel}
                    </td>

                    <td className="p-4 text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                      {lab.trials}
                    </td>

                    <td className="p-4 space-y-1">
                      <div className="inline-block px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-semibold font-mono text-[11px] whitespace-pre-line">
                        {lab.rewards}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* TAB 2: TRAP SURVIVAL AND DEFENSE */}
      {activeTab === 'traps' && (
        <div className="space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-200 dark:border-[#2d2d44] pb-4">
            <h2 className="text-xl font-poe font-bold text-slate-900 dark:text-slate-100">
              Trap Mechanics and Survival Best Practices
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Labyrinth traps deal a percentage of your maximum Life and Energy Shield as Physical or Fire Damage over Time. Increasing raw HP alone does not make traps easier; defensive mechanics do!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Essential Aurastack and Regen Combo */}
            <div className="p-6 rounded-2xl border border-amber-500/30 bg-white dark:bg-white dark:bg-[#1a1a2e] space-y-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  <Heart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    The Vitality + Stone Golem Regen Engine
                  </h3>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono">
                    Passive Sustained Recovery
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Because traps deal flat percentage damage (typically 25% of your total Life and Energy Shield per second), having strong flat Life Regeneration counteracts trap damage continuously.
              </p>

              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold">•</span>
                  <span><strong>Vitality Aura:</strong> Slot even a level 10 to 15 Vitality for effortless passive regeneration during trap corridors.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold">•</span>
                  <span><strong>Enduring Cry:</strong> Instant burst healing (1,500+ Life over 1 second) + Endurance charges for physical damage reduction.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold">•</span>
                  <span><strong>Determination and Armour:</strong> Mitigates physical hits from Spike Floor traps and Sawblades.</span>
                </li>
              </ul>
            </div>

            {/* Movement Skills and Corridor Navigation */}
            <div className="p-6 rounded-2xl border border-sky-500/30 bg-white dark:bg-white dark:bg-[#1a1a2e] space-y-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    Blink and Leap Movement Skills
                  </h3>
                  <span className="text-[10px] text-sky-600 dark:text-sky-400 font-mono">
                    Bypassing Trap Hitboxes
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Never run across active trap gauntlets on foot if you can teleport past them. Teleportation skills bypass ground damage triggers completely.
              </p>

              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-sky-500 font-bold">•</span>
                  <span><strong>Flame Dash / Frostblink:</strong> Instantly teleports you between safe spots without touching spinning blades or saw tracks.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-sky-500 font-bold">•</span>
                  <span><strong>Leap Slam:</strong> Jumps over lava grills and spike floors safely.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-sky-500 font-bold">•</span>
                  <span><strong>Safe Zones:</strong> Look for dry patches, raised stones, and lever recesses to rest and recharge flask charges.</span>
                </li>
              </ul>
            </div>

            {/* Pantheon and Flask Configuration */}
            <div className="p-6 rounded-2xl border border-emerald-500/30 bg-white dark:bg-white dark:bg-[#1a1a2e] space-y-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    Pantheon: Soul of Ryslatha and Ralakesh
                  </h3>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                    Endless Flask Sustain
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Equip <strong>Soul of Ryslatha</strong> in your Minor Pantheon slot. It automatically regenerates Life Flask charges every 3 seconds when you have not used a flask recently. You will never run out of Life Flasks while waiting for traps to cycle.
              </p>
            </div>

            {/* Bleeding and Corrupted Blood Mitigation */}
            <div className="p-6 rounded-2xl border border-rose-500/30 bg-white dark:bg-white dark:bg-[#1a1a2e] space-y-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    Bleed Removal and Staunching Flasks
                  </h3>
                  <span className="text-[10px] text-rose-600 dark:text-rose-400 font-mono">
                    Preventing Sudden Deathtraps
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Spike traps and spinning blade sentries apply heavy Bleeding. If you move while bleeding from a trap hit, you take triple damage. Always carry a Divine Life Flask with <em>"Immunity to Bleeding and Corrupted Blood"</em> or roll the Menagerie crafting recipe.
              </p>
            </div>

          </div>
        </div>
      )}

      {/* TAB 3: TRIAL LOCATIONS CHECKLIST */}
      {activeTab === 'trials' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-200 dark:border-[#2d2d44] pb-4">
            <div>
              <h2 className="text-xl font-poe font-bold text-slate-900 dark:text-slate-100">
                Campaign Trials Interactive Checklist
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Check off trials as you conquer them throughout Acts 1 to 10. Your progress is saved automatically.
              </p>
            </div>

            <button
              onClick={resetTrials}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-200 dark:border-[#2d2d44] text-slate-600 dark:text-slate-400 hover:text-red-500 text-xs font-semibold flex items-center gap-1.5 self-start sm:self-center transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Checklist</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Normal Lab Trials */}
            <div className="rounded-2xl border border-amber-500/30 bg-white dark:bg-white dark:bg-[#1a1a2e] p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-200 dark:border-[#2d2d44]">
                <div>
                  <h3 className="font-poe font-bold text-slate-900 dark:text-slate-100">
                    Normal Labyrinth (6 Trials)
                  </h3>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono">
                    Acts 1 to 3 • Level 33
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {LAB_TRIALS.filter(t => t.tier === 'Normal').map((t) => (
                  <div
                    key={t.id}
                    onClick={() => toggleTrial(t.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      completedTrials[t.id]
                        ? 'bg-amber-500/10 border-amber-500/40 text-slate-900 dark:text-slate-100'
                        : 'bg-slate-50 dark:bg-poe-dark border-slate-200 dark:border-slate-200 dark:border-[#2d2d44] text-slate-600 dark:text-slate-400 hover:border-amber-500/30'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold">{t.zone}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{t.name}</div>
                    </div>
                    {completedTrials[t.id] ? (
                      <CheckCircle2 className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300 dark:text-slate-700 flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Cruel Lab Trials */}
            <div className="rounded-2xl border border-sky-500/30 bg-white dark:bg-white dark:bg-[#1a1a2e] p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-200 dark:border-[#2d2d44]">
                <div>
                  <h3 className="font-poe font-bold text-slate-900 dark:text-slate-100">
                    Cruel Labyrinth (3 Trials)
                  </h3>
                  <span className="text-[10px] text-sky-600 dark:text-sky-400 font-mono">
                    Acts 6 to 7 • Level 55
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {LAB_TRIALS.filter(t => t.tier === 'Cruel').map((t) => (
                  <div
                    key={t.id}
                    onClick={() => toggleTrial(t.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      completedTrials[t.id]
                        ? 'bg-sky-500/10 border-sky-500/40 text-slate-900 dark:text-slate-100'
                        : 'bg-slate-50 dark:bg-poe-dark border-slate-200 dark:border-slate-200 dark:border-[#2d2d44] text-slate-600 dark:text-slate-400 hover:border-sky-500/30'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold">{t.zone}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{t.act} • {t.name}</div>
                    </div>
                    {completedTrials[t.id] ? (
                      <CheckCircle2 className="w-5 h-5 text-sky-500 flex-shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300 dark:text-slate-700 flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Merciless Lab Trials */}
            <div className="rounded-2xl border border-emerald-500/30 bg-white dark:bg-white dark:bg-[#1a1a2e] p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-200 dark:border-[#2d2d44]">
                <div>
                  <h3 className="font-poe font-bold text-slate-900 dark:text-slate-100">
                    Merciless Labyrinth (3 Trials)
                  </h3>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                    Acts 8 to 10 • Level 68
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {LAB_TRIALS.filter(t => t.tier === 'Merciless').map((t) => (
                  <div
                    key={t.id}
                    onClick={() => toggleTrial(t.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      completedTrials[t.id]
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-slate-900 dark:text-slate-100'
                        : 'bg-slate-50 dark:bg-poe-dark border-slate-200 dark:border-slate-200 dark:border-[#2d2d44] text-slate-600 dark:text-slate-400 hover:border-emerald-500/30'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold">{t.zone}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{t.act} • {t.name}</div>
                    </div>
                    {completedTrials[t.id] ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300 dark:text-slate-700 flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
      {/* TAB 4: IZARO PHASES AND DARKSHRINES */}
      {activeTab === 'izaro' && (
        <div className="space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-200 dark:border-[#2d2d44] pb-4">
            <h2 className="text-xl font-poe font-bold text-slate-900 dark:text-slate-100">
              Izaro Fight Tactics and Darkshrine Secrets
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Izaro is fought across 3 separate encounter rooms. His mechanics carry forward to the next fight if not disabled.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Izaro Mechanics and Extra Key Optimization */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-200 dark:border-[#2d2d44] bg-white dark:bg-white dark:bg-[#1a1a2e] space-y-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  <Crown className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  Izaro Phase Mechanics (Extra Keys vs Safe SSF Clears)
                </h3>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                In Phases 1 and 2, Izaro gains random support mechanics (Charge Disruptors, Gargoyles, Lieutenants, Conduits, Fonts, Idols, Portals).
              </p>

              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-500/30 text-xs text-slate-700 dark:text-slate-300 space-y-1.5">
                <strong className="text-amber-700 dark:text-amber-400 font-bold block">SSF Rule of Thumb:</strong>
                If your character has low physical mitigation, <em>disable the mechanics immediately</em> (e.g. click Charge Disruptors, kill Lieutenants). Letting him keep maximum buffs grants extra Treasure Keys in the final room, but makes Izaro one shot dangerous!
              </div>
            </div>

            {/* Darkshrines: Finding Secret Buffs */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-200 dark:border-[#2d2d44] bg-white dark:bg-white dark:bg-[#1a1a2e] space-y-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  Darkshrines (Hidden Dungeon Buffs)
                </h3>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Hidden behind secret walls or lever puzzles in side rooms, Darkshrines grant immense permanent buffs for the rest of that Labyrinth run:
              </p>

              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 font-bold">•</span>
                  <span><strong>Twice Enchanted:</strong> Grants 1 additional use of the Divine Font at the end!</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 font-bold">•</span>
                  <span><strong>Disable Traps:</strong> Deactivates all trap gauntlets in the final Izaro arena.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 font-bold">•</span>
                  <span><strong>Extra Treasure Key:</strong> Drops an extra key from Izaro upon defeat.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 font-bold">•</span>
                  <span><strong>Acceleration / Massive Shrine:</strong> Huge movement speed and character size for breeze clearing.</span>
                </li>
              </ul>
            </div>

          </div>
        </div>
      )}

      {/* TAB 5: DIVINE FONT CRAFTING */}
      {activeTab === 'font' && (
        <div className="space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-200 dark:border-[#2d2d44] pb-4">
            <h2 className="text-xl font-poe font-bold text-slate-900 dark:text-slate-100">
              Divine Font Gem Crafting and Transfigured Conversions
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              The Divine Font allows you to transform standard skill gems into Transfigured Gems, add Quality, or sacrifice gem XP for lenses.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="p-6 rounded-2xl border border-amber-500/30 bg-white dark:bg-white dark:bg-[#1a1a2e] space-y-3 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold">
                <Gem className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                1. Transfigured Gem Transform
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Transforms a non Transfigured Skill Gem into a random Transfigured version of the <em>same color</em>. Ideal for targeting Penance Brand of Dissipation, Ice Nova of Frostbolts, or Detonate Dead in SSF!
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-sky-500/30 bg-white dark:bg-white dark:bg-[#1a1a2e] space-y-3 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-600 dark:text-sky-400 font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                2. Add % Quality to Gem
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Adds up to +8% to +20% Quality to a target gem without consuming Gemcutter's Prisms. Essential for quality capping key damage gems early in SSF progression.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-emerald-500/30 bg-white dark:bg-white dark:bg-[#1a1a2e] space-y-3 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                3. Sacrifice Gem for XP Lens
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Sacrifices a high level gem to extract its accumulated gem experience into a Facetor's Lens, allowing you to instantly boost newly acquired transfigured gems to level 19 to 20.
              </p>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
