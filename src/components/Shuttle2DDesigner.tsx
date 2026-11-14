import {
  CheckCircle2,
  Coins,
  Cpu,
  Flame,
  Lock,
  Radio,
  Shield,
  Sparkles,
  Wrench,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { SHIP_LIVERIES, SHIP_PARTS } from '../data/novaData';
import { useGameStore } from '../store/gameStore';
import type { PowerAllocation, ShipPartOption } from '../types/game';
import type { DecisionVisualKind } from './DecisionReactive3DViewport';

interface Shuttle2DDesignerProps {
  onDecisionEvent?: (kind: DecisionVisualKind, labelAr: string, labelEn: string) => void;
}

type SubsystemCategory = ShipPartOption['category'];

interface StressTestDef {
  id: string;
  titleAr: string;
  titleEn: string;
  reqSummaryAr: string;
  reqSummaryEn: string;
  rewardCr: number;
  rewardBudgetM: number;
  hullDmg: number;
}

const STRESS_TESTS: StressTestDef[] = [
  {
    id: 'stress_mercury',
    titleAr: 'اختبار إجهاد 1: وهج عطارد الحراري 0.39 AU',
    titleEn: 'Stress Test 1: Mercury 0.39 AU Thermal Surge',
    reqSummaryAr: 'يتطلب: هامش حراري ≥ 84% + صافي طاقة موجب (+W)',
    reqSummaryEn: 'Requires: Thermal Margin ≥ 84% & Positive Net Power',
    rewardCr: 180,
    rewardBudgetM: 25,
    hullDmg: 14,
  },
  {
    id: 'stress_jupiter',
    titleAr: 'اختبار إجهاد 2: أحزمة إشعاع المشتري (4% شمس)',
    titleEn: 'Stress Test 2: Jovian Radiation Belt (4% Sun)',
    reqSummaryAr: 'يتطلب: درع مستوى 3+ + موثوقية ≥ 88% + توزيع دروع ≥ 36%',
    reqSummaryEn: 'Requires: Hull Tier 3+, Reliability ≥ 88% & Shield Bus ≥ 36%',
    rewardCr: 240,
    rewardBudgetM: 35,
    hullDmg: 18,
  },
  {
    id: 'stress_neptune',
    titleAr: 'اختبار إجهاد 3: عاصفة نبتون الفائقة (30 AU)',
    titleEn: 'Stress Test 3: Neptune 30 AU Kuiper Shear',
    reqSummaryAr: 'يتطلب: محرك مستوى 3+ + اتصال مستوى 2+ + Δv ≥ 7400 + طاقة ≥ +15W',
    reqSummaryEn: 'Requires: Engine Tier 3+, Comms Tier 2+, Δv ≥ 7400 & Net ≥ +15W',
    rewardCr: 340,
    rewardBudgetM: 50,
    hullDmg: 22,
  },
];

export function Shuttle2DDesigner({ onDecisionEvent }: Shuttle2DDesignerProps) {
  const lang = useGameStore((s) => s.lang);
  const shipConfig = useGameStore((s) => s.shipConfig);
  const shipMetrics = useGameStore((s) => s.shipMetrics);
  const resources = useGameStore((s) => s.resources);
  const hullIntegrity = useGameStore((s) => s.hullIntegrity);
  const purchasedPartIds = useGameStore((s) => s.purchasedPartIds);
  const unlockedBudgetBonusM = useGameStore((s) => s.unlockedBudgetBonusM);
  const powerAllocation = useGameStore((s) => s.powerAllocation);
  const shuttleCustomName = useGameStore((s) => s.shuttleCustomName);
  const completedStressTests = useGameStore((s) => s.completedStressTests);

  const buyAndEquipShipPart = useGameStore((s) => s.buyAndEquipShipPart);
  const selectLivery = useGameStore((s) => s.selectLivery);
  const setPowerAllocation = useGameStore((s) => s.setPowerAllocation);
  const setShuttleCustomName = useGameStore((s) => s.setShuttleCustomName);
  const investCreditsForBudget = useGameStore((s) => s.investCreditsForBudget);
  const resolveShuttleStressTest = useGameStore((s) => s.resolveShuttleStressTest);

  const [activeCat, setActiveCat] = useState<SubsystemCategory>('engine');
  const [stressFeedback, setStressFeedback] = useState<{
    passed: boolean;
    title: string;
    detail: string;
  } | null>(null);

  const activeLivery =
    SHIP_LIVERIES.find((l) => l.id === shipConfig.liveryId) || SHIP_LIVERIES[0];

  const equippedIds: Record<SubsystemCategory, string> = {
    engine: shipConfig.engineId,
    solar: shipConfig.solarId,
    hull: shipConfig.hullId,
    sensor: shipConfig.sensorId,
    comms: shipConfig.commsId,
  };

  const commsPart = SHIP_PARTS.find((p) => p.id === shipConfig.commsId);
  const commsTier = commsPart?.tier ?? 1;

  const categoryLabels: Record<SubsystemCategory, { ar: string; en: string }> = {
    engine: { ar: 'المحرك والدفع', en: 'Propulsion' },
    solar: { ar: 'الطاقة والمفاعل', en: 'Reactor / Solar' },
    hull: { ar: 'الهيكل والدرع', en: 'Hull & Armor' },
    sensor: { ar: 'الحساسات والمدفع', en: 'Sensors & Pulse' },
    comms: { ar: 'هوائي DSN', en: 'DSN Comms' },
  };

  const handleEquipOrBuy = (part: ShipPartOption) => {
    const ok = buyAndEquipShipPart(part.id);
    if (!ok) return;
    const eventKind: DecisionVisualKind =
      part.category === 'hull'
        ? 'repair'
        : part.category === 'solar'
          ? 'power'
          : part.category === 'comms'
            ? 'comms'
            : part.category === 'sensor'
              ? 'science'
              : 'blueprint';
    onDecisionEvent?.(eventKind, `تركيب ${part.name.ar}`, `Equipped ${part.name.en}`);
  };

  const handleSliderChange = (key: keyof PowerAllocation, nextVal: number) => {
    const clamped = Math.max(10, Math.min(80, nextVal));
    const remaining = 100 - clamped;
    const otherKeys = (['engines', 'shields', 'sensors'] as const).filter((k) => k !== key);
    const otherSum = Math.max(1, powerAllocation[otherKeys[0]] + powerAllocation[otherKeys[1]]);
    const firstOther = Math.max(
      10,
      Math.round((powerAllocation[otherKeys[0]] / otherSum) * remaining)
    );
    const secondOther = Math.max(10, 100 - clamped - firstOther);
    const fixedFirst = 100 - clamped - secondOther;

    const nextAlloc: PowerAllocation = {
      ...powerAllocation,
      [key]: clamped,
      [otherKeys[0]]: fixedFirst,
      [otherKeys[1]]: secondOther,
    };
    setPowerAllocation(nextAlloc);
    onDecisionEvent?.(
      key === 'shields' ? 'repair' : key === 'sensors' ? 'science' : 'power',
      `توازن الطاقة ${nextAlloc.engines}/${nextAlloc.shields}/${nextAlloc.sensors}%`,
      `Power Bus ${nextAlloc.engines}/${nextAlloc.shields}/${nextAlloc.sensors}%`
    );
  };

  const applyPreset = (preset: PowerAllocation, labelAr: string, labelEn: string) => {
    setPowerAllocation(preset);
    onDecisionEvent?.('blueprint', labelAr, labelEn);
  };

  const runStressTest = (test: StressTestDef) => {
    const failuresAr: string[] = [];
    const failuresEn: string[] = [];

    if (test.id === 'stress_mercury') {
      if (shipMetrics.thermalMargin < 84) {
        failuresAr.push(`الهامش الحراري (${shipMetrics.thermalMargin}%) أقل من 84% — طوّر الدرع أو ارفع طاقة الدروع`);
        failuresEn.push(`Thermal Margin (${shipMetrics.thermalMargin}%) < 84% — upgrade armor or Shield bus`);
      }
      if (shipMetrics.netPower < 0) {
        failuresAr.push(`عجز طاقة (${shipMetrics.netPower}W) — طوّر المفاعل`);
        failuresEn.push(`Negative net power (${shipMetrics.netPower}W) — upgrade reactor`);
      }
    } else if (test.id === 'stress_jupiter') {
      if (shipMetrics.shieldLevel < 3) {
        failuresAr.push(`الدرع الحالي T${shipMetrics.shieldLevel} — يحتاج مستوى 3+ لإشعاع المشتري`);
        failuresEn.push(`Hull Armor T${shipMetrics.shieldLevel} < T3 required for Jovian belt`);
      }
      if (shipMetrics.reliability < 88) {
        failuresAr.push(`الموثوقية (${shipMetrics.reliability}%) < 88%`);
        failuresEn.push(`Reliability (${shipMetrics.reliability}%) < 88%`);
      }
      if (powerAllocation.shields < 36) {
        failuresAr.push(`توزيع طاقة الدروع (${powerAllocation.shields}%) < 36%`);
        failuresEn.push(`Shield Bus allocation (${powerAllocation.shields}%) < 36%`);
      }
    } else if (test.id === 'stress_neptune') {
      if (shipMetrics.engineLevel < 3) {
        failuresAr.push(`المحرك T${shipMetrics.engineLevel} أضعف من T3 المطلوب لعاصفة 30 AU`);
        failuresEn.push(`Engine T${shipMetrics.engineLevel} < Tier 3 required for 30 AU storm`);
      }
      if (commsTier < 2) {
        failuresAr.push('الهوائي T1 لا يخترق 30 AU — يحتاج T2+');
        failuresEn.push('Comms T1 cannot pierce 30 AU — upgrade to T2+');
      }
      if (shipMetrics.deltaV < 7400) {
        failuresAr.push(`الدفع Δv (${shipMetrics.deltaV}) أقل من 7400 — ارفع المحرك أو طاقة الدفع`);
        failuresEn.push(`Delta-V (${shipMetrics.deltaV}) < 7400 — upgrade engine or Propulsion bus`);
      }
      if (shipMetrics.netPower < 15) {
        failuresAr.push(`فائض الطاقة (${shipMetrics.netPower}W) أقل من +15W`);
        failuresEn.push(`Net Power (${shipMetrics.netPower}W) < +15W safety reserve`);
      }
    }

    const passed = failuresEn.length === 0;
    resolveShuttleStressTest(
      test.id,
      passed,
      test.rewardCr,
      test.rewardBudgetM,
      test.hullDmg
    );

    if (passed) {
      setStressFeedback({
        passed: true,
        title: lang === 'ar' ? `✔ نجح: ${test.titleAr}` : `✔ PASSED: ${test.titleEn}`,
        detail:
          lang === 'ar'
            ? `صمد المكوك «${shuttleCustomName}» بالكامل! حصلت على مكافأة مالية وميزانية وكالة أعلى.`
            : `${shuttleCustomName} survived full environmental load! Credits & Agency Budget expanded.`,
      });
      onDecisionEvent?.('blueprint', `نجاح ${test.titleAr}`, `Passed ${test.titleEn}`);
    } else {
      setStressFeedback({
        passed: false,
        title:
          lang === 'ar'
            ? `✖ فشل الاختبار (-${test.hullDmg}% هيكل · -35 CR · -$15M ميزانية)`
            : `✖ FAILED (-${test.hullDmg}% Hull · -35 CR · -$15M Budget)`,
        detail: (lang === 'ar' ? failuresAr : failuresEn).join(' · '),
      });
      onDecisionEvent?.('weather', `فشل ${test.titleAr}`, `Failed ${test.titleEn}`);
    }
  };

  const filteredParts = SHIP_PARTS.filter((p) => p.category === activeCat);
  const plumeLength = 24 + shipMetrics.engineLevel * 12 + Math.round(powerAllocation.engines * 0.45);
  const shieldOpacity = 0.22 + (shipMetrics.shieldLevel / 4) * 0.45 + (powerAllocation.shields / 100) * 0.25;

  return (
    <div className="flex flex-col gap-3">
      {/* Top Economy & Budget Expansion Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-400/25 bg-[#070d19] px-3.5 py-2.5 font-mono tabular-nums">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-amber-300 font-bold">
            <Coins className="h-4 w-4" />
            <span>
              {lang === 'ar' ? 'رصيد التصميم:' : 'CREDITS:'} {resources.credits} CR
            </span>
          </div>
          <div className={`font-bold ${unlockedBudgetBonusM >= 0 ? 'text-emerald-300' : 'text-rose-400'}`}>
            {lang === 'ar' ? 'تعديل ميزانية الوكالة:' : 'AGENCY BUDGET:'}{' '}
            {unlockedBudgetBonusM >= 0 ? `+$${unlockedBudgetBonusM}M` : `-$${Math.abs(unlockedBudgetBonusM)}M`}
          </div>
          <div className="text-cyan-300">
            Δv {shipMetrics.deltaV.toLocaleString()} m/s · MAX {shipMetrics.maxSpeed} km/s · SHD {shipMetrics.maxShield}
          </div>
        </div>

        <button
          onClick={() => {
            if (investCreditsForBudget()) {
              onDecisionEvent?.('blueprint', 'استثمار 200 CR لرفع ميزانية الوكالة +40M$', 'Expanded Agency Budget +$40M');
            }
          }}
          disabled={resources.credits < 200}
          className="rounded-lg border border-emerald-400/50 bg-emerald-500/20 px-3 py-1.5 text-[11px] font-bold text-emerald-200 transition hover:bg-emerald-500/35 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {lang === 'ar'
            ? 'تحويل 200 CR ← فتح +$40M ميزانية'
            : 'Invest 200 CR → +$40M Budget'}
        </button>
      </div>

      {/* Main CAD Split: 2D Interactive Schematic + Part Upgrade Shop */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        {/* LEFT: Interactive 2D Blueprint CAD Canvas & Livery/Identity */}
        <div className="flex flex-col gap-3 rounded-xl border border-cyan-400/25 bg-[#060b14] p-3.5 lg:col-span-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="font-mono text-[10px] tracking-widest text-cyan-400">
                2D SPACECRAFT CAD WORKBENCH · CLICK AIRFRAME ZONES
              </div>
              <h3 className="text-sm font-bold text-white">
                {lang === 'ar' ? 'ورشة تصميم وتطوير المكوك 2D' : '2D Shuttle Blueprint & Subsystem Lab'}
              </h3>
            </div>
            <input
              type="text"
              value={shuttleCustomName}
              onChange={(e) => setShuttleCustomName(e.target.value)}
              maxLength={18}
              aria-label="Shuttle Callsign"
              className="w-32 rounded-lg border border-cyan-400/40 bg-black/50 px-2.5 py-1 font-mono text-xs font-bold text-cyan-200 outline-none focus:border-cyan-300"
              placeholder="NOVA-7"
            />
          </div>

          {/* Interactive Clickable 2D Shuttle Blueprint SVG */}
          <svg
            viewBox="0 0 460 220"
            className="w-full rounded-xl border border-white/10 bg-[#030710]"
          >
            {/* Technical CAD Grid */}
            <defs>
              <pattern id="cadGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(56,189,248,0.08)" strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect width="460" height="220" fill="url(#cadGrid)" />

            {/* Protective Shield Envelope */}
            <ellipse
              cx="228"
              cy="110"
              rx="172"
              ry="78"
              fill="none"
              stroke={activeLivery.accentHex}
              strokeWidth={1 + shipMetrics.shieldLevel * 0.55}
              strokeDasharray="6 4"
              opacity={shieldOpacity}
            />

            {/* Engine Plasma Plume (scales live with Engine Tier + Engine Power) */}
            <polygon
              points={`82,92 ${Math.max(12, 82 - plumeLength)},110 82,128`}
              fill={activeLivery.thrusterHex}
              opacity={0.78}
            />
            <polygon
              points={`84,100 ${Math.max(24, 84 - Math.round(plumeLength * 0.65))},110 84,120`}
              fill="#ffffff"
              opacity={0.85}
            />

            {/* Main Delta Wings & Hull (Clickable: hull) */}
            <g onClick={() => setActiveCat('hull')} className="cursor-pointer">
              <polygon
                points="110,110 185,36 270,84 270,136 185,184"
                fill={activeLivery.hullHex}
                stroke={activeCat === 'hull' ? '#fbbf24' : activeLivery.accentHex}
                strokeWidth={activeCat === 'hull' ? 2.8 : 1.6}
                opacity={0.92}
              />
              {/* Fuselage spine */}
              <polygon
                points="92,94 285,84 378,110 285,136 92,126"
                fill="#0f172a"
                stroke={activeLivery.accentHex}
                strokeWidth="1.8"
              />
              {/* Custom painted callsign */}
              <text
                x="190"
                y="114"
                textAnchor="middle"
                fill="#e2e8f0"
                fontSize="11"
                fontWeight="bold"
                fontFamily="monospace"
                letterSpacing="1.5"
              >
                {shuttleCustomName || 'NOVA-7'}
              </text>
            </g>

            {/* Solar / Reactor Wings & Core (Clickable: solar) */}
            <g onClick={() => setActiveCat('solar')} className="cursor-pointer">
              <rect
                x="150"
                y="22"
                width="74"
                height="20"
                rx="3"
                fill="#172554"
                stroke={activeCat === 'solar' ? '#fbbf24' : '#38bdf8'}
                strokeWidth={activeCat === 'solar' ? 2.4 : 1.3}
              />
              <rect
                x="150"
                y="178"
                width="74"
                height="20"
                rx="3"
                fill="#172554"
                stroke={activeCat === 'solar' ? '#fbbf24' : '#38bdf8'}
                strokeWidth={activeCat === 'solar' ? 2.4 : 1.3}
              />
              <circle
                cx="187"
                cy="110"
                r="11"
                fill={shipMetrics.netPower >= 0 ? '#10b981' : '#ef4444'}
                opacity="0.25"
              />
            </g>

            {/* Aft Engine Thrusters (Clickable: engine) */}
            <g onClick={() => setActiveCat('engine')} className="cursor-pointer">
              <rect
                x="78"
                y="88"
                width="20"
                height="16"
                rx="3"
                fill="#1e293b"
                stroke={activeCat === 'engine' ? '#fbbf24' : activeLivery.thrusterHex}
                strokeWidth={activeCat === 'engine' ? 2.5 : 1.5}
              />
              <rect
                x="78"
                y="116"
                width="20"
                height="16"
                rx="3"
                fill="#1e293b"
                stroke={activeCat === 'engine' ? '#fbbf24' : activeLivery.thrusterHex}
                strokeWidth={activeCat === 'engine' ? 2.5 : 1.5}
              />
            </g>

            {/* Nose Sensor & Plasma Cannon (Clickable: sensor) */}
            <g onClick={() => setActiveCat('sensor')} className="cursor-pointer">
              <polygon
                points="356,98 408,110 356,122"
                fill="#0284c7"
                stroke={activeCat === 'sensor' ? '#fbbf24' : '#67e8f9'}
                strokeWidth={activeCat === 'sensor' ? 2.5 : 1.5}
              />
              <line x1="408" y1="110" x2="438" y2="110" stroke="#22d3ee" strokeWidth="1.5" strokeDasharray="3 2" />
            </g>

            {/* Dorsal DSN Comms Dish (Clickable: comms) */}
            <g onClick={() => setActiveCat('comms')} className="cursor-pointer">
              <path
                d="M 272 80 Q 290 60 308 80"
                fill="none"
                stroke={activeCat === 'comms' ? '#fbbf24' : '#c084fc'}
                strokeWidth={activeCat === 'comms' ? 3 : 2}
              />
              <circle cx="290" cy="70" r="4" fill="#c084fc" />
            </g>

            {/* Hotspot Callout Labels */}
            <text x="16" y="18" fill="#94a3b8" fontSize="9" fontFamily="monospace">
              CLICK PART ON SCHEMATIC TO UPGRADE · HULL {Math.round(hullIntegrity)}%
            </text>
            <text x="16" y="212" fill="#38bdf8" fontSize="9" fontFamily="monospace">
              ENG T{shipMetrics.engineLevel} · SHD T{shipMetrics.shieldLevel} · SEN T{shipMetrics.cannonLevel} · COM T{commsTier} · NET {shipMetrics.netPower >= 0 ? `+${shipMetrics.netPower}W` : `${shipMetrics.netPower}W`}
            </text>
          </svg>

          {/* Livery Paint Swatches */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/35 px-3 py-2">
            <span className="text-[11px] font-bold text-slate-300">
              {lang === 'ar' ? 'طلاء المكوك:' : 'Hull Livery:'}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {SHIP_LIVERIES.map((liv) => {
                const active = liv.id === shipConfig.liveryId;
                return (
                  <button
                    key={liv.id}
                    onClick={() => {
                      selectLivery(liv.id);
                      onDecisionEvent?.('blueprint', `طلاء ${liv.name.ar}`, `Livery ${liv.name.en}`);
                    }}
                    className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-bold transition ${
                      active
                        ? 'border-cyan-400 bg-cyan-500/20 text-white'
                        : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25'
                    }`}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full border border-white/40"
                      style={{ backgroundColor: liv.accentHex }}
                    />
                    <span>{liv.name[lang]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3-Way Reactor Power Bus Allocator */}
          <div className="space-y-2.5 rounded-xl border border-white/10 bg-[#080f1d] p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                <Zap className="h-3.5 w-3.5" />
                <span>{lang === 'ar' ? 'توزيع طاقة المفاعل (100%)' : 'Reactor Power Bus Allocator (100%)'}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => applyPreset({ engines: 34, shields: 33, sensors: 33 }, 'توزيع طاقة متوازن', 'Balanced Bus')}
                  className="rounded border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] font-bold text-slate-200 hover:bg-white/10"
                >
                  {lang === 'ar' ? 'متوازن' : 'Balanced'}
                </button>
                <button
                  onClick={() => applyPreset({ engines: 56, shields: 24, sensors: 20 }, 'توجيه طاقة الدفع الأقصى', 'Overdrive Engines')}
                  className="rounded border border-cyan-400/35 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-200 hover:bg-cyan-500/20"
                >
                  {lang === 'ar' ? 'دفع فائق' : 'Overdrive'}
                </button>
                <button
                  onClick={() => applyPreset({ engines: 22, shields: 56, sensors: 22 }, 'تعزيز الدرع الحراري والمغناطيسي', 'Fortress Shields')}
                  className="rounded border border-emerald-400/35 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-200 hover:bg-emerald-500/20"
                >
                  {lang === 'ar' ? 'درع حصين' : 'Fortress'}
                </button>
                <button
                  onClick={() => applyPreset({ engines: 20, shields: 25, sensors: 55 }, 'رصد وتوجيه عميق', 'Deep Recon')}
                  className="rounded border border-violet-400/35 bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold text-violet-200 hover:bg-violet-500/20"
                >
                  {lang === 'ar' ? 'استشعار' : 'Recon'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 font-mono text-[11px] tabular-nums">
              <div>
                <div className="mb-1 flex justify-between text-cyan-300">
                  <span>{lang === 'ar' ? 'الدفع' : 'ENGINES'}</span>
                  <span className="font-bold">{powerAllocation.engines}%</span>
                </div>
                <input
                  type="range"
                  min={15}
                  max={70}
                  value={powerAllocation.engines}
                  onChange={(e) => handleSliderChange('engines', Number(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>
              <div>
                <div className="mb-1 flex justify-between text-emerald-300">
                  <span>{lang === 'ar' ? 'الدروع' : 'SHIELDS'}</span>
                  <span className="font-bold">{powerAllocation.shields}%</span>
                </div>
                <input
                  type="range"
                  min={15}
                  max={70}
                  value={powerAllocation.shields}
                  onChange={(e) => handleSliderChange('shields', Number(e.target.value))}
                  className="w-full accent-emerald-400"
                />
              </div>
              <div>
                <div className="mb-1 flex justify-between text-violet-300">
                  <span>{lang === 'ar' ? 'الحساسات' : 'SENSORS'}</span>
                  <span className="font-bold">{powerAllocation.sensors}%</span>
                </div>
                <input
                  type="range"
                  min={15}
                  max={70}
                  value={powerAllocation.sensors}
                  onChange={(e) => handleSliderChange('sensors', Number(e.target.value))}
                  className="w-full accent-violet-400"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-2 font-mono text-[10px] text-slate-300 tabular-nums">
              <span>{lang === 'ar' ? 'الموثوقية:' : 'REL:'} <strong className="text-emerald-300">{shipMetrics.reliability}%</strong></span>
              <span>{lang === 'ar' ? 'الحرارة:' : 'THERMAL:'} <strong className="text-amber-300">{shipMetrics.thermalMargin}%</strong></span>
              <span>{lang === 'ar' ? 'التصويب:' : 'PREC:'} <strong className="text-cyan-300">{shipMetrics.attitudePrecision}%</strong></span>
              <span>{lang === 'ar' ? 'الكتلة:' : 'MASS:'} <strong className="text-white">{shipMetrics.mass} kg</strong></span>
            </div>
          </div>
        </div>

        {/* RIGHT: Subsystem Shop & Tier 1-4 Part Upgrader */}
        <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-[#070c17] p-3.5 lg:col-span-6">
          <div className="flex flex-wrap items-center gap-1 rounded-lg border border-white/10 bg-black/40 p-1">
            {(['engine', 'solar', 'hull', 'sensor', 'comms'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCat(cat)}
                className={`flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-bold whitespace-nowrap transition ${
                  activeCat === cat
                    ? 'bg-cyan-400 text-slate-950'
                    : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                {cat === 'engine' && <Flame className="h-3 w-3" />}
                {cat === 'solar' && <Zap className="h-3 w-3" />}
                {cat === 'hull' && <Shield className="h-3 w-3" />}
                {cat === 'sensor' && <Cpu className="h-3 w-3" />}
                {cat === 'comms' && <Radio className="h-3 w-3" />}
                <span>{categoryLabels[cat][lang]}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {filteredParts.map((part) => {
              const isEquipped = equippedIds[part.category] === part.id;
              const isOwned = purchasedPartIds.includes(part.id);
              const canAfford = resources.credits >= part.cost;

              return (
                <button
                  key={part.id}
                  onClick={() => handleEquipOrBuy(part)}
                  className={`flex flex-col justify-between rounded-xl border p-3 text-start transition ${
                    isEquipped
                      ? 'border-cyan-400 bg-cyan-500/15 text-white'
                      : isOwned
                        ? 'border-white/15 bg-white/[0.03] text-slate-200 hover:border-cyan-400/50'
                        : canAfford
                          ? 'border-amber-400/40 bg-amber-500/[0.07] text-amber-50 hover:border-amber-300'
                          : 'border-white/10 bg-black/30 text-slate-400 opacity-75'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 font-mono text-[10px]">
                      <span className={part.tier === 4 ? 'font-bold text-amber-300' : 'text-cyan-300'}>
                        TIER {part.tier} {part.tier === 4 ? '★ EXP' : ''}
                      </span>
                      {isEquipped ? (
                        <span className="flex items-center gap-1 font-bold text-emerald-300">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>{lang === 'ar' ? 'مركّب' : 'EQUIPPED'}</span>
                        </span>
                      ) : isOwned ? (
                        <span className="font-bold text-cyan-300">
                          {lang === 'ar' ? 'مملوك — تركيب' : 'OWNED · EQUIP'}
                        </span>
                      ) : (
                        <span className={`flex items-center gap-1 font-bold ${canAfford ? 'text-amber-300' : 'text-rose-300'}`}>
                          <Lock className="h-3 w-3" />
                          <span>{part.cost} CR</span>
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-xs font-bold text-white">{part.name[lang]}</div>
                    <p className="mt-1 text-[11px] leading-snug text-slate-400">{part.desc[lang]}</p>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between border-t border-white/10 pt-2 font-mono text-[10px] tabular-nums text-slate-300">
                    <span>{part.mass} kg</span>
                    <span className={part.powerDelta >= 0 ? 'text-emerald-300' : 'text-amber-300'}>
                      {part.powerDelta >= 0 ? `+${part.powerDelta}W` : `${part.powerDelta}W`}
                    </span>
                    <span>
                      {part.deltaV > 0 ? `Δv ${part.deltaV}` : `+${part.reliabilityBonus}% REL`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Harsh Orbit Stress-Test Simulator */}
          <div className="mt-auto space-y-2 rounded-xl border border-rose-400/25 bg-[#0a0f1c] p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-200">
                <Wrench className="h-3.5 w-3.5 text-amber-300" />
                <span>
                  {lang === 'ar'
                    ? 'محاكي اختبارات القسوة الفضائية (اربح CR وافتح ميزانية أعلى)'
                    : 'Extreme Environment Stress Tests (Win CR & Budget)'}
                </span>
              </div>
              <span className="font-mono text-[10px] text-emerald-300">
                {completedStressTests.length}/{STRESS_TESTS.length}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {STRESS_TESTS.map((test) => {
                const cleared = completedStressTests.includes(test.id);
                return (
                  <button
                    key={test.id}
                    onClick={() => runStressTest(test)}
                    className={`flex flex-col justify-between rounded-lg border p-2.5 text-start transition ${
                      cleared
                        ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-50 hover:bg-emerald-500/20'
                        : 'border-white/15 bg-white/[0.03] text-slate-200 hover:border-amber-400/60 hover:bg-amber-500/10'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between font-mono text-[10px]">
                        <span className={cleared ? 'font-bold text-emerald-300' : 'text-amber-300'}>
                          +{test.rewardCr} CR / +${test.rewardBudgetM}M
                        </span>
                        {cleared && <Sparkles className="h-3 w-3 text-emerald-300" />}
                      </div>
                      <div className="mt-1 text-[11px] font-bold leading-snug">
                        {lang === 'ar' ? test.titleAr : test.titleEn}
                      </div>
                    </div>
                    <div className="mt-1.5 text-[10px] text-slate-400">
                      {lang === 'ar' ? test.reqSummaryAr : test.reqSummaryEn}
                    </div>
                  </button>
                );
              })}
            </div>

            {stressFeedback && (
              <div
                className={`rounded-lg border px-3 py-2 text-[11px] ${
                  stressFeedback.passed
                    ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-100'
                    : 'border-rose-400/45 bg-rose-500/15 text-rose-100'
                }`}
              >
                <div className="font-bold">{stressFeedback.title}</div>
                <div className="mt-0.5">{stressFeedback.detail}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
