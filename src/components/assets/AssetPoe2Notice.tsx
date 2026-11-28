import React from 'react';
import { Package, Sparkles, ExternalLink } from 'lucide-react';

interface AssetPoe2NoticeProps {
  onSwitchToPoe1: () => void;
}

export const AssetPoe2Notice: React.FC<AssetPoe2NoticeProps> = ({ onSwitchToPoe1 }) => (
  <div className="w-full max-w-5xl mx-auto space-y-5 pb-16 font-sans text-slate-200">
    <header className="rounded-2xl border border-cyan-500/35 bg-gradient-to-r from-[#0d111a] via-cyan-950/30 to-[#0d111a] p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-black font-cinzel text-white tracking-tight flex items-center gap-2">
          <Package className="w-5 h-5 text-cyan-400" />
          <span>Asset Tracker</span>
        </h1>
        <p className="text-xs text-slate-400">
          Path of Exile 2 stash net worth, currency valuation, and farming session snapshots.
        </p>
      </div>
      <button
        type="button"
        onClick={onSwitchToPoe1}
        className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 text-xs font-bold cursor-pointer shrink-0 transition-colors"
      >
        Switch to PoE 1 Asset Tracker
      </button>
    </header>

    <div className="p-6 sm:p-8 rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/25 via-slate-950 to-slate-900/90 space-y-4 shadow-xl">
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/35 text-cyan-300 text-[11px] font-mono font-bold uppercase">
        <Sparkles className="w-3.5 h-3.5" />
        <span>Path of Exile 2 Asset Tracker • In Development</span>
      </div>
      <h2 className="text-xl font-cinzel font-bold text-white">
        PoE 2 Stash Sync — Coming Soon
      </h2>
      <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
        Live stash tab syncing and automated net worth tracking for Path of Exile 2 are currently in development. Grinding Gear Games has not yet opened the public PoE 2 Stash Tab API, so automatic stash snapshots are unavailable for now. As soon as GGG releases the PoE 2 Stash API, full Asset Tracker and Wealth Analytics support will go live here.
      </p>
      <div className="pt-2 flex flex-wrap gap-2.5">
        <a
          href="https://poe2.ninja/economy"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 text-xs font-bold inline-flex items-center gap-1.5"
        >
          <span>PoE 2 Ninja Economy</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
        <a
          href="https://poe2db.tw/us/"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold inline-flex items-center gap-1.5"
        >
          <span>PoE 2 DB</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  </div>
);
