import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Award,
  BellRing,
  CheckCircle2,
  Crown,
  FileSpreadsheet,
  Megaphone,
  Plus,
  RefreshCw,
  Save,
  Shield,
  ShieldCheck,
  Sparkles,
  Trash2,
  Trophy,
  Users
} from 'lucide-react';
import type {
  LeagueRosterMember,
  LeagueStaffMember,
  LeagueStaffPermissions,
  LookingForItem,
  UserAccount
} from '../../../types';
import {
  saveCloudAchievementProfile,
  saveCloudFeedEvent
} from '../../../services/cloudSync';
import { ACHIEVEMENT_CATALOG, formatLeagueLabel } from '../../../utils/achievements';
import { getMemberCharacters } from './RosterTab';
import { exportLeagueToXlsx, downloadStarterSheetTemplate } from '../../../utils/spreadsheetEngine';
import { fireConfetti } from '../../../utils/confetti';

const WEBHOOK_EVENT_OPTIONS: { id: string; label: string }[] = [
  { id: 'bounty_listed', label: 'New Chase Bounties' },
  { id: 'item_fulfilled', label: 'Squad Drop Fulfillments' },
  { id: 'boss_rota', label: 'Boss Rotations Hosted' },
  { id: 'league_first', label: 'League Firsts Claimed' },
  { id: 'achievement_earned', label: 'Achievements Unlocked' },
  { id: 'roster_join', label: 'New Exiles Joined' },
  { id: 'character_posted', label: 'Level 90/95/100 Milestones' }
];

const DEFAULT_MOD_PERMS: LeagueStaffPermissions = {
  canManageRoster: true,
  canManageWishlists: true,
  canManageAwards: true,
  canBroadcast: true,
  canEditWebhook: false,
  canEditBannerAndLinks: false
};

interface LeagueManageTabProps {
  leagueId: string;
  leagueName: string;
  patchVersion: string;
  officialLeagueUrl?: string;
  roster: LeagueRosterMember[];
  wishlist: LookingForItem[];
  staff: LeagueStaffMember[];
  setStaff: React.Dispatch<React.SetStateAction<LeagueStaffMember[]>>;
  currentUser: UserAccount | null;
  isSuperAdmin: boolean;
  isLeagueHost: boolean;
  myModPermissions: LeagueStaffPermissions | null;
  onRefreshLadder?: () => Promise<void>;
  onOpenContentManager?: () => void;
}

export const LeagueManageTab: React.FC<LeagueManageTabProps> = ({
  leagueId,
  leagueName,
  patchVersion,
  officialLeagueUrl,
  roster,
  wishlist,
  staff,
  setStaff,
  currentUser,
  isSuperAdmin,
  isLeagueHost,
  myModPermissions,
  onRefreshLadder,
  onOpenContentManager
}) => {
  const canEditStaff = isSuperAdmin || isLeagueHost;
  const canEditWebhook = isSuperAdmin || isLeagueHost || Boolean(myModPermissions?.canEditWebhook);
  const canEditBanner = isSuperAdmin || isLeagueHost || Boolean(myModPermissions?.canEditBannerAndLinks);
  const canManageAwards = isSuperAdmin || isLeagueHost || Boolean(myModPermissions?.canManageAwards);
  const canBroadcast = isSuperAdmin || isLeagueHost || Boolean(myModPermissions?.canBroadcast);

  const [section, setSection] = useState<'health' | 'staff' | 'awards' | 'webhook'>('health');
  const [notice, setNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [syncingLadder, setSyncingLadder] = useState(false);

  // Staff editor local state
  const [savingStaff, setSavingStaff] = useState(false);
  const [newModHandle, setNewModHandle] = useState('');
  const [newModTitle, setNewModTitle] = useState('League Moderator');
  const [newModDiscord, setNewModDiscord] = useState('');
  const [newModRoot, setNewModRoot] = useState('');
  const [newModEmail, setNewModEmail] = useState('');
  const [newModPerms, setNewModPerms] = useState<LeagueStaffPermissions>({ ...DEFAULT_MOD_PERMS });

  // Awards & Broadcast state
  const [selectedHandle, setSelectedHandle] = useState(roster[0]?.displayName || '');
  const [awardMode, setAwardMode] = useState<'honor' | 'achievement'>('honor');
  const [honorPoints, setHonorPoints] = useState(25);
  const [honorReason, setHonorReason] = useState('');
  const [selectedAchId, setSelectedAchId] = useState(
    ACHIEVEMENT_CATALOG[ACHIEVEMENT_CATALOG.length - 2]?.id || 'league_join_poe1-330-umbra'
  );
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastDetail, setBroadcastDetail] = useState('');

  // Per League Webhook state
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
  const [savingWebhook, setSavingWebhook] = useState(false);

  useEffect(() => {
    if (!selectedHandle && roster.length > 0) setSelectedHandle(roster[0].displayName);
  }, [roster, selectedHandle]);

  useEffect(() => {
    if (!canEditWebhook) return;
    let cancelled = false;
    fetch(`/api/league/${encodeURIComponent(leagueId)}/webhook`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: any) => {
        if (!cancelled && d?.config) {
          setWebhookUrl(String(d.config.url || ''));
          setWebhookEnabled(Boolean(d.config.enabled));
          if (Array.isArray(d.config.events) && d.config.events.length > 0) {
            setWebhookEvents(d.config.events);
          }
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [leagueId, canEditWebhook]);

  const showTempNotice = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setNotice({ type, text: msg });
    setTimeout(() => setNotice(null), 5000);
  };

  const health = useMemo(() => {
    const allChars = roster.flatMap((m) => getMemberCharacters(m));
    const uniqueMap = new Map<string, (typeof allChars)[number]>();
    for (const ch of allChars) {
      const k = String(ch.characterName || '').replace(/\s+/g, ' ').trim().toLowerCase();
      if (!k) continue;
      const prev = uniqueMap.get(k);
      if (!prev || (Number(ch.level) || 0) > (Number(prev.level) || 0)) uniqueMap.set(k, ch);
    }
    const openWishes = wishlist.filter((w) => w.status !== 'HAVE');
    const fulfilledWishes = wishlist.filter((w) => w.status === 'HAVE');
    const catCounts = new Map<string, number>();
    for (const w of openWishes) catCounts.set(w.category, (catCounts.get(w.category) || 0) + 1);
    return {
      totalExiles: roster.length,
      totalChars: uniqueMap.size,
      openWishCount: openWishes.length,
      fulfilledCount: fulfilledWishes.length,
      topBottlenecks: Array.from(catCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5),
      topLevelChars: Array.from(uniqueMap.values()).sort((a, b) => (Number(b.level) || 0) - (Number(a.level) || 0)).slice(0, 5)
    };
  }, [roster, wishlist]);

  const moderators = useMemo(() => staff.filter((s) => s.role === 'moderator'), [staff]);
  const hostMember = useMemo(() => staff.find((s) => s.role === 'host') || null, [staff]);

  const persistStaff = async (nextStaff: LeagueStaffMember[]) => {
    setSavingStaff(true);
    try {
      const res = await fetch(`/api/league/${encodeURIComponent(leagueId)}/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ staff: nextStaff })
      });
      if (res.ok) {
        const d: any = await res.json();
        if (Array.isArray(d?.staff)) setStaff(d.staff);
        showTempNotice('League staff, contacts, and moderator permissions saved to Cloudflare D1!', 'ok');
      } else {
        const err: any = await res.json().catch(() => ({}));
        if (res.status === 401 && typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('exile:session-expired'));
        }
        showTempNotice(err?.error || 'Could not save league staff.', 'err');
      }
    } catch {
      showTempNotice('Network error saving league staff.', 'err');
    } finally {
      setSavingStaff(false);
    }
  };

  const handleAddModerator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModHandle.trim() || moderators.length >= 3) return;
    const cleanHandle = newModHandle.trim().replace(/^@/, '');
    if (staff.some((s) => s.handle.toLowerCase() === cleanHandle.toLowerCase())) {
      showTempNotice(`@${cleanHandle} is already on the league staff team.`);
      return;
    }
    const newMod: LeagueStaffMember = {
      id: `staff-mod-${Date.now()}`,
      handle: cleanHandle,
      role: 'moderator',
      title: newModTitle.trim() || 'League Moderator',
      contact: {
        discord: newModDiscord.trim() || undefined,
        root: newModRoot.trim() || undefined,
        email: newModEmail.trim() || undefined
      },
      permissions: { ...newModPerms },
      addedBy: currentUser?.displayName || 'Host',
      addedAtIso: new Date().toISOString()
    };
    const next = [...staff, newMod];
    setStaff(next);
    await persistStaff(next);
    setNewModHandle('');
    setNewModDiscord('');
    setNewModRoot('');
    setNewModEmail('');
    setNewModPerms({ ...DEFAULT_MOD_PERMS });
  };

  const handleToggleModPermission = async (modId: string, permKey: keyof LeagueStaffPermissions) => {
    const next = staff.map((s) =>
      s.id === modId ? { ...s, permissions: { ...s.permissions, [permKey]: !s.permissions[permKey] } } : s
    );
    setStaff(next);
    await persistStaff(next);
  };

  const handleUpdateStaffContact = (memberId: string, field: 'email' | 'discord' | 'root' | 'title', val: string) => {
    setStaff((prev) =>
      prev.map((s) => {
        if (s.id !== memberId) return s;
        if (field === 'title') return { ...s, title: val };
        return { ...s, contact: { ...(s.contact || {}), [field]: val } };
      })
    );
  };

  const handleRemoveModerator = async (modId: string) => {
    const next = staff.filter((s) => s.id !== modId);
    setStaff(next);
    await persistStaff(next);
  };

  const handleGrantAward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHandle || !canManageAwards) return;
    const member = roster.find((m) => m.displayName.toLowerCase() === selectedHandle.toLowerCase());
    const keys = new Set<string>([selectedHandle.trim().toLowerCase()]);
    if (member?.poeAccountName) keys.add(member.poeAccountName.trim().toLowerCase());
    const nowIso = new Date().toISOString();

    if (awardMode === 'honor') {
      const reason = honorReason.trim() || 'League Event Award';
      for (const pk of keys) {
        await saveCloudAchievementProfile(pk, {
          unlockedIds: {},
          lifetimeFulfilledCount: 0,
          lifetimeBountiesClaimed: 0,
          lifetimeBountiesPaid: 0,
          leaguesParticipated: [leagueId],
          honorLog: [
            {
              id: `honor-host-${Date.now()}`,
              points: Number(honorPoints) || 10,
              reason: `Host Event Award: ${reason}`,
              where: `${formatLeagueLabel(leagueId)} • League Staff`,
              timestampIso: nowIso,
              kind: 'achievement'
            }
          ]
        });
      }
      await saveCloudFeedEvent(leagueId, {
        id: `feed_award_${Date.now()}`,
        leagueId,
        type: 'achievement_earned',
        actorHandle: selectedHandle,
        title: `Awarded +${honorPoints} Bonus Honor Points: ${reason}`,
        detail: `Granted by @${currentUser?.displayName || 'League Staff'}`,
        targetTab: 'bounties',
        createdAtIso: nowIso
      });
      fireConfetti();
      setHonorReason('');
      showTempNotice(`Granted +${honorPoints} Honor Points to @${selectedHandle}!`);
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
              where: `${formatLeagueLabel(leagueId)} • League Staff`,
              timestampIso: nowIso,
              kind: 'achievement'
            }
          ]
        });
      }
      fireConfetti();
      showTempNotice(`Granted "${ach.title}" to @${selectedHandle}!`);
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !canBroadcast) return;
    await saveCloudFeedEvent(leagueId, {
      id: `feed_staff_${Date.now()}`,
      leagueId,
      type: 'league_first',
      actorHandle: currentUser?.displayName || 'Host',
      title: `League Announcement: ${broadcastTitle.trim()}`,
      detail: broadcastDetail.trim() || `Posted by ${leagueName} Staff`,
      targetTab: 'feed',
      createdAtIso: new Date().toISOString()
    });
    setBroadcastTitle('');
    setBroadcastDetail('');
    showTempNotice('Announcement posted to this league\'s Live Feed & Webhook!');
  };

  const handleSaveLeagueWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingWebhook(true);
    try {
      const res = await fetch(`/api/league/${encodeURIComponent(leagueId)}/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ url: webhookUrl.trim(), enabled: webhookEnabled, events: webhookEvents })
      });
      if (res.ok) showTempNotice('League webhook saved to Cloudflare D1!');
      else {
        const d: any = await res.json().catch(() => ({}));
        showTempNotice(d?.error || 'Could not save league webhook.');
      }
    } catch {
      showTempNotice('Network error saving league webhook.');
    } finally {
      setSavingWebhook(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header & Role Pill */}
      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-[#0e1320] via-indigo-950/30 to-[#0e1320] p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-lg">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-black font-cinzel text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <span>League Management Console</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border bg-amber-500/15 border-amber-400/40 text-amber-200">
              {isSuperAdmin ? 'Site Super Admin' : isLeagueHost ? 'League Host Admin' : 'League Moderator'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Scoped exclusively to <strong className="text-slate-200">{leagueName || leagueId}</strong>. Manage staff (up to 3 moderators), per moderator permissions, exports, awards, and webhooks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
          {(
            [
              { id: 'health', label: 'Health & Exports', icon: Activity },
              { id: 'staff', label: `Staff & Mods (${moderators.length}/3)`, icon: Shield },
              ...(canManageAwards || canBroadcast ? [{ id: 'awards' as const, label: 'Awards & Feed', icon: Trophy }] : []),
              ...(canEditWebhook ? [{ id: 'webhook' as const, label: 'League Webhook', icon: BellRing }] : [])
            ] as const
          ).map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSection(t.id)}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer ${
                  section === t.id ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {notice && (
        <div
          className={`px-4 py-2.5 rounded-xl border text-xs flex items-center gap-2 ${
            notice.type === 'ok'
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-500/15 border-rose-500/40 text-rose-200'
          }`}
        >
          <CheckCircle2 className={`w-4 h-4 shrink-0 ${notice.type === 'ok' ? 'text-emerald-400' : 'text-rose-400'}`} />
          <span>{notice.text}</span>
        </div>
      )}

      {/* SUBTAB 1: HEALTH & QUICK EXPORTS */}
      {section === 'health' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-[#0d111a] border border-slate-800">
              <div className="text-[10px] font-mono uppercase text-slate-400">Roster Slots</div>
              <div className="text-2xl font-black font-mono text-white">{health.totalExiles}</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#0d111a] border border-slate-800">
              <div className="text-[10px] font-mono uppercase text-sky-300">Tracked Characters</div>
              <div className="text-2xl font-black font-mono text-sky-300">{health.totalChars}</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#0d111a] border border-slate-800">
              <div className="text-[10px] font-mono uppercase text-amber-300">Open Wishes</div>
              <div className="text-2xl font-black font-mono text-amber-300">{health.openWishCount}</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#0d111a] border border-slate-800">
              <div className="text-[10px] font-mono uppercase text-emerald-300">Fulfilled Drops</div>
              <div className="text-2xl font-black font-mono text-emerald-300">{health.fulfilledCount}</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-slate-800 bg-[#0d111a] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>League Operations: Sync ladder, export workbook, or edit banner &amp; links.</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {onRefreshLadder && (
                <button
                  type="button"
                  disabled={syncingLadder}
                  onClick={async () => {
                    setSyncingLadder(true);
                    await onRefreshLadder();
                    setSyncingLadder(false);
                    showTempNotice('Official PoE ladder synced!');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600/25 hover:bg-indigo-600/40 border border-indigo-400/50 text-indigo-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncingLadder ? 'animate-spin' : ''}`} />
                  <span>Force Ladder Sync</span>
                </button>
              )}
              {canEditBanner && onOpenContentManager && (
                <button
                  type="button"
                  onClick={onOpenContentManager}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-200 text-xs font-bold cursor-pointer"
                >
                  Edit Banner &amp; Links
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  const res = exportLeagueToXlsx({ leagueId, leagueName, patchVersion, officialLeagueUrl, roster, wishlist });
                  showTempNotice(`Downloaded "${res.filename}" (${res.tabCount} tabs).`);
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer shadow"
              >
                Export Live League (.xlsx)
              </button>
              <button
                type="button"
                onClick={() => {
                  downloadStarterSheetTemplate();
                  showTempNotice('Downloaded Blank Starter Sheet (.xlsx).');
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 text-xs font-bold cursor-pointer"
              >
                Starter Sheet
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border border-slate-800 bg-[#0d111a] space-y-2.5">
              <div className="text-xs font-mono font-bold uppercase text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Top Wishlist Bottlenecks</span>
              </div>
              {health.topBottlenecks.length === 0 ? (
                <div className="text-xs text-slate-500">No open bottlenecks right now.</div>
              ) : (
                health.topBottlenecks.map(([cat, count]) => (
                  <div key={cat} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/60 last:border-b-0">
                    <span className="text-slate-200 font-semibold">{cat}</span>
                    <span className="font-mono text-amber-300 font-bold">{count} needed</span>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 rounded-2xl border border-slate-800 bg-[#0d111a] space-y-2.5">
              <div className="text-xs font-mono font-bold uppercase text-indigo-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>Highest Level Characters</span>
              </div>
              {health.topLevelChars.map((ch) => (
                <div key={ch.id || ch.characterName} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/60 last:border-b-0">
                  <span className="text-slate-200 font-semibold truncate">
                    {ch.characterName} <span className="text-slate-500">({ch.ascendancy})</span>
                  </span>
                  <span className="font-mono text-emerald-300 font-bold">Lvl {ch.level}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: STAFF & MODERATOR MANAGER (MAX 3 MODS + PER MOD PERMISSIONS) */}
      {section === 'staff' && (
        <div className="space-y-5">
          {/* Host Contact Settings */}
          {hostMember && (
            <div className="rounded-2xl border border-amber-500/35 bg-[#0d111a] p-5 space-y-3 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-amber-300">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span>League Host Admin (@{hostMember.handle}) Contact Info</span>
                </div>
                {canEditStaff && (
                  <button
                    type="button"
                    disabled={savingStaff}
                    onClick={() => persistStaff(staff)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{savingStaff ? 'Saving...' : 'Save Contact Info'}</span>
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">Role Title</label>
                  <input
                    type="text"
                    disabled={!canEditStaff}
                    value={hostMember.title || ''}
                    onChange={(e) => handleUpdateStaffContact(hostMember.id, 'title', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">Root Handle / Server URL</label>
                  <input
                    type="text"
                    disabled={!canEditStaff}
                    value={hostMember.contact?.root || ''}
                    onChange={(e) => handleUpdateStaffContact(hostMember.id, 'root', e.target.value)}
                    placeholder="Root handle or invite URL"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-emerald-200 disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">Discord Handle</label>
                  <input
                    type="text"
                    disabled={!canEditStaff}
                    value={hostMember.contact?.discord || ''}
                    onChange={(e) => handleUpdateStaffContact(hostMember.id, 'discord', e.target.value)}
                    placeholder="@username"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-indigo-200 disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">Contact Email</label>
                  <input
                    type="email"
                    disabled={!canEditStaff}
                    value={hostMember.contact?.email || ''}
                    onChange={(e) => handleUpdateStaffContact(hostMember.id, 'email', e.target.value)}
                    placeholder="host@example.com"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sky-200 disabled:opacity-60"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Active Moderators List (Max 3) with Per Moderator Permission Toggles */}
          <div className="rounded-2xl border border-slate-800 bg-[#0d111a] p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="text-xs font-mono font-bold uppercase text-indigo-300 flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-400" />
                <span>League Moderators ({moderators.length} / 3 Slots Used)</span>
              </div>
              <span className="text-[11px] text-slate-400">Host decides Webhook and Banner permissions per moderator</span>
            </div>

            {moderators.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                No moderators nominated yet. Use the form below to nominate up to 3 league moderators.
              </div>
            ) : (
              <div className="space-y-3">
                {moderators.map((mod) => (
                  <div key={mod.id} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-sm font-black text-white">@{mod.handle}</span>
                        <span className="ml-2 text-xs text-slate-400">{mod.title || 'League Moderator'}</span>
                      </div>
                      {canEditStaff && (
                        <button
                          type="button"
                          onClick={() => handleRemoveModerator(mod.id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove Mod</span>
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5 text-[11px]">
                      {(
                        [
                          { k: 'canEditWebhook', label: 'Edit League Webhook' },
                          { k: 'canEditBannerAndLinks', label: 'Edit Banner & Links' },
                          { k: 'canManageAwards', label: 'Grant Event Awards' },
                          { k: 'canBroadcast', label: 'Post Announcements' },
                          { k: 'canManageRoster', label: 'Manage Roster' },
                          { k: 'canManageWishlists', label: 'Manage Wishlists' }
                        ] as const
                      ).map((perm) => {
                        const enabled = Boolean(mod.permissions?.[perm.k]);
                        return (
                          <button
                            key={perm.k}
                            type="button"
                            disabled={!canEditStaff}
                            onClick={() => handleToggleModPermission(mod.id, perm.k)}
                            className={`px-2.5 py-1 rounded-lg border font-semibold transition-colors ${
                              canEditStaff ? 'cursor-pointer' : 'cursor-default'
                            } ${
                              enabled
                                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            {enabled ? '✓ ' : ''}
                            {perm.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Nominate New Moderator Form (Host Admin Only, Max 3) */}
            {canEditStaff && moderators.length < 3 && (
              <form onSubmit={handleAddModerator} className="pt-4 border-t border-slate-800 space-y-3 text-xs">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>Nominate New Moderator ({3 - moderators.length} slots remaining)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                  <input
                    type="text"
                    required
                    list="league-roster-handles"
                    value={newModHandle}
                    onChange={(e) => setNewModHandle(e.target.value)}
                    placeholder="Exile handle (e.g. Venulum)"
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                  <datalist id="league-roster-handles">
                    {roster.map((m) => (
                      <option key={m.id} value={m.displayName} />
                    ))}
                  </datalist>
                  <input
                    type="text"
                    value={newModTitle}
                    onChange={(e) => setNewModTitle(e.target.value)}
                    placeholder="Role Title"
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                  />
                  <input
                    type="text"
                    value={newModRoot}
                    onChange={(e) => setNewModRoot(e.target.value)}
                    placeholder="Root handle / link"
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-emerald-200"
                  />
                  <input
                    type="text"
                    value={newModDiscord}
                    onChange={(e) => setNewModDiscord(e.target.value)}
                    placeholder="Discord @handle"
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-indigo-200"
                  />
                  <input
                    type="email"
                    value={newModEmail}
                    onChange={(e) => setNewModEmail(e.target.value)}
                    placeholder="Email (optional)"
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sky-200"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Grant Permissions:</span>
                  {(
                    [
                      { k: 'canEditWebhook', label: 'Edit Webhook' },
                      { k: 'canEditBannerAndLinks', label: 'Edit Banner & Links' },
                      { k: 'canManageAwards', label: 'Event Awards' },
                      { k: 'canBroadcast', label: 'Announcements' }
                    ] as const
                  ).map((p) => (
                    <label key={p.k} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newModPerms[p.k]}
                        onChange={(e) => setNewModPerms((prev) => ({ ...prev, [p.k]: e.target.checked }))}
                      />
                      <span>{p.label}</span>
                    </label>
                  ))}
                  <button
                    type="submit"
                    disabled={savingStaff}
                    className="ml-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer shadow"
                  >
                    + Add Moderator
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 3: AWARDS & LEAGUE ANNOUNCEMENTS */}
      {section === 'awards' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {canManageAwards && (
            <form onSubmit={handleGrantAward} className="rounded-2xl border border-slate-800 bg-[#0d111a] p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-amber-300">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Grant Event Award</span>
                </div>
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setAwardMode('honor')}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer ${
                      awardMode === 'honor' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                    }`}
                  >
                    Honor Pts
                  </button>
                  <button
                    type="button"
                    onClick={() => setAwardMode('achievement')}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer ${
                      awardMode === 'achievement' ? 'bg-purple-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    Achievement
                  </button>
                </div>
              </div>
              <div className="space-y-3 text-xs">
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
                {awardMode === 'honor' ? (
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      min={1}
                      max={500}
                      value={honorPoints}
                      onChange={(e) => setHonorPoints(Number(e.target.value))}
                      className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                    />
                    <input
                      type="text"
                      required
                      value={honorReason}
                      onChange={(e) => setHonorReason(e.target.value)}
                      placeholder="Award reason..."
                      className="col-span-2 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                    />
                  </div>
                ) : (
                  <select
                    value={selectedAchId}
                    onChange={(e) => setSelectedAchId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-purple-200"
                  >
                    {ACHIEVEMENT_CATALOG.map((ach) => (
                      <option key={ach.id} value={ach.id}>
                        {ach.title} (+{ach.points} pts)
                      </option>
                    ))}
                  </select>
                )}
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black cursor-pointer shadow"
                >
                  {awardMode === 'honor' ? `Grant +${honorPoints} Honor Points` : 'Grant Achievement'}
                </button>
              </div>
            </form>
          )}

          {canBroadcast && (
            <form onSubmit={handleBroadcast} className="rounded-2xl border border-slate-800 bg-[#0d111a] p-5 space-y-4 shadow-xl">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-sky-300 border-b border-slate-800 pb-3">
                <Megaphone className="w-4 h-4 text-sky-400" />
                <span>Post League Announcement</span>
              </div>
              <div className="space-y-3 text-xs">
                <input
                  type="text"
                  required
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="Headline (e.g. Boss Carry Night at 8 PM EST)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
                <textarea
                  rows={3}
                  value={broadcastDetail}
                  onChange={(e) => setBroadcastDetail(e.target.value)}
                  placeholder="Details, channel, or event rules..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 resize-none"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black cursor-pointer shadow"
                >
                  Publish to Live League Feed
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* SUBTAB 4: PER LEAGUE WEBHOOK */}
      {section === 'webhook' && canEditWebhook && (
        <form onSubmit={handleSaveLeagueWebhook} className="rounded-2xl border border-slate-800 bg-[#0d111a] p-5 space-y-4 shadow-xl max-w-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-indigo-300">
              <BellRing className="w-4 h-4 text-indigo-400" />
              <span>{leagueName} Webhook Alerts</span>
            </div>
            <label className="inline-flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={webhookEnabled}
                onChange={(e) => setWebhookEnabled(e.target.checked)}
              />
              <span>{webhookEnabled ? 'Enabled' : 'Paused'}</span>
            </label>
          </div>
          <div className="space-y-3 text-xs">
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://discord.com/api/webhooks/... or Root Webhook URL"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono"
            />
            <div className="grid grid-cols-2 gap-1.5">
              {WEBHOOK_EVENT_OPTIONS.map((opt) => {
                const active = webhookEvents.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      setWebhookEvents((prev) =>
                        prev.includes(opt.id) ? prev.filter((x) => x !== opt.id) : [...prev, opt.id]
                      )
                    }
                    className={`text-left px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold cursor-pointer ${
                      active ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-200' : 'bg-slate-950 border-slate-800 text-slate-500'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <button
              type="submit"
              disabled={savingWebhook}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black flex items-center gap-1.5 cursor-pointer shadow"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingWebhook ? 'Saving...' : 'Save League Webhook'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
