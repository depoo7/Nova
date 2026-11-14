import React from 'react';
import type { Language, PlanetId, RadarBlip } from '../types/game';

interface RadarDisplayProps {
  lang: Language;
  blips: RadarBlip[];
  shipYaw: number;
  onSelectPlanet: (planetId: PlanetId) => void;
}

export const RadarDisplay: React.FC<RadarDisplayProps> = ({
  lang,
  blips,
  shipYaw,
  onSelectPlanet,
}) => {
  const size = 136;
  const center = size / 2;
  const maxWorldRange = 1320;
  const maxRadius = 54;

  return (
    <div className="nasa-card rounded-sm p-2.5">
      <div className="mb-1 flex items-center justify-between px-1 text-[10px] text-slate-400">
        <span className="font-mono-tech font-bold tracking-wider text-slate-200">
          {lang === 'ar' ? 'رادار الكواكب' : 'SECTOR RADAR'}
        </span>
        <span className="font-mono-tech text-cyan-400">360°</span>
      </div>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="block overflow-visible"
      >
        <circle
          cx={center}
          cy={center}
          r={maxRadius}
          fill="rgba(5, 8, 17, 0.45)"
          stroke="rgba(56, 189, 248, 0.25)"
          strokeWidth={1}
        />
        <circle
          cx={center}
          cy={center}
          r={maxRadius * 0.62}
          fill="none"
          stroke="rgba(56, 189, 248, 0.14)"
          strokeDasharray="3 3"
          strokeWidth={1}
        />
        <circle
          cx={center}
          cy={center}
          r={maxRadius * 0.3}
          fill="none"
          stroke="rgba(56, 189, 248, 0.12)"
          strokeWidth={1}
        />
        <line
          x1={center - maxRadius}
          y1={center}
          x2={center + maxRadius}
          y2={center}
          stroke="rgba(148, 163, 184, 0.15)"
          strokeWidth={1}
        />
        <line
          x1={center}
          y1={center - maxRadius}
          x2={center}
          y2={center + maxRadius}
          stroke="rgba(148, 163, 184, 0.15)"
          strokeWidth={1}
        />

        {blips.map((blip) => {
          const cos = Math.cos(-shipYaw);
          const sin = Math.sin(-shipYaw);
          const rx = blip.dx * cos - blip.dz * sin;
          const rz = blip.dx * sin + blip.dz * cos;

          const dist = Math.sqrt(rx * rx + rz * rz);
          const clamped = Math.min(dist, maxWorldRange);
          const scale = dist > 0.001 ? (clamped / maxWorldRange) * (maxRadius - 5) : 0;
          const bx = center + (dist > 0.001 ? (rx / dist) * scale : 0);
          const by = center + (dist > 0.001 ? (rz / dist) * scale : 0);

          return (
            <g
              key={blip.id}
              onClick={() => onSelectPlanet(blip.id)}
              className="cursor-pointer"
            >
              <title>{blip.name[lang]}</title>
              {blip.isTarget && (
                <circle
                  cx={bx}
                  cy={by}
                  r={7}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth={1.5}
                />
              )}
              <circle
                cx={bx}
                cy={by}
                r={blip.isTarget ? 4.3 : 3.5}
                fill={blip.color}
                stroke={blip.discovered ? '#ffffff' : '#0f172a'}
                strokeWidth={1}
              />
            </g>
          );
        })}

        <polygon
          points={`${center},${center - 5.5} ${center - 4},${center + 4.5} ${center},${center + 2} ${center + 4},${center + 4.5}`}
          fill="#38bdf8"
        />
      </svg>
    </div>
  );
};
