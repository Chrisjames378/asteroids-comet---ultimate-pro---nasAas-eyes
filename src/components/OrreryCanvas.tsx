import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ZoomIn, ZoomOut, RotateCw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RefreshCw, Compass } from 'lucide-react';
import { CelestialData, CameraMode } from '../types';
import { playUiSound } from '../utils/audio';

interface OrreryCanvasProps {
  celestialObjects: Record<string, CelestialData>;
  currentFocus: string;
  cameraMode: CameraMode;
  showOrbits: boolean;
  showTails: boolean;
  showMesh: boolean;
  eclipticTiltDeg: number;
  simDate: Date;
  timeMultiplier: number;
  isPaused: boolean;
  moonSpeedMultiplier?: number;
  onSelectTarget: (id: string) => void;
}

interface BodyEntry {
  group: THREE.Group;
  mesh: THREE.Mesh;
  orbitLine?: THREE.Line;
  angle: number;
  tail?: THREE.Points;
}

export const OrreryCanvas: React.FC<OrreryCanvasProps> = ({
  celestialObjects,
  currentFocus,
  cameraMode,
  showOrbits,
  showTails,
  showMesh,
  eclipticTiltDeg,
  timeMultiplier,
  isPaused,
  moonSpeedMultiplier = 1.0,
  onSelectTarget,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Refs for persistent Three.js instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const eclipticGroupRef = useRef<THREE.Group | null>(null);
  const celestialBodiesRef = useRef<Record<string, BodyEntry>>({});

  // 360° Spherical Polar Camera Controls state
  const sphericalRef = useRef({
    radius: 90,
    phi: Math.PI / 3.2, // pitch (0 = top, PI = bottom)
    theta: Math.PI / 4, // yaw (0..2*PI around Y axis)
  });

  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const isDraggingRef = useRef<boolean>(false);
  const previousMouseRef = useRef({ x: 0, y: 0 });
  const touchStartDistRef = useRef<number>(0);
  const cameraLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));

  // Initialize Three.js scene once
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Create Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020617, 0.0018);
    sceneRef.current = scene;

    // Create Camera
    const camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.1, 2000);
    camera.position.set(0, 50, 75);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Create Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const sunLight = new THREE.PointLight(0xfff5ea, 4.0, 900);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);

    // Starfield
    const starGeo = new THREE.BufferGeometry();
    const starCount = 6500;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 1500;
      starPositions[i + 1] = (Math.random() - 0.5) * 1500;
      starPositions[i + 2] = (Math.random() - 0.5) * 1500;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.9, transparent: true, opacity: 0.85 });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // Ecliptic Group
    const eclipticGroup = new THREE.Group();
    scene.add(eclipticGroup);
    eclipticGroupRef.current = eclipticGroup;

    // Ecliptic Grid
    const gridHelper = new THREE.GridHelper(180, 45, 0x1d4ed8, 0x1e293b);
    gridHelper.position.y = -3.0;
    gridHelper.name = 'ecliptic-grid';
    eclipticGroup.add(gridHelper);

    // Create Celestial Objects
    const celestialBodies: Record<string, BodyEntry> = {};

    Object.keys(celestialObjects).forEach((key) => {
      const data = celestialObjects[key];
      const group = new THREE.Group();

      let mesh: THREE.Mesh;
      let tailSystem: THREE.Points | undefined;

      if (key === 'sun') {
        const geometry = new THREE.SphereGeometry(data.size, 48, 48);
        const material = new THREE.MeshBasicMaterial({ color: data.color });
        mesh = new THREE.Mesh(geometry, material);

        const glowGeo = new THREE.SphereGeometry(data.size * 1.35, 32, 32);
        const glowMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.35 });
        group.add(new THREE.Mesh(glowGeo, glowMat));
      } else if (key === 'earth') {
        const geometry = new THREE.SphereGeometry(data.size, 36, 36);
        const material = new THREE.MeshStandardMaterial({ color: data.color, roughness: 0.5, metalness: 0.2 });
        mesh = new THREE.Mesh(geometry, material);

        // Moon
        const moonGeo = new THREE.SphereGeometry(0.38, 16, 16);
        const moonMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.9 });
        const moonMesh = new THREE.Mesh(moonGeo, moonMat);
        moonMesh.name = 'moon';
        moonMesh.position.set(3.6, 0, 0);
        group.add(moonMesh);
      } else if (data.isComet) {
        const geometry = new THREE.IcosahedronGeometry(data.size, 2);
        const material = new THREE.MeshStandardMaterial({
          color: data.color,
          roughness: 0.9,
          wireframe: !showMesh,
        });
        mesh = new THREE.Mesh(geometry, material);

        // Particle Tail
        const particleCount = 180;
        const particleGeo = new THREE.BufferGeometry();
        const pPos = new Float32Array(particleCount * 3);
        for (let p = 0; p < particleCount; p++) {
          pPos[p * 3] = (Math.random() - 0.5) * 0.5;
          pPos[p * 3 + 1] = (Math.random() - 0.5) * 0.5;
          pPos[p * 3 + 2] = -Math.random() * (data.size * 8);
        }
        particleGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
        const particleMat = new THREE.PointsMaterial({
          color: data.color,
          size: 0.35,
          transparent: true,
          opacity: 0.85,
        });
        tailSystem = new THREE.Points(particleGeo, particleMat);
        tailSystem.name = 'particle-tail';
        group.add(tailSystem);
      } else {
        const geometry = new THREE.IcosahedronGeometry(data.size, data.isAsteroid ? 1 : 3);
        const material = new THREE.MeshStandardMaterial({
          color: data.color,
          roughness: 0.8,
          metalness: 0.1,
          wireframe: !showMesh,
        });
        mesh = new THREE.Mesh(geometry, material);

        if (data.isAsteroid) {
          const particleCount = 120;
          const particleGeo = new THREE.BufferGeometry();
          const pPos = new Float32Array(particleCount * 3);
          for (let p = 0; p < particleCount; p++) {
            pPos[p * 3] = (Math.random() - 0.5) * 0.4;
            pPos[p * 3 + 1] = (Math.random() - 0.5) * 0.4;
            pPos[p * 3 + 2] = -Math.random() * (data.size * 5);
          }
          particleGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
          const particleMat = new THREE.PointsMaterial({
            color: data.color,
            size: data.isComet ? 0.4 : 0.25,
            transparent: true,
            opacity: 0.8,
          });
          tailSystem = new THREE.Points(particleGeo, particleMat);
          tailSystem.name = 'particle-tail';
          group.add(tailSystem);
        }
      }

      mesh.name = key;
      group.add(mesh);

      // Orbit Line
      let orbitLine: THREE.Line | undefined;
      if (data.dist > 0) {
        const orbitGeo = new THREE.BufferGeometry();
        const points = [];
        const segments = 320;
        const isComet = !!data.isComet;
        const isAsteroid = !!data.isAsteroid;

        for (let i = 0; i <= segments; i++) {
          const theta = (i / segments) * Math.PI * 2;
          const radiusX = data.dist * (isComet ? 1.75 : 1.0);
          const radiusZ = data.dist * (isComet ? 0.65 : 1.0);
          const inclFactor = Math.sin(theta * 3.5) * (isAsteroid || isComet ? 6.5 : 0.6);
          points.push(new THREE.Vector3(Math.cos(theta) * radiusX, inclFactor, Math.sin(theta) * radiusZ));
        }

        orbitGeo.setFromPoints(points);
        const orbitMat = new THREE.LineBasicMaterial({
          color: data.color,
          transparent: true,
          opacity: data.isAsteroid || data.isComet ? 0.65 : 0.3,
        });
        orbitLine = new THREE.Line(orbitGeo, orbitMat);
        orbitLine.name = `${key}_orbit`;
        eclipticGroup.add(orbitLine);
      }

      eclipticGroup.add(group);
      celestialBodies[key] = {
        group,
        mesh,
        orbitLine,
        angle: Math.random() * Math.PI * 2,
        tail: tailSystem,
      };
    });

    celestialBodiesRef.current = celestialBodies;

    // --- MOUSE & TOUCH 360° ORBIT + ZOOM HANDLERS ---
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        isDraggingRef.current = true;
        previousMouseRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - previousMouseRef.current.x;
      const deltaY = e.clientY - previousMouseRef.current.y;

      // Rotate camera in 360 degrees around all axes
      sphericalRef.current.theta -= deltaX * 0.006;
      sphericalRef.current.phi = Math.max(0.01, Math.min(Math.PI - 0.01, sphericalRef.current.phi + deltaY * 0.006));

      previousMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 1.08 : 0.92;
      sphericalRef.current.radius = Math.max(1.2, Math.min(450, sphericalRef.current.radius * zoomFactor));
    };

    // Touch gesture handling
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        previousMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        touchStartDistRef.current = Math.hypot(dx, dy);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && isDraggingRef.current) {
        const deltaX = e.touches[0].clientX - previousMouseRef.current.x;
        const deltaY = e.touches[0].clientY - previousMouseRef.current.y;

        sphericalRef.current.theta -= deltaX * 0.007;
        sphericalRef.current.phi = Math.max(0.01, Math.min(Math.PI - 0.01, sphericalRef.current.phi + deltaY * 0.007));

        previousMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const currentDist = Math.hypot(dx, dy);
        const delta = touchStartDistRef.current - currentDist;
        sphericalRef.current.radius = Math.max(1.2, Math.min(450, sphericalRef.current.radius + delta * 0.25));
        touchStartDistRef.current = currentDist;
      }
    };

    const handleTouchEnd = () => {
      isDraggingRef.current = false;
    };

    // Click Raycaster to select target
    const handleCanvasClick = (e: MouseEvent) => {
      if (!container || !cameraRef.current || !sceneRef.current) return;
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / container.clientWidth) * 2 - 1;
      const y = -((e.clientY - rect.top) / container.clientHeight) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

      const meshes: THREE.Mesh[] = [];
      (Object.values(celestialBodiesRef.current) as BodyEntry[]).forEach((b) => meshes.push(b.mesh));

      const intersects = raycaster.intersectObjects(meshes, false);
      if (intersects.length > 0) {
        const clickedName = intersects[0].object.name;
        if (clickedName && celestialObjects[clickedName]) {
          onSelectTarget(clickedName);
          playUiSound(700, 0.05);
        }
      }
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    domElement.addEventListener('wheel', handleWheel, { passive: false });
    domElement.addEventListener('touchstart', handleTouchStart, { passive: true });
    domElement.addEventListener('touchmove', handleTouchMove, { passive: true });
    domElement.addEventListener('touchend', handleTouchEnd);
    domElement.addEventListener('click', handleCanvasClick);

    // Resize Handler
    const handleResize = () => {
      if (!container || !cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = container.clientWidth / container.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      domElement.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      domElement.removeEventListener('wheel', handleWheel);
      domElement.removeEventListener('touchstart', handleTouchStart);
      domElement.removeEventListener('touchmove', handleTouchMove);
      domElement.removeEventListener('touchend', handleTouchEnd);
      domElement.removeEventListener('click', handleCanvasClick);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update Ecliptic Plane Tilt
  useEffect(() => {
    if (eclipticGroupRef.current) {
      eclipticGroupRef.current.rotation.x = THREE.MathUtils.degToRad(eclipticTiltDeg);
    }
  }, [eclipticTiltDeg]);

  // Update Orbit Visibility
  useEffect(() => {
    (Object.values(celestialBodiesRef.current) as BodyEntry[]).forEach((b) => {
      if (b.orbitLine) {
        b.orbitLine.visible = showOrbits;
      }
    });
  }, [showOrbits]);

  // Update Tail Visibility
  useEffect(() => {
    (Object.values(celestialBodiesRef.current) as BodyEntry[]).forEach((b) => {
      if (b.tail) {
        b.tail.visible = showTails;
      }
    });
  }, [showTails]);

  // Update Mesh Visibility
  useEffect(() => {
    Object.keys(celestialBodiesRef.current).forEach((key) => {
      if (key !== 'sun' && key !== 'earth') {
        celestialBodiesRef.current[key].mesh.visible = showMesh;
      }
    });
  }, [showMesh]);

  // Update Camera Preset Distances whenever cameraMode or currentFocus changes
  useEffect(() => {
    const targetData = celestialObjects[currentFocus];
    if (cameraMode === 'solar') {
      sphericalRef.current.radius = 90;
      sphericalRef.current.phi = Math.PI / 3.2;
      sphericalRef.current.theta = Math.PI / 4;
    } else if (cameraMode === 'earth') {
      sphericalRef.current.radius = 14;
      sphericalRef.current.phi = Math.PI / 2.8;
      sphericalRef.current.theta = Math.PI / 4;
    } else if (cameraMode === 'asteroid') {
      sphericalRef.current.radius = Math.max(6, (targetData?.size || 1) * 3.5 + 5);
      sphericalRef.current.phi = Math.PI / 2.8;
      sphericalRef.current.theta = Math.PI / 4;
    } else if (cameraMode === 'surface') {
      sphericalRef.current.radius = Math.max(1.8, (targetData?.size || 1) * 1.5 + 1);
      sphericalRef.current.phi = Math.PI / 2.1;
      sphericalRef.current.theta = Math.PI / 4;
    } else if (cameraMode === 'top') {
      sphericalRef.current.radius = 130;
      sphericalRef.current.phi = 0.001; // top-down
      sphericalRef.current.theta = 0;
    }
  }, [cameraMode, currentFocus, celestialObjects]);

  // Animation Frame Loop
  useEffect(() => {
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (!isPaused) {
        Object.keys(celestialBodiesRef.current).forEach((key) => {
          const body = celestialBodiesRef.current[key];
          const data = celestialObjects[key];
          if (!data || data.dist === 0) return;

          const isComet = !!data.isComet;
          const isAsteroid = !!data.isAsteroid;
          const isMoon = !!data.isMoon;
          const isSpacecraft = !!data.isSpacecraft;

          if ((isMoon || isSpacecraft) && data.parentPlanet && celestialBodiesRef.current[data.parentPlanet]) {
            const parentBody = celestialBodiesRef.current[data.parentPlanet];
            const parentPos = parentBody.group.position;

            if (key === 'iss') {
              body.angle += 0.045 * moonSpeedMultiplier * (timeMultiplier / 10);
              const r = 2.2;
              body.group.position.x = parentPos.x + Math.cos(body.angle) * r;
              body.group.position.y = parentPos.y + Math.sin(body.angle * 2.2) * 0.35;
              body.group.position.z = parentPos.z + Math.sin(body.angle) * r;
            } else if (key === 'hubble') {
              body.angle += 0.035 * moonSpeedMultiplier * (timeMultiplier / 10);
              const r = 2.8;
              body.group.position.x = parentPos.x + Math.cos(body.angle + 1.8) * r;
              body.group.position.y = parentPos.y + Math.cos(body.angle * 1.5) * 0.45;
              body.group.position.z = parentPos.z + Math.sin(body.angle + 1.8) * r;
            } else if (key === 'jwst') {
              body.angle += 0.015 * moonSpeedMultiplier * (timeMultiplier / 10);
              const r = 4.2; // Sun-Earth L2 halo orbit position
              body.group.position.x = parentPos.x + Math.cos(body.angle + 3.14) * r;
              body.group.position.y = parentPos.y + Math.sin(body.angle * 2.5) * 0.55;
              body.group.position.z = parentPos.z + Math.sin(body.angle + 3.14) * r;
            } else {
              body.angle += 0.02 * moonSpeedMultiplier * (timeMultiplier / 10);
              const orbitRadius = key === 'moon' ? 4.8 : key === 'europa' ? 5.5 : 6.8;

              body.group.position.x = parentPos.x + Math.cos(body.angle) * orbitRadius;
              body.group.position.y = parentPos.y + Math.sin(body.angle * 1.5) * 0.4;
              body.group.position.z = parentPos.z + Math.sin(body.angle) * orbitRadius;
            }
          } else {
            body.angle += data.speed * 0.012 * (timeMultiplier / 10);
            const incl = Math.sin(body.angle * 2.2) * (isAsteroid || isComet ? 6.5 : isSpacecraft ? 4.0 : 0.6);
            const radiusX = data.dist * (isComet ? 1.75 : 1.0);
            const radiusZ = data.dist * (isComet ? 0.65 : 1.0);

            body.group.position.x = Math.cos(body.angle) * radiusX;
            body.group.position.y = incl;
            body.group.position.z = Math.sin(body.angle) * radiusZ;
          }

          body.mesh.rotation.y += 0.012;

          // Orient particle tail away from the Sun (origin)
          if (body.tail) {
            const dir = body.group.position.clone().normalize();
            body.tail.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
          }

          // Moon rotation around Earth child mesh
          if (key === 'earth') {
            const moonMesh = body.group.getObjectByName('moon');
            if (moonMesh) {
              const moonAngle = Date.now() * 0.0016 * moonSpeedMultiplier;
              moonMesh.position.x = Math.cos(moonAngle) * 3.6;
              moonMesh.position.z = Math.sin(moonAngle) * 3.6;
            }
          }
        });
      }

      // Continuous auto-orbit if enabled
      if (autoRotate && !isDraggingRef.current) {
        sphericalRef.current.theta += 0.003;
      }

      // Camera Positioning using 360° Spherical Polar Coordinates with target lerping
      if (cameraRef.current) {
        const cam = cameraRef.current;
        const targetBody = celestialBodiesRef.current[currentFocus];
        const earthBody = celestialBodiesRef.current['earth'];

        const desiredLookAtPos = new THREE.Vector3();

        if (cameraMode === 'earth' && earthBody) {
          desiredLookAtPos.copy(earthBody.group.position);
        } else if ((cameraMode === 'asteroid' || cameraMode === 'surface') && targetBody) {
          desiredLookAtPos.copy(targetBody.group.position);
        } else {
          desiredLookAtPos.set(0, 0, 0);
        }

        // Smooth focal lookAt target interpolation
        cameraLookAtRef.current.lerp(desiredLookAtPos, 0.08);

        // Convert spherical polar coordinates to 3D position
        const r = sphericalRef.current.radius;
        const phi = sphericalRef.current.phi;
        const theta = sphericalRef.current.theta;

        const targetCamX = cameraLookAtRef.current.x + r * Math.sin(phi) * Math.sin(theta);
        const targetCamY = cameraLookAtRef.current.y + r * Math.cos(phi);
        const targetCamZ = cameraLookAtRef.current.z + r * Math.sin(phi) * Math.cos(theta);

        cam.position.lerp(new THREE.Vector3(targetCamX, targetCamY, targetCamZ), 0.12);
        cam.lookAt(cameraLookAtRef.current);
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPaused, timeMultiplier, cameraMode, currentFocus, celestialObjects, moonSpeedMultiplier, autoRotate]);

  // Floating HUD button handlers
  const handleZoomIn = () => {
    sphericalRef.current.radius = Math.max(1.2, sphericalRef.current.radius * 0.75);
    playUiSound(700, 0.04);
  };

  const handleZoomOut = () => {
    sphericalRef.current.radius = Math.min(450, sphericalRef.current.radius * 1.28);
    playUiSound(650, 0.04);
  };

  const handleOrbitLeft = () => {
    sphericalRef.current.theta += 0.35;
    playUiSound(680, 0.04);
  };

  const handleOrbitRight = () => {
    sphericalRef.current.theta -= 0.35;
    playUiSound(680, 0.04);
  };

  const handleOrbitUp = () => {
    sphericalRef.current.phi = Math.max(0.01, sphericalRef.current.phi - 0.25);
    playUiSound(680, 0.04);
  };

  const handleOrbitDown = () => {
    sphericalRef.current.phi = Math.min(Math.PI - 0.01, sphericalRef.current.phi + 0.25);
    playUiSound(680, 0.04);
  };

  const handleResetCamera = () => {
    sphericalRef.current.radius = 90;
    sphericalRef.current.phi = Math.PI / 3.2;
    sphericalRef.current.theta = Math.PI / 4;
    playUiSound(800, 0.06);
  };

  return (
    <div className="absolute inset-0 z-0 select-none">
      {/* 3D WebGL Canvas Mount */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating Interactive 360° Orbit & Zoom Camera Controls HUD */}
      <div className="absolute bottom-24 right-5 z-20 flex flex-col items-end space-y-2 pointer-events-auto">
        {/* Active Camera Axis Badge */}
        <div className="bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-cyan-500/40 text-[11px] font-mono text-cyan-300 flex items-center gap-1.5 shadow-xl">
          <Compass className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
          <span>360° All-Axes Orbit Active</span>
        </div>

        {/* 360° Directional Pad */}
        <div className="bg-slate-950/90 backdrop-blur-md p-2 rounded-2xl border border-slate-800 shadow-2xl flex flex-col items-center gap-1">
          {/* Top Orbit */}
          <button
            onClick={handleOrbitUp}
            title="Orbit View Up"
            className="w-8 h-8 rounded-lg bg-slate-900/90 hover:bg-cyan-900/60 text-slate-300 hover:text-cyan-200 border border-slate-700/60 flex items-center justify-center transition cursor-pointer"
          >
            <ArrowUp className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1">
            {/* Left Orbit */}
            <button
              onClick={handleOrbitLeft}
              title="Rotate 360° Left"
              className="w-8 h-8 rounded-lg bg-slate-900/90 hover:bg-cyan-900/60 text-slate-300 hover:text-cyan-200 border border-slate-700/60 flex items-center justify-center transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            {/* Reset View */}
            <button
              onClick={handleResetCamera}
              title="Reset 360° Camera View"
              className="w-8 h-8 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/50 flex items-center justify-center transition cursor-pointer font-bold"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            {/* Right Orbit */}
            <button
              onClick={handleOrbitRight}
              title="Rotate 360° Right"
              className="w-8 h-8 rounded-lg bg-slate-900/90 hover:bg-cyan-900/60 text-slate-300 hover:text-cyan-200 border border-slate-700/60 flex items-center justify-center transition cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Bottom Orbit */}
          <button
            onClick={handleOrbitDown}
            title="Orbit View Down"
            className="w-8 h-8 rounded-lg bg-slate-900/90 hover:bg-cyan-900/60 text-slate-300 hover:text-cyan-200 border border-slate-700/60 flex items-center justify-center transition cursor-pointer"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom In, Zoom Out & Auto Rotate Suite */}
        <div className="bg-slate-950/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-xl flex items-center space-x-1.5">
          <button
            onClick={handleZoomIn}
            title="Zoom In (or Mouse Wheel / Touch Pinch)"
            className="p-2 bg-slate-900 hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 rounded-lg border border-slate-800 transition cursor-pointer flex items-center gap-1 text-xs font-mono"
          >
            <ZoomIn className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Zoom In</span>
          </button>

          <button
            onClick={handleZoomOut}
            title="Zoom Out (or Mouse Wheel / Touch Pinch)"
            className="p-2 bg-slate-900 hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 rounded-lg border border-slate-800 transition cursor-pointer flex items-center gap-1 text-xs font-mono"
          >
            <ZoomOut className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Zoom Out</span>
          </button>

          <button
            onClick={() => setAutoRotate((prev) => !prev)}
            title="Toggle Continuous 360° Auto-Rotation"
            className={`p-2 rounded-lg border text-xs font-mono transition flex items-center gap-1 cursor-pointer ${
              autoRotate
                ? 'bg-purple-950/90 border-purple-500/50 text-purple-200'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <RotateCw className={`w-3.5 h-3.5 text-purple-400 ${autoRotate ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{autoRotate ? 'Auto Orbit ON' : 'Auto Orbit'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
