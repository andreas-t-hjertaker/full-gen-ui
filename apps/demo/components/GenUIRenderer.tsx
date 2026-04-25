'use client';

import { lazy, Suspense } from 'react';
import type { ComponentSpec } from '@/lib/schemas';

// Lazy-load each renderer — only load the code that's needed
const ParticleField = lazy(() =>
  import('./renderers/ParticleField').then(m => ({ default: m.ParticleField }))
);
const ParticleFieldPixi = lazy(() =>
  import('./renderers/ParticleFieldPixi').then(m => ({ default: m.ParticleFieldPixi }))
);
const Waveform = lazy(() =>
  import('./renderers/Waveform').then(m => ({ default: m.Waveform }))
);
const ConceptDiagram = lazy(() =>
  import('./renderers/ConceptDiagram').then(m => ({ default: m.ConceptDiagram }))
);
const Counter = lazy(() =>
  import('./renderers/Counter').then(m => ({ default: m.Counter }))
);
const TextReveal = lazy(() =>
  import('./renderers/TextReveal').then(m => ({ default: m.TextReveal }))
);
const LiveGenSandbox = lazy(() =>
  import('./renderers/LiveGenSandbox').then(m => ({ default: m.LiveGenSandbox }))
);

export function GenUIRenderer({ spec }: { spec: ComponentSpec }) {
  return (
    <Suspense fallback={<div className="absolute inset-0 bg-black" />}>
      <div className="absolute inset-0">
        {spec.component === 'ParticleField' && <ParticleFieldPixi spec={spec} />}
        {spec.component === 'Waveform' && <Waveform spec={spec} />}
        {spec.component === 'ConceptDiagram' && <ConceptDiagram spec={spec} />}
        {spec.component === 'Counter' && <Counter spec={spec} />}
        {spec.component === 'TextReveal' && <TextReveal spec={spec} />}
        {spec.component === 'LiveGen' && <LiveGenSandbox spec={spec} />}
      </div>
    </Suspense>
  );
}
