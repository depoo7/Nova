import type {
  ActiveMissionEvent,
  AdvancedLoadout,
  AutonomousRulesConfig,
  DynamicEventType,
  EngineeringTradeoffReport,
  FailureInvestigationReport,
  Language,
  MissionPerformanceReport,
  MissionTimelineLogEntry,
  OperationalMode,
  PlanetId,
  ResourcesState,
} from '../types/game';
import { getPlanetEnvironment } from './planetaryEnvironments';

// Feature 6: Complete 12-Phase Interactive Mission Lifecycle
export interface LifecyclePhase12Def {
  phase: number;
  code: string;
  title: Record<Language, string>;
  objective: Record<Language, string>;
  resourceReq: Record<Language, string>;
  constraint: Record<Language, string>;
  failureCondition: Record<Language, string>;
}

export const MISSION_LIFECYCLE_12: LifecyclePhase12Def[] = [
  {
    phase: 1,
    code: 'LC-01',
    title: { ar: '1. تخطيط المهمة (Planning)', en: '1. Mission Planning' },
    objective: { ar: 'تحديد المدار والميزانية والأجهزة العلمية.', en: 'Define target planet, budget ceiling & science instruments.' },
    resourceReq: { ar: 'اعتماد الميزانية ≤ الحد الأقصى', en: 'Budget ≤ Max Authorized' },
    constraint: { ar: 'توافق الأجهزة مع هدف الكوكب', en: 'Instrument-planet synergy' },
    failureCondition: { ar: 'تجاوز الميزانية أو غياب الأجهزة العلمية', en: 'Budget overrun or zero science instruments' },
  },
  {
    phase: 2,
    code: 'LC-02',
    title: { ar: '2. التجهيز للإطلاق (Launch Prep)', en: '2. Launch Preparation' },
    objective: { ar: 'فحص التكرار والبطاريات والذاكرة قبل الإقلاع.', en: 'Pre-flight checkout of OBC, batteries & SSR storage.' },
    resourceReq: { ar: 'طاقة ≥ 60% وسلامة هيكل ≥ 70%', en: 'Battery ≥ 60% & Hull ≥ 70%' },
    constraint: { ar: 'تحقق التوافق الحراري والإشعاعي', en: 'Thermal & rad compatibility pass' },
    failureCondition: { ar: 'فشل فحص الأنظمة المكررة أو البطارية الفارغة', en: 'Pre-launch avionics or battery fault' },
  },
  {
    phase: 3,
    code: 'LC-03',
    title: { ar: '3. الإطلاق (Launch)', en: '3. Launch' },
    objective: { ar: 'اختراق الغلاف الجوي تحت أقصى ضغط ديناميكي Max-Q.', en: 'Boost stack through Max-Q atmospheric ascent.' },
    resourceReq: { ar: 'Δv وهامش هيكل ≥ 55%', en: 'Available Δv & Structural Margin ≥ 55%' },
    constraint: { ar: 'حدود الكتلة الإجمالية للمركبة', en: 'Total wet mass within envelope' },
    failureCondition: { ar: 'انهيار هيكلي أو عجز دفع أثناء الصعود', en: 'Structural buckling or ascent thrust shortfall' },
  },
  {
    phase: 4,
    code: 'LC-04',
    title: { ar: '4. الحقن المداري (Orbit Insertion)', en: '4. Orbit Insertion' },
    objective: { ar: 'حرق المحرك للدخول في مسار الانتقال أو المدار الأولي.', en: 'Burn main stage for transfer injection & stabilize ADCS.' },
    resourceReq: { ar: 'وقود ≥ 35% ودقة توجيه ≤ 25"', en: 'Propellant ≥ 35% & ADCS lock' },
    constraint: { ar: 'تفعيل متتبعات النجوم وحساسات الملاحة', en: 'Star tracker & IMU lock' },
    failureCondition: { ar: 'ضياع زاوية الحقن بسبب خلل ADCS', en: 'Missed injection window from tumble' },
  },
  {
    phase: 5,
    code: 'LC-05',
    title: { ar: '5. مرحلة العبور (Cruise Phase)', en: '5. Cruise Phase' },
    objective: { ar: 'العبور بين الكواكب ومقاومة الإشعاع والحرارة.', en: 'Interplanetary coast managing thermal sink & CME storms.' },
    resourceReq: { ar: 'توازن طاقة إيجابي (Net W ≥ 0)', en: 'Positive Power Margin at AU' },
    constraint: { ar: 'تبريد/تسخين مستمر ضمن [-15°C..+52°C]', en: 'Bus temperature held in safe band' },
    failureCondition: { ar: 'انقطاع الطاقة أو تجمد البطاريات بالفضاء العميق', en: 'Solar starvation or deep-space freeze' },
  },
  {
    phase: 6,
    code: 'LC-06',
    title: { ar: '6. المناورات المدارية (Orbital Maneuvers)', en: '6. Orbital Maneuvers' },
    objective: { ar: 'تصحيح المسار (TCM) ومساعدة الجاذبية أو الكبح المداري.', en: 'Mid-course correction & capture burn at destination.' },
    resourceReq: { ar: 'Δv Margin ≥ 0 km/s', en: 'Positive Δv Margin' },
    constraint: { ar: 'استجابة نظام الدفع وعجلات رد الفعل', en: 'Propulsion + Reaction Wheel authority' },
    failureCondition: { ar: 'نفاد الوقود قبل الالتقاط المداري', en: 'Propellant exhaustion — flyby overshoot' },
  },
  {
    phase: 7,
    code: 'LC-07',
    title: { ar: '7. الهبوط والانتشار (Landing / EDL)', en: '7. Landing or Deployment' },
    objective: { ar: 'نشر الألواح أو الهبوط على سطح الكوكب بأمان.', en: 'Execute atmospheric entry/retro-descent or orbital deploy.' },
    resourceReq: { ar: 'أكسجين ≥ 30% ونظام EDL ملائم للضغط', en: 'O₂ ≥ 30% & pressure-matched EDL' },
    constraint: { ar: 'حماية الدرع الحراري أثناء الدخول', en: 'Thermal shield intact during entry' },
    failureCondition: { ar: 'تحطم الهبوط بسبب ضغط سطحي مرتفع أو عجز EDL', en: 'Landing crash under high gravity/pressure' },
  },
  {
    phase: 8,
    code: 'LC-08',
    title: { ar: '8. العمليات العلمية (Science Ops)', en: '8. Scientific Operations' },
    objective: { ar: 'تشغيل المطياف والرادار والكاميرات في نقاط المسح.', en: 'Power up active science instruments over target sites.' },
    resourceReq: { ar: 'شحن بطارية ≥ 25% وتبريد سليم', en: 'Battery ≥ 25% & nominal thermal' },
    constraint: { ar: 'إدارة ذروة استهلاك الأجهزة', en: 'Payload duty-cycle within bus limits' },
    failureCondition: { ar: 'إيقاف قسري للأجهزة بسبب هبوط الجهد', en: 'Brownout tripping science bus' },
  },
  {
    phase: 9,
    code: 'LC-09',
    title: { ar: '9. جمع وتخزين البيانات (Data Collection)', en: '9. Data Collection' },
    objective: { ar: 'تسجيل القياسات في ذاكرة SSR دون تجاوز السعة.', en: 'Buffer telemetry & imagery in onboard SSR storage.' },
    resourceReq: { ar: 'سعة SSR متاحة (< 95%)', en: 'Onboard SSR buffer < 95%' },
    constraint: { ar: 'فرز أولوية البيانات (Critical vs Bulk)', en: 'Transmission priority queue active' },
    failureCondition: { ar: 'امتلاء الذاكرة وفقدان القياسات العلمية الحرجة', en: 'SSR overflow overwriting science logs' },
  },
  {
    phase: 10,
    code: 'LC-10',
    title: { ar: '10. الاتصالات والبث (Comms & Downlink)', en: '10. Communication & Transmission' },
    objective: { ar: 'ضبط الهوائي مع المحطة الأرضية (DSN) وإرسال الحزم.', en: 'Lock antenna onto Ground Station pass & flush backlog.' },
    resourceReq: { ar: 'قوة إشارة ≥ 20% وتوافق التردد', en: 'Signal ≥ 20% & band match' },
    constraint: { ar: 'تأثير الأمطار والطقس على المحطة الأرضية', en: 'Station weather & comm window limits' },
    failureCondition: { ar: 'فشل بث البيانات أو عدم توافق حزمة المحطة', en: 'Sustained link loss or station mismatch' },
  },
  {
    phase: 11,
    code: 'LC-11',
    title: { ar: '11. العمليات الممتدة (Extended Ops)', en: '11. Extended Operations' },
    objective: { ar: 'مواصلة العمل بعد العمر الأولي مع تآكل الإشعاع.', en: 'Sustain degraded hardware past nominal baseline lifetime.' },
    resourceReq: { ar: 'صحة هيكل ≥ 30% وإشعاع ضمن التحمل', en: 'Hull ≥ 30% & rad dose within vault' },
    constraint: { ar: 'تفعيل الأنظمة الاحتياطية والوضع الآمن', en: 'Backup OBC & autonomous protections' },
    failureCondition: { ar: 'تراكم أعطال الأجهزة غير المكررة', en: 'Cumulative aging failure' },
  },
  {
    phase: 12,
    code: 'LC-12',
    title: { ar: '12. إتمام المهمة والتقرير (Completion)', en: '12. Mission Completion' },
    objective: { ar: 'حفظ البيانات وتوليد تقرير الأداء النهائي للمقارنة.', en: 'Archive validated telemetry & issue Mission Performance Report.' },
    resourceReq: { ar: 'نجاة المركبة وإرسال الحزم الأساسية', en: 'Core data transmitted & craft intact' },
    constraint: { ar: 'توثيق الدروس المستفادة والترقيات', en: 'Log recommendations & tech unlock' },
    failureCondition: { ar: 'إحباط المهمة قبل بث النتائج', en: 'Expedition aborted prior to archive' },
  },
];

// Feature 3: Non-random, engineering-grounded Dynamic Mission Events (All 12 types)
export function generateContextualDynamicEvent(params: {
  planetId: PlanetId;
  loadout: AdvancedLoadout;
  tradeOff: EngineeringTradeoffReport;
  resources: ResourcesState;
  hullIntegrity: number;
  internalTempC: number;
  forcedType?: DynamicEventType;
}): ActiveMissionEvent {
  const env = getPlanetEnvironment(params.planetId);
  const now = Date.now();

  let pickedType: DynamicEventType | undefined = params.forcedType;
  if (!pickedType) {
    if (env.hazardType === 'dust_storm' && params.loadout.solar_arrays !== 'pwr14_mmrtg') pickedType = 'dust_storm';
    else if (params.internalTempC > 46 || env.hazardType === 'extreme_heat' || env.hazardType === 'high_pressure') pickedType = 'equipment_overheat';
    else if (env.radiationKradYr > 40 && params.loadout.radiation_shielding !== 'rad_tantalum_vault') pickedType = 'solar_storm';
    else if (params.tradeOff.commsCapacityMbDay < params.tradeOff.dataGenMbDay) pickedType = 'comms_interruption';
    else if (params.resources.battery < 40) pickedType = 'battery_degradation';
    else if (params.hullIntegrity < 65) pickedType = 'micrometeorite';
    else if (params.loadout.backup_obc === 'obc_single') pickedType = 'sensor_malfunction';
    else if (params.tradeOff.deltaVMarginKms < 1.2) pickedType = 'fuel_leak';
    else if (params.loadout.nav_sensors === 'nav_imu_std') pickedType = 'nav_error';
    else if (params.tradeOff.thermalMarginPct < 55) pickedType = 'thermal_failure';
    else if (params.tradeOff.netPowerW < 80) pickedType = 'power_spike';
    else pickedType = 'engine_malfunction';
  }

  const builders: Record<DynamicEventType, () => ActiveMissionEvent> = {
    solar_storm: () => ({
      id: `evt_solar_${now}`,
      type: 'solar_storm',
      triggeredAt: now,
      title: { ar: 'عاصفة شمسية إشعاعية (CME)', en: 'Solar Proton Storm (CME)' },
      description: {
        ar: `تدفق بروتونات عالي الطاقة عند ${env.heliocentricAu} AU يهدد الذاكرة والاتصالات إذا كان التدريع الإشعاعي ضعيفاً.`,
        en: `High-energy proton surge at ${env.heliocentricAu} AU is bombarding unshielded avionics and attenuating RF carrier.`,
      },
      affectedSubsystem: 'Radiation Shielding / Backup OBC / Comms',
      severity: params.loadout.radiation_shielding === 'rad_tantalum_vault' ? 'warning' : 'critical',
      triggerBasis: {
        ar: `إشعاع المدار ${env.radiationKradYr} krad/yr مقابل درع ${params.tradeOff.radiationToleranceKradYr} krad`,
        en: `Orbit flux ${env.radiationKradYr} krad/yr vs vault ${params.tradeOff.radiationToleranceKradYr} krad`,
      },
      recoveryCondition: {
        ar: 'الدخول لوضع الأمان أو التحويل للحاسوب المكرر RAD750.',
        en: 'Enter Safe Mode shielding or fail over to redundant RAD750 OBC.',
      },
      options: [
        {
          id: 'opt_safemode',
          label: { ar: 'تفعيل وضع الأمان وإغلاق الحساسات (Safe Mode)', en: 'Enter Safe Mode & Shed Sensors' },
          detail: { ar: 'يحمي الإلكترونيات بتكلفة بطء مؤقت (-10% طاقة).', en: 'Protects avionics; drops power -10% briefly.' },
          creditCost: 0,
          powerDelta: -10,
          hullDelta: -2,
          fuelDelta: 0,
          tempDeltaC: -3,
          o2Delta: 0,
          resolvesEvent: true,
          autonomousAllowed: true,
        },
        {
          id: 'opt_obc_failover',
          label: { ar: 'تحويل القيادة للحاسوب الاحتياطي وضخ الدروع', en: 'Failover to Backup OBC & Boost Shield' },
          detail: { ar: 'يستهلك 40 CR لإعادة المزامنة بدون خسارة بيانات.', en: '40 CR quick recovery preserving full telemetry.' },
          creditCost: 40,
          powerDelta: -15,
          hullDelta: 4,
          fuelDelta: 0,
          tempDeltaC: 2,
          o2Delta: 0,
          resolvesEvent: true,
          autonomousAllowed: false,
        },
        {
          id: 'opt_ignore',
          label: { ar: 'تجاهل العاصفة ومتابعة المسح', en: 'Ignore Storm & Keep Scanning' },
          detail: { ar: 'خطر تلف الهيكل (-18%) وهبوط البطارية (-16%).', en: 'Risks -18% hull radiation wear and -16% battery.' },
          creditCost: 0,
          powerDelta: -16,
          hullDelta: -18,
          fuelDelta: 0,
          tempDeltaC: 8,
          o2Delta: 0,
          resolvesEvent: true,
          autonomousAllowed: false,
        },
      ],
    }),
    micrometeorite: () => ({
      id: `evt_micro_${now}`,
      type: 'micrometeorite',
      triggeredAt: now,
      title: { ar: 'اصطدام نيزك دقيق (Micrometeorite)', en: 'Micrometeorite Hull Impact' },
      description: {
        ar: 'اختراق شظية حطام للهيكل الخارجي أدى لتسرب طفيف في خزان التبريد/الأكسجين.',
        en: 'High-velocity debris struck the outer thermal skin, stressing structural integrity.',
      },
      affectedSubsystem: 'Structural Bus / Thermal Shield',
      severity: 'critical',
      triggerBasis: {
        ar: `هامش الهيكل الحالي ${params.tradeOff.structuralMarginPct}% وسلامة ${Math.round(params.hullIntegrity)}%`,
        en: `Structural margin ${params.tradeOff.structuralMarginPct}% / Hull ${Math.round(params.hullIntegrity)}%`,
      },
      recoveryCondition: { ar: 'إصلاح ميكانيكي فوري أو عزل القسم المتضرر.', en: 'Patch thermal hull & equalize pressure.' },
      options: [
        {
          id: 'opt_patch',
          label: { ar: 'عزل المقصورة وإصلاح العازل (45 CR)', en: 'Seal Bulkhead & Patch Hull (45 CR)' },
          detail: { ar: 'يستعيد +14% هيكل ويمنع تسرب O2.', en: 'Restores +14% hull and stops O₂ leak.' },
          creditCost: 45,
          powerDelta: -6,
          hullDelta: 14,
          fuelDelta: 0,
          tempDeltaC: -2,
          o2Delta: 5,
          resolvesEvent: true,
          autonomousAllowed: false,
        },
        {
          id: 'opt_rcs_evade',
          label: { ar: 'مناورة تفادي RCS سريعة (-10% وقود)', en: 'Evasive RCS Burn (-10% Fuel)' },
          detail: { ar: 'يمنع الصدمات الثانوية على حساب الوقود.', en: 'Clears debris field using propellant.' },
          creditCost: 0,
          powerDelta: -4,
          hullDelta: -4,
          fuelDelta: -10,
          tempDeltaC: 0,
          o2Delta: -3,
          resolvesEvent: true,
          autonomousAllowed: true,
        },
      ],
    }),
    comms_interruption: () => ({
      id: `evt_comms_${now}`,
      type: 'comms_interruption',
      triggeredAt: now,
      title: { ar: 'انقطاع نافذة الاتصال (Comms Blackout)', en: 'Deep-Space Comms Interruption' },
      description: {
        ar: 'تشويش أيوني + عدم توافق حزمة المحطة الأرضية سبب تراكم بيانات الأجهزة في الذاكرة.',
        en: 'Signal fading broke carrier lock while instruments continue filling SSR memory.',
      },
      affectedSubsystem: 'Comms Antennas / Ground Segment / SSR',
      severity: 'warning',
      triggerBasis: {
        ar: `إنتاج البيانات ${params.tradeOff.dataGenMbDay} MB/d vs سعة بث ${params.tradeOff.commsCapacityMbDay} MB/d`,
        en: `Data rate ${params.tradeOff.dataGenMbDay} MB/d exceeds ${params.tradeOff.commsCapacityMbDay} MB/d link`,
      },
      recoveryCondition: { ar: 'تخزين مضغوط في SSR وتسليم الاتصال لمحطة 70م.', en: 'Buffer to SSR & hand off to 70m DSN.' },
      options: [
        {
          id: 'opt_buffer_retry',
          label: { ar: 'ضغط البيانات في SSR وإعادة المحاولة', en: 'Buffer in SSR & Re-Acquire Carrier' },
          detail: { ar: 'يحافظ على البيانات العلمية الأساسية بدون خسارة.', en: 'Queues priority science until clear window.' },
          creditCost: 0,
          powerDelta: -5,
          hullDelta: 0,
          fuelDelta: 0,
          tempDeltaC: 0,
          o2Delta: 0,
          resolvesEvent: true,
          autonomousAllowed: true,
        },
        {
          id: 'opt_boost_tx',
          label: { ar: 'ضخ طاقة لمضخم الإرسال (-14% بطارية)', en: 'Overdrive RF Amplifier (-14% Battery)' },
          detail: { ar: 'يرفع قوة الإشارة فوراً عبر التشويش.', en: 'Breaks through atmospheric fade immediately.' },
          creditCost: 15,
          powerDelta: -14,
          hullDelta: 0,
          fuelDelta: 0,
          tempDeltaC: 5,
          o2Delta: 0,
          resolvesEvent: true,
          autonomousAllowed: false,
        },
      ],
    }),
    battery_degradation: () => ({
      id: `evt_bat_${now}`,
      type: 'battery_degradation',
      triggeredAt: now,
      title: { ar: 'تدهور خلايا البطارية (Battery Drop)', en: 'Battery Cell Degradation' },
      description: {
        ar: 'انخفاض الجهد أثناء الظل المداري يهدد بإطفاء أجهزة الملاحة.',
        en: 'Cell impedance spike during orbital eclipse is dropping bus voltage.',
      },
      affectedSubsystem: 'Redundant Batteries / Power Bus',
      severity: 'warning',
      triggerBasis: { ar: `شحن البطارية ${Math.round(params.resources.battery)}%`, en: `Battery ${Math.round(params.resources.battery)}%` },
      recoveryCondition: { ar: 'تفعيل وضع توفير الطاقة أو تبديل البطارية الاحتياطية.', en: 'Activate Low-Power Mode or switch bank.' },
      options: [
        {
          id: 'opt_lowpwr',
          label: { ar: 'تفعيل Low-Power Mode (+18% شحن)', en: 'Switch to Low-Power Bus (+18% Battery)' },
          detail: { ar: 'يعيد موازنة البطارية بخفض الأجهزة غير الأساسية.', en: 'Recovers charge by throttling non-critical loads.' },
          creditCost: 0,
          powerDelta: 18,
          hullDelta: 0,
          fuelDelta: 0,
          tempDeltaC: -3,
          o2Delta: 0,
          resolvesEvent: true,
          autonomousAllowed: true,
        },
        {
          id: 'opt_recond',
          label: { ar: 'إعادة تهيئة الخلايا (30 CR)', en: 'Recondition Battery Bank (30 CR)' },
          detail: { ar: 'يستعيد +28% طاقة فوراً.', en: 'Restores +28% clean voltage margin.' },
          creditCost: 30,
          powerDelta: 28,
          hullDelta: 0,
          fuelDelta: 0,
          tempDeltaC: 1,
          o2Delta: 0,
          resolvesEvent: true,
          autonomousAllowed: false,
        },
      ],
    }),
    engine_malfunction: () => ({
      id: `evt_eng_${now}`,
      type: 'engine_malfunction',
      triggeredAt: now,
      title: { ar: 'اضطراب صمام الدفع الرئيسي (Engine Fault)', en: 'Main Thruster Valve Malfunction' },
      description: { ar: 'تذبذب ضغط غرفة الاحتراق يقلل دقة Δv ويزيد الاهتزاز.', en: 'Propellant injector oscillation is reducing specific impulse.' },
      affectedSubsystem: 'Propulsion / ADCS',
      severity: 'critical',
      triggerBasis: { ar: `هامش Δv ${params.tradeOff.deltaVMarginKms} km/s`, en: `Δv margin ${params.tradeOff.deltaVMarginKms} km/s` },
      recoveryCondition: { ar: 'إغلاق الصمام الاحتياطي وتعديل الدفع.', en: 'Switch to secondary feed manifold.' },
      options: [
        {
          id: 'opt_manifold',
          label: { ar: 'التبديل لصمام الوقود الاحتياطي (-8% وقود)', en: 'Swap to Redundant Manifold (-8% Fuel)' },
          detail: { ar: 'يعيد استقرار المحرك دون فقدان الهيكل.', en: 'Stabilizes Isp at small propellant purge cost.' },
          creditCost: 20,
          powerDelta: -5,
          hullDelta: 2,
          fuelDelta: -8,
          tempDeltaC: -4,
          o2Delta: 0,
          resolvesEvent: true,
          autonomousAllowed: true,
        },
      ],
    }),
    nav_error: () => ({
      id: `evt_nav_${now}`,
      type: 'nav_error',
      triggeredAt: now,
      title: { ar: 'انحراف ملاحي في المسار (Nav Drift)', en: 'Navigation Attitude Error' },
      description: { ar: 'تعمية متتبع النجوم أدت لانحراف بمقدار 2.4° عن مسار الكوكب.', en: 'Star tracker stray-light glare caused 2.4° guidance drift.' },
      affectedSubsystem: 'Navigation Sensors / Star Trackers / ADCS',
      severity: 'caution',
      triggerBasis: { ar: `حساس ${params.loadout.nav_sensors}`, en: `Sensor suite ${params.loadout.nav_sensors}` },
      recoveryCondition: { ar: 'معايرة الجيروسكوب وتصحيح التوجيه.', en: 'Recalibrate IMU & burn TCM trim.' },
      options: [
        {
          id: 'opt_cal_imu',
          label: { ar: 'معايرة متتبعات النجوم و AutoNav', en: 'Recalibrate Star Trackers & IMU' },
          detail: { ar: 'تصحيح هادئ باستخدام عجلات رد الفعل.', en: 'Zero-fuel slewing correction.' },
          creditCost: 0,
          powerDelta: -8,
          hullDelta: 0,
          fuelDelta: 0,
          tempDeltaC: 0,
          o2Delta: 0,
          resolvesEvent: true,
          autonomousAllowed: true,
        },
      ],
    }),
    thermal_failure: () => ({
      id: `evt_thm_${now}`,
      type: 'thermal_failure',
      triggeredAt: now,
      title: { ar: 'عطل حلقة التبريد الحراري (Thermal Loop)', en: 'Thermal Radiator Loop Fault' },
      description: { ar: 'صعود أو هبوط حاد في حرارة المقصورة عن النطاق المسموح.', en: 'Active thermal heat-pipe flow dropped across bus radiators.' },
      affectedSubsystem: 'Thermal Control',
      severity: 'critical',
      triggerBasis: { ar: `هامش حراري ${params.tradeOff.thermalMarginPct}% (${params.internalTempC}°C)`, en: `Thermal margin ${params.tradeOff.thermalMarginPct}%` },
      recoveryCondition: { ar: 'فتح المشعّات وتقليل أحمال الإلكترونيات.', en: 'Open louvers & shed high-wattage loads.' },
      options: [
        {
          id: 'opt_louver_reset',
          label: { ar: 'إعادة ضبط المشعّات + وضع الأمان', en: 'Cycle Thermal Louvers & Safe Bus' },
          detail: { ar: 'يعدّل الحرارة 14°C نحو الاستقرار.', en: 'Drives core temp 14°C back toward 20°C.' },
          creditCost: 25,
          powerDelta: -8,
          hullDelta: 0,
          fuelDelta: 0,
          tempDeltaC: params.internalTempC > 25 ? -16 : 16,
          o2Delta: 0,
          resolvesEvent: true,
          autonomousAllowed: true,
        },
      ],
    }),
    power_spike: () => ({
      id: `evt_pwr_${now}`,
      type: 'power_spike',
      triggeredAt: now,
      title: { ar: 'طفرة استهلاك طاقة غير متوقعة', en: 'Unexpected Power Bus Surge' },
      description: { ar: 'سحب تيار مفاجئ من أجهزة المسح والاتصالات يهدد بعجز الطاقة.', en: 'Simultaneous instrument + RF transmitter peak tripped breaker warning.' },
      affectedSubsystem: 'Power Bus / Solar Arrays',
      severity: 'warning',
      triggerBasis: { ar: `صافي الطاقة ${params.tradeOff.netPowerW} W`, en: `Net power ${params.tradeOff.netPowerW} W` },
      recoveryCondition: { ar: 'فصل الأجهزة الثانوية وإعادة توزيع ناقل الطاقة.', en: 'Shed secondary loads & rebalance bus.' },
      options: [
        {
          id: 'opt_shed',
          label: { ar: 'جدولة التشغيل المتناوب للأجهزة (+12% طاقة)', en: 'Time-Share Instruments (+12% Battery)' },
          detail: { ar: 'ينظم الحمل الكهربائي دون فقد المهمة.', en: 'Prevents bus brownout cleanly.' },
          creditCost: 0,
          powerDelta: 12,
          hullDelta: 0,
          fuelDelta: 0,
          tempDeltaC: -4,
          o2Delta: 0,
          resolvesEvent: true,
          autonomousAllowed: true,
        },
      ],
    }),
    dust_storm: () => ({
      id: `evt_dust_${now}`,
      type: 'dust_storm',
      triggeredAt: now,
      title: { ar: 'عاصفة غبار كوكبية تحجب الألواح الشمسية', en: 'Planetary Dust Storm Obscuring Solar' },
      description: { ar: 'تراكم الغبار الكوكبي خفض إنتاج الألواح الشمسية بنسبة 55%.', en: 'Fine iron-oxide dust coated solar wings (-55% power output).' },
      affectedSubsystem: 'Solar Arrays / Rover / Thermal',
      severity: 'critical',
      triggerBasis: { ar: `بيئة ${params.planetId} مع ألواح شمسية`, en: `${params.planetId} dust + solar power` },
      recoveryCondition: { ar: 'إزالة الغبار بالاهتزاز الكهروستاتيكي والتحويل للبطارية.', en: 'Run electrostatic wing shake & safe ops.' },
      options: [
        {
          id: 'opt_ed_clean',
          label: { ar: 'تنظيف الألواح بالاهتزاز الكهروستاتيكي (35 CR)', en: 'Electrostatic Dust Repel (35 CR)' },
          detail: { ar: 'يستعيد التوليد الشمسي (+15% بطارية).', en: 'Clears solar wings (+15% battery).' },
          creditCost: 35,
          powerDelta: 15,
          hullDelta: 2,
          fuelDelta: 0,
          tempDeltaC: -2,
          o2Delta: 0,
          resolvesEvent: true,
          autonomousAllowed: false,
        },
        {
          id: 'opt_hibernate',
          label: { ar: 'سبات ليلي حتى هدوء العاصفة', en: 'Enter Dust-Hibernate Low Power' },
          detail: { ar: 'يحافظ على البطارية لحين زوال الغبار.', en: 'Conserves reserves automatically.' },
          creditCost: 0,
          powerDelta: 8,
          hullDelta: -3,
          fuelDelta: 0,
          tempDeltaC: -5,
          o2Delta: 0,
          resolvesEvent: true,
          autonomousAllowed: true,
        },
      ],
    }),
    sensor_malfunction: () => ({
      id: `evt_sen_${now}`,
      type: 'sensor_malfunction',
      triggeredAt: now,
      title: { ar: 'خلل في الحساسات العلمية والمطياف', en: 'Science Sensor Calibration Fault' },
      description: { ar: 'تشوّه إشارة المستشعرات نتيجة الإشعاع أو غياب التكرار الحاسوبي.', en: 'Bit-flip noise corrupted primary spectrometer frame.' },
      affectedSubsystem: 'Science Instruments / Backup OBC',
      severity: 'caution',
      triggerBasis: { ar: `حاسوب ${params.loadout.backup_obc}`, en: `OBC config ${params.loadout.backup_obc}` },
      recoveryCondition: { ar: 'إعادة ضبط برمجي للحساسات وفحص ذاكرة ECC.', en: 'Flush sensor register & run self-test.' },
      options: [
        {
          id: 'opt_recal',
          label: { ar: 'إعادة تشغيل المطياف وفحص ECC', en: 'Power-Cycle Sensor & ECC Scrub' },
          detail: { ar: 'يستغرق لحظات ويكلف -6% بطارية.', en: 'Restores clean calibration at -6% battery.' },
          creditCost: 0,
          powerDelta: -6,
          hullDelta: 0,
          fuelDelta: 0,
          tempDeltaC: 0,
          o2Delta: 0,
          resolvesEvent: true,
          autonomousAllowed: true,
        },
      ],
    }),
    fuel_leak: () => ({
      id: `evt_leak_${now}`,
      type: 'fuel_leak',
      triggeredAt: now,
      title: { ar: 'تسرب في خط الوقود الدافع (Fuel Leak)', en: 'Propellant Feed Line Micro-Leak' },
      description: { ar: 'هبوط ضغط الهيدرازين يهدد بضياع احتياطي المناورة Δv.', en: 'Micro-fissure in thruster manifold is venting delta-V reserve.' },
      affectedSubsystem: 'Propulsion',
      severity: 'critical',
      triggerBasis: { ar: `هامش Δv منخفض (${params.tradeOff.deltaVMarginKms} km/s)`, en: `Tight Δv margin` },
      recoveryCondition: { ar: 'عزل الصمام المتضرر والاعتماد على خط العبور الاحتياطي.', en: 'Close crossfeed isolation valve.' },
      options: [
        {
          id: 'opt_isolate',
          label: { ar: 'إغلاق صمام العزل وإعادة الضغط (40 CR)', en: 'Close Isolation Valve & Seal (40 CR)' },
          detail: { ar: 'يوقف التسرب ويعيد +12% وقود متاح.', en: 'Halts leak & recovers +12% pressure.' },
          creditCost: 40,
          powerDelta: -4,
          hullDelta: 0,
          fuelDelta: 12,
          tempDeltaC: 0,
          o2Delta: 0,
          resolvesEvent: true,
          autonomousAllowed: false,
        },
        {
          id: 'opt_vent',
          label: { ar: 'تبديل الخزان يدوياً (-14% وقود)', en: 'Switch Tank Bank (-14% Fuel)' },
          detail: { ar: 'إصلاح مجاني بخسارة الوقود المتسرب.', en: 'Zero-credit fix accepting lost tank fraction.' },
          creditCost: 0,
          powerDelta: 0,
          hullDelta: 0,
          fuelDelta: -14,
          tempDeltaC: 0,
          o2Delta: 0,
          resolvesEvent: true,
          autonomousAllowed: true,
        },
      ],
    }),
    equipment_overheat: () => ({
      id: `evt_heat_${now}`,
      type: 'equipment_overheat',
      triggeredAt: now,
      title: { ar: 'سخونة زائدة في مضخم الإرسال والأجهزة', en: 'Equipment Thermal Overheat' },
      description: {
        ar: `حرارة المركبة (${params.internalTempC}°C) تقترب من الحد الأقصى الآمن (+52°C).`,
        en: `Bus internal temperature (${params.internalTempC}°C) exceeded safe continuous rating (+52°C).`,
      },
      affectedSubsystem: 'Thermal Control / Comms Amplifier',
      severity: 'critical',
      triggerBasis: { ar: `الحرارة الداخلية ${params.internalTempC}°C`, en: `Internal temp ${params.internalTempC}°C` },
      recoveryCondition: { ar: 'تفعيل التبريد وتخفيض دورة الإرسال.', en: 'Dump heat via radiators & throttle TX.' },
      options: [
        {
          id: 'opt_cool',
          label: { ar: 'توجيه المشعّات للظل وتفعيل Low-Power', en: 'Slew Radiators to Shade & Throttle TX' },
          detail: { ar: 'يخفض الحرارة 18°C فوراً.', en: 'Cools bus by -18°C immediately.' },
          creditCost: 0,
          powerDelta: -6,
          hullDelta: 0,
          fuelDelta: 0,
          tempDeltaC: -18,
          o2Delta: 0,
          resolvesEvent: true,
          autonomousAllowed: true,
        },
      ],
    }),
  };

  return builders[pickedType]();
}

// Feature 19: Autonomous Spacecraft Rule Evaluator
export function evaluateAutonomousAction(params: {
  rules: AutonomousRulesConfig;
  battery: number;
  internalTempC: number;
  commsSignal: number;
  hullIntegrity: number;
  operationalMode: OperationalMode;
  activeEvent: ActiveMissionEvent | null;
}): {
  triggeredRuleName?: Record<Language, string>;
  nextMode?: OperationalMode;
  autoResolveOptionId?: string;
  tempAdjustmentC?: number;
} | null {
  if (!params.rules.enabled) return null;

  if (
    params.activeEvent &&
    params.activeEvent.severity === 'critical' &&
    params.rules.onCriticalFailureEnterSafeMode
  ) {
    const autoOpt = params.activeEvent.options.find((o) => o.autonomousAllowed);
    if (autoOpt) {
      return {
        triggeredRuleName: {
          ar: `قاعدة الطوارئ الحرجة: تنفيذ «${autoOpt.label.ar}» والتحويل لـ Safe Mode`,
          en: `Critical Policy: Executed "${autoOpt.label.en}" & entered Safe Mode`,
        },
        nextMode: 'safe',
        autoResolveOptionId: autoOpt.id,
      };
    }
  }

  if (
    params.battery <= params.rules.lowBatteryThresholdPct &&
    params.operationalMode !== 'low_power' &&
    params.operationalMode !== 'safe'
  ) {
    return {
      triggeredRuleName: {
        ar: `قاعدة البطارية المنخفضة (≤${params.rules.lowBatteryThresholdPct}%): تفعيل Low-Power تلقائياً`,
        en: `Low Battery Policy (≤${params.rules.lowBatteryThresholdPct}%): Auto-switched to Low-Power Mode`,
      },
      nextMode: 'low_power',
    };
  }

  if (params.internalTempC >= params.rules.overheatThresholdC) {
    return {
      triggeredRuleName: {
        ar: `قاعدة الحرارة الزائدة (≥${params.rules.overheatThresholdC}°C): خفض الحمل وتبريد فوري`,
        en: `Overheat Policy (≥${params.rules.overheatThresholdC}°C): Shed burst load & dumped heat`,
      },
      nextMode: 'safe',
      tempAdjustmentC: -12,
    };
  }

  if (
    params.commsSignal < 22 &&
    params.rules.onCommsLossStoreAndRetry &&
    params.operationalMode === 'comms_downlink'
  ) {
    return {
      triggeredRuleName: {
        ar: 'قاعدة فقد الاتصال: التحويل للتخزين المؤقت SSR وانتظار النافذة',
        en: 'Comms Loss Policy: Buffering science in SSR until carrier lock returns',
      },
      nextMode: 'nominal',
    };
  }

  return null;
}

// Feature 4: Educational Failure Investigation Generator
export function generateFailureInvestigationReport(params: {
  reason: Record<Language, string>;
  planetId: PlanetId;
  loadout: AdvancedLoadout;
  tradeOff: EngineeringTradeoffReport;
  resources: ResourcesState;
  fuelPct: number;
  hullIntegrity: number;
  internalTempC: number;
  timelineLog: MissionTimelineLogEntry[];
}): FailureInvestigationReport {
  const failedSub =
    params.resources.suitO2 <= 0
      ? 'Life Support / EVA O2'
      : params.hullIntegrity <= 0
        ? 'Structural Bus & Thermal Hull'
        : params.resources.battery <= 0
          ? 'Power Generation & Batteries'
          : params.fuelPct <= 0
            ? 'Propulsion & Δv Reserve'
            : 'Flight Operations & Critical Redundancy';

  const contributing: Array<Record<Language, string>> = params.tradeOff.conflicts.map((c) => ({
    ar: `${c.title.ar}: ${c.explanation.ar}`,
    en: `${c.title.en}: ${c.explanation.en}`,
  }));

  if (contributing.length === 0) {
    contributing.push({
      ar: 'تراكم الضرر التشغيلي أو نفاد الموارد في البيئة السطحية أو الطوارئ المتزامنة.',
      en: 'Cumulative operational hazard exposure or unrecovered resource depletion in surface/flight phase.',
    });
  }

  const improvements: Array<Record<Language, string>> = params.tradeOff.conflicts.map((c) => c.fixHint);
  if (improvements.length === 0) {
    improvements.push({
      ar: 'فعّل قواعد التشغيل الذاتي (Autonomous Rules) وعد إلى المركبة قبل وصول O2 إلى 20%.',
      en: 'Enable Autonomous Safe Mode rules and return to spacecraft umbilical before O₂ drops below 20%.',
    });
  }

  return {
    id: `fail_inv_${Date.now()}`,
    generatedAt: Date.now(),
    summary: params.reason,
    failedSubsystem: failedSub,
    rootCause: {
      ar: `تعطل نظام «${failedSub}» نتيجة الضغط البيئي عند ${params.planetId} مع صافي طاقة ${params.tradeOff.netPowerW}W وهامش حراري ${params.tradeOff.thermalMarginPct}%.`,
      en: `Subsystem "${failedSub}" failed under ${params.planetId} conditions (Net Power: ${params.tradeOff.netPowerW}W, Thermal Margin: ${params.tradeOff.thermalMarginPct}%).`,
    },
    contributingDecisions: contributing,
    preFailureSnapshot: {
      battery: Math.round(params.resources.battery),
      fuelPct: Math.round(params.fuelPct),
      hullIntegrity: Math.round(params.hullIntegrity),
      internalTempC: Math.round(params.internalTempC),
      suitO2: Math.round(params.resources.suitO2),
      commsSignal: Math.round(params.resources.commsSignal),
      dataStorageMb: Math.round(params.resources.dataStorage),
      netPowerW: params.tradeOff.netPowerW,
    },
    importantTimeline: params.timelineLog.slice(-8),
    recoveryPossibilities: [
      {
        ar: 'إعادة الإنعاش داخل المركبة واستعادة الموارد أو إعادة محاولة حملة البقاء.',
        en: 'Respawn at Spacecraft Umbilical Pad or reset Survival Emergency deck.',
      },
      {
        ar: 'الدخول إلى «ورشة الأنظمة 14» لترقية الدرع والمفاعل ثم إعادة اختبار What-If.',
        en: 'Open 14-Subsystem Lab to upgrade power/thermal margin, then validate via What-If Simulator.',
      },
    ],
    recommendedImprovements: improvements,
  };
}

// Feature 16: Mission Performance Report Generator
export function buildMissionPerformanceReport(params: {
  versionLabel: string;
  planetId: PlanetId;
  objective: string;
  loadout: AdvancedLoadout;
  tradeOff: EngineeringTradeoffReport;
  resources: ResourcesState;
  fuelPct: number;
  hullIntegrity: number;
  score: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'F';
  incidents: string[];
}): MissionPerformanceReport {
  const powerEff = Math.max(
    0,
    Math.min(100, Math.round((params.tradeOff.powerGenW / Math.max(1, params.tradeOff.powerDrawW)) * 75))
  );
  const commsPerf =
    params.tradeOff.dataGenMbDay <= 0
      ? 100
      : Math.min(100, Math.round((params.tradeOff.commsCapacityMbDay / params.tradeOff.dataGenMbDay) * 100));

  return {
    id: `rep_${Date.now()}`,
    versionLabel: params.versionLabel,
    timestamp: Date.now(),
    planetId: params.planetId,
    objective: params.objective,
    finalConfiguration: { ...params.loadout },
    orbitSummary: `${params.planetId.toUpperCase()} · ${params.tradeOff.transferStrategy.toUpperCase()} (${params.tradeOff.deltaVRequiredKms} km/s)`,
    scienceAchieved: Math.round(params.tradeOff.scienceValue + params.resources.dataTransmitted * 0.2),
    resourcesConsumedPct: Math.max(5, Math.min(100, Math.round(100 - (params.resources.battery + params.fuelPct) / 2))),
    totalCostM: params.tradeOff.totalCostM,
    budgetCeilingM: params.tradeOff.maxBudgetM,
    powerEfficiencyPct: powerEff,
    commsPerformancePct: commsPerf,
    missionLifetimeYrs: params.tradeOff.missionLifetimeYrs,
    majorIncidents: params.incidents,
    subsystemStatus: [
      {
        name: 'Propulsion & Fuel',
        status: params.fuelPct > 35 && params.tradeOff.deltaVMarginKms >= 0 ? 'NOMINAL' : params.fuelPct > 10 ? 'DEGRADED' : 'FAILED',
        healthPct: Math.round(params.fuelPct),
      },
      {
        name: 'Power & Thermal',
        status: params.tradeOff.netPowerW >= 0 && params.tradeOff.thermalMarginPct >= 40 ? 'NOMINAL' : params.resources.battery > 15 ? 'DEGRADED' : 'FAILED',
        healthPct: Math.round(params.resources.battery),
      },
      {
        name: 'Comms & DSN',
        status: params.resources.commsSignal >= 50 && commsPerf >= 80 ? 'NOMINAL' : params.resources.commsSignal > 15 ? 'DEGRADED' : 'FAILED',
        healthPct: Math.round(params.resources.commsSignal),
      },
      {
        name: 'Structures & Shield',
        status: params.hullIntegrity >= 60 ? 'NOMINAL' : params.hullIntegrity > 15 ? 'DEGRADED' : 'FAILED',
        healthPct: Math.round(params.hullIntegrity),
      },
    ],
    finalGrade: params.grade,
    score: params.score,
    recommendations:
      params.tradeOff.conflicts.length > 0
        ? params.tradeOff.conflicts.map((c) => c.fixHint)
        : [
            {
              ar: 'أداء متزن عبر كل الأنظمة — جرّب بعثة أصعب نحو أوروبا أو أورانوس أو نبتون.',
              en: 'Balanced architecture — challenge outer-system targets like Europa, Uranus or Neptune.',
            },
          ],
  };
}
