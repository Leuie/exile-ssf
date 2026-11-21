import React, { useMemo, useState } from 'react';
import {
  Activity,
  Award,
  BookOpen,
  Coins,
  Flame,
  Gift,
  Sparkles,
  Trophy,
  UserPlus,
  Users,
  ArrowUpRight,
  Heart,
  MessageCircle,
  Send,
  Share2,
  AtSign
} from 'lucide-react';
import type {
  LeagueFeedEvent,
  LeagueFeedEventType,
  LookingForItem,
  LeagueRosterMember,
  CommunityGuide,
  FreeStashDrop,
  BossRotaListing,
  LeagueFirstMilestone,
  UserAccount
} from '../../../types';

export interface FeedTabProps {
  activeSessionId: string;
  leagueName: string;
  activityFeed: LeagueFeedEvent[];
  lookingForItems: LookingForItem[];
  roster: LeagueRosterMember[];
  guides: CommunityGuide[];
  stashDrops: FreeStashDrop[];
  bossRotas: BossRotaListing[];
  leagueFirsts: LeagueFirstMilestone[];
  userAccount?: UserAccount | null;
  lastSeenFeedAt?: string | null;
  onCheerEvent: (event: LeagueFeedEvent) => void;
  onCommentEvent: (event: LeagueFeedEvent, commentText: string) => void;
  onCopyFeedLink: () => void;
  onOpenProfile?: (handle: string) => void;
  onNavigateTab: (
    tab: 'overview' | 'feed' | 'looking_for' | 'bounties' | 'roster' | 'guides' | 'cheatsheets' | 'new_player' | 'alumni'
  ) => void;
}

type FilterKey = 'all' | 'mentions' | 'fulfillments' | 'bounties' | 'wishlists' | 'roster' | 'builds' | 'achievements';

function formatRelativeTime(iso?: string): string {
  if (!iso) return 'Recent';
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return 'Recent';
  const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  const days = Math.floor(diffSec / 86400);
  if (days < 14) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

function getEventBadge(type: LeagueFeedEventType): {
  label: string;
  icon: React.FC<{ className?: string }>;
  badgeClass: string;
  borderClass: string;
} {
  switch (type) {
    case 'item_fulfilled':
      return {
        label: 'Fulfilled',
        icon: Gift,
        badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        borderClass: 'border-emerald-500/25'
      };
    case 'bounty_listed':
      return {
        label: 'Bounty',
        icon: Coins,
        badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        borderClass: 'border-amber-500/25'
      };
    case 'wishlist_added':
      return {
        label: 'Wishlist',
        icon: Sparkles,
        badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
        borderClass: 'border-slate-800'
      };
    case 'roster_join':
      return {
        label: 'Joined League',
        icon: UserPlus,
        badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
        borderClass: 'border-sky-500/25'
      };
    case 'character_posted':
      return {
        label: 'Character',
        icon: Users,
        badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
        borderClass: 'border-slate-800'
      };
    case 'build_published':
      return {
        label: 'Build Guide',
        icon: BookOpen,
        badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        borderClass: 'border-rose-500/25'
      };
    case 'achievement_earned':
      return {
        label: 'Achievement',
        icon: Award,
        badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
        borderClass: 'border-purple-500/35'
      };
    case 'stash_drop':
      return {
        label: 'Free Stash',
        icon: Gift,
        badgeClass: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
        borderClass: 'border-teal-500/25'
      };
    case 'boss_rota':
      return {
        label: 'Boss Rota',
        icon: Flame,
        badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
        borderClass: 'border-orange-500/25'
      };
    case 'league_first':
      return {
        label: 'League First',
        icon: Trophy,
        badgeClass: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
        borderClass: 'border-yellow-500/35'
      };
  }
}

export const FeedTab: React.FC<FeedTabProps> = ({
  activeSessionId,
  leagueName,
  activityFeed,
  lookingForItems,
  roster,
  guides,
  stashDrops,
  bossRotas,
  leagueFirsts,
  userAccount,
  lastSeenFeedAt,
  onCheerEvent,
  onCommentEvent,
  onCopyFeedLink,
  onOpenProfile,
  onNavigateTab
}) => {
  const [filter, setFilter] = useState<FilterKey>('all');
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [draftComments, setDraftComments] = useState<Record<string, string>>({});

  // Merge live D1 activity_feed events with synthesized historical league activity so the wall is rich immediately
  const combinedFeed = useMemo(() => {
    const byId = new Map<string, LeagueFeedEvent>();

    for (const ev of activityFeed) {
      if (ev?.id) byId.set(ev.id, ev);
    }

    // Synthesize fulfilled items
    for (const item of lookingForItems) {
      if (item.status === 'HAVE' && item.fulfilledBy && item.fulfilledBy.toLowerCase() !== 'self found') {
        const cleanFinder = item.fulfilledBy.replace(/^@/, '').trim();
        const requester = item.displayName || item.characterName;
        const synthId = `synth_fulfill_${item.id}`;
        if (!byId.has(synthId)) {
          byId.set(synthId, {
            id: synthId,
            leagueId: activeSessionId,
            type: 'item_fulfilled',
            actorHandle: cleanFinder,
            targetHandle: requester,
            title: `Found "${item.itemName}" for @${requester}`,
            detail: item.bountyOffer
              ? `Bounty: ${item.bountyOffer}${item.receiptConfirmed || item.bountyStatus === 'PAID' ? ' • Delivery Confirmed (+10 Honor)' : ' • +5 Honor Points'}`
              : item.receiptConfirmed
              ? 'Delivery Confirmed (+10 Honor Points total)'
              : '+5 Honor Points earned',
            targetTab: 'looking_for',
            createdAtIso: item.fulfilledAtIso || '2026-11-15T12:00:00Z'
          });
        }
      } else if (item.status !== 'HAVE' && item.bountyOffer && item.bountyOffer.trim()) {
        const requester = item.displayName || item.characterName;
        const synthId = `synth_bounty_${item.id}`;
        if (!byId.has(synthId)) {
          byId.set(synthId, {
            id: synthId,
            leagueId: activeSessionId,
            type: 'bounty_listed',
            actorHandle: requester,
            actorCharacter: item.characterName,
            title: `Posted a bounty for "${item.itemName}"`,
            detail: `Reward: ${item.bountyOffer} • ${item.category}`,
            targetTab: 'bounties',
            createdAtIso: '2026-11-14T12:00:00Z'
          });
        }
      }
    }

    // Synthesize free stash drops
    for (const drop of stashDrops) {
      const synthId = `synth_stash_${drop.id}`;
      if (!byId.has(synthId)) {
        byId.set(synthId, {
          id: synthId,
          leagueId: activeSessionId,
          type: 'stash_drop',
          actorHandle: drop.donorDisplayName,
          actorCharacter: drop.donorCharacterName,
          title: `Shared "${drop.itemName}" in the Free Stash Feed`,
          detail: drop.claimedBy ? `Claimed by @${drop.claimedBy}` : `${drop.rarity} • Available for squad alts`,
          targetTab: 'looking_for',
          createdAtIso: drop.createdAtIso
        });
      }
    }

    // Synthesize boss rotas
    for (const rota of bossRotas) {
      const synthId = `synth_rota_${rota.id}`;
      if (!byId.has(synthId)) {
        byId.set(synthId, {
          id: synthId,
          leagueId: activeSessionId,
          type: 'boss_rota',
          actorHandle: rota.hostDisplayName,
          title: `Scheduled Boss Rota: ${rota.title}`,
          detail: `${rota.scheduledTime} • ${rota.participants.length}/${rota.maxSpots} portals filled`,
          targetTab: 'bounties',
          createdAtIso: rota.createdAtIso
        });
      }
    }

    // Synthesize league firsts
    for (const first of leagueFirsts) {
      const synthId = `synth_first_${first.id}`;
      if (!byId.has(synthId)) {
        byId.set(synthId, {
          id: synthId,
          leagueId: activeSessionId,
          type: 'league_first',
          actorHandle: first.winnerDisplayName,
          actorCharacter: first.winnerCharacterName,
          title: `Claimed League First: ${first.title}`,
          detail: first.proofNote || 'Recorded on the Hall of Fame Wall',
          targetTab: 'overview',
          createdAtIso: first.achievedAtIso
        });
      }
    }

    // Synthesize community builds
    for (const g of guides.slice(0, 6)) {
      const synthId = `synth_guide_${g.id}`;
      if (!byId.has(synthId)) {
        const parsedTs = g.createdAt ? Date.parse(g.createdAt) : Number.NaN;
        const safeIso = !Number.isNaN(parsedTs)
          ? new Date(parsedTs).toISOString()
          : '2026-11-13T00:00:00Z';
        byId.set(synthId, {
          id: synthId,
          leagueId: activeSessionId,
          type: 'build_published',
          actorHandle: g.authorName || 'Exile',
          title: `Published Build Guide: ${g.title}`,
          detail: `${g.ascendancy} • ${g.className}`,
          targetTab: 'guides',
          createdAtIso: safeIso
        });
      }
    }

    return Array.from(byId.values()).sort((a, b) => {
      const aTs = Date.parse(a.createdAtIso || '') || 0;
      const bTs = Date.parse(b.createdAtIso || '') || 0;
      return bTs - aTs;
    });
  }, [activityFeed, lookingForItems, stashDrops, bossRotas, leagueFirsts, guides, activeSessionId]);

  const myHandleLower = userAccount?.displayName?.trim().toLowerCase() || '';
  const myCharLower = userAccount?.characterName?.trim().toLowerCase() || '';

  const isEventMentioningMe = (ev: LeagueFeedEvent): boolean => {
    if (!myHandleLower && !myCharLower) return false;
    const matchStr = (val?: string) => {
      if (!val) return false;
      const low = val.trim().replace(/^@/, '').toLowerCase();
      return (myHandleLower && low === myHandleLower) || (myCharLower && low === myCharLower);
    };
    if (matchStr(ev.actorHandle) || matchStr(ev.targetHandle) || matchStr(ev.actorCharacter)) return true;
    if ((ev.cheers || []).some((c) => matchStr(c))) return true;
    if ((ev.comments || []).some((c) => matchStr(c.authorHandle) || (myHandleLower && c.text.toLowerCase().includes(`@${myHandleLower}`)))) return true;
    if (myHandleLower && ((ev.title || '').toLowerCase().includes(`@${myHandleLower}`) || (ev.detail || '').toLowerCase().includes(`@${myHandleLower}`))) return true;
    return false;
  };

  const myMentionsCount = useMemo(
    () => combinedFeed.filter(isEventMentioningMe).length,
    [combinedFeed, myHandleLower, myCharLower]
  );

  const filteredEvents = useMemo(() => {
    if (filter === 'all') return combinedFeed;
    if (filter === 'mentions') return combinedFeed.filter(isEventMentioningMe);
    if (filter === 'fulfillments') return combinedFeed.filter((e) => e.type === 'item_fulfilled' || e.type === 'stash_drop');
    if (filter === 'bounties') return combinedFeed.filter((e) => e.type === 'bounty_listed' || e.type === 'boss_rota');
    if (filter === 'wishlists') return combinedFeed.filter((e) => e.type === 'wishlist_added');
    if (filter === 'roster') return combinedFeed.filter((e) => e.type === 'roster_join' || e.type === 'character_posted');
    if (filter === 'builds') return combinedFeed.filter((e) => e.type === 'build_published');
    if (filter === 'achievements') return combinedFeed.filter((e) => e.type === 'achievement_earned' || e.type === 'league_first');
    return combinedFeed;
  }, [combinedFeed, filter, myHandleLower, myCharLower]);

  const openBountiesCount = lookingForItems.filter((it) => it.status !== 'HAVE' && it.bountyOffer?.trim()).length;
  const fulfilledCount = lookingForItems.filter((it) => it.status === 'HAVE' && it.fulfilledBy && it.fulfilledBy.toLowerCase() !== 'self found').length;

  const handleSubmitComment = (e: React.FormEvent, ev: LeagueFeedEvent) => {
    e.preventDefault();
    const text = (draftComments[ev.id] || '').trim();
    if (!text) return;
    onCommentEvent(ev, text);
    setDraftComments((prev) => ({ ...prev, [ev.id]: '' }));
    setOpenComments((prev) => ({ ...prev, [ev.id]: true }));
  };

  return (
    <div id={`league-feed-page-${activeSessionId}`} className="space-y-5">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/35 via-slate-900/90 to-slate-900/90 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono uppercase tracking-wider text-indigo-300 font-bold">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Live League Activity Wall • {leagueName}</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-950/80 border border-slate-700 text-slate-400">
              /league/{activeSessionId}/feed
            </span>
          </div>
          <h2 className="text-lg font-black text-white mt-1">What Your Squad Is Up To</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Auto updates whenever an exile joins the league, posts a character, wishlists an item, lists a bounty, publishes a build, earns an achievement, or fulfills a drop for a squadmate.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <div className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
            <div className="text-sm font-black text-white">{roster.length}</div>
            <div className="text-[10px] text-slate-400">Exiles</div>
          </div>
          <div className="px-3 py-2 rounded-xl bg-slate-950/80 border border-amber-500/30 text-center">
            <div className="text-sm font-black text-amber-300">{openBountiesCount}</div>
            <div className="text-[10px] text-slate-400">Open Bounties</div>
          </div>
          <div className="px-3 py-2 rounded-xl bg-slate-950/80 border border-emerald-500/30 text-center">
            <div className="text-sm font-black text-emerald-300">{fulfilledCount}</div>
            <div className="text-[10px] text-slate-400">Squad Drops</div>
          </div>
          <button
            type="button"
            onClick={onCopyFeedLink}
            className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow"
            title="Copy direct shareable link to this League Feed page"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Copy Feed Link</span>
          </button>
        </div>
      </div>

      {/* Category Filter Strip */}
      <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/70 border border-slate-800 p-2 rounded-xl">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            filter === 'all'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          All Activity ({combinedFeed.length})
        </button>

        {userAccount && (
          <button
            type="button"
            onClick={() => setFilter('mentions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
              filter === 'mentions'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
            }`}
          >
            <AtSign className="w-3.5 h-3.5" />
            <span>My Squad & Mentions ({myMentionsCount})</span>
          </button>
        )}

        {(
          [
            { id: 'fulfillments', label: 'Fulfillments & Stash' },
            { id: 'bounties', label: 'Bounties & Rotas' },
            { id: 'wishlists', label: 'Wishlists' },
            { id: 'roster', label: 'Roster & Characters' },
            { id: 'builds', label: 'Builds' },
            { id: 'achievements', label: 'Achievements & Firsts' }
          ] as { id: FilterKey; label: string }[]
        ).map((pill) => (
          <button
            key={pill.id}
            type="button"
            onClick={() => setFilter(pill.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              filter === pill.id
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* Feed Timeline */}
      {filteredEvents.length === 0 ? (
        <div className="p-10 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 text-xs text-slate-400">
          {filter === 'mentions'
            ? 'No events involving you or mentioning your @handle yet. Fulfill a wish, post a bounty, or drop a shoutout to see activity here!'
            : 'No activity matching this filter yet. Post a wishlist item, bounty, character, or build guide to kick off the wall!'}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEvents.map((ev) => {
            const meta = getEventBadge(ev.type);
            const Icon = meta.icon;
            const cheers = ev.cheers || [];
            const comments = ev.comments || [];
            const hasCheered = Boolean(myHandleLower && cheers.some((c) => c.toLowerCase() === myHandleLower));
            const isCommentsOpen = Boolean(openComments[ev.id]) || comments.length > 0;
            const isNewSinceLastVisit = Boolean(
              lastSeenFeedAt &&
                ev.createdAtIso &&
                ev.createdAtIso > lastSeenFeedAt &&
                ev.actorHandle.toLowerCase() !== myHandleLower
            );

            return (
              <div
                key={ev.id}
                className={`p-4 rounded-2xl bg-slate-900/75 border ${meta.borderClass} space-y-3 hover:bg-slate-900 transition-colors`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3.5 min-w-0">
                    {ev.iconUrl ? (
                      <img
                        src={ev.iconUrl}
                        alt={ev.title}
                        className="w-11 h-11 rounded-xl border border-purple-400/50 object-cover shrink-0 shadow-md"
                      />
                    ) : (
                      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${meta.badgeClass}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                    )}

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${meta.badgeClass}`}>
                          {meta.label}
                        </span>
                        {isNewSinceLastVisit && (
                          <span className="text-[10px] font-mono font-black uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            NEW
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => onOpenProfile?.(ev.actorHandle)}
                          className="text-xs font-black text-amber-300 hover:underline cursor-pointer"
                        >
                          @{ev.actorHandle}
                        </button>
                        {ev.actorCharacter && ev.actorCharacter.toLowerCase() !== ev.actorHandle.toLowerCase() && (
                          <span className="text-[10px] font-mono text-slate-500">({ev.actorCharacter})</span>
                        )}
                        <span
                          className="text-[10px] font-mono text-slate-500"
                          title={new Date(ev.createdAtIso).toLocaleString()}
                        >
                          • {formatRelativeTime(ev.createdAtIso)}
                        </span>
                      </div>

                      <div className="text-sm font-bold text-white leading-snug">{ev.title}</div>
                      {ev.detail && <div className="text-xs text-slate-400">{ev.detail}</div>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => onCheerEvent(ev)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold transition-colors cursor-pointer ${
                        hasCheered
                          ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-rose-300 hover:border-rose-500/30'
                      }`}
                      title={cheers.length > 0 ? `Liked by: ${cheers.join(', ')}` : 'Like / Send a GG heart'}
                    >
                      <Heart className={`w-3.5 h-3.5 ${hasCheered ? 'fill-rose-400 text-rose-400' : ''}`} />
                      <span>{cheers.length > 0 ? cheers.length : 'Like'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setOpenComments((prev) => ({ ...prev, [ev.id]: !isCommentsOpen }))
                      }
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold transition-colors cursor-pointer ${
                        isCommentsOpen
                          ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-indigo-300 hover:border-indigo-500/30'
                      }`}
                      title="Toggle shoutout comments"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>{comments.length > 0 ? comments.length : 'Reply'}</span>
                    </button>

                    {ev.targetTab && (
                      <button
                        type="button"
                        onClick={() => onNavigateTab(ev.targetTab as any)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
                      >
                        <span>Open</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline Shoutout / Comment Thread */}
                {isCommentsOpen && (
                  <div className="pt-2.5 border-t border-slate-800/80 space-y-2 pl-2 sm:pl-14">
                    {comments.length > 0 && (
                      <div className="space-y-1.5">
                        {comments.map((c) => (
                          <div
                            key={c.id}
                            className="px-3 py-1.5 rounded-xl bg-slate-950/75 border border-slate-800/80 text-xs flex flex-wrap items-baseline justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <button
                                type="button"
                                onClick={() => onOpenProfile?.(c.authorHandle)}
                                className="font-bold text-amber-300 hover:underline mr-2 cursor-pointer"
                              >
                                @{c.authorHandle}
                              </button>
                              <span className="text-slate-200">{c.text}</span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-500 shrink-0">
                              {formatRelativeTime(c.createdAtIso)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <form onSubmit={(e) => handleSubmitComment(e, ev)} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={draftComments[ev.id] || ''}
                        onChange={(e) =>
                          setDraftComments((prev) => ({ ...prev, [ev.id]: e.target.value }))
                        }
                        placeholder={
                          userAccount
                            ? 'Drop a 1 line shoutout (e.g. HUGE drop gz!! or I have a spare 6L base)...'
                            : 'Sign in or type a quick shoutout...'
                        }
                        maxLength={220}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        type="submit"
                        disabled={!(draftComments[ev.id] || '').trim()}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Send className="w-3 h-3" />
                        <span>Send</span>
                      </button>
                    </form>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
