import type {
  ActiveMissionEvent,
  AdvancedLoadout,
  EngineeringTradeoffReport,
  FailureInvestigationReport,
  Language,
  OperationalMode,
  PlanetId,
  ResourcesState,
} from '../types/game';
import { getPlanetEnvironment } from './planetaryEnvironments';
import { MISSION_LIFECYCLE_12 } from './missionOpsEngine';

export interface SkyAiContext {
  lang: Language;
  commanderName: string;
  planetId: PlanetId;
  loadout: AdvancedLoadout;
  tradeOff: EngineeringTradeoffReport;
  resources: ResourcesState;
  hullIntegrity: number;
  fuelPct: number;
  internalTempC: number;
  operationalMode: OperationalMode;
  lifecyclePhase: number;
  activeEvent: ActiveMissionEvent | null;
  lastFailureReport: FailureInvestigationReport | null;
}

/**
 * Rule-based Engineering Decision Assistant grounded directly in live game-state.
 * Explicitly separates validated simulation metrics from heuristic AI advisories.
 */
export function generateEngineeringSkyReply(
  userQuery: string,
  ctx: SkyAiContext
): { text: string; voiceText: string; mood: 'happy' | 'excited' | 'warning' | 'scanning' | 'calm' } {
  const q = userQuery.trim().toLowerCase();
  const env = getPlanetEnvironment(ctx.planetId);
  const phaseDef = MISSION_LIFECYCLE_12[Math.max(0, Math.min(11, ctx.lifecyclePhase - 1))];
  const ar = ctx.lang === 'ar';

  const topConflict = ctx.tradeOff.conflicts[0];
  const criticalCount = ctx.tradeOff.conflicts.filter((c) => c.severity === 'critical').length;

  // 1. "Why is my mission failing?" / Diagnostics
  if (/fail|wrong|problem|why|crash|error|فشل|تخسر|مشكلة|عطل|ليه|سبب/i.test(q)) {
    if (ctx.activeEvent) {
      const arTxt = `[توصية Sky AI المبنية على الحالة الحية] يوجد طارئ نشط الآن: «${ctx.activeEvent.title.ar}» على نظام ${ctx.activeEvent.affectedSubsystem}. السبب المباشر: ${ctx.activeEvent.triggerBasis.ar}. الحل الموصى به: ${ctx.activeEvent.options[0].label.ar}.`;
      const enTxt = `[AI Advisory from Live State] Active Emergency: "${ctx.activeEvent.title.en}" hitting ${ctx.activeEvent.affectedSubsystem}. Trigger: ${ctx.activeEvent.triggerBasis.en}. Recommended action: ${ctx.activeEvent.options[0].label.en}.`;
      return { text: ar ? arTxt : enTxt, voiceText: enTxt, mood: 'warning' };
    }
    if (ctx.lastFailureReport) {
      const arTxt = `[تقرير التحقيق الذكي] فشل نظام ${ctx.lastFailureReport.failedSubsystem}. السبب الجذري: ${ctx.lastFailureReport.rootCause.ar}. التوصية الهندسية: ${ctx.lastFailureReport.recommendedImprovements[0]?.ar || 'ترقية الطاقة والحرارة'}.`;
      const enTxt = `[AI Failure Forensics] Failed subsystem: ${ctx.lastFailureReport.failedSubsystem}. Root cause: ${ctx.lastFailureReport.rootCause.en}. Fix: ${ctx.lastFailureReport.recommendedImprovements[0]?.en || 'Upgrade power & thermal margin'}.`;
      return { text: ar ? arTxt : enTxt, voiceText: enTxt, mood: 'warning' };
    }
    if (topConflict) {
      const arTxt = `[تشخيص Sky AI المباشر — إحصاءات محاكاة] اكتشفت ${ctx.tradeOff.conflicts.length} تعارض هندسي، أهمها: «${topConflict.title.ar}». السبب: ${topConflict.explanation.ar} 💡 الإصلاح الموصى به: ${topConflict.fixHint.ar}`;
      const enTxt = `[Sky AI Live Diagnosis] Detected ${ctx.tradeOff.conflicts.length} engineering conflict(s). Top blocker: "${topConflict.title.en}" — ${topConflict.explanation.en} Recommended fix: ${topConflict.fixHint.en}`;
      return { text: ar ? arTxt : enTxt, voiceText: enTxt, mood: 'warning' };
    }
    const okAr = `[تحليل Sky AI] التكوين الحالي متزن (احتمال الجاهزية ${ctx.tradeOff.feasibilityScore}%). راقب فقط استهلاك الوقود (${Math.round(ctx.fuelPct)}%) وذاكرة SSR (${Math.round(ctx.resources.dataStorage)}/${ctx.tradeOff.storageCapacityMb} MB).`;
    const okEn = `[Sky AI Analysis] Current architecture passes all primary checks (Feasibility ${ctx.tradeOff.feasibilityScore}%). Monitor Fuel (${Math.round(ctx.fuelPct)}%) and SSR Buffer (${Math.round(ctx.resources.dataStorage)}/${ctx.tradeOff.storageCapacityMb} MB).`;
    return { text: ar ? okAr : okEn, voiceText: okEn, mood: 'happy' };
  }

  // 2. Planet / Europa / Outer world improvement advice
  if (/europa|mars|neptune|uranus|mercury|solaris|venus|luna|moon|improve|upgrade|أوروبا|المريخ|نبتون|عطارد|الزهرة|تحسين|تطوير/i.test(q)) {
    const targetName = q.includes('europa') || q.includes('أوروبا') ? 'aetheris' : q.includes('mars') || q.includes('المريخ') ? 'mars' : q.includes('neptune') || q.includes('نبتون') ? 'neptune' : ctx.planetId;
    const tEnv = getPlanetEnvironment(targetName);
    const needRtg = tEnv.recommendedPowerType === 'rtg' && ctx.loadout.solar_arrays !== 'pwr14_mmrtg';
    const needRad = ctx.tradeOff.radiationToleranceKradYr < tEnv.requiredRadShieldKrad;
    const needThm = ctx.loadout.thermal_control !== 'thm_active_louvers' && tEnv.requiredThermalResistK > 200;

    const arRecs = [
      needRtg ? '• استبدل الألواح الشمسية بمولد MMRTG النووي لأن الشمس هناك ضعيفة جداً.' : '',
      needRad ? `• إشعاع هذا العالم (${tEnv.radiationKradYr} krad/yr) يتطلب خزنة التانتالوم 200 krad + حاسوب RAD750 مكرر.` : '',
      needThm ? `• المدى الحراري (${tEnv.surfaceTempRangeC[0]}..${tEnv.surfaceTempRangeC[1]}°C) يحتاج نظام المشعّات النشطة.` : '',
      `• استخدم هوائي Ka-Band + محطة Goldstone 70m لمنع تكدس البيانات عند بُعد ${tEnv.heliocentricAu} AU.`,
    ].filter(Boolean).join(' ');

    const enRecs = [
      needRtg ? 'Swap Solar Arrays for MMRTG Nuclear Core due to severe solar drop-off.' : '',
      needRad ? `Upgrade shielding to 200 krad Tantalum Vault + Dual RAD750 OBC for ${tEnv.radiationKradYr} krad/yr dose.` : '',
      needThm ? `Install Active Thermal Louvers to survive ${tEnv.surfaceTempRangeC[0]} to ${tEnv.surfaceTempRangeC[1]}°C.` : '',
      `Pair Ka-Band 3.2m Dish with Goldstone 70m to maintain downlink across ${tEnv.heliocentricAu} AU.`,
    ].filter(Boolean).join(' ');

    const fullAr = `[توصية Sky AI لبيئة ${targetName.toUpperCase()} — مفصولة عن الحسابات المثبتة] ${arRecs}`;
    const fullEn = `[Sky AI Advisory for ${targetName.toUpperCase()} — Heuristic Advice] ${enRecs}`;
    return { text: ar ? fullAr : fullEn, voiceText: fullEn, mood: 'scanning' };
  }

  // 3. Comms / Data bottleneck / Ground Station queries
  if (/comm|data|dsn|antenna|signal|blackout|اتصال|بيانات|هوائي|محطة|إشارة/i.test(q)) {
    const gap = ctx.tradeOff.dataGenMbDay - ctx.tradeOff.commsCapacityMbDay;
    const arTxt = gap > 0
      ? `[بيانات المحاكاة]: أجهزتك تنتج ${ctx.tradeOff.dataGenMbDay} MB/يوم وتبث ${ctx.tradeOff.commsCapacityMbDay} MB/يوم (عجز ${gap} MB/d، تمتلئ SSR خلال ${ctx.tradeOff.daysUntilBufferFull} يوم). [توصية Sky AI]: فعّل ضغط CCSDS أو رقِّ لـ Ka-Band.`
      : `[بيانات المحاكاة]: البث متوازن (${ctx.tradeOff.dataGenMbDay}/${ctx.tradeOff.commsCapacityMbDay} MB/d) وقوة الإشارة ${Math.round(ctx.resources.commsSignal)}%.`;
    const enTxt = gap > 0
      ? `[Telemetry]: Generating ${ctx.tradeOff.dataGenMbDay} MB/d vs ${ctx.tradeOff.commsCapacityMbDay} MB/d downlink (SSR fills in ${ctx.tradeOff.daysUntilBufferFull}d). [AI Advice]: Enable CCSDS compression or upgrade to Ka-Band.`
      : `[Telemetry]: Downlink healthy (${ctx.tradeOff.dataGenMbDay}/${ctx.tradeOff.commsCapacityMbDay} MB/d) at ${Math.round(ctx.resources.commsSignal)}% signal.`;
    return { text: ar ? arTxt : enTxt, voiceText: enTxt, mood: gap > 0 ? 'warning' : 'happy' };
  }

  // 4. Power / Thermal / Fuel / Orbit trade-offs
  if (/power|thermal|temp|fuel|delta|orbit|mass|طاقة|حرارة|وقود|مدار|كتلة/i.test(q)) {
    const arTxt = `[قياس المحاكاة الفعلي]: الكتلة الرطبة ${ctx.tradeOff.wetMassKg} kg | Δv المتاح ${ctx.tradeOff.deltaVAvailableKms}/${ctx.tradeOff.deltaVRequiredKms} km/s | صافي الطاقة ${ctx.tradeOff.netPowerW >= 0 ? `+${ctx.tradeOff.netPowerW}` : ctx.tradeOff.netPowerW} W | الحرارة ${ctx.internalTempC}°C (الهدف: -15..+52°C). [نصيحة Sky AI]: جرب اختبار «What-If?» لمحاكاة +20% كتلة أو -30% طاقة قبل الطيران.`;
    const enTxt = `[Validated Sim Telemetry]: Wet Mass ${ctx.tradeOff.wetMassKg} kg | Δv ${ctx.tradeOff.deltaVAvailableKms}/${ctx.tradeOff.deltaVRequiredKms} km/s | Net Power ${ctx.tradeOff.netPowerW} W | Bus Temp ${ctx.internalTempC}°C. [AI Advice]: Test +20% mass or -30% power inside What-If Simulator.`;
    return { text: ar ? arTxt : enTxt, voiceText: enTxt, mood: ctx.tradeOff.netPowerW < 0 ? 'warning' : 'calm' };
  }

  // 5. Default live engineering summary
  const defAr = `مرحباً يا ${ctx.commanderName}! نحن في المرحلة ${ctx.lifecyclePhase}/12 (${phaseDef.title.ar}) نحو ${ctx.planetId.toUpperCase()} بوضع ${ctx.operationalMode}. الجاهزية: ${ctx.tradeOff.feasibilityScore}% (${criticalCount} أخطاء حرجة) · صحة الهيكل ${Math.round(ctx.hullIntegrity)}% · الوقود ${Math.round(ctx.fuelPct)}% · البطارية ${Math.round(ctx.resources.battery)}%. اسألني: "لماذا تفشل مهمتي؟" أو "كيف أحسّن بعثة أوروبا؟".`;
  const defEn = `Online, ${ctx.commanderName}! Phase ${ctx.lifecyclePhase}/12 (${phaseDef.title.en}) en route to ${ctx.planetId.toUpperCase()} in ${ctx.operationalMode} mode. Readiness: ${ctx.tradeOff.feasibilityScore}% (${criticalCount} critical conflicts) | Hull ${Math.round(ctx.hullIntegrity)}% | Fuel ${Math.round(ctx.fuelPct)}% | Battery ${Math.round(ctx.resources.battery)}%. Ask: "Why is my mission failing?" or "How do I improve my Europa mission?".`;
  return {
    text: ar ? defAr : defEn,
    voiceText: defEn,
    mood: criticalCount > 0 ? 'warning' : 'happy',
  };
}
