export interface DualLink {
  name: string;
  category: 'item' | 'boss' | 'div_card' | 'base' | 'gem' | 'mechanic' | 'currency';
  poeWikiUrl: string;
  poeDbUrl: string;
  description: string;
  tags: string[];
}

export interface VendorRecipe {
  id: string;
  title: string;
  category: 'leveling' | 'crafting' | 'currency' | 'utility';
  components: string[];
  reward: string;
  usageNotes: string;
  poeWikiUrl?: string;
  poeDbUrl?: string;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  subtitle: string;
  category: 'survival_kit' | 'crafting' | 'progression_ehp' | 'atlas_mapping' | 'bossing_fragments' | 'loot_filters' | 'league_mechanics';
  readTime: string;
  summary: string;
  content: string;
  tags: string[];
  dualLinks?: DualLink[];
}

export interface SSFBuild {
  id: string;
  name: string;
  class: string;
  ascendancy: string;
  creator: string;
  creatorUrl?: string;
  pobUrl?: string;
  videoGuideUrl?: string;
  guideSlug?: string;
  ssfViabilityScore: number; // 1 - 10
  uniqueDependency: 'None (Pure Rare)' | '1 Farmable Unique' | 'Transfigured Gem' | 'Specific Div Card';
  playstyle: 'DoT' | 'Melee' | 'Spell Caster' | 'Totem / Ballista' | 'Minion / Corpse' | 'Bow Attack' | 'Brands';
  summary: string;
  pros: string[];
  cons: string[];
  levelingGems: string[];
  keyCraftingSteps: string[];
  targetUniquesOrCards?: {
    name: string;
    farmLocation: string;
    poeWikiUrl: string;
    poeDbUrl: string;
  }[];
}

export interface CampaignZone {
  zoneName: string;
  level: number;
  hasWaypoint: boolean;
  hasSkillPoint?: boolean;
  skillPointQuest?: string;
  hasLabTrial?: boolean;
  labTrialName?: string;
  navigationTip: string;
  vendorReminder?: string;
  dangerAlert?: string;
  poeWikiUrl?: string;
}

export interface CampaignAct {
  actNumber: number;
  title: string;
  themeColor: string;
  accentHex: string;
  bgGradient: string;
  levelRange: string;
  bossName: string;
  bossWikiUrl: string;
  bossStrategy: string;
  keyUnlocks: string[];
  resistCheck?: string;
  zones: CampaignZone[];
}

export interface TrackerItem {
  id: string;
  title: string;
  category: 'daily' | 'weekly' | 'macro_atlas' | 'macro_voidstones' | 'macro_pantheon' | 'macro_unveils';
  description: string;
  completed: boolean;
  tier?: 'Week 1' | 'Week 2' | 'Week 3' | 'Daily';
  rewardInfo?: string;
}

export interface DirectoryLink {
  id: string;
  title: string;
  category: 'Databases & Wikis' | 'Crafting & Emulators' | 'Filter & Regex' | 'Builds & Ladders' | 'League Mechanics' | 'Community Guides';
  description: string;
  url: string;
  iconName: string;
  isEssential: boolean;
  poeWikiUrl?: string;
  poeDbUrl?: string;
}

export interface WishlistItem {
  id: string;
  requesterName: string;
  itemName: string;
  itemType: 'Unique' | 'Div Card' | 'Fractured Base' | 'Cluster Jewel' | 'Transfigured Gem' | 'Crafting Material';
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  notes: string;
  isFulfilled: boolean;
  fulfilledBy?: string;
  poeWikiUrl?: string;
  poeDbUrl?: string;
}

export interface SpecializationMember {
  playerName: string;
  role: string;
  assignedMechanics: string[];
  currentGoal: string;
  atlasTreeFocus: string;
}

// ============================================================================
// NOIR 3.30 COVEN OF UMBRA PRIVATE LEAGUE PORTAL TYPES & DYNAMIC TAGGING
// ============================================================================

export type ItemNeedStatus = 'NEED' | 'HAVE' | 'LOW PRIO' | 'SECOND CHAR';

export type ContactPlatform = 'app' | 'poe_whisper' | 'discord' | 'steam' | 'forum';

export interface ContactTag {
  platform: ContactPlatform;
  label: string;
  handle: string;
  isPrimary: boolean;
}

export interface LeagueParticipantAlumnus {
  id: string;
  displayName: string;
  poeAccountName: string;
  discordName?: string;
  steamName?: string;
  preferredContact: ContactPlatform;
  pastLeagues: string[];
  totalLeaguesCount: number;
  lastPlayedExpansion: string;
  lastKnownBuild?: string;
  nudgedForCurrentLeague?: boolean;
  nudgedAt?: string;
  notes?: string;
}

export interface ActiveLeagueSession {
  id: string;
  game: 'poe1' | 'poe2';
  name: string;
  expansion: string;
  version: string;
  isActive: boolean;
  launchDateIso: string;
  fundedDays: number;
  targetDays: number;
  currentSlots: number;
  globalChannel: string;
  hostName?: string;
  hostAccountTag?: string;
  officialLeagueUrl?: string;
  discordUrl?: string;
  description?: string;
  isReadOnlyArchive?: boolean;
  crowdfundPointsCurrent?: number;
  crowdfundPointsGoal?: number;
  crowdfundStatus?: string;
}

export interface UserAccount {
  id: string;
  provider: 'google' | 'app';
  displayName: string; // Exile SSF App Username / Profile Tag
  preferredContact: ContactPlatform;
  poeAccountName: string; // Linked PoE Account Tag (e.g. Account#1234)
  poeProfileUrl?: string; // Linked PoE Profile from pathofexile.com
  characterName: string;
  discordName?: string;
  steamName?: string;
  customTag?: string;
  email?: string;
  linkedGoogleEmail?: string;
  passwordHash?: string;
  className: string;
  ascendancy: string;
  leagueMode: 'Private' | 'Softcore' | 'SSF';
  availableAtLaunch: 'Yes' | 'No' | 'Late Start';
  level: number;
  buildName: string;
  pobUrl?: string;
  atlasContent: string[];
  notes: string;
  inviteStatus: 'Accepted' | 'Invited' | 'Pending Invite';
  registeredAt: string;
  isAdmin?: boolean;
}

export interface LeagueRosterMember {
  id: string;
  slotNumber: number;
  leagueMode: 'Private' | 'Softcore' | 'SSF';
  displayName: string; // Exile SSF App Username or primary tag
  preferredContact: ContactPlatform;
  poeAccountName: string;
  poeProfileUrl?: string;
  characterName: string;
  discordName?: string;
  steamName?: string;
  customTag?: string;
  className: string;
  ascendancy: string;
  availableAtLaunch: 'Yes' | 'No' | 'Late Start';
  level: number;
  buildName: string;
  pobUrl?: string;
  atlasContent: string[];
  notes: string;
  inviteStatus: 'Accepted' | 'Invited' | 'Pending Invite';
  isSupporterHeart?: boolean;
  isOnline?: boolean;
  characters?: LeagueCharacter[]; // Multiple characters tracked under this single account slot
}

export interface LeagueCharacter {
  id: string;
  characterName: string;
  ascendancy: string;
  className?: string;
  buildName: string;
  level: number;
  pobUrl?: string;
  notes?: string;
  isMain?: boolean;
}

export type WishlistItemCategory =
  | 'Unique'
  | 'Base / Crafting'
  | 'Flask / Tincture'
  | 'Jewel'
  | 'Cluster Jewel'
  | 'Gem'
  | 'Vaal Gem'
  | 'Transfigured Gem'
  | 'Awakened Gem'
  | 'Map'
  | 'Fragment / Boss'
  | 'Scarab'
  | 'Memory / Invitation'
  | 'Currency'
  | 'Essence'
  | 'Fossil / Resonator'
  | 'Catalyst'
  | 'Oil / Enchant'
  | 'Delirium Orb'
  | 'Harvest / Beast'
  | 'Thread of Creation'
  | 'Div Card'
  | 'Heist'
  | 'Expedition'
  | 'Tattoo / Omen'
  | 'Sanctum / Ultimatum'
  | 'Corpse / Allflame'
  | 'Other';

export interface LookingForItem {
  id: string;
  characterName: string;
  displayName?: string; // Root Web App User Tag
  preferredContact?: ContactPlatform;
  discordName?: string;
  poeAccountName?: string;
  itemName: string;
  category: WishlistItemCategory;
  status: ItemNeedStatus;
  notes: string;
  poeWikiUrl: string;
  poeDbUrl: string;
  fulfilledBy?: string; // Player tag who fulfilled it or Self Found
  fulfilledByAccount?: string;
  fulfilledAtIso?: string;
  bountyOffer?: string; // Optional finder incentive (e.g. 8 Divines, 150 Chaos, Boss Carry)
  bountyStatus?: 'OPEN' | 'CLAIMED' | 'PAID';
  bountyPaidAtIso?: string;
  receiptConfirmed?: boolean;
  receiptConfirmedAtIso?: string;
}

export type AchievementTier = 'Common' | 'Rare' | 'Unique' | 'Pinnacle';

export type AchievementCategory = 'Bounties & Coop' | 'League Loyalty' | 'Wishlist & Economy' | 'Community & Guides';

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  tier: AchievementTier;
  points: number;
  rewardTitle?: string;
  target: number;
  iconUrl?: string;
  leagueId?: string;
  nonRetroactive?: boolean;
}

export interface HonorHistoryEntry {
  id: string;
  points: number;
  reason: string;
  where: string;
  timestampIso: string;
  kind: 'item_found' | 'receipt_confirmed' | 'self_found' | 'early_pioneer' | 'achievement';
}

export interface PersistentAchievementProfile {
  unlockedIds: Record<string, string>; // achievementId -> unlockedAtIso
  equippedTitle?: string;
  lifetimeFulfilledCount: number;
  lifetimeBountiesClaimed: number;
  lifetimeBountiesPaid: number;
  leaguesParticipated: string[];
  honorLog?: HonorHistoryEntry[];
}

export interface FoundUniqueVaultItem {
  id: string;
  itemName: string;
  category: 'Unique' | 'Transfigured Gem' | 'Vaal Gem' | 'Gem' | 'Div Card' | 'Fractured Base' | 'Cluster Jewel' | 'Oil / Catalyst / Currency';
  finderCharacter: string;
  finderDiscord: string;
  location: 'Guild Tab 1 (Uniques)' | 'Guild Tab 2 (Bases & Gems)' | 'Whisper Finder' | 'Admin Hold Tab';
  socketsOrRoll: string;
  notes: string;
  status: 'Available' | 'Claimed / Traded' | 'Reserved';
  claimedBy?: string;
  postedAt: string;
  poeWikiUrl: string;
  poeDbUrl: string;
}

export interface CommunityGuide {
  id: string;
  title: string;
  authorName: string;
  authorDiscord: string;
  className: string;
  ascendancy: string;
  playstyle: string;
  starterRating: number;
  pobCodeOrUrl: string;
  videoOrForumUrl?: string;
  levelingNotes: string;
  endgameNotes: string;
  requiredUniques: string[];
  atlasFocus: string[];
  upvotes: number;
  createdAt: string;
  game?: 'poe1' | 'poe2';
  isExternalLinkOnly?: boolean;
  creatorName?: string;
  creatorChannelUrl?: string;
  creatorPlatform?: 'YouTube' | 'Maxroll' | 'Twitch' | 'Forum' | 'Mobalytics' | 'Community';
  tags?: string[];
  slug?: string;
  fullGuideMarkdown?: string;
  isSsfStarter?: boolean;
  uniqueDependency?: string;
}

export type FeedbackCategory = 'feature_request' | 'website_improvement' | 'private_league_tool' | 'bug_report' | 'build_guide_request';
export type FeedbackStatus = 'under_review' | 'planned' | 'in_progress' | 'implemented';

export interface SiteFeedbackItem {
  id: string;
  title: string;
  description: string;
  category: FeedbackCategory;
  status: FeedbackStatus;
  upvotes: number;
  authorDisplayName: string;
  authorPreferredContact?: ContactPlatform;
  authorPoeAccount?: string;
  authorDiscord?: string;
  adminResponse?: string;
  adminResponderName?: string;
  createdAt: string;
  gameContext?: 'poe1' | 'poe2' | 'both';
}

export interface PastPrivateLeague {
  id: string;
  name: string;
  expansion: string;
  version: string;
  url: string;
  participants: number;
  duration: string;
  highlight: string;
}

export interface SyndicateMemberReward {
  member: string;
  transportation: string;
  fortification: string;
  research: string;
  intervention: string;
  topPriorityDivision?: 'Transportation' | 'Fortification' | 'Research' | 'Intervention';
  priorityNote?: string;
}

export interface HeistRogueInfo {
  rogue: string;
  jobs: { job: string; maxLevel: number; rewardTypes: string[] }[];
  passiveEffect: string;
  damageType: 'Spell' | 'Melee' | 'Projectile';
  bestGearNote: string;
}

export interface DelveFossilInfo {
  fossil: string;
  effect: string;
  biomes: string[];
  tier: 'S' | 'A' | 'B';
}

export interface IncursionRoomInfo {
  tier1: string;
  tier2: string;
  tier3: string;
  effect: string;
  isHighValue: boolean;
}

export interface AtlasMapRating {
  mapName: string;
  naturalTier: number;
  layoutScore: number;
  mobDensityScore: number;
  divCardScore: number;
  bossScore: number;
  totalScore: number;
  notableCards?: string;
}

export type SquadServiceType =
  | 'Boss Carry'
  | '4 Voidstones'
  | 'T17 Completion'
  | 'Crafting & Betrayal'
  | 'Lab Runner'
  | 'Atlas & Mapping';

export interface SquadServiceListing {
  id: string;
  leagueId: string;
  providerDisplayName: string;
  providerCharacterName: string;
  providerPoeAccount?: string;
  serviceType: SquadServiceType;
  title: string;
  fee: string;
  atlasFocus?: string;
  notes?: string;
  isActive: boolean;
  createdAtIso: string;
}

export type VouchCategory =
  | 'Boss Carry'
  | 'Wishlist Bounty'
  | 'Crafting Service'
  | 'General Coop';

export interface PlayerVouch {
  id: string;
  leagueId: string;
  providerDisplayName: string;
  providerKey: string;
  voucherDisplayName: string;
  category: VouchCategory;
  itemOrServiceName: string;
  comment: string;
  createdAtIso: string;
}

export interface OfficialLadderEntry {
  rank: number;
  dead: boolean;
  online: boolean;
  accountName: string;
  characterName: string;
  level: number;
  ascendancy: string;
  experience: number;
}

export interface ExileProfile {
  handle: string;
  uid: string;
  avatarUrl?: string;
  bio?: string;
  timezone?: string;
  poeAccountName?: string;
  poeProfileUrl?: string;
  rootHandle?: string;
  discordHandle?: string;
  twitchUrl?: string;
  favoriteClass?: string;
  mapRegexBricks?: string[];
  sessionGoals?: PersonalSessionGoal[];
  lastSeenFeedAt?: string;
  updatedAtIso?: string;
}

export interface PersonalSessionGoal {
  id: string;
  text: string;
  characterName?: string;
  done: boolean;
  createdAtIso: string;
}

export interface FreeStashDrop {
  id: string;
  leagueId: string;
  donorDisplayName: string;
  donorCharacterName: string;
  itemName: string;
  baseType?: string;
  rarity: 'Unique' | 'Rare' | 'Magic' | 'Gem' | 'Currency' | 'Divination Card' | 'Other';
  itemLevel?: number;
  mods: string[];
  rawTooltip?: string;
  notes?: string;
  claimedBy?: string;
  claimedAtIso?: string;
  createdAtIso: string;
}

export interface BossRotaListing {
  id: string;
  leagueId: string;
  hostDisplayName: string;
  hostCharacterName: string;
  title: string;
  bossType: string;
  scheduledTime: string;
  maxSpots: number;
  participants: string[];
  notes?: string;
  status: 'OPEN' | 'FULL' | 'COMPLETED';
  createdAtIso: string;
}

export interface LeagueFirstMilestone {
  id: string;
  leagueId: string;
  milestoneKey: string;
  title: string;
  winnerDisplayName: string;
  winnerCharacterName?: string;
  proofNote?: string;
  achievedAtIso: string;
}

export type LeagueFeedEventType =
  | 'roster_join'
  | 'character_posted'
  | 'wishlist_added'
  | 'bounty_listed'
  | 'item_fulfilled'
  | 'build_published'
  | 'achievement_earned'
  | 'stash_drop'
  | 'boss_rota'
  | 'league_first';

export interface LeagueFeedComment {
  id: string;
  authorHandle: string;
  text: string;
  createdAtIso: string;
}

export interface LeagueFeedEvent {
  id: string;
  leagueId: string;
  type: LeagueFeedEventType;
  actorHandle: string;
  actorCharacter?: string;
  title: string;
  detail?: string;
  targetHandle?: string;
  targetTab?: string;
  iconUrl?: string;
  cheers?: string[];
  comments?: LeagueFeedComment[];
  createdAtIso: string;
}
