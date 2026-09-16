import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Target, Video, ShieldAlert, Sparkles, Activity } from 'lucide-react';
import { CelestialData, CameraMode } from '../types';
import { playUiSound } from '../utils/audio';

interface TelemetryPanelProps {
  currentObject: CelestialData;
  cameraMode: CameraMode;
  onSetCameraView: (mode: CameraMode) => void;
}

export const TelemetryPanel: React.FC<TelemetryPanelProps> = ({
  currentObject,
  cameraMode,
  onSetCameraView,
}) => {
  // Generate dynamic distance profile chart data based on target
  const generateChartData = (obj: CelestialData) => {
    const base = obj.dist || 1.0;
    const months = ['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov', 'Dec'];
    return months.map((month, idx) => {
      const variation = Math.sin(idx * 0.9 + obj.name.length) * (obj.isComet ? 0.45 : 0.15);
      return {
        month,
        distance: Math.max(0.1, Number((base + variation).toFixed(3))),
      };
    });
  };

  const chartData = generateChartData(currentObject);

  const isHazardous = currentObject.hazard.includes('Torino') || currentObject.isAsteroid;

  return (
    <aside className="absolute top-4 right-4 z-20 w-80 md:w-92 bg-[#0a0f1d]/90 backdrop-blur-xl rounded-xl p-4 border border-slate-700/50 shadow-2xl flex flex-col max-h-[calc(100vh-7.5rem)] overflow-y-auto custom-scrollbar">
      {/* Header & Center Button */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center space-x-2.5 overflow-hidden">
          <span
            className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm animate-pulse"
            style={{ backgroundColor: currentObject.hexColor }}
          />
          <h2 className="text-sm font-bold tracking-wide text-cyan-300 truncate">
            {currentObject.name}
          </h2>
        </div>
        <button
          onClick={() => {
            onSetCameraView('asteroid');
            playUiSound(600, 0.05);
          }}
          className="text-xs bg-blue-600/40 hover:bg-blue-600/60 border border-blue-400/50 px-2.5 py-1 rounded transition flex items-center gap-1.5 text-blue-200 font-semibold shadow-md cursor-pointer shrink-0"
        >
          <Target className="w-3.5 h-3.5 text-cyan-300" />
          <span>Track Object</span>
        </button>
      </div>

      {/* Telemetry Metrics Grid */}
      <div className="space-y-2 text-xs">
        <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 shadow-inner">
          <div className="text-slate-400 text-[10px] uppercase font-mono">Classification & Ephemeris</div>
          <div className="font-semibold text-slate-100 mt-0.5 truncate">{currentObject.type}</div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 shadow-inner">
            <div className="text-slate-400 text-[10px] uppercase font-mono">Mean Size / Diam</div>
            <div className="font-semibold text-slate-100 mt-0.5 font-mono">{currentObject.diameter}</div>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 shadow-inner">
            <div className="text-slate-400 text-[10px] uppercase font-mono">Orbital Velocity</div>
            <div className="font-semibold text-amber-400 mt-0.5 font-mono">{currentObject.velocity}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 shadow-inner">
            <div className="text-slate-400 text-[10px] uppercase font-mono">Close Approach AU</div>
            <div className="font-semibold text-emerald-400 mt-0.5 font-mono">{currentObject.distanceAU}</div>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 shadow-inner">
            <div className="text-slate-400 text-[10px] uppercase font-mono">Orbital Period</div>
            <div className="font-semibold text-slate-100 mt-0.5 font-mono">{currentObject.period}</div>
          </div>
        </div>

        <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 shadow-inner">
          <div className="flex justify-between items-center">
            <div className="text-slate-400 text-[10px] uppercase font-mono">Torino / Palermo Scale</div>
            <span
              className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border ${
                isHazardous
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}
            >
              {currentObject.hazard}
            </span>
          </div>
          <div className="font-medium text-slate-300 mt-1 text-[11px] truncate">
            Abs Mag H: <span className="text-cyan-300 font-mono">{currentObject.absoluteMagH}</span>
          </div>
        </div>

        {/* Radial Distance Profile Chart */}
        <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-700/60 mt-1 shadow-inner">
          <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1.5 font-mono">
            <span className="flex items-center gap-1">
              <Activity className="w-3 h-3 text-cyan-400" /> Radial AU Profile
            </span>
            <span className="text-cyan-400 font-bold">Perihelion Spectrum</span>
          </div>
          <div className="h-28 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDist" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#64748b" fontSize={9} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={9} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a0f1d',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '10px',
                    color: '#f8fafc',
                  }}
                  itemStyle={{ color: '#06b6d4' }}
                />
                <Area
                  type="monotone"
                  dataKey="distance"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorDist)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Cinematic Camera Views */}
      <div className="mt-3 pt-3 border-t border-slate-800">
        <div className="flex items-center space-x-1.5 mb-2">
          <Video className="w-3.5 h-3.5 text-amber-400" />
          <h3 className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
            Cinematic Camera Presets
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              onSetCameraView('solar');
              playUiSound(450, 0.04);
            }}
            className={`p-2 rounded text-xs font-medium transition text-center border shadow-sm ${
              cameraMode === 'solar'
                ? 'bg-blue-600/40 border-blue-400 text-white'
                : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            Solar System
          </button>
          <button
            onClick={() => {
              onSetCameraView('earth');
              playUiSound(450, 0.04);
            }}
            className={`p-2 rounded text-xs font-medium transition text-center border shadow-sm ${
              cameraMode === 'earth'
                ? 'bg-blue-600/40 border-blue-400 text-white'
                : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            Earth View
          </button>
          <button
            onClick={() => {
              onSetCameraView('asteroid');
              playUiSound(450, 0.04);
            }}
            className={`p-2 rounded text-xs font-medium transition text-center border shadow-sm ${
              cameraMode === 'asteroid'
                ? 'bg-blue-600/40 border-blue-400 text-white'
                : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            Follow Object
          </button>
          <button
            onClick={() => {
              onSetCameraView('surface');
              playUiSound(450, 0.04);
            }}
            className={`p-2 rounded text-xs font-medium transition text-center border shadow-sm ${
              cameraMode === 'surface'
                ? 'bg-gradient-to-r from-blue-900/60 to-cyan-900/60 border-cyan-400 text-cyan-200'
                : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            Surface Mesh
          </button>
        </div>
      </div>
    </aside>
  );
};
