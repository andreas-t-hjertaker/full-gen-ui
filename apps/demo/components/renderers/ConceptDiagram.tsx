'use client';

import { useEffect, useRef } from 'react';
import type { ConceptDiagramSpec } from '@/lib/schemas';

interface NodePos {
  id: string;
  label: string;
  color: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export function ConceptDiagram({ spec }: { spec: ConceptDiagramSpec }) {
  const { nodes, edges, title } = spec;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const posRef = useRef<NodePos[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    posRef.current = nodes.map((n, i) => {
      const angle = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
      const radius = Math.min(w, h) * 0.3;
      return {
        id: n.id,
        label: n.label,
        color: n.color ?? '#818cf8',
        x: w / 2 + Math.cos(angle) * radius,
        y: h / 2 + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
      };
    });

    let t = 0;

    const simulate = () => {
      const pos = posRef.current;

      for (let i = 0; i < pos.length; i++) {
        for (let j = i + 1; j < pos.length; j++) {
          const dx = pos[i].x - pos[j].x;
          const dy = pos[i].y - pos[j].y;
          const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
          const force = 4000 / (dist * dist);
          pos[i].vx += (dx / dist) * force;
          pos[i].vy += (dy / dist) * force;
          pos[j].vx -= (dx / dist) * force;
          pos[j].vy -= (dy / dist) * force;
        }
      }

      for (const edge of edges) {
        const src = pos.find((p) => p.id === edge.source);
        const tgt = pos.find((p) => p.id === edge.target);
        if (!src || !tgt) continue;
        const dx = tgt.x - src.x;
        const dy = tgt.y - src.y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const force = (dist - 150) * 0.005;
        src.vx += (dx / dist) * force;
        src.vy += (dy / dist) * force;
        tgt.vx -= (dx / dist) * force;
        tgt.vy -= (dy / dist) * force;
      }

      for (const p of pos) {
        p.vx += (w / 2 - p.x) * 0.001;
        p.vy += (h / 2 - p.y) * 0.001;
        p.vx *= 0.85;
        p.vy *= 0.85;
        p.x += p.vx;
        p.y += p.vy;
      }
    };

    const draw = () => {
      simulate();
      t++;

      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(0, 0, w, h);

      const pos = posRef.current;

      for (const edge of edges) {
        const src = pos.find((p) => p.id === edge.source);
        const tgt = pos.find((p) => p.id === edge.target);
        if (!src || !tgt) continue;

        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(tgt.x, tgt.y);
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        if (edge.label) {
          ctx.fillStyle = 'rgba(255,255,255,0.4)';
          ctx.font = '11px system-ui';
          ctx.textAlign = 'center';
          ctx.fillText(
            edge.label,
            (src.x + tgt.x) / 2,
            (src.y + tgt.y) / 2 - 6
          );
        }
      }

      for (let idx = 0; idx < pos.length; idx++) {
        const p = pos[idx];
        const pulse = 1 + Math.sin(t * 0.04 + idx) * 0.08;
        const radius = 28 * pulse;

        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color + '33';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.label, p.x, p.y);
      }

      if (title) {
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '14px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(title, w / 2, 30);
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [nodes, edges, title]);

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <canvas ref={canvasRef} width={900} height={600} className="w-full h-full" />
    </div>
  );
}
