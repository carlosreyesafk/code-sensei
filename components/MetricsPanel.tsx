'use client';

import type { FunctionMetric } from '@/lib/analyzer';

const GRADE_COLOR: Record<FunctionMetric['grade'], string> = {
  A: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  B: 'text-lime-400 bg-lime-500/10 border-lime-500/30',
  C: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  D: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  F: 'text-red-400 bg-red-500/10 border-red-500/30',
};

export default function MetricsPanel({ functions }: { functions: FunctionMetric[] }) {
  if (functions.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 text-center text-sm text-zinc-500">
        No functions detected yet — write or paste some code.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10">
        <h3 className="text-sm font-semibold text-zinc-200">Function complexity</h3>
        <p className="text-xs text-zinc-500 mt-0.5">Cyclomatic complexity per function (1 + decision points)</p>
      </div>
      <div className="divide-y divide-white/5">
        {functions.map((f) => (
          <div key={`${f.name}-${f.line}`} className="px-4 py-3 flex items-center gap-3">
            <span className={`w-8 h-8 rounded-lg border flex items-center justify-center text-sm font-bold shrink-0 ${GRADE_COLOR[f.grade]}`}>
              {f.grade}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-mono text-zinc-100 truncate">
                {f.name}()
                <span className="text-zinc-500 text-xs ml-2">line {f.line}</span>
              </p>
              <div className="mt-1.5 h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(100, (f.complexity / 25) * 100)}%`,
                    background: f.grade === 'A' ? '#34d399' : f.grade === 'B' ? '#a3e635' : f.grade === 'C' ? '#fbbf24' : f.grade === 'D' ? '#fb923c' : '#f87171',
                  }}
                />
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-zinc-100 tabular-nums">{f.complexity}</p>
              <p className="text-[10px] text-zinc-500">{f.lines} lines</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
