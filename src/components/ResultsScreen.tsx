import { AlertTriangle, Award, Home, Play, RotateCcw, ShieldAlert } from 'lucide-react';
import { SURVIVAL_MISSIONS } from '../data/nasaSurvivalData';
import { useGameStore } from '../store/gameStore';
import { FailureAndReportPanel } from './FailureAndReportPanel';

export function ResultsScreen() {
  const lang = useGameStore((s) => s.lang);
  const outcome = useGameStore((s) => s.missionOutcome);
  const discoveredPlanets = useGameStore((s) => s.discoveredPlanets);
  const collectedSampleIds = useGameStore((s) => s.collectedSampleIds);
  const ringsPassed = useGameStore((s) => s.ringsPassed);
  const asteroidsMined = useGameStore((s) => s.asteroidsMined);
  const resources = useGameStore((s) => s.resources);
  const hullIntegrity = useGameStore((s) => s.hullIntegrity);
  const survivalFailures = useGameStore((s) => s.survivalFailures);
  const completedSurvivalIds = useGameStore((s) => s.completedSurvivalIds);
  const setScreen = useGameStore((s) => s.setScreen);
  const startNewGameFlow = useGameStore((s) => s.startNewGameFlow);
  const retrySurvivalCampaign = useGameStore((s) => s.retrySurvivalCampaign);
  const respawnAtSpacecraft = useGameStore((s) => s.respawnAtSpacecraft);

  if (!outcome) return null;

  const isFailure = !outcome.success;

  return (
    <div className="relative z-30 flex h-full w-full items-start justify-center overflow-y-auto px-4 py-6">
      <div
        className={`nova-panel w-full max-w-4xl rounded-3xl p-6 sm:p-8 ${
          isFailure ? 'border-rose-500/45' : ''
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <div
              className={`flex items-center gap-2 ${
                isFailure ? 'text-rose-400' : 'text-amber-300'
              }`}
            >
              {isFailure ? (
                <ShieldAlert className="h-5 w-5" />
              ) : (
                <Award className="h-5 w-5" />
              )}
              <span className="font-mono-tech text-xs uppercase tracking-widest">
                {isFailure
                  ? lang === 'ar'
                    ? 'تقرير فقدان المهمة — طوارئ البقاء'
                    : 'CRITICAL SURVIVAL FAILURE REPORT'
                  : 'EXPEDITION REPORT'}
              </span>
            </div>
            <h2 className="font-display mt-1 text-2xl font-bold text-white sm:text-3xl">
              {outcome.endingTitle[lang]}
            </h2>
          </div>

          <div
            className={`flex h-20 w-20 flex-col items-center justify-center rounded-2xl border ${
              isFailure
                ? 'border-rose-500/60 bg-rose-500/20'
                : 'border-cyan-400/50 bg-cyan-500/15'
            }`}
          >
            <span className={`text-[10px] ${isFailure ? 'text-rose-200' : 'text-cyan-200'}`}>
              {lang === 'ar' ? 'الرتبة' : 'RANK'}
            </span>
            <span className="font-display text-3xl font-bold text-white">{outcome.grade}</span>
          </div>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-slate-300">{outcome.summary[lang]}</p>

        {isFailure && outcome.failureReason && (
          <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
            <div>
              <div className="font-bold">
                {lang === 'ar' ? 'سبب الخسارة المباشر:' : 'Direct Loss Cause:'}
              </div>
              <div className="mt-0.5 leading-relaxed">{outcome.failureReason[lang]}</div>
            </div>
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="text-[11px] text-slate-400">
              {lang === 'ar' ? 'مهام البقاء 2D' : 'Survival Missions'}
            </div>
            <div className="font-mono-tech mt-1 text-xl font-bold text-emerald-300 tabular-nums">
              {completedSurvivalIds.length}/{SURVIVAL_MISSIONS.length}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="text-[11px] text-slate-400">
              {lang === 'ar' ? 'سلامة الهيكل' : 'Hull Integrity'}
            </div>
            <div
              className={`font-mono-tech mt-1 text-xl font-bold tabular-nums ${
                hullIntegrity <= 20 ? 'text-rose-400' : 'text-cyan-300'
              }`}
            >
              {Math.round(hullIntegrity)}%
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="text-[11px] text-slate-400">
              {lang === 'ar' ? 'النقاط الإجمالية' : 'Total Score'}
            </div>
            <div className="font-mono-tech mt-1 text-xl font-bold text-amber-300 tabular-nums">
              {outcome.score}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="text-[11px] text-slate-400">
              {lang === 'ar' ? 'الكواكب / العينات' : 'Worlds / Samples'}
            </div>
            <div className="font-mono-tech mt-1 text-xl font-bold text-violet-300 tabular-nums">
              {discoveredPlanets.length}/6 · {collectedSampleIds.length}
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-xl bg-white/5 px-4 py-2.5 text-xs text-slate-300">
          {lang === 'ar' ? 'إخفاقات الطوارئ:' : 'Critical Strikes:'}{' '}
          <span className="font-mono-tech font-bold text-rose-300">{survivalFailures}/3</span> •{' '}
          DSN:{' '}
          <span className="font-mono-tech font-bold text-cyan-300">
            {Math.round(resources.dataTransmitted)} MB
          </span>{' '}
          • {lang === 'ar' ? 'حلقات/كويكبات:' : 'Rings/Ore:'}{' '}
          <span className="font-mono-tech font-bold text-amber-300">
            {ringsPassed}/{asteroidsMined}
          </span>
        </div>

        <div className="mt-4">
          <FailureAndReportPanel compact />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {isFailure ? (
            <>
              <button
                onClick={respawnAtSpacecraft}
                className="flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 text-xs font-bold text-slate-950 hover:brightness-110"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>
                  {lang === 'ar'
                    ? 'إعادة الإنعاش والتزود داخل المركبة'
                    : 'Respawn & Refuel at Spacecraft'}
                </span>
              </button>
              <button
                onClick={retrySurvivalCampaign}
                className="flex items-center gap-2 rounded-xl bg-rose-500 px-5 py-3 text-xs font-bold text-white hover:brightness-110"
              >
                <RotateCcw className="h-4 w-4" />
                <span>
                  {lang === 'ar'
                    ? 'إعادة مهام البقاء 2D وإنقاذ السفينة'
                    : 'Retry 2D Survival Missions'}
                </span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setScreen('playing')}
              className="flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 text-xs font-bold text-slate-950"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>{lang === 'ar' ? 'متابعة الطيران الحر' : 'Continue Free Flight'}</span>
            </button>
          )}
          <button
            onClick={startNewGameFlow}
            className="flex items-center gap-2 rounded-xl border border-amber-400/40 bg-amber-500/15 px-5 py-3 text-xs font-bold text-amber-200"
          >
            <RotateCcw className="h-4 w-4" />
            <span>{lang === 'ar' ? 'رحلة جديدة' : 'New Expedition'}</span>
          </button>
          <button
            onClick={() => setScreen('menu')}
            className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-xs font-bold text-slate-200"
          >
            <Home className="h-4 w-4" />
            <span>{lang === 'ar' ? 'القائمة الرئيسية' : 'Main Menu'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
