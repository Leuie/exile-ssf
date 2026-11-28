import React, { useState, useEffect } from 'react';
import { 
  MessageSquarePlus,
  Flame, 
  BookOpen, 
  Compass, 
  Users, Search, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
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
  Filter,
  Package,
  Home as HomeIcon,
  UserCheck,
  Clock,
  Sliders,
  Download,
  WifiOff
} from "lucide-react";
import { readActiveCharacter, type ActiveCharacterContext } from '../utils/activeCharacter';
import { InboxBellDrawer } from './ui/InboxBellDrawer';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedGame: 'poe1' | 'poe2';
  setSelectedGame: (game: 'poe1' | 'poe2') => void;
  openSearch: () => void;
  openToolSetup?: () => void;
  userAccount?: import('../types').UserAccount | null;
  onOpenAuthModal?: () => void;
  onOpenProfile?: (handle: string) => void;
  onPrefetchTab?: (tabId: string) => void;
}

const LEAGUE_INFO = {
  poe1: {
    version: '3.30',
    name: 'Covens of Umbra',
    shortName: '3.30 Covens of Umbra',
    url: 'https://www.pathofexile.com/covens',
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
  openToolSetup,
  userAccount,
  onOpenAuthModal,
  onOpenProfile,
  onPrefetchTab
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1280;
    }
    return false;
  });
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const [clockNow, setClockNow] = useState<Date>(() => new Date());
  const [activeChar, setActiveChar] = useState<ActiveCharacterContext | null>(() => readActiveCharacter());

  useEffect(() => {
    const onCharUpdate = () => setActiveChar(readActiveCharacter());
    window.addEventListener('exile-active-character-updated', onCharUpdate);
    return () => window.removeEventListener('exile-active-character-updated', onCharUpdate);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setClockNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const formatZoneClock = (date: Date, timeZone?: string) => {
    try {
      const timeStr = new Intl.DateTimeFormat('en-US', {
        ...(timeZone ? { timeZone } : {}),
        hour: 'numeric',
        minute: '2-digit'
      }).format(date);
      const parts = new Intl.DateTimeFormat('en-US', {
        ...(timeZone ? { timeZone } : {}),
        timeZoneName: 'short'
      }).formatToParts(date);
      const rawTzAbbr = parts.find((p) => p.type === 'timeZoneName')?.value || (timeZone ? 'NZT' : 'LOCAL');
      const tzAbbr =
        timeZone === 'Pacific/Auckland'
          ? rawTzAbbr === 'GMT+13'
            ? 'NZDT'
            : rawTzAbbr === 'GMT+12'
            ? 'NZST'
            : rawTzAbbr
          : rawTzAbbr;
      return { timeStr, tzAbbr };
    } catch {
      return { timeStr: date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }), tzAbbr: timeZone ? 'NZT' : 'LOCAL' };
    }
  };

  const gggClock = formatZoneClock(clockNow, 'Pacific/Auckland');
  const localClock = formatZoneClock(clockNow);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({
    'Progression & Maps': true,
    'Mechanics & Formulas': true,
    'External Databases': true
  });

  const toggleSidebarGroup = (title: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const currentLeague = LEAGUE_INFO[selectedGame];

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
        { id: 'private_league_hub', label: 'Private League Hub', icon: Users, badge: 'NEW' },
        { id: 'patch_notes', label: 'Patch Notes', icon: Scroll, badge: 'Live' },
        { id: 'feedback', label: 'Changelog & Feedback', icon: MessageSquarePlus, badge: 'New' }
      ]
    },
    {
      title: 'Tools',
      items: [
        { id: 'asset_tracker', label: 'Asset Tracker', icon: Package, badge: 'NEW' },
        { id: 'builds', label: 'Builds Hub', icon: Flame, badge: 'All' },
        { id: 'armory', label: 'Character Armory', icon: Swords, badge: 'NEW' },
        { id: 'map_tracker', label: 'Map Tracker', icon: Compass, badge: 'NEW' },
        { id: 'tool_setup', label: 'Tool Setup', icon: Sliders, badge: 'Sync' }
      ]
    },
    {
      title: 'Progression & Maps',
      items: [
        { id: 'atlas', label: 'Atlas & Mapping', icon: Compass, badge: 'Atlas' },
        { id: 'campaign', label: 'Acts 1 to 10', icon: Compass, badge: 'Walkthru' },
        { id: 'labyrinth', label: "Lord's Labyrinth", icon: Crown, badge: 'Ascend' }
      ]
    },
    {
      title: 'Mechanics & Formulas',
      items: [
        { id: 'crafting_bench', label: 'Crafting Bench & Stash', icon: Compass, badge: 'Guide' },
        { id: 'defenses', label: 'Defenses Masterclass', icon: ShieldCheck, badge: 'Guide' },
        { id: 'cheat_sheets', label: 'Mechanic Cheat Sheets', icon: Scroll, badge: '3.30' },
        { id: 'offenses', label: 'Offenses Masterclass', icon: Swords, badge: 'Guide' },
        { id: 'regex_studio', label: 'Regex Studio', icon: Filter, badge: 'poe.re' },
        { id: 'vendor_recipes', label: 'Vendor Formulas', icon: Scroll, badge: 'Recipes' }
      ]
    },
    {
      title: 'External Databases',
      items: [
        { id: 'poewiki', label: 'PoE Wiki', icon: BookOpen, badge: 'Wiki' },
        { id: 'poedb', label: 'PoEDB', icon: Database, badge: 'DB' },
        { id: 'poe_ninja', label: 'PoE Ninja', icon: TrendingUp, badge: 'Meta' },
        { id: 'sabrewulf', label: 'Sabrewulf Bench', icon: Compass, badge: 'Bench' },
        { id: 'tools_directory', label: 'Tools Directory', icon: Link, badge: 'Library' }
      ]
    }
  ];

  const poe2NavGroups: NavGroup[] = [
    {
      title: 'Command & League',
      items: [
        { id: 'home', label: 'Home Overview', icon: HomeIcon, badge: null },
        { id: 'private_league_hub', label: 'Private League Hub', icon: Users, badge: 'NEW' },
        { id: 'patch_notes', label: 'Patch Notes', icon: Scroll, badge: 'Live' },
        { id: 'poe2_hub', label: 'PoE 2 Hub & Roadmap', icon: Sparkles, badge: 'EA' },
        { id: 'feedback', label: 'Changelog & Feedback', icon: MessageSquarePlus, badge: 'New' }
      ]
    },
    {
      title: 'Tools',
      items: [
        { id: 'asset_tracker', label: 'Asset Tracker', icon: Package, badge: 'NEW' },
        { id: 'builds', label: 'Builds Hub', icon: Flame, badge: 'All' },
        { id: 'armory', label: 'Character Armory', icon: Swords, badge: 'NEW' },
        { id: 'map_tracker', label: 'Map Tracker', icon: Compass, badge: 'NEW' },
        { id: 'tool_setup', label: 'Tool Setup', icon: Sliders, badge: 'Sync' }
      ]
    },
    {
      title: 'Progression & Maps',
      items: [
        { id: 'atlas', label: 'Atlas & Waystones', icon: Compass, badge: 'Endgame' },
        { id: 'campaign', label: 'Campaign (Acts 1–3)', icon: Compass, badge: 'Bonuses' },
        { id: 'labyrinth', label: 'Trials of Ascendancy', icon: Crown, badge: 'Ascend' }
      ]
    },
    {
      title: 'Mechanics & Formulas',
      items: [
        { id: 'crafting_bench', label: 'Crafting Bench & Stash', icon: Compass, badge: 'Guide' },
        { id: 'defenses', label: 'Defenses Masterclass', icon: ShieldCheck, badge: 'Guide' },
        { id: 'cheat_sheets', label: 'Mechanic Cheat Sheets', icon: Scroll, badge: 'Guide' },
        { id: 'offenses', label: 'Offenses Masterclass', icon: Swords, badge: 'Guide' },
        { id: 'regex_studio', label: 'Regex Studio', icon: Filter, badge: 'poe2.re' },
        { id: 'vendor_recipes', label: 'Vendor Formulas', icon: Scroll, badge: 'Salvage' }
      ]
    },
    {
      title: 'External Databases',
      items: [
        { id: 'poe2_wiki', label: 'PoE 2 Wiki', icon: BookOpen, badge: 'Wiki' },
        { id: 'poe2_db', label: 'PoE 2 DB', icon: Database, badge: 'DB' },
        { id: 'poe_ninja', label: 'PoE 2 Ninja', icon: TrendingUp, badge: 'Meta' },
        { id: 'tools_directory', label: 'Tools Directory', icon: Link, badge: 'Library' }
      ]
    }
  ];

  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);
  const [isOffline, setIsOffline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
    };
    const onInstalled = () => setDeferredInstallPrompt(null);
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const handleInstallPwa = async () => {
    if (!deferredInstallPrompt) return;
    try {
      await deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
    } catch {}
    setDeferredInstallPrompt(null);
  };

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
    if (id === 'tool_setup') {
      openToolSetup?.();
      setIsMobileOpen(false);
      return;
    }
    setActiveTab(id);
    setIsMobileOpen(false);
  };

  useEffect(() => {
    if (!isMobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileOpen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [isMobileOpen]);

  return (
    <>
      {/* Mobile & Tablet Top Navbar with Safe-Area Padding */}
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between gap-2 pb-2.5 pt-[max(0.625rem,env(safe-area-inset-top,0px))] pl-[max(0.75rem,env(safe-area-inset-left,0px))] pr-[max(0.75rem,env(safe-area-inset-right,0px))] bg-white/95 dark:bg-[#0c1017]/95 border-b border-slate-200 dark:border-slate-800 shadow-md backdrop-blur-md">
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2 cursor-pointer min-w-0 text-left"
          aria-label="Go to Exile SSF Home"
        >
          <img
            src="/logo.png"
            alt="Exile SSF Logo"
            className="w-8 h-8 object-contain rounded-lg shadow-sm border border-indigo-500/40 shrink-0"
          />
          <span className="font-poppins font-bold text-sm sm:text-base zorbble-wordmark-gradient tracking-wide truncate">
            EXILE SSF
          </span>
        </button>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Mobile Current League Badge */}
          <a
            href={currentLeague.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`hidden xs:inline-flex sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${currentLeague.mobilePillBg} text-[11px] font-bold shadow-sm transition-colors`}
            title={`Current League: ${currentLeague.version} ${currentLeague.name}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
            <span>{currentLeague.version}</span>
            <ExternalLink className={`w-3 h-3 ${currentLeague.iconColor}`} aria-hidden="true" />
          </a>

          {/* Mobile Game Switcher */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => handleGameSwitch('poe1')}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${selectedGame === 'poe1' ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400'}`}
            >
              PoE 1
            </button>
            <button
              type="button"
              onClick={() => handleGameSwitch('poe2')}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${selectedGame === 'poe2' ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400'}`}
            >
              PoE 2
            </button>
          </div>

          <InboxBellDrawer userAccount={userAccount ?? null} compact />

          <button
            type="button"
            onClick={openSearch}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center cursor-pointer"
            aria-label="Open Quick Finder search"
          >
            <Search className="w-4 h-4 text-indigo-400" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center cursor-pointer"
            aria-label={isMobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMobileOpen}
          >
            {isMobileOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-md"
          onClick={() => setIsMobileOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation Menu"
        >
          <div
            className="w-80 max-w-[86vw] h-[100dvh] bg-white dark:bg-[#0c1017] border-r border-slate-200 dark:border-slate-800 px-4 pt-[max(1rem,env(safe-area-inset-top,0px))] pb-[max(1rem,env(safe-area-inset-bottom,0px))] flex flex-col gap-3 shadow-2xl overscroll-contain"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
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
              <button
                type="button"
                onClick={() => setIsMobileOpen(false)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Mobile Game Switcher */}
            <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold shrink-0">
              <button
                type="button"
                onClick={() => handleGameSwitch('poe1')}
                className={`py-2 rounded-lg transition-colors cursor-pointer ${selectedGame === 'poe1' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500'}`}
              >
                Path of Exile 1
              </button>
              <button
                type="button"
                onClick={() => handleGameSwitch('poe2')}
                className={`py-2 rounded-lg transition-colors cursor-pointer ${selectedGame === 'poe2' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-500'}`}
              >
                Path of Exile 2
              </button>
            </div>

            {/* Mobile Drawer Current League Link */}
            <a
              href={currentLeague.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-between p-2.5 rounded-2xl ${currentLeague.badgeBg} border ${currentLeague.badgeBorder} text-xs shadow-sm transition-colors shrink-0`}
              title={`Current League: ${currentLeague.version} ${currentLeague.name}`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
                <div>
                  <div className="text-[9px] uppercase font-mono font-bold text-slate-400">Current League</div>
                  <div className={`font-bold ${currentLeague.textMain}`}>{currentLeague.version} {currentLeague.name}</div>
                </div>
              </div>
              <ExternalLink className={`w-3.5 h-3.5 ${currentLeague.iconColor}`} aria-hidden="true" />
            </a>

            <nav className="flex-1 min-h-0 space-y-2.5 overflow-y-auto overscroll-contain pr-1">
              {currentNavGroups.map((group, gIdx) => (
                <div key={gIdx} className="space-y-1">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold px-2 pt-1 pb-0.5">
                    {group.title}
                  </div>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => handleNavClick(item.id)}
                        aria-current={isActive ? 'page' : undefined}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                          isActive
                            ? 'bg-slate-800 text-white font-semibold border border-slate-700 shadow-sm'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="w-4 h-4 text-indigo-400 shrink-0" aria-hidden="true" />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
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

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2 shrink-0">
              {/* Mobile Account / Profile Action */}
              {userAccount ? (
                <button
                  type="button"
                  onClick={() => {
                    onOpenProfile?.(userAccount.displayName);
                    setIsMobileOpen(false);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-indigo-500/15 border border-indigo-500/35 text-indigo-200 text-xs font-bold flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-2 truncate">
                    <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
                    <span className="truncate">@{userAccount.displayName}</span>
                  </span>
                  <span className="text-[10px] font-mono text-indigo-300 uppercase">Profile</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onOpenAuthModal?.();
                    setIsMobileOpen(false);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" aria-hidden="true" />
                  <span>Sign In / Register</span>
                </button>
              )}

              {/* Mobile Dual Timezone Strip: GGG NZT & Local */}
              <div className="grid grid-cols-2 gap-1.5 p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-[10px] font-mono">
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase tracking-wider text-amber-400/90 font-bold">GGG ({gggClock.tzAbbr})</span>
                  <span className="text-slate-100 font-bold">{gggClock.timeStr}</span>
                </div>
                <div className="flex flex-col border-l border-slate-800 pl-2">
                  <span className="text-[9px] uppercase tracking-wider text-sky-400/90 font-bold">Local ({localClock.tzAbbr})</span>
                  <span className="text-slate-100 font-bold">{localClock.timeStr}</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleNavClick('about')}
                  className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Heart className="w-4 h-4 fill-rose-500 text-rose-500" aria-hidden="true" />
                  <span>About</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick('privacy')}
                  className="flex-1 py-2 px-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                  <span>Privacy Policy</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile & Tablet Thumb-Reachable Bottom Navigation Bar */}
      <nav
        aria-label="Primary Mobile Navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0c1017]/95 border-t border-slate-800/90 backdrop-blur-md shadow-[0_-8px_24px_rgba(0,0,0,0.45)] pb-[max(0.4rem,env(safe-area-inset-bottom,0px))] pl-[max(0.5rem,env(safe-area-inset-left,0px))] pr-[max(0.5rem,env(safe-area-inset-right,0px))] pt-1.5"
      >
        <div className="grid grid-cols-5 gap-1 max-w-xl mx-auto">
          {[
            { id: 'home', label: 'Home', icon: HomeIcon },
            { id: 'armory', label: 'Armory', icon: Swords },
            { id: 'asset_tracker', label: 'Assets', icon: Package },
            { id: 'map_tracker', label: 'Maps', icon: Compass },
            { id: 'private_league_hub', label: 'League', icon: Users }
          ].map((navItem) => {
            const NavIcon = navItem.icon;
            const isActive =
              activeTab === navItem.id ||
              (navItem.id === 'private_league_hub' &&
                (activeTab === 'single_league' || activeTab === 'private_league'));
            return (
              <button
                key={navItem.id}
                type="button"
                onClick={() => handleNavClick(navItem.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-xl text-[10px] font-semibold transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/35'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <NavIcon className={`w-4 h-4 ${isActive ? 'text-indigo-300' : 'text-slate-400'}`} aria-hidden="true" />
                <span className="truncate leading-none">{navItem.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Desktop Left Collapsible Sidebar */}
      <aside 
        className={`hidden lg:flex flex-col justify-between sticky top-0 h-[100dvh] border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1017] transition-all duration-300 z-40 shadow-xl shrink-0 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Top Header & Logo */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
          
          {/* Logo, Title & Integrated Collapse Toggle */}
          <div className={`flex items-center ${isCollapsed ? 'flex-col gap-2.5' : 'justify-between gap-2'}`}>
            <div 
              onClick={() => setActiveTab('home')}
              className={`flex items-center cursor-pointer group min-w-0 ${isCollapsed ? 'justify-center' : 'gap-2.5 flex-1'}`}
              title="Exile SSF"
            >
              <img 
                src="/logo.png" 
                alt="Exile SSF Logo" 
                className="w-9 h-9 object-contain rounded-xl flex-shrink-0 shadow-lg shadow-indigo-500/20 border border-indigo-500/40 group-hover:scale-105 transition-transform" 
              />
              
              {!isCollapsed && (
                <div className="min-w-0">
                  <div className="font-poppins font-bold text-sm tracking-wider zorbble-wordmark-gradient truncate">
                    EXILE SSF
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-sans truncate">
                    The SSF Compendium
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:text-indigo-400 hover:border-indigo-500/70 flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                isCollapsed ? 'w-9 h-7' : 'w-7 h-7'
              }`}
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
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

        {/* Navigation Links (Primary League Pinned, Compendium Sections Collapsible) */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-2 space-y-2.5">
          {currentNavGroups.map((group, gIdx) => {
            const isAlwaysOpen = group.title === 'Command & League';
            const isGroupCollapsed = !isCollapsed && !isAlwaysOpen && Boolean(collapsedGroups[group.title]);
            return (
            <div key={gIdx} className="space-y-0.5">
              {!isCollapsed ? (
                isAlwaysOpen ? (
                  <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400/90 font-bold px-2 pt-1 pb-0.5">
                    {group.title}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => toggleSidebarGroup(group.title)}
                    className="w-full flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-500 hover:text-slate-300 font-bold px-2 pt-1 pb-0.5 cursor-pointer transition-colors"
                  >
                    <span>{group.title}</span>
                    {isGroupCollapsed ? (
                      <ChevronRight className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </button>
                )
              ) : gIdx > 0 ? (
                <div className="border-t border-slate-800 my-1 mx-2" />
              ) : null}

              {!isGroupCollapsed && group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => (item.id === 'tool_setup' ? openToolSetup?.() : setActiveTab(item.id))}
                    onMouseEnter={() => onPrefetchTab?.(item.id)}
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
            );
          })}
        </nav>

        {/* Compact Footer Area: Dual Timezone Clock + Profile + About + Privacy Policy */}
        <div className="p-3 border-t border-slate-800 space-y-2">
          {/* Live GGG New Zealand Time + User Local Time */}
          {!isCollapsed ? (
            <div
              className="grid grid-cols-2 gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800/90 font-mono"
              title={`Grinding Gear Games HQ (Auckland): ${gggClock.timeStr} ${gggClock.tzAbbr} | Your Local Time: ${localClock.timeStr} ${localClock.tzAbbr}`}
            >
              <div className="min-w-0">
                <div className="text-[9px] uppercase tracking-wider text-amber-400/90 font-bold truncate">
                  GGG {gggClock.tzAbbr}
                </div>
                <div className="text-[11px] font-bold text-slate-100 truncate">{gggClock.timeStr}</div>
              </div>
              <div className="min-w-0 border-l border-slate-800 pl-2">
                <div className="text-[9px] uppercase tracking-wider text-sky-400/90 font-bold truncate">
                  Local {localClock.tzAbbr}
                </div>
                <div className="text-[11px] font-bold text-slate-100 truncate">{localClock.timeStr}</div>
              </div>
            </div>
          ) : (
            <div
              className="w-full p-2 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-center text-amber-400"
              title={`GGG (${gggClock.tzAbbr}): ${gggClock.timeStr} | Local (${localClock.tzAbbr}): ${localClock.timeStr}`}
            >
              <Clock className="w-4 h-4" />
            </div>
          )}

          {/* Active Synced Character Context Pill (PoE 1 synced character — hidden in PoE 2 mode) */}
          {selectedGame === 'poe1' && activeChar && !isCollapsed && (
            <button
              type="button"
              onClick={() => setActiveTab('armory')}
              className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/35 text-left transition-colors cursor-pointer"
              title={`Active Character: ${activeChar.name} (Lv ${activeChar.level} ${activeChar.className}) — Click to open Armory`}
            >
              <div className="min-w-0">
                <div className="text-[9px] font-mono uppercase tracking-wider text-amber-400/90 font-bold">
                  Active Character
                </div>
                <div className="text-[11px] font-bold text-amber-100 truncate">
                  {activeChar.name}
                </div>
                <div className="text-[10px] font-mono text-slate-400 truncate">
                  Lv {activeChar.level} {activeChar.className}
                </div>
              </div>
              <Swords className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            </button>
          )}

          {/* User Account Profile & Dynamic Tag Card (Opens /exile/:handle directly when signed in) */}
          {(onOpenAuthModal || onOpenProfile) && (
            !isCollapsed ? (
              <button
                onClick={() => {
                  if (userAccount && onOpenProfile) {
                    onOpenProfile(userAccount.displayName);
                  } else {
                    onOpenAuthModal?.();
                  }
                }}
                className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
                title={userAccount ? `Open @${userAccount.displayName}'s Exile Profile` : 'Login'}
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

          {/* Offline Mode Indicator & 1 Click PWA Desktop Install */}
          {isOffline && (
            <div
              className={`w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-[11px] font-mono font-bold ${
                isCollapsed ? 'justify-center px-0' : ''
              }`}
              title="Offline Mode: Cheat Sheets, Vendor Recipes, and Regex Studio remain cached locally"
            >
              <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              {!isCollapsed && <span className="truncate">Offline Mode Ready</span>}
            </div>
          )}

          {deferredInstallPrompt && (
            <button
              type="button"
              onClick={handleInstallPwa}
              className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-200 text-xs font-bold transition-colors cursor-pointer ${
                isCollapsed ? 'justify-center px-0' : ''
              }`}
              title="Install Exile SSF as a standalone Offline Ready Desktop App"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              {!isCollapsed && <span className="truncate">Install Desktop App</span>}
            </button>
          )}

          {/* Compact Footer Action Row */}
          <div className={isCollapsed ? 'flex flex-col items-center gap-1.5' : 'flex items-center gap-1.5'}>
            {/* Heart Icon Button */}
            <button
              onClick={() => setActiveTab('about')}
              className={`p-2 rounded-xl border transition-all flex items-center justify-center cursor-pointer ${
                activeTab === 'about'
                  ? 'bg-rose-500 text-white border-rose-600 shadow-md shadow-rose-500/20'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-rose-500 hover:border-rose-500/40'
              } ${isCollapsed ? 'w-full' : 'w-10 flex-shrink-0'}`}
              title="About Exile SSF"
            >
              <Heart className={`w-3.5 h-3.5 ${activeTab === 'about' ? 'fill-white text-white' : 'fill-rose-500/40 text-rose-500'}`} />
            </button>

            {/* Compact Notification Bell Button next to Heart */}
            {userAccount && (
              <InboxBellDrawer
                userAccount={userAccount}
                compact
                buttonClassName={`p-2 bg-slate-900 border-slate-800 text-slate-400 hover:text-indigo-300 hover:border-indigo-500/40 ${
                  isCollapsed ? 'w-full' : 'w-10 flex-shrink-0'
                }`}
              />
            )}

            {!isCollapsed && (
              <button
                type="button"
                onClick={() => setActiveTab('privacy')}
                className={`flex-1 py-2 px-2.5 rounded-xl border text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'privacy'
                    ? 'bg-indigo-600/25 border-indigo-400/60 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                }`}
                title="Read Exile SSF Privacy Policy"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Privacy Policy</span>
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
