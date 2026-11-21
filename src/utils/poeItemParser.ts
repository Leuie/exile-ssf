import { inflate } from 'pako';
import type { WishlistItemCategory } from '../types';

export interface ParsedPoeTooltip {
  isTooltip: boolean;
  itemName: string;
  baseType?: string;
  rarity: 'Unique' | 'Rare' | 'Magic' | 'Gem' | 'Currency' | 'Divination Card' | 'Other';
  category: WishlistItemCategory;
  itemLevel?: number;
  mods: string[];
}

export function parsePoeClipboardTooltip(rawText: string): ParsedPoeTooltip | null {
  if (!rawText || !rawText.includes('Rarity:')) return null;

  const lines = rawText
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const rarityLine = lines.find((l) => l.startsWith('Rarity:'));
  if (!rarityLine) return null;

  const rarityRaw = rarityLine.replace('Rarity:', '').trim();
  const rarityIdx = lines.indexOf(rarityLine);
  const itemName = lines[rarityIdx + 1] || '';
  const potentialBase = lines[rarityIdx + 2] && !lines[rarityIdx + 2].startsWith('--------') ? lines[rarityIdx + 2] : undefined;

  if (!itemName) return null;

  const ilvlLine = lines.find((l) => l.startsWith('Item Level:'));
  const itemLevel = ilvlLine ? parseInt(ilvlLine.replace('Item Level:', '').trim(), 10) : undefined;

  const classLine = lines.find((l) => l.startsWith('Item Class:')) || '';
  const classLow = classLine.toLowerCase();

  let rarity: ParsedPoeTooltip['rarity'] = 'Other';
  let category: WishlistItemCategory = 'Other';

  if (rarityRaw.toLowerCase() === 'unique') {
    rarity = 'Unique';
    category = 'Unique';
  } else if (rarityRaw.toLowerCase() === 'gem') {
    rarity = 'Gem';
    if (itemName.toLowerCase().includes('awakened ')) category = 'Awakened Gem';
    else if (itemName.toLowerCase().includes('vaal ')) category = 'Vaal Gem';
    else if (itemName.includes(' of ')) category = 'Transfigured Gem';
    else category = 'Gem';
  } else if (rarityRaw.toLowerCase() === 'divination card') {
    rarity = 'Divination Card';
    category = 'Div Card';
  } else if (rarityRaw.toLowerCase() === 'currency') {
    rarity = 'Currency';
    if (itemName.toLowerCase().includes('essence')) category = 'Essence';
    else if (itemName.toLowerCase().includes('fossil')) category = 'Fossil / Resonator';
    else if (itemName.toLowerCase().includes('oil')) category = 'Oil / Enchant';
    else if (itemName.toLowerCase().includes('catalyst')) category = 'Catalyst';
    else if (itemName.toLowerCase().includes('delirium orb')) category = 'Delirium Orb';
    else if (itemName.toLowerCase().includes('thread')) category = 'Thread of Creation';
    else category = 'Currency';
  } else if (rarityRaw.toLowerCase() === 'rare') {
    rarity = 'Rare';
    if (itemName.toLowerCase().includes('cluster jewel') || (potentialBase && potentialBase.toLowerCase().includes('cluster jewel'))) {
      category = 'Cluster Jewel';
    } else if (classLow.includes('jewel')) {
      category = 'Jewel';
    } else if (classLow.includes('map')) {
      category = 'Map';
    } else {
      category = 'Base / Crafting';
    }
  } else if (rarityRaw.toLowerCase() === 'magic') {
    rarity = 'Magic';
    category = classLow.includes('flask') ? 'Flask / Tincture' : 'Base / Crafting';
  } else if (classLow.includes('fragment') || itemName.toLowerCase().includes('fragment')) {
    category = 'Fragment / Boss';
  } else if (classLow.includes('scarab') || itemName.toLowerCase().includes('scarab')) {
    category = 'Scarab';
  }

  // Extract notable explicit / implicit mod lines (skip metadata headers and divider dashes)
  const sections = rawText.replace(/\r\n/g, '\n').split('--------');
  const mods: string[] = [];
  for (let i = 1; i < sections.length; i++) {
    const secLines = sections[i]
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const isMeta = secLines.some(
      (l) =>
        l.startsWith('Requirements:') ||
        l.startsWith('Sockets:') ||
        l.startsWith('Item Level:') ||
        l.startsWith('Armour:') ||
        l.startsWith('Energy Shield:') ||
        l.startsWith('Evasion Rating:') ||
        l.startsWith('Quality:') ||
        l.startsWith('Physical Damage:') ||
        l.startsWith('Attacks per Second:') ||
        l.startsWith('Note:')
    );
    if (!isMeta && secLines.length > 0 && !secLines[0].startsWith('Place into')) {
      for (const ml of secLines) {
        if (ml.length > 3 && ml.length < 140 && !ml.startsWith('{') && mods.length < 10) {
          mods.push(ml);
        }
      }
    }
  }

  return {
    isTooltip: true,
    itemName,
    baseType: potentialBase,
    rarity,
    category,
    itemLevel: Number.isFinite(itemLevel) ? itemLevel : undefined,
    mods
  };
}

export interface ExtractedPobWishlistItem {
  itemName: string;
  category: WishlistItemCategory;
  notes: string;
}

export type ExtractedPobItem = ExtractedPobWishlistItem;

export function extractWishlistItemsFromPobCode(rawInput: string): ExtractedPobWishlistItem[] {
  const trimmed = rawInput.trim();
  if (!trimmed) return [];

  const results: ExtractedPoeMap = new Map();

  // Attempt base64 zlib Path of Building XML decode
  try {
    const base64Clean = trimmed.replace(/-/g, '+').replace(/_/g, '/');
    const binaryStr = atob(base64Clean);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    const inflated = inflate(bytes);
    const xmlStr = new TextDecoder('utf-8').decode(inflated);

    // 1. Extract Unique items and Cluster Jewels from <Item ...> blocks
    const itemRegex = /<Item[^>]*>([\s\S]*?)<\/Item>/gi;
    let match: RegExpExecArray | null;
    while ((match = itemRegex.exec(xmlStr)) !== null) {
      const block = match[1];
      const parsed = parsePoeClipboardTooltip(block);
      if (!parsed) continue;
      if (parsed.rarity === 'Unique' || parsed.category === 'Cluster Jewel') {
        const key = parsed.itemName.toLowerCase();
        if (!results.has(key)) {
          results.set(key, {
            itemName: parsed.itemName,
            category: parsed.category,
            notes: parsed.baseType ? `From PoB (${parsed.baseType})` : 'Imported from PoB'
          });
        }
      }
    }

    // 2. Extract Transfigured, Awakened, and Vaal Gems from <Gem nameSpec="..." />
    const gemRegex = /<Gem[^>]*nameSpec="([^"]+)"[^>]*\/?>/gi;
    while ((match = gemRegex.exec(xmlStr)) !== null) {
      const gemName = match[1].trim();
      if (!gemName) continue;
      let cat: WishlistItemCategory | null = null;
      if (gemName.toLowerCase().includes('awakened ')) cat = 'Awakened Gem';
      else if (gemName.toLowerCase().includes('vaal ')) cat = 'Vaal Gem';
      else if (gemName.includes(' of ')) cat = 'Transfigured Gem';

      if (cat) {
        const key = gemName.toLowerCase();
        if (!results.has(key)) {
          results.set(key, {
            itemName: gemName,
            category: cat,
            notes: 'Imported from PoB Skill Setup'
          });
        }
      }
    }
  } catch {
    // Fallback: if user pasted a plain newline list of items or tooltips, parse line by line
    const lines = trimmed.split('\n').map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      if (line.length > 2 && line.length < 80 && !line.startsWith('http')) {
        const key = line.toLowerCase();
        if (!results.has(key)) {
          const cat: WishlistItemCategory = line.includes(' of ')
            ? 'Transfigured Gem'
            : line.toLowerCase().includes('awakened ')
            ? 'Awakened Gem'
            : line.toLowerCase().includes('cluster jewel')
            ? 'Cluster Jewel'
            : 'Unique';
          results.set(key, { itemName: line, category: cat, notes: 'Imported from item list' });
        }
      }
    }
  }

  return Array.from(results.values());
}

type ExtractedPoeMap = Map<string, ExtractedPobWishlistItem>;
