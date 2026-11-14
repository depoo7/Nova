import {
  Activity,
  ArrowLeftRight,
  Bot,
  Car,
  CheckCircle2,
  Coffee,
  Cpu,
  DoorOpen,
  Flame,
  FlaskConical,
  Gamepad2,
  Gauge,
  HeartPulse,
  Layers,
  Leaf,
  Orbit,
  PlaneLanding,
  Radio,
  Rocket,
  Shield,
  Sparkles,
  Telescope,
  UserCheck,
  Users,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { UI_COPY } from '../data/i18n';
import { PLANETS, SHUTTLE_ROOM_DEFS } from '../data/novaData';
import { useGameStore } from '../store/gameStore';
import type { InteriorStationId, ShuttleRoomId, SpecialistId } from '../types/game';

interface RoomDirectoryEntry {
  id: ShuttleRoomId;
  roomCode: string;
  titleAr: string;
  titleEn: string;
  specialistAr: string;
  specialistEn: string;
  roleAr: string;
  roleEn: string;
  wingAr: string;
  wingEn: string;
  accent: string;
  actionAr: string;
  actionEn: string;
}

export const SHUTTLE_ROOMS_ROSTER: RoomDirectoryEntry[] = [
  {
    id: 'helm',
    roomCode: 'ROOM 01',
    titleAr: 'قمرة القيادة الأمامية',
    titleEn: 'Forward Flight Deck',
    specialistAr: 'الكابتن رايان ميلر',
    specialistEn: 'Capt. Ryan Miller',
    roleAr: 'كبير طياري المكوك',
    roleEn: 'Chief Shuttle Pilot',
    wingAr: 'المقدمة المركزية',
    wingEn: 'Forward Center',
    accent: 'text-cyan-300 border-cyan-400/35 bg-cyan-500/10',
    actionAr: 'إقلاع للفضاء 3D',
    actionEn: 'Launch Shuttle 3D',
  },
  {
    id: 'nav',
    roomCode: 'ROOM 02',
    titleAr: 'غرفة الملاحة GMAT',
    titleEn: 'GMAT Trajectory Room',
    specialistAr: 'د. نادية كريم',
    specialistEn: 'Dr. Nadia Karim',
    roleAr: 'محللة مسارات GMAT',
    roleEn: 'GMAT Trajectory Analyst',
    wingAr: 'المركز الأمامي',
    wingEn: 'Center Deck',
    accent: 'text-sky-300 border-sky-400/35 bg-sky-500/10',
    actionAr: 'تصور المدارات 3D',
    actionEn: 'Open GMAT Viz',
  },
  {
    id: 'science_lab',
    roomCode: 'ROOM 03',
    titleAr: 'مختبر التلسكوب و CubeSat',
    titleEn: 'Telescope & CubeSat Lab',
    specialistAr: 'د. إيلينا فانس',
    specialistEn: 'Dr. Elena Vance',
    roleAr: 'عالمة الفيزياء الفلكية',
    roleEn: 'Lead Astrophysicist',
    wingAr: 'الجناح الأيسر',
    wingEn: 'Port Wing',
    accent: 'text-cyan-300 border-cyan-400/35 bg-cyan-500/10',
    actionAr: 'تصميم التلسكوب',
    actionEn: 'Open Telescope Lab',
  },
  {
    id: 'bio_bay',
    roomCode: 'ROOM 04',
    titleAr: 'غرفة الزراعة المائية',
    titleEn: 'Hydroponics Bio-Dome',
    specialistAr: 'د. عمر فاروق',
    specialistEn: 'Dr. Omar Farouk',
    roleAr: 'خبير النباتات والأكسجين',
    roleEn: 'Hydroponics Botanist',
    wingAr: 'الجناح الأيسر',
    wingEn: 'Port Wing',
    accent: 'text-emerald-300 border-emerald-400/35 bg-emerald-500/10',
    actionAr: 'حصاد + O2 100%',
    actionEn: 'Harvest + O2 100%',
  },
  {
    id: 'lounge',
    roomCode: 'ROOM 05',
    titleAr: 'الاستراحة والقهوة والنوم',
    titleEn: 'Crew Galley & Quarters',
    specialistAr: 'مايا لين',
    specialistEn: 'Maya Lin',
    roleAr: 'مسؤولة الإعاشة والطاقم',
    roleEn: 'Habitation Officer',
    wingAr: 'الجناح الأيسر',
    wingEn: 'Port Wing',
    accent: 'text-amber-300 border-amber-400/35 bg-amber-500/10',
    actionAr: 'استراحة قهوة ☕',
    actionEn: 'Coffee Break ☕',
  },
  {
    id: 'med_bay',
    roomCode: 'ROOM 06',
    titleAr: 'غرفة العيادة الطبية',
    titleEn: 'Medical & Radiation Bay',
    specialistAr: 'د. صوفيا باتيل',
    specialistEn: 'Dr. Sophia Patel',
    roleAr: 'طبيبة الإشعاع الفضائي',
    roleEn: 'Flight & Radiation Surgeon',
    wingAr: 'المركز الخلفي',
    wingEn: 'Center Deck',
    accent: 'text-rose-300 border-rose-400/35 bg-rose-500/10',
    actionAr: 'فحص طبي وإشعاعي',
    actionEn: 'Run Medical Scan',
  },
  {
    id: 'engineering',
    roomCode: 'ROOM 07',
    titleAr: 'غرفة المفاعل والهندسة MDL',
    titleEn: 'MDL & Fusion Reactor',
    specialistAr: 'ماركوس تشين',
    specialistEn: 'Marcus Chen',
    roleAr: 'مهندس الدفع والمفاعل',
    roleEn: 'NASA MDL Engineer',
    wingAr: 'الجناح الأيمن',
    wingEn: 'Starboard Wing',
    accent: 'text-orange-300 border-orange-400/35 bg-orange-500/10',
    actionAr: 'تعديل هندسة المكوك',
    actionEn: 'Open MDL Builder',
  },
  {
    id: 'cargo_bay',
    roomCode: 'ROOM 08',
    titleAr: 'عنبر الحمولة والروفر 6×6',
    titleEn: 'Cargo Bay & 6x6 Rover',
    specialistAr: 'الرقيب ديفون بروكس',
    specialistEn: 'Sgt. Devon Brooks',
    roleAr: 'متخصص الروفر والحمولة',
    roleEn: 'Payload & Rover Chief',
    wingAr: 'الجناح الأيمن',
    wingEn: 'Starboard Wing',
    accent: 'text-amber-300 border-amber-400/35 bg-amber-500/10',
    actionAr: 'فحص وتجهيز الروفر',
    actionEn: 'Prep 6x6 Rover',
  },
  {
    id: 'comms_desk',
    roomCode: 'ROOM 09',
    titleAr: 'غرفة اتصالات DSN',
    titleEn: 'Deep Space Network DSN',
    specialistAr: 'الملازم آريا ساتو',
    specialistEn: 'Lt. Aria Sato',
    roleAr: 'ضابطة البث الأرضي',
    roleEn: 'DSN Comms Officer',
    wingAr: 'الجناح الأيمن',
    wingEn: 'Starboard Wing',
    accent: 'text-violet-300 border-violet-400/35 bg-violet-500/10',
    actionAr: 'بث بيانات للأرض',
    actionEn: 'Open DSN Uplink',
  },
  {
    id: 'airlock',
    roomCode: 'ROOM 10',
    titleAr: 'بوابة الهبوط الكوكبي',
    titleEn: 'Planetary EVA Airlock',
    specialistAr: 'القائد ليو فانس',
    specialistEn: 'Cmdr. Leo Vance',
    roleAr: 'ضابط بوابة الخروج EVA',
    roleEn: 'EVA Airlock Officer',
    wingAr: 'المؤخرة المركزية',
    wingEn: 'Aft Center',
    accent: 'text-emerald-300 border-emerald-400/35 bg-emerald-500/10',
    actionAr: 'هبوط على الكوكب',
    actionEn: 'Descend & Land',
  },
];

const SPECIALTY_BADGE: Record<
  'flight' | 'science' | 'engineering' | 'medical' | 'comms',
  { ar: string; en: string; cls: string }
> = {
  flight: { ar: 'طيران', en: 'FLIGHT', cls: 'border-cyan-400/40 bg-cyan-500/15 text-cyan-200' },
  science: { ar: 'علوم', en: 'SCIENCE', cls: 'border-sky-400/40 bg-sky-500/15 text-sky-200' },
  engineering: { ar: 'هندسة وإصلاح', en: 'REPAIR/ENG', cls: 'border-orange-400/40 bg-orange-500/15 text-orange-200' },
  medical: { ar: 'حيوي وطبي', en: 'LIFE/MED', cls: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200' },
  comms: { ar: 'اتصالات DSN', en: 'COMMS', cls: 'border-violet-400/40 bg-violet-500/15 text-violet-200' },
};

function formatMultDelta(mult: number): { label: string; color: string } {
  const pct = Math.round((mult - 1) * 100);
  if (pct > 0) return { label: `+${pct}%`, color: 'text-emerald-400' };
  if (pct < 0) return { label: `${pct}%`, color: 'text-rose-400' };
  return { label: '0%', color: 'text-slate-400' };
}

export function AtriumDashboardModal() {
  const [swapSourceId, setSwapSourceId] = useState<SpecialistId | null>(null);

  const lang = useGameStore((s) => s.lang);
  const dashboardOpen = useGameStore((s) => s.dashboardOpen);
  const dashboardTab = useGameStore((s) => s.dashboardTab);
  const setDashboardOpen = useGameStore((s) => s.setDashboardOpen);
  const setDashboardTab = useGameStore((s) => s.setDashboardTab);
  const setMode2dOpen = useGameStore((s) => s.setMode2dOpen);

  const resources = useGameStore((s) => s.resources);
  const shipMetrics = useGameStore((s) => s.shipMetrics);
  const spaceTelemetry = useGameStore((s) => s.spaceTelemetry);
  const weather = useGameStore((s) => s.weather);
  const cmlLevel = useGameStore((s) => s.cmlLevel);
  const setCmlLevel = useGameStore((s) => s.setCmlLevel);
  const activePlanet = useGameStore((s) => s.activePlanet);
  const discoveredPlanets = useGameStore((s) => s.discoveredPlanets);
  const collectedSampleIds = useGameStore((s) => s.collectedSampleIds);
  const telescope = useGameStore((s) => s.telescope);

  const specialists = useGameStore((s) => s.specialists);
  const personnelEffects = useGameStore((s) => s.personnelEffects);
  const assignSpecialistToRoom = useGameStore((s) => s.assignSpecialistToRoom);
  const swapSpecialists = useGameStore((s) => s.swapSpecialists);
  const applyPersonnelPreset = useGameStore((s) => s.applyPersonnelPreset);

  const jumpToShuttleSection = useGameStore((s) => s.jumpToShuttleSection);
  const boardShipAndLaunch = useGameStore((s) => s.boardShipAndLaunch);
  const openMissionViz = useGameStore((s) => s.openMissionViz);
  const setTelescopeLabOpen = useGameStore((s) => s.setTelescopeLabOpen);
  const harvestBioBay = useGameStore((s) => s.harvestBioBay);
  const takeLoungeBreak = useGameStore((s) => s.takeLoungeBreak);
  const runMedBayScan = useGameStore((s) => s.runMedBayScan);
  const setTabletOpen = useGameStore((s) => s.setTabletOpen);
  const inspectCargoBay = useGameStore((s) => s.inspectCargoBay);
  const talkCommsOfficer = useGameStore((s) => s.talkCommsOfficer);
  const landOnPlanet = useGameStore((s) => s.landOnPlanet);
  const cycleWeather = useGameStore((s) => s.cycleWeather);

  if (!dashboardOpen) return null;

  const currentPlanet = PLANETS.find((p) => p.id === activePlanet) || PLANETS[0];

  const executeRoomDuty = (id: InteriorStationId) => {
    setDashboardOpen(false);
    if (id === 'helm') boardShipAndLaunch();
    else if (id === 'nav') openMissionViz();
    else if (id === 'science_lab') setTelescopeLabOpen(true);
    else if (id === 'bio_bay') harvestBioBay();
    else if (id === 'lounge') takeLoungeBreak();
    else if (id === 'med_bay') runMedBayScan();
    else if (id === 'engineering') setTabletOpen(true, 'builder');
    else if (id === 'cargo_bay') inspectCargoBay();
    else if (id === 'comms_desk') talkCommsOfficer();
    else if (id === 'airlock') landOnPlanet(activePlanet);
  };

  const renderRoomIcon = (id: InteriorStationId) => {
    if (id === 'helm') return <Rocket className="h-4 w-4" />;
    if (id === 'nav') return <Orbit className="h-4 w-4" />;
    if (id === 'science_lab') return <Telescope className="h-4 w-4" />;
    if (id === 'bio_bay') return <Leaf className="h-4 w-4" />;
    if (id === 'lounge') return <Coffee className="h-4 w-4" />;
    if (id === 'med_bay') return <HeartPulse className="h-4 w-4" />;
    if (id === 'engineering') return <Wrench className="h-4 w-4" />;
    if (id === 'cargo_bay') return <Car className="h-4 w-4" />;
    if (id === 'comms_desk') return <Radio className="h-4 w-4" />;
    return <PlaneLanding className="h-4 w-4" />;
  };

  const segments = [
    {
      id: 'launch',
      ar: 'الإطلاق (Launch)',
      en: 'Launch Segment',
      statusAr: 'جاهز - Delta-V ' + shipMetrics.deltaV,
      statusEn: 'READY - Delta-V ' + shipMetrics.deltaV,
    },
    {
      id: 'space',
      ar: 'الفضاء (Space)',
      en: 'Space Segment',
      statusAr: `${discoveredPlanets.length}/9 أجرام • درع ${spaceTelemetry.shield}`,
      statusEn: `${discoveredPlanets.length}/9 Worlds • SHLD ${spaceTelemetry.shield}`,
    },
    {
      id: 'ground',
      ar: 'الأرضي (Ground)',
      en: 'Ground Segment',
      statusAr: `${resources.commsStation} (${resources.commsSignal}%)`,
      statusEn: `${resources.commsStation} (${resources.commsSignal}%)`,
    },
    {
      id: 'user',
      ar: 'العلمي (User)',
      en: 'User Segment',
      statusAr: `${collectedSampleIds.length} عينة • ${resources.dataTransmitted} MB`,
      statusEn: `${collectedSampleIds.length} Samples • ${resources.dataTransmitted} MB`,
    },
  ];

  const repairDelta = formatMultDelta(personnelEffects.repairSpeedMult);
  const scienceDelta = formatMultDelta(personnelEffects.scienceRateMult);
  const lifeDelta = formatMultDelta(personnelEffects.lifeSupportRateMult);
  const commsDelta = formatMultDelta(personnelEffects.commsRateMult);
  const flightDelta = formatMultDelta(personnelEffects.flightEfficiencyMult);

  const handleSwapClick = (id: SpecialistId) => {
    if (!swapSourceId) {
      setSwapSourceId(id);
      return;
    }
    if (swapSourceId === id) {
      setSwapSourceId(null);
      return;
    }
    swapSpecialists(swapSourceId, id);
    setSwapSourceId(null);
  };

  return (
    <div className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center bg-black/80 p-3 sm:p-5">
      <div className="nova-panel flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-cyan-400/35">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#070b12] px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-400/40 bg-cyan-500/15 text-cyan-300">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <div className="font-mono-tech text-[10px] font-bold tracking-widest text-cyan-400">
                SHUTTLE ATRIUM MASTER CONSOLE • 36M × 34M COMPLEX
              </div>
              <h2 className="font-display text-base font-bold text-white sm:text-lg">
                {lang === 'ar'
                  ? 'داش بورد البهو الرئيسي — أنظمة المكوك وإدارة المتخصصين'
                  : 'Main Atrium Dashboard — Shuttle Systems & Personnel Management'}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Dashboard View Tabs */}
            <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-black/50 p-0.5">
              <button
                onClick={() => setDashboardTab('overview')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition ${
                  dashboardTab === 'overview'
                    ? 'bg-cyan-400 text-slate-950'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>{lang === 'ar' ? 'الأنظمة والغرف الـ 10' : 'Systems & 10 Rooms'}</span>
              </button>
              <button
                onClick={() => setDashboardTab('personnel')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition ${
                  dashboardTab === 'personnel'
                    ? 'bg-amber-400 text-slate-950'
                    : 'text-amber-200 hover:bg-amber-500/15'
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                <span>{lang === 'ar' ? 'إدارة المتخصصين (توزيع)' : 'Personnel Management'}</span>
              </button>
            </div>

            <button
              onClick={() => {
                setDashboardOpen(false);
                setMode2dOpen(true, 'space2d');
              }}
              className="flex items-center gap-1.5 rounded-lg border border-violet-400/40 bg-violet-500/20 px-3 py-1.5 text-xs font-bold text-violet-200 transition hover:bg-violet-500/30"
            >
              <Gamepad2 className="h-4 w-4" />
              <span>{lang === 'ar' ? 'وضع 2D' : '2D Mode'}</span>
            </button>
            <button
              onClick={() => setDashboardOpen(false)}
              className="rounded-lg border border-white/15 bg-white/5 p-2 text-slate-300 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
          {dashboardTab === 'personnel' ? (
            <>
              {/* Live Computed Stat Impact Strip */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <div className="nasa-card rounded-lg border-orange-400/30 p-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                    <Wrench className="h-3.5 w-3.5 text-orange-400" />
                    <span>{lang === 'ar' ? 'سرعة الإصلاح والدروع' : 'REPAIR SPEED'}</span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-2 font-mono-tech">
                    <span className="text-xl font-bold text-orange-300">
                      {personnelEffects.repairSpeedMult.toFixed(2)}x
                    </span>
                    <span className={`text-xs font-bold ${repairDelta.color}`}>
                      {repairDelta.label}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[10px] text-slate-400">
                    {lang === 'ar' ? 'المفاعل + عنبر الروفر' : 'Engineering & Cargo'}
                  </div>
                </div>

                <div className="nasa-card rounded-lg border-sky-400/30 p-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                    <FlaskConical className="h-3.5 w-3.5 text-sky-400" />
                    <span>{lang === 'ar' ? 'معدل الاكتشاف العلمي' : 'SCIENCE DISCOVERY'}</span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-2 font-mono-tech">
                    <span className="text-xl font-bold text-sky-300">
                      {personnelEffects.scienceRateMult.toFixed(2)}x
                    </span>
                    <span className={`text-xs font-bold ${scienceDelta.color}`}>
                      {scienceDelta.label}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[10px] text-slate-400">
                    {lang === 'ar' ? 'التلسكوب + الملاحة + الزراعة' : 'Science Lab, Nav & Bio'}
                  </div>
                </div>

                <div className="nasa-card rounded-lg border-emerald-400/30 p-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                    <HeartPulse className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{lang === 'ar' ? 'دعم الحياة والأكسجين' : 'LIFE SUPPORT / MED'}</span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-2 font-mono-tech">
                    <span className="text-xl font-bold text-emerald-300">
                      {personnelEffects.lifeSupportRateMult.toFixed(2)}x
                    </span>
                    <span className={`text-xs font-bold ${lifeDelta.color}`}>
                      {lifeDelta.label}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[10px] text-slate-400">
                    {lang === 'ar' ? 'العيادة + الزراعة + الاستراحة' : 'Med Bay, Bio & Galley'}
                  </div>
                </div>

                <div className="nasa-card rounded-lg border-violet-400/30 p-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                    <Radio className="h-3.5 w-3.5 text-violet-400" />
                    <span>{lang === 'ar' ? 'سرعة البث DSN' : 'DSN COMMS RATE'}</span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-2 font-mono-tech">
                    <span className="text-xl font-bold text-violet-300">
                      {personnelEffects.commsRateMult.toFixed(2)}x
                    </span>
                    <span className={`text-xs font-bold ${commsDelta.color}`}>
                      {commsDelta.label}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[10px] text-slate-400">
                    {lang === 'ar' ? 'غرفة DSN + الملاحة' : 'DSN Comms & Nav'}
                  </div>
                </div>

                <div className="nasa-card rounded-lg border-cyan-400/30 p-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                    <Gauge className="h-3.5 w-3.5 text-cyan-400" />
                    <span>{lang === 'ar' ? 'كفاءة الطيران والسلاح' : 'FLIGHT EFFICIENCY'}</span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-2 font-mono-tech">
                    <span className="text-xl font-bold text-cyan-300">
                      {personnelEffects.flightEfficiencyMult.toFixed(2)}x
                    </span>
                    <span className={`text-xs font-bold ${flightDelta.color}`}>
                      {flightDelta.label}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[10px] text-slate-400">
                    {lang === 'ar' ? 'قمرة القيادة + البوابة' : 'Flight Deck & Airlock'}
                  </div>
                </div>

                <div className="nasa-card rounded-lg border-amber-400/30 p-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    <span>{lang === 'ar' ? 'التناغم المثالي للطاقم' : 'ROOM SYNERGY'}</span>
                  </div>
                  <div className="mt-1 font-mono-tech text-xl font-bold text-amber-300">
                    {personnelEffects.synergyCount} / 10
                  </div>
                  <div className="mt-0.5 text-[10px] text-slate-400">
                    {lang === 'ar' ? 'متخصص في غرفته المثالية' : 'In Ideal Station (+50%)'}
                  </div>
                </div>
              </div>

              {/* Doctrine Presets & Swap Bar */}
              <div className="nasa-card flex flex-wrap items-center justify-between gap-3 rounded-xl p-3.5">
                <div>
                  <h3 className="text-xs font-bold text-white">
                    {lang === 'ar'
                      ? 'تعيين المتخصصين في غرف المكوك (يتغير موقعهم ثلاثي الأبعاد وتتغير إحصائيات السفينة فوراً)'
                      : 'Station Specialists Across Ship Rooms (Updates 3D Locations & Live Ship Performance)'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {swapSourceId
                      ? lang === 'ar'
                        ? 'اختر متخصصاً آخر لتبديل الغرف معه، أو اضغط إلغاء.'
                        : 'Select a second specialist to swap rooms with, or click again to cancel.'
                      : lang === 'ar'
                        ? 'انقل عدة متخصصين لنفس الغرفة لمضاعفة سرعتها، أو بدّل بينهم بضغطة زر.'
                        : 'Stack specialists into priority rooms to amplify output, or apply a preset doctrine.'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => applyPersonnelPreset('repair')}
                    className="flex items-center gap-1 rounded-lg border border-orange-400/40 bg-orange-500/15 px-3 py-1.5 text-xs font-bold text-orange-200 hover:bg-orange-500/25"
                  >
                    <Wrench className="h-3.5 w-3.5" />
                    <span>{lang === 'ar' ? 'أولوية الإصلاح والطوارئ' : 'Repair & Shield Focus'}</span>
                  </button>
                  <button
                    onClick={() => applyPersonnelPreset('science')}
                    className="flex items-center gap-1 rounded-lg border border-sky-400/40 bg-sky-500/15 px-3 py-1.5 text-xs font-bold text-sky-200 hover:bg-sky-500/25"
                  >
                    <FlaskConical className="h-3.5 w-3.5" />
                    <span>{lang === 'ar' ? 'أولوية الاكتشاف العلمي' : 'Science Discovery Focus'}</span>
                  </button>
                  <button
                    onClick={() => applyPersonnelPreset('balanced')}
                    className="flex items-center gap-1 rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-200 hover:bg-emerald-500/25"
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    <span>{lang === 'ar' ? 'التوزيع المثالي المتوازن' : 'Optimal Balanced'}</span>
                  </button>
                </div>
              </div>

              {/* Main Two-Column Assignment Layout */}
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                {/* Left 2 Columns: All 10 Specialists Assignment Cards */}
                <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:col-span-2">
                  {specialists.map((sp) => {
                    const isIdeal = sp.idealRooms.includes(sp.assignedRoomId);
                    const badge = SPECIALTY_BADGE[sp.specialty];
                    const isSwapSelected = swapSourceId === sp.id;
                    const idealRoomNames = sp.idealRooms
                      .map((rId) => SHUTTLE_ROOM_DEFS.find((r) => r.id === rId)?.name[lang] || rId)
                      .join(' / ');

                    return (
                      <div
                        key={sp.id}
                        className={`nasa-card flex flex-col justify-between rounded-xl p-3 transition ${
                          isSwapSelected
                            ? 'border-amber-400 bg-amber-500/10'
                            : isIdeal
                              ? 'border-emerald-400/35'
                              : 'border-amber-400/25'
                        }`}
                      >
                        <div>
                          <div className="mb-1.5 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`rounded border px-1.5 py-0.5 font-mono-tech text-[9px] font-bold ${badge.cls}`}
                              >
                                {badge[lang]}
                              </span>
                              <span className="font-mono-tech text-[10px] font-bold text-slate-300">
                                SKILL {sp.skillRating}
                              </span>
                            </div>

                            <span
                              className={`rounded px-1.5 py-0.5 font-mono-tech text-[9px] font-bold ${
                                isIdeal
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-amber-500/20 text-amber-200'
                              }`}
                            >
                              {isIdeal
                                ? lang === 'ar'
                                  ? 'تناغم +50%'
                                  : 'SYNERGY +50%'
                                : lang === 'ar'
                                  ? 'مهمة بديلة'
                                  : 'CROSS-STATIONED'}
                            </span>
                          </div>

                          <div className="text-sm font-bold text-white">{sp.name[lang]}</div>
                          <div className="text-[11px] text-slate-400">{sp.role[lang]}</div>
                          <div className="mt-1 text-[11px] font-semibold text-cyan-300">
                            {sp.trait[lang]}
                          </div>
                          <div className="mt-0.5 text-[10px] text-slate-400">
                            {lang === 'ar' ? 'الغرفة المثالية:' : 'Ideal Station:'}{' '}
                            <span className="text-slate-200">{idealRoomNames}</span>
                          </div>
                        </div>

                        <div className="mt-2.5 flex items-center gap-2 border-t border-white/10 pt-2.5">
                          <select
                            value={sp.assignedRoomId}
                            onChange={(e) =>
                              assignSpecialistToRoom(sp.id, e.target.value as ShuttleRoomId)
                            }
                            aria-label={`Assign room for ${sp.name.en}`}
                            className="flex-1 rounded-lg border border-white/15 bg-[#090e17] px-2.5 py-1.5 text-xs font-bold text-white focus:border-cyan-400 focus:outline-none"
                          >
                            {SHUTTLE_ROOM_DEFS.map((rm) => (
                              <option key={rm.id} value={rm.id}>
                                {rm.code} — {rm.name[lang]}
                                {sp.idealRooms.includes(rm.id) ? ' ★' : ''}
                              </option>
                            ))}
                          </select>

                          <button
                            onClick={() => handleSwapClick(sp.id)}
                            title={lang === 'ar' ? 'تبديل الغرفة مع متخصص آخر' : 'Swap room with another specialist'}
                            className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition ${
                              isSwapSelected
                                ? 'border-amber-400 bg-amber-400 text-slate-950'
                                : 'border-white/15 bg-white/5 text-slate-200 hover:bg-white/10'
                            }`}
                          >
                            <ArrowLeftRight className="h-3.5 w-3.5" />
                            <span>
                              {isSwapSelected
                                ? lang === 'ar'
                                  ? 'إلغاء'
                                  : 'Cancel'
                                : swapSourceId
                                  ? lang === 'ar'
                                    ? 'تبديل هنا'
                                    : 'Swap Here'
                                  : lang === 'ar'
                                    ? 'تبديل'
                                    : 'Swap'}
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right Column: Live Room Occupancy Matrix */}
                <div className="nasa-card flex flex-col gap-2 rounded-xl p-3.5">
                  <div className="border-b border-white/10 pb-2">
                    <h3 className="text-xs font-bold text-amber-300">
                      {lang === 'ar'
                        ? 'توزيع الغرف الـ 10 الحالي وتأثير كل غرفة'
                        : 'Live Ship Compartment Occupancy'}
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      {lang === 'ar'
                        ? 'اضغط على أي غرفة لزيارة الطاقم داخلها بوضع 3D'
                        : 'Click any room to visit its stationed specialists in 3D'}
                    </p>
                  </div>

                  <div className="space-y-2 overflow-y-auto">
                    {SHUTTLE_ROOM_DEFS.map((room) => {
                      const stationed = specialists.filter((sp) => sp.assignedRoomId === room.id);
                      return (
                        <div
                          key={room.id}
                          className="rounded-lg border border-white/10 bg-black/40 p-2.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <div className="font-mono-tech text-[9px] text-slate-400">
                                {room.code} • {room.focusStat[lang]}
                              </div>
                              <div className="text-xs font-bold text-white">{room.name[lang]}</div>
                            </div>
                            <button
                              onClick={() => {
                                setDashboardOpen(false);
                                jumpToShuttleSection(room.id);
                              }}
                              className="rounded border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] font-bold text-cyan-300 hover:bg-white/10"
                            >
                              3D
                            </button>
                          </div>

                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {stationed.length > 0 ? (
                              stationed.map((st) => (
                                <span
                                  key={st.id}
                                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                    st.idealRooms.includes(room.id)
                                      ? 'border border-emerald-400/35 bg-emerald-500/15 text-emerald-200'
                                      : 'border border-amber-400/35 bg-amber-500/15 text-amber-200'
                                  }`}
                                >
                                  {st.name[lang]}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] italic text-slate-500">
                                {lang === 'ar' ? 'بدون طاقم حالياً' : 'Unmanned'}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Top KPI Strip */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                <div className="nasa-card rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                    <Zap className="h-3.5 w-3.5 text-amber-400" />
                    <span>{lang === 'ar' ? 'الطاقة والمفاعل' : 'POWER / REACTOR'}</span>
                  </div>
                  <div className="mt-1 font-mono-tech text-lg font-bold text-amber-300">
                    {Math.round(resources.battery)}%
                  </div>
                  <div className="text-[10px] text-slate-400">
                    +{resources.powerGeneration}W / -{resources.powerConsumption}W
                  </div>
                </div>

                <div className="nasa-card rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                    <Shield className="h-3.5 w-3.5 text-cyan-400" />
                    <span>{lang === 'ar' ? 'دروع المكوك' : 'ORB SHIELD'}</span>
                  </div>
                  <div className="mt-1 font-mono-tech text-lg font-bold text-cyan-300">
                    {spaceTelemetry.shield}/{spaceTelemetry.maxShield}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {lang === 'ar' ? 'إصلاح' : 'REPAIR'} {personnelEffects.repairSpeedMult}x
                  </div>
                </div>

                <div className="nasa-card rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                    <Leaf className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{lang === 'ar' ? 'الأكسجين والحياة' : 'CABIN O2'}</span>
                  </div>
                  <div className="mt-1 font-mono-tech text-lg font-bold text-emerald-300">
                    {Math.round(resources.suitO2)}%
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {lang === 'ar' ? 'دعم حيوي' : 'LIFE'} {personnelEffects.lifeSupportRateMult}x
                  </div>
                </div>

                <div className="nasa-card rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                    <Activity className="h-3.5 w-3.5 text-rose-400" />
                    <span>{lang === 'ar' ? 'الإشعاع والغبار' : 'RAD / DUST'}</span>
                  </div>
                  <div className="mt-1 font-mono-tech text-base font-bold text-rose-300">
                    {spaceTelemetry.radiationSievert.toFixed(2)} mSv
                  </div>
                  <div className="text-[10px] text-slate-400">
                    DUST {spaceTelemetry.dustDensityPct}%
                  </div>
                </div>

                <div className="nasa-card rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                    <Bot className="h-3.5 w-3.5 text-violet-400" />
                    <span>{lang === 'ar' ? 'البيانات والعلوم' : 'DATA & SCIENCE'}</span>
                  </div>
                  <div className="mt-1 font-mono-tech text-base font-bold text-violet-300">
                    {resources.credits} CR
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {lang === 'ar' ? 'اكتشاف' : 'SCI'} {personnelEffects.scienceRateMult}x
                  </div>
                </div>

                <button
                  onClick={cycleWeather}
                  className="nasa-card rounded-lg p-3 text-start transition hover:border-cyan-400/50"
                >
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                    <Flame className="h-3.5 w-3.5 text-amber-300" />
                    <span>{lang === 'ar' ? 'طقس الفضاء (تبديل)' : 'WEATHER (CYCLE)'}</span>
                  </div>
                  <div className="mt-1 text-sm font-bold text-white">
                    {UI_COPY.weather[weather].name[lang]}
                  </div>
                  <div className="text-[10px] text-cyan-300">
                    {currentPlanet.name[lang]} • {discoveredPlanets.length}/6
                  </div>
                </button>
              </div>

              {/* Personnel Management Quick Banner */}
              <div className="nasa-card flex flex-wrap items-center justify-between gap-3 rounded-xl border-amber-400/35 bg-amber-500/5 px-4 py-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-400/40 bg-amber-500/15 text-amber-300">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">
                      {lang === 'ar'
                        ? 'إدارة توزيع الطاقم (Personnel Management)'
                        : 'Active Personnel Allocation Effects'}
                    </div>
                    <div className="font-mono-tech text-[11px] text-slate-300">
                      {lang === 'ar'
                        ? `الإصلاح ${personnelEffects.repairSpeedMult}x • الاكتشاف العلمي ${personnelEffects.scienceRateMult}x • دعم الحياة ${personnelEffects.lifeSupportRateMult}x • البث ${personnelEffects.commsRateMult}x • تناغم ${personnelEffects.synergyCount}/10`
                        : `Repair ${personnelEffects.repairSpeedMult}x • Science ${personnelEffects.scienceRateMult}x • Life ${personnelEffects.lifeSupportRateMult}x • Comms ${personnelEffects.commsRateMult}x • Synergy ${personnelEffects.synergyCount}/10`}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setDashboardTab('personnel')}
                  className="flex items-center gap-1.5 rounded-lg bg-amber-400 px-3.5 py-2 text-xs font-bold text-slate-950 hover:brightness-110"
                >
                  <Users className="h-4 w-4" />
                  <span>{lang === 'ar' ? 'إدارة وتعيين المتخصصين' : 'Manage & Assign Specialists'}</span>
                </button>
              </div>

              {/* NASA 4 Mission Segments + CML 1-4 */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="nasa-card rounded-xl p-4 lg:col-span-2">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-cyan-300" />
                      <h3 className="text-xs font-bold tracking-wider text-white">
                        {lang === 'ar'
                          ? 'قطاعات مهمة ناسا الأربعة (NASA 4 Mission Segments)'
                          : 'NASA 4 Major Mission Segments'}
                      </h3>
                    </div>
                    <span className="font-mono-tech text-[10px] text-emerald-300">
                      TELESCOPE ×{telescope.deployedCount} • CUBESAT P{telescope.cubeSatPhase}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {segments.map((seg) => (
                      <div
                        key={seg.id}
                        className="flex items-center justify-between rounded-lg border border-white/10 bg-black/40 px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          <span className="text-xs font-bold text-slate-100">
                            {lang === 'ar' ? seg.ar : seg.en}
                          </span>
                        </div>
                        <span className="font-mono-tech text-[10px] text-cyan-300">
                          {lang === 'ar' ? seg.statusAr : seg.statusEn}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="nasa-card rounded-xl p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-amber-300">
                      {lang === 'ar' ? 'مستوى نضج المفهوم (JPL CML 1–4)' : 'JPL Concept Maturity (CML 1–4)'}
                    </h3>
                    <span className="font-mono-tech text-xs font-bold text-white">CML {cmlLevel}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {([1, 2, 3, 4] as const).map((lv) => (
                      <button
                        key={lv}
                        onClick={() => setCmlLevel(lv)}
                        className={`rounded-lg border py-2 font-mono-tech text-xs font-bold transition ${
                          cmlLevel >= lv
                            ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                            : 'border-white/10 bg-black/40 text-slate-500 hover:text-slate-200'
                        }`}
                      >
                        CML {lv}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2.5 text-[11px] leading-relaxed text-slate-300">
                    {lang === 'ar'
                      ? 'CML 1: الفكرة • CML 2: الجدوى • CML 3: دراسات المفاضلة • CML 4: التصميم الهندسي النقطي.'
                      : 'CML 1: Initial Idea • CML 2: Feasibility • CML 3: Trade Studies • CML 4: Point Design.'}
                  </p>
                </div>
              </div>

              {/* All 10 Enclosed Shuttle Rooms & Currently Stationed Specialists */}
              <div>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-emerald-300" />
                    <h3 className="text-sm font-bold text-white">
                      {lang === 'ar'
                        ? 'غرف المكوك المغلقة (10 غرف) والمتخصصون المتمركزون حالياً'
                        : '10 Enclosed Shuttle Rooms & Currently Stationed Specialists'}
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {lang === 'ar'
                      ? 'اضغط "دخول 3D" للمشي إليها فوراً أو "إدارة المتخصصين" لإعادة التوزيع'
                      : 'Click "Visit 3D" to walk straight to any room or "Personnel Management" to reassign'}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
                  {SHUTTLE_ROOMS_ROSTER.map((room) => {
                    const assignedHere = specialists.filter((sp) => sp.assignedRoomId === room.id);
                    const primaryText =
                      assignedHere.length > 0
                        ? assignedHere.map((sp) => sp.name[lang]).join(', ')
                        : lang === 'ar'
                          ? 'غير مأهولة'
                          : 'Unmanned';

                    return (
                      <div
                        key={room.id}
                        className="nasa-card flex flex-col justify-between rounded-xl p-3 transition hover:border-cyan-400/40"
                      >
                        <div>
                          <div className="mb-2 flex items-center justify-between gap-1">
                            <span className="font-mono-tech text-[10px] font-bold text-slate-400">
                              {room.roomCode}
                            </span>
                            <span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] text-slate-300">
                              {assignedHere.length} {lang === 'ar' ? 'طاقم' : 'CREW'}
                            </span>
                          </div>

                          <div className="mb-2 flex items-start gap-2">
                            <div className={`rounded-lg border p-2 ${room.accent}`}>
                              {renderRoomIcon(room.id)}
                            </div>
                            <div className="min-w-0">
                              <div className="truncate text-xs font-bold text-white">
                                {lang === 'ar' ? room.titleAr : room.titleEn}
                              </div>
                              <div
                                className={`truncate text-[11px] font-semibold ${
                                  assignedHere.length > 0 ? 'text-cyan-300' : 'text-amber-300'
                                }`}
                              >
                                {primaryText}
                              </div>
                              <div className="truncate text-[10px] text-slate-400">
                                {lang === 'ar' ? room.wingAr : room.wingEn}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-2 flex items-center gap-1.5 border-t border-white/10 pt-2">
                          <button
                            onClick={() => {
                              setDashboardOpen(false);
                              jumpToShuttleSection(room.id);
                            }}
                            className="flex flex-1 items-center justify-center gap-1 rounded border border-white/15 bg-white/5 px-2 py-1 text-[10px] font-bold text-slate-200 hover:bg-white/10"
                          >
                            <DoorOpen className="h-3 w-3" />
                            <span>{lang === 'ar' ? 'دخول 3D' : 'Visit 3D'}</span>
                          </button>
                          <button
                            onClick={() => executeRoomDuty(room.id)}
                            className="flex flex-1 items-center justify-center rounded bg-cyan-400/90 px-2 py-1 text-[10px] font-bold text-slate-950 hover:brightness-110"
                          >
                            {lang === 'ar' ? room.actionAr : room.actionEn}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
