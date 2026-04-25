'use client';

import { useEffect, useRef } from 'react';
import type { z } from 'zod';
import type { WaveformSchema } from '@/lib/schemas';

type Props = z.infer<typeof WaveformSchema>;

export default function Waveform({
  frequency = 2,
  amplitude = 0.4,
  waveCount = 3,
  color = '#06b6d4',
  label,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let t = 0;

    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < waveCount; i++) {
        const phaseOffset = (i / waveCount) * Math.PI * 2;
        const alphaBase = 1 - (i / waveCount) * 0.6;
        ctx.beginPath();
        ctx.strokeStyle = `rgba(${r},${g},${b},${alphaBase})`;
        ctx.lineWidth = 2 - (i / waveCount) * 1.2;

        for (let x = 0; x <= w; x++) {
          const y =
            h / 2 +
            Math.sin((x / w) * frequency * Math.PI * 2 + t + phaseOffset) *
              (h * amplitude * (1 - i * 0.15));
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      t += 0.02;
      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [frequency, amplitude, waveCount, color]);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center">
      {label && (
        <p className="text-white/60 text-sm uppercase tracking-widest mb-6">
          {label}
        </p>
      )}
      <canvas
        ref={canvasRef}
        width={1200}
        height={400}
        className="w-full max-w-4xl"
      />
    </div>
  );
}
