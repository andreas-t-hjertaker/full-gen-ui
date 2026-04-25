'use client';

import { useEffect, useRef, useState } from 'react';
import type { SortingVisualizerSpec } from './schemas';

type Op =
  | { kind: 'compare'; i: number; j: number }
  | { kind: 'swap'; i: number; j: number }
  | { kind: 'set'; i: number; v: number }
  | { kind: 'mark'; ranges: Array<[number, number]> };

/**
 * Animates classical sorting algorithms by recording every comparison/swap
 * during a synchronous run, then playing them back at a controlled tempo.
 * That separation keeps the algorithm code obviously correct, while making
 * the visual smooth.
 */
export function SortingVisualizer({ spec }: { spec: SortingVisualizerSpec }) {
  const {
    algorithm,
    size = 32,
    speedMs = 28,
    seed = 1,
    label,
  } = spec;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ariaStatus, setAriaStatus] = useState('Sorting…');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const arr = makeArray(size, seed);
    const ops: Op[] = [];
    const recorder = makeRecorder(arr, ops);

    switch (algorithm) {
      case 'bubble':
        bubble(recorder);
        break;
      case 'insertion':
        insertion(recorder);
        break;
      case 'selection':
        selection(recorder);
        break;
      case 'merge':
        merge(recorder);
        break;
      case 'quick':
        quick(recorder);
        break;
    }

    const display = arr.slice();
    const live = makeArray(size, seed);
    let opIdx = 0;
    let lastCompare: [number, number] | null = null;
    let lastSwap: [number, number] | null = null;
    let timer: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const max = size;
      const barW = w / live.length;
      for (let i = 0; i < live.length; i++) {
        const v = live[i];
        const barH = (v / max) * (h - 12);
        const x = i * barW;
        const y = h - barH;

        let color = 'rgba(255,255,255,0.55)';
        if (lastCompare && (i === lastCompare[0] || i === lastCompare[1])) {
          color = '#22d3ee';
        }
        if (lastSwap && (i === lastSwap[0] || i === lastSwap[1])) {
          color = '#f59e0b';
        }
        ctx.fillStyle = color;
        ctx.fillRect(x + 1, y, Math.max(1, barW - 2), barH);
      }
    };

    const apply = (op: Op) => {
      if (op.kind === 'compare') {
        lastCompare = [op.i, op.j];
        lastSwap = null;
      } else if (op.kind === 'swap') {
        const tmp = live[op.i];
        live[op.i] = live[op.j];
        live[op.j] = tmp;
        lastSwap = [op.i, op.j];
        lastCompare = null;
      } else if (op.kind === 'set') {
        live[op.i] = op.v;
        lastSwap = [op.i, op.i];
        lastCompare = null;
      }
    };

    draw();
    timer = setInterval(() => {
      if (cancelled) return;
      // Apply a chunk per tick to scale gracefully for fast operations.
      const chunk = Math.max(1, Math.floor(2 / Math.max(1, speedMs / 16)));
      for (let n = 0; n < chunk && opIdx < ops.length; n++, opIdx++) {
        apply(ops[opIdx]);
      }
      draw();
      if (opIdx >= ops.length) {
        if (timer) clearInterval(timer);
        timer = null;
        lastCompare = null;
        lastSwap = null;
        ctx.fillStyle = 'rgba(34, 211, 238, 0.9)';
        const barW = w / live.length;
        for (let i = 0; i < live.length; i++) {
          const v = live[i];
          const barH = (v / size) * (h - 12);
          const x = i * barW;
          const y = h - barH;
          ctx.fillRect(x + 1, y, Math.max(1, barW - 2), barH);
        }
        setAriaStatus(`Sorted ${live.length} elements with ${algorithm} sort.`);
      }
    }, speedMs);

    // Use display variable to satisfy noUnusedLocals if any
    void display;

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [algorithm, size, speedMs, seed]);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
      {label && (
        <div className="text-sm uppercase tracking-[0.25em] mb-4 text-white/60">
          {label}
        </div>
      )}
      <div
        className="text-xs uppercase tracking-[0.2em] mb-3"
        style={{ color: '#22d3ee' }}
      >
        {algorithm} sort · n = {size}
      </div>
      <div className="w-full max-w-4xl aspect-[16/8]">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
      <div className="sr-only" aria-live="polite">
        {ariaStatus}
      </div>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────

function lcg(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function makeArray(n: number, seed: number): number[] {
  const rand = lcg(seed);
  const out: number[] = [];
  for (let i = 1; i <= n; i++) out.push(i);
  // Fisher-Yates
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const t = out[i];
    out[i] = out[j];
    out[j] = t;
  }
  return out;
}

interface Recorder {
  arr: number[];
  ops: Op[];
  cmp(i: number, j: number): number;
  swap(i: number, j: number): void;
  set(i: number, v: number): void;
  read(i: number): number;
  size(): number;
}

function makeRecorder(arr: number[], ops: Op[]): Recorder {
  return {
    arr,
    ops,
    cmp(i, j) {
      ops.push({ kind: 'compare', i, j });
      return arr[i] - arr[j];
    },
    swap(i, j) {
      ops.push({ kind: 'swap', i, j });
      const t = arr[i];
      arr[i] = arr[j];
      arr[j] = t;
    },
    set(i, v) {
      ops.push({ kind: 'set', i, v });
      arr[i] = v;
    },
    read(i) {
      return arr[i];
    },
    size() {
      return arr.length;
    },
  };
}

function bubble(r: Recorder) {
  const n = r.size();
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - 1 - i; j++) {
      if (r.cmp(j, j + 1) > 0) r.swap(j, j + 1);
    }
  }
}

function insertion(r: Recorder) {
  const n = r.size();
  for (let i = 1; i < n; i++) {
    let j = i;
    while (j > 0 && r.cmp(j - 1, j) > 0) {
      r.swap(j - 1, j);
      j--;
    }
  }
}

function selection(r: Recorder) {
  const n = r.size();
  for (let i = 0; i < n - 1; i++) {
    let m = i;
    for (let j = i + 1; j < n; j++) {
      if (r.cmp(j, m) < 0) m = j;
    }
    if (m !== i) r.swap(i, m);
  }
}

function merge(r: Recorder) {
  const aux = r.arr.slice();
  const m = (lo: number, mid: number, hi: number) => {
    for (let k = lo; k <= hi; k++) aux[k] = r.read(k);
    let i = lo;
    let j = mid + 1;
    for (let k = lo; k <= hi; k++) {
      if (i > mid) {
        r.set(k, aux[j++]);
      } else if (j > hi) {
        r.set(k, aux[i++]);
      } else if (aux[j] < aux[i]) {
        r.set(k, aux[j++]);
      } else {
        r.set(k, aux[i++]);
      }
    }
  };
  const sort = (lo: number, hi: number) => {
    if (lo >= hi) return;
    const mid = (lo + hi) >> 1;
    sort(lo, mid);
    sort(mid + 1, hi);
    m(lo, mid, hi);
  };
  sort(0, r.size() - 1);
}

function quick(r: Recorder) {
  const part = (lo: number, hi: number): number => {
    let i = lo - 1;
    for (let j = lo; j < hi; j++) {
      if (r.cmp(j, hi) <= 0) {
        i++;
        if (i !== j) r.swap(i, j);
      }
    }
    if (i + 1 !== hi) r.swap(i + 1, hi);
    return i + 1;
  };
  const sort = (lo: number, hi: number) => {
    if (lo >= hi) return;
    const p = part(lo, hi);
    sort(lo, p - 1);
    sort(p + 1, hi);
  };
  sort(0, r.size() - 1);
}
