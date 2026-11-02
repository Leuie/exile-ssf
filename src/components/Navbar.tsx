import React from 'react';
import { 
  Flame, 
  BookOpen, 
  Compass, 
  CheckSquare, 
  Users, 
  Sun, 
  Moon, 
  Search, 
  ShieldCheck,
  Sparkles
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  openSearch: () => void;
  trackerStats: { completed: number; total: number };
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isDarkMode,
  setIsDarkMode,
  openSearch,
  trackerStats
}) => {
  const progressPercent = trackerStats.total > 0 
    ? Math.round((trackerStats.completed / trackerStats.total) * 100) 
    : 0;

  const navItems = [
    { id: 'home', label: 'Home', icon: Sparkles, badge: null },
    { id: 'atlas', label: 'Atlas & Mapping', icon: Compass, badge: 'Atlas' },
    { id: 'defenses', label: 'Defenses', icon: ShieldCheck, badge: 'Guide' },
    { id: 'builds', label: 'SSF Friendly Builds', icon: Flame, badge: 'Builds' },
    { id: 'campaign', label: 'Acts 1 to 10', icon: Compass, badge: 'Cheats' },
    { id: 'tracker', label: 'Progression Planner', icon: CheckSquare, badge: `${progressPercent}%` },
    { id: 'vendor_recipes', label: 'Vendor Recipes', icon: BookOpen, badge: 'Recipes' },
    { id: 'private_league', label: 'Private League Hub', icon: Users, badge: 'Coop' }
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-poe-border bg-poe-darker/95 dark:bg-[#0c0e14]/95 backdrop-blur supports-[backdrop-filter]:bg-poe-darker/80 transition-colors duration-200 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Title */}
          <div 
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6 text-slate-950 font-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-poe font-bold text-lg tracking-wider text-amber-400 group-hover:text-amber-300 transition-colors">
                  EXILE SSF
                </span>
                <span className="text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  SSF & Private League
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans hidden sm:block">
                Solo Self Found Knowledge, Progression & Coop Hub
              </p>
            </div>
          </div>

          {/* Action Bar (Search & Theme Toggle) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Search Button */}
            <button
              onClick={openSearch}
              className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg bg-poe-dark dark:bg-slate-900/90 text-slate-300 border border-poe-border hover:border-amber-500/50 hover:text-amber-300 transition-all shadow-inner"
              title="Search Wiki & PoEDB (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Quick Finder / Dual Links</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-slate-800 border border-slate-700 rounded text-slate-400">
                Ctrl K
              </kbd>
            </button>

            {/* Dark / Light Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-lg bg-poe-dark dark:bg-slate-900 text-slate-300 border border-poe-border hover:border-amber-500/50 hover:text-amber-300 transition-all"
              title={isDarkMode ? "Switch to Bright Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-500" />
              )}
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto pb-2 pt-1 no-scrollbar border-t border-poe-border/40">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/40 shadow-sm shadow-amber-500/10 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    isActive 
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' 
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
