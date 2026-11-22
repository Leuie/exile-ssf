import React, { useState, useEffect, useMemo } from 'react';
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
  Compass,
  Search,
  Star,
  Cloud
} from 'lucide-react';
import { DIRECTORY_LINKS } from '../data/directoryData';
import type { UserAccount } from '../types';
import { fetchUserToolState, saveUserToolState } from '../services/cloudSync';

interface ToolsDirectoryViewProps {
  selectedGame?: 'poe1' | 'poe2';
  userAccount?: UserAccount | null;
}

const LOCAL_PINS_KEY = 'exile_ssf_pinned_tools_v1';

export const ToolsDirectoryView: React.FC<ToolsDirectoryViewProps> = ({
  selectedGame = 'poe1',
  userAccount
}) => {
  const [selectedDirectoryCat, setSelectedDirectoryCat] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [gameFilter, setGameFilter] = useState<'all' | 'poe1' | 'poe2'>('all');
  const [pinnedIds, setPinnedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_PINS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [cloudSynced, setCloudSynced] = useState<boolean>(false);

  useEffect(() => {
    if (!userAccount?.displayName) return;
    let cancelled = false;
    fetchUserToolState<string[]>(userAccount.displayName, 'pinned_tools').then((data) => {
      if (!cancelled && Array.isArray(data)) {
        setPinnedIds(data);
        setCloudSynced(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [userAccount?.displayName]);

  const togglePin = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = pinnedIds.includes(id) ? pinnedIds.filter((x) => x !== id) : [...pinnedIds, id];
    setPinnedIds(next);
    try {
      localStorage.setItem(LOCAL_PINS_KEY, JSON.stringify(next));
    } catch {}
    if (userAccount?.displayName) {
      saveUserToolState(userAccount.displayName, 'pinned_tools', next).then((ok) => {
        if (ok) setCloudSynced(true);
      });
    }
  };

  const directoryCategories = [
    'all',
    'Databases & Wikis',
    'Crafting & Emulators',
    'Filter & Regex',
    'Builds & Ladders',
    'League Mechanics'
  ];

  const filteredLinks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return [...DIRECTORY_LINKS]
      .filter((l) => {
        if (selectedDirectoryCat !== 'all' && l.category !== selectedDirectoryCat) return false;
        if (gameFilter === 'poe2') {
          const hay = `${l.title} ${l.description} ${l.url}`.toLowerCase();
          if (!hay.includes('poe2') && !hay.includes('poe 2') && !hay.includes('filterblade') && !hay.includes('craftofexile') && !hay.includes('mobalytics') && !hay.includes('maxroll')) {
            return false;
          }
        }
        if (!q) return true;
        return (
          l.title.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          l.category.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const aPinned = pinnedIds.includes(a.id) ? 1 : 0;
        const bPinned = pinnedIds.includes(b.id) ? 1 : 0;
        if (aPinned !== bPinned) return bPinned - aPinned;
        return a.title.localeCompare(b.title);
      });
  }, [selectedDirectoryCat, searchQuery, gameFilter, pinnedIds]);

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
    <div className="w-full space-y-6 pb-20 font-sans text-slate-200">
      {/* Header */}
      <div className="p-5 sm:p-6 rounded-2xl border border-slate-800 bg-slate-900/85 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-purple-400">
            <Link className="w-4 h-4" />
            <span>The Curated Ecosystem</span>
            {cloudSynced && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-[10px] font-mono text-emerald-300 normal-case">
                <Cloud className="w-3 h-3" />
                <span>Pins Synced</span>
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-poe font-bold text-slate-100">
            Tools Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            A curated library of Path of Exile's essential community tools. Star your favorite tools to pin them to the top of your Exile SSF account.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold shrink-0 self-start md:self-center">
          {(['all', 'poe1', 'poe2'] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGameFilter(g)}
              className={`px-3 py-1.5 rounded-lg cursor-pointer ${
                gameFilter === g
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {g === 'all' ? 'All Tools' : g === 'poe1' ? 'PoE 1' : 'PoE 2 Ready'}
            </button>
          ))}
        </div>
      </div>

      {/* Search & Category Pills */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-900/70 p-4 rounded-2xl border border-slate-800 shadow-sm">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${selectedGame === 'poe2' ? 'PoE 2' : 'PoE'} tools, craft emulators, regex, or wikis...`}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-400"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {directoryCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedDirectoryCat(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
                selectedDirectoryCat === cat
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-sm'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              {cat === 'all' ? 'All Categories' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Tools Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLinks.map((link) => {
          const isPinned = pinnedIds.includes(link.id);
          return (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`p-5 rounded-2xl border transition-all group flex flex-col justify-between space-y-4 shadow-sm ${
                isPinned
                  ? 'border-amber-500/50 bg-amber-500/5 hover:bg-slate-900'
                  : 'border-slate-800 bg-slate-900/80 hover:bg-slate-800/80 hover:border-amber-500/40'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                    {renderIcon(link.iconName)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {link.isEssential && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        Essential
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => togglePin(link.id, e)}
                      title={isPinned ? 'Unpin favorite tool' : 'Pin to top of your directory'}
                      className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                        isPinned
                          ? 'bg-amber-500/20 border-amber-400/50 text-amber-300'
                          : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-amber-300'
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${isPinned ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-slate-100 group-hover:text-amber-400 transition-colors text-base">
                  {link.title}
                </h3>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {link.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400 group-hover:text-amber-300">
                <span className="text-[11px] uppercase tracking-wider font-mono">{link.category}</span>
                <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
};
