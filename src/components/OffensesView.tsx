import React, { useMemo, useState } from 'react';
import {
  Swords,
  Flame,
  Sparkles,
  Layers,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Crosshair,
  Award,
  Zap,
  Target,
  Wrench,
  Hammer,
  ArrowRight,
  Sliders
} from 'lucide-react';
import {
  OFFENSE_PILLARS,
  OFFENSIVE_MILESTONES,
  OFFENSIVE_MECHANICS,
  OFFENSIVE_ARCHETYPES
} from '../data/offensesData';

type GameMode = 'poe1' | 'poe2';

interface AilmentEntry {
  id: string;
  name: string;
  game: 'both' | 'poe1' | 'poe2';
  element: string;
  color: string;
  baseRule: string;
  scalingTips: string;
  poe2Note: string;
}

const AILMENT_REFERENCE: AilmentEntry[] = [
  {
    id: 'ignite',
    name: 'Ignite (Fire DoT)',
    game: 'both',
    element: 'Fire',
    color: 'text-orange-400 border-orange-500/35 bg-orange-500/10',
    baseRule: 'PoE 1: Deals 90% of base Fire hit per second over 4s. Only the single strongest Ignite deals damage (unless using Emberwake).',
    scalingTips: 'Scale with Base Hit size, Fire DoT Multiplier, Burning Damage, Exposure, and Flammability. Spell Damage does not scale Ignite.',
    poe2Note: 'PoE 2: Ignite magnitude scales directly off the final post mitigation Fire hit (including Crits and Penetration). Bigger hit = bigger Ignite.'
  },
  {
    id: 'poison',
    name: 'Poison (Chaos DoT)',
    game: 'both',
    element: 'Chaos / Phys',
    color: 'text-emerald-400 border-emerald-500/35 bg-emerald-500/10',
    baseRule: 'PoE 1: Deals 30% of combined base Phys + Chaos hit per second for 2s. Stacks infinitely with Attack/Cast speed.',
    scalingTips: 'Scale with Attack/Cast speed, Wither (up to 90% increased chaos damage taken), Poison Duration, and Chaos DoT Multiplier.',
    poe2Note: 'PoE 2: Capped at 1 Poison stack by default unless scaled via passive tree, supports, or Pathfinder ascendancy.'
  },
  {
    id: 'bleed',
    name: 'Bleed (Physical DoT)',
    game: 'both',
    element: 'Physical',
    color: 'text-rose-400 border-rose-500/35 bg-rose-500/10',
    baseRule: 'PoE 1: Deals 70% of base Physical attack hit per second for 5s (210% while moving or Aggravated).',
    scalingTips: 'Use Aggravate (Gladiator or tree) to force moving damage on stationary bosses. Scale with high top end Phys weapons and Phys DoT Multi.',
    poe2Note: 'PoE 2: Bleed only applies if the Physical hit deals damage to Enemy Life (hits fully absorbed by Energy Shield cannot inflict Bleed).'
  },
  {
    id: 'shock_chill',
    name: 'Shock & Chill (Debuffs)',
    game: 'both',
    element: 'Lightning / Cold',
    color: 'text-sky-400 border-sky-500/35 bg-sky-500/10',
    baseRule: 'Shock causes enemies to take up to 50% increased damage (20% base in PoE 2). Chill slows enemy Action Speed by up to 30%.',
    scalingTips: 'Threshold scales against enemy Ailment Threshold. Stack % Increased Effect of Non Damaging Ailments to push pinnacle boss Shocks higher.',
    poe2Note: 'PoE 2: Shock has a flat 20% increased damage taken baseline and scales linearly with Magnitude of Shock passives.'
  },
  {
    id: 'freeze_electrocute',
    name: 'Freeze & Electrocute',
    game: 'poe2',
    element: 'Cold / Lightning',
    color: 'text-cyan-300 border-cyan-500/35 bg-cyan-500/10',
    baseRule: 'PoE 2 introduces visible buildup bars on bosses for Freeze (Cold) and Electrocute (Lightning with Electrocute support or skills).',
    scalingTips: 'Freezing or Electrocuting a pinnacle boss completely locks them out of mechanics for 4+ seconds, creating huge burst windows.',
    poe2Note: 'Combine Freeze buildup with Heavy Stun to chain lock bosses during dangerous phases.'
  }
];

const POE2_OFFENSE_SYSTEMS = [
  {
    id: 'p2-conv',
    badge: 'Critical Rule Change',
    name: 'Final Damage Type Conversion Only',
    tagline: 'No more double dipping pre conversion Increased Damage modifiers.',
    detail:
      'In Path of Exile 2, when a skill converts Physical damage to Fire or Lightning, ONLY modifiers matching the final converted damage type apply. Stacking % Increased Physical Damage on the tree will NOT scale a 100% Lightning converted bow skill (local weapon % Physical still scales base weapon damage first).',
    rule: 'Scale flat weapon damage locally, then stack % Increased Elemental or Lightning damage on the passive tree.'
  },
  {
    id: 'p2-gem-levels',
    badge: 'Primary Scaling Lever',
    name: '+Levels to Skill Gems & Support Uniqueness',
    tagline: 'Gem levels remain the single strongest DPS multiplier in PoE 2.',
    detail:
      'Because you can only slot one copy of each Support Gem across your entire character in PoE 2, raw +Levels to Melee, Projectile, Spell, or Minion skills on Weapons, Amulets, Focuses, and Gloves provide massive exponential base damage scaling.',
    rule: 'Prioritize +3 to +5 Skill Levels on weapons and +2 on Amulets while balancing rising Mana costs.'
  },
  {
    id: 'p2-armour-break',
    badge: 'Physical & Bossing',
    name: 'Armour Break, Exposure & Curses',
    tagline: 'Stripping boss defenses multiplies every follow up hit.',
    detail:
      'Fully Breaking an enemy Armour increases Physical damage taken by 20% (and can be consumed by payoff skills for massive bursts). Elemental Exposure removes 20% enemy resistance, stacking cleanly with Flammability, Frostbite, or Conductivity.',
    rule: 'Automate Exposure or Curses via Cast on Freeze/Shock or Blasphemy Spirit reservations for effortless boss uptime.'
  },
  {
    id: 'p2-weapon-swap',
    badge: 'Dual Specialization',
    name: 'Weapon Set Passive Tree Specialization',
    tagline: 'Run one tree for map clearing and a second tree for single target bosses.',
    detail:
      'Path of Exile 2 lets you allocate up to 24 Weapon Set Passive Points that automatically swap the instant you cast a skill bound to Weapon Set 1 or Weapon Set 2. Use Set 1 for AoE/Clear speed and Set 2 for Curse Effect, Exposure, or Boss Burst.',
    rule: 'Bind your Curse or Sigil of Power to Weapon Set 2 with a dedicated +Level / Curse Effect staff.'
  }
];

export const OffensesView: React.FC = () => {
  const [gameMode, setGameMode] = useState<GameMode>('poe1');
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>('campaign');
  const [selectedAilment, setSelectedAilment] = useState<string>('ignite');

  // Interactive Multiplier Sandbox State
  const [existingIncreased, setExistingIncreased] = useState<number>(400);
  const [enemyRes, setEnemyRes] = useState<number>(50);

  const comparison = useMemo(() => {
    const baseIncMult = 1 + existingIncreased / 100;
    const baseResMult = 1 - enemyRes / 100;

    // Upgrade A: +50% Increased Damage
    const gainFrom50Inc = (((baseIncMult + 0.5) / baseIncMult) - 1) * 100;
    // Upgrade B: 30% More Damage
    const gainFrom30More = 30;
    // Upgrade C: -30% Enemy Res (Curse / Exposure / Pen)
    const newResMult = 1 - (enemyRes - 30) / 100;
    const gainFrom30Pen = baseResMult > 0 ? ((newResMult / baseResMult) - 1) * 100 : 30;

    return {
      gainFrom50Inc: gainFrom50Inc.toFixed(1),
      gainFrom30More: gainFrom30More.toFixed(1),
      gainFrom30Pen: gainFrom30Pen.toFixed(1)
    };
  }, [existingIncreased, enemyRes]);

  const toggleMilestone = (id: string) => {
    setExpandedMilestone((prev) => (prev === id ? null : id));
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const visibleAilments = AILMENT_REFERENCE.filter(
    (a) => a.game === 'both' || a.game === gameMode
  );
  const activeAilment =
    visibleAilments.find((a) => a.id === selectedAilment) || visibleAilments[0];

  const pipelineSteps = [
    { step: '1', label: 'Base & Added Flat', sub: 'Weapon DPS or Gem Level + Flat Rings' },
    {
      step: '2',
      label: 'Damage Conversion',
      sub: gameMode === 'poe1' ? 'Phys → Light → Cold → Fire → Chaos' : 'Scales by Final Type Only'
    },
    { step: '3', label: 'Sum of % Increased', sub: 'Additive bucket (diminishing returns)' },
    { step: '4', label: 'Product of % More', sub: 'Multiplicative supports & ascendancies' },
    { step: '5', label: 'Crit & Action Speed', sub: 'Crit Chance × Crit Multi × APS/CPS' },
    { step: '6', label: 'Enemy Mitigation', sub: 'Curses, Exposure, Penetration, Wither' }
  ];

  return (
    <article className="space-y-8 w-full pb-20 font-sans text-slate-200">
      {/* 1. Modernized Header Masthead */}
      <header className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-[#0e1320] via-[#111827] to-[#0b0f19] p-5 sm:p-6 shadow-xl space-y-4">
        <div className="absolute -top-16 -right-16 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-widest text-amber-400">
              <Swords className="w-3.5 h-3.5" />
              Damage Scaling & Multiplier Masterclass
            </div>
            <h1 className="text-2xl sm:text-3xl font-poe font-bold tracking-tight text-white">
              Offenses & Scaling Architecture
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Understand the exact damage calculation pipeline, compare additive Increased vs. multiplicative More and Penetration upgrades, and master ailments across Path of Exile 1 and Path of Exile 2.
            </p>
          </div>

          {/* PoE 1 / PoE 2 Switcher */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-950/90 border border-indigo-500/25 self-start lg:self-center">
            <button
              type="button"
              onClick={() => setGameMode('poe1')}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer min-h-[40px] ${
                gameMode === 'poe1'
                  ? 'bg-indigo-600/25 text-white border border-indigo-400/60 shadow-md ring-1 ring-indigo-500/30'
                  : 'text-slate-300 border border-transparent hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              <Flame className={`w-4 h-4 ${gameMode === 'poe1' ? 'text-amber-300' : 'text-indigo-400'}`} />
              <span>Path of Exile 1</span>
              {gameMode === 'poe1' && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-gradient-to-r from-indigo-400 via-amber-400 to-indigo-400" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setGameMode('poe2')}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer min-h-[40px] ${
                gameMode === 'poe2'
                  ? 'bg-indigo-600/25 text-white border border-indigo-400/60 shadow-md ring-1 ring-indigo-500/30'
                  : 'text-slate-300 border border-transparent hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              <Hammer className={`w-4 h-4 ${gameMode === 'poe2' ? 'text-amber-300' : 'text-indigo-400'}`} />
              <span>Path of Exile 2</span>
              {gameMode === 'poe2' && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-gradient-to-r from-indigo-400 via-amber-400 to-indigo-400" />
              )}
            </button>
          </div>
        </div>

        {/* Jump Bar for PoE 1 */}
        {gameMode === 'poe1' && (
          <nav className="relative z-10 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="text-slate-500 uppercase font-mono text-[10px] mr-1">Jump to:</span>
            <button type="button" onClick={() => scrollToSection('sec-pipeline')} className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-amber-400/60 text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer">
              <Sliders className="w-3.5 h-3.5 text-amber-400" /> Scaling Pipeline
            </button>
            <button type="button" onClick={() => scrollToSection('sec-ailments')} className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-orange-400/60 text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer">
              <Flame className="w-3.5 h-3.5 text-orange-400" /> Ailments
            </button>
            <button type="button" onClick={() => scrollToSection('sec-pillars')} className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-sky-400/60 text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer">
              <Layers className="w-3.5 h-3.5 text-sky-400" /> 4 Pillars
            </button>
            <button type="button" onClick={() => scrollToSection('sec-offense-milestones')} className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-emerald-400/60 text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer">
              <Award className="w-3.5 h-3.5 text-emerald-400" /> Progression
            </button>
            <button type="button" onClick={() => scrollToSection('sec-offense-mechanics')} className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-rose-400/60 text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer">
              <Target className="w-3.5 h-3.5 text-rose-400" /> Mechanics
            </button>
            <button type="button" onClick={() => scrollToSection('sec-archetypes')} className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-purple-400/60 text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer">
              <Wrench className="w-3.5 h-3.5 text-purple-400" /> Archetypes
            </button>
          </nav>
        )}
      </header>

      {/* 2. Visual Damage Conversion & Scaling Pipeline + Interactive Multiplier Comparison */}
      <section id="sec-pipeline" className="rounded-2xl border border-amber-500/30 bg-slate-900/85 p-5 sm:p-6 shadow-lg space-y-6">
        <div className="space-y-1">
          <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400">
            Visual Scaling Pipeline ({gameMode === 'poe1' ? 'PoE 1 Order' : 'PoE 2 Order'})
          </div>
          <h2 className="text-lg sm:text-xl font-poe font-bold text-white">
            How Your Hit Actually Multiplies From Base to Boss Damage
          </h2>
        </div>

        {/* 6 Step Visual Pipeline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
          {pipelineSteps.map((item, idx) => (
            <div key={item.step} className="relative flex items-stretch">
              <div className="w-full p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold flex items-center justify-center">
                    {item.step}
                  </span>
                  {idx < pipelineSteps.length - 1 && (
                    <ArrowRight className="w-3.5 h-3.5 text-slate-600 hidden lg:block" />
                  )}
                </div>
                <div className="text-xs font-bold text-white leading-tight">{item.label}</div>
                <div className="text-[11px] text-slate-400 leading-snug">{item.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Interactive Multiplier Comparison Sandbox */}
        <div className="pt-4 border-t border-slate-800 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                Why More Multipliers & Resistance Shred Beat Extra Increased Damage
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Adjust your current stats to see the real DPS gain of three common passive or gear upgrades.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <label className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-mono text-[10px] uppercase">Existing % Increased:</span>
                <input
                  type="number"
                  min={0}
                  step={50}
                  value={existingIncreased}
                  onChange={(e) => setExistingIncreased(Math.max(0, Number(e.target.value) || 0))}
                  className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-amber-300 font-mono font-bold text-right"
                />
              </label>

              <label className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-mono text-[10px] uppercase">Boss Res (%):</span>
                <input
                  type="number"
                  min={0}
                  max={75}
                  step={5}
                  value={enemyRes}
                  onChange={(e) => setEnemyRes(Math.min(75, Math.max(0, Number(e.target.value) || 0)))}
                  className="w-14 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-sky-300 font-mono font-bold text-right"
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="p-4 rounded-xl bg-slate-950/75 border border-slate-800 space-y-1">
              <div className="text-[10px] font-mono uppercase text-slate-400">Option A • Additive Bucket</div>
              <div className="text-xs font-bold text-slate-200">Add +50% Increased Damage</div>
              <div className="text-2xl font-mono font-bold text-slate-300 pt-1">
                +{comparison.gainFrom50Inc}% <span className="text-xs font-normal text-slate-500">real DPS</span>
              </div>
              <p className="text-[11px] text-slate-400">Diluted by your existing {existingIncreased}% increased pool.</p>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/35 space-y-1">
              <div className="text-[10px] font-mono uppercase text-amber-300">Option B • Multiplicative Bucket</div>
              <div className="text-xs font-bold text-white">Add 30% More Damage Support</div>
              <div className="text-2xl font-mono font-bold text-amber-400 pt-1">
                +{comparison.gainFrom30More}% <span className="text-xs font-normal text-amber-200/70">real DPS</span>
              </div>
              <p className="text-[11px] text-slate-300">Always multiplies your entire final hit with zero dilution.</p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/35 space-y-1">
              <div className="text-[10px] font-mono uppercase text-emerald-300">Option C • Boss Res Shred</div>
              <div className="text-xs font-bold text-white">Apply 30% Curse / Exposure / Pen</div>
              <div className="text-2xl font-mono font-bold text-emerald-400 pt-1">
                +{comparison.gainFrom30Pen}% <span className="text-xs font-normal text-emerald-200/70">real DPS</span>
              </div>
              <p className="text-[11px] text-slate-300">Against a {enemyRes}% res boss, shredding resistance scales superlinearly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Interactive Ailment & Scaling Quick Reference */}
      <section id="sec-ailments" className="rounded-2xl border border-slate-800 bg-slate-900/85 p-5 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-orange-400">
              Interactive Quick Reference
            </div>
            <h2 className="text-base sm:text-lg font-poe font-bold text-white">
              Ailment Scaling & Status Thresholds ({gameMode === 'poe1' ? 'PoE 1' : 'PoE 2'})
            </h2>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {visibleAilments.map((ailment) => (
              <button
                key={ailment.id}
                type="button"
                onClick={() => setSelectedAilment(ailment.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  activeAilment.id === ailment.id
                    ? 'bg-indigo-600/30 text-white border-indigo-400/60 shadow-sm'
                    : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:border-slate-600'
                }`}
              >
                {ailment.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-950/75 border border-slate-800 space-y-1.5">
            <span className={`inline-block px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase border ${activeAilment.color}`}>
              {activeAilment.element}
            </span>
            <div className="font-bold text-white text-sm pt-1">Core Formula</div>
            <p className="text-slate-300 leading-relaxed">{activeAilment.baseRule}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/75 border border-slate-800 space-y-1.5">
            <div className="font-mono text-[10px] font-bold uppercase text-amber-400">SSF Scaling Levers</div>
            <p className="text-slate-300 leading-relaxed">{activeAilment.scalingTips}</p>
          </div>
          <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/25 space-y-1.5">
            <div className="font-mono text-[10px] font-bold uppercase text-indigo-300">PoE 2 Mechanical Difference</div>
            <p className="text-slate-200 leading-relaxed">{activeAilment.poe2Note}</p>
          </div>
        </div>
      </section>

      {/* POE 2 DEDICATED OFFENSE CONTENT */}
      {gameMode === 'poe2' ? (
        <section className="space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <span className="text-xs uppercase font-mono tracking-widest text-amber-400 font-bold">
              Path of Exile 2 Offensive Architecture
            </span>
            <h2 className="text-2xl font-poe font-bold text-white mt-1">
              Core PoE 2 Damage Systems
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {POE2_OFFENSE_SYSTEMS.map((sys) => (
              <article
                key={sys.id}
                className="p-5 rounded-2xl border border-slate-800 bg-slate-900/85 hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="border-b border-slate-800 pb-3">
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 uppercase">
                      {sys.badge}
                    </span>
                    <h3 className="text-lg font-poe font-bold text-white mt-1">{sys.name}</h3>
                  </div>
                  <p className="text-xs text-amber-300 italic">"{sys.tagline}"</p>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{sys.detail}</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs">
                  <div className="font-bold text-emerald-300 uppercase tracking-wider text-[10px] mb-0.5">SSF Priority:</div>
                  <p className="text-slate-200 font-medium">{sys.rule}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <>
          {/* POE 1 SECTION 1: THE 4 DAMAGE PILLARS */}
          <section id="sec-pillars" className="space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-400">
                Part One • Foundational Damage Architecture
              </div>
              <h2 className="text-2xl font-poe font-bold text-white mt-1">
                The 4 Pillars of Offensive Scaling
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {OFFENSE_PILLARS.map((p) => (
                <div
                  key={p.id}
                  className="p-5 rounded-2xl border border-amber-500/30 bg-slate-900/85 space-y-3 hover:border-amber-400/60 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 font-mono font-bold text-xs flex items-center justify-center border border-amber-500/30">
                      P{p.pillarNumber}
                    </div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-300">
                      Pillar
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-sm">{p.name}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{p.description}</p>
                  <div className="p-2.5 rounded-xl bg-slate-950/75 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                    <div className="font-mono font-bold text-amber-400 text-[10px] uppercase">Mathematical Rule:</div>
                    <div>{p.mathExample}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* POE 1 SECTION 2: PROGRESSION LEVERS */}
          <section id="sec-offense-milestones" className="space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-sky-400">
                Part Two • Progression Levers
              </div>
              <h2 className="text-2xl font-poe font-bold text-white mt-1">
                What to Scale and Upgrade at Each Milestone
              </h2>
            </div>

            <div className="space-y-3">
              {OFFENSIVE_MILESTONES.map((m) => {
                const isOpen = expandedMilestone === m.id;
                return (
                  <div
                    key={m.id}
                    className={`rounded-2xl border transition-all overflow-hidden ${
                      isOpen ? 'border-amber-500/40 bg-slate-900/90' : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleMilestone(m.id)}
                      className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md border ${
                            m.badgeColor === 'emerald'
                              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                              : m.badgeColor === 'sky'
                              ? 'bg-sky-500/15 border-sky-500/30 text-sky-300'
                              : m.badgeColor === 'amber'
                              ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                              : m.badgeColor === 'rose'
                              ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                              : 'bg-purple-500/15 border-purple-500/30 text-purple-300'
                          }`}
                        >
                          {m.badge}
                        </span>
                        <div>
                          <h3 className="text-base sm:text-lg font-poe font-bold text-white">{m.title}</h3>
                          <p className="text-xs text-slate-400">{m.subtitle}</p>
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400 flex-shrink-0">
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-4 sm:px-6 pb-6 pt-3 border-t border-slate-800 bg-slate-950/60 space-y-5 text-xs sm:text-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                            <div className="font-bold font-mono text-[10px] text-slate-400 uppercase">DPS Benchmark</div>
                            <div className="text-slate-200 font-semibold">{m.dpsBenchmark}</div>
                          </div>
                          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                            <div className="font-bold font-mono text-[10px] text-slate-400 uppercase">Socket Links</div>
                            <div className="text-slate-200 font-semibold">{m.socketLinks}</div>
                          </div>
                          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                            <div className="font-bold font-mono text-[10px] text-slate-400 uppercase">Core Scaling Engines</div>
                            <div className="text-slate-300">{m.coreScaling}</div>
                          </div>
                          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                            <div className="font-bold font-mono text-[10px] text-slate-400 uppercase">Curses & Exposure</div>
                            <div className="text-slate-300">{m.cursesAndExposure}</div>
                          </div>
                        </div>

                        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-1">
                          <div className="font-bold font-mono text-[11px] uppercase flex items-center gap-1.5 text-rose-400">
                            <Flame className="w-3.5 h-3.5" /> Common Damage Bottleneck
                          </div>
                          <p className="text-xs text-slate-200 leading-relaxed">{m.failurePoint}</p>
                        </div>

                        <ul className="space-y-1.5 text-xs text-slate-300 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                          {m.actionChecklist.map((step, idx) => (
                            <li key={idx} className="flex items-start gap-2 leading-relaxed">
                              <span className="text-amber-400 font-bold">✓</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* POE 1 SECTION 3: OFFENSIVE MECHANICS */}
          <section id="sec-offense-mechanics" className="space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-rose-400">
                Part Three • Comprehensive Mechanics Reference
              </div>
              <h2 className="text-2xl font-poe font-bold text-white mt-1">
                All Offensive Systems Explained
              </h2>
            </div>

            <div className="space-y-5">
              {OFFENSIVE_MECHANICS.map((mech) => (
                <article
                  key={mech.id}
                  className="p-5 sm:p-6 rounded-2xl border border-slate-800 bg-slate-900/85 hover:border-amber-500/40 transition-all space-y-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                    <div>
                      <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-amber-500/15 text-amber-300 text-[10px] font-mono font-bold uppercase tracking-wider mb-1">
                        {mech.category}
                      </div>
                      <h3 className="text-xl font-poe font-bold text-white">{mech.name}</h3>
                      <p className="text-xs text-amber-400 font-semibold mt-0.5">{mech.tagline}</p>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <div className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-right">
                        <div className="text-[9px] text-slate-400 uppercase font-mono">Difficulty</div>
                        <div className="text-xs font-bold text-slate-200">{mech.difficulty}</div>
                      </div>
                      <div className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-right">
                        <div className="text-[9px] text-slate-400 uppercase font-mono">Timing</div>
                        <div className="text-xs font-bold text-slate-200">{mech.setupTime}</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                    <div className="space-y-3">
                      <div className="p-4 rounded-xl bg-slate-950/75 border border-slate-800 space-y-1.5">
                        <h4 className="text-[11px] font-bold uppercase font-mono text-amber-400 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5" /> Concept
                        </h4>
                        <p className="text-slate-300 leading-relaxed">{mech.plainEnglish}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 space-y-1.5">
                        <h4 className="text-[11px] font-bold uppercase font-mono text-rose-400 flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5" /> Common Trap
                        </h4>
                        <p className="text-slate-200 leading-relaxed">{mech.theTrap}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-1.5">
                        <h4 className="text-[11px] font-bold uppercase font-mono text-amber-300 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" /> Target Rule of Thumb
                        </h4>
                        <p className="text-slate-200 font-medium leading-relaxed">{mech.ruleOfThumb}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-950/75 border border-slate-800 space-y-1.5">
                        <h4 className="text-[11px] font-bold uppercase font-mono text-sky-400 flex items-center gap-1.5">
                          <Crosshair className="w-3.5 h-3.5" /> How to Scale in SSF
                        </h4>
                        <ul className="space-y-1 text-xs text-slate-300">
                          {mech.howToScale.map((step, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-amber-400 font-bold">•</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* POE 1 SECTION 4: ARCHETYPE SCALING */}
          <section id="sec-archetypes" className="space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-purple-400">
                Part Four • Archetype Scaling Guide
              </div>
              <h2 className="text-2xl font-poe font-bold text-white mt-1">
                Core Offensive Archetypes
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {OFFENSIVE_ARCHETYPES.map((arch) => (
                <article
                  key={arch.id}
                  className="p-5 sm:p-6 rounded-2xl border border-slate-800 bg-slate-900/85 hover:border-amber-500/40 transition-all space-y-4"
                >
                  <div className="border-b border-slate-800 pb-3 space-y-1">
                    <h3 className="text-lg font-poe font-bold text-white">{arch.name}</h3>
                    <p className="text-xs text-amber-400 font-mono font-semibold">
                      Scaling Focus: {arch.primaryScalingStat}
                    </p>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                    {arch.coreMechanic}
                  </p>

                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-slate-200">
                      <div className="font-bold font-mono text-[10px] uppercase text-emerald-400 mb-0.5">Strengths</div>
                      <div>{arch.pros}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-slate-200">
                      <div className="font-bold font-mono text-[10px] uppercase text-rose-400 mb-0.5">Tradeoffs</div>
                      <div>{arch.cons}</div>
                    </div>
                  </div>

                  <ul className="space-y-1.5 text-xs text-slate-300 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                    {arch.ssfGearPriorities.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-400 font-bold">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </article>
  );
};
