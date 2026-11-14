import { AlertTriangle, ArrowLeft, ArrowRight, LayoutDashboard, Orbit, Play, ShieldAlert, SkipForward } from 'lucide-react';
import { useState } from 'react';
import { getDisplayCommander } from '../data/i18n';
import { STORY_CHAPTERS } from '../data/nasaSurvivalData';
import { useGameStore } from '../store/gameStore';

export function StoryIntroModal() {
  const [step, setStep] = useState(0);

  const lang = useGameStore((s) => s.lang);
  const storyIntroOpen = useGameStore((s) => s.storyIntroOpen);
  const character = useGameStore((s) => s.character);
  const setStoryIntroOpen = useGameStore((s) => s.setStoryIntroOpen);
  const openSurvivalDashboard2d = useGameStore((s) => s.openSurvivalDashboard2d);

  if (!storyIntroOpen) return null;

  const chapter = STORY_CHAPTERS[step] || STORY_CHAPTERS[0];
  const isLast = step === STORY_CHAPTERS.length - 1;
  const commanderName = getDisplayCommander(character.name, lang);

  const accentBorder =
    chapter.accentColor === 'amber'
      ? 'border-amber-400/35'
      : chapter.accentColor === 'emerald'
        ? 'border-emerald-400/35'
        : 'border-cyan-400/35';

  return (
    <div className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-[#04070e]/92 p-4 backdrop-blur-sm">
      <div className={`w-full max-w-4xl overflow-hidden rounded-2xl border ${accentBorder} bg-[#090e18] shadow-2xl`}>
        {/* Top Ribbon */}
        <div className="flex items-center justify-between border-b border-white/10 bg-[#060910] px-6 py-3">
          <div className="flex items-center gap-2.5 text-xs font-mono tabular-nums text-cyan-300">
            <Orbit className="h-4 w-4" />
            <span>NOVA-7 EXPEDITION BRIEFING</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-slate-300">
              {lang === 'ar' ? `الفصل ${chapter.chapterNum} / 03` : `CHAPTER ${chapter.chapterNum} / 03`}
            </span>
          </div>
          <button
            onClick={() => setStoryIntroOpen(false)}
            className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <SkipForward className="h-3.5 w-3.5" />
            <span className="whitespace-nowrap">{lang === 'ar' ? 'تخطي القصة' : 'Skip Intro'}</span>
          </button>
        </div>

        {/* Main 2-Column Split */}
        <div className="grid grid-cols-1 items-stretch md:grid-cols-12">
          {/* Left Visual Schematic */}
          <div className="flex flex-col justify-between border-b border-white/10 bg-[#060a13] p-6 md:col-span-5 md:border-b-0 md:border-e">
            <div className="space-y-2">
              <div className="font-mono text-[11px] font-semibold tracking-wider text-amber-300">
                {lang === 'ar' ? `القائد: ${commanderName}` : `COMMANDER: ${commanderName}`}
              </div>
              <div className="font-mono text-xs text-slate-400">
                {lang === 'ar' ? 'بروتوكول النجاة 2089 • 9 مهام هندسية' : 'SECTOR ZENITH 2089 · 9 SURVIVAL MISSIONS'}
              </div>
            </div>

            {/* Clean Scientific Orbital / Mission Graphic */}
            <div className="my-5 flex items-center justify-center">
              <svg viewBox="0 0 240 190" className="h-44 w-full max-w-[230px]">
                <defs>
                  <radialGradient id="storySun" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={step === 0 ? '#f59e0b' : step === 1 ? '#38bdf8' : '#10b981'} stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#090e18" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <rect width="240" height="190" rx="10" fill="#050811" stroke="rgba(148,163,184,0.16)" />
                {/* Coordinate grid */}
                <line x1="0" y1="95" x2="240" y2="95" stroke="rgba(56,189,248,0.1)" strokeDasharray="3 3" />
                <line x1="120" y1="0" x2="120" y2="190" stroke="rgba(56,189,248,0.1)" strokeDasharray="3 3" />

                <circle cx="120" cy="95" r="48" fill="url(#storySun)" opacity="0.45" />
                <ellipse cx="120" cy="95" rx="88" ry="48" fill="none" stroke="rgba(56,189,248,0.38)" strokeWidth="1.2" transform="rotate(-14 120 95)" />
                <ellipse cx="120" cy="95" rx="64" ry="30" fill="none" stroke="rgba(245,158,11,0.45)" strokeDasharray="4 3" strokeWidth="1.2" transform="rotate(12 120 95)" />

                {/* Central Planet / Sun */}
                <circle cx="120" cy="95" r="14" fill={step === 0 ? '#f59e0b' : step === 1 ? '#0284c7' : '#059669'} />

                {/* Spacecraft Marker */}
                <g transform={`translate(${step === 0 ? 185 : step === 1 ? 66 : 162}, ${step === 0 ? 64 : step === 1 ? 118 : 132})`}>
                  <circle r="10" fill="rgba(34,211,238,0.15)" stroke="#22d3ee" strokeWidth="1" />
                  <polygon points="0,-5 5,4 -5,4" fill="#e2e8f0" />
                </g>

                {/* Relay Nodes */}
                <circle cx="48" cy="58" r="4" fill="#38bdf8" />
                <circle cx="192" cy="128" r="4" fill="#a855f7" />
                <text x="14" y="176" fill="#94a3b8" fontSize="9" fontFamily="monospace">
                  {step === 0
                    ? 'GMAT / TELEMETRY ALERT'
                    : step === 1
                      ? 'CML 1-4 / MDL SUBSYSTEMS'
                      : 'TELESCOPE · CUBESAT · CSA'}
                </text>
              </svg>
            </div>

            <div className="rounded-xl border border-amber-400/25 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-100">
              <div className="mb-1 flex items-center gap-1.5 font-bold text-amber-300">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span>{lang === 'ar' ? 'ملاحظة البقاء الحاسمة' : 'SURVIVAL TELEMETRY NOTE'}</span>
              </div>
              <p className="text-[11px] text-slate-200">{chapter.telemetryNote[lang]}</p>
            </div>
          </div>

          {/* Right Narrative Prose & Actions */}
          <div className="flex flex-col justify-between p-6 md:col-span-7">
            <div className="space-y-4">
              <div>
                <div className="text-xs font-semibold text-cyan-400">{chapter.subtitle[lang]}</div>
                <h2 className="font-display mt-1 text-2xl font-bold text-white" style={{ textWrap: 'balance' }}>
                  {chapter.title[lang]}
                </h2>
              </div>

              <p className="text-sm leading-7 text-slate-200">{chapter.narrative[lang]}</p>

              {/* Survival Rules Summary Box */}
              <div className="grid grid-cols-3 gap-2.5 border-t border-white/10 pt-4 font-mono text-xs tabular-nums">
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
                  <div className="text-[10px] text-slate-400">{lang === 'ar' ? 'المكسب' : 'WIN REWARD'}</div>
                  <div className="mt-0.5 font-bold text-emerald-300">
                    {lang === 'ar' ? '+هيكل +طاقة +بيانات' : '+Hull +PWR +Data'}
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
                  <div className="text-[10px] text-slate-400">{lang === 'ar' ? 'الخسارة' : 'WRONG / TIMEOUT'}</div>
                  <div className="mt-0.5 font-bold text-rose-300">
                    {lang === 'ar' ? '-هيكل -أكسجين' : '-Hull -O2 +Strike'}
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
                  <div className="text-[10px] text-slate-400">{lang === 'ar' ? 'شرط الفشل' : 'GAME OVER'}</div>
                  <div className="mt-0.5 font-bold text-amber-300">
                    {lang === 'ar' ? '3 أخطاء أو 0% هيكل' : '3 Strikes / 0% Hull'}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Controls */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
              <div className="flex items-center gap-1.5">
                {STORY_CHAPTERS.map((ch, idx) => (
                  <button
                    key={ch.id}
                    onClick={() => setStep(idx)}
                    aria-label={`Chapter ${idx + 1}`}
                    className={`h-2 rounded-full transition-all ${
                      idx === step ? 'w-7 bg-cyan-400' : 'w-2 bg-slate-700 hover:bg-slate-500'
                    }`}
                  />
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {step > 0 && (
                  <button
                    onClick={() => setStep((s) => Math.max(0, s - 1))}
                    className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-bold text-slate-200 hover:bg-white/10"
                  >
                    {lang === 'ar' ? <ArrowRight className="h-3.5 w-3.5" /> : <ArrowLeft className="h-3.5 w-3.5" />}
                    <span className="whitespace-nowrap">{lang === 'ar' ? 'السابق' : 'Previous'}</span>
                  </button>
                )}

                {!isLast ? (
                  <button
                    onClick={() => setStep((s) => Math.min(STORY_CHAPTERS.length - 1, s + 1))}
                    className="flex items-center gap-1.5 rounded-lg bg-cyan-400 px-4 py-2 text-xs font-bold text-slate-950 hover:brightness-110"
                  >
                    <span className="whitespace-nowrap">{lang === 'ar' ? 'الفصل التالي' : 'Next Chapter'}</span>
                    {lang === 'ar' ? <ArrowLeft className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5" />}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setStoryIntroOpen(false)}
                      className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-white/10"
                    >
                      <Play className="h-3.5 w-3.5" />
                      <span className="whitespace-nowrap">{lang === 'ar' ? 'استكشاف جسر 3D' : 'Enter 3D Bridge'}</span>
                    </button>
                    <button
                      onClick={openSurvivalDashboard2d}
                      className="flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950 hover:brightness-110"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      <span className="whitespace-nowrap">
                        {lang === 'ar' ? 'دخول لوحة المركبة 2D ومهام البقاء' : 'Open 2D Survival Dashboard'}
                      </span>
                    </button>
                  </>
                )}

                {!isLast && (
                  <button
                    onClick={openSurvivalDashboard2d}
                    className="flex items-center gap-1.5 rounded-lg border border-amber-400/45 bg-amber-500/15 px-3.5 py-2 text-xs font-bold text-amber-200 hover:bg-amber-500/25"
                  >
                    <ShieldAlert className="h-3.5 w-3.5" />
                    <span className="whitespace-nowrap">
                      {lang === 'ar' ? 'لوحة الطوارئ 2D مباشرة' : 'Go Straight to 2D Dashboard'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
