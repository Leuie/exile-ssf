import type {
  LeagueParticipantAlumnus,
  ActiveLeagueSession,
  WishlistItem,
  SpecializationMember,
  LeagueRosterMember,
  LookingForItem,
  FoundUniqueVaultItem,
  CommunityGuide,
  PastPrivateLeague,
  SyndicateMemberReward,
  HeistRogueInfo,
  DelveFossilInfo,
  IncursionRoomInfo,
  AtlasMapRating
} from '../types';


export const ACTIVE_LEAGUE_SESSIONS: ActiveLeagueSession[] = [
  {
    id: 'poe1-330-umbra',
    game: 'poe1',
    name: 'Ravenwatch Coven of Umbra GSF | Winter 2026',
    expansion: 'Coven of Umbra',
    version: '3.30',
    isActive: true,
    launchDateIso: '2026-11-13T19:00:00Z',
    fundedDays: 20,
    targetDays: 40,
    currentSlots: 30,
    globalChannel: '/global 5712'
  },
  {
    id: 'poe2-ea-ancients',
    game: 'poe2',
    name: 'NOIR Return of the Ancients GSF',
    expansion: 'Return of the Ancients',
    version: '0.5',
    isActive: false,
    launchDateIso: '2026-11-20T19:00:00Z',
    fundedDays: 30,
    targetDays: 30,
    currentSlots: 20,
    globalChannel: '/global 5712'
  }
];

export const COVEN_OF_UMBRA_INFO = {
  version: '3.30',
  expansionName: 'Coven of Umbra',
  tagline: 'She comes for your realm.',
  leagueName: 'Ravenwatch Coven of Umbra GSF | Winter 2026',
  revealDateIso: '2026-11-06T19:00:00Z',
  launchDateIso: '2026-11-13T19:00:00Z',
  globalChannel: '/global 5712',
  discordUrl: 'https://rootapp.gg/AC1NPUuJiQqlyDvGbgH-8A',
  discordChannel: '#gsf-coordination',
  officialLeagueUrl: '',
  expansionPageUrl: 'https://www.pathofexile.com/umbra',
  heroArtworkUrl: '/images/covens_of_umbra_hero.png',
  gameAvatarUrl: '/logo.png',
  fundedDays: 20,
  targetDays: 40,
  currentSlots: 30,
  crowdfundPointsCurrent: 1850,
  crowdfundPointsGoal: 3000,
  maintainedBy: 'Leuie',
  quickLinks: [
    {
      label: 'Ravenwatch Root Community (Official GSF)',
      category: 'Community',
      url: 'https://rootapp.gg/AC1NPUuJiQqlyDvGbgH-8A',
      description: 'Official gathering place for GSF participants, build discussions, and guild communications on Root.'
    },
    {
      label: 'NOIR Guild HQ on Root',
      category: 'Guild HQ',
      url: 'https://rootapp.gg/AC01VYpHiAq1rM0An8FDzw',
      description: 'Official NOIR guild home on Root. Founded and created by Leuie in January 2018.'
    },
    {
      label: '3.30 Coven of Umbra Official Hub',
      category: 'Official',
      url: 'https://www.pathofexile.com/umbra',
      description: 'Official expansion teaser, ritual coven lore, and ExileCon reveal countdown.'
    },
    {
      label: '3.30 Patch Notes & Balance Manifesto',
      category: 'Patch Notes',
      url: 'https://www.pathofexile.com/forum/view-thread/3531661',
      description: 'Complete skill balance changes, endgame adjustments, and Coven mechanics.'
    },
    {
      label: 'New & Transfigured Gems (3.30)',
      category: 'Gems',
      url: 'https://www.pathofexile.com/forum/view-thread/3532728',
      description: 'Level 20 / 20% quality stats for all new Coven of Umbra and Transfigured skill gems.'
    },
    {
      label: 'Item Filter Information & NeverSink',
      category: 'Loot Filter',
      url: 'https://www.filterblade.xyz/',
      description: 'Sync your SSF and Group Self Found loot filters directly to your Path of Exile account.'
    },
    {
      label: '3.30 Challenge Rewards Showcase',
      category: 'Challenges',
      url: 'https://www.pathofexile.com/forum/view-thread/3532965',
      description: 'Preview the 40/40 Coven of Umbra cosmetic armor tiers and totem pole hideout rewards.'
    },
    {
      label: 'Faustus Currency Exchange Guide',
      category: 'Economy',
      url: 'https://www.pathofexile.com/forum/view-thread/3532348',
      description: 'How asynchronous currency trading and gold costs work alongside our Guild Barter tabs.'
    }
  ]
};

export const POE2_ANCIENTS_INFO = {
  version: '0.5',
  expansionName: 'Return of the Ancients',
  tagline: 'The old gods awaken in the Vaal jungles.',
  leagueName: 'NOIR Return of the Ancients GSF League',
  revealDateIso: '2026-11-13T19:00:00Z',
  launchDateIso: '2026-11-20T19:00:00Z',
  globalChannel: '/global 5712',
  discordUrl: 'https://www.noircommunity.com/',
  discordChannel: '#poe2-chat',
  officialLeagueUrl: 'https://pathofexile2.com/ancients',
  expansionPageUrl: 'https://pathofexile2.com/ancients',
  fundedDays: 30,
  targetDays: 30,
  currentSlots: 20,
  crowdfundPointsCurrent: 2000,
  crowdfundPointsGoal: 2000,
  maintainedBy: 'Leuie',
  quickLinks: [
    {
      label: 'PoE 2 Early Access Portal',
      category: 'Official',
      url: 'https://pathofexile2.com/',
      description: 'Official Path of Exile 2 early access details, server status, and key guides.'
    },
    {
      label: 'PoE 2 Wiki & Database',
      category: 'Database',
      url: 'https://www.poe2wiki.net/',
      description: 'Comprehensive item bases, skill gem tables, and boss mechanics for PoE 2.'
    },
    {
      label: 'Faustus Gold & Trade System',
      category: 'Economy',
      url: 'https://pathofexile2.com/trade',
      description: 'How instant gold trading and shared guild stash tabs operate in PoE 2 GSF.'
    }
  ]
};

export const PAST_NOIR_LEAGUES: PastPrivateLeague[] = [
  {
    id: 'past-allflame',
    name: 'Small Group Allflame SSF',
    expansion: 'Curse of the Allflame',
    version: '3.29',
    url: 'https://www.pathofexile.com/private-leagues/league/Small+Group+Allflame+SSF',
    participants: 24,
    duration: '30 Days',
    highlight: 'Penance Brand Ignite Elementalist & Allflame Pack Mastery'
  },
  {
    id: 'past-mercenaries',
    name: 'NOIR Mercenaries League',
    expansion: 'Mercenaries Event',
    version: '3.28',
    url: 'https://www.pathofexile.com/private-leagues/league/NOIR+Mercenaries+League',
    participants: 22,
    duration: '20 Days',
    highlight: 'Group Voidstone Carries & Guild Stash Unique Collection'
  },
  {
    id: 'past-memorial',
    name: 'NOIR Memorial Day Blast',
    expansion: 'Holiday Blast Event',
    version: '3.27',
    url: 'https://www.pathofexile.com/private-leagues/league/NOIR+Memorial+Day+Blast',
    participants: 18,
    duration: '10 Days',
    highlight: 'High Speed Boss Rush & Cooperative Atlas Completion'
  },
  {
    id: 'past-spring',
    name: 'NOIR Spring Private League',
    expansion: 'Settlers of Kalguur',
    version: '3.25',
    url: 'https://www.pathofexile.com/private-leagues/league/NOIR+Spring+Private+League',
    participants: 26,
    duration: '30 Days',
    highlight: 'Kingsmarch Shipping, Recombinators & 900+ Shared Wishlist Items'
  },
  {
    id: 'past-fall',
    name: 'NOIR Fall Private League I',
    expansion: 'Necropolis / Ancestors',
    version: '3.24',
    url: 'https://www.pathofexile.com/private-leagues/league/NOIR+Fall+Private+League+I',
    participants: 21,
    duration: '25 Days',
    highlight: 'Inaugural NOIR Group Self Found Private League'
  }
];

export const NOIR_LEAGUE_FAQ = [
  {
    q: 'What is this private league for? What is its purpose?',
    a: 'The private league is a mechanic released by GGG for communities to create a closed environment with only the players and rules they choose. Our league is Group Self Found (SSF lite). This means you find or craft 95 to 100% of the gear your build requires yourself, while enjoying cooperative barter and sharing within our tight knit community. It eliminates RMT, bots, and market inflation so you can focus on the true ARPG grind!'
  },
  {
    q: 'How many player slots are there?',
    a: 'As many as we need to add to fit everyone who is interested! We usually have 15 to 30+ active exiles playing together depending on the base expansion.'
  },
  {
    q: 'Are there any extra difficulty mods added to the league?',
    a: 'No. Standard softcore challenge league mechanics apply with zero extra monster damage or penalty modifiers.'
  },
  {
    q: 'How does trading work in a Group Self Found league?',
    a: 'We operate on a cooperative barter and generosity system. The goal is to help each other progress rather than extort currency. Make deals that benefit both sides amicably, or simply drop useful uniques and bases into the Guild Stash trade tabs for squad mates who list them on their Looking For list!'
  },
  {
    q: 'How do I join the 3.30 Coven of Umbra Private League?',
    a: '1. Sign in on this portal using Google Auth or create a dedicated Exile SSF account, and link your Path of Exile account tag and character.\n2. Click "Register for Coven of Umbra" so our admins see you on the Roster.\n3. Once invites are sent, open the official Private League link and click "Accept Invite".\n4. Everyone who registers before launch is invited before the countdown hits zero so you can create your character right on the twilight beach!'
  },
  {
    q: 'Where is the in game global chat and Guild?',
    a: 'Join "/global 5712" in game! To join the in game NOIR Guild for shared stash tabs, post your character name in the Ravenwatch Root Community or ask an admin directly in /global 5712.'
  },
  {
    q: 'What if the person I want to trade with is offline or plays different hours?',
    a: 'Look up their Root or Discord handle in the Player Directory tab and whisper them! For asynchronous trades across time zones, place the item in the Guild Trade Tab and ping them, or ask any admin to hold valuable items in an admin hold tab.'
  },
  {
    q: 'What happens when the private league ends or if I want to leave early?',
    a: 'Your characters, your Atlas progression (including all Voidstones), and your personal stash migrate seamlessly to the parent Coven of Umbra softcore trade challenge league. You can also press "Migrate" or "Migrate All" on the character selection screen at any time.'
  },
  {
    q: 'Can the private league duration be extended?',
    a: 'Yes! The initial fund covers the first 20 days, and community crowdfunding donations extend the league up to 40 to 60 days.'
  },
  {
    q: 'Are there any activity requirements?',
    a: 'None at all. Play as much or as little as you like at your own pace!'
  }
];

export const ASCENDANCY_CATALOG = [
  { name: 'Elementalist', baseClass: 'Witch', color: 'from-amber-500/20 to-rose-500/20 border-amber-500/40 text-amber-300' },
  { name: 'Necromancer', baseClass: 'Witch', color: 'from-purple-500/20 to-indigo-500/20 border-purple-500/40 text-purple-300' },
  { name: 'Occultist', baseClass: 'Witch', color: 'from-violet-500/20 to-fuchsia-500/20 border-violet-500/40 text-violet-300' },
  { name: 'Hierophant', baseClass: 'Templar', color: 'from-sky-500/20 to-indigo-500/20 border-sky-500/40 text-sky-300' },
  { name: 'Inquisitor', baseClass: 'Templar', color: 'from-amber-500/20 to-yellow-500/20 border-amber-500/40 text-amber-300' },
  { name: 'Guardian', baseClass: 'Templar', color: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/40 text-cyan-300' },
  { name: 'Trickster', baseClass: 'Shadow', color: 'from-teal-500/20 to-emerald-500/20 border-teal-500/40 text-teal-300' },
  { name: 'Saboteur', baseClass: 'Shadow', color: 'from-orange-500/20 to-amber-500/20 border-orange-500/40 text-orange-300' },
  { name: 'Assassin', baseClass: 'Shadow', color: 'from-indigo-500/20 to-slate-500/20 border-indigo-500/40 text-indigo-300' },
  { name: 'Deadeye', baseClass: 'Ranger', color: 'from-emerald-500/20 to-green-500/20 border-emerald-500/40 text-emerald-300' },
  { name: 'Pathfinder', baseClass: 'Ranger', color: 'from-lime-500/20 to-emerald-500/20 border-lime-500/40 text-lime-300' },
  { name: 'Warden', baseClass: 'Ranger', color: 'from-amber-500/20 to-emerald-500/20 border-emerald-500/40 text-emerald-300' },
  { name: 'Slayer', baseClass: 'Duelist', color: 'from-rose-500/20 to-red-500/20 border-rose-500/40 text-rose-300' },
  { name: 'Champion', baseClass: 'Duelist', color: 'from-yellow-500/20 to-amber-500/20 border-yellow-500/40 text-yellow-300' },
  { name: 'Gladiator', baseClass: 'Duelist', color: 'from-red-500/20 to-orange-500/20 border-red-500/40 text-red-300' },
  { name: 'Juggernaut', baseClass: 'Marauder', color: 'from-orange-600/20 to-red-600/20 border-orange-500/40 text-orange-300' },
  { name: 'Chieftain', baseClass: 'Marauder', color: 'from-red-600/20 to-amber-600/20 border-red-500/40 text-red-300' },
  { name: 'Berserker', baseClass: 'Marauder', color: 'from-rose-600/20 to-orange-600/20 border-rose-500/40 text-rose-300' },
  { name: 'Ascendant', baseClass: 'Scion', color: 'from-indigo-500/20 to-amber-500/20 border-indigo-400/40 text-indigo-200' },
  { name: 'Reliquarian', baseClass: 'Scion', color: 'from-purple-500/20 to-amber-500/20 border-purple-400/40 text-purple-200' },
  { name: 'Luminary', baseClass: 'Scion', color: 'from-amber-400/20 to-cyan-400/20 border-amber-400/40 text-amber-200' }
];



export const POE2_ASCENDANCY_CATALOG = [
  { name: 'Invoker', baseClass: 'Monk', color: 'from-amber-500/20 to-sky-500/20 border-amber-500/40 text-amber-300' },
  { name: 'Acolyte of Chayula', baseClass: 'Monk', color: 'from-purple-500/20 to-indigo-500/20 border-purple-500/40 text-purple-300' },
  { name: 'Stormweaver', baseClass: 'Sorceress', color: 'from-sky-500/20 to-cyan-500/20 border-sky-500/40 text-sky-300' },
  { name: 'Chronomancer', baseClass: 'Sorceress', color: 'from-indigo-500/20 to-violet-500/20 border-indigo-500/40 text-indigo-300' },
  { name: 'Witchhunter', baseClass: 'Mercenary', color: 'from-orange-500/20 to-amber-500/20 border-orange-500/40 text-orange-300' },
  { name: 'Gemling Legionnaire', baseClass: 'Mercenary', color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/40 text-emerald-300' },
  { name: 'Titan', baseClass: 'Warrior', color: 'from-red-600/20 to-orange-600/20 border-red-500/40 text-red-300' },
  { name: 'Warbringer', baseClass: 'Warrior', color: 'from-amber-600/20 to-red-600/20 border-amber-500/40 text-amber-300' },
  { name: 'Deadeye', baseClass: 'Ranger', color: 'from-emerald-500/20 to-green-500/20 border-emerald-500/40 text-emerald-300' },
  { name: 'Pathfinder', baseClass: 'Ranger', color: 'from-lime-500/20 to-emerald-500/20 border-lime-500/40 text-lime-300' },
  { name: 'Amazon', baseClass: 'Huntress', color: 'from-yellow-500/20 to-amber-500/20 border-yellow-500/40 text-yellow-300' },
  { name: 'Primalist', baseClass: 'Huntress', color: 'from-teal-500/20 to-emerald-500/20 border-teal-500/40 text-teal-300' }
];

export const NOIR_ALUMNI_PARTICIPANTS: LeagueParticipantAlumnus[] = [
  {
    id: 'alumnus-queueray',
    displayName: 'QueueRay',
    poeAccountName: 'QueueRay#4412',
    discordName: '@queueray',
    preferredContact: 'app',
    pastLeagues: ['Small Group Allflame SSF', 'NOIR Mercenaries League', 'NOIR Memorial Day Blast', 'NOIR Spring Private League', 'NOIR Fall Private League I'],
    totalLeaguesCount: 5,
    lastPlayedExpansion: 'Curse of the Allflame',
    lastKnownBuild: 'BAMA / Arakaali Fang Minion Tank',
    nudgedForCurrentLeague: false
  },
  {
    id: 'alumnus-czeliosss',
    displayName: 'Czelio',
    poeAccountName: 'Czeliosss#1920',
    discordName: '@czelio',
    preferredContact: 'discord',
    pastLeagues: ['Small Group Allflame SSF', 'NOIR Mercenaries League', 'NOIR Memorial Day Blast'],
    totalLeaguesCount: 3,
    lastPlayedExpansion: 'Curse of the Allflame',
    lastKnownBuild: 'Holy Relic of Conviction & Chain DD',
    nudgedForCurrentLeague: false
  },
  {
    id: 'alumnus-bonexollector',
    displayName: 'Bonexollector',
    poeAccountName: 'Bonexollector#8831',
    discordName: '@bonexollector',
    preferredContact: 'poe_whisper',
    pastLeagues: ['Small Group Allflame SSF', 'NOIR Spring Private League'],
    totalLeaguesCount: 2,
    lastPlayedExpansion: 'Curse of the Allflame',
    lastKnownBuild: 'Absolution / Elemental SRS Minion Army',
    nudgedForCurrentLeague: false
  },
  {
    id: 'alumnus-leerone',
    displayName: 'LeerOne',
    poeAccountName: 'LeerOne#5109',
    discordName: '@leerone',
    preferredContact: 'discord',
    pastLeagues: ['Small Group Allflame SSF', 'NOIR Mercenaries League'],
    totalLeaguesCount: 2,
    lastPlayedExpansion: 'Curse of the Allflame',
    lastKnownBuild: 'Frost Blades / Dual Strike Slayer',
    nudgedForCurrentLeague: false
  },
  {
    id: 'alumnus-ward',
    displayName: 'Ward',
    poeAccountName: 'Ward#2204',
    discordName: '@ward_poe',
    preferredContact: 'poe_whisper',
    pastLeagues: ['Small Group Allflame SSF', 'NOIR Memorial Day Blast'],
    totalLeaguesCount: 2,
    lastPlayedExpansion: 'Curse of the Allflame',
    lastKnownBuild: 'Elemental Hit of the Spectrum Deadeye',
    nudgedForCurrentLeague: false
  },
  {
    id: 'alumnus-venulum',
    displayName: 'Venulum',
    poeAccountName: 'Venulum#7740',
    discordName: '@venulum',
    preferredContact: 'app',
    pastLeagues: ['Small Group Allflame SSF', 'NOIR Fall Private League I'],
    totalLeaguesCount: 2,
    lastPlayedExpansion: 'Curse of the Allflame',
    lastKnownBuild: 'Poison Zoomancer / Wraithlord Spectres',
    nudgedForCurrentLeague: false
  },
  {
    id: 'alumnus-mastrokman',
    displayName: 'mastrokman',
    poeAccountName: 'mastrokman#3318',
    discordName: '@mastrokman',
    preferredContact: 'discord',
    pastLeagues: ['Small Group Allflame SSF', 'NOIR Mercenaries League'],
    totalLeaguesCount: 2,
    lastPlayedExpansion: 'Curse of the Allflame',
    lastKnownBuild: 'Chaos Minions / Fourth Vow Tank',
    nudgedForCurrentLeague: false
  },
  {
    id: 'alumnus-taradus',
    displayName: 'Taradus',
    poeAccountName: 'Taradus#9012',
    discordName: '@taradus',
    preferredContact: 'poe_whisper',
    pastLeagues: ['Small Group Allflame SSF'],
    totalLeaguesCount: 1,
    lastPlayedExpansion: 'Curse of the Allflame',
    lastKnownBuild: 'Strength Stacker Slams Juggernaut',
    nudgedForCurrentLeague: false
  },
  {
    id: 'alumnus-z3r0',
    displayName: 'Z3R0',
    poeAccountName: 'Z3R0#6120',
    discordName: '@z3r0',
    preferredContact: 'app',
    pastLeagues: ['Small Group Allflame SSF', 'NOIR Spring Private League'],
    totalLeaguesCount: 2,
    lastPlayedExpansion: 'Curse of the Allflame',
    lastKnownBuild: 'Archmage Ice Nova of Frostbolts Hierophant',
    nudgedForCurrentLeague: false
  },
  {
    id: 'alumnus-compyclon',
    displayName: 'Compyclon',
    poeAccountName: 'Compyclon#4091',
    discordName: '@compyclon',
    preferredContact: 'discord',
    pastLeagues: ['Small Group Allflame SSF'],
    totalLeaguesCount: 1,
    lastPlayedExpansion: 'Curse of the Allflame',
    lastKnownBuild: 'Exsanguinate / Cold Traps Saboteur',
    nudgedForCurrentLeague: false
  },
  {
    id: 'alumnus-i7mods',
    displayName: 'i7mods',
    poeAccountName: 'i7mods#1184',
    discordName: '@i7mods',
    preferredContact: 'poe_whisper',
    pastLeagues: ['Small Group Allflame SSF', 'NOIR Mercenaries League'],
    totalLeaguesCount: 2,
    lastPlayedExpansion: 'Curse of the Allflame',
    lastKnownBuild: 'Explosive Arrow Ballista Elementalist',
    nudgedForCurrentLeague: false
  },
  {
    id: 'alumnus-veneratemyrelics',
    displayName: 'Venerate',
    poeAccountName: 'VenerateMyRelics#7712',
    discordName: '@venerate',
    preferredContact: 'discord',
    pastLeagues: ['Small Group Allflame SSF'],
    totalLeaguesCount: 1,
    lastPlayedExpansion: 'Curse of the Allflame',
    lastKnownBuild: 'Summon Holy Relic Necromancer',
    nudgedForCurrentLeague: false
  },
  {
    id: 'alumnus-dd-dads',
    displayName: 'Brondos',
    poeAccountName: 'DD_of_dead_dads#2901',
    discordName: '@brondos',
    preferredContact: 'discord',
    pastLeagues: ['Small Group Allflame SSF', 'NOIR Memorial Day Blast'],
    totalLeaguesCount: 2,
    lastPlayedExpansion: 'Curse of the Allflame',
    lastKnownBuild: 'Chaos Detonate Dead / Poison Occultist',
    nudgedForCurrentLeague: false
  },
  {
    id: 'alumnus-blinknilla',
    displayName: 'Blinknilla',
    poeAccountName: 'Blinknilla#5582',
    discordName: '@blinknilla',
    preferredContact: 'poe_whisper',
    pastLeagues: ['Small Group Allflame SSF'],
    totalLeaguesCount: 1,
    lastPlayedExpansion: 'Curse of the Allflame',
    lastKnownBuild: 'Toxic Rain / Caustic Arrow Pathfinder',
    nudgedForCurrentLeague: false
  },
  {
    id: 'alumnus-quackmandan',
    displayName: 'Quackmandan',
    poeAccountName: 'Quackmandan#3190',
    discordName: '@quackmandan',
    preferredContact: 'app',
    pastLeagues: ['Small Group Allflame SSF', 'NOIR Spring Private League'],
    totalLeaguesCount: 2,
    lastPlayedExpansion: 'Curse of the Allflame',
    lastKnownBuild: 'Zombie / Skeleton Baron Necromancer',
    nudgedForCurrentLeague: false
  },
  {
    id: 'alumnus-peeterlbh',
    displayName: 'PeeterLBH',
    poeAccountName: 'PeeterLBH#8044',
    discordName: '@peeterlbh',
    preferredContact: 'poe_whisper',
    pastLeagues: ['Small Group Allflame SSF'],
    totalLeaguesCount: 1,
    lastPlayedExpansion: 'Curse of the Allflame',
    lastKnownBuild: 'Hexblast Mines Occultist',
    nudgedForCurrentLeague: false
  }
];


export const INITIAL_LEAGUE_ROSTER: LeagueRosterMember[] = [
  {
    id: 'member-leuie',
    displayName: 'Leuie',
    preferredContact: 'app',
    slotNumber: 1,
    leagueMode: 'Private',
    poeAccountName: 'Leuie#0001',
    discordName: '@leuie',
    characterName: 'Leuie_Umbra',
    className: 'Witch',
    ascendancy: 'Elementalist',
    availableAtLaunch: 'Yes',
    level: 1,
    buildName: 'Undecided 3.30 Starter',
    pobUrl: 'https://pobb.in/',
    atlasContent: ['Betrayal', 'Essences', 'Expedition'],
    notes: 'League Host & Admin. Welcome to NOIR 3.30 Coven of Umbra!',
    inviteStatus: 'Accepted',
    isSupporterHeart: true,
    isOnline: true
  }
];

export function makeWikiUrl(itemName: string): string {
  const clean = itemName
    .replace(/\s*\(.*?\)/g, '')
    .replace(/G-G-B-B-B-R|6 Link.*|2x\s*/gi, '')
    .trim();
  return `https://www.poewiki.net/wiki/${encodeURIComponent(clean.replace(/\s+/g, '_'))}`;
}

export function makeDbUrl(itemName: string): string {
  const clean = itemName
    .replace(/\s*\(.*?\)/g, '')
    .replace(/G-G-B-B-B-R|6 Link.*|2x\s*/gi, '')
    .trim();
  return `https://poedb.tw/us/search?q=${encodeURIComponent(clean)}`;
}

// Pre populated from Sheet 2 (Items) of the NOIR Google Spreadsheet
export const INITIAL_LOOKING_FOR_ITEMS: LookingForItem[] = [];

export const INITIAL_FOUND_VAULT_ITEMS: FoundUniqueVaultItem[] = [];

export const INITIAL_COMMUNITY_GUIDES: CommunityGuide[] = [
  {
    id: 'guide-1',
    title: 'Penance Brand Ignite Elementalist (4 Golems + Triple Herald Autobomber)',
    authorName: 'Leuie_UmbraIgnite',
    authorDiscord: '@leuie',
    className: 'Witch',
    ascendancy: 'Elementalist',
    playstyle: 'Ignite Autobomber & Boss Nuker',
    starterRating: 10,
    pobCodeOrUrl: 'https://pobb.in/',
    levelingNotes: 'Start Rolling Magma + Holy Flame Totem into Firestorm / Armageddon Brand at Act 3 Library. Ascend Shaper of Flames first so all hits guarantee Ignite, then Liege of the Primordial + Elemancer for 4 auto reviving Golems (Flame, Stone, Chaos, Lightning).',
    endgameNotes: 'Socket Penance Brand into a 4 socket Elder Helmet crafted with Essence of Horror (30% More Elemental Damage + Level 20 Burning Damage = Effective 6 Link). Combine Searing Exarch glove ignite spread implicit with a Crusader physical explode chest and Triple Herald clusters (Heraldry + Endbringer) for full screen chain reactions. Scale towards Lost Unity ring and Life/ES on Block recovery.',
    requiredUniques: ['Essence of Horror', 'Lost Unity', 'Aegis Aurora / Shaper Recovery Shield'],
    atlasFocus: ['Essences', 'Searing Exarch', 'Betrayal', 'Harvest'],
    upvotes: 28,
    createdAt: 'Pinned League Starter'
  },
  {
    id: 'guide-2',
    title: 'Holy Relic of Conviction Necromancer (Lancing Steel Trigger)',
    authorName: 'Czeliosss',
    authorDiscord: '@czelio',
    className: 'Witch',
    ascendancy: 'Necromancer',
    playstyle: 'Minion Trigger / All Content Tank',
    starterRating: 9.5,
    pobCodeOrUrl: 'https://pobb.in/',
    levelingNotes: 'Level smoothly with Absolution and SRS through Acts 1 to 10. Farm Merciless Lab Divine Font for Summon Holy Relic of Conviction and Lancing Steel of Spraying.',
    endgameNotes: 'Scale Holy Relic cooldown recovery breakpoints (52% and 82% quality via Dialla Malefaction, Ashes of the Stars, or Enhance Support). Pair with Geofri Crest early and transition into Fourth Vow + Glorious Vanity (Xibaqua) for near immortality in T16 and T17 maps.',
    requiredUniques: ["Geofri's Crest", "Dialla's Malefaction", 'The Fourth Vow', 'Glorious Vanity'],
    atlasFocus: ['Labyrinth', 'Legion', 'Delirium', 'Heist'],
    upvotes: 19,
    createdAt: 'Verified NOIR Starter'
  },
  {
    id: 'guide-3',
    title: 'Archmage Ice Nova of Frostbolts Hierophant',
    authorName: 'Z3R0',
    authorDiscord: '@z3r0',
    className: 'Templar',
    ascendancy: 'Hierophant',
    playstyle: 'Mana Stacker / Self Cast or Kitava Trigger',
    starterRating: 9.5,
    pobCodeOrUrl: 'https://pobb.in/',
    levelingNotes: 'Level with Rolling Magma into Firestorm, then swap to Archmage Ball Lightning or Ice Nova of Frostbolts after Cruel Labyrinth (Sanctuary of Thought).',
    endgameNotes: 'Once a squad mate drops Kitava Thirst (Zealot Helmet), socket Frostbolt + Greater Multiple Projectiles in the helmet so casting Ice Nova automatically triggers Frostbolts across the screen. Scale 8,000+ Mana with Rog crafted rares and Mind Over Matter + Spell Suppression.',
    requiredUniques: ["Kitava's Thirst", 'Atziri Foible'],
    atlasFocus: ['Expedition (Rog)', 'Harvest', 'Sanctum'],
    upvotes: 16,
    createdAt: 'Verified NOIR Starter'
  }
];

// Sheet 11: Immortal Syndicate (Betrayal) Cheat Sheet
export const SYNDICATE_CHEAT_SHEET: SyndicateMemberReward[] = [
  {
    member: 'Aisling',
    transportation: 'Veiled Weapons & Jewellery',
    fortification: 'Veiled Armour & Jewellery',
    research: 'Veiled Chaos Orbs / Add Veiled Mod (Rank 4)',
    intervention: 'Metamorph / Ultimatum Scarabs',
    topPriorityDivision: 'Research',
    priorityNote: ' S Tier Crafting: Rank 4 Research adds a veiled modifier to your crafted rare item!'
  },
  {
    member: 'Vorici',
    transportation: 'Quality Skill Gems (21% to 23%)',
    fortification: 'Socket Modifying Currency',
    research: 'Reforge Sockets to White (1 to 6 White Sockets)',
    intervention: 'Shaper Scarabs',
    topPriorityDivision: 'Research',
    priorityNote: 'S Tier Utility: Easy off color solving with 1 to 6 White Sockets!'
  },
  {
    member: 'Gravicius',
    transportation: 'Full Stack of Random Divination Cards',
    fortification: 'Random Divination Cards',
    research: 'Swap Divination Cards',
    intervention: 'Divination Scarabs',
    topPriorityDivision: 'Transportation',
    priorityNote: 'S Tier Jackpot: Full stacks of rare Divination Cards in Transportation!'
  },
  {
    member: 'Hillock',
    transportation: 'Weapon Quality (up to 30%)',
    fortification: 'Armour Quality (up to 30%)',
    research: 'Flask Quality (up to 28%)',
    intervention: 'Abyss Scarabs',
    topPriorityDivision: 'Fortification',
    priorityNote: 'High Value: 30% quality on 6 link bases or 28% utility flasks in Research.'
  },
  {
    member: 'Rin',
    transportation: 'Normal Maps (Atlas Completion)',
    fortification: 'Rare Maps',
    research: 'Unique Maps (Pinnacle Completion)',
    intervention: 'Cartography Scarabs',
    topPriorityDivision: 'Research',
    priorityNote: 'Great in SSF/GSF for unlocking missing Unique Maps in Research & Cartography Scarabs.'
  },
  {
    member: 'Korell',
    transportation: 'Essences',
    fortification: 'Map Fragments',
    research: 'Delve Fossils',
    intervention: 'Elder Scarabs',
    topPriorityDivision: 'Research',
    priorityNote: 'Drops bulk Fossils in Research and Essences in Transportation.'
  },
  {
    member: 'Riker',
    transportation: 'Timed Pick One Currency',
    fortification: 'Timed Pick One Unique Item',
    research: 'Timed Pick One League Item',
    intervention: 'Blight Scarabs',
    topPriorityDivision: 'Transportation',
    priorityNote: 'Pick One Currency trial in Transportation or Unique trial in Fortification.'
  },
  {
    member: 'Elreon',
    transportation: 'Unique Weapons',
    fortification: 'Unique Armour',
    research: 'Unique Jewellery',
    intervention: 'Reliquary Scarabs',
    topPriorityDivision: 'Intervention',
    priorityNote: 'Reliquary Scarabs in Intervention + Unique Jewellery in Research for Anathema/Astramentis.'
  },
  {
    member: 'Cameria',
    transportation: 'Timeworn League Specific Uniques',
    fortification: 'Harbinger Orbs',
    research: 'Orbs of Unmaking',
    intervention: 'Sulphite Scarabs',
    topPriorityDivision: 'Fortification',
    priorityNote: 'Harbinger Orbs for Beachhead / Map tier pushing and Orbs of Unmaking in Research.'
  },
  {
    member: 'It That Fled',
    transportation: 'Breach Splinters',
    fortification: 'Breach Enchanted Maps',
    research: 'Upgrade Breachstones (Chayula / Uul Netol)',
    intervention: 'Breach Scarabs',
    topPriorityDivision: 'Research',
    priorityNote: 'Upgrades Breachstones and supplies Breach Scarabs.'
  },
  {
    member: 'Tora',
    transportation: 'Timed Pick One Item',
    fortification: 'Enchanted Gloves / Boots / Helmet',
    research: 'Add 20M to 200M XP to a Gem (Enlighten/Empower)',
    intervention: 'Harbinger Scarabs',
    topPriorityDivision: 'Research',
    priorityNote: 'S Tier for leveling Empower, Enhance, and Enlighten gems by 200M XP in Research!'
  },
  {
    member: 'Janus',
    transportation: 'Quality Currency',
    fortification: 'Currency Shards (Annul/Exalt/Mirror)',
    research: 'Expedition Artifacts & Logbooks / Cadiro Coins',
    intervention: 'Expedition Scarabs',
    topPriorityDivision: 'Intervention',
    priorityNote: 'Expedition Scarabs in Intervention for Rog/Tujen farming.'
  },
  {
    member: 'Jorgin',
    transportation: 'Talismans',
    fortification: 'Bestiary Aspect Items',
    research: 'Transform Amulet into Talisman',
    intervention: 'Bestiary Scarabs',
    topPriorityDivision: 'Intervention',
    priorityNote: 'Bestiary Scarabs for imprint/split beasts.'
  },
  {
    member: 'Leo',
    transportation: 'Metamorph Catalysts',
    fortification: 'Currency Chests',
    research: 'Reforge Sockets/Links/Colors 50 Times',
    intervention: 'Torment Scarabs',
    topPriorityDivision: 'Transportation',
    priorityNote: 'Catalysts in Transportation for attribute/resistance jewellery.'
  }
];

// Sheet 10: Heist Rogue & Gear Cheat Sheet
export const HEIST_CHEAT_SHEET: HeistRogueInfo[] = [
  {
    rogue: 'Gianna',
    jobs: [
      { job: 'Deception', maxLevel: 5, rewardTypes: ['Divination Cards', 'Harbinger', 'Armour'] },
      { job: 'Thaumaturgy', maxLevel: 3, rewardTypes: ['Currency', 'Jewellery', 'Skill Gems'] },
      { job: 'Perception', maxLevel: 2, rewardTypes: ['Divination Cards', 'Jewellery'] }
    ],
    passiveEffect: 'up to 35% Reduced Cost of Blueprint Reveals (Whakano)',
    damageType: 'Spell',
    bestGearNote: 'Equip +1 to All Jobs Tool & 15% Additional Reveal Brooch. Run every Deception contract with Gianna for cheap Blueprint reveals!'
  },
  {
    rogue: 'Karst',
    jobs: [
      { job: 'Lockpicking', maxLevel: 5, rewardTypes: ['Currency', 'Fragments', 'Jewellery'] },
      { job: 'Perception', maxLevel: 3, rewardTypes: ['Divination Cards', 'Jewellery'] },
      { job: 'Agility', maxLevel: 2, rewardTypes: ['Currency', 'Harbinger', 'Fossils', 'Essences'] }
    ],
    passiveEffect: 'up to 35% Reduced Alert Level from Reward Room Chests',
    damageType: 'Projectile',
    bestGearNote: 'Equip 15% Duplicate Currency Brooch (iLvl 84) and 12% Reduced Alert Cloak (iLvl 83).'
  },
  {
    rogue: 'Vinderi',
    jobs: [
      { job: 'Demolition', maxLevel: 5, rewardTypes: ['Delirium Cluster Jewels', 'Metamorph Catalysts', 'Blight Oils', 'Generic'] },
      { job: 'Trap Disarm', maxLevel: 5, rewardTypes: ['Legion', 'Abyss', 'Breach', 'Talismans'] },
      { job: 'Engineering', maxLevel: 2, rewardTypes: ['Maps', 'Uniques', 'Essences'] }
    ],
    passiveEffect: 'up to 16% Chance to Duplicate All Chest Contents (26% Increased Alert)',
    damageType: 'Melee',
    bestGearNote: 'S Tier Rogue! Duplicates Delirium Cluster Jewels, Blight Oils, and Grand Heist curio rewards.'
  },
  {
    rogue: 'Tullina',
    jobs: [
      { job: 'Agility', maxLevel: 5, rewardTypes: ['Currency', 'Harbinger', 'Fossils', 'Essences'] },
      { job: 'Lockpicking', maxLevel: 3, rewardTypes: ['Currency', 'Fragments', 'Jewellery'] },
      { job: 'Trap Disarm', maxLevel: 2, rewardTypes: ['Legion', 'Abyss', 'Breach'] }
    ],
    passiveEffect: '12% Reduced Alert Level & 22% Chance for Extra Heist Target Value',
    damageType: 'Melee',
    bestGearNote: 'Best Agility runner for raw Currency and Harbinger chests.'
  },
  {
    rogue: 'Nenet',
    jobs: [
      { job: 'Perception', maxLevel: 5, rewardTypes: ['Divination Cards', 'Jewellery'] },
      { job: 'Thaumaturgy', maxLevel: 4, rewardTypes: ['Currency', 'Jewellery', 'Skill Gems'] }
    ],
    passiveEffect: 'up to 20% Reduced Alert Level & highlights nearby patrols/traps',
    damageType: 'Projectile',
    bestGearNote: 'Safest Perception runner for stacked decks and divination chests.'
  },
  {
    rogue: 'Niles',
    jobs: [
      { job: 'Thaumaturgy', maxLevel: 5, rewardTypes: ['Currency', 'Jewellery', 'Skill Gems'] },
      { job: 'Deception', maxLevel: 4, rewardTypes: ['Divination Cards', 'Harbinger', 'Armour'] }
    ],
    passiveEffect: '10% Reduced Reveal Cost (Wakano) & Unlocks 1 Extra Chest After Lockdown',
    damageType: 'Spell',
    bestGearNote: 'Backup Deception reveal farmer and level 5 Thaumaturgy runner.'
  },
  {
    rogue: 'Isla',
    jobs: [
      { job: 'Engineering', maxLevel: 5, rewardTypes: ['Maps', 'Uniques', 'Essences'] },
      { job: 'Trap Disarm', maxLevel: 4, rewardTypes: ['Legion', 'Abyss', 'Breach'] }
    ],
    passiveEffect: 'up to 50% Increased Time Before Lockdown',
    damageType: 'Spell',
    bestGearNote: 'Gives massive extra seconds during Grand Heist countdowns to open Unique and Essence chests.'
  },
  {
    rogue: 'Tibbs',
    jobs: [
      { job: 'Brute Force', maxLevel: 5, rewardTypes: ['Fossils', 'Uniques', 'Weapons'] },
      { job: 'Demolition', maxLevel: 4, rewardTypes: ['Delirium', 'Blight', 'Catalysts'] }
    ],
    passiveEffect: 'Unlocks 1 to 2 Additional Large Chests After Lockdown',
    damageType: 'Melee',
    bestGearNote: 'Great for Brute Force Unique chests and extra chests after lockdown triggers.'
  },
  {
    rogue: 'Huck',
    jobs: [
      { job: 'Lockpicking', maxLevel: 3, rewardTypes: ['Currency', 'Fragments'] },
      { job: 'Demolition', maxLevel: 3, rewardTypes: ['Delirium', 'Blight'] },
      { job: 'Engineering', maxLevel: 3, rewardTypes: ['Uniques', 'Essences'] },
      { job: 'Brute Force', maxLevel: 3, rewardTypes: ['Fossils', 'Uniques'] }
    ],
    passiveEffect: '20% Increased Player Experience Gain & Powerful Combat Buffs to Allies',
    damageType: 'Melee',
    bestGearNote: 'Roll Level 15 Haste Aura on his weapon! Also buffs player in maps via Atlas passives.'
  }
];

// Sheet 12: Delve Fossil Biome Cheat Sheet
export const DELVE_FOSSIL_CHEAT_SHEET: DelveFossilInfo[] = [
  { fossil: 'Dense Fossil', effect: 'More Defence (Armour, Evasion, Energy Shield) modifiers • No Life modifiers', biomes: ['Fungal Caverns'], tier: 'S' },
  { fossil: 'Pristine Fossil', effect: 'More Life modifiers • No Defence modifiers', biomes: ['Magma Fissure', 'Frozen Hollow', 'The Mines'], tier: 'S' },
  { fossil: 'Deft Fossil', effect: 'More Critical modifiers • No Attribute modifiers', biomes: ['Magma Fissure'], tier: 'A' },
  { fossil: 'Fundamental Fossil', effect: 'More Attribute modifiers • No Critical modifiers', biomes: ['Magma Fissure', 'Sulphur Vents'], tier: 'A' },
  { fossil: 'Corroded Fossil', effect: 'More Physical or Chaos Ailment modifiers • No Elemental modifiers (+Gem level combos)', biomes: ['Fungal Caverns', 'Petrified Forest'], tier: 'S' },
  { fossil: 'Faceted Fossil', effect: 'More Socketed Gem Level modifiers (+1 Str/Dex/Int Gems)', biomes: ['Magma Fissure (Special Node)'], tier: 'S' },
  { fossil: 'Glyphic Fossil', effect: 'Adds a Corrupted Essence modifier (e.g. Essence of Horror/Delirium)', biomes: ['Frozen Hollow (Special Node)'], tier: 'S' },
  { fossil: 'Sanctified Fossil', effect: 'Numeric modifier values are Lucky • High tier rolls are more common', biomes: ['Petrified Forest', 'Frozen Hollow'], tier: 'S' },
  { fossil: 'Bound Fossil', effect: 'More Minion, Aura, or Curse modifiers', biomes: ['Petrified Forest', 'Abyssal Depths'], tier: 'S' },
  { fossil: 'Jagged Fossil', effect: 'More Physical modifiers • No Chaos modifiers', biomes: ['Petrified Forest'], tier: 'A' },
  { fossil: 'Metallic Fossil', effect: 'More Lightning modifiers • No Physical modifiers', biomes: ['Sulphur Vents', 'The Mines'], tier: 'A' },
  { fossil: 'Scorched Fossil', effect: 'More Fire modifiers • No Cold modifiers', biomes: ['Magma Fissure'], tier: 'A' },
  { fossil: 'Frigid Fossil', effect: 'More Cold modifiers • No Fire modifiers', biomes: ['Frozen Hollow'], tier: 'A' },
  { fossil: 'Aberrant Fossil', effect: 'More Chaos modifiers • No Lightning modifiers', biomes: ['Fungal Caverns', 'Abyssal Depths'], tier: 'A' },
  { fossil: 'Prismatic Fossil', effect: 'More Elemental modifiers • No Poison or Bleed modifiers', biomes: ['Magma Fissure', 'Frozen Hollow'], tier: 'A' },
  { fossil: 'Aetheric Fossil', effect: 'More Caster modifiers • Fewer Attack modifiers', biomes: ['Sulphur Vents', 'The Mines'], tier: 'A' },
  { fossil: 'Serrated Fossil', effect: 'More Attack modifiers • Fewer Caster modifiers', biomes: ['Sulphur Vents', 'The Mines'], tier: 'A' },
  { fossil: 'Shuddering Fossil', effect: 'More Speed modifiers • No Mana modifiers', biomes: ['Frozen Hollow'], tier: 'A' },
  { fossil: 'Hollow Fossil', effect: 'Has an Abyssal Socket', biomes: ['Abyssal Depths (Special Node)'], tier: 'S' }
];

// Sheet 13: Incursion (Alva Temple) Room Cheat Sheet
export const INCURSION_CHEAT_SHEET: IncursionRoomInfo[] = [
  {
    tier1: 'Corruption Chamber',
    tier2: 'Catalyst of Corruption',
    tier3: 'Locus of Corruption (Tier 3 ★)',
    effect: 'Altar of Corruption: Double Corrupt any Equipment Item (25% two implicits, 25% all white sockets, 25% brick to rare, 25% poof).',
    isHighValue: true
  },
  {
    tier1: "Gemcutter's Workshop",
    tier2: 'Department of Thaumaturgy',
    tier3: "Doryani's Institute (Tier 3 ★)",
    effect: 'Lapidary Lens: Double Corrupt any Skill Gem (can hit Level 21 / 23% Quality or Vaal 21/20!).',
    isHighValue: true
  },
  {
    tier1: 'Sacrificial Chamber',
    tier2: 'Hall of Offerings',
    tier3: 'Apex of Ascension (Tier 3 ★)',
    effect: 'Altar of Sacrifice: Reroll any Unique into another Unique of the same item class (can hit Headhunter/Mageblood) or upgrade Temple Uniques with Vials.',
    isHighValue: true
  },
  {
    tier1: 'Shrine of Empowerment',
    tier2: 'Sanctum of Unity',
    tier3: 'Temple Nexus (Tier 3 ★)',
    effect: 'Upgrades the Tier of all directly connected rooms by +1 and grants +1 Item Level to Temple drops.',
    isHighValue: true
  },
  {
    tier1: 'Vault',
    tier2: 'Treasury',
    tier3: 'Wealth of the Vaal (Tier 3 ★)',
    effect: 'Contains numerous Vaal Currency Chests (Divine, Exalted, Vaal Orbs).',
    isHighValue: true
  },
  {
    tier1: "Surveyor's Study",
    tier2: 'Office of Cartography',
    tier3: 'Atlas of Worlds (Tier 3)',
    effect: 'Contains 3 Map Chests for early red map sustain.',
    isHighValue: false
  },
  {
    tier1: 'Poison Garden',
    tier2: 'Cultivar Chamber',
    tier3: 'Toxic Grove (Tier 3)',
    effect: 'Drops Apep Slumber or Rare Items with Tacati Chaos/Poison Temple Modifiers.',
    isHighValue: false
  },
  {
    tier1: 'Trap Workshop',
    tier2: 'Temple Defense Workshop',
    tier3: 'Defense Research Lab (Tier 3 ★)',
    effect: 'Drops Architect Hand (Slavedriver Hand with Vial) or Matatl Trap/Cast Speed Temple Modifiers.',
    isHighValue: true
  },
  {
    tier1: 'Omnitect Forge',
    tier2: 'Golem Works',
    tier3: 'Crucible of Flame (Tier 3 ★)',
    effect: 'Drops Story of the Vaal or Puhuarte Gloves (% Fire Res + % Increased Damage against Chilled Enemies for temple conversion).',
    isHighValue: true
  }
];

// Sheet 8: Atlas Map Ratings & Sustain Progression
export const ATLAS_MAP_RATINGS: AtlasMapRating[] = [
  { mapName: 'Cemetery', naturalTier: 4, layoutScore: 5.0, mobDensityScore: 3.0, divCardScore: 5.0, bossScore: 2.0, totalScore: 4.4, notableCards: "Brother's Gift (5x Divine), Brother's Stash" },
  { mapName: 'Crimson Temple', naturalTier: 12, layoutScore: 4.0, mobDensityScore: 4.0, divCardScore: 5.0, bossScore: 5.0, totalScore: 4.4, notableCards: 'The Apothecary (Mageblood), Seven Years Bad Luck' },
  { mapName: 'Burial Chambers', naturalTier: 7, layoutScore: 4.0, mobDensityScore: 4.0, divCardScore: 5.0, bossScore: 3.0, totalScore: 4.2, notableCards: 'The Doctor (Headhunter), The Fortunate' },
  { mapName: 'Beach', naturalTier: 2, layoutScore: 5.0, mobDensityScore: 4.0, divCardScore: 2.0, bossScore: 5.0, totalScore: 3.95, notableCards: 'S Tier Linear Layout for Altar & Expedition Farming' },
  { mapName: 'Strand', naturalTier: 6, layoutScore: 5.0, mobDensityScore: 3.5, divCardScore: 3.0, bossScore: 5.0, totalScore: 4.15, notableCards: 'I See Brothers, Linear Delirium Mirror Layout' },
  { mapName: 'Jungle Valley', naturalTier: 9, layoutScore: 5.0, mobDensityScore: 4.5, divCardScore: 3.5, bossScore: 5.0, totalScore: 4.5, notableCards: 'The Fortunate • Boss does not spawn until room entry (100% Minion Eldritch Altars!)' },
  { mapName: 'Dunes', naturalTier: 5, layoutScore: 5.0, mobDensityScore: 4.5, divCardScore: 3.0, bossScore: 4.5, totalScore: 4.35, notableCards: 'The Fortunate • Best Open Layout for Legion & Breach' },
  { mapName: 'Mesa', naturalTier: 10, layoutScore: 5.0, mobDensityScore: 3.5, divCardScore: 3.0, bossScore: 5.0, totalScore: 4.25, notableCards: 'The Fortunate • 5 Second Boss Rush for Maven Invitations & Essences' },
  { mapName: 'City Square', naturalTier: 8, layoutScore: 4.5, mobDensityScore: 4.0, divCardScore: 3.0, bossScore: 5.0, totalScore: 4.1, notableCards: '3 Bosses in Center for Triple Boss Drops & Destructive Play' },
  { mapName: 'Toxic Sewer', naturalTier: 11, layoutScore: 5.0, mobDensityScore: 5.0, divCardScore: 3.0, bossScore: 4.0, totalScore: 4.3, notableCards: 'Tight Corridor Layout: Insane for Ignite Proliferation, Blight, and Explode Chests' }
];

// Sheet 5 & 6: Crafting Bench Unlocks & Stash Tab Buyer's Guide
export const CRAFTING_BENCH_UNLOCKS = [
  { craft: 'All Elemental Resistances', location: 'Normal Labyrinth (Act 3)', tip: 'Essential for fixing resistances right before Act 5 Kitava.' },
  { craft: 'Double Elemental Resistances (Fire+Cold, etc.)', location: 'Lower Prison Lab Trial (Act 6), Cruel Lab, Merciless Lab', tip: 'Best suffix efficiency throughout Yellow and Red maps.' },
  { craft: 'Single Elemental Resistance', location: 'Default (Tier 1) • Belly of the Beast 2 (Act 4) • Doedre Cesspool (Act 8)', tip: 'Costs 1 Orb of Transmutation during the campaign.' },
  { craft: 'Maximum Life', location: 'Default (Tier 1) • The Beacon (Act 6) • The Feeding Trough (Act 10)', tip: 'Aim for 300 to 400 Life per Act (3,000+ Life by Act 10).' },
  { craft: 'Movement Speed', location: 'The Caverns (Act 2) • Chamber of Innocence (Act 5) • Karui Shores (Epilogue)', tip: 'Craft on boots immediately in Act 2 and Act 5.' },
  { craft: 'Single Attributes (Str / Dex / Int)', location: 'Default (Tier 1) • The Western Forest Alira Camp (Act 6)', tip: 'Fixes off class gem attribute requirements.' },
  { craft: 'Trigger a Socketed Spell when you Use a Skill', location: 'Betrayal Unveiling (Weapons)', tip: 'Automates Bone Offering, Desecrate, or Curses on cast.' },
  { craft: 'Cannot Roll Attack / Caster Modifiers', location: 'Putrid Cloister / Coward Trial / Catarina Unveils', tip: 'Deterministic metamod for +2 Gem Level weapons and amulets.' }
];

export const STASH_TAB_BUYER_TIERS = [
  {
    tier: '$20 Budget Setup (First Blood Starter Pack • 200 Points)',
    cost: '190 Points (on Stash Tab Sale every 3 weeks)',
    tabs: [
      'Currency Stash Tab (60 pts) — Stores 5,000x of every currency with central crafting slot & 14 flex slots',
      'Map Stash Tab (120 pts) — Stores 72x of every map tier and tracks Atlas completion',
      'Upgrade 1 Tab to Premium (10 pts) — Custom color/label and public listing capability'
    ]
  },
  {
    tier: '$40 Mapping QOL Setup (395 Points on Sale)',
    cost: '395 Points (5 Points Leftover)',
    tabs: [
      'Currency Stash Tab (60 pts)',
      'Map Stash Tab (120 pts)',
      'Premium Quad Stash Tab (120 pts) — Rapid mapping dump tab',
      'Fragment Stash Tab (55 pts) — Stores all Scarabs, Boss Fragments, and Breachstones',
      'Divination Stash Tab (40 pts) — Tracks full card stacks and filters owned cards'
    ]
  },
  {
    tier: '$50 SSF & GSF Master Crafter Setup (435 Points on Sale)',
    cost: '435 Points (65 Flex Points)',
    tabs: [
      'All tabs from the $40 Setup',
      'Essence Stash Tab (30 pts) — One click 3 to 1 Essence tier upgrading',
      'Unique Collection Tab (110 pts optional in SSF) — Stores 1 copy of every Unique in Path of Exile!'
    ]
  }
];

export const INITIAL_WISHLIST_ITEMS: WishlistItem[] = [
  {
    id: 'wish-1',
    requesterName: 'QueueRay',
    itemName: 'Defiance of Destiny (Paua Amulet)',
    itemType: 'Unique',
    priority: 'Critical',
    notes: 'Top priority survivability amulet for T17 maps.',
    isFulfilled: false,
    poeWikiUrl: 'https://www.poewiki.net/wiki/Defiance_of_Destiny',
    poeDbUrl: 'https://poedb.tw/us/Defiance_of_Destiny'
  },
  {
    id: 'wish-2',
    requesterName: 'Leuie_UmbraIgnite',
    itemName: 'Lost Unity (Ring)',
    itemType: 'Unique',
    priority: 'Critical',
    notes: 'Chase unique for Penance Brand Ignite 4 Golem & Triple Herald Autobomber.',
    isFulfilled: false,
    poeWikiUrl: 'https://www.poewiki.net/wiki/Ring',
    poeDbUrl: 'https://poedb.tw/us/Ring'
  },
  {
    id: 'wish-3',
    requesterName: 'Czeliosss',
    itemName: "Dialla's Malefaction (Sage's Robe)",
    itemType: 'Unique',
    priority: 'Critical',
    notes: 'Needed for Holy Relic of Conviction gem quality breakpoints.',
    isFulfilled: false,
    poeWikiUrl: 'https://www.poewiki.net/wiki/Dialla%27s_Malefaction',
    poeDbUrl: 'https://poedb.tw/us/Diallas_Malefaction'
  },
  {
    id: 'wish-4',
    requesterName: 'Bonexollector',
    itemName: 'The Jinxed Juju (Citrine Amulet)',
    itemType: 'Unique',
    priority: 'High',
    notes: 'Matched in Guild Tab 1 by Blinknilla!',
    isFulfilled: true,
    fulfilledBy: 'Blinknilla (Guild Tab 1)',
    poeWikiUrl: 'https://www.poewiki.net/wiki/The_Jinxed_Juju',
    poeDbUrl: 'https://poedb.tw/us/The_Jinxed_Juju'
  }
];

export const INITIAL_SPECIALIZATION_ROSTER: SpecializationMember[] = [
  {
    playerName: 'Leuie (League Host & Crafter)',
    role: 'Essence of Horror & Syndicate Master',
    assignedMechanics: ['Betrayal (Jun)', 'Essences', 'Searing Exarch'],
    currentGoal: 'Farming Essence of Horror helmets, Veiled Chaos crafts, and team bench unveils.',
    atlasTreeFocus: 'Betrayal + Essence Duplication + Searing Exarch Pack Size'
  },
  {
    playerName: 'QueueRay (Lab & Delve Specialist)',
    role: 'Transfigured Gems & Enlighten Farmer',
    assignedMechanics: ['Uber Labyrinth', 'Delve', 'Maven'],
    currentGoal: 'Running Divine Font for team Transfigured Gems (39+ Labs) and deep Delve fossils.',
    atlasTreeFocus: 'Shrines + Nico Sulphite + Destructive Play'
  },
  {
    playerName: 'Czeliosss (Heist & Temple Architect)',
    role: 'Replica Uniques & Double Corruptions',
    assignedMechanics: ['Grand Heists', 'Incursion (Alva)', 'Eater of Worlds'],
    currentGoal: 'Farming Replica Dragonfang Flight, Replica Farrul Fur, and Locus of Corruption temples.',
    atlasTreeFocus: 'Smuggler Caches + Alva Flesh Merchant + Eater Altars'
  },
  {
    playerName: 'Z3R0 (Harvest & Sanctum Banker)',
    role: 'Lifeforce & Divines Specialist',
    assignedMechanics: ['Harvest (Grove)', 'Forbidden Sanctum', 'Expedition'],
    currentGoal: 'Supplying Yellow Lifeforce for resistance swaps and Rog high iLvl mana gear.',
    atlasTreeFocus: 'Crop Rotation + Expedition Logbook Quantity'
  }
];


import type { SiteFeedbackItem } from '../types';

export const INITIAL_SITE_FEEDBACK: SiteFeedbackItem[] = [
  {
    id: 'fb-1',
    title: 'Who Needs This Item reverse drop matcher for PoE 2 GSF',
    description: 'Ensure the reverse drop lookup feature is available for Path of Exile 2 when our Return of the Ancients private league starts so exiles can match rare drops directly.',
    category: 'private_league_tool',
    status: 'implemented',
    upvotes: 42,
    authorDisplayName: 'QueueRay',
    authorPreferredContact: 'app',
    authorPoeAccount: 'QueueRay#4412',
    adminResponse: 'Implemented! Both PoE 1 (3.30 Coven of Umbra) and PoE 2 (0.5 Ancients) now have full drop matching parity with session isolation.',
    adminResponderName: 'Leuie',
    createdAt: '2026-11-01',
    gameContext: 'both'
  },
  {
    id: 'fb-2',
    title: 'Build Guide Ingestion tool with YouTube and PoB backlinks',
    description: 'We need an easy way to paste a pobb.in or YouTube guide link and have it automatically format with backlinks to the original creator, video embed, and leveling notes.',
    category: 'feature_request',
    status: 'implemented',
    upvotes: 36,
    authorDisplayName: 'Czelio',
    authorPreferredContact: 'discord',
    authorDiscord: '@czelio',
    adminResponse: 'Built and added! Users can now ingest PoB share codes, YouTube links, and Maxroll guides with verified creator attribution.',
    adminResponderName: 'Leuie',
    createdAt: '2026-11-01',
    gameContext: 'both'
  },
  {
    id: 'fb-3',
    title: 'Faustus currency and gold exchange calculator for guild trade',
    description: 'A quick tool to calculate gold costs per Faustus trade tier alongside our barter tabs so exiles know how much gold to save while mapping.',
    category: 'website_improvement',
    status: 'planned',
    upvotes: 28,
    authorDisplayName: 'Bonexollector',
    authorPreferredContact: 'poe_whisper',
    adminResponse: 'Under planning for the upcoming mapping tools update.',
    adminResponderName: 'Leuie',
    createdAt: '2026-10-30',
    gameContext: 'poe1'
  },
  {
    id: 'fb-4',
    title: 'Batch export alumni account tags for GGG invite ladder',
    description: 'Admins need a 1 click copy button that formats all alumni accounts into a comma separated list for Path of Exile private league invites.',
    category: 'private_league_tool',
    status: 'implemented',
    upvotes: 25,
    authorDisplayName: 'Leuie',
    authorPreferredContact: 'app',
    adminResponse: 'Available now in the Alumni & Outreach Hub with Copy All Account Tags and Copy 3.30 Announcement.',
    adminResponderName: 'Leuie',
    createdAt: '2026-10-28',
    gameContext: 'both'
  }
];
