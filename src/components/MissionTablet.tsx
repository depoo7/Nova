import {
  CheckCircle2,
  Compass,
  Cpu,
  Navigation,
  PlaneLanding,
  Radio,
  Rocket,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import { UI_COPY } from '../data/i18n';
import {
  CML_LEVELS,
  PLANETS,
  SHIP_LIVERIES,
  SHIP_PARTS,
  STORY_CHAPTERS,
} from '../data/novaData';
import { useGameStore } from '../store/gameStore';

export function MissionTablet() {
  const lang = useGameStore((s) => s.lang);
  const tabletOpen = useGameStore((s) => s.tabletOpen);
  const tabletTab = useGameStore((s) => s.tabletTab);
  const setTabletOpen = useGameStore((s) => s.setTabletOpen);

  const chapter = useGameStore((s) => s.chapter);
  const cmlLevel = useGameStore((s) => s.cmlLevel);
  const telescope = useGameStore((s) => s.telescope);
  const setCmlLevel = useGameStore((s) => s.setCmlLevel);
  const character = useGameStore((s) => s.character);
  const shipConfig = useGameStore((s) => s.shipConfig);
  const shipMetrics = useGameStore((s) => s.shipMetrics);
  const resources = useGameStore((s) => s.resources);
  const crew = useGameStore((s) => s.crew);
  const missionPlan = useGameStore((s) => s.missionPlan);
  const discoveredPlanets = useGameStore((s) => s.discoveredPlanets);
  const collectedSampleIds = useGameStore((s) => s.collectedSampleIds);
  const completedScienceSiteIds = useGameStore((s) => s.completedScienceSiteIds);
  const ringsPassed = useGameStore((s) => s.ringsPassed);
  const asteroidsMined = useGameStore((s) => s.asteroidsMined);

  const selectShipPart = useGameStore((s) => s.selectShipPart);
  const selectLivery = useGameStore((s) => s.selectLivery);
  const flyToPlanet = useGameStore((s) => s.flyToPlanet);
  const landOnPlanet = useGameStore((s) => s.landOnPlanet);
  const transmitDataPacket = useGameStore((s) => s.transmitDataPacket);
  const cycleCommsStation = useGameStore((s) => s.cycleCommsStation);
  const setMissionPlan = useGameStore((s) => s.setMissionPlan);
  const assignCrew = useGameStore((s) => s.assignCrew);
  const finishExpedition = useGameStore((s) => s.finishExpedition);

  if (!tabletOpen) return null;

  const tabs: Array<{
    id: typeof tabletTab;
    label: string;
    icon: typeof Compass;
  }> = [
    { id: 'overview', label: UI_COPY.tabOverview[lang], icon: Compass },
    { id: 'planets', label: UI_COPY.tabPlanets[lang], icon: Navigation },
    { id: 'builder', label: UI_COPY.tabBuilder[lang], icon: Wrench },
    { id: 'comms', label: UI_COPY.tabComms[lang], icon: Radio },
    { id: 'crew', label: UI_COPY.tabCrew[lang], icon: Users },
  ];

  return (
    <div className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center bg-black/65 p-3 sm:p-6">
      <div className="nova-panel flex h-[600px] max-h-[90vh] w-full max-w-4xl flex-col rounded-3xl p-4 sm:p-6">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div>
            <h2 className="font-display text-lg font-bold text-white sm:text-xl">
              {lang === 'ar'
                ? `اللوحة التكتيكية • القائد ${character.name || 'نوفا'}`
                : `NOVA TACTICAL TABLET • ${character.name || 'COMMANDER'}`}
            </h2>
            <p className="font-mono-tech text-xs text-cyan-300">
              SOL {resources.solTime.toFixed(1)} • {discoveredPlanets.length}/6 WORLDS •{' '}
              {resources.credits} CR
            </p>
          </div>
          <button
            onClick={() => setTabletOpen(false)}
            className="rounded-xl border border-white/15 bg-white/5 p-2 text-slate-300 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="my-3 flex flex-wrap gap-1.5 border-b border-white/10 pb-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = tabletTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setTabletOpen(true, tab.id)}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold whitespace-nowrap transition ${
                  active
                    ? 'bg-cyan-500 text-slate-950'
                    : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto pe-1">
          {tabletTab === 'overview' && (
            <div className="space-y-4">
              {/* Summary Metrics */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="text-[11px] text-slate-400">
                    {lang === 'ar' ? 'العوالم المكتشفة' : 'Worlds Discovered'}
                  </div>
                  <div className="font-mono-tech mt-1 text-xl font-bold text-cyan-300">
                    {discoveredPlanets.length} / 6
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="text-[11px] text-slate-400">
                    {lang === 'ar' ? 'العينات والمحطات' : 'Samples & Sites'}
                  </div>
                  <div className="font-mono-tech mt-1 text-xl font-bold text-amber-300">
                    {collectedSampleIds.length} / {completedScienceSiteIds.length}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="text-[11px] text-slate-400">
                    {lang === 'ar' ? 'حلقات + كويكبات' : 'Rings & Asteroids'}
                  </div>
                  <div className="font-mono-tech mt-1 text-xl font-bold text-emerald-300">
                    {ringsPassed} / {asteroidsMined}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="text-[11px] text-slate-400">
                    {lang === 'ar' ? 'البيانات المرسلة' : 'DSN Transmitted'}
                  </div>
                  <div className="font-mono-tech mt-1 text-xl font-bold text-violet-300">
                    {Math.round(resources.dataTransmitted)} MB
                  </div>
                </div>
              </div>

              {/* NASA Concept Maturity Levels (CML 1-4) & 4 Segments */}
              <div className="rounded-2xl border border-cyan-400/30 bg-slate-950/60 p-4">
                <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-bold text-cyan-300">
                    {lang === 'ar'
                      ? `مستويات نضج المفهوم NASA CML (1–4) • الحالي: CML ${cmlLevel}`
                      : `NASA Concept Maturity Levels (CML 1–4) • Current: CML ${cmlLevel}`}
                  </div>
                  <div className="flex gap-1">
                    {([1, 2, 3, 4] as const).map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setCmlLevel(lvl)}
                        className={`rounded-lg px-2 py-1 text-[10px] font-bold ${
                          cmlLevel === lvl
                            ? 'bg-cyan-500 text-slate-950'
                            : cmlLevel > lvl
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-white/5 text-slate-400'
                        }`}
                      >
                        CML {lvl}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {CML_LEVELS.map((c) => (
                    <div
                      key={c.level}
                      className={`rounded-xl border p-2.5 text-[11px] ${
                        cmlLevel === c.level
                          ? 'border-cyan-400/50 bg-cyan-500/10 text-white'
                          : 'border-white/10 bg-white/5 text-slate-300'
                      }`}
                    >
                      <div className="font-bold">{c.mdlPhase[lang]}</div>
                      <div className="mt-0.5 text-[10px] opacity-85">{c.desc[lang]}</div>
                    </div>
                  ))}
                </div>

                {/* 4 Mission Segments Status */}
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    {
                      title: lang === 'ar' ? '1. قطاع الإطلاق' : '1. Launch Segment',
                      status:
                        shipMetrics.deltaV >= 3400
                          ? lang === 'ar'
                            ? 'جاهز ✓'
                            : 'Ready ✓'
                          : 'Pending',
                    },
                    {
                      title: lang === 'ar' ? '2. قطاع الفضاء' : '2. Space Segment',
                      status: `${discoveredPlanets.length}/6 • ${telescope.deployedCount} Scope`,
                    },
                    {
                      title: lang === 'ar' ? '3. القطاع الأرضي' : '3. Ground DSN',
                      status: `${resources.commsStation} (${resources.commsSignal}%)`,
                    },
                    {
                      title: lang === 'ar' ? '4. قطاع العلماء' : '4. User Segment',
                      status: `${Math.round(resources.dataTransmitted)} MB`,
                    },
                  ].map((seg) => (
                    <div
                      key={seg.title}
                      className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-2 text-[11px]"
                    >
                      <div className="text-slate-400">{seg.title}</div>
                      <div className="font-mono-tech font-bold text-amber-300">{seg.status}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Story Chapters */}
              <div className="space-y-2">
                {STORY_CHAPTERS.map((ch) => {
                  const done = chapter > ch.chapter;
                  const current = chapter === ch.chapter;
                  return (
                    <div
                      key={ch.chapter}
                      className={`rounded-2xl border p-3.5 ${
                        current
                          ? 'border-cyan-400/50 bg-cyan-500/10'
                          : done
                            ? 'border-emerald-400/35 bg-emerald-500/10'
                            : 'border-white/10 bg-white/5 opacity-70'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white">{ch.title[lang]}</span>
                        {done && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                      </div>
                      <p className="mt-1 text-xs text-slate-300">{ch.summary[lang]}</p>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => finishExpedition(true)}
                  className="rounded-xl border border-amber-400/45 bg-amber-500/15 px-4 py-2 text-xs font-bold text-amber-200 hover:bg-amber-500/25"
                >
                  {lang === 'ar' ? 'إنهاء الرحلة وعرض التقييم' : 'Conclude Expedition & Score'}
                </button>
              </div>
            </div>
          )}

          {tabletTab === 'planets' && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {PLANETS.map((p) => {
                const discovered = discoveredPlanets.includes(p.id);
                return (
                  <div
                    key={p.id}
                    className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-3.5 w-3.5 rounded-full"
                            style={{ backgroundColor: p.primaryColor }}
                          />
                          <h3 className="font-bold text-white">{p.name[lang]}</h3>
                        </div>
                        <span className="font-mono-tech text-[11px] text-slate-400">
                          {p.gravity} m/s²
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-semibold text-cyan-300">{p.subtitle[lang]}</p>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                        {p.description[lang]}
                      </p>
                      <div className="mt-2 text-[11px] text-amber-300">
                        {discovered
                          ? lang === 'ar'
                            ? '✓ تم رصده في السجل'
                            : '✓ Charted in Log'
                          : lang === 'ar'
                            ? `مكافأة الاكتشاف: +${p.rewardCredits} رصيد`
                            : `Discovery Bonus: +${p.rewardCredits} CR`}
                      </div>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => flyToPlanet(p.id, true)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-cyan-500 px-3 py-2 text-xs font-bold text-slate-950 hover:brightness-110"
                      >
                        <Rocket className="h-3.5 w-3.5" />
                        <span>{lang === 'ar' ? 'انطلق بالكوكب (طيار آلي)' : 'Fly (Autopilot)'}</span>
                      </button>
                      <button
                        onClick={() => landOnPlanet(p.id)}
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-400/40 bg-amber-500/15 px-3 py-2 text-xs font-bold text-amber-200 hover:bg-amber-500/25"
                      >
                        <PlaneLanding className="h-3.5 w-3.5" />
                        <span>{lang === 'ar' ? 'هبوط' : 'Land'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tabletTab === 'builder' && (
            <div className="space-y-4">
              {/* Live Ship Metrics */}
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
                <div className="rounded-xl border border-white/10 bg-slate-950/70 p-2.5 text-xs">
                  <div className="text-slate-400">{UI_COPY.massLabel[lang]}</div>
                  <div className="font-mono-tech font-bold text-white">{shipMetrics.mass} kg</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-950/70 p-2.5 text-xs">
                  <div className="text-slate-400">{UI_COPY.deltaVLabel[lang]}</div>
                  <div className="font-mono-tech font-bold text-cyan-300">
                    {shipMetrics.deltaV} m/s
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-950/70 p-2.5 text-xs">
                  <div className="text-slate-400">{UI_COPY.batteryLabel[lang]}</div>
                  <div
                    className={`font-mono-tech font-bold ${
                      shipMetrics.netPower >= 0 ? 'text-emerald-300' : 'text-rose-400'
                    }`}
                  >
                    {shipMetrics.netPower >= 0 ? `+${shipMetrics.netPower}` : shipMetrics.netPower}W
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-950/70 p-2.5 text-xs">
                  <div className="text-slate-400">{UI_COPY.shieldLabel[lang]}</div>
                  <div className="font-mono-tech font-bold text-amber-300">
                    {shipMetrics.maxShield}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-950/70 p-2.5 text-xs">
                  <div className="text-slate-400">{UI_COPY.reliabilityLabel[lang]}</div>
                  <div className="font-mono-tech font-bold text-violet-300">
                    {shipMetrics.reliability}%
                  </div>
                </div>
              </div>

              {/* NASA MDL Spacecraft Discipline Matrix */}
              <div className="grid grid-cols-3 gap-2 rounded-2xl border border-amber-400/25 bg-amber-500/5 p-3 text-[11px] sm:grid-cols-6">
                <div>
                  <div className="text-slate-400">{lang === 'ar' ? 'الحراري' : 'Thermal'}</div>
                  <div className="font-mono-tech font-bold text-amber-300">
                    {shipMetrics.thermalMargin}%
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">{lang === 'ar' ? 'التوجيه' : 'Attitude'}</div>
                  <div className="font-mono-tech font-bold text-cyan-300">
                    {shipMetrics.attitudePrecision}%
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">{lang === 'ar' ? 'المخاطر' : 'MDL Risk'}</div>
                  <div
                    className={`font-mono-tech font-bold ${
                      shipMetrics.mdlRiskScore < 25 ? 'text-emerald-300' : 'text-rose-400'
                    }`}
                  >
                    {shipMetrics.mdlRiskScore}%
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">{lang === 'ar' ? 'الطاقة+' : 'Gen W'}</div>
                  <div className="font-mono-tech font-bold text-emerald-300">
                    {shipMetrics.powerGen}W
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">{lang === 'ar' ? 'التكلفة' : 'Cost'}</div>
                  <div className="font-mono-tech font-bold text-white">
                    {shipMetrics.totalCost}M
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">{lang === 'ar' ? 'النضج' : 'CML'}</div>
                  <div className="font-mono-tech font-bold text-sky-300">CML {cmlLevel}</div>
                </div>
              </div>

              {/* Hull Liveries */}
              <div>
                <h4 className="mb-2 text-xs font-bold text-slate-300">
                  {lang === 'ar' ? 'طلاء وألوان السفينة ثلاثية الأبعاد' : '3D Spacecraft Hull Livery'}
                </h4>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {SHIP_LIVERIES.map((liv) => {
                    const active = shipConfig.liveryId === liv.id;
                    return (
                      <button
                        key={liv.id}
                        onClick={() => selectLivery(liv.id)}
                        className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition ${
                          active
                            ? 'border-cyan-400 bg-cyan-500/20 text-white'
                            : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/25'
                        }`}
                      >
                        <span
                          className="h-3.5 w-3.5 shrink-0 rounded-full border border-white/30"
                          style={{ backgroundColor: liv.accentHex }}
                        />
                        <span className="truncate">{liv.name[lang]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Engineering Components */}
              {(['engine', 'solar', 'hull', 'sensor', 'comms'] as const).map((cat) => {
                const catParts = SHIP_PARTS.filter((p) => p.category === cat);
                const selectedId =
                  cat === 'engine'
                    ? shipConfig.engineId
                    : cat === 'solar'
                      ? shipConfig.solarId
                      : cat === 'hull'
                        ? shipConfig.hullId
                        : cat === 'sensor'
                          ? shipConfig.sensorId
                          : shipConfig.commsId;

                return (
                  <div key={cat}>
                    <div className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-cyan-300 uppercase">
                      <Cpu className="h-3.5 w-3.5" />
                      <span>{cat}</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      {catParts.map((part) => {
                        const active = selectedId === part.id;
                        const owned = useGameStore.getState().purchasedPartIds.includes(part.id);
                        return (
                          <button
                            key={part.id}
                            onClick={() => selectShipPart(part.id)}
                            className={`rounded-xl border p-3 text-start transition ${
                              active
                                ? 'border-cyan-400 bg-cyan-500/15 text-white'
                                : owned
                                  ? 'border-white/10 bg-white/5 text-slate-300 hover:border-white/25'
                                  : 'border-amber-400/35 bg-amber-500/[0.06] text-amber-100 hover:border-amber-300'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold">{part.name[lang]}</span>
                              {!owned && (
                                <span className="font-mono text-[10px] font-bold text-amber-300">
                                  {part.cost} CR
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-[11px] text-slate-400">{part.desc[lang]}</p>
                            <div className="font-mono-tech mt-2 flex items-center justify-between text-[10px] text-cyan-300">
                              <span>{part.mass}kg</span>
                              <span>
                                {part.powerDelta >= 0 ? `+${part.powerDelta}W` : `${part.powerDelta}W`}
                              </span>
                              <span>T{part.tier}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tabletTab === 'comms' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs text-slate-300">
                      {lang === 'ar' ? 'محطة شبكة الفضاء العميق النشطة' : 'Active Deep Space Network'}
                    </div>
                    <div className="font-display text-lg font-bold text-white">
                      DSN {resources.commsStation} • {resources.commsSignal}%
                    </div>
                  </div>
                  <button
                    onClick={cycleCommsStation}
                    className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20"
                  >
                    {lang === 'ar' ? 'تبديل المحطة الأرضية' : 'Switch DSN Station'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs text-slate-400">
                    {lang === 'ar' ? 'الذاكرة العلمية المخزنة' : 'Buffered Science Data'}
                  </div>
                  <div className="font-mono-tech mt-1 text-2xl font-bold text-amber-300">
                    {Math.round(resources.dataStorage)} / {resources.maxStorage} MB
                  </div>
                  <button
                    onClick={transmitDataPacket}
                    className="mt-3 w-full rounded-xl bg-cyan-500 py-2.5 text-xs font-bold text-slate-950 hover:brightness-110"
                  >
                    {lang === 'ar' ? 'بث الحزمة العلمية للأرض (+رصيد)' : 'Transmit Packet to Earth (+Credits)'}
                  </button>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs font-bold text-white">
                    {lang === 'ar' ? 'البث التلقائي في الخلفية' : 'Auto-Transmit Relay'}
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {lang === 'ar'
                      ? 'عند التفعيل، ترسل السفينة البيانات المخزنة تدريجياً دون الحاجة للتدخل اليدوي.'
                      : 'Automatically streams buffered data packets during flight.'}
                  </p>
                  <button
                    onClick={() => setMissionPlan({ autoTransmit: !missionPlan.autoTransmit })}
                    className={`mt-3 w-full rounded-xl py-2.5 text-xs font-bold ${
                      missionPlan.autoTransmit
                        ? 'bg-emerald-500 text-slate-950'
                        : 'border border-white/15 bg-white/5 text-slate-200'
                    }`}
                  >
                    {missionPlan.autoTransmit
                      ? lang === 'ar'
                        ? 'مُفعّل ✓'
                        : 'ENABLED ✓'
                      : lang === 'ar'
                        ? 'تفعيل البث التلقائي'
                        : 'Enable Auto-Transmit'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {tabletTab === 'crew' && (
            <div className="space-y-3">
              {crew.map((member) => (
                <div
                  key={member.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div>
                    <div className="font-bold text-white">{member.name[lang]}</div>
                    <div className="text-xs text-cyan-300">{member.role[lang]}</div>
                    <div className="font-mono-tech mt-1 text-[11px] text-slate-400">
                      Morale {member.morale}% • Fatigue {member.fatigue}%
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(['Bridge', 'Engineering', 'Science', 'Comms'] as const).map((station) => (
                      <button
                        key={station}
                        onClick={() => assignCrew(member.id, station)}
                        className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold ${
                          member.assignment === station
                            ? 'bg-cyan-500 text-slate-950'
                            : 'border border-white/10 bg-white/5 text-slate-300'
                        }`}
                      >
                        {station}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
