import React from 'react';
import { Sparkles, AlertTriangle, CheckCircle2, Layers } from 'lucide-react';
import {
  CANONICAL_TAB_SLOTS,
  type CanonicalTabMapping,
  type StashTabMeta
} from './assetEngine';

interface CanonicalTabMapperProps {
  stashTabs: StashTabMeta[];
  mapping: CanonicalTabMapping;
  onChangeMapping: (next: CanonicalTabMapping) => void;
  onAutoMatch: () => void;
}

export const CanonicalTabMapper: React.FC<CanonicalTabMapperProps> = ({
  stashTabs,
  mapping,
  onChangeMapping,
  onAutoMatch
}) => {
  const mappedCount = Object.values(mapping).filter((v) => typeof v === 'number' && v >= 0).length;
  const specialtySlots = CANONICAL_TAB_SLOTS.filter((s) => s.group === 'Specialty');
  const quadSlots = CANONICAL_TAB_SLOTS.filter((s) => s.group === 'Quad & Dump');

  const handleSelect = (slotId: string, rawVal: string) => {
    const nextIdx = rawVal === '' ? null : Number(rawVal);
    onChangeMapping({ ...mapping, [slotId]: Number.isFinite(nextIdx) ? nextIdx : null });
  };

  return (
    <div className="space-y-3 pt-1">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-mono uppercase text-slate-300 font-bold">
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          <span>18 Slot Canonical Tab Baseline ({mappedCount}/18 Mapped)</span>
        </div>
        <button
          type="button"
          onClick={onAutoMatch}
          className="px-2.5 py-1 rounded-lg bg-indigo-600/25 hover:bg-indigo-600/35 border border-indigo-400/50 text-indigo-200 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
        >
          <Sparkles className="w-3 h-3 text-amber-300" />
          <span>Auto Match My Tabs</span>
        </button>
      </div>

      {/* Clear Maps & Uniques API Limitation Callout */}
      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-100/90 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-amber-300">Note on Maps & Uniques Tabs:</strong> Grinding Gear Games' legacy web stash API returns 0 items for <strong>Map Stash Tabs</strong> and <strong>Unique Collection Tabs</strong> while OAuth registrations are paused. Place tracked uniques, maps, and levelling gear in your <strong>Levelling Items (Quad Tab)</strong> or <strong>Dump 1 to 5</strong> tabs. Leave any tab you do not own set to <em>Not Owned / Omit</em> to hide it from charts.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Specialty Tabs (12) */}
        <div className="p-3 rounded-xl bg-slate-950/75 border border-slate-800 space-y-2">
          <div className="text-[10px] font-mono uppercase text-sky-400 font-bold">Specialty Tabs (12)</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {specialtySlots.map((slot) => {
              const current = mapping[slot.id];
              const isMapped = typeof current === 'number';
              return (
                <div key={slot.id} className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                    <span>{slot.label}</span>
                    {isMapped && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                  </label>
                  <select
                    value={isMapped ? String(current) : ''}
                    onChange={(e) => handleSelect(slot.id, e.target.value)}
                    className={`px-2 py-1.5 rounded-lg text-[11px] border focus:outline-none cursor-pointer ${
                      isMapped
                        ? 'bg-indigo-950/50 border-indigo-500/50 text-white font-semibold'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <option value="" className="bg-slate-950 text-slate-400">Not Owned / Omit</option>
                    {stashTabs.map((t) => {
                      const apiEmpty = t.type === 'UniqueStash' || t.type === 'MapStash';
                      return (
                        <option key={t.id} value={t.index} disabled={apiEmpty} className="bg-slate-950 text-slate-100">
                          {t.name} {apiEmpty ? '(GGG API Empty)' : `(${t.type.replace('Stash', '')})`}
                        </option>
                      );
                    })}
                  </select>
                </div>
              );
            })}
          </div>
        </div>

        {/* Levelling & 5 Dump Quad Tabs (6) */}
        <div className="p-3 rounded-xl bg-slate-950/75 border border-slate-800 space-y-2">
          <div className="text-[10px] font-mono uppercase text-amber-400 font-bold">Levelling & Dump Quad Tabs (6)</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {quadSlots.map((slot) => {
              const current = mapping[slot.id];
              const isMapped = typeof current === 'number';
              return (
                <div key={slot.id} className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                    <span>{slot.label}</span>
                    {isMapped && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                  </label>
                  <select
                    value={isMapped ? String(current) : ''}
                    onChange={(e) => handleSelect(slot.id, e.target.value)}
                    className={`px-2 py-1.5 rounded-lg text-[11px] border focus:outline-none cursor-pointer ${
                      isMapped
                        ? 'bg-amber-950/40 border-amber-500/50 text-amber-100 font-semibold'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <option value="" className="bg-slate-950 text-slate-400">Not Owned / Omit</option>
                    {stashTabs.map((t) => {
                      const apiEmpty = t.type === 'UniqueStash' || t.type === 'MapStash';
                      return (
                        <option key={t.id} value={t.index} disabled={apiEmpty} className="bg-slate-950 text-slate-100">
                          {t.name} {apiEmpty ? '(GGG API Empty)' : `(${t.type.replace('Stash', '')})`}
                        </option>
                      );
                    })}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
