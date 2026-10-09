'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CodeEditor from '@/components/CodeEditor';
import ScoreGauge from '@/components/ScoreGauge';
import IssueCard from '@/components/IssueCard';
import MetricsPanel from '@/components/MetricsPanel';
import { analyzeCode, type AnalysisResult, type Language, type Severity } from '@/lib/analyzer';
import { EXAMPLES } from '@/lib/examples';

const LANGS: { id: Language; label: string; icon: string }[] = [
  { id: 'javascript', label: 'JavaScript', icon: '🟨' },
  { id: 'typescript', label: 'TypeScript', icon: '🔷' },
  { id: 'python', label: 'Python', icon: '🐍' },
];

const SEV_ORDER: Severity[] = ['error', 'warning', 'info'];

export default function Home() {
  const [language, setLanguage] = useState<Language>('javascript');
  const [code, setCode] = useState(EXAMPLES[0].code);
  const [filter, setFilter] = useState<Severity | 'all'>('all');
  const [analyzed, setAnalyzed] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Live analysis, debounced 600ms
  const [result, setResult] = useState<AnalysisResult>(() => analyzeCode(EXAMPLES[0].code, 'javascript'));

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setResult(analyzeCode(code, language));
      setAnalyzed(true);
    }, 600);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [code, language]);

  const loadExample = useCallback((id: string) => {
    const ex = EXAMPLES.find((e) => e.id === id);
    if (!ex) return;
    setLanguage(ex.language);
    setCode(ex.code);
    setFilter('all');
  }, []);

  const switchLanguage = useCallback((lang: Language) => {
    setLanguage(lang);
    const ex = EXAMPLES.find((e) => e.language === lang);
    if (ex) setCode(ex.code);
    else setCode('');
  }, []);

  const filtered = useMemo(
    () => (filter === 'all' ? result.issues : result.issues.filter((i) => i.severity === filter)),
    [result, filter]
  );

  const counts = useMemo(() => ({
    error: result.issues.filter((i) => i.severity === 'error').length,
    warning: result.issues.filter((i) => i.severity === 'warning').length,
    info: result.issues.filter((i) => i.severity === 'info').length,
  }), [result]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-zinc-100">
      {/* ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] rounded-full bg-cyan-500/[0.07] blur-[120px]" />
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] rounded-full bg-violet-500/[0.06] blur-[120px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-4xl">🔍</span>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                code<span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">-sensei</span>
              </h1>
            </div>
            <p className="text-zinc-400 mt-2 max-w-xl">
              Paste your code. Get a senior developer&apos;s review in milliseconds — bugs, complexity, code smells, and exactly how to fix them.
            </p>
          </div>
          <div className="flex gap-2">
            {LANGS.map((l) => (
              <button
                key={l.id}
                onClick={() => switchLanguage(l.id)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
                  language === l.id
                    ? 'bg-cyan-500/15 border-cyan-400/40 text-cyan-200 shadow-[0_0_20px_rgba(34,211,238,0.15)]'
                    : 'bg-white/[0.03] border-white/10 text-zinc-400 hover:border-white/25 hover:text-zinc-200'
                }`}
              >
                {l.icon} {l.label}
              </button>
            ))}
          </div>
        </header>

        {/* examples */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-xs uppercase tracking-wider text-zinc-500 font-semibold mr-1">Try an example:</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex.id}
              onClick={() => loadExample(ex.id)}
              title={ex.description}
              className="text-xs px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-zinc-300 hover:border-cyan-400/40 hover:text-cyan-200 transition-all"
            >
              {ex.name}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* editor column */}
          <div>
            <CodeEditor code={code} language={language} onChange={setCode} />
            <div className="mt-4 grid grid-cols-3 gap-3">
              {result.categories.map((c) => (
                <div key={c.category} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                  <p className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold">{c.category}</p>
                  <p className="text-2xl font-bold mt-1 tabular-nums">
                    {c.score}
                    <span className="text-sm text-zinc-500 font-normal">/100</span>
                  </p>
                  <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${c.score}%`,
                        background: c.score >= 75 ? '#34d399' : c.score >= 50 ? '#fbbf24' : '#f87171',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <MetricsPanel functions={result.functions} />
            </div>
          </div>

          {/* results column */}
          <div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 mb-6">
              <div className="flex items-center gap-6">
                <ScoreGauge score={result.score} />
                <div className="flex-1">
                  <h2 className="text-lg font-bold">Quality score</h2>
                  <p className="text-sm text-zinc-500 mt-1">
                    {result.stats.lines} lines · {result.stats.functions} functions · avg complexity {result.stats.avgComplexity}
                  </p>
                  <div className="flex gap-2 mt-4 flex-wrap">
                    {(
                      [
                        ['all', result.issues.length, 'All'],
                        ['error', counts.error, '🔴 Critical'],
                        ['warning', counts.warning, '🟡 Warnings'],
                        ['info', counts.info, '🟢 Tips'],
                      ] as const
                    ).map(([key, n, label]) => (
                      <button
                        key={key}
                        onClick={() => setFilter(key)}
                        className={`text-xs px-3 py-1.5 rounded-full border font-semibold transition-all ${
                          filter === key
                            ? 'bg-white/10 border-white/30 text-white'
                            : 'bg-white/[0.03] border-white/10 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {label} · {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              {!analyzed && (
                <p className="text-xs text-zinc-600 mt-4">✨ Live analysis — findings update as you type.</p>
              )}
            </div>

            <div className="space-y-3">
              {filtered.length === 0 ? (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-8 text-center">
                  <p className="text-4xl mb-2">✨</p>
                  <p className="font-semibold text-emerald-200">Clean code!</p>
                  <p className="text-sm text-zinc-500 mt-1">No issues found with the current filter.</p>
                </div>
              ) : (
                filtered.map((issue) => <IssueCard key={issue.id} issue={issue} />)
              )}
            </div>
          </div>
        </div>

        <footer className="mt-12 pt-6 border-t border-white/5 text-center text-xs text-zinc-600">
          code-sensei · static analysis in your browser — your code never leaves the page · built with Next.js + TypeScript
        </footer>
      </div>
    </div>
  );
}
