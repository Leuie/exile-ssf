export interface ParsedPoBStats {
  life: number;
  energyShield: number;
  fireRes: number;
  fireResOverCap: number;
  coldRes: number;
  coldResOverCap: number;
  lightningRes: number;
  lightningResOverCap: number;
  chaosRes: number;
  chaosResOverCap: number;
  maxFireRes: number;
  maxColdRes: number;
  maxLightningRes: number;
  maxChaosRes: number;
  armour: number;
  evasion: number;
  spellSuppression: number;
  block: number;
  spellBlock: number;
  lifeRegen: number;
  totalDPS: number;
  dotDPS: number;
  critChance: number;
  critMulti: number;
  manaUnreservedPercent: number;
  mainLinkCount: number;
  physTakenAsEle: number;
  hasLifeOnBlock: boolean;
  hasEsOnBlock: boolean;
  hasGlancingBlows: boolean;
}

export interface ParsedGem {
  name: string;
  level: number;
  quality: number;
  enabled: boolean;
  isSupport: boolean;
  color?: 'R' | 'G' | 'B' | 'W';
}

export interface ParsedSkillGroup {
  id: string;
  label: string;
  slot?: string;
  enabled: boolean;
  isMain: boolean;
  gems: ParsedGem[];
  physicalLinks: number;
  pseudoLinks: number;
  effectiveLinks: number;
  pseudoSupportNames: string[];
}

export interface ParsedItem {
  id: string;
  slot: string;
  name: string;
  baseName: string;
  rarity: 'NORMAL' | 'MAGIC' | 'RARE' | 'UNIQUE';
  itemLevel?: number;
  quality?: number;
  reqStr?: number;
  reqDex?: number;
  reqInt?: number;
  implicitMods: string[];
  explicitMods: string[];
  eldritchMods: string[];
  craftedMods: string[];
  fracturedMods: string[];
  pseudoSupportMods: string[];
  openPrefixes: number;
  openSuffixes: number;
  rawText: string;
}

export interface ParsedCharacter {
  characterName: string;
  className: string;
  ascendClassName: string;
  level: number;
  mainSkillName: string;
  selectedSkillGroupId: string;
  stats: ParsedPoBStats;
  skillGroups: ParsedSkillGroup[];
  items: ParsedItem[];
  flasks: ParsedItem[];
  keystones: string[];
  masteriesCount: number;
}

export interface DiagnosticItem {
  id: string;
  category: 'defenses' | 'offenses' | 'gear' | 'gems' | 'flasks';
  severity: 'critical' | 'warning' | 'optimal';
  title: string;
  description: string;
  impactType: 'damage' | 'ehp' | 'balanced';
  estimatedImpact: string;
  recommendation: string;
  ssfCraftingFix: string;
  tags: string[];
}

export interface ChromaticAdvice {
  slot: string;
  baseName: string;
  reqStr: number;
  reqDex: number;
  reqInt: number;
  desiredColors: { R: number; G: number; B: number; W: number };
  difficulty: 'Easy' | 'Moderate' | 'Difficult' | 'Extreme';
  recommendedMethod: string;
  voriciBenchCost?: string;
  avgChromatics: number;
}

export interface SimulationOption {
  id: string;
  label: string;
  category: 'damage' | 'ehp';
  dpsDeltaPercent: number;
  ehpDeltaPercent: number;
  description: string;
  ssfHowTo: string;
}

export interface AnalysisReport {
  ehpScore: number;
  dpsScore: number;
  overallScore: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
  defenseArchetype: string;
  summary: string;
  diagnostics: DiagnosticItem[];
  damageUpgrades: DiagnosticItem[];
  ehpUpgrades: DiagnosticItem[];
  optimalBadges: DiagnosticItem[];
  chromaticAdvice?: ChromaticAdvice;
}

export interface PoBPreset {
  id: string;
  name: string;
  archetype: string;
  class: string;
  ascendancy: string;
  level: number;
  mainSkill: string;
  stage: string;
  description: string;
  pobCode: string;
}
