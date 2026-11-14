import { create } from 'zustand';
import { spaceAudio } from '../audio/spaceAudio';
import {
  generateSkyChatReply,
  getDisplayCommander,
  getEnglishCommander,
  skyEventText,
  skyGreeting,
} from '../data/i18n';
import {
  CUBESAT_PHASES,
  INITIAL_CREW,
  INITIAL_SPECIALISTS,
  PLANETS,
  SHIP_LIVERIES,
  SHIP_PARTS,
  TELESCOPE_OBJECTIVES,
  computePersonnelEffects,
  computeShipMetrics,
} from '../data/novaData';
import { SURVIVAL_MISSIONS } from '../data/nasaSurvivalData';
import { BASELINE_LEADERBOARD, type SavedArchitectRun } from '../data/missionArchitectData';
import { GROUND_STATIONS } from '../data/spaceOpsData';
import {
  deriveDigitalTwinState,
  evaluateSpacecraftArchitecture,
} from '../engine/engineeringTradeoffEngine';
import {
  buildMissionPerformanceReport,
  evaluateAutonomousAction,
  generateContextualDynamicEvent,
  generateFailureInvestigationReport,
  MISSION_LIFECYCLE_12,
} from '../engine/missionOpsEngine';
import { generateEngineeringSkyReply } from '../engine/skyEngineeringAi';
import {
  DEFAULT_ADVANCED_LOADOUT,
  NASA_RECREATION_MISSIONS,
  SUBSYSTEM_CATALOG_14,
  TECH_TREE_NODES,
} from '../engine/subsystemsCatalog';
import type {
  ActiveChoice,
  ActiveMissionBlueprint,
  ActiveMissionEvent,
  AdvancedLoadout,
  AnalysisFidelityMode,
  AstronautBioState,
  AutonomousRulesConfig,
  CameraMode,
  CharacterConfig,
  CommsCompressionMode,
  CooperativeTeamMember,
  CrewMember,
  DifficultyLevel,
  DigitalTwinVisualState,
  DynamicEventType,
  EmergencyEvent,
  EngineeringTradeoffReport,
  FailureInvestigationReport,
  GameScreen,
  GameSettings,
  InstructorAssignment,
  InteriorStationId,
  InteriorTelemetrySnapshot,
  Language,
  MissionOutcome,
  MissionPerformanceReport,
  MissionTimelineLogEntry,
  Mode2dTabId,
  OperationalMode,
  PersonnelEffects,
  PlanetId,
  PowerAllocation,
  QualityPreset,
  ResourcesState,
  SceneEnv,
  ShipConfig,
  ShipLiveryId,
  ShipMetrics,
  ShuttleRoomId,
  ShuttleSpecialist,
  SkyMessage,
  SkyMood,
  SpaceTelemetrySnapshot,
  SpaceWeather,
  SpecialistId,
  SurfaceBuildingKind,
  SurfaceBuildingRecord,
  SurfaceTelemetrySnapshot,
  TabletMissionPlan,
  TelescopeDesignState,
  TransferStrategy,
  TransmissionPriority,
} from '../types/game';

export interface EngineActionsBridge {
  enterInteriorBridge: () => void;
  walkToInteriorStation: (stationId: InteriorStationId) => void;
  launchToSpace: (fromPlanetId?: PlanetId) => void;
  landOnPlanet: (planetId: PlanetId) => void;
  setTargetPlanet: (planetId: PlanetId, autopilot: boolean) => void;
  setAutopilot: (active: boolean) => void;
  triggerBarrelRoll: () => void;
  fireOrScan: () => void;
  toggleRover: () => void;
  cycleWeather: () => void;
  setWeather: (weather: SpaceWeather) => void;
  setCameraMode: (mode: CameraMode) => void;
  resetSpaceShipNearHome: () => void;
  setMissionVizState: (timeline: number, targetPlanetId: PlanetId) => void;
  setMouseLocked: (locked: boolean) => void;
  toggleMouseLock: () => void;
  applySettings: (settings: GameSettings) => void;
  buildSurfaceStructure: (kind: SurfaceBuildingKind) => SurfaceBuildingRecord | null;
  setSuitO2: (o2: number) => void;
  setDigitalTwinState: (twin: DigitalTwinVisualState) => void;
}

let engineBridge: EngineActionsBridge | null = null;
export function registerEngineBridge(bridge: EngineActionsBridge | null) {
  engineBridge = bridge;
}

export interface VirtualInputState {
  thrust: number;
  yaw: number;
  pitch: number;
  boost: boolean;
}

const SAVE_KEY = 'nova_beyond_unified_save_v2';
const LANG_KEY = 'nova_lang_v1';
const AUDIO_PREFS_KEY = 'nova_audio_prefs_v1';
const SETTINGS_KEY = 'nova_game_settings_v1';

const DEFAULT_SETTINGS: GameSettings = {
  qualityPreset: 'high',
  resolutionScale: 1,
  gameplaySpeed: 1.35,
  fov: 68,
  mouseSensitivity: 1.25,
  invertY: false,
  bloomEnabled: true,
  masterVolume: 0.85,
};

function readInitialSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<GameSettings>;
    return {
      qualityPreset:
        parsed.qualityPreset === 'low' ||
        parsed.qualityPreset === 'medium' ||
        parsed.qualityPreset === 'high' ||
        parsed.qualityPreset === 'ultra'
          ? parsed.qualityPreset
          : DEFAULT_SETTINGS.qualityPreset,
      resolutionScale:
        typeof parsed.resolutionScale === 'number'
          ? Math.max(0.65, Math.min(2, parsed.resolutionScale))
          : DEFAULT_SETTINGS.resolutionScale,
      gameplaySpeed:
        typeof parsed.gameplaySpeed === 'number'
          ? Math.max(0.85, Math.min(2, parsed.gameplaySpeed))
          : DEFAULT_SETTINGS.gameplaySpeed,
      fov:
        typeof parsed.fov === 'number'
          ? Math.max(55, Math.min(90, parsed.fov))
          : DEFAULT_SETTINGS.fov,
      mouseSensitivity:
        typeof parsed.mouseSensitivity === 'number'
          ? Math.max(0.5, Math.min(2.5, parsed.mouseSensitivity))
          : DEFAULT_SETTINGS.mouseSensitivity,
      invertY: Boolean(parsed.invertY),
      bloomEnabled:
        typeof parsed.bloomEnabled === 'boolean' ? parsed.bloomEnabled : DEFAULT_SETTINGS.bloomEnabled,
      masterVolume:
        typeof parsed.masterVolume === 'number'
          ? Math.max(0, Math.min(1, parsed.masterVolume))
          : DEFAULT_SETTINGS.masterVolume,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function persistSettings(settings: GameSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

interface SavedAudioPrefs {
  audioMuted: boolean;
  ambientHumEnabled: boolean;
  roverAudioEnabled: boolean;
  speechEnabled: boolean;
}

function readInitialAudioPrefs(): SavedAudioPrefs {
  const defaults: SavedAudioPrefs = {
    audioMuted: false,
    ambientHumEnabled: true,
    roverAudioEnabled: true,
    speechEnabled: true,
  };
  try {
    const raw = localStorage.getItem(AUDIO_PREFS_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<SavedAudioPrefs>;
    return {
      audioMuted: Boolean(parsed.audioMuted),
      ambientHumEnabled:
        typeof parsed.ambientHumEnabled === 'boolean' ? parsed.ambientHumEnabled : true,
      roverAudioEnabled:
        typeof parsed.roverAudioEnabled === 'boolean' ? parsed.roverAudioEnabled : true,
      speechEnabled:
        typeof parsed.speechEnabled === 'boolean' ? parsed.speechEnabled : true,
    };
  } catch {
    return defaults;
  }
}

function persistAudioPrefs(prefs: SavedAudioPrefs) {
  try {
    localStorage.setItem(AUDIO_PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}

const DEFAULT_CHARACTER: CharacterConfig = {
  name: '',
  gender: 'male',
  specialization: 'Flight Commander',
  suitModel: 'Vanguard EVA',
  primaryColor: '#e2e6ec',
  visorColor: '#0d1520',
  helmetEquipped: false,
};

const DEFAULT_SHIP: ShipConfig = {
  engineId: 'eng_vasimir',
  solarId: 'sol_rtg',
  hullId: 'hull_aegis',
  sensorId: 'sen_spectro',
  commsId: 'com_laser',
  liveryId: 'vanguard_cobalt',
};

const DEFAULT_OWNED_PART_IDS: string[] = [
  'eng_ion',
  'eng_vasimir',
  'sol_wings',
  'sol_rtg',
  'hull_ti',
  'hull_aegis',
  'sen_lidar',
  'sen_spectro',
  'com_uhf',
  'com_laser',
];

const DEFAULT_POWER_ALLOC: PowerAllocation = {
  engines: 34,
  shields: 33,
  sensors: 33,
};

const DEFAULT_INTERIOR_TELEMETRY: InteriorTelemetrySnapshot = {
  playerX: 0,
  playerZ: 2,
  nearStation: null,
};

const DEFAULT_SPACE_TELEMETRY: SpaceTelemetrySnapshot = {
  speed: 28,
  maxSpeed: 86,
  boosting: false,
  shield: 140,
  maxShield: 140,
  shipX: 0,
  shipY: 12,
  shipZ: 48,
  shipYaw: 0,
  shipPitchDeg: 0,
  shipRollDeg: 0,
  shipHeadingDeg: 0,
  accelG: 0.4,
  altitudeKm: 412,
  autopilotActive: false,
  targetPlanetId: 'luna',
  targetDistance: 218,
  nearbyPlanetId: null,
  nearbyPlanetDistance: null,
  radarBlips: [],
  cannonCooldown: 0,
  barrelRollCooldown: 0,
  weather: 'clear',
  weatherSpeedMultiplier: 1,
  weatherShieldDelta: 2.5,
  radiationSievert: 0.12,
  dustDensityPct: 4,
  hazardLevel: 'NOMINAL',
  weatherCountdown: 26,
};

const DEFAULT_SURFACE_TELEMETRY: SurfaceTelemetrySnapshot = {
  playerX: 0,
  playerZ: 14,
  roverX: 10,
  roverZ: 8,
  speedKmh: 0,
  headingDeg: 0,
  inRover: false,
  nearShipPad: false,
  hostileAlienDist: null,
  nearInteractable: null,
};

const DEFAULT_ASTRONAUT_BIO: AstronautBioState = {
  heartRateBpm: 72,
  suitPressureKpa: 29.6,
  co2MmHg: 1.4,
  suitTempC: 21.5,
  lcvgCoolingPct: 50,
  preBreatheDone: false,
  tetherLocked: true,
  stressLevel: 'CALM',
  evaRepairsCompleted: 0,
};

const DEFAULT_ACTIVE_INSTRUMENT_IDS = ['inst_cam', 'inst_spec', 'inst_mag'];
const DEFAULT_INSTRUMENT_ACTIVE_MAP: Record<string, boolean> = {
  inst_cam: true,
  inst_spec: true,
  inst_mag: true,
};

const DEFAULT_UNLOCKED_SUBSYSTEM_IDS = SUBSYSTEM_CATALOG_14
  .filter((s) => s.costM <= 45 || Object.values(DEFAULT_ADVANCED_LOADOUT).includes(s.id))
  .map((s) => s.id);

const DEFAULT_AUTONOMOUS_RULES: AutonomousRulesConfig = {
  enabled: true,
  lowBatteryThresholdPct: 24,
  overheatThresholdC: 48,
  onCommsLossStoreAndRetry: true,
  onNavErrorSwitchBackupObc: true,
  onCriticalFailureEnterSafeMode: true,
};

const DEFAULT_TEAM_MEMBERS: CooperativeTeamMember[] = [
  { id: 1, name: 'Capt. Tariq', role: 'commander', approved: true },
  { id: 2, name: 'Eng. Marcus', role: 'systems_engineer', approved: false },
  { id: 3, name: 'Dr. Elena', role: 'science_officer', approved: false },
  { id: 4, name: 'Dir. Aria', role: 'flight_director', approved: false },
];

const DEFAULT_INSTRUCTOR_ASSIGNMENTS: InstructorAssignment[] = [
  {
    id: 'assign_europa_hard',
    title: { ar: 'واجب استكشاف محيط أوروبا (Europa)', en: 'Lab 1: Europa Subsurface Radiation Survival' },
    targetPlanetId: 'aetheris',
    maxBudgetM: 420,
    minSciencePts: 95,
    minReliabilityPct: 78,
    requiredNotes: {
      ar: 'صمّم مركبة تصمد لإشعاع 185 krad/yr وتتغلب على ضعف الشمس عند 5.2 AU.',
      en: 'Design an orbiter that survives 185 krad/yr radiation and 5.2 AU solar drop-off.',
    },
    createdAt: 1700000000000,
  },
  {
    id: 'assign_mars_comms',
    title: { ar: 'واجب شبكة اتصالات المريخ عالية التدفق', en: 'Lab 2: Mars High-Data Downlink Budget' },
    targetPlanetId: 'mars',
    maxBudgetM: 360,
    minSciencePts: 80,
    minReliabilityPct: 82,
    requiredNotes: {
      ar: 'ازِن سعة البث مع توليد البيانات اليومي للأجهزة دون امتلاء الذاكرة.',
      en: 'Balance instrument data rate with DSN downlink capacity so SSR never overflows.',
    },
    createdAt: 1700000000001,
  },
];

function computeEngOutputs(params: {
  planetId: PlanetId;
  loadout: AdvancedLoadout;
  instrumentIds: string[];
  instrumentActiveMap: Record<string, boolean>;
  operationalMode: OperationalMode;
  transferStrategy: TransferStrategy;
  stationId: string;
  compressionMode: CommsCompressionMode;
  fidelityMode: AnalysisFidelityMode;
  maxBudgetM: number;
  sandboxUnrestricted: boolean;
  hullIntegrity: number;
  commsSignal: number;
}): { tradeOffReport: EngineeringTradeoffReport; digitalTwinState: DigitalTwinVisualState } {
  const tradeOffReport = evaluateSpacecraftArchitecture({
    planetId: params.planetId,
    loadout: params.loadout,
    instrumentIds: params.instrumentIds,
    activeInstrumentMap: params.instrumentActiveMap,
    operationalMode: params.operationalMode,
    transferStrategy: params.transferStrategy,
    stationId: params.stationId,
    compressionMode: params.compressionMode,
    fidelityMode: params.fidelityMode,
    maxBudgetM: params.maxBudgetM,
    sandboxUnrestricted: params.sandboxUnrestricted,
    hullIntegrity: params.hullIntegrity,
  });
  const digitalTwinState = deriveDigitalTwinState({
    loadout: params.loadout,
    operationalMode: params.operationalMode,
    instrumentActiveMap: params.instrumentActiveMap,
    hullIntegrity: params.hullIntegrity,
    commsSignalPct: params.commsSignal,
    netPowerW: tradeOffReport.netPowerW,
  });
  return { tradeOffReport, digitalTwinState };
}

function buildEngPairFromState(s: GameStoreState, overrides?: {
  planetId?: PlanetId;
  stationId?: string;
  compressionMode?: CommsCompressionMode;
  fidelityMode?: AnalysisFidelityMode;
}) {
  return computeEngOutputs({
    planetId: overrides?.planetId ?? s.activePlanet,
    loadout: s.advancedLoadout,
    instrumentIds: s.activeInstrumentIds,
    instrumentActiveMap: s.instrumentActiveMap,
    operationalMode: s.operationalMode,
    transferStrategy: s.transferStrategy,
    stationId: overrides?.stationId ?? s.activeGroundStationId,
    compressionMode: overrides?.compressionMode ?? s.commsCompressionMode,
    fidelityMode: overrides?.fidelityMode ?? s.analysisFidelityMode,
    maxBudgetM: Math.max(200, s.resources.budget + s.unlockedBudgetBonusM),
    sandboxUnrestricted: s.sandboxUnrestricted,
    hullIntegrity: s.hullIntegrity,
    commsSignal: s.resources.commsSignal,
  });
}

const INITIAL_TRADEOFF_PAIR = computeEngOutputs({
  planetId: 'luna',
  loadout: { ...DEFAULT_ADVANCED_LOADOUT },
  instrumentIds: DEFAULT_ACTIVE_INSTRUMENT_IDS,
  instrumentActiveMap: DEFAULT_INSTRUMENT_ACTIVE_MAP,
  operationalMode: 'nominal',
  transferStrategy: 'hohmann',
  stationId: 'dsn_goldstone',
  compressionMode: 'raw',
  fidelityMode: 'approximation',
  maxBudgetM: 400,
  sandboxUnrestricted: false,
  hullIntegrity: 100,
  commsSignal: 94,
});

function makeInitialResources(diff: DifficultyLevel): ResourcesState {
  const budgetMap: Record<DifficultyLevel, number> = {
    Cadet: 520,
    Commander: 400,
    Veteran: 310,
  };
  const metrics = computeShipMetrics(DEFAULT_SHIP);
  return {
    budget: budgetMap[diff],
    mass: metrics.mass,
    powerGeneration: metrics.powerGen,
    powerConsumption: metrics.powerUse,
    battery: 96,
    dataStorage: 0,
    maxStorage: 450,
    dataCollected: 0,
    dataTransmitted: 0,
    commsStation: 'Goldstone',
    commsSignal: 94,
    solTime: 1,
    suitO2: 100,
    suitHealth: 100,
    suitCoolant: 100,
    credits: 320,
  };
}

let msgCounter = 1;
let lastAutoEventTs = 0;

export interface GameStoreState {
  lang: Language;
  screen: GameScreen;
  sceneEnv: SceneEnv;
  difficulty: DifficultyLevel;
  chapter: number;
  character: CharacterConfig;
  shipConfig: ShipConfig;
  shipMetrics: ShipMetrics;
  resources: ResourcesState;
  crew: CrewMember[];
  specialists: ShuttleSpecialist[];
  personnelEffects: PersonnelEffects;
  missionPlan: TabletMissionPlan;

  activePlanet: PlanetId;
  discoveredPlanets: PlanetId[];
  discoveredCraterIds: string[];
  completedScienceSiteIds: string[];
  collectedSampleIds: string[];
  scannedCreatureIds: string[];
  surfaceBuildings: SurfaceBuildingRecord[];
  outpostMenuOpen: boolean;
  monolithInspected: boolean;
  pilotingRover: boolean;
  cameraMode: CameraMode;

  ringsPassed: number;
  asteroidsMined: number;
  barrelRolls: number;
  weather: SpaceWeather;

  interiorTelemetry: InteriorTelemetrySnapshot;
  spaceTelemetry: SpaceTelemetrySnapshot;
  surfaceTelemetry: SurfaceTelemetrySnapshot;
  virtualInput: VirtualInputState;
  touchPadOpen: boolean;

  skyMessages: SkyMessage[];
  skyMood: SkyMood;
  skyOpen: boolean;
  tabletOpen: boolean;
  tabletTab: 'overview' | 'planets' | 'builder' | 'comms' | 'crew';
  mapOpen: boolean;
  guideOpen: boolean;
  pitchDeckOpen: boolean;
  dashboardOpen: boolean;
  dashboardTab: 'overview' | 'personnel';
  mode2dOpen: boolean;
  mode2dTab: Mode2dTabId;
  mouseLocked: boolean;
  storyIntroOpen: boolean;
  architectOpen: boolean;
  architectRuns: SavedArchitectRun[];
  activeBlueprint: ActiveMissionBlueprint | null;
  unlockedBudgetBonusM: number;
  purchasedPartIds: string[];
  powerAllocation: PowerAllocation;
  shuttleCustomName: string;
  hardcoreChallengeMode: boolean;
  completedStressTests: string[];
  activeGroundStationId: string;
  commsCompressionMode: CommsCompressionMode;
  analysisFidelityMode: AnalysisFidelityMode;
  lastDownlinkKbps: number;
  lastCommWindowHrs: number;

  hullIntegrity: number;
  survivalFailures: number;
  survivalScore: number;
  survivalStreak: number;
  completedSurvivalIds: string[];
  failedSurvivalIds: string[];
  activeSurvivalId: string | null;
  astronautBio: AstronautBioState;

  cmlLevel: 1 | 2 | 3 | 4;
  telescope: TelescopeDesignState;
  telescopeLabOpen: boolean;
  missionVizTimeline: number;
  missionVizAutoPlay: boolean;
  missionVizTargetPlanet: PlanetId;

  emergency: EmergencyEvent | null;
  activeChoice: ActiveChoice | null;
  missionOutcome: MissionOutcome | null;

  audioMuted: boolean;
  ambientHumEnabled: boolean;
  roverAudioEnabled: boolean;
  speechEnabled: boolean;
  shadowsEnabled: boolean;
  settings: GameSettings;
  hasSavedGame: boolean;
  toastText: string | null;
  lastDamageAt: number;

  // 22-Feature Integrated Engineering, MCC & Forensics State
  advancedLoadout: AdvancedLoadout;
  unlockedSubsystemIds: string[];
  researchPoints: number;
  unlockedTechIds: string[];
  activeInstrumentIds: string[];
  instrumentActiveMap: Record<string, boolean>;
  operationalMode: OperationalMode;
  txPriority: TransmissionPriority;
  transferStrategy: TransferStrategy;
  sandboxUnrestricted: boolean;
  beginnerGuidedMode: boolean;
  lifecyclePhase: number;
  lifecyclePaused: boolean;
  fuelPct: number;
  internalTempC: number;
  activeMissionEvent: ActiveMissionEvent | null;
  missionTimelineLog: MissionTimelineLogEntry[];
  autonomousRules: AutonomousRulesConfig;
  autonomousActionLog: string[];
  failureInvestigationReport: FailureInvestigationReport | null;
  performanceHistory: MissionPerformanceReport[];
  instructorAssignments: InstructorAssignment[];
  activeAssignmentId: string | null;
  teamMembers: CooperativeTeamMember[];
  tradeOffReport: EngineeringTradeoffReport;
  digitalTwinState: DigitalTwinVisualState;
  mccOpen: boolean;
  systemsLabOpen: boolean;
  whatIfOpen: boolean;
  reportOpen: boolean;

  setLang: (lang: Language) => void;
  toggleLang: () => void;
  setDifficulty: (diff: DifficultyLevel) => void;
  setScreen: (screen: GameScreen) => void;
  setSceneEnv: (env: SceneEnv) => void;
  updateCharacter: (patch: Partial<CharacterConfig>) => void;
  startNewGameFlow: () => void;
  completeCharacterSetup: () => void;
  continueSavedGame: () => void;
  saveProgress: () => void;

  selectShipPart: (partId: string) => void;
  buyAndEquipShipPart: (partId: string) => boolean;
  selectLivery: (liveryId: ShipLiveryId) => void;
  setPowerAllocation: (alloc: PowerAllocation) => void;
  setShuttleCustomName: (name: string) => void;
  toggleHardcoreChallengeMode: () => void;
  investCreditsForBudget: () => boolean;
  resolveShuttleStressTest: (
    testId: string,
    passed: boolean,
    rewardCr: number,
    rewardBudgetM: number,
    hullDmg: number
  ) => void;
  setMissionPlan: (patch: Partial<TabletMissionPlan>) => void;
  assignCrew: (crewId: string, assignment: CrewMember['assignment']) => void;
  assignSpecialistToRoom: (specialistId: SpecialistId, roomId: ShuttleRoomId) => void;
  swapSpecialists: (idA: SpecialistId, idB: SpecialistId) => void;
  applyPersonnelPreset: (preset: 'balanced' | 'science' | 'repair') => void;

  setTabletOpen: (open: boolean, tab?: GameStoreState['tabletTab']) => void;
  setSkyOpen: (open: boolean) => void;
  setMapOpen: (open: boolean) => void;
  setGuideOpen: (open: boolean) => void;
  setPitchDeckOpen: (open: boolean) => void;
  setDashboardOpen: (open: boolean, tab?: GameStoreState['dashboardTab']) => void;
  setDashboardTab: (tab: GameStoreState['dashboardTab']) => void;
  setMode2dOpen: (open: boolean, tab?: Mode2dTabId) => void;
  setMode2dTab: (tab: Mode2dTabId) => void;
  setMouseLockedState: (locked: boolean) => void;
  toggleMouseLock: () => void;
  setTouchPadOpen: (touchPadOpen: boolean) => void;
  setVirtualInput: (input: VirtualInputState) => void;

  setCmlLevel: (level: 1 | 2 | 3 | 4) => void;
  setTelescopeLabOpen: (open: boolean) => void;
  updateTelescopeDesign: (patch: Partial<TelescopeDesignState>) => void;
  calibrateAndLaunchTelescope: () => void;
  advanceCubeSatPhase: () => void;
  openMissionViz: (targetPlanet?: PlanetId) => void;
  setMissionVizTimeline: (timeline: number) => void;
  setMissionVizAutoPlay: (autoPlay: boolean) => void;
  setMissionVizTargetPlanet: (planet: PlanetId) => void;

  pushSkyMessage: (text: string, mood?: SkyMood, speak?: boolean, voiceText?: string) => void;
  sendSkyUserQuery: (query: string) => void;
  showToast: (text: string) => void;

  returnToBridge: () => void;
  jumpToShuttleSection: (stationId: InteriorStationId) => void;
  takeLoungeBreak: () => void;
  harvestBioBay: () => void;
  runMedBayScan: () => void;
  inspectCargoBay: () => void;
  talkCommsOfficer: () => void;
  boardShipAndLaunch: () => void;
  flyToPlanet: (planetId: PlanetId, autopilot?: boolean) => void;
  setAutopilot: (active: boolean) => void;
  landOnPlanet: (planetId: PlanetId) => void;
  toggleRover: () => void;
  fireOrScan: () => void;
  triggerBarrelRoll: () => void;
  cycleWeather: () => void;
  setWeather: (weather: SpaceWeather) => void;
  setCameraMode: (mode: CameraMode) => void;

  updateInteriorTelemetry: (snap: InteriorTelemetrySnapshot) => void;
  updateSpaceTelemetry: (snap: SpaceTelemetrySnapshot) => void;
  updateSurfaceTelemetry: (snap: SurfaceTelemetrySnapshot) => void;
  onOrbitArrived: (planetId: PlanetId) => void;
  onWeatherChanged: (weather: SpaceWeather) => void;
  onRingPassed: () => void;
  onAsteroidMined: () => void;
  onAsteroidHit: () => void;
  onBarrelRollPerformed: () => void;
  onRoverToggled: (inRover: boolean) => void;
  onSampleCollected: (sampleId: string, planetId: PlanetId) => void;
  onCraterDiscovered: (craterId: string) => void;
  onScienceSiteCompleted: (siteId: string, dataMb: number) => void;
  onMonolithInspected: () => void;
  onCreatureScanned: (creatureId: string, speciesName: string) => void;
  onPickupCollected: (pickupId: string, pickupType: 'o2' | 'energy') => void;
  onAlienDisturbed: (speciesNameEn: string, speciesNameAr: string) => void;
  onAlienAttack: (speciesNameEn: string, speciesNameAr: string, inRover: boolean) => void;
  onSpacecraftRefuel: (full?: boolean) => void;
  respawnAtSpacecraft: () => void;
  setOutpostMenuOpen: (open: boolean) => void;
  buildSurfaceStructure: (kind: SurfaceBuildingKind) => void;

  transmitDataPacket: () => void;
  cycleCommsStation: () => void;
  setActiveGroundStationId: (stationId: string) => void;
  setCommsCompressionMode: (mode: CommsCompressionMode) => void;
  setAnalysisFidelityMode: (mode: AnalysisFidelityMode) => void;
  recordGroundPassDownlink: (
    deliveredMb: number,
    meta: { stationId: string; signalPct: number; dataRateKbps: number; windowHrs: number }
  ) => void;
  resolveEmergency: () => void;
  resolveChoiceOption: (optionId: string) => void;
  finishExpedition: (success: boolean, failureReason?: Record<Language, string>) => void;
  setStoryIntroOpen: (open: boolean) => void;
  setActiveSurvivalId: (id: string | null) => void;
  resolveSurvivalMission: (
    missionId: string,
    won: boolean,
    reasonText?: Record<Language, string>
  ) => void;
  retrySurvivalCampaign: () => void;
  openSurvivalDashboard2d: () => void;
  performAstronautAction: (
    action:
      | 'pace_breathing'
      | 'purge_co2'
      | 'prebreathe_o2'
      | 'toggle_tether'
      | 'set_lcvg'
      | 'set_temp_sim'
      | 'complete_eva_repair',
    value?: number
  ) => void;
  stepEvaExertion: (dt: number, solarZone: 'sunlit' | 'eclipse', thrusting: boolean) => void;
  setArchitectOpen: (open: boolean) => void;
  recordArchitectRun: (run: SavedArchitectRun) => void;
  deployArchitectBlueprintTo3D: (
    blueprint: ActiveMissionBlueprint,
    startIn?: 'spaceflight' | 'mission-viz'
  ) => void;

  toggleMute: () => void;
  toggleAmbientHum: () => void;
  toggleRoverAudio: () => void;
  toggleSpeech: () => void;
  toggleShadows: () => void;
  updateSettings: (patch: Partial<GameSettings>) => void;
  applyQualityPreset: (preset: QualityPreset) => void;
  simulationTick: (dt: number) => void;

  // Integrated Engineering & Mission Operations Actions
  setMccOpen: (open: boolean) => void;
  setSystemsLabOpen: (open: boolean) => void;
  setWhatIfOpen: (open: boolean) => void;
  setReportOpen: (open: boolean) => void;
  equipSubsystem14: (subsystemId: string) => void;
  purchaseSubsystem14: (subsystemId: string) => boolean;
  unlockTechNode: (techId: string) => boolean;
  toggleInstrumentSelection: (instId: string) => void;
  toggleInstrumentActive: (instId: string) => void;
  setOperationalMode: (mode: OperationalMode) => void;
  setTxPriority: (priority: TransmissionPriority) => void;
  setTransferStrategy: (strategy: TransferStrategy) => void;
  toggleSandboxUnrestricted: () => void;
  toggleBeginnerGuidedMode: () => void;
  setLifecyclePhase: (phase: number) => void;
  toggleLifecyclePaused: () => void;
  triggerDynamicEvent: (forcedType?: DynamicEventType) => void;
  resolveDynamicEvent: (optionId: string) => void;
  attemptSystemRecovery: () => void;
  updateAutonomousRules: (patch: Partial<AutonomousRulesConfig>) => void;
  applyNasaRecreation: (nasaId: string) => void;
  recordPerformanceSnapshot: (versionLabel?: string) => void;
  addInstructorAssignment: (assignment: InstructorAssignment) => void;
  applyInstructorAssignment: (assignmentId: string) => void;
  setTeamMembers: (members: CooperativeTeamMember[]) => void;
}

function readInitialLang(): Language {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === 'en' || saved === 'ar') return saved;
  } catch {
    // ignore
  }
  return 'ar';
}

function hasSavedInStorage(): boolean {
  try {
    return Boolean(localStorage.getItem(SAVE_KEY));
  } catch {
    return false;
  }
}

const ARCHITECT_RUNS_KEY = 'nova_architect_runs_v1';

function readArchitectRuns(): SavedArchitectRun[] {
  try {
    const raw = localStorage.getItem(ARCHITECT_RUNS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return [...BASELINE_LEADERBOARD];
}

const initialAudioPrefs = readInitialAudioPrefs();
const initialSettings = readInitialSettings();
spaceAudio.setMuted(initialAudioPrefs.audioMuted);
spaceAudio.setAmbientHumEnabled(initialAudioPrefs.ambientHumEnabled);
spaceAudio.setRoverAudioEnabled(initialAudioPrefs.roverAudioEnabled);
spaceAudio.setSpeechEnabled(initialAudioPrefs.speechEnabled);
spaceAudio.setMasterVolume(initialSettings.masterVolume);

export const useGameStore = create<GameStoreState>((set, get) => ({
  lang: readInitialLang(),
  screen: 'menu',
  sceneEnv: 'builder',
  difficulty: 'Commander',
  chapter: 1,
  character: { ...DEFAULT_CHARACTER },
  shipConfig: { ...DEFAULT_SHIP },
  shipMetrics: computeShipMetrics(DEFAULT_SHIP),
  resources: makeInitialResources('Commander'),
  crew: INITIAL_CREW.map((c) => ({ ...c })),
  specialists: INITIAL_SPECIALISTS.map((sp) => ({ ...sp })),
  personnelEffects: computePersonnelEffects(INITIAL_SPECIALISTS),
  missionPlan: { objective: 'signal', autoTransmit: false },

  activePlanet: 'luna',
  discoveredPlanets: ['luna'],
  discoveredCraterIds: [],
  completedScienceSiteIds: [],
  collectedSampleIds: [],
  scannedCreatureIds: [],
  surfaceBuildings: [],
  outpostMenuOpen: false,
  monolithInspected: false,
  pilotingRover: false,
  cameraMode: 'chase',

  ringsPassed: 0,
  asteroidsMined: 0,
  barrelRolls: 0,
  weather: 'clear',

  interiorTelemetry: DEFAULT_INTERIOR_TELEMETRY,
  spaceTelemetry: DEFAULT_SPACE_TELEMETRY,
  surfaceTelemetry: DEFAULT_SURFACE_TELEMETRY,
  virtualInput: { thrust: 0, yaw: 0, pitch: 0, boost: false },
  touchPadOpen: false,

  skyMessages: [],
  skyMood: 'happy',
  skyOpen: false,
  tabletOpen: false,
  tabletTab: 'overview',
  mapOpen: false,
  guideOpen: false,
  pitchDeckOpen: false,
  dashboardOpen: false,
  dashboardTab: 'overview',
  mode2dOpen: false,
  mode2dTab: 'dashboard2d',
  mouseLocked: false,
  storyIntroOpen: false,
  architectOpen: false,
  architectRuns: readArchitectRuns(),
  activeBlueprint: null,
  unlockedBudgetBonusM: 0,
  purchasedPartIds: [...DEFAULT_OWNED_PART_IDS],
  powerAllocation: { ...DEFAULT_POWER_ALLOC },
  shuttleCustomName: 'NOVA-7',
  hardcoreChallengeMode: false,
  completedStressTests: [],
  activeGroundStationId: 'dsn_goldstone',
  commsCompressionMode: 'raw',
  analysisFidelityMode: 'approximation',
  lastDownlinkKbps: 940,
  lastCommWindowHrs: 6.8,

  hullIntegrity: 100,
  survivalFailures: 0,
  survivalScore: 0,
  survivalStreak: 0,
  completedSurvivalIds: [],
  failedSurvivalIds: [],
  activeSurvivalId: SURVIVAL_MISSIONS[0].id,
  astronautBio: { ...DEFAULT_ASTRONAUT_BIO },

  cmlLevel: 1,
  telescope: {
    objectiveId: 'deep_galaxies',
    wavelengthId: 'infrared',
    opticId: 'segmented_ir',
    cubeSatPhase: 1,
    deployedCount: 0,
    lastMatchedNasaMission: null,
  },
  telescopeLabOpen: false,
  missionVizTimeline: 0.35,
  missionVizAutoPlay: true,
  missionVizTargetPlanet: 'mars',

  emergency: null,
  activeChoice: null,
  missionOutcome: null,

  audioMuted: initialAudioPrefs.audioMuted,
  ambientHumEnabled: initialAudioPrefs.ambientHumEnabled,
  roverAudioEnabled: initialAudioPrefs.roverAudioEnabled,
  speechEnabled: initialAudioPrefs.speechEnabled,
  shadowsEnabled: initialSettings.qualityPreset !== 'low',
  settings: initialSettings,
  hasSavedGame: hasSavedInStorage(),
  toastText: null,
  lastDamageAt: 0,

  advancedLoadout: { ...DEFAULT_ADVANCED_LOADOUT },
  unlockedSubsystemIds: [...DEFAULT_UNLOCKED_SUBSYSTEM_IDS],
  researchPoints: 180,
  unlockedTechIds: [],
  activeInstrumentIds: [...DEFAULT_ACTIVE_INSTRUMENT_IDS],
  instrumentActiveMap: { ...DEFAULT_INSTRUMENT_ACTIVE_MAP },
  operationalMode: 'nominal',
  txPriority: 'high_value_science',
  transferStrategy: 'hohmann',
  sandboxUnrestricted: false,
  beginnerGuidedMode: true,
  lifecyclePhase: 1,
  lifecyclePaused: false,
  fuelPct: 100,
  internalTempC: 21,
  activeMissionEvent: null,
  missionTimelineLog: [
    {
      id: 'init_log_1',
      timestamp: Date.now(),
      solTime: 1,
      phase: 1,
      source: 'system',
      summary: {
        ar: 'بدء بعثة NOVA-7 وتهيئة أنظمة القياس الهندسية الـ 14.',
        en: 'NOVA-7 initialized with 14-subsystem Engineering Trade-Off Core online.',
      },
    },
  ],
  autonomousRules: { ...DEFAULT_AUTONOMOUS_RULES },
  autonomousActionLog: [],
  failureInvestigationReport: null,
  performanceHistory: [],
  instructorAssignments: [...DEFAULT_INSTRUCTOR_ASSIGNMENTS],
  activeAssignmentId: null,
  teamMembers: [...DEFAULT_TEAM_MEMBERS],
  tradeOffReport: INITIAL_TRADEOFF_PAIR.tradeOffReport,
  digitalTwinState: INITIAL_TRADEOFF_PAIR.digitalTwinState,
  mccOpen: false,
  systemsLabOpen: false,
  whatIfOpen: false,
  reportOpen: false,

  setLang: (lang) => {
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {
      // ignore
    }
    set({ lang });
  },

  toggleLang: () => {
    const next = get().lang === 'ar' ? 'en' : 'ar';
    get().setLang(next);
  },

  setDifficulty: (difficulty) => {
    set({ difficulty, resources: makeInitialResources(difficulty) });
  },

  setScreen: (screen) => set({ screen }),

  setSceneEnv: (sceneEnv) => set({ sceneEnv }),

  updateCharacter: (patch) =>
    set((s) => ({ character: { ...s.character, ...patch } })),

  startNewGameFlow: () => {
    const diff = get().difficulty;
    set({
      screen: 'character',
      sceneEnv: 'builder',
      chapter: 1,
      shipConfig: { ...DEFAULT_SHIP },
      shipMetrics: computeShipMetrics(DEFAULT_SHIP),
      resources: makeInitialResources(diff),
      crew: INITIAL_CREW.map((c) => ({ ...c })),
      specialists: INITIAL_SPECIALISTS.map((sp) => ({ ...sp })),
      personnelEffects: computePersonnelEffects(INITIAL_SPECIALISTS),
      activePlanet: 'luna',
      discoveredPlanets: ['luna'],
      discoveredCraterIds: [],
      completedScienceSiteIds: [],
      collectedSampleIds: [],
      scannedCreatureIds: [],
      surfaceBuildings: [],
      outpostMenuOpen: false,
      monolithInspected: false,
      pilotingRover: false,
      ringsPassed: 0,
      asteroidsMined: 0,
      barrelRolls: 0,
      weather: 'clear',
      emergency: null,
      activeChoice: null,
      missionOutcome: null,
      skyMessages: [],
      storyIntroOpen: false,
      hullIntegrity: 100,
      survivalFailures: 0,
      survivalScore: 0,
      survivalStreak: 0,
      completedSurvivalIds: [],
      failedSurvivalIds: [],
      activeSurvivalId: SURVIVAL_MISSIONS[0].id,
      astronautBio: { ...DEFAULT_ASTRONAUT_BIO },
      activeBlueprint: null,
      unlockedBudgetBonusM: 0,
      purchasedPartIds: [...DEFAULT_OWNED_PART_IDS],
      powerAllocation: { ...DEFAULT_POWER_ALLOC },
      shuttleCustomName: 'NOVA-7',
      hardcoreChallengeMode: diff === 'Veteran',
      completedStressTests: [],
      activeGroundStationId: 'dsn_goldstone',
      commsCompressionMode: 'raw',
      analysisFidelityMode: diff === 'Veteran' ? 'high_fidelity' : 'approximation',
      lastDownlinkKbps: 940,
      lastCommWindowHrs: 6.8,
    });
  },

  completeCharacterSetup: () => {
    const { character, lang } = get();
    const cleanedName = character.name.trim() || (lang === 'ar' ? 'كابتن طارق' : 'Capt. Nova');
    const updatedChar = { ...character, name: cleanedName };
    const greeting = skyGreeting(cleanedName, lang);

    // BASE EXPERIENCE: Player starts INSIDE the realistic Spacecraft Bridge with Story Intro!
    set({
      character: updatedChar,
      screen: 'playing',
      sceneEnv: 'interior',
      cameraMode: 'first-person',
      tabletOpen: false,
      skyOpen: false,
      storyIntroOpen: true,
      hullIntegrity: 100,
      survivalFailures: 0,
      survivalScore: 0,
      survivalStreak: 0,
      completedSurvivalIds: [],
      failedSurvivalIds: [],
      activeSurvivalId: SURVIVAL_MISSIONS[0].id,
      astronautBio: { ...DEFAULT_ASTRONAUT_BIO },
      skyMessages: [
        {
          id: msgCounter++,
          sender: 'sky',
          text: greeting.text,
          voiceText: greeting.voiceText,
          mood: 'excited',
          timestamp: Date.now(),
        },
      ],
      skyMood: 'excited',
    });

    spaceAudio.speakSky(greeting.voiceText);
    setTimeout(() => {
      engineBridge?.enterInteriorBridge();
    }, 60);
    get().saveProgress();
  },

  continueSavedGame: () => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const shipConfig: ShipConfig = parsed.shipConfig || DEFAULT_SHIP;
      const greeting = skyGreeting(parsed.character?.name || '', get().lang);
      const savedSpecialists: ShuttleSpecialist[] = Array.isArray(parsed.specialists)
        ? INITIAL_SPECIALISTS.map((def) => {
            const match = parsed.specialists.find((x: ShuttleSpecialist) => x.id === def.id);
            return match ? { ...def, assignedRoomId: match.assignedRoomId } : { ...def };
          })
        : INITIAL_SPECIALISTS.map((sp) => ({ ...sp }));
      const savedPowerAlloc: PowerAllocation = parsed.powerAllocation
        ? {
            engines: Number(parsed.powerAllocation.engines) || 34,
            shields: Number(parsed.powerAllocation.shields) || 33,
            sensors: Number(parsed.powerAllocation.sensors) || 33,
          }
        : { ...DEFAULT_POWER_ALLOC };
      const savedOwnedParts: string[] = Array.isArray(parsed.purchasedPartIds)
        ? Array.from(new Set([...DEFAULT_OWNED_PART_IDS, ...parsed.purchasedPartIds]))
        : [...DEFAULT_OWNED_PART_IDS];

      set({
        screen: 'playing',
        sceneEnv: parsed.sceneEnv || 'interior',
        difficulty: parsed.difficulty || 'Commander',
        chapter: parsed.chapter || 1,
        character: parsed.character
          ? { gender: 'male', ...parsed.character }
          : DEFAULT_CHARACTER,
        shipConfig,
        shipMetrics: computeShipMetrics(shipConfig, savedPowerAlloc),
        resources: parsed.resources
          ? { suitHealth: 100, suitCoolant: 100, ...parsed.resources }
          : makeInitialResources('Commander'),
        specialists: savedSpecialists,
        personnelEffects: computePersonnelEffects(savedSpecialists),
        activePlanet: parsed.activePlanet || 'luna',
        discoveredPlanets: parsed.discoveredPlanets || ['luna'],
        discoveredCraterIds: parsed.discoveredCraterIds || [],
        completedScienceSiteIds: parsed.completedScienceSiteIds || [],
        collectedSampleIds: parsed.collectedSampleIds || [],
        scannedCreatureIds: parsed.scannedCreatureIds || [],
        surfaceBuildings: parsed.surfaceBuildings || [],
        monolithInspected: Boolean(parsed.monolithInspected),
        ringsPassed: parsed.ringsPassed || 0,
        asteroidsMined: parsed.asteroidsMined || 0,
        barrelRolls: parsed.barrelRolls || 0,
        hullIntegrity: typeof parsed.hullIntegrity === 'number' ? parsed.hullIntegrity : 100,
        survivalFailures: typeof parsed.survivalFailures === 'number' ? parsed.survivalFailures : 0,
        survivalScore: typeof parsed.survivalScore === 'number' ? parsed.survivalScore : 0,
        survivalStreak: typeof parsed.survivalStreak === 'number' ? parsed.survivalStreak : 0,
        completedSurvivalIds: Array.isArray(parsed.completedSurvivalIds) ? parsed.completedSurvivalIds : [],
        failedSurvivalIds: Array.isArray(parsed.failedSurvivalIds) ? parsed.failedSurvivalIds : [],
        activeSurvivalId: parsed.activeSurvivalId || SURVIVAL_MISSIONS[0].id,
        activeBlueprint: parsed.activeBlueprint || null,
        unlockedBudgetBonusM: typeof parsed.unlockedBudgetBonusM === 'number' ? parsed.unlockedBudgetBonusM : 0,
        purchasedPartIds: savedOwnedParts,
        powerAllocation: savedPowerAlloc,
        shuttleCustomName: typeof parsed.shuttleCustomName === 'string' && parsed.shuttleCustomName.trim() ? parsed.shuttleCustomName : 'NOVA-7',
        hardcoreChallengeMode: Boolean(parsed.hardcoreChallengeMode),
        completedStressTests: Array.isArray(parsed.completedStressTests) ? parsed.completedStressTests : [],
        activeGroundStationId: typeof parsed.activeGroundStationId === 'string' ? parsed.activeGroundStationId : 'dsn_goldstone',
        commsCompressionMode: parsed.commsCompressionMode === 'lossless_ccsds' || parsed.commsCompressionMode === 'priority_crop' ? parsed.commsCompressionMode : 'raw',
        analysisFidelityMode: parsed.analysisFidelityMode === 'high_fidelity' ? 'high_fidelity' : 'approximation',
        lastDownlinkKbps: typeof parsed.lastDownlinkKbps === 'number' ? parsed.lastDownlinkKbps : 940,
        lastCommWindowHrs: typeof parsed.lastCommWindowHrs === 'number' ? parsed.lastCommWindowHrs : 6.8,
        advancedLoadout: parsed.advancedLoadout ? { ...DEFAULT_ADVANCED_LOADOUT, ...parsed.advancedLoadout } : { ...DEFAULT_ADVANCED_LOADOUT },
        unlockedSubsystemIds: Array.isArray(parsed.unlockedSubsystemIds) ? Array.from(new Set([...DEFAULT_UNLOCKED_SUBSYSTEM_IDS, ...parsed.unlockedSubsystemIds])) : [...DEFAULT_UNLOCKED_SUBSYSTEM_IDS],
        researchPoints: typeof parsed.researchPoints === 'number' ? parsed.researchPoints : 180,
        unlockedTechIds: Array.isArray(parsed.unlockedTechIds) ? parsed.unlockedTechIds : [],
        activeInstrumentIds: Array.isArray(parsed.activeInstrumentIds) && parsed.activeInstrumentIds.length ? parsed.activeInstrumentIds : [...DEFAULT_ACTIVE_INSTRUMENT_IDS],
        instrumentActiveMap: parsed.instrumentActiveMap || { ...DEFAULT_INSTRUMENT_ACTIVE_MAP },
        operationalMode: parsed.operationalMode || 'nominal',
        txPriority: parsed.txPriority || 'high_value_science',
        transferStrategy: parsed.transferStrategy || 'hohmann',
        sandboxUnrestricted: Boolean(parsed.sandboxUnrestricted),
        beginnerGuidedMode: typeof parsed.beginnerGuidedMode === 'boolean' ? parsed.beginnerGuidedMode : true,
        lifecyclePhase: typeof parsed.lifecyclePhase === 'number' ? parsed.lifecyclePhase : 1,
        fuelPct: typeof parsed.fuelPct === 'number' ? parsed.fuelPct : 100,
        internalTempC: typeof parsed.internalTempC === 'number' ? parsed.internalTempC : 21,
        autonomousRules: parsed.autonomousRules ? { ...DEFAULT_AUTONOMOUS_RULES, ...parsed.autonomousRules } : { ...DEFAULT_AUTONOMOUS_RULES },
        performanceHistory: Array.isArray(parsed.performanceHistory) ? parsed.performanceHistory : [],
        instructorAssignments: Array.isArray(parsed.instructorAssignments) && parsed.instructorAssignments.length ? parsed.instructorAssignments : [...DEFAULT_INSTRUCTOR_ASSIGNMENTS],
        teamMembers: Array.isArray(parsed.teamMembers) && parsed.teamMembers.length ? parsed.teamMembers : [...DEFAULT_TEAM_MEMBERS],
        skyMessages: [
          {
            id: msgCounter++,
            sender: 'sky',
            text: greeting.text,
            voiceText: greeting.voiceText,
            mood: 'happy',
            timestamp: Date.now(),
          },
        ],
      });
      // Recompute live engineering report & Digital Twin after load
      const afterLoad = get();
      const pair = computeEngOutputs({
        planetId: afterLoad.activePlanet,
        loadout: afterLoad.advancedLoadout,
        instrumentIds: afterLoad.activeInstrumentIds,
        instrumentActiveMap: afterLoad.instrumentActiveMap,
        operationalMode: afterLoad.operationalMode,
        transferStrategy: afterLoad.transferStrategy,
        stationId: afterLoad.activeGroundStationId,
        compressionMode: afterLoad.commsCompressionMode,
        fidelityMode: afterLoad.analysisFidelityMode,
        maxBudgetM: Math.max(200, afterLoad.resources.budget + afterLoad.unlockedBudgetBonusM),
        sandboxUnrestricted: afterLoad.sandboxUnrestricted,
        hullIntegrity: afterLoad.hullIntegrity,
        commsSignal: afterLoad.resources.commsSignal,
      });
      set({ tradeOffReport: pair.tradeOffReport, digitalTwinState: pair.digitalTwinState });
      engineBridge?.setDigitalTwinState(pair.digitalTwinState);
      spaceAudio.speakSky(greeting.voiceText);
    } catch {
      get().startNewGameFlow();
    }
  },

  saveProgress: () => {
    const s = get();
    try {
      localStorage.setItem(
        SAVE_KEY,
        JSON.stringify({
          difficulty: s.difficulty,
          chapter: s.chapter,
          sceneEnv: s.sceneEnv,
          character: s.character,
          shipConfig: s.shipConfig,
          resources: s.resources,
          specialists: s.specialists,
          activePlanet: s.activePlanet,
          discoveredPlanets: s.discoveredPlanets,
          discoveredCraterIds: s.discoveredCraterIds,
          completedScienceSiteIds: s.completedScienceSiteIds,
          collectedSampleIds: s.collectedSampleIds,
          scannedCreatureIds: s.scannedCreatureIds,
          surfaceBuildings: s.surfaceBuildings,
          monolithInspected: s.monolithInspected,
          ringsPassed: s.ringsPassed,
          asteroidsMined: s.asteroidsMined,
          barrelRolls: s.barrelRolls,
          hullIntegrity: s.hullIntegrity,
          survivalFailures: s.survivalFailures,
          survivalScore: s.survivalScore,
          survivalStreak: s.survivalStreak,
          completedSurvivalIds: s.completedSurvivalIds,
          failedSurvivalIds: s.failedSurvivalIds,
          activeSurvivalId: s.activeSurvivalId,
          activeBlueprint: s.activeBlueprint,
          unlockedBudgetBonusM: s.unlockedBudgetBonusM,
          purchasedPartIds: s.purchasedPartIds,
          powerAllocation: s.powerAllocation,
          shuttleCustomName: s.shuttleCustomName,
          hardcoreChallengeMode: s.hardcoreChallengeMode,
          completedStressTests: s.completedStressTests,
          activeGroundStationId: s.activeGroundStationId,
          commsCompressionMode: s.commsCompressionMode,
          analysisFidelityMode: s.analysisFidelityMode,
          lastDownlinkKbps: s.lastDownlinkKbps,
          lastCommWindowHrs: s.lastCommWindowHrs,
          advancedLoadout: s.advancedLoadout,
          unlockedSubsystemIds: s.unlockedSubsystemIds,
          researchPoints: s.researchPoints,
          unlockedTechIds: s.unlockedTechIds,
          activeInstrumentIds: s.activeInstrumentIds,
          instrumentActiveMap: s.instrumentActiveMap,
          operationalMode: s.operationalMode,
          txPriority: s.txPriority,
          transferStrategy: s.transferStrategy,
          sandboxUnrestricted: s.sandboxUnrestricted,
          beginnerGuidedMode: s.beginnerGuidedMode,
          lifecyclePhase: s.lifecyclePhase,
          fuelPct: s.fuelPct,
          internalTempC: s.internalTempC,
          autonomousRules: s.autonomousRules,
          performanceHistory: s.performanceHistory.slice(0, 10),
          instructorAssignments: s.instructorAssignments.slice(0, 12),
          teamMembers: s.teamMembers,
        })
      );
      set({ hasSavedGame: true });
    } catch {
      // ignore
    }
  },

  selectShipPart: (partId) => {
    get().buyAndEquipShipPart(partId);
  },

  buyAndEquipShipPart: (partId) => {
    const s = get();
    const part = SHIP_PARTS.find((p) => p.id === partId);
    if (!part) return false;

    const alreadyOwned = s.purchasedPartIds.includes(partId);
    if (!alreadyOwned && s.resources.credits < part.cost) {
      get().showToast(
        s.lang === 'ar'
          ? `رصيد غير كافٍ: تحتاج ${part.cost} CR لشراء ${part.name.ar} — اربح مهام البقاء أو المختبر!`
          : `Insufficient Credits: Need ${part.cost} CR to unlock ${part.name.en}`
      );
      spaceAudio.playWeatherAlert('storm');
      return false;
    }

    const nextConfig = { ...s.shipConfig };
    if (partId.startsWith('eng_')) nextConfig.engineId = partId;
    else if (partId.startsWith('sol_')) nextConfig.solarId = partId;
    else if (partId.startsWith('hull_')) nextConfig.hullId = partId;
    else if (partId.startsWith('sen_')) nextConfig.sensorId = partId;
    else if (partId.startsWith('com_')) nextConfig.commsId = partId;

    const nextOwned = alreadyOwned ? s.purchasedPartIds : [...s.purchasedPartIds, partId];
    const nextCredits = alreadyOwned ? s.resources.credits : s.resources.credits - part.cost;
    const metrics = computeShipMetrics(nextConfig, s.powerAllocation);

    const pair = buildEngPairFromState(s);
    set({
      shipConfig: nextConfig,
      shipMetrics: metrics,
      purchasedPartIds: nextOwned,
      tradeOffReport: pair.tradeOffReport,
      digitalTwinState: pair.digitalTwinState,
      resources: {
        ...s.resources,
        credits: nextCredits,
        mass: metrics.mass,
        powerGeneration: metrics.powerGen,
        powerConsumption: metrics.powerUse,
      },
    });
    engineBridge?.setDigitalTwinState(pair.digitalTwinState);
    if (!alreadyOwned) {
      get().showToast(
        s.lang === 'ar'
          ? `تم شراء وتركيب ${part.name.ar} (-${part.cost} CR)`
          : `Unlocked & Equipped ${part.name.en} (-${part.cost} CR)`
      );
      spaceAudio.playPlanetFanfare();
    } else {
      spaceAudio.playSkyChirp();
    }
    get().saveProgress();
    return true;
  },

  selectLivery: (liveryId) => {
    const s = get();
    const nextConfig = { ...s.shipConfig, liveryId };
    set({ shipConfig: nextConfig });
    const livery = SHIP_LIVERIES.find((l) => l.id === liveryId);
    if (livery) get().showToast(livery.name[s.lang]);
    spaceAudio.playSkyChirp();
    get().saveProgress();
  },

  setPowerAllocation: (alloc) => {
    const s = get();
    const sum = Math.max(1, alloc.engines + alloc.shields + alloc.sensors);
    const engines = Math.round((alloc.engines / sum) * 100);
    const shields = Math.round((alloc.shields / sum) * 100);
    const sensors = Math.max(0, 100 - engines - shields);
    const cleanAlloc: PowerAllocation = { engines, shields, sensors };
    const metrics = computeShipMetrics(s.shipConfig, cleanAlloc);
    set({
      powerAllocation: cleanAlloc,
      shipMetrics: metrics,
    });
    get().saveProgress();
  },

  setShuttleCustomName: (name) => {
    const cleaned = name.slice(0, 18);
    set({ shuttleCustomName: cleaned || 'NOVA-7' });
    get().saveProgress();
  },

  toggleHardcoreChallengeMode: () => {
    const s = get();
    const next = !s.hardcoreChallengeMode;
    set({
      hardcoreChallengeMode: next,
      toastText: next
        ? s.lang === 'ar'
          ? 'تم تفعيل وضع التحدي الصعب (+50% فلوس وميزانية بدون تلميحات الأرقام)!'
          : 'Hardcore Challenge Enabled (+50% CR & Budget — spoilers hidden)!'
        : s.lang === 'ar'
          ? 'تم الرجوع للوضع القياسي.'
          : 'Switched to Standard Challenge Mode.',
    });
    spaceAudio.playSkyChirp();
    get().saveProgress();
  },

  investCreditsForBudget: () => {
    const s = get();
    const cost = 200;
    const gainM = 40;
    if (s.resources.credits < cost) {
      get().showToast(
        s.lang === 'ar'
          ? `تحتاج ${cost} CR لتوسيع الميزانية (+$${gainM}M)`
          : `Need ${cost} CR to expand Agency Budget (+$${gainM}M)`
      );
      spaceAudio.playWeatherAlert('storm');
      return false;
    }
    set({
      unlockedBudgetBonusM: s.unlockedBudgetBonusM + gainM,
      resources: {
        ...s.resources,
        credits: s.resources.credits - cost,
        budget: s.resources.budget + gainM,
      },
      toastText:
        s.lang === 'ar'
          ? `تم استثمار 200 CR ⬅ فتح +$${gainM}M ميزانية أعلى دائمة للوكالة!`
          : `Invested 200 CR → Unlocked +$${gainM}M Permanent Agency Budget!`,
    });
    spaceAudio.playPlanetFanfare();
    get().saveProgress();
    return true;
  },

  resolveShuttleStressTest: (testId, passed, rewardCr, rewardBudgetM, hullDmg) => {
    const s = get();
    if (passed) {
      const firstTime = !s.completedStressTests.includes(testId);
      const earnedCr = firstTime ? rewardCr : Math.round(rewardCr * 0.45);
      const earnedBudget = firstTime ? rewardBudgetM : Math.round(rewardBudgetM * 0.4);
      set({
        completedStressTests: firstTime ? [...s.completedStressTests, testId] : s.completedStressTests,
        unlockedBudgetBonusM: s.unlockedBudgetBonusM + earnedBudget,
        hullIntegrity: Math.min(100, s.hullIntegrity + 6),
        resources: {
          ...s.resources,
          credits: s.resources.credits + earnedCr,
          budget: s.resources.budget + earnedBudget,
        },
        toastText:
          s.lang === 'ar'
            ? `اجتاز المكوك اختبار الإجهاد! +${earnedCr} CR و +$${earnedBudget}M ميزانية`
            : `Shuttle Passed Stress Test! +${earnedCr} CR & +$${earnedBudget}M Budget`,
      });
      spaceAudio.playPlanetFanfare();
    } else {
      const nextHull = Math.max(15, s.hullIntegrity - hullDmg);
      const creditFine = 35;
      const budgetCutM = 15;
      set({
        hullIntegrity: nextHull,
        unlockedBudgetBonusM: Math.max(-120, s.unlockedBudgetBonusM - budgetCutM),
        resources: {
          ...s.resources,
          credits: Math.max(0, s.resources.credits - creditFine),
          budget: Math.max(40, s.resources.budget - budgetCutM),
        },
        toastText:
          s.lang === 'ar'
            ? `فشل اختبار الإجهاد (-${hullDmg}% هيكل · -${creditFine} CR · -$${budgetCutM}M ميزانية) — طوّر الدروع أو عدّل الطاقة!`
            : `Stress Test Failed (-${hullDmg}% Hull · -${creditFine} CR · -$${budgetCutM}M Budget) — upgrade armor or rebalance power!`,
      });
      spaceAudio.playWeatherAlert('storm');
    }
    get().saveProgress();
  },

  setMissionPlan: (patch) =>
    set((s) => ({ missionPlan: { ...s.missionPlan, ...patch } })),

  assignCrew: (crewId, assignment) =>
    set((s) => ({
      crew: s.crew.map((m) => (m.id === crewId ? { ...m, assignment } : m)),
    })),

  assignSpecialistToRoom: (specialistId, roomId) => {
    const s = get();
    const nextSpecialists = s.specialists.map((sp) =>
      sp.id === specialistId ? { ...sp, assignedRoomId: roomId } : sp
    );
    const nextEffects = computePersonnelEffects(nextSpecialists);
    set({ specialists: nextSpecialists, personnelEffects: nextEffects });
    const spObj = nextSpecialists.find((x) => x.id === specialistId);
    if (spObj) {
      get().showToast(
        s.lang === 'ar'
          ? `تم نقل ${spObj.name.ar} — كفاءة الإصلاح ${nextEffects.repairSpeedMult}x • العلوم ${nextEffects.scienceRateMult}x`
          : `Reassigned ${spObj.name.en} — Repair ${nextEffects.repairSpeedMult}x • Science ${nextEffects.scienceRateMult}x`
      );
    }
    spaceAudio.playSkyChirp();
    get().saveProgress();
  },

  swapSpecialists: (idA, idB) => {
    const s = get();
    const spA = s.specialists.find((x) => x.id === idA);
    const spB = s.specialists.find((x) => x.id === idB);
    if (!spA || !spB || idA === idB) return;
    const nextSpecialists = s.specialists.map((sp) => {
      if (sp.id === idA) return { ...sp, assignedRoomId: spB.assignedRoomId };
      if (sp.id === idB) return { ...sp, assignedRoomId: spA.assignedRoomId };
      return sp;
    });
    const nextEffects = computePersonnelEffects(nextSpecialists);
    set({ specialists: nextSpecialists, personnelEffects: nextEffects });
    spaceAudio.playSkyChirp();
    get().saveProgress();
  },

  applyPersonnelPreset: (preset) => {
    const s = get();
    const mapByPreset: Record<SpecialistId, ShuttleRoomId> =
      preset === 'science'
        ? {
            ryan: 'helm',
            nadia: 'science_lab',
            elena: 'science_lab',
            omar: 'science_lab',
            maya: 'bio_bay',
            sophia: 'bio_bay',
            marcus: 'nav',
            devon: 'engineering',
            aria: 'comms_desk',
            leo: 'nav',
          }
        : preset === 'repair'
          ? {
              ryan: 'helm',
              nadia: 'nav',
              elena: 'science_lab',
              omar: 'med_bay',
              maya: 'engineering',
              sophia: 'med_bay',
              marcus: 'engineering',
              devon: 'engineering',
              aria: 'comms_desk',
              leo: 'cargo_bay',
            }
          : {
              ryan: 'helm',
              nadia: 'nav',
              elena: 'science_lab',
              omar: 'bio_bay',
              maya: 'lounge',
              sophia: 'med_bay',
              marcus: 'engineering',
              devon: 'cargo_bay',
              aria: 'comms_desk',
              leo: 'airlock',
            };

    const nextSpecialists = s.specialists.map((sp) => ({
      ...sp,
      assignedRoomId: mapByPreset[sp.id] || sp.assignedRoomId,
    }));
    const nextEffects = computePersonnelEffects(nextSpecialists);
    set({ specialists: nextSpecialists, personnelEffects: nextEffects });
    get().showToast(
      s.lang === 'ar'
        ? `تم تفعيل تشكيلة الطاقم — الإصلاح ${nextEffects.repairSpeedMult}x • العلوم ${nextEffects.scienceRateMult}x`
        : `Crew Roster Applied — Repair ${nextEffects.repairSpeedMult}x • Science ${nextEffects.scienceRateMult}x`
    );
    spaceAudio.playRingPass();
    get().saveProgress();
  },

  setTabletOpen: (open, tab) =>
    set((s) => {
      if (open) engineBridge?.setMouseLocked(false);
      return {
        tabletOpen: open,
        tabletTab: tab ?? s.tabletTab,
        mapOpen: open ? false : s.mapOpen,
        guideOpen: open ? false : s.guideOpen,
        telescopeLabOpen: open ? false : s.telescopeLabOpen,
        dashboardOpen: open ? false : s.dashboardOpen,
        mode2dOpen: open ? false : s.mode2dOpen,
      };
    }),

  setSkyOpen: (skyOpen) => {
    if (skyOpen) engineBridge?.setMouseLocked(false);
    set({ skyOpen });
  },
  setMapOpen: (mapOpen) =>
    set((s) => {
      if (mapOpen) engineBridge?.setMouseLocked(false);
      return {
        mapOpen,
        tabletOpen: mapOpen ? false : s.tabletOpen,
        telescopeLabOpen: mapOpen ? false : s.telescopeLabOpen,
        dashboardOpen: mapOpen ? false : s.dashboardOpen,
        mode2dOpen: mapOpen ? false : s.mode2dOpen,
      };
    }),
  setGuideOpen: (guideOpen) =>
    set((s) => {
      if (guideOpen) engineBridge?.setMouseLocked(false);
      return {
        guideOpen,
        pitchDeckOpen: guideOpen ? false : s.pitchDeckOpen,
        tabletOpen: guideOpen ? false : s.tabletOpen,
        telescopeLabOpen: guideOpen ? false : s.telescopeLabOpen,
        dashboardOpen: guideOpen ? false : s.dashboardOpen,
        mode2dOpen: guideOpen ? false : s.mode2dOpen,
      };
    }),
  setPitchDeckOpen: (pitchDeckOpen) =>
    set((s) => {
      if (pitchDeckOpen) engineBridge?.setMouseLocked(false);
      return {
        pitchDeckOpen,
        guideOpen: pitchDeckOpen ? false : s.guideOpen,
        tabletOpen: pitchDeckOpen ? false : s.tabletOpen,
        telescopeLabOpen: pitchDeckOpen ? false : s.telescopeLabOpen,
        dashboardOpen: pitchDeckOpen ? false : s.dashboardOpen,
        mode2dOpen: pitchDeckOpen ? false : s.mode2dOpen,
        mccOpen: pitchDeckOpen ? false : s.mccOpen,
        systemsLabOpen: pitchDeckOpen ? false : s.systemsLabOpen,
        whatIfOpen: pitchDeckOpen ? false : s.whatIfOpen,
        reportOpen: pitchDeckOpen ? false : s.reportOpen,
      };
    }),
  setDashboardOpen: (dashboardOpen, tab) =>
    set((s) => {
      if (dashboardOpen) {
        engineBridge?.setMouseLocked(false);
        const msg = skyEventText('main_dashboard', s.character.name, s.lang);
        spaceAudio.playSkyChirp();
        return {
          dashboardOpen,
          dashboardTab: tab ?? s.dashboardTab,
          tabletOpen: false,
          mapOpen: false,
          guideOpen: false,
          telescopeLabOpen: false,
          mode2dOpen: false,
          skyMood: msg.mood,
        };
      }
      return { dashboardOpen };
    }),
  setDashboardTab: (dashboardTab) => set({ dashboardTab }),
  setMode2dOpen: (mode2dOpen, tab) =>
    set((s) => {
      if (mode2dOpen) {
        engineBridge?.setMouseLocked(false);
        const msg = skyEventText('control_2d', s.character.name, s.lang);
        spaceAudio.speakSky(msg.voiceText);
      }
      return {
        mode2dOpen,
        mode2dTab: tab ?? s.mode2dTab,
        tabletOpen: mode2dOpen ? false : s.tabletOpen,
        mapOpen: mode2dOpen ? false : s.mapOpen,
        guideOpen: mode2dOpen ? false : s.guideOpen,
        telescopeLabOpen: mode2dOpen ? false : s.telescopeLabOpen,
        dashboardOpen: mode2dOpen ? false : s.dashboardOpen,
      };
    }),
  setMode2dTab: (mode2dTab) => set({ mode2dTab }),
  setMouseLockedState: (mouseLocked) => set({ mouseLocked }),
  toggleMouseLock: () => engineBridge?.toggleMouseLock(),
  setTouchPadOpen: (touchPadOpen) => set({ touchPadOpen }),
  setVirtualInput: (virtualInput) => set({ virtualInput }),

  setCmlLevel: (cmlLevel) => set({ cmlLevel }),
  setTelescopeLabOpen: (telescopeLabOpen) =>
    set((s) => {
      if (telescopeLabOpen) engineBridge?.setMouseLocked(false);
      return {
        telescopeLabOpen,
        tabletOpen: telescopeLabOpen ? false : s.tabletOpen,
        mapOpen: telescopeLabOpen ? false : s.mapOpen,
        guideOpen: telescopeLabOpen ? false : s.guideOpen,
        dashboardOpen: telescopeLabOpen ? false : s.dashboardOpen,
        mode2dOpen: telescopeLabOpen ? false : s.mode2dOpen,
      };
    }),
  updateTelescopeDesign: (patch) =>
    set((s) => ({ telescope: { ...s.telescope, ...patch } })),

  calibrateAndLaunchTelescope: () => {
    const s = get();
    const obj = TELESCOPE_OBJECTIVES.find((o) => o.id === s.telescope.objectiveId);
    if (!obj) return;

    const matched =
      s.telescope.wavelengthId === obj.idealWavelength &&
      s.telescope.opticId === obj.idealOptic;

    if (matched) {
      const sciMult = s.personnelEffects.scienceRateMult;
      const bonusData = Math.round(55 * sciMult);
      const bonusCredits = Math.round(120 * sciMult);
      set((state) => ({
        cmlLevel: Math.max(state.cmlLevel, 3) as 1 | 2 | 3 | 4,
        telescope: {
          ...state.telescope,
          deployedCount: state.telescope.deployedCount + 1,
          lastMatchedNasaMission: obj.nasaAnalog,
        },
        resources: {
          ...state.resources,
          credits: state.resources.credits + bonusCredits,
          dataStorage: Math.min(state.resources.maxStorage, state.resources.dataStorage + bonusData),
          dataCollected: state.resources.dataCollected + bonusData,
        },
      }));
      const msg = skyEventText('telescope_success', s.character.name, s.lang, undefined, obj.nasaAnalog);
      get().pushSkyMessage(msg.text, msg.mood, true, msg.voiceText);
      spaceAudio.playPlanetFanfare();
      get().saveProgress();
    } else {
      const msg = skyEventText('telescope_mismatch', s.character.name, s.lang);
      get().pushSkyMessage(msg.text, msg.mood, true, msg.voiceText);
      spaceAudio.playWeatherAlert('storm');
    }
  },

  advanceCubeSatPhase: () => {
    const s = get();
    const sciMult = s.personnelEffects.scienceRateMult;
    const bonusData = Math.round(35 * sciMult);
    const bonusCredits = Math.round(75 * sciMult);
    const nextPhase = Math.min(4, s.telescope.cubeSatPhase + 1) as 1 | 2 | 3 | 4;
    const phaseInfo = CUBESAT_PHASES.find((p) => p.phase === nextPhase);
    set((state) => ({
      cmlLevel: nextPhase >= 3 ? (Math.max(state.cmlLevel, 4) as 1 | 2 | 3 | 4) : state.cmlLevel,
      telescope: { ...state.telescope, cubeSatPhase: nextPhase },
      resources: {
        ...state.resources,
        credits: state.resources.credits + bonusCredits,
        dataCollected: state.resources.dataCollected + bonusData,
        dataStorage: Math.min(state.resources.maxStorage, state.resources.dataStorage + bonusData),
      },
    }));
    const msg = skyEventText(
      'cubesat_advance',
      s.character.name,
      s.lang,
      undefined,
      phaseInfo?.title[s.lang] || phaseInfo?.title.en
    );
    get().pushSkyMessage(msg.text, msg.mood, true, msg.voiceText);
    spaceAudio.playRingPass();
    get().saveProgress();
  },

  openMissionViz: (targetPlanet) => {
    const s = get();
    const target = targetPlanet || s.missionVizTargetPlanet || 'mars';
    const planet = PLANETS.find((p) => p.id === target) || PLANETS[1];
    set({
      sceneEnv: 'mission-viz',
      missionVizTargetPlanet: target,
      tabletOpen: false,
      mapOpen: false,
      telescopeLabOpen: false,
      cmlLevel: Math.max(s.cmlLevel, 3) as 1 | 2 | 3 | 4,
    });
    engineBridge?.setMissionVizState(s.missionVizTimeline, target);
    const msg = skyEventText('mission_viz', s.character.name, s.lang, planet);
    get().pushSkyMessage(msg.text, msg.mood, true, msg.voiceText);
    spaceAudio.playSkyChirp();
  },

  setMissionVizTimeline: (missionVizTimeline) => {
    const clamped = Math.max(0, Math.min(1, missionVizTimeline));
    set({ missionVizTimeline: clamped });
    engineBridge?.setMissionVizState(clamped, get().missionVizTargetPlanet);
  },

  setMissionVizAutoPlay: (missionVizAutoPlay) => set({ missionVizAutoPlay }),

  setMissionVizTargetPlanet: (missionVizTargetPlanet) => {
    set({ missionVizTargetPlanet });
    engineBridge?.setMissionVizState(get().missionVizTimeline, missionVizTargetPlanet);
  },

  pushSkyMessage: (text, mood = 'happy', speak = false, voiceText) => {
    set((s) => ({
      skyMood: mood,
      skyMessages: [
        ...s.skyMessages.slice(-24),
        {
          id: msgCounter++,
          sender: 'sky',
          text,
          voiceText,
          mood,
          timestamp: Date.now(),
        },
      ],
    }));
    if (speak && voiceText) {
      spaceAudio.speakSky(voiceText);
    }
  },

  sendSkyUserQuery: (query) => {
    const s = get();
    const trimmed = query.trim();
    if (!trimmed) return;
    const planet = PLANETS.find((p) => p.id === s.activePlanet) || PLANETS[0];
    const isEngineeringQuery =
      /fail|wrong|problem|why|crash|error|europa|mars|neptune|uranus|mercury|venus|luna|improve|upgrade|comm|data|dsn|antenna|power|thermal|temp|fuel|delta|orbit|mass|what|recommend|فشل|تخسر|مشكلة|عطل|ليه|سبب|أوروبا|المريخ|نبتون|عطارد|الزهرة|تحسين|تطوير|اتصال|بيانات|هوائي|محطة|طاقة|حرارة|وقود|مدار|كتلة/i.test(
        trimmed
      );
    const reply = isEngineeringQuery
      ? generateEngineeringSkyReply(trimmed, {
          lang: s.lang,
          commanderName: getDisplayCommander(s.character.name, s.lang),
          planetId: s.activePlanet,
          loadout: s.advancedLoadout,
          tradeOff: s.tradeOffReport,
          resources: s.resources,
          hullIntegrity: s.hullIntegrity,
          fuelPct: s.fuelPct,
          internalTempC: s.internalTempC,
          operationalMode: s.operationalMode,
          lifecyclePhase: s.lifecyclePhase,
          activeEvent: s.activeMissionEvent,
          lastFailureReport: s.failureInvestigationReport,
        })
      : generateSkyChatReply({
          query: trimmed,
          playerName: s.character.name,
          lang: s.lang,
          metrics: s.shipMetrics,
          resources: s.resources,
          activePlanet: planet,
          weather: s.weather,
          discoveredCount: s.discoveredPlanets.length,
        });

    set((state) => ({
      skyMood: reply.mood,
      skyMessages: [
        ...state.skyMessages.slice(-22),
        {
          id: msgCounter++,
          sender: 'player',
          text: trimmed,
          mood: 'calm',
          timestamp: Date.now(),
        },
        {
          id: msgCounter++,
          sender: 'sky',
          text: reply.text,
          voiceText: reply.voiceText,
          mood: reply.mood,
          timestamp: Date.now() + 1,
        },
      ],
    }));
    spaceAudio.speakSky(reply.voiceText);
  },

  showToast: (toastText) => {
    set({ toastText });
    window.setTimeout(() => {
      if (get().toastText === toastText) {
        set({ toastText: null });
      }
    }, 3000);
  },

  returnToBridge: () => {
    const s = get();
    set((state) => ({
      sceneEnv: 'interior',
      pilotingRover: false,
      cameraMode: 'first-person',
      tabletOpen: false,
      mapOpen: false,
      resources: {
        ...state.resources,
        suitO2: 100,
        battery: 100,
        suitHealth: 100,
        suitCoolant: 100,
      },
      astronautBio: {
        ...state.astronautBio,
        co2MmHg: 1.0,
        suitTempC: 21.5,
        suitPressureKpa: 29.6,
        heartRateBpm: 74,
        stressLevel: 'CALM',
      },
    }));
    engineBridge?.enterInteriorBridge();
    const msg = skyEventText('return_bridge', s.character.name, s.lang);
    get().pushSkyMessage(msg.text, msg.mood, true, msg.voiceText);
    get().showToast(
      s.lang === 'ar'
        ? 'تم شحن الأكسجين والطاقة وصحة البدلة 100% داخل المركبة ✓'
        : 'Docked Inside Spacecraft: O2, Power, Coolant & Suit Health Refueled 100% ✓'
    );
    spaceAudio.playSkyChirp();
  },

  jumpToShuttleSection: (stationId) => {
    const s = get();
    if (s.sceneEnv !== 'interior') {
      set({
        sceneEnv: 'interior',
        pilotingRover: false,
        cameraMode: 'first-person',
        tabletOpen: false,
        mapOpen: false,
      });
      engineBridge?.enterInteriorBridge();
    }
    engineBridge?.walkToInteriorStation(stationId);
    spaceAudio.playSkyChirp();
  },

  takeLoungeBreak: () => {
    const s = get();
    const lifeMult = s.personnelEffects.lifeSupportRateMult;
    const batteryGain = Math.round(15 * lifeMult);
    set((state) => ({
      resources: {
        ...state.resources,
        suitO2: 100,
        battery: Math.min(100, state.resources.battery + batteryGain),
      },
      crew: state.crew.map((c) => ({
        ...c,
        morale: Math.min(100, c.morale + Math.round(5 * lifeMult)),
        fatigue: Math.max(0, c.fatigue - Math.round(6 * lifeMult)),
      })),
    }));
    const msg = skyEventText('lounge_coffee', s.character.name, s.lang);
    get().pushSkyMessage(msg.text, msg.mood, true, msg.voiceText);
    get().showToast(s.lang === 'ar' ? `استراحة قهوة دافئة ☕ +${batteryGain}% طاقة` : `Warm Coffee Break ☕ +${batteryGain}% PWR`);
  },

  harvestBioBay: () => {
    const s = get();
    const sciMult = s.personnelEffects.scienceRateMult;
    const dataGain = Math.round(40 * sciMult);
    const creditGain = Math.round(55 * sciMult);
    set((state) => ({
      resources: {
        ...state.resources,
        suitO2: 100,
        dataStorage: Math.min(state.resources.maxStorage, state.resources.dataStorage + dataGain),
        dataCollected: state.resources.dataCollected + dataGain,
        credits: state.resources.credits + creditGain,
      },
    }));
    const msg = skyEventText('bio_harvest', s.character.name, s.lang);
    get().pushSkyMessage(msg.text, msg.mood, true, msg.voiceText);
    spaceAudio.playRingPass();
    get().showToast(
      s.lang === 'ar'
        ? `قسم الزراعة: O2 100% +${dataGain}MB +${creditGain} CR 🌱`
        : `Bio-Dome: O2 100% +${dataGain}MB +${creditGain} CR 🌱`
    );
    get().saveProgress();
  },

  runMedBayScan: () => {
    const s = get();
    const lifeMult = s.personnelEffects.lifeSupportRateMult;
    const radStr = `${s.spaceTelemetry.radiationSievert.toFixed(2)} mSv`;
    set((state) => ({
      resources: {
        ...state.resources,
        suitO2: 100,
      },
      crew: state.crew.map((c) => ({
        ...c,
        morale: Math.min(100, c.morale + Math.round(8 * lifeMult)),
        fatigue: Math.max(0, c.fatigue - Math.round(15 * lifeMult)),
      })),
    }));
    const msg = skyEventText('med_check', s.character.name, s.lang, undefined, radStr);
    get().pushSkyMessage(msg.text, msg.mood, true, msg.voiceText);
    spaceAudio.playSkyChirp();
    get().showToast(s.lang === 'ar' ? `العيادة الطبية: الإشعاع ${radStr} • حالة ممتازة 🩺` : `Med Bay: Radiation ${radStr} • Nominal 🩺`);
  },

  inspectCargoBay: () => {
    const s = get();
    const repMult = s.personnelEffects.repairSpeedMult;
    const battGain = Math.round(10 * repMult);
    const crGain = Math.round(45 * repMult);
    set((state) => ({
      cmlLevel: Math.max(state.cmlLevel, 2) as 1 | 2 | 3 | 4,
      resources: {
        ...state.resources,
        battery: Math.min(100, state.resources.battery + battGain),
        credits: state.resources.credits + crGain,
      },
    }));
    const msg = skyEventText('cargo_prep', s.character.name, s.lang);
    get().pushSkyMessage(msg.text, msg.mood, true, msg.voiceText);
    spaceAudio.playSkyChirp();
    get().showToast(
      s.lang === 'ar'
        ? `عنبر الروفر جاهز • +${battGain}% طاقة +${crGain} CR 🛰️`
        : `Cargo & Rover Prepped • +${battGain}% PWR +${crGain} CR 🛰️`
    );
    get().saveProgress();
  },

  talkCommsOfficer: () => {
    const s = get();
    if (s.resources.dataStorage > 0) {
      get().transmitDataPacket();
      return;
    }
    const stationLabel = `${s.resources.commsStation} (${s.resources.commsSignal}%)`;
    const msg = skyEventText('comms_desk', s.character.name, s.lang, undefined, stationLabel);
    get().pushSkyMessage(msg.text, msg.mood, true, msg.voiceText);
    get().setTabletOpen(true, 'comms');
    spaceAudio.playSkyChirp();
  },

  boardShipAndLaunch: () => {
    const s = get();
    const fromPlanet = s.sceneEnv === 'planet' ? s.activePlanet : undefined;
    set({
      sceneEnv: 'spaceflight',
      pilotingRover: false,
      cameraMode: 'cockpit',
      tabletOpen: false,
      mapOpen: false,
      chapter: Math.max(s.chapter, 2),
    });
    engineBridge?.launchToSpace(fromPlanet);
    engineBridge?.setCameraMode('cockpit');
    const msg = skyEventText('launch', s.character.name, s.lang);
    get().pushSkyMessage(msg.text, msg.mood, true, msg.voiceText);
    spaceAudio.playBoost();
  },

  flyToPlanet: (planetId, autopilot = true) => {
    const s = get();
    const planet = PLANETS.find((p) => p.id === planetId);
    if (!planet) return;
    if (s.sceneEnv !== 'spaceflight') {
      set({ sceneEnv: 'spaceflight', pilotingRover: false, cameraMode: 'cockpit' });
      engineBridge?.launchToSpace(s.activePlanet);
      engineBridge?.setCameraMode('cockpit');
    }
    const pair = buildEngPairFromState(s, { planetId });
    set({
      tabletOpen: false,
      mapOpen: false,
      activePlanet: planetId,
      tradeOffReport: pair.tradeOffReport,
      digitalTwinState: pair.digitalTwinState,
    });
    engineBridge?.setDigitalTwinState(pair.digitalTwinState);
    engineBridge?.setTargetPlanet(planetId, autopilot);

    const nLocal = getDisplayCommander(s.character.name, s.lang);
    const nEn = getEnglishCommander(s.character.name);
    const voiceText = `Course locked to ${planet.name.en}, ${nEn}. Engaging autopilot flight vector.`;
    const text =
      s.lang === 'ar'
        ? `تم تحديد المسار نحو ${planet.name.ar} يا ${nLocal}! الطيار الآلي يقود المركبة الآن.`
        : voiceText;
    get().pushSkyMessage(text, 'scanning', true, voiceText);
  },

  setAutopilot: (active) => {
    engineBridge?.setAutopilot(active);
  },

  landOnPlanet: (planetId) => {
    const s = get();
    const planet = PLANETS.find((p) => p.id === planetId) || PLANETS[0];
    const discovered = s.discoveredPlanets.includes(planetId)
      ? s.discoveredPlanets
      : [...s.discoveredPlanets, planetId];

    const pair = buildEngPairFromState(s, { planetId });
    set({
      sceneEnv: 'planet',
      activePlanet: planetId,
      discoveredPlanets: discovered,
      pilotingRover: false,
      cameraMode: 'chase',
      tabletOpen: false,
      mapOpen: false,
      tradeOffReport: pair.tradeOffReport,
      digitalTwinState: pair.digitalTwinState,
      chapter:
        planetId === 'mars' || planetId === 'obsidian'
          ? Math.max(s.chapter, 4)
          : Math.max(s.chapter, 2),
    });
    engineBridge?.setDigitalTwinState(pair.digitalTwinState);
    engineBridge?.landOnPlanet(planetId);
    const msg = skyEventText('land_planet', s.character.name, s.lang, planet);
    get().pushSkyMessage(msg.text, msg.mood, true, msg.voiceText);
    spaceAudio.playPlanetFanfare();
    get().saveProgress();
  },

  toggleRover: () => {
    if (get().sceneEnv === 'planet') {
      engineBridge?.toggleRover();
    }
  },

  fireOrScan: () => {
    engineBridge?.fireOrScan();
  },

  triggerBarrelRoll: () => {
    engineBridge?.triggerBarrelRoll();
  },

  cycleWeather: () => {
    engineBridge?.cycleWeather();
  },

  setWeather: (weather) => {
    engineBridge?.setWeather(weather);
  },

  setCameraMode: (mode) => {
    set({ cameraMode: mode });
    engineBridge?.setCameraMode(mode);
  },

  updateInteriorTelemetry: (interiorTelemetry) => set({ interiorTelemetry }),
  updateSpaceTelemetry: (spaceTelemetry) => set({ spaceTelemetry }),
  updateSurfaceTelemetry: (surfaceTelemetry) => set({ surfaceTelemetry }),

  onOrbitArrived: (planetId) => {
    const s = get();
    const planet = PLANETS.find((p) => p.id === planetId);
    if (!planet) return;
    const isNew = !s.discoveredPlanets.includes(planetId);
    const nextDiscovered = isNew ? [...s.discoveredPlanets, planetId] : s.discoveredPlanets;
    const sciMult = s.personnelEffects.scienceRateMult;

    const newWorldBudget = isNew ? 15 : 0;
    set((state) => ({
      activePlanet: planetId,
      discoveredPlanets: nextDiscovered,
      chapter: nextDiscovered.length >= 3 ? Math.max(state.chapter, 3) : state.chapter,
      unlockedBudgetBonusM: state.unlockedBudgetBonusM + newWorldBudget,
      resources: {
        ...state.resources,
        credits: state.resources.credits + (isNew ? Math.round(planet.rewardCredits * sciMult) : 0),
        budget: state.resources.budget + newWorldBudget,
        dataCollected: state.resources.dataCollected + (isNew ? Math.round(35 * sciMult) : 0),
      },
    }));

    const msg = skyEventText('arrive_orbit', s.character.name, s.lang, planet);
    get().pushSkyMessage(msg.text, msg.mood, true, msg.voiceText);
    spaceAudio.playPlanetFanfare();
    get().saveProgress();
  },

  onWeatherChanged: (weather) => {
    const s = get();
    set({ weather });
    const eventMap: Record<SpaceWeather, Parameters<typeof skyEventText>[0]> = {
      clear: 'weather_clear',
      solar_flare: 'weather_solar_flare',
      asteroid_squall: 'weather_asteroid_squall',
      ion_storm: 'weather_ion_storm',
    };
    const msg = skyEventText(eventMap[weather], s.character.name, s.lang);
    get().pushSkyMessage(msg.text, msg.mood, true, msg.voiceText);
    spaceAudio.playWeatherAlert(weather === 'clear' ? 'calm' : 'storm');
  },

  onRingPassed: () => {
    const s = get();
    set((state) => ({
      ringsPassed: state.ringsPassed + 1,
      resources: {
        ...state.resources,
        battery: Math.min(100, state.resources.battery + 8),
        credits: state.resources.credits + 40,
      },
    }));
    const msg = skyEventText('ring', s.character.name, s.lang);
    get().pushSkyMessage(msg.text, msg.mood, false, msg.voiceText);
    spaceAudio.playRingPass();
  },

  onAsteroidMined: () => {
    const s = get();
    set((state) => ({
      asteroidsMined: state.asteroidsMined + 1,
      resources: {
        ...state.resources,
        credits: state.resources.credits + 45,
        dataCollected: state.resources.dataCollected + 10,
      },
    }));
    spaceAudio.playExplosion();
    if (get().asteroidsMined % 3 === 1) {
      const msg = skyEventText('asteroid_mined', s.character.name, s.lang);
      get().pushSkyMessage(msg.text, msg.mood, false, msg.voiceText);
    }
  },

  onAsteroidHit: () => {
    const s = get();
    spaceAudio.playExplosion();
    const msg = skyEventText('asteroid_hit', s.character.name, s.lang);
    get().pushSkyMessage(msg.text, msg.mood, true, msg.voiceText);
  },

  onBarrelRollPerformed: () => {
    const s = get();
    set((state) => ({ barrelRolls: state.barrelRolls + 1 }));
    spaceAudio.playBoost();
    if (get().barrelRolls % 2 === 1) {
      const msg = skyEventText('barrel_roll', s.character.name, s.lang);
      get().pushSkyMessage(msg.text, msg.mood, false, msg.voiceText);
    }
  },

  onRoverToggled: (inRover) => {
    const s = get();
    set({ pilotingRover: inRover });
    spaceAudio.playRoverLatch(inRover);
    const msg = skyEventText(inRover ? 'rover_enter' : 'rover_exit', s.character.name, s.lang);
    get().pushSkyMessage(msg.text, msg.mood, true, msg.voiceText);
  },

  onSampleCollected: (sampleId, planetId) => {
    const s = get();
    if (s.collectedSampleIds.includes(sampleId)) return;
    const planet = PLANETS.find((p) => p.id === planetId);
    const sciMult = s.personnelEffects.scienceRateMult;
    const dataGain = Math.round(30 * sciMult);
    const creditGain = Math.round(65 * sciMult);
    set((state) => ({
      collectedSampleIds: [...state.collectedSampleIds, sampleId],
      resources: {
        ...state.resources,
        dataStorage: Math.min(state.resources.maxStorage, state.resources.dataStorage + dataGain),
        dataCollected: state.resources.dataCollected + dataGain,
        credits: state.resources.credits + creditGain,
      },
    }));
    const msg = skyEventText('sample', s.character.name, s.lang, planet);
    get().pushSkyMessage(msg.text, msg.mood, true, msg.voiceText);
    spaceAudio.playRingPass();
    get().saveProgress();
  },

  onCraterDiscovered: (craterId) => {
    const s = get();
    if (s.discoveredCraterIds.includes(craterId)) return;
    const sciMult = s.personnelEffects.scienceRateMult;
    const dataGain = Math.round(40 * sciMult);
    const creditGain = Math.round(80 * sciMult);
    set((state) => ({
      discoveredCraterIds: [...state.discoveredCraterIds, craterId],
      resources: {
        ...state.resources,
        dataStorage: Math.min(state.resources.maxStorage, state.resources.dataStorage + dataGain),
        dataCollected: state.resources.dataCollected + dataGain,
        credits: state.resources.credits + creditGain,
      },
    }));
    const msg = skyEventText('crater', s.character.name, s.lang);
    get().pushSkyMessage(msg.text, msg.mood, true, msg.voiceText);
    spaceAudio.playPlanetFanfare();
    get().saveProgress();
  },

  onScienceSiteCompleted: (siteId, dataMb) => {
    const s = get();
    if (s.completedScienceSiteIds.includes(siteId)) return;
    const sciMult = s.personnelEffects.scienceRateMult;
    const scaledMb = Math.round(dataMb * sciMult);
    const creditGain = Math.round(110 * sciMult);
    set((state) => ({
      completedScienceSiteIds: [...state.completedScienceSiteIds, siteId],
      resources: {
        ...state.resources,
        dataStorage: Math.min(state.resources.maxStorage, state.resources.dataStorage + scaledMb),
        dataCollected: state.resources.dataCollected + scaledMb,
        credits: state.resources.credits + creditGain,
      },
    }));
    const msg = skyEventText('science', s.character.name, s.lang);
    get().pushSkyMessage(msg.text, msg.mood, true, msg.voiceText);
    spaceAudio.playPlanetFanfare();
    get().saveProgress();
  },

  onMonolithInspected: () => {
    const s = get();
    if (s.monolithInspected) return;
    set({
      monolithInspected: true,
      chapter: 5,
      activeChoice: {
        id: 'final_signal_choice',
        title: { ar: 'لغز إشارة 2089 الكونية', en: 'The 2089 Harmonic Signal Decision' },
        prompt: {
          ar: `القائد ${getDisplayCommander(s.character.name, 'ar')}، التقطت المسلّة ترددات الحضارة القديمة بالكامل. كيف ستتصرف بهذه البيانات التاريخية؟`,
          en: `Commander ${getEnglishCommander(s.character.name)}, the Monolith has finished resonating with the 2089 harmonic array. How should NOVA broadcast this discovery?`,
        },
        options: [
          {
            id: 'open_beacon',
            label: { ar: 'بث مفتوح للأرض وللمجتمع العلمي', en: 'Open DSN Broadcast to All Humanity' },
            description: {
              ar: 'شارك إحداثيات المسلّة والترددات فوراً عبر شبكة الفضاء العميق.',
              en: 'Beam raw harmonic coordinates publicly across every Deep Space station.',
            },
            effectSummary: { ar: 'نهاية الاكتشاف المفتوح +500 رصيد', en: 'Open Horizon Ending +500 CR' },
          },
          {
            id: 'harness_core',
            label: { ar: 'توجيه طاقة المسلّة لتطوير محركات نوفا', en: 'Channel Signal Into NOVA Warp Core' },
            description: {
              ar: 'استثمر التردد في دفع كمومي يفتح طرق السفر النجمي الأسرع.',
              en: 'Synthesize the frequency to unlock next-generation interstellar propulsion.',
            },
            effectSummary: { ar: 'نهاية طليعة النجوم +500 رصيد', en: 'Starlight Vanguard Ending +500 CR' },
          },
          {
            id: 'continue_roam',
            label: { ar: 'حفظ الشفرة ومواصلة استكشاف الكواكب', en: 'Archive Code & Continue Free Flight' },
            description: {
              ar: 'احتفظ بالاكتشاف واستمر في الطيران الحر بين العوالم الستة.',
              en: 'Log the anomaly and keep flying freely between all 6 worlds.',
            },
            effectSummary: { ar: 'استمرار الطيران الحر', en: 'Continue Sandbox Expedition' },
          },
        ],
      },
    });
    const msg = skyEventText('monolith', s.character.name, s.lang);
    get().pushSkyMessage(msg.text, msg.mood, true, msg.voiceText);
    spaceAudio.playPlanetFanfare();
  },

  onCreatureScanned: (creatureId, speciesName) => {
    const s = get();
    if (s.scannedCreatureIds.includes(creatureId)) return;
    const sciMult = s.personnelEffects.scienceRateMult;
    const dataGain = Math.round(45 * sciMult);
    const creditGain = Math.round(85 * sciMult);
    set((state) => ({
      scannedCreatureIds: [...state.scannedCreatureIds, creatureId],
      resources: {
        ...state.resources,
        dataStorage: Math.min(state.resources.maxStorage, state.resources.dataStorage + dataGain),
        dataCollected: state.resources.dataCollected + dataGain,
        credits: state.resources.credits + creditGain,
      },
    }));
    const nLocal = getDisplayCommander(s.character.name, s.lang);
    const nEn = getEnglishCommander(s.character.name);
    const voiceText = `Bio-scan complete on ${speciesName}, ${nEn}. Telemetry archived (+${dataGain} MB, +${creditGain} credits).`;
    const text =
      s.lang === 'ar'
        ? `تم مسح الكائن الفضائي «${speciesName}» يا ${nLocal}! (+${dataGain}MB • +${creditGain} CR)`
        : voiceText;
    get().pushSkyMessage(text, 'scanning', true, voiceText);
    get().showToast(
      s.lang === 'ar' ? `مسح بيولوجي: ${speciesName} +${creditGain} CR` : `Bio-Scan: ${speciesName} +${creditGain} CR`
    );
    spaceAudio.playPlanetFanfare();
    get().saveProgress();
  },

  onPickupCollected: (pickupId, pickupType) => {
    const s = get();
    if (s.collectedSampleIds.includes(pickupId)) return;
    set((state) => ({
      collectedSampleIds: [...state.collectedSampleIds, pickupId],
      resources: {
        ...state.resources,
        suitO2: pickupType === 'o2' ? Math.min(100, state.resources.suitO2 + 35) : state.resources.suitO2,
        suitCoolant:
          pickupType === 'o2'
            ? Math.min(100, (state.resources.suitCoolant ?? 100) + 20)
            : state.resources.suitCoolant ?? 100,
        battery:
          pickupType === 'energy' ? Math.min(100, state.resources.battery + 30) : state.resources.battery,
        suitHealth:
          pickupType === 'energy'
            ? Math.min(100, (state.resources.suitHealth ?? 100) + 15)
            : state.resources.suitHealth ?? 100,
        credits: state.resources.credits + 25,
      },
    }));
    spaceAudio.playRingPass();
    get().showToast(
      s.lang === 'ar'
        ? pickupType === 'o2'
          ? 'كبسولة أكسجين +35% O2 و +20% تبريد ✓'
          : 'خلية طاقة شمسية +30% PWR و +15% صحة ✓'
        : pickupType === 'o2'
          ? 'O2 Canister Collected (+35% O2, +20% Coolant)'
          : 'Energy Cell Collected (+30% PWR, +15% Suit Health)'
    );
    get().saveProgress();
  },

  onAlienDisturbed: (speciesNameEn, speciesNameAr) => {
    const s = get();
    const label = s.lang === 'ar' ? speciesNameAr : speciesNameEn;
    spaceAudio.playWeatherAlert('storm');
    get().showToast(
      s.lang === 'ar'
        ? `⚠ أزعجت «${label}»! ابتعد أو عُد للمركبة فوراً!`
        : `⚠ Disturbed ${label}! Evade or retreat to Spacecraft Pad!`
    );
  },

  onAlienAttack: (speciesNameEn, speciesNameAr, inRover) => {
    const s = get();
    if (s.screen !== 'playing') return;
    const hpLoss = inRover ? 9 : 18;
    const o2Loss = inRover ? 6 : 14;
    const pwrLoss = inRover ? 5 : 10;
    const coolLoss = inRover ? 6 : 14;

    const nextHealth = Math.max(0, Math.round((s.resources.suitHealth ?? 100) - hpLoss));
    const nextO2 = Math.max(0, Math.round(s.resources.suitO2 - o2Loss));
    const nextBattery = Math.max(0, Math.round(s.resources.battery - pwrLoss));
    const nextCoolant = Math.max(0, Math.round((s.resources.suitCoolant ?? 100) - coolLoss));
    const nextCo2 = Math.min(6.0, Number((s.astronautBio.co2MmHg + (inRover ? 0.3 : 0.75)).toFixed(2)));
    const nextBpm = Math.min(168, Math.round(s.astronautBio.heartRateBpm + (inRover ? 14 : 26)));

    set({
      lastDamageAt: Date.now(),
      resources: {
        ...s.resources,
        suitHealth: nextHealth,
        suitO2: nextO2,
        battery: nextBattery,
        suitCoolant: nextCoolant,
      },
      astronautBio: {
        ...s.astronautBio,
        co2MmHg: nextCo2,
        heartRateBpm: nextBpm,
        stressLevel: nextHealth < 35 || nextO2 < 30 ? 'CRITICAL' : 'HIGH',
      },
    });

    spaceAudio.playExplosion();
    spaceAudio.playWeatherAlert('storm');

    const label = s.lang === 'ar' ? speciesNameAr : speciesNameEn;
    get().showToast(
      s.lang === 'ar'
        ? `💥 هاجمك «${label}»! (-${hpLoss}% صحة، -${o2Loss}% O2، -${coolLoss}% تبريد) عُد للمركبة!`
        : `💥 Attacked by ${label}! (-${hpLoss}% Suit HP, -${o2Loss}% O2, -${coolLoss}% Coolant) Return to Spacecraft!`
    );

    if (nextO2 <= 0 || nextHealth <= 0) {
      get().finishExpedition(false, {
        ar:
          nextO2 <= 0
            ? `نفد الأكسجين 0% بعد تمزق البدلة إثر هجوم «${speciesNameAr}» قبل العودة للمركبة.`
            : `انهارت صحة البدلة 0% بسبب هجمات «${speciesNameAr}» المتكررة على سطح الكوكب.`,
        en:
          nextO2 <= 0
            ? `Suit Oxygen depleted to 0% from suit breach caused by ${speciesNameEn} before reaching the spacecraft.`
            : `Suit Integrity collapsed to 0% following repeated hostile attacks by ${speciesNameEn}.`,
      });
    }
  },

  onSpacecraftRefuel: () => {
    const s = get();
    set((state) => ({
      resources: {
        ...state.resources,
        suitO2: 100,
        battery: 100,
        suitHealth: 100,
        suitCoolant: 100,
      },
      astronautBio: {
        ...state.astronautBio,
        co2MmHg: 1.0,
        suitTempC: 21.5,
        suitPressureKpa: 29.6,
        heartRateBpm: 74,
        stressLevel: 'CALM',
      },
    }));
    spaceAudio.playRingPass();
    get().showToast(
      s.lang === 'ar'
        ? '⛽ تم إعادة تزويد الأكسجين والصحة والطاقة والتبريد من المركبة 100% ✓'
        : '⛽ Spacecraft Refuel Complete: O2, Suit Health, Power & Coolant 100% ✓'
    );
    const nEn = getEnglishCommander(s.character.name);
    const voice = `Spacecraft umbilical refuel complete, ${nEn}. Oxygen, coolant, battery, and suit seal are back at 100 percent.`;
    get().pushSkyMessage(
      s.lang === 'ar'
        ? 'تمت إعادة تعبئة الأكسجين والطاقة والتبريد وصحة البدلة 100% من المركبة الفضائية!'
        : voice,
      'happy',
      true,
      voice
    );
    get().saveProgress();
  },

  respawnAtSpacecraft: () => {
    const s = get();
    set({
      screen: 'playing',
      sceneEnv: 'interior',
      pilotingRover: false,
      cameraMode: 'first-person',
      missionOutcome: null,
      lastDamageAt: 0,
      resources: {
        ...s.resources,
        suitO2: 100,
        battery: 100,
        suitHealth: 100,
        suitCoolant: 100,
      },
      astronautBio: {
        ...DEFAULT_ASTRONAUT_BIO,
      },
    });
    engineBridge?.enterInteriorBridge();
    spaceAudio.playRingPass();
    get().saveProgress();
  },

  setOutpostMenuOpen: (outpostMenuOpen) => set({ outpostMenuOpen }),

  buildSurfaceStructure: (kind) => {
    const s = get();
    if (s.sceneEnv !== 'planet') {
      get().showToast(
        s.lang === 'ar' ? 'يجب الهبوط على سطح كوكب أولاً لبناء قاعدة.' : 'Land on a planet surface first to build an outpost.'
      );
      return;
    }
    const costMap: Record<SurfaceBuildingKind, number> = {
      habitat: 120,
      solar_relay: 90,
      science_beacon: 110,
    };
    const cost = costMap[kind];
    if (s.resources.credits < cost) {
      get().showToast(
        s.lang === 'ar' ? `رصيد غير كافٍ (المطلوب ${cost} CR)` : `Insufficient credits (${cost} CR required)`
      );
      return;
    }
    const rec = engineBridge?.buildSurfaceStructure(kind);
    if (!rec) return;

    const labelMap: Record<SurfaceBuildingKind, { ar: string; en: string }> = {
      habitat: { ar: 'قبة سكن وأكسجين', en: 'Habitat O2 Dome' },
      solar_relay: { ar: 'محطة طاقة شمسية', en: 'Solar Power Relay' },
      science_beacon: { ar: 'منارة أبحاث علمية', en: 'Science Telemetry Beacon' },
    };

    set((state) => ({
      surfaceBuildings: [...state.surfaceBuildings, rec],
      resources: {
        ...state.resources,
        credits: Math.max(0, state.resources.credits - cost),
      },
    }));
    spaceAudio.playRingPass();
    get().showToast(
      s.lang === 'ar' ? `تم بناء ${labelMap[kind].ar} ✓` : `Constructed ${labelMap[kind].en} ✓`
    );
    const nEn = getEnglishCommander(s.character.name);
    const voiceText = `${labelMap[kind].en} deployed on surface, ${nEn}. Outpost telemetry online.`;
    get().pushSkyMessage(
      s.lang === 'ar' ? `تم نشر ${labelMap[kind].ar} على السطح بنجاح!` : voiceText,
      'happy',
      true,
      voiceText
    );
    get().saveProgress();
  },

  transmitDataPacket: () => {
    const s = get();
    if (s.resources.dataStorage <= 0) {
      get().showToast(s.lang === 'ar' ? 'لا توجد بيانات مخزنة للبث حالياً.' : 'No buffered data to transmit.');
      return;
    }
    const commsMult = s.personnelEffects.commsRateMult;
    const packet = Math.min(s.resources.dataStorage, Math.round(120 * commsMult));
    set((state) => ({
      resources: {
        ...state.resources,
        dataStorage: Math.max(0, state.resources.dataStorage - packet),
        dataTransmitted: state.resources.dataTransmitted + packet,
        credits: state.resources.credits + Math.round(packet * 1.4 * commsMult),
        battery: Math.max(15, state.resources.battery - 4),
      },
    }));
    const msg = skyEventText('transmit', s.character.name, s.lang);
    get().pushSkyMessage(msg.text, msg.mood, true, msg.voiceText);
    spaceAudio.playRingPass();
    get().saveProgress();
  },

  cycleCommsStation: () => {
    const order: Array<{ station: ResourcesState['commsStation']; id: string }> = [
      { station: 'Goldstone', id: 'dsn_goldstone' },
      { station: 'Madrid', id: 'dsn_madrid' },
      { station: 'Canberra', id: 'dsn_canberra' },
    ];
    const s = get();
    const idx = order.findIndex((o) => o.station === s.resources.commsStation);
    const next = order[(idx + 1) % order.length];
    get().setActiveGroundStationId(next.id);
  },

  setActiveGroundStationId: (stationId) => {
    const s = get();
    const gs = GROUND_STATIONS.find((g) => g.id === stationId) || GROUND_STATIONS[0];
    const mappedLabel: ResourcesState['commsStation'] =
      gs.id === 'dsn_madrid'
        ? 'Madrid'
        : gs.id === 'dsn_canberra'
          ? 'Canberra'
          : 'Goldstone';
    const baseSig =
      gs.weatherStatus === 'rain_fade'
        ? 64
        : gs.dishMeters >= 70
          ? 96
          : 82;
    const hfDelta = s.analysisFidelityMode === 'high_fidelity' ? -6 : 0;
    const nextSig = Math.max(20, Math.min(100, Math.round(baseSig * Math.min(1.05, s.personnelEffects.commsRateMult) + hfDelta)));
    const pair = buildEngPairFromState(s, { stationId: gs.id });
    set({
      activeGroundStationId: gs.id,
      lastCommWindowHrs: gs.baseWindowHoursDay,
      tradeOffReport: pair.tradeOffReport,
      digitalTwinState: pair.digitalTwinState,
      resources: {
        ...s.resources,
        commsStation: mappedLabel,
        commsSignal: nextSig,
      },
      toastText:
        s.lang === 'ar'
          ? `تم توجيه الهوائي إلى محطة ${gs.name.ar} (إشارة ${nextSig}%)`
          : `DSN Antenna locked to ${gs.name.en} (Signal ${nextSig}%)`,
    });
    engineBridge?.setDigitalTwinState(pair.digitalTwinState);
    spaceAudio.playSkyChirp();
    get().saveProgress();
  },

  setCommsCompressionMode: (mode) => {
    const s = get();
    const pair = buildEngPairFromState(s, { compressionMode: mode });
    set({
      commsCompressionMode: mode,
      tradeOffReport: pair.tradeOffReport,
      digitalTwinState: pair.digitalTwinState,
      toastText:
        s.lang === 'ar'
          ? `تم ضبط ضغط البيانات في 2D و 3D: ${mode}`
          : `2D & 3D Data Compression set to ${mode}`,
    });
    engineBridge?.setDigitalTwinState(pair.digitalTwinState);
    spaceAudio.playSkyChirp();
    get().saveProgress();
  },

  setAnalysisFidelityMode: (mode) => {
    const s = get();
    const pair = buildEngPairFromState(s, { fidelityMode: mode });
    set({
      analysisFidelityMode: mode,
      tradeOffReport: pair.tradeOffReport,
      digitalTwinState: pair.digitalTwinState,
      toastText:
        mode === 'high_fidelity'
          ? s.lang === 'ar'
            ? 'تم تفعيل وضع التحليل عالي الدقة (High-Fidelity Physics) في 2D و 3D'
            : 'High-Fidelity Mission Analysis enabled across 2D & 3D'
          : s.lang === 'ar'
            ? 'تم التبديل لوضع التقريب الهندسي السريع (Engineering Approximation)'
            : 'Engineering Approximation Mode enabled across 2D & 3D',
    });
    engineBridge?.setDigitalTwinState(pair.digitalTwinState);
    spaceAudio.playSkyChirp();
    get().saveProgress();
  },

  recordGroundPassDownlink: (deliveredMb, meta) => {
    const s = get();
    const gs = GROUND_STATIONS.find((g) => g.id === meta.stationId) || GROUND_STATIONS[0];
    const mappedLabel: ResourcesState['commsStation'] =
      gs.id === 'dsn_madrid'
        ? 'Madrid'
        : gs.id === 'dsn_canberra'
          ? 'Canberra'
          : 'Goldstone';
    const earnedCr = Math.max(10, Math.round(deliveredMb * 0.4));
    set({
      activeGroundStationId: gs.id,
      lastDownlinkKbps: meta.dataRateKbps,
      lastCommWindowHrs: meta.windowHrs,
      resources: {
        ...s.resources,
        commsStation: mappedLabel,
        commsSignal: meta.signalPct,
        dataStorage: Math.max(0, s.resources.dataStorage - deliveredMb),
        dataTransmitted: s.resources.dataTransmitted + deliveredMb,
        credits: s.resources.credits + earnedCr,
      },
    });
    spaceAudio.playRingPass();
    get().saveProgress();
  },

  resolveEmergency: () => {
    const s = get();
    if (!s.emergency) return;
    const repairMult = s.personnelEffects.repairSpeedMult;
    const adjustedCost = Math.round(s.emergency.costCredits / Math.max(0.8, repairMult));
    set({
      emergency: null,
      resources: {
        ...s.resources,
        credits: Math.max(0, s.resources.credits - adjustedCost),
        battery: Math.min(100, s.resources.battery + Math.round(20 * repairMult)),
        suitO2: Math.min(100, s.resources.suitO2 + Math.round(25 * s.personnelEffects.lifeSupportRateMult)),
      },
    });
    const nLocal = getDisplayCommander(s.character.name, s.lang);
    const nEn = getEnglishCommander(s.character.name);
    const voiceText = `Well handled, ${nEn}. Emergency cleared and ship systems stabilized.`;
    get().pushSkyMessage(
      s.lang === 'ar'
        ? `أحسنت يا ${nLocal}! تمت معالجة الطارئ واستقرت أنظمة المركبة.`
        : voiceText,
      'happy',
      true,
      voiceText
    );
    spaceAudio.playRingPass();
  },

  resolveChoiceOption: (optionId) => {
    if (optionId === 'continue_roam') {
      set((state) => ({
        activeChoice: null,
        resources: { ...state.resources, credits: state.resources.credits + 250 },
      }));
      return;
    }
    set({ activeChoice: null });
    get().finishExpedition(true);
  },

  finishExpedition: (success, failureReason) => {
    const s = get();
    const score =
      s.survivalScore +
      s.discoveredPlanets.length * 250 +
      s.collectedSampleIds.length * 90 +
      s.completedScienceSiteIds.length * 140 +
      Math.round(s.resources.dataTransmitted * 2) +
      s.ringsPassed * 60 +
      s.asteroidsMined * 40 +
      (s.monolithInspected ? 450 : 0);

    const grade: MissionOutcome['grade'] = !success
      ? 'F'
      : score >= 2800
        ? 'S'
        : score >= 1700
          ? 'A'
          : score >= 900
            ? 'B'
            : 'C';

    const nLocal = getDisplayCommander(s.character.name, s.lang);
    const defaultReason: Record<Language, string> = failureReason || {
      ar: `تجاوزت السفينة حد الإخفاقات الحرجة (${s.survivalFailures}/3) أو انهارت سلامة الهيكل (${Math.round(s.hullIntegrity)}%).`,
      en: `Spacecraft suffered critical failures (${s.survivalFailures}/3 strikes) or Hull Integrity collapse (${Math.round(s.hullIntegrity)}%).`,
    };

    const failReport = !success
      ? generateFailureInvestigationReport({
          reason: defaultReason,
          planetId: s.activePlanet,
          loadout: s.advancedLoadout,
          tradeOff: s.tradeOffReport,
          resources: s.resources,
          fuelPct: s.fuelPct,
          hullIntegrity: s.hullIntegrity,
          internalTempC: s.internalTempC,
          timelineLog: s.missionTimelineLog,
        })
      : null;

    const perfReport = buildMissionPerformanceReport({
      versionLabel: `v${s.performanceHistory.length + 1}.0 (${s.shuttleCustomName})`,
      planetId: s.activePlanet,
      objective: s.missionPlan.objective,
      loadout: s.advancedLoadout,
      tradeOff: s.tradeOffReport,
      resources: s.resources,
      fuelPct: s.fuelPct,
      hullIntegrity: s.hullIntegrity,
      score,
      grade,
      incidents: s.missionTimelineLog
        .filter((l) => l.source === 'event' || l.source === 'autonomous')
        .slice(-5)
        .map((l) => l.summary[s.lang]),
    });

    set({
      screen: 'results',
      mode2dOpen: false,
      mccOpen: false,
      systemsLabOpen: false,
      whatIfOpen: false,
      reportOpen: false,
      storyIntroOpen: false,
      failureInvestigationReport: failReport,
      performanceHistory: [perfReport, ...s.performanceHistory].slice(0, 12),
      missionOutcome: {
        success,
        score,
        grade,
        failureReason,
        endingTitle: success
          ? {
              ar: `انتصار البقاء للقائد ${nLocal}: نجاة نوفا-7`,
              en: `Survival Victory: Commander ${nLocal} Saved NOVA-7`,
            }
          : {
              ar: `خسارة المهمة: تدمير أو عجز سفينة القائد ${nLocal}`,
              en: `Mission Lost: NOVA-7 Critical Failure (${nLocal})`,
            },
        summary: success
          ? {
              ar: `أنجزت ${s.completedSurvivalIds.length}/${SURVIVAL_MISSIONS.length} من مهام البقاء الهندسية، وزرت ${s.discoveredPlanets.length}/${PLANETS.length} عوالم وبثثت ${Math.round(s.resources.dataTransmitted)} MB عبر DSN.`,
              en: `Cleared ${s.completedSurvivalIds.length}/${SURVIVAL_MISSIONS.length} NASA & CSA survival missions, surveyed ${s.discoveredPlanets.length}/${PLANETS.length} worlds, and downlinked ${Math.round(s.resources.dataTransmitted)} MB via DSN.`,
            }
          : defaultReason,
      },
    });
    get().saveProgress();
  },

  setStoryIntroOpen: (storyIntroOpen) => {
    if (storyIntroOpen) engineBridge?.setMouseLocked(false);
    set({ storyIntroOpen });
  },

  setActiveSurvivalId: (activeSurvivalId) => set({ activeSurvivalId }),

  resolveSurvivalMission: (missionId, won, reasonText) => {
    const s = get();
    const m = SURVIVAL_MISSIONS.find((item) => item.id === missionId);
    if (!m) return;

    const sciMult = s.personnelEffects.scienceRateMult;
    const repMult = s.personnelEffects.repairSpeedMult;
    const isHard = s.hardcoreChallengeMode || s.difficulty === 'Veteran';
    const challengeMult = isHard ? 1.5 : 1.0;

    if (won) {
      const nextCompleted = s.completedSurvivalIds.includes(missionId)
        ? s.completedSurvivalIds
        : [...s.completedSurvivalIds, missionId];
      const nextFailed = s.failedSurvivalIds.filter((id) => id !== missionId);
      const nextHull = Math.min(100, s.hullIntegrity + Math.round(m.hullRestore * repMult));
      const nextBattery = Math.min(100, s.resources.battery + 15);
      const nextO2 = Math.min(100, s.resources.suitO2 + 15);
      const addedCredits = Math.round(m.rewardCredits * sciMult * challengeMult);
      const addedBudgetM = Math.round((m.budgetRewardM ?? 25) * challengeMult);
      const addedData = Math.round(m.rewardDataMb * sciMult);
      const nextScore = s.survivalScore + Math.round((350 + s.survivalStreak * 75) * challengeMult);

      const remaining = SURVIVAL_MISSIONS.find((cand) => !nextCompleted.includes(cand.id));
      const nextCml = Math.min(4, Math.max(s.cmlLevel, nextCompleted.length >= 6 ? 4 : nextCompleted.length >= 3 ? 3 : 2)) as 1 | 2 | 3 | 4;

      set({
        hullIntegrity: nextHull,
        survivalStreak: s.survivalStreak + 1,
        survivalScore: nextScore,
        completedSurvivalIds: nextCompleted,
        failedSurvivalIds: nextFailed,
        activeSurvivalId: remaining ? remaining.id : missionId,
        cmlLevel: nextCml,
        unlockedBudgetBonusM: s.unlockedBudgetBonusM + addedBudgetM,
        resources: {
          ...s.resources,
          battery: nextBattery,
          suitO2: nextO2,
          credits: s.resources.credits + addedCredits,
          budget: s.resources.budget + addedBudgetM,
          dataStorage: Math.min(s.resources.maxStorage, s.resources.dataStorage + addedData),
          dataCollected: s.resources.dataCollected + addedData,
        },
        toastText:
          s.lang === 'ar'
            ? `✔ نجاح المهمة! +${addedCredits} CR و +$${addedBudgetM}M ميزانية وكالة`
            : `✔ Crisis Cleared! +${addedCredits} CR & +$${addedBudgetM}M Agency Budget`,
      });

      const nEn = getEnglishCommander(s.character.name);
      const voice = `Crisis resolved, ${nEn}! ${m.successSummary.en}`;
      get().pushSkyMessage(
        s.lang === 'ar'
          ? `✔ نجحت المهمة (+${addedCredits} CR / +$${addedBudgetM}M ميزانية): ${m.successSummary.ar}`
          : `${voice} (+${addedCredits} CR, +$${addedBudgetM}M Budget)`,
        'excited',
        true,
        voice
      );
      spaceAudio.playPlanetFanfare();
      get().saveProgress();

      if (nextCompleted.length >= SURVIVAL_MISSIONS.length) {
        setTimeout(() => {
          if (get().screen === 'playing') {
            get().finishExpedition(true);
          }
        }, 700);
      }
      return;
    }

    // LOSS / PENALTY PATH
    const nextHull = Math.max(0, Math.round(s.hullIntegrity - m.hullPenalty));
    const nextBattery = Math.max(0, Math.round(s.resources.battery - m.powerPenalty));
    const nextO2 =
      s.sceneEnv === 'planet'
        ? Math.max(0, Math.round(s.resources.suitO2 - m.o2Penalty))
        : s.resources.suitO2;
    const creditFine = isHard ? 75 : 45;
    const budgetCutM = Math.round((m.budgetRewardM ?? 25) * (isHard ? 0.85 : 0.6));
    const nextFailures = s.survivalFailures + 1;
    const nextFailed = s.failedSurvivalIds.includes(missionId)
      ? s.failedSurvivalIds
      : [...s.failedSurvivalIds, missionId];

    set({
      hullIntegrity: nextHull,
      survivalFailures: nextFailures,
      survivalStreak: 0,
      failedSurvivalIds: nextFailed,
      unlockedBudgetBonusM: Math.max(-120, s.unlockedBudgetBonusM - budgetCutM),
      resources: {
        ...s.resources,
        battery: nextBattery,
        suitO2: nextO2,
        credits: Math.max(0, s.resources.credits - creditFine),
        budget: Math.max(40, s.resources.budget - budgetCutM),
      },
      toastText:
        s.lang === 'ar'
          ? `✖ خسارة المهمة! -${creditFine} CR و -$${budgetCutM}M تقليص في ميزانية الوكالة`
          : `✖ Mission Failed! -${creditFine} CR & -$${budgetCutM}M Agency Budget Cut`,
    });

    const nEn = getEnglishCommander(s.character.name);
    const voice = `Warning ${nEn}! Hull damage and budget cuts sustained. ${m.failureSummary.en}`;
    get().pushSkyMessage(
      s.lang === 'ar'
        ? `✖ إخفاق: ${reasonText?.ar || m.failureSummary.ar} (-${m.hullPenalty}% هيكل / -${creditFine} CR / -$${budgetCutM}M ميزانية)`
        : `✖ Failure: ${reasonText?.en || m.failureSummary.en} (-${m.hullPenalty}% Hull / -${creditFine} CR / -$${budgetCutM}M Budget)`,
      'warning',
      true,
      voice
    );
    spaceAudio.playWeatherAlert('storm');
    get().saveProgress();

    if (nextHull <= 0 || nextO2 <= 0 || nextBattery <= 0 || nextFailures >= 3) {
      const failReason: Record<Language, string> =
        nextHull <= 0
          ? {
              ar: 'انهيار سلامة الهيكل إلى 0% نتيجة الأعطال المتكررة أثناء الطوارئ.',
              en: 'Hull Integrity collapsed to 0% following unmitigated spacecraft damage.',
            }
          : nextO2 <= 0
            ? {
                ar: 'نفاد أكسجين المقصورة 0% — فشل دعم الحياة.',
                en: 'Cabin Life Support O2 reached 0% — critical life support loss.',
              }
            : nextBattery <= 0
              ? {
                  ar: 'انهيار طاقة المفاعل 0% — انطفاء كامل للمركبة.',
                  en: 'Reactor Power depleted to 0% — total spacecraft blackout.',
                }
              : {
                  ar: 'تجاوزت الحد الأقصى للأخطاء الهندسية الحرجة (3 إخفاقات بقاء) — تم إحباط البعثة!',
                  en: 'Reached 3 critical engineering failures — NOVA-7 survival protocol aborted!',
                };
      get().finishExpedition(false, failReason);
    }
  },

  retrySurvivalCampaign: () => {
    const s = get();
    set({
      screen: 'playing',
      missionOutcome: null,
      hullIntegrity: 100,
      survivalFailures: 0,
      survivalStreak: 0,
      completedSurvivalIds: [],
      failedSurvivalIds: [],
      activeSurvivalId: SURVIVAL_MISSIONS[0].id,
      resources: {
        ...s.resources,
        battery: 96,
        suitO2: 100,
        suitHealth: 100,
        suitCoolant: 100,
      },
      mode2dOpen: true,
      mode2dTab: 'dashboard2d',
    });
    spaceAudio.playSkyChirp();
    get().saveProgress();
  },

  openSurvivalDashboard2d: () => {
    engineBridge?.setMouseLocked(false);
    set({
      storyIntroOpen: false,
      architectOpen: false,
      mode2dOpen: true,
      mode2dTab: 'dashboard2d',
      tabletOpen: false,
      mapOpen: false,
      guideOpen: false,
      telescopeLabOpen: false,
      dashboardOpen: false,
    });
    spaceAudio.playSkyChirp();
  },

  setArchitectOpen: (open) => {
    if (open) engineBridge?.setMouseLocked(false);
    set({
      architectOpen: open,
      ...(open
        ? {
            storyIntroOpen: false,
            mode2dOpen: false,
            tabletOpen: false,
            mapOpen: false,
            guideOpen: false,
            dashboardOpen: false,
          }
        : {}),
    });
    spaceAudio.playSkyChirp();
  },

  recordArchitectRun: (run) => {
    const s = get();
    const updated = [run, ...s.architectRuns]
      .sort((a, b) => b.score - a.score)
      .slice(0, 16);
    try {
      localStorage.setItem(ARCHITECT_RUNS_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }

    const isSandboxRun = run.mode === 'sandbox' || run.scenarioId === 'sandbox_free';
    const isHighStakesFail = run.scenarioId === 'neptune_flagship' || run.scenarioId === 'uranus_orbiter';
    const crDelta = !run.success
      ? isSandboxRun
        ? 0
        : isHighStakesFail
          ? -80
          : -50
      : isSandboxRun
        ? 110
        : run.grade === 'S'
          ? 480
          : run.grade === 'A'
            ? 360
            : 260;
    const budgetDeltaM = !run.success
      ? isSandboxRun
        ? 0
        : isHighStakesFail
          ? -30
          : -20
      : isSandboxRun
        ? 10
        : run.grade === 'S'
          ? 75
          : run.grade === 'A'
            ? 55
            : 40;

    set({
      architectRuns: updated,
      survivalScore: s.survivalScore + (run.success ? Math.round(run.score * 0.3) : 0),
      unlockedBudgetBonusM: Math.max(-120, s.unlockedBudgetBonusM + budgetDeltaM),
      resources: {
        ...s.resources,
        credits: Math.max(0, s.resources.credits + crDelta),
        budget: Math.max(40, s.resources.budget + budgetDeltaM),
        dataCollected: s.resources.dataCollected + (run.success ? 80 : 5),
      },
      toastText: run.success
        ? s.lang === 'ar'
          ? `نجاح المهمة (${run.grade})! +${crDelta} CR و +$${budgetDeltaM}M ميزانية وكالة أعلى`
          : `Mission Passed (Grade ${run.grade})! +${crDelta} CR & +$${budgetDeltaM}M Budget Unlocked`
        : isSandboxRun
          ? s.lang === 'ar'
            ? 'فشلت تجربة المختبر الحر — عدّل التصميم وحاول مجدداً!'
            : 'Sandbox experiment failed — refine your architecture & retry!'
          : s.lang === 'ar'
            ? `✖ خسارة المهمة! خصم ${Math.abs(crDelta)} CR و -$${Math.abs(budgetDeltaM)}M من ميزانية الوكالة`
            : `✖ Mission Failed! -${Math.abs(crDelta)} CR & -$${Math.abs(budgetDeltaM)}M Agency Budget Cut`,
    });
    if (run.success) spaceAudio.playPlanetFanfare();
    else spaceAudio.playWeatherAlert('storm');
    get().saveProgress();
  },

  deployArchitectBlueprintTo3D: (blueprint, startIn = 'spaceflight') => {
    const s = get();
    const mappedEngine =
      blueprint.launcherId === 'super_heavy' || blueprint.launcherId === 'heavy_lift'
        ? 'eng_fusion'
        : blueprint.launcherId === 'atlas_med'
          ? 'eng_vasimir'
          : 'eng_ion';
    const mappedSolar =
      blueprint.powerId === 'pwr_rtg'
        ? 'sol_rtg'
        : blueprint.powerId === 'pwr_mega_solar'
          ? 'sol_quantum'
          : 'sol_wings';
    const mappedHull =
      blueprint.busId === 'bus_shield'
        ? 'hull_graphene'
        : blueprint.busId === 'bus_std'
          ? 'hull_aegis'
          : 'hull_ti';
    const mappedComms = blueprint.commsId === 'comms_sband' ? 'com_uhf' : 'com_laser';
    const mappedSensor =
      blueprint.instrumentIds.includes('inst_radar') || blueprint.instrumentIds.includes('inst_laser')
        ? 'sen_tachyon'
        : blueprint.instrumentIds.includes('inst_ir')
          ? 'sen_spectro'
          : 'sen_lidar';

    const nextShipConfig: ShipConfig = {
      engineId: mappedEngine,
      solarId: mappedSolar,
      hullId: mappedHull,
      sensorId: mappedSensor,
      commsId: mappedComms,
      liveryId: s.shipConfig.liveryId,
    };
    const nextMetrics = computeShipMetrics(nextShipConfig);
    const nextDiscovered = s.discoveredPlanets.includes(blueprint.targetPlanetId)
      ? s.discoveredPlanets
      : [...s.discoveredPlanets, blueprint.targetPlanetId];
    const targetPlanet = PLANETS.find((p) => p.id === blueprint.targetPlanetId) || PLANETS[1];
    const commanderName =
      s.character.name.trim() || blueprint.teamName || (s.lang === 'ar' ? 'كابتن طارق' : 'Capt. Nova');

    const commsOk = blueprint.dataGenMbDay <= blueprint.commsCapMbDay;
    const powerOk = blueprint.netPowerW >= 0;
    const voiceText = `Blueprint deployed to 3D Flight Control, ${getEnglishCommander(commanderName)}. Target ${targetPlanet.name.en}, mass ${blueprint.totalMassKg} kilograms, net power ${blueprint.netPowerW} watts, downlink ${blueprint.commsCapMbDay} megabytes per day.`;
    const chatText =
      s.lang === 'ar'
        ? `تم إطلاق تصميم «${blueprint.scenarioTitle.ar}» إلى الفضاء 3D! الهدف: ${targetPlanet.name.ar} • صافي الطاقة ${blueprint.netPowerW >= 0 ? `+${blueprint.netPowerW}` : blueprint.netPowerW}W • البث ${blueprint.commsCapMbDay} MB/d.`
        : voiceText;

    const targetEnv: SceneEnv = startIn === 'mission-viz' ? 'mission-viz' : 'spaceflight';

    set({
      screen: 'playing',
      sceneEnv: targetEnv,
      cameraMode: targetEnv === 'spaceflight' ? 'cockpit' : s.cameraMode,
      pilotingRover: false,
      architectOpen: false,
      storyIntroOpen: false,
      character: { ...s.character, name: commanderName },
      shipConfig: nextShipConfig,
      shipMetrics: nextMetrics,
      activeBlueprint: blueprint,
      activePlanet: blueprint.targetPlanetId,
      missionVizTargetPlanet: blueprint.targetPlanetId,
      discoveredPlanets: nextDiscovered,
      cmlLevel: 4,
      hullIntegrity: Math.min(100, Math.max(75, blueprint.reliabilityPct)),
      resources: {
        ...s.resources,
        budget: Math.max(0, blueprint.maxBudgetM - blueprint.totalCostM),
        mass: blueprint.totalMassKg,
        powerGeneration: blueprint.powerGenW,
        powerConsumption: blueprint.powerDrawW,
        battery: powerOk ? 100 : 72,
        maxStorage: Math.max(240, blueprint.commsCapMbDay),
        commsSignal: commsOk ? 97 : 68,
        suitO2: 100,
        suitHealth: 100,
        suitCoolant: 100,
        credits: s.resources.credits + (blueprint.grade === 'S' ? 220 : 120),
      },
      toastText:
        s.lang === 'ar'
          ? `تم إطلاق مركبتك نحو ${targetPlanet.name.ar} (رتبة ${blueprint.grade})`
          : `Launched Custom Spacecraft toward ${targetPlanet.name.en} (Grade ${blueprint.grade})`,
    });

    get().pushSkyMessage(chatText, powerOk && commsOk ? 'excited' : 'warning', true, voiceText);
    setTimeout(() => {
      if (targetEnv === 'mission-viz') {
        engineBridge?.setMissionVizState(0.28, blueprint.targetPlanetId);
        engineBridge?.setTargetPlanet(blueprint.targetPlanetId, false);
      } else {
        engineBridge?.launchToSpace();
        engineBridge?.setCameraMode('cockpit');
        engineBridge?.setTargetPlanet(blueprint.targetPlanetId, true);
      }
    }, 80);
    if (targetEnv === 'spaceflight') spaceAudio.playBoost();
    else spaceAudio.playPlanetFanfare();
    get().saveProgress();
  },

  performAstronautAction: (action, value) => {
    const s = get();
    const bio = s.astronautBio;

    if (action === 'pace_breathing') {
      const nextBpm = Math.max(64, Math.round(bio.heartRateBpm - 18));
      const nextCo2 = Math.max(0.8, Number((bio.co2MmHg - 0.5).toFixed(1)));
      set({
        astronautBio: {
          ...bio,
          heartRateBpm: nextBpm,
          co2MmHg: nextCo2,
          stressLevel: nextBpm > 125 ? 'CRITICAL' : nextBpm > 105 ? 'HIGH' : nextBpm > 85 ? 'FOCUSED' : 'CALM',
        },
        toastText:
          s.lang === 'ar'
            ? 'تنفس إيقاعي 4-4-4: انخفض نبض رائد الفضاء واستقر التركيز.'
            : '4-4-4 Box Breathing: Heart rate steadied & stress lowered.',
      });
      spaceAudio.playSkyChirp();
      return;
    }

    if (action === 'purge_co2') {
      set({
        astronautBio: {
          ...bio,
          co2MmHg: 0.9,
          heartRateBpm: Math.max(68, Math.round(bio.heartRateBpm - 6)),
        },
        toastText:
          s.lang === 'ar'
            ? 'تم تطهير مرشح LiOH: هبط ثاني أكسيد الكربون إلى 0.9 mmHg.'
            : 'Metox / LiOH CO2 Scrubber purged cleanly (0.9 mmHg).',
      });
      spaceAudio.playSkyChirp();
      return;
    }

    if (action === 'prebreathe_o2') {
      set({
        astronautBio: {
          ...bio,
          preBreatheDone: true,
          suitPressureKpa: 29.6,
          co2MmHg: Math.max(0.8, Number((bio.co2MmHg - 0.4).toFixed(1))),
        },
        resources: {
          ...s.resources,
          suitO2: Math.min(100, s.resources.suitO2 + 12),
        },
        toastText:
          s.lang === 'ar'
            ? 'اكتمل التنفس المسبق بالأكسجين النقي (29.6 kPa) — آمن للسير الفضائي EVA!'
            : 'O2 Pre-Breathe & 29.6 kPa EMU pressure check verified for EVA!',
      });
      spaceAudio.playPlanetFanfare();
      return;
    }

    if (action === 'toggle_tether') {
      set({
        astronautBio: {
          ...bio,
          tetherLocked: !bio.tetherLocked,
        },
      });
      spaceAudio.playSkyChirp();
      return;
    }

    if (action === 'set_lcvg' && typeof value === 'number') {
      const clamped = Math.max(0, Math.min(100, value));
      set({
        astronautBio: {
          ...bio,
          lcvgCoolingPct: clamped,
        },
      });
      return;
    }

    if (action === 'set_temp_sim' && typeof value === 'number') {
      set({
        astronautBio: {
          ...bio,
          suitTempC: Number(value.toFixed(1)),
        },
      });
      return;
    }

    if (action === 'complete_eva_repair') {
      const nextRepairs = bio.evaRepairsCompleted + 1;
      const nextHull = Math.min(100, s.hullIntegrity + 15);
      set({
        hullIntegrity: nextHull,
        survivalScore: s.survivalScore + 180,
        astronautBio: {
          ...bio,
          evaRepairsCompleted: nextRepairs,
          heartRateBpm: Math.max(76, Math.round(bio.heartRateBpm - 8)),
        },
        resources: {
          ...s.resources,
          credits: s.resources.credits + 120,
        },
        toastText:
          s.lang === 'ar'
            ? 'تم إصلاح نقطة EVA الخارجية في انعدام الجاذبية (+15% هيكل، +120 CR)!'
            : 'Microgravity EVA hull repair complete! (+15% Hull Integrity, +120 CR)',
      });
      spaceAudio.playPlanetFanfare();
    }
  },

  stepEvaExertion: (dt, solarZone, thrusting) => {
    const s = get();
    const bio = s.astronautBio;
    // Target skin/suit temperature driven by Solar Sunlit (+58°C drift) vs Eclipse (-42°C drift) counteracted by LCVG cooling/heating loop
    const ambientDrive = solarZone === 'sunlit' ? 42 : -26;
    const lcvgBalance = (50 - bio.lcvgCoolingPct) * 0.48;
    const idealTemp = 21 + ambientDrive * 0.45 + lcvgBalance;
    const nextTemp = Number(
      (bio.suitTempC + (idealTemp - bio.suitTempC) * Math.min(1, dt * 0.85)).toFixed(1)
    );

    const co2Rise = (thrusting ? 0.34 : 0.11) * dt;
    const nextCo2 = Math.min(6.0, Number((bio.co2MmHg + co2Rise).toFixed(2)));
    const tempStress = Math.abs(nextTemp - 22) > 10 ? 18 : 0;
    const co2Stress = nextCo2 > 3.2 ? 22 : nextCo2 > 2.2 ? 9 : 0;
    const targetBpm = (thrusting ? 114 : 84) + tempStress + co2Stress + (!bio.preBreatheDone ? 12 : 0);
    const nextBpm = Math.max(
      62,
      Math.min(168, Math.round(bio.heartRateBpm + (targetBpm - bio.heartRateBpm) * Math.min(1, dt * 1.4)))
    );
    const stressLevel: AstronautBioState['stressLevel'] =
      nextBpm > 130 || nextCo2 > 4.0
        ? 'CRITICAL'
        : nextBpm > 108 || nextCo2 > 2.8
          ? 'HIGH'
          : nextBpm > 86
            ? 'FOCUSED'
            : 'CALM';

    set({
      astronautBio: {
        ...bio,
        heartRateBpm: nextBpm,
        co2MmHg: nextCo2,
        suitTempC: nextTemp,
        stressLevel,
      },
      resources: {
        ...s.resources,
        suitO2:
          s.sceneEnv === 'planet'
            ? Math.max(8, Number((s.resources.suitO2 - (thrusting ? 0.85 : 0.25) * dt).toFixed(2)))
            : s.resources.suitO2,
      },
    });
  },

  toggleMute: () => {
    const s = get();
    const next = !s.audioMuted;
    spaceAudio.setMuted(next);
    set({ audioMuted: next });
    persistAudioPrefs({
      audioMuted: next,
      ambientHumEnabled: s.ambientHumEnabled,
      roverAudioEnabled: s.roverAudioEnabled,
      speechEnabled: s.speechEnabled,
    });
  },

  toggleAmbientHum: () => {
    const s = get();
    const next = !s.ambientHumEnabled;
    spaceAudio.setAmbientHumEnabled(next);
    set({ ambientHumEnabled: next });
    persistAudioPrefs({
      audioMuted: s.audioMuted,
      ambientHumEnabled: next,
      roverAudioEnabled: s.roverAudioEnabled,
      speechEnabled: s.speechEnabled,
    });
  },

  toggleRoverAudio: () => {
    const s = get();
    const next = !s.roverAudioEnabled;
    spaceAudio.setRoverAudioEnabled(next);
    set({ roverAudioEnabled: next });
    persistAudioPrefs({
      audioMuted: s.audioMuted,
      ambientHumEnabled: s.ambientHumEnabled,
      roverAudioEnabled: next,
      speechEnabled: s.speechEnabled,
    });
  },

  toggleSpeech: () => {
    const s = get();
    const next = !s.speechEnabled;
    spaceAudio.setSpeechEnabled(next);
    set({ speechEnabled: next });
    persistAudioPrefs({
      audioMuted: s.audioMuted,
      ambientHumEnabled: s.ambientHumEnabled,
      roverAudioEnabled: s.roverAudioEnabled,
      speechEnabled: next,
    });
  },

  toggleShadows: () => set((s) => ({ shadowsEnabled: !s.shadowsEnabled })),

  updateSettings: (patch) => {
    const s = get();
    const next: GameSettings = { ...s.settings, ...patch };
    if (typeof patch.masterVolume === 'number') {
      spaceAudio.setMasterVolume(next.masterVolume);
    }
    persistSettings(next);
    set({ settings: next });
    engineBridge?.applySettings(next);
  },

  applyQualityPreset: (preset) => {
    const presetMap: Record<
      QualityPreset,
      { resolutionScale: number; bloomEnabled: boolean; shadowsEnabled: boolean }
    > = {
      low: { resolutionScale: 0.75, bloomEnabled: false, shadowsEnabled: false },
      medium: { resolutionScale: 1, bloomEnabled: false, shadowsEnabled: true },
      high: { resolutionScale: 1, bloomEnabled: true, shadowsEnabled: true },
      ultra: { resolutionScale: 1.5, bloomEnabled: true, shadowsEnabled: true },
    };
    const cfg = presetMap[preset];
    const s = get();
    const next: GameSettings = {
      ...s.settings,
      qualityPreset: preset,
      resolutionScale: cfg.resolutionScale,
      bloomEnabled: cfg.bloomEnabled,
    };
    persistSettings(next);
    set({ settings: next, shadowsEnabled: cfg.shadowsEnabled });
    engineBridge?.applySettings(next);
  },

  simulationTick: (dt) => {
    const s = get();
    if (s.screen !== 'playing') return;

    const { repairSpeedMult, lifeSupportRateMult, commsRateMult } = s.personnelEffects;
    const planetBuildings = s.surfaceBuildings.filter((b) => b.planetId === s.activePlanet);
    const solarBonus = planetBuildings.filter((b) => b.kind === 'solar_relay').length * 1.4;
    const beaconBonus = planetBuildings.filter((b) => b.kind === 'science_beacon').length * 1.8;

    const onPlanet = s.sceneEnv === 'planet';
    const nearShipPad = onPlanet && Boolean(s.surfaceTelemetry.nearShipPad);

    let nextBattery = s.resources.battery;
    let nextO2 = s.resources.suitO2;
    let nextHealth = s.resources.suitHealth ?? 100;
    let nextCoolant = s.resources.suitCoolant ?? 100;
    let nextFuel = s.fuelPct;

    if (onPlanet) {
      if (nearShipPad) {
        nextO2 = Math.min(100, nextO2 + 12 * dt);
        nextBattery = Math.min(100, nextBattery + 10 * dt);
        nextCoolant = Math.min(100, nextCoolant + 12 * dt);
        nextHealth = Math.min(100, nextHealth + 7 * dt);
        nextFuel = Math.min(100, nextFuel + 4 * dt);
      } else {
        const o2Drain = -(20 / 120);
        const pwrDrain = (s.pilotingRover ? -0.45 : -0.22) + solarBonus;
        const coolDrain = s.pilotingRover ? -0.15 : -0.35;
        nextO2 = Math.max(0, Math.min(100, nextO2 + o2Drain * dt));
        nextBattery = Math.max(0, Math.min(100, nextBattery + pwrDrain * dt));
        nextCoolant = Math.max(0, Math.min(100, nextCoolant + coolDrain * dt));
        if (nextCoolant <= 0) {
          nextHealth = Math.max(0, nextHealth - 1.5 * dt);
        }
      }
    } else if (s.sceneEnv === 'interior') {
      nextBattery = Math.min(100, nextBattery + 2.5 * repairSpeedMult * dt);
      nextO2 = Math.min(100, nextO2 + 10 * lifeSupportRateMult * dt);
      nextCoolant = Math.min(100, nextCoolant + 5 * lifeSupportRateMult * dt);
      nextHealth = Math.min(100, nextHealth + 4 * lifeSupportRateMult * dt);
    } else {
      const modePwrBonus = s.operationalMode === 'low_power' ? 0.55 : s.operationalMode === 'safe' ? 0.45 : 0;
      const tradeOffNetBonus = s.tradeOffReport.netPowerW >= 0 ? 0.35 : -0.75;
      const bpPowerPenalty =
        s.activeBlueprint && s.activeBlueprint.netPowerW < 0 ? -1.1 : 0;
      const hfPowerLoad = s.analysisFidelityMode === 'high_fidelity' ? -0.2 : 0;
      const netRatio =
        (s.shipMetrics.netPower >= 0 ? 0.4 * repairSpeedMult : -0.7) +
        tradeOffNetBonus +
        modePwrBonus +
        bpPowerPenalty +
        hfPowerLoad;
      const batteryDrain = (s.spaceTelemetry.boosting ? -1.4 : netRatio) * dt;
      nextBattery = Math.max(8, Math.min(100, nextBattery + batteryDrain));
      nextO2 = Math.min(100, nextO2 + 10 * lifeSupportRateMult * dt);
      if (s.sceneEnv === 'spaceflight') {
        const fuelBurn = s.spaceTelemetry.boosting ? -0.45 : -0.04;
        nextFuel = Math.max(4, Math.min(100, nextFuel + fuelBurn * dt));
      }
    }

    // Thermal drift connected to planet environment & active louvers
    const targetTemp = s.tradeOffReport.internalTempC;
    let nextTempC = Number((s.internalTempC + (targetTemp - s.internalTempC) * Math.min(1, dt * 0.14)).toFixed(1));

    // Active instruments produce SSR telemetry; ground link + comms mode transmit it
    const activeInstCount = Object.values(s.instrumentActiveMap).filter(Boolean).length;
    const instGenPerSec =
      s.operationalMode === 'safe' || s.operationalMode === 'low_power'
        ? 0.25 * dt
        : (s.tradeOffReport.dataGenMbDay / 480) * (activeInstCount > 0 ? 1 : 0.15) * dt;
    const maxSsrMb = Math.max(s.resources.maxStorage, s.tradeOffReport.storageCapacityMb);
    let nextDataStorage = Math.min(
      maxSsrMb,
      s.resources.dataStorage + instGenPerSec + (onPlanet ? beaconBonus * dt : 0)
    );
    let nextDataCollected =
      s.resources.dataCollected + instGenPerSec + (onPlanet ? beaconBonus * dt : 0);
    let nextDataTransmitted = s.resources.dataTransmitted;
    const gs = GROUND_STATIONS.find((g) => g.id === s.activeGroundStationId) || GROUND_STATIONS[0];
    const stationRateMult = gs.weatherStatus === 'rain_fade' ? 0.62 : gs.dishMeters >= 70 ? 1.28 : 0.95;
    const compRateMult =
      s.commsCompressionMode === 'priority_crop'
        ? 1.45
        : s.commsCompressionMode === 'lossless_ccsds'
          ? 1.22
          : 1.0;
    const hfCommsMult = s.analysisFidelityMode === 'high_fidelity' ? 0.88 : 1.0;
    const txModeActive = s.missionPlan.autoTransmit || s.operationalMode === 'comms_downlink';
    if (txModeActive && nextDataStorage > 10) {
      const linkCapacityPerSec = Math.max(2, s.tradeOffReport.commsCapacityMbDay / 120);
      const tx = Math.min(
        nextDataStorage,
        linkCapacityPerSec * commsRateMult * stationRateMult * compRateMult * hfCommsMult * dt
      );
      nextDataStorage -= tx;
      nextDataTransmitted += tx;
    }

    // Autonomous Spacecraft Operations Engine (Feature 19)
    let nextOpMode = s.operationalMode;
    let nextActiveEvent = s.activeMissionEvent;
    let nextAutoLog = s.autonomousActionLog;
    let nextTimelineLog = s.missionTimelineLog;

    const autoDecision = evaluateAutonomousAction({
      rules: s.autonomousRules,
      battery: nextBattery,
      internalTempC: nextTempC,
      commsSignal: s.resources.commsSignal,
      hullIntegrity: s.hullIntegrity,
      operationalMode: nextOpMode,
      activeEvent: nextActiveEvent,
    });

    if (autoDecision) {
      if (autoDecision.nextMode) nextOpMode = autoDecision.nextMode;
      if (autoDecision.tempAdjustmentC) nextTempC = Number((nextTempC + autoDecision.tempAdjustmentC).toFixed(1));
      if (autoDecision.autoResolveOptionId && nextActiveEvent) {
        const chosenOpt = nextActiveEvent.options.find((o) => o.id === autoDecision.autoResolveOptionId);
        if (chosenOpt) {
          nextBattery = Math.max(5, Math.min(100, nextBattery + chosenOpt.powerDelta));
          nextFuel = Math.max(0, Math.min(100, nextFuel + chosenOpt.fuelDelta));
          nextTempC = Number((nextTempC + chosenOpt.tempDeltaC).toFixed(1));
          nextActiveEvent = null;
        }
      }
      if (autoDecision.triggeredRuleName) {
        const logLine = `[+${Math.round(s.resources.solTime)}h] ${autoDecision.triggeredRuleName[s.lang]}`;
        nextAutoLog = [logLine, ...nextAutoLog].slice(0, 14);
        nextTimelineLog = [
          ...nextTimelineLog.slice(-18),
          {
            id: `auto_${Date.now()}`,
            timestamp: Date.now(),
            solTime: s.resources.solTime,
            phase: s.lifecyclePhase,
            source: 'autonomous',
            summary: autoDecision.triggeredRuleName,
          },
        ];
      }
    }

    // Contextual Non-Random Dynamic Event Generator (only when critical conflict or storm occurs & cooldown elapsed)
    const nowTs = Date.now();
    const hasCriticalConflict = s.tradeOffReport.conflicts.some((c) => c.severity === 'critical');
    const stormActive = s.weather === 'solar_flare' || s.weather === 'ion_storm';
    if (
      !nextActiveEvent &&
      (s.sceneEnv === 'spaceflight' || s.sceneEnv === 'planet') &&
      (hasCriticalConflict || stormActive) &&
      nowTs - lastAutoEventTs > 45000
    ) {
      lastAutoEventTs = nowTs;
      const generatedEvt = generateContextualDynamicEvent({
        planetId: s.activePlanet,
        loadout: s.advancedLoadout,
        tradeOff: s.tradeOffReport,
        resources: s.resources,
        hullIntegrity: s.hullIntegrity,
        internalTempC: nextTempC,
      });
      nextActiveEvent = generatedEvt;
      nextTimelineLog = [
        ...nextTimelineLog.slice(-18),
        {
          id: generatedEvt.id,
          timestamp: nowTs,
          solTime: s.resources.solTime,
          phase: s.lifecyclePhase,
          source: 'event',
          summary: generatedEvt.title,
        },
      ];
    }

    const bio = s.astronautBio;
    const hazardStress =
      s.spaceTelemetry.hazardLevel === 'SEVERE'
        ? 26
        : s.spaceTelemetry.hazardLevel === 'ELEVATED'
          ? 12
          : 0;
    const envTargetBpm =
      onPlanet && !s.pilotingRover
        ? (s.surfaceTelemetry.hostileAlienDist !== null ? 118 : 88) + hazardStress
        : s.sceneEnv === 'spaceflight' && s.spaceTelemetry.boosting
          ? 96 + hazardStress
          : 72 + hazardStress + s.survivalFailures * 8;
    const nextBpm = Math.round(bio.heartRateBpm + (envTargetBpm - bio.heartRateBpm) * Math.min(1, dt * 0.6));
    const co2Delta = nearShipPad || s.sceneEnv === 'interior' ? -0.35 * dt : onPlanet && !s.pilotingRover ? 0.05 * dt : -0.04 * dt;
    const nextCo2 = Math.max(0.8, Math.min(5.5, Number((bio.co2MmHg + co2Delta).toFixed(2))));
    const stressLevel: AstronautBioState['stressLevel'] =
      nextBpm > 130 || nextHealth < 35 || nextO2 < 25
        ? 'CRITICAL'
        : nextBpm > 108
          ? 'HIGH'
          : nextBpm > 86
            ? 'FOCUSED'
            : 'CALM';

    set({
      fuelPct: nextFuel,
      internalTempC: nextTempC,
      operationalMode: nextOpMode,
      activeMissionEvent: nextActiveEvent,
      autonomousActionLog: nextAutoLog,
      missionTimelineLog: nextTimelineLog,
      resources: {
        ...s.resources,
        battery: nextBattery,
        suitO2: nextO2,
        suitHealth: nextHealth,
        suitCoolant: nextCoolant,
        maxStorage: maxSsrMb,
        solTime: s.resources.solTime + dt * 0.04,
        dataStorage: nextDataStorage,
        dataCollected: nextDataCollected,
        dataTransmitted: nextDataTransmitted,
      },
      astronautBio: {
        ...bio,
        heartRateBpm: nextBpm,
        co2MmHg: nextCo2,
        stressLevel,
      },
    });

    if (onPlanet && (nextO2 <= 0 || nextHealth <= 0)) {
      get().finishExpedition(false, {
        ar:
          nextO2 <= 0
            ? 'نفد أكسجين بدلة الفضاء بالكامل (0%) قبل العودة إلى المركبة الفضائية لإعادة التعبئة.'
            : 'فقد رائد الفضاء كامل صحة البدلة (0%) على سطح الكوكب قبل العودة إلى المركبة.',
        en:
          nextO2 <= 0
            ? 'EVA Suit Oxygen reached 0% on the planet surface before returning to the spacecraft to refuel.'
            : 'Astronaut Suit Health dropped to 0% on the planet surface before returning to the spacecraft.',
      });
    }
  },

  setMccOpen: (mccOpen) => {
    if (mccOpen) engineBridge?.setMouseLocked(false);
    set({
      mccOpen,
      ...(mccOpen
        ? { systemsLabOpen: false, whatIfOpen: false, reportOpen: false, tabletOpen: false, mapOpen: false }
        : {}),
    });
  },
  setSystemsLabOpen: (systemsLabOpen) => {
    if (systemsLabOpen) engineBridge?.setMouseLocked(false);
    set({
      systemsLabOpen,
      ...(systemsLabOpen
        ? { mccOpen: false, whatIfOpen: false, reportOpen: false, tabletOpen: false, mapOpen: false }
        : {}),
    });
  },
  setWhatIfOpen: (whatIfOpen) => {
    if (whatIfOpen) engineBridge?.setMouseLocked(false);
    set({
      whatIfOpen,
      ...(whatIfOpen
        ? { mccOpen: false, systemsLabOpen: false, reportOpen: false, tabletOpen: false, mapOpen: false }
        : {}),
    });
  },
  setReportOpen: (reportOpen) => {
    if (reportOpen) engineBridge?.setMouseLocked(false);
    set({
      reportOpen,
      ...(reportOpen
        ? { mccOpen: false, systemsLabOpen: false, whatIfOpen: false, tabletOpen: false, mapOpen: false }
        : {}),
    });
  },

  equipSubsystem14: (subsystemId) => {
    const s = get();
    const item = SUBSYSTEM_CATALOG_14.find((it) => it.id === subsystemId);
    if (!item) return;
    if (!s.unlockedSubsystemIds.includes(subsystemId)) {
      get().purchaseSubsystem14(subsystemId);
      return;
    }
    const nextLoadout: AdvancedLoadout = {
      ...s.advancedLoadout,
      [item.category]: item.id,
    };
    const pair = computeEngOutputs({
      planetId: s.activePlanet,
      loadout: nextLoadout,
      instrumentIds: s.activeInstrumentIds,
      instrumentActiveMap: s.instrumentActiveMap,
      operationalMode: s.operationalMode,
      transferStrategy: s.transferStrategy,
      stationId: s.activeGroundStationId,
      compressionMode: s.commsCompressionMode,
      fidelityMode: s.analysisFidelityMode,
      maxBudgetM: Math.max(200, s.resources.budget + s.unlockedBudgetBonusM),
      sandboxUnrestricted: s.sandboxUnrestricted,
      hullIntegrity: s.hullIntegrity,
      commsSignal: s.resources.commsSignal,
    });
    set({
      advancedLoadout: nextLoadout,
      tradeOffReport: pair.tradeOffReport,
      digitalTwinState: pair.digitalTwinState,
      resources: {
        ...s.resources,
        mass: pair.tradeOffReport.dryMassKg,
        powerGeneration: pair.tradeOffReport.powerGenW,
        powerConsumption: pair.tradeOffReport.powerDrawW,
        maxStorage: Math.max(s.resources.maxStorage, pair.tradeOffReport.storageCapacityMb),
      },
      toastText:
        s.lang === 'ar'
          ? `تم تركيب ${item.name.ar} — متزامن مع التوأم 3D و2D ✓`
          : `Equipped ${item.name.en} — synced to 2D & 3D Digital Twin ✓`,
    });
    engineBridge?.setDigitalTwinState(pair.digitalTwinState);
    spaceAudio.playSkyChirp();
    get().saveProgress();
  },

  purchaseSubsystem14: (subsystemId) => {
    const s = get();
    const item = SUBSYSTEM_CATALOG_14.find((it) => it.id === subsystemId);
    if (!item) return false;
    if (s.unlockedSubsystemIds.includes(subsystemId)) {
      get().equipSubsystem14(subsystemId);
      return true;
    }
    const costCr = Math.round(item.costM * 1.4);
    if (!s.sandboxUnrestricted && s.resources.credits < costCr) {
      get().showToast(
        s.lang === 'ar'
          ? `تحتاج ${costCr} CR لفتح ${item.name.ar} (لديك ${s.resources.credits} CR)`
          : `Need ${costCr} CR to unlock ${item.name.en} (have ${s.resources.credits} CR)`
      );
      spaceAudio.playWeatherAlert('storm');
      return false;
    }
    const nextUnlocked = [...s.unlockedSubsystemIds, subsystemId];
    set({
      unlockedSubsystemIds: nextUnlocked,
      resources: {
        ...s.resources,
        credits: s.sandboxUnrestricted ? s.resources.credits : s.resources.credits - costCr,
      },
    });
    spaceAudio.playPlanetFanfare();
    get().equipSubsystem14(subsystemId);
    return true;
  },

  unlockTechNode: (techId) => {
    const s = get();
    const node = TECH_TREE_NODES.find((t) => t.id === techId);
    if (!node || s.unlockedTechIds.includes(techId)) return false;
    const reqMet = !node.prereqTechId || s.unlockedTechIds.includes(node.prereqTechId);
    if (!reqMet) {
      get().showToast(
        s.lang === 'ar' ? 'يجب فتح التقنية السابقة أولاً.' : 'Prerequisite technology required first.'
      );
      return false;
    }
    if (!s.sandboxUnrestricted && s.researchPoints < node.rpCost) {
      get().showToast(
        s.lang === 'ar'
          ? `نقاط البحث غير كافية (${s.researchPoints}/${node.rpCost} RP)`
          : `Insufficient Research Points (${s.researchPoints}/${node.rpCost} RP)`
      );
      return false;
    }
    const nextUnlockedSub = Array.from(new Set([...s.unlockedSubsystemIds, ...node.unlocksItemIds]));
    set({
      researchPoints: s.sandboxUnrestricted ? s.researchPoints : s.researchPoints - node.rpCost,
      unlockedTechIds: [...s.unlockedTechIds, techId],
      unlockedSubsystemIds: nextUnlockedSub,
      toastText:
        s.lang === 'ar'
          ? `✔ تم تطوير التقنية: ${node.name.ar} (+قطع جديدة)`
          : `✔ Researched Tech: ${node.name.en} (subsystems unlocked)`,
    });
    spaceAudio.playPlanetFanfare();
    get().saveProgress();
    return true;
  },

  toggleInstrumentSelection: (instId) => {
    const s = get();
    const exists = s.activeInstrumentIds.includes(instId);
    const nextIds = exists
      ? s.activeInstrumentIds.filter((x) => x !== instId)
      : [...s.activeInstrumentIds, instId];
    const nextMap = { ...s.instrumentActiveMap, [instId]: !exists };
    const pair = computeEngOutputs({
      planetId: s.activePlanet,
      loadout: s.advancedLoadout,
      instrumentIds: nextIds,
      instrumentActiveMap: nextMap,
      operationalMode: s.operationalMode,
      transferStrategy: s.transferStrategy,
      stationId: s.activeGroundStationId,
      compressionMode: s.commsCompressionMode,
      fidelityMode: s.analysisFidelityMode,
      maxBudgetM: Math.max(200, s.resources.budget + s.unlockedBudgetBonusM),
      sandboxUnrestricted: s.sandboxUnrestricted,
      hullIntegrity: s.hullIntegrity,
      commsSignal: s.resources.commsSignal,
    });
    set({
      activeInstrumentIds: nextIds,
      instrumentActiveMap: nextMap,
      tradeOffReport: pair.tradeOffReport,
      digitalTwinState: pair.digitalTwinState,
    });
    engineBridge?.setDigitalTwinState(pair.digitalTwinState);
    spaceAudio.playSkyChirp();
    get().saveProgress();
  },

  toggleInstrumentActive: (instId) => {
    const s = get();
    const nextMap = {
      ...s.instrumentActiveMap,
      [instId]: !(s.instrumentActiveMap[instId] !== false),
    };
    const pair = computeEngOutputs({
      planetId: s.activePlanet,
      loadout: s.advancedLoadout,
      instrumentIds: s.activeInstrumentIds,
      instrumentActiveMap: nextMap,
      operationalMode: s.operationalMode,
      transferStrategy: s.transferStrategy,
      stationId: s.activeGroundStationId,
      compressionMode: s.commsCompressionMode,
      fidelityMode: s.analysisFidelityMode,
      maxBudgetM: Math.max(200, s.resources.budget + s.unlockedBudgetBonusM),
      sandboxUnrestricted: s.sandboxUnrestricted,
      hullIntegrity: s.hullIntegrity,
      commsSignal: s.resources.commsSignal,
    });
    set({
      instrumentActiveMap: nextMap,
      tradeOffReport: pair.tradeOffReport,
      digitalTwinState: pair.digitalTwinState,
    });
    engineBridge?.setDigitalTwinState(pair.digitalTwinState);
    spaceAudio.playSkyChirp();
  },

  setOperationalMode: (mode) => {
    const s = get();
    const pair = computeEngOutputs({
      planetId: s.activePlanet,
      loadout: s.advancedLoadout,
      instrumentIds: s.activeInstrumentIds,
      instrumentActiveMap: s.instrumentActiveMap,
      operationalMode: mode,
      transferStrategy: s.transferStrategy,
      stationId: s.activeGroundStationId,
      compressionMode: s.commsCompressionMode,
      fidelityMode: s.analysisFidelityMode,
      maxBudgetM: Math.max(200, s.resources.budget + s.unlockedBudgetBonusM),
      sandboxUnrestricted: s.sandboxUnrestricted,
      hullIntegrity: s.hullIntegrity,
      commsSignal: s.resources.commsSignal,
    });
    set({
      operationalMode: mode,
      tradeOffReport: pair.tradeOffReport,
      digitalTwinState: pair.digitalTwinState,
      missionTimelineLog: [
        ...s.missionTimelineLog.slice(-18),
        {
          id: `mode_${Date.now()}`,
          timestamp: Date.now(),
          solTime: s.resources.solTime,
          phase: s.lifecyclePhase,
          source: 'player',
          summary: {
            ar: `تبديل وضع تشغيل المركبة إلى ${mode.toUpperCase()}`,
            en: `Switched Spacecraft Operational Mode to ${mode.toUpperCase()}`,
          },
        },
      ],
    });
    engineBridge?.setDigitalTwinState(pair.digitalTwinState);
    spaceAudio.playSkyChirp();
    get().saveProgress();
  },

  setTxPriority: (txPriority) => set({ txPriority }),

  setTransferStrategy: (transferStrategy) => {
    const s = get();
    const pair = computeEngOutputs({
      planetId: s.activePlanet,
      loadout: s.advancedLoadout,
      instrumentIds: s.activeInstrumentIds,
      instrumentActiveMap: s.instrumentActiveMap,
      operationalMode: s.operationalMode,
      transferStrategy,
      stationId: s.activeGroundStationId,
      compressionMode: s.commsCompressionMode,
      fidelityMode: s.analysisFidelityMode,
      maxBudgetM: Math.max(200, s.resources.budget + s.unlockedBudgetBonusM),
      sandboxUnrestricted: s.sandboxUnrestricted,
      hullIntegrity: s.hullIntegrity,
      commsSignal: s.resources.commsSignal,
    });
    set({
      transferStrategy,
      tradeOffReport: pair.tradeOffReport,
      digitalTwinState: pair.digitalTwinState,
      toastText:
        s.lang === 'ar'
          ? `مسار الانتقال: ${transferStrategy.toUpperCase()} (Δv مطلوب ${pair.tradeOffReport.deltaVRequiredKms} km/s)`
          : `Transfer Route: ${transferStrategy.toUpperCase()} (Δv req ${pair.tradeOffReport.deltaVRequiredKms} km/s)`,
    });
    engineBridge?.setDigitalTwinState(pair.digitalTwinState);
    spaceAudio.playSkyChirp();
    get().saveProgress();
  },

  toggleSandboxUnrestricted: () => {
    const s = get();
    const next = !s.sandboxUnrestricted;
    const pair = computeEngOutputs({
      planetId: s.activePlanet,
      loadout: s.advancedLoadout,
      instrumentIds: s.activeInstrumentIds,
      instrumentActiveMap: s.instrumentActiveMap,
      operationalMode: s.operationalMode,
      transferStrategy: s.transferStrategy,
      stationId: s.activeGroundStationId,
      compressionMode: s.commsCompressionMode,
      fidelityMode: s.analysisFidelityMode,
      maxBudgetM: Math.max(200, s.resources.budget + s.unlockedBudgetBonusM),
      sandboxUnrestricted: next,
      hullIntegrity: s.hullIntegrity,
      commsSignal: s.resources.commsSignal,
    });
    set({
      sandboxUnrestricted: next,
      tradeOffReport: pair.tradeOffReport,
      toastText: next
        ? s.lang === 'ar'
          ? 'تم فتح وضع المختبر الحر بدون قيود الميزانية والكتلة!'
          : 'Unrestricted Sandbox Mode ON (non-blocking engineering advisories).'
        : s.lang === 'ar'
          ? 'العودة لوضع القيود الهندسية الصارمة.'
          : 'Returned to Strict Engineering Constraints Mode.',
    });
    get().saveProgress();
  },

  toggleBeginnerGuidedMode: () => set((s) => ({ beginnerGuidedMode: !s.beginnerGuidedMode })),

  setLifecyclePhase: (phase) => {
    const clamped = Math.max(1, Math.min(12, phase));
    const phaseDef = MISSION_LIFECYCLE_12[clamped - 1];
    set((s) => ({
      lifecyclePhase: clamped,
      missionTimelineLog: [
        ...s.missionTimelineLog.slice(-18),
        {
          id: `phase_${Date.now()}`,
          timestamp: Date.now(),
          solTime: s.resources.solTime,
          phase: clamped,
          source: 'player',
          summary: phaseDef.title,
        },
      ],
    }));
  },

  toggleLifecyclePaused: () => set((s) => ({ lifecyclePaused: !s.lifecyclePaused })),

  triggerDynamicEvent: (forcedType) => {
    const s = get();
    const evt = generateContextualDynamicEvent({
      planetId: s.activePlanet,
      loadout: s.advancedLoadout,
      tradeOff: s.tradeOffReport,
      resources: s.resources,
      hullIntegrity: s.hullIntegrity,
      internalTempC: s.internalTempC,
      forcedType,
    });
    set({
      activeMissionEvent: evt,
      missionTimelineLog: [
        ...s.missionTimelineLog.slice(-18),
        {
          id: evt.id,
          timestamp: Date.now(),
          solTime: s.resources.solTime,
          phase: s.lifecyclePhase,
          source: 'event',
          summary: evt.title,
        },
      ],
    });
    spaceAudio.playWeatherAlert('storm');
  },

  resolveDynamicEvent: (optionId) => {
    const s = get();
    if (!s.activeMissionEvent) return;
    const opt = s.activeMissionEvent.options.find((o) => o.id === optionId);
    if (!opt) return;
    if (opt.creditCost > 0 && !s.sandboxUnrestricted && s.resources.credits < opt.creditCost) {
      get().showToast(
        s.lang === 'ar'
          ? `رصيد غير كافٍ (${opt.creditCost} CR مطلوب)`
          : `Insufficient credits (${opt.creditCost} CR required)`
      );
      return;
    }

    const nextHull = Math.max(0, Math.min(100, s.hullIntegrity + opt.hullDelta));
    const nextBattery = Math.max(0, Math.min(100, s.resources.battery + opt.powerDelta));
    const nextO2 = Math.max(0, Math.min(100, s.resources.suitO2 + opt.o2Delta));
    const nextFuel = Math.max(0, Math.min(100, s.fuelPct + opt.fuelDelta));
    const nextTemp = Number((s.internalTempC + opt.tempDeltaC).toFixed(1));
    const nextCredits = Math.max(0, s.resources.credits - (s.sandboxUnrestricted ? 0 : opt.creditCost));

    const pair = computeEngOutputs({
      planetId: s.activePlanet,
      loadout: s.advancedLoadout,
      instrumentIds: s.activeInstrumentIds,
      instrumentActiveMap: s.instrumentActiveMap,
      operationalMode: s.operationalMode,
      transferStrategy: s.transferStrategy,
      stationId: s.activeGroundStationId,
      compressionMode: s.commsCompressionMode,
      fidelityMode: s.analysisFidelityMode,
      maxBudgetM: Math.max(200, s.resources.budget + s.unlockedBudgetBonusM),
      sandboxUnrestricted: s.sandboxUnrestricted,
      hullIntegrity: nextHull,
      commsSignal: s.resources.commsSignal,
    });

    set({
      activeMissionEvent: null,
      hullIntegrity: nextHull,
      fuelPct: nextFuel,
      internalTempC: nextTemp,
      researchPoints: s.researchPoints + 25,
      tradeOffReport: pair.tradeOffReport,
      digitalTwinState: pair.digitalTwinState,
      resources: {
        ...s.resources,
        credits: nextCredits,
        battery: nextBattery,
        suitO2: nextO2,
      },
      missionTimelineLog: [
        ...s.missionTimelineLog.slice(-18),
        {
          id: `res_${Date.now()}`,
          timestamp: Date.now(),
          solTime: s.resources.solTime,
          phase: s.lifecyclePhase,
          source: 'player',
          summary: {
            ar: `معالجة الطارئ: ${opt.label.ar} (+25 RP)`,
            en: `Event Handled: ${opt.label.en} (+25 RP)`,
          },
        },
      ],
    });
    engineBridge?.setDigitalTwinState(pair.digitalTwinState);
    spaceAudio.playRingPass();
    get().saveProgress();

    if (nextHull <= 0 || nextO2 <= 0) {
      get().finishExpedition(false, {
        ar: 'انهار الهيكل أو الأكسجين بعد تداعيات الطارئ.',
        en: 'Critical structural or life-support loss following event fallout.',
      });
    }
  },

  attemptSystemRecovery: () => {
    const s = get();
    const cost = 35;
    if (!s.sandboxUnrestricted && s.resources.credits < cost) {
      get().showToast(
        s.lang === 'ar' ? `تحتاج ${cost} CR لتشغيل استعادة الأنظمة.` : `Need ${cost} CR to run System Recovery.`
      );
      return;
    }
    const nextHull = Math.min(100, s.hullIntegrity + Math.round(14 * s.personnelEffects.repairSpeedMult));
    const nextBat = Math.min(100, s.resources.battery + 18);
    const nextTemp = Number((s.internalTempC + (21 - s.internalTempC) * 0.65).toFixed(1));
    set({
      hullIntegrity: nextHull,
      internalTempC: nextTemp,
      resources: {
        ...s.resources,
        credits: Math.max(0, s.resources.credits - (s.sandboxUnrestricted ? 0 : cost)),
        battery: nextBat,
      },
      toastText:
        s.lang === 'ar'
          ? `تمت استعادة الأنظمة: +18% طاقة · +هيكل إلى ${Math.round(nextHull)}%`
          : `System Recovery Executed: +18% Battery · Hull stabilized at ${Math.round(nextHull)}%`,
    });
    spaceAudio.playPlanetFanfare();
    get().saveProgress();
  },

  updateAutonomousRules: (patch) => {
    set((s) => ({
      autonomousRules: { ...s.autonomousRules, ...patch },
    }));
    get().saveProgress();
  },

  applyNasaRecreation: (nasaId) => {
    const s = get();
    const nasa = NASA_RECREATION_MISSIONS.find((m) => m.id === nasaId);
    if (!nasa) return;
    const nextLoadout = { ...nasa.loadout };
    const nextInstruments = [...nasa.instruments];
    const nextInstrumentMap: Record<string, boolean> = {};
    nextInstruments.forEach((id) => {
      nextInstrumentMap[id] = true;
    });
    const recTransfer = nasa.id === 'rec_voyager2' ? 'gravity_assist' : 'hohmann';
    const nextUnlocked = Array.from(new Set([...s.unlockedSubsystemIds, ...Object.values(nextLoadout)]));
    const pair = computeEngOutputs({
      planetId: nasa.planetId,
      loadout: nextLoadout,
      instrumentIds: nextInstruments,
      instrumentActiveMap: nextInstrumentMap,
      operationalMode: 'nominal',
      transferStrategy: recTransfer,
      stationId: s.activeGroundStationId,
      compressionMode: s.commsCompressionMode,
      fidelityMode: 'high_fidelity',
      maxBudgetM: Math.max(500, s.resources.budget + s.unlockedBudgetBonusM),
      sandboxUnrestricted: s.sandboxUnrestricted,
      hullIntegrity: 100,
      commsSignal: s.resources.commsSignal,
    });
    set({
      activePlanet: nasa.planetId,
      missionVizTargetPlanet: nasa.planetId,
      advancedLoadout: nextLoadout,
      activeInstrumentIds: nextInstruments,
      instrumentActiveMap: nextInstrumentMap,
      unlockedSubsystemIds: nextUnlocked,
      transferStrategy: recTransfer,
      operationalMode: 'nominal',
      analysisFidelityMode: 'high_fidelity',
      researchPoints: s.researchPoints + 40,
      tradeOffReport: pair.tradeOffReport,
      digitalTwinState: pair.digitalTwinState,
      toastText:
        s.lang === 'ar'
          ? `تم تحميل محاكاة ${nasa.name.ar} (+40 RP)`
          : `Loaded ${nasa.name.en} Reference Architecture (+40 RP)`,
    });
    engineBridge?.setDigitalTwinState(pair.digitalTwinState);
    spaceAudio.playPlanetFanfare();
    get().saveProgress();
  },

  recordPerformanceSnapshot: (versionLabel) => {
    const s = get();
    const rep = buildMissionPerformanceReport({
      versionLabel: versionLabel || `v${s.performanceHistory.length + 1}.0 (${s.activePlanet.toUpperCase()})`,
      planetId: s.activePlanet,
      objective: s.missionPlan.objective,
      loadout: s.advancedLoadout,
      tradeOff: s.tradeOffReport,
      resources: s.resources,
      fuelPct: s.fuelPct,
      hullIntegrity: s.hullIntegrity,
      score: Math.max(100, s.survivalScore + s.tradeOffReport.scienceValue * 4),
      grade:
        s.tradeOffReport.feasibilityScore >= 85
          ? 'S'
          : s.tradeOffReport.feasibilityScore >= 70
            ? 'A'
            : s.tradeOffReport.feasibilityScore >= 50
              ? 'B'
              : 'C',
      incidents: s.missionTimelineLog
        .filter((l) => l.source === 'event' || l.source === 'autonomous')
        .slice(-5)
        .map((l) => l.summary[s.lang]),
    });
    set({
      performanceHistory: [rep, ...s.performanceHistory].slice(0, 12),
      toastText:
        s.lang === 'ar'
          ? `تم حفظ نسخة التقرير الهندسي ${rep.versionLabel}`
          : `Archived Performance Snapshot ${rep.versionLabel}`,
    });
    get().saveProgress();
  },

  addInstructorAssignment: (assignment) => {
    set((s) => ({
      instructorAssignments: [assignment, ...s.instructorAssignments.filter((a) => a.id !== assignment.id)],
    }));
    get().saveProgress();
  },

  applyInstructorAssignment: (assignmentId) => {
    const s = get();
    const assign = s.instructorAssignments.find((a) => a.id === assignmentId);
    if (!assign) return;
    const pair = computeEngOutputs({
      planetId: assign.targetPlanetId,
      loadout: s.advancedLoadout,
      instrumentIds: s.activeInstrumentIds,
      instrumentActiveMap: s.instrumentActiveMap,
      operationalMode: s.operationalMode,
      transferStrategy: s.transferStrategy,
      stationId: s.activeGroundStationId,
      compressionMode: s.commsCompressionMode,
      fidelityMode: s.analysisFidelityMode,
      maxBudgetM: assign.maxBudgetM,
      sandboxUnrestricted: false,
      hullIntegrity: s.hullIntegrity,
      commsSignal: s.resources.commsSignal,
    });
    set({
      activeAssignmentId: assign.id,
      activePlanet: assign.targetPlanetId,
      missionVizTargetPlanet: assign.targetPlanetId,
      sandboxUnrestricted: false,
      tradeOffReport: pair.tradeOffReport,
      digitalTwinState: pair.digitalTwinState,
      resources: {
        ...s.resources,
        budget: assign.maxBudgetM,
      },
      toastText:
        s.lang === 'ar'
          ? `تم تفعيل واجب المعلم: ${assign.title.ar} (سقف $${assign.maxBudgetM}M)`
          : `Activated Classroom Assignment: ${assign.title.en} ($${assign.maxBudgetM}M max)`,
    });
    engineBridge?.setDigitalTwinState(pair.digitalTwinState);
    get().saveProgress();
  },

  setTeamMembers: (teamMembers) => {
    set({ teamMembers });
    get().saveProgress();
  },
}));
