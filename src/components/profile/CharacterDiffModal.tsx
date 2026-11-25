import React, { useState, useMemo } from 'react';
import { X, GitCompare, Search, Shield, Sparkles, Loader2 } from 'lucide-react';
import { fetchUserToolState } from '../../services/cloudSync';
import type { CharacterGearSnapshot } from './CharacterPaperdollView';
import { OfficialPassiveTreeCanvas } from './OfficialPassiveTreeCanvas';

interface CharacterDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  primarySnapshot: CharacterGearSnapshot;
  localSnapshots: Record<string, CharacterGearSnapshot>;
}

const COMPARE_SLOTS = ['Weapon', 'Offhand', 'Helm', 'BodyArmour', 'Gloves', 'Boots', 'Belt', 'Amulet', 'Ring', 'Ring2'];

export const CharacterDiffModal: React.FC<CharacterDiffModalProps> = ({
  isOpen,
  onClose,
  primarySnapshot,
  localSnapshots
}) => {
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

  if (!isOpen) return null;

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

  const diffStat = (a: number, b: number, suffix = '') => {
    const d = b - a;
    if (d === 0) return <span className="text-slate-500">0{suffix}</span>;
    return (
      <span className={d > 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
        {d > 0 ? `+${d.toLocaleString()}` : d.toLocaleString()}
        {suffix}
      </span>
    );
  };

  const keystonesA = new Set((primarySnapshot.passives.keystones || []).map((k) => k.name));
  const keystonesB = new Set((compareSnapshot?.passives.keystones || []).map((k) => k.name));
  const sharedKeystones = Array.from(keystonesA).filter((k) => keystonesB.has(k));
  const onlyAKeystones = Array.from(keystonesA).filter((k) => !keystonesB.has(k));
  const onlyBKeystones = Array.from(keystonesB).filter((k) => !keystonesA.has(k));

  const hashesA = new Set(primarySnapshot.passives.allocatedHashes || []);
  const hashesB = new Set(compareSnapshot?.passives.allocatedHashes || []);
  const sharedNodesCount = Array.from(hashesA).filter((h) => hashesB.has(h)).length;

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
                Side by Side Character &amp; Passive Tree Diff Viewer
              </h2>
              <p className="text-[11px] text-slate-400">
                Compare vitals, Keystones, gear slots, and passive tree pathing against another synced character or squadmate.
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
            <div className="text-[10px] font-mono uppercase text-cyan-300 font-bold">Character A (Base)</div>
            <div className="text-sm font-bold text-white mt-0.5">{primarySnapshot.character.name}</div>
            <div className="text-[11px] font-mono text-slate-400">
              Lv {primarySnapshot.character.level} {primarySnapshot.character.className} • {primarySnapshot.passives.allocatedCount} Passives
            </div>
          </div>

          <div className="lg:col-span-8 p-3 rounded-xl bg-purple-950/20 border border-purple-500/35 space-y-2">
            <div className="text-[10px] font-mono uppercase text-purple-300 font-bold">
              Character B (Compare Target)
            </div>
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
        </div>

        {!compareSnapshot ? (
          <div className="py-10 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl">
            Sync a second character on your account or enter any squadmate&apos;s <strong className="text-white">@Handle</strong> above to compare builds side by side.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Vitals Delta Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] font-mono text-slate-400">Flat Life</div>
                <div className="font-mono text-sm mt-0.5">
                  {diffStat(primarySnapshot.estimatedVitals.flatLife, compareSnapshot.estimatedVitals.flatLife)}
                </div>
                <div className="text-[10px] font-mono text-slate-500">
                  {primarySnapshot.estimatedVitals.flatLife} vs {compareSnapshot.estimatedVitals.flatLife}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] font-mono text-slate-400">Energy Shield</div>
                <div className="font-mono text-sm mt-0.5">
                  {diffStat(
                    (primarySnapshot.gearStats?.energyShield || 0) + primarySnapshot.estimatedVitals.flatEs,
                    (compareSnapshot.gearStats?.energyShield || 0) + compareSnapshot.estimatedVitals.flatEs
                  )}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] font-mono text-slate-400">Chaos Res</div>
                <div className="font-mono text-sm mt-0.5">
                  {diffStat(primarySnapshot.estimatedVitals.chaosRes, compareSnapshot.estimatedVitals.chaosRes, '%')}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] font-mono text-slate-400">Spell Suppress</div>
                <div className="font-mono text-sm mt-0.5">
                  {diffStat(primarySnapshot.estimatedVitals.suppress, compareSnapshot.estimatedVitals.suppress, '%')}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] font-mono text-slate-400">Passives</div>
                <div className="font-mono text-sm mt-0.5">
                  {diffStat(primarySnapshot.passives.allocatedCount, compareSnapshot.passives.allocatedCount)}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] font-mono text-slate-400">Shared Nodes</div>
                <div className="font-mono text-sm font-bold text-amber-300 mt-0.5">{sharedNodesCount}</div>
                <div className="text-[10px] font-mono text-slate-500">overlapping passives</div>
              </div>
            </div>

            {/* Interactive Passive Tree Diff Overlay */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Passive Tree Pathing Diff</span>
                </span>
                <div className="flex items-center gap-3 text-[10px] font-mono">
                  <span className="flex items-center gap-1 text-amber-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Shared ({sharedNodesCount})
                  </span>
                  <span className="flex items-center gap-1 text-cyan-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Only {primarySnapshot.character.name}
                  </span>
                  <span className="flex items-center gap-1 text-purple-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400" /> Only {compareSnapshot.character.name}
                  </span>
                </div>
              </div>
              <OfficialPassiveTreeCanvas
                allocatedHashes={primarySnapshot.passives.allocatedHashes}
                compareHashes={compareSnapshot.passives.allocatedHashes}
                compareName={compareSnapshot.character.name}
                fallbackPoints={primarySnapshot.passives.treePoints}
                fallbackEdges={primarySnapshot.passives.treeEdges}
                allocatedCount={primarySnapshot.passives.allocatedCount}
                characterName={`${primarySnapshot.character.name} vs ${compareSnapshot.character.name}`}
                className="w-full h-[380px]"
              />
            </div>

            {/* Keystone Diff + Gear Slot Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 text-xs">
              <div className="lg:col-span-5 p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="text-[10px] font-mono uppercase font-bold text-amber-300">Keystone Diff</div>
                <div className="space-y-2">
                  <div>
                    <div className="text-[10px] font-mono text-slate-400">Shared ({sharedKeystones.length})</div>
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
                  <div>
                    <div className="text-[10px] font-mono text-purple-300">Only {compareSnapshot.character.name} ({onlyBKeystones.length})</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {onlyBKeystones.length === 0 ? (
                        <span className="text-slate-600 text-[11px]">None</span>
                      ) : (
                        onlyBKeystones.map((k) => (
                          <span key={k} className="px-2 py-0.5 rounded bg-purple-500/15 border border-purple-500/35 text-purple-200 text-[10px]">
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
                  <span>Equipped Gear Comparison</span>
                </div>
                <div className="overflow-x-auto max-h-[260px] overflow-y-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead className="sticky top-0 bg-slate-950 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
                      <tr>
                        <th className="py-1.5 pr-2">Slot</th>
                        <th className="py-1.5 px-2 text-cyan-300">{primarySnapshot.character.name}</th>
                        <th className="py-1.5 pl-2 text-purple-300">{compareSnapshot.character.name}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {COMPARE_SLOTS.map((slot) => {
                        const itA = primarySnapshot.equipped.find((i) => i.inventoryId === slot);
                        const itB = compareSnapshot.equipped.find((i) => i.inventoryId === slot);
                        return (
                          <tr key={slot}>
                            <td className="py-1.5 pr-2 font-mono text-slate-500">{slot}</td>
                            <td className="py-1.5 px-2 text-slate-200 truncate max-w-[180px]">
                              {itA ? itA.name || itA.baseType : '—'}
                            </td>
                            <td className="py-1.5 pl-2 text-slate-200 truncate max-w-[180px]">
                              {itB ? itB.name || itB.baseType : '—'}
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
