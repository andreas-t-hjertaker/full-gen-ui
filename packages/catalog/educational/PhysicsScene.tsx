'use client';

import { useEffect, useRef } from 'react';
import type { PhysicsSceneSpec } from './schemas';

interface Body {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  m: number;
  hue: number;
  trail: Array<[number, number]>;
}

/**
 * Lightweight 2D physics demo built on plain canvas + symplectic integration.
 * The presets are tuned to be self-explanatory at a glance — gravity drops,
 * a pendulum swings, waves ripple along a string, balls collide, planets orbit.
 */
export function PhysicsScene({ spec }: { spec: PhysicsSceneSpec }) {
  const {
    preset,
    gravity = 0.45,
    bodies: bodyCount = 24,
    label,
    trails = false,
    accent = '#a78bfa',
  } = spec;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

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

    const bodies: Body[] = [];

    function rand(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    if (preset === 'gravity') {
      for (let i = 0; i < bodyCount; i++) {
        bodies.push({
          x: rand(40, w - 40),
          y: rand(40, h * 0.5),
          vx: rand(-0.4, 0.4),
          vy: 0,
          r: rand(6, 14),
          m: 1,
          hue: rand(180, 280),
          trail: [],
        });
      }
    } else if (preset === 'collisions') {
      for (let i = 0; i < bodyCount; i++) {
        bodies.push({
          x: rand(40, w - 40),
          y: rand(40, h - 40),
          vx: rand(-1.6, 1.6),
          vy: rand(-1.6, 1.6),
          r: rand(8, 18),
          m: 1,
          hue: rand(180, 320),
          trail: [],
        });
      }
    } else if (preset === 'pendulum') {
      // Single pendulum from anchor at (w/2, h*0.15)
      bodies.push({
        x: w / 2 + 200,
        y: h * 0.55,
        vx: 0,
        vy: 0,
        r: 22,
        m: 1,
        hue: 200,
        trail: [],
      });
    } else if (preset === 'wave') {
      // Chain of beads forming a wave
      const N = 80;
      const baseY = h * 0.5;
      for (let i = 0; i < N; i++) {
        bodies.push({
          x: ((i + 0.5) / N) * w,
          y: baseY,
          vx: 0,
          vy: 0,
          r: 4,
          m: 1,
          hue: 220 + (i / N) * 80,
          trail: [],
        });
      }
    } else if (preset === 'orbit') {
      const cx = w / 2;
      const cy = h / 2;
      // Central "star"
      bodies.push({ x: cx, y: cy, vx: 0, vy: 0, r: 18, m: 1200, hue: 40, trail: [] });
      for (let i = 0; i < bodyCount; i++) {
        const r = rand(80, Math.min(w, h) * 0.4);
        const a = rand(0, Math.PI * 2);
        const speed = Math.sqrt((0.4 * 1200) / r); // v = sqrt(GM/r)
        bodies.push({
          x: cx + Math.cos(a) * r,
          y: cy + Math.sin(a) * r,
          vx: -Math.sin(a) * speed,
          vy: Math.cos(a) * speed,
          r: rand(3, 6),
          m: 1,
          hue: rand(180, 320),
          trail: [],
        });
      }
    }

    let t = 0;

    const step = () => {
      t++;
      // Background fade for trails
      if (trails) {
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.fillRect(0, 0, w, h);
      } else {
        ctx.clearRect(0, 0, w, h);
      }

      if (preset === 'gravity') {
        for (const b of bodies) {
          b.vy += gravity * 0.35;
          b.x += b.vx;
          b.y += b.vy;
          if (b.y + b.r > h) {
            b.y = h - b.r;
            b.vy *= -0.78;
            b.vx *= 0.98;
          }
          if (b.x - b.r < 0) {
            b.x = b.r;
            b.vx *= -0.9;
          }
          if (b.x + b.r > w) {
            b.x = w - b.r;
            b.vx *= -0.9;
          }
        }
      } else if (preset === 'collisions') {
        for (const b of bodies) {
          b.x += b.vx;
          b.y += b.vy;
          if (b.x - b.r < 0 || b.x + b.r > w) b.vx *= -1;
          if (b.y - b.r < 0 || b.y + b.r > h) b.vy *= -1;
        }
        // O(n^2) pairwise — fine for n ≤ 80
        for (let i = 0; i < bodies.length; i++) {
          for (let j = i + 1; j < bodies.length; j++) {
            const a = bodies[i];
            const c = bodies[j];
            const dx = c.x - a.x;
            const dy = c.y - a.y;
            const dist = Math.hypot(dx, dy);
            const min = a.r + c.r;
            if (dist < min && dist > 0) {
              const nx = dx / dist;
              const ny = dy / dist;
              const overlap = (min - dist) * 0.5;
              a.x -= nx * overlap;
              a.y -= ny * overlap;
              c.x += nx * overlap;
              c.y += ny * overlap;
              const dvx = c.vx - a.vx;
              const dvy = c.vy - a.vy;
              const p = dvx * nx + dvy * ny;
              if (p < 0) {
                a.vx += p * nx;
                a.vy += p * ny;
                c.vx -= p * nx;
                c.vy -= p * ny;
              }
            }
          }
        }
      } else if (preset === 'pendulum') {
        const anchor = { x: w / 2, y: h * 0.15 };
        const len = 240;
        const k = 0.0008;
        const damp = 0.999;
        const b = bodies[0];
        const dx = b.x - anchor.x;
        const dy = b.y - anchor.y;
        const dist = Math.hypot(dx, dy);
        const stretch = dist - len;
        const ax = (-stretch * dx) / dist * k;
        const ay = (-stretch * dy) / dist * k;
        b.vx += ax;
        b.vy += ay + gravity * 0.2;
        b.vx *= damp;
        b.vy *= damp;
        b.x += b.vx;
        b.y += b.vy;
        // Draw rod
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(anchor.x, anchor.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.beginPath();
        ctx.arc(anchor.x, anchor.y, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (preset === 'wave') {
        // Sinusoidal traveling wave — purely kinematic, but reads as physics.
        const baseY = h * 0.5;
        const amp = h * 0.2;
        const k = 0.025;
        const omega = 0.06;
        for (let i = 0; i < bodies.length; i++) {
          const b = bodies[i];
          b.y = baseY + Math.sin(b.x * k - t * omega) * amp;
        }
      } else if (preset === 'orbit') {
        const star = bodies[0];
        const G = 0.4;
        for (let i = 1; i < bodies.length; i++) {
          const b = bodies[i];
          const dx = star.x - b.x;
          const dy = star.y - b.y;
          const r2 = dx * dx + dy * dy + 30;
          const r = Math.sqrt(r2);
          const f = (G * star.m) / r2;
          b.vx += (dx / r) * f;
          b.vy += (dy / r) * f;
          b.x += b.vx;
          b.y += b.vy;
          if (trails) {
            b.trail.push([b.x, b.y]);
            if (b.trail.length > 80) b.trail.shift();
          }
        }
      }

      // Draw bodies
      for (const b of bodies) {
        if (trails && b.trail.length > 1) {
          ctx.strokeStyle = `hsla(${b.hue}, 80%, 65%, 0.35)`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(b.trail[0][0], b.trail[0][1]);
          for (let k = 1; k < b.trail.length; k++) {
            ctx.lineTo(b.trail[k][0], b.trail[k][1]);
          }
          ctx.stroke();
        }
        ctx.fillStyle = `hsla(${b.hue}, 80%, 65%, 1)`;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Wave: draw line through points for clarity
      if (preset === 'wave') {
        ctx.strokeStyle = accent + 'aa';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < bodies.length; i++) {
          const b = bodies[i];
          if (i === 0) ctx.moveTo(b.x, b.y);
          else ctx.lineTo(b.x, b.y);
        }
        ctx.stroke();
      }

      animRef.current = requestAnimationFrame(step);
    };

    animRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animRef.current);
  }, [preset, gravity, bodyCount, trails, accent]);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center">
      {label && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 text-sm uppercase tracking-[0.25em] text-white/60">
          {label}
        </div>
      )}
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
