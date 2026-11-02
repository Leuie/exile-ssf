import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ExternalLink,
  BookOpen,
  UserCheck,
  CheckCircle2,
  Plus,
  Share2,
  Trash2,
  Play
} from 'lucide-react';
import { ASCENDANCY_CATALOG, POE2_ASCENDANCY_CATALOG, INITIAL_COMMUNITY_GUIDES } from '../data/privateLeagueData';
import type { CommunityGuide, UserAccount } from '../types';
import { fireConfetti } from '../utils/confetti';

interface BuildIngestionViewProps {
  userAccount?: UserAccount | null;
  onNavigateToGuides?: () => void;
}

export const BuildIngestionView: React.FC<BuildIngestionViewProps> = ({
  userAccount,
  onNavigateToGuides
}) => {
  // Guides list stored in localStorage
  const [guides, setGuides] = useState<CommunityGuide[]>(() => {
    try {
      const saved = localStorage.getItem('poe_umbraleague_guides');
      return saved ? JSON.parse(saved) : INITIAL_COMMUNITY_GUIDES;
    } catch {
      return INITIAL_COMMUNITY_GUIDES;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('poe_umbraleague_guides', JSON.stringify(guides));
    } catch {}
  }, [guides]);

  // Ingestion Mode: Full On-Site Guide vs External Backlink Reference
  const [guideType, setGuideType] = useState<'interactive' | 'external'>('interactive');
  const [targetGame, setTargetGame] = useState<'poe1' | 'poe2'>('poe1');

  // Form Fields
  const [title, setTitle] = useState<string>('');
  const [pobUrl, setPobUrl] = useState<string>('');
  const [creatorName, setCreatorName] = useState<string>('Subtractem');
  const [creatorChannelUrl, setCreatorChannelUrl] = useState<string>('https://youtube.com/@Subtractem');
  const [creatorPlatform, setCreatorPlatform] = useState<'YouTube' | 'Maxroll' | 'Twitch' | 'Forum' | 'Community'>('YouTube');
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [externalGuideUrl, setExternalGuideUrl] = useState<string>('');
  const [className, setClassName] = useState<string>('Witch');
  const [ascendancy, setAscendancy] = useState<string>('Elementalist');
  const [playstyle, setPlaystyle] = useState<string>('Ignite Proliferation / Speed Mapper');
  const [starterRating, setStarterRating] = useState<number>(9.5);
  const [levelingNotes, setLevelingNotes] = useState<string>('');
  const [endgameNotes, setEndgameNotes] = useState<string>('');
  const [requiredUniques, setRequiredUniques] = useState<string>('');
  const [atlasFocus, setAtlasFocus] = useState<string>('Essences, Betrayal, Harvest');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto detect Ascendancies based on game
  const currentCatalog = targetGame === 'poe1' ? ASCENDANCY_CATALOG : POE2_ASCENDANCY_CATALOG;

  // Quick autofill preset creator channels
  const CREATOR_PRESETS = [
    { name: 'Subtractem', platform: 'YouTube', channel: 'https://youtube.com/@Subtractem' },
    { name: 'Zizaran', platform: 'YouTube', channel: 'https://youtube.com/@Zizaran' },
    { name: 'GhazzyTV', platform: 'YouTube', channel: 'https://youtube.com/@GhazzyTV' },
    { name: 'Palsteron', platform: 'YouTube', channel: 'https://youtube.com/@Palsteron' },
    { name: 'Pohx', platform: 'YouTube', channel: 'https://youtube.com/@PohxKappa' },
    { name: 'Ruetoo', platform: 'Twitch', channel: 'https://twitch.tv/ruetoo' },
    { name: 'Maxroll Team', platform: 'Maxroll', channel: 'https://maxroll.gg/poe' }
  ];

  const handleSelectPreset = (p: typeof CREATOR_PRESETS[0]) => {
    setCreatorName(p.name);
    setCreatorChannelUrl(p.channel);
    setCreatorPlatform(p.platform as any);
  };

  const handleIngestGuide = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newGuide: CommunityGuide = {
      id: `guide-${Date.now()}`,
      title: title.trim(),
      authorName: userAccount?.displayName || 'Community Curator',
      authorDiscord: userAccount?.discordName || '@exile',
      className,
      ascendancy,
      playstyle: playstyle.trim() || 'All Rounder',
      starterRating,
      pobCodeOrUrl: pobUrl.trim() || (guideType === 'external' ? externalGuideUrl : 'https://pobb.in/'),
      videoOrForumUrl: videoUrl.trim() || (guideType === 'external' ? externalGuideUrl : undefined),
      levelingNotes: levelingNotes.trim() || 'Level smoothly with early vendor recipes and standard progression skills.',
      endgameNotes: endgameNotes.trim() || 'Scale gem levels, cluster jewels, and defensive layers into red maps.',
      requiredUniques: requiredUniques.split(',').map((u) => u.trim()).filter(Boolean),
      atlasFocus: atlasFocus.split(',').map((a) => a.trim()).filter(Boolean),
      upvotes: 1,
      createdAt: 'Just now',
      game: targetGame,
      isExternalLinkOnly: guideType === 'external',
      creatorName: creatorName.trim() || undefined,
      creatorChannelUrl: creatorChannelUrl.trim() || undefined,
      creatorPlatform
    };

    setGuides([newGuide, ...guides]);
    fireConfetti();
    setToastMessage(`Guide "${newGuide.title}" successfully ingested with creator backlinks!`);
    setTimeout(() => setToastMessage(null), 3500);

    // Reset some fields
    setTitle('');
    setPobUrl('');
    setVideoUrl('');
    setExternalGuideUrl('');
  };

  const handleDeleteGuide = (id: string) => {
    setGuides((prev) => prev.filter((g) => g.id !== id));
  };

  return (
    <div className="w-full space-y-6 pb-20 font-sans text-slate-200">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2 rounded-xl bg-slate-800 text-slate-100 text-xs font-semibold shadow-2xl flex items-center gap-2 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sleek Subdued Command Banner */}
      <div className="p-5 sm:p-6 rounded-2xl border border-slate-800 bg-slate-900/85 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
              Content Curation & Ingestion Engine
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-poppins font-bold text-white">
            Build Guide Ingestion Tool
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Import community build guides from PoB (pobb.in), YouTube video breakdowns, and Maxroll or forum guides. Automatically credits original creators with verified backlinks, channel links, and platform badges.
          </p>
        </div>

        {onNavigateToGuides && (
          <button
            type="button"
            onClick={onNavigateToGuides}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-white flex items-center gap-2 transition-colors cursor-pointer self-start md:self-auto flex-shrink-0"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span>Browse Library ({guides.length})</span>
          </button>
        )}
      </div>

      {/* Main 2-Column Work Area: Ingest Form (Left) & Live Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: Input Form */}
        <div className="lg:col-span-7">
          <form
            onSubmit={handleIngestGuide}
            className="p-5 rounded-2xl border border-slate-800 bg-slate-900/75 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <span className="font-poppins font-bold text-sm text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Ingest Parameters</span>
              </span>

              {/* Game Selector */}
              <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setTargetGame('poe1');
                    setClassName('Witch');
                    setAscendancy('Elementalist');
                  }}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    targetGame === 'poe1' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400'
                  }`}
                >
                  PoE 1 (3.30)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTargetGame('poe2');
                    setClassName('Monk');
                    setAscendancy('Invoker');
                  }}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    targetGame === 'poe2' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400'
                  }`}
                >
                  PoE 2 (0.5)
                </button>
              </div>
            </div>

            {/* Ingestion Type Toggle */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setGuideType('interactive')}
                className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                  guideType === 'interactive'
                    ? 'border-indigo-500 bg-slate-800 text-white font-semibold'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-semibold text-xs text-slate-200">Interactive Guide</div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">Full leveling notes & PoB on site</div>
              </button>

              <button
                type="button"
                onClick={() => setGuideType('external')}
                className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                  guideType === 'external'
                    ? 'border-indigo-500 bg-slate-800 text-white font-semibold'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-semibold text-xs text-slate-200">External Guide Reference</div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">Quick link with creator backlink</div>
              </button>
            </div>

            {/* Creator Attribution Section */}
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/70 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-slate-400 uppercase text-[10px] font-bold flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                  Creator Attribution & Backlink
                </span>
                <span className="text-[10px] text-slate-500">Auto backlinked in card</span>
              </div>

              {/* Creator Presets */}
              <div className="flex flex-wrap gap-1">
                {CREATOR_PRESETS.map((p) => (
                  <button
                    type="button"
                    key={p.name}
                    onClick={() => handleSelectPreset(p)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors cursor-pointer ${
                      creatorName === p.name
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-mono mb-1">
                    Creator Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={creatorName}
                    onChange={(e) => setCreatorName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-mono mb-1">
                    Platform *
                  </label>
                  <select
                    value={creatorPlatform}
                    onChange={(e) => setCreatorPlatform(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-slate-700"
                  >
                    <option value="YouTube">YouTube</option>
                    <option value="Maxroll">Maxroll</option>
                    <option value="Twitch">Twitch</option>
                    <option value="Forum">PoE Forum</option>
                    <option value="Community">Community</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-mono mb-1">
                    Channel / Profile URL
                  </label>
                  <input
                    type="url"
                    value={creatorChannelUrl}
                    onChange={(e) => setCreatorChannelUrl(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-slate-700"
                  />
                </div>
              </div>
            </div>

            {/* Guide Basic Info */}
            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Build Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Frostblink Ignite Elementalist League Starter"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-mono mb-1">
                    Class & Ascendancy
                  </label>
                  <select
                    value={ascendancy}
                    onChange={(e) => {
                      const asc = currentCatalog.find((a) => a.name === e.target.value);
                      if (asc) {
                        setAscendancy(asc.name);
                        setClassName(asc.baseClass);
                      }
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-slate-700"
                  >
                    {currentCatalog.map((a) => (
                      <option key={a.name} value={a.name}>
                        {a.name} ({a.baseClass})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-mono mb-1">
                    Playstyle / Archtype
                  </label>
                  <input
                    type="text"
                    value={playstyle}
                    onChange={(e) => setPlaystyle(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-mono mb-1">
                    PoB URL / pobb.in Link
                  </label>
                  <input
                    type="url"
                    placeholder="https://pobb.in/..."
                    value={pobUrl}
                    onChange={(e) => setPobUrl(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-slate-700 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-mono mb-1">
                    YouTube Guide / Video URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://youtube.com/watch?v=..."
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-slate-700 font-mono"
                  />
                </div>
              </div>

              {guideType === 'external' && (
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-mono mb-1">
                    Direct External Guide Link (Maxroll / Forum) *
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://maxroll.gg/poe/build-guides/..."
                    value={externalGuideUrl}
                    onChange={(e) => setExternalGuideUrl(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-slate-700 font-mono"
                  />
                </div>
              )}

              {guideType === 'interactive' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-400 text-[10px] uppercase font-mono mb-1">
                        Starter Rating (1 to 10)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        step="0.5"
                        value={starterRating}
                        onChange={(e) => setStarterRating(parseFloat(e.target.value) || 9)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[10px] uppercase font-mono mb-1">
                        Atlas Strategy Focus
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Essences, Betrayal, Harvest"
                        value={atlasFocus}
                        onChange={(e) => setAtlasFocus(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-slate-700"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase font-mono mb-1">
                      Endgame Scaling & Crafting Notes
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Describe cluster jewels, gem gem links, and pinnacle boss transitions..."
                      value={endgameNotes}
                      onChange={(e) => setEndgameNotes(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase font-mono mb-1">
                      Key Required Uniques (Comma Separated)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Cloak of Flame, Bisco Leash, Aegis Aurora"
                      value={requiredUniques}
                      onChange={(e) => setRequiredUniques(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase font-mono mb-1">
                      Leveling & Progression Notes
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Describe early skill transitions, act vendor crafts, and lab order..."
                      value={levelingNotes}
                      onChange={(e) => setLevelingNotes(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-slate-700"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-500">
                Attribution: Backlinks to {creatorName} ({creatorPlatform})
              </span>

              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Ingest & Save Guide</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Live Interactive Preview Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Share2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Live Guide Card Preview</span>
          </div>

          <div className="p-4 rounded-2xl border border-slate-700 bg-slate-900/90 shadow-xl space-y-3">
            {/* Header: Platform & Creator Backlink */}
            <div className="flex items-center justify-between">
              <a
                href={creatorChannelUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800 text-slate-200 hover:text-white border border-slate-700 text-[11px] font-mono transition-colors"
                title={`Visit ${creatorName}'s official channel`}
              >
                <UserCheck className="w-3 h-3 text-emerald-400" />
                <span>By {creatorName || 'Creator'}</span>
                <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
              </a>

              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                {targetGame === 'poe1' ? 'PoE 1' : 'PoE 2'} • {creatorPlatform}
              </span>
            </div>

            {/* Title & Archtype */}
            <div>
              <h2 className="font-poppins font-bold text-sm text-white">
                {title || 'Example Starter Guide Title'}
              </h2>
              <div className="text-xs text-slate-400 mt-0.5">
                {ascendancy} ({className}) • {playstyle}
              </div>
            </div>

            {/* Video Link / Preview if present */}
            {videoUrl && (
              <a
                href={videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 flex items-center justify-between text-xs text-slate-300 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <Play className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                  <span className="truncate">Watch Video Guide</span>
                </div>
                <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-slate-300" />
              </a>
            )}

            {/* PoB & External Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
              {pobUrl && (
                <a
                  href={pobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5"
                >
                  <span>pobb.in</span>
                  <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                </a>
              )}

              {creatorChannelUrl && (
                <a
                  href={creatorChannelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5 ml-auto"
                >
                  <span>Creator Page</span>
                  <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                </a>
              )}
            </div>
          </div>

          {/* Ingested Guides Library Table */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400 font-bold uppercase">
                Ingested Community Guides ({guides.length})
              </span>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {guides.map((g) => (
                <div
                  key={g.id}
                  className="p-2.5 rounded-lg border border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs space-x-2"
                >
                  <div className="truncate flex-1">
                    <div className="font-semibold text-slate-200 truncate">{g.title}</div>
                    <div className="text-[10px] font-mono text-slate-500">
                      {g.ascendancy} • By {g.creatorName || g.authorName} ({g.creatorPlatform || 'Community'})
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {g.pobCodeOrUrl && (
                      <a
                        href={g.pobCodeOrUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                        title="Open PoB link"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteGuide(g.id)}
                      className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 cursor-pointer"
                      title="Remove guide"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
