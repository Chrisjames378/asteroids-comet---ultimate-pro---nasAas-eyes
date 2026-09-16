import React, { useState, useEffect } from 'react';
import { Radio, ShieldAlert, FastForward, Rewind, Pause, Play, Volume2, VolumeX, Radar, Space, Flame, Bot, Image as ImageIcon, Video } from 'lucide-react';
import { CelestialData } from '../types';
import { toggleAudioState, isAudioEnabled, playUiSound } from '../utils/audio';

interface HeaderProps {
  currentObject: CelestialData;
  simDate: Date;
  isPaused: boolean;
  timeMultiplier: number;
  isLiveRealtime: boolean;
  onTogglePause: () => void;
  onChangeSpeed: (delta: number) => void;
  onToggleLiveRealtime: () => void;
  onOpenModal: (modalId: 'radar' | 'dart' | 'impact' | 'ai' | 'image' | 'video') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentObject,
  simDate,
  isPaused,
  timeMultiplier,
  isLiveRealtime,
  onTogglePause,
  onChangeSpeed,
  onToggleLiveRealtime,
  onOpenModal,
}) => {
  const [audioOn, setAudioOn] = useState(false);

  useEffect(() => {
    setAudioOn(isAudioEnabled());
  }, []);

  const handleAudioToggle = () => {
    const newState = toggleAudioState();
    setAudioOn(newState);
    if (newState) {
      playUiSound(800, 0.08);
    }
  };

  const isHazardous = currentObject.hazard.includes('Torino') || currentObject.isAsteroid;

  return (
    <header className="h-16 bg-[#0a0f1d]/90 backdrop-blur-xl z-30 flex items-center justify-between px-4 md:px-6 border-b border-slate-700/50 shrink-0 shadow-2xl">
      {/* Left Title & Status */}
      <div className="flex items-center space-x-3.5">
        <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-950 to-blue-900 px-3 py-1.5 rounded-lg border border-blue-400/30 shadow-md">
          <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="font-extrabold tracking-wider text-[11px] md:text-xs text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-blue-300">
            NASA EYES ORBITAL COMMAND
          </span>
        </div>

        <div className="hidden sm:block">
          <h1 className="text-sm font-bold tracking-wide flex items-center gap-2">
            <span className="text-cyan-300 drop-shadow-[0_0_12px_rgba(6,182,212,0.8)] font-mono">
              {currentObject.name}
            </span>
            <span
              className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-semibold border ${
                isHazardous
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}
            >
              {currentObject.hazard.toUpperCase()}
            </span>
          </h1>
          <p className="text-[10px] text-slate-400">Planetary Defense & Multi-Body Orbital Telemetry</p>
        </div>
      </div>

      {/* Middle Simulation Time & Controls */}
      <div className="hidden lg:flex items-center space-x-3 text-xs">
        {/* Real-time Toggle & Status */}
        <button
          onClick={() => {
            onToggleLiveRealtime();
            playUiSound(700, 0.05);
          }}
          className={`px-3 py-1.5 rounded-lg font-mono text-[11px] font-bold border transition flex items-center gap-2 shadow-sm cursor-pointer ${
            isLiveRealtime
              ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300 shadow-emerald-900/30'
              : 'bg-amber-950/80 border-amber-500/60 text-amber-300 shadow-amber-900/30'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isLiveRealtime ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
            }`}
          />
          <span>{isLiveRealtime ? 'REAL-TIME LIVE' : 'TIME WARP MODE'}</span>
        </button>

        <div className="flex items-center space-x-2 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-700/60 font-mono text-[11px]">
          <span className="text-slate-400">UTC:</span>
          <span className="text-cyan-400 font-semibold">
            {simDate.toISOString().replace('T', ' ').substring(0, 19)} UTC
          </span>
        </div>

        <div className="flex items-center space-x-1.5 bg-slate-900/60 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => {
              onChangeSpeed(-10);
              playUiSound(400, 0.04);
            }}
            title="Slow Down"
            className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition"
          >
            <Rewind className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              onTogglePause();
              playUiSound(500, 0.05);
            }}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-semibold transition flex items-center gap-1 text-[11px] shadow-sm"
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            {isPaused ? 'Play' : 'Pause'}
          </button>
          <button
            onClick={() => {
              onChangeSpeed(10);
              playUiSound(600, 0.04);
            }}
            title="Speed Up"
            className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition"
          >
            <FastForward className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[11px] text-amber-400 font-bold px-2">
            {isLiveRealtime ? '1x Realtime' : `${timeMultiplier}x`}
          </span>
        </div>
      </div>

      {/* Right Action Suite Buttons */}
      <div className="flex items-center space-x-2">
        <button
          onClick={handleAudioToggle}
          title="Toggle SFX"
          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 border ${
            audioOn
              ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-200'
              : 'bg-slate-900/60 border-slate-700/60 text-slate-400 hover:text-white'
          }`}
        >
          {audioOn ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{audioOn ? 'Audio On' : 'Audio Off'}</span>
        </button>

        <button
          onClick={() => {
            onOpenModal('radar');
            playUiSound(700, 0.06);
          }}
          className="px-3 py-1.5 bg-gradient-to-r from-cyan-900/70 to-blue-900/70 hover:from-cyan-800/80 hover:to-blue-800/80 text-cyan-200 rounded-lg text-xs font-medium transition flex items-center gap-1.5 border border-cyan-500/40 shadow-sm"
        >
          <Radar className="w-3.5 h-3.5 text-cyan-300" />
          <span className="hidden md:inline">Radar Ping</span>
        </button>

        <button
          onClick={() => {
            onOpenModal('dart');
            playUiSound(700, 0.06);
          }}
          className="px-3 py-1.5 bg-gradient-to-r from-amber-900/70 to-orange-900/70 hover:from-amber-800/80 hover:to-orange-800/80 text-amber-200 rounded-lg text-xs font-medium transition flex items-center gap-1.5 border border-amber-500/40 shadow-sm"
        >
          <Space className="w-3.5 h-3.5 text-amber-300" />
          <span className="hidden md:inline">DART Deflection</span>
        </button>

        <button
          onClick={() => {
            onOpenModal('impact');
            playUiSound(700, 0.06);
          }}
          className="px-3 py-1.5 bg-gradient-to-r from-rose-900/70 to-red-900/70 hover:from-rose-800/80 hover:to-red-800/80 text-rose-200 rounded-lg text-xs font-medium transition flex items-center gap-1.5 border border-rose-500/40 shadow-sm"
        >
          <Flame className="w-3.5 h-3.5 text-rose-300" />
          <span className="hidden md:inline">Impact Sandbox</span>
        </button>

        <button
          onClick={() => {
            onOpenModal('image');
            playUiSound(720, 0.06);
          }}
          className="px-2.5 py-1.5 bg-gradient-to-r from-emerald-900/70 to-teal-900/70 hover:from-emerald-800/80 hover:to-teal-800/80 text-emerald-200 rounded-lg text-xs font-medium transition flex items-center gap-1.5 border border-emerald-500/40 shadow-sm"
          title="Create & Edit Deep Space Images with Gemini 3.1 Flash Image"
        >
          <ImageIcon className="w-3.5 h-3.5 text-emerald-300" />
          <span className="hidden xl:inline">Image Lab</span>
        </button>

        <button
          onClick={() => {
            onOpenModal('video');
            playUiSound(740, 0.06);
          }}
          className="px-2.5 py-1.5 bg-gradient-to-r from-pink-900/70 to-rose-900/70 hover:from-pink-800/80 hover:to-rose-800/80 text-pink-200 rounded-lg text-xs font-medium transition flex items-center gap-1.5 border border-pink-500/40 shadow-sm"
          title="Animate 3D Flyby Space Videos with Veo"
        >
          <Video className="w-3.5 h-3.5 text-pink-300" />
          <span className="hidden xl:inline">Veo Recon</span>
        </button>

        <button
          onClick={() => {
            onOpenModal('ai');
            playUiSound(750, 0.08);
          }}
          className="px-3 py-1.5 bg-gradient-to-r from-purple-900/80 to-indigo-900/80 hover:from-purple-800/90 hover:to-indigo-800/90 text-purple-200 rounded-lg text-xs font-medium transition flex items-center gap-1.5 border border-purple-500/40 shadow-md shadow-purple-950/50"
        >
          <Bot className="w-3.5 h-3.5 text-purple-300 animate-bounce" />
          <span className="font-semibold">CNEOS AI</span>
        </button>
      </div>
    </header>
  );
};
