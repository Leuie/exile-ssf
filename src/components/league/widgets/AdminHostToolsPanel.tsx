import React, { useState, useEffect, useMemo } from 'react';
import {
  Award,
  Activity,
  BellRing,
  CheckCircle2,
  Send,
  Save,
  Sparkles,
  Trophy,
  Users,
  RefreshCw,
  Megaphone,
  MessageSquare,
  Sliders,
  ShieldCheck,
  FileSpreadsheet,
  Database
} from 'lucide-react';
import type { LeagueRosterMember, LookingForItem, SiteFeedbackItem } from '../../../types';
import {
  fetchCloudLeagueData,
  saveCloudAchievementProfile,
  saveCloudFeedEvent,
  fetchWebhookConfig,
  saveWebhookConfig,
  sendTestWebhookAlert,
  fetchCloudFeedback,
  saveCloudFeedbackItem,
  type WebhookConfigPayload
} from '../../../services/cloudSync';
import { ACHIEVEMENT_CATALOG, formatLeagueLabel } from '../../../utils/achievements';
import { getMemberCharacters } from '../tabs/RosterTab';
import { fireConfetti } from '../../../utils/confetti';
import { exportLeagueToXlsx, downloadStarterSheetTemplate } from '../../../utils/spreadsheetEngine';

const WEBHOOK_EVENT_OPTIONS: { id: string; label: string }[] = [
  { id: 'bounty_listed', label: 'New Chase Bounties' },
  { id: 'item_fulfilled', label: 'Squad Drop Fulfillments' },
  { id: 'boss_rota', label: 'Boss Rotations Hosted' },
  { id: 'league_first', label: 'League Firsts Claimed' },
  { id: 'achievement_earned', label: 'Achievements Unlocked' },
  { id: 'roster_join', label: 'New Exiles Joined' },
  { id: 'character_posted', label: 'Level 90/95/100 Milestones' }
];

type AdminSubTab = 'overview' | 'host' | 'site_ops' | 'security';

export interface AdminHostToolsPanelProps {
  securityCard?: React.ReactNode;
}

export const AdminHostToolsPanel: React.FC<AdminHostToolsPanelProps> = ({ securityCard }) => {
  const leagueId = 'poe1-330-umbra';
  const [subTab, setSubTab] = useState<AdminSubTab>('overview');
  const [roster, setRoster] = useState<LeagueRosterMember[]>([]);
  const [wishlist, setWishlist] = useState<LookingForItem[]>([]);
  const [feedbackItems, setFeedbackItems] = useState<SiteFeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Award Form State
  const [selectedHandle, setSelectedHandle] = useState('');
  const [awardMode, setAwardMode] = useState<'honor' | 'achievement'>('honor');
  const [honorPoints, setHonorPoints] = useState(25);
  const [honorReason, setHonorReason] = useState('');
  const [selectedAchId, setSelectedAchId] = useState(
    ACHIEVEMENT_CATALOG[ACHIEVEMENT_CATALOG.length - 2]?.id || 'league_join_poe1-330-umbra'
  );
  const [announceOnFeed, setAnnounceOnFeed] = useState(true);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Host Broadcast State
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastDetail, setBroadcastDetail] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState<string | null>(null);

  // Webhook Form State
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEnabled, setWebhookEnabled] = useState(true);
  const [webhookEvents, setWebhookEvents] = useState<string[]>([
    'bounty_listed',
    'item_fulfilled',
    'boss_rota',
    'league_first',
    'achievement_earned',
    'roster_join'
  ]);
  const [webhookStatus, setWebhookStatus] = useState<string | null>(null);
  const [testingWebhook, setTestingWebhook] = useState(false);

  // Edge Cache & Ladder Refresh State
  const [cacheRunning, setCacheRunning] = useState<string | null>(null);
  const [cacheNotice, setCacheNotice] = useState<string | null>(null);
  const [syncingLadder, setSyncingLadder] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchCloudLeagueData(leagueId), fetchWebhookConfig(), fetchCloudFeedback()]).then(
      ([data, wh, fb]) => {
        if (cancelled) return;
        if (data?.roster) {
          setRoster(data.roster);
          if (data.roster.length > 0) setSelectedHandle(data.roster[0].displayName);
        }
        if (data?.wishlist) setWishlist(data.wishlist);
        if (wh) {
          setWebhookUrl(wh.url || '');
          setWebhookEnabled(wh.enabled);
          if (Array.isArray(wh.events) && wh.events.length > 0) setWebhookEvents(wh.events);
        }
        if (Array.isArray(fb)) setFeedbackItems(fb);
        setLoading(false);
      }
    );
    return () => {
      cancelled = true;
    };
  }, []);

  // League Health Metrics
  const health = useMemo(() => {
    const allChars = roster.flatMap((m) => getMemberCharacters(m));
    const activeChars = allChars.filter((c) => (Number(c.level) || 1) > 1);
    const idleSlots = roster.filter((m) => {
      const chars = getMemberCharacters(m);
      return chars.every((c) => (Number(c.level) || 1) <= 1);
    });
    const openWishes = wishlist.filter((w) => w.status !== 'HAVE');
    const fulfilledWishes = wishlist.filter((w) => w.status === 'HAVE');

    const catCounts = new Map<string, number>();
    for (const w of openWishes) {
      catCounts.set(w.category, (catCounts.get(w.category) || 0) + 1);
    }
    const topBottlenecks = Array.from(catCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const uniqueCharsMap = new Map<string, (typeof allChars)[number]>();
    for (const ch of allChars) {
      const k = String(ch.characterName || '').replace(/\s+/g, ' ').trim().toLowerCase();
      if (!k) continue;
      const prev = uniqueCharsMap.get(k);
      if (!prev || (Number(ch.level) || 0) > (Number(prev.level) || 0)) {
        uniqueCharsMap.set(k, ch);
      }
    }
    const topLevelChars = Array.from(uniqueCharsMap.values())
      .sort((a, b) => (Number(b.level) || 0) - (Number(a.level) || 0))
      .slice(0, 5);

    return {
      totalExiles: roster.length,
      totalChars: uniqueCharsMap.size || allChars.length,
      activeCharCount: activeChars.length,
      idleSlotCount: idleSlots.length,
      openWishCount: openWishes.length,
      fulfilledCount: fulfilledWishes.length,
      topBottlenecks,
      topLevelChars
    };
  }, [roster, wishlist]);

  const handleGrantAward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHandle) return;
    const member = roster.find((m) => m.displayName.toLowerCase() === selectedHandle.toLowerCase());
    const keys = new Set<string>([selectedHandle.trim().toLowerCase()]);
    if (member?.poeAccountName) keys.add(member.poeAccountName.trim().toLowerCase());
    const nowIso = new Date().toISOString();

    if (awardMode === 'honor') {
      const reason = honorReason.trim() || 'League Host Event Award';
      const entryId = `honor-host-${Date.now()}`;
      for (const pk of keys) {
        await saveCloudAchievementProfile(pk, {
          unlockedIds: {},
          lifetimeFulfilledCount: 0,
          lifetimeBountiesClaimed: 0,
          lifetimeBountiesPaid: 0,
          leaguesParticipated: [leagueId],
          honorLog: [
            {
              id: entryId,
              points: Number(honorPoints) || 10,
              reason: `Host Event Award: ${reason}`,
              where: `${formatLeagueLabel(leagueId)} • Admin Console`,
              timestampIso: nowIso,
              kind: 'achievement'
            }
          ]
        });
      }
      if (announceOnFeed) {
        await saveCloudFeedEvent(leagueId, {
          id: `feed_award_${Date.now()}`,
          leagueId,
          type: 'achievement_earned',
          actorHandle: selectedHandle,
          title: `Awarded +${honorPoints} Bonus Honor Points: ${reason}`,
          detail: 'Granted by League Host (@Leuie)',
          targetTab: 'bounties',
          createdAtIso: nowIso
        });
      }
      fireConfetti();
      setStatusMsg(`Granted +${honorPoints} Honor Points to @${selectedHandle} for "${reason}"!`);
      setHonorReason('');
    } else {
      const ach = ACHIEVEMENT_CATALOG.find((a) => a.id === selectedAchId);
      if (!ach) return;
      for (const pk of keys) {
        await saveCloudAchievementProfile(pk, {
          unlockedIds: { [ach.id]: nowIso },
          lifetimeFulfilledCount: 0,
          lifetimeBountiesClaimed: 0,
          lifetimeBountiesPaid: 0,
          leaguesParticipated: [leagueId],
          honorLog: [
            {
              id: `honor-ach-${ach.id}`,
              points: ach.points,
              reason: `Unlocked Achievement: ${ach.title}`,
              where: `${formatLeagueLabel(leagueId)} • Host Grant`,
              timestampIso: nowIso,
              kind: 'achievement'
            }
          ]
        });
      }
      if (announceOnFeed) {
        await saveCloudFeedEvent(leagueId, {
          id: `feed_ach_${Date.now()}`,
          leagueId,
          type: 'achievement_earned',
          actorHandle: selectedHandle,
          title: `Unlocked Achievement: ${ach.title}`,
          detail: `+${ach.points} Honor Points • Awarded by League Host`,
          iconUrl: ach.iconUrl,
          targetTab: 'bounties',
          createdAtIso: nowIso
        });
      }
      fireConfetti();
      setStatusMsg(`Granted "${ach.title}" (+${ach.points} pts) to @${selectedHandle}!`);
    }
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const handleBroadcastAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim()) return;
    const nowIso = new Date().toISOString();
    await saveCloudFeedEvent(leagueId, {
      id: `feed_host_${Date.now()}`,
      leagueId,
      type: 'league_first',
      actorHandle: 'Leuie',
      title: `Host Announcement: ${broadcastTitle.trim()}`,
      detail: broadcastDetail.trim() || 'Posted from the Exile SSF Admin Console',
      targetTab: 'feed',
      createdAtIso: nowIso
    });
    setBroadcastTitle('');
    setBroadcastDetail('');
    setBroadcastMsg('Announcement published to Live League Feed and Webhook!');
    setTimeout(() => setBroadcastMsg(null), 4000);
  };

  const handleSaveWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: WebhookConfigPayload = {
      url: webhookUrl.trim(),
      enabled: webhookEnabled,
      events: webhookEvents
    };
    const ok = await saveWebhookConfig(payload);
    setWebhookStatus(ok ? 'Webhook configuration saved to Cloudflare D1!' : 'Failed to save webhook configuration.');
    setTimeout(() => setWebhookStatus(null), 3500);
  };

  const handleTestWebhook = async () => {
    setTestingWebhook(true);
    const ok = await sendTestWebhookAlert(leagueId);
    setTestingWebhook(false);
    setWebhookStatus(
      ok
        ? 'Test alert delivered! Check your Root or Discord channel.'
        : 'Test alert failed. Verify your Webhook URL is saved and enabled.'
    );
    setTimeout(() => setWebhookStatus(null), 4500);
  };

  const toggleWebhookEvent = (id: string) => {
    setWebhookEvents((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleForceLadderSync = async () => {
    setSyncingLadder(true);
    setExportNotice(null);
    try {
      const res = await fetch(`/api/ladder-sync?league=${encodeURIComponent(leagueId)}`, {
        method: 'POST',
        credentials: 'include'
      });
      if (res.ok) {
        const refreshed = await fetchCloudLeagueData(leagueId);
        if (refreshed?.roster) setRoster(refreshed.roster);
        setExportNotice('Official PoE Ladder synced and roster levels refreshed!');
      } else {
        setExportNotice('Ladder sync returned a warning. Check GGG ladder availability.');
      }
    } catch {
      setExportNotice('Could not reach ladder sync endpoint.');
    } finally {
      setSyncingLadder(false);
      setTimeout(() => setExportNotice(null), 4500);
    }
  };

  const handleRefreshEdgeCache = async (kind: 'ninja' | 'patch_poe1' | 'patch_poe2' | 'builds_poe1' | 'builds_poe2') => {
    setCacheRunning(kind);
    setCacheNotice(null);
    const urlMap: Record<typeof kind, string> = {
      ninja: '/api/farming/ninja-prices?league=auto&refresh=1',
      patch_poe1: '/api/patch-notes?game=poe1&refresh=1',
      patch_poe2: '/api/patch-notes?game=poe2&refresh=1',
      builds_poe1: '/api/builds/external?game=poe1&refresh=1',
      builds_poe2: '/api/builds/external?game=poe2&refresh=1'
    };
    const labelMap: Record<typeof kind, string> = {
      ninja: 'poe.ninja Economy Prices & Item Icons',
      patch_poe1: 'PoE 1 Official Patch Notes',
      patch_poe2: 'PoE 2 Official Patch Notes',
      builds_poe1: 'PoE 1 Mobalytics & Maxroll Builds',
      builds_poe2: 'PoE 2 Mobalytics & Maxroll Builds'
    };
    try {
      const res = await fetch(urlMap[kind]);
      if (res.ok) {
        const data: any = await res.json();
        const extra =
          kind === 'ninja'
            ? ` (${data.itemCount || 0} prices, ${data.iconCount || 0} icons, 1d = ${data.divineChaos || 0}c)`
            : Array.isArray(data?.guides)
            ? ` (${data.guides.length} guides)`
            : Array.isArray(data?.threads)
            ? ` (${data.threads.length} threads)`
            : '';
        setCacheNotice(`Refreshed ${labelMap[kind]}${extra}`);
      } else {
        setCacheNotice(`Refresh failed for ${labelMap[kind]} (HTTP ${res.status}).`);
      }
    } catch {
      setCacheNotice(`Network error refreshing ${labelMap[kind]}.`);
    } finally {
      setCacheRunning(null);
      setTimeout(() => setCacheNotice(null), 5000);
    }
  };

  const handleUpdateFeedbackStatus = async (item: SiteFeedbackItem, nextStatus: SiteFeedbackItem['status']) => {
    const updated: SiteFeedbackItem = { ...item, status: nextStatus };
    setFeedbackItems((prev) => prev.map((it) => (it.id === item.id ? updated : it)));
    await saveCloudFeedbackItem(updated);
  };

  if (loading) {
    return (
      <div className="p-10 rounded-2xl border border-slate-800 bg-[#0d111a] text-center text-xs font-mono text-slate-400">
        Loading live Cloudflare D1 League Health &amp; Admin Controls...
      </div>
    );
  }

  return (
    <div className="space-y-5 w-full">
      {/* Cohesive Admin Console Sub Navigation */}
      <nav className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-[#0d111a] p-2 shadow-lg">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: 'overview', label: 'Overview & Health', icon: Activity },
              { id: 'host', label: 'Awards & Broadcast', icon: Trophy },
              { id: 'site_ops', label: `Site Ops & Feedback (${feedbackItems.length})`, icon: Sliders },
              { id: 'security', label: 'Security & Access', icon: ShieldCheck }
            ] as const
          ).map((t) => {
            const Icon = t.icon;
            const active = subTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSubTab(t.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  active
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-amber-300' : 'text-slate-500'}`} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 px-2 text-[11px] font-mono text-slate-400">
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span>Cloudflare D1 Live • Covens of Umbra (3.30)</span>
        </div>
      </nav>

      {/* ================================================================= */}
      {/* TAB 1: OVERVIEW & LEAGUE HEALTH                                   */}
      {/* ================================================================= */}
      {subTab === 'overview' && (
        <div className="space-y-5">
          {/* 4 Executive KPI Cards */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="rounded-2xl border border-slate-800 bg-[#0d111a] p-4 space-y-1 shadow-lg">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Roster Slots</div>
              <div className="text-2xl font-black font-mono text-white">{health.totalExiles}</div>
              <div className="text-[11px] font-mono text-slate-500">{health.idleSlotCount} at Lvl 1</div>
            </div>
            <div className="rounded-2xl border border-sky-500/25 bg-gradient-to-br from-sky-950/20 via-[#0d111a] to-[#0d111a] p-4 space-y-1 shadow-lg">
              <div className="text-[10px] font-mono uppercase tracking-wider text-sky-300">Tracked Characters</div>
              <div className="text-2xl font-black font-mono text-sky-300">{health.totalChars}</div>
              <div className="text-[11px] font-mono text-slate-400">{health.activeCharCount} active above Lvl 1</div>
            </div>
            <div className="rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-950/20 via-[#0d111a] to-[#0d111a] p-4 space-y-1 shadow-lg">
              <div className="text-[10px] font-mono uppercase tracking-wider text-amber-300">Open Squad Wishes</div>
              <div className="text-2xl font-black font-mono text-amber-300">{health.openWishCount}</div>
              <div className="text-[11px] font-mono text-slate-400">Across {health.topBottlenecks.length} categories</div>
            </div>
            <div className="rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-950/20 via-[#0d111a] to-[#0d111a] p-4 space-y-1 shadow-lg">
              <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-300">Fulfilled Drops</div>
              <div className="text-2xl font-black font-mono text-emerald-300">{health.fulfilledCount}</div>
              <div className="text-[11px] font-mono text-slate-400">12h Official Ladder Sync Active</div>
            </div>
          </section>

          {/* Quick Actions Bar (Ladder Sync + Sheets Export) */}
          <section className="rounded-2xl border border-slate-800 bg-[#0d111a] p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2.5 text-xs">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-slate-300">
                <strong className="text-white">League Quick Actions:</strong> Sync official GGG ladder levels or export a styled 5 tab workbook.
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={syncingLadder}
                onClick={handleForceLadderSync}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600/25 hover:bg-indigo-600/35 border border-indigo-400/50 text-indigo-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncingLadder ? 'animate-spin' : ''}`} />
                <span>{syncingLadder ? 'Syncing Ladder...' : 'Force Ladder Sync'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    const res = exportLeagueToXlsx({
                      leagueId,
                      leagueName: 'Ravenwatch Covens of Umbra GSF (PL87651)',
                      patchVersion: '3.30',
                      officialLeagueUrl: 'https://www.pathofexile.com/private-leagues/league/Ravenwatch+Covens+of+Umbra+GSF',
                      roster,
                      wishlist
                    });
                    setExportNotice(`Downloaded "${res.filename}" (${res.tabCount} tabs).`);
                    setTimeout(() => setExportNotice(null), 4000);
                  } catch {
                    setExportNotice('Could not generate workbook. Check browser download settings.');
                  }
                }}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer shadow"
              >
                Export Live League (.xlsx)
              </button>
              <button
                type="button"
                onClick={() => {
                  downloadStarterSheetTemplate();
                  setExportNotice('Downloaded Blank Starter Sheet (.xlsx).');
                  setTimeout(() => setExportNotice(null), 3500);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 text-xs font-bold cursor-pointer"
              >
                Starter Sheet (.xlsx)
              </button>
            </div>
          </section>

          {exportNotice && (
            <div className="px-3.5 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-xs text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{exportNotice}</span>
            </div>
          )}

          {/* Diagnostics Row: Wishlist Bottlenecks & Highest Level Characters */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="rounded-2xl border border-slate-800 bg-[#0d111a] p-5 space-y-3 shadow-xl">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5 border-b border-slate-800 pb-2.5">
                <Sparkles className="w-4 h-4" />
                <span>Top Wishlist Bottlenecks</span>
              </div>
              {health.topBottlenecks.length === 0 ? (
                <div className="text-xs text-slate-500 italic py-4">No open wishlist bottlenecks right now.</div>
              ) : (
                <div className="space-y-2.5">
                  {health.topBottlenecks.map(([cat, count]) => {
                    const maxB = Math.max(1, health.topBottlenecks[0]?.[1] || 1);
                    const wPct = Math.max(12, Math.round((count / maxB) * 100));
                    return (
                      <div key={cat} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-200 font-semibold">{cat}</span>
                          <span className="font-mono text-amber-300 font-bold">{count} needed</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                          <div className="h-full rounded-full bg-amber-500/80" style={{ width: `${wPct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#0d111a] p-5 space-y-3 shadow-xl">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5 border-b border-slate-800 pb-2.5">
                <Users className="w-4 h-4" />
                <span>Highest Level Characters (Ladder Synced)</span>
              </div>
              <div className="divide-y divide-slate-800/70">
                {health.topLevelChars.map((ch) => (
                  <div key={ch.id || ch.characterName} className="flex items-center justify-between text-xs py-2">
                    <span className="text-slate-100 font-semibold truncate">
                      {ch.characterName} <span className="text-slate-500 font-normal">({ch.ascendancy})</span>
                    </span>
                    <span className="font-mono text-emerald-300 font-bold shrink-0">Lvl {ch.level}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 2: HOST AWARDS & LIVE FEED BROADCAST                          */}
      {/* ================================================================= */}
      {subTab === 'host' && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Host Event & Custom Award Tool */}
          <form
            onSubmit={handleGrantAward}
            className="rounded-2xl border border-slate-800 bg-[#0d111a] p-5 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-amber-300">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Host Event &amp; Custom Award Tool</span>
              </div>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setAwardMode('honor')}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer ${
                    awardMode === 'honor' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Honor Pts
                </button>
                <button
                  type="button"
                  onClick={() => setAwardMode('achievement')}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer ${
                    awardMode === 'achievement' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Achievement
                </button>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Recipient Exile</label>
                <select
                  value={selectedHandle}
                  onChange={(e) => setSelectedHandle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-amber-200 font-mono"
                >
                  {roster.map((m) => (
                    <option key={m.id} value={m.displayName}>
                      @{m.displayName} ({m.poeAccountName || m.characterName})
                    </option>
                  ))}
                </select>
              </div>

              {awardMode === 'honor' ? (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">Points</label>
                    <input
                      type="number"
                      min={1}
                      max={500}
                      value={honorPoints}
                      onChange={(e) => setHonorPoints(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">Event / Award Reason</label>
                    <input
                      type="text"
                      required
                      value={honorReason}
                      onChange={(e) => setHonorReason(e.target.value)}
                      placeholder="e.g. Weekend Delve Depth Race Winner"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">Select Achievement Badge</label>
                  <select
                    value={selectedAchId}
                    onChange={(e) => setSelectedAchId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-purple-200"
                  >
                    {ACHIEVEMENT_CATALOG.map((ach) => (
                      <option key={ach.id} value={ach.id}>
                        {ach.title} (+{ach.points} pts • {ach.tier})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <label className="flex items-center gap-2 text-slate-300 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={announceOnFeed}
                  onChange={(e) => setAnnounceOnFeed(e.target.checked)}
                  className="rounded border-slate-700"
                />
                <span>Announce award on Live League Feed &amp; Root Webhook</span>
              </label>

              {statusMsg && (
                <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{statusMsg}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black flex items-center justify-center gap-2 cursor-pointer shadow"
              >
                <Trophy className="w-4 h-4" />
                <span>{awardMode === 'honor' ? `Grant +${honorPoints} Honor Points` : 'Grant Achievement Badge'}</span>
              </button>
            </div>
          </form>

          {/* Official Host Broadcast to Live Feed & Webhook */}
          <form
            onSubmit={handleBroadcastAnnouncement}
            className="rounded-2xl border border-slate-800 bg-[#0d111a] p-5 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-sky-300">
                <Megaphone className="w-4 h-4 text-sky-400" />
                <span>Broadcast League Announcement</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">Posts to Live Feed + Webhook</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Announcement Headline *</label>
                <input
                  type="text"
                  required
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="e.g. Saturday Night Uber Boss Carry & Voidstone Push!"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Details / Time / Channel</label>
                <textarea
                  rows={4}
                  value={broadcastDetail}
                  onChange={(e) => setBroadcastDetail(e.target.value)}
                  placeholder="Share schedule details, global channel (/global 5712), or event rules..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 resize-none"
                />
              </div>

              {broadcastMsg && (
                <div className="p-2.5 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-sky-400" />
                  <span>{broadcastMsg}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black flex items-center justify-center gap-2 cursor-pointer shadow"
              >
                <Megaphone className="w-4 h-4" />
                <span>Publish Host Announcement</span>
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ================================================================= */}
      {/* TAB 3: SITE OPS, EDGE CACHES, WEBHOOKS & FEEDBACK QUEUE           */}
      {/* ================================================================= */}
      {subTab === 'site_ops' && (
        <div className="space-y-5">
          {/* Edge Cache Controls */}
          <section className="rounded-2xl border border-slate-800 bg-[#0d111a] p-5 space-y-3.5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-emerald-300">
                <RefreshCw className="w-4 h-4 text-emerald-400" />
                <span>Cloudflare KV Edge Cache Controls</span>
              </div>
              <span className="text-[11px] font-mono text-slate-500">Force live upstream refreshes on demand</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              {(
                [
                  { id: 'ninja', label: 'poe.ninja Prices & Icons' },
                  { id: 'patch_poe1', label: 'PoE 1 Patch Notes' },
                  { id: 'patch_poe2', label: 'PoE 2 Patch Notes' },
                  { id: 'builds_poe1', label: 'PoE 1 External Builds' },
                  { id: 'builds_poe2', label: 'PoE 2 External Builds' }
                ] as const
              ).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  disabled={cacheRunning !== null}
                  onClick={() => handleRefreshEdgeCache(c.id)}
                  className="px-3 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${cacheRunning === c.id ? 'animate-spin' : ''}`} />
                  <span className="truncate">{c.label}</span>
                </button>
              ))}
            </div>

            {cacheNotice && (
              <div className="px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-xs text-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{cacheNotice}</span>
              </div>
            )}
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Community Feedback Triage Queue */}
            <div className="rounded-2xl border border-slate-800 bg-[#0d111a] p-5 space-y-3.5 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-amber-300">
                  <MessageSquare className="w-4 h-4 text-amber-400" />
                  <span>Community Feedback Triage ({feedbackItems.length})</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Live D1 Queue</span>
              </div>

              {feedbackItems.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-500">
                  No open community feedback submissions yet. Real user requests from <code className="text-slate-300">/feedback</code> appear here for triage.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                  {feedbackItems.map((fb) => (
                    <div key={fb.id} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">{fb.title}</div>
                          <div className="text-[10px] font-mono text-slate-500">
                            @{fb.authorDisplayName} • {fb.createdAt} • {fb.upvotes || 0} upvotes
                          </div>
                        </div>
                        <select
                          value={fb.status}
                          onChange={(e) => handleUpdateFeedbackStatus(fb, e.target.value as SiteFeedbackItem['status'])}
                          className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[10px] font-mono font-bold text-amber-200 cursor-pointer shrink-0"
                        >
                          <option value="under_review">Under Review</option>
                          <option value="planned">Planned</option>
                          <option value="in_progress">In Progress</option>
                          <option value="implemented">Implemented</option>
                        </select>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2">{fb.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Root / Discord Webhook Push Alerts */}
            <form
              onSubmit={handleSaveWebhook}
              className="rounded-2xl border border-slate-800 bg-[#0d111a] p-5 space-y-4 shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-indigo-300">
                  <BellRing className="w-4 h-4 text-indigo-400" />
                  <span>Root / Discord Webhook Push Alerts</span>
                </div>
                <label className="inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={webhookEnabled}
                    onChange={(e) => setWebhookEnabled(e.target.checked)}
                  />
                  <span>{webhookEnabled ? 'Enabled' : 'Paused'}</span>
                </label>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    Root or Discord Webhook URL (Saved in Cloudflare D1)
                  </label>
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono"
                  />
                </div>

                <div>
                  <div className="text-[11px] font-mono text-slate-400 mb-1.5">Push Alerts For:</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {WEBHOOK_EVENT_OPTIONS.map((opt) => {
                      const active = webhookEvents.includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => toggleWebhookEvent(opt.id)}
                          className={`text-left px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold cursor-pointer transition-colors ${
                            active
                              ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-200'
                              : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {webhookStatus && (
                  <div className="p-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-200">
                    {webhookStatus}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black flex items-center justify-center gap-1.5 cursor-pointer shadow"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Webhook</span>
                  </button>
                  <button
                    type="button"
                    disabled={testingWebhook || !webhookUrl.trim()}
                    onClick={handleTestWebhook}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/35 border border-emerald-500/40 text-emerald-300 font-black flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{testingWebhook ? 'Sending...' : 'Test Alert'}</span>
                  </button>
                </div>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 4: SECURITY & ACCESS                                          */}
      {/* ================================================================= */}
      {subTab === 'security' && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {securityCard}
          <div className="rounded-2xl border border-slate-800 bg-[#0d111a] p-5 space-y-3.5 shadow-xl">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-emerald-300 border-b border-slate-800 pb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Production Security Posture</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                <span>HMAC Session Signing</span>
                <span className="font-mono text-emerald-300 font-bold">Fail Closed (Cloudflare Secret)</span>
              </li>
              <li className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                <span>Global Mutation Auth Gate</span>
                <span className="font-mono text-emerald-300 font-bold">Active (POST / PUT / DELETE)</span>
              </li>
              <li className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                <span>CORS Header Scoping</span>
                <span className="font-mono text-emerald-300 font-bold">Request Scoped (Zero Bleed)</span>
              </li>
              <li className="flex items-center justify-between py-1.5">
                <span>POESESSID Storage Policy</span>
                <span className="font-mono text-sky-300 font-bold">Never Stored on Server</span>
              </li>
            </ul>
          </div>
        </section>
      )}
    </div>
  );
};
