export type Language = 'ar' | 'en';

export type GameScreen = 'menu' | 'character' | 'playing' | 'paused' | 'results';

export type SceneEnv = 'interior' | 'builder' | 'spaceflight' | 'planet' | 'mission-viz';

export type DifficultyLevel = 'Cadet' | 'Commander' | 'Veteran';

export type Specialization =
  | 'Aerospace Engineer'
  | 'Astrobiologist'
  | 'Flight Commander';

export type SuitModel = 'Aegis Mk-IV' | 'Vanguard EVA' | 'Horizon Science';

export type CameraMode = 'chase' | 'cockpit' | 'orbit' | 'first-person';

export type SpaceWeather = 'clear' | 'solar_flare' | 'asteroid_squall' | 'ion_storm';

export type SkyMood = 'happy' | 'excited' | 'warning' | 'scanning' | 'calm';

export type PlanetTextureKind =
  | 'mercury'
  | 'terran'
  | 'volcanic'
  | 'cryo_giant'
  | 'desert'
  | 'emerald_nebula'
  | 'obsidian'
  | 'uranus'
  | 'neptune';

export type PlanetId =
  | 'mercury'
  | 'aurora'
  | 'luna'
  | 'mars'
  | 'solaris'
  | 'aetheris'
  | 'obsidian'
  | 'uranus'
  | 'neptune';

export type ShipLiveryId =
  | 'vanguard_cobalt'
  | 'solar_gold'
  | 'crimson_phoenix'
  | 'obsidian_stealth';

export interface ShipLivery {
  id: ShipLiveryId;
  name: Record<Language, string>;
  hullHex: string;
  accentHex: string;
  thrusterHex: string;
  cost: number;
}

export type CharacterGender = 'male' | 'female';

export interface CharacterConfig {
  name: string;
  gender: CharacterGender;
  specialization: Specialization;
  suitModel: SuitModel;
  primaryColor: string;
  visorColor: string;
  helmetEquipped: boolean;
}

export interface ShipPartOption {
  id: string;
  category: 'engine' | 'solar' | 'hull' | 'sensor' | 'comms';
  name: Record<Language, string>;
  desc: Record<Language, string>;
  cost: number;
  mass: number;
  powerDelta: number;
  deltaV: number;
  reliabilityBonus: number;
  tier: number;
}

export interface PowerAllocation {
  engines: number; // % share (engines + shields + sensors = 100)
  shields: number;
  sensors: number;
}

export type Mode2dTabId =
  | 'dashboard2d'
  | 'designer2d'
  | 'ops2d'
  | 'space2d'
  | 'planet2d'
  | 'shuttle2d'
  | 'mcc2d'
  | 'systems2d'
  | 'whatif2d'
  | 'nasa2d'
  | 'report2d';
export type AnalysisFidelityMode = 'approximation' | 'high_fidelity';
export type CommsCompressionMode = 'raw' | 'lossless_ccsds' | 'priority_crop';

export interface ShipConfig {
  engineId: string;
  solarId: string;
  hullId: string;
  sensorId: string;
  commsId: string;
  liveryId: ShipLiveryId;
}

export interface ShipMetrics {
  mass: number;
  totalCost: number;
  powerGen: number;
  powerUse: number;
  netPower: number;
  deltaV: number;
  reliability: number;
  engineLevel: number;
  shieldLevel: number;
  cannonLevel: number;
  maxShield: number;
  maxSpeed: number;
  mdlRiskScore: number; // Lower is safer
  thermalMargin: number; // %
  attitudePrecision: number; // %
}

export type ScienceObjectiveId =
  | 'exoplanet_biosignatures'
  | 'solar_corona'
  | 'deep_galaxies'
  | 'high_energy_pulsars';

export type WavelengthId = 'optical' | 'infrared' | 'ultraviolet' | 'xray';

export type OpticSystemId = 'segmented_ir' | 'coronagraph_uv' | 'wolter_xray' | 'wide_field_opt';

export interface TelescopeDesignState {
  objectiveId: ScienceObjectiveId;
  wavelengthId: WavelengthId;
  opticId: OpticSystemId;
  cubeSatPhase: 1 | 2 | 3 | 4; // ConOps -> Bus Build -> Launch -> Beacon Ops
  deployedCount: number;
  lastMatchedNasaMission: string | null;
}

export interface CraterSite {
  id: string;
  name: Record<Language, string>;
  x: number;
  z: number;
  radius: number;
}

export interface ScienceSite {
  id: string;
  name: Record<Language, string>;
  x: number;
  z: number;
  dataYieldMb: number;
}

export interface PlanetData {
  id: PlanetId;
  name: Record<Language, string>;
  subtitle: Record<Language, string>;
  description: Record<Language, string>;
  discoveryFact: Record<Language, string>;
  resourceName: Record<Language, string>;
  position: [number, number, number];
  radius: number;
  orbitDistance: number;
  surfaceKind: PlanetTextureKind;
  primaryColor: string;
  atmosphereColor: string;
  terrainColor: string;
  terrainAccent: string;
  skyColor: string;
  gravity: number;
  hasRings?: boolean;
  ringColor?: string;
  moonCount?: number;
  sampleTarget: number;
  rewardCredits: number;
  rewardXp: number;
  craters: CraterSite[];
  scienceSites: ScienceSite[];
  hasMonolith?: boolean;
}

export interface ResourcesState {
  budget: number;
  mass: number;
  powerGeneration: number;
  powerConsumption: number;
  battery: number;
  dataStorage: number;
  maxStorage: number;
  dataCollected: number;
  dataTransmitted: number;
  commsStation: 'Goldstone' | 'Madrid' | 'Canberra';
  commsSignal: number;
  solTime: number;
  suitO2: number;
  suitHealth: number;
  suitCoolant: number;
  credits: number;
}

export interface CrewMember {
  id: string;
  name: Record<Language, string>;
  role: Record<Language, string>;
  assignment: 'Bridge' | 'Engineering' | 'Science' | 'Comms';
  morale: number;
  fatigue: number;
}

export interface EmergencyEvent {
  id: string;
  title: Record<Language, string>;
  description: Record<Language, string>;
  severity: 'caution' | 'critical';
  system: 'Power' | 'Shield' | 'Comms' | 'LifeSupport';
  actionLabel: Record<Language, string>;
  costCredits: number;
}

export interface StoryOption {
  id: string;
  label: Record<Language, string>;
  description: Record<Language, string>;
  effectSummary: Record<Language, string>;
}

export interface ActiveChoice {
  id: string;
  title: Record<Language, string>;
  prompt: Record<Language, string>;
  options: StoryOption[];
}

export interface SkyMessage {
  id: number;
  sender: 'sky' | 'player';
  text: string;
  voiceText?: string;
  mood: SkyMood;
  timestamp: number;
}

export interface RadarBlip {
  id: PlanetId;
  name: Record<Language, string>;
  dx: number;
  dz: number;
  color: string;
  discovered: boolean;
  isTarget: boolean;
}

export type InteriorStationId =
  | 'main_dashboard'
  | 'control_2d'
  | 'helm'
  | 'nav'
  | 'science_lab'
  | 'bio_bay'
  | 'lounge'
  | 'med_bay'
  | 'engineering'
  | 'cargo_bay'
  | 'comms_desk'
  | 'airlock';

export type ShuttleRoomId = Exclude<InteriorStationId, 'main_dashboard' | 'control_2d'>;

export type SpecialistId =
  | 'ryan'
  | 'nadia'
  | 'elena'
  | 'omar'
  | 'maya'
  | 'sophia'
  | 'marcus'
  | 'devon'
  | 'aria'
  | 'leo';

export type SpecialistSpecialty =
  | 'flight'
  | 'science'
  | 'engineering'
  | 'medical'
  | 'comms';

export interface ShuttleSpecialist {
  id: SpecialistId;
  name: Record<Language, string>;
  role: Record<Language, string>;
  specialty: SpecialistSpecialty;
  skillRating: number;
  idealRooms: ShuttleRoomId[];
  assignedRoomId: ShuttleRoomId;
  trait: Record<Language, string>;
}

export interface PersonnelEffects {
  repairSpeedMult: number;
  scienceRateMult: number;
  lifeSupportRateMult: number;
  commsRateMult: number;
  flightEfficiencyMult: number;
  synergyCount: number;
}

export interface InteriorTelemetrySnapshot {
  playerX: number;
  playerZ: number;
  nearStation: {
    id: InteriorStationId;
    label: Record<Language, string>;
    distance: number;
  } | null;
}

export type HazardLevel = 'NOMINAL' | 'ELEVATED' | 'SEVERE';

export interface SpaceTelemetrySnapshot {
  speed: number;
  maxSpeed: number;
  boosting: boolean;
  shield: number;
  maxShield: number;
  shipX: number;
  shipY: number;
  shipZ: number;
  shipYaw: number;
  shipPitchDeg: number;
  shipRollDeg: number;
  shipHeadingDeg: number;
  accelG: number;
  altitudeKm: number;
  autopilotActive: boolean;
  targetPlanetId: PlanetId | null;
  targetDistance: number | null;
  nearbyPlanetId: PlanetId | null;
  nearbyPlanetDistance: number | null;
  radarBlips: RadarBlip[];
  cannonCooldown: number;
  barrelRollCooldown: number;
  weather: SpaceWeather;
  weatherSpeedMultiplier: number;
  weatherShieldDelta: number;
  radiationSievert: number;
  dustDensityPct: number;
  hazardLevel: HazardLevel;
  weatherCountdown: number;
}

export interface SurfaceTelemetrySnapshot {
  playerX: number;
  playerZ: number;
  roverX: number;
  roverZ: number;
  speedKmh: number;
  headingDeg: number;
  inRover: boolean;
  nearShipPad?: boolean;
  hostileAlienDist?: number | null;
  nearInteractable: {
    kind: 'ship' | 'rover' | 'sample' | 'crater' | 'science' | 'monolith' | 'creature' | 'pickup';
    id: string;
    label: Record<Language, string>;
    distance: number;
  } | null;
}

export type QualityPreset = 'low' | 'medium' | 'high' | 'ultra';

export interface GameSettings {
  qualityPreset: QualityPreset;
  resolutionScale: number; // 0.75 | 1 | 1.25 | 1.5 | 2
  gameplaySpeed: number; // 1 | 1.35 | 1.75
  fov: number; // 55..90
  mouseSensitivity: number; // 0.5..2.5
  invertY: boolean;
  bloomEnabled: boolean;
  masterVolume: number; // 0..1
}

export type SurfaceBuildingKind = 'habitat' | 'solar_relay' | 'science_beacon';

export interface SurfaceBuildingRecord {
  id: string;
  planetId: PlanetId;
  kind: SurfaceBuildingKind;
  x: number;
  z: number;
}

export interface MissionOutcome {
  success: boolean;
  score: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'F';
  endingTitle: Record<Language, string>;
  summary: Record<Language, string>;
  failureReason?: Record<Language, string>;
}

export interface TabletMissionPlan {
  objective: 'survey' | 'signal' | 'harvest';
  autoTransmit: boolean;
}

export type NasaResourceKey =
  | 'science_missions'
  | 'gmat'
  | 'cml'
  | 'mdl'
  | 'mission_viz'
  | 'telescope_game'
  | 'cubesat_101'
  | 'vr_mission'
  | 'csa_partner';

export interface StoryChapter {
  id: string;
  chapterNum: string;
  title: Record<Language, string>;
  subtitle: Record<Language, string>;
  narrative: Record<Language, string>;
  telemetryNote: Record<Language, string>;
  accentColor: 'cyan' | 'amber' | 'rose' | 'emerald';
}

export interface SurvivalChoiceOption {
  id: string;
  label: Record<Language, string>;
  detail: Record<Language, string>;
  isCorrect: boolean;
  feedback: Record<Language, string>;
}

export interface AstronautBioState {
  heartRateBpm: number;
  suitPressureKpa: number;
  co2MmHg: number;
  suitTempC: number;
  lcvgCoolingPct: number;
  preBreatheDone: boolean;
  tetherLocked: boolean;
  stressLevel: 'CALM' | 'FOCUSED' | 'HIGH' | 'CRITICAL';
  evaRepairsCompleted: number;
}

export interface SurvivalMissionDef {
  id: string;
  order: number;
  resourceKey: NasaResourceKey;
  resourceTag: Record<Language, string>;
  title: Record<Language, string>;
  situation: Record<Language, string>;
  prompt: Record<Language, string>;
  timeLimitSec: number;
  hullPenalty: number;
  powerPenalty: number;
  o2Penalty: number;
  rewardCredits: number;
  rewardDataMb: number;
  hullRestore: number;
  budgetRewardM?: number;
  mechanic:
    | 'choice'
    | 'gmat_burn'
    | 'mdl_balance'
    | 'mission_viz_scrub'
    | 'telescope_levels'
    | 'cubesat_sequence'
    | 'csa_alignment';
  options?: SurvivalChoiceOption[];
  // Interactive tuning parameters for specialized NASA/CSA engineering consoles
  targetRange?: {
    paramALabel: Record<Language, string>;
    paramAUnit: string;
    paramAMin: number;
    paramAMax: number;
    paramAStep: number;
    targetAMin: number;
    targetAMax: number;
    paramBLabel?: Record<Language, string>;
    paramBUnit?: string;
    paramBMin?: number;
    paramBMax?: number;
    paramBStep?: number;
    targetBMin?: number;
    targetBMax?: number;
    presetModeLabel?: Record<Language, string>;
    presetModes?: Array<{ id: string; label: Record<Language, string>; isCorrect: boolean }>;
  };
  tipsAndTricks: Record<Language, string[]>;
  quickTrick: Record<Language, string>;
  successSummary: Record<Language, string>;
  failureSummary: Record<Language, string>;
  resourceFact: Record<Language, string>;
}

export interface ActiveMissionBlueprint {
  scenarioId: string;
  scenarioTitle: Record<Language, string>;
  teamName: string;
  mode: 'solo' | 'team' | 'sandbox';
  orbitId: string;
  orbitName: Record<Language, string>;
  targetPlanetId: PlanetId;
  launcherId: string;
  launcherName: Record<Language, string>;
  busId: string;
  powerId: string;
  commsId: string;
  adcsId: string;
  instrumentIds: string[];
  totalMassKg: number;
  maxLauncherPayloadKg: number;
  powerGenW: number;
  powerDrawW: number;
  netPowerW: number;
  totalCostM: number;
  maxBudgetM: number;
  dataGenMbDay: number;
  commsCapMbDay: number;
  effectiveScience: number;
  targetScience: number;
  lifetimeYrs: number;
  minLifetimeYrs: number;
  reliabilityPct: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'F';
  score: number;
  deployedAt: number;
}

// ============================================================================
// NOVA ADVANCED ENGINEERING & OPERATIONS PLATFORM TYPES (Features 1–22)
// ============================================================================

export type SubsystemCategory14 =
  | 'propulsion'
  | 'reaction_wheels'
  | 'adcs'
  | 'star_trackers'
  | 'nav_sensors'
  | 'thermal_control'
  | 'radiation_shielding'
  | 'redundant_batteries'
  | 'backup_obc'
  | 'comms_antennas'
  | 'data_storage'
  | 'landing_systems'
  | 'solar_arrays'
  | 'structural_bus';

export interface SubsystemItem14 {
  id: string;
  category: SubsystemCategory14;
  name: Record<Language, string>;
  desc: Record<Language, string>;
  costM: number;
  creditPrice: number;
  massKg: number;
  powerDeltaW: number; // positive = generates W, negative = consumes W
  reliabilityBonus: number; // % points
  thermalResistK: number; // K margin
  radShieldKrad: number; // krad tolerance contribution
  dataCapMbDay: number;
  storageCapMb: number;
  deltaVKms: number;
  ispSec: number;
  pointingArcsec: number;
  techTier: 1 | 2 | 3;
  requiredTechId?: string;
  maintenanceCr: number;
  incompatibleWith?: string[];
  recommendedNote?: Record<Language, string>;
}

export type AdvancedLoadout = Record<SubsystemCategory14, string>;

export type OperationalMode =
  | 'nominal'
  | 'safe'
  | 'science_burst'
  | 'comms_downlink'
  | 'low_power';

export type TransmissionPriority =
  | 'critical_telemetry'
  | 'high_value_science'
  | 'compressed_bulk';

export type TransferStrategy = 'hohmann' | 'fast_burn' | 'gravity_assist';

export type EngineeringConflictSeverity = 'critical' | 'warning' | 'advisory';

export interface EngineeringConflict {
  id: string;
  severity: EngineeringConflictSeverity;
  subsystem: SubsystemCategory14 | 'budget' | 'power' | 'thermal' | 'comms' | 'structural' | 'propulsion';
  title: Record<Language, string>;
  explanation: Record<Language, string>;
  fixHint: Record<Language, string>;
}

export interface EngineeringTradeoffReport {
  planetId: PlanetId;
  transferStrategy: TransferStrategy;
  operationalMode: OperationalMode;
  feasible: boolean;
  feasibilityScore: number; // 0..100
  dryMassKg: number;
  propellantMassKg: number;
  wetMassKg: number;
  totalCostM: number;
  maxBudgetM: number;
  maintenanceCostCr: number;
  powerGenW: number;
  powerDrawW: number;
  netPowerW: number;
  thermalEqTempC: number;
  internalTempC: number;
  thermalSafeRangeC: [number, number];
  thermalMarginPct: number;
  deltaVRequiredKms: number;
  deltaVAvailableKms: number;
  deltaVMarginKms: number;
  transitDays: number;
  launchWindowDeg: number;
  dataGenMbDay: number;
  storageCapacityMb: number;
  commsCapacityMbDay: number;
  daysUntilBufferFull: number;
  scienceValue: number;
  structuralMarginPct: number;
  radiationToleranceKradYr: number;
  orbitRadiationKradYr: number;
  reliabilityPct: number;
  riskScore: number; // 0..100 (lower = safer)
  missionLifetimeYrs: number;
  conflicts: EngineeringConflict[];
  compatibilityIssues: string[];
  dataSourceLegend: {
    physicsModel: string;
    referenceAccuracyNote: string;
  };
}

export interface WhatIfParameters {
  massDeltaPct: number; // e.g. 0 or 20
  powerDeltaPct: number; // e.g. 0 or -30
  engineFailure: boolean;
  commsBlackoutHours: number;
  durationMultiplier: number; // e.g. 1.0 or 1.5
  instrumentFailedCount: number;
  solarStormActive: boolean;
}

export interface WhatIfComparisonResult {
  tag: 'SIMULATED_COUNTERFACTUAL';
  baseline: {
    successProbabilityPct: number;
    fuelConsumptionPct: number;
    missionCostM: number;
    durationYrs: number;
    scienceAchievement: number;
    reliabilityPct: number;
    engineeringRisk: number;
  };
  simulated: {
    successProbabilityPct: number;
    fuelConsumptionPct: number;
    missionCostM: number;
    durationYrs: number;
    scienceAchievement: number;
    reliabilityPct: number;
    engineeringRisk: number;
  };
  keyImpacts: Array<Record<Language, string>>;
}

export type DynamicEventType =
  | 'solar_storm'
  | 'micrometeorite'
  | 'comms_interruption'
  | 'battery_degradation'
  | 'engine_malfunction'
  | 'nav_error'
  | 'thermal_failure'
  | 'power_spike'
  | 'dust_storm'
  | 'sensor_malfunction'
  | 'fuel_leak'
  | 'equipment_overheat';

export interface DynamicEventResponseOption {
  id: string;
  label: Record<Language, string>;
  detail: Record<Language, string>;
  creditCost: number;
  powerDelta: number;
  hullDelta: number;
  fuelDelta: number;
  tempDeltaC: number;
  o2Delta: number;
  resolvesEvent: boolean;
  autonomousAllowed: boolean;
}

export interface ActiveMissionEvent {
  id: string;
  type: DynamicEventType;
  triggeredAt: number;
  title: Record<Language, string>;
  description: Record<Language, string>;
  affectedSubsystem: string;
  severity: 'caution' | 'warning' | 'critical';
  triggerBasis: Record<Language, string>;
  recoveryCondition: Record<Language, string>;
  options: DynamicEventResponseOption[];
}

export interface MissionTimelineLogEntry {
  id: string;
  timestamp: number;
  solTime: number;
  phase: number;
  source: 'player' | 'autonomous' | 'system' | 'event';
  summary: Record<Language, string>;
}

export interface FailureInvestigationReport {
  id: string;
  generatedAt: number;
  summary: Record<Language, string>;
  failedSubsystem: string;
  rootCause: Record<Language, string>;
  contributingDecisions: Array<Record<Language, string>>;
  preFailureSnapshot: {
    battery: number;
    fuelPct: number;
    hullIntegrity: number;
    internalTempC: number;
    suitO2: number;
    commsSignal: number;
    dataStorageMb: number;
    netPowerW: number;
  };
  importantTimeline: MissionTimelineLogEntry[];
  recoveryPossibilities: Array<Record<Language, string>>;
  recommendedImprovements: Array<Record<Language, string>>;
}

export interface MissionPerformanceReport {
  id: string;
  versionLabel: string;
  timestamp: number;
  planetId: PlanetId;
  objective: string;
  finalConfiguration: AdvancedLoadout;
  orbitSummary: string;
  scienceAchieved: number;
  resourcesConsumedPct: number;
  totalCostM: number;
  budgetCeilingM: number;
  powerEfficiencyPct: number;
  commsPerformancePct: number;
  missionLifetimeYrs: number;
  majorIncidents: string[];
  subsystemStatus: Array<{ name: string; status: 'NOMINAL' | 'DEGRADED' | 'FAILED'; healthPct: number }>;
  finalGrade: 'S' | 'A' | 'B' | 'C' | 'F';
  score: number;
  recommendations: Array<Record<Language, string>>;
}

export interface AutonomousRulesConfig {
  enabled: boolean;
  lowBatteryThresholdPct: number; // triggers Low-Power / Safe mode
  overheatThresholdC: number; // triggers radiator dump & instrument shed
  onCommsLossStoreAndRetry: boolean;
  onNavErrorSwitchBackupObc: boolean;
  onCriticalFailureEnterSafeMode: boolean;
}

export type TeamRoleV2 =
  | 'commander'
  | 'systems_engineer'
  | 'science_officer'
  | 'flight_director';

export interface CooperativeTeamMember {
  id: number;
  name: string;
  role: TeamRoleV2;
  approved: boolean;
}

export interface InstructorAssignment {
  id: string;
  title: Record<Language, string>;
  targetPlanetId: PlanetId;
  maxBudgetM: number;
  minSciencePts: number;
  minReliabilityPct: number;
  requiredNotes: Record<Language, string>;
  createdAt: number;
}

export interface DigitalTwinVisualState {
  solarScale: number;
  hasRtg: boolean;
  dishTier: 1 | 2 | 3;
  hasThermalArmor: boolean;
  activeScienceBeam: boolean;
  hullIntegrity: number;
  operationalMode: OperationalMode;
  commsHealthy: boolean;
  commsSignalPct: number;
  powerDeficit: boolean;
}


