import React, { useState } from 'react';
import { Target, RefreshCw, Sliders, Orbit, Sparkles, Box, Crosshair, Gauge, Moon } from 'lucide-react';
import { CelestialData } from '../types';
import { playUiSound } from '../utils/audio';

type CategoryFilter = 'all' | 'planets' | 'moons' | 'asteroids' | 'comets' | 'satellites';

interface TargetSidebarProps {
  celestialObjects: Record<string, CelestialData>;
  currentFocus: string;
  showOrbits: boolean;
  showTails: boolean;
  showMesh: boolean;
  showHud: boolean;
  eclipticTiltDeg: number;
  moonSpeedMultiplier: number;
  onSelectTarget: (id: string) => void;
  onToggleOrbits: (show: boolean) => void;
  onToggleTails: (show: boolean) => void;
  onToggleMesh: (show: boolean) => void;
  onToggleHud: (show: boolean) => void;
  onUpdateTilt: (val: number) => void;
  onUpdateMoonSpeed: (val: number) => void;
  onSyncJpl: () => void;
  isJplSyncing: boolean;
}

export const TargetSidebar: React.FC<TargetSidebarProps> = ({
  celestialObjects,
  currentFocus,
  showOrbits,
  showTails,
  showMesh,
  showHud,
  eclipticTiltDeg,
  moonSpeedMultiplier,
  onSelectTarget,
  onToggleOrbits,
  onToggleTails,
  onToggleMesh,
  onToggleHud,
  onUpdateTilt,
  onUpdateMoonSpeed,
  onSyncJpl,
  isJplSyncing,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

  const keys = Object.keys(celestialObjects);

  const getCategoryCount = (cat: CategoryFilter) => {
    if (cat === 'all') return keys.length;
    return keys.filter((key) => {
      const item = celestialObjects[key];
      if (cat === 'planets') return item.isPlanet || ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'].includes(key);
      if (cat === 'moons') return item.isMoon;
      if (cat === 'asteroids') return item.isAsteroid;
      if (cat === 'comets') return item.isComet;
      if (cat === 'satellites') return item.isSpacecraft;
      return true;
    }).length;
  };

  const filteredKeys = keys.filter((key) => {
    const item = celestialObjects[key];

    // Category check
    let matchesCategory = true;
    if (categoryFilter === 'planets') {
      matchesCategory = !!(item.isPlanet || ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'].includes(key));
    } else if (categoryFilter === 'moons') {
      matchesCategory = !!item.isMoon;
    } else if (categoryFilter === 'asteroids') {
      matchesCategory = !!item.isAsteroid;
    } else if (categoryFilter === 'comets') {
      matchesCategory = !!item.isComet;
    } else if (categoryFilter === 'satellites') {
      matchesCategory = !!item.isSpacecraft;
    }

    if (!matchesCategory) return false;

    // Search term check
    const matchName = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = item.type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchName || matchType;
  });

  return (
    <aside className="absolute top-4 left-4 z-20 w-84 md:w-88 bg-[#0a0f1d]/90 backdrop-blur-xl rounded-xl p-4 border border-slate-700/50 shadow-2xl flex flex-col max-h-[calc(100vh-7.5rem)] overflow-hidden">
      {/* Header & JPL Sync */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 mb-2.5 shrink-0">
        <div className="flex items-center space-x-2">
          <Target className="w-4 h-4 text-blue-400" />
          <h2 className="text-xs uppercase tracking-wider text-slate-300 font-semibold">
            Catalog & Real-Time Objects
          </h2>
        </div>
        <button
          onClick={onSyncJpl}
          disabled={isJplSyncing}
          className="text-[10px] bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 px-2.5 py-1 rounded font-mono border border-emerald-500/40 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${isJplSyncing ? 'animate-spin' : ''}`} />
          <span>{isJplSyncing ? 'Syncing...' : 'Sync JPL API'}</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 mb-2 overflow-x-auto custom-scrollbar pb-1 shrink-0 text-[10px]">
        {(['all', 'planets', 'moons', 'satellites', 'asteroids', 'comets'] as CategoryFilter[]).map((cat) => {
          const count = getCategoryCount(cat);
          const isActive = categoryFilter === cat;
          return (
            <button
              key={cat}
              onClick={() => {
                setCategoryFilter(cat);
                playUiSound(450, 0.03);
              }}
              className={`px-2 py-1 rounded-md font-mono capitalize transition whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span>{cat}</span>
              <span
                className={`text-[9px] px-1 rounded-full ${
                  isActive ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="mb-2.5 shrink-0">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search ISS, Hubble, JWST, probes, planets..."
          className="w-full bg-slate-950/80 border border-slate-700/60 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition shadow-inner font-mono"
        />
      </div>

      {/* Target List */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
        {filteredKeys.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-500 font-mono">
            No celestial bodies found matching filter
          </div>
        ) : (
          filteredKeys.map((key) => {
            const item = celestialObjects[key];
            const isSelected = currentFocus === key;
            return (
              <button
                key={key}
                onClick={() => {
                  onSelectTarget(key);
                  playUiSound(550, 0.05);
                }}
                className={`w-full text-left p-2.5 rounded-lg border transition flex items-center justify-between ${
                  isSelected
                    ? 'bg-blue-600/35 border-blue-400/80 text-white shadow-md'
                    : 'bg-slate-950/50 border-slate-800/80 text-slate-300 hover:bg-slate-800/50 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-2.5 overflow-hidden">
                  <span
                    className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: item.hexColor }}
                  />
                  <div className="truncate">
                    <div className="font-semibold text-xs leading-tight truncate flex items-center gap-1.5">
                      <span>{item.name}</span>
                      {item.isMoon && (
                        <span className="text-[9px] px-1 bg-amber-500/20 text-amber-300 rounded font-mono border border-amber-500/30">
                          MOON
                        </span>
                      )}
                      {item.isSpacecraft && (
                        <span className="text-[9px] px-1 bg-purple-500/20 text-purple-300 rounded font-mono border border-purple-500/30">
                          PROBE
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">{item.type}</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-cyan-400 font-bold shrink-0 ml-2">
                  {item.period}
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* Orrery & Shader Controls */}
      <div className="mt-2.5 pt-2.5 border-t border-slate-800 shrink-0">
        <div className="flex items-center space-x-1.5 mb-2">
          <Sliders className="w-3.5 h-3.5 text-emerald-400" />
          <h3 className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
            Orrery Controls & Moon Velocity
          </h3>
        </div>

        <div className="space-y-2 text-xs">
          {/* Moon Orbit Speed Control */}
          <div className="bg-slate-950/80 p-2.5 rounded-lg border border-amber-500/30 space-y-1.5">
            <div className="flex justify-between items-center text-[11px] text-amber-300 font-mono">
              <span className="flex items-center gap-1.5">
                <Moon className="w-3.5 h-3.5 text-amber-400" /> Moon Orbit Velocity
              </span>
              <span className="font-bold text-amber-400">{moonSpeedMultiplier.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="2.5"
              step="0.05"
              value={moonSpeedMultiplier}
              onChange={(e) => onUpdateMoonSpeed(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-900 rounded"
            />
            <div className="flex justify-between gap-1 text-[9px] font-mono text-slate-400 pt-0.5">
              <button
                onClick={() => onUpdateMoonSpeed(0.1)}
                className={`px-1.5 py-0.5 rounded ${
                  moonSpeedMultiplier === 0.1 ? 'bg-amber-500/30 text-amber-300 font-bold' : 'bg-slate-900 hover:text-white'
                }`}
              >
                0.1x (Slow)
              </button>
              <button
                onClick={() => onUpdateMoonSpeed(0.5)}
                className={`px-1.5 py-0.5 rounded ${
                  moonSpeedMultiplier === 0.5 ? 'bg-amber-500/30 text-amber-300 font-bold' : 'bg-slate-900 hover:text-white'
                }`}
              >
                0.5x (Normal)
              </button>
              <button
                onClick={() => onUpdateMoonSpeed(1.5)}
                className={`px-1.5 py-0.5 rounded ${
                  moonSpeedMultiplier === 1.5 ? 'bg-amber-500/30 text-amber-300 font-bold' : 'bg-slate-900 hover:text-white'
                }`}
              >
                1.5x (Fast)
              </button>
            </div>
          </div>

          <label className="flex items-center justify-between cursor-pointer hover:text-white text-slate-300">
            <span className="flex items-center gap-1.5 text-[11px]">
              <Orbit className="w-3.5 h-3.5 text-cyan-400" /> Orbit Trails
            </span>
            <input
              type="checkbox"
              checked={showOrbits}
              onChange={(e) => {
                onToggleOrbits(e.target.checked);
                playUiSound(350, 0.04);
              }}
              className="rounded bg-slate-950 border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer hover:text-white text-slate-300">
            <span className="flex items-center gap-1.5 text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" /> Comet Dust Tail Shader
            </span>
            <input
              type="checkbox"
              checked={showTails}
              onChange={(e) => {
                onToggleTails(e.target.checked);
                playUiSound(350, 0.04);
              }}
              className="rounded bg-slate-950 border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer hover:text-white text-slate-300">
            <span className="flex items-center gap-1.5 text-[11px]">
              <Box className="w-3.5 h-3.5 text-indigo-400" /> Procedural 3D Mesh
            </span>
            <input
              type="checkbox"
              checked={showMesh}
              onChange={(e) => {
                onToggleMesh(e.target.checked);
                playUiSound(350, 0.04);
              }}
              className="rounded bg-slate-950 border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer hover:text-white text-slate-300">
            <span className="flex items-center gap-1.5 text-[11px]">
              <Crosshair className="w-3.5 h-3.5 text-cyan-400" /> Radar Targeting HUD
            </span>
            <input
              type="checkbox"
              checked={showHud}
              onChange={(e) => {
                onToggleHud(e.target.checked);
                playUiSound(350, 0.04);
              }}
              className="rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
            />
          </label>

          <div className="pt-1 space-y-1">
            <div className="flex justify-between text-[11px] text-slate-300">
              <span>Ecliptic Plane 3D Tilt</span>
              <span className="font-mono text-cyan-400 font-bold">{eclipticTiltDeg}°</span>
            </div>
            <input
              type="range"
              min="-30"
              max="30"
              value={eclipticTiltDeg}
              onChange={(e) => onUpdateTilt(parseFloat(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer h-1 bg-slate-900 rounded"
            />
          </div>
        </div>
      </div>
    </aside>
  );
};

