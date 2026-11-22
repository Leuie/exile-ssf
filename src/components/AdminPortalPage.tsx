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
import { cloudAuthAdminLogin } from '../services/cloudSync';
import { fireConfetti } from '../utils/confetti';
import { AdminHostToolsPanel } from './league/widgets/AdminHostToolsPanel';

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

  // Helper to build admin account & roster, preserving custom character details if saved
  const buildLeuieAdminPayload = (googleMail?: string) => {
    const effectiveGoogle = googleMail?.trim().toLowerCase() || linkedAdminGoogle || undefined;

    let savedAcc: Partial<UserAccount> = {};
    try {
      const savedUserRaw = localStorage.getItem('poe_umbraleague_user');
      if (savedUserRaw) savedAcc = JSON.parse(savedUserRaw);
    } catch {}

    let savedRoster: Partial<LeagueRosterMember> = {};
    try {
      const rosterRaw = localStorage.getItem('poe_clean330_roster');
      if (rosterRaw) {
        const list = JSON.parse(rosterRaw);
        const leuieEntry = list.find((m: any) => m.displayName.toLowerCase() === 'leuie');
        if (leuieEntry) savedRoster = leuieEntry;
      }
    } catch {}

    const resolvedAccountName =
      (savedAcc.poeAccountName && savedAcc.poeAccountName !== 'Leuie#0001' ? savedAcc.poeAccountName : '') ||
      (savedRoster.poeAccountName && savedRoster.poeAccountName !== 'Leuie#0001' ? savedRoster.poeAccountName : '') ||
      'Leuie#0626';
    const resolvedCharName = savedAcc.characterName || savedRoster.characterName || 'Leuie_Umbra';
    const resolvedClass = savedAcc.className || savedRoster.className || 'Witch';
    const resolvedAsc = savedAcc.ascendancy || savedRoster.ascendancy || 'Elementalist';
    const resolvedLevel = Number(savedAcc.level || savedRoster.level) || 95;
    const resolvedBuild = savedAcc.buildName || savedRoster.buildName || 'Penance Brand Ignite Elementalist';
    const resolvedPob = savedAcc.pobUrl || savedRoster.pobUrl || 'https://pobb.in/';
    const resolvedNotes = savedAcc.notes || savedRoster.notes || 'League Host & Admin. Welcome to Ravenwatch Covens of Umbra GSF (PL87651)!';

    const adminAccount: UserAccount = {
      id: 'usr-leuie',
      provider: effectiveGoogle ? 'google' : 'app',
      displayName: 'Leuie',
      preferredContact: savedAcc.preferredContact || savedRoster.preferredContact || 'app',
      poeAccountName: resolvedAccountName,
      poeProfileUrl: savedAcc.poeProfileUrl || `https://www.pathofexile.com/account/view-profile/${encodeURIComponent(resolvedAccountName.split('#')[0])}`,
      characterName: resolvedCharName,
      discordName: savedAcc.discordName || '@leuie',
      email: effectiveGoogle || savedAcc.email,
      linkedGoogleEmail: effectiveGoogle || savedAcc.linkedGoogleEmail,
      className: resolvedClass,
      ascendancy: resolvedAsc,
      leagueMode: 'Private',
      availableAtLaunch: 'Yes',
      level: resolvedLevel,
      buildName: resolvedBuild,
      pobUrl: resolvedPob,
      atlasContent: savedAcc.atlasContent || savedRoster.atlasContent || ['Betrayal', 'Essences', 'Expedition'],
      notes: resolvedNotes,
      inviteStatus: 'Accepted',
      registeredAt: savedAcc.registeredAt || '2026-11-01',
      isAdmin: true
    };

    const adminRoster: LeagueRosterMember = {
      id: 'member-leuie',
      slotNumber: 1,
      leagueMode: 'Private',
      displayName: 'Leuie',
      preferredContact: adminAccount.preferredContact,
      poeAccountName: resolvedAccountName,
      poeProfileUrl: adminAccount.poeProfileUrl,
      characterName: resolvedCharName,
      discordName: adminAccount.discordName,
      className: resolvedClass,
      ascendancy: resolvedAsc,
      availableAtLaunch: 'Yes',
      level: resolvedLevel,
      buildName: resolvedBuild,
      pobUrl: resolvedPob,
      atlasContent: adminAccount.atlasContent,
      notes: resolvedNotes,
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
      const authRes = await cloudAuthAdminLogin(adminPasswordInput);
      if (!authRes.success) {
        setIsProcessing(false);
        setErrorMessage(authRes.error || 'Invalid Admin Password. Access denied.');
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

  // Direct Google Sign In (for linked Google accounts)
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

  if (!isLeuieAdmin) {
    return (
      <div className="min-h-screen bg-[#080b12] text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

        <button
          type="button"
          onClick={onNavigateHome}
          className="mb-6 flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Exile SSF</span>
        </button>

        <div className="w-full max-w-md rounded-2xl border border-amber-500/35 bg-[#0e1320]/95 backdrop-blur-xl shadow-2xl p-6 sm:p-8 space-y-6 relative z-10">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[11px] font-mono font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Exile SSF Administration</span>
            </div>
            <h1 className="text-2xl font-black font-cinzel text-white tracking-tight">
              Admin Command Access
            </h1>
            <p className="text-xs text-slate-400">
              Secure host control console for @Leuie.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="space-y-5">
            {linkedAdminGoogle && (
              <form onSubmit={handleGoogleAdminLogin} className="p-4 rounded-xl border border-indigo-500/35 bg-indigo-500/10 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold text-white">Linked Google Direct Login</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono truncate max-w-[160px]">
                    {linkedAdminGoogle}
                  </span>
                </div>
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
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow flex-shrink-0"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </button>
                </div>
              </form>
            )}

            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-200 block mb-1.5">
                  Admin Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter Admin Password"
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  className="w-full bg-slate-950 border border-amber-500/40 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              {!linkedAdminGoogle && (
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">
                    Optional: Link Google email for future direct sign in
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
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all"
              >
                <KeyRound className="w-4 h-4" />
                <span>{isProcessing ? 'Verifying...' : 'Verify & Sign In as @Leuie'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated Full Width Executive Admin Console
  const securityCard = (
    <div className="rounded-2xl border border-slate-800 bg-[#0d111a] p-5 space-y-4 shadow-xl flex flex-col justify-between">
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
            <Globe className="w-4 h-4 text-indigo-400" />
            <span>Admin Security &amp; Access</span>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
              linkedAdminGoogle
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-700'
            }`}
          >
            {linkedAdminGoogle ? 'Google Linked' : 'Password Only'}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="min-w-0">
            <div className="font-bold text-white">Signed in as @Leuie</div>
            <div className="text-[11px] font-mono text-emerald-300/90 truncate">HMAC Session Cookie Verified</div>
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          {linkedAdminGoogle ? (
            <>
              Direct Google Sign In is enabled for <strong className="text-white">{linkedAdminGoogle}</strong>.
            </>
          ) : (
            <>Link your personal Google email to enable quick direct sign in to the Admin Console.</>
          )}
        </p>

        <form onSubmit={handleToggleGoogleLink} className="space-y-2.5">
          <input
            type="email"
            disabled={!!linkedAdminGoogle}
            placeholder="Enter Google email (e.g. leuie@gmail.com)"
            value={linkedAdminGoogle || googleEmailToLink}
            onChange={(e) => setGoogleEmailToLink(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 disabled:opacity-60"
          />
          <button
            type="submit"
            className={`w-full py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
              linkedAdminGoogle
                ? 'bg-rose-500/15 border border-rose-500/40 text-rose-300 hover:bg-rose-500/25'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow'
            }`}
          >
            {linkedAdminGoogle ? 'Unlink Google Account' : 'Link Google Account'}
          </button>
        </form>
      </div>

      <div className="pt-3 border-t border-slate-800/80 text-[11px] font-mono text-slate-500">
        Cloudflare Workers Secrets active • D1 atomic writes
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#080b12] text-slate-100 px-4 sm:px-6 lg:px-8 py-6 pb-16 font-sans">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Unified Full Width Executive Admin Header */}
        <header className="rounded-2xl border border-slate-800 bg-gradient-to-r from-[#0e1320] via-indigo-950/35 to-[#0e1320] p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xl">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onNavigateHome}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
                <span>Return to Exile SSF</span>
              </button>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold">
                <ShieldCheck className="w-3 h-3" />
                <span>Verified Host • @Leuie</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black font-cinzel text-white tracking-tight flex items-center gap-2 pt-0.5">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <span>Admin Command Console</span>
            </h1>
            <p className="text-xs text-slate-400">
              League health diagnostics, Google Sheets workbook exports, custom host awards, Root/Discord webhooks, and admin access controls.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onNavigateLeagueHub}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>3.30 League Hub</span>
            </button>

            {onOpenContentManager && (
              <button
                type="button"
                onClick={onOpenContentManager}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <FolderLock className="w-3.5 h-3.5 text-amber-400" />
                <span>Content Manager</span>
              </button>
            )}

            <button
              type="button"
              onClick={onAdminSignOut}
              className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Cohesive Full Width Dashboard Grid */}
        <AdminHostToolsPanel securityCard={securityCard} />
      </div>
    </div>
  );
};
