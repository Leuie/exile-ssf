# Exile SSF: Complete Project Knowledge & Architecture Guide

This document captures all domain knowledge, architectural decisions, design tokens, data models, and strict guidelines established for the **Exile SSF** platform. Use this file or conversation reference to seamlessly integrate this project into parent or related applications.

---

## 🔗 1. Quick Cross-Conversation Reference

* **Conversation ID**: `7ad2b08b-25b5-4ecb-a59e-77583058e326`
* **Conversation Link**: `[Exile SSF Project Session](conversation://7ad2b08b-25b5-4ecb-a59e-77583058e326)`
* **Codebase Location**: `D:\Projects\exile-ssf`
* **Transcript Logs**: `C:\Users\migue\.gemini\antigravity\brain\7ad2b08b-25b5-4ecb-a59e-77583058e326\.system_generated\logs\transcript.jsonl`

---

## 🎨 2. Design System & Zorbble Theming Tokens

The project mirrors the high-tech gaming aesthetic of **Zorbble**:

### Color Palette
* **Deep Cosmic Slate (Background)**: `#0f172a` (`zorbble-bg` / `--color-background`)
* **Dark Violet Surface (Cards & Panels)**: `#1a1a2e` (`zorbble-surface` / `--color-surface`)
* **Elevated Slate (Inputs & Nested Items)**: `#2d2d44` (`zorbble-surface-light` / `--color-surface-light`)
* **Structural Borders**: `#2d2d44` (Default), `#3f3f5f` (Hover/Active)
* **Primary Neon Accent**: `#6366f1` (Electric Indigo) • `#818cf8` (Light) • `#4f46e5` (Dark)
* **Secondary Neon Accent**: `#8b5cf6` (Amethyst Purple) • `#a78bfa` (Light) • `#7c3aed` (Dark)
* **Accent Gold / Currencies**: `#fbbf24` (Golden Amber Glow)
* **Status Badges**: Coral Red `#ef4444` (Critical), Electric Emerald `#10b981` (Optimal), Cyan `#06b6d4` (PoE 2 / Mana)

### Multi-Font Typography
* **`Orbitron` (`font-orbitron`)**: High-tech stats, vitals, scores, and delta numbers in the PoB Build Doctor.
* **`Poppins` (`font-poppins`) & `Cinzel` (`font-poe`)**: Bold headers, section titles, and brand wordmarks (`zorbble-wordmark-gradient`).
* **`Inter` (`font-sans`)**: Crisp, readable body and UI text.
* **`Fira Code` (`font-mono`)**: Code snippets, XML formulas, and raw numerical values.

### Glassmorphism & Effects
* **Glassmorphism**: `.gaming-bg-glass` (`background: rgba(26, 26, 46, 0.85); backdrop-filter: blur(12px); border: 1px solid rgba(99, 102, 241, 0.2);`)
* **Neon Glows**: `.gaming-glow`, `.gaming-glow-purple`, `.gaming-glow-gold`, `.gaming-text-glow`
* **Vibrant Scrollbars**: Thumb with `linear-gradient(180deg, #6366f1 0%, #8b5cf6 100%)`

---

## ⚠️ 3. Strict Copy & Editorial Guidelines

* **The No Hyphens Rule**: Never use hyphens in visible user copy. Always write:
  * `Solo Self Found` (not `Solo-Self-Found`)
  * `self reliance` (not `self-reliance`)
  * `3 to 1` (not `3-to-1`)
  * `in depth` (not `in-depth`)
  * `one shot` (not `one-shot`)
  * `multi target` / `single target` (not `multi-target` / `single-target`)
  * `end game` (not `end-game`)
  * `side by side` (not `side-by-side`)
  * `10 Point` (not `10-Point`)
  * `A to Z` (not `A-to-Z`)
  * `6 link` / `4 link` / `5 link` (not `6-link`)
  * `life on block` / `recovery on block` (not `life-on-block`)

---

## ⚔️ 4. Path of Exile Series Knowledge & Current Leagues

* **PoE 1 Current League**: `3.29 Curse of the Allflame` $\rightarrow$ `https://www.pathofexile.com/allflame`
* **PoE 2 Current League**: `0.5 Return of the Ancients` $\rightarrow$ `https://pathofexile2.com/ancients`
* **Scion Ascendancies**: Ascendant, Reliquarian, Luminary.
* **Homepage Slogan**: *"Helping you to master self reliance in Path of Exile!"*

---

## 🩺 5. PoB Character Analyzer & Build Doctor Engine

Located in `src/utils/pobDecoder.ts`, `src/utils/buildAnalyzer.ts`, and `src/components/BuildAnalyzerView.tsx`:

1. **Client-Side PoB Decompression**:
   * Decodes Base64 strings directly in browser memory using `pako` deflate decompression and `TextDecoder` (zero server transmission).
2. **Universal XML Parser**:
   * Traverses all `<Skill>` and `<SkillSet>` tags to detect all socketed gems (`Elemental Weakness`, `Wave of Conviction`, `Penance Brand`, etc.).
   * Traverses all `<Slot>` and `<ItemSet>` equipment cards to extract Eldritch implicits, crafted mods, and explicit affixes.
3. **Pseudo-Link Multiplier Detection**:
   * Scans items for built-in support affixes (e.g. Essence of Horror *"Socketed Gems deal 30% more Elemental Damage"*, Elder/Shaper *"Socketed Gems are Supported by Level 20 Burning Damage / Concentrated Effect"*, Essence of Delirium, The Squire).
   * Computes **Effective Links = Sockets + Pseudo Multipliers** (e.g., 4 Sockets + 2 Gear Multipliers = Effective 6 Link Setup).
4. **Defense Archetype Recognition**:
   * Identifies `Block & Recovery on Block Tank` (Aegis Aurora ES on block, Shaper life on block, Glancing Blows) and `Armour & Energy Shield Bulk`.
   * **No False Penalties**: Does not penalize Armour/ES/Block builds for lack of spell suppression.
   * Recognizes capped Chaos Resistance (75%) and physical-to-elemental damage shift.
5. **Chromatic Coloring Calculator**:
   * Reads base item Str/Dex/Int requirements vs socket color demands (R/G/B/W) to compute Vorici bench recommendations and estimated Chromatic Orb costs.
6. **Interactive What-If Upgrade Simulator**:
   * Dynamically filters upgrade options based on character vitals (suppression, block cap, physical shift, +gem levels, flask quality) with real-time score and letter grade recalculation.

---

## 🧙‍♂️ 6. Penance Brand Ignite Elementalist Architecture

Featured in `src/components/BuildsShowcaseView.tsx`:
* **4 Golem Engine**: Flame (damage), Stone (life regen), Chaos (physical reduction), Lightning (cast speed) via *Liege of the Primordial* and *Elemancer*.
* **Triple Herald Stacker**: *Herald of Ash*, *Herald of Purity*, and *Herald of Thunder* amplified by *Heraldry* and *Endbringer* cluster passives.
* **Autobomber Screen Clear**: Combines Searing Exarch glove ignite spread implicit with Crusader physical explode chest.
* **Boss Single Target**: Standard Penance Brand rapidly stacks 20 energy pulses with *Swiftbrand Support* for maximum ignite ticks.
* **Helmet Setup**: 4-socket helmet with Essence of Horror (30% More Elemental Damage) + Elder Level 20 Burning Damage Support (Effective 6 Link).
* **Defenses**: Attack/Spell Block with Life and ES on Block recovery.
* **Chase Unique**: *Lost Unity* ring.

---

## 📁 7. File Map & Directory Structure

```
D:\Projects\exile-ssf\
├── src/
│   ├── types/
│   │   ├── analyzer.ts          # ParsedPoBStats, ParsedItem, ParsedSkillGroup, DiagnosticItem, AnalysisReport
│   │   └── index.ts             # Core application types (Tracker, Recipes, Builds)
│   ├── utils/
│   │   ├── pobDecoder.ts        # Client-side base64 decode, pako inflate, universal XML parser
│   │   └── buildAnalyzer.ts     # Multi-archetype diagnostic scoring engine & chromatic advisor
│   ├── components/
│   │   ├── Sidebar.tsx          # Zorbble gaming sidebar with league switcher & navigation
│   │   ├── HomeView.tsx         # Educational homepage with cosmic hero & manifesto
│   │   ├── BuildAnalyzerView.tsx# Interactive PoB Doctor with Orbitron scorecards & What-If simulator
│   │   ├── BuildsShowcaseView.tsx# SSF friendly builds (Penance Brand Elementalist, etc.)
│   │   ├── AtlasView.tsx        # 100% Map sustain playbook, Voidstones, PoE-Atlas embed
│   │   ├── VendorRecipesView.tsx# Filterable vendor recipe compendium & Bare Minimum Kit
│   │   ├── DefenseMechanicsView.tsx # Defense masterclass, Suffix Economics, Pantheon guide
│   │   ├── OffensesView.tsx     # Damage scaling, penetration, exposure, ailments
│   │   ├── ProgressTrackerView.tsx # Interactive SSF milestone checklist with storage sync
│   │   ├── ToolsDirectoryView.tsx # Curated external PoE tools directory
│   │   ├── DualLinkModal.tsx    # Global Ctrl+K wiki / poedb search modal
│   │   └── PrivateLeagueHubView.tsx # Group SSF / Private League play guide
│   ├── App.tsx                  # Root layout, theme provider, ambient glow backdrop
│   └── index.css                # Zorbble theme custom properties, glassmorphism, glowing utilities
├── tailwind.config.js           # Extended Zorbble tokens, font families, glow box-shadows
└── package.json                 # React 19, TypeScript, Tailwind CSS, Lucide Icons, Pako
```
