import React, { useMemo, useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Compass, Skull, Clock, X } from 'lucide-react';

export interface DailyCalendarRun {
  areaName: string;
  kind: string;
  startedAtMs: number;
  durationSec: number;
  areaLevel?: number;
}

export interface DailyCalendarSession {
  id: string;
  title: string;
  strategy: string;
  startDate: string; // YYYY-MM-DD
  mapsCompleted: number;
  avgMapSec: number;
  mapsPerHr: number;
  deaths: number;
  characterName?: string;
}

interface DaySummary {
  dateKey: string;
  totalMaps: number;
  totalDeaths: number;
  avgSec: number;
  topMaps: Array<{ name: string; count: number; avgSec: number }>;
  strategies: string[];
  sessions: DailyCalendarSession[];
}

interface DailyMappingCalendarProps {
  runs: DailyCalendarRun[];
  savedSessions: DailyCalendarSession[];
}

function toDateKey(ms: number): string {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function fmtDur(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}m ${r}s` : `${r}s`;
}

export const DailyMappingCalendar: React.FC<DailyMappingCalendarProps> = ({
  runs,
  savedSessions
}) => {
  const [cursor, setCursor] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);

  const dayMap = useMemo(() => {
    const map = new Map<
      string,
      {
        liveMaps: DailyCalendarRun[];
        sessions: DailyCalendarSession[];
      }
    >();

    for (const r of runs) {
      if (r.kind === 'Hideout / Town') continue;
      const key = toDateKey(r.startedAtMs);
      const cur = map.get(key) || { liveMaps: [], sessions: [] };
      cur.liveMaps.push(r);
      map.set(key, cur);
    }

    for (const s of savedSessions) {
      const key = (s.startDate || '').slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) continue;
      const cur = map.get(key) || { liveMaps: [], sessions: [] };
      cur.sessions.push(s);
      map.set(key, cur);
    }

    const out = new Map<string, DaySummary>();
    for (const [dateKey, entry] of map.entries()) {
      const savedMaps = entry.sessions.reduce((acc, s) => acc + (s.mapsCompleted || 0), 0);
      const liveMapsCount = entry.liveMaps.length;
      const totalMaps = Math.max(liveMapsCount, savedMaps);

      const perMap = new Map<string, { count: number; durSum: number }>();
      for (const r of entry.liveMaps) {
        const prev = perMap.get(r.areaName) || { count: 0, durSum: 0 };
        prev.count += 1;
        prev.durSum += r.durationSec;
        perMap.set(r.areaName, prev);
      }
      const topMaps = Array.from(perMap.entries())
        .map(([name, v]) => ({ name, count: v.count, avgSec: Math.round(v.durSum / v.count) }))
        .sort((a, b) => b.count - a.count);

      const avgSec =
        entry.liveMaps.length > 0
          ? Math.round(entry.liveMaps.reduce((a, r) => a + r.durationSec, 0) / entry.liveMaps.length)
          : entry.sessions.length > 0
          ? Math.round(entry.sessions.reduce((a, s) => a + (s.avgMapSec || 0), 0) / entry.sessions.length)
          : 0;

      const totalDeaths = entry.sessions.reduce((a, s) => a + (s.deaths || 0), 0);
      const strategies = Array.from(new Set(entry.sessions.map((s) => s.strategy).filter(Boolean)));

      out.set(dateKey, {
        dateKey,
        totalMaps,
        totalDeaths,
        avgSec,
        topMaps,
        strategies,
        sessions: entry.sessions
      });
    }
    return out;
  }, [runs, savedSessions]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = cursor.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const todayKey = toDateKey(Date.now());

  const monthTotalMaps = useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}-`;
    let sum = 0;
    for (const [k, v] of dayMap.entries()) {
      if (k.startsWith(prefix)) sum += v.totalMaps;
    }
    return sum;
  }, [dayMap, year, month]);

  const selectedDay = selectedDayKey ? dayMap.get(selectedDayKey) || null : null;

  const getHeatClass = (count: number) => {
    if (count >= 30) return 'bg-emerald-500/30 border-emerald-400/60 text-emerald-100';
    if (count >= 10) return 'bg-cyan-500/25 border-cyan-400/50 text-cyan-100';
    if (count >= 1) return 'bg-indigo-500/20 border-indigo-400/45 text-indigo-100';
    return 'bg-slate-950/60 border-slate-800/80 text-slate-500 hover:border-slate-700';
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-bold text-white">{monthLabel}</span>
          <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/35 text-[10px] font-mono text-cyan-300 font-bold">
            {monthTotalMaps} maps this month
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setCursor(new Date(year, month - 1, 1))}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 cursor-pointer"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              const now = new Date();
              setCursor(new Date(now.getFullYear(), now.getMonth(), 1));
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] font-mono text-slate-300 cursor-pointer"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setCursor(new Date(year, month + 1, 1))}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 cursor-pointer"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Day-of-week header */}
      <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-mono uppercase text-slate-500">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
          <div key={`pad-${idx}`} className="h-14 sm:h-16 rounded-xl bg-slate-950/25 border border-transparent" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const dayNum = idx + 1;
          const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
          const info = dayMap.get(key);
          const count = info?.totalMaps || 0;
          const isSelected = selectedDayKey === key;
          const isToday = key === todayKey;

          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedDayKey(isSelected ? null : key)}
              className={`h-14 sm:h-16 p-1.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${getHeatClass(
                count
              )} ${isSelected ? 'ring-2 ring-amber-400' : isToday ? 'ring-1 ring-cyan-400/70' : ''}`}
            >
              <span className="text-[10px] font-mono opacity-80">{dayNum}</span>
              <span className={`text-xs sm:text-sm font-mono font-black leading-none ${count > 0 ? '' : 'opacity-30'}`}>
                {count > 0 ? count : '·'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Day Drilldown */}
      {selectedDayKey && (
        <div className="p-4 rounded-xl border border-amber-500/35 bg-slate-950/90 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-bold text-white">{selectedDayKey}</span>
              <span className="text-xs font-mono text-emerald-300 font-bold">
                {selectedDay?.totalMaps || 0} maps
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedDayKey(null)}
              className="p-1 rounded-lg bg-slate-900 text-slate-400 hover:text-white cursor-pointer"
              aria-label="Close day details"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {!selectedDay || selectedDay.totalMaps === 0 ? (
            <p className="text-xs text-slate-400">
              No maps recorded for this date yet. Parse your Client.txt or save a session to populate this day.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-3 text-xs font-mono">
                {selectedDay.avgSec > 0 && (
                  <span className="inline-flex items-center gap-1 text-sky-300">
                    <Clock className="w-3.5 h-3.5" />
                    Avg: {fmtDur(selectedDay.avgSec)}
                  </span>
                )}
                {selectedDay.totalDeaths > 0 && (
                  <span className="inline-flex items-center gap-1 text-rose-300">
                    <Skull className="w-3.5 h-3.5" />
                    Deaths: {selectedDay.totalDeaths}
                  </span>
                )}
                {selectedDay.strategies.length > 0 && (
                  <span className="text-amber-300">
                    Strategies: {selectedDay.strategies.join(', ')}
                  </span>
                )}
              </div>

              {selectedDay.topMaps.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-mono uppercase text-slate-400">Maps Run This Day</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                    {selectedDay.topMaps.slice(0, 12).map((m) => (
                      <div
                        key={m.name}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between gap-2 text-xs"
                      >
                        <span className="text-slate-200 truncate font-medium">{m.name}</span>
                        <span className="font-mono text-cyan-300 font-bold shrink-0">
                          {m.count}x ({fmtDur(m.avgSec)})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedDay.sessions.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-mono uppercase text-slate-400">Saved Sessions</div>
                  <div className="space-y-1">
                    {selectedDay.sessions.map((s) => (
                      <div
                        key={s.id}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs"
                      >
                        <span className="font-semibold text-white">{s.title}</span>
                        <span className="font-mono text-slate-400">
                          {s.mapsCompleted} maps • {s.mapsPerHr}/hr • {s.strategy}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
