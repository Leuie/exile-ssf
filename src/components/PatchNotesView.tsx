import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  ExternalLink,
  RefreshCw,
  Search,
  Sparkles,
  Copy,
  Check
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

export const PatchNotesView: React.FC<PatchNotesViewProps> = ({ initialGame = 'poe1' }) => {
  const [game, setGame] = useState<'poe1' | 'poe2'>(initialGame);
  const [entries, setEntries] = useState<OfficialPatchNoteEntry[]>([]);
  const [source, setSource] = useState<'live' | 'fallback'>('live');
  const [forumUrl, setForumUrl] = useState<string>('https://www.pathofexile.com/forum/view-forum/patch-notes');
  const [loadingList, setLoadingList] = useState<boolean>(true);

  const [selectedEntry, setSelectedEntry] = useState<OfficialPatchNoteEntry | null>(null);
  const [blocks, setBlocks] = useState<PatchNoteBlock[]>([]);
  const [loadingThread, setLoadingThread] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const loadList = async (targetGame: 'poe1' | 'poe2', forceRefresh: boolean = false) => {
    setLoadingList(true);
    const res = await fetchOfficialPatchNotes(targetGame, forceRefresh);
    if (res && Array.isArray(res.entries) && res.entries.length > 0) {
      setEntries(res.entries);
      setSource(res.source);
      setForumUrl(res.forumUrl);
      setSelectedEntry(res.entries[0]);
    } else {
      setEntries([]);
      setSelectedEntry(null);
    }
    setLoadingList(false);
  };

  useEffect(() => {
    document.title = 'Official Patch Notes | Exile SSF';
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

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(selectedEntry?.officialUrl || `${window.location.origin}/patch-notes`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="w-full space-y-5 pb-16 font-sans text-slate-200">
      {/* Full Width Header Bar */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-lg">
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
            Full width official Path of Exile 1 and Path of Exile 2 patch notes pulled automatically from Grinding Gear Games with instant keyword filtering.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Game Switcher */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => setGame('poe1')}
              className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                game === 'poe1'
                  ? 'bg-amber-600/30 text-amber-200 border border-amber-500/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Path of Exile 1
            </button>
            <button
              type="button"
              onClick={() => setGame('poe2')}
              className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                game === 'poe2'
                  ? 'bg-cyan-600/30 text-cyan-200 border border-cyan-500/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Path of Exile 2
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

      {/* Horizontal Patch Version Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {loadingList ? (
          <div className="text-xs font-mono text-slate-400 py-2">Loading official patch list from GGG...</div>
        ) : (
          entries.map((entry) => {
            const active = selectedEntry?.id === entry.id;
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => {
                  setSelectedEntry(entry);
                  setSearchQuery('');
                }}
                className={`px-3.5 py-2 rounded-xl border text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  active
                    ? 'bg-indigo-600/25 border-indigo-400/60 text-white shadow'
                    : 'bg-slate-900/75 border-slate-800 text-slate-300 hover:border-slate-600 hover:text-white'
                }`}
              >
                {entry.title}
              </button>
            );
          })
        )}
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
