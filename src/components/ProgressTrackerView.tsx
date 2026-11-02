import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Sparkles, 
  Calendar, 
  Plus, 
  Trash2, 
  Check, 
  RotateCcw, 
  Crown, 
  Zap
} from 'lucide-react';
import { INITIAL_TRACKER_ITEMS } from '../data/trackerData';
import type { TrackerItem } from '../types';
import { fireConfetti, fireMajorCelebration } from '../utils/confetti';

export const ProgressTrackerView: React.FC = () => {
  const [items, setItems] = useState<TrackerItem[]>(() => {
    try {
      const saved = localStorage.getItem('poe_ssf_tracker_items');
      return saved ? JSON.parse(saved) : INITIAL_TRACKER_ITEMS;
    } catch {
      return INITIAL_TRACKER_ITEMS;
    }
  });

  const [activeCategory, setActiveCategory] = useState<'all' | 'daily' | 'weekly' | 'macro'>('all');
  const [activeWeeklyTier, setActiveWeeklyTier] = useState<'all' | 'Week 1' | 'Week 2' | 'Week 3'>('all');

  // Custom task form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'daily' | 'weekly' | 'macro_atlas'>('daily');
  const [newDescription, setNewDescription] = useState('');
  const [newReward, setNewReward] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem('poe_ssf_tracker_items', JSON.stringify(items));
    } catch {
      // storage error
    }
  }, [items]);

  const toggleItem = (id: string) => {
    const nextItems = items.map((it) => {
      if (it.id === id) {
        const nextCompleted = !it.completed;
        if (nextCompleted) {
          if (it.category.startsWith('macro_') || it.tier === 'Week 3') {
            fireMajorCelebration();
          } else {
            fireConfetti();
          }
        }
        return { ...it, completed: nextCompleted };
      }
      return it;
    });
    setItems(nextItems);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newItem: TrackerItem = {
      id: `custom-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      tier: newCategory === 'weekly' ? 'Week 1' : undefined,
      description: newDescription.trim() || 'Custom player milestone',
      completed: false,
      rewardInfo: newReward.trim() || undefined
    };

    setItems([newItem, ...items]);
    setNewTitle('');
    setNewDescription('');
    setNewReward('');
    setShowAddForm(false);
    fireConfetti();
  };

  const handleDeleteItem = (id: string) => {
    setItems(items.filter((it) => it.id !== id));
  };

  const handleResetDefaults = () => {
    if (confirm('Are you sure you want to reset all tasks to league defaults?')) {
      setItems(INITIAL_TRACKER_ITEMS);
    }
  };

  // Stats calculation
  const totalItems = items.length;
  const completedItems = items.filter((it) => it.completed).length;
  const totalPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  const dailyItems = items.filter((it) => it.category === 'daily');
  const dailyCompleted = dailyItems.filter((it) => it.completed).length;

  const weeklyItems = items.filter((it) => it.category === 'weekly');
  const weeklyCompleted = weeklyItems.filter((it) => it.completed).length;

  const macroItems = items.filter((it) => it.category.startsWith('macro_'));
  const macroCompleted = macroItems.filter((it) => it.completed).length;

  // Filtered view
  const filteredItems = items.filter((it) => {
    if (activeCategory === 'daily') return it.category === 'daily';
    if (activeCategory === 'weekly') {
      if (it.category !== 'weekly') return false;
      if (activeWeeklyTier !== 'all') return it.tier === activeWeeklyTier;
      return true;
    }
    if (activeCategory === 'macro') return it.category.startsWith('macro_');
    return true;
  });

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      
      {/* Header */}
      <div className="p-5 sm:p-6 rounded-2xl border border-slate-800 bg-slate-900/85 backdrop-blur-md space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
          <CheckSquare className="w-4 h-4" />
          The Anti Distraction Engine
        </div>
        <h1 className="text-3xl font-poe font-bold text-slate-900 dark:text-slate-100">
          SSF Progression & Milestone Planner
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
          Micro-goals, 4 Voidstone milestone checklist, 115 Atlas points, and group self found player task board to progress meaningfully without getting sidetracked.
        </p>
      </div>

      {/* Stats & Progress Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Overall Completion */}
        <div className="p-5 rounded-2xl border border-amber-500/40 bg-slate-900/80/80 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold">
            <span>Total SSF Progress</span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">{totalPercent}%</span>
          </div>
          <div className="text-2xl font-poe font-bold text-slate-900 dark:text-slate-100">
            {completedItems} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">/ {totalItems}</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-[#0f172a] rounded-full h-2 overflow-hidden border border-slate-300 dark:border-[#3f3f5f]">
            <div className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-300" style={{ width: `${totalPercent}%` }} />
          </div>
        </div>

        {/* Daily Routine */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80/60 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold">
            <span className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400">
              <Zap className="w-3.5 h-3.5" /> Daily Routine
            </span>
            <span className="text-sky-600 dark:text-sky-400 font-bold">{dailyCompleted}/{dailyItems.length}</span>
          </div>
          <div className="text-2xl font-poe font-bold text-slate-900 dark:text-slate-100">
            {dailyItems.length > 0 ? Math.round((dailyCompleted / dailyItems.length) * 100) : 0}%
          </div>
          <div className="w-full bg-slate-200 dark:bg-[#0f172a] rounded-full h-2 overflow-hidden border border-slate-300 dark:border-[#3f3f5f]">
            <div className="h-full bg-sky-500 transition-all duration-300" style={{ width: `${dailyItems.length > 0 ? (dailyCompleted / dailyItems.length) * 100 : 0}%` }} />
          </div>
        </div>

        {/* Weekly Milestones */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80/60 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <Calendar className="w-3.5 h-3.5" /> Weekly Goals
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">{weeklyCompleted}/{weeklyItems.length}</span>
          </div>
          <div className="text-2xl font-poe font-bold text-slate-900 dark:text-slate-100">
            {weeklyItems.length > 0 ? Math.round((weeklyCompleted / weeklyItems.length) * 100) : 0}%
          </div>
          <div className="w-full bg-slate-200 dark:bg-[#0f172a] rounded-full h-2 overflow-hidden border border-slate-300 dark:border-[#3f3f5f]">
            <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${weeklyItems.length > 0 ? (weeklyCompleted / weeklyItems.length) * 100 : 0}%` }} />
          </div>
        </div>

        {/* Macro Goals */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80/60 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold">
            <span className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
              <Crown className="w-3.5 h-3.5" /> 4 Voidstone Macro
            </span>
            <span className="text-purple-600 dark:text-purple-400 font-bold">{macroCompleted}/{macroItems.length}</span>
          </div>
          <div className="text-2xl font-poe font-bold text-slate-900 dark:text-slate-100">
            {macroItems.length > 0 ? Math.round((macroCompleted / macroItems.length) * 100) : 0}%
          </div>
          <div className="w-full bg-slate-200 dark:bg-[#0f172a] rounded-full h-2 overflow-hidden border border-slate-300 dark:border-[#3f3f5f]">
            <div className="h-full bg-purple-500 transition-all duration-300" style={{ width: `${macroItems.length > 0 ? (macroCompleted / macroItems.length) * 100 : 0}%` }} />
          </div>
        </div>

      </div>

      {/* Category Tabs & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/80/60 p-4 rounded-2xl border border-slate-800 shadow-sm">
        
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', label: 'All Tasks' },
            { id: 'daily', label: '⚡ Daily Routine' },
            { id: 'weekly', label: '📅 Weekly Milestones' },
            { id: 'macro', label: '🏆 Macro & Voidstones' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeCategory === tab.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-100 dark:bg-poe-dark border border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Custom Goal</span>
          </button>

          <button
            onClick={handleResetDefaults}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-poe-dark border border-slate-800 text-slate-500 dark:text-slate-400 hover:text-red-500 text-xs transition-colors"
            title="Reset to League Defaults"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Sub Tier Filter for Weekly */}
      {activeCategory === 'weekly' && (
        <div className="flex items-center gap-2 pt-1 pl-1">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Tier:</span>
          {['all', 'Week 1', 'Week 2', 'Week 3'].map((tier) => (
            <button
              key={tier}
              onClick={() => setActiveWeeklyTier(tier as any)}
              className={`px-2.5 py-1 text-xs rounded-lg ${
                activeWeeklyTier === tier
                  ? 'bg-slate-200 dark:bg-slate-700 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/40'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {tier === 'all' ? 'All Weeks' : tier}
            </button>
          ))}
        </div>
      )}

      {/* Add Custom Goal Modal / Drawer */}
      {showAddForm && (
        <form onSubmit={handleAddItem} className="p-5 rounded-2xl border border-emerald-500/40 bg-white dark:bg-poe-darkest space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Create Custom SSF Goal
            </h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Goal Title *</label>
              <input
                type="text"
                placeholder="e.g. Farm 100 Deafening Essences of Dread"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                className="w-full bg-slate-50 dark:bg-white dark:bg-[#1a1a2e] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-white dark:bg-[#1a1a2e] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="daily">⚡ Daily Routine</option>
                <option value="weekly">📅 Weekly Milestone</option>
                <option value="macro_atlas">🏆 Macro Goal</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Description / Notes</label>
            <input
              type="text"
              placeholder="e.g. Run Tier 6+ maps with Essence on map device"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="w-full bg-slate-50 dark:bg-white dark:bg-[#1a1a2e] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-colors shadow-md"
            >
              Add Goal to Planner
            </button>
          </div>
        </form>
      )}

      {/* Task List */}
      <div className="space-y-3">
        {filteredItems.map((item) => {
          const isDone = item.completed;

          return (
            <div
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm ${
                isDone
                  ? 'border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/10 text-slate-500 dark:text-slate-400'
                  : 'border-slate-800 bg-slate-900/80/70 hover:border-amber-500/40 hover:bg-slate-50 dark:hover:bg-[#0f172a]'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-5 h-5 rounded-lg flex items-center justify-center mt-0.5 border transition-colors ${
                  isDone
                    ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                    : 'border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-[#0f172a]'
                }`}>
                  {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-sm font-bold ${isDone ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-slate-100'}`}>
                      {item.title}
                    </span>

                    {item.tier && (
                      <span className="text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono">
                        {item.tier}
                      </span>
                    )}

                    <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded ${
                      item.category === 'daily' ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300' :
                      item.category === 'weekly' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' :
                      'bg-purple-500/15 text-purple-700 dark:text-purple-300'
                    }`}>
                      {item.category.replace('macro_', '')}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {item.description}
                  </p>

                  {item.rewardInfo && (
                    <div className="text-[11px] text-amber-700 dark:text-amber-400/90 font-medium flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>{item.rewardInfo}</span>
                    </div>
                  )}
                </div>
              </div>

              {item.id.startsWith('custom-') && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteItem(item.id);
                  }}
                  className="text-slate-400 hover:text-red-500 p-1"
                  title="Delete Custom Task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};
