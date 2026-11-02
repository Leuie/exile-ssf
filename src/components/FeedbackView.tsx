import React, { useState, useEffect, useId, useRef } from 'react';
import {
  MessageSquarePlus,
  Search,
  ThumbsUp,
  Plus,
  ShieldCheck,
  Send
} from 'lucide-react';
import { INITIAL_SITE_FEEDBACK } from '../data/privateLeagueData';
import type { SiteFeedbackItem, FeedbackCategory, UserAccount } from '../types';
import { fireConfetti } from '../utils/confetti';

interface FeedbackViewProps {
  userAccount?: UserAccount | null;
  onOpenAuthModal?: () => void;
}

export const FeedbackView: React.FC<FeedbackViewProps> = ({
  userAccount,
  onOpenAuthModal
}) => {
  void onOpenAuthModal;
  // Feedback items state synced to localStorage
  const [feedbackList, setFeedbackList] = useState<SiteFeedbackItem[]>(() => {
    try {
      const saved = localStorage.getItem('poe_site_feedback');
      return saved ? JSON.parse(saved) : INITIAL_SITE_FEEDBACK;
    } catch {
      return INITIAL_SITE_FEEDBACK;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('poe_site_feedback', JSON.stringify(feedbackList));
    } catch {}
  }, [feedbackList]);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Submit modal state
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const submitDialogRef = useRef<HTMLDialogElement>(null);
  const submitTitleId = useId();

  // Form state
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDesc, setNewDesc] = useState<string>('');
  const [newCategory, setNewCategory] = useState<FeedbackCategory>('feature_request');
  const [newGameContext, setNewGameContext] = useState<'poe1' | 'poe2' | 'both'>('both');
  const [authorName, setAuthorName] = useState<string>(userAccount?.displayName || 'Exile');

  // Upvoted IDs set
  const [upvotedIds, setUpvotedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('poe_feedback_upvotes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('poe_feedback_upvotes', JSON.stringify(upvotedIds));
    } catch {}
  }, [upvotedIds]);

  const handleOpenSubmit = () => {
    setShowSubmitModal(true);
    setTimeout(() => {
      submitDialogRef.current?.showModal();
    }, 10);
  };

  const handleUpvote = (id: string) => {
    const isUpvoted = upvotedIds.includes(id);
    if (!isUpvoted) {
      fireConfetti();
      setUpvotedIds([...upvotedIds, id]);
      setFeedbackList((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, upvotes: item.upvotes + 1 } : item
        )
      );
    } else {
      setUpvotedIds(upvotedIds.filter((itemId) => itemId !== id));
      setFeedbackList((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, upvotes: Math.max(0, item.upvotes - 1) } : item
        )
      );
    }
  };

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;

    const newItem: SiteFeedbackItem = {
      id: `fb-${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim(),
      category: newCategory,
      status: 'under_review',
      upvotes: 1,
      authorDisplayName: authorName.trim() || 'Anonymous Exile',
      authorPreferredContact: userAccount?.preferredContact || 'app',
      authorPoeAccount: userAccount?.poeAccountName,
      authorDiscord: userAccount?.discordName,
      createdAt: 'Just now',
      gameContext: newGameContext
    };

    setFeedbackList([newItem, ...feedbackList]);
    setUpvotedIds([...upvotedIds, newItem.id]);
    setNewTitle('');
    setNewDesc('');
    submitDialogRef.current?.close();
    setShowSubmitModal(false);
    fireConfetti();
  };

  // Filtered list
  const filteredList = feedbackList.filter((item) => {
    const s = searchQuery.toLowerCase();
    const matchSearch =
      !searchQuery ||
      item.title.toLowerCase().includes(s) ||
      item.description.toLowerCase().includes(s) ||
      item.authorDisplayName.toLowerCase().includes(s);

    const matchCat =
      selectedCategory === 'all' || item.category === selectedCategory;
    const matchStat =
      selectedStatus === 'all' || item.status === selectedStatus;

    return matchSearch && matchCat && matchStat;
  });

  return (
    <div className="w-full space-y-5 pb-20 font-sans text-slate-200">
      
      {/* Sleek Subdued Command Banner */}
      <div className="p-5 sm:p-6 rounded-2xl border border-slate-800 bg-slate-900/85 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
              Community Ideas & Roadmap
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-poppins font-bold text-white">
            Feedback, Needs & Improvements
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Have an idea to improve the SSF tools, need a new private league feature, or spotted an issue? Submit your suggestions below. Every submission is reviewed directly by our admins!
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenSubmit}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-white flex items-center gap-2 transition-colors cursor-pointer shadow-sm self-start md:self-auto flex-shrink-0"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>Submit Improvement or Need</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/70 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search feedback, ideas, or submitters..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-slate-700"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Select */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-slate-700"
          >
            <option value="all">All Categories</option>
            <option value="feature_request">Feature Request</option>
            <option value="website_improvement">Site Improvement</option>
            <option value="private_league_tool">Private League Tool</option>
            <option value="bug_report">Bug Report</option>
            <option value="build_guide_request">Build Guide Request</option>
          </select>

          {/* Status Select */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-slate-700"
          >
            <option value="all">All Statuses</option>
            <option value="under_review">Under Review</option>
            <option value="planned">Planned</option>
            <option value="in_progress">In Progress</option>
            <option value="implemented">Implemented</option>
          </select>
        </div>
      </div>

      {/* Feedback Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredList.map((item) => {
          const isUpvoted = upvotedIds.includes(item.id);

          return (
            <div
              key={item.id}
              className="p-4 rounded-xl border border-slate-800 bg-slate-900/75 hover:border-slate-700 transition-colors flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                {/* Meta Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {item.category.replace(/_/g, ' ')}
                    </span>
                    {item.gameContext && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                        {item.gameContext === 'both' ? 'PoE 1 & 2' : item.gameContext === 'poe1' ? 'PoE 1' : 'PoE 2'}
                      </span>
                    )}
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase tracking-wider ${
                      item.status === 'implemented'
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : item.status === 'in_progress'
                        ? 'bg-sky-500/10 text-sky-300 border-sky-500/30'
                        : item.status === 'planned'
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {item.status.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="font-poppins font-bold text-sm text-slate-100">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Admin Note / Response */}
                {item.adminResponse && (
                  <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/90 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 font-bold">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Admin Response ({item.adminResponderName || 'League Host'}):</span>
                    </div>
                    <p className="text-[11px] text-slate-300 italic">
                      "{item.adminResponse}"
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom Action Footer */}
              <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
                  <span>By @{item.authorDisplayName}</span>
                  <span>•</span>
                  <span>{item.createdAt}</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleUpvote(item.id)}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isUpvoted
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                  title="Upvote this feature request"
                >
                  <ThumbsUp className={`w-3 h-3 ${isUpvoted ? 'text-indigo-400 fill-indigo-400' : 'text-slate-400'}`} />
                  <span>{item.upvotes}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredList.length === 0 && (
        <div className="p-8 text-center rounded-xl border border-dashed border-slate-800 bg-slate-900/30 space-y-2 text-xs text-slate-400">
          <MessageSquarePlus className="w-8 h-8 text-slate-600 mx-auto" />
          <p>No suggestions matching your search criteria.</p>
        </div>
      )}

      {/* Submission Dialog */}
      <dialog
        ref={submitDialogRef}
        {...({ closedby: 'any' } as any)}
        aria-labelledby={submitTitleId}
        className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 text-slate-200 p-0 shadow-2xl backdrop:bg-black/75 m-auto overflow-hidden"
      >
        {showSubmitModal && (
          <form onSubmit={handleSubmitFeedback} className="flex flex-col">
            <div className="p-4 border-b border-slate-800 bg-slate-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquarePlus className="w-4 h-4 text-emerald-400" />
                <h2 id={submitTitleId} className="text-sm font-bold text-white">
                  Submit Website Improvement or Need
                </h2>
              </div>
              <button
                type="button"
                onClick={() => submitDialogRef.current?.close()}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Title / Feature Summary *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Add offline skill tree node search, or gold calculator..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Category *
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as FeedbackCategory)}
                    className="w-full px-2.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-slate-700"
                  >
                    <option value="feature_request">Feature Request</option>
                    <option value="website_improvement">Site Improvement</option>
                    <option value="private_league_tool">Private League Tool</option>
                    <option value="bug_report">Bug Report</option>
                    <option value="build_guide_request">Build Guide Request</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Game Target *
                  </label>
                  <select
                    value={newGameContext}
                    onChange={(e) => setNewGameContext(e.target.value as any)}
                    className="w-full px-2.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-slate-700"
                  >
                    <option value="both">Both PoE 1 & 2</option>
                    <option value="poe1">PoE 1 (3.30 Coven of Umbra)</option>
                    <option value="poe2">PoE 2 (0.5 Ancients)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Detailed Description / What Problem Does This Solve? *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe what you would like to see, why it helps exiles, or steps to reproduce if a bug..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Your Display / App Tag
                </label>
                <input
                  type="text"
                  placeholder="Leuie"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-slate-700"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => submitDialogRef.current?.close()}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Suggestion</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </dialog>
    </div>
  );
};
