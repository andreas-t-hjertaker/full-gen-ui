'use client';

import { useEffect, useRef } from 'react';
import type { ParticleFieldSpec } from '@/lib/schemas';

/**
 * GPU-accelerated particle field using PixiJS v8 ParticleContainer.
 * Renders 10k-100k particles at 60fps via WebGL/WebGPU.
 *
 * Uses vanilla PixiJS (not @pixi/react) for maximum performance —
 * no React reconciler overhead per particle.
 */
export default function ParticleFieldPixiInner({ spec }: { spec: ParticleFieldSpec }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    let destroyed = false;

    async function init() {
      const {
        Application,
        ParticleContainer,
        Particle,
        Texture,
        Graphics,
        RenderTexture,
      } = await import('pixi.js');

      if (destroyed) return;

      const app = new Application();
      await app.init({
        resizeTo: el,
        backgroundAlpha: 0,
        preference: 'webgl',
        antialias: false,
        autoDensity: true,
        resolution: window.devicePixelRatio || 1,
      });

      if (destroyed) { app.destroy(true); return; }

      el.appendChild(app.canvas);
      (app.canvas as HTMLCanvasElement).style.position = 'absolute';
      (app.canvas as HTMLCanvasElement).style.inset = '0';

      // Generate a tiny circle texture on the GPU
      const gfx = new Graphics();
      gfx.circle(4, 4, 4).fill({ color: 0xffffff, alpha: 1 });
      const texture = app.renderer.generateTexture(gfx);

      const count = spec.count ?? 3000;
      const speed = (spec.speed ?? 0.5) * 0.8;
      const color = spec.color ?? '#ffffff';
      const colorInt = parseInt(color.replace('#', ''), 16);

      // ParticleContainer v8: lightweight particles, no Sprite overhead
      const container = new ParticleContainer({
        dynamicProperties: {
          position: true,
          alpha: true,
          scale: false,
          rotation: false,
          color: false,
        },
      });
      app.stage.addChild(container);

      type P = InstanceType<typeof Particle> & { vx: number; vy: number };
      const particles: P[] = [];

      for (let i = 0; i < count; i++) {
        const p = new Particle({ texture }) as P;
        p.x = Math.random() * app.screen.width;
        p.y = Math.random() * app.screen.height;
        p.alpha = 0.1 + Math.random() * 0.7;
        p.vx = (Math.random() - 0.5) * speed;
        p.vy = (Math.random() - 0.5) * speed;
        container.addParticle(p);
        particles.push(p);
      }

      // Mouse interaction
      let mx = -9999, my = -9999;
      const onMove = (e: MouseEvent) => {
        const rect = el.getBoundingClientRect();
        mx = e.clientX - rect.left;
        my = e.clientY - rect.top;
      };
      el.addEventListener('mousemove', onMove);

      app.ticker.add((ticker) => {
        const W = app.screen.width;
        const H = app.screen.height;
        const dt = ticker.deltaTime;

        for (const p of particles) {
          // Repel from mouse
          const dx = p.x - mx;
          const dy = p.y - my;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 80) {
            const force = (80 - dist) / 80 * 0.6;
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force;
          }

          // Dampen and move
          p.vx *= 0.99;
          p.vy *= 0.99;
          p.x += p.vx * dt;
          p.y += p.vy * dt;

          // Wrap edges
          if (p.x < 0) p.x += W;
          if (p.x > W) p.x -= W;
          if (p.y < 0) p.y += H;
          if (p.y > H) p.y -= H;
        }
      });

      // Cleanup
      return () => {
        destroyed = true;
        el.removeEventListener('mousemove', onMove);
        app.destroy(true, { children: true, texture: true });
      };
    }

    const cleanup = init();
    return () => {
      destroyed = true;
      cleanup.then(fn => fn?.());
    };
  }, [spec]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      style={{ background: 'transparent' }}
    />
  );
}
