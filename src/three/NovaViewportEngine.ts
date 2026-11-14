import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { PLANETS, SHIP_LIVERIES, SOLAR_ORBIT_RADII, SOLAR_SYSTEM_CENTER } from '../data/novaData';
import { getPlanetEnvironment } from '../engine/planetaryEnvironments';
import type {
  CameraMode,
  CharacterConfig,
  DigitalTwinVisualState,
  GameSettings,
  InteriorStationId,
  InteriorTelemetrySnapshot,
  PersonnelEffects,
  PlanetData,
  PlanetId,
  RadarBlip,
  SceneEnv,
  ShipLivery,
  ShipMetrics,
  ShuttleSpecialist,
  SpaceTelemetrySnapshot,
  SpaceWeather,
  SurfaceBuildingKind,
  SurfaceBuildingRecord,
  SurfaceTelemetrySnapshot,
} from '../types/game';
import { SurfaceCreatureManager } from './surfaceCreatures';
import { buildAstronautGroup, type AstronautRig } from './characterMesh';
import { buildSpacecraftInterior, type InteriorWorldHandle } from './interiorWorld';
import {
  createCloudLayerTexture,
  createModelGraphicOverlayTexture,
  createPlanetTexture,
  createRingTexture,
  createSoftGlowTexture,
  createSpaceSkyboxTexture,
} from './proceduralTextures';
import {
  buildCockpitFrameRig,
  buildProceduralStarfighter,
  type CockpitFrameRig,
  type ProceduralShipRig,
} from './shipBuilder';
import {
  buildPlanetSurfaceWorld,
  buildSixWheelRover,
  planetGroundHeightAt,
  type RoverRig,
  type SurfaceWorldHandle,
} from './surfaceWorld';
import {
  createDynamicWeatherShaderSystem,
  type WeatherShaderHandle,
} from './weatherShaders';

export interface VirtualFlightInput {
  thrust: number;
  yaw: number;
  pitch: number;
  boost: boolean;
}

export interface NovaEngineCallbacks {
  onInteriorTelemetry: (snap: InteriorTelemetrySnapshot) => void;
  onSpaceTelemetry: (snap: SpaceTelemetrySnapshot) => void;
  onSurfaceTelemetry: (snap: SurfaceTelemetrySnapshot) => void;
  onRingPassed: () => void;
  onAsteroidMined: () => void;
  onAsteroidHit: () => void;
  onBarrelRoll: () => void;
  onOrbitArrived: (planetId: PlanetId) => void;
  onWeatherChanged: (weather: SpaceWeather) => void;
  onRoverToggled: (inRover: boolean) => void;
  onSampleCollected: (id: string, planetId: PlanetId) => void;
  onCraterDiscovered: (id: string) => void;
  onScienceSiteCompleted: (id: string, dataMb: number) => void;
  onMonolithInspected: () => void;
  onCreatureScanned?: (id: string, speciesName: string) => void;
  onPickupCollected?: (id: string, pickupType: 'o2' | 'energy') => void;
  onAlienDisturbed?: (speciesNameEn: string, speciesNameAr: string) => void;
  onAlienAttack?: (speciesNameEn: string, speciesNameAr: string, inRover: boolean) => void;
  onSpacecraftRefuel?: () => void;
  onInteriorStationInteract: (stationId: InteriorStationId) => void;
  onRequestReturnBridge: () => void;
  onRequestLandPlanet: (planetId: PlanetId) => void;
  onLaserFire: () => void;
  onBoostStart: () => void;
  onRoverDriveAudio?: (speedAbs: number, steerAbs: number, active: boolean) => void;
  onContextLost: (lost: boolean) => void;
  onMouseLockChanged?: (locked: boolean) => void;
}

interface PlanetRuntime {
  data: PlanetData;
  group: THREE.Group;
  mesh: THREE.Mesh;
  cloudMesh?: THREE.Mesh;
  ringMesh?: THREE.Mesh;
  moons: Array<{ pivot: THREE.Group; speed: number }>;
  beaconRing: THREE.Mesh;
}

interface AsteroidItem {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  rotSpeed: THREE.Vector3;
  scale: number;
  alive: boolean;
  respawnTimer: number;
  isStormRock: boolean;
}

interface PlasmaBolt {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
}

interface WarpRingItem {
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  cooldown: number;
}

const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _v3 = new THREE.Vector3();
const _forward = new THREE.Vector3();
const _desiredCamPos = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();
const _dummy = new THREE.Object3D();
const _boltStart = new THREE.Vector3();
const _upAxis = new THREE.Vector3(0, 1, 0);
const _targetBgColor = new THREE.Color();
const _targetSunColor = new THREE.Color();
const _targetRimColor = new THREE.Color();
const _targetStreakColor = new THREE.Color();

function dampAngle(current: number, target: number, lambda: number, dt: number): number {
  let diff = target - current;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return current + diff * (1 - Math.exp(-lambda * dt));
}

export function detectSoftwareGl(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function createAtmosphereRimMaterial(hexColor: string): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      glowColor: { value: new THREE.Color(hexColor) },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewPos;
      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vViewPos = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 glowColor;
      varying vec3 vNormal;
      varying vec3 vViewPos;
      void main() {
        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(vViewPos);
        float rim = 1.0 - max(dot(viewDir, normal), 0.0);
        float intensity = pow(rim, 3.2) * 0.85;
        gl_FragColor = vec4(glowColor, intensity);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.FrontSide,
  });
}

export class NovaViewportEngine {
  private container: HTMLElement;
  private callbacks: NovaEngineCallbacks;
  private renderer: THREE.WebGLRenderer;
  private composer?: EffectComposer;
  private bloomPass?: UnrealBloomPass;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();
  private isSoftwareGl: boolean;
  private frameId = 0;
  private disposed = false;

  private mode: SceneEnv = 'builder';
  private cameraMode: CameraMode = 'first-person';
  private paused = false;

  // Scene Layer Groups
  private spaceGroup = new THREE.Group();
  private interiorAnchor = new THREE.Group();
  private surfaceGroup = new THREE.Group();

  // Interior Bridge
  private interiorWorld: InteriorWorldHandle;
  private bridgeAstroRig: AstronautRig;
  private bridgePlayerPos = new THREE.Vector3(0, 0, -2.0);
  private bridgeVelY = 0;
  private bridgeJumpQueued = false;
  private bridgePlayerYaw = 0; // Facing -Z (panoramic stars & flight deck)
  private bridgePlayerPitch = 0;

  // Exterior Ship & Cockpit Frame
  private shipRig: ProceduralShipRig;
  private cockpitRig: CockpitFrameRig;
  private shipMetrics: ShipMetrics;
  private digitalTwinState: DigitalTwinVisualState | null = null;
  private personnelEffects: PersonnelEffects = {
    repairSpeedMult: 1,
    scienceRateMult: 1,
    lifeSupportRateMult: 1,
    commsRateMult: 1,
    flightEfficiencyMult: 1,
    synergyCount: 10,
  };
  private shipPos = new THREE.Vector3(0, 8, -96); // Parked right facing Luna outside bridge window
  private shipYaw = 0;
  private shipPitch = 0;
  private shipSpeed = 0;
  private bankAngle = 0;
  private barrelRollTimer = 0;
  private barrelRollCooldown = 0;
  private cannonCooldown = 0;
  private shield = 140;
  private maxShield = 140;
  private targetPlanetId: PlanetId | null = 'luna';
  private autopilotActive = false;
  private lastNotifiedApproachId: PlanetId | null = null;
  private discoveredIds = new Set<PlanetId>(['luna']);

  // Space World Objects
  private skyboxDome!: THREE.Mesh;
  private planets: PlanetRuntime[] = [];
  private gmatCurves = new Map<PlanetId, { curve: THREE.CatmullRomCurve3; line: THREE.Line }>();
  private vizProbeMesh!: THREE.Mesh;
  private dsnBeamLine!: THREE.Line;
  private missionVizTimeline = 0.35;
  private missionVizTargetPlanet: PlanetId = 'mars';
  private vizOrbitAngle = 0.45;
  private asteroids: AsteroidItem[] = [];
  private asteroidInstanced!: THREE.InstancedMesh;
  private warpRings: WarpRingItem[] = [];
  private orbitalStationGroup = new THREE.Group();
  private currentAccelG = 0.3;
  private plasmaBolts: PlasmaBolt[] = [];
  private boltGeo!: THREE.SphereGeometry;
  private boltMat!: THREE.MeshBasicMaterial;
  private warpStreaks!: THREE.Points;
  private warpStreakBase!: Float32Array;
  private warpStreakMat!: THREE.PointsMaterial;

  // Dynamic Space Weather & GLSL Shader System
  private weather: SpaceWeather = 'clear';
  private weatherTimer = 26;
  private weatherSpeedMultiplier = 1;
  private weatherShieldDelta = 2.5;
  private stormRockBlend = 0;
  private weatherShaderRig!: WeatherShaderHandle;
  private envRadiationSievert = 0.12;
  private envDustDensityPct = 4;

  // Lighting & Sky
  private hemiLight!: THREE.HemisphereLight;
  private sunKeyLight!: THREE.DirectionalLight;
  private rimLight!: THREE.DirectionalLight;
  private sceneBgColor = new THREE.Color('#040710');
  private sceneFog!: THREE.FogExp2;

  // Planet Surface & 6-Wheel Rover + Creatures + Outposts
  private activeSurfacePlanet: PlanetData = PLANETS[0];
  private surfaceWorld: SurfaceWorldHandle | null = null;
  private creatureManager = new SurfaceCreatureManager();
  private landedShipRig: ProceduralShipRig;
  private roverRig: RoverRig;
  private surfaceAstroRig: AstronautRig;
  private inRover = false;
  private playerPos = new THREE.Vector3(0, 0, 15);
  private playerVelY = 0;
  private surfaceJumpQueued = false;
  private spaceHoldDuration = 0;
  private playerYaw = Math.PI;
  private roverPos = new THREE.Vector3(9, 0, 10);
  private roverYaw = -0.6;
  private roverSpeed = 0;
  private collectedSampleIds: string[] = [];
  private discoveredCraterIds: string[] = [];
  private completedScienceIds: string[] = [];
  private scannedCreatureIds: string[] = [];
  private surfaceBuildings: SurfaceBuildingRecord[] = [];
  private suitO2 = 100;
  private settings: GameSettings = {
    qualityPreset: 'high',
    resolutionScale: 1,
    gameplaySpeed: 1.35,
    fov: 68,
    mouseSensitivity: 1.25,
    invertY: false,
    bloomEnabled: true,
    masterVolume: 0.85,
  };

  // Input
  private keys = new Set<string>();
  private virtualInput: VirtualFlightInput = { thrust: 0, yaw: 0, pitch: 0, boost: false };
  private pointerDragging = false;
  private mouseLocked = false;
  private surfacePlayerPitch = 0;
  private pointerDeltaX = 0;
  private pointerDeltaY = 0;
  private lastPointerX = 0;
  private lastPointerY = 0;
  private wasBoosting = false;
  private telemetryTimer = 0;

  private cleanupListeners: Array<() => void> = [];
  private texturesToDispose: THREE.Texture[] = [];
  private geosToDispose: THREE.BufferGeometry[] = [];
  private matsToDispose: THREE.Material[] = [];

  constructor(
    container: HTMLElement,
    callbacks: NovaEngineCallbacks,
    initialCharacter: CharacterConfig,
    initialLivery: ShipLivery,
    initialMetrics: ShipMetrics,
    initialSettings?: GameSettings
  ) {
    this.container = container;
    this.callbacks = callbacks;
    this.shipMetrics = initialMetrics;
    this.maxShield = initialMetrics.maxShield;
    this.shield = initialMetrics.maxShield;
    this.isSoftwareGl = detectSoftwareGl();
    if (initialSettings) {
      this.settings = initialSettings;
    }

    this.scene = new THREE.Scene();
    this.scene.background = this.sceneBgColor;
    this.sceneFog = new THREE.FogExp2('#040710', 0.00048);
    this.scene.fog = this.sceneFog;

    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    this.camera = new THREE.PerspectiveCamera(this.settings.fov, width / height, 0.12, 3200);
    this.scene.add(this.camera);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.92;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const canvas = this.renderer.domElement;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.appendChild(canvas);

    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = envTex;
    this.scene.environmentIntensity = 0.12;
    this.texturesToDispose.push(envTex);
    pmrem.dispose();

    this.setupLighting();

    // 1. Space Layer (Milky Way Skybox + Sun + Planets + Asteroids + Warp Rings)
    this.scene.add(this.spaceGroup);
    this.buildCosmicSkybox();
    this.buildStarfield();
    this.buildWarpStreaks();
    this.buildPlanets();
    this.buildGmatTrajectories();
    this.buildAsteroids();
    this.buildWarpRings();
    this.buildOrbitalStation();

    this.shipRig = buildProceduralStarfighter(initialLivery, this.isSoftwareGl, maxAniso);
    this.shipRig.root.position.copy(this.shipPos);
    this.spaceGroup.add(this.shipRig.root);

    this.cockpitRig = buildCockpitFrameRig();
    this.cockpitRig.group.visible = false;
    this.camera.add(this.cockpitRig.group);

    this.boltGeo = new THREE.SphereGeometry(0.28, 8, 8);
    this.boltGeo.scale(1, 1, 4.2);
    this.boltMat = new THREE.MeshBasicMaterial({ color: '#38bdf8' });
    this.geosToDispose.push(this.boltGeo);
    this.matsToDispose.push(this.boltMat);

    // 2. Spacecraft Bridge Interior (Mounted far at +Y = 400 so window looks cleanly into space!)
    this.interiorWorld = buildSpacecraftInterior(this.isSoftwareGl, maxAniso);
    this.bridgeAstroRig = buildAstronautGroup(initialCharacter, this.isSoftwareGl);
    this.interiorAnchor.add(this.interiorWorld.group);
    this.interiorAnchor.add(this.bridgeAstroRig.root);
    this.interiorAnchor.visible = false;
    this.scene.add(this.interiorAnchor);

    // 3. Planet Surface Layer
    this.scene.add(this.surfaceGroup);
    this.surfaceGroup.visible = false;

    this.landedShipRig = buildProceduralStarfighter(initialLivery, this.isSoftwareGl, maxAniso);
    this.landedShipRig.root.position.set(0, 1.35, 0);
    this.landedShipRig.root.scale.setScalar(1.35);
    this.landedShipRig.setThrustVisual(0.05, false);
    this.surfaceGroup.add(this.landedShipRig.root);

    this.roverRig = buildSixWheelRover(this.isSoftwareGl);
    this.surfaceGroup.add(this.roverRig.root);

    this.surfaceAstroRig = buildAstronautGroup(initialCharacter, this.isSoftwareGl, true);
    this.surfaceGroup.add(this.surfaceAstroRig.root);
    this.surfaceGroup.add(this.creatureManager.group);

    this.weatherShaderRig = createDynamicWeatherShaderSystem();
    this.scene.add(this.weatherShaderRig.group);

    this.bindEvents(canvas);

    if (!this.isSoftwareGl) {
      this.composer = new EffectComposer(this.renderer);
      this.composer.setPixelRatio(
        Math.min(2.5, Math.min(window.devicePixelRatio || 1, 2) * this.settings.resolutionScale)
      );
      this.composer.setSize(width, height);
      this.composer.addPass(new RenderPass(this.scene, this.camera));
      this.bloomPass = new UnrealBloomPass(
        new THREE.Vector2(width, height),
        0.075,
        0.2,
        1.04
      );
      this.bloomPass.enabled = this.settings.bloomEnabled;
      this.composer.addPass(this.bloomPass);
      this.composer.addPass(new OutputPass());
      this.renderer.compile(this.scene, this.camera);
    }

    this.applySettings(this.settings);
    this.clock.start();
    this.tick();
  }

  private setupLighting() {
    this.hemiLight = new THREE.HemisphereLight('#bae6fd', '#1e1b4b', 0.48);
    this.scene.add(this.hemiLight);

    this.sunKeyLight = new THREE.DirectionalLight('#fff7ed', 1.95);
    this.sunKeyLight.position.set(340, 210, 220);
    this.sunKeyLight.castShadow = !this.isSoftwareGl;
    this.sunKeyLight.shadow.mapSize.set(2048, 2048);
    this.sunKeyLight.shadow.camera.near = 2;
    this.sunKeyLight.shadow.camera.far = 220;
    const shadowBound = 42;
    this.sunKeyLight.shadow.camera.left = -shadowBound;
    this.sunKeyLight.shadow.camera.right = shadowBound;
    this.sunKeyLight.shadow.camera.top = shadowBound;
    this.sunKeyLight.shadow.camera.bottom = -shadowBound;
    this.sunKeyLight.shadow.bias = -0.0005;
    this.sunKeyLight.shadow.normalBias = 0.03;
    this.scene.add(this.sunKeyLight);
    this.scene.add(this.sunKeyLight.target);

    this.rimLight = new THREE.DirectionalLight('#7dd3fc', 0.26);
    this.rimLight.position.set(-220, -100, -180);
    this.scene.add(this.rimLight);
  }

  private buildCosmicSkybox() {
    const skyTex = createSpaceSkyboxTexture();
    this.texturesToDispose.push(skyTex);

    const skyGeo = new THREE.SphereGeometry(2100, 32, 20);
    const skyMat = new THREE.MeshBasicMaterial({
      map: skyTex,
      side: THREE.BackSide,
      fog: false,
      depthWrite: false,
    });
    this.skyboxDome = new THREE.Mesh(skyGeo, skyMat);
    this.spaceGroup.add(this.skyboxDome);
    this.geosToDispose.push(skyGeo);
    this.matsToDispose.push(skyMat);

    // Radiant 3D Heliocentric Sun at Solar System Center + Corona
    const glowTex = createSoftGlowTexture();
    this.texturesToDispose.push(glowTex);

    const [sunX, sunY, sunZ] = SOLAR_SYSTEM_CENTER;
    const sunSphereGeo = new THREE.SphereGeometry(40, 36, 26);
    const sunSphereMat = new THREE.MeshBasicMaterial({
      color: '#fde047',
      fog: false,
    });
    const sunSphere = new THREE.Mesh(sunSphereGeo, sunSphereMat);
    sunSphere.position.set(sunX, sunY, sunZ);
    this.geosToDispose.push(sunSphereGeo);
    this.matsToDispose.push(sunSphereMat);

    const sunMat = new THREE.SpriteMaterial({
      map: glowTex,
      color: '#f97316',
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.72,
      fog: false,
    });
    const sunSprite = new THREE.Sprite(sunMat);
    sunSprite.position.set(sunX, sunY, sunZ);
    sunSprite.scale.set(220, 220, 1);

    const sunCoreMat = new THREE.SpriteMaterial({
      map: glowTex,
      color: '#fffbeb',
      blending: THREE.AdditiveBlending,
      opacity: 0.92,
      fog: false,
    });
    const sunCore = new THREE.Sprite(sunCoreMat);
    sunCore.position.set(sunX, sunY, sunZ);
    sunCore.scale.set(110, 110, 1);

    this.spaceGroup.add(sunSphere, sunSprite, sunCore);
    this.matsToDispose.push(sunMat, sunCoreMat);

    // Concentric 3D Planetary Orbital Tracks around the Sun
    SOLAR_ORBIT_RADII.forEach((orbit) => {
      if (orbit.planetId === 'luna') return; // Moon sub-orbit rendered around Earth below
      const pData = PLANETS.find((p) => p.id === orbit.planetId);
      const trackY = pData ? pData.position[1] : 0;
      const trackGeo = new THREE.TorusGeometry(orbit.orbitRadius, 0.42, 6, 128);
      trackGeo.rotateX(Math.PI / 2);
      const trackMat = new THREE.MeshBasicMaterial({
        color: orbit.color,
        transparent: true,
        opacity: 0.24,
        depthWrite: false,
      });
      const trackMesh = new THREE.Mesh(trackGeo, trackMat);
      trackMesh.position.set(sunX, trackY, sunZ);
      this.spaceGroup.add(trackMesh);
      this.geosToDispose.push(trackGeo);
      this.matsToDispose.push(trackMat);
    });

    // Earth-Moon Local Sub-Orbit Ring around Earth
    const earthData = PLANETS.find((p) => p.id === 'aurora');
    const moonData = PLANETS.find((p) => p.id === 'luna');
    if (earthData && moonData) {
      const emRadius = Math.hypot(
        moonData.position[0] - earthData.position[0],
        moonData.position[2] - earthData.position[2]
      );
      const emGeo = new THREE.TorusGeometry(emRadius, 0.3, 6, 64);
      emGeo.rotateX(Math.PI / 2);
      const emMat = new THREE.MeshBasicMaterial({
        color: '#cbd5e1',
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
      });
      const emMesh = new THREE.Mesh(emGeo, emMat);
      emMesh.position.set(...earthData.position);
      this.spaceGroup.add(emMesh);
      this.geosToDispose.push(emGeo);
      this.matsToDispose.push(emMat);
    }
  }

  private buildStarfield() {
    const count = 2100;
    const starGeo = new THREE.OctahedronGeometry(0.65, 0);
    const starMat = new THREE.MeshBasicMaterial({ color: '#ffffff', fog: false });
    const stars = new THREE.InstancedMesh(starGeo, starMat, count);
    stars.frustumCulled = false;

    const palette = [
      new THREE.Color('#ffffff'),
      new THREE.Color('#bae6fd'),
      new THREE.Color('#fde68a'),
      new THREE.Color('#c4b5fd'),
    ];

    for (let i = 0; i < count; i++) {
      const r = 780 + Math.random() * 1150;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      _dummy.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi) - 260
      );
      _dummy.scale.setScalar(0.45 + Math.random() * 1.9);
      _dummy.updateMatrix();
      stars.setMatrixAt(i, _dummy.matrix);
      stars.setColorAt(i, palette[i % palette.length]);
    }
    stars.instanceMatrix.needsUpdate = true;
    if (stars.instanceColor) stars.instanceColor.needsUpdate = true;
    this.spaceGroup.add(stars);
    this.geosToDispose.push(starGeo);
    this.matsToDispose.push(starMat);
  }

  private buildWarpStreaks() {
    const count = 200;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 90;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 140;
    }
    this.warpStreakBase = positions;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions.slice(), 3));
    const glowTex = createSoftGlowTexture();
    this.texturesToDispose.push(glowTex);

    this.warpStreakMat = new THREE.PointsMaterial({
      color: '#bae6fd',
      size: 0.42,
      map: glowTex,
      transparent: true,
      opacity: 0.24,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.warpStreaks = new THREE.Points(geo, this.warpStreakMat);
    this.warpStreaks.frustumCulled = false;
    this.spaceGroup.add(this.warpStreaks);
    this.geosToDispose.push(geo);
    this.matsToDispose.push(this.warpStreakMat);
  }

  private buildPlanets() {
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    PLANETS.forEach((pData) => {
      const group = new THREE.Group();
      group.position.set(...pData.position);

      const { map, bumpMap, roughnessMap, emissiveMap } = createPlanetTexture(
        pData.surfaceKind,
        maxAniso
      );
      this.texturesToDispose.push(map, bumpMap, roughnessMap);
      if (emissiveMap) this.texturesToDispose.push(emissiveMap);

      const sphereGeo = new THREE.SphereGeometry(pData.radius, 52, 38);
      const planetMat = new THREE.MeshStandardMaterial({
        map,
        bumpMap,
        bumpScale: pData.surfaceKind === 'cryo_giant' ? 0.06 : 0.18,
        roughnessMap,
        emissiveMap,
        emissive: emissiveMap ? new THREE.Color('#ffffff') : new THREE.Color('#000000'),
        emissiveIntensity: emissiveMap ? 0.72 : 0,
        roughness: pData.surfaceKind === 'emerald_nebula' ? 0.72 : 0.86,
        metalness: 0.04,
      });
      const mesh = new THREE.Mesh(sphereGeo, planetMat);
      group.add(mesh);
      this.geosToDispose.push(sphereGeo);
      this.matsToDispose.push(planetMat);

      // Dynamic Atmospheric Cloud Layer on worlds with atmospheres (skip airless Moon & Mercury)
      let cloudMesh: THREE.Mesh | undefined;
      if (pData.id !== 'luna' && pData.id !== 'mercury') {
        const cloudTint =
          pData.id === 'mars'
            ? '#fed7aa'
            : pData.id === 'aurora'
              ? '#f0f9ff'
              : pData.id === 'solaris'
                ? '#fef3c7'
                : pData.id === 'aetheris'
                  ? '#fde68a'
                  : pData.id === 'uranus'
                    ? '#cffafe'
                    : pData.id === 'neptune'
                      ? '#bfdbfe'
                      : '#fef3c7';
        const cloudTex = createCloudLayerTexture(cloudTint, pData.radius * 17);
        this.texturesToDispose.push(cloudTex);
        const cloudGeo = new THREE.SphereGeometry(pData.radius * 1.018, 40, 28);
        const cloudMat = new THREE.MeshStandardMaterial({
          map: cloudTex,
          transparent: true,
          opacity: pData.id === 'mars' ? 0.34 : pData.id === 'solaris' ? 0.76 : 0.54,
          roughness: 0.9,
          depthWrite: false,
        });
        cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
        group.add(cloudMesh);
        this.geosToDispose.push(cloudGeo);
        this.matsToDispose.push(cloudMat);
      }

      // True Fresnel Atmospheric Rim Glow Shader
      const atmoGeo = new THREE.SphereGeometry(pData.radius * 1.048, 36, 26);
      const atmoMat = createAtmosphereRimMaterial(pData.atmosphereColor);
      group.add(new THREE.Mesh(atmoGeo, atmoMat));
      this.geosToDispose.push(atmoGeo);
      this.matsToDispose.push(atmoMat);

      let ringMesh: THREE.Mesh | undefined;
      if (pData.hasRings) {
        const ringTex = createRingTexture(pData.ringColor || pData.atmosphereColor);
        this.texturesToDispose.push(ringTex);
        const ringGeo = new THREE.RingGeometry(pData.radius * 1.42, pData.radius * 2.38, 64);
        const posAttr = ringGeo.attributes.position;
        const uvAttr = ringGeo.attributes.uv;
        for (let i = 0; i < posAttr.count; i++) {
          const x = posAttr.getX(i);
          const y = posAttr.getY(i);
          const dist = Math.sqrt(x * x + y * y);
          const u = (dist - pData.radius * 1.42) / (pData.radius * (2.38 - 1.42));
          uvAttr.setXY(i, u, 0.5);
        }
        const ringMat = new THREE.MeshBasicMaterial({
          map: ringTex,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: pData.id === 'uranus' ? 0.62 : 0.88,
          depthWrite: false,
        });
        ringMesh = new THREE.Mesh(ringGeo, ringMat);
        if (pData.id === 'uranus') {
          ringMesh.rotation.x = 0.25;
          ringMesh.rotation.y = 1.42; // Uranus ~98 deg axial ring tilt
        } else {
          ringMesh.rotation.x = Math.PI / 2.4;
          ringMesh.rotation.y = 0.25;
        }
        group.add(ringMesh);
        this.geosToDispose.push(ringGeo);
        this.matsToDispose.push(ringMat);
      }

      const moons: Array<{ pivot: THREE.Group; speed: number }> = [];
      for (let m = 0; m < (pData.moonCount || 0); m++) {
        const pivot = new THREE.Group();
        pivot.rotation.y = m * 2.1;
        const moonGeo = new THREE.SphereGeometry(2.1 + m * 0.8, 16, 12);
        const moonMat = new THREE.MeshStandardMaterial({
          color: m === 0 ? '#cbd5e1' : '#fcd34d',
          roughness: 0.88,
        });
        const moonMesh = new THREE.Mesh(moonGeo, moonMat);
        moonMesh.position.set(pData.radius * (1.72 + m * 0.45), 0, 0);
        pivot.add(moonMesh);
        group.add(pivot);
        moons.push({ pivot, speed: 0.28 - m * 0.08 });
        this.geosToDispose.push(moonGeo);
        this.matsToDispose.push(moonMat);
      }

      const beaconGeo = new THREE.TorusGeometry(pData.orbitDistance * 0.72, 0.26, 8, 48);
      const beaconMat = new THREE.MeshBasicMaterial({
        color: pData.atmosphereColor,
        transparent: true,
        opacity: 0.2,
      });
      const beaconRing = new THREE.Mesh(beaconGeo, beaconMat);
      beaconRing.rotation.x = Math.PI / 2;
      beaconRing.visible = pData.id === this.targetPlanetId;
      group.add(beaconRing);
      this.geosToDispose.push(beaconGeo);
      this.matsToDispose.push(beaconMat);

      this.spaceGroup.add(group);
      this.planets.push({ data: pData, group, mesh, cloudMesh, ringMesh, moons, beaconRing });
    });
  }

  private buildGmatTrajectories() {
    const origin = new THREE.Vector3(0, 8, -96);
    PLANETS.forEach((pData, idx) => {
      const dest = new THREE.Vector3(...pData.position);
      const mid1 = new THREE.Vector3().lerpVectors(origin, dest, 0.35);
      const mid2 = new THREE.Vector3().lerpVectors(origin, dest, 0.72);
      const arcBend = (idx % 2 === 0 ? 1 : -1) * (45 + idx * 14);
      mid1.x += arcBend * 0.7;
      mid1.y += 22 + idx * 4;
      mid2.x += arcBend * 0.45;
      mid2.y += 14;

      const curve = new THREE.CatmullRomCurve3([origin.clone(), mid1, mid2, dest]);
      const pts = curve.getPoints(56);
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({
        color: pData.atmosphereColor,
        transparent: true,
        opacity: pData.id === this.missionVizTargetPlanet ? 0.92 : 0.28,
      });
      const line = new THREE.Line(geo, mat);
      line.visible = false;
      this.spaceGroup.add(line);
      this.geosToDispose.push(geo);
      this.matsToDispose.push(mat);
      this.gmatCurves.set(pData.id, { curve, line });
    });

    const probeGeo = new THREE.OctahedronGeometry(4.2, 1);
    const probeMat = new THREE.MeshBasicMaterial({
      color: '#fbbf24',
      wireframe: false,
    });
    this.vizProbeMesh = new THREE.Mesh(probeGeo, probeMat);
    this.vizProbeMesh.visible = false;
    this.spaceGroup.add(this.vizProbeMesh);
    this.geosToDispose.push(probeGeo);
    this.matsToDispose.push(probeMat);

    // DSN Telemetry Comms Beam connecting Probe to Earth/Aurora Relay (from NOVA v1 Viz)
    const beamGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 8, -96),
      new THREE.Vector3(0, 8, -96),
    ]);
    const beamMat = new THREE.LineBasicMaterial({
      color: '#10b981',
      transparent: true,
      opacity: 0.85,
    });
    this.dsnBeamLine = new THREE.Line(beamGeo, beamMat);
    this.dsnBeamLine.visible = false;
    this.spaceGroup.add(this.dsnBeamLine);
    this.geosToDispose.push(beamGeo);
    this.matsToDispose.push(beamMat);
  }

  public setMissionVizState(timeline: number, targetPlanetId: PlanetId) {
    this.missionVizTimeline = THREE.MathUtils.clamp(timeline, 0, 1);
    this.missionVizTargetPlanet = targetPlanetId;
    this.gmatCurves.forEach(({ line }, pId) => {
      const mat = line.material as THREE.LineBasicMaterial;
      mat.opacity = pId === targetPlanetId ? 0.96 : 0.24;
    });
  }

  private buildAsteroids() {
    const baseCount = 85;
    const stormCount = 50;
    const total = baseCount + stormCount;
    const astGeo = new THREE.DodecahedronGeometry(1, 1);
    const astMat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.88,
      metalness: 0.22,
    });
    this.asteroidInstanced = new THREE.InstancedMesh(astGeo, astMat, total);
    this.asteroidInstanced.frustumCulled = false;

    const astPalette = [
      new THREE.Color('#78716c'),
      new THREE.Color('#57534e'),
      new THREE.Color('#64748b'),
      new THREE.Color('#7c5a43'),
    ];

    for (let i = 0; i < total; i++) {
      const isStormRock = i >= baseCount;
      const angle = Math.random() * Math.PI * 2;
      // Place primary asteroid belt realistically between Mars (355) & Jupiter (480) around the Sun
      const dist = isStormRock ? 120 + Math.random() * 540 : 382 + Math.random() * 72;
      const pos = new THREE.Vector3(
        SOLAR_SYSTEM_CENTER[0] + Math.cos(angle) * dist,
        (Math.random() - 0.5) * 44,
        SOLAR_SYSTEM_CENTER[2] + Math.sin(angle) * dist
      );
      if (!isStormRock) {
        for (const p of PLANETS) {
          if (pos.distanceTo(_v1.set(...p.position)) < p.orbitDistance + 24) {
            pos.y += 90;
          }
        }
      }

      this.asteroids.push({
        position: pos,
        rotation: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0),
        rotSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 0.7,
          (Math.random() - 0.5) * 0.7,
          (Math.random() - 0.5) * 0.5
        ),
        scale: isStormRock ? 1.8 + Math.random() * 3 : 2.1 + Math.random() * 4,
        alive: true,
        respawnTimer: 0,
        isStormRock,
      });
      this.asteroidInstanced.setColorAt(i, astPalette[i % astPalette.length]);
    }
    if (this.asteroidInstanced.instanceColor) {
      this.asteroidInstanced.instanceColor.needsUpdate = true;
    }
    this.syncAsteroidMatrices();
    this.asteroidInstanced.computeBoundingSphere();
    this.spaceGroup.add(this.asteroidInstanced);
    this.geosToDispose.push(astGeo);
    this.matsToDispose.push(astMat);
  }

  private syncAsteroidMatrices() {
    for (let i = 0; i < this.asteroids.length; i++) {
      const a = this.asteroids[i];
      _dummy.position.copy(a.position);
      _dummy.rotation.copy(a.rotation);
      const effScale = a.isStormRock ? a.scale * this.stormRockBlend : a.scale;
      _dummy.scale.setScalar(a.alive && effScale > 0.05 ? effScale : 0.0001);
      _dummy.updateMatrix();
      this.asteroidInstanced.setMatrixAt(i, _dummy.matrix);
    }
    this.asteroidInstanced.instanceMatrix.needsUpdate = true;
  }

  private buildWarpRings() {
    const ringGeo = new THREE.TorusGeometry(9.5, 0.55, 10, 32);
    const ringMat = new THREE.MeshStandardMaterial({
      color: '#d97706',
      emissive: '#d97706',
      emissiveIntensity: 0.42,
      metalness: 0.18,
      roughness: 0.72,
    });
    this.geosToDispose.push(ringGeo);
    this.matsToDispose.push(ringMat);

    const routes: Array<[number, number, number]> = [
      [0, 6, -128],
      [-55, 1, -198],
      [62, 6, -295],
      [145, 9, -198],
      [-185, -8, -225],
      [-310, -12, -225],
      [215, 18, -420],
      [185, 20, -680],
      [170, 22, -885],
      [-120, 12, -595],
      [120, 10, -565],
      [-260, 16, -480],
      [295, 14, -390],
      [0, 22, -760],
    ];

    routes.forEach((coords) => {
      const mesh = new THREE.Mesh(ringGeo, ringMat);
      mesh.position.set(...coords);
      mesh.lookAt(...SOLAR_SYSTEM_CENTER);
      this.spaceGroup.add(mesh);
      this.warpRings.push({
        mesh,
        position: new THREE.Vector3(...coords),
        cooldown: 0,
      });
    });
  }

  private buildOrbitalStation() {
    this.orbitalStationGroup.position.set(16, 15, -162);
    this.orbitalStationGroup.rotation.set(0.14, -0.32, 0.08);

    const metalMat = new THREE.MeshStandardMaterial({
      color: '#c4ccd6',
      metalness: 0.14,
      roughness: 0.82,
      envMapIntensity: 0.15,
    });
    const darkMat = new THREE.MeshStandardMaterial({
      color: '#252e3a',
      metalness: 0.18,
      roughness: 0.84,
      envMapIntensity: 0.14,
    });
    const solarMat = new THREE.MeshStandardMaterial({
      color: '#1b355c',
      emissive: '#075985',
      emissiveIntensity: 0.14,
      metalness: 0.18,
      roughness: 0.72,
      envMapIntensity: 0.16,
    });
    // Photo 4 Thermal MLI blanket accent panels (balanced desaturated orange-white)
    const thermalClothMat = new THREE.MeshStandardMaterial({
      color: '#b85c32',
      metalness: 0.05,
      roughness: 0.9,
      side: THREE.DoubleSide,
      envMapIntensity: 0.12,
    });
    const stationGraphicTex = createModelGraphicOverlayTexture('STATION // ISS-09');
    const stationDecalMat = new THREE.MeshBasicMaterial({
      map: stationGraphicTex,
      transparent: true,
      opacity: 0.78,
      depthWrite: false,
    });
    const stationWireMat = new THREE.LineBasicMaterial({
      color: '#93c5fd',
      transparent: true,
      opacity: 0.16,
    });
    const portGlowMat = new THREE.MeshBasicMaterial({ color: '#bae6fd' });

    const spineGeo = new THREE.CylinderGeometry(1.6, 1.6, 36, 14);
    spineGeo.rotateZ(Math.PI / 2);
    const spine = new THREE.Mesh(spineGeo, darkMat);

    const hubGeo = new THREE.CylinderGeometry(4.2, 4.8, 12, 16);
    hubGeo.rotateX(Math.PI / 2);
    const hub = new THREE.Mesh(hubGeo, metalMat);

    const ringGeo = new THREE.TorusGeometry(9.2, 1.15, 10, 32);
    const habRing = new THREE.Mesh(ringGeo, metalMat);
    habRing.position.z = 1.5;

    // Transparent wireframe mesh overlay on station hub & hab ring
    const hubWireGeo = new THREE.EdgesGeometry(hubGeo, 22);
    const hubWire = new THREE.LineSegments(hubWireGeo, stationWireMat);
    hubWire.scale.setScalar(1.015);
    const decalGeo = new THREE.PlaneGeometry(6.8, 3.2);
    const hubDecal = new THREE.Mesh(decalGeo, stationDecalMat);
    hubDecal.position.set(0, 4.58, 0);
    hubDecal.rotation.x = -Math.PI / 2;

    // Photo 4 Thermal shroud sail tucked behind port truss
    const sailGeo = new THREE.PlaneGeometry(11, 6.5, 4, 4);
    const sailPos = sailGeo.attributes.position;
    for (let i = 0; i < sailPos.count; i++) {
      const sx = sailPos.getX(i);
      const sy = sailPos.getY(i);
      sailPos.setZ(i, Math.sin(sx * 0.5) * 0.55 + Math.cos(sy * 0.6) * 0.35);
    }
    sailGeo.computeVertexNormals();
    const thermalSail = new THREE.Mesh(sailGeo, thermalClothMat);
    thermalSail.position.set(-7.5, -2.5, -3.4);
    thermalSail.rotation.y = 0.3;

    const panelGeo = new THREE.BoxGeometry(11, 0.22, 3.8);
    [-14, 14].forEach((x) => {
      const pTop = new THREE.Mesh(panelGeo, solarMat);
      pTop.position.set(x, 0, -4.5);
      pTop.rotation.x = 0.35;
      const pBot = new THREE.Mesh(panelGeo, solarMat);
      pBot.position.set(x, 0, 4.5);
      pBot.rotation.x = 0.35;
      this.orbitalStationGroup.add(pTop, pBot);
    });

    const dockRingGeo = new THREE.TorusGeometry(2.1, 0.16, 8, 24);
    const dockPort = new THREE.Mesh(dockRingGeo, portGlowMat);
    dockPort.position.set(0, 0, 6.4);

    const beaconLight = new THREE.PointLight('#bae6fd', 2.0, 55);
    beaconLight.position.set(0, 4, 8);

    this.orbitalStationGroup.add(
      spine,
      hub,
      habRing,
      hubWire,
      hubDecal,
      thermalSail,
      dockPort,
      beaconLight
    );
    this.spaceGroup.add(this.orbitalStationGroup);

    this.texturesToDispose.push(stationGraphicTex);
    this.geosToDispose.push(
      spineGeo,
      hubGeo,
      ringGeo,
      hubWireGeo,
      decalGeo,
      sailGeo,
      panelGeo,
      dockRingGeo
    );
    this.matsToDispose.push(
      metalMat,
      darkMat,
      solarMat,
      thermalClothMat,
      stationDecalMat,
      stationWireMat,
      portGlowMat
    );
  }

  private bindEvents(canvas: HTMLCanvasElement) {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      const code = e.code;
      if (code === 'AltLeft' || code === 'AltRight' || code === 'KeyV') {
        e.preventDefault();
        this.toggleMouseLock();
        return;
      }

      this.keys.add(code);
      if (this.paused) return;

      if (code === 'Space') {
        if (this.mode === 'planet' && !this.inRover) {
          e.preventDefault();
          this.surfaceJumpQueued = true;
        } else if (this.mode === 'interior') {
          e.preventDefault();
          this.bridgeJumpQueued = true;
        }
      }

      if (code === 'KeyF') {
        this.fireOrScan();
      } else if (code === 'KeyR') {
        if (this.mode === 'spaceflight') this.triggerBarrelRoll();
        else if (this.mode === 'planet') this.toggleRover();
      } else if (code === 'KeyC') {
        if (this.mode === 'spaceflight') {
          this.cameraMode = this.cameraMode === 'chase' ? 'cockpit' : 'chase';
        } else if (this.mode === 'planet' || this.mode === 'interior') {
          this.cameraMode = this.cameraMode === 'first-person' ? 'chase' : 'first-person';
        }
      } else if (code === 'KeyE') {
        if (this.mode === 'interior') {
          const st = this.findNearestInteriorStation();
          if (st) this.callbacks.onInteriorStationInteract(st.id);
        } else if (this.mode === 'planet') {
          const near = this.findNearestSurfaceInteractable();
          if (near?.kind === 'ship') this.callbacks.onRequestReturnBridge();
          else if (near?.kind === 'rover') this.toggleRover();
          else this.fireOrScan();
        } else if (this.mode === 'spaceflight') {
          const nearPlanet = this.findNearbyPlanet();
          if (nearPlanet) this.callbacks.onRequestLandPlanet(nearPlanet.data.id);
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      this.keys.delete(e.code);
      if (e.code === 'Space') {
        this.spaceHoldDuration = 0;
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      if (this.mouseLocked && !this.paused && e.button === 0) {
        if (this.mode === 'interior') {
          const st = this.findNearestInteriorStation();
          if (st) this.callbacks.onInteriorStationInteract(st.id);
        } else if (this.mode === 'spaceflight' || this.mode === 'planet') {
          this.fireOrScan();
        }
      }
      this.pointerDragging = true;
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (this.mouseLocked || !this.pointerDragging) return;
      this.pointerDeltaX += e.clientX - this.lastPointerX;
      this.pointerDeltaY += e.clientY - this.lastPointerY;
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!this.mouseLocked || this.paused) return;
      this.pointerDeltaX += e.movementX * 1.15;
      this.pointerDeltaY += e.movementY * 1.15;
    };

    const onPointerUp = () => {
      this.pointerDragging = false;
    };

    const onPointerLockChange = () => {
      try {
        this.mouseLocked = document.pointerLockElement === canvas;
      } catch {
        this.mouseLocked = false;
      }
      this.callbacks.onMouseLockChanged?.(this.mouseLocked);
    };

    const onPointerLockError = () => {
      this.mouseLocked = false;
      this.callbacks.onMouseLockChanged?.(false);
    };

    const onResize = () => {
      const w = Math.max(1, this.container.clientWidth);
      const h = Math.max(1, this.container.clientHeight);
      const ratio = this.computeEffectivePixelRatio();
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setPixelRatio(ratio);
      this.renderer.setSize(w, h);
      if (this.composer) {
        this.composer.setPixelRatio(ratio);
        this.composer.setSize(w, h);
        this.bloomPass?.setSize(w, h);
      }
    };

    const onLost = (e: Event) => {
      e.preventDefault();
      this.callbacks.onContextLost(true);
    };
    const onRestored = () => {
      this.callbacks.onContextLost(false);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('resize', onResize);
    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointerlockchange', onPointerLockChange);
    document.addEventListener('pointerlockerror', onPointerLockError);
    canvas.addEventListener('webglcontextlost', onLost);
    canvas.addEventListener('webglcontextrestored', onRestored);

    this.cleanupListeners.push(
      () => window.removeEventListener('keydown', onKeyDown),
      () => window.removeEventListener('keyup', onKeyUp),
      () => window.removeEventListener('resize', onResize),
      () => canvas.removeEventListener('pointerdown', onPointerDown),
      () => window.removeEventListener('pointermove', onPointerMove),
      () => window.removeEventListener('mousemove', onMouseMove),
      () => window.removeEventListener('pointerup', onPointerUp),
      () => document.removeEventListener('pointerlockchange', onPointerLockChange),
      () => document.removeEventListener('pointerlockerror', onPointerLockError),
      () => canvas.removeEventListener('webglcontextlost', onLost),
      () => canvas.removeEventListener('webglcontextrestored', onRestored)
    );
  }

  public setSceneEnv(env: SceneEnv, planetId?: PlanetId) {
    this.mode = env;
    this.cockpitRig.group.visible = false;
    if (this.vizProbeMesh) this.vizProbeMesh.visible = env === 'mission-viz';
    if (this.dsnBeamLine) {
      this.dsnBeamLine.visible =
        env === 'mission-viz' ||
        (env === 'spaceflight' && (this.digitalTwinState ? this.digitalTwinState.commsHealthy : true));
    }
    this.gmatCurves.forEach(({ line }) => {
      line.visible = env === 'mission-viz';
    });

    if (env !== 'planet') {
      this.callbacks.onRoverDriveAudio?.(0, 0, false);
      this.sunKeyLight.position.set(340, 210, 220);
      this.sunKeyLight.target.position.set(0, 0, 0);
      this.hemiLight.color.set('#bae6fd');
      this.hemiLight.intensity = 0.55;
    }

    if (env === 'planet') {
      this.spaceGroup.visible = false;
      this.interiorAnchor.visible = false;
      this.surfaceGroup.visible = true;
      const targetId = planetId || this.activeSurfacePlanet.id;
      const pData = PLANETS.find((p) => p.id === targetId) || PLANETS[0];
      this.loadPlanetSurface(pData);
      this.cameraMode = 'chase';
    } else if (env === 'interior') {
      this.spaceGroup.visible = true;
      this.surfaceGroup.visible = false;
      this.interiorAnchor.visible = true;
      this.shipRig.root.visible = false;
      this.warpStreaks.visible = false;
      this.cameraMode = 'first-person';
    } else if (env === 'spaceflight') {
      this.spaceGroup.visible = true;
      this.surfaceGroup.visible = false;
      this.interiorAnchor.visible = false;
      this.shipRig.root.visible = true;
      this.warpStreaks.visible = true;
      if (this.cameraMode !== 'chase' && this.cameraMode !== 'cockpit') {
        this.cameraMode = 'cockpit';
      }
    } else if (env === 'mission-viz') {
      this.spaceGroup.visible = true;
      this.surfaceGroup.visible = false;
      this.interiorAnchor.visible = false;
      this.shipRig.root.visible = false;
      this.warpStreaks.visible = false;
      if (this.vizProbeMesh) this.vizProbeMesh.visible = true;
    } else {
      // builder showcase
      this.spaceGroup.visible = true;
      this.surfaceGroup.visible = false;
      this.interiorAnchor.visible = false;
      this.shipRig.root.visible = true;
      this.warpStreaks.visible = false;
    }
    if (this.weatherShaderRig) {
      this.weatherShaderRig.group.visible = env !== 'builder' && env !== 'mission-viz';
    }
  }

  public enterInteriorBridge() {
    this.autopilotActive = false;
    this.bridgePlayerPos.set(0, 0, -2.0);
    this.bridgeVelY = 0;
    this.bridgeJumpQueued = false;
    this.spaceHoldDuration = 0;
    this.bridgePlayerYaw = 0;
    this.bridgePlayerPitch = 0;
    this.bridgeAstroRig.root.position.copy(this.bridgePlayerPos);
    this.bridgeAstroRig.root.rotation.y = this.bridgePlayerYaw + Math.PI;
    this.setSceneEnv('interior');
  }

  public walkToInteriorStation(stationId: InteriorStationId) {
    const st = this.interiorWorld.stations.find((item) => item.id === stationId);
    if (!st) return;
    this.bridgePlayerPos.copy(st.walkTarget);
    this.bridgeVelY = 0;
    this.bridgeJumpQueued = false;
    this.spaceHoldDuration = 0;
    this.bridgePlayerPitch = 0;
    const dx = st.position.x - st.walkTarget.x;
    const dz = st.position.z - st.walkTarget.z;
    if (Math.hypot(dx, dz) > 0.05) {
      this.bridgePlayerYaw = Math.atan2(-dx, -dz);
    }
    this.bridgeAstroRig.root.position.copy(this.bridgePlayerPos);
    this.bridgeAstroRig.root.rotation.y = this.bridgePlayerYaw + Math.PI;
  }

  public setMouseLocked(lock: boolean) {
    try {
      const canvas = this.renderer.domElement;
      if (lock && !this.paused && this.mode !== 'builder') {
        if (document.pointerLockElement !== canvas) {
          const maybePromise = canvas.requestPointerLock?.() as unknown as Promise<void> | undefined;
          if (maybePromise && typeof maybePromise.catch === 'function') {
            maybePromise.catch(() => {
              this.mouseLocked = false;
              this.callbacks.onMouseLockChanged?.(false);
            });
          }
        }
      } else if (!lock && document.pointerLockElement) {
        document.exitPointerLock?.();
      }
    } catch {
      this.mouseLocked = false;
      this.callbacks.onMouseLockChanged?.(false);
    }
  }

  public toggleMouseLock() {
    this.setMouseLocked(!this.mouseLocked);
  }

  public setPaused(paused: boolean) {
    this.paused = paused;
    if (paused) {
      this.callbacks.onRoverDriveAudio?.(0, 0, false);
      if (this.mouseLocked) {
        this.setMouseLocked(false);
      }
    }
  }

  public setShadowsEnabled(enabled: boolean) {
    this.renderer.shadowMap.enabled = enabled && !this.isSoftwareGl;
  }

  private computeEffectivePixelRatio(): number {
    const base = this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    return THREE.MathUtils.clamp(base * this.settings.resolutionScale, 0.5, 2.5);
  }

  public applySettings(settings: GameSettings) {
    const prevQuality = this.settings.qualityPreset;
    this.settings = { ...settings };
    const ratio = this.computeEffectivePixelRatio();
    const w = Math.max(1, this.container.clientWidth);
    const h = Math.max(1, this.container.clientHeight);

    this.renderer.setPixelRatio(ratio);
    this.renderer.setSize(w, h);
    if (this.composer) {
      this.composer.setPixelRatio(ratio);
      this.composer.setSize(w, h);
      this.bloomPass?.setSize(w, h);
    }
    if (this.bloomPass) {
      this.bloomPass.enabled = settings.bloomEnabled && !this.isSoftwareGl;
    }

    if (prevQuality !== settings.qualityPreset) {
      const shadowRes =
        settings.qualityPreset === 'low'
          ? 512
          : settings.qualityPreset === 'medium'
            ? 1024
            : 2048;
      this.sunKeyLight.shadow.mapSize.set(shadowRes, shadowRes);
      if (this.sunKeyLight.shadow.map) {
        this.sunKeyLight.shadow.map.dispose();
        this.sunKeyLight.shadow.map = null;
      }
      this.renderer.shadowMap.needsUpdate = true;
    }

    this.camera.fov = settings.fov;
    this.camera.updateProjectionMatrix();
  }

  public setCharacterAppearance(char: CharacterConfig) {
    this.bridgeAstroRig.updateAppearance(char);
    this.surfaceAstroRig.updateAppearance(char);
  }

  public setShipLiveryAndMetrics(liveryId: string, metrics: ShipMetrics) {
    const livery = SHIP_LIVERIES.find((l) => l.id === liveryId) || SHIP_LIVERIES[0];
    this.shipRig.applyLivery(livery);
    this.landedShipRig.applyLivery(livery);
    this.shipMetrics = metrics;
    this.maxShield = metrics.maxShield;
    this.shield = Math.min(this.maxShield, this.shield + 20);
  }

  public setDigitalTwinState(twin: DigitalTwinVisualState) {
    this.digitalTwinState = twin;
    this.shipRig.setDigitalTwinState(twin);
    this.landedShipRig.setDigitalTwinState(twin);
    if (this.dsnBeamLine) {
      this.dsnBeamLine.visible =
        this.mode === 'mission-viz' ||
        (this.mode === 'spaceflight' && twin.commsHealthy);
      const lineMat = this.dsnBeamLine.material as THREE.LineBasicMaterial;
      if (lineMat && lineMat.color) {
        lineMat.color.set(
          twin.operationalMode === 'comms_downlink'
            ? '#34d399'
            : twin.commsHealthy
              ? '#22d3ee'
              : '#f59e0b'
        );
      }
    }
  }

  public setPersonnelEffects(effects: PersonnelEffects) {
    this.personnelEffects = effects;
  }

  public setSpecialists(specialists: ShuttleSpecialist[]) {
    this.interiorWorld.syncSpecialists(specialists);
  }

  public setDiscoveredPlanets(ids: PlanetId[]) {
    this.discoveredIds = new Set(ids);
  }

  public setSurfaceProgress(
    samples: string[],
    craters: string[],
    scienceSites: string[],
    scannedCreatures: string[] = [],
    buildings: SurfaceBuildingRecord[] = []
  ) {
    this.collectedSampleIds = samples;
    this.discoveredCraterIds = craters;
    this.completedScienceIds = scienceSites;
    this.scannedCreatureIds = scannedCreatures;
    this.surfaceBuildings = buildings;
  }

  public buildSurfaceStructure(kind: SurfaceBuildingKind): SurfaceBuildingRecord | null {
    if (this.mode !== 'planet' || !this.surfaceWorld) return null;
    const basePos = this.inRover ? this.roverPos : this.playerPos;
    const yaw = this.inRover ? this.roverYaw : this.playerYaw;
    const bx = THREE.MathUtils.clamp(basePos.x + Math.sin(yaw) * 6.5, -96, 96);
    const bz = THREE.MathUtils.clamp(basePos.z + Math.cos(yaw) * 6.5, -96, 96);
    const rec: SurfaceBuildingRecord = {
      id: `${this.activeSurfacePlanet.id}_${kind}_${Date.now()}`,
      planetId: this.activeSurfacePlanet.id,
      kind,
      x: Number(bx.toFixed(1)),
      z: Number(bz.toFixed(1)),
    };
    this.surfaceBuildings.push(rec);
    this.surfaceWorld.addBuilding(rec);
    return rec;
  }

  public setVirtualInput(input: VirtualFlightInput) {
    this.virtualInput = input;
  }

  public setSuitO2(o2: number) {
    this.suitO2 = Math.max(0, Math.min(100, o2));
  }

  public setCameraMode(mode: CameraMode) {
    this.cameraMode = mode;
  }

  public resetSpaceShipNearHome() {
    this.shipPos.set(0, 8, -96);
    this.shipYaw = 0;
    this.shipPitch = 0;
    this.shipSpeed = 30;
    this.autopilotActive = false;
    this.lastNotifiedApproachId = null;
  }

  public launchToSpace(fromPlanetId?: PlanetId) {
    if (fromPlanetId) {
      const p = PLANETS.find((item) => item.id === fromPlanetId);
      if (p) {
        this.shipPos.set(p.position[0], p.position[1] + 8, p.position[2] + p.orbitDistance + 14);
        this.shipYaw = 0;
        this.shipPitch = 0.06;
        this.shipSpeed = 42;
        this.lastNotifiedApproachId = fromPlanetId;
      }
    } else if (this.shipSpeed < 16) {
      this.shipSpeed = 34;
    }
    this.cameraMode = 'cockpit';
    this.setSceneEnv('spaceflight');
  }

  public landOnPlanet(planetId: PlanetId) {
    this.setSceneEnv('planet', planetId);
  }

  private loadPlanetSurface(planet: PlanetData) {
    this.activeSurfacePlanet = planet;
    if (this.surfaceWorld) {
      this.surfaceGroup.remove(this.surfaceWorld.group);
      this.surfaceWorld.dispose();
      this.surfaceWorld = null;
    }

    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    this.surfaceWorld = buildPlanetSurfaceWorld(
      planet,
      this.collectedSampleIds,
      this.discoveredCraterIds,
      this.completedScienceIds,
      this.isSoftwareGl,
      maxAniso,
      this.surfaceBuildings
    );
    this.surfaceGroup.add(this.surfaceWorld.group);
    this.creatureManager.spawnForPlanet(planet.id, this.scannedCreatureIds, this.isSoftwareGl);

    this.inRover = false;
    this.playerPos.set(0, planetGroundHeightAt(planet.id, 0, 16), 16);
    this.playerYaw = Math.PI;
    this.surfacePlayerPitch = -0.06;
    this.playerVelY = 0;
    this.surfaceJumpQueued = false;
    this.spaceHoldDuration = 0;
    this.roverPos.set(10, planetGroundHeightAt(planet.id, 10, 9), 9);
    this.roverYaw = -0.7;
    this.roverSpeed = 0;

    this.surfaceAstroRig.root.visible = true;
    this.surfaceAstroRig.root.position.copy(this.playerPos);
    this.surfaceAstroRig.root.rotation.y = this.playerYaw;
    this.syncRoverPose(0, 0);
  }

  public setTargetPlanet(planetId: PlanetId, engageAutopilot: boolean) {
    this.targetPlanetId = planetId;
    this.autopilotActive = engageAutopilot;
    this.planets.forEach((p) => {
      p.beaconRing.visible = p.data.id === planetId;
    });
  }

  public setAutopilot(active: boolean) {
    this.autopilotActive = Boolean(active && this.targetPlanetId);
  }

  public setWeather(nextWeather: SpaceWeather) {
    if (this.weather === nextWeather) return;
    this.weather = nextWeather;
    this.weatherTimer = 28;
    if (nextWeather === 'asteroid_squall') {
      this.repositionStormRocksAroundShip();
    }
    this.callbacks.onWeatherChanged(nextWeather);
  }

  public cycleWeather() {
    const order: SpaceWeather[] = ['clear', 'solar_flare', 'asteroid_squall', 'ion_storm'];
    this.setWeather(order[(order.indexOf(this.weather) + 1) % order.length]);
  }

  private repositionStormRocksAroundShip() {
    _forward.set(0, 0, -1).applyEuler(this.shipRig.root.rotation).normalize();
    for (const a of this.asteroids) {
      if (!a.isStormRock) continue;
      a.alive = true;
      a.respawnTimer = 0;
      const forwardDist = 45 + Math.random() * 210;
      a.position
        .copy(this.shipPos)
        .addScaledVector(_forward, forwardDist)
        .add(
          _v1.set(
            (Math.random() - 0.5) * 140,
            (Math.random() - 0.5) * 90,
            (Math.random() - 0.5) * 80
          )
        );
    }
  }

  public triggerBarrelRoll() {
    if (this.mode !== 'spaceflight' || this.barrelRollCooldown > 0) return;
    this.barrelRollTimer = 0.65;
    this.barrelRollCooldown = 2.1;
    this.callbacks.onBarrelRoll();
  }

  public toggleRover() {
    if (this.mode !== 'planet') return;
    if (this.inRover) {
      this.inRover = false;
      this.playerPos.set(
        this.roverPos.x + Math.cos(this.roverYaw) * 3.2,
        planetGroundHeightAt(this.activeSurfacePlanet.id, this.roverPos.x + 3.2, this.roverPos.z),
        this.roverPos.z - Math.sin(this.roverYaw) * 3.2
      );
      this.surfaceAstroRig.root.visible = true;
      this.callbacks.onRoverToggled(false);
    } else {
      const dist = Math.hypot(
        this.playerPos.x - this.roverPos.x,
        this.playerPos.z - this.roverPos.z
      );
      if (dist <= 11) {
        this.inRover = true;
        this.surfaceAstroRig.root.visible = false;
        this.callbacks.onRoverToggled(true);
      }
    }
  }

  public fireOrScan() {
    if (this.mode === 'spaceflight') this.firePlasma();
    else if (this.mode === 'planet') this.performSurfaceScan();
  }

  private firePlasma() {
    if (this.cannonCooldown > 0) return;
    const baseCd = Math.max(0.14, 0.36 - (this.shipMetrics.cannonLevel - 1) * 0.06);
    const effCd = baseCd / Math.max(0.8, this.personnelEffects.flightEfficiencyMult);
    this.cannonCooldown = this.weather === 'ion_storm' ? effCd * 0.72 : effCd;
    this.callbacks.onLaserFire();

    _forward.set(0, 0, -1).applyEuler(this.shipRig.root.rotation).normalize();
    const rightVec = _v1.set(1, 0, 0).applyEuler(this.shipRig.root.rotation).normalize();

    [-1.65, 1.65].forEach((offset) => {
      const boltMesh = new THREE.Mesh(this.boltGeo, this.boltMat);
      _boltStart.copy(this.shipPos).addScaledVector(rightVec, offset).addScaledVector(_forward, 2.2);
      boltMesh.position.copy(_boltStart);
      boltMesh.rotation.copy(this.shipRig.root.rotation);
      this.spaceGroup.add(boltMesh);

      this.plasmaBolts.push({
        mesh: boltMesh,
        velocity: _forward.clone().multiplyScalar(225 + this.shipSpeed),
        life: 1.35,
      });
    });
  }

  private performSurfaceScan() {
    if (!this.surfaceWorld) return;
    const activePos = this.inRover ? this.roverPos : this.playerPos;
    if (Math.hypot(activePos.x, activePos.z) <= 9.5) {
      this.callbacks.onSpacecraftRefuel?.();
      return;
    }
    let acted = false;

    for (const item of this.surfaceWorld.interactables) {
      if (item.collected) continue;
      const dist = Math.hypot(activePos.x - item.position.x, activePos.z - item.position.z);
      if (dist <= item.radius + 3.5) {
        if (item.kind === 'sample') {
          this.surfaceWorld.markCollected(item.id);
          this.collectedSampleIds.push(item.id);
          this.callbacks.onSampleCollected(item.id, this.activeSurfacePlanet.id);
          acted = true;
          break;
        } else if (item.kind === 'crater') {
          this.surfaceWorld.markCollected(item.id);
          this.discoveredCraterIds.push(item.id);
          this.callbacks.onCraterDiscovered(item.id);
          acted = true;
          break;
        } else if (item.kind === 'science') {
          this.surfaceWorld.markCollected(item.id);
          this.completedScienceIds.push(item.id);
          this.callbacks.onScienceSiteCompleted(item.id, item.dataMb || 50);
          acted = true;
          break;
        } else if (item.kind === 'monolith') {
          item.collected = true;
          this.callbacks.onMonolithInspected();
          acted = true;
          break;
        } else if (item.kind === 'pickup') {
          this.surfaceWorld.markCollected(item.id);
          this.collectedSampleIds.push(item.id);
          this.callbacks.onPickupCollected?.(item.id, item.pickupType || 'o2');
          acted = true;
          break;
        }
      }
    }

    if (!acted) {
      const creature = this.creatureManager.findNearestUnscanned(activePos.x, activePos.z, 8.5);
      if (creature) {
        this.creatureManager.markScanned(creature.id);
        this.scannedCreatureIds.push(creature.id);
        this.callbacks.onCreatureScanned?.(creature.id, creature.spec.name.en);
        acted = true;
      }
    }

    if (!acted) this.callbacks.onLaserFire();
  }

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private tick = () => {
    if (this.disposed) return;
    const rawDelta = this.clock.getDelta();
    const dt = Math.min(rawDelta, 0.05);
    const elapsed = this.clock.elapsedTime;

    if (!this.paused) {
      if (this.mode === 'builder') {
        this.updateBuilderShowcase(dt, elapsed);
      } else if (this.mode === 'interior') {
        this.updateSpaceWorld(dt, elapsed);
        this.updateInteriorBridge(dt, elapsed);
        this.updateWeatherShader(dt, elapsed, false);
      } else if (this.mode === 'mission-viz') {
        this.updateSpaceWorld(dt, elapsed);
        this.updateMissionViz(dt, elapsed);
      } else if (this.mode === 'spaceflight') {
        this.updateWeather(dt, elapsed);
        this.updateSpaceWorld(dt, elapsed);
        this.updateFlight(dt);
        if (this.dsnBeamLine && this.dsnBeamLine.visible) {
          const posAttr = this.dsnBeamLine.geometry.attributes.position as THREE.BufferAttribute;
          posAttr.setXYZ(0, -90, -3, -228);
          posAttr.setXYZ(1, this.shipPos.x, this.shipPos.y + 1.4, this.shipPos.z);
          posAttr.needsUpdate = true;
        }
        this.updateSpaceCamera(dt, elapsed);
        this.updateWarpStreaks(dt);
        this.updateWeatherShader(dt, elapsed, false);
      } else if (this.mode === 'planet') {
        this.updateSurface(dt, elapsed);
        this.updateSurfaceCamera(dt);
        this.updateWeatherShader(dt, elapsed, true);
      }
    }

    if (this.composer && !this.isSoftwareGl) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }

    this.telemetryTimer += dt;
    if (this.telemetryTimer >= 0.07) {
      this.telemetryTimer = 0;
      if (this.mode === 'interior') {
        this.emitInteriorTelemetry();
        this.emitSpaceTelemetry();
      } else if (this.mode === 'spaceflight') this.emitSpaceTelemetry();
      else if (this.mode === 'planet') {
        this.emitSurfaceTelemetry();
        this.emitSpaceTelemetry();
      }
    }

    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  };

  private updateWeatherShader(dt: number, elapsed: number, isPlanetSurface: boolean) {
    if (!this.weatherShaderRig) return;
    if (isPlanetSurface) {
      _v2.copy(this.inRover ? this.roverPos : this.playerPos);
      _dummy.rotation.set(0, 0, 0);
      const res = this.weatherShaderRig.update(
        elapsed,
        dt,
        this.weather,
        _v2,
        _dummy.rotation,
        14,
        true,
        this.activeSurfacePlanet.atmosphereColor
      );
      this.envRadiationSievert = res.radiationSievert;
      this.envDustDensityPct = res.dustDensityPct;
    } else {
      // In interior bridge, offset ahead of forward panoramic window so dust/storms stay outside the hull
      if (this.mode === 'interior') {
        _forward.set(0, 0, -1).applyAxisAngle(_upAxis, this.shipYaw).normalize();
        _v2.copy(this.shipPos).addScaledVector(_forward, 64);
        _dummy.rotation.set(0, this.shipYaw, 0);
      } else {
        _v2.copy(this.shipPos);
        _dummy.rotation.copy(this.shipRig.root.rotation);
      }
      const res = this.weatherShaderRig.update(
        elapsed,
        dt,
        this.weather,
        _v2,
        _dummy.rotation,
        this.mode === 'interior' ? 18 : this.shipSpeed,
        false
      );
      this.envRadiationSievert = res.radiationSievert;
      this.envDustDensityPct = res.dustDensityPct;
    }
  }

  private updateMissionViz(dt: number, elapsed: number) {
    this.cockpitRig.group.visible = false;
    this.sceneBgColor.lerp(_targetBgColor.set('#040710'), 0.08);
    this.sceneFog.color.copy(this.sceneBgColor);
    this.sceneFog.density = 0.00018;

    this.vizOrbitAngle += dt * 0.14 - this.pointerDeltaX * 0.006;
    this.pointerDeltaX = 0;
    this.pointerDeltaY = 0;

    const entry = this.gmatCurves.get(this.missionVizTargetPlanet);
    if (entry) {
      const pt = entry.curve.getPointAt(this.missionVizTimeline);
      this.vizProbeMesh.position.copy(pt);
      this.vizProbeMesh.rotation.y = elapsed * 2.1;
      const pulse = 1 + Math.sin(elapsed * 4) * 0.15;
      this.vizProbeMesh.scale.setScalar(pulse);

      if (this.dsnBeamLine) {
        const posAttr = this.dsnBeamLine.geometry.attributes.position as THREE.BufferAttribute;
        posAttr.setXYZ(0, -90, -3, -228);
        posAttr.setXYZ(1, pt.x, pt.y, pt.z);
        posAttr.needsUpdate = true;
      }
    }

    const center = _v1.set(SOLAR_SYSTEM_CENTER[0], 10, SOLAR_SYSTEM_CENTER[2]);
    const radius = 980;
    _desiredCamPos.set(
      center.x + Math.sin(this.vizOrbitAngle) * radius,
      540,
      center.z + Math.cos(this.vizOrbitAngle) * radius
    );
    this.camera.position.lerp(_desiredCamPos, 1 - Math.exp(-5 * dt));
    this.camera.lookAt(center);
  }

  private updateBuilderShowcase(_dt: number, elapsed: number) {
    this.cockpitRig.group.visible = false;
    this.sceneBgColor.lerp(_targetBgColor.set('#040710'), 0.08);
    this.sceneFog.color.copy(this.sceneBgColor);
    this.sceneFog.density = 0.00045;
    this.shipRig.root.position.set(0, Math.sin(elapsed * 1.4) * 0.35, 0);
    this.shipRig.root.rotation.set(0.08, elapsed * 0.38, Math.sin(elapsed * 0.8) * 0.06, 'YXZ');
    this.shipRig.setThrustVisual(0.42, false);
    this.camera.position.set(6.4, 2.7, 7.6);
    this.camera.lookAt(0, 0.2, 0);
  }

  private updateInteriorBridge(dt: number, elapsed: number) {
    this.cockpitRig.group.visible = false;
    this.sceneBgColor.lerp(_targetBgColor.set('#040710'), 0.1);
    this.sceneFog.density = 0.00025;

    // Position the entire Bridge aligned with shipPos looking forward at -Z (the planets & stars!)
    _forward.set(0, 0, -1).applyAxisAngle(_upAxis, this.shipYaw).normalize();
    this.interiorAnchor.position.copy(this.shipPos);
    this.interiorAnchor.rotation.set(0, this.shipYaw, 0);

    // Animate Holographic Nav Globe, MDL Reactor Ring, Crew Scientists & warm coffee lamp flicker
    this.interiorWorld.holoPlanet.rotation.y += dt * 0.7;
    this.interiorWorld.holoRing.rotation.z += dt * 0.9;
    this.interiorWorld.reactorRing.rotation.z += dt * 1.4;
    this.interiorWorld.coffeeSteamLight.intensity = 2.0 + Math.sin(elapsed * 2.5) * 0.18;
    this.interiorWorld.updateNpcs(elapsed);

    // Player walking inside 36m x 34m Multi-Room Space Shuttle Complex
    const sens = this.settings.mouseSensitivity;
    const ySign = this.settings.invertY ? -1 : 1;
    const spd = this.settings.gameplaySpeed;
    const sprintHeld = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');

    const forwardInput =
      (this.keys.has('KeyW') || this.keys.has('ArrowUp') ? 1 : 0) -
      (this.keys.has('KeyS') || this.keys.has('ArrowDown') ? 1 : 0) +
      this.virtualInput.thrust;

    const strafeInput =
      (this.keys.has('KeyD') || this.keys.has('ArrowRight') ? 1 : 0) -
      (this.keys.has('KeyA') || this.keys.has('ArrowLeft') ? 1 : 0);

    const turnInput = this.virtualInput.yaw - this.pointerDeltaX * 0.055 * sens;

    this.bridgePlayerPitch = THREE.MathUtils.clamp(
      this.bridgePlayerPitch - this.pointerDeltaY * 0.0025 * sens * ySign,
      -0.75,
      0.85
    );
    this.pointerDeltaX = 0;
    this.pointerDeltaY = 0;

    this.bridgePlayerYaw += turnInput * 2.5 * spd * dt;

    const inputMag = Math.hypot(forwardInput, strafeInput);
    const normFwd = inputMag > 1 ? forwardInput / inputMag : forwardInput;
    const normStrafe = inputMag > 1 ? strafeInput / inputMag : strafeInput;
    const moveMag = Math.min(1, inputMag);

    const sinY = Math.sin(this.bridgePlayerYaw);
    const cosY = Math.cos(this.bridgePlayerYaw);
    // Forward = (-sinY, -cosY), Right = (+cosY, -sinY)
    const moveDirX = -sinY * normFwd + cosY * normStrafe;
    const moveDirZ = -cosY * normFwd - sinY * normStrafe;

    const walkSpeed = (sprintHeld ? 16.5 : 9.8) * spd;
    this.bridgePlayerPos.x += moveDirX * walkSpeed * dt;
    this.bridgePlayerPos.z += moveDirZ * walkSpeed * dt;

    // Keep player inside 36m x 34m Multi-Room Shuttle boundaries
    this.bridgePlayerPos.x = THREE.MathUtils.clamp(this.bridgePlayerPos.x, -16.6, 16.6);
    this.bridgePlayerPos.z = THREE.MathUtils.clamp(this.bridgePlayerPos.z, -14.2, 15.6);

    // Earth-standard 1G shuttle deck jump physics (9.81 m/s²) + hold Space for Jetpack
    const bridgeSpaceHeld = this.keys.has('Space');
    if (bridgeSpaceHeld) {
      this.spaceHoldDuration += dt;
    } else {
      this.spaceHoldDuration = 0;
    }

    const bridgeGrounded = this.bridgePlayerPos.y <= 0.05 && this.bridgeVelY <= 0;
    const bridgeJumpRequested = this.bridgeJumpQueued;
    this.bridgeJumpQueued = false;
    if (bridgeGrounded && bridgeJumpRequested) {
      this.bridgeVelY = 5.2;
    }

    const bridgeJetpackActive = bridgeSpaceHeld && this.spaceHoldDuration > 0.2;
    const bridgePrevVelY = this.bridgeVelY;
    const bridgeNetAccelY = bridgeJetpackActive ? 16.5 - 9.81 : -9.81;
    this.bridgeVelY += bridgeNetAccelY * dt;
    if (bridgeJetpackActive) {
      this.bridgeVelY = Math.min(7.5, this.bridgeVelY);
    }
    this.bridgePlayerPos.y += 0.5 * (bridgePrevVelY + this.bridgeVelY) * dt;
    if (this.bridgePlayerPos.y <= 0) {
      this.bridgePlayerPos.y = 0;
      this.bridgeVelY = 0;
    } else if (this.bridgePlayerPos.y > 2.75) {
      this.bridgePlayerPos.y = 2.75;
      if (this.bridgeVelY > 0) this.bridgeVelY = 0;
    }
    const bridgeAirborne = this.bridgePlayerPos.y > 0.1 || bridgeJetpackActive;

    const targetMeshYaw =
      moveMag > 0.05 ? Math.atan2(moveDirX, moveDirZ) : this.bridgePlayerYaw + Math.PI;
    this.bridgeAstroRig.root.position.copy(this.bridgePlayerPos);
    this.bridgeAstroRig.root.rotation.y = dampAngle(
      this.bridgeAstroRig.root.rotation.y,
      targetMeshYaw,
      moveMag > 0.05 ? 12 : 6,
      dt
    );
    this.bridgeAstroRig.setWalkCycle(
      moveMag * (sprintHeld ? 1.45 : 1),
      bridgeAirborne,
      elapsed,
      !bridgeJetpackActive
    );

    const worldPlayerPos = _v2
      .copy(this.bridgePlayerPos)
      .applyAxisAngle(_upAxis, this.shipYaw)
      .add(this.shipPos);

    const totalYaw = this.shipYaw + this.bridgePlayerYaw;
    const lookDir = _v1.set(-Math.sin(totalYaw), 0, -Math.cos(totalYaw));
    const pitchOffset = Math.sin(this.bridgePlayerPitch) * 10;

    if (this.cameraMode === 'first-person') {
      this.bridgeAstroRig.root.visible = false;
      const headBob = !bridgeAirborne && moveMag > 0.1 ? Math.sin(elapsed * 10) * 0.032 : 0;
      this.camera.position.set(worldPlayerPos.x, worldPlayerPos.y + 1.65 + headBob, worldPlayerPos.z);
      _lookTarget.copy(this.camera.position).addScaledVector(lookDir, 10);
      _lookTarget.y += pitchOffset - 0.1;
      this.camera.lookAt(_lookTarget);
    } else {
      this.bridgeAstroRig.root.visible = true;
      _desiredCamPos.copy(worldPlayerPos).addScaledVector(lookDir, -3.4);
      _desiredCamPos.y += 2.25 - Math.sin(this.bridgePlayerPitch) * 0.9;
      this.camera.position.lerp(_desiredCamPos, 1 - Math.exp(-8 * dt));
      _lookTarget.copy(worldPlayerPos).addScaledVector(lookDir, 4.5);
      _lookTarget.y += 1.3 + Math.sin(this.bridgePlayerPitch) * 4;
      this.camera.lookAt(_lookTarget);
    }

    const targetFov = this.settings.fov;
    if (Math.abs(this.camera.fov - targetFov) > 0.1) {
      this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 5, dt);
      this.camera.updateProjectionMatrix();
    }
  }

  private updateSpaceWorld(dt: number, elapsed: number) {
    for (const p of this.planets) {
      p.mesh.rotation.y += dt * 0.08;
      if (p.cloudMesh) p.cloudMesh.rotation.y += dt * 0.115;
      if (p.ringMesh) p.ringMesh.rotation.z += dt * 0.04;
      if (p.beaconRing.visible) {
        p.beaconRing.rotation.z += dt * 0.6;
        p.beaconRing.scale.setScalar(1 + Math.sin(elapsed * 3) * 0.04);
      }
      for (const m of p.moons) m.pivot.rotation.y += dt * m.speed;
    }

    for (const ring of this.warpRings) {
      ring.mesh.rotation.z += dt * 1.4;
      if (ring.cooldown > 0) ring.cooldown -= dt;
    }

    this.orbitalStationGroup.rotation.z += dt * 0.045;

    const spinBoost = this.weather === 'asteroid_squall' ? 2.1 : 1.0;
    const targetStormBlend = this.weather === 'asteroid_squall' ? 1 : 0;
    this.stormRockBlend = THREE.MathUtils.damp(this.stormRockBlend, targetStormBlend, 2.2, dt);

    for (const a of this.asteroids) {
      if (a.isStormRock && this.stormRockBlend <= 0.04) continue;
      if (a.alive) {
        a.rotation.x += a.rotSpeed.x * dt * spinBoost;
        a.rotation.y += a.rotSpeed.y * dt * spinBoost;
        if (a.isStormRock && this.weather === 'asteroid_squall') {
          a.position.z += dt * 15;
          if (a.position.distanceToSquared(this.shipPos) > 260 * 260) {
            _forward.set(0, 0, -1).applyEuler(this.shipRig.root.rotation).normalize();
            a.position
              .copy(this.shipPos)
              .addScaledVector(_forward, 130 + Math.random() * 120)
              .add(_v1.set((Math.random() - 0.5) * 140, (Math.random() - 0.5) * 90, 0));
          }
        }
      } else {
        a.respawnTimer -= dt;
        if (a.respawnTimer <= 0) a.alive = true;
      }
    }
    this.syncAsteroidMatrices();

    for (let i = this.plasmaBolts.length - 1; i >= 0; i--) {
      const bolt = this.plasmaBolts[i];
      bolt.life -= dt;
      bolt.mesh.position.addScaledVector(bolt.velocity, dt);
      let hit = false;
      for (const a of this.asteroids) {
        if (!a.alive) continue;
        if (a.isStormRock && this.stormRockBlend < 0.35) continue;
        if (bolt.mesh.position.distanceToSquared(a.position) < (a.scale + 2.5) ** 2) {
          a.alive = false;
          a.respawnTimer = 14;
          hit = true;
          this.syncAsteroidMatrices();
          this.callbacks.onAsteroidMined();
          break;
        }
      }
      if (hit || bolt.life <= 0) {
        this.spaceGroup.remove(bolt.mesh);
        this.plasmaBolts.splice(i, 1);
      }
    }
  }

  private updateFlight(dt: number) {
    if (this.cannonCooldown > 0) this.cannonCooldown = Math.max(0, this.cannonCooldown - dt);
    if (this.barrelRollCooldown > 0)
      this.barrelRollCooldown = Math.max(0, this.barrelRollCooldown - dt);

    const repairMult = this.personnelEffects.repairSpeedMult;
    const effectiveShieldDelta =
      this.weatherShieldDelta >= 0
        ? this.weatherShieldDelta * repairMult
        : this.weatherShieldDelta + Math.max(0, (repairMult - 1) * 1.4);

    this.shield = THREE.MathUtils.clamp(
      this.shield + effectiveShieldDelta * dt,
      8,
      this.maxShield
    );

    const sens = this.settings.mouseSensitivity;
    const ySign = this.settings.invertY ? -1 : 1;
    const spd = this.settings.gameplaySpeed;

    const thrustInput =
      (this.keys.has('KeyW') || this.keys.has('ArrowUp') ? 1 : 0) -
      (this.keys.has('KeyS') || this.keys.has('ArrowDown') ? 1 : 0) +
      this.virtualInput.thrust;

    const yawInput =
      (this.keys.has('KeyA') || this.keys.has('ArrowLeft') ? 1 : 0) -
      (this.keys.has('KeyD') || this.keys.has('ArrowRight') ? 1 : 0) +
      this.virtualInput.yaw -
      this.pointerDeltaX * 0.075 * sens;

    // KeyQ pitch-up, KeyZ pitch-down (frees KeyE purely for planet landing without conflict!)
    const pitchInput =
      (this.keys.has('KeyQ') ? 1 : 0) -
      (this.keys.has('KeyZ') ? 1 : 0) +
      this.virtualInput.pitch -
      this.pointerDeltaY * 0.075 * sens * ySign;

    this.pointerDeltaX = 0;
    this.pointerDeltaY = 0;

    if (Math.abs(yawInput) > 0.14 || Math.abs(pitchInput) > 0.14 || Math.abs(thrustInput) > 0.5) {
      if (this.autopilotActive) this.autopilotActive = false;
    }

    const boostHeld =
      this.keys.has('ShiftLeft') ||
      this.keys.has('ShiftRight') ||
      this.keys.has('Space') ||
      this.virtualInput.boost;

    if (boostHeld && !this.wasBoosting) this.callbacks.onBoostStart();
    this.wasBoosting = boostHeld;

    const flightMult = THREE.MathUtils.clamp(this.personnelEffects.flightEfficiencyMult, 0.85, 1.3);
    const baseCruise =
      (34 + (this.shipMetrics.engineLevel - 1) * 9) * this.weatherSpeedMultiplier * flightMult * spd;
    const maxCruise =
      (88 + (this.shipMetrics.engineLevel - 1) * 18) * this.weatherSpeedMultiplier * flightMult * spd;
    const boostMax = maxCruise * 2.05;

    let targetYawRate = THREE.MathUtils.clamp(yawInput, -1.6, 1.6) * 1.55;
    let targetPitchRate = THREE.MathUtils.clamp(pitchInput, -1.6, 1.6) * 1.25;
    let desiredSpeed = baseCruise;

    if (this.autopilotActive && this.targetPlanetId) {
      const targetP = this.planets.find((p) => p.data.id === this.targetPlanetId);
      if (targetP) {
        _v1.set(...targetP.data.position).sub(this.shipPos);
        const dist = _v1.length();
        const desiredYaw = Math.atan2(-_v1.x, -_v1.z);
        let yawDiff = desiredYaw - this.shipYaw;
        while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
        while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;

        const horizDist = Math.sqrt(_v1.x * _v1.x + _v1.z * _v1.z);
        const desiredPitch = Math.atan2(_v1.y, Math.max(1, horizDist));
        const pitchDiff = desiredPitch - this.shipPitch;

        targetYawRate = THREE.MathUtils.clamp(yawDiff * 2.6, -1.8, 1.8);
        targetPitchRate = THREE.MathUtils.clamp(pitchDiff * 2.4, -1.35, 1.35);
        desiredSpeed = dist > targetP.data.orbitDistance * 1.4 ? boostMax * 0.96 : baseCruise * 0.92;

        if (dist <= targetP.data.orbitDistance * 0.96) {
          this.autopilotActive = false;
          this.callbacks.onOrbitArrived(targetP.data.id);
        }
      }
    } else {
      if (boostHeld) desiredSpeed = boostMax;
      else if (thrustInput > 0.1) desiredSpeed = maxCruise;
      else if (thrustInput < -0.1) desiredSpeed = 6;
    }

    this.shipYaw += targetYawRate * dt;
    this.shipPitch = THREE.MathUtils.clamp(this.shipPitch + targetPitchRate * dt, -1.15, 1.15);

    if (!this.autopilotActive && Math.abs(pitchInput) < 0.05) {
      this.shipPitch = THREE.MathUtils.damp(this.shipPitch, 0, 0.85, dt);
    }

    const prevSpeed = this.shipSpeed;
    this.shipSpeed = THREE.MathUtils.damp(this.shipSpeed, desiredSpeed, 2.2, dt);
    const accelRaw = Math.abs(this.shipSpeed - prevSpeed) / Math.max(0.01, dt);
    this.currentAccelG = THREE.MathUtils.clamp(
      0.15 + accelRaw * 0.045 + (boostHeld ? 1.85 : 0),
      0,
      5.0
    );

    const targetBank = THREE.MathUtils.clamp(targetYawRate * 0.38, -0.6, 0.6);
    this.bankAngle = THREE.MathUtils.damp(this.bankAngle, targetBank, 4.8, dt);

    this.cockpitRig.updateStick(pitchInput, yawInput);

    this.shipRig.root.rotation.set(this.shipPitch, this.shipYaw, this.bankAngle, 'YXZ');
    _forward.set(0, 0, -1).applyEuler(this.shipRig.root.rotation).normalize();
    this.shipPos.addScaledVector(_forward, this.shipSpeed * dt);

    const sectorDist = this.shipPos.length();
    if (sectorDist > 1450) this.shipPos.multiplyScalar(1450 / sectorDist);
    this.shipRig.root.position.copy(this.shipPos);

    if (this.barrelRollTimer > 0) {
      this.barrelRollTimer = Math.max(0, this.barrelRollTimer - dt);
      this.shipRig.hullMeshGroup.rotation.z = (1 - this.barrelRollTimer / 0.65) * Math.PI * 2;
    } else {
      this.shipRig.hullMeshGroup.rotation.z = 0;
    }

    const thrustRatio = THREE.MathUtils.clamp(this.shipSpeed / maxCruise, 0.15, 1);
    this.shipRig.setThrustVisual(
      thrustRatio,
      boostHeld || (this.autopilotActive && this.shipSpeed > maxCruise * 1.1)
    );

    for (const ring of this.warpRings) {
      if (ring.cooldown > 0) continue;
      if (this.shipPos.distanceToSquared(ring.position) < 11.5 * 11.5) {
        ring.cooldown = 6;
        this.shipSpeed = Math.max(this.shipSpeed, boostMax * 1.05);
        this.shield = Math.min(this.maxShield, this.shield + 22);
        this.callbacks.onRingPassed();
      }
    }

    if (this.barrelRollTimer <= 0) {
      for (const a of this.asteroids) {
        if (!a.alive) continue;
        if (a.isStormRock && this.stormRockBlend < 0.35) continue;
        const hitRadius = a.scale + 2.4;
        if (this.shipPos.distanceToSquared(a.position) < hitRadius * hitRadius) {
          a.alive = false;
          a.respawnTimer = 14;
          this.syncAsteroidMatrices();
          this.shield = Math.max(8, this.shield - 18);
          this.shipSpeed *= 0.65;
          this.callbacks.onAsteroidHit();
          break;
        }
      }
    }

    for (const p of this.planets) {
      _v2.set(...p.data.position);
      const dist = this.shipPos.distanceTo(_v2);
      const minSafe = p.data.radius + 7;
      if (dist < minSafe) {
        _v3.copy(this.shipPos).sub(_v2).normalize();
        this.shipPos.copy(_v2).addScaledVector(_v3, minSafe);
      }
      if (dist <= p.data.orbitDistance && this.lastNotifiedApproachId !== p.data.id) {
        this.lastNotifiedApproachId = p.data.id;
        this.callbacks.onOrbitArrived(p.data.id);
      }
    }
  }

  private updateSpaceCamera(dt: number, _elapsed: number) {
    const boosting =
      this.keys.has('ShiftLeft') ||
      this.keys.has('ShiftRight') ||
      this.keys.has('Space') ||
      this.virtualInput.boost ||
      (this.autopilotActive && this.shipSpeed > 75);

    if (this.cameraMode === 'cockpit') {
      this.shipRig.root.visible = false;
      this.cockpitRig.group.visible = true;
      _forward.set(0, 0, -1).applyEuler(this.shipRig.root.rotation).normalize();
      _v1.copy(_upAxis).applyEuler(this.shipRig.root.rotation).normalize();
      this.camera.position.copy(this.shipPos).addScaledVector(_v1, 0.55);
      _lookTarget.copy(this.camera.position).addScaledVector(_forward, 25);
      this.camera.lookAt(_lookTarget);
    } else {
      this.cockpitRig.group.visible = false;
      this.shipRig.root.visible = true;
      _forward.set(0, 0, -1).applyEuler(this.shipRig.root.rotation).normalize();
      _v1.copy(_upAxis).applyEuler(this.shipRig.root.rotation).normalize();
      const followDist = boosting ? 12.2 : 10.5;
      _desiredCamPos
        .copy(this.shipPos)
        .addScaledVector(_forward, -followDist)
        .addScaledVector(_v1, 3.2);
      this.camera.position.lerp(_desiredCamPos, 1 - Math.exp(-8.5 * dt));
      _lookTarget.copy(this.shipPos).addScaledVector(_forward, 14);
      this.camera.lookAt(_lookTarget);
    }

    const targetFov = boosting ? Math.min(98, this.settings.fov + 14) : this.settings.fov;
    if (Math.abs(this.camera.fov - targetFov) > 0.05) {
      this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 5, dt);
      this.camera.updateProjectionMatrix();
    }
  }

  private updateWeather(dt: number, elapsed: number) {
    this.weatherTimer -= dt;
    if (this.weatherTimer <= 0) {
      const solaris = this.planets.find((p) => p.data.id === 'solaris');
      const mercury = this.planets.find((p) => p.data.id === 'mercury');
      const neptune = this.planets.find((p) => p.data.id === 'neptune');
      let next: SpaceWeather;
      if (
        ((solaris && this.shipPos.distanceTo(_v1.set(...solaris.data.position)) < 220) ||
          (mercury && this.shipPos.distanceTo(_v1.set(...mercury.data.position)) < 200)) &&
        this.weather !== 'solar_flare'
      ) {
        next = 'solar_flare';
      } else if (
        neptune &&
        this.shipPos.distanceTo(_v1.set(...neptune.data.position)) < 280 &&
        this.weather !== 'ion_storm'
      ) {
        next = 'ion_storm';
      } else {
        const order: SpaceWeather[] = ['clear', 'solar_flare', 'asteroid_squall', 'ion_storm'];
        next = order[(order.indexOf(this.weather) + 1) % order.length];
      }
      this.setWeather(next);
    }

    const shieldUpgradeBonus = (this.shipMetrics.shieldLevel - 1) * 0.55;
    let targetFogDensity = 0.00048;
    let targetSunIntensity = 2.8;
    let targetRimIntensity = 0.9;
    let targetStreakSize = 0.65;
    let targetStreakOpacity = 0.45;

    if (this.weather === 'solar_flare') {
      this.weatherSpeedMultiplier = 1.22;
      this.weatherShieldDelta = this.barrelRollTimer > 0 ? 0 : -3.5 + shieldUpgradeBonus;
      _targetBgColor.set('#1a0b04');
      _targetSunColor.set('#fed7aa');
      _targetRimColor.set('#f97316');
      _targetStreakColor.set('#fbbf24');
      targetFogDensity = 0.00072;
      targetSunIntensity = 3.4 + Math.sin(elapsed * 4.5) * 0.35;
      targetRimIntensity = 1.45;
      targetStreakSize = 1.05;
      targetStreakOpacity = 0.78;
    } else if (this.weather === 'asteroid_squall') {
      this.weatherSpeedMultiplier = 0.82;
      this.weatherShieldDelta = 1.4 + (this.shipMetrics.shieldLevel - 1) * 1.1;
      _targetBgColor.set('#100e13');
      _targetSunColor.set('#e2e8f0');
      _targetRimColor.set('#94a3b8');
      _targetStreakColor.set('#cbd5e1');
      targetFogDensity = 0.00088;
      targetSunIntensity = 2.0;
      targetRimIntensity = 0.85;
      targetStreakSize = 0.85;
      targetStreakOpacity = 0.62;
    } else if (this.weather === 'ion_storm') {
      this.weatherSpeedMultiplier = 1.18;
      this.weatherShieldDelta = this.barrelRollTimer > 0 ? 0 : -2.0 + shieldUpgradeBonus;
      _targetBgColor.set('#0a0f24');
      _targetSunColor.set('#c4b5fd');
      _targetRimColor.set('#22d3ee');
      _targetStreakColor.set('#67e8f9');
      targetFogDensity = 0.0008;
      targetSunIntensity = 2.25;
      targetRimIntensity = 1.65 + Math.sin(elapsed * 7) * 0.35;
      targetStreakSize = 0.98;
      targetStreakOpacity = 0.75;
    } else {
      this.weatherSpeedMultiplier = 1.0;
      this.weatherShieldDelta = 2.5 + (this.shipMetrics.shieldLevel - 1) * 1.8;
      _targetBgColor.set('#040710');
      _targetSunColor.set('#fff7ed');
      _targetRimColor.set('#38bdf8');
      _targetStreakColor.set('#bae6fd');
    }

    const alpha = 1 - Math.exp(-1.8 * dt);
    this.sceneBgColor.lerp(_targetBgColor, alpha);
    this.sceneFog.color.copy(this.sceneBgColor);
    this.sceneFog.density = THREE.MathUtils.lerp(this.sceneFog.density, targetFogDensity, alpha);
    this.sunKeyLight.color.lerp(_targetSunColor, alpha);
    this.sunKeyLight.intensity = THREE.MathUtils.lerp(this.sunKeyLight.intensity, targetSunIntensity, alpha);
    this.rimLight.color.lerp(_targetRimColor, alpha);
    this.rimLight.intensity = THREE.MathUtils.lerp(this.rimLight.intensity, targetRimIntensity, alpha);
    this.warpStreakMat.color.lerp(_targetStreakColor, alpha);
    this.warpStreakMat.size = THREE.MathUtils.lerp(this.warpStreakMat.size, targetStreakSize, alpha);
    this.warpStreakMat.opacity = THREE.MathUtils.lerp(this.warpStreakMat.opacity, targetStreakOpacity, alpha);
  }

  private updateWarpStreaks(dt: number) {
    this.warpStreaks.position.copy(this.shipPos);
    this.warpStreaks.rotation.copy(this.shipRig.root.rotation);
    const posAttr = this.warpStreaks.geometry.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;
    const speedFactor = this.shipSpeed * 1.7;
    for (let i = 0; i < arr.length; i += 3) {
      arr[i + 2] += speedFactor * dt;
      if (arr[i + 2] > 70) {
        arr[i] = this.warpStreakBase[i];
        arr[i + 1] = this.warpStreakBase[i + 1];
        arr[i + 2] = -70;
      }
    }
    posAttr.needsUpdate = true;
  }

  private updateSurface(dt: number, elapsed: number) {
    this.cockpitRig.group.visible = false;
    const pId = this.activeSurfacePlanet.id;
    const planetEnv = getPlanetEnvironment(pId);
    const lerpAlpha = 1 - Math.exp(-2.5 * dt);
    const targetFogDensity =
      planetEnv.pressureBar <= 0.001
        ? 0.0008
        : planetEnv.pressureBar > 5
          ? 0.0042
          : planetEnv.pressureBar > 0.2
            ? 0.0018
            : 0.0024;

    const targetSunLight = THREE.MathUtils.clamp(0.95 + planetEnv.solarEfficiency * 1.15, 0.9, 2.75);

    this.sceneBgColor.lerp(_targetBgColor.set(this.activeSurfacePlanet.skyColor), lerpAlpha);
    this.sceneFog.color.copy(this.sceneBgColor);
    this.sceneFog.density = THREE.MathUtils.lerp(this.sceneFog.density, targetFogDensity, lerpAlpha);
    this.hemiLight.color.lerp(_targetRimColor.set('#cbd5e1'), lerpAlpha);
    this.hemiLight.intensity = THREE.MathUtils.lerp(this.hemiLight.intensity, 0.56, lerpAlpha);
    this.sunKeyLight.color.lerp(_targetSunColor.set('#fff8ee'), lerpAlpha);
    this.sunKeyLight.intensity = THREE.MathUtils.lerp(this.sunKeyLight.intensity, targetSunLight, lerpAlpha);
    this.rimLight.intensity = THREE.MathUtils.lerp(this.rimLight.intensity, 0.22, lerpAlpha);

    const activeFocus = this.inRover ? this.roverPos : this.playerPos;
    this.sunKeyLight.target.position.copy(activeFocus);
    this.sunKeyLight.position.set(activeFocus.x + 54, activeFocus.y + 38, activeFocus.z - 36);

    this.surfaceWorld?.update(elapsed);
    if (this.surfaceWorld?.monolithRing) {
      this.surfaceWorld.monolithRing.rotation.y += dt * 1.2;
      this.surfaceWorld.monolithRing.rotation.x = Math.sin(elapsed * 1.1) * 0.4;
    }

    const sens = this.settings.mouseSensitivity;
    const ySign = this.settings.invertY ? -1 : 1;
    const spd = this.settings.gameplaySpeed;
    const sprintHeld =
      this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') || this.virtualInput.boost;

    const forwardInput =
      (this.keys.has('KeyW') || this.keys.has('ArrowUp') ? 1 : 0) -
      (this.keys.has('KeyS') || this.keys.has('ArrowDown') ? 1 : 0) +
      this.virtualInput.thrust;

    const strafeInput =
      (this.keys.has('KeyD') || this.keys.has('ArrowRight') ? 1 : 0) -
      (this.keys.has('KeyA') || this.keys.has('ArrowLeft') ? 1 : 0);

    const lookYawInput = this.virtualInput.yaw - this.pointerDeltaX * 0.055 * sens;
    const steerInput = -strafeInput + lookYawInput;

    this.surfacePlayerPitch = THREE.MathUtils.clamp(
      this.surfacePlayerPitch - this.pointerDeltaY * 0.0025 * sens * ySign,
      -0.65,
      0.75
    );
    this.pointerDeltaX = 0;
    this.pointerDeltaY = 0;

    let disturbanceLevel = 0;

    const lastTankLowO2 = this.suitO2 <= 20;
    const o2Ratio = THREE.MathUtils.clamp(this.suitO2 / 20, 0, 1);
    const astronautO2SpeedMult = lastTankLowO2 ? 0.34 + 0.26 * o2Ratio : 1;

    if (this.inRover) {
      const targetSpeed =
        forwardInput * (sprintHeld ? 34 : 22) * spd * planetEnv.roverSpeedMult * (lastTankLowO2 ? 0.65 : 1);
      this.roverSpeed = THREE.MathUtils.damp(this.roverSpeed, targetSpeed, 5.2, dt);
      const speedRatio = this.roverSpeed / 22;
      const yawRate = steerInput * 2.15 * (Math.abs(speedRatio) > 0.08 ? Math.sign(speedRatio) : 0.45);
      this.roverYaw += yawRate * dt;

      this.roverPos.x += Math.sin(this.roverYaw) * this.roverSpeed * dt;
      this.roverPos.z += Math.cos(this.roverYaw) * this.roverSpeed * dt;

      // Solid collision with rocks, ship, and structures for Rover
      if (this.surfaceWorld) {
        const roverRadius = 1.75;
        let bumped = false;
        for (let pass = 0; pass < 2; pass++) {
          for (const obs of this.surfaceWorld.obstacles) {
            if (obs.kind === 'rock' && obs.radius < 0.72) continue;
            const dx = this.roverPos.x - obs.x;
            const dz = this.roverPos.z - obs.z;
            const minDist = obs.radius + roverRadius;
            const distSq = dx * dx + dz * dz;
            if (distSq < minDist * minDist) {
              const dist = Math.sqrt(distSq);
              if (dist > 0.0001) {
                const push = minDist / dist;
                this.roverPos.x = obs.x + dx * push;
                this.roverPos.z = obs.z + dz * push;
              } else {
                this.roverPos.x = obs.x + minDist;
              }
              bumped = true;
            }
          }
        }
        if (bumped) {
          this.roverSpeed *= 0.45;
        }
      }

      this.roverPos.x = THREE.MathUtils.clamp(this.roverPos.x, -110, 110);
      this.roverPos.z = THREE.MathUtils.clamp(this.roverPos.z, -110, 110);
      this.roverPos.y = planetGroundHeightAt(pId, this.roverPos.x, this.roverPos.z);

      this.syncRoverPose(steerInput, dt);
      this.playerPos.copy(this.roverPos);
      this.callbacks.onRoverDriveAudio?.(Math.abs(this.roverSpeed), Math.abs(steerInput), true);
      disturbanceLevel = Math.abs(this.roverSpeed) > 2.0 ? 2 : 1;
    } else {
      this.callbacks.onRoverDriveAudio?.(0, 0, false);
      const turnRate = lookYawInput * 2.7 * spd;
      this.playerYaw += turnRate * dt;

      const inputMag = Math.hypot(forwardInput, strafeInput);
      const normFwd = inputMag > 1 ? forwardInput / inputMag : forwardInput;
      const normStrafe = inputMag > 1 ? strafeInput / inputMag : strafeInput;
      const moveMag = Math.min(1, inputMag);

      const sinY = Math.sin(this.playerYaw);
      const cosY = Math.cos(this.playerYaw);
      // Camera looks along (+sinY, +cosY), Right = (-cosY, +sinY)
      const moveDirX = sinY * normFwd - cosY * normStrafe;
      const moveDirZ = cosY * normFwd + sinY * normStrafe;

      const moveSpeed = (sprintHeld ? 19.5 : 12.2) * spd * astronautO2SpeedMult;
      this.playerPos.x += moveDirX * moveSpeed * dt;
      this.playerPos.z += moveDirZ * moveSpeed * dt;

      // Solid collision against rocks, boulders, landed spacecraft & surface structures
      let obstacleSupportY = -Infinity;
      if (this.surfaceWorld) {
        const playerRadius = 0.65;
        for (let pass = 0; pass < 2; pass++) {
          for (const obs of this.surfaceWorld.obstacles) {
            const dx = this.playerPos.x - obs.x;
            const dz = this.playerPos.z - obs.z;
            const minDist = obs.radius + playerRadius;
            const distSq = dx * dx + dz * dz;
            if (distSq < minDist * minDist) {
              const obsTop = obs.y + obs.height;
              if (this.playerPos.y >= obsTop - 0.3) {
                if (Math.sqrt(distSq) < obs.radius + 0.25) {
                  obstacleSupportY = Math.max(obstacleSupportY, obsTop);
                }
              } else {
                const dist = Math.sqrt(distSq);
                if (dist > 0.0001) {
                  const push = minDist / dist;
                  this.playerPos.x = obs.x + dx * push;
                  this.playerPos.z = obs.z + dz * push;
                } else {
                  this.playerPos.x = obs.x + minDist;
                }
              }
            }
          }
        }
      }

      this.playerPos.x = THREE.MathUtils.clamp(this.playerPos.x, -110, 110);
      this.playerPos.z = THREE.MathUtils.clamp(this.playerPos.z, -110, 110);

      const terrainY = planetGroundHeightAt(pId, this.playerPos.x, this.playerPos.z);
      const groundY = Math.max(terrainY, obstacleSupportY);
      const surfaceSpaceHeld = this.keys.has('Space');
      if (surfaceSpaceHeld) {
        this.spaceHoldDuration += dt;
      } else {
        this.spaceHoldDuration = 0;
      }

      const isGrounded = this.playerPos.y <= groundY + 0.08 && this.playerVelY <= 0;
      const jumpRequested = this.surfaceJumpQueued;
      this.surfaceJumpQueued = false;

      if (isGrounded && jumpRequested) {
        this.playerVelY = 5.2;
      }

      const realGravity = this.activeSurfacePlanet.gravity;
      const surfaceJetpackActive = surfaceSpaceHeld && this.spaceHoldDuration > 0.2;
      const prevVelY = this.playerVelY;
      const netAccelY = surfaceJetpackActive ? 16.5 - realGravity : -realGravity;
      this.playerVelY += netAccelY * dt;
      if (surfaceJetpackActive) {
        this.playerVelY = Math.min(11.5, this.playerVelY);
      }
      this.playerPos.y += 0.5 * (prevVelY + this.playerVelY) * dt;

      if (this.playerPos.y <= groundY) {
        this.playerPos.y = groundY;
        this.playerVelY = 0;
      } else if (this.playerPos.y > groundY + 60) {
        this.playerPos.y = groundY + 60;
        if (this.playerVelY > 0) this.playerVelY = 0;
      }

      const isAirborne = this.playerPos.y > groundY + 0.12 || surfaceJetpackActive;
      disturbanceLevel = surfaceJetpackActive || (sprintHeld && moveMag > 0.1) ? 2 : moveMag > 0.08 ? 1 : 0;

      const targetMeshYaw = moveMag > 0.05 ? Math.atan2(moveDirX, moveDirZ) : this.playerYaw;
      this.surfaceAstroRig.root.position.copy(this.playerPos);
      this.surfaceAstroRig.root.rotation.y = dampAngle(
        this.surfaceAstroRig.root.rotation.y,
        targetMeshYaw,
        moveMag > 0.05 ? 12 : 6,
        dt
      );
      this.surfaceAstroRig.setWalkCycle(
        moveMag * (sprintHeld ? 1.45 : 1) * astronautO2SpeedMult,
        isAirborne,
        elapsed,
        !surfaceJetpackActive
      );
    }

    const focusAfterMove = this.inRover ? this.roverPos : this.playerPos;
    this.creatureManager.update(
      dt,
      elapsed,
      focusAfterMove.x,
      focusAfterMove.z,
      disturbanceLevel,
      this.inRover,
      this.surfaceWorld?.obstacles ?? [],
      {
        onDisturbed: (c) => {
          this.callbacks.onAlienDisturbed?.(c.spec.name.en, c.spec.name.ar);
        },
        onAttack: (c) => {
          // Small knockback away from alien strike
          const kdx = focusAfterMove.x - c.x;
          const kdz = focusAfterMove.z - c.z;
          const kd = Math.max(0.01, Math.hypot(kdx, kdz));
          const targetVec = this.inRover ? this.roverPos : this.playerPos;
          const kbRadius = this.inRover ? 1.75 : 0.65;
          targetVec.x = THREE.MathUtils.clamp(targetVec.x + (kdx / kd) * 1.15, -108, 108);
          targetVec.z = THREE.MathUtils.clamp(targetVec.z + (kdz / kd) * 1.15, -108, 108);
          if (this.surfaceWorld) {
            for (const obs of this.surfaceWorld.obstacles) {
              if (this.inRover && obs.kind === 'rock' && obs.radius < 0.72) continue;
              const ox = targetVec.x - obs.x;
              const oz = targetVec.z - obs.z;
              const minD = obs.radius + kbRadius;
              const dSq = ox * ox + oz * oz;
              if (dSq < minD * minD && (this.inRover || targetVec.y < obs.y + obs.height - 0.3)) {
                const d = Math.sqrt(dSq);
                if (d > 0.0001) {
                  targetVec.x = obs.x + (ox / d) * minD;
                  targetVec.z = obs.z + (oz / d) * minD;
                } else {
                  targetVec.x = obs.x + minD;
                }
              }
            }
          }
          if (this.inRover) {
            this.roverPos.y = planetGroundHeightAt(pId, this.roverPos.x, this.roverPos.z);
            this.roverRig.root.position.copy(this.roverPos);
            this.playerPos.copy(this.roverPos);
          } else {
            const kGround = planetGroundHeightAt(pId, this.playerPos.x, this.playerPos.z);
            if (this.playerPos.y < kGround) this.playerPos.y = kGround;
            this.surfaceAstroRig.root.position.copy(this.playerPos);
          }
          this.callbacks.onAlienAttack?.(c.spec.name.en, c.spec.name.ar, this.inRover);
        },
      }
    );
  }

  private syncRoverPose(steerInput: number, dt: number) {
    const pId = this.activeSurfacePlanet.id;
    const sx = Math.sin(this.roverYaw);
    const cz = Math.cos(this.roverYaw);

    const hF = planetGroundHeightAt(pId, this.roverPos.x + sx * 1.3, this.roverPos.z + cz * 1.3);
    const hB = planetGroundHeightAt(pId, this.roverPos.x - sx * 1.3, this.roverPos.z - cz * 1.3);
    const hL = planetGroundHeightAt(pId, this.roverPos.x - cz * 1.1, this.roverPos.z + sx * 1.1);
    const hR = planetGroundHeightAt(pId, this.roverPos.x + cz * 1.1, this.roverPos.z - sx * 1.1);

    const pitch = Math.atan2(hB - hF, 2.6);
    const roll = Math.atan2(hL - hR, 2.2);

    this.roverRig.root.position.copy(this.roverPos);
    this.roverRig.root.rotation.set(pitch, this.roverYaw, roll, 'YXZ');

    const wheelRot = (this.roverSpeed * dt) / 0.46;
    this.roverRig.wheels.forEach((w) => {
      w.rotation.x += wheelRot;
    });
    const steerAngle = THREE.MathUtils.clamp(steerInput * 0.42, -0.45, 0.45);
    this.roverRig.frontSteerPivots.forEach((p) => {
      p.rotation.y = THREE.MathUtils.damp(p.rotation.y, steerAngle, 8, dt || 0.016);
    });
    this.roverRig.rearSteerPivots.forEach((p) => {
      p.rotation.y = THREE.MathUtils.damp(p.rotation.y, -steerAngle * 0.65, 8, dt || 0.016);
    });
  }

  private updateSurfaceCamera(dt: number) {
    const focus = this.inRover ? this.roverPos : this.playerPos;
    const yaw = this.inRover ? this.roverYaw : this.playerYaw;
    const dist = this.inRover ? 9.8 : 5.4;
    const height = this.inRover ? 4.2 : 2.5;

    const pitchSin = Math.sin(this.surfacePlayerPitch);
    if (this.cameraMode === 'first-person') {
      if (!this.inRover) this.surfaceAstroRig.root.visible = false;
      this.camera.position.set(focus.x, focus.y + (this.inRover ? 2.4 : 1.75), focus.z);
      _lookTarget.set(
        focus.x + Math.sin(yaw) * 18,
        focus.y + 1.4 + pitchSin * 14,
        focus.z + Math.cos(yaw) * 18
      );
      this.camera.lookAt(_lookTarget);
    } else {
      if (!this.inRover) this.surfaceAstroRig.root.visible = true;
      _desiredCamPos.set(
        focus.x - Math.sin(yaw) * dist,
        focus.y + height - pitchSin * 2.1,
        focus.z - Math.cos(yaw) * dist
      );
      this.camera.position.lerp(_desiredCamPos, 1 - Math.exp(-7.5 * dt));
      _lookTarget.set(focus.x, focus.y + 1.45 + pitchSin * 3.5, focus.z);
      this.camera.lookAt(_lookTarget);
    }

    const targetFov = this.settings.fov;
    if (Math.abs(this.camera.fov - targetFov) > 0.1) {
      this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 5, dt);
      this.camera.updateProjectionMatrix();
    }
  }

  private findNearestInteriorStation() {
    let best: {
      id: InteriorStationId;
      label: { ar: string; en: string };
      distance: number;
    } | null = null;
    for (const st of this.interiorWorld.stations) {
      const dist = Math.hypot(
        this.bridgePlayerPos.x - st.position.x,
        this.bridgePlayerPos.z - st.position.z
      );
      if (dist <= st.radius && (!best || dist < best.distance)) {
        best = { id: st.id, label: st.label, distance: dist };
      }
    }
    return best;
  }

  private findNearbyPlanet(): PlanetRuntime | null {
    let best: PlanetRuntime | null = null;
    let bestDist = Infinity;
    for (const p of this.planets) {
      const dist = this.shipPos.distanceTo(_v1.set(...p.data.position));
      if (dist <= p.data.orbitDistance * 1.12 && dist < bestDist) {
        best = p;
        bestDist = dist;
      }
    }
    return best;
  }

  private findNearestSurfaceInteractable() {
    const activePos = this.inRover ? this.roverPos : this.playerPos;
    const shipDist = Math.hypot(activePos.x, activePos.z);
    if (shipDist <= 9.5) {
      return {
        kind: 'ship' as const,
        id: 'nova_starship',
        label: {
          ar: 'المركبة: [F] إعادة تزويد الأكسجين والصحة • [E] دخول المقصورة',
          en: 'Spacecraft: [F] Refuel O2 & Suit • [E] Enter Bridge',
        },
        distance: shipDist,
      };
    }

    if (!this.inRover) {
      const roverDist = Math.hypot(
        activePos.x - this.roverPos.x,
        activePos.z - this.roverPos.z
      );
      if (roverDist <= 5.5) {
        return {
          kind: 'rover' as const,
          id: 'nova_rover',
          label: { ar: 'قيادة المركبة الجوالة 6×6 [R]', en: 'Drive 6-Wheel Rover [R]' },
          distance: roverDist,
        };
      }
    }

    if (this.surfaceWorld) {
      for (const item of this.surfaceWorld.interactables) {
        if (item.collected) continue;
        const dist = Math.hypot(activePos.x - item.position.x, activePos.z - item.position.z);
        if (dist <= item.radius + 3.5) {
          return {
            kind: item.kind,
            id: item.id,
            label: item.label,
            distance: dist,
          };
        }
      }
    }

    const creature = this.creatureManager.findNearestUnscanned(activePos.x, activePos.z, 7.5);
    if (creature) {
      return {
        kind: 'creature' as const,
        id: creature.id,
        label: {
          ar: `مسح الكائن: ${creature.spec.name.ar} [F]`,
          en: `Bio-Scan: ${creature.spec.name.en} [F]`,
        },
        distance: Math.hypot(activePos.x - creature.x, activePos.z - creature.z),
      };
    }

    return null;
  }

  private emitInteriorTelemetry() {
    const near = this.findNearestInteriorStation();
    this.callbacks.onInteriorTelemetry({
      playerX: Math.round(this.bridgePlayerPos.x),
      playerZ: Math.round(this.bridgePlayerPos.z),
      nearStation: near,
    });
  }

  private emitSpaceTelemetry() {
    let nearbyPlanetId: PlanetId | null = null;
    let nearbyPlanetDistance: number | null = null;
    let targetDistance: number | null = null;

    const radarBlips: RadarBlip[] = this.planets.map((p) => {
      const dx = p.data.position[0] - this.shipPos.x;
      const dy = p.data.position[1] - this.shipPos.y;
      const dz = p.data.position[2] - this.shipPos.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (p.data.id === this.targetPlanetId) targetDistance = Math.round(dist);
      if (
        dist <= p.data.orbitDistance * 1.12 &&
        (nearbyPlanetDistance === null || dist < nearbyPlanetDistance)
      ) {
        nearbyPlanetId = p.data.id;
        nearbyPlanetDistance = Math.round(dist);
      }

      return {
        id: p.data.id,
        name: p.data.name,
        dx,
        dz,
        color: p.data.primaryColor,
        discovered: this.discoveredIds.has(p.data.id),
        isTarget: p.data.id === this.targetPlanetId,
      };
    });

    const boostHeld =
      this.keys.has('ShiftLeft') ||
      this.keys.has('ShiftRight') ||
      this.keys.has('Space') ||
      this.virtualInput.boost ||
      (this.autopilotActive && this.shipSpeed > 75);

    const hazardLevel =
      this.weather === 'solar_flare' || this.weather === 'ion_storm'
        ? 'SEVERE'
        : this.weather === 'asteroid_squall'
          ? 'ELEVATED'
          : 'NOMINAL';

    const headingDeg = ((Math.round((-this.shipYaw * 180) / Math.PI) % 360) + 360) % 360;
    const pitchDeg = Number(((this.shipPitch * 180) / Math.PI).toFixed(2));
    const rollDeg = Number(((this.bankAngle * 180) / Math.PI).toFixed(2));
    const altitudeKm = Math.max(120, Math.round(380 + Math.abs(this.shipPos.y) * 18 + this.shipPos.length() * 2.4));

    this.callbacks.onSpaceTelemetry({
      speed: Math.round(this.shipSpeed * 4.5),
      maxSpeed: Math.round(this.shipMetrics.maxSpeed * 4.5 * this.weatherSpeedMultiplier),
      boosting: boostHeld,
      shield: Math.round(this.shield),
      maxShield: Math.round(this.maxShield),
      shipX: Math.round(this.shipPos.x),
      shipY: Math.round(this.shipPos.y),
      shipZ: Math.round(this.shipPos.z),
      shipYaw: this.shipYaw,
      shipPitchDeg: pitchDeg,
      shipRollDeg: rollDeg,
      shipHeadingDeg: headingDeg,
      accelG: Number(this.currentAccelG.toFixed(2)),
      altitudeKm,
      autopilotActive: this.autopilotActive,
      targetPlanetId: this.targetPlanetId,
      targetDistance,
      nearbyPlanetId,
      nearbyPlanetDistance,
      radarBlips,
      cannonCooldown: this.cannonCooldown,
      barrelRollCooldown: this.barrelRollCooldown,
      weather: this.weather,
      weatherSpeedMultiplier: this.weatherSpeedMultiplier,
      weatherShieldDelta: Number(this.weatherShieldDelta.toFixed(1)),
      radiationSievert: this.envRadiationSievert,
      dustDensityPct: this.envDustDensityPct,
      hazardLevel,
      weatherCountdown: Math.max(0, Math.round(this.weatherTimer)),
    });
  }

  private emitSurfaceTelemetry() {
    const activePos = this.inRover ? this.roverPos : this.playerPos;
    const near = this.findNearestSurfaceInteractable();
    const yaw = this.inRover ? this.roverYaw : this.playerYaw;
    const deg = ((Math.round((yaw * 180) / Math.PI) % 360) + 360) % 360;
    const nearShipPad = Math.hypot(activePos.x, activePos.z) <= 9.5;
    const hostileAlienDist = this.creatureManager.getNearestHostileDistance(activePos.x, activePos.z);

    this.callbacks.onSurfaceTelemetry({
      playerX: Math.round(this.playerPos.x),
      playerZ: Math.round(this.playerPos.z),
      roverX: Math.round(this.roverPos.x),
      roverZ: Math.round(this.roverPos.z),
      speedKmh: this.inRover ? Math.round(Math.abs(this.roverSpeed) * 3.6) : 0,
      headingDeg: deg,
      inRover: this.inRover,
      nearShipPad,
      hostileAlienDist: hostileAlienDist !== null ? Math.round(hostileAlienDist) : null,
      nearInteractable: near,
    });
  }

  public dispose() {
    this.disposed = true;
    this.callbacks.onRoverDriveAudio?.(0, 0, false);
    if (this.isSoftwareGl) clearTimeout(this.frameId);
    else cancelAnimationFrame(this.frameId);

    this.cleanupListeners.forEach((fn) => fn());
    this.cleanupListeners = [];

    this.plasmaBolts.forEach((b) => this.spaceGroup.remove(b.mesh));
    this.plasmaBolts = [];

    this.interiorWorld.dispose();
    this.bridgeAstroRig.dispose();
    this.cockpitRig.dispose();
    this.shipRig.dispose();
    this.landedShipRig.dispose();
    this.roverRig.dispose();
    this.surfaceAstroRig.dispose();
    this.creatureManager.clear();
    this.surfaceWorld?.dispose();
    this.weatherShaderRig?.dispose();

    this.texturesToDispose.forEach((t) => t.dispose());
    this.geosToDispose.forEach((g) => g.dispose());
    this.matsToDispose.forEach((m) => m.dispose());

    this.composer?.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
