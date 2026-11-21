# EXILE SSF: Path of Exile 1 & 2 Compendium and GSF Portal

<div align="center">

```text
  ███████╗██╗  ██╗██╗██╗     ███████╗    ███████╗███████╗███████╗
  ██╔════╝╚██╗██╔╝██║██║     ██╔════╝    ██╔════╝██╔════╝██╔════╝
  █████╗   ╚███╔╝ ██║██║     █████╗      ███████╗███████╗█████╗  
  ██╔══╝   ██╔██╗ ██║██║     ██╔══╝      ╚════██║╚════██║██╔══╝  
  ███████╗██╔╝ ██╗██║███████╗███████╗    ███████║███████║██║     
  ╚══════╝╚═╝  ╚═╝╚═╝╚══════╝╚══════╝    ╚══════╝╚══════╝╚═╝     
```

**Live Domain:** [exilessf.app](https://exilessf.app) • **Active League:** [Ravenwatch Covens of Umbra GSF (PL87651)](https://exilessf.app/league/poe1-330-umbra) • **Platforms:** Path of Exile 1 (3.30.0d) & Path of Exile 2 (0.5 Ancients)

[![Domain](https://img.shields.io/badge/Domain-exilessf.app-0ea5e9?style=for-the-badge&logo=cloudflare&logoColor=white)](https://exilessf.app)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare_Workers-KV_Edge_Sync-F38020?style=for-the-badge&logo=cloudflareworkers&logoColor=white)](https://workers.cloudflare.com)
[![Vite](https://img.shields.io/badge/Vite-8.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Path of Exile](https://img.shields.io/badge/PoE_1-3.30.0d_Covens_of_Umbra-b45309?style=for-the-badge)](https://www.pathofexile.com/umbra)
[![Path of Exile 2](https://img.shields.io/badge/PoE_2-0.5_Return_of_the_Ancients-0284c7?style=for-the-badge)](https://pathofexile2.com/ancients)

</div>

## Executive Overview

**EXILE SSF** ([exilessf.app](https://exilessf.app)) is a comprehensive educational compendium and live cloud synced Group Self Found (GSF) private league portal engineered for exiles across the entire **Path of Exile series**.

Built to replace scattered browser tabs, eliminate trade friction, and deliver deterministic game knowledge in an agile interface. Whether you are progressing Solo Self Found from Twilight Strand to 4 Voidstones or coordinating loot sharing inside **Ravenwatch Covens of Umbra GSF (PL87651)**, **EXILE SSF** provides real time Cloudflare KV synchronization, reverse drop matching, build diagnostics, and up to date 3.30.0d patch mechanics.

## Core Capabilities and Feature Modules

### 1. Group Self Found Private League Hub (PoE 1 & PoE 2)
Modular private league coordination portal supporting concurrent seasons (**PoE 1 3.30 Covens of Umbra** and **PoE 2 0.5 Return of the Ancients**) backed by Cloudflare KV global edge storage:
* **Command Center (`CommandCenterTab.tsx`)**: Hero launch banner, official crowdfund and slot progress trackers, live reveal and launch countdown timers, 4 step onboarding guide, Ravenwatch and NOIR Guild community hub links, editable resource links, past league archives, and collapsible FAQ accordions.
* **Wishlists, Needs, and Reverse Drop Matcher (`WishlistsTab.tsx`)**: Unified loot sharing engine with three views (`By Item`, `By Player`, and `Table`). Aggregates squad wishlists so anyone who drops a unique, transfigured gem, divination card, or crafting base can search the item name, inspect PoE Wiki and PoEDB drop info, and notify requesters in one click.
  * **Squad Bounty & Fulfillment Heroes**: Tracks and celebrates squadmates who fulfill wanted items for others.
  * **Smart Acquired State (`HAVE`)**: Items marked as `HAVE` persist immediately to Cloudflare KV, remain visible on the card grid with an emerald border sorted to the end, and filter cleanly under the `HAVE` status selector.
* **Roster Directory and Admin Controls (`RosterTab.tsx`)**: Live squad directory with planned starter builds, ascendancy distribution, character levels, launch day availability, and player profile inspection dialogs.
  * **Host and Admin Management**: Dedicated Admin Mode enabling league hosts to remove inactive characters or players and reassign character ownership directly in the UI with instant cloud sync.
  * **Direct Invite and Join Deep Links**: Shareable registration links (`?join=true`) with native HTML5 dialogs for frictionless squad onboarding.
* **Community Build Guides (`BuildGuidesTab.tsx`)**: Searchable, sortable community starter guides with class filter pills, upvoting, full reader mode (`FullGuideReaderView`), Path of Building links, and one click import of required uniques straight into your personal wishlist.
* **Mechanic Cheat Sheets (`CheatSheetsTab.tsx`)**: Interactive searchable reference tables covering **3.30.0c and 3.30.0d Threads of Creation Thresholds** (guaranteed modifiers and 3 to 1 vendor recipe), Betrayal Immortal Syndicate rewards, Heist Rogues, Delve Fossil biomes, Incursion Temple rooms, and Atlas Map Ratings.
* **Bench and Stash Guide (`BenchGuideTab.tsx`)**: Essential crafting bench unlock locations and prioritized stash tab buyer tiers.
* **Alumni Directory and Outreach Hub (`AlumniTab.tsx`)**: Preserves over 100 past participants across 5 historical NOIR private leagues with one click outreach actions (in game `/whisper`, Root App user tags, Discord handles, nudge status toggles) and a Clean Slate Season Reset modal.

### 2. Path of Exile 1 (3.30.0d) Patch Alignment
All PoE 1 tips, progression guides, vendor recipes, and mechanic tables reflect the full post launch 3.30 patch cycle through **3.30.0d Hotfix 2**:
* **Threads of Creation Formulas**: Applying 1 to 3 Threads guarantees at least 1 modifier; 4 to 7 Threads guarantees at least 2 modifiers; 8 or more Threads guarantees at least 3 modifiers. Any 3 unwanted Threads vendor for 1 fresh random Thread of Creation.
* **Updated League Mechanics**: Reflects post launch adjustments across all 3.30 hotfixes and patches (`3.30.0b`, `3.30.0c`, and `3.30.0d`).

### 3. Dynamic Contact Tagging System
Respects player platform preferences without forcing a single chat app:
* **Root Web App Tag**: Primary Ravenwatch and NOIR community handle (`@Leuie`)
* **In Game Whisper**: Direct character whisper commands (`/whisper CharacterName ...`) and global channel (`/global 5712`)
* **Path of Exile Account Tag**: Official GGG account identifier (`Account#1234`)
* **Optional Handles**: Discord and Steam profiles

### 4. Build Guide Ingestion, PoB Build Doctor, and Compendium Utilities
* **Build Guide Ingestion Engine**: Parses `pobb.in` links, raw XML/base64 Path of Building codes, YouTube breakdowns, Maxroll, and official forum threads with automatic creator attribution.
* **PoB Build Doctor**: Client side compressed XML decoder (`pako`) evaluating elemental resistance caps (75%), Chaos resistance, physical mitigation, life pools, and spell suppression.
* **Community Feedback and Roadmap Hub**: User submitted feature requests, bug reports, status badges (`Under Review`, `Planned`, `In Progress`, `Implemented`), and upvoting.
* **Progression Checklists and Vendor Recipes**: Act 1 through 10 walkthroughs, Atlas Voidstone progression, Lord's Labyrinth notes, and deterministic crafting recipes.

## Modular Architecture and Cloud Sync Workflow

The Private League Hub uses a clean, declarative tab router (`PrivateLeagueHubView.tsx`) that delegates domain state and rendering to seven isolated tab modules inside `src/components/league/tabs/`, paired with a Cloudflare Worker API (`worker/index.ts`) for real time KV persistence.

```mermaid
flowchart TD
    User["Exile Browser (exilessf.app)"] --> Worker["Cloudflare Worker (Static Assets + API)"]
    Worker --> App["React 19 App Shell"]

    subgraph "Private League Hub Router (PrivateLeagueHubView.tsx)"
        App --> Tab1["CommandCenterTab.tsx"]
        App --> Tab2["WishlistsTab.tsx"]
        App --> Tab3["RosterTab.tsx"]
        App --> Tab4["BuildGuidesTab.tsx"]
        App --> Tab5["CheatSheetsTab.tsx"]
        App --> Tab6["BenchGuideTab.tsx"]
        App --> Tab7["AlumniTab.tsx"]
    end

    subgraph "Cloudflare Edge Persistence"
        Tab2 <--> Sync["cloudSync.ts (No Cache Polling & Focus Sync)"]
        Tab3 <--> Sync
        Tab4 <--> Sync
        Sync <--> API["/api/data, /api/wishlist, /api/roster, /api/guides"]
        API <--> KV[("Cloudflare KV (EXILE_KV)")]
    end
```

### Project Directory Structure

```text
exile-ssf/
├── src/
│   ├── components/
│   │   ├── PrivateLeagueHubView.tsx      # Clean tab router, session manager, and global modals
│   │   ├── LeagueHeroBanner.tsx          # Dynamic PoE 1 & PoE 2 league launch banner
│   │   ├── LeagueContentManagerModal.tsx # Admin editor for quick links, archives, and FAQs
│   │   ├── FullGuideReaderView.tsx       # Interactive build guide reader with wishlist import
│   │   └── league/
│   │       └── tabs/
│   │           ├── CommandCenterTab.tsx  # Countdowns, crowdfund bar, onboarding, archives, FAQ
│   │           ├── WishlistsTab.tsx      # Drop matcher, fulfillment heroes, item inspector
│   │           ├── RosterTab.tsx         # Squad grid, profile modal, admin controls
│   │           ├── BuildGuidesTab.tsx    # Guide cards, search, class pills, upvotes
│   │           ├── CheatSheetsTab.tsx    # 3.30.0d Threads, Betrayal, Heist, Delve, Incursion, Maps
│   │           ├── BenchGuideTab.tsx     # Bench unlock locations & stash tab tiers
│   │           └── AlumniTab.tsx         # Past league records & admin outreach tools
│   ├── data/                             # Static compendiums, 3.30.0d cheat sheets, initial records
│   ├── services/
│   │   └── cloudSync.ts                  # Edge KV API client with optimistic UI updates
│   ├── types/                            # Strict TypeScript interfaces
│   └── utils/                            # Confetti effects and PoB decoding helpers
├── worker/
│   └── index.ts                          # Cloudflare Worker serving Static Assets and KV REST API
└── wrangler.jsonc                        # Cloudflare Workers deployment & EXILE_KV binding config
```

## Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | React 19.2 + TypeScript 6.0 | Strict type safe modular component architecture |
| **Build Tool** | Vite 8.2 | Rapid hot module replacement and production bundling |
| **Styling** | Tailwind CSS 3.4 | Dark gaming utility aesthetic (`bg-slate-900/80`, `border-slate-800`) |
| **Icons** | Lucide React 1.32 | Crisp interface and monospace iconography |
| **Compression** | Pako 3.0 | Client side Path of Building zlib XML decompression |
| **Dialogs** | HTML5 `<dialog>` | Native accessible modals with `closedby="any"` light dismiss |
| **Linting** | Oxlint 1.75 | High speed static analysis |
| **Hosting & Edge DB** | Cloudflare Workers + KV (`EXILE_KV`) | Global static asset delivery, SPA routing, and low latency JSON storage |

## Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Leuie/exile-ssf.git
   cd exile-ssf
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```
   Open your browser to `http://localhost:5173/`.

4. **Verify TypeScript and Production Build:**
   ```bash
   npm run build
   ```
   This runs `tsc -b && vite build` to ensure zero type errors or unused variable warnings before deployment.

5. **Preview the production bundle:**
   ```bash
   npm run preview
   ```

## Deployment via Cloudflare Workers Static Assets

The repository deploys automatically to [exilessf.app](https://exilessf.app) via Cloudflare Workers Static Assets configured in `wrangler.jsonc`:
* **Build Command**: `npm run build` (`tsc -b && vite build`)
* **Deploy Command**: `npx wrangler deploy`
* **Static Assets Directory**: `./dist` with `single-page-application` fallback routing
* **KV Binding**: `EXILE_KV` namespace storing per league wishlists, rosters, and community guides with `Cache-Control: no-store` headers for instant cross client updates.

## Community and Contributing

Built with care for **Ravenwatch** and the **NOIR Group Self Found Community**.
* **Official GSF Server**: [Ravenwatch on Root](https://rootapp.gg/AC1NPUuJiQqlyDvGbgH-8A)
* **Guild Headquarters**: [NOIR Guild HQ on Root](https://rootapp.gg/AC01VYpHiAq1rM0An8FDzw)
* **In Game Channel**: `/global 5712`
* **Feature Requests**: Submit ideas directly through the on site [Feedback and Roadmap Hub](https://exilessf.app).
