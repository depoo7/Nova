import {
  AlertCircle,
  Compass,
  FlaskConical,
  Orbit,
  RotateCcw,
  Sliders,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { PLANETS } from '../data/novaData';
import {
  evaluateTransferRoutes,
  runWhatIfScenario,
} from '../engine/engineeringTradeoffEngine';
import { SUBSYSTEM_CATALOG_14 } from '../engine/subsystemsCatalog';
import { useGameStore } from '../store/gameStore';
import type { TransferStrategy, WhatIfParameters } from '../types/game';
import type { DecisionVisualKind } from './DecisionReactive3DViewport';

interface WhatIfAndOrbitPanelProps {
  embedded?: boolean;
  onDecisionEvent?: (kind: DecisionVisualKind, ar: string, en: string) => void;
}

const DEFAULT_WHAT_IF: WhatIfParameters = {
  massDeltaPct: 0,
  powerDeltaPct: 0,
  engineFailure: false,
  commsBlackoutHours: 0,
  durationMultiplier: 1.0,
  instrumentFailedCount: 0,
  solarStormActive: false,
};

export function WhatIfAndOrbitPanel({
  embedded = false,
  onDecisionEvent,
}: WhatIfAndOrbitPanelProps) {
  const lang = useGameStore((s) => s.lang);
  const whatIfOpen = useGameStore((s) => s.whatIfOpen);
  const setWhatIfOpen = useGameStore((s) => s.setWhatIfOpen);
  const activePlanet = useGameStore((s) => s.activePlanet);
  const advancedLoadout = useGameStore((s) => s.advancedLoadout);
  const activeInstrumentIds = useGameStore((s) => s.activeInstrumentIds);
  const instrumentActiveMap = useGameStore((s) => s.instrumentActiveMap);
  const operationalMode = useGameStore((s) => s.operationalMode);
  const transferStrategy = useGameStore((s) => s.transferStrategy);
  const activeGroundStationId = useGameStore((s) => s.activeGroundStationId);
  const commsCompressionMode = useGameStore((s) => s.commsCompressionMode);
  const analysisFidelityMode = useGameStore((s) => s.analysisFidelityMode);
  const resources = useGameStore((s) => s.resources);
  const unlockedBudgetBonusM = useGameStore((s) => s.unlockedBudgetBonusM);
  const sandboxUnrestricted = useGameStore((s) => s.sandboxUnrestricted);
  const hullIntegrity = useGameStore((s) => s.hullIntegrity);
  const tradeOffReport = useGameStore((s) => s.tradeOffReport);

  const setTransferStrategy = useGameStore((s) => s.setTransferStrategy);

  const [whatIf, setWhatIf] = useState<WhatIfParameters>({ ...DEFAULT_WHAT_IF });

  const comparison = useMemo(
    () =>
      runWhatIfScenario(
        {
          planetId: activePlanet,
          loadout: advancedLoadout,
          instrumentIds: activeInstrumentIds,
          activeInstrumentMap: instrumentActiveMap,
          operationalMode,
          transferStrategy,
          stationId: activeGroundStationId,
          compressionMode: commsCompressionMode,
          fidelityMode: analysisFidelityMode,
          maxBudgetM: Math.max(200, resources.budget + unlockedBudgetBonusM),
          sandboxUnrestricted,
          hullIntegrity,
        },
        whatIf
      ),
    [
      activePlanet,
      advancedLoadout,
      activeInstrumentIds,
      instrumentActiveMap,
      operationalMode,
      transferStrategy,
      activeGroundStationId,
      commsCompressionMode,
      analysisFidelityMode,
      resources.budget,
      unlockedBudgetBonusM,
      sandboxUnrestricted,
      hullIntegrity,
      whatIf,
    ]
  );

  const propItem = SUBSYSTEM_CATALOG_14.find((x) => x.id === advancedLoadout.propulsion);
  const routes = useMemo(
    () => evaluateTransferRoutes(activePlanet, tradeOffReport.dryMassKg, propItem?.ispSec ?? 320),
    [activePlanet, tradeOffReport.dryMassKg, propItem?.ispSec]
  );

  if (!embedded && !whatIfOpen) return null;

  const ar = lang === 'ar';
  const curPlanet = PLANETS.find((p) => p.id === activePlanet) || PLANETS[0];

  const strategyLabels: Record<TransferStrategy, { ar: string; en: string; color: string }> = {
    hohmann: { ar: 'نقل هوهمان الاقتصادي (Hohmann)', en: 'Hohmann Optimal Transfer', color: '#22d3ee' },
    fast_burn: { ar: 'حرق سريع عالي Δv (Fast Burn)', en: 'Fast High-Energy Transfer', color: '#fb7185' },
    gravity_assist: { ar: 'مقلاع الجاذبية الكوكبية (Gravity Assist)', en: 'Gravity-Assist Slingshot', color: '#34d399' },
  };

  const rows = [
    {
      label: ar ? 'احتمال النجاح (%)' : 'Success Probability',
      base: `${comparison.baseline.successProbabilityPct}%`,
      sim: `${comparison.simulated.successProbabilityPct}%`,
      delta: comparison.simulated.successProbabilityPct - comparison.baseline.successProbabilityPct,
      higherBetter: true,
    },
    {
      label: ar ? 'استهلاك الوقود (%)' : 'Fuel Consumption',
      base: `${comparison.baseline.fuelConsumptionPct}%`,
      sim: `${comparison.simulated.fuelConsumptionPct}%`,
      delta: comparison.simulated.fuelConsumptionPct - comparison.baseline.fuelConsumptionPct,
      higherBetter: false,
    },
    {
      label: ar ? 'التكلفة التقديرية ($M)' : 'Mission Cost',
      base: `$${comparison.baseline.missionCostM}M`,
      sim: `$${comparison.simulated.missionCostM}M`,
      delta: comparison.simulated.missionCostM - comparison.baseline.missionCostM,
      higherBetter: false,
    },
    {
      label: ar ? 'مدة المهمة (سنوات)' : 'Duration (yrs)',
      base: `${comparison.baseline.durationYrs}`,
      sim: `${comparison.simulated.durationYrs}`,
      delta: Number((comparison.simulated.durationYrs - comparison.baseline.durationYrs).toFixed(1)),
      higherBetter: false,
    },
    {
      label: ar ? 'العائد العلمي' : 'Science Achievement',
      base: `${comparison.baseline.scienceAchievement}`,
      sim: `${comparison.simulated.scienceAchievement}`,
      delta: comparison.simulated.scienceAchievement - comparison.baseline.scienceAchievement,
      higherBetter: true,
    },
    {
      label: ar ? 'اعتمادية النظام (%)' : 'System Reliability',
      base: `${comparison.baseline.reliabilityPct}%`,
      sim: `${comparison.simulated.reliabilityPct}%`,
      delta: comparison.simulated.reliabilityPct - comparison.baseline.reliabilityPct,
      higherBetter: true,
    },
    {
      label: ar ? 'المخاطر الهندسية' : 'Engineering Risk',
      base: `${comparison.baseline.engineeringRisk}/100`,
      sim: `${comparison.simulated.engineeringRisk}/100`,
      delta: comparison.simulated.engineeringRisk - comparison.baseline.engineeringRisk,
      higherBetter: false,
    },
  ];

  const body = (
    <div className="space-y-4">
      {/* Counterfactual Disclaimer */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-400/50 bg-amber-950/35 px-3.5 py-2.5 text-xs">
        <div className="flex items-center gap-2 text-amber-100">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
          <div>
            <span className="font-mono-tech font-bold text-amber-300 me-1.5">[{comparison.tag}]</span>
            <span>
              {ar
                ? 'اختبار افتراضي غير مدمّر: لا يعدّل تصميم المركبة الحقيقي حتى تقرر تطبيق التغييرات.'
                : 'Non-destructive counterfactual simulation — estimates hypothetical impact without altering your live craft.'}
            </span>
          </div>
        </div>
        <button
          onClick={() => setWhatIf({ ...DEFAULT_WHAT_IF })}
          className="flex items-center gap-1 rounded border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-white/20"
        >
          <RotateCcw className="h-3 w-3" /> {ar ? 'إعادة ضبط' : 'Reset'}
        </button>
      </div>

      {/* What-If Controls + Side-by-Side Comparison */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        <div className="nasa-card lg:col-span-5 rounded-xl p-3 space-y-2.5 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-cyan-300">
            <Sliders className="h-4 w-4" />
            <span>{ar ? 'متغيرات سيناريو "ماذا لو؟"' : 'What-If Counterfactual Parameters'}</span>
          </div>

          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setWhatIf((s) => ({ ...s, massDeltaPct: 20 }))}
              className="rounded border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] text-slate-200 hover:bg-cyan-500/20"
            >
              +20% Mass
            </button>
            <button
              onClick={() => setWhatIf((s) => ({ ...s, powerDeltaPct: -30 }))}
              className="rounded border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] text-slate-200 hover:bg-amber-500/20"
            >
              -30% Power
            </button>
            <button
              onClick={() => setWhatIf((s) => ({ ...s, engineFailure: !s.engineFailure }))}
              className="rounded border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] text-slate-200 hover:bg-rose-500/20"
            >
              {ar ? 'عطل محرك' : 'Engine Fail'}
            </button>
            <button
              onClick={() => setWhatIf((s) => ({ ...s, commsBlackoutHours: 12 }))}
              className="rounded border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] text-slate-200 hover:bg-violet-500/20"
            >
              12h Blackout
            </button>
          </div>

          <label className="block space-y-1">
            <div className="flex justify-between font-mono-tech text-[10px]">
              <span>{ar ? 'تغيّر الكتلة الجافة:' : 'Dry Mass Shift:'}</span>
              <span className="text-amber-300">{whatIf.massDeltaPct >= 0 ? `+${whatIf.massDeltaPct}%` : `${whatIf.massDeltaPct}%`}</span>
            </div>
            <input type="range" min={-20} max={50} step={5} value={whatIf.massDeltaPct} onChange={(e) => setWhatIf({ ...whatIf, massDeltaPct: Number(e.target.value) })} className="w-full accent-cyan-400" />
          </label>

          <label className="block space-y-1">
            <div className="flex justify-between font-mono-tech text-[10px]">
              <span>{ar ? 'تغيّر توليد الطاقة:' : 'Power Gen Delta:'}</span>
              <span className="text-rose-300">{whatIf.powerDeltaPct >= 0 ? `+${whatIf.powerDeltaPct}%` : `${whatIf.powerDeltaPct}%`}</span>
            </div>
            <input type="range" min={-60} max={30} step={5} value={whatIf.powerDeltaPct} onChange={(e) => setWhatIf({ ...whatIf, powerDeltaPct: Number(e.target.value) })} className="w-full accent-rose-400" />
          </label>

          <label className="block space-y-1">
            <div className="flex justify-between font-mono-tech text-[10px]">
              <span>{ar ? 'ساعات انقطاع الاتصال:' : 'Comms Blackout (hrs):'}</span>
              <span className="text-violet-300">{whatIf.commsBlackoutHours}h / 24h</span>
            </div>
            <input type="range" min={0} max={24} step={2} value={whatIf.commsBlackoutHours} onChange={(e) => setWhatIf({ ...whatIf, commsBlackoutHours: Number(e.target.value) })} className="w-full accent-violet-400" />
          </label>

          <label className="block space-y-1">
            <div className="flex justify-between font-mono-tech text-[10px]">
              <span>{ar ? 'تمديد مدة المهمة:' : 'Duration Multiplier:'}</span>
              <span className="text-cyan-300">{whatIf.durationMultiplier}x</span>
            </div>
            <input type="range" min={1} max={3} step={0.5} value={whatIf.durationMultiplier} onChange={(e) => setWhatIf({ ...whatIf, durationMultiplier: Number(e.target.value) })} className="w-full accent-cyan-400" />
          </label>

          <label className="block space-y-1">
            <div className="flex justify-between font-mono-tech text-[10px]">
              <span>{ar ? 'أجهزة علمية معطلة:' : 'Failed Instruments:'}</span>
              <span className="text-amber-300">{whatIf.instrumentFailedCount}</span>
            </div>
            <input type="range" min={0} max={3} step={1} value={whatIf.instrumentFailedCount} onChange={(e) => setWhatIf({ ...whatIf, instrumentFailedCount: Number(e.target.value) })} className="w-full accent-amber-400" />
          </label>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={() => setWhatIf({ ...whatIf, engineFailure: !whatIf.engineFailure })}
              className={`flex-1 rounded border py-1 text-[11px] font-bold ${
                whatIf.engineFailure ? 'border-rose-400 bg-rose-500/25 text-rose-100' : 'border-white/15 bg-white/5 text-slate-300'
              }`}
            >
              {ar ? 'تعطل المحرك' : 'Engine Failure'}
            </button>
            <button
              onClick={() => setWhatIf({ ...whatIf, solarStormActive: !whatIf.solarStormActive })}
              className={`flex-1 rounded border py-1 text-[11px] font-bold ${
                whatIf.solarStormActive ? 'border-amber-400 bg-amber-500/25 text-amber-100' : 'border-white/15 bg-white/5 text-slate-300'
              }`}
            >
              {ar ? 'عاصفة شمسية' : 'Solar Storm'}
            </button>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="nasa-card lg:col-span-7 rounded-xl p-3 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-emerald-300">
              {ar ? 'مقارنة جنبًا إلى جنب: التصميم الفعلي مقابل الافتراضي' : 'Side-by-Side Comparison: Actual Baseline vs Simulated What-If'}
            </span>
            <span className="font-mono-tech text-[10px] text-amber-300">SIMULATED ESTIMATE</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/10 text-[10px] font-mono-tech text-slate-400">
                  <th className="py-1.5 text-start">{ar ? 'المؤشر' : 'METRIC'}</th>
                  <th className="py-1.5 text-center">{ar ? 'الأصلي' : 'ORIGINAL'}</th>
                  <th className="py-1.5 text-center">{ar ? 'المحاكاة الافتراضية' : 'WHAT-IF SIM'}</th>
                  <th className="py-1.5 text-end">{ar ? 'الفرق' : 'DELTA'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono-tech text-[11px]">
                {rows.map((r) => {
                  const good = r.delta === 0 ? null : r.higherBetter ? r.delta > 0 : r.delta < 0;
                  return (
                    <tr key={r.label}>
                      <td className="py-1.5 font-sans font-semibold text-slate-200">{r.label}</td>
                      <td className="py-1.5 text-center text-cyan-300">{r.base}</td>
                      <td className="py-1.5 text-center font-bold text-white">{r.sim}</td>
                      <td className={`py-1.5 text-end font-bold ${good === null ? 'text-slate-400' : good ? 'text-emerald-300' : 'text-rose-400'}`}>
                        {r.delta > 0 ? `+${r.delta}` : r.delta}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="rounded-lg border border-white/10 bg-black/40 p-2.5 space-y-1 text-[11px] text-slate-200">
            <div className="font-bold text-amber-300">{ar ? 'النتائج والتأثيرات المستنتجة:' : 'Key Simulated Impacts:'}</div>
            {comparison.keyImpacts.map((imp, i) => (
              <div key={i}>• {imp[lang]}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Feature 18: Orbital Transfer & Fuel Optimization */}
      <div className="nasa-card rounded-xl p-3 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
            <Orbit className="h-4 w-4" />
            <span>
              {ar
                ? `مقارنة مسارات الانتقال المداري وتحسين الوقود نحو ${curPlanet.name.ar}`
                : `Orbital Transfer & Fuel Optimization to ${curPlanet.name.en}`}
            </span>
          </div>
          <span className="font-mono-tech text-[10px] text-slate-400">
            DRY MASS {tradeOffReport.dryMassKg} kg · ACTIVE: {transferStrategy.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          {/* 2D Transfer Trajectory SVG */}
          <div className="lg:col-span-5 rounded-xl border border-cyan-400/25 bg-[#040812] p-2">
            <svg viewBox="0 0 280 180" className="h-44 w-full">
              <circle cx="140" cy="90" r="10" fill="#fbbf24" />
              <circle cx="140" cy="90" r="42" fill="none" stroke="rgba(148,163,184,0.25)" strokeDasharray="3 3" />
              <circle cx="140" cy="90" r="76" fill="none" stroke="rgba(148,163,184,0.25)" strokeDasharray="3 3" />
              {/* Hohmann arc */}
              <path d="M 98 90 A 58 46 0 0 1 216 90" fill="none" stroke="#22d3ee" strokeWidth={transferStrategy === 'hohmann' ? 2.8 : 1.2} opacity={transferStrategy === 'hohmann' ? 1 : 0.45} />
              {/* Fast burn chord */}
              <path d="M 98 90 Q 158 55 216 90" fill="none" stroke="#fb7185" strokeWidth={transferStrategy === 'fast_burn' ? 2.8 : 1.2} strokeDasharray="4 2" opacity={transferStrategy === 'fast_burn' ? 1 : 0.45} />
              {/* Gravity assist loop */}
              <path d="M 98 90 C 95 25, 225 20, 216 90" fill="none" stroke="#34d399" strokeWidth={transferStrategy === 'gravity_assist' ? 2.8 : 1.2} opacity={transferStrategy === 'gravity_assist' ? 1 : 0.45} />
              <circle cx="98" cy="90" r="4.5" fill="#38bdf8" />
              <circle cx="216" cy="90" r="5.5" fill={curPlanet.atmosphereColor} />
              <text x="98" y="106" textAnchor="middle" fill="#cbd5e1" fontSize="8">EARTH</text>
              <text x="216" y="106" textAnchor="middle" fill="#fde68a" fontSize="8">{curPlanet.id.toUpperCase()}</text>
            </svg>
          </div>

          {/* 3 Strategy Cards */}
          <div className="lg:col-span-7 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {routes.map((rt) => {
              const active = transferStrategy === rt.strategy;
              const lbl = strategyLabels[rt.strategy];
              return (
                <div
                  key={rt.strategy}
                  className={`flex flex-col justify-between rounded-xl border p-2.5 text-xs ${
                    active ? 'border-cyan-400 bg-cyan-950/35' : 'border-white/10 bg-black/35'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 font-bold text-white">
                      <Compass className="h-3.5 w-3.5" style={{ color: lbl.color }} />
                      <span>{ar ? lbl.ar : lbl.en}</span>
                    </div>
                    <div className="font-mono-tech text-[10px] text-slate-300 space-y-0.5 pt-1">
                      <div>Δv: <strong className="text-cyan-300">{rt.deltaVKms} km/s</strong></div>
                      <div>{ar ? 'الوقود:' : 'Propellant:'} <strong className="text-amber-300">{rt.propellantMassKg} kg</strong></div>
                      <div>{ar ? 'العبور:' : 'Transit:'} <strong className="text-emerald-300">{rt.transitDays} d</strong></div>
                      <div>{ar ? 'نافذة الإطلاق:' : 'Window:'} <strong>{rt.launchWindowDeg}°</strong></div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setTransferStrategy(rt.strategy);
                      onDecisionEvent?.('power', `تطبيق مسار ${lbl.ar}`, `Route Applied: ${lbl.en}`);
                    }}
                    className={`mt-2 w-full rounded py-1 text-[10px] font-bold ${
                      active ? 'bg-emerald-400 text-slate-950' : 'bg-cyan-400 text-slate-950 hover:brightness-110'
                    }`}
                  >
                    {active ? (ar ? 'مطبّق في 2D/3D ✓' : 'ACTIVE ✓') : ar ? 'تطبيق المسار' : 'Apply Route'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  if (embedded) return body;

  return (
    <div className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center bg-black/80 p-3 sm:p-5">
      <div className="nova-panel flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-amber-400/45">
        <div className="flex items-center justify-between border-b border-white/10 bg-[#070b14] px-4 py-3">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-amber-300" />
            <div>
              <h2 className="font-display text-base font-bold text-white">
                {ar ? 'محاكي «ماذا لو؟» وتحسين المدارات والوقود' : 'What-If Mission Simulator & Orbital Transfer Lab'}
              </h2>
              <p className="text-[11px] text-amber-300">
                {ar ? 'اختبر السيناريوهات القاسية دون إتلاف مركبتك الفعلية' : 'Non-destructive stress simulation & Δv route trade-offs'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setWhatIfOpen(false)}
            className="rounded-lg border border-white/15 bg-white/5 p-1.5 text-slate-300 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{body}</div>
      </div>
    </div>
  );
}
