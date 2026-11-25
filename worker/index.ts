import { handleAssetRoutes } from './routes/assets';
import { handleAdminAndGovernanceRoutes } from './routes/admin';
import { handleSocialRoutes, runScheduledDailyDigests } from './routes/social';
import { handleOgCardRoute } from './routes/og';
import { resolvePageMeta, injectMetaIntoHtml } from './routes/seo';
// Cloudflare Worker for Exile SSF
// Primary atomic storage via Cloudflare D1 (EXILE_DB) with automatic KV migration and edge OpenGraph metadata

export interface Env {
  EXILE_DB?: any;
  EXILE_KV?: any;
  ASSETS?: any;
  ROOT_WEBHOOK_URL?: string;
  WEBHOOK_URL?: string;
  SESSION_SECRET?: string;
  ADMIN_PASSWORD_HASH?: string;
}

const ALLOWED_ORIGINS = new Set([
  'https://exilessf.app',
  'https://www.exilessf.app',
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:5173'
]);

const BASE_SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};

function buildCorsHeaders(request?: Request): Record<string, string> {
  const origin = request?.headers.get('Origin') || '';
  const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : 'https://exilessf.app';
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    'Vary': 'Origin',
    ...BASE_SECURITY_HEADERS
  };
}

const SERVER_ADMIN_SHA256 = '5fa6bba1018db3415c42db05cc93959d8f58a68dfea692677bd15f2a868bc05d';

function getSessionSecret(env: Env): string {
  if (env.SESSION_SECRET && env.SESSION_SECRET.trim().length >= 16) {
    return env.SESSION_SECRET.trim();
  }
  throw new Error('SESSION_SECRET is not configured in Cloudflare Workers Secrets.');
}

function base64UrlEncode(input: string): string {
  return btoa(unescape(encodeURIComponent(input)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function base64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((input.length + 3) % 4);
  return decodeURIComponent(escape(atob(padded)));
}

async function signSessionToken(payload: { handle: string; isAdmin: boolean; exp: number }, env: Env): Promise<string> {
  const body = base64UrlEncode(JSON.stringify(payload));
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(getSessionSecret(env)),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  const sigHex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `${body}.${sigHex}`;
}

async function verifySessionToken(token: string, env: Env): Promise<{ handle: string; isAdmin: boolean } | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [body, sigHex] = parts;
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(getSessionSecret(env)),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const expectedSig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
    const expectedHex = Array.from(new Uint8Array(expectedSig))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    if (expectedHex.length !== sigHex.length) return null;
    let diff = 0;
    for (let i = 0; i < expectedHex.length; i++) {
      diff |= expectedHex.charCodeAt(i) ^ sigHex.charCodeAt(i);
    }
    if (diff !== 0) return null;
    const parsed = JSON.parse(base64UrlDecode(body));
    if (!parsed?.handle || !parsed?.exp || Date.now() > Number(parsed.exp)) return null;
    return { handle: String(parsed.handle), isAdmin: Boolean(parsed.isAdmin) };
  } catch {
    return null;
  }
}

async function readVerifiedSession(request: Request, env: Env): Promise<{ handle: string; isAdmin: boolean } | null> {
  const cookieHeader = request.headers.get('Cookie') || '';
  const match = cookieHeader.match(/(?:^|;\s*)exile_session=([^;]+)/);
  if (!match) return null;
  return await verifySessionToken(decodeURIComponent(match[1]), env);
}

async function buildSessionCookieHeader(handle: string, isAdmin: boolean, env: Env): Promise<string> {
  const exp = Date.now() + 1000 * 60 * 60 * 24 * 30; // 30 days
  const token = await signSessionToken({ handle, isAdmin, exp }, env);
  return `exile_session=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`;
}

function buildClearSessionCookieHeader(): string {
  return 'exile_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';
}

function sanitizeUserAccountForClient(acc: any): any {
  if (!acc || typeof acc !== 'object') return acc;
  const { passwordHash: _omit, ...safe } = acc;
  return safe;
}

function isSafeProfileUrl(raw?: string): boolean {
  if (!raw || !raw.trim()) return true;
  const trimmed = raw.trim();
  if (trimmed.startsWith('/achievements/') || trimmed === '/logo.png') return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function isSafeWebhookUrl(raw: string): boolean {
  if (!raw || !raw.trim()) return false;
  try {
    const parsed = new URL(raw.trim());
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host === '[::1]' ||
      host.endsWith('.local') ||
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      host.startsWith('169.254.') ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host)
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

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
    `CREATE TABLE IF NOT EXISTS farming_sessions (id TEXT PRIMARY KEY, handle_lower TEXT NOT NULL, data TEXT NOT NULL, created_at TEXT NOT NULL)`,
    `CREATE INDEX IF NOT EXISTS idx_farming_sessions_handle ON farming_sessions(handle_lower, created_at DESC)`,
    `CREATE TABLE IF NOT EXISTS farming_stash_state (handle_lower TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS user_tool_state (handle_lower TEXT NOT NULL, tool_key TEXT NOT NULL, data TEXT NOT NULL, updated_at TEXT NOT NULL, PRIMARY KEY (handle_lower, tool_key))`,
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

let leuieAvatarSeedChecked = false;

async function seedLeuieAvatarToD1(db: any): Promise<void> {
  if (leuieAvatarSeedChecked || !db) return;
  leuieAvatarSeedChecked = true;
  const migKey = 'seed:leuie_avatar:v1';
  const existingMig = await db.prepare('SELECT key FROM migrations WHERE key = ?').bind(migKey).first();
  if (!existingMig) {
    const now = new Date().toISOString();
    const row = await db.prepare('SELECT data FROM profiles WHERE handle_lower = ?').bind('leuie').first();
    const prev = row?.data ? JSON.parse(row.data) : { handle: 'Leuie', uid: 'EXILE-1P8R1S' };
    const updated = {
      ...prev,
      handle: prev.handle || 'Leuie',
      avatarUrl: 'https://i.imgur.com/1Ob2OA9.png',
      updatedAtIso: now
    };
    await db.batch([
      db.prepare('INSERT OR REPLACE INTO profiles (handle_lower, data, updated_at) VALUES (?, ?, ?)').bind('leuie', JSON.stringify(updated), now),
      db.prepare('INSERT OR REPLACE INTO migrations (key, migrated_at) VALUES (?, ?)').bind(migKey, now)
    ]);
  }

  // One time migration: permanently update Leuie#0001 -> Leuie#0626 across profiles, accounts, and roster in D1
  const tagMigKey = 'seed:leuie_account_0626:v1';
  const existingTagMig = await db.prepare('SELECT key FROM migrations WHERE key = ?').bind(tagMigKey).first();
  if (!existingTagMig) {
    const now = new Date().toISOString();
    await db.batch([
      db.prepare(`UPDATE profiles SET data = REPLACE(data, 'Leuie#0001', 'Leuie#0626'), updated_at = ? WHERE handle_lower = 'leuie'`).bind(now),
      db.prepare(`UPDATE accounts SET data = REPLACE(data, 'Leuie#0001', 'Leuie#0626'), updated_at = ? WHERE username_lower = 'leuie'`).bind(now),
      db.prepare(`UPDATE roster SET data = REPLACE(data, 'Leuie#0001', 'Leuie#0626'), updated_at = ? WHERE display_name_lower = 'leuie'`).bind(now),
      db.prepare('INSERT OR REPLACE INTO migrations (key, migrated_at) VALUES (?, ?)').bind(tagMigKey, now)
    ]);
  }

  // One time migration: reset fake seeded upvotes and ratings on guides in D1
  const guideResetKey = 'seed:reset_fake_guide_stats:v1';
  const existingGuideReset = await db.prepare('SELECT key FROM migrations WHERE key = ?').bind(guideResetKey).first();
  if (!existingGuideReset) {
    const now = new Date().toISOString();
    const guideRows = await db.prepare('SELECT id, league_id, data FROM guides').all();
    const stmts: any[] = [];
    for (const row of (guideRows.results || []) as any[]) {
      try {
        const parsed = JSON.parse(String(row.data || '{}'));
        parsed.upvotes = 0;
        parsed.starterRating = 0;
        if (['guide-1', 'guide-2', 'guide-3', 'guide-4', 'guide-5'].includes(String(row.id))) {
          parsed.isSsfStarter = true;
        }
        stmts.push(
          db.prepare('UPDATE guides SET data = ?, updated_at = ? WHERE id = ? AND league_id = ?')
            .bind(JSON.stringify(parsed), now, row.id, row.league_id)
        );
      } catch {}
    }
    stmts.push(db.prepare('INSERT OR REPLACE INTO migrations (key, migrated_at) VALUES (?, ?)').bind(guideResetKey, now));
    if (stmts.length > 0) await db.batch(stmts);
  }

  // One time migration: remove fake seeded feedback posts (fb-1..fb-4) while preserving genuine community submissions
  const fbCleanKey = 'seed:clear_fake_feedback:v1';
  const existingFbClean = await db.prepare('SELECT key FROM migrations WHERE key = ?').bind(fbCleanKey).first();
  if (!existingFbClean) {
    const now = new Date().toISOString();
    await db.batch([
      db.prepare(`DELETE FROM feedback WHERE id IN ('fb-1', 'fb-2', 'fb-3', 'fb-4')`),
      db.prepare('INSERT OR REPLACE INTO migrations (key, migrated_at) VALUES (?, ?)').bind(fbCleanKey, now)
    ]);
  }

  // One time migration: purge all saved Asset Tracker, Map Tracker, and Character Armory data (Nov 24, 2026 12:00 PM EST)
  const toolPurgeKey = 'purge:tool_data_2026_11_24_12pm_est:v1';
  const existingToolPurge = await db.prepare('SELECT key FROM migrations WHERE key = ?').bind(toolPurgeKey).first();
  if (!existingToolPurge) {
    const now = new Date().toISOString();
    await db.batch([
      db.prepare(`DELETE FROM farming_stash_state`),
      db.prepare(`DELETE FROM farming_sessions`),
      db.prepare(`DELETE FROM user_tool_state WHERE tool_key IN ('map_tracker_sessions', 'character_gear_snapshots')`),
      db.prepare('INSERT OR REPLACE INTO migrations (key, migrated_at) VALUES (?, ?)').bind(toolPurgeKey, now)
    ]);
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

function resolveOfficialLadderName(leagueId: string, customName?: string | null): string {
  if (customName && customName.trim()) return customName.trim();
  const clean = leagueId.toLowerCase().trim();
  if (clean === 'poe1-330-umbra') return 'Ravenwatch Covens of Umbra GSF (PL87651)';
  return leagueId;
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

async function getWebhookConfig(env: Env, db: any, leagueId?: string): Promise<WebhookConfig> {
  try {
    if (leagueId) {
      const leagueRow = await db.prepare('SELECT data FROM league_meta WHERE league_id = ?').bind(`webhook:${leagueId}`).first();
      if (leagueRow?.data) {
        const parsed = JSON.parse(leagueRow.data);
        return {
          url: String(parsed.url || '').trim(),
          enabled: parsed.enabled !== false,
          events: Array.isArray(parsed.events) ? parsed.events : DEFAULT_WEBHOOK_EVENTS
        };
      }
    }
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
    const cfg = await getWebhookConfig(env, db, leagueId);
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
    const runAll = async () => {
      await runScheduledLadderSync(env);
      await runScheduledDailyDigests(env);
    };
    ctx?.waitUntil ? ctx.waitUntil(runAll()) : await runAll();
  },

  async fetch(request: Request, env: Env, ctx?: any): Promise<Response> {
    const CORS_HEADERS = buildCorsHeaders(request);
    const PUBLIC_CACHE_HEADERS = {
      ...CORS_HEADERS,
      'Cache-Control': 'public, max-age=900, stale-while-revalidate=1800'
    };
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
      await seedLeuieAvatarToD1(db);
      } catch (err: any) {
        return new Response(JSON.stringify({ status: 'error', message: `D1 init error: ${err.message}` }), {
          status: 500,
          headers: CORS_HEADERS
        });
      }

      const leagueId = url.searchParams.get('league') || 'poe1-330-umbra';
      const now = new Date().toISOString();
      const verifiedSession = await readVerifiedSession(request, env);
      const session = verifiedSession;

      // Global Mutation Security Gate: require signed exile_session cookie on all state changing POST/PUT/DELETE routes
      if (request.method === 'POST' || request.method === 'PUT' || request.method === 'DELETE') {
        const publicMutationPaths = new Set([
          '/api/auth/login',
          '/api/auth/register',
          '/api/auth/admin-login',
          '/api/auth/logout',
          '/api/farming/detect-leagues',
          '/api/farming/character-xp',
          '/api/farming/character-gear',
          '/api/farming/equipped-assets',
          '/api/farming/guild-stash',
          '/api/farming/stash-tabs',
          '/api/farming/stash-snapshot'
        ]);
        if (!publicMutationPaths.has(url.pathname)) {
          if (!verifiedSession) {
            return new Response(
              JSON.stringify({ error: 'Authentication required. Please sign in to perform this action.' }),
              { status: 401, headers: CORS_HEADERS }
            );
          }
          const adminOnlyPaths = new Set(['/api/admin/webhook', '/api/admin/test-webhook', '/api/alumni']);
          if (adminOnlyPaths.has(url.pathname) && !verifiedSession.isAdmin) {
            return new Response(
              JSON.stringify({ error: 'Admin privileges required.' }),
              { status: 403, headers: CORS_HEADERS }
            );
          }
        }
      }

      // Delegate modular Platform Admin, Site Banner, and Per League Staff/Moderation routes
      if (
        url.pathname === '/api/site-banner' ||
        url.pathname === '/api/admin/overview' ||
        url.pathname === '/api/admin/leagues/update' ||
        url.pathname.startsWith('/api/admin/feedback/') ||
        /^\/api\/league\/[^/]+\/(staff|webhook)$/.test(url.pathname)
      ) {
        const govRes = await handleAdminAndGovernanceRoutes({
          request,
          url,
          env,
          db,
          now,
          corsHeaders: CORS_HEADERS,
          session: verifiedSession,
          initD1Schema: ensureD1Schema,
          isSafeWebhookUrl
        });
        if (govRes) return govRes;
      }

      // Dynamic Open Graph SVG Preview Cards (Exile Profile, Character Armory, Hall of Fame, Shared Atlas)
      if (url.pathname === '/api/og/card' && request.method === 'GET') {
        await ensureD1Schema(db);
        return handleOgCardRoute({ url, db, corsHeaders: CORS_HEADERS });
      }

      // Delegate modular Private League & GSF Social routes (Presence, Loans, Craft Queue, Bingo, Daily Digest)
      if (
        url.pathname === '/api/league/presence' ||
        url.pathname === '/api/league/social' ||
        /^\/api\/league\/[^/]+\/daily-digest$/.test(url.pathname)
      ) {
        await ensureD1Schema(db);
        const socialRes = await handleSocialRoutes({
          url,
          request,
          env,
          db,
          leagueId,
          now,
          corsHeaders: CORS_HEADERS,
          session: verifiedSession
        });
        if (socialRes) return socialRes;
      }

      // Delegate modular Asset Tracker routes
      if (url.pathname.startsWith('/api/farming/')) {
        const assetRes = await handleAssetRoutes({
          url,
          request,
          env,
          now,
          corsHeaders: CORS_HEADERS,
          initD1Schema: ensureD1Schema,
          resolveOfficialLadderName,
          readVerifiedSession
        });
        if (assetRes) return assetRes;
      }


      // Helper: Parse GGG forum date strings (rendered in UTC for unauthenticated requests) into ISO
      const parseGggForumDateToIso = (raw: string): string | null => {
        const cleaned = raw
          .replace(/^on\s+/i, '')
          .replace(/&nbsp;/gi, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        if (!cleaned) return null;
        if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(cleaned)) {
          const t = Date.parse(cleaned);
          return Number.isNaN(t) ? null : new Date(t).toISOString();
        }
        const m = cleaned.match(
          /([A-Z][a-z]{2,8}\s+\d{1,2},?\s+\d{4},?\s+\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?)/i
        );
        const candidate = m ? m[1].replace(/,/g, '') : cleaned.replace(/,/g, '');
        const hasTz = /(?:UTC|GMT|NZDT|NZST|EST|EDT|PST|PDT|Z|[+-]\d{2}:?\d{2})$/i.test(candidate);
        const parsed = Date.parse(hasTz ? candidate : `${candidate} UTC`);
        return Number.isNaN(parsed) ? null : new Date(parsed).toISOString();
      };

      // GET /api/patch-notes?game=poe1|poe2 (Live GGG Forum Auto Pull + 30 Min KV Cache + Resilient Fallback)
      if (url.pathname === '/api/patch-notes' && request.method === 'GET') {
        try {
          const gameParam = (url.searchParams.get('game') || 'poe1').toLowerCase() === 'poe2' ? 'poe2' : 'poe1';
          const forceRefresh = url.searchParams.get('refresh') === '1';
          const cacheKey = `patchnotes:list:v3:${gameParam}`;

          if (!forceRefresh && env.EXILE_KV) {
            const cached = await env.EXILE_KV.get(cacheKey);
            if (cached) {
              return new Response(cached, { headers: PUBLIC_CACHE_HEADERS });
            }
          }

          const forumUrl =
            gameParam === 'poe2'
              ? 'https://www.pathofexile.com/forum/view-forum/2212'
              : 'https://www.pathofexile.com/forum/view-forum/patch-notes';

          const fallbackEntries =
            gameParam === 'poe2'
              ? [
                  {
                    id: 'poe2-050',
                    title: 'Path of Exile 2: 0.5.0 Return of the Ancients Patch Notes',
                    officialUrl: 'https://www.pathofexile.com/forum/view-forum/2212',
                    postedAt: 'Latest PoE 2 Season',
                    game: 'poe2'
                  }
                ]
              : [
                  {
                    id: 'poe1-330d',
                    title: '3.30.0d Patch Notes (Covens of Umbra)',
                    officialUrl: 'https://www.pathofexile.com/forum/view-forum/patch-notes',
                    postedAt: 'Latest PoE 1 Hotfix',
                    game: 'poe1'
                  },
                  {
                    id: 'poe1-330c',
                    title: '3.30.0c Patch Notes (Threads of Creation & Balance)',
                    officialUrl: 'https://www.pathofexile.com/forum/view-forum/patch-notes',
                    postedAt: '3.30.0c',
                    game: 'poe1'
                  },
                  {
                    id: 'poe1-3300',
                    title: '3.30.0 Content Update: Path of Exile: Covens of Umbra',
                    officialUrl: 'https://www.pathofexile.com/forum/view-forum/patch-notes',
                    postedAt: '3.30 Launch',
                    game: 'poe1'
                  }
                ];

          let entries: any[] = [];
          let source: 'live' | 'fallback' = 'fallback';

          try {
            const res = await fetch(forumUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; ExileSSF/1.0; +https://exilessf.app)',
                Accept: 'text/html'
              }
            });
            if (res.ok) {
              const html = await res.text();
              const threadRegex = /href="\/forum\/view-thread\/(\d+)"[^>]*>\s*([^<]{6,180})\s*<\/a>/gi;
              const seen = new Set<string>();
              let m: RegExpExecArray | null;
              while ((m = threadRegex.exec(html)) !== null && entries.length < 50) {
                const tid = m[1];
                const rawTitle = m[2]
                  .replace(/&amp;/g, '&')
                  .replace(/&#039;/g, "'")
                  .replace(/&quot;/g, '"')
                  .trim();
                if (!tid || seen.has(tid) || !rawTitle || rawTitle.toLowerCase() === 'last post') continue;
                seen.add(tid);

                // Extract post_date timestamp immediately following this thread link in GGG forum HTML
                const sliceAfter = html.slice(m.index, m.index + 950);
                const dateMatch =
                  sliceAfter.match(/<span[^>]*class="[^"]*post_date[^"]*"[^>]*>([^<]{6,60})<\/span>/i) ||
                  sliceAfter.match(/<time[^>]*datetime="([^"]+)"/i) ||
                  sliceAfter.match(/on\s+([A-Z][a-z]{2}\s+\d{1,2},\s+\d{4},?\s+\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?)/i);
                const rawDateText = dateMatch ? dateMatch[1].replace(/^,\s*/, '').trim() : '';
                const postedAtIso = rawDateText ? parseGggForumDateToIso(rawDateText) : null;

                entries.push({
                  id: tid,
                  title: rawTitle,
                  officialUrl: `https://www.pathofexile.com/forum/view-thread/${tid}`,
                  postedAt: rawDateText || 'Official GGG Post',
                  postedAtIso,
                  game: gameParam
                });
              }
              if (entries.length > 0) source = 'live';
            }
          } catch {}

          const payloadStr = JSON.stringify({
            status: 'ok',
            game: gameParam,
            source,
            forumUrl,
            syncedAtIso: now,
            entries: entries.length > 0 ? entries : fallbackEntries
          });

          if (env.EXILE_KV && entries.length > 0) {
            await env.EXILE_KV.put(cacheKey, payloadStr, { expirationTtl: 1800 });
          }

          return new Response(payloadStr, { headers: CORS_HEADERS });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
        }
      }

      // GET /api/patch-notes/thread?id=<threadId> (Fetch & Sanitize Official GGG Thread into Clean Full Width Blocks)
      if (url.pathname === '/api/patch-notes/thread' && request.method === 'GET') {
        try {
          const threadId = String(url.searchParams.get('id') || '').trim();
          if (!/^\d+$/.test(threadId)) {
            return new Response(
              JSON.stringify({
                status: 'fallback',
                blocks: [
                  {
                    kind: 'paragraph',
                    text: 'Click "Read on pathofexile.com" above to open the official Grinding Gear Games patch notes forum thread directly.'
                  }
                ]
              }),
              { headers: CORS_HEADERS }
            );
          }

          const cacheKey = `patchnotes:thread:v3:${threadId}`;
          if (env.EXILE_KV) {
            const cached = await env.EXILE_KV.get(cacheKey);
            if (cached) return new Response(cached, { headers: CORS_HEADERS });
          }

          const threadUrl = `https://www.pathofexile.com/forum/view-thread/${threadId}`;
          const res = await fetch(threadUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; ExileSSF/1.0; +https://exilessf.app)',
              Accept: 'text/html'
            }
          });

          if (!res.ok) {
            return new Response(
              JSON.stringify({
                status: 'unavailable',
                officialUrl: threadUrl,
                blocks: [
                  {
                    kind: 'paragraph',
                    text: 'Grinding Gear Games forums temporarily rate limited edge fetching. Open the official link above to read the full thread directly.'
                  }
                ]
              }),
              { headers: CORS_HEADERS }
            );
          }

          const html = await res.text();
          // Extract post creation date and optional last edited timestamp from the first post
          const postDateMatch =
            html.match(/<span[^>]*class="[^"]*post_date[^"]*"[^>]*>([^<]{6,60})<\/span>/i) ||
            html.match(/<time[^>]*datetime="([^"]+)"/i);
          const postedAtRaw = postDateMatch ? postDateMatch[1].replace(/^,\s*/, '').trim() : null;
          const postedAtIso = postedAtRaw ? parseGggForumDateToIso(postedAtRaw) : null;

          const editedMatch = html.match(/<div[^>]*class="[^"]*last_edited_by[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
          const editedText = editedMatch ? editedMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';
          const editedDateMatch = editedText.match(/on\s+([A-Z][a-z]{2,8}\s+\d{1,2},?\s+\d{4},?\s+\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?)/i);
          const editedAtRaw = editedDateMatch ? editedDateMatch[1].trim() : null;
          const editedAtIso = editedAtRaw ? parseGggForumDateToIso(editedAtRaw) : null;

          // Isolate the first forum post body inside content-container (avoiding outer page wrapper)
          const postContainerMatch = html.match(
            /<td[^>]*class="[^"]*content-container[^"]*"[^>]*>[\s\S]*?<div class="content">([\s\S]*?)<\/div>\s*(?:<div class="(?:last_edited_by|signature|clear)|<\/div>\s*<\/td>)/i
          );
          const fallbackPostMatch = html.match(
            /<div class="content">([\s\S]*?)<\/div>\s*<div class="(?:last_edited_by|signature|clear)/i
          );
          const rawPost = postContainerMatch ? postContainerMatch[1] : fallbackPostMatch ? fallbackPostMatch[1] : '';

          const decodeEntities = (str: string) =>
            str
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&quot;/g, '"')
              .replace(/&#039;|&#x27;|&rsquo;|&lsquo;/g, "'")
              .replace(/&rdquo;|&ldquo;/g, '"')
              .replace(/&hellip;/g, '...')
              .replace(/&mdash;|&ndash;/g, ': ')
              .replace(/&nbsp;/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();

          const isForumChromeLine = (line: string) => {
            const lower = line.toLowerCase();
            if (lower.includes('forum index') && lower.includes('view thread')) return true;
            if (lower.includes('view staff posts') || lower.includes('post reply')) return true;
            if (/^\d+\s*\.\.\.\s*\d+\s*next$/i.test(line) || /^1234\.\.\./.test(line)) return true;
            return false;
          };

          const blocks: { kind: 'heading' | 'bullet' | 'paragraph'; text: string }[] = [];
          if (rawPost) {
            const normalized = rawPost
              .replace(/<br\s*\/?>/gi, '\n')
              .replace(/<\/(?:p|div|h1|h2|h3|h4|li)>/gi, '\n')
              .replace(/<li[^>]*>/gi, '• ')
              .replace(/<(?:h1|h2|h3|h4|strong)[^>]*>([^<]{3,100})<\/(?:h1|h2|h3|h4|strong)>/gi, '\n### $1\n')
              .replace(/<[^>]+>/g, '');

            for (const rawLine of normalized.split('\n')) {
              const line = decodeEntities(rawLine);
              if (!line || line.length < 2 || isForumChromeLine(line)) continue;
              if (line.startsWith('### ')) {
                blocks.push({ kind: 'heading', text: line.slice(4).trim() });
              } else if (line.startsWith('• ')) {
                blocks.push({ kind: 'bullet', text: line.slice(2).trim() });
              } else {
                blocks.push({ kind: 'paragraph', text: line });
              }
            }
          }

          const payloadStr = JSON.stringify({
            status: blocks.length > 0 ? 'ok' : 'unavailable',
            officialUrl: threadUrl,
            syncedAtIso: now,
            postedAtIso,
            postedAtRaw,
            editedAtIso,
            editedAtRaw,
            blocks:
              blocks.length > 0
                ? blocks.slice(0, 600)
                : [
                    {
                      kind: 'paragraph',
                      text: 'Could not extract body text automatically from this GGG thread. Use the Official GGG Link button above to read it directly.'
                    }
                  ]
          });

          if (env.EXILE_KV && blocks.length > 0) {
            await env.EXILE_KV.put(cacheKey, payloadStr, { expirationTtl: 21600 });
          }

          return new Response(payloadStr, { headers: CORS_HEADERS });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
        }
      }

      // GET /api/builds/external?game=poe1|poe2&refresh=0|1 (Live Mobalytics & Maxroll Build Guide Puller + 60 Min KV Cache)
      if (url.pathname === '/api/builds/external' && request.method === 'GET') {
        try {
          const gameParam = (url.searchParams.get('game') || 'poe1').toLowerCase() === 'poe2' ? 'poe2' : 'poe1';
          const forceRefresh = url.searchParams.get('refresh') === '1';
          const cacheKey = `builds:external:v1:${gameParam}`;

          if (!forceRefresh && env.EXILE_KV) {
            const cached = await env.EXILE_KV.get(cacheKey);
            if (cached) return new Response(cached, { headers: PUBLIC_CACHE_HEADERS });
          }

          const mobalyticsUrl = gameParam === 'poe2' ? 'https://mobalytics.gg/poe-2/builds' : 'https://mobalytics.gg/poe/builds';
          const maxrollUrl = gameParam === 'poe2' ? 'https://maxroll.gg/poe2/build-guides' : 'https://maxroll.gg/poe/category/build-guides';

          const knownAscendancies =
            gameParam === 'poe2'
              ? ['Stormweaver', 'Chronomancer', 'Infernalist', 'Blood Mage', 'Lich', 'Deadeye', 'Pathfinder', 'Titan', 'Warbringer', 'Smith of Kitava', 'Invoker', 'Acolyte of Chayula', 'Witchhunter', 'Gemling Legionnaire', 'Tactician', 'Amazon', 'Ritualist']
              : ['Elementalist', 'Necromancer', 'Occultist', 'Hierophant', 'Inquisitor', 'Guardian', 'Slayer', 'Gladiator', 'Champion', 'Deadeye', 'Pathfinder', 'Warden', 'Juggernaut', 'Berserker', 'Chieftain', 'Trickster', 'Assassin', 'Saboteur', 'Ascendant'];

          const detectAscendancy = (text: string): string => {
            const low = text.toLowerCase();
            return knownAscendancies.find((a) => low.includes(a.toLowerCase())) || (gameParam === 'poe2' ? 'PoE 2 Build' : 'PoE 1 Build');
          };

          const slugToTitle = (slug: string): string =>
            slug
              .replace(/[-_]+/g, ' ')
              .replace(/\b\w/g, (c) => c.toUpperCase())
              .replace(/\bPoe\s*2\b/gi, 'PoE 2')
              .replace(/\bPoe\b/gi, 'PoE')
              .replace(/\bSsf\b/gi, 'SSF')
              .replace(/\bRf\b/gi, 'RF')
              .replace(/\bSrs\b/gi, 'SRS')
              .replace(/\bEa\b/gi, 'EA')
              .replace(/\bDd\b/gi, 'DD')
              .replace(/\bLs\b/gi, 'LS')
              .replace(/\bLa\b/gi, 'LA')
              .trim();

          const fetchHeaders = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
            Accept: 'text/html,application/xhtml+xml'
          };

          const pullFromSource = async (
            source: 'Mobalytics' | 'Maxroll',
            targetUrl: string,
            linkRegex: RegExp,
            baseOrigin: string
          ) => {
            const items: any[] = [];
            try {
              const res = await fetch(targetUrl, { headers: fetchHeaders });
              if (!res.ok) return { status: `http_${res.status}`, items };
              const html = await res.text();
              const seen = new Set<string>();
              let m: RegExpExecArray | null;
              while ((m = linkRegex.exec(html)) !== null && items.length < 24) {
                const hrefPath = m[1];
                const slug = m[2];
                if (!slug || slug.length < 4 || /^(tier-list|leveling|endgame|category|page|author|tag|search|create)$/i.test(slug)) continue;
                const fullUrl = hrefPath.startsWith('http') ? hrefPath : `${baseOrigin}${hrefPath}`;
                if (seen.has(fullUrl)) continue;
                seen.add(fullUrl);

                // Look for an anchor text or nearby heading for a clean title
                const after = html.slice(m.index, m.index + 320);
                const textMatch = after.match(/>([^<]{8,110})<\/(?:a|h2|h3|span|div)>/i);
                const rawTitle = textMatch ? textMatch[1].replace(/&amp;/g, '&').replace(/&#039;|&#x27;/g, "'").replace(/\s+/g, ' ').trim() : '';
                const cleanTitle = rawTitle && !/^(view|read|guide|build|learn more|click)/i.test(rawTitle) ? rawTitle : slugToTitle(slug);
                const combined = `${cleanTitle} ${slug}`.toLowerCase();
                const isSsfStarter = /(starter|ssf|league-start|leaguestart|leveling|budget)/i.test(combined);
                const ascendancy = detectAscendancy(combined);

                items.push({
                  id: `ext-${source.toLowerCase()}-${gameParam}-${slug.slice(0, 48)}`,
                  title: cleanTitle,
                  authorName: source,
                  authorDiscord: source,
                  className: ascendancy,
                  ascendancy,
                  playstyle: isSsfStarter ? 'External SSF & League Starter Guide' : `External ${source} Build Guide`,
                  starterRating: 0,
                  isSsfStarter,
                  pobCodeOrUrl: fullUrl,
                  videoOrForumUrl: fullUrl,
                  levelingNotes: `Pulled live from ${source} (${gameParam === 'poe2' ? 'Path of Exile 2' : 'Path of Exile 1'}). Open the official ${source} guide page for full passive trees, gem links, and gear progression.`,
                  endgameNotes: `Full endgame scaling, crafting priorities, and patch updates maintained on ${source}.`,
                  requiredUniques: [],
                  atlasFocus: [],
                  upvotes: 0,
                  createdAt: `Pulled from ${source}`,
                  game: gameParam,
                  isExternalLinkOnly: true,
                  creatorName: source,
                  creatorChannelUrl: targetUrl,
                  creatorPlatform: source,
                  tags: [gameParam === 'poe2' ? '0.5' : '3.30', source, ...(isSsfStarter ? ['SSF Starter'] : [])]
                });
              }
              return { status: items.length > 0 ? 'ok' : 'empty', items };
            } catch {
              return { status: 'error', items };
            }
          };

          const mobalyticsPattern =
            gameParam === 'poe2'
              ? /href="(\/poe-2\/builds\/([a-z0-9][a-z0-9-]{3,120}))"/gi
              : /href="(\/poe\/builds\/([a-z0-9][a-z0-9-]{3,120}))"/gi;
          const maxrollPattern =
            gameParam === 'poe2'
              ? /href="(https:\/\/maxroll\.gg\/poe2\/build-guides\/([a-z0-9][a-z0-9-]{3,120})|\/poe2\/build-guides\/([a-z0-9][a-z0-9-]{3,120}))"/gi
              : /href="(https:\/\/maxroll\.gg\/poe\/build-guides\/([a-z0-9][a-z0-9-]{3,120})|\/poe\/build-guides\/([a-z0-9][a-z0-9-]{3,120}))"/gi;

          const normalizeMaxrollRegex =
            gameParam === 'poe2'
              ? /href="((?:https:\/\/maxroll\.gg)?\/poe2\/build-guides\/([a-z0-9][a-z0-9-]{3,120}))"/gi
              : /href="((?:https:\/\/maxroll\.gg)?\/poe\/build-guides\/([a-z0-9][a-z0-9-]{3,120}))"/gi;
          void maxrollPattern;

          const [mobRes, maxRes] = await Promise.all([
            pullFromSource('Mobalytics', mobalyticsUrl, mobalyticsPattern, 'https://mobalytics.gg'),
            pullFromSource('Maxroll', maxrollUrl, normalizeMaxrollRegex, 'https://maxroll.gg')
          ]);

          const combinedGuides = [...mobRes.items, ...maxRes.items];
          const payloadStr = JSON.stringify({
            status: 'ok',
            game: gameParam,
            syncedAtIso: now,
            sources: {
              mobalytics: { status: mobRes.status, count: mobRes.items.length, url: mobalyticsUrl },
              maxroll: { status: maxRes.status, count: maxRes.items.length, url: maxrollUrl }
            },
            guides: combinedGuides
          });

          if (env.EXILE_KV && combinedGuides.length > 0) {
            await env.EXILE_KV.put(cacheKey, payloadStr, { expirationTtl: 3600 });
          }

          return new Response(payloadStr, { headers: CORS_HEADERS });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message || 'External build pull failed.' }), {
            status: 500,
            headers: CORS_HEADERS
          });
        }
      }

      // GET /api/pob/resolve?url=<pobb.in or pastebin url> (Stateless PoB raw export code fetcher)
      if (url.pathname === '/api/pob/resolve' && request.method === 'GET') {
        try {
          const rawInput = String(url.searchParams.get('url') || '').trim();
          if (!rawInput) {
            return new Response(JSON.stringify({ error: 'Missing PoB URL parameter.' }), {
              status: 400,
              headers: CORS_HEADERS
            });
          }

          let normalized = rawInput;
          if (!/^https?:\/\//i.test(normalized)) normalized = `https://${normalized}`;

          let fetchTarget = '';
          let canonicalUrl = normalized;

          const pobbinMatch = normalized.match(/^https?:\/\/(?:www\.)?pobb\.in\/([a-zA-Z0-9_-]{4,64})(?:\/raw)?\/?$/i);
          const pastebinMatch = normalized.match(/^https?:\/\/(?:www\.)?pastebin\.com\/(?:raw\/)?([a-zA-Z0-9]{4,32})\/?$/i);

          if (pobbinMatch) {
            fetchTarget = `https://pobb.in/${pobbinMatch[1]}/raw`;
            canonicalUrl = `https://pobb.in/${pobbinMatch[1]}`;
          } else if (pastebinMatch) {
            fetchTarget = `https://pastebin.com/raw/${pastebinMatch[1]}`;
            canonicalUrl = `https://pastebin.com/${pastebinMatch[1]}`;
          } else {
            return new Response(
              JSON.stringify({ error: 'Unsupported PoB URL. Paste a pobb.in link (e.g. https://pobb.in/abc123), pastebin.com link, or raw PoB export code.' }),
              { status: 400, headers: CORS_HEADERS }
            );
          }

          const res = await fetch(fetchTarget, {
            headers: {
              'User-Agent': 'OAuth exile-ssf/1.0 (contact: exilessf.app)',
              Accept: 'text/plain, */*'
            }
          });

          if (!res.ok) {
            return new Response(
              JSON.stringify({ error: `Could not fetch PoB code from ${canonicalUrl} (HTTP ${res.status}). Check that the link is public and valid.` }),
              { status: res.status === 404 ? 404 : 502, headers: CORS_HEADERS }
            );
          }

          const code = (await res.text()).trim();
          if (!code || code.length < 20 || code.startsWith('<!DOCTYPE') || code.startsWith('<html')) {
            return new Response(
              JSON.stringify({ error: `The link ${canonicalUrl} did not return a valid Path of Building export code.` }),
              { status: 422, headers: CORS_HEADERS }
            );
          }

          return new Response(
            JSON.stringify({ status: 'ok', sourceUrl: canonicalUrl, code }),
            { headers: CORS_HEADERS }
          );
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message || 'Failed to resolve PoB URL.' }), {
            status: 500,
            headers: CORS_HEADERS
          });
        }
      }

      // GET /api/tool-state?handle=<handle>&key=<toolKey> (Cloud synced per user tool state: regex presets, bench unlocks, campaign/lab/atlas progress)
      if (url.pathname === '/api/tool-state' && request.method === 'GET') {
        try {
          const handle = String(url.searchParams.get('handle') || '').trim().toLowerCase();
          const toolKey = String(url.searchParams.get('key') || '').trim();
          if (!handle) {
            return new Response(JSON.stringify({ error: 'Missing handle parameter.' }), { status: 400, headers: CORS_HEADERS });
          }
          if (toolKey) {
            const row = await db
              .prepare('SELECT data, updated_at FROM user_tool_state WHERE handle_lower = ? AND tool_key = ?')
              .bind(handle, toolKey)
              .first();
            return new Response(
              JSON.stringify({
                status: 'ok',
                handle,
                toolKey,
                data: row?.data ? JSON.parse(String(row.data)) : null,
                updatedAt: row?.updated_at || null
              }),
              { headers: CORS_HEADERS }
            );
          }
          const rows = await db
            .prepare('SELECT tool_key, data, updated_at FROM user_tool_state WHERE handle_lower = ?')
            .bind(handle)
            .all();
          const map: Record<string, any> = {};
          for (const r of (rows.results || []) as any[]) {
            try {
              map[String(r.tool_key)] = JSON.parse(String(r.data));
            } catch {}
          }
          return new Response(JSON.stringify({ status: 'ok', handle, states: map }), { headers: CORS_HEADERS });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message || 'Failed to read tool state.' }), {
            status: 500,
            headers: CORS_HEADERS
          });
        }
      }

      // POST /api/tool-state (Owner or Admin verified cloud save for user tool state)
      if (url.pathname === '/api/tool-state' && request.method === 'POST') {
        try {
          const body: any = await request.json();
          const handle = String(body.handle || '').trim().toLowerCase();
          const toolKey = String(body.toolKey || '').trim();
          if (!handle || !toolKey || body.data === undefined) {
            return new Response(JSON.stringify({ error: 'handle, toolKey, and data are required.' }), {
              status: 400,
              headers: CORS_HEADERS
            });
          }
          const toolSession = await readVerifiedSession(request, env);
          if (!toolSession || (toolSession.handle.trim().toLowerCase() !== handle && !toolSession.isAdmin)) {
            return new Response(JSON.stringify({ error: 'You may only save tool state for your own signed in account.' }), {
              status: 403,
              headers: CORS_HEADERS
            });
          }
          const serialized = JSON.stringify(body.data);
          if (serialized.length > 150000) {
            return new Response(JSON.stringify({ error: 'Tool state payload exceeds size limit.' }), {
              status: 413,
              headers: CORS_HEADERS
            });
          }
          await db
            .prepare(
              'INSERT INTO user_tool_state (handle_lower, tool_key, data, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(handle_lower, tool_key) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at'
            )
            .bind(handle, toolKey, serialized, now)
            .run();
          return new Response(JSON.stringify({ status: 'ok', handle, toolKey, updatedAt: now }), { headers: CORS_HEADERS });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message || 'Failed to save tool state.' }), {
            status: 500,
            headers: CORS_HEADERS
          });
        }
      }

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

      // DELETE /api/roster/:id (Admin only)
      if (url.pathname.startsWith('/api/roster/') && request.method === 'DELETE') {
        if (!session?.isAdmin) {
          return new Response(JSON.stringify({ error: 'Admin session required to remove roster slots' }), { status: 403, headers: CORS_HEADERS });
        }
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



      // POST /api/import/gsheet (Fetch shared Google Sheet CSV server side with zero CORS)
      if (url.pathname === '/api/import/gsheet' && request.method === 'POST') {
        try {
          const body = (await request.json()) as any;
          const rawUrl = String(body.sheetUrl || '').trim();
          const sheetName = String(body.sheetName || '').trim();
          const match = rawUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
          if (!match) {
            return new Response(JSON.stringify({ error: 'Invalid Google Sheets URL. Paste the full link containing /spreadsheets/d/...' }), {
              status: 400,
              headers: CORS_HEADERS
            });
          }
          const sheetId = match[1];
          const gidMatch = rawUrl.match(/[?&#]gid=(\d+)/);
          let csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;
          if (sheetName) {
            csvUrl += `&sheet=${encodeURIComponent(sheetName)}`;
          } else if (gidMatch) {
            csvUrl += `&gid=${gidMatch[1]}`;
          }
          const res = await fetch(csvUrl, {
            headers: { 'User-Agent': 'ExileSSF-SheetImporter/1.0' }
          });
          if (!res.ok) {
            return new Response(
              JSON.stringify({ error: 'Could not read Google Sheet. Make sure sharing is set to "Anyone with the link can view".' }),
              { status: 400, headers: CORS_HEADERS }
            );
          }
          const csvText = await res.text();
          if (csvText.trim().startsWith('<!DOCTYPE') || csvText.trim().startsWith('<html')) {
            return new Response(
              JSON.stringify({ error: 'Sheet is private. Set Google Sheets Share permission to "Anyone with the link can view" and try again.' }),
              { status: 403, headers: CORS_HEADERS }
            );
          }
          return new Response(JSON.stringify({ status: 'ok', csv: csvText }), { headers: CORS_HEADERS });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
        }
      }

      // GET /api/admin/webhook (Admin only)
      if (url.pathname === '/api/admin/webhook' && request.method === 'GET') {
        if (!session?.isAdmin) {
          return new Response(JSON.stringify({ error: 'Admin session required' }), { status: 403, headers: CORS_HEADERS });
        }
        try {
          const cfg = await getWebhookConfig(env, db);
          return new Response(JSON.stringify({ status: 'ok', config: cfg }), { headers: CORS_HEADERS });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
        }
      }

      // POST /api/admin/webhook (Admin only + SSRF validation)
      if (url.pathname === '/api/admin/webhook' && request.method === 'POST') {
        if (!session?.isAdmin) {
          return new Response(JSON.stringify({ error: 'Admin session required' }), { status: 403, headers: CORS_HEADERS });
        }
        try {
          const body = (await request.json()) as any;
          const rawWebhookUrl = String(body.url || '').trim();
          if (rawWebhookUrl && !isSafeWebhookUrl(rawWebhookUrl)) {
            return new Response(JSON.stringify({ error: 'Webhook URL must be a public https:// endpoint.' }), {
              status: 400,
              headers: CORS_HEADERS
            });
          }
          const cfg: WebhookConfig = {
            url: rawWebhookUrl,
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

      // POST /api/admin/test-webhook (Admin only)
      if (url.pathname === '/api/admin/test-webhook' && request.method === 'POST') {
        if (!session?.isAdmin) {
          return new Response(JSON.stringify({ error: 'Admin session required' }), { status: 403, headers: CORS_HEADERS });
        }
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

      // POST /api/meta (Allowed for Site Super Admin, League Host, or League Moderator with canEditBannerLinks)
      if (url.pathname === '/api/meta' && request.method === 'POST') {
        try {
          const body = (await request.json()) as any;
          const targetLeague = String(body.leagueId || leagueId || '').trim();
          const callerHandle = String(session?.handle || '').trim().toLowerCase();
          let allowed = Boolean(session?.isAdmin);
          if (!allowed && callerHandle && targetLeague) {
            const staffRow = await db
              .prepare('SELECT host_handle, moderators_json FROM league_staff WHERE league_id = ?')
              .bind(targetLeague)
              .first();
            if (staffRow) {
              if (String(staffRow.host_handle || '').trim().toLowerCase() === callerHandle) {
                allowed = true;
              } else if (staffRow.moderators_json) {
                const mods = JSON.parse(staffRow.moderators_json);
                if (
                  Array.isArray(mods) &&
                  mods.some(
                    (m: any) =>
                      String(m?.handle || '').trim().toLowerCase() === callerHandle &&
                      Boolean(m?.permissions?.canEditBannerAndLinks)
                  )
                ) {
                  allowed = true;
                }
              }
            } else {
              const lgRow = await db.prepare('SELECT data FROM custom_leagues WHERE id = ?').bind(targetLeague).first();
              if (lgRow?.data) {
                const lg = JSON.parse(lgRow.data);
                if (String(lg?.hostName || lg?.createdBy || '').trim().toLowerCase() === callerHandle) {
                  allowed = true;
                }
              }
            }
          }
          if (!allowed) {
            return new Response(
              JSON.stringify({ error: 'Only the League Host, authorized Moderator, or Site Admin can edit league settings.' }),
              { status: 403, headers: CORS_HEADERS }
            );
          }

          const row = await db.prepare('SELECT data FROM league_meta WHERE league_id = ?').bind(targetLeague).first();
          const prev = row?.data ? JSON.parse(row.data) : {};
          const next = {
            ...prev,
            ...(body.quickLinks !== undefined ? { quickLinks: body.quickLinks } : {}),
            ...(body.faqList !== undefined ? { faqList: body.faqList } : {}),
            ...(body.archivesList !== undefined ? { archivesList: body.archivesList } : {}),
            ...(body.communityHub !== undefined ? { communityHub: body.communityHub } : {})
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

      // Disabled legacy /api/accounts endpoints to prevent public credential/email exposure
      if (url.pathname === '/api/accounts') {
        return new Response(JSON.stringify({ error: 'Endpoint disabled for security. Use /api/auth/login or /api/auth/register.' }), {
          status: 403,
          headers: CORS_HEADERS
        });
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

      // POST /api/profile (Owner or Admin + URL sanitization)
      if (url.pathname === '/api/profile' && request.method === 'POST') {
        try {
          const body = (await request.json()) as any;
          const targetProfileHandle = String(body.handle || body.profile?.handle || '').trim().replace(/^@/, '').toLowerCase();
          if (!verifiedSession || (!verifiedSession.isAdmin && verifiedSession.handle.toLowerCase() !== targetProfileHandle)) {
            return new Response(JSON.stringify({ error: 'Forbidden: you can only edit your own Exile profile.' }), { status: 403, headers: CORS_HEADERS });
          }
          const profile = body.profile;
          if (!profile || !profile.handle) {
            return new Response(JSON.stringify({ error: 'Missing profile payload' }), { status: 400, headers: CORS_HEADERS });
          }
          const handleLower = String(profile.handle).trim().replace(/^@/, '').toLowerCase();
          if (session && !session.isAdmin && session.handle.toLowerCase() !== handleLower) {
            return new Response(JSON.stringify({ error: 'You can only edit your own Exile profile.' }), { status: 403, headers: CORS_HEADERS });
          }
          if (!isSafeProfileUrl(profile.avatarUrl) || !isSafeProfileUrl(profile.poeProfileUrl) || !isSafeProfileUrl(profile.twitchUrl)) {
            return new Response(JSON.stringify({ error: 'Profile URLs must use https:// or built in preset paths.' }), { status: 400, headers: CORS_HEADERS });
          }
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
          const existingAcc = await db
            .prepare('SELECT username_lower FROM accounts WHERE username_lower = ?')
            .bind(userLower)
            .first();
          if (existingAcc && (!session || (!session.isAdmin && session.handle.toLowerCase() !== userLower))) {
            return new Response(JSON.stringify({ error: 'Username is already registered. Please sign in instead.' }), {
              status: 409,
              headers: CORS_HEADERS
            });
          }

          const passwordHash = password ? await hashPasswordPBKDF2(password) : '';
          const safeUserObj = { ...sanitizeUserAccountForClient(userAccount), isAdmin: false };
          const record = {
            username,
            email: email || undefined,
            passwordHash,
            userAccount: { ...safeUserObj, passwordHash },
            rosterEntry
          };

          await db
            .prepare('INSERT OR REPLACE INTO accounts (username_lower, email_lower, data, updated_at) VALUES (?, ?, ?, ?)')
            .bind(userLower, emailLower, JSON.stringify(record), now)
            .run();

          const cookie = await buildSessionCookieHeader(username, false, env);
          return new Response(
            JSON.stringify({
              success: true,
              userAccount: safeUserObj,
              rosterEntry: record.rosterEntry
            }),
            { headers: { ...CORS_HEADERS, 'Set-Cookie': cookie } }
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
          const isAdminUser = Boolean(record.userAccount?.isAdmin);
          const isPasswordlessGoogle =
            Boolean(body.googleEmailSignIn) &&
            !isAdminUser &&
            !storedHash &&
            row.email_lower &&
            row.email_lower === identifier;

          if (!isPasswordlessGoogle) {
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
          }

          const cookie = await buildSessionCookieHeader(record.username || row.username_lower, isAdminUser, env);
          return new Response(
            JSON.stringify({
              success: true,
              userAccount: sanitizeUserAccountForClient(record.userAccount),
              rosterEntry: record.rosterEntry
            }),
            { headers: { ...CORS_HEADERS, 'Set-Cookie': cookie } }
          );
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
        }
      }



      // POST /api/auth/admin-login (Server side admin password verification -> HttpOnly signed admin cookie)
      if (url.pathname === '/api/auth/admin-login' && request.method === 'POST') {
        try {
          const body = (await request.json()) as any;
          const password = String(body.password || '').trim();
          if (!password) {
            return new Response(JSON.stringify({ error: 'Admin password required.' }), { status: 400, headers: CORS_HEADERS });
          }
          const expectedHash = (env.ADMIN_PASSWORD_HASH || SERVER_ADMIN_SHA256).trim().toLowerCase();
          const suppliedHash = (await computeSha256Hex(password)).toLowerCase();
          if (suppliedHash !== expectedHash) {
            return new Response(JSON.stringify({ error: 'Invalid Admin Password. Access denied.' }), { status: 401, headers: CORS_HEADERS });
          }
          const cookie = await buildSessionCookieHeader('Leuie', true, env);
          return new Response(JSON.stringify({ success: true, handle: 'Leuie', isAdmin: true }), {
            headers: { ...CORS_HEADERS, 'Set-Cookie': cookie }
          });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
        }
      }

      // POST /api/auth/logout (Clears HttpOnly session cookie)
      if (url.pathname === '/api/auth/logout' && request.method === 'POST') {
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...CORS_HEADERS, 'Set-Cookie': buildClearSessionCookieHeader() }
        });
      }

      // GET /api/auth/session (Verify active HttpOnly session)
      if (url.pathname === '/api/auth/session' && request.method === 'GET') {
        return new Response(
          JSON.stringify({
            authenticated: Boolean(session),
            handle: session?.handle || null,
            isAdmin: Boolean(session?.isAdmin)
          }),
          { headers: CORS_HEADERS }
        );
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
        for (const [k, v] of Object.entries(BASE_SECURITY_HEADERS)) {
          headers.set(k, v);
        }
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
