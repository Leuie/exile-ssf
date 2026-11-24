// Modular OpenGraph & SEO HTML metadata injector for Exile SSF Worker

export interface PageMeta {
  title: string;
  description: string;
}

function escapeHtmlAttr(val: string): string {
  return val
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function resolveLeagueDisplayName(leagueId: string): string {
  const clean = leagueId.toLowerCase().trim();
  if (clean === 'poe1-330-umbra') return 'Ravenwatch Covens of Umbra GSF (PL87651)';
  if (clean === 'poe1-329-mirage') return 'Ravenwatch Mirage GSF (3.29)';
  if (clean === 'poe2-05-alpha') return 'Ravenwatch PoE 2 GSF';
  return leagueId
    .split('-')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ''))
    .join(' ');
}

export function resolvePageMeta(url: URL): PageMeta {
  const path = url.pathname.toLowerCase().replace(/\/+$/, '') || '/';
  const queryTab = (url.searchParams.get('tab') || url.searchParams.get('page') || '').toLowerCase().trim();

  if (path.startsWith('/league/')) {
    const parts = path.replace('/league/', '').split('/').filter(Boolean);
    const leagueId = parts[0] || 'poe1-330-umbra';
    const subTab = parts[1] || queryTab || 'command-center';
    const leagueName = resolveLeagueDisplayName(leagueId);

    if (subTab === 'wishlists' || subTab === 'wishlist' || subTab === 'needs' || subTab === 'looking_for' || subTab === 'looking-for') {
      return {
        title: `Wishlists | ${leagueName} | Exile SSF`,
        description: `Track wanted uniques, gems, boss fragments, and crafting bases across ${leagueName} with official item icons, character filters, and instant loot filter generation.`
      };
    }
    if (subTab === 'bounties' || subTab === 'bounty' || subTab === 'honors' || subTab === 'achievements' || subTab === 'rewards') {
      return {
        title: `Bounties | ${leagueName} | Exile SSF`,
        description: `Post incentivized finder bounties, browse squad boss carries and vouches, track Fulfillment Heroes, and unlock achievements that carry over across future seasons.`
      };
    }
    if (subTab === 'roster' || subTab === 'roster-directory' || subTab === 'directory') {
      return {
        title: `Roster | ${leagueName} | Exile SSF`,
        description: `View active private league account slots, multi character builds, ascendancies, automated 12 hour official ladder syncs, and direct contact handles for ${leagueName}.`
      };
    }
    if (subTab === 'mechanics' || subTab === 'atlas-mechanics' || subTab === 'matrix') {
      return {
        title: `Atlas Mechanics Matrix | ${leagueName} | Exile SSF`,
        description: `Coordinate all 25 Atlas and Endgame farming lanes across ${leagueName} including Bestiary, Abyss, Delve, Harvest, Expedition, Heist, Sanctum, and more.`
      };
    }
    if (subTab === 'hall-of-fame' || subTab === 'halloffame' || subTab === 'firsts' || subTab === 'league-firsts') {
      return {
        title: `Hall of Fame & League Firsts | ${leagueName} | Exile SSF`,
        description: `Celebrate League Firsts milestones, Pinnacle Boss kills, Level 100 achievements, and Hall of Fame winners across ${leagueName}.`
      };
    }
    if (subTab === 'guides' || subTab === 'build-guides' || subTab === 'buildguides') {
      return {
        title: `Builds | ${leagueName} | Exile SSF`,
        description: `Explore curated SSF league starter and endgame build guides with PoB links, class filters, and one click import of required uniques to your wishlist.`
      };
    }
    if (subTab === 'cheatsheets' || subTab === 'cheat-sheets') {
      return {
        title: `Cheat Sheets | ${leagueName} | Exile SSF`,
        description: `Quick reference tables for 3.30 Covens of Umbra mechanics, Betrayal Syndicate rewards, Heist Rogues, Delve Fossils, Incursion rooms, and Atlas Maps.`
      };
    }
    if (subTab === 'bench' || subTab === 'bench-stash-guide' || subTab === 'new_player' || subTab === 'stash') {
      return {
        title: `Crafting Bench | ${leagueName} | Exile SSF`,
        description: `Essential crafting bench recipe unlock locations and prioritized stash tab buyer tiers for Solo Self Found and Group Self Found progression.`
      };
    }
    if (subTab === 'feed' || subTab === 'activity' || subTab === 'wall') {
      return {
        title: `League Feed | ${leagueName} | Exile SSF`,
        description: `Live activity wall for ${leagueName} tracking new exiles, characters, wishlist drops, bounties, fulfillments, build guides, and achievements.`
      };
    }
    if (subTab === 'alumni' || subTab === 'alumni-directory') {
      return {
        title: `Alumni | ${leagueName} | Exile SSF`,
        description: `Historical directory of past private league participants across seasons with preferred contact tags and squad outreach tools.`
      };
    }
    return {
      title: `Command Center | ${leagueName} | Exile SSF`,
      description: `League headquarters for ${leagueName} with live crowdfunding status, official reveal videos, onboarding, community links, archives, and F.A.Q.`
    };
  }

  if (path.startsWith('/exile/') || path.startsWith('/player/')) {
    const rawHandle = decodeURIComponent(path.replace(/^\/(exile|player)\//, '').split('/')[0] || 'Exile');
    const cleanHandle = rawHandle.replace(/^@/, '');
    return {
      title: `@${cleanHandle} | Exile Profile | Exile SSF`,
      description: `View @${cleanHandle}'s Multi League Career Passport, character roster, open wishlists, verified vouches, and achievements on Exile SSF.`
    };
  }

  if (path === '/armory' || path.startsWith('/armory/') || path === '/character' || path.startsWith('/character/')) {
    const parts = path.replace(/^\/(armory|character)\/?/, '').split('/').filter(Boolean);
    const handle = parts[0] ? decodeURIComponent(parts[0]).replace(/^@/, '') : '';
    const charName = parts[1] ? decodeURIComponent(parts[1]) : '';
    if (handle && charName) {
      return {
        title: `${charName} (@${handle}) | Character Armory | Exile SSF`,
        description: `Inspect ${charName} (@${handle}) in the Exile SSF Character Armory: live Path of Exile gear paperdoll, socketed gems, affix tiers, jewels, and interactive passive skill tree.`
      };
    }
    if (handle) {
      return {
        title: `@${handle} | Character Armory | Exile SSF`,
        description: `Inspect @${handle}'s synced Path of Exile characters, equipment paperdoll, jewels, and interactive passive skill tree on Exile SSF.`
      };
    }
    return {
      title: 'Character Armory | Exile SSF',
      description: 'Inspect any Path of Exile character with a full width equipment paperdoll, socket & gem inspector, Prefix/Suffix affix tiers, Cluster/Abyss jewels, and interactive passive tree.'
    };
  }

  if (path === '/privateleaguehub' || path === '/privateleagues') {
    return {
      title: 'Private League Directory | Exile SSF',
      description: 'Browse active and upcoming Group Self Found private leagues for Path of Exile 1 and Path of Exile 2, or launch a new community league.'
    };
  }

  if (path.startsWith('/guide/')) {
    return {
      title: 'Build Guide Reader | Exile SSF',
      description: 'Full interactive Path of Exile SSF build guide with leveling progression, endgame gearing, PoB links, and one click wishlist unique import.'
    };
  }

  if (path === '/login') {
    return {
      title: 'Sign In | Exile SSF',
      description: 'Sign in to your Exile SSF account to sync characters, wishlists, item bounties, and achievements across private league seasons.'
    };
  }

  if (path === '/register') {
    return {
      title: 'Register Account | Exile SSF',
      description: 'Create your Exile SSF profile to join private leagues, register multiple characters, post wanted items, and track achievements.'
    };
  }

  if (path === '/patch-notes' || path === '/patchnotes') {
    return {
      title: 'Official Patch Notes (PoE 1 & PoE 2) | Exile SSF',
      description: 'Full width Path of Exile 1 and Path of Exile 2 official patch notes pulled live from Grinding Gear Games with EST timestamps and instant keyword search.'
    };
  }

  if (path === '/feedback' || path === '/changelog') {
    return {
      title: 'Changelog & Feedback | Exile SSF',
      description: 'Timestamped Exile SSF site patch notes documenting every new feature, improvement, fix, and removal alongside live community feature requests and bug reports.'
    };
  }

  if (path === '/builds' || path === '/build-hub') {
    return {
      title: 'SSF & GSF Builds Hub (PoE 1 & PoE 2) | Exile SSF',
      description: 'Browse Path of Exile 1 and Path of Exile 2 community guides, verified SSF league starters, live Mobalytics and Maxroll guides, and PoB Build Doctor diagnostics.'
    };
  }

  if (path === '/assets/analytics' || path === '/wealth-analytics' || path === '/wealth/analytics') {
    return {
      title: 'Wealth & Pace Analytics | Exile SSF',
      description: 'Full page interactive Wealth Timeline, farming pace, top yielding tabs leaderboard, and category breakdown synced per league to your Exile SSF cloud profile.'
    };
  }

  if (path === '/assets' || path === '/asset-tracker' || path === '/farming' || path === '/drops' || path === '/wealth') {
    return {
      title: 'Asset Tracker (PoE 1 & PoE 2) | Exile SSF',
      description: 'Visualize your stash net worth, compare Before vs After farming runs, track 18 canonical tabs, and match squad wishlists with live poe.ninja prices and SSF Utility weights.'
    };
  }

  if (path === '/maps' || path === '/map-tracker') {
    return {
      title: 'Map Tracker & XP/hr Telemetry (PoE 1 & PoE 2) | Exile SSF',
      description: 'Realtime Client.txt mapping telemetry, per map duration, hideout downtime tracking, live GGG experience XP/hr polling, and Atlas strategy analytics.'
    };
  }

  if (path === '/sabrewulf') {
    return {
      title: 'Sabrewulf Interactive Crafting Bench | Exile SSF',
      description: 'Visual interactive Path of Exile Crafting Bench layout with mod tiers, crafting costs, and quick reference lookup inside Exile SSF.'
    };
  }

  if (path === '/regex' || path === '/regex-studio') {
    return {
      title: 'Regex Studio (PoE 1 & PoE 2) | Exile SSF',
      description: 'Build and cloud sync Path of Exile 1 and Path of Exile 2 vendor, map mod, and item filter regex presets with auto generated build safe map filters.'
    };
  }

  if (path === '/privacy' || path === '/privacy-policy') {
    return {
      title: 'Privacy Policy | Exile SSF',
      description: 'How Exile SSF handles Cloudflare D1 cloud data, stateless POESESSID stash syncs, local Client.txt parsing, and signed session cookies.'
    };
  }

  if (path === '/admin') {
    return {
      title: 'League Admin Portal | Exile SSF',
      description: 'Host administration tools for managing private league rosters, ownership assignments, resource links, and seasonal resets.'
    };
  }

  return {
    title: 'Exile SSF | Path of Exile 1 & 2 Compendium and GSF Portal',
    description: 'All in one Solo Self Found compendium and Group Self Found private league hub for Path of Exile 1 (3.30 Covens of Umbra) and Path of Exile 2.'
  };
}

export function injectMetaIntoHtml(html: string, meta: PageMeta, pageUrl: string): string {
  const safeTitle = escapeHtmlAttr(meta.title);
  const safeDesc = escapeHtmlAttr(meta.description);
  const safeUrl = escapeHtmlAttr(pageUrl);

  return html
    .replace(/<title>[^<]*<\/title>/i, `<title>${safeTitle}</title>`)
    .replace(/<meta name="description" content="[^"]*" \/>/i, `<meta name="description" content="${safeDesc}" />`)
    .replace(/<meta property="og:title" content="[^"]*" \/>/i, `<meta property="og:title" content="${safeTitle}" />`)
    .replace(/<meta property="og:description" content="[^"]*" \/>/i, `<meta property="og:description" content="${safeDesc}" />`)
    .replace(/<meta property="og:url" content="[^"]*" \/>/i, `<meta property="og:url" content="${safeUrl}" />`)
    .replace(/<meta name="twitter:title" content="[^"]*" \/>/i, `<meta name="twitter:title" content="${safeTitle}" />`)
    .replace(/<meta name="twitter:description" content="[^"]*" \/>/i, `<meta name="twitter:description" content="${safeDesc}" />`);
}
