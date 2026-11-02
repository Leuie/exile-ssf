import type { DualLink } from '../types';

export const DUAL_LINKS_DATABASE: DualLink[] = [
  // Mechanics & Crafting
  {
    name: "The Lord's Labyrinth",
    category: 'mechanic',
    poeWikiUrl: 'https://www.poewiki.net/wiki/The_Lord%27s_Labyrinth',
    poeDbUrl: 'https://poedb.tw/us/The_Lord%27s_Labyrinth',
    description: 'Dungeon created by Emperor Izaro to test ascendants. Grants Ascendancy passive points and Divine Font gem crafting.',
    tags: ['lab', 'labyrinth', 'ascendancy', 'izaro', 'divine font', 'trials']
  },
  {
    name: 'Gift to the Goddess',
    category: 'currency',
    poeWikiUrl: 'https://www.poewiki.net/wiki/Gift_to_the_Goddess',
    poeDbUrl: 'https://poedb.tw/us/Gift_to_the_Goddess',
    description: 'Empowered offering granting 8 uses of the Divine Font in an area level 83 Eternal Labyrinth of Opportunity.',
    tags: ['lab', 'gift', 'font', 'transfigured', 'exceptional']
  },
  {
    name: 'Crafting Bench',
    category: 'mechanic',
    poeWikiUrl: 'https://www.poewiki.net/wiki/Crafting_Bench',
    poeDbUrl: 'https://poedb.tw/us/Crafting_Bench',
    description: 'Hideout station used to apply deterministic modifiers, change socket colors, and manipulate prefix/suffix locks.',
    tags: ['crafting', 'bench', 'hideout']
  },
  {
    name: 'Essence',
    category: 'currency',
    poeWikiUrl: 'https://www.poewiki.net/wiki/Essence',
    poeDbUrl: 'https://poedb.tw/us/Essence',
    description: 'Deterministic crafting items that guarantee one specific affix when upgrading normal to rare, or rerolling rare gear.',
    tags: ['crafting', 'essence', 'greed', 'scorn', 'envy', 'dread']
  },
  {
    name: 'Expedition (Rog the Dealer)',
    category: 'mechanic',
    poeWikiUrl: 'https://www.poewiki.net/wiki/Rog,_the_Dealer',
    poeDbUrl: 'https://poedb.tw/us/Rog',
    description: 'The premier SSF early-to-mid gear generator. Allows step by step crafting offers to add, upgrade, or remove modifiers.',
    tags: ['crafting', 'expedition', 'rog', 'gear']
  },
  {
    name: 'Harvest (Horticrafting)',
    category: 'mechanic',
    poeWikiUrl: 'https://www.poewiki.net/wiki/Harvest',
    poeDbUrl: 'https://poedb.tw/us/Harvest',
    description: 'Sacred Grove lifeforce crafting: Reforge with specific tags, swap elemental resists, swap boss fragments, and enchant gear.',
    tags: ['crafting', 'harvest', 'lifeforce', 'reforge', 'fragment swap']
  },
  {
    name: 'Betrayal (Immortal Syndicate)',
    category: 'mechanic',
    poeWikiUrl: 'https://www.poewiki.net/wiki/Immortal_Syndicate',
    poeDbUrl: 'https://poedb.tw/us/Immortal_Syndicate',
    description: 'Unveil powerful benchcraft recipes (Gravicius phys taken as fire/light, Elreon -mana cost, Aisling unveils, Catarina).',
    tags: ['syndicate', 'jun', 'betrayal', 'unveils', 'gravicius']
  },
  {
    name: 'The Pantheon',
    category: 'mechanic',
    poeWikiUrl: 'https://www.poewiki.net/wiki/The_Pantheon',
    poeDbUrl: 'https://poedb.tw/us/The_Pantheon',
    description: 'Major and Minor god buffs upgraded with Divine Vessels. Vital in SSF for Freeze, Bleed/CB, Burning Ground, and Stun immunities.',
    tags: ['pantheon', 'divine vessel', 'brine king', 'ralakesh', 'abberath']
  },
  {
    name: 'Eldritch Implicit Modifiers',
    category: 'mechanic',
    poeWikiUrl: 'https://www.poewiki.net/wiki/Eldritch_implicit_modifier',
    poeDbUrl: 'https://poedb.tw/us/Eldritch_implicit_modifier',
    description: 'Eater of Worlds & Searing Exarch ichors/embers applied to helmet, body armor, gloves, and boots for deterministic utility.',
    tags: ['crafting', 'eldritch', 'ichor', 'ember', 'exarch', 'eater']
  },

  // Key SSF Bases & Uniques
  {
    name: 'Lightning Coil',
    category: 'item',
    poeWikiUrl: 'https://www.poewiki.net/wiki/Lightning_Coil',
    poeDbUrl: 'https://poedb.tw/us/Lightning_Coil',
    description: 'Top tier defensive body armour: 50% of Physical Damage from Hits taken as Lightning Damage.',
    tags: ['unique', 'chest', 'defense', 'phys taken as']
  },
  {
    name: 'Cloak of Flame',
    category: 'item',
    poeWikiUrl: 'https://www.poewiki.net/wiki/Cloak_of_Flame',
    poeDbUrl: 'https://poedb.tw/us/Cloak_of_Flame',
    description: '40% of Physical Damage from Hits taken as Fire Damage + Ignite duration reduction. Highly accessible SSF defensive base.',
    tags: ['unique', 'chest', 'defense', 'fire']
  },
  {
    name: 'Rise of the Phoenix',
    category: 'item',
    poeWikiUrl: 'https://www.poewiki.net/wiki/Rise_of_the_Phoenix',
    poeDbUrl: 'https://poedb.tw/us/Rise_of_the_Phoenix',
    description: '+5% to maximum Fire Resistance and Life Regeneration. Staple shield for Righteous Fire sustain.',
    tags: ['unique', 'shield', 'righteous fire', 'fire res']
  },
  {
    name: 'Dawnbreaker',
    category: 'item',
    poeWikiUrl: 'https://www.poewiki.net/wiki/Dawnbreaker',
    poeDbUrl: 'https://poedb.tw/us/Dawnbreaker',
    description: 'Colossal Tower Shield dropping from The Searing Exarch. Converts 10-20% of Physical Damage from Hits taken as Fire.',
    tags: ['unique', 'shield', 'exarch', 'defense']
  },
  {
    name: 'Fourth Vow',
    category: 'item',
    poeWikiUrl: 'https://www.poewiki.net/wiki/The_Fourth_Vow',
    poeDbUrl: 'https://poedb.tw/us/The_Fourth_Vow',
    description: 'Devout Chainmail: Armour applies to Chaos Damage taken from Hits. Paired with Divine Flesh for extreme mitigation.',
    tags: ['unique', 'chest', 'chaos', 'armor']
  },
  {
    name: 'Heatshiver',
    category: 'item',
    poeWikiUrl: 'https://www.poewiki.net/wiki/Heatshiver',
    poeDbUrl: 'https://poedb.tw/us/Heatshiver',
    description: 'Leather Hood granting massive Extra Fire Damage against Frozen and Chilled enemies.',
    tags: ['unique', 'helmet', 'cold', 'freeze']
  },
  {
    name: 'Taste of Hate',
    category: 'item',
    poeWikiUrl: 'https://www.poewiki.net/wiki/Taste_of_Hate',
    poeDbUrl: 'https://poedb.tw/us/Taste_of_Hate',
    description: 'Sapphire Flask converting physical damage taken to cold and granting extra cold damage on attacks/spells.',
    tags: ['unique', 'flask', 'defense', 'cold']
  },
  {
    name: 'Divine Vessel',
    category: 'currency',
    poeWikiUrl: 'https://www.poewiki.net/wiki/Divine_Vessel',
    poeDbUrl: 'https://poedb.tw/us/Divine_Vessel',
    description: 'Placed in map device alongside relevant boss maps to capture god souls and upgrade Pantheon powers.',
    tags: ['currency', 'pantheon', 'map device']
  },

  // Key SSF Divination Cards
  {
    name: 'The Porcupine',
    category: 'div_card',
    poeWikiUrl: 'https://www.poewiki.net/wiki/The_Porcupine',
    poeDbUrl: 'https://poedb.tw/us/The_Porcupine',
    description: 'Set of 6. Rewards a 6 linked Short Bow (iLvl 50). The staple SSF foundation for EA Ballista and Toxic Rain.',
    tags: ['div_card', '6 link', 'bow', 'gardens', 'courtyard', 'plaza']
  },
  {
    name: 'The Chains that Bind',
    category: 'div_card',
    poeWikiUrl: 'https://www.poewiki.net/wiki/The_Chains_that_Bind',
    poeDbUrl: 'https://poedb.tw/us/The_Chains_that_Bind',
    description: 'Set of 11. Rewards a random 6 linked Body Armour. Farmable in Dungeon, Cells, Cage, and Pen layouts.',
    tags: ['div_card', '6 link', 'chest', 'dungeon', 'cage']
  },
  {
    name: 'The Dapper Prodigy',
    category: 'div_card',
    poeWikiUrl: 'https://www.poewiki.net/wiki/The_Dapper_Prodigy',
    poeDbUrl: 'https://poedb.tw/us/The_Dapper_Prodigy',
    description: 'Set of 6. Rewards a 6 linked Body Armour with Item Level 100.',
    tags: ['div_card', '6 link', 'ilvl 100', 'residence', 'bazaar']
  },
  {
    name: 'Humility',
    category: 'div_card',
    poeWikiUrl: 'https://www.poewiki.net/wiki/Humility',
    poeDbUrl: 'https://poedb.tw/us/Humility',
    description: 'Set of 9. Rewards a Tabula Rasa (Simple Robe 6-white linked). Farmable in Blood Aqueducts (Act 9) or Channel/Waterways.',
    tags: ['div_card', 'tabula rasa', 'blood aqueduct', 'channel']
  },
  {
    name: 'Imperial Legacy',
    category: 'div_card',
    poeWikiUrl: 'https://www.poewiki.net/wiki/Imperial_Legacy',
    poeDbUrl: 'https://poedb.tw/us/Imperial_Legacy',
    description: 'Set of 22. Rewards an Item Level 100 6 Linked Imperial Bow. Farmable in Desert, Dune, and Oasis tilesets.',
    tags: ['div_card', '6 link', 'imperial bow', 'dunes']
  },

  // Bosses & Pinnacle Encounters
  {
    name: 'The Searing Exarch',
    category: 'boss',
    poeWikiUrl: 'https://www.poewiki.net/wiki/The_Searing_Exarch',
    poeDbUrl: 'https://poedb.tw/us/The_Searing_Exarch',
    description: 'Eldritch Pinnacle Boss awarding the Red Voidstone (Grasping Voidstone) and Eldritch Embers.',
    tags: ['boss', 'voidstone', 'eldritch', 'pinnacle']
  },
  {
    name: 'The Eater of Worlds',
    category: 'boss',
    poeWikiUrl: 'https://www.poewiki.net/wiki/The_Eater_of_Worlds',
    poeDbUrl: 'https://poedb.tw/us/The_Eater_of_Worlds',
    description: 'Eldritch Pinnacle Boss awarding the Blue Voidstone (Flesh Voidstone) and Eldritch Ichors.',
    tags: ['boss', 'voidstone', 'eldritch', 'pinnacle']
  },
  {
    name: 'The Maven',
    category: 'boss',
    poeWikiUrl: 'https://www.poewiki.net/wiki/The_Maven',
    poeDbUrl: 'https://poedb.tw/us/The_Maven',
    description: 'Pinnacle cosmic entity fought via the Maven\'s Writ. Awards the Ceremonial Voidstone and Elevated Orbs.',
    tags: ['boss', 'voidstone', 'maven writ', 'invitations']
  },
  {
    name: 'The Uber Elder',
    category: 'boss',
    poeWikiUrl: 'https://www.poewiki.net/wiki/The_Uber_Elder',
    poeDbUrl: 'https://poedb.tw/us/The_Uber_Elder',
    description: 'Combined encounter of The Shaper and The Elder in The Shaper\'s Realm. Awards the Decayed Voidstone and Watcher\'s Eye.',
    tags: ['boss', 'voidstone', 'shaper', 'elder', 'watchers eye']
  },
  {
    name: 'The Black Star',
    category: 'boss',
    poeWikiUrl: 'https://www.poewiki.net/wiki/The_Black_Star',
    poeDbUrl: 'https://poedb.tw/us/The_Black_Star',
    description: 'Searing Exarch mini-boss guarding the Polaric Voidstone questline.',
    tags: ['boss', 'exarch', 'quest']
  },
  {
    name: 'The Infinite Hunger',
    category: 'boss',
    poeWikiUrl: 'https://www.poewiki.net/wiki/The_Infinite_Hunger',
    poeDbUrl: 'https://poedb.tw/us/The_Infinite_Hunger',
    description: 'Eater of Worlds sub-boss featuring the Mud Drowning arena mechanic.',
    tags: ['boss', 'eater', 'quest']
  },

  // Base Items & Crafting Targets
  {
    name: 'Fractured Base',
    category: 'base',
    poeWikiUrl: 'https://www.poewiki.net/wiki/Fractured_item',
    poeDbUrl: 'https://poedb.tw/us/Fractured_item',
    description: 'Item with 1 permanent locked modifier (golden text) that cannot be altered or removed by crafting currency. Golden ticket of SSF.',
    tags: ['base', 'crafting', 'fracture', 'golden']
  },
  {
    name: 'Two-Toned Boots',
    category: 'base',
    poeWikiUrl: 'https://www.poewiki.net/wiki/Two-Toned_Boots',
    poeDbUrl: 'https://poedb.tw/us/Two-Toned_Boots',
    description: 'Hybrid base with dual-resist implicit (+12% to Fire/Cold/Light). Perfect for solving early-to-mid SSF resistances.',
    tags: ['base', 'boots', 'resistances']
  },
  {
    name: 'Astral Plate',
    category: 'base',
    poeWikiUrl: 'https://www.poewiki.net/wiki/Astral_Plate',
    poeDbUrl: 'https://poedb.tw/us/Astral_Plate',
    description: 'High armour body base granting +12% to all Elemental Resistances implicit.',
    tags: ['base', 'chest', 'armour', 'all res']
  },
  {
    name: 'Grasping Mail',
    category: 'base',
    poeWikiUrl: 'https://www.poewiki.net/wiki/Grasping_Mail',
    poeDbUrl: 'https://poedb.tw/us/Grasping_Mail',
    description: 'Obtained via 60 Breach Ring vendor recipe. Can roll exclusive breach modifiers (e.g., 100% Increased Global Defences).',
    tags: ['base', 'breach', 'vendor recipe', 'global defences']
  },
  {
    name: 'Penance Brand of Dissipation',
    category: 'gem',
    poeWikiUrl: 'https://www.poewiki.net/wiki/Penance_Brand_of_Dissipation',
    poeDbUrl: 'https://poedb.tw/us/Penance_Brand_of_Dissipation',
    description: 'Transfigured physical/lightning brand skill gem that pulses escalating holy energy on target up to 20 stages, delivering astronomical single target boss damage.',
    tags: ['gem', 'transfigured', 'brand', 'inquisitor', 'elementalist', 'penance brand', 'bossing']
  },
];

export function findDualLink(name: string): DualLink | undefined {
  return DUAL_LINKS_DATABASE.find(item => 
    item.name.toLowerCase() === name.toLowerCase() ||
    item.tags.some(tag => tag.toLowerCase() === name.toLowerCase())
  );
}

export function searchDualLinks(query: string): DualLink[] {
  if (!query) return DUAL_LINKS_DATABASE;
  const q = query.toLowerCase().trim();
  return DUAL_LINKS_DATABASE.filter(item => 
    item.name.toLowerCase().includes(q) ||
    item.description.toLowerCase().includes(q) ||
    item.category.toLowerCase().includes(q) ||
    item.tags.some(tag => tag.toLowerCase().includes(q))
  );
}
