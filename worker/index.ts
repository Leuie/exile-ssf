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
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
};

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

function resolvePageMeta(url: URL): PageMeta {
  const path = url.pathname.toLowerCase().replace(/\/+$/, '') || '/';
  const queryTab = (url.searchParams.get('tab') || url.searchParams.get('page') || '').toLowerCase().trim();

  // League routes: /league/:leagueId/:subTab?
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
        title: `Bounties & Honors | ${leagueName} | Exile SSF`,
        description: `Post incentivized finder bounties for chase items, track Fulfillment Heroes, settle deliveries, and unlock achievements that carry over across future seasons.`
      };
    }
    if (subTab === 'roster' || subTab === 'roster-directory' || subTab === 'directory') {
      return {
        title: `Roster Directory | ${leagueName} | Exile SSF`,
        description: `View active private league account slots, multi character builds, ascendancies, levels, and direct contact handles for every exile in ${leagueName}.`
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

  if (path.includes('feedback')) {
    return {
      title: 'Feedback & Roadmap Hub | Exile SSF',
      description: 'Submit feature requests, report issues, upvote community ideas, and track upcoming improvements to the Exile SSF portal.'
    };
  }

  if (path.includes('analyzer') || path.includes('doctor')) {
    return {
      title: 'PoB Build Doctor & Analyzer | Exile SSF',
      description: 'Import Path of Building share codes to diagnose elemental resistance caps, Chaos resistance, physical mitigation, life pools, and spell suppression.'
    };
  }

  if (path.includes('ingest')) {
    return {
      title: 'Build Guide Ingestion Engine | Exile SSF',
      description: 'Import Path of Exile guides from pobb.in, YouTube, Maxroll, or forum threads into your SSF library with automatic creator attribution.'
    };
  }

  if (path.includes('builds') || path.includes('starters')) {
    return {
      title: 'SSF League Starters | Exile SSF',
      description: 'Verified Solo Self Found and Group Self Found league starter builds for Path of Exile 1 (3.30.0d) and Path of Exile 2 (0.5).'
    };
  }

  if (path.includes('atlas') || path.includes('maps')) {
    return {
      title: 'Atlas & Mapping Progression | Exile SSF',
      description: 'Endgame Atlas progression strategy, 4 Voidstone roadmap, favorite map ratings, and SSF farming trees.'
    };
  }

  if (path.includes('campaign') || path.includes('acts')) {
    return {
      title: 'Acts 1 to 10 Campaign Walkthrough | Exile SSF',
      description: 'Fast act by act campaign checklist covering mandatory passive skill quests, bench unlocks, and leveling tips for Path of Exile.'
    };
  }

  if (path.includes('labyrinth') || path.includes('lab')) {
    return {
      title: 'Lord\'s Labyrinth & Ascendancy Guide | Exile SSF',
      description: 'Trial locations, Izaro mechanics, transfigured gem farming tips, and Ascendancy progression benchmarks.'
    };
  }

  if (path.includes('recipes') || path.includes('vendor')) {
    return {
      title: 'Vendor Recipes & Deterministic Crafting | Exile SSF',
      description: 'Essential Path of Exile vendor formulas including weapon damage upgrades, gem recipes, currency swaps, and the 3.30.0c 3 to 1 Threads of Creation recipe.'
    };
  }

  if (path.includes('progress') || path.includes('checklist')) {
    return {
      title: 'SSF Progression Checklist | Exile SSF',
      description: 'Interactive milestone checklist tracking your Solo Self Found journey from Twilight Strand through 4 Voidstones and Uber Pinnacle bosses.'
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
          const [wishlistRaw, rosterRaw, vaultRaw, guidesRaw, achievementsRaw, alumniRaw, metaRaw] = await Promise.all([
            env.EXILE_KV.get(`league:${leagueId}:wishlist`),
            env.EXILE_KV.get(`league:${leagueId}:roster`),
            env.EXILE_KV.get(`league:${leagueId}:vault`),
            env.EXILE_KV.get(`league:${leagueId}:guides`),
            env.EXILE_KV.get('global:achievements'),
            env.EXILE_KV.get('global:alumni'),
            env.EXILE_KV.get(`league:${leagueId}:meta`)
          ]);

          return new Response(
            JSON.stringify({
              status: 'connected',
              wishlist: wishlistRaw ? JSON.parse(wishlistRaw) : null,
              roster: rosterRaw ? JSON.parse(rosterRaw) : null,
              vault: vaultRaw ? JSON.parse(vaultRaw) : null,
              guides: guidesRaw ? JSON.parse(guidesRaw) : null,
              achievements: achievementsRaw ? JSON.parse(achievementsRaw) : {},
              alumni: alumniRaw ? JSON.parse(alumniRaw) : null,
              meta: metaRaw ? JSON.parse(metaRaw) : null,
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

      // DELETE /api/roster/:id
      if (url.pathname.startsWith('/api/roster/') && request.method === 'DELETE') {
        try {
          const memberId = decodeURIComponent(url.pathname.replace('/api/roster/', '').trim());
          const key = `league:${leagueId}:roster`;
          const raw = await env.EXILE_KV.get(key);
          let list: any[] = raw ? JSON.parse(raw) : [];
          list = list.filter((m: any) =>
            m.id !== memberId &&
            m.displayName?.toLowerCase() !== memberId.toLowerCase() &&
            m.characterName?.toLowerCase() !== memberId.toLowerCase()
          );
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

      // POST /api/achievements
      // Merges player achievement profile into global:achievements in Cloudflare KV
      if (url.pathname === '/api/achievements' && request.method === 'POST') {
        try {
          const body = (await request.json()) as any;
          const playerKey = String(body.playerKey || '').trim().toLowerCase();
          const incoming = body.profile;
          if (!playerKey || !incoming) {
            return new Response(JSON.stringify({ error: 'Missing playerKey or profile payload' }), {
              status: 400,
              headers: CORS_HEADERS
            });
          }

          const key = 'global:achievements';
          const raw = await env.EXILE_KV.get(key);
          const store: Record<string, any> = raw ? JSON.parse(raw) : {};
          const prev = store[playerKey] || {
            unlockedIds: {},
            lifetimeFulfilledCount: 0,
            lifetimeBountiesClaimed: 0,
            lifetimeBountiesPaid: 0,
            leaguesParticipated: []
          };

          const mergedLeagues = Array.from(
            new Set([
              ...(Array.isArray(prev.leaguesParticipated) ? prev.leaguesParticipated : []),
              ...(Array.isArray(incoming.leaguesParticipated) ? incoming.leaguesParticipated : [])
            ])
          );

          store[playerKey] = {
            unlockedIds: { ...(prev.unlockedIds || {}), ...(incoming.unlockedIds || {}) },
            equippedTitle: incoming.equippedTitle !== undefined ? incoming.equippedTitle : prev.equippedTitle,
            lifetimeFulfilledCount: Math.max(Number(prev.lifetimeFulfilledCount) || 0, Number(incoming.lifetimeFulfilledCount) || 0),
            lifetimeBountiesClaimed: Math.max(Number(prev.lifetimeBountiesClaimed) || 0, Number(incoming.lifetimeBountiesClaimed) || 0),
            lifetimeBountiesPaid: Math.max(Number(prev.lifetimeBountiesPaid) || 0, Number(incoming.lifetimeBountiesPaid) || 0),
            leaguesParticipated: mergedLeagues
          };

          await env.EXILE_KV.put(key, JSON.stringify(store));
          return new Response(JSON.stringify({ success: true, profile: store[playerKey] }), {
            headers: CORS_HEADERS
          });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: CORS_HEADERS
          });
        }
      }

      // POST /api/alumni
      // Persists global NOIR alumni directory in Cloudflare KV
      if (url.pathname === '/api/alumni' && request.method === 'POST') {
        try {
          const body = (await request.json()) as any;
          if (!Array.isArray(body.alumni)) {
            return new Response(JSON.stringify({ error: 'Missing alumni array payload' }), {
              status: 400,
              headers: CORS_HEADERS
            });
          }

          await env.EXILE_KV.put('global:alumni', JSON.stringify(body.alumni));
          return new Response(JSON.stringify({ success: true, count: body.alumni.length }), {
            headers: CORS_HEADERS
          });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: CORS_HEADERS
          });
        }
      }

      // GET /api/feedback
      if (url.pathname === '/api/feedback' && request.method === 'GET') {
        try {
          const raw = await env.EXILE_KV.get('global:feedback');
          return new Response(
            JSON.stringify({
              status: 'connected',
              feedback: raw ? JSON.parse(raw) : null
            }),
            { headers: CORS_HEADERS }
          );
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: CORS_HEADERS
          });
        }
      }

      // POST /api/feedback
      if (url.pathname === '/api/feedback' && request.method === 'POST') {
        try {
          const body = (await request.json()) as any;
          const item = body.item;
          if (!item || !item.id) {
            return new Response(JSON.stringify({ error: 'Missing feedback item payload' }), {
              status: 400,
              headers: CORS_HEADERS
            });
          }

          const key = 'global:feedback';
          const raw = await env.EXILE_KV.get(key);
          let list: any[] = raw ? JSON.parse(raw) : [];
          const existingIdx = list.findIndex((f: any) => f.id === item.id);
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

      // POST /api/meta
      // Persists league quickLinks, faqList, and archivesList in Cloudflare KV
      if (url.pathname === '/api/meta' && request.method === 'POST') {
        try {
          const body = (await request.json()) as any;
          const targetLeague = body.leagueId || leagueId;
          const key = `league:${targetLeague}:meta`;
          const raw = await env.EXILE_KV.get(key);
          const prev = raw ? JSON.parse(raw) : {};
          const next = {
            ...prev,
            ...(body.quickLinks !== undefined ? { quickLinks: body.quickLinks } : {}),
            ...(body.faqList !== undefined ? { faqList: body.faqList } : {}),
            ...(body.archivesList !== undefined ? { archivesList: body.archivesList } : {})
          };
          await env.EXILE_KV.put(key, JSON.stringify(next));
          return new Response(JSON.stringify({ success: true, meta: next }), {
            headers: CORS_HEADERS
          });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: CORS_HEADERS
          });
        }
      }

      // GET /api/leagues
      if (url.pathname === '/api/leagues' && request.method === 'GET') {
        try {
          const raw = await env.EXILE_KV.get('global:leagues');
          return new Response(
            JSON.stringify({ status: 'connected', leagues: raw ? JSON.parse(raw) : [] }),
            { headers: CORS_HEADERS }
          );
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: CORS_HEADERS
          });
        }
      }

      // POST /api/leagues
      if (url.pathname === '/api/leagues' && request.method === 'POST') {
        try {
          const body = (await request.json()) as any;
          const league = body.league;
          if (!league || !league.id) {
            return new Response(JSON.stringify({ error: 'Missing league payload' }), {
              status: 400,
              headers: CORS_HEADERS
            });
          }
          const key = 'global:leagues';
          const raw = await env.EXILE_KV.get(key);
          const list: any[] = raw ? JSON.parse(raw) : [];
          const idx = list.findIndex((l: any) => l.id === league.id);
          if (idx >= 0) {
            list[idx] = league;
          } else {
            list.push(league);
          }
          await env.EXILE_KV.put(key, JSON.stringify(list));
          return new Response(JSON.stringify({ success: true, leagues: list }), {
            headers: CORS_HEADERS
          });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: CORS_HEADERS
          });
        }
      }

      // GET /api/accounts
      if (url.pathname === '/api/accounts' && request.method === 'GET') {
        try {
          const raw = await env.EXILE_KV.get('global:accounts');
          return new Response(
            JSON.stringify({ status: 'connected', accounts: raw ? JSON.parse(raw) : [] }),
            { headers: CORS_HEADERS }
          );
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: CORS_HEADERS
          });
        }
      }

      // POST /api/accounts
      if (url.pathname === '/api/accounts' && request.method === 'POST') {
        try {
          const body = (await request.json()) as any;
          const account = body.account;
          if (!account || !account.username) {
            return new Response(JSON.stringify({ error: 'Missing account payload' }), {
              status: 400,
              headers: CORS_HEADERS
            });
          }
          const key = 'global:accounts';
          const raw = await env.EXILE_KV.get(key);
          const list: any[] = raw ? JSON.parse(raw) : [];
          const idx = list.findIndex(
            (a: any) =>
              a.username?.toLowerCase() === account.username.toLowerCase() ||
              (account.email && a.email?.toLowerCase() === account.email.toLowerCase())
          );
          if (idx >= 0) {
            list[idx] = { ...list[idx], ...account };
          } else {
            list.push(account);
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

    return new Response('Exile SSF Cloudflare API Worker running', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
};
