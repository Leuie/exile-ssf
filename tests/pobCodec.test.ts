import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { encodeSnapshotToPobCode } from '../src/utils/pobEncoder.ts';
import { decodePoBCode, detectAurasAndGuards } from '../src/utils/pobDecoder.ts';
import type { CharacterGearSnapshot } from '../src/components/profile/CharacterPaperdollView.tsx';

function makeSampleSnapshot(): CharacterGearSnapshot {
  return {
    syncedAtIso: '2026-11-28T00:00:00.000Z',
    character: {
      name: 'BadManLeu',
      league: 'Ravenwatch Covens of Umbra GSF (PL87651)',
      className: 'Juggernaut',
      level: 92,
      experience: 2500000000
    },
    equipped: [
      {
        id: 'body-1',
        inventoryId: 'BodyArmour',
        x: 0,
        name: 'Apocalypse Shell',
        baseType: 'Vaal Regalia',
        typeLine: 'Vaal Regalia',
        icon: '',
        frameType: 2,
        ilvl: 86,
        corrupted: true,
        sockets: [
          { group: 0, sColour: 'B' },
          { group: 0, sColour: 'B' },
          { group: 0, sColour: 'G' },
          { group: 0, sColour: 'G' },
          { group: 0, sColour: 'R' },
          { group: 0, sColour: 'B' }
        ],
        socketedGems: [
          { name: 'Vaal Lightning Strike', colour: 'G', socket: 0, group: 0, level: 20, quality: 20, support: false },
          { name: 'Multistrike Support', colour: 'R', socket: 1, group: 0, level: 20, quality: 20, support: true }
        ],
        implicitMods: ['+1% to all maximum Resistances'],
        explicitMods: ['+120 to maximum Energy Shield', '+42% to Fire Resistance'],
        craftedMods: ['+18% to Fire and Chaos Resistances'],
        enchantMods: [],
        fracturedMods: ['+35% to Cold Resistance']
      }
    ],
    jewels: { cluster: [], base: [], abyss: [] },
    passives: {
      allocatedCount: 3,
      allocatedHashes: [11455, 31961, 40907],
      jewelCount: 0,
      voidstoneCount: 4
    },
    estimatedVitals: {
      flatLife: 0,
      flatEs: 120,
      fireRes: 60,
      coldRes: 35,
      lightningRes: 0,
      chaosRes: 18,
      suppress: 0
    }
  };
}

describe('PoB Codec (encodeSnapshotToPobCode <-> decodePoBCode)', () => {
  it('round-trips a CharacterGearSnapshot into valid zlib+Base64URL PoB XML', () => {
    const snap = makeSampleSnapshot();
    const code = encodeSnapshotToPobCode(snap);
    assert.ok(code.length > 40, 'Encoded PoB string should be non-trivial');
    assert.ok(!code.includes('+') && !code.includes('/'), 'Should use URL-safe Base64URL encoding');

    const xml = decodePoBCode(code);
    assert.ok(xml.includes('<PathOfBuilding>'), 'Decoded output must contain <PathOfBuilding>');
    assert.ok(xml.includes('className="Marauder"'), 'Juggernaut maps to Marauder base class');
    assert.ok(xml.includes('ascendClassName="Juggernaut"'), 'Ascendancy preserved');
    assert.ok(xml.includes('level="92"'), 'Character level preserved');
    assert.ok(xml.includes('nodes="11455,31961,40907"'), 'Allocated passive hashes preserved');
    assert.ok(xml.includes('Sockets: B-B-G-G-R-B'), 'Linked 6L sockets serialized with dashes');
    assert.ok(xml.includes('{fractured}+35% to Cold Resistance'), 'Fractured mods tagged');
    assert.ok(xml.includes('{crafted}+18% to Fire and Chaos Resistances'), 'Crafted mods tagged');
    assert.ok(xml.includes('Corrupted'), 'Corrupted flag serialized');
  });

  it('returns raw XML untouched when decodePoBCode receives XML directly', () => {
    const raw = '<PathOfBuilding><Build level="80" /></PathOfBuilding>';
    assert.equal(decodePoBCode(raw), raw);
  });

  it('throws a user-friendly error on corrupted PoB import codes', () => {
    assert.throws(() => decodePoBCode('not-valid-zlib-data!!!'), /Invalid or corrupted Path of Building/);
  });

  it('detectAurasAndGuards identifies active auras and guard skills while ignoring disabled/support gems', () => {
    const res = detectAurasAndGuards([
      {
        slot: 'Helm',
        label: 'Auras',
        enabled: true,
        gems: [
          { name: 'Precision', level: 20, quality: 0, isSupport: false, enabled: true, color: 'G' },
          { name: 'Discipline', level: 20, quality: 0, isSupport: false, enabled: true, color: 'B' },
          { name: 'Molten Shell', level: 20, quality: 0, isSupport: false, enabled: true, color: 'R' },
          { name: 'Grace', level: 20, quality: 0, isSupport: false, enabled: false, color: 'G' },
          { name: 'Enlighten Support', level: 4, quality: 0, isSupport: true, enabled: true, color: 'B' }
        ]
      }
    ]);
    assert.deepEqual(res.activeAuras.sort(), ['Discipline', 'Precision']);
    assert.deepEqual(res.guardSkills, ['Molten Shell']);
  });
});
