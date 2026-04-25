'use client';

import React, { Suspense } from 'react';
import type { ComponentSpec } from '@/lib/schemas';

// Lazy-load each renderer to keep initial bundle small
const ParticleField = React.lazy(() => import('./renderers/ParticleField'));
const Waveform = React.lazy(() => import('./renderers/Waveform'));
const ConceptDiagram = React.lazy(() => import('./renderers/ConceptDiagram'));
const Counter = React.lazy(() => import('./renderers/Counter'));
const TextReveal = React.lazy(() => import('./renderers/TextReveal'));

interface Props {
  spec: ComponentSpec;
}

export function GenUIRenderer({ spec }: Props) {
  return (
    <Suspense
      fallback={
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-1 h-12 bg-white/20 animate-pulse rounded-full" />
        </div>
      }
    >
      <ComponentSwitch spec={spec} />
    </Suspense>
  );
}

function ComponentSwitch({ spec }: Props) {
  switch (spec.component) {
    case 'particleField':
      return <ParticleField {...spec} />;
    case 'waveform':
      return <Waveform {...spec} />;
    case 'conceptDiagram':
      return <ConceptDiagram {...spec} />;
    case 'counter':
      return <Counter {...spec} />;
    case 'textReveal':
      return <TextReveal {...spec} />;
    default:
      return null;
  }
}
