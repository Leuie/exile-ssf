// Shared Active Character & Active Strategy Profile context across
// Character Armory, Map Tracker, Asset Tracker, and Sidebar.

export const ACTIVE_CHARACTER_KEY = 'exile_ssf_active_character_v1';
export const ACTIVE_STRATEGY_KEY = 'exile_ssf_active_strategy_v1';

export interface ActiveCharacterContext {
  name: string;
  level: number;
  className: string;
  league: string;
  handle: string;
  updatedAtIso: string;
}

export interface ActiveStrategyContext {
  strategy: string;
  atlasTreeId?: string;
  atlasTreeName?: string;
  updatedAtIso: string;
}

export function readActiveCharacter(): ActiveCharacterContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ACTIVE_CHARACTER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.name) return null;
    return {
      name: String(parsed.name),
      level: Number(parsed.level || 1),
      className: String(parsed.className || 'Exile'),
      league: String(parsed.league || ''),
      handle: String(parsed.handle || ''),
      updatedAtIso: String(parsed.updatedAtIso || '')
    };
  } catch {
    return null;
  }
}

export function saveActiveCharacter(ctx: Omit<ActiveCharacterContext, 'updatedAtIso'>): void {
  if (typeof window === 'undefined' || !ctx.name) return;
  const payload: ActiveCharacterContext = {
    ...ctx,
    updatedAtIso: new Date().toISOString()
  };
  try {
    localStorage.setItem(ACTIVE_CHARACTER_KEY, JSON.stringify(payload));
  } catch {}
  window.dispatchEvent(new CustomEvent('exile-active-character-updated', { detail: payload }));
}

export function readActiveStrategy(): ActiveStrategyContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ACTIVE_STRATEGY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.strategy) return null;
    return {
      strategy: String(parsed.strategy),
      atlasTreeId: parsed.atlasTreeId ? String(parsed.atlasTreeId) : undefined,
      atlasTreeName: parsed.atlasTreeName ? String(parsed.atlasTreeName) : undefined,
      updatedAtIso: String(parsed.updatedAtIso || '')
    };
  } catch {
    return null;
  }
}

export function saveActiveStrategy(ctx: Omit<ActiveStrategyContext, 'updatedAtIso'>): void {
  if (typeof window === 'undefined' || !ctx.strategy) return;
  const payload: ActiveStrategyContext = {
    ...ctx,
    updatedAtIso: new Date().toISOString()
  };
  try {
    localStorage.setItem(ACTIVE_STRATEGY_KEY, JSON.stringify(payload));
  } catch {}
  window.dispatchEvent(new CustomEvent('exile-active-strategy-updated', { detail: payload }));
}
