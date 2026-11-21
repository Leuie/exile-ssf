import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Filter,
  Copy,
  Download,
  CheckCircle2,
  BookOpen,
  Sparkles,
  X
} from 'lucide-react';
import type { LookingForItem } from '../../../types';

export interface LootFilterExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  lookingForItems: LookingForItem[];
  triggerCopy: (text: string, label: string) => void;
}

function sanitizeFilterName(name: string): string {
  return name.replace(/"/g, '').trim();
}

export const LootFilterExportModal: React.FC<LootFilterExportModalProps> = ({
  isOpen,
  onClose,
  lookingForItems,
  triggerCopy
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [guideTab, setGuideTab] = useState<'local' | 'filterblade'>('local');
  const [includeBountiesOnly, setIncludeBountiesOnly] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.showModal();
    } else if (dialogRef.current?.open) {
      dialogRef.current.close();
    }
  }, [isOpen]);

  const filterOutput = useMemo(() => {
    const openItems = lookingForItems.filter((it) => it.status !== 'HAVE');
    const bountyNames = new Set<string>();
    const baseAndUniqueNames = new Set<string>();
    const gemNames = new Set<string>();
    const divCardNames = new Set<string>();
    const miscNames = new Set<string>();

    for (const item of openItems) {
      const clean = sanitizeFilterName(item.itemName);
      if (!clean) continue;

      if (item.bountyOffer && item.bountyOffer.trim()) {
        bountyNames.add(clean);
        continue;
      }
      if (includeBountiesOnly) continue;

      if (item.category === 'Gem' || item.category === 'Vaal Gem' || item.category === 'Transfigured Gem' || item.category === 'Awakened Gem') {
        gemNames.add(clean);
      } else if (item.category === 'Div Card') {
        divCardNames.add(clean);
      } else if (item.category === 'Unique' || item.category === 'Base / Crafting' || item.category === 'Cluster Jewel' || item.category === 'Jewel' || item.category === 'Flask / Tincture') {
        baseAndUniqueNames.add(clean);
      } else {
        miscNames.add(clean);
      }
    }

    const lines: string[] = [
      '# ===================================================================',
      '# EXILE SSF SQUAD WISHLIST & BOUNTY OVERRIDE BLOCK',
      `# Generated: ${new Date().toLocaleDateString()} | Paste at Line 1 (TOP) of your .filter file`,
      '# Note: Uniques in PoE filters match by BaseType. Keep unique bases included below.',
      '# ===================================================================',
      ''
    ];

    if (bountyNames.size > 0) {
      const quoted = Array.from(bountyNames).map((n) => `"${n}"`).join(' ');
      lines.push(
        '# SECTION 1: ACTIVE SQUAD BOUNTIES (GOLD BEAM + STAR ICON)',
        'Show',
        `    BaseType == ${quoted}`,
        '    SetFontSize 45',
        '    SetTextColor 255 215 0 255',
        '    SetBorderColor 255 215 0 255',
        '    SetBackgroundColor 45 25 0 245',
        '    PlayAlertSound 1 300',
        '    PlayEffect Yellow',
        '    MinimapIcon 0 Yellow Star',
        ''
      );
    }

    if (divCardNames.size > 0) {
      const quoted = Array.from(divCardNames).map((n) => `"${n}"`).join(' ');
      lines.push(
        '# SECTION 2: SQUAD WANTED DIVINATION CARDS (EMERALD BEAM)',
        'Show',
        '    Class == "Divination Cards"',
        `    BaseType == ${quoted}`,
        '    SetFontSize 42',
        '    SetTextColor 16 185 129 255',
        '    SetBorderColor 16 185 129 255',
        '    SetBackgroundColor 6 40 30 240',
        '    PlayAlertSound 2 250',
        '    PlayEffect Green',
        '    MinimapIcon 1 Green Diamond',
        ''
      );
    }

    if (gemNames.size > 0) {
      const quoted = Array.from(gemNames).map((n) => `"${n}"`).join(' ');
      lines.push(
        '# SECTION 3: SQUAD WANTED SKILL & TRANSFIGURED GEMS (CYAN BEAM)',
        'Show',
        '    Class "Gems"',
        `    BaseType ${quoted}`,
        '    SetFontSize 42',
        '    SetTextColor 34 211 238 255',
        '    SetBorderColor 34 211 238 255',
        '    SetBackgroundColor 8 45 55 240',
        '    PlayAlertSound 2 250',
        '    PlayEffect Cyan',
        '    MinimapIcon 1 Cyan Hexagon',
        ''
      );
    }

    if (baseAndUniqueNames.size > 0 || miscNames.size > 0) {
      const combined = Array.from(new Set([...baseAndUniqueNames, ...miscNames]))
        .map((n) => `"${n}"`)
        .join(' ');
      lines.push(
        '# SECTION 4: SQUAD WANTED BASES, FRAGMENTS & SPECIALTY DROPS (EMERALD BEAM)',
        'Show',
        `    BaseType ${combined}`,
        '    SetFontSize 42',
        '    SetTextColor 16 185 129 255',
        '    SetBorderColor 16 185 129 255',
        '    SetBackgroundColor 6 40 30 240',
        '    PlayAlertSound 2 250',
        '    PlayEffect Green',
        '    MinimapIcon 1 Green Diamond',
        ''
      );
    }

    if (lines.length <= 6) {
      lines.push('# No open squad wishlist items found to export yet.');
    }

    return {
      code: lines.join('\n'),
      totalCount: bountyNames.size + baseAndUniqueNames.size + gemNames.size + divCardNames.size + miscNames.size,
      bountyCount: bountyNames.size
    };
  }, [lookingForItems, includeBountiesOnly]);

  const handleCopyBlock = () => {
    triggerCopy(filterOutput.code, 'Squad Loot Filter Block');
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadFile = () => {
    const blob = new Blob([filterOutput.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'exile_ssf_squad_override.filter';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      {...({ closedby: 'any' } as any)}
      className="w-[95vw] sm:w-full sm:max-w-3xl rounded-2xl border border-emerald-500/40 bg-slate-900 text-slate-200 p-0 shadow-2xl backdrop:bg-black/80 m-auto overflow-hidden"
    >
      <div className="flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-amber-950/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300">
              <Filter className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white">
                  Squad Wishlist Loot Filter Generator
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                  {filterOutput.totalCount} Rules Ready
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Highlight squadmate drops with a Gold Beam (Bounties) or Emerald Beam (Squad Needs) directly inside Path of Exile.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Step by Step Handholding Guide */}
          <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                <BookOpen className="w-4 h-4" />
                <span>How to Add This to Your Path of Exile Filter (Beginner Friendly)</span>
              </div>
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono">
                <button
                  type="button"
                  onClick={() => setGuideTab('local')}
                  className={`px-2.5 py-1 rounded-md cursor-pointer transition-colors ${
                    guideTab === 'local' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Option A: Local Filter (30s)
                </button>
                <button
                  type="button"
                  onClick={() => setGuideTab('filterblade')}
                  className={`px-2.5 py-1 rounded-md cursor-pointer transition-colors ${
                    guideTab === 'filterblade' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Option B: FilterBlade.xyz
                </button>
              </div>
            </div>

            {guideTab === 'local' ? (
              <ol className="space-y-1.5 text-xs text-slate-300 list-decimal list-inside leading-relaxed">
                <li>Click <strong>Copy Filter Block</strong> below to copy the live squad rules to your clipboard.</li>
                <li>Open Path of Exile, press <strong>Escape &gt; Options &gt; Game</strong>, and scroll to <strong>Item Filter</strong>.</li>
                <li>Click the <strong>Open Folder</strong> button next to your filter dropdown to open your Windows filter folder.</li>
                <li>Right click your active <code>.filter</code> file (for example, <code>NeverSink_Regular.filter</code>) and choose <strong>Open with &gt; Notepad</strong>.</li>
                <li>Click at the very top (<strong>Line 1</strong>, above everything else), press <strong>Ctrl+V</strong> to paste, press <strong>Ctrl+S</strong> to save, then click <strong>Reload</strong> inside Path of Exile.</li>
              </ol>
            ) : (
              <ol className="space-y-1.5 text-xs text-slate-300 list-decimal list-inside leading-relaxed">
                <li>Sign into <strong>FilterBlade.xyz</strong> with your Path of Exile account and load your usual filter preset.</li>
                <li>Open the <strong>Customize</strong> tab, scroll to the bottom, and expand <strong>Miscellaneous &gt; Custom Rules</strong> (or <strong>Import / Export</strong>).</li>
                <li>Add the squad bases, divination cards, and gems listed below into your High Priority Custom Show rule, or download your filter locally and paste the block at Line 1.</li>
                <li>Go to <strong>Save &amp; Export &gt; Sync with PoE</strong> and select your synced filter inside Path of Exile Options.</li>
              </ol>
            )}
          </div>

          {/* Options & Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeBountiesOnly}
                onChange={(e) => setIncludeBountiesOnly(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-amber-500"
              />
              <span>Export Active Bounties Only ({filterOutput.bountyCount} items)</span>
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadFile}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-slate-200 flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Download .filter</span>
              </button>
              <button
                type="button"
                onClick={handleCopyBlock}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Filter Block'}</span>
              </button>
            </div>
          </div>

          {/* Generated Filter Code Box */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
            <div className="px-3 py-2 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Live Generated PoE Item Filter Syntax</span>
              </span>
              <span>Gold Beam = Bounty • Emerald Beam = Squad Need</span>
            </div>
            <pre className="p-3.5 text-[11px] font-mono text-emerald-200/90 overflow-x-auto max-h-64 leading-relaxed">
              {filterOutput.code}
            </pre>
          </div>
        </div>
      </div>
    </dialog>
  );
};
