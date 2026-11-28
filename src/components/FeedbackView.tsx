import React, { useState, useEffect, useMemo, useId, useRef } from 'react';
import {
  FileText,
  MessageSquarePlus,
  Search,
  ThumbsUp,
  Plus,
  ShieldCheck,
  Send,
  Clock,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Layers,
  X,
  Compass
} from 'lucide-react';
import { SITE_CHANGELOG, type ChangeTag } from '../data/siteChangelog';
import { PLANNED_ROADMAP_CATEGORIES, PLANNED_ROADMAP_ITEMS } from '../data/plannedRoadmap';
import type { SiteFeedbackItem, FeedbackCategory, UserAccount } from '../types';
import { fireConfetti } from '../utils/confetti';
import { fetchCloudFeedback, saveCloudFeedbackItem } from '../services/cloudSync';

interface FeedbackViewProps {
  userAccount?: UserAccount | null;
  onOpenAuthModal?: () => void;
}

const CHANGE_TAG_STYLE: Record<ChangeTag, string> = {
  Added: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
  Improved: 'bg-sky-500/15 text-sky-300 border-sky-500/40',
  Fixed: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
  Removed: 'bg-rose-500/15 text-rose-300 border-rose-500/40'
};

export const FeedbackView: React.FC<FeedbackViewProps> = ({
  userAccount,
  onOpenAuthModal
}) => {
  void onOpenAuthModal;

  const [mode, setMode] = useState<'updates' | 'feedback' | 'roadmap'>('updates');
  const [roadmapCategory, setRoadmapCategory] = useState<string>('ALL');
  const [selectedReleaseIdx, setSelectedReleaseIdx] = useState<number>(0);
  const [releaseSearch, setReleaseSearch] = useState<string>('');
  const [showAllReleases, setShowAllReleases] = useState<boolean>(false);
  const [releaseTierFilter, setReleaseTierFilter] = useState<'all' | 'major' | 'minor'>('all');

  // Real Community Feedback synced from Cloudflare D1 (zero fake seeded entries)
  const [feedbackList, setFeedbackList] = useState<SiteFeedbackItem[]>([]);
  const [loadingFeedback, setLoadingFeedback] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Submit modal state
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const submitDialogRef = useRef<HTMLDialogElement>(null);
  const submitTitleId = useId();
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDesc, setNewDesc] = useState<string>('');
  const [newCategory, setNewCategory] = useState<FeedbackCategory>('feature_request');
  const [newGameContext, setNewGameContext] = useState<'poe1' | 'poe2' | 'both'>('both');
  const [authorName, setAuthorName] = useState<string>(userAccount?.displayName || 'Exile');

  const [upvotedIds, setUpvotedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('poe_feedback_upvotes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    document.title = 'Changelog & Feedback | Exile SSF';
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoadingFeedback(true);
    fetchCloudFeedback().then((items) => {
      if (!cancelled) {
        setFeedbackList(Array.isArray(items) ? items : []);
        setLoadingFeedback(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('poe_feedback_upvotes', JSON.stringify(upvotedIds));
    } catch {}
  }, [upvotedIds]);

  const majorReleasesCount = useMemo(() => SITE_CHANGELOG.filter((r) => r.isMajor).length, []);
  const minorReleasesCount = useMemo(() => SITE_CHANGELOG.filter((r) => !r.isMajor).length, []);

  const displayedReleases = useMemo(() => {
    if (releaseTierFilter === 'major') return SITE_CHANGELOG.filter((r) => r.isMajor);
    if (releaseTierFilter === 'minor') return SITE_CHANGELOG.filter((r) => !r.isMajor);
    return SITE_CHANGELOG;
  }, [releaseTierFilter]);

  const activeRelease = displayedReleases[selectedReleaseIdx] || displayedReleases[0] || SITE_CHANGELOG[0];

  const handleSelectTierFilter = (tier: 'all' | 'major' | 'minor') => {
    setReleaseTierFilter(tier);
    setSelectedReleaseIdx(0);
  };

  const filteredReleaseChanges = useMemo(() => {
    const q = releaseSearch.trim().toLowerCase();
    if (!q) return activeRelease.changes;
    return activeRelease.changes.filter(
      (c) => c.text.toLowerCase().includes(q) || c.tag.toLowerCase().includes(q)
    );
  }, [activeRelease, releaseSearch]);

  const filteredFeedback = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return [...feedbackList]
      .filter((item) => {
        if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
        if (selectedStatus !== 'all' && item.status !== selectedStatus) return false;
        if (!q) return true;
        return (
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          (item.authorDisplayName || '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
  }, [feedbackList, searchQuery, selectedCategory, selectedStatus]);

  const handleOpenSubmit = () => {
    if (userAccount?.displayName) setAuthorName(userAccount.displayName);
    setShowSubmitModal(true);
    setTimeout(() => submitDialogRef.current?.showModal(), 10);
  };

  const handleCloseSubmit = () => {
    submitDialogRef.current?.close();
    setShowSubmitModal(false);
  };

  const handleUpvote = (id: string) => {
    const isUpvoted = upvotedIds.includes(id);
    const target = feedbackList.find((item) => item.id === id);
    if (!target) return;
    const updatedItem: SiteFeedbackItem = {
      ...target,
      upvotes: isUpvoted ? Math.max(0, (target.upvotes || 0) - 1) : (target.upvotes || 0) + 1
    };
    setFeedbackList((prev) => prev.map((it) => (it.id === id ? updatedItem : it)));
    setUpvotedIds((prev) => (isUpvoted ? prev.filter((x) => x !== id) : [...prev, id]));
    saveCloudFeedbackItem(updatedItem);
  };

  const handleCreateFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;
    const item: SiteFeedbackItem = {
      id: `fb-${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim(),
      category: newCategory,
      status: 'under_review',
      upvotes: 0,
      authorDisplayName: (userAccount?.displayName || authorName || 'Exile').trim(),
      authorPreferredContact: userAccount?.preferredContact || 'app',
      authorPoeAccount: userAccount?.poeAccountName,
      createdAt: new Date().toISOString().slice(0, 10),
      gameContext: newGameContext
    };
    setFeedbackList((prev) => [item, ...prev]);
    await saveCloudFeedbackItem(item);
    fireConfetti();
    setNewTitle('');
    setNewDesc('');
    handleCloseSubmit();
    setMode('feedback');
  };

  const statusBadge = (status: SiteFeedbackItem['status']) => {
    if (status === 'implemented') return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40';
    if (status === 'in_progress') return 'bg-sky-500/15 text-sky-300 border-sky-500/40';
    if (status === 'planned') return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40';
    return 'bg-amber-500/15 text-amber-300 border-amber-500/40';
  };

  return (
    <div className="w-full space-y-5 pb-16 font-sans text-slate-200">
      {/* Full Width Header Bar (Matches Official Patch Notes Style) */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-[#0e1320] via-indigo-950/30 to-[#0e1320] p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-lg">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black font-cinzel text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-400" />
              <span>Changelog &amp; Feedback</span>
            </h1>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border bg-emerald-500/15 border-emerald-500/40 text-emerald-300">
              {SITE_CHANGELOG[0]?.version} Live
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Timestamped Exile SSF site patch notes documenting every new feature, upgrade, fix, and removal alongside community requests and bug reports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Primary Mode Switcher (Matches Patch Notes Game Switcher) */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-indigo-500/25 text-xs font-bold">
            <button
              type="button"
              onClick={() => setMode('updates')}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                mode === 'updates'
                  ? 'bg-indigo-600/30 text-white border border-indigo-400/60 shadow-sm'
                  : 'text-slate-400 border border-transparent hover:text-white'
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 ${mode === 'updates' ? 'text-amber-300' : 'text-slate-500'}`} />
              <span>Changelog ({SITE_CHANGELOG.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('feedback')}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                mode === 'feedback'
                  ? 'bg-indigo-600/30 text-white border border-indigo-400/60 shadow-sm'
                  : 'text-slate-400 border border-transparent hover:text-white'
              }`}
            >
              <MessageSquarePlus className={`w-3.5 h-3.5 ${mode === 'feedback' ? 'text-emerald-300' : 'text-slate-500'}`} />
              <span>Community Feedback ({feedbackList.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('roadmap')}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                mode === 'roadmap'
                  ? 'bg-indigo-600/30 text-white border border-indigo-400/60 shadow-sm'
                  : 'text-slate-400 border border-transparent hover:text-white'
              }`}
            >
              <Compass className={`w-3.5 h-3.5 ${mode === 'roadmap' ? 'text-purple-300' : 'text-slate-500'}`} />
              <span>
                Roadmap ({PLANNED_ROADMAP_ITEMS.filter((i) => i.status === 'shipped').length} Shipped •{' '}
                {PLANNED_ROADMAP_ITEMS.filter((i) => i.status !== 'shipped').length} Planned)
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleOpenSubmit}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Submit Request</span>
          </button>
        </div>
      </div>

      {/* MODE 1: SITE UPDATES (PATCH NOTES READER LAYOUT) */}
      {mode === 'updates' && (
        <>
          {/* Release Tier Filter: All vs Major Milestones vs Patches */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => handleSelectTierFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  releaseTierFilter === 'all'
                    ? 'bg-indigo-600/30 text-white border border-indigo-400/50 shadow-sm'
                    : 'text-slate-400 hover:text-white border border-transparent'
                }`}
              >
                All Releases ({SITE_CHANGELOG.length})
              </button>
              <button
                type="button"
                onClick={() => handleSelectTierFilter('major')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  releaseTierFilter === 'major'
                    ? 'bg-amber-500/20 text-amber-200 border border-amber-400/50 shadow-sm shadow-amber-950/20'
                    : 'text-slate-400 hover:text-amber-200 border border-transparent'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Major Milestones ({majorReleasesCount})</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectTierFilter('minor')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  releaseTierFilter === 'minor'
                    ? 'bg-sky-500/20 text-sky-200 border border-sky-400/50 shadow-sm'
                    : 'text-slate-400 hover:text-sky-200 border border-transparent'
                }`}
              >
                Patches &amp; QoL ({minorReleasesCount})
              </button>
            </div>

            <div className="text-[11px] font-mono text-slate-400 hidden sm:block">
              Showing {displayedReleases.length} {releaseTierFilter === 'major' ? 'Major Milestones' : releaseTierFilter === 'minor' ? 'Patches' : 'Total Releases'}
            </div>
          </div>

          {/* Release Selector Bar + Prev / Next Stepper */}
          <div className="rounded-2xl border border-indigo-500/25 bg-gradient-to-r from-[#0d121d] via-[#101726] to-[#0d121d] p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <Layers className="w-4 h-4 text-amber-400 shrink-0" />
              <select
                value={selectedReleaseIdx}
                onChange={(e) => {
                  setSelectedReleaseIdx(Number(e.target.value));
                  setShowAllReleases(false);
                }}
                className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-slate-900 border border-indigo-400/40 text-xs sm:text-sm font-bold text-white focus:outline-none cursor-pointer"
              >
                {displayedReleases.map((rel, idx) => (
                  <option key={rel.id} value={idx} className="bg-slate-950 text-slate-100">
                    {rel.isMajor ? '⭐ [MAJOR] ' : '▫️ '} {rel.version} ({rel.dateEst.split(' • ')[0]}) : {rel.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowAllReleases((v) => !v)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold cursor-pointer ${
                  showAllReleases
                    ? 'bg-amber-500/20 border-amber-400/50 text-amber-200'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                {showAllReleases ? 'Single Release View' : 'Show Full Timeline'}
              </button>

              <span className="text-[11px] font-mono text-slate-400 px-1">
                {displayedReleases.length > 0 ? selectedReleaseIdx + 1 : 0} of {displayedReleases.length}
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={selectedReleaseIdx <= 0}
                  onClick={() => setSelectedReleaseIdx((i) => Math.max(0, i - 1))}
                  title="Newer update"
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-600 text-slate-200 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={selectedReleaseIdx >= displayedReleases.length - 1}
                  onClick={() => setSelectedReleaseIdx((i) => Math.min(displayedReleases.length - 1, i + 1))}
                  title="Older update"
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-600 text-slate-200 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Active Release(s) Reader */}
          {(showAllReleases ? displayedReleases : [activeRelease]).map((rel) => {
            const items = showAllReleases
              ? rel.changes
              : filteredReleaseChanges;
            return (
              <div
                key={rel.id}
                className={`w-full rounded-2xl border transition-all overflow-hidden ${
                  rel.isMajor
                    ? 'border-amber-500/40 bg-gradient-to-b from-[#131826] via-[#0d1016] to-[#0d1016] shadow-xl shadow-amber-950/15'
                    : 'border-slate-800 bg-[#0d1016] shadow-xl'
                }`}
              >
                <div className={`px-5 py-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                  rel.isMajor ? 'bg-gradient-to-r from-amber-500/10 via-slate-900/90 to-purple-500/10 border-amber-500/30' : 'bg-slate-900/90 border-slate-800'
                }`}>
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                        rel.isMajor
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {rel.version}
                      </span>
                      {rel.isMajor ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/25 to-purple-500/25 border border-amber-500/50 text-amber-300 font-mono text-[10px] font-bold tracking-wide shadow-sm">
                          <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>MAJOR MILESTONE</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-950 border border-slate-700/80 text-sky-300 font-mono text-[10px] font-bold">
                          <span>{rel.badge || 'PATCH / QOL'}</span>
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-950 border border-slate-700/80 text-[11px] font-mono text-slate-300">
                        <Clock className="w-3 h-3 text-sky-400 shrink-0" />
                        <span>Posted: {rel.dateEst}</span>
                      </span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                      {rel.isMajor && <Sparkles className="w-4 h-4 text-amber-400 shrink-0 inline" />}
                      <span>{rel.title}</span>
                    </h2>
                    <p className="text-xs text-slate-300 leading-relaxed">{rel.summary}</p>
                  </div>

                  {!showAllReleases && (
                    <div className="relative shrink-0">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                      <input
                        type="text"
                        value={releaseSearch}
                        onChange={(e) => setReleaseSearch(e.target.value)}
                        placeholder="Search inside update..."
                        className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-56"
                      />
                    </div>
                  )}
                </div>

                <div className="p-6 sm:p-7 space-y-3 leading-relaxed">
                  {items.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No changelog lines matched "{releaseSearch}".
                    </div>
                  ) : (
                    items.map((change, idx) => (
                      <div key={idx} className="flex items-start gap-3 text-sm text-slate-200">
                        <span
                          className={`mt-0.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase border shrink-0 w-20 text-center ${CHANGE_TAG_STYLE[change.tag]}`}
                        >
                          {change.tag}
                        </span>
                        <span className="leading-relaxed">{change.text}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* MODE 2: COMMUNITY FEEDBACK & REQUESTS */}
      {mode === 'feedback' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search community requests, bug reports, or ideas..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-400"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="feature_request">Feature Request</option>
                <option value="website_improvement">Site Improvement</option>
                <option value="private_league_tool">Private League Tool</option>
                <option value="bug_report">Bug Report</option>
                <option value="build_guide_request">Build Guide Request</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="under_review">Under Review</option>
                <option value="planned">Planned</option>
                <option value="in_progress">In Progress</option>
                <option value="implemented">Implemented</option>
              </select>
            </div>
          </div>

          {loadingFeedback ? (
            <div className="py-12 text-center text-xs font-mono text-slate-400">
              Loading community feedback from cloud...
            </div>
          ) : filteredFeedback.length === 0 ? (
            <div className="p-10 rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 text-center space-y-3">
              <p className="text-sm font-bold text-slate-200">No community feedback posts yet.</p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Have a feature idea, crafting tool request, or bug report? Submit the first post so the community can upvote it.
              </p>
              <button
                type="button"
                onClick={handleOpenSubmit}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Submit First Request</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFeedback.map((item) => {
                const isUpvoted = upvotedIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className="p-4 sm:p-5 rounded-2xl border border-slate-800 bg-[#0d1016] flex flex-col sm:flex-row items-start justify-between gap-4 shadow"
                  >
                    <div className="space-y-2 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase">
                        <span className={`px-2 py-0.5 rounded border font-bold ${statusBadge(item.status)}`}>
                          {item.status.replace('_', ' ')}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                          {item.category.replace(/_/g, ' ')}
                        </span>
                        <span className="text-slate-500">
                          By @{item.authorDisplayName} • {item.createdAt}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white">{item.title}</h3>
                      <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>
                      {item.adminResponse && (
                        <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-xs text-indigo-200 flex items-start gap-2">
                          <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-white">@{item.adminResponderName || 'Host'}: </strong>
                            <span>{item.adminResponse}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleUpvote(item.id)}
                      className={`px-3 py-2 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors ${
                        isUpvoted
                          ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-200'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{item.upvotes || 0}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODE 3: UPCOMING ROADMAP & COMPLETED MILESTONES */}
      {mode === 'roadmap' && (() => {
        const plannedItems = PLANNED_ROADMAP_ITEMS.filter((i) => i.status !== 'shipped');
        const shippedItems = PLANNED_ROADMAP_ITEMS.filter((i) => i.status === 'shipped');
        const categoryShortLabels: Record<string, string> = {
          'Armory Cross Site Integrations': 'Armory & Sync',
          'Deeper Character & Build Tools': 'Builds & Gear',
          'Private League & GSF Social Features': 'Private League',
          'Next Level Client.txt & Farming Analytics': 'Mapping & Logs',
          'Platform Growth & Polish': 'Platform'
        };

        return (
        <div className="space-y-5">
          <div className="rounded-2xl border border-indigo-500/30 bg-[#0d111a] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
            <div>
              <div className="text-sm font-bold text-indigo-200 flex items-center gap-2">
                <Compass className="w-4 h-4 text-indigo-400" />
                <span>
                  Site Roadmap ({plannedItems.length} Planned • {shippedItems.length} Shipped)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Upcoming features are listed first, followed by completed milestones already live on Exile SSF.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 text-[11px] font-mono">
              <button
                type="button"
                onClick={() => setRoadmapCategory('ALL')}
                className={`px-2.5 py-1 rounded-lg border cursor-pointer ${
                  roadmapCategory === 'ALL'
                    ? 'bg-indigo-600/30 border-indigo-400 text-white font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                All ({PLANNED_ROADMAP_ITEMS.length})
              </button>
              {PLANNED_ROADMAP_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setRoadmapCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg border cursor-pointer ${
                    roadmapCategory === cat
                      ? 'bg-indigo-600/30 border-indigo-400 text-white font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {categoryShortLabels[cat] || cat}
                </button>
              ))}
            </div>
          </div>

          {/* UPCOMING / PLANNED NEXT — ALWAYS AT THE TOP */}
          {roadmapCategory === 'ALL' && plannedItems.length > 0 && (
            <section className="rounded-2xl border border-indigo-500/40 bg-indigo-950/15 p-4 sm:p-5 space-y-3 shadow-lg">
              <div className="flex items-center justify-between border-b border-indigo-500/25 pb-2">
                <h2 className="text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-indigo-200">
                  Upcoming — Planned Next ({plannedItems.length})
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-200">
                  In Planning
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {plannedItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl border border-indigo-500/30 bg-slate-950/85 hover:border-indigo-400/60 transition-colors flex flex-col justify-between gap-2.5"
                  >
                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-bold text-xs sm:text-sm leading-snug text-white">
                          {item.title}
                        </div>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-sky-300 shrink-0">
                          {item.scope}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/70">
                      <span className="text-[10px] font-mono text-amber-300">Status: Planned</span>
                      <button
                        type="button"
                        onClick={() => {
                          setNewTitle(item.title);
                          setNewDesc(item.description);
                          setNewCategory('feature_request');
                          handleOpenSubmit();
                        }}
                        className="text-[10px] font-mono px-2 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/35 border border-indigo-500/40 text-indigo-200 cursor-pointer"
                      >
                        + Request / Upvote
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* COMPLETED & SHIPPED MILESTONES */}
          <div className="space-y-5">
            {PLANNED_ROADMAP_CATEGORIES.filter(
              (cat) => roadmapCategory === 'ALL' || roadmapCategory === cat
            ).map((cat) => {
              const allCatItems = PLANNED_ROADMAP_ITEMS.filter((i) => i.category === cat);
              const visibleItems =
                roadmapCategory === 'ALL'
                  ? allCatItems.filter((i) => i.status === 'shipped')
                  : allCatItems;
              if (visibleItems.length === 0) return null;
              const shippedCount = visibleItems.filter((i) => i.status === 'shipped').length;
              const plannedCount = visibleItems.length - shippedCount;
              return (
                <section
                  key={cat}
                  className="rounded-2xl border border-slate-800 bg-[#0d111a] p-4 sm:p-5 space-y-3 shadow-lg"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h2 className="text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-emerald-300">
                      {cat} ({visibleItems.length})
                    </h2>
                    {plannedCount === 0 ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300">
                        ✓ All Shipped ({shippedCount}/{visibleItems.length})
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300">
                        {shippedCount} Shipped • {plannedCount} Planned
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {visibleItems.map((item) => {
                      const isShipped = item.status === 'shipped';
                      return (
                      <div
                        key={item.id}
                        className={`p-3.5 rounded-xl border transition-colors flex flex-col justify-between gap-2.5 ${
                          isShipped
                            ? 'border-emerald-500/35 bg-emerald-950/15'
                            : 'border-indigo-500/35 bg-slate-950/80 hover:border-indigo-400/50'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className={`font-bold text-xs sm:text-sm leading-snug ${isShipped ? 'text-emerald-200' : 'text-white'}`}>
                              {isShipped ? '✓ ' : ''}{item.title}
                            </div>
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-sky-300 shrink-0">
                              {item.scope}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/70">
                          {isShipped ? (
                            <span className="text-[10px] font-mono font-bold text-emerald-300">
                              ✓ {item.shippedNote || 'Shipped'}
                            </span>
                          ) : (
                            <>
                              <span className="text-[10px] font-mono text-amber-300">Status: Planned</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setNewTitle(item.title);
                                  setNewDesc(item.description);
                                  setNewCategory('feature_request');
                                  handleOpenSubmit();
                                }}
                                className="text-[10px] font-mono px-2 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/35 border border-indigo-500/40 text-indigo-200 cursor-pointer"
                              >
                                + Request / Upvote
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
        );
      })()}

      {showSubmitModal && (
        <dialog
          ref={submitDialogRef}
          aria-labelledby={submitTitleId}
          className="backdrop:bg-slate-950/80 bg-transparent p-4 max-w-lg w-full m-auto"
          onClose={() => setShowSubmitModal(false)}
        >
          <form
            onSubmit={handleCreateFeedback}
            className="rounded-2xl border border-indigo-500/40 bg-[#0d111a] p-5 space-y-4 text-slate-200 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 id={submitTitleId} className="text-base font-bold font-cinzel text-white flex items-center gap-2">
                <MessageSquarePlus className="w-4 h-4 text-indigo-400" />
                <span>Submit Feature Request or Bug Report</span>
              </h2>
              <button type="button" onClick={handleCloseSubmit} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-mono text-[10px] uppercase mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Short, clear title for your request or bug"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-400 font-mono text-[10px] uppercase mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as FeedbackCategory)}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="feature_request">Feature Request</option>
                    <option value="website_improvement">Site Improvement</option>
                    <option value="private_league_tool">Private League Tool</option>
                    <option value="bug_report">Bug Report</option>
                    <option value="build_guide_request">Build Guide Request</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-mono text-[10px] uppercase mb-1">Game</label>
                  <select
                    value={newGameContext}
                    onChange={(e) => setNewGameContext(e.target.value as any)}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="both">Both PoE 1 &amp; PoE 2</option>
                    <option value="poe1">Path of Exile 1</option>
                    <option value="poe2">Path of Exile 2</option>
                  </select>
                </div>
              </div>

              {!userAccount && (
                <div>
                  <label className="block text-slate-400 font-mono text-[10px] uppercase mb-1">Your Display Name</label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-400 font-mono text-[10px] uppercase mb-1">Details *</label>
                <textarea
                  rows={4}
                  required
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Describe the feature, improvement, or reproduction steps..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleCloseSubmit}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Post Request</span>
              </button>
            </div>
          </form>
        </dialog>
      )}
    </div>
  );
};
