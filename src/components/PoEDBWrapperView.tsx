import React from 'react';
import { Database } from 'lucide-react';
import type { UserAccount } from '../types';
import { ExternalPortalFrame, type PortalPreset } from './ExternalPortalFrame';

interface PoEDBWrapperProps {
  initialUrl?: string;
  title?: string;
  isPoE2?: boolean;
  userAccount?: UserAccount | null;
}

export const PoEDBWrapperView: React.FC<PoEDBWrapperProps> = ({
  initialUrl = 'https://poedb.tw/us/',
  title = 'PoEDB Portal',
  isPoE2 = false,
  userAccount
}) => {
  const baseDomain = isPoE2 ? 'https://poe2db.tw/us' : 'https://poedb.tw/us';

  const presets: PortalPreset[] = isPoE2
    ? [
        { label: 'PoE 2 DB Home', url: 'https://poe2db.tw/us/' },
        { label: 'Modifiers', url: 'https://poe2db.tw/us/Modifiers' },
        { label: 'Skill Gems', url: 'https://poe2db.tw/us/Skill_Gems' },
        { label: 'Uniques', url: 'https://poe2db.tw/us/Unique_item' },
        { label: 'Runes & Soul Cores', url: 'https://poe2db.tw/us/Runes' }
      ]
    : [
        { label: 'PoEDB Home', url: 'https://poedb.tw/us/' },
        { label: 'Item Modifiers', url: 'https://poedb.tw/us/Modifiers' },
        { label: 'Crafting Bench', url: 'https://poedb.tw/us/Crafting_Bench' },
        { label: 'Eldritch Implicits', url: 'https://poedb.tw/us/Eldritch_implicit' },
        { label: 'Cluster Jewels', url: 'https://poedb.tw/us/Cluster_Jewel' },
        { label: 'Gems & Transfigured', url: 'https://poedb.tw/us/Gem' },
        { label: 'Uniques', url: 'https://poedb.tw/us/Unique_item' }
      ];

  return (
    <ExternalPortalFrame
      title={title}
      badge={isPoE2 ? 'PoE 2 Datamined Mod DB' : 'PoE 1 Datamined Mod DB'}
      subtitle="Datamined affix weights, item level tiers, Harvest tags, and direct crafting base lookups for your wishlist."
      accentColor="sky"
      icon={<Database className="w-5 h-5" />}
      initialUrl={initialUrl}
      searchPlaceholder={isPoE2 ? 'Search PoE 2 DB (e.g. Quarterstaff, Spirit)...' : 'Search PoEDB (e.g. Convoking Wand, Elder Helmet)...'}
      buildSearchUrl={(q) => `${baseDomain}/search?q=${encodeURIComponent(q)}`}
      presets={presets}
      selectedGame={isPoE2 ? 'poe2' : 'poe1'}
      userAccount={userAccount}
      buildCharacterPresets={(ctx) => {
        const list: PortalPreset[] = [];
        if (ctx.member?.ascendancy) {
          list.push({
            label: `${ctx.member.ascendancy} DB`,
            url: `${baseDomain}/${encodeURIComponent(ctx.member.ascendancy.replace(/\s+/g, '_'))}`
          });
        }
        ctx.wishlistItems.slice(0, 4).forEach((w) => {
          list.push({
            label: `Craft: ${w.itemName}`,
            url: `${baseDomain}/search?q=${encodeURIComponent(w.itemName)}`
          });
        });
        return list;
      }}
    />
  );
};
