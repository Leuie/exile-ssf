import React, { useState } from 'react';
import { Sparkles, Skull, Handshake, ShieldAlert, CheckCircle2, WifiOff } from 'lucide-react';
import type { ClientTxtTelemetry } from '../../utils/clientTxtTelemetry';

interface ClientTelemetrySuiteProps {
  telemetry: ClientTxtTelemetry;
  totalMaps: number;
}

export const ClientTelemetrySuite: React.FC<ClientTelemetrySuiteProps> = ({
  telemetry,
  totalMaps
}) => {
  const [tab, setTab] = useState<'mechanics' | 'deaths' | 'trades' | 'passives'>('mechanics');

  return (
    <div className="space-y-3">
      {/* Nameless Seer Banner */}
      {telemetry.namelessSeerCount > 0 && (
        <div className="p-3 rounded-xl border border-amber-400/50 bg-amber-500/15 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-amber-200 font-bold">
            <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
            <span>
              Nameless Seer Detected ({telemetry.namelessSeerCount}x in log — last seen {telemetry.lastNamelessSeerAt})!
            </span>
          </div>
          <span className="text-[10px] font-mono text-amber-300">Do not portal out before talking to him!</span>
        </div>
      )}

      {/* Sub-tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5 text-xs font-mono">
          {[
            { id: 'mechanics' as const, label: `Mechanics (${telemetry.mechanics.length})` },
            { id: 'deaths' as const, label: `Death Log (${telemetry.deaths.length})` },
            { id: 'trades' as const, label: `Trade Ledger (${telemetry.trades.length})` },
            { id: 'passives' as const, label: `/passives & Stability` }
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-2.5 py-1.5 rounded-lg border font-bold cursor-pointer transition-colors ${
                tab === t.id
                  ? 'bg-indigo-600/30 border-indigo-400/60 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {(telemetry.disconnects > 0 || telemetry.instanceFailures > 0) && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/35 text-[11px] font-mono text-rose-300">
            <WifiOff className="w-3.5 h-3.5" />
            <span>
              {telemetry.disconnects} DCs • {telemetry.instanceFailures} Instance Fails
            </span>
          </div>
        )}
      </div>

      {tab === 'mechanics' && (
        telemetry.mechanics.length === 0 ? (
          <div className="text-xs text-slate-400 py-3">
            No NPC mechanic encounters detected yet in this Client.txt window. Run maps with Harvest, Expedition, Betrayal, Blight, or Nameless Seer to populate spawn rates.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {telemetry.mechanics.map((m) => {
              const rate = totalMaps > 0 ? Math.min(100, Math.round((m.count / totalMaps) * 100)) : 0;
              return (
                <div
                  key={m.id}
                  className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-100 truncate">{m.label}</div>
                    <div className="text-[10px] font-mono text-slate-500">Last: {m.lastSeenAt}</div>
                  </div>
                  <div className="text-right shrink-0 font-mono">
                    <div className="text-sm font-black text-cyan-300">{m.count}x</div>
                    {totalMaps > 0 && <div className="text-[10px] text-slate-400">{rate}%/map</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {tab === 'deaths' && (
        telemetry.deaths.length === 0 ? (
          <div className="text-xs text-emerald-300 py-3 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>Zero deaths recorded in this Client.txt session window!</span>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
            {telemetry.deaths.map((d, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-rose-950/20 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Skull className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span className="font-bold text-rose-200">{d.character}</span>
                  <span className="text-slate-400 truncate">
                    in <strong className="text-white">{d.areaName}</strong>
                    {d.areaLevel ? ` (Lv ${d.areaLevel})` : ''}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 shrink-0">{d.timestamp}</span>
                <div className="w-full sm:w-auto text-[11px] text-amber-200/80 truncate">{d.recentContext}</div>
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'trades' && (
        telemetry.trades.length === 0 ? (
          <div className="text-xs text-slate-400 py-3">
            No completed trades found in this Client.txt window.
          </div>
        ) : (
          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
            {telemetry.trades.map((tr, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Handshake className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="font-bold text-emerald-200 shrink-0">{tr.player}</span>
                  <span className="text-slate-400 truncate">{tr.whisperSnippet}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 shrink-0">{tr.timestamp}</span>
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'passives' && (
        <div className="space-y-2.5 text-xs">
          {telemetry.passivesAudit ? (
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-white">
                  Quest Passive Points Detected:{' '}
                  <span className="text-emerald-300 font-mono">{telemetry.passivesAudit.totalQuestPoints}</span>
                </span>
                {telemetry.passivesAudit.playedText && (
                  <span className="text-[11px] font-mono text-sky-300">
                    /played: {telemetry.passivesAudit.playedText}
                  </span>
                )}
              </div>
              {telemetry.passivesAudit.missingQuests.length > 0 ? (
                <div className="space-y-1">
                  <div className="text-amber-300 font-bold flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Missing Quest Skill Points ({telemetry.passivesAudit.missingQuests.length}):</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {telemetry.passivesAudit.missingQuests.map((q) => (
                      <span
                        key={q}
                        className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/35 text-amber-200 font-mono text-[11px]"
                      >
                        {q}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-emerald-300 text-[11px]">
                  No missing passive quests reported in your last /passives check.
                </div>
              )}
            </div>
          ) : (
            <div className="text-slate-400 py-2">
              Type <code className="px-1.5 py-0.5 rounded bg-slate-900 text-amber-300">/passives</code> or{' '}
              <code className="px-1.5 py-0.5 rounded bg-slate-900 text-sky-300">/played</code> in-game while watching{' '}
              <code>Client.txt</code> to automatically audit missing campaign skill points.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
