import React, { useState } from 'react';
import { 
  Swords, 
  Flame, 
  Sparkles, 
  Layers, 
  BookOpen, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Crosshair, 
  Award,
  Zap,
  Target,
  Wrench
} from 'lucide-react';
import { 
  OFFENSE_PILLARS, 
  OFFENSIVE_MILESTONES, 
  OFFENSIVE_MECHANICS, 
  OFFENSIVE_ARCHETYPES 
} from '../data/offensesData';

export const OffensesView: React.FC = () => {
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>('campaign');

  const toggleMilestone = (id: string) => {
    setExpandedMilestone(prev => prev === id ? null : id);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <article className="space-y-12 w-full space-y-6 pb-20 font-sans text-slate-200">
      
      {/* 1. Article Masthead */}
      <header className="relative rounded-3xl overflow-hidden border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-slate-100 to-white dark:from-amber-950/20 dark:via-[#131622] dark:to-poe-darkest p-6 sm:p-10 shadow-2xl space-y-6">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-800 dark:text-amber-300 font-semibold uppercase tracking-wider">
              <Swords className="w-3.5 h-3.5 text-amber-500" />
              Offensive Scaling Encyclopedia
            </span>
            <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 font-mono">
              <Clock className="w-3.5 h-3.5" /> 14 Min In Depth Read
            </span>
            <span className="text-slate-400 font-mono hidden sm:inline">•</span>
            <span className="text-slate-500 dark:text-slate-400 font-mono hidden sm:inline">All Damage Archetypes</span>
            <span className="text-slate-400 font-mono hidden sm:inline">•</span>
            <span className="text-slate-500 dark:text-slate-400 font-mono hidden sm:inline">Solo Self Found Verified</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-poe font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
            Offenses
          </h1>

          <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 max-w-3xl leading-relaxed font-serif">
            The architectural blueprint for damage scaling, damage conversion, and multiplier compounding in Path of Exile 1. Written in plain English to help you push your damage from 100k into tens of millions.
          </p>

          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs sm:text-sm text-amber-950 dark:text-amber-200 flex items-start sm:items-center gap-3">
            <Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5 sm:mt-0" />
            <p className="leading-relaxed">
              <strong>The Core Formula:</strong> Total Dealt Damage = (Base Flat Damage) × (1 + Sum of % Increased) × (Product of all % More Multipliers) × (Crit Rate × Crit Multiplier) × (Attack or Cast Speed) × (Enemy Resistance Lowering).
            </p>
          </div>
        </div>

        {/* Quick Navigation Anchor Bar */}
        <nav className="relative z-10 pt-4 border-t border-slate-800 flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="text-slate-400 uppercase font-mono text-[10px] mr-1">Jump to:</span>
          <button 
            onClick={() => scrollToSection('sec-pillars')}
            className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-amber-500 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-amber-500" /> 1. The 4 Damage Pillars
          </button>
          <button 
            onClick={() => scrollToSection('sec-offense-milestones')}
            className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-sky-500 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Award className="w-3.5 h-3.5 text-sky-500" /> 2. Progression Levers (Acts to T17)
          </button>
          <button 
            onClick={() => scrollToSection('sec-offense-mechanics')}
            className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-rose-500 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Target className="w-3.5 h-3.5 text-rose-500" /> 3. Mechanics Deep Dive
          </button>
          <button 
            onClick={() => scrollToSection('sec-archetypes')}
            className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-purple-500 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Wrench className="w-3.5 h-3.5 text-purple-500" /> 4. Archetype Scaling
          </button>
        </nav>
      </header>

      {/* SECTION 1: THE 4 DAMAGE PILLARS */}
      <section id="sec-pillars" className="space-y-6 pt-4">
        <div className="space-y-2 border-b border-slate-800 pb-3">
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Part One • Foundational Damage Architecture
          </div>
          <h2 className="text-2xl sm:text-3xl font-poe font-bold text-slate-900 dark:text-slate-100">
            The 4 Pillars of Offensive Scaling
          </h2>
        </div>

        <div className="prose dark:prose-invert max-w-none text-sm sm:text-base leading-relaxed space-y-4 text-slate-700 dark:text-slate-300">
          <p>
            Path of Exile calculates damage through a sequence of compounding mathematical buckets. Many players get stuck in yellow maps because they pour all their passive points into one bucket (such as stacking 600% increased damage) while neglecting the other four multipliers that compound exponentially.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {OFFENSE_PILLARS.map((p) => (
            <div key={p.id} className="p-5 rounded-2xl border border-amber-500/30 bg-slate-900/80 space-y-3 shadow-sm hover:border-amber-500/60 transition-all">
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 font-mono font-bold text-xs flex items-center justify-center">
                  P{p.pillarNumber}
                </div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300">
                  Pillar
                </span>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                {p.name}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {p.description}
              </p>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-poe-dark/50 border border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                <div className="font-mono font-bold text-amber-600 dark:text-amber-400 text-[10px] uppercase">Mathematical Rule:</div>
                <div>{p.mathExample}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 2: PROGRESSION LEVERS (ACTS TO T17 PINNACLES) */}
      <section id="sec-offense-milestones" className="space-y-6 pt-4">
        <div className="space-y-2 border-b border-slate-800 pb-3">
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
            Part Two • Progression Levers
          </div>
          <h2 className="text-2xl sm:text-3xl font-poe font-bold text-slate-900 dark:text-slate-100">
            What to Scale and Upgrade at Each Milestone
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Click each tier lever to reveal the target DPS benchmarks, socket link milestones, weapon scaling recipes, and common mistakes that stall progression.
          </p>
        </div>

        <div className="space-y-3.5">
          {OFFENSIVE_MILESTONES.map((m) => {
            const isOpen = expandedMilestone === m.id;
            return (
              <div 
                key={m.id}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  isOpen 
                    ? 'border-amber-500/40 bg-slate-900/80 shadow-lg' 
                    : 'border-slate-800 bg-slate-50/50 dark:bg-poe-dark/30 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <button
                  onClick={() => toggleMilestone(m.id)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md border ${
                      m.badgeColor === 'emerald' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300' :
                      m.badgeColor === 'sky' ? 'bg-sky-500/15 border-sky-500/30 text-sky-700 dark:text-sky-300' :
                      m.badgeColor === 'amber' ? 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300' :
                      m.badgeColor === 'rose' ? 'bg-rose-500/15 border-rose-500/30 text-rose-700 dark:text-rose-300' :
                      'bg-purple-500/15 border-purple-500/30 text-purple-700 dark:text-purple-300'
                    }`}>
                      {m.badge}
                    </span>
                    <div>
                      <h3 className="text-base sm:text-lg font-poe font-bold text-slate-900 dark:text-slate-100">
                        {m.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {m.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-poe-dark flex items-center justify-center text-slate-500 flex-shrink-0">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 sm:px-6 pb-6 pt-2 border-t border-slate-100 dark:border-slate-800/50 space-y-5 text-xs sm:text-sm">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-poe-dark/50 border border-slate-800 space-y-1">
                        <div className="font-bold font-mono text-[11px] text-slate-400 uppercase">DPS Benchmark</div>
                        <div className="text-slate-800 dark:text-slate-200 font-semibold">{m.dpsBenchmark}</div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-poe-dark/50 border border-slate-800 space-y-1">
                        <div className="font-bold font-mono text-[11px] text-slate-400 uppercase">Socket Links</div>
                        <div className="text-slate-800 dark:text-slate-200 font-semibold">{m.socketLinks}</div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-poe-dark/50 border border-slate-800 space-y-1">
                        <div className="font-bold font-mono text-[11px] text-slate-400 uppercase">Core Scaling Engines</div>
                        <div className="text-slate-800 dark:text-slate-200">{m.coreScaling}</div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-poe-dark/50 border border-slate-800 space-y-1">
                        <div className="font-bold font-mono text-[11px] text-slate-400 uppercase">Curses and Exposure</div>
                        <div className="text-slate-800 dark:text-slate-200">{m.cursesAndExposure}</div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-950 dark:text-rose-200 space-y-1">
                      <div className="font-bold font-mono text-[11px] uppercase flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                        <Flame className="w-3.5 h-3.5" /> The Common Damage Failure Point At This Stage
                      </div>
                      <p className="text-xs sm:text-sm leading-relaxed">
                        {m.failurePoint}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="font-bold font-mono text-[11px] uppercase text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> Action Checklist To Multiply Damage
                      </div>
                      <ul className="space-y-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-poe-dark/40 p-4 rounded-xl border border-slate-800">
                        {m.actionChecklist.map((step, idx) => (
                          <li key={idx} className="flex items-start gap-2 leading-relaxed">
                            <span className="text-amber-500 font-bold">✓</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 3: THE COMPLETE ENCYCLOPEDIA OF OFFENSIVE MECHANICS */}
      <section id="sec-offense-mechanics" className="space-y-8 pt-4">
        <div className="space-y-2 border-b border-slate-800 pb-3">
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            Part Three • Comprehensive Mechanics Reference
          </div>
          <h2 className="text-2xl sm:text-3xl font-poe font-bold text-slate-900 dark:text-slate-100">
            All Offensive Systems Explained in Plain English
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Deep dive encyclopedia entries on Gem Levels, Critical Strikes, Resistance Penetration, Physical Conversion, and Damage Over Time scaling.
          </p>
        </div>

        <div className="space-y-8">
          {OFFENSIVE_MECHANICS.map((mech) => (
            <article 
              key={mech.id}
              className="p-6 sm:p-8 rounded-3xl border border-slate-800 bg-slate-900/80 shadow-sm space-y-5 hover:border-amber-500/40 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-mono font-bold uppercase tracking-wider mb-1">
                    {mech.category}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-poe font-bold text-slate-900 dark:text-slate-100">
                    {mech.name}
                  </h3>
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                    {mech.tagline}
                  </p>
                </div>

                <div className="flex items-center gap-2.5 self-start sm:self-center">
                  <div className="px-3 py-1 rounded-xl bg-slate-50 dark:bg-poe-dark border border-slate-800 text-right">
                    <div className="text-[9px] text-slate-400 uppercase font-mono">Difficulty</div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{mech.difficulty}</div>
                  </div>
                  <div className="px-3 py-1 rounded-xl bg-slate-50 dark:bg-poe-dark border border-slate-800 text-right">
                    <div className="text-[9px] text-slate-400 uppercase font-mono">Timing</div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{mech.setupTime}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold uppercase font-mono text-slate-400 mb-1.5 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                      Plain English Concept
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-poe-dark/40 p-4 rounded-2xl border border-slate-800">
                      {mech.plainEnglish}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase font-mono text-rose-500 mb-1.5 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-rose-500" />
                      The Common Trap / Misconception
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-rose-500/10 p-4 rounded-2xl border border-rose-500/30 text-rose-950 dark:text-rose-200">
                      {mech.theTrap}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold uppercase font-mono text-amber-500 mb-1.5 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Target Rule of Thumb
                    </h4>
                    <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 bg-amber-500/10 p-4 rounded-2xl border border-amber-500/30 font-medium leading-relaxed">
                      {mech.ruleOfThumb}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase font-mono text-sky-500 mb-1.5 flex items-center gap-1.5">
                      <Crosshair className="w-3.5 h-3.5 text-sky-500" />
                      How to Scale in Solo Self Found
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-poe-dark/40 p-4 rounded-2xl border border-slate-800">
                      {mech.howToScale.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-2 leading-relaxed">
                          <span className="text-amber-500 font-bold">•</span>
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

      {/* SECTION 4: ARCHETYPE SCALING */}
      <section id="sec-archetypes" className="space-y-8 pt-4">
        <div className="space-y-2 border-b border-slate-800 pb-3">
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
            Part Four • Archetype Scaling Guide
          </div>
          <h2 className="text-2xl sm:text-3xl font-poe font-bold text-slate-900 dark:text-slate-100">
            Core Offensive Archetypes
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Detailed breakdown of how Spells, Attacks, Damage Over Time, and Minions scale differently across gearing and passive trees.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {OFFENSIVE_ARCHETYPES.map((arch) => (
            <article 
              key={arch.id}
              className="p-6 sm:p-8 rounded-3xl border border-slate-800 bg-slate-900/80 shadow-sm space-y-5 hover:border-amber-500/40 transition-all"
            >
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4 space-y-1">
                <h3 className="text-xl font-poe font-bold text-slate-900 dark:text-slate-100">
                  {arch.name}
                </h3>
                <p className="text-xs text-amber-600 dark:text-amber-400 font-mono font-semibold">
                  Scaling Focus: {arch.primaryScalingStat}
                </p>
              </div>

              <div className="space-y-3 text-xs sm:text-sm">
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-poe-dark/40 p-3.5 rounded-2xl border border-slate-800">
                  {arch.coreMechanic}
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-950 dark:text-emerald-200">
                    <div className="font-bold font-mono text-[10px] uppercase text-emerald-600 dark:text-emerald-400">Strengths</div>
                    <div>{arch.pros}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-950 dark:text-rose-200">
                    <div className="font-bold font-mono text-[10px] uppercase text-rose-600 dark:text-rose-400">Tradeoffs</div>
                    <div>{arch.cons}</div>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="font-bold font-mono text-[11px] uppercase text-slate-400">
                    SSF Gearing Priorities
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-poe-dark/40 p-3.5 rounded-2xl border border-slate-800">
                    {arch.ssfGearPriorities.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-500 font-bold">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

    </article>
  );
};
