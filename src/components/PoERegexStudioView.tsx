import React, { useEffect, useMemo, useState } from 'react';
import {
  Filter,
  ExternalLink,
  RotateCcw,
  Copy,
  Check,
  Bookmark,
  Plus,
  Trash2,
  Flame,
  Hammer,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';

interface PoERegexStudioViewProps {
  selectedGame?: 'poe1' | 'poe2';
}

interface RegexPresetTab {
  id: string;
  label: string;
  url: string;
  hint: string;
}

interface SavedRegexItem {
  id: string;
  game: 'poe1' | 'poe2';
  category: string;
  label: string;
  regex: string;
  createdAt: string;
}

const STORAGE_KEY = 'exile_ssf_saved_regexes_v1';

const POE1_TABS: RegexPresetTab[] = [
  { id: 'vendor', label: 'Vendor', url: 'https://poe.re/vendor', hint: 'Act 1 to 10 vendor socket links, colors, and movement speed boots' },
  { id: 'gems', label: 'Gems', url: 'https://poe.re/gems', hint: 'Filter skill and support gems by color, tag, and quality' },
  { id: 'maps', label: 'Map Mods', url: 'https://poe.re/maps', hint: 'Avoid lethal map mods and highlight high pack size or quantity' },
  { id: 'items', label: 'Items', url: 'https://poe.re/items', hint: 'Highlight crafting bases, flasks, and specific stash modifiers' },
  { id: 'heist', label: 'Heist', url: 'https://poe.re/heist', hint: 'Filter Heist contracts and blueprints by job type and reward' },
  { id: 'beast', label: 'Bestiary', url: 'https://poe.re/beast', hint: 'Find valuable Einhar beasts in your Menagerie quickly' },
  { id: 'tattoo', label: 'Tattoo', url: 'https://poe.re/tattoo', hint: 'Filter Ancestor Tattoos by attribute and bonus type' },
  { id: 'runegraft', label: 'Runegraft', url: 'https://poe.re/runegraft', hint: 'Search Runegrafts and enchantment modifiers cleanly' },
  { id: 'ultimatum', label: 'Ultimatum', url: 'https://poe.re/ultimatum', hint: 'Filter Inscribed Ultimatums by reward, wager, and danger mods' }
];

const POE2_TABS: RegexPresetTab[] = [
  { id: 'poe2_waystones', label: 'Waystones', url: 'https://poe2.re/', hint: 'Filter Path of Exile 2 Waystones by tier, rarity, and dangerous mods' },
  { id: 'poe2_vendor', label: 'Vendor & Items', url: 'https://poe2.re/vendor', hint: 'Highlight campaign vendor upgrades, sockets, and crafting bases' },
  { id: 'poe2_relics', label: 'Tablets & Relics', url: 'https://poe2.re/relics', hint: 'Filter Trial of the Sekhemas Relics and Precursor Tablets' }
];

function loadSavedRegexes(): SavedRegexItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const PoERegexStudioView: React.FC<PoERegexStudioViewProps> = ({ selectedGame = 'poe1' }) => {
  const [game, setGame] = useState<'poe1' | 'poe2'>(selectedGame);
  const [activeTabId, setActiveTabId] = useState<string>(selectedGame === 'poe2' ? 'poe2_waystones' : 'maps');
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Saved personal regex presets
  const [savedRegexes, setSavedRegexes] = useState<SavedRegexItem[]>(loadSavedRegexes);
  const [showSavedPanel, setShowSavedPanel] = useState<boolean>(false);
  const [newLabel, setNewLabel] = useState<string>('');
  const [newRegex, setNewRegex] = useState<string>('');

  useEffect(() => {
    document.title = 'Regex Studio | Exile SSF';
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedRegexes));
    } catch {}
  }, [savedRegexes]);

  const activeTabs = game === 'poe2' ? POE2_TABS : POE1_TABS;
  const activeTab = useMemo(
    () => activeTabs.find((t) => t.id === activeTabId) || activeTabs[0],
    [activeTabs, activeTabId]
  );

  const handleSwitchGame = (next: 'poe1' | 'poe2') => {
    setGame(next);
    setActiveTabId(next === 'poe2' ? 'poe2_waystones' : 'maps');
    setIframeKey((k) => k + 1);
  };

  const handleSelectTab = (tabId: string) => {
    setActiveTabId(tabId);
    setIframeKey((k) => k + 1);
  };

  const handleCopy = (key: string, value: string) => {
    navigator.clipboard?.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const handleSavePreset = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanLabel = newLabel.trim();
    const cleanRegex = newRegex.trim();
    if (!cleanLabel || !cleanRegex) return;

    const item: SavedRegexItem = {
      id: `rx-${Date.now()}`,
      game,
      category: activeTab.label,
      label: cleanLabel,
      regex: cleanRegex,
      createdAt: new Date().toLocaleDateString()
    };
    setSavedRegexes((prev) => [item, ...prev]);
    setNewLabel('');
    setNewRegex('');
  };

  const handleDeletePreset = (id: string) => {
    setSavedRegexes((prev) => prev.filter((item) => item.id !== id));
  };

  const gameSavedRegexes = useMemo(
    () => savedRegexes.filter((r) => r.game === game),
    [savedRegexes, game]
  );

  return (
    <div className="w-full space-y-4 pb-8 font-sans text-slate-200 flex flex-col">
      {/* Header Bar */}
      <header className="rounded-2xl border border-slate-800 bg-gradient-to-r from-[#0e1320] via-indigo-950/30 to-[#0e1320] p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-lg">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-poe font-bold text-white flex items-center gap-2">
              <Filter className="w-5 h-5 text-amber-400" />
              <span>Regex Studio</span>
            </h1>
            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
              Powered by {game === 'poe2' ? 'poe2.re' : 'poe.re'}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Generate compact in game search strings for vendors, map rolling, heist, bestiary, tattoos, runegrafts, ultimatum, and PoE 2 waystones, then bookmark your favorites below.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* PoE 1 / PoE 2 Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-indigo-500/25 text-xs font-bold">
            <button
              type="button"
              onClick={() => handleSwitchGame('poe1')}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                game === 'poe1'
                  ? 'bg-indigo-600/30 text-white border border-indigo-400/60 shadow-sm'
                  : 'text-slate-400 border border-transparent hover:text-white'
              }`}
            >
              <Flame className={`w-3.5 h-3.5 ${game === 'poe1' ? 'text-amber-300' : 'text-slate-500'}`} />
              <span>PoE 1 (poe.re)</span>
            </button>
            <button
              type="button"
              onClick={() => handleSwitchGame('poe2')}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                game === 'poe2'
                  ? 'bg-indigo-600/30 text-white border border-indigo-400/60 shadow-sm'
                  : 'text-slate-400 border border-transparent hover:text-white'
              }`}
            >
              <Hammer className={`w-3.5 h-3.5 ${game === 'poe2' ? 'text-amber-300' : 'text-slate-500'}`} />
              <span>PoE 2 (poe2.re)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowSavedPanel((v) => !v)}
            className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              showSavedPanel
                ? 'bg-amber-500/20 border-amber-400/60 text-amber-200'
                : 'bg-slate-900 border-slate-700 text-slate-200 hover:border-slate-500'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 text-amber-400" />
            <span>Saved ({gameSavedRegexes.length})</span>
            {showSavedPanel ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => setIframeKey((k) => k + 1)}
            title="Reload embedded regex tool"
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => handleCopy('url', activeTab.url)}
            title="Copy current poe.re URL"
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 cursor-pointer"
          >
            {copiedKey === 'url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span className="hidden sm:inline">{copiedKey === 'url' ? 'Copied' : 'Copy Link'}</span>
          </button>

          <a
            href={activeTab.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow"
          >
            <span>Open External</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      {/* Prominent Category Ribbon */}
      <div className="px-3.5 py-2.5 rounded-2xl border border-indigo-500/25 bg-gradient-to-r from-[#0d121d] via-[#101726] to-[#0d121d] shadow-inner flex flex-wrap items-center gap-1.5 sm:gap-2">
        {activeTabs.map((tab) => {
          const isActive = activeTab.id === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleSelectTab(tab.id)}
              title={tab.hint}
              className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer min-h-[40px] ${
                isActive
                  ? 'bg-indigo-600/25 text-white border border-indigo-400/60 shadow-md shadow-indigo-500/15 ring-1 ring-indigo-500/30'
                  : 'bg-slate-900/60 text-slate-200 border border-slate-800/80 hover:border-slate-600 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-gradient-to-r from-indigo-400 via-amber-400 to-indigo-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* Collapsible Personal Saved Regex Presets */}
      {showSavedPanel && (
        <section className="rounded-2xl border border-amber-500/30 bg-slate-900/90 p-4 space-y-4 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white">
                My Saved {game === 'poe2' ? 'Path of Exile 2' : 'Path of Exile 1'} Regex Strings
              </h2>
            </div>
            <span className="text-[11px] text-slate-400">
              Generate a string below, paste it here, and keep it handy across sessions.
            </span>
          </div>

          <form onSubmit={handleSavePreset} className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Preset name (e.g. T17 Safe Map Regex)"
              className="md:col-span-4 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/60"
            />
            <input
              type="text"
              value={newRegex}
              onChange={(e) => setNewRegex(e.target.value)}
              placeholder="Paste generated regex string from poe.re..."
              className="md:col-span-6 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-amber-300 placeholder-slate-500 focus:outline-none focus:border-amber-400/60"
            />
            <button
              type="submit"
              className="md:col-span-2 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Save Preset</span>
            </button>
          </form>

          {gameSavedRegexes.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-400">
              No saved regexes for {game === 'poe2' ? 'Path of Exile 2' : 'Path of Exile 1'} yet. Build one below and paste it above to bookmark it.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {gameSavedRegexes.map((item) => {
                const isCopied = copiedKey === item.id;
                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate">{item.label}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 shrink-0">
                          {item.category}
                        </span>
                      </div>
                      <code className="block text-[11px] font-mono text-amber-300 truncate">
                        {item.regex}
                      </code>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopy(item.id, item.regex)}
                        title="Copy regex to clipboard"
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1 cursor-pointer"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{isCopied ? 'Copied' : 'Copy'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePreset(item.id)}
                        title="Delete saved preset"
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-500/20 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Embedded poe.re / poe2.re Frame */}
      <div className="w-full rounded-2xl border border-slate-800 bg-[#0d1016] shadow-2xl overflow-hidden flex flex-col">
        <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
          <span className="truncate">
            Active Tool: <strong className="text-amber-300">{activeTab.label}</strong> ({activeTab.url})
          </span>
          <span className="hidden md:inline text-slate-500">{activeTab.hint}</span>
        </div>

        <iframe
          key={iframeKey}
          src={activeTab.url}
          title={`PoE Regex Studio (${activeTab.label})`}
          className="w-full h-[78vh] min-h-[680px] bg-[#141414]"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-clipboard-write"
        />
      </div>
    </div>
  );
};
