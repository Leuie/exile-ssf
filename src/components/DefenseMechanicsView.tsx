import React, { useMemo, useState, useEffect } from 'react';
import {
  ShieldCheck,
  Shield,
  Heart,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Award,
  Crown,
  Columns,
  Calculator,
  Flame,
  Hammer,
  CheckSquare,
  Square,
  Download,
  RefreshCw
} from 'lucide-react';
import type { UserAccount } from '../types';
import { fetchActiveCharacterContext, resolvePobUrl } from '../services/cloudSync';
import { decodePoBCode, parsePoBXml } from '../utils/pobDecoder';
import {
  DEFENSE_MECHANICS,
  CLASS_DEFENSIVE_BLUEPRINTS,
  DEFENSIVE_MILESTONES,
  SUFFIX_PREFIX_ITEMS,
  PANTHEON_SOULS
} from '../data/defensesData';

type GameMode = 'poe1' | 'poe2';
type HitType = 'phys_attack' | 'ele_spell';

interface HitPreset {
  id: string;
  label: string;
  damage: number;
  type: HitType;
}

const POE1_PRESETS: HitPreset[] = [
  { id: 't16_rare', label: 'T16 Rare Slam (6,000 Phys)', damage: 6000, type: 'phys_attack' },
  { id: 'shaper', label: 'Shaper Slam (15,000 Phys)', damage: 15000, type: 'phys_attack' },
  { id: 't17_spell', label: 'T17 Boss Spell (18,000 Ele)', damage: 18000, type: 'ele_spell' }
];

const POE2_PRESETS: HitPreset[] = [
  { id: 't15_rare', label: 'Tier 15 Waystone Slam (4,500 Phys)', damage: 4500, type: 'phys_attack' },
  { id: 'pinnacle', label: 'Pinnacle Boss Slam (10,000 Phys)', damage: 10000, type: 'phys_attack' },
  { id: 'p2_ele', label: 'Endgame Elemental Blast (12,000 Ele)', damage: 12000, type: 'ele_spell' }
];

const POE1_RED_MAP_CHECKLIST = [
  'Elemental Resistances capped at 75% minimum (ideally 78% to 85% max res)',
  'Chaos Resistance at +20% or higher (never negative in T14+ Altars)',
  '100% Spell Suppression OR 75%+ Spell Block OR 85%+ All Max Res',
  'Freeze and Corrupted Blood immunity solved (Brine King Pantheon + Jewel implicit)',
  'At least 20% Physical Damage Taken as Elemental OR 20k+ Armour with Endurance Charges',
  'Automated Utility Flasks (Instilling Orbs: Used when charges reach full)',
  'Consistent Recovery Layer (Instant Leech, 600+ Life Regen, or Life Gain on Block)'
];

const POE2_WAYSTONE_CHECKLIST = [
  'All Elemental Resistances capped at 75% (swap Socketed Runes freely to patch holes)',
  'Chaos Resistance pushed above 40% before Tier 11+ Waystones and Rituals',
  'Charm Belt configured with Thawing (Freeze) and Staunching or Grounding Charms',
  'Combined Life + Energy Shield pool above 3,500 (or 5,000+ pure ES with Grim Feast)',
  'Stun Threshold solved (passives or Energy Shield Stun Threshold conversion)',
  'Honour Resistance capped at 75% via Relics before attempting 4th Ascendancy Sekhemas'
];

const POE2_DEFENSE_LAYERS = [
  {
    id: 'p2-armour',
    badge: 'Physical Mitigation',
    name: 'Armour & The 10x Heavy Hit Curve',
    tagline: 'Crushes swarm damage; needs Life and Block against Pinnacle slams.',
    plainEnglish:
      'In Path of Exile 2, Armour uses a steeper formula (Armour / (Armour + 10 * Hit)) than PoE 1. It excels at erasing rapid small hits from breaches and white mobs, while massive boss slams still punch through unless paired with high maximum Life or Block.',
    trap: 'Stacking pure Armour without maximum Life or Block leads to sudden deaths from telegraphed boss slams.',
    rule: 'Pair 12k+ Armour with a high Block shield or Dodge Roll discipline on telegraphed red flash attacks.'
  },
  {
    id: 'p2-evasion',
    badge: 'Avoidance',
    name: 'Evasion, Acrobatics & Dodge Roll',
    tagline: 'Avoids all projectiles and strikes; Acrobatics unlocks AoE avoidance.',
    plainEnglish:
      'Base Evasion in PoE 2 avoids both attacks and spell projectiles, but cannot evade ground AoE slams unless you allocate the Acrobatics keystone (at a 70% less Evasion penalty). Active Dodge Rolling grants brief invulnerability frames against strikes and projectiles.',
    trap: 'Taking Acrobatics too early before reaching 18k+ raw Evasion leaves your final evade chance painfully low.',
    rule: 'Run Wind Dancer for free more Evasion and pair Evasion bases with Energy Shield (Ghost Dance).'
  },
  {
    id: 'p2-es',
    badge: 'Hit Pool',
    name: 'Energy Shield & Grim Feast Overflow',
    tagline: 'The highest raw effective hit pool in Path of Exile 2 endgame.',
    plainEnglish:
      'Pure Energy Shield and Hybrid Life/ES builds dominate PoE 2 bossing because ES scales dramatically higher than raw Life on passive trees and chests. Grim Feast lets you pick up remnants from slain enemies to overflow ES up to 200% of maximum.',
    trap: 'Ignoring Stun and Ailment Thresholds: both scale off Maximum Life by default unless you take ES threshold passives.',
    rule: 'Allocate Energy Shield Stun Threshold and Freeze Threshold nodes immediately when transitioning to CI or high ES.'
  },
  {
    id: 'p2-block',
    badge: 'Active Defense',
    name: 'Passive Block & Active Raise Shield',
    tagline: 'Negates 100% of incoming frontal hits while managing Heavy Stun.',
    plainEnglish:
      'Shields grant passive Block chance against all non unblockable hits and unlock the Raise Shield skill to actively block 100% of frontal damage. Each blocked hit fills your Heavy Stun bar, so release block briefly between volleys.',
    trap: 'Holding Raise Shield through a red flash boss slam: unblockable attacks bypass passive and active block completely.',
    rule: 'Cap passive Block near 75% on shields and Dodge Roll every red flash slam.'
  },
  {
    id: 'p2-honour',
    badge: 'Trial of Sekhemas',
    name: 'Honour & Relic Resistance Layering',
    tagline: 'Your trial lifebar scales with Life + ES and is protected by Honour Resistance.',
    plainEnglish:
      'During the Trial of the Sekhemas, every hit damages your Honour pool. Maximum Honour equals your combined Life + Energy Shield (excluding overflow), and Honour Resistance from Relics reduces Honour loss by up to 75%.',
    trap: 'Entering a 3rd or 4th Ascendancy trial with 0% Honour Resistance turns minor trap grazes into instant run failures.',
    rule: 'Farm low floor trials first to assemble 75% Honour Resistance and Maximum Honour % relics before pushing Zarokh.'
  },
  {
    id: 'p2-charms',
    badge: 'Ailment Mitigation',
    name: 'Belt Charms & Chaos Resistance',
    tagline: 'Automatic reactive cleansing for Freeze, Stun, and Bleed.',
    plainEnglish:
      'Path of Exile 2 replaces utility flask piano with reactive Belt Charms that trigger automatically the instant an ailment hits you. Chaos damage deals double damage to Energy Shield unless you allocate Chaos Inoculation.',
    trap: 'Running a 1 Charm belt into Tier 15 Waystones without Freeze protection.',
    rule: 'Prioritize a Thawing Charm for Freeze immunity and keep a second charm slot for Stun or Poison on Chaos maps.'
  }
];

export const DefenseMechanicsView: React.FC<{ selectedGame?: 'poe1' | 'poe2'; userAccount?: UserAccount | null }> = ({
  selectedGame = 'poe1',
  userAccount
}) => {
  const [gameMode, setGameMode] = useState<GameMode>(selectedGame);
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>('campaign');
  const [pantheonFilter, setPantheonFilter] = useState<'All' | 'Major' | 'Minor'>('All');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [loadingCharPob, setLoadingCharPob] = useState<boolean>(false);
  const [loadedCharLabel, setLoadedCharLabel] = useState<string | null>(null);

  useEffect(() => {
    setGameMode(selectedGame);
  }, [selectedGame]);

  const handleLoadLeagueCharacterStats = async () => {
    if (!userAccount?.displayName) return;
    setLoadingCharPob(true);
    setLoadedCharLabel(null);
    try {
      const ctx = await fetchActiveCharacterContext(userAccount, gameMode);
      const pobUrl = ctx.member?.pobUrl || '';
      if (!pobUrl || !/pobb\.in\/[a-zA-Z0-9_-]{4,}/i.test(pobUrl)) {
        setLoadedCharLabel('No pobb.in link saved on your League Roster character yet.');
        return;
      }
      const resolved = await resolvePobUrl(pobUrl);
      if (resolved.status !== 'ok' || !resolved.code) {
        setLoadedCharLabel(resolved.error || 'Could not resolve saved pobb.in link.');
        return;
      }
      const parsed = parsePoBXml(decodePoBCode(resolved.code));
      const st = parsed.stats;
      setHpPool(Math.max(500, Math.round(st.life + st.energyShield)));
      setArmour(Math.max(0, Math.round(st.armour)));
      const minEleRes = Math.min(st.fireRes, st.coldRes, st.lightningRes);
      if (minEleRes > 0) setMaxEleRes(Math.min(90, Math.round(minEleRes)));
      setSuppressionCapped(st.spellSuppression >= 100);
      setLoadedCharLabel(`Loaded ${ctx.member?.characterName || parsed.characterName} (${Math.round(st.life + st.energyShield)} Pool, ${Math.round(st.armour).toLocaleString()} Armour)`);
    } catch {
      setLoadedCharLabel('Could not parse stats from your saved League PoB.');
    } finally {
      setLoadingCharPob(false);
    }
  };

  // Interactive EHP Calculator State
  const [hitDamage, setHitDamage] = useState<number>(6000);
  const [hitType, setHitType] = useState<HitType>('phys_attack');
  const [hpPool, setHpPool] = useState<number>(4800);
  const [armour, setArmour] = useState<number>(20000);
  const [maxEleRes, setMaxEleRes] = useState<number>(75);
  const [physTakenAsEle, setPhysTakenAsEle] = useState<number>(15);
  const [enduranceCharges, setEnduranceCharges] = useState<number>(3);
  const [suppressionCapped, setSuppressionCapped] = useState<boolean>(true);
  const [hasFortify, setHasFortify] = useState<boolean>(false);

  const handleSwitchGame = (next: GameMode) => {
    setGameMode(next);
    if (next === 'poe1') {
      setHitDamage(6000);
      setHitType('phys_attack');
      setHpPool(4800);
      setArmour(20000);
      setPhysTakenAsEle(15);
      setEnduranceCharges(3);
    } else {
      setHitDamage(4500);
      setHitType('phys_attack');
      setHpPool(3800);
      setArmour(12000);
      setPhysTakenAsEle(0);
      setEnduranceCharges(0);
    }
  };

  const applyPreset = (preset: HitPreset) => {
    setHitDamage(preset.damage);
    setHitType(preset.type);
  };

  const calcResult = useMemo(() => {
    const clampedRes = Math.min(90, Math.max(-60, maxEleRes));
    const clampedShift = gameMode === 'poe1' ? Math.min(80, Math.max(0, physTakenAsEle)) : 0;
    const clampedEnd = gameMode === 'poe1' ? Math.min(10, Math.max(0, enduranceCharges)) : 0;

    let finalDamage = hitDamage;

    if (hitType === 'phys_attack') {
      const shiftedEle = hitDamage * (clampedShift / 100);
      const remainingPhys = hitDamage - shiftedEle;

      // Armour DR: PoE 1 uses 5 * hit, PoE 2 uses 10 * hit
      const armourFactor = gameMode === 'poe1' ? 5 : 10;
      const armourDr = remainingPhys > 0 ? armour / (armour + armourFactor * remainingPhys) : 0;
      const endPdr = clampedEnd * 0.04;
      const totalPdr = Math.min(0.9, armourDr + endPdr);

      const physTaken = remainingPhys * (1 - totalPdr);
      const eleDrFromEnd = clampedEnd * 0.04;
      const eleTaken = shiftedEle * (1 - clampedRes / 100) * (1 - eleDrFromEnd);

      finalDamage = physTaken + eleTaken;
    } else {
      // Elemental Spell Hit
      const eleDrFromEnd = clampedEnd * 0.04;
      let eleTaken = hitDamage * (1 - clampedRes / 100) * (1 - eleDrFromEnd);
      if (gameMode === 'poe1' && suppressionCapped) {
        eleTaken *= 0.5;
      }
      finalDamage = eleTaken;
    }

    if (gameMode === 'poe1' && hasFortify) {
      finalDamage *= 0.8;
    }

    const mitigatedPct = hitDamage > 0 ? Math.max(0, Math.min(99.9, (1 - finalDamage / hitDamage) * 100)) : 0;
    const survives = hpPool > finalDamage;
    const remainingHp = Math.round(hpPool - finalDamage);
    const ehp = finalDamage > 0 ? Math.round(hpPool * (hitDamage / finalDamage)) : hpPool;

    return {
      finalDamage: Math.round(finalDamage),
      mitigatedPct: mitigatedPct.toFixed(1),
      survives,
      remainingHp,
      ehp
    };
  }, [gameMode, hitDamage, hitType, hpPool, armour, maxEleRes, physTakenAsEle, enduranceCharges, suppressionCapped, hasFortify]);

  const toggleMilestone = (id: string) => {
    setExpandedMilestone((prev) => (prev === id ? null : id));
  };

  const toggleChecklist = (key: string) => {
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const filteredPantheons = PANTHEON_SOULS.filter(
    (p) => pantheonFilter === 'All' || p.type === pantheonFilter
  );

  const activeChecklist = gameMode === 'poe1' ? POE1_RED_MAP_CHECKLIST : POE2_WAYSTONE_CHECKLIST;
  const activePresets = gameMode === 'poe1' ? POE1_PRESETS : POE2_PRESETS;
  const completedChecks = activeChecklist.filter((_, idx) => checkedItems[`${gameMode}-${idx}`]).length;

  return (
    <article className="space-y-8 w-full pb-20 font-sans text-slate-200">
      {/* 1. Modernized Header Masthead */}
      <header className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-[#0e1320] via-[#111827] to-[#0b0f19] p-5 sm:p-6 shadow-xl space-y-4">
        <div className="absolute -top-16 -right-16 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-widest text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              Survivability & Mitigation Masterclass
            </div>
            <h1 className="text-2xl sm:text-3xl font-cinzel font-bold tracking-tight text-white">
              Defenses & EHP Architecture
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Test your real mitigation against pinnacle boss hits, audit your character before red maps or Tier 15 Waystones, and master defensive layering for both Path of Exile 1 and Path of Exile 2.
            </p>
          </div>

          {/* PoE 1 / PoE 2 Switcher */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-950/90 border border-indigo-500/25 self-start lg:self-center">
            <button
              type="button"
              onClick={() => handleSwitchGame('poe1')}
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
              onClick={() => handleSwitchGame('poe2')}
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
            <button type="button" onClick={() => scrollToSection('sec-calc')} className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-emerald-400/60 text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer">
              <Calculator className="w-3.5 h-3.5 text-emerald-400" /> EHP Calculator
            </button>
            <button type="button" onClick={() => scrollToSection('sec-philosophy')} className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-sky-400/60 text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer">
              <Layers className="w-3.5 h-3.5 text-sky-400" /> 4 Layers
            </button>
            <button type="button" onClick={() => scrollToSection('sec-milestones')} className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-amber-400/60 text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer">
              <Award className="w-3.5 h-3.5 text-amber-400" /> Progression
            </button>
            <button type="button" onClick={() => scrollToSection('sec-mechanics')} className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-purple-400/60 text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer">
              <Shield className="w-3.5 h-3.5 text-purple-400" /> Archetypes
            </button>
            <button type="button" onClick={() => scrollToSection('sec-classes')} className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-indigo-400/60 text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer">
              <Heart className="w-3.5 h-3.5 text-indigo-400" /> Classes
            </button>
            <button type="button" onClick={() => scrollToSection('sec-suffixes')} className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-rose-400/60 text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer">
              <Columns className="w-3.5 h-3.5 text-rose-400" /> Suffixes
            </button>
            <button type="button" onClick={() => scrollToSection('sec-pantheon')} className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-cyan-400/60 text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer">
              <Crown className="w-3.5 h-3.5 text-cyan-400" /> Pantheon
            </button>
          </nav>
        )}
      </header>

      {/* 2. Interactive EHP & Mitigation Calculator */}
      <section id="sec-calc" className="rounded-2xl border border-emerald-500/30 bg-slate-900/85 p-5 sm:p-6 shadow-lg space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              {userAccount && (
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={loadingCharPob}
                    onClick={handleLoadLeagueCharacterStats}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {loadingCharPob ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                    <span>{loadingCharPob ? 'Pulling League PoB...' : 'Load My League PoB Stats'}</span>
                  </button>
                  {loadedCharLabel && (
                    <span className="text-[11px] font-mono text-sky-300">{loadedCharLabel}</span>
                  )}
                </div>
              )}
              <h2 className="text-base sm:text-lg font-cinzel font-bold text-white">
                Interactive Hit Mitigation & EHP Calculator ({gameMode === 'poe1' ? 'PoE 1 Formula' : 'PoE 2 Formula'})
              </h2>
              <p className="text-xs text-slate-400">
                Simulate real damage taken against endgame slams using the exact {gameMode === 'poe1' ? '5x Armour curve, Shift, Suppression, and Endurance Charges' : '10x PoE 2 Armour curve and Elemental Resistances'}.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {activePresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                  hitDamage === preset.damage && hitType === preset.type
                    ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-200'
                    : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-600'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Inputs Grid */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs">
            <label className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5 block">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Incoming Hit Damage</span>
              <input
                type="number"
                min={100}
                step={500}
                value={hitDamage}
                onChange={(e) => setHitDamage(Math.max(100, Number(e.target.value) || 0))}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono font-bold focus:outline-none focus:border-emerald-400"
              />
              <div className="flex gap-1 pt-1">
                <button
                  type="button"
                  onClick={() => setHitType('phys_attack')}
                  className={`flex-1 py-1 rounded text-[10px] font-bold cursor-pointer ${
                    hitType === 'phys_attack' ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40' : 'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}
                >
                  Phys Hit
                </button>
                <button
                  type="button"
                  onClick={() => setHitType('ele_spell')}
                  className={`flex-1 py-1 rounded text-[10px] font-bold cursor-pointer ${
                    hitType === 'ele_spell' ? 'bg-sky-500/25 text-sky-300 border border-sky-500/40' : 'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}
                >
                  Ele Spell
                </button>
              </div>
            </label>

            <label className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5 block">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Total Life + ES Pool</span>
              <input
                type="number"
                min={500}
                step={250}
                value={hpPool}
                onChange={(e) => setHpPool(Math.max(1, Number(e.target.value) || 1))}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-emerald-300 font-mono font-bold focus:outline-none focus:border-emerald-400"
              />
              <span className="text-[10px] text-slate-500 block">Combined raw hit pool</span>
            </label>

            <label className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5 block">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Armour Rating</span>
              <input
                type="number"
                min={0}
                step={2500}
                value={armour}
                onChange={(e) => setArmour(Math.max(0, Number(e.target.value) || 0))}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-amber-300 font-mono font-bold focus:outline-none focus:border-emerald-400"
              />
              <span className="text-[10px] text-slate-500 block">
                {gameMode === 'poe1' ? 'PoE 1: Armour / (Armour + 5x Hit)' : 'PoE 2: Armour / (Armour + 10x Hit)'}
              </span>
            </label>

            <label className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5 block">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Max Elemental Res (%)</span>
              <input
                type="number"
                min={0}
                max={90}
                value={maxEleRes}
                onChange={(e) => setMaxEleRes(Math.min(90, Math.max(0, Number(e.target.value) || 0)))}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-sky-300 font-mono font-bold focus:outline-none focus:border-emerald-400"
              />
              <span className="text-[10px] text-slate-500 block">75% baseline, 90% hard cap</span>
            </label>

            {gameMode === 'poe1' && (
              <>
                <label className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5 block">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Phys Taken As Ele (%)</span>
                  <input
                    type="number"
                    min={0}
                    max={80}
                    value={physTakenAsEle}
                    onChange={(e) => setPhysTakenAsEle(Math.min(80, Math.max(0, Number(e.target.value) || 0)))}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-purple-300 font-mono font-bold focus:outline-none focus:border-emerald-400"
                  />
                  <span className="text-[10px] text-slate-500 block">Helm implicits, Cloak of Flame</span>
                </label>

                <label className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5 block">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Endurance Charges (4% PDR/Ele)</span>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={enduranceCharges}
                    onChange={(e) => setEnduranceCharges(Math.min(10, Math.max(0, Number(e.target.value) || 0)))}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-rose-300 font-mono font-bold focus:outline-none focus:border-emerald-400"
                  />
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setSuppressionCapped((v) => !v)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border cursor-pointer ${
                        suppressionCapped ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300' : 'bg-slate-900 border-slate-700 text-slate-400'
                      }`}
                    >
                      100% Suppress
                    </button>
                    <button
                      type="button"
                      onClick={() => setHasFortify((v) => !v)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border cursor-pointer ${
                        hasFortify ? 'bg-amber-500/20 border-amber-400/50 text-amber-300' : 'bg-slate-900 border-slate-700 text-slate-400'
                      }`}
                    >
                      Fortify (20%)
                    </button>
                  </div>
                </label>
              </>
            )}
          </div>

          {/* Live Output Readout */}
          <div
            className={`lg:col-span-4 p-4 rounded-2xl border flex flex-col justify-between space-y-4 ${
              calcResult.survives
                ? 'bg-emerald-950/25 border-emerald-500/40'
                : 'bg-rose-950/30 border-rose-500/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase text-slate-300">Simulation Result</span>
              <span
                className={`px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold uppercase ${
                  calcResult.survives
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50'
                    : 'bg-rose-500/25 text-rose-300 border border-rose-400/50'
                }`}
              >
                {calcResult.survives ? 'Survived Hit' : 'Lethal One Shot'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="text-[10px] font-mono uppercase text-slate-400">Damage Taken</div>
                <div className="text-xl font-mono font-bold text-white mt-0.5">
                  {calcResult.finalDamage.toLocaleString()}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="text-[10px] font-mono uppercase text-slate-400">Total Mitigated</div>
                <div className="text-xl font-mono font-bold text-emerald-400 mt-0.5">
                  {calcResult.mitigatedPct}%
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono uppercase text-[10px]">Effective Hit Pool</span>
              <span className="font-mono font-bold text-amber-300 text-sm">
                {calcResult.ehp.toLocaleString()} EHP
              </span>
            </div>

            <div className="text-xs text-slate-300 leading-relaxed">
              {calcResult.survives ? (
                <span>
                  You survive with <strong className="text-emerald-300">{calcResult.remainingHp.toLocaleString()} HP</strong> remaining.
                </span>
              ) : (
                <span>
                  Overkill by <strong className="text-rose-300">{Math.abs(calcResult.remainingHp).toLocaleString()} damage</strong>. Add Phys Shift, Max Res, or a larger Hit Pool.
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Interactive SSF Pre Red Maps / Pre T15 Waystone Checklist */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400">
              Interactive SSF Audit
            </div>
            <h2 className="text-base sm:text-lg font-cinzel font-bold text-white">
              {gameMode === 'poe1'
                ? 'Defense Checklist Before Red Maps (T14+)'
                : 'Defense Checklist Before Tier 15 Waystones'}
            </h2>
          </div>
          <span className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-emerald-400 self-start sm:self-center">
            {completedChecks} / {activeChecklist.length} Verified
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {activeChecklist.map((item, idx) => {
            const key = `${gameMode}-${idx}`;
            const checked = !!checkedItems[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleChecklist(key)}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 text-xs transition-all cursor-pointer ${
                  checked
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                {checked ? (
                  <CheckSquare className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                )}
                <span className={checked ? 'line-through opacity-80' : ''}>{item}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* POE 2 DEDICATED DEFENSE GUIDE */}
      {gameMode === 'poe2' ? (
        <section className="space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <span className="text-xs uppercase font-mono tracking-widest text-amber-400 font-bold">
              Path of Exile 2 Survivability Architecture
            </span>
            <h2 className="text-2xl font-cinzel font-bold text-white mt-1">
              Core PoE 2 Defensive Layers
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {POE2_DEFENSE_LAYERS.map((layer) => (
              <article
                key={layer.id}
                className="p-5 rounded-2xl border border-slate-800 bg-slate-900/85 hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 uppercase">
                        {layer.badge}
                      </span>
                      <h3 className="text-lg font-cinzel font-bold text-white mt-1">{layer.name}</h3>
                    </div>
                  </div>
                  <p className="text-xs text-amber-300 font-medium italic">"{layer.tagline}"</p>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{layer.plainEnglish}</p>
                </div>

                <div className="space-y-2.5 pt-1">
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs space-y-0.5">
                    <div className="font-bold text-rose-300 uppercase tracking-wider text-[10px]">Common Trap:</div>
                    <p className="text-slate-300">{layer.trap}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs space-y-0.5">
                    <div className="font-bold text-emerald-300 uppercase tracking-wider text-[10px]">SSF Rule of Thumb:</div>
                    <p className="text-slate-200 font-medium">{layer.rule}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <>
          {/* POE 1 SECTION 1: THE 4 LAYERS FRAMEWORK */}
          <section id="sec-philosophy" className="space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <span className="text-xs uppercase font-mono tracking-widest text-emerald-400 font-bold">
                Part 1 • Architectural Foundations
              </span>
              <h2 className="text-2xl font-cinzel font-bold text-white mt-1">
                The 4 Layers of Defense (The Swiss Cheese Model)
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl border border-sky-500/30 bg-sky-500/5 space-y-2">
                <div className="text-xs font-mono font-bold text-sky-400 uppercase">Layer 1 • Avoidance</div>
                <h3 className="font-cinzel font-bold text-lg text-white">Avoid the Hit</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Evasion Rating (up to 95% attack evasion), Attack & Spell Block (up to 75% to 88%), Elusive buff, and Blind.
                </p>
              </div>
              <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 space-y-2">
                <div className="text-xs font-mono font-bold text-emerald-400 uppercase">Layer 2 • Mitigation</div>
                <h3 className="font-cinzel font-bold text-lg text-white">Cut Damage in Half</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  100% Spell Suppression (50% less spell damage), 75% to 90% Elemental Resistances, Armour, Endurance Charges, and Fortify.
                </p>
              </div>
              <div className="p-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-2">
                <div className="text-xs font-mono font-bold text-amber-400 uppercase">Layer 3 • Damage Shift</div>
                <h3 className="font-cinzel font-bold text-lg text-white">Shift to Resistances</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Convert lethal Physical damage into Elemental damage (Lightning Coil, Cloak of Flame, Dawnbreaker, Eldritch Helmet implicits).
                </p>
              </div>
              <div className="p-5 rounded-2xl border border-purple-500/30 bg-purple-500/5 space-y-2">
                <div className="text-xs font-mono font-bold text-purple-400 uppercase">Layer 4 • Recovery</div>
                <h3 className="font-cinzel font-bold text-lg text-white">Refill Immediately</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Instant Leech mastery, Life Gain on Hit, Consecrated Ground regen, Recoup (3.30 verified), and automated flasks.
                </p>
              </div>
            </div>
          </section>

          {/* POE 1 SECTION 2: PROGRESSION LEVERS */}
          <section id="sec-milestones" className="space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <span className="text-xs uppercase font-mono tracking-widest text-sky-400 font-bold">
                Part 2 • Milestones & Progression
              </span>
              <h2 className="text-2xl font-cinzel font-bold text-white mt-1">
                Progression Levers: What You Need at Every Stage
              </h2>
            </div>

            <div className="space-y-3">
              {DEFENSIVE_MILESTONES.map((m) => {
                const isExpanded = expandedMilestone === m.id;
                return (
                  <div
                    key={m.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900/85 overflow-hidden transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => toggleMilestone(m.id)}
                      className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors cursor-pointer"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30 uppercase">
                          {m.badge}
                        </span>
                        <h3 className="text-base sm:text-lg font-cinzel font-bold text-white">{m.title}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 hidden sm:inline">{m.subtitle}</span>
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="p-5 border-t border-slate-800 bg-slate-950/60 space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                            <span className="text-slate-400 uppercase font-mono text-[10px]">Target Hit Pool</span>
                            <div className="font-bold text-emerald-400">{m.targetPool}</div>
                          </div>
                          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                            <span className="text-slate-400 uppercase font-mono text-[10px]">Resistances</span>
                            <div className="font-bold text-sky-400">{m.resistances}</div>
                          </div>
                          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                            <span className="text-slate-400 uppercase font-mono text-[10px]">Core Mitigation</span>
                            <div className="font-bold text-amber-400">{m.coreMitigation}</div>
                          </div>
                          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                            <span className="text-slate-400 uppercase font-mono text-[10px]">Recovery Engine</span>
                            <div className="font-bold text-purple-400">{m.recoveryAndFlasks}</div>
                          </div>
                        </div>

                        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs space-y-1">
                          <div className="font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4" /> Common Failure Point at this stage
                          </div>
                          <p className="text-slate-300 leading-relaxed">{m.failurePoint}</p>
                        </div>

                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {m.actionChecklist.map((item, idx) => (
                            <li key={idx} className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-start gap-2 text-slate-200">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                              <span>{item}</span>
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

          {/* POE 1 SECTION 3: CORE DEFENSIVE ARCHETYPES */}
          <section id="sec-mechanics" className="space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <span className="text-xs uppercase font-mono tracking-widest text-amber-400 font-bold">
                Part 3 • Mechanics Reference
              </span>
              <h2 className="text-2xl font-cinzel font-bold text-white mt-1">
                The 10 Core Defensive Archetypes
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {DEFENSE_MECHANICS.map((mech) => (
                <article
                  key={mech.id}
                  className="p-5 rounded-2xl border border-slate-800 bg-slate-900/85 hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 uppercase">
                          {mech.category}
                        </span>
                        <h3 className="text-lg font-cinzel font-bold text-white mt-1">{mech.name}</h3>
                      </div>
                      <div className="text-right text-[10px] font-mono text-slate-400">
                        <div>Diff: <span className="font-bold text-slate-200">{mech.difficulty}</span></div>
                        <div>{mech.setupTime}</div>
                      </div>
                    </div>

                    <p className="text-xs text-amber-300 font-medium italic">"{mech.tagline}"</p>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{mech.plainEnglish}</p>

                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs space-y-0.5">
                      <div className="font-bold text-rose-300 uppercase tracking-wider text-[10px]">The Trap:</div>
                      <p className="text-slate-300">{mech.theTrap}</p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-1">
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-0.5">
                      <div className="font-bold text-emerald-300 uppercase tracking-wider text-[10px]">Rule of Thumb:</div>
                      <p className="text-slate-200 font-medium">{mech.ruleOfThumb}</p>
                    </div>

                    <ul className="space-y-1 text-xs text-slate-300">
                      {mech.howToScale.map((scale, sIdx) => (
                        <li key={sIdx} className="flex items-start gap-1.5">
                          <span className="text-amber-400 font-bold">•</span>
                          <span>{scale}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* POE 1 SECTION 4: CLASS BLUEPRINTS */}
          <section id="sec-classes" className="space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <span className="text-xs uppercase font-mono tracking-widest text-purple-400 font-bold">
                Part 4 • Class Architecture
              </span>
              <h2 className="text-2xl font-cinzel font-bold text-white mt-1">
                Class Defensive Blueprints
              </h2>
            </div>

            <div className="space-y-5">
              {CLASS_DEFENSIVE_BLUEPRINTS.map((cls) => (
                <article
                  key={cls.classId}
                  className="p-5 sm:p-6 rounded-2xl border border-slate-800 bg-slate-900/85 hover:border-emerald-500/40 transition-all space-y-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                    <div>
                      <span className="text-[10px] px-2.5 py-0.5 rounded font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 uppercase">
                        {cls.primaryArchetype}
                      </span>
                      <h3 className="text-xl font-cinzel font-bold text-white mt-1">{cls.className}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{cls.identity}</p>
                    </div>
                    <div className="px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 self-start sm:self-center text-right">
                      <div className="text-[9px] text-slate-400 uppercase font-mono">Setup Difficulty</div>
                      <div className="text-xs font-bold text-emerald-400">{cls.difficultyRating}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase font-mono text-slate-400">Ascendancy Synergy</h4>
                      <div className="space-y-2">
                        {cls.ascendancyHighlights.map((asc, idx) => (
                          <div key={idx} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-0.5">
                            <div className="text-xs font-bold text-white">{asc.name}</div>
                            <div className="text-[11px] text-slate-300 leading-relaxed">{asc.benefit}</div>
                          </div>
                        ))}
                      </div>
                      <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/25 space-y-1.5">
                        <div className="text-[10px] font-bold uppercase font-mono text-sky-300">Core Auras</div>
                        <div className="flex flex-wrap gap-1.5">
                          {cls.coreAuras.map((aura, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-md bg-slate-950 text-slate-200 text-[11px] font-medium border border-sky-500/25">
                              {aura}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase font-mono text-slate-400">Practical SSF Gearing</h4>
                      <ul className="space-y-2 text-xs text-slate-300 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                        {cls.ssfGearingTips.map((tip, idx) => (
                          <li key={idx} className="flex items-start gap-2 leading-relaxed">
                            <span className="text-emerald-400 font-bold">✓</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-1.5">
                        <div className="text-[10px] font-bold uppercase font-mono text-amber-300">Key Keystones</div>
                        <div className="flex flex-wrap gap-1.5">
                          {cls.keyKeystones.map((ks, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-md bg-slate-950 text-slate-200 text-[11px] font-medium border border-amber-500/25">
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

          {/* POE 1 SECTION 5: SUFFIX ECONOMICS */}
          <section id="sec-suffixes" className="space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <span className="text-xs uppercase font-mono tracking-widest text-rose-400 font-bold">
                Part 5 • Suffix Economics
              </span>
              <h2 className="text-2xl font-cinzel font-bold text-white mt-1">
                The Suffix War: Why Suffixes Make or Break SSF
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {SUFFIX_PREFIX_ITEMS.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-5 rounded-2xl border space-y-4 ${
                    item.type === 'Suffix'
                      ? 'border-rose-500/35 bg-rose-500/5'
                      : 'border-sky-500/35 bg-sky-500/5'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span
                      className={`text-xs font-mono font-bold uppercase px-2.5 py-0.5 rounded ${
                        item.type === 'Suffix'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-sky-500/20 text-sky-300'
                      }`}
                    >
                      {item.type} Slots (Max 3 per item)
                    </span>
                    <span className="text-xs font-bold text-slate-300">{item.statCategory}</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {item.stats.map((stat, sIdx) => (
                      <span
                        key={sIdx}
                        className="px-2.5 py-1 rounded-lg bg-slate-950/80 text-xs font-medium text-slate-200 border border-slate-800"
                      >
                        {stat}
                      </span>
                    ))}
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                    <strong className="text-amber-300">SSF Strategy:</strong> {item.ssfStrategy}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* POE 1 SECTION 6: THE PANTHEON */}
          <section id="sec-pantheon" className="space-y-5">
            <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase font-mono tracking-widest text-cyan-400 font-bold">
                  Part 6 • Hole Patching
                </span>
                <h2 className="text-2xl font-cinzel font-bold text-white mt-1">
                  The Pantheon: Free Immunities & Boss Captures
                </h2>
              </div>

              <div className="flex items-center gap-1.5 self-start sm:self-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                {(['All', 'Major', 'Minor'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setPantheonFilter(tab)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      pantheonFilter === tab
                        ? 'bg-cyan-500 text-slate-950'
                        : 'text-slate-300 hover:text-white'
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
                  className="p-5 rounded-2xl border border-slate-800 bg-slate-900/85 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Crown className={`w-4 h-4 ${soul.type === 'Major' ? 'text-amber-400' : 'text-cyan-400'}`} />
                        <h3 className="font-cinzel font-bold text-base text-white">{soul.name}</h3>
                      </div>
                      <span
                        className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded ${
                          soul.type === 'Major'
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                        }`}
                      >
                        {soul.type} Soul
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <p className="text-slate-300">{soul.baseEffect}</p>
                      <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 space-y-1">
                        <span className="text-[10px] uppercase font-mono font-bold text-cyan-300 block">
                          Captured Upgrade:
                        </span>
                        <p className="text-slate-200 font-medium leading-relaxed">{soul.upgradeEffect}</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="font-bold text-slate-200">
                      {soul.captureMap} ({soul.captureBoss})
                    </div>
                    <div className="text-[11px] text-emerald-400 font-medium italic">
                      {soul.whyItMatters}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </article>
  );
};
