import {
  Activity,
  Box,
  Crosshair,
  Flame,
  Radio,
  RotateCw,
  Shield,
  Wind,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { UI_COPY } from '../data/i18n';
import { PLANETS, SHIP_LIVERIES } from '../data/novaData';
import { useGameStore } from '../store/gameStore';
import {
  createCloudLayerTexture,
  createPlanetTexture,
  createRingTexture,
  createSoftGlowTexture,
} from '../three/proceduralTextures';
import { buildProceduralStarfighter } from '../three/shipBuilder';
import type { PlanetId, PlanetTextureKind, SpaceWeather } from '../types/game';

export type DecisionVisualKind =
  | 'science'
  | 'repair'
  | 'comms'
  | 'lifesupport'
  | 'power'
  | 'weather'
  | 'planet'
  | 'blueprint';

export interface DecisionVisualEvent {
  kind: DecisionVisualKind;
  labelAr: string;
  labelEn: string;
  seq: number;
}

interface DecisionReactive3DViewportProps {
  targetPlanetId: PlanetId;
  onTriggerSampleAction?: (kind: DecisionVisualKind) => void;
  externalEvent?: DecisionVisualEvent | null;
}

function detectSoftwareGl(): boolean {
  try {
    const testCanvas = document.createElement('canvas');
    const gl =
      (testCanvas.getContext('webgl2') as WebGL2RenderingContext | null) ||
      (testCanvas.getContext('webgl') as WebGLRenderingContext | null);
    if (!gl) return true;
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    const rendererStr = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || '') : '';
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(rendererStr);
  } catch {
    return true;
  }
}

export function DecisionReactive3DViewport({
  targetPlanetId,
  onTriggerSampleAction,
  externalEvent,
}: DecisionReactive3DViewportProps) {
  const lang = useGameStore((s) => s.lang);
  const weather = useGameStore((s) => s.weather);
  const shipConfig = useGameStore((s) => s.shipConfig);
  const shipMetrics = useGameStore((s) => s.shipMetrics);
  const resources = useGameStore((s) => s.resources);
  const activeBlueprint = useGameStore((s) => s.activeBlueprint);
  const spaceTelemetry = useGameStore((s) => s.spaceTelemetry);
  const hullIntegrity = useGameStore((s) => s.hullIntegrity);
  const digitalTwinState = useGameStore((s) => s.digitalTwinState);
  const cycleWeather = useGameStore((s) => s.cycleWeather);

  const mountRef = useRef<HTMLDivElement>(null);
  const [localEvent, setLocalEvent] = useState<DecisionVisualEvent | null>(null);
  const [orbitYawHint, setOrbitYawHint] = useState(0);

  // Synced reactive snapshot read inside Three.js RAF without recreating WebGL context
  const liveRef = useRef({
    targetPlanetId,
    weather,
    liveryId: shipConfig.liveryId,
    battery: resources.battery,
    suitO2: resources.suitO2,
    commsSignal: resources.commsSignal,
    hullIntegrity,
    digitalTwinState,
    shieldRatio: spaceTelemetry.maxShield > 0 ? spaceTelemetry.shield / spaceTelemetry.maxShield : 1,
    netPowerW: activeBlueprint ? activeBlueprint.netPowerW : shipMetrics.netPower,
    massOk: activeBlueprint ? activeBlueprint.totalMassKg <= activeBlueprint.maxLauncherPayloadKg : true,
    powerOk: activeBlueprint ? activeBlueprint.netPowerW >= 0 : shipMetrics.netPower >= 0,
    budgetOk: activeBlueprint ? activeBlueprint.totalCostM <= activeBlueprint.maxBudgetM : true,
    commsOk: activeBlueprint ? activeBlueprint.commsCapMbDay >= activeBlueprint.dataGenMbDay : true,
    lastSeq: -1,
    burstKind: 'science' as DecisionVisualKind,
    burstTimer: 0,
  });

  liveRef.current.targetPlanetId = targetPlanetId;
  liveRef.current.weather = weather;
  liveRef.current.liveryId = shipConfig.liveryId;
  liveRef.current.battery = resources.battery;
  liveRef.current.suitO2 = resources.suitO2;
  liveRef.current.commsSignal = resources.commsSignal;
  liveRef.current.hullIntegrity = hullIntegrity;
  liveRef.current.digitalTwinState = digitalTwinState;
  liveRef.current.shieldRatio =
    spaceTelemetry.maxShield > 0 ? spaceTelemetry.shield / spaceTelemetry.maxShield : 1;
  liveRef.current.netPowerW = activeBlueprint ? activeBlueprint.netPowerW : shipMetrics.netPower;
  liveRef.current.massOk = activeBlueprint
    ? activeBlueprint.totalMassKg <= activeBlueprint.maxLauncherPayloadKg
    : true;
  liveRef.current.powerOk = activeBlueprint
    ? activeBlueprint.netPowerW >= 0
    : shipMetrics.netPower >= 0;
  liveRef.current.budgetOk = activeBlueprint
    ? activeBlueprint.totalCostM <= activeBlueprint.maxBudgetM
    : true;
  liveRef.current.commsOk = activeBlueprint
    ? activeBlueprint.commsCapMbDay >= activeBlueprint.dataGenMbDay
    : true;

  const activeEvent =
    externalEvent && (!localEvent || externalEvent.seq >= localEvent.seq) ? externalEvent : localEvent;

  useEffect(() => {
    if (!activeEvent) return;
    if (activeEvent.seq !== liveRef.current.lastSeq) {
      liveRef.current.lastSeq = activeEvent.seq;
      liveRef.current.burstKind = activeEvent.kind;
      liveRef.current.burstTimer = 1.6;
    }
  }, [activeEvent]);

  const fireLocalEvent = (kind: DecisionVisualKind, labelAr: string, labelEn: string) => {
    const seq = Date.now() + Math.floor(Math.random() * 100);
    setLocalEvent({ kind, labelAr, labelEn, seq });
    onTriggerSampleAction?.(kind);
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareGl();
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    const initW = Math.max(260, container.clientWidth || 320);
    const initH = Math.max(210, container.clientHeight || 240);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(initW, initH);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.cursor = 'grab';

    container.replaceChildren(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#040814');

    const camera = new THREE.PerspectiveCamera(44, initW / initH, 0.1, 200);
    camera.position.set(4.8, 2.5, 8.2);
    camera.lookAt(0, 0.15, -0.6);

    // PMREM Studio/Orbital Environment
    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmrem.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();

    // Lighting
    const hemiLight = new THREE.HemisphereLight('#7dd3fc', '#0f172a', 0.9);
    const keySunLight = new THREE.DirectionalLight('#fff7ed', 2.4);
    keySunLight.position.set(9, 7, 6);
    const rimLight = new THREE.DirectionalLight('#38bdf8', 1.15);
    rimLight.position.set(-7, -3, -6);
    scene.add(hemiLight, keySunLight, rimLight);

    const maxAniso = isSoftwareGl ? 1 : Math.min(4, renderer.capabilities.getMaxAnisotropy());
    const disposables: Array<{ dispose: () => void }> = [envTarget, pmrem];

    // Starfield backdrop
    const starPositions = new Float32Array(260 * 3);
    for (let i = 0; i < 260; i++) {
      const r = 34 + (i % 19) * 1.4;
      const theta = i * 2.39996;
      const phi = Math.acos(1 - 2 * ((i + 0.5) / 260));
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.cos(phi);
      starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: '#e2e8f0',
      size: 0.14,
      transparent: true,
      opacity: 0.78,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);
    disposables.push(starGeo, starMat);

    // Orbit Pivot Group containing the composite Space Shuttle & reactive systems
    const shipPivot = new THREE.Group();
    shipPivot.position.set(-0.55, -0.15, 0.85);
    shipPivot.scale.setScalar(0.56);
    scene.add(shipPivot);

    const initLivery =
      SHIP_LIVERIES.find((l) => l.id === liveRef.current.liveryId) || SHIP_LIVERIES[0];
    const shipRig = buildProceduralStarfighter(initLivery, isSoftwareGl, maxAniso);
    shipPivot.add(shipRig.root);

    // 1. Reactive 3D Energy Shield Bubble (Wireframe + Translucent Shell)
    const shieldGeo = new THREE.IcosahedronGeometry(4.55, 2);
    const shieldWireMat = new THREE.MeshBasicMaterial({
      color: '#22d3ee',
      wireframe: true,
      transparent: true,
      opacity: 0.24,
      depthWrite: false,
    });
    const shieldShellGeo = new THREE.SphereGeometry(4.45, 24, 18);
    const shieldShellMat = new THREE.MeshBasicMaterial({
      color: '#0ea5e9',
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide,
      depthWrite: false,
    });
    const shieldWire = new THREE.Mesh(shieldGeo, shieldWireMat);
    const shieldShell = new THREE.Mesh(shieldShellGeo, shieldShellMat);
    shipPivot.add(shieldWire, shieldShell);
    disposables.push(shieldGeo, shieldWireMat, shieldShellGeo, shieldShellMat);

    // 2. Reactive Mass & Power Status Torus around Engines
    const powerRingGeo = new THREE.TorusGeometry(1.72, 0.055, 10, 40);
    const powerRingMat = new THREE.MeshBasicMaterial({
      color: '#34d399',
      transparent: true,
      opacity: 0.82,
    });
    const powerRing = new THREE.Mesh(powerRingGeo, powerRingMat);
    powerRing.position.set(0, 0.1, 2.75);
    shipPivot.add(powerRing);
    disposables.push(powerRingGeo, powerRingMat);

    // 3. Reactive Bio-O2 Life Support Halo around Flight Deck
    const bioRingGeo = new THREE.TorusGeometry(1.45, 0.04, 8, 36);
    bioRingGeo.rotateX(Math.PI / 2);
    const bioRingMat = new THREE.MeshBasicMaterial({
      color: '#10b981',
      transparent: true,
      opacity: 0.35,
    });
    const bioRing = new THREE.Mesh(bioRingGeo, bioRingMat);
    bioRing.position.set(0, 0.35, -1.65);
    shipPivot.add(bioRing);
    disposables.push(bioRingGeo, bioRingMat);

    // 4. Reactive 3D Science Scan Cone toward Planet
    const scanConeGeo = new THREE.ConeGeometry(1.55, 4.4, 24, 1, true);
    scanConeGeo.rotateX(-Math.PI / 2);
    scanConeGeo.translate(0, 0, -2.2);
    const scanConeMat = new THREE.MeshBasicMaterial({
      color: '#38bdf8',
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const scanCone = new THREE.Mesh(scanConeGeo, scanConeMat);
    scanCone.position.set(0, 0.1, -3.5);
    shipPivot.add(scanCone);
    disposables.push(scanConeGeo, scanConeMat);

    // 5. Reactive DSN Telemetry Downlink Beam + Moving Data Packet Spheres
    const dsnTargetPos = new THREE.Vector3(5.2, 3.8, -6.5);
    const dsnPoints = [new THREE.Vector3(0, 0.7, 0), dsnTargetPos.clone()];
    const dsnLineGeo = new THREE.BufferGeometry().setFromPoints(dsnPoints);
    const dsnLineMat = new THREE.LineBasicMaterial({
      color: '#34d399',
      transparent: true,
      opacity: 0.65,
    });
    const dsnLine = new THREE.Line(dsnLineGeo, dsnLineMat);
    scene.add(dsnLine);

    const dsnBeaconGeo = new THREE.OctahedronGeometry(0.22, 0);
    const dsnBeaconMat = new THREE.MeshBasicMaterial({ color: '#34d399' });
    const dsnBeacon = new THREE.Mesh(dsnBeaconGeo, dsnBeaconMat);
    dsnBeacon.position.copy(dsnTargetPos);
    scene.add(dsnBeacon);

    const packetGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const packetMat = new THREE.MeshBasicMaterial({ color: '#6ee7b7' });
    const packetCount = 6;
    const packets: THREE.Mesh[] = [];
    for (let i = 0; i < packetCount; i++) {
      const p = new THREE.Mesh(packetGeo, packetMat);
      scene.add(p);
      packets.push(p);
    }
    disposables.push(dsnLineGeo, dsnLineMat, dsnBeaconGeo, dsnBeaconMat, packetGeo, packetMat);

    // 6. Reactive 3D Target Planet + Rings + Moons
    const planetGroup = new THREE.Group();
    planetGroup.position.set(2.9, 0.85, -4.5);
    scene.add(planetGroup);

    const planetSphereGeo = new THREE.SphereGeometry(2.05, 36, 26);
    const planetTextureCache = new Map<
      PlanetTextureKind,
      ReturnType<typeof createPlanetTexture>
    >();
    const getPlanetMaps = (kind: PlanetTextureKind) => {
      let cached = planetTextureCache.get(kind);
      if (!cached) {
        cached = createPlanetTexture(kind, maxAniso);
        planetTextureCache.set(kind, cached);
      }
      return cached;
    };

    const initialPlanet = PLANETS.find((p) => p.id === liveRef.current.targetPlanetId) || PLANETS[0];
    const initialMaps = getPlanetMaps(initialPlanet.surfaceKind);
    const planetMat = new THREE.MeshStandardMaterial({
      map: initialMaps.map,
      bumpMap: initialMaps.bumpMap,
      bumpScale: 0.035,
      roughnessMap: initialMaps.roughnessMap,
      roughness: 0.82,
      metalness: 0.05,
      emissive: initialMaps.emissiveMap ? new THREE.Color('#ffffff') : new THREE.Color('#000000'),
      emissiveMap: initialMaps.emissiveMap || null,
      emissiveIntensity: initialMaps.emissiveMap ? 0.55 : 0,
    });
    const planetMesh = new THREE.Mesh(planetSphereGeo, planetMat);
    planetGroup.add(planetMesh);

    const cloudTex = createCloudLayerTexture('#ffffff', 404);
    const cloudGeo = new THREE.SphereGeometry(2.1, 30, 22);
    const cloudMat = new THREE.MeshStandardMaterial({
      map: cloudTex,
      transparent: true,
      opacity: 0.36,
      depthWrite: false,
    });
    const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    cloudMesh.visible = initialPlanet.id !== 'mercury';
    planetGroup.add(cloudMesh);

    const glowTex = createSoftGlowTexture();
    const glowMat = new THREE.SpriteMaterial({
      map: glowTex,
      color: initialPlanet.atmosphereColor,
      transparent: true,
      opacity: 0.42,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const atmosSprite = new THREE.Sprite(glowMat);
    atmosSprite.scale.set(6.2, 6.2, 1);
    planetGroup.add(atmosSprite);

    // Rings (Saturn gold / Uranus vertical ice)
    const ringGeo = new THREE.RingGeometry(2.65, 4.1, 48);
    const ringPosAttr = ringGeo.attributes.position;
    const ringUvAttr = ringGeo.attributes.uv;
    const ringV = new THREE.Vector3();
    for (let i = 0; i < ringPosAttr.count; i++) {
      ringV.fromBufferAttribute(ringPosAttr, i);
      const u = (ringV.length() - 2.65) / (4.1 - 2.65);
      ringUvAttr.setXY(i, u, 0.5);
    }
    const saturnRingTex = createRingTexture('#fde68a');
    const uranusRingTex = createRingTexture('#a5f3fc');
    const ringMat = new THREE.MeshBasicMaterial({
      map: initialPlanet.id === 'uranus' ? uranusRingTex : saturnRingTex,
      transparent: true,
      opacity: 0.78,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.visible = Boolean(initialPlanet.hasRings);
    ringMesh.rotation.set(
      initialPlanet.id === 'uranus' ? 0.14 : Math.PI * 0.42,
      0,
      initialPlanet.id === 'uranus' ? Math.PI * 0.46 : 0.12
    );
    planetGroup.add(ringMesh);

    // Orbiting mini moons
    const moonGeo = new THREE.SphereGeometry(0.18, 12, 10);
    const moonMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.9 });
    const moonPivots: THREE.Group[] = [];
    for (let i = 0; i < 4; i++) {
      const mp = new THREE.Group();
      const m = new THREE.Mesh(moonGeo, moonMat);
      m.position.set(2.7 + i * 0.42, (i % 2 === 0 ? 1 : -1) * 0.25, 0);
      mp.add(m);
      planetGroup.add(mp);
      moonPivots.push(mp);
    }

    disposables.push(
      planetSphereGeo,
      planetMat,
      cloudTex,
      cloudGeo,
      cloudMat,
      glowTex,
      glowMat,
      ringGeo,
      saturnRingTex,
      uranusRingTex,
      ringMat,
      moonGeo,
      moonMat
    );

    // 7. Instanced Space Weather Hazards (Solar Flare / Asteroids / Ion Storm)
    const weatherCount = 65;
    const weatherGeo = new THREE.OctahedronGeometry(0.085, 0);
    const weatherMat = new THREE.MeshBasicMaterial({
      color: '#fbbf24',
      transparent: true,
      opacity: 0.72,
    });
    const weatherInst = new THREE.InstancedMesh(weatherGeo, weatherMat, weatherCount);
    const weatherSeeds = Array.from({ length: weatherCount }, (_, i) => ({
      x: ((i * 37) % 140) / 10 - 7,
      y: ((i * 53) % 80) / 10 - 4,
      z: ((i * 71) % 120) / 10 - 7,
      spd: 2.2 + (i % 7) * 0.75,
      scale: 0.65 + (i % 5) * 0.35,
    }));
    scene.add(weatherInst);
    disposables.push(weatherGeo, weatherMat);

    // Scratch allocations outside tick
    const dummy = new THREE.Object3D();
    const scratchVec = new THREE.Vector3();
    const scratchColorA = new THREE.Color();
    const scratchColorB = new THREE.Color();
    const camTarget = new THREE.Vector3(0.45, 0.2, -1.2);

    // Pointer drag orbit controls
    let targetYaw = 0;
    let targetPitch = 0.08;
    let curYaw = 0;
    let curPitch = 0.08;
    let dragging = false;
    let lastPtrX = 0;
    let lastPtrY = 0;

    const onPointerDown = (e: PointerEvent) => {
      dragging = true;
      lastPtrX = e.clientX;
      lastPtrY = e.clientY;
      renderer.domElement.style.cursor = 'grabbing';
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastPtrX;
      const dy = e.clientY - lastPtrY;
      lastPtrX = e.clientX;
      lastPtrY = e.clientY;
      targetYaw = THREE.MathUtils.clamp(targetYaw - dx * 0.008, -1.1, 1.1);
      targetPitch = THREE.MathUtils.clamp(targetPitch + dy * 0.006, -0.45, 0.65);
      setOrbitYawHint(Math.round((targetYaw * 180) / Math.PI));
    };
    const onPointerUp = () => {
      dragging = false;
      renderer.domElement.style.cursor = 'grab';
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const w = Math.max(240, Math.floor(entry.contentRect.width));
      const h = Math.max(200, Math.floor(entry.contentRect.height));
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    ro.observe(container);

    let appliedPlanetId: PlanetId = initialPlanet.id;
    let appliedLiveryId = liveRef.current.liveryId;

    const glCtx = isSoftwareGl
      ? (renderer.getContext() as WebGL2RenderingContext | WebGLRenderingContext)
      : null;
    const isWebGL2 = Boolean(glCtx && typeof WebGL2RenderingContext !== 'undefined' && glCtx instanceof WebGL2RenderingContext);

    const afterDraw = (onReady: FrameRequestCallback) => {
      if (!isSoftwareGl || !isWebGL2 || !glCtx) {
        rafId = requestAnimationFrame(onReady);
        return;
      }
      const gl2 = glCtx as WebGL2RenderingContext;
      const sync = gl2.fenceSync(gl2.SYNC_GPU_COMMANDS_COMPLETE, 0);
      if (!sync) {
        rafId = requestAnimationFrame(onReady);
        return;
      }
      gl2.flush();
      const start = performance.now();
      const check = () => {
        if (disposed) {
          gl2.deleteSync(sync);
          return;
        }
        const status = gl2.clientWaitSync(sync, 0, 0);
        if (status !== gl2.TIMEOUT_EXPIRED || performance.now() - start > 80) {
          gl2.deleteSync(sync);
          rafId = requestAnimationFrame(onReady);
        } else {
          setTimeout(check, 0);
        }
      };
      setTimeout(check, 0);
    };

    let disposed = false;
    let rafId = 0;
    let lastTime = performance.now();
    let elapsed = 0;

    const tick = (now: number) => {
      if (disposed) return;
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      elapsed += dt;

      const snap = liveRef.current;
      if (snap.burstTimer > 0) snap.burstTimer = Math.max(0, snap.burstTimer - dt);

      // Hot-swap ship livery if player changes it
      if (snap.liveryId !== appliedLiveryId) {
        appliedLiveryId = snap.liveryId;
        const liv = SHIP_LIVERIES.find((l) => l.id === appliedLiveryId) || SHIP_LIVERIES[0];
        shipRig.applyLivery(liv);
      }

      // Hot-swap 3D planet textures/rings/moons when targetPlanetId changes
      const curPlanet = PLANETS.find((p) => p.id === snap.targetPlanetId) || PLANETS[0];
      if (curPlanet.id !== appliedPlanetId) {
        appliedPlanetId = curPlanet.id;
        const maps = getPlanetMaps(curPlanet.surfaceKind);
        planetMat.map = maps.map;
        planetMat.bumpMap = maps.bumpMap;
        planetMat.roughnessMap = maps.roughnessMap;
        planetMat.emissiveMap = maps.emissiveMap || null;
        planetMat.emissive.set(maps.emissiveMap ? '#ffffff' : '#000000');
        planetMat.emissiveIntensity = maps.emissiveMap ? 0.55 : 0;
        planetMat.needsUpdate = true;

        glowMat.color.set(curPlanet.atmosphereColor);
        cloudMesh.visible = curPlanet.id !== 'mercury';
        cloudMat.opacity =
          curPlanet.id === 'solaris' ? 0.5 : curPlanet.id === 'neptune' ? 0.3 : 0.34;
        ringMesh.visible = Boolean(curPlanet.hasRings);
        if (curPlanet.hasRings) {
          ringMat.map = curPlanet.id === 'uranus' ? uranusRingTex : saturnRingTex;
          ringMat.needsUpdate = true;
          ringMesh.rotation.set(curPlanet.id === 'uranus' ? 0.14 : Math.PI * 0.42, 0, curPlanet.id === 'uranus' ? Math.PI * 0.46 : 0.12);
        }
      }

      // Smooth orbit camera around the reactive ship-planet assembly
      curYaw += (targetYaw - curYaw) * Math.min(1, dt * 6);
      curPitch += (targetPitch - curPitch) * Math.min(1, dt * 6);
      const radius = 9.4;
      camera.position.set(
        Math.sin(curYaw + 0.52) * radius * Math.cos(curPitch),
        1.75 + Math.sin(curPitch) * 4.2,
        Math.cos(curYaw + 0.52) * radius * Math.cos(curPitch) - 0.5
      );
      camera.lookAt(camTarget);

      // Shuttle hover + banking + burst animations
      const burstPulse = snap.burstTimer > 0 ? Math.sin(snap.burstTimer * 10) * 0.5 + 0.5 : 0;
      shipPivot.position.y = -0.15 + Math.sin(elapsed * 1.5) * 0.11;
      shipPivot.rotation.z =
        Math.sin(elapsed * 1.1) * 0.06 +
        (snap.burstTimer > 0 && snap.burstKind === 'repair' ? Math.sin(elapsed * 12) * 0.08 : 0);
      shipPivot.rotation.y =
        -0.55 + Math.sin(elapsed * 0.7) * 0.05 + (snap.massOk ? 0 : Math.sin(elapsed * 18) * 0.018);

      const thrustBoost =
        snap.burstTimer > 0 && (snap.burstKind === 'power' || snap.burstKind === 'blueprint');
      const thrustRatio = snap.powerOk ? 0.58 + Math.sin(elapsed * 3) * 0.1 : 0.2;
      shipRig.setThrustVisual(thrustRatio, thrustBoost);
      shipRig.setDigitalTwinState(snap.digitalTwinState);

      // Shield bubble reacts to hull, shield ratio, power deficit & repair burst
      const shieldHealthy = snap.powerOk && snap.shieldRatio > 0.45 && snap.hullIntegrity > 45;
      if (snap.burstTimer > 0 && snap.burstKind === 'repair') {
        scratchColorA.set('#f59e0b');
        shieldWireMat.opacity = 0.52 + burstPulse * 0.35;
        shieldShellMat.opacity = 0.22;
      } else if (!shieldHealthy) {
        scratchColorA.set('#ef4444');
        shieldWireMat.opacity = 0.28 + Math.abs(Math.sin(elapsed * 7)) * 0.25;
        shieldShellMat.opacity = 0.12;
      } else {
        scratchColorA.set('#22d3ee');
        shieldWireMat.opacity = 0.18 + snap.shieldRatio * 0.12;
        shieldShellMat.opacity = 0.06;
      }
      shieldWireMat.color.copy(scratchColorA);
      shieldShellMat.color.copy(scratchColorA);
      shieldWire.rotation.y += dt * 0.28;

      // Engine Mass/Power diagnostic ring
      if (!snap.massOk) {
        powerRingMat.color.set('#f97316');
        powerRing.scale.setScalar(1.0 + Math.sin(elapsed * 12) * 0.12);
      } else if (!snap.powerOk || snap.battery < 28) {
        powerRingMat.color.set('#ef4444');
        powerRing.scale.setScalar(0.92 + Math.sin(elapsed * 8) * 0.08);
      } else {
        powerRingMat.color.set(thrustBoost ? '#38bdf8' : '#34d399');
        powerRing.scale.setScalar(1.0 + (thrustBoost ? 0.18 : Math.sin(elapsed * 2.5) * 0.04));
      }

      // Life support Bio-O2 ring
      const o2Low = snap.suitO2 < 35;
      if (snap.burstTimer > 0 && snap.burstKind === 'lifesupport') {
        bioRingMat.color.set('#34d399');
        bioRingMat.opacity = 0.92;
        bioRing.scale.setScalar(1.15 + burstPulse * 0.25);
      } else {
        bioRingMat.color.set(o2Low ? '#fb7185' : '#10b981');
        bioRingMat.opacity = o2Low ? 0.45 + Math.abs(Math.sin(elapsed * 6)) * 0.35 : 0.32;
        bioRing.scale.setScalar(1.0 + Math.sin(elapsed * 2) * 0.03);
      }

      // Science scan cone burst
      if (snap.burstTimer > 0 && (snap.burstKind === 'science' || snap.burstKind === 'planet')) {
        scanConeMat.opacity = 0.38 * Math.min(1, snap.burstTimer);
        const s = 1 + (1.6 - snap.burstTimer) * 0.35;
        scanCone.scale.set(s, s, 1);
      } else {
        scanConeMat.opacity = 0.06 + Math.sin(elapsed * 2) * 0.03;
        scanCone.scale.set(1, 1, 1);
      }

      // DSN uplink laser & flowing telemetry packets
      scratchVec.set(0, 0.72, -0.35).applyMatrix4(shipPivot.matrixWorld);
      const linePos = dsnLineGeo.attributes.position as THREE.BufferAttribute;
      linePos.setXYZ(0, scratchVec.x, scratchVec.y, scratchVec.z);
      linePos.needsUpdate = true;

      const commsHealthy = snap.commsOk && snap.commsSignal > 45;
      const commsBurst = snap.burstTimer > 0 && snap.burstKind === 'comms';
      scratchColorB.set(commsBurst ? '#22d3ee' : commsHealthy ? '#34d399' : '#f59e0b');
      dsnLineMat.color.copy(scratchColorB);
      dsnLineMat.opacity = commsBurst ? 0.98 : commsHealthy ? 0.68 : 0.25 + Math.abs(Math.sin(elapsed * 9)) * 0.35;
      dsnBeaconMat.color.copy(scratchColorB);
      dsnBeacon.rotation.y += dt * 1.8;

      const flowSpeed = commsBurst ? 1.85 : commsHealthy ? 0.75 : 0.2;
      for (let i = 0; i < packetCount; i++) {
        const t = (elapsed * flowSpeed + i / packetCount) % 1;
        packets[i].position.lerpVectors(scratchVec, dsnTargetPos, t);
        packets[i].scale.setScalar(commsBurst ? 1.55 : commsHealthy ? 1.0 : 0.55);
      }

      // Spin target planet + moons
      planetMesh.rotation.y += dt * 0.16;
      cloudMesh.rotation.y += dt * 0.22;
      for (let i = 0; i < moonPivots.length; i++) {
        moonPivots[i].visible = i < (curPlanet.moonCount || 0);
        moonPivots[i].rotation.y = elapsed * (0.45 + i * 0.18) + i * 1.4;
      }

      // Space weather instanced particles
      const wMode: SpaceWeather = snap.weather;
      weatherInst.visible = wMode !== 'clear' || (snap.burstTimer > 0 && snap.burstKind === 'weather');
      if (weatherInst.visible) {
        weatherMat.color.set(
          wMode === 'solar_flare'
            ? '#fb923c'
            : wMode === 'ion_storm'
              ? '#a855f7'
              : wMode === 'asteroid_squall'
                ? '#94a3b8'
                : '#38bdf8'
        );
        for (let i = 0; i < weatherCount; i++) {
          const sd = weatherSeeds[i];
          const px = ((sd.x + elapsed * sd.spd + 7) % 14) - 7;
          dummy.position.set(px, sd.y, sd.z);
          dummy.rotation.set(elapsed + i, elapsed * 0.8 + i, 0);
          const stretchX = wMode === 'solar_flare' || wMode === 'ion_storm' ? 3.2 : 1.0;
          dummy.scale.set(sd.scale * stretchX, sd.scale, sd.scale);
          dummy.updateMatrix();
          weatherInst.setMatrixAt(i, dummy.matrix);
        }
        weatherInst.instanceMatrix.needsUpdate = true;
      }

      stars.rotation.y += dt * 0.015;
      renderer.render(scene, camera);
      afterDraw(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      ro.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      shipRig.dispose();
      planetTextureCache.forEach((entry) => {
        entry.map.dispose();
        entry.bumpMap.dispose();
        entry.roughnessMap.dispose();
        entry.emissiveMap?.dispose();
      });
      planetTextureCache.clear();
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
    };
  }, []);

  const curPlanet = PLANETS.find((p) => p.id === targetPlanetId) || PLANETS[0];
  const powerOk = activeBlueprint ? activeBlueprint.netPowerW >= 0 : shipMetrics.netPower >= 0;
  const massOk = activeBlueprint
    ? activeBlueprint.totalMassKg <= activeBlueprint.maxLauncherPayloadKg
    : true;
  const commsOk = activeBlueprint
    ? activeBlueprint.commsCapMbDay >= activeBlueprint.dataGenMbDay
    : true;

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-cyan-400/35 bg-[#050a14]">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-[#080f1d] px-3 py-2">
        <div className="flex items-center gap-2">
          <Box className="h-4 w-4 text-cyan-300" />
          <div>
            <div className="font-mono-tech text-[10px] font-bold tracking-wider text-cyan-400">
              {lang === 'ar'
                ? 'التوأم الرقمي التفاعلي داخل اللعبة (IN-GAME DIGITAL TWIN 3D)'
                : 'IN-GAME DIGITAL TWIN • LIVE 2D↔3D SYNC'}
            </div>
            <div className="text-[11px] font-bold text-white">
              {curPlanet.name[lang]}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono-tech text-slate-400">
          <RotateCw className="h-3 w-3 text-cyan-400" />
          <span>{orbitYawHint === 0 ? (lang === 'ar' ? 'اسحب للتدوير' : 'Drag 3D') : `${orbitYawHint}°`}</span>
        </div>
      </div>

      {/* Three.js Canvas Mount (no backdrop-blur over WebGL) */}
      <div ref={mountRef} className="relative h-[235px] w-full bg-[#040814]" />

      {/* Last Decision Visual Reaction Caption */}
      <div className="border-t border-white/10 bg-[#070d19] px-3 py-1.5 text-[11px]">
        <div className="flex items-center justify-between gap-2">
          <span className="font-bold text-cyan-300">
            {activeEvent
              ? lang === 'ar'
                ? `⚡ تفاعل 3D: ${activeEvent.labelAr}`
                : `⚡ 3D Reaction: ${activeEvent.labelEn}`
              : lang === 'ar'
                ? 'اسحب التوأم 3D أو نفّذ أي قرار في 2D لمشاهدة الأثر الفوري'
                : 'Drag 3D view or take any 2D decision to watch live spacecraft effects'}
          </span>
        </div>
      </div>

      {/* Live Engineering Mirrors (Shield / Mass / Power / DSN) */}
      <div className="grid grid-cols-2 gap-1.5 border-t border-white/10 bg-[#060b16] p-2.5 text-[10px] font-mono-tech">
        <div
          className={`flex items-center justify-between rounded border px-2 py-1 ${
            massOk
              ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
              : 'border-orange-400/50 bg-orange-500/15 text-orange-200'
          }`}
        >
          <span>{lang === 'ar' ? 'توازن الكتلة' : 'MASS FIT'}</span>
          <span className="font-bold">{massOk ? 'OK' : 'OVERLOAD'}</span>
        </div>

        <div
          className={`flex items-center justify-between rounded border px-2 py-1 ${
            powerOk
              ? 'border-cyan-400/30 bg-cyan-500/10 text-cyan-200'
              : 'border-rose-400/50 bg-rose-500/15 text-rose-200'
          }`}
        >
          <span>{lang === 'ar' ? 'هامش الطاقة' : 'POWER'}</span>
          <span className="font-bold">{powerOk ? `${Math.round(resources.battery)}%` : 'DEFICIT'}</span>
        </div>

        <div
          className={`flex items-center justify-between rounded border px-2 py-1 ${
            commsOk && resources.commsSignal > 45
              ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
              : 'border-amber-400/50 bg-amber-500/15 text-amber-200'
          }`}
        >
          <span>{lang === 'ar' ? 'شعاع DSN' : 'DSN LINK'}</span>
          <span className="font-bold">{Math.round(resources.commsSignal)}%</span>
        </div>

        <div
          className={`flex items-center justify-between rounded border px-2 py-1 ${
            hullIntegrity > 50
              ? 'border-sky-400/30 bg-sky-500/10 text-sky-200'
              : 'border-rose-400/50 bg-rose-500/15 text-rose-200'
          }`}
        >
          <span>{lang === 'ar' ? 'الدرع/الهيكل' : 'SHIELD'}</span>
          <span className="font-bold">{Math.round(hullIntegrity)}%</span>
        </div>
      </div>

      {/* Quick 3D Reaction Test Buttons inside 2D Mode */}
      <div className="grid grid-cols-3 gap-1.5 border-t border-white/10 bg-[#080e1a] p-2.5 text-[10px] font-bold">
        <button
          onClick={() =>
            fireLocalEvent('science', 'نبضة مسح علمي نحو الكوكب', 'Target Planet Scan Beam')
          }
          className="flex items-center justify-center gap-1 rounded border border-cyan-400/35 bg-cyan-500/15 py-1.5 text-cyan-200 hover:bg-cyan-500/25"
        >
          <Crosshair className="h-3 w-3" />
          <span>{lang === 'ar' ? 'مسح 3D' : 'Scan'}</span>
        </button>

        <button
          onClick={() =>
            fireLocalEvent('comms', 'بث حزم بيانات لشبكة DSN', 'DSN Laser Data Burst')
          }
          className="flex items-center justify-center gap-1 rounded border border-emerald-400/35 bg-emerald-500/15 py-1.5 text-emerald-200 hover:bg-emerald-500/25"
        >
          <Radio className="h-3 w-3" />
          <span>{lang === 'ar' ? 'بث DSN' : 'DSN'}</span>
        </button>

        <button
          onClick={() =>
            fireLocalEvent('repair', 'اختبار نبضة الدرع والإصلاح', 'Shield & Hull Pulse')
          }
          className="flex items-center justify-center gap-1 rounded border border-amber-400/35 bg-amber-500/15 py-1.5 text-amber-200 hover:bg-amber-500/25"
        >
          <Shield className="h-3 w-3" />
          <span>{lang === 'ar' ? 'الدرع' : 'Shield'}</span>
        </button>

        <button
          onClick={() =>
            fireLocalEvent('lifesupport', 'تنشيط دورة الأكسجين O2', 'Bio-O2 Loop Surge')
          }
          className="flex items-center justify-center gap-1 rounded border border-teal-400/35 bg-teal-500/15 py-1.5 text-teal-200 hover:bg-teal-500/25"
        >
          <Wind className="h-3 w-3" />
          <span>{lang === 'ar' ? 'أكسجين' : 'Bio O2'}</span>
        </button>

        <button
          onClick={() =>
            fireLocalEvent('power', 'رفع دفع المحرك والطاقة', 'Thruster Overdrive')
          }
          className="flex items-center justify-center gap-1 rounded border border-violet-400/35 bg-violet-500/15 py-1.5 text-violet-200 hover:bg-violet-500/25"
        >
          <Activity className="h-3 w-3" />
          <span>{lang === 'ar' ? 'دفع 3D' : 'Thrust'}</span>
        </button>

        <button
          onClick={() => {
            cycleWeather();
            fireLocalEvent('weather', 'تبديل الطقس الفضائي 3D', 'Cycle 3D Space Weather');
          }}
          className="flex items-center justify-center gap-1 rounded border border-rose-400/35 bg-rose-500/15 py-1.5 text-rose-200 hover:bg-rose-500/25"
        >
          <Flame className="h-3 w-3" />
          <span className="truncate">{UI_COPY.weather[weather].name[lang]}</span>
        </button>
      </div>
    </div>
  );
}
