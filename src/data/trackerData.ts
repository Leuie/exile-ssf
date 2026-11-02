import type { TrackerItem } from '../types';

export const INITIAL_TRACKER_ITEMS: TrackerItem[] = [
  // Daily Micro-Goals
  {
    id: 'daily-kirac',
    title: 'Run 1-2 Kirac Missions & Check Shop Reset',
    category: 'daily',
    description: 'Completing a Kirac mission resets his inventory. Buy all uncompleted maps with Chance / Alchemy orbs to build Atlas completion.',
    completed: false,
    rewardInfo: 'Free map completions & currency sustain'
  },
  {
    id: 'daily-jun-unveils',
    title: 'Run 3-5 Jun / Betrayal Encounters for Unveils',
    category: 'daily',
    description: 'Progress toward critical benchcraft unlocks: Gravicius (Phys taken as Fire/Light), Elreon (-Mana cost on jewellery), and Aisling.',
    completed: false,
    rewardInfo: 'Permanent benchcraft unlocks'
  },
  {
    id: 'daily-harvest-lifeforce',
    title: 'Farm 3 Harvest Sacred Groves',
    category: 'daily',
    description: 'Bank 1,000+ Vivid (Yellow) and Wild (Purple) lifeforce for resist swaps, boss fragment swaps, and reforge crafts.',
    completed: false,
    rewardInfo: 'Lifeforce for deterministic crafting'
  },
  {
    id: 'daily-expedition-logbook',
    title: 'Run 1 Expedition Logbook (Rog / Tujen)',
    category: 'daily',
    description: 'Craft 2-3 high tier gear upgrades with Rog or accumulate stacked decks and raw currency with Tujen.',
    completed: false,
    rewardInfo: 'T1/T2 rare gear & raw crafting currency'
  },
  {
    id: 'daily-gem-check',
    title: 'Check Weapon-Swap Gems & Flip 20/20 Gems',
    category: 'daily',
    description: 'Check experience on the 6 gems leveling in your alternate weapon set. Flip level 20 supports with 1 GCP for 20% quality.',
    completed: false,
    rewardInfo: 'Free 20% quality support gems'
  },

  // Weekly Milestones: Week 1
  {
    id: 'w1-campaign',
    title: 'Finish Campaign (Acts 1 to 10) & 24 Passive Skill Points',
    category: 'weekly',
    tier: 'Week 1',
    description: 'Complete all side quests with "Book of Skill" rewards and reach Karui Shores at Level 68+.',
    completed: false,
    rewardInfo: 'Full base skill tree unlocked'
  },
  {
    id: 'w1-res-cap',
    title: 'Cap Post Kitava Resistances (75% Fire, Cold, Lightning) + Positive Chaos',
    category: 'weekly',
    tier: 'Week 1',
    description: 'Benchcraft resistances on every piece of gear to overcome the -60% total campaign penalty.',
    completed: false,
    rewardInfo: 'Zero one shots in white maps'
  },
  {
    id: 'w1-atlas-white-yellow',
    title: 'Unlock 60+ Atlas Passive Points (White & Yellow Maps)',
    category: 'weekly',
    tier: 'Week 1',
    description: 'Complete bonus objectives with Magic (Transmuted) White maps and Rare (Alchemied) Yellow maps.',
    completed: false,
    rewardInfo: 'Kirac sustain & initial Essence/Expedition wheels'
  },
  {
    id: 'w1-merc-lab',
    title: 'Complete Merciless Labyrinth (6th Ascendancy Point)',
    category: 'weekly',
    tier: 'Week 1',
    description: 'Unlock your 3rd Ascendancy notable at the Plaza of Sarn.',
    completed: false,
    rewardInfo: 'Major character power spike'
  },
  {
    id: 'w1-two-voidstones',
    title: 'Acquire First 2 Voidstones (Quest Eater & Exarch)',
    category: 'weekly',
    tier: 'Week 1',
    description: 'Defeat The Black Star, Infinite Hunger, Quest Searing Exarch, and Quest Eater of Worlds in T14+ maps.',
    completed: false,
    rewardInfo: 'All natural drop maps boosted to Tier 14-16'
  },

  // Weekly Milestones: Week 2
  {
    id: 'w2-uber-lab',
    title: 'Complete Eternal (Uber) Labyrinth (8th Ascendancy Point)',
    category: 'weekly',
    tier: 'Week 2',
    description: 'Find an Offering to the Goddess in a trial or buy from ritual/tujen, complete Uber Lab for final Ascendancy node.',
    completed: false,
    rewardInfo: 'Full 8/8 Ascendancy power'
  },
  {
    id: 'w2-six link',
    title: 'Acquire Your First 6 Linked Body Armour or Weapon',
    category: 'weekly',
    tier: 'Week 2',
    description: 'Farm "The Porcupine" (Bow), "The Chains that Bind" (Chest), a corrupted 6L, or 1500 fusings / Black Morrigan beastcraft.',
    completed: false,
    rewardInfo: '30-40% more character damage'
  },
  {
    id: 'w2-full-suppression',
    title: 'Achieve 100% Spell Suppression & 4,500+ Life / ES Pool',
    category: 'weekly',
    tier: 'Week 2',
    description: 'Roll T1-T2 Suppression on Helmet, Body Armour, Gloves, Boots, and passive tree wheels.',
    completed: false,
    rewardInfo: 'Survive all pinnacle boss spells'
  },
  {
    id: 'w2-four-voidstones',
    title: 'Acquire All 4 Voidstones (The Maven & Uber Elder)',
    category: 'weekly',
    tier: 'Week 2',
    description: 'Witness 10-boss invitations for Maven\'s Writ, and collect Shaper + Elder fragments to defeat Uber Elder.',
    completed: false,
    rewardInfo: 'Every single map on Atlas becomes Tier 16'
  },

  // Weekly Milestones: Week 3
  {
    id: 'w3-pantheon-max',
    title: 'Upgrade Major & Minor Pantheons with Divine Vessels',
    category: 'weekly',
    tier: 'Week 3',
    description: 'Capture Reef (Brine King freeze immunity), Ashen Wood (Ralakesh CB immunity), and Abberath (burning ground).',
    completed: false,
    rewardInfo: 'Permanent ailment & ground hazard immunity'
  },
  {
    id: 'w3-favoured-slots',
    title: 'Unlock 10+ / 12 Favoured Map Slots',
    category: 'weekly',
    tier: 'Week 3',
    description: 'Complete memory storylines, conquerors, invitations, and pinnacle bosses to favour your ideal layout.',
    completed: false,
    rewardInfo: 'Infinite sustain of single favourite map'
  },
  {
    id: 'w3-t17-readiness',
    title: 'Clear First Tier 17 Map & Attempt Uber Bosses',
    category: 'weekly',
    tier: 'Week 3',
    description: 'Optimize suffixes, eldritch implicits, and gem quality to challenge Tier 17 maps and pinnacle ubers.',
    completed: false,
    rewardInfo: 'Peak SSF mastery achievement'
  },

  // League-Wide Macro Goals
  {
    id: 'macro-atlas-115',
    title: '115 / 115 Atlas Map Bonus Objectives Completed',
    category: 'macro_atlas',
    description: 'Complete every unique and normal map bonus objective on the Atlas of Worlds.',
    completed: false,
    rewardInfo: '115 Base Atlas Skill Points'
  },
  {
    id: 'macro-voidstone-red',
    title: 'Grasping Voidstone (Searing Exarch)',
    category: 'macro_voidstones',
    description: 'Defeat The Searing Exarch.',
    completed: false
  },
  {
    id: 'macro-voidstone-blue',
    title: 'Flesh Voidstone (Eater of Worlds)',
    category: 'macro_voidstones',
    description: 'Defeat The Eater of Worlds.',
    completed: false
  },
  {
    id: 'macro-voidstone-ceremonial',
    title: 'Ceremonial Voidstone (The Maven)',
    category: 'macro_voidstones',
    description: 'Defeat The Maven.',
    completed: false
  },
  {
    id: 'macro-voidstone-decayed',
    title: 'Decayed Voidstone (The Uber Elder)',
    category: 'macro_voidstones',
    description: 'Defeat The Uber Elder in The Shaper\'s Realm.',
    completed: false
  },
  {
    id: 'macro-pantheon-brine',
    title: 'Soul of the Brine King (Freeze & Chill Immunity)',
    category: 'macro_pantheon',
    description: 'Captured Glace in Reef Map with Divine Vessel.',
    completed: false
  },
  {
    id: 'macro-pantheon-ralakesh',
    title: 'Soul of Ralakesh (Corrupted Blood Immunity)',
    category: 'macro_pantheon',
    description: 'Captured Marrowgore in Ashen Wood Map with Divine Vessel.',
    completed: false
  },
  {
    id: 'macro-unveil-gravicius',
    title: 'Gravicius Unveil: % Phys Damage Taken as Fire/Lightning',
    category: 'macro_unveils',
    description: 'Unveil Gravicius-veiled body armour to unlock the benchcraft.',
    completed: false
  },
  {
    id: 'macro-unveil-elreon',
    title: 'Elreon Unveil: -7 to Non-Channelling / Channelling Mana Cost',
    category: 'macro_unveils',
    description: 'Unveil Elreon-veiled rings and amulets.',
    completed: false
  }
];
