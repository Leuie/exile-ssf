// Unified browser-only POESESSID + one-time disclaimer storage shared across
// Tool Setup, Asset Tracker, Character Armory, and Map Tracker.
// POESESSID is NEVER persisted to any server database or KV store.

export const UNIFIED_POESESSID_KEY = 'exile_ssf_optin_poesessid_v1';
const LEGACY_ARMORY_POESESSID_KEY = 'exile_ssf_poesessid_optin_v1';
export const POESESSID_DISCLAIMER_KEY = 'exile_ssf_poesessid_disclaimer_ack_v1';
export const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export interface SavedPoeSession {
  poesessid: string;
  accountName: string;
  leagueName?: string;
  savedAtMs: number;
  expiresAtMs: number;
  accepted: boolean;
}

/**
 * Read the saved POESESSID from browser localStorage (valid for 30 days).
 * Automatically migrates legacy Armory storage key if present.
 */
export function readUnifiedPoeSession(): SavedPoeSession | null {
  if (typeof window === 'undefined') return null;
  try {
    let raw = localStorage.getItem(UNIFIED_POESESSID_KEY);
    if (!raw) {
      const legacy = localStorage.getItem(LEGACY_ARMORY_POESESSID_KEY);
      if (legacy) {
        raw = legacy;
        try {
          localStorage.setItem(UNIFIED_POESESSID_KEY, legacy);
          localStorage.removeItem(LEGACY_ARMORY_POESESSID_KEY);
        } catch {}
      }
    }
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const key = typeof parsed?.poesessid === 'string' ? parsed.poesessid.trim() : '';
    if (!key) return null;

    const savedAtMs = Number(parsed?.savedAtMs || Date.now());
    const expiresAtMs = Number(parsed?.expiresAtMs || savedAtMs + THIRTY_DAYS_MS);
    if (Date.now() > expiresAtMs) {
      localStorage.removeItem(UNIFIED_POESESSID_KEY);
      localStorage.removeItem(LEGACY_ARMORY_POESESSID_KEY);
      return null;
    }

    return {
      poesessid: key,
      accountName: String(parsed?.accountName || '').trim(),
      leagueName: typeof parsed?.leagueName === 'string' ? parsed.leagueName.trim() : undefined,
      savedAtMs,
      expiresAtMs,
      accepted: true
    };
  } catch {
    return null;
  }
}

/**
 * Save POESESSID locally for 30 days and mark the one-time disclaimer permanently acknowledged.
 */
export function saveUnifiedPoeSession(params: {
  poesessid: string;
  accountName?: string;
  leagueName?: string;
}): void {
  if (typeof window === 'undefined') return;
  const cleanKey = params.poesessid.trim();
  if (!cleanKey) return;
  const now = Date.now();
  const payload: SavedPoeSession = {
    poesessid: cleanKey,
    accountName: (params.accountName || '').trim(),
    leagueName: (params.leagueName || '').trim() || undefined,
    savedAtMs: now,
    expiresAtMs: now + THIRTY_DAYS_MS,
    accepted: true
  };
  try {
    localStorage.setItem(UNIFIED_POESESSID_KEY, JSON.stringify(payload));
    localStorage.removeItem(LEGACY_ARMORY_POESESSID_KEY);
    markPoeDisclaimerAcknowledged();
  } catch {}
}

/**
 * Scrap the locally stored POESESSID across all tools.
 */
export function clearUnifiedPoeSession(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(UNIFIED_POESESSID_KEY);
    localStorage.removeItem(LEGACY_ARMORY_POESESSID_KEY);
  } catch {}
}

/**
 * Returns true if the user has ever dismissed/acknowledged the POESESSID disclaimer.
 * Permanent once acknowledged so the user is never nagged again.
 */
export function isPoeDisclaimerAcknowledged(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(POESESSID_DISCLAIMER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.permanent || parsed?.acknowledgedAtMs) return true;
    }
    // If they already have a saved session, treat disclaimer as acknowledged too
    if (readUnifiedPoeSession()?.poesessid) return true;
    return false;
  } catch {
    return false;
  }
}

/**
 * Permanently mark the POESESSID disclaimer as acknowledged/dismissed.
 */
export function markPoeDisclaimerAcknowledged(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      POESESSID_DISCLAIMER_KEY,
      JSON.stringify({ permanent: true, acknowledgedAtMs: Date.now() })
    );
  } catch {}
}
