import {
  Activity,
  AlertTriangle,
  BatteryCharging,
  Bot,
  CheckCircle2,
  Cpu,
  Flame,
  Pause,
  Play,
  Radio,
  ShieldAlert,
  Thermometer,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { INSTRUMENT_OPTIONS } from '../data/missionArchitectData';
import { PLANETS } from '../data/novaData';
import { MISSION_LIFECYCLE_12 } from '../engine/missionOpsEngine';
import { getPlanetEnvironment } from '../engine/planetaryEnvironments';
import { useGameStore } from '../store/gameStore';
import type {
  DynamicEventType,
  OperationalMode,
  TransmissionPriority,
} from '../types/game';
import type { DecisionVisualKind } from './DecisionReactive3DViewport';

interface MissionControlCenterModalProps {
  embedded?: boolean;
  onDecisionEvent?: (kind: DecisionVisualKind, ar: string, en: string) => void;
}

const EVENT_SIM_BUTTONS: Array<{
  type: DynamicEventType;
  ar: string;
  en: string;
}> = [
  { type: 'solar_storm', ar: 'عاصفة شمسية', en: 'Solar Storm' },
  { type: 'micrometeorite', ar: 'نيزك دقيق', en: 'Micrometeorite' },
  { type: 'comms_interruption', ar: 'انقطاع اتصال', en: 'Comms Outage' },
  { type: 'battery_degradation', ar: 'تدهور بطارية', en: 'Battery Drop' },
  { type: 'engine_malfunction', ar: 'عطل محرك', en: 'Engine Fault' },
  { type: 'nav_error', ar: 'خطأ ملاحة', en: 'Nav Drift' },
  { type: 'thermal_failure', ar: 'فشل حراري', en: 'Thermal Fault' },
  { type: 'power_spike', ar: 'ارتفاع استهلاك', en: 'Power Spike' },
  { type: 'dust_storm', ar: 'عاصفة غبار', en: 'Dust Storm' },
  { type: 'sensor_malfunction', ar: 'عطل حساس', en: 'Sensor Fault' },
  { type: 'fuel_leak', ar: 'تسرب وقود', en: 'Fuel Leak' },
  { type: 'equipment_overheat', ar: 'سخونة أجهزة', en: 'Overheat' },
];

export function MissionControlCenterModal({
  embedded = false,
  onDecisionEvent,
}: MissionControlCenterModalProps) {
  const lang = useGameStore((s) => s.lang);
  const mccOpen = useGameStore((s) => s.mccOpen);
  const setMccOpen = useGameStore((s) => s.setMccOpen);
  const sceneEnv = useGameStore((s) => s.sceneEnv);
  const activePlanet = useGameStore((s) => s.activePlanet);
  const resources = useGameStore((s) => s.resources);
  const spaceTelemetry = useGameStore((s) => s.spaceTelemetry);
  const surfaceTelemetry = useGameStore((s) => s.surfaceTelemetry);
  const hullIntegrity = useGameStore((s) => s.hullIntegrity);
  const fuelPct = useGameStore((s) => s.fuelPct);
  const internalTempC = useGameStore((s) => s.internalTempC);
  const operationalMode = useGameStore((s) => s.operationalMode);
  const txPriority = useGameStore((s) => s.txPriority);
  const activeInstrumentIds = useGameStore((s) => s.activeInstrumentIds);
  const instrumentActiveMap = useGameStore((s) => s.instrumentActiveMap);
  const tradeOffReport = useGameStore((s) => s.tradeOffReport);
  const lifecyclePhase = useGameStore((s) => s.lifecyclePhase);
  const lifecyclePaused = useGameStore((s) => s.lifecyclePaused);
  const activeMissionEvent = useGameStore((s) => s.activeMissionEvent);
  const missionTimelineLog = useGameStore((s) => s.missionTimelineLog);
  const autonomousRules = useGameStore((s) => s.autonomousRules);
  const autonomousActionLog = useGameStore((s) => s.autonomousActionLog);

  const setOperationalMode = useGameStore((s) => s.setOperationalMode);
  const setTxPriority = useGameStore((s) => s.setTxPriority);
  const toggleInstrumentActive = useGameStore((s) => s.toggleInstrumentActive);
  const setLifecyclePhase = useGameStore((s) => s.setLifecyclePhase);
  const toggleLifecyclePaused = useGameStore((s) => s.toggleLifecyclePaused);
  const triggerDynamicEvent = useGameStore((s) => s.triggerDynamicEvent);
  const resolveDynamicEvent = useGameStore((s) => s.resolveDynamicEvent);
  const attemptSystemRecovery = useGameStore((s) => s.attemptSystemRecovery);
  const updateAutonomousRules = useGameStore((s) => s.updateAutonomousRules);
  const transmitDataPacket = useGameStore((s) => s.transmitDataPacket);

  const [selectedPhaseInspect, setSelectedPhaseInspect] = useState<number>(lifecyclePhase);

  if (!embedded && !mccOpen) return null;

  const ar = lang === 'ar';
  const planetObj = PLANETS.find((p) => p.id === activePlanet) || PLANETS[0];
  const envProfile = getPlanetEnvironment(activePlanet);
  const phaseDef = MISSION_LIFECYCLE_12[Math.max(0, Math.min(11, lifecyclePhase - 1))];
  const inspectDef = MISSION_LIFECYCLE_12[Math.max(0, Math.min(11, selectedPhaseInspect - 1))];

  const overallHealth = Math.round(
    Math.max(
      0,
      Math.min(
        100,
        hullIntegrity * 0.35 +
          resources.battery * 0.25 +
          fuelPct * 0.2 +
          resources.suitO2 * 0.2
      )
    )
  );

  const posText =
    sceneEnv === 'planet'
      ? `Surface (${Math.round(surfaceTelemetry.playerX)}, ${Math.round(surfaceTelemetry.playerZ)})`
      : `Orbit (${Math.round(spaceTelemetry.shipX)}, ${Math.round(spaceTelemetry.shipZ)}) · ${spaceTelemetry.altitudeKm}km`;

  const warnings: string[] = [];
  if (resources.battery < 30) warnings.push(ar ? 'انخفاض شحن البطارية <30%' : 'Low Battery <30%');
  if (fuelPct < 30) warnings.push(ar ? 'انخفاض وقود الدفع <30%' : 'Low Propellant <30%');
  if (internalTempC > 45 || internalTempC < -10)
    warnings.push(ar ? `تحذير حراري: ${internalTempC}°C` : `Thermal Out-of-Band: ${internalTempC}°C`);
  if (tradeOffReport.netPowerW < 0)
    warnings.push(ar ? `عجز قدرة ${tradeOffReport.netPowerW}W` : `Power Deficit ${tradeOffReport.netPowerW}W`);
  if (resources.dataStorage > tradeOffReport.storageCapacityMb * 0.85)
    warnings.push(ar ? 'ذاكرة البيانات SSR شبه ممتلئة' : 'SSR Storage Buffer >85%');
  if (hullIntegrity < 55) warnings.push(ar ? 'تآكل سلامة الهيكل' : 'Structural Hull Degraded');

  const modes: Array<{ id: OperationalMode; ar: string; en: string; color: string }> = [
    { id: 'nominal', ar: 'قياسي (Nominal)', en: 'Nominal', color: 'border-cyan-400/50 bg-cyan-500/20 text-cyan-200' },
    { id: 'safe', ar: 'وضع الأمان (Safe)', en: 'Safe Mode', color: 'border-amber-400/60 bg-amber-500/20 text-amber-200' },
    { id: 'science_burst', ar: 'ذروة العلوم', en: 'Science Burst', color: 'border-emerald-400/50 bg-emerald-500/20 text-emerald-200' },
    { id: 'comms_downlink', ar: 'بث الاتصالات', en: 'Comms Downlink', color: 'border-violet-400/50 bg-violet-500/20 text-violet-200' },
    { id: 'low_power', ar: 'توفير الطاقة', en: 'Low Power', color: 'border-slate-400/50 bg-slate-500/20 text-slate-200' },
  ];

  const priorities: Array<{ id: TransmissionPriority; ar: string; en: string }> = [
    { id: 'critical_telemetry', ar: 'أولوية القياسات الحرجة', en: 'Critical Telemetry First' },
    { id: 'high_value_science', ar: 'بيانات العلوم عالية القيمة', en: 'High-Value Science' },
    { id: 'compressed_bulk', ar: 'بيانات مضغوطة مجمعة', en: 'Compressed Bulk Queue' },
  ];

  const body = (
    <div className="space-y-4">
      {/* Header Telemetry Bar */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6 font-mono-tech text-[11px]">
        <div className="nasa-card rounded-lg p-2.5">
          <div className="text-[9px] text-slate-400">{ar ? 'صحة المهمة' : 'MISSION HEALTH'}</div>
          <div className={`text-base font-bold ${overallHealth >= 70 ? 'text-emerald-300' : overallHealth >= 45 ? 'text-amber-300' : 'text-rose-400'}`}>
            {overallHealth}%
          </div>
          <div className="text-[9px] text-slate-400 truncate">{planetObj.name[lang]} · {envProfile.meanTempC}°C</div>
        </div>
        <div className="nasa-card rounded-lg p-2.5">
          <div className="text-[9px] text-slate-400">{ar ? 'الوقود / الدفع' : 'PROPELLANT'}</div>
          <div className={`text-base font-bold ${fuelPct > 35 ? 'text-cyan-300' : 'text-rose-400'}`}>
            {Math.round(fuelPct)}%
          </div>
          <div className="text-[9px] text-slate-400">Δv {tradeOffReport.deltaVAvailableKms}/{tradeOffReport.deltaVRequiredKms}</div>
        </div>
        <div className="nasa-card rounded-lg p-2.5">
          <div className="text-[9px] text-slate-400">{ar ? 'البطارية / القدرة' : 'POWER BUS'}</div>
          <div className={`text-base font-bold ${tradeOffReport.netPowerW >= 0 ? 'text-emerald-300' : 'text-rose-400'}`}>
            {Math.round(resources.battery)}% · {tradeOffReport.netPowerW >= 0 ? `+${tradeOffReport.netPowerW}` : tradeOffReport.netPowerW}W
          </div>
          <div className="text-[9px] text-slate-400">{tradeOffReport.powerGenW}W / {tradeOffReport.powerDrawW}W</div>
        </div>
        <div className="nasa-card rounded-lg p-2.5">
          <div className="text-[9px] text-slate-400">{ar ? 'الأكسجين والحرارة' : 'O2 & THERMAL'}</div>
          <div className={`text-base font-bold ${internalTempC > 48 || internalTempC < -12 ? 'text-rose-400' : 'text-sky-300'}`}>
            {Math.round(resources.suitO2)}% · {internalTempC}°C
          </div>
          <div className="text-[9px] text-slate-400">{ar ? 'آمن [-15..+52°C]' : 'Safe [-15..+52°C]'}</div>
        </div>
        <div className="nasa-card rounded-lg p-2.5">
          <div className="text-[9px] text-slate-400">{ar ? 'هيكل وذاكرة SSR' : 'HULL & SSR'}</div>
          <div className="text-base font-bold text-amber-300">
            {Math.round(hullIntegrity)}% · {Math.round(resources.dataStorage)}MB
          </div>
          <div className="text-[9px] text-slate-400">CAP {tradeOffReport.storageCapacityMb} MB</div>
        </div>
        <div className="nasa-card rounded-lg p-2.5">
          <div className="text-[9px] text-slate-400">{ar ? 'المحطة والمرحلة' : 'DSN & PHASE'}</div>
          <div className="text-sm font-bold text-violet-300 truncate">
            {resources.commsStation} ({Math.round(resources.commsSignal)}%)
          </div>
          <div className="text-[9px] text-slate-400 truncate">{posText}</div>
        </div>
      </div>

      {/* Warnings Strip */}
      {warnings.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-400/50 bg-amber-950/35 px-3 py-2 text-xs text-amber-200">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
          <span className="font-bold">{ar ? 'تحذيرات مباشرة:' : 'ACTIVE WARNINGS:'}</span>
          {warnings.map((w) => (
            <span key={w} className="rounded border border-amber-400/35 bg-black/35 px-2 py-0.5 text-[11px]">
              {w}
            </span>
          ))}
        </div>
      )}

      {/* Active Dynamic Emergency Box */}
      <div className={`rounded-xl border p-3.5 ${activeMissionEvent ? 'border-rose-500/60 bg-rose-950/35' : 'border-white/10 bg-black/30'}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className={`h-4 w-4 ${activeMissionEvent ? 'text-rose-400' : 'text-cyan-300'}`} />
            <h3 className="text-xs font-bold text-white sm:text-sm">
              {activeMissionEvent
                ? activeMissionEvent.title[lang]
                : ar
                  ? 'الأحداث الديناميكية والطوارئ (12 سيناريو مرتبط ببيئتك وتصميمك)'
                  : 'Dynamic Mission Events & Emergencies (12 Context-Driven Scenarios)'}
            </h3>
          </div>
          <button
            onClick={() => triggerDynamicEvent()}
            className="rounded-lg border border-amber-400/45 bg-amber-500/15 px-2.5 py-1 text-[11px] font-bold text-amber-200 hover:bg-amber-500/25"
          >
            {ar ? 'توليد طارئ مرتبط بالحالة الحالية' : 'Trigger Context-Aware Event'}
          </button>
        </div>

        {activeMissionEvent ? (
          <div className="mt-3 space-y-2.5">
            <p className="text-xs leading-relaxed text-slate-200">{activeMissionEvent.description[lang]}</p>
            <div className="flex flex-wrap gap-3 font-mono-tech text-[10px] text-slate-300">
              <span>{ar ? 'النظام المتأثر:' : 'SUBSYSTEM:'} <strong className="text-rose-300">{activeMissionEvent.affectedSubsystem}</strong></span>
              <span>{ar ? 'السبب الهندسي:' : 'TRIGGER:'} <strong className="text-amber-300">{activeMissionEvent.triggerBasis[lang]}</strong></span>
              <span>{ar ? 'شرط التعافي:' : 'RECOVERY:'} <strong className="text-emerald-300">{activeMissionEvent.recoveryCondition[lang]}</strong></span>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {activeMissionEvent.options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    resolveDynamicEvent(opt.id);
                    onDecisionEvent?.('repair', `معالجة طارئ: ${opt.label.ar}`, `Event Response: ${opt.label.en}`);
                  }}
                  className="rounded-lg border border-cyan-400/35 bg-slate-900/80 p-2.5 text-start transition hover:border-cyan-300 hover:bg-cyan-500/15"
                >
                  <div className="text-xs font-bold text-white">{opt.label[lang]}</div>
                  <div className="mt-1 text-[10px] text-slate-300">{opt.detail[lang]}</div>
                  <div className="mt-1.5 font-mono-tech text-[9px] text-cyan-300">
                    {opt.creditCost > 0 ? `-${opt.creditCost} CR · ` : ''}
                    HULL {opt.hullDelta >= 0 ? `+${opt.hullDelta}` : opt.hullDelta}% · PWR {opt.powerDelta >= 0 ? `+${opt.powerDelta}` : opt.powerDelta}%
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-2.5">
            <div className="mb-1.5 text-[11px] text-slate-400">
              {ar
                ? 'لا توجد طوارئ حرجة الآن — يمكنك اختبار استجابة المركبة لأي طارئ من الـ 12 نوعاً:'
                : 'No active emergency — simulate any of the 12 contextual event scenarios to test ship resilience:'}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {EVENT_SIM_BUTTONS.map((btn) => (
                <button
                  key={btn.type}
                  onClick={() => triggerDynamicEvent(btn.type)}
                  className="rounded border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-semibold text-slate-200 hover:border-amber-400/45 hover:bg-amber-500/15 hover:text-amber-200"
                >
                  {ar ? btn.ar : btn.en}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mode, Instruments, Priority & Recovery Grid */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {/* Operational Modes & Recovery */}
        <div className="nasa-card rounded-xl p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
              <Cpu className="h-4 w-4" />
              <span>{ar ? 'أوضاع التشغيل وتوزيع الطاقة' : 'Operational Modes & Recovery'}</span>
            </div>
            <button
              onClick={() => {
                attemptSystemRecovery();
                onDecisionEvent?.('repair', 'تنفيذ بروتوكول استعادة الأنظمة', 'System Recovery Protocol Executed');
              }}
              className="flex items-center gap-1 rounded border border-emerald-400/45 bg-emerald-500/20 px-2.5 py-1 text-[11px] font-bold text-emerald-200 hover:bg-emerald-500/30"
            >
              <Wrench className="h-3.5 w-3.5" />
              <span>{ar ? 'استعادة الأنظمة (35 CR)' : 'System Recovery (35 CR)'}</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {modes.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  setOperationalMode(m.id);
                  onDecisionEvent?.('power', `تفعيل وضع ${m.ar}`, `Mode Switch: ${m.en}`);
                }}
                className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition ${
                  operationalMode === m.id
                    ? m.color
                    : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                {ar ? m.ar : m.en}
              </button>
            ))}
          </div>

          <div className="border-t border-white/10 pt-2.5">
            <div className="mb-1.5 flex items-center justify-between text-[11px]">
              <span className="font-bold text-violet-300">
                {ar ? 'أولوية بث البيانات إلى الأرض (DSN):' : 'DSN Downlink Priority Queue:'}
              </span>
              <button
                onClick={() => {
                  transmitDataPacket();
                  onDecisionEvent?.('comms', 'بث حزمة بيانات ذات أولوية للأرض', 'Priority Telemetry Downlink');
                }}
                className="flex items-center gap-1 rounded bg-cyan-400 px-2.5 py-0.5 text-[10px] font-bold text-slate-950"
              >
                <Radio className="h-3 w-3" />
                <span>{ar ? 'بث فوري' : 'Transmit Now'}</span>
              </button>
            </div>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
              {priorities.map((pr) => (
                <button
                  key={pr.id}
                  onClick={() => setTxPriority(pr.id)}
                  className={`rounded border px-2 py-1 text-[10px] font-bold ${
                    txPriority === pr.id
                      ? 'border-violet-400 bg-violet-500/25 text-violet-100'
                      : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {ar ? pr.ar : pr.en}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Active Instruments Switchboard */}
        <div className="nasa-card rounded-xl p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
              <Zap className="h-4 w-4" />
              <span>{ar ? 'تشغيل/إيقاف الأجهزة العلمية الحية' : 'Scientific Instruments Switchboard'}</span>
            </div>
            <span className="font-mono-tech text-[10px] text-slate-400">
              {tradeOffReport.dataGenMbDay} MB/d · {tradeOffReport.commsCapacityMbDay} MB/d TX
            </span>
          </div>

          <div className="space-y-1.5">
            {INSTRUMENT_OPTIONS.filter((inst) => activeInstrumentIds.includes(inst.id)).length === 0 ? (
              <div className="text-xs text-slate-400">
                {ar ? 'لا توجد أجهزة مركبة — أضف أجهزة من ورشة الأنظمة 14.' : 'No payload instruments mounted — install from 14-Subsystem Lab.'}
              </div>
            ) : (
              INSTRUMENT_OPTIONS.filter((inst) => activeInstrumentIds.includes(inst.id)).map((inst) => {
                const isOn = instrumentActiveMap[inst.id] !== false;
                return (
                  <div
                    key={inst.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/35 px-2.5 py-1.5"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-xs font-bold text-white">{inst.name[lang]}</div>
                      <div className="font-mono-tech text-[10px] text-slate-400">
                        -{inst.powerW}W · +{inst.dataMbDay} MB/d · +{inst.scienceVal} SCI
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        toggleInstrumentActive(inst.id);
                        onDecisionEvent?.(
                          'science',
                          `${isOn ? 'إيقاف' : 'تشغيل'} ${inst.name.ar}`,
                          `${isOn ? 'Deactivated' : 'Activated'} ${inst.name.en}`
                        );
                      }}
                      className={`shrink-0 rounded px-2.5 py-1 text-[10px] font-bold ${
                        isOn
                          ? 'bg-emerald-400 text-slate-950'
                          : 'border border-white/20 bg-white/5 text-slate-300'
                      }`}
                    >
                      {isOn ? (ar ? 'نشط ON' : 'ON') : ar ? 'متوقف OFF' : 'OFF'}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 12-Phase Interactive Mission Timeline */}
      <div className="nasa-card rounded-xl p-3 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
            <Activity className="h-4 w-4" />
            <span>
              {ar
                ? `الجدول الزمني لدورة حياة المهمة (12 مرحلة) — المرحلة الحالية ${lifecyclePhase}/12`
                : `12-Phase Mission Lifecycle Timeline — Current Phase ${lifecyclePhase}/12`}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleLifecyclePaused}
              className={`flex items-center gap-1 rounded border px-2.5 py-1 text-[10px] font-bold ${
                lifecyclePaused
                  ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                  : 'border-cyan-400/40 bg-cyan-500/15 text-cyan-200'
              }`}
            >
              {lifecyclePaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
              <span>{lifecyclePaused ? (ar ? 'استئناف' : 'Resume') : ar ? 'إيقاف مؤقت' : 'Pause'}</span>
            </button>
            <button
              onClick={() => setLifecyclePhase(Math.min(12, lifecyclePhase + 1))}
              className="rounded bg-amber-400 px-2.5 py-1 text-[10px] font-bold text-slate-950"
            >
              {ar ? 'تقدم للمرحلة التالية ▶' : 'Advance Phase ▶'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1 sm:grid-cols-6 lg:grid-cols-12">
          {MISSION_LIFECYCLE_12.map((p) => {
            const done = p.phase < lifecyclePhase;
            const current = p.phase === lifecyclePhase;
            const inspected = p.phase === selectedPhaseInspect;
            return (
              <button
                key={p.phase}
                onClick={() => setSelectedPhaseInspect(p.phase)}
                className={`rounded border px-1.5 py-1.5 text-center font-mono-tech text-[10px] font-bold transition ${
                  current
                    ? 'border-cyan-300 bg-cyan-500/25 text-white'
                    : done
                      ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200'
                      : inspected
                        ? 'border-amber-400/60 bg-amber-500/15 text-amber-200'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                <div>{p.code}</div>
                <div className="text-[8px]">{done ? '✓' : current ? 'NOW' : `P${p.phase}`}</div>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-2 rounded-lg border border-white/10 bg-black/40 p-2.5 text-[11px] sm:grid-cols-2">
          <div>
            <div className="font-bold text-cyan-200">{inspectDef.title[lang]}</div>
            <div className="mt-0.5 text-slate-300">{inspectDef.objective[lang]}</div>
            <div className="mt-1 text-[10px] text-emerald-300">
              {ar ? 'المطلوب:' : 'Req:'} {inspectDef.resourceReq[lang]}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-[10px] text-amber-300">
              {ar ? 'القيد التشغيلي:' : 'Constraint:'} {inspectDef.constraint[lang]}
            </div>
            <div className="text-[10px] text-rose-300">
              {ar ? 'شرط الفشل:' : 'Failure Condition:'} {inspectDef.failureCondition[lang]}
            </div>
            {inspectDef.phase !== lifecyclePhase && (
              <button
                onClick={() => setLifecyclePhase(inspectDef.phase)}
                className="mt-1 rounded border border-cyan-400/40 bg-cyan-500/15 px-2 py-0.5 text-[10px] font-bold text-cyan-200"
              >
                {ar ? `الانتقال إلى ${inspectDef.code}` : `Jump to ${inspectDef.code}`}
              </button>
            )}
          </div>
        </div>
        <div className="text-[10px] text-slate-400">
          {ar ? 'المرحلة النشطة الآن:' : 'Live Phase:'}{' '}
          <strong className="text-white">{phaseDef.title[lang]}</strong> · {missionTimelineLog.slice(-1)[0]?.summary[lang]}
        </div>
      </div>

      {/* Autonomous Spacecraft Operations */}
      <div className="nasa-card rounded-xl p-3 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-sky-300">
            <Bot className="h-4 w-4" />
            <span>{ar ? 'التشغيل الذاتي للمركبة (Autonomous Rules)' : 'Autonomous Spacecraft Operations'}</span>
          </div>
          <button
            onClick={() => updateAutonomousRules({ enabled: !autonomousRules.enabled })}
            className={`flex items-center gap-1 rounded px-2.5 py-1 text-[10px] font-bold ${
              autonomousRules.enabled ? 'bg-emerald-400 text-slate-950' : 'border border-white/20 bg-white/5 text-slate-300'
            }`}
          >
            <CheckCircle2 className="h-3 w-3" />
            <span>{autonomousRules.enabled ? (ar ? 'مفعّل AUTO ON' : 'AUTONOMOUS ON') : ar ? 'يدوي MANUAL' : 'MANUAL'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-[11px]">
          <label className="flex items-center justify-between gap-2 rounded border border-white/10 bg-black/30 px-2.5 py-1.5">
            <span className="flex items-center gap-1 text-slate-300">
              <BatteryCharging className="h-3.5 w-3.5 text-amber-300" />
              {ar ? `عتبة وضع توفير الطاقة (${autonomousRules.lowBatteryThresholdPct}%)` : `Low-Power Threshold (${autonomousRules.lowBatteryThresholdPct}%)`}
            </span>
            <input
              type="range"
              min={10}
              max={45}
              value={autonomousRules.lowBatteryThresholdPct}
              onChange={(e) => updateAutonomousRules({ lowBatteryThresholdPct: Number(e.target.value) })}
              className="w-24 accent-cyan-400"
            />
          </label>

          <label className="flex items-center justify-between gap-2 rounded border border-white/10 bg-black/30 px-2.5 py-1.5">
            <span className="flex items-center gap-1 text-slate-300">
              <Thermometer className="h-3.5 w-3.5 text-rose-300" />
              {ar ? `عتبة التبريد الطارئ (${autonomousRules.overheatThresholdC}°C)` : `Overheat Cutoff (${autonomousRules.overheatThresholdC}°C)`}
            </span>
            <input
              type="range"
              min={32}
              max={65}
              value={autonomousRules.overheatThresholdC}
              onChange={(e) => updateAutonomousRules({ overheatThresholdC: Number(e.target.value) })}
              className="w-24 accent-rose-400"
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-2 text-[10px]">
          <button
            onClick={() => updateAutonomousRules({ onCommsLossStoreAndRetry: !autonomousRules.onCommsLossStoreAndRetry })}
            className={`rounded border px-2 py-1 font-bold ${
              autonomousRules.onCommsLossStoreAndRetry ? 'border-cyan-400/50 bg-cyan-500/20 text-cyan-200' : 'border-white/10 bg-white/5 text-slate-400'
            }`}
          >
            {ar ? 'تخزين SSR وإعادة الإرسال عند انقطاع الإشارة' : 'Auto Store-and-Retry on Comms Loss'}
          </button>
          <button
            onClick={() => updateAutonomousRules({ onCriticalFailureEnterSafeMode: !autonomousRules.onCriticalFailureEnterSafeMode })}
            className={`rounded border px-2 py-1 font-bold ${
              autonomousRules.onCriticalFailureEnterSafeMode ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-200' : 'border-white/10 bg-white/5 text-slate-400'
            }`}
          >
            {ar ? 'دخول Safe Mode تلقائياً عند الطوارئ الحرجة' : 'Auto Safe-Mode on Critical Event'}
          </button>
          <button
            onClick={() => updateAutonomousRules({ onNavErrorSwitchBackupObc: !autonomousRules.onNavErrorSwitchBackupObc })}
            className={`rounded border px-2 py-1 font-bold ${
              autonomousRules.onNavErrorSwitchBackupObc ? 'border-violet-400/50 bg-violet-500/20 text-violet-200' : 'border-white/10 bg-white/5 text-slate-400'
            }`}
          >
            {ar ? 'تحويل الحاسوب الاحتياطي عند خطأ الملاحة' : 'Auto Backup-OBC on Nav Error'}
          </button>
        </div>

        {autonomousActionLog.length > 0 && (
          <div className="max-h-20 overflow-y-auto rounded border border-white/10 bg-black/45 p-2 font-mono-tech text-[10px] text-cyan-200 space-y-0.5">
            {autonomousActionLog.slice(-4).map((entry, idx) => (
              <div key={idx}>• {entry}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (embedded) return body;

  return (
    <div className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center bg-black/80 p-3 sm:p-5">
      <div className="nova-panel flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-cyan-400/45">
        <div className="flex items-center justify-between border-b border-white/10 bg-[#070b14] px-4 py-3">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-cyan-300" />
            <div>
              <h2 className="font-display text-base font-bold text-white">
                {ar ? 'مركز التحكم بالمهمة (Mission Control Center)' : 'Mission Control Center (MCC)'}
              </h2>
              <p className="text-[11px] text-cyan-300">
                {ar ? 'مرتبط مباشرة بحالة المركبة في الـ 2D و 3D' : 'Real-Time Spacecraft Telemetry, Timeline & Autonomous Ops'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setMccOpen(false)}
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
