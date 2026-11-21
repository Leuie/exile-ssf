import React, { useState, useEffect } from 'react';
import { ShieldAlert, Copy, Check, Save } from 'lucide-react';

interface MapRegexBuilderProps {
  savedBricks: string[];
  canEdit: boolean;
  onSaveBricks: (bricks: string[]) => Promise<void>;
}

export const MAP_BRICK_MODS: { id: string; label: string; token: string; category: string }[] = [
  { id: 'ele_reflect', label: 'Elemental Reflect', token: 'tal d', category: 'Reflect' },
  { id: 'phys_reflect', label: 'Physical Reflect', token: 'f ph', category: 'Reflect' },
  { id: 'no_regen', label: 'Cannot Regenerate Life/Mana', token: 'gen', category: 'Sustain' },
  { id: 'no_leech', label: 'Cannot Leech', token: 'eec', category: 'Sustain' },
  { id: 'less_recovery', label: 'Less Recovery Rate', token: 'reco', category: 'Sustain' },
  { id: 'minus_max_res', label: 'Minus Max Resistances', token: 'ax r', category: 'Damage' },
  { id: 'reduced_aura', label: 'Reduced Aura Effect', token: 'non-c', category: 'Defense' },
  { id: 'avoid_ailments', label: 'Monsters Avoid Ailments', token: 'ailm', category: 'Offense' },
  { id: 'less_cdr', label: 'Less Cooldown Recovery', token: 'cool', category: 'Offense' },
  { id: 'crit_multi', label: 'Monsters Extra Crit Chance & Multi', token: 'tip', category: 'Damage' },
  { id: 'no_expose', label: 'Reduced Block & Armour', token: 'bloc', category: 'Defense' },
  { id: 'less_aoe', label: 'Less Area of Effect', token: 'of ef', category: 'Offense' }
];

export const MapRegexBuilder: React.FC<MapRegexBuilderProps> = ({
  savedBricks,
  canEdit,
  onSaveBricks
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(savedBricks);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelectedIds(savedBricks);
  }, [savedBricks]);

  const toggleMod = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const activeTokens = MAP_BRICK_MODS.filter((m) => selectedIds.includes(m.id)).map((m) => m.token);
  const regexString = activeTokens.length > 0 ? `"!${activeTokens.join('|')}"` : '';

  const handleCopy = () => {
    if (!regexString) return;
    navigator.clipboard.writeText(regexString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    setSaving(true);
    await onSaveBricks(selectedIds);
    setSaving(false);
  };

  return (
    <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/70 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-rose-300">
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <span>1 Click Safe Map Regex Generator</span>
        </div>
        {canEdit && (
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3 h-3" />
            <span>{saving ? 'Saving...' : 'Save to Profile'}</span>
          </button>
        )}
      </div>

      <p className="text-[11px] text-slate-400">
        Check the map mods that brick your build. Paste the generated regex straight into your PoE stash search bar to highlight safe T16 and T17 maps.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
        {MAP_BRICK_MODS.map((mod) => {
          const active = selectedIds.includes(mod.id);
          return (
            <button
              key={mod.id}
              type="button"
              onClick={() => toggleMod(mod.id)}
              className={`text-left px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-colors cursor-pointer ${
                active
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-200'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              {mod.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 pt-1">
        <div className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 font-mono text-xs text-emerald-300 truncate">
          {regexString || 'Select brick mods above to build your PoE stash regex...'}
        </div>
        <button
          type="button"
          disabled={!regexString}
          onClick={handleCopy}
          className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied!' : 'Copy Regex'}</span>
        </button>
      </div>
    </div>
  );
};
