import React, { useState, useId, useRef } from 'react';
import {
  Search,
  Copy,
  Send,
  UserPlus,
  Edit3,
  Trash2,
  Sparkles,
  Save,
  ExternalLink,
  Users,
  MessageSquare,
  Globe,
  Plus,
  Star,
  RefreshCw,
  X
} from 'lucide-react';
import type { LeagueRosterMember, LeagueCharacter, UserAccount, LookingForItem } from '../../../types';

export function getMemberCharacters(member: LeagueRosterMember): LeagueCharacter[] {
  if (member.characters && member.characters.length > 0) {
    return member.characters;
  }
  return [
    {
      id: `char-main-${member.id}`,
      characterName: member.characterName || member.displayName,
      ascendancy: member.ascendancy || 'Unassigned',
      className: member.className || 'Exile',
      buildName: member.buildName || 'Undecided Starter',
      level: member.level || 1,
      pobUrl: member.pobUrl || '',
      notes: member.notes || '',
      isMain: true
    }
  ];
}
import { saveCloudRosterMember, deleteCloudRosterMember, fetchOfficialPoeLadder } from '../../../services/cloudSync';

export interface RosterTabProps {
  activeSessionId: string;
  roster: LeagueRosterMember[];
  setRoster: React.Dispatch<React.SetStateAction<LeagueRosterMember[]>>;
  userAccount?: UserAccount | null;
  isCurrentUserAdmin: boolean;
  isCurrentUserOnRoster: boolean;
  lookingForItems: LookingForItem[];
  currentAscendancyCatalog: { name: string; baseClass: string }[];
  triggerCopy: (text: string, label: string) => void;
  setCopyNotice: (notice: string | null) => void;
  fireConfetti: () => void;
  handleOpenInviteModal: () => void;
  handleOpenJoinModal: () => void;
  onUpdateUserAccount?: (account: UserAccount, rosterEntry: LeagueRosterMember) => void;
  onOpenProfile?: (handle: string) => void;
}

export const RosterTab: React.FC<RosterTabProps> = ({
  activeSessionId,
  roster,
  setRoster,
  userAccount,
  isCurrentUserAdmin,
  isCurrentUserOnRoster,
  lookingForItems,
  currentAscendancyCatalog,
  triggerCopy,
  setCopyNotice,
  fireConfetti,
  handleOpenInviteModal,
  handleOpenJoinModal,
  onUpdateUserAccount,
  onOpenProfile
}) => {
  const [rosterSearch, setRosterSearch] = useState<string>('');
  const [rosterAscendancyFilter, setRosterAscendancyFilter] = useState<string>('All');
  const [rosterLaunchFilter, setRosterLaunchFilter] = useState<string>('All');

  const [selectedPlayerModal, setSelectedPlayerModal] = useState<LeagueRosterMember | null>(null);
  const playerProfileDialogRef = useRef<HTMLDialogElement>(null);
  const playerProfileTitleId = useId();

  // Inline Character Modal Editor State
  const [isEditingProfileModal, setIsEditingProfileModal] = useState<boolean>(false);
  const [modalEditDisplayName, setModalEditDisplayName] = useState<string>('');
  const [modalEditPoeAccount, setModalEditPoeAccount] = useState<string>('');
  const [modalEditCharName, setModalEditCharName] = useState<string>('');
  const [modalEditDiscord, setModalEditDiscord] = useState<string>('');
  const [modalEditSlotNumber, setModalEditSlotNumber] = useState<number>(1);
  const [modalEditAsc, setModalEditAsc] = useState<string>('Elementalist');
  const [modalEditLevel, setModalEditLevel] = useState<number>(95);
  const [modalEditBuild, setModalEditBuild] = useState<string>('');
  const [modalEditPob, setModalEditPob] = useState<string>('');
  const [modalEditNotes, setModalEditNotes] = useState<string>('');

  // Multi Character Add Form State
  const [showAddCharForm, setShowAddCharForm] = useState<boolean>(false);
  const [isSyncingLadder, setIsSyncingLadder] = useState<boolean>(false);
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void | Promise<void>;
  } | null>(null);
  const confirmDialogRef = useRef<HTMLDialogElement>(null);

  const openDarkConfirm = (title: string, message: string, confirmLabel: string, onConfirm: () => void | Promise<void>) => {
    setConfirmModal({ title, message, confirmLabel, onConfirm });
    setTimeout(() => confirmDialogRef.current?.showModal(), 10);
  };
  const [newCharName, setNewCharName] = useState<string>('');
  const [newCharAsc, setNewCharAsc] = useState<string>(currentAscendancyCatalog[0]?.name || 'Slayer');
  const [newCharBuild, setNewCharBuild] = useState<string>('');
  const [newCharLevel, setNewCharLevel] = useState<number>(1);
  const [newCharPob, setNewCharPob] = useState<string>('');

  const filteredRoster = roster.filter((member) => {
    const searchLow = rosterSearch.toLowerCase();
    const memberChars = getMemberCharacters(member);
    const matchSearch =
      !rosterSearch ||
      member.displayName.toLowerCase().includes(searchLow) ||
      member.characterName.toLowerCase().includes(searchLow) ||
      member.poeAccountName.toLowerCase().includes(searchLow) ||
      (member.discordName && member.discordName.toLowerCase().includes(searchLow)) ||
      (member.steamName && member.steamName.toLowerCase().includes(searchLow)) ||
      member.buildName.toLowerCase().includes(searchLow) ||
      member.ascendancy.toLowerCase().includes(searchLow) ||
      member.atlasContent.some((c) => c.toLowerCase().includes(searchLow)) ||
      memberChars.some(
        (ch) =>
          ch.characterName.toLowerCase().includes(searchLow) ||
          ch.buildName.toLowerCase().includes(searchLow) ||
          ch.ascendancy.toLowerCase().includes(searchLow)
      );

    const matchAsc =
      rosterAscendancyFilter === 'All' ||
      member.ascendancy === rosterAscendancyFilter ||
      memberChars.some((ch) => ch.ascendancy === rosterAscendancyFilter);
    const matchLaunch =
      rosterLaunchFilter === 'All' || member.availableAtLaunch === rosterLaunchFilter;

    return matchSearch && matchAsc && matchLaunch;
  });

  const handleOpenPlayerModal = (member: LeagueRosterMember, startEditing: boolean = false) => {
    setSelectedPlayerModal(member);
    setIsEditingProfileModal(startEditing);
    setShowAddCharForm(false);
    setModalEditDisplayName(member.displayName || '');
    setModalEditPoeAccount(member.poeAccountName || '');
    setModalEditCharName(member.characterName || '');
    setModalEditDiscord(member.discordName || '');
    setModalEditSlotNumber(member.slotNumber || 1);
    setModalEditAsc(member.ascendancy || 'Elementalist');
    setModalEditLevel(member.level || 1);
    setModalEditBuild(member.buildName || '');
    setModalEditPob(member.pobUrl || '');
    setModalEditNotes(member.notes || '');
    setTimeout(() => {
      playerProfileDialogRef.current?.showModal();
    }, 10);
  };

  const handleAdminRemoveRosterMember = (targetMember: LeagueRosterMember) => {
    if (!isCurrentUserAdmin) {
      triggerCopy('', 'Permission denied: Only league admins can remove exiles');
      return;
    }
    openDarkConfirm(
      'Remove Exile From League Roster',
      `Are you sure you want to remove @${targetMember.displayName} (${targetMember.characterName || targetMember.poeAccountName}) from the league roster?`,
      'Remove Exile',
      async () => {
        const memberKey = targetMember.id || targetMember.displayName;
        await deleteCloudRosterMember(activeSessionId, memberKey);
        setRoster((prev) => {
          const next = prev.filter(
            (m) => m.id !== targetMember.id && m.displayName.toLowerCase() !== targetMember.displayName.toLowerCase()
          );
          try {
            localStorage.setItem('poe_clean330_roster', JSON.stringify(next));
          } catch {}
          return next;
        });
        if (selectedPlayerModal && (selectedPlayerModal.id === targetMember.id || selectedPlayerModal.displayName === targetMember.displayName)) {
          playerProfileDialogRef.current?.close();
          setSelectedPlayerModal(null);
        }
        setCopyNotice(`Removed @${targetMember.displayName} from the league roster.`);
        setTimeout(() => setCopyNotice(null), 3500);
      }
    );
  };

  const persistUpdatedMember = (updatedMember: LeagueRosterMember) => {
    setSelectedPlayerModal(updatedMember);
    saveCloudRosterMember(activeSessionId, updatedMember);
    setRoster((prev) => {
      const next = prev.map((m) =>
        m.id === updatedMember.id ? updatedMember : m
      );
      try {
        localStorage.setItem('poe_clean330_roster', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleAddAltCharacter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayerModal || !newCharName.trim()) return;

    const existingChars = getMemberCharacters(selectedPlayerModal);
    const matchedNewAsc = currentAscendancyCatalog.find((a) => a.name === newCharAsc);
    const newChar: LeagueCharacter = {
      id: `char-${Date.now()}`,
      characterName: newCharName.trim(),
      ascendancy: newCharAsc,
      className: matchedNewAsc ? matchedNewAsc.baseClass : 'Exile',
      buildName: newCharBuild.trim() || 'Alt Build',
      level: Number(newCharLevel) || 1,
      pobUrl: newCharPob.trim() || '',
      isMain: false
    };

    const updatedMember: LeagueRosterMember = {
      ...selectedPlayerModal,
      characters: [...existingChars, newChar]
    };

    persistUpdatedMember(updatedMember);
    setNewCharName('');
    setNewCharBuild('');
    setNewCharLevel(1);
    setNewCharPob('');
    setShowAddCharForm(false);
    fireConfetti();
    setCopyNotice(`Added character ${newChar.characterName} to @${selectedPlayerModal.displayName}'s account slot!`);
    setTimeout(() => setCopyNotice(null), 3000);
  };

  const handleSetMainCharacter = (charId: string) => {
    if (!selectedPlayerModal) return;
    const existingChars = getMemberCharacters(selectedPlayerModal);
    const target = existingChars.find((c) => c.id === charId);
    if (!target) return;

    const nextChars = existingChars.map((c) => ({
      ...c,
      isMain: c.id === charId
    }));

    const updatedMember: LeagueRosterMember = {
      ...selectedPlayerModal,
      characterName: target.characterName,
      ascendancy: target.ascendancy,
      className: target.className || selectedPlayerModal.className,
      buildName: target.buildName,
      level: target.level,
      pobUrl: target.pobUrl || selectedPlayerModal.pobUrl,
      characters: nextChars
    };

    persistUpdatedMember(updatedMember);
    setCopyNotice(`Set ${target.characterName} as primary display character!`);
    setTimeout(() => setCopyNotice(null), 2500);
  };

  const handleRemoveAltCharacter = (charId: string) => {
    if (!selectedPlayerModal) return;
    const existingChars = getMemberCharacters(selectedPlayerModal);
    if (existingChars.length <= 1) {
      setCopyNotice('Each account slot must keep at least 1 character.');
      setTimeout(() => setCopyNotice(null), 2500);
      return;
    }

    const target = existingChars.find((c) => c.id === charId);
    if (!target) return;
    openDarkConfirm(
      'Remove Alt Character',
      `Remove character "${target.characterName}" from @${selectedPlayerModal.displayName}'s account slot?`,
      'Remove Character',
      () => {
        const remaining = existingChars.filter((c) => c.id !== charId);
        const stillHasMain = remaining.some((c) => c.isMain);
        const normalized = stillHasMain
          ? remaining
          : remaining.map((c, idx) => ({ ...c, isMain: idx === 0 }));
        const mainChar = normalized.find((c) => c.isMain) || normalized[0];

        const updatedMember: LeagueRosterMember = {
          ...selectedPlayerModal,
          characterName: mainChar.characterName,
          ascendancy: mainChar.ascendancy,
          className: mainChar.className || selectedPlayerModal.className,
          buildName: mainChar.buildName,
          level: mainChar.level,
          pobUrl: mainChar.pobUrl || '',
          characters: normalized
        };

        persistUpdatedMember(updatedMember);
        setCopyNotice(`Removed character ${target.characterName}.`);
        setTimeout(() => setCopyNotice(null), 2500);
      }
    );
  };

  const handleSyncOfficialLadder = async () => {
    setIsSyncingLadder(true);
    try {
      const res = await fetchOfficialPoeLadder(activeSessionId, undefined, true);
      if (!res || res.status !== 'ok' || !res.entries || res.entries.length === 0) {
        setCopyNotice(
          res?.message ||
            'Could not reach official PoE ladder (ensure profiles are public on pathofexile.com).'
        );
        setTimeout(() => setCopyNotice(null), 4500);
        return;
      }

      const entriesByAccount = new Map<string, typeof res.entries>();
      for (const entry of res.entries) {
        const accClean = entry.accountName.toLowerCase().trim();
        const accBase = accClean.split('#')[0];
        if (!entriesByAccount.has(accClean)) entriesByAccount.set(accClean, []);
        entriesByAccount.get(accClean)!.push(entry);
        if (accBase !== accClean) {
          if (!entriesByAccount.has(accBase)) entriesByAccount.set(accBase, []);
          entriesByAccount.get(accBase)!.push(entry);
        }
      }

      let updatedPlayers = 0;
      let discoveredAlts = 0;

      const nextRoster = roster.map((member) => {
        const mAcc = (member.poeAccountName || '').toLowerCase().trim();
        const mAccBase = mAcc.split('#')[0];
        const ladderChars = entriesByAccount.get(mAcc) || entriesByAccount.get(mAccBase);
        if (!ladderChars || ladderChars.length === 0) return member;

        const existingChars = getMemberCharacters(member);
        const charMap = new Map(existingChars.map((c) => [c.characterName.toLowerCase(), { ...c }]));

        for (const lc of ladderChars) {
          const key = lc.characterName.toLowerCase();
          if (charMap.has(key)) {
            const prev = charMap.get(key)!;
            prev.level = Math.max(prev.level || 1, lc.level);
            if (lc.ascendancy && lc.ascendancy !== 'Exile') prev.ascendancy = lc.ascendancy;
          } else {
            discoveredAlts += 1;
            charMap.set(key, {
              id: `char-ladder-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              characterName: lc.characterName,
              ascendancy: lc.ascendancy,
              className: lc.ascendancy,
              buildName: `${lc.ascendancy} (Ladder Synced)`,
              level: lc.level,
              isMain: false
            });
          }
        }

        const mergedChars = Array.from(charMap.values()).sort((a, b) => (b.level || 1) - (a.level || 1));
        const mainChar = mergedChars.find((c) => c.isMain) || mergedChars[0];
        updatedPlayers += 1;

        const updatedMember: LeagueRosterMember = {
          ...member,
          level: mainChar.level,
          ascendancy: mainChar.ascendancy,
          characterName: mainChar.characterName,
          characters: mergedChars
        };
        saveCloudRosterMember(activeSessionId, updatedMember);
        return updatedMember;
      });

      setRoster(nextRoster);
      fireConfetti();
      setCopyNotice(
        updatedPlayers > 0
          ? `Synced PoE Ladder: updated ${updatedPlayers} accounts (${discoveredAlts} new alt characters discovered)!`
          : `Ladder fetched (${res.entries.length} entries), but no matching PoE account names found on roster.`
      );
      setTimeout(() => setCopyNotice(null), 4500);
    } finally {
      setIsSyncingLadder(false);
    }
  };

  const handleSaveModalCharacterDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayerModal) return;

    const matchedAsc = currentAscendancyCatalog.find((a) => a.name === modalEditAsc);
    const resolvedClass = matchedAsc ? matchedAsc.baseClass : selectedPlayerModal.className;
    const cleanAccountName = modalEditPoeAccount.trim() || selectedPlayerModal.poeAccountName;
    const cleanCharName = modalEditCharName.trim() || selectedPlayerModal.characterName;
    const cleanDisplayName = modalEditDisplayName.trim() || selectedPlayerModal.displayName;
    const cleanDiscord = modalEditDiscord.trim() || selectedPlayerModal.discordName;
    const cleanSlot = Number(modalEditSlotNumber) || selectedPlayerModal.slotNumber;

    const updatedMember: LeagueRosterMember = {
      ...selectedPlayerModal,
      displayName: isCurrentUserAdmin ? cleanDisplayName : selectedPlayerModal.displayName,
      slotNumber: isCurrentUserAdmin ? cleanSlot : selectedPlayerModal.slotNumber,
      discordName: isCurrentUserAdmin ? cleanDiscord : selectedPlayerModal.discordName,
      poeAccountName: cleanAccountName,
      poeProfileUrl: `https://www.pathofexile.com/account/view-profile/${encodeURIComponent(cleanAccountName.split('#')[0])}`,
      characterName: cleanCharName,
      ascendancy: modalEditAsc,
      className: resolvedClass,
      level: Number(modalEditLevel) || 1,
      buildName: modalEditBuild.trim() || 'Undecided Starter',
      pobUrl: modalEditPob.trim() || undefined,
      notes: modalEditNotes.trim(),
      characters: (() => {
        const existing = getMemberCharacters(selectedPlayerModal);
        const mainIdx = existing.findIndex((c) => c.isMain);
        const idxToUpdate = mainIdx >= 0 ? mainIdx : 0;
        return existing.map((c, i) =>
          i === idxToUpdate
            ? {
                ...c,
                characterName: modalEditCharName.trim() || selectedPlayerModal.characterName,
                ascendancy: modalEditAsc,
                className: resolvedClass,
                level: Number(modalEditLevel) || 1,
                buildName: modalEditBuild.trim() || 'Undecided Starter',
                pobUrl: modalEditPob.trim(),
                notes: modalEditNotes.trim(),
                isMain: true
              }
            : c
        );
      })()
    };

    // Update selectedPlayerModal immediately so modal shows new info
    setSelectedPlayerModal(updatedMember);
    saveCloudRosterMember(activeSessionId, updatedMember);

    // Update roster state & localStorage
    setRoster((prev) => {
      const next = prev.map((m) =>
        (m.id === selectedPlayerModal.id || m.displayName.toLowerCase() === selectedPlayerModal.displayName.toLowerCase())
          ? updatedMember
          : m
      );
      try {
        localStorage.setItem('poe_clean330_roster', JSON.stringify(next));
      } catch {}
      return next;
    });

    // Update userAccount in parent & localStorage only if this is the active user
    const isTargetCurrentUser = Boolean(
      userAccount && (
        (selectedPlayerModal.id && userAccount.id === selectedPlayerModal.id) ||
        userAccount.displayName.toLowerCase() === selectedPlayerModal.displayName.toLowerCase()
      )
    );

    if (isTargetCurrentUser && userAccount) {
      const updatedAccount: UserAccount = {
        ...userAccount,
        displayName: isCurrentUserAdmin ? cleanDisplayName : userAccount.displayName,
        poeAccountName: updatedMember.poeAccountName,
        poeProfileUrl: updatedMember.poeProfileUrl,
        characterName: updatedMember.characterName,
        ascendancy: updatedMember.ascendancy,
        className: updatedMember.className,
        level: updatedMember.level,
        buildName: updatedMember.buildName,
        pobUrl: updatedMember.pobUrl,
        notes: updatedMember.notes
      };

      try {
        localStorage.setItem('poe_umbraleague_user', JSON.stringify(updatedAccount));

        const accountsRaw = localStorage.getItem('poe_clean330_accounts');
        const accountsList = accountsRaw ? JSON.parse(accountsRaw) : [];
        const aIdx = accountsList.findIndex((a: any) =>
          a.username.toLowerCase() === updatedAccount.displayName.toLowerCase() ||
          (updatedAccount.email && a.userAccount?.email?.toLowerCase() === updatedAccount.email.toLowerCase())
        );
        if (aIdx >= 0) {
          accountsList[aIdx].userAccount = updatedAccount;
          accountsList[aIdx].rosterEntry = updatedMember;
          localStorage.setItem('poe_clean330_accounts', JSON.stringify(accountsList));
        }
      } catch {}

      if (onUpdateUserAccount) {
        onUpdateUserAccount(updatedAccount, updatedMember);
      }
    }

    setIsEditingProfileModal(false);
    fireConfetti();
    setCopyNotice(`Saved updates for @${updatedMember.displayName}`);
    setTimeout(() => setCopyNotice(null), 3000);
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Filter by App Tag, character IGN, account, or planned build..."
            value={rosterSearch}
            onChange={(e) => setRosterSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-slate-700"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={rosterAscendancyFilter}
            onChange={(e) => setRosterAscendancyFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-slate-700"
          >
            <option value="All">All Ascendancies</option>
            {currentAscendancyCatalog.map((a) => (
              <option key={a.name} value={a.name}>
                {a.name} ({a.baseClass})
              </option>
            ))}
          </select>

          <select
            value={rosterLaunchFilter}
            onChange={(e) => setRosterLaunchFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-slate-700"
          >
            <option value="All">All Launch Times</option>
            <option value="Yes">Launch Day 1</option>
            <option value="Late Start">Late Start</option>
          </select>

          <button
            type="button"
            onClick={() => {
              const allAccounts = roster.map((m) => m.poeAccountName).join(', ');
              triggerCopy(allAccounts, 'All Account Names');
            }}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 font-mono flex items-center gap-1 cursor-pointer"
          >
            <Copy className="w-3 h-3" />
            <span>Copy All Tags</span>
          </button>

          <button
            type="button"
            disabled={isSyncingLadder}
            onClick={handleSyncOfficialLadder}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            title="Sync live character levels, ascendancies, and alt characters directly from the official Path of Exile ladder API"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isSyncingLadder ? 'animate-spin' : ''}`} />
            <span>{isSyncingLadder ? 'Syncing...' : 'Sync PoE Ladder'}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenInviteModal}
            className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow"
            title="Invite exiles to league"
          >
            <Send className="w-3 h-3" />
            <span>Invite Exiles</span>
          </button>

          {!isCurrentUserOnRoster && (
            <button
              type="button"
              onClick={handleOpenJoinModal}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow"
              title="Join this private league roster"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Join Roster</span>
            </button>
          )}
        </div>
      </div>

      {/* Roster Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filteredRoster.map((member) => {
          const isMe = Boolean(
            userAccount && (
              (member.id && userAccount.id === member.id) ||
              userAccount.displayName.toLowerCase() === member.displayName.toLowerCase() ||
              (userAccount.isAdmin && member.displayName.toLowerCase() === 'leuie')
            )
          );

          return (
            <div
              key={member.id}
              onClick={() => handleOpenPlayerModal(member)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 group ${
                isMe
                  ? 'border-indigo-500/70 bg-gradient-to-b from-slate-900 to-indigo-950/30 shadow-lg shadow-indigo-950/40 hover:border-indigo-400'
                  : 'border-slate-800 bg-slate-900/70 hover:bg-slate-800/60 hover:border-slate-700'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-200 group-hover:text-white">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenProfile?.(member.displayName);
                      }}
                      className="hover:text-indigo-300 hover:underline cursor-pointer"
                      title={`Open @${member.displayName}'s Exile Profile Page`}
                    >
                      @{member.displayName}
                    </button>
                    {isMe && (
                      <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[9px] font-mono">
                        My Exile
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                    {member.availableAtLaunch === 'Yes' ? 'Launch Day 1' : 'Late Start'}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
                  <span>{member.ascendancy} • Lvl {member.level}</span>
                  {getMemberCharacters(member).length > 1 && (
                    <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[9px] font-bold">
                      {getMemberCharacters(member).length} Chars
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-300 truncate">
                  {member.buildName}
                </div>

                {getMemberCharacters(member).length > 1 && (
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {getMemberCharacters(member)
                      .filter((c) => !c.isMain)
                      .map((alt) => (
                        <span
                          key={alt.id}
                          className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950/90 text-indigo-300 border border-indigo-500/30 truncate max-w-full"
                          title={`Alt: ${alt.characterName} (${alt.ascendancy} Lvl ${alt.level}) - ${alt.buildName}`}
                        >
                          Alt: {alt.characterName} ({alt.ascendancy} {alt.level})
                        </span>
                      ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-1 pt-1">
                  {member.atlasContent.map((mech, mIdx) => (
                    <span
                      key={mIdx}
                      className="text-[10px] px-1.5 py-0.2 rounded bg-slate-950 text-slate-400 border border-slate-800"
                    >
                      {mech}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-mono">IGN: {member.characterName}</span>
                <span className="text-slate-400 group-hover:text-indigo-300 transition-colors font-mono">
                  {isMe ? 'Edit Character →' : 'Profile →'}
                </span>
              </div>

              {isCurrentUserAdmin && (
                <div className="pt-2 border-t border-amber-500/30 flex items-center justify-between text-[11px] gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenPlayerModal(member, true);
                    }}
                    className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    title="Admin: Reassign owner or edit character details"
                  >
                    <Edit3 className="w-2.5 h-2.5" />
                    <span>Reassign, Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAdminRemoveRosterMember(member);
                    }}
                    className="px-2 py-0.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-mono flex items-center gap-1 cursor-pointer transition-colors"
                    title="Admin: Remove exile from league roster"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                    <span>Remove</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Player Profile Modal */}
      <dialog
        ref={playerProfileDialogRef}
        {...({ closedby: 'any' } as any)}
        aria-labelledby={playerProfileTitleId}
        className="w-[94vw] sm:w-full sm:max-w-xl rounded-2xl border border-slate-700 bg-slate-900 text-slate-200 p-0 shadow-2xl backdrop:bg-black/70 m-auto overflow-hidden"
      >
        {selectedPlayerModal && (
          <div className="flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-slate-800 bg-slate-800/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase">
                  Exile Profile • Slot #{selectedPlayerModal.slotNumber}
                </span>
                <h2 id={playerProfileTitleId} className="text-base font-bold text-white mt-0.5">
                  @{selectedPlayerModal.displayName}
                </h2>
                <div className="text-xs text-slate-400 font-mono flex flex-wrap items-center gap-2">
                  <span>Account: {selectedPlayerModal.poeAccountName} • IGN: {selectedPlayerModal.characterName}</span>
                  {onOpenProfile && (
                    <button
                      type="button"
                      onClick={() => {
                        playerProfileDialogRef.current?.close();
                        onOpenProfile(selectedPlayerModal.displayName);
                      }}
                      className="px-2 py-0.5 rounded bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 text-[10px] font-bold cursor-pointer transition-colors"
                    >
                      Open Full Exile Page →
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {(isCurrentUserAdmin || Boolean(
                  userAccount && (
                    (userAccount.id && selectedPlayerModal.id === userAccount.id) ||
                    userAccount.displayName.toLowerCase() === selectedPlayerModal.displayName.toLowerCase()
                  )
                )) && (
                  <button
                    type="button"
                    onClick={() => setIsEditingProfileModal((prev) => !prev)}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isEditingProfileModal ? 'Cancel Edit' : (isCurrentUserAdmin ? 'Admin Edit, Reassign' : 'Edit My Character')}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => playerProfileDialogRef.current?.close()}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {isEditingProfileModal ? (
              <form onSubmit={handleSaveModalCharacterDetails} className="p-4 space-y-3 overflow-y-auto max-h-[70vh] text-xs">
                <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs flex items-center gap-2">
                  <Sparkles className="w-4 h-4 flex-shrink-0" />
                  <span>
                    {isCurrentUserAdmin
                      ? 'Host Admin Editor: Reassign owner, adjust roster slot, or update character and build credentials.'
                      : 'Direct Character Editor: Update your Path of Exile account tag, IGN, ascendancy, and build live.'}
                  </span>
                </div>

                {isCurrentUserAdmin && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                    <div>
                      <label className="font-semibold text-amber-300 block mb-1">
                        Owner App Tag (Reassign)
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Leuie or Venulum"
                        value={modalEditDisplayName}
                        onChange={(e) => setModalEditDisplayName(e.target.value)}
                        className="w-full bg-slate-950 border border-amber-500/40 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-amber-300 block mb-1">
                        Roster Slot Number
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={modalEditSlotNumber}
                        onChange={(e) => setModalEditSlotNumber(Number(e.target.value) || 1)}
                        className="w-full bg-slate-950 border border-amber-500/40 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-amber-300 block mb-1">
                        Discord Tag
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. exile_disc"
                        value={modalEditDiscord}
                        onChange={(e) => setModalEditDiscord(e.target.value)}
                        className="w-full bg-slate-950 border border-amber-500/40 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">
                    Path of Exile Account Tag (e.g. Account#1234) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Leuie#1234"
                    value={modalEditPoeAccount}
                    onChange={(e) => setModalEditPoeAccount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">
                    Character Name (In Game IGN) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Leuie_Umbra"
                    value={modalEditCharName}
                    onChange={(e) => setModalEditCharName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">Ascendancy *</label>
                    <select
                      value={modalEditAsc}
                      onChange={(e) => setModalEditAsc(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      {currentAscendancyCatalog.map((asc) => (
                        <option key={asc.name} value={asc.name}>
                          {asc.name} ({asc.baseClass})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">Character Level</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={modalEditLevel}
                      onChange={(e) => setModalEditLevel(Number(e.target.value) || 1)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Planned Build Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Lightning Strike Slayer"
                    value={modalEditBuild}
                    onChange={(e) => setModalEditBuild(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">PoB URL (pobb.in)</label>
                  <input
                    type="url"
                    placeholder="https://pobb.in/..."
                    value={modalEditPob}
                    onChange={(e) => setModalEditPob(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Status, Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Profile notes or guild status..."
                    value={modalEditNotes}
                    onChange={(e) => setModalEditNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-t border-slate-800">
                  {isCurrentUserAdmin && (
                    <button
                      type="button"
                      onClick={() => handleAdminRemoveRosterMember(selectedPlayerModal)}
                      className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove from Roster</span>
                    </button>
                  )}

                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      type="button"
                      onClick={() => setIsEditingProfileModal(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow transition-all"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Character Changes</span>
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="p-4 overflow-y-auto space-y-3 text-xs">
                {/* Characters on This Account Slot */}
                {(() => {
                  const slotChars = getMemberCharacters(selectedPlayerModal);
                  const canManageSlot = Boolean(
                    isCurrentUserAdmin ||
                    (userAccount && (
                      (selectedPlayerModal.id && userAccount.id === selectedPlayerModal.id) ||
                      userAccount.displayName.toLowerCase() === selectedPlayerModal.displayName.toLowerCase()
                    ))
                  );

                  return (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-slate-400 uppercase text-[11px]">
                          Characters on Account Slot ({slotChars.length})
                        </span>
                        {canManageSlot && (
                          <button
                            type="button"
                            onClick={() => setShowAddCharForm((v) => !v)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            <span>{showAddCharForm ? 'Close Form' : 'Add Character'}</span>
                          </button>
                        )}
                      </div>

                      {showAddCharForm && canManageSlot && (
                        <form
                          onSubmit={handleAddAltCharacter}
                          className="p-3 rounded-xl border border-indigo-500/40 bg-indigo-950/20 space-y-2.5"
                        >
                          <div className="text-[11px] font-bold text-indigo-300">
                            Register Another Character Under @{selectedPlayerModal.displayName} (Uses Same Account Slot)
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-mono text-slate-400 block mb-0.5">Character IGN *</label>
                              <input
                                type="text"
                                required
                                value={newCharName}
                                onChange={(e) => setNewCharName(e.target.value)}
                                placeholder="e.g. UmbraBossKiller"
                                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-mono text-slate-400 block mb-0.5">Ascendancy</label>
                              <select
                                value={newCharAsc}
                                onChange={(e) => setNewCharAsc(e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                              >
                                {currentAscendancyCatalog.map((a) => (
                                  <option key={a.name} value={a.name}>
                                    {a.name} ({a.baseClass})
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div className="sm:col-span-2">
                              <label className="text-[10px] font-mono text-slate-400 block mb-0.5">Build Name *</label>
                              <input
                                type="text"
                                required
                                value={newCharBuild}
                                onChange={(e) => setNewCharBuild(e.target.value)}
                                placeholder="e.g. Archmage Ice Nova Hierophant"
                                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-mono text-slate-400 block mb-0.5">Level</label>
                              <input
                                type="number"
                                min={1}
                                max={100}
                                value={newCharLevel}
                                onChange={(e) => setNewCharLevel(Number(e.target.value))}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] font-mono text-slate-400 block mb-0.5">pobb.in URL (Optional)</label>
                            <input
                              type="text"
                              value={newCharPob}
                              onChange={(e) => setNewCharPob(e.target.value)}
                              placeholder="https://pobb.in/..."
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setShowAddCharForm(false)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] cursor-pointer"
                            >
                              Save Character
                            </button>
                          </div>
                        </form>
                      )}

                      <div className="space-y-2">
                        {slotChars.map((ch) => {
                          const charWishCount = lookingForItems.filter(
                            (it) =>
                              it.status !== 'HAVE' &&
                              it.characterName.toLowerCase() === ch.characterName.toLowerCase()
                          ).length;

                          return (
                            <div
                              key={ch.id}
                              className={`p-3 rounded-lg border space-y-1.5 ${
                                ch.isMain
                                  ? 'border-indigo-500/40 bg-slate-950/80'
                                  : 'border-slate-800 bg-slate-950/50'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2 font-mono">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-white font-bold">{ch.characterName}</span>
                                  {ch.isMain && (
                                    <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[9px] font-bold">
                                      MAIN
                                    </span>
                                  )}
                                  {charWishCount > 0 && (
                                    <span className="px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[9px]">
                                      {charWishCount} {charWishCount === 1 ? 'Need' : 'Needs'}
                                    </span>
                                  )}
                                </div>
                                <span className="text-slate-400">
                                  {ch.ascendancy} • Lvl {ch.level}
                                </span>
                              </div>

                              <div className="flex items-center justify-between gap-2">
                                <div className="text-slate-300">Build: {ch.buildName}</div>
                                <div className="flex items-center gap-1.5">
                                  {ch.pobUrl && (
                                    <a
                                      href={ch.pobUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-mono text-[10px]"
                                    >
                                      <span>PoB</span>
                                      <ExternalLink className="w-2.5 h-2.5" />
                                    </a>
                                  )}
                                  {canManageSlot && !ch.isMain && (
                                    <button
                                      type="button"
                                      onClick={() => handleSetMainCharacter(ch.id)}
                                      className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-200 text-[10px] font-mono flex items-center gap-0.5 cursor-pointer"
                                      title="Set as primary display character"
                                    >
                                      <Star className="w-2.5 h-2.5" />
                                      <span>Main</span>
                                    </button>
                                  )}
                                  {canManageSlot && slotChars.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveAltCharacter(ch.id)}
                                      className="p-1 rounded bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 cursor-pointer"
                                      title="Remove character"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {selectedPlayerModal.notes && (
                        <p className="text-slate-400 pt-1 text-[11px] italic">"{selectedPlayerModal.notes}"</p>
                      )}
                    </div>
                  );
                })()}

                {/* Items Wanted */}
                <div className="space-y-1.5">
                  <div className="font-mono text-slate-400 uppercase text-[11px]">
                    Wanted Items by {selectedPlayerModal.displayName}:
                  </div>
                  <div className="space-y-1">
                    {lookingForItems
                      .filter((it) => it.characterName.toLowerCase() === selectedPlayerModal.characterName.toLowerCase() || (it.displayName && it.displayName.toLowerCase() === selectedPlayerModal.displayName.toLowerCase()))
                      .map((item, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded border border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-slate-200 truncate">{item.itemName}</span>
                            {item.characterName && (
                              <span className="px-1.5 py-0.2 rounded bg-slate-800 text-indigo-300 border border-slate-700 font-mono text-[10px] flex-shrink-0">
                                {item.characterName}
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-[10px] text-slate-400 flex-shrink-0">{item.status}</span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Contact & Whisper buttons */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="text-[10px] font-mono uppercase text-slate-400">
                    Contact & Whisper Actions:
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Root Whisper */}
                    <button
                      type="button"
                      onClick={() => {
                        const target = selectedPlayerModal.displayName || selectedPlayerModal.characterName;
                        triggerCopy(`@${target} Hey! Saw your wanted item on Exile SSF: `, 'Root Whisper');
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800/80 text-emerald-300 font-mono text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Copy message format for Root Community"
                    >
                      <Users className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copy Root Whisper</span>
                    </button>

                    {/* Discord Whisper */}
                    <button
                      type="button"
                      onClick={() => {
                        const target = selectedPlayerModal.discordName || selectedPlayerModal.displayName;
                        triggerCopy(`@${target} Hey! Saw your wanted item on Exile SSF: `, 'Discord Whisper');
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-800/80 text-indigo-300 font-mono text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Copy message format for Discord DM"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Copy Discord Whisper</span>
                    </button>

                    {/* In Game Whisper */}
                    <button
                      type="button"
                      onClick={() => triggerCopy(`@${selectedPlayerModal.characterName} `, 'In Game Whisper')}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy In Game Whisper</span>
                    </button>

                    {/* Account Tag */}
                    <button
                      type="button"
                      onClick={() => triggerCopy(selectedPlayerModal.poeAccountName, 'PoE Account Name')}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy Account Tag</span>
                    </button>
                  </div>
                </div>

                {/* Host Admin Controls in Profile View */}
                {isCurrentUserAdmin && (
                  <div className="pt-2 border-t border-amber-500/30 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">
                      Admin Roster Actions
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAdminRemoveRosterMember(selectedPlayerModal)}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono text-[11px] flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove Exile</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </dialog>
      {/* Native Dark Confirmation Modal */}
      <dialog
        ref={confirmDialogRef}
        {...({ closedby: 'any' } as any)}
        className="w-[94vw] sm:w-full sm:max-w-md rounded-2xl border border-rose-500/40 bg-slate-900 text-slate-200 p-0 shadow-2xl backdrop:bg-black/75 m-auto overflow-hidden"
      >
        {confirmModal && (
          <div className="flex flex-col">
            <div className="p-4 border-b border-slate-800 bg-rose-950/30 flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-300">
                {confirmModal.title}
              </span>
              <button
                type="button"
                onClick={() => {
                  confirmDialogRef.current?.close();
                  setConfirmModal(null);
                }}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 text-xs text-slate-300 leading-relaxed">
              {confirmModal.message}
            </div>
            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  confirmDialogRef.current?.close();
                  setConfirmModal(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const fn = confirmModal.onConfirm;
                  confirmDialogRef.current?.close();
                  setConfirmModal(null);
                  await fn();
                }}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer shadow"
              >
                {confirmModal.confirmLabel}
              </button>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
};
