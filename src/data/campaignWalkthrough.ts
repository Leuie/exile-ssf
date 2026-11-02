import type { CampaignAct } from '../types';

export const CAMPAIGN_ACTS: CampaignAct[] = [
  {
    actNumber: 1,
    title: 'The Woken Dead & Wraeclast Shores',
    themeColor: 'text-sky-400 border-sky-500/30 bg-sky-950/20',
    accentHex: '#38bdf8',
    bgGradient: 'from-sky-950/40 via-slate-900 to-slate-950',
    levelRange: 'Levels 1 12',
    bossName: 'Merveil, the Siren',
    bossWikiUrl: 'https://www.poewiki.net/wiki/Merveil,_the_Siren',
    bossStrategy: 'Equip 1-2 Sapphire Rings (vendor Iron Ring + Blue Gem) for 60%+ Cold Resistance. Stand close to avoid Ice Spears, dodge the storm vortex in Phase 2.',
    keyUnlocks: [
      'Nessa Gem Vendor: Buy main active and support gems (Act 1 Town)',
      'Movement Skills: Dash, Frostblink, or Leap Slam unlocked after Brutus',
      'Quicksilver Flask from "The Medicine Chest" (Hailrake in Tidal Island)'
    ],
    resistCheck: 'Equip Sapphire Ring before Merveil (Cold Res 50%+ recommended).',
    zones: [
      {
        zoneName: 'Twilight Strand',
        level: 1,
        hasWaypoint: false,
        navigationTip: 'Kill Hillock, pick up weapon + gem + large chest loot, enter Lioneye\'s Watch.',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Twilight_Strand_(Act_1)'
      },
      {
        zoneName: 'The Coast',
        level: 2,
        hasWaypoint: true,
        navigationTip: 'Follow the dirt road straight ahead to find the Waypoint. Head right to Tidal Island first for Quicksilver Flask, then head left to Mud Flats.',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Coast_(Act_1)'
      },
      {
        zoneName: 'The Tidal Island',
        level: 3,
        hasWaypoint: false,
        navigationTip: 'Hug the water line in a circle. Slay Hailrake, grab the Medicine Chest, log out to character select to return to town instantly!',
        vendorReminder: 'Turn in quest to Nessa for your first Quicksilver Flask + Support Gem!',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Tidal_Island_(Act_1)'
      },
      {
        zoneName: 'The Mud Flats',
        level: 4,
        hasWaypoint: false,
        navigationTip: 'Look for 3 glowing Rhoa Nests forming a triangle. Grab 3 Ammonite Glyphs and unlock the submerged wall.',
        dangerAlert: 'Rhoas can charge and stun-lock you. Keep moving in zig-zags!',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Mud_Flats_(Act_1)'
      },
      {
        zoneName: 'The Submerged Passage',
        level: 5,
        hasWaypoint: true,
        navigationTip: 'Grab the Waypoint. Look for the broken wooden bridge / flooded stream to find The Ledge. (Ignore Flooded Depths until after Ledge waypoint).',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Submerged_Passage'
      },
      {
        zoneName: 'The Flooded Depths',
        level: 6,
        hasWaypoint: false,
        hasSkillPoint: true,
        skillPointQuest: 'The Dweller of the Deep (Tarkleigh)',
        navigationTip: 'Follow the water current downward to find the Grand Daddy Crab (The Dweller). Slay him for +1 Passive Skill Point!',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Flooded_Depths'
      },
      {
        zoneName: 'The Ledge',
        level: 7,
        hasWaypoint: true,
        navigationTip: 'Linear path. Look at the Waypoint stones: 3 small stones point toward Kuduku and The Climb.',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Ledge'
      },
      {
        zoneName: 'The Climb',
        level: 8,
        hasWaypoint: true,
        navigationTip: 'Run along the cliff edge heading north. Look for the waypoint near Navali\'s cage.',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Climb'
      },
      {
        zoneName: 'The Lower Prison',
        level: 9,
        hasWaypoint: true,
        hasLabTrial: true,
        labTrialName: 'Trial of Piercing Truth (Spike Traps)',
        navigationTip: 'Follow the blood stains and paved stone hallway toward the stairs and the first Ascendancy Trial!',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Lower_Prison'
      },
      {
        zoneName: 'The Upper Prison & Warden\'s Quarters',
        level: 10,
        hasWaypoint: false,
        navigationTip: 'Navigate to Warden\'s Chambers. Fight Brutus: Step behind him when he winds up his heavy slam hook.',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Upper_Prison'
      },
      {
        zoneName: 'Prisoner\'s Gate & The Ship Graveyard',
        level: 11,
        hasWaypoint: true,
        hasSkillPoint: true,
        skillPointQuest: 'The Marooned Mariner (Fairgraves)',
        navigationTip: 'Ship Graveyard: Find Ship Graveyard Cave for the Allflame, then locate Captain Fairgraves to earn +1 Passive Skill Point.',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Ship_Graveyard'
      },
      {
        zoneName: 'The Cavern of Wrath & Cavern of Anger',
        level: 12,
        hasWaypoint: true,
        navigationTip: 'Follow the water pools and glowing purple coral to reach Merveil\'s Lair.',
        vendorReminder: 'Equip Sapphire Rings now for 50%+ Cold Resistance!',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Cavern_of_Wrath'
      }
    ]
  },
  {
    actNumber: 2,
    title: 'The Forest & The Bandit Lords',
    themeColor: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20',
    accentHex: '#34d399',
    bgGradient: 'from-emerald-950/40 via-slate-900 to-slate-950',
    levelRange: 'Levels 13 22',
    bossName: 'Vaal Oversoul',
    bossWikiUrl: 'https://www.poewiki.net/wiki/Vaal_Oversoul',
    bossStrategy: 'Stay behind him. Run away when he winds up his massive one shot lightning smash. Kill minion adds immediately for flask charges.',
    keyUnlocks: [
      'Bandit Choice (Eramir / Kraityn / Alira / Oak): In SSF, Kill All Bandits for +1 Passive Skill Point is recommended on 90% of builds (or help Alira for mana/crit/resists).',
      'Second Quicksilver Flask from "The Great White Beast" in The Old Fields (Den quest)',
      'Blood Magic / Support gem quest rewards in Forest Encampment'
    ],
    resistCheck: 'Topaz Ring (Lightning) recommended for Chamber of Sins & Vaal Oversoul smash.',
    zones: [
      {
        zoneName: 'Southern Forest & The Old Fields',
        level: 13,
        hasWaypoint: true,
        navigationTip: 'Old Fields: Follow the road. Look for the cave entrance (The Den) for 2nd Quicksilver Flask, or continue road to Crossroads.',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Southern_Forest'
      },
      {
        zoneName: 'The Crossroads',
        level: 14,
        hasWaypoint: true,
        navigationTip: 'Major Hub! Top-Left path leads to Chamber of Sins; Top-Right leads to Broken Bridge (Kraityn); Bottom-Right leads to Fellshrine Ruins.',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Crossroads'
      },
      {
        zoneName: 'The Chamber of Sins (Levels 1 & 2)',
        level: 15,
        hasWaypoint: true,
        hasLabTrial: true,
        labTrialName: 'Trial of Crippling Grief (Sawblade Traps)',
        navigationTip: 'Level 2 contains the Ascendancy Trial. Find and slay Fidelitas, rescue Helena, and take the Baleful Gem.',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Chamber_of_Sins_Level_1'
      },
      {
        zoneName: 'The Riverways & Western Forest',
        level: 16,
        hasWaypoint: true,
        hasSkillPoint: true,
        skillPointQuest: 'The Way Forward (Guard Captain) & Deal with Bandits',
        navigationTip: 'Western Forest: Follow the stone road line. Left side has a break in the road leading directly to Alira; Web covered trees lead to Weaver\'s Chambers (Maligaro\'s Spike).',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Western_Forest'
      },
      {
        zoneName: 'The Crypt (Level 1)',
        level: 17,
        hasWaypoint: true,
        hasLabTrial: true,
        labTrialName: 'Trial of Swirling Fear (Spinning Blade Traps)',
        navigationTip: 'Inside Fellshrine Ruins. Contains the 3rd Ascendancy Trial in Act 2!',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Crypt_Level_1'
      },
      {
        zoneName: 'The Wetlands & Vaal Ruins',
        level: 18,
        hasWaypoint: true,
        navigationTip: 'Wetlands: Slay Oak near the tree fortress. Break the seal using the Baleful Gem and Maligaro\'s Spike to enter the Ancient Pyramid.',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Wetlands'
      },
      {
        zoneName: 'The Ancient Pyramid',
        level: 20,
        hasWaypoint: false,
        navigationTip: 'Climb 3 pyramid tiers to the Apex. Activate the dark altar to fight the Vaal Oversoul!',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Ancient_Pyramid'
      }
    ]
  },
  {
    actNumber: 3,
    title: 'The City of Sarn & The Ascendancy Trials',
    themeColor: 'text-amber-400 border-amber-500/30 bg-amber-950/20',
    accentHex: '#fbbf24',
    bgGradient: 'from-amber-950/40 via-slate-900 to-slate-950',
    levelRange: 'Levels 23 32',
    bossName: 'Dominus, High Templar',
    bossWikiUrl: 'https://www.poewiki.net/wiki/Dominus,_High_Templar',
    bossStrategy: 'Phase 1: Stay out of lightning totems and cold rain stream. Phase 2 (Beast form): STAY INSIDE HIS GOLDEN SHIELD DOME to avoid the lethal Corrupting Blood rain!',
    keyUnlocks: [
      'The Lord\'s Labyrinth (Normal Lab, Level 33): Unlock your First Ascendancy Class points!',
      'Siosa Gem Vendor (The Library): Buy almost any skill and support gem in the game!',
      'Curse & Aura gems from Maramoa & Clarissa in Sarn Encampment'
    ],
    resistCheck: 'Lightning Res 60%+ for Crematorium & Dominus; Staunching / Bleed removal flask for Dominus Phase 2.',
    zones: [
      {
        zoneName: 'City of Sarn & Slums',
        level: 23,
        hasWaypoint: true,
        navigationTip: 'Save Clarissa from the guards. Enter the Slums and look for the Crematorium entrance.',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_City_of_Sarn'
      },
      {
        zoneName: 'The Crematorium',
        level: 24,
        hasWaypoint: true,
        hasLabTrial: true,
        labTrialName: 'Trial of Burning Rage (Furnace Floor & Fire Traps)',
        navigationTip: 'Complete the 4th Ascendancy Trial. Defeat Piety, grab Tolman\'s Bracelet, and return to town for the Sewer Keys.',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Crematorium'
      },
      {
        zoneName: 'The Sewers',
        level: 25,
        hasWaypoint: true,
        hasSkillPoint: true,
        skillPointQuest: 'Victario\'s Secrets (3 Platinum Busts)',
        navigationTip: 'Collect 3 Busts in the sewer alcoves for +1 Passive Skill Point + Respec points. Exit into The Marketplace.',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Sewers'
      },
      {
        zoneName: 'The Catacombs',
        level: 26,
        hasWaypoint: true,
        hasLabTrial: true,
        labTrialName: 'Trial of Lingering Pain (Blade Sentry Traps)',
        navigationTip: 'Located off The Marketplace. Complete the 5th Ascendancy Trial!',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Catacombs'
      },
      {
        zoneName: 'The Imperial Gardens',
        level: 28,
        hasWaypoint: true,
        hasLabTrial: true,
        labTrialName: 'Trial of Stinging Doubt (Dart & Floor Traps)',
        navigationTip: 'Follow the tiled road. Top-Left goes to The Library; Bottom-Left has the 6th and Final Normal Ascendancy Trial!',
        vendorReminder: 'Complete Siosa\'s quest in The Library to unlock every gem in the game up to Act 3!',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Imperial_Gardens'
      },
      {
        zoneName: 'The Sceptre of God & Upper Sceptre',
        level: 31,
        hasWaypoint: true,
        navigationTip: 'Climb 3 levels to the roof. Defeat Dominus and descend into Highgate (Act 4).',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Sceptre_of_God'
      }
    ]
  },
  {
    actNumber: 4,
    title: 'The Beast & The Eternal Nightmare',
    themeColor: 'text-rose-400 border-rose-500/30 bg-rose-950/20',
    accentHex: '#fb7185',
    bgGradient: 'from-rose-950/40 via-slate-900 to-slate-950',
    levelRange: 'Levels 33 38',
    bossName: 'Malachai, The Nightmare',
    bossWikiUrl: 'https://www.poewiki.net/wiki/Malachai,_The_Nightmare',
    bossStrategy: 'Destroy the 3 beating hearts when Malachai becomes immune. Avoid the red teleport runes and tentacle circle portals on the ground.',
    keyUnlocks: [
      'Trigger Gems & Cast on Damage Taken unlocked from Petarus & Vanja',
      'Golem Skills (Flame, Stone, Chaos, Lightning Golem) unlocked from Dialla',
      'Normal Labyrinth completion recommended at Level 33-35 before Malachai'
    ],
    resistCheck: 'Fire & Physical mitigation for Kaom\'s Stronghold; Cold Res for Daresso\'s Dream.',
    zones: [
      {
        zoneName: 'The Dried Lake',
        level: 33,
        hasWaypoint: false,
        navigationTip: 'Follow the northern cliff edge to find Voll, Emperor of Purity. Kill him for the Deshret\'s Banner.',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Dried_Lake'
      },
      {
        zoneName: 'The Mines (Levels 1 & 2)',
        level: 34,
        hasWaypoint: true,
        hasSkillPoint: true,
        skillPointQuest: 'An Indomitable Spirit (Free Deshret\'s Spirit)',
        navigationTip: 'Level 2 has Deshret\'s Spirit pinned to the wall. Free it for +1 Passive Skill Point.',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Mines_Level_1'
      },
      {
        zoneName: 'Kaom\'s Dream & Kaom\'s Stronghold',
        level: 36,
        hasWaypoint: true,
        navigationTip: 'Lava paths. Defeat King Kaom to obtain the Eye of Fury.',
        dangerAlert: 'Lava pits and fire archers deal heavy burst damage. Keep Ruby flask or Fire Res capped!',
        poeWikiUrl: 'https://www.poewiki.net/wiki/Kaom%27s_Dream'
      },
      {
        zoneName: 'Daresso\'s Dream & The Grand Arena',
        level: 36,
        hasWaypoint: true,
        navigationTip: 'Fight through 3 gladiator cages to reach Daresso, King of Swords. Slay him for the Eye of Desire.',
        poeWikiUrl: 'https://www.poewiki.net/wiki/Daresso%27s_Dream'
      },
      {
        zoneName: 'The Belly of the Beast (Levels 1 & 2)',
        level: 37,
        hasWaypoint: true,
        navigationTip: 'Follow the fleshy veins. Slay Piety (Abomination form) and enter The Harvest.',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Belly_of_the_Beast_Level_1'
      },
      {
        zoneName: 'The Harvest & The Black Core',
        level: 38,
        hasWaypoint: true,
        navigationTip: 'Kill Maligaro, Shavronne, and Doedre to unlock the Black Core. Face Malachai, Nightmare of Wraeclast.',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Harvest'
      }
    ]
  },
  {
    actNumber: 5,
    title: 'The Fall of Oriath & The First Cataclysm',
    themeColor: 'text-yellow-400 border-yellow-500/30 bg-yellow-950/20',
    accentHex: '#facc15',
    bgGradient: 'from-yellow-950/40 via-slate-900 to-slate-950',
    levelRange: 'Levels 39 44',
    bossName: 'Kitava, the Insatiable',
    bossWikiUrl: 'https://www.poewiki.net/wiki/Kitava,_the_Insatiable_(Act_5)',
    bossStrategy: 'Watch his hand slams: Run to the opposite corner when he winds up his fiery sweep or dark beam. Destroy the Heart of Kitava during phase transitions.',
    keyUnlocks: [
      'Unique Jewel Reward from Lani (e.g., Survival Secrets / First Snow / Primordial choices)',
      'Act 5 Kitava Curse: PERMANENT -30% TO ALL RESISTANCES applied upon defeating Kitava!'
    ],
    resistCheck: 'CRITICAL ALERT: Your resistances will drop by 30% after Kitava. Prepare resist rings/gear before entering Act 6!',
    zones: [
      {
        zoneName: 'The Slave Pens',
        level: 39,
        hasWaypoint: false,
        navigationTip: 'Defeat Overseer Krow. Enter Overseer\'s Tower (Act 5 Town).',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Slave_Pens'
      },
      {
        zoneName: 'Control Blocks & Oriath Square',
        level: 40,
        hasWaypoint: true,
        hasSkillPoint: true,
        skillPointQuest: 'In Service to Science (Miasmeter for Vilenta)',
        navigationTip: 'Grab the Miasmeter in Control Blocks. Slay Justicar Casticus for the Eyes of Zeal.',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Control_Blocks'
      },
      {
        zoneName: 'The Templar Courts & Chamber of Innocence',
        level: 42,
        hasWaypoint: true,
        navigationTip: 'Fight High Templar Avarius / God Innocence: Hide behind statues when he casts his bullet-hell golden sphere barrage!',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Chamber_of_Innocence'
      },
      {
        zoneName: 'The Ossuary & Reliquary',
        level: 43,
        hasWaypoint: true,
        hasSkillPoint: true,
        skillPointQuest: 'The King\'s Feast (Utula) & Kitava\'s Torments',
        navigationTip: 'Ossuary: Grab the Sign of Purity. Reliquary: Grab Kitava\'s 3 Torments for +1 Passive Skill Point.',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Ossuary_(Act_5)'
      },
      {
        zoneName: 'The Cathedral Rooftop',
        level: 44,
        hasWaypoint: false,
        navigationTip: 'Enter the Cathedral Apex. Battle Kitava: After the battle, Sin teleports you to the shores of Act 6.',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Cathedral_Rooftop'
      }
    ]
  },
  {
    actNumber: 6,
    title: 'Return to the Coast & Lilly Roth\'s Shop',
    themeColor: 'text-cyan-400 border-cyan-500/30 bg-cyan-950/20',
    accentHex: '#22d3ee',
    bgGradient: 'from-cyan-950/40 via-slate-900 to-slate-950',
    levelRange: 'Levels 45 50',
    bossName: 'Tsoagoth, The Brine King',
    bossWikiUrl: 'https://www.poewiki.net/wiki/Tsoagoth,_The_Brine_King',
    bossStrategy: 'When the arena shrinks into a circular tidal wave cage, stop moving and focus on dodging the lightning strike indicators on the floor.',
    keyUnlocks: [
      'Lilly Roth Gem Vendor: Complete "Fallen from Grace" on Twilight Strand to buy ANY non-drop gem in the entire game!',
      'Pantheon Power Unlocked: Soul of the Brine King (Stun & Freeze mitigation)'
    ],
    resistCheck: 'Cap Fire Resistance for Karui Fortress (Tukohama); Cap Cold/Light for Brine King.',
    zones: [
      {
        zoneName: 'The Twilight Strand (Clear Quest)',
        level: 45,
        hasWaypoint: false,
        navigationTip: 'Clear all monsters for Lilly Roth. Unlocks every gem in the game in Act 6 town!',
        vendorReminder: 'Lilly Roth is now your one-stop gem shop forever!',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Twilight_Strand_(Act_6)'
      },
      {
        zoneName: 'The Coast & Mud Flats',
        level: 46,
        hasWaypoint: true,
        hasSkillPoint: true,
        skillPointQuest: 'The Father of War (Slay Tukohama)',
        navigationTip: 'Coast $\\rightarrow$ Mud Flats $\\rightarrow$ Defeat Tukohama in Karui Fortress for +1 Passive Skill Point.',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Coast_(Act_6)'
      },
      {
        zoneName: 'The Lower Prison (Act 6)',
        level: 47,
        hasWaypoint: true,
        hasLabTrial: true,
        labTrialName: 'Trial of Swirling Fear (Cruel Lab Trial)',
        navigationTip: 'Contains Cruel Lab Trial 1! Slay Shavronne of Umbra to exit into Prisoner\'s Gate.',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Lower_Prison_(Act_6)'
      },
      {
        zoneName: 'The Western Forest & The Riverways',
        level: 48,
        hasWaypoint: true,
        hasSkillPoint: true,
        skillPointQuest: 'The Puppet Mistress (Slay Ryslatha)',
        navigationTip: 'Riverways: Find the Wetlands and slay Ryslatha in the Spawning Grounds for +1 Passive Skill Point.',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Riverways_(Act_6)'
      },
      {
        zoneName: 'The Beacon & Brine King\'s Reef',
        level: 50,
        hasWaypoint: true,
        navigationTip: 'Escort the fuel cart at the Beacon, ignite the lighthouse, and sail with Weylam Roth to slay the Brine King.',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Beacon'
      }
    ]
  },
  {
    actNumber: 7,
    title: 'The Vaal Spiders & The Silver Key',
    themeColor: 'text-purple-400 border-purple-500/30 bg-purple-950/20',
    accentHex: '#c084fc',
    bgGradient: 'from-purple-950/40 via-slate-900 to-slate-950',
    levelRange: 'Levels 51 55',
    bossName: 'Arakaali, Spinner of Shadows',
    bossWikiUrl: 'https://www.poewiki.net/wiki/Arakaali,_Spinner_of_Shadows',
    bossStrategy: 'Avoid her continuous purple laser beams. When she climbs the ceiling, step on the glowing silk egg sacks to prevent spider adds.',
    keyUnlocks: [
      'Cruel Labyrinth recommended at Level 55 (Unlock 4th Ascendancy point!)',
      'Pantheon Power: Soul of Arakaali (DoT mitigation)'
    ],
    resistCheck: 'Chaos and Lightning resistance help significantly against Arakaali\'s web lasers.',
    zones: [
      {
        zoneName: 'The Bridge Encampment & The Crossroads',
        level: 51,
        hasWaypoint: true,
        navigationTip: 'Head down to Fellshrine Ruins and Crypt for the Silver Key & Maligaro\'s Map.',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Crossroads_(Act_7)'
      },
      {
        zoneName: 'The Crypt (Act 7)',
        level: 52,
        hasWaypoint: true,
        hasLabTrial: true,
        labTrialName: 'Trial of Lingering Pain (Cruel Lab Trial 2)',
        navigationTip: 'Cruel Lab Trial inside. Locate the Container of Sins for the Silver Key.',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Crypt_(Act_7)'
      },
      {
        zoneName: 'The Chamber of Sins & Maligaro\'s Sanctuary',
        level: 53,
        hasWaypoint: true,
        hasLabTrial: true,
        labTrialName: 'Trial of Crippling Grief (Cruel Lab Trial 3)',
        navigationTip: 'Cruel Lab Trial 3 inside. Use Map Device with Maligaro\'s Map, slay Maligaro for the Black Venom.',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Chamber_of_Sins_Level_1_(Act_7)'
      },
      {
        zoneName: 'The Ashen Fields & Northern Forest',
        level: 54,
        hasWaypoint: true,
        hasSkillPoint: true,
        skillPointQuest: 'The Master of a Million Faces (Slay Ralakesh) & Kishara\'s Star',
        navigationTip: 'Ashen Fields: Slay Greust (Ralakesh). Northern Forest: Find Kishara\'s Star near the Causeway entrance for +2 Passive Points total.',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Ashen_Fields'
      },
      {
        zoneName: 'The Temple of Decay (Levels 1 & 2)',
        level: 55,
        hasWaypoint: true,
        navigationTip: 'Descend through the spiral temple to Arakaali\'s Web. Slay Arakaali to enter Sarn (Act 8).',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Temple_of_Decay_Level_1'
      }
    ]
  },
  {
    actNumber: 8,
    title: 'The Solar & Lunar Eclipse',
    themeColor: 'text-orange-400 border-orange-500/30 bg-orange-950/20',
    accentHex: '#fb923c',
    bgGradient: 'from-orange-950/40 via-slate-900 to-slate-950',
    levelRange: 'Levels 56 60',
    bossName: 'Lunaris & Solaris',
    bossWikiUrl: 'https://www.poewiki.net/wiki/Lunaris_and_Solaris',
    bossStrategy: 'Dual boss fight. Solaris deals high Fire damage; Lunaris deals high Cold/Physical projectile damage. When one goes invulnerable in a sphere, switch focus to the other.',
    keyUnlocks: [
      '"The Porcupine" Divination Card farm location in The High Gardens!',
      'Pantheon Power: Soul of Lunaris / Soul of Solaris'
    ],
    resistCheck: 'Keep Fire and Cold Resistance at 75% cap.',
    zones: [
      {
        zoneName: 'The Sarn Ramparts & Toxic Conduits',
        level: 56,
        hasWaypoint: true,
        navigationTip: 'Slay Doedre the Vile in the Sewer Cauldron (turn valve when toxicity builds up).',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Sarn_Ramparts'
      },
      {
        zoneName: 'The Grand Promenade & Bath House',
        level: 57,
        hasWaypoint: true,
        hasLabTrial: true,
        hasSkillPoint: true,
        labTrialName: 'Trial of Piercing Truth (Merciless Lab Trial 1)',
        skillPointQuest: 'Love is Dead (Hector Titucius)',
        navigationTip: 'Bath House: Contains Merciless Trial 1 + High Gardens entrance (Slay Yugul for +1 Passive Skill Point).',
        vendorReminder: 'The High Gardens drops "The Porcupine" card (6L Short Bow) in SSF!',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Bath_House'
      },
      {
        zoneName: 'The Lunaris Concourse & Lunaris Temple',
        level: 58,
        hasWaypoint: true,
        navigationTip: 'Temple Level 2: Slay Dusk, Harbinger of Lunaris to obtain the Moon Orb.',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Lunaris_Concourse'
      },
      {
        zoneName: 'The Solaris Concourse & Solaris Temple',
        level: 59,
        hasWaypoint: true,
        navigationTip: 'Temple Level 2: Slay Dawn, Harbinger of Solaris to obtain the Sun Orb.',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Solaris_Concourse'
      },
      {
        zoneName: 'The Harbour Bridge',
        level: 60,
        hasWaypoint: false,
        navigationTip: 'Run along the bridge to the central skyway. Slay Lunaris and Solaris together.',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Harbour_Bridge'
      }
    ]
  },
  {
    actNumber: 9,
    title: 'The Vastiri Desert & The Blood Aqueduct',
    themeColor: 'text-amber-500 border-amber-600/30 bg-amber-950/20',
    accentHex: '#f59e0b',
    bgGradient: 'from-amber-950/40 via-slate-900 to-slate-950',
    levelRange: 'Levels 61 64',
    bossName: 'The Depraved Trinity (Doedre/Maligaro/Shavronne)',
    bossWikiUrl: 'https://www.poewiki.net/wiki/The_Depraved_Trinity',
    bossStrategy: 'Rotates through 3 phases: Avoid purple chaos puddles in Doedre phase, dodge lightning balls in Shavronne phase.',
    keyUnlocks: [
      'The Blood Aqueduct: THE #1 Leveling & Tabula Rasa ("Humility" Card) farm zone in PoE history!',
      'Merciless Labyrinth completion recommended at Level 63-65 (6th Ascendancy point!)'
    ],
    resistCheck: 'Chaos resistance helps against scorpion venom and Depraved Trinity.',
    zones: [
      {
        zoneName: 'The Blood Aqueduct',
        level: 61,
        hasWaypoint: true,
        navigationTip: 'PERFECT STRAIGHT LINE LAYOUT. Farm here until Level 65-68 if underleveled or hunting "Humility" cards for a 6L Tabula Rasa!',
        vendorReminder: 'Great spot to farm raw currency and complete initial gear links.',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Blood_Aqueduct'
      },
      {
        zoneName: 'The Vastiri Desert & The Oasis',
        level: 62,
        hasWaypoint: true,
        hasSkillPoint: true,
        skillPointQuest: 'Queen of the Sands (Shakari) & Storm Blade',
        navigationTip: 'Desert: Find Storm Blade chest. Oasis: Enter Sand Spit and slay Shakari for +1 Passive Skill Point.',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Vastiri_Desert'
      },
      {
        zoneName: 'The Tunnel',
        level: 62,
        hasWaypoint: true,
        hasLabTrial: true,
        labTrialName: 'Trial of Lingering Pain (Merciless Lab Trial 2)',
        navigationTip: 'Contains Merciless Lab Trial 2! Leads into The Boiling Lake.',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Tunnel'
      },
      {
        zoneName: 'The Boiling Lake & The Refinery',
        level: 63,
        hasWaypoint: false,
        navigationTip: 'Lake: Slay the Basilisk for Basilisk Acid. Refinery: Grab the Trarthan Powder.',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Boiling_Lake'
      },
      {
        zoneName: 'The Belly of the Beast & The Rotting Core',
        level: 64,
        hasWaypoint: false,
        navigationTip: 'Clear 3 dark portals with Sin. Defeat The Depraved Trinity to unlock the lift to Oriath (Act 10).',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Rotting_Core'
      }
    ]
  },
  {
    actNumber: 10,
    title: 'The Final Stand & The Epilogue to Maps',
    themeColor: 'text-red-500 border-red-600/30 bg-red-950/20',
    accentHex: '#ef4444',
    bgGradient: 'from-red-950/40 via-slate-900 to-slate-950',
    levelRange: 'Levels 65 68',
    bossName: 'Kitava, the Destroyer',
    bossWikiUrl: 'https://www.poewiki.net/wiki/Kitava,_the_Destroyer',
    bossStrategy: 'Final Campaign Boss: Huge area hazards. Keep moving between the left and right corners. Stay off the red lava vents when Kitava raises his fists.',
    keyUnlocks: [
      'The Epilogue (Karui Shores): Unlocks the Map Device & The Atlas of Worlds!',
      'SECOND KITAVA CURSE: -30% TO ALL RESISTANCES (Total -60% penalty across both acts!)',
      'Sailor Lilly Roth & Officer Kirac available in Karui Shores'
    ],
    resistCheck: 'MANDATORY: Must reach 75% Fire, Cold, and Lightning Resistance post-Kitava (accounting for the -60% total penalty) before Tier 1 maps!',
    zones: [
      {
        zoneName: 'Cathedral Rooftop & Ravaged Square',
        level: 65,
        hasWaypoint: true,
        navigationTip: 'Rescue Bannon in Cathedral Rooftop. Ravaged Square: Major hub leading to Ossuary, Torched Courts, and Control Blocks.',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Cathedral_Rooftop_(Act_10)'
      },
      {
        zoneName: 'The Ossuary (Act 10)',
        level: 66,
        hasWaypoint: true,
        hasLabTrial: true,
        labTrialName: 'Trial of Burning Rage (Merciless Lab Trial 3)',
        navigationTip: 'Crucial! Contains Merciless Lab Trial 3 + The Elixir of Allure for the questline.',
        vendorReminder: 'Complete your Merciless Labyrinth (6th Ascendancy point) before fighting final Kitava!',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Ossuary_(Act_10)'
      },
      {
        zoneName: 'The Control Blocks (Act 10)',
        level: 66,
        hasWaypoint: false,
        hasSkillPoint: true,
        skillPointQuest: 'Vilenta\'s Vengeance (Slay Vilenta)',
        navigationTip: 'Slay corrupted Vilenta in the arena for +1 Passive Skill Point.',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Control_Blocks_(Act_10)'
      },
      {
        zoneName: 'The Torched Courts & Desecrated Chambers',
        level: 67,
        hasWaypoint: true,
        hasSkillPoint: true,
        skillPointQuest: 'An End to Hunger (Grab the Staff of Purity)',
        navigationTip: 'Slay Avarius, Reassembled to retrieve the Staff of Purity for Bannon.',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Desecrated_Chambers'
      },
      {
        zoneName: 'The Canals & The Feeding Trough',
        level: 68,
        hasWaypoint: false,
        navigationTip: 'Escort Innocence and Sin through The Feeding Trough into the Altar of Hunger.',
        dangerAlert: 'FINAL WARNING: Defeating Kitava will permanently remove 30% from all resistances. Check your gear before clicking the altar!',
        poeWikiUrl: 'https://www.poewiki.net/wiki/The_Feeding_Trough'
      }
    ]
  }
];
