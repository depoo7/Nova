import type { Language, PlanetId } from '../types/game';

export type TeamRoleId = 'planner' | 'architect' | 'science' | 'comms';

export interface TeamRoleDef {
  id: TeamRoleId;
  title: Record<Language, string>;
  responsibility: Record<Language, string>;
  colorClass: string;
}

export interface ArchitectScenario {
  id: string;
  isSandbox?: boolean;
  difficulty: 'Beginner' | 'Standard' | 'Advanced' | 'Extreme' | 'Sandbox';
  title: Record<Language, string>;
  objective: Record<Language, string>;
  brief: Record<Language, string>;
  criticalResource: Record<Language, string>;
  targetScience: number;
  maxBudgetM: number;
  minLifetimeYrs: number;
  recommendedOrbits: string[];
  minDataRateMbps: number;
}

export interface OrbitOption {
  id: string;
  name: Record<Language, string>;
  altitudeLabel: string;
  deltaVReq: number; // km/s proxy difficulty for launcher sizing
  massPenaltyFactor: number; // multiplier on launcher max payload capacity
  commsLatencyLabel: Record<Language, string>;
  solarEfficiency: number; // 1.0 = Earth orbit, 0.43 = Mars, 0.04 = Europa
  radiationWear: number; // affects lifetime
  explanation: Record<Language, string>;
}

export interface LaunchVehicleOption {
  id: string;
  name: Record<Language, string>;
  costM: number;
  leoCapacityKg: number;
  reliabilityPct: number;
  tier: 'Simple' | 'Standard' | 'Advanced';
  note: Record<Language, string>;
}

export interface SubsystemOption {
  id: string;
  category: 'bus' | 'power' | 'comms' | 'adcs';
  name: Record<Language, string>;
  tier: 'Simple' | 'Advanced';
  massKg: number;
  powerW: number; // positive = generates, negative = consumes
  costM: number;
  dataCapMbDay?: number;
  lifetimeBonusYrs?: number;
  reliabilityBonus?: number;
  whyItMatters: Record<Language, string>;
}

export interface InstrumentOption {
  id: string;
  name: Record<Language, string>;
  massKg: number;
  powerW: number; // draw
  costM: number;
  dataMbDay: number;
  scienceVal: number;
  bestForOrbits: string[];
  tier: 'Simple' | 'Advanced';
  whyItMatters: Record<Language, string>;
}

export interface NegotiationDilemma {
  id: string;
  title: Record<Language, string>;
  conflict: Record<Language, string>;
  rolesInvolved: [TeamRoleId, TeamRoleId];
  options: Array<{
    id: string;
    label: Record<Language, string>;
    consequence: Record<Language, string>;
    scienceDelta: number;
    costDeltaM: number;
    massDeltaKg: number;
    coordinationScore: number;
  }>;
}

export interface SavedArchitectRun {
  id: string;
  teamName: string;
  mode: 'solo' | 'team' | 'sandbox';
  scenarioId: string;
  scenarioTitle: string;
  score: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'F';
  success: boolean;
  massKg: number;
  costM: number;
  scienceVal: number;
  lifetimeYrs: number;
  orbitName: string;
  launcherName: string;
  instrumentCount: number;
  timestamp: number;
}

export const TEAM_ROLES: TeamRoleDef[] = [
  {
    id: 'planner',
    title: { ar: 'مخطط المهمة والميزانية', en: 'Mission Planner & Budget' },
    responsibility: {
      ar: 'تحديد المدار، مركبة الإطلاق، سقف الميزانية وعمر المهمة.',
      en: 'Sets Orbit, Launch Vehicle compatibility, Budget cap & Mission Lifetime.',
    },
    colorClass: 'text-amber-300 border-amber-400/35 bg-amber-500/10',
  },
  {
    id: 'architect',
    title: { ar: 'مهندس المركبة والطاقة', en: 'Spacecraft & Power Architect' },
    responsibility: {
      ar: 'اختيار الهيكل، الألواح/الـ RTG، البطاريات وميزان الكتلة والطاقة.',
      en: 'Selects Bus Structure, Power/Battery systems & maintains Mass/Power margins.',
    },
    colorClass: 'text-cyan-300 border-cyan-400/35 bg-cyan-500/10',
  },
  {
    id: 'science',
    title: { ar: 'قائد العلوم والأجهزة', en: 'Science & Payload Lead' },
    responsibility: {
      ar: 'انتقاء الأجهزة العلمية لتحقيق الهدف العلمي دون إغراق الكتلة والطاقة.',
      en: 'Picks Scientific Instruments to beat science targets without overloading mass/power.',
    },
    colorClass: 'text-emerald-300 border-emerald-400/35 bg-emerald-500/10',
  },
  {
    id: 'comms',
    title: { ar: 'مهندس الاتصالات والبيانات', en: 'Comms, Data & Attitude Officer' },
    responsibility: {
      ar: 'ضمان تفوق سعة الإرسال (MB/day) والتحكم بالوضعية على حجم البيانات المولدة.',
      en: 'Ensures Telemetry Downlink (MB/day) & Attitude Precision match instrument data.',
    },
    colorClass: 'text-violet-300 border-violet-400/35 bg-violet-500/10',
  },
];

export const ARCHITECT_SCENARIOS: ArchitectScenario[] = [
  {
    id: 'earth_climate',
    difficulty: 'Beginner',
    title: {
      ar: 'مرصد مناخ الأرض السريع (LEO / SSO)',
      en: 'Earth Climate & Ocean Sentinel (LEO / SSO)',
    },
    objective: {
      ar: 'تصميم قمر رصد مناخي بميزانية محدودة لبث خرائط يومية للغلاف الجوي.',
      en: 'Deliver daily global climate imagery on a tight university/agency budget.',
    },
    brief: {
      ar: 'مهمة مثالية للمبتدئين: مدارات الأرض القريبة توفر طاقة شمسية 100% وسعة إطلاق عالية، لكن يجب موازنة بيانات الكاميرا مع الهوائي.',
      en: 'Great starter mission: Near-Earth orbits provide 100% solar flux and easy payload limits, so focus on Data Downlink vs Budget.',
    },
    criticalResource: {
      ar: 'الموارد الحرجة: الميزانية (≤ 180M$) ومعدل إرسال البيانات.',
      en: 'Critical Constraints: Budget (≤ $180M) & Daily Data Downlink.',
    },
    targetScience: 55,
    maxBudgetM: 180,
    minLifetimeYrs: 3,
    recommendedOrbits: ['leo', 'sso'],
    minDataRateMbps: 120,
  },
  {
    id: 'lunar_ice',
    difficulty: 'Standard',
    title: {
      ar: 'كشاف جليد أقطاب القمر (Lunar Polar Recon)',
      en: 'Lunar Polar Water-Ice Pathfinder',
    },
    objective: {
      ar: 'مسح الفوهات المظلمة دائماً عند القطب الجنوبي للقمر بحثاً عن الجليد المائي.',
      en: 'Map permanently shadowed south-pole craters for buried water-ice reserves.',
    },
    brief: {
      ar: 'يتطلب مدار القمر صاروخاً أقوى من المدار الأرضي (تنخفض الحمولة القصوى) وأجهزة رادار أو مطياف تحت الأحمر.',
      en: 'Lunar transfer shrinks rocket payload capacity. Pair Radar/IR instruments with strong attitude control within budget.',
    },
    criticalResource: {
      ar: 'الموارد الحرجة: الكتلة المتوافقة مع الصاروخ + استقرار الوضعية.',
      en: 'Critical Constraints: Launch Mass Margin + Precision Attitude Control.',
    },
    targetScience: 85,
    maxBudgetM: 280,
    minLifetimeYrs: 4,
    recommendedOrbits: ['lunar_llo'],
    minDataRateMbps: 180,
  },
  {
    id: 'mars_relay',
    difficulty: 'Standard',
    title: {
      ar: 'مسبار الغلاف الجوي والاتصالات المريخي',
      en: 'Mars Aeronomy & Deep-Space Relay Orbiter',
    },
    objective: {
      ar: 'تحليل هروب الغلاف الجوي للمريخ وبث بيانات الروفر إلى محطات DSN.',
      en: 'Study Martian atmospheric loss while relaying rover telemetry across interplanetary space.',
    },
    brief: {
      ar: 'عند المريخ تنخفض الطاقة الشمسية إلى 43% فقط! الألواح الصغيرة قد تفشل — ستحتاج أجنحة شمسية كبيرة أو RTG وهوائي Ka-Band.',
      en: 'Solar flux at Mars drops to 43%! Standard solar panels struggle; size up to High-Gain Solar or RTG + Deep-Space Ka-Band.',
    },
    criticalResource: {
      ar: 'الموارد الحرجة: هامش الطاقة الشمسية (43% شمس) واتصالات الفضاء العميق.',
      en: 'Critical Constraints: Solar Power Drop (43% Flux) & Deep-Space Ka-Band Comms.',
    },
    targetScience: 110,
    maxBudgetM: 390,
    minLifetimeYrs: 5,
    recommendedOrbits: ['mars_tmi'],
    minDataRateMbps: 240,
  },
  {
    id: 'europa_flyby',
    difficulty: 'Advanced',
    title: {
      ar: 'مهمة أعمدة محيط قمر أوروبا الجليدي',
      en: 'Europa Subsurface Plume Explorer',
    },
    objective: {
      ar: 'اختراق حزام الإشعاع حول المشتري وأخذ قياسات لأعمدة المياه المنبعثة.',
      en: 'Survive intense Jovian radiation to sample icy ocean plumes erupting from Europa.',
    },
    brief: {
      ar: 'أصعب تحدٍ هندسي: الشمس هنا لا تعطي سوى 4% طاقة (RTG إجباري عملياً!)، الإشعاع قاسٍ، والحمولة للفضاء السحيق محدودة للغاية.',
      en: 'Peak complexity: Sunlight is just 4% (RTG is essential), radiation wears components quickly, and launcher payload margin shrinks dramatically.',
    },
    criticalResource: {
      ar: 'الموارد الحرجة: نظام RTG + درع إشعاعي (هيكل ثقيل) + صاروخ ثقيل.',
      en: 'Critical Constraints: Nuclear RTG Power, Shielded Bus & Heavy Launcher.',
    },
    targetScience: 135,
    maxBudgetM: 560,
    minLifetimeYrs: 6,
    recommendedOrbits: ['europa_jo'],
    minDataRateMbps: 260,
  },
  {
    id: 'uranus_orbiter',
    difficulty: 'Advanced',
    title: {
      ar: 'مسبار أورانوس القطبي وحلقات الجليد (19.2 AU)',
      en: 'Uranus Polar Flagship & Ring Magnetosphere (19.2 AU)',
    },
    objective: {
      ar: 'تحقيق 145 نقطة علمية في مدار يميل 98° لعمر تشغيلي 7 سنوات مع تأخير 2.6 ساعة.',
      en: 'Reach 145 SCI over a 7-year lifetime across 2.87B km with near-zero (1%) sunlight.',
    },
    brief: {
      ar: 'ميزانيته الأساسية ضيقة ($500M) وتحتاج توسيع ميزانية الوكالة أو موازنة ذكية لـ MMRTG وهوائي Ka-Band وتلسكوب متتبع النجوم.',
      en: 'Tight $500M baseline! Winning Survival or Mission runs expands your Agency Budget to afford RTG + Shielded Vault + Ka-Band.',
    },
    criticalResource: {
      ar: 'الموارد الحرجة: MMRTG النووي (1% شمس) + متتبع النجوم ADCS + سعة Ka-Band.',
      en: 'Critical Constraints: Nuclear RTG (1% Sun), Dual Star Trackers & High-Gain Ka-Band.',
    },
    targetScience: 145,
    maxBudgetM: 500,
    minLifetimeYrs: 7,
    recommendedOrbits: ['uranus_ice'],
    minDataRateMbps: 290,
  },
  {
    id: 'neptune_flagship',
    difficulty: 'Extreme',
    title: {
      ar: 'بعثة نبتون وتريتون الحدية (30 AU — الأقصى)',
      en: 'Neptune & Triton Kuiper Edge Flagship (30 AU)',
    },
    objective: {
      ar: 'أقصى اختبار معماري: 170 نقطة علمية وعمر 8 سنوات عند أبعد كوكب (11% قدرة الصاروخ فقط!).',
      en: 'Apex challenge: Hit 170 SCI and 8-year survival where rockets deliver only 11% of LEO payload!',
    },
    brief: {
      ar: 'تحتاج إلى صاروخ فائق الثقل ومولد RTG ودرع إشعاعي وهوائي Ka-Band + 4 أجهزة متوافقة — اربح مهام البقاء أو استثمر رصيد CR لرفع سقف الميزانية!',
      en: 'Demands Super-Heavy rocket, RTG, Radiation Vault, Ka-Band & Star Trackers—earn mission wins or invest CR to expand Agency Budget above $560M!',
    },
    criticalResource: {
      ar: 'الموارد الحرجة: سقف الميزانية المفتوح + 11% حمولة الصاروخ + طاقة RTG.',
      en: 'Critical Constraints: Expanded Agency Budget, 11% Mass Limit & Precision ADCS.',
    },
    targetScience: 170,
    maxBudgetM: 560,
    minLifetimeYrs: 8,
    recommendedOrbits: ['neptune_kuiper'],
    minDataRateMbps: 320,
  },
  {
    id: 'sandbox_free',
    isSandbox: true,
    difficulty: 'Sandbox',
    title: {
      ar: 'وضع التجربة الحر (Sandbox — بلا قيود ميزانية)',
      en: 'Open Engineering Sandbox (Unconstrained Lab)',
    },
    objective: {
      ar: 'جرّب أي مزيج من المدارات والصواريخ والأجهزة بحرية تامة لاختبار التفاعلات الفيزيائية.',
      en: 'Experiment freely with any combination of orbits, rockets, subsystems, and instruments.',
    },
    brief: {
      ar: 'مثالي للتعليم والمقارنة: الميزانية مفتوحة (999M$) لفحص أثر كل قرار هندسي على الكتلة والطاقة والبيانات.',
      en: 'Budget limits lifted ($999M) so students and teams can test radical trade-offs and compare scores.',
    },
    criticalResource: {
      ar: 'وضع تجريبي: اختبر التوافق الفيزيائي دون قيود مالية.',
      en: 'Sandbox Mode: Explore physics & trade-offs with lifted budget caps.',
    },
    targetScience: 50,
    maxBudgetM: 999,
    minLifetimeYrs: 2,
    recommendedOrbits: [
      'mercury_inner',
      'leo',
      'sso',
      'geo',
      'lunar_llo',
      'mars_tmi',
      'europa_jo',
      'uranus_ice',
      'neptune_kuiper',
    ],
    minDataRateMbps: 80,
  },
];

export const ORBIT_OPTIONS: OrbitOption[] = [
  {
    id: 'leo',
    name: { ar: 'مدار أرضي منخفض (LEO 450 km)', en: 'Low Earth Orbit (LEO 450 km)' },
    altitudeLabel: '450 km',
    deltaVReq: 9.4,
    massPenaltyFactor: 1.0,
    commsLatencyLabel: { ar: '< 0.05 ثانية', en: '< 0.05s Real-Time' },
    solarEfficiency: 1.0,
    radiationWear: 0.2,
    explanation: {
      ar: 'أسهل وأرخص مدار للوصول: حمولة الصاروخ 100%، لكن الكسوف المتكرر يقلل الاستمرارية ويحتاج صيانة مدارية لعمر أطول.',
      en: 'Highest rocket payload (100%) and low comms delay, though atmospheric drag and frequent eclipses limit long lifetimes.',
    },
  },
  {
    id: 'sso',
    name: { ar: 'مدار متزامن مع الشمس (SSO 700 km)', en: 'Sun-Synchronous Orbit (SSO 700 km)' },
    altitudeLabel: '700 km',
    deltaVReq: 9.9,
    massPenaltyFactor: 0.84,
    commsLatencyLabel: { ar: '< 0.05 ثانية', en: '< 0.05s Daily Pass' },
    solarEfficiency: 1.08,
    radiationWear: 0.35,
    explanation: {
      ar: 'يمر فوق كل نقطة على الأرض بنفس زاوية الشمس يومياً — مثالي لمراقبة المناخ مع شحن شمسي شبه مستمر.',
      en: 'Crosses every Earth latitude at constant solar lighting—ideal for Earth imaging & reliable solar charging.',
    },
  },
  {
    id: 'geo',
    name: { ar: 'مدار ثابت جغرافياً (GEO 35,786 km)', en: 'Geostationary Orbit (GEO 35,786 km)' },
    altitudeLabel: '35,786 km',
    deltaVReq: 13.1,
    massPenaltyFactor: 0.44,
    commsLatencyLabel: { ar: '0.24 ثانية مستمر', en: '0.24s Continuous' },
    solarEfficiency: 1.0,
    radiationWear: 0.7,
    explanation: {
      ar: 'تغطية دائمة لنصف الكوكب واتصال مستمر، لكنه يستهلك 56% من قدرة الصاروخ للوصول إلى الارتفاع العالي.',
      en: 'Continuous 24/7 hemispheric coverage, but cuts launch vehicle payload mass down to 44% of LEO capacity.',
    },
  },
  {
    id: 'lunar_llo',
    name: { ar: 'مدار قطبي قمري (Lunar LLO 100 km)', en: 'Lunar Polar Orbit (LLO 100 km)' },
    altitudeLabel: '384,400 km',
    deltaVReq: 14.2,
    massPenaltyFactor: 0.34,
    commsLatencyLabel: { ar: '2.6 ثانية ذهاب وإياب', en: '2.6s Round-Trip' },
    solarEfficiency: 0.98,
    radiationWear: 0.85,
    explanation: {
      ar: 'يمر فوق الأقطاب القمرية لمسح الفوهات الجليدية. يخفض قدرة الحمولة الصاروخية إلى 34% ويتطلب اتصالاً قوياً.',
      en: 'Polar lunar passes inspect shadowed ice craters; limits launcher payload to 34% of LEO capacity.',
    },
  },
  {
    id: 'mars_tmi',
    name: { ar: 'مدار انتقال وعلم المريخ (Mars Orbit)', en: 'Mars Science Transfer Orbit' },
    altitudeLabel: '225M km avg',
    deltaVReq: 15.8,
    massPenaltyFactor: 0.24,
    commsLatencyLabel: { ar: '8–24 دقيقة تأخير', en: '8–24 min One-Way' },
    solarEfficiency: 0.43,
    radiationWear: 1.15,
    explanation: {
      ar: 'ضوء الشمس ينخفض إلى 43%، والتأخير الزمني يجعل التحكم الآني مستحيلاً مما يتطلب حاسوباً واتصالات متقدمة.',
      en: 'Sunlight drops to 43% and huge distance trims rocket payload to 24%—demanding autonomous ADCS & Ka-Band.',
    },
  },
  {
    id: 'europa_jo',
    name: { ar: 'مدار المشتري وأوروبا (Jovian Deep Space)', en: 'Europa / Jovian Deep-Space Orbit' },
    altitudeLabel: '628M km avg',
    deltaVReq: 18.6,
    massPenaltyFactor: 0.16,
    commsLatencyLabel: { ar: '35–52 دقيقة تأخير', en: '35–52 min Delay' },
    solarEfficiency: 0.04,
    radiationWear: 1.9,
    explanation: {
      ar: 'الشمس تساوي 4% فقط هنا! الألواح الشمسية لا تكفي تقريباً، والإشعاع شديد، والصاروخ لا يوصل سوى 16% من حمولته المدارية.',
      en: 'Only 4% solar flux (RTG power critical), heavy radiation aging, and only 16% of LEO rocket mass reaches target.',
    },
  },
  {
    id: 'mercury_inner',
    name: { ar: 'مدار عطارد الداخلي (Mercury 0.39 AU)', en: 'Mercury Polar Orbit (0.39 AU)' },
    altitudeLabel: '91M km avg',
    deltaVReq: 17.4,
    massPenaltyFactor: 0.22,
    commsLatencyLabel: { ar: '5–11 دقيقة تأخير', en: '5–11 min One-Way' },
    solarEfficiency: 2.2,
    radiationWear: 1.75,
    explanation: {
      ar: 'قرب الشمس يضاعف الإشعاع الحراري (+220% طاقة شمسية) ويتطلب درعاً حرارياً قوياً وطاقة كبح ضخمة من الصاروخ.',
      en: 'Extreme solar heating (+220% solar flux) demands thermal shielding and heavy retrograde Δv braking.',
    },
  },
  {
    id: 'uranus_ice',
    name: { ar: 'مدار أورانوس القطبي (Uranus 19.2 AU)', en: 'Uranus Ice-Giant Orbit (19.2 AU)' },
    altitudeLabel: '2.87B km',
    deltaVReq: 20.1,
    massPenaltyFactor: 0.13,
    commsLatencyLabel: { ar: '2.6 ساعة ذهاب فقط', en: '2.6 hr One-Way' },
    solarEfficiency: 0.01,
    radiationWear: 1.45,
    explanation: {
      ar: 'الشمس ضعيفة جداً (1% فعالية) — المولد النووي RTG وهوائي Ka-Band أساسيان لاختراق مدار الميثان المائل 98°.',
      en: 'Near-zero sunlight demands nuclear RTG power and high-gain Ka-Band telemetry across 2.87B km.',
    },
  },
  {
    id: 'neptune_kuiper',
    name: { ar: 'مدار نبتون وتريتون (Neptune 30.07 AU)', en: 'Neptune & Triton Deep Orbit (30 AU)' },
    altitudeLabel: '4.5B km',
    deltaVReq: 21.8,
    massPenaltyFactor: 0.11,
    commsLatencyLabel: { ar: '4.1 ساعات ذهاب فقط', en: '4.1 hr One-Way' },
    solarEfficiency: 0.01,
    radiationWear: 1.6,
    explanation: {
      ar: 'أقصى اختبار هندسي في النظام الشمسي: 11% فقط من حمولة الصاروخ تصل هنا مع حاجة حتمية لـ RTG وهوائي ليزر/Ka-Band.',
      en: 'Outermost planet at 4.5B km: only 11% launcher payload arrives; RTG nuclear power and Ka-Band are mandatory.',
    },
  },
];

export const LAUNCH_VEHICLES: LaunchVehicleOption[] = [
  {
    id: 'vega_light',
    name: { ar: 'صاروخ خفيف (Light SmallSat Launcher)', en: 'Light SmallSat Launcher' },
    costM: 28,
    leoCapacityKg: 1100,
    reliabilityPct: 93,
    tier: 'Simple',
    note: {
      ar: 'اقتصادي للمدارات الأرضية المنخفضة والأقمار الخفيفة، لكنه يعجز عن حمل مسبارات المريخ وأوروبا الثقيلة.',
      en: 'Low-cost small launcher ideal for LEO/SSO satellites; lacks mass capacity for heavy deep-space craft.',
    },
  },
  {
    id: 'atlas_med',
    name: { ar: 'صاروخ متوسط (Medium Workhorse Rocket)', en: 'Medium Orbital Workhorse' },
    costM: 64,
    leoCapacityKg: 3400,
    reliabilityPct: 96,
    tier: 'Simple',
    note: {
      ar: 'توازن ممتاز للمهمات القمرية والعلمية المتوسطة مع موثوقية عالية.',
      en: 'Balanced cost-to-payload workhorse well-suited for Earth GEO & Lunar science orbiters.',
    },
  },
  {
    id: 'heavy_lift',
    name: { ar: 'صاروخ ثقيل (Heavy Interplanetary)', en: 'Heavy Interplanetary Booster' },
    costM: 118,
    leoCapacityKg: 7200,
    reliabilityPct: 97,
    tier: 'Advanced',
    note: {
      ar: 'قدرة دفع عالية لمهمات المريخ والمدارات المحملة بأجهزة علمية متعددة.',
      en: 'High upper-stage throw weight for multi-instrument Mars orbiters and heavy shielded buses.',
    },
  },
  {
    id: 'super_heavy',
    name: { ar: 'صاروخ فائق الثقل (Deep-Space Super-Heavy)', en: 'Super-Heavy Deep-Space Vehicle' },
    costM: 185,
    leoCapacityKg: 14500,
    reliabilityPct: 98,
    tier: 'Advanced',
    note: {
      ar: 'مكلف لكنه الوحيد القادر على إيصال مسبارات ثقيلة مدرعة إلى نظام المشتري وأوروبا.',
      en: 'Expensive flagship launcher capable of throwing radiation-hardened probes all the way to Europa.',
    },
  },
];

export const SUBSYSTEM_OPTIONS: SubsystemOption[] = [
  // BUS STRUCTURES
  {
    id: 'bus_lite',
    category: 'bus',
    name: { ar: 'هيكل مركّب خفيف (Carbon Micro-Bus)', en: 'Lightweight Carbon Micro-Bus' },
    tier: 'Simple',
    massKg: 210,
    powerW: -25,
    costM: 22,
    lifetimeBonusYrs: 3.0,
    reliabilityBonus: 0,
    whyItMatters: {
      ar: 'يوفر الكتلة والمال ليتوافق مع صواريخ صغيرة، لكنه أضعف أمام الإشعاع القاسي.',
      en: 'Saves mass and cost for smaller rockets, but offers less radiation shielding.',
    },
  },
  {
    id: 'bus_std',
    category: 'bus',
    name: { ar: 'هيكل ألمنيوم معياري (Standard Modular Bus)', en: 'Modular Aluminum Science Bus' },
    tier: 'Simple',
    massKg: 420,
    powerW: -45,
    costM: 44,
    lifetimeBonusYrs: 5.5,
    reliabilityBonus: 3,
    whyItMatters: {
      ar: 'توازن متين يدعم المدارات القمرية والمريخية لعمر تشغيلي متوسط.',
      en: 'Proven versatile structure balancing thermal protection, lifetime, and mass.',
    },
  },
  {
    id: 'bus_shield',
    category: 'bus',
    name: { ar: 'هيكل تيتانيوم مدرّع (Radiation-Hardened Vault)', en: 'Radiation-Hardened Titanium Vault' },
    tier: 'Advanced',
    massKg: 820,
    powerW: -65,
    costM: 92,
    lifetimeBonusYrs: 9.0,
    reliabilityBonus: 7,
    whyItMatters: {
      ar: 'أساسي لمواجهة إشعاعات المشتري وإطالة العمر، لكنه يضيف كتلة كبيرة تتطلب صاروخاً أقوى.',
      en: 'Protects avionics in brutal Jovian radiation and boosts lifetime, at steep mass & cost.',
    },
  },

  // POWER SYSTEMS
  {
    id: 'pwr_small_solar',
    category: 'power',
    name: { ar: 'أجنحة شمسية مدمجة + بطارية (Compact Solar)', en: 'Compact Solar Arrays + Li-Ion' },
    tier: 'Simple',
    massKg: 95,
    powerW: 480,
    costM: 18,
    whyItMatters: {
      ar: 'مثالي ورخيص قرب الأرض والقمر، لكنه ينهار في المريخ وأوروبا حيث تضعف الشمس.',
      en: 'Cheap and light near Earth/Moon, but generates sharply less power farther from the Sun.',
    },
  },
  {
    id: 'pwr_mega_solar',
    category: 'power',
    name: { ar: 'مصفوفة شمسية عالية الكسب (High-Efficiency Wings)', en: 'High-Efficiency Deep-Solar Wings' },
    tier: 'Advanced',
    massKg: 240,
    powerW: 1150,
    costM: 46,
    whyItMatters: {
      ar: 'تضاعف جمع الضوء لتصلح حتى مدار المريخ، لكنها تضيف كتلة كبيرة في أوروبا (4% شمس).',
      en: 'Huge wings capture enough sunlight even at Mars, yet still starve at 4% Jovian sunlight.',
    },
  },
  {
    id: 'pwr_rtg',
    category: 'power',
    name: { ar: 'مولد نظائر نووية (MMRTG Nuclear Power)', en: 'Multi-Mission RTG Nuclear Generator' },
    tier: 'Advanced',
    massKg: 310,
    powerW: 720, // constant regardless of solar distance!
    costM: 115,
    lifetimeBonusYrs: 4.0,
    whyItMatters: {
      ar: 'ينتج طاقة ثابتة 24/7 في الظلام التام أو عند المشتري دون اعتماد على الشمس، لكنه مكلف وثقيل.',
      en: 'Delivers constant wattage even in total eclipse or Europa orbit (ignores solar drop!), though costly.',
    },
  },

  // COMMS & DATA LINK
  {
    id: 'comms_sband',
    category: 'comms',
    name: { ar: 'هوائي S-Band قياسي (180 MB/day)', en: 'Standard S-Band Transponder' },
    tier: 'Simple',
    massKg: 35,
    powerW: -55,
    costM: 14,
    dataCapMbDay: 180,
    whyItMatters: {
      ar: 'خفيف ورخيص للأقمار المبتدئة، لكنه يختنق إذا ركّبت عدة أجهزة توليد بيانات ضخمة.',
      en: 'Light & inexpensive, but bottlenecks high-volume science cameras or radar.',
    },
  },
  {
    id: 'comms_xband',
    category: 'comms',
    name: { ar: 'طبق X-Band عالي التوجيه (360 MB/day)', en: 'High-Gain X-Band Dish' },
    tier: 'Simple',
    massKg: 75,
    powerW: -110,
    costM: 32,
    dataCapMbDay: 360,
    whyItMatters: {
      ar: 'يضاعف سعة التنزيل لمحطات DSN الأرضية بسعر متوازن.',
      en: 'Doubles Earth downlink bandwidth for multi-instrument Lunar & Mars science.',
    },
  },
  {
    id: 'comms_kaband',
    category: 'comms',
    name: { ar: 'منظومة Ka-Band + ليزر بصري (720 MB/day)', en: 'Deep-Space Ka-Band / Optical Comms' },
    tier: 'Advanced',
    massKg: 135,
    powerW: -190,
    costM: 68,
    dataCapMbDay: 720,
    whyItMatters: {
      ar: 'تمنع ضياع البيانات الضخمة عبر مسافات الفضاء السحيق مقابل استهلاك طاقة وميزانية أعلى.',
      en: 'Prevents data bottlenecks across deep space at higher power & budget cost.',
    },
  },

  // ATTITUDE & ONBOARD COMPUTER (ADCS)
  {
    id: 'adcs_basic',
    category: 'adcs',
    name: { ar: 'عجلات رد فعل أساسية + معالج بسيط', en: 'Basic Magnetorquers & Avionics' },
    tier: 'Simple',
    massKg: 30,
    powerW: -40,
    costM: 12,
    reliabilityBonus: 0,
    whyItMatters: {
      ar: 'رخيص لمدارات الأرض القريبة، لكن دقته أضعف مع الكاميرات والرادارات الحساسة.',
      en: 'Budget attitude control sufficient for wide sensors, lower pointing accuracy.',
    },
  },
  {
    id: 'adcs_star',
    category: 'adcs',
    name: { ar: 'متتبعات نجوم مزدوجة + حاسوب طيران مكرر', en: 'Dual Star Trackers & Redundant OBC' },
    tier: 'Advanced',
    massKg: 70,
    powerW: -85,
    costM: 38,
    reliabilityBonus: 6,
    lifetimeBonusYrs: 1.5,
    whyItMatters: {
      ar: 'يوفر تصويباً فائق الدقة لأجهزة الرصد والاتصالات بعيدة المدى وحماية من الأعطال البرمجية.',
      en: 'Locks pinpoint aiming for narrow-beam Ka-Band & precision spectroscopy with fault protection.',
    },
  },
];

export const INSTRUMENT_OPTIONS: InstrumentOption[] = [
  {
    id: 'inst_cam',
    name: { ar: 'كاميرا تصوير طيفية واسعة', en: 'Wide-Field Multispectral Imager' },
    massKg: 55,
    powerW: 75,
    costM: 22,
    dataMbDay: 140,
    scienceVal: 32,
    bestForOrbits: ['leo', 'sso', 'lunar_llo', 'mars_tmi', 'mercury_inner', 'uranus_ice'],
    tier: 'Simple',
    whyItMatters: {
      ar: 'عالية الجدوى العلمية وتولّد صوراً ضخمة تتطلب سعة اتصال كافية.',
      en: 'High science return per dollar, generating steady imaging data volume.',
    },
  },
  {
    id: 'inst_ir',
    name: { ar: 'مطياف الأشعة تحت الحمراء الحراري', en: 'Thermal Infrared Spectrometer' },
    massKg: 80,
    powerW: 110,
    costM: 36,
    dataMbDay: 95,
    scienceVal: 42,
    bestForOrbits: ['sso', 'lunar_llo', 'mars_tmi', 'europa_jo', 'mercury_inner', 'uranus_ice', 'neptune_kuiper'],
    tier: 'Simple',
    whyItMatters: {
      ar: 'يكشف التركيب الكيميائي والماء وبصمات الحرارة بكتلة وطاقة معتدلة.',
      en: 'Maps mineral composition, water signatures, and thermal plumes cleanly.',
    },
  },
  {
    id: 'inst_radar',
    name: { ar: 'رادار اختراق الجليد والسطح (SAR)', en: 'Ice-Penetrating Subsurface Radar' },
    massKg: 145,
    powerW: 210,
    costM: 58,
    dataMbDay: 220,
    scienceVal: 55,
    bestForOrbits: ['leo', 'lunar_llo', 'europa_jo', 'uranus_ice', 'neptune_kuiper'],
    tier: 'Advanced',
    whyItMatters: {
      ar: 'يعطي أعلى قيمة علمية لاكتشاف الجليد تحت السطح، لكنه يلتهم الطاقة والبيانات والكتلة!',
      en: 'Massive science score for ice/subsurface missions, but demands heavy power & high downlink.',
    },
  },
  {
    id: 'inst_mag',
    name: { ar: 'مقياس مغناطيسية وبلازما فضائية', en: 'Fluxgate Magnetometer & Plasma Probe' },
    massKg: 28,
    powerW: 35,
    costM: 15,
    dataMbDay: 45,
    scienceVal: 26,
    bestForOrbits: ['geo', 'mars_tmi', 'europa_jo', 'mercury_inner', 'uranus_ice', 'neptune_kuiper'],
    tier: 'Simple',
    whyItMatters: {
      ar: 'خفيف وموفر جداً للطاقة — مثالي لرفع العلم عندما تكون الميزانية والكتلة ضيقة.',
      en: 'Ultra-lightweight and low power—great science multiplier when mass margins are tight.',
    },
  },
  {
    id: 'inst_laser',
    name: { ar: 'ليزر قياس التضاريس الدقيق (LIDAR)', en: 'Precision Topographic Laser Altimeter' },
    massKg: 105,
    powerW: 155,
    costM: 48,
    dataMbDay: 130,
    scienceVal: 44,
    bestForOrbits: ['lunar_llo', 'mars_tmi', 'europa_jo', 'mercury_inner', 'neptune_kuiper'],
    tier: 'Advanced',
    whyItMatters: {
      ar: 'يرسم خرائط ارتفاعات ثلاثية الأبعاد لمناطق الهبوط المستقبلية ويتطلب دقة ADCS عالية.',
      en: 'Produces 3D landing terrain maps; pairs strongly with Star Tracker attitude precision.',
    },
  },
];

export const TEAM_NEGOTIATION_DILEMMAS: NegotiationDilemma[] = [
  {
    id: 'neg_mass_budget',
    title: {
      ar: 'مفاوضة الفريق 1: تعارض الرادار العلمي مع حد الحمولة والميزانية',
      en: 'Team Trade-Off 1: High-Science Radar vs Launch Mass Cap',
    },
    conflict: {
      ar: 'قائد العلوم يريد إضافة رادار اختراق الجليد (+145 كجم، +58M$)، بينما يحذّر مخطط المهمة من أن المركبة قد تتجاوز حدود الميزانية أو الصاروخ.',
      en: 'Science Lead pushes for an extra Ice Radar (+145 kg, +$58M), while Mission Planner warns it blows budget or rocket capacity.',
    },
    rolesInvolved: ['science', 'planner'],
    options: [
      {
        id: 'opt_comp_mag',
        label: {
          ar: 'تسوية مشتركة: استبدال الرادار الثقيل بمطياف IR + مقياس مغناطيسية خفيف',
          en: 'Team Compromise: Pair IR Spectrometer + Lightweight Magnetometer instead',
        },
        consequence: {
          ar: 'يحافظ على هدف العلم بكتلة أقل بـ 37 كجم وتكلفة أقل مع بقاء الصاروخ متوافقاً.',
          en: 'Achieves solid science return with far lower mass & cost so the rocket stays compatible.',
        },
        scienceDelta: 12,
        costDeltaM: -10,
        massDeltaKg: -35,
        coordinationScore: 95,
      },
      {
        id: 'opt_force_heavy',
        label: {
          ar: 'الرضوخ للعلوم فقط: الإبقاء على الرادار وتقليص الدرع والبطارية',
          en: 'Favor Science Only: Keep Radar & Strip Structural Protection',
        },
        consequence: {
          ar: 'يزيد النقاط العلمية مبدئياً لكنه يرفع خطر فشل الأنظمة أثناء الطيران!',
          en: 'Maxes instrument score on paper while eroding spacecraft reliability margins.',
        },
        scienceDelta: 22,
        costDeltaM: 18,
        massDeltaKg: 40,
        coordinationScore: 55,
      },
    ],
  },
  {
    id: 'neg_comms_power',
    title: {
      ar: 'مفاوضة الفريق 2: اختناق البيانات مقابل استهلاك الطاقة',
      en: 'Team Trade-Off 2: Telemetry Data Bottleneck vs Power Bus',
    },
    conflict: {
      ar: 'مهندس الاتصالات يطلب الترقية إلى هوائي Ka-Band (-190W) لمنع فقدان صور الأجهزة، ومهندس الطاقة يخشى عجز البطاريات أثناء الكسوف.',
      en: 'Comms Officer demands a -190W Ka-Band Dish to prevent science data loss, while Power Architect fears eclipse brownouts.',
    },
    rolesInvolved: ['comms', 'architect'],
    options: [
      {
        id: 'opt_schedule_duty',
        label: {
          ar: 'تعاون الهندستين: جدولة البث بنظام Duty-Cycle (تشغيل متناوب مع التخزين)',
          en: 'Joint Engineering: Stagger Science Scanning & Downlink Duty-Cycles',
        },
        consequence: {
          ar: 'الأجهزة والرادار يعملان بالتناوب مع الإرسال — توفير 25% طاقة دون فقدان بيانات!',
          en: 'Alternates peak instrument capture and Ka-Band downlink—saving 25% power with zero data loss!',
        },
        scienceDelta: 10,
        costDeltaM: 0,
        massDeltaKg: 0,
        coordinationScore: 98,
      },
      {
        id: 'opt_ignore_comms',
        label: {
          ar: 'الابقاء على هوائي ضعيف والتخلي عن 40% من البيانات العلمية',
          en: 'Keep Low-Power Antenna & Discard 40% of Captured Science Data',
        },
        consequence: {
          ar: 'الطاقة آمنة تماماً، لكن جزءاً كبيراً من العلم يضيع في المدار قبل الوصول للأرض.',
          en: 'Power stays safe, yet massive science value evaporates unsent in orbit.',
        },
        scienceDelta: -18,
        costDeltaM: -8,
        massDeltaKg: -20,
        coordinationScore: 60,
      },
    ],
  },
];

export const BASELINE_LEADERBOARD: SavedArchitectRun[] = [
  {
    id: 'ref_nasa_1',
    teamName: 'JPL Horizon Alpha (Ref)',
    mode: 'team',
    scenarioId: 'lunar_ice',
    scenarioTitle: 'Lunar Polar Water-Ice Pathfinder',
    score: 940,
    grade: 'S',
    success: true,
    massKg: 760,
    costM: 256,
    scienceVal: 97,
    lifetimeYrs: 6.5,
    orbitName: 'Lunar Polar (LLO)',
    launcherName: 'Medium Orbital Workhorse',
    instrumentCount: 3,
    timestamp: 1700000000000,
  },
  {
    id: 'ref_nasa_2',
    teamName: 'CSA Deep-Space Vanguard (Ref)',
    mode: 'solo',
    scenarioId: 'mars_relay',
    scenarioTitle: 'Mars Aeronomy & Deep-Space Relay',
    score: 865,
    grade: 'A',
    success: true,
    massKg: 1120,
    costM: 368,
    scienceVal: 121,
    lifetimeYrs: 7.0,
    orbitName: 'Mars Science Transfer',
    launcherName: 'Heavy Interplanetary',
    instrumentCount: 3,
    timestamp: 1700000100000,
  },
];

export interface NasaSegmentDef {
  id: 'launch' | 'space' | 'ground' | 'user';
  num: string;
  title: Record<Language, string>;
  focus: Record<Language, string>;
}

export const NASA_MISSION_SEGMENTS: NasaSegmentDef[] = [
  {
    id: 'launch',
    num: '01',
    title: { ar: 'قطاع الإطلاق', en: 'Launch Segment' },
    focus: { ar: 'صاروخ، Δv وحد الكتلة', en: 'Rocket, Δv & Mass Margin' },
  },
  {
    id: 'space',
    num: '02',
    title: { ar: 'قطاع الفضاء', en: 'Space Segment' },
    focus: { ar: 'الهيكل، الطاقة، والأجهزة', en: 'Bus, Power, ADCS & Payload' },
  },
  {
    id: 'ground',
    num: '03',
    title: { ar: 'القطاع الأرضي', en: 'Ground Segment' },
    focus: { ar: 'محطات DSN وسعة البث', en: 'DSN Downlink & Latency' },
  },
  {
    id: 'user',
    num: '04',
    title: { ar: 'قطاع المستخدم والعلم', en: 'User & Science Segment' },
    focus: { ar: 'العائد العلمي والتشغيل 3D', en: 'Science Yield & 3D Ops' },
  },
];

export function mapOrbitToPlanetId(orbitId: string): PlanetId {
  if (orbitId === 'mercury_inner') return 'mercury';
  if (orbitId === 'lunar_llo') return 'luna';
  if (orbitId === 'mars_tmi') return 'mars';
  if (orbitId === 'europa_jo') return 'aetheris';
  if (orbitId === 'uranus_ice') return 'uranus';
  if (orbitId === 'neptune_kuiper') return 'neptune';
  return 'aurora';
}

export interface RoleKpiEvaluation {
  roleId: TeamRoleId;
  pass: boolean;
  headline: Record<Language, string>;
  detail: Record<Language, string>;
}

export function evaluateRoleKpis(params: {
  massOk: boolean;
  totalMassKg: number;
  maxLauncherPayloadAtOrbitKg: number;
  powerOk: boolean;
  netPowerW: number;
  budgetOk: boolean;
  totalCostM: number;
  maxBudgetM: number;
  commsOk: boolean;
  dataGenMbDay: number;
  commsCapMbDay: number;
  scienceOk: boolean;
  effectiveScience: number;
  targetScience: number;
  lifetimeOk: boolean;
  lifetimeYrs: number;
  minLifetimeYrs: number;
  orbitMatchesObjective: boolean;
  isSandbox: boolean;
}): RoleKpiEvaluation[] {
  const plannerPass = params.budgetOk && params.lifetimeOk && params.massOk;
  const architectPass = params.massOk && params.powerOk;
  const sciencePass = params.scienceOk && params.orbitMatchesObjective;
  const commsPass = params.commsOk;

  return [
    {
      roleId: 'planner',
      pass: plannerPass,
      headline: {
        ar: `${params.isSandbox ? 'حر' : `$${params.totalCostM}/${params.maxBudgetM}M`} · ${params.lifetimeYrs}y`,
        en: `${params.isSandbox ? 'SANDBOX' : `$${params.totalCostM}/$${params.maxBudgetM}M`} · ${params.lifetimeYrs} yrs`,
      },
      detail: {
        ar: plannerPass
          ? 'الميزانية، الكتلة الصاروخية والعمر المخطط ضمن الحدود.'
          : 'تعارض: تجاوزت الميزانية أو قَصُر العمر التشغيلي عن المطلوب.',
        en: plannerPass
          ? 'Budget cap, launcher fit & minimum mission lifetime met.'
          : 'Conflict: Budget overrun, rocket overload, or lifetime below target.',
      },
    },
    {
      roleId: 'architect',
      pass: architectPass,
      headline: {
        ar: `${params.totalMassKg}/${params.maxLauncherPayloadAtOrbitKg}kg · ${params.netPowerW >= 0 ? `+${params.netPowerW}` : params.netPowerW}W`,
        en: `${params.totalMassKg}/${params.maxLauncherPayloadAtOrbitKg} kg · ${params.netPowerW >= 0 ? `+${params.netPowerW}` : params.netPowerW} W`,
      },
      detail: {
        ar: architectPass
          ? 'ميزان الكتلة والطاقة مستقر مع هامش أمان.'
          : !params.massOk
            ? 'تحذير: زيادة الأجهزة/الهيكل كسرت حد الصاروخ عند هذا المدار.'
            : 'تحذير: عجز طاقة — ضوء الشمس لا يكفي لهذه الأجهزة.',
        en: architectPass
          ? 'Spacecraft mass fits launch fairing with positive power margin.'
          : !params.massOk
            ? 'Blocked: Combined bus + instruments exceed rocket orbit capacity.'
            : 'Blocked: Power deficit — upgrade arrays or switch to nuclear RTG.',
      },
    },
    {
      roleId: 'science',
      pass: sciencePass,
      headline: {
        ar: `${params.effectiveScience}/${params.targetScience} علم`,
        en: `${params.effectiveScience}/${params.targetScience} SCI`,
      },
      detail: {
        ar: sciencePass
          ? 'الأجهزة تحقق الهدف العلمي ومتوافقة مع هندسة المدار.'
          : !params.orbitMatchesObjective
            ? 'اختر المدار الموصى به لهذا السيناريو لتحقيق الرصد المطلوب.'
            : 'العائد العلمي غير كافٍ — أضف جهازاً متوافقاً أو أزل اختناق البيانات.',
        en: sciencePass
          ? 'Payload instruments beat science goal on target orbit.'
          : !params.orbitMatchesObjective
            ? 'Selected orbit misses primary scientific target geometry.'
            : 'Science below target — add orbit-matched sensor or fix downlink.',
      },
    },
    {
      roleId: 'comms',
      pass: commsPass,
      headline: {
        ar: `${params.dataGenMbDay}/${params.commsCapMbDay} MB/d`,
        en: `${params.dataGenMbDay}/${params.commsCapMbDay} MB/d`,
      },
      detail: {
        ar: commsPass
          ? 'هوائي DSN يستوعب جميع حزم البيانات العلمية بلا فقد.'
          : 'اختناق بيانات: الأجهزة تولّد بيانات أسرع من قدرة الهوائي!',
        en: commsPass
          ? 'DSN downlink bandwidth clears all daily science data.'
          : 'Data bottleneck: Upgrade X-Band/Ka-Band or trim high-data sensors.',
      },
    },
  ];
}

export interface AlternateArchitecturePreset {
  id: 'lean_pathfinder' | 'heavy_flagship';
  label: Record<Language, string>;
  strategyNote: Record<Language, string>;
  scenarioId: string;
  orbitId: string;
  launcherId: string;
  busId: string;
  powerId: string;
  commsId: string;
  adcsId: string;
  instruments: string[];
}

export const ALTERNATE_VALID_ARCHITECTURES: AlternateArchitecturePreset[] = [
  {
    id: 'lean_pathfinder',
    label: {
      ar: 'الحل A: مسبار رشيق اقتصادي (Lean Pathfinder)',
      en: 'Solution A: Lean SmallSat Pathfinder',
    },
    strategyNote: {
      ar: 'كتلة منخفضة (500 كجم)، صاروخ متوسط اقتصادي، ومطياف + مغناطيسية لتقليل استهلاك الطاقة والتكلفة مع تحقيق كامل الهدف القمري.',
      en: 'Low mass & budget: Compact bus + X-Band + IR Spectrometer & Magnetometer fit cleanly inside cost/mass caps.',
    },
    scenarioId: 'lunar_ice',
    orbitId: 'lunar_llo',
    launcherId: 'atlas_med',
    busId: 'bus_std',
    powerId: 'pwr_small_solar',
    commsId: 'comms_xband',
    adcsId: 'adcs_star',
    instruments: ['inst_ir', 'inst_mag', 'inst_cam'],
  },
  {
    id: 'heavy_flagship',
    label: {
      ar: 'الحل B: سفينة علمية ثقيلة (High-Science Flagship)',
      en: 'Solution B: High-Science Radar Flagship',
    },
    strategyNote: {
      ar: 'تكلفة وكتلة أعلى مع صاروخ ثقيل وأجنحة شمسية كبيرة وهوائي Ka-Band لتشغيل رادار اختراق الجليد والليزر بأقصى عائد علمي.',
      en: 'Max science return: Heavy booster + High-Gain Solar + Ka-Band powers Ice Radar & LIDAR simultaneously.',
    },
    scenarioId: 'lunar_ice',
    orbitId: 'lunar_llo',
    launcherId: 'heavy_lift',
    busId: 'bus_std',
    powerId: 'pwr_mega_solar',
    commsId: 'comms_kaband',
    adcsId: 'adcs_star',
    instruments: ['inst_radar', 'inst_ir', 'inst_laser'],
  },
];

