import React, { useMemo } from 'react';
import { Wrench, AlertTriangle, CheckCircle2, ExternalLink } from 'lucide-react';
import type { CharacterGearSnapshot, PaperdollItem } from './CharacterPaperdollView';

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

    const v = snapshot.estimatedVitals;
    const charLvl = snapshot.character.level || 1;
    const kitavaPenalty = charLvl >= 68 ? -60 : charLvl >= 45 ? -30 : 0;
    const hasPurityOfElements = snapshot.equipped.some((it) =>
      (it.socketedGems || []).some((g) => /purity of elements/i.test(g.name || ''))
    );
    const purityBonus = hasPurityOfElements ? 34 : 0;
    const effFire = v.fireRes + purityBonus + kitavaPenalty;
    const effCold = v.coldRes + purityBonus + kitavaPenalty;
    const effLight = v.lightningRes + purityBonus + kitavaPenalty;
    const effChaos = v.chaosRes + kitavaPenalty;

    if (effFire < 75 || effCold < 75 || effLight < 75) {
      const missing = [
        effFire < 75 ? `Fire (${effFire}%)` : '',
        effCold < 75 ? `Cold (${effCold}%)` : '',
        effLight < 75 ? `Lightning (${effLight}%)` : ''
      ]
        .filter(Boolean)
        .join(', ');
      list.push({
        slot: 'Defenses',
        itemName: 'Elemental Resistances',
        priority: 'high',
        issue: `Estimated Uncapped Elemental Res (after ${kitavaPenalty}% penalty): ${missing}`,
        fixAction: 'Bench craft dual-res or Harvest swap resistance on Rings/Belt/Boots immediately.',
        targetTab: 'crafting_bench'
      });
    }

    if (effChaos < 0 && !snapshot.passives?.keystones?.some((k) => /chaos inoculation/i.test(k.name))) {
      list.push({
        slot: 'Defenses',
        itemName: 'Chaos Resistance',
        priority: 'high',
        issue: `Estimated Negative Chaos Res (${effChaos}% after ${kitavaPenalty}% penalty)`,
        fixAction: 'Reforge Chaos in Harvest on an Amethyst Ring or bench craft Chaos + Elemental Res.',
        targetTab: 'crafting_bench'
      });
    }

    if (v.suppress > 0 && v.suppress < 100) {
      list.push({
        slot: 'Defenses',
        itemName: 'Spell Suppression',
        priority: 'medium',
        issue: `Partial Spell Suppression (${v.suppress}% / 100%)`,
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

      // Low flat life on rare armour/jewelry
      if (LIFE_ARMOUR_SLOTS.has(slot) && isRareOrMagic && !isUnique) {
        const life = extractFlatLife(item);
        const modCount =
          (item.explicitMods?.length || 0) +
          (item.craftedMods?.length || 0) +
          (item.fracturedMods?.length || 0);
        if (life < 55 && snapshot.estimatedVitals.flatEs < 800) {
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

    const rank: Record<UpgradeRecommendation['priority'], number> = { high: 0, medium: 1, low: 2 };
    return list.sort((a, b) => rank[a.priority] - rank[b.priority]).slice(0, 6);
  }, [snapshot]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0b101b] overflow-hidden shadow-lg">
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/70 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-amber-400" />
          <span className="text-xs sm:text-sm font-bold text-slate-100">
            One Click Build Upgrade Advisor
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
