import { deflate } from 'pako';
import type { CharacterGearSnapshot, PaperdollItem } from '../components/profile/CharacterPaperdollView';

const CLASS_TO_POB_ID: Record<string, { classId: number; ascendancyId: number; baseClass: string }> = {
  scion: { classId: 0, ascendancyId: 0, baseClass: 'Scion' },
  ascendant: { classId: 0, ascendancyId: 1, baseClass: 'Scion' },
  marauder: { classId: 1, ascendancyId: 0, baseClass: 'Marauder' },
  juggernaut: { classId: 1, ascendancyId: 1, baseClass: 'Marauder' },
  berserker: { classId: 1, ascendancyId: 2, baseClass: 'Marauder' },
  chieftain: { classId: 1, ascendancyId: 3, baseClass: 'Marauder' },
  ranger: { classId: 2, ascendancyId: 0, baseClass: 'Ranger' },
  warden: { classId: 2, ascendancyId: 1, baseClass: 'Ranger' },
  deadeye: { classId: 2, ascendancyId: 2, baseClass: 'Ranger' },
  pathfinder: { classId: 2, ascendancyId: 3, baseClass: 'Ranger' },
  raider: { classId: 2, ascendancyId: 1, baseClass: 'Ranger' },
  witch: { classId: 3, ascendancyId: 0, baseClass: 'Witch' },
  necromancer: { classId: 3, ascendancyId: 1, baseClass: 'Witch' },
  elementalist: { classId: 3, ascendancyId: 2, baseClass: 'Witch' },
  occultist: { classId: 3, ascendancyId: 3, baseClass: 'Witch' },
  duelist: { classId: 4, ascendancyId: 0, baseClass: 'Duelist' },
  slayer: { classId: 4, ascendancyId: 1, baseClass: 'Duelist' },
  gladiator: { classId: 4, ascendancyId: 2, baseClass: 'Duelist' },
  champion: { classId: 4, ascendancyId: 3, baseClass: 'Duelist' },
  templar: { classId: 5, ascendancyId: 0, baseClass: 'Templar' },
  inquisitor: { classId: 5, ascendancyId: 1, baseClass: 'Templar' },
  hierophant: { classId: 5, ascendancyId: 2, baseClass: 'Templar' },
  guardian: { classId: 5, ascendancyId: 3, baseClass: 'Templar' },
  shadow: { classId: 6, ascendancyId: 0, baseClass: 'Shadow' },
  assassin: { classId: 6, ascendancyId: 1, baseClass: 'Shadow' },
  trickster: { classId: 6, ascendancyId: 2, baseClass: 'Shadow' },
  saboteur: { classId: 6, ascendancyId: 3, baseClass: 'Shadow' }
};

const SLOT_TO_POB_NAME: Record<string, string> = {
  Weapon: 'Weapon 1',
  Offhand: 'Weapon 2',
  Weapon2: 'Weapon 1 Swap',
  Offhand2: 'Weapon 2 Swap',
  Helm: 'Helmet',
  BodyArmour: 'Body Armour',
  Gloves: 'Gloves',
  Boots: 'Boots',
  Amulet: 'Amulet',
  Ring: 'Ring 1',
  Ring2: 'Ring 2',
  Belt: 'Belt'
};

const RARITY_BY_FRAME: Record<number, string> = {
  0: 'NORMAL',
  1: 'MAGIC',
  2: 'RARE',
  3: 'UNIQUE',
  9: 'RELIC'
};

function escXml(val: string): string {
  return String(val || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatSocketsForPob(item: PaperdollItem): string {
  if (!Array.isArray(item.sockets) || item.sockets.length === 0) return '';
  const groups = new Map<number, string[]>();
  for (const s of item.sockets) {
    const col = s.sColour || 'W';
    const arr = groups.get(s.group) || [];
    arr.push(col);
    groups.set(s.group, arr);
  }
  return Array.from(groups.values())
    .map((g) => g.join('-'))
    .join(' ');
}

function serializePobItemText(item: PaperdollItem): string {
  const lines: string[] = [];
  const rarity = RARITY_BY_FRAME[item.frameType] || 'RARE';
  lines.push(`Rarity: ${rarity}`);
  if (item.name) lines.push(item.name);
  if (item.baseType || item.typeLine) lines.push(item.baseType || item.typeLine);
  if (item.ilvl > 0) lines.push(`Item Level: ${item.ilvl}`);
  const sock = formatSocketsForPob(item);
  if (sock) lines.push(`Sockets: ${sock}`);

  const implicits = [
    ...(item.implicitMods || []),
    ...(item.enchantMods || []).map((m) => `{crafted}${m}`)
  ];
  lines.push(`Implicits: ${implicits.length}`);
  for (const imp of implicits) lines.push(imp);

  for (const fm of item.fracturedMods || []) lines.push(`{fractured}${fm}`);
  for (const em of item.explicitMods || []) lines.push(em);
  for (const cm of item.craftedMods || []) lines.push(`{crafted}${cm}`);
  if (item.corrupted) lines.push('Corrupted');

  return lines.join('\n');
}

/**
 * Generates a valid, importable Path of Building (PoB) Base64URL+zlib string
 * directly from a synced Exile SSF CharacterGearSnapshot.
 */
export function encodeSnapshotToPobCode(snapshot: CharacterGearSnapshot): string {
  const classKey = (snapshot.character.className || 'Scion').toLowerCase().trim();
  const classMeta = CLASS_TO_POB_ID[classKey] || CLASS_TO_POB_ID.scion;
  const level = Math.max(1, Math.min(100, Number(snapshot.character.level || 1)));
  const nodesStr = (snapshot.passives.allocatedHashes || []).join(',');

  // Serialize Items & Slots
  const itemElements: string[] = [];
  const slotElements: string[] = [];
  let flaskCounter = 1;

  snapshot.equipped.forEach((it, idx) => {
    const id = idx + 1;
    itemElements.push(`    <Item id="${id}">\n${escXml(serializePobItemText(it))}\n    </Item>`);
    if (it.inventoryId === 'Flask') {
      const slotName = `Flask ${flaskCounter++}`;
      slotElements.push(`      <Slot name="${slotName}" itemId="${id}"/>`);
    } else if (SLOT_TO_POB_NAME[it.inventoryId]) {
      slotElements.push(`      <Slot name="${SLOT_TO_POB_NAME[it.inventoryId]}" itemId="${id}"/>`);
    }
  });

  // Serialize Skill Gem Groups
  const skillElements: string[] = [];
  for (const it of snapshot.equipped) {
    if (!Array.isArray(it.socketedGems) || it.socketedGems.length === 0) continue;
    const slotName = SLOT_TO_POB_NAME[it.inventoryId] || '';
    const gemTags = it.socketedGems
      .map(
        (g) =>
          `      <Gem nameSpec="${escXml(g.name)}" level="${g.level || 1}" quality="${g.quality || 0}" enabled="true"/>`
      )
      .join('\n');
    skillElements.push(
      `    <Skill slot="${escXml(slotName)}" enabled="true" includeInFullDPS="true">\n${gemTags}\n    </Skill>`
    );
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<PathOfBuilding>
  <Build level="${level}" targetVersion="3_0" className="${escXml(classMeta.baseClass)}" ascendClassName="${escXml(snapshot.character.className || 'None')}" mainSocketGroup="1">
    <PlayerStat stat="Level" value="${level}"/>
  </Build>
  <Tree activeSpec="1">
    <Spec title="${escXml(snapshot.character.name)}" treeVersion="3_25" classId="${classMeta.classId}" ascendClassId="${classMeta.ascendancyId}" nodes="${nodesStr}"/>
  </Tree>
  <Skills activeSkillSet="1">
    <SkillSet id="1">
${skillElements.join('\n')}
    </SkillSet>
  </Skills>
  <Items activeItemSet="1">
${itemElements.join('\n')}
    <ItemSet id="1">
${slotElements.join('\n')}
    </ItemSet>
  </Items>
  <Notes>Exported from Exile SSF Character Armory (${escXml(snapshot.character.name)} • Lv ${level} ${escXml(snapshot.character.className)} • ${escXml(snapshot.character.league)})</Notes>
</PathOfBuilding>`;

  const compressed = deflate(xml);
  let binary = '';
  for (let i = 0; i < compressed.length; i++) {
    binary += String.fromCharCode(compressed[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_');
}
