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
  AlertCircle,
  BookOpen,
  Database
} from 'lucide-react';

export const PoE2HubView: React.FC = () => {
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
      description: 'The official community wiki tracking confirmed PoE 2 mechanics, skills, and areas.',
      url: 'https://www.poe2wiki.net/',
      icon: BookOpen,
      tag: 'Wiki'
    },
    {
      title: 'PoE 2 DB',
      description: 'Datamined base items, skill gems, attribute scaling, and monster modifiers for PoE 2.',
      url: 'https://poe2db.tw/us/',
      icon: Database,
      tag: 'Database'
    },
    {
      title: 'Official Path of Exile 2 Portal',
      description: 'Grinding Gear Games official trailers, class reveals, and announcements.',
      url: 'https://pathofexile2.com',
      icon: Sparkles,
      tag: 'Official'
    }
  ];

  const upcomingMechanics = [
    {
      title: 'Uncut Skill Gems & Built In Sockets',
      description: 'Skill gems now hold their own 5 to 6 support sockets! You will no longer need to spend thousands of Fusings on body armours in SSF.',
      icon: Gem,
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/30'
    },
    {
      title: 'Dual Spec Weapon Passive Trees',
      description: 'Allocate dedicated passive skill points that automatically switch when you cast spells with a staff vs attack with daggers.',
      icon: Layers,
      color: 'text-sky-500 bg-sky-500/10 border-sky-500/30'
    },
    {
      title: 'Spirit Reservation System',
      description: 'Auras, heralds, and permanent minions now reserve "Spirit" (100 base) rather than choking your mana pool.',
      icon: Zap,
      color: 'text-purple-500 bg-purple-500/10 border-purple-500/30'
    },
    {
      title: 'Gold Respecs & Vendor Economics',
      description: 'Gold dropped by monsters can be used for instant, affordable passive tree respecs in town without needing Orbs of Regret.',
      icon: ShieldCheck,
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30'
    },
    {
      title: 'WASD & Responsive Dodge Rolling',
      description: 'Every class has a built in dodge roll with invulnerability frames, opening up skill based evasion for pinnacle bosses.',
      icon: Flame,
      color: 'text-rose-500 bg-rose-500/10 border-rose-500/30'
    },
    {
      title: '36 New Ascendancy Classes',
      description: '12 base classes with 3 brand new Ascendancies each (e.g. Invoker, Stormweaver, Chronomancer, Titan, Warbringer).',
      icon: Compass,
      color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/30'
    }
  ];

  return (
    <div className="space-y-10 max-w-5xl mx-auto pb-16">
      
      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 via-slate-100 to-white dark:from-cyan-950/20 dark:via-[#131622] dark:to-poe-darkest p-8 sm:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 text-xs font-semibold uppercase tracking-wider">
              <AlertCircle className="w-3.5 h-3.5" />
              PoE 2 Hub • Work in Progress
            </div>
            <a
              href="https://pathofexile2.com/ancients"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-800 dark:text-cyan-300 text-xs font-bold hover:bg-cyan-500/30 transition-colors shadow-sm"
              title="Current League: 0.5 Return of the Ancients (Click to open official season page)"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Current League: 0.5 Ancients</span>
              <ExternalLink className="w-3 h-3 text-cyan-500" />
            </a>
          </div>

          <h1 className="text-3xl sm:text-5xl font-poe font-black text-slate-900 dark:text-slate-100 tracking-wide leading-tight">
            Path of Exile 2 <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-sky-500 to-purple-600 dark:from-cyan-400 dark:via-sky-300 dark:to-purple-400">
              Solo Self Found Roadmap
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 max-w-3xl leading-relaxed">
            We are preparing a dedicated standalone knowledge base, vendor math tools, campaign walkthroughs, and build guides tailored specifically for <strong>Path of Exile 2</strong>.
          </p>
        </div>
      </div>

      {/* Early PoE 2 Resource Portals */}
      <div className="space-y-4">
        <h2 className="text-xl font-poe font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          PoE 2 Resource Portals
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {poe2Resources.map((res, idx) => {
            const Icon = res.icon;
            return (
              <a
                key={idx}
                href={res.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:border-cyan-500/50 transition-all group flex flex-col justify-between space-y-3 shadow-sm"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-[#0f172a] border border-slate-800 text-cyan-600 dark:text-cyan-400">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-mono bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 font-bold">
                      {res.tag}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors text-base">
                    {res.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {res.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/40 flex items-center justify-between text-xs text-slate-500 group-hover:text-cyan-600 dark:group-hover:text-cyan-400">
                  <span className="text-[11px] font-mono">Open Resource</span>
                  <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </a>
            );
          })}
        </div>
      </div>

      {/* Core PoE 2 SSF Systems Breakdown */}
      <div className="space-y-4">
        <h2 className="text-xl font-poe font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Compass className="w-5 h-5 text-amber-500 dark:text-amber-400" />
          Confirmed PoE 2 Mechanics & SSF Impact
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {upcomingMechanics.map((mech, idx) => {
            const Icon = mech.icon;
            return (
              <div
                key={idx}
                className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80/60 space-y-2.5 shadow-sm"
              >
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${mech.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {mech.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {mech.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Beta Notice Banner */}
      <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-500/40 text-center space-y-2">
        <div className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-widest">
          Stay Tuned for Full Launch
        </div>
        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 max-w-2xl mx-auto">
          As soon as Path of Exile 2 launches in Early Access, we will deploy full Acts walkthroughs, vendor recipes, and vetted starter build guides right here!
        </p>
      </div>

    </div>
  );
};
