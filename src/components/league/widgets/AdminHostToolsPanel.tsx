import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  CheckCircle2,
  Database,
  ExternalLink,
  Globe,
  Megaphone,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  Sliders,
  Sparkles,
  Star,
  Trash2,
  Users,
  Archive
} from 'lucide-react';
import type { SiteBannerConfig, SiteFeedbackItem } from '../../../types';
import { fetchCloudFeedback, saveCloudFeedbackItem } from '../../../services/cloudSync';

type PlatformAdminTab = 'platform' | 'banner' | 'site_ops' | 'security';

interface MacroLeagueSummary {
  id: string;
  name: string;
  game: 'poe1' | 'poe2';
  version: string;
  status: string;
  hostHandle: string;
  featured: boolean;
  archived: boolean;
  moderatorCount: number;
  playerCount: number;
  openWishes: number;
  isCore?: boolean;
}

interface PlatformMetrics {
  totalLeagues: number;
  activeLeagues: number;
  totalAccounts: number;
  totalRosterMembers: number;
  totalOpenWishes: number;
  totalFulfilledWishes: number;
  totalFarmingSessions: number;
  totalMapSessions: number;
  totalFeedback: number;
  openFeedback: number;
}

export interface AdminHostToolsPanelProps {
  securityCard?: React.ReactNode;
}

export const AdminHostToolsPanel: React.FC<AdminHostToolsPanelProps> = ({ securityCard }) => {
  const [subTab, setSubTab] = useState<PlatformAdminTab>('platform');
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<PlatformMetrics>({
    totalLeagues: 0,
    activeLeagues: 0,
    totalAccounts: 0,
    totalRosterMembers: 0,
    totalOpenWishes: 0,
    totalFulfilledWishes: 0,
    totalFarmingSessions: 0,
    totalMapSessions: 0,
    totalFeedback: 0,
    openFeedback: 0
  });
  const [leagues, setLeagues] = useState<MacroLeagueSummary[]>([]);
  const [leagueSearch, setLeagueSearch] = useState('');
  const [leagueNotice, setLeagueNotice] = useState<string | null>(null);
  const [reassigningId, setReassigningId] = useState<string | null>(null);
  const [reassignHostInput, setReassignHostInput] = useState<string>('');

  // Sitewide Notice Banner State
  const [banner, setBanner] = useState<SiteBannerConfig>({
    enabled: false,
    message: '',
    subtext: '',
    tone: 'indigo',
    linkLabel: '',
    linkUrl: ''
  });
  const [savingBanner, setSavingBanner] = useState(false);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  // Feedback & Edge Cache State
  const [feedbackItems, setFeedbackItems] = useState<SiteFeedbackItem[]>([]);
  const [cacheRunning, setCacheRunning] = useState<string | null>(null);
  const [cacheNotice, setCacheNotice] = useState<string | null>(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [ovRes, bannerRes, fb] = await Promise.all([
        fetch('/api/admin/overview', { credentials: 'include' }),
        fetch('/api/site-banner'),
        fetchCloudFeedback()
      ]);
      if (ovRes.ok) {
        const ov: any = await ovRes.json();
        if (ov?.metrics) setMetrics(ov.metrics);
        if (Array.isArray(ov?.leagues)) setLeagues(ov.leagues);
      }
      if (bannerRes.ok) {
        const b: any = await bannerRes.json();
        if (b?.banner) setBanner(b.banner);
      }
      if (Array.isArray(fb)) setFeedbackItems(fb);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const filteredLeagues = useMemo(() => {
    const q = leagueSearch.trim().toLowerCase();
    if (!q) return leagues;
    return leagues.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.id.toLowerCase().includes(q) ||
        l.hostHandle.toLowerCase().includes(q) ||
        l.game.toLowerCase().includes(q)
    );
  }, [leagues, leagueSearch]);

  const handleUpdateLeagueMacro = async (
    leagueId: string,
    patch: { status?: string; featured?: boolean; archived?: boolean; hostHandle?: string }
  ) => {
    setLeagueNotice(null);
    try {
      const res = await fetch('/api/admin/leagues/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ leagueId, ...patch })
      });
      if (res.ok) {
        setLeagues((prev) =>
          prev.map((l) => (l.id === leagueId ? { ...l, ...patch } : l))
        );
        setLeagueNotice(`Updated league "${leagueId}" in Cloudflare D1.`);
        setReassigningId(null);
        setReassignHostInput('');
      } else {
        setLeagueNotice('Could not update league. Verify Admin session.');
      }
    } catch {
      setLeagueNotice('Network error updating league.');
    }
    setTimeout(() => setLeagueNotice(null), 4000);
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBanner(true);
    setBannerNotice(null);
    try {
      const res = await fetch('/api/site-banner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(banner)
      });
      if (res.ok) {
        const d: any = await res.json();
        if (d?.banner) setBanner(d.banner);
        setBannerNotice(
          banner.enabled
            ? 'Sitewide Notice Banner is LIVE across all Exile SSF pages!'
            : 'Sitewide Notice Banner saved and paused.'
        );
      } else {
        setBannerNotice('Failed to save sitewide banner.');
      }
    } catch {
      setBannerNotice('Network error saving sitewide banner.');
    } finally {
      setSavingBanner(false);
      setTimeout(() => setBannerNotice(null), 4500);
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
      ninja: 'poe.ninja Prices & Icons',
      patch_poe1: 'PoE 1 Patch Notes',
      patch_poe2: 'PoE 2 Patch Notes',
      builds_poe1: 'PoE 1 External Builds',
      builds_poe2: 'PoE 2 External Builds'
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

  const handleDeleteFeedback = async (fbId: string) => {
    try {
      const res = await fetch(`/api/admin/feedback/${encodeURIComponent(fbId)}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        setFeedbackItems((prev) => prev.filter((it) => it.id !== fbId));
      }
    } catch {}
  };

  if (loading) {
    return (
      <div className="p-10 rounded-2xl border border-slate-800 bg-[#0d111a] text-center text-xs font-mono text-slate-400">
        Loading macro Exile SSF platform telemetry from Cloudflare D1...
      </div>
    );
  }

  return (
    <div className="space-y-5 w-full">
      {/* Macro Platform Navigation */}
      <nav className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-[#0d111a] p-2 shadow-lg">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: 'platform', label: `Platform & Leagues (${leagues.length})`, icon: Globe },
              { id: 'banner', label: `Sitewide Banner${banner.enabled ? ' • LIVE' : ''}`, icon: Megaphone },
              { id: 'site_ops', label: `Caches & Feedback (${feedbackItems.length})`, icon: Sliders },
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

        <button
          type="button"
          onClick={loadAll}
          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] font-mono font-bold text-slate-300 flex items-center gap-1.5 cursor-pointer"
        >
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span>Refresh D1 Telemetry</span>
        </button>
      </nav>

      {/* ================================================================= */}
      {/* TAB 1: MACRO PLATFORM OVERVIEW & ALL PRIVATE LEAGUES              */}
      {/* ================================================================= */}
      {subTab === 'platform' && (
        <div className="space-y-5">
          <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            <div className="rounded-2xl border border-indigo-500/25 bg-[#0d111a] p-4 space-y-1 shadow-lg">
              <div className="text-[10px] font-mono uppercase text-indigo-300">Private Leagues</div>
              <div className="text-2xl font-black font-mono text-white">{metrics.totalLeagues}</div>
              <div className="text-[10px] font-mono text-emerald-300">{metrics.activeLeagues} active</div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-[#0d111a] p-4 space-y-1 shadow-lg">
              <div className="text-[10px] font-mono uppercase text-slate-400">Exile Accounts</div>
              <div className="text-2xl font-black font-mono text-white">{metrics.totalAccounts}</div>
              <div className="text-[10px] font-mono text-slate-500">{metrics.totalRosterMembers} roster slots</div>
            </div>
            <div className="rounded-2xl border border-amber-500/25 bg-[#0d111a] p-4 space-y-1 shadow-lg">
              <div className="text-[10px] font-mono uppercase text-amber-300">Platform Wishes</div>
              <div className="text-2xl font-black font-mono text-amber-300">{metrics.totalOpenWishes}</div>
              <div className="text-[10px] font-mono text-emerald-300">{metrics.totalFulfilledWishes} fulfilled</div>
            </div>
            <div className="rounded-2xl border border-sky-500/25 bg-[#0d111a] p-4 space-y-1 shadow-lg">
              <div className="text-[10px] font-mono uppercase text-sky-300">Farm Sessions</div>
              <div className="text-2xl font-black font-mono text-sky-300">{metrics.totalFarmingSessions}</div>
              <div className="text-[10px] font-mono text-slate-500">Asset Tracker D1</div>
            </div>
            <div className="rounded-2xl border border-purple-500/25 bg-[#0d111a] p-4 space-y-1 shadow-lg">
              <div className="text-[10px] font-mono uppercase text-purple-300">Map Sessions</div>
              <div className="text-2xl font-black font-mono text-purple-300">{metrics.totalMapSessions}</div>
              <div className="text-[10px] font-mono text-slate-500">Map Tracker D1</div>
            </div>
            <div className="rounded-2xl border border-emerald-500/25 bg-[#0d111a] p-4 space-y-1 shadow-lg">
              <div className="text-[10px] font-mono uppercase text-emerald-300">Community Feedback</div>
              <div className="text-2xl font-black font-mono text-white">{metrics.totalFeedback}</div>
              <div className="text-[10px] font-mono text-amber-300">{metrics.openFeedback} open</div>
            </div>
          </section>

          {/* All Hosted Private Leagues Control Table */}
          <section className="rounded-2xl border border-slate-800 bg-[#0d111a] p-5 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
              <div>
                <h2 className="text-sm font-black font-cinzel text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-400" />
                  <span>All Private Leagues on Exile SSF</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Macro oversight across every hosted league. Individual league moderation, webhooks, and staff live inside each league's own <strong className="text-slate-200">Manage</strong> tab.
                </p>
              </div>
              <input
                type="text"
                value={leagueSearch}
                onChange={(e) => setLeagueSearch(e.target.value)}
                placeholder="Search league name, ID, or host..."
                className="w-full sm:w-64 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
              />
            </div>

            {leagueNotice && (
              <div className="px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-xs text-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{leagueNotice}</span>
              </div>
            )}

            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] font-mono uppercase text-slate-400 bg-slate-900/80">
                    <th className="py-2.5 px-3">League</th>
                    <th className="py-2.5 px-3">Host Admin</th>
                    <th className="py-2.5 px-3 text-center">Mods</th>
                    <th className="py-2.5 px-3 text-center">Players</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Macro Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {filteredLeagues.map((lg) => (
                    <tr key={lg.id} className="hover:bg-slate-900/50">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{lg.name}</span>
                          {lg.featured && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-[9px] font-mono font-bold text-amber-300">
                              FEATURED
                            </span>
                          )}
                          {lg.archived && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-500/20 border border-rose-400/40 text-[9px] font-mono font-bold text-rose-300">
                              ARCHIVED
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500">
                          {lg.game.toUpperCase()} • {lg.version} • <span className="text-slate-400">{lg.id}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-indigo-300">
                        {reassigningId === lg.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={reassignHostInput}
                              onChange={(e) => setReassignHostInput(e.target.value)}
                              placeholder="New host handle"
                              className="w-28 px-2 py-1 rounded-lg bg-slate-900 border border-amber-400/50 text-xs text-white"
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateLeagueMacro(lg.id, { hostHandle: reassignHostInput })}
                              className="px-2 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-[10px] cursor-pointer"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setReassigningId(null)}
                              className="text-[10px] text-slate-400 hover:text-white cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span>@{lg.hostHandle}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setReassigningId(lg.id);
                                setReassignHostInput(lg.hostHandle);
                              }}
                              className="text-[10px] text-slate-500 hover:text-amber-300 underline cursor-pointer"
                            >
                              Reassign
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-300">{lg.moderatorCount} / 3</td>
                      <td className="py-3 px-3 text-center font-mono text-slate-200">{lg.playerCount}</td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                            lg.status === 'Active'
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                              : lg.status === 'Upcoming'
                              ? 'bg-sky-500/15 border-sky-500/40 text-sky-300'
                              : 'bg-slate-800 border-slate-700 text-slate-400'
                          }`}
                        >
                          {lg.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateLeagueMacro(lg.id, { featured: !lg.featured })}
                            title="Toggle Featured"
                            className={`px-2 py-1 rounded-lg border text-[10px] font-bold flex items-center gap-1 cursor-pointer ${
                              lg.featured
                                ? 'bg-amber-500/20 border-amber-400/50 text-amber-200'
                                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                            }`}
                          >
                            <Star className="w-3 h-3" />
                            <span>{lg.featured ? 'Featured' : 'Feature'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateLeagueMacro(lg.id, {
                                archived: !lg.archived,
                                status: !lg.archived ? 'Archived' : 'Active'
                              })
                            }
                            className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-300 flex items-center gap-1 cursor-pointer"
                          >
                            <Archive className="w-3 h-3" />
                            <span>{lg.archived ? 'Restore' : 'Archive'}</span>
                          </button>
                          <a
                            href={`/league/${encodeURIComponent(lg.id)}/manage`}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600/25 hover:bg-indigo-600/40 border border-indigo-400/50 text-[10px] font-bold text-indigo-200 inline-flex items-center gap-1"
                          >
                            <span>Manage</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 2: SITEWIDE NOTICE BANNER EDITOR                              */}
      {/* ================================================================= */}
      {subTab === 'banner' && (
        <section className="rounded-2xl border border-slate-800 bg-[#0d111a] p-5 space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
            <div>
              <h2 className="text-base font-black font-cinzel text-white flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-amber-400" />
                <span>Sitewide Broadcast Banner</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Display a dismissible global banner across every page of Exile SSF for holidays, Path of Exile server maintenance, new league launches, or site updates.
              </p>
            </div>
            <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold cursor-pointer">
              <input
                type="checkbox"
                checked={banner.enabled}
                onChange={(e) => setBanner((prev) => ({ ...prev, enabled: e.target.checked }))}
              />
              <span className={banner.enabled ? 'text-emerald-300' : 'text-slate-400'}>
                {banner.enabled ? 'Banner Enabled (Live)' : 'Banner Paused'}
              </span>
            </label>
          </div>

          {/* Live Preview */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-mono uppercase text-slate-400">Live Preview</div>
            <div
              className={`rounded-xl border px-4 py-2.5 text-xs flex flex-wrap items-center justify-between gap-2 ${
                banner.tone === 'holiday'
                  ? 'bg-gradient-to-r from-amber-950/90 via-purple-950/90 to-emerald-950/90 border-amber-400/50 text-amber-100'
                  : banner.tone === 'amber'
                  ? 'bg-gradient-to-r from-amber-950/95 via-slate-900 to-amber-950/95 border-amber-500/45 text-amber-100'
                  : banner.tone === 'emerald'
                  ? 'bg-gradient-to-r from-emerald-950/95 via-slate-900 to-emerald-950/95 border-emerald-500/45 text-emerald-100'
                  : banner.tone === 'rose'
                  ? 'bg-gradient-to-r from-rose-950/95 via-slate-900 to-rose-950/95 border-rose-500/45 text-rose-100'
                  : 'bg-gradient-to-r from-indigo-950/95 via-slate-900 to-indigo-950/95 border-indigo-500/40 text-indigo-100'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                <span className="font-bold text-white">
                  {banner.message || 'Happy Holidays, Exiles! Thank you for farming with Exile SSF this season.'}
                </span>
                {banner.subtext && <span className="opacity-85 text-[11px]">{banner.subtext}</span>}
              </div>
              {banner.linkUrl && (
                <span className="px-2.5 py-1 rounded-lg bg-white/15 text-white text-[11px] font-bold">
                  {banner.linkLabel || 'Learn More'}
                </span>
              )}
            </div>
          </div>

          <form onSubmit={handleSaveBanner} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Banner Headline *</label>
                <input
                  type="text"
                  required={banner.enabled}
                  value={banner.message}
                  onChange={(e) => setBanner((prev) => ({ ...prev, message: e.target.value }))}
                  placeholder="e.g. Happy Thanksgiving Exiles! Or: GGG Maintenance at 8 PM EST"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Banner Theme</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {(
                    [
                      { id: 'indigo', label: 'Info' },
                      { id: 'amber', label: 'Maint.' },
                      { id: 'emerald', label: 'Event' },
                      { id: 'rose', label: 'Urgent' },
                      { id: 'holiday', label: 'Holiday' }
                    ] as const
                  ).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setBanner((prev) => ({ ...prev, tone: t.id }))}
                      className={`py-2 rounded-xl border text-[11px] font-bold cursor-pointer ${
                        banner.tone === t.id
                          ? 'bg-indigo-600/30 border-indigo-400 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">Optional Subtext</label>
              <input
                type="text"
                value={banner.subtext || ''}
                onChange={(e) => setBanner((prev) => ({ ...prev, subtext: e.target.value }))}
                placeholder="Additional details shown beside the headline..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Optional Button Label</label>
                <input
                  type="text"
                  value={banner.linkLabel || ''}
                  onChange={(e) => setBanner((prev) => ({ ...prev, linkLabel: e.target.value }))}
                  placeholder="e.g. Read Changelog"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Optional Button URL</label>
                <input
                  type="text"
                  value={banner.linkUrl || ''}
                  onChange={(e) => setBanner((prev) => ({ ...prev, linkUrl: e.target.value }))}
                  placeholder="/feedback or https://..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono"
                />
              </div>
            </div>

            {bannerNotice && (
              <div className="px-3.5 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{bannerNotice}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={savingBanner}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black flex items-center gap-2 cursor-pointer shadow disabled:opacity-50"
            >
              <Megaphone className="w-4 h-4" />
              <span>{savingBanner ? 'Publishing...' : 'Save & Publish Sitewide Banner'}</span>
            </button>
          </form>
        </section>
      )}

      {/* ================================================================= */}
      {/* TAB 3: EDGE CACHES & COMMUNITY FEEDBACK TRIAGE                    */}
      {/* ================================================================= */}
      {subTab === 'site_ops' && (
        <div className="space-y-5">
          <section className="rounded-2xl border border-slate-800 bg-[#0d111a] p-5 space-y-3.5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-emerald-300">
                <RefreshCw className="w-4 h-4 text-emerald-400" />
                <span>Cloudflare KV Edge Cache Controls</span>
              </div>
              <span className="text-[11px] font-mono text-slate-500">Force live upstream refreshes across the entire platform</span>
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
                  className="px-3 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
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

          <section className="rounded-2xl border border-slate-800 bg-[#0d111a] p-5 space-y-3.5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-amber-300">
                <MessageSquare className="w-4 h-4 text-amber-400" />
                <span>Global Community Feedback Moderation ({feedbackItems.length})</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">Live Cloudflare D1 Queue</span>
            </div>

            {feedbackItems.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-500">
                No community feedback submissions yet. Real user requests from <code className="text-slate-300">/feedback</code> appear here for moderation.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                {feedbackItems.map((fb) => (
                  <div key={fb.id} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white">{fb.title}</div>
                        <div className="text-[10px] font-mono text-slate-500">
                          @{fb.authorDisplayName} • {fb.createdAt} • {fb.upvotes || 0} upvotes
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <select
                          value={fb.status}
                          onChange={(e) => handleUpdateFeedbackStatus(fb, e.target.value as SiteFeedbackItem['status'])}
                          className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[10px] font-mono font-bold text-amber-200 cursor-pointer"
                        >
                          <option value="under_review">Under Review</option>
                          <option value="planned">Planned</option>
                          <option value="in_progress">In Progress</option>
                          <option value="implemented">Implemented</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => handleDeleteFeedback(fb.id)}
                          title="Delete feedback entry"
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-500/20 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400">{fb.description}</p>
                  </div>
                ))}
              </div>
            )}
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
              <span>Platform Security Posture</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                <span>HMAC Session Signing</span>
                <span className="font-mono text-emerald-300 font-bold">Fail Closed (Cloudflare Secret)</span>
              </li>
              <li className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                <span>Per League Role Isolation</span>
                <span className="font-mono text-emerald-300 font-bold">Host + Max 3 Mods per League</span>
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
            <div className="pt-2 flex items-center gap-2 text-[11px] font-mono text-slate-500">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>League specific moderation lives inside each league's Manage tab.</span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
