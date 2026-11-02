import React, { useState, useEffect, useId, useRef } from 'react';
import { 
  Trash2, 
  Edit2, 
  RotateCcw, 
  CheckCircle2, 
  BookOpen, 
  HelpCircle, 
  History, 
  Link as LinkIcon
} from 'lucide-react';

export type ManagerSectionType = 'links' | 'faq' | 'archives';

interface LeagueContentManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSection?: ManagerSectionType;
  quickLinks: any[];
  onSaveQuickLinks: (links: any[]) => void;
  faqList: any[];
  onSaveFaqList: (faqs: any[]) => void;
  archivesList: any[];
  onSaveArchivesList: (archives: any[]) => void;
  onResetSection: (section: ManagerSectionType) => void;
}

export const LeagueContentManagerModal: React.FC<LeagueContentManagerModalProps> = ({
  isOpen,
  onClose,
  initialSection = 'links',
  quickLinks,
  onSaveQuickLinks,
  faqList,
  onSaveFaqList,
  archivesList,
  onSaveArchivesList,
  onResetSection
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const modalTitleId = useId();

  const [activeSection, setActiveSection] = useState<ManagerSectionType>(initialSection);

  useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [isOpen]);

  // Form states for Quick Links
  const [editingLinkIndex, setEditingLinkIndex] = useState<number | null>(null);
  const [linkForm, setLinkForm] = useState({
    label: '',
    category: 'Official',
    url: '',
    description: ''
  });

  // Form states for FAQs
  const [editingFaqIndex, setEditingFaqIndex] = useState<number | null>(null);
  const [faqForm, setFaqForm] = useState({
    q: '',
    a: ''
  });

  // Form states for Archives
  const [editingArchiveIndex, setEditingArchiveIndex] = useState<number | null>(null);
  const [archiveForm, setArchiveForm] = useState({
    name: '',
    expansion: '',
    version: '3.30',
    url: '',
    participants: 25,
    duration: '30 Days',
    highlight: ''
  });

  // Handle Quick Links Save
  const handleSaveLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkForm.label.trim() || !linkForm.url.trim()) return;

    const updated = [...quickLinks];
    const newEntry = {
      label: linkForm.label.trim(),
      category: linkForm.category.trim() || 'General',
      url: linkForm.url.trim(),
      description: linkForm.description.trim()
    };

    if (editingLinkIndex !== null) {
      updated[editingLinkIndex] = newEntry;
    } else {
      updated.push(newEntry);
    }

    onSaveQuickLinks(updated);
    setEditingLinkIndex(null);
    setLinkForm({ label: '', category: 'Official', url: '', description: '' });
  };

  const handleDeleteLink = (index: number) => {
    const updated = quickLinks.filter((_, idx) => idx !== index);
    onSaveQuickLinks(updated);
    if (editingLinkIndex === index) {
      setEditingLinkIndex(null);
      setLinkForm({ label: '', category: 'Official', url: '', description: '' });
    }
  };

  // Handle FAQ Save
  const handleSaveFaq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!faqForm.q.trim() || !faqForm.a.trim()) return;

    const updated = [...faqList];
    const newEntry = {
      q: faqForm.q.trim(),
      a: faqForm.a.trim()
    };

    if (editingFaqIndex !== null) {
      updated[editingFaqIndex] = newEntry;
    } else {
      updated.push(newEntry);
    }

    onSaveFaqList(updated);
    setEditingFaqIndex(null);
    setFaqForm({ q: '', a: '' });
  };

  const handleDeleteFaq = (index: number) => {
    const updated = faqList.filter((_, idx) => idx !== index);
    onSaveFaqList(updated);
    if (editingFaqIndex === index) {
      setEditingFaqIndex(null);
      setFaqForm({ q: '', a: '' });
    }
  };

  // Handle Archive Save
  const handleSaveArchive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!archiveForm.name.trim()) return;

    const updated = [...archivesList];
    const newEntry = {
      id: editingArchiveIndex !== null ? archivesList[editingArchiveIndex].id : `arch-${Date.now()}`,
      name: archiveForm.name.trim(),
      expansion: archiveForm.expansion.trim() || 'Expansion League',
      version: archiveForm.version.trim() || '3.30',
      url: archiveForm.url.trim() || 'https://www.pathofexile.com/',
      participants: Number(archiveForm.participants) || 20,
      duration: archiveForm.duration.trim() || '30 Days',
      highlight: archiveForm.highlight.trim() || 'Community Group Self Found Season'
    };

    if (editingArchiveIndex !== null) {
      updated[editingArchiveIndex] = newEntry;
    } else {
      updated.push(newEntry);
    }

    onSaveArchivesList(updated);
    setEditingArchiveIndex(null);
    setArchiveForm({
      name: '',
      expansion: '',
      version: '3.30',
      url: '',
      participants: 25,
      duration: '30 Days',
      highlight: ''
    });
  };

  const handleDeleteArchive = (index: number) => {
    const updated = archivesList.filter((_, idx) => idx !== index);
    onSaveArchivesList(updated);
    if (editingArchiveIndex === index) {
      setEditingArchiveIndex(null);
      setArchiveForm({
        name: '',
        expansion: '',
        version: '3.30',
        url: '',
        participants: 25,
        duration: '30 Days',
        highlight: ''
      });
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={modalTitleId}
      className="w-full max-w-3xl rounded-2xl border border-slate-700 bg-slate-900 text-slate-200 p-0 shadow-2xl backdrop:bg-black/80 m-auto overflow-hidden"
    >
      <div className="flex flex-col max-h-[88vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <h3 id={modalTitleId} className="text-sm font-bold text-white">
              Manage League Information & Custom Fields
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xs font-mono px-2 py-1 rounded bg-slate-800 cursor-pointer"
          >
            ✕ Close
          </button>
        </div>

        {/* Section Tabs */}
        <div className="px-5 pt-3 border-b border-slate-800 bg-slate-950/40 flex items-center gap-2">
          {[
            { id: 'links', label: 'Official 3.30 Resources & Links', icon: LinkIcon, count: quickLinks.length },
            { id: 'faq', label: 'F.A.Q. & League Guidelines', icon: HelpCircle, count: faqList.length },
            { id: 'archives', label: 'NOIR Private League Archives', icon: History, count: archivesList.length }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSection(tab.id as ManagerSectionType)}
                className={`pb-2.5 pt-1 px-3 border-b-2 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isActive
                    ? 'border-indigo-500 text-white font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-6">
          
          {/* SECTION 1: QUICK LINKS */}
          {activeSection === 'links' && (
            <div className="space-y-5">
              {/* Add / Edit Form */}
              <form onSubmit={handleSaveLink} className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
                <div className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider flex items-center justify-between">
                  <span>{editingLinkIndex !== null ? 'Edit Resource Link' : 'Add New Resource Link'}</span>
                  {editingLinkIndex !== null && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingLinkIndex(null);
                        setLinkForm({ label: '', category: 'Official', url: '', description: '' });
                      }}
                      className="text-[11px] text-slate-400 hover:text-slate-200 underline font-normal"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] font-mono text-slate-300">Link Title / Label</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 3.30 Loot Filter Guide"
                      value={linkForm.label}
                      onChange={(e) => setLinkForm({ ...linkForm, label: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-slate-300">Category Tag</label>
                    <input
                      type="text"
                      placeholder="e.g. Community, Gems, Patch"
                      value={linkForm.category}
                      onChange={(e) => setLinkForm({ ...linkForm, category: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-slate-300">Destination URL</label>
                  <input
                    type="url"
                    required
                    placeholder="https://..."
                    value={linkForm.url}
                    onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-slate-300">Description / Subtitle</label>
                  <input
                    type="text"
                    placeholder="Brief explanation of what this link contains"
                    value={linkForm.description}
                    onChange={(e) => setLinkForm({ ...linkForm, description: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{editingLinkIndex !== null ? 'Save Changes' : 'Add Link'}</span>
                  </button>
                </div>
              </form>

              {/* Existing Links List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Current Links ({quickLinks.length})</span>
                  <button
                    type="button"
                    onClick={() => onResetSection('links')}
                    className="text-amber-400 hover:text-amber-300 flex items-center gap-1 text-[11px] cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset to 3.30 Defaults
                  </button>
                </div>

                <div className="space-y-2">
                  {quickLinks.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-slate-800 bg-slate-900/60 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white truncate">{item.label}</span>
                          <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] font-mono text-slate-400">
                            {item.category}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-indigo-400 truncate">{item.url}</div>
                        {item.description && (
                          <div className="text-[11px] text-slate-400 truncate">{item.description}</div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingLinkIndex(idx);
                            setLinkForm({
                              label: item.label,
                              category: item.category || 'Official',
                              url: item.url,
                              description: item.description || ''
                            });
                          }}
                          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                          title="Edit link"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteLink(idx)}
                          className="p-1.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                          title="Delete link"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: FAQ & GUIDELINES */}
          {activeSection === 'faq' && (
            <div className="space-y-5">
              {/* Add / Edit Form */}
              <form onSubmit={handleSaveFaq} className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
                <div className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider flex items-center justify-between">
                  <span>{editingFaqIndex !== null ? 'Edit FAQ Item' : 'Add New FAQ Question'}</span>
                  {editingFaqIndex !== null && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingFaqIndex(null);
                        setFaqForm({ q: '', a: '' });
                      }}
                      className="text-[11px] text-slate-400 hover:text-slate-200 underline font-normal"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-slate-300">Question Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. How does guild stash sharing operate?"
                    value={faqForm.q}
                    onChange={(e) => setFaqForm({ ...faqForm, q: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-slate-300">Answer / Explanation</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Detailed explanation and guidelines..."
                    value={faqForm.a}
                    onChange={(e) => setFaqForm({ ...faqForm, a: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{editingFaqIndex !== null ? 'Save Changes' : 'Add FAQ'}</span>
                  </button>
                </div>
              </form>

              {/* FAQ List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Current FAQ Questions ({faqList.length})</span>
                  <button
                    type="button"
                    onClick={() => onResetSection('faq')}
                    className="text-amber-400 hover:text-amber-300 flex items-center gap-1 text-[11px] cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset to 3.30 Defaults
                  </button>
                </div>

                <div className="space-y-2">
                  {faqList.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-slate-800 bg-slate-900/60 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="font-semibold text-white">{item.q}</div>
                        <div className="text-[11px] text-slate-400 leading-relaxed whitespace-pre-line">
                          {item.a}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0 pt-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingFaqIndex(idx);
                            setFaqForm({ q: item.q, a: item.a });
                          }}
                          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                          title="Edit question"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteFaq(idx)}
                          className="p-1.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                          title="Delete question"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: ARCHIVES */}
          {activeSection === 'archives' && (
            <div className="space-y-5">
              {/* Add / Edit Form */}
              <form onSubmit={handleSaveArchive} className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
                <div className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider flex items-center justify-between">
                  <span>{editingArchiveIndex !== null ? 'Edit Archive Entry' : 'Add New League Archive'}</span>
                  {editingArchiveIndex !== null && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingArchiveIndex(null);
                        setArchiveForm({
                          name: '',
                          expansion: '',
                          version: '3.30',
                          url: '',
                          participants: 25,
                          duration: '30 Days',
                          highlight: ''
                        });
                      }}
                      className="text-[11px] text-slate-400 hover:text-slate-200 underline font-normal"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] font-mono text-slate-300">League Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Small Group Allflame SSF"
                      value={archiveForm.name}
                      onChange={(e) => setArchiveForm({ ...archiveForm, name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-slate-300">Version / Patch</label>
                    <input
                      type="text"
                      placeholder="e.g. 3.29"
                      value={archiveForm.version}
                      onChange={(e) => setArchiveForm({ ...archiveForm, version: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-slate-300">Base Expansion</label>
                    <input
                      type="text"
                      placeholder="e.g. Necropolis"
                      value={archiveForm.expansion}
                      onChange={(e) => setArchiveForm({ ...archiveForm, expansion: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-slate-300">Participants</label>
                    <input
                      type="number"
                      placeholder="24"
                      value={archiveForm.participants}
                      onChange={(e) => setArchiveForm({ ...archiveForm, participants: parseInt(e.target.value, 10) || 0 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-slate-300">Duration</label>
                    <input
                      type="text"
                      placeholder="30 Days"
                      value={archiveForm.duration}
                      onChange={(e) => setArchiveForm({ ...archiveForm, duration: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-slate-300">PoE League Archive URL</label>
                  <input
                    type="url"
                    placeholder="https://www.pathofexile.com/private-leagues/league/..."
                    value={archiveForm.url}
                    onChange={(e) => setArchiveForm({ ...archiveForm, url: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-slate-300">Season Highlight / Memory</label>
                  <input
                    type="text"
                    placeholder="Key builds, voidstones, unique finds"
                    value={archiveForm.highlight}
                    onChange={(e) => setArchiveForm({ ...archiveForm, highlight: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{editingArchiveIndex !== null ? 'Save Changes' : 'Add Archive'}</span>
                  </button>
                </div>
              </form>

              {/* Archive List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Archived Leagues ({archivesList.length})</span>
                  <button
                    type="button"
                    onClick={() => onResetSection('archives')}
                    className="text-amber-400 hover:text-amber-300 flex items-center gap-1 text-[11px] cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset to 3.30 Defaults
                  </button>
                </div>

                <div className="space-y-2">
                  {archivesList.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-3 rounded-lg border border-slate-800 bg-slate-900/60 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white truncate">{item.name}</span>
                          <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] font-mono text-slate-400">
                            {item.version}
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-indigo-950/80 text-[10px] font-mono text-indigo-300">
                            {item.participants} Exiles
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">{item.highlight}</div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingArchiveIndex(idx);
                            setArchiveForm({
                              name: item.name,
                              expansion: item.expansion,
                              version: item.version,
                              url: item.url,
                              participants: item.participants,
                              duration: item.duration,
                              highlight: item.highlight
                            });
                          }}
                          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                          title="Edit archive"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteArchive(idx)}
                          className="p-1.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                          title="Delete archive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </dialog>
  );
};
