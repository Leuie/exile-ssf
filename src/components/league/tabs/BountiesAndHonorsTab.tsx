import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Award,
  Coins,
  CheckCircle2,
  ExternalLink,
  Gift,
  Plus,
  Search,
  Sparkles,
  Trophy,
  ArrowUpRight,
  Copy,
  ShieldCheck,
  X,
  Lock,
  Flame,
  Star,
  Trash2,
  Swords
} from 'lucide-react';
import type {
  LookingForItem,
  LeagueRosterMember,
  LeagueParticipantAlumnus,
  CommunityGuide,
  UserAccount,
  WishlistItemCategory,
  AchievementCategory,
  PersistentAchievementProfile,
  SquadServiceListing,
  SquadServiceType,
  PlayerVouch,
  VouchCategory
} from '../../../types';
import { saveCloudWishlistItem, saveCloudAchievementProfile, saveCloudService, deleteCloudService, saveCloudVouch } from '../../../services/cloudSync';
import { WISHLIST_CATEGORY_GROUPS } from './WishlistsTab';
import { getMemberCharacters } from './RosterTab';
import {
  evaluateCloudAchievements,
  getPlayerCloudKey
} from '../../../utils/achievements';

export interface BountiesAndHonorsTabProps {
  activeSessionId: string;
  lookingForItems: LookingForItem[];
  setLookingForItems: React.Dispatch<React.SetStateAction<LookingForItem[]>>;
  roster: LeagueRosterMember[];
  alumniList: LeagueParticipantAlumnus[];
  guides: CommunityGuide[];
  cloudAchievements: Record<string, PersistentAchievementProfile>;
  setCloudAchievements: React.Dispatch<React.SetStateAction<Record<string, PersistentAchievementProfile>>>;
  services: SquadServiceListing[];
  setServices: React.Dispatch<React.SetStateAction<SquadServiceListing[]>>;
  vouches: PlayerVouch[];
  setVouches: React.Dispatch<React.SetStateAction<PlayerVouch[]>>;
  userAccount?: UserAccount | null;
  isCurrentUserAdmin: boolean;
  triggerCopy: (text: string, label: string) => void;
  setCopyNotice: (notice: string | null) => void;
  fireConfetti: () => void;
  onJumpToWishlist: (itemName: string) => void;
  onOpenProfile?: (handle: string) => void;
}

const BOUNTY_PRESETS = [
  '1 Divine',
  '5 Divines',
  '8 Divines',
  '50 Chaos',
  '150 Chaos',
  'Uber Boss Carry',
  'Craft Favor'
];

export const BountiesAndHonorsTab: React.FC<BountiesAndHonorsTabProps> = ({
  activeSessionId,
  lookingForItems,
  setLookingForItems,
  roster,
  alumniList,
  guides,
  cloudAchievements,
  setCloudAchievements,
  services,
  setServices,
  vouches,
  setVouches,
  userAccount,
  isCurrentUserAdmin,
  triggerCopy,
  setCopyNotice,
  fireConfetti,
  onJumpToWishlist,
  onOpenProfile
}) => {
  const [subView, setSubView] = useState<'bounties' | 'carries' | 'ledger' | 'achievements'>('bounties');
  const [showPostServiceForm, setShowPostServiceForm] = useState<boolean>(false);
  const [svcType, setSvcType] = useState<SquadServiceType>('Boss Carry');
  const [svcTitle, setSvcTitle] = useState<string>('');
  const [svcFee, setSvcFee] = useState<string>('Free for Squad');
  const [svcAtlasFocus, setSvcAtlasFocus] = useState<string>('');
  const [svcNotes, setSvcNotes] = useState<string>('');

  // Vouch Modal State
  const [vouchTarget, setVouchTarget] = useState<{ provider: string; category: VouchCategory; itemOrService: string } | null>(null);
  const [vouchComment, setVouchComment] = useState<string>('');
  const vouchDialogRef = useRef<HTMLDialogElement>(null);

  const vouchCountByProvider = useMemo(() => {
    const map = new Map<string, number>();
    for (const v of vouches) {
      const key = (v.providerKey || v.providerDisplayName).trim().toLowerCase();
      map.set(key, (map.get(key) || 0) + 1);
    }
    return map;
  }, [vouches]);

  const getVouchCount = (name?: string): number => {
    if (!name) return 0;
    return vouchCountByProvider.get(name.trim().toLowerCase()) || 0;
  };

  const handleOpenVouchModal = (provider: string, category: VouchCategory, itemOrService: string) => {
    setVouchTarget({ provider, category, itemOrService });
    setVouchComment('');
    setTimeout(() => vouchDialogRef.current?.showModal(), 10);
  };

  const handleSubmitVouch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vouchTarget) return;
    const newVouch: PlayerVouch = {
      id: `vouch-${Date.now()}`,
      leagueId: activeSessionId,
      providerDisplayName: vouchTarget.provider,
      providerKey: vouchTarget.provider.trim().toLowerCase(),
      voucherDisplayName: userAccount?.displayName || userAccount?.characterName || 'Squadmate',
      category: vouchTarget.category,
      itemOrServiceName: vouchTarget.itemOrService,
      comment: vouchComment.trim() || 'Fast, trustworthy squad help!',
      createdAtIso: new Date().toISOString()
    };
    setVouches((prev) => [newVouch, ...prev]);
    saveCloudVouch(activeSessionId, newVouch);
    vouchDialogRef.current?.close();
    setVouchTarget(null);
    fireConfetti();
    setCopyNotice(`Verified vouch recorded for @${newVouch.providerDisplayName}!`);
    setTimeout(() => setCopyNotice(null), 3000);
  };

  const handlePostService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!svcTitle.trim()) return;
    const newSvc: SquadServiceListing = {
      id: `svc-${Date.now()}`,
      leagueId: activeSessionId,
      providerDisplayName: userAccount?.displayName || userAccount?.characterName || 'Squad Exile',
      providerCharacterName: userAccount?.characterName || 'MyExile',
      providerPoeAccount: userAccount?.poeAccountName || '',
      serviceType: svcType,
      title: svcTitle.trim(),
      fee: svcFee.trim() || 'Free for Squad',
      atlasFocus: svcAtlasFocus.trim() || undefined,
      notes: svcNotes.trim() || undefined,
      isActive: true,
      createdAtIso: new Date().toISOString()
    };
    setServices((prev) => [newSvc, ...prev]);
    saveCloudService(activeSessionId, newSvc);
    setSvcTitle('');
    setSvcAtlasFocus('');
    setSvcNotes('');
    setShowPostServiceForm(false);
    fireConfetti();
    setCopyNotice(`Listed "${newSvc.title}" on the Squad Carry & Service Board!`);
    setTimeout(() => setCopyNotice(null), 3000);
  };

  const handleDeleteService = (svcId: string) => {
    setServices((prev) => prev.filter((s) => s.id !== svcId));
    deleteCloudService(activeSessionId, svcId);
    setCopyNotice('Removed service listing.');
    setTimeout(() => setCopyNotice(null), 2500);
  };
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showPostBountyForm, setShowPostBountyForm] = useState<boolean>(false);
  const [achievementCategoryFilter, setAchievementCategoryFilter] = useState<'All' | AchievementCategory>('All');

  // Post New Bounty Form State
  const [bountyItemName, setBountyItemName] = useState<string>('');
  const [bountyCat, setBountyCat] = useState<WishlistItemCategory>('Unique');
  const [bountyOfferText, setBountyOfferText] = useState<string>('');
  const [bountyNotes, setBountyNotes] = useState<string>('');
  const [claimingItem, setClaimingItem] = useState<LookingForItem | null>(null);
  const [claimFinderName, setClaimFinderName] = useState<string>('');
  const claimDialogRef = useRef<HTMLDialogElement>(null);
  const [bountyTargetChar, setBountyTargetChar] = useState<string>(userAccount?.characterName || '');

  const myBountyChars = useMemo(() => {
    if (!userAccount) return [];
    const entry = roster.find(
      (m) =>
        (userAccount.id && m.id === userAccount.id) ||
        (userAccount.displayName && m.displayName.toLowerCase() === userAccount.displayName.toLowerCase())
    );
    return entry ? getMemberCharacters(entry) : [];
  }, [roster, userAccount]);

  // Evaluate Cloud Persisted Achievements (Cloudflare KV)
  const achievementEval = useMemo(
    () =>
      evaluateCloudAchievements({
        activeSessionId,
        userAccount,
        cloudAchievements,
        lookingForItems,
        roster,
        alumniList,
        guides
      }),
    [activeSessionId, userAccount, cloudAchievements, lookingForItems, roster, alumniList, guides]
  );

  // Sync newly unlocked honors or updated lifetime counters to Cloudflare KV
  useEffect(() => {
    if (!achievementEval.hasCloudChanges || !achievementEval.playerKey) return;
    const key = achievementEval.playerKey;
    const nextProf = achievementEval.profile;
    setCloudAchievements((prev) => ({ ...prev, [key]: nextProf }));
    saveCloudAchievementProfile(key, nextProf);
  }, [achievementEval.hasCloudChanges, achievementEval.playerKey, achievementEval.profile, setCloudAchievements]);

  const equippedTitle = achievementEval.profile.equippedTitle;

  const handleEquipTitle = (title: string) => {
    const playerKey = getPlayerCloudKey(userAccount);
    if (!playerKey) {
      setCopyNotice('Sign in or link your account to equip a cloud saved Legacy Title.');
      setTimeout(() => setCopyNotice(null), 2500);
      return;
    }
    const nextTitle = equippedTitle === title ? undefined : title;
    const updatedProfile: PersistentAchievementProfile = {
      ...achievementEval.profile,
      equippedTitle: nextTitle
    };
    setCloudAchievements((prev) => ({ ...prev, [playerKey]: updatedProfile }));
    saveCloudAchievementProfile(playerKey, updatedProfile);
    setCopyNotice(nextTitle ? `Equipped Legacy Title: ${nextTitle} (Cloud Synced)` : 'Cleared equipped Legacy Title');
    setTimeout(() => setCopyNotice(null), 2500);
  };

  // Active Bounties (Open wishlist items with a bounty offer)
  const openBountyItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return lookingForItems.filter((it) => {
      if (it.status === 'HAVE') return false;
      if (!it.bountyOffer || !it.bountyOffer.trim()) return false;
      if (!q) return true;
      return (
        it.itemName.toLowerCase().includes(q) ||
        it.category.toLowerCase().includes(q) ||
        (it.displayName && it.displayName.toLowerCase().includes(q)) ||
        it.characterName.toLowerCase().includes(q) ||
        it.bountyOffer.toLowerCase().includes(q) ||
        (it.notes && it.notes.toLowerCase().includes(q))
      );
    });
  }, [lookingForItems, searchQuery]);

  // Fulfilled Wishes (HAVE items with coop attribution or bounty settlement)
  const fulfilledItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return lookingForItems
      .filter((it) => {
        if (it.status !== 'HAVE') return false;
        if (!q) return true;
        return (
          it.itemName.toLowerCase().includes(q) ||
          (it.displayName && it.displayName.toLowerCase().includes(q)) ||
          it.characterName.toLowerCase().includes(q) ||
          (it.fulfilledBy && it.fulfilledBy.toLowerCase().includes(q)) ||
          (it.bountyOffer && it.bountyOffer.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        // Put CLAIMED awaiting settlement at the very top
        if (a.bountyStatus === 'CLAIMED' && b.bountyStatus !== 'CLAIMED') return -1;
        if (b.bountyStatus === 'CLAIMED' && a.bountyStatus !== 'CLAIMED') return 1;
        return (b.fulfilledAtIso || '').localeCompare(a.fulfilledAtIso || '');
      });
  }, [lookingForItems, searchQuery]);

  // Fulfillment Heroes Leaderboard
  const heroLeaderboard = useMemo(() => {
    const map = new Map<
      string,
      {
        helper: string;
        wishesCount: number;
        bountiesClaimed: number;
        bountiesPaid: number;
        items: string[];
      }
    >();

    for (const it of lookingForItems) {
      if (it.status === 'HAVE' && it.fulfilledBy && it.fulfilledBy.toLowerCase() !== 'self found') {
        const key = it.fulfilledBy.trim();
        const existing = map.get(key) || {
          helper: key,
          wishesCount: 0,
          bountiesClaimed: 0,
          bountiesPaid: 0,
          items: []
        };
        existing.wishesCount += 1;
        if (it.bountyOffer && it.bountyOffer.trim()) {
          existing.bountiesClaimed += 1;
          if (it.bountyStatus === 'PAID') {
            existing.bountiesPaid += 1;
          }
        }
        existing.items.push(it.itemName);
        map.set(key, existing);
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      if (b.bountiesClaimed !== a.bountiesClaimed) return b.bountiesClaimed - a.bountiesClaimed;
      return b.wishesCount - a.wishesCount;
    });
  }, [lookingForItems]);

  const canConfirmSettlement = (item: LookingForItem): boolean => {
    if (isCurrentUserAdmin) return true;
    if (!userAccount) return false;
    const isOwnerByDisp =
      Boolean(userAccount.displayName) &&
      Boolean(item.displayName) &&
      item.displayName!.toLowerCase() === userAccount.displayName.toLowerCase();
    const isOwnerByChar =
      Boolean(userAccount.characterName) &&
      item.characterName.toLowerCase() === userAccount.characterName.toLowerCase();
    const isOwnerByAcc =
      Boolean(userAccount.poeAccountName) &&
      Boolean(item.poeAccountName) &&
      item.poeAccountName!.toLowerCase() === userAccount.poeAccountName.toLowerCase();
    return isOwnerByDisp || isOwnerByChar || isOwnerByAcc;
  };

  const handleClaimBounty = (item: LookingForItem) => {
    const defaultFinder =
      userAccount?.displayName || userAccount?.characterName || 'Squad Helper';
    setClaimingItem(item);
    setClaimFinderName(defaultFinder);
    setTimeout(() => claimDialogRef.current?.showModal(), 10);
  };

  const handleConfirmClaimBounty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimingItem || !claimFinderName.trim()) return;

    const updatedItem: LookingForItem = {
      ...claimingItem,
      status: 'HAVE',
      fulfilledBy: claimFinderName.trim(),
      fulfilledByAccount: userAccount?.poeAccountName || '',
      fulfilledAtIso: new Date().toISOString(),
      bountyStatus: claimingItem.bountyOffer && claimingItem.bountyOffer.trim() ? 'CLAIMED' : undefined
    };

    const nextList = lookingForItems.map((it) => (it.id === claimingItem.id ? updatedItem : it));
    setLookingForItems(nextList);
    saveCloudWishlistItem(activeSessionId, updatedItem);
    claimDialogRef.current?.close();
    setClaimingItem(null);
    fireConfetti();
    setCopyNotice(`Bounty claimed for ${updatedItem.itemName}! Coordinate delivery with @${updatedItem.displayName || updatedItem.characterName}.`);
    setTimeout(() => setCopyNotice(null), 3500);
  };

  const handleConfirmBountyPaid = (item: LookingForItem) => {
    const updatedItem: LookingForItem = {
      ...item,
      bountyStatus: 'PAID',
      bountyPaidAtIso: new Date().toISOString()
    };

    const nextList = lookingForItems.map((it) => (it.id === item.id ? updatedItem : it));
    setLookingForItems(nextList);
    saveCloudWishlistItem(activeSessionId, updatedItem);
    if (item.fulfilledBy && item.fulfilledBy.toLowerCase() !== 'self found') {
      const autoVouch: PlayerVouch = {
        id: `vouch-bounty-${Date.now()}`,
        leagueId: activeSessionId,
        providerDisplayName: item.fulfilledBy,
        providerKey: item.fulfilledBy.trim().toLowerCase(),
        voucherDisplayName: userAccount?.displayName || item.displayName || 'Squadmate',
        category: 'Wishlist Bounty',
        itemOrServiceName: item.itemName,
        comment: `Delivered ${item.itemName} (Bounty: ${item.bountyOffer || 'Coop Honor'})`,
        createdAtIso: new Date().toISOString()
      };
      setVouches((prev) => [autoVouch, ...prev]);
      saveCloudVouch(activeSessionId, autoVouch);
    }
    fireConfetti();
    setCopyNotice(`Confirmed receipt and settled ${item.bountyOffer} bounty for @${item.fulfilledBy}!`);
    setTimeout(() => setCopyNotice(null), 3500);
  };

  const handlePostNewBounty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bountyItemName.trim() || !bountyOfferText.trim()) return;

    const cleanName = bountyItemName.trim();
    const newItem: LookingForItem = {
      id: `lf-${Date.now()}`,
      characterName: bountyTargetChar.trim() || myBountyChars[0]?.characterName || userAccount?.characterName || 'MyExile',
      displayName: userAccount?.displayName || userAccount?.characterName || 'Squad Member',
      preferredContact: userAccount?.preferredContact || 'app',
      discordName: userAccount?.discordName || '',
      poeAccountName: userAccount?.poeAccountName || '',
      itemName: cleanName,
      category: bountyCat,
      status: 'NEED',
      notes: bountyNotes.trim() || 'Posted via Squad Bounty Board',
      poeWikiUrl: `https://www.poewiki.net/wiki/${encodeURIComponent(cleanName.replace(/ /g, '_'))}`,
      poeDbUrl: `https://poedb.tw/us/search?q=${encodeURIComponent(cleanName)}`,
      bountyOffer: bountyOfferText.trim(),
      bountyStatus: 'OPEN'
    };

    const nextList = [newItem, ...lookingForItems];
    setLookingForItems(nextList);
    saveCloudWishlistItem(activeSessionId, newItem);

    setBountyItemName('');
    setBountyOfferText('');
    setBountyNotes('');
    setShowPostBountyForm(false);
    fireConfetti();
    setCopyNotice(`Posted bounty "${newItem.bountyOffer}" for ${cleanName} to Wishlists and Bounty Board!`);
    setTimeout(() => setCopyNotice(null), 3500);
  };

  const settledBountiesCount = lookingForItems.filter((it) => it.bountyStatus === 'PAID').length;
  const awaitingSettlementCount = lookingForItems.filter((it) => it.bountyStatus === 'CLAIMED').length;

  const filteredAchievements = achievementEval.achievements.filter(
    (a) => achievementCategoryFilter === 'All' || a.definition.category === achievementCategoryFilter
  );

  const tierStyles: Record<string, string> = {
    Common: 'bg-slate-800 text-slate-300 border-slate-700',
    Rare: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
    Unique: 'bg-orange-500/15 text-orange-300 border-orange-500/40',
    Pinnacle: 'bg-purple-500/15 text-purple-300 border-purple-500/40'
  };

  return (
    <div className="space-y-5">
      {/* Top Hero Banner: Squad Bounties, Coop Rewards, and Persistent Legacy Honors */}
      <div className="p-5 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/30 via-slate-900/90 to-emerald-950/20 shadow-lg space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center flex-shrink-0">
              <Trophy className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Squad Bounty Board, Fulfillment Heroes, and Legacy Honors
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase font-bold">
                  Coop Rewards
                </span>
                {equippedTitle && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold">
                    Title: {equippedTitle}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                Attach Divines, Chaos, or boss carries to chase items so squadmates are rewarded for hunting drops. Claim bounties upon delivery, settle receipts with one click, and earn achievements that persist on your profile across future expansions and seasons.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                setSubView('bounties');
                setShowPostBountyForm((v) => !v);
              }}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Post Item Bounty</span>
            </button>
          </div>
        </div>

        {/* Summary Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-[10px] font-mono uppercase text-amber-400">Open Bounties</div>
            <div className="text-xl font-bold text-white mt-0.5">{openBountyItems.length}</div>
            <div className="text-[10px] text-slate-400">Active item hunts</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-[10px] font-mono uppercase text-emerald-400">Wishes Fulfilled</div>
            <div className="text-xl font-bold text-white mt-0.5">{fulfilledItems.length}</div>
            <div className="text-[10px] text-slate-400">
              {awaitingSettlementCount > 0 ? `${awaitingSettlementCount} awaiting receipt` : `${settledBountiesCount} bounties settled`}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-[10px] font-mono uppercase text-indigo-400">Fulfillment Heroes</div>
            <div className="text-xl font-bold text-white mt-0.5">{heroLeaderboard.length}</div>
            <div className="text-[10px] text-slate-400">Active squad providers</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-[10px] font-mono uppercase text-purple-400">Legacy Honor Score</div>
            <div className="text-xl font-bold text-white mt-0.5">
              {achievementEval.totalPoints} <span className="text-xs font-normal text-slate-500">/ {achievementEval.maxPoints}</span>
            </div>
            <div className="text-[10px] text-slate-400">
              {achievementEval.unlockedCount} of {achievementEval.achievements.length} Honors Unlocked
            </div>
          </div>
        </div>
      </div>

      {/* Sub Navigation Bar and Search */}
      <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSubView('bounties')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              subView === 'bounties'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-800/70 text-slate-300 hover:text-white'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Active Bounty Board ({openBountyItems.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubView('carries')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              subView === 'carries'
                ? 'bg-indigo-500 text-white shadow-sm'
                : 'bg-slate-800/70 text-slate-300 hover:text-white'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>Boss Carries & Vouches ({services.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubView('ledger')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              subView === 'ledger'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'bg-slate-800/70 text-slate-300 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Fulfilled Wishes & Heroes ({fulfilledItems.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubView('achievements')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              subView === 'achievements'
                ? 'bg-purple-500 text-white shadow-sm'
                : 'bg-slate-800/70 text-slate-300 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Achievements ({achievementEval.unlockedCount}/{achievementEval.achievements.length})</span>
          </button>
        </div>

        {subView !== 'achievements' && (
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter bounties, items, exiles..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>
        )}
      </div>

      {/* Collapsible Post New Bounty Form */}
      {showPostBountyForm && (
        <form
          onSubmit={handlePostNewBounty}
          className="p-4 rounded-2xl border border-amber-500/40 bg-amber-950/20 space-y-3 shadow-lg"
        >
          <div className="flex items-center justify-between pb-2 border-b border-amber-500/20">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
              <Coins className="w-4 h-4" />
              <span>Create Incentivized Item Bounty (Syncs Directly to Squad Wishlist)</span>
            </div>
            <button
              type="button"
              onClick={() => setShowPostBountyForm(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] font-mono text-slate-300 block mb-1">Wanted Item Name *</label>
              <input
                type="text"
                required
                value={bountyItemName}
                onChange={(e) => setBountyItemName(e.target.value)}
                placeholder="e.g. Aegis Aurora"
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-300 block mb-1">Category</label>
              <select
                value={bountyCat}
                onChange={(e) => setBountyCat(e.target.value as WishlistItemCategory)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                {WISHLIST_CATEGORY_GROUPS.map((grp) => (
                  <optgroup key={grp.group} label={grp.group} className="bg-slate-950 text-slate-400">
                    {grp.options.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-200">
                        {opt.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-mono text-amber-300 block mb-1">Bounty Reward Offer *</label>
              <input
                type="text"
                required
                value={bountyOfferText}
                onChange={(e) => setBountyOfferText(e.target.value)}
                placeholder="e.g. 8 Divines"
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-amber-500/40 text-xs text-amber-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            {myBountyChars.length > 0 && (
              <div>
                <label className="text-[11px] font-mono text-slate-300 block mb-1">For Character</label>
                <select
                  value={bountyTargetChar || myBountyChars[0].characterName}
                  onChange={(e) => setBountyTargetChar(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-indigo-500/40 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-400 cursor-pointer"
                >
                  {myBountyChars.map((ch) => (
                    <option key={ch.id} value={ch.characterName} className="bg-slate-900 text-slate-200">
                      {ch.characterName} ({ch.ascendancy})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-[11px] font-mono text-slate-300 block mb-1">Notes or Roll Requirements</label>
              <input
                type="text"
                value={bountyNotes}
                onChange={(e) => setBountyNotes(e.target.value)}
                placeholder="e.g. Any roll, paid upon delivery"
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Quick Bounty Reward Presets */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] font-mono text-slate-400 mr-1">Quick Presets:</span>
            {BOUNTY_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setBountyOfferText(preset)}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-amber-500/20 hover:text-amber-300 border border-slate-700 text-[10px] font-mono text-slate-300 transition-colors cursor-pointer"
              >
                {preset}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-500/20">
            <button
              type="button"
              onClick={() => setShowPostBountyForm(false)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer shadow"
            >
              Post Bounty to Wishlist
            </button>
          </div>
        </form>
      )}

      {/* SUB VIEW 1: ACTIVE BOUNTY BOARD */}
      {subView === 'bounties' && (
        <div className="space-y-4">
          {openBountyItems.length === 0 ? (
            <div className="p-10 text-center rounded-2xl border border-dashed border-amber-500/30 bg-slate-900/40 space-y-3">
              <Coins className="w-9 h-9 text-amber-400/60 mx-auto" />
              <div className="text-sm font-bold text-white">No Active Item Bounties Yet</div>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Looking for a chase unique like Aegis Aurora or Shaper Guardian fragments? Post a bounty reward (e.g. 8 Divines or a Boss Carry) to put it on every squadmate's radar!
              </p>
              <button
                type="button"
                onClick={() => setShowPostBountyForm(true)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Post the First Bounty</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {openBountyItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl border border-amber-500/40 bg-gradient-to-b from-amber-950/20 to-slate-900/80 shadow-md flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2.5">
                    {/* Gold Bounty Header Strip */}
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-amber-500/20">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-300 font-mono text-xs font-bold">
                        <Coins className="w-3.5 h-3.5 text-amber-400" />
                        <span>Bounty: {item.bountyOffer}</span>
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {item.category}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold text-white">{item.itemName}</h3>
                        <div className="flex items-center gap-1">
                          <a
                            href={item.poeWikiUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-slate-300 hover:text-amber-300"
                            title="PoE Wiki"
                          >
                            Wiki
                          </a>
                          <a
                            href={item.poeDbUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-slate-300 hover:text-amber-300"
                            title="PoEDB"
                          >
                            PoEDB
                          </a>
                        </div>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Requested by <button type="button" onClick={() => onOpenProfile?.(item.displayName || item.characterName)} className="text-slate-200 hover:text-indigo-300 hover:underline font-semibold cursor-pointer">@{item.displayName || item.characterName}</button>
                        {item.characterName && (
                          <span className="text-[11px] font-mono text-slate-500 ml-1">({item.characterName})</span>
                        )}
                      </div>
                    </div>

                    {item.notes && (
                      <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-300 leading-relaxed">
                        {item.notes}
                      </div>
                    )}
                  </div>

                  {/* Action Footer */}
                  <div className="pt-2.5 border-t border-slate-800/80 space-y-2">
                    <button
                      type="button"
                      onClick={() => handleClaimBounty(item)}
                      className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow"
                    >
                      <Gift className="w-3.5 h-3.5" />
                      <span>I Found This: Claim Bounty</span>
                    </button>

                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          triggerCopy(
                            `@${item.characterName} Hey! I found your ${item.itemName} for the ${item.bountyOffer} bounty!`,
                            'In Game Whisper'
                          )
                        }
                        className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Whisper</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onJumpToWishlist(item.itemName)}
                        className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 text-[11px] font-mono flex items-center justify-center gap-1 cursor-pointer"
                        title="Open this item directly on the Wishlists and Needs page"
                      >
                        <span>Wishlist</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB VIEW: SQUAD ATLAS, BOSS CARRIES & VOUCH BOARD */}
      {subView === 'carries' && (
        <div className="space-y-5">
          <div className="p-4 rounded-2xl border border-indigo-500/30 bg-indigo-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-indigo-300">
                <Swords className="w-4 h-4" />
                <span>Squad Atlas, Boss Carries & Reputation Vouches</span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Offer 4 Voidstone carries, Uber Boss kills, T17 completions, Betrayal crafts, or Lab runs to your squad. Every confirmed carry or settled bounty awards a verified Vouch stored in Cloudflare D1.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowPostServiceForm((v) => !v)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{showPostServiceForm ? 'Close Form' : 'List My Carry or Service'}</span>
            </button>
          </div>

          {showPostServiceForm && (
            <form
              onSubmit={handlePostService}
              className="p-4 rounded-2xl border border-indigo-500/40 bg-slate-900/90 space-y-3 shadow-lg"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-slate-300 block mb-1">Service Category</label>
                  <select
                    value={svcType}
                    onChange={(e) => setSvcType(e.target.value as SquadServiceType)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 cursor-pointer"
                  >
                    <option value="Boss Carry">Boss Carry (Uber / Pinnacle)</option>
                    <option value="4 Voidstones">4 Voidstone Completion</option>
                    <option value="T17 Completion">T17 Map Completion</option>
                    <option value="Crafting & Betrayal">Crafting Bench / Betrayal</option>
                    <option value="Lab Runner">Lab / Transfigured Gem Runner</option>
                    <option value="Atlas & Mapping">Atlas Niche & Group Mapping</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-mono text-slate-300 block mb-1">Service Title *</label>
                  <input
                    type="text"
                    required
                    value={svcTitle}
                    onChange={(e) => setSvcTitle(e.target.value)}
                    placeholder="e.g. Deathless Maven & Uber Elder Carries"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-amber-300 block mb-1">Fee or Terms</label>
                  <input
                    type="text"
                    value={svcFee}
                    onChange={(e) => setSvcFee(e.target.value)}
                    placeholder="Free for Squad / Tips Welcome"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-amber-200"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-slate-300 block mb-1">Atlas Focus (Optional)</label>
                  <input
                    type="text"
                    value={svcAtlasFocus}
                    onChange={(e) => setSvcAtlasFocus(e.target.value)}
                    placeholder="e.g. Destructive Play, Essences, Jun"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-mono text-slate-300 block mb-1">Notes & Availability</label>
                <input
                  type="text"
                  value={svcNotes}
                  onChange={(e) => setSvcNotes(e.target.value)}
                  placeholder="e.g. Your map/invitation, online evenings CST"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPostServiceForm(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer"
                >
                  Publish Service
                </button>
              </div>
            </form>
          )}

          {services.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 text-xs text-slate-400">
              No squad carry or Atlas services listed yet. Click "List My Carry or Service" above to offer help and start earning Vouches!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((svc) => {
                const repCount = getVouchCount(svc.providerDisplayName);
                const canDelete =
                  isCurrentUserAdmin ||
                  (userAccount?.displayName &&
                    userAccount.displayName.toLowerCase() === svc.providerDisplayName.toLowerCase());
                return (
                  <div
                    key={svc.id}
                    className="p-4 rounded-2xl border border-slate-800 bg-slate-900/80 flex flex-col justify-between space-y-3 shadow"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold uppercase">
                          {svc.serviceType}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
                          ★ {repCount} {repCount === 1 ? 'Vouch' : 'Vouches'}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white">{svc.title}</h3>
                      <div className="text-xs text-slate-400 font-mono">
                        Provider: <button type="button" onClick={() => onOpenProfile?.(svc.providerDisplayName)} className="text-slate-200 hover:text-indigo-300 hover:underline font-semibold cursor-pointer">@{svc.providerDisplayName}</button> ({svc.providerCharacterName})
                      </div>
                      <div className="text-[11px] font-mono text-emerald-300">Fee: {svc.fee}</div>
                      {svc.atlasFocus && (
                        <div className="text-[11px] text-slate-400">Atlas Focus: {svc.atlasFocus}</div>
                      )}
                      {svc.notes && (
                        <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-300">
                          {svc.notes}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          triggerCopy(
                            `@${svc.providerCharacterName} Hey! Saw your "${svc.title}" listing on Exile SSF, are you available?`,
                            'Service Whisper'
                          )
                        }
                        className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-mono cursor-pointer"
                      >
                        Whisper
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleOpenVouchModal(
                            svc.providerDisplayName,
                            svc.serviceType === 'Crafting & Betrayal' ? 'Crafting Service' : 'Boss Carry',
                            svc.title
                          )
                        }
                        className="flex-1 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Star className="w-3 h-3" />
                        <span>Vouch</span>
                      </button>
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => handleDeleteService(svc.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 cursor-pointer"
                          title="Delete service listing"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Recent Verified Vouches Feed */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-400" />
                <span>Verified Squad Vouch Ledger ({vouches.length})</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">Stored atomically in Cloudflare D1</span>
            </div>
            {vouches.length === 0 ? (
              <div className="text-xs text-slate-500 italic">No vouches logged yet. Complete a carry or settle a bounty to build reputation!</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {vouches.slice(0, 12).map((v) => (
                  <div key={v.id} className="p-3 rounded-xl border border-slate-800 bg-slate-950/60 text-xs space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <button type="button" onClick={() => onOpenProfile?.(v.providerDisplayName)} className="font-bold text-emerald-300 hover:text-indigo-300 hover:underline cursor-pointer">@{v.providerDisplayName}</button>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {v.category}
                      </span>
                    </div>
                    <div className="text-slate-200">"{v.comment}"</div>
                    <div className="text-[10px] font-mono text-slate-500 flex items-center justify-between">
                      <span>Vouched by @{v.voucherDisplayName} ({v.itemOrServiceName})</span>
                      <span>{new Date(v.createdAtIso).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB VIEW 2: FULFILLED WISHES LEDGER & HEROES LEADERBOARD */}
      {subView === 'ledger' && (
        <div className="space-y-5">
          {/* Heroes Podium */}
          <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/15 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-emerald-300">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Squad Fulfillment Heroes Leaderboard</span>
              </div>
              <span className="text-[11px] text-slate-400">Ranked by Bounties Claimed and Total Wishes Fulfilled</span>
            </div>

            {heroLeaderboard.length === 0 ? (
              <div className="p-6 text-center rounded-xl border border-dashed border-slate-800 bg-slate-950/40 text-xs text-slate-400">
                No squad fulfillments logged yet. Fulfill a squadmate's wanted item to claim the #1 benefactor spot!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {heroLeaderboard.map((hero, idx) => (
                  <div
                    key={hero.helper}
                    className={`p-3.5 rounded-xl border space-y-2 ${
                      idx === 0
                        ? 'border-amber-500/50 bg-amber-950/20'
                        : 'border-slate-800 bg-slate-900/70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-mono font-bold text-sm ${idx === 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                        #{idx + 1}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                        {hero.wishesCount} {hero.wishesCount === 1 ? 'Wish' : 'Wishes'}
                      </span>
                    </div>
                    <button type="button" onClick={() => onOpenProfile?.(hero.helper)} className="font-bold text-sm text-white hover:text-indigo-300 hover:underline truncate cursor-pointer text-left">@{hero.helper}</button>
                    <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                      <span className="text-amber-300">{hero.bountiesClaimed} Bounties</span>
                      <span>•</span>
                      <span className="text-emerald-400">{hero.bountiesPaid} Settled</span>
                      <span>•</span>
                      <span className="text-purple-300">★ {getVouchCount(hero.helper)} Vouches</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fulfilled Wishes & Receipt Confirmation Ledger */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden shadow-md">
            <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Fulfilled Wishes & Bounty Settlement Log</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">Click any item to loop back to Wishlists</span>
            </div>

            {fulfilledItems.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No fulfilled wishes match your current search.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 text-[10px] font-mono uppercase text-slate-500 border-b border-slate-800">
                    <tr>
                      <th className="p-3">Item</th>
                      <th className="p-3">Requested By</th>
                      <th className="p-3">Provided By</th>
                      <th className="p-3">Bounty Reward</th>
                      <th className="p-3">Settlement Status</th>
                      <th className="p-3 text-right">Actions & Loopback</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {fulfilledItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-3 font-semibold text-white">
                          <div className="flex items-center gap-1.5">
                            <span>{item.itemName}</span>
                            <a
                              href={item.poeWikiUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-500 hover:text-amber-400"
                              title="Open PoE Wiki"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                          <div className="text-[10px] font-mono text-slate-500">{item.category}</div>
                        </td>
                        <td className="p-3">
                          <button type="button" onClick={() => onOpenProfile?.(item.displayName || item.characterName)} className="font-medium text-slate-200 hover:text-indigo-300 hover:underline cursor-pointer">@{item.displayName || item.characterName}</button>
                        </td>
                        <td className="p-3">
                          {item.fulfilledBy && item.fulfilledBy.toLowerCase() !== 'self found' ? (
                            <button type="button" onClick={() => onOpenProfile?.(item.fulfilledBy!)} className="font-mono text-emerald-300 hover:text-indigo-300 hover:underline font-semibold cursor-pointer">@{item.fulfilledBy}</button>
                          ) : (
                            <span className="font-mono text-slate-400">Self Found</span>
                          )}
                        </td>
                        <td className="p-3">
                          {item.bountyOffer ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono text-[11px] font-bold">
                              <Coins className="w-3 h-3" />
                              <span>{item.bountyOffer}</span>
                            </span>
                          ) : (
                            <span className="text-slate-500 italic">Coop Honor</span>
                          )}
                        </td>
                        <td className="p-3">
                          {item.bountyStatus === 'PAID' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono text-[10px] font-bold">
                              <ShieldCheck className="w-3 h-3" />
                              <span>PAID & SETTLED</span>
                            </span>
                          ) : item.bountyStatus === 'CLAIMED' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono text-[10px] font-bold">
                              <Flame className="w-3 h-3" />
                              <span>CLAIMED (CONFIRM RECEIPT)</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[10px]">
                              ACQUIRED
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {item.bountyStatus === 'CLAIMED' && canConfirmSettlement(item) && (
                              <button
                                type="button"
                                onClick={() => handleConfirmBountyPaid(item)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold cursor-pointer shadow"
                                title="Confirm item delivery and mark bounty as paid"
                              >
                                Confirm Receipt & Pay
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onJumpToWishlist(item.itemName)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 text-[10px] font-mono inline-flex items-center gap-1 cursor-pointer"
                              title="Jump directly to this item on the Wishlists page"
                            >
                              <span>View on Wishlist</span>
                              <ArrowUpRight className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB VIEW 3: PERSISTENT ACHIEVEMENTS & LEGACY HONORS */}
      {subView === 'achievements' && (
        <div className="space-y-4">
          {/* Legacy Persistence Overview Banner */}
          <div className="p-4 rounded-2xl border border-purple-500/30 bg-purple-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-purple-300">
                <Sparkles className="w-4 h-4" />
                <span>Achievements (Carries Over Across Seasons)</span>
              </div>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Honors unlocked in Exile SSF private leagues persist on your profile across future expansions. Unlock rare and pinnacle titles by fulfilling squad wishes, hunting bounties, and returning for new future seasons.
              </p>
            </div>

            {/* Equipped Title Selector */}
            <div className="flex flex-col sm:items-end gap-1.5 flex-shrink-0">
              <span className="text-[10px] font-mono uppercase text-slate-400">
                Unlocked Titles ({achievementEval.availableTitles.length})
              </span>
              {achievementEval.availableTitles.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {achievementEval.availableTitles.map((title) => (
                    <button
                      key={title}
                      type="button"
                      onClick={() => handleEquipTitle(title)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-colors cursor-pointer ${
                        equippedTitle === title
                          ? 'bg-purple-600 text-white border-purple-400 font-bold shadow'
                          : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-purple-500/50'
                      }`}
                    >
                      {equippedTitle === title ? `★ ${title}` : title}
                    </button>
                  ))}
                </div>
              ) : (
                <span className="text-[11px] text-slate-500 italic">
                  Unlock an achievement with a Reward Title to equip it
                </span>
              )}
            </div>
          </div>

          {/* Achievement Category Filters */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(['All', 'Bounties & Coop', 'League Loyalty', 'Wishlist & Economy', 'Community & Guides'] as const).map(
              (cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setAchievementCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                    achievementCategoryFilter === cat
                      ? 'bg-slate-800 text-white border border-slate-600'
                      : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              )
            )}
          </div>

          {/* Achievements Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAchievements.map((entry) => {
              const { definition, current, target, percent, unlocked, unlockedAtIso } = entry;
              return (
                <div
                  key={definition.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                    unlocked
                      ? 'border-emerald-500/40 bg-emerald-950/15 shadow-md'
                      : 'border-slate-800 bg-slate-900/50 opacity-85'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center border flex-shrink-0 ${
                            unlocked
                              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                              : 'bg-slate-800/80 border-slate-700 text-slate-500'
                          }`}
                        >
                          {unlocked ? <Trophy className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">{definition.title}</div>
                          <div className="text-[10px] font-mono text-slate-400">{definition.category}</div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase font-bold ${tierStyles[definition.tier]}`}>
                          {definition.tier}
                        </span>
                        <span className="text-[10px] font-mono text-amber-300 font-bold">
                          +{definition.points} pts
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-300 leading-relaxed">{definition.description}</p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-800/70">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className={unlocked ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                        {unlocked ? 'UNLOCKED' : `Progress: ${current} / ${target}`}
                      </span>
                      <span className="text-slate-500">{percent}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full transition-all ${unlocked ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] pt-0.5">
                      {definition.rewardTitle ? (
                        <span className="font-mono text-purple-300">
                          Reward Title: {definition.rewardTitle}
                        </span>
                      ) : (
                        <span className="text-slate-500">Legacy Honor Points</span>
                      )}
                      {unlocked && unlockedAtIso && (
                        <span className="text-slate-500 font-mono">
                          {new Date(unlockedAtIso).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* Native Dark Vouch Modal */}
      <dialog
        ref={vouchDialogRef}
        {...({ closedby: 'any' } as any)}
        className="w-[94vw] sm:w-full sm:max-w-md rounded-2xl border border-amber-500/40 bg-slate-900 text-slate-200 p-0 shadow-2xl backdrop:bg-black/75 m-auto overflow-hidden"
      >
        {vouchTarget && (
          <form onSubmit={handleSubmitVouch} className="flex flex-col">
            <div className="p-4 border-b border-slate-800 bg-amber-950/30 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-amber-300">
                <Star className="w-4 h-4 text-amber-400" />
                <span>Leave Verified Vouch for @{vouchTarget.provider}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  vouchDialogRef.current?.close();
                  setVouchTarget(null);
                }}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3 text-xs">
              <div className="text-slate-400">
                Service: <strong className="text-white">{vouchTarget.itemOrService}</strong> ({vouchTarget.category})
              </div>
              <div>
                <label className="text-[11px] font-mono text-slate-300 block mb-1">Vouch Note *</label>
                <input
                  type="text"
                  required
                  value={vouchComment}
                  onChange={(e) => setVouchComment(e.target.value)}
                  placeholder="e.g. Fast deathless Maven carry, super helpful!"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  vouchDialogRef.current?.close();
                  setVouchTarget(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
              >
                Submit Verified Vouch
              </button>
            </div>
          </form>
        )}
      </dialog>

      {/* Native Dark Claim Bounty Dialog */}
      <dialog
        ref={claimDialogRef}
        {...({ closedby: 'any' } as any)}
        className="w-[94vw] sm:w-full sm:max-w-md rounded-2xl border border-emerald-500/40 bg-slate-900 text-slate-200 p-0 shadow-2xl backdrop:bg-black/75 m-auto overflow-hidden"
      >
        {claimingItem && (
          <form onSubmit={handleConfirmClaimBounty} className="flex flex-col">
            <div className="p-4 border-b border-slate-800 bg-emerald-950/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-300">
                  Claim Item Bounty
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  claimDialogRef.current?.close();
                  setClaimingItem(null);
                }}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <div className="font-bold text-white text-sm">{claimingItem.itemName}</div>
                <div className="text-slate-400">
                  Requested by <span className="text-slate-200 font-semibold">@{claimingItem.displayName || claimingItem.characterName}</span>
                </div>
                {claimingItem.bountyOffer && (
                  <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono font-bold text-[11px]">
                    <Coins className="w-3 h-3" />
                    <span>Reward: {claimingItem.bountyOffer}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-300 block mb-1">
                  Your Display Tag or Character IGN (for Bounty Credit) *
                </label>
                <input
                  type="text"
                  required
                  value={claimFinderName}
                  onChange={(e) => setClaimFinderName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  claimDialogRef.current?.close();
                  setClaimingItem(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow"
              >
                Confirm & Claim Bounty
              </button>
            </div>
          </form>
        )}
      </dialog>
    </div>
  );
};
