import React, { useState } from 'react';
import {
  Lock,
  Globe,
  KeyRound,
  ArrowLeft,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import type { UserAccount, LeagueRosterMember } from '../types';
import { computeSHA256 } from '../utils/crypto';
import { fireConfetti } from '../utils/confetti';

interface LoginPageProps {
  onLoginSuccess: (account: UserAccount, rosterEntry: LeagueRosterMember) => void;
  onNavigateRegister: () => void;
  onNavigateHome: () => void;
}

interface StoredAppAccount {
  username: string;
  passwordHash?: string;
  userAccount: UserAccount;
  rosterEntry: LeagueRosterMember;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onNavigateRegister,
  onNavigateHome
}) => {
  const [authMethod, setAuthMethod] = useState<'google' | 'app'>('google');
  const [googleEmail, setGoogleEmail] = useState<string>('');
  const [appUsername, setAppUsername] = useState<string>('');
  const [appPassword, setAppPassword] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Google Login Handler
  const handleGoogleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const emailClean = googleEmail.trim().toLowerCase();
    if (!emailClean || !emailClean.includes('@')) {
      setErrorMessage('Please enter a valid Google email address.');
      return;
    }

    setIsProcessing(true);

    try {
      // Check if linked to admin Leuie
      const savedAdminGoogle = localStorage.getItem('poe_clean330_admin_google');
      if (savedAdminGoogle && emailClean === savedAdminGoogle.toLowerCase()) {
        setTimeout(() => {
          setIsProcessing(false);

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

          const resolvedAccountName = savedAcc.poeAccountName || savedRoster.poeAccountName || 'Leuie#0001';
          const resolvedCharName = savedAcc.characterName || savedRoster.characterName || 'Leuie_Umbra';
          const resolvedClass = savedAcc.className || savedRoster.className || 'Witch';
          const resolvedAsc = savedAcc.ascendancy || savedRoster.ascendancy || 'Elementalist';
          const resolvedLevel = Number(savedAcc.level || savedRoster.level) || 95;
          const resolvedBuild = savedAcc.buildName || savedRoster.buildName || 'Penance Brand Ignite Elementalist';
          const resolvedPob = savedAcc.pobUrl || savedRoster.pobUrl || 'https://pobb.in/';
          const resolvedNotes = savedAcc.notes || savedRoster.notes || 'League Host & Admin. Welcome to Ravenwatch Coven of Umbra GSF!';

          const adminAccount: UserAccount = {
            id: 'usr-leuie',
            provider: 'google',
            displayName: 'Leuie',
            preferredContact: savedAcc.preferredContact || savedRoster.preferredContact || 'app',
            poeAccountName: resolvedAccountName,
            poeProfileUrl: savedAcc.poeProfileUrl || `https://www.pathofexile.com/account/view-profile/${encodeURIComponent(resolvedAccountName.split('#')[0])}`,
            characterName: resolvedCharName,
            discordName: savedAcc.discordName || '@leuie',
            email: emailClean,
            linkedGoogleEmail: emailClean,
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
          onLoginSuccess(adminAccount, adminRoster);
          fireConfetti();
        }, 350);
        return;
      }

      // Check stored accounts
      const storedRaw = localStorage.getItem('poe_clean330_accounts');
      const storedList: StoredAppAccount[] = storedRaw ? JSON.parse(storedRaw) : [];
      let matched = storedList.find((a) => a.userAccount.email?.toLowerCase() === emailClean);

      // Fallback check: poe_umbraleague_user (active or saved user session)
      if (!matched) {
        try {
          const currentRaw = localStorage.getItem('poe_umbraleague_user');
          if (currentRaw) {
            const currentAcc: UserAccount = JSON.parse(currentRaw);
            if (
              (currentAcc.email && currentAcc.email.toLowerCase() === emailClean) ||
              (currentAcc.linkedGoogleEmail && currentAcc.linkedGoogleEmail.toLowerCase() === emailClean)
            ) {
              const rosterRaw = localStorage.getItem('poe_clean330_roster');
              const rosterList: LeagueRosterMember[] = rosterRaw ? JSON.parse(rosterRaw) : [];
              const foundRoster = rosterList.find((r) => r.displayName.toLowerCase() === currentAcc.displayName.toLowerCase()) || {
                id: `roster-${currentAcc.id}`,
                slotNumber: 18,
                leagueMode: currentAcc.leagueMode,
                displayName: currentAcc.displayName,
                preferredContact: currentAcc.preferredContact,
                poeAccountName: currentAcc.poeAccountName,
                characterName: currentAcc.characterName,
                className: currentAcc.className,
                ascendancy: currentAcc.ascendancy,
                availableAtLaunch: currentAcc.availableAtLaunch,
                level: currentAcc.level,
                buildName: currentAcc.buildName,
                atlasContent: currentAcc.atlasContent,
                notes: currentAcc.notes,
                inviteStatus: currentAcc.inviteStatus,
                isOnline: true
              };
              matched = {
                username: currentAcc.displayName,
                passwordHash: '',
                userAccount: currentAcc,
                rosterEntry: foundRoster
              };
              storedList.push(matched);
              localStorage.setItem('poe_clean330_accounts', JSON.stringify(storedList));
            }
          }
        } catch {}
      }

      setTimeout(() => {
        setIsProcessing(false);
        if (matched) {
          onLoginSuccess(matched.userAccount, matched.rosterEntry);
          fireConfetti();
        } else {
          // New Google account: save pending email so register page prefills it
          try {
            sessionStorage.setItem('pending_auth_email', emailClean);
          } catch {}
          onNavigateRegister();
        }
      }, 350);
    } catch {
      setIsProcessing(false);
      onNavigateRegister();
    }
  };

  // Exile SSF App Account Login Handler
  const handleAppLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const userClean = appUsername.trim();
    if (!userClean) {
      setErrorMessage('Please enter your Exile SSF username.');
      return;
    }

    if (!appPassword) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsProcessing(true);

    try {
      const pHash = await computeSHA256(appPassword);
      const storedRaw = localStorage.getItem('poe_clean330_accounts');
      const storedList: StoredAppAccount[] = storedRaw ? JSON.parse(storedRaw) : [];

      const found = storedList.find(
        (a) => a.username.toLowerCase() === userClean.toLowerCase() && a.passwordHash === pHash
      );

      setIsProcessing(false);
      if (found) {
        onLoginSuccess(found.userAccount, found.rosterEntry);
        fireConfetti();
      } else {
        setErrorMessage('Invalid username or password. Please check your credentials.');
      }
    } catch {
      setIsProcessing(false);
      setErrorMessage('Authentication error. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans">
      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Back to App Link */}
      <button
        type="button"
        onClick={onNavigateHome}
        className="mb-6 flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Exile SSF</span>
      </button>

      {/* Main Login Card */}
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl shadow-2xl p-6 sm:p-8 space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Exile SSF Compendium</span>
          </div>
          <h1 className="text-2xl font-black font-cinzel text-white tracking-tight">
            Log In to Exile SSF
          </h1>
          <p className="text-xs text-slate-400">
            Sign in to manage your squad wishlist and private league registration.
          </p>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Auth Method Switcher Tabs */}
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
            <span>Google Auth</span>
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
            <span>Exile SSF Account</span>
          </button>
        </div>

        {/* Google Login Form */}
        {authMethod === 'google' && (
          <form onSubmit={handleGoogleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
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
              <span className="text-[11px] text-slate-500 mt-1 block">
                Quick sign in for your squad profile.
              </span>
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all"
            >
              <Globe className="w-4 h-4" />
              <span>{isProcessing ? 'Authenticating with Google...' : 'Continue with Google'}</span>
            </button>
          </form>
        )}

        {/* Exile SSF App Account Login Form */}
        {authMethod === 'app' && (
          <form onSubmit={handleAppLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Exile SSF Username *
              </label>
              <input
                type="text"
                required
                placeholder="Your account username"
                value={appUsername}
                onChange={(e) => setAppUsername(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
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
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all"
            >
              <KeyRound className="w-4 h-4" />
              <span>{isProcessing ? 'Verifying Credentials...' : 'Sign In'}</span>
            </button>
          </form>
        )}

        {/* Switch to Register */}
        <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
          <span>Don't have an Exile SSF account yet? </span>
          <button
            type="button"
            onClick={onNavigateRegister}
            className="text-indigo-400 hover:text-indigo-300 font-semibold underline cursor-pointer"
          >
            Create an Account (/register)
          </button>
        </div>
      </div>
    </div>
  );
};
