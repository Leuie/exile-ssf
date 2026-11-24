export interface PlannedRoadmapItem {
  id: string;
  category:
    | 'Armory Cross Site Integrations'
    | 'Deeper Character & Build Tools'
    | 'Private League & GSF Social Features'
    | 'Next Level Client.txt & Farming Analytics'
    | 'Platform Growth & Polish';
  title: string;
  description: string;
  scope: 'PoE 1 & PoE 2' | 'PoE 1' | 'Platform';
}

export const PLANNED_ROADMAP_CATEGORIES: PlannedRoadmapItem['category'][] = [
  'Armory Cross Site Integrations',
  'Deeper Character & Build Tools',
  'Private League & GSF Social Features',
  'Next Level Client.txt & Farming Analytics',
  'Platform Growth & Polish'
];

export const PLANNED_ROADMAP_ITEMS: PlannedRoadmapItem[] = [
  // Armory Cross Site Integrations (Remaining)
  {
    id: 'rm-map-tracker-per-char',
    category: 'Armory Cross Site Integrations',
    title: 'Map Tracker Per Character Mapping Telemetry',
    description:
      'Link saved Map Tracker sessions to synced Armory character snapshots to compare clear speed, XP/hr, and deaths per character/build with a Gear Snapshot at Time of Run badge.',
    scope: 'PoE 1 & PoE 2'
  },
  {
    id: 'rm-crafting-gear-hole-detector',
    category: 'Armory Cross Site Integrations',
    title: 'Crafting Bench & Regex Studio Personalized Gear Hole Detector',
    description:
      'Analyze your synced Character\'s weakest gear slots (such as uncapped Chaos Res on rings or missing Spell Suppression on boots/gloves) and highlight the exact Crafting Bench, Harvest, and Essence crafts that fix your build right now.',
    scope: 'PoE 1 & PoE 2'
  },

  // A. Deeper Character & Build Tools
  {
    id: 'rm-passive-diff',
    category: 'Deeper Character & Build Tools',
    title: 'Interactive Passive Tree & Keystone Diff Viewer',
    description:
      'Render the character\'s allocated keystones, masteries, and cluster jewels from get-passive-skills right next to the Character section, and let squadmates compare two builds side by side.',
    scope: 'PoE 1 & PoE 2'
  },
  {
    id: 'rm-upgrade-advisor',
    category: 'Deeper Character & Build Tools',
    title: 'One Click Build Upgrade Advisor',
    description:
      'Cross reference your synced Character gear against poe.ninja SSF ladder trends for your ascendancy to flag weak slots (such as uncapped Chaos Res, missing Eldritch implicits, or low tier life rolls).',
    scope: 'PoE 1 & PoE 2'
  },
  {
    id: 'rm-gem-audit',
    category: 'Deeper Character & Build Tools',
    title: 'Gem Level & Quality Audit',
    description:
      'Automatically scan all socketed gems on your Character and list which gems are ready for the Gemcutter\'s Prism 20% quality recipe or Vaal corruption.',
    scope: 'PoE 1'
  },
  {
    id: 'rm-pob-export',
    category: 'Deeper Character & Build Tools',
    title: 'Live PoB XML Export from Character',
    description:
      'Generate a shareable Path of Building import string directly from a synced Character snapshot.',
    scope: 'PoE 1 & PoE 2'
  },

  // B. Private League & GSF Social Features
  {
    id: 'rm-craft-queue',
    category: 'Private League & GSF Social Features',
    title: 'Squad Craft & Fracture Queue',
    description:
      'A dedicated GSF tab where players request specific crafting services (Aisling/Veiled Orb, Betrayal benches, Harvest augments, Awakener Orbs) with material checklists and tips.',
    scope: 'PoE 1 & PoE 2'
  },
  {
    id: 'rm-squad-presence',
    category: 'Private League & GSF Social Features',
    title: 'Live Squad Presence Bar ("Who Is Mapping Right Now")',
    description:
      'Opt in live status ping from Map Tracker showing which squadmates are currently in T16s, Bosses, Heist, or Hideout.',
    scope: 'PoE 1 & PoE 2'
  },
  {
    id: 'rm-item-loans',
    category: 'Private League & GSF Social Features',
    title: 'GSF Item Loan & Return Tracker',
    description:
      'Track borrowed chase uniques (Mageblood, Headhunter, Defiance of Destiny) inside a private league with borrower tags and return dates so nothing gets lost.',
    scope: 'PoE 1 & PoE 2'
  },
  {
    id: 'rm-league-bingo',
    category: 'Private League & GSF Social Features',
    title: 'League Bingo & Race Challenges',
    description:
      'Customizable 5x5 Private League Bingo board (for example, "Drop a Divine before Maps", "Six Link a Chest", "Kill Maven Deathless") with automatic proof capture from Client.txt and live squad points.',
    scope: 'PoE 1 & PoE 2'
  },
  {
    id: 'rm-daily-digest',
    category: 'Private League & GSF Social Features',
    title: 'Automated Discord / Root Daily Digest',
    description:
      'Scheduled Cloudflare Cron Worker that posts a daily 8 PM league recap (top farmer of the day, wishes fulfilled, new League Firsts, biggest jackpot drops) straight to your league\'s Webhook.',
    scope: 'Platform'
  },

  // C. Next Level Client.txt & Farming Analytics
  {
    id: 'rm-net-profit',
    category: 'Next Level Client.txt & Farming Analytics',
    title: 'Map Cost vs Profit Net Calculator',
    description:
      'Subtract Scarab, Map Device craft, and Chisel costs per map from your Asset Tracker session delta to compute True Net Div/hr instead of gross loot.',
    scope: 'PoE 1 & PoE 2'
  },
  {
    id: 'rm-boss-rush',
    category: 'Next Level Client.txt & Farming Analytics',
    title: 'Live Boss Rush & Invitation Tracker',
    description:
      'Detect Maven 10 ways, Shaper/Elder Guardian maps, and Conqueror sets in Client.txt and track fragment drop rates and boss kill times.',
    scope: 'PoE 1'
  },
  {
    id: 'rm-speedrun-splits',
    category: 'Next Level Client.txt & Farming Analytics',
    title: 'Campaign Speedrun Split Comparator',
    description:
      'Compare your Act 1 through Act 10 Client.txt splits against your personal bests and squad records (gold splits vs behind pace, LiveSplit style).',
    scope: 'PoE 1 & PoE 2'
  },
  {
    id: 'rm-sanctum-heist-delve',
    category: 'Next Level Client.txt & Farming Analytics',
    title: 'Sanctum, Heist & Delve Deep Trackers',
    description:
      'Dedicated sub trackers inside Map Tracker that parse Blueprint wings, Sanctum rooms, and Delve depth progression from Client.txt.',
    scope: 'PoE 1 & PoE 2'
  },
  {
    id: 'rm-loot-filter-sync',
    category: 'Next Level Client.txt & Farming Analytics',
    title: 'Loot Filter Sound & Regex Sync',
    description:
      'Generate a custom Neversink/FilterBlade sound rule snippet or in game stash Regex automatically from your Private League\'s open Squad Wishlists so you never leave a squadmate\'s wanted base or unique on the ground.',
    scope: 'PoE 1 & PoE 2'
  },

  // D. Platform Growth & Polish
  {
    id: 'rm-og-cards',
    category: 'Platform Growth & Polish',
    title: 'Public Shareable Build & Wealth Cards (Open Graph Images)',
    description:
      'Auto generated preview cards when pasting an Exile Profile or Hall of Fame link into Discord or Root.',
    scope: 'Platform'
  },
  {
    id: 'rm-pwa-polish',
    category: 'Platform Growth & Polish',
    title: 'PWA Desktop App Mode Polish',
    description:
      'Offline ready Cheat Sheets, Vendor Recipes, and Regex Studio with keyboard shortcuts (Ctrl+K) for instant alt tab lookups while mapping.',
    scope: 'Platform'
  }
];
