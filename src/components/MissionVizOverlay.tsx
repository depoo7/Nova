import { DoorOpen, Orbit, Pause, Play, Rocket } from 'lucide-react';
import { useEffect } from 'react';
import { PLANETS } from '../data/novaData';
import { useGameStore } from '../store/gameStore';

const MILESTONES = [
  { t: 0.05, ar: 'الإطلاق المداري (Launch)', en: 'Launch Segment' },
  { t: 0.25, ar: 'مناورة الخروج GMAT (TPI Burn)', en: 'GMAT TPI Burn' },
  { t: 0.55, ar: 'العبور الكوكبي (Cruise)', en: 'Interplanetary Cruise' },
  { t: 0.82, ar: 'دخول المدار (Orbit Insertion)', en: 'Orbit Insertion' },
  { t: 0.98, ar: 'عمليات الروفر والبث (Ops)', en: 'Rover & DSN Ops' },
];

export function MissionVizOverlay() {
  const lang = useGameStore((s) => s.lang);
  const sceneEnv = useGameStore((s) => s.sceneEnv);
  const timeline = useGameStore((s) => s.missionVizTimeline);
  const autoPlay = useGameStore((s) => s.missionVizAutoPlay);
  const targetPlanetId = useGameStore((s) => s.missionVizTargetPlanet);
  const shipMetrics = useGameStore((s) => s.shipMetrics);
  const activeBlueprint = useGameStore((s) => s.activeBlueprint);

  const setTimeline = useGameStore((s) => s.setMissionVizTimeline);
  const setAutoPlay = useGameStore((s) => s.setMissionVizAutoPlay);
  const setTargetPlanet = useGameStore((s) => s.setMissionVizTargetPlanet);
  const flyToPlanet = useGameStore((s) => s.flyToPlanet);
  const returnToBridge = useGameStore((s) => s.returnToBridge);

  useEffect(() => {
    if (sceneEnv !== 'mission-viz' || !autoPlay) return;
    const id = window.setInterval(() => {
      const cur = useGameStore.getState().missionVizTimeline;
      const next = cur >= 1 ? 0 : cur + 0.008;
      useGameStore.getState().setMissionVizTimeline(next);
    }, 50);
    return () => window.clearInterval(id);
  }, [sceneEnv, autoPlay]);

  if (sceneEnv !== 'mission-viz') return null;

  const planet = PLANETS.find((p) => p.id === targetPlanetId) || PLANETS[1];
  const dx = planet.position[0] - 0;
  const dy = planet.position[1] - 8;
  const dz = planet.position[2] - -96;
  const distKm = Math.round(Math.hypot(dx, dy, dz) * 1850);
  const reqDeltaV = Math.round(2800 + Math.hypot(dx, dz) * 3.8);
  const flightDays = Math.round(4 + Math.hypot(dx, dz) * 0.24);
  const inclinationDeg = (
    Math.abs(Math.atan2(dy, Math.hypot(dx, dz)) * 57.3) +
    1.8
  ).toFixed(1);

  const activeMilestone =
    [...MILESTONES].reverse().find((m) => timeline >= m.t) || MILESTONES[0];

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-4">
      {/* Top Info Card */}
      <div className="flex flex-wrap items-start justify-between gap-3 pt-16 sm:pt-14">
        <div className="pointer-events-auto nova-panel max-w-md rounded-2xl p-4 text-xs">
          <div className="flex items-center gap-2 text-cyan-300">
            <Orbit className="h-4 w-4" />
            <span className="font-display text-sm font-bold text-white">
              {lang === 'ar' ? 'تصور المهمة 3D (GMAT & Mission Viz)' : 'NASA Mission Viz & GMAT Orbit Lab'}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-300">
            {lang === 'ar'
              ? 'اسحب شاشة 3D لتدوير مدار القطاع، واختر الكوكب لمعاينة مسار النقل المداري وحركة المسبار عبر الزمن.'
              : 'Drag 3D space to inspect interplanetary transfer splines and scrub mission time.'}
          </p>

          {/* Planet Trajectory Selector */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {PLANETS.map((p) => (
              <button
                key={p.id}
                onClick={() => setTargetPlanet(p.id)}
                className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold transition ${
                  p.id === targetPlanetId
                    ? 'border-amber-400 bg-amber-500 text-slate-950'
                    : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/30'
                }`}
              >
                {p.name[lang]}
              </button>
            ))}
          </div>
        </div>

        {/* GMAT Telemetry Panel */}
        <div className="pointer-events-auto nova-panel rounded-2xl p-3.5 text-xs">
          <div className="mb-2 font-bold text-amber-300">
            GMAT • {planet.name[lang]}
          </div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-1.5 font-mono-tech text-[11px]">
            <span className="text-slate-400">{lang === 'ar' ? 'الأوج (Apoapsis)' : 'Apoapsis'}:</span>
            <span className="text-white">{distKm.toLocaleString()} km</span>
            <span className="text-slate-400">{lang === 'ar' ? 'الميل المداري' : 'Inclination'}:</span>
            <span className="text-cyan-300">{inclinationDeg}°</span>
            <span className="text-slate-400">Delta-V Req:</span>
            <span className={shipMetrics.deltaV >= reqDeltaV ? 'text-emerald-300' : 'text-amber-300'}>
              {reqDeltaV} / {shipMetrics.deltaV} m/s
            </span>
            <span className="text-slate-400">{lang === 'ar' ? 'زمن الرحلة' : 'Transfer Time'}:</span>
            <span className="text-white">{flightDays} days</span>
            {activeBlueprint && (
              <>
                <span className="text-emerald-300">{lang === 'ar' ? 'التصميم النشط' : 'Blueprint'}:</span>
                <span className="font-bold text-emerald-300">
                  {activeBlueprint.totalMassKg}kg · {activeBlueprint.netPowerW >= 0 ? `+${activeBlueprint.netPowerW}` : activeBlueprint.netPowerW}W
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Timeline Scrubber & Launch Actions */}
      <div className="pointer-events-auto nova-panel mx-auto mb-2 w-full max-w-3xl rounded-2xl p-4 text-xs">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoPlay(!autoPlay)}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500 text-slate-950 hover:brightness-110"
            >
              {autoPlay ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <div>
              <div className="font-bold text-white">{activeMilestone[lang]}</div>
              <div className="font-mono-tech text-[10px] text-cyan-300">
                MET {Math.round(timeline * flightDays * 24)}h ({Math.round(timeline * 100)}%)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => flyToPlanet(targetPlanetId, true)}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-3.5 py-2 font-bold text-slate-950 hover:brightness-110"
            >
              <Rocket className="h-3.5 w-3.5" />
              <span>{lang === 'ar' ? 'حلّق بهذا المسار الآن' : 'Fly Trajectory Now'}</span>
            </button>
            <button
              onClick={returnToBridge}
              className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-2 font-bold text-white hover:bg-white/20"
            >
              <DoorOpen className="h-3.5 w-3.5" />
              <span>{lang === 'ar' ? 'عودة للجسر' : 'Bridge'}</span>
            </button>
          </div>
        </div>

        <input
          type="range"
          min={0}
          max={1}
          step={0.005}
          value={timeline}
          onChange={(e) => {
            setAutoPlay(false);
            setTimeline(Number(e.target.value));
          }}
          className="w-full accent-cyan-400"
        />

        <div className="mt-1.5 flex justify-between text-[10px] text-slate-400">
          {MILESTONES.map((m) => (
            <button
              key={m.t}
              onClick={() => {
                setAutoPlay(false);
                setTimeline(m.t);
              }}
              className={`hover:text-cyan-300 ${timeline >= m.t ? 'font-bold text-cyan-300' : ''}`}
            >
              {m[lang]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
