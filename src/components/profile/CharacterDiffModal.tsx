import React, { useState, useMemo } from 'react';
import { X, GitCompare, Search, Shield, Sparkles, Loader2, FileCode2, Users } from 'lucide-react';
import { fetchUserToolState, resolvePobUrl } from '../../services/cloudSync';
import { decodePoBCode, parsePoBXml } from '../../utils/pobDecoder';
import type { ParsedCharacter } from '../../types/analyzer';
import type { CharacterGearSnapshot } from './CharacterPaperdollView';
import { OfficialPassiveTreeCanvas } from './OfficialPassiveTreeCanvas';
import { formatPobRes } from '../../utils/resFormatter';
import { buildDefaultCalcConfig, calculateCharacterStats } from '../../utils/poeCalcEngine';

interface CharacterDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  primarySnapshot: CharacterGearSnapshot;
  localSnapshots: Record<string, CharacterGearSnapshot>;
}

const COMPARE_SLOTS: Array<{ id: string; label: string; pobSlot: string }> = [
  { id: 'Weapon', label: 'Weapon 1', pobSlot: 'Weapon 1' },
  { id: 'Offhand', label: 'Weapon 2', pobSlot: 'Weapon 2' },
  { id: 'Helm', label: 'Helmet', pobSlot: 'Helmet' },
  { id: 'BodyArmour', label: 'Body Armour', pobSlot: 'Body Armour' },
  { id: 'Gloves', label: 'Gloves', pobSlot: 'Gloves' },
  { id: 'Boots', label: 'Boots', pobSlot: 'Boots' },
  { id: 'Amulet', label: 'Amulet', pobSlot: 'Amulet' },
  { id: 'Ring', label: 'Ring 1', pobSlot: 'Ring 1' },
  { id: 'Ring2', label: 'Ring 2', pobSlot: 'Ring 2' },
  { id: 'Belt', label: 'Belt', pobSlot: 'Belt' }
];

function isPobShareUrl(input: string): boolean {
  return /^(?:https?:\/\/)?(?:www\.)?(?:pobb\.in\/[a-zA-Z0-9_-]{4,64}|pastebin\.com\/(?:raw\/)?[a-zA-Z0-9]{4,32})/i.test(
    input.trim()
  );
}

function fmtNum(n: number, suffix = ''): string {
  if (!Number.isFinite(n)) return '—';
  return `${Math.round(n).toLocaleString()}${suffix}`;
}

export const CharacterDiffModal: React.FC<CharacterDiffModalProps> = ({
  isOpen,
  onClose,
  primarySnapshot,
  localSnapshots
}) => {
  // Primary mode = Path of Building target build; secondary = Squadmate / Alt
  const [compareMode, setCompareMode] = useState<'pob' | 'character'>('pob');
  const [pobInput, setPobInput] = useState<string>('');
  const [loadingPob, setLoadingPob] = useState<boolean>(false);
  const [pobError, setPobError] = useState<string | null>(null);
  const [targetPob, setTargetPob] = useState<ParsedCharacter | null>(null);

  const [otherHandle, setOtherHandle] = useState<string>('');
  const [loadingOther, setLoadingOther] = useState<boolean>(false);
  const [otherError, setOtherError] = useState<string | null>(null);
  const [otherSnapshots, setOtherSnapshots] = useState<Record<string, CharacterGearSnapshot>>({});
  const [selectedCompareKey, setSelectedCompareKey] = useState<string>(() => {
    const alt = Object.keys(localSnapshots).find(
      (k) => k.toLowerCase() !== primarySnapshot.character.name.toLowerCase()
    );
    return alt || '';
  });

  const combinedCandidates = useMemo(() => {
    const map: Record<string, { label: string; snap: CharacterGearSnapshot }> = {};
    for (const [k, snap] of Object.entries(localSnapshots)) {
      if (!snap?.character?.name) continue;
      if (snap.character.name.toLowerCase() === primarySnapshot.character.name.toLowerCase()) continue;
      map[`local:${k}`] = { label: `${snap.character.name} (Lv ${snap.character.level} ${snap.character.className})`, snap };
    }
    for (const [k, snap] of Object.entries(otherSnapshots)) {
      if (!snap?.character?.name) continue;
      map[`remote:${k}`] = {
        label: `@${otherHandle.replace(/^@/, '')} • ${snap.character.name} (Lv ${snap.character.level} ${snap.character.className})`,
        snap
      };
    }
    return map;
  }, [localSnapshots, otherSnapshots, primarySnapshot.character.name, otherHandle]);

  const compareSnapshot: CharacterGearSnapshot | null = useMemo(() => {
    if (selectedCompareKey && combinedCandidates[selectedCompareKey]) {
      return combinedCandidates[selectedCompareKey].snap;
    }
    const firstKey = Object.keys(combinedCandidates)[0];
    return firstKey ? combinedCandidates[firstKey].snap : null;
  }, [selectedCompareKey, combinedCandidates]);

  const primaryCalc = useMemo(
    () => calculateCharacterStats(primarySnapshot, buildDefaultCalcConfig(primarySnapshot)),
    [primarySnapshot]
  );
  const compareCalc = useMemo(
    () => (compareSnapshot ? calculateCharacterStats(compareSnapshot, buildDefaultCalcConfig(compareSnapshot)) : null),
    [compareSnapshot]
  );

  if (!isOpen) return null;

  const handleLoadTargetPob = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = pobInput.trim();
    if (!trimmed) return;
    setLoadingPob(true);
    setPobError(null);
    try {
      let rawCode = trimmed;
      if (isPobShareUrl(trimmed)) {
        const res = await resolvePobUrl(trimmed);
        if (res.status !== 'ok' || !res.code) {
          setPobError(res.error || 'Could not resolve that pobb.in or pastebin URL.');
          return;
        }
        rawCode = res.code;
      }
      const xml = decodePoBCode(rawCode);
      const parsed = parsePoBXml(xml);
      setTargetPob(parsed);
    } catch (err: any) {
      setPobError(err?.message || 'Invalid Path of Building export string or URL.');
    } finally {
      setLoadingPob(false);
    }
  };

  const handleLoadSquadmate = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = otherHandle.replace(/^@/, '').trim();
    if (!clean) return;
    setLoadingOther(true);
    setOtherError(null);
    try {
      const saved = await fetchUserToolState<Record<string, any>>(clean, 'character_gear_snapshots');
      if (!saved || typeof saved !== 'object') {
        setOtherError(`No synced Armory characters found for @${clean}.`);
        setOtherSnapshots({});
      } else {
        const next: Record<string, CharacterGearSnapshot> = {};
        for (const [k, v] of Object.entries(saved)) {
          if (k !== '__lastSelectedChar' && v && typeof v === 'object' && (v as any).character) {
            next[k] = v as CharacterGearSnapshot;
          }
        }
        const first = Object.keys(next)[0];
        if (!first) {
          setOtherError(`No synced Armory characters found for @${clean}.`);
        } else {
          setOtherSnapshots(next);
          setSelectedCompareKey(`remote:${first}`);
        }
      }
    } catch {
      setOtherError('Could not load squadmate Armory snapshots.');
    } finally {
      setLoadingOther(false);
    }
  };

  const hasTarget = compareMode === 'pob' ? Boolean(targetPob) : Boolean(compareSnapshot);
  const targetName =
    compareMode === 'pob'
      ? targetPob?.characterName || 'Target PoB'
      : compareSnapshot?.character.name || 'Target Character';

  const targetHashes: number[] =
    compareMode === 'pob'
      ? targetPob?.allocatedHashes || []
      : compareSnapshot?.passives.allocatedHashes || [];

  const keystonesA = new Set((primarySnapshot.passives.keystones || []).map((k) => k.name));
  const keystonesB = new Set(
    compareMode === 'pob'
      ? targetPob?.keystones || []
      : (compareSnapshot?.passives.keystones || []).map((k) => k.name)
  );
  const sharedKeystones = Array.from(keystonesA).filter((k) => keystonesB.has(k));
  const onlyAKeystones = Array.from(keystonesA).filter((k) => !keystonesB.has(k));
  const onlyBKeystones = Array.from(keystonesB).filter((k) => !keystonesA.has(k));

  const hashesA = new Set(primarySnapshot.passives.allocatedHashes || []);
  const hashesB = new Set(targetHashes);
  const sharedNodesCount = Array.from(hashesA).filter((h) => hashesB.has(h)).length;
  const stillNeededNodesCount = Array.from(hashesB).filter((h) => !hashesA.has(h)).length;

  const renderDelta = (currentVal: number | null, targetVal: number | null, suffix = '') => {
    if (currentVal === null || targetVal === null) {
      return <span className="text-slate-600">—</span>;
    }
    const diff = Math.round(currentVal - targetVal);
    if (diff === 0) return <span className="text-emerald-400 font-bold">Matched</span>;
    if (diff > 0) {
      return (
        <span className="text-emerald-400 font-bold">
          +{diff.toLocaleString()}
          {suffix}
        </span>
      );
    }
    return (
      <span className="text-rose-400 font-bold">
        Need {Math.abs(diff).toLocaleString()}
        {suffix}
      </span>
    );
  };

  const pobFire = targetPob ? formatPobRes(targetPob.stats.fireRes, targetPob.stats.fireResOverCap, targetPob.stats.maxFireRes) : null;
  const pobCold = targetPob ? formatPobRes(targetPob.stats.coldRes, targetPob.stats.coldResOverCap, targetPob.stats.maxColdRes) : null;
  const pobLight = targetPob ? formatPobRes(targetPob.stats.lightningRes, targetPob.stats.lightningResOverCap, targetPob.stats.maxLightningRes) : null;
  const pobChaos = targetPob
    ? formatPobRes(
        targetPob.stats.chaosRes,
        targetPob.stats.chaosResOverCap,
        targetPob.stats.maxChaosRes,
        targetPob.keystones.includes('Chaos Inoculation') || (targetPob.stats.life === 1 && targetPob.stats.energyShield >= 200)
      )
    : null;

  const pobRows: Array<{
    section?: string;
    label: string;
    labelColor?: string;
    valA: string;
    valB: string;
    numA: number | null;
    numB: number | null;
    suffix?: string;
  }> = (() => {
    if (compareMode === 'pob' && targetPob) {
      const st = targetPob.stats;
      const effDps = Math.max(st.fullDPS, st.totalDPS, st.minionDPS);
      const isTargetCI = targetPob.keystones.includes('Chaos Inoculation') || (st.life === 1 && st.energyShield >= 200);
      return [
        // Offense (PoB Sidebar Order)
        { section: 'Offense (Target PoB Benchmarks)', label: 'Combined / Full DPS', valA: 'In PoB', valB: effDps > 0 ? fmtNum(effDps) : '—', numA: null, numB: null },
        ...(st.averageDamage > 0 ? [{ label: 'Average Damage', valA: 'In PoB', valB: fmtNum(st.averageDamage), numA: null, numB: null }] : []),
        ...(st.attackRate > 0 ? [{ label: 'Attack / Cast Rate', valA: 'In PoB', valB: `${st.attackRate.toFixed(2)}`, numA: null, numB: null }] : []),
        ...(st.critChance > 0 ? [{ label: 'Crit Chance / Multi', valA: 'In PoB', valB: `${st.critChance}% / ${st.critMulti}%`, numA: null, numB: null }] : []),
        // Attributes (PoB Colors)
        { section: 'Attributes', label: 'Strength', labelColor: 'text-rose-400', valA: fmtNum(primaryCalc.attributes.strength), valB: fmtNum(st.strength), numA: primaryCalc.attributes.strength, numB: st.strength },
        { label: 'Dexterity', labelColor: 'text-emerald-400', valA: fmtNum(primaryCalc.attributes.dexterity), valB: fmtNum(st.dexterity), numA: primaryCalc.attributes.dexterity, numB: st.dexterity },
        { label: 'Intelligence', labelColor: 'text-sky-400', valA: fmtNum(primaryCalc.attributes.intelligence), valB: fmtNum(st.intelligence), numA: primaryCalc.attributes.intelligence, numB: st.intelligence },
        // EHP & Max Hits (Live Calculated vs Target PoB!)
        { section: 'Effective Hit Pool & Max Hits', label: 'Effective Hit Pool', valA: fmtNum(primaryCalc.effectiveHitPool), valB: st.totalEHP > 0 ? fmtNum(st.totalEHP) : '—', numA: primaryCalc.effectiveHitPool, numB: st.totalEHP > 0 ? st.totalEHP : null },
        { label: 'Phys Max Hit', labelColor: 'text-slate-300', valA: fmtNum(primaryCalc.maxHits.phys), valB: st.physMaxHit > 0 ? fmtNum(st.physMaxHit) : '—', numA: primaryCalc.maxHits.phys, numB: st.physMaxHit > 0 ? st.physMaxHit : null },
        { label: 'Fire Max Hit', labelColor: 'text-orange-400', valA: fmtNum(primaryCalc.maxHits.fire), valB: st.fireMaxHit > 0 ? fmtNum(st.fireMaxHit) : '—', numA: primaryCalc.maxHits.fire, numB: st.fireMaxHit > 0 ? st.fireMaxHit : null },
        { label: 'Cold Max Hit', labelColor: 'text-sky-300', valA: fmtNum(primaryCalc.maxHits.cold), valB: st.coldMaxHit > 0 ? fmtNum(st.coldMaxHit) : '—', numA: primaryCalc.maxHits.cold, numB: st.coldMaxHit > 0 ? st.coldMaxHit : null },
        { label: 'Lightning Max Hit', labelColor: 'text-amber-300', valA: fmtNum(primaryCalc.maxHits.lightning), valB: st.lightningMaxHit > 0 ? fmtNum(st.lightningMaxHit) : '—', numA: primaryCalc.maxHits.lightning, numB: st.lightningMaxHit > 0 ? st.lightningMaxHit : null },
        { label: 'Chaos Max Hit', labelColor: 'text-fuchsia-400', valA: primaryCalc.isCI ? 'inf (Immune)' : fmtNum(primaryCalc.maxHits.chaos), valB: isTargetCI ? 'inf (Immune)' : st.chaosMaxHit > 0 ? fmtNum(st.chaosMaxHit) : '—', numA: primaryCalc.isCI ? null : primaryCalc.maxHits.chaos, numB: isTargetCI || st.chaosMaxHit <= 0 ? null : st.chaosMaxHit },
        // Pools & Defenses
        { section: 'Pools & Mitigation', label: 'Total Life', labelColor: 'text-rose-400', valA: fmtNum(primaryCalc.life.total), valB: fmtNum(st.life), numA: primaryCalc.life.total, numB: st.life },
        { label: 'Energy Shield', labelColor: 'text-cyan-300', valA: fmtNum(primaryCalc.energyShield.total), valB: fmtNum(st.energyShield), numA: primaryCalc.energyShield.total, numB: st.energyShield },
        { label: 'Evasion Rating', labelColor: 'text-emerald-300', valA: `${fmtNum(primaryCalc.evasion.total)} (${primaryCalc.evasion.evadeChancePct}%)`, valB: `${fmtNum(st.evasion)}${st.evadeChance > 0 ? ` (${st.evadeChance}%)` : ''}`, numA: primaryCalc.evasion.total, numB: st.evasion },
        { label: 'Armour', labelColor: 'text-slate-300', valA: `${fmtNum(primaryCalc.armour.total)} (${primaryCalc.armour.physDmgReductPct}%)`, valB: `${fmtNum(st.armour)}${st.physDamageReduction > 0 ? ` (${st.physDamageReduction}%)` : ''}`, numA: primaryCalc.armour.total, numB: st.armour },
        { label: 'Block / Spell Block', valA: `${primaryCalc.block.attackBlock}% / ${primaryCalc.block.spellBlock}%`, valB: `${st.block}% / ${st.spellBlock}%`, numA: primaryCalc.block.attackBlock, numB: st.block, suffix: '%' },
        { label: 'Spell Suppression', labelColor: 'text-emerald-300', valA: `${primaryCalc.suppression.chance}%`, valB: `${st.spellSuppression}%`, numA: primaryCalc.suppression.chance, numB: st.spellSuppression, suffix: '%' },
        // Resistances (In-Game Style: Effective% (+Overcap%))
        { section: 'Resistances (In-Game Cap + Overcap)', label: 'Fire Resistance', labelColor: 'text-orange-400', valA: primaryCalc.resistances.fire.label, valB: pobFire?.label || '—', numA: primaryCalc.resistances.fire.effective, numB: pobFire?.effective ?? null, suffix: '%' },
        { label: 'Cold Resistance', labelColor: 'text-sky-300', valA: primaryCalc.resistances.cold.label, valB: pobCold?.label || '—', numA: primaryCalc.resistances.cold.effective, numB: pobCold?.effective ?? null, suffix: '%' },
        { label: 'Lightning Resistance', labelColor: 'text-amber-300', valA: primaryCalc.resistances.lightning.label, valB: pobLight?.label || '—', numA: primaryCalc.resistances.lightning.effective, numB: pobLight?.effective ?? null, suffix: '%' },
        { label: 'Chaos Resistance', labelColor: 'text-fuchsia-400', valA: primaryCalc.resistances.chaos.label, valB: pobChaos?.label || '—', numA: primaryCalc.resistances.chaos.isImmune ? 100 : primaryCalc.resistances.chaos.effective, numB: pobChaos?.isImmune ? 100 : pobChaos?.effective ?? null, suffix: '%' },
        // Speed & Passives
        { section: 'Speed & Tree', label: 'Movement Speed Modifier', valA: `+${primaryCalc.movementSpeedMod}%`, valB: `${st.movementSpeedMod >= 0 ? '+' : ''}${st.movementSpeedMod}%`, numA: primaryCalc.movementSpeedMod, numB: st.movementSpeedMod, suffix: '%' },
        { label: 'Allocated Passives', valA: fmtNum(primarySnapshot.passives.allocatedCount), valB: fmtNum(targetHashes.length), numA: primarySnapshot.passives.allocatedCount, numB: targetHashes.length }
      ];
    }

    if (compareMode === 'character' && compareSnapshot && compareCalc) {
      return [
        { section: 'Attributes', label: 'Strength', labelColor: 'text-rose-400', valA: fmtNum(primaryCalc.attributes.strength), valB: fmtNum(compareCalc.attributes.strength), numA: primaryCalc.attributes.strength, numB: compareCalc.attributes.strength },
        { label: 'Dexterity', labelColor: 'text-emerald-400', valA: fmtNum(primaryCalc.attributes.dexterity), valB: fmtNum(compareCalc.attributes.dexterity), numA: primaryCalc.attributes.dexterity, numB: compareCalc.attributes.dexterity },
        { label: 'Intelligence', labelColor: 'text-sky-400', valA: fmtNum(primaryCalc.attributes.intelligence), valB: fmtNum(compareCalc.attributes.intelligence), numA: primaryCalc.attributes.intelligence, numB: compareCalc.attributes.intelligence },
        { section: 'Effective Hit Pool & Max Hits', label: 'Effective Hit Pool', valA: fmtNum(primaryCalc.effectiveHitPool), valB: fmtNum(compareCalc.effectiveHitPool), numA: primaryCalc.effectiveHitPool, numB: compareCalc.effectiveHitPool },
        { label: 'Phys Max Hit', labelColor: 'text-slate-300', valA: fmtNum(primaryCalc.maxHits.phys), valB: fmtNum(compareCalc.maxHits.phys), numA: primaryCalc.maxHits.phys, numB: compareCalc.maxHits.phys },
        { section: 'Pools & Mitigation', label: 'Total Life', labelColor: 'text-rose-400', valA: fmtNum(primaryCalc.life.total), valB: fmtNum(compareCalc.life.total), numA: primaryCalc.life.total, numB: compareCalc.life.total },
        { label: 'Energy Shield', labelColor: 'text-cyan-300', valA: fmtNum(primaryCalc.energyShield.total), valB: fmtNum(compareCalc.energyShield.total), numA: primaryCalc.energyShield.total, numB: compareCalc.energyShield.total },
        { label: 'Armour', labelColor: 'text-slate-300', valA: fmtNum(primaryCalc.armour.total), valB: fmtNum(compareCalc.armour.total), numA: primaryCalc.armour.total, numB: compareCalc.armour.total },
        { label: 'Evasion', labelColor: 'text-emerald-300', valA: fmtNum(primaryCalc.evasion.total), valB: fmtNum(compareCalc.evasion.total), numA: primaryCalc.evasion.total, numB: compareCalc.evasion.total },
        { label: 'Spell Suppression', labelColor: 'text-emerald-300', valA: `${primaryCalc.suppression.chance}%`, valB: `${compareCalc.suppression.chance}%`, numA: primaryCalc.suppression.chance, numB: compareCalc.suppression.chance, suffix: '%' },
        { section: 'Resistances (In-Game Cap + Overcap)', label: 'Fire Resistance', labelColor: 'text-orange-400', valA: primaryCalc.resistances.fire.label, valB: compareCalc.resistances.fire.label, numA: primaryCalc.resistances.fire.effective, numB: compareCalc.resistances.fire.effective, suffix: '%' },
        { label: 'Cold Resistance', labelColor: 'text-sky-300', valA: primaryCalc.resistances.cold.label, valB: compareCalc.resistances.cold.label, numA: primaryCalc.resistances.cold.effective, numB: compareCalc.resistances.cold.effective, suffix: '%' },
        { label: 'Lightning Resistance', labelColor: 'text-amber-300', valA: primaryCalc.resistances.lightning.label, valB: compareCalc.resistances.lightning.label, numA: primaryCalc.resistances.lightning.effective, numB: compareCalc.resistances.lightning.effective, suffix: '%' },
        { label: 'Chaos Resistance', labelColor: 'text-fuchsia-400', valA: primaryCalc.resistances.chaos.label, valB: compareCalc.resistances.chaos.label, numA: primaryCalc.resistances.chaos.effective, numB: compareCalc.resistances.chaos.effective, suffix: '%' },
        { section: 'Tree', label: 'Allocated Passives', valA: fmtNum(primarySnapshot.passives.allocatedCount), valB: fmtNum(compareSnapshot.passives.allocatedCount), numA: primarySnapshot.passives.allocatedCount, numB: compareSnapshot.passives.allocatedCount }
      ];
    }

    return [];
  })();

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-6xl max-h-[92vh] overflow-y-auto rounded-2xl border border-indigo-500/45 bg-[#0b101b] p-4 sm:p-5 space-y-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">
                Side by Side Character &amp; Path of Building Diff Viewer
              </h2>
              <p className="text-[11px] text-slate-400">
                Compare your live character directly against a target Path of Building (pobb.in / export code) or a squadmate to see exact stat gaps, missing passives, and gear upgrades.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Target Picker Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 text-xs">
          <div className="lg:col-span-4 p-3 rounded-xl bg-cyan-950/25 border border-cyan-500/35">
            <div className="text-[10px] font-mono uppercase text-cyan-300 font-bold">Your Character (Base)</div>
            <div className="text-sm font-bold text-white mt-0.5">{primarySnapshot.character.name}</div>
            <div className="text-[11px] font-mono text-slate-400">
              Lv {primarySnapshot.character.level} {primarySnapshot.character.className} • {primarySnapshot.passives.allocatedCount} Passives
            </div>
          </div>

          <div className="lg:col-span-8 p-3 rounded-xl bg-purple-950/20 border border-purple-500/35 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-[10px] font-mono uppercase text-purple-300 font-bold">
                Target Build to Compare Against
              </div>
              <div className="inline-flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setCompareMode('pob')}
                  className={`px-2.5 py-1 rounded-md font-bold inline-flex items-center gap-1 cursor-pointer ${
                    compareMode === 'pob' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileCode2 className="w-3 h-3" />
                  <span>Path of Building</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCompareMode('character')}
                  className={`px-2.5 py-1 rounded-md font-bold inline-flex items-center gap-1 cursor-pointer ${
                    compareMode === 'character' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Users className="w-3 h-3" />
                  <span>Squadmate / Alt</span>
                </button>
              </div>
            </div>

            {compareMode === 'pob' ? (
              <div className="space-y-1.5">
                <form onSubmit={handleLoadTargetPob} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={pobInput}
                    onChange={(e) => setPobInput(e.target.value)}
                    placeholder="Paste pobb.in link, pastebin link, or Path of Building export code..."
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-purple-400"
                  />
                  <button
                    type="submit"
                    disabled={loadingPob}
                    className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold cursor-pointer disabled:opacity-50 inline-flex items-center gap-1 shrink-0"
                  >
                    {loadingPob ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>{loadingPob ? 'Loading...' : 'Compare PoB'}</span>
                  </button>
                </form>
                {pobError && <div className="text-[11px] text-rose-300 font-mono">{pobError}</div>}
                {targetPob && (
                  <div className="text-[11px] font-mono text-purple-200">
                    Loaded Target PoB: <strong>{targetPob.characterName}</strong> (Lv {targetPob.level}{' '}
                    {targetPob.ascendClassName !== 'None' ? targetPob.ascendClassName : targetPob.className} •{' '}
                    {targetPob.allocatedHashes.length} Passives)
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <form onSubmit={handleLoadSquadmate} className="flex items-center gap-1.5 flex-1 min-w-[200px]">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={otherHandle}
                        onChange={(e) => setOtherHandle(e.target.value)}
                        placeholder="Load squadmate @Handle..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-400"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loadingOther}
                      className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold cursor-pointer disabled:opacity-50 inline-flex items-center gap-1"
                    >
                      {loadingOther ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      <span>Load</span>
                    </button>
                  </form>

                  {Object.keys(combinedCandidates).length > 0 && (
                    <select
                      value={selectedCompareKey}
                      onChange={(e) => setSelectedCompareKey(e.target.value)}
                      className="flex-1 min-w-[200px] px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-purple-200 font-semibold cursor-pointer"
                    >
                      {Object.entries(combinedCandidates).map(([k, v]) => (
                        <option key={k} value={k} className="bg-slate-950">
                          {v.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                {otherError && <div className="text-[11px] text-rose-300 font-mono">{otherError}</div>}
              </div>
            )}
          </div>
        </div>

        {!hasTarget ? (
          <div className="py-10 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl space-y-1.5">
            {compareMode === 'pob' ? (
              <>
                <div className="text-slate-200 font-semibold">
                  Paste any <strong className="text-purple-300">pobb.in</strong> link or Path of Building export code above
                </div>
                <div>
                  You&apos;ll see a PoB-style stat comparison table, what stats &amp; resistances you still need to hit, a Gold/Cyan/Purple passive tree diff, and slot-by-slot gear goals.
                </div>
              </>
            ) : (
              <div>
                Sync a second character on your account or enter any squadmate&apos;s <strong className="text-white">@Handle</strong> above to compare builds side by side.
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* PoB-Consistent Side-by-Side Stat Sheet */}
            <div className="rounded-xl border border-slate-800 bg-[#080b12] overflow-hidden">
              <div className="px-3.5 py-2 border-b border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                <span className="font-bold uppercase tracking-wider text-amber-300">
                  PoB-Style Stat Sheet &amp; Goals to Achieve
                </span>
                <span className="text-slate-400">
                  Resistances shown in-game style: <strong className="text-slate-200">Cap% (+Overcap%)</strong>
                </span>
              </div>
              <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="sticky top-0 bg-slate-950 text-[10px] uppercase text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2 px-3">Stat</th>
                      <th className="py-2 px-3 text-right text-cyan-300">{primarySnapshot.character.name} (You)</th>
                      <th className="py-2 px-3 text-right text-purple-300">{targetName} (Target)</th>
                      <th className="py-2 px-3 text-right text-amber-300">Status / Gap</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                    {pobRows.map((row, i) => (
                      <React.Fragment key={i}>
                        {row.section && (
                          <tr className="bg-slate-900/60">
                            <td colSpan={4} className="py-1 px-3 text-[10px] uppercase tracking-wider font-bold text-slate-400">
                              {row.section}
                            </td>
                          </tr>
                        )}
                        <tr className="hover:bg-slate-900/40">
                          <td className={`py-1.5 px-3 ${row.labelColor || 'text-slate-300'}`}>{row.label}:</td>
                          <td className="py-1.5 px-3 text-right text-white font-semibold">{row.valA}</td>
                          <td className="py-1.5 px-3 text-right text-purple-200 font-semibold">{row.valB}</td>
                          <td className="py-1.5 px-3 text-right">{renderDelta(row.numA, row.numB, row.suffix)}</td>
                        </tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Interactive Passive Tree Diff Overlay */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Passive Tree Pathing Diff</span>
                </span>
                <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono">
                  <span className="flex items-center gap-1 text-amber-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Matched ({sharedNodesCount})
                  </span>
                  <span className="flex items-center gap-1 text-cyan-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Only {primarySnapshot.character.name}
                  </span>
                  <span className="flex items-center gap-1 text-purple-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400" /> Still Needed in {targetName} ({stillNeededNodesCount})
                  </span>
                </div>
              </div>
              <OfficialPassiveTreeCanvas
                allocatedHashes={primarySnapshot.passives.allocatedHashes}
                compareHashes={targetHashes}
                compareName={targetName}
                fallbackPoints={primarySnapshot.passives.treePoints}
                fallbackEdges={primarySnapshot.passives.treeEdges}
                allocatedCount={primarySnapshot.passives.allocatedCount}
                characterName={`${primarySnapshot.character.name} vs ${targetName}`}
                className="w-full h-[380px]"
              />
            </div>

            {/* Keystone Diff + Gear Slot Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 text-xs">
              <div className="lg:col-span-5 p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="text-[10px] font-mono uppercase font-bold text-amber-300">Keystone Diff</div>
                <div className="space-y-2">
                  <div>
                    <div className="text-[10px] font-mono text-purple-300">Still Needed from {targetName} ({onlyBKeystones.length})</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {onlyBKeystones.length === 0 ? (
                        <span className="text-emerald-400 text-[11px]">All target keystones allocated!</span>
                      ) : (
                        onlyBKeystones.map((k) => (
                          <span key={k} className="px-2 py-0.5 rounded bg-purple-500/15 border border-purple-500/35 text-purple-200 text-[10px]">
                            {k}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-slate-400">Matched ({sharedKeystones.length})</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {sharedKeystones.length === 0 ? (
                        <span className="text-slate-600 text-[11px]">None</span>
                      ) : (
                        sharedKeystones.map((k) => (
                          <span key={k} className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/35 text-amber-200 text-[10px]">
                            {k}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-cyan-300">Only {primarySnapshot.character.name} ({onlyAKeystones.length})</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {onlyAKeystones.length === 0 ? (
                        <span className="text-slate-600 text-[11px]">None</span>
                      ) : (
                        onlyAKeystones.map((k) => (
                          <span key={k} className="px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/35 text-cyan-200 text-[10px]">
                            {k}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="text-[10px] font-mono uppercase font-bold text-sky-300 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Equipped Gear vs Target Build</span>
                </div>
                <div className="overflow-x-auto max-h-[260px] overflow-y-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead className="sticky top-0 bg-slate-950 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
                      <tr>
                        <th className="py-1.5 pr-2">Slot</th>
                        <th className="py-1.5 px-2 text-cyan-300">{primarySnapshot.character.name}</th>
                        <th className="py-1.5 pl-2 text-purple-300">{targetName}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {COMPARE_SLOTS.map((slot) => {
                        const itA = primarySnapshot.equipped.find((i) => i.inventoryId === slot.id);
                        const itB =
                          compareMode === 'pob'
                            ? targetPob?.items.find((i) => i.slot.toLowerCase() === slot.pobSlot.toLowerCase())
                            : compareSnapshot?.equipped.find((i) => i.inventoryId === slot.id);
                        return (
                          <tr key={slot.id}>
                            <td className="py-1.5 pr-2 font-mono text-slate-500">{slot.label}</td>
                            <td className="py-1.5 px-2 text-slate-200 truncate max-w-[180px]" title={itA ? `${itA.name} ${itA.baseType}` : ''}>
                              {itA ? itA.name || itA.baseType : '—'}
                            </td>
                            <td className="py-1.5 pl-2 text-purple-200 truncate max-w-[180px]" title={itB ? `${itB.name} ${(itB as any).baseName || (itB as any).baseType || ''}` : ''}>
                              {itB ? itB.name || (itB as any).baseName || (itB as any).baseType : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
