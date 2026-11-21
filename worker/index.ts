// Cloudflare Worker for Exile SSF
// Primary atomic storage via Cloudflare D1 (EXILE_DB) with automatic KV migration and edge OpenGraph metadata

export interface Env {
  EXILE_DB?: any;
  EXILE_KV?: any;
  ASSETS?: any;
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
    `CREATE TABLE IF NOT EXISTS migrations (key TEXT PRIMARY KEY, migrated_at TEXT NOT NULL)`
  ];

  await db.batch(statements.map((sql) => db.prepare(sql)));
  schemaInitialized = true;
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
        title: `Wishlists & Drop Matcher | ${leagueName} | Exile SSF`,
        description: `Track wanted uniques, gems, boss fragments, and crafting bases across ${leagueName}. Filter by character for farming sessions and match drops in one click.`
      };
    }
    if (subTab === 'bounties' || subTab === 'bounty' || subTab === 'honors' || subTab === 'achievements' || subTab === 'rewards') {
      return {
        title: `Bounties, Carries & Honors | ${leagueName} | Exile SSF`,
        description: `Post incentivized finder bounties, browse squad boss carries and vouches, track Fulfillment Heroes, and unlock achievements that carry over across future seasons.`
      };
    }
    if (subTab === 'roster' || subTab === 'roster-directory' || subTab === 'directory') {
      return {
        title: `Roster Directory | ${leagueName} | Exile SSF`,
        description: `View active private league account slots, multi character builds, ascendancies, live ladder levels, and direct contact handles for every exile in ${leagueName}.`
      };
    }
    if (subTab === 'guides' || subTab === 'build-guides' || subTab === 'buildguides') {
      return {
        title: `Community Build Guides | ${leagueName} | Exile SSF`,
        description: `Explore curated SSF league starter and endgame build guides with PoB links, class filters, and one click import of required uniques to your wishlist.`
      };
    }
    if (subTab === 'cheatsheets' || subTab === 'cheat-sheets' || subTab === 'mechanics') {
      return {
        title: `Mechanic Cheat Sheets (3.30.0d) | ${leagueName} | Exile SSF`,
        description: `Quick reference tables for 3.30.0d Threads of Creation thresholds, Betrayal Syndicate rewards, Heist Rogues, Delve Fossils, Incursion rooms, and Atlas Maps.`
      };
    }
    if (subTab === 'bench' || subTab === 'bench-stash-guide' || subTab === 'new_player' || subTab === 'stash') {
      return {
        title: `Bench Unlocks & Stash Tab Guide | ${leagueName} | Exile SSF`,
        description: `Essential crafting bench recipe unlock locations and prioritized stash tab buyer tiers for Solo Self Found and Group Self Found progression.`
      };
    }
    if (subTab === 'alumni' || subTab === 'alumni-directory') {
      return {
        title: `Alumni Directory | ${leagueName} | Exile SSF`,
        description: `Historical directory of over 100 past private league participants across 5 seasons with preferred contact tags and squad outreach tools.`
      };
    }
    return {
      title: `Command Center | ${leagueName} | Exile SSF`,
      description: `League headquarters for ${leagueName} with live crowdfunding status, countdown timers, 4 step onboarding, community links, archives, and F.A.Q.`
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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
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

          const [wishRes, rosterRes, guideRes, achRes, alumniRes, metaRes, svcRes, vouchRes] = await Promise.all([
            db.prepare('SELECT data FROM wishlists WHERE league_id = ? ORDER BY updated_at DESC').bind(leagueId).all(),
            db.prepare('SELECT data FROM roster WHERE league_id = ?').bind(leagueId).all(),
            db.prepare('SELECT data FROM guides WHERE league_id = ? ORDER BY updated_at DESC').bind(leagueId).all(),
            db.prepare('SELECT player_key, data FROM achievements').all(),
            db.prepare('SELECT data FROM alumni').all(),
            db.prepare('SELECT data FROM league_meta WHERE league_id = ?').bind(leagueId).first(),
            db.prepare('SELECT data FROM services WHERE league_id = ? ORDER BY updated_at DESC').bind(leagueId).all(),
            db.prepare('SELECT data FROM vouches WHERE league_id = ? ORDER BY created_at DESC').bind(leagueId).all()
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

          const merged = {
            unlockedIds: { ...(prev.unlockedIds || {}), ...(incoming.unlockedIds || {}) },
            equippedTitle: incoming.equippedTitle !== undefined ? incoming.equippedTitle : prev.equippedTitle,
            lifetimeFulfilledCount: Math.max(Number(prev.lifetimeFulfilledCount) || 0, Number(incoming.lifetimeFulfilledCount) || 0),
            lifetimeBountiesClaimed: Math.max(Number(prev.lifetimeBountiesClaimed) || 0, Number(incoming.lifetimeBountiesClaimed) || 0),
            lifetimeBountiesPaid: Math.max(Number(prev.lifetimeBountiesPaid) || 0, Number(incoming.lifetimeBountiesPaid) || 0),
            leaguesParticipated: mergedLeagues
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
