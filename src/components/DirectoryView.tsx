import React, { useState } from 'react';
import { 
  ExternalLink, 
  Search, 
  BookOpen, 
  Database, 
  Hammer, 
  Filter, 
  TrendingUp, 
  Sparkles,
  Link,
  Flame,
  Compass
} from 'lucide-react';
import { DIRECTORY_LINKS } from '../data/directoryData';
import { DUAL_LINKS_DATABASE, searchDualLinks } from '../data/dualLinks';
import type { DualLink } from '../types';

export const DirectoryView: React.FC = () => {
  const [selectedDirectoryCat, setSelectedDirectoryCat] = useState<string>('all');
  const [dualSearchQuery, setDualSearchQuery] = useState<string>('');

  const directoryCategories = [
    'all',
    'Databases & Wikis',
    'Crafting & Emulators',
    'Filter & Regex',
    'Builds & Ladders',
    'League Mechanics'
  ];

  const filteredLinks = DIRECTORY_LINKS.filter((l) => 
    selectedDirectoryCat === 'all' || l.category === selectedDirectoryCat
  );

  const matchedDualLinks: DualLink[] = searchDualLinks(dualSearchQuery);

  const renderIcon = (name: string) => {
    switch (name) {
      case 'BookOpen': return <BookOpen className="w-5 h-5 text-amber-400" />;
      case 'Database': return <Database className="w-5 h-5 text-sky-400" />;
      case 'Hammer': return <Hammer className="w-5 h-5 text-emerald-400" />;
      case 'Filter': return <Filter className="w-5 h-5 text-purple-400" />;
      case 'TrendingUp': return <TrendingUp className="w-5 h-5 text-rose-400" />;
      case 'Flame': return <Flame className="w-5 h-5 text-amber-500" />;
      case 'Compass': return <Compass className="w-5 h-5 text-cyan-400" />;
      default: return <Sparkles className="w-5 h-5 text-amber-400" />;
    }
  };

  return (
    <div className="space-y-12 max-w-5xl mx-auto pb-16">
      
      {/* Header */}
      <div className="border-b border-poe-border pb-6 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-purple-400">
          <Link className="w-4 h-4" />
          The Unified Compendium Directory
        </div>
        <h1 className="text-3xl font-poe font-bold text-slate-100">
          Directory & Dual Link Wiki/PoEDB Engine
        </h1>
        <p className="text-sm text-slate-400 max-w-3xl leading-relaxed">
          Every critical tool in the Path of Exile ecosystem collated in one place. Search any item, boss, or mechanic below to instantly generate dual links to both <strong className="text-amber-400">PoEWiki.net</strong> (mechanics/lore) and <strong className="text-sky-400">PoEDB.tw</strong> (datamined mod weights).
        </p>
      </div>

      {/* Dual Link Search Spotlight */}
      <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-poe-card via-slate-900 to-poe-darkest p-6 sm:p-8 space-y-5 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs uppercase tracking-widest text-amber-400 font-bold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> Instant Cross-Referencer
            </span>
            <h2 className="text-xl font-poe font-bold text-slate-100 mt-1">
              Dual Link Item & Database Search
            </h2>
          </div>
          <span className="text-xs text-slate-400">Indexed: {DUAL_LINKS_DATABASE.length} Common SSF Entries</span>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={dualSearchQuery}
            onChange={(e) => setDualSearchQuery(e.target.value)}
            placeholder="Search items, mechanics, cards, bosses (e.g. Porcupine, Searing Exarch, Rog, Crafting Bench)..."
            className="w-full pl-11 pr-4 py-3 bg-poe-darkest border border-poe-border rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 shadow-inner"
          />
          {dualSearchQuery && (
            <button
              onClick={() => setDualSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
          {matchedDualLinks.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-poe-darker/90 border border-poe-border hover:border-amber-500/40 space-y-2 flex flex-col justify-between transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 font-poe">
                    {item.name}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    {item.category}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Dual Action Buttons */}
              <div className="pt-2 border-t border-poe-border/40 flex items-center justify-between gap-2">
                <a
                  href={item.poeWikiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-2.5 py-1.5 rounded bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>PoEWiki.net</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <a
                  href={item.poeDbUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-2.5 py-1.5 rounded bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>PoEDB.tw</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Curated External Tools Directory */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-poe font-bold text-slate-100">
              Curated Community Tools & Cheat Sheets
            </h2>
            <p className="text-xs text-slate-400">
              The gold standard utilities every SSF exile should keep bookmarked.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {directoryCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedDirectoryCat(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedDirectoryCat === cat
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-poe-card border border-poe-border text-slate-300 hover:text-white'
                }`}
              >
                {cat === 'all' ? 'All Resources' : cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLinks.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-5 rounded-xl border border-poe-border bg-poe-card hover:bg-slate-800/80 hover:border-amber-500/50 transition-all group flex flex-col justify-between space-y-4 shadow-sm"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-slate-900 border border-poe-border">
                    {renderIcon(link.iconName)}
                  </div>
                  {link.isEssential && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      Essential
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-slate-100 group-hover:text-amber-400 transition-colors text-base">
                  {link.title}
                </h3>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {link.description}
                </p>
              </div>

              <div className="pt-2 border-t border-poe-border/40 flex items-center justify-between text-xs text-slate-400 group-hover:text-amber-300">
                <span className="text-[11px] uppercase tracking-wider font-mono">{link.category}</span>
                <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </a>
          ))}
        </div>
      </div>

    </div>
  );
};
