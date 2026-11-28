# EXILE SSF: Path of Exile 1 & 2 Compendium, Character Armory, Asset & Map Trackers, and GSF Portal

<div align="center">

```text
  ███████╗██╗  ██╗██╗██╗     ███████╗    ███████╗███████╗███████╗
  ██╔════╝╚██╗██╔╝██║██║     ██╔════╝    ██╔════╝██╔════╝██╔════╝
  █████╗   ╚███╔╝ ██║██║     █████╗      ███████╗███████╗█████╗  
  ██╔══╝   ██╔██╗ ██║██║     ██╔══╝      ╚════██║╚════██║██╔══╝  
  ███████╗██╔╝ ██╗██║███████╗███████╗    ███████║███████║██║     
  ╚══════╝╚═╝  ╚═╝╚═╝╚══════╝╚══════╝    ╚══════╝╚══════╝╚═╝     
```

**Live Domain:** [exilessf.app](https://exilessf.app) • **Version:** `v3.47.0` • **Platforms:** Path of Exile 1 (3.30 Covens of Umbra) & Path of Exile 2 (0.5 Return of the Ancients)

[![Domain](https://img.shields.io/badge/Domain-exilessf.app-0ea5e9?style=for-the-badge&logo=cloudflare&logoColor=white)](https://exilessf.app)
[![Cloudflare D1](https://img.shields.io/badge/Cloudflare_D1-SQLite_Edge_DB-F38020?style=for-the-badge&logo=cloudflareworkers&logoColor=white)](https://developers.cloudflare.com/d1/)
[![Vite](https://img.shields.io/badge/Vite-8.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Path of Exile](https://img.shields.io/badge/PoE_1-3.30_Covens_of_Umbra-b45309?style=for-the-badge)](https://www.pathofexile.com/umbra)
[![Path of Exile 2](https://img.shields.io/badge/PoE_2-0.5_Return_of_the_Ancients-0284c7?style=for-the-badge)](https://pathofexile2.com/ancients)

</div>

## Executive Overview

**EXILE SSF** ([exilessf.app](https://exilessf.app)) is an installable, Offline Ready desktop PWA and dual game **Path of Exile 1 & Path of Exile 2** Solo Self Found compendium, **Character Armory**, **Asset & Map Tracker**, and **Cloudflare D1** powered **Private League & GSF Hub** engineered for solo players and cooperative Group Self Found squads.

Built as a cohesive second monitor farming cockpit, **EXILE SSF** unites a single **Unified Tool Setup** wizard (shared `POESESSID` + `Client.txt`), draggable/resizable **Workspace Grids**, an interactive **Official GGG Passive & Atlas Skill Tree** suite, live stash net profit analytics, realtime `Client.txt` map & Delve XP telemetry, cooperative GSF social tooling, dynamic **Open Graph Share Cards**, and hardened HMAC signed session security.

## Core Capabilities and Feature Modules

### 1. Character Armory (`/armory`) & Build Intelligence
Full width character inspector (`CharacterArmoryView.tsx`, `src/components/profile/*`, `src/utils/poeCalcEngine.ts`, `src/utils/pobEncoder.ts`):
* **Unified PoB-Grade Calculation Engine (`poeCalcEngine.ts`)**: Computes live Attributes, Life, Energy Shield, Armour (with PDR%), Evasion (with exact Evade%), Block/Spell Block, Spell Suppression, In-Game `Cap% (+Overcap%)` Resistances, 5-Type Maximum Hit Taken, Effective Hit Pool (EHP), and Weapon/Main-Skill Offense — with interactive PoB Config toggles (Charges, Fortify, real equipped Flask Effect & Progenesis, Major/Minor Pantheons, Guard Skills, Bandits, Auras, and Enemy Presets) and declarative Keystone rules (CI, RT, Unwavering Stance, Iron Reflexes, EB/MoM, Divine Flesh, Acrobatics).
* **Equipment Paperdoll, Cluster Jewel Notables & Official Passive Tree**: Live GGG gear sync with full item tooltips, Prefix/Suffix affix tiers, Cluster Jewel notable badges, Timeless Jewel seeds, backpack extraction, and a touch/pinch-zoom Official GGG Passive Skill Tree canvas.
* **PoB XML Export (`Copy PoB Code`), Gem Audit, Build Upgrade Advisor & Side-by-Side PoB Diff**: Export valid zlib-compressed PoB codes, audit Lv 20 GCP / Vaal corruption gems, flag build-aware gear upgrades, and compare your character side-by-side against any `pobb.in` or squadmate.

### 2. Asset Tracker (`/assets`), Wealth Analytics (`/assets/analytics`) & Map Tracker (`/maps`)
Unified farming workspaces (`AssetTrackerView.tsx`, `WealthAnalyticsView.tsx`, `MapTrackerView.tsx`, `src/components/assets/*`, `src/components/maps/*`, `worker/routes/assets.ts`):
* **Asset Tracker (`/assets`)**: Standardized **18 Slot Canonical Tab Mapper**, draggable/touch-reorderable `<ToolWidgetGrid />`, **Map Cost vs Profit Net Calculator**, live **`poe.ninja`** pricing with **`SSF Utility`** toggle, **Squad Wishlist Auto-Alerts**, Guild Stash API (`/api/farming/guild-stash`), per-league cloud persistence, opt-in Wealth Ladder publishing, and `.xlsx` export.
* **Map Tracker (`/maps`), Daily Mapping Calendar & Client.txt Telemetry**:
  * **Daily Mapping Calendar (`DailyMappingCalendar.tsx`)**: Monthly at-a-glance calendar showing maps run per day with click-to-inspect daily breakdowns (top maps, avg duration, deaths, strategies, and saved sessions).
  * **Deep Client.txt Telemetry (`clientTxtTelemetry.ts`)**: Live NPC Mechanic Spawn Counter (Harvest, Expedition, Betrayal, Blight, Ultimatum), **Nameless Seer alerts**, Death Forensics Log, GSF Trade Ledger, `/passives` & `/played` auto-auditor, Instance Crash/DC monitor, and **Campaign Walkthrough Auto-Checklist** sync.
  * **Official GGG Atlas Skill Tree Planner**: Touch/pinch-zoom official Atlas canvas (`150` point cap: `132 + 18 Maven`), shortest-path auto-allocation, branch refunds, and `Show Stats` modifier totalizer.

### 3. Private League & GSF Hub (`/privateleaguehub` & `/league/:id`) & Path of Exile 2 Parity
Cooperative Group Self Found hub for Path of Exile 1 and Path of Exile 2:
* **Organized League Tabs**: Command Center, Live Feed, Wishlists (with Loot Filter & Stash Regex generator), Bounties, Roster, 25 Mechanic Matrix, **Hall of Fame** & **Wealth Ladder**, Builds, Cheat Sheets, **Crafting Bench** (with integrated **Craft & Fracture Queue**), **Item Loans**, **5×5 League Bingo**, and Alumni.
* **Path of Exile 2 Compendium**: Dedicated **Endgame Atlas & Waystones** tracker, **Acts 1–3 + Cruel** permanent bonus walkthrough, **Trials of Ascendancy (0/8)** tracker, PoE 2 10x Armour & Penetration math, Salvage formulas, and strict PoE 1 vs PoE 2 data isolation.
* **Mobile, Tablet & Automated Quality Gate**: Edge-to-edge safe-area support, 44px touch targets, mobile bottom navigation bar, Route Error Boundaries, `tsconfig.worker.json` worker typechecking, 0 `oxlint` errors, and GitHub Actions Node 24 CI running `npm test && npm run lint -- --quiet && npm run build`.

### 4. Compendium, Exile Profiles (`/exile/:handle`), Dynamic OG Cards & Offline PWA
* **Dynamic Open Graph Share Cards (`/api/og/card`)**: Auto generated 1200×630 dark fantasy preview cards injected into `/exile/:handle`, `/armory/:handle`, `/league/:id/hall-of-fame`, and shared Atlas links when pasted into Discord or Root, plus a 1 click **Share Card** button on Exile Profiles.
* **Offline Ready Desktop PWA Mode**: Upgraded Service Worker (`public/sw.js`) with Stale While Revalidate static caching and offline SPA fallback for **Cheat Sheets**, **Vendor Recipes**, and **Regex Studio**, desktop jump list shortcuts (`manifest.webmanifest`), and a 1 click **`Install Desktop App`** button + live **Offline Mode** indicator in the Sidebar.
* **Unified Builds Hub (`/builds`), Official Patch Notes (`/patch-notes`) & Compendium**: Live Mobalytics/Maxroll puller, PoB Build Doctor, live GGG patch notes with EST timestamps, cloud synced **Regex Studio**, **Defenses Masterclass** EHP Calculator, **Offenses** pipeline, **Sabrewulf Crafting Bench**, **Campaign & Lab** checklists, **Ctrl+K Quick Finder**, and live **GGG NZDT/NZST + Local Timezone** clock.
* **Security & Privacy (`/privacy`)**: Unified `POESESSID` manager (`src/utils/poeSession.ts`) with permanent one time disclaimer, strict HMAC SHA256 signed `HttpOnly; Secure; SameSite=Lax` `exile_session` cookie enforced globally on all state changing routes, and automatic Vite chunk reload recovery (`lazyWithRetry` + `AppErrorBoundary`).

## Modular Architecture and Cloudflare Edge Stack

```mermaid
flowchart TD
    User["Exile Browser / Offline Desktop PWA / Root / Discord"] --> Worker["Cloudflare Worker (Static Assets + Dynamic OG Cards + Global Auth Gate)"]
    Worker --> AssetAPI["worker/routes/assets.ts (/api/farming/*)"]
    Worker --> SocialAPI["worker/routes/social.ts (Presence, GSF Social, Daily Digest Cron)"]
    Worker --> OgAPI["worker/routes/og.ts + seo.ts (/api/og/card & Meta Injector)"]
    Worker --> AdminAPI["worker/routes/admin.ts (Staff, Webhooks, Super Admin)"]
    Worker --> App["React 19 App Shell (lazyWithRetry + AppErrorBoundary)"]

    subgraph "Core Hubs & Modular Workspaces"
        App --> Armory["CharacterArmoryView (/armory + GGG Passive Tree + PoB Export + Diff)"]
        App --> Assets["AssetTrackerView (/assets + Net Profit + CanonicalTabMapper + Grid)"]
        App --> Maps["MapTrackerView (/maps + Atlas Tree + Delve/Boss/Splits Telemetry)"]
        App --> Hub["PrivateLeagueHubView (Presence Bar, Command, Feed, Wishlists, GSF Social, Hall of Fame)"]
        App --> Tools["BuildsHub / PatchNotes / RegexStudio / VendorRecipes / CheatSheets"]
    end

    subgraph "Cloudflare Edge Storage"
        Worker <--> D1[("Cloudflare D1 SQLite (EXILE_DB: Atomic Tables incl. user_tool_state)")]
        Worker <--> KV[("Cloudflare KV (Presence TTL, poe.ninja 60m, Patch Notes 30m, Ladder 5m)")]
        AssetAPI <--> External["poe.ninja Economy & Icons API + Official GGG APIs"]
    end
```

### Key Directories

```text
exile-ssf/
├── public/
│   ├── manifest.webmanifest                # Standalone PWA metadata & desktop jump list shortcuts
│   ├── sw.js                               # Offline-ready SWR Service Worker (Cheat Sheets, Recipes, Regex)
│   └── achievements/umbra-witch-330.jpg    # Custom 3.30 Coven of Umbra Witch Medallion
├── src/
│   ├── components/
│   │   ├── CharacterArmoryView.tsx         # Paperdoll, GGG Passive Tree, PoB Export, Gem Audit, Upgrade Advisor, Diff
│   │   ├── AssetTrackerView.tsx            # 18-tab stash scanner, Net Profit Calculator, SVG analytics, Grid
│   │   ├── WealthAnalyticsView.tsx         # Full-page Wealth & Pace executive dashboard
│   │   ├── MapTrackerView.tsx              # Client.txt Live Watch, Atlas Tree Planner, Delve XP, Boss Rush, Splits
│   │   ├── PrivateLeagueHubView.tsx        # League Hub, Squad Presence Bar, Wishlists, Bounties, GSF Social, Manage
│   │   ├── ExileProfilePage.tsx            # Cross-game /exile/:handle passport & Share Card preview
│   │   ├── ToolSetupModal.tsx              # Unified 3-step POESESSID & Client.txt setup wizard
│   │   ├── armory/                         # PassiveTreeCanvas, GemAuditPanel, BuildUpgradeAdvisor, CharacterDiffModal
│   │   ├── assets/                         # assetEngine, CanonicalTabMapper, MapCostCalculatorWidget, WeightsEditor
│   │   ├── maps/                           # AtlasSkillTreePlanner, SpecializedTelemetrySuite, MapAnalyticsCharts
│   │   ├── league/                         # GsfSocialTab, SquadPresenceBar, WishlistsTab, WishlistFilterExportModal
│   │   └── common/                         # ToolWidgetGrid (draggable/resizable/collapsible workspace cards)
│   ├── data/
│   │   ├── plannedRoadmap.ts               # Public Roadmap tracker (100% shipped through v3.40.0)
│   │   └── siteChangelog.ts                # Timestamped release history
│   └── utils/
│       ├── pobEncoder.ts                   # Live Character -> Path of Building XML/zlib encoder
│       ├── poeSession.ts                   # Unified local POESESSID & one-time disclaimer helper
│       ├── activeCharacter.ts              # Shared Active Character & Linked Strategy Profile context
│       ├── spreadsheetEngine.ts            # Zero-dependency styled multi-tab .xlsx builder
│       └── poeItemParser.ts                # Ctrl+C tooltip parser & PoB decoder
├── worker/
│   ├── index.ts                            # Cloudflare Worker, Global Auth Gate, D1 schema, Cron scheduler
│   └── routes/
│       ├── assets.ts                       # /api/farming/* (Stash, poe.ninja, Character XP, Cloud State)
│       ├── social.ts                       # /api/league/presence, /api/league/social, Daily Digest cron & trigger
│       ├── og.ts                           # /api/og/card dynamic 1200x630 Open Graph SVG preview cards
│       ├── seo.ts                          # Dynamic HTML meta & og:image / twitter:image injector
│       └── admin.ts                        # Staff governance, per-league webhooks, Super Admin console
└── wrangler.jsonc                          # Cloudflare Workers config (EXILE_DB D1, EXILE_KV, 10m Cron)
```

## Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | React 19.2 + TypeScript 6.0 | Strict type safe code split architecture with automatic chunk recovery |
| **Build Tool** | Vite 8.2 | Fast HMR and chunked production bundles |
| **Styling** | Tailwind CSS 3.4 | Unified dark obsidian utility theme |
| **Database** | Cloudflare D1 (`EXILE_DB`) | Atomic SQLite edge storage for league data, armory snapshots, wishlists, and `user_tool_state` |
| **Cache & Cron** | Cloudflare Workers + KV (`EXILE_KV`) | Dynamic OG cards, Squad Presence heartbeats, 60m `poe.ninja` cache, Ladder & 8 PM Daily Digest Cron |
| **Offline PWA** | Service Worker + Web App Manifest | Standalone desktop app install, jump list shortcuts, offline Cheat Sheets / Recipes / Regex |
| **Security** | HMAC SHA256 `exile_session` | `HttpOnly; Secure; SameSite=Lax` cookies enforced on all state changing API routes |

## Local Development Setup

1. **Clone and install:**
   ```bash
   git clone https://github.com/Leuie/exile-ssf.git
   cd exile-ssf
   npm install
   ```
2. **Start local dev server:**
   ```bash
   npm run dev
   ```
3. **Verify TypeScript & build:**
   ```bash
   npm run build
   ```
