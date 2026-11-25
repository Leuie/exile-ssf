// Modular Private League & GSF Social Routes:
// - Live Squad Presence Bar (KV-backed 5m heartbeat)
// - GSF Item Loans, Squad Craft & Fracture Queue, and 5x5 League Bingo Board
// - Automated Discord / Root Daily Digest (manual trigger + cron)

export interface SocialRouteContext {
  url: URL;
  request: Request;
  env: any;
  db: any;
  leagueId: string;
  now: string;
  corsHeaders: Record<string, string>;
  session: { handle: string; isAdmin: boolean } | null;
}

const PRESENCE_TTL_MS = 5 * 60 * 1000;

async function readLeagueWebhookConfig(env: any, db: any, leagueId: string): Promise<{ url: string; enabled: boolean; events: string[] }> {
  try {
    const leagueRow = await db.prepare('SELECT data FROM league_meta WHERE league_id = ?').bind(`webhook:${leagueId}`).first();
    if (leagueRow?.data) {
      const parsed = JSON.parse(leagueRow.data);
      return {
        url: String(parsed.url || '').trim(),
        enabled: parsed.enabled !== false,
        events: Array.isArray(parsed.events) ? parsed.events : []
      };
    }
    const globalRow = await db.prepare('SELECT data FROM league_meta WHERE league_id = ?').bind('global:webhook').first();
    if (globalRow?.data) {
      const parsed = JSON.parse(globalRow.data);
      return {
        url: String(parsed.url || env.ROOT_WEBHOOK_URL || env.WEBHOOK_URL || '').trim(),
        enabled: parsed.enabled !== false,
        events: Array.isArray(parsed.events) ? parsed.events : []
      };
    }
  } catch {}
  const fallback = String(env.ROOT_WEBHOOK_URL || env.WEBHOOK_URL || '').trim();
  return { url: fallback, enabled: Boolean(fallback), events: [] };
}

export async function dispatchDailyDigestForLeague(
  env: any,
  db: any,
  leagueId: string
): Promise<{ ok: boolean; reason?: string; summary?: string }> {
  try {
    const webhookCfg = await readLeagueWebhookConfig(env, db, leagueId);
    if (!webhookCfg.url || !webhookCfg.enabled) {
      return { ok: false, reason: 'No enabled Discord or Root webhook configured for this league.' };
    }

    const rosterCountRow = await db
      .prepare('SELECT COUNT(*) as c FROM roster_members WHERE league_id = ?')
      .bind(leagueId)
      .first();
    const openWishesRow = await db
      .prepare("SELECT COUNT(*) as c FROM looking_for_items WHERE league_id = ? AND status != 'HAVE'")
      .bind(leagueId)
      .first();
    const fulfilledWishesRow = await db
      .prepare("SELECT COUNT(*) as c FROM looking_for_items WHERE league_id = ? AND status = 'HAVE'")
      .bind(leagueId)
      .first();
    const firstsRow = await db
      .prepare('SELECT COUNT(*) as c FROM league_firsts WHERE league_id = ?')
      .bind(leagueId)
      .first();

    const rosterCount = Number(rosterCountRow?.c || 0);
    const openWishes = Number(openWishesRow?.c || 0);
    const fulfilledWishes = Number(fulfilledWishesRow?.c || 0);
    const leagueFirsts = Number(firstsRow?.c || 0);

    const summary = [
      `**Exile SSF Daily League Digest — ${leagueId}**`,
      `• Active Roster: **${rosterCount} Exiles**`,
      `• Squad Wishes Fulfilled: **${fulfilledWishes}** (${openWishes} currently open)`,
      `• Hall of Fame League Firsts: **${leagueFirsts}**`,
      `View Hub: https://exilessf.app/league/${encodeURIComponent(leagueId)}`
    ].join('\n');

    const isDiscord = /discord\.com\/api\/webhooks|discordapp\.com\/api\/webhooks/i.test(webhookCfg.url);
    const payload = isDiscord
      ? {
          username: 'Exile SSF Digest',
          embeds: [
            {
              title: `Daily League Digest • ${leagueId}`,
              description: summary,
              color: 0xf59e0b,
              timestamp: new Date().toISOString()
            }
          ]
        }
      : { content: summary, text: summary };

    const res = await fetch(webhookCfg.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    return res.ok ? { ok: true, summary } : { ok: false, reason: `Webhook returned HTTP ${res.status}` };
  } catch (err: any) {
    return { ok: false, reason: err?.message || 'Digest dispatch error' };
  }
}

export async function runScheduledDailyDigests(env: any): Promise<void> {
  if (!env?.EXILE_DB || !env?.EXILE_KV) return;
  try {
    // Fire only once per day around 8:00 PM EST (01:00 UTC)
    const now = new Date();
    const utcHour = now.getUTCHours();
    if (utcHour !== 1) return;
    const dayKey = `digest:sent:${now.toISOString().slice(0, 10)}`;
    const alreadySent = await env.EXILE_KV.get(dayKey);
    if (alreadySent) return;

    const leaguesRes = await env.EXILE_DB.prepare('SELECT id FROM private_leagues').all();
    const ids = (leaguesRes?.results || []).map((r: any) => String(r.id)).filter(Boolean);
    if (!ids.includes('poe1-330-umbra')) ids.push('poe1-330-umbra');

    for (const lid of ids) {
      const cfg = await readLeagueWebhookConfig(env, env.EXILE_DB, lid);
      if (cfg.enabled && cfg.url && cfg.events.includes('daily_digest')) {
        await dispatchDailyDigestForLeague(env, env.EXILE_DB, lid);
      }
    }
    await env.EXILE_KV.put(dayKey, '1', { expirationTtl: 86400 });
  } catch {}
}

export async function handleSocialRoutes(ctx: SocialRouteContext): Promise<Response | null> {
  const { url, request, env, db, leagueId, now, corsHeaders, session } = ctx;

  // GET /api/league/presence?league=<id>
  if (url.pathname === '/api/league/presence' && request.method === 'GET') {
    const kvKey = `presence:league:${leagueId}`;
    let entries: any[] = [];
    try {
      if (env.EXILE_KV) {
        const raw = await env.EXILE_KV.get(kvKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          const cutoff = Date.now() - PRESENCE_TTL_MS;
          entries = Array.isArray(parsed)
            ? parsed.filter((e: any) => Number(e?.updatedAtMs || 0) >= cutoff)
            : [];
        }
      }
    } catch {}
    return new Response(JSON.stringify({ status: 'ok', leagueId, entries }), { headers: corsHeaders });
  }

  // POST /api/league/presence (Opt-in heartbeat from Map Tracker)
  if (url.pathname === '/api/league/presence' && request.method === 'POST') {
    try {
      const body: any = await request.json();
      const targetLeague = String(body.leagueId || leagueId || 'poe1-330-umbra').trim();
      const handle = String(session?.handle || body.handle || '').trim();
      if (!handle) {
        return new Response(JSON.stringify({ error: 'Handle required' }), { status: 400, headers: corsHeaders });
      }
      const kvKey = `presence:league:${targetLeague}`;
      let entries: any[] = [];
      if (env.EXILE_KV) {
        const raw = await env.EXILE_KV.get(kvKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          const cutoff = Date.now() - PRESENCE_TTL_MS;
          entries = Array.isArray(parsed)
            ? parsed.filter(
                (e: any) =>
                  Number(e?.updatedAtMs || 0) >= cutoff &&
                  String(e?.handle || '').toLowerCase() !== handle.toLowerCase()
              )
            : [];
        }
        if (body.active !== false) {
          entries.unshift({
            handle,
            characterName: String(body.characterName || '').slice(0, 48),
            zone: String(body.zone || 'Mapping').slice(0, 64),
            zoneKind: String(body.zoneKind || 'Map').slice(0, 32),
            updatedAtMs: Date.now(),
            updatedAtIso: now
          });
        }
        await env.EXILE_KV.put(kvKey, JSON.stringify(entries.slice(0, 60)), { expirationTtl: 600 });
      }
      return new Response(JSON.stringify({ status: 'ok', entries }), { headers: corsHeaders });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err?.message || 'Presence update failed' }), {
        status: 500,
        headers: corsHeaders
      });
    }
  }

  // GET /api/league/social?league=<id> (Loans, Craft Queue & 5x5 League Bingo)
  if (url.pathname === '/api/league/social' && request.method === 'GET') {
    try {
      const toolKey = `league_social:${leagueId}`;
      const row = await db
        .prepare("SELECT payload_json FROM user_tool_state WHERE user_handle = '__league_social__' AND tool_key = ?")
        .bind(toolKey)
        .first();
      const data = row?.payload_json
        ? JSON.parse(row.payload_json)
        : { loans: [], crafts: [], bingoClaims: {} };
      return new Response(JSON.stringify({ status: 'ok', leagueId, data }), { headers: corsHeaders });
    } catch (err: any) {
      return new Response(JSON.stringify({ status: 'ok', leagueId, data: { loans: [], crafts: [], bingoClaims: {} } }), {
        headers: corsHeaders
      });
    }
  }

  // POST /api/league/social (Persist updated Loans, Craft Queue, or Bingo Claims)
  if (url.pathname === '/api/league/social' && request.method === 'POST') {
    try {
      const body: any = await request.json();
      const targetLeague = String(body.leagueId || leagueId || 'poe1-330-umbra').trim();
      const toolKey = `league_social:${targetLeague}`;
      const data = body.data || { loans: [], crafts: [], bingoClaims: {} };
      await db
        .prepare(
          `INSERT INTO user_tool_state (user_handle, tool_key, payload_json, updated_at)
           VALUES ('__league_social__', ?, ?, ?)
           ON CONFLICT(user_handle, tool_key) DO UPDATE SET payload_json = excluded.payload_json, updated_at = excluded.updated_at`
        )
        .bind(toolKey, JSON.stringify(data), now)
        .run();
      return new Response(JSON.stringify({ status: 'ok', leagueId: targetLeague }), { headers: corsHeaders });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err?.message || 'Could not save league social state' }), {
        status: 500,
        headers: corsHeaders
      });
    }
  }

  // POST /api/league/:id/daily-digest (Manual trigger / test for League Staff)
  const digestMatch = url.pathname.match(/^\/api\/league\/([^/]+)\/daily-digest$/);
  if (digestMatch && request.method === 'POST') {
    const targetLeague = decodeURIComponent(digestMatch[1]);
    const result = await dispatchDailyDigestForLeague(env, db, targetLeague);
    return new Response(JSON.stringify(result), {
      status: result.ok ? 200 : 400,
      headers: corsHeaders
    });
  }

  return null;
}
