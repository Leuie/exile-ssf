import React, { useState } from 'react';
import {
  Lock,
  Globe,
  UserCheck,
  ArrowLeft,
  AlertCircle,
  Sparkles,
  AtSign
} from 'lucide-react';
import { ASCENDANCY_CATALOG } from '../data/privateLeagueData';
import type { UserAccount, LeagueRosterMember, ContactPlatform } from '../types';
import { computeSHA256 } from '../utils/crypto';
import { fireConfetti } from '../utils/confetti';

interface RegisterPageProps {
  onRegisterSuccess: (account: UserAccount, rosterEntry: LeagueRosterMember) => void;
  onNavigateLogin: () => void;
  onNavigateHome: () => void;
}

interface StoredAppAccount {
  username: string;
  passwordHash: string;
  userAccount: UserAccount;
  rosterEntry: LeagueRosterMember;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onRegisterSuccess,
  onNavigateLogin,
  onNavigateHome
}) => {
  // Step: 'credentials' | 'profile_link'
  const [step, setStep] = useState<'credentials' | 'profile_link'>('credentials');
  const [authMethod, setAuthMethod] = useState<'google' | 'app'>('google');
  const [googleEmail, setGoogleEmail] = useState<string>('');
  const [appUsername, setAppUsername] = useState<string>('');
  const [appPassword, setAppPassword] = useState<string>('');
  const [appPasswordConfirm, setAppPasswordConfirm] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Profile Details & PoE Linking State
  const [displayName, setDisplayName] = useState<string>('');
  const [preferredContact, setPreferredContact] = useState<ContactPlatform>('app');
  const [poeAccountName, setPoeAccountName] = useState<string>('');
  const [poeProfileUrl, setPoeProfileUrl] = useState<string>('');
  const [characterName, setCharacterName] = useState<string>('');
  const [discordName, setDiscordName] = useState<string>('');
  const [steamName, setSteamName] = useState<string>('');
  const customTag = '';

  // Character Build State
  const [selectedAscendancy, setSelectedAscendancy] = useState<string>('Hierophant');
  const leagueMode = 'Private' as const;
  const availableAtLaunch = 'Yes' as const;
  const level = 1;
  const [buildName, setBuildName] = useState<string>('');
  const pobUrl = '';
  const atlasContent = 'Expedition, Harvest';
  const notes = '';

  // Step 1 Validation & Proceed
  const handleProceedToProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (authMethod === 'google') {
      const emailClean = googleEmail.trim().toLowerCase();
      if (!emailClean || !emailClean.includes('@')) {
        setErrorMessage('Please enter a valid Google email address.');
        return;
      }
      setDisplayName(emailClean.split('@')[0]);
      setStep('profile_link');
    } else {
      const userClean = appUsername.trim();
      if (!userClean) {
        setErrorMessage('Please enter an Exile SSF username.');
        return;
      }

      if (userClean.toLowerCase() === 'leuie') {
        setErrorMessage('The username "Leuie" is reserved. Please choose another username.');
        return;
      }

      if (appPassword.length < 6) {
        setErrorMessage('Password must be at least 6 characters long.');
        return;
      }

      if (appPassword !== appPasswordConfirm) {
        setErrorMessage('Passwords do not match.');
        return;
      }

      // Check if username is already taken
      try {
        const storedRaw = localStorage.getItem('poe_clean330_accounts');
        const storedList: StoredAppAccount[] = storedRaw ? JSON.parse(storedRaw) : [];
        if (storedList.some((a) => a.username.toLowerCase() === userClean.toLowerCase())) {
          setErrorMessage(`The username "${userClean}" is already registered. Please log in instead.`);
          return;
        }
      } catch {}

      setDisplayName(userClean);
      setStep('profile_link');
    }
  };

  // Step 2 Submission: Link Path of Exile Profile & Finish Registration
  const handleFinalizeRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanDisplay = displayName.trim() || appUsername.trim() || 'Exile';
    if (cleanDisplay.toLowerCase() === 'leuie') {
      setErrorMessage('The handle "Leuie" is reserved. Please choose another display name.');
      return;
    }

    const cleanPoeAccount = poeAccountName.trim();
    if (!cleanPoeAccount) {
      setErrorMessage('Please enter your Path of Exile Account Tag (e.g. Account#1234).');
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

    const rosterId = `roster-user-${Date.now()}`;
    const atlasArray = atlasContent
      .split(/[,/]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    setIsProcessing(true);

    const newAccount: UserAccount = {
      id: `usr-${Date.now()}`,
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
      className: baseClass,
      ascendancy: selectedAscendancy,
      leagueMode,
      availableAtLaunch,
      level: Number(level) || 1,
      buildName: buildName.trim() || 'Undecided Starter',
      pobUrl: pobUrl.trim() || undefined,
      atlasContent: atlasArray.length > 0 ? atlasArray : ['Expedition', 'Harvest'],
      notes: notes.trim() || 'Registered via Ravenwatch 3.30 Coven of Umbra GSF',
      inviteStatus: 'Accepted',
      registeredAt: new Date().toISOString().slice(0, 10),
      isAdmin: false
    };

    const newRosterEntry: LeagueRosterMember = {
      id: rosterId,
      slotNumber: 18,
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
      inviteStatus: 'Accepted',
      isSupporterHeart: false,
      isOnline: true
    };

    // If registered via App Account, save hashed credentials locally
    if (authMethod === 'app' && appUsername && appPassword) {
      try {
        const pHash = await computeSHA256(appPassword);
        newAccount.passwordHash = pHash;
        const storedRaw = localStorage.getItem('poe_clean330_accounts');
        const storedList: StoredAppAccount[] = storedRaw ? JSON.parse(storedRaw) : [];
        storedList.push({
          username: appUsername.trim(),
          passwordHash: pHash,
          userAccount: newAccount,
          rosterEntry: newRosterEntry
        });
        localStorage.setItem('poe_clean330_accounts', JSON.stringify(storedList));
      } catch {}
    }

    setIsProcessing(false);
    onRegisterSuccess(newAccount, newRosterEntry);
    fireConfetti();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans">
      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Back to App Link */}
      <button
        type="button"
        onClick={onNavigateHome}
        className="mb-6 flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Exile SSF</span>
      </button>

      {/* Registration Card */}
      <div className="w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl shadow-2xl p-6 sm:p-8 space-y-6 relative z-10">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-mono font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ravenwatch Coven of Umbra GSF</span>
          </div>
          <h1 className="text-2xl font-black font-cinzel text-white tracking-tight">
            Create Your Exile SSF Account
          </h1>
          <p className="text-xs text-slate-400">
            {step === 'credentials'
              ? 'Step 1 of 2: Set up your account credentials.'
              : 'Step 2 of 2: Link your Path of Exile website profile and character.'}
          </p>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ===================================================================== */}
        {/* STEP 1: CREDENTIALS                                                   */}
        {/* ===================================================================== */}
        {step === 'credentials' && (
          <form onSubmit={handleProceedToProfile} className="space-y-5">
            {/* Auth Method Selector */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('google');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  authMethod === 'google'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Google Account</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMethod('app');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  authMethod === 'app'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Exile SSF User & Pass</span>
              </button>
            </div>

            {/* Google Input */}
            {authMethod === 'google' && (
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-300 block">
                  Google Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="yourname@gmail.com"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
                <span className="text-[11px] text-slate-500 block">
                  Enables 1 click login to your private league roster and wishlist.
                </span>
              </div>
            )}

            {/* App Username / Password Input */}
            {authMethod === 'app' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Choose Exile SSF Username *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ShadowHunter"
                    value={appUsername}
                    onChange={(e) => setAppUsername(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Create Password * (min 6 characters)
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Create a secure password"
                    value={appPassword}
                    onChange={(e) => setAppPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

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
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all"
            >
              <span>Continue to PoE Profile Setup</span>
              <span className="font-mono">→</span>
            </button>
          </form>
        )}

        {/* ===================================================================== */}
        {/* STEP 2: LINK PATH OF EXILE PROFILE                                    */}
        {/* ===================================================================== */}
        {step === 'profile_link' && (
          <form onSubmit={handleFinalizeRegistration} className="space-y-5">
            {/* Step header pill */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <span className="text-slate-400">
                Signing up as: <strong className="text-indigo-400">{displayName || appUsername}</strong>
              </span>
              <button
                type="button"
                onClick={() => setStep('credentials')}
                className="text-slate-500 hover:text-slate-300 underline text-[11px] cursor-pointer"
              >
                Change Credentials
              </button>
            </div>

            {/* Path of Exile Account Tag & Profile Link */}
            <div className="p-4 rounded-2xl border border-indigo-500/30 bg-slate-950/70 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AtSign className="w-4 h-4 text-indigo-400" />
                  <span className="font-bold text-xs text-white uppercase tracking-wider">
                    Link Path of Exile Website Profile
                  </span>
                </div>
                <span className="text-[10px] font-mono text-indigo-400 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                  PoE Profile
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Path of Exile Account Tag (with #) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AccountName#1234"
                    value={poeAccountName}
                    onChange={(e) => setPoeAccountName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Required for GGG private league invite ladders.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    PoE Website Profile URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://www.pathofexile.com/account/view-profile/..."
                    value={poeProfileUrl}
                    onChange={(e) => setPoeProfileUrl(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Direct link to your public profile on pathofexile.com
                  </span>
                </div>
              </div>
            </div>

            {/* In Game Character & Contact Handles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  In Game Character Name (IGN) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shadow_Umbra"
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Primary Contact Channel *
                </label>
                <select
                  value={preferredContact}
                  onChange={(e) => setPreferredContact(e.target.value as ContactPlatform)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="app">Root Web App (@Tag)</option>
                  <option value="poe_whisper">In Game PoE Whisper</option>
                  <option value="discord">Discord DM</option>
                  <option value="steam">Steam Community</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Discord Handle (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. @yourdiscord (optional)"
                  value={discordName}
                  onChange={(e) => setDiscordName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Steam Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. SteamName (optional)"
                  value={steamName}
                  onChange={(e) => setSteamName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Ascendancy & Starter Build */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Planned Starter Ascendancy *
                </label>
                <select
                  value={selectedAscendancy}
                  onChange={(e) => setSelectedAscendancy(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {ASCENDANCY_CATALOG.map((item) => (
                    <option key={item.name} value={item.name}>
                      {item.name} ({item.baseClass})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Starter Build Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Archmage Ball Lightning"
                  value={buildName}
                  onChange={(e) => setBuildName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Submission Buttons */}
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all"
            >
              <UserCheck className="w-4 h-4" />
              <span>{isProcessing ? 'Completing Registration...' : 'Complete Registration'}</span>
            </button>
          </form>
        )}

        {/* Switch to Login */}
        <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
          <span>Already have an account? </span>
          <button
            type="button"
            onClick={onNavigateLogin}
            className="text-indigo-400 hover:text-indigo-300 font-semibold underline cursor-pointer"
          >
            Log In (/login)
          </button>
        </div>
      </div>
    </div>
  );
};
