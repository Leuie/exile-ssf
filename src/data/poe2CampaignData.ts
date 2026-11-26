export interface Poe2CampaignStep {
  id: string;
  zone: string;
  bossOrObjective: string;
  permanentBonus?: string;
  tip: string;
}

export interface Poe2CampaignAct {
  actNumber: number;
  label: string;
  difficulty: 'Normal' | 'Cruel';
  summary: string;
  steps: Poe2CampaignStep[];
}

export const POE2_CAMPAIGN_ACTS: Poe2CampaignAct[] = [
  {
    actNumber: 1,
    label: 'Act 1 (Normal)',
    difficulty: 'Normal',
    summary: 'Ogham Village & Manor — unlocks +30 Spirit, +10% Cold Res, +20 Max Life, +2 Weapon Set Points, and Salvage Bench.',
    steps: [
      {
        id: 'n1-clearfell',
        zone: 'Clearfell',
        bossOrObjective: 'Beira of the Rotten Pack',
        permanentBonus: '+10% Cold Resistance',
        tip: 'Hug the northern/outer perimeter of Clearfell to find Beira quickly for permanent Cold Res.'
      },
      {
        id: 'n1-red-vale',
        zone: 'The Red Vale → The Grelwood',
        bossOrObjective: 'Three Runed Obelisks & The Hooded One',
        tip: 'Collect all 3 Rust Runes to free The Hooded One—unlocks free item identification and Gold passive respecs.'
      },
      {
        id: 'n1-freythorn',
        zone: 'Freythorn (via Hunting Grounds)',
        bossOrObjective: 'The King in the Mists',
        permanentBonus: '+30 Maximum Spirit',
        tip: 'Complete the 4 Ritual Altars to spawn the boss. Mandatory for early Herald/Minion/Buff Spirit reservation.'
      },
      {
        id: 'n1-hunting-grounds',
        zone: 'Hunting Grounds',
        bossOrObjective: 'Crowbell',
        permanentBonus: '+2 Weapon Set Passive Skill Points',
        tip: 'Track Crowbell down the arena lane—grants your first Book of Specialisation.'
      },
      {
        id: 'n1-ogham-farmlands',
        zone: 'Ogham Farmlands → Ogham Village',
        bossOrObjective: "Una's Lute & Renly's Smithing Tools",
        permanentBonus: '+2 Weapon Set Points + Salvage Bench',
        tip: 'Return Una\'s Lute for +2 Weapon Set points and Renly\'s Tools to unlock the Salvage Bench for Artificer Shards.'
      },
      {
        id: 'n1-ogham-manor',
        zone: 'Ogham Manor',
        bossOrObjective: 'Candlemass & Count Geonor',
        permanentBonus: '+20 Maximum Life (Candlemass)',
        tip: 'Click the altar in Ogham Manor Floor 1 to spawn Candlemass for +20 Max Life before fighting Count Geonor.'
      }
    ]
  },
  {
    actNumber: 2,
    label: 'Act 2 (Normal)',
    difficulty: 'Normal',
    summary: 'Vastiri Desert & Dreadnought — unlocks Trial of the Sekhemas (1st Ascendancy), +10% Lightning Res, and Kabala +2 Skill Points.',
    steps: [
      {
        id: 'n2-traitors-passage',
        zone: "Traitor's Passage",
        bossOrObjective: 'Balbala, the Traitor',
        permanentBonus: 'Unlocks Trial of the Sekhemas (2 Ascendancy Points)',
        tip: 'Drops Balbala\'s Barya. Travel to the Trial of the Sekhemas right away for your first Ascendancy.'
      },
      {
        id: 'n2-keth',
        zone: 'Keth',
        bossOrObjective: 'Kabala, Constrictor Queen',
        permanentBonus: '+2 Weapon Set Passive Skill Points',
        tip: 'Clear the Venom Pit arena in Keth for the Book of Specialisation.'
      },
      {
        id: 'n2-valley-titans',
        zone: 'Valley of the Titans',
        bossOrObjective: 'Ancient Vows (Sun / Kabala Clan Relics)',
        permanentBonus: '30% Increased Charm Charges Gained OR 15% Mana Recovery from Flasks',
        tip: 'Place both Relics on the altar in Valley of the Titans—you can freely swap the buff later by revisiting.'
      },
      {
        id: 'n2-deshar',
        zone: 'Deshar → Spires of Deshar',
        bossOrObjective: 'Final Letter + Sisters of Garukhan Shrine',
        permanentBonus: '+2 Weapon Set Points + +10% Lightning Resistance',
        tip: 'Loot the Final Letter from the fallen body in Deshar and click the Sisters of Garukhan shrine in Spires of Deshar.'
      },
      {
        id: 'n2-dreadnought',
        zone: 'The Dreadnought Vanguard',
        bossOrObjective: 'Jamanra, the Abomination',
        tip: 'Cap Lightning Resistance (75%) with Runes/Rings before this fight; hide behind Asala\'s shield during the sandstorm.'
      }
    ]
  },
  {
    actNumber: 3,
    label: 'Act 3 (Normal)',
    difficulty: 'Normal',
    summary: 'Jungle Ruins & Vaal City — unlocks +30 Spirit, +10% Fire Res, Venom Draught permanent buff, Reforging Bench, and Trial of Chaos.',
    steps: [
      {
        id: 'n3-jungle-ruins',
        zone: 'Jungle Ruins',
        bossOrObjective: 'Mighty Silverfist',
        permanentBonus: '+2 Weapon Set Passive Skill Points',
        tip: 'Watch out for the telegraphed pillar slam—dodge roll behind him for an easy +2 points.'
      },
      {
        id: 'n3-azaks-bog',
        zone: 'The Azak Bog',
        bossOrObjective: 'Ignagduk, the Bog Witch',
        permanentBonus: '+30 Maximum Spirit',
        tip: 'Stack Fire Resistance before engaging. Drops the Gembloom Skull for +30 permanent Spirit.'
      },
      {
        id: 'n3-venom-crypts',
        zone: 'The Venom Crypts',
        bossOrObjective: 'Corpsewade Phial → Servi (Permanent Venom Draught)',
        permanentBonus: 'Choice: 25% Stun Threshold OR 30% Elemental Ailment Threshold OR 25% Mana Regen',
        tip: 'Permanent choice in Normal! Most SSF builds pick Stun Threshold or Elemental Ailment Threshold.'
      },
      {
        id: 'n3-molten-vault',
        zone: 'The Molten Vault',
        bossOrObjective: 'Mektul, the Forgemaster',
        permanentBonus: 'Unlocks the Reforging Bench (3-to-1 Upgrades)',
        tip: 'DPS check against advancing lava—bring Fire Res and stay close to Mektul.'
      },
      {
        id: 'n3-jiquani',
        zone: "Jiquani's Machinarium",
        bossOrObjective: 'Blackjaw, the Remnant',
        permanentBonus: '+10% Fire Resistance',
        tip: 'Requires a Small Soul Core to open his room—grants The Flame Core (+10% Fire Res).'
      },
      {
        id: 'n3-chaos-doryani',
        zone: 'Temple of Chaos & The Black Chambers',
        bossOrObjective: 'Chimeral Wetlands Ultimatum + Doryani, Royal Thaumaturge',
        permanentBonus: 'Unlocks Trial of Chaos (2nd Ascendancy)',
        tip: 'Run the 4-room Trial of Chaos for Ascendancy points 3 & 4, then defeat Doryani to enter Cruel.'
      }
    ]
  },
  {
    actNumber: 4,
    label: 'Act 1 (Cruel)',
    difficulty: 'Cruel',
    summary: 'Cruel Ogham — second round of +10% Cold Res, +8% Max Life, and +4 Weapon Set Passive Skill Points.',
    steps: [
      {
        id: 'c1-clearfell',
        zone: 'Clearfell (Cruel)',
        bossOrObjective: 'Beira of the Rotten Pack',
        permanentBonus: '+10% Cold Resistance',
        tip: 'Offsets the Cruel difficulty resistance penalty right away.'
      },
      {
        id: 'c1-hunting-farmlands',
        zone: 'Hunting Grounds & Ogham Farmlands (Cruel)',
        bossOrObjective: "Crowbell + Una's Lute",
        permanentBonus: '+4 Weapon Set Passive Skill Points (2 each)',
        tip: 'Grab both quick side objectives for +4 passive points.'
      },
      {
        id: 'c1-ogham-manor',
        zone: 'Ogham Manor (Cruel)',
        bossOrObjective: 'Candlemass & Count Geonor',
        permanentBonus: '+8% Increased Maximum Life (Candlemass)',
        tip: 'Huge permanent % Life multiplier—never skip Candlemass in Cruel!'
      }
    ]
  },
  {
    actNumber: 5,
    label: 'Act 2 (Cruel)',
    difficulty: 'Cruel',
    summary: 'Cruel Vastiri — +10% Lightning Res, +4 Weapon Set Points, and Ancient Vows Relic upgrade.',
    steps: [
      {
        id: 'c2-keth-deshar',
        zone: 'Keth & Deshar (Cruel)',
        bossOrObjective: 'Kabala + Final Letter',
        permanentBonus: '+4 Weapon Set Passive Skill Points',
        tip: 'Collect both Books of Specialisation while progressing toward Spires of Deshar.'
      },
      {
        id: 'c2-spires',
        zone: 'Spires of Deshar (Cruel)',
        bossOrObjective: 'Sisters of Garukhan Shrine',
        permanentBonus: '+10% Lightning Resistance',
        tip: 'Quick click inside Spires of Deshar—offsets Cruel Lightning Res penalty before Jamanra.'
      }
    ]
  },
  {
    actNumber: 6,
    label: 'Act 3 (Cruel)',
    difficulty: 'Cruel',
    summary: 'Cruel Vaal City — final +40 Spirit (100 base total!), +10% Chaos Res Venom Draught, +10% Fire Res, and Endgame Atlas unlock.',
    steps: [
      {
        id: 'c3-jungle-ruins',
        zone: 'Jungle Ruins (Cruel)',
        bossOrObjective: 'Mighty Silverfist',
        permanentBonus: '+2 Weapon Set Passive Skill Points',
        tip: 'Final Weapon Set skill book before Endgame.'
      },
      {
        id: 'c3-azak-bog',
        zone: 'The Azak Bog (Cruel)',
        bossOrObjective: 'Ignagduk, the Bog Witch',
        permanentBonus: '+40 Maximum Spirit (Reaches 100 Base Spirit)',
        tip: 'Mandatory for Endgame—brings your permanent campaign Spirit to 100.'
      },
      {
        id: 'c3-venom-crypts',
        zone: 'The Venom Crypts (Cruel)',
        bossOrObjective: 'Servi (Cruel Venom Draught)',
        permanentBonus: 'Choice: +10% Chaos Resistance OR +5 to All Attributes OR 15% Reduced Slowing Potency',
        tip: 'In SSF, +10% Chaos Resistance is almost always the strongest endgame pick!'
      },
      {
        id: 'c3-blackjaw-doryani',
        zone: "Jiquani's Machinarium & The Black Chambers (Cruel)",
        bossOrObjective: 'Blackjaw + Doryani (Cruel)',
        permanentBonus: '+10% Fire Resistance + Unlocks Endgame Atlas & Waystones',
        tip: 'Defeat Blackjaw for +10% Fire Res, then clear Doryani to unlock the Ziggurat Refuge Map Device!'
      }
    ]
  }
];
