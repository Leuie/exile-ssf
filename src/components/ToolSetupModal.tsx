import React, { useState, useEffect } from 'react';
import {
  X,
  Sliders,
  Package,
  Swords,
  Compass,
  Flame,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  Copy,
  Check,
  HelpCircle,
  Lock
} from 'lucide-react';
import type { UserAccount } from '../types';
import { saveUserToolState } from '../services/cloudSync';
import { PREFS_STORAGE_KEY } from './assets/assetEngine';
import {
  readUnifiedPoeSession,
  saveUnifiedPoeSession,
  clearUnifiedPoeSession
} from '../utils/poeSession';

export interface UnifiedToolPrefs {
  assetTracker: boolean;
  characterArmory: boolean;
  mapTracker: boolean;
  buildsHub: boolean;
  accountName: string;
  leagueName: string;
  updatedAtIso: string;
}

export const UNIFIED_TOOL_PREFS_KEY = 'exile_ssf_unified_tool_prefs_v1';

export function readUnifiedToolPrefs(): UnifiedToolPrefs {
  try {
    const raw = localStorage.getItem(UNIFIED_TOOL_PREFS_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return {
        assetTracker: p.assetTracker !== false,
        characterArmory: p.characterArmory !== false,
        mapTracker: p.mapTracker !== false,
        buildsHub: p.buildsHub !== false,
        accountName: String(p.accountName || ''),
        leagueName: String(p.leagueName || 'Ravenwatch Covens of Umbra GSF (PL87651)'),
        updatedAtIso: String(p.updatedAtIso || '')
      };
    }
  } catch {}
  return {
    assetTracker: true,
    characterArmory: true,
    mapTracker: true,
    buildsHub: true,
    accountName: '',
    leagueName: 'Ravenwatch Covens of Umbra GSF (PL87651)',
    updatedAtIso: ''
  };
}

function readSavedPoesessid(): { poesessid: string; accountName: string } {
  const sess = readUnifiedPoeSession();
  return {
    poesessid: sess?.poesessid || '',
    accountName: sess?.accountName || ''
  };
}

interface ToolSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  userAccount?: UserAccount | null;
  selectedGame?: 'poe1' | 'poe2';
  onNavigateTab?: (tabId: string) => void;
}

export const ToolSetupModal: React.FC<ToolSetupModalProps> = ({
  isOpen,
  onClose,
  userAccount,
  selectedGame = 'poe1',
  onNavigateTab
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [prefs, setPrefs] = useState<UnifiedToolPrefs>(() => readUnifiedToolPrefs());
  const [poesessid, setPoesessid] = useState<string>('');
  const [rememberSession, setRememberSession] = useState<boolean>(true);
  const [showSsidGuide, setShowSsidGuide] = useState<boolean>(false);
  const [testingConn, setTestingConn] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [hardlinkPlatform, setHardlinkPlatform] = useState<'steam' | 'standalone'>('steam');
  const [copiedCmd, setCopiedCmd] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
    setTestResult(null);
    const savedPrefs = readUnifiedToolPrefs();
    const savedSess = readSavedPoesessid();
    const defaultAcct = savedPrefs.accountName || savedSess.accountName || userAccount?.poeAccountName || '';
    const defaultLeague =
      savedPrefs.leagueName ||
      (selectedGame === 'poe2' ? 'Dawn of the Hunt' : 'Ravenwatch Covens of Umbra GSF (PL87651)');
    setPrefs({ ...savedPrefs, accountName: defaultAcct, leagueName: defaultLeague });
    setPoesessid(savedSess.poesessid || '');
  }, [isOpen, userAccount?.poeAccountName, selectedGame]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const needsPoeSession = prefs.assetTracker || prefs.characterArmory || prefs.buildsHub;
  const hardlinkCmd =
    hardlinkPlatform === 'steam'
      ? `cmd /c mklink /H "%USERPROFILE%\\Documents\\PoE_Client.txt" "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Path of Exile\\logs\\Client.txt"`
      : `cmd /c mklink /H "%USERPROFILE%\\Documents\\PoE_Client.txt" "C:\\Program Files (x86)\\Grinding Gear Games\\Path of Exile\\logs\\Client.txt"`;

  const handleCopyHardlink = () => {
    navigator.clipboard?.writeText(hardlinkCmd);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const handleTestConnection = async () => {
    if (!prefs.accountName.trim() || !prefs.leagueName.trim() || !poesessid.trim()) {
      setTestResult({ ok: false, text: 'Enter your PoE Account Name (e.g. Name#1234), League, and POESESSID first.' });
      return;
    }
    setTestingConn(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/farming/stash-tabs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          accountName: prefs.accountName.trim(),
          league: prefs.leagueName.trim(),
          realm: 'pc',
          poesessid: poesessid.trim()
        })
      });
      const data: any = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        setTestResult({ ok: false, text: data.error || `Connection failed (HTTP ${res.status}). Check POESESSID & Account Name.` });
      } else {
        const count = Array.isArray(data.tabs) ? data.tabs.length : 0;
        setTestResult({ ok: true, text: `Connected! Found ${count} stash tabs in "${data.league || prefs.leagueName}".` });
      }
    } catch {
      setTestResult({ ok: false, text: 'Network error testing GGG connection.' });
    } finally {
      setTestingConn(false);
    }
  };

  const handleSaveAndFinish = async () => {
    const nextPrefs: UnifiedToolPrefs = {
      ...prefs,
      accountName: prefs.accountName.trim(),
      leagueName: prefs.leagueName.trim() || 'Ravenwatch Covens of Umbra GSF (PL87651)',
      updatedAtIso: new Date().toISOString()
    };

    try {
      localStorage.setItem(UNIFIED_TOOL_PREFS_KEY, JSON.stringify(nextPrefs));

      // Keep Asset Tracker prefs synchronized
      const existingFarmRaw = localStorage.getItem(PREFS_STORAGE_KEY);
      const existingFarm = existingFarmRaw ? JSON.parse(existingFarmRaw) : {};
      localStorage.setItem(
        PREFS_STORAGE_KEY,
        JSON.stringify({
          ...existingFarm,
          accountName: nextPrefs.accountName,
          leagueName: nextPrefs.leagueName,
          rememberPoesessid: rememberSession
        })
      );

      // Save POESESSID strictly in browser localStorage (30 day opt in, shared across all tools, never on server)
      if (rememberSession && poesessid.trim()) {
        saveUnifiedPoeSession({
          poesessid: poesessid.trim(),
          accountName: nextPrefs.accountName,
          leagueName: nextPrefs.leagueName
        });
      } else if (!rememberSession) {
        clearUnifiedPoeSession();
      }
    } catch {}

    // Persist non-sensitive tool opt-in preferences to Cloud (never POESESSID)
    if (userAccount?.displayName) {
      void saveUserToolState(userAccount.displayName, 'unified_tool_setup', nextPrefs);
    }

    // Notify mounted tools (Asset Tracker, Map Tracker, Armory) immediately
    window.dispatchEvent(new CustomEvent('exile-tool-setup-updated', { detail: nextPrefs }));
    setStep(3);
  };

  const toolCards: Array<{
    key: 'assetTracker' | 'characterArmory' | 'mapTracker' | 'buildsHub';
    title: string;
    icon: any;
    accent: string;
    gathers: string;
    uses: string;
  }> = [
    {
      key: 'assetTracker',
      title: 'Asset Tracker',
      icon: Package,
      accent: 'text-emerald-400',
      gathers: 'Selected stash tabs & equipped items via GGG API.',
      uses: 'Tracks net worth, Div/hr timelines, and squad wishlist matches.'
    },
    {
      key: 'characterArmory',
      title: 'Character Armory',
      icon: Swords,
      accent: 'text-amber-400',
      gathers: 'Equipped gear, flasks, jewels, gems, and passive tree.',
      uses: 'Powers your shareable Armory page and Roster inspect previews.'
    },
    {
      key: 'mapTracker',
      title: 'Map Tracker',
      icon: Compass,
      accent: 'text-sky-400',
      gathers: 'Local Client.txt zone changes, deaths, and trade whispers.',
      uses: 'Tracks map clear speed, hideout downtime, XP/hr, and League Firsts.'
    },
    {
      key: 'buildsHub',
      title: 'Builds Hub & Doctor',
      icon: Flame,
      accent: 'text-purple-400',
      gathers: 'Reads your synced Armory character snapshot.',
      uses: 'Enables Armory Audits, EHP calculator loading, and Build publishing.'
    }
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-slate-700/80 bg-[#0d111a] shadow-[0_24px_70px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">Unified Tool Setup</h2>
              <p className="text-[11px] text-slate-400">
                Configure your data sources once — feeds Asset Tracker, Armory, Map Tracker &amp; Builds Hub.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stepper Indicator */}
        <div className="px-5 py-2.5 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
          {[
            { num: 1, label: '1. Choose Tools' },
            { num: 2, label: '2. Connect Sources' },
            { num: 3, label: '3. Ready' }
          ].map((s) => (
            <button
              key={s.num}
              type="button"
              onClick={() => setStep(s.num as 1 | 2 | 3)}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                step === s.num
                  ? 'bg-indigo-600/30 text-white border border-indigo-400/50 font-bold'
                  : step > s.num
                  ? 'text-emerald-300'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {step === 1 && (
            <>
              <div className="text-xs text-slate-300 leading-relaxed">
                Select which Exile SSF tools you want to participate in. You stay in full control of what data is pulled and can change these anytime.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {toolCards.map((t) => {
                  const Icon = t.icon;
                  const checked = prefs[t.key];
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setPrefs((prev) => ({ ...prev, [t.key]: !prev[t.key] }))}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer space-y-1.5 ${
                        checked
                          ? 'bg-slate-900/95 border-indigo-500/60 shadow-md shadow-indigo-950/25'
                          : 'bg-slate-950/60 border-slate-800 opacity-65 hover:opacity-90'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-bold text-xs text-white">
                          <Icon className={`w-4 h-4 ${t.accent}`} />
                          <span>{t.title}</span>
                        </div>
                        <span
                          className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] ${
                            checked
                              ? 'bg-indigo-600 border-indigo-400 text-white'
                              : 'bg-slate-950 border-slate-700 text-transparent'
                          }`}
                        >
                          ✓
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug">
                        <strong className="text-slate-200">Pulls:</strong> {t.gathers}
                      </p>
                      <p className="text-[11px] text-slate-400 leading-snug">
                        <strong className="text-slate-300">Used for:</strong> {t.uses}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-950/25 border border-emerald-500/30 flex items-start gap-2.5 text-[11px] text-emerald-200/90 leading-relaxed">
                <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-emerald-300">Privacy Promise:</strong> Your <code className="font-mono text-emerald-200">POESESSID</code> is{' '}
                  <strong>never</strong> stored or logged on our servers — it stays exclusively in your browser (30 day opt in) and is only sent directly to GGG&apos;s official API when you click Sync. Your <code className="font-mono text-emerald-200">Client.txt</code> file is parsed 100% locally in your browser.
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <div className="space-y-4">
              {needsPoeSession && (
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/75 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Path of Exile Account &amp; Session (Assets, Armory &amp; Builds)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowSsidGuide((v) => !v)}
                      className="text-[11px] font-mono text-sky-300 hover:text-sky-200 flex items-center gap-1 cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>{showSsidGuide ? 'Hide Guide' : 'How to get POESESSID'}</span>
                    </button>
                  </div>

                  {showSsidGuide && (
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300 space-y-1 leading-relaxed">
                      <div>1. Log in at <strong className="text-white">pathofexile.com</strong> and press <kbd className="px-1 bg-slate-800 rounded">F12</kbd>.</div>
                      <div>2. Open <strong className="text-white">Application</strong> (Chrome/Brave/Edge) or <strong className="text-white">Storage</strong> (Firefox) → <strong className="text-white">Cookies</strong> → <code className="text-sky-300">pathofexile.com</code>.</div>
                      <div>3. Copy the 32-character value next to <strong className="text-amber-300">POESESSID</strong> and paste it below.</div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-mono text-slate-300 block mb-1">
                        PoE Account Name (with #Tag)
                      </label>
                      <input
                        type="text"
                        value={prefs.accountName}
                        onChange={(e) => setPrefs((p) => ({ ...p, accountName: e.target.value }))}
                        placeholder="e.g. Leuie#0626"
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-slate-300 block mb-1">
                        Active League Name or Code
                      </label>
                      <input
                        type="text"
                        value={prefs.leagueName}
                        onChange={(e) => setPrefs((p) => ({ ...p, leagueName: e.target.value }))}
                        placeholder="Ravenwatch Covens of Umbra GSF (PL87651)"
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-slate-300 block mb-1">
                      POESESSID Cookie (Stays in your browser only)
                    </label>
                    <input
                      type="text"
                      name="poe_session_token"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      data-lpignore="true"
                      data-1p-ignore="true"
                      style={{ WebkitTextSecurity: 'disc' } as React.CSSProperties}
                      value={poesessid}
                      onChange={(e) => setPoesessid(e.target.value)}
                      placeholder="Paste 32 character POESESSID..."
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberSession}
                        onChange={(e) => setRememberSession(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-950 text-indigo-500"
                      />
                      <span>Remember POESESSID in this browser for 30 days</span>
                    </label>

                    <button
                      type="button"
                      disabled={testingConn}
                      onClick={handleTestConnection}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/45 text-amber-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${testingConn ? 'animate-spin' : ''}`} />
                      <span>{testingConn ? 'Testing...' : 'Test GGG Connection'}</span>
                    </button>
                  </div>

                  {testResult && (
                    <div
                      className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                        testResult.ok
                          ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                          : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                      }`}
                    >
                      {testResult.ok ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                      <span>{testResult.text}</span>
                    </div>
                  )}
                </div>
              )}

              {prefs.mapTracker && (
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/75 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                      <Compass className="w-4 h-4" />
                      <span>Map Tracker Client.txt Helper (100% Local)</span>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px] font-mono">
                      <button
                        type="button"
                        onClick={() => setHardlinkPlatform('steam')}
                        className={`px-2 py-0.5 rounded cursor-pointer ${
                          hardlinkPlatform === 'steam' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400'
                        }`}
                      >
                        Steam
                      </button>
                      <button
                        type="button"
                        onClick={() => setHardlinkPlatform('standalone')}
                        className={`px-2 py-0.5 rounded cursor-pointer ${
                          hardlinkPlatform === 'standalone' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400'
                        }`}
                      >
                        Standalone
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Chromium &amp; Brave block selecting files directly inside <code className="text-slate-300">Program Files</code>. Run this 1 line helper in <strong className="text-slate-200">PowerShell or Command Prompt</strong> once to link <code className="text-sky-300">Client.txt</code> into your <code className="text-sky-300">Documents</code> folder, then pick or drag it inside Map Tracker:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 rounded-lg bg-slate-950 border border-slate-800 text-[10px] text-sky-200 font-mono truncate">
                      {hardlinkCmd}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopyHardlink}
                      className="px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-mono flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCmd ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              )}

              {!needsPoeSession && !prefs.mapTracker && (
                <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl">
                  No tools selected in Step 1. Go back to enable at least one tool, or save to opt out of all tool syncing.
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="py-4 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Unified Tool Setup Saved!</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Your Path of Exile account, league, and tool selections are now synchronized across Asset Tracker, Character Armory, Map Tracker, and Builds Hub.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                {prefs.assetTracker && onNavigateTab && (
                  <button
                    type="button"
                    onClick={() => {
                      onNavigateTab('asset_tracker');
                      onClose();
                    }}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600/25 hover:bg-emerald-600/35 border border-emerald-500/45 text-emerald-200 text-xs font-bold cursor-pointer"
                  >
                    Open Asset Tracker →
                  </button>
                )}
                {prefs.characterArmory && onNavigateTab && (
                  <button
                    type="button"
                    onClick={() => {
                      onNavigateTab('armory');
                      onClose();
                    }}
                    className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/45 text-amber-200 text-xs font-bold cursor-pointer"
                  >
                    Open Character Armory →
                  </button>
                )}
                {prefs.mapTracker && onNavigateTab && (
                  <button
                    type="button"
                    onClick={() => {
                      onNavigateTab('map_tracker');
                      onClose();
                    }}
                    className="px-3.5 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/45 text-sky-200 text-xs font-bold cursor-pointer"
                  >
                    Open Map Tracker →
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-2">
          {step === 1 ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow"
              >
                <span>Next: Connect Sources</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          ) : step === 2 ? (
            <>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleSaveAndFinish}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shadow"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save &amp; Apply Across Tools</span>
              </button>
            </>
          ) : (
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
