// Modular Platform Super Admin & Per League Governance Routes for Exile SSF Worker

export interface AdminRouteContext {
  request: Request;
  url: URL;
  env: any;
  db: any;
  now: string;
  corsHeaders: Record<string, string>;
  session: { handle: string; isAdmin: boolean } | null;
  initD1Schema: (db: any) => Promise<void>;
  isSafeWebhookUrl: (urlStr: string) => boolean;
}

const DEFAULT_CORE_LEAGUES = [
  {
    id: 'poe1-330-umbra',
    name: 'Ravenwatch Covens of Umbra GSF (PL87651)',
    game: 'poe1',
    version: '3.30',
    status: 'Active',
    hostHandle: 'Leuie'
  },
  {
    id: 'poe2-05-ancients',
    name: 'Ravenwatch Return of the Ancients GSF',
    game: 'poe2',
    version: '0.5',
    status: 'Upcoming',
    hostHandle: 'Leuie'
  }
];

function buildDefaultHostStaff(leagueId: string, hostHandle: string, now: string) {
  const cleanHost = (hostHandle || 'Leuie').trim();
  const isLeuie = cleanHost.toLowerCase() === 'leuie';
  return {
    leagueId,
    hostHandle: cleanHost,
    staff: [
      {
        id: `staff-host-${leagueId}`,
        handle: cleanHost,
        role: 'host',
        title: 'League Host & Admin',
        contact: isLeuie
          ? { root: 'Ravenwatch Root', discord: '@leuie', inGame: 'Leuie#0626' }
          : { inGame: cleanHost },
        permissions: {
          canManageRoster: true,
          canManageWishlists: true,
          canManageAwards: true,
          canBroadcast: true,
          canEditWebhook: true,
          canEditBannerAndLinks: true
        },
        addedBy: cleanHost,
        addedAtIso: now
      }
    ]
  };
}

export async function getLeagueStaffRecord(db: any, leagueId: string, now: string): Promise<{
  leagueId: string;
  hostHandle: string;
  staff: any[];
}> {
  const row = await db.prepare('SELECT data FROM league_meta WHERE league_id = ?').bind(`staff:${leagueId}`).first();
  if (row?.data) {
    try {
      const parsed = JSON.parse(row.data);
      if (parsed && Array.isArray(parsed.staff)) {
        return {
          leagueId,
          hostHandle: String(parsed.hostHandle || parsed.staff.find((s: any) => s.role === 'host')?.handle || 'Leuie'),
          staff: parsed.staff
        };
      }
    } catch {}
  }

  // Resolve creator/host from custom_leagues if present
  let fallbackHost = 'Leuie';
  try {
    const customRow = await db.prepare('SELECT data FROM custom_leagues WHERE id = ?').bind(leagueId).first();
    if (customRow?.data) {
      const cl = JSON.parse(customRow.data);
      if (cl?.hostHandle) fallbackHost = String(cl.hostHandle);
      else if (cl?.hostName) fallbackHost = String(cl.hostName);
      else if (cl?.createdBy) fallbackHost = String(cl.createdBy);
    }
  } catch {}
  return buildDefaultHostStaff(leagueId, fallbackHost, now);
}

export function resolveStaffRoleForSession(
  session: { handle: string; isAdmin: boolean } | null,
  staffRec: { hostHandle: string; staff: any[] }
): { isSuperAdmin: boolean; isLeagueHost: boolean; isLeagueMod: boolean; member: any | null } {
  if (!session) return { isSuperAdmin: false, isLeagueHost: false, isLeagueMod: false, member: null };
  const h = session.handle.trim().replace(/^@/, '').toLowerCase();
  const isSuperAdmin = Boolean(session.isAdmin);
  const hostMatch = staffRec.hostHandle.trim().replace(/^@/, '').toLowerCase() === h;
  const member =
    staffRec.staff.find((s: any) => String(s?.handle || '').trim().replace(/^@/, '').toLowerCase() === h) || null;
  const isLeagueHost = hostMatch || member?.role === 'host';
  const isLeagueMod = Boolean(!isLeagueHost && member && member.role === 'moderator');
  return { isSuperAdmin, isLeagueHost, isLeagueMod, member };
}

export async function handleAdminAndGovernanceRoutes(ctx: AdminRouteContext): Promise<Response | null> {
  const { request, url, db, now, corsHeaders, session, initD1Schema, isSafeWebhookUrl } = ctx;

  // =========================================================================
  // 1. GLOBAL SITEWIDE NOTICE BANNER (/api/site-banner)
  // =========================================================================
  if (url.pathname === '/api/site-banner' && request.method === 'GET') {
    try {
      await initD1Schema(db);
      const row = await db.prepare('SELECT data FROM league_meta WHERE league_id = ?').bind('site:banner').first();
      const banner = row?.data
        ? JSON.parse(row.data)
        : { enabled: false, message: '', subtext: '', tone: 'indigo', linkLabel: '', linkUrl: '' };
      return new Response(JSON.stringify({ status: 'ok', banner }), {
        headers: { ...corsHeaders, 'Cache-Control': 'public, max-age=60, stale-while-revalidate=120' }
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
    }
  }

  if (url.pathname === '/api/site-banner' && request.method === 'POST') {
    if (!session?.isAdmin) {
      return new Response(JSON.stringify({ error: 'Site Super Admin access required.' }), { status: 403, headers: corsHeaders });
    }
    try {
      await initD1Schema(db);
      const body: any = await request.json();
      const validTones = new Set(['indigo', 'amber', 'emerald', 'rose', 'holiday']);
      const tone = validTones.has(String(body.tone)) ? String(body.tone) : 'indigo';
      const banner = {
        enabled: Boolean(body.enabled),
        message: String(body.message || '').trim().slice(0, 280),
        subtext: String(body.subtext || '').trim().slice(0, 320),
        tone,
        linkLabel: String(body.linkLabel || '').trim().slice(0, 60),
        linkUrl: String(body.linkUrl || '').trim().slice(0, 300),
        updatedAtIso: now
      };
      await db
        .prepare('INSERT OR REPLACE INTO league_meta (league_id, data, updated_at) VALUES (?, ?, ?)')
        .bind('site:banner', JSON.stringify(banner), now)
        .run();
      return new Response(JSON.stringify({ status: 'ok', banner }), { headers: corsHeaders });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
    }
  }

  // =========================================================================
  // 2. MACRO SITE SUPER ADMIN OVERVIEW (/api/admin/overview)
  // =========================================================================
  if (url.pathname === '/api/admin/overview' && request.method === 'GET') {
    if (!session?.isAdmin) {
      return new Response(JSON.stringify({ error: 'Site Super Admin access required.' }), { status: 403, headers: corsHeaders });
    }
    try {
      await initD1Schema(db);
      const [
        customLeaguesRes,
        rosterRowsRes,
        wishRowsRes,
        accountsCountRes,
        farmingCountRes,
        mapCountRes,
        feedbackRowsRes,
        staffMetaRes
      ] = await Promise.all([
        db.prepare('SELECT id, data, updated_at FROM custom_leagues').all(),
        db.prepare('SELECT league_id, COUNT(*) as cnt FROM roster GROUP BY league_id').all(),
        db.prepare('SELECT league_id, data FROM wishlists').all(),
        db.prepare('SELECT COUNT(*) as cnt FROM accounts').first(),
        db.prepare('SELECT COUNT(*) as cnt FROM farming_sessions').first(),
        db.prepare('SELECT COUNT(*) as cnt FROM map_tracker_sessions').first().catch(() => ({ cnt: 0 })),
        db.prepare('SELECT id, data FROM feedback').all(),
        db.prepare("SELECT league_id, data FROM league_meta WHERE league_id LIKE 'staff:%' OR league_id LIKE 'league_override:%'").all()
      ]);

      const rosterCountByLeague = new Map<string, number>();
      let totalRosterMembers = 0;
      for (const r of rosterRowsRes?.results || []) {
        const cnt = Number(r.cnt || 0);
        rosterCountByLeague.set(String(r.league_id), cnt);
        totalRosterMembers += cnt;
      }

      const openWishesByLeague = new Map<string, number>();
      let totalOpenWishes = 0;
      let totalFulfilledWishes = 0;
      for (const w of wishRowsRes?.results || []) {
        try {
          const parsed = JSON.parse(w.data);
          if (parsed?.status === 'HAVE') {
            totalFulfilledWishes += 1;
          } else {
            totalOpenWishes += 1;
            const lid = String(w.league_id);
            openWishesByLeague.set(lid, (openWishesByLeague.get(lid) || 0) + 1);
          }
        } catch {}
      }

      const staffByLeague = new Map<string, { hostHandle: string; modCount: number }>();
      const overridesByLeague = new Map<string, any>();
      for (const m of staffMetaRes?.results || []) {
        try {
          const key = String(m.league_id);
          const parsed = JSON.parse(m.data);
          if (key.startsWith('staff:')) {
            const lid = key.replace('staff:', '');
            const mods = Array.isArray(parsed?.staff) ? parsed.staff.filter((s: any) => s.role === 'moderator').length : 0;
            staffByLeague.set(lid, { hostHandle: String(parsed?.hostHandle || 'Leuie'), modCount: mods });
          } else if (key.startsWith('league_override:')) {
            overridesByLeague.set(key.replace('league_override:', ''), parsed);
          }
        } catch {}
      }

      const leagueMap = new Map<string, any>();
      for (const def of DEFAULT_CORE_LEAGUES) {
        leagueMap.set(def.id, { ...def, isCore: true });
      }
      for (const r of customLeaguesRes?.results || []) {
        try {
          const d = JSON.parse(r.data);
          leagueMap.set(String(r.id), {
            id: String(r.id),
            name: String(d?.name || r.id),
            game: d?.game === 'poe2' ? 'poe2' : 'poe1',
            version: String(d?.version || '3.30'),
            status: String(d?.status || 'Active'),
            hostHandle: String(d?.hostHandle || d?.hostName || 'Community Host'),
            isCore: false,
            updatedAt: r.updated_at
          });
        } catch {}
      }

      const leagues = Array.from(leagueMap.values()).map((lg) => {
        const st = staffByLeague.get(lg.id);
        const ov = overridesByLeague.get(lg.id) || {};
        return {
          ...lg,
          hostHandle: ov.hostHandle || st?.hostHandle || lg.hostHandle || 'Leuie',
          status: ov.status || lg.status || 'Active',
          featured: Boolean(ov.featured ?? lg.id === 'poe1-330-umbra'),
          archived: Boolean(ov.archived ?? false),
          moderatorCount: st?.modCount || 0,
          playerCount: rosterCountByLeague.get(lg.id) || 0,
          openWishes: openWishesByLeague.get(lg.id) || 0
        };
      });

      const feedbackList = (feedbackRowsRes?.results || []).map((f: any) => {
        try {
          return JSON.parse(f.data);
        } catch {
          return null;
        }
      }).filter(Boolean);

      return new Response(
        JSON.stringify({
          status: 'ok',
          metrics: {
            totalLeagues: leagues.length,
            activeLeagues: leagues.filter((l) => l.status === 'Active' && !l.archived).length,
            totalAccounts: Number(accountsCountRes?.cnt || 0),
            totalRosterMembers,
            totalOpenWishes,
            totalFulfilledWishes,
            totalFarmingSessions: Number(farmingCountRes?.cnt || 0),
            totalMapSessions: Number(mapCountRes?.cnt || 0),
            totalFeedback: feedbackList.length,
            openFeedback: feedbackList.filter((f: any) => f.status !== 'implemented').length
          },
          leagues
        }),
        { headers: corsHeaders }
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
    }
  }

  // POST /api/admin/leagues/update (Site Super Admin macro league controls)
  if (url.pathname === '/api/admin/leagues/update' && request.method === 'POST') {
    if (!session?.isAdmin) {
      return new Response(JSON.stringify({ error: 'Site Super Admin access required.' }), { status: 403, headers: corsHeaders });
    }
    try {
      await initD1Schema(db);
      const body: any = await request.json();
      const targetId = String(body.leagueId || '').trim();
      if (!targetId) {
        return new Response(JSON.stringify({ error: 'Missing leagueId' }), { status: 400, headers: corsHeaders });
      }
      const prevRow = await db.prepare('SELECT data FROM league_meta WHERE league_id = ?').bind(`league_override:${targetId}`).first();
      const prev = prevRow?.data ? JSON.parse(prevRow.data) : {};
      const next = {
        ...prev,
        ...(body.status !== undefined ? { status: String(body.status) } : {}),
        ...(body.featured !== undefined ? { featured: Boolean(body.featured) } : {}),
        ...(body.archived !== undefined ? { archived: Boolean(body.archived) } : {}),
        ...(body.hostHandle !== undefined && String(body.hostHandle).trim()
          ? { hostHandle: String(body.hostHandle).trim() }
          : {}),
        updatedAtIso: now
      };
      await db
        .prepare('INSERT OR REPLACE INTO league_meta (league_id, data, updated_at) VALUES (?, ?, ?)')
        .bind(`league_override:${targetId}`, JSON.stringify(next), now)
        .run();

      // If hostHandle was reassigned, also update the league's staff record
      if (body.hostHandle && String(body.hostHandle).trim()) {
        const newHost = String(body.hostHandle).trim();
        const staffRec = await getLeagueStaffRecord(db, targetId, now);
        const filtered = staffRec.staff.filter((s: any) => s.role !== 'host');
        const updatedStaff = [
          {
            id: `staff-host-${targetId}`,
            handle: newHost,
            role: 'host',
            title: 'League Host & Admin',
            contact: { inGame: newHost },
            permissions: {
              canManageRoster: true,
              canManageWishlists: true,
              canManageAwards: true,
              canBroadcast: true,
              canEditWebhook: true,
              canEditBannerAndLinks: true
            },
            addedBy: session.handle,
            addedAtIso: now
          },
          ...filtered
        ];
        await db
          .prepare('INSERT OR REPLACE INTO league_meta (league_id, data, updated_at) VALUES (?, ?, ?)')
          .bind(`staff:${targetId}`, JSON.stringify({ leagueId: targetId, hostHandle: newHost, staff: updatedStaff }), now)
          .run();
      }
      return new Response(JSON.stringify({ status: 'ok', override: next }), { headers: corsHeaders });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
    }
  }

  // DELETE /api/admin/feedback/:id (Site Super Admin feedback moderation)
  if (url.pathname.startsWith('/api/admin/feedback/') && request.method === 'DELETE') {
    if (!session?.isAdmin) {
      return new Response(JSON.stringify({ error: 'Site Super Admin access required.' }), { status: 403, headers: corsHeaders });
    }
    try {
      await initD1Schema(db);
      const fbId = decodeURIComponent(url.pathname.replace('/api/admin/feedback/', '').trim());
      if (fbId) {
        await db.prepare('DELETE FROM feedback WHERE id = ?').bind(fbId).run();
      }
      return new Response(JSON.stringify({ status: 'ok', deletedId: fbId }), { headers: corsHeaders });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
    }
  }

  // =========================================================================
  // 3. PER LEAGUE STAFF, MODERATORS (MAX 3) & PER LEAGUE WEBHOOK
  // =========================================================================
  const staffMatch = url.pathname.match(/^\/api\/league\/([^/]+)\/staff$/);
  if (staffMatch) {
    const targetLeagueId = decodeURIComponent(staffMatch[1]);
    await initD1Schema(db);

    if (request.method === 'GET') {
      const rec = await getLeagueStaffRecord(db, targetLeagueId, now);
      return new Response(JSON.stringify({ status: 'ok', ...rec }), { headers: corsHeaders });
    }

    if (request.method === 'POST') {
      const existing = await getLeagueStaffRecord(db, targetLeagueId, now);
      const roleInfo = resolveStaffRoleForSession(session, existing);
      if (!roleInfo.isSuperAdmin && !roleInfo.isLeagueHost) {
        return new Response(
          JSON.stringify({ error: 'Only this league\'s Host Admin or the Site Super Admin can edit league staff and moderators.' }),
          { status: 403, headers: corsHeaders }
        );
      }

      try {
        const body: any = await request.json();
        const incomingStaff: any[] = Array.isArray(body.staff) ? body.staff : [];
        const mods = incomingStaff.filter((s) => s?.role === 'moderator');
        if (mods.length > 3) {
          return new Response(
            JSON.stringify({ error: 'A private league can have a maximum of 3 moderators.' }),
            { status: 400, headers: corsHeaders }
          );
        }

        const hostEntry = incomingStaff.find((s) => s?.role === 'host') || existing.staff.find((s) => s?.role === 'host');
        const cleanHostHandle = String(hostEntry?.handle || existing.hostHandle || 'Leuie').trim();

        const normalizedStaff = [
          {
            id: hostEntry?.id || `staff-host-${targetLeagueId}`,
            handle: cleanHostHandle,
            role: 'host',
            title: String(hostEntry?.title || 'League Host & Admin').trim().slice(0, 60),
            contact: {
              email: String(hostEntry?.contact?.email || '').trim().slice(0, 120),
              discord: String(hostEntry?.contact?.discord || '').trim().slice(0, 120),
              root: String(hostEntry?.contact?.root || '').trim().slice(0, 160),
              inGame: String(hostEntry?.contact?.inGame || '').trim().slice(0, 80)
            },
            permissions: {
              canManageRoster: true,
              canManageWishlists: true,
              canManageAwards: true,
              canBroadcast: true,
              canEditWebhook: true,
              canEditBannerAndLinks: true
            },
            addedBy: hostEntry?.addedBy || cleanHostHandle,
            addedAtIso: hostEntry?.addedAtIso || now
          },
          ...mods.slice(0, 3).map((m, idx) => ({
            id: m?.id || `staff-mod-${Date.now()}-${idx}`,
            handle: String(m?.handle || '').trim().replace(/^@/, ''),
            role: 'moderator',
            title: String(m?.title || 'League Moderator').trim().slice(0, 60),
            contact: {
              email: String(m?.contact?.email || '').trim().slice(0, 120),
              discord: String(m?.contact?.discord || '').trim().slice(0, 120),
              root: String(m?.contact?.root || '').trim().slice(0, 160),
              inGame: String(m?.contact?.inGame || '').trim().slice(0, 80)
            },
            permissions: {
              canManageRoster: Boolean(m?.permissions?.canManageRoster ?? true),
              canManageWishlists: Boolean(m?.permissions?.canManageWishlists ?? true),
              canManageAwards: Boolean(m?.permissions?.canManageAwards ?? true),
              canBroadcast: Boolean(m?.permissions?.canBroadcast ?? true),
              canEditWebhook: Boolean(m?.permissions?.canEditWebhook ?? false),
              canEditBannerAndLinks: Boolean(m?.permissions?.canEditBannerAndLinks ?? false)
            },
            addedBy: m?.addedBy || session?.handle || cleanHostHandle,
            addedAtIso: m?.addedAtIso || now
          }))
        ].filter((s) => s.handle);

        const payload = { leagueId: targetLeagueId, hostHandle: cleanHostHandle, staff: normalizedStaff };
        await db
          .prepare('INSERT OR REPLACE INTO league_meta (league_id, data, updated_at) VALUES (?, ?, ?)')
          .bind(`staff:${targetLeagueId}`, JSON.stringify(payload), now)
          .run();

        return new Response(JSON.stringify({ status: 'ok', ...payload }), { headers: corsHeaders });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
      }
    }
  }

  // Per League Webhook GET / POST (/api/league/:id/webhook)
  const webhookMatch = url.pathname.match(/^\/api\/league\/([^/]+)\/webhook$/);
  if (webhookMatch) {
    const targetLeagueId = decodeURIComponent(webhookMatch[1]);
    await initD1Schema(db);
    const staffRec = await getLeagueStaffRecord(db, targetLeagueId, now);
    const roleInfo = resolveStaffRoleForSession(session, staffRec);
    const canWebhook =
      roleInfo.isSuperAdmin ||
      roleInfo.isLeagueHost ||
      Boolean(roleInfo.isLeagueMod && roleInfo.member?.permissions?.canEditWebhook);

    if (!canWebhook) {
      return new Response(JSON.stringify({ error: 'You do not have permission to manage this league\'s webhook.' }), {
        status: 403,
        headers: corsHeaders
      });
    }

    if (request.method === 'GET') {
      const row = await db.prepare('SELECT data FROM league_meta WHERE league_id = ?').bind(`webhook:${targetLeagueId}`).first();
      if (row?.data) {
        return new Response(JSON.stringify({ status: 'ok', config: JSON.parse(row.data) }), { headers: corsHeaders });
      }
      // Fallback to legacy global webhook only for the original core league
      if (targetLeagueId === 'poe1-330-umbra') {
        const legacy = await db.prepare('SELECT data FROM league_meta WHERE league_id = ?').bind('global:webhook').first();
        if (legacy?.data) {
          return new Response(JSON.stringify({ status: 'ok', config: JSON.parse(legacy.data) }), { headers: corsHeaders });
        }
      }
      return new Response(JSON.stringify({ status: 'ok', config: { url: '', enabled: false, events: [] } }), { headers: corsHeaders });
    }

    if (request.method === 'POST') {
      try {
        const body: any = await request.json();
        const urlStr = String(body.url || '').trim();
        if (urlStr && !isSafeWebhookUrl(urlStr)) {
          return new Response(JSON.stringify({ error: 'Webhook URL must be a valid HTTPS Discord or Root endpoint.' }), {
            status: 400,
            headers: corsHeaders
          });
        }
        const cfg = {
          url: urlStr,
          enabled: Boolean(body.enabled),
          events: Array.isArray(body.events) ? body.events.map(String) : []
        };
        await db
          .prepare('INSERT OR REPLACE INTO league_meta (league_id, data, updated_at) VALUES (?, ?, ?)')
          .bind(`webhook:${targetLeagueId}`, JSON.stringify(cfg), now)
          .run();
        return new Response(JSON.stringify({ status: 'ok', config: cfg }), { headers: corsHeaders });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
      }
    }
  }

  return null;
}
