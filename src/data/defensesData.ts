export interface DefenseMechanic {
  id: string;
  name: string;
  category: 'Mitigation' | 'Avoidance' | 'Pool' | 'Recovery' | 'Immunity';
  difficulty: string;
  setupTime: string;
  tagline: string;
  plainEnglish: string;
  theTrap: string;
  ruleOfThumb: string;
  howToScale: string[];
}

export interface ClassDefensiveBlueprint {
  classId: string;
  className: string;
  identity: string;
  difficultyRating: string;
  primaryArchetype: string;
  keyKeystones: string[];
  coreAuras: string[];
  ascendancyHighlights: { name: string; benefit: string }[];
  ssfGearingTips: string[];
}

export interface PantheonSoul {
  id: string;
  name: string;
  type: 'Major' | 'Minor';
  baseEffect: string;
  upgradeEffect: string;
  captureBoss: string;
  captureMap: string;
  whyItMatters: string;
}

export interface SuffixPrefixItem {
  type: 'Prefix' | 'Suffix';
  statCategory: string;
  stats: string[];
  ssfStrategy: string;
}

export interface ChecklistItem {
  id: string;
  title: string;
  category: string;
  threshold: string;
  whyItMatters: string;
}

export const DEFENSE_MECHANICS: DefenseMechanic[] = [
  {
    id: 'armour',
    name: 'Armour and Physical Damage Reduction',
    category: 'Mitigation',
    difficulty: 'Easy',
    setupTime: 'Campaign to Early Maps',
    tagline: 'Great against swarms of small hits, weak against massive boss slams unless layered.',
    plainEnglish: 'Armour mitigates physical damage from incoming attacks and spells. However, Armour follows a crucial rule: the bigger the incoming hit, the LESS percentage mitigation your armour provides! 20,000 Armour will block 80% of a small spider bite (200 damage), but will only mitigate 25% of a massive Minotaur slam (5,000 damage).',
    theTrap: 'Assuming a high tooltip Armour number makes you immune to physical one shots. If you take a 10,000 damage physical slam with 30,000 Armour, you still take over 7,000 raw damage and die instantly.',
    ruleOfThumb: 'Pair Armour with Endurance Charges (4% flat PDR each) and Physical Damage Taken as Elemental on helmets and chest armour. Aim for 25,000+ Armour with Determination.',
    howToScale: [
      'Run Determination aura with mana reservation efficiency masteries.',
      'Use Granite Flask rolled with % Increased Armour during flask effect.',
      'Stack Endurance Charges on the passive tree or via Enduring Cry.',
      'Use Molten Shell (or Vaal Molten Shell) linked with Automation Support or Cast when Damage Taken for a huge 10,000+ HP emergency shield.'
    ]
  },
  {
    id: 'evasion',
    name: 'Evasion Rating and The Entropy Counter',
    category: 'Avoidance',
    difficulty: 'Easy',
    setupTime: 'Campaign to Mid Maps',
    tagline: 'Deterministic attack avoidance that eliminates unlucky attack hit streaks.',
    plainEnglish: 'Evasion does NOT use pure random dice rolls. Path of Exile uses an Entropy Counter system. If you have 80% Evade chance, you are guaranteed that exactly 4 out of every 5 monster attack swings will miss you completely! The counter only resets after 3.33 seconds of not being attacked.',
    theTrap: 'Evasion only prevents ATTACKS. It does literally nothing against SPELLS, degens, or ground effects (burning ground, caustic ground). Relying only on Evasion without Spell Suppression means any spell caster will obliterate you.',
    ruleOfThumb: 'Target 25,000 to 35,000 Evasion with Grace and a Jade Flask. ALWAYS pair Evasion with 100% Spell Suppression on the right side of the tree.',
    howToScale: [
      'Run Grace aura with % increased Grace aura effect.',
      'Equip Jade Flask rolled with % Increased Evasion during flask effect.',
      'Allocate Wind Dancer on the passive tree (20% less damage taken if you have not been hit recently).',
      'Use Ghost Dance keystones on Trickster / Shadow to regenerate Energy Shield on hit.'
    ]
  },
  {
    id: 'suppression',
    name: 'Spell Suppression (100% Cap)',
    category: 'Mitigation',
    difficulty: 'Medium',
    setupTime: 'Yellow to Red Maps',
    tagline: 'Halves all spell hit damage. Mandatory for high tier red maps.',
    plainEnglish: 'Spell Suppression gives a percentage chance to take 50% LESS damage from all enemy spells. Unlike dodge which is all or nothing, suppression acts as a consistent 50% damage reduction buffer as long as you reach 100% chance.',
    theTrap: 'Having 85% or 90% Spell Suppression. If you have 90% suppression, 1 out of every 10 spell hits will bypass your mitigation for full damage and instantly kill you in T16 maps. You MUST reach exactly 100%.',
    ruleOfThumb: '100% Spell Suppression is the single most important defensive threshold on the right side of the tree (Ranger, Shadow, Duelist).',
    howToScale: [
      'Equip pure Dexterity or Dex / Int armour bases (Body Armour, Helmet, Gloves, Boots).',
      'Roll T1 / T2 Spell Suppression on Body Armour (up to 22%), Helmet (14%), Gloves (14%), Boots (14%).',
      'Allocate the Inveterate and Entrench passive wheels on the tree.',
      'Use the Mastery: Spell Suppression is Lucky early on while gearing up to simulate ~96% suppression.'
    ]
  },
  {
    id: 'resistances',
    name: 'Elemental and Chaos Resistances (75% to 90%)',
    category: 'Mitigation',
    difficulty: 'Easy (75%) to Hard (90%)',
    setupTime: 'Acts (75%) to End Game (90%)',
    tagline: 'The mathematical foundation of all damage mitigation in PoE.',
    plainEnglish: 'Elemental Resistances (Fire, Cold, Lightning) reduce incoming elemental damage. The game is balanced assuming you have 75% all resistances in maps (you receive a -60% resistance penalty after finishing Act 10). Raising your max resistance from 75% to 90% cuts incoming elemental damage by a staggering 60%!',
    theTrap: 'Leaving Chaos Resistance negative. Monsters in red maps and bosses inflict heavy Chaos damage and toxic degens. Having -60% Chaos Resistance means you take 160% damage instead of 25% damage!',
    ruleOfThumb: '75% Fire, Cold, Lightning is the mandatory baseline before entering maps. Aim for 0%+ Chaos Res in yellow maps and 60%+ in red maps. Max Res (80% to 90%) is god tier defense.',
    howToScale: [
      'Use Crafting Bench to fill open resistance suffixes on all rare gear.',
      'Use Purity of Elements aura during early progression for +34% all resistances and full elemental ailment immunity.',
      'Use Harvest craft to swap elemental resistances between Fire, Cold, and Lightning at zero currency risk.',
      'Scale Max Res via Brass Dome (+5% Max Res), Melding of the Flesh, Chieftain ascendancy (90% all res), or Shield implicits.'
    ]
  },
  {
    id: 'phys_taken_as',
    name: 'Damage Shift: Physical Taken as Elemental',
    category: 'Mitigation',
    difficulty: 'Medium to Hard',
    setupTime: 'Mid Maps to End Game',
    tagline: 'The secret weapon that turns lethal physical slams into harmless tickles.',
    plainEnglish: 'Because Physical damage is the hardest damage type to mitigate against large boss slams, converting incoming physical damage to Fire, Cold, or Lightning allows your 75% to 90% elemental resistances to absorb it instead!',
    theTrap: 'Relying solely on Armour for physical defense against pinnacle bosses (Uber Shaper, Sirus, Maven) who penetrate or overwhelm armour.',
    ruleOfThumb: 'Converting 50% to 100% of Physical damage taken to Elemental makes you virtually immune to standard one shot slams.',
    howToScale: [
      'Cloak of Flame body armour (40% Physical taken as Fire damage).',
      'Lightning Coil body armour (50% Physical taken as Lightning damage).',
      'Eldritch implicit on Helmet: 7% to 8% Physical taken as Fire / Eater of Worlds.',
      'Crafting Bench on Helmet: 8% Physical taken as Fire / Craftable suffix.',
      'Dawnbreaker shield (up to 20% Physical taken as Fire).'
    ]
  },
  {
    id: 'block',
    name: 'Attack Block, Spell Block and Lucky Block',
    category: 'Avoidance',
    difficulty: 'Medium',
    setupTime: 'Early to End Game',
    tagline: 'Completely eliminates incoming hits when equipped with shields or staves.',
    plainEnglish: 'Block gives a percentage chance to completely prevent all damage and ailments from an attack or spell hit. The base cap is 75%. With the Svalinn unique shield, block is Lucky, meaning the game rolls twice and takes the successful block, giving an effective 93.75% block rate!',
    theTrap: 'Allocating Glancing Blows keystone without strong recovery on block (e.g. 5% life gained on block). Glancing Blows doubles your block chance but forces you to still take 65% of the damage!',
    ruleOfThumb: 'True 75% / 75% Max Block or Svalinn Lucky Block trivializes dense expedition, simulacrum, and monster pack swarms.',
    howToScale: [
      'Use a high base block shield (Colossal Tower Shield, Titan Gauntlets, Kite Shield).',
      'Allocate shield and block wheels near Templar / Duelist (Sanctuary, Command of Steel).',
      'Use Tempest Shield aura for +18% Spell Block and permanent Shock immunity.',
      'Roll Recover 5% of Life when you Block on Shaper or Crusader shield bases.'
    ]
  },
  {
    id: 'life_and_ci',
    name: 'Life vs Chaos Inoculation (CI) and Energy Shield',
    category: 'Pool',
    difficulty: 'Easy (Life) to Hard (CI)',
    setupTime: 'Acts (Life) / Level 85+ (CI)',
    tagline: 'Your raw buffer against damage spikes and degens.',
    plainEnglish: 'Life is the default pool. Every build needs flat life on almost every gear piece and 130%+ increased Life on the tree. Chaos Inoculation (CI) sets maximum Life to 1, but grants total 100% IMMUNITY to Chaos damage, requiring you to scale thousands of Energy Shield as your entire hit pool.',
    theTrap: 'Switching to Chaos Inoculation too early before having at least 5,000+ Energy Shield and Stun / Freeze mitigation. You will constantly get stun locked or one shot.',
    ruleOfThumb: 'Life builds want 4,000+ Life in maps. CI builds want 7,000+ Energy Shield before tackling T16 maps.',
    howToScale: [
      'For Life: Aim for Tier 1 or Tier 2 Flat Life on Helmet, Body, Gloves, Boots, Rings, Amulet, and Belt.',
      'For CI: Equip pure Energy Shield bases (Hubris Circlet, Vaal Regalia, Sorcerer Boots/Gloves) crafted with dense fossils.',
      'Use Discipline aura + Ghost Dance or Wicked Ward for rapid ES recharge.'
    ]
  },
  {
    id: 'recoup_and_leech',
    name: 'Life Leech, Recoup and Life Gain on Hit (LGoH)',
    category: 'Recovery',
    difficulty: 'Easy to Medium',
    setupTime: 'Campaign to Mid Maps',
    tagline: 'The engine that refills your health globe from 10% back to 100% in milliseconds.',
    plainEnglish: 'Recovery decides whether you survive sustained fights. Life Leech recovers up to 20% of your maximum life per second from attack/spell damage. Recoup recovers a percentage (typically 30% to 50%) of all damage taken over the next 4 seconds. Life Gain on Hit gives instant flat HP on every projectile or strike!',
    theTrap: 'Relying only on Life Flasks for recovery in maps. Flasks run out of charges during prolonged boss fights.',
    ruleOfThumb: 'Every build needs at least 1 reliable passive recovery engine: Leech with Instant Leech Mastery, 30%+ Recoup, or Life Gain on Hit.',
    howToScale: [
      'Allocate the 10% Instant Leech mastery on passive tree leech wheels.',
      'Allocate the Infused and Vampirism Recoup wheels on the passive tree (30% to 50% damage recouped as Life).',
      'Use Vitality aura or Watchers Eye with Gain +30 Life per Enemy Hit by your Attacks while affected by Vitality.',
      'Equip rings with +2 to +3 Mana / Life gained on Hit for fast hitting skills (Tornado Shot, Spark, Ball Lightning).'
    ]
  },
  {
    id: 'mom',
    name: 'Mind Over Matter (MoM) and Eldritch Battery',
    category: 'Pool',
    difficulty: 'Medium',
    setupTime: 'Early Maps to End Game',
    tagline: 'Using your Mana or Energy Shield pool as a secondary shield.',
    plainEnglish: 'Mind Over Matter (MoM) redirects 40% of damage taken from Life to your unreserved Mana pool. If you have 3,000 Life and 3,000 unreserved Mana, you effectively have 5,000 effective health against big hits!',
    theTrap: 'Reserving 99% of your mana with auras while having Mind Over Matter allocated. If your unreserved mana is 50, MoM does nothing to save you.',
    ruleOfThumb: 'Pair MoM with Archmage, Hierophant, or Agnostic only if you maintain 2,000+ unreserved Mana and massive mana regeneration.',
    howToScale: [
      'Scale Maximum Mana on gear and passives to 5,000+ Mana.',
      'Use Archmage or Cloak of Defiance (additional 10% damage taken from Mana before Life).',
      'Pair with Eldritch Battery on casters to use Energy Shield for skill costs while protecting Life with Mana.'
    ]
  },
  {
    id: 'ailments',
    name: 'Elemental Ailment and Curse Immunity',
    category: 'Immunity',
    difficulty: 'Easy to Hard',
    setupTime: 'Acts to End Game',
    tagline: 'Stops you from being frozen in place or taking 50% increased shock damage.',
    plainEnglish: 'Elemental Ailments (Freeze, Chill, Shock, Ignite, Brittle, Sap, Scorch) cause unexpected deaths. Shock makes you take up to 50% MORE damage, while Freeze locks your character in place while monsters hit you.',
    theTrap: 'Ignoring Freeze and Shock. 80% of sudden deaths in red maps occur when a player gets frozen by a strongbox or shocked by a lightning rare monster.',
    ruleOfThumb: 'Ailment Immunity is non negotiable in red maps. Use Purity of Elements early on, then transition to gear based avoidance.',
    howToScale: [
      'Purity of Elements aura grants instant 100% immunity to Freeze, Chill, Ignite, and Shock.',
      'Endgame gear: Ancestral Vision jewel (50% ailment avoid from spell suppress) + 30% Avoid on Boots + 20% on Shield or Chest.',
      'Pantheon: Soul of the Brine King upgraded for Freeze Immunity + 50% reduced chill effect.',
      'Flask suffixes: Immunity to Shock / Freeze during flask effect.'
    ]
  }
];

export const CLASS_DEFENSIVE_BLUEPRINTS: ClassDefensiveBlueprint[] = [
  {
    classId: 'marauder',
    className: 'Marauder (Juggernaut / Chieftain / Berserker)',
    identity: 'Heavy Armour, Max Endurance Charges, 90% All Elemental Resistance, and Unstoppable action speed.',
    difficultyRating: 'Very Easy',
    primaryArchetype: 'Armour + Max Resistances + Endurance Charges',
    keyKeystones: ['Unwavering Stance', 'Iron Reflexes', 'Divine Shield', 'Resolute Technique'],
    coreAuras: ['Determination', 'Purity of Fire (Chieftain)', 'Herald of Ash / Purity', 'Defiance Banner'],
    ascendancyHighlights: [
      { name: 'Juggernaut (Untiring and Unbreakable)', benefit: 'Armour applies to Elemental Damage taken from hits; regenerates 40% of physical damage prevented.' },
      { name: 'Chieftain (Tasalio, Cleansing Water)', benefit: 'Modifiers to Fire Resistance apply to Cold and Lightning; effortlessly reaches 90% All Elemental Resistance.' },
      { name: 'Berserker (Defy Pain)', benefit: 'Massive Armour scaling to offset the 10% increased damage taken from Aspect of Carnage.' }
    ],
    ssfGearingTips: [
      'Equip pure Armour bases (Astral Plate, Royal Plate, Colossal Tower Shield).',
      'Use Essence of Greed for guaranteed high Flat Life rolls.',
      'Use Enduring Cry linked to Autoexertion Support or Automation for passive endurance charge upkeep and burst healing.'
    ]
  },
  {
    classId: 'duelist',
    className: 'Duelist (Champion / Gladiator / Slayer)',
    identity: 'Fortify, 75% / 75% Max Block, Spell Suppression, and Overleech immortality.',
    difficultyRating: 'Easy',
    primaryArchetype: 'Fortify + Armour/Evasion Hybrid + Max Block',
    keyKeystones: ['Iron Reflexes', 'Point Blank', 'Versatile Combatant', 'Crimson Dance'],
    coreAuras: ['Determination', 'Grace', 'Pride / Flesh and Stone', 'Dread Banner'],
    ascendancyHighlights: [
      { name: 'Champion (Fortitude)', benefit: 'Permanent 20 Fortification stacks granting passive 20% LESS damage taken from all hits.' },
      { name: 'Gladiator (Determined Survivor and More Than Skill)', benefit: 'Effortlessly caps 75%+ Attack and Spell Block from shields; block becomes lucky with More Than Skill.' },
      { name: 'Slayer (Brutal Fervour)', benefit: 'Overleech: Life Leech effects are not removed at full life, providing continuous 20% to 40% regen during combat.' }
    ],
    ssfGearingTips: [
      'Use Armour / Evasion hybrid bases (General\'s Brigandine, Dragonscale Gauntlets).',
      'Farm The Porcupine or The Dapper Prodigy for clean 6L weapon/chest starts.',
      'Allocate 10% Instant Leech mastery for instant health refills during multi target strikes.'
    ]
  },
  {
    classId: 'ranger',
    className: 'Ranger (Deadeye / Pathfinder / Warden)',
    identity: '100% Spell Suppression, 35k+ Evasion, Barkskin physical shift, and Permanent Utility Flasks.',
    difficultyRating: 'Medium',
    primaryArchetype: 'High Evasion + 100% Spell Suppression + Flask & Barkskin Mitigation',
    keyKeystones: ['Wind Dancer', 'Acrobatics', 'Ghost Dance', 'Point Blank'],
    coreAuras: ['Grace', 'Defiance Banner', 'Precision', 'Purity of Elements'],
    ascendancyHighlights: [
      { name: 'Pathfinder (Master Surgeon)', benefit: 'Life Flasks apply continuously and gain charges every 3 seconds; permanent 20% less elemental damage taken.' },
      { name: 'Deadeye (Wind Ward)', benefit: 'Gains Gale Force stacks for up to 30% LESS damage taken while moving.' },
      { name: 'Warden (Barkskin and Oath of Winter)', benefit: 'Barkskin provides flat Armour and physical mitigation that shifts to high Evasion as Bark sheds; Oath of Winter enables 100% Freeze uptime on bosses, and Tincture mastery scales massive flask-like buffs.' }
    ],
    ssfGearingTips: [
      'Equip pure Dexterity bases with T1/T2 Spell Suppression on Helmet, Body, Gloves, and Boots.',
      'Roll automated flask prefixes (Used when Charges Reach Full) with 20% Quality on Jade and Quartz flasks.',
      'Use Ancestral Vision jewel to convert 100% Spell Suppression into 50% Elemental Ailment Avoidance.'
    ]
  },
  {
    classId: 'shadow',
    className: 'Shadow (Trickster / Assassin / Saboteur)',
    identity: 'Energy Shield Overleech, Ghost Shrouds, Spell Suppression, and Elusive buff scaling.',
    difficultyRating: 'Medium',
    primaryArchetype: 'Evasion + Energy Shield Hybrid + 100% Spell Suppression',
    keyKeystones: ['Ghost Dance', 'Eldritch Battery', 'Chaos Inoculation', 'Acrobatics'],
    coreAuras: ['Grace', 'Discipline', 'Skitterbots', 'Tempest Shield'],
    ascendancyHighlights: [
      { name: 'Trickster (Escape Artist and Spellbreaker)', benefit: 'Massive Energy Shield from Body Armour and Evasion from Helmet; +20% Spell Suppression and ES leech.' },
      { name: 'Assassin (Mistress of Shadows)', benefit: 'Scales Elusive buff effect for up to 25% Attack and Spell Avoidance + Movement Speed.' },
      { name: 'Saboteur (Born in the Shadows)', benefit: 'Nearby enemies are permanently Blinded (giving them 20% less accuracy) and deal 10% reduced damage.' }
    ],
    ssfGearingTips: [
      'Equip pure Evasion / Energy Shield hybrid bases (Sadist Garb, Carnal Armour).',
      'Allocate Ghost Dance keystone: recovering 3% of your Evasion Rating as Energy Shield whenever you take a hit.',
      'Craft Trigger Socketed Spells when you Focus on Helmet for instant Steelskin / Enfeeble triggers.'
    ]
  },
  {
    classId: 'witch',
    className: 'Witch (Necromancer / Occultist / Elementalist)',
    identity: 'Primal Aegis elemental shields, Bone Offering max block, Chaos Inoculation, and minion meatshields.',
    difficultyRating: 'Medium to Advanced',
    primaryArchetype: 'Max Block + Aegis Shields + Chaos Inoculation / Life Hybrid',
    keyKeystones: ['Minion Instability', 'Wicked Ward', 'Chaos Inoculation', 'Eldritch Battery'],
    coreAuras: ['Determination', 'Discipline', 'Tempest Shield', 'Purity of Elements'],
    ascendancyHighlights: [
      { name: 'Elementalist (Bastion of Elements)', benefit: 'Primal Aegis shield absorbs 2,500+ elemental damage and grants total immunity to reflected elemental damage.' },
      { name: 'Necromancer (Mistress of Sacrifice)', benefit: 'Bone Offering applies to your character, granting up to 35% Attack Block and 34% Spell Block on demand.' },
      { name: 'Occultist (Vile Bastion and Frigid Wake)', benefit: 'Energy Shield cannot be stunned; regenerates 40% ES per second from killed cursed enemies; Freezes nearby enemies.' }
    ],
    ssfGearingTips: [
      'Slot Bone Offering with Cast when Damage Taken or trigger craft on weapon for automatic block uptime.',
      'Use Cloak of Flame or Lightning Coil to convert Physical damage to Fire/Lightning.',
      'Transition to pure Chaos Inoculation (CI) once you craft 600+ ES Vaal Regalia and 300+ ES Hubris Circlet.'
    ]
  },
  {
    classId: 'templar',
    className: 'Templar (Inquisitor / Hierophant / Guardian)',
    identity: 'Dual Life and Energy Shield Regen, 5,000+ Mana Mind Over Matter, and Radiant Sentinel damage redirection.',
    difficultyRating: 'Very Easy to Easy',
    primaryArchetype: 'Consecrated Ground Dual Regen + MoM + Armour/ES Hybrid',
    keyKeystones: ['Mind Over Matter', 'The Agnostic', 'Glancing Blows', 'Sanctuary'],
    coreAuras: ['Determination', 'Discipline', 'Tempest Shield', 'Purity of Elements'],
    ascendancyHighlights: [
      { name: 'Inquisitor (Pious Path)', benefit: 'Consecrated Ground regenerates both Life AND Energy Shield simultaneously, granting up to 2,000+ total HP/sec recovery.' },
      { name: 'Hierophant (Divine Guidance and Sanctuary of Thought)', benefit: 'Increases Mind Over Matter mitigation to 50%; scales 5,000+ Mana pools into massive defensive buffers.' },
      { name: 'Guardian (Radiant Faith and Unwavering Crusade)', benefit: 'Shares 10% of reserved mana as Armour and 10% of reserved life as Energy Shield to you and all party members.' }
    ],
    ssfGearingTips: [
      'Craft Armour / Energy Shield hybrid gear (Crusader Plate, Praetor Crown).',
      'Allocate Sanctuary and Light of Divinity near the Templar starting wheel.',
      'Use Svalinn shield for Lucky Block with Tempest Shield for effortless 90%+ effective block.'
    ]
  },
  {
    classId: 'scion',
    className: 'Scion (Ascendant / Reliquarian / Luminary)',
    identity: 'Ultimate tree flexibility, rotating Unique item powers, and permanent customizable Mercenary companions.',
    difficultyRating: 'Advanced',
    primaryArchetype: 'Hybrid Multi Layer Mastery (Block + Suppress + Mercenary Auras)',
    keyKeystones: ['Path of the Duelist', 'Path of the Marauder', 'Iron Reflexes', 'Wind Dancer'],
    coreAuras: ['Determination', 'Grace', 'Defiance Banner', 'Tempest Shield'],
    ascendancyHighlights: [
      { name: 'Ascendant (Cross Class Synergy)', benefit: 'Combines two distinct ascendancy wheels (e.g. Champion Fortify + Trickster Suppression) with unrestricted passive tree starting path flexibility.' },
      { name: 'Reliquarian (Wraeclast Unique Mastery)', benefit: 'Borrows powerful notable passives derived from unique items across Wraeclast, which rotate each league for creative buildcrafting.' },
      { name: 'Luminary (Permanent Mercenary Commander)', benefit: 'Permanently hires up to 3 Mercenaries (1 active in combat, 2 in reserve) with fully customizable player equipment to provide tailored defensive and offensive auras.' }
    ],
    ssfGearingTips: [
      'Utilize passive tree jewel sockets to connect large attribute wheels.',
      'Equip high tier suppress and armour/evasion hybrid gear.',
      'Use Timeless Jewels (Glorious Vanity / Elegant Hubris) for key defensive keystones.'
    ]
  }
];

export const DEFENSIVE_CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: 'check-ele-res',
    title: '75%+ Fire, Cold, and Lightning Resistances',
    category: 'Mitigation',
    threshold: '75% (or 80%+ with Max Res)',
    whyItMatters: 'Mandatory for mapping. Maps apply -60% resistance penalty; having 70% instead of 75% means you take 20% more elemental damage.'
  },
  {
    id: 'check-chaos-res',
    title: '0%+ Chaos Resistance (Aim for 50%+ in Red Maps)',
    category: 'Mitigation',
    threshold: '0% in Yellows, 50%+ in T16s',
    whyItMatters: 'Monsters, purple caustic ground, and toxic altar mods hit with heavy Chaos damage. Negative chaos resistance causes instantaneous deaths.'
  },
  {
    id: 'check-phys-defense',
    title: '25,000+ Armour OR 40%+ Physical Taken as Elemental',
    category: 'Mitigation',
    threshold: '25k Armour + Determination OR Cloak of Flame / Lightning Coil',
    whyItMatters: 'Physical damage is the most dangerous damage type from monster hits and boss slams. Armour or Phys Taken As prevents one shots.'
  },
  {
    id: 'check-spell-suppress',
    title: '100% Spell Suppression (Right Tree) OR 75% Spell Block',
    category: 'Avoidance / Mitigation',
    threshold: '100% Spell Suppress OR 75% Spell Block',
    whyItMatters: 'Halves all spell damage in maps. If you have less than 100%, occasional spell hits will bypass suppression and kill you.'
  },
  {
    id: 'check-freeze-immune',
    title: 'Freeze and Chill Immunity',
    category: 'Immunity',
    threshold: 'Purity of Elements OR Brine King Pantheon OR Boots Craft',
    whyItMatters: 'Freezes from strongboxes and cold rares lock you in place while taking hits. 100% immunity prevents death locks.'
  },
  {
    id: 'check-shock-immune',
    title: 'Shock Mitigation or Immunity',
    category: 'Immunity',
    threshold: 'Tempest Shield OR Purity of Elements OR Flask Suffix',
    whyItMatters: 'Shock increases all damage taken by up to 50%. A shocked character taking a critical strike is almost always lethal.'
  },
  {
    id: 'check-bleed-cb',
    title: 'Bleed and Corrupted Blood Immunity',
    category: 'Immunity',
    threshold: 'Corrupted Blood Jewel Implicit + Staunching Life Flask',
    whyItMatters: 'Corrupted Blood stacks up to 20 times and melts your health globe in 1 second. Corrupted Blood immunity jewel mastery is essential.'
  },
  {
    id: 'check-ehp-pool',
    title: '4,200+ Life OR 7,000+ Energy Shield (CI) OR 3,000 Life + 3,000 Mana (MoM)',
    category: 'Pool',
    threshold: '4.2k+ Life in T16 Maps',
    whyItMatters: 'Provides the raw buffer necessary to absorb unavoidable damage spikes and lingering ground degens.'
  },
  {
    id: 'check-recovery',
    title: 'Sustained Burst Recovery Engine',
    category: 'Recovery',
    threshold: 'Instant Leech Mastery OR 30%+ Recoup OR 1,000+ Life Regen',
    whyItMatters: 'Flasks run out. You need passive mechanics that restore your health from 10% to 100% in under a second during combat.'
  },
  {
    id: 'check-guard-skill',
    title: 'Automated Guard Skill Setup',
    category: 'Mitigation',
    threshold: 'Molten Shell / Steelskin linked to Cast when Damage Taken',
    whyItMatters: 'Automatically triggers a 2,000 to 10,000 HP emergency damage absorption shield the moment you take a large hit.'
  }
];

export interface DefenseMilestone {
  id: string;
  badge: string;
  badgeColor: string;
  title: string;
  subtitle: string;
  targetPool: string;
  resistances: string;
  coreMitigation: string;
  recoveryAndFlasks: string;
  failurePoint: string;
  actionChecklist: string[];
}

export const DEFENSIVE_MILESTONES: DefenseMilestone[] = [
  {
    id: 'campaign',
    badge: 'Acts 1 to 10',
    badgeColor: 'emerald',
    title: 'Campaign Defenses (Levels 1 to 68)',
    subtitle: 'Surviving Kitava, lab trials, and setting up the baseline for maps.',
    targetPool: '300+ Life per Act (e.g. 900 in Act 3, 1,800 in Act 6, 3,000+ by Act 10).',
    resistances: '75% Fire, Cold, Lightning by Act 10. (Kitava applies -30% at Act 5 and another -30% at Act 10).',
    coreMitigation: 'Early Determination or Grace aura. Purity of Elements is premier for free resistances and ailment immunity.',
    recoveryAndFlasks: 'Two upgraded Life Flasks with instant or bubbling roll. Granite or Jade Flask active during packs.',
    failurePoint: 'Entering Act 6 or Act 10 with uncapped resistances or under 2,000 Life. Kitava or Innocence will one shot you.',
    actionChecklist: [
      'Use the Crafting Bench in your hideout after Act 2 to craft missing resistances on every open gear suffix.',
      'Pick up every Two Toned Boots, Coral Ring, and Leather Belt for flat Life and dual resists.',
      'Link your main movement skill (Flame Dash, Frostblink, Leap Slam) with Faster Attacks or Arcane Surge.',
      'Complete the first 3 Labyrinths (Normal at Act 3, Cruel at Act 7, Merciless at Act 10) before fighting Kitava.'
    ]
  },
  {
    id: 'white_maps',
    badge: 'Tier 1 to 5',
    badgeColor: 'sky',
    title: 'Early White Maps Baseline',
    subtitle: 'Establishing the core mapping defenses and avoiding random rare monster spikes.',
    targetPool: '3,500+ Life OR 4,500+ Energy Shield.',
    resistances: 'Strictly 75% Fire, Cold, Lightning. 0%+ Chaos Resistance.',
    coreMitigation: '15,000+ Armour OR 15,000+ Evasion. Level 1 Cast when Damage Taken linked to Molten Shell or Steelskin.',
    recoveryAndFlasks: 'Staunching Life Flask (Bleed and Corrupted Blood removal). Automated utility flasks (Used when Charges Full).',
    failurePoint: 'Ignoring bleed and corrupted blood. Fast attacking monsters like archers or physical chargers will drain your globe in 0.5s.',
    actionChecklist: [
      'Equip a Quicksilver Flask, Granite Flask, and Jade Flask with automated instilling orb enchantments.',
      'Purchase an uncorrupted Corrupted Blood immunity jewel or allocate the passive tree mastery.',
      'Level up Determination or Grace to level 20 and allocate Mana Reservation Efficiency wheels.',
      'Upgrade your pantheon powers (Soul of the Brine King for freeze immunity).'
    ]
  },
  {
    id: 'yellow_maps',
    badge: 'Tier 6 to 10',
    badgeColor: 'amber',
    title: 'Mid Yellow Maps Hardening',
    subtitle: 'Surviving map mod damage multipliers, essence monsters, and syndicate encounters.',
    targetPool: '4,200+ Life OR 5,500+ Energy Shield (or 3,000 Life + 2,500 Mana with Mind Over Matter).',
    resistances: '75%+ Elemental Resistances (overcapped by 20% to ignore curses). 20%+ Chaos Resistance.',
    coreMitigation: '80%+ Spell Suppression OR 50%+ Attack and Spell Block. 20,000+ Armour or Evasion.',
    recoveryAndFlasks: 'At least 1 passive recovery engine: 10% Instant Leech mastery, 30%+ Recoup, or 800+ Life regen/sec.',
    failurePoint: 'Spell caster packs and dangerous map mods (Extra Damage as Fire/Cold/Lightning, -Max Resists, Crit Multi).',
    actionChecklist: [
      'Begin replacing campaign armour with pure Dexterity or Armour bases for spell suppression rolls.',
      'Craft Eldritch implicits on Helmet (Physical damage taken as Fire) using Lesser Eldritch Embers.',
      'Ensure 100% Freeze and Chill immunity via Brine King pantheon or Boots crafted prefix.',
      'Roll Shock mitigation or immunity on a utility flask or Tempest Shield.'
    ]
  },
  {
    id: 'red_maps',
    badge: 'Tier 11 to 16',
    badgeColor: 'rose',
    title: 'End Game Red Maps Mastery',
    subtitle: 'Withstanding dense pack swarms, altar modifiers, and T16 guardian maps without dying.',
    targetPool: '4,800+ Life OR 7,000+ Energy Shield (CI) OR 3.5k Life + 4k Mana (MoM Archmage).',
    resistances: '75% to 80% Max Elemental Resists. 50%+ Chaos Resistance (75% recommended for toxic altars).',
    coreMitigation: '100% Spell Suppression (MANDATORY on right tree) OR 75%/75% Max Block (with Svalinn or Aegis Aurora). 25k to 40k+ Armour/Evasion.',
    recoveryAndFlasks: 'Burst recovery that refills the entire pool in under 1 second. Permanent 100% utility flask uptime.',
    failurePoint: 'Having 90% Spell Suppression instead of 100%, or negative Chaos Resistance against toxic altar monsters.',
    actionChecklist: [
      'Cap Spell Suppression at exactly 100% using T1 rolls on Body Armour, Helmet, Gloves, Boots, and tree wheels.',
      'Equip Cloak of Flame (40% Phys as Fire) or Lightning Coil (50% Phys as Lightning) for damage shift.',
      'Upgrade Minor Pantheon (Soul of Abberath for burning ground immunity or Soul of Ralakesh for bleed mitigation).',
      'Roll Level 20/20 Vaal Molten Shell for 10,000+ HP emergency barrier during dangerous map bosses.'
    ]
  },
  {
    id: 'pinnacle_t17',
    badge: 'Tier 17 and Pinnacles',
    badgeColor: 'purple',
    title: 'Pinnacle Bosses and Tier 17 Content',
    subtitle: 'Surviving Uber Maven memory games, Uber Sirus storms, Uber Shaper slams, and T17 abyssal modifiers.',
    targetPool: '5,500+ Life OR 8,500+ Energy Shield OR 4k Life + 6k Mana.',
    resistances: '85% to 90% Maximum All Elemental Resistances (via Melding of the Flesh, Chieftain, Brass Dome, or Purity of Fire/Ice/Lightning). 75% Chaos Res.',
    coreMitigation: '60% to 100% Physical Damage Taken as Elemental. 100% Spell Suppression + Svalinn Lucky Block or 90% Max Res.',
    recoveryAndFlasks: 'Immortal recovery setups: Pathfinder infinite Life Flasks, Inquisitor 2,500+ dual regen, or Overleech.',
    failurePoint: 'Physical damage penetration and resistance overwhelming. Raw Armour fails against Uber Boss 20,000+ damage slams; you MUST use damage shift.',
    actionChecklist: [
      'Achieve 90% All Maximum Elemental Resistances using Max Res shields, Brass Dome, or Melding of the Flesh.',
      "Stack Physical Taken as Elemental to 80%+ across Body Armour, Helmet Eldritch implicit, Crafting Bench, and Watcher's Eye.",
      'Obtain 100% Elemental Ailment Avoidance via Ancestral Vision jewel + Boots avoidance mod.',
      'Utilize Progenesis or Taste of Hate unique utility flasks for additional 25% damage staggering and shift.'
    ]
  }
];

export const SUFFIX_PREFIX_ITEMS: SuffixPrefixItem[] = [
  {
    type: 'Prefix',
    statCategory: 'Life and Defenses',
    stats: ['Flat Maximum Life', 'Flat Energy Shield', '% Increased Armour / Evasion / Energy Shield', 'Flat Added Physical/Elemental Damage', '+1 to Level of all Spell Skill Gems', 'Movement Speed (Boots)'],
    ssfStrategy: 'Prefixes determine your raw hit pool and baseline damage. Craft them deterministically using Essences of Greed (Life), essences of flat damage, or Eldritch / Harvest reforge life.'
  },
  {
    type: 'Suffix',
    statCategory: 'Resistances and Mitigation (The Contested Slots)',
    stats: ['Fire / Cold / Lightning Resistances', 'Chaos Resistance', 'Spell Suppression %', 'Attributes (Strength, Dexterity, Intelligence)', 'Attack / Cast Speed', 'Critical Strike Chance / Multiplier'],
    ssfStrategy: 'Suffixes are the most contested resource in SSF because 90% of your defensive caps compete for only 3 suffix slots per rare item. Prioritize Spell Suppression and Chaos Resistance early on gear, then balance Elemental Resistances on jewellery and tree masteries.'
  }
];

export const PANTHEON_SOULS: PantheonSoul[] = [
  {
    id: 'brine-king',
    name: 'Soul of the Brine King',
    type: 'Major',
    baseEffect: '1% Stun Recovery per 0.1s up to 100%. Cannot be Stunned if you have been Stunned Recently.',
    upgradeEffect: 'Cannot be Frozen (Frees up a crucial utility flask suffix!) and 50% Reduced Effect of Chill on you.',
    captureBoss: 'Nassur, Son of the Sea',
    captureMap: 'Reef Map (Tier 10+)',
    whyItMatters: 'The #1 recommended Major Pantheon for mapping in SSF. Completely eliminates freeze deaths without needing freeze immune flasks.'
  },
  {
    id: 'arakaali',
    name: 'Soul of Arakaali',
    type: 'Major',
    baseEffect: '10% Reduced Damage taken from Damage over Time.',
    upgradeEffect: '+20% increased Recovery Rate of Life and Energy Shield if you have stopped taking Damage over Time recently; +40% Chaos Resistance against Damage over Time.',
    captureBoss: 'Queen of the Great Tangle',
    captureMap: 'Arachnid Tomb Map (Tier 12+)',
    whyItMatters: 'Essential for Righteous Fire, Energy Shield overleech builds, and combating dangerous toxic ground or bleed degens.'
  },
  {
    id: 'solaris',
    name: 'Soul of Solaris',
    type: 'Major',
    baseEffect: '6% additional Physical Damage Reduction while there is only one nearby enemy.',
    upgradeEffect: 'Take no Extra Damage from Critical Strikes if you have taken a Critical Strike Recently; 8% reduced Elemental Damage taken if you have not been hit recently.',
    captureBoss: 'The Gorgon / Jorus',
    captureMap: 'Temple / Mineral Pools',
    whyItMatters: 'The ultimate bossing major pantheon. Prevents devastating critical strike one shots from Pinnacle and Uber bosses.'
  },
  {
    id: 'lunaris',
    name: 'Soul of Lunaris',
    type: 'Major',
    baseEffect: '1% additional Physical Damage Reduction for each nearby enemy, up to 8%.',
    upgradeEffect: '10% chance to Avoid Projectiles; Avoid Chained Projectiles; 6% reduced Elemental Damage taken if nearby enemies.',
    captureBoss: 'Sebbert, Crescent\'s Peak',
    captureMap: 'Coral Ruins Map',
    whyItMatters: 'Optimal for dense mapping, Expedition, and Breach where monster projectile swarms are the primary hazard.'
  },
  {
    id: 'ralakesh',
    name: 'Soul of Ralakesh',
    type: 'Minor',
    baseEffect: '25% reduced Physical Damage over Time taken while moving.',
    upgradeEffect: 'Cannot gain Corrupted Blood if you have at least 5 stacks; Moving while bleeding does not cause you to take extra damage.',
    captureBoss: 'Drek, Apex Hunter',
    captureMap: 'Ashen Wood Map',
    whyItMatters: 'Essential minor pantheon for campaign to red maps. Prevents lethal corrupted blood stacks from rare nemesis packs.'
  },
  {
    id: 'abberath',
    name: 'Soul of Abberath',
    type: 'Minor',
    baseEffect: '60% reduced Duration of Ignite on you.',
    upgradeEffect: 'Unaffected by Burning Ground; 10% increased Movement Speed while on Burning Ground.',
    captureBoss: 'Mephod, Earth\'s Genius',
    captureMap: 'Summit / Caldera Map',
    whyItMatters: 'Mandatory when running red map altars with burning ground or exarch fiery ground degens.'
  },
  {
    id: 'yugul',
    name: 'Soul of Yugul',
    type: 'Minor',
    baseEffect: '50% reduced Reflected Damage taken.',
    upgradeEffect: '30% reduced Effect of Curses on you; 50% chance to reflect Hexes.',
    captureBoss: 'Varisker, the Pale Lord',
    captureMap: 'Terrace / High Gardens',
    whyItMatters: 'Combined with the 20% reduced curse effect mastery or flask suffix, this gives 100% curse immunity against map curses.'
  },
  {
    id: 'garukhan',
    name: 'Soul of Garukhan',
    type: 'Minor',
    baseEffect: '60% reduced Blind Duration on you.',
    upgradeEffect: 'Cannot be Shocked with maximum shock effect; +5% Movement Speed if you have not been hit recently.',
    captureBoss: 'Stalker of the Endless Sands',
    captureMap: 'Dig / Desert Spring',
    whyItMatters: 'Excellent for Evasion/Ranger characters to maintain high movement speed and prevent fatal 50% shock vulnerability.'
  }
];

