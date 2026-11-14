import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Cpu,
  FlaskConical,
  Play,
  Radio,
  Satellite,
  Signal,
  WifiOff,
} from 'lucide-react';
import {
  GMAT_VALIDATION_BENCHMARKS,
  GROUND_STATIONS,
  MISSION_TIMELINE_PHASES,
  MODELING_ASSUMPTIONS,
  computeCommsLinkBudget,
  computeFidelityAnalysis,
  type CompressionMode,
  type GroundStationDef,
} from '../data/spaceOpsData';
import type { OrbitOption, SubsystemOption } from '../data/missionArchitectData';
import type { AnalysisFidelityMode, Language } from '../types/game';

interface SpaceOpsSystemsPanelProps {
  lang: Language;
  orbit: OrbitOption;
  commsSys: SubsystemOption;
  adcsSys: SubsystemOption;
  rawDataGenMbDay: number;
  massOk: boolean;
  powerOk: boolean;
  scienceOk: boolean;
  lifetimeOk: boolean;
  totalMassKg: number;
  maxPayloadKg: number;
  powerGenW: number;
  netPowerW: number;
  effectiveScience: number;
  targetScience: number;
  selectedStationId: string;
  onSelectStationId: (id: string) => void;
  compressionMode: CompressionMode;
  onChangeCompression: (mode: CompressionMode) => void;
  fidelityMode: AnalysisFidelityMode;
  onChangeFidelityMode: (mode: AnalysisFidelityMode) => void;
  dutyCycleActive?: boolean;
  storeBufferMb?: number;
  storeTransmittedMb?: number;
  onSyncDownlinkToStore?: (receivedMb: number, linkMeta: { stationId: string; signalPct: number; dataRateKbps: number; windowHrs: number }) => void;
  onDecisionEvent?: (kind: 'comms' | 'timeline' | 'validation' | 'fidelity', ar: string, en: string) => void;
}

type OpsSubTab = 'comms_ground' | 'timeline' | 'validation' | 'fidelity';

export function SpaceOpsSystemsPanel({
  lang,
  orbit,
  commsSys,
  adcsSys,
  rawDataGenMbDay,
  massOk,
  powerOk,
  scienceOk,
  lifetimeOk,
  totalMassKg,
  maxPayloadKg,
  powerGenW,
  netPowerW,
  effectiveScience,
  targetScience,
  selectedStationId,
  onSelectStationId,
  compressionMode,
  onChangeCompression,
  fidelityMode,
  onChangeFidelityMode,
  dutyCycleActive = false,
  storeBufferMb,
  storeTransmittedMb,
  onSyncDownlinkToStore,
  onDecisionEvent,
}: SpaceOpsSystemsPanelProps) {
  const [subTab, setSubTab] = useState<OpsSubTab>('comms_ground');
  const [activePhaseIdx, setActivePhaseIdx] = useState<number>(0);
  const [timelinePlaying, setTimelinePlaying] = useState<boolean>(false);
  const [localBufferMb, setLocalBufferMb] = useState<number>(Math.max(40, Math.round(rawDataGenMbDay * 0.45)));
  const [localReceivedMb, setLocalReceivedMb] = useState<number>(0);
  const [passNotice, setPassNotice] = useState<string>('');
  const [validationRan, setValidationRan] = useState<boolean>(false);

  const station: GroundStationDef =
    GROUND_STATIONS.find((s) => s.id === selectedStationId) || GROUND_STATIONS[0];

  const link = useMemo(
    () =>
      computeCommsLinkBudget({
        orbit,
        commsSys,
        adcsSys,
        station,
        rawDataGenMbDay,
        compression: compressionMode,
        dutyCycleActive,
        fidelityMode,
      }),
    [orbit, commsSys, adcsSys, station, rawDataGenMbDay, compressionMode, dutyCycleActive, fidelityMode]
  );

  const fidelityBundle = useMemo(
    () =>
      computeFidelityAnalysis({
        orbit,
        commsSys,
        totalMassKg,
        powerGenW,
        downlinkMbDay: link.downlinkCapacityMbDay,
      }),
    [orbit, commsSys, totalMassKg, powerGenW, link.downlinkCapacityMbDay]
  );

  const displayBufferMb = typeof storeBufferMb === 'number' ? Math.round(storeBufferMb) : localBufferMb;
  const displayReceivedMb =
    typeof storeTransmittedMb === 'number' ? Math.round(storeTransmittedMb) : localReceivedMb;

  useEffect(() => {
    setLocalBufferMb((prev) => Math.max(prev, Math.max(30, link.bufferBacklogMbDay + 65)));
  }, [orbit.id, rawDataGenMbDay, link.bufferBacklogMbDay]);

  useEffect(() => {
    if (!timelinePlaying) return;
    if (activePhaseIdx >= MISSION_TIMELINE_PHASES.length - 1) {
      setTimelinePlaying(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setActivePhaseIdx((idx) => Math.min(MISSION_TIMELINE_PHASES.length - 1, idx + 1));
    }, 950);
    return () => window.clearTimeout(timer);
  }, [timelinePlaying, activePhaseIdx]);

  const handleFlushPass = () => {
    if (!link.bandSupportedByStation || link.signalStrengthPct < 15) {
      setPassNotice(
        lang === 'ar'
          ? `فشل الإرسال: محطة ${station.name.ar} لا تدعم ${link.band} أو الإشارة منقطعة!`
          : `Pass Failed: ${station.name.en} cannot lock ${link.band} or SNR is too weak!`
      );
      onDecisionEvent?.(
        'comms',
        `انقطاع بث ${link.band} مع محطة ${station.name.ar}`,
        `${link.band} link dropped at ${station.name.en}`
      );
      return;
    }
    const maxTransferPerPass = Math.max(35, Math.round(link.downlinkCapacityMbDay * 0.65));
    const availableToSend = Math.max(link.generatedDataMbDay, displayBufferMb);
    const delivered = Math.min(availableToSend, maxTransferPerPass);
    const remainingQueue = Math.max(0, availableToSend - delivered);
    setLocalBufferMb(remainingQueue);
    setLocalReceivedMb((prev) => prev + delivered);
    onSyncDownlinkToStore?.(delivered, {
      stationId: station.id,
      signalPct: link.signalStrengthPct,
      dataRateKbps: link.effectiveDataRateKbps,
      windowHrs: link.commWindowHoursDay,
    });
    setPassNotice(
      lang === 'ar'
        ? `تم بث ${delivered} MB إلى ${station.name.ar} بسرعة ${link.effectiveDataRateKbps} kbps (مزامنة حية مع 3D)`
        : `Downlinked ${delivered} MB to ${station.name.en} at ${link.effectiveDataRateKbps} kbps (Synced to 3D)`
    );
    onDecisionEvent?.(
      'comms',
      `بث ${delivered} MB إلى ${station.name.ar} (${link.signalStrengthPct}% إشارة)`,
      `Downlinked ${delivered} MB to ${station.name.en} (${link.signalStrengthPct}% signal)`
    );
  };

  const phaseStatuses = useMemo(() => {
    const commsPass = link.bottleneckStatus === 'nominal' || link.bottleneckStatus === 'tight';
    return {
      launch: massOk,
      orbit_insertion: massOk && (adcsSys.id === 'adcs_star' || orbit.deltaVReq < 15.5),
      cruise: powerOk,
      landing: lifetimeOk && massOk,
      science_ops: scienceOk && powerOk,
      data_tx: commsPass,
    };
  }, [massOk, adcsSys.id, orbit.deltaVReq, powerOk, lifetimeOk, scienceOk, link.bottleneckStatus]);

  const nearestBenchmark = useMemo(() => {
    return (
      GMAT_VALIDATION_BENCHMARKS.find((b) => b.orbitId === orbit.id) ||
      GMAT_VALIDATION_BENCHMARKS.reduce((best, curr) =>
        Math.abs(curr.novaDeltaVKms - orbit.deltaVReq) < Math.abs(best.novaDeltaVKms - orbit.deltaVReq)
          ? curr
          : best
      )
    );
  }, [orbit.id, orbit.deltaVReq]);

  const meanModelAccuracyPct = useMemo(() => {
    const avgErr =
      GMAT_VALIDATION_BENCHMARKS.reduce((sum, b) => {
        const dvErr = Math.abs(b.novaDeltaVKms - b.gmatDeltaVKms) / b.gmatDeltaVKms;
        return sum + dvErr;
      }, 0) / GMAT_VALIDATION_BENCHMARKS.length;
    return Number(((1 - avgErr) * 100).toFixed(2));
  }, []);

  const currentPhase = MISSION_TIMELINE_PHASES[activePhaseIdx] || MISSION_TIMELINE_PHASES[0];

  return (
    <div className="space-y-4">
      {/* Top Analysis Fidelity Switcher & Sub-Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSubTab('comms_ground')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold whitespace-nowrap transition ${
              subTab === 'comms_ground'
                ? 'bg-cyan-400 text-slate-950'
                : 'border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.07]'
            }`}
          >
            <Radio className="h-3.5 w-3.5" />
            <span>
              {lang === 'ar' ? 'الاتصالات والمحطات (DSN)' : 'Comms & Ground Stations'}
            </span>
          </button>

          <button
            onClick={() => setSubTab('timeline')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold whitespace-nowrap transition ${
              subTab === 'timeline'
                ? 'bg-amber-400 text-slate-950'
                : 'border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.07]'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>{lang === 'ar' ? 'الجدول الزمني (6 مراحل)' : 'Mission Timeline (6)'}</span>
          </button>

          <button
            onClick={() => setSubTab('fidelity')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold whitespace-nowrap transition ${
              subTab === 'fidelity'
                ? 'bg-violet-400 text-slate-950'
                : 'border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.07]'
            }`}
          >
            <Cpu className="h-3.5 w-3.5" />
            <span>
              {lang === 'ar' ? 'التحليل الدقيق vs التقريب' : 'High-Fidelity vs Approx'}
            </span>
          </button>

          <button
            onClick={() => setSubTab('validation')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold whitespace-nowrap transition ${
              subTab === 'validation'
                ? 'bg-emerald-400 text-slate-950'
                : 'border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.07]'
            }`}
          >
            <FlaskConical className="h-3.5 w-3.5" />
            <span>{lang === 'ar' ? 'التحقق العلمي (GMAT)' : 'GMAT Validation'}</span>
          </button>
        </div>

        {/* Live Fidelity Engine Switcher (Affects both 2D & 3D!) */}
        <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-black/40 p-1">
          <button
            onClick={() => {
              onChangeFidelityMode('approximation');
              onDecisionEvent?.(
                'fidelity',
                'تفعيل وضع التقريب الهندسي السريع (Engineering Approximation)',
                'Switched solver to Engineering Approximation'
              );
            }}
            className={`rounded-md px-2.5 py-1 text-[11px] font-bold whitespace-nowrap transition ${
              fidelityMode === 'approximation'
                ? 'bg-amber-400 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            {lang === 'ar' ? 'التقريب الهندسي' : 'Engineering Approx'}
          </button>
          <button
            onClick={() => {
              onChangeFidelityMode('high_fidelity');
              onDecisionEvent?.(
                'fidelity',
                'تفعيل وضع التحليل عالي الدقة (High-Fidelity Mission Analysis)',
                'Switched solver to High-Fidelity Mission Analysis'
              );
            }}
            className={`rounded-md px-2.5 py-1 text-[11px] font-bold whitespace-nowrap transition ${
              fidelityMode === 'high_fidelity'
                ? 'bg-violet-400 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            {lang === 'ar' ? 'التحليل عالي الدقة' : 'High-Fidelity'}
          </button>
        </div>
      </div>

      {/* =========================================================
          PANEL A: COMMUNICATION SYSTEM + GROUND SEGMENT
      ========================================================= */}
      {subTab === 'comms_ground' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 font-mono tabular-nums lg:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-[#0b111d] p-3">
              <div className="text-[10px] tracking-wider text-slate-400 uppercase">
                {lang === 'ar' ? 'سرعة البث الفعلي (DATA RATE)' : 'EFFECTIVE DATA RATE'}
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-cyan-300">
                  {link.effectiveDataRateKbps}
                </span>
                <span className="text-xs text-slate-400">kbps</span>
              </div>
              <div className="mt-1 text-[10px] text-slate-400">
                PEAK {link.peakDataRateKbps} kbps · {link.band}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#0b111d] p-3">
              <div className="text-[10px] tracking-wider text-slate-400 uppercase">
                {lang === 'ar' ? 'قوة الإشارة (SIGNAL / SNR)' : 'SIGNAL STRENGTH'}
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span
                  className={`text-2xl font-bold ${
                    link.signalStrengthPct >= 55
                      ? 'text-emerald-300'
                      : link.signalStrengthPct >= 25
                        ? 'text-amber-300'
                        : 'text-rose-400'
                  }`}
                >
                  {link.signalStrengthPct}%
                </span>
                <span className="text-xs text-slate-400">
                  {link.snrDb >= 0 ? `+${link.snrDb}` : link.snrDb} dB
                </span>
              </div>
              <div className="mt-1 text-[10px] text-slate-400">
                {link.distanceAu} AU · FSPL {fidelityBundle.freeSpacePathLossDb} dB
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#0b111d] p-3">
              <div className="text-[10px] tracking-wider text-slate-400 uppercase">
                {lang === 'ar' ? 'نافذة الاتصال (COMM WINDOW)' : 'COMM WINDOW'}
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-amber-300">{link.commWindowHoursDay}</span>
                <span className="text-xs text-slate-400">hrs/day</span>
              </div>
              <div className="mt-1 text-[10px] text-slate-400">
                {station.weatherStatus === 'rain_fade'
                  ? lang === 'ar'
                    ? '▲ تشويش أمطار (-38% Ka)'
                    : '▲ Rain Fade Active'
                  : lang === 'ar'
                    ? '● سماء صافية بالمحطة'
                    : '● Clear Sky Window'}
              </div>
            </div>

            <div
              className={`rounded-xl border p-3 ${
                link.bottleneckStatus === 'nominal'
                  ? 'border-emerald-400/35 bg-emerald-500/[0.06]'
                  : link.bottleneckStatus === 'tight'
                    ? 'border-amber-400/40 bg-amber-500/[0.08]'
                    : 'border-rose-400/50 bg-rose-500/10'
              }`}
            >
              <div className="text-[10px] tracking-wider text-slate-300 uppercase">
                {lang === 'ar' ? 'إنتاج vs إرسال البيانات' : 'PRODUCED VS DOWNLINK'}
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-xl font-bold text-white">{link.generatedDataMbDay}</span>
                <span className="text-xs text-slate-400">/ {link.downlinkCapacityMbDay} MB/d</span>
              </div>
              <div
                className={`mt-1 text-[10px] font-bold ${
                  link.bufferBacklogMbDay > 0 || !link.bandSupportedByStation
                    ? 'text-rose-300'
                    : 'text-emerald-300'
                }`}
              >
                {!link.bandSupportedByStation
                  ? lang === 'ar'
                    ? `✖ المحطة لا تدعم ${link.band}`
                    : `✖ Station lacks ${link.band}`
                  : link.bufferBacklogMbDay > 0
                    ? lang === 'ar'
                      ? `✖ تكدس +${link.bufferBacklogMbDay} MB/يوم (-${link.dataLossPct}% فقد)`
                      : `✖ Overflow +${link.bufferBacklogMbDay} MB/d (-${link.dataLossPct}% loss)`
                    : lang === 'ar'
                      ? '● البث يستوعب كامل الأجهزة'
                      : '● Zero Data Overflow'}
              </div>
            </div>
          </div>

          {(link.bufferBacklogMbDay > 0 ||
            !link.bandSupportedByStation ||
            station.weatherStatus === 'rain_fade') && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-xs">
              <div className="flex items-start gap-2.5">
                {link.bandSupportedByStation ? (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                ) : (
                  <WifiOff className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                )}
                <div>
                  <div className="font-bold text-white">
                    {!link.bandSupportedByStation
                      ? lang === 'ar'
                        ? `عدم توافق النطاق: محطة ${station.name.ar} لا تستقبل ${link.band}!`
                        : `Band Mismatch: ${station.name.en} does not support ${link.band}!`
                      : link.bufferBacklogMbDay > 0
                        ? lang === 'ar'
                          ? `اختناق بيانات حقيقي: أجهزتك تنتج ${link.generatedDataMbDay} MB/day بينما رابط الفضاء ينقل ${link.downlinkCapacityMbDay} MB/day فقط!`
                          : `Active Data Bottleneck: Instruments produce ${link.generatedDataMbDay} MB/day vs ${link.downlinkCapacityMbDay} MB/day link capacity!`
                        : lang === 'ar'
                          ? 'تحذير طقس بالمحطة: أمطار مدريد تخفّض بث Ka-Band بنسبة 38% — بدّل إلى Goldstone أو Canberra!'
                          : 'Ground Weather Alert: Madrid Rain Fade degrades Ka-Band by 38% — hand over to Goldstone or Canberra!'}
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-300">
                    {lang === 'ar'
                      ? 'أي تغيير بالمحطة أو الضغط هنا ينعكس فوراً على سرعة بث المركبة في العالم 3D.'
                      : 'Any station handoff or compression change here updates live 3D spacecraft downlink.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  onSelectStationId('dsn_goldstone');
                  onDecisionEvent?.(
                    'comms',
                    'تسليم الاتصال إلى محطة Goldstone 70m',
                    'Handed off downlink to Goldstone 70m'
                  );
                }}
                className="rounded-lg bg-amber-400 px-3.5 py-2 text-[11px] font-bold text-slate-950 whitespace-nowrap hover:brightness-110"
              >
                {lang === 'ar' ? 'تسليم إلى Goldstone 70m' : 'Handoff to Goldstone 70m'}
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="space-y-3 rounded-xl border border-white/10 bg-[#0b111d] p-4 lg:col-span-7">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
                  <Satellite className="h-4 w-4" />
                  <span>
                    {lang === 'ar'
                      ? 'شبكة المحطات الأرضية وتتبع الإشارة (Ground Segment)'
                      : 'Global Ground Segment Network & Pass Tracking'}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-slate-400 tabular-nums">
                  {GROUND_STATIONS.length} STATIONS ONLINE
                </span>
              </div>

              <svg
                viewBox="0 0 400 185"
                className="w-full rounded-lg border border-white/10 bg-[#050912]"
                aria-label="Ground stations world telemetry map"
              >
                {[37, 74, 111, 148].map((y) => (
                  <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="rgba(56,189,248,0.08)" strokeWidth="1" />
                ))}
                {[80, 160, 240, 320].map((x) => (
                  <line key={x} x1={x} y1="0" x2={x} y2="185" stroke="rgba(56,189,248,0.08)" strokeWidth="1" />
                ))}
                <line x1="0" y1="92" x2="400" y2="92" stroke="rgba(245,158,11,0.22)" strokeDasharray="4 4" />

                <path
                  d="M38,42 L106,36 L114,68 L84,84 L62,76 Z M94,95 L126,102 L116,152 L92,158 L84,120 Z M172,38 L224,34 L234,62 L182,68 Z M184,74 L228,74 L238,114 L208,148 L184,116 Z M234,34 L348,38 L354,88 L286,98 L242,74 Z M312,118 L362,120 L356,154 L318,148 Z"
                  fill="rgba(30,41,59,0.72)"
                  stroke="rgba(148,163,184,0.25)"
                  strokeWidth="1"
                />

                <path d="M 30 22 Q 200 142 370 28" fill="none" stroke="rgba(34,211,238,0.25)" strokeDasharray="3 3" />
                <line
                  x1={(station.mapX / 100) * 400}
                  y1={(station.mapY / 100) * 185}
                  x2="200"
                  y2="82"
                  stroke={
                    !link.bandSupportedByStation
                      ? '#fb7185'
                      : station.weatherStatus === 'rain_fade'
                        ? '#fbbf24'
                        : '#34d399'
                  }
                  strokeWidth="1.8"
                  strokeDasharray="4 2"
                />
                <rect x="194" y="76" width="12" height="12" rx="2" fill="#06b6d4" stroke="#f8fafc" strokeWidth="1.2" />
                <text x="210" y="85" fill="#67e8f9" fontSize="8" fontFamily="monospace">
                  NOVA ({link.band})
                </text>

                {GROUND_STATIONS.map((gs) => {
                  const cx = (gs.mapX / 100) * 400;
                  const cy = (gs.mapY / 100) * 185;
                  const active = gs.id === station.id;
                  const okColor = gs.weatherStatus === 'rain_fade' ? '#f59e0b' : active ? '#34d399' : '#38bdf8';
                  return (
                    <g
                      key={gs.id}
                      className="cursor-pointer"
                      onClick={() => {
                        onSelectStationId(gs.id);
                        onDecisionEvent?.(
                          'comms',
                          `تحويل المحطة الأرضية إلى ${gs.name.ar}`,
                          `Switched Ground Station to ${gs.name.en}`
                        );
                      }}
                    >
                      {active && (
                        <circle cx={cx} cy={cy} r="10" fill="none" stroke="#34d399" strokeWidth="1.2" strokeDasharray="2 2" />
                      )}
                      <circle cx={cx} cy={cy} r={active ? 5 : 4} fill={okColor} stroke="#04070e" strokeWidth="1.2" />
                      <text
                        x={cx + 7}
                        y={cy + 3}
                        fill={active ? '#ffffff' : '#94a3b8'}
                        fontSize="7.5"
                        fontFamily="monospace"
                      >
                        {gs.dishMeters}m
                      </text>
                    </g>
                  );
                })}
              </svg>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {GROUND_STATIONS.map((gs) => {
                  const active = gs.id === station.id;
                  const supports = gs.supportedBands.includes(link.band);
                  return (
                    <button
                      key={gs.id}
                      onClick={() => {
                        onSelectStationId(gs.id);
                        onDecisionEvent?.(
                          'comms',
                          `تحويل المحطة الأرضية إلى ${gs.name.ar}`,
                          `Switched Ground Station to ${gs.name.en}`
                        );
                      }}
                      className={`rounded-lg border p-2.5 text-start transition ${
                        active
                          ? 'border-cyan-400 bg-cyan-500/15 text-white'
                          : 'border-white/10 bg-white/[0.02] text-slate-300 hover:border-white/25'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-xs font-bold">
                        <span>{gs.name[lang]}</span>
                        <span className="font-mono text-[10px] text-cyan-300 tabular-nums">
                          {gs.dishMeters}m
                        </span>
                      </div>
                      <div className="mt-0.5 font-mono text-[10px] text-slate-400 tabular-nums">
                        {gs.network} · {gs.supportedBands.join('/')} · +{gs.gainBoostDb} dB
                      </div>
                      <div className="mt-1 text-[10px]">
                        {!supports ? (
                          <span className="font-bold text-rose-400">
                            {lang === 'ar' ? `✖ لا يدعم ${link.band}` : `✖ No ${link.band}`}
                          </span>
                        ) : gs.weatherStatus === 'rain_fade' ? (
                          <span className="font-bold text-amber-300">
                            {lang === 'ar' ? '▲ تشويش مطري (-38% Ka)' : '▲ Rain Fade (-38% Ka)'}
                          </span>
                        ) : (
                          <span className="text-emerald-300">
                            {lang === 'ar' ? '● جاهز للاستقبال' : '● Clear Nominal Pass'}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col justify-between gap-3 rounded-xl border border-white/10 bg-[#0b111d] p-4 lg:col-span-5">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                  <Signal className="h-4 w-4" />
                  <span>
                    {lang === 'ar'
                      ? 'إدارة ذاكرة المركبة 3D وضغط البيانات'
                      : '3D-Synced SSR Buffer & Downlink Control'}
                  </span>
                </div>

                <div>
                  <div className="mb-1.5 text-[11px] font-semibold text-slate-300">
                    {lang === 'ar' ? 'استراتيجية ضغط وحزم البيانات:' : 'Onboard Data Compression Strategy:'}
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {[
                      {
                        id: 'raw' as CompressionMode,
                        ar: 'خام غير مضغوط (100% حجم · أقصى دقة)',
                        en: 'Raw Telemetry (100% volume · full fidelity)',
                      },
                      {
                        id: 'lossless_ccsds' as CompressionMode,
                        ar: 'ضغط CCSDS قياسي (-18% حجم بيانات بدون فقد)',
                        en: 'CCSDS Lossless (-18% data volume · zero loss)',
                      },
                      {
                        id: 'priority_crop' as CompressionMode,
                        ar: 'فرز ذكي بالمركبة (-32% حجم البيانات المرسلة)',
                        en: 'Priority Science Trim (-32% queued volume)',
                      },
                    ].map((cm) => (
                      <button
                        key={cm.id}
                        onClick={() => {
                          onChangeCompression(cm.id);
                          onDecisionEvent?.(
                            'comms',
                            `تغيير ضغط البيانات إلى ${cm.id}`,
                            `Set compression mode to ${cm.id}`
                          );
                        }}
                        className={`rounded-lg border px-3 py-2 text-start text-[11px] font-semibold transition ${
                          compressionMode === cm.id
                            ? 'border-emerald-400 bg-emerald-500/15 text-white'
                            : 'border-white/10 bg-white/[0.02] text-slate-300 hover:border-white/25'
                        }`}
                      >
                        {lang === 'ar' ? cm.ar : cm.en}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 rounded-lg border border-white/10 bg-black/35 p-3 font-mono tabular-nums">
                  <div>
                    <div className="text-[10px] text-slate-400">
                      {lang === 'ar' ? 'طابور الذاكرة المؤقتة' : 'ONBOARD BUFFER'}
                    </div>
                    <div
                      className={`text-lg font-bold ${
                        displayBufferMb > 320 ? 'text-rose-400' : 'text-amber-300'
                      }`}
                    >
                      {displayBufferMb} MB
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">
                      {lang === 'ar' ? 'مستلم بالمحطة الأرضية' : 'EARTH RECEIVED'}
                    </div>
                    <div className="text-lg font-bold text-emerald-300">{displayReceivedMb} MB</div>
                  </div>
                </div>

                <p className="text-[11px] leading-relaxed text-slate-300">{station.specialty[lang]}</p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleFlushPass}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-400 px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:brightness-110"
                >
                  <Activity className="h-4 w-4" />
                  <span>
                    {lang === 'ar'
                      ? 'بدء تمريرة اتصال وتفريغ البيانات للأرض (3D)'
                      : 'Execute Ground Pass & Sync to 3D'}
                  </span>
                </button>
                {passNotice && (
                  <div className="rounded-lg border border-white/10 bg-black/45 px-3 py-2 font-mono text-[11px] text-cyan-200">
                    {passNotice}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          PANEL B: 6-STAGE MISSION TIMELINE
      ========================================================= */}
      {subTab === 'timeline' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-xs font-bold text-amber-300">
                {lang === 'ar'
                  ? 'الجدول الزمني الكامل للمهمة (من الإطلاق حتى استقبال البيانات)'
                  : 'End-to-End Mission Operations Timeline'}
              </div>
              <p className="text-[11px] text-slate-400">
                {lang === 'ar'
                  ? 'اضغط على أي مرحلة لفحص حالة المركبة عندها أو شغّل التسلسل الآلي.'
                  : 'Inspect telemetry across every flight phase or run the full automated sequence.'}
              </p>
            </div>
            <button
              onClick={() => {
                setActivePhaseIdx(0);
                setTimelinePlaying(true);
                onDecisionEvent?.(
                  'timeline',
                  'تشغيل الجدول الزمني 6 مراحل (إطلاق ← بث بيانات)',
                  'Started 6-phase mission timeline sequence'
                );
              }}
              className="flex items-center gap-1.5 rounded-lg bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950 hover:brightness-110"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>{lang === 'ar' ? 'تشغيل التسلسل 1 ← 6' : 'Play Sequence 1 → 6'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {MISSION_TIMELINE_PHASES.map((ph, idx) => {
              const selected = idx === activePhaseIdx;
              const pass = phaseStatuses[ph.id];
              return (
                <button
                  key={ph.id}
                  onClick={() => {
                    setTimelinePlaying(false);
                    setActivePhaseIdx(idx);
                  }}
                  className={`rounded-xl border p-3 text-start transition ${
                    selected
                      ? 'border-cyan-400 bg-cyan-500/15 text-white'
                      : pass
                        ? 'border-white/10 bg-[#0b111d] text-slate-200 hover:border-white/25'
                        : 'border-rose-400/40 bg-rose-500/10 text-rose-100 hover:border-rose-400'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono text-[10px] text-slate-400 tabular-nums">
                    <span>{ph.code}</span>
                    <span className={pass ? 'text-emerald-300 font-bold' : 'text-rose-400 font-bold'}>
                      {pass ? 'PASS' : 'RISK'}
                    </span>
                  </div>
                  <div className="mt-1 text-xs font-bold">{ph.title[lang]}</div>
                  <div className="mt-1 font-mono text-[10px] text-cyan-300 tabular-nums">
                    {ph.metLabel}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-4 rounded-xl border border-white/10 bg-[#0b111d] p-4 md:grid-cols-12">
            <div className="space-y-2 md:col-span-7">
              <div className="font-mono text-[11px] text-amber-300 tabular-nums">
                {currentPhase.code} · {currentPhase.metLabel}
              </div>
              <h3 className="text-base font-bold text-white">{currentPhase.title[lang]}</h3>
              <p className="text-xs leading-relaxed text-slate-300">{currentPhase.objective[lang]}</p>
              <div className="flex items-center gap-2 pt-1 text-xs">
                {phaseStatuses[currentPhase.id] ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-rose-400" />
                )}
                <span
                  className={`font-bold ${
                    phaseStatuses[currentPhase.id] ? 'text-emerald-300' : 'text-rose-300'
                  }`}
                >
                  {currentPhase.criticalCheck[lang]}:{' '}
                  {phaseStatuses[currentPhase.id]
                    ? lang === 'ar'
                      ? 'متوافق تماماً'
                      : 'NOMINAL PASS'
                    : lang === 'ar'
                      ? 'تحذير فشل في هذه المرحلة!'
                      : 'CONSTRAINT VIOLATION'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 font-mono text-xs tabular-nums md:col-span-5">
              <div className="rounded-lg border border-white/10 bg-black/40 p-2.5">
                <div className="text-[10px] text-slate-400">LAUNCH MASS</div>
                <div className={`font-bold ${massOk ? 'text-emerald-300' : 'text-rose-400'}`}>
                  {totalMassKg} / {maxPayloadKg} kg
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/40 p-2.5">
                <div className="text-[10px] text-slate-400">ORBIT Δv / POWER</div>
                <div className={`font-bold ${powerOk ? 'text-cyan-300' : 'text-rose-400'}`}>
                  {orbit.deltaVReq} km/s · {netPowerW >= 0 ? `+${netPowerW}` : netPowerW}W
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/40 p-2.5">
                <div className="text-[10px] text-slate-400">SCIENCE OPS</div>
                <div className={`font-bold ${scienceOk ? 'text-emerald-300' : 'text-amber-300'}`}>
                  {effectiveScience} / {targetScience} PTS
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/40 p-2.5">
                <div className="text-[10px] text-slate-400">DATA TX WINDOW</div>
                <div
                  className={`font-bold ${
                    link.bottleneckStatus === 'nominal' ? 'text-emerald-300' : 'text-rose-300'
                  }`}
                >
                  {link.downlinkCapacityMbDay} MB/d ({link.commWindowHoursDay}h)
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          PANEL C: HIGH-FIDELITY MISSION ANALYSIS VS ENGINEERING APPROXIMATION
      ========================================================= */}
      {subTab === 'fidelity' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <button
              onClick={() => {
                onChangeFidelityMode('approximation');
                onDecisionEvent?.(
                  'fidelity',
                  'تفعيل وضع التقريب الهندسي السريع',
                  'Activated Engineering Approximation Mode'
                );
              }}
              className={`rounded-xl border p-4 text-start transition ${
                fidelityMode === 'approximation'
                  ? 'border-amber-400 bg-amber-500/15 text-white'
                  : 'border-white/10 bg-[#0b111d] text-slate-300 hover:border-white/25'
              }`}
            >
              <div className="flex items-center justify-between font-mono text-[10px]">
                <span className="text-amber-300 font-bold">FAST SOLVER</span>
                <span className="text-slate-400">±1% – 5%</span>
              </div>
              <div className="mt-1 text-sm font-bold">
                {lang === 'ar'
                  ? 'التقريب الهندسي (Engineering Approximation)'
                  : 'Engineering Approximation Mode'}
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
                {lang === 'ar'
                  ? 'يستخدم معادلات مدارية وطاقة مُبسّطة (Patched Conics + معامل شمس خطي) لاستكشاف المقايضات بسرعة وبوضوح تعليمي.'
                  : 'Uses streamlined patched-conic Δv, solar flux floors, and mean link attenuation for fast conceptual design trade-offs.'}
              </p>
            </button>

            <button
              onClick={() => {
                onChangeFidelityMode('high_fidelity');
                onDecisionEvent?.(
                  'fidelity',
                  'تفعيل التحليل عالي الدقة High-Fidelity',
                  'Activated High-Fidelity Mission Analysis'
                );
              }}
              className={`rounded-xl border p-4 text-start transition ${
                fidelityMode === 'high_fidelity'
                  ? 'border-violet-400 bg-violet-500/15 text-white'
                  : 'border-white/10 bg-[#0b111d] text-slate-300 hover:border-white/25'
              }`}
            >
              <div className="flex items-center justify-between font-mono text-[10px]">
                <span className="text-violet-300 font-bold">STRICT PHYSICS</span>
                <span className="text-slate-400">TSIOLKOVSKY + FRIIS + RADIATION</span>
              </div>
              <div className="mt-1 text-sm font-bold">
                {lang === 'ar'
                  ? 'تحليل المهمة عالي الدقة (High-Fidelity Mission Analysis)'
                  : 'High-Fidelity Mission Analysis Mode'}
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
                {lang === 'ar'
                  ? 'يُفعّل معادلة الصاروخ الأسية تسيولكوفسكي، فقد المسار الحر Friis، التوازن الحراري، وتأثير الإشعاع الصارم داخل الـ 2D و 3D معاً!'
                  : 'Applies exponential Tsiolkovsky mass ratios, Friis FSPL, Stefan-Boltzmann thermal load, and tighter link margins across 2D & 3D.'}
              </p>
            </button>
          </div>

          {/* 4 Live Physical Quantities Solved for Current Orbit */}
          <div className="grid grid-cols-2 gap-3 font-mono tabular-nums lg:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-[#0b111d] p-3">
              <div className="text-[10px] text-slate-400">VIS-VIVA VELOCITY</div>
              <div className="mt-1 text-xl font-bold text-cyan-300">
                {fidelityBundle.orbitalVelocityKms} <span className="text-xs text-slate-400">km/s</span>
              </div>
              <div className="mt-0.5 text-[10px] text-slate-400">v = √(μ / r)</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#0b111d] p-3">
              <div className="text-[10px] text-slate-400">ROCKET MASS RATIO</div>
              <div className="mt-1 text-xl font-bold text-amber-300">
                {fidelityBundle.tsiolkovskyMassRatio}×
              </div>
              <div className="mt-0.5 text-[10px] text-slate-400">m₀ / mf = exp(Δv / Isp·g₀)</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#0b111d] p-3">
              <div className="text-[10px] text-slate-400">FRIIS PATH LOSS</div>
              <div className="mt-1 text-xl font-bold text-violet-300">
                {fidelityBundle.freeSpacePathLossDb} <span className="text-xs text-slate-400">dB</span>
              </div>
              <div className="mt-0.5 text-[10px] text-slate-400">{link.band} @ {link.distanceAu} AU</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#0b111d] p-3">
              <div className="text-[10px] text-slate-400">EQUILIBRIUM TEMP / DOSE</div>
              <div className="mt-1 text-xl font-bold text-emerald-300">
                {fidelityBundle.equilibriumTempK} K
              </div>
              <div className="mt-0.5 text-[10px] text-slate-400">
                {fidelityBundle.radiationDoseKradYr} krad/yr
              </div>
            </div>
          </div>

          {/* Comparison Table: Engineering Approximation vs High-Fidelity */}
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#0b111d]">
            <table className="w-full text-start font-mono text-[11px] tabular-nums">
              <thead className="border-b border-white/10 bg-black/50 text-[10px] text-slate-400">
                <tr>
                  <th className="px-3 py-2.5 text-start">{lang === 'ar' ? 'المعامل الفيزيائي' : 'PARAMETER'}</th>
                  <th className="px-3 py-2.5 text-start">{lang === 'ar' ? 'التقريب الهندسي' : 'APPROXIMATION'}</th>
                  <th className="px-3 py-2.5 text-start">{lang === 'ar' ? 'التحليل عالي الدقة' : 'HIGH-FIDELITY'}</th>
                  <th className="px-3 py-2.5 text-start">{lang === 'ar' ? 'الفرق' : 'VARIANCE'}</th>
                  <th className="px-3 py-2.5 text-start">{lang === 'ar' ? 'المعادلة والأثر' : 'EQUATION & IMPACT'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {fidelityBundle.rows.map((row) => (
                  <tr key={row.id} className="hover:bg-white/[0.02]">
                    <td className="px-3 py-2.5 font-sans font-bold text-white">{row.metric[lang]}</td>
                    <td className="px-3 py-2.5 text-amber-300">{row.approxValue}</td>
                    <td className="px-3 py-2.5 font-bold text-violet-300">{row.highFidelityValue}</td>
                    <td className="px-3 py-2.5 text-cyan-300">±{row.variancePct}</td>
                    <td className="px-3 py-2.5 font-sans text-slate-300">
                      <span className="font-mono text-[10px] text-emerald-300">{row.equation}</span>
                      {' · '}
                      {row.impactNote[lang]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================
          PANEL D: SCIENTIFIC VALIDATION VS NASA GMAT
      ========================================================= */}
      {subTab === 'validation' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-400/30 bg-emerald-500/[0.06] p-3.5">
            <div>
              <div className="text-xs font-bold text-emerald-300">
                {lang === 'ar'
                  ? 'التحقق العلمي ومقارنة معادلات اللعبة مع سيناريوهات NASA GMAT'
                  : 'Scientific Validation Against Published NASA GMAT Benchmarks'}
              </div>
              <p className="mt-0.5 text-[11px] text-slate-300">
                {lang === 'ar'
                  ? `متوسط التطابق الرياضي عبر 5 مدارات مرجعية: ${meanModelAccuracyPct}% (مع توضيح نسبة التقريب والافتراضات بالأسفل).`
                  : `Mean Δv model fidelity across 5 reference missions: ${meanModelAccuracyPct}% (explicit engineering approximations documented below).`}
              </p>
            </div>
            <button
              onClick={() => {
                setValidationRan(true);
                onDecisionEvent?.(
                  'validation',
                  `تشغيل التحقق العلمي أمام ${nearestBenchmark.missionReference}`,
                  `Ran GMAT validation against ${nearestBenchmark.missionReference}`
                );
              }}
              className="rounded-lg bg-emerald-400 px-4 py-2 text-xs font-bold text-slate-950 whitespace-nowrap hover:brightness-110"
            >
              {lang === 'ar' ? 'اختبار دقة مداري الآن' : 'Validate Current Orbit vs GMAT'}
            </button>
          </div>

          {validationRan && (
            <div className="rounded-xl border border-cyan-400/35 bg-[#0b111d] p-3.5 font-mono text-xs tabular-nums">
              <div className="font-bold text-cyan-300">
                {lang === 'ar'
                  ? `نتيجة اختبار التطابق: ${nearestBenchmark.missionReference}`
                  : `ACTIVE VALIDATION MATCH: ${nearestBenchmark.missionReference}`}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <div className="text-[10px] text-slate-400">Δv ERROR RATIO</div>
                  <div className="text-base font-bold text-emerald-300">
                    ±
                    {(
                      (Math.abs(orbit.deltaVReq - nearestBenchmark.gmatDeltaVKms) /
                        nearestBenchmark.gmatDeltaVKms) *
                      100
                    ).toFixed(2)}
                    %
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">SOLAR FLUX DELTA</div>
                  <div className="text-base font-bold text-cyan-300">
                    ±
                    {Math.abs(orbit.solarEfficiency * 100 - nearestBenchmark.gmatSolarPct).toFixed(
                      1
                    )}
                    %
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">MASS RATIO DELTA</div>
                  <div className="text-base font-bold text-amber-300">
                    ±
                    {(
                      Math.abs(orbit.massPenaltyFactor - nearestBenchmark.gmatPayloadFactor) * 100
                    ).toFixed(1)}
                    %
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">OVERALL GRADE</div>
                  <div className="text-base font-bold text-emerald-300">VERIFIED PROXY</div>
                </div>
              </div>
            </div>
          )}

          <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#0b111d]">
            <table className="w-full text-start font-mono text-[11px] tabular-nums">
              <thead className="border-b border-white/10 bg-black/50 text-[10px] text-slate-400">
                <tr>
                  <th className="px-3 py-2.5 text-start">{lang === 'ar' ? 'المرجع GMAT' : 'GMAT REFERENCE'}</th>
                  <th className="px-3 py-2.5 text-start">GMAT Δv</th>
                  <th className="px-3 py-2.5 text-start">NOVA Δv</th>
                  <th className="px-3 py-2.5 text-start">{lang === 'ar' ? 'نسبة الخطأ Δv' : 'Δv ERROR'}</th>
                  <th className="px-3 py-2.5 text-start">SOLAR (GMAT vs NOVA)</th>
                  <th className="px-3 py-2.5 text-start">{lang === 'ar' ? 'ملاحظة التقريب' : 'APPROXIMATION NOTE'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {GMAT_VALIDATION_BENCHMARKS.map((b) => {
                  const errPct = ((Math.abs(b.novaDeltaVKms - b.gmatDeltaVKms) / b.gmatDeltaVKms) * 100).toFixed(2);
                  const isCurrent = b.orbitId === orbit.id;
                  return (
                    <tr key={b.id} className={isCurrent ? 'bg-cyan-500/10' : 'hover:bg-white/[0.02]'}>
                      <td className="px-3 py-2 font-sans font-bold text-white">
                        {b.missionReference}
                      </td>
                      <td className="px-3 py-2 text-slate-300">{b.gmatDeltaVKms.toFixed(2)} km/s</td>
                      <td className="px-3 py-2 text-cyan-300">{b.novaDeltaVKms.toFixed(2)} km/s</td>
                      <td className="px-3 py-2 font-bold text-emerald-300">±{errPct}%</td>
                      <td className="px-3 py-2 text-amber-200">
                        {b.gmatSolarPct}% vs {b.novaSolarPct}%
                      </td>
                      <td className="px-3 py-2 font-sans text-slate-300">{b.notes[lang]}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {MODELING_ASSUMPTIONS.map((asmp) => (
              <div key={asmp.id} className="rounded-xl border border-white/10 bg-[#0b111d] p-3.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-white">{asmp.title[lang]}</span>
                  <span className="font-mono text-[10px] font-bold text-amber-300 tabular-nums">
                    {asmp.errorBand}
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-300">{asmp.detail[lang]}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
