import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseClientTxtTelemetry } from '../src/utils/clientTxtTelemetry.ts';

describe('clientTxtTelemetry — Mechanic Spawns, Nameless Seer, Deaths, Trades & /passives', () => {
  it('parses NPC mechanics, Nameless Seer, Death Forensics, GSF Trades, /passives, and Campaign Zones', () => {
    const sampleLog = [
      '2026/11/28 10:00:00 1000 [INFO Client 1] Generating level 83 area "MapWorldsCrimsonTemple" with seed 12345',
      '2026/11/28 10:00:02 1001 [INFO Client 1] : You have entered Crimson Temple.',
      '2026/11/28 10:00:30 1002 [INFO Client 1] Oshabi: The Sacred Grove awaits, exile.',
      '2026/11/28 10:01:00 1003 [INFO Client 1] The Nameless Seer: Come closer, exile...',
      '2026/11/28 10:01:10 1004 [INFO Client 1] Cameria: Hand it over!',
      '2026/11/28 10:01:15 1005 [INFO Client 1] : BadManLeu has been slain.',
      '2026/11/28 10:03:00 1006 [INFO Client 1] @From <GSF> SquadMate: Hi, need that Amethyst Ring!',
      '2026/11/28 10:03:40 1007 [INFO Client 1] : Trade accepted.',
      '2026/11/28 10:04:00 1008 [INFO Client 1] : You have 22 passive skill points from quests',
      '2026/11/28 10:04:00 1009 [INFO Client 1] : 0 from Reflection of Terror',
      '2026/11/28 10:04:05 1010 [INFO Client 1] : You have played for 2 days, 4 hours, 12 minutes, 30 seconds.',
      '2026/11/28 10:05:00 1011 [INFO Client 1] Abnormal disconnection: An unexpected disconnection occurred.'
    ].join('\n');

    const res = parseClientTxtTelemetry(sampleLog, 0);
    assert.equal(res.namelessSeerCount, 1);
    assert.ok(res.mechanics.some((m) => m.id === 'harvest' && m.count === 1));
    assert.ok(res.mechanics.some((m) => m.id === 'betrayal' && m.count === 1));
    assert.equal(res.deaths.length, 1);
    assert.equal(res.deaths[0].character, 'BadManLeu');
    assert.equal(res.deaths[0].areaName, 'Crimson Temple');
    assert.equal(res.deaths[0].areaLevel, 83);
    assert.ok(res.deaths[0].recentContext.includes('Cameria'));
    assert.equal(res.trades.length, 1);
    assert.equal(res.trades[0].player, 'SquadMate');
    assert.equal(res.passivesAudit?.totalQuestPoints, 22);
    assert.deepEqual(res.passivesAudit?.missingQuests, ['Reflection of Terror']);
    assert.ok(res.passivesAudit?.playedText?.includes('2 days'));
    assert.equal(res.disconnects, 1);
    assert.ok(res.campaignZonesVisited.includes('Crimson Temple'));
  });
});
