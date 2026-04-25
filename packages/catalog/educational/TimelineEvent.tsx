'use client';

import { useEffect, useState } from 'react';
import type { TimelineEventSpec } from './schemas';

/**
 * Animated timeline. Events stagger in along an axis with their connector
 * dots growing from a baseline pulse — the eye is led from the first event
 * to the last.
 */
export function TimelineEvent({ spec }: { spec: TimelineEventSpec }) {
  const {
    title,
    events,
    orientation = 'horizontal',
    accent = '#fb7185',
  } = spec;

  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    setRevealed(0);
    const id = setInterval(() => {
      setRevealed((n) => {
        if (n >= events.length) {
          clearInterval(id);
          return n;
        }
        return n + 1;
      });
    }, 600);
    return () => clearInterval(id);
  }, [events.length]);

  if (orientation === 'vertical') {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center px-12">
        {title && (
          <div
            className="text-sm uppercase tracking-[0.25em] mb-8"
            style={{ color: accent }}
          >
            {title}
          </div>
        )}
        <ol className="relative w-full max-w-xl">
          <div
            className="absolute left-4 top-0 bottom-0 w-px"
            style={{ background: 'rgba(255,255,255,0.12)' }}
          />
          {events.map((e, i) => (
            <li
              key={i}
              className="relative pl-12 pb-8 transition-all duration-500"
              style={{
                opacity: i < revealed ? 1 : 0,
                transform: i < revealed ? 'translateX(0)' : 'translateX(-12px)',
              }}
            >
              <div
                className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full"
                style={{
                  background: accent,
                  boxShadow: `0 0 0 6px ${accent}22`,
                }}
              />
              <div
                className="text-xs uppercase tracking-[0.2em]"
                style={{ color: accent }}
              >
                {e.year}
              </div>
              <div className="text-white text-lg font-semibold mt-1">
                {e.title}
              </div>
              {e.body && (
                <div className="text-white/55 text-sm mt-1 leading-relaxed">
                  {e.body}
                </div>
              )}
            </li>
          ))}
        </ol>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center px-8">
      {title && (
        <div
          className="text-sm uppercase tracking-[0.25em] mb-12"
          style={{ color: accent }}
        >
          {title}
        </div>
      )}
      <div className="relative w-full max-w-6xl">
        <div
          className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2"
          style={{ background: 'rgba(255,255,255,0.12)' }}
        />
        <div className="grid"
          style={{ gridTemplateColumns: `repeat(${events.length}, minmax(0,1fr))` }}
        >
          {events.map((e, i) => {
            const above = i % 2 === 0;
            return (
              <div
                key={i}
                className="flex flex-col items-center transition-all duration-500"
                style={{
                  opacity: i < revealed ? 1 : 0,
                  transform: i < revealed ? 'translateY(0)' : 'translateY(12px)',
                }}
              >
                {above && <EventCard event={e} accent={accent} />}
                <div className="h-12 flex items-center">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      background: accent,
                      boxShadow: `0 0 0 6px ${accent}22`,
                    }}
                  />
                </div>
                {!above && <EventCard event={e} accent={accent} />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function EventCard({
  event,
  accent,
}: {
  event: { year: string; title: string; body?: string };
  accent: string;
}) {
  return (
    <div className="text-center max-w-[220px] px-2">
      <div
        className="text-xs uppercase tracking-[0.2em]"
        style={{ color: accent }}
      >
        {event.year}
      </div>
      <div className="text-white text-base font-semibold mt-1">
        {event.title}
      </div>
      {event.body && (
        <div className="text-white/55 text-xs mt-1 leading-relaxed">
          {event.body}
        </div>
      )}
    </div>
  );
}
