import React, { useMemo, useState } from 'react';
import { X, Copy, Check, Filter, Volume2 } from 'lucide-react';
import type { LookingForItem } from '../../../types';

interface WishlistFilterExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: LookingForItem[];
  leagueName?: string;
}

function escapeRegexToken(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[.*+?^${}()|[\]\\]/g, '')
    .replace(/\s+/g, ' ');
}

export const WishlistFilterExportModal: React.FC<WishlistFilterExportModalProps> = ({
  isOpen,
  onClose,
  items,
  leagueName = 'Private League'
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [soundId, setSoundId] = useState<number>(6);

  const openItems = useMemo(
    () => items.filter((it) => it.status !== 'HAVE' && it.itemName.trim()),
    [items]
  );

  // Build Neversink / FilterBlade custom .filter block
  const filterBlock = useMemo(() => {
    const uniques = new Set<string>();
    const bases = new Set<string>();
    for (const it of openItems) {
      const cleanName = it.itemName.trim().replace(/"/g, '');
      if (!cleanName) continue;
      if (String(it.category || '').toLowerCase().includes('unique')) {
        uniques.add(cleanName);
      } else {
        bases.add(cleanName);
      }
    }

    const sections: string[] = [
      `# ==============================================================`,
      `# Exile SSF Squad Wishlist Filter Rules (${leagueName})`,
      `# Paste at the TOP of your .filter file or FilterBlade Custom Rules`,
      `# Open Wishlist Targets: ${openItems.length}`,
      `# ==============================================================`
    ];

    if (uniques.size > 0) {
      const quoted = Array.from(uniques)
        .map((n) => `"${n}"`)
        .join(' ');
      sections.push(
        `\n# Squad Wanted Uniques (Highlight with Gold Beam + Alert Sound)`,
        `Show`,
        `    Rarity Unique`,
        `    BaseType == ${quoted}`,
        `    SetFontSize 42`,
        `    SetTextColor 255 215 0 255`,
        `    SetBorderColor 255 180 0 255`,
        `    SetBackgroundColor 40 20 5 245`,
        `    PlayAlertSound ${soundId} 300`,
        `    PlayEffect Yellow`,
        `    MinimapIcon 0 Star Yellow`
      );
    }

    if (bases.size > 0) {
      const quoted = Array.from(bases)
        .map((n) => `"${n}"`)
        .join(' ');
      sections.push(
        `\n# Squad Wanted Bases / Currency / Gems`,
        `Show`,
        `    BaseType == ${quoted}`,
        `    SetFontSize 40`,
        `    SetTextColor 56 189 248 255`,
        `    SetBorderColor 56 189 248 255`,
        `    SetBackgroundColor 10 25 45 245`,
        `    PlayAlertSound ${soundId} 300`,
        `    PlayEffect Cyan`,
        `    MinimapIcon 0 Diamond Cyan`
      );
    }

    return sections.join('\n');
  }, [openItems, leagueName, soundId]);

  // Build auto-chunked Stash Search Regex strings (strictly <= 245 chars per PoE stash search box)
  const stashRegexChunks = useMemo(() => {
    const tokens = Array.from(
      new Set(
        openItems
          .map((it) => {
            const cleaned = escapeRegexToken(it.itemName);
            // Keep first 2 significant words for concise matching
            const words = cleaned.split(' ').filter((w) => w.length > 2);
            return words.slice(0, 2).join(' ') || cleaned;
          })
          .filter(Boolean)
      )
    );

    const chunks: string[] = [];
    let current = '';
    for (const tok of tokens) {
      const part = tok.includes(' ') ? `"${tok}"` : tok;
      if (!current) {
        current = part;
      } else if (`${current}|${part}`.length <= 240) {
        current = `${current}|${part}`;
      } else {
        chunks.push(current);
        current = part;
      }
    }
    if (current) chunks.push(current);
    return chunks;
  }, [openItems]);

  if (!isOpen) return null;

  const copyText = (key: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2200);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[88vh] overflow-y-auto rounded-2xl border border-amber-500/40 bg-[#0d111a] p-5 space-y-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">
                Squad Wishlist Loot Filter &amp; Stash Regex Sync
              </h2>
              <p className="text-[11px] text-slate-400">
                Auto generated from {openItems.length} open squad wishlist requests so you never leave a squadmate&apos;s drop behind.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. In-Game Stash Search Regex */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase text-sky-300">
              1. In Game Stash Search Regex (Dump Tab Scanner)
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              {stashRegexChunks.length} chunk{stashRegexChunks.length === 1 ? '' : 's'} (≤ 250 chars)
            </span>
          </div>
          {stashRegexChunks.length === 0 ? (
            <div className="text-xs text-slate-500 p-3 rounded-xl bg-slate-950 border border-slate-800">
              No open wishlist items to generate regex from yet.
            </div>
          ) : (
            <div className="space-y-2">
              {stashRegexChunks.map((chunk, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2"
                >
                  <code className="flex-1 text-[11px] font-mono text-sky-200 break-all">{chunk}</code>
                  <button
                    type="button"
                    onClick={() => copyText(`rx-${idx}`, chunk)}
                    className="px-2.5 py-1.5 rounded-lg bg-sky-600/25 hover:bg-sky-600/40 border border-sky-400/40 text-sky-200 text-[11px] font-mono font-bold inline-flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    {copiedKey === `rx-${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === `rx-${idx}` ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2. Neversink / FilterBlade Loot Filter Rule Block */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-mono font-bold uppercase text-amber-300 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5" />
              <span>2. Neversink / FilterBlade Custom Loot Filter Snippet</span>
            </span>
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                <span>Alert Sound ID:</span>
                <select
                  value={soundId}
                  onChange={(e) => setSoundId(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-amber-200 cursor-pointer"
                >
                  <option value={6}>6 (Divine / Shing)</option>
                  <option value={1}>1 (Exalt / Gong)</option>
                  <option value={2}>2 (Classic Bell)</option>
                  <option value={3}>3 (High Chime)</option>
                </select>
              </label>
              <button
                type="button"
                onClick={() => copyText('filter', filterBlock)}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] inline-flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === 'filter' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'filter' ? 'Copied Filter!' : 'Copy .filter Block'}</span>
              </button>
            </div>
          </div>

          <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-amber-100/90 overflow-x-auto max-h-[260px] overflow-y-auto leading-relaxed">
            {filterBlock}
          </pre>
        </div>
      </div>
    </div>
  );
};
