import React, { useState } from 'react';
import { 
  Flame, 
  ChevronDown,
  ChevronUp,
  Target,
  Check,
  X,
  Sparkles,
  Hammer,
  Video,
  Copy,
  ExternalLink
} from 'lucide-react';
import { SSF_BUILDS } from '../data/builds';
import type { SSFBuild } from '../types';

export const BuildsShowcaseView: React.FC = () => {
  const [selectedPlaystyle, setSelectedPlaystyle] = useState<string>('all');
  const [selectedDependency, setSelectedDependency] = useState<string>('all');
  const [expandedBuildId, setExpandedBuildId] = useState<string | null>(null);
  const [copiedPobId, setCopiedPobId] = useState<string | null>(null);

  const filteredBuilds = SSF_BUILDS.filter((build) => {
    const playstyleMatch = selectedPlaystyle === 'all' || build.playstyle === selectedPlaystyle;
    const depMatch = selectedDependency === 'all' || build.uniqueDependency === selectedDependency;
    return playstyleMatch && depMatch;
  });

  const handleCopyPob = (id: string, pob: string) => {
    navigator.clipboard.writeText(pob);
    setCopiedPobId(id);
    setTimeout(() => setCopiedPobId(null), 2000);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-200 dark:border-[#2d2d44] pb-6 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-red-600 dark:text-red-400">
          <Flame className="w-4 h-4" />
          The SSF Hall of Fame
        </div>
        <h1 className="text-3xl font-poe font-bold text-slate-900 dark:text-slate-100">
          SSF Friendly Builds
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
          Curated builds from some of PoE's best creators (link attributed). Vetted for 0 unique dependency, proven leveling curves, and deterministic crafting pathways to reach 4 Voidstones.
        </p>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-white dark:bg-[#1a1a2e]/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-200 dark:border-[#2d2d44] shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Filter Playstyle:</div>
          <div className="flex flex-wrap gap-1.5">
            {['all', 'Brands', 'DoT', 'Melee', 'Spell Caster', 'Totem / Ballista', 'Minion / Corpse', 'Bow Attack'].map((style) => (
              <button
                key={style}
                onClick={() => setSelectedPlaystyle(style)}
                className={`px-3 py-1 text-xs rounded-lg transition-colors font-medium ${
                  selectedPlaystyle === style
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-100 dark:bg-poe-dark border border-slate-200 dark:border-slate-200 dark:border-[#2d2d44] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {style === 'all' ? 'All Playstyles' : style}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Unique Reliance:</span>
          <select
            value={selectedDependency}
            onChange={(e) => setSelectedDependency(e.target.value)}
            className="bg-slate-50 dark:bg-poe-dark border border-slate-200 dark:border-slate-200 dark:border-[#2d2d44] rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 shadow-sm"
          >
            <option value="all">All Dependencies</option>
            <option value="None (Pure Rare)">None (Pure Rare)</option>
            <option value="Transfigured Gem">Transfigured Gem</option>
            <option value="Specific Div Card">Specific Div Card</option>
          </select>
        </div>
      </div>

      {/* Build Cards List */}
      <div className="space-y-6">
        {filteredBuilds.map((build: SSFBuild) => {
          const isExpanded = expandedBuildId === build.id;

          return (
            <div
              key={build.id}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden shadow-sm ${
                isExpanded 
                  ? 'border-amber-500/60 bg-white dark:bg-white dark:bg-[#1a1a2e] shadow-lg shadow-amber-500/5' 
                  : 'border-slate-200 dark:border-slate-200 dark:border-[#2d2d44] bg-white dark:bg-white dark:bg-[#1a1a2e]/60 hover:border-slate-300 dark:hover:border-slate-200 dark:border-[#2d2d44]/80'
              }`}
            >
              {/* Build Header Row */}
              <div 
                onClick={() => setExpandedBuildId(isExpanded ? null : build.id)}
                className="p-5 sm:p-6 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-700 dark:text-amber-400 font-semibold">
                      {build.ascendancy}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-[#2d2d44] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#3f3f5f] font-medium">
                      {build.playstyle}
                    </span>
                    <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                      build.uniqueDependency === 'None (Pure Rare)'
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                        : 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/30'
                    }`}>
                      {build.uniqueDependency}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-poe font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    {build.name}
                  </h2>

                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <span>Guide Creator: <strong className="text-slate-800 dark:text-slate-200">{build.creator}</strong></span>
                    <span>•</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">SSF Score: {build.ssfViabilityScore}/10</span>
                  </p>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold hidden md:block">
                    {isExpanded ? 'Click to collapse' : 'Click to view deep guide'}
                  </div>
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-poe-dark border border-slate-200 dark:border-slate-200 dark:border-[#2d2d44] text-slate-600 dark:text-slate-300">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Expanded Detailed Guide */}
              {isExpanded && (
                <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-slate-100 dark:border-slate-200 dark:border-[#2d2d44]/50 space-y-6 animate-fadeIn">
                  
                  {/* Summary */}
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-poe-darkest/60 p-4 rounded-xl border border-slate-200 dark:border-slate-200 dark:border-[#2d2d44]/40">
                    {build.summary}
                  </p>

                  {/* Pros & Cons */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30 space-y-2">
                      <div className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Check className="w-4 h-4" /> SSF Strengths & Pros
                      </div>
                      <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                        {build.pros.map((pro, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                            <span>{pro}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-500/30 space-y-2">
                      <div className="text-xs font-bold text-red-800 dark:text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                        <X className="w-4 h-4" /> Considerations & Cons
                      </div>
                      <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                        {build.cons.map((con, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-red-600 dark:text-red-400 font-bold">•</span>
                            <span>{con}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Leveling Progression */}
                  <div className="space-y-2">
                    <h4 className="text-xs uppercase tracking-wider font-bold text-sky-700 dark:text-sky-400 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" /> Leveling Gem Progression
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {build.levelingGems.map((gemStep, idx) => (
                        <div key={idx} className="bg-slate-50 dark:bg-poe-darkest p-3 rounded-xl border border-slate-200 dark:border-slate-200 dark:border-[#2d2d44] text-xs text-slate-700 dark:text-slate-300">
                          <span className="text-[10px] text-sky-600 dark:text-sky-400 font-bold block mb-1">Stage {idx + 1}</span>
                          {gemStep}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Key SSF Crafting Steps */}
                  <div className="space-y-2">
                    <h4 className="text-xs uppercase tracking-wider font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                      <Hammer className="w-4 h-4" /> Key SSF Gear Crafting Steps
                    </h4>
                    <div className="space-y-2">
                      {build.keyCraftingSteps.map((step, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-poe-darkest/90 border border-slate-200 dark:border-slate-200 dark:border-[#2d2d44] text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                          <span className="text-amber-600 dark:text-amber-400 font-bold font-mono">#{idx + 1}</span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Target Farmable Uniques / Div Cards (if any) */}
                  {build.targetUniquesOrCards && build.targetUniquesOrCards.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs uppercase tracking-wider font-bold text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
                        <Target className="w-4 h-4" /> Target Farming Locations
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {build.targetUniquesOrCards.map((item, idx) => (
                          <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-poe-darkest border border-slate-200 dark:border-slate-200 dark:border-[#2d2d44] flex items-center justify-between">
                            <div>
                              <div className="text-xs font-bold text-amber-700 dark:text-amber-300">{item.name}</div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">📍 {item.farmLocation}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <a
                                href={item.poeWikiUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-1"
                              >
                                Wiki <ExternalLink className="w-3 h-3" />
                              </a>
                              <a
                                href={item.poeDbUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 flex items-center gap-1"
                              >
                                PoEDB <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions & Creator Links */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-200 dark:border-[#2d2d44]/40">
                    <div className="flex flex-wrap items-center gap-2">
                      {build.pobUrl && (
                        <button
                          onClick={() => handleCopyPob(build.id, build.pobUrl!)}
                          className="px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          {copiedPobId === build.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>PoB Link Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy PoB Link</span>
                            </>
                          )}
                        </button>
                      )}

                      {build.videoGuideUrl && (
                        <a
                          href={build.videoGuideUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/40 text-red-700 dark:text-red-300 hover:bg-red-500/25 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Video Guide</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    {build.creatorUrl && (
                      <a
                        href={build.creatorUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
                      >
                        <span>Created by {build.creator}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};
