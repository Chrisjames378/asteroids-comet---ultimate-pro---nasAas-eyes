import React, { useState } from 'react';
import { X, Flame, AlertTriangle, Activity, ShieldAlert } from 'lucide-react';
import { CelestialData } from '../types';

interface ImpactModalProps {
  isOpen: boolean;
  currentObject: CelestialData;
  onClose: () => void;
}

export const ImpactModal: React.FC<ImpactModalProps> = ({ isOpen, currentObject, onClose }) => {
  const [diameterM, setDiameterM] = useState(150);
  const [velocityKmS, setVelocityKmS] = useState(22);

  if (!isOpen) return null;

  // Impact Physics calculation
  const radiusM = diameterM / 2;
  const volumeM3 = (4 / 3) * Math.PI * Math.pow(radiusM, 3);
  const densityKgM3 = 2600; // Typical stony asteroid density
  const massKg = volumeM3 * densityKgM3;
  const velocityMS = velocityKmS * 1000;
  const energyJoules = 0.5 * massKg * Math.pow(velocityMS, 2);
  const energyMegatons = (energyJoules / 4.184e15).toFixed(1);

  const craterKm = (0.07 * Math.pow(parseFloat(energyMegatons), 0.33)).toFixed(2);
  const richter = (4.0 + Math.log10(parseFloat(energyMegatons)) * 0.42).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md">
      <div className="bg-[#0a0f1d]/95 w-11/12 max-w-xl rounded-2xl p-6 shadow-2xl border border-rose-500/40 relative flex flex-col text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-rose-900/40 border border-rose-400/40 flex items-center justify-center text-rose-300 shadow-md">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold">Planetary Impact Sandbox & Atmospheric Entry</h2>
            <p className="text-xs text-slate-400">
              Calculate kinetic energy release, crater size & seismic fallout for target <span className="text-rose-400 font-bold">{currentObject.name}</span>
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-slate-300">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
              <label className="block text-slate-400 mb-1 font-mono">
                Impactor Diameter: <span className="text-rose-400 font-bold">{diameterM} m</span>
              </label>
              <input
                type="range"
                min="10"
                max="2000"
                step="10"
                value={diameterM}
                onChange={(e) => setDiameterM(parseFloat(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer h-1.5 bg-slate-900 rounded"
              />
            </div>
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
              <label className="block text-slate-400 mb-1 font-mono">
                Impact Velocity: <span className="text-rose-400 font-bold">{velocityKmS} km/s</span>
              </label>
              <input
                type="range"
                min="5"
                max="75"
                step="1"
                value={velocityKmS}
                onChange={(e) => setVelocityKmS(parseFloat(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer h-1.5 bg-slate-900 rounded"
              />
            </div>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-xl border border-rose-500/30 space-y-2.5">
            <div className="text-rose-400 font-bold uppercase tracking-wider text-[11px] font-mono flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Ground Zero Impact Effects
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 font-mono">Energy Yield</div>
                <div className="text-sm font-bold text-amber-300 mt-1 font-mono">
                  {energyMegatons} Megatons TNT
                </div>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 font-mono">Crater Diameter</div>
                <div className="text-sm font-bold text-rose-400 mt-1 font-mono">
                  {craterKm} Kilometers
                </div>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 font-mono">Seismic Shock</div>
                <div className="text-sm font-bold text-cyan-400 mt-1 font-mono">
                  {richter} Richter
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition shadow cursor-pointer"
          >
            Close Sandbox
          </button>
        </div>
      </div>
    </div>
  );
};
