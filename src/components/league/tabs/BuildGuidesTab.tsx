import React, { useState } from 'react';
import {
  Search,
  X,
  ArrowUpDown,
  BookOpen,
  ThumbsUp,
  ExternalLink
} from 'lucide-react';
import type { CommunityGuide, LookingForItem, UserAccount } from '../../../types';

export interface BuildGuidesTabProps {
  guides: CommunityGuide[];
  setGuides: React.Dispatch<React.SetStateAction<CommunityGuide[]>>;
  onSelectGuide: (guide: CommunityGuide) => void;
  userAccount?: UserAccount | null;
  fireConfetti: () => void;
  setLookingForItems: React.Dispatch<React.SetStateAction<LookingForItem[]>>;
  setCopyNotice: (notice: string | null) => void;
}

export const BuildGuidesTab: React.FC<BuildGuidesTabProps> = ({
  guides,
  setGuides,
  onSelectGuide,
  userAccount,
  fireConfetti,
  setLookingForItems,
  setCopyNotice
}) => {
  const [guideSearch, setGuideSearch] = useState<string>('');
  const [guideSort, setGuideSort] = useState<'upvotes' | 'rating' | 'ascendancy' | 'title' | 'newest'>('upvotes');
  const [guideClassFilter, setGuideClassFilter] = useState<string>('all');
  const [guidePlaystyleFilter, setGuidePlaystyleFilter] = useState<string>('all');

  const filteredAndSortedGuides = guides
    .filter((g) => {
      if (guideSearch.trim()) {
        const query = guideSearch.toLowerCase().trim();
        const matchTitle = g.title.toLowerCase().includes(query);
        const matchAsc = g.ascendancy.toLowerCase().includes(query);
        const matchClass = g.className.toLowerCase().includes(query);
        const matchAuthor = g.authorName.toLowerCase().includes(query);
        const matchPlaystyle = g.playstyle.toLowerCase().includes(query);
        const matchLeveling = g.levelingNotes.toLowerCase().includes(query);
        const matchEndgame = g.endgameNotes.toLowerCase().includes(query);
        if (!matchTitle && !matchAsc && !matchClass && !matchAuthor && !matchPlaystyle && !matchLeveling && !matchEndgame) {
          return false;
        }
      }

      if (guideClassFilter !== 'all') {
        const c = g.className.toLowerCase();
        const a = g.ascendancy.toLowerCase();
        const target = guideClassFilter.toLowerCase();
        if (!c.includes(target) && !a.includes(target)) {
          return false;
        }
      }

      if (guidePlaystyleFilter !== 'all') {
        if (!g.playstyle.toLowerCase().includes(guidePlaystyleFilter.toLowerCase())) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      if (guideSort === 'upvotes') {
        return b.upvotes - a.upvotes;
      }
      if (guideSort === 'rating') {
        return b.starterRating - a.starterRating;
      }
      if (guideSort === 'ascendancy') {
        return a.ascendancy.localeCompare(b.ascendancy);
      }
      if (guideSort === 'title') {
        return a.title.localeCompare(b.title);
      }
      if (guideSort === 'newest') {
        return b.id.localeCompare(a.id);
      }
      return 0;
    });

  return (
    <div className="space-y-4">
      {/* Controls Bar: Search, Sort Dropdown and Class Filter */}
      <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-md space-y-3 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={guideSearch}
              onChange={(e) => setGuideSearch(e.target.value)}
              placeholder="Search guides by build, ascendancy, author..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 font-mono transition-colors"
            />
            {guideSearch && (
              <button
                type="button"
                onClick={() => setGuideSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">Sort:</span>
              <select
                value={guideSort}
                onChange={(e) => setGuideSort(e.target.value as any)}
                className="bg-transparent text-slate-200 text-xs font-mono focus:outline-none cursor-pointer"
              >
                <option value="upvotes" className="bg-slate-900 text-slate-200">Most Upvoted</option>
                <option value="rating" className="bg-slate-900 text-slate-200">Highest SSF Rating</option>
                <option value="ascendancy" className="bg-slate-900 text-slate-200">Ascendancy (A to Z)</option>
                <option value="title" className="bg-slate-900 text-slate-200">Guide Name (A to Z)</option>
                <option value="newest" className="bg-slate-900 text-slate-200">Newest Added</option>
              </select>
            </div>

            {(guideSearch || guideClassFilter !== 'all' || guidePlaystyleFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setGuideSearch('');
                  setGuideClassFilter('all');
                  setGuidePlaystyleFilter('all');
                }}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors cursor-pointer"
                title="Reset search and filters"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-xs">
          {/* Class and Archetype Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-mono text-slate-500 mr-1">Class:</span>
            {['all', 'Duelist', 'Ranger', 'Witch', 'Templar'].map((cls) => (
              <button
                key={cls}
                type="button"
                onClick={() => setGuideClassFilter(cls)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                  guideClassFilter === cls
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {cls === 'all' ? 'All Classes' : cls}
              </button>
            ))}
          </div>

          {/* Counter */}
          <div className="text-[11px] font-mono text-slate-400">
            Showing {filteredAndSortedGuides.length} of {guides.length} guides
          </div>
        </div>
      </div>

      {/* Guides Grid */}
      {filteredAndSortedGuides.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-slate-800 bg-slate-900/40 space-y-3">
          <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
          <h4 className="text-base font-bold text-slate-300">No Guides Match Criteria</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            No community guides matched your current search query or class filter. Clear your filters to view all available builds.
          </p>
          <button
            type="button"
            onClick={() => {
              setGuideSearch('');
              setGuideClassFilter('all');
              setGuidePlaystyleFilter('all');
            }}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer transition-colors"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAndSortedGuides.map((guide) => (
            <div
              key={guide.id}
              className="p-4 rounded-xl border border-slate-800 bg-slate-900/70 space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div
                    onClick={() => onSelectGuide(guide)}
                    className="cursor-pointer group flex-1 mr-2"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono uppercase text-slate-400">
                        {guide.ascendancy} • {guide.playstyle}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                        Rating: {guide.starterRating}/10
                      </span>
                    </div>
                    <div className="font-bold text-sm text-white group-hover:text-indigo-300 transition-colors mt-0.5 flex items-center gap-1.5">
                      <span>{guide.title}</span>
                      <BookOpen className="w-3.5 h-3.5 text-indigo-400 opacity-80 group-hover:opacity-100" />
                    </div>
                    <div className="text-[11px] text-slate-500">Shared by @{guide.authorName}</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setGuides((prev) => prev.map((g) => (g.id === guide.id ? { ...g, upvotes: g.upvotes + 1 } : g)));
                      fireConfetti();
                    }}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1 cursor-pointer flex-shrink-0"
                    title="Upvote this community guide"
                  >
                    <ThumbsUp className="w-3 h-3 text-slate-400" />
                    <span>{guide.upvotes}</span>
                  </button>
                </div>

                <div className="space-y-1 text-xs text-slate-400">
                  <p><strong className="text-slate-300">Leveling: </strong>{guide.levelingNotes}</p>
                  <p><strong className="text-slate-300">Endgame: </strong>{guide.endgameNotes}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 mt-auto">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectGuide(guide)}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Read Full Guide</span>
                  </button>

                  <a
                    href={guide.pobCodeOrUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700"
                  >
                    <span>PoB</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const newItems: LookingForItem[] = guide.requiredUniques.map((u) => ({
                      id: `lf-auto-${Date.now()}-${Math.random()}`,
                      characterName: userAccount?.characterName || 'MyCharacter',
                      displayName: userAccount?.displayName || 'Leuie',
                      preferredContact: userAccount?.preferredContact || 'app',
                      itemName: u,
                      category: 'Unique',
                      status: 'NEED',
                      notes: `Required for ${guide.title}`,
                      poeWikiUrl: `https://www.poewiki.net/wiki/${encodeURIComponent(u.replace(/ /g, '_'))}`,
                      poeDbUrl: `https://poedb.tw/us/search?q=${encodeURIComponent(u)}`
                    }));
                    setLookingForItems((prev) => [...newItems, ...prev]);
                    fireConfetti();
                    setCopyNotice(`Added ${guide.requiredUniques.length} items to your Looking For list!`);
                    setTimeout(() => setCopyNotice(null), 2500);
                  }}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono cursor-pointer"
                >
                  + Add to Looking For
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
