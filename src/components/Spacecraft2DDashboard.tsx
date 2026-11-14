import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Clock,
  HeartPulse,
  Info,
  Lightbulb,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Telescope,
  UserCheck,
  Wrench,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { TELESCOPE_OBJECTIVES, TELESCOPE_OPTICS, TELESCOPE_WAVELENGTHS } from '../data/novaData';
import { NASA_RESOURCE_BRIEFS, SURVIVAL_MISSIONS } from '../data/nasaSurvivalData';
import { useGameStore } from '../store/gameStore';
import type { OpticSystemId, ScienceObjectiveId, WavelengthId } from '../types/game';
import { RealAstronautSim } from './RealAstronautSim';

interface OutcomeBanner {
  won: boolean;
  missionId: string;
  headline: string;
  detail: string;
  fact: string;
}

const CUBESAT_STEPS = [
  {
    id: 'conops',
    order: 1,
    ar: '1. تعريف مفهوم العمليات (ConOps & Mission Goal)',
    en: '1. Define ConOps & Orbital Science Objective',
  },
  {
    id: 'bus',
    order: 2,
    ar: '2. تجميع حافلة القمر 3U واختبارات الاهتزاز والحرارة',
    en: '2. Assemble 3U Bus, Avionics & Environmental Tests',
  },
  {
    id: 'launch',
    order: 3,
    ar: '3. الدمج داخل قاذف الإطلاق P-POD والإطلاق المداري',
    en: '3. Dispenser Integration (CSLI) & Orbital Deployment',
  },
  {
    id: 'ops',
    order: 4,
    ar: '4. تفعيل منارة الترددات RF واستقبال البيانات الأرضية',
    en: '4. Beacon RF Activation & Ground Station Operations',
  },
];

// 3 escalating Telescope levels referencing A Learning Game About Telescopes
const TELESCOPE_LEVEL_CHALLENGES: Array<{
  level: 1 | 2 | 3;
  titleAr: string;
  titleEn: string;
  briefAr: string;
  briefEn: string;
  requiredObj: ScienceObjectiveId;
  requiredWave: WavelengthId;
  requiredOptic: OpticSystemId;
  nasaMatch: string;
}> = [
  {
    level: 1,
    titleAr: 'المستوى 1: رصد مجرات الانزياح الأحمر العالي خلف الغبار',
    titleEn: 'Level 1: Pierce Dust to Image High-z Galaxies',
    briefAr: 'الضوء المرئي محجوب بالغبار — أي طول موجي ومرايا ترصد المجرات البعيدة؟',
    briefEn: 'Dust obscures optical starlight. Choose the compatible wavelength & optical mirror:',
    requiredObj: 'deep_galaxies',
    requiredWave: 'infrared',
    requiredOptic: 'segmented_ir',
    nasaMatch: 'James Webb Space Telescope (JWST)',
  },
  {
    level: 2,
    titleAr: 'المستوى 2: فحص هالة الشمس وتوهجات العاصفة UV',
    titleEn: 'Level 2: Track Coronal Mass Ejections in Ultraviolet',
    briefAr: 'لمراقبة البلازما الشمسية دون احتراق المستشعر يجب اختيار نظام حجب وإشعاع متوافق.',
    briefEn: 'Solar flares blind normal detectors. Match UV band + occulter optics:',
    requiredObj: 'solar_corona',
    requiredWave: 'ultraviolet',
    requiredOptic: 'coronagraph_uv',
    nasaMatch: 'NASA SOHO / Parker Solar Coronagraph',
  },
  {
    level: 3,
    titleAr: 'المستوى 3: تنسيق أهداف متعددة — نبضات النجوم النيوترونية عالية الطاقة',
    titleEn: 'Level 3: Multi-Objective High-Energy Pulsar Burst Lock',
    briefAr: 'المستوى الأعلى تعقيداً: الأشعة عالية الطاقة تخترق المرايا التقليدية — اختر بصريات الرعي الخاطفة!',
    briefEn: 'Complex multi-target array: high-energy photons require grazing-incidence nested mirrors:',
    requiredObj: 'high_energy_pulsars',
    requiredWave: 'xray',
    requiredOptic: 'wolter_xray',
    nasaMatch: 'Chandra X-Ray Observatory',
  },
];

export function Spacecraft2DDashboard() {
  const lang = useGameStore((s) => s.lang);
  const difficulty = useGameStore((s) => s.difficulty);
  const hardcoreChallengeMode = useGameStore((s) => s.hardcoreChallengeMode);
  const unlockedBudgetBonusM = useGameStore((s) => s.unlockedBudgetBonusM);
  const hullIntegrity = useGameStore((s) => s.hullIntegrity);
  const survivalFailures = useGameStore((s) => s.survivalFailures);
  const survivalScore = useGameStore((s) => s.survivalScore);
  const survivalStreak = useGameStore((s) => s.survivalStreak);
  const completedSurvivalIds = useGameStore((s) => s.completedSurvivalIds);
  const failedSurvivalIds = useGameStore((s) => s.failedSurvivalIds);
  const activeSurvivalId = useGameStore((s) => s.activeSurvivalId);
  const resources = useGameStore((s) => s.resources);
  const shipMetrics = useGameStore((s) => s.shipMetrics);
  const astronautBio = useGameStore((s) => s.astronautBio);

  const setActiveSurvivalId = useGameStore((s) => s.setActiveSurvivalId);
  const resolveSurvivalMission = useGameStore((s) => s.resolveSurvivalMission);
  const retrySurvivalCampaign = useGameStore((s) => s.retrySurvivalCampaign);
  const setStoryIntroOpen = useGameStore((s) => s.setStoryIntroOpen);
  const performAstronautAction = useGameStore((s) => s.performAstronautAction);
  const toggleHardcoreChallengeMode = useGameStore((s) => s.toggleHardcoreChallengeMode);

  const isHardcore = hardcoreChallengeMode || difficulty === 'Veteran';
  const rewardMult = isHardcore ? 1.5 : 1.0;

  const [leftTab, setLeftTab] = useState<'missions' | 'astronaut' | 'resources'>('missions');
  const [showTips, setShowTips] = useState<boolean>(!isHardcore);
  const [selectedResourceKey, setSelectedResourceKey] = useState(NASA_RESOURCE_BRIEFS[0].key);
  const [outcomeBanner, setOutcomeBanner] = useState<OutcomeBanner | null>(null);

  // Interactive tuning parameters
  const [paramA, setParamA] = useState<number>(650);
  const [paramB, setParamB] = useState<number>(10);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(50);
  const [timerActive, setTimerActive] = useState<boolean>(true);

  // CubeSat 4-step sequence state
  const [cubeSeq, setCubeSeq] = useState<string[]>([]);
  // Shuffled display order for CubeSat buttons so player has to reason about ConOps -> Bus -> Launch -> Ops
  const cubeDisplayOrder = [CUBESAT_STEPS[2], CUBESAT_STEPS[0], CUBESAT_STEPS[3], CUBESAT_STEPS[1]];

  // Telescope 3-level mini-sim state
  const [scopeLevelIdx, setScopeLevelIdx] = useState<number>(0);
  const [scopeWave, setScopeWave] = useState<WavelengthId>('optical');
  const [scopeOptic, setScopeOptic] = useState<OpticSystemId>('wide_field_opt');

  const mission =
    SURVIVAL_MISSIONS.find((m) => m.id === activeSurvivalId) || SURVIVAL_MISSIONS[0];
  const isMissionCleared = completedSurvivalIds.includes(mission.id);
  const isMissionFailedBefore = failedSurvivalIds.includes(mission.id);

  const getScaledLimit = (baseSec: number) => {
    const diffFactor = difficulty === 'Veteran' ? 0.65 : difficulty === 'Commander' ? 0.85 : 1.0;
    const hardFactor = hardcoreChallengeMode ? 0.82 : 1.0;
    return Math.max(16, Math.round(baseSec * diffFactor * hardFactor));
  };

  const stripRangeSpoiler = (label: string) =>
    isHardcore ? label.replace(/\s*\([^)]*\d[^)]*\)/g, '').trim() : label;

  // Reset interactive controls when switching mission
  useEffect(() => {
    setOutcomeBanner(null);
    setShowTips(!isHardcore);
    setTimeLeft(getScaledLimit(mission.timeLimitSec));
    setTimerActive(!completedSurvivalIds.includes(mission.id));

    if (mission.mechanic === 'gmat_burn') {
      setParamA(mission.id === 'm12_neptune_kuiper' ? 780 : 640);
      setParamB(10);
      setSelectedPresetId(mission.id === 'm12_neptune_kuiper' ? 'heliocentric_escape' : 'leo_decay');
    } else if (mission.mechanic === 'mdl_balance') {
      setParamA(42);
      setParamB(mission.id === 'm10_mercury_thermal' ? 25 : 86);
      setSelectedPresetId(mission.id === 'm10_mercury_thermal' ? 'face_sun_full' : 'office_hours');
    } else if (mission.mechanic === 'mission_viz_scrub') {
      setParamA(0.22);
      setParamB(0);
      setSelectedPresetId('max_solar_drag');
    } else if (mission.mechanic === 'csa_alignment') {
      setParamA(48);
      setParamB(66);
      setSelectedPresetId('');
    } else if (mission.mechanic === 'cubesat_sequence') {
      setCubeSeq([]);
    } else if (mission.mechanic === 'telescope_levels') {
      setScopeLevelIdx(0);
      setScopeWave('optical');
      setScopeOptic('wide_field_opt');
    }
  }, [mission.id, isHardcore]);

  // Real-time countdown pressure for active uncompleted survival crisis
  useEffect(() => {
    if (!timerActive || isMissionCleared || outcomeBanner) return;
    const interval = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setTimerActive(false);
          const timeoutReason = {
            ar: 'انتهى وقت الطوارئ الحرجة قبل تنفيذ الحل الهندسي!',
            en: 'Emergency survival timer expired before stabilization was executed!',
          };
          const timeoutCutCr = isHardcore ? 75 : 45;
          const timeoutCutM = Math.round((mission.budgetRewardM ?? 25) * (isHardcore ? 0.85 : 0.6));
          resolveSurvivalMission(mission.id, false, timeoutReason);
          setOutcomeBanner({
            won: false,
            missionId: mission.id,
            headline:
              lang === 'ar'
                ? `انتهى الوقت — خسارة (-${mission.hullPenalty}% هيكل · -${timeoutCutCr} CR · -$${timeoutCutM}M ميزانية)`
                : `TIMEOUT LOSS (-${mission.hullPenalty}% HULL · -${timeoutCutCr} CR · -$${timeoutCutM}M BUDGET)`,
            detail: lang === 'ar' ? timeoutReason.ar : timeoutReason.en,
            fact: mission.resourceFact[lang],
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [timerActive, isMissionCleared, outcomeBanner, mission.id]);

  const missionRewardCr = Math.round(mission.rewardCredits * rewardMult);
  const missionBudgetGainM = Math.round((mission.budgetRewardM ?? 25) * rewardMult);
  const missionLossCr = isHardcore ? 75 : 45;
  const missionBudgetCutM = Math.round((mission.budgetRewardM ?? 25) * (isHardcore ? 0.85 : 0.6));

  const handleWinMission = (customDetail?: string) => {
    setTimerActive(false);
    resolveSurvivalMission(mission.id, true);
    setOutcomeBanner({
      won: true,
      missionId: mission.id,
      headline:
        lang === 'ar'
          ? `نجاح المهمة +${missionRewardCr} CR · +$${missionBudgetGainM}M ميزانية · +${mission.hullRestore}% هيكل`
          : `CLEARED · +${missionRewardCr} CR · +$${missionBudgetGainM}M BUDGET · +${mission.hullRestore}% HULL`,
      detail: customDetail || mission.successSummary[lang],
      fact: mission.resourceFact[lang],
    });
  };

  const handleLoseMission = (reasonAr: string, reasonEn: string) => {
    setTimerActive(false);
    resolveSurvivalMission(mission.id, false, { ar: reasonAr, en: reasonEn });
    setOutcomeBanner({
      won: false,
      missionId: mission.id,
      headline:
        lang === 'ar'
          ? `فشل هندسي — خسارة (-${mission.hullPenalty}% هيكل · -${missionLossCr} CR · -$${missionBudgetCutM}M ميزانية)`
          : `ENGINEERING FAILURE · -${mission.hullPenalty}% HULL · -${missionLossCr} CR · -$${missionBudgetCutM}M BUDGET`,
      detail: lang === 'ar' ? reasonAr : reasonEn,
      fact: mission.resourceFact[lang],
    });
  };

  const submitChoice = (optionId: string) => {
    const opt = mission.options?.find((o) => o.id === optionId);
    if (!opt) return;
    if (opt.isCorrect) {
      handleWinMission(opt.feedback[lang]);
    } else {
      handleLoseMission(opt.feedback.ar, opt.feedback.en);
    }
  };

  const submitRangeChallenge = () => {
    const tr = mission.targetRange;
    if (!tr) return;

    const aSpan = tr.targetAMax - tr.targetAMin;
    const aMargin = isHardcore ? aSpan * 0.14 : 0;
    const effAMin = tr.targetAMin + aMargin;
    const effAMax = tr.targetAMax - aMargin;
    const aOk = paramA >= effAMin && paramA <= effAMax;

    let bOk = true;
    if (typeof tr.targetBMin === 'number' && typeof tr.targetBMax === 'number') {
      const bSpan = tr.targetBMax - tr.targetBMin;
      const bMargin = isHardcore ? bSpan * 0.14 : 0;
      bOk = paramB >= tr.targetBMin + bMargin && paramB <= tr.targetBMax - bMargin;
    }

    const presetOk = tr.presetModes
      ? Boolean(tr.presetModes.find((pm) => pm.id === selectedPresetId)?.isCorrect)
      : true;

    if (aOk && bOk && presetOk) {
      handleWinMission();
    } else {
      const reasonsAr: string[] = [];
      const reasonsEn: string[] = [];
      if (!aOk) {
        reasonsAr.push(`${stripRangeSpoiler(tr.paramALabel.ar)} خارج النطاق الدقيق (${paramA}${tr.paramAUnit})`);
        reasonsEn.push(`${stripRangeSpoiler(tr.paramALabel.en)} out of tolerance (${paramA}${tr.paramAUnit})`);
      }
      if (!bOk && tr.paramBLabel) {
        reasonsAr.push(`${stripRangeSpoiler(tr.paramBLabel.ar)} خارج النطاق الدقيق (${paramB}${tr.paramBUnit || ''})`);
        reasonsEn.push(`${stripRangeSpoiler(tr.paramBLabel.en)} out of tolerance (${paramB}${tr.paramBUnit || ''})`);
      }
      if (!presetOk) {
        reasonsAr.push('وضعية التشغيل المختارة غير ملائمة لظروف المدار');
        reasonsEn.push('Selected operational mode is unsuitable for mission telemetry');
      }
      handleLoseMission(reasonsAr.join(' • '), reasonsEn.join(' · '));
    }
  };

  const submitTelescopeLevel = () => {
    const lvl = TELESCOPE_LEVEL_CHALLENGES[scopeLevelIdx];
    if (scopeWave === lvl.requiredWave && scopeOptic === lvl.requiredOptic) {
      if (scopeLevelIdx < TELESCOPE_LEVEL_CHALLENGES.length - 1) {
        const nextIdx = scopeLevelIdx + 1;
        setScopeLevelIdx(nextIdx);
        setScopeWave('optical');
        setScopeOptic('wide_field_opt');
      } else {
        handleWinMission(
          lang === 'ar'
            ? `تم اجتياز المستويات الثلاثة للتلسكوب ومطابقة مراصد ${TELESCOPE_LEVEL_CHALLENGES.map((l) => l.nasaMatch).join(' / ')}.`
            : `All 3 Telescope complexity levels calibrated — matched ${TELESCOPE_LEVEL_CHALLENGES.map((l) => l.nasaMatch).join(' / ')}!`
        );
      }
    } else {
      handleLoseMission(
        `المستوى ${lvl.level}: عدم توافق علمي بين الطول الموجي ونظام المرايا لمهمة ${lvl.nasaMatch}.`,
        `Level ${lvl.level} incompatibility: Wavelength or Optical System cannot resolve ${lvl.nasaMatch} targets.`
      );
    }
  };

  const submitCubeSatSequence = () => {
    if (cubeSeq.length < 4) return;
    const expected = ['conops', 'bus', 'launch', 'ops'];
    const ok = expected.every((id, idx) => cubeSeq[idx] === id);
    if (ok) {
      handleWinMission();
    } else {
      handleLoseMission(
        'ترتيب مراحل CubeSat 101 غير صحيح! المسار الصحيح: ConOps ← بناء الحافلة ← الإطلاق ← التشغيل.',
        'Incorrect CubeSat 101 order! Required CSLI sequence: ConOps → Bus Build/Test → Launch Dispenser → Beacon Ops.'
      );
    }
  };

  const retryCurrentMission = () => {
    setOutcomeBanner(null);
    setTimeLeft(getScaledLimit(mission.timeLimitSec));
    setTimerActive(true);
    setCubeSeq([]);
  };

  const jumpToNextPendingMission = () => {
    const next = SURVIVAL_MISSIONS.find(
      (m) => m.id !== mission.id && !completedSurvivalIds.includes(m.id)
    );
    if (next) setActiveSurvivalId(next.id);
    setOutcomeBanner(null);
  };

  const activeBrief =
    NASA_RESOURCE_BRIEFS.find((b) => b.key === selectedResourceKey) || NASA_RESOURCE_BRIEFS[0];

  const hullStatus =
    hullIntegrity > 65
      ? { label: lang === 'ar' ? '● مستقر' : '● NOMINAL', cls: 'text-emerald-400' }
      : hullIntegrity > 35
        ? { label: lang === 'ar' ? '▲ متضرر' : '▲ CAUTION', cls: 'text-amber-300' }
        : { label: lang === 'ar' ? '✖ حرج' : '✖ CRITICAL', cls: 'text-rose-400' };

  const currentScopeLvl = TELESCOPE_LEVEL_CHALLENGES[scopeLevelIdx];
  const currentScopeObjMeta = TELESCOPE_OBJECTIVES.find((o) => o.id === currentScopeLvl.requiredObj);

  return (
    <div className="flex flex-col gap-3">
      {/* Top Survival Telemetry Ribbon */}
      <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-[#060b14] p-3 font-mono tabular-nums sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>{lang === 'ar' ? 'سلامة الهيكل' : 'HULL INTEGRITY'}</span>
            <span className={`font-bold ${hullStatus.cls}`}>{hullStatus.label}</span>
          </div>
          <div className="mt-1 text-xl font-bold text-white">{Math.round(hullIntegrity)}%</div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded bg-slate-800">
            <div
              className={`h-full transition-all ${
                hullIntegrity > 65 ? 'bg-emerald-400' : hullIntegrity > 35 ? 'bg-amber-400' : 'bg-rose-500'
              }`}
              style={{ width: `${hullIntegrity}%` }}
            />
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
          <div className="text-[10px] text-slate-400">{lang === 'ar' ? 'طاقة المفاعل' : 'REACTOR POWER'}</div>
          <div className="mt-1 text-xl font-bold text-amber-300">{Math.round(resources.battery)}%</div>
          <div className="text-[10px] text-slate-400">
            +{shipMetrics.powerGen}W / -{shipMetrics.powerUse}W
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
          <div className="text-[10px] text-slate-400">{lang === 'ar' ? 'أكسجين المقصورة' : 'CABIN O2'}</div>
          <div className="mt-1 text-xl font-bold text-cyan-300">{Math.round(resources.suitO2)}%</div>
          <div className="text-[10px] text-slate-400">LIFE SUPPORT</div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
          <div className="text-[10px] text-slate-400">{lang === 'ar' ? 'مهام البقاء' : 'MISSIONS CLEARED'}</div>
          <div className="mt-1 text-xl font-bold text-emerald-300">
            {completedSurvivalIds.length} / {SURVIVAL_MISSIONS.length}
          </div>
          <div className="text-[10px] text-slate-400">STREAK {survivalStreak}x</div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
          <div className="text-[10px] text-slate-400">{lang === 'ar' ? 'إخفاقات الخطر' : 'CRITICAL STRIKES'}</div>
          <div className={`mt-1 text-xl font-bold ${survivalFailures >= 2 ? 'text-rose-400' : 'text-amber-200'}`}>
            {survivalFailures} / 3
          </div>
          <div className="text-[10px] text-slate-400">
            {lang === 'ar' ? '3 أخطاء = خسارة' : '3 STRIKES = LOSS'}
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>{lang === 'ar' ? 'تعديل الميزانية' : 'AGENCY BUDGET'}</span>
            <span className={`font-bold ${unlockedBudgetBonusM >= 0 ? 'text-emerald-300' : 'text-rose-400'}`}>
              {unlockedBudgetBonusM >= 0 ? `+$${unlockedBudgetBonusM}M` : `-$${Math.abs(unlockedBudgetBonusM)}M`}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <button
              onClick={() => setLeftTab((t) => (t === 'astronaut' ? 'missions' : 'astronaut'))}
              className={`flex-1 rounded border px-2 py-1 text-[10px] font-bold transition ${
                leftTab === 'astronaut'
                  ? 'border-emerald-400 bg-emerald-400 text-slate-950'
                  : 'border-emerald-400/35 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25'
              }`}
            >
              {lang === 'ar' ? 'محاكاة الرائد' : 'Astronaut'}
            </button>
            <button
              onClick={() => setStoryIntroOpen(true)}
              className="rounded border border-cyan-400/35 bg-cyan-500/15 px-2 py-1 text-[10px] font-bold text-cyan-200 hover:bg-cyan-500/25"
            >
              {lang === 'ar' ? 'القصة' : 'Story'}
            </button>
            <button
              onClick={retrySurvivalCampaign}
              title={lang === 'ar' ? 'إعادة ضبط حملة البقاء' : 'Reset Survival Campaign'}
              className="flex items-center justify-center rounded border border-white/15 bg-white/5 px-2 py-1 text-[10px] font-bold text-slate-300 hover:bg-white/10"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Console Sub-Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#070c16] p-1.5">
        <div className="flex flex-wrap items-center gap-1">
          <button
            onClick={() => setLeftTab('missions')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              leftTab === 'missions'
                ? 'bg-cyan-400 text-slate-950'
                : 'text-slate-300 hover:bg-white/5'
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span className="whitespace-nowrap">
              {lang === 'ar'
                ? `تحديات البقاء (${SURVIVAL_MISSIONS.length})`
                : `Survival Challenges (${SURVIVAL_MISSIONS.length})`}
            </span>
          </button>
          <button
            onClick={() => setLeftTab('astronaut')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              leftTab === 'astronaut'
                ? 'bg-emerald-400 text-slate-950'
                : 'text-slate-300 hover:bg-white/5'
            }`}
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span className="whitespace-nowrap">
              {lang === 'ar' ? 'محاكاة رائد الفضاء الحقيقي (EVA & نبض)' : 'Real Astronaut Simulator (EMU & 0-G EVA)'}
            </span>
          </button>
          <button
            onClick={() => setLeftTab('resources')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              leftTab === 'resources'
                ? 'bg-amber-400 text-slate-950'
                : 'text-slate-300 hover:bg-white/5'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span className="whitespace-nowrap">
              {lang === 'ar' ? 'دليل موارد ناسا و CSA' : 'NASA & CSA Docs'}
            </span>
          </button>
          <button
            onClick={toggleHardcoreChallengeMode}
            className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition whitespace-nowrap ${
              isHardcore
                ? 'border-rose-400 bg-rose-500/25 text-rose-100'
                : 'border-white/15 bg-white/5 text-slate-300 hover:border-rose-400/50'
            }`}
            title={
              lang === 'ar'
                ? 'إخفاء أرقام النطاق الآمن وتقليل الوقت وتشديد الدقة مقابل +50% فلوس وميزانية'
                : 'Hide numeric hints, tighten timing & precision for +50% CR & Budget rewards'
            }
          >
            <span>
              {isHardcore
                ? lang === 'ar'
                  ? 'وضع صعب نشط (+50% مكافأة)'
                  : 'HARDCORE ON (+50% PAYOUT)'
                : lang === 'ar'
                  ? 'تفعيل التحدي الصعب'
                  : 'Enable Hardcore'}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 px-2 font-mono text-[11px] tabular-nums">
          <span className="font-bold text-amber-300">SCORE {survivalScore}</span>
          <span className="text-slate-600">·</span>
          <span className={`flex items-center gap-1 font-bold ${astronautBio.heartRateBpm > 115 ? 'text-rose-400' : 'text-emerald-300'}`}>
            <HeartPulse className="h-3.5 w-3.5" />
            <span>{Math.round(astronautBio.heartRateBpm)} BPM</span>
          </span>
          <button
            onClick={() => performAstronautAction('pace_breathing')}
            className="rounded border border-cyan-400/35 bg-cyan-500/15 px-2 py-0.5 text-[10px] font-bold text-cyan-200 hover:bg-cyan-500/25"
            title={lang === 'ar' ? 'تنفس إيقاعي لتهدئة نبض رائد الفضاء' : 'Box breathing calm'}
          >
            {lang === 'ar' ? 'تهدئة النبض' : 'Calm BPM'}
          </button>
        </div>
      </div>

      {leftTab === 'astronaut' ? (
        <RealAstronautSim />
      ) : (
      /* Main Asymmetric Split Console */
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        {/* LEFT COLUMN: Survival Missions Queue OR NASA/CSA Resources Manual */}
        <div className="flex flex-col gap-2.5 rounded-xl border border-white/10 bg-[#080d17] p-3 lg:col-span-4">
          {leftTab === 'missions' ? (
            <div className="max-h-[430px] space-y-1.5 overflow-y-auto pe-1">
              {SURVIVAL_MISSIONS.map((m) => {
                const cleared = completedSurvivalIds.includes(m.id);
                const failed = failedSurvivalIds.includes(m.id) && !cleared;
                const active = m.id === mission.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setActiveSurvivalId(m.id)}
                    className={`w-full rounded-lg border p-2.5 text-start transition ${
                      active
                        ? 'border-cyan-400 bg-cyan-500/15 text-white'
                        : cleared
                          ? 'border-emerald-400/30 bg-emerald-500/5 text-slate-200 hover:border-emerald-400/50'
                          : failed
                            ? 'border-rose-400/35 bg-rose-500/10 text-rose-100 hover:border-rose-400/60'
                            : 'border-white/10 bg-white/[0.02] text-slate-300 hover:border-white/25'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 font-mono text-[10px]">
                      <span className="text-slate-400">
                        {lang === 'ar' ? `مهمة 0${m.order}` : `MISSION 0${m.order}`}
                      </span>
                      <span
                        className={
                          cleared
                            ? 'font-bold text-emerald-400'
                            : failed
                              ? 'font-bold text-rose-400'
                              : active
                                ? 'font-bold text-cyan-300'
                                : 'text-amber-300'
                        }
                      >
                        {cleared
                          ? lang === 'ar'
                            ? '✔ ناجحة'
                            : 'CLEARED'
                          : failed
                            ? lang === 'ar'
                              ? '✖ متضررة'
                              : 'FAILED'
                            : lang === 'ar'
                              ? 'نشطة'
                              : 'ACTIVE'}
                      </span>
                    </div>
                    <div className="mt-1 text-xs font-bold leading-snug">{m.title[lang]}</div>
                    <div className="mt-0.5 truncate text-[10px] text-cyan-300/80">
                      {m.resourceTag[lang]}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="max-h-[430px] space-y-1.5 overflow-y-auto pe-1">
              {NASA_RESOURCE_BRIEFS.map((res) => {
                const active = res.key === selectedResourceKey;
                return (
                  <button
                    key={res.key}
                    onClick={() => setSelectedResourceKey(res.key)}
                    className={`w-full rounded-lg border p-2.5 text-start transition ${
                      active
                        ? 'border-amber-400 bg-amber-500/15 text-white'
                        : 'border-white/10 bg-white/[0.02] text-slate-300 hover:border-white/25'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-[10px] text-slate-400">
                      <span>{res.code}</span>
                      <span className="text-amber-300">{res.agency}</span>
                    </div>
                    <div className="mt-0.5 text-xs font-bold">{res.title[lang]}</div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT STAGE: Interactive 2D Spacecraft Visual + Real-Situation Challenge OR Resource Reference */}
        <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-[#080d17] p-4 lg:col-span-8">
          {leftTab === 'resources' ? (
            /* Full Technical Resource Reference Card + Link to Corresponding Crisis */
            <div className="flex flex-1 flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div>
                    <div className="font-mono text-xs text-amber-300">
                      {activeBrief.code} · {activeBrief.agency}
                    </div>
                    <h3 className="font-display mt-0.5 text-lg font-bold text-white">
                      {activeBrief.title[lang]}
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      const matched = SURVIVAL_MISSIONS.find((m) => m.resourceKey === activeBrief.key);
                      if (matched) setActiveSurvivalId(matched.id);
                      setLeftTab('missions');
                    }}
                    className="rounded-lg bg-cyan-400 px-3.5 py-2 text-xs font-bold text-slate-950 hover:brightness-110"
                  >
                    {lang === 'ar' ? 'انتقال لتحدي هذا المورد' : 'Launch Related Crisis'}
                  </button>
                </div>

                <p className="text-sm leading-relaxed text-slate-200">{activeBrief.summary[lang]}</p>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {activeBrief.keyPillars[lang].map((pillar) => (
                    <div
                      key={pillar}
                      className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-xs font-semibold text-cyan-200"
                    >
                      {pillar}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-black/35 p-3 text-[11px] leading-relaxed text-slate-400">
                {lang === 'ar'
                  ? 'ملاحظة: لا تعتمد وكالة ناسا أي جهة غير حكومية أمريكية، وتُستخدم هذه الموارد التعليمية والمفاهيم الهندسية في المحاكاة التفاعلية لسفينة نوفا-7.'
                  : 'NASA Notice: NASA does not endorse non-U.S. Government entities. Mission engineering frameworks and CSA partner robotics are integrated into NOVA-7’s interactive command simulator.'}
              </div>
            </div>
          ) : (
            /* ACTIVE REAL-SITUATION 2D SPACECRAFT DASHBOARD & CHALLENGE */
            <>
              {/* Top Crisis Header + Countdown Timer */}
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-cyan-300">
                    <span>{mission.resourceTag[lang]}</span>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span className="text-emerald-300 font-bold">
                      {lang === 'ar'
                        ? `مكافأة: +${missionRewardCr} CR · +$${missionBudgetGainM}M ميزانية / خطر: -${mission.hullPenalty}% هيكل`
                        : `REWARD: +${missionRewardCr} CR · +$${missionBudgetGainM}M BUDGET · RISK: -${mission.hullPenalty}% HULL`}
                    </span>
                  </div>
                  <h3 className="font-display text-base font-bold text-white sm:text-lg">
                    {mission.title[lang]}
                  </h3>
                </div>

                <div className="flex items-center gap-2 font-mono tabular-nums">
                  {isMissionCleared ? (
                    <span className="flex items-center gap-1.5 rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-300">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>{lang === 'ar' ? 'تم حل الطوارئ' : 'STABILIZED'}</span>
                    </span>
                  ) : (
                    <div
                      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold ${
                        timeLeft <= 12
                          ? 'border-rose-400/60 bg-rose-500/20 text-rose-200'
                          : 'border-amber-400/40 bg-amber-500/15 text-amber-200'
                      }`}
                    >
                      <Clock className="h-3.5 w-3.5" />
                      <span>{String(timeLeft).padStart(2, '0')}s</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Live 2D Spacecraft Schematic Telemetry Canvas */}
              <div className="grid grid-cols-1 gap-3 rounded-xl border border-cyan-400/20 bg-[#040811] p-3 md:grid-cols-12">
                <div className="md:col-span-5">
                  <svg viewBox="0 0 280 148" className="h-36 w-full rounded-lg border border-white/10 bg-[#050a14]">
                    {/* Coordinate Grid */}
                    <line x1="0" y1="74" x2="280" y2="74" stroke="rgba(56,189,248,0.08)" />
                    <line x1="140" y1="0" x2="140" y2="148" stroke="rgba(56,189,248,0.08)" />

                    {/* GMAT / Mission Viz Orbital Arc */}
                    <ellipse
                      cx="140"
                      cy="74"
                      rx={mission.mechanic === 'gmat_burn' ? Math.max(48, Math.min(125, paramA * 0.11)) : 108}
                      ry="48"
                      fill="none"
                      stroke={mission.resourceKey === 'gmat' || mission.resourceKey === 'mission_viz' ? '#38bdf8' : 'rgba(148,163,184,0.22)'}
                      strokeDasharray="4 3"
                      strokeWidth="1.3"
                    />

                    {/* Eclipse shadow band for Mission Viz */}
                    {mission.mechanic === 'mission_viz_scrub' && (
                      <rect x="176" y="16" width="52" height="116" fill="rgba(15,23,42,0.78)" stroke="rgba(245,158,11,0.35)" strokeDasharray="2 2" />
                    )}

                    {/* 2D NOVA-7 Spacecraft Cross Section */}
                    <g transform="translate(140, 74)">
                      {/* Solar Panels */}
                      <rect x="-56" y="-8" width="24" height="16" rx="2" fill={mission.resourceKey === 'mdl' ? '#f59e0b' : '#1e3a8a'} stroke="#38bdf8" strokeWidth="1" />
                      <rect x="32" y="-8" width="24" height="16" rx="2" fill={mission.resourceKey === 'mdl' ? '#f59e0b' : '#1e3a8a'} stroke="#38bdf8" strokeWidth="1" />
                      {/* Hull Fuselage */}
                      <polygon
                        points="0,-24 22,6 16,22 -16,22 -22,6"
                        fill={hullIntegrity < 40 ? '#7f1d1d' : '#1e293b'}
                        stroke={isMissionCleared ? '#34d399' : isMissionFailedBefore ? '#f43f5e' : '#38bdf8'}
                        strokeWidth="1.6"
                      />
                      {/* Cockpit & Telescope Eye */}
                      <circle cx="0" cy="-6" r="5" fill={mission.resourceKey === 'telescope_game' ? '#22d3ee' : '#0ea5e9'} />
                      {/* CSA Canadarm schematic */}
                      <polyline
                        points={
                          mission.mechanic === 'csa_alignment'
                            ? `18,4 ${18 + paramA * 0.28},-12 ${26 + paramA * 0.34},${-20 + (100 - paramB) * 0.3}`
                            : '18,4 34,-8 44,-14'
                        }
                        fill="none"
                        stroke="#fbbf24"
                        strokeWidth="2"
                      />
                    </g>

                    {/* Moving Orbit Marker for Mission Viz Scrub */}
                    {mission.mechanic === 'mission_viz_scrub' && (
                      <circle
                        cx={140 + Math.cos(paramA * Math.PI * 2) * 108}
                        cy={74 + Math.sin(paramA * Math.PI * 2) * 48}
                        r="5"
                        fill={paramA >= 0.58 && paramA <= 0.72 ? '#f59e0b' : '#22d3ee'}
                      />
                    )}

                    <text x="10" y="16" fill="#94a3b8" fontSize="8.5" fontFamily="monospace">
                      NOVA-7 2D SCHEMATIC · {mission.resourceKey.toUpperCase()}
                    </text>
                    <text x="10" y="138" fill="#38bdf8" fontSize="8.5" fontFamily="monospace">
                      HULL {Math.round(hullIntegrity)}% · PWR {Math.round(resources.battery)}% · O2 {Math.round(resources.suitO2)}%
                    </text>
                  </svg>
                </div>

                {/* Right Crisis Situation Prose + Tips & Tricks */}
                <div className="flex flex-col justify-between gap-2 md:col-span-7">
                  <div>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span>{lang === 'ar' ? 'الموقف التشغيلي الحقيقي' : 'LIVE SPACECRAFT SITUATION'}</span>
                      </div>
                      <button
                        onClick={() => setShowTips((v) => !v)}
                        className={`flex items-center gap-1 rounded-md border px-2.5 py-1 text-[11px] font-bold transition ${
                          showTips
                            ? 'border-amber-400 bg-amber-400 text-slate-950'
                            : 'border-amber-400/45 bg-amber-500/15 text-amber-200 hover:bg-amber-500/25'
                        }`}
                      >
                        <Lightbulb className="h-3.5 w-3.5" />
                        <span>
                          {showTips
                            ? lang === 'ar'
                              ? 'إخفاء الحيل'
                              : 'Hide Tips'
                            : lang === 'ar'
                              ? 'حيل وتلميحات الحل'
                              : 'Tips & Tricks'}
                        </span>
                      </button>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-200 sm:text-[13px]">
                      {mission.situation[lang]}
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-cyan-200">
                    {mission.prompt[lang]}
                  </div>
                </div>
              </div>

              {/* MISSION TIPS & TRICKS PANEL */}
              {showTips && !outcomeBanner && (
                <div className="rounded-xl border border-amber-400/35 bg-amber-500/10 p-3 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-400/20 pb-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-amber-300">
                      <Lightbulb className="h-4 w-4" />
                      <span>
                        {lang === 'ar'
                          ? 'تلميحات وحيل حل هذه المهمة (Tips & Tricks)'
                          : 'Mission-Solving Tips & Tricks'}
                      </span>
                    </div>
                    <span className="rounded bg-black/40 px-2 py-0.5 font-mono text-[10px] font-bold text-cyan-200">
                      {mission.quickTrick[lang]}
                    </span>
                  </div>
                  <ul className="mt-2 space-y-1 text-[11px] leading-relaxed text-slate-100">
                    {mission.tipsAndTricks[lang].map((tip) => (
                      <li key={tip}>• {tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* WIN / LOSS FEEDBACK BANNER OR INTERACTIVE CONSOLE */}
              {outcomeBanner ? (
                <div
                  className={`rounded-xl border p-4 ${
                    outcomeBanner.won
                      ? 'border-emerald-400/50 bg-emerald-500/10'
                      : 'border-rose-400/50 bg-rose-500/10'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-white">
                      {outcomeBanner.won ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      ) : (
                        <XCircle className="h-5 w-5 text-rose-400" />
                      )}
                      <span>{outcomeBanner.headline}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {!outcomeBanner.won && (
                        <button
                          onClick={retryCurrentMission}
                          className="flex items-center gap-1.5 rounded-lg bg-amber-400 px-3.5 py-2 text-xs font-bold text-slate-950 hover:brightness-110"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>{lang === 'ar' ? 'إعادة المحاولة' : 'Retry Crisis'}</span>
                        </button>
                      )}
                      {completedSurvivalIds.length < SURVIVAL_MISSIONS.length && (
                        <button
                          onClick={jumpToNextPendingMission}
                          className="rounded-lg bg-cyan-400 px-3.5 py-2 text-xs font-bold text-slate-950 hover:brightness-110"
                        >
                          {lang === 'ar' ? 'المهمة التالية' : 'Next Mission'}
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-100">{outcomeBanner.detail}</p>
                  <div className="mt-2.5 flex items-start gap-2 rounded-lg border border-white/10 bg-black/40 p-2.5 text-[11px] text-cyan-200">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-400" />
                    <span>{outcomeBanner.fact}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* 1. CHOICE-BASED CRISIS (4 Segments / CML 1-4 / VR Challenge) */}
                  {mission.mechanic === 'choice' && mission.options && (
                    <div className="grid grid-cols-1 gap-2">
                      {mission.options.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => submitChoice(opt.id)}
                          className="rounded-xl border border-white/12 bg-white/[0.03] p-3 text-start transition hover:border-cyan-400/60 hover:bg-cyan-500/10"
                        >
                          <div className="text-xs font-bold text-white">{opt.label[lang]}</div>
                          <div className="mt-0.5 text-[11px] text-slate-400">{opt.detail[lang]}</div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* 2. INTERACTIVE RANGE & MODE TUNING (GMAT / MDL / Mission Viz / CSA Canadarm) */}
                  {(mission.mechanic === 'gmat_burn' ||
                    mission.mechanic === 'mdl_balance' ||
                    mission.mechanic === 'mission_viz_scrub' ||
                    mission.mechanic === 'csa_alignment') &&
                    mission.targetRange && (
                      <div className="space-y-3 rounded-xl border border-white/10 bg-black/35 p-3.5">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div>
                            <div className="mb-1 flex items-center justify-between text-xs">
                              <span className="font-semibold text-slate-200">
                                {stripRangeSpoiler(mission.targetRange.paramALabel[lang])}
                              </span>
                              <span className="font-mono font-bold text-cyan-300 tabular-nums">
                                {paramA} {mission.targetRange.paramAUnit}
                              </span>
                            </div>
                            <input
                              type="range"
                              min={mission.targetRange.paramAMin}
                              max={mission.targetRange.paramAMax}
                              step={mission.targetRange.paramAStep}
                              value={paramA}
                              onChange={(e) => setParamA(Number(e.target.value))}
                              className="w-full accent-cyan-400"
                            />
                          </div>

                          {mission.targetRange.paramBLabel && (
                            <div>
                              <div className="mb-1 flex items-center justify-between text-xs">
                                <span className="font-semibold text-slate-200">
                                  {stripRangeSpoiler(mission.targetRange.paramBLabel[lang])}
                                </span>
                                <span className="font-mono font-bold text-amber-300 tabular-nums">
                                  {paramB} {mission.targetRange.paramBUnit}
                                </span>
                              </div>
                              <input
                                type="range"
                                min={mission.targetRange.paramBMin}
                                max={mission.targetRange.paramBMax}
                                step={mission.targetRange.paramBStep}
                                value={paramB}
                                onChange={(e) => setParamB(Number(e.target.value))}
                                className="w-full accent-amber-400"
                              />
                            </div>
                          )}
                        </div>

                        {mission.targetRange.presetModes && (
                          <div>
                            <div className="mb-1.5 text-xs font-semibold text-slate-300">
                              {mission.targetRange.presetModeLabel?.[lang]}
                            </div>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                              {mission.targetRange.presetModes.map((pm) => (
                                <button
                                  key={pm.id}
                                  onClick={() => setSelectedPresetId(pm.id)}
                                  className={`rounded-lg border px-3 py-2 text-start text-[11px] font-bold transition ${
                                    selectedPresetId === pm.id
                                      ? 'border-cyan-400 bg-cyan-500/20 text-white'
                                      : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25'
                                  }`}
                                >
                                  {pm.label[lang]}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex justify-end pt-1">
                          <button
                            onClick={submitRangeChallenge}
                            className="flex items-center gap-2 rounded-lg bg-cyan-400 px-5 py-2.5 text-xs font-bold text-slate-950 hover:brightness-110"
                          >
                            <Wrench className="h-4 w-4" />
                            <span>
                              {lang === 'ar' ? 'تنفيذ الحل الهندسي' : 'Execute Engineering Solution'}
                            </span>
                          </button>
                        </div>
                      </div>
                    )}

                  {/* 3. 3-LEVEL SPACE TELESCOPE DESIGN CHALLENGE */}
                  {mission.mechanic === 'telescope_levels' && (
                    <div className="space-y-3 rounded-xl border border-white/10 bg-black/35 p-3.5">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                          <Telescope className="h-4 w-4" />
                          <span>
                            {lang === 'ar' ? currentScopeLvl.titleAr : currentScopeLvl.titleEn}
                          </span>
                        </div>
                        <span className="font-mono text-[11px] font-bold text-cyan-300">
                          LEVEL {currentScopeLvl.level} / 3
                        </span>
                      </div>

                      <div className="text-xs text-slate-300">
                        <span className="font-bold text-white">
                          {currentScopeObjMeta?.name[lang]}
                        </span>{' '}
                        — {lang === 'ar' ? currentScopeLvl.briefAr : currentScopeLvl.briefEn}
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <div className="mb-1.5 text-[11px] font-bold text-cyan-300">
                            {lang === 'ar' ? 'الطول الموجي' : 'Wavelength Band'}
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            {TELESCOPE_WAVELENGTHS.map((w) => (
                              <button
                                key={w.id}
                                onClick={() => setScopeWave(w.id)}
                                className={`rounded-lg border px-2.5 py-2 text-start text-[11px] font-semibold transition ${
                                  scopeWave === w.id
                                    ? 'border-cyan-400 bg-cyan-500/20 text-white'
                                    : 'border-white/10 bg-white/[0.03] text-slate-300'
                                }`}
                              >
                                {w.label[lang]}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div className="mb-1.5 text-[11px] font-bold text-emerald-300">
                            {lang === 'ar' ? 'نظام المرايا والبصريات' : 'Optical System'}
                          </div>
                          <div className="grid grid-cols-1 gap-1.5">
                            {TELESCOPE_OPTICS.map((op) => (
                              <button
                                key={op.id}
                                onClick={() => setScopeOptic(op.id)}
                                className={`rounded-lg border px-2.5 py-1.5 text-start text-[11px] font-semibold transition ${
                                  scopeOptic === op.id
                                    ? 'border-emerald-400 bg-emerald-500/20 text-white'
                                    : 'border-white/10 bg-white/[0.03] text-slate-300'
                                }`}
                              >
                                {op.label[lang]}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          onClick={submitTelescopeLevel}
                          className="flex items-center gap-2 rounded-lg bg-emerald-400 px-5 py-2 text-xs font-bold text-slate-950 hover:brightness-110"
                        >
                          <Sparkles className="h-4 w-4" />
                          <span>
                            {scopeLevelIdx < 2
                              ? lang === 'ar'
                                ? `معايرة المستوى ${currentScopeLvl.level}`
                                : `Calibrate Level ${currentScopeLvl.level}`
                              : lang === 'ar'
                                ? 'إطلاق المرصد النهائي (مستوى 3)'
                                : 'Launch Final Level 3 Observatory'}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 4. CUBESAT 101 4-STEP LIFECYCLE SEQUENCER */}
                  {mission.mechanic === 'cubesat_sequence' && (
                    <div className="space-y-3 rounded-xl border border-white/10 bg-black/35 p-3.5">
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {cubeDisplayOrder.map((st) => {
                          const pickedIdx = cubeSeq.indexOf(st.id);
                          return (
                            <button
                              key={st.id}
                              onClick={() => {
                                if (pickedIdx !== -1) return;
                                setCubeSeq((prev) => [...prev, st.id]);
                              }}
                              className={`flex items-center justify-between gap-2 rounded-lg border p-2.5 text-start text-xs font-semibold transition ${
                                pickedIdx !== -1
                                  ? 'border-cyan-400 bg-cyan-500/20 text-white'
                                  : 'border-white/12 bg-white/[0.03] text-slate-200 hover:border-cyan-400/50'
                              }`}
                            >
                              <span>{lang === 'ar' ? st.ar.replace(/^\d\.\s*/, '') : st.en.replace(/^\d\.\s*/, '')}</span>
                              {pickedIdx !== -1 && (
                                <span className="font-mono text-xs font-bold text-amber-300">
                                  #{pickedIdx + 1}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <button
                          onClick={() => setCubeSeq([])}
                          className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-white/10"
                        >
                          {lang === 'ar' ? 'إعادة ترتيب' : 'Reset Sequence'}
                        </button>
                        <button
                          disabled={cubeSeq.length < 4}
                          onClick={submitCubeSatSequence}
                          className="rounded-lg bg-cyan-400 px-5 py-2 text-xs font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-45"
                        >
                          {lang === 'ar' ? 'إطلاق CubeSat 3U' : 'Deploy CubeSat 3U'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
