import assert from 'node:assert/strict';
import test from 'node:test';
import type {
  DynamicEventType,
  PlanetId,
} from '../../types/game';
import {
  deriveDigitalTwinState,
  evaluateSpacecraftArchitecture,
  evaluateTransferRoutes,
  runWhatIfScenario,
} from '../engineeringTradeoffEngine';
import {
  MISSION_LIFECYCLE_12,
  buildMissionPerformanceReport,
  evaluateAutonomousAction,
  generateContextualDynamicEvent,
  generateFailureInvestigationReport,
} from '../missionOpsEngine';
import {
  PLANETARY_ENVIRONMENTS,
  getPlanetEnvironment,
} from '../planetaryEnvironments';
import { generateEngineeringSkyReply } from '../skyEngineeringAi';
import {
  DEFAULT_ADVANCED_LOADOUT,
  NASA_RECREATION_MISSIONS,
  SUBSYSTEM_CATEGORIES_META,
  SUBSYSTEM_CATALOG_14,
  TECH_TREE_NODES,
} from '../subsystemsCatalog';
import { useGameStore } from '../../store/gameStore';

const ALL_PLANETS: PlanetId[] = [
  'mercury',
  'solaris',
  'aurora',
  'luna',
  'mars',
  'aetheris',
  'obsidian',
  'uranus',
  'neptune',
];

const ALL_DYNAMIC_EVENTS: DynamicEventType[] = [
  'solar_storm',
  'micrometeorite',
  'comms_interruption',
  'battery_degradation',
  'engine_malfunction',
  'nav_error',
  'thermal_failure',
  'power_spike',
  'dust_storm',
  'sensor_malfunction',
  'fuel_leak',
  'equipment_overheat',
];

test('Planetary Environments cover all 9 worlds with realistic physical constraints', () => {
  for (const id of ALL_PLANETS) {
    const env = getPlanetEnvironment(id);
    assert.equal(env.planetId, id);
    assert.ok(env.heliocentricAu > 0);
    assert.ok(env.gravityMs2 > 0);
    assert.ok(env.surfaceTempRangeC[0] < env.surfaceTempRangeC[1]);
    assert.ok(env.surfaceCondition.en.length > 0 && env.surfaceCondition.ar.length > 0);
  }
  assert.equal(Object.keys(PLANETARY_ENVIRONMENTS).length, 9);
  assert.equal(getPlanetEnvironment('solaris').pressureBar, 92);
  assert.ok(getPlanetEnvironment('aetheris').radiationKradYr >= 180);
  assert.ok(getPlanetEnvironment('neptune').solarEfficiency <= 0.02);
});

test('14-Subsystem catalog, tech tree & 6 NASA recreations are complete and valid', () => {
  assert.equal(SUBSYSTEM_CATEGORIES_META.length, 14);
  for (const cat of SUBSYSTEM_CATEGORIES_META) {
    const items = SUBSYSTEM_CATALOG_14.filter((item) => item.category === cat.id);
    assert.ok(items.length >= 2, `Expected >=2 options in ${cat.id}`);
  }
  assert.equal(TECH_TREE_NODES.length, 8);
  assert.equal(NASA_RECREATION_MISSIONS.length, 6);
});

test('Transfer route optimization orders Δv and transit duration logically', () => {
  const routes = evaluateTransferRoutes('mars', 1200, 390);
  const grav = routes.find((r) => r.strategy === 'gravity_assist')!;
  const hohmann = routes.find((r) => r.strategy === 'hohmann')!;
  const fast = routes.find((r) => r.strategy === 'fast_burn')!;

  assert.ok(grav.deltaVKms < hohmann.deltaVKms);
  assert.ok(hohmann.deltaVKms < fast.deltaVKms);
  assert.ok(fast.transitDays < hohmann.transitDays);
  assert.ok(hohmann.transitDays < grav.transitDays);
  assert.ok(fast.propellantMassKg > grav.propellantMassKg);
});

test('Engineering Trade-off Engine models interconnected mass, power, comms, thermal & compatibility', () => {
  // Europa (aetheris) with standard solar + single aluminum bus should expose power/radiation/comms conflicts
  const weakEuropa = evaluateSpacecraftArchitecture({
    planetId: 'aetheris',
    loadout: {
      ...DEFAULT_ADVANCED_LOADOUT,
      solar_arrays: 'pwr14_std_solar',
      comms_antennas: 'ant_sband_patch',
    },
    instrumentIds: ['inst_radar', 'inst_mag', 'inst_ir'],
    operationalMode: 'nominal',
    transferStrategy: 'hohmann',
    stationId: 'goldstone',
    compressionMode: 'raw',
    fidelityMode: 'high_fidelity',
    maxBudgetM: 400,
    sandboxUnrestricted: false,
  });

  assert.equal(weakEuropa.feasible, false);
  const conflictIds = weakEuropa.conflicts.map((c) => c.id);
  assert.ok(conflictIds.includes('conflict_power'));
  assert.ok(conflictIds.includes('conflict_radiation'));
  assert.ok(conflictIds.includes('conflict_comms'));

  // Upgrading to MMRTG + Tantalum Vault + Ka-Band + Active Louvers + Cryo-Hall + RAD750 resolves core blockers
  const hardenedEuropa = evaluateSpacecraftArchitecture({
    planetId: 'aetheris',
    loadout: {
      ...DEFAULT_ADVANCED_LOADOUT,
      propulsion: 'prop_cryo_hall',
      solar_arrays: 'pwr14_mmrtg',
      comms_antennas: 'ant_kaband_deep',
      data_storage: 'ssr_rad_flash',
      thermal_control: 'thm_active_louvers',
      radiation_shielding: 'rad_tantalum_vault',
      backup_obc: 'obc_dual_radhard',
      redundant_batteries: 'bat_dual_solid',
    },
    instrumentIds: ['inst_radar', 'inst_mag', 'inst_ir'],
    operationalMode: 'nominal',
    transferStrategy: 'gravity_assist',
    stationId: 'goldstone',
    compressionMode: 'lossless_ccsds',
    fidelityMode: 'high_fidelity',
    maxBudgetM: 800,
    sandboxUnrestricted: false,
  });

  assert.ok(hardenedEuropa.netPowerW > weakEuropa.netPowerW);
  assert.ok(hardenedEuropa.commsCapacityMbDay > weakEuropa.commsCapacityMbDay);
  assert.ok(hardenedEuropa.radiationToleranceKradYr >= 200);
  assert.ok(hardenedEuropa.feasibilityScore > weakEuropa.feasibilityScore);

  // Solaris 92-bar surface incompatibility check
  const solarisOrbital = evaluateSpacecraftArchitecture({
    planetId: 'solaris',
    loadout: { ...DEFAULT_ADVANCED_LOADOUT, landing_systems: 'edl_orbital_only' },
    instrumentIds: ['inst_cam'],
    operationalMode: 'nominal',
    transferStrategy: 'hohmann',
    stationId: 'goldstone',
    compressionMode: 'raw',
    fidelityMode: 'approximation',
    maxBudgetM: 400,
  });
  assert.ok(solarisOrbital.conflicts.some((c) => c.id === 'conflict_edl_pressure'));
  assert.ok(solarisOrbital.compatibilityIssues.length > 0);
});

test('What-If counterfactual simulator computes accurate side-by-side deltas without mutating baseline', () => {
  const baseInput = {
    planetId: 'mars' as PlanetId,
    loadout: {
      ...DEFAULT_ADVANCED_LOADOUT,
      propulsion: 'prop_biprop_vasimir',
      solar_arrays: 'pwr14_mmrtg',
      comms_antennas: 'ant_xband_dish',
      thermal_control: 'thm_active_louvers',
    },
    instrumentIds: ['inst_cam', 'inst_ir'],
    operationalMode: 'nominal' as const,
    transferStrategy: 'hohmann' as const,
    stationId: 'goldstone',
    compressionMode: 'raw' as const,
    fidelityMode: 'high_fidelity' as const,
    maxBudgetM: 500,
  };

  const sim = runWhatIfScenario(baseInput, {
    massDeltaPct: 20,
    powerDeltaPct: -30,
    engineFailure: true,
    commsBlackoutHours: 14,
    durationMultiplier: 1.5,
    instrumentFailedCount: 1,
    solarStormActive: true,
  });

  assert.equal(sim.tag, 'SIMULATED_COUNTERFACTUAL');
  assert.ok(sim.simulated.successProbabilityPct < sim.baseline.successProbabilityPct);
  assert.ok(sim.simulated.scienceAchievement < sim.baseline.scienceAchievement);
  assert.ok(sim.simulated.fuelConsumptionPct >= sim.baseline.fuelConsumptionPct);
  assert.ok(sim.simulated.engineeringRisk > sim.baseline.engineeringRisk);
  assert.ok(sim.keyImpacts.length >= 3);
});

test('Mission Lifecycle has 12 phases & Dynamic Events cover all 12 contextual event types', () => {
  assert.equal(MISSION_LIFECYCLE_12.length, 12);
  const tradeOff = evaluateSpacecraftArchitecture({
    planetId: 'mars',
    loadout: DEFAULT_ADVANCED_LOADOUT,
    instrumentIds: ['inst_cam', 'inst_radar'],
    operationalMode: 'nominal',
    transferStrategy: 'hohmann',
    stationId: 'goldstone',
    compressionMode: 'raw',
    fidelityMode: 'approximation',
    maxBudgetM: 400,
  });

  for (const evtType of ALL_DYNAMIC_EVENTS) {
    const evt = generateContextualDynamicEvent({
      planetId: 'mars',
      loadout: DEFAULT_ADVANCED_LOADOUT,
      tradeOff,
      resources: {
        budget: 250,
        mass: 900,
        powerGeneration: 500,
        powerConsumption: 400,
        battery: 35,
        dataStorage: 100,
        maxStorage: 450,
        dataCollected: 120,
        dataTransmitted: 80,
        commsStation: 'Goldstone',
        commsSignal: 65,
        solTime: 4.5,
        suitO2: 90,
        suitHealth: 100,
        suitCoolant: 100,
        credits: 500,
      },
      hullIntegrity: 55,
      internalTempC: 54,
      forcedType: evtType,
    });
    assert.equal(evt.type, evtType);
    assert.ok(evt.title.en.length > 0 && evt.title.ar.length > 0);
    assert.ok(evt.options.length >= 1);
    assert.ok(evt.affectedSubsystem.length > 0);
  }
});

test('Autonomous Rules Engine triggers safe transitions accurately', () => {
  const autoLowBat = evaluateAutonomousAction({
    rules: {
      enabled: true,
      lowBatteryThresholdPct: 22,
      overheatThresholdC: 50,
      onCommsLossStoreAndRetry: true,
      onNavErrorSwitchBackupObc: true,
      onCriticalFailureEnterSafeMode: true,
    },
    battery: 18,
    internalTempC: 24,
    commsSignal: 80,
    hullIntegrity: 95,
    operationalMode: 'nominal',
    activeEvent: null,
  });
  assert.equal(autoLowBat?.nextMode, 'low_power');

  const autoHeat = evaluateAutonomousAction({
    rules: {
      enabled: true,
      lowBatteryThresholdPct: 20,
      overheatThresholdC: 48,
      onCommsLossStoreAndRetry: true,
      onNavErrorSwitchBackupObc: true,
      onCriticalFailureEnterSafeMode: true,
    },
    battery: 80,
    internalTempC: 52,
    commsSignal: 80,
    hullIntegrity: 95,
    operationalMode: 'science_burst',
    activeEvent: null,
  });
  assert.equal(autoHeat?.nextMode, 'safe');
  assert.equal(autoHeat?.tempAdjustmentC, -12);
});

test('Failure Investigation & Performance Report generators capture root causes cleanly', () => {
  const tradeOff = evaluateSpacecraftArchitecture({
    planetId: 'aetheris',
    loadout: DEFAULT_ADVANCED_LOADOUT,
    instrumentIds: ['inst_radar'],
    operationalMode: 'nominal',
    transferStrategy: 'hohmann',
    stationId: 'goldstone',
    compressionMode: 'raw',
    fidelityMode: 'high_fidelity',
    maxBudgetM: 300,
  });
  const resources = {
    budget: 300,
    mass: 900,
    powerGeneration: 200,
    powerConsumption: 450,
    battery: 0,
    dataStorage: 400,
    maxStorage: 450,
    dataCollected: 500,
    dataTransmitted: 120,
    commsStation: 'Goldstone' as const,
    commsSignal: 45,
    solTime: 9,
    suitO2: 75,
    suitHealth: 60,
    suitCoolant: 80,
    credits: 200,
  };

  const failure = generateFailureInvestigationReport({
    reason: { ar: 'نفاد الطاقة', en: 'Bus Power Collapse' },
    planetId: 'aetheris',
    loadout: DEFAULT_ADVANCED_LOADOUT,
    tradeOff,
    resources,
    fuelPct: 40,
    hullIntegrity: 60,
    internalTempC: -35,
    timelineLog: [],
  });

  assert.equal(failure.failedSubsystem, 'Power Generation & Batteries');
  assert.ok(failure.contributingDecisions.length > 0);
  assert.ok(failure.recommendedImprovements.length > 0);

  const perf = buildMissionPerformanceReport({
    versionLabel: 'v1.0-TEST',
    planetId: 'aetheris',
    objective: 'survey',
    loadout: DEFAULT_ADVANCED_LOADOUT,
    tradeOff,
    resources,
    fuelPct: 40,
    hullIntegrity: 60,
    score: 420,
    grade: 'C',
    incidents: ['Solar Proton Storm'],
  });
  assert.equal(perf.versionLabel, 'v1.0-TEST');
  assert.equal(perf.subsystemStatus.length, 4);
  assert.ok(perf.scienceAchieved > 0);
});

test('Sky Engineering AI answers diagnostics & Europa optimization from live state', () => {
  const tradeOff = evaluateSpacecraftArchitecture({
    planetId: 'aetheris',
    loadout: DEFAULT_ADVANCED_LOADOUT,
    instrumentIds: ['inst_radar', 'inst_ir'],
    operationalMode: 'nominal',
    transferStrategy: 'hohmann',
    stationId: 'goldstone',
    compressionMode: 'raw',
    fidelityMode: 'high_fidelity',
    maxBudgetM: 350,
  });

  const ctx = {
    lang: 'en' as const,
    commanderName: 'Commander',
    planetId: 'aetheris' as PlanetId,
    loadout: DEFAULT_ADVANCED_LOADOUT,
    tradeOff,
    resources: useGameStore.getState().resources,
    hullIntegrity: 95,
    fuelPct: 88,
    internalTempC: -22,
    operationalMode: 'nominal' as const,
    lifecyclePhase: 5,
    activeEvent: null,
    lastFailureReport: null,
  };

  const failReply = generateEngineeringSkyReply('Why is my mission failing?', ctx);
  assert.equal(failReply.mood, 'warning');
  assert.match(failReply.text, /conflict|blocker/i);

  const europaReply = generateEngineeringSkyReply('How do I improve my Europa mission?', ctx);
  assert.match(europaReply.text, /MMRTG|Tantalum|Ka-Band/i);

  const commReply = generateEngineeringSkyReply('Analyze comms bottleneck and DSN', ctx);
  assert.match(commReply.text, /MB\/d/i);
});

test('Zustand store actions synchronize 2D engineering state and 3D Digital Twin state', () => {
  const store = useGameStore.getState();

  // Grant enough credits & research points for test actions cleanly
  useGameStore.setState({
    researchPoints: 500,
    resources: { ...store.resources, credits: 5000, budget: 900 },
  });

  useGameStore.getState().unlockTechNode('tech_mmrtg');
  assert.ok(useGameStore.getState().unlockedTechIds.includes('tech_mmrtg'));
  assert.ok(useGameStore.getState().unlockedSubsystemIds.includes('pwr14_mmrtg'));

  useGameStore.getState().equipSubsystem14('pwr14_mmrtg');
  assert.equal(useGameStore.getState().advancedLoadout.solar_arrays, 'pwr14_mmrtg');
  assert.equal(useGameStore.getState().digitalTwinState.hasRtg, true);

  useGameStore.getState().equipSubsystem14('ant_kaband_deep');
  assert.equal(useGameStore.getState().digitalTwinState.dishTier, 3);

  useGameStore.getState().setOperationalMode('science_burst');
  assert.equal(useGameStore.getState().operationalMode, 'science_burst');
  assert.equal(useGameStore.getState().digitalTwinState.operationalMode, 'science_burst');

  useGameStore.getState().triggerDynamicEvent('solar_storm');
  const activeEvt = useGameStore.getState().activeMissionEvent;
  assert.ok(activeEvt && activeEvt.type === 'solar_storm');

  useGameStore.getState().resolveDynamicEvent(activeEvt.options[0].id);
  assert.equal(useGameStore.getState().activeMissionEvent, null);

  useGameStore.getState().applyNasaRecreation('rec_europa_clipper');
  assert.equal(useGameStore.getState().activePlanet, 'aetheris');
  assert.equal(useGameStore.getState().advancedLoadout.radiation_shielding, 'rad_tantalum_vault');
  assert.equal(useGameStore.getState().digitalTwinState.hasThermalArmor, true);

  const prevCount = useGameStore.getState().performanceHistory.length;
  useGameStore.getState().recordPerformanceSnapshot('v-Verify');
  assert.equal(useGameStore.getState().performanceHistory.length, prevCount + 1);
  assert.equal(useGameStore.getState().performanceHistory[0].versionLabel, 'v-Verify');

  const derived = deriveDigitalTwinState({
    loadout: useGameStore.getState().advancedLoadout,
    operationalMode: 'low_power',
    instrumentActiveMap: { inst_cam: true },
    hullIntegrity: 75,
    commsSignalPct: 25,
    netPowerW: -20,
  });
  assert.equal(derived.activeScienceBeam, false);
  assert.equal(derived.commsHealthy, false);
  assert.equal(derived.powerDeficit, true);
});
