import React, { useState, useEffect } from 'react';
import {
  GripVertical,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  RotateCcw,
  Maximize2
} from 'lucide-react';

export type WidgetColSpan = 3 | 4 | 6 | 8 | 12;

export interface ToolWidgetDefinition {
  id: string;
  title: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  defaultSpan: WidgetColSpan;
  defaultCollapsed?: boolean;
  render: () => React.ReactNode;
}

interface StoredWidgetState {
  order: string[];
  spans: Record<string, WidgetColSpan>;
  collapsed: Record<string, boolean>;
}

interface ToolWidgetGridProps {
  storageKey: string;
  widgets: ToolWidgetDefinition[];
  headerExtra?: React.ReactNode;
}

const SPAN_STEPS: WidgetColSpan[] = [3, 4, 6, 8, 12];

const SPAN_LABEL: Record<WidgetColSpan, string> = {
  3: '1/4',
  4: '1/3',
  6: '1/2',
  8: '2/3',
  12: 'Full'
};

const SPAN_CLASS: Record<WidgetColSpan, string> = {
  3: 'lg:col-span-3',
  4: 'lg:col-span-4',
  6: 'lg:col-span-6',
  8: 'lg:col-span-8',
  12: 'lg:col-span-12'
};

function buildDefaultState(widgets: ToolWidgetDefinition[]): StoredWidgetState {
  const order = widgets.map((w) => w.id);
  const spans: Record<string, WidgetColSpan> = {};
  const collapsed: Record<string, boolean> = {};
  for (const w of widgets) {
    spans[w.id] = w.defaultSpan;
    collapsed[w.id] = Boolean(w.defaultCollapsed);
  }
  return { order, spans, collapsed };
}

function readStoredState(storageKey: string, widgets: ToolWidgetDefinition[]): StoredWidgetState {
  const def = buildDefaultState(widgets);
  if (typeof window === 'undefined') return def;
  try {
    const raw = localStorage.getItem(`exile_ssf_tool_grid_${storageKey}_v1`);
    if (!raw) return def;
    const parsed = JSON.parse(raw);
    const validIds = new Set(widgets.map((w) => w.id));
    const savedOrder = Array.isArray(parsed?.order)
      ? parsed.order.filter((id: string) => validIds.has(id))
      : [];
    const missingIds = def.order.filter((id) => !savedOrder.includes(id));
    return {
      order: [...savedOrder, ...missingIds],
      spans: { ...def.spans, ...(parsed?.spans || {}) },
      collapsed: { ...def.collapsed, ...(parsed?.collapsed || {}) }
    };
  } catch {
    return def;
  }
}

export const ToolWidgetGrid: React.FC<ToolWidgetGridProps> = ({
  storageKey,
  widgets,
  headerExtra
}) => {
  const [layout, setLayout] = useState<StoredWidgetState>(() => readStoredState(storageKey, widgets));
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(`exile_ssf_tool_grid_${storageKey}_v1`, JSON.stringify(layout));
    } catch {}
  }, [storageKey, layout]);

  const widgetMap = new Map(widgets.map((w) => [w.id, w]));
  const orderedWidgets = layout.order
    .map((id) => widgetMap.get(id))
    .filter((w): w is ToolWidgetDefinition => Boolean(w));

  const toggleCollapse = (id: string) => {
    setLayout((prev) => ({
      ...prev,
      collapsed: { ...prev.collapsed, [id]: !prev.collapsed[id] }
    }));
  };

  const cycleSpan = (id: string) => {
    setLayout((prev) => {
      const cur = prev.spans[id] || 6;
      const idx = SPAN_STEPS.indexOf(cur);
      const next = SPAN_STEPS[(idx + 1) % SPAN_STEPS.length];
      return {
        ...prev,
        spans: { ...prev.spans, [id]: next }
      };
    });
  };

  const applyPreset = (preset: '2x2' | '3col' | '4x2' | 'full' | 'reset') => {
    if (preset === 'reset') {
      setLayout(buildDefaultState(widgets));
      return;
    }
    const targetSpan: WidgetColSpan =
      preset === '2x2' ? 6 : preset === '3col' ? 4 : preset === '4x2' ? 3 : 12;
    setLayout((prev) => {
      const nextSpans: Record<string, WidgetColSpan> = {};
      for (const w of widgets) {
        nextSpans[w.id] = targetSpan;
      }
      return { ...prev, spans: nextSpans };
    });
  };

  const setAllCollapsed = (val: boolean) => {
    setLayout((prev) => {
      const next: Record<string, boolean> = {};
      for (const w of widgets) next[w.id] = val;
      return { ...prev, collapsed: next };
    });
  };

  const handleDropOn = (targetId: string) => {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }
    setLayout((prev) => {
      const nextOrder = prev.order.filter((id) => id !== draggedId);
      const targetIdx = nextOrder.indexOf(targetId);
      if (targetIdx === -1) nextOrder.push(draggedId);
      else nextOrder.splice(targetIdx, 0, draggedId);
      return { ...prev, order: nextOrder };
    });
    setDraggedId(null);
    setDragOverId(null);
  };

  return (
    <div className="space-y-3">
      {/* Compact Workspace Layout Controls */}
      <div className="px-3.5 py-2 rounded-xl border border-slate-800/90 bg-slate-900/70 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 text-slate-300 font-bold">
            <LayoutGrid className="w-3.5 h-3.5 text-indigo-400" />
            <span>Workspace Grid</span>
          </span>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="text-slate-400 hidden sm:inline">Drag headers to reorder, click size badge to resize</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {headerExtra}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => applyPreset('2x2')}
              className="px-2 py-0.5 rounded text-[10px] text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer"
              title="2 Column Grid (2x2)"
            >
              2x2
            </button>
            <button
              type="button"
              onClick={() => applyPreset('3col')}
              className="px-2 py-0.5 rounded text-[10px] text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer"
              title="3 Column Grid (3x2)"
            >
              3 Col
            </button>
            <button
              type="button"
              onClick={() => applyPreset('4x2')}
              className="px-2 py-0.5 rounded text-[10px] text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer"
              title="4 Column Grid (4x2)"
            >
              4x2
            </button>
            <button
              type="button"
              onClick={() => applyPreset('full')}
              className="px-2 py-0.5 rounded text-[10px] text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer"
              title="Full Width Stacked"
            >
              Full
            </button>
          </div>
          <button
            type="button"
            onClick={() => setAllCollapsed(false)}
            className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-600 text-[10px] text-slate-300 hover:text-white cursor-pointer"
          >
            Expand All
          </button>
          <button
            type="button"
            onClick={() => setAllCollapsed(true)}
            className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-600 text-[10px] text-slate-400 hover:text-white cursor-pointer"
          >
            Collapse All
          </button>
          <button
            type="button"
            onClick={() => applyPreset('reset')}
            className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-amber-500/50 text-[10px] text-amber-300 flex items-center gap-1 cursor-pointer"
            title="Reset default widget order and sizes"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* 12-Column Draggable, Resizable, Collapsible Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {orderedWidgets.map((w) => {
          const span = layout.spans[w.id] || w.defaultSpan;
          const isCollapsed = Boolean(layout.collapsed[w.id]);
          const isOver = dragOverId === w.id && draggedId !== w.id;

          return (
            <div
              key={w.id}
              draggable
              onDragStart={(e) => {
                setDraggedId(w.id);
                e.dataTransfer.effectAllowed = 'move';
                try {
                  e.dataTransfer.setData('text/plain', w.id);
                } catch {}
              }}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragOverId !== w.id) setDragOverId(w.id);
              }}
              onDragLeave={() => {
                if (dragOverId === w.id) setDragOverId(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                handleDropOn(w.id);
              }}
              onDragEnd={() => {
                setDraggedId(null);
                setDragOverId(null);
              }}
              className={`${SPAN_CLASS[span]} rounded-2xl border transition-all shadow-lg overflow-hidden bg-[#0d111a] ${
                isOver
                  ? 'border-indigo-400 ring-2 ring-indigo-500/40'
                  : draggedId === w.id
                  ? 'border-amber-500/60 opacity-65'
                  : 'border-slate-800'
              }`}
            >
              {/* Widget Header Bar (Drag + Title + Size Cycle + Collapse Toggle) */}
              <div className="px-3.5 py-2.5 border-b border-slate-800/80 bg-slate-950/75 flex items-center justify-between gap-2 select-none">
                <div className="flex items-center gap-2 min-w-0 cursor-grab active:cursor-grabbing">
                  <GripVertical className="w-4 h-4 text-slate-600 hover:text-slate-300 shrink-0" />
                  {w.icon && <span className="shrink-0">{w.icon}</span>}
                  <span className="text-xs font-bold text-slate-100 truncate">{w.title}</span>
                  {w.badge && <span className="shrink-0">{w.badge}</span>}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => cycleSpan(w.id)}
                    className="px-2 py-0.5 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-[10px] font-mono text-indigo-300 hover:text-white flex items-center gap-1 cursor-pointer"
                    title="Cycle widget width (1/4, 1/3, 1/2, 2/3, Full)"
                  >
                    <Maximize2 className="w-2.5 h-2.5" />
                    <span>{SPAN_LABEL[span]}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleCollapse(w.id)}
                    className="p-1 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white cursor-pointer"
                    title={isCollapsed ? 'Expand section' : 'Collapse section'}
                  >
                    {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Widget Body */}
              {!isCollapsed && <div className="p-3.5 sm:p-4">{w.render()}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};
