import React, { useState } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  ShieldCheck, 
  Hammer, 
  Compass, 
  Crown, 
  ExternalLink, 
  Check, 
  Copy, 
  Layers,
  AlertTriangle
} from 'lucide-react';
import { KNOWLEDGE_ARTICLES, VENDOR_RECIPES } from '../data/knowledgeBase';

export const KnowledgeBaseView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('survival_kit');
  const [copiedRecipeId, setCopiedRecipeId] = useState<string | null>(null);

  // Vorici interactive state
  const [voriciItemType, setVoriciItemType] = useState<'str' | 'dex' | 'int'>('str');
  const [voriciTargetColors, setVoriciTargetColors] = useState<{ red: number; green: number; blue: number }>({ red: 0, green: 0, blue: 4 });

  const categories = [
    { id: 'survival_kit', label: '🎒 Survival Kit & Verified Recipes', icon: BookOpen },
    { id: 'league_mechanics', label: '🕯️ 3.30 Covens of Umbra', icon: Sparkles },
    { id: 'progression_ehp', label: '🛡️ Defenses & Suffix Economics', icon: ShieldCheck },
    { id: 'crafting', label: '🔨 SSF Crafting & Vorici Bench', icon: Hammer },
    { id: 'atlas_mapping', label: '🗺️ Atlas & 100% Map Sustain', icon: Compass },
    { id: 'bossing_fragments', label: '👑 Bossing & Harvest Swaps', icon: Crown }
  ];

  const handleCopyRecipe = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRecipeId(id);
    setTimeout(() => setCopiedRecipeId(null), 2000);
  };

  const currentArticles = KNOWLEDGE_ARTICLES.filter(
    (art) => art.category === selectedCategory
  );

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-poe-border pb-6 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400">
          <BookOpen className="w-4 h-4" />
          The SSF Bible Compendium
        </div>
        <h1 className="text-3xl font-poe font-bold text-slate-900 dark:text-slate-100">
          The SSF Bible & Knowledge Base
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
          Synthesized and audited for modern Path of Exile. Verified vendor recipes (with outdated recipe warnings), suffix economics, deterministic crafting paths, and atlas sustain without trading.
        </p>
      </div>

      {/* Category Pills Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                isSelected
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-white dark:bg-poe-card border border-slate-200 dark:border-poe-border text-slate-700 dark:text-slate-300 hover:border-amber-500/40 hover:text-amber-600 dark:hover:text-amber-300 shadow-sm'
              }`}
            >
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Section 1: Survival Kit & Vendor Recipes */}
      {selectedCategory === 'survival_kit' && (
        <div className="space-y-8">
          
          {/* Outdated Recipe Alert Notice */}
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-500/40 flex items-start gap-3 shadow-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <div className="font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                Audited for Modern PoE (Patch 3.20 to 3.29+ Verified)
              </div>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                The old <em>"+1 to Level of all Spell Gems"</em> magic wand recipe was <strong>removed in Patch 3.20</strong>. Use the verified <strong>Added Flat Spell Damage Recipe</strong> (Wand + Magic Resist Ring + Alteration) for campaign leveling. In addition, the 20% gem flip recipe now only functions on <strong>Support Gems</strong> (Patch 3.23+), and Patch 3.29 introduced White item sockets by default with +10% quality bonuses for matching gem colors.
              </p>
            </div>
          </div>

          {/* Vendor Recipe Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-poe font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                Verified SSF Vendor Recipe Vault
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">{VENDOR_RECIPES.length} Active Recipes</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {VENDOR_RECIPES.map((recipe) => (
                <div 
                  key={recipe.id}
                  className="rounded-xl border border-slate-200 dark:border-poe-border bg-white dark:bg-poe-card/70 p-5 space-y-3 flex flex-col justify-between hover:border-amber-500/40 transition-colors shadow-sm"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-bold ${
                        recipe.category === 'leveling' ? 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/30' :
                        recipe.category === 'crafting' ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30' :
                        recipe.category === 'currency' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30' :
                        'bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/30'
                      }`}>
                        {recipe.category}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {recipe.poeWikiUrl && (
                          <a
                            href={recipe.poeWikiUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 text-xs flex items-center gap-1"
                            title="Open in PoEWiki"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span className="text-[10px]">Wiki</span>
                          </a>
                        )}
                        {recipe.poeDbUrl && (
                          <a
                            href={recipe.poeDbUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 text-xs flex items-center gap-1"
                            title="Open in PoEDB"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span className="text-[10px]">PoEDB</span>
                          </a>
                        )}
                      </div>
                    </div>

                    <h3 className="font-bold text-slate-900 dark:text-slate-200 text-base leading-snug">
                      {recipe.title}
                    </h3>

                    {/* Components Box */}
                    <div className="bg-slate-50 dark:bg-poe-darkest/70 rounded-lg p-3 border border-slate-200 dark:border-poe-border/60 space-y-1.5 text-xs">
                      <div className="text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider">Required Components:</div>
                      {recipe.components.map((comp, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-slate-700 dark:text-slate-300">
                          <span className="text-amber-500 dark:text-amber-400 font-bold">•</span>
                          <span>{comp}</span>
                        </div>
                      ))}
                    </div>

                    {/* Reward */}
                    <div className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                      <strong className="text-amber-800 dark:text-amber-400">Result: </strong> {recipe.reward}
                    </div>

                    {/* Notes */}
                    <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                      💡 {recipe.usageNotes}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-poe-border/40 flex justify-end">
                    <button
                      onClick={() => handleCopyRecipe(recipe.id, `${recipe.title}: ${recipe.components.join(' + ')} => ${recipe.reward}`)}
                      className="text-xs text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-300 flex items-center gap-1.5 py-1 px-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      {copiedRecipeId === recipe.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Recipe Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Recipe</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Section 2: Crafting & Vorici Tool */}
      {selectedCategory === 'crafting' && (
        <div className="space-y-8">
          
          {/* Interactive Vorici Bench Off Color Simulator */}
          <div className="rounded-2xl border border-amber-500/40 bg-white dark:bg-gradient-to-br dark:from-poe-card dark:via-slate-900 dark:to-poe-darkest p-6 space-y-5 shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs uppercase tracking-widest text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" /> Interactive Tool
                </span>
                <h3 className="text-xl font-poe font-bold text-slate-900 dark:text-slate-100 mt-1">
                  The Vorici Crafting Bench Socket-Coloring Calculator
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl mt-1">
                  Rolling 4 off color sockets on pure attribute armor using Chromatic Orbs alone takes ~500+ orbs. Using the Crafting Bench "Socket Count" trick costs under ~30 Jewellers!
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 dark:bg-poe-darkest/80 p-4 rounded-xl border border-slate-200 dark:border-poe-border">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Item Attribute Base:</label>
                <select
                  value={voriciItemType}
                  onChange={(e) => setVoriciItemType(e.target.value as any)}
                  className="w-full bg-white dark:bg-poe-card border border-slate-200 dark:border-poe-border rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 shadow-sm"
                >
                  <option value="str">Pure Strength (Red Base / Armour)</option>
                  <option value="dex">Pure Dexterity (Green Base / Evasion)</option>
                  <option value="int">Pure Intelligence (Blue Base / Energy Shield)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Desired Off Color Sockets:</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-sky-600 dark:text-sky-400 font-bold">Blue:</span>
                  <input
                    type="number"
                    min={0}
                    max={4}
                    value={voriciTargetColors.blue}
                    onChange={(e) => setVoriciTargetColors({ ...voriciTargetColors, blue: parseInt(e.target.value) || 0 })}
                    className="w-16 bg-white dark:bg-poe-card border border-slate-200 dark:border-poe-border rounded px-2 py-1 text-xs text-slate-800 dark:text-slate-200 shadow-sm"
                  />
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold ml-2">Green:</span>
                  <input
                    type="number"
                    min={0}
                    max={4}
                    value={voriciTargetColors.green}
                    onChange={(e) => setVoriciTargetColors({ ...voriciTargetColors, green: parseInt(e.target.value) || 0 })}
                    className="w-16 bg-white dark:bg-poe-card border border-slate-200 dark:border-poe-border rounded px-2 py-1 text-xs text-slate-800 dark:text-slate-200 shadow-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col justify-center bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-center">
                <span className="text-[11px] text-slate-600 dark:text-slate-400 uppercase font-semibold">Estimated Bench Cost</span>
                <span className="text-lg font-bold text-amber-700 dark:text-amber-400">~25 Chromatics + ~35 Jewellers</span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">Saves 400+ Chromatic Orbs</span>
              </div>
            </div>

            {/* Step by Step Interactive Workflow */}
            <div className="space-y-2">
              <h4 className="text-xs uppercase tracking-wider font-bold text-slate-700 dark:text-slate-300">Exact Step by Step Bench Sequence:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-poe-dark border border-slate-200 dark:border-poe-border space-y-1">
                  <div className="font-bold text-amber-700 dark:text-amber-400">Step 1: Set 2 Sockets</div>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px]">Benchcraft "At least 2 Sockets". Cost: 1 Jeweller.</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-poe-dark border border-slate-200 dark:border-poe-border space-y-1">
                  <div className="font-bold text-amber-700 dark:text-amber-400">Step 2: Force 2 Colors</div>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px]">Benchcraft "At least 2 Blue Sockets" (Cost: 25 Chromatics). You now have 2 permanent Blue sockets!</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-poe-dark border border-slate-200 dark:border-poe-border space-y-1">
                  <div className="font-bold text-amber-700 dark:text-amber-400">Step 3: Toggle 3rd Socket</div>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px]">Craft "3 Sockets" (3 Jewellers). If not Blue, craft "2 Sockets" (1 Jeweller) and repeat until 3rd is Blue!</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-poe-dark border border-slate-200 dark:border-poe-border space-y-1">
                  <div className="font-bold text-amber-700 dark:text-amber-400">Step 4: Toggle 4th Socket</div>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px]">Craft "4 Sockets" (10 Jewellers). If not Blue, craft "3 Sockets" and repeat until 4th is Blue!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Render Main Knowledge Articles */}
      <div className="space-y-6">
        {currentArticles.map((article) => (
          <article 
            key={article.id}
            className="rounded-2xl border border-slate-200 dark:border-poe-border bg-white dark:bg-poe-card/50 p-6 sm:p-8 space-y-6 shadow-sm hover:border-slate-300 dark:hover:border-poe-border/80 transition-colors"
          >
            <div className="border-b border-slate-100 dark:border-poe-border pb-4 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  {article.readTime}
                </span>
                <div className="flex flex-wrap gap-1">
                  {article.tags.map((tag, idx) => (
                    <span key={idx} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              <h2 className="text-2xl font-poe font-bold text-slate-900 dark:text-slate-100">
                {article.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 italic">
                {article.subtitle}
              </p>
            </div>

            {/* Markdown Body Formatter */}
            <div className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm leading-relaxed space-y-4">
              {article.content.split('\n\n').map((paragraph, pIdx) => {
                const trimmed = paragraph.trim();
                if (!trimmed) return null;

                if (trimmed === '---') {
                  return <hr key={pIdx} className="border-t border-slate-200 dark:border-poe-border my-6" />;
                }

                if (trimmed.startsWith('### ')) {
                  return (
                    <h3 key={pIdx} className="text-lg font-poe font-bold text-amber-700 dark:text-amber-400 mt-6 pt-3 border-t border-slate-100 dark:border-poe-border/40">
                      {trimmed.replace('### ', '')}
                    </h3>
                  );
                }

                if (trimmed.startsWith('#### ')) {
                  return (
                    <h4 key={pIdx} className="text-sm font-bold text-sky-700 dark:text-sky-400 mt-4">
                      {trimmed.replace('#### ', '')}
                    </h4>
                  );
                }

                if (trimmed.startsWith('```')) {
                  const codeText = trimmed.replace(/```[a-z]*\n?/g, '').replace(/```$/g, '');
                  return (
                    <pre key={pIdx} className="bg-slate-900 text-amber-300 p-4 rounded-xl border border-slate-800 text-xs font-mono overflow-x-auto my-3 shadow-inner leading-relaxed">
                      {codeText}
                    </pre>
                  );
                }

                if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
                  const bulletPoints = trimmed.split('\n');
                  return (
                    <ul key={pIdx} className="list-disc list-inside space-y-2 pl-2 text-slate-700 dark:text-slate-300">
                      {bulletPoints.map((bp, bIdx) => {
                        const cleanBp = bp.replace(/^[\*\-]\s+/, '');
                        const parts = cleanBp.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
                        return (
                          <li key={bIdx} className="leading-relaxed">
                            {parts.map((part, i) => {
                              if (part.startsWith('**') && part.endsWith('**')) {
                                return <strong key={i} className="font-bold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
                              }
                              if (part.startsWith('`') && part.endsWith('`')) {
                                return <code key={i} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-amber-600 dark:text-amber-400 font-mono text-xs border border-slate-200 dark:border-slate-700">{part.slice(1, -1)}</code>;
                              }
                              return part;
                            })}
                          </li>
                        );
                      })}
                    </ul>
                  );
                }

                if (/^\d+\.\s/.test(trimmed)) {
                  const numberPoints = trimmed.split('\n');
                  return (
                    <ol key={pIdx} className="list-decimal list-inside space-y-2 pl-2 text-slate-700 dark:text-slate-300">
                      {numberPoints.map((np, nIdx) => {
                        const cleanNp = np.replace(/^\d+\.\s+/, '');
                        const parts = cleanNp.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
                        return (
                          <li key={nIdx} className="leading-relaxed">
                            {parts.map((part, i) => {
                              if (part.startsWith('**') && part.endsWith('**')) {
                                return <strong key={i} className="font-bold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
                              }
                              if (part.startsWith('`') && part.endsWith('`')) {
                                return <code key={i} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-amber-600 dark:text-amber-400 font-mono text-xs border border-slate-200 dark:border-slate-700">{part.slice(1, -1)}</code>;
                              }
                              return part;
                            })}
                          </li>
                        );
                      })}
                    </ol>
                  );
                }

                const parts = trimmed.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
                return (
                  <p key={pIdx} className="leading-relaxed">
                    {parts.map((part, i) => {
                      if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={i} className="font-bold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
                      }
                      if (part.startsWith('`') && part.endsWith('`')) {
                        return <code key={i} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-amber-600 dark:text-amber-400 font-mono text-xs border border-slate-200 dark:border-slate-700">{part.slice(1, -1)}</code>;
                      }
                      return part;
                    })}
                  </p>
                );
              })}
            </div>
          </article>
        ))}
      </div>

    </div>
  );
};
