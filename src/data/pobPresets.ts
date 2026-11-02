import type { PoBPreset } from '../types/analyzer';

export const POB_PRESETS: PoBPreset[] = [
  {
    id: 'preset-elementalist-wip',
    name: 'Level 78 Ignite Elementalist (Yellow Maps Bottleneck)',
    archetype: 'Spell Caster / Ignite',
    class: 'Witch',
    ascendancy: 'Elementalist',
    level: 78,
    mainSkill: 'Penance Brand',
    stage: 'Early Mapping (T6-T9)',
    description: 'A common early mapping scenario: high potential damage, but suffering from uncapped lightning resistance, negative chaos resistance, and a 4 link setup that causes random one shots in yellow maps.',
    pobCode: `<PathOfBuilding>
  <Build level="78" className="Witch" ascendClassName="Elementalist" mainSocketGroup="1">
    <PlayerStat stat="Life" value="3420" />
    <PlayerStat stat="EnergyShield" value="480" />
    <PlayerStat stat="FireResist" value="75" />
    <PlayerStat stat="FireResistOverCap" value="12" />
    <PlayerStat stat="ColdResist" value="75" />
    <PlayerStat stat="ColdResistOverCap" value="8" />
    <PlayerStat stat="LightningResist" value="64" />
    <PlayerStat stat="LightningResistOverCap" value="0" />
    <PlayerStat stat="ChaosResist" value="-35" />
    <PlayerStat stat="ChaosResistOverCap" value="0" />
    <PlayerStat stat="Armour" value="4200" />
    <PlayerStat stat="Evasion" value="1800" />
    <PlayerStat stat="SpellSuppressionChance" value="0" />
    <PlayerStat stat="BlockChance" value="22" />
    <PlayerStat stat="SpellBlockChance" value="8" />
    <PlayerStat stat="LifeRegenRecovery" value="310" />
    <PlayerStat stat="TotalDPS" value="420000" />
    <PlayerStat stat="TotalDot" value="380000" />
    <PlayerStat stat="IgniteDPS" value="380000" />
    <PlayerStat stat="CritChance" value="8.5" />
    <PlayerStat stat="CritMultiplier" value="150" />
    <PlayerStat stat="ManaUnreservedPercent" value="28" />
  </Build>
  <Skills>
    <Skill slot="Body Armour" enabled="true" mainActiveSkill="1">
      <Gem nameSpec="Penance Brand" level="18" quality="0" enabled="true" />
      <Gem nameSpec="Swiftbrand Support" level="18" quality="0" enabled="true" />
      <Gem nameSpec="Deadly Ailments Support" level="18" quality="0" enabled="true" />
      <Gem nameSpec="Unbound Ailments Support" level="18" quality="0" enabled="true" />
    </Skill>
    <Skill slot="Helmet" enabled="true">
      <Gem nameSpec="Malevolence" level="18" quality="0" enabled="true" />
      <Gem nameSpec="Herald of Ash" level="18" quality="0" enabled="true" />
      <Gem nameSpec="Flame Dash" level="18" quality="0" enabled="true" />
    </Skill>
    <Skill slot="Weapon 1" enabled="true">
      <Gem nameSpec="Summon Stone Golem" level="18" quality="0" enabled="true" />
      <Gem nameSpec="Summon Flame Golem" level="18" quality="0" enabled="true" />
      <Gem nameSpec="Summon Chaos Golem" level="18" quality="0" enabled="true" />
    </Skill>
  </Skills>
  <Items>
    <Item id="1">
Rarity: RARE
Brimstone Carapace
Saintly Chainmail
+88 to maximum Life
+32% to Fire Resistance
+28% to Cold Resistance
    </Item>
    <Slot name="Body Armour" itemId="1" />
  </Items>
  <Tree>
    <Spec nodes="123,456" />
  </Tree>
</PathOfBuilding>`
  },
  {
    id: 'preset-slayer-progression',
    name: 'Level 87 Boneshatter Slayer (Red Maps / T14 Wall)',
    archetype: 'True Melee / Strike',
    class: 'Duelist',
    ascendancy: 'Slayer',
    level: 87,
    mainSkill: 'Boneshatter',
    stage: 'Red Maps (T14-T16)',
    description: 'Solid physical foundation with capped elemental resists and high armour, but held back by a 5 link weapon, low chaos resistance (+12%), and missing Eldritch body armour implicits for physical damage taken as elemental.',
    pobCode: `<PathOfBuilding>
  <Build level="87" className="Duelist" ascendClassName="Slayer" mainSocketGroup="1">
    <PlayerStat stat="Life" value="4650" />
    <PlayerStat stat="EnergyShield" value="0" />
    <PlayerStat stat="FireResist" value="75" />
    <PlayerStat stat="FireResistOverCap" value="28" />
    <PlayerStat stat="ColdResist" value="75" />
    <PlayerStat stat="ColdResistOverCap" value="34" />
    <PlayerStat stat="LightningResist" value="75" />
    <PlayerStat stat="LightningResistOverCap" value="22" />
    <PlayerStat stat="ChaosResist" value="12" />
    <PlayerStat stat="ChaosResistOverCap" value="0" />
    <PlayerStat stat="Armour" value="26500" />
    <PlayerStat stat="Evasion" value="1200" />
    <PlayerStat stat="SpellSuppressionChance" value="48" />
    <PlayerStat stat="BlockChance" value="0" />
    <PlayerStat stat="SpellBlockChance" value="0" />
    <PlayerStat stat="LifeRegenRecovery" value="680" />
    <PlayerStat stat="TotalDPS" value="1250000" />
    <PlayerStat stat="CritChance" value="5.0" />
    <PlayerStat stat="CritMultiplier" value="150" />
    <PlayerStat stat="ManaUnreservedPercent" value="9" />
  </Build>
  <Skills>
    <Skill slot="Weapon 1" enabled="true" mainActiveSkill="1">
      <Gem nameSpec="Boneshatter" level="19" quality="20" enabled="true" />
      <Gem nameSpec="Melee Physical Damage Support" level="19" quality="0" enabled="true" />
      <Gem nameSpec="Brutality Support" level="19" quality="0" enabled="true" />
      <Gem nameSpec="Fortify Support" level="19" quality="0" enabled="true" />
      <Gem nameSpec="Ruthless Support" level="19" quality="0" enabled="true" />
    </Skill>
    <Skill slot="Body Armour" enabled="true">
      <Gem nameSpec="Determination" level="20" quality="0" enabled="true" />
      <Gem nameSpec="Pride" level="19" quality="0" enabled="true" />
      <Gem nameSpec="Blood and Sand" level="6" quality="0" enabled="true" />
      <Gem nameSpec="Vulnerability" level="19" quality="0" enabled="true" />
    </Skill>
  </Skills>
  <Items>
    <Item id="1">
Rarity: RARE
Doom Edge
Despot Axe
Item Level: 83
+32 to Strength
Adds 24 to 48 Physical Damage
124% increased Physical Damage
18% increased Attack Speed
    </Item>
    <Slot name="Weapon 1" itemId="1" />
  </Items>
  <Tree>
    <Spec nodes="111,222" />
  </Tree>
</PathOfBuilding>`
  },
  {
    id: 'preset-deadeye-endgame',
    name: 'Level 94 Lightning Arrow Deadeye (Pinnacle & Voidstones Ready)',
    archetype: 'Bow Attack / Critical',
    class: 'Ranger',
    ascendancy: 'Deadeye',
    level: 94,
    mainSkill: 'Lightning Arrow',
    stage: 'Endgame / 4 Voidstones',
    description: 'Fully optimized endgame setup: 6 link bow, 100% spell suppression capped, +42% chaos resistance, overcapped elemental resists, and high-impact Eldritch implicits.',
    pobCode: `<PathOfBuilding>
  <Build level="94" className="Ranger" ascendClassName="Deadeye" mainSocketGroup="1">
    <PlayerStat stat="Life" value="4250" />
    <PlayerStat stat="EnergyShield" value="120" />
    <PlayerStat stat="FireResist" value="75" />
    <PlayerStat stat="FireResistOverCap" value="42" />
    <PlayerStat stat="ColdResist" value="75" />
    <PlayerStat stat="ColdResistOverCap" value="38" />
    <PlayerStat stat="LightningResist" value="75" />
    <PlayerStat stat="LightningResistOverCap" value="45" />
    <PlayerStat stat="ChaosResist" value="48" />
    <PlayerStat stat="ChaosResistOverCap" value="0" />
    <PlayerStat stat="Armour" value="4500" />
    <PlayerStat stat="Evasion" value="34500" />
    <PlayerStat stat="SpellSuppressionChance" value="100" />
    <PlayerStat stat="BlockChance" value="0" />
    <PlayerStat stat="SpellBlockChance" value="0" />
    <PlayerStat stat="LifeRegenRecovery" value="220" />
    <PlayerStat stat="TotalDPS" value="6850000" />
    <PlayerStat stat="CritChance" value="78.5" />
    <PlayerStat stat="CritMultiplier" value="465" />
    <PlayerStat stat="ManaUnreservedPercent" value="7" />
  </Build>
  <Skills>
    <Skill slot="Weapon 1" enabled="true" mainActiveSkill="1">
      <Gem nameSpec="Lightning Arrow" level="21" quality="20" enabled="true" />
      <Gem nameSpec="Trinity Support" level="20" quality="20" enabled="true" />
      <Gem nameSpec="Elemental Damage with Attacks Support" level="20" quality="20" enabled="true" />
      <Gem nameSpec="Mirage Archer Support" level="20" quality="20" enabled="true" />
      <Gem nameSpec="Increased Critical Strikes Support" level="20" quality="20" enabled="true" />
      <Gem nameSpec="Returning Projectiles Support" level="20" quality="20" enabled="true" />
    </Skill>
    <Skill slot="Body Armour" enabled="true">
      <Gem nameSpec="Grace" level="20" quality="0" enabled="true" />
      <Gem nameSpec="Anger" level="20" quality="0" enabled="true" />
      <Gem nameSpec="Precision" level="20" quality="0" enabled="true" />
      <Gem nameSpec="Sniper's Mark" level="20" quality="20" enabled="true" />
    </Skill>
  </Skills>
  <Items>
    <Item id="1">
Rarity: RARE
Eagle Fletch
Spine Bow
Item Level: 86
Adds 145 to 280 Fire Damage
Adds 22 to 445 Lightning Damage
Adds 115 to 220 Cold Damage
24% increased Attack Speed
32% increased Critical Strike Chance
    </Item>
    <Slot name="Weapon 1" itemId="1" />
  </Items>
  <Tree>
    <Spec nodes="999,888" />
  </Tree>
</PathOfBuilding>`
  }
];
