import React, { useMemo, useState } from 'react';
import {
  Users,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  Search,
  ExternalLink,
  CheckCircle2,
  Package
} from 'lucide-react';
import type { LookingForItem } from '../../types';
import { buildPoeWikiUrl } from './assetEngine';

interface GuildStashTab {
  index: number;
  name: string;
  type: string;
}

interface GuildStashItem {
  id: string;
  name: string;
  baseType: string;
  shortName: string;
  icon: string;
  stackSize: number;
  ilvl: number;
  frameType: number;
  tabIndex: number;
  tabName: string;
}

export interface GuildStashScannerPanelProps {
  accountName: string;
  leagueName: string;
  poesessid: string;
  openWishlistItems: LookingForItem[];
  claimedWishIds: Record<string, boolean>;
  onClaimWishlist: (wish: LookingForItem) => void;
}

export const GuildStashScannerPanel: React.FC<GuildStashScannerPanelProps> = ({
  accountName,
  leagueName,
  poesessid,
  openWishlistItems,
  claimedWishIds,
  onClaimWishlist
}) => {
  const [open, setOpen] = useState<boolean>(false);
  const [scanning, setScanning] = useState<boolean>(false);
  const [tabs, setTabs] = useState<GuildStashTab[]>([]);
  const [items, setItems] = useState<GuildStashItem[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [selectedTab, setSelectedTab] = useState<string>('ALL');
  const [lastScannedAt, setLastScannedAt] = useState<string | null>(null);

  const handleScanGuildStash = async () => {
    if (!accountName.trim() || !leagueName.trim() || !poesessid.trim()) {
      setErrorMsg('Enter your PoE Account Name, League Name, and POESESSID in Setup first.');
      return;
    }
    setScanning(true);
    setErrorMsg(null);
    try {
      // Step 1: Scan tab 0 to discover all Guild Stash tabs
      const firstRes = await fetch('/api/farming/guild-stash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountName: accountName.trim(),
          league: leagueName.trim(),
          realm: 'pc',
          poesessid: poesessid.trim(),
          tabIndices: [0]
        })
      });
      const firstJson: any = await firstRes.json();
      if (!firstRes.ok || firstJson?.error) {
        throw new Error(firstJson?.error || `HTTP ${firstRes.status}`);
      }

      const foundTabs: GuildStashTab[] = Array.isArray(firstJson.tabs) ? firstJson.tabs : [];
      setTabs(foundTabs);

      if (foundTabs.length <= 1) {
        setItems(Array.isArray(firstJson.items) ? firstJson.items : []);
      } else {
        // Scan up to 8 guild tabs in one batched server call
        const tabIndices = foundTabs.slice(0, 8).map((t) => t.index);
        const fullRes = await fetch('/api/farming/guild-stash', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accountName: accountName.trim(),
            league: leagueName.trim(),
            realm: 'pc',
            poesessid: poesessid.trim(),
            tabIndices
          })
        });
        const fullJson: any = await fullRes.json();
        if (fullRes.ok && Array.isArray(fullJson.items)) {
          setItems(fullJson.items);
        } else {
          setItems(Array.isArray(firstJson.items) ? firstJson.items : []);
        }
      }

      setLastScannedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not scan Guild Stash.');
    } finally {
      setScanning(false);
    }
  };

  const guildWishlistMatches = useMemo(() => {
    if (items.length === 0 || openWishlistItems.length === 0) return [];
    const matches: Array<{ item: GuildStashItem; wish: LookingForItem }> = [];
    const seen = new Set<string>();

    for (const wish of openWishlistItems) {
      const target = wish.itemName.trim().toLowerCase();
      if (target.length < 3) continue;
      for (const it of items) {
        const hay = `${it.shortName} ${it.name} ${it.baseType}`.toLowerCase();
        if (hay.includes(target) || (it.shortName.length >= 4 && target.includes(it.shortName.toLowerCase()))) {
          const key = `${wish.id}::${it.id}`;
          if (!seen.has(key)) {
            seen.add(key);
            matches.push({ item: it, wish });
          }
          break;
        }
      }
    }
    return matches;
  }, [items, openWishlistItems]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((it) => {
      if (selectedTab !== 'ALL' && it.tabName !== selectedTab) return false;
      if (!q) return true;
      return `${it.shortName} ${it.baseType} ${it.tabName}`.toLowerCase().includes(q);
    });
  }, [items, search, selectedTab]);

  return (
    <div className="rounded-2xl border border-indigo-500/30 bg-[#0d111a] overflow-hidden shadow-lg">
      <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-2 bg-indigo-950/20 border-b border-slate-800/80">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 text-left cursor-pointer"
        >
          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <span>Private League Guild Stash Scanner</span>
              {guildWishlistMatches.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-[10px] font-mono">
                  {guildWishlistMatches.length} Wishlist Hits!
                </span>
              )}
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              Scan GSF Guild Stash tabs and automatically highlight every item matching a squadmate's open Wishlist.
            </div>
          </div>
        </button>

        <div className="flex items-center gap-2">
          {lastScannedAt && (
            <span className="text-[10px] font-mono text-slate-400">
              Scanned {lastScannedAt} ({items.length} items)
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              setOpen(true);
              handleScanGuildStash();
            }}
            disabled={scanning}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
            <span>{scanning ? 'Scanning Guild Tabs...' : 'Scan Guild Stash'}</span>
          </button>
        </div>
      </div>

      {open && (
        <div className="p-4 space-y-4">
          {errorMsg && (
            <div className="px-3.5 py-2.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Matched Squad Wishlist Items Found Inside Guild Stash */}
          {guildWishlistMatches.length > 0 && (
            <div className="p-3.5 rounded-xl border border-emerald-400/50 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/30 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-emerald-300">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Squad Wishlist Matches Found in Guild Stash ({guildWishlistMatches.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {guildWishlistMatches.map(({ item, wish }) => {
                  const claimed = Boolean(claimedWishIds[wish.id]);
                  return (
                    <div
                      key={`${wish.id}-${item.id}`}
                      className="p-2.5 rounded-xl bg-slate-950/90 border border-emerald-500/35 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {item.icon ? (
                          <img src={item.icon} alt="" className="w-8 h-8 object-contain shrink-0" />
                        ) : (
                          <Package className="w-6 h-6 text-slate-500 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <div className="font-bold text-orange-300 truncate">{item.shortName}</div>
                          <div className="text-[10px] font-mono text-slate-400 truncate">
                            Guild Tab: <span className="text-indigo-300">{item.tabName}</span> • Wished by{' '}
                            <span className="text-emerald-300">@{wish.displayName || wish.characterName}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={claimed}
                        onClick={() => onClaimWishlist(wish)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shrink-0 cursor-pointer flex items-center gap-1 ${
                          claimed
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        }`}
                      >
                        {claimed ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Fulfilled</span>
                          </>
                        ) : (
                          <span>Mark Found (+5 Honor)</span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Guild Stash Browser */}
          {items.length > 0 ? (
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Filter scanned Guild Stash items..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-400"
                  />
                </div>
                <select
                  value={selectedTab}
                  onChange={(e) => setSelectedTab(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200"
                >
                  <option value="ALL">All Scanned Guild Tabs ({tabs.length})</option>
                  {tabs.map((t) => (
                    <option key={t.index} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
                {filteredItems.slice(0, 90).map((it) => (
                  <div
                    key={it.id}
                    className="p-2 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {it.icon && <img src={it.icon} alt="" className="w-6 h-6 object-contain shrink-0" />}
                      <div className="min-w-0">
                        <a
                          href={buildPoeWikiUrl(it.shortName, 'poe1')}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-slate-100 hover:text-amber-300 truncate flex items-center gap-1"
                        >
                          <span className="truncate">{it.shortName}</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-60 shrink-0" />
                        </a>
                        <div className="text-[10px] font-mono text-slate-500 truncate">
                          {it.tabName} {it.stackSize > 1 ? `• x${it.stackSize}` : ''} {it.ilvl > 0 ? `• iLvl ${it.ilvl}` : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            !scanning &&
            !errorMsg && (
              <div className="text-center py-4 text-xs font-mono text-slate-500">
                Click <strong className="text-indigo-300">Scan Guild Stash</strong> to inspect up to 8 GSF Guild Stash tabs for squadmate wishlist hits.
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};
