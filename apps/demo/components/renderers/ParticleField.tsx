'use client';

import { useEffect, useRef } from 'react';
import { Application, extend } from '@pixi/react';
import { Container, Graphics, Ticker } from 'pixi.js';
import type { z } from 'zod';
import type { ParticleFieldSchema } from '@/lib/schemas';

extend({ Container, Graphics });

type Props = z.infer<typeof ParticleFieldSchema>;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
}

export default function ParticleField({
  count = 800,
  color = '#6366f1',
  speed = 1,
  label,
  interactive = true,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const canvas = document.createElement('canvas');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.appendChild(canvas);
    canvasRef.current = canvas;

    const ctx = canvas.getContext('2d')!;
    const w = canvas.width;
    const h = canvas.height;

    // Parse hex color to rgb
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);

    // Initialise particles
    particlesRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * speed * 0.8,
      vy: (Math.random() - 0.5) * speed * 0.8,
      size: Math.random() * 2.5 + 0.5,
      alpha: Math.random() * 0.6 + 0.2,
    }));

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    if (interactive) canvas.addEventListener('mousemove', handleMouseMove);

    const draw = () => {
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(0, 0, w, h);

      for (const p of particlesRef.current) {
        // Mouse repulsion
        if (interactive) {
          const dx = p.x - mouseRef.current.x;
          const dy = p.y - mouseRef.current.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 80) {
            p.vx += (dx / dist) * 0.4;
            p.vy += (dy / dist) * 0.4;
          }
        }

        p.x += p.vx;
        p.y += p.vy;

        // Damping
        p.vx *= 0.98;
        p.vy *= 0.98;

        // Wrap around edges
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${p.alpha})`;
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      if (interactive) canvas.removeEventListener('mousemove', handleMouseMove);
      container.removeChild(canvas);
    };
  }, [count, color, speed, interactive]);

  return (
    <div ref={containerRef} className="absolute inset-0">
      {label && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-white/80 text-2xl font-light tracking-widest uppercase">
            {label}
          </span>
        </div>
      )}
    </div>
  );
}
