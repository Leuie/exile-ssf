import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parsePoeClipboardTooltip } from '../src/utils/poeItemParser.ts';
import { formatInGameRes, formatPobRes, computeSnapshotResistances } from '../src/utils/resFormatter.ts';
import {
  computeSnapshotDiff,
  mergeDropLists,
  lookupNinjaPrice,
  resolveTier,
  formatValue,
  buildPoeWikiUrl,
  type TrackedDropItem
} from '../src/components/assets/assetEngine.ts';
import type { CharacterGearSnapshot } from '../src/components/profile/CharacterPaperdollView.tsx';

describe('poeItemParser — Clipboard Tooltip Parsing', () => {
  it('parses a Unique item tooltip with Item Level and explicit mods', () => {
    const raw = [
      'Item Class: Belts',
      'Rarity: Unique',
      'Mageblood',
      'Heavy Belt',
      '--------',
      'Item Level: 86',
      '--------',
      '+35 to Strength (implicit)',
      '--------',
      'Magic Utility Flasks cannot be Used',
      'Leftmost 4 Magic Utility Flasks constantly apply their Flask Effects to you'
    ].join('\n');

    const parsed = parsePoeClipboardTooltip(raw);
    assert.ok(parsed);
    assert.equal(parsed.itemName, 'Mageblood');
    assert.equal(parsed.baseType, 'Heavy Belt');
    assert.equal(parsed.rarity, 'Unique');
    assert.equal(parsed.category, 'Unique');
    assert.equal(parsed.itemLevel, 86);
    assert.ok(parsed.mods.some((m) => m.includes('Leftmost 4 Magic Utility Flasks')));
  });

  it('classifies Awakened, Vaal, and Transfigured Gems accurately', () => {
    const awk = parsePoeClipboardTooltip('Rarity: Gem\nAwakened Multistrike Support\n--------\nLevel: 5');
    const vaal = parsePoeClipboardTooltip('Rarity: Gem\nVaal Lightning Strike\n--------\nLevel: 20');
    const trans = parsePoeClipboardTooltip('Rarity: Gem\nLightning Strike of Arcing\n--------\nLevel: 20');
    assert.equal(awk?.category, 'Awakened Gem');
    assert.equal(vaal?.category, 'Vaal Gem');
    assert.equal(trans?.category, 'Transfigured Gem');
  });

  it('returns null for non-tooltip clipboard text', () => {
    assert.equal(parsePoeClipboardTooltip('hello world'), null);
    assert.equal(parsePoeClipboardTooltip(''), null);
  });
});

describe('resFormatter — In-Game & PoB Cap (+Overcap) Formatting', () => {
  it('formats capped resistances with overcap in parentheses and respects +Max Res up to 90%', () => {
    const normal = formatInGameRes(109, 75);
    assert.equal(normal.effective, 75);
    assert.equal(normal.overcap, 34);
    assert.equal(normal.label, '75% (+34%)');
    assert.equal(normal.isCapped, true);

    const elevated = formatInGameRes(95, 92); // hard-capped at 90%
    assert.equal(elevated.maxRes, 90);
    assert.equal(elevated.effective, 90);
    assert.equal(elevated.overcap, 5);
    assert.equal(elevated.label, '90% (+5%)');

    const uncapped = formatInGameRes(64, 75);
    assert.equal(uncapped.isCapped, false);
    assert.equal(uncapped.label, '64%');
  });

  it('formats Chaos Inoculation immunity cleanly', () => {
    const ci = formatInGameRes(-60, 75, true);
    assert.equal(ci.effective, 100);
    assert.equal(ci.isImmune, true);
    assert.equal(ci.isCapped, true);
    assert.match(ci.label, /Immune/);

    const pobCi = formatPobRes(100, 0, 75, true);
    assert.equal(pobCi.isImmune, true);
  });

  it('computes snapshot resistances with Kitava penalty and Purity of Elements', () => {
    const snap: CharacterGearSnapshot = {
      syncedAtIso: '2026-11-28T00:00:00.000Z',
      character: { name: 'Tester', league: 'SSF', className: 'Juggernaut', level: 85, experience: 0 },
      equipped: [
        {
          id: 'h1',
          inventoryId: 'Helm',
          x: 0,
          name: 'Test Helm',
          baseType: 'Hubris Circlet',
          typeLine: 'Hubris Circlet',
          icon: '',
          frameType: 2,
          ilvl: 84,
          corrupted: false,
          sockets: [],
          socketedGems: [
            { name: 'Purity of Elements', colour: 'B', socket: 0, level: 20, quality: 0, support: false }
          ],
          implicitMods: ['+2% to maximum Fire Resistance'],
          explicitMods: [],
          craftedMods: [],
          enchantMods: [],
          fracturedMods: []
        }
      ],
      passives: { allocatedCount: 1, allocatedHashes: [11455], jewelCount: 0, voidstoneCount: 0 },
      estimatedVitals: { flatLife: 0, flatEs: 500, fireRes: 120, coldRes: 110, lightningRes: 90, chaosRes: 0, suppress: 0 }
    };

    const res = computeSnapshotResistances(snap);
    assert.equal(res.kitavaPenalty, -60);
    assert.equal(res.purityBonus, 34);
    assert.equal(res.isCI, true);
    assert.equal(res.fire.maxRes, 77);
    assert.equal(res.fire.effective, 77);
    assert.equal(res.fire.overcap, 17); // 120 - 60 + 34 = 94 -> 77 (+17)
    assert.equal(res.chaos.isImmune, true);
  });
});

describe('assetEngine — Stash Diffing, Pricing & Formatting', () => {
  const mkItem = (name: string, qty: number, tab = 'Currency'): TrackedDropItem => ({
    key: `${name.toLowerCase()}::${tab.toLowerCase()}`,
    name,
    shortName: name,
    baseType: name,
    category: 'Currency',
    quantity: qty,
    icon: '',
    frameType: 5,
    ilvl: 0,
    tabName: tab
  });

  it('computes accurate before-vs-after snapshot diffs and merges duplicate drop stacks', () => {
    const before = [mkItem('Divine Orb', 2), mkItem('Chaos Orb', 50)];
    const after = [mkItem('Divine Orb', 5), mkItem('Chaos Orb', 40), mkItem('Exalted Orb', 3)];

    const diff = computeSnapshotDiff(before, after);
    assert.equal(diff.length, 2);
    assert.equal(diff.find((d) => d.name === 'Divine Orb')?.quantity, 3);
    assert.equal(diff.find((d) => d.name === 'Exalted Orb')?.quantity, 3);

    const merged = mergeDropLists([[mkItem('Divine Orb', 2)], [mkItem('Divine Orb', 4)]]);
    assert.equal(merged.length, 1);
    assert.equal(merged[0].quantity, 6);
  });

  it('prices items, assigns S/A/B/C tiers, formats values, and builds PoE 1 / PoE 2 Wiki URLs', () => {
    const prices = { 'divine orb': 170, 'chaos orb': 1 };
    const divItem = mkItem('Divine Orb', 2);
    const each = lookupNinjaPrice(divItem, prices);
    assert.equal(each, 170);
    assert.equal(resolveTier(170, 340, 170), 'S');
    assert.equal(formatValue(340, 170), '2.0d');
    assert.equal(formatValue(45, 170), '45c');
    assert.equal(buildPoeWikiUrl('Mageblood', 'poe1'), 'https://www.poewiki.net/wiki/Mageblood');
    assert.equal(buildPoeWikiUrl('Waystone', 'poe2'), 'https://www.poe2wiki.net/wiki/Waystone');
  });
});
