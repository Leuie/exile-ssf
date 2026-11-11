import type {
  LookingForItem,
  LeagueRosterMember,
  FoundUniqueVaultItem,
  CommunityGuide
} from '../types';

export interface CloudLeagueDataResponse {
  status: 'connected' | 'unconfigured' | 'error' | 'fallback';
  wishlist?: LookingForItem[] | null;
  roster?: LeagueRosterMember[] | null;
  vault?: FoundUniqueVaultItem[] | null;
  guides?: CommunityGuide[] | null;
  lastSynced?: string;
  message?: string;
}

// Determines the base API endpoint
// Defaults to relative /api which works in production on Cloudflare and local dev proxies
function getApiBase(): string {
  return '';
}

export async function fetchCloudLeagueData(
  leagueId: string = 'poe1-330-umbra'
): Promise<CloudLeagueDataResponse | null> {
  try {
    const res = await fetch(`${getApiBase()}/api/data?league=${encodeURIComponent(leagueId)}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      }
    });

    if (!res.ok) {
      return null;
    }

    const data: CloudLeagueDataResponse = await res.json();
    return data;
  } catch {
    // Network or server unreachable: return null to let local storage handle seamlessly
    return null;
  }
}

export async function saveCloudWishlistItem(
  leagueId: string = 'poe1-330-umbra',
  item: LookingForItem
): Promise<boolean> {
  try {
    const res = await fetch(`${getApiBase()}/api/wishlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ leagueId, item })
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function deleteCloudWishlistItem(
  leagueId: string = 'poe1-330-umbra',
  itemId: string
): Promise<boolean> {
  try {
    const res = await fetch(
      `${getApiBase()}/api/wishlist/${encodeURIComponent(itemId)}?league=${encodeURIComponent(leagueId)}`,
      {
        method: 'DELETE'
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}

export async function saveCloudRosterMember(
  leagueId: string = 'poe1-330-umbra',
  member: LeagueRosterMember
): Promise<boolean> {
  try {
    const res = await fetch(`${getApiBase()}/api/roster`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ leagueId, member })
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function saveCloudVaultItem(
  leagueId: string = 'poe1-330-umbra',
  item: FoundUniqueVaultItem
): Promise<boolean> {
  try {
    const res = await fetch(`${getApiBase()}/api/vault`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ leagueId, item })
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function saveCloudGuide(
  leagueId: string = 'poe1-330-umbra',
  guide: CommunityGuide
): Promise<boolean> {
  try {
    const res = await fetch(`${getApiBase()}/api/guides`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ leagueId, guide })
    });
    return res.ok;
  } catch {
    return false;
  }
}
