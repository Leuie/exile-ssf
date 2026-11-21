import type {
  AchievementDefinition,
  PersistentAchievementProfile,
  HonorHistoryEntry,
  LookingForItem,
  LeagueRosterMember,
  LeagueParticipantAlumnus,
  CommunityGuide,
  UserAccount
} from '../types';

export const HONOR_PER_ITEM_FOUND = 5;

export const ACHIEVEMENT_CATALOG: AchievementDefinition[] = [
  {
    id: 'first_benefactor',
    title: 'First Blood Benefactor',
    description: 'Fulfill your first wanted item for a squadmate on the wishlist.',
    category: 'Bounties & Coop',
    tier: 'Common',
    points: 25,
    rewardTitle: 'Squad Helper',
    target: 1
  },
  {
    id: 'squad_quartermaster',
    title: 'Squad Quartermaster',
    description: 'Fulfill 5 wanted items for fellow exiles across your league history.',
    category: 'Bounties & Coop',
    tier: 'Rare',
    points: 75,
    rewardTitle: 'Quartermaster',
    target: 5
  },
  {
    id: 'savior_of_coven',
    title: 'Savior of the Coven',
    description: 'Fulfill 15 wanted items across private leagues, carrying the squad economy.',
    category: 'Bounties & Coop',
    tier: 'Pinnacle',
    points: 200,
    rewardTitle: 'Savior of the Coven',
    target: 15
  },
  {
    id: 'bounty_hunter',
    title: 'Bounty Hunter',
    description: 'Find and claim your first incentivized item bounty for a squadmate.',
    category: 'Bounties & Coop',
    tier: 'Rare',
    points: 60,
    rewardTitle: 'Bounty Hunter',
    target: 1
  },
  {
    id: 'master_tracker',
    title: 'Master Loot Tracker',
    description: 'Claim 3 or more incentivized item bounties across leagues.',
    category: 'Bounties & Coop',
    tier: 'Unique',
    points: 150,
    rewardTitle: 'Master Tracker',
    target: 3
  },
  {
    id: 'patron_of_exiles',
    title: 'Patron of Exiles',
    description: 'Post a bounty reward on a wanted item and confirm delivery settlement.',
    category: 'Wishlist & Economy',
    tier: 'Rare',
    points: 50,
    rewardTitle: 'Patron of Exiles',
    target: 1
  },
  {
    id: 'wishlist_architect',
    title: 'Wishlist Architect',
    description: 'Post 3 or more items to the squad wishlist so teammates can drop match for you.',
    category: 'Wishlist & Economy',
    tier: 'Common',
    points: 20,
    target: 3
  },
  {
    id: 'high_stakes_commission',
    title: 'High Stakes Commission',
    description: 'Post an active bounty offer on the Squad Bounty Board to incentivize a chase item hunt.',
    category: 'Wishlist & Economy',
    tier: 'Common',
    points: 30,
    target: 1
  },
  {
    id: 'umbra_initiate',
    title: 'League Initiate',
    description: 'Register an exile on the active private league roster directory.',
    category: 'League Loyalty',
    tier: 'Common',
    points: 25,
    rewardTitle: 'Umbra Initiate',
    target: 1
  },
  {
    id: 'seasoned_veteran',
    title: 'Seasoned Veteran',
    description: 'Participate in 2 or more Exile SSF private league seasons (carried over via Alumni records).',
    category: 'League Loyalty',
    tier: 'Rare',
    points: 80,
    rewardTitle: 'League Veteran',
    target: 2
  },
  {
    id: 'noir_legend',
    title: 'NOIR Legend',
    description: 'Participate in 4 or more Exile SSF private league seasons across Path of Exile history.',
    category: 'League Loyalty',
    tier: 'Pinnacle',
    points: 250,
    rewardTitle: 'NOIR Legend',
    target: 4
  },
  {
    id: 'scholar_of_wraeclast',
    title: 'Scholar of Wraeclast',
    description: 'Contribute a starter or endgame build guide to the community library.',
    category: 'Community & Guides',
    tier: 'Unique',
    points: 100,
    rewardTitle: 'Wraeclast Scholar',
    target: 1
  }
];

const EMPTY_PROFILE: PersistentAchievementProfile = {
  unlockedIds: {},
  equippedTitle: undefined,
  lifetimeFulfilledCount: 0,
  lifetimeBountiesClaimed: 0,
  lifetimeBountiesPaid: 0,
  leaguesParticipated: [],
  honorLog: []
};

export function getPlayerCloudKey(userAccount?: UserAccount | null): string {
  const raw =
    userAccount?.poeAccountName ||
    userAccount?.displayName ||
    userAccount?.characterName ||
    '';
  return raw.trim().toLowerCase();
}

export function formatLeagueLabel(leagueId?: string): string {
  const clean = (leagueId || 'poe1-330-umbra').toLowerCase().trim();
  if (clean === 'poe1-330-umbra') return 'Covens of Umbra (3.30)';
  if (clean === 'poe2-05-ancients') return 'Return of the Ancients (0.5)';
  return leagueId || 'Private League';
}

export function buildRetroactiveHonorHistory(params: {
  fulfilledByPlayer: LookingForItem[];
  achievementProfile?: PersistentAchievementProfile | null;
  leagueId?: string;
}): {
  entries: HonorHistoryEntry[];
  achievementPoints: number;
  fulfillmentBonusPoints: number;
  totalHonorPoints: number;
} {
  const { fulfilledByPlayer, achievementProfile, leagueId } = params;
  const map = new Map<string, HonorHistoryEntry>();
  const leagueLabel = formatLeagueLabel(leagueId);

  // 1. Existing persisted honor log from Cloudflare D1 (carries across seasons)
  for (const logItem of achievementProfile?.honorLog || []) {
    if (logItem?.id) {
      map.set(logItem.id, logItem);
    }
  }

  // 2. Retroactively credit +5 Honor Points for every item found for a squadmate
  for (const item of fulfilledByPlayer) {
    if (item.status !== 'HAVE') continue;
    if (!item.fulfilledBy || item.fulfilledBy.trim().toLowerCase() === 'self found') continue;
    const requester = item.displayName || item.characterName || 'Squadmate';
    const entryId = `honor-find-${item.id}`;
    if (!map.has(entryId)) {
      map.set(entryId, {
        id: entryId,
        points: HONOR_PER_ITEM_FOUND,
        reason: `Found "${item.itemName}" for @${requester}${item.bountyOffer ? ` (Bounty: ${item.bountyOffer})` : ''}`,
        where: `${leagueLabel} • Wishlists`,
        timestampIso: item.fulfilledAtIso || '',
        kind: 'item_found'
      });
    }
  }

  // 3. Add unlocked achievement entries
  const unlockedIds = achievementProfile?.unlockedIds || {};
  for (const def of ACHIEVEMENT_CATALOG) {
    if (unlockedIds[def.id]) {
      const entryId = `honor-ach-${def.id}`;
      if (!map.has(entryId)) {
        map.set(entryId, {
          id: entryId,
          points: def.points,
          reason: `Unlocked Achievement: ${def.title}`,
          where: 'Exile SSF Achievements',
          timestampIso: unlockedIds[def.id],
          kind: 'achievement'
        });
      }
    }
  }

  const entries = Array.from(map.values()).sort((a, b) =>
    (b.timestampIso || '').localeCompare(a.timestampIso || '')
  );

  const achievementPoints = entries
    .filter((e) => e.kind === 'achievement')
    .reduce((sum, e) => sum + e.points, 0);

  const findEntriesCount = entries.filter((e) => e.kind === 'item_found').length;
  const effectiveFinds = Math.max(findEntriesCount, achievementProfile?.lifetimeFulfilledCount || 0);
  const fulfillmentBonusPoints = effectiveFinds * HONOR_PER_ITEM_FOUND;

  return {
    entries,
    achievementPoints,
    fulfillmentBonusPoints,
    totalHonorPoints: achievementPoints + fulfillmentBonusPoints
  };
}

export interface EvaluatedAchievement {
  definition: AchievementDefinition;
  current: number;
  target: number;
  percent: number;
  unlocked: boolean;
  unlockedAtIso?: string;
}

export interface AchievementEvaluationResult {
  playerKey: string;
  profile: PersistentAchievementProfile;
  achievements: EvaluatedAchievement[];
  achievementPoints: number;
  fulfillmentBonusPoints: number;
  totalPoints: number;
  maxPoints: number;
  unlockedCount: number;
  hasCloudChanges: boolean;
  availableTitles: string[];
}

export function evaluateCloudAchievements(params: {
  activeSessionId: string;
  userAccount?: UserAccount | null;
  cloudAchievements: Record<string, PersistentAchievementProfile>;
  lookingForItems: LookingForItem[];
  roster: LeagueRosterMember[];
  alumniList: LeagueParticipantAlumnus[];
  guides: CommunityGuide[];
}): AchievementEvaluationResult {
  const { activeSessionId, userAccount, cloudAchievements, lookingForItems, roster, alumniList, guides } = params;
  const playerKey = getPlayerCloudKey(userAccount);
  const existingCloud = (playerKey && cloudAchievements[playerKey]) || EMPTY_PROFILE;
  const stored: PersistentAchievementProfile = {
    unlockedIds: { ...(existingCloud.unlockedIds || {}) },
    equippedTitle: existingCloud.equippedTitle,
    lifetimeFulfilledCount: Number(existingCloud.lifetimeFulfilledCount) || 0,
    lifetimeBountiesClaimed: Number(existingCloud.lifetimeBountiesClaimed) || 0,
    lifetimeBountiesPaid: Number(existingCloud.lifetimeBountiesPaid) || 0,
    leaguesParticipated: Array.isArray(existingCloud.leaguesParticipated) ? [...existingCloud.leaguesParticipated] : [],
    honorLog: Array.isArray(existingCloud.honorLog) ? [...existingCloud.honorLog] : []
  };

  const matchIdentity = (val?: string): boolean => {
    if (!val || !userAccount) return false;
    const low = val.trim().toLowerCase();
    return Boolean(
      (userAccount.displayName && low === userAccount.displayName.trim().toLowerCase()) ||
      (userAccount.characterName && low === userAccount.characterName.trim().toLowerCase()) ||
      (userAccount.poeAccountName && low === userAccount.poeAccountName.trim().toLowerCase())
    );
  };

  const sessionFulfilled = lookingForItems.filter(
    (it) =>
      it.status === 'HAVE' &&
      it.fulfilledBy &&
      it.fulfilledBy.toLowerCase() !== 'self found' &&
      (matchIdentity(it.fulfilledBy) || matchIdentity(it.fulfilledByAccount))
  );

  const sessionBountiesClaimed = sessionFulfilled.filter(
    (it) => Boolean(it.bountyOffer && it.bountyOffer.trim())
  ).length;

  const myPostedItems = lookingForItems.filter(
    (it) =>
      matchIdentity(it.displayName) ||
      matchIdentity(it.characterName) ||
      matchIdentity(it.poeAccountName)
  );

  const myPostedBounties = myPostedItems.filter((it) => Boolean(it.bountyOffer && it.bountyOffer.trim())).length;
  const sessionBountiesPaid = myPostedItems.filter((it) => it.bountyStatus === 'PAID').length;

  const onActiveRoster = roster.some(
    (m) =>
      matchIdentity(m.displayName) ||
      matchIdentity(m.characterName) ||
      matchIdentity(m.poeAccountName)
  );

  const alumniRecord = alumniList.find(
    (a) => matchIdentity(a.displayName) || matchIdentity(a.poeAccountName)
  );

  const leaguesSet = new Set<string>(stored.leaguesParticipated);
  if (onActiveRoster) {
    leaguesSet.add(activeSessionId);
  }
  if (alumniRecord?.pastLeagues) {
    alumniRecord.pastLeagues.forEach((lg) => leaguesSet.add(lg));
  }
  const totalLeaguesCount = Math.max(
    leaguesSet.size,
    (alumniRecord?.totalLeaguesCount || 0) + (onActiveRoster ? 1 : 0)
  );

  const guidesAuthored = guides.filter((g) => matchIdentity(g.authorName)).length;

  const lifetimeFulfilledCount = Math.max(stored.lifetimeFulfilledCount, sessionFulfilled.length);
  const lifetimeBountiesClaimed = Math.max(stored.lifetimeBountiesClaimed, sessionBountiesClaimed);
  const lifetimeBountiesPaid = Math.max(stored.lifetimeBountiesPaid, sessionBountiesPaid);

  const progressMap: Record<string, number> = {
    first_benefactor: lifetimeFulfilledCount,
    squad_quartermaster: lifetimeFulfilledCount,
    savior_of_coven: lifetimeFulfilledCount,
    bounty_hunter: lifetimeBountiesClaimed,
    master_tracker: lifetimeBountiesClaimed,
    patron_of_exiles: lifetimeBountiesPaid,
    wishlist_architect: myPostedItems.length,
    high_stakes_commission: myPostedBounties,
    umbra_initiate: onActiveRoster ? 1 : 0,
    seasoned_veteran: totalLeaguesCount,
    noir_legend: totalLeaguesCount,
    scholar_of_wraeclast: guidesAuthored
  };

  const nextUnlocked = { ...stored.unlockedIds };
  let newlyUnlocked = false;
  const nowIso = new Date().toISOString();

  const evaluated: EvaluatedAchievement[] = ACHIEVEMENT_CATALOG.map((def) => {
    const rawCurrent = progressMap[def.id] || 0;
    const previouslyUnlocked = Boolean(nextUnlocked[def.id]);
    const unlocked = previouslyUnlocked || rawCurrent >= def.target;

    if (unlocked && !previouslyUnlocked) {
      nextUnlocked[def.id] = nowIso;
      newlyUnlocked = true;
    }

    const displayCurrent = unlocked ? Math.max(rawCurrent, def.target) : rawCurrent;
    const percent = Math.min(100, Math.round((displayCurrent / def.target) * 100));

    return {
      definition: def,
      current: displayCurrent,
      target: def.target,
      percent,
      unlocked,
      unlockedAtIso: nextUnlocked[def.id]
    };
  });

  // Build retroactive + live honor log
  const historyCalc = buildRetroactiveHonorHistory({
    fulfilledByPlayer: sessionFulfilled,
    achievementProfile: { ...stored, unlockedIds: nextUnlocked, lifetimeFulfilledCount },
    leagueId: activeSessionId
  });

  const nextProfile: PersistentAchievementProfile = {
    unlockedIds: nextUnlocked,
    equippedTitle: stored.equippedTitle,
    lifetimeFulfilledCount,
    lifetimeBountiesClaimed,
    lifetimeBountiesPaid,
    leaguesParticipated: Array.from(leaguesSet),
    honorLog: historyCalc.entries
  };

  const hasCloudChanges = Boolean(
    playerKey &&
    (newlyUnlocked ||
      nextProfile.lifetimeFulfilledCount !== stored.lifetimeFulfilledCount ||
      nextProfile.lifetimeBountiesClaimed !== stored.lifetimeBountiesClaimed ||
      nextProfile.lifetimeBountiesPaid !== stored.lifetimeBountiesPaid ||
      nextProfile.leaguesParticipated.length !== stored.leaguesParticipated.length ||
      (nextProfile.honorLog?.length || 0) !== (stored.honorLog?.length || 0))
  );

  const achievementPoints = evaluated.reduce((acc, a) => acc + (a.unlocked ? a.definition.points : 0), 0);
  const fulfillmentBonusPoints = lifetimeFulfilledCount * HONOR_PER_ITEM_FOUND;
  const totalPoints = achievementPoints + fulfillmentBonusPoints;
  const maxPoints = ACHIEVEMENT_CATALOG.reduce((acc, d) => acc + d.points, 0);
  const unlockedCount = evaluated.filter((a) => a.unlocked).length;
  const availableTitles = evaluated
    .filter((a) => a.unlocked && a.definition.rewardTitle)
    .map((a) => a.definition.rewardTitle as string);

  return {
    playerKey,
    profile: nextProfile,
    achievements: evaluated,
    achievementPoints,
    fulfillmentBonusPoints,
    totalPoints,
    maxPoints,
    unlockedCount,
    hasCloudChanges,
    availableTitles
  };
}
