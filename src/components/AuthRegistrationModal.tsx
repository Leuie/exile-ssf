import React, { useEffect, useId, useRef, useState } from 'react';
import {
  ShieldCheck,
  UserCheck,
  LogOut,
  Sparkles,
  X,
  CheckCircle2,
  Globe,
  KeyRound,
  MessageSquare,
  AtSign,
  } from 'lucide-react';
import { ASCENDANCY_CATALOG } from '../data/privateLeagueData';
import type { UserAccount, LeagueRosterMember, ContactPlatform } from '../types';
import { fireConfetti } from '../utils/confetti';

interface AuthRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userAccount: UserAccount | null;
  onSaveAccount: (account: UserAccount, rosterEntry: LeagueRosterMember) => void;
  onSignOut: () => void;
  existingRosterMember?: LeagueRosterMember;
}

export const AuthRegistrationModal: React.FC<AuthRegistrationModalProps> = ({
  isOpen,
  onClose,
  userAccount,
  onSaveAccount,
  onSignOut,
  existingRosterMember
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  const [provider, setProvider] = useState<'google' | 'poe'>(userAccount?.provider || 'poe');
  const [step, setStep] = useState<'oauth' | 'register'>(userAccount ? 'register' : 'oauth');
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

  // Dynamic Tagging & Profile State
  const [displayName, setDisplayName] = useState<string>(
    userAccount?.displayName || existingRosterMember?.displayName || 'Leuie'
  );
  const [preferredContact, setPreferredContact] = useState<ContactPlatform>(
    userAccount?.preferredContact || existingRosterMember?.preferredContact || 'app'
  );
  const [poeAccountName, setPoeAccountName] = useState<string>(
    userAccount?.poeAccountName || existingRosterMember?.poeAccountName || ''
  );
  const [characterName, setCharacterName] = useState<string>(
    userAccount?.characterName || existingRosterMember?.characterName || ''
  );
  const [discordName, setDiscordName] = useState<string>(
    userAccount?.discordName || existingRosterMember?.discordName || ''
  );
  const [steamName, setSteamName] = useState<string>(
    userAccount?.steamName || existingRosterMember?.steamName || ''
  );
  const [customTag, setCustomTag] = useState<string>(
    userAccount?.customTag || existingRosterMember?.customTag || ''
  );
  const [email, setEmail] = useState<string>(userAccount?.email || '');

  // Character Build & League State
  const [selectedAscendancy, setSelectedAscendancy] = useState<string>(
    userAccount?.ascendancy || existingRosterMember?.ascendancy || 'Hierophant'
  );
  const [leagueMode, setLeagueMode] = useState<'Private' | 'Softcore' | 'SSF'>(
    userAccount?.leagueMode || existingRosterMember?.leagueMode || 'Private'
  );
  const [availableAtLaunch, setAvailableAtLaunch] = useState<'Yes' | 'No' | 'Late Start'>(
    userAccount?.availableAtLaunch || existingRosterMember?.availableAtLaunch || 'Yes'
  );
  const [level, setLevel] = useState<number>(
    userAccount?.level || existingRosterMember?.level || 1
  );
  const [buildName, setBuildName] = useState<string>(
    userAccount?.buildName || existingRosterMember?.buildName || ''
  );
  const [pobUrl, setPobUrl] = useState<string>(
    userAccount?.pobUrl || existingRosterMember?.pobUrl || ''
  );
  const [atlasContent, setAtlasContent] = useState<string>(
    userAccount?.atlasContent?.join(', ') || existingRosterMember?.atlasContent?.join(', ') || 'Expedition, Harvest'
  );
  const [notes, setNotes] = useState<string>(
    userAccount?.notes || existingRosterMember?.notes || ''
  );

  // Sync form state when modal opens or userAccount changes
  useEffect(() => {
    if (userAccount) {
      setProvider(userAccount.provider);
      setDisplayName(userAccount.displayName || 'Exile');
      setPreferredContact(userAccount.preferredContact || 'app');
      setEmail(userAccount.email || '');
      setPoeAccountName(userAccount.poeAccountName);
      setCharacterName(userAccount.characterName);
      setDiscordName(userAccount.discordName || '');
      setSteamName(userAccount.steamName || '');
      setCustomTag(userAccount.customTag || '');
      setSelectedAscendancy(userAccount.ascendancy);
      setLeagueMode(userAccount.leagueMode);
      setAvailableAtLaunch(userAccount.availableAtLaunch);
      setLevel(userAccount.level);
      setBuildName(userAccount.buildName);
      setPobUrl(userAccount.pobUrl || '');
      setAtlasContent(userAccount.atlasContent?.join(', ') || '');
      setNotes(userAccount.notes);
      setStep('register');
    } else {
      setStep('oauth');
      if (existingRosterMember) {
        setDisplayName(existingRosterMember.displayName || 'Exile');
        setPreferredContact(existingRosterMember.preferredContact || 'app');
        setPoeAccountName(existingRosterMember.poeAccountName);
        setCharacterName(existingRosterMember.characterName);
        setDiscordName(existingRosterMember.discordName || '');
        setSteamName(existingRosterMember.steamName || '');
        setCustomTag(existingRosterMember.customTag || '');
        setSelectedAscendancy(existingRosterMember.ascendancy);
        setLeagueMode(existingRosterMember.leagueMode);
        setAvailableAtLaunch(existingRosterMember.availableAtLaunch);
        setLevel(existingRosterMember.level);
        setBuildName(existingRosterMember.buildName);
        setPobUrl(existingRosterMember.pobUrl || '');
        setAtlasContent(existingRosterMember.atlasContent?.join(', ') || '');
        setNotes(existingRosterMember.notes);
      }
    }
  }, [userAccount, existingRosterMember, isOpen]);

  // Open / close native <dialog> via showModal()
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  // Fallback for browsers that do not yet support closedby="any"
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleNativeClose = () => {
      onClose();
    };
    dialog.addEventListener('close', handleNativeClose);

    let handleBackdropClick: ((e: MouseEvent) => void) | undefined;
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      handleBackdropClick = (e: MouseEvent) => {
        if (e.target === dialog) {
          const rect = dialog.getBoundingClientRect();
          const clickedInDialog =
            rect.top <= e.clientY &&
            e.clientY <= rect.top + rect.height &&
            rect.left <= e.clientX &&
            e.clientX <= rect.left + rect.width;
          if (!clickedInDialog) {
            dialog.close();
          }
        }
      };
      dialog.addEventListener('click', handleBackdropClick);
    }

    return () => {
      dialog.removeEventListener('close', handleNativeClose);
      if (handleBackdropClick) {
        dialog.removeEventListener('click', handleBackdropClick);
      }
    };
  }, [onClose]);

  const handleOAuthSimulate = (chosenProvider: 'poe' | 'google') => {
    setProvider(chosenProvider);
    setIsAuthenticating(true);
    setTimeout(() => {
      setIsAuthenticating(false);
      if (chosenProvider === 'poe' && !poeAccountName) {
        setPoeAccountName('Exile#3300');
        if (!displayName) setDisplayName('Exile');
      }
      if (chosenProvider === 'google' && !email) {
        setEmail('exile@noircommunity.com');
        if (!displayName) setDisplayName('Exile');
      }
      setStep('register');
    }, 350);
  };

  const handleSubmitRegistration = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanDisplay = displayName.trim() || 'Exile';
    const cleanPoeAccount = poeAccountName.trim() || 'Exile#3300';
    const cleanCharName = characterName.trim() || `${cleanDisplay}_Umbra`;
    const cleanDiscord = discordName.trim()
      ? discordName.trim().startsWith('@')
        ? discordName.trim()
        : `@${discordName.trim()}`
      : undefined;

    const matchedAsc = ASCENDANCY_CATALOG.find((a) => a.name === selectedAscendancy);
    const baseClass = matchedAsc ? matchedAsc.baseClass : 'Templar';

    const rosterId = existingRosterMember?.id || `roster-user-${Date.now()}`;
    const atlasArray = atlasContent
      .split(/[,/]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const newAccount: UserAccount = {
      id: userAccount?.id || `usr-${Date.now()}`,
      provider,
      displayName: cleanDisplay,
      preferredContact,
      poeAccountName: cleanPoeAccount,
      characterName: cleanCharName,
      discordName: cleanDiscord,
      steamName: steamName.trim() || undefined,
      customTag: customTag.trim() || undefined,
      email: provider === 'google' ? email.trim() || 'exile@noircommunity.com' : undefined,
      className: baseClass,
      ascendancy: selectedAscendancy,
      leagueMode,
      availableAtLaunch,
      level: Number(level) || 1,
      buildName: buildName.trim() || 'Undecided 3.30 Starter',
      pobUrl: pobUrl.trim() || undefined,
      atlasContent: atlasArray.length > 0 ? atlasArray : ['Expedition', 'Harvest'],
      notes: notes.trim() || 'Registered via NOIR 3.30 Coven of Umbra Portal',
      inviteStatus: existingRosterMember?.inviteStatus || 'Accepted',
      registeredAt: userAccount?.registeredAt || new Date().toISOString().slice(0, 10)
    };

    const newRosterEntry: LeagueRosterMember = {
      id: rosterId,
      slotNumber: existingRosterMember?.slotNumber || 18,
      leagueMode,
      displayName: cleanDisplay,
      preferredContact,
      poeAccountName: cleanPoeAccount,
      characterName: cleanCharName,
      discordName: cleanDiscord,
      steamName: steamName.trim() || undefined,
      customTag: customTag.trim() || undefined,
      className: baseClass,
      ascendancy: selectedAscendancy,
      availableAtLaunch,
      level: Number(level) || 1,
      buildName: buildName.trim() || 'Undecided 3.30 Starter',
      pobUrl: pobUrl.trim() || undefined,
      atlasContent: atlasArray.length > 0 ? atlasArray : ['Expedition', 'Harvest'],
      notes: notes.trim() || 'Registered via NOIR 3.30 Coven of Umbra Portal',
      inviteStatus: existingRosterMember?.inviteStatus || 'Accepted',
      isSupporterHeart: existingRosterMember?.isSupporterHeart || false,
      isOnline: true
    };

    onSaveAccount(newAccount, newRosterEntry);
    fireConfetti();
    dialogRef.current?.close();
  };

  return (
    <dialog
      ref={dialogRef}
      {...({ closedby: 'any' } as any)}
      aria-labelledby={titleId}
      className="w-[94vw] sm:w-full sm:max-w-2xl rounded-3xl border border-indigo-500/40 bg-white dark:bg-[#1a1a2e] text-slate-900 dark:text-slate-100 p-0 shadow-2xl backdrop:bg-slate-950/80 backdrop:backdrop-blur-md m-auto overflow-hidden"
    >
      {/* Top Header */}
      <div className="p-6 border-b border-slate-200 dark:border-[#2d2d44] bg-gradient-to-r from-indigo-600/15 via-purple-600/10 to-amber-500/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-inner">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-indigo-500 dark:text-indigo-300 font-bold">
              NOIR Private League Portal • Patch 3.30
            </div>
            <h2 id={titleId} className="text-lg sm:text-xl font-poppins font-bold text-slate-900 dark:text-white">
              {userAccount
                ? 'Manage Your Registration & Contact Handles'
                : 'Sign In & Register for 3.30 Coven of Umbra'}
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          className="p-2 rounded-xl bg-slate-100 dark:bg-[#2d2d44] text-slate-500 dark:text-slate-300 hover:text-white hover:bg-indigo-600 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 max-h-[80vh] overflow-y-auto space-y-6">
        {/* Step 1: OAuth Simulation */}
        {step === 'oauth' && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              Connect your account to claim your private league spot and register your preferred contact handles.
              Our <strong>Dynamic Tagging System</strong> supports direct App User tags, in game whispers, Discord, and Steam so everyone can communicate seamlessly regardless of platform!
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                disabled={isAuthenticating}
                onClick={() => handleOAuthSimulate('poe')}
                className="p-5 rounded-2xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/15 via-[#1a1a2e] to-[#0f172a] hover:border-amber-400 text-left space-y-3 transition-all group cursor-pointer shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-mono font-bold uppercase">
                    Recommended for PoE 1
                  </span>
                  <KeyRound className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="font-poppins font-bold text-base text-white">
                  Sign in with Path of Exile
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Authenticate via Path of Exile to link your account tag (<code className="text-amber-300">Account#1234</code>) for instant private league invites.
                </p>
              </button>

              <button
                type="button"
                disabled={isAuthenticating}
                onClick={() => handleOAuthSimulate('google')}
                className="p-5 rounded-2xl border-2 border-indigo-500/40 bg-gradient-to-br from-indigo-500/15 via-[#1a1a2e] to-[#0f172a] hover:border-indigo-400 text-left space-y-3 transition-all group cursor-pointer shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-[10px] font-mono font-bold uppercase">
                    Google OAuth
                  </span>
                  <Globe className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="font-poppins font-bold text-base text-white">
                  Sign in with Google
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Sign in with your Google account to link your roster entry and sync your Looking For wishlist.
                </p>
              </button>
            </div>

            {isAuthenticating && (
              <div className="text-center py-4 text-xs font-mono text-indigo-400 animate-pulse">
                Verifying OAuth handshake and loading NOIR 3.30 Coven of Umbra registration...
              </div>
            )}
          </div>
        )}

        {/* Step 2: Dynamic Tagging & Registration Form */}
        {step === 'register' && (
          <form onSubmit={handleSubmitRegistration} className="space-y-6">
            {/* Connected Provider Banner */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-2xl bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-[#2d2d44]">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Connected via{' '}
                  <strong className="text-indigo-500 dark:text-indigo-300">
                    {provider === 'poe' ? 'Path of Exile OAuth' : 'Google Authentication'}
                  </strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
                {!userAccount && (
                  <button
                    type="button"
                    onClick={() => setStep('oauth')}
                    className="text-[11px] text-slate-500 hover:text-indigo-400 underline cursor-pointer"
                  >
                    Switch Auth Provider
                  </button>
                )}
                {userAccount && (
                  <button
                    type="button"
                    onClick={() => {
                      onSignOut();
                      dialogRef.current?.close();
                    }}
                    className="px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500/25 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
            </div>

            {/* DYNAMIC TAGGING SYSTEM SECTION */}
            <div className="p-5 rounded-2xl border-2 border-indigo-500/30 bg-slate-50/70 dark:bg-[#0f172a]/70 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AtSign className="w-4 h-4 text-indigo-400" />
                  <span className="font-poppins font-bold text-sm text-slate-900 dark:text-white">
                    Dynamic Tagging & Contact Channels
                  </span>
                </div>
                <span className="text-[10px] font-mono text-indigo-400 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                  No Discord Required
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Choose how squad mates should notify you when they drop an item you need. You can use your <strong>Root Web App user tag</strong>, in game whisper, Discord, or Steam!
              </p>

              {/* Preferred Contact Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                  Primary / Preferred Contact Channel *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'app', label: 'Root Web App', icon: Globe, desc: 'Site Profile @Tag' },
                    { id: 'poe_whisper', label: 'In Game PoE', icon: MessageSquare, desc: 'Direct /whisper' },
                    { id: 'discord', label: 'Discord', icon: AtSign, desc: 'Discord DM / Tag' },
                    { id: 'steam', label: 'Steam', icon: ShieldCheck, desc: 'Steam Community' }
                  ].map((chan) => (
                    <button
                      type="button"
                      key={chan.id}
                      onClick={() => setPreferredContact(chan.id as ContactPlatform)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        preferredContact === chan.id
                          ? 'border-indigo-500 bg-indigo-500/20 text-white shadow-md'
                          : 'border-slate-200 dark:border-[#2d2d44] bg-white dark:bg-[#1a1a2e] text-slate-600 dark:text-slate-400 hover:border-indigo-400/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{chan.label}</span>
                        {preferredContact === chan.id && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                        {chan.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Channel Handles Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Root App User Tag / Display Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Leuie"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-white dark:bg-[#1a1a2e] border border-slate-300 dark:border-[#2d2d44] rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                    Your site identity for in app notes, roster, and drop claims.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Path of Exile Account Tag (with # discriminator) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Leuie#0001"
                    value={poeAccountName}
                    onChange={(e) => setPoeAccountName(e.target.value)}
                    className="w-full bg-white dark:bg-[#1a1a2e] border border-slate-300 dark:border-[#2d2d44] rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                    Required for NOIR officers to send your in game league invite.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Discord Handle (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. @leuie (leave empty if not using Discord)"
                    value={discordName}
                    onChange={(e) => setDiscordName(e.target.value)}
                    className="w-full bg-white dark:bg-[#1a1a2e] border border-slate-300 dark:border-[#2d2d44] rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Steam Name or Alternate Handle (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Leuie_Steam or Forum Handle"
                    value={steamName}
                    onChange={(e) => setSteamName(e.target.value)}
                    className="w-full bg-white dark:bg-[#1a1a2e] border border-slate-300 dark:border-[#2d2d44] rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Character & Planned Build */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Character Name (IGN) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Leuie_UmbraIgnite"
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-[#2d2d44] rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Planned Ascendancy *
                </label>
                <select
                  value={selectedAscendancy}
                  onChange={(e) => setSelectedAscendancy(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-[#2d2d44] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                >
                  {ASCENDANCY_CATALOG.map((item) => (
                    <option key={item.name} value={item.name}>
                      {item.name} ({item.baseClass})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Playing at Launch?
                </label>
                <select
                  value={availableAtLaunch}
                  onChange={(e) => setAvailableAtLaunch(e.target.value as 'Yes' | 'No' | 'Late Start')}
                  className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-[#2d2d44] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Yes">Yes (Day 1 Launch)</option>
                  <option value="Late Start">Late Start / Weekend Start</option>
                  <option value="No">Joining Later in League</option>
                </select>
              </div>
            </div>

            {/* Build Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Planned League Starter Build *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Penance Brand Ignite Elementalist"
                  value={buildName}
                  onChange={(e) => setBuildName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-[#2d2d44] rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  League Mode & Level
                </label>
                <div className="flex gap-2">
                  <select
                    value={leagueMode}
                    onChange={(e) => setLeagueMode(e.target.value as 'Private' | 'Softcore' | 'SSF')}
                    className="flex-1 bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-[#2d2d44] rounded-xl px-2.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Private">NOIR Private GSF</option>
                    <option value="SSF">Solo Self Found</option>
                    <option value="Softcore">Trade League</option>
                  </select>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={level}
                    onChange={(e) => setLevel(Number(e.target.value))}
                    className="w-16 bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-[#2d2d44] rounded-xl px-2.5 py-2 text-xs text-center font-orbitron text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    title="Character Level"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Atlas Content Specialization
                </label>
                <input
                  type="text"
                  placeholder="e.g. Betrayal, Essences, Expedition, Harvest"
                  value={atlasContent}
                  onChange={(e) => setAtlasContent(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-[#2d2d44] rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Path of Building Link (pobb.in)
                </label>
                <input
                  type="url"
                  placeholder="https://pobb.in/..."
                  value={pobUrl}
                  onChange={(e) => setPobUrl(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-[#2d2d44] rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Roster Notes & Crafting Specialization
              </label>
              <input
                type="text"
                placeholder="e.g. Farming Jun unveils day 1; craft requests welcome!"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-[#2d2d44] rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-[#2d2d44] flex items-center justify-between gap-3">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span>Dynamic Tagging active: primary channel is {preferredContact.toUpperCase()}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => dialogRef.current?.close()}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#2d2d44] text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-[#3f3f5f] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{userAccount ? 'Update Profile & Handles' : 'Complete Registration'}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </dialog>
  );
};
