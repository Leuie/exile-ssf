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
  Stethoscope,
  Flame,
  Compass,
  Scroll,
  ArrowRight
} from "lucide-react";

interface HomeViewProps {
  onNavigate?: (tab: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  return (
    <div className="w-full space-y-6 pb-16 font-sans text-slate-200">
      
      {/* Sleek Subdued Command Center Header Banner */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/85 p-6 sm:p-8 backdrop-blur-md shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-4 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-mono uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Solo Self Found Compendium
              </span>
              
              <a 
                href="https://www.pathofexile.com/umbra"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/90 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-mono transition-colors"
                title="Current League: 3.30 Coven of Umbra (Click to view season page)"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>PoE 1: 3.30 Coven of Umbra</span>
                <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
              </a>

              <a 
                href="https://pathofexile2.com/ancients"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/90 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-mono transition-colors"
                title="Upcoming League: 0.5 Return of the Ancients"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>PoE 2: 0.5 Ancients</span>
                <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
              </a>
            </div>

            <div>
              <h1 className="text-2xl sm:text-4xl font-poppins font-bold text-white tracking-tight leading-tight">
                Mastering Self Reliance in Path of Exile
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed mt-2">
                Exile SSF is engineered as an educational knowledge hub and portal for exiles across the entire <strong className="text-slate-200 font-semibold">Path of Exile series</strong>. Designed to demystify deep mechanics, streamline cooperative private leagues, and empower you with deterministic blueprints so every drop, craft, and endgame boss is earned through game mastery.
              </p>
            </div>

            {/* Quick Action Utility Bar */}
            {onNavigate && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={() => onNavigate('build_doctor')}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-xs flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Stethoscope className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Launch PoB Build Doctor</span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                </button>

                <button
                  onClick={() => onNavigate('private_league')}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white font-semibold text-xs flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  <span>3.30 Coven of Umbra GSF Hub</span>
                </button>

                <button
                  onClick={() => onNavigate('builds')}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white font-semibold text-xs flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>SSF Friendly Starters</span>
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
        
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/75 space-y-2 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">01 • Platform Scope</span>
            <Target className="w-4 h-4 text-slate-400" />
          </div>
          <h3 className="font-poppins font-bold text-sm text-white">What is this Platform?</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            A dedicated educational home and digital companion engineered for Solo Self Found and Private League players across the entire <strong className="text-slate-300">Path of Exile series</strong>. It consolidates verified vendor formulas, defensive masterclasses, progressive Atlas trees, and live community tools into a single cohesive utility.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/75 space-y-2 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">02 • Target Exiles</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <h3 className="font-poppins font-bold text-sm text-white">Who is it For?</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Built for beginners seeking to understand foundational mechanics, veteran SSF soloists, and friends playing in cooperative Group Self Found leagues across <strong className="text-slate-300">PoE 1 and PoE 2</strong>. Designed to help all players conquer the campaign, red maps, and pinnacle bosses without relying on trade bots.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/75 space-y-2 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">03 • Core Mission</span>
            <Award className="w-4 h-4 text-slate-400" />
          </div>
          <h3 className="font-poppins font-bold text-sm text-white">What are our Goals?</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            To gather and teach game knowledge in plain English, eliminate the confusion of juggling dozens of browser tabs, provide foolproof progression roadmaps, and support cooperative Private League play with shared wishlists, drop matching, and role specialization.
          </p>
        </div>
      </div>

      {/* Quick Navigation Utility Grid */}
      {onNavigate && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => onNavigate('atlas')}
            className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-800/60 text-left transition-colors cursor-pointer"
          >
            <Compass className="w-4 h-4 text-indigo-400 mb-1.5" />
            <div className="font-poppins font-bold text-xs text-slate-100">Atlas & Mapping</div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">Progression trees & strats</div>
          </button>

          <button
            onClick={() => onNavigate('build_doctor')}
            className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-800/60 text-left transition-colors cursor-pointer"
          >
            <Stethoscope className="w-4 h-4 text-emerald-400 mb-1.5" />
            <div className="font-poppins font-bold text-xs text-slate-100">Build Doctor</div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">PoB imports & upgrades</div>
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
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">Verified formulas & recipes</div>
          </button>
        </div>
      )}

      {/* Manifesto Section */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 space-y-5">
        <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Philosophy & Manifesto</span>
            <h2 className="text-base sm:text-lg font-poppins font-bold text-white mt-0.5">
              Why Play Solo Self Found & Private Leagues?
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
              <h4 className="font-semibold text-xs text-slate-100">Escape Trade Burnout & Market Inflation</h4>
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
              <h4 className="font-semibold text-xs text-slate-100">Meaningful Drops & True Crafting</h4>
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
              <h4 className="font-semibold text-xs text-slate-100">Private League Synergy & Barter</h4>
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
