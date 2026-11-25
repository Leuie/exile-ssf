import React, { useState, useEffect } from 'react';
import { Coins, TrendingUp, Calculator } from 'lucide-react';
import { formatValue } from './assetEngine';
import { readLiveFarmingSession, LIVE_SESSION_EVENT, type LiveFarmingSession } from '../../utils/activeSession';

interface MapCostPreset {
  label: string;
  scarabsChaos: number;
  mapDeviceChaos: number;
  chiselsRollChaos: number;
}

const COST_PRESETS: MapCostPreset[] = [
  { label: 'Alch & Go (SSF)', scarabsChaos: 0, mapDeviceChaos: 0, chiselsRollChaos: 2 },
  { label: 'Essence + Shrines', scarabsChaos: 8, mapDeviceChaos: 4, chiselsRollChaos: 3 },
  { label: 'Harvest + Scarabs', scarabsChaos: 22, mapDeviceChaos: 6, chiselsRollChaos: 4 },
  { label: 'T17 Full Juice', scarabsChaos: 65, mapDeviceChaos: 12, chiselsRollChaos: 18 }
];

const STORAGE_KEY = 'exile_ssf_map_cost_calc_v1';

interface MapCostCalculatorWidgetProps {
  totalSessionChaos: number;
  mapsRun: number;
  durationMinutes: number;
  divineChaos: number;
}

export const MapCostCalculatorWidget: React.FC<MapCostCalculatorWidgetProps> = ({
  totalSessionChaos,
  mapsRun,
  durationMinutes,
  divineChaos
}) => {
  const [scarabsChaos, setScarabsChaos] = useState<number>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return Number(saved.scarabsChaos ?? 8);
    } catch {
      return 8;
    }
  });
  const [mapDeviceChaos, setMapDeviceChaos] = useState<number>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return Number(saved.mapDeviceChaos ?? 4);
    } catch {
      return 4;
    }
  });
  const [chiselsRollChaos, setChiselsRollChaos] = useState<number>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return Number(saved.chiselsRollChaos ?? 3);
    } catch {
      return 3;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ scarabsChaos, mapDeviceChaos, chiselsRollChaos })
      );
    } catch {}
  }, [scarabsChaos, mapDeviceChaos, chiselsRollChaos]);

  const [liveSession, setLiveSession] = useState<LiveFarmingSession | null>(() => readLiveFarmingSession());

  useEffect(() => {
    const onUpdate = (e: Event) => {
      const detail = (e as CustomEvent<LiveFarmingSession>).detail;
      setLiveSession(detail || readLiveFarmingSession());
    };
    window.addEventListener(LIVE_SESSION_EVENT, onUpdate);
    return () => window.removeEventListener(LIVE_SESSION_EVENT, onUpdate);
  }, []);

  const costPerMap = Math.max(0, scarabsChaos + mapDeviceChaos + chiselsRollChaos);
  const usingMapTrackerSync = mapsRun <= 0 && Boolean(liveSession && liveSession.mapsCompleted > 0);
  const effectiveMaps = Math.max(0, usingMapTrackerSync ? liveSession!.mapsCompleted : mapsRun);
  const effectiveMinutes =
    durationMinutes > 0
      ? durationMinutes
      : liveSession && liveSession.elapsedMinutes > 0
      ? liveSession.elapsedMinutes
      : 0;
  const totalInvestmentChaos = costPerMap * effectiveMaps;
  const netProfitChaos = totalSessionChaos - totalInvestmentChaos;
  const hours = Math.max(effectiveMinutes / 60, 0.05);
  const netChaosPerHr = effectiveMinutes > 0 ? netProfitChaos / hours : 0;
  const roiPct =
    totalInvestmentChaos > 0
      ? Math.round((netProfitChaos / totalInvestmentChaos) * 100)
      : totalSessionChaos > 0
      ? 100
      : 0;

  return (
    <div className="space-y-3 text-xs">
      {/* Quick Investment Presets */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] font-mono uppercase text-slate-400 mr-1">Presets:</span>
        {COST_PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => {
              setScarabsChaos(p.scarabsChaos);
              setMapDeviceChaos(p.mapDeviceChaos);
              setChiselsRollChaos(p.chiselsRollChaos);
            }}
            className="px-2 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-400/50 text-[10px] font-mono text-slate-300 hover:text-amber-200 cursor-pointer"
          >
            {p.label} ({p.scarabsChaos + p.mapDeviceChaos + p.chiselsRollChaos}c/map)
          </button>
        ))}
      </div>

      {/* Per-Map Cost Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <label className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Scarabs (c / map)</span>
          <input
            type="number"
            min={0}
            value={scarabsChaos}
            onChange={(e) => setScarabsChaos(Math.max(0, Number(e.target.value) || 0))}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-400"
          />
        </label>
        <label className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Map Device Craft (c / map)</span>
          <input
            type="number"
            min={0}
            value={mapDeviceChaos}
            onChange={(e) => setMapDeviceChaos(Math.max(0, Number(e.target.value) || 0))}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-400"
          />
        </label>
        <label className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Chisels / Rolling (c / map)</span>
          <input
            type="number"
            min={0}
            value={chiselsRollChaos}
            onChange={(e) => setChiselsRollChaos(Math.max(0, Number(e.target.value) || 0))}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-400"
          />
        </label>
      </div>

      {/* Net Profit Results Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800">
          <div className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
            <Calculator className="w-3 h-3 text-slate-500" />
            <span>Total Investment</span>
          </div>
          <div className="text-base font-mono font-bold text-rose-300 mt-0.5">
            -{formatValue(totalInvestmentChaos, divineChaos)}
          </div>
          <div className="text-[10px] font-mono text-slate-500">
            {costPerMap}c × {effectiveMaps} maps
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800">
          <div className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
            <Coins className="w-3 h-3 text-amber-400" />
            <span>True Net Profit</span>
          </div>
          <div
            className={`text-base font-mono font-bold mt-0.5 ${
              netProfitChaos >= 0 ? 'text-emerald-300' : 'text-rose-400'
            }`}
          >
            {netProfitChaos >= 0 ? '+' : '-'}
            {formatValue(Math.abs(netProfitChaos), divineChaos)}
          </div>
          <div className="text-[10px] font-mono text-slate-500">
            Gross: {formatValue(totalSessionChaos, divineChaos)}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800">
          <div className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span>True Net / Hour</span>
          </div>
          <div
            className={`text-base font-mono font-bold mt-0.5 ${
              netChaosPerHr >= 0 ? 'text-emerald-300' : 'text-rose-400'
            }`}
          >
            {netChaosPerHr >= 0 ? '' : '-'}
            {formatValue(Math.abs(netChaosPerHr), divineChaos)}/hr
          </div>
          <div className="text-[10px] font-mono text-slate-500">
            over {durationMinutes || 0}m session
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800">
          <div className="text-[10px] font-mono uppercase text-slate-400">Net ROI</div>
          <div
            className={`text-base font-mono font-bold mt-0.5 ${
              roiPct >= 0 ? 'text-amber-300' : 'text-rose-400'
            }`}
          >
            {roiPct >= 0 ? `+${roiPct}%` : `${roiPct}%`}
          </div>
          <div className="text-[10px] font-mono text-slate-500">return on map cost</div>
        </div>
      </div>
    </div>
  );
};
