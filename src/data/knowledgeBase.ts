import type { KnowledgeArticle, VendorRecipe } from '../types';

export const VENDOR_RECIPES: VendorRecipe[] = [
  {
    id: 'added-spell-damage-weapon',
    title: 'Added Spell Damage Weapon (Wands / Sceptres)',
    category: 'leveling',
    components: [
      '1x Magic Wand or Sceptre',
      '1x Magic Ruby Ring (Fire) / Topaz Ring (Lightning) / Sapphire Ring (Cold)',
      '1x Orb of Alteration'
    ],
    reward: 'Magic Wand or Sceptre with Added Flat Elemental Damage to Spells (Tier depends on ring rarity: Magic = T2/T3, Rare = T1/T2)',
    usageNotes: 'MODERN ACT 1-2 LEVELING STAPLE: Replaced the old +1 gem recipe in 3.20. Gives massive flat spell damage to Spark, Rolling Magma, Holy Flame Totem, Freezing Pulse.',
    poeWikiUrl: 'https://www.poewiki.net/wiki/Vendor_recipe_system#Direct_damage_and_gem_level',
    poeDbUrl: 'https://poedb.tw/us/Vendor_recipe_system'
  },
  {
    id: 'flat-phys-weapon',
    title: '% Increased Physical Damage Weapon (Attack Leveling)',
    category: 'leveling',
    components: [
      '1x Normal / Magic / Rare Weapon (Axe, Mace, Sword, Bow, Claw)',
      '1x Rustic Sash (Magic grants 40 to 49% Inc Phys; Rare grants 50 to 64% Inc Phys)',
      '1x Blacksmith\'s Whetstone'
    ],
    reward: 'Magic Weapon with "Heavy" (Magic sash) or "Serrated" (Rare sash) % Increased Physical Damage mod',
    usageNotes: 'STILL FULLY ACTIVE: Repeat every 5 to 10 levels in the campaign on the highest base weapon available at the weapon vendor. Essential for Boneshatter, Splitting Steel, and Bow attacks.',
    poeWikiUrl: 'https://www.poewiki.net/wiki/Vendor_recipe_system#Equipment',
    poeDbUrl: 'https://poedb.tw/us/Vendor_recipe_system'
  },
  {
    id: 'movement-speed-boots',
    title: 'Movement Speed Boots (+10% Tier Upgrade)',
    category: 'leveling',
    components: [
      '1x Normal or Magic Boots',
      '1x Quicksilver Flask',
      '1x Orb of Augmentation'
    ],
    reward: 'Magic Boots with +10% Movement Speed (rerolling an existing +10% boots upgrades it to +15%, then +20%, up to +30%)',
    usageNotes: 'STILL FULLY ACTIVE: Use spare Quicksilver flasks from "The Great White Beast" (Act 2) to upgrade your boots speed early.',
    poeWikiUrl: 'https://www.poewiki.net/wiki/Vendor_recipe_system#Equipment',
    poeDbUrl: 'https://poedb.tw/us/Vendor_recipe_system'
  },
  {
    id: 'chisel-recipe-hammer',
    title: 'Cartographer\'s Chisel (20% Quality Hammer Recipe)',
    category: 'utility',
    components: [
      '1x 20% Quality Stone Hammer, Rock Breaker, or Gavel (Normal rarity)',
      '1x Any Map (Tier 1 to 16, any rarity)'
    ],
    reward: '1x Cartographer\'s Chisel',
    usageNotes: 'STILL FULLY ACTIVE: The #1 SSF Chisel source. Pick up normal Stone Hammers/Gavels, apply 4x Blacksmith Whetstones (Normal = 5% per whetstone), and sell with any junk map.',
    poeWikiUrl: 'https://www.poewiki.net/wiki/Cartographer%27s_Chisel',
    poeDbUrl: 'https://poedb.tw/us/Cartographers_Chisel'
  },
  {
    id: 'resist-ring-recipe',
    title: 'Elemental Resistance Rings (Ruby / Topaz / Sapphire / Two Stone)',
    category: 'leveling',
    components: [
      '1x Iron Ring + 1x Red/Green/Blue Gem = Ruby (Fire), Topaz (Lightning), or Sapphire (Cold) Ring',
      '1x Ruby Ring + 1x Sapphire Ring + 1x Topaz Ring = Two Stone Ring (Dual 16% Resists)',
      '1x of each 3 Two Stone Ring types = Prismatic Ring (+8 to 10% All Elemental Resistances)'
    ],
    reward: 'Clean base resist rings to fix elemental caps before Act 5 / Act 10 Kitava.',
    usageNotes: 'STILL FULLY ACTIVE: Combine iron rings with duplicate colored gems to guarantee the resist bases you are missing.',
    poeWikiUrl: 'https://www.poewiki.net/wiki/Vendor_recipe_system#Direct_damage_and_gem_level',
    poeDbUrl: 'https://poedb.tw/us/Vendor_recipe_system'
  },
  {
    id: 'gem-flip-twenty-quality',
    title: '20% Quality Support Gem Flip Recipe',
    category: 'utility',
    components: [
      '1x Level 20 Non Awakened Support Gem (Skill gems no longer work as of 3.23)',
      '1x Gemcutter\'s Prism (GCP)'
    ],
    reward: '1x Level 1 Support Gem with 20% Quality',
    usageNotes: 'UPDATED IN 3.23: Only functions on SUPPORT gems now. Level 6 support gems in your weapon swap, then flip them with GCP for huge quality buffs.',
    poeWikiUrl: 'https://www.poewiki.net/wiki/Vendor_recipe_system#Skill_Gems',
    poeDbUrl: 'https://poedb.tw/us/Vendor_recipe_system'
  },
  {
    id: 'glassblower-bauble-recipe',
    title: 'Glassblower\'s Bauble (40% Total Flask Quality)',
    category: 'utility',
    components: [
      '1x 20% Quality Normal Flask OR multiple Flasks totaling 40%+ Quality'
    ],
    reward: '1x Glassblower\'s Bauble',
    usageNotes: 'STILL FULLY ACTIVE: Pick up 12 to 18% quality flasks from maps to vendor in batches of 40% for Baubles to 20% quality your endgame utility flasks.',
    poeWikiUrl: 'https://www.poewiki.net/wiki/Glassblower%27s_Bauble',
    poeDbUrl: 'https://poedb.tw/us/Glassblowers_Bauble'
  },
  {
    id: 'gcp-quality-recipe',
    title: 'Gemcutter\'s Prism (40% Total Gem Quality)',
    category: 'utility',
    components: [
      '1x 20% Quality Gem OR multiple Skill/Support Gems totaling 40%+ Quality'
    ],
    reward: '1x Gemcutter\'s Prism (GCP)',
    usageNotes: 'STILL FULLY ACTIVE: Sell superior gems with random quality (e.g. 11% + 14% + 15% = 40%) for GCPs in early league.',
    poeWikiUrl: 'https://www.poewiki.net/wiki/Gemcutter%27s_Prism',
    poeDbUrl: 'https://poedb.tw/us/Gemcutters_Prism'
  },
  {
    id: 'grasping-mail-breach',
    title: 'Grasping Mail (60 Breach Rings Recipe)',
    category: 'crafting',
    components: [
      '60x Identified or Unidentified Breach Rings (any item level)'
    ],
    reward: '1x Grasping Mail Body Armour with exclusive Breach modifiers (e.g. 100% Inc Global Defences, Evasion per Overcapped Cold Res)',
    usageNotes: 'STILL FULLY ACTIVE: Store breach rings in a dedicated tab until you reach 60, then sell all 60 in one transaction.',
    poeWikiUrl: 'https://www.poewiki.net/wiki/Grasping_Mail',
    poeDbUrl: 'https://poedb.tw/us/Grasping_Mail'
  },
  {
    id: 'loreweave-rings',
    title: 'Loreweave Unique Body Armour (60 Unique Rings)',
    category: 'crafting',
    components: [
      '60x Unique Rings (any base, any item level)'
    ],
    reward: '1x Loreweave Elegant Ringmail with 76 to 78% Maximum Elemental Resistances lock and huge offensive stats',
    usageNotes: 'STILL FULLY ACTIVE: Hoard every junk unique ring found in maps/heist/expedition and sell 60 at once.',
    poeWikiUrl: 'https://www.poewiki.net/wiki/Loreweave',
    poeDbUrl: 'https://poedb.tw/us/Loreweave'
  },
  {
    id: 'five-to-one-rare',
    title: '5 to 1 Rare Base Item Reroll',
    category: 'crafting',
    components: [
      '5x Rare items of the EXACT same base type (e.g. 5x Rare Two Stone Rings or 5x Rare Convoking Wands)'
    ],
    reward: '1x Unidentified clean Rare item of that same base (Item level equals the lowest of the 5 sold)',
    usageNotes: 'STILL FULLY ACTIVE: Great when target hunting a specific high item level base in SSF without risking currency.',
    poeWikiUrl: 'https://www.poewiki.net/wiki/Vendor_recipe_system#Equipment',
    poeDbUrl: 'https://poedb.tw/us/Vendor_recipe_system'
  },
  {
    id: 'chaos-recipe',
    title: 'Chaos Orb Full Rare Gear Set Recipe',
    category: 'currency',
    components: [
      'Full set of Rare items between item level 60 and 74 (Helmet, Body, Gloves, Boots, Belt, Amulet, 2x Rings, 2H Weapon or 2x 1H Weapons)'
    ],
    reward: '1x Chaos Orb (Identified) or 2x Chaos Orbs (if ALL items in the set are UNIDENTIFIED)',
    usageNotes: 'STILL FULLY ACTIVE: Useful in early white/yellow maps for benchcrafting fees, map device modifiers, and early Kirac rerolls.',
    poeWikiUrl: 'https://www.poewiki.net/wiki/Vendor_recipe_system#Full_Rare_Sets',
    poeDbUrl: 'https://poedb.tw/us/Vendor_recipe_system'
  }
];

export const KNOWLEDGE_ARTICLES: KnowledgeArticle[] = [
  {
    id: 'ssf-survival-kit',
    title: 'The SSF Bare Minimum Survival Kit',
    subtitle: 'Core principles, early vendor economics, verified leveling recipes, and essential filter setups',
    category: 'survival_kit',
    readTime: '6 min read',
    summary: 'A complete step by step masterclass on early currency conversions, verified leveling recipes, offhand gem farming, and filter configuration for modern Path of Exile.',
    tags: ['survival kit', 'vendor recipes', 'filter', 'gem leveling', 'currency'],
    content: `
### 1. The Core Philosophy: Scarcity vs Deterministic Power
In Trade League, your character progression is measured by how many Chaos or Divine Orbs you generate per hour to buy upgrades. In Solo Self Found and Private Leagues, power is gained through **Item Acquisition, Scarcity Management, and Deterministic Crafting**.

* **Every drop has context:** An item level 84 fractured base, a cluster jewel, or a single screaming essence represents direct, permanent character power.
* **Progress is linear and earned:** You cannot buy your way past a difficult boss. When you conquer your 4 Voidstones or assemble your first 6 link in SSF, every piece of gear is a trophy of your game knowledge.

---

### 2. Early Vendor Currency Conversion Chains
You never need to wait for raw currency drops to perform basic crafting bench tasks. NPC vendors in town offer systematic exchange rates:

* **Basic Scroll Conversion:** Sell Scroll Fragments → Wisdom Scrolls → Portal Scrolls → Transmutation Orbs → Augmentation Orbs → Alteration Orbs.
* **Jewellers & Chromatics:** Town vendors (Clarissa in Act 3, Lilly Roth in Act 6) provide direct exchanges for Chromatic Orbs, Jeweller's Orbs, and Orbs of Fusing.
* **6 Socket Items:** Sell any 6 socket item to any vendor for **7x Jeweller's Orbs**.
* **RGB Linked Items:** Sell items with connected Red, Green, and Blue sockets for **1x Chromatic Orb**.
* **Flask Quality to Baubles:** Vendor normal flasks totaling 40% combined quality (or one 20% flask) for **1x Glassblower's Bauble**.
* **Chisel Hammer Recipe:** Vendor one 20% quality normal Stone Hammer, Rock Breaker, or Gavel with any junk map for **1x Cartographer's Chisel**.

---

### 3. Verified Leveling Recipes & Obsolete Recipe Warnings
Upgrade your character effortlessly during Acts 1 to 10 with these guaranteed vendor formulas:

* **Physical Attack Weapon:** Magic Weapon + Rustic Sash + Blacksmith's Whetstone = Weapon with 40 to 49% (Magic sash) or 50 to 64% (Rare sash) Increased Physical Damage. Repeat every 5 to 10 levels on higher base weapons.
* **Flat Spell Damage Wand/Sceptre:** Magic Wand/Sceptre + Magic Ruby/Topaz/Sapphire Ring + Orb of Alteration = Weapon with Flat Added Fire/Lightning/Cold Damage to Spells.
* **Movement Speed Boots:** Normal Boots + Quicksilver Flask + Orb of Augmentation = Boots with +10% Movement Speed. Selling those boots again with another Quicksilver upgrades it to +15%, then +20%, up to +30%!
* ❌ **REMOVED (Patch 3.20):** The old "+1 to Level of all Spell Gems" wand recipe (Magic Wand + 40% quality gem) **no longer exists**. Use the Added Flat Spell Damage recipe instead.
* ⚠️ **CHANGED (Patch 3.23+):** The **20% Quality Gem Flip Recipe** (Level 20 Gem + 1 GCP = Level 1 Gem with 20% Quality) **now only works on Support Gems**. Active skill gems must have quality raised via Gemcutter's Prisms or Divine Font conversions in the Labyrinth.

---

### 4. The Offhand Weapon Swap Leveling Engine
Never leave your weapon swap slots empty! Press X to switch to your alternate weapon set and equip two 3 socket one handed weapons (or one 6 socket two handed weapon).

* **100% Passive Experience:** Gems socketed in your offhand weapons receive **100% of monster kill experience** without any penalty, even if you never press the swap button during combat.
* **What to Level:**
  1. Six copies of your primary damage skill gem to attempt Level 21 / 20% Quality Vaal Orb corruptions in late maps.
  2. High value support gems to perform the **20% Quality Support Gem Flip Recipe** once they reach Level 20.
  3. Exceptional Support Gems, Enlighten, or Empower gems whenever they drop.

---

### 5. Customizing Your Loot Filter for SSF (FilterBlade)
Standard trade filters aggressively hide white crafting bases, low tier essences, and chance items. In SSF, customize **FilterBlade** with these mandatory rules:

* **Tier 1 & 2 Base Items:** Always highlight high item level bases (iLvl 84+ Astral Plates, Two Stone Rings, Convoking Wands, and top tier Evasion/Suppression bases).
* **Never Hide Essences:** Even Whispering and Muttering essences upgrade 3 to 1 into powerful guaranteed affix crafts.
* **Highlight Key Chance Bases:** If chasing a build enabling unique (such as Call of the Brotherhood on Two Stone Rings or Cold Iron Point on Ezomyte Daggers), enable chance base highlighting.
* **Quality Flasks:** Highlight 14%+ quality normal flasks to build your Glassblower's Bauble stockpile before mapping.
`
  },
  {
    id: 'defenses-and-suffixes',
    title: 'Defensive Layering & Suffix Economics in SSF',
    subtitle: 'Why suffixes are the most contested resource in SSF and how to balance them',
    category: 'progression_ehp',
    readTime: '8 min read',
    summary: 'Mastering effective HP, Life vs ES vs CI, 100% Spell Suppression, Chaos Resistance, and patching holes with The Pantheon.',
    tags: ['defenses', 'suffixes', 'spell suppression', 'pantheon', 'life', 'chaos res'],
    content: `
### 1. The Suffix War: Why Suffixes Make or Break SSF
In Path of Exile, equipment modifiers are split into **Prefixes** and **Suffixes**.
* **Prefixes** generally handle: Flat Life, Flat Energy Shield, % Increased Defences, Flat Elemental/Physical Damage, +1 Gem Levels.
* **Suffixes** handle: **Elemental Resistances, Chaos Resistance, Spell Suppression, Attributes (Strength/Dex/Int), Attack/Cast Speed, and Critical Strike Chance**.

In SSF, you almost always run out of Suffix slots before you can solve all your defensive requirements!

---

### 2. Layering Defenses: The SSF Hierarchy of Survival
Never rely on a single defensive mechanic. A resilient SSF character layers 3 to 4 defense mechanisms:

\`\`\`
[1. Hit Pool (4,500+ Life / Energy Shield)]
         +
[2. Damage Mitigation: Armour (Phys) OR Evasion (Avoidance)]
         +
[3. Spell Suppression: 100% Chance to Halve Spell Damage]
         +
[4. "Phys Taken As Elemental": Lightning Coil / Cloak of Flame / Dawnbreaker / Eldritch Helmet]
         +
[5. Ailment & Degens: Positive Chaos Res (30%+ to 75%) + Pantheon Immunities]
\`\`\`

---

### 3. Sourcing 100% Spell Suppression in SSF
Spell Suppression is non negotiable for red maps and Pinnacle Bosses:
* Rolls only on **Pure Evasion** or **Hybrid Evasion** (Armour/Eva, Eva/ES) gear.
* Target **Tier 1 to 2 Suppression on Body Armour, Helmet, Gloves, and Boots** (up to 14 to 22% per slot).
* Supplement with passive skill tree masteries (+12% suppression if helmet, body, gloves, and boots all have evasion).
* If struggling, use **Essences of Scorn** on evasion bases to guarantee Spell Suppression!

---

### 4. The Pantheon: Free Immunities & Hole Patching
Use **Divine Vessels** in the Map Device to capture map bosses and upgrade your Pantheon:

* **Soul of the Brine King (Major):** Cannot be Frozen (frees up flask suffix!) and 50% Reduced Chill Effect. Captured in Reef Map (T10+).
* **Soul of Arakaali (Major):** 10% Reduced Damage taken over Time + 20% increased Recovery of Life/ES. Captured in Arachnid Tomb Map.
* **Soul of Solaris / Lunaris (Major):** Critical Strike Damage reduction and Projectile Avoidance. Captured in Temple / Crimson Temple.
* **Soul of Ralakesh (Minor):** Cannot gain Corrupted Blood and 25% Reduced Physical Damage over Time. Captured in Ashen Wood Map.
* **Soul of Abberath (Minor):** Unaffected by Burning Ground and 60% Reduced Ignite Duration. Great against fiery map hazards.
`
  },
  {
    id: 'ssf-crafting-masterclass',
    title: 'The SSF Crafting Masterclass: From Rags to BiS',
    subtitle: 'Deterministic crafting strategies without trade: Essences, Rog heuristics, Harvest, and Meta-Crafts',
    category: 'crafting',
    readTime: '10 min read',
    summary: 'A step by step roadmap to crafting high tier gear in SSF using Essences, Rog rerolls, Fractured bases, and metamods.',
    tags: ['crafting', 'essences', 'rog', 'harvest', 'metamods', 'veiled', 'vorici'],
    content: `
### Phase 1: Early League Crafting (White & Yellow Maps)

#### 1. Essence Spam + Benchcraft
* Pick a good base item (e.g. Two Stone Rings, Astral Plate, Convoking Wand).
* Slam **Essence of Greed** (Guaranteed high Life) or **Essence of Hatred/Anger/Wrath** (Guaranteed Resistance).
* Repeat until you hit 1 additional useful modifier.
* Craft the missing stat (Resist or Life) on the **Crafting Bench**.

#### 2. The Rog Heuristic (Expedition)
Rog is the most powerful early gear supplier in SSF:
* **Pick high item level bases (iLvl 83+)**: Boots with movement speed, shields with spell suppression, jewellery.
* **Look for "Upgrade Tier of Modifiers"** and **"Set Modifiers to highest possible tier"**.
* **Skip offers that reroll all prefixes/suffixes** if you already have 2 good modifiers.
* Rog frequently produces 5x Tier 1 to 2 items within your first 15 expedition logbooks.

---

### Phase 2: Mid-League Crafting (Red Maps & Voidstones)

#### 1. The Fractured Base Method (Golden Rule of SSF)
* Find or vendor recipe a base item with a **Fractured Tier 1/2 mod** (e.g. Fractured Tier 1 Spell Suppression or Fractured +1 All Spell Skills).
* Because the fractured mod can *never be removed or altered*, you only have to roll 2 other good affixes!
* Slam with targeted Essences until hitting the 3rd desired mod.
* Finish with Crafting Bench or Eldritch Ichors/Embers.

---

### Phase 3: Endgame Metamods & Veiled Unveils

#### 1. Suffixes / Prefixes Cannot Be Changed + Veiled Orbs
When you have finished one side of an item (e.g., 3 perfect Suffixes: T1 Suppress, T1 Chaos Res, T1 Resist):
1. Benchcraft **"Suffixes Cannot Be Changed"** (Cost: 2 Divine Orbs).
2. Use **Harvest Reforge Life** or **Veiled Orb**.
3. The suffixes remain completely untouched!
4. Unveil a powerful hybrid mod (e.g., Gravicius % Max Life / Energy Shield or Movement speed + Onslaught).
5. Benchcraft the final prefix!

---

### 4. Socket Coloring & Quality Matching Masterclass
In modern Path of Exile (Patch 3.29+), item sockets are **White by default**, meaning any gem color can be socketed anywhere without restriction. However, **matching a socket's color to your gem's color grants an innate +10% Gem Quality bonus!**

To target specific socket colors (such as 4 Blue sockets on a pure Strength Armour helmet for +10% quality on all 4 blue gems) without burning hundreds of Chromatics, use the **Crafting Bench Socket Trick** for under 30 Jeweller's Orbs:

\`\`\`
Step 1: Go to Crafting Bench -> Craft "At least 2 Sockets".
Step 2: Craft "2 Blue Sockets" (Costs 25 Chromatics). You now have 2 Blue Sockets.
Step 3: Craft "3 Sockets" (Costs 3 Jewellers).
        - If 3rd socket turns Blue: Proceed to Step 4!
        - If 3rd socket turns Red/Green: Craft "2 Sockets" (reverts to 2 Blue), then craft "3 Sockets" again!
Step 4: Once you have 3 Blue Sockets, craft "4 Sockets" (Costs 10 Jewellers).
        - If 4th socket is Blue: Congratulations, 4 targeted color sockets achieved!
        - If not Blue: Craft "3 Sockets", then "4 Sockets" again until it turns Blue.
\`\`\`
`
  },
  {
    id: 'atlas-and-mapping',
    title: 'Atlas Strategy & Map Sustaining in SSF',
    subtitle: 'Navigating the Atlas of Worlds: Kirac resets, 3 to 1 recipe, and passive tree roadmaps',
    category: 'atlas_mapping',
    readTime: '7 min read',
    summary: 'Never get stuck on map sustain: Kirac mechanics, Horizon Orb tricks, and early vs mid vs late Atlas passive trees.',
    tags: ['atlas', 'mapping', 'kirac', 'horizon orbs', 'map sustain', 'atlas tree'],
    content: `
### 1. The 100% Map Sustain Playbook
Getting stuck in white or yellow maps is the #1 mistake new SSF players make. Avoid it with these tools:

* **3 to 1 Vendor Recipe:** Selling 3 maps of the same base name yields 1 connected map of 1 tier higher on the Atlas tree. If vendor gives a duplicate, try swapping one of the 3 maps to change the outcome!
* **Kirac Shop Refresh:** Every time you open or complete a **Kirac Mission**, Kirac's inventory resets! Check his shop immediately for uncompleted bonus objective maps.
* **Horizon Orb Reroll Trick:** An Orb of Horizons rerolls a map into another natural map of the **same tier**. If you have 5 excess Dunes maps and are missing Cemetery in Tier 8, use Horizon Orbs!

---

### 2. Atlas Passive Tree Progression (The 3 Stages)

#### Stage 1: The Sustain & Unlock Engine (0 to 40 Points)
* Take **"Commissioned Officer"** & Kirac mission nodes immediately.
* Take all **100% chance for higher tier map drops** (Shaping the Mountains, Shaping the Skies, Shaping the Valley).
* Pick up **Essence nodes** in the center: You need Essences to craft your leveling gear.
* Pick up **Jun / Betrayal nodes** to unlock critical benchcrafts.

#### Stage 2: The Crafting & Economy Engine (40 to 90 Points)
* Spec into **Expedition** (focusing on Rog & Tujen for currency/logbooks).
* Spec into **Harvest** (Horticrafting lifeforce for reforge crafting & resist swaps).
* Take **Searing Exarch / Eater of Worlds** eldritch pack size for Ichors and Embers.

#### Stage 3: The Boss Rush & Scarab Engine (90 to 132 Points)
* Spec into **Destructive Play (Maven)** for massive guardian map drops and synthesizer bases.
* Spec into **Scarab drops** to target farm league mechanics.
* Unlock 12/12 **Favoured Map Slots** to run your preferred layout endlessly.
`
  },
  {
    id: 'bossing-and-fragments',
    title: 'Bossing & Pinnacle Encounters in SSF',
    subtitle: 'Maximizing attempts, fragment swaps in Harvest, and voidstone battle plans',
    category: 'bossing_fragments',
    readTime: '6 min read',
    summary: 'Conquering The Searing Exarch, Eater of Worlds, Maven, and Uber Elder without burning out your fragment pool.',
    tags: ['bossing', 'voidstones', 'harvest', 'fragments', 'shaper', 'elder', 'maven'],
    content: `
### 1. The Voidstone Priority Roadmap

\`\`\`
[1. Quest Searing Exarch (T14+ Map Progression)] -> Grants Red Voidstone
         +
[2. Quest Eater of Worlds (T14+ Map Progression)] -> Grants Blue Voidstone
         = (You now have 2 Voidstones & T16 Maps naturally drop everywhere)
         |
         v
[3. The Maven (10 Boss Invitations -> Maven's Writ)] -> Grants Ceremonial Voidstone
         +
[4. The Uber Elder (Shaper + Elder Guardian Sets)] -> Grants Decayed Voidstone
         = (Full 4 Voidstones: All maps on Atlas are Tier 16!)
\`\`\`

---

### 2. The Harvest Fragment Swap (Never Get Fragment Blocked)
In SSF, you will often find 5x Fragment of the Hydra and 0x Fragment of the Phoenix. **Do not farm blindly:**
* Go to the **Horticrafting Station (Harvest)**.
* Under the **"Sacrifice / Swap"** category:
  * Spend 75 Vivid (Yellow) or Wild (Purple) Lifeforce to **Swap a Shaper/Elder/Conqueror/Sirus fragment for another fragment of the same set**.
  * You can 1 to 1 turn duplicates into the missing key to open the boss portal!

---

### 3. Sourcing Boss Maps Deterministically
* Take **"Remnants of the Past"** and **"Vivid Memories"** on the Atlas passive tree for +3% chance for map bosses to drop Shaper/Elder guardian maps and Synthesis maps.
* Run **Kirac Missions**: Look for red tier mission objectives titled *"Slay the Shaper Guardian"* or *"Slay the Elder Guardian"*. These count toward your fragments and Atlas completion!
`
  }
];
