import React, { useState, useId, useRef, useEffect } from 'react';
import {
  Search,
  ExternalLink,
  CheckCircle2,
  Copy,
  Plus,
  MessageSquare,
  Sparkles,
  RotateCcw,
  Edit3,
  Save,
  Trash2,
  Gift,
  Award,
  Coins,
  Users,
  Filter,
  X
} from 'lucide-react';
import type { LookingForItem, ItemNeedStatus, UserAccount, LeagueRosterMember, WishlistItemCategory, FreeStashDrop, LeagueFeedEvent } from '../../../types';
import { saveCloudWishlistItem, deleteCloudWishlistItem, saveCloudAchievementProfile } from '../../../services/cloudSync';
import { HONOR_PER_ITEM_FOUND, HONOR_PER_RECEIPT_CONFIRMED, HONOR_PER_SELF_FOUND, formatLeagueLabel } from '../../../utils/achievements';
import { parsePoeClipboardTooltip } from '../../../utils/poeItemParser';
import { FreeStashFeed } from '../widgets/FreeStashFeed';
import { PobWishlistImportModal } from '../modals/PobWishlistImportModal';
import { getMemberCharacters } from './RosterTab';
import { LootFilterExportModal } from '../modals/LootFilterExportModal';

export const WISHLIST_CATEGORY_GROUPS: {
  group: string;
  options: { value: WishlistItemCategory; label: string; filterLabel?: string }[];
}[] = [
  {
    group: 'Gear and Equipment',
    options: [
      { value: 'Unique', label: 'Unique Item' },
      { value: 'Base / Crafting', label: 'Crafting Base (Fractured, Influenced, Synth)' },
      { value: 'Flask / Tincture', label: 'Flask, Tincture, Charm' },
      { value: 'Jewel', label: 'Jewel (Base, Abyss, Timeless, Forbidden)' },
      { value: 'Cluster Jewel', label: 'Cluster Jewel' }
    ]
  },
  {
    group: 'Skill and Support Gems',
    options: [
      { value: 'Gem', label: 'Skill, Support Gem', filterLabel: 'All Gems' },
      { value: 'Vaal Gem', label: 'Vaal Skill Gem' },
      { value: 'Transfigured Gem', label: 'Transfigured Gem' },
      { value: 'Awakened Gem', label: 'Awakened Support Gem' }
    ]
  },
  {
    group: 'Maps, Fragments, and Bosses',
    options: [
      { value: 'Fragment / Boss', label: 'Boss Fragment (Shaper, Elder, Maven, Uber)' },
      { value: 'Map', label: 'Map (Guardian, T17, Unique, Blighted)' },
      { value: 'Scarab', label: 'Scarab' },
      { value: 'Memory / Invitation', label: 'Invitation, Atlas Memory, Reliquary Key' }
    ]
  },
  {
    group: 'Currency and Crafting Materials',
    options: [
      { value: 'Currency', label: 'Currency (Orbs, Eldritch, Chisels)' },
      { value: 'Essence', label: 'Essence' },
      { value: 'Fossil / Resonator', label: 'Delve Fossil, Resonator' },
      { value: 'Catalyst', label: 'Catalyst' },
      { value: 'Oil / Enchant', label: 'Blight Oil, Enchant, Tempering Orb' },
      { value: 'Delirium Orb', label: 'Delirium Orb, Simulacrum Splinter' },
      { value: 'Harvest / Beast', label: 'Harvest Lifeforce, Itemised Beast' }
    ]
  },
  {
    group: 'League Mechanics and Specialty',
    options: [
      { value: 'Thread of Creation', label: 'Thread of Creation (3.30 Umbra)' },
      { value: 'Div Card', label: 'Divination Card' },
      { value: 'Heist', label: 'Heist (Contract, Blueprint, Rogue Gear)' },
      { value: 'Expedition', label: 'Expedition (Logbook, Artifact, Reroll)' },
      { value: 'Tattoo / Omen', label: 'Tattoo, Omen, Rune, Soul Core' },
      { value: 'Sanctum / Ultimatum', label: 'Sanctum Tome, Relic, Ultimatum' },
      { value: 'Corpse / Allflame', label: 'Allflame Ember, Coffin, Graft' },
      { value: 'Other', label: 'Other, Miscellaneous' }
    ]
  }
];

export interface WishlistsTabProps {
  activeSessionId: string;
  lookingForItems: LookingForItem[];
  roster?: LeagueRosterMember[];
  setLookingForItems: React.Dispatch<React.SetStateAction<LookingForItem[]>>;
  userAccount?: UserAccount | null;
  isCurrentUserAdmin: boolean;
  triggerCopy: (text: string, label: string) => void;
  setCopyNotice: (notice: string | null) => void;
  fireConfetti: () => void;
  findMember: (charName: string, dispName?: string) => LeagueRosterMember | undefined;
  onOpenBountiesPage?: () => void;
  initialSearchQuery?: string | null;
  onClearInitialSearch?: () => void;
  onOpenProfile?: (handle: string) => void;
  onEmitFeedEvent?: (event: Omit<LeagueFeedEvent, 'id' | 'leagueId' | 'createdAtIso'>) => void;
  stashDrops?: FreeStashDrop[];
  onAddStashDrop?: (drop: FreeStashDrop) => void;
  onClaimStashDrop?: (drop: FreeStashDrop) => void;
  onDeleteStashDrop?: (dropId: string) => void;
}

export const WishlistsTab: React.FC<WishlistsTabProps> = ({
  activeSessionId,
  lookingForItems,
  roster = [],
  setLookingForItems,
  userAccount,
  isCurrentUserAdmin,
  triggerCopy,
  setCopyNotice,
  fireConfetti,
  findMember,
  onOpenBountiesPage,
  initialSearchQuery,
  onClearInitialSearch,
  onOpenProfile,
  onEmitFeedEvent,
  stashDrops = [],
  onAddStashDrop,
  onClaimStashDrop,
  onDeleteStashDrop
}) => {
  const [lookingForViewMode, setLookingForViewMode] = useState<'item' | 'player' | 'table' | 'stash'>('item');
  const [showPobImportModal, setShowPobImportModal] = useState<boolean>(false);
  const [lookingForSearch, setLookingForSearch] = useState<string>('');
  const [lookingForCategoryFilter, setLookingForCategoryFilter] = useState<string>('All');
  const [lookingForStatusFilter, setLookingForStatusFilter] = useState<string>('All');
  const [onlyMyNeeds, setOnlyMyNeeds] = useState<boolean>(false);
  const [selectedCharFilter, setSelectedCharFilter] = useState<string>('All');
  const [useCustomNewChar, setUseCustomNewChar] = useState<boolean>(false);
  const [showLootFilterModal, setShowLootFilterModal] = useState<boolean>(false);
  const [honorAwardBanner, setHonorAwardBanner] = useState<{ finder: string; itemName: string; requester: string; points?: number; label?: string } | null>(null);
  const [itemIcons, setItemIcons] = useState<Record<string, string>>(() => {
    try {
      const raw = sessionStorage.getItem('exile_ssf_item_icons_v3');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.ts && Date.now() - parsed.ts < 30 * 60 * 1000 && parsed?.icons && typeof parsed.icons === 'object') {
          return parsed.icons;
        }
      }
    } catch {}
    return {};
  });
  const [showItemAutocomplete, setShowItemAutocomplete] = useState<boolean>(false);

  void onOpenBountiesPage;

  const normalizeCharKey = (name: string): string =>
    String(name || '')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

  React.useEffect(() => {
    if (Object.keys(itemIcons).length > 100) return;
    let cancelled = false;
    fetch('/api/farming/ninja-prices?league=auto&scope=icons')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: any) => {
        if (!cancelled && data?.icons && typeof data.icons === 'object') {
          setItemIcons(data.icons);
          try {
            sessionStorage.setItem('exile_ssf_item_icons_v3', JSON.stringify({ ts: Date.now(), icons: data.icons }));
          } catch {}
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const lookupItemIcon = (itemName: string): string | null => {
    const clean = itemName.trim().toLowerCase();
    if (!clean) return null;
    if (itemIcons[clean]) return itemIcons[clean];
    const withoutParens = clean.replace(/\s*\([^)]*\)\s*/g, '').trim();
    if (itemIcons[withoutParens]) return itemIcons[withoutParens];
    // Strip gem level/quality prefixes like "20/20 ", "21/23 ", "lv20 ", "6l "
    const withoutPrefix = withoutParens
      .replace(/^(?:lv\.?\s*\d+|\d+\/\d+|q\d+|6l|6-link|5l|5-link|corrupted|any)\s+/i, '')
      .trim();
    if (withoutPrefix && itemIcons[withoutPrefix]) return itemIcons[withoutPrefix];
    // Fallback for "Foulborn <Unique>" if only base unique is listed
    if (withoutPrefix.startsWith('foulborn ')) {
      const baseUnique = withoutPrefix.replace(/^foulborn\s+/i, '').trim();
      if (itemIcons[baseUnique]) return itemIcons[baseUnique];
    }
    return null;
  };

  const myRosterEntry = React.useMemo(() => {
    if (!userAccount) return undefined;
    return roster.find(
      (m) =>
        (userAccount.id && m.id === userAccount.id) ||
        (userAccount.displayName && m.displayName.toLowerCase() === userAccount.displayName.toLowerCase()) ||
        (userAccount.poeAccountName && m.poeAccountName && m.poeAccountName.toLowerCase() === userAccount.poeAccountName.toLowerCase())
    );
  }, [roster, userAccount]);

  const myCharacters = React.useMemo(() => {
    const list: { characterName: string; ascendancy: string; buildName: string; level: number; isMain?: boolean }[] = [];
    const seen = new Set<string>();
    if (myRosterEntry) {
      for (const ch of getMemberCharacters(myRosterEntry)) {
        const key = normalizeCharKey(ch.characterName);
        if (key && !seen.has(key)) {
          seen.add(key);
          list.push({
            characterName: ch.characterName.replace(/\s+/g, ' ').trim(),
            ascendancy: ch.ascendancy,
            buildName: ch.buildName,
            level: ch.level,
            isMain: ch.isMain
          });
        }
      }
    }
    if (userAccount?.characterName) {
      const key = normalizeCharKey(userAccount.characterName);
      if (key && !seen.has(key)) {
        seen.add(key);
        list.push({
          characterName: userAccount.characterName.replace(/\s+/g, ' ').trim(),
          ascendancy: userAccount.ascendancy || 'Exile',
          buildName: userAccount.buildName || 'Main Build',
          level: userAccount.level || 1,
          isMain: true
        });
      }
    }
    return list;
  }, [myRosterEntry, userAccount]);

  const isMyEntry = (item: LookingForItem): boolean => {
    if (!userAccount) return false;
    const matchDisp = Boolean(
      userAccount.displayName &&
      item.displayName &&
      item.displayName.toLowerCase() === userAccount.displayName.toLowerCase()
    );
    const matchAcc = Boolean(
      userAccount.poeAccountName &&
      item.poeAccountName &&
      item.poeAccountName.toLowerCase() === userAccount.poeAccountName.toLowerCase()
    );
    const matchChar = myCharacters.some(
      (c) => normalizeCharKey(c.characterName) === normalizeCharKey(item.characterName)
    );
    return matchDisp || matchAcc || matchChar;
  };
  const [selectedInspectItemName, setSelectedInspectItemName] = useState<string | null>(null);

  const itemInspectDialogRef = useRef<HTMLDialogElement>(null);
  const inspectTitleId = useId();

  // Wishlist Edit and Delete State
  const [editingLookingForItem, setEditingLookingForItem] = useState<LookingForItem | null>(null);
  const [editItemName, setEditItemName] = useState<string>('');
  const [editCategory, setEditCategory] = useState<LookingForItem['category']>('Unique');
  const [editStatus, setEditStatus] = useState<ItemNeedStatus>('NEED');
  const [editNotes, setEditNotes] = useState<string>('');
  const [editBountyOffer, setEditBountyOffer] = useState<string>('');
  const [editBountyStatus, setEditBountyStatus] = useState<'OPEN' | 'CLAIMED' | 'PAID'>('OPEN');
  const [editChar, setEditChar] = useState<string>('');
  const [editDisplay, setEditDisplay] = useState<string>('');
  const [editFulfilledBy, setEditFulfilledBy] = useState<string>('');
  const editLookingForDialogRef = useRef<HTMLDialogElement>(null);

  // Add Wanted Item Form State
  const [showAddLookingForModal, setShowAddLookingForModal] = useState<boolean>(false);
  const [newLfChar, setNewLfChar] = useState<string>(userAccount?.characterName || '');
  const [newLfDisplay, setNewLfDisplay] = useState<string>(userAccount?.displayName || '');
  const [newLfItem, setNewLfItem] = useState<string>('');
  const [newLfCat, setNewLfCat] = useState<LookingForItem['category']>('Unique');
  const [newLfStatus, setNewLfStatus] = useState<ItemNeedStatus>('NEED');
  const [newLfNotes, setNewLfNotes] = useState<string>('');
  const [newLfBounty, setNewLfBounty] = useState<string>('');

  const itemSuggestions = React.useMemo(() => {
    const q = newLfItem.trim().toLowerCase();
    if (q.length < 2) return [];
    const keys = Object.keys(itemIcons);
    if (keys.length === 0) return [];
    const startsWith: { name: string; icon: string }[] = [];
    const contains: { name: string; icon: string }[] = [];
    for (const k of keys) {
      if (k.startsWith(q)) {
        startsWith.push({ name: k, icon: itemIcons[k] });
      } else if (k.includes(q)) {
        contains.push({ name: k, icon: itemIcons[k] });
      }
      if (startsWith.length >= 8 && contains.length >= 8) break;
    }
    return [...startsWith, ...contains].slice(0, 8).map((entry) => ({
      displayName: entry.name.replace(/\b\w/g, (ch) => ch.toUpperCase()),
      icon: entry.icon
    }));
  }, [newLfItem, itemIcons]);

  useEffect(() => {
    if (initialSearchQuery) {
      setLookingForSearch(initialSearchQuery);
      setLookingForStatusFilter('All');
      setLookingForCategoryFilter('All');
      onClearInitialSearch?.();
    }
  }, [initialSearchQuery, onClearInitialSearch]);

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
      const aAcquired = a.entries.length > 0 && a.entries.every((e) => e.status === 'HAVE');
      const bAcquired = b.entries.length > 0 && b.entries.every((e) => e.status === 'HAVE');
      if (aAcquired !== bAcquired) {
        return aAcquired ? 1 : -1;
      }
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
          (entry.category === 'Gem' || entry.category === 'Vaal Gem' || entry.category === 'Transfigured Gem' || entry.category === 'Awakened Gem'));
      const matchStatus =
        lookingForStatusFilter === 'All' ||
        (lookingForStatusFilter === 'HAVE'
          ? entry.entries.some((e) => e.status === 'HAVE')
          : entry.entries.some((e) => e.status === lookingForStatusFilter));
      const matchMine = !onlyMyNeeds || entry.entries.some((e) => isMyEntry(e));
      const matchChar =
        selectedCharFilter === 'All' ||
        entry.entries.some((e) => normalizeCharKey(e.characterName) === normalizeCharKey(selectedCharFilter));
      return matchText && matchCat && matchStatus && matchMine && matchChar;
    });
  }, [aggregatedItemsMap, lookingForSearch, lookingForCategoryFilter, lookingForStatusFilter, onlyMyNeeds, selectedCharFilter, userAccount, myCharacters]);

  const filteredLookingForItems = React.useMemo(() => {
    const list = lookingForItems.filter((item) => {
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
          (item.category === 'Gem' || item.category === 'Vaal Gem' || item.category === 'Transfigured Gem' || item.category === 'Awakened Gem'));

      const matchStatus =
        lookingForStatusFilter === 'All' || item.status === lookingForStatusFilter;

      return matchSearch && matchCat && matchStatus;
    });

    return [...list].sort((a, b) => {
      const aAcq = a.status === 'HAVE' ? 1 : 0;
      const bAcq = b.status === 'HAVE' ? 1 : 0;
      if (aAcq !== bAcq) return aAcq - bAcq;
      return a.itemName.localeCompare(b.itemName);
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

  const handleCycleStatus = (itemId: string, helperTag?: string) => {
    const existing = lookingForItems.find((it) => it.id === itemId);
    if (!existing) return;

    const nextStatus: ItemNeedStatus =
      existing.status === 'NEED'
        ? 'HAVE'
        : existing.status === 'HAVE'
        ? 'SECOND CHAR'
        : existing.status === 'SECOND CHAR'
        ? 'LOW PRIO'
        : 'NEED';

    if (nextStatus === 'HAVE') {
      const resolvedHelper = helperTag || (userAccount?.displayName ? `@${userAccount.displayName}` : 'Self Found');
      handleMarkFulfilled(itemId, resolvedHelper);
      return;
    }

    const itemCopy: LookingForItem = {
      ...existing,
      status: nextStatus
    };

    setLookingForItems((prev) => {
      const updated = prev.map((it) => (it.id === itemId ? itemCopy : it));
      try {
        localStorage.setItem('poe_clean330_looking_for', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    saveCloudWishlistItem(activeSessionId, itemCopy);
  };

  const handleMarkFulfilled = (itemId: string, helperTag: string) => {
    const existing = lookingForItems.find((it) => it.id === itemId);
    if (!existing) return;

    fireConfetti();
    const itemCopy: LookingForItem = {
      ...existing,
      status: 'HAVE' as ItemNeedStatus,
      fulfilledBy: helperTag,
      fulfilledByAccount: userAccount?.poeAccountName || existing.fulfilledByAccount,
      fulfilledAtIso: new Date().toISOString()
    };

    setLookingForItems((prev) => {
      const updated = prev.map((it) => (it.id === itemId ? itemCopy : it));
      try {
        localStorage.setItem('poe_clean330_looking_for', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    saveCloudWishlistItem(activeSessionId, itemCopy);
    const cleanHelper = helperTag.trim().replace(/^@/, '');
    const requesterClean = (existing.displayName || existing.characterName || '').trim().replace(/^@/, '').toLowerCase();
    const isSelfFound =
      !cleanHelper ||
      cleanHelper.toLowerCase() === 'self found' ||
      (requesterClean && cleanHelper.toLowerCase() === requesterClean) ||
      (existing.characterName && cleanHelper.toLowerCase() === existing.characterName.trim().toLowerCase());

    if (!isSelfFound) {
      const requesterTag = existing.displayName || existing.characterName || 'Squadmate';
      const finderKey = (userAccount?.poeAccountName || cleanHelper).trim().toLowerCase();
      saveCloudAchievementProfile(finderKey, {
        unlockedIds: {},
        lifetimeFulfilledCount: 1,
        lifetimeBountiesClaimed: existing.bountyOffer ? 1 : 0,
        lifetimeBountiesPaid: 0,
        leaguesParticipated: [activeSessionId],
        honorLog: [
          {
            id: `honor-find-${existing.id}`,
            points: HONOR_PER_ITEM_FOUND,
            reason: `Found "${existing.itemName}" for @${requesterTag}${existing.bountyOffer ? ` (Bounty: ${existing.bountyOffer})` : ''}`,
            where: `${formatLeagueLabel(activeSessionId)} • Wishlists`,
            timestampIso: itemCopy.fulfilledAtIso || new Date().toISOString(),
            kind: 'item_found'
          }
        ]
      });
      onEmitFeedEvent?.({
        type: 'item_fulfilled',
        actorHandle: cleanHelper,
        targetHandle: requesterTag,
        title: `Found "${existing.itemName}" for @${requesterTag}`,
        detail: existing.bountyOffer ? `Bounty: ${existing.bountyOffer} • +${HONOR_PER_ITEM_FOUND} Honor Points` : `+${HONOR_PER_ITEM_FOUND} Honor Points earned`,
        targetTab: 'looking_for'
      });
      setHonorAwardBanner({ finder: cleanHelper, itemName: existing.itemName, requester: requesterTag });
      setTimeout(() => setHonorAwardBanner(null), 5000);
      setCopyNotice(`+${HONOR_PER_ITEM_FOUND} Honor Points to @${cleanHelper}! Marked ${existing.itemName} as HAVE.`);
    } else {
      const selfHandle = userAccount?.displayName || existing.displayName || existing.characterName || 'Exile';
      const selfKey = (userAccount?.poeAccountName || selfHandle).trim().toLowerCase();
      saveCloudAchievementProfile(selfKey, {
        unlockedIds: {},
        lifetimeFulfilledCount: 0,
        lifetimeBountiesClaimed: 0,
        lifetimeBountiesPaid: 0,
        leaguesParticipated: [activeSessionId],
        honorLog: [
          {
            id: `honor-self-${existing.id}`,
            points: HONOR_PER_SELF_FOUND,
            reason: `Self Found "${existing.itemName}" for your build`,
            where: `${formatLeagueLabel(activeSessionId)} • Wishlists`,
            timestampIso: itemCopy.fulfilledAtIso || new Date().toISOString(),
            kind: 'self_found'
          }
        ]
      });
      setHonorAwardBanner({ finder: selfHandle, itemName: existing.itemName, requester: 'Self Found', points: HONOR_PER_SELF_FOUND, label: 'SELF FOUND BONUS!' });
      setTimeout(() => setHonorAwardBanner(null), 4500);
      setCopyNotice(`+${HONOR_PER_SELF_FOUND} Honor Points! Marked ${existing.itemName} as Self Found.`);
    }
    setTimeout(() => setCopyNotice(null), 3500);
  };

  const handleConfirmReceipt = (itemId: string) => {
    const existing = lookingForItems.find((it) => it.id === itemId);
    if (!existing || existing.receiptConfirmed) return;
    const nowIso = new Date().toISOString();
    const itemCopy: LookingForItem = {
      ...existing,
      receiptConfirmed: true,
      receiptConfirmedAtIso: nowIso,
      bountyStatus: existing.bountyOffer ? 'PAID' : existing.bountyStatus,
      bountyPaidAtIso: existing.bountyOffer ? nowIso : existing.bountyPaidAtIso
    };
    setLookingForItems((prev) => prev.map((it) => (it.id === itemId ? itemCopy : it)));
    saveCloudWishlistItem(activeSessionId, itemCopy);
    fireConfetti();
    const cleanHelper = (existing.fulfilledBy || '').replace(/^@/, '').trim();
    const requesterTag = existing.displayName || existing.characterName || 'Squadmate';
    if (cleanHelper && cleanHelper.toLowerCase() !== 'self found') {
      const finderKey = cleanHelper.toLowerCase();
      saveCloudAchievementProfile(finderKey, {
        unlockedIds: {},
        lifetimeFulfilledCount: 0,
        lifetimeBountiesClaimed: 0,
        lifetimeBountiesPaid: existing.bountyOffer ? 1 : 0,
        leaguesParticipated: [activeSessionId],
        honorLog: [
          {
            id: `honor-receipt-${existing.id}`,
            points: HONOR_PER_RECEIPT_CONFIRMED,
            reason: `@${requesterTag} confirmed receipt of "${existing.itemName}"`,
            where: `${formatLeagueLabel(activeSessionId)} • Delivery Confirmed`,
            timestampIso: nowIso,
            kind: 'receipt_confirmed'
          }
        ]
      });
      setHonorAwardBanner({
        finder: cleanHelper,
        itemName: existing.itemName,
        requester: requesterTag,
        points: HONOR_PER_RECEIPT_CONFIRMED,
        label: 'RECEIPT CONFIRMED BONUS!'
      });
      setTimeout(() => setHonorAwardBanner(null), 5000);
      setCopyNotice(`Confirmed! +${HONOR_PER_RECEIPT_CONFIRMED} Bonus Honor Points awarded to @${cleanHelper}.`);
      setTimeout(() => setCopyNotice(null), 3500);
    }
  };

  const handleBulkImportFromPob = (
    items: { itemName: string; category: WishlistItemCategory; notes: string }[],
    targetCharacterName?: string
  ) => {
    const charName = targetCharacterName || userAccount?.characterName || userAccount?.displayName || 'Main';
    const dispName = userAccount?.displayName || charName;
    const existingLower = new Set(
      lookingForItems
        .filter((i) => (i.displayName || i.characterName).toLowerCase() === dispName.toLowerCase())
        .map((i) => i.itemName.toLowerCase())
    );
    const created: LookingForItem[] = [];
    for (const it of items) {
      if (existingLower.has(it.itemName.toLowerCase())) continue;
      const newItem: LookingForItem = {
        id: `lf-pob-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        characterName: charName,
        displayName: dispName,
        preferredContact: userAccount?.preferredContact || 'app',
        discordName: userAccount?.discordName,
        poeAccountName: userAccount?.poeAccountName,
        itemName: it.itemName,
        category: it.category,
        status: 'NEED',
        notes: it.notes || 'Imported from PoB',
        poeWikiUrl: `https://www.poewiki.net/wiki/${encodeURIComponent(it.itemName.replace(/ /g, '_'))}`,
        poeDbUrl: `https://poedb.tw/us/search?q=${encodeURIComponent(it.itemName)}`
      };
      created.push(newItem);
      saveCloudWishlistItem(activeSessionId, newItem);
    }
    if (created.length > 0) {
      setLookingForItems((prev) => [...created, ...prev]);
      fireConfetti();
      setCopyNotice(`Imported ${created.length} items from PoB straight into your Wishlist!`);
      setTimeout(() => setCopyNotice(null), 3500);
    }
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
    setEditFulfilledBy(item.fulfilledBy || '');
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
          fulfilledBy: editStatus === 'HAVE' ? (editFulfilledBy.trim() || it.fulfilledBy || 'Self Found') : undefined,
          fulfilledAtIso: editStatus === 'HAVE' ? (it.fulfilledAtIso || new Date().toISOString()) : undefined,
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
    triggerCopy('', `Removed wishlist request for ${target.itemName}`);

    if (itemInspectDialogRef.current?.open) {
      const remainingForThis = updated.filter(
        (it) => it.itemName.toLowerCase() === target.itemName.toLowerCase()
      );
      if (remainingForThis.length === 0) {
        itemInspectDialogRef.current?.close();
        setSelectedInspectItemName(null);
      }
    }
  };

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
      poeDbUrl: `https://poedb.tw/us/search?q=${encodeURIComponent(newLfItem.trim())}`,
      bountyOffer: newLfBounty.trim() || undefined,
      bountyStatus: newLfBounty.trim() ? 'OPEN' : undefined
    };

    setLookingForItems([newItem, ...lookingForItems]);
    saveCloudWishlistItem(activeSessionId, newItem);
    onEmitFeedEvent?.({
      type: newItem.bountyOffer ? 'bounty_listed' : 'wishlist_added',
      actorHandle: newItem.displayName || newItem.characterName,
      actorCharacter: newItem.characterName,
      title: newItem.bountyOffer
        ? `Posted Bounty for "${newItem.itemName}" (${newItem.bountyOffer})`
        : `Wishlisted "${newItem.itemName}"`,
      detail: `${newItem.category} • ${newItem.status}${newItem.notes ? ` • ${newItem.notes}` : ''}`,
      targetTab: newItem.bountyOffer ? 'bounties' : 'looking_for'
    });
    setNewLfItem('');
    setNewLfNotes('');
    setNewLfBounty('');
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
    for (const [, items] of map.entries()) {
      items.sort((a, b) => {
        const aAcq = a.status === 'HAVE' ? 1 : 0;
        const bAcq = b.status === 'HAVE' ? 1 : 0;
        if (aAcq !== bAcq) return aAcq - bAcq;
        return a.itemName.localeCompare(b.itemName);
      });
    }
    return map;
  }, [filteredLookingForItems]);

  return (
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
            <option value="All" className="bg-slate-900 text-slate-200">All Categories</option>
            {WISHLIST_CATEGORY_GROUPS.map((grp) => (
              <optgroup key={grp.group} label={grp.group} className="bg-slate-950 text-slate-400">
                {grp.options.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-200">
                    {opt.filterLabel || opt.label}
                  </option>
                ))}
              </optgroup>
            ))}
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
            <button
              type="button"
              onClick={() => setLookingForViewMode('stash')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer font-medium flex items-center gap-1 ${
                lookingForViewMode === 'stash' ? 'bg-emerald-600/30 text-emerald-200 border border-emerald-500/40 shadow-sm' : 'text-emerald-400/80 hover:text-emerald-200'
              }`}
            >
              Free Stash ({stashDrops.filter((d) => !d.claimedBy).length})
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

          {/* Squad Loot Filter Generator Button */}
          <button
            type="button"
            onClick={() => setShowLootFilterModal(true)}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Generate a Path of Exile loot filter block with step by step setup instructions"
          >
            <Filter className="w-3.5 h-3.5 text-emerald-400" />
            <span>Squad Loot Filter</span>
          </button>

          {/* One Click Import from PoB Button */}
          <button
            type="button"
            onClick={() => setShowPobImportModal(true)}
            className="px-2.5 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Import required Uniques, Cluster Jewels, and Gems from a Path of Building code"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Import PoB</span>
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

      {/* At a Glance: My Characters Quick Filter Strip */}
      {userAccount && (
        <div className="px-3.5 py-2.5 rounded-xl border border-indigo-500/25 bg-indigo-950/15 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-mono uppercase text-indigo-300 font-bold mr-1">
              Farm View:
            </span>
            <button
              type="button"
              onClick={() => {
                setOnlyMyNeeds(false);
                setSelectedCharFilter('All');
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-colors cursor-pointer ${
                !onlyMyNeeds && selectedCharFilter === 'All'
                  ? 'bg-slate-800 text-white border border-slate-600 font-semibold'
                  : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              All Squad
            </button>
            <button
              type="button"
              onClick={() => {
                setOnlyMyNeeds(true);
                setSelectedCharFilter('All');
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-colors cursor-pointer ${
                onlyMyNeeds && selectedCharFilter === 'All'
                  ? 'bg-indigo-600 text-white border border-indigo-400 font-semibold shadow-sm'
                  : 'bg-slate-900/60 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-950/60'
              }`}
            >
              My Needs ({lookingForItems.filter((it) => it.status !== 'HAVE' && isMyEntry(it)).length})
            </button>

            {myCharacters.length > 0 && (
              <>
                <span className="text-slate-700 mx-0.5">|</span>
                {myCharacters.map((ch) => {
                  const openCount = lookingForItems.filter(
                    (it) =>
                      it.status !== 'HAVE' &&
                      normalizeCharKey(it.characterName) === normalizeCharKey(ch.characterName)
                  ).length;
                  const isSelected = normalizeCharKey(selectedCharFilter) === normalizeCharKey(ch.characterName);
                  return (
                    <button
                      key={ch.characterName}
                      type="button"
                      onClick={() => {
                        setOnlyMyNeeds(true);
                        setSelectedCharFilter(isSelected ? 'All' : ch.characterName);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-colors cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                          : 'bg-slate-950/70 text-slate-300 border border-slate-800 hover:border-amber-500/40 hover:text-white'
                      }`}
                      title={`${ch.characterName}: ${ch.ascendancy} Lvl ${ch.level} (${ch.buildName})`}
                    >
                      <span>{ch.characterName}</span>
                      <span
                        className={`text-[10px] px-1 rounded ${
                          isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-amber-300'
                        }`}
                      >
                        {openCount}
                      </span>
                    </button>
                  );
                })}
              </>
            )}
          </div>

          <span className="text-[10px] font-mono text-slate-400">
            Add alts in Roster Directory to filter by character
          </span>
        </div>
      )}

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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <label className="text-xs text-slate-400 block mb-1">Item Name *</label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  required
                  autoComplete="off"
                  placeholder="e.g. Aegis Aurora, Cloak of Flame..."
                  value={newLfItem}
                  onFocus={() => setShowItemAutocomplete(true)}
                  onBlur={() => setTimeout(() => setShowItemAutocomplete(false), 180)}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw.includes('Item Class:') || raw.includes('Rarity:')) {
                      const parsed = parsePoeClipboardTooltip(raw);
                      if (parsed) {
                        setNewLfItem(parsed.itemName);
                        setNewLfCat(parsed.category);
                        if (parsed.mods.length > 0 && !newLfNotes) {
                          setNewLfNotes(parsed.mods.slice(0, 2).join(' | '));
                        }
                        setShowItemAutocomplete(false);
                        return;
                      }
                    }
                    setNewLfItem(raw);
                    setShowItemAutocomplete(true);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 pr-9 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                {lookupItemIcon(newLfItem) && (
                  <img
                    src={lookupItemIcon(newLfItem)!}
                    alt=""
                    className="w-6 h-6 object-contain absolute right-1.5 pointer-events-none"
                  />
                )}
              </div>
              {showItemAutocomplete && itemSuggestions.length > 0 && (
                <div className="absolute z-40 left-0 right-0 mt-1 rounded-xl border border-slate-700 bg-[#0b0f18] shadow-2xl max-h-56 overflow-y-auto divide-y divide-slate-800/70">
                  {itemSuggestions.map((s) => (
                    <button
                      key={s.displayName}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setNewLfItem(s.displayName);
                        setShowItemAutocomplete(false);
                      }}
                      className="w-full px-2.5 py-1.5 flex items-center gap-2 text-left text-xs text-slate-200 hover:bg-indigo-600/20 hover:text-white cursor-pointer"
                    >
                      <img src={s.icon} alt="" className="w-5 h-5 object-contain shrink-0" />
                      <span className="truncate font-medium">{s.displayName}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Category</label>
              <select
                value={newLfCat}
                onChange={(e) => setNewLfCat(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-slate-700 cursor-pointer"
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
              <label className="text-xs text-slate-400 block mb-1">Priority Status</label>
              <select
                value={newLfStatus}
                onChange={(e) => setNewLfStatus(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-slate-700 cursor-pointer"
              >
                <option value="NEED">NEED (High Priority)</option>
                <option value="SECOND CHAR">SECOND CHAR</option>
                <option value="LOW PRIO">LOW PRIO</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">For Character (IGN) *</label>
              {myCharacters.length > 0 && !useCustomNewChar ? (
                <select
                  value={myCharacters.some((c) => c.characterName === newLfChar) ? newLfChar : myCharacters[0].characterName}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setUseCustomNewChar(true);
                      setNewLfChar('');
                    } else {
                      setNewLfChar(e.target.value);
                    }
                  }}
                  className="w-full bg-slate-950 border border-indigo-500/40 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-400 font-mono cursor-pointer"
                >
                  {myCharacters.map((ch) => (
                    <option key={ch.characterName} value={ch.characterName} className="bg-slate-900 text-slate-200">
                      {ch.characterName} ({ch.ascendancy} • Lvl {ch.level})
                    </option>
                  ))}
                  <option value="__custom__" className="bg-slate-900 text-amber-300">
                    + Type Another Character IGN...
                  </option>
                </select>
              ) : (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    required
                    placeholder="Your character IGN"
                    value={newLfChar}
                    onChange={(e) => setNewLfChar(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-slate-700 font-mono"
                  />
                  {myCharacters.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setUseCustomNewChar(false);
                        setNewLfChar(myCharacters[0].characterName);
                      }}
                      className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-indigo-300 cursor-pointer whitespace-nowrap"
                    >
                      My Chars
                    </button>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">App Display Tag (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Leuie"
                value={newLfDisplay}
                onChange={(e) => setNewLfDisplay(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-slate-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Specific Needs / Rolls / Notes</label>
              <input
                type="text"
                placeholder="e.g. Need high roll or corrupt for +2 proj"
                value={newLfNotes}
                onChange={(e) => setNewLfNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-slate-700"
              />
            </div>

            <div>
              <label className="text-xs text-amber-300 font-semibold block mb-1">
                Bounty / Finder Reward (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. 8 Divines, 100 Chaos, Boss Carry"
                value={newLfBounty}
                onChange={(e) => setNewLfBounty(e.target.value)}
                className="w-full bg-slate-950 border border-amber-500/40 rounded-lg px-2.5 py-1.5 text-xs text-amber-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
              />
              <div className="flex flex-wrap gap-1 mt-1.5">
                {['1 Divine', '5 Divines', '8 Divines', '50 Chaos', 'Boss Carry'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setNewLfBounty(p)}
                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-amber-500/20 text-[10px] font-mono text-slate-300 hover:text-amber-300 border border-slate-700 cursor-pointer"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
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
              const allAcquired = itemGroup.entries.length > 0 && itemGroup.entries.every((e) => e.status === 'HAVE');
              const someAcquired = itemGroup.entries.some((e) => e.status === 'HAVE');
              const fulfilledFinders = Array.from(
                new Set(
                  itemGroup.entries
                    .filter((e) => e.status === 'HAVE' && e.fulfilledBy)
                    .map((e) => e.fulfilledBy!)
                )
              );

              return (
                <div
                  key={idx}
                  onClick={() => handleOpenItemInspector(itemGroup.itemName)}
                  className={`p-3.5 rounded-xl transition-all cursor-pointer flex flex-col justify-between space-y-2 group shadow-sm ${
                    allAcquired
                      ? 'border-2 border-emerald-500 bg-emerald-950/20 hover:bg-emerald-950/30 hover:border-emerald-400 shadow-emerald-500/10'
                      : someAcquired
                      ? 'border border-emerald-500/50 bg-slate-900/80 hover:bg-slate-800/60 hover:border-emerald-500'
                      : 'border border-slate-800 bg-slate-900/70 hover:bg-slate-800/60 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <span className="inline-block text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
                          {itemGroup.category}
                        </span>
                        {allAcquired && (
                          <span className="ml-1.5 inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Acquired</span>
                          </span>
                        )}
                      </div>

                      {(() => {
                        const iconUrl = lookupItemIcon(itemGroup.itemName);
                        return iconUrl ? (
                          <div className="w-10 h-10 rounded-xl bg-slate-950/90 border border-slate-700/80 p-1 flex items-center justify-center shrink-0 shadow-inner">
                            <img
                              src={iconUrl}
                              alt={itemGroup.itemName}
                              className="w-full h-full object-contain"
                              loading="lazy"
                            />
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-center shrink-0 text-[10px] font-mono font-bold text-amber-400/90">
                            {itemGroup.category.slice(0, 2).toUpperCase()}
                          </div>
                        );
                      })()}
                    </div>

                    <div className={`font-semibold text-xs group-hover:text-white ${allAcquired ? 'text-emerald-200' : 'text-slate-200'}`}>
                      {itemGroup.itemName}
                    </div>

                    {itemGroup.entries.some((e) => e.bountyOffer && e.bountyOffer.trim()) && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {itemGroup.entries
                          .filter((e) => e.bountyOffer && e.bountyOffer.trim())
                          .map((bEntry, bIdx) => (
                            <span
                              key={bIdx}
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${
                                bEntry.bountyStatus === 'PAID'
                                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                                  : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                              }`}
                            >
                              <Coins className="w-2.5 h-2.5" />
                              <span>
                                Bounty: {bEntry.bountyOffer}
                                {bEntry.bountyStatus === 'PAID'
                                  ? ' (PAID)'
                                  : bEntry.bountyStatus === 'CLAIMED'
                                  ? ' (CLAIMED)'
                                  : ''}
                              </span>
                            </span>
                          ))}
                      </div>
                    )}

                    {/* Requesting player tags */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {itemGroup.entries.slice(0, 3).map((entry, eIdx) => {
                        const tagLabel = entry.displayName
                          ? (entry.characterName && entry.characterName.toLowerCase() !== entry.displayName.toLowerCase()
                              ? `@${entry.displayName} • ${entry.characterName}`
                              : `@${entry.displayName}`)
                          : (entry.discordName || entry.characterName);
                        return (
                          <button
                            key={eIdx}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenProfile?.(entry.displayName || entry.characterName);
                            }}
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded border cursor-pointer hover:underline ${
                              entry.status === 'HAVE'
                                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                                : 'bg-slate-800/90 text-slate-300 border-slate-700/50 hover:border-indigo-500/50'
                            }`}
                            title="Open Exile Profile Page"
                          >
                            {tagLabel}
                          </button>
                        );
                      })}
                      {itemGroup.entries.length > 3 && (
                        <span className="text-[10px] font-mono text-slate-500 self-center">
                          +{itemGroup.entries.length - 3}
                        </span>
                      )}
                    </div>

                    {/* Fulfillment provider credit */}
                    {fulfilledFinders.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 pt-1 text-[10px] font-mono text-emerald-400">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-950/90 border border-emerald-800/80 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-emerald-400" />
                          <span>Found by: {fulfilledFinders.join(', ')}</span>
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Click to inspect</span>
                    {!allAcquired ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const firstActive = itemGroup.entries.find((e) => e.status !== 'HAVE');
                          if (firstActive) {
                            const helper = userAccount?.displayName ? `@${userAccount.displayName}` : 'Guild Helper';
                            handleMarkFulfilled(firstActive.id, helper);
                          }
                        }}
                        className="px-2 py-0.5 rounded bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-800/80 text-emerald-300 text-[10px] font-mono flex items-center gap-1 cursor-pointer transition-colors"
                        title="Mark this item as fulfilled or acquired"
                      >
                        <Gift className="w-2.5 h-2.5 text-emerald-400" />
                        <span>Found It</span>
                      </button>
                    ) : (
                      <span className="text-emerald-400 font-mono text-[10px] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Acquired</span>
                      </span>
                    )}
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
                  {items.map((item) => {
                    const isAcquired = item.status === 'HAVE';
                    return (
                      <div
                        key={item.id}
                        className={`p-2.5 rounded-lg border transition-all text-xs flex flex-col gap-2 ${
                          isAcquired
                            ? 'border-2 border-emerald-500 bg-emerald-950/25 shadow-sm shadow-emerald-500/10'
                            : 'border-slate-800/80 bg-slate-950/60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="truncate">
                            <div className={`truncate font-semibold ${isAcquired ? 'text-emerald-300 flex items-center gap-1.5' : 'text-slate-200'}`}>
                              {isAcquired && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
                              <span>{item.itemName}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 truncate">{item.notes}</div>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => handleCycleStatus(item.id)}
                              className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors cursor-pointer font-bold ${
                                item.status === 'NEED'
                                  ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                                  : item.status === 'HAVE'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
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

                        {/* Fulfillment attribution */}
                        {isAcquired && (
                          <div className="flex items-center justify-between pt-1 border-t border-emerald-900/40 text-[10px] font-mono text-emerald-400">
                            <div className="flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-emerald-400" />
                              <span>Fulfilled by: <strong>{item.fulfilledBy || 'Self Found'}</strong></span>
                            </div>
                            {item.fulfilledAtIso && (
                              <span className="text-slate-500">{new Date(item.fulfilledAtIso).toLocaleDateString()}</span>
                            )}
                          </div>
                        )}

                        {/* Quick helper action if not acquired */}
                        {!isAcquired && (
                          <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-slate-800/40">
                            <button
                              type="button"
                              onClick={() => {
                                const helper = userAccount?.displayName ? `@${userAccount.displayName}` : 'Guild Helper';
                                handleMarkFulfilled(item.id, helper);
                              }}
                              className="px-2 py-0.5 rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800/80 text-emerald-300 text-[10px] font-mono flex items-center gap-1 cursor-pointer transition-colors"
                              title="Mark this item as fulfilled by you for this squadmate"
                            >
                              <Gift className="w-3 h-3 text-emerald-400" />
                              <span>I Found This!</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
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
                  <th className="p-2.5">Notes & Fulfillment</th>
                  <th className="p-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredLookingForItems.map((item) => {
                  const isAcquired = item.status === 'HAVE';
                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors ${
                        isAcquired
                          ? 'bg-emerald-950/20 border-l-4 border-l-emerald-500 hover:bg-emerald-950/30'
                          : 'hover:bg-slate-800/30'
                      }`}
                    >
                      <td className="p-2.5 font-medium text-slate-200">
                        <div className="flex items-center gap-1.5">
                          {isAcquired && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
                          <span className={isAcquired ? 'text-emerald-300 font-semibold' : ''}>{item.itemName}</span>
                        </div>
                      </td>
                      <td className="p-2.5 text-slate-400 font-mono text-[11px]">{item.category}</td>
                      <td className="p-2.5 font-mono text-slate-300">@{item.displayName || item.characterName}</td>
                      <td className="p-2.5">
                        <button
                          type="button"
                          onClick={() => handleCycleStatus(item.id)}
                          className={`font-mono text-[10px] px-2 py-0.5 rounded border cursor-pointer font-bold transition-colors ${
                            item.status === 'HAVE'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                              : item.status === 'NEED'
                              ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {item.status}
                        </button>
                      </td>
                      <td className="p-2.5 text-slate-400">
                        {isAcquired ? (
                          <div className="flex items-center gap-1 text-emerald-400 font-mono text-[11px]">
                            <Sparkles className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                            <span>Fulfilled by: <strong>{item.fulfilledBy || 'Self Found'}</strong></span>
                          </div>
                        ) : (
                          item.notes
                        )}
                      </td>
                      <td className="p-2.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!isAcquired && (
                            <button
                              type="button"
                              onClick={() => {
                                const helper = userAccount?.displayName ? `@${userAccount.displayName}` : 'Guild Helper';
                                handleMarkFulfilled(item.id, helper);
                              }}
                              className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                              title="Mark this item as fulfilled by you for this squadmate"
                            >
                              <Gift className="w-3 h-3" />
                              <span>Found It</span>
                            </button>
                          )}
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
                  );
                })}
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

      {lookingForViewMode === 'stash' && onAddStashDrop && onClaimStashDrop && onDeleteStashDrop && (
        <FreeStashFeed
          drops={stashDrops}
          currentUser={userAccount || null}
          isAdmin={isCurrentUserAdmin}
          onAddDrop={onAddStashDrop}
          onClaimDrop={onClaimStashDrop}
          onDeleteDrop={onDeleteStashDrop}
        />
      )}

      {/* Item Inspection Modal */}
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

                  const isAcquired = req.status === 'HAVE';
                  return (
                    <div
                      key={rIdx}
                      className={`p-3 rounded-lg space-y-2 text-xs transition-all ${
                        isAcquired
                          ? 'border-2 border-emerald-500 bg-emerald-950/30 shadow-md shadow-emerald-500/10'
                          : 'border border-slate-800 bg-slate-950/70'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <strong className={`font-mono ${isAcquired ? 'text-emerald-200' : 'text-slate-100'}`}>@{dispTag}</strong>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                            Pref: {preferred === 'app' ? 'Root App' : preferred === 'poe_whisper' ? 'Whisper' : preferred}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">IGN: {req.characterName}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCycleStatus(req.id)}
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors cursor-pointer font-bold ${
                            req.status === 'NEED'
                              ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                              : req.status === 'HAVE'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          Status: {req.status}
                        </button>
                      </div>

                      {/* Fulfillment attribution */}
                      {isAcquired && (
                        <div className="flex items-center justify-between text-[11px] font-mono text-emerald-300 bg-emerald-950/70 p-2 rounded-lg border border-emerald-800/60">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Acquired • Fulfilled by: <strong>{req.fulfilledBy || 'Self Found'}</strong></span>
                          </div>
                          {req.fulfilledAtIso && (
                            <span className="text-slate-400 text-[10px]">{new Date(req.fulfilledAtIso).toLocaleDateString()}</span>
                          )}
                        </div>
                      )}

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

                        {!isAcquired ? (
                          <button
                            type="button"
                            onClick={() => {
                              const helper = userAccount?.displayName ? `@${userAccount.displayName}` : 'Guild Helper';
                              handleMarkFulfilled(req.id, helper);
                            }}
                            className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-mono flex items-center gap-1 cursor-pointer font-bold shadow transition-colors"
                            title="Mark this item as fulfilled by you for this squadmate"
                          >
                            <Gift className="w-3 h-3" />
                            <span>I Found This!</span>
                          </button>
                        ) : (
                          <div className="flex flex-wrap items-center gap-1.5">
                            {req.fulfilledBy && req.fulfilledBy.toLowerCase() !== 'self found' && (
                              req.receiptConfirmed || req.bountyStatus === 'PAID' ? (
                                <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-mono font-bold flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Receipt Confirmed (+5 Honor)</span>
                                </span>
                              ) : canEditOrDeleteWishlist(req) ? (
                                <button
                                  type="button"
                                  onClick={() => handleConfirmReceipt(req.id)}
                                  className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-mono font-bold flex items-center gap-1 cursor-pointer shadow"
                                  title="Confirm you received this item to award an extra +5 Honor Points to the finder"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Confirm Receipt (+5 Honor)</span>
                                </button>
                              ) : null
                            )}
                            <button
                              type="button"
                              onClick={() => handleCycleStatus(req.id)}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-mono flex items-center gap-1 cursor-pointer"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Revert to Need</span>
                            </button>
                          </div>
                        )}

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

      {/* Edit Wishlist Request Modal */}
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

              {editStatus === 'HAVE' && (
                <div className="space-y-1 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60">
                  <label className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Fulfilled By (Helper Credit)</span>
                  </label>
                  <input
                    type="text"
                    value={editFulfilledBy}
                    onChange={(e) => setEditFulfilledBy(e.target.value)}
                    className="w-full bg-slate-950 border border-emerald-700/60 rounded-lg px-3 py-1.5 text-xs text-emerald-200 focus:outline-none focus:border-emerald-500 font-mono"
                    placeholder="e.g. @Chuyo or Self Found"
                  />
                </div>
              )}

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
                  <label className="text-xs font-semibold text-slate-300">For Character (IGN)</label>
                  <input
                    type="text"
                    value={editChar}
                    onChange={(e) => setEditChar(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-slate-700 font-mono"
                    placeholder="In Game Character IGN"
                  />
                  {myCharacters.length > 1 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {myCharacters.map((ch) => (
                        <button
                          key={ch.characterName}
                          type="button"
                          onClick={() => setEditChar(ch.characterName)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono border cursor-pointer ${
                            editChar.toLowerCase() === ch.characterName.toLowerCase()
                              ? 'bg-indigo-600 text-white border-indigo-400'
                              : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                          }`}
                        >
                          {ch.characterName}
                        </button>
                      ))}
                    </div>
                  )}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-amber-300">Bounty Reward Offer (Optional)</label>
                  <input
                    type="text"
                    value={editBountyOffer}
                    onChange={(e) => setEditBountyOffer(e.target.value)}
                    placeholder="e.g. 8 Divines, 100 Chaos, Boss Carry"
                    className="w-full bg-slate-950 border border-amber-500/40 rounded-lg px-3 py-1.5 text-xs text-amber-200 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Bounty Settlement Status</label>
                  <select
                    value={editBountyStatus}
                    onChange={(e) => setEditBountyStatus(e.target.value as any)}
                    disabled={!editBountyOffer.trim()}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-slate-700 cursor-pointer disabled:opacity-40"
                  >
                    <option value="OPEN">OPEN (Active Hunt)</option>
                    <option value="CLAIMED">CLAIMED (Pending Receipt)</option>
                    <option value="PAID">PAID (Settled)</option>
                  </select>
                </div>
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
      {honorAwardBanner && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3.5 rounded-2xl border-2 border-amber-400 bg-gradient-to-r from-amber-950/95 via-slate-900/95 to-emerald-950/95 shadow-2xl shadow-amber-500/20 flex items-center gap-3.5 animate-bounce">
          <div className="w-10 h-10 rounded-xl bg-amber-500/25 border border-amber-400 flex items-center justify-center flex-shrink-0">
            <Award className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <div className="text-sm font-bold text-amber-300 font-mono">
              +{honorAwardBanner.points || HONOR_PER_ITEM_FOUND} HONOR POINTS EARNED! {honorAwardBanner.label ? `(${honorAwardBanner.label})` : ''}
            </div>
            <div className="text-xs text-slate-200">
              @{honorAwardBanner.finder}: <strong>{honorAwardBanner.itemName}</strong> ({honorAwardBanner.requester})
            </div>
          </div>
        </div>
      )}

      <LootFilterExportModal
        isOpen={showLootFilterModal}
        onClose={() => setShowLootFilterModal(false)}
        lookingForItems={lookingForItems}
        triggerCopy={triggerCopy}
      />

      <PobWishlistImportModal
        isOpen={showPobImportModal}
        onClose={() => setShowPobImportModal(false)}
        myCharacters={myCharacters}
        onImportItems={handleBulkImportFromPob}
      />
    </div>
  );
};
