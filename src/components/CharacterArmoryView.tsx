import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  Search,
  Share2,
  CheckCircle2,
  User,
  Sparkles,
  LogIn,
  Flame,
  ExternalLink,
  ArrowRight,
  Swords
} from 'lucide-react';
import type { UserAccount, CommunityGuide } from '../types';
import {
  fetchCloudProfile,
  fetchUserToolState,
  saveCloudGuide,
  type CloudExileProfileResponse
} from '../services/cloudSync';
import { CharacterPaperdollView, type CharacterGearSnapshot } from './profile/CharacterPaperdollView';

export interface CharacterArmoryViewProps {
  initialHandle?: string;
  initialCharacterName?: string;
  userAccount?: UserAccount | null;
  selectedGame?: 'poe1' | 'poe2';
  onOpenProfile?: (handle: string) => void;
  onOpenAuthModal?: () => void;
  onSyncArmoryUrl?: (handle: string, charName?: string) => void;
  onSwitchGame?: (game: 'poe1' | 'poe2') => void;
  onNavigateTab?: (tabId: string) => void;
}

export const CharacterArmoryView: React.FC<CharacterArmoryViewProps> = ({
  initialHandle,
  initialCharacterName,
  userAccount,
  selectedGame = 'poe1',
  onOpenProfile,
  onOpenAuthModal,
  onSyncArmoryUrl,
  onSwitchGame,
  onNavigateTab
}) => {
  const defaultHandle = (initialHandle || userAccount?.displayName || '').replace(/^@/, '').trim();
  const [activeHandle, setActiveHandle] = useState<string>(defaultHandle);
  const [handleInput, setHandleInput] = useState<string>('');
  const [activeCharName, setActiveCharName] = useState<string>(initialCharacterName || '');
  const [profileData, setProfileData] = useState<CloudExileProfileResponse | null>(null);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [publishingBuild, setPublishingBuild] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg((prev) => (prev === msg ? null : prev)), 3200);
  };

  useEffect(() => {
    const clean = (initialHandle || '').replace(/^@/, '').trim();
    if (clean && clean.toLowerCase() !== activeHandle.toLowerCase()) {
      setActiveHandle(clean);
    } else if (!activeHandle && userAccount?.displayName) {
      setActiveHandle(userAccount.displayName);
    }
  }, [initialHandle, userAccount?.displayName]);

  useEffect(() => {
    if (initialCharacterName) {
      setActiveCharName(initialCharacterName);
    }
  }, [initialCharacterName]);

  useEffect(() => {
    document.title = activeHandle
      ? `${activeCharName ? `${activeCharName} (@${activeHandle})` : `@${activeHandle}`} | Character Armory | Exile SSF`
      : 'Character Armory | Exile SSF';
  }, [activeHandle, activeCharName]);

  // Fetch profile metadata & roster characters for the active handle
  useEffect(() => {
    if (!activeHandle) {
      setProfileData(null);
      return;
    }
    let cancelled = false;
    setLoadingProfile(true);
    fetchCloudProfile(activeHandle).then((res) => {
      if (!cancelled) {
        setProfileData(res);
        setLoadingProfile(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [activeHandle]);

  const isOwnAccount = Boolean(
    userAccount &&
      activeHandle &&
      (userAccount.displayName.toLowerCase() === activeHandle.toLowerCase() || userAccount.isAdmin)
  );

  const rosterCharacters = useMemo(() => {
    const entries = profileData?.rosterEntries || [];
    const list: Array<{
      characterName: string;
      ascendancy: string;
      level: number;
      buildName: string;
      leagueId: string;
      gameTag?: string;
    }> = [];
    for (const r of entries) {
      const m = r.member;
      if (!m) continue;
      const gameTag = r.leagueId.toLowerCase().startsWith('poe2') ? 'PoE 2' : 'PoE 1';
      if (m.characterName) {
        list.push({
          characterName: m.characterName,
          ascendancy: m.ascendancy || 'Exile',
          level: m.level || 1,
          buildName: m.buildName || '',
          leagueId: r.leagueId,
          gameTag
        });
      }
      if (Array.isArray(m.characters)) {
        for (const c of m.characters) {
          if (c.characterName && !list.some((x) => x.characterName.toLowerCase() === c.characterName.toLowerCase())) {
            list.push({
              characterName: c.characterName,
              ascendancy: c.ascendancy || 'Exile',
              level: c.level || 1,
              buildName: c.buildName || '',
              leagueId: r.leagueId,
              gameTag
            });
          }
        }
      }
    }
    return list;
  }, [profileData]);

  const handleLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = handleInput.replace(/^@/, '').trim();
    if (!clean) return;
    setActiveHandle(clean);
    setActiveCharName('');
    setHandleInput('');
    onSyncArmoryUrl?.(clean);
  };

  const handleCopyShareLink = () => {
    if (!activeHandle) return;
    const base = `${window.location.origin}/armory/${encodeURIComponent(activeHandle)}`;
    const url = activeCharName ? `${base}/${encodeURIComponent(activeCharName)}` : base;
    navigator.clipboard?.writeText(url).then(() => {
      showToast('Shareable Character Armory link copied to clipboard!');
    });
  };

  const handlePublishAsSquadBuild = async () => {
    if (!activeHandle || !isOwnAccount || publishingBuild) return;
    setPublishingBuild(true);
    try {
      const raw = await fetchUserToolState<Record<string, any>>(activeHandle, 'character_gear_snapshots');
      if (!raw || typeof raw !== 'object') {
        showToast('Sync a character in Character Armory first before publishing.');
        return;
      }
      const snaps = Object.entries(raw)
        .filter(([k, v]) => k !== '__lastSelectedChar' && v && typeof v === 'object' && v.character)
        .map(([, v]) => v as CharacterGearSnapshot);
      const snap =
        snaps.find((s) => s.character.name.toLowerCase() === activeCharName.toLowerCase()) ||
        snaps.sort((a, b) => new Date(b.syncedAtIso || 0).getTime() - new Date(a.syncedAtIso || 0).getTime())[0];

      if (!snap) {
        showToast('No synced character snapshot found to publish.');
        return;
      }

      const uniques = (snap.equipped || [])
        .filter((it) => it.frameType === 3 && it.name)
        .map((it) => it.name);
      const gemGroups = (snap.equipped || [])
        .filter((it) => it.socketedGems && it.socketedGems.length > 0)
        .sort((a, b) => b.socketedGems.length - a.socketedGems.length);
      const mainSkill =
        gemGroups[0]?.socketedGems.find((g) => !g.support)?.name || snap.character.className;
      const keystones = (snap.passives?.keystones || []).map((k) => k.name);
      const armoryUrl = `${window.location.origin}/armory/${encodeURIComponent(activeHandle)}/${encodeURIComponent(snap.character.name)}`;
      const leagueId = selectedGame === 'poe2' ? 'poe2-05-alpha' : 'poe1-330-umbra';

      const mdLines = [
        `# ${snap.character.name} — Lv ${snap.character.level} ${snap.character.className}`,
        '',
        `**League:** ${snap.character.league} | **Armory Link:** [Inspect Live Gear & Passive Tree](${armoryUrl})`,
        '',
        `## Main Skill & Gem Links`,
        ...gemGroups.slice(0, 4).map(
          (g) => `- **${g.inventoryId}**: ${g.socketedGems.map((gm) => `${gm.name} (${gm.level}/${gm.quality}%)`).join(' + ')}`
        ),
        '',
        `## Equipped Uniques`,
        ...(uniques.length > 0 ? uniques.map((u) => `- ${u}`) : ['- Pure Rare / Self Crafted SSF Gear']),
        '',
        `## Allocated Keystones (${snap.passives?.allocatedCount || 0} Passives)`,
        ...(keystones.length > 0 ? keystones.map((k) => `- ${k}`) : ['- Standard Ascendancy Tree'])
      ];

      const guide: CommunityGuide = {
        id: `armory-build-${activeHandle.toLowerCase()}-${snap.character.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        title: `${mainSkill} ${snap.character.className} (Lv ${snap.character.level} Squad Showcase)`,
        authorName: `@${activeHandle}`,
        authorDiscord: userAccount?.discordName || `@${activeHandle}`,
        className: snap.character.className,
        ascendancy: snap.character.className,
        playstyle: 'SSF / GSF Live Character',
        starterRating: 4.5,
        pobCodeOrUrl: armoryUrl,
        levelingNotes: `Published directly from Character Armory (${snap.character.league}).`,
        endgameNotes: `Equipped with ${snap.equipped.length} gear pieces and ${snap.passives?.allocatedCount || 0} allocated passives.`,
        requiredUniques: uniques.slice(0, 8),
        atlasFocus: ['SSF Progression', 'Endgame Bossing'],
        upvotes: 1,
        createdAt: new Date().toISOString().split('T')[0],
        game: selectedGame,
        creatorName: `@${activeHandle}`,
        creatorPlatform: 'Community',
        tags: ['Armory Showcase', snap.character.className, mainSkill],
        slug: `armory-${activeHandle.toLowerCase()}-${snap.character.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        fullGuideMarkdown: mdLines.join('\n')
      };

      const ok = await saveCloudGuide(leagueId, guide);
      if (ok) {
        showToast(`Published "${snap.character.name}" live to Builds Hub!`);
      } else {
        showToast('Could not publish build. Verify your Exile SSF session is active.');
      }
    } catch {
      showToast('Failed to publish character build.');
    } finally {
      setPublishingBuild(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Armory Header & Squad Switcher */}
      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-[#0e1320] via-[#131929] to-[#0e1320] p-4 sm:p-5 shadow-xl space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-cinzel text-lg sm:text-2xl font-black text-white tracking-wide">
                    Character Armory
                  </h1>
                </div>
                <p className="text-xs text-slate-400">
                  Full width Path of Exile gear paperdoll, socket &amp; gem inspector, affix tiers, jewels, and interactive passive skill tree.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Exile Handle Lookup */}
            <form onSubmit={handleLookupSubmit} className="flex items-center gap-1.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={handleInput}
                  onChange={(e) => setHandleInput(e.target.value)}
                  placeholder="Inspect @Handle..."
                  className="pl-8 pr-3 py-1.5 w-44 sm:w-52 rounded-xl bg-slate-950 border border-slate-700/80 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400/60"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-bold transition-colors cursor-pointer"
              >
                Inspect
              </button>
            </form>

            {activeHandle && (
              <>
                {selectedGame === 'poe1' && isOwnAccount && (
                  <button
                    type="button"
                    disabled={publishingBuild}
                    onClick={handlePublishAsSquadBuild}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
                    title="Publish this synced character directly to Builds Hub"
                  >
                    <Flame className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{publishingBuild ? 'Publishing...' : 'Publish to Builds Hub'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCopyShareLink}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5 text-sky-400" />
                  <span>Share Link</span>
                </button>
                {onOpenProfile && (
                  <button
                    type="button"
                    onClick={() => onOpenProfile(activeHandle)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/40 text-indigo-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-indigo-400" />
                    <span>@{activeHandle} Profile</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

      </div>

      {/* Toast Feedback */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-slate-900 border border-emerald-500/50 text-emerald-200 text-xs font-semibold shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Main Character Paperdoll & Passive Tree Engine (PoE 1 vs PoE 2 Isolated) */}
      {selectedGame === 'poe2' ? (
        <div className="space-y-4">
          <div className="p-6 sm:p-8 rounded-2xl border border-cyan-500/35 bg-gradient-to-br from-cyan-950/30 via-slate-950 to-slate-900/90 space-y-5 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/35 text-cyan-300 text-[11px] font-mono font-bold uppercase">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Path of Exile 2 Armory • In Development</span>
                </div>
                <h2 className="text-xl font-cinzel font-bold text-white">
                  PoE 2 Character Armory — Coming Soon
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                  Live character sync for Path of Exile 2 is currently in development. Grinding Gear Games has not yet opened the public PoE 2 character and passive tree API, so automatic gear and skill tree imports are unavailable for now. As soon as GGG releases the PoE 2 character API, full Armory support will go live here.
                </p>
              </div>
              {onSwitchGame && (
                <button
                  type="button"
                  onClick={() => onSwitchGame('poe1')}
                  className="px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 text-xs font-bold flex items-center gap-2 shrink-0 cursor-pointer transition-colors"
                >
                  <Swords className="w-4 h-4" />
                  <span>Switch to PoE 1 Armory</span>
                </button>
              )}
            </div>

            {/* PoE 2 Roster Characters (if any) */}
            {(() => {
              const poe2Roster = rosterCharacters.filter((c) => c.gameTag === 'PoE 2');
              if (poe2Roster.length === 0) return null;
              return (
                <div className="pt-3 border-t border-slate-800 space-y-2.5">
                  <div className="text-xs font-mono uppercase tracking-wider text-cyan-300 font-bold">
                    @{activeHandle} PoE 2 League Roster Characters ({poe2Roster.length})
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {poe2Roster.map((ch) => (
                      <div
                        key={ch.characterName}
                        className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 space-y-1"
                      >
                        <div className="font-bold text-sm text-white">{ch.characterName}</div>
                        <div className="text-xs font-mono text-cyan-300">
                          Lv {ch.level} {ch.ascendancy}
                        </div>
                        {ch.buildName && (
                          <div className="text-[11px] text-slate-400">{ch.buildName}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Useful PoE 2 Character Tools */}
            <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {onNavigateTab && (
                <>
                  <button
                    type="button"
                    onClick={() => onNavigateTab('defenses')}
                    className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/75 hover:border-cyan-500/50 text-left space-y-1 cursor-pointer transition-colors"
                  >
                    <div className="text-xs font-bold text-cyan-200 flex items-center justify-between">
                      <span>PoE 2 Defenses Calc</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                    <p className="text-[11px] text-slate-400">10x Armour curve, ES &amp; Waystone checklist</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigateTab('offenses')}
                    className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/75 hover:border-cyan-500/50 text-left space-y-1 cursor-pointer transition-colors"
                  >
                    <div className="text-xs font-bold text-rose-200 flex items-center justify-between">
                      <span>PoE 2 Offenses Calc</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                    <p className="text-[11px] text-slate-400">Penetration floor, Ignite/Shock/Freeze math</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigateTab('builds')}
                    className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/75 hover:border-cyan-500/50 text-left space-y-1 cursor-pointer transition-colors"
                  >
                    <div className="text-xs font-bold text-emerald-200 flex items-center justify-between">
                      <span>PoE 2 Builds Hub</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                    <p className="text-[11px] text-slate-400">0.5 starter builds &amp; PoB analyzer</p>
                  </button>
                </>
              )}
              <a
                href="https://poe2.ninja/builds"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/75 hover:border-cyan-500/50 text-left space-y-1 transition-colors"
              >
                <div className="text-xs font-bold text-amber-200 flex items-center justify-between">
                  <span>PoE 2 Ninja Ladder</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </div>
                <p className="text-[11px] text-slate-400">Inspect top PoE 2 builds &amp; Ascendancies</p>
              </a>
            </div>
          </div>
        </div>
      ) : activeHandle ? (
        <div className="space-y-3">
          {loadingProfile && !profileData && (
            <div className="px-4 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-mono text-slate-400">
              Loading @{activeHandle} profile &amp; synced character snapshots...
            </div>
          )}
          <CharacterPaperdollView
            key={activeHandle.toLowerCase()}
            handle={activeHandle}
            poeAccountName={profileData?.profile?.poeAccountName || (isOwnAccount ? userAccount?.poeAccountName : undefined)}
            rosterCharacters={rosterCharacters}
            canEdit={isOwnAccount}
            isArmoryMode
            initialCharacterName={activeCharName || undefined}
            onActiveCharacterChange={(charName) => {
              setActiveCharName(charName);
              onSyncArmoryUrl?.(activeHandle, charName);
            }}
            onNotify={showToast}
          />
        </div>
      ) : (
        <div className="p-8 sm:p-12 rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-300 mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h2 className="text-base font-bold text-white">Inspect Any Path of Exile Character</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sign in to sync your own Path of Exile characters from GGG into Exile SSF Cloud, or select any squadmate above to inspect their live gear, sockets, jewels, and passive tree.
            </p>
          </div>
          {onOpenAuthModal && (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-lg transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>Login to Sync Your Characters</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
