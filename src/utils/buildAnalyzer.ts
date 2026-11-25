import type {
  ParsedCharacter,
  DiagnosticItem,
  AnalysisReport,
  ChromaticAdvice,
  ParsedSkillGroup
} from '../types/analyzer';

function fmtCompact(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(Math.round(n));
}

export function analyzeBuild(char: ParsedCharacter, activeGroupId?: string): AnalysisReport {
  const {
    stats,
    config,
    activeAuras = [],
    guardSkills = [],
    skillGroups,
    items,
    flasks,
    level,
    ascendClassName,
    className,
    keystones = [],
    dataSource
  } = char;
  const diagnostics: DiagnosticItem[] = [];
  const isCI = keystones.includes('Chaos Inoculation') || (stats.life === 1 && stats.energyShield >= 200);
  const isPobSource = dataSource === 'pob';

  const targetGroupId = activeGroupId || char.selectedSkillGroupId;
  const selectedGroup: ParsedSkillGroup | undefined =
    skillGroups.find((g) => g.id === targetGroupId) ||
    skillGroups.find((g) => g.isMain) ||
    skillGroups[0];

  // Classify Defensive Archetype
  const isBlockArchetype =
    stats.block >= 40 || stats.spellBlock >= 30 || stats.hasLifeOnBlock || stats.hasEsOnBlock || stats.hasGlancingBlows;
  const isArmourEsArchetype =
    (stats.armour >= 8000 && stats.energyShield >= 500) || stats.armour >= 15000 || isCI;
  const isPhysConversionArchetype = stats.physTakenAsEle >= 15;
  const isEvasionSuppressionArchetype =
    (stats.evasion >= 12000 && stats.armour < 6000) ||
    (['Ranger', 'Shadow'].includes(className) && !isBlockArchetype && !isArmourEsArchetype && !isCI);

  let defenseArchetype = 'Hybrid Defense';
  if (isCI) {
    defenseArchetype = 'Chaos Inoculation Energy Shield';
  } else if (isBlockArchetype) {
    defenseArchetype = 'Block & Recovery on Block Tank';
  } else if (isPhysConversionArchetype) {
    defenseArchetype = 'Physical Damage Shift & Max Res Tank';
  } else if (isEvasionSuppressionArchetype) {
    defenseArchetype = 'Evasion & Spell Suppression';
  } else if (isArmourEsArchetype) {
    defenseArchetype = 'Armour & Energy Shield Bulk';
  }

  // ==========================================
  // 1. DEFENSES, POOL, MAX HITS, AURAS & CHARGES
  // ==========================================

  // Effective Life + ES Pool
  const effectivePool = isCI ? stats.energyShield : stats.life + stats.energyShield;
  const targetPool = isCI
    ? level >= 90 ? 6500 : level >= 80 ? 5000 : 3500
    : level >= 90 ? 4500 : level >= 80 ? 3800 : 2800;

  if (effectivePool > 0 && effectivePool < targetPool * 0.78) {
    diagnostics.push({
      id: 'low-hp-pool',
      category: 'defenses',
      severity: 'critical',
      title: isCI
        ? `Low Energy Shield Pool (${stats.energyShield.toLocaleString()} ES at Lv ${level})`
        : `Low Life / ES Pool (${stats.life.toLocaleString()} Life + ${stats.energyShield.toLocaleString()} ES at Lv ${level})`,
      description: `Your combined hit pool (${effectivePool.toLocaleString()}) is well below the recommended ~${targetPool.toLocaleString()} baseline for Level ${level}. Even capped resistances cannot prevent one-shots with a thin base pool.`,
      impactType: 'ehp',
      estimatedImpact: '+25% to +45% Total EHP & Max Hit',
      recommendation: isCI
        ? 'Prioritize high flat ES bases (Twilight Regalia / Lich Circlet / Titanium Spirit Shield) and % increased ES wheels on the tree.'
        : 'Prioritize T1-T2 flat Maximum Life on every rare armour/jewelry slot and allocate at least 130%+ increased Maximum Life on the passive tree.',
      ssfCraftingFix: isCI
        ? 'Use Dense Fossils or Essence of Woe on ilvl 84+ ES bases and craft % increased Energy Shield at the Bench.'
        : 'Use Shrieking Essence of Greed or Harvest Reforge Life on ilvl 84+ bases, and take the +50 Maximum Life / 15% increased Maximum Life (no life mods on body) Life Mastery.',
      tags: ['Life Pool', 'EHP', 'High Priority']
    });
  } else if (effectivePool >= targetPool) {
    diagnostics.push({
      id: 'healthy-hp-pool',
      category: 'defenses',
      severity: 'optimal',
      title: isCI
        ? `Strong CI Energy Shield Pool (${stats.energyShield.toLocaleString()} ES)`
        : `Healthy Hit Pool (${stats.life.toLocaleString()} Life${stats.energyShield > 0 ? ` / ${stats.energyShield.toLocaleString()} ES` : ''})`,
      description: `Your base hit pool (${effectivePool.toLocaleString()}) meets or exceeds the Level ${level} target (${targetPool.toLocaleString()}).`,
      impactType: 'ehp',
      estimatedImpact: 'Solid Base Hit Pool Secured',
      recommendation: 'Base hit pool is on track.',
      ssfCraftingFix: 'No changes needed.',
      tags: ['Life Pool', 'Optimal']
    });
  }

  // Real PoB Physical Max Hit Audit
  if (isPobSource && stats.physMaxHit > 0) {
    const targetPhysMaxHit = level >= 90 ? 12000 : 8500;
    if (stats.physMaxHit < targetPhysMaxHit) {
      diagnostics.push({
        id: 'low-phys-max-hit',
        category: 'defenses',
        severity: stats.physMaxHit < 7000 ? 'critical' : 'warning',
        title: `Low Physical Max Hit (${fmtCompact(stats.physMaxHit)})`,
        description: `Path of Building reports a Physical Max Hit of ${fmtCompact(stats.physMaxHit)}. Red map rares and pinnacle slams easily exceed 10k-14k physical damage unless mitigated by Endurance Charges, Phys Taken As Elemental, Fortify, or Armour + Guard Skill.`,
        impactType: 'ehp',
        estimatedImpact: '+30% to +70% Physical Slam Survival',
        recommendation: 'Add Endurance Charge generation, "Physical Damage taken as Fire/Cold/Lightning" on Helmet/Body, Determination, or an automated Guard Skill.',
        ssfCraftingFix: 'Roll Eldritch implicit + Bench craft "Physical Damage from Hits taken as Fire/Lightning" on your Helmet and Body Armour, or run Enduring Cry / Ralakesh / Endurance Charge on Kill.',
        tags: ['Phys Max Hit', 'Endurance Charges', 'EHP']
      });
    } else {
      diagnostics.push({
        id: 'strong-phys-max-hit',
        category: 'defenses',
        severity: 'optimal',
        title: `Strong Physical Max Hit (${fmtCompact(stats.physMaxHit)})`,
        description: `Your Physical Max Hit (${fmtCompact(stats.physMaxHit)}) can comfortably absorb heavy endgame physical slams.`,
        impactType: 'ehp',
        estimatedImpact: 'Physical Mitigation Verified',
        recommendation: 'Physical mitigation is well layered.',
        ssfCraftingFix: 'No changes needed.',
        tags: ['Phys Max Hit', 'Optimal']
      });
    }
  }

  // Elemental Resistances
  const minEleRes = Math.min(stats.fireRes, stats.coldRes, stats.lightningRes);
  if (minEleRes < 75) {
    diagnostics.push({
      id: 'uncapped-ele-res',
      category: 'defenses',
      severity: 'critical',
      title: `Uncapped Elemental Resistances (${stats.fireRes}/${stats.coldRes}/${stats.lightningRes})`,
      description: `Your lowest elemental resistance is ${minEleRes}% (Fire ${stats.fireRes}%, Cold ${stats.coldRes}%, Lightning ${stats.lightningRes}%). Every 1% below 75% dramatically increases elemental hit damage taken.`,
      impactType: 'ehp',
      estimatedImpact: '+40% to +80% Elemental EHP',
      recommendation: 'Cap Fire, Cold, and Lightning resistances to at least 75% immediately (or run Purity of Elements while upgrading gear).',
      ssfCraftingFix: 'Use Harvest "Change Resistance" (500 Lifeforce) to rebalance excess resistances or benchcraft dual-res suffixes on rings, boots, and belts.',
      tags: ['Resistances', 'High Priority', 'Mitigation']
    });
  } else {
    const minOverCap = Math.min(stats.fireResOverCap, stats.coldResOverCap, stats.lightningResOverCap);
    if (isPobSource && minOverCap < 20 && level >= 75) {
      diagnostics.push({
        id: 'low-ele-overcap',
        category: 'defenses',
        severity: 'warning',
        title: `Low Elemental Overcap Buffer (+${minOverCap}%)`,
        description: `Your lowest elemental overcap is +${minOverCap}%. Elemental Weakness map curses and monster Exposure can drop you below cap mid-fight.`,
        impactType: 'ehp',
        estimatedImpact: '+15% Buffer vs Cursed Maps & Exposure',
        recommendation: 'Aim for +25% to +35% overcap or curse immunity / reduced curse effect.',
        ssfCraftingFix: 'Roll Two-Stone Rings or benchcraft hybrid resistance suffixes on open gear slots.',
        tags: ['Overcap', 'Map Curses']
      });
    } else {
      diagnostics.push({
        id: 'optimal-ele-res',
        category: 'defenses',
        severity: 'optimal',
        title: `Elemental Resistances Capped (${stats.fireRes}/${stats.coldRes}/${stats.lightningRes})`,
        description: `Fire (${stats.fireRes}% / max ${stats.maxFireRes}%), Cold (${stats.coldRes}% / max ${stats.maxColdRes}%), and Lightning (${stats.lightningRes}% / max ${stats.maxLightningRes}%) are capped.`,
        impactType: 'ehp',
        estimatedImpact: 'Elemental Baseline Secured',
        recommendation: 'Resistances are in great shape.',
        ssfCraftingFix: 'No changes needed.',
        tags: ['Resistances', 'Optimal']
      });
    }
  }

  // Chaos Resistance
  if (!isCI) {
    if (stats.chaosRes < 0) {
      diagnostics.push({
        id: 'negative-chaos-res',
        category: 'defenses',
        severity: 'critical',
        title: `Negative Chaos Resistance (${stats.chaosRes}%)`,
        description: `Your Chaos Resistance is ${stats.chaosRes}%. Chaos hits, poison, and caustic ground bypass Energy Shield and deal massive amplified damage below 0%.`,
        impactType: 'ehp',
        estimatedImpact: '+35% to +60% Chaos Survivability',
        recommendation: 'Reach at least 0% Chaos Res for yellow maps and +30% to +75% for red maps and T17s.',
        ssfCraftingFix: 'Spam Shrieking Essence of Envy on Amethyst Rings or use Harvest "Reforge Chaos" on shields, boots, and helmets.',
        tags: ['Chaos Res', 'EHP', 'High Priority']
      });
    } else if (stats.chaosRes < 30 && level >= 85) {
      diagnostics.push({
        id: 'suboptimal-chaos-res',
        category: 'defenses',
        severity: 'warning',
        title: `Chaos Resistance Below 30% (${stats.chaosRes}%)`,
        description: `Chaos Resistance is positive at ${stats.chaosRes}%, but still vulnerable in T16/T17 chaos-heavy maps.`,
        impactType: 'ehp',
        estimatedImpact: '+20% Chaos Max Hit',
        recommendation: 'Add an Amethyst Ring with an Essence of Envy suffix or hybrid Chaos Res benchcraft.',
        ssfCraftingFix: 'Craft +16-20% Chaos/Elemental hybrid resistance on open jewelry suffixes.',
        tags: ['Chaos Res', 'Endgame']
      });
    } else if (stats.chaosRes >= 60) {
      diagnostics.push({
        id: 'optimal-chaos-res',
        category: 'defenses',
        severity: 'optimal',
        title: `Chaos Resistance High / Capped (${stats.chaosRes}%)`,
        description: `Chaos Resistance at ${stats.chaosRes}% strongly mitigates poison, toxic volatiles, and chaos hits.`,
        impactType: 'ehp',
        estimatedImpact: 'Chaos Protection Active',
        recommendation: 'Chaos resistance is endgame ready.',
        ssfCraftingFix: 'No changes needed.',
        tags: ['Chaos Res', 'Optimal']
      });
    }
  } else {
    diagnostics.push({
      id: 'ci-immune',
      category: 'defenses',
      severity: 'optimal',
      title: 'Chaos Inoculation Active (100% Chaos Immune)',
      description: 'Chaos Inoculation grants complete immunity to all chaos hits and poison.',
      impactType: 'ehp',
      estimatedImpact: 'Total Chaos Immunity',
      recommendation: 'Focus on ES pool, stun/ailment immunity, and phys mitigation.',
      ssfCraftingFix: 'No changes needed.',
      tags: ['Chaos Inoculation', 'Optimal']
    });
  }

  // Active Auras & Guard Skill Audit
  const defensiveAuraList = [
    'Determination',
    'Grace',
    'Discipline',
    'Purity of Elements',
    'Purity of Fire',
    'Purity of Ice',
    'Purity of Lightning',
    'Tempest Shield',
    'Petrified Blood',
    'Arctic Armour',
    'Flesh and Stone',
    'Defiance Banner'
  ];
  const activeDefensiveAuras = activeAuras.filter((a) => defensiveAuraList.includes(a));

  if (activeDefensiveAuras.length === 0 && level >= 70) {
    diagnostics.push({
      id: 'no-defensive-aura',
      category: 'defenses',
      severity: 'warning',
      title: 'No Defensive Aura Detected',
      description: `Detected ${activeAuras.length} active aura(s) (${activeAuras.join(', ') || 'None'}), but no dedicated defensive aura (Determination, Grace, Discipline, Purity of Elements, Tempest Shield, Flesh and Stone, or Arctic Armour).`,
      impactType: 'ehp',
      estimatedImpact: '+20% to +40% Effective Hit Pool',
      recommendation: 'Reserve at least one defensive aura matched to your archetype (Determination for Armour, Grace for Evasion, Discipline for ES, or Purity of Elements for ailment immunity).',
      ssfCraftingFix: 'Take a Mana Reservation Efficiency wheel + Mastery (12% Reservation Efficiency) to fit a defensive aura alongside your damage aura.',
      tags: ['Auras', 'Reservation', 'EHP']
    });
  } else if (activeAuras.length > 0) {
    diagnostics.push({
      id: 'auras-tracked-optimal',
      category: 'defenses',
      severity: 'optimal',
      title: `${activeAuras.length} Active Aura / Reservation Buff(s) Tracked`,
      description: `Active reservations: ${activeAuras.join(', ')}.`,
      impactType: 'balanced',
      estimatedImpact: 'Aura Suite Online',
      recommendation: 'Keep mana reservation efficiency balanced so main skill casting stays smooth.',
      ssfCraftingFix: 'No changes needed.',
      tags: ['Auras', 'Optimal']
    });
  }

  if (guardSkills.length === 0 && level >= 75) {
    diagnostics.push({
      id: 'missing-guard-skill',
      category: 'defenses',
      severity: 'warning',
      title: 'No Guard Skill Detected',
      description: 'No Guard Skill (Molten Shell, Steelskin, Immortal Call, or Arcane Cloak) was found in your enabled gem setups. Automated Guard Skills absorb thousands of burst damage.',
      impactType: 'ehp',
      estimatedImpact: '+15% to +30% Burst Survival',
      recommendation: stats.armour >= 10000
        ? 'Link Molten Shell with Automation or Cast when Damage Taken.'
        : 'Link Steelskin or Immortal Call with Automation or Cast when Damage Taken.',
      ssfCraftingFix: 'Purchase Automation + Molten Shell / Steelskin / Immortal Call from Lilly Roth in Act 6.',
      tags: ['Guard Skill', 'Burst Mitigation']
    });
  }

  // Charges & Fortify (when PoB Config is available)
  if (isPobSource) {
    const activeChargeSummary: string[] = [];
    if (config.enduranceCharges > 0) activeChargeSummary.push(`${config.enduranceCharges}/${config.maxEnduranceCharges} Endurance`);
    if (config.frenzyCharges > 0) activeChargeSummary.push(`${config.frenzyCharges}/${config.maxFrenzyCharges} Frenzy`);
    if (config.powerCharges > 0) activeChargeSummary.push(`${config.powerCharges}/${config.maxPowerCharges} Power`);
    if (config.fortify) activeChargeSummary.push('Fortify');

    if (activeChargeSummary.length > 0) {
      diagnostics.push({
        id: 'charges-tracked-optimal',
        category: 'defenses',
        severity: 'optimal',
        title: `Active Charges & Buffs (${activeChargeSummary.join(' • ')})`,
        description: `PoB Config includes ${activeChargeSummary.join(', ')}${config.enemyIsBoss !== 'None' ? ` against ${config.enemyIsBoss} preset` : ''}${config.flasksActive ? ' (with Flasks toggled ON)' : ''}.`,
        impactType: 'balanced',
        estimatedImpact: 'Config Buffs Verified',
        recommendation: 'Verify your character can reliably sustain these charges in boss fights without PoB padding.',
        ssfCraftingFix: 'No changes needed.',
        tags: ['Charges', 'PoB Config', 'Optimal']
      });
    } else if (level >= 85 && stats.physMaxHit > 0 && stats.physMaxHit < 12000) {
      diagnostics.push({
        id: 'no-endurance-charges',
        category: 'defenses',
        severity: 'warning',
        title: 'No Endurance Charges Active in PoB Config',
        description: `Endurance Charges grant 4% Physical AND 4% Elemental Damage Reduction per charge (12%+ DR at 3 charges). None are enabled in your active PoB Config.`,
        impactType: 'ehp',
        estimatedImpact: '+14% to +25% Phys & Ele Max Hit',
        recommendation: 'Add Enduring Composure (Small Cluster), Enduring Cry, Disciple of the Unyielding, or Eldritch Body implicit "Gain an Endurance Charge every X seconds".',
        ssfCraftingFix: 'Roll Lesser Eldritch Ember on your Body Armour for "Gain an Endurance Charge every 15 seconds" for permanent mapping & boss uptime.',
        tags: ['Endurance Charges', 'Mitigation']
      });
    }
  }

  // Block & Spell Suppression
  if (isBlockArchetype) {
    diagnostics.push({
      id: 'block-recovery-optimal',
      category: 'defenses',
      severity: 'optimal',
      title: `Block Layer Active (${stats.block}% Attack / ${stats.spellBlock}% Spell Block)`,
      description: `High block mitigation (${stats.block}% Attack, ${stats.spellBlock}% Spell)${stats.hasLifeOnBlock || stats.hasEsOnBlock ? ' paired with Recovery on Block' : ''} strongly protects against multi-hit packs.`,
      impactType: 'ehp',
      estimatedImpact: 'High Multi Hit Mitigation',
      recommendation: 'Keep Tempest Shield active and pair Glancing Blows with Recovery on Block.',
      ssfCraftingFix: 'No changes needed.',
      tags: ['Block', 'Optimal']
    });
  }

  if (isEvasionSuppressionArchetype) {
    if (stats.spellSuppression < 100 && level >= 75) {
      diagnostics.push({
        id: 'uncapped-spell-suppression',
        category: 'defenses',
        severity: stats.spellSuppression === 0 ? 'warning' : 'warning',
        title: stats.spellSuppression === 0 ? 'Zero Spell Suppression Chance' : `Uncapped Spell Suppression (${stats.spellSuppression}%)`,
        description: `Spell Suppression is at ${stats.spellSuppression}%. Reaching 100% guarantees 50% less spell damage taken on every boss spell hit.`,
        impactType: 'ehp',
        estimatedImpact: `+${Math.max(10, 100 - stats.spellSuppression)}% Guaranteed Spell Mitigation`,
        recommendation: 'Push Spell Suppression to 100% via ilvl 84+ Evasion gear suffixes, Inveterate wheel, or the Lucky Suppression mastery.',
        ssfCraftingFix: 'Rog-craft or Harvest Reforge Defense on ilvl 84+ Evasion Gloves, Boots, and Helmet.',
        tags: ['Spell Suppression', 'Mitigation']
      });
    } else if (stats.spellSuppression >= 100) {
      diagnostics.push({
        id: 'optimal-spell-suppression',
        category: 'defenses',
        severity: 'optimal',
        title: '100% Spell Suppression Capped',
        description: 'All incoming spell hits are guaranteed suppressed (50% less spell damage taken).',
        impactType: 'ehp',
        estimatedImpact: '50% Permanent Spell Mitigation',
        recommendation: 'Spell suppression is capped.',
        ssfCraftingFix: 'No changes needed.',
        tags: ['Spell Suppression', 'Optimal']
      });
    }
  }

  // ==========================================
  // 2. OFFENSES, REAL DPS, LINKS & DEBUFFS
  // ==========================================

  const effectiveDps = Math.max(stats.fullDPS, stats.totalDPS, stats.minionDPS, stats.dotDPS);
  if (isPobSource && effectiveDps > 0) {
    const isBossPreset = /pinnacle|guardian|uber|sirus|shaper/i.test(config.enemyIsBoss);
    const targetDps = level >= 92 ? (isBossPreset ? 2_000_000 : 3_000_000) : level >= 85 ? 1_000_000 : 400_000;
    if (effectiveDps < targetDps * 0.5) {
      diagnostics.push({
        id: 'low-real-dps',
        category: 'offenses',
        severity: 'warning',
        title: `Low Calculated DPS (${fmtCompact(effectiveDps)} at Lv ${level})`,
        description: `PoB reports ${fmtCompact(effectiveDps)} DPS${isBossPreset ? ` (${config.enemyIsBoss} preset)` : ''}. At Level ${level}, target ~${fmtCompact(targetDps)}+ DPS for smooth T16s and Pinnacle bosses.`,
        impactType: 'damage',
        estimatedImpact: 'Faster Boss Kills & Safer Fights',
        recommendation: 'Check main skill gem level (20/20 or 21/20), 6th link support, weapon/wand upgrade, Curse + Exposure, and offensive Aura uptime.',
        ssfCraftingFix: 'Level 6 copies of your main skill gem in your weapon swap to Vaal for Lv 21, and craft a +1/+2 weapon or high-pDPS base via Essences/Rog.',
        tags: ['DPS', 'Scaling', 'Offenses']
      });
    } else if (effectiveDps >= targetDps) {
      diagnostics.push({
        id: 'strong-real-dps',
        category: 'offenses',
        severity: 'optimal',
        title: `Strong Endgame DPS (${fmtCompact(effectiveDps)})`,
        description: `PoB reports ${fmtCompact(effectiveDps)} DPS${isBossPreset ? ` (${config.enemyIsBoss} preset)` : ''}, exceeding the Level ${level} benchmark (${fmtCompact(targetDps)}).`,
        impactType: 'damage',
        estimatedImpact: 'Endgame Damage Verified',
        recommendation: 'Damage output is strong — prioritize EHP and quality of life.',
        ssfCraftingFix: 'No changes needed.',
        tags: ['DPS', 'Optimal']
      });
    }
  }

  const effectiveLinks = selectedGroup ? selectedGroup.effectiveLinks : stats.mainLinkCount;
  const physicalLinks = selectedGroup ? selectedGroup.physicalLinks : stats.mainLinkCount;
  const pseudoLinks = selectedGroup ? selectedGroup.pseudoLinks : 0;
  const pseudoNames = selectedGroup ? selectedGroup.pseudoSupportNames : [];

  if (effectiveLinks >= 6) {
    diagnostics.push({
      id: 'optimal-6link-setup',
      category: 'offenses',
      severity: 'optimal',
      title:
        pseudoLinks > 0
          ? `Effective ${effectiveLinks} Link Setup (${physicalLinks} Sockets + ${pseudoLinks} Gear Multipliers)`
          : '6 Link Main Damage Skill Active',
      description:
        pseudoLinks > 0
          ? `Your skill in ${selectedGroup?.slot || 'gear'} gains full scaling via built in item multipliers: ${pseudoNames.join(', ')}.`
          : 'Your main damage ability is socketed with 5 supporting multiplier gems.',
      impactType: 'damage',
      estimatedImpact: 'Full Damage Multipliers Active',
      recommendation: 'Skill link setup is optimized.',
      ssfCraftingFix: 'No changes needed.',
      tags: ['6 Link', 'Optimal']
    });
  } else if (effectiveLinks === 5) {
    diagnostics.push({
      id: 'main-skill-5link',
      category: 'offenses',
      severity: 'warning',
      title: '5 Link Setup (Missing 6th Link Multiplier)',
      description: `Your selected skill (${selectedGroup?.label || 'Main Skill'}) has 5 effective links. Adding a 6th support gem adds ~30-35% more damage.`,
      impactType: 'damage',
      estimatedImpact: '+30% to +35% More Total Damage',
      recommendation: 'Upgrade to a 6 link body armour or craft Essence/Elder pseudo support mods.',
      ssfCraftingFix: 'Farm "The Chains that Bind" or "The Porcupine" divination cards, or use Black Morrigan Beastcraft 6-link.',
      tags: ['6 Link', 'Damage Output']
    });
  } else {
    diagnostics.push({
      id: 'main-skill-4link',
      category: 'offenses',
      severity: 'critical',
      title: `Main Skill is on a ${effectiveLinks} Link Setup`,
      description: `Your selected skill (${selectedGroup?.label || 'Main Skill'}) only has ${effectiveLinks} effective links. Upgrading to a 5 or 6 link adds +35% to +75% more DPS.`,
      impactType: 'damage',
      estimatedImpact: '+35% to +75% More Total Damage',
      recommendation: 'Prioritize a 5-link or 6-link body armour immediately.',
      ssfCraftingFix: 'Use Corrupted 6-links from Vaal side areas/Strongboxes or farm "The Chains that Bind".',
      tags: ['6 Link', 'High Priority']
    });
  }

  // Curses & Exposure
  const allGems = skillGroups.filter((g) => g.enabled).flatMap((g) => g.gems.filter((gm) => gm.enabled));
  const allGemNames = allGems.map((g) => g.name.toLowerCase());
  const allItemText = items
    .map((i) => `${i.rawText} ${i.implicitMods.join(' ')} ${i.eldritchMods.join(' ')} ${i.explicitMods.join(' ')}`)
    .join(' ')
    .toLowerCase();

  const curseGemNames = [
    'elemental weakness', 'flammability', 'frostbite', 'conductivity',
    'despair', 'vulnerability', 'punishment', "assassin's mark", "sniper's mark",
    "poacher's mark", "warlord's mark", 'enfeeble', 'temporal chains', 'alchemist\'s mark'
  ];
  const detectedCurseGem = curseGemNames.find((c) => allGemNames.some((gName) => gName.includes(c)));
  const hasCurseOnHit = /curse enemies with .* on hit|vulnerability on hit|elemental weakness on hit|flammability on hit|despair on hit|frostbite on hit|conductivity on hit/i.test(allItemText);
  const hasCurse = Boolean(detectedCurseGem || hasCurseOnHit);

  if (hasCurse) {
    const curseLabel = detectedCurseGem
      ? detectedCurseGem.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      : 'Curse on Hit';
    diagnostics.push({
      id: 'curse-detected-optimal',
      category: 'offenses',
      severity: 'optimal',
      title: `Active Curse / Mark (${curseLabel})`,
      description: `Your setup applies ${curseLabel}, shredding boss resistances or amplifying single-target damage.`,
      impactType: 'damage',
      estimatedImpact: 'Boss Debuff Active',
      recommendation: 'Curse setup is online.',
      ssfCraftingFix: 'No changes needed.',
      tags: ['Curse', 'Optimal']
    });
  } else {
    diagnostics.push({
      id: 'missing-curse',
      category: 'offenses',
      severity: 'critical',
      title: 'No Damage Curse or Mark Detected',
      description: 'No active Curse (Flammability, Frostbite, Conductivity, Elemental Weakness, Despair, Vulnerability) or Mark was found in your enabled gems or gear.',
      impactType: 'damage',
      estimatedImpact: '+25% to +35% Boss DPS',
      recommendation: 'Socket a matching Curse or Mark (linked to Arcanist Brand, Mark on Hit, or Hextouch).',
      ssfCraftingFix: 'Buy the curse or mark gem from Lilly Roth in Act 6.',
      tags: ['Curse', 'High Priority']
    });
  }

  const exposureGemNames = ['wave of conviction', 'frost bomb', 'hydrosphere', 'corrosive elements'];
  const detectedExposureGem = exposureGemNames.find((e) => allGemNames.some((gName) => gName.includes(e)));
  const hasGloveExposure = /inflict (?:fire|cold|lightning|elemental) exposure on hit|exposure on hit/i.test(allItemText);
  const hasExposure = Boolean(detectedExposureGem || hasGloveExposure || ascendClassName === 'Elementalist');

  if (hasExposure) {
    const exposureSource = detectedExposureGem
      ? detectedExposureGem.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      : hasGloveExposure
      ? 'Eldritch Glove Exposure'
      : 'Elementalist Exposure';
    diagnostics.push({
      id: 'exposure-detected-optimal',
      category: 'offenses',
      severity: 'optimal',
      title: `Exposure Active (${exposureSource})`,
      description: `Your build applies elemental Exposure via ${exposureSource}.`,
      impactType: 'damage',
      estimatedImpact: '-15% to -25% Enemy Ele Res',
      recommendation: 'Exposure is active.',
      ssfCraftingFix: 'No changes needed.',
      tags: ['Exposure', 'Optimal']
    });
  } else if (level >= 75 && !allGemNames.some((g) => g.includes('brutality') || g.includes('despair') || g.includes('poison'))) {
    diagnostics.push({
      id: 'missing-exposure',
      category: 'offenses',
      severity: 'warning',
      title: 'No Elemental Exposure Source Detected',
      description: 'If your build deals elemental damage, adding Exposure provides an easy -10% to -25% monster resistance shred.',
      impactType: 'damage',
      estimatedImpact: '+12% to +20% Elemental DPS',
      recommendation: 'Add Wave of Conviction, Frost Bomb, or an Eldritch Glove implicit for Exposure on Hit.',
      ssfCraftingFix: 'Apply Lesser Eldritch Ichor to rare Gloves until hitting Exposure on Hit.',
      tags: ['Exposure', 'Eldritch']
    });
  }

  // Flask Audit
  if (flasks.length > 0) {
    const normalFlasks = flasks.filter((f) => f.rarity === 'NORMAL');
    if (normalFlasks.length > 0) {
      diagnostics.push({
        id: 'unrolled-flasks',
        category: 'flasks',
        severity: 'warning',
        title: `${normalFlasks.length} Unrolled Normal Flask(s) Detected`,
        description: 'White utility flasks miss huge prefixes (Gain Charges when Hit) and suffixes (+50% Armour/Evasion, Reduced Curse Effect, Movement Speed).',
        impactType: 'balanced',
        estimatedImpact: '+20% to +35% Defense & Speed',
        recommendation: 'Transmute and Alteration-roll all utility flasks with "Used when Charges reach full" Instilling Orb enchants.',
        ssfCraftingFix: 'Use Glassblower Baubles to 20% quality, then Transmute + Alt roll.',
        tags: ['Flasks', 'Crafting']
      });
    }
  }

  // Chromatic Advice
  let chromaticAdvice: ChromaticAdvice | undefined;
  if (selectedGroup && selectedGroup.slot) {
    const targetItem = items.find((i) => i.slot.toLowerCase() === selectedGroup.slot?.toLowerCase());
    if (targetItem) {
      const redCount = selectedGroup.gems.filter((g) => g.color === 'R').length;
      const greenCount = selectedGroup.gems.filter((g) => g.color === 'G').length;
      const blueCount = selectedGroup.gems.filter((g) => g.color === 'B').length;
      const whiteCount = selectedGroup.gems.filter((g) => g.color === 'W').length;

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
        recommendedMethod = 'Crafting Bench: Use "At least 2 Red/Green" (25 Chromatics) or the Jeweller socket trick.';
        voriciBenchCost = '25 Chromatics';
        avgChromatics = 180;
      } else if (isStrBase && (blueCount >= 3 || greenCount >= 3)) {
        difficulty = 'Difficult';
        recommendedMethod = 'Crafting Bench: Use "At least 2 Blue/Green" (25 Chromatics) or "At least 3" (120 Chromatics).';
        voriciBenchCost = '25 - 120 Chromatics';
        avgChromatics = 220;
      } else if (isDexBase && (redCount >= 3 || blueCount >= 3)) {
        difficulty = 'Difficult';
        recommendedMethod = 'Crafting Bench: Use "At least 2 Red/Blue" (25 Chromatics) to force off-colors safely.';
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
  // 5. REAL METRIC-BASED SCORING
  // ==========================================

  let ehpScore = 50;
  // Base pool contribution (up to +20)
  if (effectivePool >= targetPool) ehpScore += 18;
  else if (effectivePool >= targetPool * 0.8) ehpScore += 10;
  else if (effectivePool > 0) ehpScore -= 12;

  // Resistances contribution
  if (minEleRes >= 75) ehpScore += 12;
  else ehpScore -= Math.min(30, (75 - minEleRes) * 1.2);

  if (isCI || stats.chaosRes >= 60) ehpScore += 10;
  else if (stats.chaosRes >= 20) ehpScore += 5;
  else if (stats.chaosRes < 0) ehpScore -= 12;

  // Real PoB Max Hit / Total EHP contribution
  if (isPobSource && stats.physMaxHit > 0) {
    if (stats.physMaxHit >= 15000) ehpScore += 12;
    else if (stats.physMaxHit >= 10000) ehpScore += 6;
    else if (stats.physMaxHit < 7000) ehpScore -= 10;
  }

  // Defensive layers, Auras, Guard Skill & Charges
  if (isBlockArchetype || stats.spellSuppression >= 100 || stats.physTakenAsEle >= 15 || isArmourEsArchetype) {
    ehpScore += 8;
  }
  if (activeDefensiveAuras.length > 0) ehpScore += 5;
  if (guardSkills.length > 0) ehpScore += 4;
  if (config.enduranceCharges >= 3 || config.fortify) ehpScore += 4;

  let dpsScore = 55;
  // Links
  if (effectiveLinks >= 6) dpsScore += 18;
  else if (effectiveLinks === 5) dpsScore += 6;
  else dpsScore -= 15;

  // Debuffs
  if (hasCurse) dpsScore += 10;
  else dpsScore -= 12;
  if (hasExposure) dpsScore += 6;

  // Real PoB DPS contribution
  if (isPobSource && effectiveDps > 0) {
    if (effectiveDps >= 3_000_000) dpsScore += 16;
    else if (effectiveDps >= 1_000_000) dpsScore += 10;
    else if (effectiveDps >= 400_000) dpsScore += 4;
    else dpsScore -= 10;
  } else if (!isPobSource) {
    // Armory snapshot has no GGG DPS endpoint; don't artificially tank DPS score
    dpsScore += 10;
  }

  ehpScore = Math.max(15, Math.min(100, Math.round(ehpScore)));
  dpsScore = Math.max(15, Math.min(100, Math.round(dpsScore)));
  const overallScore = Math.round(ehpScore * 0.55 + dpsScore * 0.45);

  let grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F' = 'B';
  if (overallScore >= 90) grade = 'S';
  else if (overallScore >= 80) grade = 'A';
  else if (overallScore >= 70) grade = 'B';
  else if (overallScore >= 55) grade = 'C';
  else if (overallScore >= 40) grade = 'D';
  else grade = 'F';

  const damageUpgrades = diagnostics.filter(
    (d) => d.severity !== 'optimal' && (d.impactType === 'damage' || d.category === 'offenses' || d.category === 'gems')
  );
  const ehpUpgrades = diagnostics.filter(
    (d) => d.severity !== 'optimal' && (d.impactType === 'ehp' || d.category === 'defenses')
  );
  const optimalBadges = diagnostics.filter((d) => d.severity === 'optimal');

  let summary = `Character classified under "${defenseArchetype}" with Grade ${grade} (${overallScore}/100). `;
  if (isPobSource && effectiveDps > 0) {
    summary += `PoB reports ${fmtCompact(effectiveDps)} DPS${stats.totalEHP > 0 ? ` and ${fmtCompact(stats.totalEHP)} Total EHP` : ''}. `;
  } else if (!isPobSource) {
    summary += 'Audited from synced Armory gear + socketed gems (export to PoB for exact tree & DPS calculation). ';
  }
  if (activeAuras.length > 0) {
    summary += `Tracking ${activeAuras.length} aura(s): ${activeAuras.slice(0, 4).join(', ')}${activeAuras.length > 4 ? '…' : ''}. `;
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
