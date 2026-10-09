'use client';

import { scoreLabel } from '@/lib/analyzer';

interface Props {
  score: number;
  size?: number;
}

export default function ScoreGauge({ score, size = 180 }: Props) {
  const stroke = 14;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const frac = score / 100;

  const color =
    score >= 90 ? '#34d399' : score >= 75 ? '#a3e635' : score >= 55 ? '#fbbf24' : score >= 35 ? '#fb923c' : '#f87171';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - frac)}
          className="transition-all duration-1000 ease-out"
          style={{ filter: `drop-shadow(0 0 8px ${color}66)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-extrabold tabular-nums" style={{ color }}>
          {score}
        </span>
        <span className="text-xs uppercase tracking-widest text-zinc-500 mt-1">{scoreLabel(score)}</span>
      </div>
    </div>
  );
}
