import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  X, 
  BookOpen, 
  Database, 
  ExternalLink, 
  Layers
} from 'lucide-react';
import { searchDualLinks } from '../data/dualLinks';
import type { DualLink } from '../types';

interface DualLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DualLinkModal: React.FC<DualLinkModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DualLink[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setResults(searchDualLinks(''));
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    setResults(searchDualLinks(query));
  }, [query]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-white dark:bg-[#0f121a] border border-slate-200 dark:border-slate-200 dark:border-[#2d2d44] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Bar Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-slate-200 dark:border-[#2d2d44] bg-slate-50 dark:bg-poe-dark">
          <Search className="w-5 h-5 text-amber-500 mr-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search items, mechanics, cards, bosses for instant Dual Links..."
            className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 mr-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <kbd className="px-2 py-0.5 text-[10px] bg-slate-200 dark:bg-[#2d2d44] border border-slate-300 dark:border-[#3f3f5f] rounded text-slate-500 dark:text-slate-400 font-mono">
              ESC
            </kbd>
          </button>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-3 space-y-2 flex-1 no-scrollbar">
          {results.map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-white dark:bg-[#1a1a2e]/80 border border-slate-200 dark:border-slate-200 dark:border-[#2d2d44] hover:border-amber-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors shadow-sm"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100 font-poe">
                    {item.name}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-200 dark:bg-[#2d2d44] text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-[#3f3f5f] font-mono">
                    {item.category}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">
                  {item.description}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  href={item.poeWikiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Wiki</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <a
                  href={item.poeDbUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-700 dark:text-sky-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>PoEDB</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}

          {results.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-xs space-y-1">
              <div>No results found for "{query}"</div>
              <div className="text-[11px] text-slate-500">Try searching for "Porcupine", "Rog", "Searing Exarch", "Lightning Coil"</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-100 dark:bg-poe-dark border-t border-slate-200 dark:border-slate-200 dark:border-[#2d2d44] flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-amber-500" />
            <span>Dual Link Indexer: PoEWiki (qualitative) & PoEDB (datamined numbers)</span>
          </div>
          <div className="hidden sm:block">Press ESC to dismiss</div>
        </div>
      </div>
    </div>
  );
};
