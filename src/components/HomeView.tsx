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
  FileSpreadsheet,
  MessageSquarePlus,
  Sparkles,
  Filter,
  ShieldAlert,
  Activity
} from 'lucide-react';
import { downloadStarterSheetTemplate } from '../utils/spreadsheetEngine';

interface HomeViewProps {
  onNavigate?: (tab: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  return (
    <div className="w-full space-y-6 pb-16 font-sans text-slate-200">
      {/* Sleek Universal Command Center Header Banner */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/85 p-6 sm:p-8 backdrop-blur-md shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-4 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/35 text-[11px] font-mono uppercase tracking-wider font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Solo Self Found Compendium &amp; Private League Platform
              </span>

              <a
                href="https://www.pathofexile.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/90 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-mono transition-colors"
                title="Path of Exile 1 Official Site"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>Path of Exile 1</span>
                <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
              </a>

              <a
                href="https://pathofexile2.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/90 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-mono transition-colors"
                title="Path of Exile 2 Official Site"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>Path of Exile 2</span>
                <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
              </a>
            </div>

            <div>
              <h1 className="text-2xl sm:text-4xl font-poppins font-bold text-white tracking-tight leading-tight">
                Mastering Self Reliance in Path of Exile
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed mt-2">
                Exile SSF is an open educational compendium and cloud synced Group Self Found private league platform for both{' '}
                <strong className="text-slate-200 font-semibold">Path of Exile 1 and Path of Exile 2</strong>. Built to demystify deep mechanics, replace scattered browser tabs, and give any solo player or private league community the tools to progress deterministically from league start to pinnacle endgame.
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
                  <span>Explore Private League Hub</span>
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
                  onClick={() => onNavigate('feedback')}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white font-semibold text-xs flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <MessageSquarePlus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Feedback &amp; Feature Requests</span>
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

      {/* 3 Core Pillars: Platform Scope, Target Exiles, Core Mission */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/75 space-y-2 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider font-bold">01 • Platform Scope</span>
            <Target className="w-4 h-4 text-indigo-400" />
          </div>
          <h3 className="font-poppins font-bold text-sm text-white">What is this Platform?</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            A dedicated educational home and second monitor utility engineered for Solo Self Found and Group Self Found players across both{' '}
            <strong className="text-slate-300">Path of Exile 1 and Path of Exile 2</strong>. It unites verified vendor formulas, defensive masterclasses, Atlas trees, and turnkey private league coordination in one place.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/75 space-y-2 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider font-bold">02 • Target Exiles</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <h3 className="font-poppins font-bold text-sm text-white">Who is it For?</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Built for newer exiles learning foundational mechanics, veteran SSF soloists, and friend groups or community hosts running cooperative Private Leagues of 10 to 60+ players without relying on trade bots or messy spreadsheets.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/75 space-y-2 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-bold">03 • Core Mission</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <h3 className="font-poppins font-bold text-sm text-white">What are our Goals?</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            To teach deep game knowledge in plain English, eliminate the friction of juggling dozens of tabs, and give any Path of Exile community a ready to use hub for shared wishlists, role specialization, and cross season progression.
          </p>
        </div>
      </div>

      {/* What Is the Private League Hub? (Universal Showcase for Any Host or Community) */}
      <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/25 via-slate-900/80 to-slate-900/80 p-5 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-bold">
              Turnkey Group Self Found Infrastructure
            </span>
            <h2 className="text-base sm:text-lg font-poppins font-bold text-white mt-0.5">
              What Is the Private League Hub?
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('private_league_hub')}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow"
              >
                <span>Open Private League Hub</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={downloadStarterSheetTemplate}
              className="px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
              title="Download Exile SSF Private League Starter Sheet.xlsx"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Download Starter Sheet</span>
            </button>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          The <strong className="text-white">Private League Hub</strong> is a shared headquarters designed so any group of friends or guild can organize, launch, and play a Group Self Found season in <strong className="text-white">PoE 1 or PoE 2</strong>. Hosts can launch a new league workspace in minutes, import signups straight from Google Sheets, sync official ladder levels automatically, and give every member a persistent cross game Exile Profile (<span className="font-mono text-indigo-300">/exile/handle</span>) that carries achievements and Honor Points across future seasons.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
            <div className="font-bold text-emerald-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Multi Character Wishlists</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Track wanted uniques, gems, bases, and fragments per character, share spare drops in the Free Stash Feed, and check drops instantly with Alt+D.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
            <div className="font-bold text-amber-300 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" />
              <span>Bounties, Rotas &amp; Vouches</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Post finder bounties, schedule 4 Voidstone or Uber Boss portal rotations, build verified carry vouches, and earn Honor Points for helping squadmates.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
            <div className="font-bold text-sky-300 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              <span>Live Feed &amp; Atlas Matrix</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              See who is farming Betrayal, Harvest, Essences, or Delve at a glance, copy 1 click swap whispers, and react to big drops on the live League Feed wall.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
            <div className="font-bold text-purple-300 flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Google Sheets &amp; Ladder Sync</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Export your entire league to a styled multi tab Google Sheets workbook, ingest signups by URL, and auto sync character levels and League Firsts.
            </p>
          </div>
        </div>
      </div>

      {/* Tools Built to Make SSF & GSF Easier */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6 space-y-4">
        <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold">
              Second Monitor Toolkit
            </span>
            <h2 className="text-base sm:text-lg font-poppins font-bold text-white mt-0.5">
              Tools That Make SSF &amp; GSF Effortless
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-500 hidden sm:inline-block">Works on Desktop, Second Monitor PWA &amp; Mobile</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/90 space-y-1.5">
            <div className="font-bold text-white flex items-center gap-2">
              <Filter className="w-4 h-4 text-emerald-400" />
              <span>Squad Loot Filter &amp; PoB Import</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Paste a Path of Building export code to import every required Unique, Cluster Jewel, and Gem straight to your wishlist, then export a valid PoE `.filter` block that highlights squad needs and bounties on the ground.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/90 space-y-1.5">
            <div className="font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>1 Click Safe Map Regex &amp; Scratchpad</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Check your build's brick mods once on your Exile Profile to copy safe T16/T17 stash search regexes in 1 click, alongside a character tagged Farming Session Scratchpad synced to the cloud.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/90 space-y-1.5">
            <div className="font-bold text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-400" />
              <span>Ctrl+C Drop Parser &amp; Compendium</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Press Ctrl+C on any item in Path of Exile and paste it into Drop Check (Alt+D), Wishlists, or Free Stash to auto parse mods and base types, backed by Atlas trees, Act walkthroughs, and vendor formulas.
            </p>
          </div>
        </div>

        {/* Quick Navigation Utility Grid */}
        {onNavigate && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <button
              onClick={() => onNavigate('atlas')}
              className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-800/60 text-left transition-colors cursor-pointer"
            >
              <Compass className="w-4 h-4 text-indigo-400 mb-1.5" />
              <div className="font-poppins font-bold text-xs text-slate-100">Atlas &amp; Mapping</div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">Progression trees &amp; strats</div>
            </button>

            <button
              onClick={() => onNavigate('builds')}
              className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-800/60 text-left transition-colors cursor-pointer"
            >
              <Flame className="w-4 h-4 text-amber-400 mb-1.5" />
              <div className="font-poppins font-bold text-xs text-slate-100">SSF Builds</div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">League starter blueprints</div>
            </button>

            <button
              onClick={() => onNavigate('vendor_recipes')}
              className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-800/60 text-left transition-colors cursor-pointer"
            >
              <Scroll className="w-4 h-4 text-purple-400 mb-1.5" />
              <div className="font-poppins font-bold text-xs text-slate-100">Vendor Recipes</div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">Verified formulas &amp; recipes</div>
            </button>

            <button
              onClick={() => onNavigate('tracker')}
              className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-800/60 text-left transition-colors cursor-pointer"
            >
              <Award className="w-4 h-4 text-emerald-400 mb-1.5" />
              <div className="font-poppins font-bold text-xs text-slate-100">Progression Checklist</div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">Acts to 4 Voidstones</div>
            </button>
          </div>
        )}
      </div>

      {/* Feedback, Player Needs & Community Roadmap */}
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/15 p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-3xl">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
            <MessageSquarePlus className="w-3.5 h-3.5" />
            <span>Community Driven Roadmap</span>
          </div>
          <h3 className="text-base font-poppins font-bold text-white">
            Have an Idea, Bug Report, or Tool Request?
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Exile SSF evolves directly from player and league host feedback across PoE 1 and PoE 2. Visit the{' '}
            <strong className="text-white">Feedback &amp; Needs</strong> board in the sidebar anytime to request new features, flag broken patch data, or upvote upcoming tools so we build what helps your sessions most.
          </p>
        </div>

        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate('feedback')}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow shrink-0 self-start md:self-center"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>Open Feedback &amp; Needs</span>
          </button>
        )}
      </div>

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
