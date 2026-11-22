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
  Users
} from 'lucide-react';
import type { LeagueRosterMember, LookingForItem } from '../../../types';
import {
  fetchCloudLeagueData,
  saveCloudAchievementProfile,
  saveCloudFeedEvent,
  fetchWebhookConfig,
  saveWebhookConfig,
  sendTestWebhookAlert,
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

export const AdminHostToolsPanel: React.FC = () => {
  const leagueId = 'poe1-330-umbra';
  const [roster, setRoster] = useState<LeagueRosterMember[]>([]);
  const [wishlist, setWishlist] = useState<LookingForItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Award Form State
  const [selectedHandle, setSelectedHandle] = useState('');
  const [awardMode, setAwardMode] = useState<'honor' | 'achievement'>('honor');
  const [honorPoints, setHonorPoints] = useState(25);
  const [honorReason, setHonorReason] = useState('');
  const [selectedAchId, setSelectedAchId] = useState(ACHIEVEMENT_CATALOG[ACHIEVEMENT_CATALOG.length - 2]?.id || 'league_join_poe1-330-umbra');
  const [announceOnFeed, setAnnounceOnFeed] = useState(true);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

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

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchCloudLeagueData(leagueId), fetchWebhookConfig()]).then(([data, wh]) => {
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
      setLoading(false);
    });
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
      .slice(0, 4);

    const topLevelChars = [...allChars]
      .sort((a, b) => (Number(b.level) || 0) - (Number(a.level) || 0))
      .slice(0, 4);

    return {
      totalExiles: roster.length,
      totalChars: allChars.length,
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
              where: `${formatLeagueLabel(leagueId)} • Admin Portal`,
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

  if (loading) {
    return (
      <div className="p-6 text-center text-xs font-mono text-slate-400">
        Loading live Cloudflare D1 League Health & Host Controls...
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-5xl mt-6 relative z-10">
      {/* 0. Google Sheets Export & Blank Starter Sheet */}
      <div className="rounded-3xl border border-emerald-500/30 bg-emerald-950/15 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-300">
            Google Sheets Export & Starter Sheet
          </div>
          <p className="text-xs text-slate-300 mt-0.5">
            Download a styled multi tab Google Sheets workbook of the live league or grab the blank <strong>Exile SSF Private League Starter Sheet</strong>.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() =>
              exportLeagueToXlsx({
                leagueId,
                leagueName: 'Ravenwatch Covens of Umbra GSF (PL87651)',
                patchVersion: '3.30',
                officialLeagueUrl: 'https://www.pathofexile.com/private-leagues/league/Ravenwatch+Covens+of+Umbra+GSF',
                roster,
                wishlist
              })
            }
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black cursor-pointer shadow"
          >
            Export Live League (.xlsx)
          </button>
          <button
            type="button"
            onClick={downloadStarterSheetTemplate}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black cursor-pointer shadow"
          >
            Download Starter Sheet
          </button>
        </div>
      </div>

      {/* 1. League Health Overview */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-emerald-300">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>League Health Overview (Covens of Umbra 3.30)</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">10 Min Auto Ladder Cron Active</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div className="text-xl font-black text-white">{health.totalExiles}</div>
            <div className="text-[11px] font-mono text-slate-400">Roster Slots ({health.idleSlotCount} Lvl 1)</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div className="text-xl font-black text-sky-300">{health.totalChars}</div>
            <div className="text-[11px] font-mono text-slate-400">Tracked Characters ({health.activeCharCount} Active)</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div className="text-xl font-black text-amber-300">{health.openWishCount}</div>
            <div className="text-[11px] font-mono text-slate-400">Open Squad Wishes</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div className="text-xl font-black text-emerald-300">{health.fulfilledCount}</div>
            <div className="text-[11px] font-mono text-slate-400">Total Fulfilled Drops</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <div className="text-[11px] font-mono font-bold uppercase text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Top Wishlist Bottlenecks</span>
            </div>
            {health.topBottlenecks.length === 0 ? (
              <div className="text-xs text-slate-500 italic">No open wishlist bottlenecks right now.</div>
            ) : (
              <div className="space-y-1.5">
                {health.topBottlenecks.map(([cat, count]) => (
                  <div key={cat} className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-semibold">{cat}</span>
                    <span className="font-mono text-amber-300 font-bold">{count} needed</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <div className="text-[11px] font-mono font-bold uppercase text-indigo-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>Highest Level Characters (Ladder Synced)</span>
            </div>
            <div className="space-y-1.5">
              {health.topLevelChars.map((ch) => (
                <div key={ch.id || ch.characterName} className="flex items-center justify-between text-xs">
                  <span className="text-slate-200 font-semibold truncate">
                    {ch.characterName} <span className="text-slate-500">({ch.ascendancy})</span>
                  </span>
                  <span className="font-mono text-emerald-300 font-bold">Lvl {ch.level}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Host Event & Custom Award Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form
          onSubmit={handleGrantAward}
          className="rounded-3xl border border-amber-500/30 bg-slate-900/90 p-6 space-y-4 shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-amber-300">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Host Event & Custom Award Tool</span>
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
              <>
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
              </>
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
              <span>Announce award on Live League Feed & Root Webhook</span>
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

        {/* 3. Root / Discord Webhook Push Alerts */}
        <form
          onSubmit={handleSaveWebhook}
          className="rounded-3xl border border-indigo-500/30 bg-slate-900/90 p-6 space-y-4 shadow-xl"
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
      </div>
    </div>
  );
};
