import { inflate } from 'pako';
import type {
  ParsedCharacter,
  ParsedPoBStats,
  ParsedPoBConfig,
  ParsedSkillGroup,
  ParsedItem,
  ParsedGem
} from '../types/analyzer';

function cleanBase64(input: string): string {
  let cleaned = input.trim().replace(/\s/g, '').replace(/-/g, '+').replace(/_/g, '/');
  while (cleaned.length % 4 !== 0) {
    cleaned += '=';
  }
  return cleaned;
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function decodePoBCode(code: string): string {
  const trimmed = code.trim();
  if (trimmed.startsWith('<PathOfBuilding') || trimmed.includes('<PathOfBuilding>') || trimmed.includes('<PathOfBuilding2')) {
    return trimmed;
  }
  try {
    const cleaned = cleanBase64(trimmed);
    const bytes = base64ToUint8Array(cleaned);
    const decompressed = inflate(bytes);
    return new TextDecoder('utf-8').decode(decompressed);
  } catch {
    throw new Error('Invalid or corrupted Path of Building export string. Please copy the complete code directly from PoB.');
  }
}

export const KNOWN_AURA_NAMES = [
  'Determination',
  'Grace',
  'Discipline',
  'Purity of Elements',
  'Purity of Fire',
  'Purity of Ice',
  'Purity of Lightning',
  'Haste',
  'Hatred',
  'Wrath',
  'Anger',
  'Malevolence',
  'Zealotry',
  'Pride',
  'Tempest Shield',
  'Petrified Blood',
  'Vitality',
  'Clarity',
  'Precision',
  'Arctic Armour',
  'Flesh and Stone',
  'Blood and Sand',
  'Defiance Banner',
  'Dread Banner',
  'War Banner',
  'Herald of Ash',
  'Herald of Ice',
  'Herald of Thunder',
  'Herald of Purity',
  'Herald of Agony',
  'Aspect of the Spider',
  'Aspect of the Crab',
  'Aspect of the Cat',
  'Aspect of the Avian',
  'Skitterbots',
  'Summon Skitterbots'
];

export const KNOWN_GUARD_NAMES = [
  'Molten Shell',
  'Vaal Molten Shell',
  'Steelskin',
  'Immortal Call',
  'Arcane Cloak',
  'Bone Armour',
  'Frost Shield'
];

export function detectAurasAndGuards(skillGroups: ParsedSkillGroup[]): { activeAuras: string[]; guardSkills: string[] } {
  const auras = new Set<string>();
  const guards = new Set<string>();
  for (const grp of skillGroups) {
    if (!grp.enabled) continue;
    for (const g of grp.gems) {
      if (!g.enabled || g.isSupport) continue;
      const low = g.name.toLowerCase();
      for (const a of KNOWN_AURA_NAMES) {
        if (low === a.toLowerCase() || low.includes(a.toLowerCase())) {
          auras.add(a === 'Skitterbots' ? 'Summon Skitterbots' : a);
          break;
        }
      }
      for (const gs of KNOWN_GUARD_NAMES) {
        if (low === gs.toLowerCase() || low.includes(gs.toLowerCase())) {
          guards.add(gs);
          break;
        }
      }
    }
  }
  return { activeAuras: Array.from(auras), guardSkills: Array.from(guards) };
}

function getGemColor(name: string): 'R' | 'G' | 'B' | 'W' {
  const n = name.toLowerCase();
  if (
    n.includes('strike') || n.includes('slam') || n.includes('fire') || n.includes('anger') ||
    n.includes('determination') || n.includes('brutality') || n.includes('fortify') || n.includes('ruthless') ||
    n.includes('vitality') || n.includes('purity of fire') || n.includes('molten') || n.includes('boneshatter') ||
    n.includes('cleave') || n.includes('shield crush') || n.includes('enduring') || n.includes('heavy') ||
    n.includes('infernal') || n.includes('purity') || n.includes('pride') || n.includes('immortal call') ||
    n.includes('steelskin') || n.includes('lifetap') || n.includes('empower')
  ) {
    return 'R';
  }
  if (
    n.includes('arrow') || n.includes('bow') || n.includes('grace') || n.includes('hatred') ||
    n.includes('herald of ice') || n.includes('trinity') || n.includes('swift affliction') ||
    n.includes('deadly ailments') || n.includes('dash') || n.includes('frenzy') || n.includes('sniper') ||
    n.includes('blade') || n.includes('poison') || n.includes('barrage') || n.includes('tornado') ||
    n.includes('haste') || n.includes('puncture') || n.includes('precision') || n.includes('enhance')
  ) {
    return 'G';
  }
  if (n.includes('portal') || n.includes('detonate') || n.includes('prismatic')) {
    return 'W';
  }
  return 'B';
}

function formatGemName(rawName: string): string {
  if (!rawName) return 'Unknown Gem';
  if (rawName.includes(' ')) return rawName;
  const knownMap: Record<string, string> = {
    PenanceBrand: 'Penance Brand',
    WaveOfConviction: 'Wave of Conviction',
    ElementalWeakness: 'Elemental Weakness',
    ArcanistBrand: 'Arcanist Brand',
    SupportArcanistBrand: 'Arcanist Brand Support',
    SupportSwiftbrand: 'Swiftbrand Support',
    SupportDeadlyAilments: 'Deadly Ailments Support',
    SupportUnboundAilments: 'Unbound Ailments Support',
    SupportCruelty: 'Cruelty Support',
    SupportSwiftAffliction: 'Swift Affliction Support',
    SupportBurningDamage: 'Burning Damage Support',
    SupportCombustion: 'Combustion Support',
    SupportIgniteProliferation: 'Ignite Proliferation Support',
    SupportTrinity: 'Trinity Support',
    SupportMeleePhysicalDamage: 'Melee Physical Damage Support',
    SupportBrutality: 'Brutality Support',
    SupportFortify: 'Fortify Support',
    SupportRuthless: 'Ruthless Support',
    HeraldOfAsh: 'Herald of Ash',
    HeraldOfThunder: 'Herald of Thunder',
    HeraldOfPurity: 'Herald of Purity',
    HeraldOfIce: 'Herald of Ice',
    PurityOfElements: 'Purity of Elements',
    TempestShield: 'Tempest Shield',
    MoltenShell: 'Molten Shell',
    ImmortalCall: 'Immortal Call',
    ArcaneCloak: 'Arcane Cloak',
    PetrifiedBlood: 'Petrified Blood',
    SummonSkitterbots: 'Summon Skitterbots',
    SummonFlameGolem: 'Summon Flame Golem',
    SummonStoneGolem: 'Summon Stone Golem',
    SummonChaosGolem: 'Summon Chaos Golem',
    SummonLightningGolem: 'Summon Lightning Golem',
    LightningArrow: 'Lightning Arrow',
    TornadoShot: 'Tornado Shot',
    Boneshatter: 'Boneshatter'
  };
  if (knownMap[rawName]) return knownMap[rawName];
  return rawName.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^Support\s+/, '') + (rawName.startsWith('Support') ? ' Support' : '');
}

function detectPseudoSupportMods(mods: string[]): string[] {
  const pseudoSupports: string[] = [];
  const fullText = mods.join(' \n ');

  if (/Socketed Gems deal 30% more Elemental Damage/i.test(fullText) || /30% more Elemental Damage/i.test(fullText)) {
    pseudoSupports.push('30% More Elemental Damage (Essence of Horror)');
  }
  if (/Socketed Gems deal 30% more Damage over Time/i.test(fullText) || /30% more Damage over Time/i.test(fullText)) {
    pseudoSupports.push('30% More Damage over Time (Essence of Delirium)');
  }
  if (/Socketed (?:Gems|Spells) have \+3(?:\.5)?% to Critical Strike Chance/i.test(fullText)) {
    pseudoSupports.push('+3.5% Base Crit (Essence of Hysteria)');
  }
  if (/Socketed Gems deal 50% of Physical Damage as Extra Fire/i.test(fullText)) {
    pseudoSupports.push('50% Phys as Extra Fire (Essence of Hysteria)');
  }
  if (/Socketed Gems have 16% more Attack and Cast Speed/i.test(fullText)) {
    pseudoSupports.push('16% More Attack/Cast Speed (Essence of Insanity)');
  }

  const supportRegex = /Socketed (?:Gems|Spells|Attacks) are Supported by Level (\d+) ([^,.\n]+)/gi;
  let match;
  while ((match = supportRegex.exec(fullText)) !== null) {
    const level = match[1];
    const suppName = match[2].trim();
    if (!pseudoSupports.some((p) => p.toLowerCase().includes(suppName.toLowerCase()))) {
      pseudoSupports.push(`Level ${level} ${suppName} Support`);
    }
  }

  if (/Supported by the Main Hand Weapon/i.test(fullText) || /The Squire/i.test(fullText)) {
    pseudoSupports.push('+3 Main Hand Link Multipliers (The Squire)');
  }

  return pseudoSupports;
}

/**
 * Helper: pick first defined numeric stat from statMap without letting 0 fall through
 */
function pickStat(map: Record<string, number>, keys: string[], fallback = 0): number {
  for (const k of keys) {
    if (Object.prototype.hasOwnProperty.call(map, k) && Number.isFinite(map[k])) {
      return map[k];
    }
  }
  return fallback;
}

/**
 * Parse full PoB XML into an accurate ParsedCharacter model
 * - Respects activeItemSet, activeSkillSet, activeConfigSet, and activeSpec
 * - Reads real TotalEHP, Max Hits, FullDPS, CombinedDPS, MinionStat, Charges & Config
 * - Never overwrites real 0 values with fake defaults
 */
export function parsePoBXml(xml: string): ParsedCharacter {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');

  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Failed to parse Path of Building XML: ' + parseError.textContent);
  }

  const buildEl = doc.querySelector('Build');
  const className = buildEl?.getAttribute('className') || 'Witch';
  const ascendClassName = buildEl?.getAttribute('ascendClassName') || 'None';
  const level = parseInt(buildEl?.getAttribute('level') || '85', 10);
  const mainSocketGroupIdx = parseInt(buildEl?.getAttribute('mainSocketGroup') || '1', 10);
  const characterName =
    buildEl?.getAttribute('characterName') ||
    `${ascendClassName !== 'None' ? ascendClassName : className} (Level ${level})`;

  // 1. PlayerStats & MinionStats
  const statMap: Record<string, number> = {};
  doc.querySelectorAll('Build > PlayerStat, PlayerStat').forEach((statEl) => {
    const statName = statEl.getAttribute('stat');
    const raw = statEl.getAttribute('value');
    if (statName && raw !== null) {
      const statVal = parseFloat(raw);
      if (Number.isFinite(statVal)) {
        statMap[statName] = statVal;
      }
    }
  });

  const minionStatMap: Record<string, number> = {};
  doc.querySelectorAll('Build > MinionStat, MinionStat').forEach((statEl) => {
    const statName = statEl.getAttribute('stat');
    const raw = statEl.getAttribute('value');
    if (statName && raw !== null) {
      const statVal = parseFloat(raw);
      if (Number.isFinite(statVal)) {
        minionStatMap[statName] = statVal;
      }
    }
  });

  // 2. Active ConfigSet (Endurance/Frenzy/Power Charges, Fortify, Onslaught, Boss Preset)
  const configRoot = doc.querySelector('Config');
  const activeConfigSetId = configRoot?.getAttribute('activeConfigSet') || '1';
  const activeConfigSet =
    (configRoot &&
      Array.from(configRoot.querySelectorAll('ConfigSet')).find(
        (cs) => cs.getAttribute('id') === activeConfigSetId
      )) ||
    configRoot?.querySelector('ConfigSet') ||
    configRoot;

  const cfgBool: Record<string, boolean> = {};
  const cfgNum: Record<string, number> = {};
  const cfgStr: Record<string, string> = {};
  if (activeConfigSet) {
    activeConfigSet.querySelectorAll('Input, Placeholder').forEach((el) => {
      const name = el.getAttribute('name');
      if (!name) return;
      const b = el.getAttribute('boolean');
      const n = el.getAttribute('number');
      const s = el.getAttribute('string');
      if (b !== null) cfgBool[name] = b === 'true';
      if (n !== null && Number.isFinite(parseFloat(n))) cfgNum[name] = parseFloat(n);
      if (s !== null) cfgStr[name] = s;
    });
  }

  const maxEnduranceCharges = Math.round(pickStat(statMap, ['EnduranceChargesMax'], 3));
  const maxFrenzyCharges = Math.round(pickStat(statMap, ['FrenzyChargesMax'], 3));
  const maxPowerCharges = Math.round(pickStat(statMap, ['PowerChargesMax'], 3));
  const useEnduranceCharges = Boolean(cfgBool['useEnduranceCharges']);
  const useFrenzyCharges = Boolean(cfgBool['useFrenzyCharges']);
  const usePowerCharges = Boolean(cfgBool['usePowerCharges']);

  const enduranceCharges = Math.round(
    pickStat(
      statMap,
      ['EnduranceCharges'],
      useEnduranceCharges ? cfgNum['overrideEnduranceCharges'] ?? maxEnduranceCharges : 0
    )
  );
  const frenzyCharges = Math.round(
    pickStat(
      statMap,
      ['FrenzyCharges'],
      useFrenzyCharges ? cfgNum['overrideFrenzyCharges'] ?? maxFrenzyCharges : 0
    )
  );
  const powerCharges = Math.round(
    pickStat(
      statMap,
      ['PowerCharges'],
      usePowerCharges ? cfgNum['overridePowerCharges'] ?? maxPowerCharges : 0
    )
  );

  // Check if any flask is active in the active ItemSet
  const itemsRoot = doc.querySelector('Items');
  const activeItemSetId = itemsRoot?.getAttribute('activeItemSet') || '1';
  const activeItemSetEl =
    (itemsRoot &&
      Array.from(itemsRoot.querySelectorAll('ItemSet')).find(
        (isEl) => isEl.getAttribute('id') === activeItemSetId
      )) ||
    itemsRoot?.querySelector('ItemSet') ||
    itemsRoot;

  let flasksActive = false;
  const itemMap: Record<string, string> = {};
  doc.querySelectorAll('Items > Item, Item').forEach((itemEl) => {
    const id = itemEl.getAttribute('id');
    if (id) {
      itemMap[id] = itemEl.textContent || '';
    }
  });

  const slotMap: Record<string, string> = {};
  const slotElements = activeItemSetEl ? activeItemSetEl.querySelectorAll('Slot') : doc.querySelectorAll('Slot');
  slotElements.forEach((slotEl) => {
    const name = slotEl.getAttribute('name');
    const itemId = slotEl.getAttribute('itemId');
    if (name && itemId && itemId !== '0') {
      slotMap[name] = itemId;
      if (name.startsWith('Flask') && slotEl.getAttribute('active') === 'true') {
        flasksActive = true;
      }
    }
  });

  const config: ParsedPoBConfig = {
    enduranceCharges,
    maxEnduranceCharges,
    frenzyCharges,
    maxFrenzyCharges,
    powerCharges,
    maxPowerCharges,
    useEnduranceCharges: useEnduranceCharges || enduranceCharges > 0,
    useFrenzyCharges: useFrenzyCharges || frenzyCharges > 0,
    usePowerCharges: usePowerCharges || powerCharges > 0,
    fortify: Boolean(cfgBool['buffFortification'] || cfgBool['useFortify'] || pickStat(statMap, ['FortifyStacks'], 0) > 0),
    onslaught: Boolean(cfgBool['buffOnslaught']),
    enemyIsBoss: cfgStr['enemyIsBoss'] || 'None',
    flasksActive
  };

  // 3. Parse Items & Flasks from active ItemSet only
  const items: ParsedItem[] = [];
  const flasks: ParsedItem[] = [];
  let hasLifeOnBlock = false;
  let hasEsOnBlock = false;
  let physTakenAsEle = 0;

  const standardSlots = [
    'Weapon 1', 'Weapon 2', 'Helmet', 'Body Armour', 'Gloves', 'Boots',
    'Amulet', 'Ring 1', 'Ring 2', 'Belt',
    'Flask 1', 'Flask 2', 'Flask 3', 'Flask 4', 'Flask 5'
  ];

  standardSlots.forEach((slotName) => {
    const itemId = slotMap[slotName];
    if (itemId && itemMap[itemId]) {
      const parsedItem = parseSingleItem(itemId, slotName, itemMap[itemId]);
      if (slotName.startsWith('Flask')) {
        flasks.push(parsedItem);
      } else {
        items.push(parsedItem);
      }

      const allItemText = parsedItem.rawText;
      if (/Recover (?:[1-9]\d?%|\d+) of (?:Maximum )?Life on Block/i.test(allItemText) || /Life gained on Block/i.test(allItemText)) {
        hasLifeOnBlock = true;
      }
      if (/Recover (?:[1-9]\d?%|\d+) of (?:Maximum )?Energy Shield on Block/i.test(allItemText) || /Aegis Aurora/i.test(allItemText)) {
        hasEsOnBlock = true;
      }
      // Match ALL occurrences of phys taken as elemental/chaos on this item (e.g. helmet implicit + crafted mod)
      const physRegex = /(\d+)% of Physical Damage (?:from Hits )?taken as (?:Fire|Cold|Lightning|Chaos|Elemental)/gi;
      let pm;
      while ((pm = physRegex.exec(allItemText)) !== null) {
        physTakenAsEle += parseInt(pm[1], 10);
      }
    }
  });

  if (items.length === 0) {
    Object.entries(itemMap).forEach(([id, raw]) => {
      const parsedItem = parseSingleItem(id, `Item ${id}`, raw);
      if (parsedItem.slot.startsWith('Flask') || parsedItem.baseName.includes('Flask')) {
        flasks.push(parsedItem);
      } else {
        items.push(parsedItem);
      }
    });
  }

  // 4. Parse Tree Spec (activeSpec only — do NOT scan <Notes> text for keystones!)
  const treeRoot = doc.querySelector('Tree');
  const activeSpecIdx = Math.max(1, parseInt(treeRoot?.getAttribute('activeSpec') || '1', 10));
  const specs = Array.from(doc.querySelectorAll('Tree > Spec'));
  const specEl = specs[activeSpecIdx - 1] || specs[0] || doc.querySelector('Spec');

  const keystones: string[] = [];
  const allocatedHashes: number[] = [];
  let masteriesCount = 0;
  if (specEl) {
    const rawNodes = specEl.getAttribute('nodes') || '';
    if (rawNodes) {
      for (const tok of rawNodes.split(',')) {
        const n = parseInt(tok.trim(), 10);
        if (Number.isFinite(n) && n > 0) allocatedHashes.push(n);
      }
    }
    const masteryEffects = specEl.getAttribute('masteryEffects') || '';
    if (masteryEffects) {
      masteriesCount = (masteryEffects.match(/\{/g) || []).length;
    }
    // Check item mods (e.g. Skin of the Lords / Forbidden Flame / Timeless) + Spec nodes/overrides only (never Notes)
    const itemTextOnly = items.map((i) => i.rawText).join('\n').toLowerCase();
    const specTextOnly = (specEl.outerHTML || '').toLowerCase();
    const keystoneSearchScope = `${specTextOnly}\n${itemTextOnly}`;
    const commonKeystones = [
      'Glancing Blows',
      'Resolute Technique',
      'Elemental Overload',
      'Pain Attunement',
      'Chaos Inoculation',
      'Eldritch Battery',
      'Mind Over Matter',
      'Acrobatics',
      'Ghost Dance',
      'Iron Reflexes',
      'Unwavering Stance',
      'Point Blank',
      'Ancestral Bond',
      'Runebinder',
      "Zealot's Oath",
      'Divine Flesh',
      'Call to Arms',
      'Magebane',
      'Supreme Ego',
      'Eternal Youth',
      'Wicked Ward',
      'Lethe Shade',
      'Blood Magic'
    ];
    commonKeystones.forEach((k) => {
      if (keystoneSearchScope.includes(k.toLowerCase())) {
        keystones.push(k);
      }
    });
  }

  // Also infer Chaos Inoculation if Life === 1 and ES > 100
  const rawLife = pickStat(statMap, ['Life', 'TotalLife'], 0);
  const rawEs = pickStat(statMap, ['EnergyShield', 'TotalEnergyShield'], 0);
  if (rawLife === 1 && rawEs >= 100 && !keystones.includes('Chaos Inoculation')) {
    keystones.push('Chaos Inoculation');
  }

  const hasGlancingBlows = keystones.includes('Glancing Blows');

  // 5. Accurate Stats Extraction (no fake 75% res / 500k DPS / 3500 life fallbacks!)
  const critMultiRaw = pickStat(statMap, ['CritMultiplier'], 1.5);
  const critMultiPct = Math.round(critMultiRaw > 10 ? critMultiRaw : critMultiRaw * 100);

  const minionDPS = Math.round(
    pickStat(minionStatMap, ['CombinedDPS', 'TotalDPS', 'WithIgniteDPS', 'WithPoisonDPS', 'AverageDamage'], 0)
  );
  const fullDPS = Math.round(pickStat(statMap, ['FullDPS'], 0));
  const combinedOrTotalDPS = Math.round(
    pickStat(
      statMap,
      ['FullDPS', 'CombinedDPS', 'TotalDPS', 'WithIgniteDPS', 'WithPoisonDPS', 'WithBleedDPS', 'TotalDot', 'IgniteDPS'],
      minionDPS
    )
  );

  const stats: ParsedPoBStats = {
    life: Math.round(rawLife),
    energyShield: Math.round(rawEs),
    ward: Math.round(pickStat(statMap, ['Ward'], 0)),
    totalMana: Math.round(pickStat(statMap, ['Mana'], 0)),
    unreservedMana: Math.round(pickStat(statMap, ['ManaUnreserved'], 0)),
    manaRegen: parseFloat(pickStat(statMap, ['ManaRegenRecovery', 'ManaRegen'], 0).toFixed(1)),
    strength: Math.round(pickStat(statMap, ['Str'], 0)),
    dexterity: Math.round(pickStat(statMap, ['Dex'], 0)),
    intelligence: Math.round(pickStat(statMap, ['Int'], 0)),
    fireRes: Math.round(pickStat(statMap, ['FireResist'], 0)),
    fireResOverCap: Math.round(pickStat(statMap, ['FireResistOverCap'], 0)),
    coldRes: Math.round(pickStat(statMap, ['ColdResist'], 0)),
    coldResOverCap: Math.round(pickStat(statMap, ['ColdResistOverCap'], 0)),
    lightningRes: Math.round(pickStat(statMap, ['LightningResist'], 0)),
    lightningResOverCap: Math.round(pickStat(statMap, ['LightningResistOverCap'], 0)),
    chaosRes: Math.round(pickStat(statMap, ['ChaosResist'], keystones.includes('Chaos Inoculation') ? 100 : -60)),
    chaosResOverCap: Math.round(pickStat(statMap, ['ChaosResistOverCap'], 0)),
    maxFireRes: Math.round(pickStat(statMap, ['FireResistMax'], 75)),
    maxColdRes: Math.round(pickStat(statMap, ['ColdResistMax'], 75)),
    maxLightningRes: Math.round(pickStat(statMap, ['LightningResistMax'], 75)),
    maxChaosRes: Math.round(pickStat(statMap, ['ChaosResistMax'], 75)),
    armour: Math.round(pickStat(statMap, ['Armour'], 0)),
    evasion: Math.round(pickStat(statMap, ['Evasion'], 0)),
    evadeChance: Math.round(pickStat(statMap, ['MeleeEvadeChance', 'EvadeChance'], 0)),
    physDamageReduction: Math.round(pickStat(statMap, ['PhysicalDamageReduction'], 0)),
    spellSuppression: Math.round(pickStat(statMap, ['SpellSuppressionChance'], 0)),
    block: Math.round(pickStat(statMap, ['EffectiveBlockChance', 'BlockChance'], 0)),
    spellBlock: Math.round(pickStat(statMap, ['EffectiveSpellBlockChance', 'SpellBlockChance'], 0)),
    lifeRegen: Math.round(pickStat(statMap, ['LifeRegenRecovery', 'LifeRegen'], 0)),
    esRegen: Math.round(pickStat(statMap, ['EnergyShieldRegenRecovery', 'EnergyShieldRegen'], 0)),
    totalEHP: Math.round(pickStat(statMap, ['TotalEHP'], 0)),
    physMaxHit: Math.round(pickStat(statMap, ['PhysicalMaximumHitTaken'], 0)),
    fireMaxHit: Math.round(pickStat(statMap, ['FireMaximumHitTaken'], 0)),
    coldMaxHit: Math.round(pickStat(statMap, ['ColdMaximumHitTaken'], 0)),
    lightningMaxHit: Math.round(pickStat(statMap, ['LightningMaximumHitTaken'], 0)),
    chaosMaxHit: Math.round(pickStat(statMap, ['ChaosMaximumHitTaken'], 0)),
    averageDamage: Math.round(pickStat(statMap, ['AverageDamage', 'AverageHit'], 0)),
    attackRate: parseFloat(pickStat(statMap, ['Speed'], 0).toFixed(2)),
    hitChance: Math.round(pickStat(statMap, ['HitChance'], 100)),
    hitDPS: Math.round(pickStat(statMap, ['TotalDPS'], 0)),
    cullingDPS: Math.round(pickStat(statMap, ['CullingDPS'], 0)),
    totalDPS: combinedOrTotalDPS,
    fullDPS,
    dotDPS: Math.round(pickStat(statMap, ['TotalDot', 'IgniteDPS', 'BleedDPS', 'PoisonDPS'], 0)),
    minionDPS,
    critChance: parseFloat(pickStat(statMap, ['CritChance', 'PreEffectiveCritChance'], 0).toFixed(2)),
    critMulti: critMultiPct,
    movementSpeedMod: Math.round((pickStat(statMap, ['EffectiveMovementSpeedMod'], 1) - 1) * 100),
    manaUnreservedPercent: Math.round(pickStat(statMap, ['ManaUnreservedPercent'], 0)),
    mainLinkCount: 0,
    physTakenAsEle,
    hasLifeOnBlock,
    hasEsOnBlock,
    hasGlancingBlows
  };

  // 6. Parse Skills from the ACTIVE SkillSet ONLY (prevents duplicate Leveling + Endgame groups!)
  const skillsRoot = doc.querySelector('Skills');
  const activeSkillSetId = skillsRoot?.getAttribute('activeSkillSet') || '1';
  const activeSkillSetEl =
    (skillsRoot &&
      Array.from(skillsRoot.querySelectorAll('SkillSet')).find(
        (ss) => ss.getAttribute('id') === activeSkillSetId
      )) ||
    skillsRoot?.querySelector('SkillSet') ||
    skillsRoot;

  const skillElements = activeSkillSetEl
    ? Array.from(activeSkillSetEl.querySelectorAll('Skill'))
    : Array.from(doc.querySelectorAll('Skill'));

  const skillGroups: ParsedSkillGroup[] = [];
  let highestEffectiveLinks = 0;
  let primarySkillGroupId = '';
  let mainSkillFound = '';

  skillElements.forEach((skillEl, idx) => {
    const isEnabled = skillEl.getAttribute('enabled') !== 'false';
    const isMainSocketGroup = idx + 1 === mainSocketGroupIdx;
    const isMainActive =
      isMainSocketGroup ||
      skillEl.getAttribute('mainActiveSkill') === '1' ||
      skillEl.getAttribute('mainActiveSkillCalcs') === '1';
    const slot = skillEl.getAttribute('slot') || undefined;
    const label = skillEl.getAttribute('label') || slot || `Skill Group ${idx + 1}`;
    const groupId = `group-${idx + 1}`;

    const gems: ParsedGem[] = [];
    skillEl.querySelectorAll('Gem').forEach((gemEl) => {
      const rawName = gemEl.getAttribute('nameSpec') || gemEl.getAttribute('skillId') || 'Unknown Gem';
      const name = formatGemName(rawName);
      const gemLevel = parseInt(gemEl.getAttribute('level') || '20', 10);
      const gemQuality = parseInt(gemEl.getAttribute('quality') || '0', 10);
      const gemEnabled = gemEl.getAttribute('enabled') !== 'false';
      const isSupport =
        name.toLowerCase().includes('support') ||
        Boolean(gemEl.getAttribute('skillId')?.startsWith('Support'));

      gems.push({
        name,
        level: gemLevel,
        quality: gemQuality,
        enabled: gemEnabled,
        isSupport,
        color: getGemColor(name)
      });

      if (!isSupport && gemEnabled && isEnabled && (isMainSocketGroup || !mainSkillFound)) {
        mainSkillFound = name;
      }
    });

    let pseudoSupportNames: string[] = [];
    if (slot) {
      const matchingItem = items.find((i) => i.slot.toLowerCase() === slot.toLowerCase());
      if (matchingItem) {
        pseudoSupportNames = matchingItem.pseudoSupportMods;
      }
    }

    const physicalLinks = gems.filter((g) => g.enabled).length;
    const pseudoLinks = pseudoSupportNames.length;
    const effectiveLinks = physicalLinks + pseudoLinks;

    if (isMainSocketGroup) {
      primarySkillGroupId = groupId;
      highestEffectiveLinks = Math.max(highestEffectiveLinks, effectiveLinks);
    } else if (!primarySkillGroupId && effectiveLinks > highestEffectiveLinks && isEnabled) {
      highestEffectiveLinks = effectiveLinks;
      primarySkillGroupId = groupId;
    }

    if (gems.length > 0) {
      skillGroups.push({
        id: groupId,
        label,
        slot,
        enabled: isEnabled,
        isMain: isMainActive,
        gems,
        physicalLinks,
        pseudoLinks,
        effectiveLinks,
        pseudoSupportNames
      });
    }
  });

  const chosenGroup = skillGroups.find((g) => g.id === primarySkillGroupId) || skillGroups[0];
  stats.mainLinkCount = chosenGroup?.effectiveLinks || highestEffectiveLinks || 0;
  const selectedSkillGroupId = chosenGroup?.id || 'group-1';
  const mainSkillName = mainSkillFound || chosenGroup?.gems.find((g) => !g.isSupport)?.name || 'Main Skill';

  const { activeAuras, guardSkills } = detectAurasAndGuards(skillGroups);

  return {
    characterName,
    className,
    ascendClassName,
    level,
    mainSkillName,
    selectedSkillGroupId,
    dataSource: 'pob',
    stats,
    config,
    activeAuras,
    guardSkills,
    skillGroups,
    items,
    flasks,
    keystones,
    allocatedHashes,
    masteriesCount
  };
}

function parseSingleItem(id: string, slot: string, rawText: string): ParsedItem {
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
  let rarity: 'NORMAL' | 'MAGIC' | 'RARE' | 'UNIQUE' = 'RARE';
  let name = slot;
  let baseName = '';
  let itemLevel: number | undefined;
  let quality: number | undefined;
  let reqStr: number | undefined;
  let reqDex: number | undefined;
  let reqInt: number | undefined;

  const implicitMods: string[] = [];
  const explicitMods: string[] = [];
  const eldritchMods: string[] = [];
  const craftedMods: string[] = [];
  const fracturedMods: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('Rarity:')) {
      const r = line.replace('Rarity:', '').trim().toUpperCase();
      if (r === 'UNIQUE' || r === 'RARE' || r === 'MAGIC' || r === 'NORMAL') {
        rarity = r as any;
      }
      if (lines[i + 1] && !lines[i + 1].startsWith('--------')) {
        name = lines[i + 1];
        if (lines[i + 2] && !lines[i + 2].startsWith('--------')) {
          baseName = lines[i + 2];
        }
      }
    } else if (line.startsWith('Item Level:')) {
      itemLevel = parseInt(line.replace('Item Level:', '').trim(), 10);
    } else if (line.startsWith('Quality:')) {
      quality = parseInt(line.replace(/[^0-9]/g, ''), 10);
    } else if (line.startsWith('Requires Level')) {
      const strMatch = line.match(/(\d+)\s+Str/);
      const dexMatch = line.match(/(\d+)\s+Dex/);
      const intMatch = line.match(/(\d+)\s+Int/);
      if (strMatch) reqStr = parseInt(strMatch[1], 10);
      if (dexMatch) reqDex = parseInt(dexMatch[1], 10);
      if (intMatch) reqInt = parseInt(intMatch[1], 10);
    } else if (line.startsWith('{crafted}')) {
      craftedMods.push(line.replace('{crafted}', '').trim());
    } else if (line.startsWith('{fractured}')) {
      fracturedMods.push(line.replace('{fractured}', '').trim());
    } else if (line.startsWith('{custom}') || line.includes('Searing Exarch') || line.includes('Eater of Worlds') || line.startsWith('{tags:')) {
      eldritchMods.push(line.replace(/\{[^\}]+\}/g, '').trim());
    } else if (line.startsWith('{implicit}')) {
      implicitMods.push(line.replace('{implicit}', '').trim());
    } else if (!line.startsWith('--------') && !line.startsWith('Requirements:') && !line.startsWith('Implicits:')) {
      const cleanMod = line.replace(/\{[^\}]+\}/g, '').trim();
      if (cleanMod && !cleanMod.startsWith('Unique ID:')) {
        explicitMods.push(cleanMod);
      }
    }
  }

  const allMods = [...implicitMods, ...explicitMods, ...eldritchMods, ...craftedMods, ...fracturedMods];
  const pseudoSupportMods = detectPseudoSupportMods(allMods);

  const totalExplicitCount = explicitMods.length + craftedMods.length + fracturedMods.length;
  const openPrefixes = rarity === 'RARE' ? Math.max(0, 3 - Math.ceil(totalExplicitCount / 2)) : 0;
  const openSuffixes = rarity === 'RARE' ? Math.max(0, 3 - Math.floor(totalExplicitCount / 2)) : 0;

  return {
    id,
    slot,
    name: name || slot,
    baseName: baseName || name,
    rarity,
    itemLevel,
    quality,
    reqStr: reqStr || 0,
    reqDex: reqDex || 0,
    reqInt: reqInt || 0,
    implicitMods,
    explicitMods,
    eldritchMods,
    craftedMods,
    fracturedMods,
    pseudoSupportMods,
    openPrefixes,
    openSuffixes,
    rawText
  };
}
