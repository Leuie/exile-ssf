import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Shield, 
  Heart, 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Award,
  Crown,
  Columns
} from 'lucide-react';
import { 
  DEFENSE_MECHANICS, 
  CLASS_DEFENSIVE_BLUEPRINTS, 
  DEFENSIVE_MILESTONES,
  SUFFIX_PREFIX_ITEMS,
  PANTHEON_SOULS
} from '../data/defensesData';

export const DefenseMechanicsView: React.FC = () => {
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>('campaign');
  const [pantheonFilter, setPantheonFilter] = useState<'All' | 'Major' | 'Minor'>('All');

  const toggleMilestone = (id: string) => {
    setExpandedMilestone(prev => prev === id ? null : id);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const filteredPantheons = PANTHEON_SOULS.filter(
    p => pantheonFilter === 'All' || p.type === pantheonFilter
  );

  return (
    <article className="space-y-12 max-w-5xl mx-auto pb-24 text-slate-800 dark:text-slate-200 font-sans">
      
      {/* 1. Article Masthead */}
      <header className="relative rounded-3xl overflow-hidden border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-slate-100 to-white dark:from-emerald-950/20 dark:via-[#131622] dark:to-poe-darkest p-6 sm:p-10 shadow-2xl space-y-6">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-800 dark:text-emerald-300 font-semibold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Defensive Encyclopedia
            </span>
            <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 font-mono">
              <Clock className="w-3.5 h-3.5" /> 14 Min Comprehensive Read
            </span>
            <span className="text-slate-400 font-mono hidden sm:inline">•</span>
            <span className="text-slate-500 dark:text-slate-400 font-mono hidden sm:inline">Suffix Economics Included</span>
            <span className="text-slate-400 font-mono hidden sm:inline">•</span>
            <span className="text-slate-500 dark:text-slate-400 font-mono hidden sm:inline">Solo Self Found Verified</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-poe font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
            Defenses
          </h1>

          <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 max-w-3xl leading-relaxed font-serif">
            The definitive architectural guide to survivability, damage mitigation, suffix economics, and layering in Path of Exile 1. Written in plain English for exiles who want to stop dying and build truly sturdy characters.
          </p>

          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs sm:text-sm text-amber-950 dark:text-amber-200 flex items-start sm:items-center gap-3">
            <Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5 sm:mt-0" />
            <p className="leading-relaxed">
              <strong>The Golden Rule:</strong> Raw Life is not defense. In Path of Exile, 1 defensive layer equals sudden death, 2 layers is fragile, 3 layers is sturdy, and 4 overlapping layers makes you nearly immortal.
            </p>
          </div>
        </div>

        {/* Quick Navigation Anchor Bar */}
        <nav className="relative z-10 pt-4 border-t border-slate-200 dark:border-slate-200 dark:border-[#2d2d44] flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="text-slate-400 uppercase font-mono text-[10px] mr-1">Jump to:</span>
          <button 
            onClick={() => scrollToSection('sec-philosophy')}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-white dark:bg-[#1a1a2e] border border-slate-200 dark:border-slate-200 dark:border-[#2d2d44] hover:border-emerald-500 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-500" /> 1. The 4 Layers Framework
          </button>
          <button 
            onClick={() => scrollToSection('sec-milestones')}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-white dark:bg-[#1a1a2e] border border-slate-200 dark:border-slate-200 dark:border-[#2d2d44] hover:border-sky-500 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Award className="w-3.5 h-3.5 text-sky-500" /> 2. Progression Levers (Acts to T17)
          </button>
          <button 
            onClick={() => scrollToSection('sec-mechanics')}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-white dark:bg-[#1a1a2e] border border-slate-200 dark:border-slate-200 dark:border-[#2d2d44] hover:border-amber-500 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5 text-amber-500" /> 3. Mechanics Deep Dive
          </button>
          <button 
            onClick={() => scrollToSection('sec-classes')}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-white dark:bg-[#1a1a2e] border border-slate-200 dark:border-slate-200 dark:border-[#2d2d44] hover:border-purple-500 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Heart className="w-3.5 h-3.5 text-purple-500" /> 4. Class Blueprints
          </button>
          <button 
            onClick={() => scrollToSection('sec-suffixes')}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-white dark:bg-[#1a1a2e] border border-slate-200 dark:border-slate-200 dark:border-[#2d2d44] hover:border-rose-500 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Columns className="w-3.5 h-3.5 text-rose-500" /> 5. Suffix Economics
          </button>
          <button 
            onClick={() => scrollToSection('sec-pantheon')}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-white dark:bg-[#1a1a2e] border border-slate-200 dark:border-slate-200 dark:border-[#2d2d44] hover:border-cyan-500 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Crown className="w-3.5 h-3.5 text-cyan-500" /> 6. The Pantheon
          </button>
        </nav>
      </header>

      {/* Part 1: The Philosophy & Swiss Cheese Model */}
      <section id="sec-philosophy" className="space-y-6 pt-4">
        <div className="border-b border-slate-200 dark:border-slate-200 dark:border-[#2d2d44] pb-3">
          <span className="text-xs uppercase font-mono tracking-widest text-emerald-600 dark:text-emerald-400 font-bold">
            Part 1 • Architectural Foundations
          </span>
          <h2 className="text-2xl sm:text-3xl font-poe font-bold text-slate-900 dark:text-slate-100 mt-1">
            The 4 Layers of Defense (The Swiss Cheese Model)
          </h2>
        </div>

        <p className="text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
          In Path of Exile, single defensive mechanics have inherent flaws. Evasion does nothing when a spell hits you; Armour fails against massive elemental slams; pure Life pools get melted by Damage over Time. True tankiness is achieved by stacking defensive slices so the holes in one layer are completely covered by another:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl border border-sky-500/30 bg-sky-500/5 space-y-2">
            <div className="text-xs font-mono font-bold text-sky-600 dark:text-sky-400 uppercase">Layer 1 • Avoidance</div>
            <h3 className="font-poe font-bold text-lg text-slate-900 dark:text-slate-100">Don't Get Hit</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Evasion Rating (up to 95% attack evasion), Attack & Spell Block (up to 75% to 88%), Elusive buff, and Blind.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 space-y-2">
            <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase">Layer 2 • Mitigation</div>
            <h3 className="font-poe font-bold text-lg text-slate-900 dark:text-slate-100">Cut Damage in Half</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              100% Spell Suppression (50% less spell damage), 75% to 90% Elemental Resistances, Armour, and Fortify (20% less damage taken).
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-2">
            <div className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 uppercase">Layer 3 • Damage Shift</div>
            <h3 className="font-poe font-bold text-lg text-slate-900 dark:text-slate-100">Shift to Resistances</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Convert lethal Physical damage into Elemental damage (Lightning Coil, Cloak of Flame, Dawnbreaker, Eldritch Helmet implicits).
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-purple-500/30 bg-purple-500/5 space-y-2">
            <div className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400 uppercase">Layer 4 • Recovery</div>
            <h3 className="font-poe font-bold text-lg text-slate-900 dark:text-slate-100">Refill Immediately</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Instant Leech mastery, Life Gain on Hit, Consecrated Ground dual regen, Recoup, and automated utility Life Flasks.
            </p>
          </div>
        </div>
      </section>

      {/* Part 2: Progression Levers */}
      <section id="sec-milestones" className="space-y-6 pt-4">
        <div className="border-b border-slate-200 dark:border-slate-200 dark:border-[#2d2d44] pb-3">
          <span className="text-xs uppercase font-mono tracking-widest text-sky-600 dark:text-sky-400 font-bold">
            Part 2 • Milestones & Progression
          </span>
          <h2 className="text-2xl sm:text-3xl font-poe font-bold text-slate-900 dark:text-slate-100 mt-1">
            Progression Levers: What You Need at Every Stage
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Click each milestone to expand the exact survivability thresholds, aura recommendations, and failure points.
          </p>
        </div>

        <div className="space-y-3">
          {DEFENSIVE_MILESTONES.map((m) => {
            const isExpanded = expandedMilestone === m.id;
            return (
              <div 
                key={m.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-200 dark:border-[#2d2d44] bg-white dark:bg-white dark:bg-[#1a1a2e] overflow-hidden shadow-sm transition-all"
              >
                <button
                  onClick={() => toggleMilestone(m.id)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30 uppercase">
                      {m.badge}
                    </span>
                    <h3 className="text-base sm:text-lg font-poe font-bold text-slate-900 dark:text-slate-100">
                      {m.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 hidden sm:inline">{m.subtitle}</span>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-5 sm:p-6 border-t border-slate-100 dark:border-slate-200 dark:border-[#2d2d44] bg-slate-50/50 dark:bg-poe-dark/30 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                      <div className="p-3.5 rounded-xl bg-white dark:bg-white dark:bg-[#1a1a2e] border border-slate-200 dark:border-slate-200 dark:border-[#2d2d44] space-y-1">
                        <span className="text-slate-400 uppercase font-mono text-[10px]">Target Hit Pool</span>
                        <div className="font-bold text-emerald-600 dark:text-emerald-400">{m.targetPool}</div>
                      </div>
                      <div className="p-3.5 rounded-xl bg-white dark:bg-white dark:bg-[#1a1a2e] border border-slate-200 dark:border-slate-200 dark:border-[#2d2d44] space-y-1">
                        <span className="text-slate-400 uppercase font-mono text-[10px]">Resistances</span>
                        <div className="font-bold text-sky-600 dark:text-sky-400">{m.resistances}</div>
                      </div>
                      <div className="p-3.5 rounded-xl bg-white dark:bg-white dark:bg-[#1a1a2e] border border-slate-200 dark:border-slate-200 dark:border-[#2d2d44] space-y-1">
                        <span className="text-slate-400 uppercase font-mono text-[10px]">Core Mitigation</span>
                        <div className="font-bold text-amber-600 dark:text-amber-400">{m.coreMitigation}</div>
                      </div>
                      <div className="p-3.5 rounded-xl bg-white dark:bg-white dark:bg-[#1a1a2e] border border-slate-200 dark:border-slate-200 dark:border-[#2d2d44] space-y-1">
                        <span className="text-slate-400 uppercase font-mono text-[10px]">Recovery Engine</span>
                        <div className="font-bold text-purple-600 dark:text-purple-400">{m.recoveryAndFlasks}</div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs space-y-1">
                      <div className="font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" /> Common Failure Point at this stage
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{m.failurePoint}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs font-bold uppercase font-mono text-slate-700 dark:text-slate-300">Action Checklist:</div>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {m.actionChecklist.map((item, idx) => (
                          <li key={idx} className="p-2.5 rounded-lg bg-white dark:bg-white dark:bg-[#1a1a2e] border border-slate-200 dark:border-slate-200 dark:border-[#2d2d44] flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                            <span>{item}</span>
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

      {/* Part 3: Defensive Mechanics Deep Dive */}
      <section id="sec-mechanics" className="space-y-6 pt-4">
        <div className="border-b border-slate-200 dark:border-slate-200 dark:border-[#2d2d44] pb-3">
          <span className="text-xs uppercase font-mono tracking-widest text-amber-600 dark:text-amber-400 font-bold">
            Part 3 • Mechanics Reference
          </span>
          <h2 className="text-2xl sm:text-3xl font-poe font-bold text-slate-900 dark:text-slate-100 mt-1">
            The 10 Core Defensive Archetypes
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {DEFENSE_MECHANICS.map((mech) => (
            <article 
              key={mech.id}
              className="p-6 rounded-3xl border border-slate-200 dark:border-slate-200 dark:border-[#2d2d44] bg-white dark:bg-white dark:bg-[#1a1a2e] shadow-sm space-y-4 hover:border-amber-500/40 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-200 dark:border-[#2d2d44] pb-3">
                  <div>
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 uppercase">
                      {mech.category}
                    </span>
                    <h3 className="text-lg sm:text-xl font-poe font-bold text-slate-900 dark:text-slate-100 mt-1">
                      {mech.name}
                    </h3>
                  </div>
                  <div className="text-right text-[10px] font-mono text-slate-400">
                    <div>Diff: <span className="font-bold text-slate-700 dark:text-slate-200">{mech.difficulty}</span></div>
                    <div>{mech.setupTime}</div>
                  </div>
                </div>

                <p className="text-xs text-amber-700 dark:text-amber-300 font-medium italic">
                  "{mech.tagline}"
                </p>

                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {mech.plainEnglish}
                </p>

                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs space-y-0.5">
                  <div className="font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider text-[10px]">The Trap:</div>
                  <p className="text-slate-600 dark:text-slate-300">{mech.theTrap}</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-0.5">
                  <div className="font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider text-[10px]">Rule of Thumb:</div>
                  <p className="text-slate-600 dark:text-slate-300 font-medium">{mech.ruleOfThumb}</p>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] font-bold uppercase font-mono text-slate-400">How to Scale:</div>
                  <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                    {mech.howToScale.map((scale, sIdx) => (
                      <li key={sIdx} className="flex items-center gap-1.5">
                        <span className="text-amber-500 font-bold">•</span>
                        <span>{scale}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Part 4: Class Defensive Blueprints */}
      <section id="sec-classes" className="space-y-6 pt-4">
        <div className="border-b border-slate-200 dark:border-slate-200 dark:border-[#2d2d44] pb-3">
          <span className="text-xs uppercase font-mono tracking-widest text-purple-600 dark:text-purple-400 font-bold">
            Part 4 • Class Architecture
          </span>
          <h2 className="text-2xl sm:text-3xl font-poe font-bold text-slate-900 dark:text-slate-100 mt-1">
            Class Defensive Blueprints
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            How each character class solves survivability in Solo Self Found using native passive tree proximity and ascendancies.
          </p>
        </div>

        <div className="space-y-6">
          {CLASS_DEFENSIVE_BLUEPRINTS.map((cls) => (
            <article 
              key={cls.classId}
              className="p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-200 dark:border-[#2d2d44] bg-white dark:bg-white dark:bg-[#1a1a2e] shadow-sm space-y-5 hover:border-emerald-500/40 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-200 dark:border-[#2d2d44] pb-4">
                <div>
                  <span className="text-[10px] px-2.5 py-0.5 rounded font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 uppercase">
                    {cls.primaryArchetype}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-poe font-bold text-slate-900 dark:text-slate-100 mt-1">
                    {cls.className}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    {cls.identity}
                  </p>
                </div>

                <div className="px-3.5 py-1 rounded-xl bg-slate-50 dark:bg-poe-dark border border-slate-200 dark:border-slate-200 dark:border-[#2d2d44] self-start sm:self-center text-right">
                  <div className="text-[9px] text-slate-400 uppercase font-mono">Setup Difficulty</div>
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{cls.difficultyRating}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase font-mono text-slate-400">
                    Ascendancy Defensive Synergy
                  </h4>
                  <div className="space-y-2">
                    {cls.ascendancyHighlights.map((asc, idx) => (
                      <div key={idx} className="p-3 rounded-2xl bg-slate-50 dark:bg-poe-dark/40 border border-slate-200 dark:border-slate-200 dark:border-[#2d2d44] space-y-0.5">
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{asc.name}</div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">{asc.benefit}</div>
                      </div>
                    ))}
                  </div>

                  <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/30 space-y-1.5">
                    <div className="text-[11px] font-bold uppercase font-mono text-sky-700 dark:text-sky-300">
                      Recommended Core Auras
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {cls.coreAuras.map((aura, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-white dark:bg-poe-dark text-slate-800 dark:text-slate-200 text-[11px] font-medium border border-sky-500/20">
                          {aura}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase font-mono text-slate-400">
                    Practical SSF Gearing Advice
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-poe-dark/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-200 dark:border-[#2d2d44]">
                    {cls.ssfGearingTips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-2 leading-relaxed">
                        <span className="text-emerald-500 font-bold">✓</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
                    <div className="text-[11px] font-bold uppercase font-mono text-amber-700 dark:text-amber-300">
                      Key Passive Keystones
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {cls.keyKeystones.map((ks, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-white dark:bg-poe-dark text-slate-800 dark:text-slate-200 text-[11px] font-medium border border-amber-500/20">
                          {ks}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Part 5: The Suffix War & Suffix Economics */}
      <section id="sec-suffixes" className="space-y-6 pt-4">
        <div className="border-b border-slate-200 dark:border-slate-200 dark:border-[#2d2d44] pb-3">
          <span className="text-xs uppercase font-mono tracking-widest text-rose-600 dark:text-rose-400 font-bold">
            Part 5 • Suffix Economics
          </span>
          <h2 className="text-2xl sm:text-3xl font-poe font-bold text-slate-900 dark:text-slate-100 mt-1">
            The Suffix War: Why Suffixes Make or Break SSF
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            In Path of Exile rare equipment has up to 3 Prefixes and 3 Suffixes. In Solo Self Found, you almost always run out of Suffix slots before you can solve all your defensive requirements.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SUFFIX_PREFIX_ITEMS.map((item, idx) => (
            <div 
              key={idx}
              className={`p-6 rounded-3xl border ${
                item.type === 'Suffix' 
                  ? 'border-rose-500/40 bg-rose-500/5' 
                  : 'border-sky-500/40 bg-sky-500/5'
              } space-y-4`}
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-200 dark:border-[#2d2d44] pb-3">
                <span className={`text-xs font-mono font-bold uppercase px-2.5 py-0.5 rounded ${
                  item.type === 'Suffix' 
                    ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300' 
                    : 'bg-sky-500/20 text-sky-700 dark:text-sky-300'
                }`}>
                  {item.type} Slots (Max 3 per item)
                </span>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{item.statCategory}</span>
              </div>

              <div className="space-y-2">
                <div className="text-[11px] uppercase font-mono font-bold text-slate-400">Competing Modifiers:</div>
                <div className="flex flex-wrap gap-1.5">
                  {item.stats.map((stat, sIdx) => (
                    <span key={sIdx} className="px-2.5 py-1 rounded-lg bg-white dark:bg-white dark:bg-[#1a1a2e] text-xs font-medium text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-200 dark:border-[#2d2d44]">
                      {stat}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-white dark:bg-[#1a1a2e]/80 border border-slate-200 dark:border-slate-200 dark:border-[#2d2d44] text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <strong>SSF Strategy:</strong> {item.ssfStrategy}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Part 6: The Pantheon (Divine Vessel Captures) */}
      <section id="sec-pantheon" className="space-y-6 pt-4">
        <div className="border-b border-slate-200 dark:border-slate-200 dark:border-[#2d2d44] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs uppercase font-mono tracking-widest text-cyan-600 dark:text-cyan-400 font-bold">
              Part 6 • Hole Patching
            </span>
            <h2 className="text-2xl sm:text-3xl font-poe font-bold text-slate-900 dark:text-slate-100 mt-1">
              The Pantheon: Free Immunities & Boss Captures
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
              Place a Divine Vessel into your Map Device alongside the map to capture boss souls for permanent account immunities.
            </p>
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-center bg-white dark:bg-white dark:bg-[#1a1a2e] p-1 rounded-xl border border-slate-200 dark:border-slate-200 dark:border-[#2d2d44]">
            {(['All', 'Major', 'Minor'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setPantheonFilter(tab)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  pantheonFilter === tab
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPantheons.map((soul) => (
            <div 
              key={soul.id}
              className="p-5 rounded-3xl border border-slate-200 dark:border-slate-200 dark:border-[#2d2d44] bg-white dark:bg-white dark:bg-[#1a1a2e] shadow-sm space-y-4 hover:border-cyan-500/40 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-200 dark:border-[#2d2d44] pb-2.5">
                  <div className="flex items-center gap-2">
                    <Crown className={`w-4 h-4 ${soul.type === 'Major' ? 'text-amber-500' : 'text-cyan-500'}`} />
                    <h3 className="font-poe font-bold text-lg text-slate-900 dark:text-slate-100">
                      {soul.name}
                    </h3>
                  </div>
                  <span className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded ${
                    soul.type === 'Major' 
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30' 
                      : 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30'
                  }`}>
                    {soul.type} Soul
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">Base Power:</span>
                    <p className="text-slate-700 dark:text-slate-300">{soul.baseEffect}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 space-y-1">
                    <span className="text-[10px] uppercase font-mono font-bold text-cyan-700 dark:text-cyan-300 block">
                      Captured Upgrade Benefit:
                    </span>
                    <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">{soul.upgradeEffect}</p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-200 dark:border-[#2d2d44] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400">Capture Boss & Map:</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200">{soul.captureMap} ({soul.captureBoss})</div>
                </div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium italic">
                  {soul.whyItMatters}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </article>
  );
};
