import { Award, Compass, Globe, Play, RotateCcw, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { INITIAL_CREW } from '../data/novaData';
import { UI_COPY } from '../data/i18n';
import { useGameStore } from '../store/gameStore';
import type { DifficultyLevel } from '../types/game';

const DIFFS: DifficultyLevel[] = ['Cadet', 'Commander', 'Veteran'];

export function MainMenu() {
  const lang = useGameStore((s) => s.lang);
  const toggleLang = useGameStore((s) => s.toggleLang);
  const difficulty = useGameStore((s) => s.difficulty);
  const setDifficulty = useGameStore((s) => s.setDifficulty);
  const startNewGameFlow = useGameStore((s) => s.startNewGameFlow);
  const continueSavedGame = useGameStore((s) => s.continueSavedGame);
  const hasSavedGame = useGameStore((s) => s.hasSavedGame);
  const setArchitectOpen = useGameStore((s) => s.setArchitectOpen);
  const setPitchDeckOpen = useGameStore((s) => s.setPitchDeckOpen);

  return (
    <div className="relative z-20 flex h-full w-full items-center justify-center overflow-y-auto px-4 py-6">
      {/* Top Language Toggle */}
      <div className="absolute end-5 top-5">
        <button
          onClick={toggleLang}
          className="nova-panel flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-cyan-200 transition hover:border-cyan-400/60 hover:text-white"
        >
          <Globe className="h-4 w-4 text-cyan-400" />
          <span className="whitespace-nowrap">{UI_COPY.langToggle[lang]}</span>
        </button>
      </div>

      <div className="nova-panel w-full max-w-4xl rounded-3xl p-6 sm:p-9">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
          {/* Left / Brand Hero */}
          <div className="space-y-5 lg:col-span-7">
            <div className="flex items-center gap-4">
              {/* Custom SVG Orbital Emblem */}
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/35 bg-cyan-500/10">
                <svg viewBox="0 0 64 64" className="h-11 w-11">
                  <circle cx="32" cy="32" r="11" fill="#38bdf8" opacity="0.9" />
                  <ellipse
                    cx="32"
                    cy="32"
                    rx="27"
                    ry="10"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2.5"
                    transform="rotate(-24 32 32)"
                  />
                  <circle cx="52" cy="22" r="3.5" fill="#fde047" />
                </svg>
              </div>
              <div>
                <p className="font-mono-tech text-xs tracking-widest text-cyan-400 uppercase">
                  DEEP SPACE PROGRAM 2089 · TEAM: ORBITAL THINK TANK
                </p>
                <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  {UI_COPY.brandTitle[lang]}
                </h1>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
              {UI_COPY.menuSubtitle[lang]}
            </p>

            {/* Feature Highlights */}
            <div className="grid grid-cols-2 gap-2.5 text-xs text-slate-200 sm:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                <div className="font-bold text-amber-300">
                  {lang === 'ar' ? 'داخل المركبة' : 'Ship Bridge'}
                </div>
                <div className="text-[11px] text-slate-400">
                  {lang === 'ar' ? 'قمرة + قهوة + زراعة' : 'Human Habitat Deck'}
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                <div className="font-bold text-cyan-300">
                  {lang === 'ar' ? 'قيادة الطيارة 3D' : 'Realistic Flight'}
                </div>
                <div className="text-[11px] text-slate-400">
                  {lang === 'ar' ? '8 كواكب + القمر بالترتيب' : 'All 8 Planets & Moon'}
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                <div className="font-bold text-emerald-300">
                  {lang === 'ar' ? 'روفر 6 عجلات' : '6x6 Rover'}
                </div>
                <div className="text-[11px] text-slate-400">
                  {lang === 'ar' ? 'هبوط + فحص الحفر' : 'Surface & Craters'}
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                <div className="font-bold text-violet-300">
                  {lang === 'ar' ? 'سكاي AI باسمك' : 'Sky AI Voice'}
                </div>
                <div className="text-[11px] text-slate-400">
                  {lang === 'ar' ? 'كتابة عربي • صوت EN' : 'English TTS • EN/AR'}
                </div>
              </div>
            </div>

            {/* Simple 3-Step Mission Design Flow */}
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/[0.08] px-3.5 py-2.5 text-xs">
              <div className="font-mono-tech text-[10px] font-bold tracking-wider text-emerald-300 uppercase">
                {lang === 'ar'
                  ? 'حلّ تحدي التصميم الفضائي في 3 خطوات بسيطة:'
                  : 'COMPLETE MISSION DESIGN LOOP IN 3 SIMPLE STEPS:'}
              </div>
              <div className="mt-1 font-semibold text-slate-100">
                {lang === 'ar'
                  ? '1. اختر المهمة والمركبة ← 2. وازِن الكتلة والطاقة والميزانية ← 3. طِر بمركبتك 3D'
                  : '1. Pick Goal & Spacecraft → 2. Balance Mass, Power & Data → 3. Fly It in 3D'}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-1">
              <button
                onClick={() => setArchitectOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/25 whitespace-nowrap shrink-0 transition hover:brightness-110"
              >
                <Compass className="h-4 w-4" />
                <span>
                  {lang === 'ar' ? 'صمّم مهمتك وانطلق 3D (1-4)' : 'Design & Fly Mission (1-4P)'}
                </span>
              </button>

              <button
                onClick={startNewGameFlow}
                className="flex items-center gap-2 rounded-xl border border-cyan-400/45 bg-cyan-500/15 px-5 py-3.5 text-sm font-bold text-cyan-200 whitespace-nowrap shrink-0 transition hover:bg-cyan-500/25"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>
                  {lang === 'ar' ? 'طيران سريع 3D' : UI_COPY.newExpedition[lang]}
                </span>
              </button>

              {hasSavedGame && (
                <button
                  onClick={continueSavedGame}
                  className="flex items-center gap-2 rounded-xl border border-amber-400/45 bg-amber-500/15 px-5 py-3.5 text-sm font-bold text-amber-200 whitespace-nowrap shrink-0 transition hover:bg-amber-500/25"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>{UI_COPY.continueSave[lang]}</span>
                </button>
              )}

              <button
                onClick={() => setPitchDeckOpen(true)}
                className="flex items-center gap-2 rounded-xl border border-violet-400/45 bg-violet-500/15 px-4 py-3.5 text-sm font-bold text-violet-200 whitespace-nowrap shrink-0 transition hover:bg-violet-500/25"
              >
                <Award className="h-4 w-4 text-violet-300" />
                <span>{lang === 'ar' ? 'عرض المسابقة ومصادر NASA/CSA' : 'Competition Pitch & Sources'}</span>
              </button>
            </div>
          </div>

          {/* Right / Difficulty + Bridge Crew */}
          <div className="space-y-4 lg:col-span-5">
            <div className="rounded-2xl border border-white/10 bg-slate-950/65 p-4">
              <div className="mb-3 flex items-center gap-2 text-xs font-bold tracking-wider text-cyan-300 uppercase">
                <ShieldCheck className="h-4 w-4" />
                <span>{UI_COPY.selectDifficulty[lang]}</span>
              </div>
              <div className="space-y-2">
                {DIFFS.map((d) => {
                  const selected = difficulty === d;
                  return (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={`w-full rounded-xl border px-3.5 py-2.5 text-start transition ${
                        selected
                          ? 'border-cyan-400 bg-cyan-500/15 text-white'
                          : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/25'
                      }`}
                    >
                      <div className="flex items-center justify-between text-sm font-bold">
                        <span>{UI_COPY.difficulties[d].title[lang]}</span>
                        {selected && <Sparkles className="h-3.5 w-3.5 text-cyan-300" />}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {UI_COPY.difficulties[d].desc[lang]}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/65 p-4">
              <div className="mb-2.5 flex items-center gap-2 text-xs font-bold tracking-wider text-amber-300 uppercase">
                <Users className="h-4 w-4" />
                <span>{UI_COPY.coopOverview[lang]}</span>
              </div>
              <div className="space-y-1.5">
                {INITIAL_CREW.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-1.5 text-xs"
                  >
                    <span className="font-semibold text-white">{c.name[lang]}</span>
                    <span className="text-slate-400">{c.role[lang]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
