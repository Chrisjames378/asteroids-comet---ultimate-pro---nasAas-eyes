import React from 'react';
import { CelestialData } from '../types';

interface RadarHUDOverlayProps {
  showHud: boolean;
  currentObject: CelestialData;
  isPaused?: boolean;
}

export const RadarHUDOverlay: React.FC<RadarHUDOverlayProps> = ({
  showHud,
  currentObject,
  isPaused = false,
}) => {
  if (!showHud) return null;

  const isActive = !isPaused;

  // Extract numerical AU distance from distanceAU string (e.g. "0.0142 AU")
  const parseDistanceAU = (distStr?: string): number => {
    if (!distStr) return 1.0;
    const match = distStr.match(/([0-9.]+)/);
    return match && match[1] ? parseFloat(match[1]) : 1.0;
  };

  const distanceAU = parseDistanceAU(currentObject.distanceAU);
  const isCriticalCloseApproach = distanceAU < 0.05;

  return (
    <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-10 pointer-events-none flex flex-col items-center select-none">
      {/* Outer Radar Ping Ring */}
      <div
        className={`w-32 h-32 rounded-full border-2 flex items-center justify-center absolute transition-all duration-500 ${
          isCriticalCloseApproach ? 'border-amber-500/70' : 'border-cyan-500/40'
        } ${isActive ? 'animate-ping' : 'opacity-25'}`}
      />

      {/* Main Reticle Ring */}
      <div
        className={`w-24 h-24 rounded-full border flex items-center justify-center relative transition-all duration-500 ${
          isCriticalCloseApproach
            ? 'border-amber-400 shadow-[0_0_24px_rgba(245,158,11,0.5)]'
            : 'border-cyan-400/80 shadow-[0_0_20px_rgba(34,211,238,0.3)]'
        } ${isActive ? 'animate-pulse' : 'border-slate-500/50'}`}
      >
        {/* Center Target Dot */}
        <div
          className={`w-2 h-2 rounded-full transition-all duration-300 ${
            isActive
              ? isCriticalCloseApproach
                ? 'bg-amber-400 shadow-[0_0_14px_#f59e0b] animate-pulse'
                : 'bg-cyan-400 shadow-[0_0_12px_#22d3ee] animate-pulse'
              : 'bg-slate-400 shadow-[0_0_6px_#94a3b8]'
          }`}
        />

        {/* Crosshair lines */}
        <div
          className={`absolute w-full h-[1px] transition-colors duration-500 ${
            isActive
              ? isCriticalCloseApproach
                ? 'bg-amber-400/60'
                : 'bg-cyan-400/40'
              : 'bg-slate-500/30'
          }`}
        />
        <div
          className={`absolute h-full w-[1px] transition-colors duration-500 ${
            isActive
              ? isCriticalCloseApproach
                ? 'bg-amber-400/60'
                : 'bg-cyan-400/40'
              : 'bg-slate-500/30'
          }`}
        />
      </div>

      {/* Status Bar */}
      <div
        className={`mt-2.5 bg-slate-950/90 border px-3.5 py-1 rounded-md text-[10px] font-mono tracking-wider shadow-lg flex items-center gap-2 transition-all duration-500 ${
          isCriticalCloseApproach
            ? 'border-amber-500/80 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
            : 'border-cyan-500/50 text-cyan-300'
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            isActive
              ? isCriticalCloseApproach
                ? 'bg-amber-400 animate-ping'
                : 'bg-cyan-400 animate-ping'
              : 'bg-slate-400'
          }`}
        />
        <div className="flex items-center gap-1.5">
          {isCriticalCloseApproach && (
            <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/50 rounded font-bold text-[9px] animate-pulse">
              CLOSE APPROACH (&lt;0.05 AU)
            </span>
          )}
          <span>
            {isActive ? 'TARGET LOCKED:' : 'TRACKING PAUSED:'}{' '}
            <span className="font-bold text-white">{currentObject.name}</span> (SNR:{' '}
            {currentObject.radarSNR || '48.2'}dB)
          </span>
        </div>
      </div>
    </div>
  );
};


