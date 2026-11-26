import React, { useState, useEffect } from 'react';
import {
  Compass,
  Crown,
  Cloud,
  CheckCircle2,
  Circle,
  ExternalLink,
  Flame,
  Sparkles,
  Layers,
  RotateCcw
} from 'lucide-react';
import type { UserAccount } from '../../types';
import { fetchUserToolState, saveUserToolState } from '../../services/cloudSync';

interface Poe2AtlasProgress {
  highestWaystoneTier: number;
  atlasPoints: number;
  citadels: {
    copper: boolean;
    iron: boolean;
    stone: boolean;
  };
  pinnacles: {
    arbiter: boolean;
    xesht: boolean;
    kingInTheMists: boolean;
    olroth: boolean;
    simulacrum: boolean;
  };
}

const DEFAULT_POE2_ATLAS: Poe2AtlasProgress = {
  highestWaystoneTier: 1,
  atlasPoints: 0,
  citadels: { copper: false, iron: false, stone: false },
  pinnacles: {
    arbiter: false,
    xesht: false,
    kingInTheMists: false,
    olroth: false,
    simulacrum: false
  }
};

const POE2_ATLAS_STAGES = [
  {
    stage: 1,
    title: 'Stage 1: Waystone Sustain (T1–T6)',
    subtitle: 'First 12 Atlas Points & Boss-Map Sustain',
    bullets: [
      'Always path toward Boss icons on the infinite Atlas—Map Bosses have the highest Waystone drop multiplier.',
      'Use 3-to-1 Reforging Bench upgrades on duplicate low-tier Waystones to jump tiers smoothly in SSF.',
      'Check Doryani in your Hideout after every level-up to buy fresh Waystones with Gold.',
      'Take Waystone drop chance & Quantity of Waystones nodes first on your core Atlas tree before juicing mechanics.'
    ]
  },
  {
    stage: 2,
    title: 'Stage 2: Precursor Towers & Tablet Overlap (T7–T12)',
    subtitle: 'Cluster Stacking for Breach, Ritual, Expedition & Delirium',
    bullets: [
      'Clear 3–4 nearby Precursor Towers before running the dense cluster of maps in the middle.',
      'Socket Precursor Tablets rolled with "+Quantity of Items", "+Rare Monsters", or "+Waystones Found" so overlapping zones multiply rewards.',
      'Prioritize Irradiated (+1 Area Level) and Corrupted (+1 Area Level) tiles to hit iLvl 80–82 crafting bases early.',
      'Use Instilled Emotions from Delirium to anoint your Amulet and distill T13+ Waystones for extra pack size.'
    ]
  },
  {
    stage: 3,
    title: 'Stage 3: Citadel & Crisis Fragment Hunting (T15+)',
    subtitle: 'Unlocking The Burning Monolith',
    bullets: [
      'Follow the glowing beacons in the fog to locate the Iron Citadel (Count Geonor), Copper Citadel (Jamanra), and Stone Citadel (Doryani).',
      'Roll Citadel Waystones with high Waystone Drop Chance %—this directly scales the number of Crisis Fragments dropped by the Citadel Boss (up to 2–3 per run!).',
      'Never run a Citadel on a deadly multi-damage-mod Waystone; dying forfeits the Citadel tile.'
    ]
  },
  {
    stage: 4,
    title: 'Stage 4: Pinnacle Bossing & Mechanic Trees (40/40)',
    subtitle: 'Arbiter of Ash, Breach, Ritual, Expedition & Simulacrum',
    bullets: [
      'Each Endgame Mechanic (Breach, Ritual, Expedition, Delirium, Map Bosses) has its own 8-point Passive Tree unlocked by clearing escalating boss difficulties.',
      'Cap 75% Elemental Res, push Chaos Res ≥ 40–60%, and configure Thawing/Staunching Charms before entering Pinnacle encounters.',
      'Farm Expedition Logbooks (Gwennen/Tujen/Rog/Dannig) and Ritual Omens (Whittling, Dextral/Sinistral Erasure) for top-end SSF deterministic crafting.'
    ]
  }
];

export const Poe2EndgameAtlasView: React.FC<{ userAccount?: UserAccount | null }> = ({ userAccount }) => {
  const [activeStage, setActiveStage] = useState<number>(1);
  const [cloudSynced, setCloudSynced] = useState<boolean>(false);
  const [progress, setProgress] = useState<Poe2AtlasProgress>(() => {
    try {
      const saved = localStorage.getItem('exile_ssf_poe2_atlas_progress_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_POE2_ATLAS,
          ...parsed,
          citadels: { ...DEFAULT_POE2_ATLAS.citadels, ...(parsed?.citadels || {}) },
          pinnacles: { ...DEFAULT_POE2_ATLAS.pinnacles, ...(parsed?.pinnacles || {}) }
        };
      }
    } catch {}
    return DEFAULT_POE2_ATLAS;
  });

  useEffect(() => {
    if (!userAccount?.displayName) return;
    let cancelled = false;
    fetchUserToolState<Poe2AtlasProgress>(userAccount.displayName, 'atlas_progress_poe2').then((data) => {
      if (!cancelled && data && typeof data === 'object') {
        setProgress({
          ...DEFAULT_POE2_ATLAS,
          ...data,
          citadels: { ...DEFAULT_POE2_ATLAS.citadels, ...(data.citadels || {}) },
          pinnacles: { ...DEFAULT_POE2_ATLAS.pinnacles, ...(data.pinnacles || {}) }
        });
        setCloudSynced(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [userAccount?.displayName]);

  const updateProgress = (next: Poe2AtlasProgress) => {
    setProgress(next);
    try {
      localStorage.setItem('exile_ssf_poe2_atlas_progress_v1', JSON.stringify(next));
    } catch {}
    if (userAccount?.displayName) {
      saveUserToolState(userAccount.displayName, 'atlas_progress_poe2', next).then((ok) => {
        if (ok) setCloudSynced(true);
      });
    }
  };

  const citadelCount = Object.values(progress.citadels).filter(Boolean).length;
  const pinnacleCount = Object.values(progress.pinnacles).filter(Boolean).length;

  return (
    <div className="space-y-6 pb-16 max-w-6xl mx-auto">
      {/* Header */}
      <div className="p-5 sm:p-6 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-[#0e1320] via-cyan-950/30 to-[#0e1320] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-widest text-cyan-400">
            <Compass className="w-4 h-4" />
            <span>PoE 2 Endgame Progression</span>
            {cloudSynced && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-[10px] font-mono text-emerald-300 normal-case">
                <Cloud className="w-3 h-3" />
                <span>Cloud Synced</span>
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-cinzel font-bold text-slate-100">
            Endgame Atlas &amp; Waystones
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            Track your Waystone tier progression (T1–T15+), 40/40 Core Atlas points, Crisis Fragment Citadels, and Pinnacle Boss unlocks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <a
            href="https://poe2db.tw/us/Atlas_passive_skill"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-cyan-300 flex items-center gap-1.5"
          >
            <span>PoE 2 DB Atlas Nodes</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            type="button"
            onClick={() => updateProgress(DEFAULT_POE2_ATLAS)}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Live Progress Trackers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Waystone Tier */}
        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/75 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-cyan-300 font-bold flex items-center gap-1.5">
              <Layers className="w-4 h-4" />
              <span>Highest Waystone</span>
            </span>
            <span className="text-lg font-mono font-black text-white">T{progress.highestWaystoneTier}</span>
          </div>
          <input
            type="range"
            min={1}
            max={16}
            value={progress.highestWaystoneTier}
            onChange={(e) =>
              updateProgress({ ...progress, highestWaystoneTier: Number(e.target.value) })
            }
            className="w-full accent-cyan-400 cursor-pointer"
            aria-label="Highest Waystone Tier completed"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>T1 (Lv 65)</span>
            <span>T11 (Lv 75)</span>
            <span>T15 (Lv 79)</span>
            <span>T16 (Corrupt)</span>
          </div>
        </div>

        {/* Core Atlas Points */}
        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/75 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-amber-300 font-bold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>Core Atlas Points</span>
            </span>
            <span className="text-lg font-mono font-black text-amber-300">
              {progress.atlasPoints} / 40
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={40}
            step={2}
            value={progress.atlasPoints}
            onChange={(e) =>
              updateProgress({ ...progress, atlasPoints: Number(e.target.value) })
            }
            className="w-full accent-amber-400 cursor-pointer"
            aria-label="Core Atlas passive points unlocked"
          />
          <div className="text-[11px] text-slate-400">
            Earned from Doryani&apos;s Waystone tier quests &amp; Corrupted Nexus cleanses.
          </div>
        </div>

        {/* Citadels & Pinnacles Summary */}
        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/75 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-emerald-300 font-bold flex items-center gap-1.5">
              <Crown className="w-4 h-4" />
              <span>Endgame Clears</span>
            </span>
            <span className="text-sm font-mono font-bold text-emerald-300">
              {citadelCount}/3 Citadels • {pinnacleCount}/5 Pinnacles
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all"
              style={{ width: `${Math.round(((citadelCount + pinnacleCount) / 8) * 100)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400">
            Clear all 3 Citadels to assemble the Crisis Fragments for The Burning Monolith.
          </p>
        </div>
      </div>

      {/* Citadels & Pinnacle Boss Checklists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 3 Citadels */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/70 space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
            <Flame className="w-4 h-4" />
            <span>Crisis Fragment Citadels ({citadelCount}/3)</span>
          </h2>
          <div className="space-y-2">
            {[
              { key: 'iron' as const, name: 'Iron Citadel', boss: 'Count Geonor', drop: 'Weathered Crisis Fragment' },
              { key: 'copper' as const, name: 'Copper Citadel', boss: 'Jamanra, the Abomination', drop: 'Faded Crisis Fragment' },
              { key: 'stone' as const, name: 'Stone Citadel', boss: 'Doryani, Royal Thaumaturge', drop: 'Ancient Crisis Fragment' }
            ].map((c) => {
              const done = progress.citadels[c.key];
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() =>
                    updateProgress({
                      ...progress,
                      citadels: { ...progress.citadels, [c.key]: !done }
                    })
                  }
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                    done
                      ? 'bg-emerald-950/35 border-emerald-500/45 text-emerald-100'
                      : 'bg-slate-950/75 border-slate-800 hover:border-slate-700 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {done ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-600 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-bold">{c.name} — {c.boss}</div>
                      <div className="text-[11px] text-slate-400">{c.drop}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 5 Pinnacle Bosses */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/70 space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-2">
            <Crown className="w-4 h-4" />
            <span>Pinnacle Boss Milestones ({pinnacleCount}/5)</span>
          </h2>
          <div className="space-y-2">
            {[
              { key: 'arbiter' as const, name: 'Arbiter of Ash', source: 'The Burning Monolith (3 Crisis Fragments)' },
              { key: 'xesht' as const, name: 'Xesht, We That Are One', source: 'Breachstone (300 Breach Splinters)' },
              { key: 'kingInTheMists' as const, name: 'The King in the Mists', source: 'An Audience with the King (Ritual)' },
              { key: 'olroth' as const, name: 'Olroth, Origin of the Fall', source: 'Expedition Logbook Boss' },
              { key: 'simulacrum' as const, name: 'Simulacrum (15 Waves)', source: '300 Simulacrum Splinters (Delirium)' }
            ].map((p) => {
              const done = progress.pinnacles[p.key];
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() =>
                    updateProgress({
                      ...progress,
                      pinnacles: { ...progress.pinnacles, [p.key]: !done }
                    })
                  }
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                    done
                      ? 'bg-cyan-950/35 border-cyan-500/45 text-cyan-100'
                      : 'bg-slate-950/75 border-slate-800 hover:border-slate-700 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {done ? (
                      <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-600 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-bold">{p.name}</div>
                      <div className="text-[11px] text-slate-400">{p.source}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4-Stage SSF Roadmap */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/75 overflow-hidden">
        <div className="p-3 border-b border-slate-800 flex flex-wrap gap-2">
          {POE2_ATLAS_STAGES.map((st) => (
            <button
              key={st.stage}
              type="button"
              onClick={() => setActiveStage(st.stage)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeStage === st.stage
                  ? 'bg-cyan-500/20 border border-cyan-400/50 text-cyan-200'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Stage {st.stage}
            </button>
          ))}
        </div>
        {POE2_ATLAS_STAGES.filter((s) => s.stage === activeStage).map((st) => (
          <div key={st.stage} className="p-5 space-y-3">
            <div>
              <h3 className="text-base font-bold text-white">{st.title}</h3>
              <p className="text-xs text-cyan-300 font-mono">{st.subtitle}</p>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-300 list-disc pl-5">
              {st.bullets.map((b, i) => (
                <li key={i} className="leading-relaxed">{b}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};
