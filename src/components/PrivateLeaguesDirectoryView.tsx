import React, { useState, useEffect, useRef, useId } from 'react';
import {
  Plus,
  Globe,
  Clock,
  Archive,
  ArrowRight,
  Lock,
  MessageSquare,
  Share2,
  Check
} from 'lucide-react';
import type { ActiveLeagueSession, UserAccount } from '../types';
import { ACTIVE_LEAGUE_SESSIONS } from '../data/privateLeagueData';
import { fireConfetti } from '../utils/confetti';
import { fetchCloudLeagues, saveCloudLeague } from '../services/cloudSync';

interface PrivateLeaguesDirectoryViewProps {
  userAccount: UserAccount | null;
  onSelectLeague: (sessionId: string) => void;
  onOpenAuthModal?: () => void;
  selectedGame?: 'poe1' | 'poe2';
  onSelectGame?: (game: 'poe1' | 'poe2') => void;
}

export const PrivateLeaguesDirectoryView: React.FC<PrivateLeaguesDirectoryViewProps> = ({
  userAccount,
  onSelectLeague,
  onOpenAuthModal,
  selectedGame = 'poe1',
  onSelectGame
}) => {
  const [activeGame, setActiveGame] = useState<'poe1' | 'poe2'>(selectedGame);
  const [filter, setFilter] = useState<'active' | 'upcoming' | 'archive'>('active');
  const [copiedLeagueId, setCopiedLeagueId] = useState<string | null>(null);
  const [leagues, setLeagues] = useState<ActiveLeagueSession[]>(ACTIVE_LEAGUE_SESSIONS);

  useEffect(() => {
    let cancelled = false;
    fetchCloudLeagues().then((cloudList) => {
      if (!cancelled && cloudList && cloudList.length > 0) {
        const merged = [...ACTIVE_LEAGUE_SESSIONS];
        for (const cl of cloudList) {
          if (!merged.some((m) => m.id === cl.id)) merged.push(cl);
        }
        setLeagues(merged);
      }
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (selectedGame) {
      setActiveGame(selectedGame);
    }
  }, [selectedGame]);

  const handleGameSwitch = (nextGame: 'poe1' | 'poe2') => {
    setActiveGame(nextGame);
    if (onSelectGame) {
      onSelectGame(nextGame);
    }
  };

  const createDialogRef = useRef<HTMLDialogElement>(null);
  const modalTitleId = useId();

  // Form State for creating a custom league
  const [leagueName, setLeagueName] = useState<string>('');
  const [game, setGame] = useState<'poe1' | 'poe2'>('poe1');
  const [expansion, setExpansion] = useState<string>('Coven of Umbra');
  const [version, setVersion] = useState<string>('3.30');
  const [hostName, setHostName] = useState<string>(userAccount?.displayName || '');
  const [hostAccountTag, setHostAccountTag] = useState<string>(userAccount?.poeAccountName || '');
  const [currentSlots, setCurrentSlots] = useState<number>(30);
  const [fundedDays, setFundedDays] = useState<number>(30);
  const [targetDays, setTargetDays] = useState<number>(40);
  const [globalChannel, setGlobalChannel] = useState<string>('/global 5712');
  const [officialLeagueUrl, setOfficialLeagueUrl] = useState<string>('');
  const [discordUrl, setDiscordUrl] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // Sync state when user logs in or out
  useEffect(() => {
    if (userAccount) {
      if (!hostName) setHostName(userAccount.displayName);
      if (!hostAccountTag && userAccount.poeAccountName) setHostAccountTag(userAccount.poeAccountName);
    }
  }, [userAccount]);

  const handleOpenCreateModal = () => {
    setFormError(null);
    setGame(activeGame);
    if (activeGame === 'poe1') {
      setExpansion('Coven of Umbra');
      setVersion('3.30');
    } else {
      setExpansion('Return of the Ancients');
      setVersion('0.5');
    }
    createDialogRef.current?.showModal();
  };

  const handleCreateLeague = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanName = leagueName.trim();
    if (!cleanName) {
      setFormError('Please enter a league name.');
      return;
    }

    const cleanHost = hostName.trim() || userAccount?.displayName || 'Community Host';
    const newLeagueId = `custom-gsf-${Date.now()}`;

    const newSession: ActiveLeagueSession = {
      id: newLeagueId,
      game,
      name: cleanName,
      expansion: expansion.trim() || (game === 'poe1' ? 'Coven of Umbra' : 'Return of the Ancients'),
      version: version.trim() || (game === 'poe1' ? '3.30' : '0.5'),
      isActive: true,
      launchDateIso: new Date().toISOString(),
      fundedDays: Number(fundedDays) || 30,
      targetDays: Number(targetDays) || 40,
      currentSlots: Number(currentSlots) || 30,
      globalChannel: globalChannel.trim() || '/global 5712',
      hostName: cleanHost,
      hostAccountTag: hostAccountTag.trim() || undefined,
      officialLeagueUrl: officialLeagueUrl.trim() || undefined,
      discordUrl: discordUrl.trim() || undefined,
      description: description.trim() || 'Community organized Group Self Found private league.',
      isReadOnlyArchive: false
    };

    setLeagues((prev) => [...prev, newSession]);
    saveCloudLeague(newSession);

    fireConfetti();
    createDialogRef.current?.close();

    // Reset Form
    setLeagueName('');
    setDescription('');
    setOfficialLeagueUrl('');
    setDiscordUrl('');

    // Jump directly to the newly created league hub
    onSelectLeague(newLeagueId);
  };

  const gameLeagues = leagues.filter((l) => (l.game || 'poe1') === activeGame);

  const activeCount = gameLeagues.filter((l) => l.isActive && !l.isReadOnlyArchive).length;
  const upcomingCount = gameLeagues.filter((l) => !l.isActive && !l.isReadOnlyArchive).length;
  const archiveCount = gameLeagues.filter((l) => l.isReadOnlyArchive).length;

  const filteredLeagues = gameLeagues.filter((l) => {
    if (filter === 'active') return l.isActive && !l.isReadOnlyArchive;
    if (filter === 'upcoming') return !l.isActive && !l.isReadOnlyArchive;
    if (filter === 'archive') return l.isReadOnlyArchive;
    return l.isActive && !l.isReadOnlyArchive;
  });

  return (
    <div className="space-y-4 animate-fadeIn pb-12 font-sans">
      {/* Compact Hero Header Bar (Keeps League Cards Above the Fold) */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/35 to-slate-950 px-5 py-4 shadow-lg">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black font-cinzel text-white tracking-tight">
                Private League Hub
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[10px] font-mono font-bold">
                <Globe className="w-3 h-3" />
                <span>PoE 1 &amp; PoE 2 GSF Directory</span>
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Coordinate cooperative Group Self Found leagues across Path of Exile 1 and Path of Exile 2. Browse active communities, inspect historical archives, or launch your own league.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div className="flex items-center gap-1.5 text-[11px] font-mono">
              <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-300">
                <strong className="text-white">{gameLeagues.length}</strong> Total
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300">
                <strong>{activeCount}</strong> Active
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-indigo-300">
                <strong>{archiveCount}</strong> Archives
              </span>
            </div>

            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/25 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Private League</span>
            </button>

            {!userAccount && onOpenAuthModal && (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter Tabs and Game Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        {/* Game Switcher: PoE 1 vs PoE 2 */}
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => handleGameSwitch('poe1')}
              className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
                activeGame === 'poe1'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Path of Exile 1</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                activeGame === 'poe1' ? 'bg-indigo-700/60 text-indigo-200' : 'bg-slate-800 text-slate-500'
              }`}>
                {leagues.filter((l) => (l.game || 'poe1') === 'poe1' && l.isActive && !l.isReadOnlyArchive).length} Active
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleGameSwitch('poe2')}
              className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
                activeGame === 'poe2'
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Path of Exile 2</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                activeGame === 'poe2' ? 'bg-cyan-700/60 text-cyan-200' : 'bg-slate-800 text-slate-500'
              }`}>
                {leagues.filter((l) => (l.game || 'poe1') === 'poe2' && l.isActive && !l.isReadOnlyArchive).length} Active
              </span>
            </button>
          </div>
        </div>

        {/* Status Filter Tabs (Active Seasons Default, Archives Hidden by Default) */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setFilter('active')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filter === 'active'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Active Seasons ({activeCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilter('upcoming')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                filter === 'upcoming'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Upcoming ({upcomingCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('archive')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                filter === 'archive'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Past Archives ({archiveCount})
            </button>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            Showing {filteredLeagues.length} {filteredLeagues.length === 1 ? 'league' : 'leagues'}
          </div>
        </div>
      </div>

      {/* Leagues Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredLeagues.map((league) => {
          const isFeaturedLeuie = league.id === 'poe1-330-umbra';
          const isReadOnly = Boolean(league.isReadOnlyArchive);

          return (
            <div
              key={league.id}
              className={`rounded-2xl border transition-all flex flex-col justify-between overflow-hidden relative ${
                isFeaturedLeuie
                  ? 'border-indigo-500/50 bg-gradient-to-b from-slate-900 to-indigo-950/30 shadow-xl shadow-indigo-950/40'
                  : isReadOnly
                  ? 'border-slate-800 bg-slate-900/40 opacity-80 hover:opacity-100'
                  : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
              }`}
            >
              {/* Card Header Banner */}
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  {/* Status Badge */}
                  {isReadOnly ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-mono">
                      <Archive className="w-3 h-3" />
                      <span>Read Only Archive</span>
                    </span>
                  ) : league.isActive ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Active League</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-mono">
                      <Clock className="w-3 h-3" />
                      <span>Upcoming Launch</span>
                    </span>
                  )}

                  {/* Game & Version Chip */}
                  <span className="px-2 py-0.5 rounded-md bg-slate-800/90 text-slate-300 border border-slate-700 text-[10px] font-mono">
                    {league.game === 'poe1' ? 'PoE 1' : 'PoE 2'} • v{league.version}
                  </span>
                </div>

                {/* Title */}
                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {league.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {league.description || 'Cooperative Group Self Found community league.'}
                  </p>
                </div>

                {/* Host Info */}
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Host:</span>
                  <div className="flex items-center gap-1.5 font-bold text-slate-200">
                    <span>@{league.hostName || 'Leuie'}</span>
                    {(league.hostName?.toLowerCase() === 'leuie' || isFeaturedLeuie) && (
                      <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px]">
                        Admin
                      </span>
                    )}
                  </div>
                </div>

                {/* League Telemetry Metrics */}
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="p-2 rounded-lg bg-slate-950/40 border border-slate-800/60">
                    <span className="text-slate-500 block text-[10px]">Funding</span>
                    <span className="text-slate-200 font-semibold">{league.fundedDays}/{league.targetDays} Days</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950/40 border border-slate-800/60">
                    <span className="text-slate-500 block text-[10px]">Slots</span>
                    <span className="text-slate-200 font-semibold">{league.currentSlots} Slots</span>
                  </div>
                </div>

                {/* In game channel indicator */}
                <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                  <MessageSquare className="w-3 h-3 text-slate-500" />
                  <span>Channel: <strong className="text-slate-300">{league.globalChannel}</strong></span>
                </div>
              </div>

              {/* Card Footer Action */}
              <div className="p-4 border-t border-slate-800/80 bg-slate-950/30 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSelectLeague(league.id)}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    isReadOnly
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      : isFeaturedLeuie
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                      : 'bg-indigo-600/80 hover:bg-indigo-600 text-white'
                  }`}
                >
                  <span>{isReadOnly ? 'Inspect Archive (Read Only)' : 'Enter League Portal'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const url = typeof window !== 'undefined' ? `${window.location.origin}/league/${league.id}` : `https://exilessf.app/league/${league.id}`;
                    navigator.clipboard.writeText(url);
                    setCopiedLeagueId(league.id);
                    setTimeout(() => setCopiedLeagueId(null), 2000);
                  }}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Copy shareable direct link for this private league"
                >
                  {copiedLeagueId === league.id ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Share2 className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredLeagues.length === 0 && (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 space-y-3">
          <div className="text-slate-400 text-sm">
            No {filter === 'active' ? 'active' : filter === 'upcoming' ? 'upcoming' : 'archived'} private leagues found for {activeGame === 'poe1' ? 'Path of Exile 1' : 'Path of Exile 2'}.
          </div>
          {filter === 'active' && upcomingCount > 0 && (
            <button
              type="button"
              onClick={() => setFilter('upcoming')}
              className="text-xs font-mono text-cyan-400 hover:underline cursor-pointer"
            >
              View {upcomingCount} upcoming launch instead →
            </button>
          )}
          {filter === 'active' && archiveCount > 0 && (
            <button
              type="button"
              onClick={() => setFilter('archive')}
              className="text-xs font-mono text-indigo-400 hover:underline cursor-pointer block mx-auto"
            >
              View {archiveCount} historical archives →
            </button>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* CREATE PRIVATE LEAGUE MODAL                                               */}
      {/* ========================================================================= */}
      <dialog
        ref={createDialogRef}
        {...({ closedby: 'any' } as any)}
        aria-labelledby={modalTitleId}
        className="w-[94vw] sm:w-full sm:max-w-xl rounded-3xl border border-slate-800 bg-slate-900 text-slate-100 p-0 shadow-2xl backdrop:bg-black/70 m-auto overflow-hidden"
      >
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 id={modalTitleId} className="text-base font-bold text-white font-cinzel">
                Host a Private League
              </h2>
              <p className="text-xs text-slate-400">
                Configure a Group Self Found hub for your friends or guild
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => createDialogRef.current?.close()}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleCreateLeague} className="p-6 space-y-4 text-xs overflow-y-auto max-h-[75vh]">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300">
              {formError}
            </div>
          )}

          {/* League Name */}
          <div>
            <label className="font-semibold text-slate-300 block mb-1">
              Private League Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Twilight Strand SSF Guild"
              value={leagueName}
              onChange={(e) => setLeagueName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Game Selection & Version */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-300 block mb-1">Game</label>
              <select
                value={game}
                onChange={(e) => {
                  const val = e.target.value as 'poe1' | 'poe2';
                  setGame(val);
                  if (val === 'poe1') {
                    setExpansion('Coven of Umbra');
                    setVersion('3.30');
                  } else {
                    setExpansion('Return of the Ancients');
                    setVersion('0.5');
                  }
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="poe1">Path of Exile 1</option>
                <option value="poe2">Path of Exile 2</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">Patch Version</label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Host Display Name & PoE Account */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-300 block mb-1">
                Host Name / Display Handle *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. YourHandle"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">
                Host PoE Account Tag
              </label>
              <input
                type="text"
                placeholder="e.g. Account#1234"
                value={hostAccountTag}
                onChange={(e) => setHostAccountTag(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Slots & Days */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="font-semibold text-slate-300 block mb-1">Total Slots</label>
              <input
                type="number"
                min={5}
                max={200}
                value={currentSlots}
                onChange={(e) => setCurrentSlots(Number(e.target.value) || 20)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-300 block mb-1">Funded Days</label>
              <input
                type="number"
                min={10}
                max={120}
                value={fundedDays}
                onChange={(e) => setFundedDays(Number(e.target.value) || 30)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-300 block mb-1">Target Days</label>
              <input
                type="number"
                min={10}
                max={120}
                value={targetDays}
                onChange={(e) => setTargetDays(Number(e.target.value) || 40)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* In Game Global Channel */}
          <div>
            <label className="font-semibold text-slate-300 block mb-1">
              In Game Global Channel
            </label>
            <input
              type="text"
              placeholder="/global 5712"
              value={globalChannel}
              onChange={(e) => setGlobalChannel(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="font-semibold text-slate-300 block mb-1">
              Description / Guild Focus
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Casual friendly private league. Focus on bossing, sharing atlas progression, and guild stash support."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Official League URL */}
          <div>
            <label className="font-semibold text-slate-300 block mb-1">
              Official Path of Exile League Invite URL (Optional)
            </label>
            <input
              type="url"
              placeholder="https://www.pathofexile.com/private-leagues/league/..."
              value={officialLeagueUrl}
              onChange={(e) => setOfficialLeagueUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Launch League Portal</span>
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
};
