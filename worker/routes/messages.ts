// Light Site Messaging & In-App Notification Center API (/api/inbox/*)
// Self-bootstrapping D1 tables: site_notifications & direct_messages

export interface InboxRouteDeps {
  request: Request;
  url: URL;
  db: any;
  now: string;
  session: { handle: string; isAdmin: boolean } | null;
  corsHeaders: Record<string, string>;
}

let inboxTablesReady = false;

async function ensureInboxTables(db: any): Promise<void> {
  if (inboxTablesReady) return;
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS site_notifications (
        id TEXT PRIMARY KEY,
        recipient_lower TEXT NOT NULL,
        sender_handle TEXT NOT NULL,
        kind TEXT NOT NULL,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        link_path TEXT,
        read_at TEXT,
        created_at TEXT NOT NULL
      )`
    )
    .run();
  await db
    .prepare(
      `CREATE INDEX IF NOT EXISTS idx_site_notifications_recipient ON site_notifications (recipient_lower, created_at DESC)`
    )
    .run();
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS direct_messages (
        id TEXT PRIMARY KEY,
        sender_lower TEXT NOT NULL,
        sender_handle TEXT NOT NULL,
        recipient_lower TEXT NOT NULL,
        recipient_handle TEXT NOT NULL,
        kind TEXT NOT NULL DEFAULT 'dm',
        body TEXT NOT NULL,
        league_id TEXT,
        read_at TEXT,
        created_at TEXT NOT NULL
      )`
    )
    .run();
  await db
    .prepare(
      `CREATE INDEX IF NOT EXISTS idx_direct_messages_participants ON direct_messages (recipient_lower, sender_lower, created_at DESC)`
    )
    .run();
  inboxTablesReady = true;
}

function cleanHandle(raw: unknown): string {
  return String(raw || '').trim().replace(/^@+/, '').slice(0, 48);
}

export async function handleInboxRoutes(deps: InboxRouteDeps): Promise<Response | null> {
  const { request, url, db, now, session, corsHeaders } = deps;

  if (!url.pathname.startsWith('/api/inbox')) return null;

  if (!session?.handle) {
    return new Response(JSON.stringify({ error: 'Sign in required to access notifications and messages.' }), {
      status: 401,
      headers: corsHeaders
    });
  }

  const myHandle = cleanHandle(session.handle);
  const myLower = myHandle.toLowerCase();

  try {
    await ensureInboxTables(db);

    // GET /api/inbox -> fetch recent notifications + direct messages + unread counts
    if (url.pathname === '/api/inbox' && request.method === 'GET') {
      const [notifRows, msgRows] = await Promise.all([
        db
          .prepare(
            `SELECT id, sender_handle, kind, title, body, link_path, read_at, created_at
             FROM site_notifications
             WHERE recipient_lower = ?
             ORDER BY created_at DESC
             LIMIT 40`
          )
          .bind(myLower)
          .all(),
        db
          .prepare(
            `SELECT id, sender_handle, recipient_handle, kind, body, league_id, read_at, created_at
             FROM direct_messages
             WHERE recipient_lower = ? OR sender_lower = ?
             ORDER BY created_at DESC
             LIMIT 80`
          )
          .bind(myLower, myLower)
          .all()
      ]);

      const notifications = (notifRows.results || []).map((r: any) => ({
        id: String(r.id),
        senderHandle: String(r.sender_handle || 'Exile SSF'),
        kind: String(r.kind || 'system'),
        title: String(r.title || ''),
        body: String(r.body || ''),
        linkPath: r.link_path ? String(r.link_path) : undefined,
        readAt: r.read_at ? String(r.read_at) : null,
        createdAt: String(r.created_at || '')
      }));

      const messages = (msgRows.results || []).map((r: any) => ({
        id: String(r.id),
        senderHandle: String(r.sender_handle || ''),
        recipientHandle: String(r.recipient_handle || ''),
        kind: String(r.kind || 'dm'),
        body: String(r.body || ''),
        leagueId: r.league_id ? String(r.league_id) : undefined,
        readAt: r.read_at ? String(r.read_at) : null,
        createdAt: String(r.created_at || '')
      }));

      const unreadNotifications = notifications.filter((n: any) => !n.readAt).length;
      const unreadMessages = messages.filter(
        (m: any) => !m.readAt && m.recipientHandle.toLowerCase() === myLower
      ).length;

      return new Response(
        JSON.stringify({
          status: 'ok',
          handle: myHandle,
          notifications,
          messages,
          unreadNotifications,
          unreadMessages,
          totalUnread: unreadNotifications + unreadMessages
        }),
        { headers: corsHeaders }
      );
    }

    // POST /api/inbox/notify -> create a notification (alumni nudge, league invite, wishlist/loan ping)
    if (url.pathname === '/api/inbox/notify' && request.method === 'POST') {
      const body: any = await request.json();
      const recipient = cleanHandle(body.toHandle);
      const kind = String(body.kind || 'system').trim().slice(0, 32);
      const title = String(body.title || '').trim().slice(0, 120);
      const text = String(body.body || '').trim().slice(0, 500);
      const linkPath = body.linkPath ? String(body.linkPath).trim().slice(0, 180) : null;

      if (!recipient || !title) {
        return new Response(JSON.stringify({ error: 'Recipient handle and title are required.' }), {
          status: 400,
          headers: corsHeaders
        });
      }

      const id = `ntf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      await db
        .prepare(
          `INSERT INTO site_notifications (id, recipient_lower, sender_handle, kind, title, body, link_path, read_at, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?)`
        )
        .bind(id, recipient.toLowerCase(), myHandle, kind, title, text, linkPath, now)
        .run();

      return new Response(JSON.stringify({ status: 'ok', id }), { headers: corsHeaders });
    }

    // POST /api/inbox/message -> send a direct message / whisper / league invite + notify recipient
    if (url.pathname === '/api/inbox/message' && request.method === 'POST') {
      const body: any = await request.json();
      const recipient = cleanHandle(body.toHandle);
      const text = String(body.body || '').trim().slice(0, 800);
      const kind = String(body.kind || 'dm').trim().slice(0, 32);
      const leagueId = body.leagueId ? String(body.leagueId).trim().slice(0, 64) : null;

      if (!recipient || !text) {
        return new Response(JSON.stringify({ error: 'Recipient handle and message text are required.' }), {
          status: 400,
          headers: corsHeaders
        });
      }
      if (recipient.toLowerCase() === myLower) {
        return new Response(JSON.stringify({ error: 'You cannot send a direct message to yourself.' }), {
          status: 400,
          headers: corsHeaders
        });
      }

      const id = `dm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      await db
        .prepare(
          `INSERT INTO direct_messages (id, sender_lower, sender_handle, recipient_lower, recipient_handle, kind, body, league_id, read_at, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)`
        )
        .bind(id, myLower, myHandle, recipient.toLowerCase(), recipient, kind, text, leagueId, now)
        .run();

      // Also drop a lightweight notification for league invites / alumni nudges
      if (kind === 'league_invite' || kind === 'alumni_nudge') {
        const ntfId = `ntf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const ntfTitle =
          kind === 'league_invite'
            ? `Private League Invite from @${myHandle}`
            : `Alumni Nudge from @${myHandle}`;
        const linkPath = leagueId ? `/league/${encodeURIComponent(leagueId)}` : '/privateleaguehub';
        await db
          .prepare(
            `INSERT INTO site_notifications (id, recipient_lower, sender_handle, kind, title, body, link_path, read_at, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?)`
          )
          .bind(ntfId, recipient.toLowerCase(), myHandle, kind, ntfTitle, text.slice(0, 240), linkPath, now)
          .run();
      }

      return new Response(
        JSON.stringify({
          status: 'ok',
          message: {
            id,
            senderHandle: myHandle,
            recipientHandle: recipient,
            kind,
            body: text,
            leagueId: leagueId || undefined,
            readAt: null,
            createdAt: now
          }
        }),
        { headers: corsHeaders }
      );
    }

    // POST /api/inbox/read -> mark specific id or all notifications/messages as read
    if (url.pathname === '/api/inbox/read' && request.method === 'POST') {
      const body: any = await request.json().catch(() => ({}));
      const scope = String(body.scope || 'all');
      const targetId = body.id ? String(body.id) : '';
      const peerHandle = body.peerHandle ? cleanHandle(body.peerHandle).toLowerCase() : '';

      if (scope === 'notification' && targetId) {
        await db
          .prepare('UPDATE site_notifications SET read_at = ? WHERE id = ? AND recipient_lower = ?')
          .bind(now, targetId, myLower)
          .run();
      } else if (scope === 'thread' && peerHandle) {
        await db
          .prepare('UPDATE direct_messages SET read_at = ? WHERE recipient_lower = ? AND sender_lower = ? AND read_at IS NULL')
          .bind(now, myLower, peerHandle)
          .run();
      } else {
        await Promise.all([
          db
            .prepare('UPDATE site_notifications SET read_at = ? WHERE recipient_lower = ? AND read_at IS NULL')
            .bind(now, myLower)
            .run(),
          db
            .prepare('UPDATE direct_messages SET read_at = ? WHERE recipient_lower = ? AND read_at IS NULL')
            .bind(now, myLower)
            .run()
        ]);
      }

      return new Response(JSON.stringify({ status: 'ok', readAt: now }), { headers: corsHeaders });
    }

    return null;
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Inbox request failed.' }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
