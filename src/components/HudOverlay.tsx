import {
  Activity,
  AlertTriangle,
  Award,
  BookOpen,
  Bot,
  Camera,
  Car,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Circle,
  CloudLightning,
  Coffee,
  Compass,
  Crosshair,
  DoorOpen,
  FileText,
  Flame,
  Gamepad2,
  Globe,
  Hammer,
  HeartPulse,
  Layers,
  Leaf,
  Monitor,
  MousePointer,
  Navigation,
  Orbit,
  Pause,
  PlaneLanding,
  Radio,
  Rocket,
  RotateCw,
  Sliders,
  Sparkles,
  Tablet,
  Telescope,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { UI_COPY, getDisplayCommander } from '../data/i18n';
import { PLANETS } from '../data/novaData';
import { SURVIVAL_MISSIONS } from '../data/nasaSurvivalData';
import { useGameStore } from '../store/gameStore';
import type { InteriorStationId, SpaceWeather } from '../types/game';
import { RadarDisplay } from './RadarDisplay';
import { VirtualFlightPad } from './VirtualFlightPad';

const SHUTTLE_SECTIONS: Array<{
  id: InteriorStationId;
  ar: string;
  en: string;
}> = [
  { id: 'main_dashboard', ar: 'داش بورد البهو', en: 'Atrium Dash' },
  { id: 'control_2d', ar: 'محطة 2D', en: '2D Hub' },
  { id: 'helm', ar: 'القيادة (رايان)', en: 'Flight (Ryan)' },
  { id: 'nav', ar: 'الملاحة (نادية)', en: 'GMAT (Nadia)' },
  { id: 'science_lab', ar: 'التلسكوب (إيلينا)', en: 'Scope (Elena)' },
  { id: 'bio_bay', ar: 'الزراعة (عمر)', en: 'Bio (Omar)' },
  { id: 'lounge', ar: 'الاستراحة (مايا)', en: 'Galley (Maya)' },
  { id: 'med_bay', ar: 'العيادة (صوفيا)', en: 'Med (Sophia)' },
  { id: 'engineering', ar: 'المفاعل (ماركوس)', en: 'MDL (Marcus)' },
  { id: 'cargo_bay', ar: 'الروفر (ديفون)', en: 'Rover (Devon)' },
  { id: 'comms_desk', ar: 'DSN (آريا)', en: 'DSN (Aria)' },
  { id: 'airlock', ar: 'البوابة (ليو)', en: 'Airlock (Leo)' },
];

const WEATHER_ICON: Record<SpaceWeather, typeof Flame> = {
  clear: Sparkles,
  solar_flare: Flame,
  asteroid_squall: Compass,
  ion_storm: CloudLightning,
};

function formatMissionElapsedTime(solTime: number): string {
  const totalSeconds = Math.max(0, Math.floor(solTime * 218));
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return `+${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function HudOverlay() {
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [eventsOpen, setEventsOpen] = useState(true);
  const [telemetryOpen, setTelemetryOpen] = useState(true);
  const [skyCardDismissed, setSkyCardDismissed] = useState(false);

  const lang = useGameStore((s) => s.lang);
  const toggleLang = useGameStore((s) => s.toggleLang);
  const sceneEnv = useGameStore((s) => s.sceneEnv);
  const setSceneEnv = useGameStore((s) => s.setSceneEnv);
  const character = useGameStore((s) => s.character);
  const resources = useGameStore((s) => s.resources);
  const activePlanetId = useGameStore((s) => s.activePlanet);
  const discoveredPlanets = useGameStore((s) => s.discoveredPlanets);
  const collectedSampleIds = useGameStore((s) => s.collectedSampleIds);
  const telescope = useGameStore((s) => s.telescope);
  const monolithInspected = useGameStore((s) => s.monolithInspected);
  const pilotingRover = useGameStore((s) => s.pilotingRover);
  const cameraMode = useGameStore((s) => s.cameraMode);
  const weather = useGameStore((s) => s.weather);
  const interiorTelemetry = useGameStore((s) => s.interiorTelemetry);
  const spaceTelemetry = useGameStore((s) => s.spaceTelemetry);
  const surfaceTelemetry = useGameStore((s) => s.surfaceTelemetry);
  const virtualInput = useGameStore((s) => s.virtualInput);
  const touchPadOpen = useGameStore((s) => s.touchPadOpen);
  const toastText = useGameStore((s) => s.toastText);
  const skyMessages = useGameStore((s) => s.skyMessages);
  const skyMood = useGameStore((s) => s.skyMood);
  const skyOpen = useGameStore((s) => s.skyOpen);

  const setVirtualInput = useGameStore((s) => s.setVirtualInput);
  const setTouchPadOpen = useGameStore((s) => s.setTouchPadOpen);
  const returnToBridge = useGameStore((s) => s.returnToBridge);
  const jumpToShuttleSection = useGameStore((s) => s.jumpToShuttleSection);
  const takeLoungeBreak = useGameStore((s) => s.takeLoungeBreak);
  const harvestBioBay = useGameStore((s) => s.harvestBioBay);
  const runMedBayScan = useGameStore((s) => s.runMedBayScan);
  const inspectCargoBay = useGameStore((s) => s.inspectCargoBay);
  const talkCommsOfficer = useGameStore((s) => s.talkCommsOfficer);
  const boardShipAndLaunch = useGameStore((s) => s.boardShipAndLaunch);
  const flyToPlanet = useGameStore((s) => s.flyToPlanet);
  const setAutopilot = useGameStore((s) => s.setAutopilot);
  const landOnPlanet = useGameStore((s) => s.landOnPlanet);
  const toggleRover = useGameStore((s) => s.toggleRover);
  const fireOrScan = useGameStore((s) => s.fireOrScan);
  const triggerBarrelRoll = useGameStore((s) => s.triggerBarrelRoll);
  const cycleWeather = useGameStore((s) => s.cycleWeather);
  const setCameraMode = useGameStore((s) => s.setCameraMode);
  const setTabletOpen = useGameStore((s) => s.setTabletOpen);
  const setMapOpen = useGameStore((s) => s.setMapOpen);
  const setSkyOpen = useGameStore((s) => s.setSkyOpen);
  const setGuideOpen = useGameStore((s) => s.setGuideOpen);
  const setPitchDeckOpen = useGameStore((s) => s.setPitchDeckOpen);
  const setTelescopeLabOpen = useGameStore((s) => s.setTelescopeLabOpen);
  const openMissionViz = useGameStore((s) => s.openMissionViz);
  const setScreen = useGameStore((s) => s.setScreen);
  const mouseLocked = useGameStore((s) => s.mouseLocked);
  const toggleMouseLock = useGameStore((s) => s.toggleMouseLock);
  const setDashboardOpen = useGameStore((s) => s.setDashboardOpen);
  const openSurvivalDashboard2d = useGameStore((s) => s.openSurvivalDashboard2d);
  const setArchitectOpen = useGameStore((s) => s.setArchitectOpen);
  const setStoryIntroOpen = useGameStore((s) => s.setStoryIntroOpen);
  const hullIntegrity = useGameStore((s) => s.hullIntegrity);
  const survivalFailures = useGameStore((s) => s.survivalFailures);
  const completedSurvivalIds = useGameStore((s) => s.completedSurvivalIds);
  const astronautBio = useGameStore((s) => s.astronautBio);
  const lastDamageAt = useGameStore((s) => s.lastDamageAt);
  const onSpacecraftRefuel = useGameStore((s) => s.onSpacecraftRefuel);
  const outpostMenuOpen = useGameStore((s) => s.outpostMenuOpen);
  const setOutpostMenuOpen = useGameStore((s) => s.setOutpostMenuOpen);
  const buildSurfaceStructure = useGameStore((s) => s.buildSurfaceStructure);
  const surfaceBuildings = useGameStore((s) => s.surfaceBuildings);
  const scannedCreatureIds = useGameStore((s) => s.scannedCreatureIds);
  const activeBlueprint = useGameStore((s) => s.activeBlueprint);
  const analysisFidelityMode = useGameStore((s) => s.analysisFidelityMode);
  const commsCompressionMode = useGameStore((s) => s.commsCompressionMode);
  const lastDownlinkKbps = useGameStore((s) => s.lastDownlinkKbps);
  const setMode2dOpen = useGameStore((s) => s.setMode2dOpen);
  const cycleCommsStation = useGameStore((s) => s.cycleCommsStation);
  const transmitDataPacket = useGameStore((s) => s.transmitDataPacket);
  const fuelPct = useGameStore((s) => s.fuelPct);
  const internalTempC = useGameStore((s) => s.internalTempC);
  const operationalMode = useGameStore((s) => s.operationalMode);
  const lifecyclePhase = useGameStore((s) => s.lifecyclePhase);
  const activeMissionEvent = useGameStore((s) => s.activeMissionEvent);
  const setMccOpen = useGameStore((s) => s.setMccOpen);
  const setSystemsLabOpen = useGameStore((s) => s.setSystemsLabOpen);
  const setWhatIfOpen = useGameStore((s) => s.setWhatIfOpen);
  const setReportOpen = useGameStore((s) => s.setReportOpen);
  const [damageFlash, setDamageFlash] = useState(false);

  useEffect(() => {
    if (!lastDamageAt) return;
    setDamageFlash(true);
    const t = window.setTimeout(() => setDamageFlash(false), 650);
    return () => window.clearTimeout(t);
  }, [lastDamageAt]);

  const activePlanet = PLANETS.find((p) => p.id === activePlanetId) || PLANETS[0];
  const nearbySpacePlanet = spaceTelemetry.nearbyPlanetId
    ? PLANETS.find((p) => p.id === spaceTelemetry.nearbyPlanetId)
    : null;
  const targetPlanet = spaceTelemetry.targetPlanetId
    ? PLANETS.find((p) => p.id === spaceTelemetry.targetPlanetId)
    : null;

  const latestSky = useMemo(
    () => [...skyMessages].reverse().find((m) => m.sender === 'sky') || null,
    [skyMessages]
  );
  const latestSkyId = latestSky?.id ?? 0;

  useEffect(() => {
    if (latestSkyId > 0) setSkyCardDismissed(false);
  }, [latestSkyId]);

  const playerDisplayName = getDisplayCommander(character.name, lang);
  const WeatherIcon = WEATHER_ICON[weather];

  const missionEvents = useMemo(
    () => [
      {
        id: 'first_motion',
        title: lang === 'ar' ? 'تجهيز المكوك' : 'Shuttle Checkout',
        time: '+00:00:00',
        done: true,
        active: sceneEnv === 'interior',
      },
      {
        id: 'scope_cubesat',
        title: lang === 'ar' ? 'تلسكوب & CubeSat' : 'Telescope / CubeSat',
        time: '+00:04:12',
        done: telescope.deployedCount > 0 || telescope.cubeSatPhase > 1,
        active: false,
      },
      {
        id: 'orbital_flight',
        title: lang === 'ar' ? 'الإقلاع والمدار' : 'Orbital Insertion',
        time: '+00:08:30',
        done: discoveredPlanets.length >= 2 || sceneEnv === 'spaceflight',
        active: sceneEnv === 'spaceflight',
      },
      {
        id: 'surface_ops',
        title: lang === 'ar' ? 'مسح السطح والروفر' : 'Rover & Samples',
        time: '+01:12:45',
        done: collectedSampleIds.length >= 1,
        active: sceneEnv === 'planet',
      },
      {
        id: 'dsn_uplink',
        title: lang === 'ar' ? 'بث DSN للأرض' : 'DSN Earth Uplink',
        time: '+02:18:10',
        done: resources.dataTransmitted > 0,
        active: false,
      },
      {
        id: 'signal_2089',
        title: lang === 'ar' ? 'لغز إشارة 2089' : '2089 Harmonic Array',
        time: '+03:38:27',
        done: monolithInspected,
        active: false,
      },
    ],
    [
      lang,
      sceneEnv,
      telescope.deployedCount,
      telescope.cubeSatPhase,
      discoveredPlanets.length,
      collectedSampleIds.length,
      resources.dataTransmitted,
      monolithInspected,
    ]
  );

  const handleToggleCamera = () => {
    if (sceneEnv === 'spaceflight') {
      setCameraMode(cameraMode === 'chase' ? 'cockpit' : 'chase');
    } else if (sceneEnv === 'planet' || sceneEnv === 'interior') {
      setCameraMode(cameraMode === 'first-person' ? 'chase' : 'first-person');
    }
  };

  const handleInteriorStationAction = () => {
    const id = interiorTelemetry.nearStation?.id;
    if (id === 'main_dashboard') setDashboardOpen(true);
    else if (id === 'control_2d') openSurvivalDashboard2d();
    else if (id === 'helm') boardShipAndLaunch();
    else if (id === 'nav') openMissionViz();
    else if (id === 'science_lab') setTelescopeLabOpen(true);
    else if (id === 'bio_bay') harvestBioBay();
    else if (id === 'lounge') takeLoungeBreak();
    else if (id === 'med_bay') runMedBayScan();
    else if (id === 'engineering') setTabletOpen(true, 'builder');
    else if (id === 'cargo_bay') inspectCargoBay();
    else if (id === 'comms_desk') talkCommsOfficer();
    else if (id === 'airlock') landOnPlanet(activePlanetId);
  };

  const phaseBadge =
    sceneEnv === 'interior'
      ? lang === 'ar'
        ? 'داخل المكوك'
        : 'ORBITER DECK OPS'
      : sceneEnv === 'spaceflight'
        ? spaceTelemetry.boosting
          ? 'MAIN ENGINE BURN'
          : 'POST-BURN COAST'
        : sceneEnv === 'planet'
          ? pilotingRover
            ? 'ROVER EVA TRAVERSE'
            : 'SURFACE EVA OPS'
          : sceneEnv === 'mission-viz'
            ? 'GMAT TRAJECTORY SIM'
            : 'ORBITER CHECKOUT';

  const statusText =
    spaceTelemetry.hazardLevel === 'SEVERE'
      ? lang === 'ar'
        ? 'تحذير إشعاعي حرج'
        : 'RADIATION WARNING'
      : spaceTelemetry.hazardLevel === 'ELEVATED'
        ? lang === 'ar'
          ? 'تنبيه طقس فضائي'
          : 'CAUTION: DEBRIS'
        : lang === 'ar'
          ? 'جميع الأنظمة مثالية'
          : 'ALL SYSTEMS NOMINAL';

  const statusColor =
    spaceTelemetry.hazardLevel === 'SEVERE'
      ? 'text-rose-400'
      : spaceTelemetry.hazardLevel === 'ELEVATED'
        ? 'text-amber-300'
        : 'text-emerald-400';

  const metString = formatMissionElapsedTime(resources.solTime);
  const showCockpitHudLadder = sceneEnv === 'spaceflight' && cameraMode === 'cockpit';
  const activeHeading =
    sceneEnv === 'planet' ? surfaceTelemetry.headingDeg : spaceTelemetry.shipHeadingDeg;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between">
      {damageFlash && (
        <div className="pointer-events-none absolute inset-0 z-30 border-4 border-rose-500/80 bg-rose-600/20" />
      )}
      {/* ============================================================
          TOP NASA FLIGHT CONTROL TELEMETRY BAR
      ============================================================ */}
      <div className="pointer-events-auto flex flex-wrap items-center justify-between gap-2 border-b border-cyan-300/20 bg-[#060910]/68 px-3 py-1.5 text-xs">
        {/* Left: Flight Control Brand & Scene Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 border-e border-white/10 pe-2.5">
            <div className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-orange-400/60 bg-blue-950/90 text-cyan-300">
              <Orbit className="h-3.5 w-3.5" />
              <img
                src="/assets/aistudio/image_21c54125.png"
                alt="Commander"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
                className="absolute inset-0 h-full w-full object-cover object-top"
              />
            </div>
            <div>
              <div className="font-mono-tech text-[11px] font-bold tracking-widest text-white">
                FLIGHT CONTROL
              </div>
              <div className="text-[9px] text-slate-400">
                {character.name || (lang === 'ar' ? 'القائد' : 'Commander')} • {activePlanet.name[lang]}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-0.5 rounded bg-black/50 p-0.5 border border-white/10">
            <button
              onClick={returnToBridge}
              className={`rounded px-2 py-1 text-[10px] font-bold whitespace-nowrap transition ${
                sceneEnv === 'interior'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              {UI_COPY.modes.interior[lang]}
            </button>
            <button
              onClick={boardShipAndLaunch}
              className={`rounded px-2 py-1 text-[10px] font-bold whitespace-nowrap transition ${
                sceneEnv === 'spaceflight'
                  ? 'bg-cyan-400 text-slate-950'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              {UI_COPY.modes.spaceflight[lang]}
            </button>
            <button
              onClick={() => openMissionViz()}
              className={`rounded px-2 py-1 text-[10px] font-bold whitespace-nowrap transition ${
                sceneEnv === 'mission-viz'
                  ? 'bg-sky-400 text-slate-950'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              {UI_COPY.modes['mission-viz'][lang]}
            </button>
            <button
              onClick={() => landOnPlanet(activePlanetId)}
              className={`rounded px-2 py-1 text-[10px] font-bold whitespace-nowrap transition ${
                sceneEnv === 'planet'
                  ? 'bg-emerald-400 text-slate-950'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              {UI_COPY.modes.planet[lang]}
            </button>
            <button
              onClick={() => setSceneEnv('builder')}
              className={`hidden rounded px-2 py-1 text-[10px] font-bold whitespace-nowrap transition sm:block ${
                sceneEnv === 'builder'
                  ? 'bg-slate-200 text-slate-950'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              {UI_COPY.modes.builder[lang]}
            </button>
          </div>
        </div>

        {/* Center: MET Clock + Phase Badge */}
        <div className="hidden items-center gap-3 md:flex">
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono-tech text-[10px] font-bold tracking-wider text-slate-400">
              MET
            </span>
            <span className="font-mono-tech text-lg font-bold tracking-wider text-cyan-300">
              {metString}
            </span>
          </div>
          <span className="rounded border border-emerald-400/35 bg-emerald-500/15 px-2.5 py-0.5 font-mono-tech text-[10px] font-bold tracking-widest text-emerald-300">
            {phaseBadge}
          </span>
        </div>

        {/* Right: Systems Nominal + Autopilot Flags + Lang + Settings */}
        <div className="flex items-center gap-2.5">
          <div className="hidden flex-col items-end font-mono-tech xl:flex">
            <span className={`text-[10px] font-bold tracking-wider ${statusColor}`}>
              {statusText}
            </span>
            <span className="text-[9px] text-slate-400">
              HULL {Math.round(hullIntegrity)}% • FUEL {Math.round(fuelPct)}% • {internalTempC}°C • P{lifecyclePhase}/12 ({operationalMode.toUpperCase()}) • CR {resources.credits}
            </span>
          </div>

          {activeMissionEvent && (
            <button
              onClick={() => setMccOpen(true)}
              className="flex items-center gap-1 rounded border border-rose-400/70 bg-rose-500/25 px-2.5 py-1 text-[11px] font-bold text-rose-100 hover:bg-rose-500/40"
            >
              <AlertTriangle className="h-3.5 w-3.5 text-rose-300" />
              <span className="whitespace-nowrap">
                {lang === 'ar' ? 'طارئ MCC!' : 'EVENT ALERT!'}
              </span>
            </button>
          )}

          {sceneEnv !== 'builder' && (
            <button
              onClick={toggleMouseLock}
              className={`relative flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-[11px] font-bold transition ${
                mouseLocked
                  ? 'border-amber-300/80 bg-amber-500/80 text-slate-950 hover:brightness-110'
                  : 'border-cyan-300/45 bg-[#08131f]/55 text-cyan-200 hover:bg-cyan-500/20'
              }`}
              title={lang === 'ar' ? 'دمج أو إظهار مؤشر الماوس [Alt / V]' : 'Lock or show cursor [Alt / V]'}
            >
              <MousePointer className="h-3.5 w-3.5" />
              <span className="font-mono-tech text-[10px] tracking-wider uppercase whitespace-nowrap">
                {mouseLocked ? UI_COPY.releaseMouseBtn[lang] : UI_COPY.mergeMouseBtn[lang]}
              </span>
            </button>
          )}

          <button
            onClick={() => setDashboardOpen(true)}
            className="hidden items-center gap-1 rounded border border-emerald-400/35 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-200 transition hover:bg-emerald-500/25 sm:flex"
          >
            <Monitor className="h-3.5 w-3.5" />
            <span className="whitespace-nowrap">{UI_COPY.dashboardBtn[lang]}</span>
          </button>

          <button
            onClick={openSurvivalDashboard2d}
            className="flex items-center gap-1 rounded border border-rose-400/50 bg-rose-500/20 px-2.5 py-1 text-[11px] font-bold text-rose-100 transition hover:bg-rose-500/30"
          >
            <Gamepad2 className="h-3.5 w-3.5" />
            <span className="whitespace-nowrap">
              {lang === 'ar' ? `لوحة البقاء 2D (${completedSurvivalIds.length}/${SURVIVAL_MISSIONS.length})` : `2D Survival (${completedSurvivalIds.length}/${SURVIVAL_MISSIONS.length})`}
            </span>
          </button>

          <button
            onClick={() => setArchitectOpen(true)}
            className="flex items-center gap-1 rounded border border-emerald-400/45 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-100 transition hover:bg-emerald-500/25"
            title={lang === 'ar' ? 'مصمم المهمات (1-4 لاعبين) [L]' : 'Mission Design Lab (1-4P) [L]'}
          >
            <Rocket className="h-3.5 w-3.5" />
            <span className="whitespace-nowrap">
              {lang === 'ar' ? 'مصمم المهمات (1-4)' : 'Mission Lab (1-4P)'}
            </span>
          </button>

          <button
            onClick={() => setStoryIntroOpen(true)}
            className="hidden items-center gap-1 rounded border border-cyan-400/40 bg-cyan-500/15 px-2 py-1 text-[11px] font-bold text-cyan-200 transition hover:bg-cyan-500/25 md:flex"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span className="whitespace-nowrap">{lang === 'ar' ? 'القصة' : 'Story'}</span>
          </button>

          <button
            onClick={toggleLang}
            className="flex items-center gap-1 rounded border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-cyan-200 transition hover:border-cyan-400/50"
          >
            <Globe className="h-3.5 w-3.5 text-cyan-400" />
            <span className="whitespace-nowrap">{UI_COPY.langToggle[lang]}</span>
          </button>

          <button
            onClick={() => setScreen('paused')}
            className="flex items-center gap-1 rounded border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-200 transition hover:border-white/35"
          >
            <Pause className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Center Crosshair when Mouse is Merged (Pointer Lock Active) */}
      {mouseLocked && sceneEnv !== 'builder' && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <div className="relative flex items-center justify-center">
            <div className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#22d3ee]" />
            <div className="absolute h-5 w-5 rounded-full border border-cyan-300/40" />
          </div>
        </div>
      )}

      {/* ============================================================
          MIDDLE WORKSPACE: LEFT MISSION EVENTS & SKY AI | CENTER HUD | RIGHT TELEMETRY
      ============================================================ */}
      {sceneEnv !== 'mission-viz' && (
      <div className="relative flex flex-1 items-stretch justify-between overflow-hidden px-2.5 py-2 sm:px-3">
        {/* LEFT COLUMN: MISSION EVENTS TIMELINE + SKY AI + SIDE ALARMS & CONTEXTUAL PROMPTS */}
        <div className="flex max-h-full max-w-[18.5rem] shrink-0 flex-col items-start gap-2 overflow-y-auto pe-0.5">
          <div className="hidden w-full flex-col items-start gap-2 lg:flex">
            <div className="flex items-start gap-2">
              {eventsOpen ? (
                <div className="pointer-events-auto nasa-card flex w-56 flex-col rounded-md p-2.5 text-[11px]">
                  <div className="mb-2 flex items-center justify-between border-b border-white/10 pb-1.5">
                    <span className="font-mono-tech text-[10px] font-bold tracking-widest text-slate-300">
                      {lang === 'ar' ? 'أحداث المهمة' : 'MISSION EVENTS'}
                    </span>
                    <button
                      onClick={() => setEventsOpen(false)}
                      className="rounded p-0.5 text-slate-400 hover:bg-white/10 hover:text-white"
                      title="Collapse"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    {missionEvents.map((ev) => (
                      <div key={ev.id} className="flex items-start justify-between gap-1.5">
                        <div className="flex items-center gap-1.5">
                          {ev.done ? (
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                          ) : ev.active ? (
                            <Circle className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
                          ) : (
                            <Circle className="h-3.5 w-3.5 shrink-0 text-slate-600" />
                          )}
                          <span
                            className={`text-[11px] font-semibold ${
                              ev.done
                                ? 'text-slate-100'
                                : ev.active
                                  ? 'text-cyan-300'
                                  : 'text-slate-500'
                            }`}
                          >
                            {ev.title}
                          </span>
                        </div>
                        <span className="font-mono-tech text-[9px] text-slate-500">{ev.time}</span>
                      </div>
                    ))}
                  </div>

                  {activeBlueprint && (
                    <div className="mt-2.5 border-t border-white/10 pt-2 font-mono-tech text-[10px] tabular-nums">
                      <div className="flex items-center justify-between gap-1 text-emerald-300">
                        <span className="font-bold truncate">
                          {lang === 'ar' ? 'التصميم النشط' : 'ACTIVE BLUEPRINT'}
                        </span>
                        <span className="shrink-0 font-bold text-amber-300">
                          {activeBlueprint.grade} · {activeBlueprint.effectiveScience} SCI
                        </span>
                      </div>
                      <div className="mt-0.5 text-[9px] text-slate-300">
                        {activeBlueprint.totalMassKg}kg · {activeBlueprint.netPowerW >= 0 ? `+${activeBlueprint.netPowerW}` : activeBlueprint.netPowerW}W · {activeBlueprint.commsCapMbDay}MB/d
                      </div>
                      <button
                        onClick={() => setArchitectOpen(true)}
                        className="mt-1.5 w-full rounded border border-emerald-400/40 bg-emerald-500/15 py-1 text-[10px] font-bold text-emerald-200 whitespace-nowrap hover:bg-emerald-500/25"
                      >
                        {lang === 'ar' ? 'تعديل / إعادة التصميم [L]' : 'Edit Blueprint [L]'}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setEventsOpen(true)}
                  className="pointer-events-auto nasa-card flex items-center gap-1 rounded-md px-2 py-1.5 font-mono-tech text-[10px] font-bold text-slate-300 hover:text-white"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                  <span>EVENTS</span>
                </button>
              )}

              {/* Vertical ACCEL G-Meter during Spaceflight */}
              {sceneEnv === 'spaceflight' && (
                <div className="nasa-card flex flex-col items-center rounded-md px-2 py-2 font-mono-tech text-[9px]">
                  <span className="mb-1.5 font-bold tracking-wider text-slate-400">ACCEL</span>
                  <div className="relative flex h-28 w-5 items-end justify-center rounded border border-white/15 bg-black/50 p-0.5">
                    <div
                      className="w-full rounded-sm bg-cyan-400 transition-all duration-100"
                      style={{ height: `${Math.min(100, (spaceTelemetry.accelG / 5) * 100)}%` }}
                    />
                  </div>
                  <span className="mt-1 font-bold text-cyan-300">
                    {spaceTelemetry.accelG.toFixed(2)}G
                  </span>
                </div>
              )}
            </div>

            {/* Docked Sky AI Co-Pilot Card (strictly below Mission Events — zero overlap) */}
            {latestSky && !skyOpen && !skyCardDismissed && (
              <div className="pointer-events-auto nova-panel w-56 rounded-md border border-cyan-400/25 p-2.5 text-start">
                <div className="mb-1 flex items-center justify-between gap-1 text-[10px]">
                  <button
                    onClick={() => setSkyOpen(true)}
                    className="flex min-w-0 items-center gap-1 font-bold text-cyan-300 hover:text-cyan-200"
                  >
                    <Bot className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                      {lang === 'ar'
                        ? `سكاي ← ${playerDisplayName}`
                        : `SKY AI → ${playerDisplayName}`}
                    </span>
                  </button>
                  <div className="flex shrink-0 items-center gap-1">
                    <span className="font-mono-tech text-[9px] text-slate-400 uppercase">
                      {skyMood}
                    </span>
                    <button
                      onClick={() => setSkyCardDismissed(true)}
                      className="rounded p-0.5 text-slate-400 hover:bg-white/10 hover:text-white"
                      title={lang === 'ar' ? 'إخفاء الإشعار' : 'Minimize'}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setSkyOpen(true)}
                  className="block w-full text-start text-[11px] leading-relaxed text-slate-200 hover:text-white"
                >
                  <span className="line-clamp-3">{latestSky.text}</span>
                </button>
              </div>
            )}
          </div>

          {/* SIDE ALARMS, STATUS NOTIFICATIONS & CONTEXTUAL PROMPTS (docked on side, clear of 3D center) */}
          <div className="flex w-56 flex-col items-start gap-2 sm:w-64">
            {/* High-Priority Hostile Alien Pursuit Side Alarm */}
            {sceneEnv === 'planet' && surfaceTelemetry.hostileAlienDist !== null && (
              <div className="pointer-events-auto w-full rounded-md border border-rose-500/80 bg-rose-950/90 p-2.5 text-xs shadow-lg shadow-rose-950/60">
                <div className="mb-1 flex items-center justify-between gap-2 font-mono-tech text-[10px] font-bold text-rose-300">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-400" />
                    <span>{lang === 'ar' ? 'إنذار خطر' : 'PROXIMITY ALARM'}</span>
                  </span>
                  <span className="tabular-nums text-rose-200">
                    {surfaceTelemetry.hostileAlienDist}m
                  </span>
                </div>
                <p className="text-[11px] font-semibold leading-snug text-rose-100">
                  {lang === 'ar'
                    ? 'كائن فضائي غاضب يطاردك! عُد للمركبة للحماية والتزود.'
                    : 'Hostile alien pursuit — retreat to Spacecraft Pad!'}
                </p>
              </div>
            )}

            {/* Low Survival Reserves Side Alarm */}
            {sceneEnv === 'planet' &&
              !surfaceTelemetry.nearShipPad &&
              (resources.suitO2 < 32 ||
                (resources.suitHealth ?? 100) < 35 ||
                (resources.suitCoolant ?? 100) < 28) && (
                <div className="pointer-events-auto w-full rounded-md border border-amber-400/80 bg-amber-950/90 p-2.5 text-xs shadow-lg shadow-amber-950/50">
                  <div className="mb-1 flex items-center justify-between gap-2 font-mono-tech text-[10px] font-bold text-amber-300">
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                      <span>{lang === 'ar' ? 'تحذير البقاء' : 'SURVIVAL ALARM'}</span>
                    </span>
                    <span className="tabular-nums text-amber-200">
                      O2 {Math.round(resources.suitO2)}%
                    </span>
                  </div>
                  <p className="text-[11px] font-semibold leading-snug text-amber-100 tabular-nums">
                    {lang === 'ar'
                      ? `موارد البقاء منخفضة (صحة ${Math.round(resources.suitHealth ?? 100)}%) — عُد للمركبة لإعادة التزود.`
                      : `Low suit reserves (Suit ${Math.round(resources.suitHealth ?? 100)}%) — return to spacecraft to refuel.`}
                  </p>
                </div>
              )}

            {/* Event / Damage Toast Side Alarm */}
            {toastText && (() => {
              const isAlertToast =
                /Attacked|هجوم|⚠|CRITICAL|LOW|تحذير|خطر|Damage|تضرر|Radiation|إشعاع|💥/i.test(
                  toastText
                );
              return (
                <div
                  className={`pointer-events-auto w-full rounded-md p-2.5 text-xs ${
                    isAlertToast
                      ? 'border border-rose-400/75 bg-rose-950/88 text-rose-100 shadow-lg shadow-rose-950/50'
                      : 'nova-panel border border-cyan-400/35 text-cyan-100'
                  }`}
                >
                  <div
                    className={`mb-1 flex items-center gap-1.5 font-mono-tech text-[10px] font-bold ${
                      isAlertToast ? 'text-rose-300' : 'text-cyan-300'
                    }`}
                  >
                    {isAlertToast ? (
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-400" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
                    )}
                    <span>
                      {isAlertToast
                        ? lang === 'ar'
                          ? 'تنبيه طارئ'
                          : 'SYSTEM ALARM'
                        : lang === 'ar'
                          ? 'إشعار المهمة'
                          : 'MISSION NOTICE'}
                    </span>
                  </div>
                  <p className="text-[11px] font-semibold leading-snug">{toastText}</p>
                </div>
              );
            })()}

            {/* Shuttle Interior Station Prompt */}
            {sceneEnv === 'interior' && interiorTelemetry.nearStation && (
              <div className="pointer-events-auto nova-panel-amber flex w-full flex-col gap-2 rounded-md p-2.5 text-xs">
                <div>
                  <div className="font-bold text-amber-200">
                    {interiorTelemetry.nearStation.label[lang]}
                  </div>
                  <div className="text-[10px] text-slate-300">
                    {lang === 'ar' ? 'اضغط [E] أو انقر للتنفيذ' : 'Press [E] or click to engage'}
                  </div>
                </div>
                <button
                  onClick={handleInteriorStationAction}
                  className="flex w-full items-center justify-center gap-1.5 rounded bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 whitespace-nowrap hover:brightness-110"
                >
                  {interiorTelemetry.nearStation.id === 'lounge' ? (
                    <Coffee className="h-3.5 w-3.5" />
                  ) : interiorTelemetry.nearStation.id === 'bio_bay' ? (
                    <Leaf className="h-3.5 w-3.5" />
                  ) : interiorTelemetry.nearStation.id === 'med_bay' ? (
                    <HeartPulse className="h-3.5 w-3.5" />
                  ) : interiorTelemetry.nearStation.id === 'engineering' ? (
                    <Wrench className="h-3.5 w-3.5" />
                  ) : interiorTelemetry.nearStation.id === 'comms_desk' ? (
                    <Radio className="h-3.5 w-3.5" />
                  ) : (
                    <Rocket className="h-3.5 w-3.5" />
                  )}
                  <span>{lang === 'ar' ? 'تنفيذ [E]' : 'Use [E]'}</span>
                </button>
              </div>
            )}

            {/* Spaceflight Target & Nearby Planet Landing */}
            {sceneEnv === 'spaceflight' && targetPlanet && (
              <div className="pointer-events-auto nova-panel flex w-full flex-col gap-2 rounded-md p-2.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <Navigation className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                    <span className="truncate font-bold text-white">{targetPlanet.name[lang]}</span>
                  </div>
                  <span className="shrink-0 font-mono-tech text-[11px] text-cyan-300 tabular-nums">
                    {spaceTelemetry.targetDistance ?? 0} km
                  </span>
                </div>
                <button
                  onClick={() => setAutopilot(!spaceTelemetry.autopilotActive)}
                  className={`w-full rounded px-2.5 py-1 text-[11px] font-bold whitespace-nowrap transition ${
                    spaceTelemetry.autopilotActive
                      ? 'bg-amber-500 text-slate-950'
                      : 'border border-cyan-400/40 bg-cyan-500/15 text-cyan-200 hover:bg-cyan-500/25'
                  }`}
                >
                  {spaceTelemetry.autopilotActive
                    ? UI_COPY.cancelAutopilot[lang]
                    : UI_COPY.autopilotBtn[lang]}
                </button>
              </div>
            )}

            {sceneEnv === 'spaceflight' && nearbySpacePlanet && (
              <div className="pointer-events-auto nova-panel-amber flex w-full flex-col gap-2 rounded-md p-2.5 text-xs">
                <div>
                  <div className="font-bold text-amber-200">
                    {lang === 'ar'
                      ? `في مدار ${nearbySpacePlanet.name.ar}`
                      : `In Orbit: ${nearbySpacePlanet.name.en}`}
                  </div>
                  <div className="text-[10px] text-slate-300">
                    {nearbySpacePlanet.subtitle[lang]}
                  </div>
                </div>
                <button
                  onClick={() => landOnPlanet(nearbySpacePlanet.id)}
                  className="flex w-full items-center justify-center gap-1.5 rounded bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 whitespace-nowrap hover:brightness-110"
                >
                  <PlaneLanding className="h-3.5 w-3.5" />
                  <span>{UI_COPY.landPlanetBtn[lang]} [E]</span>
                </button>
              </div>
            )}

            {/* Planet Surface Contextual Interaction Prompt */}
            {sceneEnv === 'planet' && surfaceTelemetry.nearInteractable && (
              <div className="pointer-events-auto nova-panel flex w-full flex-col gap-2 rounded-md border border-cyan-400/35 p-2.5 text-xs">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-cyan-200">
                      {surfaceTelemetry.nearInteractable.label[lang]}
                    </span>
                    <span className="shrink-0 font-mono-tech text-[10px] text-slate-400 tabular-nums">
                      {surfaceTelemetry.nearInteractable.distance.toFixed(1)}m
                    </span>
                  </div>
                  {surfaceTelemetry.nearInteractable.kind === 'ship' && (
                    <div className="mt-0.5 font-mono-tech text-[10px] text-emerald-300">
                      {lang === 'ar'
                        ? 'منطقة الأمان وإعادة التزود نشطة ✓'
                        : 'Safe Pad & Refuel Umbilical Active ✓'}
                    </div>
                  )}
                </div>
                {surfaceTelemetry.nearInteractable.kind === 'ship' ? (
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() => onSpacecraftRefuel(true)}
                      className="w-full rounded bg-emerald-400 px-3 py-1.5 text-xs font-bold text-slate-950 whitespace-nowrap hover:brightness-110"
                    >
                      {lang === 'ar' ? 'تزويد O2 وصحة [F]' : 'Refuel Suit [F]'}
                    </button>
                    <button
                      onClick={returnToBridge}
                      className="w-full rounded bg-cyan-400 px-3 py-1.5 text-xs font-bold text-slate-950 whitespace-nowrap hover:brightness-110"
                    >
                      {UI_COPY.returnBridgeBtn[lang]} [E]
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      const kind = surfaceTelemetry.nearInteractable?.kind;
                      if (kind === 'rover') toggleRover();
                      else fireOrScan();
                    }}
                    className="w-full rounded bg-cyan-400 px-3 py-1.5 text-xs font-bold text-slate-950 whitespace-nowrap hover:brightness-110"
                  >
                    {surfaceTelemetry.nearInteractable.kind === 'rover'
                      ? UI_COPY.toggleRoverBtn[lang]
                      : UI_COPY.scanSiteBtn[lang]}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* CENTER COLUMN: GYRO COMPASS & COCKPIT WINDSHIELD PITCH LADDER (CLEAR VIEWPORT) */}
        <div className="relative flex flex-1 flex-col items-center px-2">
          {/* Transparent Visor Gyroscopic Compass Strip (Photo 3 Take On Mars inspo) */}
          {(sceneEnv === 'planet' || sceneEnv === 'spaceflight') && (
            <div className="pointer-events-none hidden w-full max-w-md flex-col items-center pt-0.5 sm:flex">
              <div className="relative flex h-6 w-full items-center justify-center overflow-hidden border-b border-cyan-300/25 bg-[#060b12]/25 font-mono-tech text-[9px] text-cyan-200/75">
                <div className="flex w-full items-center justify-between px-4 tracking-[0.22em] opacity-80">
                  <span>{((activeHeading - 60 + 360) % 360).toString().padStart(3, '0')}</span>
                  <span>|</span>
                  <span>{((activeHeading - 30 + 360) % 360).toString().padStart(3, '0')}</span>
                  <span className="font-bold text-amber-300">
                    ▼ {activeHeading.toString().padStart(3, '0')}°
                  </span>
                  <span>{((activeHeading + 30) % 360).toString().padStart(3, '0')}</span>
                  <span>|</span>
                  <span>{((activeHeading + 60) % 360).toString().padStart(3, '0')}</span>
                </div>
              </div>
              <span className="mt-0.5 font-mono-tech text-[8px] tracking-[0.25em] text-cyan-200/45">
                GYROSCOPIC COMPASS
              </span>
            </div>
          )}

          {/* Holographic Windshield Pitch Ladder in Cockpit View (Image 2 style) */}
          {showCockpitHudLadder && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div
                className="relative flex h-64 w-80 items-center justify-center"
                style={{
                  transform: `rotate(${(-spaceTelemetry.shipRollDeg * 0.45).toFixed(1)}deg) translateY(${Math.max(-24, Math.min(24, spaceTelemetry.shipPitchDeg * 1.1)).toFixed(1)}px)`,
                }}
              >
                {/* Left Velocity Tape Box */}
                <div className="absolute start-0 top-1/2 -translate-y-1/2 rounded-sm border border-cyan-300/55 bg-[#060b12]/45 px-2 py-1 font-mono-tech text-[11px] font-bold text-slate-100">
                  <div>{spaceTelemetry.speed} m/s</div>
                  <div className="text-[9px] text-cyan-300">
                    AoE {Math.abs(spaceTelemetry.shipPitchDeg).toFixed(1)}°
                  </div>
                </div>

                {/* Vertical Pitch Ladder Rails */}
                <div className="flex flex-col items-center gap-4 font-mono-tech text-[9px] text-cyan-200/80">
                  <div className="flex w-28 items-center justify-between border-t border-cyan-300/60 pt-0.5">
                    <span>+20</span>
                    <span>+20</span>
                  </div>
                  <div className="flex w-20 items-center justify-between border-t border-cyan-300/50 pt-0.5">
                    <span>+10</span>
                    <span>+10</span>
                  </div>
                  {/* Flight Vector Center Reticle */}
                  <div className="flex h-6 w-6 items-center justify-center">
                    <div className="h-2.5 w-2.5 rotate-45 border-b-2 border-r-2 border-cyan-300" />
                  </div>
                  <div className="flex w-20 items-center justify-between border-b border-dashed border-cyan-300/45 pb-0.5">
                    <span>-10</span>
                    <span>-10</span>
                  </div>
                </div>

                {/* Right Distance & FPA Tape Box */}
                <div className="absolute end-0 top-1/2 -translate-y-1/2 rounded-sm border border-cyan-300/55 bg-[#060b12]/45 px-2 py-1 font-mono-tech text-[11px] font-bold text-slate-100">
                  <div>{spaceTelemetry.targetDistance ?? 0} km</div>
                  <div className="text-[9px] text-amber-300">
                    HDG {spaceTelemetry.shipHeadingDeg}°
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: OXYGEN TANKS (5 STACKED BARS) + NASA TRAJECTORY, ATTITUDE & SUIT TELEMETRY */}
        <div className="pointer-events-auto flex max-h-full flex-col items-end gap-1.5 overflow-y-auto ps-0.5">
          {/* TOP-RIGHT: 5 STACKED OXYGEN TANKS (2 MIN EACH = 10 MIN TOTAL) */}
          {(() => {
            const o2 = Math.max(0, Math.min(100, resources.suitO2));
            const activeTanks = o2 <= 0 ? 0 : Math.ceil(o2 / 20);
            const totalSec = Math.ceil((o2 / 100) * 600);
            const totalMin = Math.floor(totalSec / 60);
            const totalRemSec = totalSec % 60;
            const onPlanet = sceneEnv === 'planet';
            const isCriticalLastTank = onPlanet && o2 > 0 && o2 <= 20;
            const isAlarmActive = onPlanet && !surfaceTelemetry.nearShipPad && o2 <= 80;

            return (
              <div
                className={`nasa-card w-56 shrink-0 rounded-sm p-2.5 text-[11px] sm:w-64 ${
                  isCriticalLastTank ? 'border-rose-500/75 bg-rose-950/65' : ''
                }`}
              >
                <div className="mb-1.5 flex items-center justify-between border-b border-cyan-300/15 pb-1">
                  <span className="font-mono-tech text-[10px] font-bold tracking-widest text-slate-200">
                    {lang === 'ar' ? 'خزانات الأكسجين' : 'OXYGEN TANKS'}
                  </span>
                  <div className="flex items-center gap-1.5 font-mono-tech text-[10px] tabular-nums">
                    <span
                      className={`font-bold ${
                        isCriticalLastTank
                          ? 'text-rose-400'
                          : isAlarmActive
                            ? 'text-amber-300'
                            : 'text-cyan-300'
                      }`}
                    >
                      {activeTanks}/5
                    </span>
                    <span className="text-slate-400">
                      {totalMin}:{String(totalRemSec).padStart(2, '0')}
                    </span>
                  </div>
                </div>

                {/* 5 Stacked Horizontal Tank Bars on Top of Each Other */}
                <div className="flex flex-col gap-1">
                  {[5, 4, 3, 2, 1].map((tankNum) => {
                    const tankMin = (tankNum - 1) * 20;
                    const fillPct = Math.max(0, Math.min(100, ((o2 - tankMin) / 20) * 100));
                    const tankSec = Math.ceil((fillPct / 100) * 120);
                    const tMin = Math.floor(tankSec / 60);
                    const tSec = tankSec % 60;
                    const isEmpty = fillPct <= 0;
                    const isDraining = onPlanet && !surfaceTelemetry.nearShipPad && fillPct > 0 && fillPct < 100;

                    const barFillClass =
                      tankNum === 1
                        ? 'bg-rose-500'
                        : tankNum === 2
                          ? 'bg-amber-400'
                          : 'bg-cyan-400';

                    return (
                      <div
                        key={tankNum}
                        className={`flex items-center gap-1.5 rounded-[3px] border px-1.5 py-0.5 font-mono-tech ${
                          isEmpty
                            ? 'border-slate-800/80 bg-slate-950/75 text-slate-600'
                            : isDraining && tankNum === 1
                              ? 'border-rose-400/60 bg-rose-950/60 text-rose-200'
                              : isDraining
                                ? 'border-cyan-400/40 bg-slate-900/85 text-cyan-200'
                                : 'border-white/10 bg-slate-900/75 text-slate-300'
                        }`}
                      >
                        <span className="w-5 shrink-0 text-[9px] font-bold">T{tankNum}</span>
                        <div className="relative h-2 flex-1 overflow-hidden rounded-[2px] bg-slate-800/90">
                          <div
                            className={`h-full transition-all duration-300 ${barFillClass}`}
                            style={{ width: `${fillPct}%` }}
                          />
                        </div>
                        <span className="w-8 shrink-0 text-end text-[9px] font-bold tabular-nums">
                          {isEmpty
                            ? '0:00'
                            : `${tMin}:${String(tSec).padStart(2, '0')}`}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Clear Non-Hue Status Readout */}
                <div className="mt-1.5 flex items-center justify-between font-mono-tech text-[9px] tabular-nums">
                  {!onPlanet ? (
                    <span className="font-semibold text-emerald-300">
                      {lang === 'ar'
                        ? 'مقصورة محكمة • O2 ثابت'
                        : 'CABIN SEALED • NO O2 DRAIN'}
                    </span>
                  ) : surfaceTelemetry.nearShipPad ? (
                    <span className="font-semibold text-emerald-300">
                      {lang === 'ar'
                        ? 'جارٍ شحن الخزانات بالمركبة'
                        : 'UMBILICAL REFUEL ACTIVE'}
                    </span>
                  ) : isCriticalLastTank ? (
                    <span className="font-bold text-rose-300">
                      {lang === 'ar'
                        ? 'الخزان الأخير • سرعة منخفضة'
                        : 'LAST TANK • SPEED REDUCED'}
                    </span>
                  ) : o2 <= 40 ? (
                    <span className="font-bold text-amber-300">
                      {lang === 'ar' ? 'إنذار متوسط • 2:00/خزان' : 'ALARM: MEDIUM'}
                    </span>
                  ) : o2 <= 80 ? (
                    <span className="font-semibold text-amber-200">
                      {lang === 'ar' ? 'إنذار بطيء • استنزاف O2' : 'ALARM: SLOW'}
                    </span>
                  ) : (
                    <span className="text-cyan-300/85">
                      {lang === 'ar' ? '2:00 لكل خزان' : '2:00 PER TANK'}
                    </span>
                  )}
                  <span className="font-bold text-slate-300">{Math.round(o2)}%</span>
                </div>
              </div>
            );
          })()}

          {telemetryOpen ? (
            <div className="flex w-56 flex-col gap-1.5 sm:w-64">
              {/* 1. TRAJECTORY Card (Image 1 transparent mesh style) */}
              <div className="nasa-card rounded-sm p-2.5 text-[11px]">
                <div className="mb-1.5 flex items-center justify-between border-b border-cyan-300/15 pb-1">
                  <span className="font-mono-tech text-[10px] font-bold tracking-widest text-slate-200">
                    TRAJECTORY
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono-tech text-[9px] font-bold text-emerald-400">
                      NOMINAL
                    </span>
                    <button
                      onClick={() => setTelemetryOpen(false)}
                      className="rounded p-0.5 text-slate-400 hover:bg-white/10 hover:text-white"
                      title="Collapse Telemetry"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1 font-mono-tech">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[10px] text-slate-400">VI</span>
                    <span className="text-sm font-bold text-cyan-300">
                      {sceneEnv === 'planet'
                        ? `${surfaceTelemetry.speedKmh} km/h`
                        : `${spaceTelemetry.speed} m/s`}
                    </span>
                  </div>
                  {/* Transparent Mesh Trajectory Sparkline (Image 1 inspo) */}
                  <svg viewBox="0 0 180 26" className="h-6 w-full rounded-sm border border-cyan-300/15 bg-[#04080f]/45">
                    <defs>
                      <pattern id="trajMesh" width="12" height="13" patternUnits="userSpaceOnUse">
                        <path d="M 12 0 L 0 0 0 13" fill="none" stroke="rgba(125,211,252,0.14)" strokeWidth="0.6" />
                      </pattern>
                    </defs>
                    <rect width="180" height="26" fill="url(#trajMesh)" />
                    <polygon
                      fill="rgba(34,211,238,0.12)"
                      points="0,26 0,21 30,19 60,15 95,13 130,9 155,7 180,5 180,26"
                    />
                    <polyline
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="1.5"
                      points="0,21 30,19 60,15 95,13 130,9 155,7 180,5"
                    />
                    <circle cx="180" cy="5" r="2.2" fill="#7dd3fc" />
                  </svg>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-400">ALTITUDE</span>
                    <span className="font-bold text-cyan-200">{spaceTelemetry.altitudeKm} km</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-400">SHIELD / PWR</span>
                    <span className="font-bold text-emerald-300">
                      {spaceTelemetry.shield}/{spaceTelemetry.maxShield} • {Math.round(resources.battery)}%
                    </span>
                  </div>
                  {/* Segmented Telemetry Bar (Image 1 & 3 inspo) */}
                  <div className="grid grid-cols-12 gap-0.5 pt-0.5">
                    {Array.from({ length: 12 }).map((_, idx) => {
                      const ratio =
                        (spaceTelemetry.shield / Math.max(1, spaceTelemetry.maxShield)) * 12;
                      return (
                        <div
                          key={idx}
                          className={`h-1.5 rounded-[1px] ${
                            idx < ratio ? 'bg-emerald-400/85' : 'bg-slate-800/70'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 2. ATTITUDE & CONTROL Card (Image 1 style) */}
              <div className="nasa-card hidden rounded-sm p-2.5 text-[11px] sm:block">
                <div className="mb-1.5 flex items-center justify-between border-b border-cyan-300/15 pb-1">
                  <span className="font-mono-tech text-[10px] font-bold tracking-widest text-slate-200">
                    ATTITUDE & CONTROL
                  </span>
                  <Activity className="h-3 w-3 text-cyan-400" />
                </div>
                <div className="grid grid-cols-3 gap-1 text-center font-mono-tech">
                  <div>
                    <div className="text-[9px] text-slate-400">PITCH</div>
                    <div className="font-bold text-cyan-300">{spaceTelemetry.shipPitchDeg}°</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-400">YAW</div>
                    <div className="font-bold text-cyan-300">{spaceTelemetry.shipHeadingDeg}°</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-400">ROLL</div>
                    <div className="font-bold text-cyan-300">{spaceTelemetry.shipRollDeg}°</div>
                  </div>
                </div>
              </div>

              {/* 3. SUIT INTEGRITY & BIOSIGNS Card (Live Real Astronaut Biometrics) */}
              <div className="nasa-card hidden rounded-sm p-2 text-[10px] sm:block">
                <div className="mb-1 flex items-center justify-between border-b border-amber-300/15 pb-1 font-mono-tech">
                  <span className="text-[9px] font-bold tracking-widest text-amber-200/90">
                    SUIT &amp; SURVIVAL
                  </span>
                  <span
                    className={`text-[9px] tabular-nums ${
                      (resources.suitHealth ?? 100) < 35 || resources.suitO2 < 30
                        ? 'font-bold text-rose-400'
                        : 'text-cyan-300'
                    }`}
                  >
                    HP {Math.round(resources.suitHealth ?? 100)}% • O2 {Math.round(resources.suitO2)}% • COOL {Math.round(resources.suitCoolant ?? 100)}%
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  {/* Minimal Wireframe EVA Suit Schematic (Photo 3 inspo) */}
                  <svg viewBox="0 0 42 52" className="h-11 w-9 shrink-0 opacity-85">
                    <circle cx="21" cy="8" r="5" fill="none" stroke={(resources.suitHealth ?? 100) < 40 ? '#fb7185' : '#f59e0b'} strokeWidth="1.2" />
                    <rect x="14" y="15" width="14" height="16" rx="3" fill="rgba(245,158,11,0.08)" stroke={(resources.suitHealth ?? 100) < 40 ? '#fb7185' : '#f59e0b'} strokeWidth="1.1" />
                    <rect x="17" y="18" width="8" height="5" fill="none" stroke="#7dd3fc" strokeWidth="0.9" />
                    <line x1="14" y1="17" x2="7" y2="29" stroke="#f59e0b" strokeWidth="1.2" />
                    <line x1="28" y1="17" x2="35" y2="29" stroke="#f59e0b" strokeWidth="1.2" />
                    <line x1="17" y1="31" x2="15" y2="48" stroke="#f59e0b" strokeWidth="1.2" />
                    <line x1="25" y1="31" x2="27" y2="48" stroke="#f59e0b" strokeWidth="1.2" />
                  </svg>
                  <div className="flex flex-1 flex-col gap-1 font-mono-tech">
                    {/* Segmented Suit HP bar */}
                    <div className="grid grid-cols-10 gap-0.5" title="Suit Health">
                      {Array.from({ length: 10 }).map((_, idx) => (
                        <div
                          key={`hp-${idx}`}
                          className={`h-1.5 rounded-[1px] ${
                            idx < Math.round(((resources.suitHealth ?? 100) / 100) * 10)
                              ? (resources.suitHealth ?? 100) < 35
                                ? 'bg-rose-400'
                                : 'bg-emerald-400/90'
                              : 'bg-slate-800/70'
                          }`}
                        />
                      ))}
                    </div>
                    {/* Segmented O2 bar */}
                    <div className="grid grid-cols-10 gap-0.5" title="Suit O2">
                      {Array.from({ length: 10 }).map((_, idx) => (
                        <div
                          key={`o2-${idx}`}
                          className={`h-1.5 rounded-[1px] ${
                            idx < Math.round((resources.suitO2 / 100) * 10)
                              ? resources.suitO2 < 30
                                ? 'bg-rose-400'
                                : 'bg-amber-400/85'
                              : 'bg-slate-800/70'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-[9px] text-slate-400 tabular-nums">
                      <span>{Math.round(astronautBio.heartRateBpm)} BPM</span>
                      <span>CO2 {astronautBio.co2MmHg.toFixed(1)}</span>
                      <span>{astronautBio.suitTempC.toFixed(0)}°C</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. ENVIRONMENTAL / WEATHER Card (Synced to GLSL Shaders) */}
              {(sceneEnv === 'spaceflight' || sceneEnv === 'interior' || sceneEnv === 'planet') && (
                <button
                  onClick={cycleWeather}
                  title={UI_COPY.weatherClickHint[lang]}
                  className="nasa-card flex flex-col gap-1.5 rounded-sm p-2.5 text-start text-[11px] transition hover:border-cyan-400/45"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-bold text-slate-200">
                      <WeatherIcon className="h-3.5 w-3.5 text-cyan-300" />
                      <span className="font-mono-tech text-[10px] tracking-wide">
                        {sceneEnv === 'planet'
                          ? lang === 'ar'
                            ? 'مناخ السطح'
                            : 'SURFACE ENV'
                          : UI_COPY.weather[weather].name[lang]}
                      </span>
                    </div>
                    <span
                      className={`rounded-sm px-1.5 py-0.5 font-mono-tech text-[9px] font-bold ${
                        spaceTelemetry.hazardLevel === 'SEVERE'
                          ? 'bg-rose-500/25 text-rose-300'
                          : spaceTelemetry.hazardLevel === 'ELEVATED'
                            ? 'bg-amber-500/25 text-amber-200'
                            : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {spaceTelemetry.hazardLevel}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 font-mono-tech text-[10px]">
                    <div>
                      <div className="flex justify-between text-slate-400">
                        <span>RAD</span>
                        <span className="text-amber-300">
                          {spaceTelemetry.radiationSievert.toFixed(2)} mSv
                        </span>
                      </div>
                      <div className="mt-0.5 h-1 w-full bg-black/60">
                        <div
                          className="h-full bg-amber-400 transition-all duration-150"
                          style={{
                            width: `${Math.min(100, (spaceTelemetry.radiationSievert / 6) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-slate-400">
                        <span>DUST</span>
                        <span className="text-cyan-300">{spaceTelemetry.dustDensityPct}%</span>
                      </div>
                      <div className="mt-0.5 h-1 w-full bg-black/60">
                        <div
                          className="h-full bg-cyan-400 transition-all duration-150"
                          style={{
                            width: `${Math.min(100, spaceTelemetry.dustDensityPct)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between font-mono-tech text-[9px] text-slate-400">
                    <span>O2 {Math.round(resources.suitO2)}% • {UI_COPY.weather[weather].badge[lang]}</span>
                    <span>T-{spaceTelemetry.weatherCountdown}s</span>
                  </div>
                </button>
              )}

              {/* 5. GROUND SEGMENT, LINK & FIDELITY Card (Live 2D <-> 3D Sync) */}
              <div className="nasa-card hidden rounded-sm p-2.5 text-[10px] sm:block">
                <div className="mb-1 flex items-center justify-between border-b border-cyan-300/15 pb-1 font-mono-tech">
                  <span className="font-bold tracking-wider text-cyan-300">
                    DSN · {resources.commsStation.toUpperCase()}
                  </span>
                  <span
                    className={`font-bold tabular-nums ${
                      resources.commsSignal < 65 ? 'text-amber-300' : 'text-emerald-300'
                    }`}
                  >
                    {resources.commsSignal}% · {lastDownlinkKbps} kbps
                  </span>
                </div>
                <div className="flex items-center justify-between font-mono-tech text-[9px] text-slate-300 tabular-nums">
                  <span>
                    BUF {Math.round(resources.dataStorage)} MB → TX {Math.round(resources.dataTransmitted)} MB
                  </span>
                  <span className={analysisFidelityMode === 'high_fidelity' ? 'text-violet-300' : 'text-amber-200'}>
                    {analysisFidelityMode === 'high_fidelity' ? 'HI-FI' : 'APPROX'} · {commsCompressionMode === 'raw' ? 'RAW' : commsCompressionMode === 'lossless_ccsds' ? 'CCSDS' : 'CROP'}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-1">
                  <button
                    onClick={cycleCommsStation}
                    className="flex-1 rounded border border-white/15 bg-white/5 py-1 font-bold text-slate-200 hover:bg-white/10"
                  >
                    {lang === 'ar' ? 'تبديل المحطة' : 'Next DSN'}
                  </button>
                  <button
                    onClick={transmitDataPacket}
                    className="flex-1 rounded border border-cyan-400/40 bg-cyan-500/15 py-1 font-bold text-cyan-200 hover:bg-cyan-500/25"
                  >
                    {lang === 'ar' ? 'بث البيانات' : 'Downlink'}
                  </button>
                  <button
                    onClick={() => setMode2dOpen(true, 'ops2d')}
                    className="rounded border border-emerald-400/40 bg-emerald-500/15 px-2 py-1 font-bold text-emerald-200 hover:bg-emerald-500/25"
                  >
                    2D Ops
                  </button>
                </div>
              </div>

              {sceneEnv === 'spaceflight' && (
                <RadarDisplay
                  lang={lang}
                  blips={spaceTelemetry.radarBlips}
                  shipYaw={spaceTelemetry.shipYaw}
                  onSelectPlanet={(pId) => flyToPlanet(pId, true)}
                />
              )}
            </div>
          ) : (
            <button
              onClick={() => setTelemetryOpen(true)}
              className="nasa-card flex items-center gap-1 rounded-md px-2.5 py-1.5 font-mono-tech text-[10px] font-bold text-cyan-300 hover:text-white"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>TELEMETRY</span>
            </button>
          )}

          {touchPadOpen && sceneEnv !== 'builder' && (
            <VirtualFlightPad lang={lang} value={virtualInput} onChange={setVirtualInput} />
          )}
        </div>
      </div>
      )}

      {/* ============================================================
          BOTTOM COLLAPSIBLE COMMAND DOCK + 10 SHUTTLE SECTIONS DIRECTORY
      ============================================================ */}
      {sceneEnv !== 'mission-viz' && (
        <div className="flex flex-col items-center gap-1 px-2 pb-2">
          {sceneEnv === 'planet' && outpostMenuOpen && !dockCollapsed && (
            <div className="pointer-events-auto nova-panel flex max-w-full flex-wrap items-center justify-center gap-2 rounded-lg border border-emerald-400/35 px-3 py-2 text-xs">
              <span className="font-mono-tech text-[10px] font-bold text-emerald-300 whitespace-nowrap">
                {lang === 'ar'
                  ? `القاعدة السطحية (${surfaceBuildings.filter((b) => b.planetId === activePlanetId).length}) • الكائنات الممسوحة (${scannedCreatureIds.length})`
                  : `OUTPOST (${surfaceBuildings.filter((b) => b.planetId === activePlanetId).length}) • CREATURES SCANNED (${scannedCreatureIds.length})`}
              </span>
              <button
                onClick={() => buildSurfaceStructure('habitat')}
                className="flex items-center gap-1.5 rounded border border-cyan-400/40 bg-cyan-500/15 px-2.5 py-1 text-[11px] font-bold text-cyan-200 whitespace-nowrap hover:bg-cyan-500/25"
              >
                <span>{lang === 'ar' ? 'قبة أكسجين (+O2) • 120 CR' : 'Habitat O2 Dome • 120 CR'}</span>
              </button>
              <button
                onClick={() => buildSurfaceStructure('solar_relay')}
                className="flex items-center gap-1.5 rounded border border-amber-400/40 bg-amber-500/15 px-2.5 py-1 text-[11px] font-bold text-amber-200 whitespace-nowrap hover:bg-amber-500/25"
              >
                <span>{lang === 'ar' ? 'محطة طاقة (+PWR) • 90 CR' : 'Solar Power Relay • 90 CR'}</span>
              </button>
              <button
                onClick={() => buildSurfaceStructure('science_beacon')}
                className="flex items-center gap-1.5 rounded border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-200 whitespace-nowrap hover:bg-emerald-500/25"
              >
                <span>{lang === 'ar' ? 'منارة أبحاث (+DATA) • 110 CR' : 'Science Beacon • 110 CR'}</span>
              </button>
            </div>
          )}

          {sceneEnv === 'interior' && !dockCollapsed && (
            <div className="pointer-events-auto nova-panel flex max-w-full flex-wrap items-center justify-center gap-1 rounded-md px-2 py-1">
              <span className="px-1.5 font-mono-tech text-[10px] font-bold text-amber-300 whitespace-nowrap">
                {lang === 'ar' ? 'البهو والـ 10 غرف (10 متخصصين):' : 'ATRIUM + 10 ROOMS (10 SPECIALISTS):'}
              </span>
              {SHUTTLE_SECTIONS.map((sec) => {
                const isNear = interiorTelemetry.nearStation?.id === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => jumpToShuttleSection(sec.id)}
                    className={`rounded px-2 py-0.5 text-[10px] font-bold whitespace-nowrap transition ${
                      isNear
                        ? 'bg-amber-500 text-slate-950'
                        : 'border border-white/10 bg-white/5 text-slate-200 hover:border-cyan-400/50 hover:bg-cyan-500/15 hover:text-cyan-200'
                    }`}
                  >
                    {lang === 'ar' ? sec.ar : sec.en}
                  </button>
                );
              })}
            </div>
          )}

          <button
            onClick={() => setDockCollapsed((v) => !v)}
            className="pointer-events-auto nova-panel flex items-center gap-1 rounded px-3 py-0.5 font-mono-tech text-[10px] font-bold text-slate-300 hover:text-white"
          >
            {dockCollapsed ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
            <span>{lang === 'ar' ? 'شريط القيادة' : 'FLIGHT DECK DOCK'}</span>
          </button>

          {!dockCollapsed && (
            <div className="pointer-events-auto nova-panel flex max-w-full flex-wrap items-center justify-center gap-1.5 rounded-md p-1.5">
              {sceneEnv === 'interior' && (
                <>
                  <button
                    onClick={boardShipAndLaunch}
                    className="flex items-center gap-1.5 rounded bg-cyan-400 px-3.5 py-1.5 text-xs font-bold text-slate-950 whitespace-nowrap hover:brightness-110"
                  >
                    <Rocket className="h-3.5 w-3.5" />
                    <span>{UI_COPY.boardShipBtn[lang]}</span>
                  </button>
                  <button
                    onClick={() => landOnPlanet(activePlanetId)}
                    className="flex items-center gap-1.5 rounded border border-amber-400/40 bg-amber-500/15 px-3 py-1.5 text-xs font-bold text-amber-200 whitespace-nowrap hover:bg-amber-500/25"
                  >
                    <PlaneLanding className="h-3.5 w-3.5" />
                    <span>{UI_COPY.landPlanetBtn[lang]}</span>
                  </button>
                  <button
                    onClick={() => setTelescopeLabOpen(true)}
                    className="flex items-center gap-1.5 rounded border border-sky-400/40 bg-sky-500/15 px-3 py-1.5 text-xs font-bold text-sky-200 whitespace-nowrap hover:bg-sky-500/25"
                  >
                    <Telescope className="h-3.5 w-3.5" />
                    <span>{UI_COPY.telescopeLabBtn[lang]}</span>
                  </button>
                  <button
                    onClick={() => openMissionViz()}
                    className="flex items-center gap-1.5 rounded border border-cyan-400/35 bg-cyan-500/15 px-3 py-1.5 text-xs font-bold text-cyan-200 whitespace-nowrap hover:bg-cyan-500/25"
                  >
                    <Orbit className="h-3.5 w-3.5" />
                    <span>{UI_COPY.missionVizBtn[lang]}</span>
                  </button>
                  <button
                    onClick={() => setDashboardOpen(true)}
                    className="flex items-center gap-1.5 rounded border border-emerald-400/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-200 whitespace-nowrap hover:bg-emerald-500/25"
                  >
                    <Monitor className="h-3.5 w-3.5" />
                    <span>{UI_COPY.dashboardBtn[lang]}</span>
                  </button>
                  <button
                    onClick={openSurvivalDashboard2d}
                    className="flex items-center gap-1.5 rounded border border-rose-400/45 bg-rose-500/20 px-3 py-1.5 text-xs font-bold text-rose-100 whitespace-nowrap hover:bg-rose-500/30"
                  >
                    <Gamepad2 className="h-3.5 w-3.5" />
                    <span>{lang === 'ar' ? 'لوحة البقاء 2D' : '2D Survival Dash'}</span>
                  </button>
                  <button
                    onClick={takeLoungeBreak}
                    className="flex items-center gap-1.5 rounded border border-emerald-400/35 bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-200 whitespace-nowrap hover:bg-emerald-500/25"
                  >
                    <Coffee className="h-3.5 w-3.5" />
                    <span>{lang === 'ar' ? 'قهوة واستراحة' : 'Coffee Break'}</span>
                  </button>
                </>
              )}

              {sceneEnv === 'builder' && (
                <button
                  onClick={returnToBridge}
                  className="flex items-center gap-1.5 rounded bg-amber-500 px-4 py-1.5 text-xs font-bold text-slate-950 whitespace-nowrap"
                >
                  <DoorOpen className="h-4 w-4" />
                  <span>{UI_COPY.returnBridgeBtn[lang]}</span>
                </button>
              )}

              {sceneEnv === 'spaceflight' && (
                <>
                  <button
                    onClick={fireOrScan}
                    className="flex items-center gap-1.5 rounded border border-cyan-400/35 bg-cyan-500/15 px-3 py-1.5 text-xs font-bold text-cyan-200 whitespace-nowrap hover:bg-cyan-500/25"
                  >
                    <Crosshair className="h-3.5 w-3.5" />
                    <span>{UI_COPY.firePlasmaBtn[lang]}</span>
                  </button>
                  <button
                    onClick={triggerBarrelRoll}
                    className="flex items-center gap-1.5 rounded border border-amber-400/35 bg-amber-500/15 px-3 py-1.5 text-xs font-bold text-amber-200 whitespace-nowrap hover:bg-amber-500/25"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                    <span>{UI_COPY.barrelRollBtn[lang]}</span>
                  </button>
                  <button
                    onPointerDown={() => setVirtualInput({ ...virtualInput, boost: true })}
                    onPointerUp={() => setVirtualInput({ ...virtualInput, boost: false })}
                    onPointerLeave={() => setVirtualInput({ ...virtualInput, boost: false })}
                    className="flex items-center gap-1.5 rounded border border-rose-400/35 bg-rose-500/15 px-3 py-1.5 text-xs font-bold text-rose-200 whitespace-nowrap hover:bg-rose-500/25"
                  >
                    <Zap className="h-3.5 w-3.5" />
                    <span>{UI_COPY.boostBtn[lang]}</span>
                  </button>
                  <button
                    onClick={returnToBridge}
                    className="flex items-center gap-1.5 rounded border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white whitespace-nowrap hover:bg-white/20"
                  >
                    <DoorOpen className="h-3.5 w-3.5" />
                    <span>{UI_COPY.returnBridgeBtn[lang]}</span>
                  </button>
                </>
              )}

              {sceneEnv === 'planet' && (
                <>
                  <button
                    onClick={toggleRover}
                    className={`flex items-center gap-1.5 rounded border px-3 py-1.5 text-xs font-bold whitespace-nowrap ${
                      pilotingRover
                        ? 'border-amber-400 bg-amber-500 text-slate-950'
                        : 'border-amber-400/35 bg-amber-500/15 text-amber-200'
                    }`}
                  >
                    <Car className="h-3.5 w-3.5" />
                    <span>{UI_COPY.toggleRoverBtn[lang]}</span>
                  </button>
                  <button
                    onClick={fireOrScan}
                    className="flex items-center gap-1.5 rounded border border-cyan-400/35 bg-cyan-500/15 px-3 py-1.5 text-xs font-bold text-cyan-200 whitespace-nowrap"
                  >
                    <Crosshair className="h-3.5 w-3.5" />
                    <span>{UI_COPY.scanSiteBtn[lang]}</span>
                  </button>
                  <button
                    onClick={() => setOutpostMenuOpen(!outpostMenuOpen)}
                    className={`flex items-center gap-1.5 rounded border px-3 py-1.5 text-xs font-bold whitespace-nowrap ${
                      outpostMenuOpen
                        ? 'border-emerald-400 bg-emerald-500 text-slate-950'
                        : 'border-emerald-400/35 bg-emerald-500/15 text-emerald-200'
                    }`}
                  >
                    <Hammer className="h-3.5 w-3.5" />
                    <span>{UI_COPY.buildOutpostBtn[lang]}</span>
                  </button>
                  <button
                    onClick={returnToBridge}
                    className="flex items-center gap-1.5 rounded border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white whitespace-nowrap hover:bg-white/20"
                  >
                    <DoorOpen className="h-3.5 w-3.5" />
                    <span>{UI_COPY.returnBridgeBtn[lang]}</span>
                  </button>
                </>
              )}

              <div className="h-4 w-px bg-white/10" />

              {sceneEnv !== 'builder' && (
                <>
                  <button
                    onClick={handleToggleCamera}
                    className="flex items-center gap-1.5 rounded border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-bold text-slate-200 whitespace-nowrap hover:bg-white/10"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    <span>{UI_COPY.cameraBtn[lang]}</span>
                  </button>
                  <button
                    onClick={() => setTouchPadOpen(!touchPadOpen)}
                    className={`flex items-center gap-1.5 rounded border px-2.5 py-1.5 text-xs font-bold whitespace-nowrap ${
                      touchPadOpen
                        ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                        : 'border-white/15 bg-white/5 text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    <Gamepad2 className="h-3.5 w-3.5" />
                    <span>{UI_COPY.touchPadBtn[lang]}</span>
                  </button>
                </>
              )}

              <button
                onClick={() => setTabletOpen(true)}
                className="flex items-center gap-1.5 rounded border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-bold text-slate-200 whitespace-nowrap hover:bg-white/10"
              >
                <Tablet className="h-3.5 w-3.5 text-cyan-300" />
                <span>{UI_COPY.tabletBtn[lang]}</span>
              </button>

              <button
                onClick={() => setMapOpen(true)}
                className="flex items-center gap-1.5 rounded border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-bold text-slate-200 whitespace-nowrap hover:bg-white/10"
              >
                <Compass className="h-3.5 w-3.5 text-amber-300" />
                <span>{UI_COPY.mapBtn[lang]}</span>
              </button>

              <button
                onClick={() => setMccOpen(true)}
                className={`flex items-center gap-1.5 rounded border px-2.5 py-1.5 text-xs font-bold whitespace-nowrap ${
                  activeMissionEvent
                    ? 'border-rose-400/70 bg-rose-500/25 text-rose-100'
                    : 'border-cyan-400/35 bg-cyan-500/15 text-cyan-200 hover:bg-cyan-500/25'
                }`}
              >
                <Activity className="h-3.5 w-3.5" />
                <span>{lang === 'ar' ? 'مركز MCC' : 'MCC'}</span>
              </button>

              <button
                onClick={() => setSystemsLabOpen(true)}
                className="flex items-center gap-1.5 rounded border border-emerald-400/35 bg-emerald-500/15 px-2.5 py-1.5 text-xs font-bold text-emerald-200 whitespace-nowrap hover:bg-emerald-500/25"
              >
                <Layers className="h-3.5 w-3.5" />
                <span>{lang === 'ar' ? 'الأنظمة 14' : '14-Sys'}</span>
              </button>

              <button
                onClick={() => setWhatIfOpen(true)}
                className="flex items-center gap-1.5 rounded border border-amber-400/35 bg-amber-500/15 px-2.5 py-1.5 text-xs font-bold text-amber-200 whitespace-nowrap hover:bg-amber-500/25"
              >
                <Sliders className="h-3.5 w-3.5" />
                <span>{lang === 'ar' ? 'ماذا لو؟' : 'What-If'}</span>
              </button>

              <button
                onClick={() => setReportOpen(true)}
                className="flex items-center gap-1.5 rounded border border-sky-400/35 bg-sky-500/15 px-2.5 py-1.5 text-xs font-bold text-sky-200 whitespace-nowrap hover:bg-sky-500/25"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>{lang === 'ar' ? 'التقرير' : 'Report'}</span>
              </button>

              <button
                onClick={() => setSkyOpen(true)}
                className="flex items-center gap-1.5 rounded border border-violet-400/40 bg-violet-500/15 px-2.5 py-1.5 text-xs font-bold text-violet-200 whitespace-nowrap hover:bg-violet-500/25"
              >
                <Bot className="h-3.5 w-3.5 text-violet-300" />
                <span>{UI_COPY.skyBtn[lang]}</span>
              </button>

              <button
                onClick={() => setGuideOpen(true)}
                className="flex items-center gap-1.5 rounded border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-bold text-slate-200 whitespace-nowrap hover:bg-white/10"
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>{UI_COPY.guideBtn[lang]}</span>
              </button>

              <button
                onClick={() => setPitchDeckOpen(true)}
                className="flex items-center gap-1.5 rounded border border-violet-400/40 bg-violet-500/15 px-2.5 py-1.5 text-xs font-bold text-violet-200 whitespace-nowrap hover:bg-violet-500/25"
              >
                <Award className="h-3.5 w-3.5 text-violet-300" />
                <span>{lang === 'ar' ? 'العرض' : 'Pitch'}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
