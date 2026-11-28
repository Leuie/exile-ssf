import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bell,
  X,
  MessageSquare,
  Send,
  CheckCheck,
  Sparkles,
  UserPlus,
  RefreshCw
} from 'lucide-react';
import type { UserAccount } from '../../types';
import {
  fetchInbox,
  markInboxRead,
  sendDirectMessage,
  type DirectMessageItem,
  type InboxPayload
} from '../../services/inboxService';

interface InboxBellDrawerProps {
  userAccount?: UserAccount | null;
  compact?: boolean;
}

function formatShortTime(iso: string): string {
  const ts = Date.parse(iso);
  if (!Number.isFinite(ts)) return '';
  const diffMin = Math.max(0, Math.floor((Date.now() - ts) / 60_000));
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export const InboxBellDrawer: React.FC<InboxBellDrawerProps> = ({
  userAccount,
  compact = false
}) => {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'notifications' | 'messages' | 'compose'>('notifications');
  const [inbox, setInbox] = useState<InboxPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [activePeer, setActivePeer] = useState<string>('');
  const [replyText, setReplyText] = useState('');

  // Compose / Invite / Nudge state
  const [toHandle, setToHandle] = useState('');
  const [composeKind, setComposeKind] = useState<'dm' | 'league_invite' | 'alumni_nudge'>('dm');
  const [composeBody, setComposeBody] = useState('');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const myHandle = (userAccount?.displayName || '').trim();

  const refresh = useCallback(async () => {
    if (!myHandle) return;
    setLoading(true);
    const data = await fetchInbox();
    if (data) setInbox(data);
    setLoading(false);
  }, [myHandle]);

  // Poll every 45s while tab is visible (zero cost when signed out or hidden)
  useEffect(() => {
    if (!myHandle) return;
    refresh();
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void refresh();
      }
    }, 45_000);
    return () => window.clearInterval(timer);
  }, [myHandle, refresh]);

  useEffect(() => {
    if (!open) return;
    void refresh();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, refresh]);

  const threads = useMemo(() => {
    const map = new Map<string, { peer: string; messages: DirectMessageItem[]; unread: number }>();
    const myLow = myHandle.toLowerCase();
    for (const m of inbox?.messages || []) {
      const peer = m.senderHandle.toLowerCase() === myLow ? m.recipientHandle : m.senderHandle;
      const key = peer.toLowerCase();
      const cur = map.get(key) || { peer, messages: [], unread: 0 };
      cur.messages.push(m);
      if (!m.readAt && m.recipientHandle.toLowerCase() === myLow) cur.unread += 1;
      map.set(key, cur);
    }
    return Array.from(map.values()).map((t) => ({
      ...t,
      messages: [...t.messages].reverse()
    }));
  }, [inbox?.messages, myHandle]);

  const activeThread = useMemo(
    () => threads.find((t) => t.peer.toLowerCase() === activePeer.toLowerCase()) || threads[0] || null,
    [threads, activePeer]
  );

  if (!myHandle) return null;

  const totalUnread = inbox?.totalUnread || 0;

  const handleMarkAllRead = async () => {
    await markInboxRead('all');
    await refresh();
  };

  const handleSendQuickReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThread || !replyText.trim() || sending) return;
    setSending(true);
    const res = await sendDirectMessage({ toHandle: activeThread.peer, body: replyText.trim(), kind: 'dm' });
    setSending(false);
    if (res.ok) {
      setReplyText('');
      await refresh();
    } else {
      setFeedback({ ok: false, text: res.error || 'Could not send message.' });
    }
  };

  const handleSendCompose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toHandle.trim() || !composeBody.trim() || sending) return;
    setSending(true);
    setFeedback(null);
    const res = await sendDirectMessage({
      toHandle: toHandle.trim(),
      body: composeBody.trim(),
      kind: composeKind,
      leagueId: composeKind === 'league_invite' ? 'poe1-330-umbra' : undefined
    });
    setSending(false);
    if (res.ok) {
      setFeedback({ ok: true, text: `Sent to @${toHandle.replace(/^@/, '').trim()}!` });
      setComposeBody('');
      setActivePeer(toHandle.replace(/^@/, '').trim());
      await refresh();
    } else {
      setFeedback({ ok: false, text: res.error || 'Failed to send.' });
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`relative inline-flex items-center justify-center gap-1.5 rounded-xl border transition-colors cursor-pointer ${
          compact
            ? 'p-2 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
            : 'w-full px-3 py-2 bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-200 text-xs font-semibold justify-between'
        }`}
        aria-label={`Open notifications and messages (${totalUnread} unread)`}
        title="Notifications & Squad Messages"
      >
        <span className="inline-flex items-center gap-2">
          <Bell className={`w-4 h-4 ${totalUnread > 0 ? 'text-amber-400' : 'text-indigo-400'}`} aria-hidden="true" />
          {!compact && <span>Inbox &amp; Alerts</span>}
        </span>
        {totalUnread > 0 && (
          <span
            className={`${
              compact
                ? 'absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1'
                : 'px-1.5 py-0.5'
            } rounded-full bg-amber-500 text-slate-950 font-mono font-black text-[10px] inline-flex items-center justify-center`}
          >
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Notifications and Messages"
        >
          <div
            className="w-full max-w-md h-[100dvh] bg-[#0b101b] border-l border-slate-800 shadow-2xl flex flex-col pt-[max(1rem,env(safe-area-inset-top,0px))] pb-[max(1rem,env(safe-area-inset-bottom,0px))] overscroll-contain"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-4 pb-3 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold text-white">Notifications &amp; Messages</h2>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => void refresh()}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
                  aria-label="Refresh inbox"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
                {totalUnread > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-mono text-emerald-300 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCheck className="w-3 h-3" />
                    <span>Mark Read</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                  aria-label="Close notifications panel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="px-4 py-2.5 border-b border-slate-800/80 grid grid-cols-3 gap-1.5 text-xs font-bold shrink-0">
              <button
                type="button"
                onClick={() => setTab('notifications')}
                className={`py-1.5 rounded-lg border cursor-pointer ${
                  tab === 'notifications'
                    ? 'bg-indigo-600/30 border-indigo-400/60 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                Alerts ({inbox?.unreadNotifications || 0})
              </button>
              <button
                type="button"
                onClick={() => setTab('messages')}
                className={`py-1.5 rounded-lg border cursor-pointer ${
                  tab === 'messages'
                    ? 'bg-indigo-600/30 border-indigo-400/60 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                Messages ({inbox?.unreadMessages || 0})
              </button>
              <button
                type="button"
                onClick={() => setTab('compose')}
                className={`py-1.5 rounded-lg border cursor-pointer inline-flex items-center justify-center gap-1 ${
                  tab === 'compose'
                    ? 'bg-amber-500/20 border-amber-400/60 text-amber-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
              {tab === 'notifications' && (
                (inbox?.notifications || []).length === 0 ? (
                  <div className="text-center py-10 space-y-2 text-xs text-slate-400">
                    <Sparkles className="w-6 h-6 text-slate-600 mx-auto" />
                    <p>No notifications yet. Alumni nudges, private league invites, and wishlist alerts appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(inbox?.notifications || []).map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 rounded-xl border space-y-1 text-xs ${
                          n.readAt
                            ? 'bg-slate-950/60 border-slate-800/80 text-slate-400'
                            : 'bg-indigo-950/30 border-indigo-500/45 text-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-white">{n.title}</span>
                          <span className="text-[10px] font-mono text-slate-500 shrink-0">
                            {formatShortTime(n.createdAt)}
                          </span>
                        </div>
                        {n.body && <p className="text-slate-300 leading-relaxed">{n.body}</p>}
                        {n.linkPath && (
                          <a
                            href={n.linkPath}
                            className="inline-block text-[11px] font-mono text-cyan-300 hover:underline pt-0.5"
                          >
                            Open →
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )
              )}

              {tab === 'messages' && (
                threads.length === 0 ? (
                  <div className="text-center py-10 space-y-2 text-xs text-slate-400">
                    <MessageSquare className="w-6 h-6 text-slate-600 mx-auto" />
                    <p>No messages yet. Click <strong>Send</strong> to whisper a squadmate or invite them to a league.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-1.5">
                      {threads.map((t) => (
                        <button
                          key={t.peer}
                          type="button"
                          onClick={async () => {
                            setActivePeer(t.peer);
                            if (t.unread > 0) {
                              await markInboxRead('thread', { peerHandle: t.peer });
                              await refresh();
                            }
                          }}
                          className={`px-2.5 py-1 rounded-lg border text-xs font-bold cursor-pointer ${
                            activeThread?.peer === t.peer
                              ? 'bg-indigo-600/30 border-indigo-400 text-white'
                              : 'bg-slate-950 border-slate-800 text-slate-400'
                          }`}
                        >
                          @{t.peer} {t.unread > 0 ? `(${t.unread})` : ''}
                        </button>
                      ))}
                    </div>

                    {activeThread && (
                      <div className="space-y-2">
                        <div className="space-y-2 max-h-[45dvh] overflow-y-auto pr-1">
                          {activeThread.messages.map((m) => {
                            const isMe = m.senderHandle.toLowerCase() === myHandle.toLowerCase();
                            return (
                              <div
                                key={m.id}
                                className={`p-2.5 rounded-xl border text-xs space-y-1 ${
                                  isMe
                                    ? 'bg-indigo-600/20 border-indigo-500/40 ml-6'
                                    : 'bg-slate-950 border-slate-800 mr-6'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-slate-400">
                                  <span className="font-bold text-slate-200">@{m.senderHandle}</span>
                                  <span>{formatShortTime(m.createdAt)}</span>
                                </div>
                                <p className="text-slate-200 leading-relaxed">{m.body}</p>
                              </div>
                            );
                          })}
                        </div>

                        <form onSubmit={handleSendQuickReply} className="flex gap-1.5 pt-1">
                          <input
                            type="text"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder={`Reply to @${activeThread.peer}...`}
                            className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-400"
                          />
                          <button
                            type="submit"
                            disabled={sending || !replyText.trim()}
                            className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1"
                            aria-label="Send reply"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                )
              )}

              {tab === 'compose' && (
                <form onSubmit={handleSendCompose} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                      Recipient (@Handle)
                    </label>
                    <input
                      type="text"
                      value={toHandle}
                      onChange={(e) => setToHandle(e.target.value)}
                      placeholder="e.g. SquadmateName"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                      Message Type
                    </label>
                    <select
                      value={composeKind}
                      onChange={(e) => setComposeKind(e.target.value as 'dm' | 'league_invite' | 'alumni_nudge')}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                    >
                      <option value="dm">Quick Whisper / Message</option>
                      <option value="league_invite">Private League Invite</option>
                      <option value="alumni_nudge">Alumni Nudge</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                      Message
                    </label>
                    <textarea
                      rows={4}
                      value={composeBody}
                      onChange={(e) => setComposeBody(e.target.value)}
                      placeholder="Write a quick message, league invite note, or trade whisper..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                  {feedback && (
                    <div
                      className={`p-2.5 rounded-xl border text-xs ${
                        feedback.ok
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                          : 'bg-rose-500/15 border-rose-500/40 text-rose-200'
                      }`}
                    >
                      {feedback.text}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={sending || !toHandle.trim() || !composeBody.trim()}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-45 text-white font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>{sending ? 'Sending...' : 'Send Message'}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
