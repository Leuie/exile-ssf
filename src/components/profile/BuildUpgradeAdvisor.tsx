import React, { useMemo } from 'react';
import { Wrench, AlertTriangle, CheckCircle2, ExternalLink } from 'lucide-react';
import type { CharacterGearSnapshot, PaperdollItem } from './CharacterPaperdollView';
import { buildDefaultCalcConfig, calculateCharacterStats } from '../../utils/poeCalcEngine';

interface UpgradeRecommendation {
  slot: string;
  itemName: string;
  priority: 'high' | 'medium' | 'low';
  issue: string;
  fixAction: string;
  targetTab: 'crafting_bench' | 'regex_studio';
}

interface BuildUpgradeAdvisorProps {
  snapshot: CharacterGearSnapshot;
}

const ELDRITCH_SLOTS = new Set(['Helm', 'BodyArmour', 'Gloves', 'Boots']);
const LIFE_ARMOUR_SLOTS = new Set(['Helm', 'BodyArmour', 'Gloves', 'Boots', 'Belt', 'Ring', 'Ring2']);

function extractFlatLife(item: PaperdollItem): number {
  let maxLife = 0;
  const allMods = [
    ...(item.implicitMods || []),
    ...(item.explicitMods || []),
    ...(item.craftedMods || []),
    ...(item.fracturedMods || [])
  ];
  for (const m of allMods) {
    const match = m.match(/\+(\d+)\s+to maximum Life/i);
    if (match) maxLife += parseInt(match[1], 10);
  }
  return maxLife;
}

export const BuildUpgradeAdvisor: React.FC<BuildUpgradeAdvisorProps> = ({ snapshot }) => {
  const recs = useMemo(() => {
    const list: UpgradeRecommendation[] = [];
    const bySlot = new Map<string, PaperdollItem>();
    for (const it of snapshot.equipped) {
      if (it.inventoryId !== 'Flask') bySlot.set(it.inventoryId, it);
    }

    const calc = calculateCharacterStats(snapshot, buildDefaultCalcConfig(snapshot));
    const res = calc.resistances;

    if (!res.fire.isCapped || !res.cold.isCapped || !res.lightning.isCapped) {
      const missing = [
        !res.fire.isCapped ? `Fire ${res.fire.label} (<${res.fire.maxRes}%)` : '',
        !res.cold.isCapped ? `Cold ${res.cold.label} (<${res.cold.maxRes}%)` : '',
        !res.lightning.isCapped ? `Lightning ${res.lightning.label} (<${res.lightning.maxRes}%)` : ''
      ]
        .filter(Boolean)
        .join(', ');
      list.push({
        slot: 'Defenses',
        itemName: 'Elemental Resistances',
        priority: 'high',
        issue: `Uncapped Elemental Res: ${missing}`,
        fixAction: 'Bench craft dual-res or Harvest swap resistance on Rings/Belt/Boots immediately.',
        targetTab: 'crafting_bench'
      });
    }

    if (!res.chaos.isImmune && res.chaos.effective < 0) {
      list.push({
        slot: 'Defenses',
        itemName: 'Chaos Resistance',
        priority: 'high',
        issue: `Negative Chaos Res (${res.chaos.label})`,
        fixAction: 'Reforge Chaos in Harvest on an Amethyst Ring or bench craft Chaos + Elemental Res.',
        targetTab: 'crafting_bench'
      });
    }

    if (calc.mainSkill && calc.mainSkill.linkCount < 6 && (snapshot.character.level || 1) >= 75) {
      list.push({
        slot: calc.mainSkill.slot,
        itemName: `${calc.mainSkill.name} (${calc.mainSkill.linkCount}-Link)`,
        priority: 'high',
        issue: `Main Skill is only on a ${calc.mainSkill.linkCount}-Link setup`,
        fixAction: 'Upgrade to a 6-Link Body Armour or Weapon (+30% to +35% more DPS).',
        targetTab: 'crafting_bench'
      });
    }

    if (calc.detectedCurses.length === 0 && (snapshot.character.level || 1) >= 70) {
      list.push({
        slot: 'Offense',
        itemName: 'Missing Curse / Mark',
        priority: 'medium',
        issue: 'No active damage Curse or Mark detected in socketed gems',
        fixAction: 'Socket Assassin\'s Mark, Sniper\'s Mark, or an elemental Curse (+25% to +35% Boss DPS).',
        targetTab: 'crafting_bench'
      });
    }

    if (!calc.traits.isAcrobatics && calc.suppression.chance > 0 && calc.suppression.chance < 100) {
      list.push({
        slot: 'Defenses',
        itemName: 'Spell Suppression',
        priority: 'medium',
        issue: `Partial Spell Suppression (${calc.suppression.chance}% / 100%)`,
        fixAction: 'Roll T1-T2 Suppression on Gloves/Boots/Helm or allocate a Suppression Mastery.',
        targetTab: 'regex_studio'
      });
    }

    // Slot-by-slot audit
    for (const [slot, item] of bySlot.entries()) {
      const isRareOrMagic = item.frameType === 1 || item.frameType === 2;
      const isUnique = item.frameType === 3;
      const label = item.name || item.baseType || slot;

      // Missing Eldritch implicits on rare armour
      if (ELDRITCH_SLOTS.has(slot) && isRareOrMagic && !item.corrupted && (!item.implicitMods || item.implicitMods.length === 0)) {
        list.push({
          slot,
          itemName: label,
          priority: 'medium',
          issue: 'Missing Eldritch Implicits (Eater & Exarch)',
          fixAction: 'Apply Lesser Eldritch Ichors & Embers for free Action Speed, Aura Effect, or Max Res.',
          targetTab: 'crafting_bench'
        });
      }

      // Un-anointed Amulet
      if (slot === 'Amulet' && !item.corrupted && (!item.enchantMods || item.enchantMods.length === 0)) {
        list.push({
          slot: 'Amulet',
          itemName: label,
          priority: 'high',
          issue: 'Amulet is missing a Blight Oil Anoint',
          fixAction: 'Visit Cassia to anoint a high-value defensive or DPS notable.',
          targetTab: 'crafting_bench'
        });
      }

      // Life vs Energy Shield audit on rare armour/jewelry (Chaos Inoculation aware!)
      if (LIFE_ARMOUR_SLOTS.has(slot) && isRareOrMagic && !isUnique) {
        const modCount =
          (item.explicitMods?.length || 0) +
          (item.craftedMods?.length || 0) +
          (item.fracturedMods?.length || 0);

        if (calc.traits.usesEsAsPrimaryPool) {
          // Chaos Inoculation / Low-Life ES — NEVER suggest Life; audit Energy Shield on armour slots instead
          const isArmourEsSlot = ['Helm', 'BodyArmour', 'Gloves', 'Boots', 'Offhand'].includes(slot);
          const itemEsProp = (item.properties || []).find((p) => /energy shield/i.test(p.name));
          const itemEsVal = itemEsProp ? parseInt(itemEsProp.value.replace(/[^0-9]/g, ''), 10) || 0 : 0;
          const minTargetEs = slot === 'BodyArmour' ? 400 : 120;
          if (isArmourEsSlot && itemEsVal < minTargetEs) {
            list.push({
              slot,
              itemName: label,
              priority: itemEsVal === 0 ? 'high' : 'medium',
              issue:
                itemEsVal === 0
                  ? 'No Energy Shield on slot (Chaos Inoculation)'
                  : `Low Energy Shield (${itemEsVal} ES on ${slot})`,
              fixAction:
                modCount < 6
                  ? 'Open affix detected — bench craft flat or % increased Energy Shield.'
                  : 'Upgrade with Dense Fossils, Essence of Woe, or Harvest Reforge Defense on an ES base.',
              targetTab: 'crafting_bench'
            });
          } else if (modCount < 6 && (!item.craftedMods || item.craftedMods.length === 0) && !item.corrupted) {
            list.push({
              slot,
              itemName: label,
              priority: 'low',
              issue: `Open crafting bench slot (${modCount}/6 affixes)`,
              fixAction: 'Add a free Crafting Bench prefix/suffix (Energy Shield, Attributes, Resistances, or Damage).',
              targetTab: 'crafting_bench'
            });
          }
        } else {
          const life = extractFlatLife(item);
          if (life < 55 && calc.energyShield.total < 2500) {
            list.push({
              slot,
              itemName: label,
              priority: life === 0 ? 'high' : 'low',
              issue: life === 0 ? 'No flat Life roll on slot' : `Low flat Life roll (+${life})`,
              fixAction:
                modCount < 6
                  ? 'Open affix detected — bench craft +Life right away.'
                  : 'Upgrade with Greed Essence or Harvest Reforge Life.',
              targetTab: 'crafting_bench'
            });
          } else if (modCount < 6 && (!item.craftedMods || item.craftedMods.length === 0) && !item.corrupted) {
            list.push({
              slot,
              itemName: label,
              priority: 'low',
              issue: `Open crafting bench slot (${modCount}/6 affixes)`,
              fixAction: 'Add a free Crafting Bench suffix/prefix (Res, Attributes, Damage, or Phys Taken as Ele).',
              targetTab: 'crafting_bench'
            });
          }
        }
      }
    }

    const rank: Record<UpgradeRecommendation['priority'], number> = { high: 0, medium: 1, low: 2 };
    return list.sort((a, b) => rank[a.priority] - rank[b.priority]).slice(0, 6);
  }, [snapshot]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0b101b] overflow-hidden shadow-lg">
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/70 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-amber-400" />
          <span className="text-xs sm:text-sm font-bold text-slate-100">
            Build Upgrade Advisor
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-slate-700">
            {recs.length} Priorities
          </span>
        </div>
        <a
          href={`https://poe.ninja/builds/settlersssf?class=${encodeURIComponent(snapshot.character.className || '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] font-mono text-sky-300 hover:text-sky-200 inline-flex items-center gap-1"
        >
          <span>Compare {snapshot.character.className} on poe.ninja</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <div className="p-4">
        {recs.length === 0 ? (
          <div className="flex items-center gap-2 text-xs text-emerald-300 py-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>No glaring gear holes detected — resistances, implicits, anoint, and bench slots look solid!</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {recs.map((r, idx) => (
              <div
                key={`${r.slot}-${idx}`}
                className="p-3 rounded-xl bg-slate-950/85 border border-slate-800 flex flex-col justify-between gap-2"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white truncate">
                      {r.slot}: <span className="text-amber-200">{r.itemName}</span>
                    </span>
                    <span
                      className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border shrink-0 ${
                        r.priority === 'high'
                          ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                          : r.priority === 'medium'
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                          : 'bg-sky-500/15 border-sky-500/40 text-sky-300'
                      }`}
                    >
                      {r.priority}
                    </span>
                  </div>
                  <div className="text-[11px] font-semibold text-rose-200 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>{r.issue}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">{r.fixAction}</p>
                </div>
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent('exile-navigate-tab', { detail: r.targetTab }))}
                  className="self-start px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/35 border border-indigo-400/45 text-indigo-200 text-[10px] font-mono font-bold cursor-pointer"
                >
                  {r.targetTab === 'crafting_bench' ? 'Open Crafting Bench →' : 'Open Regex Studio →'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
