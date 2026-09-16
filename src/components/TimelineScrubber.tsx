import React from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw } from 'lucide-react';
import { playUiSound } from '../utils/audio';

interface TimelineScrubberProps {
  simDate: Date;
  isPaused: boolean;
  isLiveRealtime: boolean;
  timeMultiplier: number;
  onTogglePause: () => void;
  onStepTime: (days: number) => void;
  onScrubTime: (percent: number) => void;
  onResetToday: () => void;
  onToggleLiveRealtime: () => void;
}

export const TimelineScrubber: React.FC<TimelineScrubberProps> = ({
  simDate,
  isPaused,
  isLiveRealtime,
  timeMultiplier,
  onTogglePause,
  onStepTime,
  onScrubTime,
  onResetToday,
  onToggleLiveRealtime,
}) => {
  const currentYear = simDate.getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);
  const diffTime = Math.abs(simDate.getTime() - startOfYear.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const sliderPercent = Math.min(100, Math.max(0, (diffDays / 365) * 100));

  const formattedDate = simDate.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 w-11/12 max-w-3xl bg-[#0a0f1d]/90 backdrop-blur-xl rounded-xl p-3 border border-slate-700/50 shadow-2xl flex items-center space-x-3.5">
      {/* Live Realtime Sync Lock Button */}
      <button
        onClick={() => {
          onToggleLiveRealtime();
          playUiSound(700, 0.06);
        }}
        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition border shadow flex items-center gap-1.5 cursor-pointer shrink-0 ${
          isLiveRealtime
            ? 'bg-emerald-950/90 border-emerald-500/80 text-emerald-300 shadow-emerald-900/50'
            : 'bg-amber-950/80 border-amber-500/60 text-amber-300 shadow-amber-900/30'
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            isLiveRealtime ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
          }`}
        />
        <span>{isLiveRealtime ? '🔴 LIVE REAL-TIME' : 'WARP ACTIVE'}</span>
      </button>

      {/* Step Back 10 Days */}
      <button
        onClick={() => {
          onStepTime(-10);
          playUiSound(400, 0.04);
        }}
        title="Step Back 10 Days"
        className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center transition text-slate-200 border border-slate-700/60 shadow cursor-pointer shrink-0"
      >
        <SkipBack className="w-3.5 h-3.5" />
      </button>

      {/* Play/Pause */}
      <button
        onClick={() => {
          onTogglePause();
          playUiSound(500, 0.05);
        }}
        className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center transition text-white shadow-lg shadow-blue-600/40 cursor-pointer shrink-0"
      >
        {isPaused ? <Play className="w-4 h-4 ml-0.5" /> : <Pause className="w-4 h-4" />}
      </button>

      {/* Step Forward 10 Days */}
      <button
        onClick={() => {
          onStepTime(10);
          playUiSound(400, 0.04);
        }}
        title="Step Forward 10 Days"
        className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center transition text-slate-200 border border-slate-700/60 shadow cursor-pointer shrink-0"
      >
        <SkipForward className="w-3.5 h-3.5" />
      </button>

      {/* Scrubber Bar */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="flex justify-between text-[10px] text-slate-400 mb-1 font-mono">
          <span>Jan {currentYear}</span>
          <span className="text-cyan-400 font-bold tracking-wider">{formattedDate} UTC</span>
          <span>Dec {currentYear}</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={isNaN(sliderPercent) ? 0 : sliderPercent}
          onChange={(e) => onScrubTime(parseFloat(e.target.value))}
          className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-950 rounded-lg"
        />
      </div>

      {/* Today Reset Button */}
      <button
        onClick={() => {
          onResetToday();
          playUiSound(600, 0.06);
        }}
        className="px-3.5 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono font-medium transition border border-slate-700/60 shadow flex items-center gap-1 cursor-pointer shrink-0"
      >
        <RotateCcw className="w-3 h-3 text-cyan-400" />
        <span>Live Sync</span>
      </button>
    </div>
  );
};
