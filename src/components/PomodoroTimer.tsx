import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface PomodoroTimerProps {
  taskName?: string;
}

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ taskName }) => {
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      // Auto-switch mode when timer reaches 0
      setIsActive(false);
      const nextMode = mode === 'focus' ? 'break' : 'focus';
      setMode(nextMode);
      setTimeLeft(nextMode === 'focus' ? 25 * 60 : 5 * 60);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, mode]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'focus' ? 25 * 60 : 5 * 60);
  };

  const switchMode = (newMode: 'focus' | 'break') => {
    setIsActive(false);
    setMode(newMode);
    setTimeLeft(newMode === 'focus' ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalTime = mode === 'focus' ? 25 * 60 : 5 * 60;
  const progressPercent = ((totalTime - timeLeft) / totalTime) * 100;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-colors w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 truncate">
          <span className="relative flex h-3 w-3 shrink-0">
            {isActive && (
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${mode === 'focus' ? 'bg-blue-400' : 'bg-green-400'}`}></span>
            )}
            <span className={`relative inline-flex rounded-full h-3 w-3 ${mode === 'focus' ? 'bg-blue-500' : 'bg-green-500'}`}></span>
          </span>
          <span className="truncate">{taskName || 'Pomodoro Timer'}</span>
        </h3>
        
        <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-lg shrink-0">
          <button
            onClick={() => switchMode('focus')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              mode === 'focus' 
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            Focus
          </button>
          <button
            onClick={() => switchMode('break')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              mode === 'break' 
                ? 'bg-white dark:bg-slate-700 text-green-600 dark:text-green-400 shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            Break
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center py-4">
        <div className="text-6xl font-bold text-slate-800 dark:text-slate-100 font-mono tabular-nums tracking-tight">
          {formatTime(timeLeft)}
        </div>
        
        <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-6 overflow-hidden shadow-inner">
          <div 
            className={`h-full transition-all duration-1000 ease-linear rounded-full ${mode === 'focus' ? 'bg-blue-500 dark:bg-blue-400' : 'bg-green-500 dark:bg-green-400'}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 mt-2">
        <button
          onClick={toggleTimer}
          className={`flex items-center justify-center w-14 h-14 rounded-full transition-all ${
            isActive 
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700' 
              : `text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 ${mode === 'focus' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`
          }`}
        >
          {isActive ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
        </button>
        <button
          onClick={resetTimer}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-all"
          title="Reset Timer"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
