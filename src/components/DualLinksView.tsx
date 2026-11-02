import React, { useState } from 'react';
import { Search, BookOpen, Database, ExternalLink, Sparkles } from "lucide-react";
import { DUAL_LINKS_DATABASE, searchDualLinks } from '../data/dualLinks';
import type { DualLink } from '../types';

export const DualLinksView: React.FC = () => {
  const [dualSearchQuery, setDualSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Entries' },
    { id: 'item', label: 'Uniques & Gear' },
    { id: 'div_card', label: 'Divination Cards' },
    { id: 'boss', label: 'Pinnacle Bosses' },
    { id: 'mechanic', label: 'Mechanics & Masters' },
    { id: 'base', label: 'Crafting Bases' },
    { id: 'currency', label: 'Essences & Items' }
  ];

  const allSearched: DualLink[] = searchDualLinks(dualSearchQuery);
  const matchedDualLinks = allSearched.filter((item) => 
    selectedCategory === 'all' || item.category === selectedCategory
  );

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-poe-border pb-6 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-sky-600 dark:text-sky-400">
          <Sparkles className="w-4 h-4" />
          The Dual Link Index
        </div>
        <h1 className="text-3xl font-poe font-bold text-slate-900 dark:text-slate-100">
          PoEWiki & PoEDB Dual Link DB
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
          Instantly look up items, divination cards, bosses, and crafting bases to resolve side by side links to both <strong className="text-amber-600 dark:text-amber-400">PoEWiki.net</strong> (mechanics & qualitative lore) and <strong className="text-sky-600 dark:text-sky-400">PoEDB.tw</strong> (datamined mod weights & numbers).
        </p>
      </div>

      {/* Dual Search Engine Box */}
      <div className="rounded-2xl border border-amber-500/40 bg-white dark:bg-gradient-to-br dark:from-poe-card dark:via-slate-900 dark:to-poe-darkest p-6 sm:p-8 space-y-5 shadow-lg">
        
        {/* Search Input Bar */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={dualSearchQuery}
            onChange={(e) => setDualSearchQuery(e.target.value)}
            placeholder="Search items, mechanics, cards, bosses (e.g. Porcupine, Searing Exarch, Rog, Crafting Bench)..."
            className="w-full pl-11 pr-20 py-3 bg-slate-50 dark:bg-poe-darkest border border-slate-200 dark:border-poe-border rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500 shadow-inner"
          />
          {dualSearchQuery && (
            <button
              onClick={() => setDualSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white px-2 py-1 bg-slate-200 dark:bg-slate-800 rounded"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedCategory === cat.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-100 dark:bg-poe-dark border border-slate-200 dark:border-poe-border text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-poe-border/40">
          <span>Showing {matchedDualLinks.length} matching entries</span>
          <span>Indexed: {DUAL_LINKS_DATABASE.length} Common SSF targets</span>
        </div>

        {/* Dual Link Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-1">
          {matchedDualLinks.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-50 dark:bg-poe-darker/90 border border-slate-200 dark:border-poe-border hover:border-amber-500/50 dark:hover:border-amber-500/40 space-y-3 flex flex-col justify-between transition-colors shadow-sm"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-amber-700 dark:text-amber-300 font-poe">
                    {item.name}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border border-slate-300 dark:border-slate-700 font-mono">
                    {item.category}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Dual Action Buttons */}
              <div className="pt-2 border-t border-slate-200 dark:border-poe-border/40 flex items-center justify-between gap-2">
                <a
                  href={item.poeWikiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-2.5 py-1.5 rounded bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>PoEWiki.net</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <a
                  href={item.poeDbUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-2.5 py-1.5 rounded bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-700 dark:text-sky-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>PoEDB.tw</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}

          {matchedDualLinks.length === 0 && (
            <div className="col-span-2 text-center py-12 text-slate-400 text-xs">
              No entries found matching "{dualSearchQuery}". Try searching for items like "Porcupine", "Lightning Coil", "Rog", or "Maven".
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
