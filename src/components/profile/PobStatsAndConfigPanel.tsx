import React, { useEffect, useMemo, useState } from 'react';
import { Sliders, Calculator, ShieldCheck } from 'lucide-react';
import type { CharacterGearSnapshot } from './CharacterPaperdollView';
import {
  loadSavedCalcConfig,
  saveCalcConfig,
  calculateCharacterStats,
  type BanditChoice,
  type EnemyPresetId,
  type PoeCalcConfig
} from '../../utils/poeCalcEngine';

interface PobStatsAndConfigPanelProps {
  snapshot: CharacterGearSnapshot;
}

export const PobStatsAndConfigPanel: React.FC<PobStatsAndConfigPanelProps> = ({ snapshot }) => {
  const [view, setView] = useState<'stats' | 'config' | 'calcs'>('stats');
  const [config, setConfig] = useState<PoeCalcConfig>(() => loadSavedCalcConfig(snapshot));

  // Load saved character-specific config when switching characters
  useEffect(() => {
    setConfig(loadSavedCalcConfig(snapshot));
  }, [snapshot.character.name, snapshot.syncedAtIso]);

  // Persist config changes per character so Armory, Diff, Defenses, and Offenses stay in sync
  useEffect(() => {
    saveCalcConfig(snapshot.character.name, config);
  }, [snapshot.character.name, config]);

  const calc = useMemo(() => calculateCharacterStats(snapshot, config), [snapshot, config]);

  const toggleAura = (aura: string) => {
    setConfig((prev) => ({
      ...prev,
      enabledAuras: {
        ...prev.enabledAuras,
        [aura]: !prev.enabledAuras[aura]
      }
    }));
  };

  const guardTag = config.guardActive && calc.detectedGuard ? ' (Guard)' : '';

  return (
    <div className="space-y-2.5 text-xs">
      {/* Sub-mode switcher: Stats | Config | Calcs */}
      <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[10px] font-mono">
        <button
          type="button"
          onClick={() => setView('stats')}
          className={`py-1 rounded-lg font-bold inline-flex items-center justify-center gap-1 cursor-pointer transition-colors ${
            view === 'stats' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-3 h-3" />
          <span>PoB Stats</span>
        </button>
        <button
          type="button"
          onClick={() => setView('config')}
          className={`py-1 rounded-lg font-bold inline-flex items-center justify-center gap-1 cursor-pointer transition-colors ${
            view === 'config' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sliders className="w-3 h-3" />
          <span>Config</span>
        </button>
        <button
          type="button"
          onClick={() => setView('calcs')}
          className={`py-1 rounded-lg font-bold inline-flex items-center justify-center gap-1 cursor-pointer transition-colors ${
            view === 'calcs' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Calculator className="w-3 h-3" />
          <span>Calcs</span>
        </button>
      </div>

      {/* VIEW 1: POB SIDEBAR STAT SHEET */}
      {view === 'stats' && (
        <div className="space-y-2 font-mono text-[11px]">
          {/* Main Skill & Offense Summary */}
          {calc.mainSkill && (
            <div className="p-2 rounded-xl bg-indigo-950/35 border border-indigo-500/30 space-y-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-indigo-200 font-bold truncate" title={calc.mainSkill.name}>
                  {calc.mainSkill.name}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-indigo-500/25 border border-indigo-400/40 text-indigo-100 text-[9px] font-bold shrink-0">
                  {calc.mainSkill.linkCount}L • Lv {calc.mainSkill.level}/{calc.mainSkill.quality}%
                </span>
              </div>
              {calc.offense.weaponTotalDps > 0 && (
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">Weapon DPS (p / e):</span>
                  <span className="text-amber-200 font-bold">
                    {calc.offense.weaponTotalDps} ({calc.offense.weaponPdps}/{calc.offense.weaponEdps})
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Hit Chance / Acc:</span>
                <span className={`font-bold ${calc.offense.hitChancePct >= 99 ? 'text-emerald-300' : 'text-amber-300'}`}>
                  {calc.offense.hitChancePct}% ({calc.offense.accuracy.toLocaleString()})
                </span>
              </div>
              {(calc.offense.frenzyMoreDmgPct > 0 || calc.offense.powerIncCritPct > 0 || calc.offense.precisionCritPct > 0) && (
                <div className="flex flex-wrap gap-1 pt-0.5 text-[9px]">
                  {calc.offense.frenzyMoreDmgPct > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/35 text-emerald-200">
                      +{calc.offense.frenzyMoreDmgPct}% More Dmg (Frenzy)
                    </span>
                  )}
                  {calc.offense.powerIncCritPct > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-sky-500/15 border border-sky-500/35 text-sky-200">
                      +{calc.offense.powerIncCritPct}% Crit (Power)
                    </span>
                  )}
                  {calc.offense.precisionCritPct > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/35 text-amber-200">
                      +{calc.offense.precisionCritPct}% Crit (Precision)
                    </span>
                  )}
                </div>
              )}
              {calc.detectedCurses.length > 0 && (
                <div className="text-[10px] text-purple-300 truncate">
                  Curse/Mark: <strong className="text-purple-200">{calc.detectedCurses.join(', ')}</strong>
                </div>
              )}
              {calc.mainSkill.suggestions.length > 0 && (
                <div className="pt-1 border-t border-indigo-500/20 space-y-0.5 text-[9.5px] text-amber-200/90">
                  {calc.mainSkill.suggestions.slice(0, 2).map((s, idx) => (
                    <div key={idx}>• {s}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Attributes */}
          <div className="space-y-0.5 pb-1.5 border-b border-slate-800/80">
            <div className="flex items-center justify-between">
              <span className="text-rose-400">Strength:</span>
              <span className="font-bold text-white">{calc.attributes.strength.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-emerald-400">Dexterity:</span>
              <span className="font-bold text-white">{calc.attributes.dexterity.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sky-400">Intelligence:</span>
              <span className="font-bold text-white">{calc.attributes.intelligence.toLocaleString()}</span>
            </div>
          </div>

          {/* Effective Hit Pool & 5-Type Maximum Hit Taken */}
          <div className="space-y-0.5 pb-1.5 border-b border-slate-800/80">
            <div className="flex items-center justify-between">
              <span className="text-slate-200 font-bold">Effective Hit Pool:</span>
              <span className="font-bold text-emerald-300">
                {calc.effectiveHitPool.toLocaleString()}
                <span className="text-[10px] text-slate-400">{guardTag}</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Phys Max Hit:</span>
              <span className="font-bold text-slate-200">
                {calc.maxHits.phys.toLocaleString()}
                <span className="text-[10px] text-slate-500">{guardTag}</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-orange-400">Fire Max Hit:</span>
              <span className="font-bold text-orange-200">{calc.maxHits.fire.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sky-400">Cold Max Hit:</span>
              <span className="font-bold text-sky-200">{calc.maxHits.cold.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-amber-300">Lightning Max Hit:</span>
              <span className="font-bold text-amber-200">{calc.maxHits.lightning.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-fuchsia-400">Chaos Max Hit:</span>
              <span className="font-bold text-fuchsia-200">
                {calc.maxHits.chaos === Infinity ? 'inf (Immune)' : calc.maxHits.chaos.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Pools & Defenses */}
          <div className="space-y-0.5 pb-1.5 border-b border-slate-800/80">
            <div className="flex items-center justify-between">
              <span className="text-rose-400">Total Life:</span>
              <span className="font-bold text-rose-200">{calc.life.total.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-cyan-300">Energy Shield:</span>
              <span className="font-bold text-cyan-200">{calc.energyShield.total.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-emerald-400">Evasion Rating:</span>
              <span className="font-bold text-emerald-200">
                {calc.evasion.total.toLocaleString()} <span className="text-slate-400">({calc.evasion.evadeChancePct}%)</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Armour:</span>
              <span className="font-bold text-slate-200">
                {calc.armour.total.toLocaleString()} <span className="text-slate-400">({calc.armour.physDmgReductPct}% PDR)</span>
              </span>
            </div>
            {(calc.block.attackBlock > 0 || calc.block.spellBlock > 0) && (
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Block / Spell:</span>
                <span className="font-bold text-slate-100">
                  {calc.block.attackBlock}% / {calc.block.spellBlock}%
                </span>
              </div>
            )}
            {calc.suppression.chance > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-emerald-300">Spell Suppression:</span>
                <span className="font-bold text-emerald-200">{calc.suppression.chance}%</span>
              </div>
            )}
          </div>

          {/* Resistances (In-Game Cap + Overcap) */}
          <div className="space-y-0.5 pb-1.5 border-b border-slate-800/80">
            <div className="flex items-center justify-between">
              <span className="text-orange-400">Fire Resistance:</span>
              <span className={`font-bold ${calc.resistances.fire.isCapped ? 'text-orange-200' : 'text-rose-400'}`}>
                {calc.resistances.fire.label}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sky-400">Cold Resistance:</span>
              <span className={`font-bold ${calc.resistances.cold.isCapped ? 'text-sky-200' : 'text-rose-400'}`}>
                {calc.resistances.cold.label}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-amber-300">Lightning Resistance:</span>
              <span className={`font-bold ${calc.resistances.lightning.isCapped ? 'text-amber-200' : 'text-rose-400'}`}>
                {calc.resistances.lightning.label}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-fuchsia-400">Chaos Resistance:</span>
              <span
                className={`font-bold ${
                  calc.resistances.chaos.isImmune || calc.resistances.chaos.effective >= 40
                    ? 'text-fuchsia-200'
                    : calc.resistances.chaos.effective >= 0
                    ? 'text-amber-300'
                    : 'text-rose-400'
                }`}
              >
                {calc.resistances.chaos.label}
              </span>
            </div>
          </div>

          {/* Speed + Quick Active Buff Pills */}
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Movement Speed:</span>
            <span className="font-bold text-slate-200">
              {calc.movementSpeedMod >= 0 ? `+${calc.movementSpeedMod}%` : `${calc.movementSpeedMod}%`}
            </span>
          </div>

          {/* Quick Combat Toggle Strip right below stats */}
          <div className="flex flex-wrap gap-1 pt-1">
            <button
              type="button"
              onClick={() =>
                setConfig((p) => ({
                  ...p,
                  useEnduranceCharges: !p.useEnduranceCharges,
                  enduranceCharges: !p.useEnduranceCharges ? Math.max(3, p.enduranceCharges) : 0
                }))
              }
              className={`px-1.5 py-0.5 rounded text-[9px] font-bold border cursor-pointer ${
                config.useEnduranceCharges
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-200'
                  : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
            >
              End {config.useEnduranceCharges ? `(${config.enduranceCharges})` : 'Off'}
            </button>
            <button
              type="button"
              onClick={() =>
                setConfig((p) => ({
                  ...p,
                  useFrenzyCharges: !p.useFrenzyCharges,
                  frenzyCharges: !p.useFrenzyCharges ? Math.max(3, p.frenzyCharges) : 0
                }))
              }
              className={`px-1.5 py-0.5 rounded text-[9px] font-bold border cursor-pointer ${
                config.useFrenzyCharges
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200'
                  : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
            >
              Frenzy {config.useFrenzyCharges ? `(${config.frenzyCharges})` : 'Off'}
            </button>
            <button
              type="button"
              onClick={() =>
                setConfig((p) => ({
                  ...p,
                  usePowerCharges: !p.usePowerCharges,
                  powerCharges: !p.usePowerCharges ? Math.max(3, p.powerCharges) : 0
                }))
              }
              className={`px-1.5 py-0.5 rounded text-[9px] font-bold border cursor-pointer ${
                config.usePowerCharges
                  ? 'bg-sky-500/20 border-sky-500/50 text-sky-200'
                  : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
            >
              Power {config.usePowerCharges ? `(${config.powerCharges})` : 'Off'}
            </button>
            <button
              type="button"
              onClick={() => setConfig((p) => ({ ...p, fortified: !p.fortified }))}
              className={`px-1.5 py-0.5 rounded text-[9px] font-bold border cursor-pointer ${
                config.fortified
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-200'
                  : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
            >
              Fortify
            </button>
            <button
              type="button"
              onClick={() => setConfig((p) => ({ ...p, flasksActive: !p.flasksActive }))}
              className={`px-1.5 py-0.5 rounded text-[9px] font-bold border cursor-pointer ${
                config.flasksActive
                  ? 'bg-sky-500/20 border-sky-500/50 text-sky-200'
                  : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
            >
              Flasks
            </button>
            {calc.detectedGuard && (
              <button
                type="button"
                onClick={() => setConfig((p) => ({ ...p, guardActive: !p.guardActive }))}
                className={`px-1.5 py-0.5 rounded text-[9px] font-bold border cursor-pointer ${
                  config.guardActive
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200'
                    : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                }`}
              >
                {calc.detectedGuard}
              </button>
            )}
          </div>
          {calc.detectedAuras.length > 0 && (
            <div className="text-[9.5px] text-slate-400 pt-0.5">
              Auras/Buffs: <span className="text-indigo-300">{calc.detectedAuras.filter((a) => config.enabledAuras[a]).join(', ') || 'None enabled'}</span>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: POB CONFIGURATION TOGGLES */}
      {view === 'config' && (
        <div className="space-y-2.5 text-[11px] font-mono">
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label className="block text-[9px] uppercase text-slate-500 mb-0.5">Res Penalty</label>
              <select
                value={config.resistancePenalty}
                onChange={(e) => setConfig((p) => ({ ...p, resistancePenalty: Number(e.target.value) as 0 | -30 | -60 }))}
                className="w-full px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-[11px]"
              >
                <option value={-60}>Act 10 (-60%)</option>
                <option value={-30}>Act 5 (-30%)</option>
                <option value={0}>None (0%)</option>
              </select>
            </div>
            <div>
              <label className="block text-[9px] uppercase text-slate-500 mb-0.5">Bandit Quest</label>
              <select
                value={config.bandit}
                onChange={(e) => setConfig((p) => ({ ...p, bandit: e.target.value as BanditChoice }))}
                className="w-full px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-[11px]"
              >
                <option value="kill_all">Kill All (+1 Pt)</option>
                <option value="alira">Alira (+15% All Res)</option>
                <option value="oak">Oak (+40 Life)</option>
                <option value="kraityn">Kraityn (+8% MS)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[9px] uppercase text-slate-500 mb-0.5">Enemy Hit Preset</label>
            <select
              value={config.enemyPreset}
              onChange={(e) => setConfig((p) => ({ ...p, enemyPreset: e.target.value as EnemyPresetId }))}
              className="w-full px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-[11px]"
            >
              <option value="map_84">Standard Map (Lv 84 • 2,261 Hit)</option>
              <option value="pinnacle_84">Guardian / Pinnacle Boss (Lv 84 • 4,800 Hit)</option>
              <option value="uber_85">Uber Pinnacle Boss (Lv 85 • 8,500 Hit)</option>
            </select>
          </div>

          {/* Charges & Combat Buffs */}
          <div className="p-2 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1.5">
            <div className="text-[9px] uppercase text-amber-300 font-bold">When in Combat</div>
            <div className="flex items-center justify-between gap-2">
              <label className="inline-flex items-center gap-1.5 text-rose-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.useEnduranceCharges}
                  onChange={(e) =>
                    setConfig((p) => ({
                      ...p,
                      useEnduranceCharges: e.target.checked,
                      enduranceCharges: e.target.checked ? Math.max(3, p.enduranceCharges) : 0
                    }))
                  }
                />
                <span>Endurance Charges</span>
              </label>
              <input
                type="number"
                min={0}
                max={12}
                value={config.enduranceCharges}
                onChange={(e) =>
                  setConfig((p) => ({
                    ...p,
                    enduranceCharges: Math.max(0, Math.min(12, Number(e.target.value) || 0)),
                    useEnduranceCharges: Number(e.target.value) > 0
                  }))
                }
                className="w-12 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-right text-white"
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <label className="inline-flex items-center gap-1.5 text-emerald-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.useFrenzyCharges}
                  onChange={(e) =>
                    setConfig((p) => ({
                      ...p,
                      useFrenzyCharges: e.target.checked,
                      frenzyCharges: e.target.checked ? Math.max(3, p.frenzyCharges) : 0
                    }))
                  }
                />
                <span>Frenzy Charges</span>
              </label>
              <input
                type="number"
                min={0}
                max={12}
                value={config.frenzyCharges}
                onChange={(e) =>
                  setConfig((p) => ({
                    ...p,
                    frenzyCharges: Math.max(0, Math.min(12, Number(e.target.value) || 0)),
                    useFrenzyCharges: Number(e.target.value) > 0
                  }))
                }
                className="w-12 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-right text-white"
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <label className="inline-flex items-center gap-1.5 text-sky-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.usePowerCharges}
                  onChange={(e) =>
                    setConfig((p) => ({
                      ...p,
                      usePowerCharges: e.target.checked,
                      powerCharges: e.target.checked ? Math.max(3, p.powerCharges) : 0
                    }))
                  }
                />
                <span>Power Charges</span>
              </label>
              <input
                type="number"
                min={0}
                max={12}
                value={config.powerCharges}
                onChange={(e) =>
                  setConfig((p) => ({
                    ...p,
                    powerCharges: Math.max(0, Math.min(12, Number(e.target.value) || 0)),
                    usePowerCharges: Number(e.target.value) > 0
                  }))
                }
                className="w-12 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-right text-white"
              />
            </div>

            {calc.detectedChargeSources.length > 0 && (
              <div className="text-[9.5px] text-slate-400">
                Detected Sources: <span className="text-slate-200">{calc.detectedChargeSources.join(', ')}</span>
              </div>
            )}

            <div className="flex items-center justify-between gap-2">
              <label className="inline-flex items-center gap-1.5 text-amber-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.fortified}
                  onChange={(e) => setConfig((p) => ({ ...p, fortified: e.target.checked }))}
                />
                <span>Fortified (Stacks)</span>
              </label>
              <input
                type="number"
                min={0}
                max={30}
                value={config.fortifyStacks}
                onChange={(e) =>
                  setConfig((p) => ({ ...p, fortifyStacks: Math.max(0, Math.min(30, Number(e.target.value) || 0)) }))
                }
                className="w-12 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-right text-white"
              />
            </div>

            <div className="flex flex-wrap gap-3 pt-1">
              <label className="inline-flex items-center gap-1 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.onslaught}
                  onChange={(e) => setConfig((p) => ({ ...p, onslaught: e.target.checked }))}
                />
                <span>Onslaught</span>
              </label>
              <label className="inline-flex items-center gap-1 text-sky-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.flasksActive}
                  onChange={(e) => setConfig((p) => ({ ...p, flasksActive: e.target.checked }))}
                />
                <span>Flasks Active</span>
              </label>
              {calc.detectedGuard && (
                <label className="inline-flex items-center gap-1 text-emerald-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.guardActive}
                    onChange={(e) => setConfig((p) => ({ ...p, guardActive: e.target.checked }))}
                  />
                  <span>{calc.detectedGuard}</span>
                </label>
              )}
            </div>
          </div>

          {/* Detected Socketed Aura Toggles */}
          {calc.detectedAuras.length > 0 && (
            <div className="p-2 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1.5">
              <div className="text-[9px] uppercase text-indigo-300 font-bold">
                Socketed Auras ({calc.detectedAuras.length} Detected)
              </div>
              <div className="flex flex-wrap gap-1">
                {calc.detectedAuras.map((a) => {
                  const active = Boolean(config.enabledAuras[a]);
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => toggleAura(a)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border cursor-pointer ${
                        active
                          ? 'bg-indigo-500/25 border-indigo-400/50 text-indigo-100'
                          : 'bg-slate-900 border-slate-800 text-slate-500'
                      }`}
                    >
                      {a}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: POB CALCS MATH BREAKDOWN */}
      {view === 'calcs' && (
        <div className="space-y-2 text-[10px] font-mono">
          <div className="p-2 rounded-xl bg-slate-950 border border-rose-500/25 space-y-0.5">
            <div className="text-rose-300 font-bold uppercase">Life: {calc.life.total.toLocaleString()}</div>
            <div className="flex justify-between text-slate-400">
              <span>Base (Lv {snapshot.character.level} + Str):</span>
              <span className="text-slate-200">{calc.life.baseFromLevel} + {calc.life.fromStrength}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Flat Gear / Tree:</span>
              <span className="text-slate-200">+{calc.life.fromGearAndTree}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Total % Increased:</span>
              <span className="text-emerald-300">+{calc.life.incPct}%</span>
            </div>
          </div>

          <div className="p-2 rounded-xl bg-slate-950 border border-cyan-500/25 space-y-0.5">
            <div className="text-cyan-300 font-bold uppercase">Energy Shield: {calc.energyShield.total.toLocaleString()}</div>
            <div className="flex justify-between text-slate-400">
              <span>Base Armours + Discipline:</span>
              <span className="text-slate-200">{calc.energyShield.baseFromArmours} + {calc.energyShield.fromDiscipline}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>% Inc (Tree + Int):</span>
              <span className="text-cyan-200">+{calc.energyShield.incFromTreeAndGear}% + {calc.energyShield.incFromInt}%</span>
            </div>
          </div>

          <div className="p-2 rounded-xl bg-slate-950 border border-slate-700 space-y-0.5">
            <div className="text-slate-200 font-bold uppercase">Armour: {calc.armour.total.toLocaleString()} ({calc.armour.physDmgReductPct}% PDR)</div>
            <div className="flex justify-between text-slate-400">
              <span>Base + Determ + Flask:</span>
              <span className="text-slate-200">{calc.armour.baseFromArmours} + {calc.armour.fromDetermination} + {calc.armour.fromFlasks}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>% Inc / % More:</span>
              <span className="text-slate-200">+{calc.armour.incPct}% / +{calc.armour.morePct}%</span>
            </div>
          </div>

          <div className="p-2 rounded-xl bg-slate-950 border border-emerald-500/25 space-y-0.5">
            <div className="text-emerald-300 font-bold uppercase">Evasion: {calc.evasion.total.toLocaleString()} ({calc.evasion.evadeChancePct}% Evade)</div>
            <div className="flex justify-between text-slate-400">
              <span>Base + Grace + Flask:</span>
              <span className="text-slate-200">{calc.evasion.baseFromArmours} + {calc.evasion.fromGrace} + {calc.evasion.fromFlasks}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>% Inc (Tree+Dex) / More:</span>
              <span className="text-emerald-200">+{calc.evasion.incFromTreeAndGear + calc.evasion.incFromDex}% / +{calc.evasion.morePct}%</span>
            </div>
          </div>

          <div className="p-2 rounded-xl bg-slate-950 border border-indigo-500/25 space-y-0.5">
            <div className="text-indigo-300 font-bold uppercase">Mitigation Layers</div>
            <div className="flex justify-between text-slate-400">
              <span>Phys Shift / Flat PDR:</span>
              <span className="text-slate-200">{calc.mitigation.physTakenAsEle}% / +{calc.mitigation.flatPdr}%</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Endurance (PDR / Ele):</span>
              <span className="text-rose-200">+{calc.mitigation.endurancePdr}% / +{calc.mitigation.enduranceEleDr}%</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Fortify / Guard Shield:</span>
              <span className="text-amber-200">{calc.mitigation.fortifyDr}% / {calc.mitigation.guardAbsorb.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
