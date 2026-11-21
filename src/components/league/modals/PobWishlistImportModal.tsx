import React, { useState } from 'react';
import { X, Upload, CheckSquare, Square, Sparkles, AlertCircle } from 'lucide-react';
import type { WishlistItemCategory } from '../../../types';
import { extractWishlistItemsFromPobCode, type ExtractedPobItem } from '../../../utils/poeItemParser';

interface PobWishlistImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  myCharacters: { id?: string; characterName: string; ascendancy: string }[];
  onImportItems: (
    items: { itemName: string; category: WishlistItemCategory; notes: string }[],
    targetCharacterName?: string
  ) => void;
}

export const PobWishlistImportModal: React.FC<PobWishlistImportModalProps> = ({
  isOpen,
  onClose,
  myCharacters,
  onImportItems
}) => {
  const [pobInput, setPobInput] = useState('');
  const [extracted, setExtracted] = useState<ExtractedPobItem[]>([]);
  const [selectedNames, setSelectedNames] = useState<Record<string, boolean>>({});
  const [targetCharacter, setTargetCharacter] = useState(myCharacters[0]?.characterName || '');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDecode = () => {
    setError(null);
    const items = extractWishlistItemsFromPobCode(pobInput);
    if (items.length === 0) {
      setError('Could not decode any uniques, cluster jewels, or special gems from that input. Paste a full raw PoB export code (or raw PoB XML).');
      setExtracted([]);
      return;
    }
    setExtracted(items);
    const initial: Record<string, boolean> = {};
    for (const item of items) {
      initial[item.itemName] = true;
    }
    setSelectedNames(initial);
  };

  const toggleItem = (name: string) => {
    setSelectedNames((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const selectedList = extracted.filter((i) => selectedNames[i.itemName]);

  const handleConfirmImport = () => {
    if (selectedList.length === 0) return;
    onImportItems(
      selectedList.map((i) => ({
        itemName: i.itemName,
        category: i.category,
        notes: i.notes
      })),
      targetCharacter || undefined
    );
    setPobInput('');
    setExtracted([]);
    setSelectedNames({});
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0d1016] border border-slate-700/80 rounded-2xl max-w-2xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="px-6 py-4 bg-[#121620] border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-amber-400" />
              Import Build Uniques & Gems from PoB
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Paste your Path of Building export code to extract Uniques, Cluster Jewels, and Transfigured or Awakened Gems straight into your Wishlist.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Path of Building Export Code (Copy Code in PoB Import/Export Tab)
            </label>
            <textarea
              value={pobInput}
              onChange={(e) => setPobInput(e.target.value)}
              rows={4}
              placeholder="eNrtW2tv2zgS_..."
              className="w-full bg-[#090c11] border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono placeholder-slate-600 focus:outline-none focus:border-amber-500/60"
            />
            <div className="flex flex-wrap items-center justify-between gap-2 mt-2.5">
              {myCharacters.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">Tag for Character:</span>
                  <select
                    value={targetCharacter}
                    onChange={(e) => setTargetCharacter(e.target.value)}
                    className="bg-[#090c11] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-bold"
                  >
                    <option value="">Account Wide</option>
                    {myCharacters.map((ch) => (
                      <option key={ch.id || ch.characterName} value={ch.characterName}>
                        {ch.characterName} ({ch.ascendancy})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <button
                type="button"
                onClick={handleDecode}
                disabled={!pobInput.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white transition-colors ml-auto"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Scan PoB Build
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {extracted.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                  Found {extracted.length} Key Items ({selectedList.length} Selected)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const all: Record<string, boolean> = {};
                      extracted.forEach((i) => (all[i.itemName] = true));
                      setSelectedNames(all);
                    }}
                    className="text-[11px] font-bold text-slate-400 hover:text-white"
                  >
                    Select All
                  </button>
                  <span className="text-slate-600">|</span>
                  <button
                    type="button"
                    onClick={() => setSelectedNames({})}
                    className="text-[11px] font-bold text-slate-400 hover:text-white"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                {extracted.map((item) => {
                  const checked = !!selectedNames[item.itemName];
                  return (
                    <button
                      key={item.itemName}
                      type="button"
                      onClick={() => toggleItem(item.itemName)}
                      className={`w-full text-left flex items-center justify-between gap-3 px-3 py-2 rounded-lg border transition-colors ${
                        checked
                          ? 'bg-amber-500/10 border-amber-500/40 text-white'
                          : 'bg-[#090c11] border-slate-800/80 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {checked ? (
                          <CheckSquare className="w-4 h-4 text-amber-400 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-600 shrink-0" />
                        )}
                        <div className="truncate">
                          <span className="text-xs font-bold">{item.itemName}</span>
                          <span className="text-[10px] text-slate-500 ml-2">{item.notes}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 shrink-0">
                        {item.category}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-[#121620] border-t border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={selectedList.length === 0}
            className="px-5 py-2 rounded-lg text-xs font-black bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white transition-colors"
          >
            Add {selectedList.length} Items to Wishlist
          </button>
        </div>
      </div>
    </div>
  );
};
