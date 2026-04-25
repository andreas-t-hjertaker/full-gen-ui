'use client';

import dynamic from 'next/dynamic';
import type { ParticleFieldSpec } from '@/lib/schemas';

// PixiJS must be client-only (no SSR) — window/WebGL not available in Node
const ParticleFieldInner = dynamic(
  () => import('./ParticleFieldPixiInner'),
  { ssr: false, loading: () => <canvas className="w-full h-full" /> }
);

export function ParticleFieldPixi({ spec }: { spec: ParticleFieldSpec }) {
  return <ParticleFieldInner spec={spec} />;
}
