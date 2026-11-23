import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Activity,
  Compass
} from 'lucide-react';
import { fetchUserToolState, saveUserToolState } from '../../services/cloudSync';
import { buildPoeWikiUrl } from '../assets/assetEngine';

export interface PaperdollSocket {
  group: number;
  sColour: string;
}

export interface PaperdollGem {
  name: string;
  icon?: string;
  colour: string;
  socket: number;
  level: number;
  quality: number;
  support: boolean;
}

export interface PaperdollItem {
  id: string;
  inventoryId: string;
  x: number;
  name: string;
  baseType: string;
  typeLine: string;
  icon: string;
  frameType: number;
  ilvl: number;
  corrupted: boolean;
  sockets: PaperdollSocket[];
  socketedGems: PaperdollGem[];
  implicitMods: string[];
  explicitMods: string[];
  craftedMods: string[];
  enchantMods: string[];
  fracturedMods: string[];
}

export interface CharacterGearSnapshot {
  syncedAtIso: string;
  character: {
    name: string;
    league: string;
    className: string;
    level: number;
    experience: number;
  };
  equipped: PaperdollItem[];
  passives: {
    allocatedCount: number;
    jewelCount: number;
    voidstoneCount: number;
  };
  estimatedVitals: {
    flatLife: number;
    flatEs: number;
    fireRes: number;
    coldRes: number;
    lightningRes: number;
    chaosRes: number;
    suppress: number;
  };
}

export interface CharacterPaperdollViewProps {
  handle: string;
  poeAccountName?: string;
  rosterCharacters: Array<{
    characterName: string;
    ascendancy: string;
    level: number;
    buildName: string;
    leagueId: string;
    gameTag?: string;
  }>;
  canEdit: boolean;
  onNotify?: (msg: string) => void;
}

const POESESSID_STORAGE_KEY = 'exile_ssf_poesessid_optin_v1';
const SYNCED_VITALS_STORAGE_KEY = 'exile_ssf_synced_gear_vitals_v1';

const getRarityFrameClasses = (frameType: number): string => {
  switch (frameType) {
    case 3:
      return 'border-orange-500/75 bg-gradient-to-b from-orange-950/50 to-slate-950/90 shadow-[inset_0_0_16px_rgba(249,115,22,0.18)]';
    case 2:
      return 'border-amber-400/70 bg-gradient-to-b from-amber-950/40 to-slate-950/90 shadow-[inset_0_0_14px_rgba(251,191,36,0.14)]';
    case 1:
      return 'border-sky-400/70 bg-gradient-to-b from-sky-950/45 to-slate-950/90';
    case 9:
    case 10:
      return 'border-emerald-400/75 bg-gradient-to-b from-emerald-950/45 to-slate-950/90';
    default:
      return 'border-slate-700/90 bg-slate-950/90';
  }
};

const getRarityTitleColor = (frameType: number): string => {
  switch (frameType) {
    case 3:
      return 'text-orange-300';
    case 2:
      return 'text-amber-300';
    case 1:
      return 'text-sky-300';
    case 9:
    case 10:
      return 'text-emerald-300';
    default:
      return 'text-slate-100';
  }
};

const getSocketColorClasses = (sColour: string): string => {
  switch (String(sColour || '').toUpperCase()) {
    case 'R':
      return 'bg-rose-600 border-rose-300';
    case 'G':
      return 'bg-emerald-600 border-emerald-300';
    case 'B':
      return 'bg-sky-600 border-sky-300';
    case 'W':
      return 'bg-slate-100 border-white';
    case 'A':
      return 'bg-slate-900 border-emerald-400';
    default:
      return 'bg-slate-600 border-slate-300';
  }
};

const SocketOverlay: React.FC<{ sockets: PaperdollSocket[] }> = ({ sockets }) => {
  if (!sockets || sockets.length === 0) return null;
  const shown = sockets.slice(0, 6);
  const cols = shown.length <= 2 ? 1 : 2;
  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-center justify-center z-10"
      aria-hidden="true"
    >
      <div
        className="grid gap-1 p-1 rounded bg-slate-950/55 border border-amber-500/20"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {shown.map((s, idx) => {
          const prev = idx > 0 ? shown[idx - 1] : null;
          const linkedToPrev = prev && prev.group === s.group;
          return (
            <div key={idx} className="relative flex items-center justify-center">
              {linkedToPrev && (
                <span
                  className="absolute -left-1.5 w-2 h-1 rounded-full bg-amber-300/90 shadow-[0_0_4px_rgba(251,191,36,0.9)]"
                />
              )}
              <span
                className={`w-3.5 h-3.5 rounded-full border-2 shadow-md ${getSocketColorClasses(s.sColour)}`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const CharacterPaperdollView: React.FC<CharacterPaperdollViewProps> = ({
  handle,
  poeAccountName,
  rosterCharacters,
  canEdit,
  onNotify
}) => {
  const [snapshots, setSnapshots] = useState<Record<string, CharacterGearSnapshot>>({});
  const [selectedChar, setSelectedChar] = useState<string>('');
  const [weaponSet, setWeaponSet] = useState<1 | 2>(1);
  const [hoveredItem, setHoveredItem] = useState<PaperdollItem | null>(null);
  const [lockedItem, setLockedItem] = useState<PaperdollItem | null>(null);

  const [accountInput, setAccountInput] = useState<string>(poeAccountName || '');
  const [poesessid, setPoesessid] = useState<string>(() => {
    try {
      return localStorage.getItem(POESESSID_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });
  const [liveCharList, setLiveCharList] = useState<
    Array<{ name: string; league: string; className: string; level: number }>
  >([]);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [loadingList, setLoadingList] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showSyncDrawer, setShowSyncDrawer] = useState<boolean>(false);
  const [vitalsPushed, setVitalsPushed] = useState<boolean>(false);

  useEffect(() => {
    if (poeAccountName && !accountInput) {
      setAccountInput(poeAccountName);
    }
  }, [poeAccountName, accountInput]);

  // Load persisted character gear snapshots from Cloudflare D1 for this Exile Profile
  useEffect(() => {
    let cancelled = false;
    fetchUserToolState(handle, 'character_gear_snapshots')
      .then((saved) => {
        if (cancelled) return;
        if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
          setSnapshots(saved as Record<string, CharacterGearSnapshot>);
          const keys = Object.keys(saved);
          if (keys.length > 0 && !selectedChar) {
            setSelectedChar(keys[0]);
          }
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [handle]);

  // Build unified character selector choices from snapshots + roster + live GGG list
  const characterOptions = useMemo(() => {
    const map = new Map<
      string,
      { name: string; subtitle: string; hasSnapshot: boolean }
    >();
    for (const [key, snap] of Object.entries(snapshots)) {
      const n = snap?.character?.name || key;
      map.set(n.toLowerCase(), {
        name: n,
        subtitle: `Lv ${snap?.character?.level || '?'} ${snap?.character?.className || ''} (${snap?.character?.league || 'Synced'})`,
        hasSnapshot: true
      });
    }
    for (const ch of liveCharList) {
      const k = ch.name.toLowerCase();
      if (!map.has(k)) {
        map.set(k, {
          name: ch.name,
          subtitle: `Lv ${ch.level} ${ch.className} (${ch.league})`,
          hasSnapshot: false
        });
      }
    }
    for (const r of rosterCharacters) {
      const k = r.characterName.trim().toLowerCase();
      if (k && !map.has(k)) {
        map.set(k, {
          name: r.characterName.trim(),
          subtitle: `Lv ${r.level} ${r.ascendancy} (${r.gameTag || 'Roster'})`,
          hasSnapshot: false
        });
      }
    }
    return Array.from(map.values());
  }, [snapshots, liveCharList, rosterCharacters]);

  useEffect(() => {
    if (!selectedChar && characterOptions.length > 0) {
      setSelectedChar(characterOptions[0].name);
    }
  }, [characterOptions, selectedChar]);

  const activeSnapshot: CharacterGearSnapshot | null = useMemo(() => {
    if (!selectedChar) return null;
    const direct = snapshots[selectedChar];
    if (direct) return direct;
    const matchKey = Object.keys(snapshots).find(
      (k) => k.toLowerCase() === selectedChar.toLowerCase()
    );
    return matchKey ? snapshots[matchKey] : null;
  }, [snapshots, selectedChar]);

  const slotItem = (invId: string): PaperdollItem | null => {
    if (!activeSnapshot) return null;
    return activeSnapshot.equipped.find((it) => it.inventoryId === invId) || null;
  };

  const flasks = useMemo(() => {
    const list: Array<PaperdollItem | null> = [null, null, null, null, null];
    if (!activeSnapshot) return list;
    const fItems = activeSnapshot.equipped
      .filter((it) => it.inventoryId === 'Flask')
      .sort((a, b) => a.x - b.x);
    fItems.forEach((f, idx) => {
      const slot = f.x >= 0 && f.x < 5 ? f.x : idx;
      if (slot >= 0 && slot < 5) list[slot] = f;
    });
    return list;
  }, [activeSnapshot]);

  const inspectedItem = hoveredItem || lockedItem;

  const handleLoadLiveCharacters = async () => {
    if (!accountInput.trim() || !poesessid.trim()) {
      setErrorMsg('Enter your PoE Account Tag (e.g. Leuie#0626) and POESESSID first.');
      return;
    }
    setLoadingList(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/farming/character-xp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountName: accountInput.trim(),
          poesessid: poesessid.trim(),
          realm: 'pc'
        })
      });
      const json: any = await res.json();
      if (!res.ok || !Array.isArray(json?.characters)) {
        throw new Error(json?.error || `HTTP ${res.status}`);
      }
      setLiveCharList(json.characters);
      if (json.characters.length > 0) {
        setSelectedChar(json.characters[0].name);
      }
      onNotify?.(`Loaded ${json.characters.length} live GGG characters!`);
    } catch (e: any) {
      setErrorMsg(e?.message || 'Could not load characters from GGG.');
    } finally {
      setLoadingList(false);
    }
  };

  const handleSyncCharacterGear = async () => {
    const targetName = selectedChar.trim();
    if (!accountInput.trim() || !poesessid.trim() || !targetName) {
      setErrorMsg('Select a character and enter your PoE Account Tag and POESESSID.');
      return;
    }
    setSyncing(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/farming/character-gear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountName: accountInput.trim(),
          characterName: targetName,
          poesessid: poesessid.trim(),
          realm: 'pc'
        })
      });
      const json: any = await res.json();
      if (!res.ok || json?.status !== 'ok') {
        throw new Error(json?.error || `HTTP ${res.status}`);
      }
      const nextSnap: CharacterGearSnapshot = {
        syncedAtIso: json.syncedAtIso,
        character: json.character,
        equipped: json.equipped || [],
        passives: json.passives || { allocatedCount: 0, jewelCount: 0, voidstoneCount: 0 },
        estimatedVitals: json.estimatedVitals || {
          flatLife: 0,
          flatEs: 0,
          fireRes: 0,
          coldRes: 0,
          lightningRes: 0,
          chaosRes: 0,
          suppress: 0
        }
      };
      const charKey = nextSnap.character.name || targetName;
      const updatedMap = { ...snapshots, [charKey]: nextSnap };
      setSnapshots(updatedMap);
      setSelectedChar(charKey);
      setLockedItem(null);

      // Persist snapshot to Cloudflare D1 so squadmates can inspect this character anytime
      if (canEdit) {
        await saveUserToolState(handle, 'character_gear_snapshots', updatedMap);
      }
      onNotify?.(`Synced ${charKey} equipped gear & saved to your Exile Profile!`);
    } catch (e: any) {
      setErrorMsg(e?.message || 'Failed to sync character gear.');
    } finally {
      setSyncing(false);
    }
  };

  const handlePushVitalsToCalculators = () => {
    if (!activeSnapshot) return;
    try {
      localStorage.setItem(
        SYNCED_VITALS_STORAGE_KEY,
        JSON.stringify({
          characterName: activeSnapshot.character.name,
          className: activeSnapshot.character.className,
          level: activeSnapshot.character.level,
          league: activeSnapshot.character.league,
          syncedAtIso: activeSnapshot.syncedAtIso,
          passives: activeSnapshot.passives,
          vitals: activeSnapshot.estimatedVitals
        })
      );
      setVitalsPushed(true);
      setTimeout(() => setVitalsPushed(false), 3000);
      onNotify?.(
        `Sent ${activeSnapshot.character.name}'s gear vitals to Defense Mechanics EHP & Build Doctor!`
      );
    } catch {}
  };

  const renderSlot = (
    item: PaperdollItem | null,
    label: string,
    heightClass: string
  ) => {
    const isLocked = Boolean(item && lockedItem?.id === item.id);
    return (
      <button
        type="button"
        onMouseEnter={() => item && setHoveredItem(item)}
        onMouseLeave={() => setHoveredItem(null)}
        onClick={() => item && setLockedItem(isLocked ? null : item)}
        className={`relative w-full ${heightClass} rounded-lg border-2 flex flex-col items-center justify-center p-1.5 transition-all overflow-hidden group cursor-pointer ${
          item
            ? getRarityFrameClasses(item.frameType)
            : 'border-slate-800/90 bg-slate-950/75 hover:border-slate-700'
        } ${isLocked ? 'ring-2 ring-amber-400/90' : ''}`}
        title={item ? `${item.name || item.baseType} (${item.baseType})` : `Empty ${label} slot`}
      >
        {item ? (
          <>
            {item.icon ? (
              <img
                src={item.icon}
                alt={item.name || item.baseType}
                className="max-h-full max-w-full object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] group-hover:scale-105 transition-transform"
              />
            ) : (
              <span className="text-[10px] font-mono text-slate-300 text-center px-1 leading-tight">
                {item.name || item.baseType}
              </span>
            )}
            <SocketOverlay sockets={item.sockets} />
            {item.corrupted && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 shadow" title="Corrupted" />
            )}
          </>
        ) : (
          <span className="text-[9px] font-mono uppercase tracking-wider text-slate-600 select-none">
            {label}
          </span>
        )}
      </button>
    );
  };

  const activeWeapon = slotItem(weaponSet === 1 ? 'Weapon' : 'Weapon2');
  const activeOffhand = slotItem(weaponSet === 1 ? 'Offhand' : 'Offhand2');

  return (
    <div className="p-4 sm:p-5 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-950 via-slate-900/95 to-slate-950 shadow-2xl space-y-4">
      {/* Header & Character Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/90 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-amber-200 tracking-wide uppercase">
              Character Equipment & Inventory Paperdoll
            </h2>
            <p className="text-[11px] font-mono text-slate-400">
              Select any character to inspect equipped gear, gem links, flasks, and live gear vitals.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedChar}
            onChange={(e) => {
              setSelectedChar(e.target.value);
              setLockedItem(null);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-400 min-w-[200px]"
          >
            {characterOptions.length === 0 ? (
              <option value="">No characters synced yet</option>
            ) : (
              characterOptions.map((opt) => (
                <option key={opt.name} value={opt.name}>
                  {opt.hasSnapshot ? '★ ' : ''}
                  {opt.name} ({opt.subtitle})
                </option>
              ))
            )}
          </select>

          {canEdit && (
            <button
              type="button"
              onClick={() => setShowSyncDrawer((v) => !v)}
              className="px-3 py-1.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>{showSyncDrawer ? 'Hide GGG Sync' : 'Sync Live Gear'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Collapsible Live GGG Sync Drawer (Owner / Admin Only) */}
      {canEdit && showSyncDrawer && (
        <div className="p-3.5 rounded-xl border border-indigo-500/30 bg-indigo-950/20 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-indigo-200">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                Stateless GGG Gear Sync (POESESSID is sent directly to GGG and never stored on Exile SSF servers).
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <input
              type="text"
              value={accountInput}
              onChange={(e) => setAccountInput(e.target.value)}
              placeholder="PoE Account Tag (e.g. Leuie#0626)"
              className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 font-mono focus:outline-none focus:border-indigo-400"
            />
            <input
              type="password"
              value={poesessid}
              onChange={(e) => setPoesessid(e.target.value)}
              placeholder="POESESSID (auto fills if saved)"
              className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 font-mono focus:outline-none focus:border-indigo-400"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLoadLiveCharacters}
                disabled={loadingList}
                className="flex-1 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-mono font-bold text-[11px] cursor-pointer disabled:opacity-50"
              >
                {loadingList ? 'Loading...' : '1. Fetch Chars'}
              </button>
              <button
                type="button"
                onClick={handleSyncCharacterGear}
                disabled={syncing || !selectedChar}
                className="flex-1 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] cursor-pointer disabled:opacity-50"
              >
                {syncing ? 'Syncing...' : '2. Sync Gear'}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 text-xs text-rose-300 bg-rose-950/40 border border-rose-500/40 rounded-lg px-3 py-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      )}

      {/* Main Paperdoll + Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Authentic PoE Inventory Paperdoll Frame */}
        <div className="lg:col-span-7 p-4 rounded-2xl border-2 border-amber-700/40 bg-[radial-gradient(ellipse_at_top,_rgba(30,41,59,0.65),_rgba(2,6,23,0.95))] shadow-inner space-y-3">
          {/* Top Ornate Banner */}
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setWeaponSet(1)}
                className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-bold border cursor-pointer ${
                  weaponSet === 1
                    ? 'bg-amber-500/25 border-amber-400 text-amber-200'
                    : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                }`}
              >
                Set I
              </button>
              <button
                type="button"
                onClick={() => setWeaponSet(2)}
                className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-bold border cursor-pointer ${
                  weaponSet === 2
                    ? 'bg-amber-500/25 border-amber-400 text-amber-200'
                    : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                }`}
              >
                Set II
              </button>
            </div>
            <div className="text-xs font-mono font-bold tracking-widest uppercase text-amber-300/90">
              {activeSnapshot
                ? `${activeSnapshot.character.name} • Lv ${activeSnapshot.character.level} ${activeSnapshot.character.className}`
                : 'INVENTORY'}
            </div>
            <div className="text-[10px] font-mono text-slate-500">
              {activeSnapshot ? `${activeSnapshot.equipped.length} items` : 'Empty'}
            </div>
          </div>

          {/* 3 Column Authentic PoE Equipment Grid */}
          <div className="grid grid-cols-12 gap-2.5 items-stretch">
            {/* Left Column: Weapon + Ring 1 + Gloves */}
            <div className="col-span-4 flex flex-col gap-2.5">
              <div className="grid grid-cols-3 gap-2 items-end">
                <div className="col-span-2">{renderSlot(activeWeapon, `Weapon ${weaponSet === 1 ? 'I' : 'II'}`, 'h-44')}</div>
                <div className="col-span-1 flex flex-col justify-end">
                  {renderSlot(slotItem('Ring'), 'Ring 1', 'h-16')}
                </div>
              </div>
              <div className="pl-6">{renderSlot(slotItem('Gloves'), 'Gloves', 'h-24')}</div>
            </div>

            {/* Center Column: Helm + Body Armour + Belt */}
            <div className="col-span-4 flex flex-col gap-2.5">
              {renderSlot(slotItem('Helm'), 'Helm', 'h-24')}
              {renderSlot(slotItem('BodyArmour'), 'Body Armour', 'h-32')}
              {renderSlot(slotItem('Belt'), 'Belt', 'h-12')}
            </div>

            {/* Right Column: Amulet + Ring 2 + Offhand + Boots */}
            <div className="col-span-4 flex flex-col gap-2.5">
              <div className="grid grid-cols-3 gap-2 items-end">
                <div className="col-span-1 flex flex-col gap-2 justify-end">
                  {renderSlot(slotItem('Amulet'), 'Amulet', 'h-16')}
                  {renderSlot(slotItem('Ring2'), 'Ring 2', 'h-16')}
                </div>
                <div className="col-span-2">{renderSlot(activeOffhand, `Offhand ${weaponSet === 1 ? 'I' : 'II'}`, 'h-44')}</div>
              </div>
              <div className="pr-6">{renderSlot(slotItem('Boots'), 'Boots', 'h-24')}</div>
            </div>
          </div>

          {/* Bottom 5 Flask Tray */}
          <div className="pt-2 border-t border-amber-500/20">
            <div className="grid grid-cols-5 gap-2 max-w-md mx-auto">
              {flasks.map((fl, idx) => (
                <div key={idx}>{renderSlot(fl, `Flask ${idx + 1}`, 'h-20')}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Live Item Tooltip Inspector & Character Vitals */}
        <div className="lg:col-span-5 space-y-3">
          {/* Vitals & Passive Summary Card */}
          {activeSnapshot ? (
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase text-emerald-300">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Gear & Passive Tree Telemetry</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">
                  Synced {new Date(activeSnapshot.syncedAtIso).toLocaleDateString()}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-sm font-bold text-white">{activeSnapshot.passives.allocatedCount}</div>
                  <div className="text-[10px] font-mono text-slate-400">Passives</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-sm font-bold text-indigo-300">{activeSnapshot.passives.jewelCount}</div>
                  <div className="text-[10px] font-mono text-slate-400">Tree Jewels</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-sm font-bold text-amber-300">{activeSnapshot.passives.voidstoneCount}/4</div>
                  <div className="text-[10px] font-mono text-slate-400">Voidstones</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
                <span className="px-2 py-0.5 rounded bg-rose-950/60 border border-rose-500/30 text-rose-200">
                  +{activeSnapshot.estimatedVitals.flatLife} Gear Life
                </span>
                <span className="px-2 py-0.5 rounded bg-sky-950/60 border border-sky-500/30 text-sky-200">
                  +{activeSnapshot.estimatedVitals.flatEs} Gear ES
                </span>
                <span className="px-2 py-0.5 rounded bg-orange-950/60 border border-orange-500/30 text-orange-200">
                  Fire +{activeSnapshot.estimatedVitals.fireRes}%
                </span>
                <span className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-200">
                  Cold +{activeSnapshot.estimatedVitals.coldRes}%
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/30 text-amber-200">
                  Light +{activeSnapshot.estimatedVitals.lightningRes}%
                </span>
                <span className="px-2 py-0.5 rounded bg-purple-950/60 border border-purple-500/30 text-purple-200">
                  Chaos +{activeSnapshot.estimatedVitals.chaosRes}%
                </span>
                {activeSnapshot.estimatedVitals.suppress > 0 && (
                  <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-200">
                    Suppress +{activeSnapshot.estimatedVitals.suppress}%
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handlePushVitalsToCalculators}
                className="w-full py-2 px-3 rounded-lg bg-indigo-600/25 hover:bg-indigo-600/35 border border-indigo-500/40 text-indigo-200 text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {vitalsPushed ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Saved for EHP Calculator & PoB Build Doctor!</span>
                  </>
                ) : (
                  <>
                    <Compass className="w-3.5 h-3.5" />
                    <span>Load Vitals into EHP Calc & Build Doctor</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-dashed border-slate-800 bg-slate-900/50 text-xs text-slate-400 space-y-1.5">
              <div className="font-bold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>No Gear Snapshot Synced Yet</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                {canEdit
                  ? 'Click Sync Live Gear above to pull your equipped items, gem links, flasks, and passive tree straight from Path of Exile.'
                  : `When @${handle} syncs a character snapshot, their full Path of Exile equipment paperdoll will appear here.`}
              </p>
            </div>
          )}

          {/* PoE Item Mod Inspector Panel */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/90 min-h-[260px] space-y-2.5">
            {inspectedItem ? (
              <>
                <div className="border-b border-slate-800 pb-2 flex items-start justify-between gap-2">
                  <div>
                    <div className={`text-sm font-bold leading-tight ${getRarityTitleColor(inspectedItem.frameType)}`}>
                      {inspectedItem.name || inspectedItem.baseType}
                    </div>
                    {inspectedItem.name && inspectedItem.baseType && inspectedItem.name !== inspectedItem.baseType && (
                      <div className="text-[11px] font-mono text-slate-400">{inspectedItem.baseType}</div>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] font-mono text-slate-500">
                      <span>iLvl {inspectedItem.ilvl}</span>
                      <span>• {inspectedItem.inventoryId}</span>
                      {inspectedItem.corrupted && <span className="text-rose-400 font-bold">Corrupted</span>}
                    </div>
                  </div>
                  <a
                    href={buildPoeWikiUrl(inspectedItem.name || inspectedItem.baseType, 'poe1')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] font-mono text-indigo-300 flex items-center gap-1 shrink-0"
                  >
                    <span>Wiki</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>

                {inspectedItem.enchantMods.length > 0 && (
                  <div className="space-y-0.5 text-[11px] text-cyan-300">
                    {inspectedItem.enchantMods.map((m, i) => (
                      <div key={i}>{m}</div>
                    ))}
                  </div>
                )}

                {inspectedItem.implicitMods.length > 0 && (
                  <div className="space-y-0.5 text-[11px] text-sky-300 border-b border-slate-800/70 pb-1.5">
                    {inspectedItem.implicitMods.map((m, i) => (
                      <div key={i}>{m}</div>
                    ))}
                  </div>
                )}

                <div className="space-y-0.5 text-[11px]">
                  {inspectedItem.fracturedMods.map((m, i) => (
                    <div key={`f-${i}`} className="text-amber-200">{m}</div>
                  ))}
                  {inspectedItem.explicitMods.map((m, i) => (
                    <div key={`e-${i}`} className="text-indigo-200">{m}</div>
                  ))}
                  {inspectedItem.craftedMods.map((m, i) => (
                    <div key={`c-${i}`} className="text-sky-200">{m} (crafted)</div>
                  ))}
                </div>

                {inspectedItem.socketedGems.length > 0 && (
                  <div className="pt-2 border-t border-slate-800 space-y-1.5">
                    <div className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                      <Layers className="w-3 h-3" />
                      <span>Socketed Gems ({inspectedItem.socketedGems.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {inspectedItem.socketedGems.map((g, i) => (
                        <a
                          key={i}
                          href={buildPoeWikiUrl(g.name, 'poe1')}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-mono text-slate-200"
                        >
                          {g.icon && <img src={g.icon} alt="" className="w-3.5 h-3.5 object-contain" />}
                          <span>{g.name}</span>
                          <span className="text-slate-400">
                            {g.level > 0 ? `Lv${g.level}` : ''}
                            {g.quality > 0 ? `/${g.quality}%` : ''}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center text-xs text-slate-500 space-y-1.5">
                <Shield className="w-6 h-6 text-slate-700" />
                <div className="font-mono">Hover or click any equipped item slot</div>
                <div className="text-[11px] text-slate-600">
                  Inspect full implicit/explicit mods, socket links, and socketed gems.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
