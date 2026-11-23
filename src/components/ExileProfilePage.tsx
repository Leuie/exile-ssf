import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Award,
  Coins,
  Copy,
  Edit3,
  ExternalLink,
  Globe,
  MessageSquare,
  Save,
  ShieldCheck,
  Sparkles,
  Star,
  Swords,
  Trophy,
  Users,
  X,
  Package,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type { ExileProfile, UserAccount, PersonalSessionGoal } from '../types';
import {
  fetchCloudProfile,
  saveCloudProfile,
  saveCloudAchievementProfile,
  type CloudExileProfileResponse
} from '../services/cloudSync';
import { getMemberCharacters } from './league/tabs/RosterTab';
import { MapRegexBuilder } from './league/widgets/MapRegexBuilder';
import { SessionScratchpad } from './league/widgets/SessionScratchpad';
import { CharacterPaperdollView } from './profile/CharacterPaperdollView';
import { ACHIEVEMENT_CATALOG, buildRetroactiveHonorHistory, HONOR_PER_ITEM_FOUND } from '../utils/achievements';
import { fireConfetti } from '../utils/confetti';

export interface ExileProfilePageProps {
  handle: string;
  userAccount?: UserAccount | null;
  onBack: () => void;
  onNavigateLeague?: (leagueId: string, subTab?: string) => void;
  onOpenAccountSettings?: () => void;
}

export const ExileProfilePage: React.FC<ExileProfilePageProps> = ({
  handle,
  userAccount,
  onBack,
  onNavigateLeague,
  onOpenAccountSettings
}) => {
  const [data, setData] = useState<CloudExileProfileResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [avatarError, setAvatarError] = useState<boolean>(false);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);
  const [gameScope, setGameScope] = useState<'all' | 'poe1' | 'poe2'>('all');
  const [farmingSessions, setFarmingSessions] = useState<any[]>([]);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('exile_ssf_profile_collapsed_v1');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleProfileSection = (key: string) => {
    setCollapsedSections((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem('exile_ssf_profile_collapsed_v1', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const setAllProfileSections = (collapsed: boolean) => {
    const next: Record<string, boolean> = {
      character: collapsed,
      roster: collapsed,
      wishlists: collapsed,
      services: collapsed,
      achievements: collapsed,
      toolkit: collapsed,
      farming: collapsed,
      honor: collapsed
    };
    setCollapsedSections(next);
    try {
      localStorage.setItem('exile_ssf_profile_collapsed_v1', JSON.stringify(next));
    } catch {}
  };

  // Inline Profile Editor State
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editAvatarUrl, setEditAvatarUrl] = useState<string>('');
  const [editBio, setEditBio] = useState<string>('');
  const [editTimezone, setEditTimezone] = useState<string>('');
  const [editPoeAccount, setEditPoeAccount] = useState<string>('');
  const [editPoeUrl, setEditPoeUrl] = useState<string>('');
  const [editDiscord, setEditDiscord] = useState<string>('');
  const [editTwitch, setEditTwitch] = useState<string>('');
  const [editFavClass, setEditFavClass] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);

  const cleanHandle = handle.trim().replace(/^@/, '');

  useEffect(() => {
    document.title = `@${cleanHandle} | Exile Profile | Exile SSF`;
    let cancelled = false;
    setLoading(true);
    setAvatarError(false);

    fetchCloudProfile(cleanHandle).then((res) => {
      if (!cancelled) {
        setData(res);
        if (res?.profile) {
          setEditAvatarUrl(res.profile.avatarUrl || '');
          setEditBio(res.profile.bio || '');
          setEditTimezone(res.profile.timezone || '');
          setEditPoeAccount(res.profile.poeAccountName || '');
          setEditPoeUrl(res.profile.poeProfileUrl || '');
          setEditDiscord(res.profile.discordHandle || '');
          setEditTwitch(res.profile.twitchUrl || '');
          setEditFavClass(res.profile.favoriteClass || '');
        }
        setLoading(false);
      }
    });

    fetch(`/api/farming/sessions?handle=${encodeURIComponent(cleanHandle.toLowerCase())}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((res: any) => {
        if (!cancelled && Array.isArray(res?.sessions)) {
          setFarmingSessions(res.sessions);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [cleanHandle]);

  const triggerCopy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    setCopyNotice(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopyNotice(null), 2500);
  };

  const canEdit = Boolean(
    userAccount &&
      (userAccount.isAdmin ||
        userAccount.displayName.toLowerCase() === 'leuie' ||
        userAccount.displayName.toLowerCase() === cleanHandle.toLowerCase() ||
        (data?.profile?.handle &&
          userAccount.displayName.toLowerCase() === data.profile.handle.toLowerCase()))
  );

  const normalizeAvatarInput = (raw: string): string => {
    const trimmed = raw.trim();
    if (!trimmed) return '';
    const imgurPage = trimmed.match(/^https?:\/\/(?:www\.)?imgur\.com\/([a-zA-Z0-9]+)(?:\/)?$/i);
    if (imgurPage) return `https://i.imgur.com/${imgurPage[1]}.png`;
    return trimmed;
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?.profile) return;
    setSaving(true);

    const updated: ExileProfile = {
      ...data.profile,
      avatarUrl: normalizeAvatarInput(editAvatarUrl) || undefined,
      bio: editBio.trim() || undefined,
      timezone: editTimezone.trim() || undefined,
      poeAccountName: editPoeAccount.trim() || undefined,
      poeProfileUrl:
        editPoeUrl.trim() ||
        (editPoeAccount.trim()
          ? `https://www.pathofexile.com/account/view-profile/${encodeURIComponent(editPoeAccount.trim().split('#')[0])}`
          : undefined),
      discordHandle: editDiscord.trim() || undefined,
      twitchUrl: editTwitch.trim() || undefined,
      favoriteClass: editFavClass.trim() || undefined
    };

    const ok = await saveCloudProfile(updated);
    setSaving(false);
    if (ok) {
      setData({ ...data, profile: updated });
      setAvatarError(false);
      setIsEditing(false);
      fireConfetti();
      setCopyNotice('Exile profile saved to Cloudflare D1!');
      setTimeout(() => setCopyNotice(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-xs font-mono text-slate-400">
        Loading Exile Profile for @{cleanHandle}...
      </div>
    );
  }

  const profile: ExileProfile = data?.profile || {
    handle: cleanHandle,
    uid: 'EXILE-NEW'
  };

  const isLeaguePoE2 = (lid?: string) => Boolean(lid && lid.toLowerCase().startsWith('poe2'));
  const matchesGameScope = (lid?: string) => {
    if (gameScope === 'all') return true;
    return gameScope === 'poe2' ? isLeaguePoE2(lid) : !isLeaguePoE2(lid);
  };

  const rosterEntries = data?.rosterEntries || [];
  const allCharactersRaw = rosterEntries.flatMap((entry) =>
    getMemberCharacters(entry.member).map((ch) => ({
      ...ch,
      leagueId: entry.leagueId,
      gameTag: isLeaguePoE2(entry.leagueId) ? 'PoE 2' : 'PoE 1'
    }))
  );
  const allCharacters = allCharactersRaw.filter((ch) => matchesGameScope(ch.leagueId));
  const poe1CharCount = allCharactersRaw.filter((ch) => !isLeaguePoE2(ch.leagueId)).length;
  const poe2CharCount = allCharactersRaw.filter((ch) => isLeaguePoE2(ch.leagueId)).length;
  const primaryNavLeagueId =
    gameScope === 'poe2'
      ? rosterEntries.find((e) => isLeaguePoE2(e.leagueId))?.leagueId || 'poe2-05-ancients'
      : rosterEntries.find((e) => !isLeaguePoE2(e.leagueId))?.leagueId || rosterEntries[0]?.leagueId || 'poe1-330-umbra';

  const openWishes = (data?.wishes || []).filter((w) => w.status !== 'HAVE');
  const openBounties = openWishes.filter((w) => w.bountyOffer && w.bountyOffer.trim());
  const fulfilledByMe = data?.fulfilledByMe || [];
  const myCharNamesLower = new Set(allCharacters.map((c) => c.characterName.trim().toLowerCase()));
  const selfFoundByMe = (data?.wishes || []).filter((w) => {
    if (w.status !== 'HAVE') return false;
    const fb = (w.fulfilledBy || '').trim().replace(/^@/, '').toLowerCase();
    return (
      !fb ||
      fb === 'self found' ||
      fb === cleanHandle.toLowerCase() ||
      fb === profile.handle.toLowerCase() ||
      myCharNamesLower.has(fb)
    );
  });
  const isEarly330Pioneer =
    rosterEntries.some((entry) => entry.leagueId === 'poe1-330-umbra') ||
    Boolean(data?.alumniRecord);
  const services = (data?.services || []).filter((s) => matchesGameScope(s.leagueId));
  const vouches = (data?.vouches || []).filter((v) => matchesGameScope(v.leagueId));
  const achProfile = data?.achievementProfile;
  const unlockedIds = achProfile?.unlockedIds || {};
  const unlockedAchievements = ACHIEVEMENT_CATALOG.filter((a) => Boolean(unlockedIds[a.id]));
  const honorSummary = buildRetroactiveHonorHistory({
    fulfilledByPlayer: fulfilledByMe,
    selfFoundByPlayer: selfFoundByMe,
    isEarly330Pioneer,
    achievementProfile: achProfile,
    leagueId: rosterEntries[0]?.leagueId || 'poe1-330-umbra'
  });

  const handleSaveMapRegexBricks = async (bricks: string[]) => {
    if (!data?.profile) return;
    const updated: ExileProfile = { ...data.profile, mapRegexBricks: bricks };
    const ok = await saveCloudProfile(updated);
    if (ok) {
      setData({ ...data, profile: updated });
      setCopyNotice('Saved your Map Regex brick mods to Cloudflare D1!');
      setTimeout(() => setCopyNotice(null), 2500);
    }
  };

  const handleSaveSessionGoals = async (goals: PersonalSessionGoal[]) => {
    if (!data?.profile) return;
    const updated: ExileProfile = { ...data.profile, sessionGoals: goals };
    const ok = await saveCloudProfile(updated);
    if (ok) {
      setData({ ...data, profile: updated });
    }
  };
  const totalHonorPoints = honorSummary.totalHonorPoints;

  const primaryIgn = allCharacters[0]?.characterName || profile.handle;
  const profileShareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/exile/${encodeURIComponent(profile.handle.toLowerCase())}`
      : `https://exilessf.app/exile/${encodeURIComponent(profile.handle.toLowerCase())}`;

  const tierStyles: Record<string, string> = {
    Common: 'bg-slate-800 text-slate-300 border-slate-700',
    Rare: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
    Unique: 'bg-orange-500/15 text-orange-300 border-orange-500/40',
    Pinnacle: 'bg-purple-500/15 text-purple-300 border-purple-500/40'
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-10">
      {/* Toast Notice */}
      {copyNotice && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-2xl border border-emerald-400">
          {copyNotice}
        </div>
      )}

      {/* Top Return Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to League Hub</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => triggerCopy(profileShareUrl, 'Exile Profile Link')}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-indigo-300 flex items-center gap-1.5 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Share Profile Link</span>
          </button>

          {canEdit && (
            <button
              type="button"
              onClick={() => setIsEditing((v) => !v)}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Close Editor' : 'Edit Profile'}</span>
            </button>
          )}

          {onOpenAccountSettings &&
            userAccount &&
            (userAccount.displayName.toLowerCase() === cleanHandle.toLowerCase() ||
              (data?.profile?.handle &&
                userAccount.displayName.toLowerCase() === data.profile.handle.toLowerCase())) && (
              <button
                type="button"
                onClick={onOpenAccountSettings}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                title="Update account details, linked PoE account, or sign out"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Update Account</span>
              </button>
            )}
        </div>
      </div>

      {/* Hero Profile Banner */}
      <div className="p-5 sm:p-6 rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-900 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4">
            {/* Avatar Frame (Linked External Image or Monogram Fallback) */}
            <div className="w-20 h-20 rounded-2xl border-2 border-indigo-500/50 bg-slate-950 overflow-hidden flex items-center justify-center flex-shrink-0 shadow-lg">
              {profile.avatarUrl && !avatarError ? (
                <img
                  src={normalizeAvatarInput(profile.avatarUrl)}
                  alt={`@${profile.handle} avatar`}
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-orbitron font-bold text-indigo-300 uppercase">
                  {profile.handle.slice(0, 2)}
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-white">@{profile.handle}</h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {profile.uid}
                </span>
                {achProfile?.equippedTitle && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold">
                    ★ {achProfile.equippedTitle}
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                {profile.bio || 'Path of Exile Solo Self Found and Group Self Found exile.'}
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono">
                {profile.poeAccountName && (
                  <span className="px-2 py-0.5 rounded bg-slate-950/80 border border-slate-800 text-slate-300">
                    PoE: {profile.poeAccountName}
                  </span>
                )}
                {profile.favoriteClass && (
                  <span className="px-2 py-0.5 rounded bg-slate-950/80 border border-slate-800 text-amber-300">
                    Main Class: {profile.favoriteClass}
                  </span>
                )}
                {profile.timezone && (
                  <span className="px-2 py-0.5 rounded bg-slate-950/80 border border-slate-800 text-slate-400">
                    Timezone: {profile.timezone}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Direct Contact & Official Profile Links */}
          <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
            {profile.poeProfileUrl && (
              <a
                href={profile.poeProfileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Official PoE Profile</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <button
              type="button"
              onClick={() => triggerCopy(`@${primaryIgn} `, 'In Game Whisper')}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>Whisper</span>
            </button>
            <button
              type="button"
              onClick={() => triggerCopy(`@${profile.rootHandle || profile.handle}`, 'Root Tag')}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span>Root Tag</span>
            </button>
            {profile.twitchUrl && (
              <a
                href={profile.twitchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs font-mono flex items-center gap-1.5"
              >
                <span>Stream</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Cross Game Synergy Switcher (PoE 1 + PoE 2 Combined or Filtered) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800/80">
          <div className="text-[11px] font-mono text-slate-400">
            Cross Game Profile Scope (PoE 1 &amp; PoE 2 metrics combined by default)
          </div>
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => setGameScope('all')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                gameScope === 'all'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Games ({allCharactersRaw.length})
            </button>
            <button
              type="button"
              onClick={() => setGameScope('poe1')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                gameScope === 'poe1'
                  ? 'bg-amber-600/30 text-amber-200 border border-amber-500/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              PoE 1 ({poe1CharCount})
            </button>
            <button
              type="button"
              onClick={() => setGameScope('poe2')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                gameScope === 'poe2'
                  ? 'bg-cyan-600/30 text-cyan-200 border border-cyan-500/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              PoE 2 ({poe2CharCount})
            </button>
          </div>
        </div>

        {/* Reputation & Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-[10px] font-mono uppercase text-amber-400">Verified Vouches</div>
            <div className="text-lg font-bold text-white mt-0.5">★ {vouches.length}</div>
            <div className="text-[10px] text-slate-400">Community trust score</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-[10px] font-mono uppercase text-emerald-400">Wishes Fulfilled</div>
            <div className="text-lg font-bold text-white mt-0.5">
              {Math.max(fulfilledByMe.length, achProfile?.lifetimeFulfilledCount || 0)}
            </div>
            <div className="text-[10px] text-slate-400">Squad drops provided</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-[10px] font-mono uppercase text-indigo-400">Characters Tracked</div>
            <div className="text-lg font-bold text-white mt-0.5">{allCharacters.length}</div>
            <div className="text-[10px] text-slate-400">
              {data?.alumniRecord ? `${data.alumniRecord.totalLeaguesCount} past seasons` : 'Active roster slot'}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-[10px] font-mono uppercase text-purple-400">Honor Score</div>
            <div className="text-lg font-bold text-white mt-0.5">{totalHonorPoints} pts</div>
            <div className="text-[10px] text-slate-400">
              {unlockedAchievements.length} Achievements • +{honorSummary.fulfillmentBonusPoints} from Finds (+{HONOR_PER_ITEM_FOUND}/ea)
            </div>
          </div>
        </div>
      </div>

      {/* Upgraded Profile Studio Editor (Owner or Admin) */}
      {isEditing && canEdit && (
        <form
          onSubmit={handleSaveProfile}
          className="p-5 sm:p-6 rounded-2xl border-2 border-indigo-500/45 bg-gradient-to-b from-slate-900 via-[#0d111a] to-slate-900 space-y-5 shadow-2xl"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Exile Profile Studio (Live Preview • Saved to Cloudflare D1)</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Customize your avatar, title, bio, official PoE links, and play hours across all future private league seasons.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Section 1: Avatar Live Preview & Identity */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/90 space-y-4">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-300">
              1. Identity, Avatar & Legacy Title
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-20 h-20 rounded-2xl border-2 border-indigo-500/60 bg-slate-900 overflow-hidden flex items-center justify-center shrink-0 shadow-lg">
                {editAvatarUrl.trim() ? (
                  <img
                    src={normalizeAvatarInput(editAvatarUrl)}
                    alt="Live avatar preview"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-orbitron font-bold text-indigo-300 uppercase">
                    {profile.handle.slice(0, 2)}
                  </span>
                )}
              </div>

              <div className="flex-1 w-full space-y-2 text-xs">
                <label className="text-[11px] font-mono text-slate-300 block">
                  Avatar Image URL (or choose a preset below)
                </label>
                <input
                  type="text"
                  value={editAvatarUrl}
                  onChange={(e) => setEditAvatarUrl(e.target.value)}
                  placeholder="https://i.imgur.com/your-avatar.png or /achievements/umbra-witch-330.jpg"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                />
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-mono text-slate-500 mr-1">Presets:</span>
                  {[
                    { label: 'Umbra Coven Witch', url: '/achievements/umbra-witch-330.jpg' },
                    { label: 'Exile SSF Crest', url: '/logo.png' },
                    { label: 'Clear Avatar', url: '' }
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setEditAvatarUrl(preset.url)}
                      className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-indigo-500/20 border border-slate-800 hover:border-indigo-500/40 text-[10px] font-mono text-slate-300 hover:text-indigo-200 cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Equipped Title Picker (from unlocked achievements) */}
            {unlockedAchievements.some((a) => a.rewardTitle) && (
              <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                <div className="text-[11px] font-mono text-purple-300">Equipped Profile Title (Instant Save)</div>
                <div className="flex flex-wrap gap-1.5">
                  {unlockedAchievements
                    .filter((a) => a.rewardTitle)
                    .map((a) => {
                      const active = achProfile?.equippedTitle === a.rewardTitle;
                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={async () => {
                            if (!a.rewardTitle) return;
                            const nextAch = {
                              ...(achProfile || {
                                unlockedIds: {},
                                lifetimeFulfilledCount: 0,
                                lifetimeBountiesClaimed: 0,
                                lifetimeBountiesPaid: 0,
                                leaguesParticipated: []
                              }),
                              equippedTitle: active ? '' : a.rewardTitle
                            };
                            const saved = await saveCloudAchievementProfile(
                              (profile.poeAccountName || profile.handle).toLowerCase(),
                              nextAch
                            );
                            await saveCloudAchievementProfile(profile.handle.toLowerCase(), nextAch);
                            if (data) {
                              setData({ ...data, achievementProfile: saved || nextAch });
                            }
                            setCopyNotice(active ? 'Title unequipped.' : `Equipped title: ${a.rewardTitle}!`);
                            setTimeout(() => setCopyNotice(null), 2500);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border cursor-pointer transition-colors ${
                            active
                              ? 'bg-purple-600 text-white border-purple-400 font-bold shadow'
                              : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-purple-500/50'
                          }`}
                        >
                          {active ? `★ ${a.rewardTitle}` : a.rewardTitle}
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] font-mono text-slate-300 block mb-1">
                  Favorite Class / Ascendancy
                </label>
                <input
                  type="text"
                  value={editFavClass}
                  onChange={(e) => setEditFavClass(e.target.value)}
                  placeholder="e.g. Slayer, Hierophant, Trickster"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-mono text-slate-300 block mb-1">
                  Timezone & Play Hours
                </label>
                <input
                  type="text"
                  value={editTimezone}
                  onChange={(e) => setEditTimezone(e.target.value)}
                  placeholder="e.g. EST Evenings & Weekends"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {['EST Evenings', 'CST Evenings', 'PST Evenings', 'EU / CET', 'Weekends'].map((tz) => (
                    <button
                      key={tz}
                      type="button"
                      onClick={() => setEditTimezone(tz)}
                      className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-mono text-slate-400 hover:text-white cursor-pointer"
                    >
                      {tz}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="text-xs">
              <label className="text-[11px] font-mono text-slate-300 block mb-1">Bio / Farming Focus & Services</label>
              <textarea
                rows={2}
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="e.g. Boss killer & Betrayal crafter happy to help squadmates with 4 Voidstones and crafts."
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Section 2: PoE & Social Links */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/90 space-y-3 text-xs">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-300">
              2. Path of Exile & Community Links
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-mono text-slate-300 block mb-1">
                  Official PoE Account Tag
                </label>
                <input
                  type="text"
                  value={editPoeAccount}
                  onChange={(e) => setEditPoeAccount(e.target.value)}
                  placeholder="e.g. Leuie#0626"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-300 block mb-1">
                  Official PathOfExile.com Profile URL
                </label>
                <input
                  type="url"
                  value={editPoeUrl}
                  onChange={(e) => setEditPoeUrl(e.target.value)}
                  placeholder="Auto generated from PoE Account Tag if left blank"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-300 block mb-1">
                  Discord Handle (Optional)
                </label>
                <input
                  type="text"
                  value={editDiscord}
                  onChange={(e) => setEditDiscord(e.target.value)}
                  placeholder="e.g. @leuie"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-300 block mb-1">
                  Twitch / YouTube Link (Optional)
                </label>
                <input
                  type="url"
                  value={editTwitch}
                  onChange={(e) => setEditTwitch(e.target.value)}
                  placeholder="https://twitch.tv/..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 cursor-pointer shadow disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving to D1...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Profile Section Collapse Master Bar */}
      <div className="px-4 py-2 rounded-xl border border-slate-800/80 bg-slate-900/60 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2 text-slate-400">
          <span className="w-2 h-2 rounded-full bg-indigo-500" />
          <span>Profile Sections (Click any section chevron to collapse or expand)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAllProfileSections(false)}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
          >
            Expand All
          </button>
          <button
            type="button"
            onClick={() => setAllProfileSections(true)}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Character (Live GGG Sync + Cloud Snapshots) */}
      <CharacterPaperdollView
        handle={profile.handle}
        poeAccountName={profile.poeAccountName}
        rosterCharacters={allCharacters}
        canEdit={canEdit}
        collapsed={Boolean(collapsedSections.character)}
        onToggleCollapse={() => toggleProfileSection('character')}
        onNotify={(msg) => {
          setCopyNotice(msg);
          setTimeout(() => setCopyNotice(null), 3000);
        }}
      />

      {/* Main 2 Column Hub Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* Panel 1: Character Roster */}
        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/70 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-indigo-300">
              <Users className="w-4 h-4" />
              <span>Character Roster ({allCharacters.length})</span>
            </div>
            <div className="flex items-center gap-2">
              {onNavigateLeague && (
                <button
                  type="button"
                  onClick={() => onNavigateLeague(primaryNavLeagueId, 'roster')}
                  className="text-[11px] font-mono text-slate-400 hover:text-white cursor-pointer"
                >
                  Open League Roster →
                </button>
              )}
              <button
                type="button"
                onClick={() => toggleProfileSection('roster')}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
              >
                {collapsedSections.roster ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {!collapsedSections.roster && (allCharacters.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 italic">
              No active league characters registered yet.
            </div>
          ) : (
            <div className="space-y-2">
              {allCharacters.map((ch) => (
                <div
                  key={`${ch.leagueId}-${ch.id}`}
                  className="p-3 rounded-xl border border-slate-800 bg-slate-950/60 flex items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5 font-bold text-white">
                      <span>{ch.characterName}</span>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                          ch.gameTag === 'PoE 2'
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                            : 'bg-amber-500/15 text-amber-300 border-amber-500/35'
                        }`}
                      >
                        {ch.gameTag}
                      </span>
                      {ch.isMain && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                          MAIN
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {ch.ascendancy} • Lvl {ch.level} • {ch.buildName}
                    </div>
                  </div>
                  {ch.pobUrl && (
                    <a
                      href={ch.pobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 font-mono text-[10px] flex items-center gap-1"
                    >
                      <span>PoB</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Panel 2: Open Wishlists & Active Bounties */}
        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/70 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-amber-300">
              <Sparkles className="w-4 h-4" />
              <span>
                Open Wishlists ({openWishes.length}) {openBounties.length > 0 ? `• ${openBounties.length} Bounties` : ''}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {onNavigateLeague && (
                <button
                  type="button"
                  onClick={() => onNavigateLeague(primaryNavLeagueId, 'wishlists')}
                  className="text-[11px] font-mono text-slate-400 hover:text-white cursor-pointer"
                >
                  Open Wishlists →
                </button>
              )}
              <button
                type="button"
                onClick={() => toggleProfileSection('wishlists')}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
              >
                {collapsedSections.wishlists ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {!collapsedSections.wishlists && (openWishes.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 italic">
              No open wishlist items currently requested.
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {openWishes.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                    item.bountyOffer
                      ? 'border-amber-500/40 bg-amber-950/15'
                      : 'border-slate-800 bg-slate-950/60'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-bold text-white truncate">{item.itemName}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                        {item.category}
                      </span>
                      {item.bountyOffer && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                          <Coins className="w-2.5 h-2.5" />
                          <span>{item.bountyOffer}</span>
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      For: {item.characterName} {item.notes ? `• ${item.notes}` : ''}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      triggerCopy(
                        `@${item.characterName} Hey! I found ${item.itemName} from your Exile SSF wishlist!`,
                        'Drop Whisper'
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-mono text-[10px] cursor-pointer flex-shrink-0"
                  >
                    Whisper
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Panel 3: Boss Carries, Services & Verified Vouches */}
        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/70 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-emerald-300">
              <Swords className="w-4 h-4" />
              <span>Services & Verified Vouches ({vouches.length})</span>
            </div>
            <div className="flex items-center gap-2">
              {onNavigateLeague && (
                <button
                  type="button"
                  onClick={() => onNavigateLeague(primaryNavLeagueId, 'bounties')}
                  className="text-[11px] font-mono text-slate-400 hover:text-white cursor-pointer"
                >
                  Open Bounties →
                </button>
              )}
              <button
                type="button"
                onClick={() => toggleProfileSection('services')}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
              >
                {collapsedSections.services ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {!collapsedSections.services && (
            <>
              {services.length > 0 && (
            <div className="space-y-2">
              {services.map((svc) => (
                <div key={svc.id} className="p-3 rounded-xl border border-indigo-500/30 bg-indigo-950/15 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{svc.title}</span>
                    <span className="text-[10px] font-mono text-emerald-300">{svc.fee}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">{svc.serviceType}{svc.atlasFocus ? ` • ${svc.atlasFocus}` : ''}</div>
                </div>
              ))}
            </div>
          )}

          {vouches.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500 italic">
              No verified vouches recorded yet.
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {vouches.map((v) => (
                <div key={v.id} className="p-3 rounded-xl border border-slate-800 bg-slate-950/60 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-amber-300 font-mono text-[10px] font-bold flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      <span>{v.category}</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {new Date(v.createdAtIso).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-slate-200">"{v.comment}"</div>
                  <div className="text-[10px] font-mono text-slate-500">
                    Vouched by @{v.voucherDisplayName} ({v.itemOrServiceName})
                  </div>
                </div>
              ))}
            </div>
          )}
            </>
          )}
        </div>

        {/* Panel 4: Achievements Showcase */}
        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/70 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-purple-300">
              <Trophy className="w-4 h-4" />
              <span>Achievements ({unlockedAchievements.length} / {ACHIEVEMENT_CATALOG.length})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-amber-300 font-bold">{totalHonorPoints} Honor Pts</span>
              <button
                type="button"
                onClick={() => toggleProfileSection('achievements')}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
              >
                {collapsedSections.achievements ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {!collapsedSections.achievements && (unlockedAchievements.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 italic">
              Achievements unlocked in Exile SSF private leagues will appear here and persist across future expansions.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {unlockedAchievements.map((ach) => (
                <div
                  key={ach.id}
                  className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-950/15 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-white flex items-center gap-2">
                      {ach.iconUrl ? (
                        <img
                          src={ach.iconUrl}
                          alt={ach.title}
                          className="w-8 h-8 rounded-lg object-cover border border-purple-400/70 shadow-sm flex-shrink-0"
                        />
                      ) : (
                        <Award className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      )}
                      <span>{ach.title}</span>
                    </span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border uppercase font-bold ${tierStyles[ach.tier]}`}>
                      {ach.tier}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 leading-snug">{ach.description}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Personal Toolkit: Map Regex Generator & Farming Session Scratchpad */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-sky-300">
            Personal Toolkit (Map Regex &amp; Session Scratchpad)
          </span>
          <button
            type="button"
            onClick={() => toggleProfileSection('toolkit')}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
          >
            {collapsedSections.toolkit ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
        {!collapsedSections.toolkit && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <MapRegexBuilder
              savedBricks={profile.mapRegexBricks || []}
              canEdit={canEdit}
              onSaveBricks={handleSaveMapRegexBricks}
            />
            <SessionScratchpad
              savedGoals={profile.sessionGoals || []}
              characters={allCharacters}
              canEdit={canEdit}
              onSaveGoals={handleSaveSessionGoals}
            />
          </div>
        )}
      </div>

      {/* Farming Telemetry & Season Trophy Case */}
      {(() => {
        const scopedSessions = farmingSessions.filter(
          (s) => gameScope === 'all' || (s.game || 'poe1') === gameScope
        );
        const totalMaps = scopedSessions.reduce((sum, s) => sum + Number(s.mapsRun || 0), 0);
        const totalMins = scopedSessions.reduce((sum, s) => sum + Math.max(1, Number(s.durationMinutes || 0)), 0);
        const avgPace = totalMins > 0 && totalMaps > 0 ? ((totalMaps / totalMins) * 60).toFixed(1) : '0.0';
        const stratCounts = new Map<string, number>();
        const trophyMap = new Map<string, { name: string; icon: string; count: number; sub: string }>();

        for (const s of scopedSessions) {
          const st = String(s.strategy || 'General Mapping');
          stratCounts.set(st, (stratCounts.get(st) || 0) + 1);
          for (const it of Array.isArray(s.items) ? s.items : []) {
            if (it.category === 'Uniques') {
              const k = String(it.shortName || it.name || '').toLowerCase();
              const cur = trophyMap.get(k);
              if (cur) {
                cur.count += Number(it.quantity || 1);
              } else {
                trophyMap.set(k, {
                  name: String(it.shortName || it.name || 'Unique'),
                  icon: String(it.icon || ''),
                  count: Number(it.quantity || 1),
                  sub: String(it.subCategory || it.baseType || 'Unique')
                });
              }
            }
          }
        }
        const topStrategy = Array.from(stratCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None Logged Yet';
        const trophies = Array.from(trophyMap.values()).slice(0, 8);

        return (
          <div className="p-4 sm:p-5 rounded-2xl border border-indigo-500/30 bg-slate-900/75 space-y-4 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-indigo-300">
                <Package className="w-4 h-4 text-amber-400" />
                <span>Farming Telemetry & Season Trophy Case ({scopedSessions.length} Sessions)</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="/farming"
                  className="text-[11px] font-mono text-amber-300 hover:text-amber-200 underline"
                >
                  Open Farming Tracker →
                </a>
                <button
                  type="button"
                  onClick={() => toggleProfileSection('farming')}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
                >
                  {collapsedSections.farming ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {!collapsedSections.farming && (scopedSessions.length === 0 ? (
              <div className="p-5 text-center text-xs text-slate-500 italic">
                No farming sessions saved yet for this game filter. Save a session on the Asset Tracker page to populate your lifetime productivity stats and Unique Trophy Case!
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <div className="text-[10px] font-mono uppercase text-slate-400">Maps Blasted</div>
                    <div className="text-lg font-mono font-bold text-white mt-0.5">{totalMaps.toLocaleString()}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <div className="text-[10px] font-mono uppercase text-emerald-400">Average Pace</div>
                    <div className="text-lg font-mono font-bold text-emerald-300 mt-0.5">{avgPace} / hr</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <div className="text-[10px] font-mono uppercase text-orange-400">Uniques Logged</div>
                    <div className="text-lg font-mono font-bold text-orange-300 mt-0.5">{trophyMap.size}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <div className="text-[10px] font-mono uppercase text-amber-400">Top Strategy</div>
                    <div className="text-xs font-bold text-amber-200 mt-1 truncate">{topStrategy}</div>
                  </div>
                </div>

                {trophies.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[10px] font-mono uppercase text-orange-300 font-bold">Notable Unique Drops</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {trophies.map((t) => (
                        <div key={t.name} className="p-2.5 rounded-xl bg-orange-950/20 border border-orange-500/30 flex items-center gap-2">
                          {t.icon ? (
                            <img src={t.icon} alt={t.name} className="w-7 h-7 object-contain shrink-0" />
                          ) : (
                            <div className="w-7 h-7 rounded bg-orange-500/15 flex items-center justify-center text-[10px] font-bold text-orange-300 shrink-0">
                              U
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="text-[11px] font-bold text-orange-200 truncate">{t.name}</div>
                            <div className="text-[10px] font-mono text-slate-400 truncate">
                              {t.sub}{t.count > 1 ? ` ×${t.count}` : ''}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      })()}

      {/* Honor Points History Ledger (When, Where, Why) */}
      <div className="p-4 sm:p-5 rounded-2xl border border-amber-500/30 bg-slate-900/75 space-y-3 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-amber-300">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Honor Points History ({honorSummary.entries.length} Events • {totalHonorPoints} Total Pts)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400">
              +5 Found • +5 Delivery Confirmed • +5 Self Found • +25 Early 3.30 Pioneer
            </span>
            <button
              type="button"
              onClick={() => toggleProfileSection('honor')}
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
            >
              {collapsedSections.honor ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {!collapsedSections.honor && (honorSummary.entries.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 italic">
            No Honor Points earned yet. Find a wanted item for a squadmate (+{HONOR_PER_ITEM_FOUND} pts) or unlock an Achievement to start your ledger!
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {honorSummary.entries.map((entry) => (
              <div
                key={entry.id}
                className="p-3 rounded-xl border border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <span
                    className={`px-2 py-0.5 rounded-lg font-mono font-bold text-[11px] border flex-shrink-0 ${
                      entry.kind === 'item_found'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : entry.kind === 'receipt_confirmed'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : entry.kind === 'self_found'
                        ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                        : entry.kind === 'early_pioneer'
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                        : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                    }`}
                  >
                    +{entry.points} pts
                  </span>
                  <div className="min-w-0">
                    <div className="font-semibold text-white truncate">{entry.reason}</div>
                    <div className="text-[11px] font-mono text-slate-400">{entry.where}</div>
                  </div>
                </div>
                <div className="text-[10px] font-mono text-slate-500 flex-shrink-0 sm:text-right">
                  {entry.timestampIso
                    ? new Date(entry.timestampIso).toLocaleString()
                    : 'Retroactive Season Credit'}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
