import type { Language, NasaResourceKey, StoryChapter, SurvivalMissionDef } from '../types/game';

export const STORY_CHAPTERS: StoryChapter[] = [
  {
    id: 'prologue_2089',
    chapterNum: '01',
    title: {
      ar: 'النداء الأخير من قطاع الحافة — 2089',
      en: 'The Last Distress Beacon — Year 2089',
    },
    subtitle: {
      ar: 'انهيار شبكة المراصد الشمسية وبداية مهمة البقاء',
      en: 'Coronal Storms Knock Out Outer Relays — Survival Protocol Initiated',
    },
    narrative: {
      ar: 'في عام 2089، ضربت عاصفة إشعاعية غير مسبوقة شبكة المراصد والمجسات بين القمر والمريخ. تم تكليف سفينة الأبحاث «نوفا-7» بإنقاذ المهمة العلمية، إعادة ضبط المسارات المدارية، وإيصال البيانات إلى الأرض قبل نفاد الأكسجين أو تصدع الهيكل.',
      en: 'In 2089, an unprecedented coronal mass ejection crippled deep-space observatories between Luna and Mars. Research vessel NOVA-7 is the last active spacecraft in the sector—tasked with stabilizing trajectories, calibrating instruments, and transmitting survival telemetry back to Earth before hull integrity or oxygen fails.',
    },
    telemetryNote: {
      ar: 'تنبيه حرج: أي خطأ هندسي أو تأخير في حل الطوارئ يستنزف دروع السفينة وهيكلها فوراً.',
      en: 'CRITICAL BRIEF: Engineering mistakes or mission timeouts directly damage Hull Integrity, Power, and Life Support.',
    },
    accentColor: 'cyan',
  },
  {
    id: 'nasa_engineering',
    chapterNum: '02',
    title: {
      ar: 'هندسة البقاء: 4 قطاعات ومختبر MDL',
      en: 'Survival Architecture: Four Segments & MDL',
    },
    subtitle: {
      ar: 'إدارة الإطلاق والفضاء والمحطة الأرضية والبيانات العلمية',
      en: 'Launch, Space, Ground & User Segments Under Live Pressure',
    },
    narrative: {
      ar: 'من داخل لوحة التحكم ثنائية الأبعاد للمركبة، ستواجه أعطالاً حقيقية مبنية على معايير ناسا الهندسية: عزل قطاعات المهمة الأربعة، التحقق من مستويات النضج CML 1–4، وموازنة الطاقة والحرارة والمخاطر داخل مختبر تصميم المهمات (MDL).',
      en: 'From NOVA-7’s 2D Command Dashboard, you must solve real operational crises using NASA systems engineering: isolating faults across the 4 Mission Segments, enforcing JPL Concept Maturity Levels (CML 1–4), and balancing thermal and risk margins inside the Mission Design Lab (MDL).',
    },
    telemetryNote: {
      ar: 'معلومة الملاحة: استخدام أدوات GMAT و Mission Viz يمنع انحراف السفينة نحو مناطق الكسوف المميتة.',
      en: 'NAVIGATION DIRECTIVE: Use GMAT burn calculations and Mission Viz timelines to avoid lethal eclipse blackouts.',
    },
    accentColor: 'amber',
  },
  {
    id: 'observatories_partner',
    chapterNum: '03',
    title: {
      ar: 'عيون التلسكوب، CubeSat 101 وشراكة CSA',
      en: 'Space Telescopes, CubeSat 101 & CSA Robotics',
    },
    subtitle: {
      ar: 'توجيه المراصد الفضائية وتعاون وكالة الفضاء الكندية',
      en: 'Multi-Wavelength Optics, CSLI Beacons & Canadarm Precision',
    },
    narrative: {
      ar: 'لرصد الثغرات الآمنة في العاصفة، يجب معايرة التلسكوب الفضائي عبر 3 مستويات تعقيد متدرجة، وإطلاق قمر CubeSat من الفكرة التشغيلية ConOps حتى التشغيل المداري، ثم تنسيق ذراع Canadarm ومستشعر التوجيه الدقيق لوكالة الفضاء الكندية CSA.',
      en: 'To pierce the storm front, calibrate NOVA-7’s observatory across three rising complexity tiers, sequence a CubeSat 101 rescue beacon from ConOps to ground lock, and coordinate Canadian Space Agency (CSA) Canadarm robotics and Fine Guidance optics.',
    },
    telemetryNote: {
      ar: 'شرط البقاء: أكمل مهام البقاء الـ 12 لإنقاذ البعثة وتوسيع الميزانية — 3 إخفاقات حرجة أو وصول الهيكل إلى 0% يعني خسارة السفينة.',
      en: 'SURVIVAL RULE: Clear all 12 Engineering Survival Missions to expand Agency Budget & win — 0% Hull, 0% O2, or 3 strikes ends the mission.',
    },
    accentColor: 'emerald',
  },
];

export interface NasaResourceSummary {
  key: NasaResourceKey;
  code: string;
  agency: 'NASA' | 'NASA / JPL' | 'CSA';
  title: Record<Language, string>;
  summary: Record<Language, string>;
  keyPillars: Record<Language, string[]>;
}

export const NASA_RESOURCE_BRIEFS: NasaResourceSummary[] = [
  {
    key: 'science_missions',
    code: 'SYS-01',
    agency: 'NASA',
    title: {
      ar: 'تصميم وتطوير المهمات العلمية (4 قطاعات)',
      en: 'Design & Develop Science Missions',
    },
    summary: {
      ar: 'منهجية هندسة النظم لتحويل الحاجة العلمية إلى متطلبات وتصميم وتشغيل عبر 4 قطاعات رئيسية.',
      en: 'Systems-engineering lifecycle from science need to verification and operations across four core mission segments.',
    },
    keyPillars: {
      ar: ['قطاع الإطلاق (Launch)', 'قطاع الفضاء (Spacecraft)', 'القطاع الأرضي (Ground/DSN)', 'قطاع المستخدم والعلماء (User)'],
      en: ['Launch Segment', 'Space Segment', 'Ground Segment', 'User Segment'],
    },
  },
  {
    key: 'gmat',
    code: 'NAV-02',
    agency: 'NASA',
    title: {
      ar: 'أداة تحليل المهام العام (GMAT)',
      en: 'General Mission Analysis Tool (GMAT)',
    },
    summary: {
      ar: 'نظام مفتوح المصدر لنمذجة المدارات، تخطيط المناورات، نوافذ الإطلاق، والمفاضلات الهندسية لمدارات LEO/GEO والقمر والمريخ.',
      en: 'Open-source trajectory optimization, orbit propagation, maneuver planning, and launch-window trade-off analysis.',
    },
    keyPillars: {
      ar: ['نشر وتحليل المدارات', 'مناورات Δv ونوافذ الإطلاق', 'نقاط لاغرانج والانتقال الكوكبي'],
      en: ['Orbit Propagation', 'Δv Maneuver Planning', 'Libration & Deep-Space Transfers'],
    },
  },
  {
    key: 'cml',
    code: 'JPL-03',
    agency: 'NASA / JPL',
    title: {
      ar: 'مستويات نضج المفهوم (JPL CMLs 1–4)',
      en: 'Concept Maturity Levels (CML 1–4)',
    },
    summary: {
      ar: 'إطار JPL لقياس تطور فكرة المهمة قبل الاعتماد الرسمي: من الفكرة الأولية CML 1 إلى التصميم النقطي CML 4.',
      en: 'JPL framework maturing concepts from initial idea (CML 1) through feasibility, trade studies, and point design (CML 4).',
    },
    keyPillars: {
      ar: ['CML 1: الفكرة الأولية', 'CML 2: تحليل الجدوى', 'CML 3: دراسات المفاضلة', 'CML 4: التصميم النقطي'],
      en: ['CML 1: Concept', 'CML 2: Feasibility', 'CML 3: Trade Studies', 'CML 4: Point Design'],
    },
  },
  {
    key: 'mdl',
    code: 'ENG-04',
    agency: 'NASA',
    title: {
      ar: 'مختبر تصميم المهمات (MDL)',
      en: 'Mission Design Lab (MDL)',
    },
    summary: {
      ar: 'بيئة تعاونية سريعة لتقييم أنظمة الدفع، الطاقة، الحرارة، الإلكترونيات، الاتصالات، التكلفة والمخاطر.',
      en: 'Rapid concurrent engineering lab assessing power, propulsion, thermal, avionics, comms, attitude control, cost, and risk.',
    },
    keyPillars: {
      ar: ['ساعات المكتب والاستشارة', 'تطوير المفهوم والمخاطر', 'دراسات المفاضلة', 'التصميم النقطي CAD والتكلفة'],
      en: ['Office Hours', 'Concept Development', 'Trade Studies', 'Point Design'],
    },
  },
  {
    key: 'mission_viz',
    code: 'VIZ-05',
    agency: 'NASA',
    title: {
      ar: 'منصة التصور المداري (NASA Mission Viz)',
      en: 'NASA Mission Viz',
    },
    summary: {
      ar: 'محاكاة ثلاثية الأبعاد تفاعلية لاستكشاف علاقة المسارات الزمنية بحركة الأجرام السماوية والأحداث المدارية.',
      en: 'Interactive 3D visualization mapping spacecraft trajectories, celestial alignments, and temporal mission events.',
    },
    keyPillars: {
      ar: ['تمثيل زمني ومكاني للمسار', 'فحص أحداث الاقتران والكسوف', 'ربط الديناميكا المدارية بالعمليات'],
      en: ['Spatial & Temporal Mapping', 'Conjunction & Eclipse Events', 'Multi-Angle Trajectory Study'],
    },
  },
  {
    key: 'telescope_game',
    code: 'OBS-06',
    agency: 'NASA',
    title: {
      ar: 'مختبر تصميم التلسكوب الفضائي (3 مستويات)',
      en: 'Space Telescope Design Simulation',
    },
    summary: {
      ar: 'الأهداف العلمية تحدد الطول الموجي والأجهزة والبصريات، مع مقارنة التصميم بمهمات ناسا الحقيقية.',
      en: 'Scientific objectives constrain valid wavelengths, instruments, and optics across 3 escalating complexity levels.',
    },
    keyPillars: {
      ar: ['قيود التوافق العلمي', 'تدرج المستويات 1 → 3', 'ربط النتائج بمراصد ناسا (JWST / Chandra / Hubble)'],
      en: ['Compatibility Constraints', '3 Complexity Levels', 'Real NASA Mission Analogs'],
    },
  },
  {
    key: 'cubesat_101',
    code: 'CSL-07',
    agency: 'NASA',
    title: {
      ar: 'دليل CubeSat 101 (من ConOps حتى التشغيل)',
      en: 'CubeSat 101 — CSLI Lifecycle',
    },
    summary: {
      ar: 'مرجع عملي لمطوري الأقمار المكعبة يغطي جميع المراحل من مفهوم العمليات ConOps وحتى الإطلاق والاستقبال الأرضي.',
      en: 'End-to-end guide for first-time CubeSat teams covering ConOps, bus integration, launch deployment, and ground ops.',
    },
    keyPillars: {
      ar: ['1. مفهوم العمليات ConOps', '2. تجميع الحافلة والاختبار', '3. تكامل الإطلاق P-POD', '4. التشغيل والبث RF'],
      en: ['1. ConOps Definition', '2. Bus & Environmental Test', '3. Dispenser Launch', '4. Orbital Beacon Ops'],
    },
  },
  {
    key: 'vr_mission',
    code: 'VRS-08',
    agency: 'NASA',
    title: {
      ar: 'تصور المهمة بالواقع الافتراضي (Space Apps 2023)',
      en: 'Visualize a Space Mission Using VR',
    },
    summary: {
      ar: 'تمثيل تفاعلي يدمج مفهوم المهمة، المدارات الكوكبية، الجدول الزمني للأحداث، والإدراك المكاني ثلاثي الأبعاد.',
      en: 'Interactive spatial framework unifying mission concept, orbital trajectories, timeline events, and 3D orientation.',
    },
    keyPillars: {
      ar: ['مفهوم المهمة', 'المسارات المدارية', 'الجدول الزمني للعمليات', 'التصور المكاني التفاعلي'],
      en: ['Mission Concept', 'Orbital Trajectories', 'Mission Timeline', 'Spatial 3D Orientation'],
    },
  },
  {
    key: 'csa_partner',
    code: 'CSA-09',
    agency: 'CSA',
    title: {
      ar: 'موارد وكالة الفضاء الكندية (CSA Partner)',
      en: 'Canadian Space Agency (CSA) Partner Systems',
    },
    summary: {
      ar: 'أنظمة الروبوتات الفضائية Canadarm والتوجيه البصري الدقيق FGS والأنشطة العلمية التفاعلية لشركاء ناسا.',
      en: 'Partner aerospace contributions including Canadarm robotics, RADARSAT Earth observation, and Fine Guidance optics.',
    },
    keyPillars: {
      ar: ['روبوتات Canadarm المدارية', 'مستشعر التوجيه الدقيق FGS', 'علوم الأرض والفضاء التفاعلية'],
      en: ['Canadarm Robotics', 'Fine Guidance Sensor (FGS)', 'Interactive Space Science'],
    },
  },
];

export const SURVIVAL_MISSIONS: SurvivalMissionDef[] = [
  {
    id: 'm01_segments',
    order: 1,
    resourceKey: 'science_missions',
    resourceTag: {
      ar: 'تصميم وتطوير المهمات العلمية • القطاعات الأربعة',
      en: 'Design & Develop Science Missions · 4 Segments',
    },
    title: {
      ar: 'طوارئ 01: انقطاع بيانات القطاع الأرضي أثناء الحقن المداري',
      en: 'Crisis 01: Telemetry Dropout During Orbital Insertion',
    },
    situation: {
      ar: 'ذاكرة المركبة امتلأت بنسبة 94% ولا تصل حزم القياس إلى العلماء! المركبة في مدار مستقر والصاروخ أنهى الإطلاق بنجاح، لكن هوائي الاستقبال الأرضي فقد القفل بسبب تغير زاوية السمت.',
      en: 'Spacecraft solid-state recorders are at 94% overflow and scientists are blind. The rocket launch succeeded and the spacecraft bus is nominal, yet Earth receivers lost lock over Goldstone.',
    },
    prompt: {
      ar: 'أي قطاع من قطاعات المهمة الأربعة يحتاج للتدخل الفوري لإنقاذ البيانات؟',
      en: 'Which of the 4 NASA Mission Segments is failing and must be switched to Canberra backup?',
    },
    timeLimitSec: 50,
    hullPenalty: 25,
    powerPenalty: 18,
    o2Penalty: 12,
    rewardCredits: 160,
    rewardDataMb: 70,
    hullRestore: 10,
    mechanic: 'choice',
    options: [
      {
        id: 'ground',
        label: {
          ar: 'القطاع الأرضي (Ground Segment — محطات DSN والتحكم)',
          en: 'Ground Segment (Ground Stations & Mission Control)',
        },
        detail: {
          ar: 'تحويل الاستقبال إلى محطة كانبرا الأسترالية وإعادة فتح رابط القياس عن بُعد.',
          en: 'Hand over dish tracking to Canberra DSN and re-establish telemetry reception.',
        },
        isCorrect: true,
        feedback: {
          ar: 'قرار صحيح 100%! محطات الاستقبال الأرضية والتحكم هي المسؤولة عن استقبال البيانات وإدارة الاتصال.',
          en: 'Exact diagnosis! The Ground Segment handles antennas, data reception, and mission control.',
        },
      },
      {
        id: 'launch',
        label: {
          ar: 'قطاع الإطلاق (Launch Segment — مركبة الإطلاق)',
          en: 'Launch Segment (Launch Vehicle & Pad Services)',
        },
        detail: {
          ar: 'إعادة فحص مراحل صاروخ الإطلاق الذي انفصل بالفعل.',
          en: 'Attempt diagnostics on the expended launch vehicle booster.',
        },
        isCorrect: false,
        feedback: {
          ar: 'تشخيص خاطئ! قطاع الإطلاق مهمته وضع المركبة في المدار فقط وقد انتهت مرحلته — تسبب التأخير في ارتداد حراري للذاكرة.',
          en: 'Wrong segment! The Launch Segment only places the spacecraft in orbit; meanwhile the data buffer overheated.',
        },
      },
      {
        id: 'user',
        label: {
          ar: 'قطاع المستخدم (User Segment — العلماء والمحللون)',
          en: 'User Segment (Scientists Analyzing Data)',
        },
        detail: {
          ar: 'إبلاغ الجامعات بإعادة تشغيل خوادم التحليل دون إصلاح محطة الاستقبال.',
          en: 'Ask external scientists to reboot analysis tools without fixing reception.',
        },
        isCorrect: false,
        feedback: {
          ar: 'خطأ! العلماء في قطاع المستخدم يحللون البيانات بعد وصولها عبر القطاع الأرضي — خسرت السفينة طاقة ومخازن بيانات.',
          en: 'Incorrect! The User Segment analyzes data only after the Ground Segment receives it.',
        },
      },
    ],
    tipsAndTricks: {
      ar: [
        'حيلة سريعة: الصاروخ أنهى الإقلاع (Launch) والمسبار سليم (Space)، والعلماء (User) ينتظرون البيانات — المشكلة الوحيدة بين الأرض والمركبة هي القطاع الأرضي (Ground).',
        'تذكّر: محطات DSN الثلاث (Goldstone / Madrid / Canberra) تتبع القطاع الأرضي وتستلم القياس عن بُعد وتُرسل الأوامر.',
        'لا تضيع الوقت في فحص مرحلة صاروخ منفصلة بالفعل!',
      ],
      en: [
        'Trick: Launch finished, the Spacecraft bus is healthy, and Scientists (User) cannot receive until Ground antennas lock on.',
        'Rule of thumb: Goldstone, Madrid, and Canberra Deep Space Network (DSN) stations belong strictly to the Ground Segment.',
        'Eliminate Launch & User immediately whenever the fault mentions Earth receivers losing signal lock.',
      ],
    },
    quickTrick: {
      ar: 'فقدان إشارة الاستقبال على الأرض = Ground Segment (محطات DSN) فوراً.',
      en: 'Earth receiver signal dropout = Ground Segment (DSN handoff) every time.',
    },
    successSummary: {
      ar: 'تم تحويل البث للقطاع الأرضي في كانبرا وتفريغ 70 MB بنجاح.',
      en: 'Ground Segment lock restored via Canberra DSN; 70 MB safely downlinked.',
    },
    failureSummary: {
      ar: 'تراكم البيانات غير المرسلة تسبب بارتفاع حرارة وحدة المعالجة وتلف الهيكل.',
      en: 'Faulty segment triage caused avionics thermal spike and buffer loss.',
    },
    resourceFact: {
      ar: 'مرجع ناسا: أي مهمة علمية تتكامل عبر 4 قطاعات: الإطلاق (Launch)، الفضاء (Space)، الأرضي (Ground)، والمستخدم (User).',
      en: 'NASA Architecture: Missions span Launch, Space, Ground (stations/control), and User (science data analysis) segments.',
    },
  },
  {
    id: 'm02_gmat',
    order: 2,
    resourceKey: 'gmat',
    resourceTag: {
      ar: 'أداة تحليل المهام العام • GMAT Trajectory',
      en: 'General Mission Analysis Tool (GMAT)',
    },
    title: {
      ar: 'طوارئ 02: انحراف مسار GMAT واقتراب حزام حطام مداري',
      en: 'Crisis 02: GMAT Trajectory Drift Toward Debris Corridor',
    },
    situation: {
      ar: 'أظهرت حسابات الانتشار المداري في GMAT أن أوج المدار الحالي يهبط نحو حزام نيزكي. تحتاج المركبة إلى دفعة Δv محسوبة بدقة في نافذة الإشعال المناسبة لدخول مدار الانتقال القمري بأمان.',
      en: 'GMAT orbit propagation predicts apogee intersecting a dense debris squall. Execute the exact Δv prograde burn at the optimal apsis window to enter lunar transfer safely.',
    },
    prompt: {
      ar: 'اضبط نبضة الدفع Δv وزاوية التوجيه المدارية عبر وحدة محاكاة GMAT:',
      en: 'Calibrate Δv burn magnitude (Target: 820–920 m/s) and select the GMAT transfer regime:',
    },
    timeLimitSec: 55,
    hullPenalty: 32,
    powerPenalty: 15,
    o2Penalty: 10,
    rewardCredits: 210,
    rewardDataMb: 65,
    hullRestore: 12,
    mechanic: 'gmat_burn',
    targetRange: {
      paramALabel: { ar: 'دفع المناورة Δv (المطلوب 820–920)', en: 'Maneuver Burn Δv (Safe: 820–920)' },
      paramAUnit: 'm/s',
      paramAMin: 500,
      paramAMax: 1200,
      paramAStep: 10,
      targetAMin: 820,
      targetAMax: 920,
      paramBLabel: { ar: 'زاوية نافذة الإطلاق (المطلوب 18–26°)', en: 'Launch Window Phase (Safe: 18–26°)' },
      paramBUnit: '°',
      paramBMin: 0,
      paramBMax: 45,
      paramBStep: 1,
      targetBMin: 18,
      targetBMax: 26,
      presetModeLabel: { ar: 'مسار GMAT المستهدف', en: 'GMAT Orbit Scenario' },
      presetModes: [
        {
          id: 'lunar_transfer',
          label: { ar: 'انتقال قمري عند الحضيض (Perigee Burn)', en: 'Lunar Transfer (Perigee Burn)' },
          isCorrect: true,
        },
        {
          id: 'leo_decay',
          label: { ar: 'مناورة فرملة LEO (Retrograde Drop)', en: 'LEO Retrograde De-orbit' },
          isCorrect: false,
        },
        {
          id: 'geo_drift',
          label: { ar: 'حرق عشوائي خارج النافذة (Out-of-Plane)', en: 'Unplanned Plane-Change Burn' },
          isCorrect: false,
        },
      ],
    },
    tipsAndTricks: {
      ar: [
        'حيلة GMAT الذهبية (تأثير أوبرث): أكبر كفاءة لإطلاق القمر تحدث عند أقرب نقطة للأرض (الحضيض Perigee Burn) وليس بالكبح العكسي.',
        'اضبط Δv تماماً في المنتصف حول 870 m/s (داخل النطاق الآمن 820–920)، وزاوية نافذة الإطلاق حول 22° (18–26°).',
        'شاهد الرسم المداري على اليسار: كلما زدت Δv يتسع مدار الانتقال الإهليلجي نحو مدار القمر.',
      ],
      en: [
        'GMAT Oberth Effect Trick: Prograde burns at lowest altitude (Perigee Burn) give maximum orbital transfer energy per kg of fuel.',
        'Aim right for the sweet spot: dial Δv near 870 m/s (safe 820–920) and Launch Window Phase near 22° (safe 18–26°).',
        'Never select Retrograde De-orbit or Plane-Change when trying to escape debris and transfer upward!',
      ],
    },
    quickTrick: {
      ar: 'Δv ≈ 870 m/s + زاوية 22° + اختيار Perigee Burn (تجنّب الكبح أو تغيير المستوى).',
      en: 'Set Δv ~870 m/s, Phase ~22°, and pick Lunar Transfer (Perigee Burn).',
    },
    successSummary: {
      ar: 'أتمت خوارزمية GMAT حرق الانتقال القمري بدقة وتجنبت حقل الحطام!',
      en: 'GMAT maneuver optimization cleared the debris corridor and locked the lunar transfer ellipse!',
    },
    failureSummary: {
      ar: 'مناورة خاطئة خارج نافذة GMAT — اصطدمت شظايا حطام ببدن السفينة!',
      en: 'Off-window Δv burn pushed NOVA-7 through orbital debris — heavy hull impact!',
    },
    resourceFact: {
      ar: 'مرجع GMAT: يُستخدم لحساب انتشار المدارات، تحسين المسارات، تحليل نوافذ الإطلاق، ومناورات القمر ونقاط لاغرانج.',
      en: 'GMAT analyzes orbit propagation, trajectory optimization, maneuver planning, and launch windows across LEO, lunar & deep space.',
    },
  },
  {
    id: 'm03_cml',
    order: 3,
    resourceKey: 'cml',
    resourceTag: {
      ar: 'مستويات نضج المفهوم • JPL CML 1–4',
      en: 'JPL Concept Maturity Levels (CML 1–4)',
    },
    title: {
      ar: 'طوارئ 03: فشل مسبار التعدين لغياب بوابة النضج CML',
      en: 'Crisis 03: Unvalidated Lander Concept Threatens Deployment',
    },
    situation: {
      ar: 'فريق العتاد يضغط لإطلاق كبسولة هبوط بمجرد رسم فكرة أولية (CML 1) دون دراسة جدوى أو مفاضلات هندسية، رغم وجود تقلبات جاذبية وحرارة قاسية على السطح.',
      en: 'Operations wants to launch an unverified descent capsule straight from an initial CML 1 napkin concept despite severe thermal and propulsion uncertainties.',
    },
    prompt: {
      ar: 'وفق إطار JPL CML (من 1 إلى 4)، ما التسلسل الصحيح لإنقاذ الكبسولة قبل الصياغة الرسمية؟',
      en: 'Using JPL’s CML 1–4 progression, what review stage resolves architecture risk before Point Design?',
    },
    timeLimitSec: 50,
    hullPenalty: 28,
    powerPenalty: 16,
    o2Penalty: 14,
    rewardCredits: 180,
    rewardDataMb: 60,
    hullRestore: 10,
    mechanic: 'choice',
    options: [
      {
        id: 'cml_2_3',
        label: {
          ar: 'تطبيق CML 2 (الجدوى والمخاطر) ← ثم CML 3 (دراسات المفاضلة) قبل CML 4',
          en: 'Enforce CML 2 (Feasibility) → CML 3 (Trade Studies) before CML 4 Point Design',
        },
        detail: {
          ar: 'حيث تتخذ أهم القرارات المعمارية خلال CML 1–4 لضمان نجاة المهمة.',
          en: 'Major mission design decisions occur across CML 1–4 before committing flight hardware.',
        },
        isCorrect: true,
        feedback: {
          ar: 'ممتاز! كشفت دراسة الجدوى CML 2 والمفاضلة CML 3 عجزاً في الدرع الحراري وتم تعديله قبل الإطلاق.',
          en: 'Correct! CML 2 feasibility and CML 3 trade studies caught an undersized heat shield prior to release.',
        },
      },
      {
        id: 'skip_to_launch',
        label: {
          ar: 'تجاهل CML 2–3 وإطلاق الفكرة CML 1 مباشرة لتوفير الوقت',
          en: 'Skip CML 2–3 and Launch Directly from CML 1 Idea',
        },
        detail: {
          ar: 'الدخول في التصنيع الفعلي دون فحص الجدوى أو التكلفة.',
          en: 'Skip feasibility and trade studies entirely.',
        },
        isCorrect: false,
        feedback: {
          ar: 'كارثة هندسية! تجاوز CML 2–3 تسبب في انفجار الكبسولة أثناء الدخول الجوي وألحق ضرراً بالمخازن.',
          en: 'Failure! Skipping CML 2–3 left the thermal margin unverified, damaging the launch bay.',
        },
      },
      {
        id: 'cml_only_art',
        label: {
          ar: 'البقاء في CML 1 بالاكتفاء بشعار وصور ترويجية دون حسابات',
          en: 'Stay at CML 1 With Concept Art Only',
        },
        detail: {
          ar: 'تأجيل كل الحسابات لما بعد الوصول للكوكب.',
          en: 'Defer all engineering analysis until arrival.',
        },
        isCorrect: false,
        feedback: {
          ar: 'خطأ! إطار JPL يركز على CML 1–4 لتحويل الفكرة تدريجياً إلى تصميم نقطي قابل للتنفيذ.',
          en: 'Invalid! CML 1 alone cannot survive real mission constraints without feasibility and trade verification.',
        },
      },
    ],
    tipsAndTricks: {
      ar: [
        'قاعدة JPL CML: أهم القرارات المعمارية تُحسم بين CML 1 إلى 4 — لا يمكن القفز من CML 1 إلى التصنيع أو الإطلاق.',
        'الترتيب المنطقي دائماً: 1 فكرة أولية ← 2 دراسة جدوى ومخاطر ← 3 دراسات مفاضلة معمارية ← 4 تصميم نقطي.',
        'تجنب أي خيار يتجاهل حسابات الجدوى أو يؤجل التحليل الهندسي لما بعد الإطلاق!',
      ],
      en: [
        'JPL CML Rule: 70%+ of mission life-cycle risk is locked in during CML 1–4 before Point Design begins.',
        'Remember the ladder: 1 Concept Idea → 2 Feasibility & Risk → 3 Architecture Trade Studies → 4 Point Design.',
        'Reject any shortcut that jumps from CML 1 straight to hardware or delays engineering math until after arrival.',
      ],
    },
    quickTrick: {
      ar: 'لا تتخطَّ CML 2 (الجدوى) وCML 3 (المفاضلة) أبداً قبل CML 4.',
      en: 'Always gate-check CML 2 Feasibility → CML 3 Trade Studies before CML 4.',
    },
    successSummary: {
      ar: 'تم ترقية التصميم عبر بوابات CML 2 → CML 3 → CML 4 بنجاح تام.',
      en: 'Gate review passed across CML 2 Feasibility and CML 3 Trade Studies into safe CML 4 Point Design.',
    },
    failureSummary: {
      ar: 'أدى القفز فوق مراحل النضج إلى فشل هيكلي في وحدة الإنزال.',
      en: 'Bypassing CML gates resulted in structural failure during descent test.',
    },
    resourceFact: {
      ar: 'مرجع JPL CMLs: يركز على المستويات CML 1–4 حيث تُصنع القرارات التصميمية الحاسمة قبل مرحلة التنفيذ.',
      en: 'JPL CMLs: CML 1–4 span initial idea, feasibility analysis, trade studies, and point design before formal implementation.',
    },
  },
  {
    id: 'm04_mdl',
    order: 4,
    resourceKey: 'mdl',
    resourceTag: {
      ar: 'مختبر تصميم المهمات • NASA MDL',
      en: 'Mission Design Lab (MDL)',
    },
    title: {
      ar: 'طوارئ 04: تصاعد حرارة المفاعل وتعارض الطاقة والإلكترونيات',
      en: 'Crisis 04: Reactor Thermal Overload & Avionics Trade-Off',
    },
    situation: {
      ar: 'الرحلة تعبر منطقة إشعاعية كثيفة. مفاعلات الدفع تستهلك 90% من الطاقة مما يرفع حرارة الإلكترونيات إلى حد الخطر. يجب موازنة مخصصات الطاقة والحرارة ومستوى دراسة MDL فوراً!',
      en: 'Passing through a heavy radiation belt pushed avionics heat critical. Inside the 2D MDL Concurrent Lab, rebalance Cooling vs Power Allocation and pick the mature MDL study stage!',
    },
    prompt: {
      ar: 'اضبط معايير التبريد والطاقة واختر مستوى MDL الملائم للحل الهندسي الدقيق:',
      en: 'Balance Thermal Cooling (Target: 68–84%) and Avionics Power Cap (Target: 45–62%), then select the MDL study level:',
    },
    timeLimitSec: 55,
    hullPenalty: 30,
    powerPenalty: 25,
    o2Penalty: 15,
    rewardCredits: 240,
    rewardDataMb: 75,
    hullRestore: 14,
    mechanic: 'mdl_balance',
    targetRange: {
      paramALabel: { ar: 'ضخ التبريد الحراري (الآمن 68–84%)', en: 'Thermal Radiator Flow (Safe: 68–84%)' },
      paramAUnit: '%',
      paramAMin: 20,
      paramAMax: 100,
      paramAStep: 2,
      targetAMin: 68,
      targetAMax: 84,
      paramBLabel: { ar: 'سقف استهلاك الدفع/الطاقة (الآمن 45–62%)', en: 'Propulsion Bus Cap (Safe: 45–62%)' },
      paramBUnit: '%',
      paramBMin: 20,
      paramBMax: 100,
      paramBStep: 2,
      targetBMin: 45,
      targetBMax: 62,
      presetModeLabel: { ar: 'مستوى دراسة مختبر MDL', en: 'MDL Study Maturity Mode' },
      presetModes: [
        {
          id: 'office_hours',
          label: { ar: 'ساعات المكتب (Office Hours — عصف ذهني فقط)', en: 'Office Hours (Quick Brainstorm Only)' },
          isCorrect: false,
        },
        {
          id: 'trade_studies',
          label: { ar: 'دراسات المفاضلة والتصميم النقطي (Trade Studies / Point Design)', en: 'Trade Studies & Point Design (Full Subsystem Audit)' },
          isCorrect: true,
        },
      ],
    },
    tipsAndTricks: {
      ar: [
        'حيلة مختبر MDL: الحرارة العالية تعني أن الدفع يستهلك طاقة زائدة والتبريد منخفض — ارفع ضخ التبريد إلى ~76% واخفض سقف الدفع إلى ~54%.',
        'Office Hours في MDL مخصصة للعصف الذهني السريع فقط ولا تحل أعطال الأنظمة المترابطة.',
        'اختر «دراسات المفاضلة والتصميم النقطي (Trade Studies / Point Design)» لفحص كل التخصصات معاً.',
      ],
      en: [
        'MDL Coupling Trick: High avionics heat means excessive thruster draw + weak radiators — raise Cooling near 76% and throttle Propulsion Bus Cap down near 54%.',
        'MDL Office Hours is only for early brainstorming; live subsystem crises require Trade Studies & Point Design.',
        'Double-check both sliders before clicking Execute: Thermal 68–84%, Bus Cap 45–62%.',
      ],
    },
    quickTrick: {
      ar: 'تبريد ~76% + سقف دفع ~54% + وضع Trade Studies & Point Design.',
      en: 'Set Cooling ~76%, Propulsion Cap ~54%, and Trade Studies & Point Design.',
    },
    successSummary: {
      ar: 'استقرت حرارة الإلكترونيات والاتصالات وعادت هوامش الأمان في MDL!',
      en: 'MDL concurrent subsystems stabilized — thermal margin, power bus, and avionics are green!',
    },
    failureSummary: {
      ar: 'عدم توازن الحرارة والطاقة أدى إلى فصل قواطع الكهرباء وتضرر المفاعل.',
      en: 'Unbalanced thermal/power trade-off tripped main bus breakers and scorched hull plating.',
    },
    resourceFact: {
      ar: 'مرجع MDL: يقيّم التخصصات المترابطة: الطاقة، الدفع، الحرارة، الهياكل، الإلكترونيات، الاتصالات، التحكم بالوضعية، التكلفة والمخاطر.',
      en: 'MDL integrates power, propulsion, thermal, structures, avionics, comms, attitude control, software, reliability, cost & risk.',
    },
  },
  {
    id: 'm05_mission_viz',
    order: 5,
    resourceKey: 'mission_viz',
    resourceTag: {
      ar: 'التصور المداري التفاعلي • NASA Mission Viz',
      en: 'NASA Mission Viz — Temporal Trajectory',
    },
    title: {
      ar: 'طوارئ 05: عبور منطقة الكسوف الكلي وانقطاع الشحن الشمسي',
      en: 'Crisis 05: Umbra Eclipse Blackout Predicted on Mission Viz',
    },
    situation: {
      ar: 'خلال مسار الانتقال، تمر المركبة خلف ظل الكوكب العملاق حيث تنعدم الطاقة الشمسية تماماً. استخدم خط الزمن في Mission Viz لتحديد نافذة الكسوف وتشغيل خطة العبور الاحتياطية!',
      en: 'Along the Mission Viz trajectory arc, NOVA-7 enters planetary umbra where solar output hits 0 W. Scrub the Mission Viz timeline to pinpoint the eclipse phase (0.58–0.72) and activate solar-eclipse survival mode!',
    },
    prompt: {
      ar: 'حرّك مؤشر خط الزمن حتى لحظة الكسوف الحرجة (0.58–0.72) وحدد الإجراء الوقائي:',
      en: 'Scrub Timeline Event to the Umbra Eclipse Zone (0.58–0.72) and choose the right operational action:',
    },
    timeLimitSec: 50,
    hullPenalty: 26,
    powerPenalty: 30,
    o2Penalty: 16,
    rewardCredits: 220,
    rewardDataMb: 80,
    hullRestore: 10,
    mechanic: 'mission_viz_scrub',
    targetRange: {
      paramALabel: { ar: 'مؤشر المسار الزمني Mission Viz (منطقة الكسوف 0.58–0.72)', en: 'Mission Viz Timeline Marker (Eclipse: 0.58–0.72)' },
      paramAUnit: 'T',
      paramAMin: 0,
      paramAMax: 1,
      paramAStep: 0.02,
      targetAMin: 0.58,
      targetAMax: 0.72,
      presetModeLabel: { ar: 'بروتوكول العمليات أثناء الحدث', en: 'Orbital Event Action' },
      presetModes: [
        {
          id: 'rtg_battery',
          label: { ar: 'شحن البطاريات مسبقاً + التحول لوضع الحفاظ RTG', en: 'Pre-charge Batteries + RTG Low-Draw Coast' },
          isCorrect: true,
        },
        {
          id: 'max_solar_drag',
          label: { ar: 'تشغيل الدفع الأيوني الكامل داخل الظل المظلم', en: 'Run Max Electric Thrusters Inside Dark Umbra' },
          isCorrect: false,
        },
      ],
    },
    tipsAndTricks: {
      ar: [
        'حيلة بصرية فورية: انظر لشاشة المخطط 2D على اليسار — حرّك شريط الزمن حتى يدخل مؤشر المركبة داخل المربع الرمادي المظلّل ويتحول لونه إلى البرتقالي (حوالي 0.64T)!',
        'داخل الكسوف الكلي (Umbra) الألواح الشمسية لا تنتج أي طاقة — تشغيل المحركات الأيونية يستنزف البطارية فوراً.',
        'البروتوكول الصح دائماً قبل الظل: شحن مسبق للبطاريات والتحول لوضع الحفاظ RTG.',
      ],
      en: [
        'Visual Schematics Trick: Watch the 2D orbital diagram — scrub the timeline until the orbiting dot enters the dark gray Umbra rectangle and turns AMBER (~0.64T)!',
        'Inside planetary Umbra, solar arrays produce 0 W; firing electric thrusters in shadow guarantees a blackout.',
        'Always select Pre-charge Batteries + RTG Low-Draw Coast for eclipse survivability.',
      ],
    },
    quickTrick: {
      ar: 'حرّك الزمن إلى 0.64T (يتحول المؤشر للبرتقالي) واختر RTG Low-Draw Coast.',
      en: 'Scrub until the orbiter dot turns Amber (~0.64T) + pick RTG Low-Draw Coast.',
    },
    successSummary: {
      ar: 'تم رصد نافذة الكسوف على Mission Viz وعبور الظل الكوكبي دون استنزاف الطاقة!',
      en: 'Umbra transit pinpointed via Mission Viz; spacecraft glided cleanly through the dark eclipse zone!',
    },
    failureSummary: {
      ar: 'انقطعت الطاقة الشمسية فجأة في منطقة الكسوف وتجمدت حساسات الملاحة!',
      en: 'Power collapsed mid-umbra due to misread Mission Viz timeline — thermal frost damaged sensors!',
    },
    resourceFact: {
      ar: 'مرجع Mission Viz: يربط التمثيل ثلاثي الأبعاد والجدول الزمني لأحداث المدار لتوضيح الديناميكا المدارية والعمليات.',
      en: 'Mission Viz connects 3D celestial positions, trajectories, and timeline events to clarify orbital dynamics and operations.',
    },
  },
  {
    id: 'm06_telescope',
    order: 6,
    resourceKey: 'telescope_game',
    resourceTag: {
      ar: 'لعبة تصميم التلسكوب الفضائي • 3 مستويات تعقيد',
      en: 'Space Telescope Design Game · Levels 1–3',
    },
    title: {
      ar: 'طوارئ 06: رصد ثغرة العاصفة عبر 3 مستويات تصميم تلسكوبي',
      en: 'Crisis 06: Multi-Level Observatory Calibration (Levels 1 → 3)',
    },
    situation: {
      ar: 'الرؤية البصرية العادية محجوبة بغبار كوني كثيف. لاختراق السديم وتحديد مصدر إشارة الاستغاثة، عليك إتمام 3 مستويات متصاعدة من تصميم التلسكوب بحيث تتوافق الأهداف العلمية مع الطول الموجي والمرايا!',
      en: 'Dense cosmic dust blocks standard optical sensors. Complete all 3 escalating Space Telescope Engineering levels—where each scientific objective strictly constrains compatible wavelengths and optical systems—to map the safe corridor and match real NASA observatories!',
    },
    prompt: {
      ar: 'أتمم المستويات الثلاثة للتلسكوب دون تعارض علمي:',
      en: 'Clear Levels 1, 2, and 3 by pairing valid Science Objectives, Wavelengths, and Optics:',
    },
    timeLimitSec: 75,
    hullPenalty: 30,
    powerPenalty: 18,
    o2Penalty: 15,
    rewardCredits: 290,
    rewardDataMb: 120,
    hullRestore: 15,
    mechanic: 'telescope_levels',
    tipsAndTricks: {
      ar: [
        'المستوى 1 (مجرات خلف الغبار = JWST): الضوء المرئي ينعكس عن الغبار، لذا استخدم الأشعة تحت الحمراء (Infrared) + المرايا السداسية المجزأة (Segmented IR).',
        'المستوى 2 (هالة الشمس = SOHO/Parker): استخدم الأشعة فوق البنفسجية (Ultraviolet) + جهاز حجب قرص الشمس الكوروناجراف (Coronagraph UV).',
        'المستوى 3 (النجوم النيوترونية والنبضات = Chandra): الفوتونات عالية الطاقة تخترق المرايا العادية، لذا استخدم أشعة X-Ray + مرايا الانعكاس الرعوي (Grazing-Incidence).',
      ],
      en: [
        'Level 1 (Dusty High-z Galaxies → JWST): Infrared penetrates dust — pair Infrared Wavelength + Segmented IR Honeycomb Mirror.',
        'Level 2 (Solar Corona → SOHO/Parker): Solar disk blinds detectors — pair Ultraviolet Wavelength + Coronagraph Occulter.',
        'Level 3 (Pulsar Bursts → Chandra): X-rays pass straight through flat mirrors — pair X-Ray Wavelength + Grazing-Incidence Nested Mirrors.',
      ],
    },
    quickTrick: {
      ar: 'L1: تحت الحمراء+مجزأة | L2: فوق بنفسجية+كوروناجراف | L3: X-Ray+مرايا متداخلة.',
      en: 'L1: IR + Segmented | L2: UV + Coronagraph | L3: X-Ray + Grazing Mirrors.',
    },
    successSummary: {
      ar: 'نجحت المستويات الثلاثة! طابقت تصميماتك مراصد ناسا (JWST و Hubble/SOHO و Chandra X-Ray)!',
      en: 'All 3 Observatory Levels calibrated! Matched real NASA missions (JWST, UV/Optical & Chandra X-Ray)!',
    },
    failureSummary: {
      ar: 'عدم توافق الطول الموجي والنظام البصري شتّت الأشعة وأفشل رصد الثغرة الآمنة.',
      en: 'Incompatible wavelength/optics selection blinded observatory sensors during storm transit.',
    },
    resourceFact: {
      ar: 'مرجع لعبة التلسكوبات: الأهداف العلمية تفرض قيوداً على الطول الموجي والأجهزة والمرايا عبر 3 مستويات، وتربط التصميم بمهمات ناسا الحقيقية.',
      en: 'Telescope Game: Science goals constrain compatible wavelengths, instruments, and optics across 3 levels, mapping to real NASA missions.',
    },
  },
  {
    id: 'm07_cubesat',
    order: 7,
    resourceKey: 'cubesat_101',
    resourceTag: {
      ar: 'دورة حياة الأقمار المكعبة • CubeSat 101 (CSLI)',
      en: 'CubeSat 101 · CSLI Developer Lifecycle',
    },
    title: {
      ar: 'طوارئ 07: إطلاق قمر CubeSat طارئ لتعزيز البث المداري',
      en: 'Crisis 07: Emergency CubeSat 101 Deployment Sequence',
    },
    situation: {
      ar: 'تحتاج المركبة إلى نشر قمر مكعب (CubeSat 3U) يعمل كمنارة تقوية. لكن بوابات الإطلاق ترفض التفعيل لأن مراحل CubeSat 101 غير مرتبة من مفهوم العمليات ConOps حتى التشغيل.',
      en: 'An auxiliary 3U CubeSat relay must be deployed to bridge a comms dead-zone, but launcher safety interlocks require all 4 CubeSat 101 phases sequenced in strict engineering order.',
    },
    prompt: {
      ar: 'رتّب واضغط المراحل الأربع الصحيحة لدورة حياة CubeSat 101 بالتسلسل:',
      en: 'Click the 4 CubeSat 101 lifecycle phases in the exact ConOps-to-Operations sequence:',
    },
    timeLimitSec: 55,
    hullPenalty: 24,
    powerPenalty: 15,
    o2Penalty: 14,
    rewardCredits: 210,
    rewardDataMb: 85,
    hullRestore: 10,
    mechanic: 'cubesat_sequence',
    tipsAndTricks: {
      ar: [
        'حيلة CubeSat 101: فكّر زمنياً من الورق إلى الفضاء: (1) الفكرة ConOps ← (2) بناء واختبار الحافلة 3U ← (3) وضعه بالقاذف والإطلاق ← (4) تشغيل المنارة واستقبال البيانات.',
        'لا يمكن تفعيل البث الترددي RF قبل إطلاق القمر من القاذف، ولا يمكن دمجه بالقاذف قبل تجميع الحافلة واختبار الاهتزاز.',
        'استخدم زر «إعادة ترتيب» فوراً إذا أخطأت في الترقيم #1–#4 قبل الضغط على زر الإطلاق.',
      ],
      en: [
        'CubeSat CSLI Timeline Mnemonic ("C-B-L-O"): ConOps Concept → Bus Build/Test → Launch Dispenser → Orbital RF Ops.',
        'You cannot activate RF Ground Ops before Launch Dispenser deployment, nor launch before Bus vibration testing.',
        'Watch the #1 → #4 badges on each tile and use Reset Sequence anytime before clicking Deploy.',
      ],
    },
    quickTrick: {
      ar: 'الترتيب: 1. ConOps ← 2. تجميع الحافلة ← 3. القاذف والإطلاق ← 4. منارة RF.',
      en: 'Order: ConOps → Assemble 3U Bus → Dispenser Launch → Beacon RF Ops.',
    },
    successSummary: {
      ar: 'تم إطلاق الـ CubeSat بنجاح عبر جميع مراحل CSLI وبدأ بث المنارة!',
      en: 'CubeSat 3U deployed in exact CSLI ConOps-to-Ops sequence — relay beacon online!',
    },
    failureSummary: {
      ar: 'خطأ في تسلسل CubeSat 101 علّق القمر داخل وحدة القذف P-POD وأهدر الطاقة.',
      en: 'Out-of-order CubeSat checklist jammed the dispenser mechanism and drained bus power.',
    },
    resourceFact: {
      ar: 'مرجع CubeSat 101: يغطي كل مرحلة لمطوري CSLI من مفهوم العمليات ConOps، البناء والاختبار، الإطلاق، حتى التشغيل المداري.',
      en: 'CubeSat 101 covers every CSLI phase from Concept of Operations (ConOps) through build, launch integration, and orbital operations.',
    },
  },
  {
    id: 'm08_vr_mission',
    order: 8,
    resourceKey: 'vr_mission',
    resourceTag: {
      ar: 'تصور المهمة بالواقع الافتراضي • NASA Space Apps 2023',
      en: 'Visualize Space Mission Using VR (2023 Challenge)',
    },
    title: {
      ar: 'طوارئ 08: عدم تزامن الخريطة الفضائية والجدول الزمني VR',
      en: 'Crisis 08: Spatial Disorientation & Mission Timeline Desync',
    },
    situation: {
      ar: 'أثناء عبور حقل كويكبات، خرج نظام العرض الملاحي ثلاثي الأبعاد عن التزامن مع توقيت أحداث المهمة، مما يربك الطيارين حول اتجاه الانتقال الكوكبي.',
      en: 'While weaving through an asteroid field, the cockpit spatial visualizer lost sync between the Mission Concept, Trajectory vectors, and Event Timeline.',
    },
    prompt: {
      ar: 'وفق معايير تحدي Visualize a Space Mission Using VR، ما الحزمة المتكاملة التي يجب مزامنتها فوراً؟',
      en: 'Which 4 integrated mission visualization pillars restore full situational awareness?',
    },
    timeLimitSec: 45,
    hullPenalty: 28,
    powerPenalty: 16,
    o2Penalty: 12,
    rewardCredits: 230,
    rewardDataMb: 75,
    hullRestore: 12,
    mechanic: 'choice',
    options: [
      {
        id: 'vr_four_pillars',
        label: {
          ar: 'مفهوم المهمة + المسارات المدارية + الجدول الزمني للأحداث + التصور ثلاثي الأبعاد',
          en: 'Mission Concept + Orbital Trajectories + Mission Timeline + 3D Spatial Visualization',
        },
        detail: {
          ar: 'دمج الهدف العلمي مع مسار الانتقال الأرض-قمر-كوكب وتوقيت العمليات التفاعلي.',
          en: 'Combines mission purpose, orbital transfer geometry, timed event sequence, and 3D spatial relationships.',
        },
        isCorrect: true,
        feedback: {
          ar: 'تزامن كامل! عادت الخريطة التفاعلية ثلاثية الأبعاد وتوقيت المناورات بدقة تامة.',
          en: 'Full VR Telemetry Lock! All 4 spatial and temporal mission layers are synchronized.',
        },
      },
      {
        id: 'static_numbers',
        label: {
          ar: 'جداول أرقام نصية ثابتة بدون مسارات أو تمثيل زمني',
          en: 'Raw Static Spreadsheets Only (No Trajectories or Timeline)',
        },
        detail: {
          ar: 'الاعتماد على أرقام مجردة لا توضح العلاقات المكانية بين الأجرام.',
          en: 'Display raw numbers without 3D spatial relationships or orbital time.',
        },
        isCorrect: false,
        feedback: {
          ar: 'فشل التوجيه! الأرقام المجردة لم تُظهر تقاطع الكويكب مع المسار المداري.',
          en: 'Collision warning! Raw numbers alone failed to convey 3D spatial clearances.',
        },
      },
      {
        id: 'skybox_only',
        label: {
          ar: 'إيقاف الخط الزمني والاكتفاء بصورة خلفية للنجوم',
          en: 'Freeze Timeline & Show Static Starfield Only',
        },
        detail: {
          ar: 'إلغاء توقيت الأحداث والمدارات.',
          en: 'Hide mission events and transfer curves.',
        },
        isCorrect: false,
        feedback: {
          ar: 'خطأ! بدون الجدول الزمني والمسارات يتعذر فهم توقيت إشعال المحركات.',
          en: 'Navigation error! Without orbital trajectories and mission timeline, burn windows were missed.',
        },
      },
    ],
    tipsAndTricks: {
      ar: [
        'تحدي Space Apps 2023 للواقع الافتراضي VR يقوم على 4 أعمدة لا تنفصل: المفهوم، المسارات، الجدول الزمني، والتصور ثلاثي الأبعاد.',
        'أي حل يكتفي بالأرقام المجردة أو يجمد الخط الزمني يفقد الطيار الإحساس بالمسافة والتوقيت.',
        'ابحث عن الخيار الشامل الذي يربط الهدف العلمي بالمدار والتوقيت معاً.',
      ],
      en: [
        '2023 VR Space Apps Rule: Situational awareness requires ALL 4 pillars together — Concept, Trajectories, Timeline, and 3D Space.',
        'Static spreadsheets or frozen timelines leave pilots blind to moving asteroid orbital intersections.',
        'Always select the option combining Spatial (3D Trajectories) + Temporal (Timeline) + Mission Concept.',
      ],
    },
    quickTrick: {
      ar: 'اختر الحزمة الكاملة ذات الـ 4 أعمدة (Concept + Trajectories + Timeline + 3D).',
      en: 'Pick the full 4-pillar bundle: Concept + Trajectories + Timeline + 3D.',
    },
    successSummary: {
      ar: 'تمت مزامنة المفهوم والمسار والزمن والعرض ثلاثي الأبعاد للعبور الآمن.',
      en: 'Mission Concept, Orbital Trajectories, Timeline & 3D Visualization synced cleanly.',
    },
    failureSummary: {
      ar: 'تسبب غياب التزامن المكاني والزمني باحتكاك جانبي مع كويكب شارِد.',
      en: 'Spatial desynchronization caused a grazing asteroid impact on starboard armor.',
    },
    resourceFact: {
      ar: 'مرجع VR Challenge 2023: يرتكز على 4 أعمدة: مفهوم المهمة، المسارات المدارية، الجدول الزمني، والتصور ثلاثي الأبعاد.',
      en: '2023 VR Space Apps Challenge: Integrates Mission Concept, Orbital Trajectories, Mission Timeline & 3D Visualization.',
    },
  },
  {
    id: 'm09_csa',
    order: 9,
    resourceKey: 'csa_partner',
    resourceTag: {
      ar: 'شراكة وكالة الفضاء الكندية • CSA Partner Systems',
      en: 'Canadian Space Agency (CSA) · Robotics & FGS',
    },
    title: {
      ar: 'طوارئ 09 (النهائية): إصلاح درع الهيكل بذراع Canadarm وتثبيت التوجيه الدقيق',
      en: 'Final Crisis 09: CSA Canadarm Thermal Tile Repair & FGS Lock',
    },
    situation: {
      ar: 'المهمة الأخيرة للنجاة! تضرر لوح حراري خارجي واهتز مستشعر التوجيه الدقيق (FGS) المطور بالتعاون مع وكالة الفضاء الكندية CSA. استخدم تحكم ذراع Canadarm لضبط الإزاحة الروبوتية والالتقاط الآمن!',
      en: 'Final survival hurdle! An outer thermal panel needs robotic capture while the CSA Fine Guidance Sensor (FGS) locks NOVA-7’s final broadcast vector. Dial in Canadarm reach and FGS optical tolerance!',
    },
    prompt: {
      ar: 'اضبط ذراع Canadarm (الهدف 72–82%) وعتبة استقرار مستشعر CSA FGS (الهدف 90–98%):',
      en: 'Align CSA Canadarm Reach (Safe: 72–82%) and Fine Guidance Sensor Lock (Safe: 90–98%):',
    },
    timeLimitSec: 60,
    hullPenalty: 35,
    powerPenalty: 20,
    o2Penalty: 20,
    rewardCredits: 400,
    rewardDataMb: 150,
    hullRestore: 22,
    mechanic: 'csa_alignment',
    targetRange: {
      paramALabel: { ar: 'امتداد ذراع Canadarm (المثالي 72–82%)', en: 'CSA Canadarm Reach (Safe: 72–82%)' },
      paramAUnit: '%',
      paramAMin: 30,
      paramAMax: 100,
      paramAStep: 1,
      targetAMin: 72,
      targetAMax: 82,
      paramBLabel: { ar: 'دقة التوجيه البصري CSA FGS (المثالي 90–98%)', en: 'CSA FGS Optical Lock (Safe: 90–98%)' },
      paramBUnit: '%',
      paramBMin: 50,
      paramBMax: 100,
      paramBStep: 1,
      targetBMin: 90,
      targetBMax: 98,
    },
    tipsAndTricks: {
      ar: [
        'حيلة النهاية: ذراع Canadarm في المخطط 2D تتحرك أمامك مباشرة — اضبط الامتداد إلى 77% (داخل 72–82%) لتلامس اللوح الحراري بدقة.',
        'مستشعر التوجيه الدقيق الكندي FGS (المستخدم فعلياً في JWST) يحتاج قفلاً فائق الدقة بين 90–98% — اضبطه على 94%.',
        'تنبيه: لا ترفع FGS إلى 100% لأن ذلك يسبب تشبّع التذبذب المداري — التزم بالنطاق 90–98%!',
      ],
      en: [
        'Robotics Alignment Trick: Watch the gold Canadarm arm in the 2D schematic — set Reach right around 77% (within 72–82%) to lock onto the tile latch.',
        'CSA’s Fine Guidance Sensor (like on JWST) demands ultra-steady tracking at 90–98% — dial FGS Lock to ~94%.',
        'Caution: Pushing FGS to 99–100% triggers gyro saturation overshoot — keep it strictly inside 90–98%!',
      ],
    },
    quickTrick: {
      ar: 'امتداد Canadarm عند 77% + دقة CSA FGS عند 94% (لا تتجاوز 98%).',
      en: 'Set Canadarm Reach to ~77% and CSA FGS Lock to ~94%.',
    },
    successSummary: {
      ar: 'تم تثبيت الدرع بذراع Canadarm وقفل إشارة CSA FGS — نجت بعثة نوفا-7 بأكملها!',
      en: 'CSA Canadarm latched the thermal tile and FGS locked Earth uplink — NOVA-7 survived the sector!',
    },
    failureSummary: {
      ar: 'انحراف ذراع Canadarm أفلت اللوح الحراري وعرّض الهيكل لاختراق خطير!',
      en: 'Misaligned Canadarm torque dropped the shield tile — critical hull integrity breach!',
    },
    resourceFact: {
      ar: 'شراكة CSA: تساهم وكالة الفضاء الكندية بأنظمة Canadarm الروبوتية ومستشعرات FGS وبرامج التعليم الفضائي التفاعلية.',
      en: 'CSA Partner Resources: Canada contributes precision Canadarm robotics, Fine Guidance Sensors (JWST FGS), and interactive space science.',
    },
  },
  {
    id: 'm10_mercury_thermal',
    order: 10,
    resourceKey: 'mdl',
    resourceTag: {
      ar: 'طوارئ الحضيض الشمسي 0.39 AU • عطارد',
      en: '0.39 AU Solar Thermal Gauntlet · Mercury',
    },
    title: {
      ar: 'طوارئ 10: موجة حرارة 430°C عند مدار عطارد (MDL الحراري)',
      en: 'Crisis 10: Mercury 430°C Perihelion Heat Shield Overload',
    },
    situation: {
      ar: 'اقتراب نوفا-7 من عطارد (0.39 AU) رفع التدفق الشمسي إلى 650% عن مدار الأرض! الألواح الشمسية تكاد تنصهر بينما يتطلب كبح المدار طاقة عكسية دقيقة.',
      en: 'Diving toward Mercury (0.39 AU) spiked solar flux to 650% of Earth levels. Unshielded radiators face melt-down unless you tilt solar arrays edge-on and vent peak heat load!',
    },
    prompt: {
      ar: 'وازن تبديد الدرع الحراري وإمالة الأجنحة الشمسية وبروتوكول الكبح النووي:',
      en: 'Calibrate Sunshield Heat Rejection (84–94%) and Array Off-Pointing Angle (68–78%), plus choose Thermal Safe Mode:',
    },
    timeLimitSec: 42,
    hullPenalty: 38,
    powerPenalty: 22,
    o2Penalty: 16,
    rewardCredits: 320,
    rewardDataMb: 120,
    hullRestore: 14,
    budgetRewardM: 35,
    mechanic: 'mdl_balance',
    targetRange: {
      paramALabel: { ar: 'عزل وتبديد الدرع الحراري (الآمن 84–94%)', en: 'Sunshield Rejection Flow (Safe: 84–94%)' },
      paramAUnit: '%',
      paramAMin: 30,
      paramAMax: 100,
      paramAStep: 1,
      targetAMin: 84,
      targetAMax: 94,
      paramBLabel: { ar: 'زاوية إمالة الأجنحة عن الشمس (الآمن 68–78%)', en: 'Solar Wing Feather Tilt (Safe: 68–78%)' },
      paramBUnit: '%',
      paramBMin: 10,
      paramBMax: 100,
      paramBStep: 1,
      targetBMin: 68,
      targetBMax: 78,
      presetModeLabel: { ar: 'خطة عبور الحضيض الشمسي', en: 'Perihelion Thermal Mode' },
      presetModes: [
        {
          id: 'feather_sunshield',
          label: { ar: 'توجيه الدرع نحو الشمس + إمالة الألواح 73%', en: 'Lock Ceramic Sunshield + Feather Arrays 73%' },
          isCorrect: true,
        },
        {
          id: 'face_sun_full',
          label: { ar: 'مواجهة الشمس مباشرة لجمع أقصى كهرباء', en: 'Point Arrays Flat at Sun for Max Watts' },
          isCorrect: false,
        },
      ],
    },
    tipsAndTricks: {
      ar: [
        'حيلة عطارد (مثل مسبار Parker & Messenger): القرب الشديد يعني فائض شمس مميت — لازم الدرع الحراري ~89% والأجنحة مائلة ~73% للهروب من الحرارة.',
        'مواجهة الشمس مباشرة عند 0.39 AU تصهر الخلايا الشمسية وتُتلف المفاعل فوراً!',
      ],
      en: [
        'Mercury Physics (Messenger / BepiColombo): At 0.39 AU sunlight is 6.5x stronger — feather arrays edge-on (~73%) and push sunshield cooling (~89%).',
        'Facing panels flat toward the Sun melts photovoltaic junctions immediately!',
      ],
    },
    quickTrick: {
      ar: 'درع حراري ~89% + إمالة ~73% + Lock Ceramic Sunshield.',
      en: 'Sunshield ~89%, Feather Tilt ~73%, Lock Ceramic Sunshield.',
    },
    successSummary: {
      ar: 'صمد الدرع الخزفي عند 0.39 AU وتم كبح المركبة في مدار عطارد بنجاح (+35M$ ميزانية)!',
      en: 'Thermal gauntlet cleared at 0.39 AU — NOVA-7 captured Mercury orbit cleanly (+$35M Agency Budget)!',
    },
    failureSummary: {
      ar: 'احترقت الحواف الشمسية من وهج 430°C وتضرر الهيكل الأمامي!',
      en: '430°C solar surge scorched primary arrays and buckled forward hull plating!',
    },
    resourceFact: {
      ar: 'فيزياء عطارد: الدوران المداري السريع وقرب الشمس يفرضان درعاً خزفياً وإمالة دائمة للألواح الشمسية.',
      en: 'Mercury Thermal Ops: Spacecraft like MESSENGER & Parker Solar Probe rely on angled ceramic shields and edge-feathered arrays.',
    },
  },
  {
    id: 'm11_uranus_tilt',
    order: 11,
    resourceKey: 'csa_partner',
    resourceTag: {
      ar: 'مناورة الميل القطبي 98° • أورانوس 19.2 AU',
      en: '98° Axial-Tilt Lock · Uranus 19.2 AU',
    },
    title: {
      ar: 'طوارئ 11: فقدان الاتجاه بسبب ميل أورانوس الجانبي (98°)',
      en: 'Crisis 11: Uranus 98° Sideways Pole & Deep-Space Pointing Drift',
    },
    situation: {
      ar: 'عند 19.2 AU، يدور أورانوس وحلقاته بشكل جانبي بزاوية 98°! فقدت مستشعرات النجوم التتبع القطبي وضاع قفل طبق Ka-Band نحو الأرض.',
      en: 'At 19.2 AU, Uranus rotates nearly sideways on a 98° axial tilt. Standard horizon sensors locked onto an ice ring edge instead of Earth DSN!',
    },
    prompt: {
      ar: 'أعد معايرة التفاف طبق الاتصالات وعتبة متتبعات النجوم الدقيقة (FGS / ADCS):',
      en: 'Tune Ka-Band Roll Offset (84–96%) and Star-Tracker Fine Lock (88–97%) to pierce the 19.2 AU polar storm:',
    },
    timeLimitSec: 42,
    hullPenalty: 40,
    powerPenalty: 24,
    o2Penalty: 18,
    rewardCredits: 360,
    rewardDataMb: 140,
    hullRestore: 16,
    budgetRewardM: 40,
    mechanic: 'csa_alignment',
    targetRange: {
      paramALabel: { ar: 'معايرة التفاف الطبق القطبي (الآمن 84–96%)', en: 'Polar Dish Roll Calibration (Safe: 84–96%)' },
      paramAUnit: '%',
      paramAMin: 30,
      paramAMax: 100,
      paramAStep: 1,
      targetAMin: 84,
      targetAMax: 96,
      paramBLabel: { ar: 'قفل متتبع النجوم ADCS (الآمن 88–97%)', en: 'Star Tracker ADCS Lock (Safe: 88–97%)' },
      paramBUnit: '%',
      paramBMin: 40,
      paramBMax: 100,
      paramBStep: 1,
      targetBMin: 88,
      targetBMax: 97,
    },
    tipsAndTricks: {
      ar: [
        'حيلة أورانوس: الكوكب مائل 98° — اضبط التفاف الطبق حول 90% لمجاراة المدار القطبي، وقفل متتبع النجوم عند ~93%.',
        'تجنب 100% لأنها تُدخل عجلات رد الفعل في اهتزاز رنيني.',
      ],
      en: [
        'Uranus Geometry: A 98° axial tilt puts the poles sideways — dial Polar Roll near 90% and Star-Tracker Lock near 93% (avoid 98–100% wheel saturation).',
      ],
    },
    quickTrick: {
      ar: 'التفاف الطبق ~90% + قفل متتبع النجوم ~93%.',
      en: 'Polar Dish Roll ~90% + Star Tracker ADCS ~93%.',
    },
    successSummary: {
      ar: 'اخترق البث ضباب الميثان من 2.87 مليار كم وتم فتح اعتمادات المهمات العميقة (+40M$)!',
      en: 'Ka-Band punched through 2.87B km methane haze cleanly — deep-space funds unlocked (+$40M)!',
    },
    failureSummary: {
      ar: 'ضاع قفل الإشارة في الحلقات الجليدية واصطدمت شظايا دقيقة بالدرع!',
      en: 'Pointing drift swept the craft across ice-ring micrometeoroids — heavy shield impact!',
    },
    resourceFact: {
      ar: 'علم أورانوس: ميل المحور 98° يجعل فصوله تستمر 21 عاماً متواصلة ويتطلب مناورة ADCS ثلاثية المحاور.',
      en: 'Uranus Science: Its 98° obliquity forces continuous polar attitude tracking and RTG power (1% sunlight).',
    },
  },
  {
    id: 'm12_neptune_kuiper',
    order: 12,
    resourceKey: 'gmat',
    resourceTag: {
      ar: 'التحدي الأقصى 30 AU • نبتون وتريتون',
      en: 'Extreme Frontier 30 AU · Neptune & Triton',
    },
    title: {
      ar: 'طوارئ 12 (القصوى): رياح نبتون 1,800 km/h والالتقاط بالجاذبية حول تريتون',
      en: 'Crisis 12 (Apex): Neptune 1,800 km/h Shear & Triton Gravity Capture',
    },
    situation: {
      ar: 'على حافة حزام كايبر (30 AU)، تأخير الاتصال 4.1 ساعات ولا يوجد وقت لانتظار أوامر الأرض! يجب تنفيذ حرق الالتقاط الآلي Δv حول القمر تريتون لتفادي قذف السفينة خارج النظام الشمسي.',
      en: 'At 30 AU, light-speed lag is 4.1 hours—ground control cannot steer in real time! Execute an autonomous Triton gravity-assist Δv capture burn or get flung into interstellar space.',
    },
    prompt: {
      ar: 'اضبط حرق الالتقاط المستقل Δv وزاوية مسار تريتون عبر محاكي GMAT المستقل:',
      en: 'Program Autonomous Capture Δv (960–1060 m/s), Triton Flyby Phase (30–38°), and Capture Trajectory:',
    },
    timeLimitSec: 45,
    hullPenalty: 45,
    powerPenalty: 28,
    o2Penalty: 22,
    rewardCredits: 480,
    rewardDataMb: 180,
    hullRestore: 24,
    budgetRewardM: 55,
    mechanic: 'gmat_burn',
    targetRange: {
      paramALabel: { ar: 'دفع الالتقاط الذاتي Δv (المطلوب 960–1060)', en: 'Autonomous Capture Δv (Safe: 960–1060)' },
      paramAUnit: 'm/s',
      paramAMin: 700,
      paramAMax: 1300,
      paramAStep: 10,
      targetAMin: 960,
      targetAMax: 1060,
      paramBLabel: { ar: 'زاوية جاذبية تريتون (المطلوب 30–38°)', en: 'Triton Slingshot Phase (Safe: 30–38°)' },
      paramBUnit: '°',
      paramBMin: 5,
      paramBMax: 55,
      paramBStep: 1,
      targetBMin: 30,
      targetBMax: 38,
      presetModeLabel: { ar: 'مناورة الحافة القصوى 30 AU', en: '30 AU Autonomous Trajectory' },
      presetModes: [
        {
          id: 'triton_capture',
          label: { ar: 'التقاط عكسي بمساعدة تريتون (Triton Gravity Capture)', en: 'Retrograde Triton Gravity-Assist Capture' },
          isCorrect: true,
        },
        {
          id: 'heliocentric_escape',
          label: { ar: 'دفع أمامي نحو الخروج من النظام الشمسي', en: 'Prograde Flyby — Hyperbolic Escape' },
          isCorrect: false,
        },
        {
          id: 'blind_aerocapture',
          label: { ar: 'غوص مباشر في غلاف الميثان العاصف', en: 'Unshielded Deep Atmosphere Dive' },
          isCorrect: false,
        },
      ],
    },
    tipsAndTricks: {
      ar: [
        'تحدي الحافة 30 AU: نحتاج كبحاً عكسياً Δv ≈ 1010 m/s مع استغلال جاذبية القمر العكسي تريتون عند زاوية 34° للبقاء في المدار!',
        'الغوص في رياح 1,800 km/h بدون كبح مداري يدمر الهيكل فوراً.',
      ],
      en: [
        '30 AU Capture Math: Dial Δv ~1010 m/s + Phase ~34° and choose Retrograde Triton Gravity-Assist Capture to brake safely without hitting supersonic methane winds.',
      ],
    },
    quickTrick: {
      ar: 'Δv ≈ 1010 m/s + زاوية 34° + Triton Gravity Capture.',
      en: 'Δv ~1010 m/s, Phase ~34°, Retrograde Triton Gravity-Assist Capture.',
    },
    successSummary: {
      ar: 'إنجاز تاريخي! استقرت نوفا-7 حول نبتون وتريتون وحصدت أعلى ميزانية في الوكالة (+55M$)!',
      en: 'Historic Apex Clear! NOVA-7 captured Neptune-Triton orbit cleanly and unlocked flagship funding (+$55M)!',
    },
    failureSummary: {
      ar: 'أفلتت الجاذبية أو مزّقت رياح 1,800 km/h الدرع الخلفي عند 30 AU!',
      en: 'Supersonic methane wind shear & missed Triton window battered aft hull!',
    },
    resourceFact: {
      ar: 'فيزياء نبتون: قمر تريتون يدور عكسياً وأقسى رياح في النظام الشمسي تتطلب تشغيل RTG وملاحة ذاتية بسبب تأخير 4.1 ساعات.',
      en: 'Neptune Ops: 4.1-hour light lag makes ground joystick control impossible — autonomous onboard Δv and RTG reactors are vital.',
    },
  },
];
