import React, { useMemo } from 'react';
import { Gem, Sparkles, Flame, CheckCircle2 } from 'lucide-react';
import type { PaperdollItem, PaperdollGem } from './CharacterPaperdollView';

interface GemAuditFinding {
  gem: PaperdollGem;
  slot: string;
  action: 'gcp_recipe' | 'vaal_corrupt' | 'level_push' | 'awakened_push';
  title: string;
  detail: string;
  badgeClass: string;
}

interface GemAuditPanelProps {
  equipped: PaperdollItem[];
}

const EXCEPTIONAL_RE = /\b(enlighten|empower|enhance)\b/i;

export const GemAuditPanel: React.FC<GemAuditPanelProps> = ({ equipped }) => {
  const findings = useMemo(() => {
    const list: GemAuditFinding[] = [];
    for (const item of equipped) {
      if (!Array.isArray(item.socketedGems)) continue;
      for (const gem of item.socketedGems) {
        const name = gem.name || '';
        const isAwakened = /^awakened\b/i.test(name);
        const isExceptional = EXCEPTIONAL_RE.test(name);
        const lvl = Number(gem.level || 1);
        const qual = Number(gem.quality || 0);
        const corrupted = Boolean((gem as any).corrupted);

        if (isExceptional) {
          if (lvl < 3) {
            list.push({
              gem,
              slot: item.inventoryId,
              action: 'level_push',
              title: 'Level to 3',
              detail: `Currently Lv ${lvl} (${qual}% qual). Socket in weapon swap or offhand to hit Lv 3${!corrupted ? ' before Vaal attempt for Lv 4.' : '.'}`,
              badgeClass: 'bg-sky-500/15 border-sky-500/40 text-sky-300'
            });
          } else if (lvl === 3 && !corrupted) {
            list.push({
              gem,
              slot: item.inventoryId,
              action: 'vaal_corrupt',
              title: 'Ready for Vaal → Lv 4',
              detail: 'Max uncorrupted level (Lv 3). Ready for Vaal Orb or Temple Double Corrupt for +1 Level.',
              badgeClass: 'bg-rose-500/15 border-rose-500/40 text-rose-300'
            });
          }
          continue;
        }

        if (isAwakened) {
          if (lvl < 5) {
            list.push({
              gem,
              slot: item.inventoryId,
              action: 'awakened_push',
              title: `Push Awakened Lv ${lvl} → 5`,
              detail: 'Awakened supports unlock major bonus scaling at Lv 5.',
              badgeClass: 'bg-amber-500/15 border-amber-500/40 text-amber-200'
            });
          } else if (lvl === 5 && qual >= 20 && !corrupted) {
            list.push({
              gem,
              slot: item.inventoryId,
              action: 'vaal_corrupt',
              title: 'Ready for Vaal → Lv 6',
              detail: 'Lv 5 / 20% Awakened gem is eligible for Vaal / Temple corruption to Lv 6.',
              badgeClass: 'bg-rose-500/15 border-rose-500/40 text-rose-300'
            });
          }
          continue;
        }

        // Standard Active & Support Gems
        if (lvl >= 20 && qual < 20 && !corrupted) {
          list.push({
            gem,
            slot: item.inventoryId,
            action: 'gcp_recipe',
            title: 'GCP Vendor Recipe (Lv 20 + 1 GCP → 1/20)',
            detail: `Lv ${lvl} with ${qual}% quality. Vendor with 1 Gemcutter's Prism to flip to Lv 1 / 20% Quality (or use GCPs if Active Skill).`,
            badgeClass: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
          });
        } else if (lvl === 20 && qual >= 20 && !corrupted) {
          list.push({
            gem,
            slot: item.inventoryId,
            action: 'vaal_corrupt',
            title: 'Ready for Vaal / Double Corrupt (21/20)',
            detail: 'Maxed 20/20 uncorrupted gem. Safe to Vaal Orb or run Doryani\'s Institute for 21/20 or 21/23.',
            badgeClass: 'bg-rose-500/15 border-rose-500/40 text-rose-300'
          });
        } else if (lvl === 19 && qual < 20 && !corrupted) {
          list.push({
            gem,
            slot: item.inventoryId,
            action: 'level_push',
            title: 'Almost Lv 20 (Prep GCP Flip)',
            detail: `Lv 19 / ${qual}% qual — 1 level away from GCP 20% quality recipe.`,
            badgeClass: 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300'
          });
        }
      }
    }

    const order: Record<GemAuditFinding['action'], number> = {
      gcp_recipe: 0,
      vaal_corrupt: 1,
      awakened_push: 2,
      level_push: 3
    };
    return list.sort((a, b) => order[a.action] - order[b.action]);
  }, [equipped]);

  const gcpCount = findings.filter((f) => f.action === 'gcp_recipe').length;
  const vaalCount = findings.filter((f) => f.action === 'vaal_corrupt').length;

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0b101b] overflow-hidden shadow-lg">
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/70 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Gem className="w-4 h-4 text-emerald-400" />
          <span className="text-xs sm:text-sm font-bold text-slate-100">
            Gem Level &amp; Quality Audit
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-emerald-300 border border-slate-700">
            {findings.length} Actionable
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono">
          {gcpCount > 0 && (
            <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/35 text-emerald-300">
              {gcpCount} GCP Recipe
            </span>
          )}
          {vaalCount > 0 && (
            <span className="px-2 py-0.5 rounded bg-rose-500/15 border border-rose-500/35 text-rose-300">
              {vaalCount} Ready to Vaal
            </span>
          )}
        </div>
      </div>

      <div className="p-4">
        {findings.length === 0 ? (
          <div className="flex items-center gap-2 text-xs text-emerald-300 py-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>All socketed gems are either still leveling or already maxed/corrupted!</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[260px] overflow-y-auto pr-1">
            {findings.map((f, idx) => (
              <div
                key={`${f.slot}-${f.gem.name}-${idx}`}
                className="p-2.5 rounded-xl bg-slate-950/85 border border-slate-800 flex items-start justify-between gap-2.5"
              >
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-white truncate">{f.gem.name}</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Lv {f.gem.level}/{f.gem.quality}%
                    </span>
                    <span className="text-[9px] font-mono text-slate-500 uppercase">({f.slot})</span>
                  </div>
                  <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-mono font-bold ${f.badgeClass}`}>
                    {f.action === 'vaal_corrupt' ? <Flame className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                    <span>{f.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">{f.detail}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
