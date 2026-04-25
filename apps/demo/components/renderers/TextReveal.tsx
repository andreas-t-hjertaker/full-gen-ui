'use client';

import { useEffect, useState } from 'react';
import type { z } from 'zod';
import type { TextRevealSchema } from '@/lib/schemas';
import clsx from 'clsx';

type Props = z.infer<typeof TextRevealSchema>;

const sizeMap = {
  sm: 'text-xl',
  md: 'text-3xl',
  lg: 'text-5xl',
  xl: 'text-7xl',
};

export default function TextReveal({
  text,
  highlightWords = [],
  speed = 1,
  size = 'lg',
  color = '#ffffff',
}: Props) {
  const words = text.split(' ');
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(
      () => {
        setVisibleCount((c) => {
          if (c >= words.length) {
            clearInterval(interval);
            return c;
          }
          return c + 1;
        });
      },
      120 / speed
    );
    return () => clearInterval(interval);
  }, [words.length, speed]);

  return (
    <div className="absolute inset-0 flex items-center justify-center p-12">
      <p
        className={clsx(
          'text-center font-semibold leading-tight max-w-4xl',
          sizeMap[size]
        )}
        style={{ color }}
      >
        {words.map((word, i) => {
          const isHighlighted = highlightWords.includes(word);
          return (
            <span
              key={i}
              className={clsx(
                'inline-block mr-[0.3em] transition-all duration-300',
                i < visibleCount
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-2',
                isHighlighted && 'text-yellow-400'
              )}
            >
              {word}
            </span>
          );
        })}
      </p>
    </div>
  );
}
