import React from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react';
import type { VirtualFlightInput } from '../three/NovaViewportEngine';
import type { Language } from '../types/game';

interface VirtualFlightPadProps {
  lang: Language;
  value: VirtualFlightInput;
  onChange: (next: VirtualFlightInput) => void;
}

export const VirtualFlightPad: React.FC<VirtualFlightPadProps> = ({
  lang,
  value,
  onChange,
}) => {
  const holdBtn = (patch: Partial<VirtualFlightInput>, reset: Partial<VirtualFlightInput>) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      onChange({ ...value, ...patch });
    },
    onPointerUp: () => onChange({ ...value, ...reset }),
    onPointerLeave: () => onChange({ ...value, ...reset }),
    onPointerCancel: () => onChange({ ...value, ...reset }),
  });

  return (
    <div className="nova-panel flex items-center gap-3 rounded-2xl p-2.5">
      <div className="grid grid-cols-3 gap-1">
        <div />
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-200 active:bg-cyan-500 active:text-slate-950"
          {...holdBtn({ pitch: 1 }, { pitch: 0 })}
        >
          <ArrowUp className="h-4 w-4" />
        </button>
        <div />

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-200 active:bg-cyan-500 active:text-slate-950"
          {...holdBtn({ yaw: 1 }, { yaw: 0 })}
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-200 active:bg-cyan-500 active:text-slate-950"
          {...holdBtn({ pitch: -1 }, { pitch: 0 })}
        >
          <ArrowDown className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-200 active:bg-cyan-500 active:text-slate-950"
          {...holdBtn({ yaw: -1 }, { yaw: 0 })}
        >
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-col gap-1">
        <button
          type="button"
          className="h-10 rounded-xl border border-cyan-500/40 bg-cyan-500/15 px-3 text-xs font-bold text-cyan-300 active:bg-cyan-500 active:text-slate-950"
          {...holdBtn({ thrust: 1 }, { thrust: 0 })}
        >
          {lang === 'ar' ? 'دفع' : 'THRUST'}
        </button>
        <button
          type="button"
          className="h-10 rounded-xl border border-slate-700 bg-slate-900 px-3 text-xs font-bold text-slate-300 active:bg-amber-500 active:text-slate-950"
          {...holdBtn({ thrust: -1 }, { thrust: 0 })}
        >
          {lang === 'ar' ? 'كبح' : 'BRAKE'}
        </button>
      </div>
    </div>
  );
};
