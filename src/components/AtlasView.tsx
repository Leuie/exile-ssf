import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  ExternalLink, 
  CheckCircle2, 
  Sparkles, 
  Crown, 
  RefreshCw, 
  Maximize2,
  Minimize2,
  Cloud,
  Gem
} from 'lucide-react';
import type { UserAccount } from '../types';
import { fetchUserToolState, saveUserToolState } from '../services/cloudSync';

interface AtlasViewProps {
  selectedGame?: 'poe1' | 'poe2';
  userAccount?: UserAccount | null;
}

interface AtlasProgressState {
  completedMaps: number;
  voidstones: { exarch: boolean; eater: boolean; maven: boolean; uberElder: boolean };
  favouredCount: number;
}

const DEFAULT_ATLAS_PROGRESS: AtlasProgressState = {
  completedMaps: 0,
  voidstones: { exarch: false, eater: false, maven: false, uberElder: false },
  favouredCount: 0
};

export const AtlasView: React.FC<AtlasViewProps> = ({ selectedGame = 'poe1', userAccount }) => {
  const [activeStage, setActiveStage] = useState<number>(1);
  const [isIframeFullscreen, setIsIframeFullscreen] = useState<boolean>(false);
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [cloudSynced, setCloudSynced] = useState<boolean>(false);
  const [progress, setProgress] = useState<AtlasProgressState>(() => {
    try {
      const saved = localStorage.getItem('exile_ssf_atlas_progress_v1');
      return saved ? { ...DEFAULT_ATLAS_PROGRESS, ...JSON.parse(saved) } : DEFAULT_ATLAS_PROGRESS;
    } catch {
      return DEFAULT_ATLAS_PROGRESS;
    }
  });

  useEffect(() => {
    if (!userAccount?.displayName) return;
    let cancelled = false;
    fetchUserToolState<AtlasProgressState>(userAccount.displayName, 'atlas_progress').then((data) => {
      if (!cancelled && data && typeof data === 'object') {
        setProgress({ ...DEFAULT_ATLAS_PROGRESS, ...data });
        setCloudSynced(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [userAccount?.displayName]);

  const updateProgress = (next: AtlasProgressState) => {
    setProgress(next);
    try {
      localStorage.setItem('exile_ssf_atlas_progress_v1', JSON.stringify(next));
    } catch {}
    if (userAccount?.displayName) {
      saveUserToolState(userAccount.displayName, 'atlas_progress', next).then((ok) => {
        if (ok) setCloudSynced(true);
      });
    }
  };

  const voidstoneCount = Object.values(progress.voidstones).filter(Boolean).length;
  void selectedGame;

  const stages = [
    {
      stageNumber: 1,
      title: 'The Sustain & Unlock Engine',
      points: '0 to 40 Points',
      themeColor: 'sky',
      focus: 'Map drop sustain, Kirac inventory resets, and early Essence gear crafting.',
      nodes: [
        'Commissioned Officer & Kirac Mission Wheels (guaranteed uncompleted map purchases)',
        'Shaping the Mountains (+10% chance for higher tier map drops)',
        'Shaping the Skies (+10% chance for higher tier map drops)',
        'Shaping the Valley (+10% chance for higher tier map drops)',
        'Essence Wheels (Center tree) to craft early resistance and life gear',
        'Jun / Betrayal wheels to unlock mandatory crafting bench affixes'
      ],
      strategy: 'Rush all "chance for one tier higher map drops" immediately. Never run a map without checking Kirac\'s inventory first after opening a mission.'
    },
    {
      stageNumber: 2,
      title: 'The Crafting & Economy Engine',
      points: '40 to 90 Points',
      themeColor: 'amber',
      focus: 'Rog expedition gear crafting, Harvest lifeforce, and Eldritch currency.',
      nodes: [
        'Expedition Wheels (Focusing on Rog for 5x T1 rare bases and Tujen for raw currency)',
        'Harvest Horticrafting Wheels (Lifeforce for resistance swapping and reforge crafting)',
        'Searing Exarch / Eater of Worlds Altar Wheels for Eldritch Ichors and Embers',
        'Sulphite / Delve wheels if chasing delve specific fossils or resonators'
      ],
      strategy: 'Use Rog to craft near Best in Slot armour and jewellery for red maps. Store duplicate guardian fragments for Harvest 1 to 1 swaps.'
    },
    {
      stageNumber: 3,
      title: 'The Boss Rush & Threads of Creation Engine',
      points: '90 to 150 Points',
      themeColor: 'purple',
      focus: 'Destructive Play Maven guardian farming, Threads of Creation threshold weaving, and Favoured Map layouts.',
      nodes: [
        'Destructive Play (Maven summons 1 to 3 additional bosses for massive guardian map drops)',
        'Remnants of the Past & Vivid Memories (+3% chance for map bosses to drop Shaper/Elder maps)',
        'Threads of Creation wheels (3, 6, and 8 Thread thresholds for pack density, magic monster chance, and duplicated bosses)',
        'Celestial Presence notable (guaranteeing Eldritch Altars always offer Map Boss, Player, or Influenced Monster options)',
        'Runic Distortion notable (preventing unwanted Suffix modifiers on Expedition Remnants)',
        'Archon of Corruption Hideout Anomalies manifesting on T16 maps with socketed Voidstones'
      ],
      strategy: 'Farm Shaper, Elder, and Conqueror guardian sets rapidly. Use Destructive Play to maintain endless 10 boss Maven invitations and weave Threads of Creation at 3, 6, and 8 thresholds for maximum loot scaling.'
    }
  ];

  return (
    <div className="w-full space-y-8 pb-20 font-sans text-slate-200">
      
      {/* Header Masthead */}
      <header className="p-5 sm:p-6 rounded-2xl border border-slate-800 bg-slate-900/85 backdrop-blur-md space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-widest text-sky-400">
          <Compass className="w-4 h-4" />
          <span>Endgame Mapping & Strategy</span>
          {cloudSynced && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-[10px] font-mono text-emerald-300 normal-case">
              <Cloud className="w-3 h-3" />
              <span>Cloud Synced</span>
            </span>
          )}
        </div>
        <h1 className="text-3xl sm:text-5xl font-poe font-bold text-slate-100">
          Atlas of Worlds & Mapping
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-3xl leading-relaxed">
          The comprehensive Solo Self Found guide to 100% map sustain, progressive Atlas passive trees, Voidstone unlocks, and the interactive Atlas tree planner.
        </p>
      </header>

      {/* Interactive Voidstone & Atlas Completion Tracker (Cloud Synced) */}
      <section className="p-5 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-slate-900 via-indigo-950/25 to-slate-900 space-y-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-amber-300">
            <Gem className="w-4 h-4 text-amber-400" />
            <span>My Atlas Progression Tracker</span>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-emerald-300 font-bold">
              {voidstoneCount}/4 Voidstones
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-sky-300 font-bold">
              {progress.completedMaps}/115 Bonus Objectives
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(
              [
                { key: 'exarch', label: 'Searing Exarch', color: 'rose' },
                { key: 'eater', label: 'Eater of Worlds', color: 'sky' },
                { key: 'maven', label: 'The Maven', color: 'purple' },
                { key: 'uberElder', label: 'Uber Elder', color: 'amber' }
              ] as const
            ).map((vs) => {
              const active = progress.voidstones[vs.key];
              return (
                <button
                  key={vs.key}
                  type="button"
                  onClick={() =>
                    updateProgress({
                      ...progress,
                      voidstones: { ...progress.voidstones, [vs.key]: !active }
                    })
                  }
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    active
                      ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-200'
                      : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <span className="text-xs font-bold truncate">{vs.label}</span>
                  <CheckCircle2 className={`w-4 h-4 shrink-0 ${active ? 'text-emerald-400' : 'text-slate-600'}`} />
                </button>
              );
            })}
          </div>

          <div className="lg:col-span-5 flex flex-wrap items-center gap-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <div className="flex-1 min-w-[140px]">
              <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                <span>Atlas Bonus</span>
                <span className="text-sky-300 font-bold">{progress.completedMaps} / 115</span>
              </div>
              <input
                type="range"
                min={0}
                max={115}
                value={progress.completedMaps}
                onChange={(e) => updateProgress({ ...progress, completedMaps: Number(e.target.value) })}
                className="w-full accent-sky-400 cursor-pointer"
              />
            </div>
            <div className="w-24">
              <div className="text-[10px] font-mono text-slate-400 mb-1">Favoured</div>
              <input
                type="number"
                min={0}
                max={12}
                value={progress.favouredCount}
                onChange={(e) => updateProgress({ ...progress, favouredCount: Math.max(0, Math.min(12, Number(e.target.value) || 0)) })}
                className="w-full px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-white"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section 1: The 100% Map Sustain Playbook */}
      <section className="space-y-5">
        <div className="border-b border-slate-800 pb-2.5">
          <span className="text-xs uppercase font-mono tracking-widest text-sky-600 dark:text-sky-400 font-bold">
            Core Foundation
          </span>
          <h2 className="text-2xl font-poe font-bold text-slate-900 dark:text-slate-100 mt-0.5">
            The 100% Map Sustain Playbook
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-3xl border border-slate-800 bg-slate-900/75 space-y-2.5">
            <div className="text-xs font-mono font-bold text-sky-600 dark:text-sky-400 uppercase">Trick 1 • 3 to 1 Recipe</div>
            <h3 className="font-poe font-bold text-lg text-slate-900 dark:text-slate-100">Deterministic Upgrades</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Sell 3 maps of the same base to any vendor for 1 connected map of 1 tier higher. If the vendor gives a duplicate map you already completed, <strong>swap one of the 3 maps</strong> with another copy to change the outcome!
            </p>
          </div>

          <div className="p-5 rounded-3xl border border-slate-800 bg-slate-900/75 space-y-2.5">
            <div className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 uppercase">Trick 2 • Kirac Resets</div>
            <h3 className="font-poe font-bold text-lg text-slate-900 dark:text-slate-100">Free Shop Refreshes</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Every single time you open a <strong>Kirac Mission</strong> at your map device, Kirac's inventory completely resets! Immediately check his shop before and after running the mission for uncompleted bonus objective maps.
            </p>
          </div>

          <div className="p-5 rounded-3xl border border-slate-800 bg-slate-900/75 space-y-2.5">
            <div className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400 uppercase">Trick 3 • Horizon Orbs</div>
            <h3 className="font-poe font-bold text-lg text-slate-900 dark:text-slate-100">Same Tier Rerolls</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              An Orb of Horizons rerolls a map into another natural map of the <strong>exact same tier</strong>. If you have 6 copies of Dunes in Tier 8 and zero copies of Cemetery, reroll them with Horizon Orbs to complete your bonus objectives.
            </p>
          </div>
        </div>
      </section>

      {/* Section 2: Interactive PoE Atlas Tree Tool */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <span className="text-xs uppercase font-mono tracking-widest text-emerald-600 dark:text-emerald-400 font-bold">
              Interactive Planner
            </span>
            <h2 className="text-2xl font-poe font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              PoE Atlas Interactive Tree & Explorer
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIframeKey(prev => prev + 1)}
              className="p-2 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-800 hover:text-amber-500 text-slate-600 dark:text-slate-300 transition-colors"
              title="Reload interactive Atlas"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsIframeFullscreen(!isIframeFullscreen)}
              className="p-2 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-800 hover:text-sky-500 text-slate-600 dark:text-slate-300 transition-colors"
              title="Toggle expanded view"
            >
              {isIframeFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <a
              href="https://poe-atlas.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm hover:bg-amber-400 transition-colors"
            >
              Open PoE-Atlas.com <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <div className={`rounded-3xl border border-slate-800 overflow-hidden bg-slate-950 shadow-xl transition-all ${
          isIframeFullscreen ? 'fixed inset-4 z-50 rounded-2xl' : 'h-[650px] w-full'
        }`}>
          <iframe
            key={iframeKey}
            src="https://poe-atlas.com/"
            title="PoE Atlas Tree Interactive Tool"
            className="w-full h-full border-0"
            loading="lazy"
            allow="fullscreen"
          />
        </div>
      </section>

      {/* Section 3: Progressive Atlas Passive Tree Stages */}
      <section className="space-y-6 pt-4">
        <div className="border-b border-slate-800 pb-3">
          <span className="text-xs uppercase font-mono tracking-widest text-purple-600 dark:text-purple-400 font-bold">
            Progressive Strategy
          </span>
          <h2 className="text-2xl sm:text-3xl font-poe font-bold text-slate-900 dark:text-slate-100 mt-1">
            Atlas Passive Tree Roadmap (3 Stages)
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Follow this 3 stage progression to ensure you never get map starved and deterministically acquire your gear.
          </p>
        </div>

        {/* Stage Selector Tabs */}
        <div className="flex gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
          {stages.map((stg) => (
            <button
              key={stg.stageNumber}
              onClick={() => setActiveStage(stg.stageNumber)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
                activeStage === stg.stageNumber
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'bg-white dark:bg-slate-900/80 border border-slate-800 text-slate-700 dark:text-slate-300 hover:text-amber-500'
              }`}
            >
              <span>Stage {stg.stageNumber}:</span>
              <span>{stg.points}</span>
            </button>
          ))}
        </div>

        {/* Active Stage Card */}
        {(() => {
          const current = stages.find(s => s.stageNumber === activeStage) || stages[0];
          return (
            <div className="p-6 sm:p-8 rounded-2xl border border-slate-800 bg-slate-900/80 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 uppercase">
                    Stage {current.stageNumber} • {current.points}
                  </span>
                  <h3 className="text-2xl font-poe font-bold text-slate-900 dark:text-slate-100 mt-1">
                    {current.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {current.focus}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-xs font-bold uppercase font-mono text-slate-400">Key Nodes to Allocate:</div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {current.nodes.map((node, nIdx) => (
                    <li key={nIdx} className="p-3 rounded-2xl bg-slate-50 dark:bg-poe-dark/40 border border-slate-800 flex items-start gap-2 text-slate-700 dark:text-slate-300 leading-relaxed">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>{node}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-950 dark:text-amber-200 leading-relaxed">
                <strong>SSF Strategy:</strong> {current.strategy}
              </div>
            </div>
          );
        })()}
      </section>

      {/* Section 4: Voidstones Priority & Harvest Fragment Swaps */}
      <section className="space-y-6 pt-4">
        <div className="border-b border-slate-800 pb-3">
          <span className="text-xs uppercase font-mono tracking-widest text-rose-600 dark:text-rose-400 font-bold">
            Endgame Voidstones
          </span>
          <h2 className="text-2xl sm:text-3xl font-poe font-bold text-slate-900 dark:text-slate-100 mt-1">
            Voidstone Priority Roadmap & Harvest Swaps
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 shadow-sm space-y-4">
            <h3 className="font-poe font-bold text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              The 4 Voidstone Progression
            </h3>
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/25 space-y-1">
                <div className="font-bold text-rose-700 dark:text-rose-300">1. Searing Exarch (Red Voidstone)</div>
                <p className="text-slate-600 dark:text-slate-300">Complete T14+ red maps to spawn quest invitation. Straightforward DPS race; avoid rolling meteors.</p>
              </div>
              <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/25 space-y-1">
                <div className="font-bold text-sky-700 dark:text-sky-300">2. Eater of Worlds (Blue Voidstone)</div>
                <p className="text-slate-600 dark:text-slate-300">Complete T14+ red maps to spawn quest invitation. Stand in the lightning orbs during inevitable doom phase.</p>
              </div>
              <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/25 space-y-1">
                <div className="font-bold text-purple-700 dark:text-purple-300">3. The Maven (Ceremonial Voidstone)</div>
                <p className="text-slate-600 dark:text-slate-300">Run 10 boss invitations for 10 Splinters → Maven's Writ. Focus on memory game patterns and beam avoidance.</p>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-1">
                <div className="font-bold text-emerald-700 dark:text-emerald-300">4. The Uber Elder (Decayed Voidstone)</div>
                <p className="text-slate-600 dark:text-slate-300">Defeat Shaper and Elder to collect 4 fragments for The Realm of the Shaper. Grants the 4th and final Voidstone.</p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <h3 className="font-poe font-bold text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-500" />
                The Harvest Fragment Swap Masterclass
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                In Solo Self Found, you will frequently find 5x <em>Fragment of the Hydra</em> and zero copies of <em>Fragment of the Phoenix</em>. Do not waste dozens of maps hoping for a lucky drop!
              </p>

              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-2">
                <div className="font-bold text-emerald-800 dark:text-emerald-300">How to 1 to 1 Swap Duplicate Fragments:</div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-700 dark:text-slate-300">
                  <li>Enter your <strong>Horticrafting Station (Harvest)</strong>.</li>
                  <li>Scroll down to the <strong>Sacrifice / Swap</strong> crafting section.</li>
                  <li>Place your duplicate fragment into the bench and spend <strong>75 Vivid (Yellow) or Wild (Purple) Lifeforce</strong>.</li>
                  <li>The bench transforms your duplicate into another random fragment in the set!</li>
                </ol>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-poe-dark/50 border border-slate-800 text-xs text-slate-600 dark:text-slate-400">
              Works on: Shaper Fragments, Elder Fragments, Conqueror Fragments, and Sirus Crests.
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
