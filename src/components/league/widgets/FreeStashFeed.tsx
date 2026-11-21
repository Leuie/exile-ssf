import React, { useState } from 'react';
import { Gift, ClipboardPaste, CheckCircle2, Trash2, Sparkles, Plus, PackageOpen } from 'lucide-react';
import type { FreeStashDrop, UserAccount } from '../../../types';
import { parsePoeClipboardTooltip } from '../../../utils/poeItemParser';

interface FreeStashFeedProps {
  leagueId?: string;
  drops: FreeStashDrop[];
  currentUser: UserAccount | null;
  isAdmin: boolean;
  onAddDrop: (drop: FreeStashDrop) => void;
  onClaimDrop: (drop: FreeStashDrop) => void;
  onDeleteDrop: (dropId: string) => void;
}

function getRarityStyle(rarity: FreeStashDrop['rarity']): { border: string; headerBg: string; title: string } {
  switch (rarity) {
    case 'Unique':
      return { border: 'border-amber-600/50', headerBg: 'bg-amber-950/50', title: 'text-amber-300' };
    case 'Rare':
      return { border: 'border-yellow-500/40', headerBg: 'bg-yellow-950/35', title: 'text-yellow-300' };
    case 'Gem':
      return { border: 'border-teal-500/40', headerBg: 'bg-teal-950/40', title: 'text-teal-300' };
    case 'Currency':
      return { border: 'border-orange-400/40', headerBg: 'bg-orange-950/35', title: 'text-orange-200' };
    case 'Magic':
      return { border: 'border-blue-500/40', headerBg: 'bg-blue-950/35', title: 'text-blue-300' };
    default:
      return { border: 'border-slate-700', headerBg: 'bg-slate-900/70', title: 'text-slate-200' };
  }
}

export const FreeStashFeed: React.FC<FreeStashFeedProps> = ({
  leagueId = 'poe1-330-umbra',
  drops,
  currentUser,
  isAdmin,
  onAddDrop,
  onClaimDrop,
  onDeleteDrop
}) => {
  const [rawPaste, setRawPaste] = useState('');
  const [itemName, setItemName] = useState('');
  const [baseType, setBaseType] = useState('');
  const [rarity, setRarity] = useState<FreeStashDrop['rarity']>('Unique');
  const [itemLevel, setItemLevel] = useState<number | undefined>(undefined);
  const [mods, setMods] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [filterMode, setFilterMode] = useState<'available' | 'claimed'>('available');

  const handlePasteText = (text: string) => {
    setRawPaste(text);
    const parsed = parsePoeClipboardTooltip(text);
    if (parsed) {
      setItemName(parsed.itemName);
      setBaseType(parsed.baseType || '');
      setRarity(parsed.rarity);
      setItemLevel(parsed.itemLevel);
      setMods(parsed.mods);
    }
  };

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;
    const owner = currentUser?.displayName || 'Anonymous Exile';
    const newDrop: FreeStashDrop = {
      id: `stash_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      leagueId,
      itemName: itemName.trim(),
      baseType: baseType.trim() || undefined,
      rarity,
      itemLevel,
      mods,
      rawTooltip: rawPaste.trim() || undefined,
      donorDisplayName: owner,
      donorCharacterName: currentUser?.characterName || owner,
      notes: notes.trim() || undefined,
      createdAtIso: new Date().toISOString()
    };
    onAddDrop(newDrop);
    setRawPaste('');
    setItemName('');
    setBaseType('');
    setItemLevel(undefined);
    setMods([]);
    setNotes('');
  };

  const visibleDrops = drops.filter((d) =>
    filterMode === 'available' ? !d.claimedBy : Boolean(d.claimedBy)
  );

  return (
    <div className="space-y-5">
      <div className="bg-[#0d1016] border border-emerald-500/25 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Gift className="w-5 h-5 text-emerald-400" />
              Found in My Stash / Free to Good Home
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Drop a great unique, cluster jewel, or +2 amulet nobody wishlisted yet? Paste Ctrl+C right from Path of Exile so a squadmate can claim it for their next alt.
            </p>
          </div>
          <div className="flex items-center gap-1 bg-[#090c11] p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setFilterMode('available')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                filterMode === 'available'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Available ({drops.filter((d) => !d.claimedBy).length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('claimed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                filterMode === 'claimed'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Claimed ({drops.filter((d) => Boolean(d.claimedBy)).length})
            </button>
          </div>
        </div>

        <form onSubmit={handlePost} className="bg-[#090c11] border border-slate-800/80 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
            <ClipboardPaste className="w-4 h-4" />
            Paste Ctrl+C PoE Item Tooltip (auto parses rarity, name, ilvl, and mods) or type manually
          </div>
          <textarea
            value={rawPaste}
            onChange={(e) => handlePasteText(e.target.value)}
            rows={3}
            placeholder="Hover any item in Path of Exile, press Ctrl+C, and paste here with Ctrl+V..."
            className="w-full bg-[#0d1016] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/60 font-mono"
          />

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="Item Name (e.g. Shavronne's Wrappings)"
              required
              className="sm:col-span-2 bg-[#0d1016] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60"
            />
            <select
              value={rarity}
              onChange={(e) => setRarity(e.target.value as FreeStashDrop['rarity'])}
              className="bg-[#0d1016] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/60"
            >
              <option value="Unique">Unique</option>
              <option value="Rare">Rare</option>
              <option value="Gem">Gem</option>
              <option value="Currency">Currency</option>
              <option value="Magic">Magic</option>
              <option value="Divination Card">Divination Card</option>
              <option value="Other">Other</option>
            </select>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Stash tab or note (optional)"
              className="bg-[#0d1016] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60"
            />
          </div>

          {mods.length > 0 && (
            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5 text-[11px] text-sky-300/90 space-y-0.5">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Parsed Tooltip Preview {itemLevel ? `(iLvl ${itemLevel})` : ''} {baseType ? `| ${baseType}` : ''}
              </div>
              {mods.slice(0, 6).map((m, idx) => (
                <div key={idx}>{m}</div>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!itemName.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Post Free Drop to Squad
            </button>
          </div>
        </form>
      </div>

      {visibleDrops.length === 0 ? (
        <div className="bg-[#0d1016] border border-slate-800/80 rounded-2xl p-10 text-center">
          <PackageOpen className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-300">
            {filterMode === 'available' ? 'No free stash drops posted yet.' : 'No claimed stash drops yet.'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Paste a Ctrl+C item tooltip above to share spare uniques, cluster jewels, or crafting bases with the squad.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleDrops.map((drop) => {
            const style = getRarityStyle(drop.rarity);
            const canDelete =
              isAdmin ||
              (currentUser &&
                currentUser.displayName.toLowerCase() === drop.donorDisplayName.toLowerCase());

            return (
              <div
                key={drop.id}
                className={`bg-[#090c11] border ${style.border} rounded-xl overflow-hidden flex flex-col justify-between shadow-lg`}
              >
                <div>
                  <div className={`${style.headerBg} px-4 py-3 border-b border-slate-800/70`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className={`text-sm font-black ${style.title}`}>{drop.itemName}</div>
                        {drop.baseType && (
                          <div className="text-[11px] text-slate-400 font-semibold">{drop.baseType}</div>
                        )}
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-black/40 text-slate-300 border border-slate-700/60">
                        {drop.rarity} {drop.itemLevel ? `iLvl ${drop.itemLevel}` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-2.5">
                    {drop.mods && drop.mods.length > 0 && (
                      <div className="text-[11px] text-sky-300/90 space-y-0.5 bg-slate-950/60 border border-slate-800/70 rounded-lg p-2.5">
                        {drop.mods.slice(0, 7).map((mod, idx) => (
                          <div key={idx}>{mod}</div>
                        ))}
                      </div>
                    )}

                    {drop.notes && (
                      <p className="text-xs text-slate-300 italic">"{drop.notes}"</p>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>
                        Donor:{' '}
                        <a
                          href={`/exile/${encodeURIComponent(drop.donorDisplayName)}`}
                          className="font-bold text-amber-300 hover:underline"
                        >
                          @{drop.donorDisplayName}
                        </a>
                      </span>
                      <span>{new Date(drop.createdAtIso).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="px-4 py-3 bg-[#0d1016] border-t border-slate-800/80 flex items-center justify-between gap-2">
                  {!drop.claimedBy ? (
                    <button
                      type="button"
                      onClick={() => onClaimDrop(drop)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black bg-emerald-600/20 hover:bg-emerald-600/35 border border-emerald-500/40 text-emerald-300 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Claim for My Alt
                    </button>
                  ) : (
                    <div className="flex-1 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                      <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                      Claimed by{' '}
                      <a
                        href={`/exile/${encodeURIComponent(drop.claimedBy)}`}
                        className="underline hover:text-white"
                      >
                        @{drop.claimedBy}
                      </a>
                    </div>
                  )}

                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => onDeleteDrop(drop.id)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-400 transition-colors"
                      title="Remove drop"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
