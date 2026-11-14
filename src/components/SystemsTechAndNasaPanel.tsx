import {
  AlertOctagon,
  Award,
  BookOpen,
  Check,
  Cpu,
  Download,
  FlaskConical,
  Globe,
  GraduationCap,
  Layers,
  Lock,
  Rocket,
  Sparkles,
  Unlock,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { INSTRUMENT_OPTIONS } from '../data/missionArchitectData';
import { PLANETS } from '../data/novaData';
import { getPlanetEnvironment } from '../engine/planetaryEnvironments';
import {
  ENGINEERING_GLOSSARY,
  NASA_RECREATION_MISSIONS,
  SUBSYSTEM_CATALOG_14,
  SUBSYSTEM_CATEGORIES_META,
  TECH_TREE_NODES,
} from '../engine/subsystemsCatalog';
import { useGameStore } from '../store/gameStore';
import type {
  CooperativeTeamMember,
  InstructorAssignment,
  PlanetId,
  SubsystemCategory14,
  TeamRoleV2,
} from '../types/game';
import type { DecisionVisualKind } from './DecisionReactive3DViewport';

interface SystemsTechAndNasaPanelProps {
  embedded?: boolean;
  initialSection?: 'subsystems' | 'tech' | 'nasa' | 'team' | 'classroom' | 'learn';
  onDecisionEvent?: (kind: DecisionVisualKind, ar: string, en: string) => void;
}

const ROLE_LABELS: Record<TeamRoleV2, { ar: string; en: string; scopeAr: string; scopeEn: string }> = {
  commander: { ar: 'قائد المهمة (Commander)', en: 'Commander', scopeAr: 'تحديد المدار والموافقة النهائية', scopeEn: 'Mission target & launch sign-off' },
  systems_engineer: { ar: 'مهندس الأنظمة (Systems)', en: 'Systems Engineer', scopeAr: 'توازن الطاقة، الحرارة والدرع', scopeEn: 'Power, thermal & shield margin' },
  science_officer: { ar: 'ضابط العلوم (Science)', scopeAr: 'الأجهزة العلمية وجودة البيانات', en: 'Science Officer', scopeEn: 'Instruments & science return' },
  flight_director: { ar: 'مدير الطيران (Flight Dir.)', en: 'Flight Director', scopeAr: 'الاتصالات، الطوارئ والمناورات', scopeEn: 'DSN comms, events & Δv maneuvers' },
};

export function SystemsTechAndNasaPanel({
  embedded = false,
  initialSection = 'subsystems',
  onDecisionEvent,
}: SystemsTechAndNasaPanelProps) {
  const lang = useGameStore((s) => s.lang);
  const systemsLabOpen = useGameStore((s) => s.systemsLabOpen);
  const setSystemsLabOpen = useGameStore((s) => s.setSystemsLabOpen);
  const activePlanet = useGameStore((s) => s.activePlanet);
  const resources = useGameStore((s) => s.resources);
  const researchPoints = useGameStore((s) => s.researchPoints);
  const advancedLoadout = useGameStore((s) => s.advancedLoadout);
  const unlockedSubsystemIds = useGameStore((s) => s.unlockedSubsystemIds);
  const unlockedTechIds = useGameStore((s) => s.unlockedTechIds);
  const activeInstrumentIds = useGameStore((s) => s.activeInstrumentIds);
  const tradeOffReport = useGameStore((s) => s.tradeOffReport);
  const sandboxUnrestricted = useGameStore((s) => s.sandboxUnrestricted);
  const beginnerGuidedMode = useGameStore((s) => s.beginnerGuidedMode);
  const teamMembers = useGameStore((s) => s.teamMembers);
  const instructorAssignments = useGameStore((s) => s.instructorAssignments);
  const activeAssignmentId = useGameStore((s) => s.activeAssignmentId);
  const architectRuns = useGameStore((s) => s.architectRuns);

  const equipSubsystem14 = useGameStore((s) => s.equipSubsystem14);
  const purchaseSubsystem14 = useGameStore((s) => s.purchaseSubsystem14);
  const unlockTechNode = useGameStore((s) => s.unlockTechNode);
  const toggleInstrumentSelection = useGameStore((s) => s.toggleInstrumentSelection);
  const toggleSandboxUnrestricted = useGameStore((s) => s.toggleSandboxUnrestricted);
  const toggleBeginnerGuidedMode = useGameStore((s) => s.toggleBeginnerGuidedMode);
  const applyNasaRecreation = useGameStore((s) => s.applyNasaRecreation);
  const setTeamMembers = useGameStore((s) => s.setTeamMembers);
  const addInstructorAssignment = useGameStore((s) => s.addInstructorAssignment);
  const applyInstructorAssignment = useGameStore((s) => s.applyInstructorAssignment);
  const flyToPlanet = useGameStore((s) => s.flyToPlanet);
  const landOnPlanet = useGameStore((s) => s.landOnPlanet);

  const [section, setSection] = useState<'subsystems' | 'tech' | 'nasa' | 'team' | 'classroom' | 'learn'>(initialSection);
  const [selectedCat, setSelectedCat] = useState<SubsystemCategory14>('propulsion');
  const [jsonShareText, setJsonShareText] = useState('');
  const [assignTitle, setAssignTitle] = useState('');
  const [assignPlanet, setAssignPlanet] = useState<PlanetId>('aetheris');
  const [assignBudget, setAssignBudget] = useState(400);
  const [assignScience, setAssignScience] = useState(85);
  const [assignReliability, setAssignReliability] = useState(75);

  if (!embedded && !systemsLabOpen) return null;

  const ar = lang === 'ar';
  const env = getPlanetEnvironment(activePlanet);
  const planetObj = PLANETS.find((p) => p.id === activePlanet) || PLANETS[0];

  const handleExportTeamJson = () => {
    const payload = {
      planetId: activePlanet,
      loadout: advancedLoadout,
      instruments: activeInstrumentIds,
      teamMembers,
    };
    setJsonShareText(JSON.stringify(payload, null, 2));
  };

  const handleImportTeamJson = () => {
    try {
      const parsed = JSON.parse(jsonShareText);
      if (parsed.loadout) {
        Object.values(parsed.loadout).forEach((id) => {
          if (typeof id === 'string') equipSubsystem14(id);
        });
      }
      if (Array.isArray(parsed.teamMembers)) {
        setTeamMembers(parsed.teamMembers);
      }
    } catch {
      // ignore invalid JSON quietly
    }
  };

  const handleCreateAssignment = () => {
    if (!assignTitle.trim()) return;
    const item: InstructorAssignment = {
      id: `assign_${Date.now()}`,
      title: { ar: assignTitle.trim(), en: assignTitle.trim() },
      targetPlanetId: assignPlanet,
      maxBudgetM: assignBudget,
      minSciencePts: assignScience,
      minReliabilityPct: assignReliability,
      requiredNotes: {
        ar: `تحقيق ${assignScience} علم ضمن ميزانية $${assignBudget}M على ${assignPlanet.toUpperCase()}`,
        en: `Achieve ${assignScience} science within $${assignBudget}M at ${assignPlanet.toUpperCase()}`,
      },
      createdAt: Date.now(),
    };
    addInstructorAssignment(item);
    applyInstructorAssignment(item.id);
    setAssignTitle('');
  };

  const body = (
    <div className="space-y-4">
      {/* Top KPI & Mode Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-cyan-400/30 bg-black/40 p-2.5 text-xs">
        <div className="flex flex-wrap items-center gap-3 font-mono-tech">
          <span className={`font-bold ${tradeOffReport.feasible ? 'text-emerald-300' : 'text-rose-400'}`}>
            {ar ? 'جاهزية:' : 'FEASIBILITY:'} {tradeOffReport.feasibilityScore}%
          </span>
          <span className="text-amber-300">CR {resources.credits}</span>
          <span className="text-violet-300">RP {researchPoints}</span>
          <span className="text-cyan-300">${tradeOffReport.totalCostM}M / ${tradeOffReport.maxBudgetM}M</span>
          <span className="text-slate-300">{tradeOffReport.wetMassKg} kg</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={toggleBeginnerGuidedMode}
            className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold ${
              beginnerGuidedMode ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-200' : 'border-amber-400/50 bg-amber-500/15 text-amber-200'
            }`}
          >
            {beginnerGuidedMode ? (ar ? 'وضع المبتدئ الموجّه ✓' : 'Guided Beginner ON') : ar ? 'وضع التحدي المحترف' : 'Hardcore Challenge'}
          </button>
          <button
            onClick={toggleSandboxUnrestricted}
            className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold ${
              sandboxUnrestricted ? 'border-violet-400 bg-violet-500/25 text-violet-100' : 'border-white/15 bg-white/5 text-slate-300'
            }`}
          >
            {sandboxUnrestricted ? (ar ? 'المختبر الحر Sandbox: مفتوح' : 'Unrestricted Sandbox ON') : ar ? 'فتح المختبر الحر' : 'Enable Sandbox'}
          </button>
        </div>
      </div>

      {/* Sub-navigation */}
      <div className="flex flex-wrap gap-1.5">
        {[
          { id: 'subsystems' as const, icon: Layers, ar: 'الأنظمة الـ 14 والمتجر', en: '14 Subsystems & Market' },
          { id: 'tech' as const, icon: FlaskConical, ar: 'شجرة التقنيات (8)', en: 'Tech Tree (8)' },
          { id: 'nasa' as const, icon: Rocket, ar: 'بعثات NASA (6)', en: 'NASA Missions (6)' },
          { id: 'team' as const, icon: Users, ar: 'الفريق التعاوني (4)', en: '4-Role Team' },
          { id: 'classroom' as const, icon: GraduationCap, ar: 'المعلم والمنافسة', en: 'Classroom & Ranks' },
          { id: 'learn' as const, icon: BookOpen, ar: 'القاموس الهندسي', en: 'Glossary & Guide' },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setSection(t.id)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
                section === t.id
                  ? 'border-cyan-400 bg-cyan-400 text-slate-950'
                  : 'border-white/15 bg-white/5 text-slate-200 hover:bg-white/10'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{ar ? t.ar : t.en}</span>
            </button>
          );
        })}
      </div>

      {/* SECTION 1: 14 SUBSYSTEMS + PLANETARY ENVIRONMENT + CONFLICTS */}
      {section === 'subsystems' && (
        <div className="space-y-3">
          {/* Planet Target & Environmental Profile */}
          <div className="nasa-card rounded-xl p-3 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                <Globe className="h-4 w-4" />
                <span>{ar ? `البيئة الفيزيائية للهدف: ${planetObj.name.ar}` : `Target Environment: ${planetObj.name.en}`}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {PLANETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      useGameStore.setState({ activePlanet: p.id, missionVizTargetPlanet: p.id });
                      equipSubsystem14(advancedLoadout.propulsion);
                      onDecisionEvent?.('planet', `تحليل بيئة ${p.name.ar}`, `Target Changed: ${p.name.en}`);
                    }}
                    className={`rounded border px-2 py-0.5 text-[10px] font-bold ${
                      activePlanet === p.id
                        ? 'border-amber-400 bg-amber-400 text-slate-950'
                        : 'border-white/10 bg-white/5 text-slate-300'
                    }`}
                  >
                    {p.name[lang]}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 font-mono-tech text-[10px]">
              <div className="rounded bg-black/40 p-2">
                <span className="text-slate-400">{ar ? 'الشمس / الطاقة:' : 'SOLAR FLUX:'}</span>{' '}
                <strong className="text-amber-300">{env.solarIrradianceWm2} W/m² ({Math.round(env.solarEfficiency * 100)}%)</strong>
              </div>
              <div className="rounded bg-black/40 p-2">
                <span className="text-slate-400">{ar ? 'الإشعاع:' : 'RAD DOSE:'}</span>{' '}
                <strong className={env.radiationKradYr > 40 ? 'text-rose-400' : 'text-cyan-300'}>{env.radiationKradYr} krad/yr</strong>
              </div>
              <div className="rounded bg-black/40 p-2">
                <span className="text-slate-400">{ar ? 'الحرارة والضغط:' : 'TEMP & BAR:'}</span>{' '}
                <strong className="text-emerald-300">{env.surfaceTempRangeC[0]}..{env.surfaceTempRangeC[1]}°C · {env.pressureBar} bar</strong>
              </div>
              <div className="rounded bg-black/40 p-2">
                <span className="text-slate-400">{ar ? 'الجاذبية / سرعة الروفر:' : 'GRAV / ROVER:'}</span>{' '}
                <strong className="text-violet-300">{env.gravityMs2} m/s² · {env.roverSpeedMult}x</strong>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300">
              <span>⚠ {env.primaryHazard[lang]}</span>
              <div className="flex gap-1.5">
                <button onClick={() => flyToPlanet(activePlanet, true)} className="rounded bg-cyan-400 px-2 py-0.5 text-[10px] font-bold text-slate-950">
                  {ar ? 'إقلاع للكوكب 3D' : 'Fly 3D'}
                </button>
                <button onClick={() => landOnPlanet(activePlanet)} className="rounded bg-emerald-400 px-2 py-0.5 text-[10px] font-bold text-slate-950">
                  {ar ? 'هبوط على السطح 3D' : 'Land 3D'}
                </button>
              </div>
            </div>
          </div>

          {/* 14 Categories + Items */}
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
            <div className="lg:col-span-4 space-y-1">
              {SUBSYSTEM_CATEGORIES_META.map((cat) => {
                const eqId = advancedLoadout[cat.id];
                const eqItem = SUBSYSTEM_CATALOG_14.find((x) => x.id === eqId);
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCat(cat.id)}
                    className={`flex w-full items-center justify-between rounded-lg border px-2.5 py-1.5 text-start text-xs transition ${
                      selectedCat === cat.id
                        ? 'border-cyan-400 bg-cyan-500/20 text-white'
                        : 'border-white/10 bg-black/35 text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <span className="font-bold truncate">{cat.name[lang]}</span>
                    <span className="ms-2 shrink-0 text-[10px] text-cyan-300 truncate max-w-[110px]">
                      {eqItem?.name[lang]}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="lg:col-span-8 space-y-2.5">
              {SUBSYSTEM_CATALOG_14.filter((item) => item.category === selectedCat).map((item) => {
                const isEquipped = advancedLoadout[selectedCat] === item.id;
                const isUnlocked = sandboxUnrestricted || unlockedSubsystemIds.includes(item.id);
                const costCr = Math.round(item.costM * 1.4);
                return (
                  <div
                    key={item.id}
                    className={`nasa-card rounded-xl p-3 ${isEquipped ? 'border-emerald-400/70 bg-emerald-950/25' : ''}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{item.name[lang]}</span>
                          <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono-tech text-[9px] text-cyan-300">
                            Tier {item.techTier}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-300">{item.desc[lang]}</p>
                      </div>

                      {isEquipped ? (
                        <span className="flex items-center gap-1 rounded bg-emerald-400 px-2.5 py-1 text-[10px] font-bold text-slate-950">
                          <Check className="h-3 w-3" /> {ar ? 'مركب' : 'EQUIPPED'}
                        </span>
                      ) : isUnlocked ? (
                        <button
                          onClick={() => {
                            equipSubsystem14(item.id);
                            onDecisionEvent?.('blueprint', `تركيب ${item.name.ar} على التوأم 3D`, `Equipped ${item.name.en}`);
                          }}
                          className="rounded bg-cyan-400 px-3 py-1 text-[10px] font-bold text-slate-950 hover:brightness-110"
                        >
                          {ar ? 'تركيب الآن' : 'Equip'}
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (purchaseSubsystem14(item.id)) {
                              onDecisionEvent?.('blueprint', `شراء وتركيب ${item.name.ar}`, `Unlocked ${item.name.en}`);
                            }
                          }}
                          className="flex items-center gap-1 rounded border border-amber-400/50 bg-amber-500/20 px-2.5 py-1 text-[10px] font-bold text-amber-200 hover:bg-amber-500/30"
                        >
                          <Lock className="h-3 w-3" />
                          <span>{ar ? `شراء (${costCr} CR)` : `Buy (${costCr} CR)`}</span>
                        </button>
                      )}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2 font-mono-tech text-[10px] text-slate-300">
                      <span>{item.massKg} kg</span>
                      <span className={item.powerDeltaW >= 0 ? 'text-emerald-300' : 'text-amber-300'}>
                        {item.powerDeltaW >= 0 ? `+${item.powerDeltaW}` : item.powerDeltaW} W
                      </span>
                      <span className="text-cyan-300">${item.costM}M</span>
                      {item.deltaVKms > 0 && <span>Δv {item.deltaVKms} km/s</span>}
                      {item.dataCapMbDay > 0 && <span>TX {item.dataCapMbDay} MB/d</span>}
                      {item.storageCapMb > 0 && <span>SSR {item.storageCapMb} MB</span>}
                      {item.radShieldKrad > 0 && <span>+{item.radShieldKrad} krad</span>}
                      {item.thermalResistK > 0 && <span>+{item.thermalResistK}K</span>}
                    </div>
                  </div>
                );
              })}

              {/* Payload Instruments Picker */}
              <div className="nasa-card rounded-xl p-3">
                <div className="mb-2 text-xs font-bold text-violet-300">
                  {ar ? 'الأجهزة العلمية المختارة (تزيد العلم والكتلة والبيانات):' : 'Scientific Payload Selection (Trade-off: Science vs Mass/Power/Data):'}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {INSTRUMENT_OPTIONS.map((inst) => {
                    const active = activeInstrumentIds.includes(inst.id);
                    return (
                      <button
                        key={inst.id}
                        onClick={() => {
                          toggleInstrumentSelection(inst.id);
                          onDecisionEvent?.('science', `تعديل جهاز ${inst.name.ar}`, `Toggled ${inst.name.en}`);
                        }}
                        className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold ${
                          active
                            ? 'border-violet-400 bg-violet-500/25 text-white'
                            : 'border-white/10 bg-white/5 text-slate-300'
                        }`}
                      >
                        {active ? '✓ ' : '+ '}
                        {inst.name[lang]} ({inst.massKg}kg · {inst.dataMbDay}MB/d)
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Engineering Conflict & Compatibility Analyzer */}
          <div className="rounded-xl border border-white/15 bg-black/45 p-3 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-1.5 text-amber-300">
                <AlertOctagon className="h-4 w-4" />
                {ar ? 'محلل التعارضات والتوافق الهندسي' : 'Engineering Conflicts & Compatibility Analyzer'}
              </span>
              <span className="font-mono-tech text-[10px] text-slate-400">
                {tradeOffReport.dataSourceLegend.physicsModel}
              </span>
            </div>

            {tradeOffReport.conflicts.length === 0 && tradeOffReport.compatibilityIssues.length === 0 ? (
              <div className="rounded-lg border border-emerald-400/35 bg-emerald-500/15 px-3 py-2 text-xs text-emerald-200">
                {ar
                  ? '✓ التصميم متوافق ومتوازن بالكامل — الكتلة والطاقة والاتصالات والحرارة ضمن الحدود الآمنة.'
                  : '✓ Architecture passes all engineering feasibility & compatibility checks!'}
              </div>
            ) : (
              <div className="space-y-1.5">
                {tradeOffReport.compatibilityIssues.map((issue, idx) => (
                  <div key={idx} className="rounded-lg border border-rose-400/50 bg-rose-950/35 px-3 py-1.5 text-xs text-rose-200">
                    ⚠ {issue}
                  </div>
                ))}
                {tradeOffReport.conflicts.map((c) => (
                  <div
                    key={c.id}
                    className={`rounded-lg border px-3 py-2 text-xs ${
                      c.severity === 'critical'
                        ? 'border-rose-400/55 bg-rose-950/40 text-rose-100'
                        : 'border-amber-400/45 bg-amber-950/30 text-amber-100'
                    }`}
                  >
                    <div className="font-bold">{c.title[lang]}</div>
                    <div className="mt-0.5 text-[11px] opacity-90">{c.explanation[lang]}</div>
                    <div className="mt-1 text-[10px] text-cyan-300">
                      💡 {c.fixHint[lang]}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 2: 8-NODE TECH TREE */}
      {section === 'tech' && (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {TECH_TREE_NODES.map((node) => {
            const unlocked = unlockedTechIds.includes(node.id);
            const prereqMet = !node.prereqTechId || unlockedTechIds.includes(node.prereqTechId);
            return (
              <div
                key={node.id}
                className={`nasa-card rounded-xl p-3 ${unlocked ? 'border-emerald-400/60 bg-emerald-950/20' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[10px] font-mono-tech text-cyan-400">{node.categoryLabel[lang]}</div>
                    <div className="text-xs font-bold text-white">{node.name[lang]}</div>
                  </div>
                  <span className="rounded bg-violet-500/20 px-2 py-0.5 font-mono-tech text-[10px] font-bold text-violet-200">
                    {node.rpCost} RP
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-300">{node.desc[lang]}</p>
                <div className="mt-2.5 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    {node.prereqTechId ? `${ar ? 'يتطلب:' : 'Req:'} ${node.prereqTechId}` : ar ? 'تقنية أساسية' : 'Root Tech'}
                  </span>
                  {unlocked ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-300">
                      <Unlock className="h-3.5 w-3.5" /> {ar ? 'مفتوحة' : 'UNLOCKED'}
                    </span>
                  ) : (
                    <button
                      onClick={() => unlockTechNode(node.id)}
                      disabled={!prereqMet}
                      className="rounded bg-violet-400 px-3 py-1 text-[11px] font-bold text-slate-950 disabled:opacity-40"
                    >
                      {ar ? 'بحث وتطوير' : 'Research'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SECTION 3: 6 REAL NASA RECREATION MISSIONS */}
      {section === 'nasa' && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {NASA_RECREATION_MISSIONS.map((m) => (
            <div key={m.id} className="nasa-card flex flex-col justify-between rounded-xl p-3.5 space-y-2">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono-tech text-[10px] text-amber-300">{m.agencyYear}</span>
                  <span className="rounded bg-cyan-500/15 px-1.5 py-0.5 text-[9px] text-cyan-200">{m.planetId.toUpperCase()}</span>
                </div>
                <h4 className="mt-0.5 text-sm font-bold text-white">{m.name[lang]}</h4>
                <p className="mt-1 text-[11px] text-slate-300">{m.historicalContext[lang]}</p>
                <div className="mt-2 grid grid-cols-2 gap-1 rounded bg-black/40 p-2 font-mono-tech text-[10px] text-slate-300">
                  <div>Mass: {m.referenceSpecs.launchMassKg} kg</div>
                  <div>Power: {m.referenceSpecs.powerSource}</div>
                  <div>Band: {m.referenceSpecs.commsBand}</div>
                  <div>Ref Δv: {m.referenceSpecs.deltaVKms} km/s</div>
                </div>
                <div className="mt-1.5 text-[10px] text-amber-200">⚠ {m.constraints[lang]}</div>
                <div className="mt-1 text-[9px] text-slate-400 italic">{m.disclaimer[lang]}</div>
              </div>
              <button
                onClick={() => {
                  applyNasaRecreation(m.id);
                  onDecisionEvent?.('blueprint', `تحميل بعثة ${m.name.ar}`, `Loaded ${m.name.en}`);
                }}
                className="w-full rounded-lg bg-cyan-400 py-1.5 text-xs font-bold text-slate-950 hover:brightness-110"
              >
                {ar ? 'تحميل البعثة إلى التوأم 2D و 3D' : 'Load Reference Architecture into 2D & 3D'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* SECTION 4: 4-ROLE COOPERATIVE TEAM */}
      {section === 'team' && (
        <div className="space-y-3">
          <div className="rounded-lg border border-cyan-400/35 bg-cyan-950/25 px-3 py-2 text-xs text-cyan-100">
            {ar
              ? 'وضع الفريق التعاوني (Pass-and-Play / مشاركة JSON محلياً): كل دور مسؤول عن أنظمته قبل توقيع الإطلاق النهائي.'
              : 'Cooperative Engineering Team (Local Pass-and-Play & JSON Design Share): Each role signs off on their domain before launch.'}
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {teamMembers.map((m, idx) => {
              const info = ROLE_LABELS[m.role];
              return (
                <div key={m.id} className="nasa-card rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-cyan-300">{ar ? info.ar : info.en}</span>
                    <button
                      onClick={() => {
                        const next: CooperativeTeamMember[] = teamMembers.map((x, i) =>
                          i === idx ? { ...x, approved: !x.approved } : x
                        );
                        setTeamMembers(next);
                      }}
                      className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                        m.approved ? 'bg-emerald-400 text-slate-950' : 'border border-white/20 bg-white/5 text-slate-300'
                      }`}
                    >
                      {m.approved ? (ar ? 'موافق ✓' : 'SIGNED OFF ✓') : ar ? 'بانتظار التوقيع' : 'Approve Role'}
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-300">{ar ? info.scopeAr : info.scopeEn}</div>
                  <input
                    type="text"
                    value={m.name}
                    onChange={(e) => {
                      const next = teamMembers.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x));
                      setTeamMembers(next);
                    }}
                    className="w-full rounded border border-white/15 bg-black/50 px-2.5 py-1 text-xs text-white outline-none focus:border-cyan-400"
                  />
                </div>
              );
            })}
          </div>

          <div className="nasa-card rounded-xl p-3 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-white">{ar ? 'مشاركة تصميم الفريق (JSON)' : 'Share Team Blueprint (JSON)'}</span>
              <div className="flex gap-2">
                <button onClick={handleExportTeamJson} className="flex items-center gap-1 rounded bg-cyan-400 px-2.5 py-1 text-[10px] font-bold text-slate-950">
                  <Download className="h-3 w-3" /> {ar ? 'توليد JSON' : 'Generate JSON'}
                </button>
                <button onClick={handleImportTeamJson} className="flex items-center gap-1 rounded border border-emerald-400/50 bg-emerald-500/20 px-2.5 py-1 text-[10px] font-bold text-emerald-200">
                  <Upload className="h-3 w-3" /> {ar ? 'استيراد JSON' : 'Import JSON'}
                </button>
              </div>
            </div>
            <textarea
              value={jsonShareText}
              onChange={(e) => setJsonShareText(e.target.value)}
              rows={4}
              placeholder={ar ? 'اضغط توليد JSON لمشاركته مع زميلك أو الصق JSON مستلم هنا...' : 'Click Generate JSON to export or paste teammate JSON here...'}
              className="w-full rounded border border-white/15 bg-black/60 p-2 font-mono-tech text-[10px] text-cyan-200 outline-none"
            />
          </div>
        </div>
      )}

      {/* SECTION 5: CLASSROOM & COMPETITION */}
      {section === 'classroom' && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="nasa-card rounded-xl p-3 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
              <GraduationCap className="h-4 w-4" />
              <span>{ar ? 'لوحة المعلم والواجبات (Classroom Assignments)' : 'Instructor Assignments'}</span>
            </div>
            <div className="space-y-1.5">
              {instructorAssignments.map((a) => (
                <div
                  key={a.id}
                  className={`rounded-lg border p-2.5 text-xs ${
                    activeAssignmentId === a.id ? 'border-emerald-400 bg-emerald-950/30' : 'border-white/10 bg-black/35'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-white">{a.title[lang]}</span>
                    <button
                      onClick={() => applyInstructorAssignment(a.id)}
                      className="rounded bg-emerald-400 px-2 py-0.5 text-[10px] font-bold text-slate-950"
                    >
                      {ar ? 'بدء الواجب' : 'Load Lab'}
                    </button>
                  </div>
                  <div className="mt-1 text-[10px] text-slate-300">{a.requiredNotes[lang]}</div>
                  <div className="mt-1 font-mono-tech text-[10px] text-cyan-300">
                    Target: {a.targetPlanetId.toUpperCase()} · Max ${a.maxBudgetM}M · Min Sci {a.minSciencePts} · Min Rel {a.minReliabilityPct}%
                  </div>
                </div>
              ))}
            </div>

            {/* Create Assignment */}
            <div className="border-t border-white/10 pt-2 space-y-1.5 text-[11px]">
              <div className="font-bold text-amber-200">{ar ? '+ إنشاء واجب تعليمي جديد' : '+ Create Custom Instructor Lab'}</div>
              <input
                type="text"
                value={assignTitle}
                onChange={(e) => setAssignTitle(e.target.value)}
                placeholder={ar ? 'اسم الواجب (مثال: مسبار نبتون بميزانية محدودة)' : 'Assignment title...'}
                className="w-full rounded border border-white/15 bg-black/50 px-2.5 py-1 text-xs text-white"
              />
              <div className="grid grid-cols-4 gap-1.5 font-mono-tech text-[10px]">
                <select
                  value={assignPlanet}
                  onChange={(e) => setAssignPlanet(e.target.value as PlanetId)}
                  className="rounded border border-white/15 bg-slate-950 px-1.5 py-1 text-white"
                >
                  {PLANETS.map((p) => (
                    <option key={p.id} value={p.id}>{p.id}</option>
                  ))}
                </select>
                <input type="number" value={assignBudget} onChange={(e) => setAssignBudget(Number(e.target.value))} className="rounded border border-white/15 bg-black/50 px-1.5 py-1 text-white" title="Max $M" />
                <input type="number" value={assignScience} onChange={(e) => setAssignScience(Number(e.target.value))} className="rounded border border-white/15 bg-black/50 px-1.5 py-1 text-white" title="Min Science" />
                <input type="number" value={assignReliability} onChange={(e) => setAssignReliability(Number(e.target.value))} className="rounded border border-white/15 bg-black/50 px-1.5 py-1 text-white" title="Min Reliability" />
              </div>
              <button onClick={handleCreateAssignment} className="w-full rounded bg-amber-400 py-1 text-xs font-bold text-slate-950">
                {ar ? 'إضافة وتفعيل الواجب' : 'Add & Activate Assignment'}
              </button>
            </div>
          </div>

          {/* Competition Leaderboard */}
          <div className="nasa-card rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
              <Award className="h-4 w-4" />
              <span>{ar ? 'قائمة المتصدرين وكفاءة التصميم' : 'Mission Efficiency Leaderboard'}</span>
            </div>
            <div className="space-y-1.5 max-h-72 overflow-y-auto">
              {[...architectRuns]
                .sort((a, b) => b.score - a.score)
                .slice(0, 8)
                .map((run, i) => (
                  <div key={run.id} className="flex items-center justify-between rounded border border-white/10 bg-black/35 px-2.5 py-1.5 text-[11px]">
                    <div>
                      <span className="font-mono-tech font-bold text-amber-300 me-2">#{i + 1}</span>
                      <span className="font-bold text-white">{run.teamName}</span>
                      <span className="ms-2 text-[10px] text-slate-400">{run.orbitName}</span>
                    </div>
                    <div className="font-mono-tech text-cyan-300 font-bold">
                      {run.score} pts ({run.grade})
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 6: GLOSSARY & GUIDED LEARNING */}
      {section === 'learn' && (
        <div className="space-y-2.5">
          {beginnerGuidedMode && (
            <div className="rounded-xl border border-emerald-400/40 bg-emerald-950/30 p-3 text-xs text-emerald-100">
              <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                <Sparkles className="h-4 w-4" />
                <span>{ar ? 'دليل المبتدئ الموجّه:' : 'Beginner Guided Mission Tips:'}</span>
              </div>
              <p className="mt-1">
                {ar
                  ? '1) اختر الكوكب وشاهد إشعاعه وطاقة الشمس. 2) إذا ذهبْت إلى المريخ أو أوروبا أو نبتون استبدل الألواح الشمسية بـ MMRTG النووي. 3) وازن بيانات الأجهزة مع سعة هوائي الاتصالات.'
                  : '1) Pick target planet & inspect solar/radiation dose. 2) Beyond Mars, swap Solar Wings for MMRTG nuclear power. 3) Keep Data Generation ≤ Antenna Downlink Capacity.'}
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {ENGINEERING_GLOSSARY.map((g) => (
              <div key={g.term} className="nasa-card rounded-xl p-3 space-y-1">
                <div className="font-mono-tech text-[10px] text-cyan-400">{g.term}</div>
                <div className="text-xs font-bold text-white">{g.title[lang]}</div>
                <p className="text-[11px] text-slate-300">{g.explanation[lang]}</p>
                <div className="text-[10px] text-amber-300">★ {g.missionImpact[lang]}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  if (embedded) return body;

  return (
    <div className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center bg-black/80 p-3 sm:p-5">
      <div className="nova-panel flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-cyan-400/45">
        <div className="flex items-center justify-between border-b border-white/10 bg-[#070b14] px-4 py-3">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-cyan-300" />
            <div>
              <h2 className="font-display text-base font-bold text-white">
                {ar ? 'مختبر الأنظمة الـ 14 والتقنيات وبعثات NASA' : '14-Subsystem Lab, Tech Tree & NASA Recreations'}
              </h2>
              <p className="text-[11px] text-cyan-300">
                {ar ? 'كل تعديل يتزامن فورياً مع التوأم الرقمي 3D ومحرك المقايضات' : 'Every change updates the Trade-Off Engine & 3D Digital Twin live'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSystemsLabOpen(false)}
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
