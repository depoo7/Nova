import type {
  Language,
  PlanetData,
  ResourcesState,
  ShipMetrics,
  SkyMood,
  SpaceWeather,
} from '../types/game';

export const UI_COPY = {
  brandTitle: { ar: 'نوفا: ما وراء المجهول', en: 'NOVA: Beyond the Unknown' },
  brandTagline: {
    ar: 'المكوك الفضائي (10 أقسام) • قيادة واقعية للكواكب • سكاي AI (كتابة عربية / صوت إنجليزي)',
    en: 'Multi-Deck Space Shuttle • Realistic Interplanetary Flight • Personalized Sky AI',
  },
  langToggle: { ar: 'English', en: 'عربي' },

  // Main Menu
  menuSubtitle: {
    ar: 'تعيش وتعمل داخل مكوكك الفضائي العملاق متعدد الأقسام (10 أقسام و10 متخصصين) — قمرة القيادة، مختبر التلسكوب وCubeSat، طاولة GMAT، الزراعة المائية، العيادة، عنبر الروفر، والهبوط على الكواكب.',
    en: 'Command a 10-compartment NASA-style Space Shuttle Orbiter with 10 live crew specialists—flight deck, GMAT holo-table, telescope & CubeSat lab, hydroponics, med bay, MDL reactor, and 6x6 rover cargo bay.',
  },
  selectDifficulty: { ar: 'مستوى الصعوبة', en: 'Mission Difficulty' },
  difficulties: {
    Cadet: {
      title: { ar: 'مبتدئ (Cadet)', en: 'Cadet' },
      desc: { ar: 'ميزانية عالية واستهلاك طاقة لطيف.', en: 'Generous budget & gentle weather drain.' },
    },
    Commander: {
      title: { ar: 'قائد (Commander)', en: 'Commander' },
      desc: { ar: 'محاكاة متوازنة للملاحة والعواصف.', en: 'Balanced orbital flight & storm physics.' },
    },
    Veteran: {
      title: { ar: 'مخضرم (Veteran)', en: 'Veteran' },
      desc: { ar: 'ظروف فضائية قاسية لأمهر القادة.', en: 'Harsh space weather & tight fuel margins.' },
    },
  },
  newExpedition: { ar: 'بدء رحلة استكشاف جديدة', en: 'New Expedition' },
  continueSave: { ar: 'متابعة المهمة المحفوظة', en: 'Continue Saved Mission' },
  coopOverview: { ar: 'طاقم المكوك البشري', en: 'Shuttle Science Crew' },

  // Character Creator
  creatorTitle: { ar: 'هوية القائد وتجهيز البدلة الفضائية', en: 'Commander Identity & EVA Suit' },
  creatorSub: {
    ar: 'يناديك «سكاي» بهذا الاسم (الواجهة عربية بالكامل بينما الصوت بالإنجليزية الواضحة).',
    en: 'Sky AI calls you personally by this name with crisp English voice & bilingual HUD.',
  },
  commanderNameLabel: { ar: 'اسم القائد / اسمك (يناديك به سكاي)', en: 'Your Commander Name' },
  commanderNamePlaceholder: { ar: 'أدخل اسمك هنا... (مثال: أحمد)', en: 'Enter your name... (e.g. Alex)' },
  genderLabel: { ar: 'اختر شخصية القائد', en: 'Choose Character' },
  maleLabel: { ar: 'شخصية ذكر', en: 'Male Character' },
  femaleLabel: { ar: 'شخصية أنثى', en: 'Female Character' },
  specializationLabel: { ar: 'التخصص الميداني', en: 'Mission Specialization' },
  suitModelLabel: { ar: 'طراز بدلة EVA', en: 'EVA Suit Chassis' },
  primaryColorLabel: { ar: 'لون البدلة الأساسي', en: 'Primary Suit Armor' },
  visorColorLabel: { ar: 'لون قناع الخوذة', en: 'Helmet Visor Tint' },
  helmetToggle: { ar: 'ارتداء الخوذة الفضائية', en: 'Helmet Equipped' },
  enterBridgeBtn: { ar: 'دخول المكوك الفضائي', en: 'Board Space Shuttle Deck' },
  backToMenu: { ar: 'عودة للقائمة', en: 'Back' },

  // Scene & Modes
  modes: {
    interior: { ar: 'داخل المكوك (الأساس)', en: 'Shuttle Deck (Home)' },
    spaceflight: { ar: 'قيادة المكوك بالفضاء', en: 'Pilot Space Shuttle' },
    planet: { ar: 'سطح الكوكب والروفر', en: 'Planet & Rover' },
    'mission-viz': { ar: 'تصور المهمة GMAT', en: 'Mission Viz (GMAT)' },
    builder: { ar: 'معاينة المكوك 3D', en: 'Shuttle Hangar' },
  },

  telescopeLabBtn: { ar: 'مختبر التلسكوب و CubeSat', en: 'Telescope & CubeSat' },
  missionVizBtn: { ar: 'تصور GMAT 3D', en: 'GMAT Mission Viz' },

  // Weather
  weatherLabel: { ar: 'طقس الفضاء', en: 'Space Weather' },
  weatherClickHint: { ar: 'اضغط لتبديل الطقس الفضائي', en: 'Click to cycle space weather' },
  weather: {
    clear: {
      name: { ar: 'فضاء هادئ', en: 'Clear Void' },
      badge: { ar: 'شحن الدروع +2.5/ث', en: 'Shields +2.5/s' },
    },
    solar_flare: {
      name: { ar: 'توهج شمسي', en: 'Solar Flare' },
      badge: { ar: 'سرعة +22% • درع -3.5/ث', en: 'Speed +22% • Shield -3.5/s' },
    },
    asteroid_squall: {
      name: { ar: 'عاصفة كويكبات', en: 'Asteroid Squall' },
      badge: { ar: 'سرعة -18% • صخور متحركة', en: 'Speed -18% • Heavy Debris' },
    },
    ion_storm: {
      name: { ar: 'عاصفة أيونية', en: 'Ion Storm' },
      badge: { ar: 'سرعة +18% • تبريد أسرع', en: 'Speed +18% • Fast Plasma' },
    },
  },

  // HUD & Actions
  returnBridgeBtn: { ar: 'العودة داخل المكوك', en: 'Return Inside Shuttle' },
  boardShipBtn: { ar: 'أقلع بالمكوك الفضائي', en: 'Take Helm & Launch Shuttle' },
  launchShipBtn: { ar: 'إقلاع بالمكوك للفضاء', en: 'Launch Space Shuttle' },
  landPlanetBtn: { ar: 'هبوط واقعي على الكوكب', en: 'Descend & Land' },
  autopilotBtn: { ar: 'طيار آلي للهدف', en: 'Autopilot' },
  cancelAutopilot: { ar: 'إلغاء الطيار الآلي', en: 'Manual Control' },
  toggleRoverBtn: { ar: 'الروفر 6×6 [R]', en: 'Rover [R]' },
  barrelRollBtn: { ar: 'مناورة التفاف [R]', en: 'Roll [R]' },
  firePlasmaBtn: { ar: 'بلازما [F]', en: 'Plasma [F]' },
  scanSiteBtn: { ar: 'فحص / جمع [F]', en: 'Scan / Collect [F]' },
  boostBtn: { ar: 'دفع فائق [Shift]', en: 'Burn [Shift]' },
  cameraBtn: { ar: 'المنظور [C]', en: 'View [C]' },
  touchPadBtn: { ar: 'التحكم باللمس', en: 'Controls' },
  tabletBtn: { ar: 'اللوحة التكتيكية [Tab]', en: 'Tablet [Tab]' },
  mapBtn: { ar: 'الخريطة [M]', en: 'Map [M]' },
  skyBtn: { ar: 'سكاي AI', en: 'Sky AI' },
  guideBtn: { ar: 'الدليل [G]', en: 'Guide [G]' },
  pauseBtn: { ar: 'إعدادات [Esc]', en: 'Settings' },
  mergeMouseBtn: { ar: 'دمج الماوس [Alt]', en: 'Lock Mouse [Alt]' },
  releaseMouseBtn: { ar: 'إظهار الماوس [Alt]', en: 'Show Cursor [Alt]' },
  dashboardBtn: { ar: 'داش بورد البهو', en: 'Atrium Dashboard' },
  mode2dBtn: { ar: 'تحويل اللعبة 2D', en: '2D Game Mode' },
  buildOutpostBtn: { ar: 'بناء قاعدة [B]', en: 'Build Outpost [B]' },

  // Tablet Tabs
  tabOverview: { ar: 'المهمة و CML 1-4', en: 'Mission & CML 1-4' },
  tabPlanets: { ar: 'الكواكب والرحلات', en: 'Planets & Travel' },
  tabBuilder: { ar: 'هندسة MDL والسفينة', en: 'MDL & Ship Design' },
  tabComms: { ar: 'شبكة DSN', en: 'Comms & DSN' },
  tabCrew: { ar: 'الطاقم البشري', en: 'Crew Roster' },

  // Telemetry Labels
  speedLabel: { ar: 'السرعة', en: 'VEL' },
  shieldLabel: { ar: 'الدروع', en: 'SHLD' },
  batteryLabel: { ar: 'الطاقة', en: 'PWR' },
  o2Label: { ar: 'الأكسجين', en: 'O2' },
  dataLabel: { ar: 'البيانات', en: 'DATA' },
  creditsLabel: { ar: 'الرصيد', en: 'CR' },
  massLabel: { ar: 'الكتلة', en: 'MASS' },
  deltaVLabel: { ar: 'دلتا-V', en: 'DELTA-V' },
  reliabilityLabel: { ar: 'الاعتمادية', en: 'REL' },
} as const;

export function getDisplayCommander(name: string, lang: Language): string {
  const clean = name.trim();
  if (!clean) return lang === 'ar' ? 'القائد' : 'Commander';
  return clean;
}

export function getEnglishCommander(name: string): string {
  const clean = name.trim();
  return clean || 'Commander';
}

export function skyGreeting(
  name: string,
  lang: Language
): { text: string; voiceText: string } {
  const nLocal = getDisplayCommander(name, lang);
  const nEn = getEnglishCommander(name);
  const voiceText = `Welcome aboard the NOVA Space Shuttle Orbiter, ${nEn}. Ten shuttle compartments and ten crew specialists are online. Explore the Telescope lab, hydroponics dome, med bay, GMAT holo-table, or take the flight deck helm to launch.`;
  const text =
    lang === 'ar'
      ? `أهلاً بك على متن المكوك الفضائي نوفا يا ${nLocal}! المكوك يضم 10 أقسام متكاملة و10 متخصصين — تجوّل بـ WASD أو انتقل مباشرة لأي قسم، أو افتح داش بورد البهو لإدارة الطاقم أو قمرة القيادة [E] للإقلاع!`
      : voiceText;
  return { text, voiceText };
}

export function skyEventText(
  event:
    | 'return_bridge'
    | 'main_dashboard'
    | 'control_2d'
    | 'lounge_coffee'
    | 'bio_harvest'
    | 'med_check'
    | 'cargo_prep'
    | 'comms_desk'
    | 'launch'
    | 'arrive_orbit'
    | 'land_planet'
    | 'rover_enter'
    | 'rover_exit'
    | 'sample'
    | 'crater'
    | 'science'
    | 'monolith'
    | 'ring'
    | 'asteroid_mined'
    | 'asteroid_hit'
    | 'barrel_roll'
    | 'transmit'
    | 'telescope_success'
    | 'telescope_mismatch'
    | 'cubesat_advance'
    | 'mission_viz'
    | 'weather_solar_flare'
    | 'weather_asteroid_squall'
    | 'weather_ion_storm'
    | 'weather_clear',
  name: string,
  lang: Language,
  planet?: PlanetData,
  extraLabel?: string
): { text: string; voiceText: string; mood: SkyMood } {
  const nLocal = getDisplayCommander(name, lang);
  const nEn = getEnglishCommander(name);
  const pLocal = planet ? planet.name[lang] : '';
  const pEn = planet ? planet.name.en : 'the planet';

  switch (event) {
    case 'return_bridge': {
      const voiceText = `Welcome back inside the cabin, ${nEn}. Airlock sealed and cabin atmosphere stabilized.`;
      return {
        mood: 'calm',
        voiceText,
        text:
          lang === 'ar'
            ? `أهلاً بعودتك داخل مقصورة المكوك يا ${nLocal}. تم إغلاق بوابة الضغط وتثبيت الهواء الداخلي.`
            : voiceText,
      };
    }
    case 'main_dashboard': {
      const voiceText = `Shuttle master telemetry dashboard online, ${nEn}. All ten rooms and specialists are reporting nominal status.`;
      return {
        mood: 'scanning',
        voiceText,
        text:
          lang === 'ar'
            ? `تم فتح داش بورد البهو الرئيسية يا ${nLocal}! يمكنك متابعة تفاصيل الغرف العشر والمتخصصين وأنظمة المكوك مباشرة.`
            : voiceText,
      };
    }
    case 'control_2d': {
      const voiceText = `Switching to full interactive 2D tactical mode, ${nEn}. You can pilot, mine asteroids, drive the rover, and manage all rooms in 2D.`;
      return {
        mood: 'excited',
        voiceText,
        text:
          lang === 'ar'
            ? `تم تحويل اللعبة إلى وضع 2D الكامل يا ${nLocal}! يمكنك التحليق وتفتيت الكويكبات وقيادة الروفر وإدارة كل الغرف في 2D.`
            : voiceText,
      };
    }
    case 'lounge_coffee': {
      const voiceText = `Nothing beats warm coffee while watching the Milky Way, ${nEn}. Suit oxygen and crew stamina restored.`;
      return {
        mood: 'happy',
        voiceText,
        text:
          lang === 'ar'
            ? `فنجان قهوة دافئ أمام مشهد المجرة لا يُقدّر بثمن يا ${nLocal}! تم تجديد طاقتك والأكسجين بالكامل.`
            : voiceText,
      };
    }
    case 'bio_harvest': {
      const voiceText = `Hydroponics bio-dome harvest complete, ${nEn}. Oxygen reserves topped to 100 percent and botanical telemetry logged.`;
      return {
        mood: 'happy',
        voiceText,
        text:
          lang === 'ar'
            ? `تم حصاد قبة الزراعة المائية بنجاح يا ${nLocal}! تم تعبئة الأكسجين 100% وتسجيل +40 MB بيانات حيوية (+55 رصيد).`
            : voiceText,
      };
    }
    case 'med_check': {
      const radText = extraLabel || 'nominal';
      const voiceText = `Biomedical radiation check complete, ${nEn}. Ambient dose is ${radText}. Crew vitals and morale stabilized.`;
      return {
        mood: 'calm',
        voiceText,
        text:
          lang === 'ar'
            ? `تم الفحص الطبي والإشعاعي في العيادة يا ${nLocal} (الإشعاع: ${radText}). مؤشرات الطاقم الحيوية ممتازة!`
            : voiceText,
      };
    }
    case 'cargo_prep': {
      const voiceText = `Shuttle payload bay and Canadarm inspected, ${nEn}. Six-wheel rover battery topped up for planetary touchdown.`;
      return {
        mood: 'scanning',
        voiceText,
        text:
          lang === 'ar'
            ? `تم فحص عنبر الحمولة والذراع الآلية والروفر 6×6 يا ${nLocal}! تم شحن البطارية وتأمين +45 رصيد.`
            : voiceText,
      };
    }
    case 'comms_desk': {
      const stationName = extraLabel || 'Goldstone DSN';
      const voiceText = `Lieutenant Aria Sato reporting from Deep Space Comms, ${nEn}. Telemetry locked onto ${stationName} antenna array.`;
      return {
        mood: 'happy',
        voiceText,
        text:
          lang === 'ar'
            ? `الملازم آريا من قسم اتصالات DSN يا ${nLocal}: البث متصل بقوة مع محطة ${stationName} الأرضية!`
            : voiceText,
      };
    }
    case 'launch': {
      const voiceText = `Thrusters engaged, ${nEn}. You have full manual control at the helm. Steer with W A S D, or engage autopilot toward any planet.`;
      return {
        mood: 'excited',
        voiceText,
        text:
          lang === 'ar'
            ? `تم الإقلاع من المحطة المدارية يا ${nLocal}! أنت الآن تقود المركبة بالفضاء — استخدم WASD وShift، واضغط C لقمرة القيادة الواقعية أو اختر أي كوكب من الرادار.`
            : voiceText,
      };
    }
    case 'arrive_orbit': {
      const voiceText = `We have entered stable orbit around ${pEn}, ${nEn}. Press E whenever you are ready to touch down on the surface.`;
      return {
        mood: 'happy',
        voiceText,
        text:
          lang === 'ar'
            ? `دخلنا مدار ${pLocal} بنجاح يا ${nLocal}! ${planet?.discoveryFact.ar ?? ''} يمكنك الهبوط على السطح الآن عبر [E].`
            : `We've entered orbit around ${pEn}, ${nLocal}! ${planet?.discoveryFact.en ?? ''} Press [E] to descend to the surface.`,
      };
    }
    case 'land_planet': {
      const voiceText = `Touchdown confirmed on ${pEn}, ${nEn}. Survey craters and science sites, or press R to drive your six-wheel rover.`;
      return {
        mood: 'happy',
        voiceText,
        text:
          lang === 'ar'
            ? `هبوط سلس على سطح ${pLocal} يا ${nLocal}! استكشف الفوهات والمعادن أو اضغط R لقيادة المركبة الجوالة 6×6.`
            : voiceText,
      };
    }
    case 'rover_enter': {
      const voiceText = `Rover drive systems online, ${nEn}. Six-wheel suspension calibrated for rough terrain.`;
      return {
        mood: 'excited',
        voiceText,
        text:
          lang === 'ar'
            ? `المركبة الجوالة 6×6 جاهزة تحت قيادتك يا ${nLocal}!`
            : voiceText,
      };
    }
    case 'rover_exit': {
      const voiceText = `Stepping out on foot, ${nEn}. Monitor your suit oxygen and scan samples nearby.`;
      return {
        mood: 'calm',
        voiceText,
        text:
          lang === 'ar'
            ? `خرجتَ ببدلة EVA يا ${nLocal}. استخدم [F] لفحص العينات وقربك من المركبة للعودة.`
            : voiceText,
      };
    }
    case 'sample': {
      const voiceText = `Specimen logged, ${nEn}. Mineral telemetry saved to ship storage.`;
      return {
        mood: 'happy',
        voiceText,
        text:
          lang === 'ar'
            ? `عينة رائعة يا ${nLocal}! تم تخزين القراءات المعدنية في الذاكرة.`
            : voiceText,
      };
    }
    case 'crater': {
      const voiceText = `Geological crater survey complete, ${nEn}.`;
      return {
        mood: 'scanning',
        voiceText,
        text:
          lang === 'ar'
            ? `تم مسح الفوهة الجيولوجية بنجاح يا ${nLocal}!`
            : voiceText,
      };
    }
    case 'science': {
      const voiceText = `Scientific station telemetry uploaded, ${nEn}.`;
      return {
        mood: 'excited',
        voiceText,
        text:
          lang === 'ar'
            ? `ممتاز يا ${nLocal}! تم تحميل بيانات محطة الرصد العلمية.`
            : voiceText,
      };
    }
    case 'monolith': {
      const voiceText = `Incredible discovery, ${nEn}! That is the authentic 2089 harmonic monolith! Check your decision protocol.`;
      return {
        mood: 'excited',
        voiceText,
        text:
          lang === 'ar'
            ? `يا إلهي يا ${nLocal}! هذه مسلّة إشارة 2089 الحقيقية — اختر مصير الاكتشاف الآن!`
            : voiceText,
      };
    }
    case 'ring': {
      const voiceText = `Clean pass through the warp ring, ${nEn}. Shields boosted plus 22 percent.`;
      return {
        mood: 'excited',
        voiceText,
        text:
          lang === 'ar'
            ? `مرور مثالي في حلقة التسارع يا ${nLocal}! تم شحن الدروع +22%.`
            : voiceText,
      };
    }
    case 'asteroid_mined': {
      const voiceText = `Direct plasma hit, ${nEn}. Harvested rare asteroid ore.`;
      return {
        mood: 'happy',
        voiceText,
        text:
          lang === 'ar'
            ? `إصابة دقيقة يا ${nLocal}! استخرجنا معادن فضائية (+45 رصيد).`
            : voiceText,
      };
    }
    case 'asteroid_hit': {
      const voiceText = `Warning, ${nEn}! Hull impact detected. Trigger a barrel roll with R to evade debris.`;
      return {
        mood: 'warning',
        voiceText,
        text:
          lang === 'ar'
            ? `احذر يا ${nLocal}! اصطدام بصخرة فضائية — استخدم [R] للمناورة وتفاديها!`
            : voiceText,
      };
    }
    case 'barrel_roll': {
      const voiceText = `Clean evasive roll, ${nEn}.`;
      return {
        mood: 'excited',
        voiceText,
        text:
          lang === 'ar'
            ? `مناورة جوية بارعة يا ${nLocal}!`
            : voiceText,
      };
    }
    case 'transmit': {
      const voiceText = `Deep Space Network uplink complete, ${nEn}. Data transmitted to Earth.`;
      return {
        mood: 'happy',
        voiceText,
        text:
          lang === 'ar'
            ? `تم إرسال حزمة البيانات إلى الأرض بنجاح يا ${nLocal}!`
            : voiceText,
      };
    }
    case 'telescope_success': {
      const analog = extraLabel || 'NASA Observatory';
      const voiceText = `Optical calibration locked, ${nEn}! Your telescope architecture matches ${analog} and has been deployed to deep space orbit.`;
      return {
        mood: 'excited',
        voiceText,
        text:
          lang === 'ar'
            ? `معايرة مثالية يا ${nLocal}! تصميم التلسكوب يطابق مهمة «${analog}» وتم إطلاقه للمدار بنجاح (+120 CR).`
            : voiceText,
      };
    }
    case 'telescope_mismatch': {
      const voiceText = `Optical trade warning, ${nEn}. Your wavelength and mirror optics do not align cleanly with the selected science objective. Adjust in the lab.`;
      return {
        mood: 'warning',
        voiceText,
        text:
          lang === 'ar'
            ? `تنبيه مفاضلة بصرية يا ${nLocal}: الطول الموجي أو نوع المرآة لا يطابق الهدف العلمي المختار. راجع توازن التلسكوب.`
            : voiceText,
      };
    }
    case 'cubesat_advance': {
      const phaseName = extraLabel || 'Next CubeSat Phase';
      const voiceText = `CubeSat 101 milestone achieved, ${nEn}. Advancing to ${phaseName}.`;
      return {
        mood: 'happy',
        voiceText,
        text:
          lang === 'ar'
            ? `تقدم رائع في برنامج CubeSat 101 يا ${nLocal}: ${phaseName}!`
            : voiceText,
      };
    }
    case 'mission_viz': {
      const voiceText = `Opening 3D GMAT Mission Visualization for ${pEn}, ${nEn}. Inspect orbital transfer arcs and scrub the mission timeline.`;
      return {
        mood: 'scanning',
        voiceText,
        text:
          lang === 'ar'
            ? `تم فتح بيئة تصور المهمة ثلاثية الأبعاد (GMAT Mission Viz) لمسار ${pLocal} يا ${nLocal}. تفحّص المنحنيات وحرّك شريط الزمن!`
            : voiceText,
      };
    }
    case 'weather_solar_flare': {
      const voiceText = `Solar flare surge detected, ${nEn}. Velocity up 22 percent, shields slowly draining.`;
      return {
        mood: 'warning',
        voiceText,
        text:
          lang === 'ar'
            ? `تحذير يا ${nLocal}! دخلنا توهجاً شمسياً: السرعة +22% لكن الدرع يتناقص تدريجياً.`
            : voiceText,
      };
    }
    case 'weather_asteroid_squall': {
      const voiceText = `Entering dense asteroid squall, ${nEn}. Arm plasma cannons with F.`;
      return {
        mood: 'warning',
        voiceText,
        text:
          lang === 'ar'
            ? `انتبه يا ${nLocal}! عاصفة كويكبات في المسار — استخدم مدفع البلازما [F] للتفتيت!`
            : voiceText,
      };
    }
    case 'weather_ion_storm': {
      const voiceText = `Ion storm front ahead, ${nEn}. Plasma cooldown accelerated.`;
      return {
        mood: 'scanning',
        voiceText,
        text:
          lang === 'ar'
            ? `عاصفة أيونية تحيط بالمركبة يا ${nLocal}! السرعة +18% وتبريد أسرع للأسلحة.`
            : voiceText,
      };
    }
    case 'weather_clear':
    default: {
      const voiceText = `Space weather has stabilized, ${nEn}. Shields recharging normally.`;
      return {
        mood: 'calm',
        voiceText,
        text:
          lang === 'ar'
            ? `هدأت أجواء الفضاء يا ${nLocal}، الدروع تعيد الشحن بشكل طبيعي.`
            : voiceText,
      };
    }
  }
}

export function generateSkyChatReply(params: {
  query: string;
  playerName: string;
  lang: Language;
  metrics: ShipMetrics;
  resources: ResourcesState;
  activePlanet: PlanetData;
  weather: SpaceWeather;
  discoveredCount: number;
}): { text: string; voiceText: string; mood: SkyMood } {
  const { query, playerName, lang, metrics, resources, activePlanet, weather, discoveredCount } =
    params;
  const nLocal = getDisplayCommander(playerName, lang);
  const nEn = getEnglishCommander(playerName);
  const q = query.toLowerCase();

  if (q.includes('weather') || q.includes('storm') || q.includes('طقس') || q.includes('عاصف')) {
    const wNameLocal = UI_COPY.weather[weather].name[lang];
    const wNameEn = UI_COPY.weather[weather].name.en;
    const wBadge = UI_COPY.weather[weather].badge[lang];
    const voiceText = `${nEn}, current space weather reads ${wNameEn}. Thread golden warp rings to recharge shields or roll with R.`;
    return {
      mood: weather === 'clear' ? 'calm' : 'warning',
      voiceText,
      text:
        lang === 'ar'
          ? `يا ${nLocal}، طقس الفضاء الآن «${wNameLocal}» (${wBadge}). مرّ داخل الحلقات الذهبية لشحن الدروع أو استخدم [R].`
          : voiceText,
    };
  }

  if (
    q.includes('ship') ||
    q.includes('stat') ||
    q.includes('power') ||
    q.includes('سفينة') ||
    q.includes('مركبة') ||
    q.includes('طاقة')
  ) {
    const voiceText = `Spacecraft telemetry for ${nEn}: mass ${metrics.mass} kilograms, delta-V ${metrics.deltaV} meters per second, reliability ${metrics.reliability} percent.`;
    return {
      mood: metrics.netPower < 0 ? 'warning' : 'happy',
      voiceText,
      text:
        lang === 'ar'
          ? `تقرير المركبة لك يا ${nLocal}: الكتلة ${metrics.mass} كجم، دلتا-V ${metrics.deltaV} م/ث، صافي الطاقة ${metrics.netPower >= 0 ? '+' : ''}${metrics.netPower}W، الاعتمادية ${metrics.reliability}%.`
          : voiceText,
    };
  }

  if (
    q.includes('creature') ||
    q.includes('alien') ||
    q.includes('bio') ||
    q.includes('مخلوق') ||
    q.includes('كائن') ||
    q.includes('مسح')
  ) {
    const voiceText = `${nEn}, every world hosts native alien fauna. Approach them on foot or in the rover and press F to scan bio-samples for bonus credits and science data.`;
    return {
      mood: 'scanning',
      voiceText,
      text:
        lang === 'ar'
          ? `يا ${nLocal}، كل كوكب عليه كائنات فضائية مميزة! اقترب منها على السطح واضغط [F] لمسحها وجمع عينات حيوية ورصيد إضافي.`
          : voiceText,
    };
  }

  if (
    q.includes('build') ||
    q.includes('base') ||
    q.includes('outpost') ||
    q.includes('habitat') ||
    q.includes('بناء') ||
    q.includes('قاعدة')
  ) {
    const voiceText = `${nEn}, on any planet surface press B or use the Outpost dock to deploy Habitat Domes, Solar Relays, and Science Beacons that recharge O2 and battery.`;
    return {
      mood: 'excited',
      voiceText,
      text:
        lang === 'ar'
          ? `يا ${nLocal}، على سطح أي كوكب اضغط [B] أو زر بناء القاعدة لنشر قبة سكنية أو محطة شمسية أو منارة علمية تشحن الأكسجين والبطارية!`
          : voiceText,
    };
  }

  if (
    q.includes('comm') ||
    q.includes('signal') ||
    q.includes('data') ||
    q.includes('dsn') ||
    q.includes('اتصال') ||
    q.includes('بيانات')
  ) {
    const voiceText = `DSN link via ${resources.commsStation} is at ${resources.commsSignal}% strength. ${Math.round(resources.dataTransmitted)} MB transmitted and ${Math.round(resources.dataStorage)} MB buffered.`;
    return {
      mood: 'happy',
      voiceText,
      text:
        lang === 'ar'
          ? `اتصال DSN عبر محطة ${resources.commsStation} بقوة ${resources.commsSignal}% يا ${nLocal}. تم بث ${Math.round(resources.dataTransmitted)} MB وهناك ${Math.round(resources.dataStorage)} MB جاهزة للبث.`
          : voiceText,
    };
  }

  if (
    q.includes('next') ||
    q.includes('where') ||
    q.includes('mission') ||
    q.includes('help') ||
    q.includes('مهمة') ||
    q.includes('اين') ||
    q.includes('هدف')
  ) {
    const voiceText = `${nEn}, you have charted ${discoveredCount} of 9 Solar System worlds. Press 2 to pilot from Mercury to Neptune, 4 to land and drive the rover, or M for autopilot.`;
    return {
      mood: 'excited',
      voiceText,
      text:
        lang === 'ar'
          ? `خطوتنا القادمة يا ${nLocal}: اكتشفت ${discoveredCount} من 9 أجرام شمسية. اضغط [2] للطيران الفضائي، [M] للطيار الآلي نحو ${activePlanet.name.ar}، أو [4] للهبوط بالروفر!`
          : voiceText,
    };
  }

  const voiceText = `Always with you, ${nEn}. Credits are ${resources.credits}, battery ${Math.round(resources.battery)}%, and O2 ${Math.round(resources.suitO2)}%. Press G anytime for hotkeys.`;
  return {
    mood: 'happy',
    voiceText,
    text:
      lang === 'ar'
        ? `دائماً معك يا ${nLocal}! الرصيد ${resources.credits} CR، البطارية ${Math.round(resources.battery)}%، والأكسجين ${Math.round(resources.suitO2)}%. اضغط [G] أو [Esc] لعرض الاختصارات والإعدادات.`
        : voiceText,
  };
}
