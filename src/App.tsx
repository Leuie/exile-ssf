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
import { INITIAL_TRACKER_ITEMS } from './data/trackerData';
import type { TrackerItem, UserAccount, LeagueRosterMember } from './types';

export const App: React.FC = () => {
  const [selectedGame, setSelectedGame] = useState<'poe1' | 'poe2'>('poe1');
  const [activeTab, setActiveTab] = useState<string>('home');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // User Account & League Registration state with Dynamic Tagging
  const [userAccount, setUserAccount] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem('poe_umbraleague_user');
      if (saved) return JSON.parse(saved);
      // Default to Leuie (the Host/Admin) on the root app
      return {
        id: 'usr-leuie',
        provider: 'poe',
        displayName: 'Leuie',
        preferredContact: 'app',
        poeAccountName: 'Leuie#0001',
        characterName: 'Leuie_UmbraIgnite',
        discordName: '@leuie',
        className: 'Witch',
        ascendancy: 'Elementalist',
        leagueMode: 'Private',
        availableAtLaunch: 'Yes',
        level: 95,
        buildName: 'Penance Brand Ignite 4 Golem & Triple Herald Autobomber',
        pobUrl: 'https://pobb.in/',
        atlasContent: ['Betrayal', 'Essences', 'Expedition', 'Searing Exarch'],
        notes: 'League Host & Admin! Farming Essence of Horror, Elder helmets, and Betrayal unveils.',
        inviteStatus: 'Accepted',
        registeredAt: '2026-11-01'
      };
    } catch {
      return null;
    }
  });

  const handleSaveAccount = (account: UserAccount, rosterEntry: LeagueRosterMember) => {
    setUserAccount(account);
    try {
      localStorage.setItem('poe_umbraleague_user', JSON.stringify(account));
      // Also sync into poe_umbraleague_roster
      const savedRoster = localStorage.getItem('poe_umbraleague_roster');
      const rosterList: LeagueRosterMember[] = savedRoster ? JSON.parse(savedRoster) : [];
      const index = rosterList.findIndex(
        (m) =>
          m.poeAccountName.toLowerCase() === account.poeAccountName.toLowerCase() ||
          m.displayName.toLowerCase() === account.displayName.toLowerCase()
      );
      if (index >= 0) {
        rosterList[index] = rosterEntry;
      } else {
        rosterList.unshift(rosterEntry);
      }
      localStorage.setItem('poe_umbraleague_roster', JSON.stringify(rosterList));
    } catch {}
  };

  const handleSignOut = () => {
    setUserAccount(null);
    try {
      localStorage.removeItem('poe_umbraleague_user');
    } catch {}
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
        if (savedUser) setUserAccount(JSON.parse(savedUser));
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

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors duration-200 flex flex-col lg:flex-row relative overflow-x-hidden">
      
      {/* Left Collapsible Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedGame={selectedGame}
        setSelectedGame={setSelectedGame}
        openSearch={() => setIsSearchOpen(true)}
        trackerStats={trackerStats}
        userAccount={userAccount}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Main Content Area: Full Width, Fluid, Springy Utility Layout */}
      <main className={`flex-1 min-w-0 transition-all duration-300 ease-in-out w-full ${
          activeTab === 'private_league' 
            ? 'p-0 max-w-none' 
            : 'p-3 sm:p-5 lg:p-6 max-w-[1700px] w-full mx-auto'
        }`}>
        {(activeTab === 'home' || activeTab === 'manifesto') && <HomeView onNavigate={setActiveTab} />}
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
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />
        )}
        {activeTab === 'build_ingest' && (
          <BuildIngestionView
            userAccount={userAccount}
            onNavigateToGuides={() => setActiveTab('builds')}
          />
        )}
        {activeTab === 'private_league' && (
          <PrivateLeagueHubView
            selectedGame={selectedGame}
            userAccount={userAccount}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
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
