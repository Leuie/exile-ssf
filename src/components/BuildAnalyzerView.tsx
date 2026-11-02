import React, { useState } from 'react';
import { 
  Stethoscope, 
  ShieldCheck, 
  Swords, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Flame, 
  Hammer, 
  ChevronDown, 
  ChevronUp, 
  Zap, 
  Info,
  Palette,
  Sliders,
  FlaskConical,
  Check
} from 'lucide-react';
import { decodePoBCode, parsePoBXml } from '../utils/pobDecoder';
import { analyzeBuild } from '../utils/buildAnalyzer';
import type { ParsedCharacter, AnalysisReport, DiagnosticItem } from '../types/analyzer';

export const BuildAnalyzerView: React.FC = () => {
  const [pobInput, setPobInput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState<'balanced' | 'ehp' | 'damage'>('balanced');
  const [parsedChar, setParsedChar] = useState<ParsedCharacter | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [expandedDiagId, setExpandedDiagId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'recommendations' | 'equipment' | 'gems' | 'chromatics' | 'flasks' | 'simulator'>('recommendations');
  
  // Dynamic Simulator State
  const [simBlockCap, setSimBlockCap] = useState<boolean>(false);
  const [simPhysShift, setSimPhysShift] = useState<boolean>(false);
  const [simPlusGem, setSimPlusGem] = useState<boolean>(false);
  const [simChaosRes, setSimChaosRes] = useState<boolean>(false);
  const [simEssenceHorror, setSimEssenceHorror] = useState<boolean>(false);
  const [simFlasks, setSimFlasks] = useState<boolean>(false);

  const handleAnalyze = (inputString: string, forcedGroupId?: string) => {
    if (!inputString.trim()) {
      setErrorMessage('Please paste a Path of Building export string to analyze your character.');
      return;
    }
    setErrorMessage(null);
    try {
      const xml = decodePoBCode(inputString);
      const character = parsePoBXml(xml);
      const groupId = forcedGroupId || selectedGroupId || character.selectedSkillGroupId;
      const analysis = analyzeBuild(character, groupId);
      setParsedChar(character);
      setSelectedGroupId(groupId);
      setReport(analysis);
      if (analysis.diagnostics.length > 0) {
        setExpandedDiagId(analysis.diagnostics[0].id);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to parse Path of Building data. Please ensure the code is complete.');
    }
  };

  const handleSelectSkillGroup = (groupId: string) => {
    setSelectedGroupId(groupId);
    if (parsedChar) {
      const analysis = analyzeBuild(parsedChar, groupId);
      setReport(analysis);
    }
  };

  const handleClear = () => {
    setPobInput('');
    setParsedChar(null);
    setSelectedGroupId('');
    setReport(null);
    setErrorMessage(null);
  };

  const getFilteredDiagnostics = (): DiagnosticItem[] => {
    if (!report) return [];
    if (focusMode === 'ehp') {
      return [...report.ehpUpgrades, ...report.optimalBadges.filter((d) => d.impactType === 'ehp')];
    }
    if (focusMode === 'damage') {
      return [...report.damageUpgrades, ...report.optimalBadges.filter((d) => d.impactType === 'damage')];
    }
    return report.diagnostics;
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'S': return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10 shadow-emerald-500/20';
      case 'A': return 'text-indigo-400 border-indigo-500/40 bg-indigo-500/10 shadow-indigo-500/20';
      case 'B': return 'text-purple-400 border-purple-500/40 bg-purple-500/10 shadow-purple-500/20';
      case 'C': return 'text-amber-400 border-amber-500/40 bg-amber-500/10 shadow-amber-500/20';
      case 'D': return 'text-rose-400 border-rose-500/40 bg-rose-500/10 shadow-rose-500/20';
      default: return 'text-red-500 border-red-600/40 bg-red-600/10 shadow-red-600/20';
    }
  };

  const getRarityBadgeColor = (rarity: string) => {
    switch (rarity) {
      case 'UNIQUE': return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'RARE': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
      case 'MAGIC': return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40';
      default: return 'bg-slate-200 dark:bg-[#2d2d44] text-slate-600 dark:text-slate-400 border-slate-700';
    }
  };

  const getGemColorBadge = (color?: 'R' | 'G' | 'B' | 'W') => {
    switch (color) {
      case 'R': return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
      case 'G': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'B': return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40';
      default: return 'bg-slate-200 dark:bg-[#2d2d44] text-slate-700 dark:text-slate-200 border-slate-400/40';
    }
  };

  const selectedGroup = parsedChar?.skillGroups.find(g => g.id === selectedGroupId) || parsedChar?.skillGroups[0];

  // Dynamic Contextual Simulator Calculations
  const isChaosCapped = (parsedChar?.stats.chaosRes || 0) >= 60;
  const isEssenced = (selectedGroup?.pseudoLinks || 0) > 0 || (selectedGroup?.effectiveLinks || 0) >= 6;
  const isBlockArchetype = (parsedChar?.stats.block || 0) >= 40 || (parsedChar?.stats.spellBlock || 0) >= 30 || (parsedChar?.stats.hasLifeOnBlock || false);

  let simEhpBoost = 0;
  let simDpsBoost = 0;
  if (simBlockCap) simEhpBoost += 15;
  if (simPhysShift) simEhpBoost += 16;
  if (simChaosRes && !isChaosCapped) simEhpBoost += 15;
  if (simFlasks) { simEhpBoost += 8; simDpsBoost += 6; }
  if (simPlusGem) simDpsBoost += 14;
  if (simEssenceHorror && !isEssenced) simDpsBoost += 30;

  const simulatedEhp = report ? Math.min(100, report.ehpScore + simEhpBoost) : 0;
  const simulatedDps = report ? Math.min(100, report.dpsScore + simDpsBoost) : 0;
  const simulatedOverall = Math.round(simulatedEhp * 0.55 + simulatedDps * 0.45);

  return (
    <div className="space-y-8 w-full space-y-6 pb-20 font-sans text-slate-200">
      
      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-900/85 p-5 sm:p-6 rounded-2xl backdrop-blur-md shadow-sm relative z-10 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-xs font-semibold uppercase tracking-wider">
              <Stethoscope className="w-3.5 h-3.5" />
              Exclusive Tool • PoB Build Doctor & Character Optimizer
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">Client Side • Zero Server Latency</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-poppins font-bold text-slate-900 dark:text-slate-100 leading-tight">
            PoB Character Analyzer & Build Doctor
          </h1>

          <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 max-w-3xl leading-relaxed">
            Import any Path of Building export string to run an instantaneous diagnostic health check. 
            Select your main damage skill, evaluate built in gear pseudo link multipliers (e.g. Essence of Horror & Elder mods), recognize diverse defenses like <strong>Life on Block</strong> and <strong>Aegis Aurora</strong>, calculate chromatic socket coloring, and get deterministic SSF crafting steps to upgrade your <strong>Damage</strong> or <strong>Effective Health Pool (EHP)</strong>.
          </p>
      </div>

      {/* Input Box */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-5 shadow-sm">
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Paste Path of Building Export String (or raw XML / pobb.in):
          </label>
          <textarea
            value={pobInput}
            onChange={(e) => setPobInput(e.target.value)}
            placeholder="Paste your PoB base64 export string (or raw XML) here..."
            rows={4}
            className="w-full p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors resize-y shadow-inner"
          />
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleAnalyze(pobInput)}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition-all hover:scale-105 cursor-pointer"
            >
              <Stethoscope className="w-4 h-4" />
              Run Build Doctor Diagnosis
            </button>
            <button
              onClick={handleClear}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-200 dark:hover:bg-[#3f3f5f] text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>

          {parsedChar && (
            <div className="text-xs font-mono text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Loaded: <strong className="text-slate-800 dark:text-slate-200">{parsedChar.characterName}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Analysis Results View */}
      {report && parsedChar && (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* Executive Diagnostic Scorecard */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 space-y-6 shadow-sm">
            
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
              
              {/* Character Identity & Overall Grade */}
              <div className="flex items-center gap-5">
                <div className={`w-20 h-20 rounded-3xl border-2 flex flex-col items-center justify-center shadow-lg ${getGradeColor(report.grade)}`}>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Grade</span>
                  <span className="text-3xl font-black font-orbitron leading-none">{report.grade}</span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-poppins font-bold text-slate-900 dark:text-slate-100">
                      {parsedChar.characterName}
                    </h2>
                    <span className="text-xs font-orbitron px-2.5 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-600 dark:text-indigo-300 font-bold">
                      Level {parsedChar.level}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2 font-mono">
                    <span>{parsedChar.ascendClassName !== 'None' ? parsedChar.ascendClassName : parsedChar.className}</span>
                    <span>•</span>
                    <span className="px-2.5 py-0.5 rounded-full badge-gaming-primary">
                      {report.defenseArchetype}
                    </span>
                    <span>•</span>
                    <span>Score: <strong className="text-slate-900 dark:text-slate-100 font-orbitron">{report.overallScore}/100</strong></span>
                  </div>
                </div>
              </div>

              {/* Focus Mode Selector Switch */}
              <div className="flex flex-col items-start lg:items-end gap-2 w-full lg:w-auto">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Target Upgrade Priority:
                </div>
                <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-[#0f172a] border border-slate-800">
                  <button
                    onClick={() => setFocusMode('ehp')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      focusMode === 'ehp'
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Boost EHP / Survivability
                  </button>

                  <button
                    onClick={() => setFocusMode('damage')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      focusMode === 'damage'
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <Swords className="w-3.5 h-3.5" />
                    Boost Damage Output
                  </button>

                  <button
                    onClick={() => setFocusMode('balanced')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      focusMode === 'balanced'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Balanced Full Audit
                  </button>
                </div>
              </div>

            </div>

            {/* Interactive Main Skill Group Selector */}
            <div className="p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-indigo-400" />
                  Select Main Skill Group to Analyze ({parsedChar.skillGroups.length} Detected):
                </div>
                {selectedGroup && selectedGroup.pseudoLinks > 0 && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full badge-gaming-secondary">
                    <Sparkles className="w-3.5 h-3.5" />
                    Pseudo {selectedGroup.effectiveLinks} Link Active ({selectedGroup.physicalLinks} Sockets + {selectedGroup.pseudoLinks} Gear Multipliers)
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {parsedChar.skillGroups.map((group) => {
                  const isSelected = group.id === selectedGroupId;
                  const activeGems = group.gems.filter(g => !g.isSupport);
                  const activeGemLabel = activeGems.map(g => g.name).join(' + ') || group.gems[0]?.name || group.label;
                  
                  return (
                    <button
                      key={group.id}
                      onClick={() => handleSelectSkillGroup(group.id)}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-500/25 text-indigo-950 dark:text-indigo-100 shadow-md ring-2 ring-indigo-500/60'
                          : 'border-slate-800 bg-slate-950/70 text-slate-700 dark:text-slate-300 hover:border-indigo-500/50 hover:bg-slate-100 dark:hover:bg-[#2d2d44]/60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs font-poppins truncate">{activeGemLabel}</span>
                        <span className="text-[10px] font-orbitron font-bold px-2 py-0.5 rounded-full badge-gaming-primary">
                          {group.effectiveLinks} Links
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center justify-between">
                        <span>{group.slot || 'Socket Group'}</span>
                        <div className="flex items-center gap-1">
                          <span className="font-mono">{group.gems.length} Sockets</span>
                          {group.pseudoLinks > 0 && (
                            <span className="text-emerald-400 font-bold font-mono">+{group.pseudoLinks} Gear</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedGroup && selectedGroup.pseudoSupportNames.length > 0 && (
                <div className="text-xs text-slate-700 dark:text-slate-300 pt-2 border-t border-indigo-500/20 flex flex-wrap items-center gap-1.5">
                  <span className="font-bold text-indigo-700 dark:text-indigo-300">Gear Multipliers Active on {selectedGroup.slot}:</span>
                  {selectedGroup.pseudoSupportNames.map((pName, pIdx) => (
                    <span key={pIdx} className="px-2 py-0.5 rounded-md bg-indigo-500/20 border border-indigo-500/30 text-[11px] font-mono">
                      {pName}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Score Meters & Summary Text */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* EHP Score Meter */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      EHP & Defense Score
                    </span>
                    <span className="font-orbitron font-bold text-emerald-600 dark:text-emerald-400">{report.ehpScore}/100</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-[#1a1a2e] h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500" 
                      style={{ width: `${report.ehpScore}%` }} 
                    />
                  </div>
                </div>

                {/* DPS Score Meter */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Swords className="w-4 h-4 text-indigo-400" />
                      Damage Scaling Score
                    </span>
                    <span className="font-orbitron font-bold text-indigo-600 dark:text-indigo-400">{report.dpsScore}/100</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-[#1a1a2e] h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-500 transition-all duration-500" 
                      style={{ width: `${report.dpsScore}%` }} 
                    />
                  </div>
                </div>

              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{report.summary}</span>
              </div>
            </div>

            {/* Live Character Vital Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
              
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500 dark:text-slate-400">Total Hit Pool</div>
                <div className="text-base font-bold font-orbitron text-slate-900 dark:text-slate-100">
                  {(parsedChar.stats.life + parsedChar.stats.energyShield).toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500">{parsedChar.stats.life} Life • {parsedChar.stats.energyShield} ES</div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500 dark:text-slate-400">Resistances</div>
                <div className="text-xs font-bold font-orbitron space-x-1">
                  <span className={parsedChar.stats.fireRes >= 75 ? 'text-emerald-400' : 'text-rose-400'}>{parsedChar.stats.fireRes}%</span>
                  <span className={parsedChar.stats.coldRes >= 75 ? 'text-emerald-400' : 'text-rose-400'}>{parsedChar.stats.coldRes}%</span>
                  <span className={parsedChar.stats.lightningRes >= 75 ? 'text-emerald-400' : 'text-rose-400'}>{parsedChar.stats.lightningRes}%</span>
                </div>
                <div className="text-[10px] text-slate-500">Fire / Cold / Light</div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500 dark:text-slate-400">Chaos Res</div>
                <div className={`text-base font-bold font-orbitron ${parsedChar.stats.chaosRes >= 60 ? 'text-emerald-400' : parsedChar.stats.chaosRes >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                  {parsedChar.stats.chaosRes}%
                </div>
                <div className="text-[10px] text-slate-500">{parsedChar.stats.chaosRes >= 60 ? 'Capped / Safe' : 'Vulnerable'}</div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500 dark:text-slate-400">Block / Recovery</div>
                <div className={`text-base font-bold font-orbitron ${parsedChar.stats.block >= 40 ? 'text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>
                  {parsedChar.stats.block}% / {parsedChar.stats.spellBlock}%
                </div>
                <div className="text-[10px] text-slate-500">
                  {parsedChar.stats.hasEsOnBlock ? 'Aegis ES on Block' : parsedChar.stats.hasLifeOnBlock ? 'Life on Block' : 'No On-Block Recov'}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500 dark:text-slate-400">Armour / Evasion</div>
                <div className="text-xs font-bold font-orbitron text-slate-800 dark:text-slate-200 truncate">
                  {parsedChar.stats.armour.toLocaleString()} / {parsedChar.stats.evasion.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500">{parsedChar.stats.lifeRegen} HP Regen/s</div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500 dark:text-slate-400">Effective Links</div>
                <div className={`text-base font-bold font-orbitron ${selectedGroup && selectedGroup.effectiveLinks >= 6 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {selectedGroup ? selectedGroup.effectiveLinks : parsedChar.stats.mainLinkCount} Link
                </div>
                <div className="text-[10px] text-slate-500">{parsedChar.stats.manaUnreservedPercent}% Open Mana</div>
              </div>

            </div>

          </div>

          {/* Sub Navigation Bar */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
            <button
              onClick={() => setActiveTab('recommendations')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'recommendations'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              Prioritized Recommendations ({getFilteredDiagnostics().length})
            </button>

            <button
              onClick={() => setActiveTab('equipment')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'equipment'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Gear Suffix & Eldritch Audit ({parsedChar.items.length})
            </button>

            <button
              onClick={() => setActiveTab('gems')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'gems'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Flame className="w-4 h-4" />
              Gem Links & Aura Setups ({parsedChar.skillGroups.length})
            </button>

            <button
              onClick={() => setActiveTab('chromatics')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'chromatics'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Palette className="w-4 h-4" />
              Chromatic Calculator
            </button>

            <button
              onClick={() => setActiveTab('flasks')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'flasks'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <FlaskConical className="w-4 h-4" />
              Flask Audit ({parsedChar.flasks.length})
            </button>

            <button
              onClick={() => setActiveTab('simulator')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'simulator'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Sliders className="w-4 h-4" />
              What-If Upgrade Simulator
            </button>
          </div>

          {/* Tab 1: Prioritized Action Items */}
          {activeTab === 'recommendations' && (
            <div className="space-y-4">
              {getFilteredDiagnostics().map((diag) => {
                const isExpanded = expandedDiagId === diag.id;
                const isCritical = diag.severity === 'critical';
                const isWarning = diag.severity === 'warning';

                return (
                  <div
                    key={diag.id}
                    className={`rounded-3xl border transition-all ${
                      isCritical
                        ? 'border-rose-500/40 bg-rose-500/5 hover:border-rose-500/60'
                        : isWarning
                        ? 'border-amber-500/40 bg-amber-500/5 hover:border-amber-500/60'
                        : 'border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-500/60'
                    }`}
                  >
                    <div 
                      onClick={() => setExpandedDiagId(isExpanded ? null : diag.id)}
                      className="p-5 flex items-center justify-between cursor-pointer gap-4"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                          isCritical ? 'bg-rose-500/20 text-rose-400' :
                          isWarning ? 'bg-amber-500/20 text-amber-400' :
                          'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {isCritical ? <AlertTriangle className="w-5 h-5" /> :
                           isWarning ? <Zap className="w-5 h-5" /> :
                           <CheckCircle2 className="w-5 h-5" />}
                        </div>

                        <div className="truncate">
                          <div className="flex items-center gap-2">
                            <span className="font-poppins font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                              {diag.title}
                            </span>
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                              isCritical ? 'bg-rose-500/20 text-rose-300' :
                              isWarning ? 'bg-amber-500/20 text-amber-300' :
                              'bg-emerald-500/20 text-emerald-300'
                            }`}>
                              {diag.severity}
                            </span>
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-400 truncate mt-0.5">
                            {diag.description}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="hidden sm:inline-block text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-slate-200/60 dark:bg-[#2d2d44] text-slate-700 dark:text-slate-300">
                          {diag.estimatedImpact}
                        </span>
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                      </div>
                    </div>

                    {/* Expandable SSF Resolution Card */}
                    {isExpanded && (
                      <div className="px-5 pb-5 pt-2 border-t border-slate-200/60 dark:border-[#2d2d44] space-y-4">
                        <div className="space-y-1">
                          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Diagnosis Details</div>
                          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                            {diag.description}
                          </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 space-y-2">
                          <div className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                            <Hammer className="w-4 h-4 text-indigo-400" />
                            Deterministic SSF Crafting Fix:
                          </div>
                          <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-sans leading-relaxed">
                            {diag.ssfCraftingFix}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {diag.tags.map((tag) => (
                            <span key={tag} className="text-[10px] font-mono px-2 py-0.5 rounded badge-gaming-primary">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab 2: Gear Suffix & Eldritch Audit */}
          {activeTab === 'equipment' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {parsedChar.items.map((item, idx) => (
                <div key={idx} className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase text-indigo-600 dark:text-indigo-400">{item.slot}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${getRarityBadgeColor(item.rarity)}`}>
                      {item.rarity} {item.itemLevel ? `• iLvl ${item.itemLevel}` : ''}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-poppins font-bold text-slate-900 dark:text-slate-100 text-base">{item.name}</h4>
                    {item.baseName && item.baseName !== item.name && (
                      <div className="text-xs text-slate-500 dark:text-slate-400">{item.baseName}</div>
                    )}
                  </div>

                  {/* Pseudo Links / Essences on this item */}
                  {item.pseudoSupportMods.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-700 dark:text-emerald-300 font-semibold space-y-1">
                      <div className="flex items-center gap-1.5 font-bold uppercase text-[10px]">
                        <Sparkles className="w-3.5 h-3.5" />
                        Built in Support Multipliers:
                      </div>
                      {item.pseudoSupportMods.map((pMod, pIdx) => (
                        <div key={pIdx} className="font-mono text-[11px]">• {pMod}</div>
                      ))}
                    </div>
                  )}

                  {/* Eldritch Implicits */}
                  {item.eldritchMods.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-700 dark:text-indigo-300 space-y-0.5">
                      <span className="font-bold text-[10px] uppercase">Eldritch Implicits:</span>
                      {item.eldritchMods.map((eMod, eIdx) => (
                        <div key={eIdx} className="font-sans text-[11px]">• {eMod}</div>
                      ))}
                    </div>
                  )}

                  {/* Standard Implicits */}
                  {item.implicitMods.length > 0 && (
                    <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-[#2d2d44]">
                      {item.implicitMods.map((iMod, iIdx) => (
                        <div key={iIdx} className="text-xs text-slate-500 font-sans italic">
                          (implicit) {iMod}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Explicit Affixes */}
                  {item.explicitMods.length > 0 && (
                    <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-[#2d2d44]">
                      {item.explicitMods.slice(0, 7).map((mod, mIdx) => (
                        <div key={mIdx} className="text-xs text-slate-700 dark:text-slate-300 font-sans">
                          • {mod}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Crafted Mods */}
                  {item.craftedMods.length > 0 && (
                    <div className="pt-1 border-t border-slate-100 dark:border-[#2d2d44]">
                      {item.craftedMods.map((cMod, cIdx) => (
                        <div key={cIdx} className="text-xs text-indigo-400 font-sans font-medium">
                          {cMod} (Crafted)
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Tab 3: Gem Links & Aura Setups */}
          {activeTab === 'gems' && (
            <div className="space-y-4">
              {parsedChar.skillGroups.map((group, idx) => (
                <div key={idx} className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold uppercase text-slate-500">{group.slot || `Socket Group ${idx + 1}`}</span>
                      {group.id === selectedGroupId && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full badge-gaming-primary">
                          Selected Main Skill
                        </span>
                      )}
                      {group.pseudoLinks > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full badge-gaming-secondary">
                          +{group.pseudoLinks} Gear Multipliers
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono text-slate-400">{group.gems.length} Sockets • Effective {group.effectiveLinks} Links</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {group.gems.map((gem, gIdx) => (
                      <div key={gIdx} className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-mono font-bold ${getGemColorBadge(gem.color)}`}>
                            {gem.color || 'B'}
                          </span>
                          <span className={`font-semibold ${gem.isSupport ? 'text-indigo-400' : 'text-purple-400'}`}>
                            {gem.name}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-500">
                          Lvl {gem.level} / {gem.quality}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 4: Chromatic Socket & Coloring Calculator */}
          {activeTab === 'chromatics' && (
            <div className="space-y-6">
              {report.chromaticAdvice ? (
                <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="font-poppins font-bold text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Palette className="w-5 h-5 text-indigo-400" />
                        Chromatic Advice for {report.chromaticAdvice.slot} ({report.chromaticAdvice.baseName})
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Base Requirements: {report.chromaticAdvice.reqStr} Str • {report.chromaticAdvice.reqDex} Dex • {report.chromaticAdvice.reqInt} Int
                      </p>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono border ${
                      report.chromaticAdvice.difficulty === 'Difficult' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
                      'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    }`}>
                      {report.chromaticAdvice.difficulty} Off Colors
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-center">
                      <div className="text-xs text-rose-400 font-bold">Red Sockets</div>
                      <div className="text-xl font-bold font-orbitron text-slate-900 dark:text-slate-100">{report.chromaticAdvice.desiredColors.R}</div>
                    </div>
                    <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                      <div className="text-xs text-emerald-400 font-bold">Green Sockets</div>
                      <div className="text-xl font-bold font-orbitron text-slate-900 dark:text-slate-100">{report.chromaticAdvice.desiredColors.G}</div>
                    </div>
                    <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-center">
                      <div className="text-xs text-indigo-400 font-bold">Blue Sockets</div>
                      <div className="text-xl font-bold font-orbitron text-slate-900 dark:text-slate-100">{report.chromaticAdvice.desiredColors.B}</div>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-200/60 dark:bg-[#0f172a] border border-slate-300 dark:border-[#2d2d44] text-center">
                      <div className="text-xs text-slate-600 dark:text-slate-300 font-bold">Est. Chromatics</div>
                      <div className="text-xl font-bold font-orbitron text-slate-900 dark:text-slate-100">~{report.chromaticAdvice.avgChromatics}</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 space-y-2">
                    <div className="text-xs font-bold uppercase text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                      <Hammer className="w-4 h-4 text-indigo-400" />
                      Recommended Crafting Method:
                    </div>
                    <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                      {report.chromaticAdvice.recommendedMethod}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 text-sm">
                  Select a skill group socketed in an item slot to compute chromatic advice.
                </div>
              )}
            </div>
          )}

          {/* Tab 5: Flask Audit Suite */}
          {activeTab === 'flasks' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {parsedChar.flasks.map((flask, idx) => (
                  <div key={idx} className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold uppercase text-indigo-400">{flask.slot}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${getRarityBadgeColor(flask.rarity)}`}>
                        {flask.rarity}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-poppins font-bold text-slate-900 dark:text-slate-100 text-sm">{flask.name}</h4>
                      {flask.baseName && flask.baseName !== flask.name && (
                        <div className="text-xs text-slate-500">{flask.baseName}</div>
                      )}
                    </div>

                    {flask.explicitMods.length > 0 ? (
                      <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-[#2d2d44]">
                        {flask.explicitMods.map((mod, mIdx) => (
                          <div key={mIdx} className="text-xs text-slate-700 dark:text-slate-300 font-sans">
                            • {mod}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-rose-500 italic">No magic suffixes rolled (Normal flask)</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 6: Interactive What-If Simulator */}
          {activeTab === 'simulator' && (
            <div className="p-6 sm:p-8 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-6 shadow-sm">
              <div className="space-y-1">
                <h3 className="font-poppins font-bold text-xl text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-indigo-400" />
                  What-If Upgrade Simulator
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Toggle hypothetical craft upgrades contextual to your {report.defenseArchetype} to see their live impact on your EHP score, Damage score, and overall build grade.
                </p>
              </div>

              {/* Simulated Delta Scoreboard */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="text-center space-y-1">
                  <div className="text-xs text-slate-500 uppercase font-mono">Current Grade</div>
                  <div className="text-2xl font-bold font-orbitron text-slate-900 dark:text-slate-100">{report.grade} ({report.overallScore}/100)</div>
                </div>
                <div className="text-center space-y-1">
                  <div className="text-xs text-indigo-400 uppercase font-mono font-bold">Simulated Grade</div>
                  <div className="text-2xl font-bold font-orbitron text-indigo-400">
                    {simulatedOverall >= 90 ? 'S' : simulatedOverall >= 80 ? 'A' : simulatedOverall >= 70 ? 'B' : 'C'} ({simulatedOverall}/100)
                  </div>
                </div>
                <div className="text-center space-y-1">
                  <div className="text-xs text-emerald-400 uppercase font-mono font-bold">Net Score Gain</div>
                  <div className="text-2xl font-bold font-orbitron text-emerald-400">
                    +{simulatedOverall - report.overallScore} Points
                  </div>
                </div>
              </div>

              {/* Dynamic Contextual Upgrade Toggles */}
              <div className="space-y-3">
                
                {/* Block Cap Option for Block builds */}
                {isBlockArchetype && (
                  <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-800 bg-slate-950/60 cursor-pointer hover:border-indigo-500/50 transition-colors">
                    <div className="space-y-0.5">
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                        Achieve 75% Max Attack & Spell Block Cap (via Tempest Shield / Block Clusters)
                      </span>
                      <p className="text-[11px] text-slate-500">Permanent 75% attack and spell hit negation (+15 EHP Score)</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={simBlockCap}
                      onChange={(e) => setSimBlockCap(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                  </label>
                )}

                {/* Physical Damage Shift */}
                <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-800 bg-slate-950/60 cursor-pointer hover:border-indigo-500/50 transition-colors">
                  <div className="space-y-0.5">
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                      Shift Physical Damage Taken as Elemental (Cloak of Flame / Dawnbreaker / Eldritch Helmet)
                    </span>
                    <p className="text-[11px] text-slate-500">Converts physical boss hits into elemental damage (+16 EHP Score)</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={simPhysShift}
                    onChange={(e) => setSimPhysShift(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                </label>

                {/* Essence of Horror if not already essenced */}
                <div className={`flex items-center justify-between p-3.5 rounded-2xl border ${isEssenced ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-slate-800 bg-slate-950/60 cursor-pointer hover:border-indigo-500/50'}`}>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                        Craft Essence of Horror on Helmet (30% More Elemental Damage)
                      </span>
                      {isEssenced && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded badge-gaming-primary">
                          Already Online
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {isEssenced ? 'Built in pseudo link multiplier is already active on your character' : 'Adds built in pseudo link multiplier to socketed skill (+30% DPS Score)'}
                    </p>
                  </div>
                  {!isEssenced ? (
                    <input
                      type="checkbox"
                      checked={simEssenceHorror}
                      onChange={(e) => setSimEssenceHorror(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                  ) : (
                    <Check className="w-5 h-5 text-emerald-400" />
                  )}
                </div>

                {/* Chaos Resistance if not already capped */}
                <div className={`flex items-center justify-between p-3.5 rounded-2xl border ${isChaosCapped ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-slate-800 bg-slate-950/60 cursor-pointer hover:border-indigo-500/50'}`}>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                        Cap Chaos Resistance to 75% (via Amethyst Rings & Harvest Reforge Chaos)
                      </span>
                      {isChaosCapped && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded badge-gaming-primary">
                          Already Capped ({parsedChar.stats.chaosRes}%)
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {isChaosCapped ? 'Your chaos resistance is already fully capped against poison and toxic degens' : 'Prevents toxic degen spike deaths in T16/T17 maps (+15 EHP Score)'}
                    </p>
                  </div>
                  {!isChaosCapped ? (
                    <input
                      type="checkbox"
                      checked={simChaosRes}
                      onChange={(e) => setSimChaosRes(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                  ) : (
                    <Check className="w-5 h-5 text-emerald-400" />
                  )}
                </div>

                {/* +Gem Levels */}
                <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-800 bg-slate-950/60 cursor-pointer hover:border-indigo-500/50 transition-colors">
                  <div className="space-y-0.5">
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                      Level Main Spell Gem to 21 & +1 All Spell Gems Sceptre
                    </span>
                    <p className="text-[11px] text-slate-500">Exponential base spell damage scaling (+14 DPS Score)</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={simPlusGem}
                    onChange={(e) => setSimPlusGem(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                </label>

                {/* Flask Quality */}
                <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-800 bg-slate-950/60 cursor-pointer hover:border-indigo-500/50 transition-colors">
                  <div className="space-y-0.5">
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                      20% Quality Magic Utility Flasks with "Gain 3 Charges when Hit"
                    </span>
                    <p className="text-[11px] text-slate-500">Permanent armour, evasion, and movement speed buffs (+8 EHP / +6 DPS)</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={simFlasks}
                    onChange={(e) => setSimFlasks(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                </label>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
};
