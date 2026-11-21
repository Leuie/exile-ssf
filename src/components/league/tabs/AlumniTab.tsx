import React, { useState } from 'react';
import {
  Copy,
  Send,
  RotateCcw,
  Search,
  MessageSquare,
  Globe,
  AtSign,
  CheckCircle2
} from 'lucide-react';
import type { LeagueParticipantAlumnus } from '../../../types';

export interface AlumniTabProps {
  alumniList: LeagueParticipantAlumnus[];
  activeLeagueInfo: any;
  triggerCopy: (text: string, label: string) => void;
  handleOpenResetModal: () => void;
  handleToggleNudge: (id: string) => void;
  onOpenProfile?: (handle: string) => void;
}

export const AlumniTab: React.FC<AlumniTabProps> = ({
  alumniList,
  activeLeagueInfo,
  triggerCopy,
  handleOpenResetModal,
  handleToggleNudge,
  onOpenProfile
}) => {
  const [alumniSearch, setAlumniSearch] = useState<string>('');
  const [alumniFilter, setAlumniFilter] = useState<'all' | 'not_nudged' | 'nudged' | 'veteran'>('all');

  return (
    <div className="space-y-4">
      {/* Outreach Stat Banner */}
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
              Community Track Record and History
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-poppins font-bold text-white">
            We have run previous leagues with over 100 participants across 5 past leagues.
          </h3>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Every past exile is cataloged below with their preferred contact channel (Root Web App, in game whisper, or Discord). Admins can nudge past participants promptly to onboard them for 3.30 Coven of Umbra!
          </p>
        </div>

        {/* Admin Outreach Batch Controls */}
        <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => {
              const allTags = alumniList.map((a: LeagueParticipantAlumnus) => a.poeAccountName).join(', ');
              triggerCopy(allTags, 'All Alumni Account Tags');
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Copy comma separated account names ready to paste into PoE Private League invite page"
          >
            <Copy className="w-3.5 h-3.5 text-slate-400" />
            <span>Copy All Account Tags</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const portalUrl = typeof window !== 'undefined' ? `${window.location.origin}/privateleaguehub` : 'https://exilessf.app/privateleaguehub';
              const template = `Hey Exiles! Ravenwatch Covens of Umbra GSF (PL87651) league is officially live for registration! Visit our SSF Portal to claim your spot, post your starter build, and add your wanted items: ${portalUrl} Accept invite: ${activeLeagueInfo.officialLeagueUrl || 'https://www.pathofexile.com/private-leagues/league/Ravenwatch+Covens+of+Umbra+GSF'}`;
              triggerCopy(template, '3.30 Announcement Message');
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 text-emerald-400" />
            <span>Copy 3.30 Announcement</span>
          </button>

          <button
            type="button"
            onClick={handleOpenResetModal}
            className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Archive active players to Alumni and reset the league sheet to a clean slate"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Start Fresh Season</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search alumni by name, account tag, build, or past league..."
            value={alumniSearch}
            onChange={(e) => setAlumniSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-slate-700"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'All Alumni (' + alumniList.length + ')' },
            { id: 'not_nudged', label: 'Needs Nudge (' + alumniList.filter((a: LeagueParticipantAlumnus) => !a.nudgedForCurrentLeague).length + ')' },
            { id: 'nudged', label: 'Nudged (' + alumniList.filter((a: LeagueParticipantAlumnus) => a.nudgedForCurrentLeague).length + ')' },
            { id: 'veteran', label: 'Veterans 2+ Leagues (' + alumniList.filter((a: LeagueParticipantAlumnus) => a.totalLeaguesCount >= 2).length + ')' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setAlumniFilter(f.id as any)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                alumniFilter === f.id
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Alumni Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {alumniList
          .filter((alumnus: LeagueParticipantAlumnus) => {
            const s = alumniSearch.toLowerCase();
            const matchSearch =
              !alumniSearch ||
              alumnus.displayName.toLowerCase().includes(s) ||
              alumnus.poeAccountName.toLowerCase().includes(s) ||
              (alumnus.discordName && alumnus.discordName.toLowerCase().includes(s)) ||
              (alumnus.lastKnownBuild && alumnus.lastKnownBuild.toLowerCase().includes(s)) ||
              alumnus.pastLeagues.some((l: string) => l.toLowerCase().includes(s));

            const matchFilter =
              alumniFilter === 'all' ||
              (alumniFilter === 'not_nudged' && !alumnus.nudgedForCurrentLeague) ||
              (alumniFilter === 'nudged' && alumnus.nudgedForCurrentLeague) ||
              (alumniFilter === 'veteran' && alumnus.totalLeaguesCount >= 2);

            return matchSearch && matchFilter;
          })
          .map((alumnus: LeagueParticipantAlumnus) => {
            const portalUrl = typeof window !== 'undefined' ? `${window.location.origin}/privateleaguehub` : 'https://exilessf.app/privateleaguehub';
            const whisperCommand = `@${alumnus.displayName} Hey exile! Ravenwatch Covens of Umbra GSF (PL87651) private league is live. Register here: ${portalUrl}`;

            return (
              <div
                key={alumnus.id}
                className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/70 hover:bg-slate-800/60 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-xs text-slate-100 flex items-center gap-1.5">
                      <button type="button" onClick={() => onOpenProfile?.(alumnus.displayName)} className="hover:text-indigo-300 hover:underline cursor-pointer">@{alumnus.displayName}</button>
                      {alumnus.totalLeaguesCount >= 3 && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                          Veteran ({alumnus.totalLeaguesCount} Leagues)
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleNudge(alumnus.id)}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                        alumnus.nudgedForCurrentLeague
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {alumnus.nudgedForCurrentLeague ? 'Nudged' : 'Needs Nudge'}
                    </button>
                  </div>

                  <div className="text-[11px] font-mono text-slate-400 space-y-0.5">
                    <div>PoE: {alumnus.poeAccountName}</div>
                    {alumnus.discordName && <div>Discord: {alumnus.discordName}</div>}
                    <div className="text-slate-500 text-[10px]">
                      Preferred: {alumnus.preferredContact === 'app' ? 'Root App' : alumnus.preferredContact === 'poe_whisper' ? 'PoE Whisper' : alumnus.preferredContact}
                    </div>
                  </div>

                  {alumnus.lastKnownBuild && (
                    <div className="text-[11px] text-slate-300 bg-slate-950/70 p-2 rounded border border-slate-800">
                      <span className="text-[10px] font-mono text-slate-500 uppercase block">Last Build:</span>
                      {alumnus.lastKnownBuild}
                    </div>
                  )}

                  {/* Past Leagues Badges */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {alumnus.pastLeagues.slice(0, 2).map((lg: string, lIdx: number) => (
                      <span
                        key={lIdx}
                        className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-950 text-slate-400 border border-slate-800 truncate max-w-[170px]"
                      >
                        {lg}
                      </span>
                    ))}
                    {alumnus.pastLeagues.length > 2 && (
                      <span className="text-[10px] font-mono text-slate-500 self-center">
                        +{alumnus.pastLeagues.length - 2} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Outreach Buttons */}
                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => triggerCopy(whisperCommand, 'PoE In Game Whisper')}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px] flex items-center gap-1 cursor-pointer"
                    title="Copy /whisper command for Path of Exile"
                  >
                    <MessageSquare className="w-2.5 h-2.5 text-slate-400" />
                    <span>Whisper</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => triggerCopy('@' + alumnus.displayName, 'Root App User Tag')}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px] flex items-center gap-1 cursor-pointer"
                  >
                    <Globe className="w-2.5 h-2.5 text-indigo-400" />
                    <span>App Tag</span>
                  </button>

                  {alumnus.discordName && (
                    <button
                      type="button"
                      onClick={() => triggerCopy(alumnus.discordName!, 'Discord Handle')}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px] flex items-center gap-1 cursor-pointer"
                    >
                      <AtSign className="w-2.5 h-2.5 text-purple-400" />
                      <span>Discord</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleToggleNudge(alumnus.id)}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white ml-auto cursor-pointer"
                    title="Toggle Nudge Checkmark"
                  >
                    <CheckCircle2 className={`w-3.5 h-3.5 ${alumnus.nudgedForCurrentLeague ? 'text-emerald-400' : 'text-slate-500'}`} />
                  </button>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};
