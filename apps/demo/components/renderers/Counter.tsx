'use client';

import { useEffect, useRef, useState } from 'react';
import type { z } from 'zod';
import type { CounterSchema } from '@/lib/schemas';

type Props = z.infer<typeof CounterSchema>;

export default function Counter({
  value,
  duration = 2.5,
  prefix = '',
  suffix = '',
  label,
  color = '#f59e0b',
}: Props) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef<number | null>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = (ts - startRef.current) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [value, duration]);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
      <span
        className="text-9xl font-bold tabular-nums"
        style={{ color }}
      >
        {prefix}
        {display.toLocaleString()}
        {suffix}
      </span>
      {label && (
        <span className="text-white/50 text-xl uppercase tracking-widest">
          {label}
        </span>
      )}
    </div>
  );
}
