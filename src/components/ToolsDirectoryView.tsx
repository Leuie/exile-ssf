import React, { useState } from 'react';
import { 
  ExternalLink, 
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

export const ToolsDirectoryView: React.FC = () => {
  const [selectedDirectoryCat, setSelectedDirectoryCat] = useState<string>('all');

  const directoryCategories = [
    'all',
    'Databases & Wikis',
    'Crafting & Emulators',
    'Filter & Regex',
    'Builds & Ladders',
    'League Mechanics'
  ];

  const filteredLinks = [...DIRECTORY_LINKS]
    .filter((l) => selectedDirectoryCat === 'all' || l.category === selectedDirectoryCat)
    .sort((a, b) => a.title.localeCompare(b.title));

  const renderIcon = (name: string) => {
    switch (name) {
      case 'BookOpen': return <BookOpen className="w-5 h-5 text-amber-500 dark:text-amber-400" />;
      case 'Database': return <Database className="w-5 h-5 text-sky-500 dark:text-sky-400" />;
      case 'Hammer': return <Hammer className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />;
      case 'Filter': return <Filter className="w-5 h-5 text-purple-500 dark:text-purple-400" />;
      case 'TrendingUp': return <TrendingUp className="w-5 h-5 text-rose-500 dark:text-rose-400" />;
      case 'Flame': return <Flame className="w-5 h-5 text-amber-600 dark:text-amber-500" />;
      case 'Compass': return <Compass className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />;
      default: return <Sparkles className="w-5 h-5 text-amber-500 dark:text-amber-400" />;
    }
  };

  return (
    <div className="space-y-8 w-full space-y-6 pb-20 font-sans text-slate-200">
      
      {/* Header */}
      <div className="p-5 sm:p-6 rounded-2xl border border-slate-800 bg-slate-900/85 backdrop-blur-md space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-purple-600 dark:text-purple-400">
          <Link className="w-4 h-4" />
          The Curated Ecosystem
        </div>
        <h1 className="text-3xl font-poe font-bold text-slate-900 dark:text-slate-100">
          Tools Directory
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
          A massive library of Path of Exile's best tools linked and collated in one place.
        </p>
      </div>

      {/* Filter Category Pills */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/80/60 p-4 rounded-xl border border-slate-800 shadow-sm">
        <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Filter Category:</div>
        <div className="flex flex-wrap gap-1.5 overflow-x-auto">
          {directoryCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedDirectoryCat(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedDirectoryCat === cat
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-100 dark:bg-poe-dark border border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat === 'all' ? 'All Resources' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Tools Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLinks.map((link) => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-5 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:border-amber-500/50 dark:hover:border-amber-500/50 transition-all group flex flex-col justify-between space-y-4 shadow-sm"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-[#0f172a] border border-slate-800">
                  {renderIcon(link.iconName)}
                </div>
                {link.isEssential && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                    Essential
                  </span>
                )}
              </div>

              <h3 className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors text-base">
                {link.title}
              </h3>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {link.description}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/40 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-300">
              <span className="text-[11px] uppercase tracking-wider font-mono">{link.category}</span>
              <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </a>
        ))}
      </div>

    </div>
  );
};
