// Cloudflare Worker for Exile SSF
// Provides global edge storage via Cloudflare KV for Wishlists, Roster, Vault, and Guides

export interface Env {
  EXILE_KV?: any;
  ASSETS?: any;
}

const CORS_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    // Handle API endpoints
    if (url.pathname.startsWith('/api/')) {
      if (!env.EXILE_KV) {
        return new Response(
          JSON.stringify({
            status: 'unconfigured',
            message: 'Cloudflare KV namespace EXILE_KV is not yet bound in wrangler.jsonc or Cloudflare dashboard.'
          }),
          { status: 200, headers: CORS_HEADERS }
        );
      }

      const leagueId = url.searchParams.get('league') || 'poe1-330-umbra';

      // GET /api/data endpoint
      // Fast single round trip endpoint to fetch all league records
      if (url.pathname === '/api/data' && request.method === 'GET') {
        try {
          const [wishlistRaw, rosterRaw, vaultRaw, guidesRaw] = await Promise.all([
            env.EXILE_KV.get(`league:${leagueId}:wishlist`),
            env.EXILE_KV.get(`league:${leagueId}:roster`),
            env.EXILE_KV.get(`league:${leagueId}:vault`),
            env.EXILE_KV.get(`league:${leagueId}:guides`)
          ]);

          return new Response(
            JSON.stringify({
              status: 'connected',
              wishlist: wishlistRaw ? JSON.parse(wishlistRaw) : null,
              roster: rosterRaw ? JSON.parse(rosterRaw) : null,
              vault: vaultRaw ? JSON.parse(vaultRaw) : null,
              guides: guidesRaw ? JSON.parse(guidesRaw) : null,
              lastSynced: new Date().toISOString()
            }),
            { headers: CORS_HEADERS }
          );
        } catch (err: any) {
          return new Response(
            JSON.stringify({ status: 'error', message: err.message }),
            { status: 500, headers: CORS_HEADERS }
          );
        }
      }

      // POST /api/wishlist
      if (url.pathname === '/api/wishlist' && request.method === 'POST') {
        try {
          const body = (await request.json()) as any;
          const targetLeague = body.leagueId || leagueId;
          const item = body.item;
          if (!item || !item.id) {
            return new Response(JSON.stringify({ error: 'Missing item payload' }), {
              status: 400,
              headers: CORS_HEADERS
            });
          }

          const key = `league:${targetLeague}:wishlist`;
          const raw = await env.EXILE_KV.get(key);
          let list: any[] = raw ? JSON.parse(raw) : [];
          const existingIdx = list.findIndex((i: any) => i.id === item.id);
          if (existingIdx >= 0) {
            list[existingIdx] = item;
          } else {
            list.unshift(item);
          }

          await env.EXILE_KV.put(key, JSON.stringify(list));
          return new Response(JSON.stringify({ success: true, count: list.length }), {
            headers: CORS_HEADERS
          });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: CORS_HEADERS
          });
        }
      }

      // DELETE /api/wishlist/:id
      if (url.pathname.startsWith('/api/wishlist/') && request.method === 'DELETE') {
        try {
          const itemId = url.pathname.replace('/api/wishlist/', '').trim();
          const key = `league:${leagueId}:wishlist`;
          const raw = await env.EXILE_KV.get(key);
          let list: any[] = raw ? JSON.parse(raw) : [];
          list = list.filter((i: any) => i.id !== itemId);
          await env.EXILE_KV.put(key, JSON.stringify(list));
          return new Response(JSON.stringify({ success: true, remaining: list.length }), {
            headers: CORS_HEADERS
          });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: CORS_HEADERS
          });
        }
      }

      // POST /api/roster
      if (url.pathname === '/api/roster' && request.method === 'POST') {
        try {
          const body = (await request.json()) as any;
          const targetLeague = body.leagueId || leagueId;
          const member = body.member;
          if (!member || (!member.id && !member.displayName)) {
            return new Response(JSON.stringify({ error: 'Missing member payload' }), {
              status: 400,
              headers: CORS_HEADERS
            });
          }

          const key = `league:${targetLeague}:roster`;
          const raw = await env.EXILE_KV.get(key);
          let list: any[] = raw ? JSON.parse(raw) : [];
          const existingIdx = list.findIndex(
            (m: any) =>
              (member.id && m.id === member.id) ||
              m.displayName?.toLowerCase() === member.displayName?.toLowerCase()
          );

          if (existingIdx >= 0) {
            list[existingIdx] = { ...list[existingIdx], ...member };
          } else {
            member.slotNumber = list.length + 1;
            list.push(member);
          }

          await env.EXILE_KV.put(key, JSON.stringify(list));
          return new Response(JSON.stringify({ success: true, count: list.length }), {
            headers: CORS_HEADERS
          });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: CORS_HEADERS
          });
        }
      }

      // POST /api/vault
      if (url.pathname === '/api/vault' && request.method === 'POST') {
        try {
          const body = (await request.json()) as any;
          const targetLeague = body.leagueId || leagueId;
          const item = body.item;
          if (!item || !item.id) {
            return new Response(JSON.stringify({ error: 'Missing vault payload' }), {
              status: 400,
              headers: CORS_HEADERS
            });
          }

          const key = `league:${targetLeague}:vault`;
          const raw = await env.EXILE_KV.get(key);
          let list: any[] = raw ? JSON.parse(raw) : [];
          const existingIdx = list.findIndex((i: any) => i.id === item.id);
          if (existingIdx >= 0) {
            list[existingIdx] = item;
          } else {
            list.unshift(item);
          }

          await env.EXILE_KV.put(key, JSON.stringify(list));
          return new Response(JSON.stringify({ success: true, count: list.length }), {
            headers: CORS_HEADERS
          });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: CORS_HEADERS
          });
        }
      }

      // POST /api/guides
      if (url.pathname === '/api/guides' && request.method === 'POST') {
        try {
          const body = (await request.json()) as any;
          const targetLeague = body.leagueId || leagueId;
          const guide = body.guide;
          if (!guide || (!guide.id && !guide.slug)) {
            return new Response(JSON.stringify({ error: 'Missing guide payload' }), {
              status: 400,
              headers: CORS_HEADERS
            });
          }

          const key = `league:${targetLeague}:guides`;
          const raw = await env.EXILE_KV.get(key);
          let list: any[] = raw ? JSON.parse(raw) : [];
          const existingIdx = list.findIndex(
            (g: any) => (guide.id && g.id === guide.id) || (guide.slug && g.slug === guide.slug)
          );

          if (existingIdx >= 0) {
            list[existingIdx] = guide;
          } else {
            list.unshift(guide);
          }

          await env.EXILE_KV.put(key, JSON.stringify(list));
          return new Response(JSON.stringify({ success: true, count: list.length }), {
            headers: CORS_HEADERS
          });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: CORS_HEADERS
          });
        }
      }

      return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
        status: 404,
        headers: CORS_HEADERS
      });
    }

    // Pass through to static assets (SPA) when ASSETS binding is available
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Exile SSF Cloudflare API Worker running', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
};
