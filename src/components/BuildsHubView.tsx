import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import {
  Flame,
  BookOpen,
  Sparkles,
  Stethoscope,
  Search,
  ThumbsUp,
  ExternalLink
} from 'lucide-react';
import type { CommunityGuide, UserAccount } from '../types';
import { INITIAL_COMMUNITY_GUIDES } from '../data/privateLeagueData';
import { fetchCloudLeagueData, saveCloudGuide } from '../services/cloudSync';

const BuildsShowcaseView = lazy(() => import('./BuildsShowcaseView').then((m) => ({ default: m.BuildsShowcaseView })));
const BuildIngestionView = lazy(() => import('./BuildIngestionView').then((m) => ({ default: m.BuildIngestionView })));
const BuildAnalyzerView = lazy(() => import('./BuildAnalyzerView').then((m) => ({ default: m.BuildAnalyzerView })));
const FullGuideReaderView = lazy(() => import('./FullGuideReaderView').then((m) => ({ default: m.FullGuideReaderView })));

interface BuildsHubViewProps {
  selectedGame: 'poe1' | 'poe2';
  userAccount?: UserAccount | null;
  initialSubTab?: 'community' | 'starters' | 'ingest' | 'doctor';
}

const POE1_PATCHES = ['All', '3.30', '3.29', '3.28'];
const POE2_PATCHES = ['All', '0.5', '0.4', '0.3'];

export const BuildsHubView: React.FC<BuildsHubViewProps> = ({
  selectedGame,
  userAccount,
  initialSubTab = 'community'
}) => {
  const [game, setGame] = useState<'poe1' | 'poe2'>(selectedGame);
  const [subTab, setSubTab] = useState<'community' | 'starters' | 'ingest' | 'doctor'>(initialSubTab);
  const [patchFilter, setPatchFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [classFilter, setClassFilter] = useState<string>('All');
  const [guides, setGuides] = useState<CommunityGuide[]>(INITIAL_COMMUNITY_GUIDES);
  const [activeGuide, setActiveGuide] = useState<CommunityGuide | null>(null);

  const targetLeagueId = game === 'poe2' ? 'poe2-05-ancients' : 'poe1-330-umbra';

  useEffect(() => {
    document.title = 'Builds Hub (PoE 1 & PoE 2) | Exile SSF';
  }, []);

  useEffect(() => {
    setPatchFilter('All');
    setClassFilter('All');
    let cancelled = false;
    fetchCloudLeagueData(targetLeagueId).then((res) => {
      if (cancelled) return;
      if (res && Array.isArray(res.guides) && res.guides.length > 0) {
        setGuides(res.guides);
      } else {
        setGuides(game === 'poe1' ? INITIAL_COMMUNITY_GUIDES : []);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [game, targetLeagueId]);

  const patchOptions = game === 'poe2' ? POE2_PATCHES : POE1_PATCHES;

  const uniqueClasses = useMemo(() => {
    const set = new Set<string>();
    guides.forEach((g) => {
      if (g.ascendancy) set.add(g.ascendancy);
    });
    return ['All', ...Array.from(set).sort()];
  }, [guides]);

  const filteredGuides = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return guides.filter((g) => {
      if (classFilter !== 'All' && g.ascendancy !== classFilter) return false;
      if (patchFilter !== 'All') {
        const hay = `${g.title} ${g.playstyle || ''} ${g.levelingNotes || ''} ${g.createdAt || ''} ${(g.tags || []).join(' ')}`.toLowerCase();
        // Default league guides for PoE 1 map cleanly to 3.30 if no explicit patch tag is present
        const matchesPatch =
          hay.includes(patchFilter.toLowerCase()) ||
          (game === 'poe1' && patchFilter === '3.30' && !hay.includes('3.29') && !hay.includes('3.28')) ||
          (game === 'poe2' && patchFilter === '0.5' && !hay.includes('0.4') && !hay.includes('0.3'));
        if (!matchesPatch) return false;
      }
      if (!q) return true;
      return (
        g.title.toLowerCase().includes(q) ||
        g.ascendancy.toLowerCase().includes(q) ||
        g.className.toLowerCase().includes(q) ||
        (g.authorName || '').toLowerCase().includes(q) ||
        (g.playstyle || '').toLowerCase().includes(q)
      );
    });
  }, [guides, searchQuery, classFilter, patchFilter, game]);

  if (activeGuide) {
    return (
      <Suspense fallback={<div className="p-8 text-center text-xs font-mono text-slate-400">Loading build guide...</div>}>
        <FullGuideReaderView
          guide={activeGuide}
          onBack={() => setActiveGuide(null)}
          onUpdateGuide={(updated) => {
            setActiveGuide(updated);
            setGuides((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
            saveCloudGuide(targetLeagueId, updated);
          }}
        />
      </Suspense>
    );
  }

  return (
    <div className="w-full space-y-5 pb-16 font-sans text-slate-200">
      {/* Unified Builds Hub Header */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/35 to-slate-900 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-lg">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-black font-cinzel text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400" />
            <span>Exile SSF Builds Hub</span>
          </h1>
          <p className="text-xs text-slate-400">
            Community league guides, verified SSF starters, Build Guide Ingestion, and PoB Build Doctor unified across Path of Exile 1 and Path of Exile 2.
          </p>
        </div>

        {/* Game Switcher */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold shrink-0 self-start lg:self-center">
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
      </div>

      {/* Primary Sub Navigation Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/75 border border-slate-800 p-2 rounded-2xl">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'community' as const, label: `Community & League Guides (${guides.length})`, icon: BookOpen },
            { id: 'starters' as const, label: 'SSF Starters', icon: Flame },
            { id: 'ingest' as const, label: 'Ingest / Write Guide', icon: Sparkles },
            { id: 'doctor' as const, label: 'PoB Build Doctor', icon: Stethoscope }
          ].map((t) => {
            const Icon = t.icon;
            const active = subTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSubTab(t.id)}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  active
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Patch / Season Filter Pills */}
        {subTab === 'community' && (
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            <span className="text-[10px] text-slate-500 px-2 uppercase">Patch:</span>
            {patchOptions.map((patch) => (
              <button
                key={patch}
                type="button"
                onClick={() => setPatchFilter(patch)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  patchFilter === patch
                    ? 'bg-amber-500/25 text-amber-200 border border-amber-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {patch}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sub Tab Content */}
      <Suspense fallback={<div className="p-10 text-center text-xs font-mono text-slate-400">Loading build module...</div>}>
        {subTab === 'community' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search builds by skill, ascendancy, playstyle, or author..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {uniqueClasses.slice(0, 8).map((cls) => (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => setClassFilter(cls)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      classFilter === cls
                        ? 'bg-slate-800 text-white border border-indigo-400/50'
                        : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    {cls}
                  </button>
                ))}
              </div>
            </div>

            {filteredGuides.length === 0 ? (
              <div className="p-10 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 space-y-2">
                <p className="text-sm font-bold text-slate-300">
                  No community guides found for {game === 'poe2' ? 'Path of Exile 2' : 'Path of Exile 1'} ({patchFilter}) yet.
                </p>
                <button
                  type="button"
                  onClick={() => setSubTab('ingest')}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer"
                >
                  Ingest or Publish the First Guide
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredGuides.map((g) => (
                  <div
                    key={g.id}
                    onClick={() => setActiveGuide(g)}
                    className="p-5 rounded-2xl border border-slate-800 bg-slate-900/75 hover:border-indigo-500/50 hover:bg-slate-900 transition-all cursor-pointer flex flex-col justify-between gap-4 shadow"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                          {g.ascendancy}
                        </span>
                        <span className="text-[10px] font-mono text-amber-300 font-bold">
                          {game === 'poe2' ? 'PoE 2 • 0.5' : 'PoE 1 • 3.30'}
                        </span>
                      </div>
                      <h3 className="text-base font-black text-white leading-snug">{g.title}</h3>
                      <p className="text-xs text-slate-400 line-clamp-2">{g.levelingNotes || g.playstyle}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-mono">By @{g.authorName || 'Exile'}</span>
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-mono">
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span>{g.upvotes || 0}</span>
                        </span>
                        {g.pobCodeOrUrl && g.pobCodeOrUrl.startsWith('http') && (
                          <a
                            href={g.pobCodeOrUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-indigo-300 hover:text-white inline-flex items-center gap-1 font-mono"
                          >
                            <span>PoB</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {subTab === 'starters' && <BuildsShowcaseView />}
        {subTab === 'ingest' && (
          <BuildIngestionView
            userAccount={userAccount}
            onNavigateToGuides={() => setSubTab('community')}
          />
        )}
        {subTab === 'doctor' && <BuildAnalyzerView />}
      </Suspense>
    </div>
  );
};
