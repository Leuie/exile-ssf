import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Bell, CheckCircle2, Gift, Heart, MessageCircle, Star, Sparkles } from 'lucide-react';
import type {
  LookingForItem,
  FreeStashDrop,
  LeagueFeedEvent,
  PlayerVouch,
  UserAccount
} from '../../../types';

interface NotificationBellProps {
  userAccount?: UserAccount | null;
  lookingForItems: LookingForItem[];
  stashDrops: FreeStashDrop[];
  activityFeed: LeagueFeedEvent[];
  vouches: PlayerVouch[];
  onConfirmReceipt: (item: LookingForItem) => void;
  onNavigateTab: (tab: 'feed' | 'looking_for' | 'bounties') => void;
  onOpenProfile?: (handle: string) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  userAccount,
  lookingForItems,
  stashDrops,
  activityFeed,
  vouches,
  onConfirmReceipt,
  onNavigateTab,
  onOpenProfile
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Record<string, boolean>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const myLower = userAccount?.displayName?.trim().toLowerCase() || '';
  const myCharLower = userAccount?.characterName?.trim().toLowerCase() || '';

  const isMe = (val?: string) => {
    if (!val || (!myLower && !myCharLower)) return false;
    const clean = val.trim().replace(/^@/, '').toLowerCase();
    return (Boolean(myLower) && clean === myLower) || (Boolean(myCharLower) && clean === myCharLower);
  };

  // 1. Items I wishlisted that someone else found, awaiting my receipt confirmation (+5 Honor bonus!)
  const pendingReceipts = useMemo(() => {
    if (!userAccount) return [];
    return lookingForItems.filter((it) => {
      if (it.status !== 'HAVE') return false;
      if (it.receiptConfirmed || it.bountyStatus === 'PAID') return false;
      if (!isMe(it.displayName) && !isMe(it.characterName)) return false;
      const fb = (it.fulfilledBy || '').trim().replace(/^@/, '').toLowerCase();
      if (!fb || fb === 'self found' || isMe(fb)) return false;
      return true;
    });
  }, [lookingForItems, userAccount, myLower, myCharLower]);

  // 2. Other personal alerts (stash claims, vouches, feed replies/mentions)
  const otherAlerts = useMemo(() => {
    if (!userAccount) return [];
    const list: {
      id: string;
      kind: 'stash' | 'vouch' | 'comment' | 'like' | 'mention';
      actor: string;
      text: string;
      timestampIso: string;
      targetTab: 'feed' | 'looking_for' | 'bounties';
    }[] = [];

    for (const drop of stashDrops) {
      if (isMe(drop.donorDisplayName) && drop.claimedBy && !isMe(drop.claimedBy)) {
        list.push({
          id: `notif_stash_${drop.id}`,
          kind: 'stash',
          actor: drop.claimedBy,
          text: `claimed your Free Stash drop "${drop.itemName}"`,
          timestampIso: drop.claimedAtIso || drop.createdAtIso,
          targetTab: 'looking_for'
        });
      }
    }

    for (const v of vouches) {
      if (isMe(v.providerDisplayName) && !isMe(v.voucherDisplayName)) {
        list.push({
          id: `notif_vouch_${v.id}`,
          kind: 'vouch',
          actor: v.voucherDisplayName,
          text: `left you a Verified Vouch: "${v.comment || v.category}"`,
          timestampIso: v.createdAtIso,
          targetTab: 'bounties'
        });
      }
    }

    for (const ev of activityFeed.slice(0, 40)) {
      const iAmActor = isMe(ev.actorHandle);
      const iAmTarget = isMe(ev.targetHandle);

      if (iAmTarget && !iAmActor) {
        list.push({
          id: `notif_feed_${ev.id}`,
          kind: 'mention',
          actor: ev.actorHandle,
          text: ev.title,
          timestampIso: ev.createdAtIso,
          targetTab: 'feed'
        });
      }

      if (iAmActor && Array.isArray(ev.comments)) {
        for (const c of ev.comments) {
          if (!isMe(c.authorHandle)) {
            list.push({
              id: `notif_cmt_${c.id}`,
              kind: 'comment',
              actor: c.authorHandle,
              text: `replied on your post: "${c.text}"`,
              timestampIso: c.createdAtIso,
              targetTab: 'feed'
            });
          }
        }
      }

      if (iAmActor && Array.isArray(ev.cheers) && ev.cheers.length > 0) {
        const nonSelfCheers = ev.cheers.filter((ch) => !isMe(ch));
        if (nonSelfCheers.length > 0) {
          list.push({
            id: `notif_like_${ev.id}_${nonSelfCheers.length}`,
            kind: 'like',
            actor: nonSelfCheers[nonSelfCheers.length - 1],
            text: `liked your Feed update "${ev.title}"`,
            timestampIso: ev.createdAtIso,
            targetTab: 'feed'
          });
        }
      }
    }

    return list
      .sort((a, b) => (Date.parse(b.timestampIso || '') || 0) - (Date.parse(a.timestampIso || '') || 0))
      .slice(0, 15);
  }, [stashDrops, vouches, activityFeed, userAccount, myLower, myCharLower]);

  const unreadOtherCount = otherAlerts.filter((a) => !dismissedIds[a.id]).length;
  const totalBadgeCount = pendingReceipts.length + unreadOtherCount;

  if (!userAccount) return null;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={`relative p-1.5 rounded-lg border transition-colors cursor-pointer ${
          totalBadgeCount > 0
            ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
            : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
        }`}
        title="Personal Notifications & Pending Delivery Confirmations"
      >
        <Bell className="w-4 h-4" />
        {totalBadgeCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-slate-950 font-mono text-[10px] font-black flex items-center justify-center shadow">
            {totalBadgeCount > 9 ? '9+' : totalBadgeCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-700 bg-[#0d1016] shadow-2xl z-50 overflow-hidden">
          <div className="px-4 py-3 bg-[#121620] border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-white uppercase tracking-wider">
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span>Notifications ({totalBadgeCount})</span>
            </div>
            {unreadOtherCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  const next = { ...dismissedIds };
                  otherAlerts.forEach((a) => (next[a.id] = true));
                  setDismissedIds(next);
                }}
                className="text-[11px] font-mono text-indigo-300 hover:text-white cursor-pointer"
              >
                Mark Read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-slate-800/70">
            {/* Priority Section: Pending Delivery Confirmations */}
            {pendingReceipts.map((item) => {
              const finderClean = (item.fulfilledBy || '').replace(/^@/, '').trim();
              return (
                <div key={item.id} className="p-3.5 bg-amber-950/20 space-y-2">
                  <div className="flex items-start gap-2.5 text-xs">
                    <Gift className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="text-white font-semibold leading-snug">
                        <button
                          type="button"
                          onClick={() => {
                            setIsOpen(false);
                            onOpenProfile?.(finderClean);
                          }}
                          className="text-amber-300 font-bold hover:underline cursor-pointer"
                        >
                          @{finderClean}
                        </button>{' '}
                        found <strong>{item.itemName}</strong> for you!
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Confirm delivery to award an extra +5 Honor Points (+10 total).
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onConfirmReceipt(item);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-black inline-flex items-center gap-1 cursor-pointer shadow"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Confirm Receipt (+5 Honor)</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Other Personal Alerts */}
            {otherAlerts.map((alert) => {
              const isRead = Boolean(dismissedIds[alert.id]);
              return (
                <div
                  key={alert.id}
                  onClick={() => {
                    setDismissedIds((prev) => ({ ...prev, [alert.id]: true }));
                    setIsOpen(false);
                    onNavigateTab(alert.targetTab);
                  }}
                  className={`p-3.5 flex items-start gap-2.5 text-xs cursor-pointer transition-colors hover:bg-slate-900/90 ${
                    isRead ? 'opacity-60' : 'bg-indigo-950/10'
                  }`}
                >
                  {alert.kind === 'vouch' ? (
                    <Star className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  ) : alert.kind === 'like' ? (
                    <Heart className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  ) : alert.kind === 'comment' ? (
                    <MessageCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-slate-200 leading-snug">
                      <span className="font-bold text-amber-300">@{alert.actor}</span> {alert.text}
                    </div>
                    {alert.timestampIso && (
                      <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                        {new Date(alert.timestampIso).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {pendingReceipts.length === 0 && otherAlerts.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-500 italic">
                All caught up! When a squadmate finds your item, claims a stash drop, vouches for you, or replies on the Feed, it will appear right here.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
