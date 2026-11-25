import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import {
  Flame,
  BookOpen,
  Sparkles,
  Stethoscope,
  Search,
  ThumbsUp,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  Globe
} from 'lucide-react';
import type { CommunityGuide, SSFBuild, UserAccount } from '../types';
import { INITIAL_COMMUNITY_GUIDES } from '../data/privateLeagueData';
import { SSF_BUILDS } from '../data/builds';
import {
  fetchCloudLeagueData,
  saveCloudGuide,
  fetchExternalBuildGuides,
  type ExternalBuildsResponse
} from '../services/cloudSync';

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

// IDs in SSF_BUILDS that already have richer League Guide counterparts in INITIAL_COMMUNITY_GUIDES
const DUPLICATE_STARTER_IDS = new Set([
  'archmage-ice-nova-hierophant',
  'penance-brand-ignite-elementalist',
  'lightning-strike-slayer-ssf',
  'lightning-arrow-deadeye-ssf'
]);

function ssfBuildToCommunityGuide(build: SSFBuild): CommunityGuide {
  const markdownLines: string[] = [
    `# ${build.name}`,
    '',
    build.summary,
    '',
    '## SSF Strengths & Pros',
    ...build.pros.map((p) => `- ${p}`),
    '',
    '## Weaknesses & Watchouts',
    ...build.cons.map((c) => `- ${c}`),
    '',
    '## Campaign & Leveling Gem Progression',
    ...build.levelingGems.map((g) => `- ${g}`),
    '',
    '## Deterministic SSF Crafting Roadmap',
    ...build.keyCraftingSteps.map((s) => `- ${s}`)
  ];

  if (build.targetUniquesOrCards && build.targetUniquesOrCards.length > 0) {
    markdownLines.push('', '## Target Uniques & Divination Cards');
    for (const item of build.targetUniquesOrCards) {
      markdownLines.push(`- **${item.name}**: ${item.farmLocation}`);
    }
  }

  return {
    id: `starter-${build.id}`,
    title: build.name,
    authorName: build.creator,
    authorDiscord: build.creator,
    className: build.class,
    ascendancy: build.ascendancy,
    playstyle: build.playstyle,
    starterRating: 0,
    isSsfStarter: true,
    uniqueDependency: build.uniqueDependency,
    pobCodeOrUrl: build.pobUrl || 'https://pobb.in/',
    videoOrForumUrl: build.creatorUrl || build.videoGuideUrl,
    levelingNotes: build.summary,
    endgameNotes: build.keyCraftingSteps.join(' '),
    requiredUniques: (build.targetUniquesOrCards || []).map((t) => t.name),
    atlasFocus: ['Essences', 'Expedition', 'Harvest'],
    upvotes: 0,
    createdAt: 'Curated SSF Starter',
    game: 'poe1',
    creatorName: build.creator,
    creatorChannelUrl: build.creatorUrl || build.videoGuideUrl,
    creatorPlatform: build.creatorUrl?.includes('mobalytics')
      ? 'Mobalytics'
      : build.creatorUrl?.includes('maxroll')
      ? 'Maxroll'
      : 'Community',
    tags: ['3.30', 'SSF Starter', build.playstyle, build.uniqueDependency],
    fullGuideMarkdown: markdownLines.join('\n')
  };
}

const CURATED_SSF_STARTER_GUIDES: CommunityGuide[] = SSF_BUILDS
  .filter((b) => !DUPLICATE_STARTER_IDS.has(b.id))
  .map(ssfBuildToCommunityGuide);

function hasMinimumGuideDetail(g: CommunityGuide): boolean {
  if (!g.title?.trim() || !g.ascendancy?.trim()) return false;
  if (g.isExternalLinkOnly) {
    return Boolean(g.videoOrForumUrl?.startsWith('http') || g.pobCodeOrUrl?.startsWith('http'));
  }
  const hasRichMarkdown = (g.fullGuideMarkdown || '').trim().length >= 120;
  const hasStructuredNotes =
    (g.levelingNotes || '').trim().length >= 40 && (g.endgameNotes || '').trim().length >= 40;
  return hasRichMarkdown || hasStructuredNotes;
}

function isStarterGuide(g: CommunityGuide): boolean {
  if (g.isSsfStarter) return true;
  const hay = `${g.createdAt || ''} ${(g.tags || []).join(' ')} ${g.title || ''}`.toLowerCase();
  return hay.includes('starter') || hay.includes('ssf');
}

export const BuildsHubView: React.FC<BuildsHubViewProps> = ({
  selectedGame,
  userAccount,
  initialSubTab = 'community'
}) => {
  const [game, setGame] = useState<'poe1' | 'poe2'>(selectedGame);
  const [subTab, setSubTab] = useState<'community' | 'ingest' | 'doctor'>(
    initialSubTab === 'starters' ? 'community' : initialSubTab
  );
  const [patchFilter, setPatchFilter] = useState<string>('All');
  const [sourceFilter, setSourceFilter] = useState<'All' | 'Exile SSF' | 'Mobalytics' | 'Maxroll'>('All');
  const [ssfStarterOnly, setSsfStarterOnly] = useState<boolean>(initialSubTab === 'starters');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [classFilter, setClassFilter] = useState<string>('All');
  const [cloudGuides, setCloudGuides] = useState<CommunityGuide[]>(INITIAL_COMMUNITY_GUIDES);
  const [externalData, setExternalData] = useState<ExternalBuildsResponse | null>(null);
  const [loadingExternal, setLoadingExternal] = useState<boolean>(false);
  const [activeGuide, setActiveGuide] = useState<CommunityGuide | null>(null);
  const [showAboutBuilds, setShowAboutBuilds] = useState<boolean>(false);

  const targetLeagueId = game === 'poe2' ? 'poe2-05-ancients' : 'poe1-330-umbra';

  useEffect(() => {
    document.title = 'Builds Hub (PoE 1 & PoE 2) | Exile SSF';
  }, []);

  const loadExternalGuides = async (targetGame: 'poe1' | 'poe2', forceRefresh: boolean = false) => {
    setLoadingExternal(true);
    const res = await fetchExternalBuildGuides(targetGame, forceRefresh);
    if (res) setExternalData(res);
    setLoadingExternal(false);
  };

  useEffect(() => {
    setPatchFilter('All');
    setClassFilter('All');
    setSourceFilter('All');
    let cancelled = false;

    fetchCloudLeagueData(targetLeagueId).then((res) => {
      if (cancelled) return;
      if (res && Array.isArray(res.guides) && res.guides.length > 0) {
        setCloudGuides(res.guides);
      } else {
        setCloudGuides(game === 'poe1' ? INITIAL_COMMUNITY_GUIDES : []);
      }
    });

    loadExternalGuides(game, false);

    return () => {
      cancelled = true;
    };
  }, [game, targetLeagueId]);

  const patchOptions = game === 'poe2' ? POE2_PATCHES : POE1_PATCHES;

  // Condense Community Guides + Curated SSF Starters + Live External Guides (deduplicated & vetted for minimum detail)
  const unifiedGuides = useMemo<CommunityGuide[]>(() => {
    const merged: CommunityGuide[] = [];
    const seenKeys = new Set<string>();

    const pushUnique = (g: CommunityGuide) => {
      if (!hasMinimumGuideDetail(g)) return;
      const key = `${g.id}::${g.title.trim().toLowerCase()}`;
      if (seenKeys.has(key)) return;
      seenKeys.add(key);
      merged.push(g);
    };

    cloudGuides.forEach(pushUnique);
    if (game === 'poe1') {
      CURATED_SSF_STARTER_GUIDES.forEach(pushUnique);
    }
    if (externalData?.guides) {
      externalData.guides.forEach(pushUnique);
    }

    return merged;
  }, [cloudGuides, externalData, game]);

  const uniqueClasses = useMemo(() => {
    const set = new Set<string>();
    unifiedGuides.forEach((g) => {
      if (g.ascendancy) set.add(g.ascendancy);
    });
    return ['All', ...Array.from(set).sort()];
  }, [unifiedGuides]);

  const filteredGuides = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return unifiedGuides.filter((g) => {
      if (ssfStarterOnly && !isStarterGuide(g)) return false;
      if (sourceFilter === 'Exile SSF' && g.isExternalLinkOnly) return false;
      if (sourceFilter === 'Mobalytics' && g.creatorPlatform !== 'Mobalytics') return false;
      if (sourceFilter === 'Maxroll' && g.creatorPlatform !== 'Maxroll') return false;
      if (classFilter !== 'All' && g.ascendancy !== classFilter) return false;
      if (patchFilter !== 'All') {
        const hay = `${g.title} ${g.playstyle || ''} ${g.levelingNotes || ''} ${g.createdAt || ''} ${(g.tags || []).join(' ')}`.toLowerCase();
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
        (g.playstyle || '').toLowerCase().includes(q) ||
        (g.creatorPlatform || '').toLowerCase().includes(q)
      );
    });
  }, [unifiedGuides, ssfStarterOnly, sourceFilter, searchQuery, classFilter, patchFilter, game]);

  const mobalyticsDirectoryUrl = game === 'poe2' ? 'https://mobalytics.gg/poe-2/builds' : 'https://mobalytics.gg/poe/builds';
  const maxrollDirectoryUrl = game === 'poe2' ? 'https://maxroll.gg/poe2/build-guides' : 'https://maxroll.gg/poe/category/build-guides';

  if (activeGuide) {
    return (
      <Suspense fallback={<div className="p-8 text-center text-xs font-mono text-slate-400">Loading build guide...</div>}>
        <FullGuideReaderView
          guide={activeGuide}
          onBack={() => setActiveGuide(null)}
          onUpdateGuide={(updated) => {
            setActiveGuide(updated);
            setCloudGuides((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
            if (!updated.id.startsWith('starter-') && !updated.id.startsWith('ext-')) {
              saveCloudGuide(targetLeagueId, updated);
            }
          }}
        />
      </Suspense>
    );
  }

  return (
    <div className="w-full space-y-5 pb-16 font-sans text-slate-200">
      {/* Unified Builds Hub Header */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/35 to-slate-900 p-5 space-y-3 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black font-cinzel text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                <span>Exile SSF Builds Hub</span>
              </h1>
              <button
                type="button"
                onClick={() => setShowAboutBuilds((v) => !v)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                  showAboutBuilds
                    ? 'bg-indigo-600/25 border-indigo-400/60 text-white'
                    : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:text-white hover:border-slate-600'
                }`}
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>{showAboutBuilds ? 'Hide Guide' : 'What Is This?'}</span>
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Unified community guides, SSF League Starters, live Mobalytics and Maxroll directories, guide ingestion, and PoB Build Doctor across Path of Exile 1 and Path of Exile 2.
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

        {showAboutBuilds && (
          <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <div className="font-mono text-[10px] uppercase font-bold text-amber-400">1. Unified SSF &amp; Community Builds</div>
              <p className="text-slate-300 leading-relaxed">
                Browse vetted Solo Self Found league starters alongside community authored guides and live pulled <strong className="text-white">Mobalytics</strong> &amp; <strong className="text-white">Maxroll.gg</strong> builds for both PoE 1 and PoE 2. Filter by Ascendancy, Patch, Source, or <strong className="text-white">SSF Starters Only</strong>.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <div className="font-mono text-[10px] uppercase font-bold text-sky-400">2. PoB Build Doctor &amp; Roster Sync</div>
              <p className="text-slate-300 leading-relaxed">
                Paste any <code className="text-sky-300">pobb.in</code>, <code className="text-sky-300">pastebin.com</code>, or raw Path of Building code to inspect your defensive vitals, detect resist or suppression gaps, and sync your build directly to your <strong className="text-white">Private League Roster</strong> (Main or Alt).
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <div className="font-mono text-[10px] uppercase font-bold text-emerald-400">3. Write or Ingest Guides</div>
              <p className="text-slate-300 leading-relaxed">
                Publish your own full Markdown build guide or link a creator guide with required uniques and Atlas lanes. Readers can open any guide in the full width secondary monitor reader and import required uniques straight to their squad <strong className="text-white">Wishlist</strong>.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Primary Sub Navigation Ribbon (Condensed to 3 Distinct Workflows) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/75 border border-slate-800 p-2 rounded-2xl">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'community' as const, label: `All Builds & Guides (${unifiedGuides.length})`, icon: BookOpen },
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
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSsfStarterOnly((v) => !v)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-colors cursor-pointer ${
                ssfStarterOnly
                  ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-200'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-emerald-400" />
              <span>SSF Starters Only</span>
            </button>

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
          </div>
        )}
      </div>

      {/* Sub Tab Content */}
      <Suspense fallback={<div className="p-10 text-center text-xs font-mono text-slate-400">Loading build module...</div>}>
        {subTab === 'community' && (
          <div className="space-y-4">
            {/* External Build Sources Bar (Mobalytics & Maxroll) */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-[10px] font-mono uppercase text-slate-400 mr-1 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Source:</span>
                </span>
                {(['All', 'Exile SSF', 'Mobalytics', 'Maxroll'] as const).map((src) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setSourceFilter(src)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      sourceFilter === src
                        ? 'bg-indigo-600/30 border-indigo-400/60 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {src}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <a
                  href={mobalyticsDirectoryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-sky-300 font-semibold inline-flex items-center gap-1"
                >
                  <span>Mobalytics</span>
                  {externalData?.sources?.mobalytics?.count ? (
                    <span className="font-mono text-[10px] text-emerald-300">({externalData.sources.mobalytics.count})</span>
                  ) : null}
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href={maxrollDirectoryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-amber-300 font-semibold inline-flex items-center gap-1"
                >
                  <span>Maxroll.gg</span>
                  {externalData?.sources?.maxroll?.count ? (
                    <span className="font-mono text-[10px] text-emerald-300">({externalData.sources.maxroll.count})</span>
                  ) : null}
                  <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  type="button"
                  disabled={loadingExternal}
                  onClick={() => loadExternalGuides(game, true)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-mono text-[11px] inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  title="Sync latest build guide links from Mobalytics and Maxroll.gg"
                >
                  <RefreshCw className={`w-3 h-3 text-emerald-400 ${loadingExternal ? 'animate-spin' : ''}`} />
                  <span>Sync External</span>
                </button>
              </div>
            </div>

            {/* Search & Ascendancy Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search builds by skill, ascendancy, playstyle, source, or author..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {uniqueClasses.slice(0, 9).map((cls) => (
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
                  No guides matched your active filters for {game === 'poe2' ? 'Path of Exile 2' : 'Path of Exile 1'} ({patchFilter}).
                </p>
                <div className="flex flex-wrap justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSourceFilter('All');
                      setSsfStarterOnly(false);
                      setClassFilter('All');
                      setPatchFilter('All');
                      setSearchQuery('');
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
                  >
                    Reset Filters
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubTab('ingest')}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer"
                  >
                    Ingest or Write a Guide
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredGuides.map((g) => {
                  const starter = isStarterGuide(g);
                  const isExternal = Boolean(g.isExternalLinkOnly);
                  const hasPob = Boolean(g.pobCodeOrUrl && g.pobCodeOrUrl.startsWith('http') && g.pobCodeOrUrl !== 'https://pobb.in/');
                  return (
                    <div
                      key={g.id}
                      onClick={() => {
                        if (isExternal && (g.videoOrForumUrl || g.pobCodeOrUrl)) {
                          window.open(g.videoOrForumUrl || g.pobCodeOrUrl, '_blank', 'noopener,noreferrer');
                        } else {
                          setActiveGuide(g);
                        }
                      }}
                      className="p-5 rounded-2xl border border-slate-800 bg-slate-900/75 hover:border-indigo-500/50 hover:bg-slate-900 transition-all cursor-pointer flex flex-col justify-between gap-4 shadow"
                    >
                      <div className="space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                              {g.ascendancy}
                            </span>
                            {starter && (
                              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 inline-flex items-center gap-1">
                                <Flame className="w-2.5 h-2.5" />
                                <span>SSF Starter</span>
                              </span>
                            )}
                            {g.creatorPlatform && (g.creatorPlatform === 'Mobalytics' || g.creatorPlatform === 'Maxroll') && (
                              <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                                g.creatorPlatform === 'Mobalytics'
                                  ? 'bg-sky-500/15 text-sky-300 border-sky-500/40'
                                  : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                              }`}>
                                {g.creatorPlatform}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-amber-300 font-bold">
                            {game === 'poe2' ? 'PoE 2 • 0.5' : 'PoE 1 • 3.30'}
                          </span>
                        </div>

                        <h3 className="text-base font-black text-white leading-snug">{g.title}</h3>
                        <p className="text-xs text-slate-400 line-clamp-2">{g.levelingNotes || g.playstyle}</p>

                        {/* Detail Verification Badges */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[10px] font-mono text-slate-400">
                          {!isExternal && (
                            <>
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                                <span>Leveling</span>
                              </span>
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                                <ShieldCheck className="w-2.5 h-2.5 text-indigo-400" />
                                <span>Endgame & Crafting</span>
                              </span>
                            </>
                          )}
                          {g.uniqueDependency && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-amber-300/90">
                              {g.uniqueDependency}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-mono truncate">
                          {isExternal ? `Via ${g.creatorPlatform || g.authorName}` : `By @${g.authorName || 'Exile'}`}
                        </span>
                        <div className="flex items-center gap-3 shrink-0">
                          {!isExternal && (
                            <span className="inline-flex items-center gap-1 text-slate-300 font-mono">
                              <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" />
                              <span>{g.upvotes || 0}</span>
                            </span>
                          )}
                          {g.starterRating > 0 && (
                            <span className="text-[11px] font-mono text-amber-300 font-bold">
                              {g.starterRating}/10
                            </span>
                          )}
                          {(hasPob || isExternal) && (
                            <a
                              href={isExternal ? (g.videoOrForumUrl || g.pobCodeOrUrl) : g.pobCodeOrUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-indigo-300 hover:text-white inline-flex items-center gap-1 font-mono"
                            >
                              <span>{isExternal ? 'Open Guide' : 'PoB'}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {subTab === 'ingest' && (
          <BuildIngestionView
            userAccount={userAccount}
            onNavigateToGuides={() => setSubTab('community')}
          />
        )}
        {subTab === 'doctor' && <BuildAnalyzerView userAccount={userAccount} selectedGame={game} />}
      </Suspense>
    </div>
  );
};
