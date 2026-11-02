import type { SSFBuild } from '../types';

export const SSF_BUILDS: SSFBuild[] = [
  {
    id: 'thyworm-srs-guardian-ssf',
    name: 'Summon Raging Spirits (SRS) Minion Guardian',
    class: 'Templar',
    ascendancy: 'Guardian',
    creator: 'Thyworm',
    creatorUrl: 'https://mobalytics.gg/poe/builds/thyworm-srs-guardian-ssf',
    pobUrl: 'https://pobb.in/thyworm-srs-guardian',
    videoGuideUrl: 'https://www.youtube.com/@Thyworm',
    ssfViabilityScore: 9.9,
    uniqueDependency: 'None (Pure Rare)',
    playstyle: 'Minion / Corpse',
    summary: 'The undisputed gold standard for cozy, beginner friendly SSF minion gameplay. Powered by the Guardian\'s Sentinel of Radiance (a walking nuke that carries the campaign) and Elemental Relics (granting free Level 27 Anger, Hatred, and Wrath auras), allowing your fiery skull army to conquer red maps and Voidstones without needing a single unique item.',
    pros: [
      'Radiant Crusade (Sentinel of Radiance) obliterates the entire campaign from Normal Lab onward',
      'Elemental Relics grant free triple elemental damage auras without mana reservation',
      'Time of Need delivers massive automatic burst regeneration and constant curse cleansing',
      '100% SSF friendly: Scales purely off rare gem levels, minion damage affixes, and block',
      'Full Mobalytics guide with detailed progression steps by Thyworm'
    ],
    cons: [
      'Requires casting SRS to maintain 20 active raging spirits against pinnacle bosses',
      'Minion elemental resistances need capped via passive nodes or Ghastly Eye jewels in red maps'
    ],
    levelingGems: [
      'Holy Flame Totem + Smite / Rolling Magma (Acts 1 to 3)',
      'Normal Lab (Act 3): Allocate "Radiant Crusade" -> Sentinel of Radiance carries all boss fights',
      'Summon Raging Spirits + Minion Damage + Melee Splash + Unleash (Act 4 onwards)'
    ],
    keyCraftingSteps: [
      'Wand: Convoking Wand with Minion Damage % and +1 to Level of all Minion Skill Gems (Essence of Fear or 4 socket Resonator craft)',
      'Helmet: Bone Helmet (Minion Damage implicit) crafted with Essence of Greed for Life or Essence of Fear',
      'Shield: Rare Spirit Shield / Aegis crafted with Minion Damage benchcraft and Spell Block',
      'Jewels: Ghastly Eye Jewels rolled with Alterations / Essences for Life + Added Fire/Phys Damage to Minions'
    ],
    targetUniquesOrCards: [
      {
        name: 'The Porcupine',
        farmLocation: 'Gardens / Courtyard / Plaza (for early 6L SRS weapon setup)',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Porcupine',
        poeDbUrl: 'https://poedb.tw/us/The_Porcupine'
      },
      {
        name: 'Tavukai',
        farmLocation: 'Coral Amulet chancing / Betrayal Safehouses (optional Pop SRS scaling)',
        poeWikiUrl: 'https://www.poewiki.net/wiki/Tavukai',
        poeDbUrl: 'https://poedb.tw/us/Tavukai'
      }
    ]
  },
  {
    id: 'righteous-fire-chieftain-inquisitor',
    name: 'Righteous Fire & Fire Trap',
    class: 'Marauder / Templar',
    ascendancy: 'Chieftain / Inquisitor',
    creator: 'Pohx',
    creatorUrl: 'https://pohx.net',
    pobUrl: 'https://pobb.in/mJ8hL0kX928x',
    videoGuideUrl: 'https://www.youtube.com/c/PohxKappa',
    ssfViabilityScore: 10,
    uniqueDependency: 'None (Pure Rare)',
    playstyle: 'DoT',
    summary: 'The undisputed king of SSF comfort. Walk around enemies while they explode in fire. Incredibly tanky with maximum fire resistance scaling (85-90% max res) and effortless rare item crafting.',
    pros: [
      'Zero unique items required to reach 4 Voidstones',
      'Extremely forgiving for bad gamers (insane passive HP regeneration and max resistances)',
      '1 button playstyle for mapping; Fire Trap melts tanky rares and pinnacle bosses',
      'Dedicated wiki and community resource at pohx.net'
    ],
    cons: [
      'Single target boss DPS plateaus without +1/+2 Gem Sceptre and Fire DoT Multiplier gloves',
      'Cannot run "Cannot Regenerate Life" or "-Max Player Resistances" map mods'
    ],
    levelingGems: ['Holy Flame Totem (Act 1)', 'Rolling Magma + Elemental Proliferation', 'Righteous Fire transition at Act 2 (Level 16-20) with Purity of Fire + Vitality'],
    keyCraftingSteps: [
      'Helmet: Essence of Greed for Life + Eldritch implicit for Fire Exposure',
      'Gloves: Essence of Delirium / Envy for DoT or +1 Fire Gems benchcraft',
      'Sceptre: Vendor Recipe for +1 Fire Spell Gems, then multi-mod with Fire DoT Multiplier and Fire Damage',
      'Shield: Target Rise of the Phoenix or Dawnbreaker, or craft a rare Colossal Tower Shield with +Max Fire Res'
    ],
    targetUniquesOrCards: [
      {
        name: 'Rise of the Phoenix',
        farmLocation: 'Ancient Orbs / Gwennen / Random Drops',
        poeWikiUrl: 'https://www.poewiki.net/wiki/Rise_of_the_Phoenix',
        poeDbUrl: 'https://poedb.tw/us/Rise_of_the_Phoenix'
      },
      {
        name: 'Cloak of Flame',
        farmLocation: 'Chance orbs on Scholar\'s Robe / Heist / Heist Replica Curios',
        poeWikiUrl: 'https://www.poewiki.net/wiki/Cloak_of_Flame',
        poeDbUrl: 'https://poedb.tw/us/Cloak_of_Flame'
      }
    ]
  },
  {
    id: 'archmage-ice-nova-hierophant',
    name: 'Archmage Ice Nova of Frostbolts',
    class: 'Templar',
    ascendancy: 'Hierophant',
    creator: 'Goratha / Palsteron',
    creatorUrl: 'https://www.youtube.com/@Goratha',
    pobUrl: 'https://pobb.in/82p_XmQ_939k',
    videoGuideUrl: 'https://www.youtube.com/watch?v=kY67Z3w_uVw',
    ssfViabilityScore: 9.5,
    uniqueDependency: 'Transfigured Gem',
    playstyle: 'Spell Caster',
    summary: 'The premier modern spellcaster in Path of Exile. Stacks huge Mana pools to gain absurd flat lightning damage and effective HP through Mind over Matter and Agnostic / Hierophant synergy.',
    pros: [
      'Insane screen wide AoE clear and boss shredding damage',
      'Massive eHP buffer through 8,000+ Mana + Mind over Matter (40-50% damage taken from Mana)',
      'Transfigured gem farmable in Cruel / Merciless / Eternal Lab within 5-10 runs'
    ],
    cons: [
      'Requires farming Ice Nova of Frostbolts at Divine Font in the Lord\'s Labyrinth',
      'Mana management requires careful flask and leech balancing before late game'
    ],
    levelingGems: ['Spark / Firestorm / Armageddon Brand (Acts 1 to 3)', 'Archmage + Ball Lightning of Orbiting or transition to Ice Nova in Act 8+'],
    keyCraftingSteps: [
      'Wands: Dual Profane Wands crafted with Essence of Scorn / Misery / Spite for Cast Speed + Mana + Spell Damage',
      'Body: Cloak of Defiance or high Evasion/ES 6 link with Tier 1 Mana and Maximum Life',
      'Helmet: Kitava\'s Thirst (optional automated cast trigger) or Craft Tier 1 Mana helmet'
    ],
    targetUniquesOrCards: [
      {
        name: 'Kitava\'s Thirst',
        farmLocation: 'Heist Unique Chests / Ritual / Gwennen',
        poeWikiUrl: 'https://www.poewiki.net/wiki/Kitava%27s_Thirst',
        poeDbUrl: 'https://poedb.tw/us/Kitavas_Thirst'
      },
      {
        name: 'The Porcupine',
        farmLocation: 'Gardens / Courtyard / Plaza (for backup 6L weapons)',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Porcupine',
        poeDbUrl: 'https://poedb.tw/us/The_Porcupine'
      }
    ]
  },
  {
    id: 'boneshatter-juggernaut-slayer',
    name: 'Boneshatter (Juggernaut / Slayer)',
    class: 'Marauder / Duelist',
    ascendancy: 'Juggernaut / Slayer',
    creator: 'Carn_ / Goratha',
    creatorUrl: 'https://www.twitch.tv/carn_',
    pobUrl: 'https://pobb.in/t6A43_7020_K',
    videoGuideUrl: 'https://www.youtube.com/watch?v=F_3Jb1U9aA8',
    ssfViabilityScore: 9.5,
    uniqueDependency: 'None (Pure Rare)',
    playstyle: 'Melee',
    summary: 'The ultimate true melee SSF workhorse. Gains escalating Trauma stacks on hit for more damage while converting incoming physical self damage into pure armour and regeneration mitigation.',
    pros: [
      '100% deterministic weapon crafting: Slam Essence of Contempt on high tier Two Handed Axes',
      'Extremely tanky: 70,000+ Armour, Unbreakable mitigation, Endurance charges, Fortify',
      'Explodes dense monster packs with built in stun shockwaves'
    ],
    cons: [
      'True melee range requires staying close to dangerous boss mechanics',
      'If attack speed outpaces physical damage reduction, self damage can kill you without proper leech/mitigation'
    ],
    levelingGems: ['Ground Slam / Sunder (Acts 1 to 3)', 'Boneshatter at Level 28 in Act 3 with Autoexertion + Intimidating Cry + Warlord\'s Mark'],
    keyCraftingSteps: [
      'Axe: Item Level 83+ Despot Axe / Ezomyte Axe. Spam Essence of Contempt (Flat Phys) until Tier 2-3 % Phys or Attack Speed, benchcraft the missing stat',
      'Body: Astral Plate / Glorious Plate with Eldritch implicit for PDR and Max Resists',
      'Gloves: Non-Vaal Strike skills target 1 additional nearby enemy (Eldritch implicit)'
    ]
  },
  {
    id: 'explosive-arrow-ballista-champion',
    name: 'Explosive Arrow Ballista Champion',
    class: 'Duelist / Witch',
    ascendancy: 'Champion / Elementalist',
    creator: 'Zizaran',
    creatorUrl: 'https://www.youtube.com/c/Zizaran',
    pobUrl: 'https://pobb.in/q8Y72p3B60hX',
    videoGuideUrl: 'https://www.youtube.com/watch?v=b4OsqzM7fAg',
    ssfViabilityScore: 9.8,
    uniqueDependency: 'Specific Div Card',
    playstyle: 'Totem / Ballista',
    summary: 'Deploy ballistas that pepper targets with explosive fuses to trigger monumental ignite burns. Champion provides permanent Fortify, Taunt, and stun immunity.',
    pros: [
      'Safe "place totems and dodge" bossing playstyle',
      'Guaranteed 6 Link bow via "The Porcupine" Divination Card in Act 8 Gardens / early maps',
      'Deterministic +3 Bow craft using 1x Shrieking Essence of Dread'
    ],
    cons: [
      'Delayed damage: Totems shoot fuses, fuses take 1 second to detonate and apply Ignite',
      'MUST NOT HAVE flat Added Fire Damage to Attacks on gear (breaks Elemental Equilibrium)'
    ],
    levelingGems: ['Spectral Helix / Splitting Steel (Acts 1 to 3)', 'Explosive Arrow Ballista transition at Level 28-32 in Act 3 with Skitterbots'],
    keyCraftingSteps: [
      '6L Short Bow from "The Porcupine" set',
      'Slam 1x Shrieking Essence of Dread (+2 to Level of Bow Gems)',
      'Clean prefixes so you have open prefix & open suffix, benchcraft "Cannot roll Attack Modifiers", slam Exalted Orb (guarantees +1 All Gems), craft Attack Speed/Minion Damage!',
      'Quiver: Broadhead Quiver with Attack Speed + Life + Elemental Damage with Attacks'
    ],
    targetUniquesOrCards: [
      {
        name: 'The Porcupine',
        farmLocation: 'Gardens (Act 8), Courtyard Map, Plaza Map',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Porcupine',
        poeDbUrl: 'https://poedb.tw/us/The_Porcupine'
      },
      {
        name: 'Dyadian Dawn',
        farmLocation: 'Heavy Belt Chancing / Heist Belt Chests / Gwennen',
        poeWikiUrl: 'https://www.poewiki.net/wiki/Dyadian_Dawn',
        poeDbUrl: 'https://poedb.tw/us/Dyadian_Dawn'
      }
    ]
  },
  {
    id: 'toxic-rain-pathfinder',
    name: 'Toxic Rain & Caustic Arrow Pathfinder',
    class: 'Ranger',
    ascendancy: 'Pathfinder',
    creator: 'SubWave / Zizaran',
    creatorUrl: 'https://www.youtube.com/c/Zizaran',
    pobUrl: 'https://pobb.in/d8Z9X2b98_K',
    videoGuideUrl: 'https://www.youtube.com/watch?v=F3zL8K0j7aU',
    ssfViabilityScore: 9.2,
    uniqueDependency: 'Specific Div Card',
    playstyle: 'Bow Attack',
    summary: 'Rains down chaos spore pods that wither and dissolve monster packs. Infinite flask sustain, 100% uptime on Quicksilver/Silver/Granite/Jade flasks, and permanent movement speed.',
    pros: [
      'Unstoppable speed: Permanent 150%+ Movement speed in maps',
      'Permanent flask immunity to all elemental ailments and bleed',
      'Smooth scaling via gem levels and Chaos Damage over Time Multiplier'
    ],
    cons: [
      'Spore pod stacking requires high attack speed and skill effect duration',
      'Requires accurate pod placement to overlap single target DPS'
    ],
    levelingGems: ['Caustic Arrow + Pierce (Act 1)', 'Toxic Rain + Mirage Archer at Level 12', 'Purity of Elements + Haste / Malevolence in Act 3'],
    keyCraftingSteps: [
      'Bow: 6L Short Bow from "The Porcupine" + Shrieking Essence of Dread craft for +3 Gem Levels',
      'Flasks: Use Alterations to roll "Gain 3 charges when hit" or "Increased Charge Recovery" + "25% Reduced Mana Cost / Increased Evasion"',
      'Amulet: Craft +1 Chaos Spell/Gem level via Harvest Reforge Chaos'
    ],
    targetUniquesOrCards: [
      {
        name: 'The Porcupine',
        farmLocation: 'Gardens / Courtyard / Plaza',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Porcupine',
        poeDbUrl: 'https://poedb.tw/us/The_Porcupine'
      },
      {
        name: 'Lightning Coil',
        farmLocation: 'Heist Armour Chests / Gwennen / Ancient Orbs',
        poeWikiUrl: 'https://www.poewiki.net/wiki/Lightning_Coil',
        poeDbUrl: 'https://poedb.tw/us/Lightning_Coil'
      }
    ]
  },
  {
    id: 'detonate-dead-chain-necromancer',
    name: 'Detonate Dead of Scavenging / Chain',
    class: 'Witch',
    ascendancy: 'Necromancer / Elementalist',
    creator: 'Ben_ / ImExile',
    creatorUrl: 'https://www.twitch.tv/ben_',
    pobUrl: 'https://pobb.in/19XoP_8992_K',
    videoGuideUrl: 'https://www.youtube.com/watch?v=N6_92n_b93s',
    ssfViabilityScore: 9.6,
    uniqueDependency: 'None (Pure Rare)',
    playstyle: 'Minion / Corpse',
    summary: 'The weapon of choice for PoE SSF World First race champions. Scales directly off monster corpse maximum life, making it scale effortlessly into Tier 17 maps and Uber Bosses on minimal gear.',
    pros: [
      'Damage scales with monster corpse HP (ignores low weapon gear scaling)',
      'Unrivaled boss damage on a 4 link or 5 link setup',
      'Necromancer offers 75% Max Attack & Spell Block with Bone Offering + Mistress of Sacrifice'
    ],
    cons: [
      'Two-button playstyle: Cast Desecrate $\\rightarrow$ Cast Detonate Dead',
      'Requires banking high-HP spectres (e.g. Kitava\'s Herald / Auric Colossus) in your Desecrate corpse pool'
    ],
    levelingGems: ['Rolling Magma (Act 1)', 'Armageddon Brand + Cremation (Acts 3-10)', 'Detonate Dead transition in early maps'],
    keyCraftingSteps: [
      'Shield: High Armour/Energy Shield base crafted with Essence of Greed for Life + Spell Block benchcraft',
      'Wand: Cast Speed + Fire Damage over Time Multiplier + Trigger socketed spells on skill use benchcraft',
      'Spectre Bank: Raise high-HP corpses in The Desecrated Chamber or Heist contracts once'
    ]
  },
  {
    id: 'penance-brand-dissipation-inquisitor',
    name: 'Penance Brand of Dissipation Inquisitor',
    class: 'Templar',
    ascendancy: 'Inquisitor',
    creator: 'Mannik / CaptainLance9',
    creatorUrl: 'https://www.youtube.com/@Mannik',
    pobUrl: 'https://pobb.in/mannik-pbod-inquisitor',
    videoGuideUrl: 'https://www.youtube.com/watch?v=F3zL8K0j7aU',
    ssfViabilityScore: 9.8,
    uniqueDependency: 'Transfigured Gem',
    playstyle: 'Brands',
    summary: 'The undisputed boss shredding brand build of Path of Exile. Penance Brand of Dissipation pulses holy lightning energy that ramps energy stages up to 20 on the target, generating massive single target DPS while Inevitable Judgement ignores all monster elemental resistances on critical strikes. Combined with Pious Path for dual Life and Energy Shield regeneration, this build effortlessly melts Pinnacle Bosses and Tier 17 maps in SSF.',
    pros: [
      'Unrivaled single target boss DPS: 20 energy pulsing brands vaporize map bosses and Pinnacle Bosses within seconds',
      'Inevitable Judgement ignores all elemental resistances on critical strikes (no need for penetration curses or exposure)',
      'Pious Path delivers 1,500+ Life and Energy Shield regeneration per second for great survivability',
      'Safe "attach brands and dodge" playstyle allowing you to focus completely on avoiding boss mechanics',
      'Transfigured gem is farmable deterministically in Merciless or Eternal Lab via Divine Font gem conversion'
    ],
    cons: [
      'Requires farming Penance Brand of Dissipation at the Divine Font in Merciless or Eternal Lab',
      'Requires cast speed and Brand attachment frequency investment to reach 20 energy pulses rapidly'
    ],
    levelingGems: [
      'Holy Flame Totem + Spark / Rolling Magma (Acts 1 to 3)',
      'Armageddon Brand + Cremation / Storm Brand (Acts 3 to 10)',
      'Farm Divine Font in Merciless Lab (Act 10) to transform any blue spell gem into Penance Brand of Dissipation',
      'Main 6L: Penance Brand of Dissipation + Swiftbrand Support + Concentrated Effect + Physical to Lightning + Increased Critical Strikes + Faster Casting / Power Charge on Critical'
    ],
    keyCraftingSteps: [
      'Wand / Sceptre: Item Level 82+ Void Sceptre or Prophecy Wand. Roll with Essence of Torment / Zeal for +1 All Physical or Lightning Spell Gems, Cast Speed, and Critical Strike Chance for Spells',
      'Shield: High Armour / Energy Shield Pinnacle Tower Shield or Titanium Spirit Shield crafted with Essence of Greed for Life + Max Resistances and Spell Block',
      'Helmet: Item Level 84+ Hubris Circlet or Royal Burgonet crafted with Essence of Loathing (Mana Reservation Efficiency) + Eldritch implicit for Physical Damage taken as Fire/Cold',
      'Body Armour: Saintly Chainmail crafted with Essence of Greed for +120 Life + Eldritch implicits for Aura Effect and Increased Brand Attachment Range',
      'Jewels: Roll Cobalt / Crimson Jewels with Cast Speed with Brands, Critical Strike Multiplier with Elemental Skills, and % Maximum Life'
    ],
    targetUniquesOrCards: [
      {
        name: 'The Porcupine',
        farmLocation: 'Gardens / Courtyard / Plaza (for early 6L weapon or body setup)',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Porcupine',
        poeDbUrl: 'https://poedb.tw/us/The_Porcupine'
      },
      {
        name: 'Call of the Brotherhood',
        farmLocation: 'Two Stone Ring chancing / Heist Ring Chests (optional Cold conversion and Freeze defense)',
        poeWikiUrl: 'https://www.poewiki.net/wiki/Call_of_the_Brotherhood',
        poeDbUrl: 'https://poedb.tw/us/Call_of_the_Brotherhood'
      }
    ]
  },
  {
    id: 'penance-brand-ignite-elementalist',
    name: 'Penance Brand Ignite Elementalist (Autobomber & 4 Golem Herald Stacker)',
    class: 'Witch',
    ascendancy: 'Elementalist',
    creator: 'Community / Paak / Palsteron',
    creatorUrl: 'https://www.youtube.com/c/Palsteron',
    pobUrl: 'https://pobb.in/penance-brand-ignite-elementalist',
    videoGuideUrl: 'https://www.youtube.com/watch?v=F3zL8K0j7aU',
    ssfViabilityScore: 9.9,
    uniqueDependency: 'None (Pure Rare)',
    playstyle: 'Brands',
    summary: 'A fast autobomber hybrid and pinnacle boss shredder built for Solo Self Found. Powered by a 4 Golem engine (Flame, Stone, Chaos, Lightning) for massive automated buffs and defense, combined with triple Herald stacking (Ash, Purity, Thunder). In maps, an Eldritch glove spread implicit and a physical explode chest turn every killed monster into a cascading ignite chain reaction that clears entire screens automatically. Against pinnacle bosses, standard Penance Brand ramps to 20 energy stages for catastrophic base detonations that easily reach the damage over time ignite cap.',
    pros: [
      'Autobomber Screen Clear: Eldritch glove ignite spread implicit combined with a physical explode chest triggers automated cascading pack explosions',
      '4 Golem Engine: Liege of the Primordial and Elemancer grant auto reviving golems providing massive global damage, life regen, physical damage reduction, and cast speed',
      'Triple Herald Stacking: Scales Herald of Ash, Herald of Purity, and Herald of Thunder amplified by Heraldry and Endbringer cluster jewels',
      'Shaper of Flames Omnipotence: 100% chance to ignite where ALL damage types (Physical, Lightning, Fire, Chaos) scale your ignite base with 25% more burning damage',
      'Pinnacle Single Target: Swiftbrand Support charges Penance Brand to 20 energy stacks rapidly, melting guardians and pinnacle bosses on budget gear',
      'Clear Gearing Roadmap: Easily progresses from pure rare leveling gear into chase targets like Lost Unity ring and elevated explode chests'
    ],
    cons: [
      'Requires managing gem sockets to fit 4 Golem summons, 3 Heralds, and utility auras',
      'Cannot run "Monsters are Hexproof" without Cursed Ground or "Monsters have 90% chance to Avoid Elemental Ailments" map mods'
    ],
    levelingGems: [
      'Acts 1 to 3: Rolling Magma + Holy Flame Totem + Flame Wall (smooth early act clear)',
      'Normal Lab (Act 3): Allocate Liege of the Primordial -> Summon Flame Golem + Stone Golem for instant damage and massive life regen',
      'Cruel Lab (Act 7): Allocate Elemancer -> Summon Chaos Golem + Lightning Golem (full 4 Golem engine online)',
      'Merciless Lab (Act 10): Allocate Shaper of Flames -> Transition to Penance Brand Ignite + Herald of Ash + Herald of Purity',
      'Main 6 Link: Penance Brand + Swiftbrand Support + Deadly Ailments Support + Unbound Ailments Support + Cruelty Support + Swift Affliction Support / Burning Damage (relying on glove implicit for proliferation)'
    ],
    keyCraftingSteps: [
      'Gloves: Rare Armour / Evasion gloves with Searing Exarch Eldritch implicit for "Ignites you inflict spread to other enemies in a radius of 15 to 17 units" (eliminates the need for Ignite Proliferation Support in the main 6 link)',
      'Body Armour: 6 Link Astral Plate or Saintly Chainmail crafted with Crusader Influenced "Enemies you Kill Explode, dealing % of their Life as Physical Damage" (or Eldritch implicit for Aura Effect and Physical Damage taken as Fire)',
      'Medium Cluster Jewels: 4 to 5 passive Herald clusters rolled with "Heraldry" (10% Herald buff effect + guaranteed Fire Exposure on hit) and "Endbringer" (25% increased damage per active Herald)',
      'Weapon: Sceptre or Rune Dagger with +1 to Level of all Physical / Fire Spell Skill Gems, Fire Damage over Time Multiplier, and Cast Speed (crafted via vendor recipe + Essence of Anger / Zeal or Harvest Reforge Fire)',
      'Shield: High Armour / Energy Shield base crafted with Essence of Greed for Life, +1 Physical / Fire Gems, and Spell Block benchcraft',
      'Helmet: Hubris Circlet or Royal Burgonet crafted with Essence of Loathing for Mana Reservation Efficiency to easily sustain triple Heralds + Malevolence / Determination',
      'Utility Brand: Arcanist Brand linked with Wave of Conviction + Flammability + Combustion Support for instant -60% boss fire resistance shred'
    ],
    targetUniquesOrCards: [
      {
        name: 'Lost Unity',
        farmLocation: 'Breach / Heist Ring Chests (God tier chase ring granting massive damage amplification per active elemental ailment and Herald buff)',
        poeWikiUrl: 'https://www.poewiki.net/wiki/Lost_Unity',
        poeDbUrl: 'https://poedb.tw/us/Lost_Unity'
      },
      {
        name: 'The Porcupine',
        farmLocation: 'Gardens / Courtyard / Plaza (for early guaranteed 6 Link weapon or body setup)',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Porcupine',
        poeDbUrl: 'https://poedb.tw/us/The_Porcupine'
      },
      {
        name: "Berek's Respite",
        farmLocation: 'Two Stone Ring chancing / Heist Ring Chests (optional instant screen wide ignite shock propagation)',
        poeWikiUrl: 'https://www.poewiki.net/wiki/Berek%27s_Respite',
        poeDbUrl: 'https://poedb.tw/us/Berek%27s_Respite'
      },
      {
        name: 'The Primordial Chain',
        farmLocation: 'Coral Amulet chancing / Primordial Divination Cards (optional extra golem capacity)',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Primordial_Chain',
        poeDbUrl: 'https://poedb.tw/us/The_Primordial_Chain'
      }
    ]
  },
];
