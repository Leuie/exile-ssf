import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  KEYSTONE_NODE_IDS,
  buildDefaultCalcConfig,
  calculateCharacterStats,
  detectBuildTraits
} from '../src/utils/poeCalcEngine.ts';

function makeSnap(overrides: Record<string, any> = {}): any {
  return {
    syncedAtIso: '2026-11-25T00:00:00Z',
    character: {
      name: 'TestExile',
      league: '3.30',
      className: 'Juggernaut',
      level: 90,
      experience: 0,
      ...(overrides.character || {})
    },
    equipped: overrides.equipped || [],
    jewels: overrides.jewels || { cluster: [], base: [], abyss: [] },
    gearStats: {
      strength: 100,
      dexterity: 100,
      intelligence: 100,
      armour: 5000,
      evasion: 5000,
      energyShield: 500,
      movementSpeed: 30,
      blockChance: 0,
      spellBlockChance: 0,
      lifeRegen: 100,
      incLifePct: 120,
      incEsPct: 50,
      incArmourPct: 80,
      incEvasionPct: 80,
      flatPdr: 0,
      physTakenAsEle: 0,
      maxFireRes: 0,
      maxColdRes: 0,
      maxLightningRes: 0,
      maxChaosRes: 0,
      ...(overrides.gearStats || {})
    },
    passives: {
      allocatedCount: 110,
      allocatedHashes: overrides.allocatedHashes || [],
      jewelCount: 2,
      voidstoneCount: 4,
      keystones: overrides.keystones || [],
      ascendancyNodes: [],
      masteries: []
    },
    estimatedVitals: {
      flatLife: 450,
      flatEs: 100,
      fireRes: 150,
      coldRes: 150,
      lightningRes: 150,
      chaosRes: 60,
      suppress: 0,
      ...(overrides.estimatedVitals || {})
    }
  };
}

describe('PoE Calc Engine — 10-Archetype Keystone & Mechanics Regression Suite', () => {
  it('1. Chaos Inoculation (node 11455): Life = 1, Chaos Immune, Inf Chaos Max Hit', () => {
    const snap = makeSnap({
      allocatedHashes: [KEYSTONE_NODE_IDS.CHAOS_INOCULATION],
      gearStats: { energyShield: 1800, incEsPct: 120, intelligence: 900 },
      estimatedVitals: { chaosRes: 0, fireRes: 160, coldRes: 160, lightningRes: 160 }
    });
    const calc = calculateCharacterStats(snap, buildDefaultCalcConfig(snap));
    assert.equal(calc.isCI, true);
    assert.equal(calc.traits.usesEsAsPrimaryPool, true);
    assert.equal(calc.life.total, 1);
    assert.equal(calc.resistances.chaos.isImmune, true);
    assert.equal(calc.maxHits.chaos, Infinity);
    assert.equal(calc.resistances.fire.label, '75% (+25%)');
  });

  it('2. Resolute Technique (node 31961): 100% Hit Chance, Power Charges grant 0% Crit', () => {
    const snap = makeSnap({
      allocatedHashes: [KEYSTONE_NODE_IDS.RESOLUTE_TECHNIQUE],
      gearStats: { dexterity: 20 }
    });
    const cfg = buildDefaultCalcConfig(snap);
    cfg.usePowerCharges = true;
    cfg.powerCharges = 3;
    const calc = calculateCharacterStats(snap, cfg);
    assert.equal(calc.traits.isResoluteTechnique, true);
    assert.equal(calc.offense.hitChancePct, 100);
    assert.equal(calc.offense.powerIncCritPct, 0);
  });

  it('3. Unwavering Stance (node 40907): Evade Chance is strictly 0% even with 30k Evasion', () => {
    const snap = makeSnap({
      allocatedHashes: [KEYSTONE_NODE_IDS.UNWAVERING_STANCE],
      gearStats: { evasion: 15000, incEvasionPct: 120 }
    });
    const calc = calculateCharacterStats(snap, buildDefaultCalcConfig(snap));
    assert.equal(calc.traits.isUnwaveringStance, true);
    assert.equal(calc.evasion.evadeChancePct, 0);
  });

  it('4. Iron Reflexes (node 10661): Converts all Evasion into Armour (Evasion = 0)', () => {
    const snap = makeSnap({
      allocatedHashes: [KEYSTONE_NODE_IDS.IRON_REFLEXES],
      gearStats: { armour: 2000, evasion: 10000, incArmourPct: 50, incEvasionPct: 100 }
    });
    const calc = calculateCharacterStats(snap, buildDefaultCalcConfig(snap));
    assert.equal(calc.traits.isIronReflexes, true);
    assert.equal(calc.evasion.total, 0);
    assert.ok(calc.armour.total > 20000, `Expected converted Armour > 20k, got ${calc.armour.total}`);
  });

  it('5. Eldritch Battery (node 56075) without MoM: ES does NOT inflate Hit Pool', () => {
    const baseSnap = makeSnap({ gearStats: { energyShield: 1500, incEsPct: 50 } });
    const ebSnap = makeSnap({
      allocatedHashes: [KEYSTONE_NODE_IDS.ELDRITCH_BATTERY],
      gearStats: { energyShield: 1500, incEsPct: 50 }
    });
    const baseCalc = calculateCharacterStats(baseSnap, buildDefaultCalcConfig(baseSnap));
    const ebCalc = calculateCharacterStats(ebSnap, buildDefaultCalcConfig(ebSnap));
    assert.equal(ebCalc.traits.esProtectsLife, false);
    assert.ok(ebCalc.maxHits.fire < baseCalc.maxHits.fire, 'EB without MoM must have lower Max Hit than Life+ES');
  });

  it('6. Eldritch Battery + Mind Over Matter (56075 + 34098): ES expands Hit Pool via 40% MoM', () => {
    const ebOnly = makeSnap({
      allocatedHashes: [KEYSTONE_NODE_IDS.ELDRITCH_BATTERY],
      gearStats: { energyShield: 1500, incEsPct: 50 }
    });
    const ebMom = makeSnap({
      allocatedHashes: [KEYSTONE_NODE_IDS.ELDRITCH_BATTERY, KEYSTONE_NODE_IDS.MIND_OVER_MATTER],
      gearStats: { energyShield: 1500, incEsPct: 50 }
    });
    const c1 = calculateCharacterStats(ebOnly, buildDefaultCalcConfig(ebOnly));
    const c2 = calculateCharacterStats(ebMom, buildDefaultCalcConfig(ebMom));
    assert.ok(c2.maxHits.fire > c1.maxHits.fire, 'EB+MoM must increase Max Hit over EB alone');
  });

  it('7. Divine Flesh: Raises Max Chaos Res to 80% and splits Ele hits 50% to Chaos', () => {
    const snap = makeSnap({
      keystones: [{ id: 99999, name: 'Divine Flesh', stats: [] }],
      estimatedVitals: { fireRes: 150, coldRes: 150, lightningRes: 150, chaosRes: 145 }
    });
    const calc = calculateCharacterStats(snap, buildDefaultCalcConfig(snap));
    assert.equal(calc.traits.isDivineFlesh, true);
    assert.equal(calc.resistances.chaos.maxRes, 80);
    assert.equal(calc.resistances.chaos.label, '80% (+5%)');
  });

  it('8. Precision + Assassin\'s Mark + Raise Spectre auto-detect Auras, Curses, Frenzy & Power Charges', () => {
    const snap = makeSnap({
      equipped: [
        {
          id: 'w1',
          inventoryId: 'Weapon',
          name: 'Foulborn Hand of Thought and Motion',
          baseType: 'Imperial Claw',
          typeLine: 'Imperial Claw',
          frameType: 3,
          ilvl: 75,
          properties: [
            { name: 'Physical Damage', value: '30-78' },
            { name: 'Attacks per Second', value: '1.60' },
            { name: 'Critical Strike Chance', value: '7.00%' }
          ],
          explicitMods: ['Adds 1 to 12 Lightning Damage to Attacks with this Weapon per 10 Dexterity'],
          socketedGems: [
            { name: "Assassin's Mark", colour: 'B', socket: 0, group: 0, level: 19, quality: 10, support: false },
            { name: 'Mark On Hit Support', colour: 'G', socket: 1, group: 0, level: 19, quality: 20, support: true },
            { name: 'Precision', colour: 'G', socket: 2, group: 0, level: 20, quality: 0, support: false }
          ]
        },
        {
          id: 'b1',
          inventoryId: 'Boots',
          name: 'Spectre Boots',
          baseType: 'Sorcerer Boots',
          typeLine: 'Sorcerer Boots',
          frameType: 2,
          ilvl: 84,
          socketedGems: [
            { name: 'Raise Spectre', colour: 'B', socket: 0, group: 0, level: 20, quality: 0, support: false }
          ]
        }
      ],
      gearStats: { dexterity: 240 }
    });
    const cfg = buildDefaultCalcConfig(snap);
    assert.equal(cfg.enabledAuras['Precision'], true);
    assert.equal(cfg.usePowerCharges, true);
    assert.equal(cfg.useFrenzyCharges, true);
    const calc = calculateCharacterStats(snap, cfg);
    assert.ok(calc.detectedCurses.includes("Assassin's Mark"));
    assert.ok(calc.offense.weaponEdps > 200, `Expected Dex-stacking eDPS > 200, got ${calc.offense.weaponEdps}`);
    assert.equal(calc.offense.frenzyMoreDmgPct, 12);
    assert.equal(calc.offense.powerIncCritPct, 150);
  });

  it('9. Spell / Minion / RF Archetype: Flagged as isSpellOrMinionOrDot (skips Attack Accuracy holes)', () => {
    const rfSnap = makeSnap({
      equipped: [
        {
          id: 'body1',
          inventoryId: 'BodyArmour',
          name: 'RF Chest',
          baseType: 'Royal Plate',
          typeLine: 'Royal Plate',
          frameType: 2,
          ilvl: 85,
          socketedGems: [
            { name: 'Righteous Fire', colour: 'B', socket: 0, group: 0, level: 20, quality: 20, support: false },
            { name: 'Burning Damage Support', colour: 'R', socket: 1, group: 0, level: 20, quality: 20, support: true }
          ]
        }
      ]
    });
    const traits = detectBuildTraits(rfSnap, 'Righteous Fire');
    assert.equal(traits.isSpellOrMinionOrDot, true);
  });

  it('10. Mageblood + Determination/Grace (PoE 3.25+ Lua-verified constants)', () => {
    const snap = makeSnap({
      equipped: [
        {
          id: 'belt1',
          inventoryId: 'Belt',
          name: 'Mageblood',
          baseType: 'Heavy Belt',
          typeLine: 'Heavy Belt',
          frameType: 3,
          ilvl: 85,
          socketedGems: []
        },
        {
          id: 'f1',
          inventoryId: 'Flask',
          name: 'Granite Flask',
          baseType: 'Granite Flask',
          typeLine: 'Granite Flask',
          frameType: 1,
          ilvl: 84,
          explicitMods: ['55% increased Armour during Effect']
        },
        {
          id: 'h1',
          inventoryId: 'Helm',
          name: 'Aura Helm',
          baseType: 'Royal Burgonet',
          typeLine: 'Royal Burgonet',
          frameType: 2,
          ilvl: 84,
          socketedGems: [
            { name: 'Determination', colour: 'R', socket: 0, group: 0, level: 20, quality: 0, support: false },
            { name: 'Grace', colour: 'G', socket: 1, group: 0, level: 20, quality: 0, support: false }
          ]
        }
      ]
    });
    const cfg = buildDefaultCalcConfig(snap);
    assert.equal(cfg.flasksActive, true, 'Mageblood should auto-enable flasksActive');
    const calc = calculateCharacterStats(snap, cfg);
    assert.equal(calc.armour.fromDetermination, 1026);
    assert.equal(calc.armour.fromFlasks, 1500);
    assert.equal(calc.evasion.fromGrace, 1545);
  });
});
