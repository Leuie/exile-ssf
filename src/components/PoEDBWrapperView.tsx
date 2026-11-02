import React, { useState } from 'react';
import { Database, ExternalLink, RotateCcw, Search, Copy, Check, ShieldAlert } from "lucide-react";

interface PoEDBWrapperProps {
  initialUrl?: string;
  title?: string;
  isPoE2?: boolean;
}

export const PoEDBWrapperView: React.FC<PoEDBWrapperProps> = ({
  initialUrl = 'https://poedb.tw/us/',
  title = 'PoE DB Portal',
  isPoE2 = false
}) => {
  const [currentUrl, setCurrentUrl] = useState<string>(initialUrl);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [iframeKey, setIframeKey] = useState<number>(0);

  const poe1Presets = [
    { label: 'PoE DB Home', url: 'https://poedb.tw/us/' },
    { label: 'Item Modifiers & Weights', url: 'https://poedb.tw/us/Modifiers' },
    { label: 'Base Items (Armour)', url: 'https://poedb.tw/us/Armour' },
    { label: 'Unique Items', url: 'https://poedb.tw/us/Unique_item' },
    { label: 'Skill & Transfigured Gems', url: 'https://poedb.tw/us/Gem' },
    { label: 'Spectres & Monsters', url: 'https://poedb.tw/us/Monsters' },
    { label: 'Atlas Passives', url: 'https://poedb.tw/us/Atlas_passive_skill' }
  ];

  const poe2Presets = [
    { label: 'PoE 2 DB Home', url: 'https://poe2db.tw/us/' },
    { label: 'PoE 2 Gems', url: 'https://poe2db.tw/us/Gem' },
    { label: 'PoE 2 Modifiers', url: 'https://poe2db.tw/us/Modifiers' },
    { label: 'PoE 2 Base Items', url: 'https://poe2db.tw/us/Item' }
  ];

  const presets = isPoE2 ? poe2Presets : poe1Presets;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const base = isPoE2 ? 'https://poe2db.tw/us/search?q=' : 'https://poedb.tw/us/search?q=';
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
            <div className="p-2.5 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-600 dark:text-sky-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-poe font-bold text-slate-900 dark:text-slate-100">
                  {title}
                </h1>
                <span className="text-[10px] bg-sky-500/20 text-sky-800 dark:text-sky-300 font-bold px-2 py-0.5 rounded border border-sky-500/30 uppercase">
                  {isPoE2 ? 'PoE 2 Datamine' : 'Datamined Engine'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Exact datamined spawn weights, internal item tags, ilvl mod tiers, and monster stats.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-end md:self-center">
            <button
              onClick={handleReload}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-poe-border text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              title="Refresh frame"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-poe-border text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              title="Copy current URL"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy URL'}</span>
            </button>

            <a
              href={currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-sky-500/20 transition-all hover:scale-105"
            >
              <span>Open in New Tab</span>
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
              placeholder={`Search ${isPoE2 ? 'PoE 2 DB' : 'PoE DB'} directly (e.g. Convoking Wand, Spell Suppression)...`}
              className="w-full pl-9 pr-16 py-1.5 bg-slate-50 dark:bg-poe-darkest border border-slate-200 dark:border-poe-border rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500 shadow-inner"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-sky-500 text-slate-950 font-bold text-[10px] rounded-lg hover:bg-sky-400"
            >
              Search
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
                    ? 'bg-sky-500 text-slate-950 font-bold'
                    : 'bg-slate-100 dark:bg-poe-dark border border-slate-200 dark:border-poe-border text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Embedded Iframe Container & Fallback Header */}
      <div className="flex-1 w-full bg-white dark:bg-[#0c0e14] rounded-2xl border border-slate-200 dark:border-poe-border shadow-2xl overflow-hidden relative flex flex-col">
        
        {/* Security Notice / 1 Click Launch Header */}
        <div className="bg-sky-50 dark:bg-sky-950/40 border-b border-sky-200 dark:border-sky-500/30 px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <ShieldAlert className="w-4 h-4 text-sky-600 dark:text-sky-400 flex-shrink-0" />
            <span>
              <strong>Note:</strong> PoEDB's servers send security headers (<code className="text-[11px] font-mono bg-sky-100 dark:bg-sky-900/60 px-1 py-0.5 rounded">X-Frame-Options: SAMEORIGIN</code>) that may block in app embedding on some browsers.
            </span>
          </div>
          
          <a
            href={currentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 flex-shrink-0 shadow-sm transition-all"
          >
            <span>Open {isPoE2 ? 'PoE 2 DB' : 'PoE DB'} Window</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <iframe
          key={iframeKey}
          src={currentUrl}
          title="PoEDB Embedded Portal"
          className="w-full flex-1 border-none"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads"
          loading="lazy"
        />
      </div>

    </div>
  );
};
