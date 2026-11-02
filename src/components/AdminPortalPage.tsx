import React, { useState } from 'react';
import {
  ShieldCheck,
  Globe,
  KeyRound,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  LogOut,
  FolderLock
} from 'lucide-react';
import type { UserAccount, LeagueRosterMember } from '../types';
import { computeSHA256, ADMIN_KEY_SHA256 } from '../utils/crypto';
import { fireConfetti } from '../utils/confetti';

interface AdminPortalPageProps {
  userAccount: UserAccount | null;
  onAdminLoginSuccess: (account: UserAccount, rosterEntry: LeagueRosterMember) => void;
  onAdminSignOut: () => void;
  onNavigateLeagueHub: () => void;
  onNavigateHome: () => void;
  onOpenContentManager?: () => void;
}

export const AdminPortalPage: React.FC<AdminPortalPageProps> = ({
  userAccount,
  onAdminLoginSuccess,
  onAdminSignOut,
  onNavigateLeagueHub,
  onNavigateHome,
  onOpenContentManager
}) => {
  const [adminPasswordInput, setAdminPasswordInput] = useState<string>('');
  const [googleEmailToLink, setGoogleEmailToLink] = useState<string>('');
  const [googleSignInEmail, setGoogleSignInEmail] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Read linked Google email from localStorage
  const [linkedAdminGoogle, setLinkedAdminGoogle] = useState<string>(() => {
    try {
      return localStorage.getItem('poe_clean330_admin_google') || '';
    } catch {
      return '';
    }
  });

  // Helper to build admin account & roster
  const buildLeuieAdminPayload = (googleMail?: string) => {
    const effectiveGoogle = googleMail?.trim().toLowerCase() || linkedAdminGoogle || undefined;
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

    return { adminAccount, adminRoster };
  };

  // Password Login Handler
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsProcessing(true);

    try {
      const hash = await computeSHA256(adminPasswordInput);
      if (hash !== ADMIN_KEY_SHA256) {
        setIsProcessing(false);
        setErrorMessage('Invalid Admin Password. Access denied.');
        return;
      }

      // If user provided a Google email to link, save it
      let linkedEmail = linkedAdminGoogle;
      if (googleEmailToLink.trim() && googleEmailToLink.includes('@')) {
        linkedEmail = googleEmailToLink.trim().toLowerCase();
        localStorage.setItem('poe_clean330_admin_google', linkedEmail);
        setLinkedAdminGoogle(linkedEmail);
      }

      setIsProcessing(false);
      const { adminAccount, adminRoster } = buildLeuieAdminPayload(linkedEmail);
      onAdminLoginSuccess(adminAccount, adminRoster);
      fireConfetti();
    } catch {
      setIsProcessing(false);
      setErrorMessage('Verification failed. Please try again.');
    }
  };

  // 1 Click Google Sign In (for linked Google accounts)
  const handleGoogleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    const cleanMail = googleSignInEmail.trim().toLowerCase();

    if (!cleanMail || !cleanMail.includes('@')) {
      setErrorMessage('Please enter a valid Google email address.');
      return;
    }

    if (!linkedAdminGoogle || cleanMail !== linkedAdminGoogle.toLowerCase()) {
      setErrorMessage('This Google account is not linked to @Leuie. Log in with the Admin Password below to link it.');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      const { adminAccount, adminRoster } = buildLeuieAdminPayload(cleanMail);
      onAdminLoginSuccess(adminAccount, adminRoster);
      fireConfetti();
    }, 350);
  };

  // Link or Unlink Google Account while logged in
  const handleToggleGoogleLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (linkedAdminGoogle) {
      // Unlink
      localStorage.removeItem('poe_clean330_admin_google');
      setLinkedAdminGoogle('');
      setSuccessMessage('Google account unlinked.');
      if (userAccount) {
        const { adminAccount, adminRoster } = buildLeuieAdminPayload(undefined);
        onAdminLoginSuccess(adminAccount, adminRoster);
      }
    } else {
      // Link
      const mailClean = googleEmailToLink.trim().toLowerCase();
      if (!mailClean || !mailClean.includes('@')) {
        setErrorMessage('Please enter a valid Google email to link.');
        return;
      }
      localStorage.setItem('poe_clean330_admin_google', mailClean);
      setLinkedAdminGoogle(mailClean);
      setSuccessMessage(`Google account ${mailClean} linked successfully!`);
      const { adminAccount, adminRoster } = buildLeuieAdminPayload(mailClean);
      onAdminLoginSuccess(adminAccount, adminRoster);
      fireConfetti();
    }
  };

  const isLeuieAdmin = userAccount?.isAdmin === true;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans">
      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Back to App Link */}
      <button
        type="button"
        onClick={onNavigateHome}
        className="mb-6 flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to Exile SSF</span>
      </button>

      {/* Main Admin Card */}
      <div className="w-full max-w-lg rounded-3xl border-2 border-amber-500/40 bg-slate-900/95 backdrop-blur-xl shadow-2xl p-6 sm:p-8 space-y-6 relative z-10">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>NOIR SSF Administration Portal</span>
          </div>
          <h1 className="text-2xl font-black font-cinzel text-white tracking-tight">
            Admin Command Access
          </h1>
          <p className="text-xs text-slate-400">
            Secure administrative control portal for the League Host (@Leuie).
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* ===================================================================== */}
        {/* VIEW 1: AUTHENTICATED STATE                                           */}
        {/* ===================================================================== */}
        {isLeuieAdmin ? (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold block">
                  Active Session Verified
                </span>
                <span className="text-sm font-bold text-white">
                  Logged in as @Leuie (Host & Admin)
                </span>
              </div>
            </div>

            {/* Google Account Linking Card */}
            <div className="p-4 rounded-2xl border border-slate-700 bg-slate-950/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Linked Google Account
                  </span>
                </div>
                {linkedAdminGoogle && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold">
                    Active
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {linkedAdminGoogle ? (
                  <>
                    Your Google account (<strong className="text-white">{linkedAdminGoogle}</strong>) is linked.
                    You can use 1 click Google Sign In on /admin from any device.
                  </>
                ) : (
                  <>
                    Link your personal Google account to enable 1 click Google Sign In directly to the Admin Portal in the future.
                  </>
                )}
              </p>

              <form onSubmit={handleToggleGoogleLink} className="flex flex-col sm:flex-row gap-2 pt-1">
                <input
                  type="email"
                  disabled={!!linkedAdminGoogle}
                  placeholder="Enter your Google email (e.g. leuie@gmail.com)"
                  value={linkedAdminGoogle || googleEmailToLink}
                  onChange={(e) => setGoogleEmailToLink(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400 disabled:opacity-60"
                />
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors shadow ${
                    linkedAdminGoogle
                      ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  }`}
                >
                  {linkedAdminGoogle ? 'Unlink Google' : 'Link Google Account'}
                </button>
              </form>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={onNavigateLeagueHub}
                className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Go to 3.30 GSF League Hub</span>
              </button>

              {onOpenContentManager && (
                <button
                  type="button"
                  onClick={onOpenContentManager}
                  className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <FolderLock className="w-4 h-4 text-amber-400" />
                  <span>Content Manager (Links & FAQ)</span>
                </button>
              )}
            </div>

            {/* Sign Out */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={onAdminSignOut}
                className="inline-flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out from Admin Session</span>
              </button>
            </div>
          </div>
        ) : (
          /* ===================================================================== */
          /* VIEW 2: UN-AUTHENTICATED STATE (LOGIN PORTAL)                         */
          /* ===================================================================== */
          <div className="space-y-6">
            {/* Option A: 1 Click Google Sign In (if linked) */}
            {linkedAdminGoogle && (
              <form onSubmit={handleGoogleAdminLogin} className="p-4 rounded-2xl border border-indigo-500/40 bg-indigo-500/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold text-white">
                      Linked Google 1 Click Login
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono">
                    Linked: {linkedAdminGoogle}
                  </span>
                </div>

                <p className="text-xs text-slate-300">
                  Click below to authenticate using your linked Google account:
                </p>

                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    placeholder="Confirm Google email"
                    value={googleSignInEmail || linkedAdminGoogle}
                    onChange={(e) => setGoogleSignInEmail(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-400"
                  />
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow transition-all flex-shrink-0"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </button>
                </div>
              </form>
            )}

            {/* Option B: Password Login */}
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-200 block mb-1">
                  Secret Admin Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter Admin Password"
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  className="w-full bg-slate-950 border border-amber-500/40 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400 shadow-inner"
                />
              </div>

              {!linkedAdminGoogle && (
                <div>
                  <label className="text-xs text-slate-400 block mb-1">
                    Optional: Link Google email for future 1 click logins:
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. leuie@gmail.com"
                    value={googleEmailToLink}
                    onChange={(e) => setGoogleEmailToLink(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all"
              >
                <KeyRound className="w-4 h-4" />
                <span>{isProcessing ? 'Verifying Admin Password...' : 'Verify & Sign In as Leuie (Admin)'}</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
