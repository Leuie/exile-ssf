import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileText,
  ExternalLink,
  RefreshCw,
  Search,
  Sparkles,
  Copy,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Layers,
  Flame,
  Hammer
} from 'lucide-react';
import {
  fetchOfficialPatchNotes,
  fetchOfficialPatchThread,
  type OfficialPatchNoteEntry,
  type PatchNoteBlock
} from '../services/cloudSync';

interface PatchNotesViewProps {
  initialGame?: 'poe1' | 'poe2';
}

type PatchKind = 'expansion' | 'patch' | 'hotfix' | 'announcement';

interface ClassifiedPatch extends OfficialPatchNoteEntry {
  majorSeries: string; // e.g. '3.30', '0.5', or 'Announcements'
  majorSortKey: number; // e.g. 3030 for 3.30, -1 for Announcements
  kind: PatchKind;
}

interface ExpansionGroup {
  series: string;
  label: string;
  sortKey: number;
  items: ClassifiedPatch[];
}

function classifyPatchEntry(entry: OfficialPatchNoteEntry): ClassifiedPatch {
  const title = entry.title.trim();
  const lower = title.toLowerCase();
  const verMatch = title.match(/\b(\d+)\.(\d+)(?:\.(\d+)([a-z])?)?/i);

  if (!verMatch) {
    return {
      ...entry,
      majorSeries: 'Announcements',
      majorSortKey: -1,
      kind: 'announcement'
    };
  }

  const maj = parseInt(verMatch[1], 10);
  const min = parseInt(verMatch[2], 10);
  const sub = verMatch[3] ? parseInt(verMatch[3], 10) : 0;
  const letter = verMatch[4] || '';
  const majorSeries = `${maj}.${min}`;
  const majorSortKey = maj * 1000 + min;

  let kind: PatchKind = 'patch';
  if (lower.includes('hotfix')) {
    kind = 'hotfix';
  } else if (
    lower.includes('content update') ||
    (sub === 0 && !letter && (lower.includes('patch notes') || lower.includes('expansion') || lower.includes('update')))
  ) {
    kind = 'expansion';
  }

  return {
    ...entry,
    majorSeries,
    majorSortKey,
    kind
  };
}

export const PatchNotesView: React.FC<PatchNotesViewProps> = ({ initialGame = 'poe1' }) => {
  const [game, setGame] = useState<'poe1' | 'poe2'>(initialGame);
  const [entries, setEntries] = useState<OfficialPatchNoteEntry[]>([]);
  const [source, setSource] = useState<'live' | 'fallback'>('live');
  const [forumUrl, setForumUrl] = useState<string>('https://www.pathofexile.com/forum/view-forum/patch-notes');
  const [loadingList, setLoadingList] = useState<boolean>(true);

  const [selectedEntry, setSelectedEntry] = useState<ClassifiedPatch | null>(null);
  const [blocks, setBlocks] = useState<PatchNoteBlock[]>([]);
  const [loadingThread, setLoadingThread] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Grouped Dropdown State
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [dropdownSearch, setDropdownSearch] = useState<string>('');
  const [collapsedSeries, setCollapsedSeries] = useState<Record<string, boolean>>({});
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const classifiedEntries = useMemo<ClassifiedPatch[]>(() => {
    return entries.map(classifyPatchEntry);
  }, [entries]);

  const expansionGroups = useMemo<ExpansionGroup[]>(() => {
    const map = new Map<string, ExpansionGroup>();
    for (const item of classifiedEntries) {
      const existing = map.get(item.majorSeries);
      if (existing) {
        existing.items.push(item);
      } else {
        map.set(item.majorSeries, {
          series: item.majorSeries,
          label:
            item.majorSeries === 'Announcements'
              ? 'Announcements & Maintenance'
              : `Expansion ${item.majorSeries} Series`,
          sortKey: item.majorSortKey,
          items: [item]
        });
      }
    }

    const groups = Array.from(map.values()).sort((a, b) => b.sortKey - a.sortKey);
    // Pin Major Expansion post at the very top of its group, followed by sub patches & hotfixes in original newest order
    for (const g of groups) {
      const majorItems = g.items.filter((i) => i.kind === 'expansion');
      const otherItems = g.items.filter((i) => i.kind !== 'expansion');
      g.items = [...majorItems, ...otherItems];
    }
    return groups;
  }, [classifiedEntries]);

  const flatOrderedList = useMemo(() => {
    return expansionGroups.flatMap((g) => g.items);
  }, [expansionGroups]);

  const filteredDropdownGroups = useMemo(() => {
    const q = dropdownSearch.trim().toLowerCase();
    if (!q) return expansionGroups;
    return expansionGroups
      .map((g) => ({
        ...g,
        items: g.items.filter(
          (i) =>
            i.title.toLowerCase().includes(q) ||
            g.label.toLowerCase().includes(q) ||
            i.majorSeries.toLowerCase().includes(q)
        )
      }))
      .filter((g) => g.items.length > 0);
  }, [expansionGroups, dropdownSearch]);

  const loadList = async (targetGame: 'poe1' | 'poe2', forceRefresh: boolean = false) => {
    setLoadingList(true);
    const res = await fetchOfficialPatchNotes(targetGame, forceRefresh);
    if (res && Array.isArray(res.entries) && res.entries.length > 0) {
      setEntries(res.entries);
      setSource(res.source);
      setForumUrl(res.forumUrl);

      // Default to newest versioned patch note rather than a generic Server Maintenance post
      const classified = res.entries.map(classifyPatchEntry);
      const firstVersioned = classified.find((c) => c.kind !== 'announcement') || classified[0];
      setSelectedEntry(firstVersioned);
    } else {
      setEntries([]);
      setSelectedEntry(null);
    }
    setLoadingList(false);
  };

  useEffect(() => {
    document.title = 'Official Patch Notes | Exile SSF';
    setDropdownOpen(false);
    setDropdownSearch('');
    loadList(game, false);
  }, [game]);

  useEffect(() => {
    if (!selectedEntry) {
      setBlocks([]);
      return;
    }
    let cancelled = false;
    setLoadingThread(true);
    fetchOfficialPatchThread(selectedEntry.id).then((res) => {
      if (!cancelled) {
        setBlocks(res?.blocks || []);
        setLoadingThread(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [selectedEntry?.id]);

  const filteredBlocks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return blocks;
    return blocks.filter((b) => b.kind === 'heading' || b.text.toLowerCase().includes(q));
  }, [blocks, searchQuery]);

  const currentIndex = selectedEntry
    ? flatOrderedList.findIndex((i) => i.id === selectedEntry.id)
    : -1;

  const handleStep = (delta: number) => {
    if (currentIndex < 0) return;
    const nextIdx = currentIndex + delta;
    if (nextIdx >= 0 && nextIdx < flatOrderedList.length) {
      setSelectedEntry(flatOrderedList[nextIdx]);
      setSearchQuery('');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(selectedEntry?.officialUrl || `${window.location.origin}/patch-notes`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const toggleGroupCollapse = (series: string) => {
    setCollapsedSeries((prev) => ({ ...prev, [series]: !prev[series] }));
  };

  const renderKindBadge = (kind: PatchKind) => {
    if (kind === 'expansion') {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
          Major Expansion
        </span>
      );
    }
    if (kind === 'patch') {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shrink-0">
          Patch
        </span>
      );
    }
    if (kind === 'hotfix') {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/35 shrink-0">
          Hotfix
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
        Notice
      </span>
    );
  };

  return (
    <div className="w-full space-y-5 pb-16 font-sans text-slate-200">
      {/* Full Width Header Bar */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-[#0e1320] via-indigo-950/30 to-[#0e1320] p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-lg">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black font-cinzel text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-400" />
              <span>Official Patch Notes</span>
            </h1>
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                source === 'live'
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
              }`}
            >
              {source === 'live' ? 'Live GGG Feed' : 'Official Index'}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Full width official Path of Exile 1 and Path of Exile 2 patch notes organized by major expansion series with instant keyword search.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Game Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-indigo-500/25 text-xs font-bold">
            <button
              type="button"
              onClick={() => setGame('poe1')}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                game === 'poe1'
                  ? 'bg-indigo-600/30 text-white border border-indigo-400/60 shadow-sm'
                  : 'text-slate-400 border border-transparent hover:text-white'
              }`}
            >
              <Flame className={`w-3.5 h-3.5 ${game === 'poe1' ? 'text-amber-300' : 'text-slate-500'}`} />
              <span>Path of Exile 1</span>
            </button>
            <button
              type="button"
              onClick={() => setGame('poe2')}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                game === 'poe2'
                  ? 'bg-indigo-600/30 text-white border border-indigo-400/60 shadow-sm'
                  : 'text-slate-400 border border-transparent hover:text-white'
              }`}
            >
              <Hammer className={`w-3.5 h-3.5 ${game === 'poe2' ? 'text-amber-300' : 'text-slate-500'}`} />
              <span>Path of Exile 2</span>
            </button>
          </div>

          <button
            type="button"
            disabled={loadingList}
            onClick={() => loadList(game, true)}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-slate-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Fetch latest hotfixes directly from Grinding Gear Games"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${loadingList ? 'animate-spin' : ''}`} />
            <span>Refresh GGG</span>
          </button>

          <a
            href={forumUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow"
          >
            <span>GGG Forum</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Grouped Expansion Dropdown Selector Bar (Zero Horizontal Overflow) */}
      <div className="rounded-2xl border border-indigo-500/25 bg-gradient-to-r from-[#0d121d] via-[#101726] to-[#0d121d] p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-inner">
        <div ref={dropdownRef} className="relative flex-1 min-w-0">
          <button
            type="button"
            disabled={loadingList || flatOrderedList.length === 0}
            onClick={() => setDropdownOpen((o) => !o)}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-indigo-400/40 text-left flex items-center justify-between gap-3 transition-all cursor-pointer shadow-sm"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Layers className="w-4 h-4 text-amber-400 shrink-0" />
              {loadingList ? (
                <span className="text-xs font-mono text-slate-400">Loading official patch series from GGG...</span>
              ) : selectedEntry ? (
                <div className="flex items-center gap-2 min-w-0">
                  <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-700 text-[11px] font-mono font-bold text-amber-300 shrink-0">
                    {selectedEntry.majorSeries}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-white truncate">
                    {selectedEntry.title}
                  </span>
                  <span className="hidden sm:inline-flex">{renderKindBadge(selectedEntry.kind)}</span>
                </div>
              ) : (
                <span className="text-xs text-slate-400">Select a Patch or Expansion...</span>
              )}
            </div>
            <ChevronDown
              className={`w-4 h-4 text-slate-300 shrink-0 transition-transform ${
                dropdownOpen ? 'rotate-180 text-amber-300' : ''
              }`}
            />
          </button>

          {/* Grouped Expansion Dropdown Panel */}
          {dropdownOpen && (
            <div className="absolute left-0 right-0 mt-2 z-40 rounded-2xl border border-indigo-400/40 bg-[#0b0f18] shadow-2xl overflow-hidden">
              <div className="p-2.5 border-b border-slate-800 bg-slate-900/90 flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={dropdownSearch}
                  onChange={(e) => setDropdownSearch(e.target.value)}
                  placeholder="Filter by expansion (e.g. 3.30, 3.29) or hotfix..."
                  className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
                  autoFocus
                />
                {dropdownSearch && (
                  <button
                    type="button"
                    onClick={() => setDropdownSearch('')}
                    className="text-[10px] font-mono text-slate-400 hover:text-white px-1.5 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-800/80">
                {filteredDropdownGroups.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No patch notes matched "{dropdownSearch}".
                  </div>
                ) : (
                  filteredDropdownGroups.map((group) => {
                    const isCollapsed = !!collapsedSeries[group.series] && !dropdownSearch.trim();
                    return (
                      <div key={group.series} className="bg-slate-950/60">
                        <button
                          type="button"
                          onClick={() => toggleGroupCollapse(group.series)}
                          className="w-full px-3.5 py-2 bg-slate-900/95 hover:bg-slate-800/80 flex items-center justify-between text-left cursor-pointer sticky top-0 z-10 border-b border-slate-800/60"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-300">
                              {group.label}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                              {group.items.length}
                            </span>
                          </div>
                          <ChevronDown
                            className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                              isCollapsed ? '' : 'rotate-180'
                            }`}
                          />
                        </button>

                        {!isCollapsed && (
                          <div className="p-1.5 space-y-1">
                            {group.items.map((item) => {
                              const isSelected = selectedEntry?.id === item.id;
                              const isExpansion = item.kind === 'expansion';
                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedEntry(item);
                                    setSearchQuery('');
                                    setDropdownOpen(false);
                                  }}
                                  className={`w-full px-3 py-2 rounded-xl text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-indigo-600/30 border border-indigo-400/60 text-white shadow-sm'
                                      : isExpansion
                                      ? 'bg-amber-500/10 border border-amber-500/25 text-amber-100 hover:bg-amber-500/15'
                                      : 'border border-transparent text-slate-300 hover:bg-slate-800/70 hover:text-white pl-5'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    {!isExpansion && (
                                      <span className="text-slate-600 text-xs shrink-0">↳</span>
                                    )}
                                    <span className={`text-xs truncate ${isExpansion || isSelected ? 'font-bold' : 'font-medium'}`}>
                                      {item.title}
                                    </span>
                                  </div>
                                  {renderKindBadge(item.kind)}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Expansion Summary & Prev / Next Stepper */}
        <div className="flex items-center justify-between md:justify-end gap-2 shrink-0">
          <span className="text-[11px] font-mono text-slate-400 px-2">
            {flatOrderedList.length > 0 && currentIndex >= 0
              ? `${currentIndex + 1} of ${flatOrderedList.length} posts (${expansionGroups.length} groups)`
              : '0 posts'}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentIndex <= 0}
              onClick={() => handleStep(-1)}
              title="Newer patch note"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-600 text-slate-200 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={currentIndex < 0 || currentIndex >= flatOrderedList.length - 1}
              onClick={() => handleStep(1)}
              title="Older patch note"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-600 text-slate-200 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Full Width Active Patch Reader */}
      {selectedEntry && (
        <div className="w-full rounded-2xl border border-slate-800 bg-[#0d1016] shadow-xl overflow-hidden">
          <div className="px-5 py-4 bg-slate-900/90 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                    game === 'poe2'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {game === 'poe2' ? 'Path of Exile 2' : 'Path of Exile 1'}
                </span>
                {renderKindBadge(selectedEntry.kind)}
                <span className="text-[11px] font-mono text-slate-400">{selectedEntry.postedAt}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white">{selectedEntry.title}</h2>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search inside patch notes..."
                  className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-56"
                />
              </div>

              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-slate-200 flex items-center gap-1.5 cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
              </button>

              <a
                href={selectedEntry.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-bold flex items-center gap-1.5"
              >
                <span>Read on pathofexile.com</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="p-6 sm:p-8 w-full space-y-3 leading-relaxed">
            {loadingThread ? (
              <div className="py-12 text-center text-xs font-mono text-slate-400">
                Fetching official patch note body from Grinding Gear Games...
              </div>
            ) : filteredBlocks.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">
                No lines matched "{searchQuery}". Clear the search box or open the official GGG link above.
              </div>
            ) : (
              filteredBlocks.map((block, idx) => {
                if (block.kind === 'heading') {
                  return (
                    <h3
                      key={idx}
                      className="text-base font-black text-amber-300 pt-4 pb-1 border-b border-slate-800/80 flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{block.text}</span>
                    </h3>
                  );
                }
                if (block.kind === 'bullet') {
                  return (
                    <div key={idx} className="flex items-start gap-2.5 text-sm text-slate-200 pl-2">
                      <span className="text-indigo-400 font-bold mt-0.5">•</span>
                      <span>{block.text}</span>
                    </div>
                  );
                }
                return (
                  <p key={idx} className="text-sm text-slate-300">
                    {block.text}
                  </p>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
