import React, { useState, useEffect } from 'react';
import {
  Clock,
  Flame,
  ShieldCheck,
  ExternalLink,
  DownloadCloud,
  Compass,
  ChevronDown,
  ChevronUp,
  Users,
  Copy,
  BookOpen,
  History,
  HelpCircle
} from 'lucide-react';
import type {
  ActiveLeagueSession,
  LeagueRosterMember,
  UserAccount,
  PastPrivateLeague,
  LeagueFirstMilestone
} from '../../../types';
import { COVEN_OF_UMBRA_INFO } from '../../../data/privateLeagueData';
import { LeagueHeroBanner } from '../../LeagueHeroBanner';
import { LeagueFirstsWall } from '../widgets/LeagueFirstsWall';
import type { ManagerSectionType } from '../../LeagueContentManagerModal';

export interface CommandCenterTabProps {
  activeSessionId: string;
  isPoE2Session: boolean;
  activeLeagueInfo: any;
  currentSession: ActiveLeagueSession;
  roster: LeagueRosterMember[];
  userAccount?: UserAccount | null;
  isCurrentUserOnRoster: boolean;
  onOpenAuthModal?: () => void;
  triggerCopy: (text: string, label: string) => void;
  handleOpenInviteModal: () => void;
  handleOpenJoinModal: () => void;
  handleOpenIngestModal: () => void;
  quickLinks: any[];
  archivesList: PastPrivateLeague[];
  faqList: any[];
  openManagerModal: (section: ManagerSectionType) => void;
  isCurrentUserAdmin?: boolean;
  leagueFirsts?: LeagueFirstMilestone[];
  onClaimLeagueFirst?: (milestone: LeagueFirstMilestone) => void;
}

export const CommandCenterTab: React.FC<CommandCenterTabProps> = ({
  activeSessionId,
  isPoE2Session,
  activeLeagueInfo,
  currentSession,
  roster,
  userAccount,
  isCurrentUserOnRoster,
  onOpenAuthModal,
  triggerCopy,
  handleOpenInviteModal,
  handleOpenJoinModal,
  handleOpenIngestModal,
  quickLinks,
  archivesList,
  faqList,
  openManagerModal,
  isCurrentUserAdmin = false,
  leagueFirsts = [],
  onClaimLeagueFirst
}) => {
  // Collapsible Sections State
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('poe_league_collapsed_sections');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  const toggleSection = (id: string) => {
    setCollapsedSections((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem('poe_league_collapsed_sections', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const setAllSectionsCollapsed = (collapsed: boolean) => {
    const next: Record<string, boolean> = {
      onboarding: collapsed,
      community: collapsed,
      links: collapsed,
      archives: collapsed,
      faq: collapsed
    };
    setCollapsedSections(next);
    try {
      localStorage.setItem('poe_league_collapsed_sections', JSON.stringify(next));
    } catch {}
  };

  // Live Countdowns
  const [timeToReveal, setTimeToReveal] = useState<{ d: number; h: number; m: number; s: number }>({ d: 0, h: 0, m: 0, s: 0 });
  const [timeToLaunch, setTimeToLaunch] = useState<{ d: number; h: number; m: number; s: number }>({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    const updateCountdowns = () => {
      const now = new Date().getTime();
      const reveal = new Date(COVEN_OF_UMBRA_INFO.revealDateIso).getTime();
      const launch = new Date(currentSession.launchDateIso).getTime();

      const diffReveal = Math.max(0, reveal - now);
      const diffLaunch = Math.max(0, launch - now);

      setTimeToReveal({
        d: Math.floor(diffReveal / (1000 * 60 * 60 * 24)),
        h: Math.floor((diffReveal % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        m: Math.floor((diffReveal % (1000 * 60 * 60)) / (1000 * 60)),
        s: Math.floor((diffReveal % (1000 * 60)) / 1000)
      });

      setTimeToLaunch({
        d: Math.floor(diffLaunch / (1000 * 60 * 60 * 24)),
        h: Math.floor((diffLaunch % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        m: Math.floor((diffLaunch % (1000 * 60 * 60)) / (1000 * 60)),
        s: Math.floor((diffLaunch % (1000 * 60)) / 1000)
      });
    };

    updateCountdowns();
    const interval = setInterval(updateCountdowns, 1000);
    return () => clearInterval(interval);
  }, [currentSession.launchDateIso]);

  // FAQ Accordion State
  const [openFaqIndices, setOpenFaqIndices] = useState<number[]>([0]);
  const toggleFaq = (index: number) => {
    setOpenFaqIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  return (
    <div className="space-y-6">
      {/* Hero Launch Banner with Artwork and Game Avatar */}
      <LeagueHeroBanner
        activeSessionId={activeSessionId}
        isPoE2Session={isPoE2Session}
        activeLeagueInfo={activeLeagueInfo}
        userAccount={userAccount}
        onOpenAuthModal={onOpenAuthModal}
        triggerCopy={triggerCopy}
        onOpenInviteModal={handleOpenInviteModal}
        onOpenJoinModal={handleOpenJoinModal}
        isUserOnRoster={isCurrentUserOnRoster}
      />

      {/* League Firsts & Hall of Fame Wall */}
      {onClaimLeagueFirst && (
        <LeagueFirstsWall
          leagueId={activeSessionId}
          firsts={leagueFirsts}
          roster={roster}
          currentUser={userAccount || null}
          isAdmin={isCurrentUserAdmin}
          onClaimFirst={onClaimLeagueFirst}
        />
      )}

      {/* Category Collapsible Master Controls */}
      <div className="px-4 py-2 rounded-xl border border-slate-800/80 bg-slate-900/60 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2 text-slate-400">
          <span className="w-2 h-2 rounded-full bg-indigo-500" />
          <span>Command Center Guides and Resources (5 Collapsible Sections)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAllSectionsCollapsed(false)}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            Expand All
          </button>
          <button
            type="button"
            onClick={() => setAllSectionsCollapsed(true)}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Live Crowdfunding Banner and Ingest Action */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-lg">
        <div className="p-3 border-b border-slate-800 bg-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-300 font-bold">
              Official Crowdfund and Ladder Link
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase font-bold">
              {activeLeagueInfo.crowdfundStatus || 'Crowdfunding Active'}
            </span>
          </div>
        </div>
        <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs text-slate-300">
              Funded: <strong>{activeLeagueInfo.fundedDays} / {activeLeagueInfo.targetDays} Days</strong>
              {Boolean(activeLeagueInfo.crowdfundPointsGoal && activeLeagueInfo.crowdfundPointsGoal > 0) ? (
                <span> • Points: <strong>{activeLeagueInfo.crowdfundPointsCurrent || 0} / {activeLeagueInfo.crowdfundPointsGoal}</strong></span>
              ) : (
                <span> • Crowdfund: <strong className="text-emerald-400">Base Slots Funded</strong></span>
              )}
              <span> • Slots: <strong>{roster.length} / {activeLeagueInfo.currentSlots} Exiles</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {activeLeagueInfo.officialLeagueUrl ? (
              <a
                href={activeLeagueInfo.officialLeagueUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Contribute Points on PathOfExile.com</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            ) : (
              <button
                type="button"
                onClick={handleOpenIngestModal}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Crowdfund link will unlock when 3.30 league page is created by GGG. Click to ingest once live."
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Points Crowdfund (Pending 3.30 Creation)</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleOpenIngestModal}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Update or paste official crowdfund parameters from pathofexile.com"
            >
              <DownloadCloud className="w-3.5 h-3.5 text-indigo-400" />
              <span>Ingest League Page</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Countdowns Bar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-lg">
        <div className="p-3 border-b border-slate-800 bg-slate-800/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              Official Reveal and Launch Countdown Tracker
            </span>
          </div>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> ExileCon Reveal Livestream
                </div>
                <div className="text-xs text-slate-500 mt-0.5">November 6, 2026</div>
              </div>
              <div className="flex items-center gap-2 font-orbitron text-lg font-bold text-slate-100">
                <span className="p-1.5 rounded bg-slate-800 border border-slate-700/60">{timeToReveal.d}d</span>
                <span className="p-1.5 rounded bg-slate-800 border border-slate-700/60">{timeToReveal.h}h</span>
                <span className="p-1.5 rounded bg-slate-800 border border-slate-700/60">{timeToReveal.m}m</span>
                <span className="p-1.5 rounded bg-slate-800 border border-slate-700/60 text-slate-400">{timeToReveal.s}s</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-mono text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5" /> 3.30 Official League Launch
                </div>
                <div className="text-xs text-slate-500 mt-0.5">November 13, 2026</div>
              </div>
              <div className="flex items-center gap-2 font-orbitron text-lg font-bold text-amber-300">
                <span className="p-1.5 rounded bg-slate-800 border border-slate-700/60">{timeToLaunch.d}d</span>
                <span className="p-1.5 rounded bg-slate-800 border border-slate-700/60">{timeToLaunch.h}h</span>
                <span className="p-1.5 rounded bg-slate-800 border border-slate-700/60">{timeToLaunch.m}m</span>
                <span className="p-1.5 rounded bg-slate-800 border border-slate-700/60 text-amber-500">{timeToLaunch.s}s</span>
              </div>
            </div>
          </div>

          {/* Overview Quick Stats Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
              <div className="text-[11px] font-mono text-slate-400 uppercase">League Duration Funded</div>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-orbitron font-bold text-white">{activeLeagueInfo.fundedDays} Days</span>
                <span className="text-xs text-slate-500 font-mono">Target: {activeLeagueInfo.targetDays}d</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden mt-1">
                <div
                  className="h-full bg-indigo-500"
                  style={{ width: `${(activeLeagueInfo.fundedDays / activeLeagueInfo.targetDays) * 100}%` }}
                />
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
              <div className="text-[11px] font-mono text-slate-400 uppercase">Exiles Registered</div>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-orbitron font-bold text-white">{roster.length} Exiles</span>
                <span className="text-xs text-slate-500 font-mono">Limit: {activeLeagueInfo.currentSlots}</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden mt-1">
                <div
                  className="h-full bg-indigo-500"
                  style={{ width: `${(roster.length / activeLeagueInfo.currentSlots) * 100}%` }}
                />
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
              <div className="text-[11px] font-mono text-slate-400 uppercase">
                {Boolean(activeLeagueInfo.crowdfundPointsGoal && activeLeagueInfo.crowdfundPointsGoal > 0) ? 'Crowdfund Points' : 'League Funding Status'}
              </div>
              {Boolean(activeLeagueInfo.crowdfundPointsGoal && activeLeagueInfo.crowdfundPointsGoal > 0) ? (
                <>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-orbitron font-bold text-white">{activeLeagueInfo.crowdfundPointsCurrent || 0} pts</span>
                    <span className="text-xs text-slate-500 font-mono">Goal: {activeLeagueInfo.crowdfundPointsGoal} pts</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden mt-1">
                    <div
                      className="h-full bg-emerald-500"
                      style={{ width: `${Math.min(100, Math.round(((activeLeagueInfo.crowdfundPointsCurrent || 0) / activeLeagueInfo.crowdfundPointsGoal) * 100))}%` }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-orbitron font-bold text-emerald-400">{activeLeagueInfo.fundedDays} Days</span>
                    <span className="text-xs text-slate-400 font-mono">PL87651 Active</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden mt-1">
                    <div className="h-full bg-emerald-500 w-full" />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4 Step Onboarding Guide */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden shadow-lg">
        <div className="p-4 border-b border-slate-800 bg-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              How to Join and Participate (4 Step Onboarding Guide)
            </span>
          </div>
          <button
            type="button"
            onClick={() => toggleSection('onboarding')}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            {collapsedSections['onboarding'] ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        {!collapsedSections['onboarding'] && (
          <div className="p-5 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/60 space-y-1">
                <div className="font-mono text-indigo-400 font-bold">01. Register Profile</div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Set your preferred contact tag (Root handle, Discord, or In Game whisper) and PoE account name.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/60 space-y-1">
                <div className="font-mono text-indigo-400 font-bold">02. Accept Invite</div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Once invited on pathofexile.com, click Accept so your character starts directly in the private league.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/60 space-y-1">
                <div className="font-mono text-indigo-400 font-bold">03. Post Wanted Items</div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Add build enabling uniques and bases to your Looking For list so mapping squad mates stash them.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/60 space-y-1">
                <div className="font-mono text-indigo-400 font-bold">04. Join In Game Chat</div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Type /global 5712 on launch day to coordinate mapping, lab carries, and crafts.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Ravenwatch and NOIR Guild Community Hub */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-lg">
        <div className="p-4 border-b border-slate-800/80 bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              Ravenwatch and NOIR Guild Community Hub
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
              Official Gather Place
            </span>
          </div>
          <button
            type="button"
            onClick={() => toggleSection('community')}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            {collapsedSections['community'] ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        {!collapsedSections['community'] && (
          <div className="p-5 space-y-4">
            <div className="p-4 rounded-xl border border-emerald-950/80 bg-emerald-950/20 text-xs text-slate-300 leading-relaxed space-y-2">
              <p className="font-medium text-slate-200">
                Ravenwatch is the chill community of ARPG and MMO gamers run by the NOIR guild, founded and created by Leuie in January 2018. The Ravenwatch server was established in February 2026 during the &quot;Discord Exit&quot;.
              </p>
              <p className="text-slate-300">
                It welcomes gamers from all over the world. We are more than just gamers, and our community is a place where we can show that. We are here to help you connect, laugh, and grow your circle in a positive, meaningful way. NOIR manages the guild community, and Ravenwatch serves as our dedicated ARPG and MMO gaming server.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <a
                href="https://rootapp.gg/AC1NPUuJiQqlyDvGbgH-8A"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 rounded-xl border border-emerald-800/60 bg-emerald-950/40 hover:bg-emerald-900/50 transition-all flex flex-col justify-between space-y-2 group"
              >
                <div>
                  <div className="text-[10px] font-mono text-emerald-400 uppercase font-bold">Official GSF Community</div>
                  <div className="font-bold text-sm text-white mt-0.5 flex items-center gap-1.5">
                    <span>Ravenwatch on Root</span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1">
                    Primary gathering place for GSF coordination, trade requests, voice hangouts, and starter builds.
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-emerald-300 font-mono">
                  <span>Join Ravenwatch</span>
                  <ExternalLink className="w-3 h-3" />
                </div>
              </a>

              <a
                href="https://rootapp.gg/AC01VYpHiAq1rM0An8FDzw"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 rounded-xl border border-slate-800 bg-slate-800/40 hover:bg-slate-800/80 transition-all flex flex-col justify-between space-y-2 group"
              >
                <div>
                  <div className="text-[10px] font-mono text-indigo-400 uppercase font-bold">Guild Headquarters</div>
                  <div className="font-bold text-sm text-white mt-0.5">
                    <span>NOIR Guild HQ</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    The home of NOIR Guild. Connect with guild runners, officers, and community veterans on Root.
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-indigo-300 font-mono">
                  <span>Open NOIR HQ</span>
                  <ExternalLink className="w-3 h-3" />
                </div>
              </a>

              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-800/40 flex flex-col justify-between space-y-2">
                <div>
                  <div className="text-[10px] font-mono text-amber-400 uppercase font-bold">In Game Global Chat</div>
                  <div className="font-bold text-sm text-white mt-0.5 font-mono">
                    <span>/global 5712</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Click below to copy the chat channel command to paste directly in Path of Exile on launch.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => triggerCopy('/global 5712', 'In Game Channel')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy Channel Command</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Essential Official Quick Links */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden space-y-0">
        <div className="p-4 border-b border-slate-800 bg-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              Official 3.30 Resources and Links
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono text-[10px]">
              {quickLinks.length} Links
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openManagerModal('links')}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-indigo-300 text-[11px] font-mono flex items-center gap-1 cursor-pointer"
            >
              <span>Manage Links</span>
            </button>
            <button
              type="button"
              onClick={() => toggleSection('links')}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              {collapsedSections['links'] ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>
        {!collapsedSections['links'] && (
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {quickLinks.map((link, idx) => (
              <a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-lg border border-slate-800 bg-slate-800/40 hover:bg-slate-800/80 hover:border-slate-700 transition-colors flex flex-col justify-between space-y-2 group"
              >
                <div>
                  <div className="text-[10px] font-mono text-slate-500 uppercase">{link.category}</div>
                  <div className="font-semibold text-xs text-slate-200 group-hover:text-white mt-0.5">
                    {link.label}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{link.description}</p>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-indigo-400 font-mono">
                  <span>Open Link</span>
                  <ExternalLink className="w-3 h-3" />
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Past NOIR Leagues Archive */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden space-y-0">
        <div className="p-4 border-b border-slate-800 bg-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              NOIR Private League Archives
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono text-[10px]">
              {archivesList.length} Previous Leagues
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openManagerModal('archives')}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-indigo-300 text-[11px] font-mono flex items-center gap-1 cursor-pointer"
            >
              <span>Manage Archives</span>
            </button>
            <button
              type="button"
              onClick={() => toggleSection('archives')}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              {collapsedSections['archives'] ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>
        {!collapsedSections['archives'] && (
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {archivesList.map((league) => (
              <a
                key={league.id}
                href={league.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-lg border border-slate-800 bg-slate-800/40 hover:bg-slate-800/80 hover:border-slate-700 transition-colors flex flex-col justify-between space-y-2 group"
              >
                <div>
                  <div className="text-[10px] font-mono text-slate-500">{league.version}</div>
                  <div className="font-semibold text-xs text-slate-200 group-hover:text-white mt-0.5">
                    {league.name}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {league.participants} Exiles • {league.duration}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                  <span>Archive</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Collapsible FAQ */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden space-y-0">
        <div className="p-4 border-b border-slate-800 bg-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              F.A.Q. and League Guidelines
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono text-[10px]">
              {faqList.length} Questions
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openManagerModal('faq')}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-indigo-300 text-[11px] font-mono flex items-center gap-1 cursor-pointer"
            >
              <span>Manage F.A.Q.</span>
            </button>
            <button
              type="button"
              onClick={() => toggleSection('faq')}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              {collapsedSections['faq'] ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>
        {!collapsedSections['faq'] && (
          <div className="p-5 space-y-2">
            {faqList.map((faq, idx) => {
              const isOpen = openFaqIndices.includes(idx);
              return (
                <div key={idx} className="rounded-lg border border-slate-800 bg-slate-800/30 overflow-hidden">
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-3 flex items-center justify-between text-left text-xs font-semibold text-slate-200 hover:text-white transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                  </button>
                  {isOpen && (
                    <div className="px-3 pb-3 text-xs text-slate-400 leading-relaxed border-t border-slate-800/60 pt-2">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
