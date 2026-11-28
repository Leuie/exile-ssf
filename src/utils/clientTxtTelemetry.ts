// Untapped Client.txt Telemetry Engine:
// Parses NPC Mechanic Spawns, Nameless Seer alerts, /passives & /played audits,
// Death Forensics, GSF Trade Ledger, Instance Crash/DC stats, and Campaign Auto-Splitter zones.

export interface MechanicSpawnCount {
  id: string;
  label: string;
  count: number;
  lastSeenAt: string;
}

export interface DeathForensicEntry {
  timestamp: string;
  character: string;
  areaName: string;
  areaLevel?: number;
  recentContext: string;
}

export interface GsfTradeLedgerEntry {
  timestamp: string;
  player: string;
  whisperSnippet: string;
}

export interface PassivesAuditResult {
  totalQuestPoints: number;
  missingQuests: string[];
  playedText?: string;
}

export interface ClientTxtTelemetry {
  mechanics: MechanicSpawnCount[];
  namelessSeerCount: number;
  lastNamelessSeerAt: string;
  deaths: DeathForensicEntry[];
  trades: GsfTradeLedgerEntry[];
  passivesAudit: PassivesAuditResult | null;
  disconnects: number;
  instanceFailures: number;
  campaignZonesVisited: string[];
}

export const CAMPAIGN_SYNC_STORAGE_KEY = 'exile_ssf_client_campaign_zones_v1';
export const CAMPAIGN_SYNC_EVENT = 'exile-ssf:campaign-zones-updated';

const MECHANIC_PATTERNS: Array<{ id: string; label: string; regex: RegExp }> = [
  { id: 'nameless_seer', label: 'Nameless Seer', regex: /The Nameless Seer:/i },
  { id: 'reflecting_mist', label: 'Reflecting Mist / Kalandra', regex: /(Kalandra:|Reflecting Mist)/i },
  { id: 'harvest', label: 'Harvest (Oshabi)', regex: /Oshabi:/i },
  { id: 'expedition', label: 'Expedition (Gwennen/Rog/Tujen/Dannig)', regex: /(Gwennen|Rog|Tujen|Dannig):/i },
  { id: 'betrayal', label: 'Betrayal (Jun / Syndicate)', regex: /(Jun, Veiled Master|Aisling|Cameria|Elreon|Gravicius|Guff|Haku|Hillock|It That Fled|Janus|Jorgin|Korell|Leo|Riker|Rin|Tora|Vagan|Vorici|Catarina):/i },
  { id: 'blight', label: 'Blight (Sister Cassia)', regex: /Sister Cassia:/i },
  { id: 'incursion', label: 'Incursion (Alva)', regex: /Alva, Master Explorer:|Alva:/i },
  { id: 'bestiary', label: 'Bestiary (Einhar)', regex: /Einhar, Beastmaster:|Einhar:/i },
  { id: 'ultimatum', label: 'Ultimatum (Trialmaster)', regex: /The Trialmaster:/i },
  { id: 'eldritch', label: 'Maven / Exarch / Eater', regex: /(The Maven|The Searing Exarch|The Eater of Worlds|The Envoy):/i }
];

export function parseClientTxtTelemetry(rawText: string, minTsMs = 0): ClientTxtTelemetry {
  const lines = rawText.split(/\r?\n/);

  const mechMap = new Map<string, { label: string; count: number; lastSeenAt: string; lastTs: number }>();
  let namelessSeerCount = 0;
  let lastNamelessSeerAt = '';

  const deaths: DeathForensicEntry[] = [];
  const trades: GsfTradeLedgerEntry[] = [];
  let disconnects = 0;
  let instanceFailures = 0;

  let currentArea = 'Unknown';
  let currentAreaLevel: number | undefined;
  let lastNpcLine = '';
  let lastNpcTs = 0;
  let lastWhisper: { player: string; snippet: string; ts: number } | null = null;

  let totalQuestPoints = -1;
  const missingQuests: string[] = [];
  let playedText: string | undefined;

  const visitedZones = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.length < 22) continue;

    const tsMatch = line.match(/^(\d{4})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
    if (!tsMatch) continue;
    const ts = new Date(
      Number(tsMatch[1]),
      Number(tsMatch[2]) - 1,
      Number(tsMatch[3]),
      Number(tsMatch[4]),
      Number(tsMatch[5]),
      Number(tsMatch[6])
    ).getTime();
    if (!Number.isFinite(ts) || ts < minTsMs) continue;
    const tsLabel = `${tsMatch[1]}-${tsMatch[2]}-${tsMatch[3]} ${tsMatch[4]}:${tsMatch[5]}`;

    // Track current area & area level
    const genMatch = line.match(/Generating level (\d+) area "([^"]+)"/i);
    if (genMatch) {
      currentAreaLevel = Number(genMatch[1]);
      continue;
    }

    const enterMatch = line.match(/You have entered (.+)\./i);
    if (enterMatch) {
      currentArea = enterMatch[1].trim();
      visitedZones.add(currentArea);
      continue;
    }

    // Track incoming whispers for Trade Ledger pairing
    const fromMatch = line.match(/\]\s*@From\s+(?:<[^>]+>\s+)?([^:]+):\s*(.+)$/);
    if (fromMatch) {
      lastWhisper = {
        player: fromMatch[1].trim(),
        snippet: fromMatch[2].trim().slice(0, 120),
        ts
      };
      continue;
    }

    // Pair Trade accepted with most recent incoming whisper (within 3 minutes)
    if (/:\s*Trade accepted\./i.test(line)) {
      if (lastWhisper && ts - lastWhisper.ts <= 180_000) {
        trades.push({
          timestamp: tsLabel,
          player: lastWhisper.player,
          whisperSnippet: lastWhisper.snippet
        });
      } else {
        trades.push({
          timestamp: tsLabel,
          player: 'Squad / Trade Partner',
          whisperSnippet: 'Trade completed'
        });
      }
      continue;
    }

    // Death Forensics
    const deathMatch = line.match(/:\s*([^\s:]+)\s+has been slain\./i);
    if (deathMatch) {
      deaths.push({
        timestamp: tsLabel,
        character: deathMatch[1].trim(),
        areaName: currentArea,
        areaLevel: currentAreaLevel,
        recentContext: ts - lastNpcTs <= 35_000 && lastNpcLine ? lastNpcLine : 'Standard combat / map hazard'
      });
      continue;
    }

    // Instance crash & disconnect tracking
    if (/Abnormal disconnection|Disconnected from server/i.test(line)) {
      disconnects += 1;
      continue;
    }
    if (/Failed to join any instances/i.test(line)) {
      instanceFailures += 1;
      continue;
    }

    // /passives & /played output parsing
    const passivesSummary = line.match(/You have (\d+) passive skill points? from quests/i);
    if (passivesSummary) {
      totalQuestPoints = Number(passivesSummary[1]);
      continue;
    }
    const missingQuestM = line.match(/:\s*0\s+from\s+(.+)$/i);
    if (missingQuestM) {
      const qName = missingQuestM[1].trim();
      if (qName && !missingQuests.includes(qName)) missingQuests.push(qName);
      continue;
    }
    const playedM = line.match(/You have played for (.+)\./i);
    if (playedM) {
      playedText = playedM[1].trim();
      continue;
    }

    // NPC Dialogue -> Mechanic Spawn Detection (deduplicate per 90s window so multi-line speeches count once per map)
    for (const mp of MECHANIC_PATTERNS) {
      if (mp.regex.test(line)) {
        const msgPart = line.split('] ').slice(1).join('] ').trim();
        lastNpcLine = msgPart.slice(0, 120);
        lastNpcTs = ts;
        const prev = mechMap.get(mp.id);
        if (!prev || ts - prev.lastTs > 90_000) {
          mechMap.set(mp.id, {
            label: mp.label,
            count: (prev?.count || 0) + 1,
            lastSeenAt: tsLabel,
            lastTs: ts
          });
          if (mp.id === 'nameless_seer') {
            namelessSeerCount += 1;
            lastNamelessSeerAt = tsLabel;
          }
        }
        break;
      }
    }
  }

  const mechanics: MechanicSpawnCount[] = Array.from(mechMap.entries())
    .map(([id, v]) => ({ id, label: v.label, count: v.count, lastSeenAt: v.lastSeenAt }))
    .sort((a, b) => b.count - a.count);

  const passivesAudit: PassivesAuditResult | null =
    totalQuestPoints >= 0 || missingQuests.length > 0 || playedText
      ? {
          totalQuestPoints: Math.max(0, totalQuestPoints),
          missingQuests,
          playedText
        }
      : null;

  return {
    mechanics,
    namelessSeerCount,
    lastNamelessSeerAt,
    deaths: deaths.reverse().slice(0, 30),
    trades: trades.reverse().slice(0, 30),
    passivesAudit,
    disconnects,
    instanceFailures,
    campaignZonesVisited: Array.from(visitedZones)
  };
}

export function publishCampaignZonesVisited(zones: string[]): void {
  if (typeof window === 'undefined' || zones.length === 0) return;
  try {
    const existingRaw = localStorage.getItem(CAMPAIGN_SYNC_STORAGE_KEY);
    const existing: string[] = existingRaw ? JSON.parse(existingRaw) : [];
    const merged = Array.from(new Set([...existing, ...zones]));
    localStorage.setItem(CAMPAIGN_SYNC_STORAGE_KEY, JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent(CAMPAIGN_SYNC_EVENT, { detail: merged }));
  } catch {}
}

export function readCampaignZonesVisited(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CAMPAIGN_SYNC_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
