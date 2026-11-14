import { Compass, Navigation, PlaneLanding, Rocket, X } from 'lucide-react';
import { PLANETS, SOLAR_ORBIT_RADII, SOLAR_SYSTEM_CENTER } from '../data/novaData';
import { useGameStore } from '../store/gameStore';

export function TacticalMapModal() {
  const lang = useGameStore((s) => s.lang);
  const mapOpen = useGameStore((s) => s.mapOpen);
  const setMapOpen = useGameStore((s) => s.setMapOpen);
  const sceneEnv = useGameStore((s) => s.sceneEnv);
  const activePlanetId = useGameStore((s) => s.activePlanet);
  const discoveredPlanets = useGameStore((s) => s.discoveredPlanets);
  const discoveredCraterIds = useGameStore((s) => s.discoveredCraterIds);
  const completedScienceSiteIds = useGameStore((s) => s.completedScienceSiteIds);
  const spaceTelemetry = useGameStore((s) => s.spaceTelemetry);
  const surfaceTelemetry = useGameStore((s) => s.surfaceTelemetry);
  const flyToPlanet = useGameStore((s) => s.flyToPlanet);
  const landOnPlanet = useGameStore((s) => s.landOnPlanet);

  if (!mapOpen) return null;

  const activePlanet = PLANETS.find((p) => p.id === activePlanetId) || PLANETS[0];
  const [sunX, , sunZ] = SOLAR_SYSTEM_CENTER;
  const earth = PLANETS.find((p) => p.id === 'aurora');
  const moon = PLANETS.find((p) => p.id === 'luna');
  const earthMoonRadius =
    earth && moon
      ? Math.hypot(moon.position[0] - earth.position[0], moon.position[2] - earth.position[2])
      : 96;

  return (
    <div className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center bg-black/70 p-4">
      <div className="nova-panel w-full max-w-3xl rounded-3xl p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <Compass className="h-5 w-5 text-amber-400" />
            <div>
              <h3 className="font-display text-lg font-bold text-white">
                {sceneEnv === 'planet'
                  ? `${activePlanet.name[lang]} — ${lang === 'ar' ? 'خريطة السطح' : 'Surface Map'}`
                  : lang === 'ar'
                    ? 'خريطة المجموعة الشمسية والمدارات الحقيقية'
                    : 'Solar System Heliocentric Orbit Map'}
              </h3>
              <p className="text-xs text-slate-400">
                {sceneEnv === 'planet'
                  ? lang === 'ar'
                    ? 'مواقع الفوهات ومحطات الرصد وموقع الروفر والسفينة'
                    : 'Craters, Science Beacons, Rover, and Landed Spacecraft'
                  : lang === 'ar'
                    ? 'الكواكب مرتبة حول الشمس حسب بعدها المداري الحقيقي (AU) — اضغط لأي كوكب للطيران الآلي'
                    : 'Planets ordered outward from the Sun by real orbital order (AU) — click to lock autopilot'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setMapOpen(false)}
            className="rounded-xl border border-white/15 bg-white/5 p-2 text-slate-300 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {sceneEnv === 'planet' ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
            <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-[#050811] p-3 md:col-span-7">
              <svg viewBox="-120 -120 240 240" className="h-72 w-72">
                <circle cx="0" cy="0" r="105" fill="none" stroke="rgba(56,189,248,0.18)" strokeDasharray="4 4" />
                <circle cx="0" cy="0" r="55" fill="none" stroke="rgba(56,189,248,0.12)" />

                {/* Landed Ship at Origin */}
                <rect x="-5" y="-5" width="10" height="10" rx="2" fill="#38bdf8" />
                <text x="8" y="3" fill="#bae6fd" fontSize="8">NOVA</text>

                {/* Craters */}
                {activePlanet.craters.map((c) => {
                  const done = discoveredCraterIds.includes(c.id);
                  return (
                    <g key={c.id}>
                      <circle
                        cx={c.x}
                        cy={c.z}
                        r={c.radius * 0.55}
                        fill="none"
                        stroke={done ? '#34d399' : '#f59e0b'}
                        strokeWidth="1.8"
                      />
                      <text x={c.x} y={c.z - 8} fill="#fde68a" fontSize="7" textAnchor="middle">
                        {c.name[lang]}
                      </text>
                    </g>
                  );
                })}

                {/* Science Sites */}
                {activePlanet.scienceSites.map((s) => {
                  const done = completedScienceSiteIds.includes(s.id);
                  return (
                    <g key={s.id}>
                      <polygon
                        points={`${s.x},${s.z - 5} ${s.x + 5},${s.z + 4} ${s.x - 5},${s.z + 4}`}
                        fill={done ? '#34d399' : '#22d3ee'}
                      />
                      <text x={s.x} y={s.z + 12} fill="#a5f3fc" fontSize="7" textAnchor="middle">
                        {s.name[lang]}
                      </text>
                    </g>
                  );
                })}

                {/* Monolith */}
                {activePlanet.hasMonolith && (
                  <g>
                    <circle cx="0" cy="-62" r="6" fill="#a855f7" stroke="#f0abfc" strokeWidth="1.5" />
                    <text x="0" y="-71" fill="#e9d5ff" fontSize="8" textAnchor="middle">
                      2089 SIGNAL
                    </text>
                  </g>
                )}

                {/* Rover & Player */}
                <circle cx={surfaceTelemetry.roverX} cy={surfaceTelemetry.roverZ} r="4.5" fill="#f59e0b" />
                <circle cx={surfaceTelemetry.playerX} cy={surfaceTelemetry.playerZ} r="3.5" fill="#ffffff" />
              </svg>
            </div>

            <div className="space-y-2.5 md:col-span-5">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs">
                <div className="font-bold text-white">{lang === 'ar' ? 'دليل الرموز' : 'Map Legend'}</div>
                <ul className="mt-2 space-y-1.5 text-slate-300">
                  <li>● {lang === 'ar' ? 'نقطة بيضاء: موقعك الحالي' : 'White Dot: Your Position'}</li>
                  <li className="text-amber-300">● {lang === 'ar' ? 'نقطة ذهبية: المركبة الجوالة 6×6' : 'Gold Dot: 6x6 Rover'}</li>
                  <li className="text-cyan-300">▲ {lang === 'ar' ? 'مثلث سماوي: محطة رصد علمية' : 'Triangle: Science Station'}</li>
                  <li className="text-amber-200">◯ {lang === 'ar' ? 'دائرة: فوهة كوكبية للفحص' : 'Circle: Planetary Crater'}</li>
                </ul>
              </div>
              <button
                onClick={() => {
                  setMapOpen(false);
                  flyToPlanet(activePlanet.id, false);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 py-2.5 text-xs font-bold text-slate-950"
              >
                <Rocket className="h-4 w-4" />
                <span>{lang === 'ar' ? 'العودة للفضاء المفتوح' : 'Return to Deep Space'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
            {/* 2D Overhead Heliocentric Solar System Plot */}
            <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-[#050811] p-3 md:col-span-7">
              <svg viewBox="-900 -1350 1800 1800" className="h-72 w-full">
                {/* Concentric Planetary Orbits around the Sun */}
                {SOLAR_ORBIT_RADII.map((orbit) => {
                  if (orbit.planetId === 'luna') return null;
                  return (
                    <circle
                      key={orbit.planetId}
                      cx={sunX}
                      cy={sunZ}
                      r={orbit.orbitRadius}
                      fill="none"
                      stroke={orbit.color}
                      strokeOpacity={0.28}
                      strokeWidth="4"
                      strokeDasharray="16 12"
                    />
                  );
                })}

                {/* Asteroid Belt band between Mars (355) & Jupiter (480) */}
                <circle
                  cx={sunX}
                  cy={sunZ}
                  r={418}
                  fill="none"
                  stroke="rgba(148,163,184,0.16)"
                  strokeWidth="36"
                  strokeDasharray="4 16"
                />

                {/* Earth-Moon Sub-Orbit */}
                {earth && (
                  <circle
                    cx={earth.position[0]}
                    cy={earth.position[2]}
                    r={earthMoonRadius}
                    fill="none"
                    stroke="rgba(203,213,225,0.28)"
                    strokeWidth="2.5"
                    strokeDasharray="6 6"
                  />
                )}

                {/* Central Sun */}
                <circle cx={sunX} cy={sunZ} r="62" fill="rgba(251,191,36,0.16)" />
                <circle cx={sunX} cy={sunZ} r="36" fill="#fde047" stroke="#f97316" strokeWidth="6" />
                <text x={sunX} y={sunZ + 72} fill="#fde68a" fontSize="34" fontWeight="bold" textAnchor="middle">
                  {lang === 'ar' ? 'الشمس' : 'SUN'}
                </text>

                {PLANETS.map((p) => {
                  const [px, , pz] = p.position;
                  const isTarget = spaceTelemetry.targetPlanetId === p.id;
                  const discovered = discoveredPlanets.includes(p.id);
                  return (
                    <g
                      key={p.id}
                      onClick={() => flyToPlanet(p.id, true)}
                      className="cursor-pointer"
                    >
                      {isTarget && (
                        <circle cx={px} cy={pz} r="54" fill="none" stroke="#f59e0b" strokeWidth="6" />
                      )}
                      {p.hasRings && (
                        <ellipse
                          cx={px}
                          cy={pz}
                          rx="54"
                          ry="18"
                          fill="none"
                          stroke={p.ringColor || '#fde68a'}
                          strokeWidth="6"
                          transform={`rotate(${p.id === 'uranus' ? '78' : '-18'} ${px} ${pz})`}
                        />
                      )}
                      <circle
                        cx={px}
                        cy={pz}
                        r={p.id === 'aetheris' ? 36 : p.id === 'luna' || p.id === 'mercury' ? 20 : 28}
                        fill={p.primaryColor}
                        stroke={discovered ? '#ffffff' : '#334155'}
                        strokeWidth="4"
                      />
                      <text x={px} y={pz + 64} fill="#e2e8f0" fontSize="34" textAnchor="middle">
                        {p.name[lang]}
                      </text>
                    </g>
                  );
                })}

                {/* Player Ship Marker */}
                <circle
                  cx={spaceTelemetry.shipX}
                  cy={spaceTelemetry.shipZ}
                  r="22"
                  fill="#ffffff"
                  stroke="#38bdf8"
                  strokeWidth="6"
                />
              </svg>
            </div>

            {/* Destination List */}
            <div className="max-h-72 space-y-2 overflow-y-auto pe-1 md:col-span-5">
              {PLANETS.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 p-2.5 text-xs"
                >
                  <div>
                    <div className="font-bold text-white">{p.name[lang]}</div>
                    <div className="text-[11px] text-slate-400">{p.subtitle[lang]}</div>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => flyToPlanet(p.id, true)}
                      title="Autopilot"
                      className="rounded-lg bg-cyan-500 p-2 text-slate-950 hover:brightness-110"
                    >
                      <Navigation className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => landOnPlanet(p.id)}
                      title="Land"
                      className="rounded-lg border border-amber-400/40 bg-amber-500/15 p-2 text-amber-200 hover:bg-amber-500/25"
                    >
                      <PlaneLanding className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
