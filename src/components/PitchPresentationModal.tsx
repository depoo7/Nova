import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Compass,
  Cpu,
  ExternalLink,
  Layers,
  Printer,
  Rocket,
  ShieldAlert,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import heroCraftVisual from '../assets/images/nova_pitch_hero_1794648422292.jpg';
import scopeOrbitVisual from '../assets/images/nova_telescope_cubesat_1794648420542.jpg';
import { NASA_RESOURCE_BRIEFS } from '../data/nasaSurvivalData';
import { useGameStore } from '../store/gameStore';

const TEAM_MEMBERS = [
  'abdelrahman mostafa',
  'asser badr',
  'zain eldin mohammed',
  'malak mouawad',
  'hanin akrm',
  'malak agamy',
];

interface SourceMappingCard {
  id: string;
  code: string;
  agency: 'NASA' | 'NASA / JPL' | 'CSA';
  name: string;
  roleInGame: { ar: string; en: string };
  educationalValue: { ar: string; en: string };
  inGameFeature: { ar: string; en: string };
  accent: string;
}

const EIGHT_SOURCES_VISUAL_CARDS: SourceMappingCard[] = [
  {
    id: 'mdl',
    code: 'MDL',
    agency: 'NASA',
    name: 'NASA Mission Design Lab (MDL)',
    roleInGame: {
      ar: 'إدارة المقايضات الفورية بين الكتلة والطاقة والحرارة والاتصالات والميزانية.',
      en: 'Concurrent trade-off checks across mass, power, thermal, comms & budget.',
    },
    educationalValue: {
      ar: 'يمنع التصميمات المنعزلة؛ أي زيادة في الأجهزة تعيد حساب النظام كله فوراً.',
      en: 'Breaks siloed thinking—every instrument change recalculates the full vehicle.',
    },
    inGameFeature: {
      ar: 'Mission Lab (1-4P) + أزمة MDL الحرارية (10)',
      en: 'Mission Lab (1-4P) + Thermal MDL Survival Crisis',
    },
    accent: 'border-cyan-400/40 bg-cyan-500/10 text-cyan-200',
  },
  {
    id: 'cml',
    code: 'CML 1-4',
    agency: 'NASA / JPL',
    name: 'JPL Concept Maturity Levels (CML)',
    roleInGame: {
      ar: 'تدرّج نضج الفكرة من CML 1 (فكرة) → 2 (جدوى) → 3 (مفاضلة) → 4 (تصميم نقطي).',
      en: 'Step-gate maturation from Idea (CML 1) → Feasibility → Trade → Point Design (4).',
    },
    educationalValue: {
      ar: 'يدرّب الطلاب على عدم الانتقال للبناء قبل إثبات الجدوى وحل تعارضات الموارد.',
      en: 'Teaches disciplined mission gating before committing hardware & launch mass.',
    },
    inGameFeature: {
      ar: 'شريط CML في مصمم المهمة + أزمة 03',
      en: 'CML Gate Tracker + Survival Crisis 03',
    },
    accent: 'border-amber-400/40 bg-amber-500/10 text-amber-200',
  },
  {
    id: 'gmat',
    code: 'GMAT',
    agency: 'NASA',
    name: 'NASA GMAT (General Mission Analysis Tool)',
    roleInGame: {
      ar: 'حسابات Δv ومسارات الانتقال (Hohmann / Fast Burn / Gravity Assist) وبنشمارك الدقة.',
      en: 'Trajectory Δv math (Hohmann, Fast Burn, Flybys) & 5 reference benchmarks.',
    },
    educationalValue: {
      ar: 'يوضح العلاقة الفيزيائية بين معادلة الصاروخ Tsiolkovsky وكمية الوقود وزمن الرحلة.',
      en: 'Demonstrates Tsiolkovsky propellant trade-offs with transparent ±0.2–1.8% notes.',
    },
    inGameFeature: {
      ar: 'تحدي حرق GMAT + تبويب التحقق العلمي',
      en: 'GMAT Burn Challenge + Scientific Validation Tab',
    },
    accent: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200',
  },
  {
    id: 'viz',
    code: 'MISSION VIZ',
    agency: 'NASA',
    name: 'NASA Mission Viz',
    roleInGame: {
      ar: 'خط زمني ثلاثي الأبعاد تفاعلي لمسار المركبة ورصد نوافذ الكسوف والظل المداري.',
      en: 'Interactive 3D trajectory scrubber linking planet motion with eclipse umbra events.',
    },
    educationalValue: {
      ar: 'يربط الميكانيكا المدارية بالعمليات اليومية مثل إطفاء الأحمال قبل انقطاع الشمس.',
      en: 'Connects orbital geometry directly to power/thermal survival decisions.',
    },
    inGameFeature: {
      ar: 'مشهد 3D Mission Viz + أزمة الكسوف 05',
      en: '3D Mission Viz Overlay + Eclipse Crisis 05',
    },
    accent: 'border-sky-400/40 bg-sky-500/10 text-sky-200',
  },
  {
    id: 'scope',
    code: 'TELESCOPE',
    agency: 'NASA',
    name: 'NASA Space Telescope Learning Game',
    roleInGame: {
      ar: 'توافق الهدف العلمي مع الطول الموجي والمرايا عبر 3 مستويات (JWST / SOHO / Chandra).',
      en: '3-tier compatibility rules pairing science goals, wavelengths & mirror optics.',
    },
    educationalValue: {
      ar: 'يثبت أن الكاميرات والمرايا تتحدد حسب فيزياء الضوء والهدف العلمي لا بالتخمين.',
      en: 'Teaches why IR segmented, UV coronagraph, and X-ray grazing optics aren’t interchangeable.',
    },
    inGameFeature: {
      ar: 'مختبر التلسكوب [T] + تحدي 3 مستويات',
      en: 'Telescope Lab [T] + 3-Level Observatory Sim',
    },
    accent: 'border-violet-400/40 bg-violet-500/10 text-violet-200',
  },
  {
    id: 'cubesat',
    code: 'CUBESAT 101',
    agency: 'NASA',
    name: 'NASA CubeSat 101 (CSLI)',
    roleInGame: {
      ar: 'تسلسل الإطلاق الهندسي الصارم: ConOps → بناء الحافلة → قاذف P-POD → منارة RF.',
      en: 'Strict 4-stage CSLI lifecycle: ConOps → Bus/Test → P-POD Launch → RF Ops.',
    },
    educationalValue: {
      ar: 'يعرّف الطلاب بخطوات بناء الأقمار الجامعية الحقيقية قبل الإطلاق المداري.',
      en: 'Mirrors real NASA CSLI university mission readiness checklists step-by-step.',
    },
    inGameFeature: {
      ar: 'مسلسل CubeSat 3U في لوحة البقاء 07',
      en: 'CubeSat 3U Sequencer in Survival Crisis 07',
    },
    accent: 'border-indigo-400/40 bg-indigo-500/10 text-indigo-200',
  },
  {
    id: 'segments',
    code: '4 SEGMENTS',
    agency: 'NASA',
    name: 'NASA 4 Mission Segments',
    roleInGame: {
      ar: 'تقسيم المنظومة لـ: الإطلاق (Launch)، الفضاء، المحطة الأرضية (DSN)، والمستخدم العلمي.',
      en: 'System isolation across Launch, Space, Ground (DSN), and User science segments.',
    },
    educationalValue: {
      ar: 'يمكّن الطالب من تشخيص الأعطال (مثلاً تمييز عطل المحطة الأرضية عن عطل المركبة).',
      en: 'Builds root-cause fault isolation between Earth stations and spacecraft bus.',
    },
    inGameFeature: {
      ar: 'أزمة البث 01 + لوحة محطات DSN الأرضية',
      en: 'Comms Dropout Crisis 01 + DSN Ground Segment',
    },
    accent: 'border-rose-400/40 bg-rose-500/10 text-rose-200',
  },
  {
    id: 'csa',
    code: 'CSA',
    agency: 'CSA',
    name: 'CSA Canadarm & Fine Guidance Sensor (FGS)',
    roleInGame: {
      ar: 'ضبط امتداد ذراع Canadarm الروبوتية (72–82%) وقفل مستشعر التوجيه الدقيق FGS.',
      en: 'Robotic Canadarm thermal repair alignment (72–82%) & JWST-grade FGS optical lock.',
    },
    educationalValue: {
      ar: 'يبرز دور التعاون الدولي في الروبوتات المدارية ودقة توجيه المراصد العميقة.',
      en: 'Showcases international robotics & sub-arcsecond attitude precision in survival ops.',
    },
    inGameFeature: {
      ar: 'الأزمة النهائية 09 في لوحة البقاء 2D',
      en: 'Final Survival Crisis 09 Robotic Alignment',
    },
    accent: 'border-teal-400/40 bg-teal-500/10 text-teal-200',
  },
];

export function PitchPresentationModal() {
  const lang = useGameStore((s) => s.lang);
  const toggleLang = useGameStore((s) => s.toggleLang);
  const pitchDeckOpen = useGameStore((s) => s.pitchDeckOpen);
  const setPitchDeckOpen = useGameStore((s) => s.setPitchDeckOpen);
  const setArchitectOpen = useGameStore((s) => s.setArchitectOpen);
  const setMode2dOpen = useGameStore((s) => s.setMode2dOpen);
  const startNewGameFlow = useGameStore((s) => s.startNewGameFlow);
  const setMccOpen = useGameStore((s) => s.setMccOpen);
  const screen = useGameStore((s) => s.screen);

  const [slideIdx, setSlideIdx] = useState(0);
  const [selectedGuideKey, setSelectedGuideKey] = useState(NASA_RESOURCE_BRIEFS[0].key);

  useEffect(() => {
    if (!pitchDeckOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setSlideIdx((i) => (lang === 'ar' ? Math.max(0, i - 1) : Math.min(6, i + 1)));
      } else if (e.key === 'ArrowLeft') {
        setSlideIdx((i) => (lang === 'ar' ? Math.min(6, i + 1) : Math.max(0, i - 1)));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pitchDeckOpen, lang]);

  if (!pitchDeckOpen) return null;

  const ar = lang === 'ar';
  const activeBrief =
    NASA_RESOURCE_BRIEFS.find((b) => b.key === selectedGuideKey) || NASA_RESOURCE_BRIEFS[0];

  const slideTitles = [
    { ar: '1. التعريف والفريق', en: '1. Introduce' },
    { ar: '2. المشكلة والتحدي', en: '2. Problem' },
    { ar: '3. الحل المبتكر', en: '3. Solution' },
    { ar: '4. العرض العملي الحي', en: '4. Show It Working' },
    { ar: '5. مصادر NASA و CSA', en: '5. NASA & CSA Data' },
    { ar: '6. التقدم والحدود', en: '6. Progress & Limits' },
    { ar: '7. القيمة والقادم', en: '7. Value & Next Steps' },
  ];

  const jumpToMissionLab = () => {
    setPitchDeckOpen(false);
    setArchitectOpen(true);
  };

  const jumpTo2DTab = (tab: 'dashboard2d' | 'designer2d' | 'ops2d') => {
    setPitchDeckOpen(false);
    if (screen === 'menu') {
      startNewGameFlow();
    } else {
      setMode2dOpen(true, tab);
    }
  };

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-2 sm:p-4">
      <div className="nova-panel nova-print-report flex max-h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-cyan-400/40 bg-[#060b14]">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-[#0a1220] px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/40 bg-cyan-500/15 text-cyan-300">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <div className="font-mono-tech text-[10px] font-bold tracking-widest text-cyan-400 uppercase">
                ORBITAL THINK TANK · COMPETITION PITCH DECK ({slideIdx + 1}/7)
              </div>
              <h2 className="font-display text-base font-bold text-white sm:text-lg">
                NOVA: Beyond the Unknown — {slideTitles[slideIdx][lang]}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={toggleLang}
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-cyan-200 hover:bg-white/10"
            >
              {ar ? 'English Slides' : 'شرائح عربي'}
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-200 hover:bg-emerald-500/25"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>{ar ? 'طباعة / PDF' : 'Print / PDF'}</span>
            </button>
            <button
              onClick={() => setPitchDeckOpen(false)}
              className="rounded-lg border border-white/15 bg-white/5 p-1.5 text-slate-300 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Slide Selector Strip */}
        <div className="flex flex-wrap gap-1.5 border-b border-white/10 bg-[#080f1a] px-4 py-2">
          {slideTitles.map((st, idx) => (
            <button
              key={st.en}
              onClick={() => setSlideIdx(idx)}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                slideIdx === idx
                  ? 'bg-cyan-400 text-slate-950'
                  : 'border border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10'
              }`}
            >
              {st[lang]}
            </button>
          ))}
        </div>

        {/* Slide Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7">
          {/* SLIDE 1: INTRODUCE */}
          {slideIdx === 0 && (
            <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-12">
              <div className="space-y-5 lg:col-span-6">
                <div className="inline-flex items-center gap-2 rounded-lg border border-amber-400/40 bg-amber-500/15 px-3 py-1 font-mono-tech text-xs font-bold tracking-wider text-amber-300 uppercase">
                  <Users className="h-4 w-4" />
                  <span>TEAM: orbital think tank</span>
                </div>

                <div>
                  <h1 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
                    NOVA: Beyond the Unknown
                  </h1>
                  <p className="mt-2 text-lg font-bold text-cyan-300">
                    {ar
                      ? 'نوفا: ما وراء المجهول — منصة تصميم ومحاكي مهام فضائية'
                      : 'Space Mission Design, Engineering Trade-Off & 3D Exploration Game'}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="mb-2.5 text-xs font-bold tracking-wider text-slate-400 uppercase">
                    {ar ? 'أعضاء الفريق (6 مهندسين ومطورين)' : 'TEAM MEMBERS (ORBITAL THINK TANK)'}
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {TEAM_MEMBERS.map((member, i) => (
                      <div
                        key={member}
                        className="flex items-center gap-2.5 rounded-xl border border-cyan-400/20 bg-slate-950/70 px-3.5 py-2.5"
                      >
                        <span className="font-mono-tech text-xs font-bold text-amber-300">
                          0{i + 1}
                        </span>
                        <span className="text-sm font-bold text-white capitalize">{member}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3 lg:col-span-6">
                <div className="overflow-hidden rounded-2xl border border-cyan-400/35 bg-black">
                  <img
                    src={heroCraftVisual}
                    alt="NOVA Deep-Space Exploration Craft with DSN Dish & Robotic Arm"
                    className="h-auto w-full object-cover"
                  />
                </div>
                <p className="text-center text-xs text-slate-400">
                  {ar
                    ? 'تصميم بصري لمركبة الفضاء العميق في NOVA: ألواح شمسية، طبق DSN، محرك أيوني، وذراع آلية فوق أوروبا وزحل.'
                    : 'NOVA Deep-Space Architecture: Solar/RTG wings, High-Gain DSN Dish, Ion Thrusters & Robotic Arm.'}
                </p>
              </div>
            </div>
          )}

          {/* SLIDE 2: THE PROBLEM */}
          {slideIdx === 1 && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-mono-tech text-xs font-bold text-rose-400 uppercase">
                    SLIDE 02 · THE ENGINEERING GAP
                  </div>
                  <h2 className="font-display text-2xl font-extrabold text-white sm:text-4xl">
                    {ar
                      ? 'المشكلة: التعلّم النظري المنفصل بدون تجربة المقايضات'
                      : 'The Problem: Disconnected Theory Without Trade-Offs'}
                  </h2>
                </div>
                <button
                  onClick={jumpToMissionLab}
                  className="flex items-center gap-2 rounded-xl border border-emerald-400/45 bg-emerald-500/15 px-4 py-2 text-xs font-bold text-emerald-200 hover:bg-emerald-500/25"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>{ar ? 'افتح Mission Lab لتصوير المشكلة' : 'Open Mission Lab (1-4P)'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                <div className="rounded-2xl border border-rose-400/35 bg-rose-500/10 p-5">
                  <div className="mb-2 text-sm font-bold text-rose-300 uppercase">
                    {ar ? 'التحدي المختار' : 'Selected Challenge'}
                  </div>
                  <div className="text-xl font-extrabold text-white">
                    Space Mission Design Game
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-200">
                    {ar
                      ? 'الميكانيكا المدارية، تصميم الصاروخ، التلسكوب، والميزانية تُدرّس نظرياً بشكل منفصل، من غير بيئة يجرّب فيها الطالب ترابط المنظومة كلها.'
                      : 'Orbital mechanics, launchers, power & telescopes are taught separately without a unified sandbox to test system-wide trade-offs.'}
                  </p>
                </div>

                <div className="rounded-2xl border border-amber-400/35 bg-amber-500/10 p-5">
                  <div className="mb-2 text-sm font-bold text-amber-300 uppercase">
                    {ar ? 'من يحتاج المساعدة؟' : 'Who Needs Help?'}
                  </div>
                  <ul className="space-y-2 text-base font-bold text-white">
                    <li>• {ar ? 'طلاب الجامعات والمدارس STEM' : 'STEM Students'}</li>
                    <li>• {ar ? 'فرق المسابقات الفضائية (1–4 مشاركين)' : 'Competition Teams (1–4P)'}</li>
                    <li>• {ar ? 'المهندسون المبتدئون' : 'Aspiring Systems Engineers'}</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-cyan-400/35 bg-cyan-500/10 p-5">
                  <div className="mb-2 text-sm font-bold text-cyan-300 uppercase">
                    {ar ? 'الأثر الواقعي' : 'Missing Link'}
                  </div>
                  <p className="text-base font-bold leading-relaxed text-white">
                    {ar
                      ? 'إضافة جهاز علمي واحد ترفع فوراً الكتلة + استهلاك الطاقة + توليد البيانات + التكلفة.'
                      : 'Adding 1 science sensor spikes Mass, Power Draw, Data Rate & Cost simultaneously.'}
                  </p>
                  <div className="mt-3 rounded-xl bg-black/40 p-3 text-xs text-cyan-200">
                    {ar
                      ? 'في NOVA: يظهر هذا الصراع حياً في القائمة الرئيسية + Mission Lab (1-4P) مع مفاوضات 4 أدوار هندسية.'
                      : 'Live in NOVA: Mission Lab (1-4P) trade-off bars & 4-role team negotiations.'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 3: THE SOLUTION */}
          {slideIdx === 2 && (
            <div className="space-y-6">
              <div>
                <div className="font-mono-tech text-xs font-bold text-emerald-400 uppercase">
                  SLIDE 03 · WHAT WE BUILT
                </div>
                <h2 className="font-display text-2xl font-extrabold text-white sm:text-4xl">
                  {ar
                    ? 'الحل: منصة NOVA المتكاملة للربط بين 2D الهندسي والـ 3D الحي'
                    : 'Solution: Unified 2D Engineering + Real-Time 3D Spacecraft Simulation'}
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-emerald-400/35 bg-emerald-500/10 p-4">
                  <Compass className="mb-2 h-6 w-6 text-emerald-300" />
                  <h3 className="text-lg font-extrabold text-white">
                    {ar ? 'استوديو المهمة (1–4P)' : 'Mission Studio (1–4P)'}
                  </h3>
                  <p className="mt-1.5 text-sm text-slate-200">
                    {ar
                      ? 'اختيار الهدف، المدار، الصاروخ، والـ 14 نظاماً فرعياً مع موازنة الكتلة والطاقة والبيانات.'
                      : 'Goal, Orbit (9 worlds), Launcher, 14 Subsystems & 4-role trade-offs.'}
                  </p>
                </div>

                <div className="rounded-2xl border border-amber-400/35 bg-amber-500/10 p-4">
                  <Cpu className="mb-2 h-6 w-6 text-amber-300" />
                  <h3 className="text-lg font-extrabold text-white">
                    {ar ? 'تصميم المكوك 2D + البقاء' : '2D Designer & Survival'}
                  </h3>
                  <p className="mt-1.5 text-sm text-slate-200">
                    {ar
                      ? '12 أزمة بقاء هندسية بوقت ومخاطر + ترقيات Tier 1–4 + اختبارات قسوة + Hardcore.'
                      : '12 timed engineering crises, Tier 1–4 upgrades, stress tests & Hardcore mode.'}
                  </p>
                </div>

                <div className="rounded-2xl border border-cyan-400/35 bg-cyan-500/10 p-4">
                  <Rocket className="mb-2 h-6 w-6 text-cyan-300" />
                  <h3 className="text-lg font-extrabold text-white">
                    {ar ? 'التوأم الرقمي الحي 3D' : 'Live 3D Digital Twin'}
                  </h3>
                  <p className="mt-1.5 text-sm text-slate-200">
                    {ar
                      ? 'كل قرار في 2D يغيّر شكل وسلوك المركبة 3D فوراً، وتطير لتهبط بالـ Rover و5 خزانات O₂.'
                      : 'Every 2D choice reconfigures & flies the 3D craft across 9 worlds + 6x6 Rover.'}
                  </p>
                </div>

                <div className="rounded-2xl border border-violet-400/35 bg-violet-500/10 p-4">
                  <Sparkles className="mb-2 h-6 w-6 text-violet-300" />
                  <h3 className="text-lg font-extrabold text-white">
                    {ar ? 'اقتصاد ديناميكي و MCC' : 'Dynamic Economy & MCC'}
                  </h3>
                  <p className="mt-1.5 text-sm text-slate-200">
                    {ar
                      ? 'الفوز يزيد المال (CR) وسقف الميزانية (+$M)، والخسارة تخصم منهما مع تقرير تحقيق في الفشل.'
                      : 'Wins grow CR & Budget; losses penalize both + full root-cause Forensics & What-If.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 4: SHOW IT WORKING */}
          {slideIdx === 3 && (
            <div className="space-y-6">
              <div>
                <div className="font-mono-tech text-xs font-bold text-cyan-400 uppercase">
                  SLIDE 04 · LIVE 30-SECOND WORKFLOW (ACTION → RESULT)
                </div>
                <h2 className="font-display text-2xl font-extrabold text-white sm:text-4xl">
                  {ar
                    ? 'شاهد النظام يعمل: القرار الهندسي ⬅ النتيجة الفورية في 2D و 3D'
                    : 'Show It Working: Engineering Action → Immediate 2D & 3D Result'}
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div className="rounded-2xl border border-emerald-400/35 bg-emerald-500/10 p-5 space-y-3">
                  <div className="text-xs font-bold text-emerald-300 uppercase">
                    DEMO A · MISSION ARCHITECT STUDIO (1-4P)
                  </div>
                  <div className="space-y-2 text-base font-bold text-white">
                    <div>1. {ar ? 'أضف أجهزة علمية ثقيلة ← شريط الكتلة/الميزانية يتحول للأحمر' : 'Add heavy payload → Mass / Budget bar turns Red'}</div>
                    <div>2. {ar ? 'بدّل الصاروخ أو وازن الطاقة والاتصالات' : 'Upgrade launcher or balance Power & Ka-Band DSN'}</div>
                    <div>3. {ar ? 'اضغط Simulate ← تظهر الدرجة (S/A/F) + السبب + مقارنة v1 vs v2' : 'Click Simulate → Grade (S/A/F) + Root Cause + CR/Budget Delta'}</div>
                  </div>
                  <button
                    onClick={jumpToMissionLab}
                    className="mt-2 inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-2 text-xs font-extrabold text-slate-950"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>{ar ? 'تشغيل Mission Lab الآن' : 'Launch Mission Lab Live'}</span>
                  </button>
                </div>

                <div className="rounded-2xl border border-amber-400/35 bg-amber-500/10 p-5 space-y-3">
                  <div className="text-xs font-bold text-amber-300 uppercase">
                    DEMO B · 2D SHUTTLE DESIGNER → 3D DIGITAL TWIN
                  </div>
                  <div className="space-y-2 text-base font-bold text-white">
                    <div>1. {ar ? 'عدّل الأنظمة الـ 14 أو ركّب مفاعل MMRTG ودرع التانتالوم' : 'Equip MMRTG / Tantalum Armor / Ka-Band in 2D'}</div>
                    <div>2. {ar ? 'راقب تغيّر مجسم 3D فوراً (الأجنحة، الطبق، شعاع المسح)' : 'Watch 3D Digital Twin wings, dish & beam morph live'}</div>
                    <div>3. {ar ? 'اضغط Launch to 3D وطِر لسطح الكوكب بالـ Rover 6x6' : 'Deploy to 3D spaceflight & land 6x6 Rover on planetary terrain'}</div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      onClick={() => jumpTo2DTab('designer2d')}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2 text-xs font-extrabold text-slate-950"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>{ar ? 'فتح ورشة 2D + التوأم 3D' : 'Open 2D Designer + 3D Twin'}</span>
                    </button>
                    {screen === 'playing' && (
                      <button
                        onClick={() => {
                          setPitchDeckOpen(false);
                          setMccOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/50 bg-cyan-500/20 px-4 py-2 text-xs font-bold text-cyan-200"
                      >
                        <Layers className="h-3.5 w-3.5" />
                        <span>{ar ? 'فتح مركز التحكم MCC' : 'Open MCC Dashboard'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 5: EXPLAIN THE DATA — NASA & CSA SOURCES VISUALS + LIVE GUIDE */}
          {slideIdx === 4 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 items-center gap-5 lg:grid-cols-12">
                <div className="space-y-2 lg:col-span-7">
                  <div className="font-mono-tech text-xs font-bold text-sky-400 uppercase">
                    SLIDE 05 · AUTHORITATIVE NASA & CSA DATA FOUNDATIONS
                  </div>
                  <h2 className="font-display text-2xl font-extrabold text-white sm:text-3xl">
                    {ar
                      ? 'كيف تُحوّل مصادر NASA و CSA اللعبة إلى محاكاة هندسية واقعية؟'
                      : 'How 8 NASA & CSA Frameworks Power NOVA’s Realism & Educational Value'}
                  </h2>
                  <p className="text-sm text-slate-300">
                    {ar
                      ? 'كل مصدر من المصادر الثمانية مرتبط بآلية لعب تفاعلية حقيقية (مقايضات، مدارات، بصريات، تسلسل إطلاق، أو ذراع روبوتية) ومُوضّح داخل دليل الموارد باللعبة.'
                      : 'Each official aerospace framework maps directly to an interactive mechanic inside NOVA and is documented inside the in-game NASA & CSA Resource Guide.'}
                  </p>
                </div>

                <div className="overflow-hidden rounded-2xl border border-sky-400/35 bg-black lg:col-span-5">
                  <img
                    src={scopeOrbitVisual}
                    alt="Space Telescope, 3U CubeSat RF & Orbital Transfer Diagram"
                    className="h-44 w-full object-cover"
                  />
                </div>
              </div>

              {/* All 8 Requested Sources Architecture Grid */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                {EIGHT_SOURCES_VISUAL_CARDS.map((src) => (
                  <div
                    key={src.id}
                    className={`rounded-xl border p-3.5 ${src.accent}`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono-tech font-bold uppercase opacity-90">
                      <span>{src.agency}</span>
                      <span>{src.code}</span>
                    </div>
                    <h3 className="mt-1 text-sm font-extrabold text-white leading-snug">
                      {src.name}
                    </h3>
                    <p className="mt-1.5 text-xs text-slate-200 leading-relaxed">
                      <strong className="text-white">{ar ? 'الدور باللعبة: ' : 'Game Role: '}</strong>
                      {src.roleInGame[lang]}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-300 leading-relaxed">
                      <strong className="text-emerald-300">{ar ? 'القيمة التعليمية: ' : 'Value: '}</strong>
                      {src.educationalValue[lang]}
                    </p>
                    <div className="mt-2 rounded bg-black/40 px-2 py-1 text-[10px] font-bold text-slate-200">
                      {src.inGameFeature[lang]}
                    </div>
                  </div>
                ))}
              </div>

              {/* Embedded In-Game Resource Guide Preview (For Direct Screenshots!) */}
              <div className="rounded-2xl border border-cyan-400/35 bg-[#08101c] p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-cyan-300 uppercase">
                    <BookOpen className="h-4 w-4" />
                    <span>
                      {ar
                        ? 'معاينة حية من دليل موارد NASA و CSA داخل اللعبة (جاهز للتصوير في الشرائح)'
                        : 'IN-GAME NASA & CSA RESOURCE GUIDE PREVIEW (SCREENSHOT READY)'}
                    </span>
                  </div>
                  <button
                    onClick={() => jumpTo2DTab('dashboard2d')}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/40 bg-cyan-500/15 px-3 py-1 text-[11px] font-bold text-cyan-200 hover:bg-cyan-500/25"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span>{ar ? 'فتح تبويب الدليل بملء الشاشة' : 'Open Full 2D Resource Guide'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
                  <div className="flex flex-wrap gap-1.5 lg:col-span-5">
                    {NASA_RESOURCE_BRIEFS.map((brief) => (
                      <button
                        key={brief.key}
                        onClick={() => setSelectedGuideKey(brief.key)}
                        className={`rounded-lg border px-2.5 py-1.5 text-start text-[11px] font-bold transition ${
                          selectedGuideKey === brief.key
                            ? 'border-cyan-400 bg-cyan-500/20 text-white'
                            : 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        <span className="font-mono-tech text-[10px] text-amber-300">{brief.code} </span>
                        {brief.title[lang]}
                      </button>
                    ))}
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/50 p-3.5 lg:col-span-7">
                    <div className="flex items-center justify-between text-[11px] font-mono-tech text-amber-300">
                      <span>{activeBrief.agency}</span>
                      <span>{activeBrief.code}</span>
                    </div>
                    <h4 className="mt-1 text-base font-extrabold text-white">
                      {activeBrief.title[lang]}
                    </h4>
                    <p className="mt-1 text-xs leading-relaxed text-slate-200">
                      {activeBrief.summary[lang]}
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {activeBrief.keyPillars[lang].map((p) => (
                        <span
                          key={p}
                          className="rounded border border-cyan-400/30 bg-cyan-500/10 px-2 py-1 text-[11px] font-semibold text-cyan-200"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 6: PROGRESS — EVIDENCE & LIMITS */}
          {slideIdx === 5 && (
            <div className="space-y-6">
              <div>
                <div className="font-mono-tech text-xs font-bold text-amber-400 uppercase">
                  SLIDE 06 · EVIDENCE & TRANSPARENT LIMITS
                </div>
                <h2 className="font-display text-2xl font-extrabold text-white sm:text-4xl">
                  {ar ? 'التقدم الفعلي: ما يعمل الآن مقابل الحدود الحالية' : 'Progress: Verified Working Features vs Current Limits'}
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="rounded-2xl border border-emerald-400/35 bg-emerald-500/10 p-5 space-y-3">
                  <div className="flex items-center gap-2 text-base font-extrabold text-emerald-300">
                    <CheckCircle2 className="h-5 w-5" />
                    <span>{ar ? 'ما تم تنفيذه ويعمل فعلياً (Evidence)' : 'What Works Today (Verified Evidence)'}</span>
                  </div>
                  <ul className="space-y-2 text-sm text-slate-100">
                    <li>• {ar ? 'عالم 3D كامل: طيران مداري + هبوط على 9 عوالم + Rover 6x6 + بدلة بـ 5 خزانات O₂.' : 'Full 3D world: flight, landing on 9 Solar bodies, 6x6 Rover & 5-tank O₂ EVA.'}</li>
                    <li>• {ar ? 'استوديو 1–4 لاعبين + 12 أزمة بقاء + ورشة 14 نظاماً فرعياً + التوأم 3D الحي.' : '1–4P Studio + 12 Survival Crises + 14-Subsystem Lab + Live 3D Twin.'}</li>
                    <li>• {ar ? 'مركز تحكم MCC + محاكي What-If + تحقيق الفشل + اختبارات آلية ناجحة (10/10).' : 'MCC Dashboard + What-If Counterfactuals + Failure Forensics (10/10 tests pass).'}</li>
                    <li>• {ar ? 'حفظ التقدم التلقائي (localStorage) + واجهة ثنائية اللغة (عربي / إنجليزي).' : 'Persistent browser saves + full RTL Arabic / LTR English UI.'}</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-amber-400/35 bg-amber-500/10 p-5 space-y-3">
                  <div className="flex items-center gap-2 text-base font-extrabold text-amber-300">
                    <ShieldAlert className="h-5 w-5" />
                    <span>{ar ? 'الحدود الحالية بشفافية (Limits)' : 'Current Engineering Limits (Honest Scope)'}</span>
                  </div>
                  <ul className="space-y-2 text-sm text-slate-100">
                    <li>• {ar ? 'العمل الجماعي (1–4 لاعبين) يعمل حالياً بنظام الأدوار المشتركة وكود التصميم JSON على نفس الجهاز (Pass-and-Play) وليس سيرفر Multiplayer أونلاين.' : '1–4P co-op uses Pass-and-Play shared roles & JSON handoff codes (no live WebSocket server yet).'}</li>
                    <li>• {ar ? 'الفيزياء المدارية تستخدم نماذج تقريبية تعليمية (Tsiolkovsky / Patched Conic) للسرعة والوضوح وليست بديلاً رقمياً كاملاً لبرنامج GMAT.' : 'Astrodynamics use Educational Engineering Approximations (documented ±0.2–1.8% vs GMAT baselines), not full numerical integration.'}</li>
                    <li>• {ar ? 'مساعد Sky AI والصوت يعتمدان على قواعد الحالة الحية والنطق داخل المتصفح.' : 'Sky AI uses deterministic rule-based live telemetry analysis + browser TTS.'}</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 7: VALUE & NEXT STEPS */}
          {slideIdx === 6 && (
            <div className="space-y-6">
              <div>
                <div className="font-mono-tech text-xs font-bold text-violet-400 uppercase">
                  SLIDE 07 · IMPACT & ROADMAP
                </div>
                <h2 className="font-display text-2xl font-extrabold text-white sm:text-4xl">
                  {ar ? 'القيمة التعليمية والخطوات القادمة (Next Steps)' : 'Educational Value & Clearly Labelled Next Steps'}
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
                <div className="rounded-2xl border border-cyan-400/35 bg-cyan-500/10 p-5 md:col-span-5 space-y-3">
                  <div className="text-sm font-extrabold text-cyan-300 uppercase">
                    {ar ? 'القيمة والمردود (Benefits)' : 'Core Benefits'}
                  </div>
                  <p className="text-base font-bold leading-relaxed text-white">
                    {ar
                      ? 'تحويل هندسة الفضاء من معادلات نظرية جامدة إلى تجربة صنع قرار، رؤية العواقب فوراً في 2D و 3D، التعلّم من الفشل، والعمل كفريق هندسي واحد.'
                      : 'Transforms abstract aerospace equations into live engineering judgment, visible 3D consequences, constructive failure analysis, and multidisciplinary teamwork.'}
                  </p>
                </div>

                <div className="rounded-2xl border border-violet-400/35 bg-violet-500/10 p-5 md:col-span-7 space-y-3">
                  <div className="text-sm font-extrabold text-violet-300 uppercase">
                    {ar ? 'الخطوات القادمة (Next Steps)' : 'Clearly Labelled Next Steps'}
                  </div>
                  <div className="space-y-2.5 text-sm">
                    <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                      <span className="font-bold text-amber-300">STEP 1 · </span>
                      <span className="font-bold text-white">
                        {ar
                          ? 'إضافة Multiplayer أونلاين لحظي (WebSockets / Cloud) لربط فرق من 4 طلاب عن بُعد.'
                          : 'Real-Time Cloud Multiplayer (WebSockets) for remote 4-student mission teams.'}
                      </span>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                      <span className="font-bold text-emerald-300">STEP 2 · </span>
                      <span className="font-bold text-white">
                        {ar
                          ? 'ربط API مباشر مع بيانات NASA Open APIs و JPL Horizons لتحديث المواقع المدارية الحية.'
                          : 'Live NASA Open APIs & JPL Horizons Ephemeris sync replacing static orbital tables.'}
                      </span>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                      <span className="font-bold text-cyan-300">STEP 3 · </span>
                      <span className="font-bold text-white">
                        {ar
                          ? 'لوحة معلمين سحابية (Classroom Cloud Dashboard) لمتابعة درجات الطلاب وتقارير الفشل عن بُعد.'
                          : 'Cloud Instructor Classroom Dashboard for live student grading & telemetry review.'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Slide Controls */}
        <div className="flex items-center justify-between border-t border-white/10 bg-[#0a1220] px-5 py-3">
          <button
            disabled={slideIdx === 0}
            onClick={() => setSlideIdx((i) => Math.max(0, i - 1))}
            className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold text-white disabled:opacity-35 hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{ar ? 'الشريحة السابقة' : 'Previous Slide'}</span>
          </button>

          <div className="font-mono-tech text-xs text-slate-400">
            TEAM: ORBITAL THINK TANK · {slideIdx + 1} / 7
          </div>

          <button
            disabled={slideIdx === 6}
            onClick={() => setSlideIdx((i) => Math.min(6, i + 1))}
            className="flex items-center gap-1.5 rounded-xl bg-cyan-400 px-4 py-2 text-xs font-extrabold text-slate-950 disabled:opacity-35 hover:brightness-110"
          >
            <span>{ar ? 'الشريحة التالية' : 'Next Slide'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
