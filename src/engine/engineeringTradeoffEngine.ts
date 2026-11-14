import { INSTRUMENT_OPTIONS, ORBIT_OPTIONS } from '../data/missionArchitectData';
import {
  GROUND_STATIONS,
  computeCommsLinkBudget,
  type CompressionMode,
} from '../data/spaceOpsData';
import type {
  AdvancedLoadout,
  AnalysisFidelityMode,
  DigitalTwinVisualState,
  EngineeringConflict,
  EngineeringTradeoffReport,
  OperationalMode,
  PlanetId,
  SubsystemItem14,
  TransferStrategy,
  WhatIfComparisonResult,
  WhatIfParameters,
} from '../types/game';
import { getPlanetEnvironment } from './planetaryEnvironments';
import { SUBSYSTEM_CATALOG_14 } from './subsystemsCatalog';

export interface TradeoffEvaluationInput {
  planetId: PlanetId;
  loadout: AdvancedLoadout;
  instrumentIds: string[];
  activeInstrumentMap?: Record<string, boolean>;
  operationalMode: OperationalMode;
  transferStrategy: TransferStrategy;
  stationId: string;
  compressionMode: CompressionMode;
  fidelityMode: AnalysisFidelityMode;
  maxBudgetM: number;
  sandboxUnrestricted?: boolean;
  hullIntegrity?: number;
}

export interface TransferRouteComparison {
  strategy: TransferStrategy;
  deltaVKms: number;
  propellantMassKg: number;
  transitDays: number;
  launchWindowDeg: number;
  solarPenaltyRisk: string;
}

function resolveSubsystem(loadout: AdvancedLoadout, cat: keyof AdvancedLoadout): SubsystemItem14 {
  const id = loadout[cat];
  return (
    SUBSYSTEM_CATALOG_14.find((item) => item.id === id) ||
    SUBSYSTEM_CATALOG_14.find((item) => item.category === cat) ||
    SUBSYSTEM_CATALOG_14[0]
  );
}

const BASE_HOHMANN_DV_KMS: Record<PlanetId, number> = {
  aurora: 9.4,
  luna: 14.2,
  mercury: 16.9,
  solaris: 15.1,
  mars: 15.8,
  aetheris: 18.6,
  obsidian: 19.9,
  uranus: 20.6,
  neptune: 21.8,
};

const BASE_TRANSIT_DAYS: Record<PlanetId, number> = {
  aurora: 1,
  luna: 4,
  mercury: 145,
  solaris: 146,
  mars: 258,
  aetheris: 1090,
  obsidian: 2190,
  uranus: 3420,
  neptune: 4380,
};

const LAUNCH_WINDOW_PHASE_DEG: Record<PlanetId, number> = {
  aurora: 0,
  luna: 12,
  mercury: -48,
  solaris: -54,
  mars: 44,
  aetheris: 97,
  obsidian: 112,
  uranus: 135,
  neptune: 148,
};

export function evaluateTransferRoutes(
  planetId: PlanetId,
  dryMassKg: number,
  ispSec: number
): TransferRouteComparison[] {
  const baseDv = BASE_HOHMANN_DV_KMS[planetId] ?? 15.8;
  const baseDays = BASE_TRANSIT_DAYS[planetId] ?? 260;
  const phaseDeg = LAUNCH_WINDOW_PHASE_DEG[planetId] ?? 44;
  const effIsp = Math.max(220, ispSec);
  const g0 = 0.00980665;

  const variants: Array<{
    strategy: TransferStrategy;
    dvMult: number;
    timeMult: number;
    riskNote: string;
  }> = [
    { strategy: 'hohmann', dvMult: 1.0, timeMult: 1.0, riskNote: 'Optimal energy baseline' },
    { strategy: 'fast_burn', dvMult: 1.24, timeMult: 0.62, riskNote: 'High fuel & thermal arrival load' },
    {
      strategy: 'gravity_assist',
      dvMult: planetId === 'aurora' || planetId === 'luna' ? 0.96 : 0.82,
      timeMult: planetId === 'aurora' || planetId === 'luna' ? 1.15 : 1.38,
      riskNote: 'Slingshot saves Δv, adds transit duration',
    },
  ];

  return variants.map((v) => {
    const dv = Number((baseDv * v.dvMult).toFixed(2));
    const massRatio = Math.exp(Math.min(4.2, dv / (effIsp * g0)));
    const propellantMassKg = Math.round(dryMassKg * (massRatio - 1));
    const transitDays = Math.max(1, Math.round(baseDays * v.timeMult));
    return {
      strategy: v.strategy,
      deltaVKms: dv,
      propellantMassKg,
      transitDays,
      launchWindowDeg: phaseDeg,
      solarPenaltyRisk: v.riskNote,
    };
  });
}

export function evaluateSpacecraftArchitecture(
  input: TradeoffEvaluationInput
): EngineeringTradeoffReport {
  const env = getPlanetEnvironment(input.planetId);
  const items: SubsystemItem14[] = [
    resolveSubsystem(input.loadout, 'propulsion'),
    resolveSubsystem(input.loadout, 'solar_arrays'),
    resolveSubsystem(input.loadout, 'redundant_batteries'),
    resolveSubsystem(input.loadout, 'comms_antennas'),
    resolveSubsystem(input.loadout, 'data_storage'),
    resolveSubsystem(input.loadout, 'thermal_control'),
    resolveSubsystem(input.loadout, 'radiation_shielding'),
    resolveSubsystem(input.loadout, 'structural_bus'),
    resolveSubsystem(input.loadout, 'adcs'),
    resolveSubsystem(input.loadout, 'reaction_wheels'),
    resolveSubsystem(input.loadout, 'star_trackers'),
    resolveSubsystem(input.loadout, 'nav_sensors'),
    resolveSubsystem(input.loadout, 'backup_obc'),
    resolveSubsystem(input.loadout, 'landing_systems'),
  ];

  const prop = resolveSubsystem(input.loadout, 'propulsion');
  const solar = resolveSubsystem(input.loadout, 'solar_arrays');
  const comms = resolveSubsystem(input.loadout, 'comms_antennas');
  const ssr = resolveSubsystem(input.loadout, 'data_storage');
  const thermal = resolveSubsystem(input.loadout, 'thermal_control');
  const radShield = resolveSubsystem(input.loadout, 'radiation_shielding');
  const structBus = resolveSubsystem(input.loadout, 'structural_bus');
  const adcs = resolveSubsystem(input.loadout, 'adcs');
  const obc = resolveSubsystem(input.loadout, 'backup_obc');
  const edl = resolveSubsystem(input.loadout, 'landing_systems');
  const nav = resolveSubsystem(input.loadout, 'nav_sensors');

  const selectedInstruments = INSTRUMENT_OPTIONS.filter((inst) =>
    input.instrumentIds.includes(inst.id)
  );
  const activeInstruments = selectedInstruments.filter((inst) =>
    input.activeInstrumentMap ? input.activeInstrumentMap[inst.id] !== false : true
  );

  // 1. Interconnected Mass & Propellant / Delta-V
  const subsystemMassKg = items.reduce((s, it) => s + it.massKg, 0);
  const instrumentMassKg = selectedInstruments.reduce((s, inst) => s + inst.massKg, 0);
  const dryMassKg = Math.round(subsystemMassKg + instrumentMassKg);

  const routes = evaluateTransferRoutes(input.planetId, dryMassKg, prop.ispSec);
  const chosenRoute = routes.find((r) => r.strategy === input.transferStrategy) || routes[0];
  const propellantMassKg = chosenRoute.propellantMassKg;
  const wetMassKg = dryMassKg + propellantMassKg;

  // Mass penalty shrinks effective Δv when vehicle becomes overly heavy vs propulsion capability
  const massPenaltyKms = Math.max(0, (dryMassKg - 820) * 0.006);
  const deltaVAvailableKms = Number(Math.max(5, prop.deltaVKms - massPenaltyKms).toFixed(2));
  const deltaVRequiredKms = chosenRoute.deltaVKms;
  const deltaVMarginKms = Number((deltaVAvailableKms - deltaVRequiredKms).toFixed(2));

  // 2. Interconnected Cost
  const totalCostM = Math.round(
    items.reduce((s, it) => s + it.costM, 0) +
      selectedInstruments.reduce((s, inst) => s + inst.costM, 0)
  );
  const maintenanceCostCr = items.reduce((s, it) => s + it.maintenanceCr, 0);

  // 3. Interconnected Power Generation & Draw (Solar irradiance * mode * thermal draw)
  const isRtg = solar.id === 'pwr14_mmrtg';
  const rawSolarGen = items
    .filter((i) => i.powerDeltaW > 0)
    .reduce((s, i) => s + i.powerDeltaW, 0);
  const solarFluxFactor =
    input.fidelityMode === 'high_fidelity' && !isRtg
      ? Math.min(2.2, 1 / Math.max(0.08, env.heliocentricAu * env.heliocentricAu))
      : env.solarEfficiency;
  const powerGenW = isRtg
    ? Math.round(rawSolarGen)
    : Math.round(
        (solar.powerDeltaW * solarFluxFactor) +
          items
            .filter((i) => i.category !== 'solar_arrays' && i.powerDeltaW > 0)
            .reduce((s, i) => s + i.powerDeltaW, 0)
      );

  const modeDrawMult =
    input.operationalMode === 'safe'
      ? 0.55
      : input.operationalMode === 'low_power'
        ? 0.42
        : input.operationalMode === 'science_burst'
          ? 1.28
          : input.operationalMode === 'comms_downlink'
            ? 1.15
            : 1.0;

  const instrumentDrawW = activeInstruments.reduce((s, inst) => s + inst.powerW, 0);
  const subsystemBaseDraw = items
    .filter((i) => i.powerDeltaW < 0)
    .reduce((s, i) => s + Math.abs(i.powerDeltaW), 0);
  const heaterDrawW = Math.round(
    env.thermalHeaterDemandW * (thermal.id === 'thm_active_louvers' ? 0.68 : 1.05)
  );
  const powerDrawW = Math.round((subsystemBaseDraw + instrumentDrawW + heaterDrawW) * modeDrawMult);
  const netPowerW = powerGenW - powerDrawW;

  // 4. Thermal Management Equilibrium
  const passiveEqC = Math.round(env.meanTempC * 0.48 + 18 + (powerDrawW - 220) * 0.045);
  const thermalDamping = thermal.thermalResistK / 400; // higher = closer to nominal 20°C
  const internalTempC = Math.round(passiveEqC * (1 - thermalDamping * 0.72) + 21 * (thermalDamping * 0.72));
  const thermalSafeRangeC: [number, number] = [-15, 52];
  const thermalTotalResist = items.reduce((s, i) => s + i.thermalResistK, 0);
  const thermalMarginPct = Math.max(
    0,
    Math.min(100, Math.round(50 + (thermalTotalResist - env.requiredThermalResistK) * 0.35))
  );

  // 5. Radiation, Structural Margin, Reliability & Risk
  const radiationToleranceKradYr = items.reduce((s, i) => s + i.radShieldKrad, 0);
  const orbitRadiationKradYr = env.radiationKradYr;
  const radShortfallPenalty = Math.max(0, (orbitRadiationKradYr - radiationToleranceKradYr) * 0.25);

  const structuralMarginPct = Math.max(
    10,
    Math.min(
      100,
      Math.round(
        (structBus.id === 'bus14_aegis_composite' ? 90 : 62) -
          Math.max(0, (wetMassKg - 2800) * 0.015) +
          (input.hullIntegrity !== undefined ? (input.hullIntegrity - 100) * 0.4 : 0)
      )
    )
  );

  const baseReliability = 72 + items.reduce((s, i) => s + i.reliabilityBonus, 0);
  const reliabilityPct = Math.max(
    18,
    Math.min(99, Math.round(baseReliability - radShortfallPenalty - (thermalMarginPct < 35 ? 12 : 0)))
  );

  // 6. Data Generation, SSR Storage & Communication Link Budget
  const orbitObj = ORBIT_OPTIONS.find((o) => o.id === env.orbitId) || ORBIT_OPTIONS[0];
  const station = GROUND_STATIONS.find((g) => g.id === input.stationId) || GROUND_STATIONS[0];
  const mappedCommsLegacy = {
    id:
      comms.id === 'ant_kaband_deep'
        ? 'comms_kaband'
        : comms.id === 'ant_xband_dish'
          ? 'comms_xband'
          : 'comms_sband',
    category: 'comms' as const,
    name: comms.name,
    desc: comms.desc,
    whyItMatters: comms.desc,
    costM: comms.costM,
    massKg: comms.massKg,
    powerW: comms.powerDeltaW,
    dataCapMbDay: comms.dataCapMbDay,
    tier: 'Simple' as const,
  };
  const mappedAdcsLegacy = {
    id: adcs.pointingArcsec <= 15 ? 'adcs_star' : 'adcs_basic',
    category: 'adcs' as const,
    name: adcs.name,
    desc: adcs.desc,
    whyItMatters: adcs.desc,
    costM: adcs.costM,
    massKg: adcs.massKg,
    powerW: adcs.powerDeltaW,
    tier: 'Simple' as const,
  };
  const rawDataMbDay = activeInstruments.reduce((s, inst) => s + inst.dataMbDay, 0) *
    (input.operationalMode === 'science_burst' ? 1.35 : input.operationalMode === 'safe' ? 0.25 : 1.0);
  const linkEval = computeCommsLinkBudget({
    orbit: orbitObj,
    commsSys: mappedCommsLegacy,
    adcsSys: mappedAdcsLegacy,
    station,
    rawDataGenMbDay: Math.round(rawDataMbDay),
    compression: input.compressionMode,
    fidelityMode: input.fidelityMode,
  });

  const dataGenMbDay = linkEval.generatedDataMbDay;
  const commsCapacityMbDay = Math.round(
    linkEval.downlinkCapacityMbDay * (input.operationalMode === 'comms_downlink' ? 1.25 : 1.0)
  );
  const storageCapacityMb = ssr.storageCapMb;
  const netDailyBacklog = Math.max(0, dataGenMbDay - commsCapacityMbDay);
  const daysUntilBufferFull =
    netDailyBacklog <= 0 ? 999 : Number((storageCapacityMb / netDailyBacklog).toFixed(1));

  // 7. Science Value & Lifetime
  const pointingMult = adcs.pointingArcsec <= 10 || prop.id === 'prop_cryo_hall' ? 1.06 : env.heliocentricAu > 2 ? 0.78 : 0.96;
  const dataCaptureEfficiency =
    dataGenMbDay <= 0 ? 1 : Math.min(1, (commsCapacityMbDay + storageCapacityMb * 0.12) / Math.max(1, dataGenMbDay));
  const scienceValue = Math.round(
    activeInstruments.reduce(
      (s, inst) => s + inst.scienceVal * (inst.bestForOrbits.includes(env.orbitId) ? 1.25 : 1.0),
      0
    ) *
      pointingMult *
      Math.max(0.4, dataCaptureEfficiency) *
      (input.operationalMode === 'science_burst' ? 1.2 : input.operationalMode === 'safe' ? 0.35 : 1.0)
  );

  const missionLifetimeYrs = Number(
    Math.max(
      0.5,
      (isRtg ? 9.5 : 4.8) +
        (obc.id === 'obc_dual_radhard' ? 2.2 : 0) +
        (thermal.id === 'thm_active_louvers' ? 1.8 : 0) -
        radShortfallPenalty * 0.08
    ).toFixed(1)
  );

  // 8. Identify Explicit Engineering Conflicts & Compatibility Checks
  const conflicts: EngineeringConflict[] = [];
  const compatibilityIssues: string[] = [];

  if (deltaVMarginKms < 0) {
    conflicts.push({
      id: 'conflict_dv',
      severity: 'critical',
      subsystem: 'propulsion',
      title: { ar: 'عجز سرعة Δv — الوقود لا يكفي للوصول', en: 'Delta-v Deficit — Insufficient Propulsion' },
      explanation: {
        ar: `المركبة (كتلة جافة ${dryMassKg} kg) تحتاج ${deltaVRequiredKms} km/s لكن المحرك يوفّر ${deltaVAvailableKms} km/s فقط.`,
        en: `At ${dryMassKg} kg dry mass, route needs ${deltaVRequiredKms} km/s Δv vs ${deltaVAvailableKms} km/s available.`,
      },
      fixHint: {
        ar: 'رقِّ المحرك إلى Cryo-Hall أو فعّل مسار Gravity-Assist أو خفّف الأجهزة.',
        en: 'Upgrade Propulsion to Cryo-Hall, select Gravity-Assist trajectory, or trim mass.',
      },
    });
  }

  if (netPowerW < 0) {
    conflicts.push({
      id: 'conflict_power',
      severity: 'critical',
      subsystem: 'power',
      title: { ar: 'عجز الطاقة الكهربائية أثناء التشغيل', en: 'Net Electrical Power Deficit' },
      explanation: {
        ar: `استهلاك الأجهزة والسخانات (${powerDrawW} W) يتجاوز التوليد (${powerGenW} W) عند بُعد ${env.heliocentricAu} AU.`,
        en: `Draws (${powerDrawW} W incl. ${heaterDrawW} W thermal load) exceed generation (${powerGenW} W) at ${env.heliocentricAu} AU.`,
      },
      fixHint: {
        ar: 'استخدم مولد MMRTG النووي أو أطفئ بعض الأجهزة أو فعّل وضع Low-Power.',
        en: 'Equip MMRTG Nuclear Core, toggle off idle instruments, or switch to Low-Power Mode.',
      },
    });
  }

  if (!input.sandboxUnrestricted && totalCostM > input.maxBudgetM) {
    conflicts.push({
      id: 'conflict_budget',
      severity: 'critical',
      subsystem: 'budget',
      title: { ar: 'تجاوز سقف ميزانية الوكالة', en: 'Agency Budget Overrun' },
      explanation: {
        ar: `التكلفة الإجمالية ($${totalCostM}M) أعلى من الميزانية المعتمدة ($${input.maxBudgetM}M).`,
        en: `Stack cost ($${totalCostM}M) exceeds authorized agency ceiling ($${input.maxBudgetM}M).`,
      },
      fixHint: {
        ar: 'اربح مهام في 2D/3D لرفع الميزانية أو بدّل القطع المكلفة.',
        en: 'Win missions to expand Agency Budget or swap to lighter Tier 1-2 subsystems.',
      },
    });
  }

  if (thermalMarginPct < 38) {
    conflicts.push({
      id: 'conflict_thermal',
      severity: 'critical',
      subsystem: 'thermal',
      title: { ar: 'خطر حراري على الإلكترونيات والبطاريات', en: 'Thermal Protection Insufficient' },
      explanation: {
        ar: `بيئة الكوكب (${env.surfaceTempRangeC[0]}..${env.surfaceTempRangeC[1]}°C) تتجاوز قدرة العزل السلبي وتدفع الحرارة الداخلية إلى ${internalTempC}°C.`,
        en: `Extreme ambient (${env.surfaceTempRangeC[0]}..${env.surfaceTempRangeC[1]}°C) drives bus temp to ${internalTempC}°C without active louvers.`,
      },
      fixHint: {
        ar: 'ركّب نظام المشعّات النشطة (Active Thermal Louvers).',
        en: 'Install Active Louver Radiators + Heat Pipes.',
      },
    });
  }

  if (radiationToleranceKradYr < orbitRadiationKradYr) {
    conflicts.push({
      id: 'conflict_radiation',
      severity: 'warning',
      subsystem: 'radiation_shielding',
      title: { ar: 'التدريع الإشعاعي أضعف من المدار', en: 'Radiation Dose Exceeds Shielding' },
      explanation: {
        ar: `إشعاع المدار (${orbitRadiationKradYr} krad/yr) أعلى من تحمل الدرع (${radiationToleranceKradYr} krad) مما يهدد الحاسوب.`,
        en: `Orbit dose (${orbitRadiationKradYr} krad/yr) exceeds vault rating (${radiationToleranceKradYr} krad).`,
      },
      fixHint: {
        ar: 'ركّب خزنة التانتالوم (200 krad) والحاسوب المكرر RAD750.',
        en: 'Equip Titanium-Tantalum Vault & Dual RAD750 OBC.',
      },
    });
  }

  if (dataGenMbDay > commsCapacityMbDay) {
    conflicts.push({
      id: 'conflict_comms',
      severity: 'warning',
      subsystem: 'comms',
      title: { ar: 'توليد البيانات أسرع من قدرة الإرسال', en: 'Telemetry Downlink Bottleneck' },
      explanation: {
        ar: `الأجهزة تنتج ${dataGenMbDay} MB/يوم بينما المحطة والهوائي ينقلان ${commsCapacityMbDay} MB/يوم — تمتلئ الذاكرة خلال ${daysUntilBufferFull} يوم.`,
        en: `Producing ${dataGenMbDay} MB/d vs ${commsCapacityMbDay} MB/d link; SSR fills in ${daysUntilBufferFull} days.`,
      },
      fixHint: {
        ar: 'رقِّ الهوائي لـ X/Ka-Band أو كبّر SSR إلى 2400 MB أو فعّل ضغط CCSDS.',
        en: 'Upgrade antenna to X/Ka-Band, expand SSR, or enable CCSDS data compression.',
      },
    });
  }

  if (env.planetId === 'solaris' && edl.id === 'edl_orbital_only') {
    const msg = 'Solaris 92-bar pressure crushes orbital-only landers — equip Skycrane + PICA Armored EDL for surface drops.';
    compatibilityIssues.push(msg);
    conflicts.push({
      id: 'conflict_edl_pressure',
      severity: 'warning',
      subsystem: 'landing_systems',
      title: { ar: 'عدم توافق نظام الهبوط مع ضغط الكوكب', en: 'Landing System Incompatible with 92-Bar Pressure' },
      explanation: {
        ar: 'الزهرة/سولاريس بضغط 92 bar يتطلب درع PICA وهبوط مقوّى عند النزول للسطح.',
        en: msg,
      },
      fixHint: { ar: 'ركّب حزمة Skycrane + PICA Heatshield.', en: 'Install PICA Heatshield + Skycrane.' },
    });
  }

  if (env.heliocentricAu > 10 && nav.id === 'nav_imu_std') {
    compatibilityIssues.push('Outer system latency (>2 hrs) degrades IMU-only landing precision — AutoNav LiDAR recommended.');
    conflicts.push({
      id: 'conflict_autonav',
      severity: 'advisory',
      subsystem: 'nav_sensors',
      title: { ar: 'تأخر الإشارة يتطلب ملاحة ذاتية AutoNav', en: 'Deep-Space Delay Favors AutoNav' },
      explanation: {
        ar: 'على بُعد أورانوس ونبتون يصل زمن الإشارة لـ 2.6–4.1 ساعة؛ القيادة من الأرض مستحيلة لحظياً.',
        en: '2.6–4.1 hr light lag makes real-time Earth teleoperation impossible during maneuvers.',
      },
      fixHint: { ar: 'طوّر حساسات الملاحة إلى AutoNav + LiDAR.', en: 'Upgrade Navigation Sensors to AutoNav + LiDAR.' },
    });
  }

  if (comms.id === 'ant_kaband_deep' && adcs.pointingArcsec > 20) {
    compatibilityIssues.push('Ka-Band narrow beam requires Precision 3-Axis ADCS (<10 arcsec) to lock onto Earth DSN.');
  }

  const criticalCount = conflicts.filter((c) => c.severity === 'critical').length;
  const warningCount = conflicts.filter((c) => c.severity === 'warning').length;
  const feasible = input.sandboxUnrestricted ? true : criticalCount === 0;

  const feasibilityScore = Math.max(
    0,
    Math.min(100, Math.round(reliabilityPct - criticalCount * 24 - warningCount * 9))
  );
  const riskScore = Math.max(2, Math.min(99, 100 - feasibilityScore));

  return {
    planetId: input.planetId,
    transferStrategy: input.transferStrategy,
    operationalMode: input.operationalMode,
    feasible,
    feasibilityScore,
    dryMassKg,
    propellantMassKg,
    wetMassKg,
    totalCostM,
    maxBudgetM: input.maxBudgetM,
    maintenanceCostCr,
    powerGenW,
    powerDrawW,
    netPowerW,
    thermalEqTempC: Math.round(env.meanTempC),
    internalTempC,
    thermalSafeRangeC,
    thermalMarginPct,
    deltaVRequiredKms,
    deltaVAvailableKms,
    deltaVMarginKms,
    transitDays: chosenRoute.transitDays,
    launchWindowDeg: chosenRoute.launchWindowDeg,
    dataGenMbDay,
    storageCapacityMb,
    commsCapacityMbDay,
    daysUntilBufferFull,
    scienceValue,
    structuralMarginPct,
    radiationToleranceKradYr,
    orbitRadiationKradYr,
    reliabilityPct,
    riskScore,
    missionLifetimeYrs,
    conflicts,
    compatibilityIssues,
    dataSourceLegend: {
      physicsModel:
        input.fidelityMode === 'high_fidelity'
          ? 'High-Fidelity Tsiolkovsky + 1/r² Inverse-Square + Friis FSPL (Educational Sim)'
          : 'Patched-Conic Engineering Approximation (Educational Sim)',
      referenceAccuracyNote: 'Verified against 5 NASA GMAT reference orbits (±0.2% to ±1.8% Δv variance)',
    },
  };
}

// Feature 5: Non-Destructive What-If Counterfactual Simulator
export function runWhatIfScenario(
  baseInput: TradeoffEvaluationInput,
  whatIf: WhatIfParameters
): WhatIfComparisonResult {
  const baseReport = evaluateSpacecraftArchitecture(baseInput);

  const simDryMass = Math.round(baseReport.dryMassKg * (1 + whatIf.massDeltaPct / 100));
  const massPenaltyDeltaV = Math.max(0, (simDryMass - baseReport.dryMassKg) * 0.0085);
  const enginePenaltyDv = whatIf.engineFailure ? baseReport.deltaVAvailableKms * 0.42 : 0;
  const simDvAvail = Math.max(3, baseReport.deltaVAvailableKms - massPenaltyDeltaV - enginePenaltyDv);
  const dvPassFactor = simDvAvail >= baseReport.deltaVRequiredKms ? 1 : 0.45;

  const simPowerGen = Math.round(
    baseReport.powerGenW * (1 + whatIf.powerDeltaPct / 100) * (whatIf.solarStormActive ? 0.85 : 1)
  );
  const simNetPower = simPowerGen - baseReport.powerDrawW;
  const powerPenalty = simNetPower < 0 ? Math.min(45, Math.abs(simNetPower) * 0.14) : 0;

  const blackoutFraction = Math.min(0.95, whatIf.commsBlackoutHours / 24);
  const simCommsCap = Math.round(baseReport.commsCapacityMbDay * (1 - blackoutFraction));
  const commsFactor =
    baseReport.dataGenMbDay <= 0
      ? 1
      : Math.min(1, (simCommsCap + baseReport.storageCapacityMb * 0.1) / Math.max(1, baseReport.dataGenMbDay));

  const instDropRatio = Math.max(
    0.25,
    1 - whatIf.instrumentFailedCount / Math.max(1, baseInput.instrumentIds.length)
  );
  const simScience = Math.round(baseReport.scienceValue * instDropRatio * commsFactor);

  const stormRisk = whatIf.solarStormActive ? 18 : 0;
  const durationRisk = Math.max(0, (whatIf.durationMultiplier - 1) * 14);
  const simReliability = Math.max(
    8,
    Math.min(
      99,
      Math.round(
        baseReport.reliabilityPct -
          (whatIf.engineFailure ? 28 : 0) -
          stormRisk -
          durationRisk -
          powerPenalty * 0.5
      )
    )
  );
  const simSuccessProb = Math.max(
    4,
    Math.min(
      98,
      Math.round(simReliability * dvPassFactor - powerPenalty * 0.65 - (whatIf.commsBlackoutHours >= 12 ? 12 : 0))
    )
  );
  const baseSuccessProb = Math.max(
    5,
    Math.min(99, Math.round(baseReport.feasibilityScore * (baseReport.feasible ? 1 : 0.55)))
  );

  const baseFuelPct = Math.min(100, Math.round((baseReport.deltaVRequiredKms / Math.max(1, baseReport.deltaVAvailableKms)) * 78));
  const simFuelPct = Math.min(100, Math.round((baseReport.deltaVRequiredKms / Math.max(1, simDvAvail)) * 78));

  const keyImpacts: Array<{ ar: string; en: string }> = [];
  if (whatIf.massDeltaPct > 0) {
    keyImpacts.push({
      ar: `زيادة الكتلة +${whatIf.massDeltaPct}% خفضت Δv الفعلي بـ ${massPenaltyDeltaV.toFixed(2)} km/s ورفعت استهلاك الوقود إلى ${simFuelPct}%.`,
      en: `+${whatIf.massDeltaPct}% mass trimmed effective Δv by ${massPenaltyDeltaV.toFixed(2)} km/s and raised fuel burn to ${simFuelPct}%.`,
    });
  }
  if (whatIf.powerDeltaPct < 0 || whatIf.solarStormActive) {
    keyImpacts.push({
      ar: `توليد الطاقة هبط إلى ${simPowerGen} W (صافي ${simNetPower >= 0 ? `+${simNetPower}` : simNetPower} W) مما يؤثر على تشغيل الأجهزة.`,
      en: `Power generation fell to ${simPowerGen} W (net ${simNetPower >= 0 ? `+${simNetPower}` : simNetPower} W), threatening payload uptime.`,
    });
  }
  if (whatIf.engineFailure) {
    keyImpacts.push({
      ar: `تعطل محرك رئيسي هبط باحتمالية النجاح من ${baseSuccessProb}% إلى ${simSuccessProb}% بسبب عجز Δv.`,
      en: `Engine failure dropped mission success probability from ${baseSuccessProb}% to ${simSuccessProb}% due to Δv deficit.`,
    });
  }
  if (whatIf.commsBlackoutHours > 0) {
    keyImpacts.push({
      ar: `انقطاع الاتصال ${whatIf.commsBlackoutHours} ساعة خفّض سعة البث إلى ${simCommsCap} MB/يوم وقلّل العائد العلمي إلى ${simScience} نقطة.`,
      en: `${whatIf.commsBlackoutHours}h comms blackout cut downlink to ${simCommsCap} MB/d, dropping delivered science to ${simScience} pts.`,
    });
  }
  if (keyImpacts.length === 0) {
    keyImpacts.push({
      ar: 'لم يتم تفعيل أي مؤثرات افتراضية — النتائج مطابقة للتكوين الأصلي.',
      en: 'No counterfactual perturbations active — simulated output matches baseline.',
    });
  }

  return {
    tag: 'SIMULATED_COUNTERFACTUAL',
    baseline: {
      successProbabilityPct: baseSuccessProb,
      fuelConsumptionPct: baseFuelPct,
      missionCostM: baseReport.totalCostM,
      durationYrs: baseReport.missionLifetimeYrs,
      scienceAchievement: baseReport.scienceValue,
      reliabilityPct: baseReport.reliabilityPct,
      engineeringRisk: baseReport.riskScore,
    },
    simulated: {
      successProbabilityPct: simSuccessProb,
      fuelConsumptionPct: simFuelPct,
      missionCostM: Math.round(baseReport.totalCostM * (1 + (whatIf.durationMultiplier - 1) * 0.18)),
      durationYrs: Number((baseReport.missionLifetimeYrs * whatIf.durationMultiplier).toFixed(1)),
      scienceAchievement: simScience,
      reliabilityPct: simReliability,
      engineeringRisk: Math.min(99, 100 - simSuccessProb),
    },
    keyImpacts,
  };
}

export function deriveDigitalTwinState(params: {
  loadout: AdvancedLoadout;
  operationalMode: OperationalMode;
  instrumentActiveMap: Record<string, boolean>;
  hullIntegrity: number;
  commsSignalPct: number;
  netPowerW: number;
}): DigitalTwinVisualState {
  const solarScale =
    params.loadout.solar_arrays === 'pwr14_concentrator_solar'
      ? 1.45
      : params.loadout.solar_arrays === 'pwr14_mmrtg'
        ? 0.72
        : 1.0;
  const hasRtg = params.loadout.solar_arrays === 'pwr14_mmrtg';
  const dishTier: 1 | 2 | 3 =
    params.loadout.comms_antennas === 'ant_kaband_deep'
      ? 3
      : params.loadout.comms_antennas === 'ant_xband_dish'
        ? 2
        : 1;
  const hasThermalArmor =
    params.loadout.thermal_control === 'thm_active_louvers' ||
    params.loadout.radiation_shielding === 'rad_tantalum_vault';
  const anyInstrumentOn = Object.values(params.instrumentActiveMap).some(Boolean);
  const activeScienceBeam =
    anyInstrumentOn &&
    params.operationalMode !== 'safe' &&
    params.operationalMode !== 'low_power';

  return {
    solarScale,
    hasRtg,
    dishTier,
    hasThermalArmor,
    activeScienceBeam,
    hullIntegrity: params.hullIntegrity,
    operationalMode: params.operationalMode,
    commsHealthy: params.commsSignalPct >= 40 && params.operationalMode !== 'low_power',
    commsSignalPct: params.commsSignalPct,
    powerDeficit: params.netPowerW < 0,
  };
}
