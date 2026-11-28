import React, { useEffect, useMemo, useState } from 'react';
import {
  Handshake,
  Hammer,
  Grid3X3,
  Plus,
  CheckCircle2,
  RotateCcw,
  Trash2,
  Trophy,
  Sparkles
} from 'lucide-react';
import type { UserAccount } from '../../../types';

interface ItemLoanEntry {
  id: string;
  itemName: string;
  ownerHandle: string;
  borrowerHandle: string;
  note: string;
  borrowedAtIso: string;
  returnedAtIso?: string;
  status: 'ACTIVE' | 'RETURNED';
}

interface CraftQueueEntry {
  id: string;
  serviceType: string;
  itemDesc: string;
  materialsReady: boolean;
  tipNote: string;
  requesterHandle: string;
  crafterHandle?: string;
  status: 'OPEN' | 'CLAIMED' | 'COMPLETED';
  createdAtIso: string;
}

interface LeagueSocialPayload {
  loans: ItemLoanEntry[];
  crafts: CraftQueueEntry[];
  bingoClaims: Record<string, string[]>; // tileIndex -> array of handles who completed it
}

const BINGO_TILES: string[] = [
  'Drop a Divine before Maps',
  'Six Link a Body Armour',
  'Kill Maven Deathless',
  'Hit Level 95',
  'Unlock 4 Voidstones',
  'Fulfill 3 Squad Wishes',
  'Clear a T17 Map',
  'Drop a Tier 0/1 Unique',
  'Hit Delve Depth 200',
  'Double Corrupt a 21/20 Gem',
  'Kill Uber Elder',
  'Complete a 10-Way Invitation',
  'FREE SPACE (Exile SSF)',
  'Kill Searing Exarch',
  'Kill Eater of Worlds',
  'Craft a 1000+ eDPS / +2 Item',
  'Find a Nameless Seer',
  'Complete a Full Blueprint',
  'Complete a Sanctum Floor 4',
  'Drop a Raw Exalted / Sacred Orb',
  'Hit 100% Spell Suppression',
  'Cap Chaos Resistance (75%)',
  'Kill Sirus, Awakener',
  'Earn a Hall of Fame First',
  'Help a Squadmate with a Carry'
];

const BINGO_LINES: number[][] = [
  // Rows
  [0, 1, 2, 3, 4],
  [5, 6, 7, 8, 9],
  [10, 11, 12, 13, 14],
  [15, 16, 17, 18, 19],
  [20, 21, 22, 23, 24],
  // Cols
  [0, 5, 10, 15, 20],
  [1, 6, 11, 16, 21],
  [2, 7, 12, 17, 22],
  [3, 8, 13, 18, 23],
  [4, 9, 14, 19, 24],
  // Diagonals
  [0, 6, 12, 18, 24],
  [4, 8, 12, 16, 20]
];

const CRAFT_SERVICES = [
  'Veiled Orb / Aisling',
  'Betrayal Bench (Vorici / Hillock / Leo)',
  'Harvest Augment / Reforge',
  'Fracturing Orb Attempt',
  'Awakener / Conqueror Orb',
  'Meta Craft (Prefixes/Suffixes Cannot Change)',
  'Lab Font / Transfigured Gem'
];

interface GsfSocialTabProps {
  leagueId: string;
  userAccount?: UserAccount | null;
  onOpenAuthModal?: () => void;
  lockedView?: 'loans' | 'crafts' | 'bingo';
}

export const GsfSocialTab: React.FC<GsfSocialTabProps> = ({
  leagueId,
  userAccount,
  onOpenAuthModal,
  lockedView
}) => {
  const [subView, setSubView] = useState<'loans' | 'crafts' | 'bingo'>(lockedView || 'loans');
  const activeView = lockedView || subView;
  const [data, setData] = useState<LeagueSocialPayload>({ loans: [], crafts: [], bingoClaims: {} });
  const [saving, setSaving] = useState<boolean>(false);

  // Loan form
  const [loanItem, setLoanItem] = useState('');
  const [loanBorrower, setLoanBorrower] = useState('');
  const [loanNote, setLoanNote] = useState('');

  // Craft queue form
  const [craftService, setCraftService] = useState(CRAFT_SERVICES[0]);
  const [craftDesc, setCraftDesc] = useState('');
  const [craftMaterialsReady, setCraftMaterialsReady] = useState(true);
  const [craftTip, setCraftTip] = useState('');

  const myHandle = userAccount?.displayName || '';

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/league/social?league=${encodeURIComponent(leagueId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: any) => {
        if (!cancelled && d?.data) {
          setData({
            loans: Array.isArray(d.data.loans) ? d.data.loans : [],
            crafts: Array.isArray(d.data.crafts) ? d.data.crafts : [],
            bingoClaims: d.data.bingoClaims && typeof d.data.bingoClaims === 'object' ? d.data.bingoClaims : {}
          });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [leagueId]);

  const persistSocial = async (next: LeagueSocialPayload) => {
    setData(next);
    if (!myHandle) return;
    setSaving(true);
    try {
      await fetch('/api/league/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ leagueId, data: next })
      });
    } catch {}
    setSaving(false);
  };

  const handleAddLoan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!myHandle) {
      onOpenAuthModal?.();
      return;
    }
    if (!loanItem.trim() || !loanBorrower.trim()) return;
    const entry: ItemLoanEntry = {
      id: `loan-${Date.now()}`,
      itemName: loanItem.trim(),
      ownerHandle: myHandle,
      borrowerHandle: loanBorrower.trim().replace(/^@/, ''),
      note: loanNote.trim(),
      borrowedAtIso: new Date().toISOString(),
      status: 'ACTIVE'
    };
    void persistSocial({ ...data, loans: [entry, ...data.loans] });
    setLoanItem('');
    setLoanBorrower('');
    setLoanNote('');
  };

  const handleToggleLoanReturned = (id: string) => {
    const nextLoans = data.loans.map((l) =>
      l.id === id
        ? {
            ...l,
            status: l.status === 'ACTIVE' ? ('RETURNED' as const) : ('ACTIVE' as const),
            returnedAtIso: l.status === 'ACTIVE' ? new Date().toISOString() : undefined
          }
        : l
    );
    void persistSocial({ ...data, loans: nextLoans });
  };

  const handleDeleteLoan = (id: string) => {
    void persistSocial({ ...data, loans: data.loans.filter((l) => l.id !== id) });
  };

  const handleAddCraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!myHandle) {
      onOpenAuthModal?.();
      return;
    }
    if (!craftDesc.trim()) return;
    const entry: CraftQueueEntry = {
      id: `craft-${Date.now()}`,
      serviceType: craftService,
      itemDesc: craftDesc.trim(),
      materialsReady: craftMaterialsReady,
      tipNote: craftTip.trim(),
      requesterHandle: myHandle,
      status: 'OPEN',
      createdAtIso: new Date().toISOString()
    };
    void persistSocial({ ...data, crafts: [entry, ...data.crafts] });
    setCraftDesc('');
    setCraftTip('');
  };

  const handleUpdateCraft = (id: string, status: CraftQueueEntry['status'], crafterHandle?: string) => {
    const nextCrafts = data.crafts.map((c) =>
      c.id === id ? { ...c, status, crafterHandle: crafterHandle ?? c.crafterHandle } : c
    );
    void persistSocial({ ...data, crafts: nextCrafts });
  };

  const handleToggleBingoTile = (idx: number) => {
    if (!myHandle) {
      onOpenAuthModal?.();
      return;
    }
    const key = String(idx);
    const cur = data.bingoClaims[key] || [];
    const has = cur.some((h) => h.toLowerCase() === myHandle.toLowerCase());
    const nextList = has
      ? cur.filter((h) => h.toLowerCase() !== myHandle.toLowerCase())
      : [...cur, myHandle];
    void persistSocial({
      ...data,
      bingoClaims: { ...data.bingoClaims, [key]: nextList }
    });
  };

  const myBingoStats = useMemo(() => {
    if (!myHandle) return { tiles: 0, lines: 0 };
    const owned = new Set<number>([12]); // Free space
    for (const [k, handles] of Object.entries(data.bingoClaims)) {
      if (handles.some((h) => h.toLowerCase() === myHandle.toLowerCase())) {
        owned.add(Number(k));
      }
    }
    let lines = 0;
    for (const line of BINGO_LINES) {
      if (line.every((i) => owned.has(i))) lines++;
    }
    return { tiles: owned.size, lines };
  }, [data.bingoClaims, myHandle]);

  const activeLoansCount = data.loans.filter((l) => l.status === 'ACTIVE').length;
  const openCraftsCount = data.crafts.filter((c) => c.status !== 'COMPLETED').length;

  return (
    <div className="space-y-4">
      {/* Sub-navigation bar (hidden when embedded via lockedView) */}
      {!lockedView && (
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl border border-slate-800 bg-[#0d111a]">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSubView('loans')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer border ${
              subView === 'loans'
                ? 'bg-amber-500/20 border-amber-400/60 text-amber-200'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Handshake className="w-3.5 h-3.5" />
            <span>GSF Item Loans ({activeLoansCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setSubView('crafts')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer border ${
              subView === 'crafts'
                ? 'bg-sky-500/20 border-sky-400/60 text-sky-200'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Hammer className="w-3.5 h-3.5" />
            <span>Craft &amp; Fracture Queue ({openCraftsCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setSubView('bingo')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer border ${
              subView === 'bingo'
                ? 'bg-purple-500/20 border-purple-400/60 text-purple-200'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            <span>5×5 League Bingo</span>
          </button>
        </div>
        {saving && <span className="text-[10px] font-mono text-emerald-300">Syncing to Cloud...</span>}
      </div>
      )}

      {/* 1. GSF ITEM LOANS */}
      {activeView === 'loans' && (
        <div className="space-y-4">
          <form onSubmit={handleAddLoan} className="p-4 rounded-2xl border border-slate-800 bg-[#0d111a] grid grid-cols-1 sm:grid-cols-12 gap-2.5 text-xs">
            <input
              type="text"
              value={loanItem}
              onChange={(e) => setLoanItem(e.target.value)}
              placeholder="Loaned item (e.g. Mageblood, Defiance of Destiny)"
              className="sm:col-span-4 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
            />
            <input
              type="text"
              value={loanBorrower}
              onChange={(e) => setLoanBorrower(e.target.value)}
              placeholder="Borrower @Handle"
              className="sm:col-span-3 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-emerald-300"
            />
            <input
              type="text"
              value={loanNote}
              onChange={(e) => setLoanNote(e.target.value)}
              placeholder="Return note (e.g. After Uber Elder)"
              className="sm:col-span-3 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300"
            />
            <button
              type="submit"
              className="sm:col-span-2 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black inline-flex items-center justify-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Loan</span>
            </button>
          </form>

          {data.loans.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-500 rounded-2xl border border-dashed border-slate-800">
              No active GSF item loans logged yet. Track borrowed chase uniques here so nothing gets lost mid league!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.loans.map((l) => (
                <div
                  key={l.id}
                  className={`p-3.5 rounded-2xl border flex items-start justify-between gap-3 ${
                    l.status === 'RETURNED'
                      ? 'border-emerald-500/30 bg-emerald-950/10 opacity-75'
                      : 'border-amber-500/35 bg-[#0d111a]'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-amber-200">{l.itemName}</span>
                      <span
                        className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                          l.status === 'RETURNED'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {l.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-300">
                      Owner: <strong className="text-white">@{l.ownerHandle}</strong> → Borrower:{' '}
                      <strong className="text-emerald-300">@{l.borrowerHandle}</strong>
                    </div>
                    {l.note && <div className="text-[11px] text-slate-400">{l.note}</div>}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleLoanReturned(l.id)}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] font-mono text-emerald-300 inline-flex items-center gap-1 cursor-pointer"
                    >
                      {l.status === 'ACTIVE' ? <CheckCircle2 className="w-3 h-3" /> : <RotateCcw className="w-3 h-3" />}
                      <span>{l.status === 'ACTIVE' ? 'Returned' : 'Reopen'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteLoan(l.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. SQUAD CRAFT & FRACTURE QUEUE */}
      {activeView === 'crafts' && (
        <div className="space-y-4">
          <form onSubmit={handleAddCraft} className="p-4 rounded-2xl border border-slate-800 bg-[#0d111a] space-y-2.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <select
                value={craftService}
                onChange={(e) => setCraftService(e.target.value)}
                className="sm:col-span-4 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sky-200 font-semibold cursor-pointer"
              >
                {CRAFT_SERVICES.map((s) => (
                  <option key={s} value={s} className="bg-slate-950">{s}</option>
                ))}
              </select>
              <input
                type="text"
                value={craftDesc}
                onChange={(e) => setCraftDesc(e.target.value)}
                placeholder="Item & goal (e.g. Spine Bow — need Prefixes Cannot Change + Veiled Orb)"
                className="sm:col-span-5 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
              />
              <input
                type="text"
                value={craftTip}
                onChange={(e) => setCraftTip(e.target.value)}
                placeholder="Tip / trade offer (optional)"
                className="sm:col-span-3 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-amber-200"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="inline-flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={craftMaterialsReady}
                  onChange={(e) => setCraftMaterialsReady(e.target.checked)}
                />
                <span>All crafting materials / Divines ready in my stash</span>
              </label>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Post Craft Request</span>
              </button>
            </div>
          </form>

          {data.crafts.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-500 rounded-2xl border border-dashed border-slate-800">
              No crafting service requests yet. Post Betrayal benches, Veiled Orbs, Harvest augments, or Fracture jobs for your squad!
            </div>
          ) : (
            <div className="space-y-2.5">
              {data.crafts.map((c) => (
                <div
                  key={c.id}
                  className={`p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
                    c.status === 'COMPLETED'
                      ? 'border-emerald-500/30 bg-emerald-950/10 opacity-75'
                      : 'border-slate-800 bg-[#0d111a]'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-sky-500/15 border border-sky-500/35 text-sky-300 text-[10px] font-mono font-bold">
                        {c.serviceType}
                      </span>
                      <span className="text-xs font-bold text-white">{c.itemDesc}</span>
                      {c.materialsReady && (
                        <span className="text-[10px] font-mono text-emerald-300">✓ Mats Ready</span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Requested by <strong className="text-slate-200">@{c.requesterHandle}</strong>
                      {c.crafterHandle && (
                        <>
                          {' '}• Crafter: <strong className="text-amber-300">@{c.crafterHandle}</strong>
                        </>
                      )}
                      {c.tipNote && <> • Tip: <span className="text-amber-200">{c.tipNote}</span></>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {c.status === 'OPEN' && myHandle && (
                      <button
                        type="button"
                        onClick={() => handleUpdateCraft(c.id, 'CLAIMED', myHandle)}
                        className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 text-[11px] font-bold cursor-pointer"
                      >
                        Claim Craft
                      </button>
                    )}
                    {c.status !== 'COMPLETED' && myHandle && (
                      <button
                        type="button"
                        onClick={() => handleUpdateCraft(c.id, 'COMPLETED', c.crafterHandle || myHandle)}
                        className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold cursor-pointer"
                      >
                        Mark Complete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. 5x5 LEAGUE BINGO BOARD */}
      {activeView === 'bingo' && (
        <div className="space-y-3">
          <div className="p-3.5 rounded-2xl border border-purple-500/35 bg-purple-950/15 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-white">5×5 Private League Bingo Board</span>
              <span className="text-slate-400">Click any tile you&apos;ve completed this season!</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-sky-300">
                {myBingoStats.tiles} / 25 Tiles
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/50 text-amber-200 font-bold">
                {myBingoStats.lines} BINGO {myBingoStats.lines === 1 ? 'Line' : 'Lines'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {BINGO_TILES.map((title, idx) => {
              const isFree = idx === 12;
              const claimers = data.bingoClaims[String(idx)] || [];
              const iClaimed =
                isFree ||
                (myHandle && claimers.some((h) => h.toLowerCase() === myHandle.toLowerCase()));
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => !isFree && handleToggleBingoTile(idx)}
                  className={`p-3 rounded-xl border text-left transition-all min-h-[96px] flex flex-col justify-between gap-2 cursor-pointer ${
                    iClaimed
                      ? 'bg-emerald-500/15 border-emerald-400/60 text-emerald-100 shadow-md shadow-emerald-500/10'
                      : 'bg-[#0d111a] border-slate-800 hover:border-purple-400/60 text-slate-200'
                  }`}
                >
                  <div className="text-[11px] font-bold leading-snug flex items-start justify-between gap-1">
                    <span>{title}</span>
                    {iClaimed && <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  </div>
                  <div className="text-[9px] font-mono text-slate-400 truncate">
                    {isFree
                      ? 'Auto Completed'
                      : claimers.length > 0
                      ? `${claimers.length} claimed (${claimers.slice(0, 2).join(', ')})`
                      : 'Click to claim'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
