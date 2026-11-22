import React from 'react';
import { TrendingUp } from 'lucide-react';
import type { UserAccount } from '../types';
import { ExternalPortalFrame, type PortalPreset } from './ExternalPortalFrame';

interface PoENinjaWrapperProps {
  selectedGame?: 'poe1' | 'poe2';
  userAccount?: UserAccount | null;
}

export const PoENinjaWrapperView: React.FC<PoENinjaWrapperProps> = ({
  selectedGame = 'poe1',
  userAccount
}) => {
  const isPoE2 = selectedGame === 'poe2';

  const presets: PortalPreset[] = isPoE2
    ? [
        { label: 'PoE 2 Builds', url: 'https://poe.ninja/poe2/builds' },
        { label: 'PoE 2 SSF Builds', url: 'https://poe.ninja/poe2/builds/challengessf' },
        { label: 'PoE 2 Economy', url: 'https://poe.ninja/poe2/economy' }
      ]
    : [
        { label: 'SSF Builds (Current)', url: 'https://poe.ninja/builds/challengessf' },
        { label: 'HC SSF Builds', url: 'https://poe.ninja/builds/challengehcssf' },
        { label: 'Trade Builds', url: 'https://poe.ninja/builds/challenge' },
        { label: 'Unique Items', url: 'https://poe.ninja/economy/challenge/unique-armours' },
        { label: 'Divination Cards', url: 'https://poe.ninja/economy/challenge/divination-cards' },
        { label: 'Cluster Jewels', url: 'https://poe.ninja/economy/challenge/cluster-jewels' },
        { label: 'Skill Gems', url: 'https://poe.ninja/economy/challenge/skill-gems' }
      ];

  return (
    <ExternalPortalFrame
      title={isPoE2 ? 'PoE 2 Ninja Portal' : 'PoE Ninja Portal'}
      badge="Live Current League Ladders"
      subtitle="Explore live SSF ladder builds, passive skill heatmaps, gem setups, and economy prices for the active challenge league."
      accentColor="emerald"
      icon={<TrendingUp className="w-5 h-5" />}
      initialUrl={isPoE2 ? 'https://poe.ninja/poe2/builds' : 'https://poe.ninja/builds/challengessf'}
      searchPlaceholder="Search SSF ladder by skill (e.g. Penance Brand, Lightning Strike)..."
      buildSearchUrl={(q) =>
        isPoE2
          ? `https://poe.ninja/poe2/builds?skills=${encodeURIComponent(q)}`
          : `https://poe.ninja/builds/challengessf?skills=${encodeURIComponent(q)}`
      }
      presets={presets}
      selectedGame={selectedGame}
      userAccount={userAccount}
      buildCharacterPresets={(ctx) => {
        const list: PortalPreset[] = [];
        if (ctx.member?.ascendancy) {
          const asc = ctx.member.ascendancy;
          list.push({
            label: `Compare ${asc} on SSF Ladder`,
            url: isPoE2
              ? `https://poe.ninja/poe2/builds?class=${encodeURIComponent(asc)}`
              : `https://poe.ninja/builds/challengessf?class=${encodeURIComponent(asc)}`
          });
        }
        return list;
      }}
    />
  );
};
