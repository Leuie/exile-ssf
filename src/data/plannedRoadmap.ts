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
  status?: 'planned' | 'shipped';
  shippedNote?: string;
}

export const PLANNED_ROADMAP_CATEGORIES: PlannedRoadmapItem['category'][] = [
  'Armory Cross Site Integrations',
  'Deeper Character & Build Tools',
  'Private League & GSF Social Features',
  'Next Level Client.txt & Farming Analytics',
  'Platform Growth & Polish'
];

export const PLANNED_ROADMAP_ITEMS: PlannedRoadmapItem[] = [
  // Armory Cross Site Integrations
  {
    id: 'rm-map-tracker-per-char',
    category: 'Armory Cross Site Integrations',
    title: 'Map Tracker Per Character Mapping Telemetry',
    description:
      'Active Character context links Character Armory directly to Sidebar and Map Tracker, stamping saved mapping runs with your active character, level, ascendancy, and linked Atlas Skill Tree.',
    scope: 'PoE 1 & PoE 2',
    status: 'shipped',
    shippedNote: 'Shipped in v3.36.0'
  },
  {
    id: 'rm-crafting-gear-hole-detector',
    category: 'Armory Cross Site Integrations',
    title: 'Crafting Bench & Regex Studio Personalized Gear Hole Detector',
    description:
      'Automatically flags uncapped Elemental/Chaos Resistances, partial Spell Suppression, and empty flask slots inside Character Armory with direct links to Crafting Bench and Regex Studio.',
    scope: 'PoE 1 & PoE 2',
    status: 'shipped',
    shippedNote: 'Shipped in v3.36.0'
  },

  // A. Deeper Character & Build Tools
  {
    id: 'rm-official-passive-tree',
    category: 'Deeper Character & Build Tools',
    title: 'Interactive Official PoE Passive Skill Tree & Ascendancy Artwork',
    description:
      'Full interactive canvas powered by official GGG skilltree-export sprites, curved orbit arcs, Keystones, Masteries, Cluster Jewels, home quadrant Class Ascendancies, and Bloodline Ascendancy rows with zoom, pan, search, and fullscreen.',
    scope: 'PoE 1',
    status: 'shipped',
    shippedNote: 'Shipped & Exceeded in v3.35.0'
  },
  {
    id: 'rm-passive-diff',
    category: 'Deeper Character & Build Tools',
    title: 'Side by Side Character & Passive Tree Diff Viewer',
    description:
      'Compare two synced Armory characters side by side to highlight gear upgrades, keystone differences, and passive tree pathing deltas.',
    scope: 'PoE 1 & PoE 2',
    status: 'shipped',
    shippedNote: 'Shipped in v3.37.0'
  },
  {
    id: 'rm-upgrade-advisor',
    category: 'Deeper Character & Build Tools',
    title: 'Build Upgrade Advisor',
    description:
      'Cross reference your synced Character gear against poe.ninja SSF ladder trends for your ascendancy to flag weak slots (such as uncapped Chaos Res, missing Eldritch implicits, or low tier life rolls).',
    scope: 'PoE 1 & PoE 2',
    status: 'shipped',
    shippedNote: 'Shipped in v3.37.0'
  },
  {
    id: 'rm-gem-audit',
    category: 'Deeper Character & Build Tools',
    title: 'Gem Level & Quality Audit',
    description:
      'Automatically scan all socketed gems on your Character and list which gems are ready for the Gemcutter\'s Prism 20% quality recipe or Vaal corruption.',
    scope: 'PoE 1',
    status: 'shipped',
    shippedNote: 'Shipped in v3.37.0'
  },
  {
    id: 'rm-pob-export',
    category: 'Deeper Character & Build Tools',
    title: 'Live PoB XML Export from Character',
    description:
      'Generate a shareable Path of Building import string directly from a synced Character snapshot.',
    scope: 'PoE 1 & PoE 2',
    status: 'shipped',
    shippedNote: 'Shipped in v3.37.0'
  },

  // B. Private League & GSF Social Features
  {
    id: 'rm-craft-queue',
    category: 'Private League & GSF Social Features',
    title: 'Squad Craft & Fracture Queue',
    description:
      'A dedicated GSF tab where players request specific crafting services (Aisling/Veiled Orb, Betrayal benches, Harvest augments, Awakener Orbs) with material checklists and tips.',
    scope: 'PoE 1 & PoE 2',
    status: 'shipped',
    shippedNote: 'Shipped in v3.39.0'
  },
  {
    id: 'rm-squad-presence',
    category: 'Private League & GSF Social Features',
    title: 'Live Squad Presence Bar ("Who Is Mapping Right Now")',
    description:
      'Opt in live status ping from Map Tracker showing which squadmates are currently in T16s, Bosses, Heist, or Hideout.',
    scope: 'PoE 1 & PoE 2',
    status: 'shipped',
    shippedNote: 'Shipped in v3.39.0'
  },
  {
    id: 'rm-item-loans',
    category: 'Private League & GSF Social Features',
    title: 'GSF Item Loan & Return Tracker',
    description:
      'Track borrowed chase uniques (Mageblood, Headhunter, Defiance of Destiny) inside a private league with borrower tags and return dates so nothing gets lost.',
    scope: 'PoE 1 & PoE 2',
    status: 'shipped',
    shippedNote: 'Shipped in v3.39.0'
  },
  {
    id: 'rm-league-bingo',
    category: 'Private League & GSF Social Features',
    title: 'League Bingo & Race Challenges',
    description:
      'Customizable 5x5 Private League Bingo board (for example, "Drop a Divine before Maps", "Six Link a Chest", "Kill Maven Deathless") with automatic proof capture from Client.txt and live squad points.',
    scope: 'PoE 1 & PoE 2',
    status: 'shipped',
    shippedNote: 'Shipped in v3.39.0'
  },
  {
    id: 'rm-daily-digest',
    category: 'Private League & GSF Social Features',
    title: 'Automated Discord / Root Daily Digest',
    description:
      'Scheduled Cloudflare Cron Worker that posts a daily 8 PM league recap (top farmer of the day, wishes fulfilled, new League Firsts, biggest jackpot drops) straight to your league\'s Webhook.',
    scope: 'Platform',
    status: 'shipped',
    shippedNote: 'Shipped in v3.39.0'
  },

  // C. Next Level Client.txt & Farming Analytics
  {
    id: 'rm-atlas-planner',
    category: 'Next Level Client.txt & Farming Analytics',
    title: 'Interactive Atlas Skill Tree Planner & Show Stats Totalizer',
    description:
      'Official GGG Atlas Skill Tree canvas inside Map Tracker with 150 point cap (132 + 18 Maven), shortest path auto allocation, instant branch unallocation, live hover path previews, Show Stats modifier totalizer, and Cloud saved strategy presets.',
    scope: 'PoE 1',
    status: 'shipped',
    shippedNote: 'Shipped & Exceeded in v3.35.0'
  },
  {
    id: 'rm-net-profit',
    category: 'Next Level Client.txt & Farming Analytics',
    title: 'Map Cost vs Profit Net Calculator',
    description:
      'Subtract Scarab, Map Device craft, and Chisel costs per map from your Asset Tracker session delta to compute True Net Div/hr instead of gross loot.',
    scope: 'PoE 1 & PoE 2',
    status: 'shipped',
    shippedNote: 'Shipped in v3.38.0'
  },
  {
    id: 'rm-boss-rush',
    category: 'Next Level Client.txt & Farming Analytics',
    title: 'Live Boss Rush & Invitation Tracker',
    description:
      'Detect Maven 10 ways, Shaper/Elder Guardian maps, and Conqueror sets in Client.txt and track fragment drop rates and boss kill times.',
    scope: 'PoE 1',
    status: 'shipped',
    shippedNote: 'Shipped in v3.38.0'
  },
  {
    id: 'rm-speedrun-splits',
    category: 'Next Level Client.txt & Farming Analytics',
    title: 'Campaign Speedrun Split Comparator',
    description:
      'Compare your Act 1 through Act 10 Client.txt splits against your personal bests and squad records (gold splits vs behind pace, LiveSplit style).',
    scope: 'PoE 1 & PoE 2',
    status: 'shipped',
    shippedNote: 'Shipped in v3.38.0'
  },
  {
    id: 'rm-sanctum-heist-delve',
    category: 'Next Level Client.txt & Farming Analytics',
    title: 'Sanctum, Heist & Delve Deep Trackers',
    description:
      'Dedicated sub trackers inside Map Tracker that parse Blueprint wings, Sanctum rooms, and Delve depth progression from Client.txt.',
    scope: 'PoE 1 & PoE 2',
    status: 'shipped',
    shippedNote: 'Shipped in v3.38.0'
  },
  {
    id: 'rm-loot-filter-sync',
    category: 'Next Level Client.txt & Farming Analytics',
    title: 'Loot Filter Sound & Regex Sync',
    description:
      'Generate a custom Neversink/FilterBlade sound rule snippet or in game stash Regex automatically from your Private League\'s open Squad Wishlists so you never leave a squadmate\'s wanted base or unique on the ground.',
    scope: 'PoE 1 & PoE 2',
    status: 'shipped',
    shippedNote: 'Shipped in v3.38.0'
  },

  // D. Platform Growth & Polish
  {
    id: 'rm-unified-setup-grid',
    category: 'Platform Growth & Polish',
    title: 'Unified Tool Setup Wizard & Draggable Workspace Grids',
    description:
      'Single 3 step Tool Setup modal sharing POESESSID and Client.txt across all tools with a permanent one time disclaimer, plus collapsible drag and drop resizable workspace grids on Map Tracker and Asset Tracker.',
    scope: 'Platform',
    status: 'shipped',
    shippedNote: 'Shipped in v3.34.0 – v3.35.0'
  },
  {
    id: 'rm-og-cards',
    category: 'Platform Growth & Polish',
    title: 'Public Shareable Build & Wealth Cards (Open Graph Images)',
    description:
      'Auto generated preview cards when pasting an Exile Profile or Hall of Fame link into Discord or Root.',
    scope: 'Platform',
    status: 'shipped',
    shippedNote: 'Shipped in v3.40.0'
  },
  {
    id: 'rm-pwa-polish',
    category: 'Platform Growth & Polish',
    title: 'Offline PWA Desktop App Mode',
    description:
      'Installable desktop PWA with offline Service Worker caching for Cheat Sheets, Vendor Recipes, and Regex Studio (Ctrl+K Quick Finder already shipped).',
    scope: 'Platform',
    status: 'shipped',
    shippedNote: 'Shipped in v3.40.0 (Nov 25, 2026)'
  },
  {
    id: 'rm-mobile-touch-overhaul',
    category: 'Platform Growth & Polish',
    title: 'Full Mobile, Tablet & Touch Support',
    description:
      'Works smoothly on phones, tablets, and laptops with touch-friendly buttons, mobile bottom navigation, and pinch-to-zoom on both Passive and Atlas Skill Trees.',
    scope: 'Platform',
    status: 'shipped',
    shippedNote: 'Shipped in v3.43.0 (Nov 25, 2026)'
  },
  {
    id: 'rm-poe2-parity',
    category: 'Platform Growth & Polish',
    title: 'Path of Exile 2 Guides, Endgame Trackers & Clean Separation',
    description:
      'Added PoE 2 Endgame Atlas & Waystones tracker, Acts 1–3 + Cruel permanent bonus walkthrough, and Trials of Ascendancy guide, while keeping PoE 1 character and stash data strictly separated.',
    scope: 'PoE 1 & PoE 2',
    status: 'shipped',
    shippedNote: 'Shipped in v3.44.0 (Nov 25, 2026)'
  },
  {
    id: 'rm-daily-calendar-telemetry',
    category: 'Next Level Client.txt & Farming Analytics',
    title: 'Daily Mapping Calendar, Mechanic Spawn Counter, Death Log & /passives Audit',
    description:
      'See how many maps you ran each day on a clickable calendar, track league mechanic spawns and Nameless Seer alerts, inspect death causes, log trades, and auto-check Campaign zones from Client.txt.',
    scope: 'PoE 1 & PoE 2',
    status: 'shipped',
    shippedNote: 'Shipped in v3.47.0 (Nov 28, 2026)'
  },
  {
    id: 'rm-flask-pantheon-cluster',
    category: 'Deeper Character & Build Tools',
    title: 'Equipped Flask Effect, Pantheon & Cluster Jewel Armory Support',
    description:
      'Character Armory now calculates real equipped flask bonuses (including increased flask effect and Progenesis), Major & Minor Pantheons, and Cluster Jewel notables.',
    scope: 'PoE 1',
    status: 'shipped',
    shippedNote: 'Shipped in v3.46.0 (Nov 28, 2026)'
  },
  {
    id: 'rm-light-messaging',
    category: 'Private League & GSF Social Features',
    title: 'Site Notifications & Light Squad Messaging',
    description:
      'In-app notification bell and quick squad messages for item loan reminders, wishlist matches, alumni nudges, and private league invites.',
    scope: 'Platform',
    status: 'planned'
  },
  {
    id: 'rm-poe2-live-api',
    category: 'Deeper Character & Build Tools',
    title: 'PoE 2 Live Character Armory & Stash Sync',
    description:
      'Automatic PoE 2 character gear, passive tree, and stash syncing once Grinding Gear Games opens the public PoE 2 character and stash API.',
    scope: 'PoE 1 & PoE 2',
    status: 'planned'
  },
  {
    id: 'rm-root-app',
    category: 'Platform Growth & Polish',
    title: 'Native Root App Integration',
    description:
      'Dedicated Root community app integration for live league alerts, squad roster lookups, and wishlist notifications inside Root servers.',
    scope: 'Platform',
    status: 'planned'
  }
];
