import React, { useState } from 'react';
import { X, Space, Zap, Compass, ArrowUpRight } from 'lucide-react';
import { CelestialData } from '../types';

interface DartModalProps {
  isOpen: boolean;
  currentObject: CelestialData;
  onClose: () => void;
}

export const DartModal: React.FC<DartModalProps> = ({ isOpen, currentObject, onClose }) => {
  const [massKg, setMassKg] = useState(620);
  const [velocityKmS, setVelocityKmS] = useState(6.5);

  if (!isOpen) return null;

  // Momentum calculation
  const momentumMNs = (massKg * velocityKmS * 1000) / 1e6;
  const beta = 2.2; // Momentum enhancement factor from ejecta feedback
  const deltaVmmS = (momentumMNs * beta / 4.2e9) * 1000;
  const missDistanceKm = Math.round(deltaVmmS * 1.5 * 5 * 1000);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md">
      <div className="bg-[#0a0f1d]/95 w-11/12 max-w-xl rounded-2xl p-6 shadow-2xl border border-amber-500/40 relative flex flex-col text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-amber-900/40 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-md">
            <Space className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold">Planetary Defense DART Mission Planner</h2>
            <p className="text-xs text-slate-400">
              Simulate kinetic impactor momentum transfer & orbit deflection for <span className="text-amber-400 font-bold">{currentObject.name}</span>
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-slate-300">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
              <label className="block text-slate-400 mb-1 font-mono">
                Spacecraft Dry Mass: <span className="text-amber-400 font-bold">{massKg} kg</span>
              </label>
              <input
                type="range"
                min="200"
                max="2500"
                step="20"
                value={massKg}
                onChange={(e) => setMassKg(parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-900 rounded"
              />
            </div>
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
              <label className="block text-slate-400 mb-1 font-mono">
                Impact Velocity: <span className="text-amber-400 font-bold">{velocityKmS} km/s</span>
              </label>
              <input
                type="range"
                min="2.0"
                max="25.0"
                step="0.5"
                value={velocityKmS}
                onChange={(e) => setVelocityKmS(parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-900 rounded"
              />
            </div>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-xl border border-amber-500/30 space-y-2.5">
            <div className="text-amber-400 font-bold uppercase tracking-wider text-[11px] font-mono flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Kinetic Deflection Physics Output
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 font-mono">Momentum Transfer</div>
                <div className="text-sm font-bold text-amber-300 mt-1 font-mono">
                  {momentumMNs.toFixed(2)} MN·s
                </div>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 font-mono">Velocity Shift ($\Delta v$)</div>
                <div className="text-sm font-bold text-cyan-400 mt-1 font-mono">
                  {deltaVmmS.toFixed(1)} mm/s
                </div>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 font-mono">Miss Distance (5 Yrs)</div>
                <div className="text-sm font-bold text-emerald-400 mt-1 font-mono">
                  {missDistanceKm.toLocaleString()} km
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold transition shadow cursor-pointer"
          >
            Close Mission Planner
          </button>
        </div>
      </div>
    </div>
  );
};
