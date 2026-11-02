import type { 
  ParsedCharacter, 
  DiagnosticItem, 
  AnalysisReport, 
  ChromaticAdvice, 
  ParsedSkillGroup 
} from '../types/analyzer';

export function analyzeBuild(char: ParsedCharacter, activeGroupId?: string): AnalysisReport {
  const { stats, skillGroups, items, flasks, level, ascendClassName, className } = char;
  const diagnostics: DiagnosticItem[] = [];

  // Find active skill group
  const targetGroupId = activeGroupId || char.selectedSkillGroupId;
  const selectedGroup: ParsedSkillGroup | undefined = 
    skillGroups.find((g) => g.id === targetGroupId) || 
    skillGroups.find((g) => g.isMain) || 
    skillGroups[0];

  // Classify Defensive Archetype
  const isBlockArchetype = stats.block >= 40 || stats.spellBlock >= 30 || stats.hasLifeOnBlock || stats.hasEsOnBlock || stats.hasGlancingBlows;
  const isArmourEsArchetype = (stats.armour >= 5000 && stats.energyShield >= 400) || (stats.armour >= 15000);
  const isPhysConversionArchetype = stats.physTakenAsEle >= 15;
  const isEvasionSuppressionArchetype = (stats.evasion >= 12000 && stats.armour < 6000) || (['Ranger', 'Shadow'].includes(className) && !isBlockArchetype && !isArmourEsArchetype);

  let defenseArchetype = 'Armour & Energy Shield Bulk';
  if (isBlockArchetype) {
    defenseArchetype = 'Block & Recovery on Block Tank';
  } else if (isPhysConversionArchetype) {
    defenseArchetype = 'Physical Damage Shift & Max Res Tank';
  } else if (isEvasionSuppressionArchetype) {
    defenseArchetype = 'Evasion & Spell Suppression';
  } else if (isArmourEsArchetype) {
    defenseArchetype = 'Armour & Energy Shield Hybrid';
  }

  // ==========================================
  // 1. DEFENSES & EHP EVALUATION
  // ==========================================

  // Elemental Resistances
  const minEleRes = Math.min(stats.fireRes, stats.coldRes, stats.lightningRes);
  if (minEleRes < 75) {
    diagnostics.push({
      id: 'uncapped-ele-res',
      category: 'defenses',
      severity: 'critical',
      title: 'Uncapped Elemental Resistances',
      description: `Your lowest elemental resistance is currently ${minEleRes}% (Fire: ${stats.fireRes}%, Cold: ${stats.coldRes}%, Light: ${stats.lightningRes}%). Path of Exile is balanced around a hard 75% baseline; being below cap causes you to take massive additional damage from elemental hits.`,
      impactType: 'ehp',
      estimatedImpact: '+40% to +80% Effective Hit Pool',
      recommendation: 'Cap all Fire, Cold, and Lightning resistances to at least 75% immediately before progressing into higher map tiers.',
      ssfCraftingFix: 'Use Harvest "Change Resistance" craft (e.g. Convert excess Fire to Cold/Lightning for 500 Wild Lifeforce) or craft hybrid/dual resistances on open item suffixes at the Crafting Bench.',
      tags: ['Resistances', 'High Priority', 'Mitigation']
    });
  } else {
    const minOverCap = Math.min(stats.fireResOverCap, stats.coldResOverCap, stats.lightningResOverCap);
    if (minOverCap < 20 && level >= 75) {
      diagnostics.push({
        id: 'low-ele-overcap',
        category: 'defenses',
        severity: 'warning',
        title: 'Low Elemental Resistance Overcap Buffer',
        description: `Your resistance overcap buffer is only +${minOverCap}%. Map curses (Elemental Weakness) and monster Exposure will reduce your resistances below 75% during combat.`,
        impactType: 'ehp',
        estimatedImpact: '+15% Damage Buffer against Cursed Maps',
        recommendation: 'Target +25% to +35% overcapped elemental resistances on gear or run Purity of Elements in early mapping.',
        ssfCraftingFix: 'Roll Anger, Hatred, or Wrath essences on two-stone rings or allocate resistance wheels with mastery bonuses.',
        tags: ['Overcap', 'Map Curses']
      });
    } else {
      diagnostics.push({
        id: 'optimal-ele-res',
        category: 'defenses',
        severity: 'optimal',
        title: 'Elemental Resistances Capped & Overcapped',
        description: `Fire (${stats.fireRes}% +${stats.fireResOverCap}%), Cold (${stats.coldRes}% +${stats.coldResOverCap}%), and Lightning (${stats.lightningRes}% +${stats.lightningResOverCap}%) are completely capped with a healthy curse buffer.`,
        impactType: 'ehp',
        estimatedImpact: 'Baseline Survivability Secured',
        recommendation: 'Resistances are in top shape.',
        ssfCraftingFix: 'No changes needed.',
        tags: ['Resistances', 'Optimal']
      });
    }
  }

  // Chaos Resistance
  if (stats.chaosRes < 0) {
    diagnostics.push({
      id: 'negative-chaos-res',
      category: 'defenses',
      severity: 'critical',
      title: 'Negative Chaos Resistance',
      description: `Your Chaos Resistance is currently ${stats.chaosRes}%. Monsters dealing chaos damage (poison, caustic ground, toxic volatile balls, and hunter influenced packs) will bypass energy shield and melt your life pool instantly.`,
      impactType: 'ehp',
      estimatedImpact: '+35% Survivability against Chaos & Degens',
      recommendation: 'Bring Chaos Resistance to at least 0% in early maps, and ideally +30% to +60% for red maps and pinnacle bosses.',
      ssfCraftingFix: 'Spam Shrieking Essence of Envy on Amethyst Rings (guaranteeing 31-35% Chaos Res) or use Harvest "Reforge Chaos" on shields, boots, and helmets.',
      tags: ['Chaos Res', 'EHP', 'High Priority']
    });
  } else if (stats.chaosRes < 30 && level >= 85) {
    diagnostics.push({
      id: 'suboptimal-chaos-res',
      category: 'defenses',
      severity: 'warning',
      title: 'Chaos Resistance is Below 30%',
      description: `Chaos Resistance is positive at ${stats.chaosRes}%, but remains low for endgame red maps and T17 content.`,
      impactType: 'ehp',
      estimatedImpact: '+18% Hit Pool against Chaos Maps',
      recommendation: 'Target an Amethyst Ring base with an Essence of Envy suffix to hit 40%+ Chaos Resistance.',
      ssfCraftingFix: 'Craft +16-20% Chaos Resistance suffix on open jewelry slots or use Rog in Expedition to craft high-tier chaos gear.',
      tags: ['Chaos Res', 'Endgame']
    });
  } else if (stats.chaosRes >= 60) {
    diagnostics.push({
      id: 'optimal-chaos-res',
      category: 'defenses',
      severity: 'optimal',
      title: `Chaos Resistance Capped (${stats.chaosRes}%)`,
      description: `Chaos Resistance is fully capped at ${stats.chaosRes}%, providing maximum protection against poison, toxic volatiles, and caustic ground.`,
      impactType: 'ehp',
      estimatedImpact: 'Complete Chaos Damage Protection',
      recommendation: 'Chaos resistance is endgame optimized.',
      ssfCraftingFix: 'No changes needed.',
      tags: ['Chaos Res', 'Optimal']
    });
  } else {
    diagnostics.push({
      id: 'optimal-chaos-res',
      category: 'defenses',
      severity: 'optimal',
      title: 'Healthy Chaos Resistance',
      description: `Chaos Resistance is at ${stats.chaosRes}%, providing solid mitigation against chaotic damage over time.`,
      impactType: 'ehp',
      estimatedImpact: 'Chaos Protection Active',
      recommendation: 'Great chaos resistance pool.',
      ssfCraftingFix: 'No changes needed.',
      tags: ['Chaos Res', 'Optimal']
    });
  }

  // Block & Recovery On Block Evaluation
  if (isBlockArchetype) {
    diagnostics.push({
      id: 'block-recovery-optimal',
      category: 'defenses',
      severity: 'optimal',
      title: `Block & Recovery Engine Active (${stats.block}% Attack / ${stats.spellBlock}% Spell Block)`,
      description: `Your character scales high Block mitigation (${stats.block}% Attack, ${stats.spellBlock}% Spell Block). In dense packs, taking frequent small hits actively sustains your health and ES pool via on-hit / on-block recovery.`,
      impactType: 'ehp',
      estimatedImpact: 'Permanent Sustained Recovery in Dense Packs',
      recommendation: 'Block and recovery engine is protecting your build.',
      ssfCraftingFix: 'Maintain shield block suffixes and Tempest Shield aura uptime.',
      tags: ['Block Recovery', 'Aegis', 'Optimal']
    });
  }

  // Spell Suppression Evaluation (ONLY for dedicated Evasion builds)
  if (isEvasionSuppressionArchetype) {
    if (stats.spellSuppression === 0 && level >= 75) {
      diagnostics.push({
        id: 'zero-spell-suppression',
        category: 'defenses',
        severity: 'warning',
        title: 'Zero Spell Suppression Chance',
        description: 'You currently have 0% Spell Suppression on an Evasion archetype. Spell suppression halves all incoming spell damage (50% less damage taken from spells) and is the premier defensive layer for evasion builds.',
        impactType: 'ehp',
        estimatedImpact: '50% Damage Reduction against Boss Spells',
        recommendation: 'Equip Evasion or Armour/Evasion gear bases and prioritize +10-14% Spell Suppression suffixes.',
        ssfCraftingFix: 'Collect Item Level 84+ evasion bases. Use Harvest Reforge Caster/Defense or Rog crafting to land T1-T2 suppression on Body, Helmet, Gloves, and Boots, plus the "Suppression is Lucky" mastery.',
        tags: ['Spell Suppression', 'Mitigation']
      });
    } else if (stats.spellSuppression > 0 && stats.spellSuppression < 100) {
      diagnostics.push({
        id: 'uncapped-spell-suppression',
        category: 'defenses',
        severity: 'warning',
        title: `Uncapped Spell Suppression (${stats.spellSuppression}%)`,
        description: `Your spell suppression chance is at ${stats.spellSuppression}%. Having partial suppression means a coinflip on every boss spell hit.`,
        impactType: 'ehp',
        estimatedImpact: `+${100 - stats.spellSuppression}% Guaranteed Damage Halving`,
        recommendation: 'Push spell suppression to 100% cap with benchcrafts, higher tier base suffixes, or the "Spell Suppression is Lucky" passive mastery.',
        ssfCraftingFix: 'Craft +7-8% Spell Suppression on open suffixes on Gloves/Boots, or take the Inveterate passive wheel on the tree.',
        tags: ['Spell Suppression', 'High Priority']
      });
    } else if (stats.spellSuppression >= 100) {
      diagnostics.push({
        id: 'optimal-spell-suppression',
        category: 'defenses',
        severity: 'optimal',
        title: '100% Spell Suppression Capped',
        description: 'All incoming spell hits are guaranteed to be suppressed, halving spell damage taken across all map and pinnacle boss encounters.',
        impactType: 'ehp',
        estimatedImpact: '50% Permanent Spell Mitigation',
        recommendation: 'Spell suppression is fully optimized.',
        ssfCraftingFix: 'No changes needed.',
        tags: ['Spell Suppression', 'Optimal']
      });
    }
  }

  // Armour & Energy Shield Bulk Evaluation (For Armour/ES builds)
  if (isArmourEsArchetype && !isEvasionSuppressionArchetype) {
    diagnostics.push({
      id: 'armour-es-bulk-optimal',
      category: 'defenses',
      severity: 'optimal',
      title: `Armour & Energy Shield Bulk (${stats.armour.toLocaleString()} Armour / ${stats.energyShield.toLocaleString()} ES)`,
      description: `Your build successfully scales high Armour mitigation (${stats.armour.toLocaleString()}) alongside an Energy Shield buffer (${stats.energyShield.toLocaleString()} ES) for extreme physical and elemental burst resilience.`,
      impactType: 'ehp',
      estimatedImpact: 'Massive Physical Slam & Spell Buffer',
      recommendation: 'Armour and ES bulk is functioning optimally.',
      ssfCraftingFix: 'No changes needed.',
      tags: ['Armour', 'Energy Shield', 'Optimal']
    });
  }

  // Physical Damage Mitigation & Conversion
  if (stats.physTakenAsEle >= 15) {
    diagnostics.push({
      id: 'phys-taken-as-ele-optimal',
      category: 'defenses',
      severity: 'optimal',
      title: `Physical Damage Shift Active (${stats.physTakenAsEle}% Taken as Elemental)`,
      description: `You are shifting ${stats.physTakenAsEle}% of incoming physical hit damage into elemental damage, allowing your high elemental resistances to mitigate lethal physical boss slams.`,
      impactType: 'ehp',
      estimatedImpact: 'Massive Physical Slam Survivability',
      recommendation: 'Physical shift layer is strong.',
      ssfCraftingFix: 'No changes needed.',
      tags: ['Phys Taken As', 'Mitigation', 'Optimal']
    });
  }

  // ==========================================
  // 2. OFFENSES & SKILL LINK EVALUATION
  // ==========================================

  const effectiveLinks = selectedGroup ? selectedGroup.effectiveLinks : stats.mainLinkCount;
  const physicalLinks = selectedGroup ? selectedGroup.physicalLinks : stats.mainLinkCount;
  const pseudoLinks = selectedGroup ? selectedGroup.pseudoLinks : 0;
  const pseudoNames = selectedGroup ? selectedGroup.pseudoSupportNames : [];

  if (effectiveLinks >= 6) {
    const isPseudoSetup = pseudoLinks > 0;
    diagnostics.push({
      id: 'optimal-6link-setup',
      category: 'offenses',
      severity: 'optimal',
      title: isPseudoSetup 
        ? `Effective ${effectiveLinks} Link Setup (${physicalLinks} Sockets + ${pseudoLinks} Gear Multipliers)`
        : '6 Link Main Damage Skill Active',
      description: isPseudoSetup
        ? `Your skill in ${selectedGroup?.slot || 'gear'} gains full 6 link scaling via built in item multipliers: ${pseudoNames.join(', ')}.`
        : 'Your main damage ability is socketed with 5 supporting multiplier gems for full damage scaling.',
      impactType: 'damage',
      estimatedImpact: 'Full Damage Multipliers Active',
      recommendation: 'Skill link setup is fully optimized.',
      ssfCraftingFix: 'No changes needed.',
      tags: ['6 Link', 'Pseudo Links', 'Optimal']
    });
  } else if (effectiveLinks === 5) {
    diagnostics.push({
      id: 'main-skill-5link',
      category: 'offenses',
      severity: 'warning',
      title: '5 Link Setup (Missing 6th Link Multiplier)',
      description: `Your selected skill (${selectedGroup?.label || 'Main Skill'}) has 5 effective links. Adding a 6th multiplier gem or an Essence of Horror / Elder pseudo mod adds an extra ~30-35% more damage multiplier.`,
      impactType: 'damage',
      estimatedImpact: '+30% to +35% More Total Damage',
      recommendation: 'Upgrade to a 6 link body armour, or roll Essence of Horror on your helmet / Elder pseudo support suffixes.',
      ssfCraftingFix: 'Farm "The Porcupine" or "The Chains that Bind" divination cards, or spam Essence of Horror on a Blizzard Crown / Hubris Circlet for 30% More Elemental Damage.',
      tags: ['6 Link', 'Damage Output']
    });
  } else {
    diagnostics.push({
      id: 'main-skill-4link',
      category: 'offenses',
      severity: 'critical',
      title: `Main Skill is on a ${effectiveLinks} Link Setup`,
      description: `Your selected skill (${selectedGroup?.label || 'Main Skill'}) only has ${effectiveLinks} effective links. Upgrading to a 5 link or 6 link setup adds massive "More Damage" multiplier supports that will increase total DPS by 30% to 75%.`,
      impactType: 'damage',
      estimatedImpact: '+35% to +75% More Total Damage',
      recommendation: 'Prioritize acquiring a 6 link body armour or craft pseudo support mods on your helmet or gloves.',
      ssfCraftingFix: 'Farm "The Porcupine" Divination Card (Gardens / Plaza maps) for a guaranteed 6 link bow, "The Chains that Bind" for a 6 link body, or spam Essences of Horror/Delirium on helmet/gloves.',
      tags: ['6 Link', 'Damage Output', 'High Priority']
    });
  }

  // Curses & Exposure - Comprehensive Detection across ALL gems and ALL item mods
  const allGems = skillGroups.flatMap((g) => g.gems);
  const allGemNames = allGems.map((g) => g.name.toLowerCase());
  const allItemText = items.map(i => `${i.rawText} ${i.implicitMods.join(' ')} ${i.eldritchMods.join(' ')} ${i.explicitMods.join(' ')}`).join(' ').toLowerCase();

  // Check Curses
  const curseGemNames = [
    'elemental weakness', 'flammability', 'frostbite', 'conductivity', 
    'despair', 'vulnerability', 'punishment', "assassin's mark", "sniper's mark", 
    "poacher's mark", "warlord's mark", 'enfeeble', 'temporal chains'
  ];
  const detectedCurseGem = curseGemNames.find(c => allGemNames.some(gName => gName.includes(c)));
  const hasCurseOnHit = /curse enemies with .* on hit/i.test(allItemText) || /triggers level \d+ .* on hit/i.test(allItemText) || /vulnerability on hit/i.test(allItemText) || /elemental weakness on hit/i.test(allItemText) || /flammability on hit/i.test(allItemText) || /despair on hit/i.test(allItemText);
  const hasCurse = !!detectedCurseGem || hasCurseOnHit;

  if (hasCurse) {
    const curseLabel = detectedCurseGem ? detectedCurseGem.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Curse on Hit';
    diagnostics.push({
      id: 'curse-detected-optimal',
      category: 'offenses',
      severity: 'optimal',
      title: `Active Curse / Debuff Active (${curseLabel})`,
      description: `Your setup includes ${curseLabel}, shredding enemy resistances by 30% to 40% against bosses and rare monster packs.`,
      impactType: 'damage',
      estimatedImpact: 'Massive Boss Resistance Reduction Active',
      recommendation: 'Curse debuff is fully online.',
      ssfCraftingFix: 'No changes needed.',
      tags: ['Curse', 'Resistance Shred', 'Optimal']
    });
  } else {
    diagnostics.push({
      id: 'missing-curse',
      category: 'offenses',
      severity: 'critical',
      title: 'No Resistance Debuff Curse or Mark Detected',
      description: 'You do not have an active damage curse (Flammability, Frostbite, Conductivity, Elemental Weakness, Despair, or Marks). Curses and Marks shred 30% to 40% monster resistances or grant huge crit multipliers against bosses.',
      impactType: 'damage',
      estimatedImpact: '+25% to +35% Net DPS against Bosses',
      recommendation: 'Socket a relevant curse gem in your utility setup or link it with Arcanist Brand / Cast when Damage Taken / Blasphemy.',
      ssfCraftingFix: 'Buy the curse gem from Lilly Roth in Act 6 and socket it into an Arcanist Brand link or use a "Curse on Hit" Delve ring.',
      tags: ['Curse', 'Resistance Shred', 'High Priority']
    });
  }

  // Check Exposure
  const exposureGemNames = ['wave of conviction', 'frost bomb', 'hydrosphere', 'corrosive elements'];
  const detectedExposureGem = exposureGemNames.find(e => allGemNames.some(gName => gName.includes(e)));
  const hasGloveExposure = /inflict (?:fire|cold|lightning|elemental) exposure on hit/i.test(allItemText) || /exposure on hit/i.test(allItemText) || /inflict exposure/i.test(allItemText);
  const isElementalistExposure = ascendClassName === 'Elementalist';
  const hasExposure = !!detectedExposureGem || hasGloveExposure || isElementalistExposure;

  if (hasExposure) {
    const exposureSource = detectedExposureGem 
      ? detectedExposureGem.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      : hasGloveExposure 
      ? 'Eldritch Glove Exposure on Hit' 
      : 'Elementalist Exposure Synergy';
    diagnostics.push({
      id: 'exposure-detected-optimal',
      category: 'offenses',
      severity: 'optimal',
      title: `Dedicated Exposure Source Active (${exposureSource})`,
      description: `Your build applies Exposure through ${exposureSource}, providing an automatic -15% to -25% resistance reduction to multiply all outgoing elemental damage.`,
      impactType: 'damage',
      estimatedImpact: '-15% to -25% Monster Resistance Shred Active',
      recommendation: 'Exposure mechanism is functioning properly.',
      ssfCraftingFix: 'No changes needed.',
      tags: ['Exposure', 'Optimal', 'Damage']
    });
  } else if (level >= 75) {
    diagnostics.push({
      id: 'missing-exposure',
      category: 'offenses',
      severity: 'warning',
      title: 'No Dedicated Exposure Source Detected',
      description: 'Your setup lacks a dedicated Exposure mechanic. Exposure applies an automatic -15% to -25% to monster elemental resistances, multiplying all outgoing damage.',
      impactType: 'damage',
      estimatedImpact: '+15% to +20% More Elemental Damage',
      recommendation: 'Incorporate Wave of Conviction, Frost Bomb, or an Eldritch Glove implicit for Exposure on hit.',
      ssfCraftingFix: 'Apply Lesser Eldritch Ichor on rare Gloves until hitting "Inflict Fire / Lightning / Cold Exposure on Hit".',
      tags: ['Exposure', 'Eldritch', 'Damage']
    });
  }

  // ==========================================
  // 3. FLASK AUDIT & UTILITY SUFFIXES
  // ==========================================

  if (flasks.length > 0) {
    const normalFlasks = flasks.filter(f => f.rarity === 'NORMAL');
    if (normalFlasks.length > 0) {
      diagnostics.push({
        id: 'unrolled-flasks',
        category: 'flasks',
        severity: 'warning',
        title: `${normalFlasks.length} Unrolled Normal Flasks Detected`,
        description: 'You have white/normal utility flasks equipped. Magic utility flasks can roll high tier suffixes like +50-60% Increased Armour, +50-55% Evasion, or 25% Reduced Mana Cost of Skills during effect.',
        impactType: 'balanced',
        estimatedImpact: '+25% Global Defense / Speed Buffs',
        recommendation: 'Upgrade all normal utility flasks to magic and roll useful prefixes and suffixes.',
        ssfCraftingFix: "Use 4x Glassblower's Baubles on normal flasks to reach 20% Quality first, then use an Orb of Transmutation and spam Orbs of Alteration until landing 'Gain 3 Charges when Hit' + a strong suffix.",
        tags: ['Flasks', 'Crafting']
      });
    }
  }

  // ==========================================
  // 4. CHROMATIC ADVICE FOR MAIN SKILL SLOT
  // ==========================================

  let chromaticAdvice: ChromaticAdvice | undefined;
  if (selectedGroup && selectedGroup.slot) {
    const targetItem = items.find(i => i.slot.toLowerCase() === selectedGroup.slot?.toLowerCase());
    if (targetItem) {
      const redCount = selectedGroup.gems.filter(g => g.color === 'R').length;
      const greenCount = selectedGroup.gems.filter(g => g.color === 'G').length;
      const blueCount = selectedGroup.gems.filter(g => g.color === 'B').length;
      const whiteCount = selectedGroup.gems.filter(g => g.color === 'W').length;

      const reqStr = targetItem.reqStr || 0;
      const reqDex = targetItem.reqDex || 0;
      const reqInt = targetItem.reqInt || 0;

      let difficulty: 'Easy' | 'Moderate' | 'Difficult' | 'Extreme' = 'Easy';
      let recommendedMethod = 'Use standard Chromatic Orbs directly on the item.';
      let voriciBenchCost: string | undefined;
      let avgChromatics = 15;

      const isStrBase = reqStr > reqDex && reqStr > reqInt && reqStr >= 100;
      const isIntBase = reqInt > reqStr && reqInt > reqDex && reqInt >= 100;
      const isDexBase = reqDex > reqStr && reqDex > reqInt && reqDex >= 100;

      if (isIntBase && (redCount >= 3 || greenCount >= 3)) {
        difficulty = 'Difficult';
        recommendedMethod = 'Crafting Bench: Use "At least 2 Red" (25 Chromatics) or use the 1-2-3-4 Socket Crafting Bench trick.';
        voriciBenchCost = '25 Chromatics + 5 Vaal (if corrupted)';
        avgChromatics = 180;
      } else if (isStrBase && (blueCount >= 3 || greenCount >= 3)) {
        difficulty = 'Difficult';
        recommendedMethod = 'Crafting Bench: Use "At least 2 Blue" (25 Chromatics) or "At least 3 Blue" (120 Chromatics).';
        voriciBenchCost = '25 - 120 Chromatic Orbs';
        avgChromatics = 220;
      } else if (isDexBase && (redCount >= 3 || blueCount >= 3)) {
        difficulty = 'Difficult';
        recommendedMethod = 'Crafting Bench: Use "At least 2 Red" (25 Chromatics) to force off colors safely.';
        voriciBenchCost = '25 Chromatics';
        avgChromatics = 160;
      }

      chromaticAdvice = {
        slot: selectedGroup.slot,
        baseName: targetItem.name || targetItem.baseName,
        reqStr,
        reqDex,
        reqInt,
        desiredColors: { R: redCount, G: greenCount, B: blueCount, W: whiteCount },
        difficulty,
        recommendedMethod,
        voriciBenchCost,
        avgChromatics
      };
    }
  }

  // ==========================================
  // 5. SCORING & COMPILATION
  // ==========================================

  let ehpScore = 88;
  let dpsScore = 85;

  if (minEleRes < 75) ehpScore -= 30;
  if (stats.chaosRes < 0) ehpScore -= 20;
  else if (stats.chaosRes < 30) ehpScore -= 6;
  else if (stats.chaosRes >= 60) ehpScore += 10;

  if (isBlockArchetype) ehpScore += 12;
  if (isArmourEsArchetype) ehpScore += 10;
  if (stats.physTakenAsEle >= 15) ehpScore += 8;

  if (effectiveLinks >= 6) dpsScore += 15;
  else if (effectiveLinks === 5) dpsScore -= 8;
  else dpsScore -= 25;

  if (hasCurse) dpsScore += 10;
  else dpsScore -= 18;

  if (hasExposure) dpsScore += 8;
  else dpsScore -= 10;

  ehpScore = Math.max(30, Math.min(100, ehpScore));
  dpsScore = Math.max(30, Math.min(100, dpsScore));
  const overallScore = Math.round(ehpScore * 0.55 + dpsScore * 0.45);

  let grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F' = 'B';
  if (overallScore >= 90) grade = 'S';
  else if (overallScore >= 80) grade = 'A';
  else if (overallScore >= 70) grade = 'B';
  else if (overallScore >= 55) grade = 'C';
  else if (overallScore >= 45) grade = 'D';
  else grade = 'F';

  const damageUpgrades = diagnostics.filter((d) => d.severity !== 'optimal' && (d.impactType === 'damage' || d.category === 'offenses' || d.category === 'gems'));
  const ehpUpgrades = diagnostics.filter((d) => d.severity !== 'optimal' && (d.impactType === 'ehp' || d.category === 'defenses'));
  const optimalBadges = diagnostics.filter((d) => d.severity === 'optimal');

  let summary = `Character classified under "${defenseArchetype}" with Grade ${grade} (${overallScore}/100). `;
  if (effectiveLinks >= 6 && (pseudoLinks > 0)) {
    summary += `Recognized effective 6 link setup utilizing ${pseudoLinks} gear pseudo support multiplier(s). `;
  }
  if (isBlockArchetype) {
    summary += 'Active block recovery engine protects your hit pool through dense monster hits. ';
  }
  if (hasCurse && hasExposure) {
    summary += 'Full debuff suite active with dedicated Curse and Exposure shredding boss resistances. ';
  }

  return {
    ehpScore,
    dpsScore,
    overallScore,
    grade,
    defenseArchetype,
    summary,
    diagnostics,
    damageUpgrades,
    ehpUpgrades,
    optimalBadges,
    chromaticAdvice
  };
}
