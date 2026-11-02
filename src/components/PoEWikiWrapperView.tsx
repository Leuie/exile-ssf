import React, { useState } from 'react';
import { BookOpen, ExternalLink, RotateCcw, Search, Copy, Check } from "lucide-react";

interface PoEWikiWrapperProps {
  initialUrl?: string;
  title?: string;
  isPoE2?: boolean;
}

export const PoEWikiWrapperView: React.FC<PoEWikiWrapperProps> = ({ 
  initialUrl = 'https://www.poewiki.net/',
  title = 'PoEWiki Portal',
  isPoE2 = false
}) => {
  const [currentUrl, setCurrentUrl] = useState<string>(initialUrl);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [iframeKey, setIframeKey] = useState<number>(0);

  const poe1Presets = [
    { label: 'Wiki Home', url: 'https://www.poewiki.net/' },
    { label: 'Vendor Recipes', url: 'https://www.poewiki.net/wiki/Vendor_recipe_system' },
    { label: 'Skill Gems', url: 'https://www.poewiki.net/wiki/Skill_gem' },
    { label: 'Divination Cards', url: 'https://www.poewiki.net/wiki/Divination_card' },
    { label: 'Pinnacle Bosses', url: 'https://www.poewiki.net/wiki/Pinnacle_boss' },
    { label: 'Spell Suppression', url: 'https://www.poewiki.net/wiki/Spell_suppression' },
    { label: 'The Pantheon', url: 'https://www.poewiki.net/wiki/The_Pantheon' }
  ];

  const poe2Presets = [
    { label: 'PoE 2 Wiki Home', url: 'https://www.poe2wiki.net/' },
    { label: 'PoE 2 Skill Gems', url: 'https://www.poe2wiki.net/wiki/Skill_gem' },
    { label: 'PoE 2 Classes', url: 'https://www.poe2wiki.net/wiki/Character_class' },
    { label: 'PoE 2 Weapons', url: 'https://www.poe2wiki.net/wiki/Weapon' }
  ];

  const presets = isPoE2 ? poe2Presets : poe1Presets;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const base = isPoE2 ? 'https://www.poe2wiki.net/wiki/Special:Search?search=' : 'https://www.poewiki.net/wiki/Special:Search?search=';
    const formatted = `${base}${encodeURIComponent(searchQuery.trim())}`;
    setCurrentUrl(formatted);
    setIframeKey((prev) => prev + 1);
  };

  const handleSelectPreset = (url: string) => {
    setCurrentUrl(url);
    setIframeKey((prev) => prev + 1);
  };

  const handleReload = () => {
    setIframeKey((prev) => prev + 1);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-8 flex flex-col h-[calc(100vh-2rem)]">
      
      {/* Embedded Portal Control Bar */}
      <div className="bg-white dark:bg-[#0f121a] border border-slate-200 dark:border-poe-border rounded-2xl p-4 shadow-md space-y-3 flex-shrink-0">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Resource Title & Badge */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-poe font-bold text-slate-900 dark:text-slate-100">
                  {title}
                </h1>
                <span className="text-[10px] bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-500/30 uppercase">
                  {isPoE2 ? 'PoE 2 Wiki' : 'Community Wiki'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official community maintained wiki for mechanics, base items, skills, and areas.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-end md:self-center">
            <button
              onClick={handleReload}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-poe-border text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              title="Refresh frame"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-poe-border text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              title="Copy current URL"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy URL'}</span>
            </button>

            <a
              href={currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all hover:scale-105"
            >
              <span>Pop to External</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Quick Search & Preset Hub */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-slate-100 dark:border-poe-border/40">
          
          <form onSubmit={handleSearch} className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${isPoE2 ? 'PoE 2 Wiki' : 'PoEWiki'} directly...`}
              className="w-full pl-9 pr-16 py-1.5 bg-slate-50 dark:bg-poe-darkest border border-slate-200 dark:border-poe-border rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 shadow-inner"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-amber-500 text-slate-950 font-bold text-[10px] rounded-lg hover:bg-amber-400"
            >
              Go
            </button>
          </form>

          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
            <span className="text-[11px] text-slate-400 font-semibold uppercase mr-1 hidden lg:inline">Quick Jump:</span>
            {presets.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectPreset(p.url)}
                className={`px-2.5 py-1 text-xs rounded-lg whitespace-nowrap transition-colors font-medium ${
                  currentUrl === p.url
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-100 dark:bg-poe-dark border border-slate-200 dark:border-poe-border text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Embedded Iframe Container */}
      <div className="flex-1 w-full bg-white dark:bg-[#0c0e14] rounded-2xl border border-slate-200 dark:border-poe-border shadow-2xl overflow-hidden relative">
        <iframe
          key={iframeKey}
          src={currentUrl}
          title="PoEWiki Embedded Portal"
          className="w-full h-full border-none"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads"
          loading="lazy"
        />
      </div>

    </div>
  );
};
