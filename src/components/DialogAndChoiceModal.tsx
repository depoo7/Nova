import { AlertTriangle, Sparkles } from 'lucide-react';
import { useGameStore } from '../store/gameStore';

export function DialogAndChoiceModal() {
  const lang = useGameStore((s) => s.lang);
  const emergency = useGameStore((s) => s.emergency);
  const activeChoice = useGameStore((s) => s.activeChoice);
  const resolveEmergency = useGameStore((s) => s.resolveEmergency);
  const resolveChoiceOption = useGameStore((s) => s.resolveChoiceOption);

  return (
    <>
      {emergency && (
        <div className="pointer-events-auto absolute top-20 start-1/2 z-30 w-full max-w-md -translate-x-1/2 px-4">
          <div className="nova-panel-amber rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />
              <div className="flex-1">
                <h4 className="text-sm font-bold text-amber-200">{emergency.title[lang]}</h4>
                <p className="mt-1 text-xs text-slate-300">{emergency.description[lang]}</p>
                <button
                  onClick={resolveEmergency}
                  className="mt-3 rounded-xl bg-amber-500 px-4 py-1.5 text-xs font-bold text-slate-950"
                >
                  {emergency.actionLabel[lang]}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeChoice && (
        <div className="pointer-events-auto absolute inset-0 z-40 flex items-center justify-center bg-black/75 p-4">
          <div className="nova-panel w-full max-w-xl rounded-3xl p-6">
            <div className="mb-3 flex items-center gap-2 text-violet-300">
              <Sparkles className="h-5 w-5" />
              <span className="font-mono-tech text-xs uppercase tracking-wider">
                NOVA DECISION PROTOCOL
              </span>
            </div>
            <h3 className="font-display text-xl font-bold text-white">
              {activeChoice.title[lang]}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              {activeChoice.prompt[lang]}
            </p>

            <div className="mt-5 space-y-2.5">
              {activeChoice.options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => resolveChoiceOption(opt.id)}
                  className="w-full rounded-2xl border border-white/15 bg-white/5 p-4 text-start transition hover:border-cyan-400/60 hover:bg-cyan-500/10"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-bold text-white">{opt.label[lang]}</span>
                    <span className="rounded-lg bg-cyan-500/15 px-2.5 py-0.5 text-[11px] font-bold text-cyan-300">
                      {opt.effectSummary[lang]}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{opt.description[lang]}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
