import type { Language, PlanetId } from '../types/game';

export interface PlanetaryEnvironmentProfile {
  planetId: PlanetId;
  orbitId: string;
  heliocentricAu: number;
  gravityMs2: number;
  pressureBar: number;
  atmosphereComposition: Record<Language, string>;
  surfaceTempRangeC: [number, number];
  meanTempC: number;
  solarIrradianceWm2: number;
  solarEfficiency: number;
  radiationKradYr: number;
  radiationMsvDay: number;
  surfaceCondition: Record<Language, string>;
  primaryHazard: Record<Language, string>;
  hazardType: 'extreme_heat' | 'high_pressure' | 'dust_storm' | 'cryo_radiation' | 'vacuum' | 'cryo_wind';
  roverSpeedMult: number;
  roverPowerDrainMult: number;
  thermalHeaterDemandW: number;
  recommendedPowerType: 'solar' | 'rtg';
  requiredThermalResistK: number;
  requiredRadShieldKrad: number;
  requiredLandingMode: 'vacuum_retro' | 'aero_parachute' | 'armored_descent' | 'orbital_survey';
  dataSourceTag: 'NASA/JPL Reference Approximation';
}

export const PLANETARY_ENVIRONMENTS: Record<PlanetId, PlanetaryEnvironmentProfile> = {
  mercury: {
    planetId: 'mercury',
    orbitId: 'mercury_inner',
    heliocentricAu: 0.39,
    gravityMs2: 3.7,
    pressureBar: 0.0000000001,
    atmosphereComposition: {
      ar: 'غلاف رقيق جداً: أكسجين، صوديوم، هيدروجين، هيليوم',
      en: 'Trace Exosphere: O₂, Na, H₂, He (< 10⁻¹⁴ bar)',
    },
    surfaceTempRangeC: [-180, 430],
    meanTempC: 167,
    solarIrradianceWm2: 9082,
    solarEfficiency: 2.15,
    radiationKradYr: 42,
    radiationMsvDay: 1.85,
    surfaceCondition: {
      ar: 'صخور سيليكاتية محترقة وفوهات دائمة الظل عند القطبين',
      en: 'Scorched silicate plains with permanently shadowed polar craters',
    },
    primaryHazard: {
      ar: 'إجهاد حراري شديد (+430°C) ورياح شمسية مكثفة',
      en: 'Extreme solar thermal flux (+430°C) & intense CME solar wind',
    },
    hazardType: 'extreme_heat',
    roverSpeedMult: 0.94,
    roverPowerDrainMult: 1.25,
    thermalHeaterDemandW: 110, // active heat rejection / radiator power
    recommendedPowerType: 'solar',
    requiredThermalResistK: 280,
    requiredRadShieldKrad: 40,
    requiredLandingMode: 'vacuum_retro',
    dataSourceTag: 'NASA/JPL Reference Approximation',
  },
  solaris: {
    planetId: 'solaris',
    orbitId: 'sso',
    heliocentricAu: 0.72,
    gravityMs2: 8.87,
    pressureBar: 92.0,
    atmosphereComposition: {
      ar: '96.5% ثاني أكسيد الكربون + 3.5% نيتروجين وسحب حمض الكبريتيك',
      en: '96.5% CO₂, 3.5% N₂ + sulfuric acid cloud decks (92 bar)',
    },
    surfaceTempRangeC: [445, 475],
    meanTempC: 464,
    solarIrradianceWm2: 2601,
    solarEfficiency: 1.45,
    radiationKradYr: 14,
    radiationMsvDay: 0.35,
    surfaceCondition: {
      ar: 'سهول بازلتية تحت ضغط ساحق يعادل عمق 900م في المحيط',
      en: 'Basaltic volcanic plains under crushing 92-bar supercritical CO₂',
    },
    primaryHazard: {
      ar: 'ضغط جوي ساحق (92 bar) وحرارة تذيب الرصاص وتآكل حمضي',
      en: 'Crushing 92 bar pressure, +464°C runaway greenhouse & acid clouds',
    },
    hazardType: 'high_pressure',
    roverSpeedMult: 0.72,
    roverPowerDrainMult: 1.45,
    thermalHeaterDemandW: 140,
    recommendedPowerType: 'solar',
    requiredThermalResistK: 340,
    requiredRadShieldKrad: 20,
    requiredLandingMode: 'armored_descent',
    dataSourceTag: 'NASA/JPL Reference Approximation',
  },
  aurora: {
    planetId: 'aurora',
    orbitId: 'leo',
    heliocentricAu: 1.0,
    gravityMs2: 9.81,
    pressureBar: 1.013,
    atmosphereComposition: {
      ar: '78% نيتروجين، 21% أكسجين، 1% أرجون وبخار ماء',
      en: '78% N₂, 21% O₂, 1% Ar & variable H₂O vapor',
    },
    surfaceTempRangeC: [-45, 48],
    meanTempC: 15,
    solarIrradianceWm2: 1361,
    solarEfficiency: 1.0,
    radiationKradYr: 5,
    radiationMsvDay: 0.45,
    surfaceCondition: {
      ar: 'محيطات سائلة وغلاف حيوي مستقر ومجال مغناطيسي واقٍ',
      en: 'Temperate biosphere, liquid oceans & protective magnetosphere',
    },
    primaryHazard: {
      ar: 'أحزمة فان ألن عند المدارات المتوسطة وفقد السحب الجوي بالمدار المنخفض',
      en: 'Orbital drag in LEO & Van Allen radiation belt transit',
    },
    hazardType: 'vacuum',
    roverSpeedMult: 1.0,
    roverPowerDrainMult: 0.9,
    thermalHeaterDemandW: 25,
    recommendedPowerType: 'solar',
    requiredThermalResistK: 140,
    requiredRadShieldKrad: 10,
    requiredLandingMode: 'aero_parachute',
    dataSourceTag: 'NASA/JPL Reference Approximation',
  },
  luna: {
    planetId: 'luna',
    orbitId: 'lunar_llo',
    heliocentricAu: 1.0,
    gravityMs2: 1.62,
    pressureBar: 0.0,
    atmosphereComposition: {
      ar: 'فراغ شبه تام (أثر هليوم وأرجون) — لا يوجد عزل جوي',
      en: 'Surface-bounded exosphere (He/Ar trace — hard vacuum)',
    },
    surfaceTempRangeC: [-173, 127],
    meanTempC: -23,
    solarIrradianceWm2: 1361,
    solarEfficiency: 0.98,
    radiationKradYr: 16,
    radiationMsvDay: 1.36,
    surfaceCondition: {
      ar: 'تراب قمري حاد (Regolith) وفوهات صدمية وجليد قطبي',
      en: 'Abrasive silicate regolith, basalt maria & polar water-ice cold traps',
    },
    primaryHazard: {
      ar: 'تباين حراري ليل/نهار 300°C وإشعاع كوني بدون مجال مغناطيسي',
      en: '300°C day/night thermal swing & unshielded GCR cosmic radiation',
    },
    hazardType: 'vacuum',
    roverSpeedMult: 1.05,
    roverPowerDrainMult: 1.0,
    thermalHeaterDemandW: 55,
    recommendedPowerType: 'solar',
    requiredThermalResistK: 190,
    requiredRadShieldKrad: 18,
    requiredLandingMode: 'vacuum_retro',
    dataSourceTag: 'NASA/JPL Reference Approximation',
  },
  mars: {
    planetId: 'mars',
    orbitId: 'mars_tmi',
    heliocentricAu: 1.52,
    gravityMs2: 3.72,
    pressureBar: 0.006,
    atmosphereComposition: {
      ar: '95.3% ثاني أكسيد الكربون، 2.6% نيتروجين، 1.9% أرجون',
      en: '95.3% CO₂, 2.6% N₂, 1.9% Ar (6 mbar thin air)',
    },
    surfaceTempRangeC: [-140, 20],
    meanTempC: -63,
    solarIrradianceWm2: 589,
    solarEfficiency: 0.43,
    radiationKradYr: 22,
    radiationMsvDay: 0.67,
    surfaceCondition: {
      ar: 'صحراء أكسيد الحديد الأحمر وعواصف غبار كوكبية دقيقة',
      en: 'Iron-oxide canyons, basalt dust dunes & thin CO₂ atmosphere',
    },
    primaryHazard: {
      ar: 'عواصف غبارية تغطي الألواح الشمسية (-65% طاقة) وتبريد ليلي -140°C',
      en: 'Global dust storms clogging solar arrays & -140°C cryogenic nights',
    },
    hazardType: 'dust_storm',
    roverSpeedMult: 0.92,
    roverPowerDrainMult: 1.15,
    thermalHeaterDemandW: 75,
    recommendedPowerType: 'rtg',
    requiredThermalResistK: 210,
    requiredRadShieldKrad: 22,
    requiredLandingMode: 'aero_parachute',
    dataSourceTag: 'NASA/JPL Reference Approximation',
  },
  aetheris: {
    planetId: 'aetheris',
    orbitId: 'europa_jo',
    heliocentricAu: 5.2,
    gravityMs2: 1.315, // Europa reference; Jupiter flyby radiation context
    pressureBar: 0.0000001,
    atmosphereComposition: {
      ar: 'غلاف أكسجيني رقيق ناتج عن تفكك الجليد بالإشعاع المشتري',
      en: 'Radiolytic tenuous O₂ exosphere above fractured water-ice crust',
    },
    surfaceTempRangeC: [-220, -160],
    meanTempC: -171,
    solarIrradianceWm2: 50,
    solarEfficiency: 0.04,
    radiationKradYr: 185,
    radiationMsvDay: 54.0,
    surfaceCondition: {
      ar: 'قشرة جليدية متصدعة فوق محيط مائي تحت السطح (Europa)',
      en: 'Chaotic fractured water-ice crust masking subsurface saltwater ocean',
    },
    primaryHazard: {
      ar: 'أشد حزام إشعاعي (54 mSv/يوم) و4% ضوء شمسي فقط!',
      en: 'Lethal Jovian trapped-radiation belt & only ~4% Earth solar flux',
    },
    hazardType: 'cryo_radiation',
    roverSpeedMult: 0.8,
    roverPowerDrainMult: 1.35,
    thermalHeaterDemandW: 135,
    recommendedPowerType: 'rtg',
    requiredThermalResistK: 270,
    requiredRadShieldKrad: 150,
    requiredLandingMode: 'vacuum_retro',
    dataSourceTag: 'NASA/JPL Reference Approximation',
  },
  obsidian: {
    planetId: 'obsidian',
    orbitId: 'geo',
    heliocentricAu: 9.54,
    gravityMs2: 1.352, // Titan surface reference
    pressureBar: 1.45,
    atmosphereComposition: {
      ar: '94.2% نيتروجين، 5.6% ميثان، ضباب هيدروكربوني برتقالي كثيف',
      en: '94.2% N₂, 5.6% CH₄, dense photochemical tholin haze (1.45 bar)',
    },
    surfaceTempRangeC: [-182, -178],
    meanTempC: -179,
    solarIrradianceWm2: 15,
    solarEfficiency: 0.015,
    radiationKradYr: 32,
    radiationMsvDay: 0.9,
    surfaceCondition: {
      ar: 'جليد مائي صلب كالصخر وبحيرات ميثان سائلة وحلقات زحل',
      en: 'Bedrock water-ice ridges, liquid methane lakes & orange smog',
    },
    primaryHazard: {
      ar: 'فقد حراري هائل بسبب الغلاف الكثيف البارد (-179°C) وانعدام الشمس 1.5%',
      en: 'Severe convective heat loss at -179°C in 1.45 bar N₂ & 1.5% sunlight',
    },
    hazardType: 'cryo_wind',
    roverSpeedMult: 0.85,
    roverPowerDrainMult: 1.3,
    thermalHeaterDemandW: 150,
    recommendedPowerType: 'rtg',
    requiredThermalResistK: 290,
    requiredRadShieldKrad: 35,
    requiredLandingMode: 'aero_parachute',
    dataSourceTag: 'NASA/JPL Reference Approximation',
  },
  uranus: {
    planetId: 'uranus',
    orbitId: 'uranus_ice',
    heliocentricAu: 19.2,
    gravityMs2: 8.69,
    pressureBar: 1.2,
    atmosphereComposition: {
      ar: '83% هيدروجين، 15% هيليوم، 2.3% ميثان ورياح جليدية 900 كم/س',
      en: '83% H₂, 15% He, 2.3% CH₄ + 900 km/h supersonic ice-giant winds',
    },
    surfaceTempRangeC: [-224, -195],
    meanTempC: -214,
    solarIrradianceWm2: 3.7,
    solarEfficiency: 0.01,
    radiationKradYr: 38,
    radiationMsvDay: 1.4,
    surfaceCondition: {
      ar: 'عملاق جليدي مائل المحور (98°) مع حلقات رأسية وغلاف سحيق',
      en: '98° axially tilted ice giant with vertical rings & deep cloud decks',
    },
    primaryHazard: {
      ar: 'برد فائق (-214°C)، زمن إشارة 2.6 ساعة، وانهيار الطاقة الشمسية',
      en: 'Cryogenic -214°C sink, 2.6-hr one-way radio lag & near-zero sunlight',
    },
    hazardType: 'cryo_wind',
    roverSpeedMult: 0.78,
    roverPowerDrainMult: 1.4,
    thermalHeaterDemandW: 165,
    recommendedPowerType: 'rtg',
    requiredThermalResistK: 310,
    requiredRadShieldKrad: 45,
    requiredLandingMode: 'orbital_survey',
    dataSourceTag: 'NASA/JPL Reference Approximation',
  },
  neptune: {
    planetId: 'neptune',
    orbitId: 'neptune_kuiper',
    heliocentricAu: 30.07,
    gravityMs2: 11.15,
    pressureBar: 1.5,
    atmosphereComposition: {
      ar: '80% هيدروجين، 19% هيليوم، 1% ميثان وعواصف 2100 كم/س',
      en: '80% H₂, 19% He, 1% CH₄ with 2,100 km/h supersonic storm jets',
    },
    surfaceTempRangeC: [-218, -200],
    meanTempC: -201,
    solarIrradianceWm2: 1.5,
    solarEfficiency: 0.01,
    radiationKradYr: 44,
    radiationMsvDay: 1.65,
    surfaceCondition: {
      ar: 'أقصى حافة المنظومة عند حزام كويبر وعواصف ميثان زرقاء عاتية',
      en: 'Kuiper frontier with deep sapphire methane vortices & icy moons',
    },
    primaryHazard: {
      ar: 'توهين إشارة فائق عند 30 AU، تأخير بث 4.1 ساعة، و0.11% شمس حقيقية',
      en: 'Extreme 30 AU link attenuation, 4.1-hr lag & 0.11% true solar flux',
    },
    hazardType: 'cryo_wind',
    roverSpeedMult: 0.74,
    roverPowerDrainMult: 1.48,
    thermalHeaterDemandW: 175,
    recommendedPowerType: 'rtg',
    requiredThermalResistK: 330,
    requiredRadShieldKrad: 50,
    requiredLandingMode: 'orbital_survey',
    dataSourceTag: 'NASA/JPL Reference Approximation',
  },
};

export function getPlanetEnvironment(planetId: PlanetId): PlanetaryEnvironmentProfile {
  return PLANETARY_ENVIRONMENTS[planetId] || PLANETARY_ENVIRONMENTS.mars;
}
