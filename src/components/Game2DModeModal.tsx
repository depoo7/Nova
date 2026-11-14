import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Box,
  Car,
  Compass,
  Crosshair,
  DoorOpen,
  Flame,
  Gamepad2,
  Grid,
  Navigation,
  PlaneLanding,
  Rocket,
  Sparkles,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { UI_COPY } from '../data/i18n';
import { PLANETS, SOLAR_ORBIT_RADII, SOLAR_SYSTEM_CENTER } from '../data/novaData';
import { useGameStore } from '../store/gameStore';
import type { InteriorStationId, PlanetId } from '../types/game';
import { SHUTTLE_ROOMS_ROSTER } from './AtriumDashboardModal';
import {
  DecisionReactive3DViewport,
  type DecisionVisualEvent,
  type DecisionVisualKind,
} from './DecisionReactive3DViewport';
import { FailureAndReportPanel } from './FailureAndReportPanel';
import { MissionControlCenterModal } from './MissionControlCenterModal';
import { Shuttle2DDesigner } from './Shuttle2DDesigner';
import { Spacecraft2DDashboard } from './Spacecraft2DDashboard';
import { SpaceOpsSystemsPanel } from './SpaceOpsSystemsPanel';
import { SystemsTechAndNasaPanel } from './SystemsTechAndNasaPanel';
import { WhatIfAndOrbitPanel } from './WhatIfAndOrbitPanel';
import { ORBIT_OPTIONS, SUBSYSTEM_OPTIONS } from '../data/missionArchitectData';

interface Ast2D {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  alive: boolean;
  respawn: number;
}

interface Bolt2D {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

interface Ring2D {
  x: number;
  y: number;
  cooldown: number;
}

interface Particle2D {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

interface SurfaceItem2D {
  id: string;
  kind: 'sample' | 'crater' | 'science' | 'monolith';
  x: number;
  y: number;
  labelAr: string;
  labelEn: string;
  dataMb?: number;
}

function buildPlanetSurfaceItems2D(planetId: PlanetId): SurfaceItem2D[] {
  const seed = planetId.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const angleOffset = (seed % 11) * 0.45;
  const items: SurfaceItem2D[] = [];

  for (let i = 0; i < 4; i++) {
    const a = angleOffset + i * 1.55;
    const dist = 110 + (i % 2) * 55;
    items.push({
      id: `${planetId}_sample_${i + 1}`,
      kind: 'sample',
      x: Math.cos(a) * dist,
      y: Math.sin(a) * dist,
      labelAr: `عينة معدنية #${i + 1}`,
      labelEn: `Mineral Sample #${i + 1}`,
    });
  }

  for (let i = 0; i < 2; i++) {
    const a = angleOffset + 0.8 + i * 3.1;
    items.push({
      id: `${planetId}_crater_${i + 1}`,
      kind: 'crater',
      x: Math.cos(a) * 165,
      y: Math.sin(a) * 145,
      labelAr: `فوهة نيزكية #${i + 1}`,
      labelEn: `Impact Crater #${i + 1}`,
    });
  }

  items.push({
    id: `${planetId}_science_1`,
    kind: 'science',
    x: Math.cos(angleOffset + 2.3) * 185,
    y: Math.sin(angleOffset + 2.3) * 160,
    labelAr: 'محطة رصد علمية (55 MB)',
    labelEn: 'Science Relay Station (55 MB)',
    dataMb: 55,
  });

  if (planetId === 'obsidian' || planetId === 'mars') {
    items.push({
      id: `${planetId}_monolith_2089`,
      kind: 'monolith',
      x: 0,
      y: -175,
      labelAr: 'مسلّة إشارة 2089 الغامضة',
      labelEn: '2089 Harmonic Monolith',
    });
  }

  return items;
}

export function Game2DModeModal() {
  const lang = useGameStore((s) => s.lang);
  const mode2dOpen = useGameStore((s) => s.mode2dOpen);
  const mode2dTab = useGameStore((s) => s.mode2dTab);
  const setMode2dOpen = useGameStore((s) => s.setMode2dOpen);
  const setMode2dTab = useGameStore((s) => s.setMode2dTab);
  const setArchitectOpen = useGameStore((s) => s.setArchitectOpen);

  const resources = useGameStore((s) => s.resources);
  const unlockedBudgetBonusM = useGameStore((s) => s.unlockedBudgetBonusM);
  const weather = useGameStore((s) => s.weather);
  const activePlanet = useGameStore((s) => s.activePlanet);
  const discoveredPlanets = useGameStore((s) => s.discoveredPlanets);
  const collectedSampleIds = useGameStore((s) => s.collectedSampleIds);
  const discoveredCraterIds = useGameStore((s) => s.discoveredCraterIds);
  const completedScienceSiteIds = useGameStore((s) => s.completedScienceSiteIds);
  const monolithInspected = useGameStore((s) => s.monolithInspected);
  const specialists = useGameStore((s) => s.specialists);
  const personnelEffects = useGameStore((s) => s.personnelEffects);
  const shipConfig = useGameStore((s) => s.shipConfig);
  const shipMetrics = useGameStore((s) => s.shipMetrics);
  const hullIntegrity = useGameStore((s) => s.hullIntegrity);
  const activeBlueprint = useGameStore((s) => s.activeBlueprint);
  const activeGroundStationId = useGameStore((s) => s.activeGroundStationId);
  const commsCompressionMode = useGameStore((s) => s.commsCompressionMode);
  const analysisFidelityMode = useGameStore((s) => s.analysisFidelityMode);
  const setActiveGroundStationId = useGameStore((s) => s.setActiveGroundStationId);
  const setCommsCompressionMode = useGameStore((s) => s.setCommsCompressionMode);
  const setAnalysisFidelityMode = useGameStore((s) => s.setAnalysisFidelityMode);
  const recordGroundPassDownlink = useGameStore((s) => s.recordGroundPassDownlink);

  const cycleWeather = useGameStore((s) => s.cycleWeather);
  const jumpToShuttleSection = useGameStore((s) => s.jumpToShuttleSection);
  const boardShipAndLaunch = useGameStore((s) => s.boardShipAndLaunch);
  const openMissionViz = useGameStore((s) => s.openMissionViz);
  const setTelescopeLabOpen = useGameStore((s) => s.setTelescopeLabOpen);
  const harvestBioBay = useGameStore((s) => s.harvestBioBay);
  const takeLoungeBreak = useGameStore((s) => s.takeLoungeBreak);
  const runMedBayScan = useGameStore((s) => s.runMedBayScan);
  const setTabletOpen = useGameStore((s) => s.setTabletOpen);
  const setDashboardOpen = useGameStore((s) => s.setDashboardOpen);
  const inspectCargoBay = useGameStore((s) => s.inspectCargoBay);
  const talkCommsOfficer = useGameStore((s) => s.talkCommsOfficer);
  const landOnPlanet = useGameStore((s) => s.landOnPlanet);

  const spaceCanvasRef = useRef<HTMLCanvasElement>(null);
  const planetCanvasRef = useRef<HTMLCanvasElement>(null);

  const keysRef = useRef<Set<string>>(new Set());
  const dpadRef = useRef({ up: false, down: false, left: false, right: false, boost: false });
  const spaceAutopilotRef = useRef<PlanetId | null>(null);

  const [nearbySpacePlanet2d, setNearbySpacePlanet2d] = useState<PlanetId | null>('luna');
  const [surfaceInRover2d, setSurfaceInRover2d] = useState(true);
  const [nearSurfaceItem, setNearSurfaceItem] = useState<SurfaceItem2D | null>(null);
  const [activePlanet2d, setActivePlanet2d] = useState<PlanetId>(activePlanet);
  const [spaceScoreTick, setSpaceScoreTick] = useState(0);
  const [show3dTwin, setShow3dTwin] = useState(true);
  const [decisionEvent, setDecisionEvent] = useState<DecisionVisualEvent | null>(null);

  const survivalScore = useGameStore((s) => s.survivalScore);
  const survivalFailures = useGameStore((s) => s.survivalFailures);
  const prevSyncRef = useRef({
    survivalScore,
    survivalFailures,
    weather,
    samples: collectedSampleIds.length,
    craters: discoveredCraterIds.length,
    scienceSites: completedScienceSiteIds.length,
    blueprintAt: activeBlueprint?.deployedAt || 0,
  });

  const pushDecisionEvent = (kind: DecisionVisualKind, labelAr: string, labelEn: string) => {
    setDecisionEvent({
      kind,
      labelAr,
      labelEn,
      seq: Date.now() + Math.floor(Math.random() * 1000),
    });
  };

  useEffect(() => {
    setActivePlanet2d(activePlanet);
  }, [activePlanet]);

  // Automatically trigger live 3D visual effects whenever store decisions settle inside 2D tabs
  useEffect(() => {
    const prev = prevSyncRef.current;
    if (survivalScore !== prev.survivalScore) {
      pushDecisionEvent('science', 'نجاح مهمة بقاء — تعزيز الأنظمة 3D', 'Survival Mission Solved — Systems Surge');
    } else if (survivalFailures !== prev.survivalFailures) {
      pushDecisionEvent('repair', 'إنذار ضرر بالهيكل — فحص الدرع 3D', 'Hull Impact Alert — Shield Diagnostic');
    } else if (weather !== prev.weather) {
      pushDecisionEvent('weather', `تغير الطقس الفضائي: ${weather}`, `Space Weather Shift: ${weather}`);
    } else if (
      collectedSampleIds.length !== prev.samples ||
      discoveredCraterIds.length !== prev.craters ||
      completedScienceSiteIds.length !== prev.scienceSites
    ) {
      pushDecisionEvent('science', 'جمع عينة/مسح علمي كوكبي', 'Planetary Science Sample Logged');
    } else if ((activeBlueprint?.deployedAt || 0) !== prev.blueprintAt) {
      pushDecisionEvent('blueprint', 'تطبيق مخطط المهمة الهندسي على المركبة 3D', 'Applied Mission Blueprint to 3D Craft');
    }
    prevSyncRef.current = {
      survivalScore,
      survivalFailures,
      weather,
      samples: collectedSampleIds.length,
      craters: discoveredCraterIds.length,
      scienceSites: completedScienceSiteIds.length,
      blueprintAt: activeBlueprint?.deployedAt || 0,
    };
  }, [
    survivalScore,
    survivalFailures,
    weather,
    collectedSampleIds.length,
    discoveredCraterIds.length,
    completedScienceSiteIds.length,
    activeBlueprint?.deployedAt,
  ]);

  // Keyboard bindings while 2D mode is open
  useEffect(() => {
    if (!mode2dOpen) return;
    const onDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      keysRef.current.add(e.code);
      if (e.code === 'Space' || e.code === 'KeyF') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('nova-2d-action'));
      }
      if (e.code === 'KeyR' && mode2dTab === 'planet2d') {
        setSurfaceInRover2d((v) => !v);
      }
    };
    const onUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.code);
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      keysRef.current.clear();
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [mode2dOpen, mode2dTab]);

  // ==============================================================
  // TAB 1: 2D TOP-DOWN SPACEFLIGHT & MINING ENGINE
  // ==============================================================
  useEffect(() => {
    if (!mode2dOpen || mode2dTab !== 'space2d') return;
    const canvas = spaceCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 820;
    const H = 460;

    // Map all 9 3D heliocentric planet positions cleanly onto 2D space sector
    const sun2dX = W * 0.5;
    const sun2dY = H * 0.58;
    const mapScale = 0.24;
    const planets2d = PLANETS.map((p) => ({
      data: p,
      x: sun2dX + (p.position[0] - SOLAR_SYSTEM_CENTER[0]) * mapScale,
      y: sun2dY + (p.position[2] - SOLAR_SYSTEM_CENTER[2]) * mapScale,
      r: Math.max(9, Math.min(18, p.radius * 0.48)),
    }));

    const stars = Array.from({ length: 130 }, (_, i) => ({
      x: ((i * 73) % W),
      y: ((i * 137) % H),
      size: (i % 3 === 0 ? 1.8 : 1.0),
      alpha: 0.3 + ((i * 19) % 70) / 100,
    }));

    const asteroids: Ast2D[] = Array.from({ length: 24 }, (_, i) => {
      const angle = i * 0.72;
      const dist = 70 + (i * 23) % 210;
      return {
        x: W * 0.5 + Math.cos(angle) * dist * 1.45,
        y: H * 0.5 + Math.sin(angle) * dist * 0.85,
        vx: Math.cos(angle + 1.5) * 14,
        vy: Math.sin(angle + 1.5) * 14,
        r: 7 + (i % 4) * 2.5,
        alive: true,
        respawn: 0,
      };
    });

    const rings: Ring2D[] = [
      { x: W * 0.5, y: H * 0.56, cooldown: 0 },
      { x: W * 0.34, y: H * 0.42, cooldown: 0 },
      { x: W * 0.67, y: H * 0.44, cooldown: 0 },
      { x: W * 0.52, y: H * 0.25, cooldown: 0 },
      { x: W * 0.25, y: H * 0.65, cooldown: 0 },
    ];

    const bolts: Bolt2D[] = [];
    const particles: Particle2D[] = [];

    const ship = {
      x: W * 0.5,
      y: H * 0.78,
      angle: -Math.PI / 2,
      speed: 35,
      cooldown: 0,
    };

    let lastOrbitNotified: PlanetId | null = null;
    let frameId = 0;
    let lastTime = performance.now();

    const fireBolt = () => {
      if (ship.cooldown > 0) return;
      ship.cooldown = 0.22;
      const vx = Math.cos(ship.angle) * 340;
      const vy = Math.sin(ship.angle) * 340;
      bolts.push({
        x: ship.x + Math.cos(ship.angle) * 16,
        y: ship.y + Math.sin(ship.angle) * 16,
        vx,
        vy,
        life: 1.5,
      });
    };

    const onAction = () => fireBolt();
    window.addEventListener('nova-2d-action', onAction);

    const step = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      const keys = keysRef.current;
      const pad = dpadRef.current;

      const turnLeft = keys.has('KeyA') || keys.has('ArrowLeft') || pad.left;
      const turnRight = keys.has('KeyD') || keys.has('ArrowRight') || pad.right;
      const thrustFwd = keys.has('KeyW') || keys.has('ArrowUp') || pad.up;
      const thrustBack = keys.has('KeyS') || keys.has('ArrowDown') || pad.down;
      const boost = keys.has('ShiftLeft') || keys.has('ShiftRight') || pad.boost;

      if (turnLeft || turnRight || thrustFwd || thrustBack) {
        spaceAutopilotRef.current = null;
      }

      if (spaceAutopilotRef.current) {
        const target = planets2d.find((p) => p.data.id === spaceAutopilotRef.current);
        if (target) {
          const dx = target.x - ship.x;
          const dy = target.y - ship.y;
          const dist = Math.hypot(dx, dy);
          const targetAngle = Math.atan2(dy, dx);
          let diff = targetAngle - ship.angle;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          ship.angle += Math.max(-3.2 * dt, Math.min(3.2 * dt, diff * 4));
          ship.speed = 155;
          if (dist < target.r + 22) {
            spaceAutopilotRef.current = null;
            ship.speed = 20;
          }
        }
      } else {
        if (turnLeft) ship.angle -= 2.8 * dt;
        if (turnRight) ship.angle += 2.8 * dt;
        const targetSpd = boost ? 210 : thrustFwd ? 135 : thrustBack ? -50 : 32;
        ship.speed += (targetSpd - ship.speed) * Math.min(1, dt * 4.5);
      }

      ship.x += Math.cos(ship.angle) * ship.speed * dt;
      ship.y += Math.sin(ship.angle) * ship.speed * dt;

      if (ship.x < 18) ship.x = W - 18;
      if (ship.x > W - 18) ship.x = 18;
      if (ship.y < 18) ship.y = H - 18;
      if (ship.y > H - 18) ship.y = 18;

      if (ship.cooldown > 0) ship.cooldown -= dt;

      // Update bolts & asteroid mining
      for (let i = bolts.length - 1; i >= 0; i--) {
        const b = bolts[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.life -= dt;

        let hit = false;
        for (const a of asteroids) {
          if (!a.alive) continue;
          if (Math.hypot(b.x - a.x, b.y - a.y) < a.r + 4) {
            a.alive = false;
            a.respawn = 9;
            hit = true;
            for (let p = 0; p < 10; p++) {
              const ang = Math.random() * Math.PI * 2;
              particles.push({
                x: a.x,
                y: a.y,
                vx: Math.cos(ang) * (40 + Math.random() * 60),
                vy: Math.sin(ang) * (40 + Math.random() * 60),
                life: 0.5,
                color: '#fbbf24',
              });
            }
            useGameStore.getState().onAsteroidMined();
            setSpaceScoreTick((v) => v + 1);
            break;
          }
        }
        if (hit || b.life <= 0) bolts.splice(i, 1);
      }

      // Asteroids drift
      const currentWeather = useGameStore.getState().weather;
      const weatherMult = currentWeather === 'asteroid_squall' ? 1.85 : 1;
      for (const a of asteroids) {
        if (!a.alive) {
          a.respawn -= dt;
          if (a.respawn <= 0) a.alive = true;
          continue;
        }
        a.x += a.vx * weatherMult * dt;
        a.y += a.vy * weatherMult * dt;
        if (a.x < 0) a.x = W;
        if (a.x > W) a.x = 0;
        if (a.y < 0) a.y = H;
        if (a.y > H) a.y = 0;
      }

      // Warp Rings check
      for (const r of rings) {
        if (r.cooldown > 0) {
          r.cooldown -= dt;
          continue;
        }
        if (Math.hypot(ship.x - r.x, ship.y - r.y) < 18) {
          r.cooldown = 6;
          useGameStore.getState().onRingPassed();
          setSpaceScoreTick((v) => v + 1);
          for (let p = 0; p < 12; p++) {
            const ang = (p / 12) * Math.PI * 2;
            particles.push({
              x: r.x,
              y: r.y,
              vx: Math.cos(ang) * 70,
              vy: Math.sin(ang) * 70,
              life: 0.55,
              color: '#38bdf8',
            });
          }
        }
      }

      // Check nearby planet
      let nearId: PlanetId | null = null;
      for (const p of planets2d) {
        if (Math.hypot(ship.x - p.x, ship.y - p.y) < p.r + 28) {
          nearId = p.data.id;
          if (lastOrbitNotified !== p.data.id) {
            lastOrbitNotified = p.data.id;
            useGameStore.getState().onOrbitArrived(p.data.id);
          }
          break;
        }
      }
      setNearbySpacePlanet2d(nearId);

      for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.life -= dt;
        if (pt.life <= 0) particles.splice(i, 1);
      }

      // RENDER 2D SPACE SECTOR
      ctx.fillStyle =
        currentWeather === 'solar_flare'
          ? '#180a05'
          : currentWeather === 'ion_storm'
            ? '#080e24'
            : '#040812';
      ctx.fillRect(0, 0, W, H);

      // Subtle tactical grid
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.06)';
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 64) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y < H; y += 64) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      // Stars
      for (const s of stars) {
        ctx.fillStyle = `rgba(226, 232, 240, ${s.alpha})`;
        ctx.fillRect(s.x, s.y, s.size, s.size);
      }

      // Concentric Heliocentric Orbits + Central Sun
      for (const orb of SOLAR_ORBIT_RADII) {
        if (orb.planetId === 'luna') continue;
        ctx.beginPath();
        ctx.arc(sun2dX, sun2dY, orb.orbitRadius * mapScale, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
        ctx.setLineDash([4, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      const sunGrad = ctx.createRadialGradient(sun2dX, sun2dY, 2, sun2dX, sun2dY, 24);
      sunGrad.addColorStop(0, '#fffbeb');
      sunGrad.addColorStop(0.55, '#fde047');
      sunGrad.addColorStop(1, 'rgba(249, 115, 22, 0)');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(sun2dX, sun2dY, 24, 0, Math.PI * 2);
      ctx.fill();

      // Planets
      const disc = useGameStore.getState().discoveredPlanets;
      for (const p of planets2d) {
        const isDisc = disc.includes(p.data.id);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r + 14, 0, Math.PI * 2);
        ctx.strokeStyle = isDisc ? 'rgba(34, 211, 238, 0.3)' : 'rgba(255,255,255,0.1)';
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        const grad = ctx.createRadialGradient(p.x - p.r * 0.3, p.y - p.r * 0.3, 2, p.x, p.y, p.r);
        grad.addColorStop(0, p.data.atmosphereColor);
        grad.addColorStop(1, p.data.primaryColor);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();

        if (p.data.hasRings) {
          ctx.strokeStyle = p.data.ringColor || '#fbbf24';
          ctx.lineWidth = 2;
          ctx.beginPath();
          const ringTilt = p.data.id === 'uranus' ? 1.42 : 0.32;
          ctx.ellipse(p.x, p.y, p.r * 1.55, p.r * 0.42, ringTilt, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.fillStyle = '#e2e8f0';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        const shortLabel = p.data.name.en.split('(')[0].trim().toUpperCase();
        ctx.fillText(shortLabel, p.x, p.y + p.r + 13);
      }

      // Warp Rings
      for (const r of rings) {
        ctx.strokeStyle = r.cooldown > 0 ? 'rgba(148, 163, 184, 0.35)' : '#fbbf24';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(r.x, r.y, 12, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Asteroids
      for (const a of asteroids) {
        if (!a.alive) continue;
        ctx.fillStyle = '#78716c';
        ctx.strokeStyle = '#a8a29e';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Plasma Bolts
      ctx.fillStyle = '#38bdf8';
      for (const b of bolts) {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Particles
      for (const pt of particles) {
        ctx.fillStyle = pt.color;
        ctx.globalAlpha = Math.max(0, pt.life * 2);
        ctx.fillRect(pt.x - 2, pt.y - 2, 4, 4);
      }
      ctx.globalAlpha = 1;

      // 2D Space Shuttle Orbiter Sprite
      ctx.save();
      ctx.translate(ship.x, ship.y);
      ctx.rotate(ship.angle);
      // Thruster exhaust
      if (ship.speed > 40) {
        ctx.fillStyle = boost ? '#fbbf24' : '#38bdf8';
        ctx.beginPath();
        ctx.moveTo(-12, -4);
        ctx.lineTo(-22 - Math.random() * 8, 0);
        ctx.lineTo(-12, 4);
        ctx.closePath();
        ctx.fill();
      }
      // Delta wings & fuselage
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(16, 0);
      ctx.lineTo(-6, -13);
      ctx.lineTo(-12, -13);
      ctx.lineTo(-10, -4);
      ctx.lineTo(-14, 0);
      ctx.lineTo(-10, 4);
      ctx.lineTo(-12, 13);
      ctx.lineTo(-6, 13);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Cockpit glass
      ctx.fillStyle = '#0ea5e9';
      ctx.beginPath();
      ctx.ellipse(5, 0, 4.5, 2.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      frameId = requestAnimationFrame(step);
    };

    frameId = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('nova-2d-action', onAction);
    };
  }, [mode2dOpen, mode2dTab]);

  // ==============================================================
  // TAB 2: 2D TOP-DOWN PLANET & 6x6 ROVER ENGINE
  // ==============================================================
  useEffect(() => {
    if (!mode2dOpen || mode2dTab !== 'planet2d') return;
    const canvas = planetCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 820;
    const H = 460;
    const planet = PLANETS.find((p) => p.id === activePlanet2d) || PLANETS[0];
    const items = buildPlanetSurfaceItems2D(planet.id);

    const player = {
      x: 45,
      y: 35,
      angle: 0,
    };

    const scanNear = () => {
      const s = useGameStore.getState();
      for (const item of items) {
        const done =
          (item.kind === 'sample' && s.collectedSampleIds.includes(item.id)) ||
          (item.kind === 'crater' && s.discoveredCraterIds.includes(item.id)) ||
          (item.kind === 'science' && s.completedScienceSiteIds.includes(item.id)) ||
          (item.kind === 'monolith' && s.monolithInspected);
        if (done) continue;

        if (Math.hypot(player.x - item.x, player.y - item.y) <= 34) {
          if (item.kind === 'sample') s.onSampleCollected(item.id, planet.id);
          else if (item.kind === 'crater') s.onCraterDiscovered(item.id);
          else if (item.kind === 'science') s.onScienceSiteCompleted(item.id, item.dataMb || 55);
          else if (item.kind === 'monolith') s.onMonolithInspected();
          break;
        }
      }
    };

    window.addEventListener('nova-2d-action', scanNear);

    let frameId = 0;
    let lastTime = performance.now();

    const step = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      const keys = keysRef.current;
      const pad = dpadRef.current;
      let dx = 0;
      let dy = 0;
      if (keys.has('KeyA') || keys.has('ArrowLeft') || pad.left) dx -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight') || pad.right) dx += 1;
      if (keys.has('KeyW') || keys.has('ArrowUp') || pad.up) dy -= 1;
      if (keys.has('KeyS') || keys.has('ArrowDown') || pad.down) dy += 1;

      if (dx !== 0 || dy !== 0) {
        const len = Math.hypot(dx, dy);
        const speed = surfaceInRover2d ? 135 : 75;
        player.x += (dx / len) * speed * dt;
        player.y += (dy / len) * speed * dt;
        player.angle = Math.atan2(dy, dx);
      }

      player.x = Math.max(-W * 0.46, Math.min(W * 0.46, player.x));
      player.y = Math.max(-H * 0.44, Math.min(H * 0.44, player.y));

      const s = useGameStore.getState();
      let closest: SurfaceItem2D | null = null;
      for (const item of items) {
        const done =
          (item.kind === 'sample' && s.collectedSampleIds.includes(item.id)) ||
          (item.kind === 'crater' && s.discoveredCraterIds.includes(item.id)) ||
          (item.kind === 'science' && s.completedScienceSiteIds.includes(item.id)) ||
          (item.kind === 'monolith' && s.monolithInspected);
        if (done) continue;
        if (Math.hypot(player.x - item.x, player.y - item.y) <= 34) {
          closest = item;
          break;
        }
      }
      setNearSurfaceItem(closest);

      // RENDER 2D PLANETARY TERRAIN
      const cx = W / 2;
      const cy = H / 2;

      ctx.fillStyle = planet.skyColor || '#0f172a';
      ctx.fillRect(0, 0, W, H);

      // Terrain contour circles
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      [90, 175, 270, 360].forEach((rad) => {
        ctx.beginPath();
        ctx.arc(cx, cy, rad, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Landed Shuttle at (0,0)
      ctx.save();
      ctx.translate(cx, cy);
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(14, 14);
      ctx.lineTo(-14, 14);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#0ea5e9';
      ctx.fillRect(-3, -6, 6, 8);
      ctx.restore();

      // Draw surface collectibles
      for (const item of items) {
        const done =
          (item.kind === 'sample' && s.collectedSampleIds.includes(item.id)) ||
          (item.kind === 'crater' && s.discoveredCraterIds.includes(item.id)) ||
          (item.kind === 'science' && s.completedScienceSiteIds.includes(item.id)) ||
          (item.kind === 'monolith' && s.monolithInspected);

        const ix = cx + item.x;
        const iy = cy + item.y;

        ctx.save();
        ctx.globalAlpha = done ? 0.28 : 1;
        if (item.kind === 'sample') {
          ctx.fillStyle = '#22d3ee';
          ctx.beginPath();
          ctx.arc(ix, iy, 8, 0, Math.PI * 2);
          ctx.fill();
        } else if (item.kind === 'crater') {
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(ix, iy, 16, 0, Math.PI * 2);
          ctx.stroke();
        } else if (item.kind === 'science') {
          ctx.fillStyle = '#34d399';
          ctx.fillRect(ix - 9, iy - 9, 18, 18);
        } else {
          ctx.fillStyle = '#a855f7';
          ctx.beginPath();
          ctx.moveTo(ix, iy - 16);
          ctx.lineTo(ix + 10, iy);
          ctx.lineTo(ix, iy + 16);
          ctx.lineTo(ix - 10, iy);
          ctx.closePath();
          ctx.fill();
        }
        ctx.fillStyle = '#f8fafc';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(done ? '✓' : item.kind.toUpperCase(), ix, iy - 14);
        ctx.restore();
      }

      // Draw 6x6 Rover or EVA Astronaut
      ctx.save();
      ctx.translate(cx + player.x, cy + player.y);
      ctx.rotate(player.angle);
      if (surfaceInRover2d) {
        // 6x6 Rover chassis
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(-13, -8, 26, 16);
        ctx.fillStyle = '#0f172a';
        [-10, 0, 10].forEach((wx) => {
          ctx.fillRect(wx - 3, -12, 6, 4);
          ctx.fillRect(wx - 3, 8, 6, 4);
        });
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(6, -5, 5, 10);
      } else {
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(2, -3, 5, 6);
      }
      ctx.restore();

      frameId = requestAnimationFrame(step);
    };

    frameId = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('nova-2d-action', scanNear);
    };
  }, [mode2dOpen, mode2dTab, activePlanet2d, surfaceInRover2d]);

  if (!mode2dOpen) return null;

  const current2dPlanet = PLANETS.find((p) => p.id === activePlanet2d) || PLANETS[0];
  const nearbySpacePlanetObj = nearbySpacePlanet2d
    ? PLANETS.find((p) => p.id === nearbySpacePlanet2d)
    : null;

  const execute2dRoomDuty = (id: InteriorStationId) => {
    if (id === 'helm') {
      pushDecisionEvent('power', 'تشغيل قمرة القيادة ودفع المحرك', 'Flight Deck & Thruster Spool');
      setMode2dTab('space2d');
    } else if (id === 'nav') {
      setMode2dOpen(false);
      openMissionViz();
    } else if (id === 'science_lab') {
      setMode2dOpen(false);
      setTelescopeLabOpen(true);
    } else if (id === 'bio_bay') {
      harvestBioBay();
      pushDecisionEvent('lifesupport', 'تشغيل الزراعة المائية وضخ O2', 'Hydroponics Bio-O2 Surge');
    } else if (id === 'lounge') {
      takeLoungeBreak();
      pushDecisionEvent('lifesupport', 'راحة الطاقم واستعادة اللياقة', 'Crew Recovery & Vitality');
    } else if (id === 'med_bay') {
      runMedBayScan();
      pushDecisionEvent('repair', 'فحص الإشعاع والعيادة الطبية', 'Med-Bay Radiation Shield Check');
    } else if (id === 'engineering') {
      setMode2dOpen(false);
      setTabletOpen(true, 'builder');
    } else if (id === 'cargo_bay') {
      inspectCargoBay();
      pushDecisionEvent('repair', 'فحص عنبر الروفر 6×6 والهيكل', 'Cargo & Rover Structural Check');
    } else if (id === 'comms_desk') {
      talkCommsOfficer();
      pushDecisionEvent('comms', 'بث حزم البيانات لشبكة DSN', 'DSN Telemetry Laser Burst');
    } else if (id === 'airlock') {
      pushDecisionEvent('planet', 'تجهيز غرفة الضغط للهبوط الكوكبي', 'Airlock Planetary Surface Prep');
      setMode2dTab('planet2d');
    }
  };

  const twinTargetPlanetId: PlanetId =
    mode2dTab === 'space2d'
      ? nearbySpacePlanet2d || activePlanet2d
      : activePlanet2d;

  return (
    <div className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center bg-black/85 p-2 sm:p-4">
      <div className="nova-panel flex max-h-[95vh] w-full max-w-7xl flex-col overflow-hidden rounded-xl border border-cyan-400/40">
        {/* Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-[#070b12] px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-400/40 bg-cyan-500/15 text-cyan-300">
              <Gamepad2 className="h-4 w-4" />
            </div>
            <div>
              <div className="font-mono-tech text-[10px] font-bold tracking-widest text-cyan-400">
                {mode2dTab === 'dashboard2d'
                  ? '2D SPACECRAFT SURVIVAL CONSOLE • NASA & CSA RESOURCES'
                  : mode2dTab === 'designer2d'
                    ? '2D SHUTTLE CAD & UPGRADE WORKBENCH • LIVE 3D SYNC'
                    : '2D TACTICAL CONVERSION MODE • LIVE SYNCED'}
              </div>
              <h2 className="font-display text-sm font-bold text-white sm:text-base">
                {mode2dTab === 'dashboard2d'
                  ? lang === 'ar'
                    ? 'لوحة البقاء 2D داخل السفينة — تحديات حقيقية بموارد NASA و CSA'
                    : 'NOVA-7 2D Spacecraft Survival Dashboard — Live NASA & CSA Challenges'
                  : mode2dTab === 'designer2d'
                    ? lang === 'ar'
                      ? 'ورشة تصميم المكوك 2D — ترقية الأجزاء، توزيع الطاقة، واختبارات القسوة'
                      : '2D Shuttle Designer Workbench — Tier 1-4 Shop, Power Bus & Stress Tests'
                    : lang === 'ar'
                      ? 'وضع اللعبة 2D الكامل — تحليق وتعدين، روفر الكواكب، ومخطط الغرف الـ 10'
                      : 'Full Interactive 2D Mode — Spaceflight, Planet Rover & 10-Room Blueprint'}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap items-center gap-1 rounded-lg border border-white/10 bg-black/50 p-0.5">
              <button
                onClick={() => setMode2dTab('dashboard2d')}
                className={`rounded-md px-2.5 py-1 text-xs font-bold transition ${
                  mode2dTab === 'dashboard2d'
                    ? 'bg-rose-500 text-white'
                    : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                {lang === 'ar' ? 'لوحة البقاء 2D' : '2D Survival Dashboard'}
              </button>
              <button
                onClick={() => setMode2dTab('designer2d')}
                className={`rounded-md px-2.5 py-1 text-xs font-bold transition ${
                  mode2dTab === 'designer2d'
                    ? 'bg-amber-400 text-slate-950'
                    : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                {lang === 'ar' ? 'تصميم المكوك 2D' : '2D Shuttle Designer'}
              </button>
              <button
                onClick={() => setMode2dTab('ops2d')}
                className={`rounded-md px-2.5 py-1 text-xs font-bold transition ${
                  mode2dTab === 'ops2d'
                    ? 'bg-sky-400 text-slate-950'
                    : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                {lang === 'ar' ? 'الاتصالات والتحقق 2D' : 'Comms, DSN & Validation'}
              </button>
              <button
                onClick={() => setMode2dTab('space2d')}
                className={`rounded-md px-2.5 py-1 text-xs font-bold transition ${
                  mode2dTab === 'space2d'
                    ? 'bg-cyan-400 text-slate-950'
                    : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                {lang === 'ar' ? 'تحليق 2D بالفضاء' : '2D Spaceflight'}
              </button>
              <button
                onClick={() => setMode2dTab('planet2d')}
                className={`rounded-md px-2.5 py-1 text-xs font-bold transition ${
                  mode2dTab === 'planet2d'
                    ? 'bg-emerald-400 text-slate-950'
                    : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                {lang === 'ar' ? 'روفر الكوكب 2D' : '2D Planet & Rover'}
              </button>
              <button
                onClick={() => setMode2dTab('shuttle2d')}
                className={`rounded-md px-2.5 py-1 text-xs font-bold transition ${
                  mode2dTab === 'shuttle2d'
                    ? 'bg-violet-400 text-slate-950'
                    : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                {lang === 'ar' ? 'مخطط الغرف 2D' : '2D Rooms Blueprint'}
              </button>
              <button
                onClick={() => setMode2dTab('mcc2d')}
                className={`rounded-md px-2.5 py-1 text-xs font-bold transition ${
                  mode2dTab === 'mcc2d'
                    ? 'bg-cyan-400 text-slate-950'
                    : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                {lang === 'ar' ? 'مركز التحكم MCC' : 'MCC & Timeline'}
              </button>
              <button
                onClick={() => setMode2dTab('systems2d')}
                className={`rounded-md px-2.5 py-1 text-xs font-bold transition ${
                  mode2dTab === 'systems2d'
                    ? 'bg-emerald-400 text-slate-950'
                    : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                {lang === 'ar' ? 'الأنظمة 14 والتقنيات' : '14 Systems & Tech'}
              </button>
              <button
                onClick={() => setMode2dTab('whatif2d')}
                className={`rounded-md px-2.5 py-1 text-xs font-bold transition ${
                  mode2dTab === 'whatif2d'
                    ? 'bg-amber-400 text-slate-950'
                    : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                {lang === 'ar' ? 'ماذا لو؟ & المدارات' : 'What-If & Orbits'}
              </button>
              <button
                onClick={() => setMode2dTab('nasa2d')}
                className={`rounded-md px-2.5 py-1 text-xs font-bold transition ${
                  mode2dTab === 'nasa2d'
                    ? 'bg-sky-400 text-slate-950'
                    : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                {lang === 'ar' ? 'بعثات NASA والفريق' : 'NASA & Team'}
              </button>
              <button
                onClick={() => setMode2dTab('report2d')}
                className={`rounded-md px-2.5 py-1 text-xs font-bold transition ${
                  mode2dTab === 'report2d'
                    ? 'bg-rose-400 text-slate-950'
                    : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                {lang === 'ar' ? 'التقارير والفشل' : 'Reports & Forensics'}
              </button>
            </div>

            <button
              onClick={() => setShow3dTwin((v) => !v)}
              className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition ${
                show3dTwin
                  ? 'border-cyan-400/60 bg-cyan-500/25 text-cyan-200'
                  : 'border-white/15 bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              <Box className="h-3.5 w-3.5" />
              <span>{lang === 'ar' ? 'توأم 3D التفاعلي' : '3D Twin'}</span>
            </button>

            <button
              onClick={() => {
                setMode2dOpen(false);
                setArchitectOpen(true);
              }}
              className="flex items-center gap-1 rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-200 hover:bg-emerald-500/25"
            >
              <Rocket className="h-3.5 w-3.5" />
              <span>{lang === 'ar' ? 'مصمم المهمات 1-4' : 'Mission Design 1-4P'}</span>
            </button>

            <button
              onClick={() => setMode2dOpen(false)}
              className="flex items-center gap-1 rounded-lg border border-amber-400/40 bg-amber-500/15 px-3 py-1.5 text-xs font-bold text-amber-200 hover:bg-amber-500/25"
            >
              <DoorOpen className="h-3.5 w-3.5" />
              <span>{lang === 'ar' ? 'عودة لـ 3D' : 'Return 3D'}</span>
            </button>

            <button
              onClick={() => setMode2dOpen(false)}
              className="rounded-lg border border-white/15 bg-white/5 p-1.5 text-slate-300 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Live Synced Stats Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#0b1019] px-4 py-1.5 font-mono-tech text-[11px]">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-amber-300 font-bold">CR {resources.credits}</span>
            <span className={`font-bold ${unlockedBudgetBonusM >= 0 ? 'text-emerald-300' : 'text-rose-400'}`}>
              {lang === 'ar' ? 'تعديل الميزانية:' : 'BUDGET:'}{' '}
              {unlockedBudgetBonusM >= 0 ? `+$${unlockedBudgetBonusM}M` : `-$${Math.abs(unlockedBudgetBonusM)}M`}
            </span>
            <span className="text-cyan-300">PWR {Math.round(resources.battery)}%</span>
            <span className="text-emerald-200">O2 {Math.round(resources.suitO2)}%</span>
            <span className="text-violet-300">DATA {resources.dataStorage} MB</span>
            <span className="text-slate-300">
              {lang === 'ar' ? 'كواكب:' : 'WORLDS:'} {discoveredPlanets.length}/{PLANETS.length}
            </span>
          </div>
          <span className="text-slate-400" data-tick={spaceScoreTick}>
            {mode2dTab === 'dashboard2d'
              ? lang === 'ar'
                ? 'حل المهام قبل انتهاء الوقت — الفوز يرفع الفلوس والميزانية والخسارة تنقصهما'
                : 'Solve crises before timeout — wins expand & losses cut Credits & Budget'
              : mode2dTab === 'designer2d'
                ? lang === 'ar'
                  ? 'انقر على أجزاء المكوك للتطوير • وزّع طاقة المفاعل • شغّل اختبارات القسوة'
                  : 'Click shuttle zones to upgrade · Balance power bus · Run stress tests'
                : mode2dTab === 'ops2d'
                  ? lang === 'ar'
                    ? 'اختَر المحطة الأرضية والضغط والدقة الفيزيائية • التعديلات تغيّر أداء الـ 3D والـ HUD فوراً'
                    : 'Configure Ground Station, Compression & Fidelity · Changes drive 3D flight & HUD live'
                  : lang === 'ar'
                    ? 'WASD للحركة • Space / F للإطلاق والمسح • كل التقدم محفوظ باللعبة'
                    : 'WASD Move • Space / F Fire or Scan • Progress syncs 1:1 with 3D'}
          </span>
        </div>

        {/* Body + Persistent Interactive 3D Decision Twin */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          <div className={show3dTwin ? 'grid grid-cols-1 gap-3 xl:grid-cols-12' : 'block'}>
            <div className={show3dTwin ? 'xl:col-span-8 min-w-0' : 'w-full'}>
              {mode2dTab === 'dashboard2d' && <Spacecraft2DDashboard />}
              {mode2dTab === 'designer2d' && <Shuttle2DDesigner onDecisionEvent={pushDecisionEvent} />}
              {mode2dTab === 'mcc2d' && <MissionControlCenterModal embedded onDecisionEvent={pushDecisionEvent} />}
              {mode2dTab === 'systems2d' && <SystemsTechAndNasaPanel embedded initialSection="subsystems" onDecisionEvent={pushDecisionEvent} />}
              {mode2dTab === 'whatif2d' && <WhatIfAndOrbitPanel embedded onDecisionEvent={pushDecisionEvent} />}
              {mode2dTab === 'nasa2d' && <SystemsTechAndNasaPanel embedded initialSection="nasa" onDecisionEvent={pushDecisionEvent} />}
              {mode2dTab === 'report2d' && <FailureAndReportPanel embedded />}
              {mode2dTab === 'ops2d' && (() => {
                const planetOrbitMap: Record<PlanetId, string> = {
                  mercury: 'mercury_inner',
                  luna: 'lunar_llo',
                  mars: 'mars_tmi',
                  aetheris: 'europa_jo',
                  uranus: 'uranus_ice',
                  neptune: 'neptune_kuiper',
                  aurora: 'leo',
                  solaris: 'sso',
                  obsidian: 'geo',
                };
                const mappedOrbitId = planetOrbitMap[activePlanet] || 'lunar_llo';
                const liveOrbit = ORBIT_OPTIONS.find((o) => o.id === mappedOrbitId) || ORBIT_OPTIONS[0];
                const mappedCommsId =
                  shipConfig.commsId === 'com_subspace' || shipConfig.commsId === 'com_ka_array'
                    ? 'comms_kaband'
                    : shipConfig.commsId === 'com_deepspace'
                      ? 'comms_xband'
                      : 'comms_sband';
                const liveComms = SUBSYSTEM_OPTIONS.find((s) => s.id === mappedCommsId) || SUBSYSTEM_OPTIONS[6];
                const liveAdcs = SUBSYSTEM_OPTIONS.find((s) => s.id === (shipConfig.sensorId === 'sen_std' ? 'adcs_basic' : 'adcs_star')) || SUBSYSTEM_OPTIONS[9];
                const liveRawDataMb = activeBlueprint?.dataGenMbDay ?? (shipConfig.sensorId === 'sen_quantum' ? 480 : shipConfig.sensorId === 'sen_deep' ? 320 : 210);
                return (
                  <SpaceOpsSystemsPanel
                    lang={lang}
                    orbit={liveOrbit}
                    commsSys={liveComms}
                    adcsSys={liveAdcs}
                    rawDataGenMbDay={liveRawDataMb}
                    massOk={activeBlueprint ? activeBlueprint.totalMassKg <= activeBlueprint.maxLauncherPayloadKg : true}
                    powerOk={shipMetrics.netPower >= 0}
                    scienceOk={activeBlueprint ? activeBlueprint.effectiveScience >= activeBlueprint.targetScience : true}
                    lifetimeOk={hullIntegrity >= 45}
                    totalMassKg={activeBlueprint?.totalMassKg ?? 1450}
                    maxPayloadKg={activeBlueprint?.maxLauncherPayloadKg ?? 2400}
                    powerGenW={activeBlueprint?.powerGenW ?? shipMetrics.powerGen}
                    netPowerW={activeBlueprint?.netPowerW ?? shipMetrics.netPower}
                    effectiveScience={activeBlueprint?.effectiveScience ?? 115}
                    targetScience={activeBlueprint?.targetScience ?? 100}
                    selectedStationId={activeGroundStationId}
                    onSelectStationId={setActiveGroundStationId}
                    compressionMode={commsCompressionMode}
                    onChangeCompression={setCommsCompressionMode}
                    fidelityMode={analysisFidelityMode}
                    onChangeFidelityMode={setAnalysisFidelityMode}
                    storeBufferMb={resources.dataStorage}
                    storeTransmittedMb={resources.dataTransmitted}
                    onSyncDownlinkToStore={recordGroundPassDownlink}
                    onDecisionEvent={(kind, ar, en) =>
                      pushDecisionEvent(kind === 'comms' ? 'comms' : 'blueprint', ar, en)
                    }
                  />
                );
              })()}

          {mode2dTab === 'space2d' && (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
              <div className="relative overflow-hidden rounded-xl border border-cyan-400/30 bg-black lg:col-span-3">
                <canvas
                  ref={spaceCanvasRef}
                  width={820}
                  height={460}
                  onClick={() => window.dispatchEvent(new CustomEvent('nova-2d-action'))}
                  className="h-auto w-full cursor-crosshair block"
                />

                {nearbySpacePlanetObj && (
                  <div className="absolute bottom-3 start-3 flex items-center gap-2 rounded-lg border border-amber-400/50 bg-[#0b111c]/95 px-3 py-2 text-xs">
                    <span className="font-bold text-amber-200">
                      {lang === 'ar'
                        ? `قريب من ${nearbySpacePlanetObj.name.ar}`
                        : `Orbit: ${nearbySpacePlanetObj.name.en}`}
                    </span>
                    <button
                      onClick={() => {
                        setActivePlanet2d(nearbySpacePlanetObj.id);
                        setMode2dTab('planet2d');
                      }}
                      className="rounded bg-emerald-400 px-2.5 py-1 text-[11px] font-bold text-slate-950"
                    >
                      {lang === 'ar' ? 'هبوط 2D' : 'Land 2D'}
                    </button>
                    <button
                      onClick={() => {
                        setMode2dOpen(false);
                        landOnPlanet(nearbySpacePlanetObj.id);
                      }}
                      className="rounded bg-amber-400 px-2.5 py-1 text-[11px] font-bold text-slate-950"
                    >
                      {lang === 'ar' ? 'هبوط 3D' : 'Land 3D'}
                    </button>
                  </div>
                )}
              </div>

              {/* 2D Flight Control Panel */}
              <div className="flex flex-col gap-2.5">
                <div className="nasa-card rounded-xl p-3">
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                    <Navigation className="h-3.5 w-3.5" />
                    <span>{lang === 'ar' ? 'طيار آلي 2D للكواكب' : '2D Planet Autopilot'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {PLANETS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          spaceAutopilotRef.current = p.id;
                          setActivePlanet2d(p.id);
                          pushDecisionEvent('planet', `توجيه المسار نحو ${p.name.ar}`, `Plot 3D Course: ${p.name.en}`);
                        }}
                        className="rounded border border-white/10 bg-white/5 px-2 py-1.5 text-[11px] font-bold text-slate-200 hover:border-cyan-400/50 hover:bg-cyan-500/15"
                      >
                        {p.name[lang]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="nasa-card rounded-xl p-3 space-y-2">
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('nova-2d-action'))}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-cyan-400 py-2 text-xs font-bold text-slate-950"
                  >
                    <Crosshair className="h-4 w-4" />
                    <span>{lang === 'ar' ? 'إطلاق بلازما 2D [Space]' : 'Fire Plasma 2D [Space]'}</span>
                  </button>
                  <button
                    onClick={cycleWeather}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-amber-400/40 bg-amber-500/15 py-2 text-xs font-bold text-amber-200"
                  >
                    <Flame className="h-4 w-4" />
                    <span>{UI_COPY.weather[weather].name[lang]}</span>
                  </button>
                </div>

                {/* Touch / Click D-Pad */}
                <div className="nasa-card rounded-xl p-3">
                  <div className="mb-2 text-center text-[10px] font-bold text-slate-400">
                    {lang === 'ar' ? 'أزرار تحكم 2D' : '2D FLIGHT PAD'}
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <div />
                    <button
                      onPointerDown={() => (dpadRef.current.up = true)}
                      onPointerUp={() => (dpadRef.current.up = false)}
                      onPointerLeave={() => (dpadRef.current.up = false)}
                      className="flex items-center justify-center rounded border border-white/15 bg-white/10 py-2 text-white active:bg-cyan-500/40"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      onPointerDown={() => (dpadRef.current.boost = true)}
                      onPointerUp={() => (dpadRef.current.boost = false)}
                      onPointerLeave={() => (dpadRef.current.boost = false)}
                      className="flex items-center justify-center rounded border border-rose-400/35 bg-rose-500/20 py-2 text-rose-200"
                    >
                      <Zap className="h-4 w-4" />
                    </button>
                    <button
                      onPointerDown={() => (dpadRef.current.left = true)}
                      onPointerUp={() => (dpadRef.current.left = false)}
                      onPointerLeave={() => (dpadRef.current.left = false)}
                      className="flex items-center justify-center rounded border border-white/15 bg-white/10 py-2 text-white active:bg-cyan-500/40"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <button
                      onPointerDown={() => (dpadRef.current.down = true)}
                      onPointerUp={() => (dpadRef.current.down = false)}
                      onPointerLeave={() => (dpadRef.current.down = false)}
                      className="flex items-center justify-center rounded border border-white/15 bg-white/10 py-2 text-white active:bg-cyan-500/40"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button
                      onPointerDown={() => (dpadRef.current.right = true)}
                      onPointerUp={() => (dpadRef.current.right = false)}
                      onPointerLeave={() => (dpadRef.current.right = false)}
                      className="flex items-center justify-center rounded border border-white/15 bg-white/10 py-2 text-white active:bg-cyan-500/40"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {mode2dTab === 'planet2d' && (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
              <div className="relative overflow-hidden rounded-xl border border-emerald-400/30 bg-black lg:col-span-3">
                <canvas
                  ref={planetCanvasRef}
                  width={820}
                  height={460}
                  className="h-auto w-full block"
                />

                {nearSurfaceItem && (
                  <div className="absolute bottom-3 start-3 flex items-center gap-3 rounded-lg border border-cyan-400/50 bg-[#0b111c]/95 px-3.5 py-2 text-xs">
                    <span className="font-bold text-cyan-200">
                      {lang === 'ar' ? nearSurfaceItem.labelAr : nearSurfaceItem.labelEn}
                    </span>
                    <button
                      onClick={() => window.dispatchEvent(new CustomEvent('nova-2d-action'))}
                      className="rounded bg-cyan-400 px-3 py-1 font-bold text-slate-950"
                    >
                      {lang === 'ar' ? 'جمع / مسح [F]' : 'Collect / Scan [F]'}
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2.5">
                <div className="nasa-card rounded-xl p-3">
                  <div className="mb-2 flex items-center justify-between text-xs font-bold text-emerald-300">
                    <span>{current2dPlanet.name[lang]}</span>
                    <Compass className="h-4 w-4" />
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {PLANETS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setActivePlanet2d(p.id);
                          pushDecisionEvent('planet', `معاينة سطح ${p.name.ar}`, `Preview Surface: ${p.name.en}`);
                        }}
                        className={`rounded border px-2 py-1 text-[11px] font-bold ${
                          activePlanet2d === p.id
                            ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200'
                            : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        {p.name[lang]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="nasa-card rounded-xl p-3 space-y-2">
                  <button
                    onClick={() => setSurfaceInRover2d((v) => !v)}
                    className={`flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold ${
                      surfaceInRover2d
                        ? 'bg-amber-400 text-slate-950'
                        : 'border border-amber-400/40 bg-amber-500/15 text-amber-200'
                    }`}
                  >
                    <Car className="h-4 w-4" />
                    <span>
                      {surfaceInRover2d
                        ? lang === 'ar'
                          ? 'تبديل: رائد الفضاء [R]'
                          : 'Switch: Astronaut [R]'
                        : lang === 'ar'
                          ? 'ركوب الروفر 6×6 [R]'
                          : 'Board 6x6 Rover [R]'}
                    </span>
                  </button>
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('nova-2d-action'))}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-cyan-400 py-2 text-xs font-bold text-slate-950"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>{lang === 'ar' ? 'مسح / جمع [F]' : 'Scan / Collect [F]'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setMode2dOpen(false);
                      landOnPlanet(activePlanet2d);
                    }}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-emerald-400/40 bg-emerald-500/15 py-2 text-xs font-bold text-emerald-200"
                  >
                    <PlaneLanding className="h-4 w-4" />
                    <span>{lang === 'ar' ? 'دخول هذا الكوكب 3D' : 'Enter Planet in 3D'}</span>
                  </button>
                </div>

                <div className="nasa-card rounded-xl p-3 text-[11px] text-slate-300 space-y-1">
                  <div>
                    {lang === 'ar' ? 'العينات المجمعة:' : 'Samples Collected:'}{' '}
                    <span className="font-mono-tech font-bold text-cyan-300">
                      {collectedSampleIds.length}
                    </span>
                  </div>
                  <div>
                    {lang === 'ar' ? 'الفوهات المكتشفة:' : 'Craters Logged:'}{' '}
                    <span className="font-mono-tech font-bold text-amber-300">
                      {discoveredCraterIds.length}
                    </span>
                  </div>
                  <div>
                    {lang === 'ar' ? 'المواقع العلمية:' : 'Science Sites:'}{' '}
                    <span className="font-mono-tech font-bold text-emerald-300">
                      {completedScienceSiteIds.length}
                    </span>
                  </div>
                  <div>
                    {lang === 'ar' ? 'مسلّة 2089:' : '2089 Monolith:'}{' '}
                    <span className="font-mono-tech font-bold text-violet-300">
                      {monolithInspected ? '✓' : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {mode2dTab === 'shuttle2d' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-400/30 bg-[#0c121e] px-4 py-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-200">
                  <Grid className="h-4 w-4" />
                  <span>
                    {lang === 'ar'
                      ? 'المخطط المعماري 2D للمكوك (36م × 34م) — البهو الرئيسي + 10 غرف مغلقة + 10 متخصصين'
                      : '2D Architectural Blueprint (36m × 34m) — Central Atrium + 10 Rooms + 10 Specialists'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="hidden items-center gap-2 rounded-md border border-white/10 bg-black/40 px-2.5 py-1 text-[10px] font-mono-tech sm:flex">
                    <span className="text-orange-300">
                      {lang === 'ar' ? 'إصلاح' : 'REPAIR'} x{personnelEffects.repairSpeedMult.toFixed(2)}
                    </span>
                    <span className="text-slate-600">|</span>
                    <span className="text-cyan-300">
                      {lang === 'ar' ? 'علوم' : 'SCI'} x{personnelEffects.scienceRateMult.toFixed(2)}
                    </span>
                    <span className="text-slate-600">|</span>
                    <span className="text-emerald-300">
                      {lang === 'ar' ? 'توافق' : 'SYN'} {personnelEffects.synergyCount}/10
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setMode2dOpen(false);
                      setDashboardOpen(true, 'personnel');
                    }}
                    className="flex items-center gap-1.5 rounded border border-violet-400/40 bg-violet-500/20 px-2.5 py-1 text-xs font-bold text-violet-200 hover:bg-violet-500/30"
                  >
                    <Users className="h-3.5 w-3.5" />
                    <span>{lang === 'ar' ? 'إدارة الطاقم' : 'Assign Crew'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setMode2dOpen(false);
                      boardShipAndLaunch();
                    }}
                    className="flex items-center gap-1.5 rounded bg-cyan-400 px-3 py-1 text-xs font-bold text-slate-950"
                  >
                    <Rocket className="h-3.5 w-3.5" />
                    <span>{lang === 'ar' ? 'إقلاع للفضاء 3D' : 'Launch 3D'}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {/* Port Wing */}
                <div className="space-y-2.5 rounded-xl border border-cyan-400/20 bg-black/35 p-3">
                  <div className="font-mono-tech text-[10px] font-bold tracking-widest text-cyan-400">
                    PORT WING (WEST)
                  </div>
                  {SHUTTLE_ROOMS_ROSTER.filter((r) =>
                    ['science_lab', 'bio_bay', 'lounge'].includes(r.id)
                  ).map((r) => {
                    const stationed = specialists.filter((sp) => sp.assignedRoomId === r.id);
                    return (
                      <div key={r.id} className="nasa-card rounded-lg p-3">
                        <div className="flex items-center justify-between text-[10px] font-mono-tech text-slate-400">
                          <span>{r.roomCode}</span>
                          <span className={stationed.length > 0 ? 'text-cyan-300' : 'text-slate-500'}>
                            {stationed.length} {lang === 'ar' ? 'طاقم' : 'CREW'}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-white">
                          {lang === 'ar' ? r.titleAr : r.titleEn}
                        </div>
                        <div className="mt-1 space-y-0.5 text-[11px] text-cyan-300">
                          {stationed.length === 0 ? (
                            <span className="text-slate-500 italic">
                              {lang === 'ar' ? 'غرفة غير مأهولة' : 'Unstaffed compartment'}
                            </span>
                          ) : (
                            stationed.map((sp) => (
                              <div key={sp.id} className="flex items-center justify-between gap-1">
                                <span className="truncate">
                                  {sp.name[lang]}
                                </span>
                                {sp.idealRooms.includes(r.id) && (
                                  <span className="rounded bg-emerald-500/20 px-1 py-0.2 text-[9px] font-bold text-emerald-300">
                                    ★
                                  </span>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                        <div className="mt-2 flex gap-1.5">
                          <button
                            onClick={() => execute2dRoomDuty(r.id)}
                            className="flex-1 rounded bg-cyan-400 py-1 text-[10px] font-bold text-slate-950"
                          >
                            {lang === 'ar' ? r.actionAr : r.actionEn}
                          </button>
                          <button
                            onClick={() => {
                              setMode2dOpen(false);
                              jumpToShuttleSection(r.id);
                            }}
                            className="rounded border border-white/15 bg-white/5 px-2 py-1 text-[10px] font-bold text-slate-200"
                          >
                            3D
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Central Atrium & Spine */}
                <div className="space-y-2.5 rounded-xl border border-amber-400/25 bg-black/40 p-3">
                  <div className="font-mono-tech text-[10px] font-bold tracking-widest text-amber-400">
                    CENTRAL ATRIUM & SPINE
                  </div>
                  {SHUTTLE_ROOMS_ROSTER.filter((r) =>
                    ['helm', 'nav', 'med_bay', 'airlock'].includes(r.id)
                  ).map((r) => {
                    const stationed = specialists.filter((sp) => sp.assignedRoomId === r.id);
                    return (
                      <div key={r.id} className="nasa-card rounded-lg p-3">
                        <div className="flex items-center justify-between text-[10px] font-mono-tech text-slate-400">
                          <span>{r.roomCode}</span>
                          <span className={stationed.length > 0 ? 'text-amber-300' : 'text-slate-500'}>
                            {stationed.length} {lang === 'ar' ? 'طاقم' : 'CREW'}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-white">
                          {lang === 'ar' ? r.titleAr : r.titleEn}
                        </div>
                        <div className="mt-1 space-y-0.5 text-[11px] text-amber-300">
                          {stationed.length === 0 ? (
                            <span className="text-slate-500 italic">
                              {lang === 'ar' ? 'غرفة غير مأهولة' : 'Unstaffed compartment'}
                            </span>
                          ) : (
                            stationed.map((sp) => (
                              <div key={sp.id} className="flex items-center justify-between gap-1">
                                <span className="truncate">
                                  {sp.name[lang]}
                                </span>
                                {sp.idealRooms.includes(r.id) && (
                                  <span className="rounded bg-emerald-500/20 px-1 py-0.2 text-[9px] font-bold text-emerald-300">
                                    ★
                                  </span>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                        <div className="mt-2 flex gap-1.5">
                          <button
                            onClick={() => execute2dRoomDuty(r.id)}
                            className="flex-1 rounded bg-amber-400 py-1 text-[10px] font-bold text-slate-950"
                          >
                            {lang === 'ar' ? r.actionAr : r.actionEn}
                          </button>
                          <button
                            onClick={() => {
                              setMode2dOpen(false);
                              jumpToShuttleSection(r.id);
                            }}
                            className="rounded border border-white/15 bg-white/5 px-2 py-1 text-[10px] font-bold text-slate-200"
                          >
                            3D
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Starboard Wing */}
                <div className="space-y-2.5 rounded-xl border border-violet-400/20 bg-black/35 p-3">
                  <div className="font-mono-tech text-[10px] font-bold tracking-widest text-violet-400">
                    STARBOARD WING (EAST)
                  </div>
                  {SHUTTLE_ROOMS_ROSTER.filter((r) =>
                    ['engineering', 'cargo_bay', 'comms_desk'].includes(r.id)
                  ).map((r) => {
                    const stationed = specialists.filter((sp) => sp.assignedRoomId === r.id);
                    return (
                      <div key={r.id} className="nasa-card rounded-lg p-3">
                        <div className="flex items-center justify-between text-[10px] font-mono-tech text-slate-400">
                          <span>{r.roomCode}</span>
                          <span className={stationed.length > 0 ? 'text-violet-300' : 'text-slate-500'}>
                            {stationed.length} {lang === 'ar' ? 'طاقم' : 'CREW'}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-white">
                          {lang === 'ar' ? r.titleAr : r.titleEn}
                        </div>
                        <div className="mt-1 space-y-0.5 text-[11px] text-violet-300">
                          {stationed.length === 0 ? (
                            <span className="text-slate-500 italic">
                              {lang === 'ar' ? 'غرفة غير مأهولة' : 'Unstaffed compartment'}
                            </span>
                          ) : (
                            stationed.map((sp) => (
                              <div key={sp.id} className="flex items-center justify-between gap-1">
                                <span className="truncate">
                                  {sp.name[lang]}
                                </span>
                                {sp.idealRooms.includes(r.id) && (
                                  <span className="rounded bg-emerald-500/20 px-1 py-0.2 text-[9px] font-bold text-emerald-300">
                                    ★
                                  </span>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                        <div className="mt-2 flex gap-1.5">
                          <button
                            onClick={() => execute2dRoomDuty(r.id)}
                            className="flex-1 rounded bg-violet-400 py-1 text-[10px] font-bold text-slate-950"
                          >
                            {lang === 'ar' ? r.actionAr : r.actionEn}
                          </button>
                          <button
                            onClick={() => {
                              setMode2dOpen(false);
                              jumpToShuttleSection(r.id);
                            }}
                            className="rounded border border-white/15 bg-white/5 px-2 py-1 text-[10px] font-bold text-slate-200"
                          >
                            3D
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
            </div>

            {show3dTwin && (
              <div className="xl:col-span-4">
                <DecisionReactive3DViewport
                  targetPlanetId={twinTargetPlanetId}
                  externalEvent={decisionEvent}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
