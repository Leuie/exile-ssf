import React, { useMemo, useState } from 'react';
import {
  Sparkles,
  BookOpen,
  ExternalLink,
  Check,
  Copy,
  AlertTriangle,
  Search,
  ChevronDown,
  ChevronUp,
  Hammer,
  Flame,
  Filter
} from 'lucide-react';
import { VENDOR_RECIPES } from '../data/knowledgeBase';

type GameMode = 'poe1' | 'poe2';

interface NormalizedRecipe {
  id: string;
  game: GameMode;
  title: string;
  category: string;
  categoryLabel: string;
  components: string[];
  reward: string;
  usageNotes: string;
  poeWikiUrl?: string;
  stashRegex?: string;
}

interface QuickRegex {
  id: string;
  label: string;
  regex: string;
  hint: string;
}

const POE1_QUICK_REGEXES: QuickRegex[] = [
  { id: 'rgb', label: 'RGB Chromatic', regex: 'r-g-b|r-b-g|g-r-b|g-b-r|b-r-g|b-g-r', hint: 'Highlights linked Red, Green, Blue sockets for 1x Chromatic Orb' },
  { id: '6s', label: '6 Socket Items', regex: 'sockets:.*6', hint: 'Highlights 6 socket gear to vendor for 7x Jeweller Orbs' },
  { id: 'q20', label: 'Quality 20% Gems', regex: 'q.*20', hint: 'Finds 20% quality gems or flasks for GCP and Bauble flips' },
  { id: 'ms', label: 'Movement Boots', regex: 'runner|sprinter|cheetah|gazelle', hint: 'Highlights movement speed boots at town vendors during Acts' },
  { id: 'links3', label: '3 Link Caster', regex: 'b-b-b|b-b-g|b-g-b|g-b-b', hint: 'Finds linked caster sockets at Act 1 to Act 3 vendors' }
];

const POE2_QUICK_REGEXES: QuickRegex[] = [
  { id: 'p2-sock', label: 'Socketed Salvage', regex: 'socket', hint: 'Highlights gear with Rune sockets for Artificer Shards at the Salvage Bench' },
  { id: 'p2-qual', label: 'Quality Salvage', regex: 'superior', hint: 'Highlights quality gear to salvage into Whetstones, Scraps, and Etchers' },
  { id: 'p2-rare', label: 'Regal Disenchant', regex: 'rare', hint: 'Finds spare rares to disenchant at town NPCs for Regal Shards' },
  { id: 'p2-way', label: 'Waystone 3 to 1', regex: 'waystone', hint: 'Groups Waystones for 3 to 1 tier upgrades at the Reforging Bench' }
];

const POE1_EXTRA_RECIPES: NormalizedRecipe[] = [
  {
    id: 'poe1-threads-330',
    game: 'poe1',
    title: 'Threads of Creation & Viscera (3 to 1 Upgrade)',
    category: 'endgame',
    categoryLabel: 'Endgame & Maps',
    components: ['3x Identical Tier Threads of Creation OR 3x Viscera'],
    reward: '1x Next Tier Upgraded Component (Patch 3.30.0c+)',
    usageNotes: 'Added in Patch 3.30.0c/d. Consolidate excess lower tier league drops directly at any vendor without waiting for higher tier drops.',
    poeWikiUrl: 'https://www.poewiki.net/wiki/Vendor_recipe_system'
  },
  {
    id: 'poe1-bauble-flasks',
    game: 'poe1',
    title: 'Glassblower Bauble (40% Flask Quality)',
    category: 'flasks',
    categoryLabel: 'Flasks',
    components: ['Multiple Superior Flasks totaling 40% Quality (or 1x 20% Normal Flask)'],
    reward: '1x Glassblower Bauble',
    usageNotes: 'Essential for rolling 20% quality utility flasks early in SSF before red map currency sustains your stash.',
    poeWikiUrl: 'https://www.poewiki.net/wiki/Glassblower%27s_Bauble',
    stashRegex: 'superior.*flask'
  },
  {
    id: 'poe1-chaos-set',
    game: 'poe1',
    title: 'Chaos & Regal Full Rare Set',
    category: 'currency',
    categoryLabel: 'Currency & Orbs',
    components: ['Full set of Rare Gear (Helm, Body, Gloves, Boots, Belt, 2x Rings, Amulet, 2H or 2x 1H)'],
    reward: '1x Chaos Orb (Identified, iLvl 60 to 74) or 2x Chaos Orbs (Unidentified); Regal Orbs at iLvl 75+',
    usageNotes: 'Useful on Day 1 SSF when you need quick Chaos Orbs for Kirac map device crafts or bench metacrafting.',
    poeWikiUrl: 'https://www.poewiki.net/wiki/Vendor_recipe_system#Full_Rare_Sets'
  },
  {
    id: 'poe1-gcp-gems',
    game: 'poe1',
    title: 'Gemcutter Prism (40% Gem Quality)',
    category: 'gems',
    categoryLabel: 'Gems & Quality',
    components: ['Multiple Quality Skill or Support Gems totaling 40% Quality (or 1x 20% Gem)'],
    reward: '1x Gemcutter Prism (GCP)',
    usageNotes: 'Always pick up 10%+ quality gems in SSF. Combine them to fund 20% quality on your primary active skill gem.',
    poeWikiUrl: 'https://www.poewiki.net/wiki/Gemcutter%27s_Prism',
    stashRegex: 'quality'
  }
];

const POE2_RECIPES: NormalizedRecipe[] = [
  {
    id: 'poe2-salvage-sockets',
    game: 'poe2',
    title: 'Artificer Shards (Socketed Gear Salvage)',
    category: 'salvage',
    categoryLabel: 'Salvage Bench',
    components: ['Any Martial Weapon, Armour, or Shield with 1+ Rune Sockets'],
    reward: '1x Artificer Shard per Socket (10 Shards = 1 Artificer Orb)',
    usageNotes: 'Never sell socketed ground loot for gold early. Feed every socketed white or magic drop into the Salvage Bench to keep Artificer Orbs flowing for campaign upgrades.',
    stashRegex: 'socket'
  },
  {
    id: 'poe2-salvage-quality',
    game: 'poe2',
    title: 'Quality Currency (Superior Gear Salvage)',
    category: 'salvage',
    categoryLabel: 'Salvage Bench',
    components: ['Superior Armour, Martial Weapons, or Caster Wands/Staves with Quality %'],
    reward: 'Armourer Scraps (Armour), Blacksmith Whetstones (Weapons), or Arcanist Etchers (Caster Gear)',
    usageNotes: 'Quality on weapons scales physical base damage multiplicatively in PoE 2. Always salvage Superior weapons and caster foci.',
    stashRegex: 'superior'
  },
  {
    id: 'poe2-disenchant-rare',
    game: 'poe2',
    title: 'Regal Shards (Disenchanting Rares)',
    category: 'disenchant',
    categoryLabel: 'Disenchanting',
    components: ['Any Identified Rare Item (speak to Una, Servi, or Town Disenchanter)'],
    reward: '1x Regal Shard (2x for 6 mod Rares; 10 Shards = 1 Regal Orb)',
    usageNotes: 'The backbone of PoE 2 SSF crafting. Disenchant bricked rares instead of vendoring for gold whenever your Regal Orb stock drops below 15.',
    stashRegex: 'rare'
  },
  {
    id: 'poe2-disenchant-unique',
    game: 'poe2',
    title: 'Chance Shards (Disenchanting Uniques)',
    category: 'disenchant',
    categoryLabel: 'Disenchanting',
    components: ['Any Unwanted Unique Item at Town Disenchanter'],
    reward: '1x Chance Shard (10 Shards = 1 Orb of Chance)',
    usageNotes: 'Orbs of Chance in PoE 2 target specific white base items into chase Uniques. Disenchant every duplicate leveling unique.',
    stashRegex: 'unique'
  },
  {
    id: 'poe2-reforge-waystones',
    game: 'poe2',
    title: 'Reforging Bench: 3 to 1 Waystone Tier Upgrade',
    category: 'reforge',
    categoryLabel: 'Reforging Bench (3 to 1)',
    components: ['3x Waystones of the Same Tier (unlocked via Act 3 Oswald Quest)'],
    reward: '1x Waystone of the Next Higher Tier',
    usageNotes: 'Your primary Atlas sustain safety net in PoE 2 SSF. Combine surplus low tier Waystones to push straight toward Tier 15 Atlas quests.',
    stashRegex: 'waystone'
  },
  {
    id: 'poe2-reforge-runes',
    game: 'poe2',
    title: 'Reforging Bench: Runes, Soul Cores & Catalysts (3 to 1)',
    category: 'reforge',
    categoryLabel: 'Reforging Bench (3 to 1)',
    components: ['3x Identical Runes, Soul Cores, Essences, or Distilled Emotions'],
    reward: '1x Upgraded Tier or Rerolled Equivalent Socketable',
    usageNotes: 'Turn lower tier resistances or surplus Trial of Chaos Soul Cores into endgame Iron Runes and Spirit or Resistance Soul Cores.',
    stashRegex: 'rune|soul core'
  },
  {
    id: 'poe2-reforge-bases',
    game: 'poe2',
    title: 'Reforging Bench: 3 to 1 Rare Base Reroll',
    category: 'reforge',
    categoryLabel: 'Reforging Bench (3 to 1)',
    components: ['3x Rare Items of the Exact Same Base Type'],
    reward: '1x Fresh Rare Item of the Same Base (uses lowest Item Level of the 3)',
    usageNotes: 'Stash high iLvl Dualstring Bows, Expert Chests, and Gold Rings that fail slams. Reforge three bricked copies for a free clean roll without spending Exalted Orbs.'
  },
  {
    id: 'poe2-rune-swap',
    game: 'poe2',
    title: 'Overwrite Socketed Runes & Soul Cores',
    category: 'runes',
    categoryLabel: 'Runes & Soul Cores',
    components: ['Any Socketed Equipment + New Rune or Soul Core'],
    reward: 'Replaces Existing Socketed Rune Immediately (Destroys Old Rune)',
    usageNotes: 'Unlike early launch builds, you can freely overwrite runes on gear as your elemental resistances shift through Acts and Waystone tiers.'
  }
];

function mapPoe1Category(raw: string, title: string): { id: string; label: string } {
  const t = title.toLowerCase();
  if (t.includes('flask') || t.includes('quicksilver')) return { id: 'flasks', label: 'Flasks' };
  if (t.includes('gem') || t.includes('quality') || t.includes('gcp')) return { id: 'gems', label: 'Gems & Quality' };
  if (raw === 'leveling') return { id: 'leveling', label: 'Leveling Weapons' };
  if (raw === 'currency') return { id: 'currency', label: 'Currency & Orbs' };
  if (raw === 'utility') return { id: 'gems', label: 'Gems & Quality' };
  return { id: 'endgame', label: 'Endgame & Maps' };
}

export const VendorRecipesView: React.FC = () => {
  const [gameMode, setGameMode] = useState<GameMode>('poe1');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showSurvivalKit, setShowSurvivalKit] = useState<boolean>(false);

  const handleSwitchGame = (next: GameMode) => {
    setGameMode(next);
    setSelectedCategory('all');
    setSearchQuery('');
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const poe1Categories = [
    { id: 'all', label: 'All Formulas' },
    { id: 'leveling', label: 'Leveling Weapons' },
    { id: 'gems', label: 'Gems & Quality' },
    { id: 'currency', label: 'Currency & Orbs' },
    { id: 'flasks', label: 'Flasks' },
    { id: 'endgame', label: 'Endgame & Maps' }
  ];

  const poe2Categories = [
    { id: 'all', label: 'All Stations' },
    { id: 'salvage', label: 'Salvage Bench' },
    { id: 'disenchant', label: 'Disenchanting' },
    { id: 'reforge', label: 'Reforging Bench (3 to 1)' },
    { id: 'runes', label: 'Runes & Soul Cores' }
  ];

  const allRecipes = useMemo<NormalizedRecipe[]>(() => {
    if (gameMode === 'poe2') return POE2_RECIPES;
    const basePoe1: NormalizedRecipe[] = VENDOR_RECIPES.map((r) => {
      const cat = mapPoe1Category(r.category, r.title);
      return {
        id: r.id,
        game: 'poe1',
        title: r.title,
        category: cat.id,
        categoryLabel: cat.label,
        components: r.components,
        reward: r.reward,
        usageNotes: r.usageNotes,
        poeWikiUrl: r.poeWikiUrl
      };
    });
    return [...POE1_EXTRA_RECIPES, ...basePoe1];
  }, [gameMode]);

  const filteredRecipes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allRecipes.filter((r) => {
      const matchesCat = selectedCategory === 'all' || r.category === selectedCategory;
      const matchesQuery =
        !q ||
        r.title.toLowerCase().includes(q) ||
        r.reward.toLowerCase().includes(q) ||
        r.usageNotes.toLowerCase().includes(q) ||
        r.components.some((c) => c.toLowerCase().includes(q));
      return matchesCat && matchesQuery;
    });
  }, [allRecipes, selectedCategory, searchQuery]);

  const activeCategories = gameMode === 'poe1' ? poe1Categories : poe2Categories;
  const activeRegexes = gameMode === 'poe1' ? POE1_QUICK_REGEXES : POE2_QUICK_REGEXES;

  return (
    <div className="space-y-6 w-full pb-20 font-sans text-slate-200">
      {/* Header Masthead with PoE 1 / PoE 2 Switcher */}
      <header className="relative overflow-hidden p-5 sm:p-6 rounded-2xl border border-slate-800 bg-gradient-to-br from-[#0e1320] via-[#111827] to-[#0b0f19] shadow-xl space-y-4">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-widest text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
              Deterministic SSF Economy & Town Stations
            </div>
            <h1 className="text-2xl sm:text-3xl font-poe font-bold text-white tracking-tight">
              Vendor Formulas & Salvage Reference
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Verified deterministic recipes for Path of Exile 1 (Patch 3.30) and town Salvage, Disenchanting, and Reforging Bench formulas for Path of Exile 2.
            </p>
          </div>

          {/* Prominent Game Switcher */}
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

        {/* Copyable Quick Stash & Vendor Regex Bar */}
        <div className="relative z-10 pt-3 border-t border-slate-800/80 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-slate-400">
              <Filter className="w-3.5 h-3.5 text-amber-400" />
              <span>Quick Stash & Vendor Search Strings (Click to Copy):</span>
            </div>
            <a
              href={gameMode === 'poe2' ? 'https://poe2.re/vendor' : 'https://poe.re/vendor'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-400/40 text-[11px] font-bold text-indigo-200 transition-colors"
            >
              <span>Custom Vendor Regex ({gameMode === 'poe2' ? 'poe2.re' : 'poe.re'})</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeRegexes.map((item) => {
              const isCopied = copiedId === `rx-${item.id}`;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleCopy(`rx-${item.id}`, item.regex)}
                  title={`${item.hint} (Regex: ${item.regex})`}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    isCopied
                      ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-200'
                      : 'bg-slate-900/90 border-slate-800 text-slate-200 hover:border-amber-400/50 hover:bg-slate-800/80'
                  }`}
                >
                  <span>{item.label}</span>
                  <code className="px-1.5 py-0.5 rounded bg-slate-950 text-amber-300 font-mono text-[10px]">
                    {item.regex}
                  </code>
                  {isCopied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3 text-slate-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Patch Audit Notice */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <div className="font-bold text-amber-300 uppercase tracking-wider font-mono">
            {gameMode === 'poe1'
              ? 'Path of Exile 1 Audit (Patch 3.30 Verified)'
              : 'Path of Exile 2 Town Economy Audit'}
          </div>
          <p className="text-slate-300 leading-relaxed">
            {gameMode === 'poe1' ? (
              <>
                The legacy <em>"+1 to Level of all Spell Gems"</em> wand vendor recipe was removed in 3.20; use the verified <strong>Flat Added Spell Damage</strong> wand recipe during campaign leveling. The Level 20 + 1 GCP flip applies only to <strong>Support Gems</strong> (3.23+), and Patch 3.30.0c+ supports <strong>3 to 1 Threads of Creation</strong> and <strong>Viscera</strong> vendor upgrades.
              </>
            ) : (
              <>
                Path of Exile 2 replaces traditional multi item vendor recipes with three dedicated town mechanics: the <strong>Salvage Bench</strong> (Sockets & Quality), <strong>Town Disenchanting</strong> (Magic/Rare/Unique Shards), and the <strong>Reforging Bench</strong> (3 to 1 upgrades for Waystones, Runes, Soul Cores, Essences, and Rare Bases).
              </>
            )}
          </p>
        </div>
      </div>

      {/* Collapsible SSF Bare Minimum Survival Kit */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-sm">
        <button
          type="button"
          onClick={() => setShowSurvivalKit((v) => !v)}
          className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-poe font-bold text-white">
                {gameMode === 'poe1'
                  ? 'PoE 1 SSF Bare Minimum Survival Kit'
                  : 'PoE 2 SSF Town Economy Survival Kit'}
              </h2>
              <p className="text-xs text-slate-400">
                {gameMode === 'poe1'
                  ? 'Currency conversion chains, offhand gem leveling, and FilterBlade rules.'
                  : 'Gold vs. Disenchanting priorities, Salvage Bench habits, and Reforging Bench tips.'}
              </p>
            </div>
          </div>
          {showSurvivalKit ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>

        {showSurvivalKit && (
          <div className="p-5 border-t border-slate-800 bg-slate-950/60 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {gameMode === 'poe1' ? (
              <>
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                  <h3 className="font-poe font-bold text-sm text-amber-400">1. Early Vendor Currency Chains</h3>
                  <ul className="space-y-1.5 text-slate-300">
                    <li>• <strong>6 Socket Gear:</strong> Vendor any 6 socket drop for <strong>7x Jeweller Orbs</strong>.</li>
                    <li>• <strong>RGB 3 Links:</strong> Vendor linked Red, Green, Blue sockets for <strong>1x Chromatic Orb</strong>.</li>
                    <li>• <strong>40% Quality Flasks:</strong> Vendor superior flasks totaling 40% quality for <strong>1x Glassblower Bauble</strong>.</li>
                    <li>• <strong>Town Vendors:</strong> Buy Alterations, Jewellers, and Fusings directly from Lani or Yeena in a pinch.</li>
                  </ul>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                  <h3 className="font-poe font-bold text-sm text-sky-400">2. Offhand Weapon Swap Gem Engine</h3>
                  <ul className="space-y-1.5 text-slate-300">
                    <li>• Press <strong>X</strong> to fill your secondary weapon set with 6 sockets of backup gems.</li>
                    <li>• Level 6 copies of your primary skill gem to Vaal corrupt for <strong>Level 21</strong> in endgame.</li>
                    <li>• Level core Support Gems to 20, then vendor with 1 GCP for instant 20% Quality Level 1 gems.</li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                  <h3 className="font-poe font-bold text-sm text-amber-400">1. Gold vs. Salvage vs. Disenchant</h3>
                  <ul className="space-y-1.5 text-slate-300">
                    <li>• <strong>Always Salvage First:</strong> Any item with Rune Sockets or Quality % goes to the Salvage Bench.</li>
                    <li>• <strong>Disenchant Rares:</strong> Feed spare rares to the town disenchanter whenever Regal Orbs are low.</li>
                    <li>• <strong>Sell Blue Gear for Gold:</strong> Vendor excess Magic items for Gold to fund passive tree respecs and Alva gambling.</li>
                  </ul>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                  <h3 className="font-poe font-bold text-sm text-sky-400">2. Reforging Bench Discipline</h3>
                  <ul className="space-y-1.5 text-slate-300">
                    <li>• Unlock the Reforging Bench in Act 3 by completing Oswald's Molten Vault quest.</li>
                    <li>• Keep a dedicated dump tab for top tier weapon and ring bases to 3 to 1 Reforge failed crafts.</li>
                    <li>• Combine low tier Waystones 3 to 1 to climb Atlas quest tiers smoothly in SSF.</li>
                  </ul>
                </div>
              </>
            )}
          </div>
        )}
      </section>

      {/* Instant Search + Category Filter Ribbon */}
      <div className="px-3.5 py-3 rounded-2xl border border-indigo-500/25 bg-gradient-to-r from-[#0d121d] via-[#101726] to-[#0d121d] flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {activeCategories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600/30 text-white border border-indigo-400/60 shadow-sm'
                    : 'bg-slate-900/70 text-slate-300 border border-slate-800 hover:border-slate-600 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        <div className="relative w-full xl:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search recipes, components, rewards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950/90 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-400/60"
          />
        </div>
      </div>

      {/* Recipe Cards Grid */}
      {filteredRecipes.length === 0 ? (
        <div className="p-10 rounded-2xl border border-slate-800 bg-slate-900/60 text-center space-y-2">
          <p className="text-sm font-semibold text-slate-300">No formulas match your current filter.</p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('all');
              setSearchQuery('');
            }}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600/30 border border-indigo-400/50 text-xs font-bold text-white cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRecipes.map((recipe) => (
            <article
              key={recipe.id}
              className="p-5 rounded-2xl border border-slate-800 bg-slate-900/85 hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-4 shadow-sm"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
                  <h3 className="font-poe font-bold text-base text-white leading-snug">
                    {recipe.title}
                  </h3>
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 flex-shrink-0">
                    {recipe.categoryLabel}
                  </span>
                </div>

                {/* Recipe Components */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-mono font-bold uppercase text-slate-400">
                    Required Inputs:
                  </div>
                  <div className="space-y-1.5">
                    {recipe.components.map((comp, cIdx) => {
                      const copyKey = `${recipe.id}-${cIdx}`;
                      return (
                        <div
                          key={cIdx}
                          className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800/90 text-xs text-slate-200 flex items-center justify-between gap-2"
                        >
                          <span className="font-mono leading-snug">{comp}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(copyKey, comp)}
                            title="Copy input formula"
                            className="text-slate-400 hover:text-amber-400 transition-colors p-1 flex-shrink-0 cursor-pointer"
                          >
                            {copiedId === copyKey ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Guaranteed Reward */}
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase text-amber-300 block">
                    Guaranteed Output:
                  </span>
                  <p className="text-xs font-bold text-white leading-snug">{recipe.reward}</p>
                </div>

                {/* Strategy Note */}
                <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  <strong className="text-amber-300">SSF Strategy:</strong> {recipe.usageNotes}
                </div>
              </div>

              {/* Footer Actions */}
              {(recipe.stashRegex || recipe.poeWikiUrl) && (
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2 text-xs">
                  {recipe.stashRegex ? (
                    <button
                      type="button"
                      onClick={() => handleCopy(`card-rx-${recipe.id}`, recipe.stashRegex!)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 hover:border-amber-400/60 text-[11px] font-mono text-amber-300 cursor-pointer"
                      title="Copy stash search regex"
                    >
                      {copiedId === `card-rx-${recipe.id}` ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>Regex: {recipe.stashRegex}</span>
                    </button>
                  ) : (
                    <span />
                  )}

                  {recipe.poeWikiUrl && (
                    <a
                      href={recipe.poeWikiUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1 text-[11px] font-semibold"
                    >
                      Wiki Reference <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
