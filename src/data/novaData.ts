import type {
  CrewMember,
  Language,
  OpticSystemId,
  PersonnelEffects,
  PlanetData,
  PlanetId,
  PowerAllocation,
  ScienceObjectiveId,
  ShipConfig,
  ShipLivery,
  ShipMetrics,
  ShipPartOption,
  ShuttleRoomId,
  ShuttleSpecialist,
  WavelengthId,
} from '../types/game';

export const SHIP_PARTS: ShipPartOption[] = [
  {
    id: 'eng_ion',
    category: 'engine',
    name: { ar: 'محرك أيوني قياسي MK-I', en: 'Ion Thruster MK-I' },
    desc: { ar: 'دفع اقتصادي وموثوق للمدار القريب.', en: 'Balanced low-mass ion propulsion.' },
    cost: 40,
    mass: 620,
    powerDelta: -12,
    deltaV: 3400,
    reliabilityBonus: 4,
    tier: 1,
  },
  {
    id: 'eng_vasimir',
    category: 'engine',
    name: { ar: 'دفع بلازما VASIMR', en: 'VASIMR Plasma Drive' },
    desc: { ar: 'تسارع عالٍ لرحلات الكواكب العميقة.', en: 'High-thrust magnetoplasma interplanetary drive.' },
    cost: 85,
    mass: 840,
    powerDelta: -22,
    deltaV: 5600,
    reliabilityBonus: 7,
    tier: 2,
  },
  {
    id: 'eng_fusion',
    category: 'engine',
    name: { ar: 'مفاعل اندماج نوفا X9', en: 'NOVA Fusion Core X9' },
    desc: { ar: 'سرعة قصوى واخترق العواصف الأيونية بثبات.', en: 'Top-tier fusion impulse engineered for deep storms.' },
    cost: 145,
    mass: 1050,
    powerDelta: -30,
    deltaV: 8400,
    reliabilityBonus: 12,
    tier: 3,
  },
  {
    id: 'eng_antimatter',
    category: 'engine',
    name: { ar: 'محرك ضغط المادة المضادة Mk-IV', en: 'Antimatter Pinch Drive Mk-IV' },
    desc: { ar: 'دفع تجريبي للوصول إلى أورانوس ونبتون في نصف الزمن.', en: 'Experimental Tier-4 antimatter nozzle built for outer ice giants.' },
    cost: 260,
    mass: 1160,
    powerDelta: -42,
    deltaV: 12600,
    reliabilityBonus: 16,
    tier: 4,
  },
  {
    id: 'sol_wings',
    category: 'solar',
    name: { ar: 'أجنحة شمسية مزدوجة', en: 'Dual Solar Wings' },
    desc: { ar: 'ألواح خفيفة لتوليد طاقة مستقرة.', en: 'Lightweight photovoltaic arrays.' },
    cost: 30,
    mass: 240,
    powerDelta: 38,
    deltaV: 0,
    reliabilityBonus: 4,
    tier: 1,
  },
  {
    id: 'sol_rtg',
    category: 'solar',
    name: { ar: 'مولد نظائر نووية RTG', en: 'Tri-Core RTG Reactor' },
    desc: { ar: 'طاقة متواصلة حتى في القطاع المظلم.', en: 'Uninterrupted power deep beyond solar orbit.' },
    cost: 75,
    mass: 410,
    powerDelta: 68,
    deltaV: 0,
    reliabilityBonus: 9,
    tier: 2,
  },
  {
    id: 'sol_quantum',
    category: 'solar',
    name: { ar: 'مكثف فراغي كمومي', en: 'Quantum Zero-Point Array' },
    desc: { ar: 'توليد طاقة فائق لدعم الدروع والمدافع.', en: 'Abundant output supporting heavy shields and plasma.' },
    cost: 125,
    mass: 490,
    powerDelta: 105,
    deltaV: 0,
    reliabilityBonus: 12,
    tier: 3,
  },
  {
    id: 'sol_dyson',
    category: 'solar',
    name: { ar: 'مفاعل دايسون المجهري IV', en: 'Micro-Dyson Core Matrix IV' },
    desc: { ar: 'توليد +165W مستمر يشغّل أقوى الدروع وأجهزة الكم.', en: 'Tier-4 stellar lattice outputting +165W even at 30 AU.' },
    cost: 220,
    mass: 530,
    powerDelta: 165,
    deltaV: 0,
    reliabilityBonus: 16,
    tier: 4,
  },
  {
    id: 'hull_ti',
    category: 'hull',
    name: { ar: 'هيكل تيتانيوم خفيف', en: 'Titanium Alloy Frame' },
    desc: { ar: 'حماية قياسية وخفة في المناورة.', en: 'Standard orbital titanium-carbon chassis.' },
    cost: 35,
    mass: 750,
    powerDelta: -4,
    deltaV: 0,
    reliabilityBonus: 5,
    tier: 1,
  },
  {
    id: 'hull_aegis',
    category: 'hull',
    name: { ar: 'درع إيجيس الحراري', en: 'Aegis Ablative Armor' },
    desc: { ar: 'يقلل ضرر التوهجات الشمسية والكويكبات.', en: 'Reinforced shielding against flares and debris.' },
    cost: 80,
    mass: 980,
    powerDelta: -10,
    deltaV: 0,
    reliabilityBonus: 11,
    tier: 2,
  },
  {
    id: 'hull_graphene',
    category: 'hull',
    name: { ar: 'درع غرافين مغناطيسي', en: 'Magneto-Graphene Bastion' },
    desc: { ar: 'أقصى مقاومة للعواصف الأيونية والثقب الأسود.', en: 'Peak deflector matrix for ion storms and singularities.' },
    cost: 130,
    mass: 1120,
    powerDelta: -14,
    deltaV: 0,
    reliabilityBonus: 16,
    tier: 3,
  },
  {
    id: 'hull_neutronium',
    category: 'hull',
    name: { ar: 'درع طور النيوترونيوم IV', en: 'Neutronium Phase Armor IV' },
    desc: { ar: 'يصد إشعاع عطارد وعواصف نبتون الخارقة بمتانة قصوى.', en: 'Experimental Tier-4 thermal/radiation shell engineered for extreme worlds.' },
    cost: 240,
    mass: 1240,
    powerDelta: -18,
    deltaV: 0,
    reliabilityBonus: 20,
    tier: 4,
  },
  {
    id: 'sen_lidar',
    category: 'sensor',
    name: { ar: 'رادار ليدار + مدفع تعدين I', en: 'LiDAR + Mining Pulse I' },
    desc: { ar: 'مسح أساسي للكواكب وتفتيت الصخور.', en: 'Basic surface LiDAR and asteroid mining beam.' },
    cost: 25,
    mass: 160,
    powerDelta: -6,
    deltaV: 0,
    reliabilityBonus: 3,
    tier: 1,
  },
  {
    id: 'sen_spectro',
    category: 'sensor',
    name: { ar: 'مطياف عميق + بلازما II', en: 'Deep Spectro + Plasma II' },
    desc: { ar: 'تحليل أسرع ومعدل إطلاق مضاعف.', en: 'Rapid mineral spectroscopy and twin plasma bolts.' },
    cost: 65,
    mass: 230,
    powerDelta: -11,
    deltaV: 0,
    reliabilityBonus: 6,
    tier: 2,
  },
  {
    id: 'sen_tachyon',
    category: 'sensor',
    name: { ar: 'مسبار تاكيون + مدفع فائق', en: 'Tachyon Array + Overdrive' },
    desc: { ar: 'رصد إشارة 2089 وأقوى تسليح تعديني.', en: '2089 signal decoder and rapid-fire plasma overdrive.' },
    cost: 110,
    mass: 280,
    powerDelta: -16,
    deltaV: 0,
    reliabilityBonus: 9,
    tier: 3,
  },
  {
    id: 'sen_quantum',
    category: 'sensor',
    name: { ar: 'ماسح غرافيتون كمي + نبض IV', en: 'Quantum Graviton Scanner IV' },
    desc: { ar: 'دقة توجيه شبه مثالية ومدفع بلازما رباعي السبطانة.', en: 'Pinpoint deep-space graviton telemetry and quad plasma array.' },
    cost: 195,
    mass: 310,
    powerDelta: -22,
    deltaV: 0,
    reliabilityBonus: 13,
    tier: 4,
  },
  {
    id: 'com_uhf',
    category: 'comms',
    name: { ar: 'هوائي اتصال قياسي', en: 'Standard S-Band Dish' },
    desc: { ar: 'نقل موثوق داخل مدار القمر والمريخ.', en: 'Reliable telemetry across inner orbits.' },
    cost: 20,
    mass: 110,
    powerDelta: -5,
    deltaV: 0,
    reliabilityBonus: 3,
    tier: 1,
  },
  {
    id: 'com_laser',
    category: 'comms',
    name: { ar: 'رابط ليزر بصري DSN', en: 'Optical Laser DSN Link' },
    desc: { ar: 'يبث البيانات العلمية بسرعة مضاعفة.', en: 'High-bandwidth deep space laser telemetry.' },
    cost: 60,
    mass: 150,
    powerDelta: -9,
    deltaV: 0,
    reliabilityBonus: 7,
    tier: 2,
  },
  {
    id: 'com_ka_array',
    category: 'comms',
    name: { ar: 'مصفوفة Ka-Band عميقة III', en: 'Deep-Space Ka-Band Array III' },
    desc: { ar: 'اختراق تشويش المشتري وأورانوس بثبات كامل.', en: 'Weather-resistant high-gain phased array for outer gas giants.' },
    cost: 115,
    mass: 165,
    powerDelta: -12,
    deltaV: 0,
    reliabilityBonus: 10,
    tier: 3,
  },
  {
    id: 'com_subspace',
    category: 'comms',
    name: { ar: 'مرحل تشابك تحت-فضائي IV', en: 'Subspace Entanglement Relay IV' },
    desc: { ar: 'يخفض تأخير 30 AU عند نبتون ويضاعف البث العلمي.', en: 'Tier-4 zero-jitter relay built for 30 AU Kuiper frontier telemetry.' },
    cost: 175,
    mass: 185,
    powerDelta: -15,
    deltaV: 0,
    reliabilityBonus: 13,
    tier: 4,
  },
];

export const SHIP_LIVERIES: ShipLivery[] = [
  {
    id: 'vanguard_cobalt',
    name: { ar: 'طليعة نوفا الكوبالت', en: 'NOVA Cobalt' },
    hullHex: '#e2e8f0',
    accentHex: '#06b6d4',
    thrusterHex: '#38bdf8',
    cost: 0,
  },
  {
    id: 'solar_gold',
    name: { ar: 'الريادة الذهبية', en: 'Solar Sovereign' },
    hullHex: '#f8fafc',
    accentHex: '#f59e0b',
    thrusterHex: '#fbbf24',
    cost: 0,
  },
  {
    id: 'crimson_phoenix',
    name: { ar: 'العنقاء القرمزية', en: 'Crimson Phoenix' },
    hullHex: '#1e293b',
    accentHex: '#ef4444',
    thrusterHex: '#fb7185',
    cost: 0,
  },
  {
    id: 'obsidian_stealth',
    name: { ar: 'الشبح الزمردي', en: 'Emerald Stealth' },
    hullHex: '#0f172a',
    accentHex: '#10b981',
    thrusterHex: '#34d399',
    cost: 0,
  },
];

export function computeShipMetrics(
  config: ShipConfig,
  powerAlloc: PowerAllocation = { engines: 34, shields: 33, sensors: 33 }
): ShipMetrics {
  const parts = [
    SHIP_PARTS.find((p) => p.id === config.engineId),
    SHIP_PARTS.find((p) => p.id === config.solarId),
    SHIP_PARTS.find((p) => p.id === config.hullId),
    SHIP_PARTS.find((p) => p.id === config.sensorId),
    SHIP_PARTS.find((p) => p.id === config.commsId),
  ].filter(Boolean) as ShipPartOption[];

  const mass = parts.reduce((acc, p) => acc + p.mass, 0);
  const totalCost = parts.reduce((acc, p) => acc + p.cost, 0);
  const powerGen = parts.filter((p) => p.powerDelta > 0).reduce((acc, p) => acc + p.powerDelta, 0);
  const powerUse = parts
    .filter((p) => p.powerDelta < 0)
    .reduce((acc, p) => acc + Math.abs(p.powerDelta), 0);
  const netPower = powerGen - powerUse;

  const engine = parts.find((p) => p.category === 'engine');
  const hull = parts.find((p) => p.category === 'hull');
  const sensor = parts.find((p) => p.category === 'sensor');

  const engMult = 0.85 + (powerAlloc.engines / 100) * 0.45;
  const shdMult = 0.82 + (powerAlloc.shields / 100) * 0.54;
  const senDelta = Math.round((powerAlloc.sensors - 33) * 0.22);

  const massPenalty = Math.max(0.76, 1 - (mass - 1800) / 8000);
  const deltaV = Math.round((engine?.deltaV || 3400) * massPenalty * engMult);
  const reliability = Math.min(
    99,
    62 + parts.reduce((acc, p) => acc + p.reliabilityBonus, 0) + (netPower >= 0 ? 5 : -12)
  );

  const engineLevel = engine?.tier ?? 1;
  const shieldLevel = hull?.tier ?? 1;
  const cannonLevel = sensor?.tier ?? 1;

  const mdlRiskScore = Math.max(5, Math.min(85, 102 - reliability + (netPower < 0 ? 18 : 0)));
  const thermalMargin = Math.min(99, 62 + shieldLevel * 9 + Math.round((powerAlloc.shields - 33) * 0.15));
  const attitudePrecision = Math.max(
    65,
    Math.min(99, 76 + cannonLevel * 5 + (engineLevel > 1 ? 4 : 0) + senDelta)
  );

  const baseShield = 100 + (shieldLevel - 1) * 42;
  const baseSpeed = 68 + (engineLevel - 1) * 18;

  return {
    mass,
    totalCost,
    powerGen,
    powerUse,
    netPower,
    deltaV,
    reliability,
    engineLevel,
    shieldLevel,
    cannonLevel,
    maxShield: Math.round(baseShield * shdMult),
    maxSpeed: Math.round(baseSpeed * engMult),
    mdlRiskScore,
    thermalMargin,
    attitudePrecision,
  };
}

// NASA CML (Concept Maturity Levels 1-4) & Mission Design Lab Framework
export const CML_LEVELS = [
  {
    level: 1,
    mdlPhase: { ar: 'CML 1: ساعات المكتب (Office Hours)', en: 'CML 1: Office Hours & Concept' },
    desc: {
      ar: 'تحديد الحاجة العلمية الأولية ومفهوم المهمة (ConOps).',
      en: 'Initial scientific question, mission concept & ConOps brainstorming.',
    },
  },
  {
    level: 2,
    mdlPhase: { ar: 'CML 2: دراسة الجدوى والمخاطر', en: 'CML 2: Concept Development & Risk' },
    desc: {
      ar: 'تقييم الجدوى الهندسية، ميزانية الطاقة، والتوازن المبدئي للكتلة.',
      en: 'Feasibility, power balance & initial spacecraft risk evaluation.',
    },
  },
  {
    level: 3,
    mdlPhase: { ar: 'CML 3: المفاضلات الهندسية (Trade Studies)', en: 'CML 3: Architecture Trade Studies' },
    desc: {
      ar: 'مقارنة المحركات، الأطوال الموجية للتلسكوب، ومسارات GMAT بين الكواكب.',
      en: 'Comparing propulsion, telescope wavelengths & GMAT interplanetary arcs.',
    },
  },
  {
    level: 4,
    mdlPhase: { ar: 'CML 4: التصميم التفصيلي (Point Design)', en: 'CML 4: Point Design & Flight Ops' },
    desc: {
      ar: 'جاهزية كاملة للإطلاق عبر القطاعات الأربعة: الإطلاق، الفضاء، المحطات الأرضية، والمستخدمون.',
      en: 'Full 4-segment verification: Launch, Space, Ground DSN & Science Users.',
    },
  },
];

// NASA Telescope Learning Game Catalog
export const TELESCOPE_OBJECTIVES: Array<{
  id: ScienceObjectiveId;
  name: Record<Language, string>;
  idealWavelength: WavelengthId;
  idealOptic: OpticSystemId;
  nasaAnalog: string;
  fact: Record<Language, string>;
}> = [
  {
    id: 'deep_galaxies',
    name: { ar: 'المجرات الأولى وتشكل النجوم', en: 'Primordial Galaxies & Star Formation' },
    idealWavelength: 'infrared',
    idealOptic: 'segmented_ir',
    nasaAnalog: 'James Webb Space Telescope (JWST)',
    fact: {
      ar: 'ينزاح ضوء المجرات البعيدة نحو الأشعة تحت الحمراء، لذا يتطلب مرايا سداسية مبردة بالدرع الشمسي مثل تلسكوب جيمس ويب.',
      en: 'Distant redshifted galaxies emit in Infrared, matching segmented cryogenic mirrors like NASA JWST.',
    },
  },
  {
    id: 'exoplanet_biosignatures',
    name: { ar: 'البحث عن بصمات الحياة بالكواكب', en: 'Exoplanet Atmospheres & Biosignatures' },
    idealWavelength: 'ultraviolet',
    idealOptic: 'coronagraph_uv',
    nasaAnalog: 'Habitable Worlds / Hubble UV-Optical',
    fact: {
      ar: 'الأشعة فوق البنفسجية والبصرية مع الكوروناغراف تحجب وهج النجم الأم لكشف الغلاف الجوي للكواكب.',
      en: 'UV/Optical spectroscopy with a starlight coronagraph reveals planetary atmospheres cleanly.',
    },
  },
  {
    id: 'high_energy_pulsars',
    name: { ar: 'الثقوب السوداء والنجوم النابضة', en: 'Black Holes & Accretion Pulsars' },
    idealWavelength: 'xray',
    idealOptic: 'wolter_xray',
    nasaAnalog: 'Chandra X-Ray Observatory',
    fact: {
      ar: 'أشعة X تخترق المرايا التقليدية، لذا تستخدم مرايا Wolter المائلة كما في مرصد تشاندرا.',
      en: 'High-energy X-rays require nested grazing-incidence Wolter mirrors like NASA Chandra.',
    },
  },
  {
    id: 'solar_corona',
    name: { ar: 'العواصف والهالة الشمسية', en: 'Solar Corona & Space Weather Flares' },
    idealWavelength: 'optical',
    idealOptic: 'wide_field_opt',
    nasaAnalog: 'Parker Solar Probe & SOHO',
    fact: {
      ar: 'رصد التوهجات الشمسية والطقس الفضائي يحمي رواد الفضاء وشبكات الكهرباء والأقمار الصناعية.',
      en: 'Monitoring solar flares safeguards astronauts, navigation, and deep-space comms.',
    },
  },
];

export const TELESCOPE_WAVELENGTHS: Array<{ id: WavelengthId; label: Record<Language, string> }> = [
  { id: 'infrared', label: { ar: 'الأشعة تحت الحمراء (IR)', en: 'Infrared (IR)' } },
  { id: 'optical', label: { ar: 'الضوء المرئي (Optical)', en: 'Visible Optical' } },
  { id: 'ultraviolet', label: { ar: 'الأشعة فوق البنفسجية (UV)', en: 'Ultraviolet (UV)' } },
  { id: 'xray', label: { ar: 'أشعة إكس عالية الطاقة (X-Ray)', en: 'High-Energy X-Ray' } },
];

export const TELESCOPE_OPTICS: Array<{ id: OpticSystemId; label: Record<Language, string> }> = [
  { id: 'segmented_ir', label: { ar: 'مرآة سداسية ذهبية (مبردة)', en: 'Segmented Gold Cryo-Mirror' } },
  { id: 'coronagraph_uv', label: { ar: 'نظام حجب نجمي (Coronagraph)', en: 'Starlight Coronagraph Array' } },
  { id: 'wolter_xray', label: { ar: 'مرايا انعكاس مائلة (Wolter)', en: 'Grazing-Incidence Wolter Optics' } },
  { id: 'wide_field_opt', label: { ar: 'عدسة ميدان واسع بدرع حراري', en: 'Wide-Field Thermal Shield Lens' } },
];

export const CUBESAT_PHASES = [
  { phase: 1, title: { ar: '1. مفهوم العملية (ConOps)', en: '1. Concept of Operations (ConOps)' } },
  { phase: 2, title: { ar: '2. تجميع هيكل 3U والحمولة', en: '2. 3U Bus & Payload Integration' } },
  { phase: 3, title: { ar: '3. الإطلاق ونشر الألواح (CSLI)', en: '3. Launch & Solar Deployment' } },
  { phase: 4, title: { ar: '4. تشغيل المنارة والبث (Beacon Ops)', en: '4. On-Orbit Beacon Telemetry' } },
];

export const SOLAR_SYSTEM_CENTER: [number, number, number] = [0, 0, -450];

export const SOLAR_ORBIT_RADII: Array<{ planetId: PlanetId; au: string; orbitRadius: number; color: string }> = [
  { planetId: 'mercury', au: '0.39 AU', orbitRadius: 92, color: '#a8a29e' },
  { planetId: 'solaris', au: '0.72 AU', orbitRadius: 148, color: '#f59e0b' },
  { planetId: 'aurora', au: '1.00 AU', orbitRadius: 240, color: '#38bdf8' },
  { planetId: 'luna', au: '1.00 AU · 384k km', orbitRadius: 280, color: '#cbd5e1' },
  { planetId: 'mars', au: '1.52 AU', orbitRadius: 355, color: '#fb923c' },
  { planetId: 'aetheris', au: '5.20 AU', orbitRadius: 480, color: '#eab308' },
  { planetId: 'obsidian', au: '9.54 AU', orbitRadius: 605, color: '#fde68a' },
  { planetId: 'uranus', au: '19.2 AU', orbitRadius: 720, color: '#67e8f9' },
  { planetId: 'neptune', au: '30.07 AU', orbitRadius: 835, color: '#3b82f6' },
];

export const PLANETS: PlanetData[] = [
  {
    id: 'mercury',
    name: { ar: '1. عطارد (0.39 AU)', en: '1. Mercury (0.39 AU)' },
    subtitle: { ar: 'أقرب كوكب للشمس · حرارة قصوى وفوهة كالوريس', en: 'Closest Planet to Sun · Caloris Basin & High Solar Flux' },
    description: {
      ar: 'أصغر وأقرب كواكب المجموعة الشمسية إلى الشمس (0.39 AU)، بلا غلاف جوي ويواجه إشعاعاً شمسياً مضاعفاً 6 مرات.',
      en: 'Innermost planet at 0.39 AU: airless cratered iron core enduring 6.5x Earth solar radiation and extreme heat.',
    },
    discoveryFact: {
      ar: 'يتطلب الوصول لعطارد طاقة كبح (Δv) ضخمة عكس جاذبية الشمس كما فعل مسبارا MESSENGER وBepiColombo.',
      en: 'Reaching Mercury demands massive retrograde Δv braking against the Sun’s gravity well.',
    },
    resourceName: { ar: 'حديد عطارد المغناطيسي', en: 'Mercurian Iron Core Regolith' },
    position: [82, 2, -408],
    radius: 16,
    orbitDistance: 48,
    surfaceKind: 'mercury',
    primaryColor: '#a8a29e',
    atmosphereColor: '#d6d3d1',
    terrainColor: '#57534e',
    terrainAccent: '#a8a29e',
    skyColor: '#090705',
    gravity: 3.7,
    moonCount: 0,
    sampleTarget: 3,
    rewardCredits: 310,
    rewardXp: 210,
    craters: [
      { id: 'mer_c1', name: { ar: 'حوض كالوريس', en: 'Caloris Basin' }, x: 30, z: -24, radius: 15 },
      { id: 'mer_c2', name: { ar: 'فوهة راخمانينوف', en: 'Rachmaninoff Rim' }, x: -34, z: 22, radius: 13 },
    ],
    scienceSites: [
      { id: 'mer_s1', name: { ar: 'مطياف الرياح الشمسية', en: 'MESSENGER Solar Magnetometer' }, x: 20, z: 36, dataYieldMb: 65 },
    ],
  },
  {
    id: 'solaris',
    name: { ar: '2. الزهرة (0.72 AU)', en: '2. Venus (0.72 AU)' },
    subtitle: { ar: 'المدار الداخلي الساخن · كثافة غيوم الكبريت', en: '2nd Planet · Volcanic Sulfuric Shroud' },
    description: {
      ar: 'ثاني كواكب المجموعة الشمسية وأقربها للشمس بعد عطارد، غلافه سميك بالاحتباس الحراري وسهوله بركانية.',
      en: 'Second planet from the Sun (0.72 AU): dense super-greenhouse atmosphere above volcanic basalt plains.',
    },
    discoveryFact: {
      ar: 'يدور كوكب الزهرة حول الشمس على بُعد 0.72 وحدة فلكية ويومُه أطول من سنته ويدور عكس أغلب الكواكب.',
      en: 'Venus orbits at 0.72 AU with retrograde rotation; intense solar flux near its orbit boosts ion sail velocity.',
    },
    resourceName: { ar: 'بازلت الزهرة الكبريتي', en: 'Venusian Sulfuric Basalt' },
    position: [135, 4, -390],
    radius: 23,
    orbitDistance: 58,
    surfaceKind: 'volcanic',
    primaryColor: '#f59e0b',
    atmosphereColor: '#fbbf24',
    terrainColor: '#451a03',
    terrainAccent: '#ea580c',
    skyColor: '#2a1204',
    gravity: 8.87,
    moonCount: 0,
    sampleTarget: 4,
    rewardCredits: 320,
    rewardXp: 210,
    craters: [
      { id: 'sol_c1', name: { ar: 'جبل ماكسويل', en: 'Maxwell Montes Caldera' }, x: -34, z: -28, radius: 16 },
      { id: 'sol_c2', name: { ar: 'سهل أفروديت', en: 'Aphrodite Terra Rift' }, x: 40, z: 24, radius: 13 },
    ],
    scienceSites: [
      { id: 'sol_s1', name: { ar: 'مسبار الحرارة والضغط', en: 'Venera Pressure Probe' }, x: 18, z: -42, dataYieldMb: 75 },
    ],
  },
  {
    id: 'aurora',
    name: { ar: '3. الأرض (1.00 AU)', en: '3. Earth (1.00 AU)' },
    subtitle: { ar: 'المدار المرجعي · شبكة محطات DSN والأقمار', en: '3rd Planet · 1.00 AU Blue Marble & DSN Hub' },
    description: {
      ar: 'الكوكب الثالث في المجموعة الشمسية ومركز الانطلاق والاتصال الفضائي عبر شبكة الفضاء العميق (DSN).',
      en: 'Third planet from the Sun (1.00 AU): liquid oceans, nitrogen-oxygen sky, and Earth Deep Space Network relays.',
    },
    discoveryFact: {
      ar: 'تقع الأرض على بُعد 1.00 وحدة فلكية (150 مليون كم) من الشمس ويحميها مجالها المغناطيسي من الرياح الشمسية.',
      en: 'At 1.00 AU (149.6M km) from the Sun, Earth’s magnetosphere shields life and anchors LEO/SSO/GEO satellites.',
    },
    resourceName: { ar: 'عينات الغلاف الجوي والماء', en: 'Terrestrial Biospheric Sample' },
    position: [-90, -3, -228],
    radius: 26,
    orbitDistance: 64,
    surfaceKind: 'emerald_nebula',
    primaryColor: '#0284c7',
    atmosphereColor: '#38bdf8',
    terrainColor: '#065f46',
    terrainAccent: '#0ea5e9',
    skyColor: '#061932',
    gravity: 9.81,
    moonCount: 0,
    sampleTarget: 3,
    rewardCredits: 220,
    rewardXp: 150,
    craters: [
      { id: 'aur_c1', name: { ar: 'فوهة تشيكشولوب', en: 'Chicxulub Basin' }, x: 30, z: 32, radius: 14 },
      { id: 'aur_c2', name: { ar: 'منصة الاستشعار المدارية', en: 'Orbital Magnetosphere Rim' }, x: -42, z: -18, radius: 15 },
    ],
    scienceSites: [
      { id: 'aur_s1', name: { ar: 'محطة جولدستون DSN', en: 'Goldstone DSN Relay' }, x: 28, z: -36, dataYieldMb: 65 },
    ],
  },
  {
    id: 'luna',
    name: { ar: '3ب. القمر (مدار الأرض)', en: '3b. The Moon (Earth Orbit)' },
    subtitle: { ar: 'تابع الأرض الطبيعي · فوهة شاكلتون القطبية', en: 'Earth Satellite · Shackleton South Pole' },
    description: {
      ar: 'القمر الطبيعي للأرض على بُعد 384,400 كم، محطة التزود بالوقود والهيليوم-3 لمهام المريخ وأرتميس.',
      en: 'Earth’s natural satellite (384,400 km): low 1.62 m/s² gravity and permanently shadowed polar water-ice craters.',
    },
    discoveryFact: {
      ar: 'تحتفظ فوهات القطب الجنوبي القمري بجليد مائي يمكن تحليله لإنتاج الأكسجين ووقود الهيدروجين.',
      en: 'Polar craters hold ancient water-ice deposits essential for Artemis propellant & life-support production.',
    },
    resourceName: { ar: 'جليد القطب القمري', en: 'Lunar Polar Regolith' },
    position: [-14, 2, -170],
    radius: 19,
    orbitDistance: 54,
    surfaceKind: 'terran',
    primaryColor: '#cbd5e1',
    atmosphereColor: '#94a3b8',
    terrainColor: '#64748b',
    terrainAccent: '#94a3b8',
    skyColor: '#040710',
    gravity: 1.62,
    moonCount: 0,
    sampleTarget: 3,
    rewardCredits: 180,
    rewardXp: 120,
    craters: [
      { id: 'luna_c1', name: { ar: 'فوهة شاكلتون', en: 'Shackleton Rim' }, x: 34, z: -26, radius: 14 },
      { id: 'luna_c2', name: { ar: 'حوض تايكو', en: 'Tycho Basin' }, x: -40, z: 24, radius: 16 },
    ],
    scienceSites: [
      { id: 'luna_s1', name: { ar: 'مجس الجليد القطبي', en: 'Polar Ice Spectrometer' }, x: -24, z: -38, dataYieldMb: 45 },
      { id: 'luna_s2', name: { ar: 'منارة أرتميس القمرية', en: 'Artemis Relay Beacon' }, x: 42, z: 32, dataYieldMb: 50 },
    ],
  },
  {
    id: 'mars',
    name: { ar: '4. المريخ (1.52 AU)', en: '4. Mars (1.52 AU)' },
    subtitle: { ar: 'الكوكب الرابع · فوهة جيزيرو وقمرَا فوبوس وديموس', en: '4th Planet · Jezero Delta, Phobos & Deimos' },
    description: {
      ar: 'الكوكب الأحمر الرابع في الترتيب المداري على بُعد 1.52 وحدة فلكية، موطن البحيرات القديمة وإشارة 2089.',
      en: 'Fourth planet from the Sun (1.52 AU): rust-iron canyons, twin moons Phobos & Deimos, and the 2089 signal.',
    },
    discoveryFact: {
      ar: 'يدور المريخ على بُعد 1.52 وحدة فلكية ويستغرق عبور هوهمان من الأرض إليه قرابة 210–260 يوماً.',
      en: 'At 1.52 AU, Mars Hohmann transfer windows open every 26 months; Jezero Crater preserves ancient river deltas.',
    },
    resourceName: { ar: 'عينات الهيماتيت المريخية', en: 'Martian Hematite Core' },
    position: [264, 12, -212],
    radius: 25,
    orbitDistance: 64,
    surfaceKind: 'desert',
    primaryColor: '#ea580c',
    atmosphereColor: '#fb923c',
    terrainColor: '#9a3412',
    terrainAccent: '#ea580c',
    skyColor: '#26110a',
    gravity: 3.72,
    moonCount: 2,
    sampleTarget: 4,
    rewardCredits: 340,
    rewardXp: 230,
    hasMonolith: true,
    craters: [
      { id: 'mars_c1', name: { ar: 'فوهة جيزيرو', en: 'Jezero Delta' }, x: 38, z: -20, radius: 15 },
      { id: 'mars_c2', name: { ar: 'حوض هيلاس', en: 'Hellas Basin' }, x: -36, z: 30, radius: 17 },
    ],
    scienceSites: [
      { id: 'mars_s1', name: { ar: 'حفّار المياه الجوفية', en: 'Aquifer Core Drill' }, x: -32, z: -34, dataYieldMb: 60 },
      { id: 'mars_s2', name: { ar: 'محطة رصد الضغط المريخي', en: 'Barometric Station' }, x: 22, z: 42, dataYieldMb: 55 },
    ],
  },
  {
    id: 'aetheris',
    name: { ar: '5. المشتري · أوروبا (5.20 AU)', en: '5. Jupiter · Europa (5.20 AU)' },
    subtitle: { ar: 'العملاق الغازي الخامس · الأقمار الجليلية الأربعة', en: '5th Planet · Gas Giant & 4 Galilean Moons' },
    description: {
      ar: 'أضخم كواكب المجموعة الشمسية خلف حزام الكويكبات على بُعد 5.20 وحدة فلكية، وتدور حوله أقمار أوروبا وآيو وجانيميد وكاليستو.',
      en: 'Fifth planet from the Sun beyond the Asteroid Belt (5.20 AU): banded storms and icy subsurface-ocean moon Europa.',
    },
    discoveryFact: {
      ar: 'على بُعد 5.20 AU تنخفض طاقة الشمس إلى 3.7% فقط، لذا تعتمد مهام المشتري على ألواح واسعة أو مولدات RTG.',
      en: 'At 5.20 AU, solar irradiance drops to just 3.7% of Earth’s — proving why outer missions trade solar wings for RTG power.',
    },
    resourceName: { ar: 'جليد محيط قمر أوروبا', en: 'Europa Subsurface Cryo-Ice' },
    position: [-424, -14, -225],
    radius: 36,
    orbitDistance: 86,
    surfaceKind: 'cryo_giant',
    primaryColor: '#d97706',
    atmosphereColor: '#fcd34d',
    terrainColor: '#1e3a8a',
    terrainAccent: '#60a5fa',
    skyColor: '#071326',
    gravity: 6.4,
    hasRings: false,
    moonCount: 4,
    sampleTarget: 4,
    rewardCredits: 460,
    rewardXp: 310,
    craters: [
      { id: 'aet_c1', name: { ar: 'فوهة باويل (أوروبا)', en: 'Pwyll Ice Crater' }, x: 35, z: -30, radius: 16 },
      { id: 'aet_c2', name: { ar: 'نبع بخار أوروبا', en: 'Europa Thermal Vent' }, x: -30, z: 36, radius: 14 },
    ],
    scienceSites: [
      { id: 'aet_s1', name: { ar: 'رادار الجليد (Europa Clipper)', en: 'Clipper Ice-Penetrating Radar' }, x: -40, z: -22, dataYieldMb: 85 },
    ],
  },
  {
    id: 'obsidian',
    name: { ar: '6. زحل · تيتان (9.54 AU)', en: '6. Saturn · Titan (9.54 AU)' },
    subtitle: { ar: 'سادس الكواكب · الحلقات الذهبية ومسبار كاسيني', en: '6th Planet · Iconic Ring System & Titan Beacon' },
    description: {
      ar: 'الكوكب السادس بحلقاته الجليدية الذهبية المهيبة على بُعد 9.54 وحدة فلكية ومصدر البث العميق عند قمر تيتان.',
      en: 'Sixth planet from the Sun (9.54 AU): iconic icy golden rings and Titan methane-basin monolith.',
    },
    discoveryFact: {
      ar: 'على بُعد 9.54 AU تستغرق إشارة الراديو نحو 80 دقيقة للوصول إلى الأرض ويلزم هوائي Ka-Band فائق الكسب.',
      en: 'At 9.54 AU, radio signals take ~80 minutes one-way to Earth, demanding high-gain deep-space dish links.',
    },
    resourceName: { ar: 'عينات حلقات زحل وتيتان', en: 'Saturnian Ring & Titan Core' },
    position: [157, 22, -1034],
    radius: 33,
    orbitDistance: 84,
    surfaceKind: 'obsidian',
    primaryColor: '#eab308',
    atmosphereColor: '#fde68a',
    terrainColor: '#78350f',
    terrainAccent: '#f59e0b',
    skyColor: '#1a1206',
    gravity: 5.2,
    hasRings: true,
    ringColor: '#fde68a',
    moonCount: 2,
    sampleTarget: 4,
    rewardCredits: 600,
    rewardXp: 420,
    hasMonolith: true,
    craters: [
      { id: 'obs_c1', name: { ar: 'حوض كراكن ماري', en: 'Kraken Mare Rim' }, x: -36, z: -24, radius: 16 },
      { id: 'obs_c2', name: { ar: 'فوهة مينرفا (تيتان)', en: 'Menrva Crater' }, x: 38, z: 28, radius: 15 },
    ],
    scienceSites: [
      { id: 'obs_s1', name: { ar: 'محلل إشارة كاسيني-تيتان', en: 'Cassini-Titan Ring Decoder' }, x: 0, z: -48, dataYieldMb: 110 },
    ],
  },
  {
    id: 'uranus',
    name: { ar: '7. أورانوس (19.2 AU)', en: '7. Uranus (19.2 AU)' },
    subtitle: { ar: 'العملاق الجليدي السابع · ميل محوري 98° وحلقات عمودية', en: '7th Planet · 98° Axial Tilt & Vertical Ice Rings' },
    description: {
      ar: 'الكوكب السابع في المجموعة الشمسية على بُعد 19.2 AU، يدور على جانبه بزاوية 98 درجة مع غلاف ميثان فيروزي وحلقات رفيعة.',
      en: 'Seventh planet from the Sun (19.2 AU): pale cyan methane ice giant tilted 98° on its side with vertical rings.',
    },
    discoveryFact: {
      ar: 'يصل زمن انتقال الإشارة من أورانوس للأرض إلى ساعتين و40 دقيقة، والطاقة الشمسية هنا 0.27% فقط مما يتطلب طاقة نووية RTG.',
      en: 'At 19.2 AU, sunlight is 0.27% of Earth’s and light travel takes 2h 40m one-way — RTG nuclear batteries are mandatory.',
    },
    resourceName: { ar: 'جليد الميثان الأوراني', en: 'Uranian Methane Ice Sample' },
    position: [-540, -18, -926],
    radius: 28,
    orbitDistance: 74,
    surfaceKind: 'uranus',
    primaryColor: '#22d3ee',
    atmosphereColor: '#a5f3fc',
    terrainColor: '#155e75',
    terrainAccent: '#67e8f9',
    skyColor: '#051a22',
    gravity: 8.69,
    hasRings: true,
    ringColor: '#a5f3fc',
    moonCount: 2,
    sampleTarget: 4,
    rewardCredits: 650,
    rewardXp: 460,
    craters: [
      { id: 'ura_c1', name: { ar: 'حوض ميراندا الجليدي', en: 'Miranda Verona Rupes' }, x: 32, z: -26, radius: 15 },
      { id: 'ura_c2', name: { ar: 'صدع تيتانيا', en: 'Titania Messina Chasma' }, x: -34, z: 30, radius: 14 },
    ],
    scienceSites: [
      { id: 'ura_s1', name: { ar: 'مسبار الغلاف الجليدي', en: 'Voyager-2 Uranus Polarimetry' }, x: 26, z: 38, dataYieldMb: 115 },
    ],
  },
  {
    id: 'neptune',
    name: { ar: '8. نبتون · تريتون (30.07 AU)', en: '8. Neptune · Triton (30.07 AU)' },
    subtitle: { ar: 'أبعد كواكب المجموعة الشمسية · رياح فائقة الصوت', en: '8th Planet · Supersonic Winds & Cryo-Geysers on Triton' },
    description: {
      ar: 'ثامن وآخر كواكب المجموعة الشمسية على بُعد 30.07 AU، عملاق أزرق عميق تهب فيه أسرع رياح كوكبية (2100 كم/س) ويدور حوله قمر تريتون.',
      en: 'Eighth and outermost planet (30.07 AU): deep sapphire ice giant with 2,100 km/h winds and nitrogen-geyser moon Triton.',
    },
    discoveryFact: {
      ar: 'على بُعد 4.5 مليار كم (30 AU)، يستغرق الضوء 4.1 ساعات ليصل من الشمس ويحتاج المسبار لأقصى كفاءة اتصال وطاقة.',
      en: 'At 4.5 billion km (30.07 AU), sunlight takes over 4 hours to arrive — the ultimate test of NASA deep-space engineering.',
    },
    resourceName: { ar: 'نيتروجين قمر تريتون المتجمد', en: 'Triton Cryo-Nitrogen Core' },
    position: [465, 28, -1143],
    radius: 28,
    orbitDistance: 74,
    surfaceKind: 'neptune',
    primaryColor: '#2563eb',
    atmosphereColor: '#60a5fa',
    terrainColor: '#1e3a8a',
    terrainAccent: '#3b82f6',
    skyColor: '#040a1f',
    gravity: 11.15,
    moonCount: 2,
    sampleTarget: 4,
    rewardCredits: 750,
    rewardXp: 520,
    craters: [
      { id: 'nep_c1', name: { ar: 'نبع تريتون الجليدي', en: 'Triton Cantaloupe Plume' }, x: -30, z: -26, radius: 15 },
      { id: 'nep_c2', name: { ar: 'البقعة المظلمة الكبرى', en: 'Great Dark Vortex Rim' }, x: 34, z: 24, radius: 16 },
    ],
    scienceSites: [
      { id: 'nep_s1', name: { ar: 'محطة أقصى الحافة الكونية', en: 'Kuiper Boundary DSN Relay' }, x: 0, z: -42, dataYieldMb: 130 },
    ],
  },
];

export const INITIAL_CREW: CrewMember[] = [
  {
    id: 'vance',
    name: { ar: 'د. إيلينا فانس', en: 'Dr. Elena Vance' },
    role: { ar: 'كبيرة علماء الأحياء الفلكية', en: 'Lead Astrobiologist' },
    assignment: 'Science',
    morale: 92,
    fatigue: 12,
  },
  {
    id: 'chen',
    name: { ar: 'ماركوس تشين', en: 'Marcus Chen' },
    role: { ar: 'كبير مهندسي الدفع والطاقة', en: 'Chief Propulsion Engineer' },
    assignment: 'Engineering',
    morale: 88,
    fatigue: 18,
  },
  {
    id: 'sato',
    name: { ar: 'الملازم آريا ساتو', en: 'Lt. Aria Sato' },
    role: { ar: 'ضابطة الاتصالات والملاحة', en: 'DSN Comms & Flight Officer' },
    assignment: 'Comms',
    morale: 94,
    fatigue: 10,
  },
];

export const SHUTTLE_ROOM_DEFS: Array<{
  id: ShuttleRoomId;
  code: string;
  name: Record<Language, string>;
  focusStat: Record<Language, string>;
}> = [
  {
    id: 'helm',
    code: 'RM-01',
    name: { ar: 'قمرة القيادة الأمامية', en: 'Forward Flight Deck' },
    focusStat: { ar: 'سرعة الطيران وكفاءة المحرك', en: 'Flight Speed & Thruster Efficiency' },
  },
  {
    id: 'nav',
    code: 'RM-02',
    name: { ar: 'غرفة الملاحة GMAT', en: 'GMAT Trajectory Room' },
    focusStat: { ar: 'دقة الاكتشاف العلمي والملاحة', en: 'Science Discovery & Trajectory Precision' },
  },
  {
    id: 'science_lab',
    code: 'RM-03',
    name: { ar: 'مختبر التلسكوب و CubeSat', en: 'Telescope & CubeSat Lab' },
    focusStat: { ar: 'معدل الاكتشاف والبيانات العلمية', en: 'Science Discovery Rate & Data Yield' },
  },
  {
    id: 'bio_bay',
    code: 'RM-04',
    name: { ar: 'غرفة الزراعة المائية', en: 'Hydroponics Bio-Dome' },
    focusStat: { ar: 'دعم الحياة O2 والأبحاث الحيوية', en: 'O2 Regen & Bio-Science Discovery' },
  },
  {
    id: 'lounge',
    code: 'RM-05',
    name: { ar: 'الاستراحة والقهوة والنوم', en: 'Crew Galley & Quarters' },
    focusStat: { ar: 'معنويات الطاقم واستعادة الطاقة', en: 'Crew Stamina & Recovery Rate' },
  },
  {
    id: 'med_bay',
    code: 'RM-06',
    name: { ar: 'العيادة الطبية والإشعاع', en: 'Medical & Radiation Bay' },
    focusStat: { ar: 'مقاومة الإشعاع واستعادة O2', en: 'Medical Care & Radiation Mitigation' },
  },
  {
    id: 'engineering',
    code: 'RM-07',
    name: { ar: 'غرفة المفاعل والهندسة MDL', en: 'MDL & Fusion Reactor' },
    focusStat: { ar: 'سرعة الإصلاح وشحن الدروع والطاقة', en: 'Repair Speed & Shield/Power Regen' },
  },
  {
    id: 'cargo_bay',
    code: 'RM-08',
    name: { ar: 'عنبر الحمولة والروفر 6×6', en: 'Cargo Bay & 6x6 Rover' },
    focusStat: { ar: 'إصلاح الهيكل وصيانة الروفر', en: 'Hull Repair Speed & Rover Tuning' },
  },
  {
    id: 'comms_desk',
    code: 'RM-09',
    name: { ar: 'غرفة اتصالات DSN', en: 'Deep Space Network DSN' },
    focusStat: { ar: 'سرعة البث العلمي للأرض', en: 'DSN Transmission & Signal Gain' },
  },
  {
    id: 'airlock',
    code: 'RM-10',
    name: { ar: 'بوابة الهبوط الكوكبي', en: 'Planetary EVA Airlock' },
    focusStat: { ar: 'كفاءة الهبوط والصيانة الميدانية', en: 'EVA Readiness & Field Repair' },
  },
];

export const INITIAL_SPECIALISTS: ShuttleSpecialist[] = [
  {
    id: 'ryan',
    name: { ar: 'الكابتن رايان ميلر', en: 'Capt. Ryan Miller' },
    role: { ar: 'كبير طياري المكوك', en: 'Chief Shuttle Pilot' },
    specialty: 'flight',
    skillRating: 94,
    idealRooms: ['helm', 'airlock'],
    assignedRoomId: 'helm',
    trait: { ar: '+14% كفاءة الطيران والمناورة', en: '+14% Flight Speed & Handling' },
  },
  {
    id: 'nadia',
    name: { ar: 'د. نادية كريم', en: 'Dr. Nadia Karim' },
    role: { ar: 'محللة مسارات GMAT', en: 'GMAT Trajectory Analyst' },
    specialty: 'science',
    skillRating: 91,
    idealRooms: ['nav', 'science_lab'],
    assignedRoomId: 'nav',
    trait: { ar: '+15% دقة الاكتشاف العلمي', en: '+15% Science Discovery Rate' },
  },
  {
    id: 'elena',
    name: { ar: 'د. إيلينا فانس', en: 'Dr. Elena Vance' },
    role: { ar: 'عالمة الفيزياء الفلكية', en: 'Lead Astrophysicist' },
    specialty: 'science',
    skillRating: 96,
    idealRooms: ['science_lab', 'nav'],
    assignedRoomId: 'science_lab',
    trait: { ar: '+22% سرعة الاكتشاف العلمي', en: '+22% Science Discovery Rate' },
  },
  {
    id: 'omar',
    name: { ar: 'د. عمر فاروق', en: 'Dr. Omar Farouk' },
    role: { ar: 'خبير النباتات والأكسجين', en: 'Hydroponics Botanist' },
    specialty: 'medical',
    skillRating: 89,
    idealRooms: ['bio_bay', 'med_bay'],
    assignedRoomId: 'bio_bay',
    trait: { ar: '+18% تجدد O2 وأبحاث حيوية', en: '+18% O2 Regen & Bio Science' },
  },
  {
    id: 'maya',
    name: { ar: 'مايا لين', en: 'Maya Lin' },
    role: { ar: 'مسؤولة الإعاشة والطاقم', en: 'Habitation Officer' },
    specialty: 'medical',
    skillRating: 86,
    idealRooms: ['lounge', 'bio_bay'],
    assignedRoomId: 'lounge',
    trait: { ar: '+14% تعافي الطاقم والطاقة', en: '+14% Crew & Stamina Recovery' },
  },
  {
    id: 'sophia',
    name: { ar: 'د. صوفيا باتيل', en: 'Dr. Sophia Patel' },
    role: { ar: 'طبيبة الإشعاع الفضائي', en: 'Flight & Radiation Surgeon' },
    specialty: 'medical',
    skillRating: 93,
    idealRooms: ['med_bay', 'bio_bay'],
    assignedRoomId: 'med_bay',
    trait: { ar: '+20% حماية حيوية وعلاجية', en: '+20% Life Support & Med Recovery' },
  },
  {
    id: 'marcus',
    name: { ar: 'ماركوس تشين', en: 'Marcus Chen' },
    role: { ar: 'مهندس الدفع والمفاعل', en: 'NASA MDL Engineer' },
    specialty: 'engineering',
    skillRating: 95,
    idealRooms: ['engineering', 'cargo_bay'],
    assignedRoomId: 'engineering',
    trait: { ar: '+24% سرعة الإصلاح وشحن الدروع', en: '+24% Repair Speed & Shield Regen' },
  },
  {
    id: 'devon',
    name: { ar: 'الرقيب ديفون بروكس', en: 'Sgt. Devon Brooks' },
    role: { ar: 'متخصص الروفر والحمولة', en: 'Payload & Rover Chief' },
    specialty: 'engineering',
    skillRating: 90,
    idealRooms: ['cargo_bay', 'engineering'],
    assignedRoomId: 'cargo_bay',
    trait: { ar: '+18% سرعة الإصلاح وصيانة الروفر', en: '+18% Repair Speed & Hull Maintenance' },
  },
  {
    id: 'aria',
    name: { ar: 'الملازم آريا ساتو', en: 'Lt. Aria Sato' },
    role: { ar: 'ضابطة البث الأرضي', en: 'DSN Comms Officer' },
    specialty: 'comms',
    skillRating: 92,
    idealRooms: ['comms_desk', 'nav'],
    assignedRoomId: 'comms_desk',
    trait: { ar: '+20% سرعة البث والبيانات', en: '+20% DSN Uplink & Telemetry Rate' },
  },
  {
    id: 'leo',
    name: { ar: 'القائد ليو فانس', en: 'Cmdr. Leo Vance' },
    role: { ar: 'ضابط بوابة الخروج EVA', en: 'EVA Airlock Officer' },
    specialty: 'flight',
    skillRating: 88,
    idealRooms: ['airlock', 'cargo_bay'],
    assignedRoomId: 'airlock',
    trait: { ar: '+12% إصلاح ميداني وكفاءة هبوط', en: '+12% Field Repair & EVA Readiness' },
  },
];

export function computePersonnelEffects(specialists: ShuttleSpecialist[]): PersonnelEffects {
  let repairBonus = 0;
  let scienceBonus = 0;
  let lifeSupportBonus = 0;
  let commsBonus = 0;
  let flightBonus = 0;
  let synergyCount = 0;

  for (const sp of specialists) {
    const skillFactor = sp.skillRating / 100;
    const isIdeal = sp.idealRooms.includes(sp.assignedRoomId);
    if (isIdeal) synergyCount += 1;
    const synergyMult = isIdeal ? 1.5 : 0.72;
    const specMatchEngineering = sp.specialty === 'engineering' ? 1.35 : 0.65;
    const specMatchScience = sp.specialty === 'science' ? 1.35 : 0.65;
    const specMatchMedical = sp.specialty === 'medical' ? 1.35 : 0.65;
    const specMatchComms = sp.specialty === 'comms' ? 1.35 : 0.7;
    const specMatchFlight = sp.specialty === 'flight' ? 1.35 : 0.7;

    const r = sp.assignedRoomId;
    if (r === 'engineering' || r === 'cargo_bay' || r === 'airlock') {
      const roomWeight = r === 'engineering' ? 0.14 : r === 'cargo_bay' ? 0.11 : 0.06;
      repairBonus += roomWeight * skillFactor * synergyMult * specMatchEngineering;
    }
    if (r === 'science_lab' || r === 'nav' || r === 'bio_bay') {
      const roomWeight = r === 'science_lab' ? 0.16 : r === 'nav' ? 0.12 : 0.07;
      scienceBonus += roomWeight * skillFactor * synergyMult * specMatchScience;
    }
    if (r === 'bio_bay' || r === 'med_bay' || r === 'lounge') {
      const roomWeight = r === 'med_bay' ? 0.14 : r === 'bio_bay' ? 0.12 : 0.09;
      lifeSupportBonus += roomWeight * skillFactor * synergyMult * specMatchMedical;
    }
    if (r === 'comms_desk' || r === 'nav') {
      const roomWeight = r === 'comms_desk' ? 0.18 : 0.07;
      commsBonus += roomWeight * skillFactor * synergyMult * specMatchComms;
    }
    if (r === 'helm' || r === 'airlock') {
      const roomWeight = r === 'helm' ? 0.14 : 0.07;
      flightBonus += roomWeight * skillFactor * synergyMult * specMatchFlight;
    }
  }

  return {
    repairSpeedMult: Number((0.78 + repairBonus).toFixed(2)),
    scienceRateMult: Number((0.76 + scienceBonus).toFixed(2)),
    lifeSupportRateMult: Number((0.8 + lifeSupportBonus).toFixed(2)),
    commsRateMult: Number((0.82 + commsBonus).toFixed(2)),
    flightEfficiencyMult: Number((0.84 + flightBonus).toFixed(2)),
    synergyCount,
  };
}

export const STORY_CHAPTERS = [
  {
    chapter: 1,
    title: { ar: 'الفصل 1: تأسيس المهمة (CML 1-4 و MDL)', en: 'Ch 1: Mission Design Lab & CML 1-4' },
    summary: { ar: 'صمّم التلسكوب في مختبر المركبة وراجع جاهزية القطاعات الأربعة من جسر القيادة.', en: 'Calibrate your telescope lab and verify the 4 mission segments from the bridge.' },
  },
  {
    chapter: 2,
    title: { ar: 'الفصل 2: مسارات GMAT والطيران الأول', en: 'Ch 2: GMAT Trajectory & Lunar Flight' },
    summary: { ar: 'اعبر مسار GMAT المداري، حلّق إلى القمر (مدار الأرض)، وجرّب المركبة الجوالة 6×6.', en: 'Inspect 3D GMAT transfer arcs, pilot to the Moon, and drive the 6x6 rover.' },
  },
  {
    chapter: 3,
    title: { ar: 'الفصل 3: تحدي طقس الفضاء والأقمار المكعبة', en: 'Ch 3: Space Weather & CubeSat 101' },
    summary: { ar: 'انشر قمر CubeSat الصناعي وتحدَّ التوهجات الشمسية والعواصف الأيونية.', en: 'Deploy your 3U CubeSat and navigate flares, squalls, and ion storms.' },
  },
  {
    chapter: 4,
    title: { ar: 'الفصل 4: رحلة المريخ حتى زحل (1.52 → 9.54 AU)', en: 'Ch 4: Mars to Saturn Deep-Space Signal' },
    summary: { ar: 'افحص المسلّة المتوهجة على المريخ أو زحل (تيتان) واجمع العينات.', en: 'Inspect the 2089 monolith on Mars or Saturn (Titan).' },
  },
  {
    chapter: 5,
    title: { ar: 'الفصل 5: البث العلمي لقطاع المستخدمين (DSN)', en: 'Ch 5: Ground & Science User Uplink' },
    summary: { ar: 'أرسل البيانات عبر شبكة الفضاء العميق للأرض واختم المهمة.', en: 'Transmit data to Earth DSN Ground stations and publish your findings.' },
  },
];
