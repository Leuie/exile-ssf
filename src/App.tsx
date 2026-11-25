import React, { useState, useEffect, lazy, Suspense } from 'react';
import { readLiveFarmingSession, LIVE_SESSION_EVENT, type LiveFarmingSession } from './utils/activeSession';
import { Sidebar } from './components/Sidebar';
import { SiteNoticeBanner } from './components/SiteNoticeBanner';
import { cloudAuthLogout } from './services/cloudSync';

// Resilient lazy loader that auto refreshes once if a newly deployed Cloudflare build invalidates an older chunk hash
function lazyWithRetry<T extends React.ComponentType<any>>(
  importer: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    try {
      return await importer();
    } catch (err) {
      try {
        const key = 'exile_ssf_chunk_reload_at';
        const last = Number(sessionStorage.getItem(key) || '0');
        if (Date.now() - last > 12000) {
          sessionStorage.setItem(key, String(Date.now()));
          window.location.reload();
          return new Promise<{ default: T }>(() => {});
        }
      } catch {}
      throw err;
    }
  });
}

const HomeView = lazyWithRetry(() => import('./components/HomeView').then((m) => ({ default: m.HomeView })));
const VendorRecipesView = lazyWithRetry(() => import('./components/VendorRecipesView').then((m) => ({ default: m.VendorRecipesView })));
const AtlasView = lazyWithRetry(() => import('./components/AtlasView').then((m) => ({ default: m.AtlasView })));
const DefenseMechanicsView = lazyWithRetry(() => import('./components/DefenseMechanicsView').then((m) => ({ default: m.DefenseMechanicsView })));
const OffensesView = lazyWithRetry(() => import('./components/OffensesView').then((m) => ({ default: m.OffensesView })));
const BuildsHubView = lazyWithRetry(() => import('./components/BuildsHubView').then((m) => ({ default: m.BuildsHubView })));
const PatchNotesView = lazyWithRetry(() => import('./components/PatchNotesView').then((m) => ({ default: m.PatchNotesView })));
const PoERegexStudioView = lazyWithRetry(() => import('./components/PoERegexStudioView').then((m) => ({ default: m.PoERegexStudioView })));
const AssetTrackerView = lazyWithRetry(() => import('./components/AssetTrackerView').then((m) => ({ default: m.AssetTrackerView })));
const WealthAnalyticsView = lazyWithRetry(() => import('./components/WealthAnalyticsView').then((m) => ({ default: m.WealthAnalyticsView })));
const MapTrackerView = lazyWithRetry(() => import('./components/MapTrackerView').then((m) => ({ default: m.MapTrackerView })));
const CheatSheetsTab = lazyWithRetry(() => import('./components/league/tabs/CheatSheetsTab').then((m) => ({ default: m.CheatSheetsTab })));
const BenchGuideTab = lazyWithRetry(() => import('./components/league/tabs/BenchGuideTab').then((m) => ({ default: m.BenchGuideTab })));
const LabyrinthGuideView = lazyWithRetry(() => import('./components/LabyrinthGuideView').then((m) => ({ default: m.LabyrinthGuideView })));
const CampaignWalkthroughView = lazyWithRetry(() => import('./components/CampaignWalkthroughView').then((m) => ({ default: m.CampaignWalkthroughView })));
const PrivacyPolicyView = lazyWithRetry(() => import('./components/PrivacyPolicyView').then((m) => ({ default: m.PrivacyPolicyView })));
const ToolsDirectoryView = lazyWithRetry(() => import('./components/ToolsDirectoryView').then((m) => ({ default: m.ToolsDirectoryView })));
const PoEWikiWrapperView = lazyWithRetry(() => import('./components/PoEWikiWrapperView').then((m) => ({ default: m.PoEWikiWrapperView })));
const PoEDBWrapperView = lazyWithRetry(() => import('./components/PoEDBWrapperView').then((m) => ({ default: m.PoEDBWrapperView })));
const PoENinjaWrapperView = lazyWithRetry(() => import('./components/PoENinjaWrapperView').then((m) => ({ default: m.PoENinjaWrapperView })));
const SabrewulfWrapperView = lazyWithRetry(() => import('./components/SabrewulfWrapperView').then((m) => ({ default: m.SabrewulfWrapperView })));
const PoE2HubView = lazyWithRetry(() => import('./components/PoE2HubView').then((m) => ({ default: m.PoE2HubView })));
const AboutView = lazyWithRetry(() => import('./components/AboutView').then((m) => ({ default: m.AboutView })));
const PrivateLeagueHubView = lazyWithRetry(() => import('./components/PrivateLeagueHubView').then((m) => ({ default: m.PrivateLeagueHubView })));
const FeedbackView = lazyWithRetry(() => import('./components/FeedbackView').then((m) => ({ default: m.FeedbackView })));
const DualLinkModal = lazyWithRetry(() => import('./components/DualLinkModal').then((m) => ({ default: m.DualLinkModal })));
const AuthRegistrationModal = lazyWithRetry(() => import('./components/AuthRegistrationModal').then((m) => ({ default: m.AuthRegistrationModal })));
const LoginPage = lazyWithRetry(() => import('./components/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazyWithRetry(() => import('./components/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const AdminPortalPage = lazyWithRetry(() => import('./components/AdminPortalPage').then((m) => ({ default: m.AdminPortalPage })));
const PrivateLeaguesDirectoryView = lazyWithRetry(() => import('./components/PrivateLeaguesDirectoryView').then((m) => ({ default: m.PrivateLeaguesDirectoryView })));
const FullGuideReaderView = lazyWithRetry(() => import('./components/FullGuideReaderView').then((m) => ({ default: m.FullGuideReaderView })));
const ExileProfilePage = lazyWithRetry(() => import('./components/ExileProfilePage').then((m) => ({ default: m.ExileProfilePage })));
const CharacterArmoryView = lazyWithRetry(() => import('./components/CharacterArmoryView').then((m) => ({ default: m.CharacterArmoryView })));
const ToolSetupModal = lazyWithRetry(() => import('./components/ToolSetupModal').then((m) => ({ default: m.ToolSetupModal })));

const PageLoader = (
  <div className="min-h-[40vh] flex items-center justify-center text-xs font-mono text-slate-400">
    Loading Exile SSF module...
  </div>
);
import { getInitialLeagueRoster, INITIAL_COMMUNITY_GUIDES } from './data/privateLeagueData';
import { saveCloudRosterMember } from './services/cloudSync';
import type { UserAccount, LeagueRosterMember, LookingForItem, CommunityGuide } from './types';

export const App: React.FC = () => {
  const getInitialLeagueId = (): string => {
    if (typeof window === 'undefined') return 'poe1-330-umbra';
    const path = window.location.pathname.toLowerCase().replace(/\/$/, '');
    const hash = window.location.hash.toLowerCase().replace(/^#\/?/, '').replace(/\/$/, '');

    if (path.startsWith('/league/')) {
      const parts = path.replace('/league/', '').split('/');
      return parts[0] || 'poe1-330-umbra';
    }
    if (path.startsWith('/privateleaguehub/') && path !== '/privateleaguehub') {
      const parts = path.replace('/privateleaguehub/', '').split('/');
      return parts[0] || 'poe1-330-umbra';
    }
    if (hash.startsWith('league/')) {
      const parts = hash.replace('league/', '').split('/');
      return parts[0] || 'poe1-330-umbra';
    }
    if (hash.startsWith('privateleaguehub/') && hash !== 'privateleaguehub') {
      const parts = hash.replace('privateleaguehub/', '').split('/');
      return parts[0] || 'poe1-330-umbra';
    }
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const queryId = searchParams.get('league') || searchParams.get('id');
      if (queryId) return queryId;
    } catch {}
    return 'poe1-330-umbra';
  };

  const getInitialLeagueSubTab = (): string => {
    if (typeof window === 'undefined') return '';
    const path = window.location.pathname.toLowerCase().replace(/\/$/, '');
    const hash = window.location.hash.toLowerCase().replace(/^#\/?/, '').replace(/\/$/, '');
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const queryTab = searchParams.get('tab') || searchParams.get('page');
      if (queryTab) return queryTab;
    } catch {}

    if (path.startsWith('/league/')) {
      const parts = path.replace('/league/', '').split('/');
      if (parts[1]) return parts[1];
    }
    if (hash.startsWith('league/')) {
      const parts = hash.replace('league/', '').split('/');
      if (parts[1]) return parts[1];
    }
    return '';
  };

  const getInitialActiveTab = (): string => {
    if (typeof window === 'undefined') return 'home';
    const path = window.location.pathname.toLowerCase().replace(/\/$/, '');
    const hash = window.location.hash.toLowerCase().replace(/^#\/?/, '').replace(/\/$/, '');

    // Direct route to a specific league
    if (
      path.startsWith('/league/') ||
      hash.startsWith('league/') ||
      (path.startsWith('/privateleaguehub/') && path !== '/privateleaguehub') ||
      (hash.startsWith('privateleaguehub/') && hash !== 'privateleaguehub')
    ) {
      return 'single_league';
    }

    try {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('league') || searchParams.get('id')) {
        return 'single_league';
      }
    } catch {}

    if (path.startsWith('/exile/') || path.startsWith('/player/') || hash.startsWith('exile/') || hash.startsWith('player/')) {
      return 'exile_profile';
    }
    if (
      path === '/armory' ||
      path.startsWith('/armory/') ||
      path === '/character' ||
      path.startsWith('/character/') ||
      hash === 'armory' ||
      hash.startsWith('armory/')
    ) {
      return 'armory';
    }

    // Direct route to the Private League Hub directory
    if (
      path === '/privateleaguehub' ||
      hash === 'privateleaguehub' ||
      path === '/private-league-hub' ||
      hash === 'private-league-hub' ||
      path === '/leagues' ||
      hash === 'leagues'
    ) {
      return 'private_league_hub';
    }

    if (path === '/patch-notes' || path === '/patchnotes' || hash === 'patch-notes' || hash === 'patchnotes') {
      return 'patch_notes';
    }
    if (path === '/builds' || path === '/build-hub' || hash === 'builds') {
      return 'builds';
    }
    if (path === '/cheat-sheets' || path === '/cheatsheets' || hash === 'cheat-sheets') {
      return 'cheat_sheets';
    }
    if (path === '/crafting-bench' || path === '/bench' || hash === 'crafting-bench') {
      return 'crafting_bench';
    }
    if (path === '/regex' || path === '/regex-studio' || hash === 'regex') {
      return 'regex_studio';
    }
    if (path === '/assets/analytics' || path === '/wealth-analytics' || path === '/wealth/analytics' || hash === 'wealth_analytics') {
      return 'wealth_analytics';
    }
    if (path === '/assets' || path === '/asset-tracker' || path === '/farming' || path === '/drops' || path === '/wealth' || hash === 'assets' || hash === 'farming') {
      return 'asset_tracker';
    }
    if (path === '/maps' || path === '/map-tracker' || hash === 'maps') {
      return 'map_tracker';
    }
    if (path === '/sabrewulf' || hash === 'sabrewulf') {
      return 'sabrewulf';
    }
    if (path === '/privacy' || path === '/privacy-policy' || hash === 'privacy') {
      return 'privacy';
    }

    return 'home';
  };

  const [selectedGame, setSelectedGame] = useState<'poe1' | 'poe2'>('poe1');
  const [selectedLeagueSessionId, setSelectedLeagueSessionId] = useState<string>(getInitialLeagueId);
  const [selectedLeagueSubTab, setSelectedLeagueSubTab] = useState<string>(getInitialLeagueSubTab);
  const [activeTab, setActiveTab] = useState<string>(getInitialActiveTab);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isToolSetupOpen, setIsToolSetupOpen] = useState<boolean>(false);
  const [serverSessionExpired, setServerSessionExpired] = useState<boolean>(false);
  const [liveHudSession, setLiveHudSession] = useState<LiveFarmingSession | null>(() => readLiveFarmingSession());
  const [hudDismissed, setHudDismissed] = useState<boolean>(false);

  useEffect(() => {
    const onLiveUpdate = (e: Event) => {
      const detail = (e as CustomEvent<LiveFarmingSession>).detail;
      setLiveHudSession(detail || readLiveFarmingSession());
      if (detail?.watchingLive) setHudDismissed(false);
    };
    window.addEventListener(LIVE_SESSION_EVENT, onLiveUpdate);
    return () => window.removeEventListener(LIVE_SESSION_EVENT, onLiveUpdate);
  }, []);
  const [showPurgeNotice, setShowPurgeNotice] = useState<boolean>(() => {
    try {
      return localStorage.getItem('exile_ssf_purge_notice_dismissed_2026_11_24') !== '1';
    } catch {
      return true;
    }
  });

  // One time client side purge of stale Asset Tracker, Map Tracker, and Armory caches (Nov 24, 2026 12:00 PM EST)
  useEffect(() => {
    try {
      const flagKey = 'exile_ssf_tool_purge_2026_11_24_12pm_est';
      if (localStorage.getItem(flagKey) !== 'done') {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (!k) continue;
          if (
            k.startsWith('exile_ssf_last_char_') ||
            k.includes('farming_sessions') ||
            k.includes('stash_state') ||
            k.includes('map_tracker_sessions') ||
            k === 'exile_ssf_synced_gear_vitals_v1'
          ) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
        localStorage.setItem(flagKey, 'done');
      }
    } catch {}
  }, []);

  const getInitialGuideSlug = (): string => {
    if (typeof window === 'undefined') return '';
    const path = window.location.pathname.toLowerCase().replace(/\/$/, '');
    const hash = window.location.hash.toLowerCase().replace(/^#\/?/, '').replace(/\/$/, '');
    if (path.startsWith('/guide/')) {
      return path.replace('/guide/', '');
    }
    if (hash.startsWith('guide/')) {
      return hash.replace('guide/', '');
    }
    return '';
  };

  const [currentGuideSlug, setCurrentGuideSlug] = useState<string>(getInitialGuideSlug);

  const getInitialProfileHandle = (): string => {
    if (typeof window === 'undefined') return '';
    const path = window.location.pathname.replace(/\/+$/, '');
    const hash = window.location.hash.replace(/^#\/?/, '').replace(/\/+$/, '');
    if (path.toLowerCase().startsWith('/exile/')) return decodeURIComponent(path.slice(7).split('/')[0] || '');
    if (path.toLowerCase().startsWith('/player/')) return decodeURIComponent(path.slice(8).split('/')[0] || '');
    if (hash.toLowerCase().startsWith('exile/')) return decodeURIComponent(hash.slice(6).split('/')[0] || '');
    if (hash.toLowerCase().startsWith('player/')) return decodeURIComponent(hash.slice(7).split('/')[0] || '');
    return '';
  };

  const [currentProfileHandle, setCurrentProfileHandle] = useState<string>(getInitialProfileHandle);

  const getInitialArmoryTarget = (): { handle: string; charName: string } => {
    if (typeof window === 'undefined') return { handle: '', charName: '' };
    const path = window.location.pathname.replace(/\/+$/, '');
    const hash = window.location.hash.replace(/^#\/?/, '').replace(/\/+$/, '');
    const parseParts = (prefix: string, src: string) => {
      const rest = src.slice(prefix.length).split('/').filter(Boolean);
      return {
        handle: rest[0] ? decodeURIComponent(rest[0]).replace(/^@/, '') : '',
        charName: rest[1] ? decodeURIComponent(rest[1]) : ''
      };
    };
    if (path.toLowerCase().startsWith('/armory/')) return parseParts('/armory/', path);
    if (path.toLowerCase().startsWith('/character/')) return parseParts('/character/', path);
    if (hash.toLowerCase().startsWith('armory/')) return parseParts('armory/', hash);
    try {
      const params = new URLSearchParams(window.location.search);
      return {
        handle: (params.get('handle') || '').replace(/^@/, ''),
        charName: params.get('char') || ''
      };
    } catch {
      return { handle: '', charName: '' };
    }
  };

  const initialArmory = getInitialArmoryTarget();
  const [armoryHandle, setArmoryHandle] = useState<string>(initialArmory.handle);
  const [armoryCharName, setArmoryCharName] = useState<string>(initialArmory.charName);

  const handleOpenArmory = (handle: string, charName?: string) => {
    const cleanHandle = handle.trim().replace(/^@/, '');
    const cleanChar = (charName || '').trim();
    setArmoryHandle(cleanHandle);
    setArmoryCharName(cleanChar);
    setActiveTab('armory');
    try {
      const url = cleanHandle
        ? `/armory/${encodeURIComponent(cleanHandle)}${cleanChar ? '/' + encodeURIComponent(cleanChar) : ''}`
        : '/armory';
      window.history.pushState({}, '', url);
    } catch {}
  };

  const handleSyncArmoryUrl = (handle: string, charName?: string) => {
    const cleanHandle = handle.trim().replace(/^@/, '');
    const cleanChar = (charName || '').trim();
    setArmoryHandle(cleanHandle);
    setArmoryCharName(cleanChar);
    try {
      const url = cleanHandle
        ? `/armory/${encodeURIComponent(cleanHandle)}${cleanChar ? '/' + encodeURIComponent(cleanChar) : ''}`
        : '/armory';
      window.history.replaceState({}, '', url);
    } catch {}
  };

  const handlePrefetchTab = (tabId: string) => {
    switch (tabId) {
      case 'armory':
        void import('./components/CharacterArmoryView');
        break;
      case 'asset_tracker':
        void import('./components/AssetTrackerView');
        break;
      case 'map_tracker':
        void import('./components/MapTrackerView');
        break;
      case 'builds':
        void import('./components/BuildsHubView');
        break;
      case 'private_league_hub':
        void import('./components/PrivateLeaguesDirectoryView');
        break;
      case 'feedback':
        void import('./components/FeedbackView');
        break;
      case 'patch_notes':
        void import('./components/PatchNotesView');
        break;
      default:
        break;
    }
  };

  const handleOpenProfile = (handle: string) => {
    const clean = handle.trim().replace(/^@/, '');
    if (!clean) return;
    setCurrentProfileHandle(clean);
    setActiveTab('exile_profile');
    try {
      window.history.pushState({}, '', `/exile/${encodeURIComponent(clean.toLowerCase())}`);
    } catch {}
  };

  // Dedicated Route Detection (/login, /register, /admin)
  const getInitialRoute = (): 'login' | 'register' | 'admin' | '' => {
    if (typeof window === 'undefined') return '';
    const path = window.location.pathname.toLowerCase().replace(/\/$/, '');
    const hash = window.location.hash.toLowerCase().replace(/^#\/?/, '').replace(/\/$/, '');
    if (path === '/admin' || hash === 'admin') return 'admin';
    if (path === '/login' || hash === 'login') return 'login';
    if (path === '/register' || hash === 'register') return 'register';
    return '';
  };

  const [currentRoute, setCurrentRoute] = useState<'login' | 'register' | 'admin' | ''>(getInitialRoute);

  useEffect(() => {
    const handleLocationChange = () => {
      const route = getInitialRoute();
      setCurrentRoute(route);
      const slug = getInitialGuideSlug();
      setCurrentGuideSlug(slug);
      const leagueId = getInitialLeagueId();
      setSelectedLeagueSessionId(leagueId);
      const subTab = getInitialLeagueSubTab();
      setSelectedLeagueSubTab(subTab);
      const tab = getInitialActiveTab();
      if (tab === 'armory') {
        const target = getInitialArmoryTarget();
        setArmoryHandle(target.handle);
        setArmoryCharName(target.charName);
        setActiveTab('armory');
      } else if (tab === 'exile_profile') {
        setCurrentProfileHandle(getInitialProfileHandle());
        setActiveTab('exile_profile');
      } else if (tab === 'private_league_hub' || tab === 'single_league' || tab === 'home') {
        setActiveTab(tab);
      }
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const navigateToRoute = (route: 'login' | 'register' | 'admin' | '') => {
    setCurrentRoute(route);
    const targetUrl = route ? `/${route}` : '/';
    try {
      window.history.pushState({}, '', targetUrl);
    } catch {}
  };

  const handleSelectTab = (tab: string) => {
    setActiveTab(tab);
    if (currentRoute) {
      setCurrentRoute('');
    }
    if (typeof window !== 'undefined') {
      try {
        if (tab === 'private_league_hub' || tab === 'private_leagues') {
          window.history.pushState({}, '', '/privateleaguehub');
        } else if (tab === 'single_league' || tab === 'private_league') {
          window.history.pushState({}, '', `/league/${selectedLeagueSessionId}`);
        } else if (tab === 'patch_notes') {
          window.history.pushState({}, '', '/patch-notes');
        } else if (tab === 'builds' || tab === 'build_doctor' || tab === 'build_ingest') {
          window.history.pushState({}, '', '/builds');
        } else if (tab === 'cheat_sheets') {
          window.history.pushState({}, '', '/cheat-sheets');
        } else if (tab === 'crafting_bench') {
          window.history.pushState({}, '', '/crafting-bench');
        } else if (tab === 'regex_studio') {
          window.history.pushState({}, '', '/regex');
        } else if (tab === 'asset_tracker') {
          window.history.pushState({}, '', '/assets');
        } else if (tab === 'wealth_analytics') {
          window.history.pushState({}, '', '/assets/analytics');
        } else if (tab === 'map_tracker') {
          window.history.pushState({}, '', '/maps');
        } else if (tab === 'armory') {
          const targetHandle = armoryHandle || userAccount?.displayName || '';
          const url = targetHandle
            ? `/armory/${encodeURIComponent(targetHandle)}${armoryCharName ? '/' + encodeURIComponent(armoryCharName) : ''}`
            : '/armory';
          window.history.pushState({}, '', url);
        } else if (tab === 'sabrewulf') {
          window.history.pushState({}, '', '/sabrewulf');
        } else if (tab === 'privacy') {
          window.history.pushState({}, '', '/privacy');
        } else if (tab === 'home') {
          window.history.pushState({}, '', '/');
        }
      } catch {}
    }
  };

  const handleSelectGame = (game: 'poe1' | 'poe2') => {
    setSelectedGame(game);
    if (game === 'poe2' && selectedLeagueSessionId === 'poe1-330-umbra') {
      setSelectedLeagueSessionId('poe2-ea-ancients');
    } else if (game === 'poe1' && selectedLeagueSessionId === 'poe2-ea-ancients') {
      setSelectedLeagueSessionId('poe1-330-umbra');
    }
  };

  // User Account & League Registration state with Dynamic Tagging
  const [userAccount, setUserAccount] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem('poe_umbraleague_user');
      if (saved) return JSON.parse(saved);
      return null;
    } catch {
      return null;
    }
  });

  // Verify real HttpOnly server session cookie whenever localStorage thinks the user is signed in
  useEffect(() => {
    if (!userAccount) {
      setServerSessionExpired(false);
      return;
    }
    let cancelled = false;
    fetch('/api/auth/session', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((s: any) => {
        if (!cancelled && s && !s.authenticated) {
          setServerSessionExpired(true);
        } else if (!cancelled && s?.authenticated) {
          setServerSessionExpired(false);
        }
      })
      .catch(() => {});

    const onExpired = () => setServerSessionExpired(true);
    window.addEventListener('exile:session-expired', onExpired);
    return () => {
      cancelled = true;
      window.removeEventListener('exile:session-expired', onExpired);
    };
  }, [userAccount]);

  useEffect(() => {
    const onOpenToolSetup = () => setIsToolSetupOpen(true);
    const onNavigateTab = (e: Event) => {
      const tabId = (e as CustomEvent)?.detail;
      if (typeof tabId === 'string' && tabId.trim()) {
        handleSelectTab(tabId.trim());
      }
    };
    window.addEventListener('exile-open-tool-setup', onOpenToolSetup);
    window.addEventListener('exile-navigate-tab', onNavigateTab);
    return () => {
      window.removeEventListener('exile-open-tool-setup', onOpenToolSetup);
      window.removeEventListener('exile-navigate-tab', onNavigateTab);
    };
  }, []);

  const handleSaveAccount = (account: UserAccount, rosterEntry: LeagueRosterMember) => {
    setUserAccount(account);
    setServerSessionExpired(false);
    try {
      localStorage.setItem('poe_umbraleague_user', JSON.stringify(account));
      // Sync into clean 3.30 roster
      const savedRoster = localStorage.getItem('poe_clean330_roster');
      const rosterList: LeagueRosterMember[] = savedRoster ? JSON.parse(savedRoster) : [...getInitialLeagueRoster()];
      const seedList = getInitialLeagueRoster();
      for (const s of seedList) {
        if (!rosterList.some((m) => m.displayName.toLowerCase() === s.displayName.toLowerCase())) {
          rosterList.push(s);
        }
      }
      const index = rosterList.findIndex(
        (m) =>
          (m.poeAccountName && account.poeAccountName && m.poeAccountName.toLowerCase() === account.poeAccountName.toLowerCase()) ||
          m.displayName.toLowerCase() === account.displayName.toLowerCase()
      );
      if (index >= 0) {
        rosterList[index] = { ...rosterList[index], ...rosterEntry };
      } else {
        const nextSlot = rosterList.length + 1;
        rosterList.push({ ...rosterEntry, slotNumber: nextSlot });
      }
      rosterList.forEach((m, i) => {
        m.slotNumber = i + 1;
      });
      localStorage.setItem('poe_clean330_roster', JSON.stringify(rosterList));

      // Sync into clean 3.30 accounts
      const storedRaw = localStorage.getItem('poe_clean330_accounts');
      const storedList: { username: string; passwordHash?: string; userAccount: UserAccount; rosterEntry: LeagueRosterMember }[] = storedRaw ? JSON.parse(storedRaw) : [];
      const accIdx = storedList.findIndex(
        (a) =>
          (account.provider === 'google' && a.userAccount.email && account.email && a.userAccount.email.toLowerCase() === account.email.toLowerCase()) ||
          (a.username.toLowerCase() === account.displayName.toLowerCase())
      );
      const accEntry = {
        username: account.displayName,
        passwordHash: account.passwordHash || '',
        userAccount: account,
        rosterEntry: rosterEntry
      };
      if (accIdx >= 0) {
        storedList[accIdx] = { ...storedList[accIdx], userAccount: account, rosterEntry };
      } else {
        storedList.push(accEntry);
      }
      localStorage.setItem('poe_clean330_accounts', JSON.stringify(storedList));
    } catch {}

    // Broadcast to Cloudflare KV multiplayer edge database
    saveCloudRosterMember(selectedLeagueSessionId || 'poe1-330-umbra', rosterEntry);
  };

  const handleSignOut = () => {
    cloudAuthLogout();
    setUserAccount(null);
    try {
      localStorage.removeItem('poe_umbraleague_user');
    } catch {}
  };

  const handleOpenAuth = () => {
    if (userAccount) {
      setIsAuthModalOpen(true);
    } else {
      navigateToRoute('login');
    }
  };

  // Permanent Dark Mode Default
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('dark');
    root.classList.remove('light');
    try {
      localStorage.setItem('poe_ssf_theme', 'dark');
    } catch {}
  }, []);

  useEffect(() => {
    const handleStorage = () => {
      try {
        const savedUser = localStorage.getItem('poe_umbraleague_user');
        setUserAccount(savedUser ? JSON.parse(savedUser) : null);
      } catch {}
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Global Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (currentRoute === 'login') {
    return (
      <Suspense fallback={PageLoader}>
      <LoginPage
        onLoginSuccess={(account, roster) => {
          handleSaveAccount(account, roster);
          navigateToRoute('');
        }}
        onNavigateRegister={() => navigateToRoute('register')}
        onNavigateHome={() => navigateToRoute('')}
      />
      </Suspense>
    );
  }

  if (currentRoute === 'register') {
    return (
      <Suspense fallback={PageLoader}>
      <RegisterPage
        onRegisterSuccess={(account, roster) => {
          handleSaveAccount(account, roster);
          navigateToRoute('');
        }}
        onNavigateLogin={() => navigateToRoute('login')}
        onNavigateHome={() => navigateToRoute('')}
      />
      </Suspense>
    );
  }

  if (currentRoute === 'admin') {
    return (
      <Suspense fallback={PageLoader}>
      <AdminPortalPage
        userAccount={userAccount}
        onAdminLoginSuccess={(account, roster) => {
          handleSaveAccount(account, roster);
        }}
        onAdminSignOut={handleSignOut}
        onNavigateLeagueHub={() => {
          setActiveTab('private_league_hub');
          navigateToRoute('');
        }}
        onNavigateHome={() => navigateToRoute('')}
      />
      </Suspense>
    );
  }

  const [communityGuides, setCommunityGuides] = useState<CommunityGuide[]>(() => {
    try {
      const saved = localStorage.getItem('poe_umbraleague_guides');
      if (saved) {
        const parsed: CommunityGuide[] = JSON.parse(saved);
        for (const g of INITIAL_COMMUNITY_GUIDES) {
          if (!parsed.some((p) => p.id === g.id)) {
            parsed.push(g);
          }
        }
        return parsed;
      }
      return INITIAL_COMMUNITY_GUIDES;
    } catch {
      return INITIAL_COMMUNITY_GUIDES;
    }
  });

  const activeFullGuide = currentGuideSlug
    ? communityGuides.find(
        (g) => (g.slug && g.slug.toLowerCase() === currentGuideSlug) || g.id === currentGuideSlug
      )
    : null;

  if (activeFullGuide) {
    return (
      <Suspense fallback={PageLoader}>
      <FullGuideReaderView
        guide={activeFullGuide}
        onUpdateGuide={(updated) => {
          setCommunityGuides((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
        }}
        onBack={() => {
          setCurrentGuideSlug('');
          try {
            window.history.pushState({}, '', '/privateleaguehub');
          } catch {}
          handleSelectTab('private_league_hub');
        }}
        onAddUniquesToLookingFor={(uniques) => {
          try {
            const raw = localStorage.getItem('poe_clean330_looking_for');
            const items: LookingForItem[] = raw ? JSON.parse(raw) : [];
            const newItems: LookingForItem[] = uniques.map((u) => ({
              id: `lf-auto-${Date.now()}-${Math.random()}`,
              characterName: userAccount?.characterName || 'MyCharacter',
              displayName: userAccount?.displayName || 'Leuie',
              preferredContact: userAccount?.preferredContact || 'app',
              itemName: u,
              category: 'Unique',
              status: 'NEED',
              notes: `Required for ${activeFullGuide.title}`,
              poeWikiUrl: `https://www.poewiki.net/wiki/${encodeURIComponent(u.replace(/ /g, '_'))}`,
              poeDbUrl: `https://poedb.tw/us/search?q=${encodeURIComponent(u)}`
            }));
            localStorage.setItem('poe_clean330_looking_for', JSON.stringify([...newItems, ...items]));
          } catch {}
        }}
      />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors duration-200 flex flex-col lg:flex-row relative overflow-x-hidden">
      
      {/* Left Collapsible Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleSelectTab}
        selectedGame={selectedGame}
        setSelectedGame={handleSelectGame}
        openSearch={() => setIsSearchOpen(true)}
        openToolSetup={() => setIsToolSetupOpen(true)}
        userAccount={userAccount}
        onOpenAuthModal={handleOpenAuth}
        onOpenProfile={handleOpenProfile}
        onPrefetchTab={handlePrefetchTab}
      />

      {/* Main Content Area: Full Width, Fluid, Springy Utility Layout */}
      <div className="flex-1 min-w-0 flex flex-col w-full">
        <SiteNoticeBanner />
        {showPurgeNotice && (
          <div className="w-full bg-indigo-950/95 border-b border-indigo-500/45 px-4 py-2.5 text-xs text-indigo-100">
            <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/50 text-amber-300 font-mono font-bold text-[10px] uppercase shrink-0">
                  Tool Reset • Nov 24 12:00 PM EST
                </span>
                <span className="text-slate-200 leading-snug">
                  Saved data in <strong className="text-white">Asset Tracker</strong>, <strong className="text-white">Map Tracker</strong>, and <strong className="text-white">Character Armory</strong> was cleared for our unified sync upgrade. Open <strong className="text-amber-300">Tool Setup</strong> to opt in and resync your characters and stash.
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsToolSetupOpen(true)}
                  className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] cursor-pointer"
                >
                  Open Tool Setup
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPurgeNotice(false);
                    try {
                      localStorage.setItem('exile_ssf_purge_notice_dismissed_2026_11_24', '1');
                    } catch {}
                  }}
                  className="text-[11px] text-indigo-300/80 hover:text-white cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}
        {serverSessionExpired && userAccount && (
          <div className="w-full bg-amber-950/95 border-b border-amber-500/50 px-4 py-2 text-xs text-amber-100">
            <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-2">
              <span>
                <strong className="text-amber-300">Cloud Session Needs Refresh:</strong> Your browser still shows @{userAccount.displayName}, but your encrypted server cookie expired. Sign in once to re enable Cloud saves.
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => (userAccount.isAdmin ? handleSelectTab('admin') : handleOpenAuth())}
                  className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] cursor-pointer"
                >
                  {userAccount.isAdmin ? 'Admin Sign In' : 'Sign In Now'}
                </button>
                <button
                  type="button"
                  onClick={() => setServerSessionExpired(false)}
                  className="text-[11px] text-amber-300/80 hover:text-white cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Compact Second-Monitor Live Mapping HUD Strip (when Map Tracker Live Watch is active) */}
        {liveHudSession?.watchingLive && !hudDismissed && activeTab !== 'map_tracker' && (
          <div className="px-3 sm:px-5 pt-2 max-w-[1700px] w-full mx-auto">
            <div className="rounded-xl border border-emerald-500/35 bg-gradient-to-r from-emerald-950/60 via-slate-950/90 to-indigo-950/50 px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 text-xs font-mono shadow-lg">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 text-emerald-300 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>LIVE WATCH</span>
                </span>
                {liveHudSession.currentZone && (
                  <span className="text-white font-semibold truncate max-w-[220px]">
                    {liveHudSession.currentZone}
                  </span>
                )}
                <span className="text-slate-400">
                  Maps: <strong className="text-amber-300">{liveHudSession.mapsCompleted}</strong> ({liveHudSession.mapsPerHr}/hr)
                </span>
                {liveHudSession.xpPerHrM > 0 && (
                  <span className="text-slate-400">
                    XP/hr: <strong className="text-sky-300">{liveHudSession.xpPerHrM.toFixed(1)}M</strong>
                  </span>
                )}
                {liveHudSession.strategyTag && (
                  <span className="px-2 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/30 text-indigo-200 text-[10px]">
                    {liveHudSession.strategyTag}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleSelectTab('map_tracker')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600/25 hover:bg-emerald-600/40 border border-emerald-400/40 text-emerald-200 font-bold text-[11px] cursor-pointer"
                >
                  Open Map Tracker
                </button>
                <button
                  type="button"
                  onClick={() => setHudDismissed(true)}
                  className="text-[11px] text-slate-400 hover:text-white cursor-pointer"
                >
                  Hide
                </button>
              </div>
            </div>
          </div>
        )}
        <main className={`flex-1 min-w-0 transition-all duration-300 ease-in-out w-full ${
          activeTab === 'single_league' || activeTab === 'private_league' 
            ? 'p-0 max-w-none' 
            : 'p-3 sm:p-5 lg:p-6 max-w-[1700px] w-full mx-auto'
        }`}>
        <Suspense fallback={PageLoader}>
        {(activeTab === 'home' || activeTab === 'manifesto') && <HomeView onNavigate={handleSelectTab} />}
        {activeTab === 'patch_notes' && <PatchNotesView initialGame={selectedGame} />}
        {activeTab === 'regex_studio' && <PoERegexStudioView selectedGame={selectedGame} userAccount={userAccount} />}
        {activeTab === 'asset_tracker' && (
          <AssetTrackerView
            selectedGame={selectedGame}
            userAccount={userAccount}
            onOpenAuthModal={handleOpenAuth}
            onOpenAnalytics={() => handleSelectTab('wealth_analytics')}
          />
        )}
        {activeTab === 'wealth_analytics' && (
          <WealthAnalyticsView
            userAccount={userAccount}
            onBackToAssetTracker={() => handleSelectTab('asset_tracker')}
            onOpenProfile={handleOpenProfile}
            onOpenAuthModal={handleOpenAuth}
          />
        )}
        {activeTab === 'map_tracker' && (
          <MapTrackerView selectedGame={selectedGame} userAccount={userAccount} />
        )}
        {activeTab === 'armory' && (
          <CharacterArmoryView
            initialHandle={armoryHandle || userAccount?.displayName || ''}
            initialCharacterName={armoryCharName || undefined}
            userAccount={userAccount}
            selectedGame={selectedGame}
            onOpenProfile={handleOpenProfile}
            onOpenAuthModal={handleOpenAuth}
            onSyncArmoryUrl={handleSyncArmoryUrl}
          />
        )}
        {activeTab === 'cheat_sheets' && <CheatSheetsTab selectedGame={selectedGame} userAccount={userAccount} />}
        {activeTab === 'crafting_bench' && <BenchGuideTab selectedGame={selectedGame} userAccount={userAccount} />}
        {activeTab === 'vendor_recipes' && <VendorRecipesView selectedGame={selectedGame} />}
        {activeTab === 'atlas' && <AtlasView selectedGame={selectedGame} userAccount={userAccount} />}
        {activeTab === 'defenses' && <DefenseMechanicsView selectedGame={selectedGame} userAccount={userAccount} />}
        {activeTab === 'offenses' && <OffensesView selectedGame={selectedGame} userAccount={userAccount} />}
        {activeTab === 'builds' && (
          <BuildsHubView selectedGame={selectedGame} userAccount={userAccount} initialSubTab="community" />
        )}
        {activeTab === 'build_doctor' && (
          <BuildsHubView selectedGame={selectedGame} userAccount={userAccount} initialSubTab="doctor" />
        )}
        {activeTab === 'build_ingest' && (
          <BuildsHubView selectedGame={selectedGame} userAccount={userAccount} initialSubTab="ingest" />
        )}
        {activeTab === 'labyrinth' && <LabyrinthGuideView selectedGame={selectedGame} userAccount={userAccount} />}
        {activeTab === 'campaign' && <CampaignWalkthroughView selectedGame={selectedGame} userAccount={userAccount} />}
        {activeTab === 'privacy' && <PrivacyPolicyView />}
        {activeTab === 'tools_directory' && <ToolsDirectoryView selectedGame={selectedGame} userAccount={userAccount} />}
        {activeTab === 'poewiki' && <PoEWikiWrapperView initialUrl="https://www.poewiki.net/" title="PoEWiki Portal" isPoE2={false} userAccount={userAccount} />}
        {activeTab === 'poedb' && <PoEDBWrapperView initialUrl="https://poedb.tw/us/" title="PoEDB Portal" isPoE2={false} userAccount={userAccount} />}
        {activeTab === 'poe_ninja' && <PoENinjaWrapperView selectedGame={selectedGame} userAccount={userAccount} />}
        {activeTab === 'sabrewulf' && <SabrewulfWrapperView userAccount={userAccount} />}
        {activeTab === 'poe2_hub' && <PoE2HubView />}
        {activeTab === 'poe2_wiki' && <PoEWikiWrapperView initialUrl="https://www.poe2wiki.net/" title="PoE 2 Wiki Portal" isPoE2={true} userAccount={userAccount} />}
        {activeTab === 'poe2_db' && <PoEDBWrapperView initialUrl="https://poe2db.tw/us/" title="PoE 2 DB Portal" isPoE2={true} userAccount={userAccount} />}
        {activeTab === 'about' && <AboutView />}
        {activeTab === 'feedback' && (
          <FeedbackView
            userAccount={userAccount}
            onOpenAuthModal={handleOpenAuth}
          />
        )}
        {(activeTab === 'private_league_hub' || activeTab === 'private_leagues') && (
          <PrivateLeaguesDirectoryView
            userAccount={userAccount}
            selectedGame={selectedGame}
            onSelectGame={handleSelectGame}
            onSelectLeague={(sessionId) => {
              setSelectedLeagueSessionId(sessionId);
              setActiveTab('single_league');
              try {
                window.history.pushState({}, '', `/league/${sessionId}`);
              } catch {}
            }}
            onOpenAuthModal={handleOpenAuth}
          />
        )}
        {activeTab === 'exile_profile' && currentProfileHandle && (
          <ExileProfilePage
            handle={currentProfileHandle}
            userAccount={userAccount}
            onOpenAccountSettings={handleOpenAuth}
            onOpenArmory={handleOpenArmory}
            onBack={() => {
              setActiveTab('single_league');
              try {
                window.history.pushState({}, '', `/league/${selectedLeagueSessionId}/roster`);
              } catch {}
            }}
            onNavigateLeague={(leagueId, subTab) => {
              setSelectedLeagueSessionId(leagueId);
              if (subTab) setSelectedLeagueSubTab(subTab);
              setActiveTab('single_league');
              try {
                window.history.pushState({}, '', `/league/${leagueId}${subTab ? '/' + subTab : ''}`);
              } catch {}
            }}
          />
        )}
        {(activeTab === 'single_league' || activeTab === 'private_league') && (
          <PrivateLeagueHubView
            selectedGame={selectedGame}
            userAccount={userAccount}
            onOpenAuthModal={handleOpenAuth}
            initialSessionId={selectedLeagueSessionId}
            initialSubTab={selectedLeagueSubTab}
            onUpdateUserAccount={handleSaveAccount}
            onOpenProfile={handleOpenProfile}
            onOpenArmory={handleOpenArmory}
            onNavigateLeagues={() => {
              setActiveTab('private_league_hub');
              try {
                window.history.pushState({}, '', '/privateleaguehub');
              } catch {}
            }}
          />
        )}
        </Suspense>
      </main>
      </div>

      <Suspense fallback={null}>
      {/* Global Ctrl+K Dual Link Search Modal */}
      <DualLinkModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* Unified Tool Setup & Data Sync Wizard */}
      <ToolSetupModal
        isOpen={isToolSetupOpen}
        onClose={() => setIsToolSetupOpen(false)}
        userAccount={userAccount}
        selectedGame={selectedGame}
        onNavigateTab={handleSelectTab}
      />

      {/* OAuth & Dynamic Tagging Registration Modal */}
      <AuthRegistrationModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        userAccount={userAccount}
        forceReauth={serverSessionExpired}
        onSaveAccount={handleSaveAccount}
        onSignOut={handleSignOut}
      />
      </Suspense>

    </div>
  );
};

export default App;
