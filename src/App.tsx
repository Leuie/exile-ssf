import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Sidebar } from './components/Sidebar';
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
const CheatSheetsTab = lazyWithRetry(() => import('./components/league/tabs/CheatSheetsTab').then((m) => ({ default: m.CheatSheetsTab })));
const BenchGuideTab = lazyWithRetry(() => import('./components/league/tabs/BenchGuideTab').then((m) => ({ default: m.BenchGuideTab })));
const LabyrinthGuideView = lazyWithRetry(() => import('./components/LabyrinthGuideView').then((m) => ({ default: m.LabyrinthGuideView })));
const CampaignWalkthroughView = lazyWithRetry(() => import('./components/CampaignWalkthroughView').then((m) => ({ default: m.CampaignWalkthroughView })));
const PrivacyPolicyView = lazyWithRetry(() => import('./components/PrivacyPolicyView').then((m) => ({ default: m.PrivacyPolicyView })));
const ToolsDirectoryView = lazyWithRetry(() => import('./components/ToolsDirectoryView').then((m) => ({ default: m.ToolsDirectoryView })));
const PoEWikiWrapperView = lazyWithRetry(() => import('./components/PoEWikiWrapperView').then((m) => ({ default: m.PoEWikiWrapperView })));
const PoEDBWrapperView = lazyWithRetry(() => import('./components/PoEDBWrapperView').then((m) => ({ default: m.PoEDBWrapperView })));
const PoENinjaWrapperView = lazyWithRetry(() => import('./components/PoENinjaWrapperView').then((m) => ({ default: m.PoENinjaWrapperView })));
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
    if (path === '/assets' || path === '/asset-tracker' || path === '/farming' || path === '/drops' || path === '/wealth' || hash === 'assets' || hash === 'farming') {
      return 'asset_tracker';
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
      if (tab === 'private_league_hub' || tab === 'single_league' || tab === 'home') {
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

  const handleSaveAccount = (account: UserAccount, rosterEntry: LeagueRosterMember) => {
    setUserAccount(account);
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
        userAccount={userAccount}
        onOpenAuthModal={handleOpenAuth}
        onOpenProfile={handleOpenProfile}
      />

      {/* Main Content Area: Full Width, Fluid, Springy Utility Layout */}
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
          />
        )}
        {activeTab === 'cheat_sheets' && <CheatSheetsTab selectedGame={selectedGame} userAccount={userAccount} />}
        {activeTab === 'crafting_bench' && <BenchGuideTab selectedGame={selectedGame} userAccount={userAccount} />}
        {activeTab === 'vendor_recipes' && <VendorRecipesView selectedGame={selectedGame} />}
        {activeTab === 'atlas' && <AtlasView selectedGame={selectedGame} userAccount={userAccount} />}
        {activeTab === 'defenses' && <DefenseMechanicsView selectedGame={selectedGame} userAccount={userAccount} />}
        {activeTab === 'offenses' && <OffensesView selectedGame={selectedGame} />}
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

      <Suspense fallback={null}>
      {/* Global Ctrl+K Dual Link Search Modal */}
      <DualLinkModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* OAuth & Dynamic Tagging Registration Modal */}
      <AuthRegistrationModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        userAccount={userAccount}
        onSaveAccount={handleSaveAccount}
        onSignOut={handleSignOut}
      />
      </Suspense>

    </div>
  );
};

export default App;
