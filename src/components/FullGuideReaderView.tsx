import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  Sparkles, 
  BookOpen, 
  List, 
  Maximize2,
  ZoomIn,
  ZoomOut,
  Share2
} from 'lucide-react';
import type { CommunityGuide } from '../types';
import { fireConfetti } from '../utils/confetti';

interface FullGuideReaderViewProps {
  guide: CommunityGuide;
  onBack: () => void;
  onAddUniquesToLookingFor?: (uniques: string[]) => void;
}

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export const FullGuideReaderView: React.FC<FullGuideReaderViewProps> = ({
  guide,
  onBack,
  onAddUniquesToLookingFor
}) => {
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');
  const [copiedRegex, setCopiedRegex] = useState<string | null>(null);
  const [copiedPob, setCopiedPob] = useState<boolean>(false);
  const [copiedShare, setCopiedShare] = useState<boolean>(false);
  const [activeHeadingId, setActiveHeadingId] = useState<string>('');
  const [showMobileToc, setShowMobileToc] = useState<boolean>(false);

  // Extract headings for Table of Contents
  const rawContent = guide.fullGuideMarkdown || (guide.levelingNotes + '\n\n' + guide.endgameNotes);
  const lines = rawContent.split('\n');

  const tocItems: TocItem[] = [];
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
      const level = trimmed.startsWith('## ') ? 2 : 3;
      const text = trimmed.replace(/^#+\s*/, '').trim();
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      tocItems.push({ id, text, level });
    }
  });

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRegex(key);
    setTimeout(() => setCopiedRegex(null), 2000);
  };

  const handleCopyPob = () => {
    navigator.clipboard.writeText(guide.pobCodeOrUrl);
    setCopiedPob(true);
    setTimeout(() => setCopiedPob(false), 2000);
  };

  const handleShareGuide = () => {
    const guideSlug = guide.slug || guide.id;
    const url = typeof window !== 'undefined' ? `${window.location.origin}/guide/${guideSlug}` : `https://exilessf.app/guide/${guideSlug}`;
    navigator.clipboard.writeText(url);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const handlePopOut = () => {
    const guideSlug = guide.slug || guide.id;
    const url = `/guide/${guideSlug}`;
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'width=1300,height=900,menubar=no,toolbar=no,location=yes');
    }
  };

  const handleAddUniques = () => {
    if (onAddUniquesToLookingFor && guide.requiredUniques && guide.requiredUniques.length > 0) {
      onAddUniquesToLookingFor(guide.requiredUniques);
      fireConfetti();
    }
  };

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveHeadingId(id);
      setShowMobileToc(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-200 font-sans selection:bg-indigo-500 selection:text-white pb-24">
      
      {/* Top Sticky Command Bar */}
      <header className="sticky top-0 z-40 bg-[#0c111c]/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-3 shadow-xl">
        <div className="max-w-[1800px] mx-auto flex flex-wrap items-center justify-between gap-3">
          
          {/* Back & Breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Guides</span>
            </button>

            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
              <span className="text-slate-600">/</span>
              <span className="font-mono uppercase text-indigo-400 font-bold">{guide.ascendancy}</span>
              <span className="text-slate-600">/</span>
              <span className="text-slate-200 font-medium truncate max-w-[280px]">{guide.title}</span>
            </div>
          </div>

          {/* Right Action Suite for Secondary Monitor */}
          <div className="flex items-center gap-2">
            
            {/* Font Size Adjuster */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setFontSize(fontSize === 'lg' ? 'base' : 'sm')}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Decrease font size"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-mono text-[11px] text-slate-400 uppercase">{fontSize}</span>
              <button
                type="button"
                onClick={() => setFontSize(fontSize === 'sm' ? 'base' : 'lg')}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Increase font size for secondary monitor"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Mobile TOC Toggle */}
            <button
              type="button"
              onClick={() => setShowMobileToc(!showMobileToc)}
              className="lg:hidden px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 flex items-center gap-1 cursor-pointer"
            >
              <List className="w-3.5 h-3.5 text-indigo-400" />
              <span>Index</span>
            </button>

            {/* Pop Out to New Window */}
            <button
              type="button"
              onClick={handlePopOut}
              className="hidden md:flex px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs text-slate-200 font-medium items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              title="Pop out guide into a dedicated clean window for your secondary monitor"
            >
              <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Pop Out</span>
            </button>

            {/* Copy Share Link */}
            <button
              type="button"
              onClick={handleShareGuide}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 flex items-center gap-1 cursor-pointer"
              title="Copy direct share URL"
            >
              {copiedShare ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-slate-400" />}
              <span className="hidden sm:inline">{copiedShare ? 'Copied' : 'Share'}</span>
            </button>

            {/* Copy PoB */}
            <button
              type="button"
              onClick={handleCopyPob}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow cursor-pointer"
            >
              {copiedPob ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedPob ? 'PoB Copied' : 'Copy PoB'}</span>
            </button>

            {/* Add Uniques */}
            {guide.requiredUniques && guide.requiredUniques.length > 0 && onAddUniquesToLookingFor && (
              <button
                type="button"
                onClick={handleAddUniques}
                className="hidden xl:flex px-3 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white font-semibold text-xs items-center gap-1.5 transition-colors shadow cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Add Uniques to Looking For</span>
              </button>
            )}

          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex gap-8 items-start">
        
        {/* Sticky Sidebar Table of Contents (Desktop) */}
        <aside className="hidden lg:block w-72 xl:w-80 flex-shrink-0 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                Table of Contents
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
              {tocItems.length} Sections
            </span>
          </div>

          <nav className="space-y-1 text-xs">
            {tocItems.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => scrollToHeading(item.id)}
                className={`w-full text-left py-1.5 px-2 rounded-lg transition-colors truncate block cursor-pointer ${
                  item.level === 3 ? 'pl-5 text-slate-400 hover:text-slate-200' : 'font-semibold text-slate-300 hover:text-white'
                } ${activeHeadingId === item.id ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-bold' : 'hover:bg-slate-800/50'}`}
              >
                {item.text}
              </button>
            ))}
          </nav>
        </aside>

        {/* Mobile Slideout Table of Contents */}
        {showMobileToc && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-md p-4 flex flex-col justify-between">
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 max-h-[80vh] overflow-y-auto space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-bold text-sm text-white">Table of Contents</span>
                <button
                  type="button"
                  onClick={() => setShowMobileToc(false)}
                  className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800"
                >
                  Close
                </button>
              </div>
              <div className="space-y-1 text-xs">
                {tocItems.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => scrollToHeading(item.id)}
                    className="w-full text-left py-2 px-2 rounded hover:bg-slate-800 text-slate-300 block truncate"
                  >
                    {item.text}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Guide Content Body */}
        <main className={`flex-1 min-w-0 bg-slate-900/40 rounded-3xl border border-slate-800/80 p-6 sm:p-10 lg:p-12 shadow-2xl space-y-8 ${
          fontSize === 'sm' ? 'text-xs leading-relaxed' : fontSize === 'lg' ? 'text-base sm:text-lg leading-relaxed' : 'text-sm sm:text-base leading-relaxed'
        }`}>
          
          {/* Guide Hero Header Card */}
          <div className="p-6 sm:p-8 rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-950 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-mono text-xs font-bold uppercase tracking-wider">
                {guide.className} : {guide.ascendancy}
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-xs font-bold">
                PoE 3.30 Covens of Umbra
              </span>
              <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold">
                SSF and GSF Verified
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-poppins">
              {guide.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 pt-2 border-t border-slate-800">
              <div>Author: <strong className="text-slate-200">@{guide.authorName}</strong></div>
              <div>Playstyle: <strong className="text-slate-200">{guide.playstyle}</strong></div>
              <div>Score: <strong className="text-emerald-400">{guide.starterRating}/10</strong></div>
              <div>Status: <strong className="text-indigo-400">{guide.createdAt}</strong></div>
            </div>
          </div>

          {/* Render Parsed Markdown Body */}
          <div className="space-y-6 text-slate-300">
            {rawContent.split('\n\n').map((paragraph, pIdx) => {
              const trimmed = paragraph.trim();
              if (!trimmed) return null;

              // Top level Heading
              if (trimmed.startsWith('# ')) {
                const text = trimmed.replace(/^#\s*/, '').trim();
                const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                return (
                  <h1 key={pIdx} id={id} className="text-2xl sm:text-3xl font-black text-white pt-8 pb-2 border-b border-slate-800 font-poppins scroll-mt-24">
                    {text}
                  </h1>
                );
              }

              // Second level Heading (Chapters)
              if (trimmed.startsWith('## ')) {
                const text = trimmed.replace(/^##\s*/, '').trim();
                const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                return (
                  <h2 key={pIdx} id={id} className="text-xl sm:text-2xl font-bold text-amber-300 pt-6 pb-2 border-b border-slate-800/80 font-poppins scroll-mt-24">
                    {text}
                  </h2>
                );
              }

              // Third level Heading (Sections)
              if (trimmed.startsWith('### ')) {
                const text = trimmed.replace(/^###\s*/, '').trim();
                const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                return (
                  <h3 key={pIdx} id={id} className="text-base sm:text-lg font-bold text-slate-100 pt-4 font-poppins scroll-mt-24 text-indigo-300">
                    {text}
                  </h3>
                );
              }

              // Code block with copy button
              if (trimmed.startsWith('```')) {
                const codeLines = trimmed.split('\n');
                const codeBody = codeLines.slice(1, -1).join('\n');
                const isCopied = copiedRegex === `code-${pIdx}`;

                return (
                  <div key={pIdx} className="my-4 rounded-xl border border-slate-800 bg-slate-950/90 overflow-hidden shadow-inner">
                    <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
                      <span>Vendor Search / Filter Regex</span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(codeBody, `code-${pIdx}`)}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{isCopied ? 'Copied' : 'Copy String'}</span>
                      </button>
                    </div>
                    <pre className="p-4 font-mono text-xs sm:text-sm text-emerald-300 overflow-x-auto whitespace-pre-wrap select-all">
                      {codeBody}
                    </pre>
                  </div>
                );
              }

              // Bullet List
              if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
                const listItems = trimmed.split('\n').filter((l) => l.trim().length > 0);
                return (
                  <ul key={pIdx} className="space-y-2 pl-4 list-disc list-outside text-slate-300 my-3">
                    {listItems.map((item, lIdx) => {
                      const cleanItem = item.replace(/^(\*|-)\s*/, '');
                      return (
                        <li key={lIdx} className="leading-relaxed">
                          {cleanItem}
                        </li>
                      );
                    })}
                  </ul>
                );
              }

              // Standard Paragraph
              return (
                <p key={pIdx} className="text-slate-300 leading-relaxed font-sans">
                  {trimmed}
                </p>
              );
            })}
          </div>

          {/* Bottom Navigation & Feedback Bar */}
          <div className="pt-8 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Community Guides</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleShareGuide}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>{copiedShare ? 'Link Copied' : 'Share Guide'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyPob}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                <span>Copy Path of Building</span>
              </button>
            </div>
          </div>

        </main>

      </div>
    </div>
  );
};
