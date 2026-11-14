import {
  AlertTriangle,
  Archive,
  Download,
  FileText,
  Printer,
  ShieldAlert,
  Wrench,
  X,
} from 'lucide-react';
import {
  buildMissionPerformanceReport,
  generateFailureInvestigationReport,
} from '../engine/missionOpsEngine';
import { useGameStore } from '../store/gameStore';

interface FailureAndReportPanelProps {
  embedded?: boolean;
  compact?: boolean;
}

export function FailureAndReportPanel({
  embedded = false,
  compact = false,
}: FailureAndReportPanelProps) {
  const lang = useGameStore((s) => s.lang);
  const reportOpen = useGameStore((s) => s.reportOpen);
  const setReportOpen = useGameStore((s) => s.setReportOpen);
  const activePlanet = useGameStore((s) => s.activePlanet);
  const shuttleCustomName = useGameStore((s) => s.shuttleCustomName);
  const advancedLoadout = useGameStore((s) => s.advancedLoadout);
  const tradeOffReport = useGameStore((s) => s.tradeOffReport);
  const resources = useGameStore((s) => s.resources);
  const fuelPct = useGameStore((s) => s.fuelPct);
  const hullIntegrity = useGameStore((s) => s.hullIntegrity);
  const internalTempC = useGameStore((s) => s.internalTempC);
  const survivalScore = useGameStore((s) => s.survivalScore);
  const missionPlan = useGameStore((s) => s.missionPlan);
  const missionTimelineLog = useGameStore((s) => s.missionTimelineLog);
  const failureInvestigationReport = useGameStore((s) => s.failureInvestigationReport);
  const performanceHistory = useGameStore((s) => s.performanceHistory);
  const recordPerformanceSnapshot = useGameStore((s) => s.recordPerformanceSnapshot);
  const setSystemsLabOpen = useGameStore((s) => s.setSystemsLabOpen);
  const setWhatIfOpen = useGameStore((s) => s.setWhatIfOpen);

  if (!embedded && !compact && !reportOpen) return null;

  const ar = lang === 'ar';

  const latestReport =
    performanceHistory[0] ||
    buildMissionPerformanceReport({
      versionLabel: `Live (${shuttleCustomName})`,
      planetId: activePlanet,
      objective: missionPlan.objective,
      loadout: advancedLoadout,
      tradeOff: tradeOffReport,
      resources,
      fuelPct,
      hullIntegrity,
      score: Math.max(100, survivalScore + tradeOffReport.scienceValue * 4),
      grade: tradeOffReport.feasibilityScore >= 85 ? 'S' : tradeOffReport.feasibilityScore >= 70 ? 'A' : tradeOffReport.feasibilityScore >= 50 ? 'B' : 'C',
      incidents: missionTimelineLog.slice(-4).map((l) => l.summary[lang]),
    });

  const activeForensics =
    failureInvestigationReport ||
    (tradeOffReport.conflicts.length > 0 || hullIntegrity < 60
      ? generateFailureInvestigationReport({
          reason: {
            ar: 'تحقيق استباقي في مخاطر التصميم والتعارضات الهندسية الحالية.',
            en: 'Proactive Risk Forensics on current spacecraft conflicts.',
          },
          planetId: activePlanet,
          loadout: advancedLoadout,
          tradeOff: tradeOffReport,
          resources,
          fuelPct,
          hullIntegrity,
          internalTempC,
          timelineLog: missionTimelineLog,
        })
      : null);

  const handlePrintPdf = () => {
    window.print();
  };

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify({ latestReport, performanceHistory, forensics: activeForensics }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nova-mission-report-${activePlanet}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadHtml = () => {
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>NOVA Mission Report - ${latestReport.versionLabel}</title><style>body{font-family:system-ui,sans-serif;max-width:860px;margin:24px auto;padding:16px;color:#0f172a}h1{margin-bottom:4px}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:16px 0}.box{border:1px solid #cbd5e1;padding:10px;border-radius:8px}table{width:100%;border-collapse:collapse;margin-top:14px}th,td{border:1px solid #cbd5e1;padding:8px;text-align:left}</style></head><body><h1>NOVA: Beyond the Unknown — Mission Performance Report</h1><p><strong>Version:</strong> ${latestReport.versionLabel} | <strong>Orbit:</strong> ${latestReport.orbitSummary} | <strong>Grade:</strong> ${latestReport.finalGrade} (${latestReport.score} pts)</p><div class="grid"><div class="box"><strong>Science Achieved</strong><div>${latestReport.scienceAchieved}</div></div><div class="box"><strong>Total Cost / Budget</strong><div>$${latestReport.totalCostM}M / $${latestReport.budgetCeilingM}M</div></div><div class="box"><strong>Power / Comms Eff</strong><div>${latestReport.powerEfficiencyPct}% / ${latestReport.commsPerformancePct}%</div></div></div><h3>Subsystems Health</h3><table><tr><th>Subsystem</th><th>Status</th><th>Health</th></tr>${latestReport.subsystemStatus.map((s) => `<tr><td>${s.name}</td><td>${s.status}</td><td>${s.healthPct}%</td></tr>`).join('')}</table><h3>Recommendations</h3><ul>${latestReport.recommendations.map((r) => `<li>${r[lang]}</li>`).join('')}</ul></body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nova-mission-report-${activePlanet}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const body = (
    <div className="nova-print-report space-y-4">
      {/* Failure Investigation Section */}
      {activeForensics && (
        <div className="rounded-xl border border-rose-500/55 bg-rose-950/35 p-3.5 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
              <ShieldAlert className="h-4 w-4" />
              <span>
                {failureInvestigationReport
                  ? ar
                    ? 'تقرير التحقيق في فشل المهمة (Root Cause Forensics)'
                    : 'Mission Failure Investigation Report'
                  : ar
                    ? 'فحص استباقي لنقاط الضعف الحرجة'
                    : 'Proactive Failure-Risk Forensics'}
              </span>
            </div>
            <span className="rounded bg-rose-500/25 px-2 py-0.5 font-mono-tech text-[10px] font-bold text-rose-200">
              {activeForensics.failedSubsystem}
            </span>
          </div>

          <p className="text-xs text-rose-100">{activeForensics.rootCause[lang]}</p>

          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 font-mono-tech text-[10px]">
            <div className="rounded bg-black/40 p-1.5">BAT: {activeForensics.preFailureSnapshot.battery}%</div>
            <div className="rounded bg-black/40 p-1.5">FUEL: {activeForensics.preFailureSnapshot.fuelPct}%</div>
            <div className="rounded bg-black/40 p-1.5">HULL: {activeForensics.preFailureSnapshot.hullIntegrity}%</div>
            <div className="rounded bg-black/40 p-1.5">TEMP: {activeForensics.preFailureSnapshot.internalTempC}°C</div>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-[11px]">
            <div className="rounded-lg border border-white/10 bg-black/35 p-2.5 space-y-1">
              <div className="font-bold text-amber-300">{ar ? 'القرارات الهندسية المساهمة:' : 'Contributing Engineering Decisions:'}</div>
              {activeForensics.contributingDecisions.map((d, idx) => (
                <div key={idx} className="text-slate-200">• {d[lang]}</div>
              ))}
            </div>
            <div className="rounded-lg border border-white/10 bg-black/35 p-2.5 space-y-1">
              <div className="font-bold text-emerald-300">{ar ? 'التحسينات الموصى بها:' : 'Recommended Engineering Fixes:'}</div>
              {activeForensics.recommendedImprovements.map((imp, idx) => (
                <div key={idx} className="text-cyan-200">✓ {imp[lang]}</div>
              ))}
            </div>
          </div>

          {!compact && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setReportOpen(false);
                  setSystemsLabOpen(true);
                }}
                className="flex items-center gap-1 rounded bg-cyan-400 px-3 py-1 text-[11px] font-bold text-slate-950"
              >
                <Wrench className="h-3 w-3" /> {ar ? 'إصلاح في الأنظمة 14' : 'Fix in 14-Subsystem Lab'}
              </button>
              <button
                onClick={() => {
                  setReportOpen(false);
                  setWhatIfOpen(true);
                }}
                className="flex items-center gap-1 rounded border border-amber-400/50 bg-amber-500/20 px-3 py-1 text-[11px] font-bold text-amber-200"
              >
                <AlertTriangle className="h-3 w-3" /> {ar ? 'اختبار في What-If' : 'Stress Test in What-If'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Performance Report & Actions */}
      <div className="nasa-card rounded-xl p-3.5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="font-mono-tech text-[10px] text-cyan-400">
              {latestReport.versionLabel} · {latestReport.orbitSummary}
            </div>
            <h3 className="text-sm font-bold text-white">
              {ar ? 'تقرير أداء المهمة وتقييم الأنظمة' : 'Mission Performance Report & System Audit'}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 print:hidden">
            <button
              onClick={() => recordPerformanceSnapshot()}
              className="flex items-center gap-1 rounded bg-emerald-400 px-2.5 py-1 text-[10px] font-bold text-slate-950"
            >
              <Archive className="h-3 w-3" /> {ar ? 'حفظ نسخة للمقارنة' : 'Archive Version'}
            </button>
            <button
              onClick={handlePrintPdf}
              className="flex items-center gap-1 rounded border border-cyan-400/50 bg-cyan-500/20 px-2.5 py-1 text-[10px] font-bold text-cyan-200"
            >
              <Printer className="h-3 w-3" /> {ar ? 'طباعة / حفظ PDF' : 'Print / Save PDF'}
            </button>
            <button
              onClick={handleDownloadHtml}
              className="flex items-center gap-1 rounded border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] font-bold text-slate-200"
            >
              <Download className="h-3 w-3" /> HTML
            </button>
            <button
              onClick={handleDownloadJson}
              className="flex items-center gap-1 rounded border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] font-bold text-slate-200"
            >
              <Download className="h-3 w-3" /> JSON
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 font-mono-tech text-[11px]">
          <div className="rounded bg-black/35 p-2">
            <div className="text-[9px] text-slate-400">{ar ? 'الدرجة' : 'GRADE'}</div>
            <div className="text-lg font-bold text-amber-300">{latestReport.finalGrade} ({latestReport.score})</div>
          </div>
          <div className="rounded bg-black/35 p-2">
            <div className="text-[9px] text-slate-400">{ar ? 'العلم المحقق' : 'SCIENCE'}</div>
            <div className="text-base font-bold text-emerald-300">{latestReport.scienceAchieved}</div>
          </div>
          <div className="rounded bg-black/35 p-2">
            <div className="text-[9px] text-slate-400">{ar ? 'التكلفة / السقف' : 'COST / CAP'}</div>
            <div className="text-base font-bold text-cyan-300">${latestReport.totalCostM}M / ${latestReport.budgetCeilingM}M</div>
          </div>
          <div className="rounded bg-black/35 p-2">
            <div className="text-[9px] text-slate-400">{ar ? 'كفاءة الطاقة / DSN' : 'PWR / COMMS'}</div>
            <div className="text-base font-bold text-violet-300">{latestReport.powerEfficiencyPct}% / {latestReport.commsPerformancePct}%</div>
          </div>
          <div className="rounded bg-black/35 p-2">
            <div className="text-[9px] text-slate-400">{ar ? 'العمر التقديري' : 'LIFETIME'}</div>
            <div className="text-base font-bold text-white">{latestReport.missionLifetimeYrs} yr</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 text-[11px]">
          {latestReport.subsystemStatus.map((sub) => (
            <div key={sub.name} className="rounded-lg border border-white/10 bg-black/30 p-2">
              <div className="font-bold text-white truncate">{sub.name}</div>
              <div className={`font-mono-tech text-[10px] font-bold ${
                sub.status === 'NOMINAL' ? 'text-emerald-300' : sub.status === 'DEGRADED' ? 'text-amber-300' : 'text-rose-400'
              }`}>
                {sub.status} · {sub.healthPct}%
              </div>
            </div>
          ))}
        </div>

        {/* Multi-Version Diff History */}
        {performanceHistory.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-xs font-bold text-cyan-300">
              {ar ? 'مقارنة النسخ المحفوظة للمهمة (Multi-Version Comparison)' : 'Saved Mission Versions Comparison'}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] font-mono-tech">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 text-[10px]">
                    <th className="py-1 text-start">VERSION</th>
                    <th className="py-1 text-center">PLANET</th>
                    <th className="py-1 text-center">SCI</th>
                    <th className="py-1 text-center">COST</th>
                    <th className="py-1 text-center">PWR/COMMS</th>
                    <th className="py-1 text-end">GRADE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {performanceHistory.slice(0, 6).map((rep) => (
                    <tr key={rep.id}>
                      <td className="py-1 text-white">{rep.versionLabel}</td>
                      <td className="py-1 text-center text-cyan-300">{rep.planetId.toUpperCase()}</td>
                      <td className="py-1 text-center text-emerald-300">{rep.scienceAchieved}</td>
                      <td className="py-1 text-center text-amber-300">${rep.totalCostM}M</td>
                      <td className="py-1 text-center">{rep.powerEfficiencyPct}% / {rep.commsPerformancePct}%</td>
                      <td className="py-1 text-end font-bold text-amber-300">{rep.finalGrade} ({rep.score})</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (embedded || compact) return body;

  return (
    <div className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center bg-black/80 p-3 sm:p-5 print:static print:bg-white print:p-0">
      <div className="nova-panel flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-cyan-400/45 print:max-h-none print:border-none print:shadow-none">
        <div className="flex items-center justify-between border-b border-white/10 bg-[#070b14] px-4 py-3 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-cyan-300" />
            <div>
              <h2 className="font-display text-base font-bold text-white">
                {ar ? 'تحقيقات الفشل وتقرير الأداء والمقارنة' : 'Failure Forensics & Mission Performance Report'}
              </h2>
              <p className="text-[11px] text-cyan-300">
                {ar ? 'طباعة PDF، تصدير HTML/JSON، ومقارنة النسخ' : 'Print/PDF, HTML/JSON Export & Multi-Version Diff'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setReportOpen(false)}
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
