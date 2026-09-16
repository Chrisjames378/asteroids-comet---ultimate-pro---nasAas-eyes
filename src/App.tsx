import React, { useState, useEffect } from 'react';
import { CELESTIAL_OBJECTS } from './data/celestialData';
import { CelestialData, CameraMode } from './types';
import { OrreryCanvas } from './components/OrreryCanvas';
import { Header } from './components/Header';
import { TargetSidebar } from './components/TargetSidebar';
import { TelemetryPanel } from './components/TelemetryPanel';
import { TimelineScrubber } from './components/TimelineScrubber';
import { RadarHUDOverlay } from './components/RadarHUDOverlay';
import { RadarModal } from './components/RadarModal';
import { DartModal } from './components/DartModal';
import { ImpactModal } from './components/ImpactModal';
import { AiCopilotModal } from './components/AiCopilotModal';
import { SpaceMediaModal } from './components/SpaceMediaModal';

export default function App() {
  const [celestialObjects, setCelestialObjects] = useState<Record<string, CelestialData>>(CELESTIAL_OBJECTS);
  const [currentFocus, setCurrentFocus] = useState<string>('2026_rf15');
  const [cameraMode, setCameraMode] = useState<CameraMode>('solar');

  // Shader & View Controls
  const [showOrbits, setShowOrbits] = useState<boolean>(true);
  const [showTails, setShowTails] = useState<boolean>(true);
  const [showMesh, setShowMesh] = useState<boolean>(true);
  const [showHud, setShowHud] = useState<boolean>(true);
  const [eclipticTiltDeg, setEclipticTiltDeg] = useState<number>(0);

  // Time & Simulation Controls
  const [simDate, setSimDate] = useState<Date>(new Date());
  const [timeMultiplier, setTimeMultiplier] = useState<number>(1);
  const [moonSpeedMultiplier, setMoonSpeedMultiplier] = useState<number>(0.5);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isLiveRealtime, setIsLiveRealtime] = useState<boolean>(true);

  // Active Modal State
  const [activeModal, setActiveModal] = useState<null | 'radar' | 'dart' | 'impact' | 'ai' | 'image' | 'video'>(null);
  const [isJplSyncing, setIsJplSyncing] = useState<boolean>(false);

  // Tick simulation clock synchronized to real-time or time-warp speed
  useEffect(() => {
    if (isPaused) return;

    if (isLiveRealtime) {
      const interval = setInterval(() => {
        setSimDate(new Date());
      }, 200);
      return () => clearInterval(interval);
    } else {
      const interval = setInterval(() => {
        setSimDate((prev) => {
          const next = new Date(prev);
          next.setMinutes(next.getMinutes() + timeMultiplier * 15);
          return next;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isPaused, isLiveRealtime, timeMultiplier]);

  const currentObject = celestialObjects[currentFocus] || celestialObjects['2026_rf15'];

  const handleSelectTarget = (id: string) => {
    setCurrentFocus(id);
  };

  const handleTogglePause = () => {
    setIsPaused((prev) => !prev);
  };

  const handleChangeSpeed = (delta: number) => {
    setIsLiveRealtime(false);
    setTimeMultiplier((prev) => Math.max(1, Math.min(500, prev + delta)));
  };

  const handleStepTime = (days: number) => {
    setIsLiveRealtime(false);
    setSimDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + days);
      return next;
    });
  };

  const handleScrubTime = (percent: number) => {
    setIsLiveRealtime(false);
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const targetDay = (percent / 100) * 365;
    const nextDate = new Date(startOfYear);
    nextDate.setDate(nextDate.getDate() + targetDay);
    setSimDate(nextDate);
  };

  const handleResetToday = () => {
    setSimDate(new Date());
    setTimeMultiplier(1);
    setIsLiveRealtime(true);
    setIsPaused(false);
  };

  const handleToggleLiveRealtime = () => {
    setIsLiveRealtime((prev) => {
      const next = !prev;
      if (next) {
        setSimDate(new Date());
        setTimeMultiplier(1);
        setIsPaused(false);
      }
      return next;
    });
  };

  const handleSyncJpl = async () => {
    setIsJplSyncing(true);
    try {
      const res = await fetch(`/api/jpl-horizons?target=${encodeURIComponent(currentObject.name)}`);
      const data = await res.json();
      if (data.ephemeris) {
        setCelestialObjects((prev) => ({
          ...prev,
          [currentFocus]: {
            ...prev[currentFocus],
            distanceAU: `${data.ephemeris.semiMajorAxisAU} AU`,
            velocity: `${(22 + Math.random() * 8).toFixed(1)} km/s`,
          },
        }));
      }
    } catch {
      // Fallback
    } finally {
      setTimeout(() => setIsJplSyncing(false), 800);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col select-none overflow-hidden bg-[#020617] text-slate-100 font-sans">
      {/* Top Command Header */}
      <Header
        currentObject={currentObject}
        simDate={simDate}
        isPaused={isPaused}
        timeMultiplier={timeMultiplier}
        isLiveRealtime={isLiveRealtime}
        onTogglePause={handleTogglePause}
        onChangeSpeed={handleChangeSpeed}
        onToggleLiveRealtime={handleToggleLiveRealtime}
        onOpenModal={(modal) => setActiveModal(modal)}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 relative flex overflow-hidden">
        {/* Three.js 3D Orrery */}
        <OrreryCanvas
          celestialObjects={celestialObjects}
          currentFocus={currentFocus}
          cameraMode={cameraMode}
          showOrbits={showOrbits}
          showTails={showTails}
          showMesh={showMesh}
          eclipticTiltDeg={eclipticTiltDeg}
          simDate={simDate}
          timeMultiplier={timeMultiplier}
          isPaused={isPaused}
          moonSpeedMultiplier={moonSpeedMultiplier}
          onSelectTarget={handleSelectTarget}
        />

        {/* Live Radar HUD Targeting Reticle */}
        <RadarHUDOverlay showHud={showHud} currentObject={currentObject} isPaused={isPaused} />

        {/* Left Catalog & Physics Settings Sidebar */}
        <TargetSidebar
          celestialObjects={celestialObjects}
          currentFocus={currentFocus}
          showOrbits={showOrbits}
          showTails={showTails}
          showMesh={showMesh}
          showHud={showHud}
          eclipticTiltDeg={eclipticTiltDeg}
          moonSpeedMultiplier={moonSpeedMultiplier}
          onSelectTarget={handleSelectTarget}
          onToggleOrbits={setShowOrbits}
          onToggleTails={setShowTails}
          onToggleMesh={setShowMesh}
          onToggleHud={setShowHud}
          onUpdateTilt={setEclipticTiltDeg}
          onUpdateMoonSpeed={setMoonSpeedMultiplier}
          onSyncJpl={handleSyncJpl}
          isJplSyncing={isJplSyncing}
        />

        {/* Right Telemetry & Cinematic Presets Sidebar */}
        <TelemetryPanel
          currentObject={currentObject}
          cameraMode={cameraMode}
          onSetCameraView={setCameraMode}
        />

        {/* Bottom Timeline Scrubber */}
        <TimelineScrubber
          simDate={simDate}
          isPaused={isPaused}
          isLiveRealtime={isLiveRealtime}
          timeMultiplier={timeMultiplier}
          onTogglePause={handleTogglePause}
          onStepTime={handleStepTime}
          onScrubTime={handleScrubTime}
          onResetToday={handleResetToday}
          onToggleLiveRealtime={handleToggleLiveRealtime}
        />
      </main>

      {/* Interactive Command Suite Modals */}
      <RadarModal
        isOpen={activeModal === 'radar'}
        currentObject={currentObject}
        onClose={() => setActiveModal(null)}
      />

      <DartModal
        isOpen={activeModal === 'dart'}
        currentObject={currentObject}
        onClose={() => setActiveModal(null)}
      />

      <ImpactModal
        isOpen={activeModal === 'impact'}
        currentObject={currentObject}
        onClose={() => setActiveModal(null)}
      />

      <AiCopilotModal
        isOpen={activeModal === 'ai'}
        currentObject={currentObject}
        onClose={() => setActiveModal(null)}
      />

      <SpaceMediaModal
        isOpen={activeModal === 'image' || activeModal === 'video'}
        activeTab={activeModal === 'video' ? 'video' : 'image'}
        currentObject={currentObject}
        onClose={() => setActiveModal(null)}
      />
    </div>
  );
}
