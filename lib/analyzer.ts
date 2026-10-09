// code-sensei analysis engine — real static analysis, no AI API needed.
// Detects bugs, code smells, and computes cyclomatic complexity per function.

export type Language = 'javascript' | 'typescript' | 'python';
export type Severity = 'error' | 'warning' | 'info';

export interface Issue {
  id: string;
  severity: Severity;
  line: number;
  rule: string;
  title: string;
  explanation: string;
  suggestion: string;
}

export interface FunctionMetric {
  name: string;
  line: number;
  complexity: number;
  lines: number;
  params: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

export interface CategoryScore {
  category: string;
  score: number;
  max: number;
}

export interface AnalysisResult {
  score: number;
  issues: Issue[];
  functions: FunctionMetric[];
  categories: CategoryScore[];
  stats: {
    lines: number;
    functions: number;
    avgComplexity: number;
  };
}

interface Rule {
  id: string;
  severity: Severity;
  title: string;
  explanation: string;
  suggestion: string;
  test: (line: string, lineNum: number, lines: string[], lang: Language) => boolean;
  languages: Language[];
}

// ---------------------------------------------------------------------------
// Rule definitions — each is a real, explainable static-analysis check
// ---------------------------------------------------------------------------
const RULES: Rule[] = [
  {
    id: 'no-var',
    severity: 'error',
    title: 'Uses `var` instead of `let`/`const`',
    explanation:
      '`var` is function-scoped and hoisted, which causes subtle bugs when a variable is read before its declaration line or leaks out of blocks. Modern JavaScript made `let` and `const` the safe defaults.',
    suggestion: 'Replace `var` with `const` by default, and `let` only when the variable is reassigned.',
    languages: ['javascript', 'typescript'],
    test: (line) => /(^|[^a-zA-Z0-9_$])var\s+[a-zA-Z_$]/.test(line) && !line.trim().startsWith('//'),
  },
  {
    id: 'loose-equality',
    severity: 'error',
    title: 'Loose equality `==` instead of strict `===`',
    explanation:
      '`==` performs type coercion, so `0 == ""`, `0 == "0"` and `null == undefined` are all true. This is a classic source of bugs that pass tests by accident and fail in production.',
    suggestion: 'Use `===` / `!==` always. If you need coercion, do it explicitly first (e.g. `Number(x) === 0`).',
    languages: ['javascript', 'typescript'],
    test: (line) => /[^=!<>]==[^=]/.test(line) && !line.trim().startsWith('//'),
  },
  {
    id: 'console-log',
    severity: 'warning',
    title: 'Leftover `console.log`',
    explanation:
      'Debug logging left in shipped code leaks internal state to anyone opening devtools, adds noise, and slightly slows execution. It signals "unfinished" to anyone reviewing the code.',
    suggestion: 'Remove it, or replace with a proper logger behind a debug flag.',
    languages: ['javascript', 'typescript'],
    test: (line) => /console\.(log|debug|info)\s*\(/.test(line),
  },
  {
    id: 'print-debug',
    severity: 'warning',
    title: 'Leftover `print()` debug statement',
    explanation:
      'A bare `print()` in non-CLI code is almost always a debugging leftover. In production it pollutes stdout and can break parsers expecting clean output.',
    suggestion: 'Remove it or use the `logging` module with an appropriate level.',
    languages: ['python'],
    test: (line) => /^\s*print\s*\(/.test(line),
  },
  {
    id: 'any-type',
    severity: 'warning',
    title: 'Explicit `any` type defeats TypeScript',
    explanation:
      '`any` opts out of the type checker entirely — the compiler can no longer catch wrong property access, bad arguments, or null dereferences in this spot. One `any` tends to spread through the codebase.',
    suggestion: 'Use `unknown` and narrow it, or define a proper interface. If truly dynamic, isolate it and document why.',
    languages: ['typescript'],
    test: (line) => /:\s*any\b/.test(line),
  },
  {
    id: 'eval',
    severity: 'error',
    title: 'Dangerous `eval()` call',
    explanation:
      '`eval` executes arbitrary strings as code — a direct injection vector if any part of the string comes from user input. It also kills JIT optimizations around it.',
    suggestion: 'Almost never needed. Use `JSON.parse` for data, a lookup map for dynamic dispatch, or `Function` in the rare legit cases.',
    languages: ['javascript', 'typescript', 'python'],
    test: (line) => /(^|[^a-zA-Z0-9_$])eval\s*\(/.test(line),
  },
  {
    id: 'mutable-default',
    severity: 'error',
    title: 'Mutable default argument',
    explanation:
      'In Python, default arguments are evaluated once at function definition time. A `def f(x=[])` shares the SAME list across every call — appending in one call leaks into the next. Notorious bug.',
    suggestion: 'Use `None` as default and create the list inside: `def f(x=None): x = x or []`.',
    languages: ['python'],
    test: (line) => /def\s+\w+\s*\([^)]*=\s*(\[|\{|set\(\))/.test(line),
  },
  {
    id: 'bare-except',
    severity: 'warning',
    title: 'Bare `except:` swallows everything',
    explanation:
      'A bare `except:` catches `KeyboardInterrupt` and `SystemExit` too, making the program unkillable with Ctrl+C and hiding real crashes behind silence.',
    suggestion: 'Catch specific exceptions: `except ValueError:` — or at minimum `except Exception:`.',
    languages: ['python'],
    test: (line) => /^\s*except\s*:/.test(line),
  },
  {
    id: 'eq-none',
    severity: 'warning',
    title: 'Comparing with `== None` instead of `is None`',
    explanation:
      '`==` invokes custom `__eq__`, so an object can claim to equal `None` when it is not. `is None` checks identity — the only correct None check.',
    suggestion: 'Always write `x is None` / `x is not None`.',
    languages: ['python'],
    test: (line) => /==\s*None\b|\bNone\s*==/.test(line),
  },
  {
    id: 'todo-comment',
    severity: 'info',
    title: 'TODO / FIXME left in code',
    explanation:
      'A TODO is a promise to future-you that rarely gets kept. Each one is unplanned work hiding in the codebase.',
    suggestion: 'Either do it now, or move it to your issue tracker with a link in the comment.',
    languages: ['javascript', 'typescript', 'python'],
    test: (line) => /TODO|FIXME|HACK|XXX/i.test(line) && /(\/\/|#)/.test(line),
  },
  {
    id: 'magic-number',
    severity: 'info',
    title: 'Magic number',
    explanation:
      'A bare numeric literal with no name forces every reader to guess what it means and why that value. When the value needs to change, you must hunt every occurrence.',
    suggestion: 'Extract it into a named constant: `const MAX_RETRIES = 3`.',
    languages: ['javascript', 'typescript'],
    test: (line) => {
      if (/^\s*(\/\/|const|let|import|export)/.test(line)) return false;
      return /[^a-zA-Z0-9_$.](\d{2,}|0x[0-9a-fA-F]+)\b/.test(line);
    },
  },
  {
    id: 'long-line',
    severity: 'info',
    title: 'Very long line (>120 chars)',
    explanation:
      'Lines over ~120 characters force horizontal scrolling and hide logic off-screen during review. Long lines usually mean an expression is doing too much at once.',
    suggestion: 'Break it into intermediate variables with meaningful names.',
    languages: ['javascript', 'typescript', 'python'],
    test: (line) => line.length > 120,
  },
  {
    id: 'non-null-assertion',
    severity: 'warning',
    title: 'Non-null assertion `!` bypasses the checker',
    explanation:
      'The `!` operator tells TypeScript "trust me, this is not null" — silencing exactly the check that would have caught a runtime crash. It moves the failure from compile time to production.',
    suggestion: 'Narrow properly with an `if` check or optional chaining `?.`.',
    languages: ['typescript'],
    test: (line) => /[a-zA-Z0-9_)\]]!\./.test(line) || /[a-zA-Z0-9_)\]]!\[/.test(line),
  },
  {
    id: 'async-no-await',
    severity: 'warning',
    title: '`async` function with no `await`',
    explanation:
      'An async function that never awaits still returns a Promise, forcing every caller to handle asynchrony for no reason. It usually means a forgotten `await` — the actual bug.',
    suggestion: 'Remove `async` if nothing is asynchronous, or add the missing `await`.',
    languages: ['javascript', 'typescript'],
    test: () => false, // handled in function-level pass
  },
  {
    id: 'blocking-io',
    severity: 'info',
    title: 'Synchronous I/O in potentially hot code',
    explanation:
      'Sync file/network calls block the entire event loop (Node) or thread. Fine in a one-off script, fatal in a server.',
    suggestion: 'Prefer the async variants (`fs.promises`, `fetch`) in server code.',
    languages: ['javascript', 'typescript'],
    test: (line) => /readFileSync|writeFileSync|execSync/.test(line),
  },
];

// ---------------------------------------------------------------------------
// Function extraction + cyclomatic complexity
// ---------------------------------------------------------------------------
const DECISION_RE = /\b(if|else\s+if|elif|for|while|catch|case)\b|&&|\|\||\?[^?.:]/g;

function countDecisions(body: string): number {
  const m = body.match(DECISION_RE);
  return m ? m.length : 0;
}

function gradeComplexity(c: number): FunctionMetric['grade'] {
  if (c <= 5) return 'A';
  if (c <= 10) return 'B';
  if (c <= 15) return 'C';
  if (c <= 25) return 'D';
  return 'F';
}

interface RawFunction {
  name: string;
  line: number;
  body: string;
  params: number;
}

function extractFunctions(lines: string[], lang: Language): RawFunction[] {
  const out: RawFunction[] = [];
  const src = lines.join('\n');

  if (lang === 'python') {
    const re = /^([ \t]*)def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)\s*:/gm;
    let m: RegExpExecArray | null;
    const defs: { indent: number; name: string; params: string; idx: number; line: number }[] = [];
    while ((m = re.exec(src))) {
      const upto = src.slice(0, m.index).split('\n').length;
      defs.push({ indent: m[1].replace(/\t/g, '    ').length, name: m[2], params: m[3], idx: m.index, line: upto });
    }
    for (let i = 0; i < defs.length; i++) {
      const d = defs[i];
      let end = src.length;
      for (let j = i + 1; j < defs.length; j++) {
        if (defs[j].indent <= d.indent) { end = defs[j].idx; break; }
      }
      const body = src.slice(d.idx, end);
      out.push({
        name: d.name,
        line: d.line,
        body,
        params: d.params.split(',').map((s) => s.trim()).filter(Boolean).length,
      });
    }
    return out;
  }

  // JS/TS: brace-matching extraction
  const patterns: RegExp[] = [
    /(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(([^)]*)\)/g,
    /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:async\s*)?\(([^)]*)\)\s*=>/g,
    /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:async\s*)?function\s*\(([^)]*)\)/g,
  ];
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(src))) {
      const name = m[1];
      const params = m[2];
      // find opening brace after match
      let i = m.index + m[0].length;
      while (i < src.length && src[i] !== '{' && src[i] !== ';' && src[i] !== '\n') i++;
      if (src[i] !== '{') continue;
      let depth = 0;
      let j = i;
      for (; j < src.length; j++) {
        if (src[j] === '{') depth++;
        else if (src[j] === '}') { depth--; if (depth === 0) break; }
      }
      const body = src.slice(i, j + 1);
      const line = src.slice(0, m.index).split('\n').length;
      out.push({ name, line, body, params: params.split(',').map((s) => s.trim()).filter(Boolean).length });
    }
  }
  // dedupe by name+line
  const seen = new Set<string>();
  return out.filter((f) => {
    const k = f.name + ':' + f.line;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  }).sort((a, b) => a.line - b.line);
}

function maxNestingDepth(body: string, lang: Language): number {
  if (lang === 'python') {
    let max = 0;
    for (const line of body.split('\n')) {
      const indent = (line.match(/^[ \t]*/) || [''])[0].replace(/\t/g, '    ').length;
      const depth = Math.floor(indent / 4);
      if (line.trim() && depth > max) max = depth;
    }
    return max;
  }
  let depth = 0, max = 0;
  for (const ch of body) {
    if (ch === '{') { depth++; if (depth > max) max = depth; }
    else if (ch === '}') depth--;
  }
  return max;
}

// ---------------------------------------------------------------------------
// Main analysis
// ---------------------------------------------------------------------------
let issueCounter = 0;

export function analyzeCode(code: string, lang: Language): AnalysisResult {
  issueCounter = 0;
  const lines = code.split('\n');
  const issues: Issue[] = [];
  const push = (rule: Rule, lineNum: number) => {
    issues.push({
      id: `${rule.id}-${issueCounter++}`,
      severity: rule.severity,
      line: lineNum,
      rule: rule.id,
      title: rule.title,
      explanation: rule.explanation,
      suggestion: rule.suggestion,
    });
  };

  // Pass 1: line-level rules
  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    for (const rule of RULES) {
      if (!rule.languages.includes(lang)) continue;
      if (rule.id === 'async-no-await') continue; // function-level
      try {
        if (rule.test(line, lineNum, lines, lang)) push(rule, lineNum);
      } catch { /* never let a rule crash analysis */ }
    }
  });

  // Pass 2: function-level analysis
  const rawFns = extractFunctions(lines, lang);
  const functions: FunctionMetric[] = rawFns.map((f) => {
    const complexity = 1 + countDecisions(f.body);
    const fnLines = f.body.split('\n').length;
    return {
      name: f.name,
      line: f.line,
      complexity,
      lines: fnLines,
      params: f.params,
      grade: gradeComplexity(complexity),
    };
  });

  for (const f of functions) {
    // Long function
    if (f.lines > 40) {
      issues.push({
        id: `long-fn-${issueCounter++}`,
        severity: f.lines > 80 ? 'error' : 'warning',
        line: f.line,
        rule: 'long-function',
        title: `Function \`${f.name}\` is ${f.lines} lines long`,
        explanation: `Long functions mix multiple responsibilities, making them hard to test, reuse, and review. Bugs hide in long functions because no reviewer reads all ${f.lines} lines carefully.`,
        suggestion: 'Extract cohesive blocks into smaller named functions. Aim for functions that fit on one screen (~30 lines).',
      });
    }
    // High complexity
    if (f.complexity > 10) {
      issues.push({
        id: `complex-${issueCounter++}`,
        severity: f.complexity > 20 ? 'error' : 'warning',
        line: f.line,
        rule: 'high-complexity',
        title: `High cyclomatic complexity (${f.complexity}) in \`${f.name}\``,
        explanation: `Cyclomatic complexity ${f.complexity} means roughly ${f.complexity} independent paths through this function — each path needs its own test. Above 10, defect rates climb sharply.`,
        suggestion: 'Split on the biggest branches: extract each major `if`/`switch` arm into its own function, or use early returns and lookup tables.',
      });
    }
    // Deep nesting
    const raw = rawFns.find((r) => r.name === f.name && r.line === f.line);
    if (raw) {
      const depth = maxNestingDepth(raw.body, lang);
      const limit = lang === 'python' ? 3 : 4;
      if (depth > limit) {
        issues.push({
          id: `nest-${issueCounter++}`,
          severity: 'warning',
          line: f.line,
          rule: 'deep-nesting',
          title: `Deep nesting (${depth} levels) in \`${f.name}\``,
          explanation: `Each nesting level multiplies the mental state a reader must hold. Deep nesting is where "works on my machine" bugs breed — edge cases in inner branches rarely get tested.`,
          suggestion: 'Use guard clauses / early returns to flatten. Extract inner blocks into helper functions.',
        });
      }
      // async without await
      if (lang !== 'python' && /^\s*(export\s+)?async\s+function/.test(raw.body.split('\n')[0] + ' ') === false) {
        const headerLine = lines[f.line - 1] || '';
        if (/\basync\b/.test(headerLine) && !/\bawait\b/.test(raw.body)) {
          issues.push({
            id: `async-${issueCounter++}`,
            severity: 'warning',
            line: f.line,
            rule: 'async-no-await',
            title: `\`async\` function \`${f.name}\` never awaits`,
            explanation: 'An async function with no await still returns a Promise, forcing callers into async handling for nothing. Usually it means a forgotten `await` — the real bug.',
            suggestion: 'Add the missing `await`, or drop `async` if nothing is asynchronous.',
          });
        }
      }
    }
    // Too many params
    if (f.params > 4) {
      issues.push({
        id: `params-${issueCounter++}`,
        severity: 'info',
        line: f.line,
        rule: 'many-params',
        title: `\`${f.name}\` takes ${f.params} parameters`,
        explanation: 'Functions with many parameters are hard to call correctly — argument order bugs are silent. It also signals the function may be doing too much.',
        suggestion: 'Group related params into an options object / dataclass.',
      });
    }
  }

  // Pass 3: file-level checks
  const nonEmpty = lines.filter((l) => l.trim()).length;
  if (nonEmpty > 500) {
    issues.push({
      id: `bigfile-${issueCounter++}`,
      severity: 'info',
      line: 1,
      rule: 'large-file',
      title: `Large file (${nonEmpty} lines)`,
      explanation: 'Files over ~500 lines become hard to navigate and usually contain multiple responsibilities that deserve their own modules.',
      suggestion: 'Split by responsibility into separate modules.',
    });
  }

  // Sort: errors first, then by line
  const sevRank: Record<Severity, number> = { error: 0, warning: 1, info: 2 };
  issues.sort((a, b) => sevRank[a.severity] - sevRank[b.severity] || a.line - b.line);

  // Scoring
  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warnCount = issues.filter((i) => i.severity === 'warning').length;
  const infoCount = issues.filter((i) => i.severity === 'info').length;
  let score = 100 - errorCount * 12 - warnCount * 5 - infoCount * 2;
  score = Math.max(5, Math.min(100, score));

  const avgComplexity =
    functions.length > 0
      ? Math.round((functions.reduce((s, f) => s + f.complexity, 0) / functions.length) * 10) / 10
      : 0;

  const categories: CategoryScore[] = [
    { category: 'Correctness', score: Math.max(0, 100 - errorCount * 15), max: 100 },
    { category: 'Maintainability', score: Math.max(0, 100 - warnCount * 8 - Math.max(0, avgComplexity - 5) * 6), max: 100 },
    { category: 'Style', score: Math.max(0, 100 - infoCount * 6), max: 100 },
  ];
  categories.forEach((c) => { c.score = Math.round(Math.max(0, Math.min(100, c.score))); });

  return {
    score,
    issues,
    functions,
    categories,
    stats: { lines: nonEmpty, functions: functions.length, avgComplexity },
  };
}

export function scoreLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 55) return 'Fair';
  if (score >= 35) return 'Poor';
  return 'Critical';
}
