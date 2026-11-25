import React, { useEffect, useState } from 'react';
import { Radio, Compass, Skull, Home } from 'lucide-react';

export interface SquadPresenceEntry {
  handle: string;
  characterName?: string;
  zone: string;
  zoneKind: string;
  updatedAtMs: number;
}

interface SquadPresenceBarProps {
  leagueId: string;
  onOpenProfile?: (handle: string) => void;
}

export const SquadPresenceBar: React.FC<SquadPresenceBarProps> = ({ leagueId, onOpenProfile }) => {
  const [entries, setEntries] = useState<SquadPresenceEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetch(`/api/league/presence?league=${encodeURIComponent(leagueId)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d: any) => {
          if (!cancelled && Array.isArray(d?.entries)) {
            setEntries(d.entries);
          }
        })
        .catch(() => {});
    };
    load();
    const timer = window.setInterval(load, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [leagueId]);

  if (entries.length === 0) return null;

  return (
    <div className="px-3 sm:px-6 py-2 border-t border-emerald-500/20 bg-emerald-950/15 flex flex-wrap items-center gap-2 text-xs">
      <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-300 shrink-0">
        <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
        <span>Mapping Now ({entries.length}):</span>
      </span>
      <div className="flex flex-wrap items-center gap-1.5">
        {entries.map((e) => {
          const isHideout = e.zoneKind === 'Hideout / Town';
          const isBoss = e.zoneKind === 'Boss / Special';
          const isDelve = e.zoneKind === 'Delve';
          return (
            <button
              key={e.handle}
              type="button"
              onClick={() => onOpenProfile?.(e.handle)}
              className="px-2 py-0.5 rounded-full bg-slate-950/90 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/50 inline-flex items-center gap-1.5 text-[11px] cursor-pointer transition-colors"
              title={`${e.characterName || e.handle} in ${e.zone} (${e.zoneKind})`}
            >
              {isHideout ? (
                <Home className="w-3 h-3 text-slate-400" />
              ) : isBoss ? (
                <Skull className="w-3 h-3 text-rose-400" />
              ) : (
                <Compass className={`w-3 h-3 ${isDelve ? 'text-cyan-400' : 'text-emerald-400'}`} />
              )}
              <span className="font-bold text-white">@{e.handle}</span>
              <span className="text-slate-400 font-mono text-[10px] truncate max-w-[140px]">
                {e.zone}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
