import React, { useMemo, useState } from 'react';
import { Flame, CheckSquare, Award, Sparkles, TrendingUp } from 'lucide-react';

interface HistoryItem {
  id: string;
  date: number;
  checkboxStates?: Record<number, boolean>;
}

interface ConsistencyHeatmapProps {
  history: HistoryItem[];
}

export function ConsistencyHeatmap({ history }: ConsistencyHeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<{
    dateStr: string;
    count: number;
    formattedDate: string;
    x: number;
    y: number;
  } | null>(null);

  // 1. Data Aggregation
  const completedCountsByDate = useMemo(() => {
    const counts: Record<string, number> = {};
    history.forEach((item) => {
      if (!item.date) return;
      // Get local YYYY-MM-DD string
      const d = new Date(item.date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const completedCount = item.checkboxStates
        ? Object.values(item.checkboxStates).filter((v) => v === true).length
        : 0;

      if (completedCount > 0) {
        counts[dateStr] = (counts[dateStr] || 0) + completedCount;
      }
    });
    return counts;
  }, [history]);

  // 2. Metrics Calculations
  const metrics = useMemo(() => {
    const totalCompleted = Object.values(completedCountsByDate).reduce((a, b) => a + b, 0);
    const activeDays = Object.keys(completedCountsByDate).length;

    // Streak calculation
    let currentStreak = 0;
    const sortedDates = Object.keys(completedCountsByDate).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );

    if (sortedDates.length > 0) {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

      // Check if streak is active (completed today or yesterday)
      const hasRecentActivity = completedCountsByDate[todayStr] || completedCountsByDate[yesterdayStr];

      if (hasRecentActivity) {
        let checkDate = completedCountsByDate[todayStr] ? today : yesterday;
        let isStreakContinuing = true;
        
        while (isStreakContinuing) {
          const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
          if (completedCountsByDate[dateStr]) {
            currentStreak++;
            checkDate = new Date(checkDate);
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            isStreakContinuing = false;
          }
        }
      }
    }

    return { totalCompleted, activeDays, currentStreak };
  }, [completedCountsByDate]);

  // 3. Grid Generation (Last 20 weeks)
  const columns = useMemo(() => {
    const numWeeks = 20;
    const now = new Date();
    
    // Set endDate to Saturday of the current week to create a perfect complete 7-day row alignment
    const endDate = new Date(now);
    const dayOfWeek = endDate.getDay(); // 0-6 (Sun-Sat)
    endDate.setDate(endDate.getDate() + (6 - dayOfWeek));

    const totalDays = numWeeks * 7;
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - totalDays + 1);

    const weeksList: Array<Array<{ date: Date; dateStr: string; count: number; formattedDate: string }>> = [];
    
    const curr = new Date(startDate);
    for (let w = 0; w < numWeeks; w++) {
      const weekDays = [];
      for (let d = 0; d < 7; d++) {
        const itemDate = new Date(curr);
        const year = itemDate.getFullYear();
        const month = String(itemDate.getMonth() + 1).padStart(2, '0');
        const day = String(itemDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        const count = completedCountsByDate[dateStr] || 0;

        const formattedDate = itemDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });

        weekDays.push({
          date: itemDate,
          dateStr,
          count,
          formattedDate,
        });

        curr.setDate(curr.getDate() + 1);
      }
      weeksList.push(weekDays);
    }
    return weeksList;
  }, [completedCountsByDate]);

  // Months label list (placed above columns)
  const monthLabels = useMemo(() => {
    const labels: { label: string; colIndex: number }[] = [];
    let lastMonth = '';

    columns.forEach((week, colIdx) => {
      const firstDayOfWeek = week[0].date;
      const monthName = firstDayOfWeek.toLocaleDateString('en-US', { month: 'short' });
      if (monthName !== lastMonth) {
        labels.push({ label: monthName, colIndex: colIdx });
        lastMonth = monthName;
      }
    });

    return labels;
  }, [columns]);

  // Color Selector
  const getCellColor = (count: number) => {
    if (count === 0) {
      return 'bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/60 border-slate-200/20';
    }
    if (count <= 2) {
      return 'bg-blue-200 hover:bg-blue-300 dark:bg-blue-950 dark:hover:bg-blue-900 text-blue-800 dark:text-blue-300';
    }
    if (count <= 4) {
      return 'bg-blue-400 hover:bg-blue-500 dark:bg-blue-750 dark:hover:bg-blue-600';
    }
    if (count <= 7) {
      return 'bg-blue-650 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400';
    }
    return 'bg-indigo-600 hover:bg-indigo-750 dark:bg-indigo-500 dark:hover:bg-indigo-400 font-bold';
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-colors duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-100 dark:border-slate-800/50">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 rounded-full border border-blue-100/50 dark:border-blue-900/10">Consistency Tracker</span>
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-2">Hustle Habit Grid</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Visualize your continuous progress and checklist counts.</p>
        </div>

        {/* Dynamic Activity Metrics Summary */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/50">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Total Done</p>
              <p className="text-sm font-black text-slate-700 dark:text-slate-200 mt-0.5">{metrics.totalCompleted}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/50">
            <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Streak</p>
              <p className="text-sm font-black text-slate-700 dark:text-slate-200 mt-0.5">{metrics.currentStreak} Day{metrics.currentStreak !== 1 ? 's' : ''}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/50">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Active Days</p>
              <p className="text-sm font-black text-slate-700 dark:text-slate-200 mt-0.5">{metrics.activeDays}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Heatmap Layout with horizontal scroll */}
      <div className="relative overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
        <div className="min-w-[620px] pt-4 pr-2">
          
          {/* Calendar Heatmap Container */}
          <div className="flex gap-2">
            
            {/* Days Left Labels column */}
            <div className="flex flex-col justify-between text-[10px] text-slate-400 dark:text-slate-500 select-none pb-1 mt-6 h-[112px] w-7 shrink-0 font-medium">
              <span>Sun</span>
              <span>Tue</span>
              <span>Thu</span>
              <span>Sat</span>
            </div>

            {/* Main Columns Container */}
            <div className="flex flex-col gap-1.5 flex-1 relative">
              
              {/* Dynamic Month Headers */}
              <div className="h-5 relative text-[10px] text-slate-400 dark:text-slate-500 select-none font-bold">
                {monthLabels.map((lbl, idx) => {
                  const leftOffset = lbl.colIndex * 15.6; // exact coordinate based on column widths
                  return (
                    <span
                      key={idx}
                      className="absolute"
                      style={{ left: `${leftOffset}px` }}
                    >
                      {lbl.label}
                    </span>
                  );
                })}
              </div>

              {/* Weeks & Columns Grid */}
              <div className="flex gap-1 select-none">
                {columns.map((week, colIdx) => (
                  <div key={colIdx} className="flex flex-col gap-1 w-[11.5px] sm:w-[12px] shrink-0">
                    {week.map((cell) => {
                      const colorClass = getCellColor(cell.count);
                      return (
                        <div
                          key={cell.dateStr}
                          className={`w-[11.5px] h-[11.5px] sm:w-[12px] sm:h-[12px] rounded-[2px] transition-all cursor-crosshair border border-slate-200/5 dark:border-slate-800/5 duration-150 relative ${colorClass}`}
                          title={`${cell.formattedDate}: ${cell.count} task${cell.count !== 1 ? 's' : ''} completed`}
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoveredCell({
                              dateStr: cell.dateStr,
                              count: cell.count,
                              formattedDate: cell.formattedDate,
                              x: rect.left,
                              y: rect.top,
                            });
                          }}
                          onMouseLeave={() => setHoveredCell(null)}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>

            </div>

          </div>

          {/* Color Scale Guide Legend */}
          <div className="flex items-center justify-between mt-5 text-[10px] text-slate-400 dark:text-slate-500 px-1 font-medium select-none">
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
              <span>Earn +10 EXP per checkbox completed!</span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <span>Less</span>
              <div className="w-[10px] h-[10px] rounded-[1.5px] bg-slate-100 dark:bg-slate-800" />
              <div className="w-[10px] h-[10px] rounded-[1.5px] bg-blue-200 dark:bg-blue-950" />
              <div className="w-[10px] h-[10px] rounded-[1.5px] bg-blue-400 dark:bg-blue-750" />
              <div className="w-[10px] h-[10px] rounded-[1.5px] bg-blue-650 dark:bg-blue-500" />
              <div className="w-[10px] h-[10px] rounded-[1.5px] bg-indigo-600 dark:bg-indigo-500" />
              <span>More</span>
            </div>
          </div>

        </div>
      </div>

      {/* Floating Interactive Custom Tooltip Portal */}
      {hoveredCell && (
        <div
          className="fixed pointer-events-none z-50 bg-slate-900/95 dark:bg-slate-950/95 text-white/95 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg shadow-xl shadow-black/35 border border-slate-700/60 dark:border-slate-800/65 backdrop-blur-sm -translate-x-1/2 -translate-y-[130%] transition-opacity duration-150 scale-100"
          style={{
            left: `${hoveredCell.x + 6}px`,
            top: `${hoveredCell.y}px`,
          }}
        >
          <p className="text-[10px] text-slate-300 font-bold">{hoveredCell.formattedDate}</p>
          <p className="mt-0.5 text-blue-300">
            {hoveredCell.count} task{hoveredCell.count !== 1 ? 's' : ''} completed
          </p>
          <div className="absolute left-1/2 bottom-0 w-2 h-2 bg-slate-900/95 dark:bg-slate-950/95 border-r border-b border-slate-700/60 dark:border-slate-800/65 rotate-45 -translate-x-1/2 translate-y-1/2" />
        </div>
      )}
    </div>
  );
}
