import React, { useState } from 'react';
import { 
  Sparkles, 
  BookOpen, 
  ExternalLink, 
  Check, 
  Copy, 
  AlertTriangle, 
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { VENDOR_RECIPES } from '../data/knowledgeBase';

export const VendorRecipesView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedRecipeId, setCopiedRecipeId] = useState<string | null>(null);
  const [showSurvivalKit, setShowSurvivalKit] = useState<boolean>(true);

  const categories = [
    { id: 'all', label: 'All Recipes' },
    { id: 'leveling', label: 'Leveling & Weapons' },
    { id: 'currency', label: 'Currency & Exchanges' },
    { id: 'utility', label: 'Utility & Gems' },
    { id: 'crafting', label: 'Endgame & Uniques' }
  ];

  const handleCopyRecipe = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRecipeId(id);
    setTimeout(() => setCopiedRecipeId(null), 2000);
  };

  const filteredRecipes = VENDOR_RECIPES.filter((r) => {
    const matchesCat = selectedCategory === 'all' || r.category === selectedCategory;
    const matchesQuery = 
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reward.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.components.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesQuery;
  });

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16 text-slate-800 dark:text-slate-200">
      
      {/* Header Masthead */}
      <header className="border-b border-slate-200 dark:border-slate-200 dark:border-[#2d2d44] pb-6 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400">
          <Sparkles className="w-4 h-4" />
          Deterministic Vendor Mechanics
        </div>
        <h1 className="text-3xl sm:text-4xl font-poe font-bold text-slate-900 dark:text-slate-100">
          Vendor Recipes & Survival Kit
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
          The verified offline vendor recipe system for Solo Self Found. Guaranteed leveling formulas, currency conversions, 20% gem quality upgrades, and endgame body armour recipes.
        </p>
      </header>

      {/* Modern Patch Audit Alert */}
      <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3.5 shadow-sm">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs sm:text-sm">
          <div className="font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider text-xs">
            Audited for Modern PoE (Patch 3.20 to 3.29+ Verified)
          </div>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-xs">
            The old <em>"+1 to Level of all Spell Gems"</em> wand recipe was <strong>removed in Patch 3.20</strong>. Use the verified <strong>Added Flat Spell Damage Recipe</strong> (Wand + Magic Resist Ring + Alteration) for campaign leveling. The 20% gem flip recipe now only functions on <strong>Support Gems</strong> (as of 3.23+), and item sockets are <strong>White by default</strong> with +10% quality bonuses for matching gem colors (Patch 3.29+).
          </p>
        </div>
      </div>

      {/* Collapsible SSF Bare Minimum Survival Kit */}
      <section className="rounded-3xl border border-slate-200 dark:border-slate-200 dark:border-[#2d2d44] bg-white dark:bg-white dark:bg-[#1a1a2e] overflow-hidden shadow-sm">
        <button
          onClick={() => setShowSurvivalKit(!showSurvivalKit)}
          className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer border-b border-slate-100 dark:border-slate-200 dark:border-[#2d2d44]"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-poe font-bold text-slate-900 dark:text-slate-100">
                The SSF Bare Minimum Survival Kit
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Foundational rules for currency conversion chains, offhand leveling, and FilterBlade setup.
              </p>
            </div>
          </div>
          {showSurvivalKit ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>

        {showSurvivalKit && (
          <div className="p-6 sm:p-8 space-y-6 text-xs sm:text-sm bg-slate-50/50 dark:bg-poe-dark/20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="p-5 rounded-2xl bg-white dark:bg-white dark:bg-[#1a1a2e] border border-slate-200 dark:border-slate-200 dark:border-[#2d2d44] space-y-3">
                <h3 className="font-poe font-bold text-base text-amber-700 dark:text-amber-400 flex items-center gap-2">
                  <span>1.</span> Early Vendor Currency Conversions
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Never wait for raw currency drops. Town vendors provide direct conversions:
                </p>
                <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold">•</span>
                    <span><strong>Scrolls to Alterations:</strong> Sell Scroll Fragments → Wisdom Scrolls → Portal Scrolls → Transmutation Orbs → Augmentation Orbs → Alteration Orbs.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold">•</span>
                    <span><strong>6 Socket Items:</strong> Sell any 6 socket item to any vendor for <strong>7x Jeweller's Orbs</strong>.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold">•</span>
                    <span><strong>RGB 3-Links:</strong> Sell items with connected Red, Green, and Blue sockets for <strong>1x Chromatic Orb</strong>.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold">•</span>
                    <span><strong>Flasks to Baubles:</strong> Sell normal flasks totaling 40% quality for <strong>1x Glassblower's Bauble</strong>.</span>
                  </li>
                </ul>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-white dark:bg-[#1a1a2e] border border-slate-200 dark:border-slate-200 dark:border-[#2d2d44] space-y-3">
                <h3 className="font-poe font-bold text-base text-sky-700 dark:text-sky-400 flex items-center gap-2">
                  <span>2.</span> Offhand Weapon Swap Leveling Engine
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Press <strong>X</strong> to equip two 3-socket one handed weapons in your secondary weapon slots:
                </p>
                <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-sky-500 font-bold">•</span>
                    <span><strong>100% Passive XP:</strong> Offhand socketed gems receive full monster kill experience with zero penalty, even during boss fights.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-sky-500 font-bold">•</span>
                    <span><strong>Corrupt for Level 21:</strong> Level 6 copies of your main damage gem to corrupt with Vaal Orbs in endgame for Level 21.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-sky-500 font-bold">•</span>
                    <span><strong>20% Support Quality:</strong> Level key Support Gems to Level 20, then vendor with 1 GCP for instant 20% Quality Level 1 gems.</span>
                  </li>
                </ul>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-white dark:bg-[#1a1a2e] border border-slate-200 dark:border-slate-200 dark:border-[#2d2d44] space-y-3">
                <h3 className="font-poe font-bold text-base text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                  <span>3.</span> Guaranteed Campaign Leveling Recipes
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span><strong>Physical Attack Weapons:</strong> Magic Weapon + Rustic Sash + Blacksmith Whetstone = 40% to 64% Increased Physical Damage.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span><strong>Flat Spell Damage:</strong> Magic Wand + Magic Ruby/Topaz/Sapphire Ring + Alteration = Flat Added Fire/Lightning/Cold to Spells.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span><strong>Movement Speed Boots:</strong> Normal Boots + Quicksilver Flask + Augmentation = +10% Movement Speed Boots (Repeatable up to +30%).</span>
                  </li>
                </ul>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-white dark:bg-[#1a1a2e] border border-slate-200 dark:border-slate-200 dark:border-[#2d2d44] space-y-3">
                <h3 className="font-poe font-bold text-base text-purple-700 dark:text-purple-400 flex items-center gap-2">
                  <span>4.</span> Customizing FilterBlade for SSF
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500 font-bold">•</span>
                    <span><strong>Never Hide Essences:</strong> Even low tier essences upgrade 3 to 1 to guarantee specific resistance and life rolls.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500 font-bold">•</span>
                    <span><strong>Show High iLvl Bases:</strong> Highlight iLvl 84+ Astral Plates, Two-Stone Rings, and pure Dexterity suppression bases.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500 font-bold">•</span>
                    <span><strong>Highlight Hammers:</strong> Normal Stone Hammers / Gavels + any map vendor for 1 Cartographer's Chisel.</span>
                  </li>
                </ul>
              </div>

            </div>
          </div>
        )}
      </section>

      {/* Recipe Filtering & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-white dark:bg-[#1a1a2e] p-4 rounded-2xl border border-slate-200 dark:border-slate-200 dark:border-[#2d2d44] shadow-sm">
        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-100 dark:bg-poe-dark text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search recipes, components..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-poe-dark border border-slate-200 dark:border-slate-200 dark:border-[#2d2d44] text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Vendor Recipe Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRecipes.map((recipe) => (
          <article 
            key={recipe.id}
            className="p-5 rounded-3xl border border-slate-200 dark:border-slate-200 dark:border-[#2d2d44] bg-white dark:bg-white dark:bg-[#1a1a2e] shadow-sm space-y-4 hover:border-amber-500/40 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-200 dark:border-[#2d2d44] pb-3">
                <h3 className="font-poe font-bold text-base text-slate-900 dark:text-slate-100">
                  {recipe.title}
                </h3>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-poe-dark text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-200 dark:border-[#2d2d44]">
                  {recipe.category}
                </span>
              </div>

              {/* Recipe Components */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-mono font-bold uppercase text-slate-400">Vendor Components:</div>
                <div className="space-y-1">
                  {recipe.components.map((comp, cIdx) => (
                    <div key={cIdx} className="p-2 rounded-xl bg-slate-50 dark:bg-poe-dark/50 border border-slate-200/80 dark:border-slate-200 dark:border-[#2d2d44]/80 text-xs text-slate-800 dark:text-slate-200 flex items-center justify-between gap-2">
                      <span className="font-mono">{comp}</span>
                      <button
                        onClick={() => handleCopyRecipe(`${recipe.id}-${cIdx}`, comp)}
                        title="Copy component text"
                        className="text-slate-400 hover:text-amber-500 transition-colors p-1"
                      >
                        {copiedRecipeId === `${recipe.id}-${cIdx}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reward */}
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase text-amber-700 dark:text-amber-300 block">
                  Guaranteed Reward:
                </span>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug">
                  {recipe.reward}
                </p>
              </div>

              {/* Usage Notes */}
              <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-poe-dark/30 p-3 rounded-2xl border border-slate-200 dark:border-slate-200 dark:border-[#2d2d44]">
                <strong className="text-slate-700 dark:text-slate-300">SSF Strategy:</strong> {recipe.usageNotes}
              </div>
            </div>

            {/* PoEWiki & PoEDB Links */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-200 dark:border-[#2d2d44] flex items-center justify-end gap-3 text-xs">
              {recipe.poeWikiUrl && (
                <a 
                  href={recipe.poeWikiUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 text-[11px] font-semibold"
                >
                  Wiki Guide <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </article>
        ))}
      </div>

    </div>
  );
};
