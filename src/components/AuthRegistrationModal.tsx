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
  Lock,
  AlertCircle
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

// Irreversible cryptographic hash of the admin secret key (Plain text is never committed to source)
const ADMIN_KEY_SHA256 = '5fa6bba1018db3415c42db05cc93959d8f58a68dfea692677bd15f2a868bc05d';

async function computeSHA256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text.trim());
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

interface StoredAppAccount {
  username: string;
  passwordHash: string;
  userAccount: UserAccount;
  rosterEntry: LeagueRosterMember;
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

  // Auth Method: 'google' | 'app'
  const [authMethod, setAuthMethod] = useState<'google' | 'app'>('google');
  const [appAuthMode, setAppAuthMode] = useState<'signin' | 'create'>('signin');
  const [step, setStep] = useState<'auth_choice' | 'link_poe_profile'>(userAccount ? 'link_poe_profile' : 'auth_choice');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // App Account Credentials
  const [appUsername, setAppUsername] = useState<string>('');
  const [appPassword, setAppPassword] = useState<string>('');
  const [appPasswordConfirm, setAppPasswordConfirm] = useState<string>('');

  // Google Auth Inputs
  const [googleEmail, setGoogleEmail] = useState<string>(userAccount?.email || '');

  // Linked Admin Google Email stored in browser
  const [linkedAdminGoogle, setLinkedAdminGoogle] = useState<string>(() => {
    try {
      return localStorage.getItem('poe_clean330_admin_google') || '';
    } catch {
      return '';
    }
  });

  // Exile Profile & PoE Link State
  const [displayName, setDisplayName] = useState<string>(
    userAccount?.displayName || existingRosterMember?.displayName || ''
  );
  const [preferredContact, setPreferredContact] = useState<ContactPlatform>(
    userAccount?.preferredContact || existingRosterMember?.preferredContact || 'app'
  );
  const [poeAccountName, setPoeAccountName] = useState<string>(
    userAccount?.poeAccountName || existingRosterMember?.poeAccountName || ''
  );
  const [poeProfileUrl, setPoeProfileUrl] = useState<string>(
    userAccount?.poeProfileUrl || existingRosterMember?.poeProfileUrl || ''
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
      setAuthMethod(userAccount.provider);
      setDisplayName(userAccount.displayName || '');
      setPreferredContact(userAccount.preferredContact || 'app');
      setGoogleEmail(userAccount.email || userAccount.linkedGoogleEmail || '');
      setPoeAccountName(userAccount.poeAccountName || '');
      setPoeProfileUrl(userAccount.poeProfileUrl || '');
      setCharacterName(userAccount.characterName || '');
      setDiscordName(userAccount.discordName || '');
      setSteamName(userAccount.steamName || '');
      setCustomTag(userAccount.customTag || '');
      setSelectedAscendancy(userAccount.ascendancy || 'Hierophant');
      setLeagueMode(userAccount.leagueMode || 'Private');
      setAvailableAtLaunch(userAccount.availableAtLaunch || 'Yes');
      setLevel(userAccount.level || 1);
      setBuildName(userAccount.buildName || '');
      setPobUrl(userAccount.pobUrl || '');
      setAtlasContent(userAccount.atlasContent?.join(', ') || '');
      setNotes(userAccount.notes || '');
      setStep('link_poe_profile');
    } else {
      setStep('auth_choice');
      setAuthError(null);
      if (existingRosterMember) {
        setDisplayName(existingRosterMember.displayName || '');
        setPreferredContact(existingRosterMember.preferredContact || 'app');
        setPoeAccountName(existingRosterMember.poeAccountName || '');
        setPoeProfileUrl(existingRosterMember.poeProfileUrl || '');
        setCharacterName(existingRosterMember.characterName || '');
        setDiscordName(existingRosterMember.discordName || '');
        setSteamName(existingRosterMember.steamName || '');
        setCustomTag(existingRosterMember.customTag || '');
        setSelectedAscendancy(existingRosterMember.ascendancy || 'Hierophant');
        setLeagueMode(existingRosterMember.leagueMode || 'Private');
        setAvailableAtLaunch(existingRosterMember.availableAtLaunch || 'Yes');
        setLevel(existingRosterMember.level || 1);
        setBuildName(existingRosterMember.buildName || '');
        setPobUrl(existingRosterMember.pobUrl || '');
        setAtlasContent(existingRosterMember.atlasContent?.join(', ') || '');
        setNotes(existingRosterMember.notes || '');
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

  // Fallback for click outside
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

  // Helper: Create admin account object
  const createAdminLeuieAccount = (linkedGoogle?: string): { account: UserAccount; roster: LeagueRosterMember } => {
    const effectiveGoogle = linkedGoogle?.trim().toLowerCase() || linkedAdminGoogle || undefined;
    const adminAccount: UserAccount = {
      id: 'usr-leuie',
      provider: effectiveGoogle ? 'google' : 'app',
      displayName: 'Leuie',
      preferredContact: 'app',
      poeAccountName: 'Leuie#0001',
      poeProfileUrl: 'https://www.pathofexile.com/account/view-profile/Leuie',
      characterName: 'Leuie_Umbra',
      discordName: '@leuie',
      email: effectiveGoogle,
      linkedGoogleEmail: effectiveGoogle,
      className: 'Witch',
      ascendancy: 'Elementalist',
      leagueMode: 'Private',
      availableAtLaunch: 'Yes',
      level: 95,
      buildName: 'Penance Brand Ignite Elementalist',
      pobUrl: 'https://pobb.in/',
      atlasContent: ['Betrayal', 'Essences', 'Expedition'],
      notes: 'League Host & Admin. Welcome to Ravenwatch Coven of Umbra GSF!',
      inviteStatus: 'Accepted',
      registeredAt: '2026-11-01',
      isAdmin: true
    };

    const adminRoster: LeagueRosterMember = {
      id: 'member-leuie',
      slotNumber: 1,
      leagueMode: 'Private',
      displayName: 'Leuie',
      preferredContact: 'app',
      poeAccountName: 'Leuie#0001',
      poeProfileUrl: 'https://www.pathofexile.com/account/view-profile/Leuie',
      characterName: 'Leuie_Umbra',
      discordName: '@leuie',
      className: 'Witch',
      ascendancy: 'Elementalist',
      availableAtLaunch: 'Yes',
      level: 95,
      buildName: 'Penance Brand Ignite Elementalist',
      pobUrl: 'https://pobb.in/',
      atlasContent: ['Betrayal', 'Essences', 'Expedition'],
      notes: 'League Host & Admin. Welcome to Ravenwatch Coven of Umbra GSF!',
      inviteStatus: 'Accepted',
      isSupporterHeart: true,
      isOnline: true
    };

    return { account: adminAccount, roster: adminRoster };
  };

  // Google Authentication Handler
  const handleGoogleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const emailClean = googleEmail.trim().toLowerCase();
    if (!emailClean || !emailClean.includes('@')) {
      setAuthError('Please enter a valid Google email address.');
      return;
    }

    setIsProcessing(true);

    // 1. Check if this Google email is already linked to Leuie (Admin)
    if (linkedAdminGoogle && emailClean === linkedAdminGoogle.toLowerCase()) {
      setTimeout(() => {
        setIsProcessing(false);
        const { account, roster } = createAdminLeuieAccount(emailClean);
        onSaveAccount(account, roster);
        fireConfetti();
        dialogRef.current?.close();
      }, 350);
      return;
    }

    // 2. Regular exile Google sign in: check existing stored accounts
    try {
      const storedRaw = localStorage.getItem('poe_clean330_accounts');
      const storedList: StoredAppAccount[] = storedRaw ? JSON.parse(storedRaw) : [];
      const matched = storedList.find((a) => a.userAccount.email?.toLowerCase() === emailClean);

      setTimeout(() => {
        setIsProcessing(false);
        if (matched) {
          // Existing user with this Google email
          onSaveAccount(matched.userAccount, matched.rosterEntry);
          fireConfetti();
          dialogRef.current?.close();
        } else {
          // New exile: advance to profile setup and link PoE profile
          setAuthMethod('google');
          setDisplayName(emailClean.split('@')[0]);
          setStep('link_poe_profile');
        }
      }, 350);
    } catch {
      setIsProcessing(false);
      setAuthMethod('google');
      setStep('link_poe_profile');
    }
  };

  // Exile SSF App Account: Sign In or Create
  const handleAppAccountAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const userClean = appUsername.trim();
    if (!userClean) {
      setAuthError('Please enter a username for your Exile SSF account.');
      return;
    }

    if (!appPassword) {
      setAuthError('Please enter your password.');
      return;
    }

    setIsProcessing(true);

    // If signing in as Leuie with App username/password
    if (userClean.toLowerCase() === 'leuie') {
      const hash = await computeSHA256(appPassword);
      if (hash !== ADMIN_KEY_SHA256) {
        setIsProcessing(false);
        setAuthError('Invalid Admin Password for @Leuie.');
        return;
      }
      setIsProcessing(false);
      const { account, roster } = createAdminLeuieAccount();
      onSaveAccount(account, roster);
      fireConfetti();
      dialogRef.current?.close();
      return;
    }

    const passwordHash = await computeSHA256(appPassword);
    const storedRaw = localStorage.getItem('poe_clean330_accounts');
    const storedList: StoredAppAccount[] = storedRaw ? JSON.parse(storedRaw) : [];

    if (appAuthMode === 'signin') {
      const found = storedList.find(
        (a) => a.username.toLowerCase() === userClean.toLowerCase() && a.passwordHash === passwordHash
      );
      setIsProcessing(false);
      if (found) {
        onSaveAccount(found.userAccount, found.rosterEntry);
        fireConfetti();
        dialogRef.current?.close();
      } else {
        setAuthError('Invalid Exile SSF username or password.');
      }
    } else {
      // Create Account mode
      if (appPassword !== appPasswordConfirm) {
        setIsProcessing(false);
        setAuthError('Passwords do not match.');
        return;
      }

      if (appPassword.length < 6) {
        setIsProcessing(false);
        setAuthError('Password must be at least 6 characters.');
        return;
      }

      const existing = storedList.find((a) => a.username.toLowerCase() === userClean.toLowerCase());
      if (existing) {
        setIsProcessing(false);
        setAuthError(`The username "${userClean}" is already taken. Please sign in or choose another.`);
        return;
      }

      setIsProcessing(false);
      setAuthMethod('app');
      setDisplayName(userClean);
      setStep('link_poe_profile');
    }
  };

  // Step 2 Submission: Link Path of Exile Profile & Finish Registration
  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const cleanDisplay = displayName.trim() || appUsername.trim() || 'Exile';
    const isLeuie = cleanDisplay.toLowerCase() === 'leuie';

    // Guard: Prevent claiming Leuie without the admin password
    if (isLeuie && !userAccount?.isAdmin) {
      setAuthError('The handle "Leuie" is reserved for the League Host & Admin.');
      return;
    }

    const cleanPoeAccount = poeAccountName.trim();
    if (!cleanPoeAccount) {
      setAuthError('Please provide your Path of Exile Account Tag (e.g. Account#1234).');
      return;
    }

    const cleanCharName = characterName.trim() || `${cleanDisplay}_Umbra`;
    const cleanDiscord = discordName.trim()
      ? discordName.trim().startsWith('@')
        ? discordName.trim()
        : `@${discordName.trim()}`
      : undefined;

    const matchedAsc = ASCENDANCY_CATALOG.find((a) => a.name === selectedAscendancy);
    const baseClass = matchedAsc ? matchedAsc.baseClass : 'Templar';

    const rosterId = isLeuie ? 'member-leuie' : (existingRosterMember?.id || `roster-user-${Date.now()}`);
    const atlasArray = atlasContent
      .split(/[,/]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const newAccount: UserAccount = {
      id: isLeuie ? 'usr-leuie' : (userAccount?.id || `usr-${Date.now()}`),
      provider: authMethod,
      displayName: cleanDisplay,
      preferredContact,
      poeAccountName: cleanPoeAccount,
      poeProfileUrl: poeProfileUrl.trim() || `https://www.pathofexile.com/account/view-profile/${encodeURIComponent(cleanPoeAccount.split('#')[0])}`,
      characterName: cleanCharName,
      discordName: cleanDiscord,
      steamName: steamName.trim() || undefined,
      customTag: customTag.trim() || undefined,
      email: authMethod === 'google' ? googleEmail.trim().toLowerCase() : undefined,
      linkedGoogleEmail: isLeuie ? linkedAdminGoogle : undefined,
      className: baseClass,
      ascendancy: selectedAscendancy,
      leagueMode,
      availableAtLaunch,
      level: Number(level) || 1,
      buildName: buildName.trim() || 'Undecided Starter',
      pobUrl: pobUrl.trim() || undefined,
      atlasContent: atlasArray.length > 0 ? atlasArray : ['Expedition', 'Harvest'],
      notes: notes.trim() || 'Registered via Ravenwatch 3.30 Coven of Umbra GSF',
      inviteStatus: existingRosterMember?.inviteStatus || 'Accepted',
      registeredAt: userAccount?.registeredAt || new Date().toISOString().slice(0, 10),
      isAdmin: isLeuie
    };

    const newRosterEntry: LeagueRosterMember = {
      id: rosterId,
      slotNumber: isLeuie ? 1 : (existingRosterMember?.slotNumber || 18),
      leagueMode,
      displayName: cleanDisplay,
      preferredContact,
      poeAccountName: cleanPoeAccount,
      poeProfileUrl: newAccount.poeProfileUrl,
      characterName: cleanCharName,
      discordName: cleanDiscord,
      steamName: steamName.trim() || undefined,
      customTag: customTag.trim() || undefined,
      className: baseClass,
      ascendancy: selectedAscendancy,
      availableAtLaunch,
      level: Number(level) || 1,
      buildName: buildName.trim() || 'Undecided Starter',
      pobUrl: pobUrl.trim() || undefined,
      atlasContent: atlasArray.length > 0 ? atlasArray : ['Expedition', 'Harvest'],
      notes: notes.trim() || 'Registered via Ravenwatch 3.30 Coven of Umbra GSF',
      inviteStatus: existingRosterMember?.inviteStatus || 'Accepted',
      isSupporterHeart: existingRosterMember?.isSupporterHeart || isLeuie,
      isOnline: true
    };

    // If registered with App username and password, store credentials locally
    if (authMethod === 'app' && appUsername && appPassword) {
      const pHash = await computeSHA256(appPassword);
      newAccount.passwordHash = pHash;
      try {
        const storedRaw = localStorage.getItem('poe_clean330_accounts');
        const storedList: StoredAppAccount[] = storedRaw ? JSON.parse(storedRaw) : [];
        const index = storedList.findIndex((a) => a.username.toLowerCase() === appUsername.toLowerCase());
        const entry: StoredAppAccount = {
          username: appUsername,
          passwordHash: pHash,
          userAccount: newAccount,
          rosterEntry: newRosterEntry
        };
        if (index >= 0) {
          storedList[index] = entry;
        } else {
          storedList.push(entry);
        }
        localStorage.setItem('poe_clean330_accounts', JSON.stringify(storedList));
      } catch {}
    }

    onSaveAccount(newAccount, newRosterEntry);
    fireConfetti();
    dialogRef.current?.close();
  };

  // In Profile Mode: Link or Unlink Google Account for Leuie
  const handleToggleAdminGoogleLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (linkedAdminGoogle) {
      // Unlink
      localStorage.removeItem('poe_clean330_admin_google');
      setLinkedAdminGoogle('');
      if (userAccount) {
        const updated = { ...userAccount, linkedGoogleEmail: undefined };
        onSaveAccount(updated, existingRosterMember || createAdminLeuieAccount().roster);
      }
    } else {
      // Link
      const toLink = googleEmail.trim().toLowerCase();
      if (!toLink || !toLink.includes('@')) {
        setAuthError('Please enter a valid Google email address to link.');
        return;
      }
      localStorage.setItem('poe_clean330_admin_google', toLink);
      setLinkedAdminGoogle(toLink);
      if (userAccount) {
        const updated = { ...userAccount, linkedGoogleEmail: toLink };
        onSaveAccount(updated, existingRosterMember || createAdminLeuieAccount(toLink).roster);
      }
      fireConfetti();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      {...({ closedby: 'any' } as any)}
      aria-labelledby={titleId}
      className="w-[94vw] sm:w-full sm:max-w-2xl rounded-3xl border border-indigo-500/40 bg-white dark:bg-[#1a1a2e] text-slate-900 dark:text-slate-100 p-0 shadow-2xl backdrop:bg-slate-950/80 backdrop:backdrop-blur-md m-auto overflow-hidden"
    >
      {/* Modal Header */}
      <div className="p-6 border-b border-slate-200 dark:border-[#2d2d44] bg-gradient-to-r from-indigo-600/15 via-purple-600/10 to-amber-500/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-inner">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-indigo-500 dark:text-indigo-300 font-bold">
              Ravenwatch Coven of Umbra GSF • 3.30
            </div>
            <h2 id={titleId} className="text-lg sm:text-xl font-poppins font-bold text-slate-900 dark:text-white">
              {userAccount
                ? userAccount.isAdmin
                  ? 'Admin Command & Google Account Linking'
                  : 'Manage Your Exile Profile & Handles'
                : 'Sign In or Create Your Exile SSF Account'}
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
        {/* Error Alert Box */}
        {authError && (
          <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 1: AUTHENTICATION (GOOGLE AUTH OR EXILE SSF APP USER/PASS)           */}
        {/* ========================================================================= */}
        {step === 'auth_choice' && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              Sign in with your <strong>Google Account</strong> or create a dedicated <strong>Exile SSF App Account (Username & Password)</strong>.
              You will link your Path of Exile website profile and character tag in the next step!
            </div>

            {/* Auth Method Switcher Tabs */}
            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('google');
                  setAuthError(null);
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  authMethod === 'google'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-200'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span>Google Authentication</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMethod('app');
                  setAuthError(null);
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  authMethod === 'app'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-200'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>Exile SSF App Account</span>
              </button>
            </div>

            {/* TAB A: GOOGLE AUTH */}
            {authMethod === 'google' && (
              <form onSubmit={handleGoogleSignIn} className="space-y-4">
                <div className="p-4 rounded-2xl border-2 border-indigo-500/40 bg-gradient-to-br from-indigo-500/15 via-[#1a1a2e] to-[#0f172a] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-[10px] font-mono font-bold uppercase">
                      Google OAuth
                    </span>
                    <Globe className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-poppins font-bold text-sm text-white">
                      Sign in with Google Account
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed mt-0.5">
                      Fast 1 click sign in for your Exile SSF profile and squad wishlists.
                    </p>
                  </div>

                  <div className="space-y-2 pt-1">
                    <label className="text-xs font-semibold text-slate-300 block">
                      Google Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. yourname@gmail.com"
                      value={googleEmail}
                      onChange={(e) => setGoogleEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-400"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all mt-2"
                  >
                    <Globe className="w-4 h-4" />
                    <span>{isProcessing ? 'Verifying with Google...' : 'Continue with Google'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB B: EXILE SSF APP ACCOUNT (USER / PASS) */}
            {authMethod === 'app' && (
              <form onSubmit={handleAppAccountAuth} className="space-y-4">
                <div className="p-4 rounded-2xl border-2 border-slate-700 bg-slate-900/90 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setAppAuthMode('signin');
                          setAuthError(null);
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          appAuthMode === 'signin'
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Sign In
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAppAuthMode('create');
                          setAuthError(null);
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          appAuthMode === 'create'
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Create New Account
                      </button>
                    </div>

                    <KeyRound className="w-4 h-4 text-slate-400" />
                  </div>

                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Exile SSF Username *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. ShadowExile"
                        value={appUsername}
                        onChange={(e) => setAppUsername(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-400"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Password *
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="Your password"
                        value={appPassword}
                        onChange={(e) => setAppPassword(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-400"
                      />
                    </div>

                    {appAuthMode === 'create' && (
                      <div>
                        <label className="text-xs font-semibold text-slate-300 block mb-1">
                          Confirm Password *
                        </label>
                        <input
                          type="password"
                          required
                          placeholder="Re-enter password"
                          value={appPasswordConfirm}
                          onChange={(e) => setAppPasswordConfirm(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-400"
                        />
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>
                      {isProcessing
                        ? 'Authenticating...'
                        : appAuthMode === 'signin'
                        ? 'Sign In to Exile SSF'
                        : 'Continue to PoE Profile Setup'}
                    </span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: LINK PATH OF EXILE PROFILE & CHARACTER DETAILS                     */}
        {/* ========================================================================= */}
        {step === 'link_poe_profile' && (
          <form onSubmit={handleSubmitProfile} className="space-y-6">
            {/* Account Status Strip */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-2xl bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-[#2d2d44]">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {userAccount ? (
                    <>
                      Logged in as <strong className="text-indigo-400">@{userAccount.displayName}</strong>{' '}
                      {userAccount.isAdmin && (
                        <span className="px-2 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] ml-1">
                          HOST ADMIN
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      Authenticated via{' '}
                      <strong className="text-indigo-400">
                        {authMethod === 'google' ? 'Google Auth' : 'Exile SSF App Account'}
                      </strong>
                    </>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {!userAccount ? (
                  <button
                    type="button"
                    onClick={() => setStep('auth_choice')}
                    className="text-[11px] text-slate-400 hover:text-indigo-400 underline cursor-pointer"
                  >
                    Back to Auth
                  </button>
                ) : (
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

            {/* ADMIN ONLY: GOOGLE ACCOUNT LINKING CARD */}
            {userAccount?.isAdmin && (
              <div className="p-4 rounded-2xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-950 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Google Account Link for Admin @Leuie
                    </span>
                  </div>
                  {linkedAdminGoogle && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold">
                      Linked
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Link your personal Google account to your Admin profile. Once linked, you can click{' '}
                  <strong>"Sign in with Google"</strong> on any device and immediately be recognized as{' '}
                  <strong>@Leuie</strong> without typing your admin password!
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                  <input
                    type="email"
                    placeholder="Enter your Google email (e.g. leuie@gmail.com)"
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                    disabled={!!linkedAdminGoogle}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400 disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={handleToggleAdminGoogleLink}
                    className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors shadow ${
                      linkedAdminGoogle
                        ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30'
                        : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                    }`}
                  >
                    {linkedAdminGoogle ? 'Unlink Google Account' : 'Link Google Account'}
                  </button>
                </div>
              </div>
            )}

            {/* PATH OF EXILE PROFILE LINKING SECTION */}
            <div className="p-5 rounded-2xl border-2 border-indigo-500/30 bg-slate-50/70 dark:bg-[#0f172a]/70 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AtSign className="w-4 h-4 text-indigo-400" />
                  <span className="font-poppins font-bold text-sm text-slate-900 dark:text-white">
                    Link Path of Exile Website Profile
                  </span>
                </div>
                <span className="text-[10px] font-mono text-indigo-400 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                  Profile Link
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Connect your official Path of Exile profile so officers can send in game private league invites
                and squad members can view your characters on pathofexile.com.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Path of Exile Account Tag (with #) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AccountName#1234"
                    value={poeAccountName}
                    onChange={(e) => setPoeAccountName(e.target.value)}
                    className="w-full bg-white dark:bg-[#1a1a2e] border border-slate-300 dark:border-[#2d2d44] rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                    Required for GGG private league invite ladders.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    PoE Website Profile URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://www.pathofexile.com/account/view-profile/..."
                    value={poeProfileUrl}
                    onChange={(e) => setPoeProfileUrl(e.target.value)}
                    className="w-full bg-white dark:bg-[#1a1a2e] border border-slate-300 dark:border-[#2d2d44] rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                    Direct link to your public profile on pathofexile.com
                  </span>
                </div>
              </div>
            </div>

            {/* DYNAMIC TAGGING & CONTACT HANDLES */}
            <div className="p-5 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0f172a]/70 space-y-4">
              <span className="font-poppins font-bold text-sm text-slate-900 dark:text-white block">
                Contact Handles & In Game Identity
              </span>

              {/* Preferred Channel */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                  Primary Contact Channel *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'app', label: 'Root Web App', icon: Globe, desc: 'Site Profile @Tag' },
                    { id: 'poe_whisper', label: 'In Game PoE', icon: MessageSquare, desc: 'Direct /whisper' },
                    { id: 'discord', label: 'Discord', icon: AtSign, desc: 'Discord Tag' },
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

              {/* Handles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Exile App Display Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ShadowHunter"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={userAccount?.isAdmin}
                    className="w-full bg-white dark:bg-[#1a1a2e] border border-slate-300 dark:border-[#2d2d44] rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    In Game Character Name (IGN) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Shadow_Umbra"
                    value={characterName}
                    onChange={(e) => setCharacterName(e.target.value)}
                    className="w-full bg-white dark:bg-[#1a1a2e] border border-slate-300 dark:border-[#2d2d44] rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Discord Handle (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. @yourdiscord (optional)"
                    value={discordName}
                    onChange={(e) => setDiscordName(e.target.value)}
                    className="w-full bg-white dark:bg-[#1a1a2e] border border-slate-300 dark:border-[#2d2d44] rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Steam Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SteamName (optional)"
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

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  League Mode
                </label>
                <select
                  value={leagueMode}
                  onChange={(e) => setLeagueMode(e.target.value as 'Private' | 'Softcore' | 'SSF')}
                  className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-[#2d2d44] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Private">NOIR Private GSF</option>
                  <option value="SSF">Solo Self Found</option>
                  <option value="Softcore">Trade League</option>
                </select>
              </div>
            </div>

            {/* Starter Build & PoB */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Planned Starter Build
                </label>
                <input
                  type="text"
                  placeholder="e.g. Archmage Ball Lightning"
                  value={buildName}
                  onChange={(e) => setBuildName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-[#2d2d44] rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  PoB Link (pobb.in)
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

            {/* Specialization & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Atlas Mechanics Focus
                </label>
                <input
                  type="text"
                  placeholder="e.g. Expedition, Harvest, Essences"
                  value={atlasContent}
                  onChange={(e) => setAtlasContent(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-[#2d2d44] rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Roster Notes & Craft Requests
                </label>
                <input
                  type="text"
                  placeholder="e.g. Farming Jun unveils day 1"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-[#2d2d44] rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-3 border-t border-slate-200 dark:border-[#2d2d44] flex items-center justify-between gap-3">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span>Exile profile linked to PoE tag {poeAccountName || '(pending)'}</span>
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
                  <span>{userAccount ? 'Update Exile Profile' : 'Complete Registration'}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </dialog>
  );
};
