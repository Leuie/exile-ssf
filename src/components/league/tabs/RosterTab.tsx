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
  X
} from 'lucide-react';
import type { LeagueRosterMember, UserAccount, LookingForItem } from '../../../types';
import { saveCloudRosterMember, deleteCloudRosterMember } from '../../../services/cloudSync';

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
  onUpdateUserAccount
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

  const filteredRoster = roster.filter((member) => {
    const searchLow = rosterSearch.toLowerCase();
    const matchSearch =
      !rosterSearch ||
      member.displayName.toLowerCase().includes(searchLow) ||
      member.characterName.toLowerCase().includes(searchLow) ||
      member.poeAccountName.toLowerCase().includes(searchLow) ||
      (member.discordName && member.discordName.toLowerCase().includes(searchLow)) ||
      (member.steamName && member.steamName.toLowerCase().includes(searchLow)) ||
      member.buildName.toLowerCase().includes(searchLow) ||
      member.ascendancy.toLowerCase().includes(searchLow) ||
      member.atlasContent.some((c) => c.toLowerCase().includes(searchLow));

    const matchAsc =
      rosterAscendancyFilter === 'All' || member.ascendancy === rosterAscendancyFilter;
    const matchLaunch =
      rosterLaunchFilter === 'All' || member.availableAtLaunch === rosterLaunchFilter;

    return matchSearch && matchAsc && matchLaunch;
  });

  const handleOpenPlayerModal = (member: LeagueRosterMember, startEditing: boolean = false) => {
    setSelectedPlayerModal(member);
    setIsEditingProfileModal(startEditing);
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

  const handleAdminRemoveRosterMember = async (targetMember: LeagueRosterMember) => {
    if (!isCurrentUserAdmin) {
      triggerCopy('', 'Permission denied: Only league admins can remove exiles');
      return;
    }
    const confirmDelete = window.confirm(
      `Are you sure you want to remove @${targetMember.displayName} (${targetMember.characterName || targetMember.poeAccountName}) from the league roster?`
    );
    if (!confirmDelete) return;

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
      notes: modalEditNotes.trim()
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
                    <span>@{member.displayName}</span>
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

                <div className="text-[11px] font-mono text-slate-400">
                  {member.ascendancy} • Lvl {member.level}
                </div>

                <div className="text-xs text-slate-300 truncate">
                  {member.buildName}
                </div>

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
                <div className="text-xs text-slate-400 font-mono">
                  Account: {selectedPlayerModal.poeAccountName} • IGN: {selectedPlayerModal.characterName}
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
                {/* Build info */}
                <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/70 space-y-1.5">
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-slate-100 font-semibold">{selectedPlayerModal.ascendancy} ({selectedPlayerModal.className})</span>
                    <span className="text-slate-400">Lvl {selectedPlayerModal.level}</span>
                  </div>
                  <div className="text-slate-300">Build: {selectedPlayerModal.buildName}</div>
                  {selectedPlayerModal.pobUrl && (
                    <a
                      href={selectedPlayerModal.pobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-slate-400 hover:text-white font-mono text-[11px]"
                    >
                      <span>pobb.in</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                  {selectedPlayerModal.notes && (
                    <p className="text-slate-400 pt-1 text-[11px]">"{selectedPlayerModal.notes}"</p>
                  )}
                </div>

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
                          <span className="text-slate-200">{item.itemName}</span>
                          <span className="font-mono text-[10px] text-slate-400">{item.status}</span>
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
    </div>
  );
};
