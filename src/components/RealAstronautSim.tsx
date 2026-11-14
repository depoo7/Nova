import {
  Activity,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  Flame,
  HeartPulse,
  Lightbulb,
  Link2,
  ShieldCheck,
  Snowflake,
  Sparkles,
  Sun,
  Moon,
  Wind,
  Wrench,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { getDisplayCommander } from '../data/i18n';
import { useGameStore } from '../store/gameStore';

interface EvaNode {
  id: string;
  x: number;
  y: number;
  labelAr: string;
  labelEn: string;
  fixed: boolean;
}

const INITIAL_EVA_NODES: EvaNode[] = [
  {
    id: 'tile',
    x: 190,
    y: 86,
    labelAr: 'لوح العزل الحراري',
    labelEn: 'Thermal Shield Tile',
    fixed: false,
  },
  {
    id: 'tracker',
    x: 340,
    y: 62,
    labelAr: 'عدسة متتبع النجوم GMAT',
    labelEn: 'GMAT Star Tracker Lens',
    fixed: false,
  },
  {
    id: 'csa_pin',
    x: 428,
    y: 158,
    labelAr: 'مفصل ذراع Canadarm',
    labelEn: 'CSA Canadarm Latch Pin',
    fixed: false,
  },
];

export function RealAstronautSim() {
  const lang = useGameStore((s) => s.lang);
  const character = useGameStore((s) => s.character);
  const hullIntegrity = useGameStore((s) => s.hullIntegrity);
  const resources = useGameStore((s) => s.resources);
  const bio = useGameStore((s) => s.astronautBio);
  const performAstronautAction = useGameStore((s) => s.performAstronautAction);
  const stepEvaExertion = useGameStore((s) => s.stepEvaExertion);

  const [solarZone, setSolarZone] = useState<'sunlit' | 'eclipse'>('sunlit');
  const [evaActive, setEvaActive] = useState(true);
  const [nodes, setNodes] = useState<EvaNode[]>(() => INITIAL_EVA_NODES.map((n) => ({ ...n })));
  const [nearNodeId, setNearNodeId] = useState<string | null>(null);
  const [isThrustingUI, setIsThrustingUI] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const padRef = useRef({ up: false, down: false, left: false, right: false, brake: false });
  const astroRef = useRef({ x: 86, y: 140, vx: 0, vy: 0, angle: 0 });
  const nodesRef = useRef<EvaNode[]>(nodes);
  nodesRef.current = nodes;

  const commanderName = getDisplayCommander(character.name, lang);

  // Repair nearest EVA node
  const handleFixNode = () => {
    const astro = astroRef.current;
    const hit = nodesRef.current.find(
      (n) => !n.fixed && Math.hypot(astro.x - n.x, astro.y - n.y) < 34
    );
    if (!hit) return;

    const updated = nodesRef.current.map((n) => (n.id === hit.id ? { ...n, fixed: true } : n));
    setNodes(updated);
    const allFixed = updated.every((n) => n.fixed);
    if (allFixed) {
      performAstronautAction('complete_eva_repair');
      window.setTimeout(() => {
        setNodes(INITIAL_EVA_NODES.map((n) => ({ ...n })));
      }, 1600);
    }
  };

  // Keyboard bindings inside Astronaut EVA canvas
  useEffect(() => {
    if (!evaActive) return;
    const onDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (
        ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(
          e.code
        )
      ) {
        keysRef.current.add(e.code);
      }
      if (e.code === 'KeyE') {
        e.preventDefault();
        handleFixNode();
      }
    };
    const onUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.code);
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      keysRef.current.clear();
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [evaActive]);

  // Real Newtonian Microgravity EVA Physics + Physiology Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 540;
    const H = 250;
    const airlockX = 72;
    const airlockY = 140;

    let rafId = 0;
    let last = performance.now();
    let physioAccum = 0;

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      const keys = keysRef.current;
      const pad = padRef.current;
      const a = astroRef.current;

      let ax = 0;
      let ay = 0;
      if (keys.has('KeyA') || keys.has('ArrowLeft') || pad.left) ax -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight') || pad.right) ax += 1;
      if (keys.has('KeyW') || keys.has('ArrowUp') || pad.up) ay -= 1;
      if (keys.has('KeyS') || keys.has('ArrowDown') || pad.down) ay += 1;

      const thrusting = evaActive && (ax !== 0 || ay !== 0 || pad.brake);
      setIsThrustingUI(thrusting);

      if (evaActive) {
        const accel = 95;
        a.vx += ax * accel * dt;
        a.vy += ay * accel * dt;

        // SAFER Auto-Hold Attitude Brake
        if (pad.brake) {
          a.vx *= Math.max(0, 1 - 4.5 * dt);
          a.vy *= Math.max(0, 1 - 4.5 * dt);
        } else {
          // Near-zero vacuum drag (authentic microgravity drift!)
          a.vx *= Math.max(0, 1 - 0.14 * dt);
          a.vy *= Math.max(0, 1 - 0.14 * dt);
        }

        if (ax !== 0 || ay !== 0) {
          a.angle = Math.atan2(ay, ax);
        }

        a.x += a.vx * dt;
        a.y += a.vy * dt;

        // Soft hull collision bounds
        if (a.x < 24) {
          a.x = 24;
          a.vx = Math.abs(a.vx) * 0.4;
        }
        if (a.x > W - 24) {
          a.x = W - 24;
          a.vx = -Math.abs(a.vx) * 0.4;
        }
        if (a.y < 24) {
          a.y = 24;
          a.vy = Math.abs(a.vy) * 0.4;
        }
        if (a.y > H - 24) {
          a.y = H - 24;
          a.vy = -Math.abs(a.vy) * 0.4;
        }

        // Tether physical constraint when tetherLocked is active
        const stateBio = useGameStore.getState().astronautBio;
        if (stateBio.tetherLocked) {
          const dx = a.x - airlockX;
          const dy = a.y - airlockY;
          const dist = Math.hypot(dx, dy);
          const maxTether = 395;
          if (dist > maxTether) {
            const nx = dx / dist;
            const ny = dy / dist;
            a.x = airlockX + nx * maxTether;
            a.y = airlockY + ny * maxTether;
            const radialVel = a.vx * nx + a.vy * ny;
            if (radialVel > 0) {
              a.vx -= radialVel * nx * 1.3;
              a.vy -= radialVel * ny * 1.3;
            }
          }
        }
      }

      // Update physiology every 0.45s
      physioAccum += dt;
      if (physioAccum >= 0.45) {
        stepEvaExertion(physioAccum, solarZone, thrusting);
        physioAccum = 0;
      }

      // Check nearby repair node
      const found = nodesRef.current.find(
        (n) => !n.fixed && Math.hypot(a.x - n.x, a.y - n.y) < 34
      );
      setNearNodeId(found ? found.id : null);

      // ================= DRAW 2D ZERO-G EVA SCENE =================
      ctx.fillStyle = solarZone === 'sunlit' ? '#081226' : '#03060c';
      ctx.fillRect(0, 0, W, H);

      // Sunlight glare vs Umbra shadow
      if (solarZone === 'sunlit') {
        const sunGrad = ctx.createRadialGradient(W - 40, 26, 8, W - 40, 26, 220);
        sunGrad.addColorStop(0, 'rgba(251, 191, 36, 0.25)');
        sunGrad.addColorStop(1, 'rgba(251, 191, 36, 0)');
        ctx.fillStyle = sunGrad;
        ctx.fillRect(0, 0, W, H);
      }

      // Stars
      ctx.fillStyle = 'rgba(226,232,240,0.45)';
      for (let i = 0; i < 42; i++) {
        ctx.fillRect((i * 89) % W, (i * 53) % H, i % 4 === 0 ? 1.8 : 1, i % 4 === 0 ? 1.8 : 1);
      }

      // NOVA-7 Outer Hull Backdrop
      ctx.fillStyle = '#151e2e';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(38, 108, 415, 76, 12);
      ctx.fill();
      ctx.stroke();

      // Solar Array Wing
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(145, 58, 130, 32);
      ctx.strokeStyle = '#60a5fa';
      ctx.strokeRect(145, 58, 130, 32);

      // Airlock Hatch
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(airlockX, airlockY, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('AIRLOCK', 48, 198);

      // Safety Tether Line
      const isTethered = useGameStore.getState().astronautBio.tetherLocked;
      if (isTethered) {
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.75)';
        ctx.lineWidth = 1.4;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(airlockX, airlockY);
        ctx.quadraticCurveTo((airlockX + a.x) * 0.5, (airlockY + a.y) * 0.5 + 16, a.x, a.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // EVA Repair Nodes
      for (const node of nodesRef.current) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 12, 0, Math.PI * 2);
        ctx.fillStyle = node.fixed ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.28)';
        ctx.fill();
        ctx.strokeStyle = node.fixed ? '#34d399' : '#fb7185';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        ctx.fillStyle = node.fixed ? '#34d399' : '#fda4af';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(node.fixed ? 'OK' : 'FIX', node.x, node.y + 3);
      }

      // Real EVA Astronaut with SAFER Jetpack Plumes
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle);

      if (thrusting && !pad.brake) {
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.moveTo(-12, -4);
        ctx.lineTo(-22 - Math.random() * 6, 0);
        ctx.lineTo(-12, 4);
        ctx.closePath();
        ctx.fill();
      }

      // SAFER Backpack
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(-11, -8, 6, 16);
      // EMU Torso
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(-6, -9, 14, 18, 4);
      ctx.fill();
      ctx.stroke();
      // Gold Visor
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(6, 0, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Speed vector readout
      const speedMag = Math.hypot(a.vx, a.vy).toFixed(1);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px monospace';
      ctx.fillText(`0-G VEL: ${speedMag} cm/s · ${solarZone === 'sunlit' ? 'ORBITAL DAY (+120°C)' : 'UMBRA ECLIPSE (-110°C)'}`, 12, 18);

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [evaActive, solarZone, stepEvaExertion]);

  const tempStatus =
    bio.suitTempC > 27
      ? { color: 'text-rose-400', labelAr: 'سخونة زائدة (ارفع التبريد)', labelEn: 'HOT (Raise LCVG)' }
      : bio.suitTempC < 15
        ? { color: 'text-sky-300', labelAr: 'برودة شديدة (اخفض التبريد)', labelEn: 'COLD (Lower LCVG)' }
        : { color: 'text-emerald-300', labelAr: 'توازن حراري مثالي', labelEn: 'THERMAL NOMINAL' };

  const co2Danger = bio.co2MmHg > 3.2;

  return (
    <div className="space-y-3">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-cyan-400/25 bg-[#060b14] px-4 py-2.5">
        <div>
          <div className="font-mono text-[10px] font-bold tracking-widest text-cyan-300">
            REAL ASTRONAUT EMU BIO-SUIT &amp; 0-G EVA SIMULATOR
          </div>
          <h3 className="font-display text-sm font-bold text-white sm:text-base">
            {lang === 'ar'
              ? `محاكاة رائد الفضاء الحقيقي — القائد ${commanderName} (بدلة الضغط والتبريد وانعدام الجاذبية)`
              : `Real Astronaut Simulation — ${commanderName} (EMU Vitals, LCVG Cooling & 0-G Spacewalk)`}
          </h3>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs tabular-nums">
          <span
            className={`rounded border px-2.5 py-1 font-bold ${
              bio.preBreatheDone
                ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300'
                : 'border-amber-400/40 bg-amber-500/15 text-amber-200'
            }`}
          >
            {bio.preBreatheDone
              ? lang === 'ar'
                ? 'O2 Pre-Breathe ✔'
                : 'O2 PRE-BREATHE READY'
              : lang === 'ar'
                ? 'ينصح بتنفس O2 المسبق'
                : 'PRE-BREATHE NEEDED'}
          </span>
          <span className="rounded border border-white/15 bg-white/5 px-2.5 py-1 text-slate-200">
            {lang === 'ar' ? `إصلاحات EVA: ${bio.evaRepairsCompleted}` : `EVA REPAIRS: ${bio.evaRepairsCompleted}`}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        {/* LEFT: REAL BIO-SUIT CUTAWAY & PHYSIOLOGY INTERVENTIONS */}
        <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-[#070c16] p-3.5 lg:col-span-5">
          <div className="flex items-center gap-3">
            {/* Live Reactive NASA EMU Suit SVG */}
            <svg viewBox="0 0 110 148" className="h-36 w-28 shrink-0 rounded-lg border border-white/10 bg-[#040811]">
              {/* Visor Glow & CO2 Fog */}
              <circle cx="55" cy="30" r="18" fill="#1e293b" stroke="#cbd5e1" strokeWidth="1.5" />
              <ellipse
                cx="55"
                cy="30"
                rx="13"
                ry="10"
                fill={co2Danger ? '#94a3b8' : '#f59e0b'}
                fillOpacity={co2Danger ? 0.55 : 0.85}
              />
              {co2Danger && (
                <text x="55" y="33" textAnchor="middle" fill="#0f172a" fontSize="6.5" fontWeight="bold" fontFamily="monospace">
                  CO2 FOG
                </text>
              )}

              {/* Torso & LCVG Water Cooling Loops */}
              <rect x="33" y="52" width="44" height="48" rx="9" fill="#e2e8f0" stroke="#475569" strokeWidth="1.5" />
              <path
                d="M 41 60 Q 55 68 69 60 M 41 74 Q 55 82 69 74 M 41 88 Q 55 96 69 88"
                fill="none"
                stroke={bio.suitTempC > 27 ? '#f43f5e' : bio.suitTempC < 15 ? '#38bdf8' : '#10b981'}
                strokeWidth="2.2"
              />
              {/* Chest DCM Control Unit */}
              <rect x="44" y="62" width="22" height="14" rx="2" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
              <text x="55" y="71" textAnchor="middle" fill="#38bdf8" fontSize="6" fontFamily="monospace">
                {bio.suitPressureKpa}kPa
              </text>

              {/* Arms & Legs */}
              <line x1="33" y1="60" x2="18" y2="92" stroke="#cbd5e1" strokeWidth="9" strokeLinecap="round" />
              <line x1="77" y1="60" x2="92" y2="92" stroke="#cbd5e1" strokeWidth="9" strokeLinecap="round" />
              <line x1="44" y1="100" x2="40" y2="136" stroke="#cbd5e1" strokeWidth="10" strokeLinecap="round" />
              <line x1="66" y1="100" x2="70" y2="136" stroke="#cbd5e1" strokeWidth="10" strokeLinecap="round" />

              {isThrustingUI && (
                <circle cx="55" cy="142" r="5" fill="#38bdf8" opacity="0.8" />
              )}
            </svg>

            {/* Live Biometric Grid */}
            <div className="grid flex-1 grid-cols-2 gap-2 font-mono text-xs tabular-nums">
              <div className="rounded-lg border border-white/10 bg-black/40 p-2">
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <HeartPulse className="h-3 w-3 text-rose-400" />
                  <span>{lang === 'ar' ? 'النبض' : 'HEART RATE'}</span>
                </div>
                <div className={`mt-0.5 text-lg font-bold ${bio.heartRateBpm > 120 ? 'text-rose-400' : 'text-emerald-300'}`}>
                  {Math.round(bio.heartRateBpm)} BPM
                </div>
                <div className="text-[9px] text-slate-400">{bio.stressLevel}</div>
              </div>

              <div className="rounded-lg border border-white/10 bg-black/40 p-2">
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <Wind className="h-3 w-3 text-amber-300" />
                  <span>{lang === 'ar' ? 'ثاني أكسيد CO2' : 'SUIT CO2'}</span>
                </div>
                <div className={`mt-0.5 text-lg font-bold ${co2Danger ? 'text-rose-400' : 'text-cyan-300'}`}>
                  {bio.co2MmHg.toFixed(1)}
                </div>
                <div className="text-[9px] text-slate-400">mmHg (MAX 4.0)</div>
              </div>

              <div className="rounded-lg border border-white/10 bg-black/40 p-2">
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  {bio.suitTempC > 24 ? (
                    <Flame className="h-3 w-3 text-amber-400" />
                  ) : (
                    <Snowflake className="h-3 w-3 text-sky-300" />
                  )}
                  <span>{lang === 'ar' ? 'حرارة البدلة' : 'LCVG TEMP'}</span>
                </div>
                <div className={`mt-0.5 text-lg font-bold ${tempStatus.color}`}>
                  {bio.suitTempC.toFixed(1)}°C
                </div>
                <div className="truncate text-[9px] text-slate-400">
                  {lang === 'ar' ? tempStatus.labelAr : tempStatus.labelEn}
                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-black/40 p-2">
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <Activity className="h-3 w-3 text-cyan-300" />
                  <span>{lang === 'ar' ? 'ضغط / O2' : 'EMU PSI / O2'}</span>
                </div>
                <div className="mt-0.5 text-lg font-bold text-white">
                  {Math.round(resources.suitO2)}%
                </div>
                <div className="text-[9px] text-slate-400">{bio.suitPressureKpa} kPa (4.3 psi)</div>
              </div>
            </div>
          </div>

          {/* LCVG Thermal Valve Control */}
          <div className="rounded-lg border border-white/10 bg-black/35 p-3">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-bold text-cyan-200">
                {lang === 'ar' ? 'صمام تبريد الماء LCVG' : 'LCVG Water Cooling Loop Valve'}
              </span>
              <span className="font-mono font-bold text-amber-300 tabular-nums">
                {bio.lcvgCoolingPct}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={2}
              value={bio.lcvgCoolingPct}
              onChange={(e) => performAstronautAction('set_lcvg', Number(e.target.value))}
              className="w-full accent-cyan-400"
            />
            <div className="mt-1 flex justify-between text-[10px] text-slate-400">
              <span>{lang === 'ar' ? 'تدفئة (للظل البارد)' : '0% Heat (Eclipse)'}</span>
              <span>{lang === 'ar' ? 'تبريد أقصى (للشمس)' : '100% Cool (Sunlit)'}</span>
            </div>
          </div>

          {/* Real Astronaut Suit Protocols */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              onClick={() => performAstronautAction('prebreathe_o2')}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-3 py-2 text-xs font-bold text-emerald-200 hover:bg-emerald-500/25"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>{lang === 'ar' ? 'تنفس O2 مسبق (4.3 psi)' : 'O2 Pre-Breathe (29.6 kPa)'}</span>
            </button>
            <button
              onClick={() => performAstronautAction('purge_co2')}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-cyan-400/40 bg-cyan-500/15 px-3 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-500/25"
            >
              <Wind className="h-4 w-4" />
              <span>{lang === 'ar' ? 'تنظيف مرشح LiOH CO2' : 'Purge CO2 Scrubber'}</span>
            </button>
            <button
              onClick={() => performAstronautAction('pace_breathing')}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-amber-400/40 bg-amber-500/15 px-3 py-2 text-xs font-bold text-amber-200 hover:bg-amber-500/25"
            >
              <HeartPulse className="h-4 w-4" />
              <span>{lang === 'ar' ? 'تنفس إيقاعي 4-4-4' : '4-4-4 Box Breathing'}</span>
            </button>
            <button
              onClick={() => performAstronautAction('toggle_tether')}
              className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition ${
                bio.tetherLocked
                  ? 'border-cyan-400 bg-cyan-500/20 text-white'
                  : 'border-rose-400/40 bg-rose-500/15 text-rose-200'
              }`}
            >
              <Link2 className="h-4 w-4" />
              <span>
                {bio.tetherLocked
                  ? lang === 'ar'
                    ? 'حبل الأمان: مقفول'
                    : 'Safety Tether: LOCKED'
                  : lang === 'ar'
                    ? 'طيران حر (بدون حبل)'
                    : 'Free-Float (Untethered)'}
              </span>
            </button>
          </div>
        </div>

        {/* RIGHT: 2D NEWTONIAN MICROGRAVITY SPACEWALK (EVA) SIMULATOR */}
        <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-[#070c16] p-3.5 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-xs font-bold text-white">
                {lang === 'ar'
                  ? 'محاكي السير الفضائي في انعدام الجاذبية (0-G SAFER Thruster EVA)'
                  : 'Live 0-G Spacewalk Repair (Newtonian SAFER Thruster Inertia)'}
              </div>
              <div className="text-[11px] text-slate-400">
                {lang === 'ar'
                  ? 'تحرك بـ WASD أو الأسهم، واقترب من النقاط الحمراء ثم اضغط [E] للإصلاح (+15% هيكل)'
                  : 'Fly with WASD/Arrows or Thruster Pad — approach red hull nodes & press [E] to repair (+15% Hull)'}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSolarZone('sunlit')}
                className={`flex items-center gap-1 rounded-md border px-2.5 py-1 text-[11px] font-bold ${
                  solarZone === 'sunlit'
                    ? 'border-amber-400 bg-amber-400 text-slate-950'
                    : 'border-white/15 bg-white/5 text-slate-300'
                }`}
              >
                <Sun className="h-3.5 w-3.5" />
                <span>{lang === 'ar' ? 'شمس +120°C' : 'Orbital Day'}</span>
              </button>
              <button
                onClick={() => setSolarZone('eclipse')}
                className={`flex items-center gap-1 rounded-md border px-2.5 py-1 text-[11px] font-bold ${
                  solarZone === 'eclipse'
                    ? 'border-sky-400 bg-sky-400 text-slate-950'
                    : 'border-white/15 bg-white/5 text-slate-300'
                }`}
              >
                <Moon className="h-3.5 w-3.5" />
                <span>{lang === 'ar' ? 'ظل -110°C' : 'Eclipse Night'}</span>
              </button>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-xl border border-cyan-400/30 bg-black">
            <canvas ref={canvasRef} width={540} height={250} className="block h-auto w-full" />

            {nearNodeId && (
              <div className="absolute bottom-2.5 start-2.5 flex items-center gap-2 rounded-lg border border-emerald-400/60 bg-[#071019]/95 px-3 py-1.5 text-xs">
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                <span className="font-bold text-white">
                  {lang === 'ar'
                    ? nodes.find((n) => n.id === nearNodeId)?.labelAr
                    : nodes.find((n) => n.id === nearNodeId)?.labelEn}
                </span>
                <button
                  onClick={handleFixNode}
                  className="rounded bg-emerald-400 px-2.5 py-1 text-[11px] font-bold text-slate-950"
                >
                  {lang === 'ar' ? 'إصلاح [E]' : 'Repair [E]'}
                </button>
              </div>
            )}
          </div>

          {/* SAFER Thruster Controls + EVA Repair Progress */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/35 p-2.5">
            <div className="flex items-center gap-1.5">
              <button
                onPointerDown={() => (padRef.current.left = true)}
                onPointerUp={() => (padRef.current.left = false)}
                onPointerLeave={() => (padRef.current.left = false)}
                className="rounded border border-white/15 bg-white/10 p-2 text-white active:bg-cyan-500/40"
                title="Left [A]"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button
                onPointerDown={() => (padRef.current.up = true)}
                onPointerUp={() => (padRef.current.up = false)}
                onPointerLeave={() => (padRef.current.up = false)}
                className="rounded border border-white/15 bg-white/10 p-2 text-white active:bg-cyan-500/40"
                title="Up [W]"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
              <button
                onPointerDown={() => (padRef.current.down = true)}
                onPointerUp={() => (padRef.current.down = false)}
                onPointerLeave={() => (padRef.current.down = false)}
                className="rounded border border-white/15 bg-white/10 p-2 text-white active:bg-cyan-500/40"
                title="Down [S]"
              >
                <ArrowDown className="h-4 w-4" />
              </button>
              <button
                onPointerDown={() => (padRef.current.right = true)}
                onPointerUp={() => (padRef.current.right = false)}
                onPointerLeave={() => (padRef.current.right = false)}
                className="rounded border border-white/15 bg-white/10 p-2 text-white active:bg-cyan-500/40"
                title="Right [D]"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onPointerDown={() => (padRef.current.brake = true)}
                onPointerUp={() => (padRef.current.brake = false)}
                onPointerLeave={() => (padRef.current.brake = false)}
                className="rounded border border-amber-400/40 bg-amber-500/20 px-3 py-2 text-[11px] font-bold text-amber-200 active:bg-amber-400 active:text-slate-950"
              >
                {lang === 'ar' ? 'تثبيت SAFER' : 'SAFER Hold'}
              </button>
              <button
                onClick={handleFixNode}
                disabled={!nearNodeId}
                className="flex items-center gap-1 rounded bg-emerald-400 px-3 py-2 text-[11px] font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-35"
              >
                <Wrench className="h-3.5 w-3.5" />
                <span>{lang === 'ar' ? 'تثبيت العطل [E]' : 'Fix Node [E]'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2 font-mono text-[11px] tabular-nums">
              {nodes.map((n) => (
                <span
                  key={n.id}
                  className={`flex items-center gap-1 rounded border px-2 py-1 ${
                    n.fixed
                      ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300'
                      : 'border-white/10 bg-white/5 text-slate-400'
                  }`}
                >
                  {n.fixed && <CheckCircle2 className="h-3 w-3" />}
                  <span>{n.id.toUpperCase()}</span>
                </span>
              ))}
              <button
                onClick={() => setEvaActive((v) => !v)}
                className="rounded border border-white/15 bg-white/5 px-2 py-1 text-slate-300 hover:bg-white/10"
              >
                {evaActive ? (lang === 'ar' ? 'إيقاف' : 'Pause') : lang === 'ar' ? 'تشغيل' : 'Resume'}
              </button>
            </div>
          </div>

          {/* Tips for Real Astronaut Operations */}
          <div className="rounded-lg border border-amber-400/25 bg-amber-500/10 p-2.5 text-[11px] leading-relaxed text-amber-100">
            <div className="mb-1 flex items-center gap-1.5 font-bold text-amber-300">
              <Lightbulb className="h-3.5 w-3.5" />
              <span>
                {lang === 'ar'
                  ? 'تكتيك رائد الفضاء الحقيقي (NASA EMU Checklist)'
                  : 'Real Astronaut Survival Tips & Tricks'}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-3 text-[10px] text-slate-200">
              <div>
                •{' '}
                {lang === 'ar'
                  ? 'انعدام الجاذبية: السفينة والفضاء بدون احتكاك؛ أطلق نبضة قصيرة ثم استخدم عكس الاتجاه أو SAFER Hold للتوقف.'
                  : '0-G Inertia: Space has near-zero friction—tap thrust gently, then counter-thrust or hold SAFER Hold before hitting the hull.'}
              </div>
              <div>
                •{' '}
                {lang === 'ar'
                  ? 'الحرارة والـ CO2: في الشمس ارفع التبريد ~75%، وفي الكسوف اخفضه ~25%، ونظّف مرشح CO2 إذا تعدى 3.0.'
                  : 'Thermal & CO2: Raise LCVG cooling (~75%) in Orbital Day, lower (~25%) in Eclipse, and purge CO2 whenever it climbs past 3.0 mmHg.'}
              </div>
              <div>
                •{' '}
                {lang === 'ar'
                  ? 'حماية الهيكل (Hull ' + Math.round(hullIntegrity) + '%): كل إصلاح خارجي لـ 3 نقاط يعيد +15% للهيكل قبل تحديات البقاء!'
                  : `Hull Recovery (${Math.round(hullIntegrity)}%): Fixing all 3 outer nodes restores +15% Hull Integrity & +120 CR anytime!`}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
