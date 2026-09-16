import React, { useState } from 'react';
import { X, Radar, Radio, CheckCircle2 } from 'lucide-react';
import { CelestialData } from '../types';
import { playRadarPingSound, playUiSound } from '../utils/audio';

interface RadarModalProps {
  isOpen: boolean;
  currentObject: CelestialData;
  onClose: () => void;
}

export const RadarModal: React.FC<RadarModalProps> = ({ isOpen, currentObject, onClose }) => {
  const [statusText, setStatusText] = useState('STATUS: READY TO PING TARGET');
  const [progressWidth, setProgressWidth] = useState('0%');
  const [roundTripTime, setRoundTripTime] = useState('12.48 seconds');
  const [dopplerShift, setDopplerShift] = useState('+14.2 Hz/s');
  const [isPinging, setIsPinging] = useState(false);

  if (!isOpen) return null;

  const handleTransmitPing = () => {
    if (isPinging) return;
    setIsPinging(true);
    playRadarPingSound();
    setStatusText('TRANSMITTING X-BAND (8560 MHz) PULSE TO GOLDSTONE DISH...');
    setProgressWidth('30%');

    setTimeout(() => {
      setStatusText('WAITING FOR ECHO RETURN (ROUND TRIP LIGHT TIME)...');
      setProgressWidth('70%');
    }, 650);

    setTimeout(() => {
      setStatusText('ECHO ACQUIRED: ASTROMETRY LOCKED SUCCESSFULLY');
      setProgressWidth('100%');
      setRoundTripTime((Math.random() * 8 + 8).toFixed(2) + ' seconds');
      setDopplerShift((Math.random() * 12 + 8).toFixed(1) + ' Hz/s');
      setIsPinging(false);
      playUiSound(1200, 0.15);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md">
      <div className="bg-[#0a0f1d]/95 w-11/12 max-w-lg rounded-2xl p-6 shadow-2xl border border-cyan-500/40 relative flex flex-col text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-cyan-900/40 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-md">
            <Radar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold">Goldstone Deep Radar Telemetry</h2>
            <p className="text-xs text-slate-400">
              Simulate X-band planetary radar bounce & Doppler frequency shift
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-slate-300">
          <div className="bg-slate-950/70 p-4 rounded-xl border border-cyan-500/30 font-mono text-center relative overflow-hidden">
            <div className="text-cyan-400 font-bold mb-1 flex items-center justify-center gap-1.5">
              <Radio className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
              {statusText}
            </div>
            <div className="text-[11px] text-slate-300 mt-1">
              Target Object: <span className="text-amber-400 font-bold">{currentObject.name}</span> |
              Freq: 8560 MHz (Goldstone DSS-14)
            </div>
            <div className="w-full h-1.5 bg-cyan-950 mt-3.5 rounded overflow-hidden relative border border-cyan-500/20">
              <div
                className="absolute left-0 top-0 bottom-0 bg-cyan-400 transition-all duration-500"
                style={{ width: progressWidth }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-mono">Round Trip Light Time (RTLT)</div>
              <div className="text-sm font-bold text-cyan-300 mt-1 font-mono">{roundTripTime}</div>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-mono">Doppler Velocity Shift</div>
              <div className="text-sm font-bold text-amber-400 mt-1 font-mono">{dopplerShift}</div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center">
          <button
            onClick={handleTransmitPing}
            disabled={isPinging}
            className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg text-xs font-semibold transition shadow-md shadow-cyan-950/50 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Radar className="w-3.5 h-3.5" />
            <span>Transmit Radar Pulse</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
