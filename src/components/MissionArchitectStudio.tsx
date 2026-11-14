import {
  Check,
  CheckCircle2,
  Compass,
  Copy,
  Layers,
  Play,
  Radio,
  Rocket,
  RotateCcw,
  Share2,
  Telescope,
  Trophy,
  Users,
  Wrench,
  X,
  XCircle,
  Zap,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  ALTERNATE_VALID_ARCHITECTURES,
  ARCHITECT_SCENARIOS,
  INSTRUMENT_OPTIONS,
  LAUNCH_VEHICLES,
  NASA_MISSION_SEGMENTS,
  ORBIT_OPTIONS,
  SUBSYSTEM_OPTIONS,
  TEAM_NEGOTIATION_DILEMMAS,
  TEAM_ROLES,
  evaluateRoleKpis,
  mapOrbitToPlanetId,
  type SavedArchitectRun,
  type TeamRoleId,
} from '../data/missionArchitectData';
import {
  GROUND_STATIONS,
  MISSION_TIMELINE_PHASES,
  computeCommsLinkBudget,
  computeFidelityAnalysis,
} from '../data/spaceOpsData';
import { useGameStore } from '../store/gameStore';
import type { ActiveMissionBlueprint } from '../types/game';
import { SpaceOpsSystemsPanel } from './SpaceOpsSystemsPanel';

type StudioTab = 'team' | 'design' | 'negotiate' | 'ops' | 'simulate' | 'leaderboard';

interface TeamMemberSlot {
  id: number;
  name: string;
  role: TeamRoleId;
  approved: boolean;
}

interface RandomSimEvent {
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  resolved: boolean;
  effectAr: string;
  effectEn: string;
}

interface SimResultReport {
  success: boolean;
  score: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'F';
  efficiencyScore: number;
  scienceScore: number;
  coordScore: number;
  eventOutcome: RandomSimEvent;
  causalReasonsAr: string[];
  causalReasonsEn: string[];
  whatIfAr: string;
  whatIfEn: string;
  effectiveLifetimeYrs: number;
}

export function MissionArchitectStudio() {
  const lang = useGameStore((s) => s.lang);
  const architectOpen = useGameStore((s) => s.architectOpen);
  const architectRuns = useGameStore((s) => s.architectRuns);
  const unlockedBudgetBonusM = useGameStore((s) => s.unlockedBudgetBonusM);
  const credits = useGameStore((s) => s.resources.credits);
  const dataStorage = useGameStore((s) => s.resources.dataStorage);
  const dataTransmitted = useGameStore((s) => s.resources.dataTransmitted);
  const activeGroundStationId = useGameStore((s) => s.activeGroundStationId);
  const commsCompressionMode = useGameStore((s) => s.commsCompressionMode);
  const analysisFidelityMode = useGameStore((s) => s.analysisFidelityMode);
  const setArchitectOpen = useGameStore((s) => s.setArchitectOpen);
  const recordArchitectRun = useGameStore((s) => s.recordArchitectRun);
  const deployArchitectBlueprintTo3D = useGameStore((s) => s.deployArchitectBlueprintTo3D);
  const investCreditsForBudget = useGameStore((s) => s.investCreditsForBudget);
  const setActiveGroundStationId = useGameStore((s) => s.setActiveGroundStationId);
  const setCommsCompressionMode = useGameStore((s) => s.setCommsCompressionMode);
  const setAnalysisFidelityMode = useGameStore((s) => s.setAnalysisFidelityMode);
  const recordGroundPassDownlink = useGameStore((s) => s.recordGroundPassDownlink);

  const [tab, setTab] = useState<StudioTab>('team');
  const [playMode, setPlayMode] = useState<'solo' | 'team' | 'sandbox'>('solo');
  const [complexityMode, setComplexityMode] = useState<'simplified' | 'full'>('simplified');
  const [teamName, setTeamName] = useState<string>('NOVA Vanguard');
  const [players, setPlayers] = useState<TeamMemberSlot[]>([
    { id: 1, name: 'Commander 1', role: 'planner', approved: true },
    { id: 2, name: 'Engineer 2', role: 'architect', approved: true },
    { id: 3, name: 'Scientist 3', role: 'science', approved: false },
    { id: 4, name: 'Comms Lead 4', role: 'comms', approved: false },
  ]);
  const [playerCount, setPlayerCount] = useState<number>(4);

  // Mission & Spacecraft Architecture State
  const [scenarioId, setScenarioId] = useState<string>('lunar_ice');
  const [orbitId, setOrbitId] = useState<string>('lunar_llo');
  const [launcherId, setLauncherId] = useState<string>('atlas_med');
  const [busId, setBusId] = useState<string>('bus_std');
  const [powerId, setPowerId] = useState<string>('pwr_small_solar');
  const [commsId, setCommsId] = useState<string>('comms_xband');
  const [adcsId, setAdcsId] = useState<string>('adcs_star');
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>(['inst_cam', 'inst_ir']);

  // Team trade-off negotiations
  const [negotiationChoices, setNegotiationChoices] = useState<Record<string, string>>({
    neg_mass_budget: 'opt_comp_mag',
    neg_comms_power: 'opt_schedule_duty',
  });

  // Simulation playback & causal report
  const [simStep, setSimStep] = useState<number>(0); // 0 idle, 1..5 running/complete
  const [simRunning, setSimRunning] = useState<boolean>(false);
  const [simReport, setSimReport] = useState<SimResultReport | null>(null);
  const [activeRoleFocus, setActiveRoleFocus] = useState<TeamRoleId>('planner');
  const [lastIterationSnapshot, setLastIterationSnapshot] = useState<{
    massKg: number;
    netPowerW: number;
    costM: number;
    science: number;
    score: number;
    grade: string;
  } | null>(null);
  const [prevIterationSnapshot, setPrevIterationSnapshot] = useState<{
    massKg: number;
    netPowerW: number;
    costM: number;
    science: number;
    score: number;
    grade: string;
  } | null>(null);

  // Share / Import design JSON code
  const [shareText, setShareText] = useState<string>('');
  const [copiedFlag, setCopiedFlag] = useState<boolean>(false);

  const scenario = ARCHITECT_SCENARIOS.find((s) => s.id === scenarioId) || ARCHITECT_SCENARIOS[0];
  const isSandbox = playMode === 'sandbox' || Boolean(scenario.isSandbox);
  const effectiveMaxBudgetM = isSandbox
    ? 999
    : Math.max(Math.round(scenario.maxBudgetM * 0.5), scenario.maxBudgetM + unlockedBudgetBonusM);
  const orbit = ORBIT_OPTIONS.find((o) => o.id === orbitId) || ORBIT_OPTIONS[0];
  const launcher = LAUNCH_VEHICLES.find((l) => l.id === launcherId) || LAUNCH_VEHICLES[0];
  const bus = SUBSYSTEM_OPTIONS.find((x) => x.id === busId) || SUBSYSTEM_OPTIONS[0];
  const powerSys = SUBSYSTEM_OPTIONS.find((x) => x.id === powerId) || SUBSYSTEM_OPTIONS[3];
  const commsSys = SUBSYSTEM_OPTIONS.find((x) => x.id === commsId) || SUBSYSTEM_OPTIONS[6];
  const adcsSys = SUBSYSTEM_OPTIONS.find((x) => x.id === adcsId) || SUBSYSTEM_OPTIONS[9];
  const instruments = INSTRUMENT_OPTIONS.filter((inst) => selectedInstruments.includes(inst.id));

  // Sync defaults when changing scenario cleanly
  const handleSelectScenario = (id: string) => {
    setScenarioId(id);
    const sc = ARCHITECT_SCENARIOS.find((s) => s.id === id);
    if (sc && sc.recommendedOrbits.length > 0 && !sc.isSandbox) {
      setOrbitId(sc.recommendedOrbits[0]);
      if (id === 'earth_climate') {
        setLauncherId('vega_light');
        setPowerId('pwr_small_solar');
      } else if (id === 'lunar_ice') {
        setLauncherId('atlas_med');
        setPowerId('pwr_small_solar');
      } else if (id === 'mars_relay') {
        setLauncherId('heavy_lift');
        setPowerId('pwr_mega_solar');
      } else if (id === 'europa_flyby' || id === 'uranus_orbiter' || id === 'neptune_flagship') {
        setLauncherId('super_heavy');
        setBusId('bus_shield');
        setPowerId('pwr_rtg');
        setCommsId('comms_kaband');
        setAdcsId('adcs_star');
      }
    }
    setSimReport(null);
    setSimStep(0);
  };

  // Engineering Trade-Off Physics & Constraints Calculator
  const metrics = useMemo(() => {
    const negMassDelta =
      playMode === 'team'
        ? TEAM_NEGOTIATION_DILEMMAS.reduce((acc, d) => {
            const pick = d.options.find((o) => o.id === negotiationChoices[d.id]);
            return acc + (pick?.massDeltaKg ?? 0);
          }, 0)
        : 0;

    const negCostDelta =
      playMode === 'team'
        ? TEAM_NEGOTIATION_DILEMMAS.reduce((acc, d) => {
            const pick = d.options.find((o) => o.id === negotiationChoices[d.id]);
            return acc + (pick?.costDeltaM ?? 0);
          }, 0)
        : 0;

    const negSciDelta =
      playMode === 'team'
        ? TEAM_NEGOTIATION_DILEMMAS.reduce((acc, d) => {
            const pick = d.options.find((o) => o.id === negotiationChoices[d.id]);
            return acc + (pick?.scienceDelta ?? 0);
          }, 0)
        : 0;

    const coordAvg =
      playMode === 'team'
        ? Math.round(
            TEAM_NEGOTIATION_DILEMMAS.reduce((acc, d) => {
              const pick = d.options.find((o) => o.id === negotiationChoices[d.id]);
              return acc + (pick?.coordinationScore ?? 75);
            }, 0) / TEAM_NEGOTIATION_DILEMMAS.length
          )
        : 100;

    const instMass = instruments.reduce((a, b) => a + b.massKg, 0);
    const totalMassKg = Math.max(
      180,
      bus.massKg + powerSys.massKg + commsSys.massKg + adcsSys.massKg + instMass + negMassDelta
    );

    const activeStation =
      GROUND_STATIONS.find((g) => g.id === activeGroundStationId) || GROUND_STATIONS[0];
    const isHighFi = analysisFidelityMode === 'high_fidelity';
    const fidelityBundle = computeFidelityAnalysis({
      orbit,
      commsSys,
      totalMassKg,
      powerGenW: powerSys.powerW,
      downlinkMbDay: commsSys.dataCapMbDay || 180,
    });

    const maxLauncherPayloadAtOrbitKg = Math.round(
      launcher.leoCapacityKg *
        orbit.massPenaltyFactor *
        (isHighFi ? fidelityBundle.hfPayloadCapMult : 1.0)
    );
    const massOk = isSandbox || totalMassKg <= maxLauncherPayloadAtOrbitKg;

    const isRTG = powerSys.id === 'pwr_rtg';
    const rawPowerGen = isRTG ? powerSys.powerW : Math.round(powerSys.powerW * orbit.solarEfficiency);
    const powerGenW = isHighFi && !isRTG ? Math.round(rawPowerGen * fidelityBundle.hfPowerMult) : rawPowerGen;
    const dutySavings =
      playMode === 'team' && negotiationChoices['neg_comms_power'] === 'opt_schedule_duty' ? 0.8 : 1.0;
    const rawDraw =
      Math.abs(bus.powerW) +
      Math.abs(commsSys.powerW) +
      Math.abs(adcsSys.powerW) +
      instruments.reduce((a, b) => a + b.powerW, 0);
    const powerDrawW = Math.round(rawDraw * dutySavings);
    const netPowerW = powerGenW - powerDrawW;
    const powerOk = netPowerW >= 0;

    const totalCostM = Math.max(
      20,
      launcher.costM +
        bus.costM +
        powerSys.costM +
        commsSys.costM +
        adcsSys.costM +
        instruments.reduce((a, b) => a + b.costM, 0) +
        negCostDelta
    );
    const budgetOk = isSandbox || totalCostM <= effectiveMaxBudgetM;

    const rawDataGenMbDay = instruments.reduce((a, b) => a + b.dataMbDay, 0);
    const linkEval = computeCommsLinkBudget({
      orbit,
      commsSys,
      adcsSys,
      station: activeStation,
      rawDataGenMbDay,
      compression: commsCompressionMode,
      dutyCycleActive: dutySavings < 1,
      fidelityMode: analysisFidelityMode,
    });
    const dataGenMbDay = linkEval.generatedDataMbDay;
    const commsCapMbDay = linkEval.downlinkCapacityMbDay;
    const dataRatio = dataGenMbDay === 0 ? 1 : Math.min(1, commsCapMbDay / Math.max(1, dataGenMbDay));
    const commsOk = linkEval.bottleneckStatus === 'nominal' || linkEval.bottleneckStatus === 'tight';

    const isDeepOrbit =
      orbit.id === 'mars_tmi' ||
      orbit.id === 'europa_jo' ||
      orbit.id === 'uranus_ice' ||
      orbit.id === 'neptune_kuiper';
    const adcsPenaltyMult = isDeepOrbit && adcsSys.id === 'adcs_basic' ? 0.78 : 1.0;

    // Synergy bonus for instruments suited to chosen orbit
    const orbitSynergyCount = instruments.filter((i) => i.bestForOrbits.includes(orbit.id)).length;
    const rawScience = instruments.reduce((a, b) => a + b.scienceVal, 0) + orbitSynergyCount * 10 + negSciDelta;
    const effectiveScience = Math.round(
      rawScience * (commsOk ? 1 : dataRatio * 0.72 + 0.28) * adcsPenaltyMult
    );
    const scienceOk = effectiveScience >= scenario.targetScience;

    const baseLife =
      (bus.lifetimeBonusYrs || 3) + (powerSys.lifetimeBonusYrs || 0) + (adcsSys.lifetimeBonusYrs || 0);
    const lifetimeYrs = Number(Math.max(0.8, baseLife - orbit.radiationWear * 2.2).toFixed(1));
    const lifetimeOk = isSandbox || lifetimeYrs >= scenario.minLifetimeYrs;

    const reliabilityPct = Math.min(
      99,
      launcher.reliabilityPct + (bus.reliabilityBonus || 0) + (adcsSys.reliabilityBonus || 0) - Math.round(orbit.radiationWear * 4)
    );

    const orbitMatchesObjective = isSandbox || scenario.recommendedOrbits.includes(orbit.id);
    const approvedCount = players.slice(0, playerCount).filter((p) => p.approved).length;
    const teamSignedOff = playMode !== 'team' || approvedCount === playerCount;

    return {
      totalMassKg,
      maxLauncherPayloadAtOrbitKg,
      massOk,
      powerGenW,
      powerDrawW,
      netPowerW,
      powerOk,
      totalCostM,
      budgetOk,
      rawDataGenMbDay,
      dataGenMbDay,
      commsCapMbDay,
      commsOk,
      signalStrengthPct: linkEval.signalStrengthPct,
      effectiveDataRateKbps: linkEval.effectiveDataRateKbps,
      commWindowHoursDay: linkEval.commWindowHoursDay,
      effectiveScience,
      scienceOk,
      lifetimeYrs,
      lifetimeOk,
      reliabilityPct,
      orbitMatchesObjective,
      coordAvg,
      approvedCount,
      teamSignedOff,
    };
  }, [
    playMode,
    playerCount,
    players,
    negotiationChoices,
    instruments,
    bus,
    powerSys,
    commsSys,
    adcsSys,
    launcher,
    orbit,
    scenario,
    isSandbox,
    effectiveMaxBudgetM,
    activeGroundStationId,
    commsCompressionMode,
    analysisFidelityMode,
  ]);

  const roleKpis = useMemo(
    () =>
      evaluateRoleKpis({
        massOk: metrics.massOk,
        totalMassKg: metrics.totalMassKg,
        maxLauncherPayloadAtOrbitKg: metrics.maxLauncherPayloadAtOrbitKg,
        powerOk: metrics.powerOk,
        netPowerW: metrics.netPowerW,
        budgetOk: metrics.budgetOk,
        totalCostM: metrics.totalCostM,
        maxBudgetM: effectiveMaxBudgetM,
        commsOk: metrics.commsOk,
        dataGenMbDay: metrics.dataGenMbDay,
        commsCapMbDay: metrics.commsCapMbDay,
        scienceOk: metrics.scienceOk,
        effectiveScience: metrics.effectiveScience,
        targetScience: scenario.targetScience,
        lifetimeOk: metrics.lifetimeOk,
        lifetimeYrs: metrics.lifetimeYrs,
        minLifetimeYrs: scenario.minLifetimeYrs,
        orbitMatchesObjective: metrics.orbitMatchesObjective,
        isSandbox,
      }),
    [metrics, scenario, isSandbox, effectiveMaxBudgetM]
  );

  const segmentStatuses = useMemo(
    () => ({
      launch: metrics.massOk,
      space: metrics.powerOk && metrics.lifetimeOk,
      ground: metrics.commsOk,
      user: metrics.scienceOk && metrics.orbitMatchesObjective,
    }),
    [metrics]
  );

  const cmlStage = useMemo(() => {
    const passedCount = Object.values(segmentStatuses).filter(Boolean).length;
    if (simReport?.success) return 4;
    if (passedCount === 4) return 3;
    if (passedCount >= 2) return 2;
    return 1;
  }, [segmentStatuses, simReport]);

  // Simulation Step Timer Animation (6 Mission Timeline Phases)
  useEffect(() => {
    if (!simRunning) return;
    if (simStep >= 6) {
      setSimRunning(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setSimStep((s) => s + 1);
    }, 240);
    return () => window.clearTimeout(timer);
  }, [simRunning, simStep]);

  if (!architectOpen) return null;

  const toggleInstrument = (id: string) => {
    setSelectedInstruments((prev) =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter((x) => x !== id) : prev) : [...prev, id]
    );
  };

  const applySimplifiedPreset = (tier: 'light' | 'balanced' | 'flagship') => {
    if (tier === 'light') {
      setBusId('bus_lite');
      setPowerId('pwr_small_solar');
      setCommsId('comms_sband');
      setAdcsId('adcs_basic');
      setSelectedInstruments(['inst_cam', 'inst_mag']);
    } else if (tier === 'balanced') {
      setBusId('bus_std');
      setPowerId('pwr_mega_solar');
      setCommsId('comms_xband');
      setAdcsId('adcs_star');
      setSelectedInstruments(['inst_cam', 'inst_ir']);
    } else {
      setBusId('bus_shield');
      setPowerId('pwr_rtg');
      setCommsId('comms_kaband');
      setAdcsId('adcs_star');
      setSelectedInstruments(['inst_ir', 'inst_radar', 'inst_mag']);
    }
  };

  const applyValidArchitecture = (presetId: 'lean_pathfinder' | 'heavy_flagship') => {
    const preset = ALTERNATE_VALID_ARCHITECTURES.find((p) => p.id === presetId);
    if (!preset) return;
    setScenarioId(preset.scenarioId);
    setOrbitId(preset.orbitId);
    setLauncherId(preset.launcherId);
    setBusId(preset.busId);
    setPowerId(preset.powerId);
    setCommsId(preset.commsId);
    setAdcsId(preset.adcsId);
    setSelectedInstruments(preset.instruments);
    setSimReport(null);
    setSimStep(0);
  };

  const handleDeployTo3D = (startIn: 'spaceflight' | 'mission-viz' = 'spaceflight') => {
    const currentScore = simReport?.score ?? Math.round(metrics.effectiveScience * 5.2);
    const currentGrade = simReport?.grade ?? (metrics.massOk && metrics.powerOk && metrics.budgetOk && metrics.scienceOk ? 'A' : 'B');
    const blueprint: ActiveMissionBlueprint = {
      scenarioId: scenario.id,
      scenarioTitle: scenario.title,
      teamName: playMode === 'team' ? teamName || 'Team NOVA' : 'Solo Architect',
      mode: playMode,
      orbitId: orbit.id,
      orbitName: orbit.name,
      targetPlanetId: mapOrbitToPlanetId(orbit.id),
      launcherId: launcher.id,
      launcherName: launcher.name,
      busId: bus.id,
      powerId: powerSys.id,
      commsId: commsSys.id,
      adcsId: adcsSys.id,
      instrumentIds: [...selectedInstruments],
      totalMassKg: metrics.totalMassKg,
      maxLauncherPayloadKg: metrics.maxLauncherPayloadAtOrbitKg,
      powerGenW: metrics.powerGenW,
      powerDrawW: metrics.powerDrawW,
      netPowerW: metrics.netPowerW,
      totalCostM: metrics.totalCostM,
      maxBudgetM: effectiveMaxBudgetM,
      dataGenMbDay: metrics.dataGenMbDay,
      commsCapMbDay: metrics.commsCapMbDay,
      effectiveScience: metrics.effectiveScience,
      targetScience: scenario.targetScience,
      lifetimeYrs: simReport?.effectiveLifetimeYrs ?? metrics.lifetimeYrs,
      minLifetimeYrs: scenario.minLifetimeYrs,
      reliabilityPct: metrics.reliabilityPct,
      grade: currentGrade,
      score: currentScore,
      deployedAt: Date.now(),
    };
    deployArchitectBlueprintTo3D(blueprint, startIn);
  };

  const runSimulation = () => {
    setTab('simulate');
    setSimStep(1);
    setSimRunning(true);

    // Pick a dynamic unexpected mission event based on orbit & configuration
    const randomPool: RandomSimEvent[] = [
      {
        titleAr: 'حدث طارئ: عاصفة إشعاع شمسية مفاجئة (CME)',
        titleEn: 'Unexpected Event: Sudden Solar Coronal Mass Ejection',
        descAr: 'اجتاحت موجة بروتونات مدارية الأجهزة الإلكترونية في منتصف العمر التشغيلي.',
        descEn: 'Intense solar proton burst swept across spacecraft avionics mid-mission.',
        resolved: bus.id !== 'bus_lite' || adcsSys.id === 'adcs_star',
        effectAr:
          bus.id !== 'bus_lite' || adcsSys.id === 'adcs_star'
            ? 'نجت الإلكترونيات بفضل درع الهيكل أو الحاسوب المكرر!'
            : 'تضرر المعالج البسيط وفقدت المركبة سنة من عمرها التشغيلي.',
        effectEn:
          bus.id !== 'bus_lite' || adcsSys.id === 'adcs_star'
            ? 'Redundant OBC / shielded bus absorbed radiation with zero downtime!'
            : 'Unshielded Carbon Micro-Bus suffered single-event upsets (-1 yr lifetime).',
      },
      {
        titleAr: 'حدث طارئ: عتمة كسوف طويلة وتشويش على الهوائي',
        titleEn: 'Unexpected Event: Extended Eclipse & DSN Rain Fade',
        descAr: 'مرور طويل خلف الكوكب خفّض الشحن الشمسي أثناء نافذة الإرسال الرئيسية.',
        descEn: 'Long orbital eclipse reduced solar flux right during primary telemetry downlink.',
        resolved: metrics.powerGenW >= metrics.powerDrawW + 80 || powerSys.id === 'pwr_rtg',
        effectAr:
          metrics.powerGenW >= metrics.powerDrawW + 80 || powerSys.id === 'pwr_rtg'
            ? 'هامش الطاقة / RTG حافظ على البث المستمر دون انقطاع!'
            : 'هبطت البطاريات في الظلام مما أخّر إرسال حزم البيانات.',
        effectEn:
          metrics.powerGenW >= metrics.powerDrawW + 80 || powerSys.id === 'pwr_rtg'
            ? 'Strong power margin / RTG kept instruments & transmitter alive through darkness!'
            : 'Tight power margin forced emergency instrument shutdowns during eclipse.',
      },
    ];
    const pickedEvent = randomPool[orbit.id === 'europa_jo' || orbit.id === 'mars_tmi' ? 0 : 1];

    const causalAr: string[] = [];
    const causalEn: string[] = [];

    if (!metrics.massOk) {
      causalAr.push(
        `فشل الإطلاق: كتلة المركبة (${metrics.totalMassKg} kg) تجاوزت قدرة الصاروخ عند هذا المدار (${metrics.maxLauncherPayloadAtOrbitKg} kg).`
      );
      causalEn.push(
        `Launch Overload: Spacecraft mass (${metrics.totalMassKg} kg) exceeds ${launcher.name.en} capacity at this orbit (${metrics.maxLauncherPayloadAtOrbitKg} kg).`
      );
    } else {
      causalAr.push(
        `التوافق الصاروخي ناجح: استُغل ${Math.round((metrics.totalMassKg / metrics.maxLauncherPayloadAtOrbitKg) * 100)}% من سعة الإطلاق.`
      );
      causalEn.push(
        `Launch Compatibility Passed: Payload utilized ${Math.round((metrics.totalMassKg / metrics.maxLauncherPayloadAtOrbitKg) * 100)}% of rocket lift margin.`
      );
    }

    if (!metrics.powerOk) {
      causalAr.push(
        `عجز الطاقة (${metrics.netPowerW} W): إضاءة الشمس في هذا المدار (${Math.round(orbit.solarEfficiency * 100)}%) لم تكفِ لتشغيل الأجهزة!`
      );
      causalEn.push(
        `Power Deficit (${metrics.netPowerW} W): Solar flux here (${Math.round(orbit.solarEfficiency * 100)}%) could not sustain instruments — consider High-Gain Solar or RTG.`
      );
    } else {
      causalAr.push(`اتزان الطاقة إيجابي (+${metrics.netPowerW} W هامش أمان تشغيلي).`);
      causalEn.push(`Positive Power Margin (+${metrics.netPowerW} W net surplus for peak ops).`);
    }

    const isDeepOrbit =
      orbit.id === 'mars_tmi' ||
      orbit.id === 'europa_jo' ||
      orbit.id === 'uranus_ice' ||
      orbit.id === 'neptune_kuiper';
    if (isDeepOrbit && adcsSys.id === 'adcs_basic') {
      causalAr.push(
        `دقة التوجيه (-22% علم): نظام ADCS الأساسي غير كافٍ للفضاء العميق — رقِّ إلى متتبعات النجوم المزدوجة.`
      );
      causalEn.push(
        `Pointing Loss (-22% SCI): Basic Magnetorquers cannot aim narrow instruments in deep space — upgrade to Dual Star Trackers.`
      );
    }

    if (!metrics.budgetOk) {
      causalAr.push(
        `تجاوز الميزانية: التكلفة (${metrics.totalCostM}M$) أعلى من الحد المتاح (${effectiveMaxBudgetM}M$). اربح مهام أو استثمر CR لتوسيع الميزانية!`
      );
      causalEn.push(
        `Budget Overrun: Cost ($${metrics.totalCostM}M) exceeded available ceiling ($${effectiveMaxBudgetM}M). Win missions or invest CR to expand Agency Budget!`
      );
    }

    if (!metrics.commsOk) {
      causalAr.push(
        `اختناق الاتصالات: الأجهزة تولّد ${metrics.dataGenMbDay} MB/day بينما الهوائي يرسل ${metrics.commsCapMbDay} MB/day فقط.`
      );
      causalEn.push(
        `Data Bottleneck: Instruments generate ${metrics.dataGenMbDay} MB/day while comms downlink handles only ${metrics.commsCapMbDay} MB/day.`
      );
    }

    if (!metrics.orbitMatchesObjective) {
      causalAr.push(
        `عدم ملاءمة المدار للهدف: هذه المهمة تتطلب أحد المدارات الموصى بها لتحقيق الرصد المطلوب.`
      );
      causalEn.push(
        `Orbit Misalignment: Selected orbit misses primary science target geometry.`
      );
    }

    if (!metrics.scienceOk) {
      causalAr.push(
        `العائد العلمي أقل من المطلوب (${metrics.effectiveScience}/${scenario.targetScience} نقطة) — أضف أجهزة متوافقة أو حسّن الاتصالات.`
      );
      causalEn.push(
        `Science Target Missed (${metrics.effectiveScience}/${scenario.targetScience} pts) — add orbit-matched instruments or remove data bottleneck.`
      );
    }

    const effectiveLife = Number(
      Math.max(0.5, metrics.lifetimeYrs - (pickedEvent.resolved ? 0 : 1.0)).toFixed(1)
    );
    const overallPass =
      metrics.massOk &&
      metrics.powerOk &&
      metrics.budgetOk &&
      metrics.scienceOk &&
      metrics.orbitMatchesObjective &&
      (isSandbox || effectiveLife >= scenario.minLifetimeYrs);

    const budgetEff = isSandbox
      ? 90
      : Math.max(0, Math.min(100, Math.round((1 - (metrics.totalCostM - effectiveMaxBudgetM * 0.4) / effectiveMaxBudgetM) * 100)));
    const efficiencyScore = Math.max(20, Math.min(100, Math.round((budgetEff + (metrics.commsOk ? 95 : 55)) / 2)));
    const scienceScore = Math.min(120, Math.round((metrics.effectiveScience / Math.max(1, scenario.targetScience)) * 100));
    const coordScore = playMode === 'team' ? Math.round(metrics.coordAvg * (metrics.teamSignedOff ? 1 : 0.78)) : 95;

    const totalScore = overallPass
      ? Math.round(scienceScore * 3.8 + efficiencyScore * 2.8 + coordScore * 2.4 + (pickedEvent.resolved ? 80 : 0))
      : Math.round(scienceScore * 1.4 + efficiencyScore * 1.1);

    const grade: SimResultReport['grade'] = !overallPass
      ? 'F'
      : totalScore >= 900
        ? 'S'
        : totalScore >= 780
          ? 'A'
          : totalScore >= 650
            ? 'B'
            : 'C';

    const whatIfAr = !metrics.powerOk
      ? 'لو استبدلت الألواح الشمسية بـ MMRTG النووي في مدارات المريخ/أوروبا لارتفعت الطاقة فوراً دون الاعتماد على ضوء الشمس.'
      : !metrics.massOk
        ? 'لو انتقلت للصاروخ الأعلى أو استخدمت هيكل Carbon Micro-Bus لحافظت على توافق الإطلاق.'
        : 'تجربة أجهزة متوافقة مع المدار مثل الرادار أو المطياف + هوائي Ka-Band ترفع رتبتك إلى S!';

    const whatIfEn = !metrics.powerOk
      ? 'Switching to MMRTG Nuclear Power or High-Gain Wings would eliminate solar starvation at this distance.'
      : !metrics.massOk
        ? 'Upgrading the launch vehicle OR trimming heavy subsystems with the Carbon Micro-Bus fixes launch overload.'
        : 'Pairing orbit-specific instruments with Ka-Band downlink pushes total science & efficiency toward Grade S!';

    const report: SimResultReport = {
      success: overallPass,
      score: totalScore,
      grade,
      efficiencyScore,
      scienceScore,
      coordScore,
      eventOutcome: pickedEvent,
      causalReasonsAr: causalAr,
      causalReasonsEn: causalEn,
      whatIfAr,
      whatIfEn,
      effectiveLifetimeYrs: effectiveLife,
    };

    if (lastIterationSnapshot) {
      setPrevIterationSnapshot(lastIterationSnapshot);
    }
    setLastIterationSnapshot({
      massKg: metrics.totalMassKg,
      netPowerW: metrics.netPowerW,
      costM: metrics.totalCostM,
      science: metrics.effectiveScience,
      score: totalScore,
      grade,
    });
    setSimReport(report);

    const savedRun: SavedArchitectRun = {
      id: `run_${Date.now()}`,
      teamName: playMode === 'team' ? teamName || 'Team NOVA' : 'Solo Architect',
      mode: playMode,
      scenarioId: scenario.id,
      scenarioTitle: scenario.title.en,
      score: totalScore,
      grade,
      success: overallPass,
      massKg: metrics.totalMassKg,
      costM: metrics.totalCostM,
      scienceVal: metrics.effectiveScience,
      lifetimeYrs: effectiveLife,
      orbitName: orbit.name.en,
      launcherName: launcher.name.en,
      instrumentCount: instruments.length,
      timestamp: Date.now(),
    };
    recordArchitectRun(savedRun);
  };

  const handleExportCode = () => {
    const payload = {
      teamName,
      playMode,
      scenarioId,
      orbitId,
      launcherId,
      busId,
      powerId,
      commsId,
      adcsId,
      selectedInstruments,
    };
    const encoded = JSON.stringify(payload);
    setShareText(encoded);
    try {
      navigator.clipboard?.writeText(encoded);
      setCopiedFlag(true);
      window.setTimeout(() => setCopiedFlag(false), 1800);
    } catch {
      // ignore clipboard restrictions
    }
  };

  const handleImportCode = () => {
    try {
      const p = JSON.parse(shareText.trim());
      if (p.scenarioId) setScenarioId(p.scenarioId);
      if (p.orbitId) setOrbitId(p.orbitId);
      if (p.launcherId) setLauncherId(p.launcherId);
      if (p.busId) setBusId(p.busId);
      if (p.powerId) setPowerId(p.powerId);
      if (p.commsId) setCommsId(p.commsId);
      if (p.adcsId) setAdcsId(p.adcsId);
      if (Array.isArray(p.selectedInstruments) && p.selectedInstruments.length > 0) {
        setSelectedInstruments(p.selectedInstruments);
      }
      if (p.teamName) setTeamName(String(p.teamName));
      setTab('design');
    } catch {
      // ignore malformed JSON
    }
  };

  const visibleSubsystems = (cat: 'bus' | 'power' | 'comms' | 'adcs') => {
    const all = SUBSYSTEM_OPTIONS.filter((s) => s.category === cat);
    if (complexityMode === 'full') return all;
    return all.filter((s) => s.tier === 'Simple' || s.id === 'pwr_rtg' || s.id === 'adcs_star').slice(0, 2);
  };

  return (
    <div className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-[#04070e]/90 p-2 sm:p-4 backdrop-blur-sm">
      <div className="flex max-h-[95vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl border border-cyan-400/40 bg-[#080d17] shadow-2xl">
        {/* Top Studio Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-[#050811] px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/45 bg-cyan-500/15 text-cyan-300">
              <Rocket className="h-5 w-5" />
            </div>
            <div>
              <div className="font-mono text-[10px] font-bold tracking-widest text-cyan-400">
                SPACE MISSION DESIGN GAME • 1–4 PLAYER COOPERATIVE SYSTEMS LAB
              </div>
              <h2 className="font-display text-sm font-bold text-white sm:text-base">
                {lang === 'ar'
                  ? 'استوديو تصميم ومحاكاة المهمات الفضائية المتكاملة (1–4 لاعبين)'
                  : 'Complete Space Mission Design Studio — Architecture, Trade-Offs & Simulation'}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'team' as StudioTab, icon: Users, ar: '1. الفريق والسيناريو', en: '1. Team & Scenario' },
              { id: 'design' as StudioTab, icon: Wrench, ar: '2. تصميم المركبة', en: '2. Spacecraft' },
              { id: 'negotiate' as StudioTab, icon: Layers, ar: '3. مفاوضات', en: '3. Trade-Offs' },
              { id: 'ops' as StudioTab, icon: Radio, ar: '4. الاتصالات والتحقق', en: '4. Comms & Validation' },
              { id: 'simulate' as StudioTab, icon: Play, ar: '5. المحاكاة 6 مراحل', en: '5. Simulate' },
              { id: 'leaderboard' as StudioTab, icon: Trophy, ar: 'التصنيف', en: 'Leaderboard' },
            ].map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold whitespace-nowrap transition ${
                    active
                      ? 'bg-cyan-400 text-slate-950'
                      : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{lang === 'ar' ? t.ar : t.en}</span>
                </button>
              );
            })}
            <button
              onClick={() => setArchitectOpen(false)}
              className="ms-1 rounded-lg border border-white/15 bg-white/5 p-1.5 text-slate-300 hover:text-white"
              aria-label="Close Mission Architect Studio"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* NASA 4-Segment Mission Pipeline & CML 1-4 Readiness Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-[#050912] px-4 py-1.5 font-mono text-[10px]">
          <div className="flex flex-wrap items-center gap-2">
            {NASA_MISSION_SEGMENTS.map((seg, idx) => {
              const ok = segmentStatuses[seg.id];
              return (
                <div key={seg.id} className="flex items-center gap-1.5">
                  <span
                    className={`font-bold ${
                      ok ? 'text-emerald-300' : 'text-amber-300'
                    }`}
                  >
                    {seg.num} {seg.title[lang]}
                  </span>
                  <span className="hidden text-slate-500 xl:inline">· {seg.focus[lang]}</span>
                  {idx < NASA_MISSION_SEGMENTS.length - 1 && (
                    <span className="text-slate-600">→</span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="text-[10px] font-bold text-cyan-300 tabular-nums">
            CML-{cmlStage}/4 {lang === 'ar' ? 'نضج التصميم' : 'READINESS'}
          </div>
        </div>

        {/* Live Mission Systems Ribbon with Visual Progress Bars */}
        <div className="grid grid-cols-2 gap-2 border-b border-white/10 bg-[#060a13] px-4 py-2 font-mono text-[11px] tabular-nums sm:grid-cols-3 lg:grid-cols-6">
          <div className={`rounded-lg border px-2.5 py-1.5 ${metrics.massOk ? 'border-emerald-400/30 bg-emerald-500/10' : 'border-rose-400/50 bg-rose-500/15'}`}>
            <div className="text-[10px] text-slate-400">{lang === 'ar' ? 'الكتلة / الصاروخ' : 'MASS / ROCKET'}</div>
            <div className={`font-bold ${metrics.massOk ? 'text-emerald-300' : 'text-rose-300'}`}>
              {metrics.totalMassKg} / {metrics.maxLauncherPayloadAtOrbitKg} kg
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-black/50">
              <div
                className={`h-full transition-all duration-300 ${metrics.massOk ? 'bg-emerald-400' : 'bg-rose-500'}`}
                style={{ width: `${Math.min(100, Math.round((metrics.totalMassKg / Math.max(1, metrics.maxLauncherPayloadAtOrbitKg)) * 100))}%` }}
              />
            </div>
          </div>
          <div className={`rounded-lg border px-2.5 py-1.5 ${metrics.powerOk ? 'border-cyan-400/30 bg-cyan-500/10' : 'border-rose-400/50 bg-rose-500/15'}`}>
            <div className="text-[10px] text-slate-400">{lang === 'ar' ? 'توازن الطاقة' : 'POWER MARGIN'}</div>
            <div className={`font-bold ${metrics.powerOk ? 'text-cyan-300' : 'text-rose-300'}`}>
              {metrics.netPowerW >= 0 ? `+${metrics.netPowerW}` : metrics.netPowerW} W
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-black/50">
              <div
                className={`h-full transition-all duration-300 ${metrics.powerOk ? 'bg-cyan-400' : 'bg-rose-500'}`}
                style={{ width: `${Math.min(100, Math.round((metrics.powerGenW / Math.max(1, metrics.powerDrawW)) * 80))}%` }}
              />
            </div>
          </div>
          <div className={`rounded-lg border px-2.5 py-1.5 ${metrics.budgetOk ? 'border-amber-400/30 bg-amber-500/10' : 'border-rose-400/50 bg-rose-500/15'}`}>
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>{lang === 'ar' ? 'الميزانية' : 'BUDGET'}</span>
              {!isSandbox && unlockedBudgetBonusM !== 0 && (
                <span className={unlockedBudgetBonusM > 0 ? 'text-emerald-300' : 'text-rose-400'}>
                  {unlockedBudgetBonusM > 0 ? `+$${unlockedBudgetBonusM}M` : `-$${Math.abs(unlockedBudgetBonusM)}M`}
                </span>
              )}
            </div>
            <div className={`font-bold ${metrics.budgetOk ? 'text-amber-300' : 'text-rose-300'}`}>
              ${metrics.totalCostM}M / {isSandbox ? '∞' : `$${effectiveMaxBudgetM}M`}
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-black/50">
              <div
                className={`h-full transition-all duration-300 ${metrics.budgetOk ? 'bg-amber-400' : 'bg-rose-500'}`}
                style={{ width: `${isSandbox ? 35 : Math.min(100, Math.round((metrics.totalCostM / Math.max(1, effectiveMaxBudgetM)) * 100))}%` }}
              />
            </div>
          </div>
          <div className={`rounded-lg border px-2.5 py-1.5 ${metrics.commsOk ? 'border-violet-400/30 bg-violet-500/10' : 'border-rose-400/50 bg-rose-500/15'}`}>
            <div className="text-[10px] text-slate-400">{lang === 'ar' ? 'البيانات / البث' : 'DATA / COMMS'}</div>
            <div className={`font-bold ${metrics.commsOk ? 'text-violet-300' : 'text-rose-300'}`}>
              {metrics.dataGenMbDay} / {metrics.commsCapMbDay} MB/d
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-black/50">
              <div
                className={`h-full transition-all duration-300 ${metrics.commsOk ? 'bg-violet-400' : 'bg-rose-500'}`}
                style={{ width: `${Math.min(100, Math.round((metrics.dataGenMbDay / Math.max(1, metrics.commsCapMbDay)) * 100))}%` }}
              />
            </div>
          </div>
          <div className={`rounded-lg border px-2.5 py-1.5 ${metrics.scienceOk ? 'border-emerald-400/30 bg-emerald-500/10' : 'border-amber-400/40 bg-amber-500/10'}`}>
            <div className="text-[10px] text-slate-400">{lang === 'ar' ? 'العائد العلمي' : 'SCIENCE GOAL'}</div>
            <div className={`font-bold ${metrics.scienceOk ? 'text-emerald-300' : 'text-amber-200'}`}>
              {metrics.effectiveScience} / {scenario.targetScience} PTS
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-black/50">
              <div
                className={`h-full transition-all duration-300 ${metrics.scienceOk ? 'bg-emerald-400' : 'bg-amber-400'}`}
                style={{ width: `${Math.min(100, Math.round((metrics.effectiveScience / Math.max(1, scenario.targetScience)) * 100))}%` }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5">
            <div>
              <div className="text-[10px] text-slate-400">{lang === 'ar' ? 'العمر' : 'LIFETIME'}</div>
              <div className={`font-bold ${metrics.lifetimeOk ? 'text-white' : 'text-rose-300'}`}>
                {metrics.lifetimeYrs} yrs
              </div>
            </div>
            <button
              onClick={runSimulation}
              className="rounded-md bg-emerald-400 px-2.5 py-1.5 text-[11px] font-bold text-slate-950 whitespace-nowrap shrink-0 hover:brightness-110"
            >
              {lang === 'ar' ? 'اختبر وأطلق' : 'TEST & FLY'}
            </button>
          </div>
        </div>

        {/* Plain-Language Live Verdict Strip */}
        {(() => {
          const ready =
            metrics.massOk &&
            metrics.powerOk &&
            metrics.budgetOk &&
            metrics.scienceOk &&
            metrics.orbitMatchesObjective &&
            metrics.lifetimeOk;
          const blockerMsg = !metrics.massOk
            ? lang === 'ar'
              ? `المركبة أثقل من الصاروخ (${metrics.totalMassKg} > ${metrics.maxLauncherPayloadAtOrbitKg} kg) — اختر صاروخ أقوى أو خفف الأجهزة.`
              : `Overweight (${metrics.totalMassKg} > ${metrics.maxLauncherPayloadAtOrbitKg} kg) — pick a stronger rocket or lighter payload.`
            : !metrics.powerOk
              ? lang === 'ar'
                ? `عجز في الكهرباء (${metrics.netPowerW} W) — الشمس هنا ${Math.round(orbit.solarEfficiency * 100)}% فقط، جرّب ألواح أكبر أو مولد RTG.`
                : `Power deficit (${metrics.netPowerW} W) at ${Math.round(orbit.solarEfficiency * 100)}% sunlight — upgrade solar or switch to RTG.`
              : !metrics.commsOk
                ? lang === 'ar'
                  ? `اختناق بيانات (${metrics.dataGenMbDay} > ${metrics.commsCapMbDay} MB/d) — رقِّ الهوائي عشان ما تفقدش بيانات علمية.`
                  : `Data bottleneck (${metrics.dataGenMbDay} > ${metrics.commsCapMbDay} MB/d) — upgrade X-Band or Ka-Band antenna.`
                : !metrics.budgetOk
                  ? lang === 'ar'
                    ? `تجاوزت الميزانية ($${metrics.totalCostM}M / $${effectiveMaxBudgetM}M) — خفّض بعض القطع أو استثمر رصيد CR لرفع الميزانية.`
                    : `Over budget ($${metrics.totalCostM}M / $${effectiveMaxBudgetM}M) — trim costs or expand Agency Budget.`
                  : !metrics.scienceOk || !metrics.orbitMatchesObjective
                    ? lang === 'ar'
                      ? `ارفع العائد العلمي (${metrics.effectiveScience}/${scenario.targetScience}) بإضافة جهاز متوافق مع المدار.`
                      : `Reach Science Target (${metrics.effectiveScience}/${scenario.targetScience}) by toggling orbit-matched instruments.`
                    : lang === 'ar'
                      ? `التصميم متوازن 100% — اضغط "اختبر وأطلق" لمحاكاة المهمة والطيران 3D!`
                      : `All 4 trade-offs balanced! Click "TEST & FLY" to simulate & launch into 3D!`;

          return (
            <div
              className={`flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-1.5 text-xs ${
                ready
                  ? 'bg-emerald-500/15 text-emerald-200'
                  : 'bg-amber-500/10 text-amber-200'
              }`}
            >
              <div className="flex items-center gap-2 font-semibold">
                {ready ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                ) : (
                  <Zap className="h-4 w-4 shrink-0 text-amber-400" />
                )}
                <span>{blockerMsg}</span>
              </div>
              {ready && (
                <button
                  onClick={() => handleDeployTo3D('spaceflight')}
                  className="flex items-center gap-1 rounded-md bg-emerald-400 px-3 py-1 text-[11px] font-bold text-slate-950 whitespace-nowrap shrink-0 hover:brightness-110"
                >
                  <Rocket className="h-3.5 w-3.5" />
                  <span>{lang === 'ar' ? 'طِر بها فوراً 3D' : 'Fly in 3D Now'}</span>
                </button>
              )}
            </div>
          );
        })()}

        {/* Main Scrollable Stage */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* ==========================================================
              TAB 1: 1-4 PLAYER COLLABORATION & MISSION SCENARIO
          ========================================================== */}
          {tab === 'team' && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              {/* Left: Mode & Up to 4 Players Roster */}
              <div className="space-y-3 rounded-xl border border-white/10 bg-[#0b111d] p-4 lg:col-span-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
                    <Users className="h-4 w-4" />
                    <span>{lang === 'ar' ? 'وضع اللعب والتعاون (1 إلى 4 لاعبين)' : 'Collaboration Mode (1–4 Players)'}</span>
                  </div>
                  <div className="flex gap-1 rounded-lg border border-white/10 bg-black/40 p-0.5 text-[11px]">
                    {(['solo', 'team', 'sandbox'] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setPlayMode(m)}
                        className={`rounded-md px-2.5 py-1 font-bold uppercase ${
                          playMode === m ? 'bg-cyan-400 text-slate-950' : 'text-slate-300'
                        }`}
                      >
                        {m === 'solo' ? (lang === 'ar' ? 'فردي' : 'Solo') : m === 'team' ? (lang === 'ar' ? 'فريق 2-4' : 'Team 2-4') : 'Sandbox'}
                      </button>
                    ))}
                  </div>
                </div>

                {playMode === 'team' && (
                  <div className="space-y-2.5 rounded-xl border border-cyan-400/25 bg-black/35 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <input
                        type="text"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        placeholder={lang === 'ar' ? 'اسم الفريق...' : 'Team Name...'}
                        className="rounded-lg border border-white/15 bg-black/50 px-3 py-1.5 text-xs font-bold text-white outline-none focus:border-cyan-400"
                      />
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-slate-400">{lang === 'ar' ? 'الأعضاء:' : 'Players:'}</span>
                        {[2, 3, 4].map((cnt) => (
                          <button
                            key={cnt}
                            onClick={() => setPlayerCount(cnt)}
                            className={`rounded px-2 py-1 font-mono font-bold ${
                              playerCount === cnt ? 'bg-amber-400 text-slate-950' : 'bg-white/5 text-slate-300'
                            }`}
                          >
                            {cnt}P
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {players.slice(0, playerCount).map((p, idx) => {
                        const roleDef = TEAM_ROLES.find((r) => r.id === p.role) || TEAM_ROLES[0];
                        const roleKpi = roleKpis.find((k) => k.roleId === p.role);
                        return (
                          <div key={p.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <input
                                type="text"
                                value={p.name}
                                onChange={(e) =>
                                  setPlayers((prev) =>
                                    prev.map((item) =>
                                      item.id === p.id ? { ...item, name: e.target.value } : item
                                    )
                                  )
                                }
                                className="w-32 rounded border border-white/10 bg-black/40 px-2 py-1 text-xs font-bold text-white"
                              />
                              <select
                                value={p.role}
                                onChange={(e) =>
                                  setPlayers((prev) =>
                                    prev.map((item) =>
                                      item.id === p.id
                                        ? { ...item, role: e.target.value as TeamRoleId }
                                        : item
                                    )
                                  )
                                }
                                className="rounded border border-white/10 bg-slate-900 px-2 py-1 text-[11px] font-semibold text-cyan-200"
                              >
                                {TEAM_ROLES.map((r) => (
                                  <option key={r.id} value={r.id}>
                                    {r.title[lang]}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() =>
                                  setPlayers((prev) =>
                                    prev.map((item) =>
                                      item.id === p.id ? { ...item, approved: !item.approved } : item
                                    )
                                  )
                                }
                                className={`flex items-center gap-1 rounded px-2.5 py-1 text-[11px] font-bold whitespace-nowrap shrink-0 ${
                                  p.approved
                                    ? 'bg-emerald-400 text-slate-950'
                                    : 'border border-amber-400/40 bg-amber-500/15 text-amber-200'
                                }`}
                              >
                                <Check className="h-3 w-3" />
                                <span>
                                  {p.approved
                                    ? lang === 'ar'
                                      ? `موافق P${idx + 1}`
                                      : `Ready P${idx + 1}`
                                    : lang === 'ar'
                                      ? 'اعتماد الدور'
                                      : 'Sign Off'}
                                </span>
                              </button>
                            </div>
                            <div className="mt-1.5 flex items-center justify-between gap-2 text-[10px]">
                              <span className="text-slate-400">{roleDef.responsibility[lang]}</span>
                              {roleKpi && (
                                <span
                                  className={`shrink-0 font-mono font-bold tabular-nums ${
                                    roleKpi.pass ? 'text-emerald-300' : 'text-rose-300'
                                  }`}
                                >
                                  {roleKpi.pass ? 'PASS' : 'CONFLICT'} · {roleKpi.headline[lang]}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Accessibility Complexity Toggle */}
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                  <div className="mb-1.5 text-xs font-bold text-amber-300">
                    {lang === 'ar' ? 'مستوى التعقيد الهندسي (لكل المستويات)' : 'Engineering Complexity Mode'}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setComplexityMode('simplified')}
                      className={`rounded-lg border p-2 text-start text-xs ${
                        complexityMode === 'simplified'
                          ? 'border-emerald-400 bg-emerald-500/15 text-white'
                          : 'border-white/10 bg-white/5 text-slate-300'
                      }`}
                    >
                      <div className="font-bold">{lang === 'ar' ? 'مبسّط للطلاب' : 'Simplified Guided'}</div>
                      <div className="text-[10px] text-slate-400">
                        {lang === 'ar' ? 'مكونات واضحة مع قوالب سريعة' : 'Streamlined subsystems + quick presets'}
                      </div>
                    </button>
                    <button
                      onClick={() => setComplexityMode('full')}
                      className={`rounded-lg border p-2 text-start text-xs ${
                        complexityMode === 'full'
                          ? 'border-cyan-400 bg-cyan-500/15 text-white'
                          : 'border-white/10 bg-white/5 text-slate-300'
                      }`}
                    >
                      <div className="font-bold">{lang === 'ar' ? 'هندسي كامل' : 'Full Engineering'}</div>
                      <div className="text-[10px] text-slate-400">
                        {lang === 'ar' ? 'كل الأنظمة والـ RTG والـ Ka-Band' : 'All buses, nuclear RTG & Ka-Band optics'}
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right: Choose Mission Objective & Scenario */}
              <div className="space-y-3 rounded-xl border border-white/10 bg-[#0b111d] p-4 lg:col-span-7">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                    <Compass className="h-4 w-4" />
                    <span>{lang === 'ar' ? 'اختر الهدف العلمي وسيناريو المهمة أولاً' : 'Step 1: Define Mission Objective & Scenario'}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={investCreditsForBudget}
                      disabled={credits < 200}
                      className="rounded-lg border border-emerald-400/50 bg-emerald-500/15 px-3 py-1.5 text-[11px] font-bold text-emerald-200 hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {lang === 'ar'
                        ? `استثمر 200 CR ⬅ +$40M (${credits} CR)`
                        : `Expand +$40M (200 CR · Have ${credits})`}
                    </button>
                    <button
                      onClick={() => setTab('design')}
                      className="rounded-lg bg-cyan-400 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:brightness-110"
                    >
                      {lang === 'ar' ? 'التالي: تصميم المركبة' : 'Next: Design Spacecraft'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {ARCHITECT_SCENARIOS.map((sc) => {
                    const active = sc.id === scenarioId;
                    const effCap = sc.isSandbox
                      ? 999
                      : Math.max(Math.round(sc.maxBudgetM * 0.5), sc.maxBudgetM + unlockedBudgetBonusM);
                    return (
                      <button
                        key={sc.id}
                        onClick={() => handleSelectScenario(sc.id)}
                        className={`rounded-xl border p-3 text-start transition ${
                          active
                            ? 'border-cyan-400 bg-cyan-500/15 text-white'
                            : 'border-white/10 bg-white/[0.02] text-slate-300 hover:border-white/25'
                        }`}
                      >
                        <div className="flex items-center justify-between font-mono text-[10px]">
                          <span className={`rounded bg-white/10 px-1.5 py-0.5 ${sc.difficulty === 'Extreme' ? 'text-rose-300' : 'text-amber-300'}`}>
                            {sc.difficulty.toUpperCase()}
                          </span>
                          <span className="text-cyan-300">
                            {sc.isSandbox ? 'FREE LAB' : `TARGET ${sc.targetScience} SCI · $${effCap}M`}
                          </span>
                        </div>
                        <div className="mt-1.5 text-sm font-bold text-white">{sc.title[lang]}</div>
                        <p className="mt-1 text-[11px] leading-relaxed text-slate-300">{sc.objective[lang]}</p>
                        <div className="mt-2 text-[10px] font-semibold text-amber-200">
                          {sc.criticalResource[lang]}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ==========================================================
              TAB 2: FULL SPACECRAFT, INSTRUMENTS, ORBIT & LAUNCH BUILDER
          ========================================================== */}
          {tab === 'design' && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              {/* Left: Interactive 2D Spacecraft + Orbit Visual Preview & Quick Presets */}
              <div className="space-y-3 rounded-xl border border-white/10 bg-[#0b111d] p-4 lg:col-span-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-300">
                    {lang === 'ar' ? 'المعاينة الهندسية والتوافق' : 'Live 2D Architecture & Compatibility'}
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">{orbit.altitudeLabel}</span>
                </div>

                {/* Reactive 2D SVG Spacecraft + Launcher + Orbit Visualizer */}
                <svg viewBox="0 0 320 190" className="h-44 w-full rounded-xl border border-white/10 bg-[#040812]">
                  {/* Orbit curve */}
                  <ellipse cx="185" cy="95" rx="108" ry="62" fill="none" stroke="rgba(56,189,248,0.28)" strokeDasharray="4 3" />
                  {/* Target Celestial Body */}
                  <circle
                    cx="185"
                    cy="95"
                    r="24"
                    fill={
                      orbit.id === 'mars_tmi'
                        ? '#c2410c'
                        : orbit.id === 'lunar_llo'
                          ? '#94a3b8'
                          : orbit.id === 'europa_jo'
                            ? '#cbd5e1'
                            : '#0284c7'
                    }
                  />
                  {/* Solar efficiency glow ring */}
                  <circle cx="38" cy="34" r="14" fill="#fbbf24" opacity={Math.max(0.18, orbit.solarEfficiency * 0.85)} />

                  {/* Selected Rocket Silhouette on Left */}
                  <g transform="translate(36, 128)">
                    <polygon points="0,-36 9,-16 9,36 -9,36 -9,-16" fill="#e2e8f0" stroke="#38bdf8" strokeWidth="1.2" />
                    <polygon points="-9,18 -16,38 -9,34" fill="#f59e0b" />
                    <polygon points="9,18 16,38 9,34" fill="#f59e0b" />
                    <text x="0" y="49" textAnchor="middle" fill="#94a3b8" fontSize="7.5" fontFamily="monospace">
                      {launcher.id.split('_')[0].toUpperCase()} ({metrics.maxLauncherPayloadAtOrbitKg}kg)
                    </text>
                  </g>

                  {/* Designed Spacecraft Diagram */}
                  <g transform="translate(222, 62)">
                    {/* Power System Wings or RTG Fins */}
                    {powerSys.id === 'pwr_rtg' ? (
                      <>
                        <rect x="-36" y="-5" width="18" height="10" fill="#f59e0b" stroke="#fbbf24" />
                        <rect x="18" y="-5" width="18" height="10" fill="#f59e0b" stroke="#fbbf24" />
                      </>
                    ) : (
                      <>
                        <rect
                          x={powerSys.id === 'pwr_mega_solar' ? -62 : -44}
                          y="-9"
                          width={powerSys.id === 'pwr_mega_solar' ? 44 : 26}
                          height="18"
                          fill="#1d4ed8"
                          stroke="#60a5fa"
                        />
                        <rect
                          x="18"
                          y="-9"
                          width={powerSys.id === 'pwr_mega_solar' ? 44 : 26}
                          height="18"
                          fill="#1d4ed8"
                          stroke="#60a5fa"
                        />
                      </>
                    )}
                    {/* Bus Body */}
                    <rect
                      x="-18"
                      y="-16"
                      width="36"
                      height="32"
                      rx="4"
                      fill={bus.id === 'bus_shield' ? '#334155' : bus.id === 'bus_std' ? '#475569' : '#64748b'}
                      stroke={metrics.massOk && metrics.powerOk ? '#34d399' : '#fb7185'}
                      strokeWidth="1.8"
                    />
                    {/* Comms Dish */}
                    <path
                      d={commsSys.id === 'comms_kaband' ? 'M -14,-18 Q 0,-34 14,-18' : 'M -9,-17 Q 0,-26 9,-17'}
                      fill="none"
                      stroke="#fbbf24"
                      strokeWidth="2.2"
                    />
                    {/* Attached Science Instruments Dots */}
                    {instruments.map((inst, idx) => (
                      <circle key={inst.id} cx={-12 + idx * 6} cy="21" r="2.8" fill="#22d3ee" />
                    ))}
                  </g>

                  <text x="115" y="178" fill="#cbd5e1" fontSize="8.5" fontFamily="monospace">
                    INSTRUMENTS: {instruments.length} • SOLAR FLUX: {Math.round(orbit.solarEfficiency * 100)}%
                  </text>
                </svg>

                {/* Simplified Presets Bar */}
                <div className="rounded-lg border border-white/10 bg-black/35 p-2.5">
                  <div className="mb-1.5 text-[11px] font-bold text-slate-300">
                    {lang === 'ar' ? 'قوالب سريعة للتجربة والمقارنة:' : 'Quick Engineering Presets:'}
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                    <button
                      onClick={() => applySimplifiedPreset('light')}
                      className="rounded border border-white/15 bg-white/5 py-1.5 font-bold text-slate-200 hover:bg-white/10"
                    >
                      {lang === 'ar' ? 'خفيف اقتصادي' : 'Light Budget'}
                    </button>
                    <button
                      onClick={() => applySimplifiedPreset('balanced')}
                      className="rounded border border-cyan-400/35 bg-cyan-500/15 py-1.5 font-bold text-cyan-200 hover:bg-cyan-500/25"
                    >
                      {lang === 'ar' ? 'متوازن علمي' : 'Balanced'}
                    </button>
                    <button
                      onClick={() => applySimplifiedPreset('flagship')}
                      className="rounded border border-amber-400/35 bg-amber-500/15 py-1.5 font-bold text-amber-200 whitespace-nowrap hover:bg-amber-500/25"
                    >
                      {lang === 'ar' ? 'عملاق أعماق' : 'Deep Flagship'}
                    </button>
                  </div>
                </div>

                {/* Two Valid Solutions Showcase (No Single Perfect Answer) */}
                <div className="rounded-lg border border-emerald-400/25 bg-emerald-500/[0.06] p-2.5">
                  <div className="mb-1.5 flex items-center justify-between text-[11px] font-bold text-emerald-300">
                    <span>
                      {lang === 'ar' ? 'قارن حلّين ناجحين (لا يوجد حل واحد فقط):' : 'Compare 2 Valid Lunar Solutions:'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                    {ALTERNATE_VALID_ARCHITECTURES.map((alt) => (
                      <button
                        key={alt.id}
                        onClick={() => applyValidArchitecture(alt.id)}
                        className="rounded border border-white/15 bg-black/45 p-2 text-start transition hover:border-emerald-400/60"
                      >
                        <div className="font-bold text-white">{alt.label[lang]}</div>
                        <div className="mt-0.5 text-[9px] leading-snug text-slate-300">
                          {alt.strategyNote[lang]}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live 4-Role Competing KPI Matrix (Turn Focus Selector) */}
                <div className="rounded-lg border border-white/10 bg-black/40 p-2.5 text-[11px]">
                  <div className="mb-1.5 font-bold text-cyan-300">
                    {lang === 'ar' ? 'مؤشرات الأداء المتنافسة للأدوار الأربعة:' : '4-Role Competing Engineering KPIs:'}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {TEAM_ROLES.map((r) => {
                      const kpi = roleKpis.find((k) => k.roleId === r.id);
                      const focused = activeRoleFocus === r.id;
                      return (
                        <button
                          key={r.id}
                          onClick={() => setActiveRoleFocus(r.id)}
                          className={`rounded border p-1.5 text-start transition ${
                            focused
                              ? 'border-cyan-400 bg-cyan-500/15'
                              : 'border-white/10 bg-white/[0.02] hover:border-white/25'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 text-[10px] font-bold">
                            <span className="truncate text-white">{r.title[lang]}</span>
                            <span className={kpi?.pass ? 'text-emerald-300' : 'text-rose-300'}>
                              {kpi?.pass ? 'OK' : 'FAIL'}
                            </span>
                          </div>
                          <div className="mt-0.5 font-mono text-[9px] text-slate-300 tabular-nums">
                            {kpi?.headline[lang]}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {(() => {
                    const activeKpi = roleKpis.find((k) => k.roleId === activeRoleFocus);
                    return activeKpi ? (
                      <div className="mt-1.5 text-[10px] text-slate-300">
                        {activeKpi.detail[lang]}
                      </div>
                    ) : null;
                  })()}
                </div>

                {/* Live Compatibility Verification Checklist */}
                <div className="space-y-1.5 rounded-xl border border-white/10 bg-black/40 p-3 text-xs">
                  <div className="font-bold text-white">
                    {lang === 'ar' ? 'فحص التوافق الهندسي التلقائي:' : 'Live Compatibility & Trade-Off Check:'}
                  </div>
                  {[
                    {
                      ok: metrics.massOk,
                      ar: metrics.massOk
                        ? `الكتلة متوافقة (${metrics.totalMassKg} ≤ ${metrics.maxLauncherPayloadAtOrbitKg} kg)`
                        : `خطأ: المركبة أثقل من قدرة الصاروخ عند هذا المدار!`,
                      en: metrics.massOk
                        ? `Mass fits rocket capacity (${metrics.totalMassKg} ≤ ${metrics.maxLauncherPayloadAtOrbitKg} kg)`
                        : `Blocker: Over rocket payload limit by ${metrics.totalMassKg - metrics.maxLauncherPayloadAtOrbitKg} kg!`,
                    },
                    {
                      ok: metrics.powerOk,
                      ar: metrics.powerOk
                        ? `الطاقة كافية (+${metrics.netPowerW} W)`
                        : `خطأ: عجز طاقة (${metrics.netPowerW} W) — استخدم RTG أو ألواح أكبر!`,
                      en: metrics.powerOk
                        ? `Power surplus healthy (+${metrics.netPowerW} W)`
                        : `Blocker: Power deficit (${metrics.netPowerW} W) — upgrade Solar or choose RTG!`,
                    },
                    {
                      ok: metrics.commsOk,
                      ar: metrics.commsOk
                        ? `الاتصالات تستوعب بيانات الأجهزة (${metrics.commsCapMbDay} MB/d)`
                        : `تحذير: اختناق بيانات — الهوائي أبطأ من الأجهزة!`,
                      en: metrics.commsOk
                        ? `Comms downlink handles all captured data`
                        : `Warning: Data bottleneck (${metrics.dataGenMbDay} > ${metrics.commsCapMbDay} MB/d) trims Science!`,
                    },
                    {
                      ok: metrics.budgetOk && metrics.scienceOk,
                      ar:
                        metrics.budgetOk && metrics.scienceOk
                          ? `الميزانية والعلم ضمن أهداف المهمة`
                          : `تحقق من الميزانية (${metrics.totalCostM}/${effectiveMaxBudgetM}M) والهدف العلمي (${metrics.effectiveScience}/${scenario.targetScience})`,
                      en:
                        metrics.budgetOk && metrics.scienceOk
                          ? `Budget & Science Goal satisfied`
                          : `Check Budget ($${metrics.totalCostM}/${effectiveMaxBudgetM}M) or Science (${metrics.effectiveScience}/${scenario.targetScience})`,
                    },
                  ].map((chk) => (
                    <div key={chk.en} className={`flex items-start gap-1.5 text-[11px] ${chk.ok ? 'text-emerald-300' : 'text-rose-300'}`}>
                      {chk.ok ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
                      <span>{lang === 'ar' ? chk.ar : chk.en}</span>
                    </div>
                  ))}
                </div>

                {/* Share / Export Design JSON */}
                <div className="rounded-lg border border-white/10 bg-black/35 p-2.5 text-[11px]">
                  <div className="mb-1.5 flex items-center justify-between font-bold text-slate-300">
                    <span className="flex items-center gap-1">
                      <Share2 className="h-3.5 w-3.5 text-cyan-400" />
                      {lang === 'ar' ? 'مشاركة أو استيراد تصميم' : 'Save / Share / Import Design'}
                    </span>
                    <button
                      onClick={handleExportCode}
                      className="flex items-center gap-1 rounded bg-cyan-400/20 px-2 py-0.5 text-[10px] font-bold text-cyan-200 hover:bg-cyan-400/30"
                    >
                      <Copy className="h-3 w-3" />
                      <span>{copiedFlag ? (lang === 'ar' ? 'تم النسخ!' : 'Copied!') : lang === 'ar' ? 'تصدير كود' : 'Export Code'}</span>
                    </button>
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={shareText}
                      onChange={(e) => setShareText(e.target.value)}
                      placeholder={lang === 'ar' ? 'الصق كود تصميم للمقارنة...' : 'Paste design code to load...'}
                      className="flex-1 rounded border border-white/10 bg-black/50 px-2 py-1 font-mono text-[10px] text-slate-200"
                    />
                    <button
                      onClick={handleImportCode}
                      className="rounded border border-white/15 bg-white/5 px-2 py-1 text-[10px] font-bold text-white hover:bg-white/10"
                    >
                      {lang === 'ar' ? 'استيراد' : 'Load'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Right 8 cols: Interactive Orbit, Rocket, Bus, Power, Comms & Instruments Pickers */}
              <div className="space-y-4 lg:col-span-8">
                {/* 1. Orbit & Launch Vehicle Grid */}
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-[#0b111d] p-3.5">
                    <div className="mb-2 text-xs font-bold text-amber-300">
                      {lang === 'ar' ? 'A. اختيار المدار (Orbit)' : 'A. Select Target Orbit'}
                    </div>
                    <div className="space-y-1.5">
                      {ORBIT_OPTIONS.map((o) => {
                        const active = o.id === orbitId;
                        const rec = scenario.recommendedOrbits.includes(o.id);
                        return (
                          <button
                            key={o.id}
                            onClick={() => setOrbitId(o.id)}
                            className={`w-full rounded-lg border p-2 text-start text-[11px] transition ${
                              active
                                ? 'border-cyan-400 bg-cyan-500/15 text-white'
                                : 'border-white/10 bg-white/[0.02] text-slate-300 hover:border-white/25'
                            }`}
                          >
                            <div className="flex items-center justify-between font-bold">
                              <span>{o.name[lang]}</span>
                              <span className="font-mono text-[10px] text-cyan-300">
                                {Math.round(o.solarEfficiency * 100)}% ☀ · {Math.round(o.massPenaltyFactor * 100)}% Mass
                              </span>
                            </div>
                            <div className="mt-0.5 text-[10px] text-slate-400">{o.explanation[lang]}</div>
                            {rec && !scenario.isSandbox && (
                              <div className="mt-0.5 text-[10px] font-bold text-emerald-300">
                                ★ {lang === 'ar' ? 'مدار موصى به لهذا الهدف' : 'Recommended for Mission Objective'}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-[#0b111d] p-3.5">
                    <div className="mb-2 text-xs font-bold text-cyan-300">
                      {lang === 'ar' ? 'B. مركبة الإطلاق (Launch Vehicle)' : 'B. Select Launch Vehicle'}
                    </div>
                    <div className="space-y-1.5">
                      {LAUNCH_VEHICLES.map((lv) => {
                        const active = lv.id === launcherId;
                        const capAtOrbit = Math.round(lv.leoCapacityKg * orbit.massPenaltyFactor);
                        const fits = metrics.totalMassKg <= capAtOrbit;
                        return (
                          <button
                            key={lv.id}
                            onClick={() => setLauncherId(lv.id)}
                            className={`w-full rounded-lg border p-2.5 text-start text-[11px] transition ${
                              active
                                ? 'border-amber-400 bg-amber-500/15 text-white'
                                : 'border-white/10 bg-white/[0.02] text-slate-300 hover:border-white/25'
                            }`}
                          >
                            <div className="flex items-center justify-between font-bold">
                              <span>{lv.name[lang]}</span>
                              <span className="font-mono text-amber-300">${lv.costM}M</span>
                            </div>
                            <div className="mt-0.5 flex items-center justify-between font-mono text-[10px]">
                              <span className={fits ? 'text-emerald-300' : 'text-rose-400'}>
                                {lang === 'ar' ? `الحمولة بالمدار: ${capAtOrbit} kg` : `Orbit Cap: ${capAtOrbit} kg`} ({fits ? 'FITS' : 'TOO HEAVY'})
                              </span>
                              <span className="text-slate-400">REL {lv.reliabilityPct}%</span>
                            </div>
                            <div className="mt-0.5 text-[10px] text-slate-400">{lv.note[lang]}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 2. Subsystems (Bus, Power, Comms, Attitude) */}
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {(
                    [
                      { cat: 'bus', titleAr: 'C. هيكل المركبة والحماية', titleEn: 'C. Spacecraft Bus & Shielding', val: busId, set: setBusId },
                      { cat: 'power', titleAr: 'D. نظام الطاقة والبطارية', titleEn: 'D. Power & Batteries', val: powerId, set: setPowerId },
                      { cat: 'comms', titleAr: 'E. الاتصالات وتنزيل البيانات', titleEn: 'E. Comms Downlink System', val: commsId, set: setCommsId },
                      { cat: 'adcs', titleAr: 'F. التحكم بالوضعية والحاسوب', titleEn: 'F. Attitude Control & Avionics', val: adcsId, set: setAdcsId },
                    ] as const
                  ).map((group) => (
                    <div key={group.cat} className="rounded-xl border border-white/10 bg-[#0b111d] p-3">
                      <div className="mb-2 text-xs font-bold text-white">
                        {lang === 'ar' ? group.titleAr : group.titleEn}
                      </div>
                      <div className="space-y-1.5">
                        {visibleSubsystems(group.cat).map((sub) => {
                          const active = sub.id === group.val;
                          return (
                            <button
                              key={sub.id}
                              onClick={() => group.set(sub.id)}
                              className={`w-full rounded-lg border p-2 text-start text-[11px] transition ${
                                active
                                  ? 'border-cyan-400 bg-cyan-500/15 text-white'
                                  : 'border-white/10 bg-white/[0.02] text-slate-300 hover:border-white/25'
                              }`}
                            >
                              <div className="flex items-center justify-between font-bold">
                                <span>{sub.name[lang]}</span>
                                <span className="font-mono text-[10px] text-amber-300">${sub.costM}M</span>
                              </div>
                              <div className="mt-0.5 font-mono text-[10px] text-cyan-300">
                                {sub.massKg}kg · {sub.powerW >= 0 ? `+${sub.powerW}W Gen` : `${sub.powerW}W Draw`}
                                {sub.dataCapMbDay ? ` · ${sub.dataCapMbDay} MB/d` : ''}
                              </div>
                              <div className="mt-0.5 text-[10px] text-slate-400">{sub.whyItMatters[lang]}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* 3. Multi-Select Scientific Instruments */}
                <div className="rounded-xl border border-white/10 bg-[#0b111d] p-3.5">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                      <Telescope className="h-4 w-4" />
                      <span>
                        {lang === 'ar'
                          ? 'G. الأجهزة العلمية (اضغط لإضافة/إزالة — كل جهاز يؤثر على الكتلة والطاقة والبيانات!)'
                          : 'G. Scientific Instruments (Toggle Payload — Real Mass, Power, Cost & Data Trade-Offs)'}
                      </span>
                    </div>
                    <button
                      onClick={() => setTab(playMode === 'team' ? 'negotiate' : 'simulate')}
                      className="rounded-lg bg-emerald-400 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:brightness-110"
                    >
                      {playMode === 'team'
                        ? lang === 'ar'
                          ? 'التالي: مفاوضات الفريق'
                          : 'Next: Team Trade-Offs'
                        : lang === 'ar'
                          ? 'محاكاة المهمة الآن'
                          : 'Simulate Mission'}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {INSTRUMENT_OPTIONS.map((inst) => {
                      const picked = selectedInstruments.includes(inst.id);
                      const orbitMatch = inst.bestForOrbits.includes(orbit.id);
                      return (
                        <button
                          key={inst.id}
                          onClick={() => toggleInstrument(inst.id)}
                          className={`rounded-xl border p-2.5 text-start text-[11px] transition ${
                            picked
                              ? 'border-emerald-400 bg-emerald-500/15 text-white'
                              : 'border-white/10 bg-white/[0.02] text-slate-300 hover:border-white/25'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span>{inst.name[lang]}</span>
                            <span className={`font-mono text-[10px] ${picked ? 'text-emerald-300' : 'text-amber-300'}`}>
                              {picked ? '✔ ON' : `+${inst.scienceVal} SCI`}
                            </span>
                          </div>
                          <div className="mt-1 font-mono text-[10px] text-cyan-300">
                            {inst.massKg}kg · -{inst.powerW}W · ${inst.costM}M · {inst.dataMbDay}MB/d
                          </div>
                          <div className="mt-0.5 text-[10px] text-slate-400">{inst.whyItMatters[lang]}</div>
                          {orbitMatch && (
                            <div className="mt-1 text-[10px] font-bold text-amber-300">
                              ★ +10 {lang === 'ar' ? 'توافق مداري' : 'Orbit Synergy'}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==========================================================
              TAB 3: TEAM PRIORITY NEGOTIATIONS (1–4P COLLABORATION)
          ========================================================== */}
          {tab === 'negotiate' && (
            <div className="mx-auto max-w-4xl space-y-4">
              <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 text-xs">
                <div className="font-bold text-amber-300">
                  {lang === 'ar'
                    ? 'غرفة التفاوض الهندسي للفريق (حسم الأولويات المتعارضة)'
                    : 'Team Priority Negotiation Room (Resolve Competing Engineering Demands)'}
                </div>
                <p className="mt-1 text-slate-200">
                  {lang === 'ar'
                    ? 'في الفرق الفضائية الحقيقية يتنافس العلماء مع مهندسي الطاقة والميزانية والاتصالات. اختيارات الفريق هنا تغيّر الكتلة والميزانية والطاقة وجودة التنسيق عند الإطلاق!'
                    : 'Real mission teams must balance competing demands across Science, Power, Budget, and Comms. Each joint decision below directly shifts Spacecraft Mass, Cost, Power, and your Team Coordination Score!'}
                </p>
              </div>

              {TEAM_NEGOTIATION_DILEMMAS.map((dil) => {
                const pickedId = negotiationChoices[dil.id];
                return (
                  <div key={dil.id} className="rounded-xl border border-white/10 bg-[#0b111d] p-4 space-y-3">
                    <div>
                      <div className="text-sm font-bold text-white">{dil.title[lang]}</div>
                      <p className="mt-1 text-xs text-slate-300">{dil.conflict[lang]}</p>
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {dil.options.map((opt) => {
                        const active = pickedId === opt.id;
                        return (
                          <button
                            key={opt.id}
                            onClick={() =>
                              setNegotiationChoices((prev) => ({ ...prev, [dil.id]: opt.id }))
                            }
                            className={`rounded-xl border p-3 text-start text-xs transition ${
                              active
                                ? 'border-cyan-400 bg-cyan-500/15 text-white'
                                : 'border-white/10 bg-white/[0.02] text-slate-300 hover:border-white/25'
                            }`}
                          >
                            <div className="font-bold">{opt.label[lang]}</div>
                            <p className="mt-1 text-[11px] text-slate-400">{opt.consequence[lang]}</p>
                            <div className="mt-2 font-mono text-[10px] text-cyan-300">
                              SCI {opt.scienceDelta >= 0 ? `+${opt.scienceDelta}` : opt.scienceDelta} · COST {opt.costDeltaM >= 0 ? `+$${opt.costDeltaM}M` : `-$${Math.abs(opt.costDeltaM)}M`} · MASS {opt.massDeltaKg >= 0 ? `+${opt.massDeltaKg}` : opt.massDeltaKg}kg
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <div className="flex justify-end">
                <button
                  onClick={runSimulation}
                  className="flex items-center gap-2 rounded-xl bg-emerald-400 px-6 py-3 text-sm font-bold text-slate-950 hover:brightness-110"
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span>{lang === 'ar' ? 'إطلاق ومحاكاة المهمة بالكامل' : 'Launch & Simulate Full Mission'}</span>
                </button>
              </div>
            </div>
          )}

          {/* ==========================================================
              TAB 4B: COMMS LINK, GROUND SEGMENT, TIMELINE & GMAT VALIDATION
          ========================================================== */}
          {tab === 'ops' && (
            <SpaceOpsSystemsPanel
              lang={lang}
              orbit={orbit}
              commsSys={commsSys}
              adcsSys={adcsSys}
              rawDataGenMbDay={metrics.rawDataGenMbDay}
              massOk={metrics.massOk}
              powerOk={metrics.powerOk}
              scienceOk={metrics.scienceOk}
              lifetimeOk={metrics.lifetimeOk}
              totalMassKg={metrics.totalMassKg}
              maxPayloadKg={metrics.maxLauncherPayloadAtOrbitKg}
              powerGenW={metrics.powerGenW}
              netPowerW={metrics.netPowerW}
              effectiveScience={metrics.effectiveScience}
              targetScience={scenario.targetScience}
              selectedStationId={activeGroundStationId}
              onSelectStationId={setActiveGroundStationId}
              compressionMode={commsCompressionMode}
              onChangeCompression={setCommsCompressionMode}
              fidelityMode={analysisFidelityMode}
              onChangeFidelityMode={setAnalysisFidelityMode}
              dutyCycleActive={playMode === 'team' && negotiationChoices['neg_comms_power'] === 'opt_schedule_duty'}
              storeBufferMb={dataStorage}
              storeTransmittedMb={dataTransmitted}
              onSyncDownlinkToStore={recordGroundPassDownlink}
            />
          )}

          {/* ==========================================================
              TAB 5: 6-STAGE MISSION TIMELINE & POST-MISSION CAUSAL ANALYSIS
          ========================================================== */}
          {tab === 'simulate' && (
            <div className="space-y-4">
              {!simReport ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#0b111d] p-10 text-center">
                  <Rocket className="h-10 w-10 text-cyan-400" />
                  <h3 className="font-display mt-3 text-lg font-bold text-white">
                    {lang === 'ar' ? 'جاهز لمحاكاة المهمة الكاملة' : 'Ready to Simulate Your Complete Mission'}
                  </h3>
                  <p className="mt-1 max-w-lg text-xs text-slate-300">
                    {lang === 'ar'
                      ? 'سيتم اختبار المراحل الست: الإطلاق ← الحقن المداري ← الرحلة ← الهبوط ← العمليات العلمية ← بث البيانات للمحطات الأرضية!'
                      : 'Tests all 6 phases: Launch → Orbit Insertion → Cruise → Landing → Science Ops → DSN Data Transmission!'}
                  </p>
                  <button
                    onClick={runSimulation}
                    className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-400 px-6 py-3 text-sm font-bold text-slate-950 hover:brightness-110"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    <span>{lang === 'ar' ? 'بدء المحاكاة الآن' : 'Run Mission Simulation'}</span>
                  </button>
                </div>
              ) : (
                <>
                  {/* 6-Stage Flight Timeline Stepper */}
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                    {MISSION_TIMELINE_PHASES.map((ph) => (
                      <div
                        key={ph.id}
                        className={`rounded-xl border px-3 py-2 font-mono text-[11px] font-bold ${
                          simStep >= ph.order
                            ? 'border-cyan-400/50 bg-cyan-500/15 text-white'
                            : 'border-white/10 bg-black/30 text-slate-500'
                        }`}
                      >
                        <div>{ph.title[lang]}</div>
                        <div className="mt-0.5 text-[9px] text-cyan-300">{ph.metLabel}</div>
                      </div>
                    ))}
                  </div>

                  {/* Full Post-Mission Analysis Card (Appears cleanly once step 6 lands) */}
                  {simStep >= 6 && (
                    <div
                      className={`rounded-2xl border p-5 ${
                        simReport.success
                          ? 'border-emerald-400/50 bg-emerald-500/10'
                          : 'border-rose-400/50 bg-rose-500/10'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
                        <div>
                          <div className="font-mono text-xs uppercase tracking-widest text-amber-300">
                            {lang === 'ar' ? 'تحليل ما بعد المهمة (Post-Mission Report)' : 'POST-MISSION CAUSAL ANALYSIS'}
                          </div>
                          <h3 className="font-display mt-1 text-2xl font-bold text-white">
                            {simReport.success
                              ? lang === 'ar'
                                ? 'نجحت المهمة الفضائية بالكامل!'
                                : 'MISSION ACCOMPLISHED!'
                              : lang === 'ar'
                                ? 'تعذّر إتمام المهمة — خصم من الفلوس وميزانية الوكالة'
                                : 'MISSION UNSUCCESSFUL — CREDITS & AGENCY BUDGET CUT'}
                          </h3>
                        </div>
                        <div className="flex items-center gap-3 font-mono tabular-nums">
                          <div className="rounded-xl border border-white/15 bg-black/40 px-4 py-2 text-center">
                            <div className="text-[10px] text-slate-400">SCORE</div>
                            <div className="text-2xl font-bold text-amber-300">{simReport.score}</div>
                          </div>
                          <div
                            className={`flex h-16 w-16 flex-col items-center justify-center rounded-2xl border ${
                              simReport.success
                                ? 'border-emerald-400 bg-emerald-500/20'
                                : 'border-rose-400 bg-rose-500/20'
                            }`}
                          >
                            <span className="text-[9px] text-slate-200">GRADE</span>
                            <span className="font-display text-2xl font-bold text-white">{simReport.grade}</span>
                          </div>
                        </div>
                      </div>

                      {/* Random Event Box */}
                      <div className="mt-4 rounded-xl border border-amber-400/35 bg-black/40 p-3.5 text-xs">
                        <div className="flex items-center gap-2 font-bold text-amber-300">
                          <Zap className="h-4 w-4" />
                          <span>{lang === 'ar' ? simReport.eventOutcome.titleAr : simReport.eventOutcome.titleEn}</span>
                        </div>
                        <p className="mt-1 text-slate-300">
                          {lang === 'ar' ? simReport.eventOutcome.descAr : simReport.eventOutcome.descEn}
                        </p>
                        <div className={`mt-1.5 font-bold ${simReport.eventOutcome.resolved ? 'text-emerald-300' : 'text-rose-300'}`}>
                          {lang === 'ar' ? simReport.eventOutcome.effectAr : simReport.eventOutcome.effectEn}
                        </div>
                      </div>

                      {/* Causal Trade-Off Breakdown */}
                      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div className="rounded-xl border border-white/10 bg-black/40 p-3.5">
                          <div className="mb-2 text-xs font-bold text-cyan-300">
                            {lang === 'ar' ? 'لماذا نجحت أو فشلت قراراتك الهندسية؟' : 'Why Decisions Shaped This Outcome:'}
                          </div>
                          <ul className="space-y-1.5 text-xs text-slate-200">
                            {(lang === 'ar' ? simReport.causalReasonsAr : simReport.causalReasonsEn).map((r) => (
                              <li key={r}>• {r}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="flex flex-col justify-between rounded-xl border border-white/10 bg-black/40 p-3.5 text-xs">
                          <div>
                            <div className="mb-2 font-bold text-emerald-300">
                              {lang === 'ar' ? 'تحسين التصميم (What-If Insight)' : 'Engineering Trade-Off Tip:'}
                            </div>
                            <p className="leading-relaxed text-slate-200">
                              {lang === 'ar' ? simReport.whatIfAr : simReport.whatIfEn}
                            </p>
                          </div>
                          <div className="mt-3 grid grid-cols-3 gap-2 font-mono text-center tabular-nums">
                            <div className="rounded bg-white/5 p-2">
                              <div className="text-[9px] text-slate-400">SCIENCE</div>
                              <div className="font-bold text-emerald-300">{simReport.scienceScore}%</div>
                            </div>
                            <div className="rounded bg-white/5 p-2">
                              <div className="text-[9px] text-slate-400">EFFICIENCY</div>
                              <div className="font-bold text-cyan-300">{simReport.efficiencyScore}%</div>
                            </div>
                            <div className="rounded bg-white/5 p-2">
                              <div className="text-[9px] text-slate-400">TEAM SYNC</div>
                              <div className="font-bold text-amber-300">{simReport.coordScore}%</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* v1 vs v2 Design Iteration Diff Card */}
                      {prevIterationSnapshot && lastIterationSnapshot && (
                        <div className="mt-4 rounded-xl border border-cyan-400/30 bg-black/45 p-3.5 text-xs">
                          <div className="mb-2 font-mono text-[10px] font-bold tracking-wider text-cyan-300 uppercase">
                            {lang === 'ar'
                              ? 'مقارنة تكرار التصميم (التجربة السابقة v1 ← الحالية v2)'
                              : 'DESIGN ITERATION COMPARE (PREVIOUS v1 → CURRENT v2)'}
                          </div>
                          <div className="grid grid-cols-2 gap-2 font-mono text-[11px] tabular-nums sm:grid-cols-5">
                            {[
                              {
                                label: lang === 'ar' ? 'الكتلة' : 'MASS',
                                val: `${lastIterationSnapshot.massKg}kg`,
                                diff: lastIterationSnapshot.massKg - prevIterationSnapshot.massKg,
                                suffix: 'kg',
                                lowerBetter: true,
                              },
                              {
                                label: lang === 'ar' ? 'صافي الطاقة' : 'NET PWR',
                                val: `${lastIterationSnapshot.netPowerW >= 0 ? `+${lastIterationSnapshot.netPowerW}` : lastIterationSnapshot.netPowerW}W`,
                                diff: lastIterationSnapshot.netPowerW - prevIterationSnapshot.netPowerW,
                                suffix: 'W',
                                lowerBetter: false,
                              },
                              {
                                label: lang === 'ar' ? 'التكلفة' : 'COST',
                                val: `$${lastIterationSnapshot.costM}M`,
                                diff: lastIterationSnapshot.costM - prevIterationSnapshot.costM,
                                suffix: 'M',
                                lowerBetter: true,
                              },
                              {
                                label: lang === 'ar' ? 'العلم' : 'SCIENCE',
                                val: `${lastIterationSnapshot.science}`,
                                diff: lastIterationSnapshot.science - prevIterationSnapshot.science,
                                suffix: ' pts',
                                lowerBetter: false,
                              },
                              {
                                label: lang === 'ar' ? 'النقاط' : 'SCORE',
                                val: `${lastIterationSnapshot.score} (${lastIterationSnapshot.grade})`,
                                diff: lastIterationSnapshot.score - prevIterationSnapshot.score,
                                suffix: '',
                                lowerBetter: false,
                              },
                            ].map((item) => {
                              const improved = item.lowerBetter ? item.diff < 0 : item.diff > 0;
                              const diffColor =
                                item.diff === 0
                                  ? 'text-slate-400'
                                  : improved
                                    ? 'text-emerald-300'
                                    : 'text-amber-300';
                              return (
                                <div key={item.label} className="rounded border border-white/10 bg-white/[0.03] px-2.5 py-1.5">
                                  <div className="text-[9px] text-slate-400">{item.label}</div>
                                  <div className="font-bold text-white">{item.val}</div>
                                  <div className={`text-[10px] font-bold ${diffColor}`}>
                                    {item.diff > 0 ? `+${item.diff}` : item.diff}
                                    {item.suffix}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap gap-2.5">
                        <button
                          onClick={() => handleDeployTo3D('spaceflight')}
                          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-5 py-2.5 text-xs font-bold text-slate-950 whitespace-nowrap shrink-0 hover:brightness-110"
                        >
                          <Rocket className="h-4 w-4" />
                          <span>
                            {lang === 'ar'
                              ? 'طِر بهذه المركبة الآن في الفضاء 3D'
                              : 'Fly This Spacecraft Now in 3D Space'}
                          </span>
                        </button>
                        <button
                          onClick={() => handleDeployTo3D('mission-viz')}
                          className="flex items-center gap-1.5 rounded-xl border border-sky-400/45 bg-sky-500/15 px-4 py-2.5 text-xs font-bold text-sky-200 whitespace-nowrap shrink-0 hover:bg-sky-500/25"
                        >
                          <Compass className="h-3.5 w-3.5" />
                          <span>
                            {lang === 'ar' ? 'معاينة مسار المدار GMAT أولاً' : 'Preview GMAT Trajectory'}
                          </span>
                        </button>
                        <button
                          onClick={() => setTab('design')}
                          className="flex items-center gap-1.5 rounded-xl bg-cyan-400 px-4 py-2.5 text-xs font-bold text-slate-950 whitespace-nowrap shrink-0 hover:brightness-110"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>{lang === 'ar' ? 'تعديل التصميم وإعادة المحاكاة' : 'Modify Design & Re-Simulate'}</span>
                        </button>
                        <button
                          onClick={() => setTab('leaderboard')}
                          className="flex items-center gap-1.5 rounded-xl border border-amber-400/40 bg-amber-500/15 px-4 py-2.5 text-xs font-bold text-amber-200 whitespace-nowrap shrink-0 hover:bg-amber-500/25"
                        >
                          <Trophy className="h-3.5 w-3.5" />
                          <span>{lang === 'ar' ? 'مقارنة بالتصاميم ولوحة الصدارة' : 'Compare on Leaderboard'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ==========================================================
              TAB 5: LEADERBOARD & MISSION DESIGN COMPARISON
          ========================================================== */}
          {tab === 'leaderboard' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-bold text-amber-300">
                  <Trophy className="h-4 w-4" />
                  <span>
                    {lang === 'ar'
                      ? 'لوحة صدارة الفرق ومقارنة تصاميم المهمات'
                      : 'Mission Design Leaderboard & Saved Architecture Comparison'}
                  </span>
                </div>
                <button
                  onClick={() => setTab('design')}
                  className="rounded-lg bg-cyan-400 px-3.5 py-1.5 text-xs font-bold text-slate-950"
                >
                  {lang === 'ar' ? 'تصميم مهمة جديدة' : 'Design New Mission'}
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#0b111d]">
                <table className="w-full text-start font-mono text-xs tabular-nums">
                  <thead className="border-b border-white/10 bg-black/50 text-[10px] text-slate-400">
                    <tr>
                      <th className="px-3 py-2.5 text-start">#</th>
                      <th className="px-3 py-2.5 text-start">{lang === 'ar' ? 'الفريق / القائد' : 'TEAM / DESIGNER'}</th>
                      <th className="px-3 py-2.5 text-start">{lang === 'ar' ? 'المهمة' : 'SCENARIO'}</th>
                      <th className="px-3 py-2.5 text-start">{lang === 'ar' ? 'المدار والصاروخ' : 'ORBIT / ROCKET'}</th>
                      <th className="px-3 py-2.5 text-start">{lang === 'ar' ? 'الكتلة / التكلفة' : 'MASS / COST'}</th>
                      <th className="px-3 py-2.5 text-start">{lang === 'ar' ? 'العلم' : 'SCIENCE'}</th>
                      <th className="px-3 py-2.5 text-start">{lang === 'ar' ? 'النقاط والرتبة' : 'SCORE / GRADE'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {architectRuns.map((r, idx) => (
                      <tr key={r.id} className="hover:bg-white/[0.02]">
                        <td className="px-3 py-2.5 text-slate-400">{idx + 1}</td>
                        <td className="px-3 py-2.5 font-sans font-bold text-white">
                          {r.teamName}{' '}
                          <span className="ms-1 rounded bg-white/10 px-1.5 py-0.5 font-mono text-[9px] uppercase text-cyan-300">
                            {r.mode}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-sans text-slate-200">{r.scenarioTitle}</td>
                        <td className="px-3 py-2.5 text-slate-300">
                          {r.orbitName} · {r.launcherName}
                        </td>
                        <td className="px-3 py-2.5 text-cyan-300">
                          {r.massKg}kg · ${r.costM}M
                        </td>
                        <td className="px-3 py-2.5 text-emerald-300">
                          {r.scienceVal} pts ({r.instrumentCount} inst)
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`font-bold ${r.success ? 'text-amber-300' : 'text-rose-400'}`}>
                            {r.score} ({r.grade})
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
