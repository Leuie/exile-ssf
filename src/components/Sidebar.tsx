import React, { useState } from 'react';
import { 
  MessageSquarePlus,
  Flame, 
  BookOpen, 
  Compass, 
  CheckSquare, 
  Users, Search, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Menu, 
  X, 
  Link, 
  Database,
  TrendingUp,
  Heart,
  Crown,
  ShieldCheck,
  Swords,
  Scroll,
  ExternalLink,
  Home as HomeIcon,
  Stethoscope,
  UserCheck,
  Globe
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedGame: 'poe1' | 'poe2';
  setSelectedGame: (game: 'poe1' | 'poe2') => void;
openSearch: () => void;
  trackerStats: { completed: number; total: number };
  userAccount?: import('../types').UserAccount | null;
  onOpenAuthModal?: () => void;
}

const LEAGUE_INFO = {
  poe1: {
    version: '3.30',
    name: 'Coven of Umbra',
    shortName: '3.30 Coven of Umbra',
    url: 'https://www.pathofexile.com/umbra',
    badgeBg: 'bg-gradient-to-r from-indigo-500/20 via-purple-500/15 to-amber-500/15',
    badgeBorder: 'border-indigo-500/40 hover:border-indigo-400 hover:from-indigo-500/30 hover:to-purple-500/30',
    textMain: 'text-indigo-600 dark:text-indigo-300 group-hover:text-indigo-500 dark:group-hover:text-indigo-200',
    iconColor: 'text-indigo-500/70 group-hover:text-indigo-400',
    mobilePillBg: 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border-indigo-500/40 text-indigo-700 dark:text-indigo-300 hover:border-indigo-400',
    collapsedBg: 'bg-indigo-500/15 border-indigo-500/40 hover:border-indigo-400 hover:bg-indigo-500/25 text-indigo-600 dark:text-indigo-300'
  },
  poe2: {
    version: '0.5',
    name: 'Return of the Ancients',
    shortName: '0.5 Ancients',
    url: 'https://pathofexile2.com/ancients',
    badgeBg: 'bg-gradient-to-r from-cyan-500/20 via-sky-500/15 to-indigo-500/15',
    badgeBorder: 'border-cyan-500/40 hover:border-cyan-400 hover:from-cyan-500/30 hover:to-sky-500/30',
    textMain: 'text-cyan-600 dark:text-cyan-300 group-hover:text-cyan-500 dark:group-hover:text-cyan-200',
    iconColor: 'text-cyan-500/70 group-hover:text-cyan-400',
    mobilePillBg: 'bg-gradient-to-r from-cyan-500/20 to-sky-500/20 border-cyan-500/40 text-cyan-700 dark:text-cyan-300 hover:border-cyan-400',
    collapsedBg: 'bg-cyan-500/15 border-cyan-500/40 hover:border-cyan-400 hover:bg-cyan-500/25 text-cyan-600 dark:text-cyan-300'
  }
};

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  selectedGame,
  setSelectedGame,
openSearch,
  trackerStats,
  userAccount,
  onOpenAuthModal
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);

  const currentLeague = LEAGUE_INFO[selectedGame];

  const progressPercent = trackerStats.total > 0 
    ? Math.round((trackerStats.completed / trackerStats.total) * 100) 
    : 0;

  interface NavItem {
  id: string;
  label: string;
  icon: any;
  badge?: string | null;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

  const poe1NavGroups: NavGroup[] = [
    {
      title: 'Command & League',
      items: [
        { id: 'home', label: 'Home Overview', icon: HomeIcon, badge: null },
        { id: 'private_league', label: '3.30 GSF League', icon: Users, badge: 'NEW' },
        { id: 'private_leagues', label: 'Private Leagues Hub', icon: Globe, badge: 'Hub' },
        { id: 'feedback', label: 'Feedback & Needs', icon: MessageSquarePlus, badge: 'New' }
      ]
    },
    {
      title: 'Builds & Ingestion',
      items: [
        { id: 'build_ingest', label: 'Ingest Guides', icon: Sparkles, badge: 'Import' },
        { id: 'builds', label: 'SSF Starters', icon: Flame, badge: 'Builds' },
        { id: 'build_doctor', label: 'PoB Build Doctor', icon: Stethoscope, badge: 'Doctor' }
      ]
    },
    {
      title: 'Progression & Maps',
      items: [
        { id: 'atlas', label: 'Atlas & Mapping', icon: Compass, badge: 'Atlas' },
        { id: 'campaign', label: 'Acts 1 to 10', icon: Compass, badge: 'Walkthru' },
        { id: 'tracker', label: 'Progression Checklist', icon: CheckSquare, badge: `${progressPercent}%` },
        { id: 'labyrinth', label: "Lord's Labyrinth", icon: Crown, badge: 'Ascend' }
      ]
    },
    {
      title: 'Mechanics & Recipes',
      items: [
        { id: 'vendor_recipes', label: 'Vendor Formulas', icon: Scroll, badge: 'Recipes' },
        { id: 'defenses', label: 'Defenses Masterclass', icon: ShieldCheck, badge: 'Guide' },
        { id: 'offenses', label: 'Offenses Masterclass', icon: Swords, badge: 'Guide' }
      ]
    },
    {
      title: 'External Databases',
      items: [
        { id: 'poewiki', label: 'PoE Wiki', icon: BookOpen, badge: 'Wiki' },
        { id: 'poedb', label: 'PoEDB', icon: Database, badge: 'DB' },
        { id: 'poe_ninja', label: 'PoE Ninja', icon: TrendingUp, badge: 'Meta' },
        { id: 'tools_directory', label: 'Tools Directory', icon: Link, badge: 'Library' }
      ]
    }
  ];

  const poe2NavGroups: NavGroup[] = [
    {
      title: 'Command & League',
      items: [
        { id: 'home', label: 'Home Overview', icon: HomeIcon, badge: null },
        { id: 'private_league', label: 'PoE 2 GSF League', icon: Users, badge: '0.5' },
        { id: 'private_leagues', label: 'Private Leagues Hub', icon: Globe, badge: 'Hub' },
        { id: 'poe2_hub', label: 'PoE 2 Hub & Roadmap', icon: Sparkles, badge: 'EA' },
        { id: 'feedback', label: 'Feedback & Needs', icon: MessageSquarePlus, badge: 'New' }
      ]
    },
    {
      title: 'Builds & Ingestion',
      items: [
        { id: 'build_ingest', label: 'Ingest Guides', icon: Sparkles, badge: 'Import' }
      ]
    },
    {
      title: 'External Databases',
      items: [
        { id: 'poe2_wiki', label: 'PoE 2 Wiki', icon: BookOpen, badge: 'Wiki' },
        { id: 'poe2_db', label: 'PoE 2 DB', icon: Database, badge: 'DB' },
        { id: 'tools_directory', label: 'Tools Directory', icon: Link, badge: 'Library' }
      ]
    }
  ];

  const currentNavGroups = selectedGame === 'poe1' ? poe1NavGroups : poe2NavGroups;

  const handleGameSwitch = (game: 'poe1' | 'poe2') => {
    setSelectedGame(game);
    if (activeTab !== 'home' && activeTab !== 'manifesto') {
      if (game === 'poe2') {
        setActiveTab('poe2_hub');
      } else {
        setActiveTab('home');
      }
    }
  };

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Top Navbar with Hamburger */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-2.5 bg-white dark:bg-[#0c1017] border-b border-slate-200 dark:border-slate-800 shadow-md backdrop-blur-md">
        <div 
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2.5 cursor-pointer"
        >
          <img 
            src="/logo.png" 
            alt="Exile SSF Logo" 
            className="w-8 h-8 object-contain rounded-lg shadow-sm border border-indigo-500/40" 
          />
          <span className="font-poppins font-bold text-base zorbble-wordmark-gradient tracking-wide">
            EXILE SSF
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Mobile Current League Badge */}
          <a
            href={currentLeague.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${currentLeague.mobilePillBg} text-[11px] font-bold shadow-sm transition-colors`}
            title={`Current League: ${currentLeague.version} ${currentLeague.name} (Click to view season page)`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{currentLeague.version}</span>
            <ExternalLink className={`w-3 h-3 ${currentLeague.iconColor}`} />
          </a>

          {/* Mobile Game Switcher */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-bold">
            <button
              onClick={() => handleGameSwitch('poe1')}
              className={`px-2.5 py-0.5 rounded-lg transition-all ${selectedGame === 'poe1' ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400'}`}
            >
              PoE 1
            </button>
            <button
              onClick={() => handleGameSwitch('poe2')}
              className={`px-2.5 py-0.5 rounded-lg transition-all ${selectedGame === 'poe2' ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400'}`}
            >
              PoE 2
            </button>
          </div>

          <button
            onClick={() => setActiveTab('about')}
            className={`p-1.5 rounded-xl border transition-colors ${activeTab === 'about' ? 'bg-rose-500/20 border-rose-500/50 text-rose-500' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}
            title="About Leuie"
          >
            <Heart className="w-4 h-4 fill-rose-500/30 text-rose-500" />
          </button>

          <button
            onClick={openSearch}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
          >
            <Search className="w-4 h-4 text-indigo-400" />
          </button>

          

          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
          >
            {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-md"
          onClick={() => setIsMobileOpen(false)}
        >
          <div 
            className="w-72 max-w-[80vw] h-full bg-white dark:bg-[#0c1017] border-r border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-between shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <img 
                    src="/logo.png" 
                    alt="Exile SSF Logo" 
                    className="w-8 h-8 object-contain rounded-lg shadow-sm border border-indigo-500/40" 
                  />
                  <span className="font-poppins font-bold text-sm zorbble-wordmark-gradient">
                    EXILE SSF
                  </span>
                </div>
                <button onClick={() => setIsMobileOpen(false)}>
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Mobile Game Switcher */}
              <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
                <button
                  onClick={() => handleGameSwitch('poe1')}
                  className={`py-1.5 rounded-lg transition-colors ${selectedGame === 'poe1' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500'}`}
                >
                  Path of Exile 1
                </button>
                <button
                  onClick={() => handleGameSwitch('poe2')}
                  className={`py-1.5 rounded-lg transition-colors ${selectedGame === 'poe2' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-500'}`}
                >
                  Path of Exile 2
                </button>
              </div>

              {/* Mobile Drawer Current League Link */}
              <a
                href={currentLeague.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center justify-between p-2.5 rounded-2xl ${currentLeague.badgeBg} border ${currentLeague.badgeBorder} text-xs shadow-sm transition-colors`}
                title={`Current League: ${currentLeague.version} ${currentLeague.name} (Click to open season page)`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <div>
                    <div className="text-[9px] uppercase font-mono font-bold text-slate-400">Current League</div>
                    <div className={`font-bold ${currentLeague.textMain}`}>{currentLeague.version} {currentLeague.name}</div>
                  </div>
                </div>
                <ExternalLink className={`w-3.5 h-3.5 ${currentLeague.iconColor}`} />
              </a>

              <nav className="space-y-2.5 overflow-y-auto max-h-[55vh] pr-1">
                {currentNavGroups.map((group, gIdx) => (
                  <div key={gIdx} className="space-y-0.5">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold px-2 pt-1 pb-0.5">
                      {group.title}
                    </div>
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleNavClick(item.id)}
                          className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            isActive
                              ? 'bg-slate-800 text-white font-semibold border border-slate-700 shadow-sm'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className="w-4 h-4 text-indigo-400" />
                            <span>{item.label}</span>
                          </div>
                          {item.badge && (
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                              item.badge === 'NEW'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                : 'bg-slate-800 text-slate-400'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={() => handleNavClick('about')}
                className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-1.5"
              >
                <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                <span>About</span>
              </button>

              
            </div>
          </div>
        </div>
      )}

      {/* Desktop Left Collapsible Sidebar with Floating Outer Collapse Button */}
      <aside 
        className={`hidden lg:flex flex-col justify-between sticky top-0 h-screen border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1017] transition-all duration-300 z-30 shadow-xl ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Floating Collapse Button Attached Directly to Outside Right Border */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3.5 top-6 z-40 w-7 h-7 rounded-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-400 hover:border-indigo-500 shadow-md flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>

        {/* Top Header & Logo */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
          
          {/* Logo & Title */}
          <div 
            onClick={() => setActiveTab('home')}
            className={`flex items-center cursor-pointer group overflow-hidden ${isCollapsed ? 'justify-center' : 'gap-3'}`}
            title="Exile SSF"
          >
            <img 
              src="/logo.png" 
              alt="Exile SSF Logo" 
              className="w-10 h-10 object-contain rounded-xl flex-shrink-0 shadow-lg shadow-indigo-500/20 border border-indigo-500/40 group-hover:scale-105 transition-transform" 
            />
            
            {!isCollapsed && (
              <div className="truncate">
                <div className="font-poppins font-bold text-sm tracking-wider zorbble-wordmark-gradient">
                  EXILE SSF
                </div>
                <div className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-sans truncate">
                  The SSF Compendium
                </div>
              </div>
            )}
          </div>

          {/* PoE 1 vs PoE 2 Game Directory Switcher */}
          {!isCollapsed ? (
            <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold">
              <button
                onClick={() => handleGameSwitch('poe1')}
                className={`py-1.5 rounded-xl transition-all ${
                  selectedGame === 'poe1'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                PoE 1
              </button>
              <button
                onClick={() => handleGameSwitch('poe2')}
                className={`py-1.5 rounded-xl transition-all ${
                  selectedGame === 'poe2'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                PoE 2
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={() => handleGameSwitch(selectedGame === 'poe1' ? 'poe2' : 'poe1')}
                className="px-2 py-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-black text-indigo-400 uppercase hover:border-indigo-500"
                title={`Switch to ${selectedGame === 'poe1' ? 'PoE 2' : 'PoE 1'}`}
              >
                {selectedGame === 'poe1' ? 'P1' : 'P2'}
              </button>
            </div>
          )}

          {/* Current League Badge / Banner */}
          {!isCollapsed ? (
            <a
              href={currentLeague.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`group flex items-center justify-between px-3 py-2 rounded-2xl ${currentLeague.badgeBg} border ${currentLeague.badgeBorder} transition-all shadow-sm cursor-pointer`}
              title={`Current League: ${currentLeague.version} ${currentLeague.name} (Click to open official season page)`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="relative flex h-2 w-2 flex-shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                </span>
                <div className="truncate">
                  <div className="text-[9px] uppercase font-mono font-bold tracking-widest text-slate-500 dark:text-slate-400">
                    Current League
                  </div>
                  <div className={`text-xs font-poppins font-bold ${currentLeague.textMain} transition-colors truncate`}>
                    {currentLeague.shortName}
                  </div>
                </div>
              </div>
              <ExternalLink className={`w-3.5 h-3.5 ${currentLeague.iconColor} group-hover:translate-x-0.5 transition-all flex-shrink-0`} />
            </a>
          ) : (
            <a
              href={currentLeague.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex flex-col items-center justify-center p-1.5 rounded-2xl border ${currentLeague.collapsedBg} transition-all shadow-sm`}
              title={`Current League: ${currentLeague.version} ${currentLeague.name} (Click to open official season page)`}
            >
              <span className="flex items-center gap-1 text-[8px] font-mono font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                LIVE
              </span>
              <span className="text-[11px] font-bold font-poppins mt-0.5">{currentLeague.version}</span>
            </a>
          )}

          {/* Quick Search Button in Sidebar */}
          <button
            onClick={openSearch}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/60 hover:text-indigo-600 dark:hover:text-indigo-300 transition-all text-xs shadow-inner ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
            title="Search Wiki & PoEDB (Ctrl+K)"
          >
            <Search className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            {!isCollapsed && (
              <>
                <span className="truncate flex-1 text-left font-medium">Quick Finder</span>
                <kbd className="px-1.5 py-0.5 text-[9px] bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-500 dark:text-slate-400 font-mono">
                  Ctrl K
                </kbd>
              </>
            )}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-2 space-y-2.5">
          {currentNavGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-0.5">
              {!isCollapsed ? (
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold px-2 pt-1 pb-0.5">
                  {group.title}
                </div>
              ) : gIdx > 0 ? (
                <div className="border-t border-slate-800 my-1 mx-2" />
              ) : null}

              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all group ${
                      isActive
                        ? 'bg-slate-800 text-white font-semibold border border-slate-700 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    } ${isCollapsed ? 'justify-center px-0' : 'justify-between'}`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </div>

                    {!isCollapsed && item.badge && (
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold flex-shrink-0 ${
                        item.badge === 'NEW'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : isActive 
                          ? 'bg-slate-700 text-slate-200' 
                          : 'bg-slate-800 text-slate-500 border border-slate-700/50'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Compact Footer Area: Progress Bar + Discrete Side by Side Action Buttons */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
          
          {/* Progress Bar (PoE 1 only, when expanded) */}
          {!isCollapsed && selectedGame === 'poe1' && (
            <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                <span>SSF Progress</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold font-mono">{progressPercent}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-[#0c1017] rounded-full h-1.5 overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* User Account Profile & Dynamic Tag Card */}
          {onOpenAuthModal && (
            !isCollapsed ? (
              <button
                onClick={onOpenAuthModal}
                className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
                title={userAccount ? `@${userAccount.displayName} (${userAccount.poeAccountName})` : 'Login'}
              >
                <div className="flex items-center gap-2 truncate">
                  <UserCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="truncate">{userAccount ? `@${userAccount.displayName}` : 'Login'}</span>
                </div>
                <span className="text-[10px] font-mono text-purple-400">
                  {userAccount ? userAccount.preferredContact.toUpperCase() : 'GSF'}
                </span>
              </button>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="w-full p-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 transition-colors cursor-pointer"
                title={userAccount ? `@${userAccount.displayName} (${userAccount.poeAccountName})` : 'Login'}
              >
                <UserCheck className="w-4 h-4 text-emerald-400" />
              </button>
            )
          )}

          {/* Compact Footer Action Row */}
          <div className="flex items-center gap-1.5">
            {/* Heart Icon Button */}
            <button
              onClick={() => setActiveTab('about')}
              className={`p-2 rounded-xl border transition-all flex items-center justify-center ${
                activeTab === 'about'
                  ? 'bg-rose-500 text-white border-rose-600 shadow-md shadow-rose-500/20'
                  : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-rose-500 hover:border-rose-500/40'
              } ${isCollapsed ? 'w-full' : 'w-10 flex-shrink-0'}`}
              title="About Leuie"
            >
              <Heart className={`w-3.5 h-3.5 ${activeTab === 'about' ? 'fill-white text-white' : 'fill-rose-500/40 text-rose-500'}`} />
            </button>

            
          </div>
        </div>
      </aside>
    </>
  );
};
