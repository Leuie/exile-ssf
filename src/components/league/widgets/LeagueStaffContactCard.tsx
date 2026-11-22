import React, { useState } from 'react';
import { Check, Copy, Crown, Mail, MessageSquare, Shield, ShieldCheck, User, Globe } from 'lucide-react';
import type { LeagueStaffMember } from '../../../types';

interface LeagueStaffContactCardProps {
  leagueName: string;
  staff: LeagueStaffMember[];
  canManage?: boolean;
  onOpenManageTab?: () => void;
  onOpenProfile?: (handle: string) => void;
}

export const LeagueStaffContactCard: React.FC<LeagueStaffContactCardProps> = ({
  leagueName,
  staff,
  canManage,
  onOpenManageTab,
  onOpenProfile
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (val: string, key: string) => {
    navigator.clipboard?.writeText(val).catch(() => {});
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  if (!staff || staff.length === 0) return null;

  return (
    <section className="rounded-2xl border border-slate-800 bg-[#0d111a] p-5 space-y-4 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm sm:text-base font-black font-cinzel text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>League Leadership &amp; Contact Team</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Need help with invites, roster slots, bounties, or rules in <strong className="text-slate-200">{leagueName}</strong>? Reach out to the Host Admin or League Moderators below.
          </p>
        </div>

        {canManage && onOpenManageTab && (
          <button
            type="button"
            onClick={onOpenManageTab}
            className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/50 text-amber-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Manage Staff &amp; Mods</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {staff.map((member) => {
          const isHost = member.role === 'host';
          const c = member.contact || {};
          return (
            <div
              key={member.id || member.handle}
              className={`p-3.5 rounded-xl border space-y-2.5 ${
                isHost
                  ? 'border-amber-500/40 bg-gradient-to-br from-amber-950/20 via-slate-950/90 to-slate-950'
                  : 'border-indigo-500/30 bg-slate-950/80'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => onOpenProfile?.(member.handle)}
                    className="text-sm font-black text-white hover:text-amber-300 hover:underline flex items-center gap-1.5 cursor-pointer truncate"
                  >
                    {isHost ? <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" /> : <Shield className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                    <span className="truncate">@{member.handle}</span>
                  </button>
                  <div className="text-[11px] text-slate-400 truncate mt-0.5">
                    {member.title || (isHost ? 'League Host & Admin' : 'League Moderator')}
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-black uppercase border shrink-0 ${
                    isHost
                      ? 'bg-amber-500/20 border-amber-400/50 text-amber-200'
                      : 'bg-indigo-500/20 border-indigo-400/50 text-indigo-200'
                  }`}
                >
                  {isHost ? 'Host' : 'Mod'}
                </span>
              </div>

              {/* Contact Channels: Root, Discord, Email, Profile */}
              <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-800/70">
                {c.root && (
                  c.root.startsWith('http') ? (
                    <a
                      href={c.root}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-[10px] font-mono font-bold text-emerald-200 inline-flex items-center gap-1"
                    >
                      <Globe className="w-3 h-3" />
                      <span>Root</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleCopy(c.root!, `${member.id}-root`)}
                      className="px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-[10px] font-mono font-bold text-emerald-200 inline-flex items-center gap-1 cursor-pointer"
                      title={`Copy Root contact: ${c.root}`}
                    >
                      {copiedKey === `${member.id}-root` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span className="truncate max-w-[110px]">Root: {c.root}</span>
                    </button>
                  )
                )}

                {c.discord && (
                  <button
                    type="button"
                    onClick={() => handleCopy(c.discord!, `${member.id}-discord`)}
                    className="px-2 py-1 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/40 text-[10px] font-mono font-bold text-indigo-200 inline-flex items-center gap-1 cursor-pointer"
                    title={`Copy Discord: ${c.discord}`}
                  >
                    {copiedKey === `${member.id}-discord` ? <Check className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                    <span className="truncate max-w-[110px]">{c.discord}</span>
                  </button>
                )}

                {c.email && (
                  <a
                    href={`mailto:${c.email}`}
                    className="px-2 py-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-[10px] font-mono font-bold text-sky-200 inline-flex items-center gap-1"
                    title={`Email ${c.email}`}
                  >
                    <Mail className="w-3 h-3" />
                    <span className="truncate max-w-[120px]">{c.email}</span>
                  </a>
                )}

                {!c.root && !c.discord && !c.email && onOpenProfile && (
                  <button
                    type="button"
                    onClick={() => onOpenProfile(member.handle)}
                    className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-300 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <User className="w-3 h-3" />
                    <span>View Profile</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
