import React, { useState, useEffect } from 'react';
import { CheckSquare, Square, Plus, Trash2, ClipboardList } from 'lucide-react';
import type { PersonalSessionGoal } from '../../../types';

interface SessionScratchpadProps {
  savedGoals: PersonalSessionGoal[];
  characters: { characterName: string; ascendancy: string }[];
  canEdit: boolean;
  onSaveGoals: (goals: PersonalSessionGoal[]) => Promise<void>;
}

export const SessionScratchpad: React.FC<SessionScratchpadProps> = ({
  savedGoals,
  characters,
  canEdit,
  onSaveGoals
}) => {
  const [goals, setGoals] = useState<PersonalSessionGoal[]>(savedGoals);
  const [newText, setNewText] = useState('');
  const [selectedChar, setSelectedChar] = useState(characters[0]?.characterName || '');

  useEffect(() => {
    setGoals(savedGoals);
  }, [savedGoals]);

  const persist = async (next: PersonalSessionGoal[]) => {
    setGoals(next);
    await onSaveGoals(next);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim() || !canEdit) return;
    const item: PersonalSessionGoal = {
      id: `goal_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      text: newText.trim(),
      characterName: selectedChar || undefined,
      done: false,
      createdAtIso: new Date().toISOString()
    };
    setNewText('');
    await persist([item, ...goals]);
  };

  const handleToggle = async (id: string) => {
    if (!canEdit) return;
    const next = goals.map((g) => (g.id === id ? { ...g, done: !g.done } : g));
    await persist(next);
  };

  const handleDelete = async (id: string) => {
    if (!canEdit) return;
    const next = goals.filter((g) => g.id !== id);
    await persist(next);
  };

  const doneCount = goals.filter((g) => g.done).length;

  return (
    <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/70 space-y-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-sky-300">
          <ClipboardList className="w-4 h-4 text-sky-400" />
          <span>Farming Session Scratchpad ({doneCount}/{goals.length})</span>
        </div>
        <span className="text-[10px] font-mono text-slate-500">Cloud Synced</span>
      </div>

      {canEdit && (
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="e.g. Farm 10 Jun safehouses for Veiled Orb, Roll Cluster Jewel..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
          {characters.length > 0 && (
            <select
              value={selectedChar}
              onChange={(e) => setSelectedChar(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-amber-300 font-mono"
            >
              <option value="">Account</option>
              {characters.map((ch) => (
                <option key={ch.characterName} value={ch.characterName}>
                  {ch.characterName}
                </option>
              ))}
            </select>
          )}
          <button
            type="submit"
            disabled={!newText.trim()}
            className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white text-xs font-black flex items-center justify-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </form>
      )}

      {goals.length === 0 ? (
        <div className="p-5 text-center text-xs text-slate-500 italic">
          {canEdit
            ? 'Jot down your next upgrade targets, crafting steps, or boss goals so you never lose track between sessions.'
            : 'No public farming session goals posted yet.'}
        </div>
      ) : (
        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
          {goals.map((g) => (
            <div
              key={g.id}
              className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-xs transition-colors ${
                g.done
                  ? 'bg-emerald-950/15 border-emerald-500/25 text-slate-500 line-through'
                  : 'bg-slate-950/60 border-slate-800 text-slate-200'
              }`}
            >
              <button
                type="button"
                disabled={!canEdit}
                onClick={() => handleToggle(g.id)}
                className="flex items-center gap-2 text-left min-w-0 flex-1 cursor-pointer disabled:cursor-default"
              >
                {g.done ? (
                  <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500 shrink-0" />
                )}
                <span className="truncate">{g.text}</span>
                {g.characterName && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-300 shrink-0 no-underline">
                    {g.characterName}
                  </span>
                )}
              </button>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => handleDelete(g.id)}
                  className="p-1 rounded text-slate-500 hover:text-rose-400 cursor-pointer shrink-0"
                  title="Remove goal"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
