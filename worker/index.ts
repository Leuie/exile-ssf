// Cloudflare Worker for Exile SSF
// Primary atomic storage via Cloudflare D1 (EXILE_DB) with automatic KV migration and edge OpenGraph metadata

export interface Env {
  EXILE_DB?: any;
  EXILE_KV?: any;
  ASSETS?: any;
  ROOT_WEBHOOK_URL?: string;
  WEBHOOK_URL?: string;
}

const CORS_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
};

let schemaInitialized = false;

async function ensureD1Schema(db: any): Promise<void> {
  if (schemaInitialized || !db) return;

  const statements = [
    `CREATE TABLE IF NOT EXISTS wishlists (id TEXT PRIMARY KEY, league_id TEXT NOT NULL, data TEXT NOT NULL, updated_at TEXT NOT NULL)`,
    `CREATE INDEX IF NOT EXISTS idx_wishlists_league ON wishlists(league_id)`,
    `CREATE TABLE IF NOT EXISTS roster (id TEXT PRIMARY KEY, league_id TEXT NOT NULL, display_name_lower TEXT NOT NULL, data TEXT NOT NULL, updated_at TEXT NOT NULL)`,
    `CREATE INDEX IF NOT EXISTS idx_roster_league ON roster(league_id)`,
    `CREATE TABLE IF NOT EXISTS guides (id TEXT PRIMARY KEY, league_id TEXT NOT NULL, data TEXT NOT NULL, updated_at TEXT NOT NULL)`,
    `CREATE INDEX IF NOT EXISTS idx_guides_league ON guides(league_id)`,
    `CREATE TABLE IF NOT EXISTS achievements (player_key TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS alumni (id TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS feedback (id TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS league_meta (league_id TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS custom_leagues (id TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS accounts (username_lower TEXT PRIMARY KEY, email_lower TEXT, data TEXT NOT NULL, updated_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS services (id TEXT PRIMARY KEY, league_id TEXT NOT NULL, provider_key TEXT NOT NULL, data TEXT NOT NULL, updated_at TEXT NOT NULL)`,
    `CREATE INDEX IF NOT EXISTS idx_services_league ON services(league_id)`,
    `CREATE TABLE IF NOT EXISTS vouches (id TEXT PRIMARY KEY, league_id TEXT NOT NULL, provider_key TEXT NOT NULL, data TEXT NOT NULL, created_at TEXT NOT NULL)`,
    `CREATE INDEX IF NOT EXISTS idx_vouches_league ON vouches(league_id)`,
    `CREATE TABLE IF NOT EXISTS profiles (handle_lower TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS stash_drops (id TEXT PRIMARY KEY, league_id TEXT NOT NULL, data TEXT NOT NULL, updated_at TEXT NOT NULL)`,
    `CREATE INDEX IF NOT EXISTS idx_stash_drops_league ON stash_drops(league_id)`,
    `CREATE TABLE IF NOT EXISTS boss_rotas (id TEXT PRIMARY KEY, league_id TEXT NOT NULL, data TEXT NOT NULL, updated_at TEXT NOT NULL)`,
    `CREATE INDEX IF NOT EXISTS idx_boss_rotas_league ON boss_rotas(league_id)`,
    `CREATE TABLE IF NOT EXISTS league_firsts (id TEXT PRIMARY KEY, league_id TEXT NOT NULL, data TEXT NOT NULL, updated_at TEXT NOT NULL)`,
    `CREATE INDEX IF NOT EXISTS idx_league_firsts_league ON league_firsts(league_id)`,
    `CREATE TABLE IF NOT EXISTS activity_feed (id TEXT PRIMARY KEY, league_id TEXT NOT NULL, data TEXT NOT NULL, created_at TEXT NOT NULL)`,
    `CREATE INDEX IF NOT EXISTS idx_activity_feed_league ON activity_feed(league_id, created_at DESC)`,
    `CREATE TABLE IF NOT EXISTS migrations (key TEXT PRIMARY KEY, migrated_at TEXT NOT NULL)`
  ];

  await db.batch(statements.map((sql) => db.prepare(sql)));
  schemaInitialized = true;
}

let honorSeedChecked = false;

async function seedHonorAndUmbraWitchToD1(db: any): Promise<void> {
  if (honorSeedChecked || !db) return;
  honorSeedChecked = true;
  const migKey = 'seed:honor_and_umbra_witch:v1';
  const existingMig = await db.prepare('SELECT key FROM migrations WHERE key = ?').bind(migKey).first();
  if (existingMig) return;

  const now = new Date().toISOString();
  const umbraJoinIso = '2026-11-13T19:00:00Z';
  const umbraAchId = 'league_join_poe1-330-umbra';

  // Resolve roster poeAccountNames for the 4 founding Umbra members so both handle and poeAccount keys stay in sync
  const rosterRes = await db.prepare('SELECT data FROM roster WHERE league_id = ?').bind('poe1-330-umbra').all();
  const rosterMembers = (rosterRes.results || []).map((r: any) => JSON.parse(r.data));

  const targetMembers: {
    handle: string;
    extraHonorLogs: { id: string; points: number; reason: string; where: string; timestampIso: string; kind: string }[];
    extraFulfilledCount: number;
  }[] = [
    {
      handle: 'leuie',
      extraFulfilledCount: 2,
      extraHonorLogs: [
        {
          id: 'honor-find-manual-vls-20261114',
          points: 5,
          reason: 'Found "Vaal Lightning Strike"',
          where: 'Covens of Umbra (3.30) • Wishlists',
          timestampIso: '2026-11-14T18:00:00Z',
          kind: 'item_found'
        },
        {
          id: 'honor-find-manual-stormrider-20261120',
          points: 5,
          reason: 'Found "Stormrider Boots"',
          where: 'Covens of Umbra (3.30) • Wishlists',
          timestampIso: '2026-11-20T18:00:00Z',
          kind: 'item_found'
        }
      ]
    },
    {
      handle: 'venulum',
      extraFulfilledCount: 1,
      extraHonorLogs: [
        {
          id: 'honor-find-manual-shaperstouch-20261121',
          points: 5,
          reason: 'Found "Shaper\'s Touch" for @Leuie',
          where: 'Covens of Umbra (3.30) • Wishlists',
          timestampIso: '2026-11-21T02:00:00Z',
          kind: 'item_found'
        }
      ]
    },
    { handle: 'chuyo', extraFulfilledCount: 0, extraHonorLogs: [] },
    { handle: 'queueray', extraFulfilledCount: 0, extraHonorLogs: [] }
  ];

  const batch: any[] = [];

  for (const target of targetMembers) {
    const matchedRoster = rosterMembers.find(
      (m: any) => String(m.displayName || '').trim().toLowerCase() === target.handle
    );
    const keysToUpdate = new Set<string>([target.handle]);
    if (matchedRoster?.poeAccountName) {
      keysToUpdate.add(String(matchedRoster.poeAccountName).trim().toLowerCase());
    }

    for (const playerKey of keysToUpdate) {
      const row = await db.prepare('SELECT data FROM achievements WHERE player_key = ?').bind(playerKey).first();
      const prev = row?.data
        ? JSON.parse(row.data)
        : {
            unlockedIds: {},
            lifetimeFulfilledCount: 0,
            lifetimeBountiesClaimed: 0,
            lifetimeBountiesPaid: 0,
            leaguesParticipated: [],
            honorLog: []
          };

      const nextUnlocked = { ...(prev.unlockedIds || {}) };
      if (!nextUnlocked[umbraAchId]) {
        nextUnlocked[umbraAchId] = umbraJoinIso;
      }

      const leaguesSet = new Set<string>(Array.isArray(prev.leaguesParticipated) ? prev.leaguesParticipated : []);
      leaguesSet.add('poe1-330-umbra');

      const honorMap = new Map<string, any>();
      for (const h of Array.isArray(prev.honorLog) ? prev.honorLog : []) {
        if (h?.id) honorMap.set(String(h.id), h);
      }
      if (!honorMap.has(`honor-ach-${umbraAchId}`)) {
        honorMap.set(`honor-ach-${umbraAchId}`, {
          id: `honor-ach-${umbraAchId}`,
          points: 25,
          reason: 'Unlocked Achievement: Coven of Umbra (3.30) Member',
          where: 'Covens of Umbra (3.30) • League Join',
          timestampIso: umbraJoinIso,
          kind: 'achievement'
        });
      }
      for (const entry of target.extraHonorLogs) {
        if (!honorMap.has(entry.id)) {
          honorMap.set(entry.id, entry);
        }
      }

      const merged = {
        ...prev,
        unlockedIds: nextUnlocked,
        lifetimeFulfilledCount: Math.max(Number(prev.lifetimeFulfilledCount) || 0, target.extraFulfilledCount),
        leaguesParticipated: Array.from(leaguesSet),
        honorLog: Array.from(honorMap.values()).sort((a: any, b: any) =>
          String(b.timestampIso || '').localeCompare(String(a.timestampIso || ''))
        )
      };

      batch.push(
        db
          .prepare('INSERT OR REPLACE INTO achievements (player_key, data, updated_at) VALUES (?, ?, ?)')
          .bind(playerKey, JSON.stringify(merged), now)
      );
    }
  }

  batch.push(db.prepare('INSERT OR REPLACE INTO migrations (key, migrated_at) VALUES (?, ?)').bind(migKey, now));
  if (batch.length > 0) {
    await db.batch(batch);
  }
}


async function migrateKvToD1ForLeague(env: Env, leagueId: string): Promise<void> {
  if (!env.EXILE_DB || !env.EXILE_KV) return;
  const db = env.EXILE_DB;
  const kv = env.EXILE_KV;
  const now = new Date().toISOString();

  // 1. Per league migration check
  const leagueMigKey = `kv_to_d1:league:${leagueId}`;
  const leagueMigrated = await db.prepare('SELECT key FROM migrations WHERE key = ?').bind(leagueMigKey).first();
  if (!leagueMigrated) {
    const [wishlistRaw, rosterRaw, guidesRaw, metaRaw] = await Promise.all([
      kv.get(`league:${leagueId}:wishlist`),
      kv.get(`league:${leagueId}:roster`),
      kv.get(`league:${leagueId}:guides`),
      kv.get(`league:${leagueId}:meta`)
    ]);

    const batch: any[] = [];
    if (wishlistRaw) {
      const items: any[] = JSON.parse(wishlistRaw);
      for (const item of items) {
        if (item?.id) {
          batch.push(
            db.prepare('INSERT OR IGNORE INTO wishlists (id, league_id, data, updated_at) VALUES (?, ?, ?, ?)')
              .bind(String(item.id), leagueId, JSON.stringify(item), now)
          );
        }
      }
    }
    if (rosterRaw) {
      const members: any[] = JSON.parse(rosterRaw);
      for (const m of members) {
        const id = String(m.id || `member-${(m.displayName || '').toLowerCase()}`);
        const disp = String(m.displayName || m.characterName || id).toLowerCase();
        batch.push(
          db.prepare('INSERT OR IGNORE INTO roster (id, league_id, display_name_lower, data, updated_at) VALUES (?, ?, ?, ?, ?)')
            .bind(id, leagueId, disp, JSON.stringify({ ...m, id }), now)
        );
      }
    }
    if (guidesRaw) {
      const guides: any[] = JSON.parse(guidesRaw);
      for (const g of guides) {
        const id = String(g.id || g.slug || `guide-${Date.now()}`);
        batch.push(
          db.prepare('INSERT OR IGNORE INTO guides (id, league_id, data, updated_at) VALUES (?, ?, ?, ?)')
            .bind(id, leagueId, JSON.stringify(g), now)
        );
      }
    }
    if (metaRaw) {
      batch.push(
        db.prepare('INSERT OR IGNORE INTO league_meta (league_id, data, updated_at) VALUES (?, ?, ?)')
          .bind(leagueId, metaRaw, now)
      );
    }

    batch.push(
      db.prepare('INSERT OR REPLACE INTO migrations (key, migrated_at) VALUES (?, ?)').bind(leagueMigKey, now)
    );
    if (batch.length > 0) await db.batch(batch);
  }

  // 2. Global tables migration check
  const globalMigKey = 'kv_to_d1:global:v1';
  const globalMigrated = await db.prepare('SELECT key FROM migrations WHERE key = ?').bind(globalMigKey).first();
  if (!globalMigrated) {
    const [achRaw, alumniRaw, fbRaw, leaguesRaw, accountsRaw] = await Promise.all([
      kv.get('global:achievements'),
      kv.get('global:alumni'),
      kv.get('global:feedback'),
      kv.get('global:leagues'),
      kv.get('global:accounts')
    ]);

    const batch: any[] = [];
    if (achRaw) {
      const store: Record<string, any> = JSON.parse(achRaw);
      for (const [playerKey, prof] of Object.entries(store)) {
        batch.push(
          db.prepare('INSERT OR IGNORE INTO achievements (player_key, data, updated_at) VALUES (?, ?, ?)')
            .bind(playerKey.toLowerCase(), JSON.stringify(prof), now)
        );
      }
    }
    if (alumniRaw) {
      const list: any[] = JSON.parse(alumniRaw);
      for (const a of list) {
        if (a?.id) {
          batch.push(
            db.prepare('INSERT OR IGNORE INTO alumni (id, data, updated_at) VALUES (?, ?, ?)')
              .bind(String(a.id), JSON.stringify(a), now)
          );
        }
      }
    }
    if (fbRaw) {
      const list: any[] = JSON.parse(fbRaw);
      for (const f of list) {
        if (f?.id) {
          batch.push(
            db.prepare('INSERT OR IGNORE INTO feedback (id, data, updated_at) VALUES (?, ?, ?)')
              .bind(String(f.id), JSON.stringify(f), now)
          );
        }
      }
    }
    if (leaguesRaw) {
      const list: any[] = JSON.parse(leaguesRaw);
      for (const l of list) {
        if (l?.id) {
          batch.push(
            db.prepare('INSERT OR IGNORE INTO custom_leagues (id, data, updated_at) VALUES (?, ?, ?)')
              .bind(String(l.id), JSON.stringify(l), now)
          );
        }
      }
    }
    if (accountsRaw) {
      const list: any[] = JSON.parse(accountsRaw);
      for (const acc of list) {
        if (acc?.username) {
          batch.push(
            db.prepare('INSERT OR IGNORE INTO accounts (username_lower, email_lower, data, updated_at) VALUES (?, ?, ?, ?)')
              .bind(acc.username.toLowerCase(), acc.email ? acc.email.toLowerCase() : null, JSON.stringify(acc), now)
          );
        }
      }
    }

    batch.push(
      db.prepare('INSERT OR REPLACE INTO migrations (key, migrated_at) VALUES (?, ?)').bind(globalMigKey, now)
    );
    if (batch.length > 0) await db.batch(batch);
  }
}

interface PageMeta {
  title: string;
  description: string;
}

function escapeHtmlAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function resolveLeagueDisplayName(leagueId: string): string {
  const clean = leagueId.toLowerCase().trim();
  if (clean === 'poe1-330-umbra') return 'Ravenwatch Covens of Umbra GSF (3.30)';
  if (clean === 'poe2-05-ancients') return 'Ravenwatch Return of the Ancients GSF (0.5)';
  return 'Exile SSF Private League';
}

function resolveOfficialLadderName(leagueId: string, customName?: string | null): string {
  if (customName && customName.trim()) return customName.trim();
  const clean = leagueId.toLowerCase().trim();
  if (clean === 'poe1-330-umbra') return 'Ravenwatch Covens of Umbra GSF (PL87651)';
  return leagueId;
}

function resolvePageMeta(url: URL): PageMeta {
  const path = url.pathname.toLowerCase().replace(/\/+$/, '') || '/';
  const queryTab = (url.searchParams.get('tab') || url.searchParams.get('page') || '').toLowerCase().trim();

  if (path.startsWith('/league/')) {
    const parts = path.replace('/league/', '').split('/').filter(Boolean);
    const leagueId = parts[0] || 'poe1-330-umbra';
    const subTab = parts[1] || queryTab || 'command-center';
    const leagueName = resolveLeagueDisplayName(leagueId);

    if (subTab === 'wishlists' || subTab === 'wishlist' || subTab === 'needs' || subTab === 'looking_for' || subTab === 'looking-for') {
      return {
        title: `Wishlists | ${leagueName} | Exile SSF`,
        description: `Track wanted uniques, gems, boss fragments, and crafting bases across ${leagueName}. Filter by character for farming sessions and match drops in one click.`
      };
    }
    if (subTab === 'bounties' || subTab === 'bounty' || subTab === 'honors' || subTab === 'achievements' || subTab === 'rewards') {
      return {
        title: `Bounties | ${leagueName} | Exile SSF`,
        description: `Post incentivized finder bounties, browse squad boss carries and vouches, track Fulfillment Heroes, and unlock achievements that carry over across future seasons.`
      };
    }
    if (subTab === 'roster' || subTab === 'roster-directory' || subTab === 'directory') {
      return {
        title: `Roster | ${leagueName} | Exile SSF`,
        description: `View active private league account slots, multi character builds, ascendancies, live ladder levels, and direct contact handles for every exile in ${leagueName}.`
      };
    }
    if (subTab === 'guides' || subTab === 'build-guides' || subTab === 'buildguides') {
      return {
        title: `Builds | ${leagueName} | Exile SSF`,
        description: `Explore curated SSF league starter and endgame build guides with PoB links, class filters, and one click import of required uniques to your wishlist.`
      };
    }
    if (subTab === 'cheatsheets' || subTab === 'cheat-sheets' || subTab === 'mechanics') {
      return {
        title: `Cheat Sheets | ${leagueName} | Exile SSF`,
        description: `Quick reference tables for 3.30.0d Threads of Creation thresholds, Betrayal Syndicate rewards, Heist Rogues, Delve Fossils, Incursion rooms, and Atlas Maps.`
      };
    }
    if (subTab === 'bench' || subTab === 'bench-stash-guide' || subTab === 'new_player' || subTab === 'stash') {
      return {
        title: `Crafting Bench | ${leagueName} | Exile SSF`,
        description: `Essential crafting bench recipe unlock locations and prioritized stash tab buyer tiers for Solo Self Found and Group Self Found progression.`
      };
    }
    if (subTab === 'feed' || subTab === 'activity' || subTab === 'wall') {
      return {
        title: `League Feed | ${leagueName} | Exile SSF`,
        description: `Live activity wall for ${leagueName} tracking new exiles, characters, wishlist drops, bounties, fulfillments, build guides, and achievements.`
      };
    }
    if (subTab === 'alumni' || subTab === 'alumni-directory') {
      return {
        title: `Alumni | ${leagueName} | Exile SSF`,
        description: `Historical directory of over 100 past private league participants across 5 seasons with preferred contact tags and squad outreach tools.`
      };
    }
    return {
      title: `Command Center | ${leagueName} | Exile SSF`,
      description: `League headquarters for ${leagueName} with live crowdfunding status, countdown timers, 4 step onboarding, community links, archives, and F.A.Q.`
    };
  }

  if (path.startsWith('/exile/') || path.startsWith('/player/')) {
    const rawHandle = decodeURIComponent(path.replace(/^\/(exile|player)\//, '').split('/')[0] || 'Exile');
    const cleanHandle = rawHandle.replace(/^@/, '');
    return {
      title: `@${cleanHandle} | Exile Profile | Exile SSF`,
      description: `View @${cleanHandle}'s character roster, open wishlists and bounties, boss carry services, verified vouches, and achievements on Exile SSF.`
    };
  }

  if (path === '/privateleaguehub' || path === '/privateleagues') {
    return {
      title: 'Private League Directory | Exile SSF',
      description: 'Browse active and upcoming Group Self Found private leagues for Path of Exile 1 and Path of Exile 2, or launch a new community league.'
    };
  }

  if (path.startsWith('/guide/')) {
    return {
      title: 'Build Guide Reader | Exile SSF',
      description: 'Full interactive Path of Exile SSF build guide with leveling progression, endgame gearing, PoB links, and one click wishlist unique import.'
    };
  }

  if (path === '/login') {
    return {
      title: 'Sign In | Exile SSF',
      description: 'Sign in to your Exile SSF account to sync characters, wishlists, item bounties, and achievements across private league seasons.'
    };
  }

  if (path === '/register') {
    return {
      title: 'Register Account | Exile SSF',
      description: 'Create your Exile SSF profile to join private leagues, register multiple characters, post wanted items, and track achievements.'
    };
  }

  if (path === '/admin') {
    return {
      title: 'League Admin Portal | Exile SSF',
      description: 'Host administration tools for managing private league rosters, ownership assignments, resource links, and seasonal resets.'
    };
  }

  return {
    title: 'Exile SSF | Path of Exile 1 & 2 Compendium and GSF Portal',
    description: 'All in one Solo Self Found compendium and Group Self Found private league hub for Path of Exile 1 (3.30.0d) and Path of Exile 2 (0.5).'
  };
}

function injectMetaIntoHtml(html: string, meta: PageMeta, pageUrl: string): string {
  const safeTitle = escapeHtmlAttr(meta.title);
  const safeDesc = escapeHtmlAttr(meta.description);
  const safeUrl = escapeHtmlAttr(pageUrl);

  return html
    .replace(/<title>[^<]*<\/title>/i, `<title>${safeTitle}</title>`)
    .replace(/<meta name="description" content="[^"]*" \/>/i, `<meta name="description" content="${safeDesc}" />`)
    .replace(/<meta property="og:title" content="[^"]*" \/>/i, `<meta property="og:title" content="${safeTitle}" />`)
    .replace(/<meta property="og:description" content="[^"]*" \/>/i, `<meta property="og:description" content="${safeDesc}" />`)
    .replace(/<meta property="og:url" content="[^"]*" \/>/i, `<meta property="og:url" content="${safeUrl}" />`)
    .replace(/<meta name="twitter:title" content="[^"]*" \/>/i, `<meta name="twitter:title" content="${safeTitle}" />`)
    .replace(/<meta name="twitter:description" content="[^"]*" \/>/i, `<meta name="twitter:description" content="${safeDesc}" />`);
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

async function computeSha256Hex(str: string): Promise<string> {
  const data = new TextEncoder().encode(str);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return toHex(hash);
}

async function hashPasswordPBKDF2(password: string, existingSaltHex?: string): Promise<string> {
  const salt = existingSaltHex ? fromHex(existingSaltHex) : crypto.getRandomValues(new Uint8Array(16));
  const saltHex = existingSaltHex || toHex(salt.buffer as ArrayBuffer);
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as any, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return `pbkdf2:${saltHex}:${toHex(derived)}`;
}

async function verifyPassword(password: string, storedHash: string): Promise<{ valid: boolean; needsUpgrade: boolean }> {
  if (!storedHash) return { valid: false, needsUpgrade: false };
  if (storedHash.startsWith('pbkdf2:')) {
    const parts = storedHash.split(':');
    if (parts.length !== 3) return { valid: false, needsUpgrade: false };
    const candidate = await hashPasswordPBKDF2(password, parts[1]);
    return { valid: candidate === storedHash, needsUpgrade: false };
  }
  // Legacy SHA-256 compatibility with automatic upgrade to PBKDF2
  const sha = await computeSha256Hex(password);
  if (sha === storedHash) {
    return { valid: true, needsUpgrade: true };
  }
  return { valid: false, needsUpgrade: false };
}


interface WebhookConfig {
  url: string;
  enabled: boolean;
  events: string[];
}

const DEFAULT_WEBHOOK_EVENTS = [
  'bounty_listed',
  'item_fulfilled',
  'boss_rota',
  'league_first',
  'achievement_earned',
  'roster_join'
];

async function getWebhookConfig(env: Env, db: any): Promise<WebhookConfig> {
  try {
    const row = await db.prepare('SELECT data FROM league_meta WHERE league_id = ?').bind('global:webhook').first();
    if (row?.data) {
      const parsed = JSON.parse(row.data);
      return {
        url: String(parsed.url || env.ROOT_WEBHOOK_URL || env.WEBHOOK_URL || '').trim(),
        enabled: parsed.enabled !== false,
        events: Array.isArray(parsed.events) ? parsed.events : DEFAULT_WEBHOOK_EVENTS
      };
    }
  } catch {}
  const fallbackUrl = String(env.ROOT_WEBHOOK_URL || env.WEBHOOK_URL || '').trim();
  return {
    url: fallbackUrl,
    enabled: Boolean(fallbackUrl),
    events: DEFAULT_WEBHOOK_EVENTS
  };
}

async function dispatchWebhookAlert(env: Env, db: any, leagueId: string, event: any): Promise<boolean> {
  try {
    const cfg = await getWebhookConfig(env, db);
    if (!cfg.enabled || !cfg.url) return false;
    if (!cfg.events.includes(event.type)) return false;

    const leagueLabel = resolveLeagueDisplayName(leagueId);
    const feedUrl = `https://exilessf.app/league/${encodeURIComponent(leagueId)}/feed`;
    const typeLabels: Record<string, string> = {
      bounty_listed: '💰 NEW BOUNTY',
      item_fulfilled: '🎁 SQUAD DROP FULFILLED',
      boss_rota: '🔥 BOSS ROTA OPEN',
      league_first: '🏆 LEAGUE FIRST CLAIMED',
      achievement_earned: '🏅 ACHIEVEMENT UNLOCKED',
      roster_join: '⚔️ NEW EXILE JOINED',
      character_posted: '⚡ CHARACTER MILESTONE'
    };
    const badge = typeLabels[event.type] || '📣 LEAGUE ACTIVITY';
    const contentLine = `**${badge}** | **@${event.actorHandle}**: ${event.title}${event.detail ? `\n> ${event.detail}` : ''}\n${feedUrl}`;

    const res = await fetch(cfg.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'Exile SSF Bot',
        content: contentLine,
        embeds: [
          {
            title: `${badge} • ${leagueLabel}`,
            description: `**@${event.actorHandle}** — ${event.title}${event.detail ? `\n${event.detail}` : ''}`,
            url: feedUrl,
            color: event.type === 'bounty_listed' ? 15844367 : event.type === 'item_fulfilled' ? 3066993 : 6513905,
            timestamp: event.createdAtIso || new Date().toISOString()
          }
        ]
      })
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function runScheduledLadderSync(env: Env): Promise<void> {
  if (!env.EXILE_DB) return;
  const db = env.EXILE_DB;
  await ensureD1Schema(db);
  await seedHonorAndUmbraWitchToD1(db);

  const leagueId = 'poe1-330-umbra';
  const officialName = resolveOfficialLadderName(leagueId);
  const ladderUrl = `https://api.pathofexile.com/ladders/${encodeURIComponent(officialName)}?limit=200`;

  try {
    const res = await fetch(ladderUrl, {
      headers: {
        'User-Agent': 'OAuth exile-ssf/1.0 (contact: exilessf.app)',
        Accept: 'application/json'
      }
    });
    if (!res.ok) return;
    const payload = (await res.json()) as any;
    const entries = Array.isArray(payload?.entries) ? payload.entries : [];
    if (entries.length === 0) return;

    const now = new Date().toISOString();
    // Refresh 5 min KV cache too
    if (env.EXILE_KV) {
      const normalized = entries.map((e: any) => ({
        rank: Number(e.rank) || 0,
        characterName: String(e.character?.name || ''),
        accountName: String(e.account?.name || ''),
        ascendancy: String(e.character?.class || ''),
        level: Number(e.character?.level) || 1,
        experience: Number(e.character?.experience) || 0,
        dead: Boolean(e.dead),
        online: Boolean(e.online)
      }));
      await env.EXILE_KV.put(
        `ladder:${leagueId}:${officialName.toLowerCase()}`,
        JSON.stringify({ status: 'ok', leagueName: officialName, total: entries.length, syncedAtIso: now, entries: normalized }),
        { expirationTtl: 600 }
      );
    }

    const rosterRes = await db.prepare('SELECT id, display_name_lower, data FROM roster WHERE league_id = ?').bind(leagueId).all();
    const rosterRows = rosterRes.results || [];
    const batch: any[] = [];
    const milestoneEvents: any[] = [];

    for (const row of rosterRows) {
      const member = JSON.parse(row.data);
      const poeAcc = String(member.poeAccountName || '').trim().toLowerCase();
      const poeBase = poeAcc.split('#')[0];
      if (!poeBase) continue;

      const matchedEntries = entries.filter((e: any) => {
        const acc = String(e.account?.name || '').trim().toLowerCase();
        return acc === poeAcc || acc.split('#')[0] === poeBase;
      });
      if (matchedEntries.length === 0) continue;

      const existingChars: any[] = Array.isArray(member.characters) && member.characters.length > 0
        ? [...member.characters]
        : [{
            id: `char-main-${member.id}`,
            characterName: member.characterName || member.displayName,
            ascendancy: member.ascendancy || 'Unassigned',
            className: member.className || 'Exile',
            buildName: member.buildName || 'Starter',
            level: Number(member.level) || 1,
            isMain: true
          }];

      let changed = false;
      for (const e of matchedEntries) {
        const cName = String(e.character?.name || '').trim();
        const cLvl = Number(e.character?.level) || 1;
        const cAsc = String(e.character?.class || '').trim();
        if (!cName) continue;

        const idx = existingChars.findIndex((c) => String(c.characterName || '').trim().toLowerCase() === cName.toLowerCase());
        if (idx >= 0) {
          const prevLvl = Number(existingChars[idx].level) || 1;
          if (cLvl !== prevLvl || (cAsc && existingChars[idx].ascendancy !== cAsc)) {
            existingChars[idx] = { ...existingChars[idx], level: cLvl, ascendancy: cAsc || existingChars[idx].ascendancy };
            changed = true;
          }
        } else {
          existingChars.push({
            id: `char-ladder-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
            characterName: cName,
            ascendancy: cAsc || 'Exile',
            className: cAsc || 'Exile',
            buildName: `${cAsc || 'Exile'} (Ladder Synced)`,
            level: cLvl,
            isMain: false
          });
          changed = true;
        }

        // Check Level 90, 95, 100 Milestones (deduplicated by deterministic feed ID)
        for (const milestone of [90, 95, 100]) {
          if (cLvl >= milestone) {
            const evId = `milestone_lvl_${milestone}_${cName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
            const exists = await db.prepare('SELECT id FROM activity_feed WHERE id = ?').bind(evId).first();
            if (!exists) {
              const ev = {
                id: evId,
                leagueId,
                type: milestone === 100 ? 'league_first' : 'character_posted',
                actorHandle: member.displayName,
                actorCharacter: cName,
                title: `Reached Level ${milestone} on ${cName} (${cAsc})!`,
                detail: 'Auto detected by 10 minute Background PoE Ladder Sync',
                targetTab: 'roster',
                createdAtIso: now
              };
              batch.push(
                db.prepare('INSERT OR IGNORE INTO activity_feed (id, league_id, data, created_at) VALUES (?, ?, ?, ?)')
                  .bind(evId, leagueId, JSON.stringify(ev), now)
              );
              milestoneEvents.push(ev);
            }
          }
        }
      }

      if (changed) {
        const topChar = [...existingChars].sort((a, b) => (Number(b.level) || 0) - (Number(a.level) || 0))[0];
        const updatedMember = {
          ...member,
          level: Math.max(Number(member.level) || 1, Number(topChar?.level) || 1),
          characters: existingChars
        };
        batch.push(
          db.prepare('INSERT OR REPLACE INTO roster (id, league_id, display_name_lower, data, updated_at) VALUES (?, ?, ?, ?, ?)')
            .bind(row.id, leagueId, row.display_name_lower, JSON.stringify(updatedMember), now)
        );
      }
    }

    if (batch.length > 0) {
      await db.batch(batch);
    }
    for (const ev of milestoneEvents) {
      await dispatchWebhookAlert(env, db, leagueId, ev);
    }
  } catch {}
}

export default {
  async scheduled(_controller: any, env: Env, ctx: any): Promise<void> {
    ctx?.waitUntil ? ctx.waitUntil(runScheduledLadderSync(env)) : await runScheduledLadderSync(env);
  },

  async fetch(request: Request, env: Env, ctx?: any): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (url.pathname.startsWith('/api/')) {
      const db = env.EXILE_DB;
      if (!db) {
        return new Response(
          JSON.stringify({
            status: 'unconfigured',
            message: 'Cloudflare D1 binding EXILE_DB is not configured.'
          }),
          { status: 200, headers: CORS_HEADERS }
        );
      }

      try {
        await ensureD1Schema(db);
      await seedHonorAndUmbraWitchToD1(db);
      } catch (err: any) {
        return new Response(JSON.stringify({ status: 'error', message: `D1 init error: ${err.message}` }), {
          status: 500,
          headers: CORS_HEADERS
        });
      }

      const leagueId = url.searchParams.get('league') || 'poe1-330-umbra';
      const now = new Date().toISOString();

      // GET /api/data (Single atomic round trip from D1 with automatic KV migration)
      if (url.pathname === '/api/data' && request.method === 'GET') {
        try {
          await migrateKvToD1ForLeague(env, leagueId);

          const [wishRes, rosterRes, guideRes, achRes, alumniRes, metaRes, svcRes, vouchRes, stashRes, rotaRes, firstsRes, feedRes] = await Promise.all([
            db.prepare('SELECT data FROM wishlists WHERE league_id = ? ORDER BY updated_at DESC').bind(leagueId).all(),
            db.prepare('SELECT data FROM roster WHERE league_id = ?').bind(leagueId).all(),
            db.prepare('SELECT data FROM guides WHERE league_id = ? ORDER BY updated_at DESC').bind(leagueId).all(),
            db.prepare('SELECT player_key, data FROM achievements').all(),
            db.prepare('SELECT data FROM alumni').all(),
            db.prepare('SELECT data FROM league_meta WHERE league_id = ?').bind(leagueId).first(),
            db.prepare('SELECT data FROM services WHERE league_id = ? ORDER BY updated_at DESC').bind(leagueId).all(),
            db.prepare('SELECT data FROM vouches WHERE league_id = ? ORDER BY created_at DESC').bind(leagueId).all(),
            db.prepare('SELECT data FROM stash_drops WHERE league_id = ? ORDER BY updated_at DESC').bind(leagueId).all(),
            db.prepare('SELECT data FROM boss_rotas WHERE league_id = ? ORDER BY updated_at DESC').bind(leagueId).all(),
            db.prepare('SELECT data FROM league_firsts WHERE league_id = ? ORDER BY updated_at DESC').bind(leagueId).all(),
            db.prepare('SELECT data FROM activity_feed WHERE league_id = ? ORDER BY created_at DESC LIMIT 100').bind(leagueId).all()
          ]);

          const wishlist = (wishRes.results || []).map((r: any) => JSON.parse(r.data));
          const roster = (rosterRes.results || []).map((r: any) => JSON.parse(r.data));
          const guides = (guideRes.results || []).map((r: any) => JSON.parse(r.data));
          const achievements: Record<string, any> = {};
          for (const row of achRes.results || []) {
            achievements[row.player_key] = JSON.parse(row.data);
          }
          const alumni = (alumniRes.results || []).map((r: any) => JSON.parse(r.data));
          const meta = metaRes?.data ? JSON.parse(metaRes.data) : null;
          const services = (svcRes.results || []).map((r: any) => JSON.parse(r.data));
          const vouches = (vouchRes.results || []).map((r: any) => JSON.parse(r.data));
          const stashDrops = (stashRes.results || []).map((r: any) => JSON.parse(r.data));
          const bossRotas = (rotaRes.results || []).map((r: any) => JSON.parse(r.data));
          const leagueFirsts = (firstsRes.results || []).map((r: any) => JSON.parse(r.data));
          const activityFeed = (feedRes.results || []).map((r: any) => JSON.parse(r.data));

          return new Response(
            JSON.stringify({
              status: 'connected',
              storage: 'd1',
              wishlist,
              roster: roster.length > 0 ? roster : null,
              guides: guides.length > 0 ? guides : null,
              achievements,
              alumni: alumni.length > 0 ? alumni : null,
              meta,
              services,
              vouches,
              stashDrops,
              bossRotas,
              leagueFirsts,
              activityFeed,
              lastSynced: now
            }),
            { headers: CORS_HEADERS }
          );
        } catch (err: any) {
          return new Response(JSON.stringify({ status: 'error', message: err.message }), {
            status: 500,
            headers: CORS_HEADERS
          });
        }
      }

      // POST /api/wishlist
      if (url.pathname === '/api/wishlist' && request.method === 'POST') {
        try {
          const body = (await request.json()) as any;
          const targetLeague = body.leagueId || leagueId;
          const item = body.item;
          if (!item || !item.id) {
            return new Response(JSON.stringify({ error: 'Missing item payload' }), { status: 400, headers: CORS_HEADERS });
          }
          await db
            .prepare('INSERT OR REPLACE INTO wishlists (id, league_id, data, updated_at) VALUES (?, ?, ?, ?)')
            .bind(String(item.id), targetLeague, JSON.stringify(item), now)
            .run();
          return new Response(JSON.stringify({ success: true }), { headers: CORS_HEADERS });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
        }
      }

      // DELETE /api/wishlist/:id
      if (url.pathname.startsWith('/api/wishlist/') && request.method === 'DELETE') {
        try {
          const itemId = decodeURIComponent(url.pathname.replace('/api/wishlist/', '').trim());
          await db.prepare('DELETE FROM wishlists WHERE id = ? AND league_id = ?').bind(itemId, leagueId).run();
          return new Response(JSON.stringify({ success: true }), { headers: CORS_HEADERS });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
        }
      }

      // POST /api/roster
      if (url.pathname === '/api/roster' && request.method === 'POST') {
        try {
          const body = (await request.json()) as any;
          const targetLeague = body.leagueId || leagueId;
          const member = body.member;
          if (!member || (!member.id && !member.displayName)) {
            return new Response(JSON.stringify({ error: 'Missing member payload' }), { status: 400, headers: CORS_HEADERS });
          }
          const dispLower = String(member.displayName || member.characterName || member.id).toLowerCase();
          const existing = await db
            .prepare('SELECT id, data FROM roster WHERE league_id = ? AND (id = ? OR display_name_lower = ?)')
            .bind(targetLeague, String(member.id || ''), dispLower)
            .first();

          const finalId = existing?.id || String(member.id || `member-${Date.now()}`);
          const merged = existing?.data ? { ...JSON.parse(existing.data), ...member, id: finalId } : { ...member, id: finalId };

          await db
            .prepare('INSERT OR REPLACE INTO roster (id, league_id, display_name_lower, data, updated_at) VALUES (?, ?, ?, ?, ?)')
            .bind(finalId, targetLeague, dispLower, JSON.stringify(merged), now)
            .run();
          return new Response(JSON.stringify({ success: true, member: merged }), { headers: CORS_HEADERS });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
        }
      }

      // DELETE /api/roster/:id
      if (url.pathname.startsWith('/api/roster/') && request.method === 'DELETE') {
        try {
          const memberId = decodeURIComponent(url.pathname.replace('/api/roster/', '').trim());
          await db
            .prepare('DELETE FROM roster WHERE league_id = ? AND (id = ? OR display_name_lower = ?)')
            .bind(leagueId, memberId, memberId.toLowerCase())
            .run();
          return new Response(JSON.stringify({ success: true }), { headers: CORS_HEADERS });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
        }
      }

      // POST /api/guides
      if (url.pathname === '/api/guides' && request.method === 'POST') {
        try {
          const body = (await request.json()) as any;
          const targetLeague = body.leagueId || leagueId;
          const guide = body.guide;
          if (!guide || (!guide.id && !guide.slug)) {
            return new Response(JSON.stringify({ error: 'Missing guide payload' }), { status: 400, headers: CORS_HEADERS });
          }
          const finalId = String(guide.id || guide.slug);
          await db
            .prepare('INSERT OR REPLACE INTO guides (id, league_id, data, updated_at) VALUES (?, ?, ?, ?)')
            .bind(finalId, targetLeague, JSON.stringify(guide), now)
            .run();
          return new Response(JSON.stringify({ success: true }), { headers: CORS_HEADERS });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
        }
      }

      // POST /api/achievements (Atomic D1 merge)
      if (url.pathname === '/api/achievements' && request.method === 'POST') {
        try {
          const body = (await request.json()) as any;
          const playerKey = String(body.playerKey || '').trim().toLowerCase();
          const incoming = body.profile;
          if (!playerKey || !incoming) {
            return new Response(JSON.stringify({ error: 'Missing playerKey or profile payload' }), { status: 400, headers: CORS_HEADERS });
          }
          const row = await db.prepare('SELECT data FROM achievements WHERE player_key = ?').bind(playerKey).first();
          const prev = row?.data
            ? JSON.parse(row.data)
            : { unlockedIds: {}, lifetimeFulfilledCount: 0, lifetimeBountiesClaimed: 0, lifetimeBountiesPaid: 0, leaguesParticipated: [] };

          const mergedLeagues = Array.from(
            new Set([
              ...(Array.isArray(prev.leaguesParticipated) ? prev.leaguesParticipated : []),
              ...(Array.isArray(incoming.leaguesParticipated) ? incoming.leaguesParticipated : [])
            ])
          );

          const honorMap = new Map<string, any>();
          for (const h of Array.isArray(prev.honorLog) ? prev.honorLog : []) {
            if (h?.id) honorMap.set(String(h.id), h);
          }
          for (const h of Array.isArray(incoming.honorLog) ? incoming.honorLog : []) {
            if (h?.id) honorMap.set(String(h.id), h);
          }
          const mergedHonorLog = Array.from(honorMap.values()).sort((a: any, b: any) =>
            String(b.timestampIso || '').localeCompare(String(a.timestampIso || ''))
          );

          const merged = {
            unlockedIds: { ...(prev.unlockedIds || {}), ...(incoming.unlockedIds || {}) },
            equippedTitle: incoming.equippedTitle !== undefined ? incoming.equippedTitle : prev.equippedTitle,
            lifetimeFulfilledCount: Math.max(Number(prev.lifetimeFulfilledCount) || 0, Number(incoming.lifetimeFulfilledCount) || 0),
            lifetimeBountiesClaimed: Math.max(Number(prev.lifetimeBountiesClaimed) || 0, Number(incoming.lifetimeBountiesClaimed) || 0),
            lifetimeBountiesPaid: Math.max(Number(prev.lifetimeBountiesPaid) || 0, Number(incoming.lifetimeBountiesPaid) || 0),
            leaguesParticipated: mergedLeagues,
            honorLog: mergedHonorLog
          };

          await db
            .prepare('INSERT OR REPLACE INTO achievements (player_key, data, updated_at) VALUES (?, ?, ?)')
            .bind(playerKey, JSON.stringify(merged), now)
            .run();
          return new Response(JSON.stringify({ success: true, profile: merged }), { headers: CORS_HEADERS });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
        }
      }

      // POST /api/alumni
      if (url.pathname === '/api/alumni' && request.method === 'POST') {
        try {
          const body = (await request.json()) as any;
          if (!Array.isArray(body.alumni)) {
            return new Response(JSON.stringify({ error: 'Missing alumni array payload' }), { status: 400, headers: CORS_HEADERS });
          }
          const batch = body.alumni
            .filter((a: any) => a?.id)
            .map((a: any) =>
              db.prepare('INSERT OR REPLACE INTO alumni (id, data, updated_at) VALUES (?, ?, ?)')
                .bind(String(a.id), JSON.stringify(a), now)
            );
          if (batch.length > 0) await db.batch(batch);
          return new Response(JSON.stringify({ success: true, count: batch.length }), { headers: CORS_HEADERS });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
        }
      }

      // GET /api/feedback
      if (url.pathname === '/api/feedback' && request.method === 'GET') {
        try {
          const res = await db.prepare('SELECT data FROM feedback ORDER BY updated_at DESC').all();
          const list = (res.results || []).map((r: any) => JSON.parse(r.data));
          return new Response(JSON.stringify({ status: 'connected', feedback: list.length > 0 ? list : null }), {
            headers: CORS_HEADERS
          });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
        }
      }


      // GET /api/admin/webhook
      if (url.pathname === '/api/admin/webhook' && request.method === 'GET') {
        try {
          const cfg = await getWebhookConfig(env, db);
          return new Response(JSON.stringify({ status: 'ok', config: cfg }), { headers: CORS_HEADERS });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
        }
      }

      // POST /api/admin/webhook
      if (url.pathname === '/api/admin/webhook' && request.method === 'POST') {
        try {
          const body = (await request.json()) as any;
          const cfg: WebhookConfig = {
            url: String(body.url || '').trim(),
            enabled: body.enabled !== false,
            events: Array.isArray(body.events) ? body.events : DEFAULT_WEBHOOK_EVENTS
          };
          await db
            .prepare('INSERT OR REPLACE INTO league_meta (league_id, data, updated_at) VALUES (?, ?, ?)')
            .bind('global:webhook', JSON.stringify(cfg), now)
            .run();
          return new Response(JSON.stringify({ success: true, config: cfg }), { headers: CORS_HEADERS });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
        }
      }

      // POST /api/admin/test-webhook
      if (url.pathname === '/api/admin/test-webhook' && request.method === 'POST') {
        try {
          const ok = await dispatchWebhookAlert(env, db, leagueId, {
            id: `test_${Date.now()}`,
            leagueId,
            type: 'bounty_listed',
            actorHandle: 'Leuie',
            title: 'Root Webhook Push Alerts are LIVE on Exile SSF!',
            detail: 'Bounties, Squad Drops, Boss Rotas, League Firsts, and Ladder Level 90/95/100 milestones will now push automatically.',
            createdAtIso: now
          });
          return new Response(JSON.stringify({ success: ok }), { status: ok ? 200 : 400, headers: CORS_HEADERS });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
        }
      }

      // POST /api/feedback
      if (url.pathname === '/api/feedback' && request.method === 'POST') {
        try {
          const body = (await request.json()) as any;
          const item = body.item;
          if (!item || !item.id) {
            return new Response(JSON.stringify({ error: 'Missing feedback item payload' }), { status: 400, headers: CORS_HEADERS });
          }
          await db
            .prepare('INSERT OR REPLACE INTO feedback (id, data, updated_at) VALUES (?, ?, ?)')
            .bind(String(item.id), JSON.stringify(item), now)
            .run();
          return new Response(JSON.stringify({ success: true }), { headers: CORS_HEADERS });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
        }
      }

      // POST /api/meta
      if (url.pathname === '/api/meta' && request.method === 'POST') {
        try {
          const body = (await request.json()) as any;
          const targetLeague = body.leagueId || leagueId;
          const row = await db.prepare('SELECT data FROM league_meta WHERE league_id = ?').bind(targetLeague).first();
          const prev = row?.data ? JSON.parse(row.data) : {};
          const next = {
            ...prev,
            ...(body.quickLinks !== undefined ? { quickLinks: body.quickLinks } : {}),
            ...(body.faqList !== undefined ? { faqList: body.faqList } : {}),
            ...(body.archivesList !== undefined ? { archivesList: body.archivesList } : {})
          };
          await db
            .prepare('INSERT OR REPLACE INTO league_meta (league_id, data, updated_at) VALUES (?, ?, ?)')
            .bind(targetLeague, JSON.stringify(next), now)
            .run();
          return new Response(JSON.stringify({ success: true, meta: next }), { headers: CORS_HEADERS });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
        }
      }

      // GET /api/leagues
      if (url.pathname === '/api/leagues' && request.method === 'GET') {
        try {
          const res = await db.prepare('SELECT data FROM custom_leagues ORDER BY updated_at DESC').all();
          const leagues = (res.results || []).map((r: any) => JSON.parse(r.data));
          return new Response(JSON.stringify({ status: 'connected', leagues }), { headers: CORS_HEADERS });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
        }
      }

      // POST /api/leagues
      if (url.pathname === '/api/leagues' && request.method === 'POST') {
        try {
          const body = (await request.json()) as any;
          const league = body.league;
          if (!league || !league.id) {
            return new Response(JSON.stringify({ error: 'Missing league payload' }), { status: 400, headers: CORS_HEADERS });
          }
          await db
            .prepare('INSERT OR REPLACE INTO custom_leagues (id, data, updated_at) VALUES (?, ?, ?)')
            .bind(String(league.id), JSON.stringify(league), now)
            .run();
          return new Response(JSON.stringify({ success: true }), { headers: CORS_HEADERS });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
        }
      }

      // GET /api/accounts
      if (url.pathname === '/api/accounts' && request.method === 'GET') {
        try {
          const res = await db.prepare('SELECT data FROM accounts').all();
          const accounts = (res.results || []).map((r: any) => JSON.parse(r.data));
          return new Response(JSON.stringify({ status: 'connected', accounts }), { headers: CORS_HEADERS });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
        }
      }

      // POST /api/accounts
      if (url.pathname === '/api/accounts' && request.method === 'POST') {
        try {
          const body = (await request.json()) as any;
          const account = body.account;
          if (!account || !account.username) {
            return new Response(JSON.stringify({ error: 'Missing account payload' }), { status: 400, headers: CORS_HEADERS });
          }
          const userLower = String(account.username).trim().toLowerCase();
          const emailLower = account.email ? String(account.email).trim().toLowerCase() : null;
          await db
            .prepare('INSERT OR REPLACE INTO accounts (username_lower, email_lower, data, updated_at) VALUES (?, ?, ?, ?)')
            .bind(userLower, emailLower, JSON.stringify(account), now)
            .run();
          return new Response(JSON.stringify({ success: true }), { headers: CORS_HEADERS });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
        }
      }

      // POST /api/services (Squad Atlas & Boss Carry Board)
      if (url.pathname === '/api/services' && request.method === 'POST') {
        try {
          const body = (await request.json()) as any;
          const targetLeague = body.leagueId || leagueId;
          const service = body.service;
          if (!service || !service.id) {
            return new Response(JSON.stringify({ error: 'Missing service payload' }), { status: 400, headers: CORS_HEADERS });
          }
          const providerKey = String(service.providerDisplayName || service.providerCharacterName || 'unknown').toLowerCase();
          await db
            .prepare('INSERT OR REPLACE INTO services (id, league_id, provider_key, data, updated_at) VALUES (?, ?, ?, ?, ?)')
            .bind(String(service.id), targetLeague, providerKey, JSON.stringify(service), now)
            .run();
          return new Response(JSON.stringify({ success: true }), { headers: CORS_HEADERS });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
        }
      }

      // DELETE /api/services/:id
      if (url.pathname.startsWith('/api/services/') && request.method === 'DELETE') {
        try {
          const serviceId = decodeURIComponent(url.pathname.replace('/api/services/', '').trim());
          await db.prepare('DELETE FROM services WHERE id = ? AND league_id = ?').bind(serviceId, leagueId).run();
          return new Response(JSON.stringify({ success: true }), { headers: CORS_HEADERS });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
        }
      }

      // POST /api/vouches (Verified Vouch & Reputation Ledger)
      if (url.pathname === '/api/vouches' && request.method === 'POST') {
        try {
          const body = (await request.json()) as any;
          const targetLeague = body.leagueId || leagueId;
          const vouch = body.vouch;
          if (!vouch || !vouch.id || !vouch.providerDisplayName) {
            return new Response(JSON.stringify({ error: 'Missing vouch payload' }), { status: 400, headers: CORS_HEADERS });
          }
          const providerKey = String(vouch.providerKey || vouch.providerDisplayName).trim().toLowerCase();
          await db
            .prepare('INSERT OR REPLACE INTO vouches (id, league_id, provider_key, data, created_at) VALUES (?, ?, ?, ?, ?)')
            .bind(String(vouch.id), targetLeague, providerKey, JSON.stringify({ ...vouch, providerKey }), vouch.createdAtIso || now)
            .run();
          return new Response(JSON.stringify({ success: true }), { headers: CORS_HEADERS });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
        }
      }

      // GET /api/ladder (Live PoE Official Private League Ladder Sync with 5 Minute KV Cache)
      if (url.pathname === '/api/ladder' && request.method === 'GET') {
        try {
          const officialName = resolveOfficialLadderName(leagueId, url.searchParams.get('name'));
          const cacheKey = `ladder_cache:${officialName.toLowerCase()}`;
          const forceRefresh = url.searchParams.get('refresh') === '1';

          if (!forceRefresh && env.EXILE_KV) {
            const cachedRaw = await env.EXILE_KV.get(cacheKey);
            if (cachedRaw) {
              return new Response(cachedRaw, { headers: CORS_HEADERS });
            }
          }

          const gggUrl = `https://api.pathofexile.com/ladders/${encodeURIComponent(officialName)}?limit=200`;
          const gggRes = await fetch(gggUrl, {
            headers: {
              Accept: 'application/json',
              'User-Agent': 'OAuth exile-ssf/1.0 (contact: support@exilessf.app)'
            }
          });

          if (!gggRes.ok) {
            return new Response(
              JSON.stringify({
                status: 'unavailable',
                httpStatus: gggRes.status,
                leagueName: officialName,
                message: 'Path of Exile official ladder API returned a non 200 status (league may be private or rate limited).'
              }),
              { status: 200, headers: CORS_HEADERS }
            );
          }

          const gggJson = (await gggRes.json()) as any;
          const entries = (gggJson.entries || []).map((e: any) => ({
            rank: e.rank,
            dead: Boolean(e.dead),
            online: Boolean(e.online),
            accountName: e.account?.name || '',
            characterName: e.character?.name || '',
            level: Number(e.character?.level) || 1,
            ascendancy: e.character?.class || 'Exile',
            experience: Number(e.character?.experience) || 0
          }));

          const payload = JSON.stringify({
            status: 'ok',
            leagueName: officialName,
            total: gggJson.total || entries.length,
            syncedAtIso: now,
            entries
          });

          if (env.EXILE_KV) {
            await env.EXILE_KV.put(cacheKey, payload, { expirationTtl: 300 });
          }

          return new Response(payload, { headers: CORS_HEADERS });
        } catch (err: any) {
          return new Response(JSON.stringify({ status: 'error', message: err.message }), {
            status: 200,
            headers: CORS_HEADERS
          });
        }
      }

      // GET /api/profile/:handle (Aggregated Exile Hub from D1 in 1 round trip)
      if (url.pathname.startsWith('/api/profile/') && request.method === 'GET') {
        try {
          const handleRaw = decodeURIComponent(url.pathname.replace('/api/profile/', '').trim()).replace(/^@/, '');
          const handleLower = handleRaw.toLowerCase();
          if (!handleLower) {
            return new Response(JSON.stringify({ error: 'Missing profile handle' }), { status: 400, headers: CORS_HEADERS });
          }

          const [profRow, rosterRes, wishRes, svcRes, vouchRes, achRes, alumniRes] = await Promise.all([
            db.prepare('SELECT data FROM profiles WHERE handle_lower = ?').bind(handleLower).first(),
            db.prepare('SELECT league_id, data FROM roster WHERE display_name_lower = ?').bind(handleLower).all(),
            db.prepare('SELECT league_id, data FROM wishlists ORDER BY updated_at DESC').all(),
            db.prepare('SELECT league_id, data FROM services WHERE provider_key = ? ORDER BY updated_at DESC').bind(handleLower).all(),
            db.prepare('SELECT league_id, data FROM vouches WHERE provider_key = ? ORDER BY created_at DESC').bind(handleLower).all(),
            db.prepare('SELECT player_key, data FROM achievements').all(),
            db.prepare('SELECT data FROM alumni').all()
          ]);

          const customProfile = profRow?.data ? JSON.parse(profRow.data) : null;
          const rosterEntries = (rosterRes.results || []).map((r: any) => ({
            leagueId: r.league_id,
            member: JSON.parse(r.data)
          }));

          const primaryMember = rosterEntries[0]?.member || null;
          const poeAccountLower = (customProfile?.poeAccountName || primaryMember?.poeAccountName || '').toLowerCase();
          const charNamesLower = new Set<string>();
          for (const entry of rosterEntries) {
            if (entry.member.characterName) charNamesLower.add(entry.member.characterName.toLowerCase());
            if (Array.isArray(entry.member.characters)) {
              for (const ch of entry.member.characters) {
                if (ch.characterName) charNamesLower.add(ch.characterName.toLowerCase());
              }
            }
          }

          const allWishes = (wishRes.results || []).map((r: any) => JSON.parse(r.data));
          const myWishes = allWishes.filter((it: any) => {
            const disp = (it.displayName || '').toLowerCase();
            const ch = (it.characterName || '').toLowerCase();
            const acc = (it.poeAccountName || '').toLowerCase();
            return disp === handleLower || charNamesLower.has(ch) || (poeAccountLower && acc === poeAccountLower);
          });

          const fulfilledByMe = allWishes.filter((it: any) => {
            const fb = (it.fulfilledBy || '').toLowerCase();
            const fba = (it.fulfilledByAccount || '').toLowerCase();
            return it.status === 'HAVE' && (fb === handleLower || charNamesLower.has(fb) || (poeAccountLower && fba === poeAccountLower));
          });

          const services = (svcRes.results || []).map((r: any) => JSON.parse(r.data));
          const vouches = (vouchRes.results || []).map((r: any) => JSON.parse(r.data));

          // Merge all matching achievement rows (handle, poeAccountName, character names) so credits are never split
          let achievementProfile: any = null;
          for (const row of achRes.results || []) {
            const pk = String(row.player_key || '').toLowerCase();
            if (pk === handleLower || (poeAccountLower && pk === poeAccountLower) || charNamesLower.has(pk)) {
              const parsed = JSON.parse(row.data);
              if (!achievementProfile) {
                achievementProfile = parsed;
              } else {
                const logMap = new Map<string, any>();
                for (const h of Array.isArray(achievementProfile.honorLog) ? achievementProfile.honorLog : []) {
                  if (h?.id) logMap.set(String(h.id), h);
                }
                for (const h of Array.isArray(parsed.honorLog) ? parsed.honorLog : []) {
                  if (h?.id) logMap.set(String(h.id), h);
                }
                achievementProfile = {
                  unlockedIds: { ...(achievementProfile.unlockedIds || {}), ...(parsed.unlockedIds || {}) },
                  equippedTitle: achievementProfile.equippedTitle || parsed.equippedTitle,
                  lifetimeFulfilledCount: Math.max(Number(achievementProfile.lifetimeFulfilledCount) || 0, Number(parsed.lifetimeFulfilledCount) || 0),
                  lifetimeBountiesClaimed: Math.max(Number(achievementProfile.lifetimeBountiesClaimed) || 0, Number(parsed.lifetimeBountiesClaimed) || 0),
                  lifetimeBountiesPaid: Math.max(Number(achievementProfile.lifetimeBountiesPaid) || 0, Number(parsed.lifetimeBountiesPaid) || 0),
                  leaguesParticipated: Array.from(new Set([...(achievementProfile.leaguesParticipated || []), ...(parsed.leaguesParticipated || [])])),
                  honorLog: Array.from(logMap.values())
                };
              }
            }
          }

          const alumniMatches = (alumniRes.results || [])
            .map((r: any) => JSON.parse(r.data))
            .filter(
              (a: any) =>
                (a.displayName || '').toLowerCase() === handleLower ||
                (poeAccountLower && (a.poeAccountName || '').toLowerCase() === poeAccountLower)
            );

          // Deterministic unique Exile UID
          let hash = 0;
          for (let i = 0; i < handleLower.length; i++) {
            hash = ((hash << 5) - hash + handleLower.charCodeAt(i)) | 0;
          }
          const uid = `EXILE-${Math.abs(hash).toString(36).toUpperCase().slice(0, 6).padStart(4, '0')}`;

          const profile = {
            handle: customProfile?.handle || primaryMember?.displayName || handleRaw,
            uid: customProfile?.uid || uid,
            avatarUrl: customProfile?.avatarUrl || '',
            bio: customProfile?.bio || primaryMember?.notes || '',
            timezone: customProfile?.timezone || '',
            poeAccountName: customProfile?.poeAccountName || primaryMember?.poeAccountName || alumniMatches[0]?.poeAccountName || '',
            poeProfileUrl:
              customProfile?.poeProfileUrl ||
              primaryMember?.poeProfileUrl ||
              (primaryMember?.poeAccountName
                ? `https://www.pathofexile.com/account/view-profile/${encodeURIComponent(primaryMember.poeAccountName.split('#')[0])}`
                : ''),
            rootHandle: customProfile?.rootHandle || primaryMember?.displayName || handleRaw,
            discordHandle: customProfile?.discordHandle || primaryMember?.discordName || alumniMatches[0]?.discordName || '',
            twitchUrl: customProfile?.twitchUrl || '',
            favoriteClass: customProfile?.favoriteClass || primaryMember?.ascendancy || '',
            mapRegexBricks: Array.isArray(customProfile?.mapRegexBricks) ? customProfile.mapRegexBricks : [],
            sessionGoals: Array.isArray(customProfile?.sessionGoals) ? customProfile.sessionGoals : [],
            lastSeenFeedAt: customProfile?.lastSeenFeedAt || undefined
          };

          return new Response(
            JSON.stringify({
              status: 'ok',
              profile,
              rosterEntries,
              wishes: myWishes,
              fulfilledByMe,
              services,
              vouches,
              achievementProfile,
              alumniRecord: alumniMatches[0] || null
            }),
            { headers: CORS_HEADERS }
          );
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
        }
      }

      // POST /api/profile
      if (url.pathname === '/api/profile' && request.method === 'POST') {
        try {
          const body = (await request.json()) as any;
          const profile = body.profile;
          if (!profile || !profile.handle) {
            return new Response(JSON.stringify({ error: 'Missing profile payload' }), { status: 400, headers: CORS_HEADERS });
          }
          const handleLower = String(profile.handle).trim().replace(/^@/, '').toLowerCase();
          await db
            .prepare('INSERT OR REPLACE INTO profiles (handle_lower, data, updated_at) VALUES (?, ?, ?)')
            .bind(handleLower, JSON.stringify({ ...profile, updatedAtIso: now }), now)
            .run();
          return new Response(JSON.stringify({ success: true }), { headers: CORS_HEADERS });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
        }
      }

      // POST /api/auth/register (Cloudflare D1 PBKDF2 Registration)
      if (url.pathname === '/api/auth/register' && request.method === 'POST') {
        try {
          const body = (await request.json()) as any;
          const username = String(body.username || '').trim();
          const email = body.email ? String(body.email).trim() : '';
          const password = String(body.password || '');
          const userAccount = body.userAccount;
          const rosterEntry = body.rosterEntry;

          if (!username || !userAccount) {
            return new Response(JSON.stringify({ error: 'Missing username or account profile' }), {
              status: 400,
              headers: CORS_HEADERS
            });
          }

          const userLower = username.toLowerCase();
          const emailLower = email ? email.toLowerCase() : null;
          const passwordHash = password ? await hashPasswordPBKDF2(password) : '';

          const record = {
            username,
            email: email || undefined,
            passwordHash,
            userAccount: { ...userAccount, passwordHash },
            rosterEntry
          };

          await db
            .prepare('INSERT OR REPLACE INTO accounts (username_lower, email_lower, data, updated_at) VALUES (?, ?, ?, ?)')
            .bind(userLower, emailLower, JSON.stringify(record), now)
            .run();

          return new Response(
            JSON.stringify({
              success: true,
              userAccount: record.userAccount,
              rosterEntry: record.rosterEntry
            }),
            { headers: CORS_HEADERS }
          );
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
        }
      }

      // POST /api/auth/login (Cloudflare D1 PBKDF2 Verification)
      if (url.pathname === '/api/auth/login' && request.method === 'POST') {
        try {
          const body = (await request.json()) as any;
          const identifier = String(body.identifier || body.username || '').trim().toLowerCase();
          const password = String(body.password || '');

          if (!identifier || !password) {
            return new Response(JSON.stringify({ error: 'Please provide username and password.' }), {
              status: 400,
              headers: CORS_HEADERS
            });
          }

          const row = await db
            .prepare('SELECT username_lower, email_lower, data FROM accounts WHERE username_lower = ? OR email_lower = ?')
            .bind(identifier, identifier)
            .first();

          if (!row?.data) {
            return new Response(JSON.stringify({ error: 'Account not found. Check your username or register.' }), {
              status: 401,
              headers: CORS_HEADERS
            });
          }

          const record = JSON.parse(row.data);
          const storedHash = record.passwordHash || record.userAccount?.passwordHash || '';
          const check = await verifyPassword(password, storedHash);

          if (!check.valid) {
            return new Response(JSON.stringify({ error: 'Incorrect password. Please try again.' }), {
              status: 401,
              headers: CORS_HEADERS
            });
          }

          // Transparently upgrade legacy SHA-256 hashes to PBKDF2 in D1
          if (check.needsUpgrade) {
            const upgradedHash = await hashPasswordPBKDF2(password);
            record.passwordHash = upgradedHash;
            if (record.userAccount) record.userAccount.passwordHash = upgradedHash;
            await db
              .prepare('UPDATE accounts SET data = ?, updated_at = ? WHERE username_lower = ?')
              .bind(JSON.stringify(record), now, row.username_lower)
              .run();
          }

          return new Response(
            JSON.stringify({
              success: true,
              userAccount: record.userAccount,
              rosterEntry: record.rosterEntry
            }),
            { headers: CORS_HEADERS }
          );
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
        }
      }


      // POST /api/stash-drops
      if (url.pathname === '/api/stash-drops' && request.method === 'POST') {
        try {
          const body = (await request.json()) as any;
          const targetLeague = body.leagueId || leagueId;
          const drop = body.drop;
          if (!drop || !drop.id) {
            return new Response(JSON.stringify({ error: 'Missing stash drop payload' }), { status: 400, headers: CORS_HEADERS });
          }
          await db
            .prepare('INSERT OR REPLACE INTO stash_drops (id, league_id, data, updated_at) VALUES (?, ?, ?, ?)')
            .bind(String(drop.id), targetLeague, JSON.stringify(drop), now)
            .run();
          return new Response(JSON.stringify({ success: true }), { headers: CORS_HEADERS });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
        }
      }

      // DELETE /api/stash-drops/:id
      if (url.pathname.startsWith('/api/stash-drops/') && request.method === 'DELETE') {
        try {
          const dropId = decodeURIComponent(url.pathname.replace('/api/stash-drops/', '').trim());
          await db.prepare('DELETE FROM stash_drops WHERE id = ? AND league_id = ?').bind(dropId, leagueId).run();
          return new Response(JSON.stringify({ success: true }), { headers: CORS_HEADERS });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
        }
      }

      // POST /api/boss-rotas
      if (url.pathname === '/api/boss-rotas' && request.method === 'POST') {
        try {
          const body = (await request.json()) as any;
          const targetLeague = body.leagueId || leagueId;
          const rota = body.rota;
          if (!rota || !rota.id) {
            return new Response(JSON.stringify({ error: 'Missing boss rota payload' }), { status: 400, headers: CORS_HEADERS });
          }
          await db
            .prepare('INSERT OR REPLACE INTO boss_rotas (id, league_id, data, updated_at) VALUES (?, ?, ?, ?)')
            .bind(String(rota.id), targetLeague, JSON.stringify(rota), now)
            .run();
          return new Response(JSON.stringify({ success: true }), { headers: CORS_HEADERS });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
        }
      }

      // DELETE /api/boss-rotas/:id
      if (url.pathname.startsWith('/api/boss-rotas/') && request.method === 'DELETE') {
        try {
          const rotaId = decodeURIComponent(url.pathname.replace('/api/boss-rotas/', '').trim());
          await db.prepare('DELETE FROM boss_rotas WHERE id = ? AND league_id = ?').bind(rotaId, leagueId).run();
          return new Response(JSON.stringify({ success: true }), { headers: CORS_HEADERS });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
        }
      }

      // POST /api/feed
      if (url.pathname === '/api/feed' && request.method === 'POST') {
        try {
          const body = (await request.json()) as any;
          const targetLeague = body.leagueId || leagueId;
          const event = body.event;
          if (!event || !event.id) {
            return new Response(JSON.stringify({ error: 'Missing feed event payload' }), { status: 400, headers: CORS_HEADERS });
          }
          const createdAt = event.createdAtIso || now;
          const existingFeedRow = await db.prepare('SELECT id FROM activity_feed WHERE id = ?').bind(String(event.id)).first();
          const savedEvent = { ...event, createdAtIso: createdAt };
          await db
            .prepare('INSERT OR REPLACE INTO activity_feed (id, league_id, data, created_at) VALUES (?, ?, ?, ?)')
            .bind(String(event.id), targetLeague, JSON.stringify(savedEvent), createdAt)
            .run();
          if (!existingFeedRow) {
            const p = dispatchWebhookAlert(env, db, targetLeague, savedEvent);
            if (ctx?.waitUntil) ctx.waitUntil(p);
          }
          return new Response(JSON.stringify({ success: true }), { headers: CORS_HEADERS });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
        }
      }

      // POST /api/league-firsts
      if (url.pathname === '/api/league-firsts' && request.method === 'POST') {
        try {
          const body = (await request.json()) as any;
          const targetLeague = body.leagueId || leagueId;
          const milestone = body.milestone;
          if (!milestone || !milestone.id) {
            return new Response(JSON.stringify({ error: 'Missing league first payload' }), { status: 400, headers: CORS_HEADERS });
          }
          await db
            .prepare('INSERT OR REPLACE INTO league_firsts (id, league_id, data, updated_at) VALUES (?, ?, ?, ?)')
            .bind(String(milestone.id), targetLeague, JSON.stringify(milestone), now)
            .run();
          return new Response(JSON.stringify({ success: true }), { headers: CORS_HEADERS });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
        }
      }

      return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
        status: 404,
        headers: CORS_HEADERS
      });
    }

    // Pass through to static assets (SPA) and inject route aware OpenGraph meta tags for HTML responses
    if (env.ASSETS) {
      const assetRes = await env.ASSETS.fetch(request);
      const contentType = assetRes.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        const rawHtml = await assetRes.text();
        const meta = resolvePageMeta(url);
        const rewrittenHtml = injectMetaIntoHtml(rawHtml, meta, url.toString());
        const headers = new Headers(assetRes.headers);
        headers.delete('content-length');
        return new Response(rewrittenHtml, {
          status: assetRes.status,
          statusText: assetRes.statusText,
          headers
        });
      }
      return assetRes;
    }

    return new Response('Exile SSF Cloudflare API Worker (D1) running', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
};
