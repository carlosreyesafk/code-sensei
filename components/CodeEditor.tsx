'use client';

import React from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import type { Language } from '@/lib/analyzer';

interface Props {
  code: string;
  language: Language;
  onChange: (code: string) => void;
}

const PRISM_LANG: Record<Language, string> = {
  javascript: 'javascript',
  typescript: 'typescript',
  python: 'python',
};

export default function CodeEditor({ code, language, onChange }: Props) {
  const highlight = React.useCallback(
    (c: string) => {
      try {
        return Prism.highlight(c, Prism.languages[PRISM_LANG[language]], PRISM_LANG[language]);
      } catch {
        return c;
      }
    },
    [language]
  );

  return (
    <div className="rounded-xl border border-white/10 bg-[#0d1117] overflow-hidden shadow-2xl">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10 bg-white/[0.02]">
        <span className="w-3 h-3 rounded-full bg-red-500/80" />
        <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
        <span className="w-3 h-3 rounded-full bg-green-500/80" />
        <span className="ml-3 text-xs text-zinc-500 font-mono">
          {language === 'python' ? 'main.py' : language === 'typescript' ? 'index.ts' : 'index.js'}
        </span>
      </div>
      <Editor
        value={code}
        onValueChange={onChange}
        highlight={highlight}
        padding={16}
        className="font-mono text-[13.5px] leading-6 min-h-[380px] max-h-[520px] overflow-auto"
        textareaClassName="focus:outline-none"
        style={{
          fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
          backgroundColor: '#0d1117',
          color: '#e6edf3',
        }}
      />
      <style jsx global>{`
        .npm__react-simple-code-editor__textarea { caret-color: #22d3ee !important; }
        .token.comment { color: #8b949e; font-style: italic; }
        .token.keyword { color: #ff7b72; }
        .token.string { color: #a5d6ff; }
        .token.number { color: #79c0ff; }
        .token.function { color: #d2a8ff; }
        .token.operator { color: #ff7b72; }
        .token.punctuation { color: #c9d1d9; }
        .token.class-name, .token.builtin { color: #ffa657; }
        .token.boolean, .token.constant { color: #79c0ff; }
        .token.parameter { color: #e6edf3; }
      `}</style>
    </div>
  );
}
