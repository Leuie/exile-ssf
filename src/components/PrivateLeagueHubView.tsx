import React, { useState, useEffect, useId, useRef } from 'react';
import {
  DownloadCloud,
  Users,
  Search,
  ExternalLink,
  ShieldCheck,
  Flame,
  CheckCircle2,
  Clock,
  Copy,
  Plus,
  BookOpen,
  Compass,
  Scroll,
  MessageSquare,
  History,
  HelpCircle,
  FolderLock,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  Globe,
  AtSign,
  Sparkles,
  RotateCcw,
  Send,
  AlertTriangle,
  Edit3,
  Archive,
  Save,
  ArrowLeft,
  Share2,
  ArrowUpDown,
  Trash2,
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
  INITIAL_FOUND_VAULT_ITEMS,
  INITIAL_COMMUNITY_GUIDES,
  SYNDICATE_CHEAT_SHEET,
  HEIST_CHEAT_SHEET,
  DELVE_FOSSIL_CHEAT_SHEET,
  INCURSION_CHEAT_SHEET,
  ATLAS_MAP_RATINGS,
  CRAFTING_BENCH_UNLOCKS,
  STASH_TAB_BUYER_TIERS
} from '../data/privateLeagueData';
import type {
  LeagueParticipantAlumnus,
  ActiveLeagueSession,
  LeagueRosterMember,
  LookingForItem,
  FoundUniqueVaultItem,
  CommunityGuide,
  ItemNeedStatus,
  UserAccount,
  PastPrivateLeague
} from '../types';
import { fireConfetti } from '../utils/confetti';
import { LeagueHeroBanner } from './LeagueHeroBanner';
import { LeagueContentManagerModal, type ManagerSectionType } from './LeagueContentManagerModal';
import { FullGuideReaderView } from './FullGuideReaderView';
import {
  fetchCloudLeagueData,
  saveCloudWishlistItem,
  deleteCloudWishlistItem,
  saveCloudRosterMember,
  saveCloudVaultItem,
  saveCloudGuide
} from '../services/cloudSync';

interface PrivateLeagueHubViewProps {
  userAccount?: UserAccount | null;
  onOpenAuthModal?: () => void;
  selectedGame?: 'poe1' | 'poe2';
  initialSessionId?: string;
  onUpdateUserAccount?: (account: UserAccount, rosterEntry: LeagueRosterMember) => void;
  onNavigateLeagues?: () => void;
}

export const PrivateLeagueHubView: React.FC<PrivateLeagueHubViewProps> = ({
  userAccount,
  onOpenAuthModal,
  selectedGame = 'poe1',
  initialSessionId,
  onUpdateUserAccount,
  onNavigateLeagues
}) => {
  // Horizontal Nav Tabs
  type HubTab = 'overview' | 'looking_for' | 'roster' | 'vault' | 'guides' | 'cheatsheets' | 'new_player' | 'alumni';
  const [activeTab, setActiveTab] = useState<HubTab>('overview');
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

  // Vault Found Items State
  const [vaultItems, setVaultItems] = useState<FoundUniqueVaultItem[]>(() => {
    try {
      const saved = localStorage.getItem('poe_clean330_vault');
      return saved ? JSON.parse(saved) : INITIAL_FOUND_VAULT_ITEMS;
    } catch {
      return INITIAL_FOUND_VAULT_ITEMS;
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
      localStorage.setItem('poe_clean330_vault', JSON.stringify(vaultItems));
    } catch {}
  }, [vaultItems]);

  useEffect(() => {
    try {
      localStorage.setItem('poe_umbraleague_guides', JSON.stringify(guides));
    } catch {}
  }, [guides]);

  // Guides Sort and Filter State
  const [guideSearch, setGuideSearch] = useState<string>('');
  const [guideSort, setGuideSort] = useState<'upvotes' | 'rating' | 'ascendancy' | 'title' | 'newest'>('upvotes');
  const [guideClassFilter, setGuideClassFilter] = useState<string>('all');
  const [guidePlaystyleFilter, setGuidePlaystyleFilter] = useState<string>('all');

  const filteredAndSortedGuides = guides
    .filter((g) => {
      if (guideSearch.trim()) {
        const query = guideSearch.toLowerCase().trim();
        const matchTitle = g.title.toLowerCase().includes(query);
        const matchAsc = g.ascendancy.toLowerCase().includes(query);
        const matchClass = g.className.toLowerCase().includes(query);
        const matchAuthor = g.authorName.toLowerCase().includes(query);
        const matchPlaystyle = g.playstyle.toLowerCase().includes(query);
        const matchLeveling = g.levelingNotes.toLowerCase().includes(query);
        const matchEndgame = g.endgameNotes.toLowerCase().includes(query);
        if (!matchTitle && !matchAsc && !matchClass && !matchAuthor && !matchPlaystyle && !matchLeveling && !matchEndgame) {
          return false;
        }
      }

      if (guideClassFilter !== 'all') {
        const c = g.className.toLowerCase();
        const a = g.ascendancy.toLowerCase();
        const target = guideClassFilter.toLowerCase();
        if (!c.includes(target) && !a.includes(target)) {
          return false;
        }
      }

      if (guidePlaystyleFilter !== 'all') {
        if (!g.playstyle.toLowerCase().includes(guidePlaystyleFilter.toLowerCase())) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      if (guideSort === 'upvotes') {
        return b.upvotes - a.upvotes;
      }
      if (guideSort === 'rating') {
        return b.starterRating - a.starterRating;
      }
      if (guideSort === 'ascendancy') {
        return a.ascendancy.localeCompare(b.ascendancy);
      }
      if (guideSort === 'title') {
        return a.title.localeCompare(b.title);
      }
      if (guideSort === 'newest') {
        return b.id.localeCompare(a.id);
      }
      return 0;
    });

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
      setActiveSessionId(initialSessionId);
    } else {
      setActiveSessionId(selectedGame === 'poe2' ? 'poe2-ea-ancients' : 'poe1-330-umbra');
    }
  }, [selectedGame, initialSessionId]);

  const currentSession = allLeagueSessions.find((s: ActiveLeagueSession) => s.id === activeSessionId) || allLeagueSessions[0] || ACTIVE_LEAGUE_SESSIONS[0];
  const isReadOnlyLeague = Boolean(currentSession.isReadOnlyArchive);

  // Cloudflare KV Cloud Sync State & Periodic Listener
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'connected' | 'syncing' | 'idle' | 'offline'>('idle');

  useEffect(() => {
    let isCancelled = false;

    const syncFromCloud = async () => {
      const data = await fetchCloudLeagueData(activeSessionId);
      if (isCancelled || !data) {
        return;
      }

      if (data.status === 'connected') {
        setCloudSyncStatus('connected');
        if (data.wishlist && Array.isArray(data.wishlist) && data.wishlist.length > 0) {
          setLookingForItems(data.wishlist);
        }
        if (data.roster && Array.isArray(data.roster) && data.roster.length > 0) {
          setRoster(data.roster);
        }
        if (data.vault && Array.isArray(data.vault)) {
          setVaultItems(data.vault);
        }
        if (data.guides && Array.isArray(data.guides) && data.guides.length > 0) {
          setGuides(data.guides);
        }
      }
    };

    syncFromCloud();
    const timer = setInterval(syncFromCloud, 20000);
    return () => {
      isCancelled = true;
      clearInterval(timer);
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

  // Hero Banner and Collapsible Category State
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('poe_league_collapsed_sections');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleSection = (id: string) => {
    setCollapsedSections((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try { localStorage.setItem('poe_league_collapsed_sections', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const setAllSectionsCollapsed = (collapsed: boolean) => {
    const allIds = ['onboarding', 'community', 'links', 'archives', 'faq'];
    const next: Record<string, boolean> = {};
    for (const id of allIds) next[id] = collapsed;
    setCollapsedSections(next);
    try { localStorage.setItem('poe_league_collapsed_sections', JSON.stringify(next)); } catch {}
  };

  // Editable Resources, FAQs, and Archives State
  const [quickLinks, setQuickLinks] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('poe_league_quick_links');
      if (saved) return JSON.parse(saved);
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
    try { localStorage.setItem('poe_league_quick_links', JSON.stringify(links)); } catch {}
    setCopyNotice('Resource links updated!');
    setTimeout(() => setCopyNotice(null), 2500);
  };

  const handleSaveFaqList = (faqs: any[]) => {
    setFaqList(faqs);
    try { localStorage.setItem('poe_league_faqs', JSON.stringify(faqs)); } catch {}
    setCopyNotice('F.A.Q. list updated!');
    setTimeout(() => setCopyNotice(null), 2500);
  };

  const handleSaveArchivesList = (archives: any[]) => {
    setArchivesList(archives);
    try { localStorage.setItem('poe_league_archives', JSON.stringify(archives)); } catch {}
    setCopyNotice('Archives list updated!');
    setTimeout(() => setCopyNotice(null), 2500);
  };

  const handleResetSection = (sec: ManagerSectionType) => {
    if (sec === 'links') {
      setQuickLinks(COVEN_OF_UMBRA_INFO.quickLinks);
      try { localStorage.removeItem('poe_league_quick_links'); } catch {}
    } else if (sec === 'faq') {
      setFaqList(NOIR_LEAGUE_FAQ);
      try { localStorage.removeItem('poe_league_faqs'); } catch {}
    } else if (sec === 'archives') {
      setArchivesList(PAST_NOIR_LEAGUES);
      try { localStorage.removeItem('poe_league_archives'); } catch {}
    }
    setCopyNotice('Restored defaults for ' + sec);
    setTimeout(() => setCopyNotice(null), 2500);
  };

  // Dynamic Private League Ingestion & Crowdfund Sync State
  const [showIngestLeagueModal, setShowIngestLeagueModal] = useState<boolean>(false);
  const ingestLeagueDialogRef = useRef<HTMLDialogElement>(null);
  const ingestLeagueTitleId = useId();

  const [syncedLeagueData, setSyncedLeagueData] = useState<any>(() => {
    try {
      const saved = localStorage.getItem(`poe_league_sync_${activeSessionId}`);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`poe_league_sync_${activeSessionId}`);
      setSyncedLeagueData(saved ? JSON.parse(saved) : null);
    } catch {}
  }, [activeSessionId]);

  // Merge synced data with currentInfo
  const activeLeagueInfo = {
    ...currentInfo,
    ...(syncedLeagueData || {})
  };

  // Ingest form inputs
  const [formOfficialUrl, setFormOfficialUrl] = useState<string>(activeLeagueInfo.officialLeagueUrl || '');
  const [formFundedDays, setFormFundedDays] = useState<number>(activeLeagueInfo.fundedDays || 20);
  const [formTargetDays, setFormTargetDays] = useState<number>(activeLeagueInfo.targetDays || 40);
  const [formPointsCurrent, setFormPointsCurrent] = useState<number>(activeLeagueInfo.crowdfundPointsCurrent || 1850);
  const [formPointsGoal, setFormPointsGoal] = useState<number>(activeLeagueInfo.crowdfundPointsGoal || 3000);
  const [formSlots, setFormSlots] = useState<number>(activeLeagueInfo.currentSlots || 30);
  const [formCrowdfundStatus, setFormCrowdfundStatus] = useState<string>(syncedLeagueData?.crowdfundStatus || 'Crowdfunding Active');
  const [rawSnippet, setRawSnippet] = useState<string>('');

  const handleOpenIngestModal = () => {
    setFormOfficialUrl(activeLeagueInfo.officialLeagueUrl);
    setFormFundedDays(activeLeagueInfo.fundedDays);
    setFormTargetDays(activeLeagueInfo.targetDays);
    setFormPointsCurrent(activeLeagueInfo.crowdfundPointsCurrent || 1850);
    setFormPointsGoal(activeLeagueInfo.crowdfundPointsGoal || 3000);
    setFormSlots(activeLeagueInfo.currentSlots);
    setShowIngestLeagueModal(true);
    setTimeout(() => {
      ingestLeagueDialogRef.current?.showModal();
    }, 10);
  };

  const handleParseSnippet = () => {
    if (!rawSnippet.trim()) return;
    // Extract slots
    const slotMatch = rawSnippet.match(/(\d+)\s*(?:player|slot)/i);
    if (slotMatch) setFormSlots(parseInt(slotMatch[1], 10));

    // Extract days
    const dayMatch = rawSnippet.match(/(\d+)\s*days/i);
    if (dayMatch) setFormFundedDays(parseInt(dayMatch[1], 10));

    // Extract points
    const pointsMatch = rawSnippet.match(/([\d,]+)\s*\/\s*([\d,]+)\s*points/i);
    if (pointsMatch) {
      setFormPointsCurrent(parseInt(pointsMatch[1].replace(/,/g, ''), 10));
      setFormPointsGoal(parseInt(pointsMatch[2].replace(/,/g, ''), 10));
    }

    // Extract URL
    const urlMatch = rawSnippet.match(/https:\/\/www\.pathofexile\.com\/private-leagues\/league\/[^\s"']+/i);
    if (urlMatch) setFormOfficialUrl(urlMatch[0]);

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
  const [alumniList, setAlumniList] = useState<LeagueParticipantAlumnus[]>(() => {
    try {
      const saved = localStorage.getItem('poe_noir_alumni');
      return saved ? JSON.parse(saved) : NOIR_ALUMNI_PARTICIPANTS;
    } catch {
      return NOIR_ALUMNI_PARTICIPANTS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('poe_noir_alumni', JSON.stringify(alumniList));
    } catch {}
  }, [alumniList]);

  // Alumni Search & Filter State
  const [alumniSearch, setAlumniSearch] = useState<string>('');
  const [alumniFilter, setAlumniFilter] = useState<'all' | 'not_nudged' | 'nudged' | 'veteran'>('all');

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
      return updatedAlumni;
    });

    // 2. Reset active roster to clean host only
    setRoster(getInitialLeagueRoster());
    setLookingForItems([]);
    setVaultItems([]);

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
    setAlumniList((prev: LeagueParticipantAlumnus[]) =>
      prev.map((a: LeagueParticipantAlumnus) => {
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
      })
    );
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

  // Countdowns
  const [timeToReveal, setTimeToReveal] = useState<{ d: number; h: number; m: number; s: number }>({ d: 0, h: 0, m: 0, s: 0 });
  const [timeToLaunch, setTimeToLaunch] = useState<{ d: number; h: number; m: number; s: number }>({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    const updateCountdowns = () => {
      const now = new Date().getTime();
      const reveal = new Date(COVEN_OF_UMBRA_INFO.revealDateIso).getTime();
      const launch = new Date(currentSession.launchDateIso).getTime();

      const diffReveal = Math.max(0, reveal - now);
      const diffLaunch = Math.max(0, launch - now);

      setTimeToReveal({
        d: Math.floor(diffReveal / (1000 * 60 * 60 * 24)),
        h: Math.floor((diffReveal % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        m: Math.floor((diffReveal % (1000 * 60 * 60)) / (1000 * 60)),
        s: Math.floor((diffReveal % (1000 * 60)) / 1000)
      });

      setTimeToLaunch({
        d: Math.floor(diffLaunch / (1000 * 60 * 60 * 24)),
        h: Math.floor((diffLaunch % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        m: Math.floor((diffLaunch % (1000 * 60 * 60)) / (1000 * 60)),
        s: Math.floor((diffLaunch % (1000 * 60)) / 1000)
      });
    };

    updateCountdowns();
    const interval = setInterval(updateCountdowns, 1000);
    return () => clearInterval(interval);
  }, []);

  // Wishlists & Needs State (Unified with Drop Matcher)
  const [lookingForViewMode, setLookingForViewMode] = useState<'item' | 'player' | 'table'>('item');
  const [lookingForSearch, setLookingForSearch] = useState<string>('');
  const [lookingForCategoryFilter, setLookingForCategoryFilter] = useState<string>('All');
  const [lookingForStatusFilter, setLookingForStatusFilter] = useState<string>('All');
  const [selectedInspectItemName, setSelectedInspectItemName] = useState<string | null>(null);

  const itemInspectDialogRef = useRef<HTMLDialogElement>(null);
  const inspectTitleId = useId();

  // Wishlist Edit and Delete State
  const [editingLookingForItem, setEditingLookingForItem] = useState<LookingForItem | null>(null);
  const [editItemName, setEditItemName] = useState<string>('');
  const [editCategory, setEditCategory] = useState<LookingForItem['category']>('Unique');
  const [editStatus, setEditStatus] = useState<ItemNeedStatus>('NEED');
  const [editNotes, setEditNotes] = useState<string>('');
  const [editChar, setEditChar] = useState<string>('');
  const [editDisplay, setEditDisplay] = useState<string>('');
  const editLookingForDialogRef = useRef<HTMLDialogElement>(null);

  const aggregatedItemsMap = React.useMemo(() => {
    const map = new Map<string, {
      itemName: string;
      category: string;
      poeWikiUrl: string;
      poeDbUrl: string;
      entries: LookingForItem[];
      activeNeeds: number;
    }>();

    for (const item of lookingForItems) {
      const key = item.itemName.trim().toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          itemName: item.itemName.trim(),
          category: item.category,
          poeWikiUrl: item.poeWikiUrl,
          poeDbUrl: item.poeDbUrl,
          entries: [],
          activeNeeds: 0
        });
      }
      const existing = map.get(key)!;
      existing.entries.push(item);
      if (item.status === 'NEED' || item.status === 'SECOND CHAR' || item.status === 'LOW PRIO') {
        existing.activeNeeds += 1;
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      if (b.activeNeeds !== a.activeNeeds) return b.activeNeeds - a.activeNeeds;
      return a.itemName.localeCompare(b.itemName);
    });
  }, [lookingForItems]);

  const filteredAggregatedItems = React.useMemo(() => {
    return aggregatedItemsMap.filter((entry) => {
      const searchLow = lookingForSearch.toLowerCase();
      const matchText =
        !lookingForSearch ||
        entry.itemName.toLowerCase().includes(searchLow) ||
        entry.entries.some(
          (e) =>
            (e.displayName && e.displayName.toLowerCase().includes(searchLow)) ||
            e.characterName.toLowerCase().includes(searchLow) ||
            (e.discordName && e.discordName.toLowerCase().includes(searchLow)) ||
            (e.notes && e.notes.toLowerCase().includes(searchLow))
        );
      const matchCat =
        lookingForCategoryFilter === 'All' ||
        entry.category === lookingForCategoryFilter ||
        (lookingForCategoryFilter === 'Gem' &&
          (entry.category === 'Gem' || entry.category === 'Vaal Gem' || entry.category === 'Transfigured Gem'));
      const matchStatus =
        lookingForStatusFilter === 'All' ||
        entry.entries.some((e) => e.status === lookingForStatusFilter);
      return matchText && matchCat && matchStatus;
    });
  }, [aggregatedItemsMap, lookingForSearch, lookingForCategoryFilter, lookingForStatusFilter]);

  const filteredLookingForItems = React.useMemo(() => {
    return lookingForItems.filter((item) => {
      const searchLow = lookingForSearch.toLowerCase();
      const matchSearch =
        !lookingForSearch ||
        item.itemName.toLowerCase().includes(searchLow) ||
        item.characterName.toLowerCase().includes(searchLow) ||
        (item.displayName && item.displayName.toLowerCase().includes(searchLow)) ||
        (item.discordName && item.discordName.toLowerCase().includes(searchLow)) ||
        (item.notes && item.notes.toLowerCase().includes(searchLow));

      const matchCat =
        lookingForCategoryFilter === 'All' ||
        item.category === lookingForCategoryFilter ||
        (lookingForCategoryFilter === 'Gem' &&
          (item.category === 'Gem' || item.category === 'Vaal Gem' || item.category === 'Transfigured Gem'));

      const matchStatus =
        lookingForStatusFilter === 'All' || item.status === lookingForStatusFilter;

      return matchSearch && matchCat && matchStatus;
    });
  }, [lookingForItems, lookingForSearch, lookingForCategoryFilter, lookingForStatusFilter]);

  const inspectedItemData = React.useMemo(() => {
    if (!selectedInspectItemName) return null;
    return aggregatedItemsMap.find(
      (it) => it.itemName.toLowerCase() === selectedInspectItemName.toLowerCase()
    );
  }, [aggregatedItemsMap, selectedInspectItemName]);

  const handleOpenItemInspector = (itemName: string) => {
    setSelectedInspectItemName(itemName);
    setTimeout(() => {
      itemInspectDialogRef.current?.showModal();
    }, 10);
  };

  useEffect(() => {
    const dialog = itemInspectDialogRef.current;
    if (!dialog) return;

    let handleBackdropClick: ((e: MouseEvent) => void) | undefined;
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      handleBackdropClick = (e: MouseEvent) => {
        if (e.target === dialog) {
          const rect = dialog.getBoundingClientRect();
          const clickedInDialog =
            rect.top <= e.clientY &&
            e.clientY <= rect.top + rect.height &&
            rect.left <= e.clientX &&
            e.clientX <= rect.left + rect.width;
          if (!clickedInDialog) {
            dialog.close();
          }
        }
      };
      dialog.addEventListener('click', handleBackdropClick);
    }
    return () => {
      if (handleBackdropClick) dialog.removeEventListener('click', handleBackdropClick);
    };
  }, []);

  const handleCycleStatus = (itemId: string) => {
    setLookingForItems((prev) =>
      prev.map((it) => {
        if (it.id === itemId) {
          const nextStatus: ItemNeedStatus =
            it.status === 'NEED'
              ? 'HAVE'
              : it.status === 'HAVE'
              ? 'SECOND CHAR'
              : it.status === 'SECOND CHAR'
              ? 'LOW PRIO'
              : 'NEED';
          if (nextStatus === 'HAVE') {
            fireConfetti();
          }
          return { ...it, status: nextStatus };
        }
        return it;
      })
    );
  };

  useEffect(() => {
    const dialog = editLookingForDialogRef.current;
    if (!dialog) return;

    let handleBackdropClick: ((e: MouseEvent) => void) | undefined;
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      handleBackdropClick = (e: MouseEvent) => {
        if (e.target === dialog) {
          const rect = dialog.getBoundingClientRect();
          const clickedInDialog =
            rect.top <= e.clientY &&
            e.clientY <= rect.top + rect.height &&
            rect.left <= e.clientX &&
            e.clientX <= rect.left + rect.width;
          if (!clickedInDialog) {
            dialog.close();
            setEditingLookingForItem(null);
          }
        }
      };
      dialog.addEventListener('click', handleBackdropClick);
    }
    return () => {
      if (handleBackdropClick) dialog.removeEventListener('click', handleBackdropClick);
    };
  }, []);

  const isCurrentUserAdmin = Boolean(
    userAccount?.isAdmin ||
    userAccount?.displayName?.toLowerCase() === 'leuie' ||
    userAccount?.poeAccountName?.toLowerCase() === 'leuie#0001'
  );

  const canEditOrDeleteWishlist = (item: LookingForItem): boolean => {
    if (isCurrentUserAdmin) return true;
    if (!userAccount) return false;

    const uDisp = userAccount.displayName?.toLowerCase().trim();
    const uChar = userAccount.characterName?.toLowerCase().trim();
    const uPoe = userAccount.poeAccountName?.toLowerCase().trim();
    const uDisc = userAccount.discordName?.toLowerCase().trim();

    const iDisp = item.displayName?.toLowerCase().trim();
    const iChar = item.characterName?.toLowerCase().trim();
    const iPoe = item.poeAccountName?.toLowerCase().trim();
    const iDisc = item.discordName?.toLowerCase().trim();

    if (uDisp && iDisp && uDisp === iDisp) return true;
    if (uChar && iChar && uChar === iChar) return true;
    if (uPoe && iPoe && uPoe === iPoe) return true;
    if (uDisc && iDisc && uDisc === iDisc) return true;

    return false;
  };

  const handleStartEditLookingForItem = (item: LookingForItem) => {
    if (!canEditOrDeleteWishlist(item)) {
      triggerCopy('', 'Permission denied: Only admin or the requestor can edit this request');
      return;
    }
    setEditingLookingForItem(item);
    setEditItemName(item.itemName);
    setEditCategory(item.category);
    setEditStatus(item.status);
    setEditNotes(item.notes || '');
    setEditChar(item.characterName || '');
    setEditDisplay(item.displayName || '');
    setTimeout(() => {
      editLookingForDialogRef.current?.showModal();
    }, 10);
  };

  const handleSaveEditLookingForItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLookingForItem) return;
    const cleanItemName = editItemName.trim();
    if (!cleanItemName) return;

    const wikiSlug = encodeURIComponent(cleanItemName.replace(/\s+/g, '_'));
    const updated: LookingForItem[] = lookingForItems.map((it) => {
      if (it.id === editingLookingForItem.id) {
        return {
          ...it,
          itemName: cleanItemName,
          category: editCategory,
          status: editStatus,
          notes: editNotes.trim(),
          characterName: editChar.trim() || it.characterName,
          displayName: editDisplay.trim() || it.displayName,
          poeWikiUrl: `https://www.poewiki.net/wiki/${wikiSlug}`,
          poeDbUrl: `https://poedb.tw/us/${wikiSlug}`
        };
      }
      return it;
    });

    setLookingForItems(updated);
    try {
      localStorage.setItem('poe_clean330_looking_for', JSON.stringify(updated));
    } catch {}

    const updatedTarget = updated.find((it) => it.id === editingLookingForItem.id);
    if (updatedTarget) {
      saveCloudWishlistItem(activeSessionId, updatedTarget);
    }

    editLookingForDialogRef.current?.close();
    setEditingLookingForItem(null);
    triggerCopy('', `Updated wishlist item: ${cleanItemName}`);

    if (selectedInspectItemName && selectedInspectItemName.toLowerCase() === editingLookingForItem.itemName.toLowerCase()) {
      setSelectedInspectItemName(cleanItemName);
    }
  };

  const handleDeleteLookingForItem = (itemId: string) => {
    const target = lookingForItems.find((it) => it.id === itemId);
    if (!target) return;
    if (!canEditOrDeleteWishlist(target)) {
      triggerCopy('', 'Permission denied: Only admin or the requestor can delete this request');
      return;
    }

    const updated = lookingForItems.filter((it) => it.id !== itemId);
    setLookingForItems(updated);
    try {
      localStorage.setItem('poe_clean330_looking_for', JSON.stringify(updated));
      const delRaw = localStorage.getItem('poe_clean330_looking_for_deleted');
      const delList: string[] = delRaw ? JSON.parse(delRaw) : [];
      if (!delList.includes(itemId)) {
        delList.push(itemId);
        localStorage.setItem('poe_clean330_looking_for_deleted', JSON.stringify(delList));
      }
    } catch {}

    deleteCloudWishlistItem(activeSessionId, itemId);
    triggerCopy('', `Removed ${target.itemName} from wishlist`);

    if (selectedInspectItemName && selectedInspectItemName.toLowerCase() === target.itemName.toLowerCase()) {
      const remaining = updated.filter((it) => it.itemName.toLowerCase() === target.itemName.toLowerCase());
      if (remaining.length === 0) {
        itemInspectDialogRef.current?.close();
        setSelectedInspectItemName(null);
      }
    }
  };

  // Roster Search & Filters
  const [rosterSearch, setRosterSearch] = useState<string>('');
  const [rosterAscendancyFilter, setRosterAscendancyFilter] = useState<string>('All');
  const [rosterLaunchFilter, setRosterLaunchFilter] = useState<string>('All');
  const [selectedPlayerModal, setSelectedPlayerModal] = useState<LeagueRosterMember | null>(null);

  const playerProfileDialogRef = useRef<HTMLDialogElement>(null);
  const playerProfileTitleId = useId();

  const filteredRoster = roster.filter((member) => {
    const searchLow = rosterSearch.toLowerCase();
    const matchSearch =
      !rosterSearch ||
      member.displayName.toLowerCase().includes(searchLow) ||
      member.characterName.toLowerCase().includes(searchLow) ||
      member.poeAccountName.toLowerCase().includes(searchLow) ||
      (member.discordName && member.discordName.toLowerCase().includes(searchLow)) ||
      (member.steamName && member.steamName.toLowerCase().includes(searchLow)) ||
      member.buildName.toLowerCase().includes(searchLow) ||
      member.ascendancy.toLowerCase().includes(searchLow) ||
      member.atlasContent.some((c) => c.toLowerCase().includes(searchLow));

    const matchAsc =
      rosterAscendancyFilter === 'All' || member.ascendancy === rosterAscendancyFilter;
    const matchLaunch =
      rosterLaunchFilter === 'All' || member.availableAtLaunch === rosterLaunchFilter;

    return matchSearch && matchAsc && matchLaunch;
  });

  // Inline Character Modal Editor State
  const [isEditingProfileModal, setIsEditingProfileModal] = useState<boolean>(false);
  const [modalEditPoeAccount, setModalEditPoeAccount] = useState<string>('');
  const [modalEditCharName, setModalEditCharName] = useState<string>('');
  const [modalEditAsc, setModalEditAsc] = useState<string>('Elementalist');
  const [modalEditLevel, setModalEditLevel] = useState<number>(95);
  const [modalEditBuild, setModalEditBuild] = useState<string>('');
  const [modalEditPob, setModalEditPob] = useState<string>('');
  const [modalEditNotes, setModalEditNotes] = useState<string>('');

  const handleOpenPlayerModal = (member: LeagueRosterMember) => {
    setSelectedPlayerModal(member);
    setIsEditingProfileModal(false);
    setModalEditPoeAccount(member.poeAccountName || '');
    setModalEditCharName(member.characterName || '');
    setModalEditAsc(member.ascendancy || 'Elementalist');
    setModalEditLevel(member.level || 1);
    setModalEditBuild(member.buildName || '');
    setModalEditPob(member.pobUrl || '');
    setModalEditNotes(member.notes || '');
    setTimeout(() => {
      playerProfileDialogRef.current?.showModal();
    }, 10);
  };

  const handleSaveModalCharacterDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayerModal) return;

    const matchedAsc = currentAscendancyCatalog.find((a) => a.name === modalEditAsc);
    const resolvedClass = matchedAsc ? matchedAsc.baseClass : selectedPlayerModal.className;
    const cleanAccountName = modalEditPoeAccount.trim() || selectedPlayerModal.poeAccountName;
    const cleanCharName = modalEditCharName.trim() || selectedPlayerModal.characterName;

    const updatedMember: LeagueRosterMember = {
      ...selectedPlayerModal,
      poeAccountName: cleanAccountName,
      poeProfileUrl: `https://www.pathofexile.com/account/view-profile/${encodeURIComponent(cleanAccountName.split('#')[0])}`,
      characterName: cleanCharName,
      ascendancy: modalEditAsc,
      className: resolvedClass,
      level: Number(modalEditLevel) || 1,
      buildName: modalEditBuild.trim() || 'Undecided Starter',
      pobUrl: modalEditPob.trim() || undefined,
      notes: modalEditNotes.trim()
    };

    // Update selectedPlayerModal immediately so modal shows new info!
    setSelectedPlayerModal(updatedMember);
    saveCloudRosterMember(activeSessionId, updatedMember);

    // Update roster state & localStorage
    setRoster((prev) => {
      const next = prev.map((m) =>
        (m.id === updatedMember.id || m.displayName.toLowerCase() === updatedMember.displayName.toLowerCase())
          ? updatedMember
          : m
      );
      try {
        localStorage.setItem('poe_clean330_roster', JSON.stringify(next));
      } catch {}
      return next;
    });

    // Update userAccount in parent & localStorage
    if (userAccount) {
      const updatedAccount: UserAccount = {
        ...userAccount,
        poeAccountName: updatedMember.poeAccountName,
        poeProfileUrl: updatedMember.poeProfileUrl,
        characterName: updatedMember.characterName,
        ascendancy: updatedMember.ascendancy,
        className: updatedMember.className,
        level: updatedMember.level,
        buildName: updatedMember.buildName,
        pobUrl: updatedMember.pobUrl,
        notes: updatedMember.notes
      };

      try {
        localStorage.setItem('poe_umbraleague_user', JSON.stringify(updatedAccount));

        const accountsRaw = localStorage.getItem('poe_clean330_accounts');
        const accountsList = accountsRaw ? JSON.parse(accountsRaw) : [];
        const aIdx = accountsList.findIndex((a: any) =>
          a.username.toLowerCase() === updatedAccount.displayName.toLowerCase() ||
          (updatedAccount.email && a.userAccount?.email?.toLowerCase() === updatedAccount.email.toLowerCase())
        );
        if (aIdx >= 0) {
          accountsList[aIdx].userAccount = updatedAccount;
          accountsList[aIdx].rosterEntry = updatedMember;
          localStorage.setItem('poe_clean330_accounts', JSON.stringify(accountsList));
        }
      } catch {}

      if (onUpdateUserAccount) {
        onUpdateUserAccount(updatedAccount, updatedMember);
      }
    }

    setIsEditingProfileModal(false);
    fireConfetti();
  };

  // Add Wanted Item Form State
  const [showAddLookingForModal, setShowAddLookingForModal] = useState<boolean>(false);
  const [newLfChar, setNewLfChar] = useState<string>(userAccount?.characterName || '');
  const [newLfDisplay, setNewLfDisplay] = useState<string>(userAccount?.displayName || '');
  const [newLfItem, setNewLfItem] = useState<string>('');
  const [newLfCat, setNewLfCat] = useState<LookingForItem['category']>('Unique');
  const [newLfStatus, setNewLfStatus] = useState<ItemNeedStatus>('NEED');
  const [newLfNotes, setNewLfNotes] = useState<string>('');

  const handleAddLookingForItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLfItem.trim() || !newLfChar.trim()) return;

    const matchedMem = findMember(newLfChar.trim(), newLfDisplay.trim());

    const newItem: LookingForItem = {
      id: `lf-${Date.now()}`,
      characterName: newLfChar.trim(),
      displayName: newLfDisplay.trim() || undefined,
      preferredContact: matchedMem?.preferredContact || userAccount?.preferredContact || 'app',
      discordName: matchedMem?.discordName || userAccount?.discordName,
      poeAccountName: matchedMem?.poeAccountName || userAccount?.poeAccountName,
      itemName: newLfItem.trim(),
      category: newLfCat,
      status: newLfStatus,
      notes: newLfNotes.trim() || 'Any roll acceptable',
      poeWikiUrl: `https://www.poewiki.net/wiki/${encodeURIComponent(newLfItem.trim().replace(/ /g, '_'))}`,
      poeDbUrl: `https://poedb.tw/us/search?q=${encodeURIComponent(newLfItem.trim())}`
    };

    setLookingForItems([newItem, ...lookingForItems]);
    saveCloudWishlistItem(activeSessionId, newItem);
    setNewLfItem('');
    setNewLfNotes('');
    setShowAddLookingForModal(false);
    fireConfetti();
  };

  const lookingForGrouped = React.useMemo(() => {
    const map = new Map<string, LookingForItem[]>();
    for (const item of filteredLookingForItems) {
      const groupKey = item.displayName || item.characterName;
      if (!map.has(groupKey)) {
        map.set(groupKey, []);
      }
      map.get(groupKey)!.push(item);
    }
    return map;
  }, [filteredLookingForItems]);

  // Vault State
  const [showAddVaultModal, setShowAddVaultModal] = useState<boolean>(false);
  const [vItemName, setVItemName] = useState<string>('');
  const [vLoc, setVLoc] = useState<'Guild Tab 1 (Uniques)' | 'Guild Tab 2 (Bases & Gems)' | 'Whisper Finder' | 'Admin Hold Tab'>('Guild Tab 1 (Uniques)');
  const [vSockets, setVSockets] = useState<string>('');
  const [vNotes, setVNotes] = useState<string>('');

  const handleAddVaultItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vItemName.trim()) return;

    const newItem: FoundUniqueVaultItem = {
      id: `vault-${Date.now()}`,
      itemName: vItemName.trim(),
      category: 'Unique',
      finderCharacter: userAccount?.characterName || 'Leuie_Umbra',
      finderDiscord: userAccount?.discordName || '@leuie',
      location: vLoc,
      socketsOrRoll: vSockets.trim() || 'Clean / Unidentified',
      notes: vNotes.trim() || 'Deposited in Guild Stash',
      status: 'Available',
      postedAt: 'Just now',
      poeWikiUrl: `https://www.poewiki.net/wiki/${encodeURIComponent(vItemName.trim().replace(/ /g, '_'))}`,
      poeDbUrl: `https://poedb.tw/us/search?q=${encodeURIComponent(vItemName.trim())}`
    };

    setVaultItems([newItem, ...vaultItems]);
    saveCloudVaultItem(activeSessionId, newItem);
    setVItemName('');
    setVSockets('');
    setVNotes('');
    setShowAddVaultModal(false);
    fireConfetti();
  };

  const handleClaimVaultItem = (itemId: string) => {
    setVaultItems((prev) =>
      prev.map((it) => {
        if (it.id === itemId) {
          const isClaimed = it.status === 'Claimed / Traded';
          if (!isClaimed) fireConfetti();
          return {
            ...it,
            status: isClaimed ? 'Available' : 'Claimed / Traded',
            claimedBy: isClaimed ? undefined : (userAccount?.characterName || 'League Member')
          };
        }
        return it;
      })
    );
  };

  // Cheat Sheets Sub tabs
  type CheatSubTab = 'syndicate' | 'heist' | 'delve' | 'incursion' | 'maps';
  const [cheatSubTab, setCheatSubTab] = useState<CheatSubTab>('syndicate');
  const [cheatSearch, setCheatSearch] = useState<string>('');

  // FAQ
  const [openFaqIndices, setOpenFaqIndices] = useState<number[]>([0]);
  const toggleFaq = (index: number) => {
    setOpenFaqIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  if (activeReadingGuide) {
    return (
      <FullGuideReaderView
        guide={activeReadingGuide}
        onBack={() => setActiveReadingGuide(null)}
        onUpdateGuide={(updated) => {
          setActiveReadingGuide(updated);
          setGuides((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
          saveCloudGuide(activeSessionId, updated);
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
        
        {/* Upper Row: League Title & Key Metadata Chips */}
        <div className="px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="font-poppins font-bold text-xs sm:text-sm tracking-wide text-white truncate max-w-[180px] sm:max-w-none">
                {currentSession.name}
              </span>

            {/* League Session Selector */}
            <select
              value={activeSessionId}
              onChange={(e) => setActiveSessionId(e.target.value)}
              className="bg-slate-800/90 border border-slate-700 rounded-lg px-2 py-1 text-[11px] font-mono text-slate-200 focus:outline-none focus:border-slate-600 max-w-[150px] sm:max-w-none truncate"
            >
              {allLeagueSessions.map((sess) => (
                <option key={sess.id} value={sess.id}>
                  {sess.name} ({sess.version}) {sess.isReadOnlyArchive ? '• Archived' : sess.isActive ? '• Active' : '• Upcoming'}
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
                <span>Private League Hub</span>
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
              <span>Share League</span>
            </button>

            </div>
            <span className="hidden sm:inline-block text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
              Patch {currentSession.version}
            </span>
            <span className="hidden md:inline-block text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
              {activeLeagueInfo.fundedDays}/{activeLeagueInfo.targetDays} Days Funded
            </span>
            <span className="hidden lg:inline-block text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
              {roster.length}/{activeLeagueInfo.currentSlots} Slots Filled
            </span>
            {cloudSyncStatus === 'connected' && (
              <span className="hidden xl:inline-flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/80" title="Connected to Cloudflare KV Database">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Cloud Live</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Quick in game channel copy */}
            <button
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
              className="hidden sm:flex px-2.5 py-1 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-800/80 text-[11px] text-emerald-300 items-center gap-1.5 transition-colors"
              title="Official GSF Gathering Place on Root"
            >
              <Users className="w-3 h-3 text-emerald-400" />
              <span>Ravenwatch Root</span>
              <ExternalLink className="w-2.5 h-2.5 text-emerald-500" />
            </a>

            {/* Official League */}
            {activeLeagueInfo.officialLeagueUrl ? (
              <a
                href={activeLeagueInfo.officialLeagueUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:flex px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-[11px] text-slate-300 items-center gap-1.5 transition-colors"
              >
                <ShieldCheck className="w-3 h-3 text-amber-400" />
                <span>Official Ladder</span>
                <ExternalLink className="w-2.5 h-2.5 text-slate-500" />
              </a>
            ) : (
              <button
                type="button"
                onClick={handleOpenIngestModal}
                className="hidden md:flex px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-400 items-center gap-1.5 transition-colors cursor-pointer"
                title="League link pending official creation by GGG. Click to ingest once live."
              >
                <ShieldCheck className="w-3 h-3 text-slate-500" />
                <span>Ladder (Pending 3.30 Creation)</span>
              </button>
            )}

            {/* User Account / Profile action */}
            <button
              onClick={onOpenAuthModal}
              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span>{userAccount ? `@${userAccount.displayName}` : 'Login'}</span>
            </button>
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

        {/* Lower Row: Full Width Horizontal Navigation Tabs */}
        <div className="px-2 sm:px-6 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2 touch-pan-x flex-nowrap">
          {[
            { id: 'overview', label: 'Command Center', icon: Flame, badge: null },
            { id: 'looking_for', label: 'Wishlists & Needs', icon: Sparkles, badge: `${lookingForItems.length}` },
            { id: 'roster', label: 'Roster Directory', icon: Users, badge: `${roster.length}` },
            { id: 'vault', label: 'Guild Stash Vault', icon: FolderLock, badge: `${vaultItems.length}` },
            { id: 'guides', label: 'Build Guides', icon: BookOpen, badge: `${guides.length}` },
            { id: 'cheatsheets', label: 'Mechanic Cheat Sheets', icon: Scroll, badge: null },
            { id: 'new_player', label: 'Bench & Stash Guide', icon: Compass, badge: null },
            { id: 'alumni', label: 'Alumni & Outreach', icon: History, badge: `${alumniList.length}` }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as HubTab)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer flex-shrink-0 min-h-[38px] ${
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
                      isActive ? 'bg-slate-700 text-slate-200' : 'bg-slate-800 text-slate-500'
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
        {/* ============================================================================ */}
        {/* TAB 1: OVERVIEW & COMMAND CENTER */}
        {/* ============================================================================ */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* Hero Launch Banner with Artwork and Game Avatar */}
            <LeagueHeroBanner
              activeSessionId={activeSessionId}
              isPoE2Session={isPoE2Session}
              activeLeagueInfo={activeLeagueInfo}
              userAccount={userAccount}
              onOpenAuthModal={onOpenAuthModal}
              triggerCopy={triggerCopy}
            />

            {/* Category Collapsible Master Controls */}
            <div className="px-4 py-2 rounded-xl border border-slate-800/80 bg-slate-900/60 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2 text-slate-400">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                <span>Command Center Guides & Resources (5 Collapsible Sections)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAllSectionsCollapsed(false)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  Expand All
                </button>
                <button
                  type="button"
                  onClick={() => setAllSectionsCollapsed(true)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  Collapse All
                </button>
              </div>
            </div>

            {/* Live Crowdfunding Banner & Ingest Action */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-lg">
              <div className="p-3 border-b border-slate-800 bg-slate-800/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-300 font-bold">
                    Official Crowdfund & Ladder Link
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase font-bold">
                    {activeLeagueInfo.crowdfundStatus || 'Crowdfunding Active'}
                  </span>
                </div>
              </div>
                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-xs text-slate-300">
                      Funded: <strong>{activeLeagueInfo.fundedDays} / {activeLeagueInfo.targetDays} Days</strong> • Points: <strong>{activeLeagueInfo.crowdfundPointsCurrent || 1850} / {activeLeagueInfo.crowdfundPointsGoal || 3000}</strong> • Slots: <strong>{roster.length} / {activeLeagueInfo.currentSlots} Exiles</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {activeLeagueInfo.officialLeagueUrl ? (
                      <a
                        href={activeLeagueInfo.officialLeagueUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Contribute Points on PathOfExile.com</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={handleOpenIngestModal}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Crowdfund link will unlock when 3.30 league page is created by GGG. Click to ingest once live."
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                        <span>Points Crowdfund (Pending 3.30 Creation)</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleOpenIngestModal}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Update or paste official crowdfund parameters from pathofexile.com"
                    >
                      <DownloadCloud className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Ingest League Page</span>
                    </button>
                  </div>
                </div>
            </div>


            {/* Live Countdowns Bar */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-lg">
              <div className="p-3 border-b border-slate-800 bg-slate-800/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                    Official Reveal & Launch Countdown Tracker
                  </span>
                </div>
              </div>
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 flex items-center justify-between">
                      <div>
                        <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" /> ExileCon Reveal Livestream
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">November 6, 2026</div>
                      </div>
                      <div className="flex items-center gap-2 font-orbitron text-lg font-bold text-slate-100">
                        <span className="p-1.5 rounded bg-slate-800 border border-slate-700/60">{timeToReveal.d}d</span>
                        <span className="p-1.5 rounded bg-slate-800 border border-slate-700/60">{timeToReveal.h}h</span>
                        <span className="p-1.5 rounded bg-slate-800 border border-slate-700/60">{timeToReveal.m}m</span>
                        <span className="p-1.5 rounded bg-slate-800 border border-slate-700/60 text-slate-400">{timeToReveal.s}s</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 flex items-center justify-between">
                      <div>
                        <div className="text-[11px] font-mono text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Flame className="w-3.5 h-3.5" /> 3.30 Official League Launch
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">November 13, 2026</div>
                      </div>
                      <div className="flex items-center gap-2 font-orbitron text-lg font-bold text-amber-300">
                        <span className="p-1.5 rounded bg-slate-800 border border-slate-700/60">{timeToLaunch.d}d</span>
                        <span className="p-1.5 rounded bg-slate-800 border border-slate-700/60">{timeToLaunch.h}h</span>
                        <span className="p-1.5 rounded bg-slate-800 border border-slate-700/60">{timeToLaunch.m}m</span>
                        <span className="p-1.5 rounded bg-slate-800 border border-slate-700/60 text-amber-500">{timeToLaunch.s}s</span>
                      </div>
                    </div>
                  </div>

                  {/* Overview Quick Stats Strip */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
                      <div className="text-[11px] font-mono text-slate-400 uppercase">League Duration Funded</div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-xl font-orbitron font-bold text-white">{activeLeagueInfo.fundedDays} Days</span>
                        <span className="text-xs text-slate-500 font-mono">Target: {activeLeagueInfo.targetDays}d</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden mt-1">
                        <div
                          className="h-full bg-indigo-500"
                          style={{ width: `${(activeLeagueInfo.fundedDays / activeLeagueInfo.targetDays) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
                      <div className="text-[11px] font-mono text-slate-400 uppercase">Exiles Registered</div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-xl font-orbitron font-bold text-white">{roster.length} Exiles</span>
                        <span className="text-xs text-slate-500 font-mono">Limit: {activeLeagueInfo.currentSlots}</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden mt-1">
                        <div
                          className="h-full bg-indigo-500"
                          style={{ width: `${(roster.length / activeLeagueInfo.currentSlots) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
                      <div className="text-[11px] font-mono text-slate-400 uppercase">Crowdfund Points</div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-xl font-orbitron font-bold text-white">{COVEN_OF_UMBRA_INFO.crowdfundPointsCurrent} pts</span>
                        <span className="text-xs text-slate-500 font-mono">Goal: {COVEN_OF_UMBRA_INFO.crowdfundPointsGoal} pts</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden mt-1">
                        <div
                          className="h-full bg-emerald-500"
                          style={{ width: `${(COVEN_OF_UMBRA_INFO.crowdfundPointsCurrent / COVEN_OF_UMBRA_INFO.crowdfundPointsGoal) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
            </div>

            {/* 4 Step Onboarding Guide */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden shadow-lg">
              <div className="p-4 border-b border-slate-800 bg-slate-800/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                    How to Join & Participate (4 Step Onboarding Guide)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleSection('onboarding')}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  {collapsedSections['onboarding'] ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>
              </div>

              {!collapsedSections['onboarding'] && (
                <div className="p-5 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/60 space-y-1">
                      <div className="font-mono text-indigo-400 font-bold">01. Register Profile</div>
                      <p className="text-slate-400 text-[11px] leading-relaxed">
                        Set your preferred contact tag (Root handle, Discord, or In Game whisper) and PoE account name.
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/60 space-y-1">
                      <div className="font-mono text-indigo-400 font-bold">02. Accept Invite</div>
                      <p className="text-slate-400 text-[11px] leading-relaxed">
                        Once invited on pathofexile.com, click Accept so your character starts directly in the private league.
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/60 space-y-1">
                      <div className="font-mono text-indigo-400 font-bold">03. Post Wanted Items</div>
                      <p className="text-slate-400 text-[11px] leading-relaxed">
                        Add build enabling uniques and bases to your Looking For list so mapping squad mates stash them.
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/60 space-y-1">
                      <div className="font-mono text-indigo-400 font-bold">04. Join In Game Chat</div>
                      <p className="text-slate-400 text-[11px] leading-relaxed">
                        Type /global 5712 on launch day to coordinate mapping, lab carries, and crafts.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Ravenwatch & NOIR Guild Community Hub */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-lg">
              <div className="p-4 border-b border-slate-800/80 bg-slate-900/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                    Ravenwatch & NOIR Guild Community Hub
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                    Official Gather Place
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleSection('community')}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  {collapsedSections['community'] ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>
              </div>

              {!collapsedSections['community'] && (
                <div className="p-5 space-y-4">
                  <div className="p-4 rounded-xl border border-emerald-950/80 bg-emerald-950/20 text-xs text-slate-300 leading-relaxed space-y-2">
                    <p className="font-medium text-slate-200">
                      Ravenwatch is the chill community of ARPG and MMO gamers run by the NOIR guild, founded and created by Leuie in January 2018. The Ravenwatch server was established in February 2026 during the "Discord Exit".
                    </p>
                    <p className="text-slate-300">
                      It welcomes gamers from all over the world. We are more than just gamers, and our community is a place where we can show that. We are here to help you connect, laugh, and grow your circle in a positive, meaningful way. NOIR manages the guild community, and Ravenwatch serves as our dedicated ARPG and MMO gaming server.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <a
                      href="https://rootapp.gg/AC1NPUuJiQqlyDvGbgH-8A"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3.5 rounded-xl border border-emerald-800/60 bg-emerald-950/40 hover:bg-emerald-900/50 transition-all flex flex-col justify-between space-y-2 group"
                    >
                      <div>
                        <div className="text-[10px] font-mono text-emerald-400 uppercase font-bold">Official GSF Community</div>
                        <div className="font-bold text-sm text-white mt-0.5 flex items-center gap-1.5">
                          <span>Ravenwatch on Root</span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-1">
                          Primary gathering place for GSF coordination, trade requests, voice hangouts, and starter builds.
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-emerald-300 font-mono">
                        <span>Join Ravenwatch</span>
                        <ExternalLink className="w-3 h-3" />
                      </div>
                    </a>

                    <a
                      href="https://rootapp.gg/AC01VYpHiAq1rM0An8FDzw"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3.5 rounded-xl border border-slate-800 bg-slate-800/40 hover:bg-slate-800/80 transition-all flex flex-col justify-between space-y-2 group"
                    >
                      <div>
                        <div className="text-[10px] font-mono text-indigo-400 uppercase font-bold">Guild Headquarters</div>
                        <div className="font-bold text-sm text-white mt-0.5">
                          <span>NOIR Guild HQ</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          The home of NOIR Guild. Connect with guild runners, officers, and community veterans on Root.
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-indigo-300 font-mono">
                        <span>Open NOIR HQ</span>
                        <ExternalLink className="w-3 h-3" />
                      </div>
                    </a>

                    <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-800/40 flex flex-col justify-between space-y-2">
                      <div>
                        <div className="text-[10px] font-mono text-amber-400 uppercase font-bold">In Game Global Chat</div>
                        <div className="font-bold text-sm text-white mt-0.5 font-mono">
                          <span>/global 5712</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Click below to copy the chat channel command to paste directly in Path of Exile on launch.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => triggerCopy('/global 5712', 'In Game Channel')}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy Channel Command</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Essential Official Quick Links */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden space-y-0">
              <div className="p-4 border-b border-slate-800 bg-slate-800/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                    Official 3.30 Resources & Links
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono text-[10px]">
                    {quickLinks.length} Links
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openManagerModal('links')}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-indigo-300 text-[11px] font-mono flex items-center gap-1 cursor-pointer"
                  >
                    <span>Manage Links</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSection('links')}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    {collapsedSections['links'] ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {!collapsedSections['links'] && (
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {quickLinks.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-lg border border-slate-800 bg-slate-800/40 hover:bg-slate-800/80 hover:border-slate-700 transition-colors flex flex-col justify-between space-y-2 group"
                  >
                    <div>
                      <div className="text-[10px] font-mono text-slate-500 uppercase">{link.category}</div>
                      <div className="font-semibold text-xs text-slate-200 group-hover:text-white mt-0.5">
                        {link.label}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{link.description}</p>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-indigo-400 font-mono">
                      <span>Open Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </div>
                  </a>
                ))}
                </div>
              )}
            </div>

            {/* Past NOIR Leagues Archive */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden space-y-0">
              <div className="p-4 border-b border-slate-800 bg-slate-800/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                    NOIR Private League Archives
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono text-[10px]">
                    {archivesList.length} Previous Leagues
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openManagerModal('archives')}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-indigo-300 text-[11px] font-mono flex items-center gap-1 cursor-pointer"
                  >
                    <span>Manage Archives</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSection('archives')}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    {collapsedSections['archives'] ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {!collapsedSections['archives'] && (
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {archivesList.map((league) => (
                  <a
                    key={league.id}
                    href={league.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-lg border border-slate-800 bg-slate-800/40 hover:bg-slate-800/80 hover:border-slate-700 transition-colors flex flex-col justify-between space-y-2 group"
                  >
                    <div>
                      <div className="text-[10px] font-mono text-slate-500">{league.version}</div>
                      <div className="font-semibold text-xs text-slate-200 group-hover:text-white mt-0.5">
                        {league.name}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        {league.participants} Exiles • {league.duration}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                      <span>Archive</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </div>
                  </a>
                ))}
                </div>
              )}
            </div>

            {/* Collapsible FAQ */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden space-y-0">
              <div className="p-4 border-b border-slate-800 bg-slate-800/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                    F.A.Q. & League Guidelines
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono text-[10px]">
                    {faqList.length} Questions
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openManagerModal('faq')}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-indigo-300 text-[11px] font-mono flex items-center gap-1 cursor-pointer"
                  >
                    <span>Manage F.A.Q.</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSection('faq')}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    {collapsedSections['faq'] ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {!collapsedSections['faq'] && (
                <div className="p-5 space-y-2">
                  {faqList.map((faq, idx) => {
                  const isOpen = openFaqIndices.includes(idx);
                  return (
                    <div key={idx} className="rounded-lg border border-slate-800 bg-slate-800/30 overflow-hidden">
                      <button
                        onClick={() => toggleFaq(idx)}
                        className="w-full p-3 flex items-center justify-between text-left text-xs font-semibold text-slate-200 hover:text-white transition-colors cursor-pointer"
                      >
                        <span>{faq.q}</span>
                        {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                      </button>
                      {isOpen && (
                        <div className="px-3 pb-3 text-xs text-slate-400 leading-relaxed border-t border-slate-800/60 pt-2">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
                </div>
              )}
            </div>
          </div>
        )}



        {/* ============================================================================ */}
        {/* ITEM INSPECTION MODAL */}
        {/* ============================================================================ */}
        <dialog
          ref={itemInspectDialogRef}
          {...({ closedby: 'any' } as any)}
          aria-labelledby={inspectTitleId}
          className="w-[94vw] sm:w-full sm:max-w-xl rounded-2xl border border-slate-700 bg-slate-900 text-slate-200 p-0 shadow-2xl backdrop:bg-black/70 m-auto overflow-hidden"
        >
          {inspectedItemData && (
            <div className="flex flex-col max-h-[85vh]">
              <div className="p-4 border-b border-slate-800 bg-slate-800/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    {inspectedItemData.category} • Drop Matcher
                  </span>
                  <h2 id={inspectTitleId} className="text-base font-bold text-white mt-0.5">
                    {inspectedItemData.itemName}
                  </h2>
                  <div className="flex items-center gap-3 text-xs mt-1">
                    <a
                      href={inspectedItemData.poeWikiUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-white flex items-center gap-1 font-mono"
                    >
                      PoE Wiki <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                    <a
                      href={inspectedItemData.poeDbUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-white flex items-center gap-1 font-mono"
                    >
                      PoEDB <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => itemInspectDialogRef.current?.close()}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 overflow-y-auto space-y-3">
                <div className="text-[11px] font-mono text-slate-400 uppercase">
                  Exiles who requested this item ({inspectedItemData.entries.length}):
                </div>

                <div className="space-y-2">
                  {inspectedItemData.entries.map((req, rIdx) => {
                    const matchedMember = findMember(req.characterName, req.displayName);
                    const dispTag = req.displayName || matchedMember?.displayName || 'Exile';
                    const preferred = req.preferredContact || matchedMember?.preferredContact || 'app';
                    const whisperCommand = `@${req.characterName} Hey! I just found ${inspectedItemData.itemName} for your build in the NOIR Guild Stash!`;

                    return (
                      <div
                        key={rIdx}
                        className="p-3 rounded-lg border border-slate-800 bg-slate-950/70 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <strong className="text-slate-100 font-mono">@{dispTag}</strong>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                              Pref: {preferred === 'app' ? 'Root App' : preferred === 'poe_whisper' ? 'Whisper' : preferred}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">IGN: {req.characterName}</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleCycleStatus(req.id)}
                            className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                              req.status === 'NEED'
                                ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                                : req.status === 'HAVE'
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            Status: {req.status}
                          </button>
                        </div>

                        {req.notes && (
                          <p className="text-[11px] text-slate-400 bg-slate-900 p-2 rounded border border-slate-800/80">
                            Notes: {req.notes}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800/60">
                          {/* Root Whisper */}
                          <button
                            type="button"
                            onClick={() => triggerCopy(`@${dispTag} Hey! I found ${inspectedItemData.itemName} for your build in the NOIR Guild Stash!`, 'Root Whisper')}
                            className="px-2 py-1 rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800/80 text-emerald-300 text-[11px] font-mono flex items-center gap-1 cursor-pointer"
                            title="Whisper on Root Community"
                          >
                            <Users className="w-3 h-3 text-emerald-400" />
                            <span>Root Whisper</span>
                          </button>

                          {/* Discord Whisper */}
                          <button
                            type="button"
                            onClick={() => {
                              const dTag = req.discordName || matchedMember?.discordName || dispTag;
                              triggerCopy(`@${dTag} Hey! I found ${inspectedItemData.itemName} for your build in the NOIR Guild Stash!`, 'Discord Whisper');
                            }}
                            className="px-2 py-1 rounded bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-800/80 text-indigo-300 text-[11px] font-mono flex items-center gap-1 cursor-pointer"
                            title="Whisper on Discord"
                          >
                            <MessageSquare className="w-3 h-3 text-indigo-400" />
                            <span>Discord Whisper</span>
                          </button>

                          {/* In Game Whisper */}
                          <button
                            type="button"
                            onClick={() => triggerCopy(whisperCommand, 'PoE Whisper')}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono flex items-center gap-1 cursor-pointer"
                          >
                            <Copy className="w-3 h-3" />
                            <span>In Game Whisper</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCycleStatus(req.id)}
                            className="px-2 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-mono flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{req.status === 'HAVE' ? 'Revert to Need' : 'Mark Stashed'}</span>
                          </button>

                          {canEditOrDeleteWishlist(req) && (
                            <div className="flex items-center gap-1.5 ml-auto">
                              <button
                                type="button"
                                onClick={() => handleStartEditLookingForItem(req)}
                                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-[11px] font-mono flex items-center gap-1 cursor-pointer"
                                title="Edit request"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteLookingForItem(req.id)}
                                className="px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-mono flex items-center gap-1 cursor-pointer"
                                title="Delete request"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Delete</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </dialog>

        {/* ============================================================================ */}
        {/* EDIT WISHLIST / NEED REQUEST MODAL */}
        {/* ============================================================================ */}
        <dialog
          ref={editLookingForDialogRef}
          {...({ closedby: 'any' } as any)}
          className="w-[94vw] sm:w-full sm:max-w-lg rounded-2xl border border-slate-700 bg-slate-900 text-slate-200 p-0 shadow-2xl backdrop:bg-black/70 m-auto overflow-hidden"
        >
          {editingLookingForItem && (
            <form onSubmit={handleSaveEditLookingForItem} className="flex flex-col">
              <div className="p-4 border-b border-slate-800 bg-slate-800/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider">
                    Edit Wishlist Request
                  </span>
                  <h2 className="text-base font-bold text-white mt-0.5">
                    {editingLookingForItem.itemName}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    editLookingForDialogRef.current?.close();
                    setEditingLookingForItem(null);
                  }}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-3 overflow-y-auto max-h-[75vh]">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Item Name</label>
                  <input
                    type="text"
                    required
                    value={editItemName}
                    onChange={(e) => setEditItemName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-slate-700"
                    placeholder="Item Name (e.g. Cloak of Flame)"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Category</label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-slate-700 cursor-pointer"
                    >
                      <option value="Unique">Unique</option>
                      <option value="Vaal Gem">Vaal Gem</option>
                      <option value="Transfigured Gem">Transfigured Gem</option>
                      <option value="Gem">Skill, Support Gem</option>
                      <option value="Div Card">Div Card</option>
                      <option value="Base / Crafting">Base, Crafting</option>
                      <option value="Cluster Jewel">Cluster Jewel</option>
                      <option value="Oil / Enchant">Oil, Enchant</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-slate-700 cursor-pointer"
                    >
                      <option value="NEED">NEED (High Priority)</option>
                      <option value="SECOND CHAR">SECOND CHAR</option>
                      <option value="LOW PRIO">LOW PRIO</option>
                      <option value="HAVE">HAVE (Acquired)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Requester Tag</label>
                    <input
                      type="text"
                      value={editDisplay}
                      onChange={(e) => setEditDisplay(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-slate-700"
                      placeholder="App Tag (e.g. Leuie)"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Character IGN</label>
                    <input
                      type="text"
                      value={editChar}
                      onChange={(e) => setEditChar(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-slate-700"
                      placeholder="In Game Character IGN"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Notes</label>
                  <input
                    type="text"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-slate-700"
                    placeholder="Notes (rolls, socket colors, corruption goals, etc.)"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (editingLookingForItem) {
                      handleDeleteLookingForItem(editingLookingForItem.id);
                      editLookingForDialogRef.current?.close();
                      setEditingLookingForItem(null);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Request</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      editLookingForDialogRef.current?.close();
                      setEditingLookingForItem(null);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </dialog>

        {/* ============================================================================ */}
        {/* TAB 3: ROSTER DIRECTORY */}
        {/* ============================================================================ */}
        {activeTab === 'roster' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter by App Tag, character IGN, account, or planned build..."
                  value={rosterSearch}
                  onChange={(e) => setRosterSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-slate-700"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={rosterAscendancyFilter}
                  onChange={(e) => setRosterAscendancyFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-slate-700"
                >
                  <option value="All">All Ascendancies</option>
                  {currentAscendancyCatalog.map((a) => (
                    <option key={a.name} value={a.name}>
                      {a.name} ({a.baseClass})
                    </option>
                  ))}
                </select>

                <select
                  value={rosterLaunchFilter}
                  onChange={(e) => setRosterLaunchFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-slate-700"
                >
                  <option value="All">All Launch Times</option>
                  <option value="Yes">Launch Day 1</option>
                  <option value="Late Start">Late Start</option>
                </select>

                <button
                  type="button"
                  onClick={() => {
                    const allAccounts = roster.map((m) => m.poeAccountName).join(', ');
                    triggerCopy(allAccounts, 'All Account Names');
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 font-mono flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy All Tags</span>
                </button>
              </div>
            </div>

            {/* Roster Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredRoster.map((member) => {
                const isMe = Boolean(
                  userAccount && (
                    (member.id && userAccount.id === member.id) ||
                    userAccount.displayName.toLowerCase() === member.displayName.toLowerCase() ||
                    (userAccount.isAdmin && member.displayName.toLowerCase() === 'leuie')
                  )
                );

                return (
                  <div
                    key={member.id}
                    onClick={() => handleOpenPlayerModal(member)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 group ${
                      isMe
                        ? 'border-indigo-500/70 bg-gradient-to-b from-slate-900 to-indigo-950/30 shadow-lg shadow-indigo-950/40 hover:border-indigo-400'
                        : 'border-slate-800 bg-slate-900/70 hover:bg-slate-800/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-200 group-hover:text-white">
                          <span>@{member.displayName}</span>
                          {isMe && (
                            <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[9px] font-mono">
                              My Exile
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                          {member.availableAtLaunch === 'Yes' ? 'Launch Day 1' : 'Late Start'}
                        </span>
                      </div>

                      <div className="text-[11px] font-mono text-slate-400">
                        {member.ascendancy} • Lvl {member.level}
                      </div>

                      <div className="text-xs text-slate-300 truncate">
                        {member.buildName}
                      </div>

                      <div className="flex flex-wrap gap-1 pt-1">
                        {member.atlasContent.map((mech, mIdx) => (
                          <span
                            key={mIdx}
                            className="text-[10px] px-1.5 py-0.2 rounded bg-slate-950 text-slate-400 border border-slate-800"
                          >
                            {mech}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-mono">IGN: {member.characterName}</span>
                      <span className="text-slate-400 group-hover:text-indigo-300 transition-colors font-mono">
                        {isMe ? 'Edit Character →' : 'Profile →'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================================ */}
        {/* PLAYER PROFILE MODAL */}
        {/* ============================================================================ */}
        <dialog
          ref={playerProfileDialogRef}
          {...({ closedby: 'any' } as any)}
          aria-labelledby={playerProfileTitleId}
          className="w-[94vw] sm:w-full sm:max-w-xl rounded-2xl border border-slate-700 bg-slate-900 text-slate-200 p-0 shadow-2xl backdrop:bg-black/70 m-auto overflow-hidden"
        >
          {selectedPlayerModal && (
            <div className="flex flex-col max-h-[85vh]">
              <div className="p-4 border-b border-slate-800 bg-slate-800/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">
                    Exile Profile • Slot #{selectedPlayerModal.slotNumber}
                  </span>
                  <h2 id={playerProfileTitleId} className="text-base font-bold text-white mt-0.5">
                    @{selectedPlayerModal.displayName}
                  </h2>
                  <div className="text-xs text-slate-400 font-mono">
                    Account: {selectedPlayerModal.poeAccountName} • IGN: {selectedPlayerModal.characterName}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {userAccount && (
                    (userAccount.id && selectedPlayerModal.id === userAccount.id) ||
                    userAccount.displayName.toLowerCase() === selectedPlayerModal.displayName.toLowerCase() ||
                    (userAccount.isAdmin && selectedPlayerModal.displayName.toLowerCase() === 'leuie')
                  ) && (
                    <button
                      type="button"
                      onClick={() => setIsEditingProfileModal((prev) => !prev)}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{isEditingProfileModal ? 'Cancel Edit' : 'Edit My Character'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => playerProfileDialogRef.current?.close()}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {isEditingProfileModal ? (
                <form onSubmit={handleSaveModalCharacterDetails} className="p-4 space-y-3 overflow-y-auto max-h-[70vh] text-xs">
                  <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs flex items-center gap-2">
                    <Sparkles className="w-4 h-4 flex-shrink-0" />
                    <span>Direct Character Editor: Update your Path of Exile account tag, IGN, ascendancy, and build live.</span>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">
                      Path of Exile Account Tag (e.g. Account#1234) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Leuie#1234"
                      value={modalEditPoeAccount}
                      onChange={(e) => setModalEditPoeAccount(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">
                      Character Name (In Game IGN) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Leuie_Umbra"
                      value={modalEditCharName}
                      onChange={(e) => setModalEditCharName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-300 block mb-1">Ascendancy *</label>
                      <select
                        value={modalEditAsc}
                        onChange={(e) => setModalEditAsc(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      >
                        {currentAscendancyCatalog.map((asc) => (
                          <option key={asc.name} value={asc.name}>
                            {asc.name} ({asc.baseClass})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-300 block mb-1">Character Level</label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={modalEditLevel}
                        onChange={(e) => setModalEditLevel(Number(e.target.value) || 1)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">Planned Build Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Lightning Strike Slayer"
                      value={modalEditBuild}
                      onChange={(e) => setModalEditBuild(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">PoB URL (pobb.in)</label>
                    <input
                      type="url"
                      placeholder="https://pobb.in/..."
                      value={modalEditPob}
                      onChange={(e) => setModalEditPob(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">Status / Notes</label>
                    <textarea
                      rows={2}
                      placeholder="Profile notes or guild status..."
                      value={modalEditNotes}
                      onChange={(e) => setModalEditNotes(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow transition-all"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Character Changes</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsEditingProfileModal(false)}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (

              <div className="p-4 overflow-y-auto space-y-3 text-xs">
                {/* Build info */}
                <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/70 space-y-1.5">
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-slate-100 font-semibold">{selectedPlayerModal.ascendancy} ({selectedPlayerModal.className})</span>
                    <span className="text-slate-400">Lvl {selectedPlayerModal.level}</span>
                  </div>
                  <div className="text-slate-300">Build: {selectedPlayerModal.buildName}</div>
                  {selectedPlayerModal.pobUrl && (
                    <a
                      href={selectedPlayerModal.pobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-slate-400 hover:text-white font-mono text-[11px]"
                    >
                      <span>pobb.in</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                  {selectedPlayerModal.notes && (
                    <p className="text-slate-400 pt-1 text-[11px]">"{selectedPlayerModal.notes}"</p>
                  )}
                </div>

                {/* Items Wanted */}
                <div className="space-y-1.5">
                  <div className="font-mono text-slate-400 uppercase text-[11px]">
                    Wanted Items by {selectedPlayerModal.displayName}:
                  </div>
                  <div className="space-y-1">
                    {lookingForItems
                      .filter((it) => it.characterName.toLowerCase() === selectedPlayerModal.characterName.toLowerCase() || (it.displayName && it.displayName.toLowerCase() === selectedPlayerModal.displayName.toLowerCase()))
                      .map((item, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded border border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs"
                        >
                          <span className="text-slate-200">{item.itemName}</span>
                          <span className="font-mono text-[10px] text-slate-400">{item.status}</span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Contact & Whisper buttons */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="text-[10px] font-mono uppercase text-slate-400">
                    Contact & Whisper Actions:
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Root Whisper */}
                    <button
                      type="button"
                      onClick={() => {
                        const target = selectedPlayerModal.displayName || selectedPlayerModal.characterName;
                        triggerCopy(`@${target} Hey! Saw your wanted item on Exile SSF: `, 'Root Whisper');
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800/80 text-emerald-300 font-mono text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Copy message format for Root Community"
                    >
                      <Users className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copy Root Whisper</span>
                    </button>

                    {/* Discord Whisper */}
                    <button
                      type="button"
                      onClick={() => {
                        const target = selectedPlayerModal.discordName || selectedPlayerModal.displayName;
                        triggerCopy(`@${target} Hey! Saw your wanted item on Exile SSF: `, 'Discord Whisper');
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-800/80 text-indigo-300 font-mono text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Copy message format for Discord DM"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Copy Discord Whisper</span>
                    </button>

                    {/* In Game Whisper */}
                    <button
                      type="button"
                      onClick={() => triggerCopy(`@${selectedPlayerModal.characterName} `, 'In Game Whisper')}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy In Game Whisper</span>
                    </button>

                    {/* Account Tag */}
                    <button
                      type="button"
                      onClick={() => triggerCopy(selectedPlayerModal.poeAccountName, 'PoE Account Name')}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy Account Tag</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
            </div>
          )}
        </dialog>

        {/* ============================================================================ */}
        {/* UNIFIED RESOURCE: WISHLISTS & NEEDS (WITH DROP MATCHER) */}
        {/* ============================================================================ */}
        {activeTab === 'looking_for' && (
          <div className="space-y-4">
            {/* Unified Search, Filters & View Toggle Bar */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter wanted items, dropped loot, exiles, or notes..."
                  value={lookingForSearch}
                  onChange={(e) => setLookingForSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-slate-700"
                />
              </div>

              {/* Filters & View Switches */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Category Filter */}
                <select
                  value={lookingForCategoryFilter}
                  onChange={(e) => setLookingForCategoryFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-slate-700 cursor-pointer"
                >
                  <option value="All">All Categories</option>
                  <option value="Unique">Unique</option>
                  <option value="Vaal Gem">Vaal Gem</option>
                  <option value="Transfigured Gem">Transfigured Gem</option>
                  <option value="Gem">All Gems</option>
                  <option value="Div Card">Div Card</option>
                  <option value="Base / Crafting">Base, Crafting</option>
                  <option value="Cluster Jewel">Cluster Jewel</option>
                  <option value="Oil / Enchant">Oil, Enchant</option>
                </select>

                {/* Status Filter */}
                <select
                  value={lookingForStatusFilter}
                  onChange={(e) => setLookingForStatusFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-slate-700 cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  <option value="NEED">NEED</option>
                  <option value="SECOND CHAR">SECOND CHAR</option>
                  <option value="LOW PRIO">LOW PRIO</option>
                  <option value="HAVE">HAVE</option>
                </select>

                {/* 3-way View Switcher */}
                <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setLookingForViewMode('item')}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer font-medium ${
                      lookingForViewMode === 'item' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    By Item
                  </button>
                  <button
                    type="button"
                    onClick={() => setLookingForViewMode('player')}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer font-medium ${
                      lookingForViewMode === 'player' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    By Player
                  </button>
                  <button
                    type="button"
                    onClick={() => setLookingForViewMode('table')}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer font-medium ${
                      lookingForViewMode === 'table' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Table
                  </button>
                </div>

                {/* Copy Squad Wishlist Button */}
                <button
                  type="button"
                  onClick={() => {
                    const summaryLines = lookingForItems.map(
                      (it) => `@${it.displayName || it.characterName}: ${it.itemName} (${it.category}, ${it.status})`
                    );
                    triggerCopy(summaryLines.join('\n'), 'Squad Wishlist Summary');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold flex items-center gap-1 cursor-pointer transition-colors border border-slate-700"
                  title="Copy formatted wishlist summary for Discord or whispers"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Squad Wishlist</span>
                </button>

                {/* Add Wanted Item Button */}
                <button
                  type="button"
                  onClick={() => setShowAddLookingForModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs text-white font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Wanted Item</span>
                </button>
              </div>
            </div>

            {/* Add Wanted Item Form */}
            {showAddLookingForModal && (
              <form
                onSubmit={handleAddLookingForItem}
                className="p-4 rounded-xl border border-slate-700 bg-slate-900/95 space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-semibold text-xs text-white">Post Wanted Item to Squad Wishlist</span>
                  <button
                    type="button"
                    onClick={() => setShowAddLookingForModal(false)}
                    className="text-xs text-slate-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Your App Tag (e.g. ShadowHunter)"
                    value={newLfDisplay}
                    onChange={(e) => setNewLfDisplay(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                  />
                  <input
                    type="text"
                    required
                    placeholder="In Game IGN (e.g. Shadow_Umbra)"
                    value={newLfChar}
                    onChange={(e) => setNewLfChar(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Item Name (e.g. Cloak of Flame)"
                    value={newLfItem}
                    onChange={(e) => setNewLfItem(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={newLfCat}
                    onChange={(e) => setNewLfCat(e.target.value as any)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                  >
                    <option value="Unique">Unique Item</option>
                    <option value="Vaal Gem">Vaal Gem</option>
                    <option value="Transfigured Gem">Transfigured Gem</option>
                    <option value="Gem">Skill, Support Gem</option>
                    <option value="Div Card">Divination Card</option>
                    <option value="Base / Crafting">Base, Crafting</option>
                    <option value="Cluster Jewel">Cluster Jewel</option>
                    <option value="Oil / Enchant">Oil, Enchant</option>
                  </select>

                  <select
                    value={newLfStatus}
                    onChange={(e) => setNewLfStatus(e.target.value as any)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                  >
                    <option value="NEED">NEED (High Priority)</option>
                    <option value="SECOND CHAR">SECOND CHAR</option>
                    <option value="LOW PRIO">LOW PRIO</option>
                  </select>
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="Notes: e.g. Any roll or corruption acceptable"
                    value={newLfNotes}
                    onChange={(e) => setNewLfNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer shadow"
                  >
                    Save Request
                  </button>
                </div>
              </form>
            )}

            {/* View Mode 1: By Item (Drop Matcher) */}
            {lookingForViewMode === 'item' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {filteredAggregatedItems.map((itemGroup, idx) => {
                    const activeCount = itemGroup.activeNeeds;
                    const hasCriticalNeed = itemGroup.entries.some((e) => e.status === 'NEED');

                    return (
                      <div
                        key={idx}
                        onClick={() => handleOpenItemInspector(itemGroup.itemName)}
                        className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/70 hover:bg-slate-800/60 hover:border-slate-700 transition-all cursor-pointer flex flex-col justify-between space-y-2 group shadow-sm"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
                              {itemGroup.category}
                            </span>

                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                                hasCriticalNeed
                                  ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                                  : 'bg-slate-800 text-slate-300 border border-slate-700'
                              }`}
                            >
                              {activeCount} {activeCount === 1 ? 'Player Needs' : 'Players Need'}
                            </span>
                          </div>

                          <div className="font-semibold text-xs text-slate-200 group-hover:text-white">
                            {itemGroup.itemName}
                          </div>

                          {/* Requesting player tags */}
                          <div className="flex flex-wrap gap-1 pt-1">
                            {itemGroup.entries.slice(0, 3).map((entry, eIdx) => {
                              const tagLabel = entry.displayName ? `@${entry.displayName}` : (entry.discordName || entry.characterName);
                              return (
                                <span
                                  key={eIdx}
                                  className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800/90 text-slate-300 border border-slate-700/50"
                                >
                                  {tagLabel}
                                </span>
                              );
                            })}
                            {itemGroup.entries.length > 3 && (
                              <span className="text-[10px] font-mono text-slate-500 self-center">
                                +{itemGroup.entries.length - 3}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                          <span>Click to inspect</span>
                          <span className="text-slate-500 group-hover:text-slate-300 transition-colors">→</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {filteredAggregatedItems.length === 0 && (
                  <div className="p-8 text-center rounded-xl border border-dashed border-slate-800 bg-slate-900/30 text-xs text-slate-400">
                    No squad members currently have items requested matching this search or filter.
                  </div>
                )}
              </div>
            )}

            {/* View Mode 2: By Player */}
            {lookingForViewMode === 'player' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {Array.from(lookingForGrouped.entries()).map(([playerKey, items]) => (
                    <div
                      key={playerKey}
                      className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/70 space-y-2.5 shadow-sm"
                    >
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                        <div className="font-semibold text-xs text-slate-200 font-mono">@{playerKey}</div>
                        <span className="text-[10px] font-mono text-slate-500">{items.length} items</span>
                      </div>

                      <div className="space-y-1.5">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className="p-2 rounded-lg border border-slate-800/80 bg-slate-950/60 flex items-center justify-between gap-2 text-xs"
                          >
                            <div className="truncate">
                              <div className="text-slate-200 truncate font-medium">{item.itemName}</div>
                              <div className="text-[10px] text-slate-500 truncate">{item.notes}</div>
                            </div>

                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => handleCycleStatus(item.id)}
                                className={`text-[10px] font-mono px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                                  item.status === 'NEED'
                                    ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                                    : item.status === 'HAVE'
                                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                    : 'bg-slate-800 text-slate-400 border-slate-700'
                                }`}
                              >
                                {item.status}
                              </button>

                              {canEditOrDeleteWishlist(item) && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditLookingForItem(item)}
                                    className="p-1 rounded text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-colors cursor-pointer"
                                    title="Edit request"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteLookingForItem(item.id)}
                                    className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                                    title="Delete request"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {lookingForGrouped.size === 0 && (
                  <div className="p-8 text-center rounded-xl border border-dashed border-slate-800 bg-slate-900/30 text-xs text-slate-400">
                    No squad members currently have items matching this filter.
                  </div>
                )}
              </div>
            )}

            {/* View Mode 3: Table View */}
            {lookingForViewMode === 'table' && (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-500 font-mono text-[10px] uppercase border-b border-slate-800">
                      <tr>
                        <th className="p-2.5">Item Name</th>
                        <th className="p-2.5">Category</th>
                        <th className="p-2.5">Requester</th>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5">Notes</th>
                        <th className="p-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredLookingForItems.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-800/30">
                          <td className="p-2.5 font-medium text-slate-200">{item.itemName}</td>
                          <td className="p-2.5 text-slate-400 font-mono text-[11px]">{item.category}</td>
                          <td className="p-2.5 font-mono text-slate-300">@{item.displayName || item.characterName}</td>
                          <td className="p-2.5">
                            <button
                              type="button"
                              onClick={() => handleCycleStatus(item.id)}
                              className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 cursor-pointer"
                            >
                              {item.status}
                            </button>
                          </td>
                          <td className="p-2.5 text-slate-400">{item.notes}</td>
                          <td className="p-2.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => triggerCopy(`@${item.characterName} Hey, I found ${item.itemName} for you!`, 'PoE Whisper')}
                                className="text-[11px] font-mono text-indigo-400 hover:text-indigo-300 cursor-pointer"
                              >
                                Whisper
                              </button>
                              {canEditOrDeleteWishlist(item) && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditLookingForItem(item)}
                                    className="text-[11px] font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                                    title="Edit request"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteLookingForItem(item.id)}
                                    className="text-[11px] font-mono text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                                    title="Delete request"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>Delete</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredLookingForItems.length === 0 && (
                  <div className="p-8 text-center rounded-xl border border-dashed border-slate-800 bg-slate-900/30 text-xs text-slate-400">
                    No wanted items found matching your search.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ============================================================================ */}
        {/* TAB 5: VAULT (GUILD STASH) */}
        {/* ============================================================================ */}
        {activeTab === 'vault' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 flex items-center justify-between gap-3">
              <div className="text-xs text-slate-400">
                Log and browse items deposited in NOIR Guild Stash tabs.
              </div>
              <button
                type="button"
                onClick={() => setShowAddVaultModal(true)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-white font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Unique to Vault</span>
              </button>
            </div>

            {/* Add Vault Item Modal */}
            {showAddVaultModal && (
              <form
                onSubmit={handleAddVaultItem}
                className="p-4 rounded-xl border border-slate-700 bg-slate-900/95 space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-semibold text-xs text-white">Deposit to Guild Vault</span>
                  <button
                    type="button"
                    onClick={() => setShowAddVaultModal(false)}
                    className="text-xs text-slate-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Item Name (e.g. Inpulsa's Broken Heart)"
                    value={vItemName}
                    onChange={(e) => setVItemName(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                  />
                  <select
                    value={vLoc}
                    onChange={(e) => setVLoc(e.target.value as any)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                  >
                    <option value="Guild Tab 1 (Uniques)">Guild Tab 1 (Uniques)</option>
                    <option value="Guild Tab 2 (Bases & Gems)">Guild Tab 2 (Bases & Gems)</option>
                    <option value="Whisper Finder">Whisper Finder</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Sockets or rolls (e.g. 6 socket, clean)"
                    value={vSockets}
                    onChange={(e) => setVSockets(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="submit"
                    className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
                  >
                    Deposit
                  </button>
                </div>
              </form>
            )}

            {/* Vault Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {vaultItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/70 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                      {item.location}
                    </span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                      item.status === 'Available' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-slate-800 text-slate-500'
                    }`}>
                      {item.status}
                    </span>
                  </div>

                  <div className="font-semibold text-xs text-slate-200">{item.itemName}</div>
                  <div className="text-[11px] text-slate-400">{item.socketsOrRoll}</div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-mono">Found by {item.finderCharacter}</span>
                    <button
                      type="button"
                      onClick={() => handleClaimVaultItem(item.id)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px] cursor-pointer"
                    >
                      {item.status === 'Available' ? 'Claim' : 'Revert'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================================ */}
        {/* TAB 6: COMMUNITY GUIDES */}
        {/* ============================================================================ */}
        {activeTab === 'guides' && (
          <div className="space-y-4">
            
            {/* Controls Bar: Search, Sort Dropdown & Class Filter */}
            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-md space-y-3 shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-3">
                
                {/* Search Input */}
                <div className="relative flex-1 min-w-[240px] max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={guideSearch}
                    onChange={(e) => setGuideSearch(e.target.value)}
                    placeholder="Search guides by build, ascendancy, author..."
                    className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 font-mono transition-colors"
                  />
                  {guideSearch && (
                    <button
                      type="button"
                      onClick={() => setGuideSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Sort Controls */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
                    <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">Sort:</span>
                    <select
                      value={guideSort}
                      onChange={(e) => setGuideSort(e.target.value as any)}
                      className="bg-transparent text-slate-200 text-xs font-mono focus:outline-none cursor-pointer"
                    >
                      <option value="upvotes" className="bg-slate-900 text-slate-200">Most Upvoted</option>
                      <option value="rating" className="bg-slate-900 text-slate-200">Highest SSF Rating</option>
                      <option value="ascendancy" className="bg-slate-900 text-slate-200">Ascendancy (A to Z)</option>
                      <option value="title" className="bg-slate-900 text-slate-200">Guide Name (A to Z)</option>
                      <option value="newest" className="bg-slate-900 text-slate-200">Newest Added</option>
                    </select>
                  </div>

                  {(guideSearch || guideClassFilter !== 'all' || guidePlaystyleFilter !== 'all') && (
                    <button
                      type="button"
                      onClick={() => {
                        setGuideSearch('');
                        setGuideClassFilter('all');
                        setGuidePlaystyleFilter('all');
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors cursor-pointer"
                      title="Reset search and filters"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Pills Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-xs">
                
                {/* Class / Archetype Pills */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-mono text-slate-500 mr-1">Class:</span>
                  {['all', 'Duelist', 'Ranger', 'Witch', 'Templar'].map((cls) => (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => setGuideClassFilter(cls)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                        guideClassFilter === cls
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {cls === 'all' ? 'All Classes' : cls}
                    </button>
                  ))}
                </div>

                {/* Counter */}
                <div className="text-[11px] font-mono text-slate-400">
                  Showing {filteredAndSortedGuides.length} of {guides.length} guides
                </div>
              </div>
            </div>

            {/* Guides Grid */}
            {filteredAndSortedGuides.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border border-slate-800 bg-slate-900/40 space-y-3">
                <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
                <h4 className="text-base font-bold text-slate-300">No Guides Match Criteria</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  No community guides matched your current search query or class filter. Clear your filters to view all available builds.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setGuideSearch('');
                    setGuideClassFilter('all');
                    setGuidePlaystyleFilter('all');
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer transition-colors"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredAndSortedGuides.map((guide) => (
                  <div
                    key={guide.id}
                    className="p-4 rounded-xl border border-slate-800 bg-slate-900/70 space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div
                          onClick={() => setActiveReadingGuide(guide)}
                          className="cursor-pointer group flex-1 mr-2"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-mono uppercase text-slate-400">
                              {guide.ascendancy} • {guide.playstyle}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                              Rating: {guide.starterRating}/10
                            </span>
                          </div>
                          <div className="font-bold text-sm text-white group-hover:text-indigo-300 transition-colors mt-0.5 flex items-center gap-1.5">
                            <span>{guide.title}</span>
                            <BookOpen className="w-3.5 h-3.5 text-indigo-400 opacity-80 group-hover:opacity-100" />
                          </div>
                          <div className="text-[11px] text-slate-500">Shared by @{guide.authorName}</div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setGuides((prev) => prev.map((g) => (g.id === guide.id ? { ...g, upvotes: g.upvotes + 1 } : g)));
                            fireConfetti();
                          }}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1 cursor-pointer flex-shrink-0"
                          title="Upvote this community guide"
                        >
                          <ThumbsUp className="w-3 h-3 text-slate-400" />
                          <span>{guide.upvotes}</span>
                        </button>
                      </div>

                      <div className="space-y-1 text-xs text-slate-400">
                        <p><strong className="text-slate-300">Leveling: </strong>{guide.levelingNotes}</p>
                        <p><strong className="text-slate-300">Endgame: </strong>{guide.endgameNotes}</p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 mt-auto">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveReadingGuide(guide)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow cursor-pointer"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Read Full Guide</span>
                        </button>

                        <a
                          href={guide.pobCodeOrUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700"
                        >
                          <span>PoB</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const newItems: LookingForItem[] = guide.requiredUniques.map((u) => ({
                            id: `lf-auto-${Date.now()}-${Math.random()}`,
                            characterName: userAccount?.characterName || 'MyCharacter',
                            displayName: userAccount?.displayName || 'Leuie',
                            preferredContact: userAccount?.preferredContact || 'app',
                            itemName: u,
                            category: 'Unique',
                            status: 'NEED',
                            notes: `Required for ${guide.title}`,
                            poeWikiUrl: `https://www.poewiki.net/wiki/${encodeURIComponent(u.replace(/ /g, '_'))}`,
                            poeDbUrl: `https://poedb.tw/us/search?q=${encodeURIComponent(u)}`
                          }));
                          setLookingForItems((prev) => [...newItems, ...prev]);
                          fireConfetti();
                          setCopyNotice(`Added ${guide.requiredUniques.length} items to your Looking For list!`);
                          setTimeout(() => setCopyNotice(null), 2500);
                        }}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono cursor-pointer"
                      >
                        + Add to Looking For
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================================ */}
        {/* TAB 7: CHEAT SHEETS */}
        {/* ============================================================================ */}
        {activeTab === 'cheatsheets' && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/80 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {[
                  { id: 'syndicate', label: 'Betrayal (Jun)' },
                  { id: 'heist', label: 'Heist Rogues' },
                  { id: 'delve', label: 'Delve Fossils' },
                  { id: 'incursion', label: 'Incursion Rooms' },
                  { id: 'maps', label: 'Atlas Map Ratings' }
                ].map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => setCheatSubTab(sub.id as CheatSubTab)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                      cheatSubTab === sub.id ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="Search rewards or names..."
                value={cheatSearch}
                onChange={(e) => setCheatSearch(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none"
              />
            </div>

            {/* Syndicate */}
            {cheatSubTab === 'syndicate' && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-500 font-mono text-[10px] uppercase border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">Member</th>
                      <th className="p-2.5">Transportation</th>
                      <th className="p-2.5">Fortification</th>
                      <th className="p-2.5">Research</th>
                      <th className="p-2.5">Intervention</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {SYNDICATE_CHEAT_SHEET.filter((row) =>
                      !cheatSearch ||
                      row.member.toLowerCase().includes(cheatSearch.toLowerCase()) ||
                      row.research.toLowerCase().includes(cheatSearch.toLowerCase()) ||
                      row.intervention.toLowerCase().includes(cheatSearch.toLowerCase())
                    ).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="p-2.5 font-bold text-slate-200">{row.member}</td>
                        <td className="p-2.5 text-slate-400">{row.transportation}</td>
                        <td className="p-2.5 text-slate-400">{row.fortification}</td>
                        <td className="p-2.5 text-slate-200 font-medium">{row.research}</td>
                        <td className="p-2.5 text-amber-300 font-medium">{row.intervention}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Heist */}
            {cheatSubTab === 'heist' && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-500 font-mono text-[10px] uppercase border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">Rogue</th>
                      <th className="p-2.5">Primary Jobs</th>
                      <th className="p-2.5">Passive Perk</th>
                      <th className="p-2.5">Recommended Gear</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {HEIST_CHEAT_SHEET.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="p-2.5 font-bold text-slate-200">{row.rogue}</td>
                        <td className="p-2.5 font-mono text-slate-400">{row.jobs.map((j) => `${j.job} (Lvl ${j.maxLevel})`).join(', ')}</td>
                        <td className="p-2.5 text-slate-300">{row.passiveEffect}</td>
                        <td className="p-2.5 text-slate-400 font-mono text-[11px]">{row.bestGearNote}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Delve */}
            {cheatSubTab === 'delve' && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-500 font-mono text-[10px] uppercase border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">Fossil</th>
                      <th className="p-2.5">Biomes</th>
                      <th className="p-2.5">Crafting Effect</th>
                      <th className="p-2.5">Tier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {DELVE_FOSSIL_CHEAT_SHEET.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="p-2.5 font-bold text-slate-200">{row.fossil}</td>
                        <td className="p-2.5 text-slate-400">{row.biomes.join(', ')}</td>
                        <td className="p-2.5 text-slate-300">{row.effect}</td>
                        <td className="p-2.5 font-mono text-slate-400">Tier {row.tier}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Incursion */}
            {cheatSubTab === 'incursion' && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-500 font-mono text-[10px] uppercase border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">Room Tier 1</th>
                      <th className="p-2.5">Tier 2</th>
                      <th className="p-2.5">Tier 3 (Final)</th>
                      <th className="p-2.5">Effect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {INCURSION_CHEAT_SHEET.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="p-2.5 font-medium text-slate-400">{row.tier1}</td>
                        <td className="p-2.5 text-slate-400">{row.tier2}</td>
                        <td className="p-2.5 font-bold text-white">{row.tier3}</td>
                        <td className="p-2.5 text-slate-300">{row.effect}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Maps */}
            {cheatSubTab === 'maps' && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-500 font-mono text-[10px] uppercase border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">Map (Natural Tier)</th>
                      <th className="p-2.5">Layout</th>
                      <th className="p-2.5">Density</th>
                      <th className="p-2.5">Boss</th>
                      <th className="p-2.5">Notable Cards</th>
                      <th className="p-2.5">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {ATLAS_MAP_RATINGS.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="p-2.5 font-bold text-slate-200">{row.mapName} (T{row.naturalTier})</td>
                        <td className="p-2.5 font-mono text-slate-400">{row.layoutScore}/5</td>
                        <td className="p-2.5 font-mono text-slate-400">{row.mobDensityScore}/5</td>
                        <td className="p-2.5 font-mono text-slate-400">{row.bossScore}/5</td>
                        <td className="p-2.5 text-slate-300">{row.notableCards || 'Standard'}</td>
                        <td className="p-2.5 font-mono text-indigo-400">{row.totalScore.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ============================================================================ */}
        {/* TAB 8: BENCH & TIPS */}
        {/* ============================================================================ */}
        {activeTab === 'new_player' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-3">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                Essential Bench Recipe Locations
              </div>
              <div className="rounded-lg border border-slate-800 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-500 font-mono text-[10px] uppercase border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">Craft Recipe</th>
                      <th className="p-2.5">Location</th>
                      <th className="p-2.5">Tip</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {CRAFTING_BENCH_UNLOCKS.map((bench, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="p-2.5 font-medium text-slate-200">{bench.craft}</td>
                        <td className="p-2.5 font-mono text-slate-400">{bench.location}</td>
                        <td className="p-2.5 text-slate-400">{bench.tip}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-3">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                Stash Tab Sale Priority
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {STASH_TAB_BUYER_TIERS.map((tier, idx) => (
                  <div key={idx} className="p-3.5 rounded-lg border border-slate-800 bg-slate-950/60 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-slate-400 uppercase text-[10px]">Tier {idx + 1}</span>
                      <span className="font-mono text-slate-300">{tier.cost}</span>
                    </div>
                    <div className="font-semibold text-slate-200">{tier.tier}</div>
                    <ul className="space-y-1 text-slate-400 text-[11px]">
                      {tier.tabs.map((tab: string, tIdx: number) => (
                        <li key={tIdx} className="flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-slate-400" />
                          <span>{tab}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================================ */}
        {/* TAB 9: ALUMNI DIRECTORY & ADMIN OUTREACH HUB */}
        {/* ============================================================================ */}
        {activeTab === 'alumni' && (
          <div className="space-y-4">
            
            {/* Outreach Stat Banner */}
            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
                    Community Track Record & History
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-poppins font-bold text-white">
                  We have run previous leagues with over 100 participants across 5 past leagues.
                </h3>
                <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                  Every past exile is cataloged below with their preferred contact channel (Root Web App, in game whisper, or Discord). Admins can nudge past participants promptly to onboard them for 3.30 Coven of Umbra!
                </p>
              </div>

              {/* Admin Outreach Batch Controls */}
              <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const allTags = alumniList.map((a: LeagueParticipantAlumnus) => a.poeAccountName).join(', ');
                    triggerCopy(allTags, 'All Alumni Account Tags');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Copy comma separated account names ready to paste into PoE Private League invite page"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy All Account Tags</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const portalUrl = typeof window !== 'undefined' ? `${window.location.origin}/privateleaguehub` : 'https://exilessf.app/privateleaguehub';
                    const template = `Hey Exiles! Ravenwatch Coven of Umbra GSF | Winter 2026 league is officially live for registration! Visit our SSF Portal to claim your spot, post your starter build, and add your wanted items: ${portalUrl} Accept invite: ${activeLeagueInfo.officialLeagueUrl || 'https://www.pathofexile.com/private-leagues'}`;
                    triggerCopy(template, '3.30 Announcement Message');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copy 3.30 Announcement</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenResetModal}
                  className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Archive active players to Alumni and reset the league sheet to a clean slate"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Start Fresh Season</span>
                </button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search alumni by name, account tag, build, or past league..."
                  value={alumniSearch}
                  onChange={(e) => setAlumniSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-slate-700"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {[
                  { id: 'all', label: 'All Alumni (' + alumniList.length + ')' },
                  { id: 'not_nudged', label: 'Needs Nudge (' + alumniList.filter((a: LeagueParticipantAlumnus) => !a.nudgedForCurrentLeague).length + ')' },
                  { id: 'nudged', label: 'Nudged (' + alumniList.filter((a: LeagueParticipantAlumnus) => a.nudgedForCurrentLeague).length + ')' },
                  { id: 'veteran', label: 'Veterans 2+ Leagues (' + alumniList.filter((a: LeagueParticipantAlumnus) => a.totalLeaguesCount >= 2).length + ')' }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setAlumniFilter(f.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                      alumniFilter === f.id
                        ? 'bg-slate-800 text-white border border-slate-700'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Alumni Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {alumniList
                .filter((alumnus: LeagueParticipantAlumnus) => {
                  const s = alumniSearch.toLowerCase();
                  const matchSearch =
                    !alumniSearch ||
                    alumnus.displayName.toLowerCase().includes(s) ||
                    alumnus.poeAccountName.toLowerCase().includes(s) ||
                    (alumnus.discordName && alumnus.discordName.toLowerCase().includes(s)) ||
                    (alumnus.lastKnownBuild && alumnus.lastKnownBuild.toLowerCase().includes(s)) ||
                    alumnus.pastLeagues.some((l: string) => l.toLowerCase().includes(s));

                  const matchFilter =
                    alumniFilter === 'all' ||
                    (alumniFilter === 'not_nudged' && !alumnus.nudgedForCurrentLeague) ||
                    (alumniFilter === 'nudged' && alumnus.nudgedForCurrentLeague) ||
                    (alumniFilter === 'veteran' && alumnus.totalLeaguesCount >= 2);

                  return matchSearch && matchFilter;
                })
                .map((alumnus: LeagueParticipantAlumnus) => {
                  const portalUrl = typeof window !== 'undefined' ? `${window.location.origin}/privateleaguehub` : 'https://exilessf.app/privateleaguehub';
                  const whisperCommand = `@${alumnus.displayName} Hey exile! Ravenwatch Coven of Umbra GSF | Winter 2026 private league is launching soon. Register here: ${portalUrl}`;

                  return (
                    <div
                      key={alumnus.id}
                      className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/70 hover:bg-slate-800/60 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-xs text-slate-100 flex items-center gap-1.5">
                            <span>@{alumnus.displayName}</span>
                            {alumnus.totalLeaguesCount >= 3 && (
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                                Veteran ({alumnus.totalLeaguesCount} Leagues)
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleToggleNudge(alumnus.id)}
                            className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                              alumnus.nudgedForCurrentLeague
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                            }`}
                          >
                            {alumnus.nudgedForCurrentLeague ? 'Nudged' : 'Needs Nudge'}
                          </button>
                        </div>

                        <div className="text-[11px] font-mono text-slate-400 space-y-0.5">
                          <div>PoE: {alumnus.poeAccountName}</div>
                          {alumnus.discordName && <div>Discord: {alumnus.discordName}</div>}
                          <div className="text-slate-500 text-[10px]">
                            Preferred: {alumnus.preferredContact === 'app' ? 'Root App' : alumnus.preferredContact === 'poe_whisper' ? 'PoE Whisper' : alumnus.preferredContact}
                          </div>
                        </div>

                        {alumnus.lastKnownBuild && (
                          <div className="text-[11px] text-slate-300 bg-slate-950/70 p-2 rounded border border-slate-800">
                            <span className="text-[10px] font-mono text-slate-500 uppercase block">Last Build:</span>
                            {alumnus.lastKnownBuild}
                          </div>
                        )}

                        {/* Past Leagues Badges */}
                        <div className="flex flex-wrap gap-1 pt-1">
                          {alumnus.pastLeagues.slice(0, 2).map((lg: string, lIdx: number) => (
                            <span
                              key={lIdx}
                              className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-950 text-slate-400 border border-slate-800 truncate max-w-[170px]"
                            >
                              {lg}
                            </span>
                          ))}
                          {alumnus.pastLeagues.length > 2 && (
                            <span className="text-[10px] font-mono text-slate-500 self-center">
                              +{alumnus.pastLeagues.length - 2} more
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quick Outreach Buttons */}
                      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5 text-[11px]">
                        <button
                          type="button"
                          onClick={() => triggerCopy(whisperCommand, 'PoE In Game Whisper')}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px] flex items-center gap-1 cursor-pointer"
                          title="Copy /whisper command for Path of Exile"
                        >
                          <MessageSquare className="w-2.5 h-2.5 text-slate-400" />
                          <span>Whisper</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => triggerCopy('@' + alumnus.displayName, 'Root App User Tag')}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px] flex items-center gap-1 cursor-pointer"
                        >
                          <Globe className="w-2.5 h-2.5 text-indigo-400" />
                          <span>App Tag</span>
                        </button>

                        {alumnus.discordName && (
                          <button
                            type="button"
                            onClick={() => triggerCopy(alumnus.discordName!, 'Discord Handle')}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px] flex items-center gap-1 cursor-pointer"
                          >
                            <AtSign className="w-2.5 h-2.5 text-purple-400" />
                            <span>Discord</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleToggleNudge(alumnus.id)}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white ml-auto cursor-pointer"
                          title="Toggle Nudge Checkmark"
                        >
                          <CheckCircle2 className={`w-3.5 h-3.5 ${alumnus.nudgedForCurrentLeague ? 'text-emerald-400' : 'text-slate-500'}`} />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        
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
                  <div>• Guild Stash Vault reset to 0 items</div>
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
    </div>
  );
};
