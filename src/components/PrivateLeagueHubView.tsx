import React, { useState, useEffect, useId, useRef, lazy, Suspense } from 'react';
import {
  DownloadCloud,
  Users,
  ExternalLink,
  ShieldCheck,
  Flame,
  CheckCircle2,
  Copy,
  BookOpen,
  Compass,
  Scroll,
  MessageSquare,
  History,
  Globe,
  AtSign,
  Sparkles,
  RotateCcw,
  Send,
  AlertTriangle,
  Archive,
  ArrowLeft,
  Share2,
  UserPlus,
  Trophy,
  Search,
  Coins,
  Activity,
  X
} from 'lucide-react';
import {
  ACTIVE_LEAGUE_SESSIONS,
  getAllActiveLeagueSessions,
  NOIR_ALUMNI_PARTICIPANTS,
  COVEN_OF_UMBRA_INFO,
  POE2_ANCIENTS_INFO,
  POE2_ASCENDANCY_CATALOG,
  PAST_NOIR_LEAGUES,
  NOIR_LEAGUE_FAQ,
  ASCENDANCY_CATALOG,
  getInitialLeagueRoster,
  INITIAL_LOOKING_FOR_ITEMS,
  INITIAL_COMMUNITY_GUIDES
} from '../data/privateLeagueData';
import type {
  LeagueParticipantAlumnus,
  ActiveLeagueSession,
  LeagueRosterMember,
  LookingForItem,
  CommunityGuide,
  UserAccount,
  PastPrivateLeague,
  PersistentAchievementProfile,
  SquadServiceListing,
  PlayerVouch,
  FreeStashDrop,
  BossRotaListing,
  LeagueFirstMilestone,
  LeagueFeedEvent
} from '../types';
import { fireConfetti } from '../utils/confetti';
import type { ManagerSectionType } from './LeagueContentManagerModal';
const LeagueContentManagerModal = lazy(() => import('./LeagueContentManagerModal').then((m) => ({ default: m.LeagueContentManagerModal })));
const FullGuideReaderView = lazy(() => import('./FullGuideReaderView').then((m) => ({ default: m.FullGuideReaderView })));
const WishlistsTab = lazy(() => import('./league/tabs/WishlistsTab').then((m) => ({ default: m.WishlistsTab })));
const RosterTab = lazy(() => import('./league/tabs/RosterTab').then((m) => ({ default: m.RosterTab })));
const CommandCenterTab = lazy(() => import('./league/tabs/CommandCenterTab').then((m) => ({ default: m.CommandCenterTab })));
const CheatSheetsTab = lazy(() => import('./league/tabs/CheatSheetsTab').then((m) => ({ default: m.CheatSheetsTab })));
const BuildGuidesTab = lazy(() => import('./league/tabs/BuildGuidesTab').then((m) => ({ default: m.BuildGuidesTab })));
const BenchGuideTab = lazy(() => import('./league/tabs/BenchGuideTab').then((m) => ({ default: m.BenchGuideTab })));
const AlumniTab = lazy(() => import('./league/tabs/AlumniTab').then((m) => ({ default: m.AlumniTab })));
const BountiesAndHonorsTab = lazy(() => import('./league/tabs/BountiesAndHonorsTab').then((m) => ({ default: m.BountiesAndHonorsTab })));
const FeedTab = lazy(() => import('./league/tabs/FeedTab').then((m) => ({ default: m.FeedTab })));
import {
  fetchCloudLeagueData,
  saveCloudWishlistItem,
  saveCloudRosterMember,
  saveCloudGuide,
  saveCloudAlumniList,
  saveCloudLeagueMeta,
  fetchCloudLeagues,
  saveCloudStashDrop,
  deleteCloudStashDrop,
  saveCloudBossRota,
  deleteCloudBossRota,
  saveCloudLeagueFirst,
  saveCloudFeedEvent,
  saveCloudAchievementProfile,
  fetchCloudProfile,
  saveCloudProfile
} from '../services/cloudSync';
import { getLeagueJoinAchievementDef, formatLeagueLabel } from '../utils/achievements';
import { parsePoeClipboardTooltip } from '../utils/poeItemParser';

interface PrivateLeagueHubViewProps {
  userAccount?: UserAccount | null;
  onOpenAuthModal?: () => void;
  selectedGame?: 'poe1' | 'poe2';
  initialSessionId?: string;
  initialSubTab?: string;
  onUpdateUserAccount?: (account: UserAccount, rosterEntry: LeagueRosterMember) => void;
  onNavigateLeagues?: () => void;
  onOpenProfile?: (handle: string) => void;
}

export const PrivateLeagueHubView: React.FC<PrivateLeagueHubViewProps> = ({
  userAccount,
  onOpenAuthModal,
  selectedGame = 'poe1',
  initialSessionId,
  initialSubTab,
  onUpdateUserAccount,
  onNavigateLeagues,
  onOpenProfile
}) => {
  // Horizontal Nav Tabs
  type HubTab = 'overview' | 'feed' | 'looking_for' | 'bounties' | 'roster' | 'guides' | 'cheatsheets' | 'new_player' | 'alumni';

  const TAB_SLUG_MAP: Record<HubTab, string> = {
    overview: 'command-center',
    feed: 'feed',
    looking_for: 'wishlists',
    bounties: 'bounties',
    roster: 'roster',
    guides: 'guides',
    cheatsheets: 'cheatsheets',
    new_player: 'bench',
    alumni: 'alumni'
  };

  const resolveSlugToTab = (slug?: string): HubTab => {
    if (!slug) return 'overview';
    const clean = slug.toLowerCase().trim();
    if (clean === 'command-center' || clean === 'commandcenter' || clean === 'overview') return 'overview';
    if (clean === 'feed' || clean === 'activity' || clean === 'wall') return 'feed';
    if (clean === 'wishlists' || clean === 'wishlist' || clean === 'needs' || clean === 'wishlists-needs' || clean === 'looking_for' || clean === 'looking-for') return 'looking_for';
    if (clean === 'bounties' || clean === 'bounty' || clean === 'honors' || clean === 'achievements' || clean === 'rewards') return 'bounties';
    if (clean === 'roster' || clean === 'roster-directory' || clean === 'directory') return 'roster';
    if (clean === 'guides' || clean === 'build-guides' || clean === 'buildguides') return 'guides';
    if (clean === 'cheatsheets' || clean === 'cheat-sheets' || clean === 'mechanics' || clean === 'mechanic-cheat-sheets') return 'cheatsheets';
    if (clean === 'bench' || clean === 'bench-stash-guide' || clean === 'new_player' || clean === 'new-player' || clean === 'stash') return 'new_player';
    if (clean === 'alumni' || clean === 'alumni-directory') return 'alumni';
    return 'overview';
  };

  const getInitialTabFromLocation = (): HubTab => {
    if (initialSubTab) return resolveSlugToTab(initialSubTab);
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase().replace(/\/$/, '');
      const hash = window.location.hash.toLowerCase().replace(/^#\/?/, '').replace(/\/$/, '');
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const queryTab = searchParams.get('tab') || searchParams.get('page');
        if (queryTab) return resolveSlugToTab(queryTab);
      } catch {}
      if (path.startsWith('/league/')) {
        const parts = path.replace('/league/', '').split('/');
        if (parts[1]) return resolveSlugToTab(parts[1]);
      }
      if (hash.startsWith('league/')) {
        const parts = hash.replace('league/', '').split('/');
        if (parts[1]) return resolveSlugToTab(parts[1]);
      }
    }
    return 'overview';
  };

  const [activeTab, setActiveTab] = useState<HubTab>(getInitialTabFromLocation);
  const [wishlistJumpQuery, setWishlistJumpQuery] = useState<string | null>(null);
  const [dropCheckQuery, setDropCheckQuery] = useState<string>('');
  const dropCheckDialogRef = useRef<HTMLDialogElement>(null);

  const handleOpenDropCheck = () => {
    setDropCheckQuery('');
    dropCheckDialogRef.current?.showModal();
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleOpenDropCheck();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (initialSubTab) {
      setActiveTab(resolveSlugToTab(initialSubTab));
    }
  }, [initialSubTab]);

  useEffect(() => {
    const titles: Record<HubTab, string> = {
      overview: 'Command Center',
      feed: 'Feed',
      looking_for: 'Wishlists',
      bounties: 'Bounties',
      roster: 'Roster',
      guides: 'Builds',
      cheatsheets: 'Cheat Sheets',
      new_player: 'Crafting Bench',
      alumni: 'Alumni'
    };
    document.title = `${titles[activeTab]} | Exile SSF`;
  }, [activeTab]);

  const [activeReadingGuide, setActiveReadingGuide] = useState<CommunityGuide | null>(null);

  // Roster State
  const [roster, setRoster] = useState<LeagueRosterMember[]>(() => {
    try {
      const saved = localStorage.getItem('poe_clean330_roster');
      if (saved) {
        const parsed: LeagueRosterMember[] = JSON.parse(saved);
        const seedList = getInitialLeagueRoster();
        for (const s of seedList) {
          if (!parsed.some((m) => m.displayName.toLowerCase() === s.displayName.toLowerCase())) {
            parsed.push(s);
          }
        }
        parsed.forEach((m, idx) => {
          m.slotNumber = idx + 1;
        });
        return parsed;
      }
      return getInitialLeagueRoster();
    } catch {
      return getInitialLeagueRoster();
    }
  });

  // Looking For Items State
  const [lookingForItems, setLookingForItems] = useState<LookingForItem[]>(() => {
    try {
      const saved = localStorage.getItem('poe_clean330_looking_for');
      let deletedIds: string[] = [];
      try {
        const delRaw = localStorage.getItem('poe_clean330_looking_for_deleted');
        if (delRaw) deletedIds = JSON.parse(delRaw);
      } catch {}

      if (saved) {
        const parsed: LookingForItem[] = JSON.parse(saved);
        for (const item of INITIAL_LOOKING_FOR_ITEMS) {
          if (deletedIds.includes(item.id)) continue;
          if (
            !parsed.some(
              (p) =>
                p.id === item.id ||
                (p.itemName.toLowerCase() === item.itemName.toLowerCase() &&
                  p.displayName?.toLowerCase() === item.displayName?.toLowerCase())
            )
          ) {
            parsed.push(item);
          }
        }
        return parsed;
      }
      return INITIAL_LOOKING_FOR_ITEMS.filter((it) => !deletedIds.includes(it.id));
    } catch {
      return INITIAL_LOOKING_FOR_ITEMS;
    }
  });

  // Community Guides State
  const [guides, setGuides] = useState<CommunityGuide[]>(() => {
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

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('poe_clean330_roster', JSON.stringify(roster));
    } catch {}
  }, [roster]);

  useEffect(() => {
    try {
      localStorage.setItem('poe_clean330_looking_for', JSON.stringify(lookingForItems));
    } catch {}
  }, [lookingForItems]);

  useEffect(() => {
    try {
      localStorage.setItem('poe_umbraleague_guides', JSON.stringify(guides));
    } catch {}
  }, [guides]);

  // Active League Session & Concurrent Leagues
  const [allLeagueSessions, setAllLeagueSessions] = useState<ActiveLeagueSession[]>(getAllActiveLeagueSessions);

  useEffect(() => {
    const handleStorage = () => {
      setAllLeagueSessions(getAllActiveLeagueSessions());
      try {
        const saved = localStorage.getItem('poe_clean330_roster');
        if (saved) setRoster(JSON.parse(saved));
      } catch {}
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const [activeSessionId, setActiveSessionId] = useState<string>(() =>
    initialSessionId || (selectedGame === 'poe2' ? 'poe2-ea-ancients' : 'poe1-330-umbra')
  );

  useEffect(() => {
    if (initialSessionId) {
      const matched = allLeagueSessions.find((s) => s.id === initialSessionId);
      if (matched && (matched.game || 'poe1') === selectedGame) {
        setActiveSessionId(initialSessionId);
        return;
      }
    }
    setActiveSessionId(selectedGame === 'poe2' ? 'poe2-ea-ancients' : 'poe1-330-umbra');
  }, [selectedGame, initialSessionId, allLeagueSessions]);

  const handleSelectTab = (tab: HubTab) => {
    setActiveTab(tab);
    const slug = TAB_SLUG_MAP[tab] || 'command-center';
    try {
      const targetUrl = `/league/${activeSessionId}/${slug}`;
      if (window.location.pathname !== targetUrl) {
        window.history.pushState({}, '', targetUrl);
      }
    } catch {}
  };

  useEffect(() => {
    const onLocationSync = () => {
      setActiveTab(getInitialTabFromLocation());
    };
    window.addEventListener('popstate', onLocationSync);
    window.addEventListener('hashchange', onLocationSync);
    return () => {
      window.removeEventListener('popstate', onLocationSync);
      window.removeEventListener('hashchange', onLocationSync);
    };
  }, [activeSessionId]);

  const currentSession = allLeagueSessions.find((s: ActiveLeagueSession) => s.id === activeSessionId) || allLeagueSessions[0] || ACTIVE_LEAGUE_SESSIONS[0];
  const isReadOnlyLeague = Boolean(currentSession.isReadOnlyArchive);

  // Cloudflare KV Cloud Sync State & Periodic Listener
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'connected' | 'syncing' | 'idle' | 'offline'>('idle');
  const [cloudAchievements, setCloudAchievements] = useState<Record<string, PersistentAchievementProfile>>({});
  const [squadServices, setSquadServices] = useState<SquadServiceListing[]>([]);
  const [playerVouches, setPlayerVouches] = useState<PlayerVouch[]>([]);
  const [stashDrops, setStashDrops] = useState<FreeStashDrop[]>([]);
  const [bossRotas, setBossRotas] = useState<BossRotaListing[]>([]);
  const [leagueFirsts, setLeagueFirsts] = useState<LeagueFirstMilestone[]>([]);
  const [activityFeed, setActivityFeed] = useState<LeagueFeedEvent[]>([]);

  const emitFeedEvent = (partial: Omit<LeagueFeedEvent, 'id' | 'leagueId' | 'createdAtIso'>) => {
    const ev: LeagueFeedEvent = {
      ...partial,
      id: `feed_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      leagueId: activeSessionId,
      createdAtIso: new Date().toISOString()
    };
    setActivityFeed((prev) => [ev, ...prev].slice(0, 100));
    saveCloudFeedEvent(activeSessionId, ev);
  };

  const handleCheerFeedEvent = (ev: LeagueFeedEvent) => {
    const me = userAccount?.displayName || 'Exile';
    const currentCheers = Array.isArray(ev.cheers) ? ev.cheers : [];
    const has = currentCheers.some((c) => c.toLowerCase() === me.toLowerCase());
    const nextCheers = has
      ? currentCheers.filter((c) => c.toLowerCase() !== me.toLowerCase())
      : [...currentCheers, me];
    const updated: LeagueFeedEvent = { ...ev, cheers: nextCheers };
    setActivityFeed((prev) => {
      const exists = prev.some((x) => x.id === ev.id);
      return exists ? prev.map((x) => (x.id === ev.id ? updated : x)) : [updated, ...prev];
    });
    saveCloudFeedEvent(activeSessionId, updated);
  };

  const handleCommentFeedEvent = (ev: LeagueFeedEvent, commentText: string) => {
    const clean = commentText.trim();
    if (!clean) return;
    const author = userAccount?.displayName || 'Exile';
    const newComment = {
      id: `cmt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      authorHandle: author,
      text: clean,
      createdAtIso: new Date().toISOString()
    };
    const updated: LeagueFeedEvent = {
      ...ev,
      comments: [...(Array.isArray(ev.comments) ? ev.comments : []), newComment]
    };
    setActivityFeed((prev) => {
      const exists = prev.some((x) => x.id === ev.id);
      return exists ? prev.map((x) => (x.id === ev.id ? updated : x)) : [updated, ...prev];
    });
    saveCloudFeedEvent(activeSessionId, updated);
  };

  const [lastSeenFeedAt, setLastSeenFeedAt] = useState<string | null>(null);
  const [visitBaselineFeedAt, setVisitBaselineFeedAt] = useState<string | null>(null);
  const [cachedCloudProfile, setCachedCloudProfile] = useState<any>(null);

  useEffect(() => {
    if (!userAccount?.displayName) return;
    let cancelled = false;
    fetchCloudProfile(userAccount.displayName).then((res) => {
      if (!cancelled && res?.profile) {
        setCachedCloudProfile(res.profile);
        if (res.profile.lastSeenFeedAt) {
          setLastSeenFeedAt(res.profile.lastSeenFeedAt);
          setVisitBaselineFeedAt((prev) => prev || res.profile.lastSeenFeedAt || null);
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, [userAccount?.displayName]);

  const unreadFeedCount = React.useMemo(() => {
    const myLower = userAccount?.displayName?.trim().toLowerCase() || '';
    return activityFeed.filter((ev) => {
      if (myLower && ev.actorHandle.toLowerCase() === myLower) return false;
      if (!lastSeenFeedAt) return true;
      return ev.createdAtIso > lastSeenFeedAt;
    }).length;
  }, [activityFeed, lastSeenFeedAt, userAccount?.displayName]);

  useEffect(() => {
    if (activeTab !== 'feed') return;
    const nowIso = new Date().toISOString();
    setVisitBaselineFeedAt((prev) => prev || lastSeenFeedAt);
    setLastSeenFeedAt(nowIso);
    if (userAccount?.displayName) {
      const baseProfile = cachedCloudProfile || { handle: userAccount.displayName, uid: 'EXILE-USER' };
      const updatedProfile = { ...baseProfile, lastSeenFeedAt: nowIso };
      setCachedCloudProfile(updatedProfile);
      saveCloudProfile(updatedProfile);
    }
  }, [activeTab]);

  useEffect(() => {
    let isCancelled = false;

    const syncFromCloud = async () => {
      const data = await fetchCloudLeagueData(activeSessionId);
      if (isCancelled || !data) {
        return;
      }

      if (data.status === 'connected') {
        setCloudSyncStatus('connected');
        if (Array.isArray(data.wishlist)) {
          setLookingForItems(data.wishlist);
        }
        if (Array.isArray(data.roster) && data.roster.length > 0) {
          setRoster(data.roster);
        }
        if (Array.isArray(data.guides) && data.guides.length > 0) {
          setGuides(data.guides);
        }
        if (data.achievements && typeof data.achievements === 'object') {
          setCloudAchievements(data.achievements);
        }
        if (Array.isArray(data.services)) {
          setSquadServices(data.services);
        }
        if (Array.isArray(data.vouches)) {
          setPlayerVouches(data.vouches);
        }
        if (Array.isArray(data.stashDrops)) {
          setStashDrops(data.stashDrops);
        }
        if (Array.isArray(data.bossRotas)) {
          setBossRotas(data.bossRotas);
        }
        if (Array.isArray(data.leagueFirsts)) {
          setLeagueFirsts(data.leagueFirsts);
        }
        if (Array.isArray(data.activityFeed)) {
          setActivityFeed(data.activityFeed);
        }
        if (Array.isArray(data.alumni) && data.alumni.length > 0) {
          setAlumniList(data.alumni);
        }
        if (data.meta && typeof data.meta === 'object') {
          if (Array.isArray(data.meta.quickLinks)) setQuickLinks(data.meta.quickLinks);
          if (Array.isArray(data.meta.faqList)) setFaqList(data.meta.faqList);
          if (Array.isArray(data.meta.archivesList)) setArchivesList(data.meta.archivesList);
        }
      }
    };

    syncFromCloud();
    fetchCloudLeagues().then((cloudLeagues) => {
      if (!isCancelled && cloudLeagues && cloudLeagues.length > 0) {
        setAllLeagueSessions((prev) => {
          const merged = [...prev];
          for (const cl of cloudLeagues) {
            if (!merged.some((m) => m.id === cl.id)) merged.push(cl);
          }
          return merged;
        });
      }
    });
    const timer = setInterval(() => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') {
        syncFromCloud();
      }
    }, 18000);

    const handleFocusOrVisible = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        syncFromCloud();
      }
    };

    window.addEventListener('focus', handleFocusOrVisible);
    document.addEventListener('visibilitychange', handleFocusOrVisible);

    return () => {
      isCancelled = true;
      clearInterval(timer);
      window.removeEventListener('focus', handleFocusOrVisible);
      document.removeEventListener('visibilitychange', handleFocusOrVisible);
    };
  }, [activeSessionId]);

  // Synchronize userAccount character updates directly into roster state
  useEffect(() => {
    if (!userAccount) return;
    setRoster((prev) => {
      const idx = prev.findIndex(
        (m) =>
          (userAccount.id && m.id === userAccount.id) ||
          m.displayName.toLowerCase() === userAccount.displayName.toLowerCase()
      );
      if (idx >= 0) {
        const current = prev[idx];
        if (
          current.poeAccountName !== userAccount.poeAccountName ||
          current.characterName !== userAccount.characterName ||
          current.buildName !== userAccount.buildName ||
          current.ascendancy !== userAccount.ascendancy ||
          current.level !== userAccount.level
        ) {
          const next = [...prev];
          next[idx] = {
            ...current,
            poeAccountName: userAccount.poeAccountName || current.poeAccountName,
            characterName: userAccount.characterName || current.characterName,
            buildName: userAccount.buildName || current.buildName,
            ascendancy: userAccount.ascendancy || current.ascendancy,
            className: userAccount.className || current.className,
            level: Number(userAccount.level) || current.level,
            pobUrl: userAccount.pobUrl || current.pobUrl,
            notes: userAccount.notes || current.notes,
            atlasContent: userAccount.atlasContent || current.atlasContent,
            preferredContact: userAccount.preferredContact || current.preferredContact
          };
          try {
            localStorage.setItem('poe_clean330_roster', JSON.stringify(next));
          } catch {}
          return next;
        }
      }
      return prev;
    });
  }, [userAccount]);

  const isPoE2Session = activeSessionId === 'poe2-ea-ancients' || selectedGame === 'poe2';
  const currentInfo = isPoE2Session ? POE2_ANCIENTS_INFO : COVEN_OF_UMBRA_INFO;
  const currentAscendancyCatalog = isPoE2Session ? POE2_ASCENDANCY_CATALOG : ASCENDANCY_CATALOG;

  // Editable Resources, FAQs, and Archives State
  const [quickLinks, setQuickLinks] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('poe_league_quick_links');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.length >= COVEN_OF_UMBRA_INFO.quickLinks.length) return parsed;
      }
    } catch {}
    return COVEN_OF_UMBRA_INFO.quickLinks;
  });

  const [archivesList, setArchivesList] = useState<PastPrivateLeague[]>(() => {
    try {
      const saved = localStorage.getItem('poe_league_archives');
      if (saved) return JSON.parse(saved);
    } catch {}
    return PAST_NOIR_LEAGUES;
  });

  const [faqList, setFaqList] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('poe_league_faqs');
      if (saved) return JSON.parse(saved);
    } catch {}
    return NOIR_LEAGUE_FAQ;
  });

  const [isManagerModalOpen, setIsManagerModalOpen] = useState<boolean>(false);
  const [managerInitialSection, setManagerInitialSection] = useState<ManagerSectionType>('links');

  const openManagerModal = (sec: ManagerSectionType) => {
    setManagerInitialSection(sec);
    setIsManagerModalOpen(true);
  };

  const handleSaveQuickLinks = (links: any[]) => {
    setQuickLinks(links);
    saveCloudLeagueMeta(activeSessionId, { quickLinks: links });
    setCopyNotice('Resource links synced to cloud!');
    setTimeout(() => setCopyNotice(null), 2500);
  };

  const handleSaveFaqList = (faqs: any[]) => {
    setFaqList(faqs);
    saveCloudLeagueMeta(activeSessionId, { faqList: faqs });
    setCopyNotice('F.A.Q. list synced to cloud!');
    setTimeout(() => setCopyNotice(null), 2500);
  };

  const handleSaveArchivesList = (archives: any[]) => {
    setArchivesList(archives);
    saveCloudLeagueMeta(activeSessionId, { archivesList: archives });
    setCopyNotice('Archives list synced to cloud!');
    setTimeout(() => setCopyNotice(null), 2500);
  };

  const handleResetSection = (sec: ManagerSectionType) => {
    if (sec === 'links') {
      setQuickLinks(COVEN_OF_UMBRA_INFO.quickLinks);
      saveCloudLeagueMeta(activeSessionId, { quickLinks: COVEN_OF_UMBRA_INFO.quickLinks });
    } else if (sec === 'faq') {
      setFaqList(NOIR_LEAGUE_FAQ);
      saveCloudLeagueMeta(activeSessionId, { faqList: NOIR_LEAGUE_FAQ });
    } else if (sec === 'archives') {
      setArchivesList(PAST_NOIR_LEAGUES);
      saveCloudLeagueMeta(activeSessionId, { archivesList: PAST_NOIR_LEAGUES });
    }
    setCopyNotice('Restored cloud defaults for ' + sec);
    setTimeout(() => setCopyNotice(null), 2500);
  };

  // Dynamic Private League Ingestion & Crowdfund Sync State
  const [showIngestLeagueModal, setShowIngestLeagueModal] = useState<boolean>(false);
  const ingestLeagueDialogRef = useRef<HTMLDialogElement>(null);
  const ingestLeagueTitleId = useId();

  const sanitizeSyncedData = (data: any) => {
    if (!data) return null;
    const clean = { ...data };
    if (clean.crowdfundPointsCurrent === 1850 && clean.crowdfundPointsGoal === 3000) {
      clean.crowdfundPointsCurrent = 0;
      clean.crowdfundPointsGoal = 0;
    }
    if (clean.currentSlots === 30 && (!clean.officialLeagueUrl || clean.officialLeagueUrl.includes('Ravenwatch'))) {
      clean.currentSlots = 10;
    }
    if (clean.fundedDays === 20 && (!clean.officialLeagueUrl || clean.officialLeagueUrl.includes('Ravenwatch'))) {
      clean.fundedDays = 10;
      clean.targetDays = 10;
    }
    return clean;
  };

  const [syncedLeagueData, setSyncedLeagueData] = useState<any>(() => {
    try {
      const saved = localStorage.getItem(`poe_league_sync_${activeSessionId}`);
      return saved ? sanitizeSyncedData(JSON.parse(saved)) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`poe_league_sync_${activeSessionId}`);
      setSyncedLeagueData(saved ? sanitizeSyncedData(JSON.parse(saved)) : null);
    } catch {}
  }, [activeSessionId]);

  // Merge synced data with currentInfo
  const activeLeagueInfo = {
    ...currentInfo,
    ...(syncedLeagueData || {})
  };

  // Ingest form inputs
  const [formOfficialUrl, setFormOfficialUrl] = useState<string>(activeLeagueInfo.officialLeagueUrl || '');
  const [formFundedDays, setFormFundedDays] = useState<number>(activeLeagueInfo.fundedDays || 10);
  const [formTargetDays, setFormTargetDays] = useState<number>(activeLeagueInfo.targetDays || 10);
  const [formPointsCurrent, setFormPointsCurrent] = useState<number>(activeLeagueInfo.crowdfundPointsCurrent ?? 0);
  const [formPointsGoal, setFormPointsGoal] = useState<number>(activeLeagueInfo.crowdfundPointsGoal ?? 0);
  const [formSlots, setFormSlots] = useState<number>(activeLeagueInfo.currentSlots || 10);
  const [formCrowdfundStatus, setFormCrowdfundStatus] = useState<string>(syncedLeagueData?.crowdfundStatus || 'Active League (Base Slots Funded)');
  const [rawSnippet, setRawSnippet] = useState<string>('');

  const handleOpenIngestModal = () => {
    setFormOfficialUrl(activeLeagueInfo.officialLeagueUrl || 'https://www.pathofexile.com/private-leagues/league/Ravenwatch+Covens+of+Umbra+GSF');
    setFormFundedDays(activeLeagueInfo.fundedDays || 10);
    setFormTargetDays(activeLeagueInfo.targetDays || 10);
    setFormPointsCurrent(activeLeagueInfo.crowdfundPointsCurrent ?? 0);
    setFormPointsGoal(activeLeagueInfo.crowdfundPointsGoal ?? 0);
    setFormSlots(activeLeagueInfo.currentSlots || 10);
    setFormCrowdfundStatus(activeLeagueInfo.crowdfundStatus || 'Active League (Base Slots Funded)');
    setShowIngestLeagueModal(true);
    setTimeout(() => {
      ingestLeagueDialogRef.current?.showModal();
    }, 10);
  };

  const handleParseSnippet = () => {
    if (!rawSnippet.trim()) return;

    // Extract players / slots: e.g. "Players: 4 / 10" or "10 slots"
    const playersMatch = rawSnippet.match(/Players:\s*(\d+)\s*\/\s*(\d+)/i);
    if (playersMatch) {
      setFormSlots(parseInt(playersMatch[2], 10));
    } else {
      const slotMatch = rawSnippet.match(/(\d+)\s*(?:player slots?|slots?)/i);
      if (slotMatch) setFormSlots(parseInt(slotMatch[1], 10));
    }

    // Extract days or remaining duration: e.g. "Remaining Duration: 2 days 17 hours"
    const dayMatch = rawSnippet.match(/(?:Remaining Duration:\s*)?(\d+)\s*days/i);
    if (dayMatch) {
      setFormFundedDays(parseInt(dayMatch[1], 10));
      setFormTargetDays(Math.max(formTargetDays, parseInt(dayMatch[1], 10)));
    }

    // Extract points if an active crowdfund points drive exists
    const pointsMatch = rawSnippet.match(/([\d,]+)\s*\/\s*([\d,]+)\s*points/i);
    if (pointsMatch) {
      setFormPointsCurrent(parseInt(pointsMatch[1].replace(/,/g, ''), 10));
      setFormPointsGoal(parseInt(pointsMatch[2].replace(/,/g, ''), 10));
    } else {
      setFormPointsCurrent(0);
      setFormPointsGoal(0);
    }

    // Extract URL
    const urlMatch = rawSnippet.match(/https:\/\/(?:www\.)?pathofexile\.com\/private-leagues\/league\/[^\s"']+/i);
    if (urlMatch) {
      setFormOfficialUrl(urlMatch[0]);
    } else if (rawSnippet.includes('PL87651')) {
      setFormOfficialUrl('https://www.pathofexile.com/private-leagues/league/Ravenwatch+Covens+of+Umbra+GSF');
    }

    setCopyNotice('Parsed snippet details into form!');
    setTimeout(() => setCopyNotice(null), 2500);
  };

  const handleSaveSyncedLeague = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedData = {
      officialLeagueUrl: formOfficialUrl.trim(),
      fundedDays: formFundedDays,
      targetDays: formTargetDays,
      crowdfundPointsCurrent: formPointsCurrent,
      crowdfundPointsGoal: formPointsGoal,
      currentSlots: formSlots,
      crowdfundStatus: formCrowdfundStatus,
      lastSyncedIso: new Date().toISOString()
    };

    setSyncedLeagueData(updatedData);
    try {
      localStorage.setItem(`poe_league_sync_${activeSessionId}`, JSON.stringify(updatedData));
    } catch {}

    ingestLeagueDialogRef.current?.close();
    setShowIngestLeagueModal(false);
    fireConfetti();
    setCopyNotice('League crowdfund details synchronized live!');
    setTimeout(() => setCopyNotice(null), 3000);
  };



  // Alumni & Veterans State
  const [alumniList, setAlumniList] = useState<LeagueParticipantAlumnus[]>(NOIR_ALUMNI_PARTICIPANTS);

  // Alumni Search & Filter State

  // Reset Season / Start Fresh Modal State
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const resetDialogRef = useRef<HTMLDialogElement>(null);
  const resetTitleId = useId();

  const handleOpenResetModal = () => {
    setShowResetModal(true);
    setTimeout(() => {
      resetDialogRef.current?.showModal();
    }, 10);
  };

  const handleConfirmStartFresh = () => {
    // 1. Archive current active roster into alumni if they don't already exist
    setAlumniList((prevAlumni: LeagueParticipantAlumnus[]) => {
      const updatedAlumni = [...prevAlumni];
      for (const member of roster) {
        if (member.id === 'member-leuie') continue;
        const existingIdx = updatedAlumni.findIndex(
          (a: LeagueParticipantAlumnus) => a.poeAccountName.toLowerCase() === member.poeAccountName.toLowerCase()
        );
        if (existingIdx >= 0) {
          if (!updatedAlumni[existingIdx].pastLeagues.includes('Ravenwatch Coven of Umbra GSF | Winter 2026')) {
            updatedAlumni[existingIdx].pastLeagues.unshift('Ravenwatch Coven of Umbra GSF | Winter 2026');
            updatedAlumni[existingIdx].totalLeaguesCount += 1;
          }
        } else {
          updatedAlumni.push({
            id: `alumnus-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            displayName: member.displayName,
            poeAccountName: member.poeAccountName,
            discordName: member.discordName,
            preferredContact: member.preferredContact,
            pastLeagues: ['Ravenwatch Coven of Umbra GSF | Winter 2026'],
            totalLeaguesCount: 1,
            lastPlayedExpansion: 'Coven of Umbra',
            lastKnownBuild: member.buildName,
            nudgedForCurrentLeague: false
          });
        }
      }
      saveCloudAlumniList(updatedAlumni);
      return updatedAlumni;
    });

    // 2. Reset active roster to clean host only
    setRoster(getInitialLeagueRoster());
    setLookingForItems([]);

    try {
      localStorage.removeItem('poe_clean330_roster');
      localStorage.removeItem('poe_clean330_looking_for');
      localStorage.removeItem('poe_clean330_vault');
    } catch {}

    resetDialogRef.current?.close();
    setShowResetModal(false);
    fireConfetti();
    setCopyNotice('Clean sheet created for the new league season!');
    setTimeout(() => setCopyNotice(null), 3000);
  };

  const handleToggleNudge = (alumnusId: string) => {
    const nextAlumni = alumniList.map((a: LeagueParticipantAlumnus) => {
      if (a.id === alumnusId) {
        const nextVal = !a.nudgedForCurrentLeague;
        if (nextVal) fireConfetti();
        return {
          ...a,
          nudgedForCurrentLeague: nextVal,
          nudgedTimestamp: nextVal ? 'Just now' : undefined
        };
      }
      return a;
    });
    setAlumniList(nextAlumni);
    saveCloudAlumniList(nextAlumni);
  };

  // Synchronize userAccount if logged in
  useEffect(() => {
    if (!userAccount) return;
    setRoster((prev) => {
      const existsIndex = prev.findIndex(
        (m) =>
          m.poeAccountName.toLowerCase() === userAccount.poeAccountName.toLowerCase() ||
          (userAccount.displayName && m.displayName.toLowerCase() === userAccount.displayName.toLowerCase())
      );
      if (existsIndex >= 0) {
        const updated = [...prev];
        updated[existsIndex] = {
          ...updated[existsIndex],
          displayName: userAccount.displayName,
          preferredContact: userAccount.preferredContact,
          characterName: userAccount.characterName,
          discordName: userAccount.discordName,
          steamName: userAccount.steamName,
          customTag: userAccount.customTag,
          className: userAccount.className,
          ascendancy: userAccount.ascendancy,
          leagueMode: userAccount.leagueMode,
          availableAtLaunch: userAccount.availableAtLaunch,
          level: userAccount.level,
          buildName: userAccount.buildName,
          pobUrl: userAccount.pobUrl,
          atlasContent: userAccount.atlasContent,
          notes: userAccount.notes
        };
        return updated;
      } else {
        const newMember: LeagueRosterMember = {
          id: `roster-${Date.now()}`,
          slotNumber: prev.length + 1,
          leagueMode: userAccount.leagueMode,
          displayName: userAccount.displayName,
          preferredContact: userAccount.preferredContact,
          poeAccountName: userAccount.poeAccountName,
          characterName: userAccount.characterName,
          discordName: userAccount.discordName,
          steamName: userAccount.steamName,
          customTag: userAccount.customTag,
          className: userAccount.className,
          ascendancy: userAccount.ascendancy,
          availableAtLaunch: userAccount.availableAtLaunch,
          level: userAccount.level,
          buildName: userAccount.buildName,
          pobUrl: userAccount.pobUrl,
          atlasContent: userAccount.atlasContent,
          notes: userAccount.notes,
          inviteStatus: userAccount.inviteStatus,
          isOnline: true
        };
        return [newMember, ...prev];
      }
    });
  }, [userAccount]);

  // Toast / Copy notification helper
  const [copyNotice, setCopyNotice] = useState<string | null>(null);
  const triggerCopy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    setCopyNotice(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopyNotice(null), 2500);
  };

  const findMember = (charName: string, dispName?: string): LeagueRosterMember | undefined => {
    return roster.find(
      (m) =>
        m.characterName.toLowerCase() === charName.toLowerCase() ||
        (dispName && m.displayName.toLowerCase() === dispName.toLowerCase())
    );
  };

  // Direct Invite & Direct Join Modal State
  const directInviteDialogRef = useRef<HTMLDialogElement>(null);
  const directJoinDialogRef = useRef<HTMLDialogElement>(null);
  const [hasJoinedSuccess, setHasJoinedSuccess] = useState<boolean>(false);

  // Direct Join Form Fields
  const [joinPoeAccount, setJoinPoeAccount] = useState<string>(userAccount?.poeAccountName || '');
  const [joinCharName, setJoinCharName] = useState<string>(userAccount?.characterName || '');
  const [joinAscendancy, setJoinAscendancy] = useState<string>(
    userAccount?.ascendancy || (selectedGame === 'poe2' ? 'Warrior' : 'Slayer')
  );
  const [joinBuildName, setJoinBuildName] = useState<string>(userAccount?.buildName || '');
  const [joinDisplayTag, setJoinDisplayTag] = useState<string>(userAccount?.displayName || '');
  const [joinDiscord, setJoinDiscord] = useState<string>(userAccount?.discordName || '');
  const [joinPreferredContact, setJoinPreferredContact] = useState<'app' | 'poe_whisper' | 'discord'>('app');

  // Host Fast Add Form Fields
  const [fastAddPoeAccount, setFastAddPoeAccount] = useState<string>('');
  const [fastAddCharName, setFastAddCharName] = useState<string>('');
  const [fastAddAscendancy, setFastAddAscendancy] = useState<string>(
    selectedGame === 'poe2' ? 'Warrior' : 'Slayer'
  );
  const [fastAddBuildName, setFastAddBuildName] = useState<string>('');
  const [fastAddDisplayTag, setFastAddDisplayTag] = useState<string>('');

  const isCurrentUserOnRoster = Boolean(
    userAccount &&
      roster.some(
        (m) =>
          (m.id && userAccount.id === m.id) ||
          (m.poeAccountName &&
            userAccount.poeAccountName &&
            m.poeAccountName.toLowerCase() === userAccount.poeAccountName.toLowerCase()) ||
          (m.characterName &&
            userAccount.characterName &&
            m.characterName.toLowerCase() === userAccount.characterName.toLowerCase())
      )
  );

  const handleOpenInviteModal = () => {
    directInviteDialogRef.current?.showModal();
  };

  const handleOpenJoinModal = () => {
    setHasJoinedSuccess(false);
    directJoinDialogRef.current?.showModal();
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('join') === 'true' || window.location.hash === '#join') {
        setTimeout(() => {
          handleOpenJoinModal();
        }, 150);
      }
    }
  }, []);

  useEffect(() => {
    const inviteDialog = directInviteDialogRef.current;
    if (!inviteDialog) return;
    let handleInviteBackdrop: ((e: MouseEvent) => void) | undefined;
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      handleInviteBackdrop = (e: MouseEvent) => {
        if (e.target === inviteDialog) {
          const rect = inviteDialog.getBoundingClientRect();
          const inDialog =
            rect.top <= e.clientY &&
            e.clientY <= rect.top + rect.height &&
            rect.left <= e.clientX &&
            e.clientX <= rect.left + rect.width;
          if (!inDialog) inviteDialog.close();
        }
      };
      inviteDialog.addEventListener('click', handleInviteBackdrop);
    }

    const joinDialog = directJoinDialogRef.current;
    let handleJoinBackdrop: ((e: MouseEvent) => void) | undefined;
    if (joinDialog && !('closedBy' in HTMLDialogElement.prototype)) {
      handleJoinBackdrop = (e: MouseEvent) => {
        if (e.target === joinDialog) {
          const rect = joinDialog.getBoundingClientRect();
          const inDialog =
            rect.top <= e.clientY &&
            e.clientY <= rect.top + rect.height &&
            rect.left <= e.clientX &&
            e.clientX <= rect.left + rect.width;
          if (!inDialog) joinDialog.close();
        }
      };
      joinDialog.addEventListener('click', handleJoinBackdrop);
    }

    return () => {
      if (handleInviteBackdrop) inviteDialog.removeEventListener('click', handleInviteBackdrop);
      if (handleJoinBackdrop && joinDialog) joinDialog.removeEventListener('click', handleJoinBackdrop);
    };
  }, []);

  const handleDirectJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAccount = joinPoeAccount.trim();
    if (!cleanAccount) return;

    const cleanChar = joinCharName.trim() || cleanAccount.split('#')[0] || 'Exile';
    const matchedAsc = currentAscendancyCatalog.find(
      (a) => a.name.toLowerCase() === joinAscendancy.toLowerCase()
    );
    const resolvedClass = matchedAsc?.baseClass || (isPoE2Session ? 'Warrior' : 'Duelist');
    const dispName = joinDisplayTag.trim() || cleanChar;

    const newMember: LeagueRosterMember = {
      id: `member-${Date.now()}`,
      displayName: dispName,
      preferredContact: joinPreferredContact,
      slotNumber: roster.length + 1,
      leagueMode: 'Private',
      poeAccountName: cleanAccount,
      discordName: joinDiscord.trim() || undefined,
      characterName: cleanChar,
      className: resolvedClass,
      ascendancy: joinAscendancy,
      atlasContent: ['Expedition', 'Harvest'],
      availableAtLaunch: 'Yes',
      level: 1,
      buildName: joinBuildName.trim() || 'Undecided Starter',
      notes: 'Joined via direct league invite',
      inviteStatus: 'Accepted',
      isOnline: true
    };

    const updatedRoster = [...roster, newMember];
    setRoster(updatedRoster);
    try {
      localStorage.setItem('poe_clean330_roster', JSON.stringify(updatedRoster));
    } catch {}

    saveCloudRosterMember(activeSessionId, newMember);

    if (userAccount) {
      const updatedAccount: UserAccount = {
        ...userAccount,
        poeAccountName: cleanAccount,
        characterName: cleanChar,
        ascendancy: joinAscendancy,
        className: resolvedClass,
        buildName: joinBuildName.trim() || userAccount.buildName
      };
      try {
        localStorage.setItem('poe_umbraleague_user', JSON.stringify(updatedAccount));
      } catch {}
      if (onUpdateUserAccount) {
        onUpdateUserAccount(updatedAccount, newMember);
      }
    }

    emitFeedEvent({
      type: 'roster_join',
      actorHandle: dispName,
      actorCharacter: cleanChar,
      title: `Joined ${activeLeagueInfo.name} as ${joinAscendancy} (${newMember.buildName})`,
      detail: `Character: ${cleanChar} • PoE Account: ${cleanAccount}`,
      targetTab: 'roster'
    });

    // Award non retroactive League Join Achievement (e.g. 3.30 Witch Emblem)
    const leagueAch = getLeagueJoinAchievementDef(activeSessionId);
    if (leagueAch) {
      const achNow = new Date().toISOString();
      const playerKey = (cleanAccount || dispName).trim().toLowerCase();
      saveCloudAchievementProfile(playerKey, {
        unlockedIds: { [leagueAch.id]: achNow },
        lifetimeFulfilledCount: 0,
        lifetimeBountiesClaimed: 0,
        lifetimeBountiesPaid: 0,
        leaguesParticipated: [activeSessionId],
        honorLog: [
          {
            id: `honor-ach-${leagueAch.id}`,
            points: leagueAch.points,
            reason: `Unlocked Achievement: ${leagueAch.title}`,
            where: `${formatLeagueLabel(activeSessionId)} • League Join`,
            timestampIso: achNow,
            kind: 'achievement'
          }
        ]
      });
      emitFeedEvent({
        type: 'achievement_earned',
        actorHandle: dispName,
        actorCharacter: cleanChar,
        title: `Unlocked Achievement: ${leagueAch.title}`,
        detail: `+${leagueAch.points} Honor Points • ${leagueAch.description}`,
        iconUrl: leagueAch.iconUrl,
        targetTab: 'bounties'
      });
    }

    fireConfetti();
    setHasJoinedSuccess(true);
    triggerCopy('', `Successfully joined ${activeLeagueInfo.name}!`);
  };

  const handleFastTrackHostAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAccount = fastAddPoeAccount.trim();
    if (!cleanAccount) return;

    const cleanChar = fastAddCharName.trim() || cleanAccount.split('#')[0] || 'Exile';
    const matchedAsc = currentAscendancyCatalog.find(
      (a) => a.name.toLowerCase() === fastAddAscendancy.toLowerCase()
    );
    const resolvedClass = matchedAsc?.baseClass || (isPoE2Session ? 'Warrior' : 'Duelist');
    const dispName = fastAddDisplayTag.trim() || cleanChar;

    const newMember: LeagueRosterMember = {
      id: `member-${Date.now()}`,
      displayName: dispName,
      preferredContact: 'app',
      slotNumber: roster.length + 1,
      leagueMode: 'Private',
      poeAccountName: cleanAccount,
      characterName: cleanChar,
      className: resolvedClass,
      ascendancy: fastAddAscendancy,
      atlasContent: ['Expedition', 'Harvest'],
      availableAtLaunch: 'Yes',
      level: 1,
      buildName: fastAddBuildName.trim() || 'Undecided Starter',
      notes: 'Added by league host',
      inviteStatus: 'Invited',
      isOnline: false
    };

    const updatedRoster = [...roster, newMember];
    setRoster(updatedRoster);
    try {
      localStorage.setItem('poe_clean330_roster', JSON.stringify(updatedRoster));
    } catch {}

    saveCloudRosterMember(activeSessionId, newMember);

    navigator.clipboard?.writeText(cleanAccount);
    triggerCopy(cleanAccount, `Added ${cleanAccount} to roster (Copied to clipboard for GGG invite)`);

    setFastAddPoeAccount('');
    setFastAddCharName('');
    setFastAddBuildName('');
    setFastAddDisplayTag('');
    fireConfetti();
  };

  const [adminModeOverride, setAdminModeOverride] = useState<boolean>(() => {
    try {
      return localStorage.getItem('poe_league_admin_override') === 'true';
    } catch {
      return false;
    }
  });

  const isCurrentUserAdmin = Boolean(
    adminModeOverride ||
    userAccount?.isAdmin ||
    userAccount?.displayName?.toLowerCase() === 'leuie' ||
    userAccount?.displayName?.toLowerCase() === 'venulum' ||
    userAccount?.poeAccountName?.toLowerCase() === 'leuie#0001' ||
    userAccount?.poeAccountName?.toLowerCase() === 'cgbulloc#4500' ||
    userAccount?.characterName?.toLowerCase() === 'leuie' ||
    userAccount?.characterName?.toLowerCase() === 'venulum'
  );




  if (activeReadingGuide) {
    return (
      <Suspense fallback={<div className="p-8 text-center text-xs font-mono text-slate-400">Loading build guide...</div>}>
      <FullGuideReaderView
        guide={activeReadingGuide}
        onBack={() => setActiveReadingGuide(null)}
        onUpdateGuide={(updated) => {
          setActiveReadingGuide(updated);
          setGuides((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
          saveCloudGuide(activeSessionId, updated);
          emitFeedEvent({
            type: 'build_published',
            actorHandle: updated.authorName || userAccount?.displayName || 'Exile',
            title: `Updated Build Guide: ${updated.title}`,
            detail: `${updated.ascendancy} • ${updated.className}`,
            targetTab: 'guides'
          });
        }}
        onAddUniquesToLookingFor={(uniques) => {
          const newItems: LookingForItem[] = uniques.map((u) => ({
            id: `lf-auto-${Date.now()}-${Math.random()}`,
            characterName: userAccount?.characterName || 'MyCharacter',
            displayName: userAccount?.displayName || 'Leuie',
            preferredContact: userAccount?.preferredContact || 'app',
            itemName: u,
            category: 'Unique',
            status: 'NEED',
            notes: `Required for ${activeReadingGuide.title}`,
            poeWikiUrl: `https://www.poewiki.net/wiki/${encodeURIComponent(u.replace(/ /g, '_'))}`,
            poeDbUrl: `https://poedb.tw/us/search?q=${encodeURIComponent(u)}`
          }));
          setLookingForItems((prev) => [...newItems, ...prev]);
          newItems.forEach((it) => saveCloudWishlistItem(activeSessionId, it));
          setCopyNotice(`Added ${uniques.length} items to your Looking For list!`);
          setTimeout(() => setCopyNotice(null), 2500);
        }}
      />
      </Suspense>
    );
  }

  return (
    <div className="w-full space-y-4 pb-20 font-sans text-slate-200">
      {/* Toast Notification */}
      {copyNotice && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2 rounded-xl bg-slate-800 text-slate-100 text-xs font-semibold shadow-2xl flex items-center gap-2 border border-slate-700 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{copyNotice}</span>
        </div>
      )}

      {/* Sleek Subdued Utility Top Bar */}
      <div className="sticky top-0 z-30 w-full bg-slate-900/95 dark:bg-[#0d111a]/95 backdrop-blur-md border-b border-slate-800 shadow-sm">
        
        {/* Row 1: League Selector, Directory Navigation, Share & Status Chips */}
        <div className="px-3 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-800/60">
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 flex-shrink-0 animate-pulse" />
            <select
              value={activeSessionId}
              onChange={(e) => setActiveSessionId(e.target.value)}
              className="bg-slate-800/90 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-100 focus:outline-none focus:border-slate-500 max-w-[280px] sm:max-w-none truncate cursor-pointer"
              title="Switch active private league session"
            >
              {allLeagueSessions
                .filter((sess) => (sess.game || 'poe1') === (selectedGame || 'poe1'))
                .filter((sess) => !sess.isReadOnlyArchive || sess.id === activeSessionId)
                .map((sess) => (
                  <option key={sess.id} value={sess.id}>
                    {sess.name} ({sess.version}) {sess.isReadOnlyArchive ? '(Archived)' : sess.isActive ? '(Active)' : '(Upcoming)'}
                  </option>
                ))}
            </select>

            {onNavigateLeagues && (
              <button
                type="button"
                onClick={onNavigateLeagues}
                className="px-2.5 py-1 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-700/60 text-[11px] font-mono text-indigo-300 flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Return to Private League Hub directory"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Private League Hub</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                const url = typeof window !== 'undefined' ? `${window.location.origin}/league/${activeSessionId}` : `https://exilessf.app/league/${activeSessionId}`;
                navigator.clipboard.writeText(url);
                triggerCopy(url, 'Shareable League Link');
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-mono text-slate-300 flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Copy shareable link for this private league"
            >
              <Share2 className="w-3 h-3 text-indigo-400" />
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
              Patch {currentSession.version}
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
              {activeLeagueInfo.fundedDays} Days Funded
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
              {roster.length}/{activeLeagueInfo.currentSlots} Slots
            </span>
            {cloudSyncStatus === 'connected' && (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/80" title="Connected to Cloudflare KV Database">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Cloud Live</span>
              </span>
            )}
          </div>
        </div>

        {/* Row 2: In Game Channel, Community Links & Membership Actions */}
        <div className="px-3 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/40 bg-slate-900/40">
          <div className="flex flex-wrap items-center gap-2">
            {/* Quick in game channel copy */}
            <button
              type="button"
              onClick={() => triggerCopy(activeLeagueInfo.globalChannel, 'In Game Channel')}
              className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-[11px] font-mono text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Click to copy in game chat command"
            >
              <MessageSquare className="w-3 h-3 text-slate-400" />
              <span>{activeLeagueInfo.globalChannel}</span>
              <Copy className="w-2.5 h-2.5 text-slate-500" />
            </button>

            {/* Ravenwatch Root */}
            <a
              href="https://rootapp.gg/AC1NPUuJiQqlyDvGbgH-8A"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-800/80 text-[11px] text-emerald-300 flex items-center gap-1.5 transition-colors"
              title="Official GSF Gathering Place on Root"
            >
              <Users className="w-3 h-3 text-emerald-400" />
              <span>Ravenwatch Root</span>
              <ExternalLink className="w-2.5 h-2.5 text-emerald-500" />
            </a>

            {/* Official League Ladder */}
            {activeLeagueInfo.officialLeagueUrl && (
              <a
                href={activeLeagueInfo.officialLeagueUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-[11px] text-slate-300 flex items-center gap-1.5 transition-colors"
              >
                <ShieldCheck className="w-3 h-3 text-amber-400" />
                <span>Official Ladder</span>
                <ExternalLink className="w-2.5 h-2.5 text-slate-500" />
              </a>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Host Admin Controls Toggle */}
            <button
              type="button"
              onClick={() => {
                const nextState = !adminModeOverride;
                setAdminModeOverride(nextState);
                try {
                  localStorage.setItem('poe_league_admin_override', String(nextState));
                } catch {}
                setCopyNotice(nextState ? 'Admin Mode Activated' : 'Admin Mode Deactivated');
                setTimeout(() => setCopyNotice(null), 3000);
              }}
              className={`px-2.5 py-1 rounded-lg border text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isCurrentUserAdmin
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
              title="Toggle League Host Admin Controls"
            >
              <ShieldCheck className={`w-3.5 h-3.5 ${isCurrentUserAdmin ? 'text-amber-400' : 'text-slate-500'}`} />
              <span>{isCurrentUserAdmin ? 'Admin Mode' : 'Admin'}</span>
            </button>

            {/* User Account / Profile action */}
            <button
              onClick={() => {
                if (userAccount && onOpenProfile) {
                  onOpenProfile(userAccount.displayName);
                } else {
                  onOpenAuthModal?.();
                }
              }}
              title={userAccount ? `Open @${userAccount.displayName}'s Exile Profile` : 'Sign in to Exile SSF'}
              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span>{userAccount ? `@${userAccount.displayName}` : 'Login'}</span>
            </button>

            <button
              type="button"
              onClick={handleOpenInviteModal}
              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow"
              title="Direct invite link and share templates"
            >
              <Send className="w-3 h-3" />
              <span>Invite</span>
            </button>

            {!isCurrentUserOnRoster && (
              <button
                type="button"
                onClick={handleOpenJoinModal}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow"
                title="Join this private league roster"
              >
                <UserPlus className="w-3 h-3" />
                <span>Join</span>
              </button>
            )}
          </div>
        </div>

        {/* Read Only Archive Banner if league is expired */}
        {isReadOnlyLeague && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 px-3 sm:px-6 py-2 flex items-center justify-between text-xs font-mono text-amber-300">
            <div className="flex items-center gap-2">
              <Archive className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>
                <strong>Read Only Archive:</strong> This historical season ({currentSession.version}) has concluded. Roster and build data are preserved for reference.
              </span>
            </div>
            {onNavigateLeagues && (
              <button
                type="button"
                onClick={onNavigateLeagues}
                className="underline hover:text-amber-200 cursor-pointer"
              >
                Browse Active Leagues →
              </button>
            )}
          </div>
        )}

        {/* Row 3: Responsive Navigation Tabs with Unique Page Navigation */}
        <div className="px-3 sm:px-6 flex flex-wrap items-center gap-1.5 sm:gap-2 py-2 border-t border-slate-800/40 bg-slate-950/40">
          {[
            { id: 'overview' as HubTab, label: 'Command Center', icon: Flame, badge: null, slug: 'command-center' },
            { id: 'feed' as HubTab, label: 'Feed', icon: Activity, badge: activeTab !== 'feed' && unreadFeedCount > 0 ? `${unreadFeedCount} new` : activityFeed.length > 0 ? `${activityFeed.length}` : null, isUnreadHighlight: activeTab !== 'feed' && unreadFeedCount > 0, slug: 'feed' },
            { id: 'looking_for' as HubTab, label: 'Wishlists', icon: Sparkles, badge: `${lookingForItems.length}`, slug: 'wishlists' },
            {
              id: 'bounties' as HubTab,
              label: 'Bounties',
              icon: Trophy,
              badge: `${lookingForItems.filter((it) => it.status !== 'HAVE' && it.bountyOffer && it.bountyOffer.trim()).length}`,
              slug: 'bounties'
            },
            { id: 'roster' as HubTab, label: 'Roster', icon: Users, badge: `${roster.length}`, slug: 'roster' },
            { id: 'guides' as HubTab, label: 'Builds', icon: BookOpen, badge: `${guides.length}`, slug: 'guides' },
            { id: 'cheatsheets' as HubTab, label: 'Cheat Sheets', icon: Scroll, badge: null, slug: 'cheatsheets' },
            { id: 'new_player' as HubTab, label: 'Crafting Bench', icon: Compass, badge: null, slug: 'bench' },
            { id: 'alumni' as HubTab, label: 'Alumni', icon: History, badge: `${alumniList.length}`, slug: 'alumni' }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleSelectTab(tab.id)}
                className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer min-h-[36px] ${
                  isActive
                    ? 'bg-slate-800 text-white font-semibold border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      (tab as any).isUnreadHighlight ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 font-bold' : isActive ? 'bg-slate-700 text-slate-200' : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content View Container (Full Width, Fluid, Springy) */}
      <div className="w-full px-2 sm:px-4 lg:px-6 pt-2">
        <Suspense fallback={<div className="p-10 text-center text-xs font-mono text-slate-400">Loading module...</div>}>
        {/* TAB 1: OVERVIEW AND COMMAND CENTER */}
        {activeTab === 'overview' && (
          <CommandCenterTab
            activeSessionId={activeSessionId}
            isPoE2Session={isPoE2Session}
            activeLeagueInfo={activeLeagueInfo}
            currentSession={currentSession}
            roster={roster}
            userAccount={userAccount}
            isCurrentUserOnRoster={isCurrentUserOnRoster}
            onOpenAuthModal={onOpenAuthModal}
            triggerCopy={triggerCopy}
            handleOpenInviteModal={handleOpenInviteModal}
            handleOpenJoinModal={handleOpenJoinModal}
            handleOpenIngestModal={handleOpenIngestModal}
            quickLinks={quickLinks}
            archivesList={archivesList}
            faqList={faqList}
            openManagerModal={openManagerModal}
            isCurrentUserAdmin={isCurrentUserAdmin}
            leagueFirsts={leagueFirsts}
            onClaimLeagueFirst={(m) => {
              setLeagueFirsts((prev) => [m, ...prev.filter((x) => x.id !== m.id)]);
              saveCloudLeagueFirst(activeSessionId, m);
              fireConfetti();
              setCopyNotice(`League First recorded: ${m.title} by @${m.winnerDisplayName}!`);
              setTimeout(() => setCopyNotice(null), 3500);
            }}
          />
        )}

        {/* TAB: LIVE LEAGUE ACTIVITY FEED */}
        {activeTab === 'feed' && (
          <FeedTab
            activeSessionId={activeSessionId}
            leagueName={activeLeagueInfo.name}
            activityFeed={activityFeed}
            lookingForItems={lookingForItems}
            roster={roster}
            guides={guides}
            stashDrops={stashDrops}
            bossRotas={bossRotas}
            leagueFirsts={leagueFirsts}
            userAccount={userAccount}
            lastSeenFeedAt={visitBaselineFeedAt}
            onCheerEvent={handleCheerFeedEvent}
            onCommentEvent={handleCommentFeedEvent}
            onCopyFeedLink={() => triggerCopy(`${window.location.origin}/league/${activeSessionId}/feed`, 'League Feed Link')}
            onOpenProfile={onOpenProfile}
            onNavigateTab={handleSelectTab}
          />
        )}

        {/* ============================================================================ */}
        {/* TAB 3: ROSTER DIRECTORY */}
        {/* ============================================================================ */}
        {activeTab === 'roster' && (
          <RosterTab
            activeSessionId={activeSessionId}
            roster={roster}
            setRoster={setRoster}
            userAccount={userAccount}
            isCurrentUserAdmin={isCurrentUserAdmin}
            isCurrentUserOnRoster={isCurrentUserOnRoster}
            lookingForItems={lookingForItems}
            currentAscendancyCatalog={currentAscendancyCatalog}
            triggerCopy={triggerCopy}
            setCopyNotice={setCopyNotice}
            fireConfetti={fireConfetti}
            handleOpenInviteModal={handleOpenInviteModal}
            handleOpenJoinModal={handleOpenJoinModal}
            onUpdateUserAccount={onUpdateUserAccount}
            onOpenProfile={onOpenProfile}
            onEmitFeedEvent={emitFeedEvent}
          />
        )}

        {/* UNIFIED RESOURCE: WISHLISTS AND NEEDS (WITH DROP MATCHER) */}
        {activeTab === 'looking_for' && (
          <WishlistsTab
            activeSessionId={activeSessionId}
            lookingForItems={lookingForItems}
            roster={roster}
            setLookingForItems={setLookingForItems}
            userAccount={userAccount}
            isCurrentUserAdmin={isCurrentUserAdmin}
            triggerCopy={triggerCopy}
            setCopyNotice={setCopyNotice}
            fireConfetti={fireConfetti}
            findMember={findMember}
            onOpenBountiesPage={() => handleSelectTab('bounties')}
            initialSearchQuery={wishlistJumpQuery}
            onClearInitialSearch={() => setWishlistJumpQuery(null)}
            onOpenProfile={onOpenProfile}
            onEmitFeedEvent={emitFeedEvent}
            stashDrops={stashDrops}
            onAddStashDrop={(drop) => {
              setStashDrops((prev) => [drop, ...prev]);
              saveCloudStashDrop(activeSessionId, drop);
              setCopyNotice(`Posted ${drop.itemName} to Free Stash Feed!`);
              setTimeout(() => setCopyNotice(null), 3000);
            }}
            onClaimStashDrop={(drop) => {
              const claimer = userAccount?.displayName || 'Squadmate';
              const updated: FreeStashDrop = { ...drop, claimedBy: claimer, claimedAtIso: new Date().toISOString() };
              setStashDrops((prev) => prev.map((d) => (d.id === drop.id ? updated : d)));
              saveCloudStashDrop(activeSessionId, updated);
              fireConfetti();
              triggerCopy(`@${drop.donorCharacterName || drop.donorDisplayName} Hey! I claimed ${drop.itemName} from the Free Stash Feed on Exile SSF!`, 'Stash Claim Whisper');
            }}
            onDeleteStashDrop={(id) => {
              setStashDrops((prev) => prev.filter((d) => d.id !== id));
              deleteCloudStashDrop(activeSessionId, id);
            }}
          />
        )}

        {/* DEDICATED RESOURCE: SQUAD BOUNTY BOARD, FULFILLMENT HEROES, AND PERSISTENT ACHIEVEMENTS */}
        {activeTab === 'bounties' && (
          <BountiesAndHonorsTab
            activeSessionId={activeSessionId}
            lookingForItems={lookingForItems}
            setLookingForItems={setLookingForItems}
            roster={roster}
            alumniList={alumniList}
            guides={guides}
            cloudAchievements={cloudAchievements}
            setCloudAchievements={setCloudAchievements}
            services={squadServices}
            setServices={setSquadServices}
            vouches={playerVouches}
            setVouches={setPlayerVouches}
            userAccount={userAccount}
            isCurrentUserAdmin={isCurrentUserAdmin}
            triggerCopy={triggerCopy}
            setCopyNotice={setCopyNotice}
            fireConfetti={fireConfetti}
            onOpenProfile={onOpenProfile}
            onEmitFeedEvent={emitFeedEvent}
            onJumpToWishlist={(itemName) => {
              setWishlistJumpQuery(itemName);
              handleSelectTab('looking_for');
            }}
            bossRotas={bossRotas}
            onSaveBossRota={(rota) => {
              setBossRotas((prev) => {
                const exists = prev.some((r) => r.id === rota.id);
                return exists ? prev.map((r) => (r.id === rota.id ? rota : r)) : [rota, ...prev];
              });
              saveCloudBossRota(activeSessionId, rota);
            }}
            onDeleteBossRota={(id) => {
              setBossRotas((prev) => prev.filter((r) => r.id !== id));
              deleteCloudBossRota(activeSessionId, id);
            }}
          />
        )}

        {/* ============================================================================ */}
        {/* TAB 6: COMMUNITY GUIDES */}
        {/* TAB 6: COMMUNITY GUIDES */}
        {activeTab === 'guides' && (
          <BuildGuidesTab
            guides={guides}
            setGuides={setGuides}
            onSelectGuide={(g) => setActiveReadingGuide(g)}
            userAccount={userAccount}
            fireConfetti={fireConfetti}
            setLookingForItems={setLookingForItems}
            setCopyNotice={setCopyNotice}
          />
        )}

        {/* TAB 7: CHEAT SHEETS */}
        {activeTab === 'cheatsheets' && (
          <CheatSheetsTab />
        )}

        {/* ============================================================================ */}
        {/* TAB 8: BENCH & TIPS */}
        {/* TAB 8: BENCH AND STASH TIPS */}
        {activeTab === 'new_player' && (
          <BenchGuideTab />
        )}

        {/* TAB 9: ALUMNI DIRECTORY */}
        {activeTab === 'alumni' && (
          <AlumniTab
            alumniList={alumniList}
            activeLeagueInfo={activeLeagueInfo}
            triggerCopy={triggerCopy}
            handleOpenResetModal={handleOpenResetModal}
            handleToggleNudge={handleToggleNudge}
            onOpenProfile={onOpenProfile}
          />
        )}
        </Suspense>
      </div>

      {/* Global Instant Drop Check Modal (Ctrl+K) */}
      <dialog
        ref={dropCheckDialogRef}
        {...({ closedby: 'any' } as any)}
        className="w-[94vw] sm:w-full sm:max-w-xl rounded-2xl border border-amber-500/40 bg-slate-900 text-slate-200 p-0 shadow-2xl backdrop:bg-black/75 m-auto overflow-hidden"
      >
        <div className="flex flex-col max-h-[82vh]">
          <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300">
                Instant Drop Check (Who Needs This Item?)
              </span>
            </div>
            <button
              type="button"
              onClick={() => dropCheckDialogRef.current?.close()}
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-3 overflow-y-auto">
            <input
              type="text"
              autoFocus
              value={dropCheckQuery}
              onChange={(e) => {
                    const val = e.target.value;
                    const parsed = val.includes('Item Class:') || val.includes('Rarity:') ? parsePoeClipboardTooltip(val) : null;
                    setDropCheckQuery(parsed ? parsed.itemName : val);
                  }}
              placeholder="Type a dropped unique, gem, fragment, or base (e.g. Aegis Aurora)..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 font-mono"
            />

            {(() => {
              const q = dropCheckQuery.trim().toLowerCase();
              const openMatches = lookingForItems.filter((it) => {
                if (it.status === 'HAVE') return false;
                if (!q) return Boolean(it.bountyOffer && it.bountyOffer.trim());
                return (
                  it.itemName.toLowerCase().includes(q) ||
                  it.category.toLowerCase().includes(q) ||
                  (it.displayName && it.displayName.toLowerCase().includes(q)) ||
                  it.characterName.toLowerCase().includes(q)
                );
              });

              if (openMatches.length === 0) {
                return (
                  <div className="p-6 text-center rounded-xl border border-dashed border-slate-800 text-xs text-slate-400">
                    {q
                      ? `No open squad requests matched "${dropCheckQuery}". Safe to stash or vendor!`
                      : 'Start typing any dropped item name, or view open bounties below.'}
                  </div>
                );
              }

              return (
                <div className="space-y-2">
                  <div className="text-[10px] font-mono uppercase text-slate-400">
                    {q ? `${openMatches.length} Open Squad Matches` : `${openMatches.length} Active Bounties Highlighted`}
                  </div>
                  {openMatches.slice(0, 12).map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl border border-slate-800 bg-slate-950/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-xs font-bold text-white">{item.itemName}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                            {item.category}
                          </span>
                          {item.bountyOffer && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                              <Coins className="w-2.5 h-2.5" />
                              <span>{item.bountyOffer}</span>
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          Wanted by <span className="text-slate-200">@{item.displayName || item.characterName}</span>
                          {item.characterName ? ` (For: ${item.characterName})` : ''}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            triggerCopy(
                              `@${item.characterName} Hey! I just dropped ${item.itemName} for you!`,
                              'Drop Whisper'
                            );
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold cursor-pointer"
                        >
                          Whisper
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            dropCheckDialogRef.current?.close();
                            setWishlistJumpQuery(item.itemName);
                            handleSelectTab('looking_for');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 text-[11px] font-mono cursor-pointer"
                        >
                          Open
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      </dialog>

      {/* Global League Modals */}
      {/* Direct League Invite Modal */}
        <dialog
          ref={directInviteDialogRef}
          {...({ closedby: 'any' } as any)}
          aria-labelledby="direct-invite-modal-title"
          className="w-[94vw] sm:w-full sm:max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 text-slate-200 p-0 shadow-2xl backdrop:bg-black/75 m-auto overflow-hidden"
        >
          <div className="flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-semibold uppercase tracking-wider">
                      League Invite
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Patch {currentSession.version}</span>
                  </div>
                  <h2 id="direct-invite-modal-title" className="text-base sm:text-lg font-bold text-white mt-0.5">
                    Invite Exiles to {activeLeagueInfo.name}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={() => directInviteDialogRef.current?.close()}
                className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
              <div className="space-y-2 p-3.5 rounded-xl border border-slate-800 bg-slate-950/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Direct Share & Join Link</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Auto prompts registration</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`https://exilessf.app/league/${activeSessionId}?join=true`}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-indigo-300 selection:bg-indigo-900 select-all"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const url = `https://exilessf.app/league/${activeSessionId}?join=true`;
                      triggerCopy(url, 'Direct Join Link');
                    }}
                    className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow transition-all flex-shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Send this link to anyone. When they open it, the league hub will automatically present the join form to onboard their exile.
                </p>
              </div>

              <div className="space-y-3">
                <span className="text-xs font-semibold text-slate-200 font-mono uppercase tracking-wider">
                  Ready Made Invite Templates
                </span>

                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Discord / Guild Announcement</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const template = `Join our Private League: ${activeLeagueInfo.name}\n` +
                          `• Ladder & Roster: https://exilessf.app/league/${activeSessionId}?join=true\n` +
                          `• Root Community: https://rootapp.gg/AC1NPUuJiQqlyDvGbgH-8A\n` +
                          `• League Host: @${activeLeagueInfo.organizerAccount}\n` +
                          `Click the link to register your starter build and drop your PoE account name so we can send your in-game invite!`;
                        triggerCopy(template, 'Discord Invite Template');
                      }}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1 cursor-pointer transition-colors border border-slate-700"
                    >
                      <Copy className="w-3 h-3 text-slate-400" />
                      <span>Copy Template</span>
                    </button>
                  </div>
                  <pre className="text-[11px] font-mono text-slate-400 bg-slate-900/90 p-2.5 rounded-lg whitespace-pre-wrap border border-slate-800/80">
{`Join our Private League: ${activeLeagueInfo.name}
• Ladder & Roster: https://exilessf.app/league/${activeSessionId}?join=true
• Root Community: https://rootapp.gg/AC1NPUuJiQqlyDvGbgH-8A
• League Host: @${activeLeagueInfo.organizerAccount}`}
                  </pre>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                      <AtSign className="w-3.5 h-3.5" />
                      <span>In Game Whisper / Global Message</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const template = `@Exile Hey! Join our private league ${activeLeagueInfo.name}. Register starter & join roster at: https://exilessf.app/league/${activeSessionId}?join=true`;
                        triggerCopy(template, 'Whisper Invite Template');
                      }}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1 cursor-pointer transition-colors border border-slate-700"
                    >
                      <Copy className="w-3 h-3 text-slate-400" />
                      <span>Copy Whisper</span>
                    </button>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800/80">
                    {`@Exile Hey! Join our private league ${activeLeagueInfo.name}. Register starter & join roster at: https://exilessf.app/league/${activeSessionId}?join=true`}
                  </div>
                </div>
              </div>

              {isCurrentUserAdmin && (
                <form
                  onSubmit={handleFastTrackHostAdd}
                  className="space-y-3 p-4 rounded-xl border border-indigo-900/40 bg-indigo-950/20"
                >
                  <div className="flex items-center justify-between border-b border-indigo-900/40 pb-2">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-bold text-white">Host Fast Add to Roster</span>
                    </div>
                    <span className="text-[10px] font-mono text-indigo-300">Auto copies PoE tag for GGG invite</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300">PoE Account Tag (Required)</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Havoc#1234 or Chris_Wilson"
                        value={fastAddPoeAccount}
                        onChange={(e) => setFastAddPoeAccount(e.target.value)}
                        className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-300">In Game Character IGN</label>
                      <input
                        type="text"
                        placeholder="e.g. Havoc_Umbra"
                        value={fastAddCharName}
                        onChange={(e) => setFastAddCharName(e.target.value)}
                        className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300">Ascendancy</label>
                      <select
                        value={fastAddAscendancy}
                        onChange={(e) => setFastAddAscendancy(e.target.value)}
                        className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        {currentAscendancyCatalog.map((a) => (
                          <option key={a.name} value={a.name}>
                            {a.name} ({a.baseClass})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-300">Starter Build Plan</label>
                      <input
                        type="text"
                        placeholder="e.g. Molten Strike of the Zenith"
                        value={fastAddBuildName}
                        onChange={(e) => setFastAddBuildName(e.target.value)}
                        className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-300">Display Tag (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Havoc"
                        value={fastAddDisplayTag}
                        onChange={(e) => setFastAddDisplayTag(e.target.value)}
                        className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <p className="text-[11px] text-slate-400">
                      Syncs immediately to Cloudflare KV and copies account name for paste into GGG private league page.
                    </p>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow transition-all flex-shrink-0"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Add & Copy Tag</span>
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-500">
                Active League ID: {activeSessionId}
              </span>
              <button
                type="button"
                onClick={() => directInviteDialogRef.current?.close()}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </dialog>

        {/* Direct League Join Modal */}
        <dialog
          ref={directJoinDialogRef}
          {...({ closedby: 'any' } as any)}
          aria-labelledby="direct-join-modal-title"
          className="w-[94vw] sm:w-full sm:max-w-xl rounded-2xl border border-slate-700 bg-slate-900 text-slate-200 p-0 shadow-2xl backdrop:bg-black/75 m-auto overflow-hidden"
        >
          <div className="flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold uppercase tracking-wider">
                      League Registration
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Patch {currentSession.version}</span>
                  </div>
                  <h2 id="direct-join-modal-title" className="text-base sm:text-lg font-bold text-white mt-0.5">
                    Join {activeLeagueInfo.name}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={() => directJoinDialogRef.current?.close()}
                className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {hasJoinedSuccess ? (
              <div className="p-8 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white">Welcome to the Squad!</h3>
                  <p className="text-xs text-slate-300">
                    You are now registered on the live roster for <strong className="text-white">{activeLeagueInfo.name}</strong>. Your character and build details have been synced to Cloudflare KV.
                  </p>
                </div>
                <div className="pt-2 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      directJoinDialogRef.current?.close();
                      setActiveTab('roster');
                    }}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow transition-all"
                  >
                    View Squad Roster
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleDirectJoinSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4">
                <p className="text-xs text-slate-300">
                  Register your exile credentials to secure your spot in the squad roster. Once registered, your build plan and wanted items will be visible to all league members.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300">PoE Account Tag (Required)</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ShadowExile#1234"
                      value={joinPoeAccount}
                      onChange={(e) => setJoinPoeAccount(e.target.value)}
                      className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                    <span className="text-[10px] text-slate-500">Needed for official GGG league invite</span>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300">Character Name (IGN)</label>
                    <input
                      type="text"
                      placeholder="e.g. Shadow_Umbra"
                      value={joinCharName}
                      onChange={(e) => setJoinCharName(e.target.value)}
                      className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                    <span className="text-[10px] text-slate-500">Your in game character name</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300">Starter Ascendancy</label>
                    <select
                      value={joinAscendancy}
                      onChange={(e) => setJoinAscendancy(e.target.value)}
                      className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      {currentAscendancyCatalog.map((a) => (
                        <option key={a.name} value={a.name}>
                          {a.name} ({a.baseClass})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300">Planned Starter Build</label>
                    <input
                      type="text"
                      placeholder="e.g. Lightning Strike Warden"
                      value={joinBuildName}
                      onChange={(e) => setJoinBuildName(e.target.value)}
                      className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="text-xs font-semibold text-slate-300">Display Tag (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. ShadowExile"
                      value={joinDisplayTag}
                      onChange={(e) => setJoinDisplayTag(e.target.value)}
                      className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300">Preferred Contact</label>
                    <select
                      value={joinPreferredContact}
                      onChange={(e) => setJoinPreferredContact(e.target.value as any)}
                      className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="app">Exile SSF / Root App</option>
                      <option value="poe_whisper">In Game PoE Whisper</option>
                      <option value="discord">Discord Direct Message</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300">Discord (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. exile_warrior"
                      value={joinDiscord}
                      onChange={(e) => setJoinDiscord(e.target.value)}
                      className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="p-4 border-t border-slate-800 bg-slate-950/80 -mx-4 sm:-mx-6 -mb-4 sm:-mb-6 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => directJoinDialogRef.current?.close()}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-lg transition-all"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Join League Roster</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </dialog>

        
        {/* ============================================================================ */}
        {/* INGEST PRIVATE LEAGUE & CROWDFUND MODAL */}
        {/* ============================================================================ */}
        <dialog
          ref={ingestLeagueDialogRef}
          {...({ closedby: 'any' } as any)}
          aria-labelledby={ingestLeagueTitleId}
          className="w-[94vw] sm:w-full sm:max-w-lg rounded-2xl border border-slate-700 bg-slate-900 text-slate-200 p-0 shadow-2xl backdrop:bg-black/75 m-auto overflow-hidden"
        >
          {showIngestLeagueModal && (
            <form onSubmit={handleSaveSyncedLeague} className="flex flex-col">
              <div className="p-4 border-b border-slate-800 bg-slate-800/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DownloadCloud className="w-4 h-4 text-emerald-400" />
                  <h2 id={ingestLeagueTitleId} className="text-sm font-bold text-white">
                    Ingest & Sync Private League Page
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => ingestLeagueDialogRef.current?.close()}
                  className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-5 space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Official Path of Exile Private League URL *
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://www.pathofexile.com/private-leagues/league/..."
                    value={formOfficialUrl}
                    onChange={(e) => setFormOfficialUrl(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 font-mono focus:outline-none focus:border-slate-700"
                  />
                </div>

                {/* Quick Paste Snippet Parser */}
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>Quick Paste from pathofexile.com:</span>
                    <button
                      type="button"
                      onClick={handleParseSnippet}
                      className="text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
                    >
                      Auto Parse Snippet
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Paste text or html from the PoE league crowdfund page here..."
                    value={rawSnippet}
                    onChange={(e) => setRawSnippet(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-mono focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase font-mono mb-1">
                      Funded Days
                    </label>
                    <input
                      type="number"
                      value={formFundedDays}
                      onChange={(e) => setFormFundedDays(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase font-mono mb-1">
                      Target Days
                    </label>
                    <input
                      type="number"
                      value={formTargetDays}
                      onChange={(e) => setFormTargetDays(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase font-mono mb-1">
                      Crowdfund Points Current
                    </label>
                    <input
                      type="number"
                      value={formPointsCurrent}
                      onChange={(e) => setFormPointsCurrent(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase font-mono mb-1">
                      Crowdfund Points Goal
                    </label>
                    <input
                      type="number"
                      value={formPointsGoal}
                      onChange={(e) => setFormPointsGoal(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase font-mono mb-1">
                      Current Player Slots
                    </label>
                    <input
                      type="number"
                      value={formSlots}
                      onChange={(e) => setFormSlots(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase font-mono mb-1">
                      Status
                    </label>
                    <select
                      value={formCrowdfundStatus}
                      onChange={(e) => setFormCrowdfundStatus(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200"
                    >
                      <option value="Crowdfunding Active">Crowdfunding Active</option>
                      <option value="Active & Recruiting">Active & Recruiting</option>
                      <option value="Launched & Live">Launched & Live</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => ingestLeagueDialogRef.current?.close()}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Sync League Data</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </dialog>

        {/* ============================================================================ */}
        {/* CONTENT MANAGER MODAL FOR LINKS, FAQS, AND ARCHIVES */}
        <Suspense fallback={null}>
          <LeagueContentManagerModal
          isOpen={isManagerModalOpen}
          onClose={() => setIsManagerModalOpen(false)}
          initialSection={managerInitialSection}
          quickLinks={quickLinks}
          onSaveQuickLinks={handleSaveQuickLinks}
          faqList={faqList}
          onSaveFaqList={handleSaveFaqList}
          archivesList={archivesList}
          onSaveArchivesList={handleSaveArchivesList}
          onResetSection={handleResetSection}
        />
        </Suspense>

        {/* ============================================================================ */}
        {/* START FRESH LEAGUE / RESET SEASON CONFIRMATION MODAL */}
        {/* ============================================================================ */}
        <dialog
          ref={resetDialogRef}
          {...({ closedby: 'any' } as any)}
          aria-labelledby={resetTitleId}
          className="w-[94vw] sm:w-full sm:max-w-lg rounded-2xl border border-slate-700 bg-slate-900 text-slate-200 p-0 shadow-2xl backdrop:bg-black/75 m-auto overflow-hidden"
        >
          {showResetModal && (
            <div className="flex flex-col">
              <div className="p-4 border-b border-slate-800 bg-slate-800/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <h2 id={resetTitleId} className="text-sm font-bold text-white">
                    Start Fresh League Season
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => resetDialogRef.current?.close()}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs text-slate-300 leading-relaxed">
                <p>
                  This will archive all active exiles into the <strong>Alumni & Outreach Hub</strong>, clear all wanted item wishlists and vault drops, and provide a completely clean sheet for the <strong>3.30 Coven of Umbra</strong> expansion.
                </p>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5 font-mono text-[11px] text-slate-400">
                  <div className="text-white font-semibold">What will happen:</div>
                  <div>• Active roster exiles archived to Alumni Directory</div>
                  <div>• Wishlists & Needs reset to 0 items</div>
                  <div>• Active sheet initialized with Host Leuie only</div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => resetDialogRef.current?.close()}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmStartFresh}
                    className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Confirm & Start Fresh</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </dialog>

    </div>
  );
};
