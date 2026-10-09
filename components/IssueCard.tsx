'use client';

import { useState } from 'react';
import type { Issue, Severity } from '@/lib/analyzer';

const SEV: Record<Severity, { icon: string; ring: string; bg: string; text: string; label: string }> = {
  error: {
    icon: '🔴',
    label: 'Critical',
    ring: 'border-red-500/30',
    bg: 'bg-red-500/[0.07]',
    text: 'text-red-300',
  },
  warning: {
    icon: '🟡',
    label: 'Warning',
    ring: 'border-yellow-500/30',
    bg: 'bg-yellow-500/[0.07]',
    text: 'text-yellow-300',
  },
  info: {
    icon: '🟢',
    label: 'Suggestion',
    ring: 'border-emerald-500/30',
    bg: 'bg-emerald-500/[0.07]',
    text: 'text-emerald-300',
  },
};

export default function IssueCard({ issue }: { issue: Issue }) {
  const [open, setOpen] = useState(false);
  const s = SEV[issue.severity];

  return (
    <div className={`rounded-xl border ${s.ring} ${s.bg} backdrop-blur overflow-hidden transition-all hover:border-opacity-60`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-4 py-3.5 flex items-start gap-3"
      >
        <span className="text-lg mt-0.5 shrink-0">{s.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${s.text} bg-white/5`}>
              {s.label}
            </span>
            <span className="text-[11px] text-zinc-500 font-mono">line {issue.line}</span>
          </div>
          <p className="text-sm font-semibold text-zinc-100 mt-1.5">{issue.title}</p>
        </div>
        <span className={`text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 space-y-3 border-t border-white/5">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold mb-1">Why it matters</p>
            <p className="text-sm text-zinc-300 leading-relaxed">{issue.explanation}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold mb-1">How to fix</p>
            <p className="text-sm text-zinc-300 leading-relaxed">{issue.suggestion}</p>
          </div>
        </div>
      )}
    </div>
  );
}
