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
  isMajor: boolean;
  tier: 'major' | 'minor';
  badge?: string;
  changes: SiteChangelogItem[];
}

export const SITE_CHANGELOG: SiteChangelogRelease[] = [
  {
    id: 'rel-2026-11-24-unified-cockpit',
    version: 'v3.36.0',
    title: 'Unified Farming Cockpit: Linked Strategy Profiles, Shareable Atlas Trees, Active Character Context, Armory Workspace Grid & Gear Hole Detector',
    dateEst: 'Nov 24, 2026 • 7:35 PM EST',
    isMajor: true,
    tier: 'major',
    badge: 'Unified Cockpit',
    summary: 'Stitched Character Armory, Map Tracker, Atlas Skill Tree Planner, and Asset Tracker into one cohesive loop: linked Strategy Profiles, shareable Atlas Tree links & Discord/Root summaries, live Active Character context in the Sidebar & Map Tracker, draggable Armory workspace grid, and live Gear Hole Detector with 1 click Crafting Bench & Regex Studio jumps.',
    changes: [
      { tag: 'Added', text: 'Shareable Atlas Skill Tree links (?atlas=...), 1 click Import code loader, and formatted Discord / Root summary copy inside Atlas Skill Tree Planner.' },
      { tag: 'Added', text: 'Linked Strategy Profiles connecting saved Atlas Trees, Map Tracker sessions, and Asset Tracker farming tags automatically across tools.' },
      { tag: 'Added', text: 'Active Character context pill in the Sidebar synced from Character Armory and stamped automatically onto saved Map Tracker sessions.' },
      { tag: 'Added', text: 'Ported the collapsible, drag and drop, resizable ToolWidgetGrid into Character Armory alongside a live Gear Hole Detector linking straight to Crafting Bench and Regex Studio.' }
    ]
  },
  {
    id: 'rel-2026-11-24-atlas-planner-and-asset-grid',
    version: 'v3.35.0',
    title: 'Interactive Atlas Skill Tree Planner, Draggable Asset Tracker Grid, Non Password Session Inputs & Roadmap Cleanup',
    dateEst: 'Nov 24, 2026 • 5:20 PM EST',
    isMajor: true,
    tier: 'major',
    badge: 'Atlas Planner & Grid',
    summary: 'Launched the Interactive Atlas Skill Tree Planner inside Map Tracker using official GGG atlas-skilltree-export data, ported the draggable resizable ToolWidgetGrid into Asset Tracker, fixed POESESSID inputs so browsers stop treating them as password fields, and finished removing internal database jargon from Changelog & Planned Roadmap.',
    changes: [
      { tag: 'Added', text: 'Interactive Atlas Skill Tree Planner in Map Tracker: click nodes to allocate up to 132 points, zoom, pan, highlight mechanics (Essence, Harvest, Scarab, etc.), maximize fullscreen, and save/switch multiple named Atlas trees to Cloud.' },
      { tag: 'Improved', text: 'Ported the collapsible, drag and drop, resizable ToolWidgetGrid (2x2, 3 Col, 4x2, Full presets) into Asset Tracker across Wealth & Pace, Breakdown, Visual Analytics, and Synced Stash Workspace.' },
      { tag: 'Fixed', text: 'Converted all POESESSID inputs to masked non password text fields with autofill suppression so Chrome, Brave, and password managers never prompt to save or suggest a password.' },
      { tag: 'Improved', text: 'Removed all remaining internal database jargon from Planned Roadmap and Changelog entries.' }
    ]
  },
  {
    id: 'rel-2026-11-24-official-tree-and-grid',
    version: 'v3.34.1',
    title: 'Interactive Official PoE Passive Skill Tree, Draggable Map Tracker Workspace Grid & Unified POESESSID Sync',
    dateEst: 'Nov 24, 2026 • 5:10 PM EST',
    isMajor: true,
    tier: 'major',
    badge: 'Armory & Maps Upgrade',
    summary: 'Upgraded Character Armory with an interactive zoom, pan, search, and fullscreen canvas powered by official GGG skilltree-export data, redesigned Map Tracker into a collapsible drag and drop resizable workspace grid, fixed unified POESESSID sharing across all tools with a permanent one time disclaimer, and cleared the sticky Armory search input.',
    changes: [
      { tag: 'Added', text: 'Interactive Official PoE Passive Skill Tree canvas in Character Armory with mouse wheel zoom, drag to pan, live node search highlighting, rich stat hover tooltips, Focus Allocated, and fullscreen Maximize.' },
      { tag: 'Added', text: 'Reusable ToolWidgetGrid on Map Tracker: every section can now be collapsed or expanded, drag and drop reordered, resized (1/4, 1/3, 1/2, 2/3, Full), or snapped to 2x2, 3 Col, 4x2, and Full presets.' },
      { tag: 'Fixed', text: 'Unified POESESSID browser storage across Tool Setup, Asset Tracker, Character Armory, and Map Tracker so entering your session once retains access for 30 days across every tool, and made the POESESSID disclaimer permanent once dismissed.' },
      { tag: 'Fixed', text: 'Cleared the Character Armory search box by default so your own handle no longer sticks inside the Inspect @Handle input.' },
      { tag: 'Improved', text: 'Removed redundant inline setup steps from Map Tracker in favor of a compact Client.txt action bar + Tool Setup button.' }
    ]
  },
  {
    id: 'rel-2026-11-24-unified-tool-setup',
    version: 'v3.34.0',
    title: 'Unified Tool Setup Wizard, Asset Tracker Fix, Guild Stash Scanner Removal & Tool Data Reset',
    dateEst: 'Nov 24, 2026 • 3:30 PM EST',
    isMajor: true,
    tier: 'major',
    badge: 'Unified Setup',
    summary: 'Launched a guided 3 step Unified Tool Setup modal for opting into Asset Tracker, Character Armory, Map Tracker, and Builds Hub in one place, fixed Asset Tracker silently returning 0 items on GGG auth errors, removed the Private League Guild Stash Scanner, purged legacy tool data from before 12:00 PM EST, and replaced internal database jargon across player facing views.',
    changes: [
      { tag: 'Added', text: 'Unified Tool Setup Wizard accessible from the sidebar under Tools: opt in or out of Asset Tracker, Character Armory, Map Tracker, and Builds Hub, review what data is collected, test your GGG POESESSID connection, and link Client.txt in one clean flow.' },
      { tag: 'Fixed', text: 'Fixed Asset Tracker stash snapshot endpoint silently returning 0 items on GGG HTTP 401/403/404 responses; now automatically retries # to dash account formatting and surfaces clear session errors.' },
      { tag: 'Removed', text: 'Removed the Private League Guild Stash Scanner UI and backend route from Asset Tracker to keep stash tracking focused on personal farming.' },
      { tag: 'Improved', text: 'Purged all pre Nov 24 12:00 PM EST saved data in Asset Tracker, Map Tracker, and Character Armory with a dismissible sitewide reset banner prompting exiles to resync.' },
      { tag: 'Improved', text: 'Cleaned up player facing labels across Armory, Build Doctor (Armory Audit), Defenses, Profile (Armory Snapshot), and Analytics by removing internal database jargon.' }
    ]
  },
  {
    id: 'rel-2026-11-24-profile-polish',
    version: 'v3.33.1',
    title: 'Unified Exile Passport, Circular Social Icons (Root, Discord, Twitch, YouTube) & Map Tracker Toolkit Migration',
    dateEst: 'Nov 24, 2026 • 1:35 PM EST',
    isMajor: false,
    tier: 'minor',
    badge: 'Profile & UX Polish',
    summary: 'Condensed Cross Game Profile Scope and Multi League Career Passport into one unified Exile Passport, upgraded Profile social actions to circular Root, Discord, Twitch, and YouTube buttons, and moved the Map Regex Builder & Session Scratchpad directly into Map Tracker.',
    changes: [
      { tag: 'Improved', text: 'Merged Cross Game Profile Scope and Multi League Career Passport into a single unified Exile Passport inside the Exile Profile hero card with 6 non overlapping lifetime PoE 1 & PoE 2 metric tiles.' },
      { tag: 'Added', text: 'Circular Root App, Discord, Twitch, and YouTube icon buttons on the Exile Profile header with dedicated Discord URL and YouTube Channel URL fields in Edit Profile.' },
      { tag: 'Improved', text: 'Moved Map Regex Builder and Session Scratchpad out of Exile Profile into a dedicated collapsible Mapping Toolkit section inside Map Tracker with automatic Cloud + localStorage sync.' }
    ]
  },
  {
    id: 'rel-2026-11-24-d1-integrations-phase2',
    version: 'v3.33.0',
    title: 'Armory Cross Site Integrations: Roster Inspect, Wishlist Already Equipped, Armory Audit, Builds Hub Publish & Ctrl+K Dark Mode Fix',
    dateEst: 'Nov 24, 2026 • 7:55 AM EST',
    isMajor: true,
    tier: 'major',
    badge: 'Major Milestone',
    summary: 'Wired the Character Armory across every major module on Exile SSF: 1 click Roster Inspect, Wishlist Already Equipped detection, Armory Audit in PoB Build Doctor & Defense EHP live audits, 1 click Publish to Builds Hub, Hall of Fame & Wealth Ladder Character Hover Cards, plus a dark theme fix for the Ctrl+K Quick Finder modal.',
    changes: [
      { tag: 'Added', text: 'Private League Roster 1 click Armory inspect buttons and live Character Hover Cards showing Ascendancy, Level, headline gear icons, and allocated Keystones.' },
      { tag: 'Added', text: 'Squad Wishlists Already Equipped detector automatically cross checking your open wishlist requests against synced character gear and socketed gems with 1 click Mark Acquired.' },
      { tag: 'Added', text: 'Armory Audit inside PoB Build Doctor and 1 click Load From Armory inside Defense Mechanics EHP Calculator pulling live character stats directly from Cloud.' },
      { tag: 'Added', text: '1 click Publish to Builds Hub inside Character Armory converting any synced character into a live Markdown community showcase guide.' },
      { tag: 'Added', text: 'Cached Character Hover Preview Cards on Hall of Fame League Firsts and Wealth Ladder podium & standings.' },
      { tag: 'Fixed', text: 'Fixed white background / unreadable text styling bug in the Ctrl+K Quick Finder (DualLinkModal) and wired Escape key dismissal.' }
    ]
  },
  {
    id: 'rel-2026-11-24-armory-phase1',
    version: 'v3.32.0',
    title: 'Dedicated Character Armory (/armory), Multi League Career Passport, Mobile Bottom Sheet Tooltips & Hover Prefetching',
    dateEst: 'Nov 24, 2026 • 7:10 AM EST',
    isMajor: true,
    tier: 'major',
    badge: 'Major Milestone',
    summary: 'Promoted the Character Paperdoll & Passive Tree into a dedicated first class Character Armory tool with shareable deep link URLs (/armory/:handle/:char), cut Exile Profile bundle weight by 46% with a new Executive Snapshot Card & Multi League Career Passport, added touch friendly mobile bottom sheet item tooltips, and wired Sidebar hover chunk prefetching.',
    changes: [
      { tag: 'Added', text: 'Dedicated Character Armory view (/armory, /armory/:handle, /armory/:handle/:charName) under Sidebar Tools with global @Handle lookup, 1 click squad roster switcher chips, and shareable Armory URLs with Cloudflare Worker OpenGraph SEO metadata.' },
      { tag: 'Added', text: 'Multi League Historical Career Passport on every Exile Profile aggregating lifetime characters, peak level, synced gear snapshots, verified vouches, farming runs, and total Honor across PoE 1 & PoE 2.' },
      { tag: 'Added', text: 'Auto touch detection on mobile and tablet viewports (< 768px) rendering a smooth bottom sheet item inspector drawer when tapping any gear, flask, or jewel slot.' },
      { tag: 'Improved', text: 'Replaced the heavy inline paperdoll on Exile Profiles with a fast Executive Character Armory Snapshot card and 1 click Armory buttons on every character row, cutting ExileProfilePage bundle size from 102.7 kB down to 55.9 kB.' },
      { tag: 'Improved', text: 'Added Sidebar hover chunk prefetching on desktop navigation links for near instant 0ms lazy route transitions.' }
    ]
  },
  {
    id: 'rel-2026-11-24-character-engine',
    version: 'v3.31.0',
    title: 'Interactive PoE Character Inspection Engine, poe.ninja Style Passive Tree & Jewels, Universal Non Admin Cloud Sync & Asset Tracker Gear Net Worth',
    dateEst: 'Nov 24, 2026 • 3:15 AM EST',
    isMajor: true,
    tier: 'major',
    badge: 'Major Milestone',
    summary: 'Full interactive character inspection suite featuring an interactive passive skill tree with Ascendancy, Keystones, and Masteries; poe.ninja style Cluster, Base, and Abyss Jewels; in game hover tooltips with explicit Implicit/Prefix/Suffix affix tier badges; live gear and socketed gem net worth inclusion in Asset Tracker; universal signed session cookies for non admin accounts; and customizable Community Hub & Global Chat per league.',
    changes: [
      { tag: 'Added', text: 'poe.ninja style Cluster, Base, and Abyss Jewel inspector displaying full jewel mod rolls, jewel sockets, and cluster passives directly on character profiles.' },
      { tag: 'Added', text: 'Interactive toggleable Passive Skill Tree visualizer on Exile Profiles with Ascendancy nodes, allocated Keystones, Masteries, and socketed skill gem setups.' },
      { tag: 'Added', text: 'In game hover item tooltips with Side Panel toggle and explicit Implicit, Prefix, and Suffix tier affix badges for authentic Path of Exile gear inspecting.' },
      { tag: 'Added', text: 'Character equipment and socketed gems now factor directly into Asset Tracker stash snapshots and net worth calculations.' },
      { tag: 'Added', text: 'Universal Cloud session sync for non admin exiles, wiring App & Google login, registration, and token renewals to signed exile_session cookies.' },
      { tag: 'Added', text: 'Per league customizable Community Hub and Global Chat with leadership cards positioned prominently above onboarding.' },
      { tag: 'Added', text: '7 Character Armory cross site integrations added to the permanent Planned Roadmap (24 items total).' },
      { tag: 'Improved', text: 'Profile remembers last opened character across visits, and utility controls (Tooltip Mode, Refresh Gear, GGG Sync) are tucked inside a clean Setup dropdown.' },
      { tag: 'Improved', text: 'Removed colored outlines around character equipment, flask, and jewel slots for a cleaner, modern poe.ninja style visual aesthetic.' },
      { tag: 'Fixed', text: 'Resolved case sensitive cloud map session persistence and fixed GGG item stats and socket links parsing.' }
    ]
  },
  {
    id: 'rel-2026-11-23-paperdoll-telemetry',
    version: 'v3.30.10',
    title: 'PoE Character Paperdoll Inventory, Guild Stash Wishlist Scanner, Auto Voidstone Sync & Client.txt Proof Capture',
    dateEst: 'Nov 23, 2026 • 12:45 AM EST',
    isMajor: true,
    tier: 'major',
    badge: 'Major Milestone',
    summary: 'Launched an authentic Path of Exile Character Equipment Paperdoll with Character Selector on Exile Profiles, added a Private League Guild Stash Scanner with 1 click +5 Honor Wishlist fulfillment, wired Auto Voidstone Sync on Atlas Tracker, and expanded Client.txt telemetry with a GSF Trade & Whisper Counter and Automatic League Firsts Proof Capture.',
    changes: [
      { tag: 'Added', text: 'Authentic Path of Exile Character Equipment & Inventory Paperdoll on Exile Profiles with Weapon Set I/II toggle, all 12 gear slots + 5 Flasks, socket & link overlays, live hover/click item mod & socketed gem inspector, Character Selector, Cloud snapshot persistence, and 1 click push of live gear vitals into Defense Mechanics EHP Calculator.' },
      { tag: 'Added', text: 'Private League Guild Stash Scanner inside Asset Tracker (/api/farming/guild-stash) scanning up to 8 GSF Guild Stash tabs and highlighting every item matching a squadmate\'s open Wishlist.' },
      { tag: 'Improved', text: 'Auto Wishlist Fulfillment Detector in Asset Tracker now awards +5 Honor on 1 click Mark Found (+5 Honor) from both personal stash syncs and Guild Stash scans.' },
      { tag: 'Added', text: 'Auto Sync Voidstones button inside Atlas Tracker reading your synced character\'s Voidstones directly to auto check Exarch, Eater, Maven, and Uber Elder milestones.' },
      { tag: 'Added', text: 'Live GSF Trade & Whisper Counter inside Map Tracker parsing @From / @To whispers and Trade accepted events from local Client.txt to separate Active GSF Trading Time from AFK Hideout Time.' },
      { tag: 'Added', text: 'Automatic League Firsts Proof Capture inside Map Tracker detecting Level 90/95/100 dings and Pinnacle Boss encounters with exact timestamps and a 1 click Claim on Hall of Fame button.' }
    ]
  },
  {
    id: 'rel-2026-11-22-governance',
    version: 'v3.30.9',
    title: 'Macro Site Super Admin Console, Sitewide Notice Banners & Per League Host/Moderator Governance',
    dateEst: 'Nov 22, 2026 • 6:50 PM EST',
    isMajor: false,
    tier: 'minor',
    badge: 'Governance & Admin',
    summary: 'Separated global platform administration (/admin) from per league moderation (/league/:id/manage), launched a sitewide broadcast banner manager for holidays and maintenance, and added per league Host Admin + up to 3 Moderators with granular permissions and public contact cards.',
    changes: [
      { tag: 'Added', text: 'Macro Site Super Admin Console (/admin) showing platform wide live metrics across ALL hosted private leagues, a searchable All Private Leagues Manager (Feature, Archive, Reassign Host), KV Edge Cache force refreshes, and global Community Feedback triage & deletion.' },
      { tag: 'Added', text: 'Sitewide Broadcast Banner system (/api/site-banner + SiteNoticeBanner) letting Site Admin publish custom dismissible banners across all pages with 5 themes (Info, Maintenance, Event, Urgent, Holiday) and optional CTA links.' },
      { tag: 'Added', text: 'Per League Management Console (/league/:id/manage) visible only to each league\'s Host Admin, nominated Moderators, or Site Super Admin, housing that league\'s health, exports, ladder sync, awards, announcements, per league Webhook, and Staff Manager.' },
      { tag: 'Added', text: 'Up to 3 Moderators per private league nominated by the League Host with per moderator permission toggles (Edit Webhook, Edit Banner & Links, Grant Event Awards, Post Announcements, Manage Roster, Manage Wishlists).' },
      { tag: 'Added', text: 'Public League Leadership & Contact Team card on every league\'s Command Center displaying the Host Admin and Moderators with 1 click Root, Discord, Email (mailto), and Exile Profile contact buttons.' }
    ]
  },
  {
    id: 'rel-2026-11-22-wealth-ladder',
    version: 'v3.30.8',
    title: 'Opt In Hall of Fame Wealth Ladder, PoE Wiki Item Links, Header Reorganization & Tool Guides',
    dateEst: 'Nov 22, 2026 • 5:50 PM EST',
    isMajor: false,
    tier: 'minor',
    badge: 'Enhancement & QoL',
    summary: 'Launched the Opt In Wealth & Pace Ladder on Hall of Fame pulling live Asset Tracker and Map Tracker telemetry, made every item name clickable to PoE Wiki, reorganized Asset Tracker header controls, and added What Is This guides to Map Tracker and Builds Hub.',
    changes: [
      { tag: 'Added', text: 'Opt In Wealth & Pace Ladder on Hall of Fame (/league/:id/hall-of-fame) featuring Gold/Silver/Bronze podium cards, Headline Jackpot Drops with official artwork, inline SVG wealth sparklines, sortable Net Worth / Div per hr / Maps / S Tier / XP per hr standings, and 1 click opt in controls (/api/farming/wealth-ladder).' },
      { tag: 'Added', text: 'Clickable PoE Wiki links on every item name across Asset Tracker (Table & Grid views) and Wealth Analytics Top 12 Assets opening poewiki.net or poe2wiki.net in a new tab.' },
      { tag: 'Added', text: 'Collapsible "What Is This?" onboarding guides on Map Tracker and Builds Hub, plus a complete 4 card guide update on Asset Tracker.' },
      { tag: 'Improved', text: 'Reorganized Asset Tracker header: Audio Chime and Notifications moved to top right; Save Cloud, Export .xlsx, and Focus Mode aligned right below them; Setup (renamed from Setup & Session ID), SSF Utility / poe.ninja toggle, Weights, Wealth & Pace Analytics, and Join Wealth Ladder aligned left.' }
    ]
  },
  {
    id: 'rel-2026-11-22-wealth-analytics',
    version: 'v3.30.7',
    title: 'Full Page Wealth & Pace Analytics & Per League Cloud Sync',
    dateEst: 'Nov 22, 2026 • 5:00 PM EST',
    isMajor: true,
    tier: 'major',
    badge: 'Major Milestone',
    summary: 'Launched a dedicated full page Wealth & Pace Analytics view (/assets/analytics) with backlinks to Asset Tracker and Exile Profiles, backed by per league Cloud storage.',
    changes: [
      { tag: 'Added', text: 'Full page Wealth & Pace Analytics dashboard (/assets/analytics) with 5 executive KPI cards, interactive full width Wealth Timeline (Live Checkpoints & Saved Sessions toggle), Category Breakdown donut + table, Top Yielding Tabs leaderboard, and Top 12 Most Valuable Assets showcase.' },
      { tag: 'Added', text: 'Per league Cloud snapshots (byLeague) inside /api/farming/stash-state so each league keeps its own persistent stash wealth timeline, tabs, and breakdown tied to your user profile.' },
      { tag: 'Added', text: 'Direct Full Analytics buttons inside Asset Tracker header and Analytics Deck, plus Back to Asset Tracker and Exile Profile backlinks on the full page view.' },
      { tag: 'Improved', text: 'Hardened Cloudflare Worker HMAC session signing to strictly require encrypted SESSION_SECRET with zero public repo fallback.' }
    ]
  },
  {
    id: 'rel-2026-11-22-audit',
    version: 'v3.30.6',
    title: 'Site Wide Audit Upgrades: Wishlist Autocomplete, Fixed .xlsx Export, Caching & PoE 2 Presets',
    dateEst: 'Nov 22, 2026 • 4:30 PM EST',
    isMajor: false,
    tier: 'minor',
    badge: 'Performance & Audit',
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
    isMajor: false,
    tier: 'minor',
    badge: 'Changelog Hub',
    summary: 'Redesigned the Feedback page into a Patch Notes style Changelog & Feedback hub with complete timestamped release history going all the way back to the Nov 1, 2026 initial launch, and removed all fake seeded feedback entries.',
    changes: [
      { tag: 'Added', text: 'Patch Notes style Changelog & Feedback hub (/feedback) featuring a release dropdown, previous/next stepper, full timeline toggle, search filter, and EST release timestamps.' },
      { tag: 'Added', text: 'Backfilled complete site release history from the Nov 1, 2026 initial launch through all 3.30 Covens of Umbra upgrades.' },
      { tag: 'Improved', text: 'Updated Sidebar navigation label and page header to Changelog & Feedback and refreshed GitHub README documentation.' },
      { tag: 'Removed', text: 'Removed all fake seeded placeholder feedback posts and fake upvotes from client defaults and Cloud.' }
    ]
  },
  {
    id: 'rel-2026-11-22-pm',
    version: 'v3.30.4',
    title: 'Private League Hub Overhaul, Dedicated Mechanics Matrix & Wishlist Icons',
    dateEst: 'Nov 22, 2026 • 3:05 PM EST',
    isMajor: true,
    tier: 'major',
    badge: 'Major Milestone',
    summary: 'Separated Atlas Mechanics and Hall of Fame into dedicated Private League Hub pages, added automatic 12 hour ladder sync, and brought official Path of Exile item icons onto Wishlist cards.',
    changes: [
      { tag: 'Added', text: 'Dedicated Mechanics tab inside Private League Hub covering all 25 Atlas & Endgame mechanics (including Bestiary, Abyss, Beyond, Torment, Settlers, and more) with 1 click Claim / Drop lane syncing to Cloud.' },
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
    isMajor: false,
    tier: 'minor',
    badge: 'Tooling Expansion',
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
    isMajor: false,
    tier: 'minor',
    badge: 'Builds & Guides',
    summary: 'Condensed Community Guides and SSF Starters into one vetted Builds Hub with live Mobalytics and Maxroll pulling, upgraded PoB Build Doctor to sync straight into your League Roster, and connected all 13 compendium tools to Cloud.',
    changes: [
      { tag: 'Added', text: 'Live pobb.in and pastebin.com URL resolver in PoB Build Doctor plus 1 click Sync to Private League Roster (Main or Alt) and Parsed Character Vitals strip.' },
      { tag: 'Added', text: 'Live Mobalytics and Maxroll.gg build guide puller (/api/builds/external) for both PoE 1 and PoE 2.' },
      { tag: 'Added', text: 'Cloud user_tool_state cloud sync powering saved Regex Presets, Crafting Bench unlock checklists, Atlas Voidstone tracker, Campaign & Lab progress, and pinned Tools Directory favorites.' },
      { tag: 'Added', text: '1 click Load My League PoB Stats inside the Defense Mechanics interactive EHP Calculator.' },
      { tag: 'Improved', text: 'Consolidated PoE Wiki, PoEDB, and PoE Ninja portals with dynamic My Character & Wishlist quick lookup chips and fixed stale Settlers URLs to current challenge league.' },
      { tag: 'Fixed', text: 'Moved the Sidebar collapse toggle inside the header to prevent full screen clipping, normalized NZDT/NZST timezone labels, and reset seeded fake likes and ratings on build guides.' }
    ]
  },
  {
    id: 'rel-2026-11-22-early',
    version: 'v3.30.1',
    title: 'Global Session Security Gate, Privacy Policy, Cloud Stash Sync & SSF Weights',
    dateEst: 'Nov 22, 2026 • 3:45 AM EST',
    isMajor: false,
    tier: 'minor',
    badge: 'Security & Weights',
    summary: 'Hardened all state changing API endpoints with signed exile_session verification, published the Privacy Policy, added cross device Cloud stash persistence, and introduced editable SSF Utility weights.',
    changes: [
      { tag: 'Added', text: 'Global exile_session mutation gate enforcing verified session cookies and owner/admin checks across all POST, PUT, and DELETE Worker routes.' },
      { tag: 'Added', text: 'Dedicated Privacy Policy page (/privacy) linked from the Sidebar footer, live per tab scanning progress bar, and explicit DEMO DATA preview banner.' },
      { tag: 'Added', text: 'Cloud stash persistence across devices, transparent editable SSF Utility Weights drawer anchored to poe.ninja Chaos pricing, desktop drop notifications, and Exile Profile Farming Trophy Case.' },
      { tag: 'Added', text: 'Unique and Map stash tab API 0 visibility badges, EST post and edit timestamps on Official Patch Notes, and live GGG NZT + Local Timezone clock in Sidebar.' },
      { tag: 'Fixed', text: 'Fixed Free Stash share endpoint routing (/api/stash-drops) and synced account tag mapping.' },
      { tag: 'Removed', text: 'Removed legacy SSF Progress bar from the Sidebar.' }
    ]
  },
  {
    id: 'rel-2026-11-21-late',
    version: 'v3.30.0',
    title: 'Asset Tracker Launch, Regex Studio for PoE 1 & PoE 2 & Live GGG Patch Notes',
    dateEst: 'Nov 21, 2026 • 11:55 PM EST',
    isMajor: true,
    tier: 'major',
    badge: 'Major Milestone',
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
    isMajor: false,
    tier: 'minor',
    badge: 'Security Hardening',
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
    title: 'Cloud SQL Architecture, Live League Feed, Exile Profiles & Root Webhooks',
    dateEst: 'Nov 21, 2026 • 4:45 AM EST',
    isMajor: true,
    tier: 'major',
    badge: 'Major Milestone',
    summary: 'Migrated multiplayer data to a 16 table Cloud SQL database with PBKDF2 authentication, launched Exile Profiles and Live League Feed, and wired up Root webhooks and cron ladder syncing.',
    changes: [
      { tag: 'Added', text: 'Migrated core storage to 16 table Cloud SQL architecture with PBKDF2 salted password hashing.' },
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
    isMajor: false,
    tier: 'minor',
    badge: 'Bounties & Roster',
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
    isMajor: true,
    tier: 'major',
    badge: 'Major Milestone',
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
    id: 'rel-2026-11-02-auth',
    version: 'v1.1.0',
    title: 'Dedicated Auth Portals (/login, /register, /admin), SHA-256 Security & Unified Wishlists',
    dateEst: 'Nov 2, 2026 • 2:30 AM EST',
    isMajor: false,
    tier: 'minor',
    badge: 'Auth & Security',
    summary: 'Created dedicated, isolated authentication portals for /login, /register, and /admin, eliminated auto admin login on new devices, implemented client side SHA-256 admin password verification with 1 click Google account linking, and merged Who Needs This Item with Wishlists & Needs.',
    changes: [
      { tag: 'Added', text: 'Dedicated /login page supporting Google Auth and custom Exile SSF app username and password without admin prompts.' },
      { tag: 'Added', text: 'Dedicated /register page with a two step onboarding flow linking Path of Exile public profile URL, account name, IGN, primary contact channel, and starter ascendancy.' },
      { tag: 'Added', text: 'Dedicated /admin executive portal with browser side SHA-256 password verification and 1 click Google account linking.' },
      { tag: 'Added', text: 'Cryptographic SHA-256 utility in src/utils/crypto.ts ensuring zero plain text admin secrets exist in source code or git history.' },
      { tag: 'Improved', text: 'Unified "Who Needs This Item?" and "Wishlists & Needs" into a single comprehensive Squad Wishlist tab with By Item, By Player, and Table view modes.' },
      { tag: 'Fixed', text: 'Prevented new visitors from defaulting to the @Leuie host admin account on unauthenticated visits.' },
      { tag: 'Fixed', text: 'Simplified unauthenticated action buttons across sidebar and league headers to display strictly "Login".' }
    ]
  },
  {
    id: 'rel-2026-11-01-launch',
    version: 'v1.0.0',
    title: 'Initial Production Launch of Exile SSF Compendium, GSF Portal & Authentication',
    dateEst: 'Nov 1, 2026 • 10:45 PM EST',
    isMajor: true,
    tier: 'major',
    badge: 'Genesis Launch',
    summary: 'First production release of Exile SSF on exilessf.app featuring the SSF Compendium, Group Self Found (GSF) portal, guide ingestion engine, and secure account authentication.',
    changes: [
      { tag: 'Added', text: 'Launched Exile SSF (exilessf.app) on Cloudflare Workers with full SSF Compendium, GSF portal, guide ingestion engine, private league crowdfund ingestion, and community feedback hub.' },
      { tag: 'Added', text: 'Dedicated /login, /register, and /admin routes with Exile SSF app credentials and secure Google account linking.' },
      { tag: 'Added', text: 'Covens of Umbra hero artwork, Ravenwatch Root integration, collapsible navigation categories, and responsive gaming utility layout for desktop, tablet, and mobile.' },
      { tag: 'Fixed', text: 'Eliminated plain text secrets, prevented default admin auto login, and migrated SPA routing to native wrangler.jsonc static assets.' }
    ]
  }
];
