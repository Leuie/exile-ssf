import React, { useState, useRef } from 'react';
import { Swords, Sparkles, Shield } from 'lucide-react';
import { fetchUserToolState } from '../../services/cloudSync';
import type { CharacterGearSnapshot } from './CharacterPaperdollView';

// Session level in-memory cache so repeated hovers never re-hit D1
const snapshotCache = new Map<string, Record<string, CharacterGearSnapshot> | null>();
const inflightCache = new Map<string, Promise<Record<string, CharacterGearSnapshot> | null>>();

async function loadCachedSnapshots(handle: string): Promise<Record<string, CharacterGearSnapshot> | null> {
  const key = handle.trim().replace(/^@/, '').toLowerCase();
  if (!key) return null;
  if (snapshotCache.has(key)) return snapshotCache.get(key) || null;
  if (inflightCache.has(key)) return inflightCache.get(key)!;

  const p = fetchUserToolState<Record<string, any>>(key, 'character_gear_snapshots')
    .then((raw) => {
      if (!raw || typeof raw !== 'object') {
        snapshotCache.set(key, null);
        return null;
      }
      const cleaned: Record<string, CharacterGearSnapshot> = {};
      for (const [k, v] of Object.entries(raw)) {
        if (k !== '__lastSelectedChar' && v && typeof v === 'object' && v.character) {
          cleaned[k] = v as CharacterGearSnapshot;
        }
      }
      const result = Object.keys(cleaned).length > 0 ? cleaned : null;
      snapshotCache.set(key, result);
      return result;
    })
    .catch(() => {
      snapshotCache.set(key, null);
      return null;
    })
    .finally(() => {
      inflightCache.delete(key);
    });

  inflightCache.set(key, p);
  return p;
}

export interface CharacterHoverCardProps {
  handle: string;
  characterName?: string;
  onOpenArmory?: (handle: string, charName?: string) => void;
  children: React.ReactNode;
}

export const CharacterHoverCard: React.FC<CharacterHoverCardProps> = ({
  handle,
  characterName,
  onOpenArmory,
  children
}) => {
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [snap, setSnap] = useState<CharacterGearSnapshot | null>(null);
  const timerRef = useRef<number | null>(null);

  const handleMouseEnter = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(async () => {
      setOpen(true);
      const clean = handle.trim().replace(/^@/, '');
      if (!clean) return;
      if (!snapshotCache.has(clean.toLowerCase())) {
        setLoading(true);
      }
      const all = await loadCachedSnapshots(clean);
      setLoading(false);
      if (!all) {
        setSnap(null);
        return;
      }
      const targetLower = (characterName || '').trim().toLowerCase();
      const matched =
        (targetLower
          ? Object.values(all).find((s) => s.character?.name?.toLowerCase() === targetLower)
          : null) ||
        Object.values(all).sort(
          (a, b) => new Date(b.syncedAtIso || 0).getTime() - new Date(a.syncedAtIso || 0).getTime()
        )[0] ||
        null;
      setSnap(matched);
    }, 180);
  };

  const handleMouseLeave = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setOpen(false), 160);
  };

  const headlineItems = (snap?.equipped || [])
    .filter((i) => i.icon && ['Weapon', 'BodyArmour', 'Helm', 'Belt', 'Amulet'].includes(i.inventoryId))
    .slice(0, 5);
  const keystones = (snap?.passives?.keystones || []).slice(0, 4);

  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {open && (
        <div
          className="absolute left-0 top-full mt-1.5 z-50 w-72 p-3 rounded-xl border border-amber-500/40 bg-slate-950/98 shadow-[0_16px_45px_rgba(0,0,0,0.92)] backdrop-blur-md text-left space-y-2.5"
          onMouseEnter={() => {
            if (timerRef.current) window.clearTimeout(timerRef.current);
          }}
          onMouseLeave={handleMouseLeave}
        >
          {loading ? (
            <div className="py-3 text-center text-[11px] font-mono text-slate-400">
              Loading Armory snapshot...
            </div>
          ) : snap ? (
            <>
              <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">{snap.character.name}</div>
                  <div className="text-[10px] font-mono text-amber-300">
                    Lvl {snap.character.level} {snap.character.className}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">{snap.character.league}</div>
                </div>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-[9px] font-mono shrink-0">
                  Synced
                </span>
              </div>

              {headlineItems.length > 0 && (
                <div className="flex items-center gap-1.5">
                  {headlineItems.map((it) => (
                    <div
                      key={it.id}
                      title={it.name || it.typeLine}
                      className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 p-0.5 flex items-center justify-center"
                    >
                      <img src={it.icon} alt={it.name || it.typeLine} className="max-w-full max-h-full object-contain" />
                    </div>
                  ))}
                </div>
              )}

              {keystones.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {keystones.map((ks, idx) => (
                    <span
                      key={idx}
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/35 text-indigo-200"
                    >
                      {ks.name}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80 text-[10px] font-mono text-slate-400">
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-sky-400" />
                  <span>{snap.passives?.allocatedCount || 0} Passives</span>
                </span>
                {onOpenArmory && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpen(false);
                      onOpenArmory(handle, snap.character.name);
                    }}
                    className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/45 text-amber-200 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Swords className="w-2.5 h-2.5" />
                    <span>Inspect Armory</span>
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-1.5 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>@{handle.replace(/^@/, '')}</span>
              </div>
              <p className="text-[10px] leading-relaxed">
                No synced Armory snapshot yet for this exile.
              </p>
              {onOpenArmory && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpen(false);
                    onOpenArmory(handle, characterName);
                  }}
                  className="text-[10px] font-mono text-amber-300 hover:text-amber-200 underline cursor-pointer"
                >
                  Open Armory Page →
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </span>
  );
};
