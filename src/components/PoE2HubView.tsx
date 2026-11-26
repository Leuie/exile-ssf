import React from 'react';
import {
  Sparkles,
  Compass,
  ExternalLink,
  ShieldCheck,
  Flame,
  Zap,
  Gem,
  Layers,
  BookOpen,
  Database,
  Crown,
  Swords,
  Filter,
  Scroll,
  Package,
  ArrowRight,
  Users
} from 'lucide-react';

interface PoE2HubViewProps {
  onNavigate?: (tabId: string) => void;
}

export const PoE2HubView: React.FC<PoE2HubViewProps> = ({ onNavigate }) => {
  const poe2Modules = [
    {
      id: 'atlas',
      title: 'Endgame Atlas & Waystones',
      description: 'Track Waystone tiers (T1–T15+), 40/40 Atlas points, Citadel bosses, and Pinnacle progression.',
      icon: Compass,
      badge: 'Cloud Synced',
      accent: 'text-cyan-300 bg-cyan-500/15 border-cyan-500/35'
    },
    {
      id: 'campaign',
      title: 'Campaign Walkthrough (Acts 1–3)',
      description: 'Checklist for every permanent Spirit boss, +10% Resistance boss, Weapon Set skill book, and Bench unlock.',
      icon: Scroll,
      badge: 'Acts + Cruel',
      accent: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/35'
    },
    {
      id: 'labyrinth',
      title: 'Trials of Ascendancy',
      description: 'Track all 8 Ascendancy points across Trial of the Sekhemas (Honour Res) and Trial of Chaos (Ultimatum).',
      icon: Crown,
      badge: '0/8 Points',
      accent: 'text-amber-300 bg-amber-500/15 border-amber-500/35'
    },
    {
      id: 'defenses',
      title: 'Defenses Masterclass',
      description: 'PoE 2 10x Armour curve calculator, Evasion/Acrobatics, Grim Feast ES, Charm belts, and Waystone checklist.',
      icon: ShieldCheck,
      badge: 'Calculator',
      accent: 'text-sky-300 bg-sky-500/15 border-sky-500/35'
    },
    {
      id: 'offenses',
      title: 'Offenses Masterclass',
      description: 'PoE 2 Penetration 0% floor, Ignite/Poison/Bleed rules, Shock 20% baseline, and Freeze/Electrocute buildup.',
      icon: Swords,
      badge: 'Mechanics',
      accent: 'text-rose-300 bg-rose-500/15 border-rose-500/35'
    },
    {
      id: 'regex_studio',
      title: 'PoE 2 Regex Studio',
      description: 'Build safe Waystone, Salvage Bench, and vendor search regex strings tailored for PoE 2.',
      icon: Filter,
      badge: 'poe2.re',
      accent: 'text-purple-300 bg-purple-500/15 border-purple-500/35'
    },
    {
      id: 'vendor_recipes',
      title: 'Salvage & Reforging Formulas',
      description: 'Artificer Shards, Quality salvage, Regal disenchanting, and 3-to-1 Reforging Bench recipes.',
      icon: Gem,
      badge: 'Salvage',
      accent: 'text-amber-300 bg-amber-500/15 border-amber-500/35'
    },
    {
      id: 'builds',
      title: 'Builds Hub & Private Leagues',
      description: 'Browse PoE 2 SSF starter builds, community guides, and GSF private league rosters.',
      icon: Users,
      badge: '0.5 Meta',
      accent: 'text-indigo-300 bg-indigo-500/15 border-indigo-500/35'
    },
    {
      id: 'asset_tracker',
      title: 'Asset & Map Trackers',
      description: 'Track PoE 2 farming sessions, Waystone runs, and currency valuation across your league.',
      icon: Package,
      badge: 'Tracking',
      accent: 'text-teal-300 bg-teal-500/15 border-teal-500/35'
    }
  ];

  const poe2Resources = [
    {
      title: 'Current League: 0.5 Return of the Ancients',
      description: 'Official season page for Path of Exile 2: Return of the Ancients.',
      url: 'https://pathofexile2.com/ancients',
      icon: Sparkles,
      tag: 'Season 0.5'
    },
    {
      title: 'PoE 2 Wiki',
      description: 'Community wiki tracking confirmed PoE 2 mechanics, skills, bosses, and permanent quest bonuses.',
      url: 'https://www.poe2wiki.net/',
      icon: BookOpen,
      tag: 'Wiki'
    },
    {
      title: 'PoE 2 DB',
      description: 'Datamined base items, skill gems, Waystone modifiers, and monster stats for PoE 2.',
      url: 'https://poe2db.tw/us/',
      icon: Database,
      tag: 'Database'
    },
    {
      title: 'PoE 2 Ninja',
      description: 'Live PoE 2 build snapshots, Ascendancy breakdown, and economy pricing trends.',
      url: 'https://poe2.ninja/',
      icon: Flame,
      tag: 'Meta'
    }
  ];

  const coreMechanics = [
    {
      title: 'Uncut Skill Gems & Built-In Sockets',
      description: 'Skill gems hold their own 5–6 support sockets via Lesser/Greater/Perfect Jeweller Orbs—no more Fusings on body armours.',
      icon: Gem,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30'
    },
    {
      title: 'Dual-Spec Weapon Set Passive Trees',
      description: 'Allocate up to 24 Weapon Set Skill Points that automatically swap between your two equipped weapon sets.',
      icon: Layers,
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/30'
    },
    {
      title: 'Spirit Reservation System',
      description: 'Persistent buffs, heralds, and minions reserve Spirit (100 from Campaign bosses + Sceptre/Body/Amulet rolls) instead of Mana.',
      icon: Zap,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30'
    },
    {
      title: 'Gold Respecs & Gambler Vendors',
      description: 'Spend Gold in town for instant passive respecs at The Hooded One or gamble targeted bases in SSF.',
      icon: ShieldCheck,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
    },
    {
      title: 'WASD & Dodge Roll Discipline',
      description: 'Built-in Dodge Roll avoids hits and projectiles; pair with Charm Belts (Freeze/Stun/Bleed) for boss survivability.',
      icon: Flame,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/30'
    },
    {
      title: 'Socketed Runes & Soul Cores',
      description: 'Patch Elemental & Chaos resistance holes freely using Artificer Orbs + Iron/Elemental Runes and Ultimatum Soul Cores.',
      icon: Compass,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
    }
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-cyan-500/30 bg-gradient-to-br from-cyan-950/35 via-[#101625] to-slate-950 p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/35 text-cyan-300 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>PoE 2 SSF Command Center</span>
            </div>
            <a
              href="https://pathofexile2.com/ancients"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold hover:bg-emerald-500/25 transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Current League: 0.5 Return of the Ancients</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <h1 className="text-3xl sm:text-5xl font-cinzel font-black text-slate-100 tracking-wide leading-tight">
            Path of Exile 2{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-purple-400">
              SSF Compendium
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
            Full feature parity for <strong>Path of Exile 2</strong>: Cloud-synced Campaign &amp; Permanent Bonus checklist, Trials of Ascendancy tracker, Endgame Atlas &amp; Waystones progression, PoE 2 Defense/Offense math, Salvage formulas, and Regex Studio.
          </p>
        </div>
      </div>

      {/* Interactive PoE 2 Modules Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-cinzel font-bold text-slate-100 flex items-center gap-2">
          <Compass className="w-5 h-5 text-cyan-400" />
          <span>PoE 2 Tools &amp; Progression Suite</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {poe2Modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => onNavigate?.(mod.id)}
                className="text-left p-5 rounded-2xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800/70 hover:border-cyan-500/50 transition-all group flex flex-col justify-between gap-3 shadow-sm cursor-pointer"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className={`p-2 rounded-xl border ${mod.accent}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-mono bg-slate-950 text-cyan-300 border border-slate-700 font-bold">
                      {mod.badge}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-100 group-hover:text-cyan-300 transition-colors text-base">
                    {mod.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{mod.description}</p>
                </div>

                <div className="pt-2 border-t border-slate-800/70 flex items-center justify-between text-xs text-slate-400 group-hover:text-cyan-300">
                  <span className="font-mono text-[11px]">Open Tool</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* External PoE 2 Resource Portals */}
      <div className="space-y-4">
        <h2 className="text-xl font-cinzel font-bold text-slate-100 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-cyan-400" />
          <span>PoE 2 External Portals</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {poe2Resources.map((res, idx) => {
            const Icon = res.icon;
            return (
              <a
                key={idx}
                href={res.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-2xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800/60 hover:border-cyan-500/50 transition-all group flex flex-col justify-between gap-3 shadow-sm"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-cyan-400">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-bold">
                      {res.tag}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-100 group-hover:text-cyan-300 transition-colors text-sm">
                    {res.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{res.description}</p>
                </div>
                <div className="pt-2 border-t border-slate-800/50 flex items-center justify-between text-xs text-slate-500 group-hover:text-cyan-300">
                  <span className="text-[11px] font-mono">Open Resource</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </div>
              </a>
            );
          })}
        </div>
      </div>

      {/* Core PoE 2 SSF Systems Breakdown */}
      <div className="space-y-4">
        <h2 className="text-xl font-cinzel font-bold text-slate-100 flex items-center gap-2">
          <Gem className="w-5 h-5 text-amber-400" />
          <span>Core PoE 2 SSF Mechanics</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {coreMechanics.map((mech, idx) => {
            const Icon = mech.icon;
            return (
              <div
                key={idx}
                className="p-5 rounded-2xl border border-slate-800 bg-slate-900/75 space-y-2.5 shadow-sm"
              >
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${mech.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-100 text-sm">{mech.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{mech.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
