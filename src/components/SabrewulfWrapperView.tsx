import React from 'react';
import { Hammer } from 'lucide-react';
import type { UserAccount } from '../types';
import { ExternalPortalFrame, type PortalPreset } from './ExternalPortalFrame';

interface SabrewulfWrapperProps {
  userAccount?: UserAccount | null;
}

export const SabrewulfWrapperView: React.FC<SabrewulfWrapperProps> = ({ userAccount }) => {
  const presets: PortalPreset[] = [
    { label: 'Crafting Bench Home', url: 'https://sabrewulf.net/' }
  ];

  return (
    <ExternalPortalFrame
      title="Sabrewulf Crafting Bench"
      badge="Interactive In Game Bench"
      subtitle="Visual interactive replica of the Path of Exile Crafting Bench showing exact craft layouts, affix tiers, and currency costs."
      accentColor="amber"
      icon={<Hammer className="w-5 h-5" />}
      initialUrl="https://sabrewulf.net/"
      searchPlaceholder="Open Sabrewulf.net or jump directly in a new tab..."
      buildSearchUrl={() => 'https://sabrewulf.net/'}
      presets={presets}
      selectedGame="poe1"
      userAccount={userAccount}
    />
  );
};
