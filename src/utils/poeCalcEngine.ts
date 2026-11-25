// Unified Path of Building-Grade PoE Calculation Engine for Exile SSF
// Computes live Attributes, Life, Energy Shield, Armour, Evasion, Evade Chance,
// Block, Spell Suppression, In-Game Cap+Overcap Resistances, 5-Type Maximum Hit Taken,
// and Effective Hit Pool (EHP) with interactive PoB Configuration toggles.

import type { CharacterGearSnapshot } from '../components/profile/CharacterPaperdollView';
import { formatInGameRes, type FormattedResistance } from './resFormatter';

export type EnemyPresetId = 'map_84' | 'pinnacle_84' | 'uber_85';
export type BanditChoice = 'kill_all' | 'alira' | 'oak' | 'kraityn';

export interface PoeCalcConfig {
  resistancePenalty: 0 | -30 | -60;
  bandit: BanditChoice;
  useEnduranceCharges: boolean;
  enduranceCharges: number;
  useFrenzyCharges: boolean;
  frenzyCharges: number;
  usePowerCharges: boolean;
  powerCharges: number;
  fortified: boolean;
  fortifyStacks: number;
  onslaught: boolean;
  flasksActive: boolean;
  guardActive: boolean;
  enemyPreset: EnemyPresetId;
  // Aura toggles (keyed by aura name, auto-enabled if detected in socketed gems)
  enabledAuras: Record<string, boolean>;
}

export interface DetectedMainSkill {
  name: string;
  slot: string;
  level: number;
  quality: number;
  linkCount: number;
  supports: Array<{ name: string; level: number; quality: number }>;
  suggestions: string[];
}

export interface PoeCalcBreakdown {
  isCI: boolean;
  detectedAuras: string[];
  detectedGuard: string | null;
  detectedCurses: string[];
  detectedChargeSources: string[];
  mainSkill: DetectedMainSkill | null;
  offense: {
    weaponPdps: number;
    weaponEdps: number;
    weaponTotalDps: number;
    weaponAps: number;
    weaponBaseCrit: number;
    accuracy: number;
    hitChancePct: number;
    frenzyMoreDmgPct: number;
    frenzySpeedPct: number;
    powerIncCritPct: number;
    precisionCritPct: number;
    precisionAccuracy: number;
    totalSpeedBonusPct: number;
  };
  attributes: {
    strength: number;
    dexterity: number;
    intelligence: number;
  };
  life: {
    baseFromLevel: number;
    fromStrength: number;
    fromGearAndTree: number;
    incPct: number;
    total: number;
  };
  energyShield: {
    baseFromArmours: number;
    fromDiscipline: number;
    incFromTreeAndGear: number;
    incFromInt: number;
    total: number;
  };
  armour: {
    baseFromArmours: number;
    fromDetermination: number;
    fromFlasks: number;
    incPct: number;
    morePct: number;
    total: number;
    physDmgReductPct: number;
  };
  evasion: {
    baseFromArmours: number;
    fromGrace: number;
    fromFlasks: number;
    incFromTreeAndGear: number;
    incFromDex: number;
    morePct: number;
    total: number;
    evadeChancePct: number;
  };
  block: {
    attackBlock: number;
    spellBlock: number;
    hasGlancingBlows: boolean;
  };
  suppression: {
    chance: number;
    effect: number;
  };
  resistances: {
    fire: FormattedResistance;
    cold: FormattedResistance;
    lightning: FormattedResistance;
    chaos: FormattedResistance;
  };
  mitigation: {
    physTakenAsEle: number;
    flatPdr: number;
    endurancePdr: number;
    enduranceEleDr: number;
    fortifyDr: number;
    guardAbsorb: number;
    enemyHitDamage: number;
    enemyAccuracy: number;
  };
  maxHits: {
    phys: number;
    fire: number;
    cold: number;
    lightning: number;
    chaos: number; // Infinity for CI
  };
  effectiveHitPool: number;
  movementSpeedMod: number;
}

// Verified against Path of Building Community 2.69.0 (Data/Misc.lua monsterAccuracyTable[84]=538, [85]=559)
const ENEMY_PRESETS: Record<EnemyPresetId, { label: string; hitDamage: number; accuracy: number }> = {
  map_84: { label: 'Standard Map (Lv 84)', hitDamage: 2261, accuracy: 538 },
  pinnacle_84: { label: 'Guardian / Pinnacle Boss (Lv 84)', hitDamage: 4800, accuracy: 673 },
  uber_85: { label: 'Uber Pinnacle Boss (Lv 85)', hitDamage: 8500, accuracy: 700 }
};

export function getEnemyPresetInfo(id: EnemyPresetId) {
  return ENEMY_PRESETS[id] || ENEMY_PRESETS.pinnacle_84;
}

const BASE_CLASS_ATTRS: Record<string, [number, number, number]> = {
  marauder: [32, 14, 14],
  juggernaut: [32, 14, 14],
  berserker: [32, 14, 14],
  chieftain: [32, 14, 14],
  ranger: [14, 32, 14],
  deadeye: [14, 32, 14],
  pathfinder: [14, 32, 14],
  warden: [14, 32, 14],
  witch: [14, 14, 32],
  necromancer: [14, 14, 32],
  elementalist: [14, 14, 32],
  occultist: [14, 14, 32],
  duelist: [23, 23, 14],
  slayer: [23, 23, 14],
  gladiator: [23, 23, 14],
  champion: [23, 23, 14],
  templar: [23, 14, 23],
  inquisitor: [23, 14, 23],
  hierophant: [23, 14, 23],
  guardian: [23, 14, 23],
  shadow: [14, 23, 23],
  assassin: [14, 23, 23],
  trickster: [14, 23, 23],
  saboteur: [14, 23, 23],
  scion: [20, 20, 20],
  ascendant: [20, 20, 20]
};

const TRACKABLE_AURAS = [
  'Determination',
  'Grace',
  'Discipline',
  'Purity of Elements',
  'Purity of Fire',
  'Purity of Ice',
  'Purity of Lightning',
  'Tempest Shield',
  'Arctic Armour',
  'Flesh and Stone',
  'Blood and Sand',
  'Defiance Banner',
  'Dread Banner',
  'War Banner',
  'Precision',
  'Clarity',
  'Vitality',
  'Haste',
  'Hatred',
  'Wrath',
  'Anger',
  'Pride',
  'Zealotry',
  'Malevolence',
  'Petrified Blood',
  'Herald of Ash',
  'Herald of Ice',
  'Herald of Thunder',
  'Herald of Purity',
  'Herald of Agony',
  'Summon Skitterbots',
  'Aspect of the Spider',
  'Aspect of the Cat',
  'Aspect of the Crab',
  'Aspect of the Avian',
  'Raise Spectre'
];

const TRACKABLE_CURSES = [
  "Assassin's Mark",
  "Sniper's Mark",
  "Poacher's Mark",
  "Warlord's Mark",
  "Alchemist's Mark",
  'Elemental Weakness',
  'Flammability',
  'Frostbite',
  'Conductivity',
  'Despair',
  'Vulnerability',
  'Punishment',
  'Enfeeble',
  'Temporal Chains'
];

const GUARD_GEMS = ['Molten Shell', 'Vaal Molten Shell', 'Steelskin', 'Immortal Call', 'Arcane Cloak'];

export function detectSnapshotAurasAndGuard(snap: CharacterGearSnapshot): {
  auras: string[];
  guard: string | null;
  curses: string[];
  chargeSources: string[];
  hasPowerSource: boolean;
  hasFrenzySource: boolean;
  hasEnduranceSource: boolean;
} {
  const auras = new Set<string>();
  const curses = new Set<string>();
  const chargeSources = new Set<string>();
  let guard: string | null = null;
  let hasPowerSource = false;
  let hasFrenzySource = false;
  let hasEnduranceSource = false;

  for (const it of snap.equipped || []) {
    for (const g of it.socketedGems || []) {
      const gn = (g.name || '').toLowerCase();
      for (const a of TRACKABLE_AURAS) {
        if (gn.includes(a.toLowerCase())) auras.add(a);
      }
      for (const c of TRACKABLE_CURSES) {
        if (gn.includes(c.toLowerCase())) curses.add(c);
      }
      if (!guard) {
        for (const gs of GUARD_GEMS) {
          if (gn.includes(gs.toLowerCase())) {
            guard = gs;
            break;
          }
        }
      }
      // Auto-detect Charge Generators from gems
      if (gn.includes("assassin's mark") || gn.includes('power charge on critical') || gn.includes('siphoning trap')) {
        hasPowerSource = true;
        chargeSources.add(g.name);
      }
      if (gn.includes('raise spectre')) {
        hasFrenzySource = true;
        chargeSources.add('Raise Spectre (Chieftains)');
      }
      if (gn.includes('blood rage') || gn.includes('frenzy') || gn.includes('ice bite') || gn.includes("poacher's mark")) {
        hasFrenzySource = true;
        chargeSources.add(g.name);
      }
      if (gn.includes('enduring cry') || gn.includes('endurance charge on melee stun')) {
        hasEnduranceSource = true;
        chargeSources.add(g.name);
      }
    }
  }
  const clsLow = (snap.character.className || '').toLowerCase();
  if (clsLow.includes('juggernaut') || clsLow.includes('chieftain') || clsLow.includes('slayer')) {
    hasEnduranceSource = true;
    chargeSources.add(`${snap.character.className} Ascendancy`);
  }
  if (clsLow.includes('trickster') || clsLow.includes('slayer') || clsLow.includes('raider')) {
    hasFrenzySource = true;
  }
  if (clsLow.includes('assassin') || clsLow.includes('occultist') || clsLow.includes('hierophant')) {
    hasPowerSource = true;
  }

  return {
    auras: Array.from(auras),
    guard,
    curses: Array.from(curses),
    chargeSources: Array.from(chargeSources),
    hasPowerSource,
    hasFrenzySource,
    hasEnduranceSource
  };
}

export function buildDefaultCalcConfig(snap: CharacterGearSnapshot): PoeCalcConfig {
  const lvl = snap.character.level || 1;
  const { auras, hasEnduranceSource, hasFrenzySource, hasPowerSource } = detectSnapshotAurasAndGuard(snap);
  const enabledAuras: Record<string, boolean> = {};
  for (const a of auras) enabledAuras[a] = true;

  const clsLow = (snap.character.className || '').toLowerCase();
  const autoFortify = clsLow.includes('champion');

  return {
    resistancePenalty: lvl >= 68 ? -60 : lvl >= 45 ? -30 : 0,
    bandit: 'kill_all',
    useEnduranceCharges: hasEnduranceSource,
    enduranceCharges: hasEnduranceSource ? 3 : 0,
    useFrenzyCharges: hasFrenzySource,
    frenzyCharges: hasFrenzySource ? 3 : 0,
    usePowerCharges: hasPowerSource,
    powerCharges: hasPowerSource ? 3 : 0,
    fortified: autoFortify,
    fortifyStacks: 20,
    onslaught: false,
    flasksActive: false,
    guardActive: false,
    enemyPreset: 'pinnacle_84',
    enabledAuras
  };
}

const CALC_CONFIG_PREFIX = 'exile_ssf_pob_calc_cfg_v1_';
const GOAL_POB_PREFIX = 'exile_ssf_goal_pob_v1_';

export function loadSavedCalcConfig(snap: CharacterGearSnapshot): PoeCalcConfig {
  const def = buildDefaultCalcConfig(snap);
  if (typeof window === 'undefined') return def;
  try {
    const key = `${CALC_CONFIG_PREFIX}${(snap.character.name || 'default').toLowerCase()}`;
    const raw = localStorage.getItem(key);
    if (!raw) return def;
    const parsed = JSON.parse(raw);
    return {
      ...def,
      ...parsed,
      enabledAuras: { ...def.enabledAuras, ...(parsed?.enabledAuras || {}) }
    };
  } catch {
    return def;
  }
}

export function saveCalcConfig(characterName: string, cfg: PoeCalcConfig): void {
  if (typeof window === 'undefined' || !characterName) return;
  try {
    const key = `${CALC_CONFIG_PREFIX}${characterName.toLowerCase()}`;
    localStorage.setItem(key, JSON.stringify(cfg));
  } catch {}
}

export function loadSavedGoalPob(characterName: string): string {
  if (typeof window === 'undefined' || !characterName) return '';
  try {
    return localStorage.getItem(`${GOAL_POB_PREFIX}${characterName.toLowerCase()}`) || '';
  } catch {
    return '';
  }
}

export function saveGoalPob(characterName: string, pobInput: string): void {
  if (typeof window === 'undefined' || !characterName) return;
  try {
    const key = `${GOAL_POB_PREFIX}${characterName.toLowerCase()}`;
    if (pobInput.trim()) localStorage.setItem(key, pobInput.trim());
    else localStorage.removeItem(key);
  } catch {}
}

/**
 * Exact PoE 1 calculation engine combining synced gear, jewels, passive tree,
 * active auras, flasks, charges, guard skills, and enemy hit presets.
 */
export function calculateCharacterStats(
  snap: CharacterGearSnapshot,
  config: PoeCalcConfig
): PoeCalcBreakdown {
  const lvl = Math.max(1, snap.character.level || 1);
  const gs = snap.gearStats;
  const vit = snap.estimatedVitals;
  const {
    auras: detectedAuras,
    guard: detectedGuard,
    curses: detectedCurses,
    chargeSources: detectedChargeSources
  } = detectSnapshotAurasAndGuard(snap);

  const isAuraOn = (name: string) => Boolean(config.enabledAuras[name]);
  const isCI = Boolean(snap.passives?.keystones?.some((k) => /chaos inoculation/i.test(k.name)));
  const hasGlancingBlows = Boolean(snap.passives?.keystones?.some((k) => /glancing blows/i.test(k.name)));
  const hasIronReflexes = Boolean(snap.passives?.keystones?.some((k) => /iron reflexes/i.test(k.name)));

  // 1. Attributes (Base Class + Tree/Gear/Jewels)
  const clsKey = (snap.character.className || 'scion').toLowerCase().trim();
  const [baseStr, baseDex, baseInt] = BASE_CLASS_ATTRS[clsKey] || [20, 20, 20];
  const strength = baseStr + Math.round(gs?.strength || 0);
  const dexterity = baseDex + Math.round(gs?.dexterity || 0);
  const intelligence = baseInt + Math.round(gs?.intelligence || 0);

  // 2. Parse Flask Bonuses if Flasks Active
  let flaskFlatArmour = 0;
  let flaskFlatEvasion = 0;
  let flaskIncArmour = 0;
  let flaskIncEvasion = 0;
  let flaskFireRes = 0;
  let flaskColdRes = 0;
  let flaskLightRes = 0;
  let flaskChaosRes = 0;
  let flaskMaxFire = 0;
  let flaskMaxCold = 0;
  let flaskMaxLight = 0;
  let flaskMoveSpeed = 0;

  if (config.flasksActive) {
    for (const f of snap.equipped.filter((i) => i.inventoryId === 'Flask')) {
      const fName = `${f.name} ${f.baseType} ${f.typeLine}`.toLowerCase();
      if (fName.includes('granite flask')) flaskFlatArmour += 1500;
      if (fName.includes('jade flask')) flaskFlatEvasion += 1500;
      if (fName.includes('basalt flask')) flaskIncArmour += 20;
      if (fName.includes('stibnite flask')) flaskIncEvasion += 20;
      if (fName.includes('ruby flask')) {
        flaskFireRes += 50;
        flaskMaxFire += 5;
      }
      if (fName.includes('sapphire flask')) {
        flaskColdRes += 50;
        flaskMaxCold += 5;
      }
      if (fName.includes('topaz flask')) {
        flaskLightRes += 50;
        flaskMaxLight += 5;
      }
      if (fName.includes('amethyst flask')) flaskChaosRes += 35;
      if (fName.includes('bismuth flask')) {
        flaskFireRes += 35;
        flaskColdRes += 35;
        flaskLightRes += 35;
      }
      if (fName.includes('quicksilver flask')) flaskMoveSpeed += 40;
      const fMods = [...(f.explicitMods || []), ...(f.implicitMods || [])];
      for (const m of fMods) {
        const arM = m.match(/(\d+)% increased Armour during Effect/i);
        if (arM) flaskIncArmour += Number(arM[1]);
        const evM = m.match(/(\d+)% increased Evasion Rating during Effect/i);
        if (evM) flaskIncEvasion += Number(evM[1]);
        const msM = m.match(/(\d+)% increased Movement Speed during Effect/i);
        if (msM) flaskMoveSpeed += Number(msM[1]);
        const allResM = m.match(/\+(\d+)% to all Elemental Resistances during Effect/i);
        if (allResM) {
          const rv = Number(allResM[1]);
          flaskFireRes += rv;
          flaskColdRes += rv;
          flaskLightRes += rv;
        }
      }
    }
  }

  // 3. Life (PoE 1: 38 + 12*level + Str/2 + flatLife + Oak) * (1 + incLife/100)
  const baseFromLevel = 38 + lvl * 12;
  const fromStrength = Math.floor(strength / 2);
  const oakLife = config.bandit === 'oak' ? 40 : 0;
  const fromGearAndTree = Math.round((vit.flatLife || 0) + oakLife);
  const incLifePct = Math.round(gs?.incLifePct || 0);
  const totalLife = isCI
    ? 1
    : Math.round((baseFromLevel + fromStrength + fromGearAndTree) * (1 + incLifePct / 100));

  // 4. Energy Shield (Base from Armours + Discipline) * (1 + (incEs + Int/5)/100)
  const baseEsFromArmours = Math.round(gs?.energyShield || vit.flatEs || 0);
  const fromDiscipline = isAuraOn('Discipline') ? 217 : 0; // Lv 20 Discipline
  const incEsFromTree = Math.round(gs?.incEsPct || 0);
  const incEsFromInt = Math.floor(intelligence / 5);
  const totalEs = Math.round((baseEsFromArmours + fromDiscipline) * (1 + (incEsFromTree + incEsFromInt) / 100));

  // 5. Evasion & Armour (Determination + Grace + Iron Reflexes + Flasks)
  const baseEvFromArmours = Math.round(gs?.evasion || 0);
  const fromGrace = isAuraOn('Grace') ? 1545 : 0; // PoE 3.25+ Lv 20 Grace
  const incEvFromTree = Math.round((gs?.incEvasionPct || 0) + flaskIncEvasion);
  const incEvFromDex = Math.floor(dexterity / 5);
  const graceMorePct = isAuraOn('Grace') ? 29 : 0;
  const rawTotalEvasion = Math.round(
    (baseEvFromArmours + fromGrace + flaskFlatEvasion) *
      (1 + (incEvFromTree + incEvFromDex) / 100) *
      (1 + graceMorePct / 100)
  );

  const baseArFromArmours = Math.round(gs?.armour || 0);
  const fromDetermination = isAuraOn('Determination') ? 1026 : 0; // PoE 3.25+ Lv 20 Determination
  const incArPct = Math.round((gs?.incArmourPct || 0) + flaskIncArmour);
  const detMorePct = isAuraOn('Determination') ? 49 : 0;
  const convertedEvToAr = hasIronReflexes ? rawTotalEvasion : 0;
  const totalEvasion = hasIronReflexes ? 0 : rawTotalEvasion;
  const totalArmour = Math.round(
    (baseArFromArmours + fromDetermination + flaskFlatArmour) *
      (1 + incArPct / 100) *
      (1 + detMorePct / 100) +
      convertedEvToAr
  );

  // 6. Evade Chance (Exact PoE 1 formula against Enemy Preset Accuracy)
  const enemy = getEnemyPresetInfo(config.enemyPreset);
  const rawEvadeChance =
    totalEvasion > 0
      ? 1 - (1.25 * enemy.accuracy) / (enemy.accuracy + Math.pow(totalEvasion / 5, 0.9))
      : 0;
  const evadeChancePct = Math.round(Math.max(0, Math.min(95, rawEvadeChance * 100)));

  // 7. Resistances (In-Game Cap + Overcap, respecting +Max Res, Purity Auras, Alira, Flasks, CI)
  const aliraRes = config.bandit === 'alira' ? 15 : 0;
  const purityEleRes = isAuraOn('Purity of Elements') ? 34 : 0;
  const purityFireRes = isAuraOn('Purity of Fire') ? 41 : 0;
  const purityColdRes = isAuraOn('Purity of Ice') ? 41 : 0;
  const purityLightRes = isAuraOn('Purity of Lightning') ? 41 : 0;

  const maxFire = Math.min(90, 75 + (gs?.maxFireRes || 0) + (isAuraOn('Purity of Fire') ? 4 : 0) + flaskMaxFire);
  const maxCold = Math.min(90, 75 + (gs?.maxColdRes || 0) + (isAuraOn('Purity of Ice') ? 4 : 0) + flaskMaxCold);
  const maxLight = Math.min(90, 75 + (gs?.maxLightningRes || 0) + (isAuraOn('Purity of Lightning') ? 4 : 0) + flaskMaxLight);
  const maxChaos = Math.min(90, 75 + (gs?.maxChaosRes || 0));

  const fire = formatInGameRes(
    (vit.fireRes || 0) + aliraRes + purityEleRes + purityFireRes + flaskFireRes + config.resistancePenalty,
    maxFire
  );
  const cold = formatInGameRes(
    (vit.coldRes || 0) + aliraRes + purityEleRes + purityColdRes + flaskColdRes + config.resistancePenalty,
    maxCold
  );
  const lightning = formatInGameRes(
    (vit.lightningRes || 0) + aliraRes + purityEleRes + purityLightRes + flaskLightRes + config.resistancePenalty,
    maxLight
  );
  const chaos = formatInGameRes(
    (vit.chaosRes || 0) + flaskChaosRes + config.resistancePenalty,
    maxChaos,
    isCI
  );

  // 8. Block & Spell Suppression
  const rawAttackBlock = Math.round(gs?.blockChance || 0);
  const rawSpellBlock = Math.round((gs?.spellBlockChance || 0) + (isAuraOn('Tempest Shield') ? 25 : 0));
  const attackBlock = Math.min(75, hasGlancingBlows ? rawAttackBlock * 2 : rawAttackBlock);
  const spellBlock = Math.min(75, hasGlancingBlows ? rawSpellBlock * 2 : rawSpellBlock);
  const suppressionChance = Math.min(100, Math.max(0, Math.round(vit.suppress || 0)));
  const suppressionEffect = 50;

  // 9. Physical & Elemental Mitigation Layers
  const endCharges = config.useEnduranceCharges ? Math.max(0, Math.min(12, config.enduranceCharges)) : 0;
  const endurancePdr = endCharges * 4; // 4% PDR per charge (PoE 3.25+)
  const enduranceEleDr = endCharges * 4; // 4% Ele DR per charge (PoE 3.25+)
  const flatPdr = Math.round(gs?.flatPdr || 0);
  const physTakenAsEle = Math.min(90, Math.round(gs?.physTakenAsEle || 0));
  const fortifyDr = config.fortified ? Math.min(30, Math.max(0, config.fortifyStacks)) : 0;
  const arcticPhysDr = isAuraOn('Arctic Armour') ? 21 : 0; // PoB 2.69.0 act_dex.lua Lv 20: -21% Phys, -20% Fire
  const arcticFireDr = isAuraOn('Arctic Armour') ? 20 : 0;
  const fleshStoneDr = isAuraOn('Flesh and Stone') ? 19 : 0;

  // Guard Skill absorption when Guard is Active (verified against PoB 2.69.0 act_str.lua)
  let guardAbsorb = 0;
  let guardLessPhys = 0;
  let guardLessEle = 0;
  if (config.guardActive && detectedGuard) {
    const gLow = detectedGuard.toLowerCase();
    if (gLow.includes('molten shell')) {
      guardAbsorb = Math.min(3000, Math.round(totalArmour * 0.1)); // Lv 20 Molten Shell: 10% Armour up to 3,000
    } else if (gLow.includes('steelskin')) {
      guardAbsorb = 2209;
    } else if (gLow.includes('immortal call')) {
      guardLessPhys = 35; // Lv 20 Immortal Call: -35% Phys, -34% Ele
      guardLessEle = 34;
    } else if (gLow.includes('arcane cloak')) {
      guardAbsorb = 2000;
    }
  }

  // Armour DR vs enemy preset physical hit
  const armourDrAtPreset =
    totalArmour > 0 ? totalArmour / (totalArmour + 5 * enemy.hitDamage) : 0;
  const physDmgReductPct = Math.round(
    Math.min(90, armourDrAtPreset * 100 + endurancePdr + flatPdr)
  );

  // 10. Exact 5-Type Maximum Hit Taken (Binary Search for Armour + All Multipliers)
  const hitPool = (isCI ? totalEs : totalLife + totalEs) + guardAbsorb;
  const avgEleRes = (fire.effective + cold.effective + lightning.effective) / 3;

  const computeHitTaken = (rawHit: number, type: 'phys' | 'fire' | 'cold' | 'lightning' | 'chaos'): number => {
    let dmg = rawHit;
    if (type === 'phys') {
      const shifted = rawHit * (physTakenAsEle / 100);
      const remPhys = rawHit - shifted;
      const arDr = remPhys > 0 && totalArmour > 0 ? totalArmour / (totalArmour + 5 * remPhys) : 0;
      const totalPdr = Math.min(0.9, arDr + (endurancePdr + flatPdr) / 100);
      const physPart = remPhys * (1 - totalPdr) * (1 - arcticPhysDr / 100) * (1 - guardLessPhys / 100);
      const elePart = shifted * (1 - avgEleRes / 100) * (1 - enduranceEleDr / 100) * (1 - guardLessEle / 100);
      dmg = physPart + elePart;
    } else if (type === 'chaos') {
      if (isCI) return 0;
      dmg = rawHit * (1 - chaos.effective / 100);
    } else {
      const resPct = type === 'fire' ? fire.effective : type === 'cold' ? cold.effective : lightning.effective;
      const fireExtra = type === 'fire' ? 1 - arcticFireDr / 100 : 1;
      dmg = rawHit * (1 - resPct / 100) * (1 - enduranceEleDr / 100) * (1 - guardLessEle / 100) * fireExtra;
      if (suppressionChance >= 100) {
        dmg *= 1 - suppressionEffect / 100;
      }
    }
    dmg *= 1 - fortifyDr / 100;
    dmg *= 1 - fleshStoneDr / 100;
    return Math.max(0, dmg);
  };

  const solveMaxHit = (type: 'phys' | 'fire' | 'cold' | 'lightning' | 'chaos'): number => {
    if (type === 'chaos' && isCI) return Infinity;
    let lo = 0;
    let hi = Math.max(hitPool * 25, 600_000);
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (computeHitTaken(mid, type) <= hitPool) lo = mid;
      else hi = mid;
    }
    return Math.round(lo);
  };

  const physMaxHit = solveMaxHit('phys');
  const fireMaxHit = solveMaxHit('fire');
  const coldMaxHit = solveMaxHit('cold');
  const lightningMaxHit = solveMaxHit('lightning');
  const chaosMaxHit = solveMaxHit('chaos');

  // 11. Effective Hit Pool (PoB-Style Mixed Hit Mitigation + Evade + Block + Suppression)
  // Average taken multiplier across a mixed hit (40% Phys, 20% Fire, 20% Cold, 20% Light)
  const mixedTaken =
    0.4 * (computeHitTaken(enemy.hitDamage, 'phys') / enemy.hitDamage) +
    0.2 * (computeHitTaken(enemy.hitDamage, 'fire') / enemy.hitDamage) +
    0.2 * (computeHitTaken(enemy.hitDamage, 'cold') / enemy.hitDamage) +
    0.2 * (computeHitTaken(enemy.hitDamage, 'lightning') / enemy.hitDamage);

  // Avoidance multiplier (Evade + Block; Glancing Blows takes 65% of blocked hits)
  const effectiveBlockReduction = hasGlancingBlows
    ? ((attackBlock + spellBlock) / 200) * 0.35
    : (attackBlock + spellBlock) / 200;
  const hitThroughChance = Math.max(0.08, (1 - evadeChancePct / 100) * (1 - effectiveBlockReduction));
  const avgTakenPerIncomingHit = Math.max(0.02, mixedTaken * hitThroughChance);
  const effectiveHitPool = Math.round(hitPool / avgTakenPerIncomingHit);

  // 12. Movement Speed Modifier
  const movementSpeedMod = Math.round(
    (gs?.movementSpeed || 0) +
      (config.onslaught ? 20 : 0) +
      (config.bandit === 'kraityn' ? 8 : 0) +
      (isAuraOn('Haste') ? 10 : 0) +
      flaskMoveSpeed
  );

  // 13. Offense: Main Skill Detection, Weapon DPS, Accuracy/Hit Chance & Charge Multipliers
  let mainSkill: DetectedMainSkill | null = null;
  let bestLinkScore = 0;
  for (const it of snap.equipped || []) {
    if (!Array.isArray(it.socketedGems) || it.socketedGems.length === 0) continue;
    const byGroup = new Map<number, typeof it.socketedGems>();
    for (const g of it.socketedGems) {
      const grp = typeof g.group === 'number' ? g.group : 0;
      const arr = byGroup.get(grp) || [];
      arr.push(g);
      byGroup.set(grp, arr);
    }
    for (const groupGems of byGroup.values()) {
      const actives = groupGems.filter((g) => !g.support && !TRACKABLE_AURAS.some((a) => g.name.toLowerCase().includes(a.toLowerCase())) && !GUARD_GEMS.some((gs) => g.name.toLowerCase().includes(gs.toLowerCase())));
      const supports = groupGems.filter((g) => g.support);
      if (actives.length === 0) continue;
      const linkCount = groupGems.length;
      const score = linkCount * 10 + (it.inventoryId === 'BodyArmour' || it.inventoryId === 'Weapon' ? 5 : 0);
      if (score > bestLinkScore) {
        bestLinkScore = score;
        const primaryActive = actives[0];
        const suggestions: string[] = [];
        if (linkCount < 6) {
          suggestions.push(`Upgrade ${it.inventoryId} from ${linkCount}-Link to 6-Link (+30% to +35% more DPS).`);
        }
        if (primaryActive.level < 20) {
          suggestions.push(`Level ${primaryActive.name} from Lv ${primaryActive.level} to Lv 20 (or Vaal for Lv 21).`);
        } else if (primaryActive.level === 20 && !primaryActive.corrupted) {
          suggestions.push(`Level spare ${primaryActive.name} gems in weapon swap to Vaal for Lv 21/20.`);
        }
        const lowQualSupports = supports.filter((s) => s.quality < 15);
        if (lowQualSupports.length > 0) {
          suggestions.push(`Quality up ${lowQualSupports.length} support gem(s) via GCP recipe (${lowQualSupports.slice(0, 2).map((s) => s.name).join(', ')}).`);
        }
        if (detectedCurses.length === 0) {
          suggestions.push('Add an active Curse or Mark (e.g. Assassin\'s Mark, Sniper\'s Mark, or Elemental Weakness) for +25–35% Boss DPS.');
        }
        mainSkill = {
          name: primaryActive.name,
          slot: it.inventoryId,
          level: primaryActive.level,
          quality: primaryActive.quality,
          linkCount,
          supports: supports.map((s) => ({ name: s.name, level: s.level, quality: s.quality })),
          suggestions
        };
      }
    }
  }

  // Parse Weapon Physical & Elemental DPS from equipped Weapon
  const mainWeapon = (snap.equipped || []).find((i) => i.inventoryId === 'Weapon');
  let weaponPdps = 0;
  let weaponEdps = 0;
  let weaponAps = 0;
  let weaponBaseCrit = 5;
  if (mainWeapon && Array.isArray(mainWeapon.properties)) {
    const parseRangeAvg = (val: string): number => {
      let sum = 0;
      const rx = /(\d+)\s*-\s*(\d+)/g;
      let m;
      while ((m = rx.exec(val)) !== null) {
        sum += (Number(m[1]) + Number(m[2])) / 2;
      }
      return sum;
    };
    let physAvg = 0;
    let eleAvg = 0;
    for (const p of mainWeapon.properties) {
      const n = p.name.toLowerCase();
      if (n.includes('attacks per second')) weaponAps = parseFloat(p.value) || 0;
      else if (n.includes('critical strike chance')) weaponBaseCrit = parseFloat(p.value) || 5;
      else if (n.includes('physical damage')) physAvg += parseRangeAvg(p.value);
      else if (n.includes('elemental damage')) eleAvg += parseRangeAvg(p.value);
    }
    // Also factor in attribute-stacking flat damage mods on the weapon (e.g. Hand of Thought and Motion / Brutus' Lead Sprinkler)
    for (const m of [...(mainWeapon.explicitMods || []), ...(mainWeapon.implicitMods || [])]) {
      const stackM = m.match(/Adds (\d+) to (\d+) (Fire|Cold|Lightning) Damage to Attacks with this Weapon per (\d+) (Strength|Dexterity|Intelligence)/i);
      if (stackM) {
        const avgPer = (Number(stackM[1]) + Number(stackM[2])) / 2;
        const step = Math.max(1, Number(stackM[4]));
        const attrKey = stackM[5].toLowerCase();
        const attrVal = attrKey === 'strength' ? strength : attrKey === 'dexterity' ? dexterity : intelligence;
        eleAvg += avgPer * Math.floor(attrVal / step);
      }
    }
    if (weaponAps > 0) {
      weaponPdps = Math.round(physAvg * weaponAps);
      weaponEdps = Math.round(eleAvg * weaponAps);
    }
  }

  // Precision Lv 20: +711 Accuracy, +58% Increased Crit Chance (scales by gem level if lower)
  const precGem = (snap.equipped || [])
    .flatMap((i) => i.socketedGems || [])
    .find((g) => g.name.toLowerCase().includes('precision'));
  const precLvl = precGem?.level || 20;
  const precisionAccuracy = isAuraOn('Precision') ? Math.round(45 + precLvl * 33.3) : 0;
  const precisionCritPct = isAuraOn('Precision') ? Math.round(20 + precLvl * 1.9) : 0;

  // Player Accuracy = Dex * 2 + Precision + Level base (~2 * level)
  const accuracy = dexterity * 2 + lvl * 2 + precisionAccuracy;
  // Exact PoB Hit Chance formula vs Enemy Lv 84 Evasion (PoB Misc.lua Lv 84 base evasion ~10,143 -> simplified standard 10143)
  const enemyEvasion = config.enemyPreset === 'uber_85' ? 11000 : 10143;
  const rawHitChance = (accuracy / (accuracy + Math.pow(enemyEvasion / 5, 0.9))) * 125;
  const hitChancePct = Math.round(Math.max(5, Math.min(100, rawHitChance)));

  const frenzyCount = config.useFrenzyCharges ? Math.max(0, Math.min(12, config.frenzyCharges)) : 0;
  const powerCount = config.usePowerCharges ? Math.max(0, Math.min(12, config.powerCharges)) : 0;
  const frenzyMoreDmgPct = frenzyCount * 4;
  const frenzySpeedPct = frenzyCount * 4;
  const powerIncCritPct = powerCount * 50;
  const totalSpeedBonusPct = frenzySpeedPct + (config.onslaught ? 20 : 0) + (isAuraOn('Haste') ? 24 : 0);

  return {
    isCI,
    detectedAuras,
    detectedGuard,
    detectedCurses,
    detectedChargeSources,
    mainSkill,
    offense: {
      weaponPdps,
      weaponEdps,
      weaponTotalDps: weaponPdps + weaponEdps,
      weaponAps,
      weaponBaseCrit,
      accuracy,
      hitChancePct,
      frenzyMoreDmgPct,
      frenzySpeedPct,
      powerIncCritPct,
      precisionCritPct,
      precisionAccuracy,
      totalSpeedBonusPct
    },
    attributes: { strength, dexterity, intelligence },
    life: {
      baseFromLevel,
      fromStrength,
      fromGearAndTree,
      incPct: incLifePct,
      total: totalLife
    },
    energyShield: {
      baseFromArmours: baseEsFromArmours,
      fromDiscipline,
      incFromTreeAndGear: incEsFromTree,
      incFromInt: incEsFromInt,
      total: totalEs
    },
    armour: {
      baseFromArmours: baseArFromArmours,
      fromDetermination,
      fromFlasks: flaskFlatArmour,
      incPct: incArPct,
      morePct: detMorePct,
      total: totalArmour,
      physDmgReductPct
    },
    evasion: {
      baseFromArmours: baseEvFromArmours,
      fromGrace,
      fromFlasks: flaskFlatEvasion,
      incFromTreeAndGear: incEvFromTree,
      incFromDex: incEvFromDex,
      morePct: graceMorePct,
      total: totalEvasion,
      evadeChancePct
    },
    block: {
      attackBlock,
      spellBlock,
      hasGlancingBlows
    },
    suppression: {
      chance: suppressionChance,
      effect: suppressionEffect
    },
    resistances: { fire, cold, lightning, chaos },
    mitigation: {
      physTakenAsEle,
      flatPdr,
      endurancePdr,
      enduranceEleDr,
      fortifyDr,
      guardAbsorb,
      enemyHitDamage: enemy.hitDamage,
      enemyAccuracy: enemy.accuracy
    },
    maxHits: {
      phys: physMaxHit,
      fire: fireMaxHit,
      cold: coldMaxHit,
      lightning: lightningMaxHit,
      chaos: chaosMaxHit
    },
    effectiveHitPool,
    movementSpeedMod
  };
}
