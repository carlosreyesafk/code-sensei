# code-sensei 🔍

**Your senior developer in the browser.** Paste code → get an instant, expert-level review: bugs, cyclomatic complexity, code smells, and exactly how to fix each one.

🌐 **Live demo:** https://code-sensei-rlkhu3q52-carlosreyesafks-projects.vercel.app

## What it does

- 📝 **Code editor** with syntax highlighting (JavaScript, TypeScript, Python)
- ⚡ **Live analysis** — findings update as you type (debounced)
- 🐛 **Real static analysis** — 15+ detection rules written from scratch:
  - `var` vs `let`/`const`, loose `==` vs `===`, leftover `console.log`
  - TypeScript `any`, non-null assertions `!`
  - Python mutable default args, bare `except:`, `== None`
  - `eval()` usage, magic numbers, TODO leftovers, long lines
- 📊 **Cyclomatic complexity per function** with A–F grades
- 🎯 **Quality score 0–100** with breakdown (Correctness / Maintainability / Style)
- 💡 Every issue includes **severity, line number, why it matters, and how to fix it**
- 📦 **3 preloaded examples** with real bugs to try instantly

## How the analysis works

No AI API, no black box. `lib/analyzer.ts` implements a real multi-pass static analyzer:

1. **Line-level pass** — regex-based rule engine (severity-aware, language-aware)
2. **Function-level pass** — brace-matching extraction, decision-point counting for cyclomatic complexity, nesting-depth measurement
3. **File-level pass** — size heuristics
4. **Scoring** — weighted penalties per severity → 0–100 score

## Run it locally

```bash
npm install
npm run dev
# → http://localhost:3000
```

## Stack

`Next.js 14` (App Router) · `TypeScript` · `Tailwind CSS` · `react-simple-code-editor` · `Prism`

## Project structure

```
app/            → page (UI), layout, globals
components/     → CodeEditor, ScoreGauge, IssueCard, MetricsPanel
lib/analyzer.ts → the static analysis engine
lib/examples.ts → 3 preloaded buggy examples
```

---

Built by [Carlos Reyes](https://github.com/carlosreyesafk) — Software Developer · React · TypeScript · Supabase
