import React from 'react';
import {
  Target,
  Users,
  Award,
  Zap,
  Gem,
  HeartHandshake,
  Repeat,
  ExternalLink,
  Flame,
  Compass,
  Scroll,
  ArrowRight,
  FileSpreadsheet
} from 'lucide-react';
import { downloadStarterSheetTemplate } from '../utils/spreadsheetEngine';

interface HomeViewProps {
  onNavigate?: (tab: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  return (
    <div className="w-full space-y-6 pb-16 font-sans text-slate-200">
      {/* Sleek Command Center Header Banner */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/85 p-6 sm:p-8 backdrop-blur-md shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-4 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/35 text-[11px] font-mono uppercase tracking-wider font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                PoE 1 &amp; PoE 2 Compendium + Private League Platform
              </span>

              <a
                href="https://www.pathofexile.com/covens"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/90 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-mono transition-colors"
                title="Path of Exile 1: 3.30 Covens of Umbra"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>PoE 1: 3.30 Covens of Umbra</span>
                <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
              </a>

              <a
                href="https://pathofexile2.com/ancients"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/90 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-mono transition-colors"
                title="Path of Exile 2: 0.5 Return of the Ancients"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>PoE 2: 0.5 Return of the Ancients</span>
                <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
              </a>
            </div>

            <div>
              <h1 className="text-2xl sm:text-4xl font-poppins font-bold text-white tracking-tight leading-tight">
                Your Command Center for SSF &amp; Private Leagues
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed mt-2">
                Exile SSF is an all in one Solo Self Found compendium and cloud synced Group Self Found private league platform for both{' '}
                <strong className="text-slate-200 font-semibold">Path of Exile 1 and Path of Exile 2</strong>. Whether you are progressing solo from Twilight Strand to pinnacle bosses or hosting a 10 to 60 player private league for your own community, everything you need lives on one fast second monitor hub.
              </p>
            </div>

            {/* Quick Action Utility Bar */}
            {onNavigate && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={() => onNavigate('private_league_hub')}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-lg shadow-indigo-500/20"
                >
                  <Users className="w-4 h-4 text-amber-300" />
                  <span>Open Private League Hub</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onNavigate('builds')}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white font-semibold text-xs flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>SSF Starter Builds</span>
                </button>

                <button
                  onClick={() => onNavigate('atlas')}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white font-semibold text-xs flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Compass className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Atlas &amp; Mapping</span>
                </button>

                <button
                  type="button"
                  onClick={downloadStarterSheetTemplate}
                  className="px-3.5 py-2.5 rounded-xl bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-700/60 text-emerald-300 font-semibold text-xs flex items-center gap-2 transition-colors cursor-pointer"
                  title="Download a blank styled Google Sheets template to organize your own private league"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Download League Starter Sheet</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex-shrink-0 flex justify-center md:justify-end">
            <div className="p-2 rounded-2xl bg-slate-950 border border-slate-800">
              <img
                src="/logo.png"
                alt="Exile SSF Compendium Logo"
                className="w-28 h-28 sm:w-36 sm:h-36 object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3 Core Pillars: High Density Utility Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/75 space-y-2 hover:border-indigo-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider font-bold">01 • Private League Engine</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <h3 className="font-poppins font-bold text-sm text-white">Run Any PoE 1 or PoE 2 GSF League</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Built so any host or friend group can coordinate multi character wishlists, live Activity Feeds, incentivized item bounties, Boss Rotas, Free Stash drops, Squad Atlas matrices, custom `.filter` exports, and Google Sheets signups with zero spreadsheet chaos.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/75 space-y-2 hover:border-amber-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider font-bold">02 • Cross Game Identity</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <h3 className="font-poppins font-bold text-sm text-white">Unified PoE 1 &amp; PoE 2 Exile Profiles</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Every exile gets a permanent <span className="font-mono text-slate-300">/exile/handle</span> hub uniting characters, lifetime Honor Points, verified carry vouches, seasonal achievements, saved Map Regexes, and Farming Scratchpads across both Path of Exile titles.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/75 space-y-2 hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-bold">03 • SSF Compendium</span>
            <Target className="w-4 h-4 text-emerald-400" />
          </div>
          <h3 className="font-poppins font-bold text-sm text-white">Deterministic Mastery in Plain English</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Replace dozens of scattered browser tabs with verified vendor formulas, Atlas progression trees, defensive masterclasses, league mechanic cheat sheets, and reliable starter blueprints engineered for soloists and cooperative squads alike.
          </p>
        </div>
      </div>

      {/* Quick Navigation Utility Grid */}
      {onNavigate && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => onNavigate('private_league_hub')}
            className="p-3.5 rounded-xl border border-indigo-500/35 bg-indigo-950/20 hover:border-indigo-400/60 hover:bg-indigo-950/35 text-left transition-colors cursor-pointer"
          >
            <Users className="w-4 h-4 text-indigo-400 mb-1.5" />
            <div className="font-poppins font-bold text-xs text-white">Private League Hub</div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">Browse, join, or host GSF</div>
          </button>

          <button
            onClick={() => onNavigate('atlas')}
            className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-800/60 text-left transition-colors cursor-pointer"
          >
            <Compass className="w-4 h-4 text-emerald-400 mb-1.5" />
            <div className="font-poppins font-bold text-xs text-slate-100">Atlas &amp; Mapping</div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">Progression trees &amp; strats</div>
          </button>

          <button
            onClick={() => onNavigate('builds')}
            className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-800/60 text-left transition-colors cursor-pointer"
          >
            <Flame className="w-4 h-4 text-amber-400 mb-1.5" />
            <div className="font-poppins font-bold text-xs text-slate-100">SSF Builds</div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">League starter blueprints</div>
          </button>

          <button
            onClick={() => onNavigate('vendor_recipes')}
            className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-800/60 text-left transition-colors cursor-pointer"
          >
            <Scroll className="w-4 h-4 text-purple-400 mb-1.5" />
            <div className="font-poppins font-bold text-xs text-slate-100">Vendor Recipes</div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">Verified formulas &amp; recipes</div>
          </button>
        </div>
      )}

      {/* Manifesto Section */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 space-y-5">
        <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Philosophy &amp; Manifesto</span>
            <h2 className="text-base sm:text-lg font-poppins font-bold text-white mt-0.5">
              Why Play Solo Self Found &amp; Private Leagues?
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-500 hidden sm:inline-block">Deterministic ARPG Progression</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-lg border border-slate-800/80 bg-slate-950/60 flex items-start gap-3">
            <div className="p-2 rounded bg-slate-800 border border-slate-700 text-rose-400 mt-0.5 flex-shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-xs text-slate-100">Escape Trade Burnout &amp; Market Inflation</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                In trade leagues, gearing is solved by wiping your stash and offloading items onto trade. In SSF, there is no inflation and no competition but yourself. Progression is measured in character milestones rather than currency per hour.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-800/80 bg-slate-950/60 flex items-start gap-3">
            <div className="p-2 rounded bg-slate-800 border border-slate-700 text-amber-400 mt-0.5 flex-shrink-0">
              <Gem className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-xs text-slate-100">Meaningful Drops &amp; True Crafting</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                A simple <em className="text-amber-300 font-mono">Tabula Rasa</em>, a fractured suppression base, or your first 6 link from <em className="text-amber-300 font-mono">The Porcupine</em> feels like winning the lottery. You utilize the full depth of Path of Exile crafting systems.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-800/80 bg-slate-950/60 flex items-start gap-3">
            <div className="p-2 rounded bg-slate-800 border border-slate-700 text-indigo-400 mt-0.5 flex-shrink-0">
              <HeartHandshake className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-xs text-slate-100">Private League Synergy &amp; Barter</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Group Self Found with squad mates offers a sweet spot: the joy of self found drops combined with specialized teamwork. One exile farms Harvest for lifeforce, another runs Betrayal for veiled crafts, and another farms Breach for uniques.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-800/80 bg-slate-950/60 flex items-start gap-3">
            <div className="p-2 rounded bg-slate-800 border border-slate-700 text-emerald-400 mt-0.5 flex-shrink-0">
              <Repeat className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-xs text-slate-100">Deterministic Character Roadmaps</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                You do not need trade luck to defeat pinnacle bosses. By understanding vendor recipes, essence crafting orders, and reliable SSF friendly builds, your character will progress from twilight beach to 4 Voidstones every single league.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
