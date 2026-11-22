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
    id: 'rel-2026-11-22-wealth-analytics',
    version: 'v3.30.7',
    title: 'Full Page Wealth & Pace Analytics & Per League Cloud Sync',
    dateEst: 'Nov 22, 2026 • 5:00 PM EST',
    summary: 'Launched a dedicated full page Wealth & Pace Analytics view (/assets/analytics) with backlinks to Asset Tracker and Exile Profiles, backed by per league Cloudflare D1 cloud storage.',
    changes: [
      { tag: 'Added', text: 'Full page Wealth & Pace Analytics dashboard (/assets/analytics) with 5 executive KPI cards, interactive full width Wealth Timeline (Live Checkpoints & Saved Sessions toggle), Category Breakdown donut + table, Top Yielding Tabs leaderboard, and Top 12 Most Valuable Assets showcase.' },
      { tag: 'Added', text: 'Per league Cloudflare D1 cloud snapshots (byLeague) inside /api/farming/stash-state so each league keeps its own persistent stash wealth timeline, tabs, and breakdown tied to your user profile.' },
      { tag: 'Added', text: 'Direct Full Analytics buttons inside Asset Tracker header and Analytics Deck, plus Back to Asset Tracker and Exile Profile backlinks on the full page view.' },
      { tag: 'Improved', text: 'Hardened Cloudflare Worker HMAC session signing to strictly require encrypted SESSION_SECRET with zero public repo fallback.' }
    ]
  },
  {
    id: 'rel-2026-11-22-audit',
    version: 'v3.30.6',
    title: 'Site Wide Audit Upgrades: Wishlist Autocomplete, Fixed .xlsx Export, Caching & PoE 2 Presets',
    dateEst: 'Nov 22, 2026 • 4:30 PM EST',
    summary: 'Migrated poe.ninja economy APIs to live /poe1/api/economy routes, fixed Export Live League Workbook (.xlsx), added live 3,541 item autocomplete with icon previews on Wishlists, hardened Worker CORS scoping, and trimmed unused font & dead component overhead.',
    changes: [
      { tag: 'Added', text: 'Live 3,541 item autocomplete with official web.poecdn.com artwork previews inside the Add Wanted Item modal on Wishlists.' },
      { tag: 'Added', text: 'Dedicated PoE 2 mapping strategy presets (Waystones T1 to T15, Tower + Tablet Farm, Breach + Delirium, Trial of Sekhemas / Chaos, Pinnacle Bossing) in Map Tracker.' },
      { tag: 'Added', text: 'Modular OpenGraph SEO route handler (worker/routes/seo.ts) covering /maps, /sabrewulf, /feedback, /league/:id/mechanics, and /league/:id/hall-of-fame.' },
      { tag: 'Improved', text: 'Added lightweight ?scope=icons API mode, 30 minute sessionStorage caching on Wishlists, and public edge Cache Control headers on read only endpoints to cut Wishlist load transfer by ~65%.' },
      { tag: 'Improved', text: 'Replaced module level mutable CORS_HEADERS in worker/index.ts with request scoped headers to eliminate edge concurrency bleed, and removed unused Orbitron and Poppins Google Fonts.' },
      { tag: 'Fixed', text: 'Fixed Export Live League Workbook (.xlsx) by stripping invalid XML control characters, adding ZIP store fallback if deflate fails, delaying blob URL revocation, and displaying explicit download status banners.' },
      { tag: 'Fixed', text: 'Migrated poe.ninja API fetches to /poe1/api/data/index-state and /poe1/api/economy endpoints (restoring 10,381 Covens prices and 3,541 item icons) and deduplicated FARM VIEW character filter chips.' },
      { tag: 'Removed', text: 'Removed redundant Squad Bounty & Wishlist Fulfillment Heroes banner from Wishlists and deleted 4 orphaned legacy component files.' }
    ]
  },
  {
    id: 'rel-2026-11-22-changelog',
    version: 'v3.30.5',
    title: 'Changelog & Feedback Hub Redesign & Complete Release History',
    dateEst: 'Nov 22, 2026 • 3:30 PM EST',
    summary: 'Redesigned the Feedback page into a Patch Notes style Changelog & Feedback hub with complete timestamped release history going all the way back to the Nov 1, 2026 initial launch, and removed all fake seeded feedback entries.',
    changes: [
      { tag: 'Added', text: 'Patch Notes style Changelog & Feedback hub (/feedback) featuring a release dropdown, previous/next stepper, full timeline toggle, search filter, and EST release timestamps.' },
      { tag: 'Added', text: 'Backfilled complete site release history from the Nov 1, 2026 initial launch through all 3.30 Covens of Umbra upgrades.' },
      { tag: 'Improved', text: 'Updated Sidebar navigation label and page header to Changelog & Feedback and refreshed GitHub README documentation.' },
      { tag: 'Removed', text: 'Removed all fake seeded placeholder feedback posts and fake upvotes from client defaults and Cloudflare D1.' }
    ]
  },
  {
    id: 'rel-2026-11-22-pm',
    version: 'v3.30.4',
    title: 'Private League Hub Overhaul, Dedicated Mechanics Matrix & Wishlist Icons',
    dateEst: 'Nov 22, 2026 • 3:05 PM EST',
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
    dateEst: 'Nov 22, 2026 • 2:20 PM EST',
    summary: 'Split mapping telemetry into its own dedicated Map Tracker page with realtime Client.txt watching and live GGG XP/hr polling, while upgrading Asset Tracker with standardized 18 slot tab mapping and pure SVG charts.',
    changes: [
      { tag: 'Added', text: 'New dedicated Map Tracker page (/maps) with a custom Start Date calendar modal, 3 step Client.txt live watch guide, per map duration, hideout downtime %, death tracking, and Timekeeper Map Device speedrun callout.' },
      { tag: 'Added', text: 'Automatic GGG character experience polling (/api/farming/character-xp) grouped by league for real XP/hr timelines and Atlas strategy speed comparisons.' },
      { tag: 'Added', text: '18 Slot Canonical Tab Mapper in Asset Tracker (12 specialty tabs + Levelling Items Quad + Dump 1 to 5) with Auto Match, Not Owned omission, and Maps / Uniques API notice.' },
      { tag: 'Added', text: '3 pure SVG Asset Tracker charts: Interactive Wealth Timeline, Category Share Donut, and Top Yielding Tabs.' },
      { tag: 'Added', text: 'Sabrewulf.net interactive Crafting Bench portal under External Databases and Tools Directory.' },
      { tag: 'Improved', text: 'Opt in localStorage POESESSID persistence, 30 day disclaimer memory, prominent Setup & Session ID button, and wall clock background safe 15m/30m/60m auto sync.' },
      { tag: 'Improved', text: 'Deep sorting and filtering for Gems (Level, Quality, Transfigured, Exceptional, Vaal, Awakened), Flasks (Quality, iLvl), Div Cards (Full Stacks Ready), Uniques (6 Links), Essences, Maps, and Gear.' },
      { tag: 'Improved', text: 'Renamed Farming & Drops to Asset Tracker across UI and codebase, reorganized Sidebar into Tools and Mechanics & Formulas, and unified font-cinzel headers site wide.' },
      { tag: 'Removed', text: 'Removed obsolete Destructive Play preset and replaced with Campaign, Alch & Go White/Yellow/Red Maps.' }
    ]
  },
  {
    id: 'rel-2026-11-22-am',
    version: 'v3.30.2',
    title: 'Unified Builds Hub, Live pobb.in Build Doctor & 13 Tool Cloud Sync Upgrade',
    dateEst: 'Nov 22, 2026 • 1:15 PM EST',
    summary: 'Condensed Community Guides and SSF Starters into one vetted Builds Hub with live Mobalytics and Maxroll pulling, upgraded PoB Build Doctor to sync straight into your League Roster, and connected all 13 compendium tools to Cloudflare D1.',
    changes: [
      { tag: 'Added', text: 'Live pobb.in and pastebin.com URL resolver in PoB Build Doctor plus one click Sync to Private League Roster (Main or Alt) and Parsed Character Vitals strip.' },
      { tag: 'Added', text: 'Live Mobalytics and Maxroll.gg build guide puller (/api/builds/external) for both PoE 1 and PoE 2.' },
      { tag: 'Added', text: 'Cloudflare D1 user_tool_state cloud sync powering saved Regex Presets, Crafting Bench unlock checklists, Atlas Voidstone tracker, Campaign & Lab progress, and pinned Tools Directory favorites.' },
      { tag: 'Added', text: 'One click Load My League PoB Stats inside the Defense Mechanics interactive EHP Calculator.' },
      { tag: 'Improved', text: 'Consolidated PoE Wiki, PoEDB, and PoE Ninja portals with dynamic My Character & Wishlist quick lookup chips and fixed stale Settlers URLs to current challenge league.' },
      { tag: 'Fixed', text: 'Moved the Sidebar collapse toggle inside the header to prevent full screen clipping, normalized NZDT/NZST timezone labels, and reset seeded fake likes and ratings on build guides.' }
    ]
  },
  {
    id: 'rel-2026-11-22-early',
    version: 'v3.30.1',
    title: 'Global Session Security Gate, Privacy Policy, D1 Stash Sync & SSF Weights',
    dateEst: 'Nov 22, 2026 • 3:45 AM EST',
    summary: 'Hardened all state changing API endpoints with signed exile_session verification, published the Privacy Policy, added cross device D1 stash persistence, and introduced editable SSF Utility weights.',
    changes: [
      { tag: 'Added', text: 'Global exile_session mutation gate enforcing verified session cookies and owner/admin checks across all POST, PUT, and DELETE Worker routes.' },
      { tag: 'Added', text: 'Dedicated Privacy Policy page (/privacy) linked from the Sidebar footer, live per tab scanning progress bar, and explicit DEMO DATA preview banner.' },
      { tag: 'Added', text: 'Cloudflare D1 cloud stash persistence across devices, transparent editable SSF Utility Weights drawer anchored to poe.ninja Chaos pricing, desktop drop notifications, and Exile Profile Farming Trophy Case.' },
      { tag: 'Added', text: 'Unique and Map stash tab API 0 visibility badges, EST post and edit timestamps on Official Patch Notes, and live GGG NZT + Local Timezone clock in Sidebar.' },
      { tag: 'Fixed', text: 'Fixed Free Stash share endpoint routing (/api/stash-drops) and synced account tag mapping.' },
      { tag: 'Removed', text: 'Removed legacy SSF Progress bar from the Sidebar.' }
    ]
  },
  {
    id: 'rel-2026-11-21-late',
    version: 'v3.29.9',
    title: 'Farming & Drop Tracker Launch, Regex Studio & Live GGG Patch Notes',
    dateEst: 'Nov 21, 2026 • 11:55 PM EST',
    summary: 'Launched the original stateless Stash & Client.txt Farming Tracker, Regex Studio for PoE 1 & PoE 2, live GGG Patch Notes reader, and deployment resilient error recovery.',
    changes: [
      { tag: 'Added', text: 'Launched Farming & Drop Tracker with stateless dump tab diffing, Client.txt auto watcher (15s polling, live zone badge, Steam & Standalone path helpers), Focus Mode, sparkline chart, Direct Browser JSON fallback, xlsx export, and Private League wishlist drop matcher.' },
      { tag: 'Added', text: 'Launched Regex Studio (/regex) powered by poe.re and poe2.re with saved personal presets and full PoE 2 sidebar parity.' },
      { tag: 'Added', text: 'Launched live GGG Official Patch Notes (/patch-notes) with grouped expansion dropdown and clean forum thread parser.' },
      { tag: 'Added', text: 'Top level Error Boundary and automatic chunk reload recovery to eliminate blank screens after new deployments.' },
      { tag: 'Improved', text: 'Modernized Vendor Formulas, Defenses, and Offenses for PoE 1 and PoE 2, upgraded Bounties command ribbon, and promoted Cheat Sheets and Crafting Bench to the Mechanics sidebar.' },
      { tag: 'Removed', text: 'Removed the initial 500 Honor Points gate on stash tracking and replaced it with an explicit POESESSID security disclaimer.' }
    ]
  },
  {
    id: 'rel-2026-11-21-eve',
    version: 'v3.29.8',
    title: 'Security Hardening, Universal PoE 1 & PoE 2 Homepage, Google Sheets & Profile Studio',
    dateEst: 'Nov 21, 2026 • 10:50 PM EST',
    summary: 'Upgraded authentication to HttpOnly HMAC sessions, redesigned the homepage as a universal PoE 1 & PoE 2 hub, and added Google Sheets export/ingestion plus Profile Studio.',
    changes: [
      { tag: 'Added', text: 'HttpOnly HMAC session cookies, server side admin authentication, strict CORS, SSRF guards, and locked down public account endpoints.' },
      { tag: 'Added', text: 'Google Sheets export & ingestion with Starter Sheet template, Profile Studio with automatic Imgur avatar normalization, collapsible Sidebar, and upgraded Invite Hub.' },
      { tag: 'Improved', text: 'Rewrote homepage to showcase universal PoE 1 & PoE 2 Private League Hub and SSF/GSF toolkit, added cross game Exile Profiles, and compacted Private League Hub header so league cards appear above the fold.' }
    ]
  },
  {
    id: 'rel-2026-11-21-am',
    version: 'v3.29.7',
    title: 'Cloudflare D1 SQLite Architecture, Live League Feed, Exile Profiles & Root Webhooks',
    dateEst: 'Nov 21, 2026 • 4:45 AM EST',
    summary: 'Migrated multiplayer data to a 16 table Cloudflare D1 SQLite database with PBKDF2 authentication, launched Exile Profiles and Live League Feed, and wired up Root webhooks and cron ladder syncing.',
    changes: [
      { tag: 'Added', text: 'Migrated core storage to 16 table Cloudflare D1 SQLite architecture with PBKDF2 salted password hashing.' },
      { tag: 'Added', text: 'Dedicated Exile Profile pages with Honor History ledgers, clickable profile handles app wide, linked avatars, and 3.30 Witch league achievements.' },
      { tag: 'Added', text: 'Live League Feed with comments, mentions filter, unread badge, honor credits, and numeric timestamp sorting.' },
      { tag: 'Added', text: 'Root server webhook alerts, top bar notification bell, admin host awards, automated 10 minute ladder cron sync, Wishlist Loot Filter Generator, Boss Carries & Vouches, and PWA manifest.' },
      { tag: 'Improved', text: 'Awarded retroactive +5 Honor Points per squad item found and synchronized League Firsts Wall with active Roster characters.' }
    ]
  },
  {
    id: 'rel-2026-11-20-pm',
    version: 'v3.29.6',
    title: 'Squad Bounty Board, Modular Private League Tabs, Multi Character Roster & OpenGraph SEO',
    dateEst: 'Nov 21, 2026 • 1:30 AM EST',
    summary: 'Launched the Squad Bounty Board, refactored Private League Hub into modular sub route tabs, added multi character tracking per account, and enabled dynamic Worker OpenGraph SEO.',
    changes: [
      { tag: 'Added', text: 'Dedicated Squad Bounty Board with wishlist loopbacks, incentivized rewards, and persistent cross league achievements.' },
      { tag: 'Added', text: 'Multi character tracking per account slot, character level wishlist filtering, expanded grouped Path of Exile item taxonomy (including Boss Fragments), and Drop Check modal.' },
      { tag: 'Added', text: 'Dynamic Cloudflare Worker OpenGraph metadata for every route and React.lazy code splitting.' },
      { tag: 'Improved', text: 'Modularized PrivateLeagueHubView into dedicated tab routes, isolated PoE 1 and PoE 2 active seasons, updated guides and recipes for 3.30 post launch patch notes, and optimized KV sync latency.' },
      { tag: 'Fixed', text: 'Fixed wishlist HAVE persistence, sorted acquired items to the end of the grid, and added admin roster management and member reassignment.' }
    ]
  },
  {
    id: 'rel-2026-11-11-am',
    version: 'v3.29.5',
    title: 'Private League Hub Directory, Live Cloudflare KV Multiplayer Sync & Guide Reader',
    dateEst: 'Nov 11, 2026 • 3:45 AM EST',
    summary: 'Connected live Cloudflare KV edge storage for multiplayer roster and wishlist syncing, introduced the Private League Hub directory, and launched the full width secondary monitor guide reader.',
    changes: [
      { tag: 'Added', text: 'Private League Hub directory (/privateleaguehub) with shareable unique league routes, direct league invite modals, and fast join onboarding.' },
      { tag: 'Added', text: 'Cloudflare KV edge database synchronization broadcasting canonical squad wishlists and roster registrations live to all visitors.' },
      { tag: 'Added', text: 'Secondary monitor full width guide reader, full Markdown guide editor, search/class/sort filters, and Lightning Strike Slayer & Lightning Arrow Deadeye guides.' },
      { tag: 'Improved', text: 'Added Vaal Gem wishlist category, allowed requestors and admins to edit/delete wishlist requests, and updated outreach links to exilessf.app.' },
      { tag: 'Fixed', text: 'Resolved Google authentication issues and multi user roster persistence.' }
    ]
  },
  {
    id: 'rel-2026-11-01-launch',
    version: 'v1.0.0',
    title: 'Initial Launch of Exile SSF Compendium, GSF Portal & Authentication',
    dateEst: 'Nov 1, 2026 • 10:45 PM EST',
    summary: 'First production release of Exile SSF on exilessf.app featuring the SSF Compendium, Group Self Found (GSF) portal, guide ingestion engine, and secure account authentication.',
    changes: [
      { tag: 'Added', text: 'Launched Exile SSF (exilessf.app) on Cloudflare Workers with full SSF Compendium, GSF portal, guide ingestion engine, private league crowdfund ingestion, and community feedback hub.' },
      { tag: 'Added', text: 'Dedicated /login, /register, and /admin routes with Exile SSF app credentials and secure Google account linking.' },
      { tag: 'Added', text: 'Covens of Umbra hero artwork, Ravenwatch Root integration, collapsible navigation categories, and responsive gaming utility layout for desktop, tablet, and mobile.' },
      { tag: 'Fixed', text: 'Eliminated plain text secrets, prevented default admin auto login, and migrated SPA routing to native wrangler.jsonc static assets.' }
    ]
  }
];
