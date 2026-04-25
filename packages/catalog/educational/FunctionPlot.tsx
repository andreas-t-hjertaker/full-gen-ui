'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { compileExpr } from './safeMath';
import type { FunctionPlotSpec } from './schemas';

/**
 * Plots y = f(x) over a domain, animating a "trace" along the curve so the
 * viewer's eye follows how the function unfolds — far more memorable than
 * rendering a static line.
 */
export function FunctionPlot({ spec }: { spec: FunctionPlotSpec }) {
  const {
    expression,
    domain = [-2 * Math.PI, 2 * Math.PI],
    range,
    label,
    traceMs = 1800,
    color = '#22d3ee',
  } = spec;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [error, setError] = useState<string | null>(null);

  const fn = useMemo(() => {
    try {
      return compileExpr(expression);
    } catch (e) {
      setError((e as Error).message);
      return null;
    }
  }, [expression]);

  // Sample the function once and figure out auto-range if not provided.
  const samples = useMemo(() => {
    if (!fn) return null;
    const N = 600;
    const [xMin, xMax] = domain;
    const xs = new Float32Array(N);
    const ys = new Float32Array(N);
    let yMin = Infinity;
    let yMax = -Infinity;
    for (let i = 0; i < N; i++) {
      const x = xMin + (i / (N - 1)) * (xMax - xMin);
      xs[i] = x;
      let y = NaN;
      try {
        y = fn(x);
      } catch {
        // leave NaN
      }
      ys[i] = y;
      if (Number.isFinite(y)) {
        if (y < yMin) yMin = y;
        if (y > yMax) yMax = y;
      }
    }
    if (!Number.isFinite(yMin) || !Number.isFinite(yMax)) {
      yMin = -1;
      yMax = 1;
    }
    const padding = (yMax - yMin) * 0.1 || 1;
    const finalRange = range ?? [yMin - padding, yMax + padding];
    return { xs, ys, range: finalRange as [number, number] };
  }, [fn, domain, range]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !samples) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const [xMin, xMax] = domain;
    const [yMin, yMax] = samples.range;

    const padX = 36;
    const padY = 24;
    const plotW = w - padX * 2;
    const plotH = h - padY * 2;

    const sx = (x: number) => padX + ((x - xMin) / (xMax - xMin)) * plotW;
    const sy = (y: number) => padY + (1 - (y - yMin) / (yMax - yMin)) * plotH;

    let start = 0;

    const drawAxes = () => {
      ctx.clearRect(0, 0, w, h);

      // Subtle grid
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      const gridX = 8;
      const gridY = 5;
      for (let i = 0; i <= gridX; i++) {
        const x = padX + (plotW * i) / gridX;
        ctx.beginPath();
        ctx.moveTo(x, padY);
        ctx.lineTo(x, padY + plotH);
        ctx.stroke();
      }
      for (let i = 0; i <= gridY; i++) {
        const y = padY + (plotH * i) / gridY;
        ctx.beginPath();
        ctx.moveTo(padX, y);
        ctx.lineTo(padX + plotW, y);
        ctx.stroke();
      }

      // Axes (zero lines if visible)
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 1;
      if (yMin <= 0 && yMax >= 0) {
        const y0 = sy(0);
        ctx.beginPath();
        ctx.moveTo(padX, y0);
        ctx.lineTo(padX + plotW, y0);
        ctx.stroke();
      }
      if (xMin <= 0 && xMax >= 0) {
        const x0 = sx(0);
        ctx.beginPath();
        ctx.moveTo(x0, padY);
        ctx.lineTo(x0, padY + plotH);
        ctx.stroke();
      }
    };

    const drawCurve = (progress: number) => {
      drawAxes();
      const { xs, ys } = samples;
      const N = xs.length;
      const upTo = Math.max(2, Math.floor(N * progress));

      // Glow underlay
      ctx.strokeStyle = color + '55';
      ctx.lineWidth = 5;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < upTo; i++) {
        const y = ys[i];
        if (!Number.isFinite(y)) {
          started = false;
          continue;
        }
        const px = sx(xs[i]);
        const py = sy(y);
        if (!started) {
          ctx.moveTo(px, py);
          started = true;
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();

      // Main stroke
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      started = false;
      for (let i = 0; i < upTo; i++) {
        const y = ys[i];
        if (!Number.isFinite(y)) {
          started = false;
          continue;
        }
        const px = sx(xs[i]);
        const py = sy(y);
        if (!started) {
          ctx.moveTo(px, py);
          started = true;
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();

      // Trace dot
      const last = upTo - 1;
      const ly = ys[last];
      if (Number.isFinite(ly)) {
        const lx = sx(xs[last]);
        const ly2 = sy(ly);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(lx, ly2, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = color + '33';
        ctx.beginPath();
        ctx.arc(lx, ly2, 12, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const tick = (ts: number) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      const progress = Math.min(1, elapsed / traceMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      drawCurve(eased);
      if (progress < 1) animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [samples, domain, color, traceMs]);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
      {label && (
        <div
          className="text-sm uppercase tracking-[0.25em] mb-4"
          style={{ color }}
        >
          {label}
        </div>
      )}
      <div className="w-full max-w-4xl aspect-[16/9] relative">
        {error && (
          <div className="absolute top-2 left-2 text-xs text-red-300 font-mono bg-red-900/40 px-3 py-1.5 rounded">
            {error}
          </div>
        )}
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
    </div>
  );
}
