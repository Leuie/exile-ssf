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
  Share2,
  Edit3,
  Save,
  RotateCcw,
  Eye,
  Split
} from 'lucide-react';
import type { CommunityGuide } from '../types';
import { fireConfetti } from '../utils/confetti';

interface FullGuideReaderViewProps {
  guide: CommunityGuide;
  onBack: () => void;
  onAddUniquesToLookingFor?: (uniques: string[]) => void;
  onUpdateGuide?: (updatedGuide: CommunityGuide) => void;
}

interface TocItem {
  id: string;
  text: string;
  level: number;
}

type MarkdownBlock =
  | { type: 'h1'; text: string; id: string }
  | { type: 'h2'; text: string; id: string }
  | { type: 'h3'; text: string; id: string }
  | { type: 'h4'; text: string; id: string }
  | { type: 'paragraph'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'code'; code: string; language?: string }
  | { type: 'blockquote'; lines: string[] }
  | { type: 'hr' };

function parseMarkdownBlocks(raw: string): MarkdownBlock[] {
  const lines = raw.split(/\r?\n/);
  const blocks: MarkdownBlock[] = [];
  let i = 0;

  const toId = (text: string) =>
    text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // Code block
    if (trimmed.startsWith('```')) {
      const language = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++;
      blocks.push({ type: 'code', code: codeLines.join('\n'), language });
      continue;
    }

    // Headings
    if (trimmed.startsWith('# ')) {
      const text = trimmed.replace(/^#\s*/, '').trim();
      blocks.push({ type: 'h1', text, id: toId(text) });
      i++;
      continue;
    }
    if (trimmed.startsWith('## ')) {
      const text = trimmed.replace(/^##\s*/, '').trim();
      blocks.push({ type: 'h2', text, id: toId(text) });
      i++;
      continue;
    }
    if (trimmed.startsWith('### ')) {
      const text = trimmed.replace(/^###\s*/, '').trim();
      blocks.push({ type: 'h3', text, id: toId(text) });
      i++;
      continue;
    }
    if (trimmed.startsWith('#### ')) {
      const text = trimmed.replace(/^####\s*/, '').trim();
      blocks.push({ type: 'h4', text, id: toId(text) });
      i++;
      continue;
    }

    // Horizontal Rule
    if (trimmed === '---' || trimmed === '***') {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('>')) {
      const bqLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        bqLines.push(lines[i].trim().replace(/^>\s*/, ''));
        i++;
      }
      blocks.push({ type: 'blockquote', lines: bqLines });
      continue;
    }

    // Unordered List
    if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('+ ')) {
      const items: string[] = [];
      while (
        i < lines.length &&
        (lines[i].trim().startsWith('* ') ||
          lines[i].trim().startsWith('- ') ||
          lines[i].trim().startsWith('• ') ||
          lines[i].trim().startsWith('+ '))
      ) {
        items.push(lines[i].trim().replace(/^(\*|-|•|\+)\s*/, ''));
        i++;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }

    // Ordered List
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
        i++;
      }
      blocks.push({ type: 'ol', items });
      continue;
    }

    // Standard Paragraph
    const pLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith('#') &&
      !lines[i].trim().startsWith('```') &&
      !lines[i].trim().startsWith('* ') &&
      !lines[i].trim().startsWith('- ') &&
      !lines[i].trim().startsWith('• ') &&
      !lines[i].trim().startsWith('+ ') &&
      !/^\d+\.\s+/.test(lines[i].trim()) &&
      !lines[i].trim().startsWith('>') &&
      lines[i].trim() !== '---'
    ) {
      pLines.push(lines[i].trim());
      i++;
    }
    if (pLines.length > 0) {
      blocks.push({ type: 'paragraph', text: pLines.join(' ') });
    }
  }

  return blocks;
}

function renderInlineMarkdown(text: string): React.ReactNode {
  const tokens: React.ReactNode[] = [];
  const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`|\[.*?\]\(.*?\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**') && token.length >= 4) {
      tokens.push(
        <strong key={match.index} className="font-bold text-white">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*') && token.length >= 2) {
      tokens.push(
        <em key={match.index} className="italic text-slate-300">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith('`') && token.endsWith('`') && token.length >= 2) {
      tokens.push(
        <code
          key={match.index}
          className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-emerald-300 font-mono text-xs"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('[') && token.includes('](') && token.endsWith(')')) {
      const splitIdx = token.indexOf('](');
      const label = token.slice(1, splitIdx);
      const href = token.slice(splitIdx + 2, -1);
      tokens.push(
        <a
          key={match.index}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-400 hover:text-indigo-300 underline font-medium"
        >
          {label}
        </a>
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push(text.slice(lastIndex));
  }

  return tokens.length > 0 ? tokens : text;
}

export const FullGuideReaderView: React.FC<FullGuideReaderViewProps> = ({
  guide,
  onBack,
  onAddUniquesToLookingFor,
  onUpdateGuide
}) => {
  const [activeGuide, setActiveGuide] = useState<CommunityGuide>(guide);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');
  const [copiedRegex, setCopiedRegex] = useState<string | null>(null);
  const [copiedPob, setCopiedPob] = useState<boolean>(false);
  const [copiedShare, setCopiedShare] = useState<boolean>(false);
  const [activeHeadingId, setActiveHeadingId] = useState<string>('');
  const [showMobileToc, setShowMobileToc] = useState<boolean>(false);

  // Markdown Editor State
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editorContent, setEditorContent] = useState<string>(() =>
    activeGuide.fullGuideMarkdown || (activeGuide.levelingNotes + '\n\n' + activeGuide.endgameNotes)
  );
  const [editorTitle, setEditorTitle] = useState<string>(activeGuide.title);
  const [editorAscendancy, setEditorAscendancy] = useState<string>(activeGuide.ascendancy);
  const [editorPlaystyle, setEditorPlaystyle] = useState<string>(activeGuide.playstyle);
  const [editorPob, setEditorPob] = useState<string>(activeGuide.pobCodeOrUrl);
  const [editorRating, setEditorRating] = useState<number>(activeGuide.starterRating);
  const [editorLayout, setEditorLayout] = useState<'dual' | 'edit' | 'preview'>('dual');
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Parse markdown content into structured blocks
  const rawContent = activeGuide.fullGuideMarkdown || (activeGuide.levelingNotes + '\n\n' + activeGuide.endgameNotes);
  const blocks = parseMarkdownBlocks(rawContent);

  // Generate Table of Contents from parsed headings
  const tocItems: TocItem[] = [];
  blocks.forEach((b) => {
    if (b.type === 'h2') {
      tocItems.push({ id: b.id, text: b.text, level: 2 });
    } else if (b.type === 'h3') {
      tocItems.push({ id: b.id, text: b.text, level: 3 });
    }
  });

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRegex(key);
    setTimeout(() => setCopiedRegex(null), 2000);
  };

  const handleCopyPob = () => {
    navigator.clipboard.writeText(activeGuide.pobCodeOrUrl);
    setCopiedPob(true);
    setTimeout(() => setCopiedPob(false), 2000);
  };

  const handleShareGuide = () => {
    const guideSlug = activeGuide.slug || activeGuide.id;
    const url = typeof window !== 'undefined' ? `${window.location.origin}/guide/${guideSlug}` : `https://exilessf.app/guide/${guideSlug}`;
    navigator.clipboard.writeText(url);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const handlePopOut = () => {
    const guideSlug = activeGuide.slug || activeGuide.id;
    const url = `/guide/${guideSlug}`;
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'width=1300,height=900,menubar=no,toolbar=no,location=yes');
    }
  };

  const handleAddUniques = () => {
    if (onAddUniquesToLookingFor && activeGuide.requiredUniques && activeGuide.requiredUniques.length > 0) {
      onAddUniquesToLookingFor(activeGuide.requiredUniques);
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

  // Editor Actions
  const handleInsertSnippet = (before: string, after: string = '') => {
    const textarea = document.getElementById('markdown-editor-textarea') as HTMLTextAreaElement | null;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = editorContent.slice(start, end);
    const replacement = `${before}${selected}${after}`;
    const nextContent = editorContent.slice(0, start) + replacement + editorContent.slice(end);
    setEditorContent(nextContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 0);
  };

  const handleSaveGuide = () => {
    const updated: CommunityGuide = {
      ...activeGuide,
      title: editorTitle,
      ascendancy: editorAscendancy,
      playstyle: editorPlaystyle,
      pobCodeOrUrl: editorPob,
      starterRating: Number(editorRating) || 10,
      fullGuideMarkdown: editorContent
    };

    setActiveGuide(updated);
    if (onUpdateGuide) {
      onUpdateGuide(updated);
    }

    try {
      const raw = localStorage.getItem('poe_umbraleague_guides');
      const list: CommunityGuide[] = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex((g) => g.id === updated.id);
      if (idx >= 0) {
        list[idx] = updated;
      } else {
        list.push(updated);
      }
      localStorage.setItem('poe_umbraleague_guides', JSON.stringify(list));
    } catch {}

    fireConfetti();
    setSaveToast('Guide saved successfully!');
    setTimeout(() => setSaveToast(null), 3000);
    setIsEditing(false);
  };

  const handleResetToDefault = () => {
    const initialRaw = guide.fullGuideMarkdown || (guide.levelingNotes + '\n\n' + guide.endgameNotes);
    setEditorContent(initialRaw);
    setEditorTitle(guide.title);
    setEditorAscendancy(guide.ascendancy);
    setEditorPlaystyle(guide.playstyle);
    setEditorPob(guide.pobCodeOrUrl);
    setEditorRating(guide.starterRating);
  };

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-200 font-sans selection:bg-indigo-500 selection:text-white pb-24">
      
      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-emerald-900/90 border border-emerald-500/50 text-emerald-100 text-xs font-semibold shadow-2xl flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Top Sticky Command Bar */}
      <header className="sticky top-0 z-40 bg-[#0c111c]/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-3 shadow-xl">
        <div className="max-w-[1800px] mx-auto flex flex-wrap items-center justify-between gap-3">
          
          {/* Back and Breadcrumb */}
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
              <span className="font-mono uppercase text-indigo-400 font-bold">{activeGuide.ascendancy}</span>
              <span className="text-slate-600">/</span>
              <span className="text-slate-200 font-medium truncate max-w-[280px]">{activeGuide.title}</span>
            </div>
          </div>

          {/* Right Action Suite */}
          <div className="flex items-center gap-2">
            
            {/* Full Markdown Editor Trigger */}
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm ${
                isEditing
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-400'
              }`}
              title="Open full markdown editor to customize this guide"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Close Editor' : 'Edit Guide'}</span>
            </button>

            {/* Font Size Adjuster (in reader mode) */}
            {!isEditing && (
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
            )}

            {/* Mobile TOC Toggle */}
            {!isEditing && (
              <button
                type="button"
                onClick={() => setShowMobileToc(!showMobileToc)}
                className="lg:hidden px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 flex items-center gap-1 cursor-pointer"
              >
                <List className="w-3.5 h-3.5 text-indigo-400" />
                <span>Index</span>
              </button>
            )}

            {/* Pop Out to Dedicated Window */}
            {!isEditing && (
              <button
                type="button"
                onClick={handlePopOut}
                className="hidden md:flex px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs text-slate-200 font-medium items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                title="Pop out guide into a dedicated clean window for your secondary monitor"
              >
                <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Pop Out</span>
              </button>
            )}

            {/* Copy Share Link */}
            <button
              type="button"
              onClick={handleShareGuide}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 flex items-center gap-1 cursor-pointer"
              title="Copy direct share URL for this guide"
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
            {activeGuide.requiredUniques && activeGuide.requiredUniques.length > 0 && onAddUniquesToLookingFor && (
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

      {/* ========================================================================= */}
      {/* FULL MARKDOWN EDITOR STUDIO                                               */}
      {/* ========================================================================= */}
      {isEditing ? (
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-4">
          
          {/* Editor Header Bar with Actions */}
          <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-xs flex items-center gap-1.5">
                <Edit3 className="w-4 h-4" />
                <span>Full Markdown Editor</span>
              </div>
              <span className="text-xs text-slate-400 hidden sm:inline">
                Live side by side preview with persistent storage.
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Layout Switcher */}
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setEditorLayout('edit')}
                  className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                    editorLayout === 'edit' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Edit Only
                </button>
                <button
                  type="button"
                  onClick={() => setEditorLayout('dual')}
                  className={`hidden md:flex px-2.5 py-1 rounded text-xs transition-colors cursor-pointer items-center gap-1 ${
                    editorLayout === 'dual' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Split className="w-3 h-3" />
                  <span>Dual View</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditorLayout('preview')}
                  className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                    editorLayout === 'preview' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Preview Only
                </button>
              </div>

              <button
                type="button"
                onClick={handleResetToDefault}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Restore default guide markdown"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>

              <button
                type="button"
                onClick={handleSaveGuide}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950/50 cursor-pointer transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Guide</span>
              </button>
            </div>
          </div>

          {/* Guide Metadata Inputs */}
          <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
            <div>
              <label className="text-slate-400 block mb-1">Guide Title</label>
              <input
                type="text"
                value={editorTitle}
                onChange={(e) => setEditorTitle(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 font-sans"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Ascendancy</label>
              <input
                type="text"
                value={editorAscendancy}
                onChange={(e) => setEditorAscendancy(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Playstyle Archetype</label>
              <input
                type="text"
                value={editorPlaystyle}
                onChange={(e) => setEditorPlaystyle(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Path of Building URL</label>
              <input
                type="text"
                value={editorPob}
                onChange={(e) => setEditorPob(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Formatting Quick Toolbar */}
          <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
            <span className="text-slate-500 text-[11px] px-2 font-bold uppercase">Format:</span>
            <button
              type="button"
              onClick={() => handleInsertSnippet('**', '**')}
              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-bold cursor-pointer"
            >
              B
            </button>
            <button
              type="button"
              onClick={() => handleInsertSnippet('*', '*')}
              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 italic cursor-pointer"
            >
              I
            </button>
            <button
              type="button"
              onClick={() => handleInsertSnippet('\n\n## Chapter Name\n\n')}
              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-800 font-bold cursor-pointer"
            >
              ## H2 Chapter
            </button>
            <button
              type="button"
              onClick={() => handleInsertSnippet('\n\n### Section Title\n\n')}
              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-slate-800 font-bold cursor-pointer"
            >
              ### H3 Section
            </button>
            <button
              type="button"
              onClick={() => handleInsertSnippet('\n* ')}
              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 cursor-pointer"
            >
              • List
            </button>
            <button
              type="button"
              onClick={() => handleInsertSnippet('\n```text\n', '\n```\n')}
              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-800 cursor-pointer"
            >
              Code Block
            </button>
            <button
              type="button"
              onClick={() => handleInsertSnippet('\n\n| Item | Location | Notes |\n|---|---|---|\n| Imperial Claw | T10+ Maps | ilvl 82+ |\n\n')}
              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-800 cursor-pointer"
            >
              Table
            </button>
            <button
              type="button"
              onClick={() => handleInsertSnippet('[Item Name](', ')')}
              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-indigo-400 border border-slate-800 cursor-pointer"
            >
              [Link](url)
            </button>
          </div>

          {/* Dual Workspace (Editor Left, Live Preview Right) */}
          <div className={`grid gap-4 ${editorLayout === 'dual' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
            
            {/* Editor Pane */}
            {(editorLayout === 'dual' || editorLayout === 'edit') && (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4 space-y-2 flex flex-col shadow-inner">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 pb-2 border-b border-slate-800">
                  <span>Markdown Source Document</span>
                  <span>{editorContent.length} characters</span>
                </div>
                <textarea
                  id="markdown-editor-textarea"
                  value={editorContent}
                  onChange={(e) => setEditorContent(e.target.value)}
                  className="w-full h-[650px] bg-transparent text-slate-200 font-mono text-xs sm:text-sm leading-relaxed p-2 focus:outline-none resize-none selection:bg-indigo-600"
                  placeholder="Enter guide markdown here..."
                />
              </div>
            )}

            {/* Live Preview Pane */}
            {(editorLayout === 'dual' || editorLayout === 'preview') && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 sm:p-8 space-y-6 overflow-y-auto h-[710px] shadow-2xl">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 pb-2 border-b border-slate-800">
                  <span className="flex items-center gap-1.5 text-indigo-400 font-bold">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Live Rendered Preview</span>
                  </span>
                  <span>Secondary Monitor Simulation</span>
                </div>

                <div className="space-y-6">
                  {parseMarkdownBlocks(editorContent).map((block, idx) => {
                    if (block.type === 'h1') {
                      return (
                        <h1 key={idx} className="text-2xl font-black text-white pt-4 pb-2 border-b border-slate-800">
                          {renderInlineMarkdown(block.text)}
                        </h1>
                      );
                    }
                    if (block.type === 'h2') {
                      return (
                        <h2 key={idx} className="text-xl font-bold text-amber-300 pt-4 pb-1 border-b border-slate-800/80">
                          {renderInlineMarkdown(block.text)}
                        </h2>
                      );
                    }
                    if (block.type === 'h3') {
                      return (
                        <h3 key={idx} className="text-base font-bold text-indigo-300 pt-3">
                          {renderInlineMarkdown(block.text)}
                        </h3>
                      );
                    }
                    if (block.type === 'h4') {
                      return (
                        <h4 key={idx} className="text-sm font-semibold text-slate-200 pt-2">
                          {renderInlineMarkdown(block.text)}
                        </h4>
                      );
                    }
                    if (block.type === 'hr') {
                      return <hr key={idx} className="border-slate-800 my-6" />;
                    }
                    if (block.type === 'code') {
                      return (
                        <div key={idx} className="my-3 rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-emerald-300 whitespace-pre-wrap">
                          {block.code}
                        </div>
                      );
                    }
                    if (block.type === 'blockquote') {
                      return (
                        <div key={idx} className="p-3 rounded-xl border-l-4 border-indigo-500 bg-indigo-950/20 text-slate-300 text-xs my-2">
                          {block.lines.map((l, lIdx) => (
                            <p key={lIdx}>{renderInlineMarkdown(l)}</p>
                          ))}
                        </div>
                      );
                    }
                    if (block.type === 'ul') {
                      return (
                        <ul key={idx} className="space-y-2 pl-4 list-disc list-outside text-slate-300 text-xs my-2">
                          {block.items.map((it, lIdx) => (
                            <li key={lIdx} className="leading-relaxed">
                              {renderInlineMarkdown(it)}
                            </li>
                          ))}
                        </ul>
                      );
                    }
                    if (block.type === 'ol') {
                      return (
                        <ol key={idx} className="space-y-2 pl-5 list-decimal list-outside text-slate-300 text-xs my-2">
                          {block.items.map((it, lIdx) => (
                            <li key={lIdx} className="leading-relaxed">
                              {renderInlineMarkdown(it)}
                            </li>
                          ))}
                        </ol>
                      );
                    }
                    return (
                      <p key={idx} className="text-slate-300 text-xs sm:text-sm leading-relaxed font-sans">
                        {renderInlineMarkdown(block.text)}
                      </p>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

        </div>
      ) : (
        /* ========================================================================= */
        /* POLISHED READER VIEW WITH STICKY CHAPTER INDEX                           */
        /* ========================================================================= */
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
                  {activeGuide.className} : {activeGuide.ascendancy}
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-xs font-bold">
                  PoE 3.30 Covens of Umbra
                </span>
                <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold">
                  SSF and GSF Verified
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-poppins">
                {activeGuide.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 pt-2 border-t border-slate-800">
                <div>Author: <strong className="text-slate-200">@{activeGuide.authorName}</strong></div>
                <div>Playstyle: <strong className="text-slate-200">{activeGuide.playstyle}</strong></div>
                <div>Rating: <strong className="text-emerald-400">{activeGuide.starterRating}/10</strong></div>
                <div>Status: <strong className="text-indigo-400">{activeGuide.createdAt}</strong></div>
              </div>
            </div>

            {/* Render Parsed Blocks */}
            <div className="space-y-6 text-slate-300">
              {blocks.map((block, bIdx) => {
                if (block.type === 'h1') {
                  return (
                    <h1 key={bIdx} id={block.id} className="text-2xl sm:text-3xl font-black text-white pt-8 pb-2 border-b border-slate-800 font-poppins scroll-mt-24">
                      {renderInlineMarkdown(block.text)}
                    </h1>
                  );
                }

                if (block.type === 'h2') {
                  return (
                    <h2 key={bIdx} id={block.id} className="text-xl sm:text-2xl font-bold text-amber-300 pt-6 pb-2 border-b border-slate-800/80 font-poppins scroll-mt-24">
                      {renderInlineMarkdown(block.text)}
                    </h2>
                  );
                }

                if (block.type === 'h3') {
                  return (
                    <h3 key={bIdx} id={block.id} className="text-base sm:text-lg font-bold text-indigo-300 pt-4 font-poppins scroll-mt-24">
                      {renderInlineMarkdown(block.text)}
                    </h3>
                  );
                }

                if (block.type === 'h4') {
                  return (
                    <h4 key={bIdx} id={block.id} className="text-sm sm:text-base font-semibold text-slate-200 pt-2 font-poppins scroll-mt-24">
                      {renderInlineMarkdown(block.text)}
                    </h4>
                  );
                }

                if (block.type === 'hr') {
                  return <hr key={bIdx} className="border-slate-800 my-8" />;
                }

                if (block.type === 'code') {
                  const isCopied = copiedRegex === `code-${bIdx}`;
                  return (
                    <div key={bIdx} className="my-4 rounded-xl border border-slate-800 bg-slate-950/90 overflow-hidden shadow-inner">
                      <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
                        <span>Vendor Search / Filter Regex</span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(block.code, `code-${bIdx}`)}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{isCopied ? 'Copied' : 'Copy String'}</span>
                        </button>
                      </div>
                      <pre className="p-4 font-mono text-xs sm:text-sm text-emerald-300 overflow-x-auto whitespace-pre-wrap select-all">
                        {block.code}
                      </pre>
                    </div>
                  );
                }

                if (block.type === 'blockquote') {
                  return (
                    <div key={bIdx} className="p-4 rounded-xl border-l-4 border-indigo-500 bg-indigo-950/20 text-slate-300 my-3 space-y-1">
                      {block.lines.map((line, lIdx) => (
                        <p key={lIdx} className="leading-relaxed">
                          {renderInlineMarkdown(line)}
                        </p>
                      ))}
                    </div>
                  );
                }

                if (block.type === 'ul') {
                  return (
                    <ul key={bIdx} className="space-y-2 pl-4 list-disc list-outside text-slate-300 my-3">
                      {block.items.map((item, lIdx) => (
                        <li key={lIdx} className="leading-relaxed">
                          {renderInlineMarkdown(item)}
                        </li>
                      ))}
                    </ul>
                  );
                }

                if (block.type === 'ol') {
                  return (
                    <ol key={bIdx} className="space-y-2 pl-5 list-decimal list-outside text-slate-300 my-3">
                      {block.items.map((item, lIdx) => (
                        <li key={lIdx} className="leading-relaxed">
                          {renderInlineMarkdown(item)}
                        </li>
                      ))}
                    </ol>
                  );
                }

                return (
                  <p key={bIdx} className="text-slate-300 leading-relaxed font-sans">
                    {renderInlineMarkdown(block.text)}
                  </p>
                );
              })}
            </div>

            {/* Bottom Navigation and Actions Bar */}
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
                  onClick={() => setIsEditing(true)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Guide</span>
                </button>

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
      )}

    </div>
  );
};
