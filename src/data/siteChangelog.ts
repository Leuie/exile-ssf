export type ChangeTag = 'Added' | 'Improved' | 'Fixed' | 'Removed';

export interface SiteChangelogItem {
  tag: ChangeTag;
  text: string;
}

export interface SiteChangelogRelease {
  id: string;
  version: string;
  title: string;
  dateEst: string;
  summary: string;
  changes: SiteChangelogItem[];
}

export const SITE_CHANGELOG: SiteChangelogRelease[] = [
  {
    id: 'rel-2026-11-22-pm',
    version: 'v3.30.4',
    title: 'Private League Hub Overhaul, Dedicated Mechanics Matrix & Wishlist Icons',
    dateEst: 'Nov 22, 2026 • 2:00 PM EST',
    summary: 'Separated Atlas Mechanics and Hall of Fame into dedicated Private League Hub pages, added automatic 12 hour ladder sync, and brought official Path of Exile item icons onto Wishlist cards.',
    changes: [
      { tag: 'Added', text: 'Dedicated Mechanics tab inside Private League Hub covering all 25 Atlas & Endgame mechanics (including Bestiary, Abyss, Beyond, Torment, Settlers, and more) with one click Claim / Drop lane syncing to D1.' },
      { tag: 'Added', text: 'Dedicated Hall of Fame tab right after Roster for League Firsts milestones.' },
      { tag: 'Added', text: 'Official Path of Exile item icons in the top right of Wishlist cards powered by live poe.ninja CDN icon mapping.' },
      { tag: 'Added', text: 'Embedded ExileCon 2026 Keynote and 3.30 Covens of Umbra Launch videos directly on the Command Center.' },
      { tag: 'Improved', text: 'Roster tab now focuses exclusively on current league players and characters, with automatic 12 hour official PoE ladder syncing until league expiration.' },
      { tag: 'Removed', text: 'Removed expired launch countdown clocks on Command Center and redundant "X Player Needs" pills on Wishlist cards.' }
    ]
  },
  {
    id: 'rel-2026-11-22-mid',
    version: 'v3.30.3',
    title: 'Asset Tracker 18 Slot Baseline, New Map Tracker & Live GGG XP/hr Telemetry',
    dateEst: 'Nov 22, 2026 • 1:15 PM EST',
    summary: 'Split mapping telemetry into its own dedicated Map Tracker page with realtime Client.txt watching and live GGG XP/hr polling, while upgrading Asset Tracker with standardized 18 slot tab mapping and pure SVG charts.',
    changes: [
      { tag: 'Added', text: 'New dedicated Map Tracker page (/maps) with a custom Start Date calendar modal, 3 step Client.txt live watch guide, per map duration, hideout downtime %, death tracking, and Timekeeper Map Device speedrun callout.' },
      { tag: 'Added', text: 'Automatic GGG character experience polling (/api/farming/character-xp) grouped by league for real XP/hr timelines and Atlas strategy speed comparisons.' },
      { tag: 'Added', text: '18 Slot Canonical Tab Mapper in Asset Tracker (12 specialty tabs + Levelling Items Quad + Dump 1 to 5) with Auto Match, Not Owned omission, and Maps / Uniques API notice.' },
      { tag: 'Added', text: '3 pure SVG Asset Tracker charts: Interactive Wealth Timeline, Category Share Donut, and Top Yielding Tabs.' },
      { tag: 'Added', text: 'Sabrewulf.net interactive Crafting Bench portal under External Databases and Tools Directory.' },
      { tag: 'Improved', text: 'Opt in localStorage POESESSID persistence, 30 day disclaimer memory, prominent Setup & Session ID button, and wall clock background safe 15m/30m/60m auto sync.' },
      { tag: 'Improved', text: 'Deep sorting and filtering for Gems (Level, Quality, Transfigured, Exceptional, Vaal), Flasks (Quality, iLvl), Div Cards (Full Stacks Ready), Uniques (6 Links), Essences, Maps, and Gear.' },
      { tag: 'Improved', text: 'Renamed Farming & Drops to Asset Tracker across UI and codebase, reorganized Sidebar into Tools and Mechanics & Formulas, and unified font-cinzel headers site wide.' },
      { tag: 'Removed', text: 'Removed obsolete Destructive Play preset and replaced with Campaign, Alch & Go White/Yellow/Red Maps.' }
    ]
  },
  {
    id: 'rel-2026-11-22-am',
    version: 'v3.30.2',
    title: 'Unified Builds Hub, Live pobb.in Build Doctor & 13 Tool Cloud Sync Upgrade',
    dateEst: 'Nov 22, 2026 • 12:15 PM EST',
    summary: 'Condensed Community Guides and SSF Starters into one vetted Builds Hub with live Mobalytics and Maxroll pulling, upgraded PoB Build Doctor to sync straight into your League Roster, and connected all 13 compendium tools to Cloudflare D1.',
    changes: [
      { tag: 'Added', text: 'Live pobb.in and pastebin.com URL resolver in PoB Build Doctor plus one click Sync to Private League Roster (Main or Alt) and Parsed Character Vitals strip.' },
      { tag: 'Added', text: 'Live Mobalytics and Maxroll.gg build guide puller (/api/builds/external) for both PoE 1 and PoE 2.' },
      { tag: 'Added', text: 'Cloudflare D1 user_tool_state cloud sync powering saved Regex Presets, Crafting Bench unlock checklists, Atlas Voidstone tracker, Campaign & Lab progress, and pinned Tools Directory favorites.' },
      { tag: 'Added', text: 'One click Load My League PoB Stats inside the Defense Mechanics interactive EHP Calculator.' },
      { tag: 'Added', text: 'Live GGG New Zealand Time (NZDT/NZST) and Local Timezone clock in the Sidebar footer, plus EST post and edit timestamps on Official Patch Notes.' },
      { tag: 'Improved', text: 'Consolidated PoE Wiki, PoEDB, and PoE Ninja portals with dynamic My Character & Wishlist quick lookup chips and fixed stale Settlers URLs to current challenge league.' },
      { tag: 'Fixed', text: 'Moved the Sidebar collapse toggle inside the header to prevent full screen clipping, and reset all seeded fake likes and ratings on guides and feedback.' }
    ]
  },
  {
    id: 'rel-2026-11-22-early',
    version: 'v3.30.1',
    title: 'Global Session Security Gate, Privacy Policy & Modular Worker Architecture',
    dateEst: 'Nov 22, 2026 • 2:15 AM EST',
    summary: 'Hardened all state changing API endpoints with signed exile_session verification, published the Privacy Policy, and modernized core onboarding.',
    changes: [
      { tag: 'Added', text: 'Global exile_session mutation gate enforcing verified session cookies and owner/admin checks across all POST, PUT, and DELETE Worker routes.' },
      { tag: 'Added', text: 'Dedicated Privacy Policy page (/privacy) linked from the Sidebar footer.' },
      { tag: 'Added', text: 'Live per tab scanning progress bar and explicit DEMO DATA preview onboarding in Asset Tracker.' },
      { tag: 'Removed', text: 'Removed legacy SSF Progress bar from the Sidebar.' }
    ]
  }
];
