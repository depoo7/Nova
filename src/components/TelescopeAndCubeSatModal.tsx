import { Box, CheckCircle2, Eye, Rocket, Sparkles, Telescope, X } from 'lucide-react';
import {
  CUBESAT_PHASES,
  TELESCOPE_OBJECTIVES,
  TELESCOPE_OPTICS,
  TELESCOPE_WAVELENGTHS,
} from '../data/novaData';
import { useGameStore } from '../store/gameStore';

export function TelescopeAndCubeSatModal() {
  const lang = useGameStore((s) => s.lang);
  const open = useGameStore((s) => s.telescopeLabOpen);
  const setOpen = useGameStore((s) => s.setTelescopeLabOpen);
  const telescope = useGameStore((s) => s.telescope);
  const updateTelescopeDesign = useGameStore((s) => s.updateTelescopeDesign);
  const calibrateAndLaunchTelescope = useGameStore((s) => s.calibrateAndLaunchTelescope);
  const advanceCubeSatPhase = useGameStore((s) => s.advanceCubeSatPhase);

  if (!open) return null;

  const activeObj =
    TELESCOPE_OBJECTIVES.find((o) => o.id === telescope.objectiveId) || TELESCOPE_OBJECTIVES[0];
  const wavelengthOk = telescope.wavelengthId === activeObj.idealWavelength;
  const opticOk = telescope.opticId === activeObj.idealOptic;
  const fullAligned = wavelengthOk && opticOk;

  return (
    <div className="pointer-events-auto absolute inset-0 z-40 flex items-center justify-center bg-black/75 p-3 sm:p-6">
      <div className="nova-panel flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl p-4 sm:p-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <Telescope className="h-5 w-5 text-cyan-400" />
            <div>
              <h2 className="font-display text-lg font-bold text-white">
                {lang === 'ar'
                  ? 'مختبر التلسكوب الفضائي وبرنامج CubeSat 101'
                  : 'NASA Space Telescope & CubeSat 101 Lab'}
              </h2>
              <p className="text-xs text-slate-300">
                {lang === 'ar'
                  ? 'اختر الهدف العلمي، الطول الموجي، ونظام المرايا لإطلاق مرصد مطابق لمهمات ناسا'
                  : 'Align Science Objective, Wavelength & Optical System to launch a NASA-grade observatory'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="rounded-xl border border-white/15 bg-white/5 p-2 text-slate-300 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 grid flex-1 grid-cols-1 gap-4 overflow-y-auto pe-1 lg:grid-cols-3">
          {/* Left 2 Columns: Space Telescope Learning Game */}
          <div className="space-y-4 lg:col-span-2">
            {/* Step 1: Scientific Objective */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold text-amber-300">
                <Eye className="h-4 w-4" />
                <span>
                  {lang === 'ar' ? '1. اختر الهدف العلمي للرصد' : '1. Select Scientific Objective'}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {TELESCOPE_OBJECTIVES.map((obj) => {
                  const active = telescope.objectiveId === obj.id;
                  return (
                    <button
                      key={obj.id}
                      onClick={() => updateTelescopeDesign({ objectiveId: obj.id })}
                      className={`rounded-xl border p-3 text-start transition ${
                        active
                          ? 'border-cyan-400 bg-cyan-500/15 text-white'
                          : 'border-white/10 bg-slate-950/60 text-slate-300 hover:border-white/25'
                      }`}
                    >
                      <div className="text-xs font-bold">{obj.name[lang]}</div>
                      <div className="mt-1 text-[10px] text-cyan-300">{obj.nasaAnalog}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2 & 3: Wavelength + Optics */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-2 text-xs font-bold text-cyan-300">
                  {lang === 'ar' ? '2. نطاق الطول الموجي' : '2. Wavelength Band'}
                </div>
                <div className="space-y-1.5">
                  {TELESCOPE_WAVELENGTHS.map((w) => (
                    <button
                      key={w.id}
                      onClick={() => updateTelescopeDesign({ wavelengthId: w.id })}
                      className={`w-full rounded-xl border px-3 py-2 text-start text-xs font-semibold transition ${
                        telescope.wavelengthId === w.id
                          ? 'border-amber-400 bg-amber-500/15 text-amber-100'
                          : 'border-white/10 bg-slate-950/60 text-slate-300 hover:border-white/25'
                      }`}
                    >
                      {w.label[lang]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-2 text-xs font-bold text-emerald-300">
                  {lang === 'ar' ? '3. نظام البصريات والمرايا' : '3. Optical Architecture'}
                </div>
                <div className="space-y-1.5">
                  {TELESCOPE_OPTICS.map((op) => (
                    <button
                      key={op.id}
                      onClick={() => updateTelescopeDesign({ opticId: op.id })}
                      className={`w-full rounded-xl border px-3 py-2 text-start text-xs font-semibold transition ${
                        telescope.opticId === op.id
                          ? 'border-emerald-400 bg-emerald-500/15 text-emerald-100'
                          : 'border-white/10 bg-slate-950/60 text-slate-300 hover:border-white/25'
                      }`}
                    >
                      {op.label[lang]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Compatibility Diagnostics & Launch */}
            <div
              className={`rounded-2xl border p-4 ${
                fullAligned
                  ? 'border-emerald-400/50 bg-emerald-500/10'
                  : 'border-amber-400/40 bg-amber-500/10'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="max-w-lg space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <Sparkles
                      className={`h-4 w-4 ${fullAligned ? 'text-emerald-400' : 'text-amber-400'}`}
                    />
                    <span>
                      {fullAligned
                        ? lang === 'ar'
                          ? `مطابقة علمية كاملة: ${activeObj.nasaAnalog}`
                          : `Optimal Match: ${activeObj.nasaAnalog}`
                        : lang === 'ar'
                          ? 'المواصفات البصرية بحاجة للمواءمة مع الهدف العلمي'
                          : 'Trade Study Notice: Align wavelength & optics to objective'}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-200">{activeObj.fact[lang]}</p>
                </div>

                <button
                  onClick={calibrateAndLaunchTelescope}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-2.5 text-xs font-bold text-slate-950 whitespace-nowrap hover:brightness-110"
                >
                  <Rocket className="h-4 w-4" />
                  <span>
                    {lang === 'ar' ? 'معايرة ونشر التلسكوب (+120 CR)' : 'Calibrate & Deploy (+120 CR)'}
                  </span>
                </button>
              </div>
              {telescope.deployedCount > 0 && (
                <div className="font-mono-tech mt-2 text-[11px] text-emerald-300">
                  {lang === 'ar'
                    ? `التلسكوبات المنشورة: ${telescope.deployedCount} • آخر تطابق: ${telescope.lastMatchedNasaMission}`
                    : `Deployed Observatories: ${telescope.deployedCount} • Last Match: ${telescope.lastMatchedNasaMission}`}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: CubeSat 101 Lifecycle */}
          <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-slate-950/65 p-4">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Box className="h-4 w-4 text-sky-400" />
                <h3 className="text-sm font-bold text-white">
                  {lang === 'ar' ? 'برنامج CubeSat 101 (4 مراحل)' : 'CubeSat 101 Lifecycle'}
                </h3>
              </div>

              <div className="space-y-2.5">
                {CUBESAT_PHASES.map((p) => {
                  const done = telescope.cubeSatPhase > p.phase;
                  const current = telescope.cubeSatPhase === p.phase;
                  return (
                    <div
                      key={p.phase}
                      className={`rounded-xl border p-3 text-xs ${
                        current
                          ? 'border-cyan-400/60 bg-cyan-500/15 text-white'
                          : done
                            ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
                            : 'border-white/10 bg-white/5 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 font-bold">
                        <span>{p.title[lang]}</span>
                        {done && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 space-y-2 border-t border-white/10 pt-3">
              <div className="font-mono-tech text-[11px] text-slate-300">
                {lang === 'ar'
                  ? `المرحلة النشطة: ${telescope.cubeSatPhase} / 4 (3U 10×10×30 cm)`
                  : `Active Phase: ${telescope.cubeSatPhase} / 4 (3U 10x10x30 cm)`}
              </div>
              {telescope.cubeSatPhase < 4 ? (
                <button
                  onClick={advanceCubeSatPhase}
                  className="w-full rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-slate-950 hover:brightness-110"
                >
                  {lang === 'ar' ? 'اعتماد المرحلة التالية (+75 CR)' : 'Advance CubeSat Phase (+75 CR)'}
                </button>
              ) : (
                <div className="rounded-xl border border-emerald-400/40 bg-emerald-500/15 py-2 text-center text-xs font-bold text-emerald-300">
                  {lang === 'ar' ? '✓ منارة CubeSat تبث من المدار بنجاح' : '✓ CubeSat Beacon Active in Orbit'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
