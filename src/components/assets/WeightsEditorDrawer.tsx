import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { CATEGORY_ORDER, DEFAULT_SSF_WEIGHTS, type SsfWeightsConfig } from './assetEngine';

interface WeightsEditorDrawerProps {
  ssfWeights: SsfWeightsConfig;
  setSsfWeights: React.Dispatch<React.SetStateAction<SsfWeightsConfig>>;
  onClose: () => void;
}

export const WeightsEditorDrawer: React.FC<WeightsEditorDrawerProps> = ({
  ssfWeights,
  setSsfWeights,
  onClose
}) => {
  const [newOverrideName, setNewOverrideName] = useState<string>('');
  const [newOverrideVal, setNewOverrideVal] = useState<string>('1.0');

  return (
    <section className="rounded-2xl border border-amber-500/35 bg-[#0d111a] p-4 sm:p-5 space-y-4 shadow-xl text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <div className="text-[10px] font-mono uppercase text-amber-400 font-bold">
            Transparent SSF Value Formula (1.0x = Live poe.ninja Chaos Price)
          </div>
          <h2 className="text-sm font-bold text-white">
            Customize SSF Category Multipliers & Item Overrides
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSsfWeights(DEFAULT_SSF_WEIGHTS)}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold cursor-pointer"
          >
            Reset Defaults
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white font-mono cursor-pointer"
          >
            Close ▲
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 space-y-2.5">
          <div className="text-[10px] font-mono uppercase text-slate-400 font-bold">
            Category Multipliers (Applied to poe.ninja Chaos Price)
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {CATEGORY_ORDER.map((cat) => (
              <label key={cat} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1 block">
                <span className="text-[10px] text-slate-300 font-semibold block truncate">{cat}</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={5}
                    step={0.05}
                    value={ssfWeights.categoryMultipliers[cat] ?? 1.0}
                    onChange={(e) => {
                      const v = Math.max(0, Math.min(5, Number(e.target.value) || 0));
                      setSsfWeights((prev) => ({
                        ...prev,
                        categoryMultipliers: { ...prev.categoryMultipliers, [cat]: v }
                      }));
                    }}
                    className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-amber-300 font-mono font-bold"
                  />
                  <span className="text-[10px] font-mono text-slate-500">x</span>
                </div>
              </label>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <label className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1 block">
              <span className="text-[10px] text-emerald-300 font-semibold block">Wishlist Match Bonus</span>
              <input
                type="number"
                min={0}
                step={10}
                value={ssfWeights.wishlistBonus}
                onChange={(e) =>
                  setSsfWeights((prev) => ({ ...prev, wishlistBonus: Math.max(0, Number(e.target.value) || 0) }))
                }
                className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-emerald-300 font-mono font-bold"
              />
            </label>
            <label className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1 block">
              <span className="text-[10px] text-orange-300 font-semibold block">Unpriced Unique Floor</span>
              <input
                type="number"
                min={0}
                step={0.5}
                value={ssfWeights.unpricedUniqueFloor}
                onChange={(e) =>
                  setSsfWeights((prev) => ({ ...prev, unpricedUniqueFloor: Math.max(0, Number(e.target.value) || 0) }))
                }
                className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-orange-300 font-mono font-bold"
              />
            </label>
            <label className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1 block">
              <span className="text-[10px] text-sky-300 font-semibold block">Unpriced Map Floor</span>
              <input
                type="number"
                min={0}
                step={0.5}
                value={ssfWeights.unpricedMapFloor}
                onChange={(e) =>
                  setSsfWeights((prev) => ({ ...prev, unpricedMapFloor: Math.max(0, Number(e.target.value) || 0) }))
                }
                className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-sky-300 font-mono font-bold"
              />
            </label>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-2.5">
          <div className="text-[10px] font-mono uppercase text-slate-400 font-bold">
            Exact Item Price Overrides (pts per 1 item)
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const clean = newOverrideName.trim().toLowerCase();
              const num = Number(newOverrideVal);
              if (!clean || Number.isNaN(num) || num < 0) return;
              setSsfWeights((prev) => ({
                ...prev,
                customOverrides: { ...prev.customOverrides, [clean]: num }
              }));
              setNewOverrideName('');
              setNewOverrideVal('1.0');
            }}
            className="flex gap-1.5"
          >
            <input
              type="text"
              value={newOverrideName}
              onChange={(e) => setNewOverrideName(e.target.value)}
              placeholder="Exact item name (e.g. Rogue's Marker)"
              className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white"
            />
            <input
              type="number"
              step="any"
              min={0}
              value={newOverrideVal}
              onChange={(e) => setNewOverrideVal(e.target.value)}
              className="w-20 px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-amber-300 font-mono"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer"
            >
              Set
            </button>
          </form>

          <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
            {Object.entries(ssfWeights.customOverrides).map(([k, v]) => (
              <div key={k} className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
                <span className="text-slate-200 capitalize truncate">{k}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono font-bold text-amber-300">{v} pts</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSsfWeights((prev) => {
                        const copy = { ...prev.customOverrides };
                        delete copy[k];
                        return { ...prev, customOverrides: copy };
                      });
                    }}
                    className="text-slate-500 hover:text-rose-400 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
