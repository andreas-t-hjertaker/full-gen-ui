'use client';

import { useEffect, useState } from 'react';
import type { CodeWalkthroughSpec } from './schemas';

/**
 * Reveals code progressively, step by step, with an explanation panel beside
 * the highlighted region. Lightweight syntax highlighting (no third-party
 * dependency) keeps the bundle slim and the LLM tool surface predictable.
 */
export function CodeWalkthrough({ spec }: { spec: CodeWalkthroughSpec }) {
  const {
    language = 'typescript',
    title,
    steps,
    msPerStep = 1800,
  } = spec;

  const [active, setActive] = useState(0);

  useEffect(() => {
    setActive(0);
    const id = setInterval(() => {
      setActive((n) => (n + 1 < steps.length ? n + 1 : n));
    }, msPerStep);
    return () => clearInterval(id);
  }, [msPerStep, steps]);

  // Pre-compute cumulative line counts so we can draw a contiguous file.
  const stepLines = steps.map((s) => s.code.split('\n'));
  const totalLines = stepLines.reduce((s, l) => s + l.length, 0);
  const lineNumbers: number[] = [];
  for (let i = 1; i <= totalLines; i++) lineNumbers.push(i);

  // Active step starts at this line number (1-indexed)
  const activeStart =
    1 +
    stepLines
      .slice(0, active)
      .reduce((s, l) => s + l.length, 0);
  const activeEnd = activeStart + stepLines[active].length - 1;

  return (
    <div className="absolute inset-0 grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6 p-8">
      <div className="flex flex-col min-h-0">
        {title && (
          <div className="text-sm uppercase tracking-[0.25em] mb-3 text-white/60">
            {title}
          </div>
        )}
        <div className="flex items-center gap-2 mb-2 text-xs text-white/40 uppercase tracking-wider">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/50" />
          <span className="ml-3">{language}</span>
        </div>
        <div className="flex-1 min-h-0 overflow-auto rounded-xl bg-white/[0.03] border border-white/5">
          <pre className="p-4 text-sm leading-6 font-mono">
            {stepLines.map((lines, stepIdx) => {
              const startLine =
                1 +
                stepLines
                  .slice(0, stepIdx)
                  .reduce((s, l) => s + l.length, 0);
              const isActive = stepIdx === active;
              const isPast = stepIdx < active;
              const visible = isActive || isPast;
              return (
                <div
                  key={stepIdx}
                  style={{
                    opacity: visible ? 1 : 0.18,
                    background: isActive ? 'rgba(34,211,238,0.08)' : undefined,
                    borderLeft: isActive
                      ? '2px solid #22d3ee'
                      : '2px solid transparent',
                    transition: 'all 400ms ease-out',
                  }}
                >
                  {lines.map((ln, j) => (
                    <div key={j} className="grid grid-cols-[36px_1fr] px-2">
                      <span className="text-white/25 text-right select-none pr-3 tabular-nums">
                        {startLine + j}
                      </span>
                      <code
                        className="whitespace-pre"
                        dangerouslySetInnerHTML={{
                          __html: highlight(ln, language),
                        }}
                      />
                    </div>
                  ))}
                </div>
              );
            })}
          </pre>
        </div>
      </div>

      <aside className="flex flex-col gap-3">
        <div className="text-xs uppercase tracking-[0.25em] text-white/40">
          Step {active + 1} / {steps.length}
        </div>
        <div className="text-xs text-white/40">
          Lines {activeStart}–{activeEnd}
        </div>
        <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4 flex-1">
          <div className="text-white/85 text-sm leading-relaxed whitespace-pre-wrap">
            {steps[active]?.explain ?? ' '}
          </div>
        </div>
        <div className="flex gap-1.5">
          {steps.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Jump to step ${i + 1}`}
              onClick={() => setActive(i)}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === active ? 28 : 10,
                background:
                  i <= active ? '#22d3ee' : 'rgba(255,255,255,0.15)',
              }}
            />
          ))}
        </div>
      </aside>
    </div>
  );
}

// ─── Tiny syntax highlighter ────────────────────────────────────────────
const KEYWORDS: Record<string, string[]> = {
  javascript: 'const let var function return if else for while of in new class export import from default async await try catch throw'.split(' '),
  typescript: 'const let var function return if else for while of in new class export import from default async await try catch throw type interface enum readonly public private protected'.split(' '),
  python: 'def class return if elif else for while in import from as try except raise pass with lambda yield None True False'.split(' '),
  rust: 'fn let mut const static struct enum impl trait pub use mod return if else for while loop match in as'.split(' '),
  go: 'func var const type struct interface map chan return if else for range select case switch import package'.split(' '),
  cpp: 'int float double char bool void if else for while return class struct namespace using template typename const static public private protected'.split(' '),
  sql: 'SELECT FROM WHERE AND OR NOT INSERT UPDATE DELETE INTO VALUES SET CREATE TABLE INDEX JOIN ON LEFT RIGHT INNER OUTER GROUP BY HAVING ORDER LIMIT AS'.split(' '),
};

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    c === '&'
      ? '&amp;'
      : c === '<'
      ? '&lt;'
      : c === '>'
      ? '&gt;'
      : c === '"'
      ? '&quot;'
      : '&#39;'
  );
}

function highlight(line: string, lang: string): string {
  const kws = KEYWORDS[lang] ?? KEYWORDS.typescript;
  let s = escapeHtml(line);
  // strings
  s = s.replace(
    /(&quot;[^&]*?&quot;|&#39;[^&]*?&#39;|`[^`]*`)/g,
    '<span style="color:#a3e635">$1</span>'
  );
  // comments (line)
  s = s.replace(
    /((?:\/\/|#)[^\n]*)/g,
    '<span style="color:rgba(255,255,255,0.35)">$1</span>'
  );
  // numbers
  s = s.replace(
    /\b(\d+(?:\.\d+)?)\b/g,
    '<span style="color:#fbbf24">$1</span>'
  );
  // keywords
  for (const kw of kws) {
    const re = new RegExp(`\\b(${kw})\\b`, 'g');
    s = s.replace(re, '<span style="color:#22d3ee">$1</span>');
  }
  return s;
}
