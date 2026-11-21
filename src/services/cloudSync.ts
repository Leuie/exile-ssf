import type {
  LookingForItem,
  LeagueRosterMember,
  FoundUniqueVaultItem,
  CommunityGuide,
  PersistentAchievementProfile,
  LeagueParticipantAlumnus,
  SiteFeedbackItem,
  ActiveLeagueSession,
  PastPrivateLeague,
  SquadServiceListing,
  PlayerVouch,
  OfficialLadderEntry,
  ExileProfile,
  FreeStashDrop,
  BossRotaListing,
  LeagueFirstMilestone,
  LeagueFeedEvent
} from '../types';

export interface CloudLeagueMeta {
  quickLinks?: any[];
  faqList?: any[];
  archivesList?: PastPrivateLeague[];
}

export interface CloudLeagueDataResponse {
  status: 'connected' | 'unconfigured' | 'error' | 'fallback';
  storage?: 'd1' | 'kv';
  wishlist?: LookingForItem[] | null;
  roster?: LeagueRosterMember[] | null;
  vault?: FoundUniqueVaultItem[] | null;
  guides?: CommunityGuide[] | null;
  achievements?: Record<string, PersistentAchievementProfile> | null;
  alumni?: LeagueParticipantAlumnus[] | null;
  meta?: CloudLeagueMeta | null;
  services?: SquadServiceListing[] | null;
  vouches?: PlayerVouch[] | null;
  stashDrops?: FreeStashDrop[] | null;
  bossRotas?: BossRotaListing[] | null;
  leagueFirsts?: LeagueFirstMilestone[] | null;
  activityFeed?: LeagueFeedEvent[] | null;
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
    const timestamp = Date.now();
    const res = await fetch(`${getApiBase()}/api/data?league=${encodeURIComponent(leagueId)}&_t=${timestamp}`, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'Cache-Control': 'no-cache'
      }
    });

    if (!res.ok) {
      return null;
    }

    const data: CloudLeagueDataResponse = await res.json();
    return data;
  } catch {
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

export async function deleteCloudRosterMember(
  leagueId: string = 'poe1-330-umbra',
  memberId: string
): Promise<boolean> {
  try {
    const res = await fetch(
      `${getApiBase()}/api/roster/${encodeURIComponent(memberId)}?league=${encodeURIComponent(leagueId)}`,
      {
        method: 'DELETE'
      }
    );
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

export async function saveCloudAchievementProfile(
  playerKey: string,
  profile: PersistentAchievementProfile
): Promise<PersistentAchievementProfile | null> {
  try {
    const res = await fetch(`${getApiBase()}/api/achievements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ playerKey, profile })
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.profile || profile;
  } catch {
    return null;
  }
}

export async function saveCloudAlumniList(
  alumni: LeagueParticipantAlumnus[]
): Promise<boolean> {
  try {
    const res = await fetch(`${getApiBase()}/api/alumni`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ alumni })
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchCloudFeedback(): Promise<SiteFeedbackItem[] | null> {
  try {
    const timestamp = Date.now();
    const res = await fetch(`${getApiBase()}/api/feedback?_t=${timestamp}`, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data.feedback) ? data.feedback : null;
  } catch {
    return null;
  }
}

export async function saveCloudFeedbackItem(item: SiteFeedbackItem): Promise<boolean> {
  try {
    const res = await fetch(`${getApiBase()}/api/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ item })
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function saveCloudLeagueMeta(
  leagueId: string,
  meta: CloudLeagueMeta
): Promise<boolean> {
  try {
    const res = await fetch(`${getApiBase()}/api/meta`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leagueId, ...meta })
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchCloudLeagues(): Promise<ActiveLeagueSession[] | null> {
  try {
    const res = await fetch(`${getApiBase()}/api/leagues?_t=${Date.now()}`, {
      method: 'GET',
      cache: 'no-store',
      headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data.leagues) ? data.leagues : null;
  } catch {
    return null;
  }
}

export async function saveCloudLeague(league: ActiveLeagueSession): Promise<boolean> {
  try {
    const res = await fetch(`${getApiBase()}/api/leagues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ league })
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchCloudAccounts(): Promise<any[] | null> {
  try {
    const res = await fetch(`${getApiBase()}/api/accounts?_t=${Date.now()}`, {
      method: 'GET',
      cache: 'no-store',
      headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data.accounts) ? data.accounts : null;
  } catch {
    return null;
  }
}

export async function saveCloudAccount(account: any): Promise<boolean> {
  try {
    const res = await fetch(`${getApiBase()}/api/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account })
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function saveCloudService(
  leagueId: string,
  service: SquadServiceListing
): Promise<boolean> {
  try {
    const res = await fetch(`${getApiBase()}/api/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leagueId, service })
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function deleteCloudService(
  leagueId: string,
  serviceId: string
): Promise<boolean> {
  try {
    const res = await fetch(
      `${getApiBase()}/api/services/${encodeURIComponent(serviceId)}?league=${encodeURIComponent(leagueId)}`,
      { method: 'DELETE' }
    );
    return res.ok;
  } catch {
    return false;
  }
}

export async function saveCloudVouch(
  leagueId: string,
  vouch: PlayerVouch
): Promise<boolean> {
  try {
    const res = await fetch(`${getApiBase()}/api/vouches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leagueId, vouch })
    });
    return res.ok;
  } catch {
    return false;
  }
}

export interface OfficialLadderResponse {
  status: 'ok' | 'unavailable' | 'error';
  leagueName?: string;
  total?: number;
  syncedAtIso?: string;
  entries?: OfficialLadderEntry[];
  message?: string;
}

export async function fetchOfficialPoeLadder(
  leagueId: string,
  officialLeagueName?: string,
  forceRefresh: boolean = false
): Promise<OfficialLadderResponse | null> {
  try {
    const params = new URLSearchParams({ league: leagueId });
    if (officialLeagueName) params.set('name', officialLeagueName);
    if (forceRefresh) params.set('refresh', '1');
    const res = await fetch(`${getApiBase()}/api/ladder?${params.toString()}`, {
      method: 'GET',
      cache: 'no-store',
      headers: { Accept: 'application/json' }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export interface CloudExileProfileResponse {
  status: 'ok' | 'error';
  profile: ExileProfile;
  rosterEntries: { leagueId: string; member: LeagueRosterMember }[];
  wishes: LookingForItem[];
  fulfilledByMe: LookingForItem[];
  services: SquadServiceListing[];
  vouches: PlayerVouch[];
  achievementProfile: PersistentAchievementProfile | null;
  alumniRecord: LeagueParticipantAlumnus | null;
}

export async function fetchCloudProfile(handle: string): Promise<CloudExileProfileResponse | null> {
  try {
    const clean = handle.trim().replace(/^@/, '');
    if (!clean) return null;
    const res = await fetch(`${getApiBase()}/api/profile/${encodeURIComponent(clean)}?_t=${Date.now()}`, {
      method: 'GET',
      cache: 'no-store',
      headers: { Accept: 'application/json' }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function saveCloudProfile(profile: ExileProfile): Promise<boolean> {
  try {
    const res = await fetch(`${getApiBase()}/api/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile })
    });
    return res.ok;
  } catch {
    return false;
  }
}

export interface CloudAuthResult {
  success: boolean;
  userAccount?: any;
  rosterEntry?: any;
  error?: string;
}

export async function cloudAuthRegister(payload: {
  username: string;
  email?: string;
  password: string;
  userAccount: any;
  rosterEntry: any;
}): Promise<CloudAuthResult> {
  try {
    const res = await fetch(`${getApiBase()}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error || 'Registration failed' };
    return { success: true, userAccount: data.userAccount, rosterEntry: data.rosterEntry };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function cloudAuthLogin(identifier: string, password: string): Promise<CloudAuthResult> {
  try {
    const res = await fetch(`${getApiBase()}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error || 'Invalid credentials' };
    return { success: true, userAccount: data.userAccount, rosterEntry: data.rosterEntry };
  } catch {
    return { success: false, error: 'Network error' };
  }
}


export async function saveCloudStashDrop(
  leagueId: string,
  drop: FreeStashDrop
): Promise<boolean> {
  try {
    const res = await fetch(`${getApiBase()}/api/stash-drops`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leagueId, drop })
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function deleteCloudStashDrop(
  leagueId: string,
  dropId: string
): Promise<boolean> {
  try {
    const res = await fetch(
      `${getApiBase()}/api/stash-drops/${encodeURIComponent(dropId)}?league=${encodeURIComponent(leagueId)}`,
      { method: 'DELETE' }
    );
    return res.ok;
  } catch {
    return false;
  }
}

export async function saveCloudBossRota(
  leagueId: string,
  rota: BossRotaListing
): Promise<boolean> {
  try {
    const res = await fetch(`${getApiBase()}/api/boss-rotas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leagueId, rota })
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function deleteCloudBossRota(
  leagueId: string,
  rotaId: string
): Promise<boolean> {
  try {
    const res = await fetch(
      `${getApiBase()}/api/boss-rotas/${encodeURIComponent(rotaId)}?league=${encodeURIComponent(leagueId)}`,
      { method: 'DELETE' }
    );
    return res.ok;
  } catch {
    return false;
  }
}

export async function saveCloudLeagueFirst(
  leagueId: string,
  milestone: LeagueFirstMilestone
): Promise<boolean> {
  try {
    const res = await fetch(`${getApiBase()}/api/league-firsts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leagueId, milestone })
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function saveCloudFeedEvent(
  leagueId: string,
  event: LeagueFeedEvent
): Promise<boolean> {
  try {
    const res = await fetch(`${getApiBase()}/api/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leagueId, event })
    });
    return res.ok;
  } catch {
    return false;
  }
}

export interface WebhookConfigPayload {
  url: string;
  enabled: boolean;
  events: string[];
}

export async function fetchWebhookConfig(): Promise<WebhookConfigPayload | null> {
  try {
    const res = await fetch(`${getApiBase()}/api/admin/webhook?_t=${Date.now()}`, {
      method: 'GET',
      cache: 'no-store'
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.config || null;
  } catch {
    return null;
  }
}

export async function saveWebhookConfig(config: WebhookConfigPayload): Promise<boolean> {
  try {
    const res = await fetch(`${getApiBase()}/api/admin/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function sendTestWebhookAlert(leagueId: string = 'poe1-330-umbra'): Promise<boolean> {
  try {
    const res = await fetch(`${getApiBase()}/api/admin/test-webhook?league=${encodeURIComponent(leagueId)}`, {
      method: 'POST'
    });
    return res.ok;
  } catch {
    return false;
  }
}
