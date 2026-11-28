// Client service for In-App Notification Bell & Light Messaging (/api/inbox/*)

export interface SiteNotificationItem {
  id: string;
  senderHandle: string;
  kind: string;
  title: string;
  body: string;
  linkPath?: string;
  readAt: string | null;
  createdAt: string;
}

export interface DirectMessageItem {
  id: string;
  senderHandle: string;
  recipientHandle: string;
  kind: string;
  body: string;
  leagueId?: string;
  readAt: string | null;
  createdAt: string;
}

export interface InboxPayload {
  handle: string;
  notifications: SiteNotificationItem[];
  messages: DirectMessageItem[];
  unreadNotifications: number;
  unreadMessages: number;
  totalUnread: number;
}

export async function fetchInbox(): Promise<InboxPayload | null> {
  try {
    const res = await fetch(`/api/inbox?_t=${Date.now()}`, {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store'
    });
    if (!res.ok) return null;
    const json: any = await res.json();
    if (json?.status !== 'ok') return null;
    return {
      handle: String(json.handle || ''),
      notifications: Array.isArray(json.notifications) ? json.notifications : [],
      messages: Array.isArray(json.messages) ? json.messages : [],
      unreadNotifications: Number(json.unreadNotifications || 0),
      unreadMessages: Number(json.unreadMessages || 0),
      totalUnread: Number(json.totalUnread || 0)
    };
  } catch {
    return null;
  }
}

export async function sendDirectMessage(payload: {
  toHandle: string;
  body: string;
  kind?: 'dm' | 'league_invite' | 'alumni_nudge' | 'whisper';
  leagueId?: string;
}): Promise<{ ok: boolean; error?: string; message?: DirectMessageItem }> {
  try {
    const res = await fetch('/api/inbox/message', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: json?.error || `HTTP ${res.status}` };
    return { ok: true, message: json.message };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Network error' };
  }
}

export async function sendSiteNotification(payload: {
  toHandle: string;
  kind: 'alumni_nudge' | 'league_invite' | 'wishlist_match' | 'item_loan' | 'whisper' | 'system';
  title: string;
  body: string;
  linkPath?: string;
}): Promise<boolean> {
  try {
    const res = await fetch('/api/inbox/notify', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function markInboxRead(
  scope: 'all' | 'notification' | 'thread' = 'all',
  opts?: { id?: string; peerHandle?: string }
): Promise<boolean> {
  try {
    const res = await fetch('/api/inbox/read', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scope, ...opts })
    });
    return res.ok;
  } catch {
    return false;
  }
}
