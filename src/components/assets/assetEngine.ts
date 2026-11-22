// Modular Types, Pricing, SSF Utility Scoring, Stash Parsing, and Demo Data for Farming & Drop Tracker

export interface StashTabMeta {
  index: number;
  id: string;
  name: string;
  type: string;
  colour: { r: number; g: number; b: number };
}

export interface TrackedDropItem {
  key: string;
  name: string;
  shortName: string;
  baseType: string;
  category: string;
  subCategory?: string;
  gemLevel?: number;
  gemQuality?: number;
  quality?: number;
  maxStackSize?: number;
  links?: number;
  mapTier?: number;
  influenced?: boolean;
  isVaal?: boolean;
  isTransfigured?: boolean;
  isAwakened?: boolean;
  isExceptional?: boolean;
  corrupted?: boolean;
  quantity: number;
  icon: string;
  frameType: number;
  ilvl: number;
  tabName: string;
}

export type ItemTier = 'S' | 'A' | 'B' | 'C';

export interface EnrichedDropItem extends TrackedDropItem {
  chaosEach: number;
  totalChaos: number;
  ssfPointsEach: number;
  totalSsfPoints: number;
  tier: ItemTier;
}

export interface SavedFarmingSession {
  id: string;
  handle: string;
  game: 'poe1' | 'poe2';
  title: string;
  strategy?: string;
  league: string;
  mapsRun: number;
  durationMinutes: number;
  deaths: number;
  totalChaos?: number;
  createdAtIso: string;
  items: TrackedDropItem[];
}

export interface SyncCheckpoint {
  at: string;
  totalItems: number;
  totalChaos: number;
}

export interface LeagueOption {
  id: string;
  name: string;
  game: 'poe1' | 'poe2';
}

export type SortField = 'total' | 'price' | 'qty' | 'name' | 'tab' | 'tier' | 'gem_level' | 'gem_quality' | 'ilvl' | 'links' | 'map_tier';

export interface SsfWeightsConfig {
  categoryMultipliers: Record<string, number>;
  wishlistBonus: number;
  unpricedUniqueFloor: number;
  unpricedMapFloor: number;
  customOverrides: Record<string, number>;
}

export const PREFS_STORAGE_KEY = 'exile_ssf_farming_prefs_v2';
export const WORKSPACE_STORAGE_KEY = 'exile_ssf_farming_workspace_v1';
export const WEIGHTS_STORAGE_KEY = 'exile_ssf_custom_weights_v1';
export const POESESSID_OPTIN_STORAGE_KEY = 'exile_ssf_optin_poesessid_v1';

export const DEFAULT_LEAGUES: LeagueOption[] = [
  { id: 'poe1-330-umbra', name: 'Ravenwatch Covens of Umbra GSF (PL87651)', game: 'poe1' },
  { id: 'poe2-ea-ancients', name: 'PoE 2 Early Access Private League', game: 'poe2' }
];

export const STRATEGY_PRESETS = [
  'Campaign (Acts 1 to 10)',
  'Alch & Go White Maps',
  'Alch & Go Yellow Maps',
  'Alch & Go Red Maps',
  'Essence + Harbinger',
  'Breach + Scarabs',
  'Harvest + Expedition',
  'T17 Scarab Farm',
  'Heist / Delve / Sanctum'
];

export const POE2_STRATEGY_PRESETS = [
  'Campaign (Acts 1 to 3 + Cruel)',
  'Waystones T1 to T5',
  'Waystones T6 to T10',
  'Waystones T11 to T15',
  'Tower + Precursor Tablet Farm',
  'Breach + Delirium',
  'Ritual + Expedition',
  'Trial of Sekhemas / Chaos',
  'Pinnacle Bossing'
];

export const CATEGORY_ORDER = [
  'Uniques',
  'Currency',
  'Div Cards',
  'Gems',
  'Scarabs & Fragments',
  'Essences & Crafting',
  'Maps & League Keys',
  'Gear & Jewels'
];

export const GEM_SUBFILTERS = ['All Gems', 'Transfigured', 'Exceptional', 'Vaal', 'Awakened', 'Level 20+', 'Quality 15%+', 'Corrupted'];
export const DIV_SUBFILTERS = ['All Cards', 'Full Stacks Ready', 'Partial Stacks'];
export const UNIQUE_SUBFILTERS = ['All Uniques', '6 Link', 'Corrupted', 'Unique Weapons', 'Unique Jewellery', 'Unique Jewels & Flasks'];
export const ESSENCE_SUBFILTERS = ['All Crafting', 'Deafening / Shrieking', 'Corrupted Essences', 'Fossils & Resonators', 'Oils, Catalysts & Omens', 'Tattoos & Runegrafts'];
export const MAP_SUBFILTERS = ['All Maps & Keys', 'T16 / T17', 'Heist & Expedition', 'League Keys'];
export const CURRENCY_SUBFILTERS = ['All Currency', 'High Tier Currency', 'Eldritch Currency', 'Standard Currency'];

export interface CanonicalTabSlot {
  id: string;
  label: string;
  group: 'Specialty' | 'Quad & Dump';
  matchTypes: string[];
  matchKeywords: string[];
}

export const CANONICAL_TAB_SLOTS: CanonicalTabSlot[] = [
  { id: 'currency', label: 'Currency', group: 'Specialty', matchTypes: ['CurrencyStash'], matchKeywords: ['currency', '$', 'curr'] },
  { id: 'gems', label: 'Gems', group: 'Specialty', matchTypes: ['GemStash'], matchKeywords: ['gem'] },
  { id: 'flasks', label: 'Flasks', group: 'Specialty', matchTypes: ['FlaskStash'], matchKeywords: ['flask'] },
  { id: 'delirium', label: 'Delirium', group: 'Specialty', matchTypes: ['DeliriumStash'], matchKeywords: ['delirium', 'deli'] },
  { id: 'ultimatum', label: 'Ultimatum', group: 'Specialty', matchTypes: ['UltimatumStash'], matchKeywords: ['ultimatum', 'ulti'] },
  { id: 'blight', label: 'Blight', group: 'Specialty', matchTypes: ['BlightStash'], matchKeywords: ['blight'] },
  { id: 'delve', label: 'Delve', group: 'Specialty', matchTypes: ['DelveStash'], matchKeywords: ['delve', 'fossil'] },
  { id: 'fragments', label: 'Fragments', group: 'Specialty', matchTypes: ['FragmentStash'], matchKeywords: ['fragment', 'frag', 'scarab'] },
  { id: 'essences', label: 'Essences', group: 'Specialty', matchTypes: ['EssenceStash'], matchKeywords: ['essence', 'ess'] },
  { id: 'divinations', label: 'Divinations', group: 'Specialty', matchTypes: ['DivinationStash'], matchKeywords: ['divination', 'div'] },
  { id: 'omens', label: 'Omens', group: 'Specialty', matchTypes: [], matchKeywords: ['omen', 'ritual'] },
  { id: 'breach', label: 'Breach', group: 'Specialty', matchTypes: [], matchKeywords: ['breach'] },
  { id: 'levelling', label: 'Levelling Items (Quad Tab)', group: 'Quad & Dump', matchTypes: [], matchKeywords: ['levelling', 'leveling', 'level', 'twink'] },
  { id: 'dump_1', label: 'Dump 1 (Quad Tab)', group: 'Quad & Dump', matchTypes: ['QuadStash'], matchKeywords: ['dump 1', 'dump1', 'q1', 'dump'] },
  { id: 'dump_2', label: 'Dump 2 (Quad Tab)', group: 'Quad & Dump', matchTypes: ['QuadStash'], matchKeywords: ['dump 2', 'dump2', 'q2'] },
  { id: 'dump_3', label: 'Dump 3 (Quad Tab)', group: 'Quad & Dump', matchTypes: ['QuadStash'], matchKeywords: ['dump 3', 'dump3', 'q3'] },
  { id: 'dump_4', label: 'Dump 4 (Quad Tab)', group: 'Quad & Dump', matchTypes: ['QuadStash'], matchKeywords: ['dump 4', 'dump4', 'q4'] },
  { id: 'dump_5', label: 'Dump 5 (Quad Tab)', group: 'Quad & Dump', matchTypes: ['QuadStash'], matchKeywords: ['dump 5', 'dump5', 'q5'] }
];

export type CanonicalTabMapping = Record<string, number | null>;

export function autoMatchCanonicalTabs(tabs: StashTabMeta[]): CanonicalTabMapping {
  const result: CanonicalTabMapping = {};
  const usedIndices = new Set<number>();
  const eligible = tabs.filter((t) => t.type !== 'UniqueStash' && t.type !== 'MapStash');

  for (const slot of CANONICAL_TAB_SLOTS) {
    // 1. Exact GGG specialty type match first (skip QuadStash for non dump slots)
    let matched =
      slot.group === 'Specialty' && slot.matchTypes.length > 0
        ? eligible.find((t) => !usedIndices.has(t.index) && slot.matchTypes.includes(t.type))
        : undefined;

    // 2. Keyword name match
    if (!matched) {
      matched = eligible.find((t) => {
        if (usedIndices.has(t.index)) return false;
        const low = t.name.toLowerCase();
        return slot.matchKeywords.some((kw) => low.includes(kw));
      });
    }

    // 3. Fallback unused QuadStash for Dump 1..5
    if (!matched && slot.id.startsWith('dump_')) {
      matched = eligible.find((t) => !usedIndices.has(t.index) && t.type === 'QuadStash');
    }

    if (matched) {
      result[slot.id] = matched.index;
      usedIndices.add(matched.index);
    } else {
      result[slot.id] = null;
    }
  }
  return result;
}

export const EQUIPMENT_BRACKETS = [
  'All Equipment',
  'Armour',
  'Evasion',
  'Energy Shield',
  'Hybrid (AR/EV)',
  'Hybrid (AR/ES)',
  'Hybrid (EV/ES)',
  'Hybrid (AR/EV/ES)',
  'Ward',
  'Weapons',
  'Jewellery',
  'Jewels & Clusters',
  'Flasks & Tinctures'
];

export const TIER_STYLES: Record<ItemTier, string> = {
  S: 'bg-amber-500/25 border-amber-400/70 text-amber-200',
  A: 'bg-purple-500/20 border-purple-400/60 text-purple-200',
  B: 'bg-sky-500/20 border-sky-400/50 text-sky-200',
  C: 'bg-slate-800/80 border-slate-700 text-slate-400'
};

export const TIER_RANK: Record<ItemTier, number> = { S: 4, A: 3, B: 2, C: 1 };

export const BULK_NOISE_REGEX =
  /^(scroll of wisdom|portal scroll|orb of transmutation|orb of augmentation|armourer's scrap|blacksmith's whetstone|transmutation shard|alteration shard|alchemy shard|scroll fragment)$/i;

export const DEFAULT_SSF_WEIGHTS: SsfWeightsConfig = {
  categoryMultipliers: {
    Uniques: 1.15,
    Currency: 1.0,
    'Div Cards': 1.0,
    Gems: 1.1,
    'Scarabs & Fragments': 1.2,
    'Essences & Crafting': 1.2,
    'Maps & League Keys': 1.1,
    'Gear & Jewels': 1.0
  },
  wishlistBonus: 50,
  unpricedUniqueFloor: 3,
  unpricedMapFloor: 1.5,
  customOverrides: {
    "rogue's marker": 0.002,
    'primal crystallised lifeforce': 0.025,
    'wild crystallised lifeforce': 0.025,
    'vivid crystallised lifeforce': 0.025,
    'orb of unmaking': 1.5,
    'instilling orb': 1.2,
    'enkindling orb': 1.2,
    "cartographer's chisel": 1.0
  }
};

export const DEMO_SAMPLE_DROPS: TrackedDropItem[] = [
  {
    key: 'demo-divine',
    name: 'Divine Orb',
    shortName: 'Divine Orb',
    baseType: 'Divine Orb',
    category: 'Currency',
    subCategory: 'High Tier Currency',
    quantity: 2,
    icon: '',
    frameType: 5,
    ilvl: 0,
    tabName: 'Demo Dump'
  },
  {
    key: 'demo-shapers-touch',
    name: "Shaper's Touch (Crusader Gloves)",
    shortName: "Shaper's Touch",
    baseType: 'Crusader Gloves',
    category: 'Uniques',
    subCategory: 'Unique Hybrid (AR/ES)',
    quantity: 1,
    icon: '',
    frameType: 3,
    ilvl: 84,
    tabName: 'Demo Dump'
  },
  {
    key: 'demo-gem-transfig',
    name: 'Volcanic Fissure of Snaking',
    shortName: 'Volcanic Fissure of Snaking',
    baseType: 'Volcanic Fissure of Snaking',
    category: 'Gems',
    subCategory: 'Transfigured Gems',
    gemLevel: 20,
    gemQuality: 20,
    isTransfigured: true,
    quantity: 1,
    icon: '',
    frameType: 4,
    ilvl: 0,
    tabName: 'Demo Gems'
  },
  {
    key: 'demo-gem-vaal',
    name: 'Vaal Lightning Strike',
    shortName: 'Vaal Lightning Strike',
    baseType: 'Vaal Lightning Strike',
    category: 'Gems',
    subCategory: 'Vaal Gems',
    gemLevel: 21,
    gemQuality: 20,
    isVaal: true,
    corrupted: true,
    quantity: 1,
    icon: '',
    frameType: 4,
    ilvl: 0,
    tabName: 'Demo Gems'
  },
  {
    key: 'demo-chaos',
    name: 'Chaos Orb',
    shortName: 'Chaos Orb',
    baseType: 'Chaos Orb',
    category: 'Currency',
    subCategory: 'High Tier Currency',
    quantity: 64,
    icon: '',
    frameType: 5,
    ilvl: 0,
    tabName: 'Demo Currency'
  },
  {
    key: 'demo-essence',
    name: 'Deafening Essence of Greed',
    shortName: 'Deafening Essence of Greed',
    baseType: 'Deafening Essence of Greed',
    category: 'Essences & Crafting',
    subCategory: 'Essences',
    quantity: 11,
    icon: '',
    frameType: 5,
    ilvl: 0,
    tabName: 'Demo Essences'
  },
  {
    key: 'demo-scarab',
    name: 'Horned Scarab of Bloodlines',
    shortName: 'Horned Scarab of Bloodlines',
    baseType: 'Horned Scarab of Bloodlines',
    category: 'Scarabs & Fragments',
    subCategory: 'Scarabs',
    quantity: 3,
    icon: '',
    frameType: 5,
    ilvl: 0,
    tabName: 'Demo Fragments'
  },
  {
    key: 'demo-es-chest',
    name: 'Twilight Regalia',
    shortName: 'Twilight Regalia',
    baseType: 'Twilight Regalia',
    category: 'Gear & Jewels',
    subCategory: 'Energy Shield',
    quantity: 1,
    icon: '',
    frameType: 2,
    ilvl: 86,
    tabName: 'Demo Dump'
  }
];

export function playSubtleChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.16);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch {}
}

export function mergeDropLists(lists: TrackedDropItem[][]): TrackedDropItem[] {
  const agg = new Map<string, TrackedDropItem>();
  for (const list of lists) {
    for (const it of list) {
      const prev = agg.get(it.key);
      if (prev) {
        prev.quantity += it.quantity;
      } else {
        agg.set(it.key, { ...it });
      }
    }
  }
  return Array.from(agg.values());
}

export function parseClientGggStashJson(rawJson: string, fallbackTabName: string): { tabs: StashTabMeta[]; items: TrackedDropItem[] } {
  const parsed = JSON.parse(rawJson);
  const rawItems = Array.isArray(parsed?.items) ? parsed.items : [];
  const tabs: StashTabMeta[] = Array.isArray(parsed?.tabs)
    ? parsed.tabs.map((t: any) => ({
        index: Number(t.i),
        id: String(t.id || t.i),
        name: String(t.n || `Tab ${Number(t.i) + 1}`),
        type: String(t.type || 'NormalStash'),
        colour: t.colour || { r: 99, g: 102, b: 241 }
      }))
    : [];

  const parsePropNum = (it: any, propName: string): number => {
    if (!Array.isArray(it?.properties)) return 0;
    const found = it.properties.find((p: any) => String(p?.name || '').toLowerCase() === propName.toLowerCase());
    if (!found || !Array.isArray(found.values) || !found.values[0]) return 0;
    const m = String(found.values[0][0] || '').match(/\d+/);
    return m ? parseInt(m[0], 10) : 0;
  };

  const agg = new Map<string, TrackedDropItem>();
  for (const it of rawItems) {
    const cleanName = String(it.name || '').replace(/<<[^>]+>>/g, '').trim();
    const cleanBase = String(it.baseType || it.typeLine || '').replace(/<<[^>]+>>/g, '').trim();
    const displayName = cleanName && cleanName !== cleanBase ? `${cleanName} (${cleanBase})` : cleanName || cleanBase || 'Unknown Item';
    const shortName = cleanName || cleanBase || 'Unknown Item';
    const baseLow = cleanBase.toLowerCase();
    const full = `${cleanName} ${cleanBase}`.toLowerCase();
    const iconLow = String(it.icon || '').toLowerCase();
    const ft = Number(it.frameType ?? 0);
    const corrupted = Boolean(it.corrupted);

    let category = 'Gear & Jewels';
    let subCategory = 'Other Equipment';
    let gemLevel = 0;
    let gemQuality = 0;
    let isVaal = false;
    let isTransfigured = false;
    let isAwakened = false;

    if (ft === 4) {
      category = 'Gems';
      gemLevel = parsePropNum(it, 'Level');
      gemQuality = parsePropNum(it, 'Quality');
      isVaal = Boolean(it?.hybrid?.isVaalGem) || baseLow.startsWith('vaal ');
      isAwakened = baseLow.startsWith('awakened ');
      isTransfigured = /\bof\s+[a-z]/i.test(cleanBase) && !/(herald of|purity of|aura of|aspect of)/i.test(cleanBase);
      subCategory = isAwakened
        ? 'Awakened Gems'
        : isVaal
        ? 'Vaal Gems'
        : isTransfigured
        ? 'Transfigured Gems'
        : gemLevel >= 20 || gemQuality >= 15
        ? 'High Level / Quality Gems'
        : 'Standard Gems';
    } else if (ft === 3) {
      category = 'Uniques';
      subCategory = iconLow.includes('/weapons/') ? 'Unique Weapons' : iconLow.includes('/jewels/') || iconLow.includes('/flasks/') ? 'Unique Jewels & Flasks' : 'Unique Armour & Gear';
    } else if (ft === 6) {
      category = 'Div Cards';
      subCategory = 'Divination Cards';
    } else if (/(scarab|fragment|splinter|breachstone|emblem|invitation|mortal |sacrifice at|vessel|simulacrum)/i.test(full)) {
      category = 'Scarabs & Fragments';
      subCategory = full.includes('scarab') ? 'Scarabs' : 'Boss Fragments & Invitations';
    } else if (/(essence|fossil|resonator|catalyst|oil|tattoo|runegraft|omen|delirium orb)/i.test(full)) {
      category = 'Essences & Crafting';
      subCategory = full.includes('essence') ? 'Essences' : 'Crafting & Socketables';
    } else if (/(map|waystone|logbook|blueprint|contract|inscribed ultimatum)/i.test(baseLow)) {
      category = 'Maps & League Keys';
      subCategory = 'Maps & Waystones';
    } else if (ft === 5 || /(orb|shard|scroll|chisel|bauble|whetstone|scrap|prism|mirror|marker|lifeforce)/i.test(full)) {
      category = 'Currency';
      subCategory = /(divine|mirror|exalted|fracturing|hinekora|annulment|chaos orb)/i.test(full) ? 'High Tier Currency' : 'Standard Currency';
    } else {
      const ar = parsePropNum(it, 'Armour') > 0;
      const ev = parsePropNum(it, 'Evasion Rating') > 0;
      const es = parsePropNum(it, 'Energy Shield') > 0;
      const wd = parsePropNum(it, 'Ward') > 0;
      if (iconLow.includes('/jewels/') || baseLow.includes('jewel')) subCategory = 'Jewels & Clusters';
      else if (iconLow.includes('/flasks/') || baseLow.includes('flask')) subCategory = 'Flasks & Tinctures';
      else if (/(ring|amulet|belt|sash)$/i.test(baseLow)) subCategory = 'Jewellery';
      else if (iconLow.includes('/weapons/')) subCategory = 'Weapons';
      else if (wd) subCategory = 'Ward';
      else if (ar && ev && es) subCategory = 'Hybrid (AR/EV/ES)';
      else if (ar && es) subCategory = 'Hybrid (AR/ES)';
      else if (ar && ev) subCategory = 'Hybrid (AR/EV)';
      else if (ev && es) subCategory = 'Hybrid (EV/ES)';
      else if (ar) subCategory = 'Armour';
      else if (ev) subCategory = 'Evasion';
      else if (es) subCategory = 'Energy Shield';
    }

    const qty = Math.max(1, Number(it.stackSize || 1));
    const key =
      category === 'Gems'
        ? `${category}::${displayName.toLowerCase()}::l${gemLevel}::q${gemQuality}::c${corrupted ? 1 : 0}`
        : `${category}::${subCategory}::${displayName.toLowerCase()}`;

    const existing = agg.get(key);
    if (existing) {
      existing.quantity += qty;
    } else {
      agg.set(key, {
        key,
        name: displayName,
        shortName,
        baseType: cleanBase,
        category,
        subCategory,
        gemLevel,
        gemQuality,
        isVaal,
        isTransfigured,
        isAwakened,
        corrupted,
        quantity: qty,
        icon: typeof it.icon === 'string' ? it.icon : '',
        frameType: ft,
        ilvl: Number(it.ilvl || 0),
        tabName: fallbackTabName
      });
    }
  }

  return { tabs, items: Array.from(agg.values()) };
}

export function computeSnapshotDiff(before: TrackedDropItem[], after: TrackedDropItem[]): TrackedDropItem[] {
  const beforeMap = new Map<string, number>();
  for (const it of before) {
    beforeMap.set(it.key, (beforeMap.get(it.key) || 0) + it.quantity);
  }
  const diff: TrackedDropItem[] = [];
  for (const it of after) {
    const prevQty = beforeMap.get(it.key) || 0;
    const gained = it.quantity - prevQty;
    if (gained > 0) diff.push({ ...it, quantity: gained });
  }
  return diff;
}

export function lookupNinjaPrice(item: TrackedDropItem, prices: Record<string, number>): number {
  const shortLow = item.shortName.trim().toLowerCase();
  const baseLow = item.baseType.trim().toLowerCase();
  if (item.category === 'Gems') {
    const lvl = item.gemLevel || 1;
    const qual = item.gemQuality || 0;
    const corr = item.corrupted ? 1 : 0;
    const exactGem = prices[`gem::${shortLow}::l${lvl}::q${qual}::c${corr}`];
    if (exactGem) return exactGem;
    const q20 = qual >= 18 ? prices[`gem::${shortLow}::l${lvl}::q20::c${corr}`] : 0;
    if (q20) return q20;
    return prices[shortLow] || 0;
  }
  return prices[shortLow] || (baseLow ? prices[baseLow] || 0 : 0);
}

export function resolveTier(chaosEach: number, totalChaos: number, divineChaos: number): ItemTier {
  const sThreshold = Math.max(100, divineChaos * 0.9);
  if (chaosEach >= sThreshold || totalChaos >= sThreshold) return 'S';
  if (chaosEach >= 30 || totalChaos >= 50) return 'A';
  if (chaosEach >= 5 || totalChaos >= 12) return 'B';
  return 'C';
}

export function computeSsfUtilityPoints(
  item: TrackedDropItem,
  chaosEach: number,
  isWishlistMatch: boolean,
  weights: SsfWeightsConfig
): number {
  const shortLow = item.shortName.trim().toLowerCase();
  const low = `${shortLow} ${item.baseType.toLowerCase()}`;

  if (typeof weights.customOverrides[shortLow] === 'number') {
    const basePts = weights.customOverrides[shortLow];
    return isWishlistMatch ? basePts + weights.wishlistBonus : basePts;
  }

  let pts = 0;
  if (low.includes("rogue's marker")) {
    pts = 0.002;
  } else if (low.includes('crystallised lifeforce')) {
    pts = 0.025;
  } else if (BULK_NOISE_REGEX.test(shortLow) || /\b(shard|scroll)\b/i.test(low)) {
    pts = chaosEach > 0 ? Math.min(chaosEach, 0.05) : 0.01;
  } else if (chaosEach > 0) {
    const mult = weights.categoryMultipliers[item.category] ?? 1.0;
    pts = Math.round(chaosEach * mult * 100) / 100;
  } else if (low.includes('splinter') || low.includes('artifact')) {
    pts = 0.15;
  } else if (item.category === 'Uniques') {
    pts = weights.unpricedUniqueFloor;
  } else if (item.category === 'Maps & League Keys') {
    pts = weights.unpricedMapFloor;
  } else if (item.category === 'Gems') {
    pts = item.isAwakened ? 40 : item.isTransfigured ? 10 : (item.gemLevel || 0) >= 20 ? 5 : 0.5;
  } else if (item.category === 'Gear & Jewels' && item.ilvl >= 84) {
    pts = 2;
  } else {
    pts = 0.1;
  }

  return isWishlistMatch ? pts + weights.wishlistBonus : pts;
}

export function formatSsfPoints(pts: number): string {
  if (pts <= 0) return '0 pts';
  if (pts < 0.1) return `${pts.toFixed(3)} pts`;
  if (pts < 10) return `${pts.toFixed(1)} pts`;
  return `${Math.round(pts).toLocaleString()} pts`;
}

export function formatValue(chaos: number, divineChaos: number): string {
  if (chaos <= 0) return '0c';
  if (divineChaos > 0 && chaos >= divineChaos) {
    return `${(chaos / divineChaos).toFixed(1)}d`;
  }
  if (chaos < 1) return `${chaos.toFixed(1)}c`;
  return `${Math.round(chaos).toLocaleString()}c`;
}

export function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function buildPoeWikiUrl(itemName: string, game: 'poe1' | 'poe2' = 'poe1'): string {
  const clean = String(itemName || '')
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const slug = encodeURIComponent(clean.replace(/ /g, '_'));
  return game === 'poe2'
    ? `https://www.poe2wiki.net/wiki/${slug}`
    : `https://www.poewiki.net/wiki/${slug}`;
}
