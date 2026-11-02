export interface OffensePillar {
  id: string;
  name: string;
  pillarNumber: number;
  tagline: string;
  description: string;
  mathExample: string;
  commonMistake: string;
}

export interface OffenseMilestone {
  id: string;
  badge: string;
  badgeColor: string;
  title: string;
  subtitle: string;
  dpsBenchmark: string;
  socketLinks: string;
  coreScaling: string;
  cursesAndExposure: string;
  failurePoint: string;
  actionChecklist: string[];
}

export interface OffenseMechanic {
  id: string;
  name: string;
  category: 'Multipliers' | 'Base & Speed' | 'Penetration' | 'Conversion' | 'DoT';
  difficulty: string;
  setupTime: string;
  tagline: string;
  plainEnglish: string;
  theTrap: string;
  ruleOfThumb: string;
  howToScale: string[];
}

export interface OffenseArchetype {
  id: string;
  name: string;
  primaryScalingStat: string;
  coreMechanic: string;
  pros: string;
  cons: string;
  ssfGearPriorities: string[];
}

export const OFFENSE_PILLARS: OffensePillar[] = [
  {
    "id": "base",
    "name": "Base Flat Added Damage",
    "pillarNumber": 1,
    "tagline": "The starting foundation that every other multiplier enhances.",
    "description": "Every attack or spell starts with a base flat number (e.g. 500 to 800 Fire Damage on a spell, or 350 Physical DPS on a sword). Without base flat damage, having 1,000% increased damage still produces weak DPS.",
    "mathExample": "Spells scale base damage automatically with Gem Level. Attacks scale base damage from local weapon stats and flat added damage on rings/amulets.",
    "commonMistake": "Using a level 15 skill gem or low tier campaign weapon in yellow maps and wondering why damage feels like tickling monsters."
  },
  {
    "id": "increased",
    "name": "% Increased vs % More Damage",
    "pillarNumber": 2,
    "tagline": "The additive bucket vs the multiplicative compounding engines.",
    "description": "% Increased modifiers are all added together into one big pool (+50% from tree + 60% from weapon = +110% total). % More modifiers multiply everything separately (1.30 * 1.35 * 1.40).",
    "mathExample": "Going from 500% to 550% increased damage is only a ~8% real DPS gain. Adding one 35% More Support gem gives a full 35% real DPS gain.",
    "commonMistake": "Over investing in 20 passive tree increased damage wheels while missing out on support gem links, Frenzy charges, or aura multipliers."
  },
  {
    "id": "crit_and_speed",
    "name": "Delivery Rate & Critical Strikes",
    "pillarNumber": 3,
    "tagline": "How many times your damage triggers and how hard each trigger hits.",
    "description": "Attack Speed, Cast Speed, Trap Throwing Speed, and Critical Strike Multiplier exponentially scale your damage throughput per second.",
    "mathExample": "Hitting 100% Critical Strike Chance with 500% Critical Strike Multiplier multiplies your base damage by 5.0x on every single attack.",
    "commonMistake": "Investing into high Critical Multiplier without capping Critical Strike Chance above 85%."
  },
  {
    "id": "penetration",
    "name": "Resistance Reduction, Exposure & Curses",
    "pillarNumber": 4,
    "tagline": "Neutralizing boss defenses to double your true dealt damage.",
    "description": "Pinnacle bosses and map rares have 50% inherent elemental resistances. Pushing boss resistance down to 0% doubles your dealt damage. Pushing it to -30% triples it.",
    "mathExample": "50% boss res means you deal 50% damage. -18% Exposure + -30% Flammability + 25% Penetration pushes boss to -23% res, dealing 123% damage (a 146% more real DPS multiplier)!",
    "commonMistake": "Zero exposure or penetration on elemental builds against Pinnacle bosses."
  }
];

export const OFFENSIVE_MILESTONES: OffenseMilestone[] = [
  {
    "id": "campaign",
    "badge": "Acts 1 to 10",
    "badgeColor": "emerald",
    "title": "Campaign Offenses (Levels 1 to 68)",
    "subtitle": "Clearing act bosses quickly without getting bogged down by slow single target damage.",
    "dpsBenchmark": "15,000 to 50,000 DPS by Act 10.",
    "socketLinks": "3 Link in Acts 1 to 3, 4 Link by Act 4 to 10.",
    "coreScaling": "Vendor recipes: Magic weapon + Rustic Sash + Blacksmith Whetstone for % Physical Damage; Magic wand + Topaz/Ruby Ring + Alteration for flat added spell damage.",
    "cursesAndExposure": "Single curse on bosses (Flammability, Frostbite, Conductivity, Vulnerability, or Despair).",
    "failurePoint": "Trying to scale critical strikes during the campaign. Crit requires high level bases; use Elemental Overload, Precise Technique, or Resolute Technique early.",
    "actionChecklist": [
      "Upgrade your main weapon every 10 levels using vendor recipes or essences.",
      "Run a flat damage aura (Herald of Ash/Ice/Thunder, Wrath, Anger, or Hatred).",
      "Keep your main skill gem at the maximum allowed character level.",
      "Allocate Elemental Overload (+40% More damage) or Precise Technique (+40% More attack damage) on the passive tree."
    ]
  },
  {
    "id": "white_maps",
    "badge": "Tier 1 to 5",
    "badgeColor": "sky",
    "title": "Early White Maps Baseline",
    "subtitle": "Smoothly clearing map packs and breaking through rare monster essence mods.",
    "dpsBenchmark": "100,000 to 300,000 DPS.",
    "socketLinks": "5 Link Body Armour or 5 Link Two Handed Weapon.",
    "coreScaling": "+1 to Level of all Spell Skill Gems on Weapon / Shield or 350+ Physical DPS weapon.",
    "cursesAndExposure": "Exposure source (Wave of Conviction, Frost Bomb, or Passive Tree Mastery).",
    "failurePoint": "Sticking to a 4 link in maps. A 5 link provides an additional 30% to 40% More damage multiplier.",
    "actionChecklist": [
      "Farm Flora's Gift div cards or use Jeweller's/Fusing bench to secure your first 5 link.",
      "Level up 20/20 support gems in your weapon swap sockets.",
      "Roll Diamond Flask (for crit builds) or Silver Flask (for Onslaught speed).",
      "Acquire Frenzy charge generation (Blood Rage or Mark on Hit with Poacher's Mark)."
    ]
  },
  {
    "id": "yellow_maps",
    "badge": "Tier 6 to 10",
    "badgeColor": "amber",
    "title": "Mid Yellow Maps Hardening",
    "subtitle": "Melting map bosses before dangerous phase mechanics can trigger.",
    "dpsBenchmark": "500,000 to 1.5 Million DPS.",
    "socketLinks": "6 Link Body Armour (via The Porcupine, The Dapper Prodigy, or Corrupted 6L).",
    "coreScaling": "+1 all spell skill gems on Amulet and Weapon. Crit chance reaching 70%+ with Diamond Flask.",
    "cursesAndExposure": "Automated curse trigger: Mark on Hit Support linked to Assassin's Mark / Sniper's Mark or Arcanist Brand linked to Curses.",
    "failurePoint": "Lack of penetration or exposure against resistant rare monsters.",
    "actionChecklist": [
      "Obtain a 6 link body armour; match socket colors to your gem colors for +10% quality bonuses.",
      "Craft Eldritch Implicits on Gloves for Exposure or Infliction.",
      "Allocate passive tree masteries for Resistance Inversion or Penetration.",
      "Upgrade weapon to 500+ elemental DPS or 450+ physical DPS."
    ]
  },
  {
    "id": "red_maps",
    "badge": "Tier 11 to 16",
    "badgeColor": "rose",
    "title": "End Game Red Maps Mastery",
    "subtitle": "Blasting T16 maps with dense altar packs and conquering Guardian/Conqueror bosses.",
    "dpsBenchmark": "2 to 5+ Million DPS.",
    "socketLinks": "6 Link with 20/20 or Level 21/20 Gems.",
    "coreScaling": "+2 to Level of All Skill Gems (Weapon + Amulet), 85%+ Crit Chance, 400%+ Crit Multiplier.",
    "cursesAndExposure": "Double curse setup via Whispers of Doom passive tree keystone.",
    "failurePoint": "Ignoring Gem Level scaling on spells or low flat base damage on attack weapons.",
    "actionChecklist": [
      "Corrupt Level 20 skill gems with Vaal Orbs to hit Level 21.",
      "Acquire Exceptional Support Gems or Level 4 Empower/Enhance if available.",
      "Roll Watcher's Eye with damage multipliers matching your primary aura.",
      "Craft high tier Crit Multiplier suffixes on Amulet, Rings, and Jewels."
    ]
  },
  {
    "id": "pinnacle_t17",
    "badge": "Tier 17 & Pinnacles",
    "badgeColor": "purple",
    "title": "Pinnacle Bosses & Tier 17 Content",
    "subtitle": "Phasing Uber bosses (Uber Maven, Uber Eater, Uber Exarch) and clearing T17 maps with ease.",
    "dpsBenchmark": "10 to 30+ Million DPS.",
    "socketLinks": "Elevated Double Influenced 6L or +4 Corrupted Unique Chest.",
    "coreScaling": "Level 30+ Spells / 900+ pDPS or eDPS Weapons, 100% Capped Crit, 600%+ Multiplier, Adrenaline / Tailwind.",
    "cursesAndExposure": "Triple curse setup, 100% Shock effect, 30%+ Penetration bypassing boss 50% resistances.",
    "failurePoint": "Overkill on map clear speed with insufficient sustained single target damage for Uber bosses.",
    "actionChecklist": [
      "Craft multi modded influenced weapons with T1 affixes.",
      "Stack Frenzy and Power charges with Ralakesh's Impatience or Badge of the Brotherhood.",
      "Optimize Timeless Jewels and Cluster Jewels for 3 socket large clusters with optimal notables.",
      "Use Progenesis, Bottled Faith, or Dying Sun for maximized single target output."
    ]
  }
];

export const OFFENSIVE_MECHANICS: OffenseMechanic[] = [
  {
    "id": "gem_levels",
    "name": "Gem Level Scaling (Spells & Minions)",
    "category": "Base & Speed",
    "difficulty": "Easy to Hard",
    "setupTime": "Campaign to End Game",
    "tagline": "The single most potent multiplier for spell casters and minion summoners.",
    "plainEnglish": "Unlike attack skills which rely on your equipped weapon, spells and minions gain their entire base flat damage directly from the gem's level. Every single level above Level 20 increases a spell's base damage by roughly 10% to 12% compounding! A Level 28 spell deals over three times the base damage of a Level 20 spell.",
    "theTrap": "Trying to increase spell damage by crafting % increased physical/elemental damage on weapons while neglecting +1 to Level of all Spell Skill Gems.",
    "ruleOfThumb": "+1 to Level of all Spell Gems is almost always equivalent to 10% MORE raw damage.",
    "howToScale": [
      "Corrupt Level 20 gems with Vaal Orbs for Level 21.",
      "Equip weapons with +1 to Level of All Spell Skill Gems and +1 to specific element.",
      "Craft +1 to Level of All Skill Gems on Amulets.",
      "Link Empower Support (Level 3 or 4) in your 6 link setup."
    ]
  },
  {
    "id": "crit_scaling",
    "name": "Critical Strike Chance and Multiplier",
    "category": "Multipliers",
    "difficulty": "Medium to Hard",
    "setupTime": "Yellow Maps to End Game",
    "tagline": "The exponential multiplier that turns 500k DPS into 20 Million DPS.",
    "plainEnglish": "When an attack or spell lands a Critical Strike, its damage is multiplied by your Critical Strike Multiplier (base is 150%). If you have 100% Critical Strike Chance and 500% Critical Strike Multiplier, every single hit deals 5.0 times normal damage!",
    "theTrap": "Investing into 600% Crit Multiplier while your Crit Chance is only 40%. You will feel inconsistent spikes and low average DPS.",
    "ruleOfThumb": "Always prioritize capping your Critical Strike Chance (85% to 100% with Diamond Flask) before heavily investing into Crit Multiplier.",
    "howToScale": [
      "Equip a Diamond Flask rolled with % Increased Critical Strike Chance during flask effect.",
      "Allocate Power Charge nodes and run Assassin's Mark on Hit.",
      "Roll Critical Strike Multiplier on Jewels, Amulet, and Weapon suffixes.",
      "Use Nightblade Support on Dagger/Claw builds for massive Elusive crit multi."
    ]
  },
  {
    "id": "exposure_and_curses",
    "name": "Resistance Penetration, Exposure & Curses",
    "category": "Penetration",
    "difficulty": "Easy to Medium",
    "setupTime": "Campaign to End Game",
    "tagline": "Bypassing monster resistances to multiply your dealt damage.",
    "plainEnglish": "Monsters in high tier maps and bosses have up to 50% elemental resistances. If a monster has 50% resistance, it cuts your damage in half. By applying Exposure (-18%), Curses (-30%), and Penetration (30%), the monster's resistance drops to -28%, meaning you deal 128% damage instead of 50%!",
    "theTrap": "Assuming raw tooltip DPS in Path of Building reflects your actual damage against Pinnacle bosses without configuring enemy boss resistances.",
    "ruleOfThumb": "Every elemental build MUST have at least 1 reliable Exposure source and 1 active curse.",
    "howToScale": [
      "Use Wave of Conviction, Frost Bomb, or Eldritch Glove implicit for free Exposure.",
      "Automate your primary curse with Mark on Hit Support, Ring implicit, or Arcanist Brand.",
      "Allocate the Masteries: Exposure you inflict applies at least -18% to resistances.",
      "Equip Awakened Elemental Penetration Support or Shaper/Hunter penetration weapons."
    ]
  },
  {
    "id": "conversion",
    "name": "Damage Conversion & Added as Extra",
    "category": "Conversion",
    "difficulty": "Medium to Hard",
    "setupTime": "Mid Maps to End Game",
    "tagline": "Converting physical damage across elements to double dip on modifiers.",
    "plainEnglish": "Physical damage can be converted in a strict sequence: Physical -> Lightning -> Cold -> Fire -> Chaos. When damage is converted, it benefits from modifiers for BOTH its original type and its new type! Furthermore, Gain % of Physical Damage as Extra Elemental Damage creates bonus damage from thin air.",
    "theTrap": "Converting elements backwards. You can NEVER convert Fire back to Physical or Cold back to Lightning.",
    "ruleOfThumb": "Achieve 100% full conversion (e.g. 100% Physical to Cold) using passive tree wheels, Gloves eldritch implicits, or gems.",
    "howToScale": [
      "Skill gems with built in conversion (Glacial Cascade, Divine Ire, Wave of Conviction).",
      "Gloves crafted with 25% Physical to Element (Eldritch implicit + bench craft).",
      "Hatred aura (Gains up to 25% of Physical Damage as Extra Cold Damage).",
      "Taste of Hate or Herald of Ash for bonus extra damage."
    ]
  },
  {
    "id": "dot_scaling",
    "name": "Damage Over Time (DoT) & Ailment Multipliers",
    "category": "DoT",
    "difficulty": "Easy to Medium",
    "setupTime": "Campaign to End Game",
    "tagline": "Smooth, consistent boss melting while moving and dodging mechanics.",
    "plainEnglish": "Damage Over Time (Ignite, Bleed, Poison, Corrupting Fever, Cold/Chaos DoT) deals non hit continuous damage. DoT does not care about critical strikes or attack speed for individual ticks; instead, it scales through Damage Over Time Multiplier (Fire DoT Multi, Physical DoT Multi, Chaos DoT Multi).",
    "theTrap": "Investing into % increased Spell Damage on Poison or Bleed builds. Spell damage does not scale physical/chaos ailments unless specifically stated.",
    "ruleOfThumb": "Stack Damage Over Time Multiplier on every available weapon suffix, amulet, and jewel.",
    "howToScale": [
      "Roll +% to Damage Over Time Multiplier on Hunter/Warlord Amulets and Weapons.",
      "Allocate passive tree DoT wheels (Fire Walker, Toxic Strike, Heart of Destruction).",
      "Use Malevolence aura for % more damage over time and skill effect duration.",
      "Equip Wither totems on Chaos DoT builds to stack 15x Wither (+90% more chaos damage taken)."
    ]
  }
];

export const OFFENSIVE_ARCHETYPES: OffenseArchetype[] = [
  {
    "id": "spell_caster",
    "name": "Spell Casters (Self Cast & Brands)",
    "primaryScalingStat": "+ Gem Levels, Cast Speed, Crit Multi, Spell Damage",
    "coreMechanic": "High base scaling from gem levels; benefits heavily from exposure and double curses.",
    "pros": "Consistent damage independent of weapon drops; excellent range and screen coverage.",
    "cons": "Mana management required; requires cast speed to avoid feeling sluggish.",
    "ssfGearPriorities": [
      "+1 to Level of All Spell Gems on Wand / Sceptre and Shield",
      "+1 All Skill Gems on Amulet",
      "Cast Speed & Crit Multiplier on Rings/Jewels",
      "Mana Reservation Efficiency for extra auras"
    ]
  },
  {
    "id": "attack_build",
    "name": "Attackers (Melee, Bows & Wanders)",
    "primaryScalingStat": "Local Weapon pDPS/eDPS, Attack Speed, Flat Added Damage, Accuracy",
    "coreMechanic": "Scales directly with local weapon base numbers; requires 100% hit chance (3,000+ Accuracy).",
    "pros": "Highest possible single target ceiling in the entire game; instant leech scaling.",
    "cons": "Heavily weapon dependent; requires frequent weapon upgrades during progression.",
    "ssfGearPriorities": [
      "High flat Physical / Elemental weapon rolls crafted with Essences",
      "Accuracy Rating suffixes to cap 100% Hit Chance",
      "Flat Added Damage on Rings, Amulet, and Gloves",
      "Frenzy Charge generation and Attack Speed"
    ]
  },
  {
    "id": "dot_build",
    "name": "Damage Over Time (Ignite, Poison & Bleed)",
    "primaryScalingStat": "DoT Multiplier, Duration, Ailment Chance, Exposure / Wither",
    "coreMechanic": "Applies lingering damage allowing 100% uptime while dodging boss slams.",
    "pros": "Extremely safe playstyle; easy to gear early in SSF leagues.",
    "cons": "Damage cap (35.8 Million DPS DoT cap hardcoded in PoE); cannot instantly burst phases.",
    "ssfGearPriorities": [
      "+% Damage Over Time Multiplier on Weapon, Amulet, and Gloves",
      "100% Chance to Inflict Ailment (Ignite / Poison / Bleed)",
      "Malevolence aura with Reservation Efficiency",
      "Wither / Exposure setups"
    ]
  },
  {
    "id": "minions",
    "name": "Minion Commanders (Necromancer & Guardian)",
    "primaryScalingStat": "Minion Gem Level, Minion Attack/Cast Speed, Minion Crit, Auras",
    "coreMechanic": "Army of autonomous summons that draw aggro and attack independently.",
    "pros": "High safety with meatshields; handles reflect and strange map mods easily.",
    "cons": "Minion survivability management in red maps; gear requires dedicated minion affixes.",
    "ssfGearPriorities": [
      "+2 to Level of All Minion Skill Gems on Helmet / Wand",
      "Bone Rings crafted with Minion Attack & Cast Speed",
      "Ghastly Eye Abyss Jewels with Flat Added Physical/Chaos to Minions",
      "Feeding Frenzy and Flesh Offering speed engines"
    ]
  }
];
