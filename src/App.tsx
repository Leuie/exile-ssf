import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { HomeView } from './components/HomeView';
import { VendorRecipesView } from './components/VendorRecipesView';
import { AtlasView } from './components/AtlasView';
import { DefenseMechanicsView } from './components/DefenseMechanicsView';
import { OffensesView } from './components/OffensesView';
import { BuildsShowcaseView } from './components/BuildsShowcaseView';
import { BuildAnalyzerView } from './components/BuildAnalyzerView';
import { LabyrinthGuideView } from './components/LabyrinthGuideView';
import { CampaignWalkthroughView } from './components/CampaignWalkthroughView';
import { ProgressTrackerView } from './components/ProgressTrackerView';
import { ToolsDirectoryView } from './components/ToolsDirectoryView';
import { PoEWikiWrapperView } from './components/PoEWikiWrapperView';
import { PoEDBWrapperView } from './components/PoEDBWrapperView';
import { PoENinjaWrapperView } from './components/PoENinjaWrapperView';
import { PoE2HubView } from './components/PoE2HubView';
import { AboutView } from './components/AboutView';
import { PrivateLeagueHubView } from './components/PrivateLeagueHubView';
import { FeedbackView } from './components/FeedbackView';
import { BuildIngestionView } from './components/BuildIngestionView';
import { DualLinkModal } from './components/DualLinkModal';
import { AuthRegistrationModal } from './components/AuthRegistrationModal';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { AdminPortalPage } from './components/AdminPortalPage';
import { PrivateLeaguesDirectoryView } from './components/PrivateLeaguesDirectoryView';
import { FullGuideReaderView } from './components/FullGuideReaderView';
import { INITIAL_TRACKER_ITEMS } from './data/trackerData';
import { getInitialLeagueRoster, INITIAL_COMMUNITY_GUIDES } from './data/privateLeagueData';
import { saveCloudRosterMember } from './services/cloudSync';
import type { TrackerItem, UserAccount, LeagueRosterMember, LookingForItem, CommunityGuide } from './types';

export const App: React.FC = () => {
  const getInitialLeagueId = (): string => {
    if (typeof window === 'undefined') return 'poe1-330-umbra';
    const path = window.location.pathname.toLowerCase().replace(/\/$/, '');
    const hash = window.location.hash.toLowerCase().replace(/^#\/?/, '').replace(/\/$/, '');

    if (path.startsWith('/league/')) {
      return path.replace('/league/', '');
    }
    if (path.startsWith('/privateleaguehub/') && path !== '/privateleaguehub') {
      return path.replace('/privateleaguehub/', '');
    }
    if (hash.startsWith('league/')) {
      return hash.replace('league/', '');
    }
    if (hash.startsWith('privateleaguehub/') && hash !== 'privateleaguehub') {
      return hash.replace('privateleaguehub/', '');
    }
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const queryId = searchParams.get('league') || searchParams.get('id');
      if (queryId) return queryId;
    } catch {}
    return 'poe1-330-umbra';
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

    return 'home';
  };

  const [selectedGame, setSelectedGame] = useState<'poe1' | 'poe2'>('poe1');
  const [selectedLeagueSessionId, setSelectedLeagueSessionId] = useState<string>(getInitialLeagueId);
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
        } else if (tab === 'home') {
          window.history.pushState({}, '', '/');
        }
      } catch {}
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

  // Calculate live tracker stats for the sidebar badge
  const [trackerItems, setTrackerItems] = useState<TrackerItem[]>(() => {
    try {
      const saved = localStorage.getItem('poe_ssf_tracker_items');
      return saved ? JSON.parse(saved) : INITIAL_TRACKER_ITEMS;
    } catch {
      return INITIAL_TRACKER_ITEMS;
    }
  });

  useEffect(() => {
    const handleStorage = () => {
      try {
        const saved = localStorage.getItem('poe_ssf_tracker_items');
        if (saved) setTrackerItems(JSON.parse(saved));
        const savedUser = localStorage.getItem('poe_umbraleague_user');
        setUserAccount(savedUser ? JSON.parse(savedUser) : null);
      } catch {}
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const trackerStats = {
    completed: trackerItems.filter((i) => i.completed).length,
    total: trackerItems.length
  };

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
      <LoginPage
        onLoginSuccess={(account, roster) => {
          handleSaveAccount(account, roster);
          navigateToRoute('');
        }}
        onNavigateRegister={() => navigateToRoute('register')}
        onNavigateHome={() => navigateToRoute('')}
      />
    );
  }

  if (currentRoute === 'register') {
    return (
      <RegisterPage
        onRegisterSuccess={(account, roster) => {
          handleSaveAccount(account, roster);
          navigateToRoute('');
        }}
        onNavigateLogin={() => navigateToRoute('login')}
        onNavigateHome={() => navigateToRoute('')}
      />
    );
  }

  if (currentRoute === 'admin') {
    return (
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
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors duration-200 flex flex-col lg:flex-row relative overflow-x-hidden">
      
      {/* Left Collapsible Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleSelectTab}
        selectedGame={selectedGame}
        setSelectedGame={setSelectedGame}
        openSearch={() => setIsSearchOpen(true)}
        trackerStats={trackerStats}
        userAccount={userAccount}
        onOpenAuthModal={handleOpenAuth}
      />

      {/* Main Content Area: Full Width, Fluid, Springy Utility Layout */}
      <main className={`flex-1 min-w-0 transition-all duration-300 ease-in-out w-full ${
          activeTab === 'single_league' || activeTab === 'private_league' 
            ? 'p-0 max-w-none' 
            : 'p-3 sm:p-5 lg:p-6 max-w-[1700px] w-full mx-auto'
        }`}>
        {(activeTab === 'home' || activeTab === 'manifesto') && <HomeView onNavigate={handleSelectTab} />}
        {activeTab === 'vendor_recipes' && <VendorRecipesView />}
        {activeTab === 'atlas' && <AtlasView />}
        {activeTab === 'defenses' && <DefenseMechanicsView />}
        {activeTab === 'offenses' && <OffensesView />}
        {activeTab === 'builds' && <BuildsShowcaseView />}
        {activeTab === 'build_doctor' && <BuildAnalyzerView />}
        {activeTab === 'labyrinth' && <LabyrinthGuideView />}
        {activeTab === 'campaign' && <CampaignWalkthroughView />}
        {activeTab === 'tracker' && <ProgressTrackerView />}
        {activeTab === 'tools_directory' && <ToolsDirectoryView />}
        {activeTab === 'poewiki' && <PoEWikiWrapperView initialUrl="https://www.poewiki.net/" title="PoEWiki Portal" isPoE2={false} />}
        {activeTab === 'poedb' && <PoEDBWrapperView initialUrl="https://poedb.tw/us/" title="PoEDB Portal" isPoE2={false} />}
        {activeTab === 'poe_ninja' && <PoENinjaWrapperView />}
        {activeTab === 'poe2_hub' && <PoE2HubView />}
        {activeTab === 'poe2_wiki' && <PoEWikiWrapperView initialUrl="https://www.poe2wiki.net/" title="PoE 2 Wiki Portal" isPoE2={true} />}
        {activeTab === 'poe2_db' && <PoEDBWrapperView initialUrl="https://poe2db.tw/us/" title="PoE 2 DB Portal" isPoE2={true} />}
        {activeTab === 'about' && <AboutView />}
        {activeTab === 'feedback' && (
          <FeedbackView
            userAccount={userAccount}
            onOpenAuthModal={handleOpenAuth}
          />
        )}
        {activeTab === 'build_ingest' && (
          <BuildIngestionView
            userAccount={userAccount}
            onNavigateToGuides={() => handleSelectTab('builds')}
          />
        )}
        {(activeTab === 'private_league_hub' || activeTab === 'private_leagues') && (
          <PrivateLeaguesDirectoryView
            userAccount={userAccount}
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
        {(activeTab === 'single_league' || activeTab === 'private_league') && (
          <PrivateLeagueHubView
            selectedGame={selectedGame}
            userAccount={userAccount}
            onOpenAuthModal={handleOpenAuth}
            initialSessionId={selectedLeagueSessionId}
            onUpdateUserAccount={handleSaveAccount}
            onNavigateLeagues={() => {
              setActiveTab('private_league_hub');
              try {
                window.history.pushState({}, '', '/privateleaguehub');
              } catch {}
            }}
          />
        )}
      </main>

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

    </div>
  );
};

export default App;
