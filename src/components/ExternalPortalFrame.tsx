import React, { useState, useEffect } from 'react';
import { ExternalLink, RotateCcw, Search, Copy, Check, Sparkles, UserCheck } from 'lucide-react';
import type { UserAccount } from '../types';
import { fetchActiveCharacterContext, type ActiveCharacterContext } from '../services/cloudSync';

export interface PortalPreset {
  label: string;
  url: string;
  highlight?: boolean;
}

interface ExternalPortalFrameProps {
  title: string;
  badge: string;
  subtitle: string;
  accentColor: 'amber' | 'sky' | 'emerald';
  icon: React.ReactNode;
  initialUrl: string;
  searchPlaceholder: string;
  buildSearchUrl: (query: string) => string;
  presets: PortalPreset[];
  selectedGame?: 'poe1' | 'poe2';
  userAccount?: UserAccount | null;
  buildCharacterPresets?: (ctx: ActiveCharacterContext) => PortalPreset[];
}

const ACCENT_MAP = {
  amber: {
    iconBox: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    activeBtn: 'bg-amber-500/25 border-amber-400/60 text-amber-200',
    primaryBtn: 'bg-amber-600 hover:bg-amber-500 text-white'
  },
  sky: {
    iconBox: 'bg-sky-500/15 border-sky-500/30 text-sky-400',
    badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    activeBtn: 'bg-sky-500/25 border-sky-400/60 text-sky-200',
    primaryBtn: 'bg-sky-600 hover:bg-sky-500 text-white'
  },
  emerald: {
    iconBox: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    activeBtn: 'bg-emerald-500/25 border-emerald-400/60 text-emerald-200',
    primaryBtn: 'bg-emerald-600 hover:bg-emerald-500 text-white'
  }
};

export const ExternalPortalFrame: React.FC<ExternalPortalFrameProps> = ({
  title,
  badge,
  subtitle,
  accentColor,
  icon,
  initialUrl,
  searchPlaceholder,
  buildSearchUrl,
  presets,
  selectedGame = 'poe1',
  userAccount,
  buildCharacterPresets
}) => {
  const [currentUrl, setCurrentUrl] = useState<string>(initialUrl);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [charContext, setCharContext] = useState<ActiveCharacterContext | null>(null);

  const theme = ACCENT_MAP[accentColor];

  // Keep currentUrl synchronized when switching between PoE 1 and PoE 2
  useEffect(() => {
    setCurrentUrl(initialUrl);
    setIframeKey((k) => k + 1);
  }, [initialUrl]);

  useEffect(() => {
    if (!userAccount || !buildCharacterPresets) {
      setCharContext(null);
      return;
    }
    let cancelled = false;
    fetchActiveCharacterContext(userAccount, selectedGame).then((ctx) => {
      if (!cancelled) setCharContext(ctx);
    });
    return () => {
      cancelled = true;
    };
  }, [userAccount, selectedGame]);

  const personalPresets = charContext && buildCharacterPresets ? buildCharacterPresets(charContext) : [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setCurrentUrl(buildSearchUrl(searchQuery.trim()));
    setIframeKey((k) => k + 1);
  };

  const handleSelectUrl = (url: string) => {
    setCurrentUrl(url);
    setIframeKey((k) => k + 1);
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="space-y-3 w-full pb-6 flex flex-col h-[calc(100dvh-6.5rem)] lg:h-[calc(100dvh-2rem)] font-sans text-slate-200">
      {/* Control Header */}
      <div className="bg-gradient-to-r from-[#0e1320] via-indigo-950/30 to-[#0e1320] border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3 flex-shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-2.5 rounded-xl border shrink-0 ${theme.iconBox}`}>{icon}</div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-cinzel font-bold text-slate-100 truncate">{title}</h1>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${theme.badge}`}>
                  {badge}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">{subtitle}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIframeKey((k) => k + 1)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              title="Reload frame"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy URL'}</span>
            </button>
            <a
              href={currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow ${theme.primaryBtn}`}
            >
              <span>Open in New Tab</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Search & Presets */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-2.5">
          <form onSubmit={handleSearch} className="relative flex-1 min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-8 pr-20 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-400"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-200 cursor-pointer"
            >
              Go
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-1.5">
            {presets.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => handleSelectUrl(p.url)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                  currentUrl === p.url
                    ? theme.activeBtn
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Character & Wishlist Quick Lookups */}
        {personalPresets.length > 0 && (
          <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="inline-flex items-center gap-1 font-mono uppercase text-[10px] text-emerald-400 font-bold mr-1">
              <UserCheck className="w-3.5 h-3.5" />
              <span>My Character & Wishlist:</span>
            </span>
            {personalPresets.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => handleSelectUrl(p.url)}
                className="px-2.5 py-0.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/35 text-emerald-200 font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Embedded Frame with Clean Direct Launch Fallback */}
      <div className="flex-1 min-h-0 rounded-2xl border border-slate-800 bg-[#0b0e15] overflow-hidden flex flex-col shadow-xl">
        <div className="px-3.5 py-1.5 bg-slate-950/90 border-b border-slate-800/80 flex items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
          <span className="truncate">{currentUrl}</span>
          <a
            href={currentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-400 hover:text-sky-300 shrink-0 inline-flex items-center gap-1"
          >
            <span>Blocked by browser shields? Open directly</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <iframe
          key={iframeKey}
          src={currentUrl}
          title={title}
          className="w-full flex-1 border-0 bg-[#0b0e15]"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          loading="lazy"
        />
      </div>
    </div>
  );
};
