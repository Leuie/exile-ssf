import React, { useState, useMemo } from 'react';
import {
  Compass,
  Search,
  CheckCircle2,
  Plus,
  Minus,
  Sparkles,
  AlertTriangle,
  Users
} from 'lucide-react';
import type { LeagueRosterMember, UserAccount } from '../../../types';
import { saveCloudRosterMember } from '../../../services/cloudSync';

interface MechanicsTabProps {
  activeSessionId: string;
  roster: LeagueRosterMember[];
  setRoster: React.Dispatch<React.SetStateAction<LeagueRosterMember[]>>;
  userAccount?: UserAccount | null;
  onOpenProfile?: (handle: string) => void;
  setCopyNotice: (msg: string | null) => void;
}

type MechanicRole = 'Crafting' | 'Currency & Mapping' | 'Bossing & Endgame' | 'League & Utility';

interface AtlasMechanicDef {
  id: string;
  name: string;
  aliases: string[];
  role: MechanicRole;
  priority: 'Core' | 'High' | 'Flex';
  keyDrops: string;
  ssfValue: string;
  synergy: string;
}

export const ALL_ATLAS_MECHANICS: AtlasMechanicDef[] = [
  {
    id: 'essences',
    name: 'Essences',
    aliases: ['essence'],
    role: 'Crafting',
    priority: 'Core',
    keyDrops: 'Deafening Essences, Remnants of Corruption (Horror / Delirium / Insanity)',
    ssfValue: 'Deterministic flat stat, resistance, and pseudo 6 link helmet crafting from Day 1.',
    synergy: 'Pairs smoothly with White/Yellow map speed farming or Harbinger.'
  },
  {
    id: 'expedition',
    name: 'Expedition (Rog / Tujen)',
    aliases: ['expedition', 'rog', 'tujen', 'gwennen', 'logbook'],
    role: 'Crafting',
    priority: 'Core',
    keyDrops: 'Rog Crafting Currency, Tujen Raw Orbs, Exotic Coinage, Logbooks',
    ssfValue: 'Unrivaled early to midgame 5x T1 rare armour, jewellery, and weapon crafting plus raw Divine/Chaos supply.',
    synergy: 'Stack pack size + Extreme Archaeology for single bomb map clears.'
  },
  {
    id: 'harvest',
    name: 'Harvest',
    aliases: ['harvest', 'lifeforce', 'horticrafting'],
    role: 'Crafting',
    priority: 'Core',
    keyDrops: 'Wild / Vivid / Primal Lifeforce, Sacred Blossom',
    ssfValue: 'Resistance swaps, Reforge Chaos/Life/Caster/Speed, Cluster Jewel rolling, and 1 to 1 fragment swaps.',
    synergy: 'Scales heavily with map Quantity, Pack Size, and Crop Rotation.'
  },
  {
    id: 'betrayal',
    name: 'Betrayal (Jun)',
    aliases: ['betrayal', 'jun', 'syndicate', 'veiled', 'catarina'],
    role: 'Crafting',
    priority: 'Core',
    keyDrops: 'Veiled Orbs, Crafting Bench Unlocks, Catarina Uniques, Safehouse Stashes',
    ssfValue: 'Mandatory veiled crafts (Trigger, +2 AoE/Support, Elreon -Mana Cost) and massive XP from Safehouses.',
    synergy: 'Run alongside Essence or Shrines for rapid intelligence gain.'
  },
  {
    id: 'bestiary',
    name: 'Bestiary (Einhar)',
    aliases: ['bestiary', 'einhar', 'beast', 'craicic', 'wild bristle', 'black morrigan'],
    role: 'Crafting',
    priority: 'High',
    keyDrops: 'Wild Bristle Matron (Metacrafts), Craicic Chimeral (Imprints), Fenrir / Farrul Uniques, Split Beasts',
    ssfValue: 'Essential for high end SSF metamod crafting (Suffixes Cannot Be Changed), 6 linking via Black Morrigan, and flask suffixes.',
    synergy: 'Farm in fast low tier or T16 maps with Herd Mentality + Natural Selection.'
  },
  {
    id: 'delirium',
    name: 'Delirium',
    aliases: ['delirium', 'cluster', 'simulacrum', 'deli'],
    role: 'Crafting',
    priority: 'High',
    keyDrops: 'Large / Medium / Small Cluster Jewels, Simulacrum Splinters, Delirium Orbs',
    ssfValue: 'Primary source of Cluster Jewels and Delirium Orbs for juiced endgame mapping.',
    synergy: 'Combines with Breach, Abyss, and Beyond for maximum reward tile progress.'
  },
  {
    id: 'blight',
    name: 'Blight',
    aliases: ['blight', 'oil', 'anoint', 'cassia'],
    role: 'Crafting',
    priority: 'High',
    keyDrops: 'Golden / Silver / Tainted Oils, Blighted & Blight Ravaged Maps',
    ssfValue: 'Mandatory Oils for amulet and ring Anoints plus steady raw currency and stacked decks.',
    synergy: 'Pairs with Delirium or Shrines; tower stuns carry undergeared builds.'
  },
  {
    id: 'delve',
    name: 'Delve (Niko)',
    aliases: ['delve', 'niko', 'fossil', 'resonator', 'aul'],
    role: 'Crafting',
    priority: 'High',
    keyDrops: 'Fossils, Resonators, Curse on Hit Rings, Aul Uprising, Minion/Aura Bases',
    ssfValue: 'Targeted Fossil crafting (Dense, Jagged, Faceted, Hollow) and fast safe XP scaling.',
    synergy: 'Take Packed with Energy in maps for free speed, damage, and max res.'
  },
  {
    id: 'incursion',
    name: 'Incursion (Alva)',
    aliases: ['incursion', 'alva', 'temple', 'atzoatl', 'double corrupt', 'locus'],
    role: 'Crafting',
    priority: 'High',
    keyDrops: 'Locus of Corruption (Double Corrupt), Doryani Institute (21/23 Gems), Temple Mod Rares',
    ssfValue: 'Only deterministic source of Double Corrupts and Tier 3 Gem Corruption chambers.',
    synergy: 'Massive extra monster pack density for Delirium and Beyond.'
  },
  {
    id: 'abyss',
    name: 'Abyss',
    aliases: ['abyss', 'stygian', 'jewel', 'amanamu', 'darkness enthroned'],
    role: 'Crafting',
    priority: 'High',
    keyDrops: 'Stygian Vise Belts, iLvl 86 Abyss Jewels, Darkness Enthroned, Amanamu Gaze',
    ssfValue: 'Core source of Corrupted Blood / Shock Avoid Abyss Jewels, Stygian Vises, and huge XP/hr.',
    synergy: 'Take Abyssal Army + Lightless Legion for massive monster count and XP.'
  },
  {
    id: 'breach',
    name: 'Breach',
    aliases: ['breach', 'chayula', 'xoph', 'tul', 'esh', 'uul'],
    role: 'Bossing & Endgame',
    priority: 'High',
    keyDrops: 'Breachstones, Grasping Mail (Global Defences), Skin of the Lords, Breach Rings',
    ssfValue: 'Top tier XP/hr density, Breachstone boss uniques, and Grasping Mail bases.',
    synergy: 'Combines directly with Delirium, Beyond, and Strongboxes.'
  },
  {
    id: 'legion',
    name: 'Legion',
    aliases: ['legion', 'timeless', 'emblem', 'maraketh', 'karui', 'vaals'],
    role: 'Bossing & Endgame',
    priority: 'High',
    keyDrops: 'Timeless Jewels (Lethal Pride, Brutal Restraint, Glorious Vanity, Militant Faith), Incubators, 6 Links',
    ssfValue: 'Mandatory for Timeless Jewel build enabling keystones and Ornate/Diviner Incubators.',
    synergy: 'Best on open layouts like Dunes or Cemetery with high clear speed.'
  },
  {
    id: 'heist',
    name: 'Heist',
    aliases: ['heist', 'blueprint', 'contract', 'replica', 'simplex'],
    role: 'League & Utility',
    priority: 'High',
    keyDrops: 'Replica Uniques, Experimented Bases (Simplex / Focused Amulets), Tempering & Tailoring Orbs',
    ssfValue: 'Exclusive source of Replica Alberon, Replica Dragonfang, Simplex Amulets, and early raw Chaos/Divines.',
    synergy: 'Run Smuggler Caches in maps to feed Blueprints to the squad Heist runner.'
  },
  {
    id: 'ritual',
    name: 'Ritual',
    aliases: ['ritual', 'omen', 'king in the mists', 'nameless'],
    role: 'League & Utility',
    priority: 'High',
    keyDrops: 'Crafting Omens, Synth & Fractured Bases, Ritual Base Types (Blizzard Crown), Nameless Seer',
    ssfValue: 'High value Omens (Blanching, Connections, Amelioration) and rare unique rerolls.',
    synergy: 'Scales with native map pack size and Rogue Exiles.'
  },
  {
    id: 'ultimatum',
    name: 'Ultimatum',
    aliases: ['ultimatum', 'catalyst', 'inscribed', 'trialmaster'],
    role: 'League & Utility',
    priority: 'Flex',
    keyDrops: 'Catalysts (Fertile, Prismatic, Turbulent), Inscribed Ultimatums, Mahuxotl Machination, Hateforge',
    ssfValue: 'Primary source of Jewellery Catalysts and double corrupted unique drops.',
    synergy: 'Best suited for tanky block or high regen builds that stand in the circle.'
  },
  {
    id: 'harbinger',
    name: 'Harbinger',
    aliases: ['harbinger', 'fracturing', 'ancient orb', 'annul'],
    role: 'Currency & Mapping',
    priority: 'High',
    keyDrops: 'Fracturing Shards, Ancient Orbs, Orbs of Annulment, Exalted Shards',
    ssfValue: 'Only deterministic source of Fracturing Orbs and steady Annulment / Ancient Orb supply.',
    synergy: 'Pairs effortlessly with Essences, Shrines, and Strongboxes.'
  },
  {
    id: 'altars',
    name: 'Searing Exarch & Eater Altars',
    aliases: ['exarch', 'eater', 'altar', 'eldritch', 'ichor', 'ember'],
    role: 'Currency & Mapping',
    priority: 'Core',
    keyDrops: 'Eldritch Ichors & Embers, Orbs of Conflict, Chaos / Sextant / Scarab Altars, Invitations',
    ssfValue: 'Mandatory for Eldritch implicits on Helmet, Gloves, Boots, and Body Armour plus steady raw currency.',
    synergy: 'Always active on T14+ maps alongside almost any other Atlas lane.'
  },
  {
    id: 'strongboxes',
    name: 'Shrines & Strongboxes',
    aliases: ['strongbox', 'shrine', 'ambush', 'domination'],
    role: 'Currency & Mapping',
    priority: 'Flex',
    keyDrops: 'Diviner / Arcanist / Operative Strongboxes, Corrupted 6 Links, Scarabs, Shrine Speed Buffs',
    ssfValue: 'Low investment map juice that boosts safety, movement speed, and Divination Card drops.',
    synergy: 'Great filler nodes on every Atlas tree.'
  },
  {
    id: 'beyond',
    name: 'Beyond',
    aliases: ['beyond', 'tainted', 'fusing', 'chromatic', 'mythic'],
    role: 'Currency & Mapping',
    priority: 'Flex',
    keyDrops: 'Tainted Fusings, Tainted Chromatics, Tainted Jewellers, Tainted Mythic Orbs',
    ssfValue: 'Essential for 6 linking and recoloring corrupted uniques and chest pieces.',
    synergy: 'Triggers constantly when paired with Breach, Abyss, or Incursion.'
  },
  {
    id: 'sanctum',
    name: 'Forbidden Sanctum',
    aliases: ['sanctum', 'lycia', 'tome', 'original sin', 'balance of terror'],
    role: 'Bossing & Endgame',
    priority: 'Flex',
    keyDrops: 'Raw Divine Orbs, Balance of Terror, Sandstorm Visage, Eternal Damnation, Relics',
    ssfValue: 'Fastest raw Divine Orb farm in SSF plus build enabling Sanctum uniques.',
    synergy: 'Funnel Forbidden Tomes from squad mappers to the dedicated Sanctum runner.'
  },
  {
    id: 'labyrinth',
    name: 'Labyrinth (Divine Font)',
    aliases: ['labyrinth', 'lab', 'transfigured', 'font', 'izaro'],
    role: 'League & Utility',
    priority: 'Core',
    keyDrops: 'Transfigured Skill Gems, Exceptional Gem Crafts, 20% Quality Flips, Grand Spectrum Jewels',
    ssfValue: 'Crucial on Days 1 to 3 so the whole squad unlocks mandatory Transfigured Gems quickly.',
    synergy: 'Run Offering of the Goddess / Gift to the Goddess with a fast movement build.'
  },
  {
    id: 'threads',
    name: 'Threads of Creation (3.30)',
    aliases: ['thread', 'umbra', 'coven', 'viscera'],
    role: 'Bossing & Endgame',
    priority: 'Core',
    keyDrops: '3.30 Covens of Umbra League Uniques, Threshold Loot Scaling, Anomaly Bosses',
    ssfValue: 'Current expansion flagship mechanic with 3, 6, and 8 Thread density and boss duplication thresholds.',
    synergy: 'Weave thresholds into high pack size T16 maps.'
  },
  {
    id: 'maven_bossing',
    name: 'Maven & Pinnacle Bossing',
    aliases: ['maven', 'boss', 'shaper', 'elder', 'conqueror', 'guardian', 'sirus'],
    role: 'Bossing & Endgame',
    priority: 'High',
    keyDrops: 'Awakened Gems, Orb of Conflict, Watchers Eye, Voidstones, Conqueror Exalts, Pinnacle Uniques',
    ssfValue: 'Carries squad Voidstones, Awakened Support Gems, and boss exclusive chase uniques.',
    synergy: 'Combine Guardian Map Drop wheels with Maven Witnessing.'
  },
  {
    id: 'settlers',
    name: 'Settlers (Kingsmarch / Ore)',
    aliases: ['settler', 'kingsmarch', 'ore', 'shipping', 'mappers', 'recombinator'],
    role: 'League & Utility',
    priority: 'Flex',
    keyDrops: 'Recombinator Crafts, Shipping Tattoos & Runes, Gold Driven Black Market Gambles',
    ssfValue: 'Passive currency, high tier bases, and Recombinator crafting power.',
    synergy: 'Benefits from high gold yield T16 and T17 maps.'
  },
  {
    id: 'torment',
    name: 'Torment (Ghosts)',
    aliases: ['torment', 'ghost', 'possessed'],
    role: 'Currency & Mapping',
    priority: 'Flex',
    keyDrops: 'Massive Item Rarity & Quantity on Possessed Bosses / Rogue Exiles',
    ssfValue: 'Used in high investment Unique hunting (Titanic / Ghosted Exiles) for Mageblood / Headhunter farming.',
    synergy: 'Combines with Rogue Exiles and Ritual.'
  }
];

export const MechanicsTab: React.FC<MechanicsTabProps> = ({
  activeSessionId,
  roster,
  setRoster,
  userAccount,
  onOpenProfile,
  setCopyNotice
}) => {
  const [search, setSearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<'All' | 'Unclaimed Gaps' | 'My Lanes' | MechanicRole>('All');
  const [savingId, setSavingId] = useState<string | null>(null);

  const myRosterMember = useMemo(() => {
    if (!userAccount?.displayName) return null;
    const h = userAccount.displayName.trim().toLowerCase();
    return roster.find((m) => m.displayName.trim().toLowerCase() === h) || null;
  }, [roster, userAccount]);

  const memberMatchesMechanic = (m: LeagueRosterMember, mech: AtlasMechanicDef) => {
    const lanes = Array.isArray(m.atlasContent) ? m.atlasContent : [];
    return lanes.some((lane) => {
      const low = lane.toLowerCase();
      return low === mech.name.toLowerCase() || mech.aliases.some((a) => low.includes(a));
    });
  };

  const toggleMyLane = async (mech: AtlasMechanicDef) => {
    if (!myRosterMember) {
      setCopyNotice('Join the league roster first to claim Atlas Mechanics!');
      setTimeout(() => setCopyNotice(null), 3500);
      return;
    }
    setSavingId(mech.id);
    const current = Array.isArray(myRosterMember.atlasContent) ? [...myRosterMember.atlasContent] : [];
    const alreadyHas = memberMatchesMechanic(myRosterMember, mech);
    const nextLanes = alreadyHas
      ? current.filter((lane) => {
          const low = lane.toLowerCase();
          return low !== mech.name.toLowerCase() && !mech.aliases.some((a) => low.includes(a));
        })
      : [...current, mech.name];

    const updatedMember: LeagueRosterMember = { ...myRosterMember, atlasContent: nextLanes };
    setRoster((prev) => prev.map((m) => (m.id === updatedMember.id ? updatedMember : m)));
    await saveCloudRosterMember(activeSessionId, updatedMember);
    setSavingId(null);
    setCopyNotice(alreadyHas ? `Removed "${mech.name}" from your Atlas lanes.` : `Claimed "${mech.name}" for @${myRosterMember.displayName}!`);
    setTimeout(() => setCopyNotice(null), 3000);
  };

  const enrichedMechanics = useMemo(() => {
    return ALL_ATLAS_MECHANICS.map((mech) => {
      const assigned = roster.filter((m) => memberMatchesMechanic(m, mech));
      const isMine = myRosterMember ? memberMatchesMechanic(myRosterMember, mech) : false;
      return { ...mech, assigned, isMine };
    });
  }, [roster, myRosterMember]);

  const coveredCount = enrichedMechanics.filter((m) => m.assigned.length > 0).length;
  const unclaimedCoreCount = enrichedMechanics.filter((m) => m.priority === 'Core' && m.assigned.length === 0).length;
  const myLaneCount = enrichedMechanics.filter((m) => m.isMine).length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enrichedMechanics.filter((m) => {
      if (roleFilter === 'Unclaimed Gaps' && m.assigned.length > 0) return false;
      if (roleFilter === 'My Lanes' && !m.isMine) return false;
      if (!['All', 'Unclaimed Gaps', 'My Lanes'].includes(roleFilter) && m.role !== roleFilter) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.keyDrops.toLowerCase().includes(q) ||
        m.ssfValue.toLowerCase().includes(q) ||
        m.assigned.some((p) => p.displayName.toLowerCase().includes(q))
      );
    });
  }, [enrichedMechanics, roleFilter, search]);

  return (
    <div className="space-y-5 pb-12 font-sans text-slate-200">
      {/* Header */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-[#0e1320] via-indigo-950/30 to-[#0e1320] p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-400 font-bold">
            <Compass className="w-4 h-4" />
            <span>Squad Atlas Specialization &amp; Niche Division</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-cinzel text-white tracking-tight">
            League Atlas Mechanics Matrix ({ALL_ATLAS_MECHANICS.length} Mechanics)
          </h2>
          <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
            Coordinate every Path of Exile endgame mechanic across your Group Self Found squad so no crafting resource, Timeless Jewel, Beast, or Boss Invitation goes unfarmed. Click <strong>Claim Lane</strong> on any mechanic to sync directly to your roster profile.
          </p>
        </div>

        {/* Coverage KPIs */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 font-mono text-xs">
          <div className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[10px] uppercase text-slate-500">Covered</div>
            <div className="text-base font-bold text-emerald-300">{coveredCount}/{ALL_ATLAS_MECHANICS.length}</div>
          </div>
          <div className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[10px] uppercase text-slate-500">Core Gaps</div>
            <div className={`text-base font-bold ${unclaimedCoreCount > 0 ? 'text-rose-400' : 'text-emerald-300'}`}>
              {unclaimedCoreCount}
            </div>
          </div>
          <div className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[10px] uppercase text-slate-500">My Lanes</div>
            <div className="text-base font-bold text-indigo-300">{myLaneCount}</div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="p-3.5 rounded-2xl border border-slate-800 bg-slate-900/75 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            ['All', 'Unclaimed Gaps', 'My Lanes', 'Crafting', 'Bossing & Endgame', 'Currency & Mapping', 'League & Utility'] as const
          ).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setRoleFilter(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                roleFilter === tab
                  ? tab === 'Unclaimed Gaps'
                    ? 'bg-rose-500/20 border-rose-400/60 text-rose-200'
                    : 'bg-indigo-600/30 border-indigo-400/60 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Bestiary, Harvest, Fossils..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-400"
          />
        </div>
      </div>

      {/* Mechanics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((mech) => {
          const isGap = mech.assigned.length === 0;
          return (
            <div
              key={mech.id}
              className={`p-4 rounded-2xl border flex flex-col justify-between gap-3.5 transition-all shadow ${
                mech.isMine
                  ? 'border-indigo-500/60 bg-gradient-to-b from-slate-900 to-indigo-950/25'
                  : isGap && mech.priority === 'Core'
                  ? 'border-rose-500/40 bg-slate-900/75'
                  : 'border-slate-800 bg-slate-900/75 hover:border-slate-700'
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${
                          mech.priority === 'Core'
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/35'
                            : mech.priority === 'High'
                            ? 'bg-sky-500/15 text-sky-300 border-sky-500/35'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {mech.priority}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">{mech.role}</span>
                    </div>
                    <h3 className="text-base font-bold text-white leading-snug">{mech.name}</h3>
                  </div>

                  {myRosterMember && (
                    <button
                      type="button"
                      disabled={savingId === mech.id}
                      onClick={() => toggleMyLane(mech)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 border shrink-0 cursor-pointer transition-colors disabled:opacity-50 ${
                        mech.isMine
                          ? 'bg-rose-500/15 hover:bg-rose-500/25 border-rose-500/40 text-rose-200'
                          : 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/40 text-emerald-200'
                      }`}
                    >
                      {mech.isMine ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                      <span>{mech.isMine ? 'Drop' : 'Claim'}</span>
                    </button>
                  )}
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="text-slate-300">
                    <span className="font-mono text-[10px] uppercase text-amber-400 font-bold">Key Drops: </span>
                    <span>{mech.keyDrops}</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">{mech.ssfValue}</p>
                  <div className="text-[11px] text-sky-300/90 flex items-start gap-1.5 pt-0.5">
                    <Sparkles className="w-3 h-3 text-sky-400 shrink-0 mt-0.5" />
                    <span>{mech.synergy}</span>
                  </div>
                </div>
              </div>

              {/* Assigned Squad Specialists */}
              <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  {mech.assigned.length === 0 ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-rose-300/90">
                      <AlertTriangle className="w-3 h-3 text-rose-400" />
                      <span>Unclaimed Lane</span>
                    </span>
                  ) : (
                    mech.assigned.map((member) => (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => onOpenProfile?.(member.displayName)}
                        className="px-2 py-0.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-200 text-[11px] font-mono font-semibold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>@{member.displayName}</span>
                      </button>
                    ))
                  )}
                </div>
                <span className="text-[10px] font-mono text-slate-500 inline-flex items-center gap-1">
                  <Users className="w-3 h-3" /> {mech.assigned.length}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
