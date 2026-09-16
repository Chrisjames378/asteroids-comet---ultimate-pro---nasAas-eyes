export interface CelestialData {
  id: string;
  name: string;
  color: number; // Hex number for Three.js
  hexColor: string; // CSS hex string
  size: number;
  dist: number; // In scaled AU units
  speed: number;
  type: string;
  period: string;
  hazard: string;
  desc: string;
  diameter: string;
  velocity: string;
  distanceAU: string;
  absoluteMagH: string;
  isComet?: boolean;
  isAsteroid?: boolean;
  isPlanet?: boolean;
  isMoon?: boolean;
  isSpacecraft?: boolean;
  parentPlanet?: string;
  eccentricity?: number;
  inclination?: number;
  radarSNR?: number;
}

export type CameraMode = 'solar' | 'earth' | 'asteroid' | 'surface' | 'top';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export interface RadialDataPoint {
  month: string;
  distance: number;
}
