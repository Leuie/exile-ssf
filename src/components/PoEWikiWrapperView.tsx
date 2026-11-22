import React from 'react';
import { BookOpen } from 'lucide-react';
import type { UserAccount } from '../types';
import { ExternalPortalFrame, type PortalPreset } from './ExternalPortalFrame';

interface PoEWikiWrapperProps {
  initialUrl?: string;
  title?: string;
  isPoE2?: boolean;
  userAccount?: UserAccount | null;
}

export const PoEWikiWrapperView: React.FC<PoEWikiWrapperProps> = ({
  initialUrl = 'https://www.poewiki.net/',
  title = 'PoEWiki Portal',
  isPoE2 = false,
  userAccount
}) => {
  const baseDomain = isPoE2 ? 'https://www.poe2wiki.net' : 'https://www.poewiki.net';

  const presets: PortalPreset[] = isPoE2
    ? [
        { label: 'PoE 2 Wiki Home', url: 'https://www.poe2wiki.net/' },
        { label: 'Skill Gems', url: 'https://www.poe2wiki.net/wiki/Skill_gem' },
        { label: 'Classes', url: 'https://www.poe2wiki.net/wiki/Character_class' },
        { label: 'Weapons', url: 'https://www.poe2wiki.net/wiki/Weapon' },
        { label: 'Waystones', url: 'https://www.poe2wiki.net/wiki/Waystone' }
      ]
    : [
        { label: 'Wiki Home', url: 'https://www.poewiki.net/' },
        { label: 'Vendor Recipes', url: 'https://www.poewiki.net/wiki/Vendor_recipe_system' },
        { label: 'Skill Gems', url: 'https://www.poewiki.net/wiki/Skill_gem' },
        { label: 'Divination Cards', url: 'https://www.poewiki.net/wiki/Divination_card' },
        { label: 'Pinnacle Bosses', url: 'https://www.poewiki.net/wiki/Pinnacle_boss' },
        { label: 'Spell Suppression', url: 'https://www.poewiki.net/wiki/Spell_suppression' },
        { label: 'The Pantheon', url: 'https://www.poewiki.net/wiki/The_Pantheon' }
      ];

  return (
    <ExternalPortalFrame
      title={title}
      badge={isPoE2 ? 'PoE 2 Community Wiki' : 'PoE 1 Community Wiki'}
      subtitle="Community maintained Path of Exile wiki with instant search and direct lookups for your active character and wishlist."
      accentColor="amber"
      icon={<BookOpen className="w-5 h-5" />}
      initialUrl={initialUrl}
      searchPlaceholder={isPoE2 ? 'Search PoE 2 Wiki (e.g. Waystone, Spirit)...' : 'Search PoE Wiki (e.g. Eldritch Ichor, Ignite)...'}
      buildSearchUrl={(q) => `${baseDomain}/wiki/Special:Search?search=${encodeURIComponent(q)}`}
      presets={presets}
      selectedGame={isPoE2 ? 'poe2' : 'poe1'}
      userAccount={userAccount}
      buildCharacterPresets={(ctx) => {
        const list: PortalPreset[] = [];
        if (ctx.member?.ascendancy) {
          list.push({
            label: `${ctx.member.ascendancy} Wiki`,
            url: `${baseDomain}/wiki/${encodeURIComponent(ctx.member.ascendancy.replace(/\s+/g, '_'))}`
          });
        }
        ctx.wishlistItems.slice(0, 4).forEach((w) => {
          list.push({
            label: w.itemName,
            url: `${baseDomain}/wiki/Special:Search?search=${encodeURIComponent(w.itemName)}`
          });
        });
        return list;
      }}
    />
  );
};
