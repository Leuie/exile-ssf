import React, { useState, useEffect, useId, useRef } from 'react';
import { 
  Flame, 
  Sparkles, 
  ExternalLink, 
  Users, 
  ShieldCheck, 
  Edit3, 
  RotateCcw, 
  Image as ImageIcon,
  CheckCircle2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type { UserAccount } from '../types';

interface LeagueHeroBannerProps {
  activeSessionId: string;
  isPoE2Session: boolean;
  activeLeagueInfo: any;
  userAccount?: UserAccount | null;
  onOpenAuthModal?: () => void;
  triggerCopy: (text: string, label: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const LeagueHeroBanner: React.FC<LeagueHeroBannerProps> = ({
  activeSessionId,
  isPoE2Session,
  activeLeagueInfo,
  userAccount,
  onOpenAuthModal,
  triggerCopy,
  isCollapsed = false,
  onToggleCollapse
}) => {
  void activeLeagueInfo;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const modalTitleId = useId();

  const defaultArtwork = isPoE2Session 
    ? 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80'
    : '/images/covens_of_umbra_hero.png';

  const defaultAvatar = '/logo.png';

  const [heroConfig, setHeroConfig] = useState<{
    artworkUrl: string;
    avatarUrl: string;
    tagline: string;
    leagueTitle: string;
  }>(() => {
    try {
      const saved = localStorage.getItem(`poe_hero_banner_${activeSessionId}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      artworkUrl: defaultArtwork,
      avatarUrl: defaultAvatar,
      tagline: isPoE2Session ? 'Return to the ancient gods.' : 'She comes for your realm.',
      leagueTitle: isPoE2Session ? 'NOIR Return of the Ancients GSF' : 'NOIR Coven of Umbra GSF'
    };
  });

  // Re sync on session switch
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`poe_hero_banner_${activeSessionId}`);
      if (saved) {
        setHeroConfig(JSON.parse(saved));
      } else {
        setHeroConfig({
          artworkUrl: defaultArtwork,
          avatarUrl: defaultAvatar,
          tagline: isPoE2Session ? 'Return to the ancient gods.' : 'She comes for your realm.',
          leagueTitle: isPoE2Session ? 'NOIR Return of the Ancients GSF' : 'NOIR Coven of Umbra GSF'
        });
      }
    } catch {}
  }, [activeSessionId, isPoE2Session, defaultArtwork, defaultAvatar]);

  // Modal editing form state
  const [formArtwork, setFormArtwork] = useState<string>(heroConfig.artworkUrl);
  const [formAvatar, setFormAvatar] = useState<string>(heroConfig.avatarUrl);
  const [formTagline, setFormTagline] = useState<string>(heroConfig.tagline);
  const [formTitle, setFormTitle] = useState<string>(heroConfig.leagueTitle);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const handleOpenEdit = () => {
    setFormArtwork(heroConfig.artworkUrl);
    setFormAvatar(heroConfig.avatarUrl);
    setFormTagline(heroConfig.tagline);
    setFormTitle(heroConfig.leagueTitle);
    setIsModalOpen(true);
    setTimeout(() => {
      dialogRef.current?.showModal();
    }, 10);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      artworkUrl: formArtwork.trim() || defaultArtwork,
      avatarUrl: formAvatar.trim() || defaultAvatar,
      tagline: formTagline.trim() || 'She comes for your realm.',
      leagueTitle: formTitle.trim() || 'NOIR Coven of Umbra GSF'
    };
    setHeroConfig(updated);
    try {
      localStorage.setItem(`poe_hero_banner_${activeSessionId}`, JSON.stringify(updated));
    } catch {}
    dialogRef.current?.close();
    setIsModalOpen(false);
    triggerCopy('Hero banner artwork updated!', 'Notification');
  };

  const handleResetDefaults = () => {
    const updated = {
      artworkUrl: defaultArtwork,
      avatarUrl: defaultAvatar,
      tagline: isPoE2Session ? 'Return to the ancient gods.' : 'She comes for your realm.',
      leagueTitle: isPoE2Session ? 'NOIR Return of the Ancients GSF' : 'NOIR Coven of Umbra GSF'
    };
    setHeroConfig(updated);
    try {
      localStorage.removeItem(`poe_hero_banner_${activeSessionId}`);
    } catch {}
    dialogRef.current?.close();
    setIsModalOpen(false);
    triggerCopy('Banner restored to default artwork!', 'Notification');
  };

  return (
    <>
      <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl relative transition-all">
        {/* Banner Top Control Bar */}
        <div className="px-4 py-2 border-b border-slate-800/80 bg-slate-900/80 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-300">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-bold uppercase tracking-wider text-white">
              {isPoE2Session ? 'PoE 2 Early Access Portal' : 'Path of Exile 3.30 Expansion Portal'}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
              New
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenEdit}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[11px] font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Change banner artwork URL or game avatar"
            >
              <Edit3 className="w-3 h-3 text-indigo-400" />
              <span>Customize Artwork & Avatar</span>
            </button>

            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                title={isCollapsed ? 'Expand Hero Banner' : 'Collapse Hero Banner'}
              >
                {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

        {/* Collapsible Main Hero Banner Body */}
        {!isCollapsed && (
          <div className="relative min-h-[220px] sm:min-h-[260px] lg:min-h-[300px] flex flex-col justify-end p-5 sm:p-7 overflow-hidden">
            {/* Background Artwork Layer */}
            <div 
              className="absolute inset-0 bg-cover bg-center transition-all duration-700 transform scale-100"
              style={{ backgroundImage: `url("${heroConfig.artworkUrl}")` }}
            />
            {/* Dark Cinematic Vignette & Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-950/40" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/70 to-transparent" />

            {/* Foreground Content */}
            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
              
              {/* Left Column: Avatar + League Identifiers */}
              <div className="flex items-start sm:items-center gap-4 sm:gap-5">
                {/* Game Avatar / Crest */}
                <div className="relative flex-shrink-0 group">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-amber-500/60 bg-slate-900/90 shadow-2xl p-1.5 overflow-hidden flex items-center justify-center">
                    <img 
                      src={heroConfig.avatarUrl} 
                      alt="Game Avatar" 
                      className="w-full h-full object-contain rounded-xl"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/logo.png';
                      }}
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 font-mono font-black text-[9px] uppercase tracking-wider shadow">
                    {isPoE2Session ? 'PoE 2' : '3.30'}
                  </div>
                </div>

                {/* Badges & Titles */}
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-[11px] font-bold uppercase tracking-wider">
                      {isPoE2Session ? 'PoE 2 Early Access' : '3.30 Coven of Umbra'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-mono text-[11px] font-semibold uppercase tracking-wider">
                      Group Self Found
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] font-bold uppercase flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" /> New
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-cinzel text-white tracking-tight drop-shadow-md">
                    {heroConfig.leagueTitle}
                  </h1>

                  <p className="text-xs sm:text-sm text-slate-300 italic font-medium max-w-xl drop-shadow">
                    "{heroConfig.tagline}"
                  </p>
                </div>
              </div>

              {/* Right Column: Quick Portal Action Links */}
              <div className="flex flex-wrap items-center gap-2.5 self-start md:self-end">
                {/* Ravenwatch Root */}
                <a
                  href="https://rootapp.gg/AC1NPUuJiQqlyDvGbgH-8A"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-950/50 cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Ravenwatch Root</span>
                  <ExternalLink className="w-3 h-3 text-emerald-200" />
                </a>

                {/* NOIR HQ */}
                <a
                  href="https://rootapp.gg/AC01VYpHiAq1rM0An8FDzw"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                  <span>NOIR HQ</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>

                {/* Profile / Register */}
                {onOpenAuthModal && (
                  <button
                    type="button"
                    onClick={onOpenAuthModal}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow cursor-pointer"
                  >
                    <span>{userAccount ? `@${userAccount.displayName}` : 'Register for 3.30'}</span>
                  </button>
                )}
              </div>

            </div>
          </div>
        )}
      </div>

      {/* ============================================================================ */}
      {/* CUSTOMIZE HERO ARTWORK & GAME AVATAR MODAL */}
      {/* ============================================================================ */}
      {isModalOpen && (
        <dialog
          ref={dialogRef}
          aria-labelledby={modalTitleId}
          className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 text-slate-200 p-0 shadow-2xl backdrop:bg-black/80 m-auto overflow-hidden"
        >
          <div className="flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-slate-800 bg-slate-800/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-400" />
                <h3 id={modalTitleId} className="text-sm font-bold text-white">
                  Customize League Hero Banner Artwork & Game Avatar
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  dialogRef.current?.close();
                  setIsModalOpen(false);
                }}
                className="text-slate-400 hover:text-white text-xs font-mono px-2 py-1 rounded bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto">
              {/* Artwork URL */}
              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300 font-semibold block">
                  Hero Artwork URL (Banner Image)
                </label>
                <input
                  type="text"
                  value={formArtwork}
                  onChange={(e) => setFormArtwork(e.target.value)}
                  placeholder="/images/covens_of_umbra_hero.png or external https:// link"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                <div className="flex items-center gap-2 pt-1 text-[11px] font-mono text-slate-400">
                  <span>Presets:</span>
                  <button
                    type="button"
                    onClick={() => setFormArtwork('/images/covens_of_umbra_hero.png')}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                  >
                    Covens of Umbra Art
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormArtwork('https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80')}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                  >
                    Dark Ritual
                  </button>
                </div>
              </div>

              {/* Game Avatar URL */}
              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300 font-semibold block">
                  Game Avatar / Crest URL
                </label>
                <input
                  type="text"
                  value={formAvatar}
                  onChange={(e) => setFormAvatar(e.target.value)}
                  placeholder="/logo.png or external https:// link"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                <div className="flex items-center gap-2 pt-1 text-[11px] font-mono text-slate-400">
                  <span>Presets:</span>
                  <button
                    type="button"
                    onClick={() => setFormAvatar('/logo.png')}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                  >
                    Exile Crest
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormAvatar('/favicon.png')}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                  >
                    Favicon
                  </button>
                </div>
              </div>

              {/* League Title */}
              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300 font-semibold block">
                  League Title Header
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Tagline */}
              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300 font-semibold block">
                  League Tagline
                </label>
                <input
                  type="text"
                  value={formTagline}
                  onChange={(e) => setFormTagline(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset to Defaults</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      dialogRef.current?.close();
                      setIsModalOpen(false);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Save Banner</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </dialog>
      )}
    </>
  );
};
