// Shared Live Farming Session Bridge connecting Map Tracker, Asset Tracker, and the global Mapping HUD strip.

export const LIVE_SESSION_KEY = 'exile_ssf_live_farming_session_v1';
export const LIVE_SESSION_EVENT = 'exile-ssf:live-session-updated';

export interface LiveFarmingSession {
  watchingLive: boolean;
  mapsCompleted: number;
  elapsedMinutes: number;
  currentZone: string;
  zoneKind: string;
  mapsPerHr: number;
  xpPerHrM: number;
  strategyTag: string;
  updatedAtIso: string;
}

export function readLiveFarmingSession(): LiveFarmingSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LIVE_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed as LiveFarmingSession;
  } catch {
    return null;
  }
}

export function publishLiveFarmingSession(session: LiveFarmingSession): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LIVE_SESSION_KEY, JSON.stringify(session));
    window.dispatchEvent(new CustomEvent(LIVE_SESSION_EVENT, { detail: session }));
  } catch {}
}
