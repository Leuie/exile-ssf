// Shared Path of Exile In-Game & PoB Resistance Formatter
// Displays capped resistance with overcap in parentheses: e.g. "75% (+34%)" or "82% (+10%)"
// Respects "+X% to maximum Resistance" mods and Chaos Inoculation immunity.

import type { CharacterGearSnapshot } from '../components/profile/CharacterPaperdollView';

export interface FormattedResistance {
  effective: number;
  maxRes: number;
  overcap: number;
  uncapped: number;
  isCapped: boolean;
  isImmune: boolean;
  label: string;
}

export function formatInGameRes(
  uncappedTotal: number,
  maxRes = 75,
  isImmune = false
): FormattedResistance {
  const cap = Math.min(90, Math.max(75, Math.round(maxRes || 75)));
  const raw = Math.round(uncappedTotal);
  if (isImmune) {
    return {
      effective: 100,
      maxRes: 100,
      overcap: 0,
      uncapped: raw,
      isCapped: true,
      isImmune: true,
      label: `${raw}% (Immune)`
    };
  }
  const effective = Math.min(cap, raw);
  const overcap = Math.max(0, raw - cap);
  return {
    effective,
    maxRes: cap,
    overcap,
    uncapped: raw,
    isCapped: effective >= cap,
    isImmune: false,
    label: overcap > 0 ? `${effective}% (+${overcap}%)` : `${effective}%`
  };
}

export function formatPobRes(
  effectiveRes: number,
  overcap: number,
  maxRes = 75,
  isImmune = false
): FormattedResistance {
  const eff = Math.round(effectiveRes);
  const oc = Math.max(0, Math.round(overcap || 0));
  const cap = Math.min(90, Math.max(75, Math.round(maxRes || 75)));
  if (isImmune) {
    return {
      effective: 100,
      maxRes: 100,
      overcap: 0,
      uncapped: eff,
      isCapped: true,
      isImmune: true,
      label: `${eff}% (Immune)`
    };
  }
  const effective = Math.min(cap, eff);
  const extra = Math.max(oc, Math.max(0, eff - cap));
  return {
    effective,
    maxRes: cap,
    overcap: extra,
    uncapped: effective + extra,
    isCapped: effective >= cap,
    isImmune: false,
    label: extra > 0 ? `${effective}% (+${extra}%)` : `${effective}%`
  };
}

export interface SnapshotResistanceSummary {
  kitavaPenalty: number;
  purityBonus: number;
  isCI: boolean;
  fire: FormattedResistance;
  cold: FormattedResistance;
  lightning: FormattedResistance;
  chaos: FormattedResistance;
}

/**
 * Computes in-game style resistances for a synced CharacterGearSnapshot:
 * - Applies Kitava penalty (-60% Lv 68+, -30% Lv 45-67, 0% Lv <45)
 * - Detects Purity of Elements (+34%) and +X% to maximum Resistance mods on gear/jewels/passives
 * - Caps display at maxRes (default 75%) and puts anything above into (+overcap%)
 */
export function computeSnapshotResistances(snap: CharacterGearSnapshot): SnapshotResistanceSummary {
  const lvl = snap.character.level || 1;
  const kitavaPenalty = lvl >= 68 ? -60 : lvl >= 45 ? -30 : 0;

  let maxFire = 75;
  let maxCold = 75;
  let maxLightning = 75;
  let maxChaos = 75;

  const allModLines: string[] = [];
  for (const it of snap.equipped || []) {
    allModLines.push(
      ...(it.implicitMods || []),
      ...(it.explicitMods || []),
      ...(it.craftedMods || []),
      ...(it.fracturedMods || []),
      ...(it.enchantMods || [])
    );
  }
  const allJewels = [
    ...(snap.jewels?.cluster || []),
    ...(snap.jewels?.base || []),
    ...(snap.jewels?.abyss || [])
  ];
  for (const j of allJewels) {
    allModLines.push(...(j.implicitMods || []), ...(j.explicitMods || []));
  }
  for (const a of snap.passives?.ascendancyNodes || []) {
    allModLines.push(...(a.stats || []));
  }
  for (const m of snap.passives?.masteries || []) {
    allModLines.push(...(m.effectStats || []));
  }

  for (const line of allModLines) {
    const allMax = line.match(/\+(\d+)% to all maximum Elemental Resistances/i);
    if (allMax) {
      const v = Number(allMax[1]);
      maxFire += v;
      maxCold += v;
      maxLightning += v;
    }
    const fMax = line.match(/\+(\d+)% to maximum Fire Resistance/i);
    if (fMax) maxFire += Number(fMax[1]);
    const cMax = line.match(/\+(\d+)% to maximum Cold Resistance/i);
    if (cMax) maxCold += Number(cMax[1]);
    const lMax = line.match(/\+(\d+)% to maximum Lightning Resistance/i);
    if (lMax) maxLightning += Number(lMax[1]);
    const chMax = line.match(/\+(\d+)% to maximum Chaos Resistance/i);
    if (chMax) maxChaos += Number(chMax[1]);
  }

  // Also check Purity of Fire / Ice / Lightning (+4% max res at Lv 20) and Purity of Elements (+34% all ele res)
  let purityEleBonus = 0;
  for (const it of snap.equipped || []) {
    for (const g of it.socketedGems || []) {
      const gn = (g.name || '').toLowerCase();
      if (gn.includes('purity of elements')) purityEleBonus = Math.max(purityEleBonus, 34);
      if (gn.includes('purity of fire')) maxFire += 4;
      if (gn.includes('purity of ice')) maxCold += 4;
      if (gn.includes('purity of lightning')) maxLightning += 4;
    }
  }

  const isCI = Boolean(
    (snap.passives?.allocatedHashes || []).includes(11455) ||
      snap.passives?.keystones?.some((k) => /chaos inoculation/i.test(k.name)) ||
      allModLines.some((m) => /chaos inoculation/i.test(m))
  );
  const v = snap.estimatedVitals;

  return {
    kitavaPenalty,
    purityBonus: purityEleBonus,
    isCI,
    fire: formatInGameRes((v.fireRes || 0) + purityEleBonus + kitavaPenalty, Math.min(90, maxFire)),
    cold: formatInGameRes((v.coldRes || 0) + purityEleBonus + kitavaPenalty, Math.min(90, maxCold)),
    lightning: formatInGameRes((v.lightningRes || 0) + purityEleBonus + kitavaPenalty, Math.min(90, maxLightning)),
    chaos: formatInGameRes((v.chaosRes || 0) + kitavaPenalty, Math.min(90, maxChaos), isCI)
  };
}
