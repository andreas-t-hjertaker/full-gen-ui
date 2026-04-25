'use client';

import { useEffect, useState } from 'react';
import type { StepThroughSpec } from './schemas';

/**
 * Animated step-by-step explanation. Each step fades in and the active step is
 * elevated; the rest are dimmed. Optional auto-advance creates a "lecture" feel.
 */
export function StepThrough({ spec }: { spec: StepThroughSpec }) {
  const {
    title,
    steps,
    autoAdvance = true,
    msPerStep = 2400,
    accent = '#f59e0b',
  } = spec;

  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!autoAdvance) return;
    const id = setInterval(() => {
      setActive((i) => (i + 1 < steps.length ? i + 1 : i));
    }, msPerStep);
    return () => clearInterval(id);
  }, [autoAdvance, msPerStep, steps.length]);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-12">
      {title && (
        <div
          className="text-sm uppercase tracking-[0.3em] mb-8"
          style={{ color: accent }}
        >
          {title}
        </div>
      )}

      <ol className="flex flex-col gap-5 max-w-2xl w-full">
        {steps.map((s, i) => {
          const state =
            i < active ? 'past' : i === active ? 'active' : 'future';
          const opacity = state === 'past' ? 0.35 : state === 'future' ? 0.15 : 1;
          const translate = state === 'future' ? 'translate-y-1' : 'translate-y-0';

          return (
            <li
              key={i}
              className={`transition-all duration-500 ease-out ${translate}`}
              style={{ opacity }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="flex-none flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold tabular-nums"
                  style={{
                    background:
                      state === 'active' ? accent : 'rgba(255,255,255,0.06)',
                    color: state === 'active' ? '#000' : 'rgba(255,255,255,0.7)',
                    border:
                      state === 'past'
                        ? `1px solid ${accent}`
                        : '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  {i + 1}
                </div>
                <div className="flex-1 pt-1">
                  <div
                    className="text-white text-lg font-semibold leading-snug"
                    style={state === 'active' ? { color: '#fff' } : undefined}
                  >
                    {s.title}
                  </div>
                  <div className="text-white/60 text-sm leading-relaxed mt-1">
                    {renderEmphasis(s.body, s.emphasis, accent)}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-10 flex gap-1.5">
        {steps.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to step ${i + 1}`}
            onClick={() => setActive(i)}
            className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: i === active ? 28 : 12,
              background: i <= active ? accent : 'rgba(255,255,255,0.15)',
            }}
          />
        ))}
      </div>
    </div>
  );
}

function renderEmphasis(body: string, emphasis: string | undefined, accent: string) {
  if (!emphasis) return body;
  const parts = body.split(emphasis);
  if (parts.length === 1) return body;
  return parts.flatMap((p, i) =>
    i < parts.length - 1
      ? [
          p,
          <span key={i} style={{ color: accent }} className="font-semibold">
            {emphasis}
          </span>,
        ]
      : [p]
  );
}
