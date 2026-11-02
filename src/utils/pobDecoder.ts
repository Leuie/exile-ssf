import { inflate } from 'pako';
import type { 
  ParsedCharacter, 
  ParsedPoBStats, 
  ParsedSkillGroup, 
  ParsedItem, 
  ParsedGem 
} from '../types/analyzer';

/**
 * Clean Base64 input
 */
function cleanBase64(input: string): string {
  let cleaned = input.trim().replace(/\s/g, '').replace(/-/g, '+').replace(/_/g, '/');
  while (cleaned.length % 4 !== 0) {
    cleaned += '=';
  }
  return cleaned;
}

/**
 * Decode Base64 string to Uint8Array
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Decompress PoB base64 string to raw XML
 */
export function decodePoBCode(code: string): string {
  const trimmed = code.trim();
  
  if (trimmed.startsWith('<PathOfBuilding') || trimmed.includes('<PathOfBuilding>')) {
    return trimmed;
  }

  try {
    const cleaned = cleanBase64(trimmed);
    const bytes = base64ToUint8Array(cleaned);
    const decompressed = inflate(bytes);
    return new TextDecoder('utf-8').decode(decompressed);
  } catch (err) {
    throw new Error('Invalid or corrupted Path of Building export string. Please copy the complete code directly from PoB.');
  }
}

/**
 * Helper to determine gem socket color
 */
function getGemColor(name: string): 'R' | 'G' | 'B' | 'W' {
  const n = name.toLowerCase();
  // Red (Strength)
  if (n.includes('strike') || n.includes('slam') || n.includes('fire') || n.includes('anger') || n.includes('determination') || n.includes('brutality') || n.includes('fortify') || n.includes('ruthless') || n.includes('vitality') || n.includes('purity of fire') || n.includes('molten') || n.includes('boneshatter') || n.includes('cleave') || n.includes('shield crush') || n.includes('enduring') || n.includes('heavy') || n.includes('infernal') || n.includes('purity')) {
    return 'R';
  }
  // Green (Dexterity)
  if (n.includes('arrow') || n.includes('bow') || n.includes('grace') || n.includes('hatred') || n.includes('herald of ice') || n.includes('herald of ash') || n.includes('trinity') || n.includes('swift affliction') || n.includes('deadly ailments') || n.includes('dash') || n.includes('frenzy') || n.includes('sniper') || n.includes('blade') || n.includes('poison') || n.includes('barrage') || n.includes('tornado') || n.includes('haste') || n.includes('puncture')) {
    return 'G';
  }
  // White
  if (n.includes('portal') || n.includes('detonate') || n.includes('prismatic')) {
    return 'W';
  }
  // Blue (Intelligence) default
  return 'B';
}

/**
 * Formats camelCase or compact skill IDs into human readable names
 */
function formatGemName(rawName: string): string {
  if (!rawName) return 'Unknown Gem';
  if (rawName.includes(' ')) return rawName;
  
  // Mapping common unspaced skill IDs
  const knownMap: Record<string, string> = {
    'PenanceBrand': 'Penance Brand',
    'WaveOfConviction': 'Wave of Conviction',
    'ElementalWeakness': 'Elemental Weakness',
    'ArcanistBrand': 'Arcanist Brand',
    'SupportArcanistBrand': 'Arcanist Brand Support',
    'SupportSwiftbrand': 'Swiftbrand Support',
    'SupportDeadlyAilments': 'Deadly Ailments Support',
    'SupportUnboundAilments': 'Unbound Ailments Support',
    'SupportCruelty': 'Cruelty Support',
    'SupportSwiftAffliction': 'Swift Affliction Support',
    'SupportBurningDamage': 'Burning Damage Support',
    'SupportCombustion': 'Combustion Support',
    'SupportIgniteProliferation': 'Ignite Proliferation Support',
    'SupportTrinity': 'Trinity Support',
    'SupportMeleePhysicalDamage': 'Melee Physical Damage Support',
    'SupportBrutality': 'Brutality Support',
    'SupportFortify': 'Fortify Support',
    'SupportRuthless': 'Ruthless Support',
    'HeraldOfAsh': 'Herald of Ash',
    'HeraldOfThunder': 'Herald of Thunder',
    'HeraldOfPurity': 'Herald of Purity',
    'SummonFlameGolem': 'Summon Flame Golem',
    'SummonStoneGolem': 'Summon Stone Golem',
    'SummonChaosGolem': 'Summon Chaos Golem',
    'SummonLightningGolem': 'Summon Lightning Golem',
    'LightningArrow': 'Lightning Arrow',
    'TornadoShot': 'Tornado Shot',
    'Boneshatter': 'Boneshatter'
  };

  if (knownMap[rawName]) return knownMap[rawName];
  // Insert spaces before capital letters
  return rawName.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^Support\s+/, '') + (rawName.startsWith('Support') ? ' Support' : '');
}

/**
 * Detects all pseudo-support mods, essence mods, and influence multipliers on gear items
 */
function detectPseudoSupportMods(mods: string[]): string[] {
  const pseudoSupports: string[] = [];
  const fullText = mods.join(' \n ');

  // Essence of Horror (Helmet)
  if (/Socketed Gems deal 30% more Elemental Damage/i.test(fullText) || /30% more Elemental Damage/i.test(fullText)) {
    pseudoSupports.push('30% More Elemental Damage (Essence of Horror)');
  }
  // Essence of Delirium (Gloves)
  if (/Socketed Gems deal 30% more Damage over Time/i.test(fullText) || /30% more Damage over Time/i.test(fullText)) {
    pseudoSupports.push('30% More Damage over Time (Essence of Delirium)');
  }
  // Essence of Hysteria (Boots / Weapon / Helmet)
  if (/Socketed Gems have \+3\.5% to Critical Strike Chance/i.test(fullText) || /Socketed Spells have \+3% to Critical Strike Chance/i.test(fullText) || /Socketed Gems have \+3% to Critical Strike Chance/i.test(fullText)) {
    pseudoSupports.push('+3.5% Base Spell Crit (Essence of Hysteria)');
  }
  if (/Socketed Gems deal 50% of Physical Damage as Extra Fire/i.test(fullText)) {
    pseudoSupports.push('50% Phys as Extra Fire (Essence of Hysteria)');
  }
  // Essence of Insanity (Gloves)
  if (/Socketed Gems have 16% more Attack and Cast Speed/i.test(fullText)) {
    pseudoSupports.push('16% More Cast Speed (Essence of Insanity)');
  }

  // Elder / Shaper / Influenced built in gem supports
  const supportRegex = /Socketed (?:Gems|Spells|Attacks) are Supported by Level (\d+) ([^,.\n]+)/gi;
  let match;
  while ((match = supportRegex.exec(fullText)) !== null) {
    const level = match[1];
    const suppName = match[2].trim();
    if (!pseudoSupports.some(p => p.toLowerCase().includes(suppName.toLowerCase()))) {
      pseudoSupports.push(`Level ${level} ${suppName} Support`);
    }
  }

  // Common Elder / Shaper specific patterns
  if (/Supported by Level \d+ Burning Damage/i.test(fullText) && !pseudoSupports.some(p => p.includes('Burning Damage'))) {
    pseudoSupports.push('Level 20 Burning Damage Support');
  }
  if (/Supported by Level \d+ Concentrated Effect/i.test(fullText) && !pseudoSupports.some(p => p.includes('Concentrated Effect'))) {
    pseudoSupports.push('Level 20 Concentrated Effect Support');
  }
  if (/Supported by Level \d+ Faster Casting/i.test(fullText) && !pseudoSupports.some(p => p.includes('Faster Casting'))) {
    pseudoSupports.push('Level 20 Faster Casting Support');
  }
  if (/Supported by Level \d+ Hypothermia/i.test(fullText) && !pseudoSupports.some(p => p.includes('Hypothermia'))) {
    pseudoSupports.push('Level 20 Hypothermia Support');
  }
  if (/Supported by Level \d+ Trap and Mine Damage/i.test(fullText) && !pseudoSupports.some(p => p.includes('Trap and Mine Damage'))) {
    pseudoSupports.push('Level 20 Trap & Mine Damage Support');
  }
  if (/Supported by the Main Hand Weapon/i.test(fullText) || /The Squire/i.test(fullText)) {
    pseudoSupports.push('+3 Main Hand Link Multipliers (The Squire)');
  }

  return pseudoSupports;
}

/**
 * Parse full PoB XML into a rich ParsedCharacter model
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
  const characterName = buildEl?.getAttribute('characterName') || `${ascendClassName !== 'None' ? ascendClassName : className} (Level ${level})`;

  // Player Stats
  const statMap: Record<string, number> = {};
  doc.querySelectorAll('PlayerStat').forEach((statEl) => {
    const statName = statEl.getAttribute('stat');
    const statVal = parseFloat(statEl.getAttribute('value') || '0');
    if (statName) {
      statMap[statName] = statVal;
    }
  });

  // Parse Items & Slots across all ItemSets
  const itemMap: Record<string, string> = {};
  doc.querySelectorAll('Item').forEach((itemEl) => {
    const id = itemEl.getAttribute('id');
    if (id) {
      itemMap[id] = itemEl.textContent || '';
    }
  });

  const slotMap: Record<string, string> = {}; // slotName -> itemId
  // Query all Slot tags across the document (supports <ItemSet> and <Items>)
  doc.querySelectorAll('Slot').forEach((slotEl) => {
    const name = slotEl.getAttribute('name');
    const itemId = slotEl.getAttribute('itemId');
    if (name && itemId && !slotMap[name]) {
      slotMap[name] = itemId;
    }
  });

  const items: ParsedItem[] = [];
  const flasks: ParsedItem[] = [];
  let hasLifeOnBlock = false;
  let hasEsOnBlock = false;
  let physTakenAsEle = 0;

  // Process all equipment slots
  const standardSlots = [
    'Weapon 1', 'Weapon 2', 'Helmet', 'Body Armour', 'Gloves', 'Boots', 
    'Amulet', 'Ring 1', 'Ring 2', 'Belt', 
    'Flask 1', 'Flask 2', 'Flask 3', 'Flask 4', 'Flask 5'
  ];

  const processedItemIds = new Set<string>();

  standardSlots.forEach((slotName) => {
    const itemId = slotMap[slotName];
    if (itemId && itemMap[itemId]) {
      processedItemIds.add(itemId);
      const parsedItem = parseSingleItem(itemId, slotName, itemMap[itemId]);
      if (slotName.startsWith('Flask')) {
        flasks.push(parsedItem);
      } else {
        items.push(parsedItem);
      }

      // Check on-block recovery and phys taken as ele
      const allItemText = parsedItem.rawText;
      if (/Recover (?:[1-5]%|\d+) of (?:Maximum )?Life on Block/i.test(allItemText) || /Life gained on Block/i.test(allItemText)) {
        hasLifeOnBlock = true;
      }
      if (/Recover (?:[1-5]%|\d+) of (?:Maximum )?Energy Shield on Block/i.test(allItemText) || /Aegis Aurora/i.test(allItemText)) {
        hasEsOnBlock = true;
      }
      const physTakenMatch = allItemText.match(/(\d+)% of Physical Damage (?:from Hits )?taken as (?:Fire|Cold|Lightning|Chaos|Elemental)/i);
      if (physTakenMatch) {
        physTakenAsEle += parseInt(physTakenMatch[1], 10);
      }
    }
  });

  // Fallback: If no slots were populated, parse raw items directly
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

  // Parse Tree Keystones & Masteries
  const keystones: string[] = [];
  let masteriesCount = 0;
  const specEl = doc.querySelector('Tree > Spec') || doc.querySelector('Spec');
  if (specEl) {
    const masteryEffects = specEl.getAttribute('masteryEffects') || '';
    if (masteryEffects) {
      masteriesCount = (masteryEffects.match(/\{/g) || []).length || 2;
    }
    const xmlLower = xml.toLowerCase();
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
      'Zealot\'s Oath',
      'Divine Flesh',
      'Call to Arms'
    ];
    commonKeystones.forEach((k) => {
      if (xmlLower.includes(k.toLowerCase())) {
        keystones.push(k);
      }
    });
  }

  const hasGlancingBlows = keystones.includes('Glancing Blows');

  const stats: ParsedPoBStats = {
    life: Math.round(statMap['Life'] || statMap['TotalLife'] || 3500),
    energyShield: Math.round(statMap['EnergyShield'] || statMap['TotalEnergyShield'] || 0),
    fireRes: Math.round(statMap['FireResist'] || 75),
    fireResOverCap: Math.round(statMap['FireResistOverCap'] || 0),
    coldRes: Math.round(statMap['ColdResist'] || 75),
    coldResOverCap: Math.round(statMap['ColdResistOverCap'] || 0),
    lightningRes: Math.round(statMap['LightningResist'] || 75),
    lightningResOverCap: Math.round(statMap['LightningResistOverCap'] || 0),
    chaosRes: Math.round(statMap['ChaosResist'] || -20),
    chaosResOverCap: Math.round(statMap['ChaosResistOverCap'] || 0),
    maxFireRes: Math.round(statMap['FireResistMax'] || 75),
    maxColdRes: Math.round(statMap['ColdResistMax'] || 75),
    maxLightningRes: Math.round(statMap['LightningResistMax'] || 75),
    maxChaosRes: Math.round(statMap['ChaosResistMax'] || 75),
    armour: Math.round(statMap['Armour'] || 0),
    evasion: Math.round(statMap['Evasion'] || 0),
    spellSuppression: Math.round(statMap['SpellSuppressionChance'] || 0),
    block: Math.round(statMap['BlockChance'] || statMap['EffectiveBlockChance'] || 0),
    spellBlock: Math.round(statMap['SpellBlockChance'] || statMap['EffectiveSpellBlockChance'] || 0),
    lifeRegen: Math.round(statMap['LifeRegenRecovery'] || statMap['LifeRegen'] || 0),
    totalDPS: Math.round(statMap['TotalDPS'] || statMap['CombinedDPS'] || statMap['TotalDot'] || statMap['IgniteDPS'] || 500000),
    dotDPS: Math.round(statMap['TotalDot'] || statMap['IgniteDPS'] || statMap['BleedDPS'] || statMap['PoisonDPS'] || 0),
    critChance: parseFloat((statMap['CritChance'] || statMap['PreEffectiveCritChance'] || 0).toFixed(1)),
    critMulti: Math.round((statMap['CritMultiplier'] || 1.5) * (statMap['CritMultiplier'] && statMap['CritMultiplier'] > 10 ? 1 : 100)),
    manaUnreservedPercent: Math.round(statMap['ManaUnreservedPercent'] || 10),
    mainLinkCount: 4,
    physTakenAsEle,
    hasLifeOnBlock,
    hasEsOnBlock,
    hasGlancingBlows
  };

  // Parse ALL Skills & Skill Groups across all SkillSets (using universal doc.querySelectorAll('Skill'))
  const skillGroups: ParsedSkillGroup[] = [];
  const skillElements = doc.querySelectorAll('Skill');
  let highestEffectiveLinks = 0;
  let primarySkillGroupId = '';
  let mainSkillFound = '';

  skillElements.forEach((skillEl, idx) => {
    const isEnabled = skillEl.getAttribute('enabled') !== 'false';
    const isMainActive = skillEl.getAttribute('mainActiveSkill') === '1' || skillEl.getAttribute('mainActiveSkillCalcs') === '1';
    const slot = skillEl.getAttribute('slot') || undefined;
    const label = skillEl.getAttribute('label') || slot || `Skill Group ${idx + 1}`;
    const groupId = `group-${idx + 1}`;

    const gems: ParsedGem[] = [];
    const gemEls = skillEl.querySelectorAll('Gem');
    gemEls.forEach((gemEl) => {
      const rawName = gemEl.getAttribute('nameSpec') || gemEl.getAttribute('skillId') || 'Unknown Gem';
      const name = formatGemName(rawName);
      const gemLevel = parseInt(gemEl.getAttribute('level') || '20', 10);
      const gemQuality = parseInt(gemEl.getAttribute('quality') || '0', 10);
      const gemEnabled = gemEl.getAttribute('enabled') !== 'false';
      const isSupport = name.toLowerCase().includes('support') || !!gemEl.getAttribute('skillId')?.startsWith('Support');

      gems.push({
        name,
        level: gemLevel,
        quality: gemQuality,
        enabled: gemEnabled,
        isSupport,
        color: getGemColor(name)
      });

      if (!isSupport && gemEnabled && !mainSkillFound && isEnabled) {
        mainSkillFound = name;
      }
    });

    // Check matching item in slot for pseudo-supports
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

    if (effectiveLinks > highestEffectiveLinks) {
      highestEffectiveLinks = effectiveLinks;
      primarySkillGroupId = groupId;
    }

    if (gems.length > 0) {
      skillGroups.push({
        id: groupId,
        label,
        slot,
        enabled: isEnabled,
        isMain: isMainActive || (primarySkillGroupId === groupId),
        gems,
        physicalLinks,
        pseudoLinks,
        effectiveLinks,
        pseudoSupportNames
      });
    }
  });

  stats.mainLinkCount = highestEffectiveLinks || 4;
  const selectedSkillGroupId = primarySkillGroupId || (skillGroups[0]?.id || 'group-1');
  const mainSkillName = mainSkillFound || 'Main Skill';

  return {
    characterName,
    className,
    ascendClassName,
    level,
    mainSkillName,
    selectedSkillGroupId,
    stats,
    skillGroups,
    items,
    flasks,
    keystones,
    masteriesCount
  };
}

/**
 * Parses a single item raw text into structured ParsedItem
 */
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
